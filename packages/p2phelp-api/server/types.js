// Definition of value objects. No clue why export interface is not supported
class HelpDiscussionCreatedResponse{
	constructor(url, providersJoined){
		this.url = url;
		this.providersJoined = providersJoined;
	}
}

p2ph.HelpDiscussionCreatedResponse = HelpDiscussionCreatedResponse;
