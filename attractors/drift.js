function Morpher(pmin, pmax, initial)
{
    this.M = 0.95;
    this.PMin = pmin;
    this.PMax = pmax;
    this.Lead = [];
    this.Point = [];
    this.V = [];
    this.VMax = [];
    this.A = [];
    var i;
    for( i=0; i<pmax.length; i++ )
    {
        var x0 = pmin[i];
        var x1 = pmax[i];
        var vmax = (x1-x0)/20;
        this.VMax.push(vmax);
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

hsb_to_rgb = function (hsb) {
    //
    // HSB and RGB are all normalized to [0,1.0]
    //
    var h = hsb[0];
    var s = hsb[1];
    var v = hsb[2];
    
    while( h < 0.0 )
        h += 1.0;

    if (s == 0)
        return [v,v,v];

    var t1 = v;
    var t2 = (1.0 - s) * v;
    var h6 = h*6.0;
    var hr = h6 - Math.floor(h6);
    
    var t3 = (t1 - t2) * hr;
    var r, g, b;

    if (h6 < 1) { r = t1; b = t2; g = t2 + t3 }
    else if (h6 < 2) { g = t1; b = t2; r = t1 - t3 }
    else if (h6 < 3) { g = t1; r = t2; b = t2 + t3 }
    else if (h6 < 4) { b = t1; r = t2; g = t1 - t3 }
    else if (h6 < 5) { b = t1; g = t2; r = t2 + t3 }
    else if (h6 < 6) { r = t1; g = t2; b = t1 - t3 }
    else { r = 0; g = 0; b = 0 }

    return [r,g,b];
}

function ColorChanger()
{
    this.Morpher = new Morpher([-0.5, 0.1, 0.8], [2.5, 1.0, 1.0]);
    
    this.next_color = function()
    {
        var hsb = this.Morpher.step(0.01);
        var h = hsb[0] - Math.floor(hsb[0]);
        return hsb_to_rgb([h, hsb[1], hsb[2]]);
    }
}

