'use strict';

function findAndReplace(searchText, color, bgcolor, spanclass) {
    if (!searchText) return;
    let nodearray = [],
        walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT),
        excludes = 'style,title,link,script,noscript,object,canvas,applet',
        spanclasses = /XPH2/,
        span = document.createElement("hlspan");
    span.style.backgroundColor = bgcolor;
    span.style.color = color;
    span.className = spanclass;

    return new Promise(function(resolve) {
        while (walker.nextNode()) {
            if (searchText.test(walker.currentNode.nodeValue) && walker.currentNode.parentNode.className != spanclass && (excludes + ',').indexOf(walker.currentNode.parentNode.nodeName.toLowerCase() + ',') === -1) {
                if (spanclasses.test(walker.currentNode.parentNode.className)) {
                    if (walker.currentNode.textContent != walker.currentNode.textContent.match(searchText))
                        nodearray.push(walker.currentNode);
                    else {
                        walker.currentNode.parentNode.className = spanclass;
                        walker.currentNode.parentNode.style.color = color;
                        walker.currentNode.parentNode.style.backgroundColor = bgcolor;
                    }
                } else {
                    nodearray.push(walker.currentNode);
                }
            }
            searchText.lastIndex = 0;
        }

        //frames/iframes code
        try {
            for (let i = 0, l = window.frames.length; i < l; i++) {
                let spanWalker = document.createTreeWalker(window.frames[i].document.body, NodeFilter.SHOW_TEXT);
                while (spanWalker.nextNode()) {
                    if (searchText.test(spanWalker.currentNode.nodeValue) && walker.currentNode.parentNode.className != spanclass && (excludes + ',').indexOf(walker.currentNode.parentNode.nodeName.toLowerCase() + ',') === -1) {
                        if (spanclasses.test(walker.currentNode.parentNode.className)) {
                            walker.currentNode.parentNode.className = spanclass;
                            walker.currentNode.parentNode.style.color = color;
                            walker.currentNode.parentNode.style.backgroundColor = bgcolor;
                        } else {
                            nodearray.push(spanWalker.currentNode);
                        }
                    }
                    searchText.lastIndex = 0;
                }
            }
        } catch (err) {
            //console.log = err.message;
        }

        for (let i = 0, l = nodearray.length; i < l; i++) {
            let split = [];
            split = splitToArray(nodearray[i].textContent, searchText);
            nodearray[i].parentNode.replaceChild(populate(split, span), nodearray[i]);
        }
        resolve();
    });
}

function populate(split, span) {
    let frag = document.createDocumentFragment();
    split.forEach((text, index) => {
        let append;
        if (index % 2) {
            append = span.cloneNode();
            append.textContent = text;
        } else {
            append = document.createTextNode(text);
        }
        frag.appendChild(append);
    });
    return frag
}

function splitToArray(text, exp) {
    let offset = [0],
        split = [];
    text.replace(exp, function(match) {
        let startOffset = arguments[arguments.length - 2];
        offset.push(startOffset + match.length);
        split.push(arguments[arguments.length - 1].substring(offset[offset.length - 2], startOffset));
        split.push(arguments[arguments.length - 1].substring(startOffset, offset[offset.length - 1]));
    });
    split.push(text.substring(offset[offset.length - 1]));
    return split;
}

self.port.on("highlight", function(xhl2, foo) {
    let matchesRegExpWithFlags = /^\/(.*)\/{1}([gimy]{0,4})$/,
        promises = [],
        text,
        casesens,
        regexp;
    if (foo == "all") {
        foo = [];
        for (var i = 0; i < xhl2.storage.enabled.length; i++) {
            //textarea enabled and not empty
            if (xhl2.storage.enabled[i] && xhl2.storage.textareas[i]) {
                foo.push(i);
            }
        }
    } else { foo = [foo]; }
    for (let i of foo) {
        xhl2.storage.casesens[i] ? casesens = "g" : casesens = "gi";
        if (xhl2.storage.regexp[i]) {
            text = matchesRegExpWithFlags.exec(xhl2.storage.textareas[i]);
            text = new RegExp(text[1], text[2]);
        } else {
            text = validate(xhl2.storage.textareas[i],xhl2.storage.separator);
            text = new RegExp(text, casesens);
        }
        promises.push(findAndReplace(text, getcontrast(xhl2.storage.colorpickers[i]), xhl2.storage.colorpickers[i], 'XPH2' + i));
    }
    //All promises resolved.
    Promise.all(promises).then(function() { self.port.emit("finished"); });
});

self.port.on("selectionhighlight", function(seltext, color, colornumber) {
    let promises = [];
    let text = new RegExp(seltext.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&'), "gi");
    promises.push(findAndReplace(text, getcontrast(color), color, 'XPH2S' + colornumber));
    Promise.all(promises).then(function() { self.port.emit("finished"); });
});

function validate(str, separator) {
    //remove last character if separator or separator+' '.
    if (str.slice(-1) == ' ') str = str.slice(0, -1);
    if (str.slice(-1) == separator) str = str.slice(0, -1);
    //Escape regexp characters on string and separator
    str = str.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
    if (/[\\^$*+?.()|[\]{}]/.test(separator))
        separator = separator.replace(/[\\^$*+?.()|[\]{}]/g, '\\\\\\$&');
    //replace separator for |
    str = str.replace(new RegExp(separator, 'g'), '|');
    return str;
}

//Function that get the font color (YIQ)
//more info: http://24ways.org/2010/calculating-color-contrast/
function getcontrast(hex) {
    var r = parseInt(hex.substr(1, 2), 16),
        g = parseInt(hex.substr(3, 2), 16),
        b = parseInt(hex.substr(5, 2), 16),
        yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
}
