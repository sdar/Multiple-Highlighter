'use strict';
const { MenuButton } = require('./menu-button');
var self = require("sdk/self"),
    tabs = require("sdk/tabs"),
    timer = require('sdk/timers'),
    { Hotkey } = require("sdk/hotkeys"),
    pageMod = require('sdk/page-mod'),
    xhl = require("sdk/simple-storage"),
    cm = require("sdk/context-menu"),
    loadmod, selmod,
    paneldelay,
    working = false,
    contextm, list,
    highlightHK, cleanHK,
    xhl2 = require("sdk/simple-storage");

if (xhl.storage.textareas) {
    //onload
    delete xhl.storage.onloadenable
    //HLCheckboxes
    delete xhl.storage.hlcheckboxes
    //BottomCheckboxes
    delete xhl.storage.botcheckboxes
    //Context Menus colorpickers
    delete xhl.storage.CMcolorpicker
    //Textareas
    let textareasdata = xhl.storage.textareas;
    delete xhl.storage.textareas
    //ColorPickers
    let colorpickersdata = xhl.storage.colorpickers;
    delete xhl.storage.colorpickers
    xhl2.storage.textareas = Object.keys(textareasdata).map(function (key) {return textareasdata[key]});
    xhl2.storage.colorpickers = Object.keys(colorpickersdata).map(function (key) {return colorpickersdata[key]});
}

//Highlight tab storage
xhl2.storage.onloadenable = xhl2.storage.onloadenable || false;
xhl2.storage.colorpickers = xhl2.storage.colorpickers || ["#FF0000", "#FF6600", "#FFFF00", "#33FF33", "#3333FF"];
xhl2.storage.textareas = xhl2.storage.textareas || ["", "", "", "", ""];
xhl2.storage.enabled = xhl2.storage.enabled || [true, true, true, true, true];
xhl2.storage.casesens = xhl2.storage.casesens || [false, false, false, false, false];
xhl2.storage.regexp = xhl2.storage.regexp || [false, false, false, false, false];
//Selection tab storage
xhl2.storage.enableselection = xhl2.storage.enableselection || true;
xhl2.storage.selectionrequirekey = xhl2.storage.selectionrequirekey || true;
xhl2.storage.selectiondelay = xhl2.storage.selectiondelay || 0;
xhl2.storage.selectioncolors = xhl2.storage.selectioncolors || ["#5F72C9", "#C98A00", "#00FFFF", "#7FFFBB", "#999999"];
//Advanced tab storage
xhl2.storage.separator = xhl2.storage.separator || ",";
xhl2.storage.highlightshortcut = xhl2.storage.highlightshortcut || "Ctrl + Shift + O";
xhl2.storage.cleanshortcut = xhl2.storage.cleanshortcut || "Ctrl + Alt + Shift + O";
xhl2.storage.selectionkey = xhl2.storage.selectionkey || "Shift";

//############# Add Menu Button #############//
var btn = MenuButton({
    id: 'xhl',
    label: 'xhl',
    icon: {
        "16": "./icon-16.png",
        "32": "./icon-32.png",
        "64": "./icon-64.png"
    },
    onClick: click
});
//Handle click highlight : panel
function click(state, isMenu) {
    isMenu ? panel.show({ position: btn }) : highlight("all");
    //enable tooltips
    require('sdk/view/core').getActiveView(panel).setAttribute('tooltip', 'aHTMLTooltip');
}

//############# ADD PANEL #############//
var panel = require("sdk/panel").Panel({
    contentURL: self.data.url("panel.html")
});
panel.on("show", function() {
    panel.port.emit("getPanelSize");
});
panel.port.on("panelSize", function(width, height) {
    panel.resize(width, height);
});
//send settings to panel when ready
panel.port.on("ready", function() {
    panel.port.emit("settings", xhl2);
});
//Splice arrays
panel.port.on("removerow", function(index) {
    xhl2.storage.colorpickers.splice(index, 1);
    xhl2.storage.textareas.splice(index, 1);
    xhl2.storage.enabled.splice(index, 1);
    xhl2.storage.casesens.splice(index, 1);
    xhl2.storage.regexp.splice(index, 1);
    //remove contextmenu
    //contextm.removeItem(list[index]);
    contextm.destroy();
    addcontextmenu();
});

//########### Com panel -> Main ###########//
panel.port.on("panel-changed", function(name, value, index) {
    if (index == null)
        xhl2.storage[name] = value;
    else
        xhl2.storage[name][index] = value;

    //extra functions
    switch (name) {
        case "onloadenable":
            value == true && highlight("all");
            onloadenabled();
            break;
        case "enabled":
            value == true ? highlight(index) : clean(index);
            break;
        case "enableselection":
            selectionFunction();
            break;
        case "colorpickers":
            updatecm(value, index);
            break;
        case "highlightshortcut":
        case "cleanshortcut":
        	highlightHK.destroy();
        	cleanHK.destroy();
        	addhotkeys();
        	break;
    }
});

panel.port.on("message", function(value) {
    if (value == "highlight") highlight("all");
    if (value == "clean") clean(xhl2.storage.enabled);
});

//########### CREATE KEYBOARD SHORTCUTS ###########//
addhotkeys();
function addhotkeys() {
    let hlhk = xhl2.storage.highlightshortcut.split("+");
    let clhk = xhl2.storage.cleanshortcut.split("+");

    clhk = clhk.map(function(e) {
        return e.trim()
    });
    hlhk = hlhk.map(function(e) {
        return e.trim()
    });
    hlhk = hlhk.join("-");
    clhk = clhk.join("-");

    highlightHK = Hotkey({
        combo: hlhk,
        onPress: function() { highlight("all"); }
    });
    cleanHK = Hotkey({
        combo: clhk,
        onPress: function() { clean(xhl2.storage.enabled); }
    });
}

//########### HIGHLIGHT FUNCTION ###########//
function highlight(stuff) {
    working = true;
    var worker = tabs.activeTab.attach({
        contentScriptFile: self.data.url("js/highlight.js")
    });
    worker.port.emit("highlight", xhl2, stuff);
    worker.port.on("finished", function() { working = false; });
}

function selectionHighlight(text, colornumber) {
    working = true;
    var worker = tabs.activeTab.attach({
        contentScriptFile: self.data.url("js/highlight.js")
    });
    worker.port.emit("selectionhighlight", text, xhl2.storage.selectioncolors[colornumber], colornumber);
    worker.port.on("finished", function() { working = false; });
};


//########### CLEAN FUNCTION ###########//
function clean(stuff) {
    working = true;
    var worker = tabs.activeTab.attach({
        contentScriptFile: self.data.url("js/clean.js")
    });
    worker.port.emit("clean", stuff);
    worker.port.on("finished", function() { working = false; });
}

function selectionClean(text, colornumber) {
    working = true;
    var worker = tabs.activeTab.attach({
        contentScriptFile: self.data.url("js/clean.js")
    });
    worker.port.emit("selectionclean", 'XPH2S' + colornumber);
    worker.port.on("finished", function() { working = false; });
};

//########### ENABLE ON PAGE LOAD ###########//
onloadenabled();
function onloadenabled() {
    if (xhl2.storage.onloadenable) {
        loadmod = pageMod.PageMod({
            include: "*",
            attachTo: ["existing", "top"],
            contentScriptWhen: "end",
            contentScriptFile: self.data.url("js/listen.js"),
            onAttach: function(worker) {
                worker.port.on("onloadhl", function() {
                    if (!working) highlight("all");
                });
            }
        });
    } else { if (loadmod) loadmod.destroy(); }
}

//########### SELECTION PANEL ###########//
selectionFunction();
function selectionFunction() {
    if (xhl2.storage.enableselection) {
        selmod = pageMod.PageMod({
            include: "*",
            attachTo: ["existing", "top"],
            contentScriptWhen: "ready",
            contentScriptFile: self.data.url("js/selection.js"),
            onAttach: function(worker) {
                worker.port.on("selsettingsrequest", function() {
                    worker.port.emit("selsettings",
                        xhl2.storage.selectioncolors, xhl2.storage.selectiondelay,
                        xhl2.storage.selectionkey, xhl2.storage.selectionrequirekey);
                });
                worker.port.on("selection", function( text, colornumber, job) { 
                if (job == "clean")
                    selectionClean(text,colornumber);
                else
                    selectionHighlight(text,colornumber);
            });
            }
        });
    } else {
        if (selmod) selmod.destroy();
    }
}

//############## CONTEXT MENU ##############//
addcontextmenu();
function addcontextmenu() {
    list = [];

    for (let i = 0; i < xhl2.storage.colorpickers.length; i++) {
        list[i] = cm.Item({
            label: "List" + (i + 1),
            data: i.toString(),
            contentScript: 'self.on("click", function (node, data) {  ' +
                '   var text = window.getSelection().toString();  ' +
                '   self.postMessage([text, data]);               ' +
                '});',
            onMessage: function(text) {
                addtolist(text);
            },
            image: self.data.url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%2248%22%20height%3D%2248%22%20fill%3D%22%23' + xhl2.storage.colorpickers[i].substring(1) + '%22%2F%3E%3C%2Fsvg%3E')
        });
    }

    contextm = cm.Menu({
        label: "Add to",
        context: cm.SelectionContext(),
        contentScript: 'self.on("context", function () {' +
            '  var text = window.getSelection().toString();' +
            '  if (text.length > 20)' +
            '    text = text.substr(0, 20) + "...";' +
            '  return "Add " +"\\""+ text +"\\""+ " to";' +
            '});',
        items: list,
        image: self.data.url("icon-16.png")
    });
}

function updatecm(value, index) {
    if (list.length <= index) {
        contextm.destroy();
        addcontextmenu();
    } else
    list[index].image = self.data.url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%2248%22%20height%3D%2248%22%20fill%3D%22%23' + xhl2.storage.colorpickers[index].substring(1) + '%22%2F%3E%3C%2Fsvg%3E');
}

function addtolist(text) {
    text[0] = text[0].trim();

    if (xhl2.storage.textareas[text[1]] =='')
        xhl2.storage.textareas[text[1]] = text[0];
    else
        xhl2.storage.textareas[text[1]] = xhl2.storage.textareas[text[1]] + xhl2.storage.separator + text[0];

    panel.port.emit("updatetextareas", text[1], xhl2.storage.textareas[text[1]]);
}