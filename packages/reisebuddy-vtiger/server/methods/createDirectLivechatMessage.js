Meteor.methods({
	/**
	 * Creates a direct livechat message to a contact. Verifies that the given username.
	 * If no user with the given name or crmId is found, but the crmId exists in the CRM, a new guest will be created.
	 * @param username
	 * @param crmId [Optional]
	 * @see server/methods/createDirectMessage.coffee
	 */
	createDirectLivechatMessage: function ({username, crmId}) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', "Invalid user", {method: 'createDirectLivechatMessage'});
		}
		const me = Meteor.user();
		if (!me.username || me.username === username) {
			throw new Meteor.Error('error-invalid-user', "Invalid user", {method: 'createDirectLivechatMessage'});
		}

		let to = RocketChat.models.Users.findOneByUsername(username);
		if (!to && crmId) {
			SystemLogger.debug("lookup user by crmID " + crmId);
			to = RocketChat.models.Users.findOneVisitorByCrmContactId(crmId);
			if (!to) {
				SystemLogger.debug("try to create new guest for crmId " + crmId);
				to = Meteor.wrapAsync(() => {
					_vtiger.getAdapter().retrievePromise(crmId).then((contact) => {
						SystemLogger.debug("crm item found, try to create guest " + contact.id);
						return RocketChat.Livechat.registerGuest({
							username: contact.email,
							token: Random.id(),
							other: {crmContactId: contact.id}
						});
					}).catch((err) => {
						SystemLogger.warn("unable to register new guest: " + err);
						return undefined;
					})
				})();
			}
		}
		if (!to) {
			throw new Meteor.Error('error-invalid-user', "Invalid user", {method: 'createDirectLivechatMessage'})
		}

		const rid = Random.id();
		const now = new Date();
		const roomCode = RocketChat.models.Rooms.getNextLivechatRoomCode();

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
