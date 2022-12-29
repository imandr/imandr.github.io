
let RectMapper = class {
    constructor(x0, y0, x1, y1, w, h)
    {
        const gpu = new GPU();
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


let Canvas = class
{
    resize(w, h)
    {
        this.DimX = w;
        this.DimY = h;
        this.C.setAttribute("width", w);
        this.C.setAttribute("height", h);
        this.Mapper = new RectMapper(this.X0, this.Y0, this.X1, this.Y1, w, h);
        
        this.Ctx.fillStyle = this.ClearColor;
        this.Ctx.fillRect(0, 0, this.DimX, this.DimY);
    }
    
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
        this.CX = (x0 + y1)/2;
        this.CY = (y0 + x1)/2;
        this.CleanInterval = 100;
       
        this.Ctx = this.C.getContext("2d");
        this.NextClean = this.CleanInterval;
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
            this.NextClean = this.CleanInterval;
        
        }
    }

    
    points(points, color, alpha)
    {
        // color is list of 3 floats from 0 to 1
        this.Ctx.globalAlpha = alpha;
        this.Ctx.fillStyle = 'rgb(' + Math.floor(color[0]*256) + ',' +  Math.floor(color[1]*256) + ',' +  Math.floor(color[2]*256) + ')';
        var sx = 0.0;
        var sy = 0.0;

        var mapped = this.Mapper.map(points);

        for( let p of mapped )
        {        
            const ix = Math.floor(p[0]);
            const iy = Math.floor(p[1]);
            if( Math.random() < 0.5 )
                this.Ctx.fillRect(ix-1, iy, 3.5, 0.7);
            else
                this.Ctx.fillRect(ix, iy-1, 0.7, 3.5);
                
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