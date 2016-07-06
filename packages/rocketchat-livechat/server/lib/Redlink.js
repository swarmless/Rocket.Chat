class RedlinkAdapter {
	constructor(adapterProps) {
		this.properties = adapterProps;
		this.headers = {
			'content-Type': 'application/json; charset=utf-8',
			'authorization': 'basic ' + this.properties.token
		};
	}

	createRedlinkStub(rid, latestKnowledgeProviderResult) {
		const latestRedlinkResult = (latestKnowledgeProviderResult && latestKnowledgeProviderResult.knowledgeProvider === 'redlink')
			? latestKnowledgeProviderResult.result
			: {};
		return {
			id: latestRedlinkResult.id ? latestRedlinkResult.id : rid,
			meta: latestRedlinkResult.meta ? latestRedlinkResult.meta : {},
			user: latestRedlinkResult.user ? latestRedlinkResult.user : {},
			messages: latestRedlinkResult.messages ? latestRedlinkResult.messages : [],
			tokens: latestRedlinkResult.tokens ? latestRedlinkResult.tokens : [],
			queryTemplates: latestRedlinkResult.queryTemplates ? latestRedlinkResult.queryTemplates : []
		}
	}

	getConversation(rid, latestKnowledgeProviderResult) {

		let analyzedUntil = 0;
		let conversation = [];

		if (latestKnowledgeProviderResult && latestKnowledgeProviderResult.knowledgeProvider === 'redlink') {
			//there might have been another provider configures, e. g. if API.ai was entered earlier
			// therefore we need to validate we're operating with a Redlink-result

			analyzedUntil = latestKnowledgeProviderResult.originMessage ? latestKnowledgeProviderResult.originMessage.ts : 0;
			conversation = latestKnowledgeProviderResult.result.messages ? latestKnowledgeProviderResult.result.messages : [];
		}

		const room = RocketChat.models.Rooms.findOneById(rid);
		RocketChat.models.Messages.find({
			rid: rid,
			_hidden: {$ne: true},
			ts: {$gt: new Date(analyzedUntil)}
		}).forEach(visibleMessage => {
			conversation.push({
				content: visibleMessage.msg,
				time: visibleMessage.ts,
				origin: (room.v._id === visibleMessage.u._id) ? 'User' : 'Agent' //in livechat, the owner of the room is the user
			});
		});
		return conversation;
	}

	onResultModified(modifiedRedlinkResult) {
		try {
			const responseRedlinkQuery = HTTP.post(this.properties.url + '/query', {
				data: modifiedRedlinkResult.result,
				headers: this.headers
			});

			RocketChat.models.LivechatExternalMessage.update(
				{
					_id: modifiedRedlinkResult._id
				},
				{ $set: {
					result: responseRedlinkQuery.data
				}
			});

		} catch (err) {
			console.error('Updating redlink results (via QUERY) did not succeed -> ', err);
		}
	}

	onMessage(message) {
		const knowledgeProviderResultCursor = this.getKnowledgeProviderCursor(message.rid);
		const latestKnowledgeProviderResult = knowledgeProviderResultCursor.fetch()[0];

		const requestBody = this.createRedlinkStub(message.rid, latestKnowledgeProviderResult);
		requestBody.messages = this.getConversation(message.rid, latestKnowledgeProviderResult);

		try {

			const responseRedlinkPrepare = HTTP.post(this.properties.url + '/prepare', {
				data: requestBody,
				headers: this.headers
			});

			if (responseRedlinkPrepare.data && responseRedlinkPrepare.statusCode === 200) {

				this.purgePreviousResults(knowledgeProviderResultCursor);

				RocketChat.models.LivechatExternalMessage.insert({
					rid: message.rid,
					knowledgeProvider: "redlink",
					originMessage: {_id: message._id, ts: message.ts},
					result: responseRedlinkPrepare.data,
					ts: new Date()
				});
			}
		} catch (e) {
			//todo Redlink-API und Implementierung sind noch nicht wirklich stabil =>
			console.error('Redlink-Prepare/Query with results from prepare did not succeed -> ', e);
		}
	}

	purgePreviousResults(knowledgeProviderResultCursor) {
		//delete suggestions proposed so far - Redlink will always analyze the complete conversation
		knowledgeProviderResultCursor.forEach((oldSuggestion) => {
			RocketChat.models.LivechatExternalMessage.remove(oldSuggestion._id);
		});
	}

	getKnowledgeProviderCursor(roomId) {
		return RocketChat.models.LivechatExternalMessage.findByRoomId(roomId, {ts: -1});
	}

	onClose(room) { //async

		const knowledgeProviderResultCursor = this.getKnowledgeProviderCursor(room._id);
		let latestKnowledgeProviderResult = knowledgeProviderResultCursor.fetch()[0];
		if (latestKnowledgeProviderResult) {
			latestKnowledgeProviderResult.helpful = room.rbInfo.knowledgeProviderUsage;

			HTTP.post(this.properties.url + '/store', {
				data: {
					latestKnowledgeProviderResult
				},
				headers: this.headers
			});
		}
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
