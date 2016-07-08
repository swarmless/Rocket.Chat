Template.redlinkQueries.helpers({
	queryContext(query){
		const instance = Template.instance();
		return {
			query: query,
			maxConfidence: Math.max(...instance.data.queries.map((query) => query.confidence)),
			roomId: instance.data.roomId,
			templateIndex: instance.data.templateIndex
		}
	}
});

Template.redlinkQueries.events({

});
