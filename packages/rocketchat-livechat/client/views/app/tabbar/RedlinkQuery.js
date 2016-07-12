Template.redlinkQuery.helpers({
	providerIconClass(){
		return "icon-link-ext";
	},

	visibleResult(){
		const instance = Template.instance();
		const results = instance.state.get('results');
		if(results) return results[instance.state.get('visibleResultIndex')];
	},

	resultsCount(){
		const instance = Template.instance();
		const results = instance.state.get('results');
		if(results) return results.length;
	},

	visibleResultNumer(){
		const instance = Template.instance();
		const visibleResultIndex = instance.state.get('visibleResultIndex');
		return visibleResultIndex + 1;
	},

	classExpanded(){
		const instance = Template.instance();
		return instance.state.get('resultsExpanded') ? 'collapsed' : 'expanded';
	}
});

Template.redlinkQuery.events({
	'click .js-toggle-results-expanded': function(event, instance){
		const current = instance.state.get('resultsExpanded');
		instance.state.set('resultsExpanded', !current);
	},

	'click .js-next-result': function(event, instance){
		const visibleResultIndex = instance.state.get('visibleResultIndex');
		const results = instance.state.get('results');
		if(visibleResultIndex < results.length - 1){
			instance.state.set('visibleResultIndex', visibleResultIndex + 1);
		} else {
			instance.state.set('visibleResultIndex', 0);
		}
	},

	'click .js-previous-result': function(event, instance){
		const visibleResultIndex = instance.state.get('visibleResultIndex');
		const results = instance.state.get('results');
		if(visibleResultIndex > 0 ){
			instance.state.set('visibleResultIndex', visibleResultIndex - 1);
		} else {
			instance.state.set('visibleResultIndex', results.length - 1);
		}
	}
});

Template.redlinkQuery.onCreated(function () {
	const instance = this;

	this.state = new ReactiveDict();
	this.state.setDefault({
		expanded: instance.data.query.inlineResultSupport && ( instance.data.maxConfidence === instance.data.query.confidence ),
		results: [],
		resultsFetched: false, // in order to be able to determine an empty result list from not having tried to fetch results
		visibleResultIndex: 0
	});

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
