let QExpTanh = class
{
    constructor(canvas_element)
    {
        const NP = 40000;
        this.D1 = new QubicExpGPU(NP, 0.03);
        this.D2 = new TanhAttGPU(NP, 0.03);
        this.margin = 0;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const xmin = this.D1.XMin;
        const xmax = this.D1.XMax;
        this.C = new Canvas(canvas_element, w, h, xmin[0], xmin[1], xmax[0], xmax[1]);
        //this.C.resize(w-this.margin*2, h-this.margin*2);
        this.ClearColor = [0,0,0];
        this.DT = 0.02;

        this.window_resized = function(event)
        {
            const w = window.innerWidth;
            const h = window.innerHeight;
            this.C.resize(w-margin*2, h-margin*2);
        }
        const qexp = this;
        window.onresize = function() {
            qexp.resize();
        };

        this.C.clear(this.ClearColor, 1.0);
        //var D = new DeJong(-1.24, 1.43, -1.65, -1.43);
    
    
        this.M1 = new Morpher(this.D1.PMin, this.D1.PMax);
        this.M2 = new Morpher(this.D2.PMin, this.D2.PMax);
    
        this.params12 = function(dt, m1, m2, beta)
        {
            var p1 = m1.step(dt);
            var p2 = m2.step(dt);
            var p1_1 = [];
            for( let i = 0; i < p1.length; i++ )
            {
                p1_1.push(p1[i]*beta + p2[i]*(1-beta));
            }
            return [p1_1, p2];
        }
    
        this.SBM = new Morpher([0.2, 0.1], [0.8, 0.2]);
        const sb = this.SBM.step(0.03);
    
    
        //var D = new DeJong(0,0,0,0);
        this.Colors1 = new ColorChanger();
        this.Colors2 = new ColorChanger();

        const p12 = this.params12(this.DT, this.M1, this.M2, sb[1]);
        const p1 = p12[0], p2 = p12[1];

        const Skip = 30;
        for( var t = 0; t < Skip; t++ )
        {
            this.D1.step(p1);
            this.D2.step(p2);
        }
    }
    
    step()
    {
        var c1 = this.Colors1.next_color();
        var c2 = this.Colors2.next_color();
        for( let i = 0; i < 3; i++ )
            c2[i] = (c2[i] + c1[i])/2;
        const sb = this.SBM.step(0.03);
        const share = sb[0];
        const beta = sb[1];
    
        const p12 = this.params12(this.DT, this.M1, this.M2, beta);
        const p1 = p12[0];
        const p2 = p12[1];

        //share = share*share;
    
        var points1 = this.D1.step(p1);
        var points2 = this.D2.step(p2);
        this.C.clear(this.ClearColor, 0.3);
        this.C.points(points1, c1, 0.3*share);
        this.C.points(points2, c2, 0.3*(1-share));

        // mix points
        const mix_ratio = 0.5;
        for( let i = 0; i < points1.length; i++ )
        if( Math.random() < mix_ratio )
        {
            var tmp = points1[i];
            points1[i] = points2[i];
            points2[i] = tmp;
        }
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
    
    resize()
    {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.C.resize(w-this.margin*2, h-this.margin*2);
    };
}