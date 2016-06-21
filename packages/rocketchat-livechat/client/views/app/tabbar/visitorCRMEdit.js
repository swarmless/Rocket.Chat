Template.visitorCRMEdit.helpers({
	contact() {
		return Template.instance().contact.get();
	}
});

Template.visitorCRMEdit.onCreated(function() {
	this.contact = new ReactiveVar(Template.currentData().contact);
});

Template.visitorCRMEdit.events({
	'submit form'(event, instance) {
		event.preventDefault();

		contact.lastname = event.currentTarget.elements['lastname'].value;
		contact.email = event.currentTarget.elements['email'].value;
		contact.phone = event.currentTarget.elements['phone'].value;
		contact.mobile = event.currentTarget.elements['phone'].value;

		this.contact.set(contact);
	},

	'click .save'() {
		if (this.contact){
			this.save(this.contact);
		}
	},

	'click .cancel'() {
		this.cancel();
	}
});
