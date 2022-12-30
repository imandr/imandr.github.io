function Clock(svg_id, width, height)
{
	this.CanvasSize = null;
	this.MaxClockSize = 600;	// in points
	this.ClockCenterX = null;	// relative to the SVG center
	this.ClockCenterY = null;

	this.SVG = d3.select("#" + svg_id);
	this.T = this.SVG.append("g");
	
    this.recenter = function(w, h)
	{
		var top = null;
		var left = null;
		this.CanvasSize = w > h ? h : w;
		this.SVG
			.attr("width", this.CanvasSize)
			.attr("height", this.CanvasSize)
			.style("left", (w - this.CanvasSize)/2)
			.style("top", (h - this.CanvasSize)/2);
		var clock_size = this.CanvasSize * 0.8;
		if( clock_size > this.MaxClockSize )
			clock_size = this.MaxClockSize;
		this.ClockSize = clock_size;
		this.Scale = clock_size/2;
		this.Center = this.CanvasSize/2;
		this.T.attr("transform", "translate(" + this.Center + " " + this.Center + ")," +
        		"scale(" + this.Scale + " " + (-this.Scale) + ")");
	}

		 
    const HandDotStep = 0.01;
    const Hands = {
        "second": {
            "r": 0.015,
            r0: 0.1,
            r1: 0.95
        },
        "minute": {
            "r": 0.015,
            r0: 0.05,
            r1: 0.75
        },
        "hour": {
            "r": 0.015,
            r0: 0.05,
            r1: 0.5
        }
    }
    let ColorScheme = d3.scaleOrdinal(d3.schemeCategory10),
        ColorSchemeSize = 10;


    function generateHandDots(i, hand_config, type)
    {
        var out = [];
        var r;
        for(r = hand_config.r0; r < hand_config.r1; i++, r += HandDotStep)
            out.push({
                    type: type,
                    index: i,
                    R: r,
                    x: 0,
                    y: r,
                    fx: 0,
                    fy: r,
                    r: hand_config.r,
                    mass: 1
                }
            );
        if( r < hand_config.r1 )
            out.push({
                    type: type,
                    index: i,
                    R: r,
                    x: 0,
                    y: r,
                    fx: 0,
                    fy: r,
                    r: hand_config.r1,
                    mass: 1
                }
            );
        return out;
    }

    var i0 = 0;

    var Marks = d3.range(12)
        .map(function(i){
            var phi = i * Math.PI/6;
            return {
                type: "mark",
                index: i+i0,
                x: Math.sin(phi),
                y: Math.cos(phi),
                fx: Math.sin(phi),
                fy: Math.cos(phi),
                r: (i % 3) ? 0.02 : 0.03,
                mass: 1
            }
        });
    
    i0 += 12;

    this.Seconds = generateHandDots(i0, Hands.second, "second");
    i0 += this.Seconds.length;

    this.Minutes = generateHandDots(i0, Hands.minute, "minute");
    i0 += this.Minutes.length;

    this.Hours = generateHandDots(i0, Hands.hour, "hour");
    i0 += this.Hours.length;
    
    this.bubbleIndex = i0;
    
    this.Bubbles = [];
    
    var marks = this.T.selectAll(".mark")
        .data(Marks)
        .enter()
        .append("line").classed("mark", true)
            .attr("stroke-width", function(d){ return d.r; })
            .attr("x1", function(d){ return d.x;})
            .attr("y1", function(d){ return d.y;})
            .attr("x2", function(d){ return d.x*(1.0 - 2*d.r);})
            .attr("y2", function(d){ return d.y*(1.0 - 2*d.r);});
                                    
    this.secondHand = this.T
            .append("line").classed("second", true).classed("hand", true)
                .attr("x1", this.Seconds[0].x)
                .attr("y1", this.Seconds[0].y)
                .attr("x2", this.Seconds[this.Seconds.length-1].x)
                .attr("y2", this.Seconds[this.Seconds.length-1].y);

    this.minuteHand = this.T
            .append("line").classed("minute", true).classed("hand", true)
                .attr("x1", this.Minutes[0].x)
                .attr("y1", this.Minutes[0].y)
                .attr("x2", this.Minutes[this.Minutes.length-1].x)
                .attr("y2", this.Minutes[this.Minutes.length-1].y);
            
    this.hourHand = this.T
            .append("line").classed("hour", true).classed("hand", true)
                .attr("x1", this.Hours[0].x)
                .attr("y1", this.Hours[0].y)
                .attr("x2", this.Hours[this.Hours.length-1].x)
                .attr("y2", this.Hours[this.Hours.length-1].y);
                
    this.bubbles = this.T.selectAll(".bubble")
            .data(this.Bubbles)
            .enter()
            .append("circle").classed("bubble", true)
                .attr("fill", function(d)
                    { 
                        var c = ColorScheme(d.index % ColorSchemeSize);
                        return c;
                    })
                .attr("fill-opacity", 0.5)
                .attr("stroke","black").attr("stroke-width", 0.001)
                .attr("r", function(d){ return d.r; })
                .attr("cx", function(d){ return d.x;})
                .attr("cy", function(d){ return d.y;});
                
    this.bubbleCircles = function()
    {
        return this.T.selectAll(".bubble")
            .data(this.Bubbles, function(d){ return d.index; });
    }
    
    this.updateHand = function(dots, t, dotFunction)
    {
	    function x(p, r)
	    {
	        return r*Math.sin(p);
	    }
    
	    function y(p, r)
	    {
	        return r*Math.cos(p);
	    }

        for( var i in dots )
        {
            var dot = dots[i];
            dot.x = dotFunction(t, dot.R, 
				function (p, r) { return r*Math.sin(p); }
			);
            dot.y = dotFunction(t, dot.R, 
				function (p, r) { return r*Math.cos(p); }
			);
            dot.fx = dot.x;
            dot.fy = dot.y;
        }
    }

    this.upateHands = function()
    {
        var d = new Date();
        var t = d.getTime();
        t = Math.round(t/1000.0) - d.getTimezoneOffset()*60;
        
	    function secondDot(t, r, cvt)
	    {
	        var s = t % 60;
	        var p = Math.PI*2/60*s;
	        return cvt(p, r);
	    }

	    function hourDot(t, r, cvt)
	    {
	        var h = (t % (3600*24))/3600.0;
	        h = (t % (3600*12))/(3600.0*12.0);
	        var p = Math.PI*2 * h;
	        return cvt(p, r);
	    }

	    function minuteDot(t, r, cvt)
	    {
	        var m = (t % 3600)/3600.0;
	        var p = Math.PI*2 * m;
	        return cvt(p, r);
	    }
    
        this.updateHand(this.Seconds, t, secondDot);
        this.updateHand(this.Minutes, t, minuteDot);
        this.updateHand(this.Hours, t, hourDot);
        
        secondHand.transition().duration(250)
                .attr("x1", this.Seconds[0].x)
                .attr("y1", this.Seconds[0].y)
                .attr("x2", this.Seconds[this.Seconds.length-1].x)
                .attr("y2", this.Seconds[this.Seconds.length-1].y);
        
        minuteHand
                .attr("x1", this.Minutes[0].x)
                .attr("y1", this.Minutes[0].y)
                .attr("x2", this.Minutes[this.Minutes.length-1].x)
                .attr("y2", this.Minutes[this.Minutes.length-1].y)
        hourHand
                .attr("x1", this.Hours[0].x)
                .attr("y1", this.Hours[0].y)
                .attr("x2", this.Hours[this.Hours.length-1].x)
                .attr("y2", this.Hours[this.Hours.length-1].y)   
    }


    this.bubbleColor = function(bubble)
    {
	    const color_schemes = [
	        {
	            scheme: d3.schemeCategory20c,
	            size: 4,
	            offset: 0
	        },
	        {
	            scheme: d3.schemeCategory20c,
	            size: 4,
	            offset: 4
	        }
	    ];
        let i = bubble.mass > 0 ? 0 : 1,
            s = color_schemes[i];
        return s.scheme[(bubble.index % s.size) + s.offset];
    }
    

    this.createBubble = function()
    {
        var r = Math.random();
        r = 0.03 + 0.1*r*r;
        var bubble = {
                type: "bubble",
                index: bubbleIndex++,
                x: (Math.random()*2-1)*0.5,
                y: 1.5,
                r: r,
                mass: 1
            };
        if( Math.random() < 0.5 )
        {
            bubble.mass = -1;
            bubble.y = -bubble.y;
        }
        return bubble;
    }

    this.updateBubbles = function()
    {
        // remove fallen bubbles
        var n = Bubbles.length;
        for( i in Bubbles )
        {
            var j = n - i - 1;
            if( Bubbles[j].y < -1.5 || Bubbles[j].y > 1.5 )
                Bubbles.splice(j,1);
        }
        
        
        if( Bubbles.length < 20 )
        {
            var bubble = this.createBubble();
            this.Bubbles.push(bubble);
            this.AllDots.push(bubble);
        }
        
        var lst =  this.bubbleCircles();

        var enter = lst.enter();
        var exit = lst.exit();
            
        enter
            .append("circle").classed("bubble", true)
                //.attr("clip-path", "url(#clip_path)")
                .attr("fill", this.bubbleColor)
                .attr("r", function(d){ return d.r; })
                .attr("cx", function(d){ return d.x;})
                .attr("cy", function(d){ return d.y;});
                
        exit.remove();
    }

    this.AllDots = Marks
		.concat(this.Hours)
		.concat(this.Minutes)
		.concat(this.Seconds)
		.concat(this.Bubbles);

    this.simulation = d3.forceSimulation()
        .force("gravity", function(alpha){
            for( var i in this.AllDots )
            {
                dot = this.AllDots[i];
                dot.vy -= alpha*0.1*0.04*dot.mass;
            }
        })
        //.force("collide", collideForce({"margin":0.01}))            
        .force("collide", d3.forceCollide()
                            .radius( (d) => d.r )
                            .iterations(4)
        )
        .on("tick", function()
            {
                this.bubbleCircles()
                    .attr("cx", function(d){ 
                        return d.x; 
                    })
                    .attr("cy", function(d){ 
                        return d.y; 
                    });

            }
        )
        .alphaDecay(0.0)
        .nodes(this.AllDots);
    
	setInterval(this.upateHands, 300);
    setInterval(
        function()
        {
            this.updateBubbles();
            this.simulation.nodes(this.AllDots);
        },
        400
    );
}