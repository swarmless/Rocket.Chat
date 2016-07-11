Template.redlinkQueries.helpers({
	queryContext(query, queryIndex){
		const instance = Template.instance();
		return {
			query: query,
			maxConfidence: Math.max(...instance.data.queries.map((query) => query.confidence)),
			roomId: instance.data.roomId,
			templateIndex: instance.data.templateIndex,
			queryIndex: queryIndex
		}
	}
});

Template.redlinkQueries.events({

});
