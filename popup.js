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

var isDownloadingData;

$(function() {
	$('#Combobox1').html('<option selected value="invalid">Obtaining Server List...</option>');
	$('#Combobox2').html('<option selected value="invalid">Obtaining Server List...</option>');
	
	$('#Combobox1').prop("disabled", true);
	$('#Combobox2').prop("disabled", true);
	$('#Button1').prop("disabled", true);
	
	isDownloadingData = true;
	$.getJSON('http://m.agar.io/fullInfo', serverListCallback);

	$('#Combobox1').change(regionChangeEvent);
	$('#Combobox2').change(serverChangeEvent);
	$('#Button1').click(goToPublicServerEvent);
	
	$('#Button2').click(addServerEvent);
	$('#Button3').click(deleteServerEvent);
	$('#Button5').click(goToSavedServerEvent);
	
	$('#Combobox3').change(savedServerChangeEvent);
	
	
	updateSavedServersList();
});

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

function regionChangeEvent() {
	var region =  $(this).find('option:selected').val();
	
	$('#Combobox2').html('<option value="invalid">Select Server</option>');
	if (region != 'invalid') $('#Combobox2').append(options[region]);
	
	$('#Button1').prop("disabled", true);
}

function serverChangeEvent() {
	var selected =  $(this).find('option:selected');
	var ip = selected.val();
	
	if (ip == 'invalid') {
		$('#Button1').prop("disabled", true);
	}
	else {
		var serverName = selected.html().substring(0, selected.html().indexOf(') (') + 1);
		$('#Editbox1').val(serverName);
		$('#Editbox2').val(ip);
		
		$('#Button1').prop("disabled", false);
		$("#Combobox3").val('invalid');
		$("#Combobox3").change();
	}
}

function goToPublicServerEvent() {
	var server =  $('#Combobox2').find('option:selected').val();
	console.log(server);
	if (server == 'invalid') return;
	
	chrome.tabs.create({
     url: "http://www.agar.io/?sip=" + server
	});
}

function addServerEvent() {
	var name =  $('#Editbox1').val();
	var ip =  $('#Editbox2').val();
	var item = {};
	
	if (name == '' || ip == '') return;

	item[ip] = name;
	chrome.storage.sync.set(item, function(){
		if (chrome.runtime.lastError) {
			console.log(chrome.runtime.lastError.message);
			return;
		}
    });
	updateSavedServersList();
}

function deleteServerEvent() {
	var ip = $('#Combobox3').find('option:selected').val();
	
	if (ip == 'invalid') return;
	
	chrome.storage.sync.remove(ip, function(){
		if (chrome.runtime.lastError) {
			console.log(chrome.runtime.lastError.message);
			return;
		}
    });
	updateSavedServersList();
}
function updateSavedServersList() {
	chrome.storage.sync.get(null, function(names) {
		if (chrome.runtime.lastError) {
			console.log(chrome.runtime.lastError.message);
			return;
		}
		
		var ips = Object.keys(names);
		var serversDropdown = $('#Combobox3');
		serversDropdown.html('<option value="invalid">Select Server</option>');
		for (var i in ips) {
			if (!ips.hasOwnProperty(i)) continue;
			serversDropdown.append('<option value="' + ips[i] + '">' + names[ips[i]] + ' (' + ips[i] + ')' + '</option>');
		}
	});
}

function savedServerChangeEvent() {
	var selected = $('#Combobox3').find('option:selected');
	var ip = selected.val();
	if (ip == 'invalid') return;
	
	var serverName = selected.html().substring(0, selected.html().indexOf(' (' + ip));
	$('#Editbox1').val(serverName);
	$('#Editbox2').val(ip);
	
	if (!isDownloadingData) {
		$("#Combobox1").val('invalid');
		$("#Combobox1").change();
	}
}

function goToSavedServerEvent() {
	var server =  $('#Combobox3').find('option:selected').val();
	console.log(server);
	if (server == 'invalid') return;
	
	chrome.tabs.create({
     url: "http://www.agar.io/?sip=" + server
	});
}