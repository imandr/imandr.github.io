function HTTPRequest(url, callback_object, param, format="")
{
	// format can be "json"
	var http_request = null;
	if (window.XMLHttpRequest)
		http_request=new XMLHttpRequest();      // code for IE7+, Firefox, Chrome, Opera, Safari
	else
		http_request=new ActiveXObject("Microsoft.XMLHTTP");  // code for IE6, IE5
	var state_change = function ()
	{
	    var callback_object = state_change.callback_object;
	    var param = state_change.callback_param;
		if (this.readyState==4 )
        {
            if( this.status==200 && callback_object.data_received != null )
    		{
    		    var data = this.response;
    		    if ( data == null ) data = this.responseText;
    		    callback_object.data_received(data, param);
    		}
            else if ( callback_object.request_failed != null )
            {
                callback_object.request_failed(this.status, this.statusText, this.responseText, param);
            }
        }
	}
	state_change.callback_object = callback_object;
	state_change.callback_param = param;

	http_request.onreadystatechange = state_change;
	http_request.responseType = format
	http_request.open("GET", url, true);
	http_request.send();
	return http_request;
}    

function simple_request(url, callback, format)
{
    return HTTPRequest(url, 
        {
            data_received: function(data, param)
            {   
                callback(data, null);  
            }
        }, null, format
    );
}

function get_ip(callback)
{
    var req = simple_request("https://www.cloudflare.com/cdn-cgi/trace",
        function(data)
        {
            var parsed = data.trim().split('\n').reduce(function(obj, pair) {
              pair = pair.split('=');
              return obj[pair[0]] = pair[1], obj;
            }, {});
            callback(parsed["ip"]);
        }, ""
    );
}

function get_location(ip, callback)
{
    var req = simple_request("https://geolocation-db.com/json/" + ip, callback, "json");
}