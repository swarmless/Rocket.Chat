/* globals SystemLogger */
Meteor.startup( () => {
	RocketChat.callbacks.add('afterSaveMessage', function (message, room) {

		let knowledgeEnabled = false;
		RocketChat.settings.get('Livechat_Knowledge_Enabled', function (key, value) { //todo: Own stting
			knowledgeEnabled = value;
		});

		if (!knowledgeEnabled) {
			return message;
		}

		//help request supplied
		if (!(typeof room.t !== 'undefined' && room.t === 'c' && room.helpRequestId)) {
			return message;
		}

		const knowledgeAdapter = _dbs.getKnowledgeAdapter();
		if (!knowledgeAdapter) {
			return;
		}

		Meteor.defer(() => {

			const helpRequest = RocketChat.models.HelpRequests.findOneById(room.helpRequestId);
			let context = {};
			context.contextType = 'ApplicationHelp';
			context.environmentType = helpRequest.supportArea;
			context.environment = helpRequest.environment;
			try {
				knowledgeAdapter.onMessage(message, context);
			}
			catch (e) {
				SystemLogger.error('Error using knowledge provider ->', e);
			}
		});

		return message;
	}, RocketChat.callbacks.priority.LOW)
});
