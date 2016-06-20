/* exported _vtiger */
_vtiger = Npm.require('vtiger-client');

_vtiger.getAdapter = function() {
	if (!_vtiger.singleton) {
		let basePath = '';
		let username = '';
		let userAccessKey = '';

		RocketChat.settings.get('CRM_vtiger_url', function (key, value) {
			basePath = value;
		});

		RocketChat.settings.get('CRM_vtiger_username', function (key, value) {
			username = value;
		});

		RocketChat.settings.get('CRM_vtiger_userAccessKey', function (key, value) {
			userAccessKey = value;
		});

		if (!(basePath && username && userAccessKey)) throw 'CRM adapter configuration missing';

		_vtiger.singleton = new _vtiger.VTigerCrmAdapter(basePath, username, userAccessKey);
	}

	return _vtiger.singleton;
};
