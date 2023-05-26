class Trace
{
    constructor(npoints, attractor, dt)
    {
        this.NP = npoints;
        this.Att = attractor;
        this.DT = dt;
        this.T = 0;

        this.Points = [];
        this.V = [];                        // [icurve, ixy]
        
        for( let i=0; i<npoints; i++ )
        {
            const p = this.Att.random_point();
            this.Points.push(p);
            this.V.push([0.0, 0.0]);
        }

        this.Controls = null;               // [icurve, it, ixy]
        this.Polynomials = null;            // [icurve, ixy, iabcd]
        
        this.F = function(points, params)
        {
            var out = [];
            for( let p of points )
                out.push(this.Att.F(p[0], p[1], params));
            return out;
        }
        
        this.poly = function(t, abcd)
        {
            return ((abcd[0]*t + abcd[1])*t + abcd[2])*t + abcd[3];
        }

        this.poly_v = function(t, abcd)
        {
            return 3*abcd[0] + 2*abcd[1] + abcd[2];
        }

        this.positions = function(t)            // -> [icurve, ixy]
        {
            var out = [];
            for( let ic = 0; ic < this.NP; ic++ )
                out.push([this.poly(t, this.Polynomials[ic][0]), this.poly(t, this.Polynomials[ic][1])]);
            return out;
        }
        
        this.velocities = function(t)            // -> [icurve, ixy]
        {
            var out = [];
            for( let ic = 0; ic < this.NP; ic++ )
                out.push([this.poly_v(t, this.Polynomials[ic][0]), this.poly_v(t, this.Polynomials[ic][1])]);
            return out;
        }
        
        this.compute_trajectories = function(params)
        {
            this.Polynomials = [];              // [icurve, ixy, iabcd]
            var points = this.Points.slice();
            for( let ic = 0; ic < this.NP; ic++ )
            {
                var p = points[ic];
                var controls = [p];
                for( let t = 1; t <= 2; t++ )
                {
                    p = this.Att.F(p[0], p[1], params);
                    controls.push(p)
                }

                var curve_params = [];
                for( let i = 0; i < 2; i++ )
                {
                    const x0 = controls[0][i];
                    const x1 = controls[1][i];
                    const x2 = controls[2][i];
                    const v = this.V[ic][i];
                    curve_params.push([
                        x2/4 - x1 + v/2,
                        2*x1 - 3*v/2 - x2/4,
                        v,
                        x0
                    ]);
                }

                this.Polynomials.push(curve_params);
            }
        }
    }

    step(params)
    {
        if( this.Polynomials == null )
            this.compute_trajectories(params);

        this.T += this.DT;
        if( this.T >= 1.0 )
        {
            this.Points = this.positions(1.0);
            this.V = this.velocities(1.0);
            for( let i = 0; i < this.NP; i++ )
                if( Math.random() < 0.01 )
                {
                    this.Points[i] = [Math.random(), Math.random()];
                    this.V[i] = [0,0];
                }
            
            this.compute_trajectories(params);
            this.T = 0;
            return points;
        }
        else
        {
            return this.positions(this.T);
        }
    }
}