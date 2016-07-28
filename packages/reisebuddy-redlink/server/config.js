Meteor.startup(function () {
	RocketChat.settings.add('Livechat_Knowledge_Source', '', {
		type: 'select',
		group: 'Livechat',
		section: 'Knowledge Base',
		values: [
			{ key: '0', i18nLabel: 'Livechat_Knowledge_Source_APIAI'},
			{ key: '1', i18nLabel: 'Livechat_Knowledge_Source_Redlink'}
		],
		public: true,
		i18nLabel: 'Livechat_Knowledge_Source'
	});

	RocketChat.settings.add('Livechat_Knowledge_Redlink_URL', '', {
		type: 'string',
		group: 'Livechat',
		section: 'Knowledge Base',
		public: true,
		i18nLabel: 'Livechat_Knowledge_Redlink_URL'
	});

	/* Currently, Redlink does not offer hashed API_keys, but uses simple password-auth
	 * This is of course far from perfect and is hopeully going to change sometime later */
	RocketChat.settings.add('Livechat_Knowledge_Redlink_Auth_Token', '', {
		type: 'string',
		group: 'Livechat',
		section: 'Knowledge Base',
		public: true,
		i18nLabel: 'Livechat_Knowledge_Redlink_Auth_Token'
	});
});
