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


let TanhAttGPU = class
{
    constructor(np, kick)
    {
        this.Rate = 0.02;
        this.PMin = [-1.5, -1.5, -1.5, -1.5, -1.0, -1.0];
        this.PMax = [1.5, 1.5,  1.5,  1.5, 1.0, 1.0];
        this.XMin = [-3.0, -3.0];
        this.XMin = [3.0, 3.0];
        this.XDim = 2;
        this.PDim = 6;
        this.NP = np;
        this.Kick = kick == null ? 0.01 : kick;
        this.Points = [];
        const gpu = new GPU();

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

        gpu.addFunction(G);
        gpu.addFunction(F);
        gpu.addFunction(H);
        this.qexp_kernel = gpu.createKernel(
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

        this.Points = [];
        for( let i = 0; i < np; i++ )
            this.Points.push(this.random_point());
    }

    step(params)
    {
        if(this.Kick > 0.0)
            for(let i = 0; i < this.Points.length; i++)
                if( Math.random() < this.Kick )
                {
                    this.Points[i] = this.random_point()
                }
        this.Points = this.qexp_kernel(this.Points, params);
        return this.Points;
    }
}