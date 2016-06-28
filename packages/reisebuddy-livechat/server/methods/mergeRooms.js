/**
 * Returns the livechat room to the given room-id if the current user has the permission.
 * @throws error-not-authorized
 */
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
	/**
	 * @param roomId id of the current livechat room
	 * @return {Room} the livechat room from the previous conversation
	 * @throws Meteor.Error if no room is found
	 */
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
	/**
	 * Moves all messages from roomToClose to newRoom, increments msg counter on newRoom, removes subscriptions
	 * on roomToClose, deletes roomToClose, reopens newRoom, attaches subscriptions to newRoom
	 * @throws Meteor.Error if rooms cannot be accessed
	 */
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
		let settings = {answered: closeRoom.answered};
		if(closeRoom.rbInfo) {
			settings.rbInfo = closeRoom.rbInfo;
		}
        RocketChat.models.Subscriptions.update(newRoomId, {$set: settings});
		RocketChat.models.Subscriptions.openByRoomIdAndUserId(newRoomId, Meteor.userId());
	}
});
