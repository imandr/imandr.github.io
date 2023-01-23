class ILorentzAttractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 2.2;
        const R = 30.0;
        const step_t = options.step_t == null ? 1.0;
        const step_dt = options.step_dt == null ? 0.01;

        super(np, 
            [5.0, 20.0, 2.0, step_dt, step_t], 
            [12, 40, 3.0, step_dt, step_t],
            [-R, -R], 
            [R, R], 
            options.kick == null ? 0.01 : options.kick, 
            options.pull == null ? 1.0 : options.pull,
        );

        this.transform_kernel = this.GPU.createKernel(
            function(points, params)
            {
                const S = params[0];
                const R = params[1];
                const B = params[2];
                const dt = params[3];
                const t = params[4];
                var x = points[this.thread.x][0];
                var y = points[this.thread.x][1];
                var z = points[this.thread.x][2];
            	for( ; t > 0; t -= dt )
            	{
            		const dx  = S*(y - x);
            		const dy = x*(R - z) - y;
            		const dz = x*y - B*z;
            		x += dx*dt;
            		y += dy*dt;
            		z += dz*dt;
            	}
                return [x, y, z];
            },
            { output: [this.NP] }
        );
    }
}
