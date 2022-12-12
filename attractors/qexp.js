function QubicExp(initial, morpher)
{
    this.Rate = 0.02;
    //this.PMin = [0.2, 0.2, 0.2, 0.2];
    this.PMin = [-2.7, -2.7, -2.7, -2.7];
    this.PMax = [2.7,  2.7, 2.7,  2.7];
    //this.PMin = [0.4, 0.9, 0.32, 0.4];
    //this.PMax = this.PMin;
    
    if( initial != null )
    {
        this.A = initial[0];
        this.B = initial[1];
        this.C = initial[2];
        this.D = initial[3];
    }
    else
    {
        this.A = this.PMin[0] + Math.random()*(this.PMax[0] - this.PMin[0]);
        this.B = this.PMin[1] + Math.random()*(this.PMax[1] - this.PMin[1]);
        this.C = this.PMin[2] + Math.random()*(this.PMax[2] - this.PMin[2]);
        this.D = this.PMin[3] + Math.random()*(this.PMax[3] - this.PMin[3]);
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
        var A,B,C,D;
        if( params == null )
        {
            A = this.A;
            B = this.B;
            C = this.C;
            D = this.D;
        }
        else
        {
            A = params[0];
            B = params[1];
            C = params[2];
            D = params[3];
        }
        
        for( p of points )
        {
            const x = p[0];
            const y = p[1];
            
            out.push([
                this.G(A*x) + this.H(B*y),
                this.G(C*y) + this.F(D*x)
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
                var random = this.init_points(1);
                points[i] = this.qubic_exp(random, params)[0];
            }
        
        return this.qubic_exp(points, params);
    }

    this.normal = function()
    {
        return Math.random() + Math.random() + Math.random() + Math.random()
            + Math.random() + Math.random() + Math.random() + Math.random()
            + Math.random() + Math.random() + Math.random() + Math.random()
            - 6.0;
    }

    this.Morpher = morpher == null ? new Morpher(this.PMin, this.PMax, 
            [this.A, this.B, this.C, this.D]
    ) : morpher;

    this.morph = function()
    {
        var params = this.Morpher.step(this.Rate);
        this.A = params[0];
        this.B = params[1];
        this.C = params[2];
        this.D = params[3];
    }
    
    this.init_points = function(n)
    {
        var out = [];
        var i;
        for( i = 0; i < n; i++ )
            out.push([Math.random()*2-1, Math.random()*2-1]);
        return out;
    }
    
    this.f = this.kicked;
}


