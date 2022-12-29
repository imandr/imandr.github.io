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

let Canvas = class
{
    constructor(canvas_element, dimx, dimy, x0, y0, x1, y1)
    {
        this.C = canvas_element;
        this.C.setAttribute("width", dimx);
        this.C.setAttribute("height", dimy);
        this.X0 = x0;
        this.Y0 = y0;
        this.X1 = x1;
        this.Y1 = y1;
        this.DX = x1-x0;
        this.DY = y1-y0;
        this.ClearColor = 'rgb(0,0,0)';        
    }

    this.CX = (x0 + y1)/2;
    this.CY = (y0 + x1)/2;
       
    this.Ctx = this.C.getContext("2d");
    const clean_interval = 100;
    this.NextClean = clean_interval;
    
    resize(w, h)
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
        this.NextClean = clean_interval;
        
    }

    points(points, color, alpha)
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
    
    clear(color, alpha)
    {
        this.Ctx.globalAlpha = alpha;
        this.ClearColor = this.Ctx.fillStyle = 'rgb(' + Math.floor(color[0]*256) + ',' +  Math.floor(color[1]*256) + ',' +  Math.floor(color[2]*256) + ')';
        this.Ctx.fillRect(0, 0, this.DimX, this.DimY);
    }
    
    render()
    { }
}

