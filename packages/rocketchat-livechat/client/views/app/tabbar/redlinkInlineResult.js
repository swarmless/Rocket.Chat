Template.redlinkInlineResult.helpers({
	rawResult(){
		const instance = Template.instance();
		return JSON.stringify(instance.data.result, " ", 2);
	},
	resultTitle(){
		const instance = Template.instance();
		return $('<span />').html(instance.data.result.title).text();
	},
	resultLink(){
		const instance = Template.instance();
		return instance.data.result.link;
	},
	resultBody(){
		const instance = Template.instance();
		return $('<span />').html(instance.data.result.body).text();
	}
});

Template.redlinkInlineResult.events({
	'click .js-copy-reply-suggestion': function(event, instance){
		if(instance.data.result.replySuggestion) {
			$('#chat-window-' + instance.data.roomId + ' .input-message').val(instance.data.result.replySuggestion);
		}
	}
});
