// inspired by https://github.com/dbpedia-spotlight/demo (ASLv2 licence)

function dbpQuery(json) {
	var url = "http://dbpedia.org/sparql";

	var resources = json['Resources'];
	if (resources == null) resources = [];
	for (var i = 0; i < resources.length; i++) {
		var uri = resources[i]['@URI'];
		var sf = resources[i]['@surfaceForm'];
		var query = "PREFIX dbpedia: <http://dbpedia.org/ontology/>\
			     SELECT ?img WHERE { <" + uri + "> dbpedia:thumbnail ?img. }";
		var queryUrl = encodeURI(url+"?query="+query+"&format=json");
		$.ajax({
			dataType: "jsonp",
			url: queryUrl,
			success: function(i, sf) { return function(_data) {
				var results = _data.results.bindings;
				for (var j in results) {
					var src = results[j].img.value;
					var thumbcontent = '<div class="thumb" id="thumb'+i+'">';
					thumbcontent += '<img src="'+src+'" id="img'+i+'">';
					thumbcontent += '<br>' + sf;
					thumbcontent += '</div>';
					$('#images').append(thumbcontent);
				}
			} }(i, sf)
		});
	}

	$('#status_indicator').removeClass("loading");
}

function spotlightAnnotate(response, cb) {
	var json = $.parseJSON(response);
	if (json == null) json = response;
	var resources = json['Resources'];
	if (resources == null) resources = [];
	var content = '';
	var start = 0;
	for (var i = 0; i < resources.length; i++) {
		var ofs = parseInt(resources[i]['@offset']);
		content += $('#text').val().substring(start, ofs);
		content += '<span id="ann' + i + '" class="ann">' + resources[i]['@surfaceForm'] + '</span>';
		start = ofs + resources[i]['@surfaceForm'].length;
	}
	content += $('#text').val().substring(start, $('#text').val().length);
	$('#text_annotated').html(content);

	cb(response);
}

function spotlightQuery(cb) {
	var ajaxRequest = $.ajax({ 'url': 'http://spotlight.sztaki.hu:2222/rest/annotate',
		'data': { 'text': $('#text').val(), 'confidence': 0.5, 'support': 20 },
		'headers': {'Accept': 'application/json'},
		'success': function(response) { spotlightAnnotate(response, cb); },
		'error': function(response) { window.alert(response); }
	});

	// will hide text object and show ready-to-be-annotated text
	$('#text').hide();
	$('#text_annotated').remove();
	$('#text_container').prepend('<div id=text_annotated>'+$('#text').val().replace(/\n/g, "<br />\n")+'</div>');
	$('body').append('<div id="images"></div>');

	// start the REST request for annotations

	$('#status_indicator').addClass("loading");

	//button to get the editable text box back for the user to modify as needed
	$('#edit_text_wrapper').show();
	$('#edit_text').click(function() {
		$('#text').show();
		$('#text_annotated').remove();
		$('#status_indicator').removeClass("loading");
		$('#images').remove();

		$(".action_button").attr("disabled", false);
		$('#edit_text_wrapper').hide();
	});
}

$(document).ready(function() {
	$('#scan').click(function() { spotlightQuery(dbpQuery); });
});
