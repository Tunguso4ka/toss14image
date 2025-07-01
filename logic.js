// var params = new URLSearchParams(document.location.search);

var color_rgb = true;
var drawtool = "";

var image = document.createElement("img");

var input_image;
var text_papercode;
var canvas;
var ctx;

document.addEventListener('DOMContentLoaded', function()
{
    input_image = document.getElementById("input_image");

    window.addEventListener('paste', e => {
        input_image.files = e.clipboardData.files;
        on_new_image();
    });
    input_image.addEventListener("change", on_new_image);

    text_papercode = document.getElementById("text_papercode");

    canvas = document.getElementById("canvas_drawing");
    ctx = canvas.getContext('2d');

}, false);

function on_new_image()
{
    image.src = URL.createObjectURL(input_image.files[0]);
    image.onload = function()
    {
        requestAnimationFrame(update_canvas);
    }
}

function to_hex_color(pixels)
{
    var color = {r: pixels[0].toString(16).padStart(2, "0"),
                 g: pixels[1].toString(16).padStart(2, "0"),
                 b: pixels[2].toString(16).padStart(2, "0"),
                 a: pixels[3].toString(16).padStart(2, "0")}

    if (color_rgb)
        return `${color.r[0]}${color.g[0]}${color.b[0]}${(color.a != "ff") ? color.a[0] : ""}`;
    else
        return `${color.r}${color.g}${color.b}${(color.a != "ff") ? color.a : ""}`;
}

function update_papercode()
{
    if (!image.src)
        return;

    var image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    console.log(`Loaded new image ${image_data.width}x${image_data.height}px`);

    var previous_color = "";

    text_papercode.textContent = "";
    for(var i = 0; i < image_data.data.length; i += 4)
    {
        var color = to_hex_color(image_data.data.slice(i, i + 4));
        if (i % canvas.width == 0 && i != 0)
            text_papercode.textContent += "\n";
        if (previous_color != color)
            text_papercode.textContent += `[color=#${color}]`;
        text_papercode.textContent += "██";

        previous_color = color;
    }
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
    navigator.clipboard.writeText(text_papercode.textContent);
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
