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
		const conversation = this.getConversation(message.rid);
		const responseRedlinkPrepare = HTTP.post(this.properties.url + '/prepare', {
			data: {
				messages: conversation,
				user: {
					id: message.u._id
				}
			},
			headers: this.headers
		});

		try {
			if (responseRedlinkPrepare.data && responseRedlinkPrepare.statusCode === 200) {
				//delete suggestions proposed so far - Redlink will always analyze the complete conversation
				RocketChat.models.LivechatExternalMessage.findByRoomId(message.rid).forEach((oldSuggestion) => {
					RocketChat.models.LivechatExternalMessage.remove(oldSuggestion._id);
				});

				RocketChat.models.LivechatExternalMessage.insert({
					rid: message.rid,
					knowledgeProvider: "redlink",
					orig: message._id,
					redlinkQuery: responseRedlinkPrepare.data,
					ts: new Date()
				});
			}
		} catch(e) {
			//todo Redlink-API und Implementierung sind noch nicht wirklich stabil =>
			SystemLogger.error('Redlink-Prepare/Query with results from prepare did not succeed -> ', e);
		}

		/*
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
		 redlinkPrepare: responseRedlinkPrepare.data,
		 ts: new Date()
		 });
		 }
		 }
		 */
	}

	onClose(room) { //async
		HTTP.post(this.properties.url + '/store', {
			data: {
				messages: this.getConversation(room._id),
				user: {id: room.v._id}
			},
			headers: this.headers
		});
	}
}

class RedlinkMock extends RedlinkAdapter {
	constructor(adapterProps) {
		super(adapterProps);

		this.properties.url = 'http://localhost:8080';
		delete this.headers.authorization;
	}
}

this.RedlinkAdapter = RedlinkAdapter;
this.RedlinkMock = RedlinkMock;
