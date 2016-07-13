Template.redlinkInlineResult._copyReplySuggestion = function(event, instance)
{
	if (instance.data.result.replySuggestion) {
		$('#chat-window-' + instance.data.roomId + ' .input-message').val(instance.data.result.replySuggestion);
	}
}

Template.redlinkInlineResult.helpers({
	templateName(){
		const instance = Template.instance();

		let templateSuffix = "generic";
		switch (instance.data.result.creator) {
			case 'bahn.de':
				templateSuffix = "bahn_de";
				break;
			case 'community.bahn.de':
				templateSuffix = "VKL_community";
				break;
			case 'VKL':
				templateSuffix = "VKL_community";
				break;
			default:
				templateSuffix = "generic";
				break;
		}
		return 'redlinkInlineResult_' + templateSuffix;
	},
	templateData(){
		const instance = Template.instance();
		return {
			result: instance.data.result,
			roomId: instance.data.roomId
		}
	}
});

Template.redlinkInlineResult.events({
	'click .js-copy-reply-suggestion': function (event, instance) {
		return Template.redlinkInlineResult._copyReplySuggestion(event, instance)
	}
});

Template.redlinkInlineResult_generic.helpers({
	relevantKeyValues(){
		const instance = Template.instance();

		let keyValuePairs = [];
		for (key in instance.data.result) {
			keyValuePairs.push({key: key, value: instance.data.result[key]});
		}

		return keyValuePairs;
	}
});

Template.redlinkInlineResult_bahn_de.events({
	'click .js-copy-reply-suggestion': function(event, instance){
		return Template.redlinkInlineResult._copyReplySuggestion(event, instance)
	}
});
