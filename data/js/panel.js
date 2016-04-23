'use strict';

const modifier = /Control|Shift|Alt|PageUp|PageDown|Escape/;

function tab(evt, tabName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tabcontent.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the link that opened the tab
    document.getElementById(tabName).style.display = "inline-block";
    evt.currentTarget.className += " active";
    resize();
}
document.getElementsByClassName("tablinks")[0].click();

function resize() {
    let cs = document.getElementById("contentSize");
    addon.port.emit("panelSize", cs.scrollWidth, cs.scrollHeight);
    let timer = setTimeout(function() {
        if (document.documentElement.clientWidth < cs.scrollWidth && document.documentElement.clientWidth > 0) {
            let width = 2 * cs.scrollWidth - document.documentElement.clientWidth;
            addon.port.emit("panelSize", width, cs.scrollHeight);
        }
    }, 50);
}

function tResize(el) {
    if (el) change(el);
    let timer = setTimeout(function() {
        resize();
    }, 250);
}

addon.port.on('getPanelSize', function() {
    resize();
});

function addrow(load) {
    var rlength = document.getElementsByClassName("row").length,
        i = document.getElementsByClassName("s0");
    i = parseInt(i[rlength - 1].id);

    var div = document.getElementById("row0"),
        board = document.getElementById("textcont"),
        fragment = document.createDocumentFragment(),
        clon = div.cloneNode(true),
        color;

    //Random color
    if (!load) {
        color = "#" + ((1 << 24) * Math.random() | 0).toString(16);
        clon.querySelector('.colorpicker').value = color;
    }
    //Label id deduplication
    var labels = clon.querySelectorAll('.cblabel');
    labels[0].setAttribute("for", "enable" + (i + 1));
    labels[1].setAttribute("for", "casesens" + (i + 1));
    labels[2].setAttribute("for", "regexp" + (i + 1));
    labels = clon.querySelectorAll('.checkbox-cont');
    labels[0].setAttribute("for", "enable" + (i + 1));
    labels[1].setAttribute("for", "casesens" + (i + 1));
    labels[2].setAttribute("for", "regexp" + (i + 1));

    //Checkbox reset
    var cbs = clon.querySelectorAll('.checkbox');
    for (var k = 1; k < cbs.length; k++)
        cbs[k].checked = false;

    //Id deduplication
    clon.id = "row" + (i + 1);
    clon.querySelector('[id="enable0"]').id = "enable" + (i + 1);
    clon.querySelector('[id="casesens0"]').id = "casesens" + (i + 1);
    clon.querySelector('[id="regexp0"]').id = "regexp" + (i + 1);
    clon.querySelector('[id="0"]').id = (i + 1);

    fragment.appendChild(clon);
    board.appendChild(fragment);
    resize();

    if (!load) {
        addon.port.emit("panel-changed", "colorpickers", color, rlength);
        addon.port.emit("panel-changed", "textareas", "", rlength);
        addon.port.emit("panel-changed", "enabled", true, rlength);
        addon.port.emit("panel-changed", "casesens", false, rlength);
        addon.port.emit("panel-changed", "regexp", false, rlength);
    }
}

function removerow(row) {
    let rows = document.getElementsByClassName("row"),
        index = [].indexOf.call(rows, row);
    document.getElementById("textcont").removeChild(row);
    if (rows.length < 2) {
        document.getElementById("trashcb").checked = false;
        toggle(false);
    }
    resize();
    addon.port.emit("removerow", index);
}

function toggle(bool) {
    let style;
    var hidecbs = document.querySelectorAll(".row .checkbox-cont");
    if (hidecbs.length < 4 && bool == true) {
        document.getElementById("trashcb").checked = false;
        return;
    }
    bool == true ? style = 'none' : style = '';
    for (var i = 0; i < hidecbs.length; i++) {
        hidecbs[i].style.display = style;
    }

    let elements = document.querySelectorAll(".s0"),
        color = document.querySelectorAll(".hlColor"),
        text = document.querySelectorAll(".textarea");
    bool == true ? style = '' : style = 'none';
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.display = style;
        if (style == '')
            text[i].style.border = "1px solid " + color[i].value;
        else text[i].style.border = "1px solid #000";
    }
}

//Advanced tab
var old, success = false;

function addEvent(el) {
    success = false;
    if (el.checkValidity())
        old = el.value;
    el.addEventListener('keydown', keydown, true);
    setTimeout(function() { el.value = '' }, 5);
}

function removeEvent(el) {
    setTimeout(function() {
        el.removeEventListener('keydown', keydown, true);
        if (el.value == '')
            el.value = old;
        else
            check(el);
    }, 5);
}

function keydown(event) {
    event.preventDefault();
    if (event.repeat)
        return;
    success = false;
    var str = [],
        key = event.key;
    if (event.which == 27) {
        str = [];
        old = '';
        success = true;
        document.activeElement.blur();
    }
    switch (event.target.id) {
        case "shortcutH":
        case "shortcutC":
            if (event.ctrlKey)
                str.push('Ctrl');
            if (event.altKey)
                str.push('Alt');
            if (event.shiftKey)
                str.push('Shift');
            if (event.metaKey)
                str.push('Meta');

            if (!modifier.test(key)) {
                if (key.length < 2) {
                    key = key.toUpperCase();
                    if (key == ' ')
                        key = 'Space';
                }
                success = true;
                str.push(key);
                document.activeElement.blur();
            }
            break;
        case "shortcutK":
            if (key == ' ')
                key = 'Space';
            success = true;
            str.push(key);
            document.activeElement.blur();
            break;
        case "separator":
            if (!modifier.test(key)) {
                key = key.toUpperCase();
                success = true;
                str.push(key);
                document.activeElement.blur();
            }
            break;
    }
    document.getElementById(event.target.id).value = str.join(' + ');
}

function check(el) {
    setTimeout(function() { document.getElementById("send").click(); }, 50);
    setTimeout(function() {
        if (!el.checkValidity() || !success) {
            if (document.activeElement != el)
                el.value = old;
        } else change(el);
    }, 50);
}

//Set settings
addon.port.emit("ready");
addon.port.on("settings", function(xhl2) {

    //Highlight tab settings
    document.getElementById("onloadcb").checked = xhl2.storage.onloadenable;
    rowSettings(xhl2);

    //Selection tab settings
    document.getElementById("selection").checked = xhl2.storage.enableselection;
    document.getElementById("selectionkey").checked = xhl2.storage.selectionrequirekey;
    document.getElementById("delayinput").value = xhl2.storage.selectiondelay;

    let selColors = document.getElementsByClassName("selcolor");
    for (let i = 0; i < selColors.length; i++) {
        selColors[i].value = xhl2.storage.selectioncolors[i];
    }

    //Advanced tab settings
    document.getElementById("separator").value = xhl2.storage.separator;
    document.getElementById("shortcutH").value = xhl2.storage.highlightshortcut;
    document.getElementById("shortcutC").value = xhl2.storage.cleanshortcut;
    document.getElementById("shortcutK").value = xhl2.storage.selectionkey;

});

function rowSettings(xhl2) {
    let color = document.getElementsByClassName("hlColor"),
        text = document.getElementsByClassName("textarea"),
        enable = document.getElementsByClassName("cbEnable"),
        casesens = document.getElementsByClassName("cbCasesens"),
        regx = document.getElementsByClassName("cbRegexp");

    for (let i = 0; i < xhl2.storage.colorpickers.length; i++) {
        if (i > 0) addrow(true);
        color[i].value = xhl2.storage.colorpickers[i];
        text[i].value = xhl2.storage.textareas[i];
        enable[i].checked = xhl2.storage.enabled[i];
        casesens[i].checked = xhl2.storage.casesens[i];
        regx[i].checked = xhl2.storage.regexp[i];
    }
}

//Change settings
function change(element) {
    let name, value, rows, index;
    switch (true) {
        //Highlight settings
        case element.id == "onloadcb":
            name = "onloadenable";
            value = element.checked;
            index = null;
            break;
        //Selection settings
        case element.id == "selection":
            name = "enableselection";
            value = element.checked;
            index = null;
            break;
        case element.id == "selectionkey":
            name = "selectionrequirekey";
            value = element.checked;
            index = null;
            break;
        case element.id == "delayinput":
            name = "selectiondelay";
            value = element.value;
            index = null;
            break;

        //Advanced settings
        case element.id == "separator":
            name = "separator";
            value = element.value;
            index = null;
            break;
        case element.id == "shortcutH":
            name = "highlightshortcut";
            value = element.value;
            index = null;
            break;
        case element.id == "shortcutC":
            name = "cleanshortcut";
            value = element.value;
            index = null;
            break;
        case element.id == "shortcutK":
            name = "selectionkey";
            value = element.value;
            index = null;
            break;

        //Highlight row settings
        case element.className == "colorpicker hlColor":
            rows = document.getElementsByClassName("row");
            index = [].indexOf.call(rows, element.parentNode);
            name = "colorpickers";
            value = element.value;
            break;
        case element.className == "textarea":
            rows = document.getElementsByClassName("row");
            index = [].indexOf.call(rows, element.parentNode);
            name = "textareas";
            value = element.value;
            break;
        case element.className == "checkbox cbEnable":
            rows = document.getElementsByClassName("row");
            index = [].indexOf.call(rows, element.parentNode.parentNode);
            name = "enabled";
            value = element.checked;
            break;
        case element.className == "checkbox cbCasesens":
            rows = document.getElementsByClassName("row");
            index = [].indexOf.call(rows, element.parentNode.parentNode);
            name = "casesens";
            value = element.checked;
            break;
        case element.className == "checkbox cbRegexp":
            rows = document.getElementsByClassName("row");
            index = [].indexOf.call(rows, element.parentNode.parentNode);
            name = "regexp";
            value = element.checked;
            break;

        //Selection row settings
        case element.className == "colorpicker selcolor":
            rows = document.getElementById("selectioncolor").getElementsByTagName('div');
            index = [].indexOf.call(rows, element.parentNode);
            name = "selectioncolors";
            value = element.value;
            break;

        default:
            console.log("this should never happen: ->  " +
                "id: " + element.id + " class: " + element.className + " valor: " + element.value + " checked: " + element.checked);
    }
    addon.port.emit("panel-changed", name, value, index);
}

function mes(el) {
    addon.port.emit("message", el.className);
}

addon.port.on('updatetextareas', function(pos, updval) {
    document.getElementsByClassName("textarea")[pos].value = updval;
});