Meteor.methods({
	'livechat:createCrmContact': function (userId, roomId) {

		const SEND_IMMEDIATELY = 0;
		const user = RocketChat.models.Users.findOneById(userId);

		let mobileNumber = user.phone ? user.phone[0].phoneNumber : "";
		let emailAddress = user.emails ? user.emails[0].address : "";

		if (!mobileNumber && emailAddress && ( emailAddress.search('@') === -1)) { //email most probably contains a phone number
			mobileNumber = emailAddress;
			emailAddress = emailAddress + "@sms.db.de";
		}
		
		if (!mobileNumber && emailAddress && emailAddress.match(/^\+?\d+@sms.db.de$/)) {
			mobileNumber = emailAddress.replace("@sms.db.de", "");
		}

		const contact = {
			lastname: (mobileNumber.length > 0 ? mobileNumber : (emailAddress.length > 0 ? emailAddress : "Neuer Kunde")),
			mobile: mobileNumber,
			email: emailAddress
		};

		const firstMessage = RocketChat.models.Messages.findFirstMessageFromUser(user._id);

		try {
			const createContactResult = Promise.await(_vtiger.getAdapter().createContactWithMessagePromise(contact, firstMessage.msg));

			let updateData = {};
			updateData.crmContactId = createContactResult.createdContact.id;

			RocketChat.models.Users.saveUserById(user._id, updateData);

			if (createContactResult.messages) {
				const immediatedMessagesString = createContactResult.messages.reduce(function (reduced, current) {
					if (current.processingInstruction === SEND_IMMEDIATELY) {
						return reduced ? reduced + current.message : current.message;
					} else {
						return reduced;
					}
				}, "");
				if (immediatedMessagesString) {
					let room = RocketChat.models.Rooms.findOne(roomId);
					try {
						RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser("", room._id, immediatedMessagesString, room.servedBy);
					} catch (err) {
						console.error('Could not send registration messages', err);
						throw new Meteor.Error(err);
					}
				}
			}
		}
		catch (err) {
			console.error("Couldn't create contact in crm system", err);
			throw new Meteor.Error(err);
		}
	}
});
