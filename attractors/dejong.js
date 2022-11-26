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
                [Math.sin(this.A*y) - Math.cos(this.B*x) + Math.random()*0.000,
                Math.sin(this.C*x) - Math.cos(this.D*y) + Math.random()*0.000
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
            if( Math.random() < 0.01 )
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
    this.DragFraction = 0.1;
    
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
                const x1 = points1[i][0];
                const y1 = points1[i][1];
                const step = Math.random() * this.Drag;
                p1 = [
                    x0 + step*(x1-x0),
                    y0 + step*(y1-y0)
                ]
            }
            out.push(p1);
            i++;
        }
        return out;
    }
    
    this.dragged_fcn2 = function(points)
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
                const x1 = points1[i][0];
                const y1 = points1[i][1];
                var r = Math.random();
                r = r*r*this.Drag;
                p1 = [
                    x1 + r*(x0-x1),
                    y1 + r*(y0-y1)
                ]
            }
            out.push(p1);
            i++;
        }
        return out;
    }
    
    this.f = this.dragged_fcn2;
    
    this.Momentum = 0.99;
    this.Rate = 0.03;
    this.PMin = 0.5;
    this.PMax = 2.5;
    this.Range = 1.0;
    
    this.A = this.PMin + Math.random()*(this.PMax-this.PMin);
    this.B = this.PMin + Math.random()*(this.PMax-this.PMin);
    this.C = this.PMin + Math.random()*(this.PMax-this.PMin);
    this.D = this.PMin + Math.random()*(this.PMax-this.PMin);
    
    this.Morpher = new Morpher([
            [this.PMin, this.PMax],
            [this.PMin, this.PMax],
            [this.PMin, this.PMax],
            [this.PMin, this.PMax]
        ],
        [this.A, this.B, this.C, this.D]
    );

    this.mutate = function()
    {
        var params = this.Morpher.step(this.Rate);
        this.A = params[0];
        this.B = params[1];
        this.C = params[2];
        this.D = params[3];
    }
}


