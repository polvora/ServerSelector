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

$(function() {
	$('#Combobox1').html('<option selected value="invalid">Obtaining Server List...</option>');
	$('#Combobox2').html('<option selected value="invalid">Obtaining Server List...</option>');
	
	$('#Combobox1').prop("disabled", true);
	$('#Combobox2').prop("disabled", true);
	$('#Button1').prop("disabled", true);
	
	$.getJSON('http://m.agar.io/fullInfo', serverListCallback);

	$('#Combobox1').change(regionChangeEvent);
	$('#Combobox2').change(serverChangeEvent);
	$('#Button1').click(goToPublicServerEvent);
	
	$('#Button2').click(saveServer);
	$('#Button3').click(deleteServer);
	
	updateSavedServers();
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
	var server =  $(this).find('option:selected').val();
	
	if (server == 'invalid') {
		$('#Button1').prop("disabled", true);
		$('#Editbox2').val('');
	}
	else {
		$('#Button1').prop("disabled", false);
		$('#Editbox2').val(server);
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

function saveServer() {
	var name =  $('#Editbox1').val();
	var ip =  $('#Editbox2').val();
	var item = {};
	
	if (name == '' || ip == '') return;

	item[name] = ip;
	chrome.storage.sync.set(item, function(){
		if (chrome.runtime.lastError) {
			console.log(chrome.runtime.lastError.message);
			return;
		}
    });
	updateSavedServers()
}

function updateSavedServers() {
	chrome.storage.sync.get(null, function(ips) {
		if (chrome.runtime.lastError) {
			console.log(chrome.runtime.lastError.message);
			return;
		}
		
		var names = Object.keys(ips);
		var serversDropdown = $('#Combobox3');
		serversDropdown.html('<option value="invalid">Select Server</option>');
		for (var i in names) {
			if (!names.hasOwnProperty(i)) continue;
			serversDropdown.append('<option value="' + ips[names[i]] + '">' + names[i] + ' (' + ips[names[i]] + ')' + '</option>');
		}
	});
}