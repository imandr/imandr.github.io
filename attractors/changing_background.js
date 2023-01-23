let ChangingBackground = class
{
    constructor(canvas1, canvas2, classes)
    {
        this.Canvas1 = canvas1;
        this.Canvas2 = canvas2;
        this.Classes = classes;
        this.DisplayInterval = 30;
        this.FadeOutInterval = 2.0;
        this.FadeInInterval = 3.0;
        this.PrevCanvas = null;
        this.Canvas = null;
        this.Attractor = null;
        this.PrevAttractor = null;
        this.FadeInOpacity = 0.0;
        this.FadeOutOpacity = 1.0;

        this.random_attractor = function(canvas)
        {
            let i = Math.floor(Math.random() * this.Classes.length);
            return new this.Classes[i](canvas);
        }
        
        this.start_fade = function(canvas, target, callback, param)
        {
            let cnv = canvas;
            let op = cnv.style.opacity;
            let dt = 200;
            let n = Math.round(this.FadeInInterval*1000/dt);
            let delta = (target - op)/n;
            let handle = window.setInterval(
                function()
                {
                    let opacity = parseFloat(cnv.style.opacity);
                    if( (delta > 0 && opacity < 1.0) || (delta < 0 && opacity > 0.0) )
                    {
                        let op = opacity + delta;
                        if( op > 1.0 ) op = 1.0;
                        if( op < 0.0 ) op = 0.0;
                        cnv.style.opacity = op;
                    }
                    else
                    {
                        clearInterval(handle);
                        if( callback != null )
                            callback(param);
                    }
                },
                dt
            )
        }
    }

    start()
    {
        this.Canvas = this.Canvas1;
        this.PrevCanvas = this.Canvas2;
        this.Canvas.style.opacity = 0.0;
        this.PrevCanvas.style.opacity = 0.0;
        att.start();
        this.start_fade(this.Canvas, 1.0, function(){
            console.log("fade in done");
        }, null);
    }    
    
    flip()
    {
        let tmp = this.PrevCanvas;
        this.PrevCanvas = this.Canvas;
        this.Canvas = tmp;
        const att = this.random_attractor(this.Canvas);
        
    }
}