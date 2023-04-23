const Vocabulary = BIP39;
var generated_list = [];

function read_options()
{
    var options = {};
    var len_select = document.getElementById("length")
    options.length = parseInt(len_select.options[len_select.selectedIndex].value);
    return options;
}

function display_list()
{
    var display = "&nbsp;&nbsp;";
    let hide = document.getElementById("hideCheckbox").checked;
    if( generated_list.length )
    {
        if( hide )
            display = "&bull;&bull;&bull;&bull;&bull;&bull; ".repeat(generated_list.length);
        else
            display = generated_list.join(" ");
        display = "<span>" + display + "</span>";
    }
    document.getElementById("generated_list").innerHTML = display;
    document.getElementById("copyButton").disabled = (generated_list.length == 0);
}

function run()
{
    generated_list = bip39_generate(read_options().length);
    display_list();
}

function recalculate()
{
    var options = read_options();
    if( Vocabulary.length > 0 )
    {
        var log10n, log2n;
        log10n = options.length*Math.log(Vocabulary.length)/Math.log(10);
        log2n = options.length*Math.log(Vocabulary.length)/Math.log(2);

        entropy = options.length / 3 * 32; 
        log10n_e = Math.round(entropy*Math.log(2)/Math.log(10))
        document.getElementById("combinations").innerHTML = ""
            + "2<sup>" + Math.round(log2n) + "</sup>"
            + " = 10<sup>" + Math.round(log10n) + "</sup>";
        
        document.getElementById("entropy").innerHTML = ""
            + entropy + " bits (2<sup>" + entropy + "</sup> = "
            + "10<sup>" + log10n_e + "</sup>)";
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

function copy_list()
{
    /* Copy the text inside the text field */
    navigator.clipboard.writeText(generated_list.join(" "));
    document.getElementById("copied_text").innerHTML = '<i>copied</i>';
    if( clear_timer != null )
        window.clearTimeout(clear_timer);
    clear_timer = setTimeout(clear_copied, 2000);
}

function clear()
{
    generated_list = [];
    display_list();
}

function refresh()
{
    recalculate();
    run();
}

let button = document.getElementById("generateButton");
console.log("button:"+button);

document.getElementById("generateButton").addEventListener("click", run);
document.getElementById("clearButton").addEventListener("click", clear);
document.getElementById("copyButton").addEventListener("click", copy_list);
document.getElementById("hideCheckbox").addEventListener("change", display_list);

document.getElementById("length").addEventListener("change", refresh);

if( chrome.storage != null )
    chrome.storage.sync.get("context", ({ context }) => {
      document.getElementById("body").className = context;
      //document.getElementById("message").innerHTML = context;
    });


refresh();
