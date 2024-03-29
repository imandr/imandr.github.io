function rect_mapper(x0, y0, x1, y1, w, h, mode)
{
    // mode = fit for now
    // possible modes: stretch, fill, fit
    
    // fit mode: both x and y are mapped with the same scale, making sure both x and y domains fit into the target rectangle
    
    this.H = h;
    this.W = w;
    this.CH = h/2;
    this.CW = w/2;
    
    this.X0 = x0;
    this.X1 = x1;
    this.Y0 = y0;
    this.Y1 = y1;
    this.DX = x1-x0;
    this.DY = y1-y0;
    this.CX = (x0+x1)/2;
    this.CY = (y0+y1)/2;
    
    var scalex = this.W/this.DX;
    var scaley = this.H/this.DY;
    
    this.ScaleX = this.ScaleY = scalex > scaley ? scaley : scalex;
    
    this.map_xy = function(x, y)
    {
        var q = 0;
        if( y > this.Y1 || y < this.Y0 )
            q = 1; 
        const out = [
            this.CW + (x-this.CX)*this.ScaleX,
            this.CH - (y-this.CY)*this.ScaleY
        ];
        return out;
    }

    this.map_point = function(p)
    {
        return this.map_xy(p[0], p[1]);
    }
    
    this.map_points = function(points)
    {
        var out = [];
        for( p of points )
        {
            out.push(this.map_point(p));
        }
        return out;
    }
}

function canvas(element_id, dimx, dimy, x0, y0, x1, y1)
{
    this.C = document.getElementById(element_id);
    this.C.setAttribute("width", dimx);
    this.C.setAttribute("height", dimy);
    this.X0 = x0;
    this.Y0 = y0;
    this.X1 = x1;
    this.Y1 = y1;
    this.DX = x1-x0;
    this.DY = y1-y0;
    this.ClearColor = null;
    
    this.Mapper = new rect_mapper(x0, y0, x1, y1, dimx, dimy);
    
    var c1 = this.Mapper.map_xy(x0, y0);
    var c2 = this.Mapper.map_xy(x1, y1);
    var c3 = this.Mapper.map_xy(0,0);

    this.CX = (x0 + x1)/2;
    this.CY = (y0 + y1)/2;

    this.CenterPull = 0.00; 
       
    this.Ctx = this.C.getContext("2d");
    
    this.resize = function(w, h)
    {
        this.DimX = w;
        this.DimY = h;
        this.C.setAttribute("width", w);
        this.C.setAttribute("height", h);
        this.Mapper = new rect_mapper(this.X0, this.Y0, this.X1, this.Y1, w, h);
        
        this.Ctx.fillStyle = this.ClearColor;
        this.Ctx.fillRect(0, 0, this.DimX, this.DimY);
    }
    
    this.resize(dimx, dimy);
    
    this.points = function(points, color, alpha)
    {
        // color is list of 3 floats from 0 to 1
        this.Ctx.globalAlpha = alpha;
        this.Ctx.fillStyle = 'rgb(' + Math.floor(color[0]*256) + ',' +  Math.floor(color[1]*256) + ',' +  Math.floor(color[2]*256) + ')';
        var sx = 0.0;
        var sy = 0.0;

        for( p of points )
        {        
            const x = p[0];
            const y = p[1];
            sx += x;
            sy += y;
            const mapped = this.Mapper.map_xy(x-this.CX, y-this.CY);
            const ix = Math.floor(mapped[0]);
            const iy = Math.floor(mapped[1]);
            this.Ctx.fillRect(ix, iy, 2, 2);
        }
        var cx = sx/points.length;
        var cy = sy/points.length;

        // pull center
        this.CX += this.CenterPull*(cx - this.CX);
        this.CY += this.CenterPull*(cy - this.CY);
    }
    
    this.clear = function(color, alpha)
    {
        this.Ctx.globalAlpha = alpha;
        this.ClearColor = this.Ctx.fillStyle = 'rgb(' + Math.floor(color[0]*256) + ',' +  Math.floor(color[1]*256) + ',' +  Math.floor(color[2]*256) + ')';
        this.Ctx.fillRect(0, 0, this.DimX, this.DimY);
    }
}

