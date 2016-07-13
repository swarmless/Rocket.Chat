Template.redlinkInlineResult.helpers({
	templateName(){
		const instance = Template.instance();

		let templateSuffix = "generic";
		switch (instance.data.result.creator) {
			case 'bahn.de':
				templateSuffix = "bahn.de";
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
	}
});

Template.redlinkInlineResult.events({
	'click .js-copy-reply-suggestion': function (event, instance) {
		if (instance.data.result.replySuggestion) {
			$('#chat-window-' + instance.data.roomId + ' .input-message').val(instance.data.result.replySuggestion);
		}
	}
});

Template.redlinkInlineResult_generic.helpers({
	rawResult(){
		const instance = Template.instance();
		return JSON.stringify(instance.data, ' ', 2);
	},

	relevantKeyValues(){
		const instance = Template.instance();

		let keyValuePairs = [];
		for (key in instance.data) {
			keyValuePairs.push({key: key, value: instance.data.result[key]});
		}

		return keyValuePairs;
	}
});
