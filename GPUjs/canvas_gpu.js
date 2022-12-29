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


let GPUCanvas = class {
    
    constructor(canvas_element, x0, y0, x1, y1)
    {
        this.C = canvas_element;
        this.X0 = x0;
        this.Y0 = y0;
        this.X1 = x1;
        this.Y1 = y1;
        this.Width = null;
        this.Height = null;
        this.Pixels = null;
        this.Mapper = null;
        /*
        this.fade_kernel = this.GPU.createKernel(function(pixels)
            {
                const color = this.constants.color;
                this.color(color[0], color[1], color[2], 1.0);
            },
            {   graphical:true, dynamicOutput:true  }
        );
        */
        
    }
    
    clear(color, alpha)
    {
        const pixels = this.clear_kernel(this.Pixels, color, alpha);
        this.Pixels = pixels;
    }
    
    resize(w, h)
    {
        this.Width = w;
        this.Height = h;
        var tmpw = this.C.getAttribute("width");
        var tmph = this.C.getAttribute("width");
        this.C.setAttribute("width", w);
        this.C.setAttribute("height", h);
        this.GPU_render = new GPU({canvas: canvas});
        this.GPU_calc = new GPU();
        this.Mapper = new RectMapper(this.GPU_calc, this.X0, this.Y0, this.X1, this.Y1, w, h);
        this.Pixels = new Float32Array(w*h*3);
        this.Pixels.fill(0.0);

        this.render_kernel = this.GPU_render.createKernel(function(pixels)
            {
                const i = 3*(this.thread.y*this.constants.Width + this.thread.x);
                this.color(pixels[i], pixels[i+1], pixels[i+2], 1.0);
            },
            {
                graphical: true,
                output: [w, h],
                constants: {
                    Width: w
                }
            }
        )

        this.clear_kernel = this.GPU_calc.createKernel(function(pixmap, color, alpha)
            {
                return pixmap[this.thread.x] * (1.0 - alpha) + color[this.thread.x % 3] * alpha;
            },
            {
                output:[3*w*h]  
            }
        );

        this.render();
    }
    
    render()
    {
        this.render_kernel(this.Pixels);
    }
    
    points(points, color, alpha)
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
}
