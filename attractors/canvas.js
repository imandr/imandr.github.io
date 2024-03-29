let RectMapper = class {
    constructor(x0, y0, x1, y1, w, h)
    {
        const gpu = create_GPU();
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


class Canvas
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
                if( v > 0 && v <= 10 )
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
                this.Ctx.fillRect(ix-1, iy, 1.3, 0.7);
            else
                this.Ctx.fillRect(ix, iy-1, 0.7, 1.3);
                
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

class RectMapper2 {
    constructor(x0, y0, x1, y1, w, h)
    {
        const gpu = create_GPU();
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
            function(points, params)
            {
                const s = params[0];
                const cx = params[1];
                const cy = params[2];
                const cw = params[3];
                const ch = params[4];
                return [
                    Math.round(cw + (points[this.thread.x][0]-cx)*s),
                    Math.round(ch + (points[this.thread.x][1]-cy)*s)
                ];
            }, 
            {
                dynamicOutput: true
            }
        );
    }
    
    map(points, scale, cx, cy, w, h)
    {
        this.map_kernel.setOutput([points.length]);
        return this.map_kernel(points, [scale, cx, cy, w/2, h/2]);
    }
}



class Canvas2
{
    resize(w, h)
    {
        this.DimX = w;
        this.DimY = h;
        this.C.setAttribute("width", w);
        this.C.setAttribute("height", h);
        this.Mapper = new RectMapper2(this.X0, this.Y0, this.X1, this.Y1, w, h);
        
        this.Ctx.fillStyle = this.ClearColor;
        this.Ctx.fillRect(0, 0, this.DimX, this.DimY);
    }
    
    constructor(canvas_element, dimx, dimy, x0, y0, x1, y1, options)
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
        this.Beta = 0.1;
        this.FirstUpdate = true;
        this.Margin = 0.38;
        this.DimX = dimx;
        this.DimY = dimy;
        this.PixelSize = (options == null || options.pixel_size == null ) ? 1.0 : options.pixel_size;

        const scale_x = dimx/(x1-x0);
        const scale_y = dimy/(y1-y0);

        this.Scale = scale_x < scale_y ? scale_x : scale_y;

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
                if( v > 0 && v < 50 )
                {
                    bitmap[i] = Math.floor(bitmap[i] * 0.9);
                    bitmap[i+1] = Math.floor(bitmap[i+1] * 0.9);
                    bitmap[i+2] = Math.floor(bitmap[i+2] * 0.9);
                }
            }
        
            this.Ctx.putImageData(image, 0, 0);
            this.NextClean = this.CleanInterval;
        }

        this.__update = function(points)
        {
            var xmin = points[0][0],
                ymin = points[0][1];
            var xmax = xmin, ymax = ymin;
            var beta = this.FirstUpdate ? 1.0 : this.Beta;
            for( const point of points )
            {
                const x = point[0];
                const y = point[1];
                if( x < xmin )  xmin = x;
                else if( x > xmax ) xmax = x;
                if( y < ymin )  ymin = y;
                else if( y > ymax ) ymax = y;
            }
            const scale_x = this.DimX/(xmax-xmin+0.001);
            const scale_y = this.DimY/(ymax-ymin+0.001);
            const scale_target = (scale_x < scale_y ? scale_x : scale_y)/(1.0 + this.Margin);
            const cx_target = (xmax+xmin)/2;
            const cy_target = (ymax+ymin)/2;
            if ( !this.FirstUpdate && this.Scale < scale_target )
                beta = beta/2;
            this.Scale += beta*(scale_target - this.Scale);
            this.CX += beta*(cx_target - this.CX);
            this.CY += beta*(cy_target - this.CY);
            this.FirstUpdate = false;
        }
        
        const gpu = create_GPU();
        this.range_kernel = gpu.createKernel(
            function(points, n, fragment)
            {
                const i0 = this.thread.x*fragment;
                const i1 = i0 + fragment;
                var xmax = points[i0][0];
                var ymax = points[i0][1];
                var xmin = xmax;
                var ymin = ymax;
                for( let i = i0+1; i < i1 && i < n; i++ )
                {
                    const x = points[i][0];
                    const y = points[i][1];
                    if( x > xmax )  xmax = x;
                    if( x < xmin )  xmin = x;
                    if( y > ymax )  ymax = y;
                    if( y < ymin )  ymin = y;
                }
                return [xmin, xmax, ymin, ymax];
            },
            { dynamicOutput: true }
        );

        this.update = function(points)
        {
            const fragment = 100;
            const nfragments = Math.ceil(points.length/fragment)
            this.range_kernel.setOutput([nfragments]);
            const fragment_ranges = this.range_kernel(points, points.length, fragment);
            
            var xmin = fragment_ranges[0][0],
                xmax = fragment_ranges[0][1],
                ymin = fragment_ranges[0][2],
                ymax = fragment_ranges[0][3];

            var xsum = 0,
                ysum = 0,
                nranges = 0;

            for( const range of fragment_ranges )
            {
                const   x0 = range[0],
                        x1 = range[1],
                        y0 = range[2],
                        y1 = range[3];
                if( x0 < xmin )  xmin = x0;
                if( x1 > xmax )  xmax = x1;
                if( y0 < ymin )  ymin = y0;
                if( y1 > ymax )  ymax = y1;
                xsum += (x0 + x1)/2;
                ysum += (y0 + y1)/2;
                nranges += 1;
            }
            var beta = this.FirstUpdate ? 1.0 : this.Beta;
            const scale_x = this.DimX/(xmax-xmin+0.001);
            const scale_y = this.DimY/(ymax-ymin+0.001);
            const scale_target = (scale_x < scale_y ? scale_x : scale_y)/(1.0 + this.Margin);
            const cx_target = xsum/nranges; //(xmax+xmin)/2;
            const cy_target = ysum/nranges; //(ymax+ymin)/2;
            if ( !this.FirstUpdate && this.Scale < scale_target )
                beta = beta/5;
            this.Scale += beta*(scale_target - this.Scale);
            this.CX += beta/5*(cx_target - this.CX);
            this.CY += beta/5*(cy_target - this.CY);
            this.FirstUpdate = false;
        }
    }

    points(points, colors, alpha)
    {
        // color is list of 3 floats from 0 to 1
        
        if( !Array.isArray(colors[0]) )
            colors = [colors];
        const NColors = colors.length;
        this.Ctx.globalAlpha = alpha;
        this.Ctx.strokeStyle = 'rgb(200, 200, 200)';
        var sx = 0.0;
        var sy = 0.0;

        this.update(points);

        var mapped = this.Mapper.map(points, this.Scale, this.CX, this.CY, this.DimX, this.DimY);
        
        var p;
        var xmin = mapped[0][0],
            ymin = mapped[0][1];
        var xmax = xmin, ymax = ymin;
        
        if( true )
            for( p of mapped )
            {
                const x = p[0];
                const y = p[1];
                if( x < xmin )  xmin = x;
                else if( x > xmax ) xmax = x;
                if( y < ymin )  ymin = y;
                else if( y > ymax ) ymax = y;
            }
        
        var icolor = -1;
        for( let i = 0; i < mapped.length; i++ )
        {   
            const p = mapped[i];
            const ic = i % NColors;
            if( ic != icolor )
            {
                const color = colors[ic];
                this.Ctx.fillStyle = 'rgb(' + Math.floor(color[0]*256) + ',' +  Math.floor(color[1]*256) + ',' +  Math.floor(color[2]*256) + ')';
                icolor = ic;
            }
            const ix = Math.floor(p[0]);
            const iy = Math.floor(p[1]);
            const size = this.PixelSize;
            if( Math.random() < 0 )
                this.Ctx.fillRect(ix-size/2, iy, size, size);
            else
                this.Ctx.fillRect(ix, iy-size/2, size, size);
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