for (var tpl in Template) {
	if (Template.hasOwnProperty(tpl) && tpl.startsWith('dynamic_redlink_')) {
		Template[tpl].onRendered(function () {
			this.$('.knowledge-base-value').after('<div class="knowledge-base-tooltip">' +
												  '<div><span class="icon-edit"></span></div>' +
												  '<div><span class="icon-mail"></span></div></div>');
		});
	}
}

Template.externalSearch.helpers({
	messages() {
		return RocketChat.models.LivechatExternalMessage.findByRoomId(this.rid, {ts: 1});
	},
	dynamicTemplateExists() {
		return !!Template['dynamic_redlink_' + this.filledQueryType];
	},
	queryTemplate() {
		return 'dynamic_redlink_' + this.filledQueryType;
	},
	filledQueryTemplate() {
		var knowledgebaseSuggestions = Template.instance().externalMessages.get(),
			filledTemplate = [], tokens = [];

		if(knowledgebaseSuggestions.length > 0) {
			tokens = knowledgebaseSuggestions[0].result.tokens;
			$(knowledgebaseSuggestions[0].result.queryTemplates).each(function (indxTmpl, valTmpl) {
				let slotItem = {}, filledQuerySlots = [], querySlots = valTmpl.querySlots, currentToken;
				slotItem.resultingQueries = valTmpl.queries ? valTmpl.queries : knowledgebaseSuggestions[0].result.queries;	//todo: wieder entfernen, sobald die Queries Teil der Templates sind

				/* tokens und queryTemplates mergen */
				$(querySlots).each(function (indxSlot, valSlot) {
					if (valSlot.tokenIndex != -1) {
						currentToken = tokens[valSlot.tokenIndex];
						if(currentToken.type === "Date" && typeof currentToken.value === "object") {
							valSlot.clientValue = moment(currentToken.value.date).format("L LT");
						} else {
							valSlot.clientValue = currentToken.value;
						}
						valSlot.tokenVal = currentToken;
					} else {
						valSlot.clientValue = "?";
					}
					filledQuerySlots.push(valSlot);
				});

				slotItem.filledQueryType = valTmpl.queryType;
				slotItem.filledQuerySlots = filledQuerySlots;
				slotItem.item = function (itm) {
					let returnValue = "?", filteredArray = [];
					if(typeof slotItem.filledQuerySlots === "object") {
						filteredArray = slotItem.filledQuerySlots.filter((ele) => ele.role === itm);
						if(filteredArray.length > 0) {
							returnValue = filteredArray[0]['clientValue'];
						}
					}
					return returnValue;
				};
				slotItem.itemStyle = function (itm) {
					let returnValue = "empty-style", filteredArray = [];
					if(typeof slotItem.filledQuerySlots === "object") {
						filteredArray = slotItem.filledQuerySlots.filter((ele) => ele.role === itm);
						if(filteredArray.length > 0 && filteredArray[0]['clientValue'] !== "" && filteredArray[0]['clientValue'] !== "?") {
							returnValue = "";
						}
					}
					return returnValue;
				};

				filledTemplate.push(slotItem);
			});
		}
		return filledTemplate;
	}
});

Template.externalSearch.events({
	'click button.pick-message': function (event, instance) {
		event.preventDefault();
		$('#chat-window-' + instance.roomId + ' .input-message').val(this.msg).focus();
	},
	'click button.update-result': function(event, instance) {
		event.preventDefault();

		Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get()[0]);

	},
	'click .knowledge-base-tooltip .icon-edit': function (event, inst) {
		console.log("1234569: " +
					RocketChat.models.LivechatExternalMessage.findOne({rid: inst.roomId}, {sort: {ts: -1}}));
	},
	'click .knowledge-base-tooltip .icon-mail': function (event, inst) {
		const rlData = RocketChat.models.LivechatExternalMessage.findOne({rid: inst.roomId},
			{sort: {ts: -1}}).redlinkQuery;
		$('.input-message').text("TODO");
	}
});

Template.externalSearch.onCreated(function() {
	this.externalMessages = new ReactiveVar([]);
	this.roomId = null;
	this.autorun(() => {
		this.roomId = Template.currentData().rid;
		this.subscribe('livechat:externalMessages', Template.currentData().rid);
		this.externalMessages.set(RocketChat.models.LivechatExternalMessage.findByRoomId(Template.currentData().rid, { ts: -1 }).fetch());
	});
});
