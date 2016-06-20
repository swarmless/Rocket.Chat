Package.describe({
  name: 'reisebuddy:vtiger',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
	"vtiger-client": "https://github.com/mrsimpson/vtiger-client/archive/ff9e74a7e72877ad5de8ed1ce629b1ba170eb4b2.tar.gz"
});

Package.onUse(function (api) {
	api.use('ecmascript');
	api.addFiles('server/startup/settings.js', 'server');
	api.addFiles('reisebuddy-vtiger.js', 'server');

	api.export('_vtiger', 'server');
});

