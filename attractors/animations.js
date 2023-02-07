class SingleAttractorAnimation
{
    constructor(np, canvas_element, attractor_class, options)
    {
        if( options == null )
            options = {};
        this.NP = np;
        this.D = new attractor_class(this.NP, options);
        this.DT = options.dt == null ? 0.01 : options.dt;
        this.margin = 0;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const xmin = this.D.XMin;
        const xmax = this.D.XMax;
        this.C = new Canvas2(canvas_element, w, h, xmin[0], xmin[1], xmax[0], xmax[1]);
        this.ClearColor = [0,0,0];
        const qexp = this;
        window.onresize = function() {
            qexp.resize();
        };
        this.C.clear(this.ClearColor, 1.0);
        this.PMorpher = new Morpher(this.D.PMin, this.D.PMax);
        //var D = new DeJong(0,0,0,0);
        const Skip = 10;
        this.Colors = new ColorChanger();
        var params = this.PMorpher.step(this.DT);
        for( var t = 0; t < Skip; t++ )
            this.D.step(params);
        this.FrameInterval = 1.0/15 * 1000; // frame interval in milliseconds
        this.Animating = false;
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
        const params = this.PMorpher.step(this.DT);
        const points = this.D.step(params);
        this.C.clear(this.ClearColor, 0.05);
        this.C.points(points, c, 0.1);
        this.C.render();
    }
    
    animate_one_frame__()
    {
        const qexp = this;
        this.step();
        if( qexp.Animating )
        {
            window.requestAnimationFrame(function() 
                {
                    qexp.animate_one_frame()
                }
            );
        }
    }

    animate_one_frame()
    {
        if( this.Animating )
            setTimeout(
                function (animation) {
                    window.requestAnimationFrame(function() 
                        {
                            animation.animate_one_frame()
                        }
                    )
                },
                this.FrameInterval, 
                this
            );
        this.step();
    }

    start()
    {
        this.Animating = true;
        const qexp = this;
        window.requestAnimationFrame(function() 
            {
                qexp.animate_one_frame()
            }
        );
    }
    
    stop()
    {
        this.Animating = false;
    }
}

class DuelingAttractorsAnimation
{
    constructor(np, canvas_element, attractor_class, options)
    {
        if( options == null )
            options = {};
        const options1 = Object.assign({}, options, options.attractors == null || options.attractors[0] == null ? {} : options.attractors[0]);
        const options2 = Object.assign({}, options, options.attractors == null || options.attractors[1] == null ? {} : options.attractors[1]);
        this.NP = 40000;
        this.D1 = new attractor_class(this.NP, options1);
        this.D2 = new attractor_class(this.NP, options2);
        this.M1 = new Morpher(this.D1.PMin, this.D1.PMax);
        this.M2 = new Morpher(this.D2.PMin, this.D2.PMax);
        this.SBM = new Morpher([0.2, 0.05], [0.8, 0.2]);
        this.DT = options.dt == null ? 0.02 : options.dt;
        this.Mix = options.mix == null ? 0.01 : options.mix;
        this.Share = options.share;
        this.Beta = options.beta;

        this.margin = 0;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const xmin = this.D1.XMin;
        const xmax = this.D1.XMax;
        this.C = new Canvas2(canvas_element, w, h, xmin[0], xmin[1], xmax[0], xmax[1]);
        this.C.resize(w-this.margin*2, h-this.margin*2);
        this.ClearColor = [0,0,0];

        this.window_resized = function(event)
        {
            const w = window.innerWidth;
            const h = window.innerHeight;
            this.C.resize(w-margin*2, h-margin*2);
        }
        const q = this;
        window.onresize = function() {
            q.resize();
        };

        this.C.clear(this.ClearColor, 1.0);
        //var D = new DeJong(-1.24, 1.43, -1.65, -1.43);
    
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
    
        this.beta_share = function()
        {
            const sb = this.SBM.step(0.03);
            const share = this.Share == null ? sb[0] : this.Share;
            const beta = this.Beta == null ? sb[1] : this.Beta;
            return {
                share: share,
                beta: beta
            }
        }
        
        const sb = this.beta_share()
        const beta = sb.beta
    
        //var D = new DeJong(0,0,0,0);
        this.Colors1 = new ColorChanger();
        this.Colors2 = new ColorChanger();

        const p12 = this.params12(this.DT, this.M1, this.M2, beta);
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
        const sb = this.beta_share()
        const beta = sb.beta
        const share = sb.share;
    
        const p12 = this.params12(this.DT, this.M1, this.M2, beta);
        const p1 = p12[0];
        const p2 = p12[1];

        //share = share*share;
    
        var points1 = this.D1.step(p1);
        var points2 = this.D2.step(p2);
        this.C.clear(this.ClearColor, 0.05);
        var s1 = share;
        var s2 = 1-share;
        if( s1 > s2 )
        {
            s2 = s2/s1 * 0.1;
            s1 = 0.1;
        }
        else
        {
            s1 = s1/s2 * 0.1;
            s2 = 0.1;
        }
        this.C.points(points1, c1, s1);
        this.C.points(points2, c2, s2);

        // mix points
        if( this.Mix > 0 )
            for( let i = 0; i < points1.length; i++ )
                if( Math.random() < this.Mix )
                {
                    var tmp = points1[i];
                    points1[i] = points2[i];
                    points2[i] = tmp;
                }
        this.C.render();
    }
    
    animate_one_frame__()
    {
        const qexp = this;
        this.step();
        if( qexp.Animating )
        {
            window.requestAnimationFrame(function() 
                {
                    qexp.animate_one_frame()
                }
            );
        }
    }

    animate_one_frame()
    {
        if( this.Animating )
            setTimeout(
                function (animation) {
                    window.requestAnimationFrame(function() 
                        {
                            animation.animate_one_frame()
                        }
                    )
                },
                this.FrameInterval, this
            );
        this.step();
    }

    start()
    {
        this.Animating = true;
        this.animate_one_frame();
    }
    
    stop()
    {
        this.Animating = false;
    }

    resize()
    {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.C.resize(w-this.margin*2, h-this.margin*2);
    };   
}

