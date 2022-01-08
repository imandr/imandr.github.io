function Morpher(lower, upper, beta, alpha, initial)
{
    this.Lower = lower;
    this.Dim = this.Lower.length;
    this.Upper = upper;
    this.Beta = beta;
    this.Alpha = alpha;
    this.P = initial;
    this.V = [];

    // initial velocity
    for( var i=0; i<this.Dim; i++ )
    {
        const dx = (this.Upper[i] - this.Lower[i])*this.Alpha;
        this.V.push((Math.random()*2-1)*dx);
    }

    function normal()
    {
        var x = Math.random() + Math.random() + Math.random() + Math.random();
        x += Math.random() + Math.random() + Math.random() + Math.random();
        x += Math.random() + Math.random() + Math.random() + Math.random();
        return x-6;
    }
    
    this.step = function()
    {
        var p = [];
        var v = [];
        
        for( var i = 0; i<this.Dim; i++ )
        {
            const x0 = this.Lower[i];
            const x1 = this.Upper[i];
            var v = this.V[i];
            const D = (x1 - x0)*this.Alpha;
            var x = this.P[i];
            
            var x2 = x + v;
            
            if( x2 + D*10 > x1 )
                x2 = x1 - D*10;
            else if( x2 - D*10 < x0 )
                x2 = x0 + D*10;
            
            xx = x2 + D*normal();

            if( xx > x1 ) 
                xx = x1;
            else if( xx < x0 )  
                xx = x0;
            
            this.V[i] = (xx - x)*this.Beta;
            
            var out = false;
            if( xx > x1 || xx < x0 )
                out = true;
            p.push(xx);
        }
        this.P = p;
        return p
    }
}