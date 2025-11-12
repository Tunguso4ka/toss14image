var color_rgb = true;
var color_selected = ""; // input color doesnt support alpha.

var image = document.createElement("img");

var input_image;
var input_color;

var text_imageinfo;
var text_papercode;

var canvas;
var ctx;

var papercode;

var changes = [];
var history_position = -1;

document.addEventListener('DOMContentLoaded', function()
{
    input_image = document.getElementById("input_image");

    window.addEventListener('paste', e => {
        input_image.files = e.clipboardData.files;
        on_new_image();
    });
    input_image.addEventListener("change", on_new_image);

    input_color = document.getElementById("input_color");
    input_color.addEventListener('change', e => {
        color_selected = input_color.value;
        input_color.title = color_selected;
    });

    text_imageinfo = document.getElementById("text_imageinfo");
    text_papercode = document.getElementById("text_papercode");

    canvas = document.getElementById("canvas_drawing");
    ctx = canvas.getContext('2d');
    canvas.addEventListener('mousedown', draw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', draw_stop);

    save_state('Original state');

}, false);

function on_new_image()
{
    image.src = URL.createObjectURL(input_image.files[0]);
    image.onload = function()
    {
        if (image.width > 100 || image.height > 100)
        {
            alert(`Your image is too large (${image.width}x${image.height}), crop it first.\n(Look at #How to use)`);
            return;
        }
        requestAnimationFrame(update_canvas);
    }
}

function rgb_to_hex(pixels, force_full=false)
{
    var color = {r: pixels[0].toString(16).padStart(2, "0"),
                 g: pixels[1].toString(16).padStart(2, "0"),
                 b: pixels[2].toString(16).padStart(2, "0"),
                 a: pixels[3].toString(16).padStart(2, "0")}

    if (color_rgb && !force_full)
        return `#${color.r[0]}${color.g[0]}${color.b[0]}${(color.a != "ff") ? color.a[0] : ""}`;
    else
        return `#${color.r}${color.g}${color.b}${(color.a != "ff") ? color.a : ""}`;
}

function update_data(data, color)
{
    // shitcode
    data[0] = parseInt(color.slice(0, 2), 16);
    data[1] = parseInt(color.slice(2, 4), 16);
    data[2] = parseInt(color.slice(4, 6), 16);
    data[3] = color.length == 8 ? parseInt(color.slice(6, 8), 16) : 256;
}

function update_papercode()
{
    var image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);

    var previous_color = "";

    papercode = "";
    for(var i = 0; i < image_data.data.length; i += 4)
    {
        var color = rgb_to_hex(image_data.data.slice(i, i + 4));

        if (((i / 4) % canvas.width) == 0 && (i != 0))
            papercode += "\n";
        if (previous_color != color)
            papercode += `[color=${color}]`;
        papercode += "██";

        previous_color = color;
    }

    text_imageinfo.textContent = `${image_data.width}px:${image_data.height}px; ${papercode.length} symbols;`
    text_papercode.textContent = papercode;
}

function update_canvas()
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(image, 0, 0);

    update_papercode();

    save_state('Image loaded');
}

function copy()
{
    navigator.clipboard.writeText(papercode);
    console.log("Copied the text!");
}

function toggle_rgb()
{
    var button_toggle_rgb = document.getElementById("button_toggle_rgb");
    color_rgb = !color_rgb;

    button_toggle_rgb.textContent = color_rgb ? "#RGB" : "#RRGGBB";

    update_papercode();
}

function round(number, at=0.75)
{
    // Custom Math.round, cuz standard kinda sucks ass for drawing
    return (number - Math.trunc(number)) > at ? Math.ceil(number) : Math.floor(number);
}

function draw(e)
{
    e.preventDefault();
    if (e.buttons == 0)
        return;

    var point = { x: round(e.offsetX / (canvas.offsetWidth / canvas.width)),
                  y: round(e.offsetY / (canvas.offsetHeight / canvas.height))};

    const pixel = ctx.getImageData(point.x, point.y, 1, 1);
    if (e.buttons == 1)
    {
        update_data(pixel.data, color_selected.slice(1));
        ctx.putImageData(pixel, point.x, point.y);
        update_papercode();
    }
    else if (e.buttons == 2)
    {
        color_selected = rgb_to_hex(pixel.data, true);
        input_color.value = color_selected;
        input_color.title = color_selected;
    }
}

function draw_stop(e)
{
    e.preventDefault();
    if (e.button == 0)
        save_state('Pixel changed');
}

function resize(_top=0, _bottom=0, _left=0, _right=0)
{
    let image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);

    canvas.width = canvas.width + _left + _right;
    canvas.height = canvas.height + _top + _bottom;

    ctx.putImageData(image_data, _left, _top);

    update_papercode();
    save_state('Resized');
}

// Go back/forward in history
function change_history(num)
{
    if (!changes)
        return;

    history_position += num;
    let change = changes.at(history_position);

    canvas.width = change.data.width;
    canvas.height = change.data.height;
    ctx.putImageData(change.data, 0, 0);

    update_papercode();

    console.log(`Reverted to "${change.change}".`);
    update_history_buttons();
}

// Save history state
function save_state(change="Not specified")
{
    if (!changes)
        changes = [];

    changes.length = history_position + 1;
    history_position++;
    changes.push({ "change": change,
                   "data": ctx.getImageData(0, 0, canvas.width, canvas.height)});

    console.log(`Saved state "${change}"`);
    update_history_buttons();
}


function update_history_buttons()
{
    document.getElementById("button_forward").disabled = history_position < changes.length - 1 ? false : true;
    document.getElementById("button_back").disabled = history_position > 0 ? false : true;

    document.getElementById("button_forward").title = history_position < changes.length - 1 ? `Go forward to "${changes.at(history_position+1).change}"` : "Can't go forward in history.";
    document.getElementById("button_back").title = history_position > 0 ? `Go back to "${changes.at(history_position-1).change}"` : "Can't go back in history.";
}
