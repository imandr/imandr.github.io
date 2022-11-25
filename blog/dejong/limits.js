function Mutator(ranges, initial)
{
    this.M = 0.95;
    this.PMin = [];
    this.PMax = [];
    this.Lead = [];
    this.Point = [];
    this.V = [];
    this.VMax = [];
    this.A = [];
    var i;
    for( i=0; i<ranges.length; i++ )
    {
        var range = ranges[i];
        var x0 = range[0];
        var x1 = range[1];
        var vmax = (x1-x0)/20;
        this.VMax.push(vmax);
        this.PMin.push(range[0]);
        this.PMax.push(range[1]);
        var x = x0 + Math.random()*(x1-x0);
        if( initial != null )
            x = initial[i];
        var a = vmax/2;
        var v = (Math.random()*2-1)*vmax;
        this.Lead.push(x);
        this.Point.push(x);
        this.V.push(v);
        this.A.push(a);
    };
    this.N = this.V.length;

    this.vstep = function(dt, vec)
    {
        var out = [];
        for(var i=0; i<this.N; i++ )
        {
            var v = vec[i] + (Math.random()*2-1)*this.A[i]*dt;
            var vmax = this.VMax[i];
            if( v > vmax ) v = vmax;
            if( v < -vmax ) v = -vmax;
            out.push(v);
        }
        return out;
    }
    
    this.step = function(dt)
    {
        var vvec = this.vstep(dt, this.V);
        
        for(var i=0; i<this.N; i++ )
        {
            var v = vvec[i];
            var x = this.Lead[i] + v*dt;
            if( x > this.PMax[i] || x < this.PMin[i] )
            {
                v = -v;
                x = this.Lead[i] + v*dt;
            }
            this.Point[i] += (x-this.Point[i])*(1.0 - this.M);
            this.V[i] = v;
            this.Lead[i] = x;
        }
        return this.Point;
    }
}

