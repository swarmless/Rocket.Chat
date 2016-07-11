Meteor.publish('livechat:room_statistics', function () {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {publish: 'livechat:messages'}));
	}

	if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-rooms')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {publish: 'livechat:messages'}));
	}

	var self = this;

	RocketChat.models.Rooms.find().observeChanges({
		added(id, fields) {
			self.added('livechatRoomStatistics', id, addAgentsToRoom(id, fields));

			if (fields.v && fields.v._id) {
				addCrmDataToRoom(id, fields.v._id);
			}
		},
		changed(id, fields) {
			self.changed('livechatRoomStatistics', id, addAgentsToRoom(id, fields));


			if (fields.v && fields.v._id) {
				addCrmDataToRoom(id, fields.v._id);
			}
		},
		removed(id) {
			self.removed('livechatRoomStatistics', id);
		}
	});

	function test(crmContactId) {
		return _vtiger.getAdapter().retrievePromise(crmContactId)
			.catch((err)=> {
				throw new Meteor.Error(err)
			});
	}

	function addCrmDataToRoom(roomId, userId) {
		let userData = RocketChat.models.Users.findOneById(userId);

		if (userData.crmContactId) {
			Meteor.call('livechat:getCrmContact', userData.crmContactId, (err, crmContact) => {
				if (!err && crmContact) {
					let crmName = (crmContact.lastname ? crmContact.lastname : '') +
						(crmContact.lastname && crmContact.firstname ? ', ' : '') +
						(crmContact.firstname ? crmContact.firstname : '');

					// TODO liefert als "crmContract" = { _37: 0, _12: null, _59: [] }
					if (crmName && crmName.length > 0) {
						let fields = {};
						fields.label = crmName;

						self.changed('livechatRoomStatistics', roomId, fields);
					}
				}
			});
		}
	}

	function addAgentsToRoom(roomId, room) {
		let involvedAgents = [];

		let roomsMessages = RocketChat.models.Messages.find({rid: roomId});

		roomsMessages.forEach(
			message => {
				let sender = message.u;

				if (sender.username && involvedAgents.indexOf(sender.username) === -1
					&& (!room.v || !room.v._id || room.v._id !== sender._id)) {
					involvedAgents.push(sender.username);
				}
			}
		);
		room.involvedAgents = involvedAgents;

		return room;
	}

	self.ready();
});
