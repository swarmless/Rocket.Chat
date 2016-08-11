Meteor.startup( () => {
	RocketChat.callbacks.add('afterExternalMessage', function (externalMessage) {
		if(externalMessage.result.automatedResponse){
			// AI believes it can contribute to the conversation => create a bot-response

			const botUsername = RocketChat.settings.get('P2pHelp_Bot_Username');
			const botUser =  RocketChat.models.Users.findOneByUsername(botUsername);

			if(!botUser){
				throw new Meteor.Error('Erroneous Bot-Configuration: Check username')
			}
			try {

				RocketChat.sendMessage({
					username: botUser.username,
					_id: botUser._id
				}, {msg: externalMessage.result.automatedResponse}, {_id: externalMessage.rid});

			} catch (err) {
				console.error('Could not add bot help message', err);
				throw new Meteor.Error(err);
			}

		}
	}, RocketChat.callbacks.priority.LOW)
});
