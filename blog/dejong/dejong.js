function DeJong(a, b, c, d)
{
    if ( a == null ) a = 2.01;
    if ( b == null ) b = -2.53;
    if ( c == null ) c = 1.61;
    if ( d == null ) d = 0.33;
    
    this.A = a;
    this.B = b
    this.C = c;
    this.D = d;
    
    
    this.fcn = function(points)
    {
        var out = [];
        for( p of points )
        {
            const x = p[0];
            const y = p[1];
            out.push(
                [Math.sin(this.A*y) - Math.cos(this.B*x) + Math.random()*0.001,
                Math.sin(this.C*x) - Math.cos(this.D*y) + Math.random()*0.001
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

    this.fixed_fcn = function(points)
    {
        const points1 = this.fcn(points);
        var out = [];
        var i = 0;
        for( var p0 of points )
        {
            const x0 = p0[0];
            const y0 = p0[1];
            var p1 = points1[i];
            var x = p1[0];
            var y = p1[1];
            if( Math.random() < 0.1 )
            {
                x += this.normal()*0.002;
                y += this.normal()*0.002;
            }
            if( Math.abs(x0-x) + Math.abs(y0-y) < 0.0001 )
            {
                x += this.normal()*0.05;
                y += this.normal()*0.05;
            }
            out.push([x,y]);
            i++;
        }
        return out;
    }

    this.Drag = 0.1;
    this.DragFraction = 0.001;
    
    this.dragged_fcn = function(points)
    {
        var points1 = this.fixed_fcn(points);
        var i = 0;
        var out = [];
        for( var p1 of points1 )
        {
            if( Math.random() < this.DragFraction )
            {
                const x0 = points[i][0];
                const y0 = points[i][1];
                const x1 = points[i][0];
                const y1 = points[i][1];
                const step = Math.random() * this.Drag;
                p1 = [
                    x1 + step*(x0-x1),
                    y1 + step*(y0-y1),
                ]
            }
            out.push(p1);
            i++;
        }
        return out;
    }
    
    this.f = this.dragged_fcn;
    
    this.Momentum = 0.99;
    this.Rate = 0.02;
    this.PMin = -2.5;
    this.PMax = 2.5;    
    this.LastMutation = [0.0, 0.0, 0.0, 0.0];

    this.mutate = function()
    {
        var params = [this.A, this.B, this.C, this.D];
        for( var i=0; i<4; i++ )
        {
            var d = Math.random() * this.Rate - this.Rate/2;
            d = this.Momentum * this.LastMutation[i] + (1.0 - this.Momentum) * d;
            var p1 = params[i] + d;
            if( p1 > this.PMax ) p1 = this.PMax;
            if( p1 < this.PMin ) p1 = this.PMin;
            this.LastMutation[i] = (p1 - params[i])*0.999;
            params[i] = p1;            
        }
        this.A = params[0];
        this.B = params[1];
        this.C = params[2];
        this.D = params[3];
    }
}


