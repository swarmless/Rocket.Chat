Package.describe({
	name: 'p2phelp',
	version: '0.0.1',
	summary: 'Peer-to-peer help',
	git: '',
	documentation: ''
});

Package.onUse(function (api) {
	api.versionsFrom('1.2.1');
	api.use(['ecmascript', 'underscore', 'coffeescript', 'less@2.5.1']);
	api.use(['reisebuddy:redlink', 'reisebuddy:common']);
	api.use('rocketchat:lib'); //In order to be able to attach to RocketChat-Global
	api.use('rocketchat:livechat'); //Due to external messages
	api.use(['nimble:restivus', 'rocketchat:authorization', 'rocketchat:api'], 'server');
	api.use('templating', 'client');

	api.addFiles('p2phelp.js', 'server');
	api.addFiles('server/types.js', 'server');
	api.addFiles('server/api.js', 'server');
	api.addFiles('server/routes.js', 'server');
	api.addFiles('config.js', 'server');

	// Models
	api.addFiles('server/models/Users.js', ['server', 'client']);
	api.addFiles('server/models/Rooms.js', ['server', 'client']);
	api.addFiles('server/models/HelpRequests.js', ['server', 'client']);
	api.addFiles('server/models/LivechatExternalMessage.js', ['server', 'client']);

	api.addFiles('server/publications/Rooms.js', 'server');
	api.addFiles('server/publications/HelpRequests.js', 'server');

	//Methods
	api.addFiles('server/methods/helpRequestByRoomId.js', 'server');
	api.addFiles('server/methods/closeHelpRequest.js', 'server');

	// Hooks
	api.addFiles('server/hooks/sendMessageToKnowledgeAdapter.js', 'server');
	api.addFiles('server/hooks/onKnowledgeProviderResult.js', 'server');

	//Templates
	api.addFiles('client/views/HelpRequestContext.html', 'client');
	api.addFiles('client/views/HelpRequestContext.js', 'client');
	api.addFiles('client/views/HelpRequestContextParameter.html', 'client');
	api.addFiles('client/views/HelpRequestContextParameter.js', 'client');
	api.addFiles('client/views/HelpRequestActions.html', 'client');
	api.addFiles('client/views/HelpRequestActions.js', 'client');

	//Assets
	api.addAssets('assets/stylesheets/helpRequestContext.less', 'server'); //has to be done on the server, it exposes the completed css to the client

	//i18n
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	var tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/p2phelp/i18n'), function(filename) {
		return 'i18n/' + filename;
	}));
	api.addFiles(tapi18nFiles);

	api.use('tap:i18n');

	//global exports
	api.export('p2ph');
});

Package.onTest(function (api) {
	api.use('ecmascript');
	api.use('tinytest');
	api.use('p2phelp');
	api.addFiles('p2phelp-api-tests.js');
});
