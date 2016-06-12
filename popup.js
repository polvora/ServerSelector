var regions = ['NA', 'EU', 'AS', 'SA', 'OC'];

var regionTable = {
    'NA': ['US'],
    'EU': ['EU', 'RU', 'TK'],
    'AS': ['JP', 'TK', 'SG', 'CN'],
	'SA': ['BR'],
	'OC': ['SG']
};

var regionNames = {
	'NA': 'North America',
    'EU': 'Europe',
    'AS': 'Asia',
    'SA': 'South America',
	'OC': 'Oceania'
}

var options = {
	'NA': '',
    'EU': '',
    'AS': '',
    'SA': '',
	'OC': ''
}

var reIP = new RegExp('^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(:[0-9]{1,5})?$');
var reHN = new RegExp('^([a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,6}(:[0-9]{1,5})?$');
var reDomain = new RegExp('^[a-zA-Z]*:\/\/([a-zA-Z]+\.)*agar\.io\/.*$');

var isDownloadingData;


$(function() {
	listenMessages();
	
	$.get('toast.html', function(d){$('body').prepend(d);});
	
	$('#Combobox1').html('<option selected value="invalid">Obtaining Server List...</option>');
	$('#Combobox2').html('<option selected value="invalid">Obtaining Server List...</option>');
	
	$('#Combobox1').prop("disabled", true);
	$('#Combobox2').prop("disabled", true);
	
	isDownloadingData = true;
	$.getJSON('http://m.agar.io/fullInfo', serverListCallback);

	$('#Combobox1').change(regionChangeEvent);
	$('#Combobox2').change(serverChangeEvent);
	$('#Button1').click(goToPublicServerEvent);
	
	$('#Button2').click(addServerEvent);
	$('#Button3').click(deleteServerEvent);
	$('#Button5').click(goToSavedServerEvent);
	$('#Button4').click(setDefaultServerEvent);
	
	$('#Combobox3').change(savedServerChangeEvent);
	
	$('#Editbox1').on('input', nameChangeEvent);
	$('#Editbox2').on('input', addressChangeEvent);
	
	$('#Button6').click(copyPublicLinkEvent);
	$('#Button7').click(copyPrivateLinkEvent);
	$('#Button8').click(copyCurrentLinkEvent);
	
	loadSkin()
	updateSavedServersList();
	
	chrome.tabs.query({'active': true, 'currentWindow': true}, function (tabs) {
		if (reDomain.test(tabs[0].url)) {
			requestAddressFromPage();
			requestSkinInformation();
		}
	});
});

function loadSkin() {
	chrome.storage.sync.get(['skinSource', 'skinBorder'], function(items) {
		if (chrome.runtime.lastError) {
			console.log(chrome.runtime.lastError.message);
		}
		if (items != null && items['skinSource'] != null && items['skinBorder'] != null) {
			// This image is created to pass it as canvas to icon
			var img = document.getElementById('Image3');
			img.crossOrigin = "Anonymous";
			// This is to wait it to download the image from the url
			img.onload = function() {
				$(this).css('border-color',items['skinBorder']);
				var border = 10;
				var canvas = document.createElement('canvas'); // Create the canvas
				canvas.width = 150;
				canvas.height = 150;
				var context = canvas.getContext('2d');
				var centerX = canvas.width / 2.0;
				var centerY = canvas.height / 2.0;
				var radius = centerX - border;
				context.beginPath();
				context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
				context.lineWidth = border * 2;
				context.strokeStyle = items['skinBorder'];
				context.stroke();
				context.clip();
				context.drawImage(img, border / 2, border / 2, 
								canvas.width - border, canvas.height - border);
				canvas = downScaleCanvas(canvas, 19.0/150.0);
				context = canvas.getContext('2d');
				chrome.browserAction.setIcon({
					imageData: context.getImageData(0, 0, 19, 19)
				});
				$('#Image3').css('display','block');
			}
			$('#Image3').attr('src',items['skinSource']);
			
			$('img').one('error', function() { 
				chrome.browserAction.setIcon({
					path: 'icon.png'
				});
				$('#Image3').css('display','block');
			});
		}
		else {
			chrome.browserAction.setIcon({
					path: 'icon.png'
				});
			$('#Image3').css('display','block');
		}
	});
}

function listenMessages() {
	chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
		if (message.address != null && reIP.test(message.address)) {
			$('#wb_uid9 strong').text(message.address);
			document.body.style.height="520px";
			document.getElementsByTagName("html")[0].style.height="520px";
			$('#Editbox2').val(message.address);
		}
		else if (message.skinSource != null && message.skinBorder != null) {
			chrome.storage.sync.set({
				skinSource: message.skinSource,
				skinBorder: message.skinBorder}, 
				function(){
				if (chrome.runtime.lastError) {
					console.log(chrome.runtime.lastError.message);
				}
				loadSkin();
			});
			
		}
	});
}

function requestAddressFromPage() {
	// CONTENT SCRIPT
	// Has not access to web page variable
	// Running in extension context
	var contentScript = function() {
		// Event that listens to messages sent from web page
		// It will be self removed after execution
		// Resends messages from web page to popup (this file)
		var bridgeFunction = function(event) {
			chrome.runtime.sendMessage({address: event.detail});
			// Self removal of event
			document.removeEventListener(event.type, bridgeFunction);
			// Removal of injected element script
			var scriptElement = document.getElementById('serverSelectorInjection');
			scriptElement.parentNode.removeChild(scriptElement);
		};
		document.addEventListener('message', bridgeFunction);
		
		// Code that will be injected as a script element in the web page
		// It has access to javascript variables inside
		// It will be removed by content script after execution
		var codeToInject = function() {
			var __WS_send=WebSocket.prototype.send;
			WebSocket.prototype.send = function(data) {
				var address = '';
				try {
					var re=/(?:[0-9]{1,3}\.){1,3}[0-9]{1,3}\:[0-9]{1,5}/;
					address = re.exec(this.url)[0];
				}catch(err) {}
				__WS_send.apply(this,[data]);
				WebSocket.prototype.send=__WS_send;
				
				var event = new CustomEvent('message', { 'detail': address });
				document.dispatchEvent(event);
			}
		}
		
		var container = document.createElement('div');
		container.id = 'serverSelectorInjection';
		var script = document.createElement('script');
		script.appendChild(document.createTextNode('('+ codeToInject +')();'));
		container.appendChild(script);
		(document.body || document.head || document.documentElement).appendChild(container);
	};
	
	chrome.tabs.executeScript({
		code: '(' + contentScript + ')();'
	});
}

// Injects a Code Script that gathers the required info
function requestSkinInformation() {
	var contentScript = function () {
		var skinElement = document.getElementsByClassName("circle bordered")[0];
		if (skinElement == null) return;
		var skinSource = skinElement.src;
		var skinBorder = skinElement.style.borderColor;
		
		chrome.runtime.sendMessage({
			skinSource: skinSource, 
			skinBorder: skinBorder});
	};
	
	chrome.tabs.executeScript({
		code: '(' + contentScript + ')();'
	});
}

function generateServerNameString(string) {
	var code;
	var hasColon;
	var city;
	var mode;
	
	code = string.substring(0,2);
	hasColon = ~string.indexOf(':');
	city = string.substring(string.indexOf('-') + 1, hasColon? string.indexOf(':') : string.length);
	mode = hasColon? string.substring(string.indexOf(':') + 1) : 'ffa';
	
	switch (mode) {
		case 'ffa': mode = 'FFA'; break;
		case 'teams': mode = 'Teams'; break;
		case 'experimental': mode = 'Exp'; break;
		case 'party': mode = 'Party'; break;
	}
	
	return code + ' ' + city + ' (' + mode + ')';
}

function highlightError(item) {
	item.css("border", "1px solid red");
}

function highlightErrorTime(item, time) {
	item.css("border", "1px solid red");
	setTimeout(function(){item.css("border", "")}, time);
}

function turnOffErrorHiglight(item) {
	item.css("border", "");
}

function showToast(message, time) {
	$('#toastContent').text(message);
	$('#toast').stop().fadeIn(200).delay(time).fadeOut(200);
}

function copyToClipboard(message) {
	var input = document.createElement('textarea');
	document.body.appendChild(input);
	input.value = message;
	input.focus();
	input.select();
	document.execCommand('Copy');
	input.remove();
}

function serverListCallback(serverList) {
	var regionCode = "";
	var inRegion = false;
	var region = "";
	var serverName = "";
	var regionDropdown = $('#Combobox1');
	
	// Sort alphabetically
	serverList.servers.sort(function (a, b) {
		if(a.region < b.region) return -1;
		if(a.region > b.region) return 1;
		return 0;
	});
	
	regionDropdown.html('<option value="invalid">Select Region</option>');
	$('#Combobox2').html('<option value="invalid">Select Server</option>');
	
	$.each(serverList.servers, function(index, server) {
		regionCode = server.region.substring(0,2);
		// Obtain region of server
		for (var i in regions) {
			if (!regions.hasOwnProperty(i)) continue;
			inRegion = ($.inArray(regionCode, regionTable[regions[i]]) != -1)? true : false;
			if (inRegion){
				region = regions[i];
				// Store server for region
				if (server.isEnabled) {
					serverName = generateServerNameString(server.region)
					options[region] += '<option value="' + server.ip + '">' + serverName + ' (' + server.ip + ') (' + server.numPlayers + ' players)</option>';
				}
			}
		}
		// Check if region wasn't added before
		if (!(~regionDropdown.html().indexOf(regionNames[region]))) {
			// Add region as option
			regionDropdown.append('<option value="' + region + '">' + regionNames[region] + '</option>');
		}
	});	

	isDownloadingData = false;
	$('#Combobox1').prop("disabled", false);
	$('#Combobox2').prop("disabled", false);
}

function regionChangeEvent() {
	var region =  $(this).find('option:selected').val();
	
	$('#Combobox2').html('<option value="invalid">Select Server</option>');
	if (region != 'invalid') $('#Combobox2').append(options[region]);
}

function serverChangeEvent() {
	var selected =  $(this).find('option:selected');
	var ip = selected.val();
	
	if (ip != 'invalid') {
		var serverName = selected.html().substring(0, selected.html().indexOf(') (') + 1);
		$('#Editbox1').val(serverName);
		$('#Editbox2').val(ip);
		
		$("#Combobox3").val('invalid');
		$("#Combobox3").change();
	}
}

function goToPublicServerEvent() {
	var region =  $('#Combobox1').find('option:selected').val();
	var server =  $('#Combobox2').find('option:selected').val();
	
	if (region == 'invalid') highlightErrorTime($('#Combobox1'), 1000);
	
	if (server == 'invalid') {
		highlightErrorTime($('#Combobox2'), 1000);
		return;
	}
	
	chrome.tabs.query({'active': true, 'currentWindow': true}, function (tabs) {
		var url = "http://www.agar.io/?sip=" + server;
		if (reDomain.test(tabs[0].url)) {
			chrome.tabs.update(tabs[0].id, {url: url});
		}
		else {
			chrome.tabs.create({url: url});
		}
	});
}

function addServerEvent() {
	var name =  $('#Editbox1').val();
	var ip =  $('#Editbox2').val();
	var item = {};
	var isDuplicate = false;
	
	var validIp = reIP.test(ip) || reHN.test(ip);
	
	if (name == '') highlightErrorTime($('#Editbox1'), 1000);
	if (!validIp) highlightErrorTime($('#Editbox2'), 1000);
	
	if (name == '' || !validIp) return;
	
	$("#Combobox3 > option").each(function() {
		 if (this.value == ip) {
			 isDuplicate = true;
			 highlightErrorTime($('#Editbox2'), 1500);
			 showToast('Address Already Exists', 1500);
		 }
	});
	if (isDuplicate) return;
	
	item[ip] = name;
	chrome.storage.sync.set(item, function(){
		if (chrome.runtime.lastError) {
			console.log(chrome.runtime.lastError.message);
			return;
		}
    });
	updateSavedServersList(ip);
	showToast('Server Added to List', 1500);
}

function deleteServerEvent() {
	var ip = $('#Combobox3').find('option:selected').val();
	
	if (ip == 'invalid') {
		highlightErrorTime($('#Combobox3'), 1000);
		return;
	}
	turnOffErrorHiglight($('#Combobox3'));
	
	chrome.storage.sync.remove(ip, function(){
		if (chrome.runtime.lastError)
			console.log(chrome.runtime.lastError.message);
    });
	updateSavedServersList();
	showToast('Server Deleted', 1500);
}

function updateSavedServersList(selectedValue = null) {
	chrome.storage.sync.get(null, function(names) {
		if (chrome.runtime.lastError) {
			console.log(chrome.runtime.lastError.message);
			return;
		}
		
		var ips = Object.keys(names);
		var serversDropdown = $('#Combobox3');
		var isDefaultServerOnList;
		var defaultPrefix = '';
		
		// Generates server list
		serversDropdown.html('<option value="invalid">Select Server</option>');
		for (var i in ips) {
			if (!ips.hasOwnProperty(i) || ips[i] == 'default') continue;
			
			if(ips[i] == names['default']) {
				isDefaultServerOnList = true;
				defaultPrefix = '&spades; ';
			}
			else defaultPrefix = '';
			
			// Adds a bullet as prefix if this is the default server
			serversDropdown.append('<option value="' + ips[i] + '">' + defaultPrefix + names[ips[i]] + ' (' + ips[i] + ')' + '</option>');
		}
		
		// If default server is not present on list it's deleted
		if (!isDefaultServerOnList) {
			chrome.storage.sync.remove(['default'], function(){
				if (chrome.runtime.lastError)
					console.log(chrome.runtime.lastError.message);
			});
		}
		else $('#Combobox3').val(names['default']);
		
		if (selectedValue != null) 
			$('#Combobox3').val(selectedValue);
	});
}

function savedServerChangeEvent() {
	var selected = $('#Combobox3').find('option:selected');
	var ip = selected.val();
	var serverName;
	
	$(this).css("border", "");
	if (ip == 'invalid') return;
	
	chrome.storage.sync.get(ip, function(item){
		if (chrome.runtime.lastError) {
			console.log(chrome.runtime.lastError.message);
			return;
		}
		serverName = item[ip];
		
		$('#Editbox1').val(serverName);
		$('#Editbox2').val(ip);
		
		if (!isDownloadingData) {
			$("#Combobox1").val('invalid');
			$("#Combobox1").change();
		}
	});
}

function goToSavedServerEvent() {
	var server =  $('#Combobox3').find('option:selected').val();
	if (server == 'invalid') {
		highlightErrorTime($('#Combobox3'), 1000);
		return;
	}
	
	chrome.tabs.query({'active': true, 'currentWindow': true}, function (tabs) {
		var url = "http://www.agar.io/?sip=" + server;
		if (reDomain.test(tabs[0].url)) {
			chrome.tabs.update(tabs[0].id, {url: url});
		}
		else {
			chrome.tabs.create({url: url});
		}
	});
}

function setDefaultServerEvent() {
	var server =  $('#Combobox3').find('option:selected').val();
	
	chrome.storage.sync.set({'default': server}, function(){
		if (chrome.runtime.lastError) {
			console.log(chrome.runtime.lastError.message);
		}
    });
	updateSavedServersList();
	
	if (server != 'invalid') showToast('Sever Set as Default', 1500);
	else showToast('Default Server Unset', 1500);
}

function nameChangeEvent() {
	var input = $(this).val();
	
	if (input != '') turnOffErrorHiglight($(this));
	else highlightError($(this));
}

function addressChangeEvent() {
	var input = $(this).val();
	
	if (reIP.test(input) || reHN.test(input))
		turnOffErrorHiglight($(this));
	else 
		highlightError($(this));
}

function copyPublicLinkEvent() {
	var address = $('#Combobox2').find('option:selected').val();
	
	if ($('#Combobox1').find('option:selected').val() == 'invalid') {
		highlightErrorTime($('#Combobox1'), 1200);
	}
	if (address == 'invalid') {
		highlightErrorTime($('#Combobox2'), 1200);
		return;
	}
	copyToClipboard("http://www.agar.io/?sip=" + address);
	
	showToast('Copied to Clipboard', 2000);
}

function copyPrivateLinkEvent() {
	var address = $('#Combobox3').find('option:selected').val();
	if (address == 'invalid') {
		highlightErrorTime($('#Combobox3'), 1200);
		return;
	}
	copyToClipboard("http://www.agar.io/?sip=" + address);
	
	showToast('Copied to Clipboard', 2000);
}

function copyCurrentLinkEvent() {
	var address = $('#wb_uid9 strong').text();
	copyToClipboard("http://www.agar.io/?sip=" + address);
	showToast('Copied to Clipboard', 2000);
}

// scales the canvas by (float) scale < 1
// returns a new canvas containing the scaled image.
// http://stackoverflow.com/questions/18922880/html5-canvas-resize-downscale-image-high-quality
function downScaleCanvas(cv, scale) {
    if (!(scale < 1) || !(scale > 0)) throw ('scale must be a positive number <1 ');
    var sqScale = scale * scale; // square scale = area of source pixel within target
    var sw = cv.width; // source image width
    var sh = cv.height; // source image height
    var tw = Math.floor(sw * scale); // target image width
    var th = Math.floor(sh * scale); // target image height
    var sx = 0, sy = 0, sIndex = 0; // source x,y, index within source array
    var tx = 0, ty = 0, yIndex = 0, tIndex = 0; // target x,y, x,y index within target array
    var tX = 0, tY = 0; // rounded tx, ty
    var w = 0, nw = 0, wx = 0, nwx = 0, wy = 0, nwy = 0; // weight / next weight x / y
    // weight is weight of current source point within target.
    // next weight is weight of current source point within next target's point.
    var crossX = false; // does scaled px cross its current px right border ?
    var crossY = false; // does scaled px cross its current px bottom border ?
    var sBuffer = cv.getContext('2d').
    getImageData(0, 0, sw, sh).data; // source buffer 8 bit rgba
    var tBuffer = new Float32Array(4 * tw * th); // target buffer Float32 rgb
	var taW = new Float32Array(tw * th); // target alpha weights
    var sR = 0, sG = 0,  sB = 0; // source's current point r,g,b
    // untested !
    var sA = 0;  //source alpha    

    for (sy = 0; sy < sh; sy++) {
        ty = sy * scale; // y src position within target
        tY = 0 | ty;     // rounded : target pixel's y
        yIndex = 4 * tY * tw;  // line index within target array
        crossY = (tY != (0 | ty + scale)); 
        if (crossY) { // if pixel is crossing botton target pixel
            wy = (tY + 1 - ty); // weight of point within target pixel
            nwy = (ty + scale - tY - 1); // ... within y+1 target pixel
        }
        for (sx = 0; sx < sw; sx++, sIndex += 4) {
            tx = sx * scale; // x src position within target
            tX = 0 |  tx;    // rounded : target pixel's x
            tIndex = yIndex + tX * 4; // target pixel index within target array
            crossX = (tX != (0 | tx + scale));
            if (crossX) { // if pixel is crossing target pixel's right
                wx = (tX + 1 - tx); // weight of point within target pixel
                nwx = (tx + scale - tX - 1); // ... within x+1 target pixel
            }
            sR = sBuffer[sIndex    ];   // retrieving r,g,b for curr src px.
            sG = sBuffer[sIndex + 1];
            sB = sBuffer[sIndex + 2];
            sA = sBuffer[sIndex + 3];
			
            if (!crossX && !crossY) { // pixel does not cross
                // just add components weighted by squared scale.
                tBuffer[tIndex    ] += sR * sqScale;
                tBuffer[tIndex + 1] += sG * sqScale;
                tBuffer[tIndex + 2] += sB * sqScale;
                tBuffer[tIndex + 3] += sA * sqScale;
				if (sA == 0) { // accumulate the influence weight on target pixel
					taW[tIndex / 4] += sqScale;
				}
            } else if (crossX && !crossY) { // cross on X only
                w = wx * scale;
                // add weighted component for current px
                tBuffer[tIndex    ] += sR * w;
                tBuffer[tIndex + 1] += sG * w;
                tBuffer[tIndex + 2] += sB * w;
                tBuffer[tIndex + 3] += sA * w;
                // add weighted component for next (tX+1) px                
                nw = nwx * scale
                tBuffer[tIndex + 4] += sR * nw; 
                tBuffer[tIndex + 5] += sG * nw;
                tBuffer[tIndex + 6] += sB * nw; 
                tBuffer[tIndex + 7] += sA * nw; 
				
				if (sA == 0) { // accumulate the influence weight on target pixel
					taW[tIndex / 4] += w;
					taW[tIndex + 4 / 4] += nw;
				}
            } else if (crossY && !crossX) { // cross on Y only
                w = wy * scale;
                // add weighted component for current px
                tBuffer[tIndex    ] += sR * w;
                tBuffer[tIndex + 1] += sG * w;
                tBuffer[tIndex + 2] += sB * w;
                tBuffer[tIndex + 3] += sA * w;
                // add weighted component for next (tY+1) px                
                nw = nwy * scale
                tBuffer[tIndex + 4 * tw    ] += sR * nw;
                tBuffer[tIndex + 4 * tw + 1] += sG * nw;
                tBuffer[tIndex + 4 * tw + 2] += sB * nw;
                tBuffer[tIndex + 4 * tw + 3] += sA * nw;
				
				if (sA == 0) {
					taW[tIndex / 4] += w;
					taW[tIndex + 4 * tw / 4] += nw;
				}
            } else { // crosses both x and y : four target points involved
                // add weighted component for current px
                w = wx * wy;
                tBuffer[tIndex    ] += sR * w;
                tBuffer[tIndex + 1] += sG * w;
                tBuffer[tIndex + 2] += sB * w;
                tBuffer[tIndex + 3] += sA * w;
                // for tX + 1; tY px
                nw = nwx * wy;
                tBuffer[tIndex + 4] += sR * nw; // same for x
                tBuffer[tIndex + 5] += sG * nw;
                tBuffer[tIndex + 6] += sB * nw;
                tBuffer[tIndex + 7] += sA * nw;
                // for tX ; tY + 1 px
                nw = wx * nwy;
                tBuffer[tIndex + 4 * tw    ] += sR * nw; // same for mul
                tBuffer[tIndex + 4 * tw + 1] += sG * nw;
                tBuffer[tIndex + 4 * tw + 2] += sB * nw;
                tBuffer[tIndex + 4 * tw + 3] += sA * nw;
                // for tX + 1 ; tY +1 px
                nw = nwx * nwy;
                tBuffer[tIndex + 4 * tw + 4] += sR * nw; // same for both x and y
                tBuffer[tIndex + 4 * tw + 5] += sG * nw;
                tBuffer[tIndex + 4 * tw + 6] += sB * nw;
                tBuffer[tIndex + 4 * tw + 7] += sA * nw;
				
				if (sA == 0) { // accumulate the influence weight on target pixel
					taW[tIndex / 4] += w;
					taW[tIndex + 4 / 4] += nwx * wy;
					taW[tIndex + 4 * tw / 4] += wx * nwy;
					taW[tIndex + 4 * tw + 4 / 4] += nwx * nwy;
				}
            }
        } // end for sx 
    } // end for sy
	
	for (var tPixel = 0; tPixel < taW.length; tPixel++) {
		tBuffer[tPixel * 4    ] += 255.0 * taW[tPixel]; // R
		tBuffer[tPixel * 4 + 1] += 255.0 * taW[tPixel]; // G
		tBuffer[tPixel * 4 + 2] += 255.0 * taW[tPixel]; // B
	}

    // create result canvas
    var resCV = document.createElement('canvas');
    resCV.width = tw;
    resCV.height = th;
    var resCtx = resCV.getContext('2d');
    var imgRes = resCtx.getImageData(0, 0, tw, th);
    var tByteBuffer = imgRes.data;
    // convert float32 array into a UInt8Clamped Array
    var pxIndex = 0; //  
    for (sIndex = 0, tIndex = 0; pxIndex < tw * th; sIndex += 4, tIndex += 4, pxIndex++) {
        tByteBuffer[tIndex] = Math.ceil(tBuffer[sIndex]);
        tByteBuffer[tIndex + 1] = Math.ceil(tBuffer[sIndex + 1]);
        tByteBuffer[tIndex + 2] = Math.ceil(tBuffer[sIndex + 2]);
        tByteBuffer[tIndex + 3] = Math.ceil(tBuffer[sIndex + 3]);
    }
    // writing result to canvas.
    resCtx.putImageData(imgRes, 0, 0);
    return resCV;
}