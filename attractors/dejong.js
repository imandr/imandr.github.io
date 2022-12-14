function DeJong(arg)
{
    this.Momentum = 0.99;
    this.Rate = 0.03;
    this.PMin = [-2.5, -2.5, -2.5, -.5];
    this.PMax = [2.5, 2.5, 2.5, 2.5];
    this.XMin = [-1.0, -1.0];
    this.XMax = [1.0, 1.0];
    this.XDim = 2;
    this.PDim = 4;
    this.Points = null;

    this.random_point = function()
    {
            return [Math.random()*2-1, Math.random()*2-1];
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
    
    this.dejong = function(points, params)
    {
        const A = params[0];
        const B = params[1];
        const C = params[2];
        const D = params[3];
        var out = [];
        for( p of points )
        {
            const x = p[0];
            const y = p[1];
            out.push(
                [Math.sin(A*y) - Math.cos(B*x),
                Math.sin(C*x) - Math.cos(D*y)
                ]);
        }
        return out;
    }
    
    this.kicked = function(points, params)
    {
        var out = [];
        var noise = [];
        
        for(let i = 0; i < points.length; i++)
            if( Math.random() < 0.01 )
            {
                var random = [this.random_point()];
                points[i] = this.dejong(random, params)[0];
            }
        return this.dejong(points, params);
    }

    this.step = function(params)
    {
        this.Points = this.kicked(this.Points, params);
        return this.Points;
    }
    
}


