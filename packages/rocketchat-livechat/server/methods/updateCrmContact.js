Meteor.methods({
	'livechat:updateCrmContact': function (contact) {
		return _vtiger.getAdapter()._updatePromise(contact)
			.catch((err)=> {
				throw new Meteor.Error(err)
			});
	}
});
