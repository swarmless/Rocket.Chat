Template.redlinkQuery.helpers({
	providerIconClass(){
		return "icon-link-ext";
	}
});

Template.redlinkQuery.events({});

Template.redlinkQuery.onCreated(function () {
	this.state = new ReactiveDict();
	this.state.setDefault({
		expanded: false
	});
});
