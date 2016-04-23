'use strict';
//###########Clean function############//
function clean(something) {
    return new Promise(function(resolve) {
        let y = document.getElementsByClassName(something),
            c = y.length;
        for (let i = 0; i < c; i++) {
            y[0].parentNode.insertBefore(y[0].firstChild, y[0]);
            y[0].parentNode.removeChild(y[0]);
        }
        resolve();
    });
}

self.port.on("clean", function(arr) {
    let promises = [];
    if (typeof arr === 'object') {
        for (let i = 0; i < arr.length; i++) {
            promises.push(clean('XPH2' + i));
        }
    } else {
        promises.push(clean('XPH2' + arr));
    }
    Promise.all(promises).then(function() {
        setTimeout(function() { self.port.emit("finished") }, 220);
    })
});

self.port.on("selectionclean", function(arr) {
    let promises = [];
    promises.push(clean(arr));
    Promise.all(promises).then(function() {
        setTimeout(function() { self.port.emit("finished") }, 220);
    })
});