'use strict';

let color = ['#ff0000', '#00ff00', '#0000ff', '#ffa500', '#ffff00'],
    keyCode,
    keymap = {
        "49": "1",
        "50": "2",
        "51": "3",
        '52': "4",
        "53": "5",
    },
    colornumber = 0,
    selection, text,
    delay, hotkey, require,
    div = document.createElement("div");

self.port.emit("selsettingsrequest");
self.port.on("selsettings", function(rcolor, pdelay, photkey, prequire) {
    if (photkey == 'Space')
        keyCode = ' ';
    else
        keyCode = photkey;
    color = rcolor;
    delay = pdelay;
    //keyCode = photkey;
    require = prequire;
    div.style.background = color[0];
});

//div.setAttribute("title","Right click or Middle Mouse Button to clean this color");
div.style.cursor = "pointer";
div.style.position = "fixed";
div.style.zIndex = "2147483647";
div.style.width = "40px";
div.style.height = "40px";
div.style.borderRadius = "4px";
div.style.opacity = "0.85";
div.style.lineHeight = "40px";
div.style.textAlign = "center";
div.style.fontSize = "200%";
div.style.color = "white";
div.id = "xph2selection";
div.textContent = "1";
div.style.background = color[0];
div.addEventListener('mousedown', test);
div.addEventListener("wheel", wheel);

window.addEventListener("mouseup", function(event) {
    if (event.which == 1)
        selection = window.getSelection();

    if (selection.toString() !== '') {
        text = selection.toString().replace(/\s+$/, '');
        popup(event.clientX + "px", event.clientY + "px");
    } else {
        window.removeEventListener('keydown', keydown, false);
        window.removeEventListener('keyup', keyup, false);
        if (document.getElementById("xph2selection"))
            setTimeout(function() { document.getElementById("xph2selection").remove(); }, 0);
    }
}, false);

function popup(x, y) {
    div.style.left = x;
    div.style.top = y;
    window.addEventListener('keydown', keydown, false);
    window.addEventListener('keyup', keyup, false);
    if (require == false) {
        setTimeout(function() { document.body.appendChild(div); }, delay);
    }
}

function keydown(event) {
    if (require == true) {
        if (event.key == keyCode) {
            event.preventDefault();
            if (event.repeat)
                return;
            document.body.appendChild(div);
        }
    }
    if (keymap.hasOwnProperty(event.which)) {
        colornumber = keymap[event.which] - 1;
        divStyle(document.getElementById("xph2selection"));
    }
}

function keyup(event) {
    if (event.key == keyCode) {
        if (document.getElementById("xph2selection"))
            document.getElementById('xph2selection').remove();
    }
}

function test(event) {
    event.preventDefault();

    let job;
    if (event.which == 2 || event.which == 3) job = "clean";
    else job = "highlight";
    self.port.emit("selection", text, colornumber, job);

    text = '';
    window.removeEventListener('keydown', keydown, false);
    window.removeEventListener('keyup', keyup, false);
    window.getSelection().removeAllRanges();
}

function wheel(event) {
    var delta = Math.max(-1, Math.min(1, event.deltaY));
    colornumber = colornumber + delta;
    event.preventDefault();
    divStyle(event.target);
}

function divStyle(el) {
    colornumber = Math.max(0, Math.min(color.length - 1, colornumber));
    el.style.background = color[colornumber];
    el.style.color = getcontrast(color[colornumber]);
    el.textContent = colornumber + 1;
}

function getcontrast(hex) {
    var r = parseInt(hex.substr(1, 2), 16),
        g = parseInt(hex.substr(3, 2), 16),
        b = parseInt(hex.substr(5, 2), 16),
        yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
}