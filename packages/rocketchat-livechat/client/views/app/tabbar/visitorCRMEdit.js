Template.visitorCRMEdit.helpers({
	visitor() {
		return Template.instance().visitor.get();
	},

	contact() {
		return Template.instance().contact.get();
	},

	email() {
		const visitor = Template.instance().visitor.get();
		if (visitor.emails && visitor.emails.length > 0) {
			return visitor.emails[0].address;
		}
	},

	phone() {
		const visitor = Template.instance().visitor.get();
		if (visitor.phone && visitor.phone.length > 0) {
			return visitor.phone[0].phoneNumber;
		}
	}
});

Template.visitorCRMEdit.onCreated(function() {
	this.visitor = new ReactiveVar();
	this.contact = new ReactiveVar(Template.currentData().contact);

	this.autorun(() => {
		this.visitor.set(Meteor.users.findOne({ _id: Template.currentData().visitorId }));
	});
});

Template.visitorCRMEdit.events({
	'submit form'(event, instance) {
		console.log('this ->', this);
		event.preventDefault();
		let contact = { _id: instance.visitor.get()._id };
		let roomData = { _id: instance.room.get()._id };

		contact.name = event.currentTarget.elements['name'].value;
		contact.email = event.currentTarget.elements['email'].value;
		contact.phone = event.currentTarget.elements['phone'].value;
		contact.phone = event.currentTarget.elements['phone'].value;

		Meteor.call('livechat:saveLivechatInfo', contact, roomData, (err) => {
			if (err) {
				toastr.error(t(err.error));
			} else {
				toastr.success(t('Saved'));
			}
		});
	},

	'click .save'() {
		this.save();
	},

	'click .cancel'() {
		this.cancel();
	}
});
