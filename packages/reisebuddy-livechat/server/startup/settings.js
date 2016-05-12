Meteor.startup(function() {
	RocketChat.settings.addGroup('Reisebuddy');

	RocketChat.settings.add('DBRB_Livechat_conversations_group', true, {
		type: 'boolean',
		group: 'Reisebuddy',
		public: true,
		i18nLabel: 'DBRB_Livechat_conversations_group'
	});

});
