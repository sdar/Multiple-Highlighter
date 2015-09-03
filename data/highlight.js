function findAndReplace (searchText, replacement) {
    if (!searchText){
        return;
    }
    var excludes = 'html,head,style,title,link,script,noscript,object,iframe,canvas,applet';
    var wrap = document.createElement('div');
    var frag = document.createDocumentFragment();
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var nextnode=true;

    return new Promise(function(resolve) {
        while(nextnode){
            if(searchText.test(walker.currentNode.nodeValue)
               && (excludes + ',').indexOf(walker.currentNode.parentNode.nodeName.toLowerCase() + ',') === -1
              ){
                var html = walker.currentNode.data.replace(searchText, replacement);
                wrap.innerHTML = html;
                while (wrap.firstChild) {                
                    frag.appendChild(wrap.firstChild);    
                }
                var nodeToReplace=walker.currentNode;
                nextnode=walker.nextNode();
                nodeToReplace.parentNode.replaceChild(frag,nodeToReplace);            
            }else{
                nextnode=walker.nextNode();
            }
        }
        resolve();
    });
}

//foo is "all" or var
self.port.on("highlight", function(xhl, foo) {
    var matchesRegExpWithFlags = /^\/(.*)\/{1}([gimy]{0,4})$/;
    var promises = [];
    var casesens;
    xhl.storage.botcheckboxes['casesens'] ? casesens = 'g' : casesens = 'gi';
    //Create array of ids to highlight
    if (foo == "all") {
        foo = [];
        for (var i = 0; i < Object.keys(xhl.storage.hlcheckboxes).length; i++) {
            //textarea enabled and not empty
            if (xhl.storage.hlcheckboxes['XPHLenable'+i] && xhl.storage.textareas['XPHLtextarea'+i]) {
                foo.push(i);
            }
        }
    } else { 
        if (xhl.storage.textareas['XPHLtextarea'+foo]) {
            foo = [foo];
        } else foo = [];
    }
    //Loop throught array
    for (let i of foo) {
        if (!xhl.storage.botcheckboxes['regexp']) {
            var text = xhl.storage.textareas['XPHLtextarea'+i].replace(new RegExp(',', 'g'),'|');
            text = new RegExp(text, casesens);
        } else {
            var text = matchesRegExpWithFlags.exec(xhl.storage.textareas['XPHLtextarea'+i]);
            text = new RegExp(text[1], text[2]);
            //var text = xhl.storage.textareas['XPHLtextarea'+i];
        }
        //highlight
        promises.push(findAndReplace(text,
        '<span class="XPHLenable'+i
        +'" style="color:'+getcontrast(xhl.storage.colorpickers['XPHLinput'+i])
        +';Background-color:'+xhl.storage.colorpickers['XPHLinput'+i]+'">$&</span>'));
    }
    //All promises resolved.
    Promise.all(promises).then(function() {
        //the listen function has a timer so i need a ~200 timer here too
        setTimeout(function(){ self.port.emit("finished"); }, 220);
    })
});

//Function that get the font color (YIQ)
//more info: http://24ways.org/2010/calculating-color-contrast/
function getcontrast(hex) {
    var r = parseInt(hex.substr(1, 2), 16),
        g = parseInt(hex.substr(3, 2), 16),
        b = parseInt(hex.substr(5, 2), 16),
        yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
}