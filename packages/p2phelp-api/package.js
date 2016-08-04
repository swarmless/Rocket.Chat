Package.describe({
	name: 'p2phelp-api',
	version: '0.0.1',
	summary: 'Peer-to-peer help - communication with external clients',
	git: '',
	documentation: ''
});

Package.onUse(function (api) {
	api.versionsFrom('1.2.1');
	api.use(['ecmascript', 'underscore']);
	api.use(['nimble:restivus', 'rocketchat:lib', 'rocketchat:authorization'], 'server');
	api.addFiles('p2phelp-api.js', 'server');
	api.addFiles('server/types.js', 'server');
	api.addFiles('server/api.js', 'server');
	api.addFiles('server/routes.js', 'server');
	api.addFiles('config.js', 'server');
	api.addFiles('server/models/users.js', 'server');

	//global exports
	api.export('p2ph');
});

Package.onTest(function (api) {
	api.use('ecmascript');
	api.use('tinytest');
	api.use('p2phelp-api');
	api.addFiles('p2phelp-api-tests.js');
});
