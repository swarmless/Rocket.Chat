/**
 * Hide closed rooms from livechat-list
 */
RocketChat.models.Subscriptions.handleCloseRoom = function (roomId) {
	return this.update({rid: roomId}, {$unset: {open: false}});
};
