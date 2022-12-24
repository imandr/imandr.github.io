var single_dejong = {
    init: function(canvas_id, background)
    {     
        const NP = 60000;
        const dt = 0.01;
        const margin = 0;
        const Kick = 0.01;
        const Skip = 10;

        const w = window.innerWidth;
        const h = window.innerHeight;
        const MapperOptions = {beta:0.0};
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
        var D = new DeJong(NP, Kick);
        //var D = new DeJong(0,0,0,0);
        var Colors = new ColorChanger();
        var PMorpher = new Morpher(D.PMin, D.PMax);
        var params = PMorpher.step(dt);

        for( var t = 0; t < Skip; t++ )
            D.step(params)
        
        function step()
        {
            var c = Colors.next_color();
            params = PMorpher.step(dt);; 
            points = D.step(params);
            C.clear(clear_rgb, 0.2);
            C.points(points, c, 0.3);
        }

        setInterval(step, 1000.0/15);
    }
}
