function Lorentz(b, s, r, t)
{
    if ( s == null ) s = 10.0;
    if ( b == null ) b = 8.0/3.0;
    if ( r == null ) r = 28.0;
    if ( t == null ) t = 6.0;
    
    this.R = r;
    this.B = b
    this.S = s;
    this.T = t;
	this.DT = 0.01;
	
	this.P_10 = 0.5;
	this.P_20 = -0.65;
	this.P_01 = 0.2;
	this.P_11 = 0.8;
	
	this.bounds = [
		[-30.0, -30.0],
		[30.0, 30.0]
	];
	
	this.NPoints = 20000;
    
	this.init = function()
	{
        var points = [];
        for( var i = 0; i < this.NPoints; i++ )
        {
			const q = Math.random() - 1;
            points.push([0.1, 0.1, q]);
            if( Math.random() < 0.5 )
				points.push([0.5, 0.1, q]);
            if( Math.random() < 0.0 )
				points.push([q, 1, 1.0]);
            if( Math.random() < 0.0 )
				points.push([q, 3, 2.0]);
            if( Math.random() < 0.0 )
				points.push([q, 4, 3.0]);
            //points.push([q, q, -1.3]);
        }
		return points;
	}
	
	this.init = function()
	{
        var points = [];
		const z0 = -1;
		const z1 = 0.3;
		const dz = (z1-z0)/this.NPoints;
        for( var i = 0, z=z0; i < this.NPoints; i++, z+=dz )
        {
			points.push([0.1, 0.1, z]);
			if( Math.random() < 0.5 )
				points.push([2.2, 5.3, z]);
            //points.push([q, q, -1.3]);
        }
		return points;
	}
	
	this.move = function(p)
    {
        var x = p[0];
        var y = p[1];
        var z = p[2];
		const dt = this.DT;
		for( var t = 0.0; t < this.T; t += this.DT )
		{
			const dx  = this.S*(y - x);
			const dy = x*(this.R - z) - y;
			const dz = x*y - this.B*z;
			x += dx*this.DT;
			y += dy*this.DT;
			z += dz*this.DT;
		}
		return [x, y, z];
    }
	
	this.project = function(points)
	{
		
		var out = [];
		for( p of points )
		//out.push([
		//	(p[0]+p[2]*0.7)/2,
		//	(p[1]+p[2]*0.3)/2
		//]);
			out.push([
				p[0] + p[1]*this.P_10 + p[2]*this.P_20,
				p[2] + p[0]*this.P_01 + p[1]*this.P_11 - 20.0
			]);
		return out;
	}

    this.fcn = function(points)
    {
        var out = [];
        for( p of points )
			out.push(this.move(p))
        return out;
    }

    this.normal = function()
    {
        return Math.random() + Math.random() + Math.random() + Math.random()
            + Math.random() + Math.random() + Math.random() + Math.random()
            + Math.random() + Math.random() + Math.random() + Math.random()
            - 6.0;
    }

    this.fixed_fcn = function(points)
    {
		// apply slight diffusion
        const points1 = this.fcn(points);
        var out = [];
        var i = 0;
        for( var p0 of points )
        {
            var p1 = points1[i];
			var i;
            if( Math.random() < 0.1 )
            {
				for(i=0; i<p1.length; i++)
				{
					var delta = this.normal()*0.002;
					if( Math.abs(delta) < 0.0001 )
						delta = this.normal()*0.05
					p1[i] += delta;
				}	
            }
            out.push(p1);
            i++;
        }
        return out;
    }

    this.Drag = 0.1;
    this.DragFraction = 0.001;
    
    this.dragged_fcn = function(points)
    {
        var points1 = this.fcn(points);
        var i;
		var ip;
        for( ip=0; ip<points.length; ip++ )
        {
            if( Math.random() < this.DragFraction )
            {
				var p = points[ip];
				var p1 = points1[ip];
				const step = Math.random() * this.Drag;
				for(i=0; i<p1.length; i++)
				{
					p1[i] += step*( p[i] - p1[i] );
				}
            }
            i++;
        }
        return points1;
    }
    
    //this.f = this.dragged_fcn;
    this.transform = this.dragged_fcn;
    
    this.Momentum = 1.011;
    this.Rate = 0.02;
    this.PMin = [1.2, 6.0, 21.0, this.T, -1, -1, -1, -1];
    this.PMax = [2.7, 15.0, 35.0, this.T, 1, 1, 1, 1];
    this.LastMutation = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];

    this.mutate = function()
    {
        var params = [this.B, this.S, this.R, this.T, this.P_10, this.P_20, this.P_01, this.P_11];
        for( var i=0; i<params.length; i++ )
        {
            var d = Math.random() * this.Rate - this.Rate/2;
            d = this.Momentum * this.LastMutation[i] + (1.0 - this.Momentum) * d;
            var p1 = params[i] + d;
            if( p1 > this.PMax[i] ) p1 = this.PMax[i];
            if( p1 < this.PMin[i] ) p1 = this.PMin[i];
            this.LastMutation[i] = (p1 - params[i])*0.999;
            params[i] = p1;            
        }
        this.B = params[0];
        this.S = params[1];
        this.R = params[2];
		this.T = params[3];
		this.P_10 = params[4];
		this.P_20 = params[5];
		this.P_01 = params[6];
		this.P_11 = params[7];
    }
}


