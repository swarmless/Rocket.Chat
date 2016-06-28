Meteor.startup(function() {
	RocketChat.settings.add('Mail_Reisebuddy_defaultSender', 'buddy@reisebuddy.com', {
		type: 'string',
		group: 'Livechat',
		section: 'Reisebuddy_MailConf',
		i18nLabel: 'Mail_Reisebuddy_defaultSender'
	});
	RocketChat.settings.add('Mail_Reisebuddy_defaultSubject', 'Reisebuddy', {
		type: 'string',
		group: 'Livechat',
		section: 'Reisebuddy_MailConf',
		i18nLabel: 'Mail_Reisebuddy_defaultSubject'
	});
	RocketChat.settings.add('Mail_Reisebuddy_username', '', {
		type: 'string',
		group: 'Livechat',
		section: 'Reisebuddy_MailConf',
		i18nLabel: 'Mail_Reisebuddy_username'
	});
	RocketChat.settings.add('Mail_Reisebuddy_authToken', '', {
		type: 'string',
		group: 'Livechat',
		section: 'Reisebuddy_MailConf',
		i18nLabel: 'Mail_Reisebuddy_authToken'
	});
});
