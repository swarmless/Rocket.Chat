for (var tpl in Template) {
	if (Template.hasOwnProperty(tpl) && tpl.startsWith('dynamic_redlink_')) {
		Template[tpl].onRendered(function () {
			$.datetimepicker.setDateFormatter({
				parseDate: function (date, format) {
					var d = moment(date, format);
					return d.isValid() ? d.toDate() : false;
				},

				formatDate: function (date, format) {
					return moment(date).format(format);
				}
			});
			$.datetimepicker.setLocale(moment.locale());
			this.$('.datetime-field').datetimepicker({
				dayOfWeekStart: 1,
				format: 'L LT',
				formatTime: 'LT',
				formatDate: 'L'
			});
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
		if (knowledgebaseSuggestions.length > 0) {
			const tokens = knowledgebaseSuggestions[0].result.tokens;
			$(knowledgebaseSuggestions[0].result.queryTemplates).each(function (indexTpl, queryTpl) {
				let extendedQueryTpl = queryTpl, filledQuerySlots = [];

				/* tokens und queryTemplates mergen */
				$(queryTpl.querySlots).each(function (indxSlot, slot) {
					if (slot.tokenIndex != -1) {
						const currentToken = tokens[slot.tokenIndex];
						if (currentToken.type === "Date" && typeof currentToken.value === "object") {
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

				extendedQueryTpl.collapsed = queryTpl.state !== 'Confirmed' ? '' : 'collapsed';
				extendedQueryTpl.filledQuerySlots = filledQuerySlots;
				extendedQueryTpl.forItem = function (itm) {
					let returnValue = {
						htmlId: Meteor.uuid(),
						item: "?",
						itemStyle: "empty-style",
						inquiryStyle: "disabled",
						label: 'topic_' + itm,
						parentTplIndex: indexTpl //todo replace with looping index in html
					};
					if (typeof extendedQueryTpl.filledQuerySlots === "object") {
						const slot = extendedQueryTpl.filledQuerySlots.find((ele) => ele.role === itm);
						if (slot) {
							returnValue = _.extend(slot, returnValue);
							returnValue.item = slot.clientValue;
							if (!_.isEmpty(slot.inquiryMessage)) {
								returnValue.inquiryStyle = '';
							}
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
	},
	queriesContext(queries, templateIndex){
		const instance = Template.instance();
		return {
			queries: queries,
			roomId: instance.data.rid,
			templateIndex: templateIndex
		}
	}
});

Template.externalSearch.events({
	/**
	 * Notifies that a query was confirmed by an agent (aka. clicked)
	 */
	'click .knowledge-queries-wrapper .query-item a ': function (event, instance) {
		const query = $(event.target).closest('.query-item');
		let externalMsg = instance.externalMessages.get();
		externalMsg.result.queryTemplates[query.data('templateIndex')].queries[query.data('queryIndex')].state = 'Confirmed';
		instance.externalMessages.set(externalMsg);
		Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get());
	},
	/**
	 * Hide datetimepicker when right mouse clicked
	 */
	'mouseup .field-with-label': function(event, instance) {
		if(event.button === 2) {
			setTimeout(() => {
				$('.datetime-field').datetimepicker("hide");
			}, 100);
		}
	},
	'contextmenu .field-with-label': function (event, instance) {
		event.preventDefault();
		instance.$(".knowledge-input-wrapper.active").removeClass("active");
		instance.$(event.currentTarget).find(".knowledge-input-wrapper").addClass("active");
		$(document).off("mousedown.contextmenu").on("mousedown.contextmenu", function (e) {
			if (!$(e.target).parent(".knowledge-base-tooltip").length > 0) {
				$(".knowledge-input-wrapper.active").removeClass("active");
			}
		});
	},
	'click .query-template-tools-wrapper .icon-up-open': function (event) {
		$(event.currentTarget).closest(".query-template-wrapper").toggleClass("collapsed");
	},
	/**
	 * Mark a template as confirmed
	 */
	'click .query-template-tools-wrapper .icon-ok': function (event, instance) {
		const query = $(event.target).closest('.query-template-wrapper');
		let externalMsg = instance.externalMessages.get();
		externalMsg.result.queryTemplates[query.data('templateIndex')].state = 'Confirmed';
		instance.externalMessages.set(externalMsg);
		Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get());
		query.closest(".query-template-wrapper").addClass("collapsed");
	},
	/**
	 * Mark a template as rejected.
	 */
	'click .query-template-tools-wrapper .icon-cancel': function (event, instance) {
		const query = $(event.target).closest('.query-template-wrapper');
		let externalMsg = instance.externalMessages.get();
		externalMsg.result.queryTemplates[query.data('templateIndex')].state = 'Rejected';
		instance.externalMessages.set(externalMsg);
		Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get());
	},
	'keyup .knowledge-base-value': function (event, inst) {
		const inputWrapper = $(event.currentTarget).closest(".field-with-label"),
			ENTER_KEY = 13,
			ESC_KEY = 27,
			TAB_KEY = 9,
			keycode = event.keyCode;
		if (inputWrapper.hasClass("editing")) {
			switch (keycode) {
				case ENTER_KEY:
					inputWrapper.find(".icon-floppy").click();
					break;
				case ESC_KEY:
				case TAB_KEY:
					inputWrapper.find(".icon-cancel").click();
					break;
			}
		}
	},
	'click .knowledge-base-tooltip .edit-item, click .knowledge-base-value, click .knowledge-base-label': function (event, instance) {
		event.preventDefault();
		const inputWrapper = $(event.currentTarget).closest(".field-with-label"),
			inputField = inputWrapper.find(".knowledge-base-value"),
			originalValue = inputField.val();

		if (!inputWrapper.hasClass('editing')) {
			$(".field-with-label.editing").removeClass("editing");
			inputField.focus().select();
			inputWrapper.addClass('editing');
		}

		inputWrapper.find('.icon-cancel').off("click").on("click", () => {
			inputWrapper.removeClass("editing");
			inputField.val(originalValue);
		});
		inputWrapper.find(".icon-floppy").off("click").on("click", () => {
			inputWrapper.removeClass("editing");
			const saveValue = inputField.val();

			let externalMsg = instance.externalMessages.get();
			const newToken = {
				messageIdx: -1,
				type: _.isEmpty(inputWrapper.data('tokenType')) ?  null : inputWrapper.data('tokenType'),
				state: "Confirmed",
				origin: "Agent",
				confidence: 0.95,
				value: inputField.hasClass('datetime-field') ?
				{
					grain: 'minute',
					value: moment(saveValue, "L LT").toISOString()
				} :
					saveValue
			};

			externalMsg.result.tokens.push(newToken);
			externalMsg.result.queryTemplates[inputWrapper.data('parentTplIndex')].querySlots = _.map(externalMsg.result.queryTemplates[inputWrapper.data('parentTplIndex')].querySlots,
				(query) => {
					if (query.tokenIndex === inputWrapper.data('tokenIndex')) {
						query.tokenIndex = externalMsg.result.tokens.length - 1;
					}
					return query;
				});
			instance.externalMessages.set(externalMsg);
			Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get());
		});
	},
	/**
	 * Writes the inqury of an queryTemplateSlot to the chatWindowInputField.
	 */
	'click .knowledge-base-tooltip .chat-item:not(.disabled)': function (event, inst) {
		event.preventDefault();
		const rlData = _.first(RocketChat.models.LivechatExternalMessage.findByRoomId(inst.roomId, {ts: -1}).fetch());
		if (rlData && rlData.result) {
			const input = inst.$(event.target).closest('.knowledge-input-wrapper');
			const qSlot = _.find(rlData.result.queryTemplates[input.data('parentTplIndex')].querySlots, (slot) => {
				return slot.tokenIndex === input.data('tokenIndex');
			});
			if (qSlot && qSlot.inquiryMessage) {
				$('#chat-window-' + inst.roomId + ' .input-message').val(qSlot.inquiryMessage).focus();
			}
		}
	},
	/**
	 * Switches the tokens between two slots within a query template.
	 */
	'click .external-message .icon-wrapper': function(event, instance) {
		const changeBtn = $(event.target).parent().closest('.icon-wrapper');
		const left = changeBtn.prevAll('.field-with-label');
		const right = changeBtn.nextAll('.field-with-label');
		let externalMsg = instance.externalMessages.get();
		externalMsg.result.queryTemplates[left.data('parentTplIndex')].querySlots = _.map(externalMsg.result.queryTemplates[left.data('parentTplIndex')].querySlots,
			(query) => {
				if (query.tokenIndex === left.data('tokenIndex')) {
					query.tokenIndex = right.data('tokenIndex');
				} else if (query.tokenIndex === right.data('tokenIndex')) {
					query.tokenIndex = left.data('tokenIndex');
				}
				return query;
			});
		instance.externalMessages.set(externalMsg);
		Meteor.call('updateKnowledgeProviderResult', instance.externalMessages.get());
	}
});

Template.externalSearch.onCreated(function () {
	this.externalMessages = new ReactiveVar([]);
	this.roomId = null;
	this.autorun(() => {
		this.roomId = Template.currentData().rid;
		this.subscribe('livechat:externalMessages', Template.currentData().rid);
		const extMsg = RocketChat.models.LivechatExternalMessage.findByRoomId(Template.currentData().rid,
			{ts: -1}).fetch();
		if (extMsg.length > 0) {
			this.externalMessages.set(extMsg[0]);
		}
	});
});
