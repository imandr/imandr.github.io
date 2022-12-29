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
            Math.floor(this.CW + (x-this.CX)*this.Scale),
            Math.floor(this.CH + (y-this.CY)*this.Scale)
        ];
    }

    this.map_point = function(p)
    {
        return this.map_xy(p[0], p[1]);
    }
    
    this.map = function(points)
    {
        var out = [];
        for( p of points )
        {
            out.push(this.map_point(p));
        }
        return out;
    }
}

let RectMapper = class {
    constructor(gpu, x0, y0, x1, y1, w, h)
    {
        this.CH = h/2;
        this.CW = w/2;
        this.Width = w;
        this.Height = h;
        this.DX = x1-x0;
        this.DY = y1-y0;
        this.CX = x0 + this.DX/2;
    	this.CY = y0 + this.DY/2;

        let scalex = w/this.DX;
        let scaley = h/this.DY;
        this.map_kernel = gpu.createKernel(
            function(points)
            {
                return [
                    Math.floor(this.constants.CW + (points[this.thread.x][0]-this.constants.CX)*this.constants.Scale),
                    Math.floor(this.constants.CH + (points[this.thread.x][1]-this.constants.CY)*this.constants.Scale)
                ];
            }, 
            {
                dynamicOutput: true,
                constants:{
                    CW: this.CW,
                    CH: this.CH,
                    CX: this.CX,
                    CY: this.CY,
                    Width: this.Width,
                    Height: this.Height,
                    Scale: scalex < scaley ? scalex : scaley
                }
            }
        );
    }
    
    map(points)
    {
        this.map_kernel.setOutput([points.length]);
        return this.map_kernel(points);
    }
}

function canvas(canvas_element, dimx, dimy, x0, y0, x1, y1)
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
    this.ClearColor = null;
    this.Pixmap = null;
    
    this.CX = (x0 + y1)/2;
    this.CY = (y0 + x1)/2;
       
    this.Ctx = this.C.getContext("2d");
    this.NextClean = 10;
    this.ImageData = null;
    
    this.resize = function(w, h)
    {
        this.DimX = w;
        this.DimY = h;
        this.C.setAttribute("width", w);
        this.C.setAttribute("height", h);
        //this.Mapper = new RectMapper(new GPU(), this.X0, this.Y0, this.X1, this.Y1, w, h);
        this.Mapper = new rect_mapper(this.X0, this.Y0, this.X1, this.Y1, w, h);
        
        this.Ctx.fillStyle = this.ClearColor;
        this.Ctx.fillRect(0, 0, this.DimX, this.DimY);
        this.Pixels = new Float32Array(w*h*3);
        this.Pixels.fill(0.0);
        this.ImageData = new ImageData(w, h);
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
        this.NextClean = 100;
    }

    this.points = function(points, color, alpha)
    {
        const coords = this.Mapper.map(points);
        for( let point of coords )
        {
            const ix = point[0];
            const iy = point[1];
            if( ix >= 0 && ix < this.Width && iy >= 0 && iy < this.Height )
            {
                const k = 3*(iy*this.Width + ix);
                this.Pixels[k] = (1-alpha)*this.Pixels[k] + alpha*color[0];
                this.Pixels[k+1] = (1-alpha)*this.Pixels[k+1] + alpha*color[1];
                this.Pixels[k+2] = (1-alpha)*this.Pixels[k+2] + alpha*color[2];
            }
        }
    }
    
    this.clear = function(color, alpha)
    {
        for( let i in this.Pixels )
            this.Pixels[i] = this.Pixels[i]*(1-alpha) + color[i%3]*alpha;
    }
    
    this.render = function()
    {
        var bitmap = this.ImageData.data;
        var i, j;
        for( i = j = 0; i < this.Pixels.length; i += 3, j += 4 )
        {
            bitmap[j] = Math.floor(this.Pixels[i]*256); 
            bitmap[j+1] = Math.floor(this.Pixels[i+1]*256); 
            bitmap[j+2] = Math.floor(this.Pixels[i+2]*256);
            bitmap[j+3] = 255;
        }
        this.Ctx.putImageData(this.ImageData, 0, 0);
    }
}

