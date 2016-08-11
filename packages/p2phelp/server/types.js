// Definition of value objects. No clue why export interface is not supported
class HelpDiscussionCreatedResponse{
	constructor(url, providersJoined){
		this.url = url;
		this.providers_joined = providersJoined;
	}
}

p2ph.HelpDiscussionCreatedResponse = HelpDiscussionCreatedResponse;
