function Qubic(initial)
{
    this.Rate = 0.03;
    this.PMin = [0.8, -0.1, -0.2, -0.1, 0.8, -0.1, -0.2, -0.1];
    this.PMax = [1.0,  0.1, -0.1,  0.1, 1.0,  0.1, -0.1,  0.1];
    
    if( initial != null )
    {
        this.Ax = initial[0];
        this.Bx = initial[1];
        this.Cx = initial[2];
        this.Dx = initial[3];
        this.Ay = initial[4];
        this.By = initial[5];
        this.Cy = initial[6];
        this.Dy = initial[7];
    }
    else
    {
        this.Ax = this.PMin[0] + Math.random(this.PMax[0] - this.PMin[0]);
        this.Bx = this.PMin[1] + Math.random(this.PMax[1] - this.PMin[1]);
        this.Cx = this.PMin[2] + Math.random(this.PMax[2] - this.PMin[2]);
        this.Dx = this.PMin[3] + Math.random(this.PMax[3] - this.PMin[3]);
        this.Ay = this.PMin[4] + Math.random(this.PMax[4] - this.PMin[4]);
        this.By = this.PMin[5] + Math.random(this.PMax[5] - this.PMin[5]);
        this.Cy = this.PMin[6] + Math.random(this.PMax[6] - this.PMin[6]);
        this.Dy = this.PMin[7] + Math.random(this.PMax[7] - this.PMin[7]);
    }
    
    this.qubic = function(points)
    {
        var out = [];
        
        const xedge0 = -this.Ax + this.Bx - this.Cx + this.Dx;
        const xedge1 =  this.Ax + this.Bx + this.Cx + this.Dx;
        const yedge0 = -this.Ay + this.By - this.Cy + this.Dy;
        const yedge1 =  this.Ay + this.By + this.Cy + this.Dy;
        
        for( p of points )
        {
            const x = p[0];
            const y = p[1];
            
            const x1 = this.Dx + y*(this.Cx + x*(this.Bx + y*this.Ax));
            const y1 = this.Dy + x*(this.Cy + y*(this.By + x*this.Ay));
            
            out.push([
                (x1-xedge0)/(xedge1-xedge0),
                (y1-yedge0)/(yedge1-yedge0)
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

    this.qubic_fixed = function(points)
    {
        const points1 = this.qubic(points);
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

    this.Morpher = new Morpher(this.PMin, this.PMax, 
            [this.Ax, this.Bx, this.Cx, this.Dx, this.Ay, this.By, this.Cy, this.Dy]
    );

    this.morph = function()
    {
        var params = this.Morpher.step(this.Rate);
        this.Ax = params[0];
        this.Bx = params[1];
        this.Cx = params[2];
        this.Dx = params[3];
        this.Ay = params[4];
        this.By = params[5];
        this.Cy = params[6];
        this.Dy = params[7];
    }
    
    this.init_points = function(n)
    {
        var out = [];
        var i;
        for( i = 0; i < n; i++ )
            out.push([Math.random()*2-1, Math.random()*2-1]);
        return out;
    }
    
    this.f = this.qubic_fixed;
}


