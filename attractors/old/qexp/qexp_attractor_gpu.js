//
// Unified attractor interface:
//
//      constructor:
//              X()             - does not initalize, use init() later
//              X(n)            - randomly generate n points
//              X(points)       - initialize with given points
//
//      PMin, PMax -> parameter min and max values, attribute
//      XMin, XMax -> field range, vectors, attribute, may be approximate, use as suggestion
//      PDim -> number of parameters, attribute
//      XDim -> field dimension, e.g. 2, 3, attribute
//      init(points) - init with set of points - must match the dimension
//      init(n)      - init with n random points
//      step(params) -> new points
//      points() -> current points
//


let QubicExpGPU = class
{
    constructor(np, kick)
    {
        this.Rate = 0.02;
        this.PMin = [-1.2, -1.2, 0.2, 0.2];
        this.PMax = [1.2,  1.2,  1.2,  1.2];
        const R = 3.0;
        this.XMin = [-R, -R];
        this.XMax = [R, R];
        this.XDim = 2;
        this.PDim = 4;
        this.NP = np;
        this.Kick = kick == null ? 0.01 : kick;
        this.Points = [];
        const gpu = new GPU();

        function G(x)
        {
            return 3*(x*x*x-1.2*x)/Math.cosh(2*x);
        }
    
        function F(x)
        {
            return (1-3.5*x*x)/Math.cosh(2*x);
        }
    
        function H(x)
        {
            return 2.3*x/Math.cosh(2*x);
        }

        gpu.addFunction(G);
        gpu.addFunction(F);
        gpu.addFunction(H);
        this.qexp_kernel = gpu.createKernel(
            function(points, params)
            {
                const A = params[0];
                const B = params[1];
                const C = params[2];
                const D = params[3];
                const x = points[this.thread.x][0];
                const y = points[this.thread.x][1];
                return [
                        F(A*x) + H(B*y),
                        F(C*y) + H(D*x)
                    ];
            },
            { output: [this.NP] }
        );

        this.normal = function()
        {
            return Math.random() + Math.random() + Math.random() + Math.random()
                + Math.random() + Math.random() + Math.random() + Math.random()
                + Math.random() + Math.random() + Math.random() + Math.random()
                - 6.0;
        }

        this.random_point = function()
        {
            return [this.normal(), this.normal()];
        }

        this.Points = [];
        for( let i = 0; i < np; i++ )
            this.Points.push(this.random_point());
    }

    step(params)
    {
        if(this.Kick > 0.0)
            for(let i = 0; i < this.Points.length; i++)
                if( Math.random() < this.Kick )
                {
                    this.Points[i] = this.random_point()
                }
        this.Points = this.qexp_kernel(this.Points, params);
        return this.Points;
    }
}

let SingleQExpGPU = class
{
    constructor(canvas_element)
    {
        this.NP = 50000;
        this.D = new QubicExpGPU(this.NP, 0.03);
        this.margin = 0;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const xmin = this.D.XMin;
        const xmax = this.D.XMax;
        this.C = new Canvas(canvas_element, w, h, xmin[0], xmin[1], xmax[0], xmax[1]);
        this.ClearColor = [0,0,0];
        const qexp = this;
        window.onresize = function() {
            qexp.resize();
        };
        this.C.clear(this.ClearColor, 1.0);
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

let DuelingQExpGPU = class
{
    constructor(canvas_element)
    {
        const NP = 40000;
        this.D1 = new QubicExpGPU(NP, 0.03);
        this.D2 = new QubicExpGPU(NP, 0.03);
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
        this.C.clear(this.ClearColor, 0.2);
        this.C.points(points1, c1, 0.2*share);
        this.C.points(points2, c2, 0.2*(1-share));

        // mix points
        const mix_ratio = 0.01;
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

let TripleQExp = class
{
    constructor(canvas_element)
    {
        const NP = 30000;
        this.DT = 0.02;
        const Beta = 0.1;
        this.D1 = new QubicExpGPU(NP, this.DT);
        this.D2 = new QubicExpGPU(NP, this.DT);
        this.D3 = new QubicExpGPU(NP, this.DT);
        this.margin = 0;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const xmin = this.D1.XMin;
        const xmax = this.D1.XMax;
        this.C = new Canvas(canvas_element, w, h, xmin[0], xmin[1], xmax[0], xmax[1]);
        //this.C.resize(w-this.margin*2, h-this.margin*2);
        this.ClearColor = [0,0,0];

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
        this.M3 = new Morpher(this.D3.PMin, this.D3.PMax);
    
        this.params123 = function(dt, m1, m2, m3, beta1, beta2)
        {
            var p1 = m1.step(dt);
            var p2 = m2.step(dt);
            var p3 = m2.step(dt);
            var p2_1 = [];
            var p3_1 = [];
            for( let i = 0; i < p1.length; i++ )
            {
                const p = p2[i]*beta1 + p1[i]*(1-beta1);
                p2_1.push(p);
                p3_1.push(p3[i]*beta2 + p*(1-beta2));
            }
            return [p1, p2_1, p3_1];
        }

        this.ShareBetaMorpher = new Morpher([0.2, 0.2, 0.05, 0.1], [0.8, 0.8, 0.2, 0.4]);    
        this.shares_beta = function()
        {
            const s = this.ShareBetaMorpher.step(this.DT);
            return [s[0], (1.0-s[0])*s[1], (1.0-s[0])*(1.0-s[1]), s[2], s[3]*s[3]];
        }
    
        this.Colors1 = new ColorChanger();
        this.Colors2 = new ColorChanger();
        this.Colors3 = new ColorChanger();

        const sb = this.shares_beta();

        const p123 = this.params123(this.DT, this.M1, this.M2, this.M3, sb[3], sb[4]);
        const p1 = p123[0], p2 = p123[1], p3=p123[2];

        const Skip = 10;
        for( var t = 0; t < Skip; t++ )
        {
            this.D1.step(p1);
            this.D2.step(p2);
            this.D3.step(p3);
        }
    }
    
    step()
    {
        var c1 = this.Colors1.next_color();
        var c2 = this.Colors2.next_color();
        var c3 = this.Colors3.next_color();
        for( let i = 0; i < 3; i++ )
        {
            c2[i] = (2*c2[i] + c1[i])/3;
            c3[i] = (2*c3[i] + c2[i])/3;
        }
        const sb = this.shares_beta();
        const s1 = sb[0], s2 = sb[1], s3 = sb[2];
        const beta1 = sb[3], beta2 = sb[4];
    
        const p123 = this.params123(this.DT, this.M1, this.M2, this.M3, beta1, beta2);
        const p1 = p123[0], p2 = p123[1], p3=p123[2];

        //share = share*share;
    
        var points1 = this.D1.step(p1);
        var points2 = this.D2.step(p2);
        var points3 = this.D3.step(p3);
        this.C.clear(this.ClearColor, 0.2);
        this.C.points(points1, c1, 0.2*s1);
        this.C.points(points2, c2, 0.2*s2);
        this.C.points(points3, c3, 0.2*s3);

        // mix points
        const mix_ratio = 0.03;
        for( let i = 0; i < points1.length; i++ )
        if( Math.random() < mix_ratio )
        {
            var tmp = points1[i];
            points1[i] = points2[i];
            points2[i] = points3[i];
            points3[i] = tmp;
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