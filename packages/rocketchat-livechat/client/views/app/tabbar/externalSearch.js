for (var tpl in Template) {
	if (Template.hasOwnProperty(tpl) && tpl.startsWith('dynamic_redlink_')) {
		Template[tpl].onRendered(function () {
			this.$('.datetime-field').datetimepicker({format:'d.m.Y H:i'});
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
		var knowledgebaseSuggestions = RocketChat.models.LivechatExternalMessage.findByRoomId(Template.currentData().rid,
			{ts: -1}).fetch(), filledTemplate = [];
		if(knowledgebaseSuggestions.length > 0) {
			const tokens = knowledgebaseSuggestions[0].result.tokens;
			$(knowledgebaseSuggestions[0].result.queryTemplates).each(function (indexTpl, queryTpl) {
				let extendedQueryTpl = queryTpl, filledQuerySlots = [];

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

							if (returnValue.item !== "" && returnValue.item !== "?") {
								returnValue.itemStyle = "";
							}
							if (returnValue.tokenType === "Date") {
								returnValue.itemStyle = returnValue.itemStyle + " datetime-field";
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
		Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get());
	},
	'contextmenu .field-with-label': function(event, instance) {
		event.preventDefault();
		let inputWrapper = $(event.currentTarget).find(".knowledge-input-wrapper");
		$(".knowledge-input-wrapper.active").removeClass("active");
		$(inputWrapper).addClass("active");
		$(document).off("mousedown.contextmenu").on("mousedown.contextmenu", function (e) {
			if (!$(e.target).parent(".knowledge-base-tooltip").length > 0) {
				$(".knowledge-input-wrapper.active").removeClass("active");
			}
		});
	},
	'click .knowledge-base-tooltip .edit-item, click .knowledge-base-value, click .knowledge-base-label': function (event, instance) {
		event.preventDefault();
		const inputWrapper = $(event.currentTarget).closest(".field-with-label"),
			inputField = inputWrapper.find(".knowledge-base-value"),
			originalValue = inputField.val();

		if (inputWrapper.hasClass('editing')) {
			inputWrapper.removeClass("editing").find(".icon-cancel").click();
		}
		inputWrapper.addClass('editing');
		inputField.focus().select();

		inputWrapper.find('.icon-cancel').off("click").on("click", () => {
			inputWrapper.removeClass("editing");
			inputField.val(originalValue);
		});
		inputWrapper.find(".icon-floppy").off("click").on("click", () => {
			inputWrapper.removeClass("editing");
			const saveValue = inputField.val();

			let externalMsg = instance.externalMessages.get();
			const sourceToken = externalMsg.result.tokens[inputField.data('tokenIndex')];
			const newToken = {
				messageIdx: -1,
				type: sourceToken.type,
				state: "Confirmed",
				origin: "Agent",
				value: inputField.hasClass('datetime-field') ?
					   {
						   grain: 'day',
						   value: moment(saveValue, "D.M.Y hh:mm").format() //todo sync format
					   } :
					   saveValue
			};

			externalMsg.result.tokens.push(newToken);
			externalMsg.result.queryTemplates[inputField.data('parentTplIndex')].querySlots = _.map(externalMsg.result.queryTemplates[inputField.data('parentTplIndex')].querySlots,
				(query) => {
					if (query.tokenIndex === inputField.data('tokenIndex')) {
						query.tokenIndex = externalMsg.result.tokens.length - 1;
					}
					return query;
				});
			instance.externalMessages.set(externalMsg);
			Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get());
		});
	},
	'click .knowledge-base-tooltip .chat-item': function (event, inst) {
		event.preventDefault();
		const rlData = RocketChat.models.LivechatExternalMessage.findOne({rid: inst.roomId},
			{sort: {ts: -1}}).result;
		$('#chat-window-' + inst.roomId + ' .input-message').val("TODO").focus();
	},
	'click .external-message .icon-wrapper': function(event, instance) {
		const changeBtn = $(event.target).parent().closest('.icon-wrapper');
		const left = changeBtn.prevAll('.field-with-label').find('.knowledge-base-value');
		const right = changeBtn.nextAll('.field-with-label').find('.knowledge-base-value');
		let externalMsg = instance.externalMessages.get();
		externalMsg.result.queryTemplates[left.data('parentTplIndex')].querySlots = _.map(externalMsg.result.queryTemplates[left.data('parentTplIndex')].querySlots,
			(query) => {
				if(query.tokenIndex === left.data('tokenIndex')) {
					query.tokenIndex = right.data('tokenIndex');
				} else if(query.tokenIndex === right.data('tokenIndex')) {
					query.tokenIndex = left.data('tokenIndex');
				}
				return query;
			});
        instance.externalMessages.set(externalMsg);
		Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get());
	}
});

Template.externalSearch.onCreated(function() {
	this.externalMessages = new ReactiveVar([]);
	this.roomId = null;
	this.autorun(() => {
		this.roomId = Template.currentData().rid;
		this.subscribe('livechat:externalMessages', Template.currentData().rid);
		const extMsg = RocketChat.models.LivechatExternalMessage.findByRoomId(Template.currentData().rid,
			{ts: -1}).fetch();
		if(extMsg.length > 0) {
			this.externalMessages.set(extMsg[0]);
		}
	});
});
