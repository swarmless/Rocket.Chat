/*
 * persist the lastActivity timestamp
 */
RocketChat.callbacks.add('afterSaveMessage', function (message) {
	RocketChat.models.Subscriptions.update({rid: message.rid}, {$set: {lastActivity: new Date()}});
	return message;
}, RocketChat.callbacks.priority.LOW);
