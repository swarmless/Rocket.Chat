Template.visitorCRM.helpers({
	crmInfo() {
		return {
			contact: Template.instance().crmContact.get(),
			count: Template.instance().crmContactCount.get(),
			error: Template.instance().crmError.get()
		}
	}
});

Template.visitorCRM.events({});

Template.visitorCRM.onCreated(function () {
	this.visitorId = new ReactiveVar(null);
	this.crmContact = new ReactiveVar({});
	this.crmContactCount = new ReactiveVar(0);
	this.crmError = new ReactiveVar({});
	this.user = new ReactiveVar({});

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
					if (err) {
						this.crmContact.set({});
						this.crmContactCount.set(-1);
						this.crmError.set(err);
					}
					else {
						this.crmContactCount.set(contacts.length);
						this.crmError.set({});
						if (contacts) {
							this.crmContact.set(contacts[0]);
						}
					}
				});
			}
		}
	})
});
