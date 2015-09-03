var self = require("sdk/self");
var tabs = require("sdk/tabs");
var timer = require('sdk/timers');
var pageMod = require('sdk/page-mod');
const { MenuButton } = require('./menu-button');

//To destroy pagemod when it's not needed
var mod = null;
// To add delay to the panel resize
var paneldelay;
//########## Create default values ##########//
var xhl = require("sdk/simple-storage");
//If MHL is doing changes
var working = false;

if (!xhl.storage.onloadenable)
    xhl.storage.onloadenable = false;

if (!xhl.storage.hlcheckboxes)
    xhl.storage.hlcheckboxes = {XPHLenable0:true, XPHLenable1:true, XPHLenable2:true, XPHLenable3:true, XPHLenable4:true};

if (!xhl.storage.botcheckboxes)
    xhl.storage.botcheckboxes = {casesens:false, regexp:false};

if (!xhl.storage.textareas)
    xhl.storage.textareas = {XPHLtextarea0:'', XPHLtextarea1:'', XPHLtextarea2:'', XPHLtextarea3:'', XPHLtextarea4:''};

if (!xhl.storage.colorpickers)
    xhl.storage.colorpickers = {XPHLinput0:"#FF0000", XPHLinput1:"#FF6600", XPHLinput2:"#FFFF00", XPHLinput3:"#33FF33", XPHLinput4:"#3333FF"};


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
//Handle click button highlight : panel
function click(state, isMenu) {  
isMenu ? panel.show({position: btn}) : highlight("all");
}

//############# ADD PANEL #############//
var panel = require("sdk/panel").Panel({
    width: 350,
    height: 251,
    contentURL: self.data.url("panel.html")
});
//send settings to panel
panel.port.emit("settings", xhl);
//Resize panel when needed
panel.port.on("text-resize", function (size) {
    size[0] == null ? size[0]=350:1;
    size[1] == null ? size[1]=251:1;
    //Clear panel timer so there's no resize if another textarea is selected.
    timer.clearTimeout(paneldelay);
    timer.setTimeout(function(){panel.resize(size[0],size[1])}, 280);
});
//########### Com panel -> Main ###########//
panel.port.on("panel-changed", function (object) {
    //console.log("id: " +object.id + " valor: " + object.value + " checked: " + object.checked);
    //On load checkbox
    if (object.id == "onloadenable") {
        xhl.storage.onloadenable = object.checked;
        if (object.checked == true)
            onloadenabled ();
    } else

    //Highlight checkboxes
    if (object.id.match(/XPHLenable/)) {
        xhl.storage.hlcheckboxes[object.id] = object.checked;
        //clean on checbox !checked
        !object.checked ? clean(object.id) : highlight(object.id);
    } else

    //Bottom checkboxes
    if (object.id == "casesens" || object.id == "regexp") {
        xhl.storage.botcheckboxes[object.id] = object.checked;
    } else

    //TextAreas
    if (object.id.match(/XPHLtextarea/)) {
        xhl.storage.textareas[object.id] = object.value;
        //Reduce panel height on textarea lossfocus
        paneldelay = timer.setTimeout(function(){panel.resize(350,251)}, 280);
    } else

    //ColorPickers
    if (object.id.match(/XPHLinput/)) {
        xhl.storage.colorpickers[object.id] = object.value;
    } else

    //CleanButton (not for storage)
    if (object.id == "clean") {
        clean(xhl.storage.hlcheckboxes);
    }

    //this should never happen
    else {console.log("this should never happen: ->  " + 
        "id: " +object.id + " valor: " + object.value + " checked: " + object.checked);}
});

//########### CREATE KEYBOARD SHORTCUTS ###########//
var { Hotkey } = require("sdk/hotkeys");

var highlightHK = Hotkey({
    combo: "accel-shift-o",
    onPress: function() {
        highlight("all");
    }
});
var cleanHK = Hotkey({
    combo: "accel-alt-shift-o",
    onPress: function() {
        clean(xhl.storage.hlcheckboxes);
    }
});

//########### HIGHLIGHT FUNCTION ###########//
function highlight (foo) {
    working = true;
    var worker = tabs.activeTab.attach({
        contentScriptFile: self.data.url("highlight.js")
    });
    if (foo == "all") {
        worker.port.emit("highlight", xhl, foo);
    } else {
    //Send just the number of object to be highlighted.
        for (var i = 0; i < Object.keys(xhl.storage.hlcheckboxes).length; i++){
            if (foo == Object.keys(xhl.storage.hlcheckboxes)[i])
                worker.port.emit("highlight", xhl, i);
        }
    }
    worker.port.on("finished", function() {
        working = false;
    })
}

//########### CLEAN FUNCTION ###########//
function clean (thing) {
	working = true;
    var worker = tabs.activeTab.attach({
        contentScriptFile: self.data.url("clean.js")
    });
    worker.port.emit("clean", thing);
    worker.port.on("finished", function() {
        working = false;
    })
}

//########### ENABLE ON PAGE LOAD ###########//
if (xhl.storage.onloadenable) onloadenabled ();
function onloadenabled () {
    if (xhl.storage.onloadenable) {
        mod = pageMod.PageMod({
            include: "*",
            attachTo: ["existing", "top"],
            contentScriptWhen: "end",
            contentScriptFile: self.data.url("listen.js"),
            onAttach: function(worker) {
                worker.port.on("onloadhl", function() {
                    if (!working) {
                        highlight("all");
                    }
                });
            }
        });

    } else 
    if (mod!=null){mod.destroy();}
}