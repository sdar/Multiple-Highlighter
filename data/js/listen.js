'use strict';
var tim,
    excludes = 'html,head,style,title,link,script,noscript,object,iframe,canvas,applet';
function observeDomChanges(rootNode, callback) {
    var observer = new MutationObserver(function (mutations) {
        for (let i in mutations) {
            var mutation = mutations[i];
            for (let j = 0, k = mutation.addedNodes.length; j < k; j++) {
                var addedNode = mutation.addedNodes[j];
                if ( addedNode.nodeType == Node.ELEMENT_NODE && 
                  (excludes + ',').indexOf(addedNode.nodeName.toLowerCase() + ',') === -1 ) {
                    callback(addedNode);
                }
            }
        }
    });
    
    var observerConfig = {
        childList : true,   // observe changes in document structure
        subtree : true      // observe every element (if applied to BODY)
    };
    
    // modify rootNode immediately, then start observing other changes
    callback(rootNode);
    observer.observe(rootNode, observerConfig);
}

observeDomChanges(document.body, function (node) {
	clearTimeout(tim);
	tim = setTimeout(function(){
		self.port.emit("onloadhl")}, 200);
});

