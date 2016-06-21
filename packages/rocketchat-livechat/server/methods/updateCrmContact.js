Meteor.methods({
	'livechat:updateCrmContact': function (contact) {
		return _vtiger.getAdapter()._updatePromise(contact);
	}
});
