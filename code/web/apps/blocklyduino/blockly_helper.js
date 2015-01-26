/**
 * Execute the user's code.
 * Just a quick and dirty eval.  No checks for infinite loops, etc.
 */
function runJS() {
    var code = Blockly.Generator.workspaceToCode('JavaScript');
    try {
        eval(code);
    } catch (e) {
        alert('Program error:\n' + e);
    }
}


/**
 * User changed advanced options preference
 */

function advancedSettingChanged(obj) {
    //alert(obj);
    var areEnabled = obj.checked;
    Blockly.Toolbox.enableAdvancedBlocks(areEnabled);
}


/**
 * Backup code blocks to localStorage.
 */
function backup_blocks() {
    if ('localStorage' in window) {
        var xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
        window.localStorage.setItem('anibit3Pi', Blockly.Xml.domToText(xml));
    }
}

/**
 * Restore code blocks from localStorage.
 */
function restore_blocks() {
    if ('localStorage' in window && window.localStorage.anibit3Pi) {
        var xml = Blockly.Xml.textToDom(window.localStorage.anibit3Pi);
        Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);
    }
}

/**
 * Save blocks to local file.
 * better include Blob and FileSaver for browser compatibility
 */
function save() {
    var xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
    var data = Blockly.Xml.domToPrettyText(xml);

    // Store data in blob.
    // var builder = new BlobBuilder();
    // builder.append(data);
    // saveAs(builder.getBlob('text/plain;charset=utf-8'), 'blockduino.xml');
    console.log("saving blob");
    var blob = new Blob([data], {type: 'text/xml'});
    saveAs(blob, 'blockduino.xml');
}

/**
 * Load blocks from local file.
 */
function load(event) {
    var files = event.target.files;
    // Only allow uploading one file.
    if (files.length != 1) {
        return;
    }

    // FileReader
    var reader = new FileReader();
    reader.onloadend = function (event) {
        var target = event.target;
        // 2 == FileReader.DONE
        if (target.readyState == 2) {
            try {
                var xml = Blockly.Xml.textToDom(target.result);
            } catch (e) {
                alert('Error parsing XML:\n' + e);
                return;
            }
            var count = Blockly.mainWorkspace.getAllBlocks().length;
            if (count && confirm('Replace existing blocks?\n"Cancel" will merge.')) {
                Blockly.mainWorkspace.clear();
            }
            Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);
        }
        // Reset value of input after loading because Chrome will not fire
        // a 'change' event if the same file is loaded again.
        document.getElementById('load').value = '';
    };
    reader.readAsText(files[0]);
}

/**
 * Discard all blocks from the workspace.
 */
function discard() {
    var count = Blockly.mainWorkspace.getAllBlocks().length;
    if (count < 2 || window.confirm('Delete all ' + count + ' blocks?')) {
        Blockly.mainWorkspace.clear();
        renderContent();
    }
}

/*
 * auto save and restore blocks
 */
function auto_save_and_restore_blocks() {
    // Restore saved blocks in a separate thread so that subsequent
    // initialization is not affected from a failed load.
    window.setTimeout(restore_blocks, 0);
    // Hook a save function onto unload.
    bindEvent(window, 'unload', backup_blocks);
    tabClick('tab_' + selected);

    // Init load event.
    var loadInput = document.getElementById('load');
    loadInput.addEventListener('change', load, false);
    document.getElementById('fakeload').onclick = function () {
        loadInput.click();
    };
}

/**
 * Bind an event to a function call.
 * @param {!Element} element Element upon which to listen.
 * @param {string} name Event name to listen to (e.g. 'mousedown').
 * @param {!Function} func Function to call when event is triggered.
 *     W3 browsers will call the function with the event object as a parameter,
 *     MSIE will not.
 */
function bindEvent(element, name, func) {
    if (element.addEventListener) {  // W3C
        element.addEventListener(name, func, false);
    } else if (element.attachEvent) {  // IE
        element.attachEvent('on' + name, func);
    }
}

//loading examples via ajax
var ajax;
function createAJAX() {
    if (window.ActiveXObject) { //IE
        try {
            return new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
            try {
                return new ActiveXObject("Microsoft.XMLHTTP");
            } catch (e2) {
                return null;
            }
        }
    } else if (window.XMLHttpRequest) {
        return new XMLHttpRequest();
    } else {
        return null;
    }
}

function onSuccess() {
    if (ajax.readyState == 4) {
        if (ajax.status == 200 || (ajax.status == 0)) {
            try {
                var xml = Blockly.Xml.textToDom(ajax.responseText);
            } catch (e) {
                alert('Error parsing XML:\n' + e);
                return;
            }
            var count = Blockly.mainWorkspace.getAllBlocks().length;
            if (count && confirm('Replace existing blocks?\n"Cancel" will merge.')) {
                Blockly.mainWorkspace.clear();
            }
            Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);
        } else {
            alert("Server error");
        }
    }
}

function load_by_url(uri) {
    ajax = createAJAX();
    if (!ajax) {
        alert('Not compatible with XMLHttpRequest');
        return 0;
        }
    if (ajax.overrideMimeType) {
        ajax.overrideMimeType('text/xml');
    }

    ajax.onreadystatechange = onSuccess;
    ajax.open("GET", uri, true);
    ajax.send("");
}


//functions for loading examples
function loadExample() {
    if (window.exampleData) {
        var dialogDiv = document.getElementById("example_dialog");
        if (dialogDiv.style.visibility != "visible") {
            var exampleButton = document.getElementById('example_button');
            var buttonBounds = exampleButton.getBoundingClientRect();

            showExampleMenu(buttonBounds.right, buttonBounds.bottom);
        }
        else {
            closeExampleMenu();
        }
    }
}

function showExampleMenu(right, top) {
    showDimmer();
    var dialogDiv = document.getElementById("example_dialog");
    var examples = window.exampleData.examples;
    dialogDiv.innerHTML = "";
    var dialogHtml =
            "<div  style='text-align: center; width: 99%; float:left;'><strong>Select Example</strong>" + 
            "<button style=' float: right; overflow: hidden;' onclick='closeExampleMenu();'>X</button></div>" +
             "<table>";
    for (var i = 0; i < examples.length; i++) {
        dialogHtml += "<tr>";
        dialogHtml += "<td><div width='100%'><button  style='overflow: hidden; width: 100%;' onclick='loadNamedExample(\"" + examples[i].file + "\")'>" + examples[i].name + "</div></button></td>";
        dialogHtml += "<td>" + examples[i].description + "</td>";
        dialogHtml += "</tr>";
    }
    dialogHtml += "</table> "

    dialogDiv.innerHTML = dialogHtml;

    //var x = window.outerWidth/2 - dialogDiv.clientWidth/2;
    var left = right - dialogDiv.clientWidth;
    dialogDiv.style.left = left + "px";

    //var y = window.outerHeight/2 - dialogDiv.clientHeight/2;
    dialogDiv.style.top = top + "px";
    dialogDiv.style.visibility = "visible";
}

function closeExampleMenu() {
    hideDimmer();
    var dialogDiv = document.getElementById("example_dialog");
    dialogDiv.innerHTML = "";
    dialogDiv.style.visibility = "hidden";
}

function loadNamedExample(file) {
    load_by_url("examples/" + file);
    closeExampleMenu();
}

function about() {
    showDimmer();
    var dialogDiv = document.getElementById("about_dialog");
    if (dialogDiv.style.visibility != "visible") {
        dialogDiv.innerHTML = "<iframe class='about_frame' src='about.html' ></iframe>";
        //dialogDiv.innerHTML = "<iframe src='about.html' ></iframe>";
        
        //The div is full screen, the iframe within it occupied a fraction 
        //of it. This will ccenter the iframe within the div
        
        var iframe = dialogDiv.childNodes[0];
        
        
        dialogDiv.style.width = "100%";
        dialogDiv.style.height = "100%";
        
        var newLeft = dialogDiv.clientWidth / 2 - iframe.clientWidth /2;
        var newTop = dialogDiv.clientHeight /2 - iframe.clientHeight /2;
        
        iframe.style.left = newLeft + "px";
        iframe.style.top = newTop + "px";
        
        dialogDiv.style.visibility = "visible";
        
    }
    else {
        closeAboutDialog();
    }
}

function onAboutDivMouseDown() {
    closeAboutDialog();
}

function closeAboutDialog() {
    var dialogDiv = document.getElementById("about_dialog");
    dialogDiv.innerHTML = "";
    dialogDiv.style.visibility = "hidden";
    
    hideDimmer();

}

//from http://stackoverflow.com/questions/9975810/make-iframe-automatically-adjust-height-according-to-the-contents-without-using
function shrinkIFrame(obj) {
    {
        obj.style.height = 0;
    }
    ;
    {
        obj.style.height = (obj.contentWindow.document.body.scrollHeight) + 'px';
    }
}


function showDimmer() {
    var dimmerDiv = document.getElementById("dimmer_div");
    dimmerDiv.style.visibility = "visible";
}

function hideDimmer() {
    var dimmerDiv = document.getElementById("dimmer_div");
    dimmerDiv.style.visibility = "hidden";
}