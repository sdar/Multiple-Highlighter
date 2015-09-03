//################## SET PANEL SETTINGS ##################//
addon.port.on("settings", function(xhl) {

	//set On load enable button status
	document.getElementById("onloadenable").checked = xhl.storage.onloadenable;
	//set Highlight checkboxes status
	for (var i in xhl.storage.hlcheckboxes) {
		document.getElementById(i).checked = xhl.storage.hlcheckboxes[i];
	}
	//set Bottom checkboxes status
	for (var i in xhl.storage.botcheckboxes) {
		document.getElementById(i).checked = xhl.storage.botcheckboxes[i];
	}
	//set Textarea values
	for (var i in xhl.storage.textareas) {
		document.getElementById(i).value = xhl.storage.textareas[i];
	}
	//set colorpickers values
	for (var i in xhl.storage.colorpickers) {
		document.getElementById(i).value = xhl.storage.colorpickers[i];
	}
	//Set Context-menu colorpicker value
	/*for (var i in xhl.storage.CMcolorpicker) {
		document.getElementById(i).value = xhl.storage.colorpickers[i];
	}*/

});

//sends id and value/status of html elements to main.js
function mes (object) {
	object = {
		id: object.id,
		value: object.value,
		checked: object.checked
	}
	addon.port.emit("panel-changed", object);
}

function rsize(w,h) {
	var size = [w,h]; 
	addon.port.emit("text-resize", size);
}