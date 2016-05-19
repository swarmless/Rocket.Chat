/*
 * - persist the lastActivity timestamp
 * - In order to properly prioritize pending livechat-rooms, it is necessary to know when
 * the first message occurred since an agent had answered
 */
RocketChat.callbacks.add('afterSaveMessage', function (message) {
	// RocketChat.models.Subscriptions.update({rid: message.rid}, {$set: {lastActivity: new Date()}});
	const room = RocketChat.models.Rooms.findOneById(message.rid); //we need the room in order to determine who is the customer
	const roomMessages = RocketChat.models.Messages.findVisibleByRoomId(message.rid, {sort: { ts: -1 } }).fetch( );

	let lastChangedByCustomer = 0;
	let agentAnsweredAfterwards = false;
	for( let i = 0; i < roomMessages.length; i++ ){
		if (room.v._id === roomMessages[i].u._id) {
			// Customer wrote the message
			lastChangedByCustomer = roomMessages[i].ts;
			if (agentAnsweredAfterwards) break; //don't look no further, agent replied to this one
		}
		else{
			if (lastChangedByCustomer) break; //timestamp buffered is the one were looking for
			else  agentAnsweredAfterwards = true;// look for the next customer-message
		}
	}
	RocketChat.models.Subscriptions.update({rid: message.rid}, { $set: {
		lastChangedByCustomer: lastChangedByCustomer,
		lastActivity: new Date()
	}});

	return message;
}, RocketChat.callbacks.priority.LOW);
