Meteor.methods({
	'updateKnowledgeProviderResult': function (modifiedKnowledgeProviderResult) {
		if (!modifiedKnowledgeProviderResult) {
			return;
		}

		const knowledgeAdapter = RocketChat.Livechat.getKnowledgeAdapter();

		if (knowledgeAdapter instanceof _dbs.RedlinkAdapterFactory.getInstance().constructor &&
			modifiedKnowledgeProviderResult.knowledgeProvider === 'redlink') {
			return knowledgeAdapter.onResultModified(modifiedKnowledgeProviderResult);
		}
	}
});
