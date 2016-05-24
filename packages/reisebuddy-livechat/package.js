/* globals Package */
Package.describe({
	name: 'reisebuddy:livechat',
	version: '0.0.1',
	summary: '',
	git: '',
	documentation: null
});

Package.onUse(function(api) {
	api.addFiles('server/startup/settings.js', 'server');
	api.addFiles('lib/duration.js', 'client');
});
