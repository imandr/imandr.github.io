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
        this.GPU = new GPU();           //{mode:"cpu"});
        //this.GPU = new GPU({mode:"dev"});
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

class DeJongModAttractor extends BaseAttractor
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
                const x1 = Math.sin(A*y)/Math.cosh(y) - Math.cos(B*x)/Math.cosh(3*x);
                const y1 = Math.sin(C*x)/Math.cosh(x) - Math.cos(D*y)/Math.cosh(3*y);
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

class QExpAttractor__ extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 1.0;
        const R = 3.0;
        
        var pmin = [], pmax = [];
        const nparams = 16;
        for( let i = 0; i < nparams; i++ )
        {
            pmin.push(-P);
            pmax.push(P);
        }
        
        super(np, pmin, pmax, [-R, -R], 
            [R, R], options);

        function F(x, a, b)
        {
            return (a*x*x + 7*b*x)/Math.cosh(2*x);
        }

        function G(x, a, b)
        {
            return (7*a*x + b)/Math.cosh(2*x);
        }

        this.GPU.addFunction(F);
        this.GPU.addFunction(G);

        this.transform_with_pull_kernel = this.GPU.createKernel(
            function(points, params, pull, blur)
            {
                const A = params[0];
                const B = params[1];
                const C = params[2];
                const D = params[3];
                const P = params[4];
                const Q = params[5];
                const R = params[6];
                const S = params[7];
                const x = points[this.thread.x][0];
                const y = points[this.thread.x][1];
                const x1 = F(x, A, B) + G(y, P, Q);
                const y1 = F(y, C, D) + G(x, R, S);
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

class MandelbrotAttractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 1.0;
        const R = 3.5;
        super(np, 
            //[0.3, 0.0], 
            //[0.8, 0.5],
            [-1.0, -1.0], 
            [1.5, 1.5],
            [-1, -1], 
            [1, 1], options);

            this.transform_with_pull_kernel = this.GPU.createKernel(
                function(points, params, pull, blur)
                {
                    const a = params[0];
                    const b = params[1];
                    const x = points[this.thread.x][0];
                    const y = points[this.thread.x][1];

                    const x_ = (x+a)*(x+a) - (y+b)*(y+b);
                    const y_ = 2*(x+a)*(y+b);
    				const r = Math.cosh(Math.sqrt(x_*x_ + y_*y_)/1.5);
    				const x1 = x_/r;
    				const y1 = y_/r;
                
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
            
            this.random_point = function()
            {
                var point = this.random_point_uniform();
                point[0] /= 2;
                point[1] /= 2;
                return point;
            }
			
            this.random_point = function()
            {
				const a = Math.random() * Math.random() * Math.random() * 0.2 * 3.1415;
				return [Math.sin(a), Math.cos(a)];
            }

    }
};

class Inverse2Attractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 1.0;
        const R = 3.5;
        super(np, 
            [-1.5, -1.5, -0.5, -0.5, 0.1, 0.1, 0.0, 0.0], 
            [ 1.5,  1.5,  0.5,  0.5, 0.7, 0.7, 3.14, 3.14], 
            [-R, -R], 
            [R, R], options);
            
            function Invert(x, y, xc, yc, rc, d)
            {
                const dx = x - xc;
                const dy = y - yc;
                const r = Math.sqrt(dx*dx + dy*dy) + 0.0001;
                const t = Math.atan2(dy, dx);
                const t1 = t + d*r*r*r/rc/rc/rc;
                const r1 = rc*rc/r;
                const r2 = r1;  ///Math.cosh(r1/20);
                const x1 = xc + r2 * Math.cos(t1);
                const y1 = yc + r2 * Math.sin(t1);
                return [x1, y1];
            }

            this.GPU.addFunction(Invert);

            this.transform_with_pull_kernel = this.GPU.createKernel(
                function(points, params, pull, blur)
                {
                    const xa = params[0];
                    const ya = params[1];
                    const xb = params[2];
                    const yb = params[3];
                    const ra = params[4];
                    const rb = params[5];
                    const da = params[6];
                    const db = params[7];

                    const x = points[this.thread.x][0];
                    const y = points[this.thread.x][1];

                    const p = Invert(x, y, xa, ya, ra, da);
                    const p2 = Invert(p[0], p[1], xb, yb, rb, db);

                    if( pull == 1 && blur == 0 )
                        return p2;
                    else
                    {
                        const r = Math.pow(Math.random(), 3.0);
                        const t = pull * (1.0 - r*blur);
                        return [x + (p2[0]-x)*t, y + (p2[1]-y)*t];
                    }
                },
                { output: [this.NP] }
            );
            
            this.random_point = function()
            {
                var point = this.random_point_uniform();
                point[0] *= 2;
                point[1] *= 2;
                return point;
            }

    }
};

class ECAttractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 1.0;
        const R = 3.5;
        super(np, 
            [0.1, 0.1, 0.1, 0.1], 
            [5.9, 5.9, 5.9, 5.9], 
            [-R, -R], 
            [R, R], options);
            
            function Y(x, a, b)
            {
                const y2 = x*x*x + a*x + b;
                if( y2 < 0 )
                    return 0.0;
                return Math.sqrt(y2);
            }
            
            function Add(x1, x2, a, b)
            {
                const y1 = Y(x1, a, b);
                const y2 = Y(x2, a, b);
                if( x1 == x2 )
                {
                    const l = (3*x1*x1+a)/(2*y1);
                    return l*l - 2*x1;
                }
                else
                {
                    const l = (y2-y1)/(x2-x1);
                    return l*l - x1 - x2;
                }
            }

            this.GPU.addFunction(Y);
            this.GPU.addFunction(Add);

            this.transform_with_pull_kernel = this.GPU.createKernel(
                function(points, params, pull, blur)
                {
                    const xa = params[0];
                    const xb = params[1];
                    const ya = params[2];
                    const yb = params[3];

                    const x = points[this.thread.x][0];
                    const y = points[this.thread.x][1];

                    const xt = Add(x, y, xa, xb);
                    const y1 = Add(y, xt, ya, yb);
                    const x1 = Add(x, y1, xa, xb);

                    const p2 = [x1/Math.cosh(x1), y1/Math.cosh(y1)];

                    if( pull == 1 && blur == 0 )
                        return p2;
                    else
                    {
                        const r = Math.pow(Math.random(), 3.0);
                        const t = pull * (1.0 - r*blur);
                        return [x + (p2[0]-x)*t, y + (p2[1]-y)*t];
                    }
                },
                { output: [this.NP] }
            );
            
            this.random_point = function()
            {
                return [Math.random(), Math.random()];
            }

    }
};

var Attractors = {
    DeJongAttractor, CubicAttractor, TanhAttractor, QExpAttractor, HyperAttractor, DeJongModAttractor, MandelbrotAttractor, ECAttractor,
    all: [DeJongAttractor, CubicAttractor, TanhAttractor, QExpAttractor, HyperAttractor, MandelbrotAttractor]
}
