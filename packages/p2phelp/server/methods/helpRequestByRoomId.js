Meteor.methods({
	'p2phelp:helpRequestByRoomId'(roomId) {
		if(roomId) {
			return RocketChat.models.HelpRequests.findOneByRoomId(roomId)
		}
	}
});
