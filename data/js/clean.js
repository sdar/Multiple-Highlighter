'use strict';
//###########Clean function############//
function getnodes(nodeclass) {
    let walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT),
        myarr = [];
    while (walker.nextNode()) {
        if (walker.currentNode.className == nodeclass) {
            myarr.push(walker.currentNode.parentNode);
        }
    }
    myarr = myarr.filter((elem, pos, arr) => arr.indexOf(elem) == pos)
    return myarr;
}

function clean(myarr, nodeclass) {
    let frag = document.createDocumentFragment(),
        elements, parent;
    for (let i = 0, l = myarr.length; i < l; i++) {
        frag.appendChild(myarr[i].cloneNode(true));
        elements = frag.querySelectorAll('.' + nodeclass);
        for (let i = 0, l = elements.length; i < l; i++) {
            elements[i].outerHTML = elements[i].textContent;
        }
        frag.normalize();
        myarr[i].parentNode.replaceChild(frag, myarr[i]);
    }
}

self.port.on("clean", function(arr) {
    let promises = [];
    if (typeof arr === 'object') {
        for (let i = 0; i < arr.length; i++) {
            promises.push(clean(getnodes('XPH2' + i), 'XPH2' + i));
        }
    } else {
        promises.push(clean(getnodes('XPH2' + arr), 'XPH2' + arr));
    }
    Promise.all(promises).then(function() { self.port.emit("finished"); });
});

self.port.on("selectionclean", function(arr) {
    let promises = [];
    promises.push(clean(getnodes(arr), arr));
    Promise.all(promises).then(function() { self.port.emit("finished"); });
});
