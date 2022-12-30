let SingleCubicGPU = class
{
    constructor(canvas_element)
    {
        this.margin = 0;
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.C = new Canvas(canvas_element, w, h, -3.5, -3.5, 3.5, 3.5);
        this.ClearColor = [0,0,0];
        const qexp = this;
        window.onresize = function() {
            qexp.resize();
        };
        this.C.clear(this.ClearColor, 1.0);
        this.NP = 50000;
        this.D = new CubicGPU(this.NP, 0.001);
        this.PMorpher = new Morpher(this.D.PMin, this.D.PMax);
        //var D = new DeJong(0,0,0,0);
        const Skip = 10;
        this.DT = 0.01;
        this.Colors = new ColorChanger();
        var params = this.PMorpher.step(this.DT);
        for( var t = 0; t < Skip; t++ )
            this.D.step(params);
    }

    resize()
    {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.C.resize(w-this.margin*2, h-this.margin*2);
    };

    step()
    {
        const c = this.Colors.next_color();
        const params = this.PMorpher.step(this.DT);; 
        const points = this.D.step(params);
        this.C.clear(this.ClearColor, 0.2);
        this.C.points(points, c, 0.2);
        this.C.render();
    }

    animate_one_frame()
    {
        const qexp = this;
        this.step();
        window.requestAnimationFrame(function() 
            {
                qexp.animate_one_frame()
            }
        );
    }

    start()
    {
        const qexp = this;
        window.requestAnimationFrame(function() 
            {
                qexp.animate_one_frame()
            }
        );
    }
}
