Meteor.methods({
	/**
	 * Extension to livechat:closeRoom to set some properties to the room on close.
	 */
	'reisebuddy:closeRoom': function (roomId, closeProps) {
		const originalResult = Meteor.call('livechat:closeRoom', roomId, closeProps.comment);

		return originalResult && RocketChat.Livechat.closeReisebuddyRoom({
			user: user,
			room: room,
			closeProps: closeProps
		});
	}
});
