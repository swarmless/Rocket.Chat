Meteor.methods({
	'updateKnowledgeProviderResult': function (modifiedKnowledgeProviderResult) {
		if(!modifiedKnowledgeProviderResult) return;
		
		const knowledgeAdapter = RocketChat.Livechat.getKnowledgeAdapter();

		if (knowledgeAdapter instanceof RedlinkAdapter && modifiedKnowledgeProviderResult.knowledgeProvider === 'redlink') {
			return knowledgeAdapter.onResultModified(modifiedKnowledgeProviderResult);
		}
	}
});
