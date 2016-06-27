Package.describe({
	name: 'reisebuddy:vtiger',
	version: '0.0.1', // Brief, one-line summary of the package.
	summary: 'Integration for vtiger crm', // URL to the Git repository containing the source code for this package.
	git: '', // By default, Meteor will default to using README.md for documentation.
	// To avoid submitting documentation, set this field to null.
	documentation: 'README.md'
});

Npm.depends({
	"vtiger-client": "https://github.com/mrsimpson/vtiger-client/archive/8fb59002938c914a9fbb2b0f1b7479972528bced.tar.gz"
});

Package.onUse(function (api) {
	api.use(['ecmascript', 'underscore', 'coffeescript']);
	api.use('templating', 'client');
	api.use('rocketchat:lib');

	api.addFiles('server/startup/settings.js', 'server');
	api.addFiles('reisebuddy-vtiger.js', 'server');
	api.export('_vtiger', 'server');

	api.addFiles('client/views/sideNav/directLivechatMessagesFlex.html', 'client');
	api.addFiles('client/views/sideNav/directLivechatMessagesFlex.js', 'client');

	api.addFiles('server/methods/createDirectLivechatMessage.js', 'server');

	api.addFiles('server/models/Users.coffee', 'server');

	api.addFiles('server/publications/userCrmAutocomplete.coffee', 'server');

	//i18n
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	var tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/reisebuddy-vtiger/i18n'), function(filename) {
		return 'i18n/' + filename;
	}));
	api.addFiles(tapi18nFiles);

	api.use('tap:i18n');
});

