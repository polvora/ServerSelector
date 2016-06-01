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
var serverList;

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
	
	$.getJSON('http://m.agar.io/fullInfo', serverListCallback);

	$('#Combobox1').change(regionChangeEvent);
});

function serverListCallback(serverList) {
	var regionCode = "";
	var inRegion = false;
	var region;
	
	// Sort alphabetically
	serverList.servers.sort(function (a, b) {
		if(a.region < b.region) return -1;
		if(a.region > b.region) return 1;
		return 0;
	});
	
	$('#Combobox1').html('<option value="invalid">Select Region...</option>');
	$('#Combobox2').html('<option value="invalid">Select Server...</option>');
	
	$.each(serverList.servers, function(index, server) {
		regionCode = server.region.substring(0,2);
		// Obtain region of server
		for (var i in regions) {
			inRegion = ($.inArray(regionCode, regionTable[regions[i]]) != -1)? true : false;
			if (inRegion){
				region = regions[i];
			}
		}
		// Check if region wasn't added before
		if (!(~$('#Combobox1').html().indexOf(regionNames[region]))) {
			// Add region as option
			$('#Combobox1').append('<option value="' + region + '">' + regionNames[region] + '</option>');
		}
		
		// Store server for region
		if (server.isEnabled) {
			options[region] += '<option value="' + server.ip + '">' + server.region.replace('-', ' ') + ' (' + server.ip + ') (' + server.numPlayers + ' players)</option>';
		}
	});
	
	$('#Combobox1').prop("disabled", false);
	$('#Combobox2').prop("disabled", false);
}

function regionChangeEvent() {
	var region =  $(this).find('option:selected').val();
	$('#Combobox2').html('<option value="invalid">Select Server...</option>');
	if (region != 'invalid') $('#Combobox2').append(options[region]);
}