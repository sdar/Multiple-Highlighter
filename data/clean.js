//###########Clean function############//
function clean (something){
	return new Promise(function(resolve) {
		var y = document.getElementsByClassName(something);
		c = y.length;
		for (var i=0; i < c; i++) {
			y[0].outerHTML = y[0].innerHTML;
		}
		resolve();
	});
}

self.port.on("clean", function(hlcheckboxes) {
	var promises = [];
	if (typeof hlcheckboxes === 'object') {
		for (var i in hlcheckboxes) {
			promises.push(clean(i));
    	}
	} else {
		promises.push(clean(hlcheckboxes));
	}
	Promise.all(promises).then(function() {
    	setTimeout(function(){ self.port.emit("finished") }, 220);
    })
});