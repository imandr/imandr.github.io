var Symbols = "!$%+,-./:=?@^_";

function charset(options)
{
    var chars = "";

    if( options.upper ) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if( options.lower ) chars += "abcdefghijklmnopqrstuvwxyz";
    if( options.digits ) chars += "0123456789";
    if( options.symbols ) chars += Symbols;
    return chars;
}

function generate(options)
{
    var chars = charset(options);
    var length = options.length;

    var array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    var password = "";
    for( var i=0; i < array.length; i++ )
    {
        password += chars[array[i] % chars.length];
    }
    return password
}

var generated_password = "";

function read_options()
{
    var options = {};
    var len_select = document.getElementById("length")
    options.length = parseInt(len_select.options[len_select.selectedIndex].value);
    options.upper = document.getElementById("upper").checked;
    options.lower = document.getElementById("lower").checked;
    options.digits = document.getElementById("digits").checked;
    options.symbols = document.getElementById("symbols").checked;
    return options;
}

function __display_password()
{
    var display = "";
    let hide = document.getElementById("hideCheckbox").checked;
    for( var i=0; i<generated_password.length; i++ )
    {
        let c = hide ? "&bull;" : generated_password.charAt(i);
        display += '<span class="password_character">' + c + '</span>'
    }
    if( display == "" )
        display = "&nbsp;&nbsp;"
    document.getElementById("password").innerHTML = display;
    document.getElementById("copyButton").disabled = (generated_password.length == 0);
}

function display_password()
{
    var display = "&nbsp;&nbsp;";
    let hide = document.getElementById("hideCheckbox").checked;
    if( generated_password.length )
    {
        if( hide )
            display = "&bull;".repeat(generated_password.length);
        else
            display = generated_password;
        display = "<span>" + display + "</span>";
    }
    document.getElementById("password").innerHTML = display;
    document.getElementById("copyButton").disabled = (generated_password.length == 0);
}

function run()
{
    generated_password = generate(read_options());
    display_password();
}

function recalculate()
{
    var options = read_options();
    var chars = charset(options);
    if( chars.length > 0 )
    {
        const log10n = options.length*Math.log(chars.length)/Math.log(10);
        const log2n = options.length*Math.log(chars.length)/Math.log(2);
        document.getElementById("combinations").innerHTML = 
             "10<sup>" + Math.floor(log10n) + "</sup>"
             + " = 2<sup>" + Math.floor(log2n) + "</sup>";
    }
    else
        document.getElementById("combinations").innerHTML = "0";
}

var clear_timer = null;

function clear_copied()
{
    document.getElementById("copied_text").innerHTML = "";
    clear_timer = null;
}

function copy_password()
{
    /* Copy the text inside the text field */
    navigator.clipboard.writeText(generated_password);
    document.getElementById("copied_text").innerHTML = '<i>copied</i>';
    if( clear_timer != null )
        window.clearTimeout(clear_timer);
    clear_timer = setTimeout(clear_copied, 2000);
}

function clear_password()
{
    generated_password = "";
    display_password();
}

function refresh()
{
    recalculate();
    run();
}

let button = document.getElementById("generateButton");
console.log("button:"+button);

document.getElementById("generateButton").addEventListener("click", run);
document.getElementById("clearButton").addEventListener("click", clear_password);
document.getElementById("copyButton").addEventListener("click", copy_password);
document.getElementById("hideCheckbox").addEventListener("change", display_password);

document.getElementById("digits").addEventListener("change", refresh);
document.getElementById("symbols").addEventListener("change", refresh);
document.getElementById("upper").addEventListener("change", refresh);
document.getElementById("lower").addEventListener("change", refresh);
document.getElementById("length").addEventListener("change", refresh);

document.getElementById("symbol_set").innerHTML = Symbols;

if( chrome.storage != null )
    chrome.storage.sync.get("context", ({ context }) => {
      document.getElementById("body").className = context;
      //document.getElementById("message").innerHTML = context;
    });


refresh();
