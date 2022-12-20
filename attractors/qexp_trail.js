function QubicExp(initial)
{
    this.Rate = 0.02;
    this.PMin = [0.1, 0.1, 0.1, 0.1];
    this.PMax = [0.7,  0.7,   0.7,  0.7];
    //this.PMin = [0.4, 0.9, 0.32, 0.4];
    //this.PMax = this.PMin;
    
    if( initial != null )
    {
        this.Ax = initial[0];
        this.Bx = initial[1];
        this.Ay = initial[2];
        this.By = initial[3];
    }
    else
    {
        this.Ax = this.PMin[0] + Math.random()*(this.PMax[0] - this.PMin[0]);
        this.Bx = this.PMin[1] + Math.random()*(this.PMax[1] - this.PMin[1]);
        this.Ay = this.PMin[2] + Math.random()*(this.PMax[2] - this.PMin[2]);
        this.By = this.PMin[3] + Math.random()*(this.PMax[3] - this.PMin[3]);
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
    
    this.qubic_exp = function(points)
    {
        var out = [];
        
        for( p of points )
        {
            const x = p[0];
            const y = p[1];
            
            out.push([
                this.G(this.Ax*x) + this.H(this.Bx*y),
                this.F(this.Ay*x) + this.G(this.By*y)
            ]);
        }
        return out;
    }

    this.normal = function()
    {
        return Math.random() + Math.random() + Math.random() + Math.random()
            + Math.random() + Math.random() + Math.random() + Math.random()
            + Math.random() + Math.random() + Math.random() + Math.random()
            - 6.0;
    }

    this.lead = function(points)
    {
		const w = 1.1;
        const points1 = this.qubic_exp(points);
        var out = [];
		for( i = 0; i < points.length; i++ )
		{
			out.push([
				points[i][0] + w * (points1[i][0] - points[i][0]),
				points[i][1] + w * (points1[i][1] - points[i][1])
			])
		}
        return out;
    }

    this.Morpher = new Morpher(this.PMin, this.PMax, 
            [this.Ax, this.Bx, this.Ay, this.By]
    );

    this.morph = function()
    {
        var params = this.Morpher.step(this.Rate);
        this.Ax = params[0];
        this.Bx = params[1];
        this.Ay = params[2];
        this.By = params[3];
    }
    
    this.init_points = function(n)
    {
        var out = [];
        var i;
        for( i = 0; i < n; i++ )
            out.push([Math.random()*2-1, Math.random()*2-1]);
        return out;
    }
    
    this.f = this.qubic_exp;

    this.trajectory = function(p0, n)
    {
        var out = [p0];
        var p = p0;
        for( let t = 0; t < n; t++ )
        {
            p = this.f([p])[0];
            out.push(p);
        }
        return out;
    }

}


