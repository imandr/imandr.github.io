var single_qexp = {
    init: function(canvas_element, background)
    {
        const margin = 0;
        const w = window.innerWidth;
        const h = window.innerHeight;
        var C = new canvas(canvas_element, w-margin*2, h-margin*2, -3.5, -3.5, 3.5, 3.5);
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
        //window_resized();
        window.onresize = window_resized;

        C.clear(clear_rgb, 1.0);

        //var D = new DeJong(-1.24, 1.43, -1.65, -1.43);
        const NP = 80000;
        var D = new QubicExp(NP, 0.01);
        var PMorpher = new Morpher(D.PMin, D.PMax);
        //var D = new DeJong(0,0,0,0);
        const Skip = 10;
        var Colors = new ColorChanger();
        const dt = 0.01;
        var params = PMorpher.step(dt);
        for( var t = 0; t < Skip; t++ )
            D.step(params);

        function step()
        {
            var c = Colors.next_color();
            params = PMorpher.step(0.02);; 
            points = D.step(params);
            C.clear(clear_rgb, 0.2);
            C.points(points, c, 0.3);
        }

        setInterval(step, 1000.0/10);
    }
}
