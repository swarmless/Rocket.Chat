RocketChat.callbacks.add('afterCreateLivechat', (guest, room) => {

	if (!guest.crmContactId) {
		Meteor.call('livechat:createCrmContact', guest, (err, data)=> {
			if (err) {
				console.error(err);
			}
		});
	}
});
