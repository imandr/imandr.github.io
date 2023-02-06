class BaseAttractor
{
    constructor(np, pmin, pmax, xmin, xmax, kick, pull, nvisible)
    {
        this.Rate = 0.02;
        this.PMin = pmin;
        this.PMax = pmax;
        if( pmin.length != pmax.length )
            throw new Error("Dimensions of pmin and pmax differ");
        this.PDim = pmin.length;

        this.XMin = xmin;
        this.XMax = xmax;
        if( xmin.length != xmax.length )
            throw new Error("Dimensions of xmin and xmax differ");
        this.XDim = xmin.length;
        this.NP = np;
        this.Kick = kick == null ? 0.01 : kick;
        this.Pull = pull == null ? 1.0 : pull;
        this.Points = [];
        this.GPU = new GPU();           //{mode:"cpu"});
        this.transform_kernel = null;
        this.NVisible = nvisible == null ? this.XDim : nvisible;
        this.normal = function()
        {
            return Math.random() + Math.random() + Math.random() + Math.random()
                + Math.random() + Math.random() + Math.random() + Math.random()
                + Math.random() + Math.random() + Math.random() + Math.random()
                - 6.0;
        }

        this.extract_visible = this.GPU.createKernel(
            function(points, n)
            {
                if( n == 2 )
                    return [points[this.thread.x][0], points[this.thread.x][1]];
                else
                    return [points[this.thread.x][0], points[this.thread.x][1], points[this.thread.x][2]];
            },
            { output: [this.NP] }
        );

        this.pull_kernel = this.GPU.createKernel(
            function(points0, points1, pull, n)
            {
                const x0 = points0[this.thread.x][0];
                const y0 = points0[this.thread.x][1];
                const x1 = points1[this.thread.x][0];
                const y1 = points1[this.thread.x][1];
                return [
                        x0 + pull * (x1 - x0),
                        y0 + pull * (y1 - y0)
                    ];
            },
            { output: [this.NP] }
        );

        this.transform = function(points, params, pull)
        {
            var points1 = this.transform_kernel(points, params);
            if( pull != 1.0 )
                points1 = this.pull_kernel(points, points1, pull, this.XDim);
            return points1;
        }

        this.random_point_uniform = function()
        {
            var p = new Float32Array(this.XDim);
            for( let i=0; i<this.XDim; i++ )
                p[i] = this.XMin[i] + Math.random()*(this.XMax[i] - this.XMin[i]);
            return p;
        }

        this.random_point = this.random_point_uniform;
        this.init_points();
    }
    
    init_points()
    {
        this.Points = [];
        for( let i = 0; i < this.NP; i++ )
            this.Points.push(this.random_point());
    }

    reset(points)
    {
        this.Points = points;
    }
    
    step(params)
    {
        if(this.Kick > 0.0)
            for(let i = 0; i < this.Points.length; i++)
                if( Math.random() < this.Kick )
                {
                    this.Points[i] = this.random_point()
                }
        var points1 = this.transform(this.Points, params, this.Pull);
        this.Points = points1;
        return this.Points;
    }
};

class DeJongAttractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 2.5;
        const R = 2.5;
        super(np, [-P, -P, -P, -P], [P, P, P, P],
            [-R, -R], [R, R], 
            options.kick == null ? 0.02 : options.kick, 
            options.pull == null ? 1.0 : options.pull,
        );

        this.transform_kernel = this.GPU.createKernel(
            function(points, params, pull)
            {
                const A = params[0];
                const B = params[1];
                const C = params[2];
                const D = params[3];
                const x = points[this.thread.x][0];
                const y = points[this.thread.x][1];
                const x1 = Math.sin(A*y) - Math.cos(B*x);
                const y1 = Math.sin(C*x) - Math.cos(D*y);
                if( pull != 1.0 )
                    return [x1, y1];
                else
                    return [x + (x1-x)*pull, y + (y1-y)*pull];
            },
            { output: [np] }
        );

        this.transform = function(points, params, pull)
        {
            var points1 = this.transform_kernel(points, params, this.Pull);
            return points1;
        }
    }
};

class TracedDeJongAttractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 2.5;
        const R = 2.5;
        super(np, [-P, -P, -P, -P], [P, P, P, P],
            [-R, -R], [R, R], 
            options.kick == null ? 0.01 : options.kick, 
            options.pull == null ? 1.0 : options.pull,
        );
        this.Trace = options.trace == null ? 0.0 : options.trace;

        this.transform_kernel = this.GPU.createKernel(
            function(points, params, trace)
            {
                const A = params[0];
                const B = params[1];
                const C = params[2];
                const D = params[3];
                const x = points[this.thread.x][0];
                const y = points[this.thread.x][1];
                const t = 1.0 - (1 - Math.pow(Math.random(), 1.0/5))*trace;
                const x1 = Math.sin(A*y) - Math.cos(B*x);
                const y1 = Math.sin(C*x) - Math.cos(D*y);
                return [ x + (x1-x)*t, y + (y1-y)*t ]; 
            },
            { output: [np] }
        );

        this.transform = function(points, params, pull)
        {
            var points1 = this.transform_kernel(points, params, this.Trace);
            return points1;
        }
    }
};

class CubicAttractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 1.2;
        const R = 3.0;
        super(np, 
            [-P, -P, -P, -P], 
            [P, P, P, P],
            [-R, -R], 
            [R, R], 
            options.kick == null ? 0.01 : options.kick, 
            options.pull == null ? 1.0 : options.pull,
        );

        function G(x)
        {
            return 3*(x*x*x-1.2*x)/(1+2*x*x);
        }

        function F(x)
        {
            return (1-3.5*x*x)/(1+2*x*x);
        }

        function H(x)
        {
            return 2.3*x/(1+2*x*x);
        }

        this.GPU.addFunction(G);
        this.GPU.addFunction(F);
        this.GPU.addFunction(H);

        this.transform_kernel = this.GPU.createKernel(
            function(points, params)
            {
                const A = params[0];
                const B = params[1];
                const C = params[2];
                const D = params[3];
                const x = points[this.thread.x][0];
                const y = points[this.thread.x][1];
                return [
                    F(A*x) + H(B*y), 
                    F(C*y) + H(D*x)
                ];
            },
            { output: [this.NP] }
        );
    }
};

class TanhAttractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 1.2;
        const R = 3.0;
        super(np, 
            [-P, -P, 0.2, 0.2], 
            [P, P, P, P],
            [-R, -R], 
            [R, R], 
            options.kick == null ? 0.01 : options.kick, 
            options.pull == null ? 1.0 : options.pull,
        );

        function F(x)
        {
            return Math.tanh(x);
        }

        function G(x)
        {
            return Math.tanh(2*x*x-1);
        }

        function H(x)
        {
            return Math.tanh(x*x*x - 1.5*x + 0.5*x*x);
        }

        this.GPU.addFunction(G);
        this.GPU.addFunction(F);
        this.GPU.addFunction(H);
        this.transform_kernel = this.GPU.createKernel(
            function(points, params)
            {
                const A = params[0];
                const B = params[1];
                const C = params[2];
                const D = params[3];
                const E = params[4];
                const F = params[5];
                const x = points[this.thread.x][0];
                const y = points[this.thread.x][1];
                return [
                        A*this.H(x) + B*this.G(y) + E*this.F(y),
                        C*this.H(y) + D*this.G(x) + F*this.F(x)
                    ];
            },
            { output: [this.NP] }
        );
    }
};

class QExpAttractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 2.2;
        const R = 3.0;
        super(np, 
            [-P, -P, 0.2, 0.2], 
            [P, P, P, P],
            [-R, -R], 
            [R, R], 
            options.kick == null ? 0.01 : options.kick, 
            options.pull == null ? 1.0 : options.pull,
        );

        function G(x)
        {
            return 3*(x*x*x-1.2*x)/Math.cosh(2*x);
        }

        function F(x)
        {
            return (1-3.5*x*x)/Math.cosh(2*x);
        }

        function H(x)
        {
            return 2.3*x/Math.cosh(2*x);
        }

        this.GPU.addFunction(G);
        this.GPU.addFunction(F);
        this.GPU.addFunction(H);
        this.transform_kernel = this.GPU.createKernel(
            function(points, params)
            {
                const A = params[0];
                const B = params[1];
                const C = params[2];
                const D = params[3];
                const x = points[this.thread.x][0];
                const y = points[this.thread.x][1];
                return [
                        F(A*x) + H(B*y),
                        F(C*y) + H(D*x)
                    ];
            },
            { output: [this.NP] }
        );
    }
};

class HyperAttractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 3.0;
        const R = 3.5;
        super(np, 
            [-P, 0.3, 0.3, -P, 0.3, 0.3], 
            [P, P, P, P, P, P],
            [-R, -R], 
            [R, R], 
            options.kick == null ? 0.01 : options.kick, 
            options.pull == null ? 1.0 : options.pull,
        );

        function G(x)
        {
            return 2.0/Math.cosh(2*x)-1;
        }

        function F(x)
        {
            return Math.tanh(2*x)/Math.cosh(2*x);
        }

        function H(x)
        {
            return (2.0/Math.cosh(10*x)-1)/Math.cosh(x);
        }

        this.GPU.addFunction(G);
        this.GPU.addFunction(F);
        this.GPU.addFunction(H);
        this.transform_kernel = this.GPU.createKernel(
            function(points, params)
            {
                const A = params[0];
                const B = params[1];
                const C = params[2];
                const P = params[3];
                const Q = params[4];
                const R = params[5];
                const x = points[this.thread.x][0];
                const y = points[this.thread.x][1];
                return [
                        G(A*x) + B*F(C*y),
                        G(P*y) + Q*F(R*x)
                    ];
            },
            { output: [this.NP] }
        );
    }
};

var Attractors = {
    DeJongAttractor, CubicAttractor, TanhAttractor, QExpAttractor, HyperAttractor, TracedDeJongAttractor,
    all: [DeJongAttractor, CubicAttractor, TanhAttractor, QExpAttractor, HyperAttractor]
}
