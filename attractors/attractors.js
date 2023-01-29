class DeJongAttractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 2.5;
        const R = 2.5;
        super(np, [-P, -P, -P, -P], [P, P, P, P],
            [-R, -R], [R, R], 
            options.kick == null ? 0.01 : options.kick, 
            options.pull == null ? 1.0 : options.pull,
        );

        this.transform_kernel = this.GPU.createKernel(
            function(points, params)
            {
                const A = params[0];
                const B = params[1];
                const C = params[2];
                const D = params[3];
                const x = points[this.thread.x][0];
                const y = points[this.thread.x][1];
                return [
                        Math.sin(A*y) - Math.cos(B*x),
                        Math.sin(C*x) - Math.cos(D*y)
                    ];
            },
            { output: [np] }
        );
    }
}

class CubicAttractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 1.2;
        const R = 3.0;
        super(np, 
            [-P, -P, -P, -P], 
            [P, P, P, P],
            [-R, -R], 
            [R, R], 
            options.kick == null ? 0.01 : options.kick, 
            options.pull == null ? 1.0 : options.pull,
        );

        function G(x)
        {
            return 3*(x*x*x-1.2*x)/(1+2*x*x);
        }
    
        function F(x)
        {
            return (1-3.5*x*x)/(1+2*x*x);
        }
    
        function H(x)
        {
            return 2.3*x/(1+2*x*x);
        }

        this.GPU.addFunction(G);
        this.GPU.addFunction(F);
        this.GPU.addFunction(H);

        this.transform_kernel = this.GPU.createKernel(
            function(points, params)
            {
                const A = params[0];
                const B = params[1];
                const C = params[2];
                const D = params[3];
                const x = points[this.thread.x][0];
                const y = points[this.thread.x][1];
                return [
                    F(A*x) + H(B*y), 
                    F(C*y) + H(D*x)
                ];
            },
            { output: [this.NP] }
        );
    }
}

class TanhAttractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 1.2;
        const R = 3.0;
        super(np, 
            [-P, -P, 0.2, 0.2], 
            [P, P, P, P],
            [-R, -R], 
            [R, R], 
            options.kick == null ? 0.01 : options.kick, 
            options.pull == null ? 1.0 : options.pull,
        );

        function F(x)
        {
            return Math.tanh(x);
        }
    
        function G(x)
        {
            return Math.tanh(2*x*x-1);
        }
    
        function H(x)
        {
            return Math.tanh(x*x*x - 1.5*x + 0.5*x*x);
        }

        this.GPU.addFunction(G);
        this.GPU.addFunction(F);
        this.GPU.addFunction(H);
        this.transform_kernel = this.GPU.createKernel(
            function(points, params)
            {
                const A = params[0];
                const B = params[1];
                const C = params[2];
                const D = params[3];
                const E = params[4];
                const F = params[5];
                const x = points[this.thread.x][0];
                const y = points[this.thread.x][1];
                return [
                        A*this.H(x) + B*this.G(y) + E*this.F(y),
                        C*this.H(y) + D*this.G(x) + F*this.F(x)
                    ];
            },
            { output: [this.NP] }
        );
    }
}

class QExpAttractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 2.2;
        const R = 3.0;
        super(np, 
            [-P, -P, 0.2, 0.2], 
            [P, P, P, P],
            [-R, -R], 
            [R, R], 
            options.kick == null ? 0.01 : options.kick, 
            options.pull == null ? 1.0 : options.pull,
        );

        function G(x)
        {
            return 3*(x*x*x-1.2*x)/Math.cosh(2*x);
        }
    
        function F(x)
        {
            return (1-3.5*x*x)/Math.cosh(2*x);
        }
    
        function H(x)
        {
            return 2.3*x/Math.cosh(2*x);
        }

        this.GPU.addFunction(G);
        this.GPU.addFunction(F);
        this.GPU.addFunction(H);
        this.transform_kernel = this.GPU.createKernel(
            function(points, params)
            {
                const A = params[0];
                const B = params[1];
                const C = params[2];
                const D = params[3];
                const x = points[this.thread.x][0];
                const y = points[this.thread.x][1];
                return [
                        F(A*x) + H(B*y),
                        F(C*y) + H(D*x)
                    ];
            },
            { output: [this.NP] }
        );
    }
}

class HyperAttractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 3.0;
        const R = 3.5;
        super(np, 
            [-P, 0.3, 0.3, -P, 0.3, 0.3], 
            [P, P, P, P, P, P],
            [-R, -R], 
            [R, R], 
            options.kick == null ? 0.01 : options.kick, 
            options.pull == null ? 1.0 : options.pull,
        );

        function G(x)
        {
            return 2.0/Math.cosh(2*x)-1;
        }
    
        function F(x)
        {
            return Math.tanh(2*x)/Math.cosh(2*x);
        }
    
        function H(x)
        {
            return (2.0/Math.cosh(2*x)-1)/Math.cosh(2*x);
        }
    
        this.GPU.addFunction(G);
        this.GPU.addFunction(F);
        this.GPU.addFunction(H);
        this.transform_kernel = this.GPU.createKernel(
            function(points, params)
            {
                const A = params[0];
                const B = params[1];
                const C = params[2];
                const P = params[3];
                const Q = params[4];
                const R = params[5];
                const x = points[this.thread.x][0];
                const y = points[this.thread.x][1];
                return [
                        G(A*x) + B*F(C*y),
                        G(P*y) + Q*F(R*x)
                    ];
            },
            { output: [this.NP] }
        );
    }
}

class Hyper3Attractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 3.0;
        const R = 3.5;
        super(np, 
            [-P, 0.3, 0.3, -P, 0.3, 0.3, -P, 0.3, 0.3], 
            [P, P, P, P, P, P, P, P, P],
            [-R, -R, -R], 
            [R, R, -R], 
            options.kick == null ? 0.01 : options.kick, 
            options.pull == null ? 1.0 : options.pull,
            2
        );

        function G(x)
        {
            return 2.0/Math.cosh(2*x)-1;
        }
    
        function F(x)
        {
            return Math.tanh(2*x)/Math.cosh(2*x);
        }
    
        function H(x)
        {
            return (2.0/Math.cosh(2*x)-1)/Math.cosh(2*x);
        }
    
        this.GPU.addFunction(G);
        this.GPU.addFunction(F);
        this.GPU.addFunction(H);
        this.transform_kernel = this.GPU.createKernel(
            function(points, params)
            {
                const A = params[0];
                const B = params[1];
                const C = params[2];
                const P = params[3];
                const Q = params[4];
                const R = params[5];
                const L = params[6];
                const M = params[7];
                const N = params[8];
                const x = points[this.thread.x][0];
                const y = points[this.thread.x][1];
                const z = points[this.thread.x][2];
                return [
                        G(A*x) + B*F(C*y),
                        G(P*y) + Q*F(R*z),
                        G(L*z) + M*F(N*x)
                    ];
            },
            { output: [this.NP] }
        );
    }
}
class DeJong3Attractor extends BaseAttractor
{
    constructor(np, options)
    {
        const P = 2.5;
        const R = 3.5;
        super(np, 
            [-P, -P, -P, -P, -P, -P], 
            [P, P, P, P, P, P],
            [-R, -R, -R], 
            [R, R, -R], 
            options.kick == null ? 0.01 : options.kick, 
            options.pull == null ? 1.0 : options.pull,
            2
        );

        this.transform_kernel = this.GPU.createKernel(
            function(points, params)
            {
                const A = params[0];
                const B = params[1];
                const C = params[2];
                const D = params[3];
                const E = params[4];
                const F = params[5];
                const x = points[this.thread.x][0];
                const y = points[this.thread.x][1];
                const z = points[this.thread.x][2];
                return [
                        Math.sin(A*y) - Math.cos(D*x),
                        Math.sin(B*z) - Math.cos(E*y),
                        Math.sin(C*x) - Math.cos(F*z)
                    ];
            },
            { output: [this.NP] }
        );
    }
}
