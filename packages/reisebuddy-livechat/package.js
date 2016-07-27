/* globals Package */
Package.describe({
	name: 'reisebuddy:livechat',
	version: '0.0.1',
	summary: 'Extension to rocketchat-livechat.',
	git: '',
	documentation: null
});

/**TODO
 * D:\Projekte\reisebuddy\rocket.chat\packages\rocketchat-livechat\app\client\stylesheets\_variables.less
 * D:\Projekte\reisebuddy\rocket.chat\packages\rocketchat-livechat\app\i18n\de.i18n.json
 * D:\Projekte\reisebuddy\rocket.chat\packages\rocketchat-livechat\client\stylesheets\livechat.less
 * D:\Projekte\reisebuddy\rocket.chat\packages\rocketchat-livechat\client\views\app\tabbar
 * D:\Projekte\reisebuddy\rocket.chat\packages\rocketchat-livechat\client\views\app\livechatCurrentChats.html
 * D:\Projekte\reisebuddy\rocket.chat\packages\rocketchat-livechat\client\views\app\livechatCurrentChats.js
 * D:\Projekte\reisebuddy\rocket.chat\packages\rocketchat-livechat\client\views\sideNav\livechat.html
 * D:\Projekte\reisebuddy\rocket.chat\packages\rocketchat-livechat\client\views\sideNav\livechat.js
 * D:\Projekte\reisebuddy\rocket.chat\packages\rocketchat-livechat\client\views\sideNav\livechatRoomItem.js
 * D:\Projekte\reisebuddy\rocket.chat\packages\rocketchat-livechat\client\views\sideNav\livechatRoomItem.html
 * D:\Projekte\reisebuddy\rocket.chat\packages\rocketchat-livechat\client\ui.js
 */

Package.onUse(function(api) {
	api.use(['ecmascript', 'underscore']);
	api.use('reisebuddy:common');
	api.use('reisebuddy:communication');
	api.use(['rocketchat:lib']);

	api.addAssets('assets/jquery.datetimepicker.full.min.js', 'client');
	api.addAssets('assets/jquery.datetimepicker.css', 'client');
	api.addAssets('assets/icons/bahnDe.png', 'client');
	api.addAssets('assets/icons/bahn_de.png', 'client');
	api.addAssets('assets/icons/expedia.png', 'client');
	api.addAssets('assets/icons/google.png', 'client');
	api.addAssets('assets/icons/quixxit.png', 'client');
	api.addAssets('assets/icons/fallback_logo.png', 'client');
	api.addAssets('assets/icons/buld-grey.png', 'client');
	api.addAssets('assets/icons/bahnDeSearchbox.png', 'client');
	api.addAssets('assets/icons/community_bahn_de.png', 'client');
	api.addAssets('assets/icons/VKL.png', 'client');
	api.addAssets('assets/icons/yelp.png', 'client');
	api.addAssets('assets/icons/maps_google-FoodAndBeverages.png', 'client');

	api.addFiles('server/hooks/answerSubscriptionUpdateHook.js', 'server');
	api.addFiles('server/hooks/lastActivitySubscriptionUpdateHook.js', 'server');

	api.addFiles('server/lib/LivechatCustomizations.js', 'server');

	api.addFiles('server/methods/closeRoom.js', 'server');
	api.addFiles('server/methods/mergeRooms.js', 'server');

	api.addFiles('server/models/Subscriptions.js', 'server');

	api.addFiles('server/publications/livechatRoomStatistics.js', 'server');

	//i18n
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	var tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/reisebuddy-livechat/i18n'), function(filename) {
		return 'i18n/' + filename;
	}));
	api.addFiles(tapi18nFiles);

	api.use('tap:i18n');
});
