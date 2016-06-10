Meteor.methods
	createDirectLivechatMessage: (username) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'createDirectLivechatMessage' }

		me = Meteor.user()

		unless me.username
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'createDirectLivechatMessage' }

		if me.username is username
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'createDirectLivechatMessage' }

		if !RocketChat.authz.hasPermission Meteor.userId(), 'create-d'
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'createDirectLivechatMessage' }

		to = RocketChat.models.Users.findOneByUsername username

		if not to
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'createDirectLivechatMessage' }

		rid = Random.id()
		now = new Date()
		roomCode = RocketChat.models.Rooms.getNextLivechatRoomCode()

		# Make sure we have a room
		RocketChat.models.Rooms.upsert
			_id: rid
		,
			$set:
				usernames: [me.username, to.username]
			$setOnInsert:
				t: 'l'
				msgs: 0
				ts: now
				lm: new Date()
				open: true
				label: to.name || to.username
				code: roomCode
				v:
					_id: to._id
				servedBy:
					_id: me._id,
					username: me.username

		# Make user I have a subcription to this room
		RocketChat.models.Subscriptions.upsert
			rid: rid
			$and: [{'u._id': me._id}] # work around to solve problems with upsert and dot
		,
			$set:
				ts: now
				ls: now
				open: true
			$setOnInsert:
				name:  to.name || to.username
				t: 'l'
				code: roomCode
				alert: false
				unread: false
				u:
					_id: me._id
					username: me.username

		return {
			rid: rid
			code: roomCode
		}
