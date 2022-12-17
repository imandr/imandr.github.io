var dueling_dejong = {
    init: function(canvas_id, background)
        {
            const margin = 0;
            const w = window.innerWidth;
            const h = window.innerHeight;
            const MapperOptions = {beta:0.01};
            var C = new canvas(canvas_id, w-margin*2, h-margin*2, -2.5, -2.5, 2.5, 2.5, MapperOptions);
            var clear_rgb = [0,0,0];        // black by default
            if( background == "white" )
                clear_rgb = [1.0,1.0,1.0];

            function window_resized(event)
            {
                //var cw = document.body.clientWidth;
                //var ch = document.body.clientHeight;
                const w = window.innerWidth;
                const h = window.innerHeight;
                C.resize(w-margin*2, h-margin*2);
            }
            window_resized();
            window.onresize = window_resized;

            C.clear(clear_rgb, 1.0);
            //var D = new DeJong(-1.24, 1.43, -1.65, -1.43);
        
            const NP = 20000;
            var D1 = new DeJong(NP, 0.0);
            var D2 = new DeJong(NP, 0.0);
        
            var M1 = new Morpher(D1.PMin, D1.PMax);
            var M2 = new Morpher(D2.PMin, D2.PMax);
        
            function params12(dt, m1, m2, beta)
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
        
            var SBM = new Morpher([0.1, 0.1], [0.5, 0.3]);
            var sb = SBM.step(0.03);
        
        
            //var D = new DeJong(0,0,0,0);
            const Skip = 30;
            var Colors1 = new ColorChanger();
            var Colors2 = new ColorChanger();

            const dt = 0.02;
            var p12 = params12(dt, M1, M2, sb[1]);
            var p1 = p12[0], p2 = p12[1];

            for( var t = 0; t < Skip; t++ )
            {
                D1.step(p1);
                D2.step(p2);
            }
        
            function step()
            {
                var c1 = Colors1.next_color();
                var c2 = Colors2.next_color();
                for( let i = 0; i < 3; i++ )
                    c2[i] = (c2[i] + c1[i])/2;
                var sb = SBM.step(0.03);
                const share = sb[0];
                const beta = sb[1];
            
                p12 = params12(dt, M1, M2, beta);
                p1 = p12[0];
                p2 = p12[1];

                //share = share*share;
            
                var points1 = D1.step(p1);
                var points2 = D2.step(p2);
                C.clear(clear_rgb, 0.2);
                C.points(points1, c1, 0.3*share);
                C.points(points2, c2, 0.3*(1-share));

                // mix points
                const mix_ratio = 0.25;
                for( let i = 0; i < points1.length; i++ )
                    if( Math.random() < mix_ratio )
                    {
                        var tmp = points1[i];
                        points1[i] = points2[i];
                        points2[i] = tmp;
                    }
            }

            setInterval(step, 1000.0/15);
        }
    }