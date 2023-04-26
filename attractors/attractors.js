class BaseAttractor
{
    constructor(np, pmin, pmax, xmin, xmax, options, F, functions)
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
        
        this.LyapunovDistance = Math.min(Math.abs(xmin[0]-xmax[0]), Math.abs(xmin[1]-xmax[1]))/1000.0;
        this.NLyapunov = 200;

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

        const normal = function()
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

        if( functions != null )
            for( let f of functions )
                this.GPU.addFunction(f);
        this.GPU.addFunction(F);
        //this.GPU.addFunction(normal);
        this.F = F;

        this.transform_with_pull_kernel = this.GPU.createKernel(
            function(points, params, pull, blur)
            {
                const xy1 = Z(points[this.thread.x][0], points[this.thread.x][1], params);
                
                if( pull == 1 && blur == 0 )
                    return xy1;
                else
                {
                    const x = points[this.thread.x][0];
                    const y = points[this.thread.x][1];
                    const x1 = xy1[0], y1 = xy1[1];
                    //const r = Math.pow(Math.random(), 3.0);
                    const r = Math.random() + Math.random() + Math.random() + Math.random()
                            + Math.random() + Math.random() + Math.random() + Math.random()
                            + Math.random() + Math.random() + Math.random() + Math.random()
                            - 6.0;
                    const t = pull * (1.0 - r*blur);
                    return [x + (x1-x)*t, y + (y1-y)*t];
                }
            },
            { output: [this.NP] }
        );

        this.lyapunov_logs = this.GPU.createKernel(
            function(pairs, params)
            {
                const x1 = pairs[this.thread.x][0],
                    y1 = pairs[this.thread.x][1],
                    x2 = pairs[this.thread.x][2],
                    y2 = pairs[this.thread.x][3];
                const d1 = (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);
                if( d1 == 0 )
                    return 1.0;
                const xy1 = Z(x1, y1, params);
                const xy2 = Z(x2, y2, params);
                const x3 = xy1[0], y3 = xy1[1], x4 = xy2[0], y4 = xy2[1];
                const d2 = (x3-x4)*(x3-x4) + (y3-y4)*(y3-y4);
                if( d2 == 0 )
                    return 1.0;
                return Math.log(d2/d1)/2;
            },
            { output: [this.NLyapunov] }
        );

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
                    var r = this.random_point();
                    //r = this.F(r[0], r[1], params);
                    this.Points[i] = this.F(r[0], r[1], params);
                }
        const t0 = Date.now();
        var points1 = this.transform(this.Points, params, this.Pull, this.Blur);
        const dt = Date.now() - t0;
        this.Points = points1;
        return this.Points;
    }

    lyapunov_gpu(params, d)
    {
        if( d == null )     d = this.LyapunovDistance;
        const np = this.NLyapunov;
        var points = [];
        for( let i = 0; i < np; i++ )
        {
            const p = this.random_point();
            points.push([p[0], p[1], p[0] + Math.random()*d, p[1] + Math.random()*d]);
        }
        const lambdas = this.lyapunov_logs(points, params);
        var sum = 0;
        for( let l of lambdas )
            sum += l;
        return sum/np;
    }
    
    lyapunov(params, d)
    {
        if( d == null )     d = this.LyapunovDistance;
        const np = this.NLyapunov;
        var sumlog = 0.0;
        for( let i = 0; i < np; i++ )
        {
            var p0;
            if( true )
            {
                const j = Math.floor(Math.random()*this.NP);
                p0 = this.Points[j];
            }
            else
                p0 = this.random_point();
            
            const p1 = [p0[0] + Math.random()*d, p0[1] + Math.random()*d];
            const z0 = this.F(p0[0], p0[1], params);
            const z1 = this.F(p1[0], p1[1], params);
            const d0 = (p0[0]-p1[0])*(p0[0]-p1[0]) + (p0[1]-p1[1])*(p0[1]-p1[1]);
            const d1 = (z0[0]-z1[0])*(z0[0]-z1[0]) + (z0[1]-z1[1])*(z0[1]-z1[1]);
            sumlog += Math.log(d1/d0);
        }
        return sumlog/2/np;
    }
};

class DeJongAttractor extends BaseAttractor
{
    constructor(np, options)
    {
        function Z(x, y, params)
        {
            const A = params[0];
            const B = params[1];
            const C = params[2];
            const D = params[3];
            const x1 = Math.sin(A*y) - Math.cos(B*x);
            const y1 = Math.sin(C*x) - Math.cos(D*y);
            return [x1, y1];
        }

        const P = 2.5;
        const R = 2.5;
        super(np, [-P, -P, -P, -P], [P, P, P, P],
            [-R, -R], [R, R], options, Z);
    }
};

class CubicAttractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 1.2;
        const R = 3.0;

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

        function Z(x, y, params)
        {
            const A = params[0];
            const B = params[1];
            const C = params[2];
            const D = params[3];
            const x1 = F(A*x) + H(B*y);
            const y1 = F(C*y) + H(D*x);
            return [x1, y1];
        }

        super(np, 
            [-P, -P, -P, -P], 
            [P, P, P, P],
            [-R, -R], 
            [R, R], options, Z, [F,H]
        );
    };
}

class TanhAttractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 1.2;
        const R = 3.0;

        function G(x)
        {
            return Math.tanh(2*x*x-1);
        }

        function H(x)
        {
            return Math.tanh(x*x*x - 1.5*x + 0.5*x*x);
        }

        function Z(x, y, params)
        {
            const A = params[0];
            const B = params[1];
            const C = params[2];
            const D = params[3];
            const E = params[4];
            const F = params[5];
            const x1 = A*H(x) + B*G(y); //+ E*G(x); // + E*F(y);
            const y1 = C*H(y) + D*G(x); //+ F*G(y); 
            return [x1, y1];
        }

        super(np, 
            [-P, -P, -P, -P, -1.5, -1.5], 
            [P, P, P, P, 1.5, 1.5],
            [-R, -R], 
            [R, R], options, Z, [H,G]
        );
    }
};

class QExpAttractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 2.2;
        const R = 3.0;

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

        function Z(x, y, params)
        {
            const A = params[0];
            const B = params[1];
            const C = params[2];
            const D = params[3];
            const x1 = F(A*x) + H(B*y);
            const y1 = F(C*y) + H(D*x);
            return [x1, y1];
        }
        
        super(np, 
            [-P, -P, 0.2, 0.2], 
            [P, P, P, P],
            [-R, -R], 
            [R, R], options, Z, [F, H]);
    }
};

class HyperAttractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 5.0;
        const R = 3.5;

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

        function Z(x, y, params)
        {
            const A = params[0];
            const B = params[1];
            const C = params[2];
            const P = params[3];
            const Q = params[4];
            const R = params[5];
            const x1 = G(A*x) + B*F(C*y);
            const y1 = G(P*y) + Q*F(R*x);
            return [x1, y1];
        }
        super(np, 
            [-P, 0.3, 0.3, -P, 0.3, 0.7], 
            [P, P, P, P, P, P],
            [-R, -R], 
            [R, R], options, Z, [G,F]);
    }
};

class IkedaAttractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 3.0;
        const R = 5.0;
        
        function Z(x, y, p)
        {
            const Ai = p[0];
            const Ar = p[1];
            const B = p[2];
            const K = p[3];
            const P = p[4];
            const phi = Math.atan2(y, x);
            const r2 = x*x + y*y;
            const r = Math.sqrt(r2);
            const phi1 = phi + K - P/(1+r2);
            const r1 = r*B;
            const x1 = Ar + r1*Math.cos(phi1);
            const y1 = Ai + r1*Math.sin(phi1);
            return [x1, y1];
        }
        
        super(np, 
            [-1.5, -1.5, 0.7, 0.1, 5], 
            [1.5, 1.5,   1.0, 1.0, 8],
            [-R, -R], 
            [R, R], options, Z);
        
        this.random_point = function()
            {
    			const a = Math.random() * Math.random() * Math.random() * 2.0 * 3.1415;
    			return [Math.sin(a), Math.cos(a)];
            }

    }
};

class MandelbrotAttractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 1.0;
        const R = 3.5;
        
        function at2(y, x)
        {
            const pi = 3.141592653589793;
            if( x == 0 && y == 0 )
                return 0.0;
            else if( x == 0 )
                return y > 0 ? pi/2 : pi*3/2;
            else
            {
                const a = Math.atan(y/x);
                return x < 0 ? a + pi : a;
            }
        }

        function Z(x, y, params)
        {
            const a = params[0];
            const b = params[1];
            const rot = params[2];
            const dphi = params[3];

            const x_ = (x+a)*(x+a) - (y+b)*(y+b);
            const y_ = 2*(x+a)*(y+b);
            const r_ = Math.sqrt(x_*x_ + y_*y_) + 0.001;
            const phi = at2(y_, x_) + rot*(5/r_ - 1);
			const r = r_/Math.cosh(r_*0.5);
            const x1 = r * Math.cos(phi);
            const y1 = r * Math.sin(phi);
			const x2 = x_/r_*r;
			const y2 = y_/r_*r;
            return [x1, y1];
        }
        
        super(np, 
            //[0.3, 0.0], 
            //[0.8, 0.5],
            [0.1, 0.1, -0.1, 2], 
            [1.5, 1.5, 0.1, 2],
            [-1, -1], 
            [1, 1], options, Z, [at2]);
            
        this.random_point = function()
        {
            var point = this.random_point_uniform();
            point[0] /= 2;
            point[1] /= 2;
            return point;
        }
		
        this.random_point = function()
        {
			const a = Math.random() * Math.random() * Math.random() * 2.0 * 3.1415;
			return [Math.sin(a), Math.cos(a)];
        }

    }
};

var Attractors = {
    DeJongAttractor, CubicAttractor, TanhAttractor, QExpAttractor, HyperAttractor, DeJongAttractor, MandelbrotAttractor,
    all: [DeJongAttractor, CubicAttractor, TanhAttractor, QExpAttractor, HyperAttractor, MandelbrotAttractor]
}
