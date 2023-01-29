class BaseAttractor
{
    constructor(np, pmin, pmax, xmin, xmax, kick, pull, nvisible)
    {
        this.Rate = 0.02;
        this.PMin = pmin;
        this.PMax = pmax;
        if( pmin.length != pmax.length )
            throw new Error("Dimensions of pmin and pmax differ");
        this.PDim = pmin.length;

        this.XMin = xmin;
        this.XMax = xmax;
        if( xmin.length != xmax.length )
            throw new Error("Dimensions of xmin and xmax differ");
        this.XDim = xmin.length;
        this.NP = np;
        this.Kick = kick == null ? 0.01 : kick;
        this.Pull = pull == null ? 1.0 : pull;
        this.Points = [];
        this.GPU = new GPU();           //{mode:"cpu"});
        this.transform_kernel = null;
        this.NVisible = nvisible == null ? this.XDim : nvisible;
        this.normal = function()
        {
            return Math.random() + Math.random() + Math.random() + Math.random()
                + Math.random() + Math.random() + Math.random() + Math.random()
                + Math.random() + Math.random() + Math.random() + Math.random()
                - 6.0;
        }

        this.extract_visible = this.GPU.createKernel(
            function(points, n)
            {
                if( n == 2 )
                    return [points[this.thread.x][0], points[this.thread.x][1]];
                else
                    return [points[this.thread.x][0], points[this.thread.x][1], points[this.thread.x][2]];
            },
            { output: [this.NP] }
        );

        this.pull_kernel = this.GPU.createKernel(
            function(points0, points1, pull, n)
            {
                const x0 = points0[this.thread.x][0];
                const y0 = points0[this.thread.x][1];
                const x1 = points1[this.thread.x][0];
                const y1 = points1[this.thread.x][1];
                return [
                        x0 + pull * (x1 - x0),
                        y0 + pull * (y1 - y0)
                    ];
            },
            { output: [this.NP] }
        );

        this.transform = function(points, params, pull)
        {
            var points1 = this.transform_kernel(points, params);
            if( pull != 1.0 )
                points1 = this.pull_kernel(points, points1, pull, this.XDim);
            return points1;
        }

        this.random_point_uniform = function()
        {
            var p = new Float32Array(this.XDim);
            for( let i=0; i<this.XDim; i++ )
                p[i] = this.XMin[i] + Math.random()*(this.XMax[i] - this.XMin[i]);
            return p;
        }

        this.random_point = this.random_point_uniform;
        this.init_points();
    }
    
    init_points()
    {
        this.Points = [];
        for( let i = 0; i < this.NP; i++ )
            this.Points.push(this.random_point());
    }

    reset(points)
    {
        this.Points = points;
    }
    
    step(params)
    {
        if(this.Kick > 0.0)
            for(let i = 0; i < this.Points.length; i++)
                if( Math.random() < this.Kick )
                {
                    this.Points[i] = this.random_point()
                }
        var points1 = this.transform(this.Points, params, this.Pull);
        this.Points = points1;
        return this.Points;
    }
}