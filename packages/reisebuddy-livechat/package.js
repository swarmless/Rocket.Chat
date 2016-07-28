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
	api.use('reisebuddy:common');
	api.use('reisebuddy:communication');

	api.addFiles('server/methods/mergeRooms.js', 'server');
});
