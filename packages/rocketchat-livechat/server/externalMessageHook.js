/* globals HTTP, SystemLogger */

var knowledgeEnabled = false;
var apiaiKey = '';
var apiaiLanguage = 'en';
var knowledgeSource = '';
var redlinkURL = '';
var redlinkAuthToken = '';

const KNOWLEDGE_SRC_APIAI = "0";
const KNOWLEDGE_SRC_REDLINK = "1";
RocketChat.settings.get('Livechat_Knowledge_Enabled', function(key, value) {
	knowledgeEnabled = value;
});
RocketChat.settings.get('Livechat_Knowledge_Source', function(key, value) {
	knowledgeSource = value;
});
RocketChat.settings.get('Livechat_Knowledge_Apiai_Key', function(key, value) {
	apiaiKey = value;
});
RocketChat.settings.get('Livechat_Knowledge_Apiai_Language', function(key, value) {
	apiaiLanguage = value;
});
RocketChat.settings.get('Livechat_Knowledge_Redlink_URL', function(key, value) {
	redlinkURL = value;
});
RocketChat.settings.get('Livechat_Knowledge_Redlink_Auth_Token', function(key, value) {
	redlinkAuthToken = value;
});

function getKnowledgeAdapter(knowledgeSource, adapterProps){
	switch( knowledgeSource ) {
		case KNOWLEDGE_SRC_APIAI:
			return {
				onMessage: function(message){
					const responseAPIAI = HTTP.post(adapterProps.url, {
						data: {
							query: message.msg,
							lang: adapterProps.language
						},
						headers: {
							'Content-Type': 'application/json; charset=utf-8',
							'Authorization': 'Bearer ' + adapterProps.token
						}
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
			};
		break;
		case KNOWLEDGE_SRC_REDLINK:
			return {
				onMessage: function(message){
					let conversation = [];
					const headers = {
						'Content-Type': 'application/json; charset=utf-8',
						'Authorization': 'basic ' + adapterProps.token
					};
					const room = RocketChat.models.Rooms.findOneById(message.rid);

					RocketChat.models.Messages.findVisibleByRoomId(message.rid).forEach(visibleMessage => {
						conversation.push({
							content: visibleMessage.msg,
							origin: (room.v._id === visibleMessage.u._id) ? 'User' : 'Agent' //in livechat, the owner of the room is the user
						});
					});
					const responseRedlinkPrepare = HTTP.post(adapterProps.url + '/prepare', {
						data: {
							messages: conversation.filter(temp => temp.origin === 'User') //todo: entfernen, sobald Redlink mit "Agent" umgehen kann
						},
						headers: headers
					});

					try {
						const responseRedlinkQuery = HTTP.post(adapterProps.url + '/query', {
							data: responseRedlinkPrepare.data,
							headers: headers
						});
					} catch(e) {
						//todo: Query funktioniert noch nicht. als Fallback nehmen wir so lange das Ergebnis aus Prepare
						responseRedlinkQuery = responseRedlinkPrepare;
					}

					if (responseRedlinkQuery.data && responseRedlinkQuery.statusCode === 200) {

						//delete suggestions proposed so far - Redlink will always analyze the complete conversation
						RocketChat.models.LivechatExternalMessage.findByRoomId(message.rid).forEach( (oldSuggestion) => {
							RocketChat.models.LivechatExternalMessage.remove(oldSuggestion._id);
						});

						for (let i = 0; i < responseRedlinkQuery.data.queries.length; i++){
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
			}
	}
}

RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	if (!knowledgeEnabled) {
		return message;
	}

	if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.v && room.v.token)) {
		return message;
	}

	// if the message hasn't a token, it was not sent by the visitor, so ignore it
	if (!message.token) {
		return message;
	}

	let adapterProps = { };
	if ( knowledgeSource === KNOWLEDGE_SRC_APIAI )
		adapterProps = {
			url: 'https://api.api.ai/api/query?v=20150910',
			token: apiaiKey,
			language: apiaiLanguage
		};

	if ( knowledgeSource === KNOWLEDGE_SRC_REDLINK )
		adapterProps = {
			url: redlinkURL,
			token: redlinkAuthToken,
			language: 'de'
		};

	const knowledgeAdapter = getKnowledgeAdapter(knowledgeSource, adapterProps);
	if (!knowledgeAdapter) {
		return;
	}

	Meteor.defer(() => {
				try {
					getKnowledgeAdapter(knowledgeSource, adapterProps).onMessage(message);
				}
				catch(e) {
					SystemLogger.error('Error using knowledge provider ->', e);
				}
	});

	return message;
}, RocketChat.callbacks.priority.LOW);
