class BaseAttractor
{
    constructor(np, pmin, pmax, xmin, xmax, options)
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
        if( options == null )
            options = {}
        this.Kick = options.kick == null ? 0.01 : options.kick;
        this.Pull = options.pull == null ? 1.0 : options.pull;
        this.Blur = options.blur == null ? 0.0 : options.blur;
        this.Points = [];
        this.GPU = new GPU();       //{mode:"cpu"});
        this.GPU = new GPU({mode:"cpu"});
        this.transform_kernel = null;
        this.transform_with_pull_kernel = null;

        this.normal = function()
        {
            return Math.random() + Math.random() + Math.random() + Math.random()
                + Math.random() + Math.random() + Math.random() + Math.random()
                + Math.random() + Math.random() + Math.random() + Math.random()
                - 6.0;
        }

        this.transform = function(points, params, pull, blur)
        {
            if( this.transform_with_pull_kernel != null )
                return this.transform_with_pull_kernel(points, params, pull, blur);
            var points1 = this.transform_kernel(points, params);
            if( pull != 1.0 || blur != 0.0 )
                points1 = this.pull_kernel(points, points1, pull, blur);
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
        var points1 = this.transform(this.Points, params, this.Pull, this.Blur);
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
            [-R, -R], [R, R], options);

        this.transform_with_pull_kernel = this.GPU.createKernel(
            function(points, params, pull, blur)
            {
                //debugger;
                const A = params[0];
                const B = params[1];
                const C = params[2];
                const D = params[3];
                const x = points[this.thread.x][0];
                const y = points[this.thread.x][1];
                const x1 = Math.sin(A*y) - Math.cos(B*x);
                const y1 = Math.sin(C*x) - Math.cos(D*y);
                if( pull == 1 && blur == 0 )
                    return [x1, y1];
                else
                {
                    const r = Math.pow(Math.random(), 3.0);
                    const t = pull * (1.0 - r*blur);
                    return [x + (x1-x)*t, y + (y1-y)*t];
                }
            },
            { output: [np] }
        );
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
            [R, R], options
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

        this.transform_with_pull_kernel = this.GPU.createKernel(
            function(points, params, pull, blur)
            {
                const A = params[0];
                const B = params[1];
                const C = params[2];
                const D = params[3];
                const x = points[this.thread.x][0];
                const y = points[this.thread.x][1];
                const x1 = F(A*x) + H(B*y);
                const y1 = F(C*y) + H(D*x);
                if( pull == 1 && blur == 0 )
                    return [x1, y1];
                else
                {
                    const r = Math.pow(Math.random(), 3.0);
                    const t = pull * (1.0 - r*blur);
                    return [x + (x1-x)*t, y + (y1-y)*t];
                }
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
            [R, R], options
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
        this.transform_with_pull_kernel = this.GPU.createKernel(
            function(points, params, pull, blur)
            {
                const A = params[0];
                const B = params[1];
                const C = params[2];
                const D = params[3];
                //const E = params[4];
                //const F = params[5];
                const x = points[this.thread.x][0];
                const y = points[this.thread.x][1];
                const x1 = A*H(x) + B*G(y); // + E*F(y);
                const y1 = C*H(y) + D*G(x); // + F*F(x);
                if( pull == 1 && blur == 0 )
                    return [x1, y1];
                else
                {
                    const r = Math.pow(Math.random(), 3.0);
                    const t = pull * (1.0 - r*blur);
                    return [x + (x1-x)*t, y + (y1-y)*t];
                }
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
            [R, R], options);

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

        this.transform_with_pull_kernel = this.GPU.createKernel(
            function(points, params, pull, blur)
            {
                const A = params[0];
                const B = params[1];
                const C = params[2];
                const D = params[3];
                const x = points[this.thread.x][0];
                const y = points[this.thread.x][1];
                const x1 = F(A*x) + H(B*y);
                const y1 = F(C*y) + H(D*x);
                if( pull == 1 && blur == 0 )
                    return [x1, y1];
                else
                {
                    const r = Math.pow(Math.random(), 3.0);
                    const t = pull * (1.0 - r*blur);
                    return [x + (x1-x)*t, y + (y1-y)*t];
                }
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
            [R, R], options);

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

        this.transform_with_pull_kernel = this.GPU.createKernel(
            function(points, params, pull, blur)
            {
                const A = params[0];
                const B = params[1];
                const C = params[2];
                const P = params[3];
                const Q = params[4];
                const R = params[5];
                const x = points[this.thread.x][0];
                const y = points[this.thread.x][1];
                const x1 = G(A*x) + B*F(C*y);
                const y1 = G(P*y) + Q*F(R*x);
                if( pull == 1 && blur == 0 )
                    return [x1, y1];
                else
                {
                    const r = Math.pow(Math.random(), 3.0);
                    const t = pull * (1.0 - r*blur);
                    return [x + (x1-x)*t, y + (y1-y)*t];
                }
            },
            { output: [this.NP] }
        );

    }
};

var Attractors = {
    DeJongAttractor, CubicAttractor, TanhAttractor, QExpAttractor, HyperAttractor,
    all: [DeJongAttractor, CubicAttractor, TanhAttractor, QExpAttractor, HyperAttractor]
}
