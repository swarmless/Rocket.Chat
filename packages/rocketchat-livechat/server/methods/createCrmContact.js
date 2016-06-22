Meteor.methods({
	'livechat:createCrmContact': function (user) {

		const contact = {
			lastname: 'Neuer Benutzer',
			phone: user.phone? user.phone[0].phoneNumber : "",
			email: user.email ? user.email[0] : ( user.phone ? (user.phone[0].phoneNumber + "@sms.db.de" ) : "" )
		};

		try {
			const crmContact = Promise.await(_vtiger.getAdapter().createContactPromise(contact));

			let updateData = {};
			updateData.crmContactId = crmContact.id;

			return RocketChat.models.Users.saveUserById(user._id, updateData);
		}
		catch(err){
			console.error("Couldn't create contact in crm system", err);
		}
	}
});
