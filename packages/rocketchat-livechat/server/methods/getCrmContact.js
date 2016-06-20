Meteor.methods({
	'livechat:getCrmContact': function (visitorId) {
			return _vtiger.getAdapter().findContactsFulltextPromise('Bond');
	}
});
