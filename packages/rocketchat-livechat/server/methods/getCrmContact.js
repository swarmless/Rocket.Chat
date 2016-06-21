Meteor.methods({
	'livechat:getCrmContact': function (visitorId) {
		return _vtiger.getAdapter().findContactsFulltextPromise('Bond')
			.catch((err)=> {
				throw new Meteor.Error(err)
			});
	}
});
