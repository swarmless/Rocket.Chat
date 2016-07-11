Package.describe({
	name: 'reisebuddy:redlink',
	version: '0.0.1',
	summary: 'Reisebuddy redlink-integration',
	git: '', //not hosted on separaete git repo yet - use http://github.com/mrsimpson/Rocket.Chat
	documentation: 'README.md'
});

function addDirectory(api, pathInPackage, environment) {
	const PACKAGE_PATH = 'packages/reisebuddy-redlink/';
	const _ = Npm.require('underscore');
	const fs = Npm.require('fs');

	const files = _.compact(_.map(fs.readdirSync(PACKAGE_PATH + pathInPackage), function (filename) {
		return pathInPackage + '/' + filename
	}));
	api.addFiles(files, environment);
}

Package.onUse(function (api) {

	api.versionsFrom('1.2.1');
	api.use('ecmascript');
	api.use('reisebuddy:livechat');

	addDirectory(api, 'server/methods', 'server');
	addDirectory(api, 'server/lib', 'server');

	api.export('RedlinkAdapterFactory');

});

Package.onTest(function (api) {
	api.use('ecmascript');
	api.use('tinytest');
	api.use('reisebuddy:redlink');
	api.addFiles('reisebuddy-redlink-tests.js');
});
