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

function TanhAtt(np, kick)
{
    this.Rate = 0.02;
    this.PMin = [-2.0, -2.0, -1.0, -1.0, -1.0, -1.0];
    this.PMax = [2.0, 2.0,  1.0,  1.0, 1.0, 1.0];
    this.XMin = [-3.0, -3.0];
    this.XMin = [3.0, 3.0];
    this.XDim = 2;
    this.PDim = 6;
    this.Points = [];
    this.NP = np;
    this.Kick = kick == null ? 0.01 : kick;
    this.Points = [];

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
    }

    this.F = function(x)
    {
        return Math.tanh(x);
    }
    
    this.G = function(x)
    {
        return Math.tanh(2*x*x-1);
    }
    
    this.H = function(x)
    {
        return Math.tanh(x*x*x - 1.5*x + 0.5*x*x);
    }
    
    this.tanh_transform = function(points, params)
    {
        var out = [];
        const A = params[0];
        const B = params[1];
        const C = params[2];
        const D = params[3];
        const E = params[4];
        const F = params[5];

        for( p of points )
        {
            const x = p[0];
            const y = p[1];
            out.push([
                //this.G(A*x) + this.H(B*y),
                //this.G(C*y) + this.F(D*x)
                this.H(A*x) + this.G(B*y) + E*this.F(y),
                this.H(C*y) + this.G(D*x) + F*this.F(x)
            ]);
        }
        return out;
    }

    this.kicked = function(points, params)
    {
        
        if(this.Kick > 0.0)
            for(let i = 0; i < points.length; i++)
                if( Math.random() < this.Kick )
                {
                    const random = [this.random_point()];
                    var tmp = this.tanh_transform(random, params);
                    //tmp = this.qubic_exp(tmp, params);
                    points[i] = this.tanh_transform(tmp, params)[0];
                }
        return this.tanh_transform(points, params);
    }

    this.step = function(params)
    {
        this.Points = this.kicked(this.Points, params);
        return this.Points;
    }


    for( let i = 0; i < np; i++ )
        this.Points.push(this.random_point());
}
