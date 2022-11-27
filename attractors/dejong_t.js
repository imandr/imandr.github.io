function DeJongT(initial)
{
    this.Momentum = 0.99;
    this.Rate = 0.03;
    this.PMin = 0.5;
    this.PMax = 2.5;
    this.Range = 1.0;
    this.T = 0.0;
    
    if( initial != null )
    {
        this.A = initial[0];
        this.B = initial[1];
        this.C = initial[2];
        this.D = initial[3];
    }
    else
    {
        this.A = this.PMin + Math.random(this.PMax - this.PMin);
        this.B = this.PMin + Math.random(this.PMax - this.PMin);
        this.C = this.PMin + Math.random(this.PMax - this.PMin);
        this.D = this.PMin + Math.random(this.PMax - this.PMin);
    }
    
    this.P = this.PMin + Math.random(this.PMax - this.PMin);
    this.Q = this.PMin + Math.random(this.PMax - this.PMin);
    
    this.dejong = function(points)
    {
        var out = [];
        for( p of points )
        {
            const x = p[0];
            const y = p[1];
            out.push(
                [Math.sin(this.A*y) - Math.cos(this.B*x) + Math.sin(this.T*this.P),
                Math.sin(this.C*x) - Math.cos(this.D*y) + Math.cos(this.T*this.Q)
                ]);
        }
        return out;
    }
    
    this.dejong_mixed  =function(points)
    {
        var points1 = this.dejong(points);
        var tmp = points[1];
        points1[1] = points1[0];
        points1[0] = tmp;
        return points1;
    }

    this.normal = function()
    {
        return Math.random() + Math.random() + Math.random() + Math.random()
            + Math.random() + Math.random() + Math.random() + Math.random()
            + Math.random() + Math.random() + Math.random() + Math.random()
            - 6.0;
    }

    this.fixed_dejong = function(points)
    {
        var points1 = this.dejong(points);
        points1 = this.dejong(points1);
        points1 = this.dejong(points1);
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
            if( Math.abs(x0-x) + Math.abs(y0-y) < 0.001 )
            {
                x += this.normal()*0.05;
                y += this.normal()*0.06;
            }
            out.push([x,y]);
            i++;
        }
        return out;
    }

    this.Drag = 0.01;
    this.DragFraction = 0.01;
    
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
        var points1 = this.fixed_dejong(points);
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
    
    this.f = this.fixed_dejong;
    
    
    this.A = this.PMin + Math.random()*(this.PMax-this.PMin);
    this.B = this.PMin + Math.random()*(this.PMax-this.PMin);
    this.C = this.PMin + Math.random()*(this.PMax-this.PMin);
    this.D = this.PMin + Math.random()*(this.PMax-this.PMin);
    
    this.Morpher = new Morpher(
            [this.PMin, this.PMin, this.PMin, this.PMin],
            [this.PMax, this.PMax, this.PMax, this.PMax],
            [this.A, this.B, this.C, this.D]
    );

    this.morph = function()
    {
        var params = this.Morpher.step(this.Rate);
        this.A = params[0];
        this.B = params[1];
        this.C = params[2];
        this.D = params[3];
        this.T += 0.005;
    }
}


