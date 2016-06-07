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

var reIP = '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(:[0-9]{1,5})?$';
var reHN = '^([a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,6}(:[0-9]{1,5})?$';

var isDownloadingData;

$(function() {
	$.get('toast.html', function(data){
		$('body').prepend(data);
	});
	
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
	
	updateSavedServersList();
});

function generateServerNameString(string) {
	var code;
	var hasColon;
	var city;
	var mode;
	
	code = string.substring(0,2);
	hasColon = ~string.indexOf(':');
	city = string.substring(string.indexOf('-') + 1, hasColon? string.indexOf(':') : string.length);
	mode = hasColon? string.substring(string.indexOf(':') + 1) : 'ffa';
	
	switch(mode) {
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
	
	chrome.tabs.create({
     url: "http://www.agar.io/?sip=" + server
	});
}

function addServerEvent() {
	var name =  $('#Editbox1').val();
	var ip =  $('#Editbox2').val();
	var item = {};
	var isDuplicate = false;
	
	var validIp = ip.match(reIP) || ip.match(reHN);
	
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
	updateSavedServersList();
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
function updateSavedServersList() {
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
	
	chrome.tabs.create({
     url: "http://www.agar.io/?sip=" + server
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
	
	if (input.match(reIP) || input.match(reHN)) 
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