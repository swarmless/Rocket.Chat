Meteor.methods({
	'p2phelp:helpRequestByRoomId'(roomId) {
		return RocketChat.models.HelpRequests.findOneByRoomId(roomId)
	}
});
