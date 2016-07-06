/* globals Package */
Package.describe({
	name: 'reisebuddy:livechat',
	version: '0.0.1',
	summary: 'Extension to rocketchat-livechat. Cannot work without',
	git: '',
	documentation: null
});

Package.onUse(function(api) {
	api.use(['ecmascript', 'underscore']);
	api.use(['nimble:restivus', 'rocketchat:lib', 'rocketchat:authorization'], 'server');

	api.addFiles('lib/core.js');
	api.addFiles('lib/duration.js', 'client');
	api.addFiles('client/lib/globalTemplateHelpers.js', 'client');
	api.addFiles('server/config.js', 'server');

	api.addFiles('server/lib/lotusMailCommunicationService.js', 'server');
	api.addFiles('server/methods/mergeRooms.js', 'server');
	api.addFiles('server/reisebuddyIncomingApi.js', 'server');
	api.addFiles('server/sendMessageByService.js', 'server');

	api.export('_dbs');

	//i18n
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	var tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/reisebuddy-livechat/i18n'), function(filename) {
		return 'i18n/' + filename;
	}));
	api.addFiles(tapi18nFiles);

	api.use('tap:i18n');
});
