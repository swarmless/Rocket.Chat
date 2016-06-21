Template.visitorCRM.helpers({
	crmInfo() {
		return {
			contact: Template.instance().crmContact.get(),
			count: Template.instance().crmContactCount.get(),
			error: Template.instance().crmError.get()
		}
	},
	isLoading(){
		return Template.instance().isLoading.get();
	},
	isEditing(){
		return Template.instance().isEditing.get();
	},
	editDetails(){
		//Helper object propagated to editing-template in order to operate on the same instance with respect to "isEditing"
		const instance = Template.instance();
		const contact = instance.crmContact.get();
		return {
			contact,
			save(contact) {
				instance.isEditing.set(false);
				Meteor.call('livechat:updateCrmContact', contact);
			},
			cancel() {
				instance.isEditing.set(false);
			}
		};
	}
});

Template.visitorCRM.events({
	'click .edit-contact': function(event, instance){
		instance.isEditing.set(true);
	},

	'click .create-contact': function(event, instance){
		Meteor.call('livechat:createCrmContact', this.user);
	}
});

Template.visitorCRM.onCreated(function () {
	this.visitorId = new ReactiveVar(null);
	this.crmContact = new ReactiveVar({});
	this.crmContactCount = new ReactiveVar(0);
	this.crmError = new ReactiveVar({});
	this.user = new ReactiveVar({});
	this.isLoading = new ReactiveVar(true);
	this.isEditing = new ReactiveVar(false);

	const currentData = Template.currentData();

	if (currentData && currentData.rid) {
		this.autorun(() => {
			const room = ChatRoom.findOne(currentData.rid);
			if (room && room.v && room.v._id) {
				this.visitorId.set(room.v._id);
			} else {
				this.crmContact.set({});
				this.visitorId.set();
			}
		});

		this.subscribe('livechat:visitorInfo', {rid: currentData.rid});
		this.subscribe('livechat:visitorCrm', {rid: currentData.rid});
	}

	this.autorun(()=> {
		if (this.visitorId) {
			this.user.set(Meteor.users.findOne({'_id': this.visitorId.get()})); //could reside within an autorun to capture changes in parallel sessions

			if (this.user.get()) {
				Meteor.call('livechat:getCrmContact', this.user.get().id, (err, contacts) => {
					this.isLoading.set(false);
					if (err) {
						this.crmContact.set({});
						this.crmContactCount.set(-1);
						this.crmError.set(err);
					}
					else {
						this.crmContactCount.set(contacts.length);
						this.crmError.set(false);
						if (contacts) {
							this.crmContact.set(contacts[0]);
						}
					}
				});
			}
		}
	})
});
