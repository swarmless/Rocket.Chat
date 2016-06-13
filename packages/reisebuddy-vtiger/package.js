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
	"vtiger-client": "https://github.com/mrsimpson/vtiger-client/archive/7377fcdfa68322a07f380091d983c09a1524ea3b.tar.gz"
});

Package.onUse(function (api) {
	api.use('ecmascript');
	api.addFiles('reisebuddy-vtiger.js', 'server');

	api.export('_vtiger', 'server');
});

