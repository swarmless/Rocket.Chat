Meteor.methods({
	/**
	 * Creates a livechat message room and subscription to a contact.
	 * If no user with the given name or crmId is found, but the crmId exists in the CRM, a new guest will be created.
	 * @param username
	 * @param crmContactId [Optional]
	 * @see server/methods/createDirectMessage.coffee
	 * @return the newly created room, or existing room if already served by the requesting agent
	 * @throws Error if user couldn't be found or there is an already open conversation with another agent
	 */
	createDirectLivechatMessage: function ({username, crmContactId}) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', "Invalid user", {method: 'createDirectLivechatMessage'});
		}
		const me = Meteor.user();
		if (!me.username || me.username === username) {
			throw new Meteor.Error('error-invalid-user', "Invalid user", {method: 'createDirectLivechatMessage'});
		}

		let to = RocketChat.models.Users.findOneByUsername(username);
		if (!to && crmContactId) {
			SystemLogger.debug("lookup user by crmID " + crmContactId);
			to = RocketChat.models.Users.findOneVisitorByCrmContactId(crmContactId);
			if (!to) {
				SystemLogger.debug("try to create new guest for crmId " + crmContactId);
				try {
					const contact = Promise.await(_vtiger.getAdapter().retrievePromise(crmContactId));
                    to =  RocketChat.Livechat.registerGuest({
						username: contact.email,
						token: Random.id(),
						other: {crmContactId: contact.id}
					});
				} catch (err) {
					SystemLogger.warn("unable to register new guest: " + err);
				}
			}
		}
		if (!to) {
			throw new Meteor.Error('error-invalid-user', "Invalid user", {method: 'createDirectLivechatMessage'})
		}

		const existingRoom = RocketChat.models.Rooms.findOne({
			t: 'l',
			open: true,
			'v._id': to._id
		});

		if (existingRoom) {
			if (existingRoom.servedBy && existingRoom.servedBy._id === Meteor.userId()) {
				return existingRoom;
			}
			throw new Meteor.Error('error-served-by-other',
				"Served by other agent",
				{
					method: 'createDirectLivechatMessage',
					agent: existingRoom.servedBy.username
				});
		}

		const rid = Random.id();
		const now = new Date();
		const roomCode = RocketChat.models.Rooms.getNextLivechatRoomCode();
		//todo this should be a switch for multiple inbound channels
		const communicationService = _dbs.getCommunicationService('lotusMail');

		// Make sure we have a room
		RocketChat.models.Rooms.upsert({
			_id: rid
		}, {
			$set: {
				usernames: [me.username, to.username]
			},
			$setOnInsert: {
				t: 'l',
				msgs: 0,
				ts: now,
				lm: now,
				open: true,
				label: to.name || to.username,
				code: roomCode,
				v: {_id: to._id},
				servedBy: {
					_id: me._id,
					username: me.username
				},
				rbInfo: {
					source: communicationService.getRoomType(to.email),
					visitorSendInfo: to.email,
					serviceName: communicationService.getServiceName()
				}
			}
		});
		//Make agent have a subscription to this room
		RocketChat.models.Subscriptions.upsert({
			rid: rid,
			$and: [{'u._id': me._id}] // work around to solve problems with upsert and dot
		}, {
			$set: {
				ts: now,
				ls: now,
				open: true
			},
			$setOnInsert: {
				name: to.name || to.username,
				t: 'l',
				code: roomCode,
				alert: false,
				unread: false,
				u: {
					_id: me._id,
					username: me.username
				}
			}
		});

		return {
			rid: rid,
			code: roomCode
		};
	}
});
