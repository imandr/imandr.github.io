function Morpher(lower, upper, beta, alpha, initial)
{
    this.Lower = lower;
    this.Upper = upper;
    this.Dim = this.Lower.length;
    this.Beta = beta;               // momentum keeping force
    this.Alpha = alpha;             // expected step length as a fraction of the range
    this.Gamma = 0.9;               // velocity dissipation per step
    this.V = [];
    this.ForceV = alpha * (1-this.Gamma)
    this.Kick = [];
    
    // initial velocity
    for( var i=0; i<this.Dim; i++ )
    {
        const dx = (this.Upper[i] - this.Lower[i])*this.Alpha;
        this.V.push((Math.random()*2-1)*dx);
        this.Kick.push(0.0);
    }
    
    this.normalize = function(vector, value=1.0)
    {
        var abs = 0.0;
        for( let x of vector )
            abs += x*x;
        if( abs == 0.0 )
            return vector;
        abs = Math.sqrt(abs);
        var out = [];
        for( x of vector )
            out.push(x/abs*value);
        return out;
    }

    this.normal = function()
    {
        var x = Math.random() + Math.random() + Math.random() + Math.random();
        x += Math.random() + Math.random() + Math.random() + Math.random();
        x += Math.random() + Math.random() + Math.random() + Math.random();
        return x-6;
    }
    
    this.random_normal = function(value=1.0)
    {
        var v = [];
        for ( var i = 0; i < this.Dim; i++ )
            v.push(this.normal());
        return this.normalize(v, value);
    }
    
    this.add = function(v1, v2)
    {
        out = [];
        for( var i in v1 )
            out.push(v1[i]+v2[i]);
        return out;
    }
    
    this.subtract = function(v1, v2)
    {
        out = [];
        for( var i in v1 )
            out.push(v1[i]-v2[i]);
        return out;
    }
    
    this.divide = function(v1, v2)
    {
        out = [];
        for( var i in v1 )
            out.push(v1[i]/v2[i]);
        return out;
    }
    
    this.multiply = function(v1, v2)
    {
        out = [];
        for( var i in v1 )
            out.push(v1[i]*v2[i]);
        return out;
    }
    
    this.scale = function(v1, s)
    {
        out = [];
        for( var x of v1 )
            out.push(x*s);
        return out;
    }
    
    this.zeros = function()
    {
        var out = [];
        for( var i=0; i < this.Dim; i++ )
            out.push(0);
        return out;
    }

    this.Deltas = this.subtract(this.Upper, this.Lower);

    this.P = this.divide(this.subtract(initial, this.Lower), this.Deltas);  // normalized to [0..1] for all dimensions
    this.Force = this.random_normal(this.ForceV);
    this.V = this.random_normal(this.Alpha);
    
    this.step = function()
    {
        //
        // Boundary forces
        //
        var bounds_force = this.zeros();
        var bounds = this.scale(this.Deltas, this.Alpha*10);

        for( var i = 0; i < this.Dim; i++ )
        {
            var x0 = this.P[i];
            var x1 = 1.0-this.P[i];
            if( x0 < 0.2 )
                bounds_force[i] += 0.04/x0/x0;
            else if ( x1 < 0.2 )
                bounds_force[i] -= 0.04/x1/x1;
        }
        bounds_force = this.scale(bounds_force, this.ForceV);
        
        //
        // Force field
        //
        var force_delta = this.random_normal(this.ForceV*0.1);
        this.Force = this.normalize(this.add(this.Force, force_delta), this.ForceV);
        
        total_force = this.add(this.Force, bounds_force);
        var v = this.scale(this.add(this.V, total_force), 1-this.Gamma);
        var p1 = this.add(this.P, v);
        
        for( i in p1 )
        {
            if( p1[i] > 1.0 )
                p1[i] = (this.P[i] + 1.0)/2;
            if( p1[i] < 0.0 )
                p1[i] = this.P[i]/2;
        }
        this.V = this.subtract(p1, this.P);
        this.P = p1;
        
        return this.add(this.Lower, this.multiply(this.Deltas, this.P));
    }    
}