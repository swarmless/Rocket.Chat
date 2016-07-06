Template.redlinkQueries.helpers({
	maxConfidence(){
		return Max.max(Template.currentData().map((query) => query.confidence));
	}
});

Template.redlinkQueries.events({

});
