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
			self.added('livechatRoomStatistics', id, extendRoomData(id, fields));
		},
		changed(id, fields) {
			self.changed('livechatRoomStatistics', id, extendRoomData(id, fields));
		},
		removed(id) {
			self.removed('livechatRoomStatistics', id);
		}
	});

	self.ready();
});

function extendRoomData(roomId, roomObject) {
	roomObject = formatDates(roomObject);
	roomObject = addAgentsToRoom(roomId, roomObject);

	if (roomObject.v && roomObject.v._id) {
		addCrmDataToRoom(roomId, roomObject.v._id);
	}

	return roomObject;
}

function formatDates(roomObject) {
	if (roomObject) {
		if (roomObject.lm) {
			roomObject.lm = moment(roomObject.lm).format('L LT');
		}

		if (roomObject.ts) {
			roomObject.ts = moment(roomObject.ts).format('L LT');
		}
	}

	return roomObject;
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

function addCrmDataToRoom(roomId, userId) {
	let userData = RocketChat.models.Users.findOneById(userId);

	if (userData.crmContactId) {
		Meteor.call('livechat:getCrmContact', userData.crmContactId, (err, crmContact) => {
			if (!err && crmContact) {
				let crmName = (crmContact.lastname ? crmContact.lastname : '') +
					(crmContact.lastname && crmContact.firstname ? ', ' : '') +
					(crmContact.firstname ? crmContact.firstname : '');

				// TODO liefert als crmContact IMMMER  { _37: 0, _12: null, _59: [] }
				// console.log(crmContact);
				if (crmName && crmName.length > 0) {
					let fields = {};
					fields.label = crmName;

					self.changed('livechatRoomStatistics', roomId, fields);
				}
			}
		});
	}
}
