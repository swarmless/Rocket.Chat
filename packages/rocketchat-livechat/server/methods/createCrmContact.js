Meteor.methods({
	'livechat:createCrmContact': function (user) {

		const contact = {
			lastname: 'Neuer Benutzer',
			mobile: user.mobile || "",
			email: user.email || ( user.mobile ? (user.mobile + "@sms.db.de" ) : "" )
		};

		return _vtiger.getAdapter().createContactPromise(contact);
	}
});
