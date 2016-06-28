/**
 * Sends messages by with reisebuddy CommunicationService.
 * @author jakobpannier
 */
RocketChat.callbacks.add('afterSaveMessage', function (message, pRoom) {
	// skips this callback if the message was edited
	if (message.editedAt || !pRoom || !pRoom._id) {
		return message;
	}
	const room = RocketChat.models.Rooms.findOneById(pRoom._id); // sometimes not complete
	SystemLogger.debug("ds1" + JSON.stringify(room));
	// only proceed if room: is livechat with source and visitor information
	if (!(room && room.t === 'l' && room.v && room.v.token && room.rbInfo && room.rbInfo.serviceName &&
		  room.rbInfo.visitorSendInfo)) {
		return message;
	}
	SystemLogger.debug("ds2");
	// if the message has a token or a special type, it was sent from the visitor, so ignore it
	if (message.token || message.t) {
		return message;
	}
	SystemLogger.debug("ds3");
	const service = _dbs.getCommunicationService(room.rbInfo.serviceName);
	if (!service) {
		return message;
	}
	SystemLogger.debug("ds4");
	service.send({
		to: room.rbInfo.visitorSendInfo,
		message: message.msg
	});
	SystemLogger.debug("ds5");
	return message;
}, RocketChat.callbacks.priority.MEDIUM);
