function rect_mapper(x0, y0, x1, y1, w, h, mode)
{
	// mode is ignored for now
    this.CH = h/2;
    this.CW = w/2;
    
    this.X0 = x0;
    this.Y0 = y0;
    this.DX = x1-x0;
    this.DY = y1-y0;
    this.CX = x0 + this.DX/2;
	this.CY = y0 + this.DY/2;
	
    var scalex = w/this.DX;
    var scaley = h/this.DY;

    this.Scale = scalex < scaley ? scalex : scaley;
	
    this.map_xy = function(x, y)
    {
        return [
            this.CW + (x-this.CX)*this.Scale,
            this.CH + (y-this.CY)*this.Scale
        ];
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

function adjustable_mapper(x0, y0, x1, y1, w, h, options)
{
	// mode is ignored for now
    this.H = h;
    this.W = w;
    this.CH = h/2;
    this.CW = w/2;
    
    this.Beta = 0.0;
    this.Margin = 0.2;
    if( options != null )
    {
        if( options.beta != null )
            this.Beta = options.beta;
        if( options.margin != null )
            this.Margin = options.margin;
    }

    // initial values
    this.DX = x1-x0;
    this.DY = y1-y0;
    this.CX = x0 + this.DX/2;
	this.CY = y0 + this.DY/2;
    
    this.scale = function()
    {
        const sx = this.W/this.DX;
        const sy = this.H/this.DY;
        return sx > sy ? sy : sx;
    }
    
    this.update = function(points)
    {
        var xmin = null,
            xmax = null,
            ymin = null,
        ymax = null;
        for( p of points )
        {
            const x = p[0];
            const y = p[1];
            if( xmin == null )
            {
                xmin = xmax = x;
                ymin = ymax = y;
            }
            else
            {
                if( x > xmax )  xmax = x;
                else if( x < xmin ) xmin = x;
                if( y > ymax )  ymax = y;
                else if( y < ymin ) ymin = y;
            }
        }

        const cx_target = (xmax + xmin)/2;
        const cy_target = (ymax + ymin)/2;
        const dx_target = (1.0 + this.Margin) * (xmax - ymin);
        const dy_target = (1.0 + this.Margin) * (ymax - ymin);
        
        this.CX += this.Beta * (cx_target - this.CX);
        this.CY += this.Beta * (cy_target - this.CY);
        this.DX += this.Beta * (dx_target - this.DX);
        this.DY += this.Beta * (dy_target - this.DY);
    }
	
    this.map_xy = function(x, y, scale)
    {
        return [
            this.CW + (x-this.CX)*scale,
            this.CH + (y-this.CY)*scale
        ];
    }

    this.map_point = function(p, scale)
    {
        return this.map_xy(p[0], p[1], scale);
    }
    
    this.map_points = function(points)
    {
        var out = [];
        if( this.Beta > 0 )
            this.update(points);
        const scale = this.scale();
        for( p of points )
        {
            out.push(this.map_point(p, scale));
        }
        return out;
    }
}

function canvas(element_id, dimx, dimy, x0, y0, x1, y1, mapper_options)
{
	console.log("canvas: "+dimx+" "+dimy);
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
    this.MapperOptions = mapper_options;
    
    this.CX = (x0 + y1)/2;
    this.CY = (y0 + x1)/2;
       
    this.Ctx = this.C.getContext("2d");
    this.NextClean = 10;
    
    this.resize = function(w, h)
    {
        this.DimX = w;
        this.DimY = h;
        this.C.setAttribute("width", w);
        this.C.setAttribute("height", h);
        this.Mapper = new adjustable_mapper(this.X0, this.Y0, this.X1, this.Y1, w, h, this.MapperOptions);
        
        this.Ctx.fillStyle = this.ClearColor;
        this.Ctx.fillRect(0, 0, this.DimX, this.DimY);
    }
    
    this.resize(dimx, dimy);
    
    this.clean = function()
    {
        var image = this.Ctx.getImageData(0, 0, this.DimX, this.DimY);
        var bitmap = image.data;
        var i;

        for( i = 0; i < bitmap.length; i += 4 )
        {
            const r = bitmap[i];
            const g = bitmap[i+1];
            const b = bitmap[i+2];
            const v = r + g + b;
            if( v > 0 && v <= 6 )
                bitmap[i] = bitmap[i+1] = bitmap[i+2] = 0;
        }
        
        this.Ctx.putImageData(image, 0, 0);
        this.NextClean = 10;
        
    }

    this.points = function(points, color, alpha)
    {
        // color is list of 3 floats from 0 to 1
        this.Ctx.globalAlpha = alpha;
        this.Ctx.fillStyle = 'rgb(' + Math.floor(color[0]*256) + ',' +  Math.floor(color[1]*256) + ',' +  Math.floor(color[2]*256) + ')';
        var sx = 0.0;
        var sy = 0.0;

        var mapped = this.Mapper.map_points(points);

        for( p of mapped )
        {        
            const ix = Math.floor(p[0]);
            const iy = Math.floor(p[1]);
            this.Ctx.fillRect(ix, iy, 0.5, 0.5);
        }
        if( --this.NextClean <= 0 )
            this.clean();
    }
    
    this.clear = function(color, alpha)
    {
        this.Ctx.globalAlpha = alpha;
        this.ClearColor = this.Ctx.fillStyle = 'rgb(' + Math.floor(color[0]*256) + ',' +  Math.floor(color[1]*256) + ',' +  Math.floor(color[2]*256) + ')';
        this.Ctx.fillRect(0, 0, this.DimX, this.DimY);
    }
}

