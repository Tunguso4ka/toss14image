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
    });

    text_imageinfo = document.getElementById("text_imageinfo");
    text_papercode = document.getElementById("text_papercode");

    canvas = document.getElementById("canvas_drawing");
    ctx = canvas.getContext('2d');
    canvas.addEventListener('mousedown', draw);
    // TODO touch start
    canvas.addEventListener('mousemove', draw);

}, false);

function on_new_image()
{
    image.src = URL.createObjectURL(input_image.files[0]);
    image.onload = function()
    {
        if (image.width > 100 || image.height > 100)
        {
            alert(`Your image is too large, crop it first: ${image.width}x${image.height}\n(Look at #How to use)`);
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
    if (color_rgb)
        button_toggle_rgb.textContent = "#RGB";
    else
        button_toggle_rgb.textContent = "#RRGGBB";

    update_papercode();
}

function draw(e)
{
    e.preventDefault();
    if (e.buttons == 0)
        return;

    var point = { x: Math.floor(e.offsetX / 20),
                  y: Math.floor(e.offsetY / 20)};

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
    }
}
