class Drifter
{
    constructor(pmin, pmax, initial)
    {
        this.M = 0.95;
        this.PMin = pmin;
        this.PMax = pmax;
        this.Lead = [];
        this.Point = [];
        this.V = [];
        this.VTarget = 0.05;
        
        var i;
        this.N = pmax.length;
        this.Lead = this.random_vec(this.N, 0, 1);
        this.Point = this.scale(this.Lead, 1.0);
        this.V = this.random_vec(this.N, -1, 1, this.VTarget);
        this.Acceleration = 1.0;
    }

    lead()
    {
        return this.map(this.Lead, 0, 1, this.PMin, this.PMax);
    }

    map(vec, vmin, vmax, xmin, xmax)
    {   // assume vec[i] between vmin and vmax, lienary map vec[i] to [xmin[i]...xmax[i]]
        
        var out = [];
        const dv = vmax - vmin;
        for( let i = 0; i < vec.length; i++ )
            out.push(xmin[i] + (vec[i] - vmin)/dv*(xmax[i]-xmin[i]));
        return out;
    }
    
    add(vec, delta, inplace)
    {
        if( inplace != null && inplace )
        {
            for( let i = 0; i < vec.length; i++ )
                vec[i] += delta[i];
            return vec;
        }
        else
        {
            var out = [];
            for( let i = 0; i < vec.length; i++ )
                out.push(vec[i] + delta[i]);
            return out;
        }        
    }
    
    scale(vec, scalar, inplace)
    {
        if( inplace != null && inplace )
        {
            for( let i = 0; i < vec.length; i++ )
                vec[i] *= scalar;
            return vec;
        }
        else
        {
            var out = [];
            for( let i = 0; i < vec.length; i++ )
                out.push(vec[i] * scalar);
            return out;
        }
    }

    random_vec(n, vmin, vmax, norm)
    {
        var out = [];
        for(let i = 0; i < n; i++ )
            out.push(vmin + Math.random()*(vmax-vmin));
        if( norm != null )
        {
            this.normalize(out, norm, true);
        }
        return out;
    }

    mag(vec)
    {
        var r2 = 0;
        for( let x of vec )
            r2 += x*x;
        return Math.sqrt(r2);
    }
        
    normalize(vec, mag, inplace)
    {   // scale the vec so that it has given magnitude
        if( mag == null )   mag = 1.0;
        
        const r = this.mag(vec);
        
        if( inplace != null && inplace )
        {
            for( let i = 0; i < vec.length; i++ )
                vec[i] = vec[i]/r*mag;
            return vec;
        }
        else
        {
            var out = [];
            for( let x of vec )
                out.push(x/r*mag);        
            return out;
        }
    }
    
    _vstep()
    {
        const dv = this.random_vec(this.N, -1, 1, this.VTarget/10);
        const v1 = this.add(this.V, dv);
        const vnorm = this.mag(v1) * 0.99 + 0.01 * this.VTarget * this.Acceleration;
        this.V = this.normalize(v1, vnorm);
        return this.V;
    }
    
    step(dt)
    {
        this._vstep();
        var xnew = this.add(this.Lead, this.scale(this.V, dt));

        for( let i = 0; i < this.N; i++ )
            if( xnew[i] <= 0 || xnew[i] >= 1 )
                this.V[i] = -this.V[i];
        
        this.Lead = this.add(this.Lead, this.scale(this.V, dt));
        this.Point = this.add(this.scale(this.Lead, 1-this.M), this.scale(this.Point, this.M));
        
        return this.map(this.Point, 0, 1, this.PMin, this.PMax);
    }
    
    accelerate(a)
    {
        this.Acceleration = a;
    }
    
    kick()
    {
        this.V = this.scale(this.V, -1);
    }
}

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

    h -= Math.floor(h);

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

function HSBMorpher()
{
    this.Morpher = new Morpher([-0.5, 0.8, 0.9], [7.5, 1.0, 1.0]);
    
    this.next_hsb = function()
    {
        var hsb = this.Morpher.step(0.003);
        var h = hsb[0] - Math.floor(hsb[0]);
        return [h, hsb[1], hsb[2]];
    }
}

function ColorChanger()
{
    this.Morpher = new HSBMorpher();
    
    this.next_rgb = function()
    {
        var hsb = this.Morpher.next_hsb();
        return hsb_to_rgb(hsb);
    }
	
    this.next_color = this.next_rgb;            // alias
    
    this.next_hsb = function()
    {
        return this.Morpher.next_hsb();
    }
    
	this.hsb_to_rgb = function(hsb)
	{
		return hsb_to_rgb(hsb);
	}
}

