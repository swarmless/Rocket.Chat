/* globals Package */
Package.describe({
	name: 'reisebuddy:livechat',
	version: '0.0.1',
	summary: '',
	git: '',
	documentation: null
});

Package.onUse(function(api) {
	api.use('ecmascript');

	api.addFiles('lib/core.js');
	api.addFiles('lib/duration.js', 'client');

	api.export('_dbs');
});
