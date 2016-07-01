Template.externalSearch.helpers({
	messages() {
		return RocketChat.models.LivechatExternalMessage.findByRoomId(this.rid, { ts: 1 });
	},
	dynamicTemplateExists() {
		return !!Template['dynamic_redlink_'+this.filledQueryType];
	},
	queryTemplate() {
		return 'dynamic_redlink_'+this.filledQueryType;
	},
	/*
	If you want to create dynamic helpers use {{>UI.dynamic template=queryTemplate data=myTemplateData }}
	 myTemplateData() {
	 var data = UI._templateInstance().data || {};

	 //Add the helpers onto the existing data (if any)
	 _(data).extend({
	 color: function() {
	 return "#f00";
	 }
	 });

	 return data;
	 },
	 */
	filledQueryTemplate() {
		var roomessages = RocketChat.models.LivechatExternalMessage.findByRoomId(this.rid, { ts: 1 }).fetch(),
			filledTemplate = [], tokens = [];

		if(roomessages.length > 0) {
			tokens = roomessages[0].redlinkQuery.tokens;
			$(roomessages[0].redlinkQuery.queryTemplates).each(function (indxTmpl, valTmpl) {

				let slotItem = {}, filledQuerySlots = [], querySlots = valTmpl.querySlots, currentToken;

				/* tokens und queryTemplates mergen */
				$(querySlots).each(function (indxSlot, valSlot) {
					if (valSlot.tokenIndex != -1) {
						currentToken = tokens[valSlot.tokenIndex];
						if(currentToken.type === "Date" && typeof currentToken.value === "object") {
							valSlot.clientValue = new Date(currentToken.value.date);
						} else {
							valSlot.clientValue = currentToken.value;
						}
						valSlot.tokenVal = currentToken;
					} else {
						valSlot.clientValue = "-";
					}
					filledQuerySlots.push(valSlot);
				});

				slotItem.filledQueryType = valTmpl.queryType;
				slotItem.filledQuerySlots = filledQuerySlots;

				filledTemplate.push(slotItem);
			});
		}
		return filledTemplate;
	}
});

Template.externalSearch.events({
	'click button.pick-message'(event, instance) {
		event.preventDefault();

		$('#chat-window-' + instance.roomId + ' .input-message').val(this.msg).focus();
	}
});

Template.externalSearch.onCreated(function() {
	this.roomId = null;
	// console.log('externalSearch.this ->',this);
	this.autorun(() => {
		this.roomId = Template.currentData().rid;
		this.subscribe('livechat:externalMessages', Template.currentData().rid);
	});
});
