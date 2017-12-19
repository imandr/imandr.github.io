
function collideForce(radius, margin)
{
    var get_radius;
    if ( typeof radius === 'undefined' )
        get_radius = function(x) { return x.r; }
    else if( typeof radius === 'function' )
        get_radius = radius;
    else
        get_radius = function(x) { return radius; }
    
    if( typeof margin === 'undefined')
        margin = 0.02;
    
    var iterations = 2;

    function collide(node) 
    {
        var rnode = get_radius(node)
          r = rnode + 0.2,
          nx1 = node.x - r,
          nx2 = node.x + r,
          ny1 = node.y - r,
          ny2 = node.y + r;
        return function(qnode, x1, y1, x2, y2) 
        {
            var qn = qnode.data;
            if (qn && (qn !== node)) 
            {
              var x = node.x - qn.x,
                  y = node.y - qn.y,
                  l = Math.sqrt(x * x + y * y),
                  rmin = rnode + get_radius(qn) + margin;
              if (l < rmin) {
                l = (l - rmin) / l * .2;
                x *= l;
                y *= l;
                if( node.fx == null )   node.x -= x;
                if( node.fy == null )   node.y -= y;
                if( qn.fx == null ) qn.x += x;
                if( qn.fy == null ) qn.y += y;
              }
            }
            return x1 > nx2
                || x2 < nx1
                || y1 > ny2
                || y2 < ny1;
        }
    }

    function force(alpha)
    {
        var nodes = force.nodes;
        for( var it = 0; it < iterations; it++ )
        {
            var q = d3.quadtree()
                .x(function(d){ return d.x; })
                .y(function(d){ return d.y; })
                .addAll(nodes);
            
            for( var i in nodes )
                q.visit(collide(nodes[i]));
        }
    };
    
    force.initialize = function(lst)
    {
        force.nodes = lst;
    }
    
    return force;
}

