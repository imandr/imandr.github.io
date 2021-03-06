hsb_to_rgb = function (hsb) {
    //
    // HSB and RGB are all normalized to [0,1.0]
    //
    var h = hsb[0];
    var s = hsb[1];
    var v = hsb[2];

    if (s == 0)
        return [v,v,v];

    var t1 = v;
    var t2 = (1.0 - s) * v;
    var h6 = h*6.0;
    var hr = h6 - Math.floor(h6);
    
    var t3 = (t1 - t2) * hr;
    var r, g, b;

    if (h6 < 1) { r = t1; b = t2; g = t2 + t3 }
    else if (h6 < 2) { g = t1; b = t2; r = t1 - t3 }
    else if (h6 < 3) { g = t1; r = t2; b = t2 + t3 }
    else if (h6 < 4) { b = t1; r = t2; g = t1 - t3 }
    else if (h6 < 5) { b = t1; g = t2; r = t2 + t3 }
    else if (h6 < 6) { r = t1; g = t2; b = t1 - t3 }
    else { r = 0; g = 0; b = 0 }

    return [r,g,b];
}
