Template.redlinkQuery.helpers({
	providerIconClass(){
		return "icon-link-ext";
	},

	results(){
		const instance = Template.instance();
		return instance.state.get('results');
	}
});

Template.redlinkQuery.events({});

Template.redlinkQuery.onCreated(function () {
	this.state = new ReactiveDict();
	this.state.setDefault({
		expanded: false,
		results: [],
		resultsFetched: false
	});

	const instance = this;

	// Asynchronously load the results.
	Meteor.defer(()=>{
		if (instance.data && instance.data.query && instance.data.roomId) {
			//issue a request to the redlink results-service and buffer the potential results in a reactive variable
			//which then can be forwarded to the results-template
			if(instance.data.query.inlineResultSupport) {
				Meteor.call('redlink:retrieveResults', instance.data.roomId, instance.data.templateIndex, instance.data.query.creator, (err, results)=> {
					instance.state.set('results', results);
					instance.state.set('resultsFetched', true); //consider the task done
				});
			}
		}
	})

});
