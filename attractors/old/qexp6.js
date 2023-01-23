//
// Unified attractor interface:
//
//      constructor:
//              X()             - does not initalize, use init() later
//              X(n)            - randomly generate n points
//              X(points)       - initialize with given points
//
//      PMin, PMax -> parameter min and max values, attribute
//      XMin, XMax -> field range, vectors, attribute, may be approximate, use as suggestion
//      PDim -> number of parameters, attribute
//      XDim -> field dimension, e.g. 2, 3, attribute
//      init(points) - init with set of points - must match the dimension
//      init(n)      - init with n random points
//      step(params) -> new points
//      points() -> current points
//

function QubicExp(arg)
{
    this.Rate = 0.02;
    this.PMin = [-0.8, -0.8, -0.8, -0.8, -0.8, -0.8];
    this.PMax = [0.8,  0.8, 0.8, 0.8, 0.8, 0.8];
    this.XMin = [-1.0, -1.0];
    this.XMin = [1.0, 1.0];
    this.XDim = 2;
    this.PDim = 6;
    this.Points = null;

    this.normal = function()
    {
        return Math.random() + Math.random() + Math.random() + Math.random()
            + Math.random() + Math.random() + Math.random() + Math.random()
            + Math.random() + Math.random() + Math.random() + Math.random()
            - 6.0;
    }

    this.random_point = function()
    {
        return [this.normal(), this.normal()];
        //return [Math.random()*2-1, Math.random()*2-1];
        if( Math.random() < 0.1 )
            return [0.0, Math.random()*2-1];
        else
            return [Math.random()*2-1, 0.0];
    }

    this.init = function(arg)
    {
        if( arg == null )
            return;
        else if( arg.isArray )
            this.Points = arg.slice();
        else
        {
                this.Points = [];
                for( let i = 0; i < arg; i++ )
                    this.Points.push(this.random_point());
        }
    }

    if( arg == null )
        this.Points = null;
    else
        this.init(arg);
    
    points = function()
    {
        return this.Points;
    }
    
    this.P = function(x)
    {
        return Math.exp(-x*x);
    }
 
    this.G = function(x)
    {
        return 3*(x*x*x-1.2*x)*Math.exp(-x*x);
    }
    
    this.F = function(x)
    {
        return (1-3.5*x*x)*Math.exp(-x*x);
    }
    
    this.H = function(x)
    {
        return 2.3*x*Math.exp(-x*x);
    }
    
    this.qubic_exp = function(points, params)
    {
        var out = [];
        const A = params[0];
        const B = params[1];
        const C = params[2];
        const D = params[3];
        const P = params[4];
        const Q = params[5];

        for( p of points )
        {
            const x = p[0];
            const y = p[1];
            out.push([
                this.G(A*x) + this.H(B*y) + P,
                this.G(C*y) + this.F(D*x) + Q
            ]);
        }
        return out;
    }

    this.kicked = function(points, params)
    {
        var out = [];
        var noise = [];
        
        for(let i = 0; i < points.length; i++)
            if( Math.random() < 0.03 )
            {
                var random = [this.random_point()];
                points[i] = this.qubic_exp(random, params)[0];
            }
        return this.qubic_exp(points, params);
    }

    this.step = function(params)
    {
        this.Points = this.kicked(this.Points, params);
        return this.Points;
    }
}


