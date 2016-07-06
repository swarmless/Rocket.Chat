for (var tpl in Template) {
	if (Template.hasOwnProperty(tpl) && tpl.startsWith('dynamic_redlink_')) {
		Template[tpl].onRendered(function () {
			this.$('.knowledge-input-wrapper').append('<div class="knowledge-base-tooltip">' +
				'<div class="knowledge-context-menu-item edit-item"><span class="icon-pencil"></span> Editieren</div>' +
				'<div class="knowledge-context-menu-item delete-item"><span class="icon-trash"></span> Löschen</div>' +
				'<div class="knowledge-context-menu-item chat-item"><span class="icon-chat"></span> Nachfragen</div></div>');
		});
	}
}

Template.externalSearch.helpers({
	messages() {
		return RocketChat.models.LivechatExternalMessage.findByRoomId(this.rid, {ts: 1});
	},
	dynamicTemplateExists() {
		return !!Template['dynamic_redlink_' + this.queryType];
	},
	queryTemplate() {
		return 'dynamic_redlink_' + this.queryType;
	},
	filledQueryTemplate() {
		var knowledgebaseSuggestions = Template.instance().externalMessages.get(), filledTemplate = [];

		if(knowledgebaseSuggestions.length > 0) {
			const tokens = knowledgebaseSuggestions[0].result.tokens;
			$(knowledgebaseSuggestions[0].result.queryTemplates).each(function (indexTpl, queryTpl) {
				let extendedQueryTpl = queryTpl, filledQuerySlots = [];
				extendedQueryTpl.resultingQueries = queryTpl.queries ? queryTpl.queries : knowledgebaseSuggestions[0].result.queries;	//todo: wieder entfernen, sobald die Queries Teil der Templates sind

				/* tokens und queryTemplates mergen */
				$(queryTpl.querySlots).each(function (indxSlot, slot) {
					if (slot.tokenIndex != -1) {
						const currentToken = tokens[slot.tokenIndex];
						if(currentToken.type === "Date" && typeof currentToken.value === "object") {
							slot.clientValue = moment(currentToken.value.date).format("L LT");
						} else {
							slot.clientValue = currentToken.value;
						}
						slot.tokenVal = currentToken;
					} else {
						slot.clientValue = "?";
					}
					filledQuerySlots.push(slot);
				});

				extendedQueryTpl.filledQuerySlots = filledQuerySlots;
				extendedQueryTpl.forItem = function(itm) {
					let returnValue = {
						htmlId: Meteor.uuid(),
						item: "?",
						itemStyle: "empty-style",
						label: 'topic_'+itm,
						parentTplIndex: indexTpl
					};
					if (typeof extendedQueryTpl.filledQuerySlots === "object") {
						const filteredArray = extendedQueryTpl.filledQuerySlots.filter((ele) => ele.role === itm);
						if (filteredArray.length > 0) {
							returnValue = _.extend(filteredArray[0], returnValue);
							returnValue.item = filteredArray[0]['clientValue'];

							if (filteredArray[0]['clientValue']) {
								returnValue.itemStyle = '';
							}
						}
					}
					return returnValue;
				};
				filledTemplate.push(extendedQueryTpl);
			});
		}
		return filledTemplate;
	}
});

Template.externalSearch.events({
	'click button.update-result': function(event, instance) {
		event.preventDefault();

		Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get()[0]);

	},
	'click .knowledge-base-tooltip .edit-item': function (event, inst) {
		let inputWrapper = $(event.currentTarget).closest(".field-with-label"),
			originalValue = $(inputWrapper).find(".knowledge-base-value").val(),
			saveValue = "";
		$(".field-with-label.editing").find(".icon-cancel").click();
		$(".field-with-label.editing").removeClass("editing");

		inputWrapper.addClass("editing");
		$(inputWrapper).find(".knowledge-base-value").focus().select();
		$(inputWrapper).find(".icon-cancel").off("click").on("click", (event, inst) => {
			inputWrapper.removeClass("editing");
			$(inputWrapper).find(".knowledge-base-value").val(originalValue);
		});
		$(inputWrapper).find(".icon-floppy").off("click").on("click", (event, inst) => {
			inputWrapper.removeClass("editing");
			saveValue = $(inputWrapper).find(".knowledge-base-value").val();
			console.log(event);
			console.log(inst);
			console.log("saveValue = " + saveValue);
		});
		/*console.log("1234569: " +
					RocketChat.models.LivechatExternalMessage.findOne({rid: inst.roomId}, {sort: {ts: -1}}));*/
	},
	'click .knowledge-base-tooltip .chat-item': function (event, inst) {
		const rlData = RocketChat.models.LivechatExternalMessage.findOne({rid: inst.roomId},
			{sort: {ts: -1}}).result;
		$('#chat-window-' + inst.roomId + ' .input-message').val("TODO").focus();
	},
	'click .external-message .icon-wrapper': function(event, instance) {
		const changeBtn = $(event.target).parent().closest('.icon-wrapper');
		const left = changeBtn.prevAll('.knowledge-base-value');
		const right = changeBtn.nextAll('.knowledge-base-value');
		const leftText = left.text();
		left.text(right.text());
		right.text(leftText);
		let queryTemplate = instance.externalMessages.get();
		queryTemplate.result.queryTemplates[changeBtn.closest('.knowledge-informations-wrapper').data('tplIndex')].querySlots.each((slot) => {

		});

        instance.externalMessages.set(queryTemplate);

		//todo
		//Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get()[0]);
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
