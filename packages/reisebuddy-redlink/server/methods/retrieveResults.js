Meteor.methods({
	'redlink:retrieveResults'(roomId, templateIndex, creator){
		const adapter = _dbs.RedlinkAdapterFactory.getInstance();
		return adapter.getQueryResults(roomId, templateIndex, creator);
	}
});
