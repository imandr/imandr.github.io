class SingleAttractorAnimation
{
    constructor(np, canvas_element, attractor_class, options)
    {
        if( options == null )
            options = {};
        this.NP = np;
        this.StepCallback = options.step_callback;
        this.D = new attractor_class(this.NP, options);
        this.DT = options.dt == null ? 0.03 : options.dt;
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
        this.PMorpher = new Drifter(this.D.PMin, this.D.PMax);
        //var D = new DeJong(0,0,0,0);
        const Skip = 100;
        this.Colors = new ColorChanger();
        var params = this.PMorpher.step(this.DT);
        for( var t = 0; t < Skip; t++ )
            this.D.step(params);
        this.FrameInterval = 1.0/10 * 1000; // frame interval in milliseconds
        this.Animating = false;
        this.L = null;
        this.T = 0;
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
        const dt = this.D.LyapunovLog < 0.0 ? this.DT * 5 : this.DT;
        const params = this.PMorpher.step(dt);
        const points = this.D.step(params);
        this.C.clear(this.ClearColor, 0.15);
        this.C.points(points, c, 0.15);
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
        if( this.StepCallback != null )
            this.StepCallback(this);
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
    
    min_lyapunov_log()
    {
        return this.D.LyapunovLog;
    }
}

class ColoredAttractorAnimation
{
    constructor(np, canvas_element, attractor_class, options)
    {
        if( options == null )
            options = {};
        this.NP = np;
        this.D = new attractor_class(this.NP, options);
        this.DT = options.dt == null ? 0.03 : options.dt;
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
        const Skip = 100;
        this.Colors = new ColorChanger();
        var params = this.PMorpher.step(this.DT);
        for( var t = 0; t < Skip; t++ )
            this.D.step(params);
        this.FrameInterval = 1.0/10 * 1000; // frame interval in milliseconds
        this.Animating = false;
    }

    resize()
    {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.C.resize(w-this.margin*2, h-this.margin*2);
    };

    point_color(p)
    {
        const x = p[0], y = p[1];
        const xrel = (x-this.D.XMin[0])/(this.D.XMax[0]-this.D.XMin[0]);
        const yrel = (y-this.D.XMin[1])/(this.D.XMax[1]-this.D.XMin[1]);
        const zrel = 1 - Math.abs(xrel - yrel);
        return [xrel, yrel, zrel];
    }

    step()
    {
        const c = this.Colors.next_color();
        const params = this.PMorpher.step(this.DT);
        
        var colors = [];
        for( const p of this.D.Points )
            colors.push(this.point_color(p));
        
        const points = this.D.step(params);
        this.C.clear(this.ClearColor, 0.15);
        this.C.points(points, colors, 0.15);
        this.C.render();
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

class HSBAttractorAnimation
{
    constructor(np, canvas_element, attractor_class, options)
    {
        if( options == null )
            options = {};
        this.NP = np;
        this.D = new attractor_class(this.NP, options);
        this.DT = options.dt == null ? 0.03 : options.dt;
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
        const Skip = 100;
        this.HSB = new HSBMorpher();
        var params = this.PMorpher.step(this.DT);
        for( var t = 0; t < Skip; t++ )
            this.D.step(params);
        this.FrameInterval = 1.0/10 * 1000; // frame interval in milliseconds
        this.Animating = false;
    }

    resize()
    {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.C.resize(w-this.margin*2, h-this.margin*2);
    };

    point_color(p, hue)
    {
        const x = p[0], y = p[1];
        const xrel = (x-this.D.XMin[0])/(this.D.XMax[0]-this.D.XMin[0]);
        const yrel = (y-this.D.XMin[1])/(this.D.XMax[1]-this.D.XMin[1]);
        const zrel = ((xrel - yrel) + 1)/2;
        const s = 0.5 + 0.5*xrel;
        const b = 0.9 + 0.1*yrel;
        const h = zrel;
        return hsb_to_rgb([hue + h/3, s, b]);
    }

    step()
    {
        const hue = this.HSB.next_color()[0];
        const params = this.PMorpher.step(this.DT);
        
        var colors = [];
        for( const p of this.D.Points )
            colors.push(this.point_color(p, hue));
        
        const points = this.D.step(params);
        this.C.clear(this.ClearColor, 0.15);
        this.C.points(points, colors, 0.15);
        this.C.render();
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
        if( this.StepCallback != null )
            this.StepCallback(this);
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
        this.StepCallback = options.step_callback;
        this.NP = 40000;
        this.Beta = options.beta;
        var share_range = [0.4, 0.6];               // for homogenous mix
        if( Array.isArray(attractor_class) )
        {
            this.D1 = new attractor_class[0](this.NP, options1);
            this.D2 = new attractor_class[1](this.NP, options2);
            if( attractor_class[1] !== attractor_class[0] )
            {
                share_range = [0.3, 0.7];
                this.Beta = this.Beta != null ? this.Beta : 1.0;
            }
        }
        else
        {
            this.D1 = new attractor_class(this.NP, options1);
            this.D2 = new attractor_class(this.NP, options2);
        }
        this.M1 = new Morpher(this.D1.PMin, this.D1.PMax);
        this.M2 = new Morpher(this.D2.PMin, this.D2.PMax);
        this.SBM = new Morpher([share_range[0], 0.3], [share_range[1], 0.5]);
        this.DT = options.dt == null ? 0.03 : options.dt;
        this.Mix = options.mix == null ? 0.01 : options.mix;
        this.Share = options.share;
        this.FrameInterval = 1.0/15 * 1000; // frame interval in milliseconds

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
            beta = beta * beta;
            if( beta == 1.0 )
                return [p1, p2];
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
            var share;
            if( this.Share == null )
            {
                share = sb[0];
                if( share < 0.5 )
                    share = share * share * 2;
                else
                    share = 1.0 - (1-share)*(1-share)*2;
            }
            else
                share = this.Share;
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
		this.DColor = new Morpher([0.1, -0.2, -0.2], [0.2, 0.2, 0.2]);

        const p12 = this.params12(this.DT, this.M1, this.M2, beta);
        const p1 = p12[0], p2 = p12[1];

        const Skip = 200;
        for( var t = 0; t < Skip; t++ )
        {
            this.D1.step(p1);
            this.D2.step(p2);
        }
    }
    
    attractor_names()
    {
        return [this.D1.Name, this.D2.Name];
    }
    
    step()
    {
        var hsb1 = this.Colors1.next_hsb();
		const dcolor = this.DColor.step(0.01);
		var hsb2 = [
			hsb1[0] + dcolor[0],
			hsb1[1] + dcolor[1],
			hsb1[2] + dcolor[2]
		];
		if( hsb2[1] > 1.0 ) hsb2[1] = 1.0;
		if( hsb2[1] < 0.5 ) hsb2[1] = 0.5;
		if( hsb2[2] > 1.0 ) hsb2[2] = 1.0;
		if( hsb2[2] < 0.5 ) hsb2[2] = 0.5;
		
		const c1 = this.Colors1.hsb_to_rgb(hsb1);
		const c2 = this.Colors1.hsb_to_rgb(hsb2);
		
        const sb = this.beta_share()
        const beta = sb.beta
        var share = this.Share == null ? sb.share : this.Share;
    
        const dt1 = this.D1.LyapunovLog < -0 ? this.DT * 5 : this.DT;
        const dt2 = this.D2.LyapunovLog < -0 ? this.DT * 5 : this.DT;
    
        var p1 = this.M1.step(dt1);
        var p2 = this.M2.step(dt2);
        
        if( beta != 1.0 && p1.length == p2.length )
        {
            var new_p2 = [];
            for( let i = 0; i < p1.length; i++ )
                new_p2.push(p1[i] + beta * (p2[i] - p1[i]));
            p2 = new_p2;
        }
    
        //share = share*share;
    
        var points1 = this.D1.step(p1);
        var points2 = this.D2.step(p2);
        this.C.clear(this.ClearColor, 0.2);
        //share = 0.4;
        var s1 = share;
        var s2 = 1-share;
        if( s1 > s2 )
        {
            s2 = s2/s1;
            s1 = 1;
        }
        else
        {
            s1 = s1/s2;
            s2 = 1;
        }

        this.C.points(points1, c1, s1*0.2);
        this.C.points(points2, c2, s2*0.2);
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
        if( this.StepCallback != null )
            this.StepCallback(this);
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

    min_lyapunov_log()
    {
        const l1 = this.D1.LyapunovLog;
        const l2 = this.D2.LyapunovLog;
        return l1 < l2 ? l1 : l2;
    }
}

