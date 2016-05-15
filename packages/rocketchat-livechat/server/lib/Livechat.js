/* globals SystemLogger */

class RedlinkAdapter {
	constructor(adapterProps) {
		this.properties = adapterProps;
		this.headers = {
			'content-Type': 'application/json; charset=utf-8',
			'authorization': 'basic ' + this.properties.token
		};
	}

	getConversation(rid) {
		let conversation = [];
		const room = RocketChat.models.Rooms.findOneById(rid);
		RocketChat.models.Messages.findVisibleByRoomId(rid).forEach(visibleMessage => {
			conversation.push({
				content: visibleMessage.msg,
				origin: (room.v._id === visibleMessage.u._id) ? 'User' : 'Agent' //in livechat, the owner of the room is the user
			});
		});
		return conversation;
	}

	onMessage(message) {
		const conversation = this.getConversation(message.rid)
		const responseRedlinkPrepare = HTTP.post(this.properties.url + '/prepare', {
			data: {
				messages: conversation.filter(temp => temp.origin === 'User'), //todo: entfernen, sobald Redlink mit "Agent" umgehen kann
				user: {
					id: message.u._id
				}
			},
			headers: this.headers
		});

		try {
			var responseRedlinkQuery = HTTP.post(this.properties.url + '/query', {
				data: responseRedlinkPrepare.data,
				headers: this.headers
			});
		} catch(e) {
			//todo Redlink-API und Implementierung sind noch nicht wirklich stabil =>
			//Als Fallback das Ergebnis von query nehmen
			responseRedlinkQuery = responseRedlinkPrepare;
			SystemLogger.error('Redlink-Query with results from prepare did not succeed -> ', e);
		}

		if (responseRedlinkQuery.data && responseRedlinkQuery.statusCode === 200) {

			//delete suggestions proposed so far - Redlink will always analyze the complete conversation
			RocketChat.models.LivechatExternalMessage.findByRoomId(message.rid).forEach((oldSuggestion) => {
				RocketChat.models.LivechatExternalMessage.remove(oldSuggestion._id);
			});

			for (let i = 0; i < responseRedlinkQuery.data.queries.length; i++) {
				RocketChat.models.LivechatExternalMessage.insert({
					rid: message.rid,
					msg: responseRedlinkQuery.data.queries[i].serviceName,
					url: responseRedlinkQuery.data.queries[i].url,
					orig: message._id,
					ts: new Date()
				});
			}
		}
	}

	onClose(room) { //async
		HTTP.post(this.properties.url + '/store', {
			data: {
				messages: this.getConversation(room._id)
			},
			headers: this.headers
		});
	}
}

class ApiAiAdapter {
	constructor(adapterProps) {
		this.properties = adapterProps;
		this.headers = {
			'Content-Type': 'application/json; charset=utf-8',
			'Authorization': 'Bearer ' + this.properties.token
		}
	}

	onMessage(message) {
		const responseAPIAI = HTTP.post(this.properties.url, {
			data: {
				query: message.msg,
				lang: this.properties.language
			},
			headers: this.headers
		});
		if (responseAPIAI.data && responseAPIAI.data.status.code === 200 && !_.isEmpty(responseAPIAI.data.result.fulfillment.speech)) {
			RocketChat.models.LivechatExternalMessage.insert({
				rid: message.rid,
				msg: responseAPIAI.data.result.fulfillment.speech,
				orig: message._id,
				ts: new Date()
			});
		}
	}

	onClose() {
		//do nothing, api.ai does not learn from us.
	}
}

class RedlinkMock extends RedlinkAdapter {
	constructor(adapterProps) {
		super(adapterProps);

		this.properties.url = 'http://localhost:8080';
		delete this.headers.authorization;
	}
}

RocketChat.Livechat = {
	getNextAgent(department) {
		if (department) {
			return RocketChat.models.LivechatDepartmentAgents.getNextAgentForDepartment(department);
		} else {
			return RocketChat.models.Users.getNextAgent();
		}
	},
	sendMessage({guest, message, roomInfo}) {
		var room = RocketChat.models.Rooms.findOneById(message.rid);
		var newRoom = false;

		if (room && !room.open) {
			message.rid = Random.id();
			room = null;
		}

		if (room == null) {

			// if no department selected verify if there is only one active and use it
			if (!guest.department) {
				var departments = RocketChat.models.LivechatDepartment.findEnabledWithAgents();
				if (departments.count() === 1) {
					guest.department = departments.fetch()[0]._id;
				}
			}

			const agent = RocketChat.Livechat.getNextAgent(guest.department);
			if (!agent) {
				throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
			}

			const roomCode = RocketChat.models.Rooms.getNextLivechatRoomCode();

			room = _.extend({
				_id: message.rid,
				msgs: 1,
				lm: new Date(),
				code: roomCode,
				label: guest.name || guest.username,
				usernames: [agent.username, guest.username],
				t: 'l',
				ts: new Date(),
				v: {
					_id: guest._id,
					token: message.token
				},
				open: true
			}, roomInfo);
			let subscriptionData = {
				rid: message.rid,
				name: guest.name || guest.username,
				alert: true,
				open: true,
				unread: 1,
				answered: false,
				code: roomCode,
				u: {
					_id: agent.agentId,
					username: agent.username
				},
				t: 'l',
				desktopNotifications: 'all',
				mobilePushNotifications: 'all',
				emailNotifications: 'all'
			};

			RocketChat.models.Rooms.insert(room);
			RocketChat.models.Subscriptions.insert(subscriptionData);

			newRoom = true;
		} else {
			room = Meteor.call('canAccessRoom', message.rid, guest._id);
		}
		if (!room) {
			throw new Meteor.Error('cannot-acess-room');
		}
		return _.extend(RocketChat.sendMessage(guest, message, room), {newRoom: newRoom});
	},
	registerGuest({token, name, email, department, phone, loginToken, username} = {}) {
		check(token, String);

		const user = RocketChat.models.Users.getVisitorByToken(token, {fields: {_id: 1}});

		if (user) {
			throw new Meteor.Error('token-already-exists', 'Token already exists');
		}

		if (!username) {
			username = RocketChat.models.Users.getNextVisitorUsername();
		}

		let updateUser = {
			$set: {
				profile: {
					guest: true,
					token: token
				}
			}
		};

		var existingUser = null;

		var userId;

		if (s.trim(email) !== '' && (existingUser = RocketChat.models.Users.findOneByEmailAddress(email))) {
			if (existingUser.type !== 'visitor') {
				throw new Meteor.Error('error-invalid-user', 'This email belongs to a registered user.');
			}

			updateUser.$addToSet = {
				globalRoles: 'livechat-guest'
			};

			if (loginToken) {
				updateUser.$addToSet['services.resume.loginTokens'] = loginToken;
			}

			userId = existingUser._id;
		} else {
			updateUser.$set.name = name;

			var userData = {
				username: username,
				globalRoles: ['livechat-guest'],
				department: department,
				type: 'visitor'
			};

			if (this.connection) {
				userData.userAgent = this.connection.httpHeaders['user-agent'];
				userData.ip = this.connection.httpHeaders['x-real-ip'] || this.connection.clientAddress;
				userData.host = this.connection.httpHeaders.host;
			}

			userId = Accounts.insertUserDoc({}, userData);

			if (loginToken) {
				updateUser.$set.services = {
					resume: {
						loginTokens: [loginToken]
					}
				};
			}
		}

		if (phone) {
			updateUser.$set.phone = [
				{phoneNumber: phone.number}
			];
		}

		if (email && email.trim() !== '') {
			updateUser.$set.emails = [
				{address: email}
			];
		}

		Meteor.users.update(userId, updateUser);

		return userId;
	},

	saveGuest({_id, name, email, phone}) {
		let updateData = {};

		if (name) {
			updateData.name = name;
		}
		if (email) {
			updateData.email = email;
		}
		if (phone) {
			updateData.phone = phone;
		}
		return RocketChat.models.Users.saveUserById(_id, updateData);
	},

	closeRoom({user, room, comment}) {
		RocketChat.models.Rooms.closeByRoomId(room._id);

		const message = {
			t: 'livechat-close',
			msg: comment,
			groupable: false
		};

		RocketChat.sendMessage(user, message, room);

		RocketChat.models.Subscriptions.hideByRoomIdAndUserId(room._id, user._id);

		Meteor.defer(() => {
			try {
				this.getKnowledgeAdapter().onClose(room);
			} catch (e) {
				SystemLogger.error('Error submitting closed conversation to knowledge provider ->', e);
			}
		});

		return true;
	},

	getInitSettings() {
		let settings = {};

		RocketChat.models.Settings.findNotHiddenPublic([
			'Livechat_title',
			'Livechat_title_color',
			'Livechat_enabled',
			'Livechat_registration_form',
			'Livechat_offline_title',
			'Livechat_offline_title_color',
			'Livechat_offline_message'
		]).forEach((setting) => {
			settings[setting._id] = setting.value;
		});

		return settings;
	},

	getKnowledgeAdapter () {
		var knowledgeSource = '';

		const KNOWLEDGE_SRC_APIAI = "0";
		const KNOWLEDGE_SRC_REDLINK = "1";

		RocketChat.settings.get('Livechat_Knowledge_Source', function (key, value) {
			knowledgeSource = value;
		});

		let adapterProps = {
			url: '',
			token: '',
			language: ''
		};

		switch (knowledgeSource) {
			case KNOWLEDGE_SRC_APIAI:
				adapterProps.url = 'https://api.api.ai/api/query?v=20150910';

				RocketChat.settings.get('Livechat_Knowledge_Apiai_Key', function (key, value) {
					adapterProps.token = value;
				});
				RocketChat.settings.get('Livechat_Knowledge_Apiai_Language', function (key, value) {
					adapterProps.language = value;
				});

				if (!this.apiaiAdapter) this.apiaiAdapter = new ApiAiAdapter(adapterProps);
				return this.apiaiAdapter;
				break;
			case KNOWLEDGE_SRC_REDLINK:
				RocketChat.settings.get('Livechat_Knowledge_Redlink_URL', function (key, value) {
					adapterProps.url = value;
				});
				RocketChat.settings.get('Livechat_Knowledge_Redlink_Auth_Token', function (key, value) {
					adapterProps.token = value;
				});

				if (this.redlinkAdapter) return this.redlinkAdapter;
				else {
					if (process.env.NODE_ENV === 'development') { //use mock
						this.redlinkAdapter = new RedlinkMock(adapterProps);
					} else {
						this.redlinkAdapter = new RedlinkAdapter(adapterProps);
					}
					return this.redlinkAdapter;
				}

		}
	}
};
