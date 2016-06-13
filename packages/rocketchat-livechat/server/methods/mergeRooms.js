function getLiveRoomFromId(rid, errorMethod) {
	if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
		throw new Meteor.Error('error-not-authorized', 'Not authorized', {method: errorMethod});
	}
	const room = RocketChat.models.Rooms.findOneById(rid);
	if (!room || room.usernames.indexOf(Meteor.user().username) === -1) {
		throw new Meteor.Error('error-not-authorized', 'Not authorized', {method: errorMethod});
	}
	return room;
}

Meteor.methods({
	'livechat:getPreviousRoom': function (roomId) {
		const room = getLiveRoomFromId(roomId, 'livechat:getPreviousRoom');
		const targetRoom = RocketChat.models.Rooms.findOne({
			"v._id": room.v._id,
			open: {$ne: true}
		}, {sort: {ts: -1}});
		if (!targetRoom || !targetRoom.usernames) {
			throw new Meteor.Error('error-not-found', 'Not found', {method: 'livechat:getPreviousRoom'});
		}
		if (targetRoom.usernames.indexOf(Meteor.user().username) === -1) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {method: 'livechat:getPreviousRoom'});
		}
		return targetRoom;
	},
	'livechat:mergeRooms': function (roomToCloseId, newRoomId) {
		const closeRoom = getLiveRoomFromId(roomToCloseId, 'livechat:mergeRooms');
		const mergeRoom = getLiveRoomFromId(newRoomId, 'livechat:mergeRooms');

		if (!closeRoom || !mergeRoom) {
			throw new Meteor.Error('error-not-found', 'Not found', {method: 'livechat:mergeRooms'});
		}
		const numOfMsgsToMove = RocketChat.models.Messages.findVisibleByRoomId(roomToCloseId).count();
		RocketChat.models.Messages.updateAllRoomIds(roomToCloseId, newRoomId);
		RocketChat.models.Rooms.incMsgCountAndSetLastMessageTimestampById(newRoomId, numOfMsgsToMove, new Date());

		RocketChat.models.Subscriptions.removeByRoomId(roomToCloseId);
		RocketChat.models.Rooms.removeById(roomToCloseId);

		RocketChat.models.Rooms.update(newRoomId, {
				$set: {open: true},
				$unset: {comment: ''}
			});
		RocketChat.models.Subscriptions.update(newRoomId, {$set: {answered: closeRoom.answered}});
		RocketChat.models.Subscriptions.openByRoomIdAndUserId(newRoomId, Meteor.userId());
	}
});
