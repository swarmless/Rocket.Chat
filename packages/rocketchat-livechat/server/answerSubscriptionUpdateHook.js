/*
 * set the answered status of a subscription aka. liveChat room
 */
RocketChat.callbacks.add('afterSaveMessage', function (message) {
	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}
	// if the message has a token, it was sent from a visitor
	if (message.token) {
		RocketChat.models.Subscriptions.update({rid: message.rid}, {$set: {answered: false}});
	} else {
		RocketChat.models.Subscriptions.update({rid: message.rid}, {$set: {answered: true}});
	}
	return message;
}, RocketChat.callbacks.priority.HIGH);
