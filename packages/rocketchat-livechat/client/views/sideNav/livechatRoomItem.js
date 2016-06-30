/**
 * @see packages\rocketchat-ui-sidenav\side-nav\chatRoomItem.coffee
 */
Template.livechatRoomItem.helpers({
	alert() {
		if (FlowRouter.getParam('_id') !== this.rid || !document.hasFocus()) {
			return this.alert;
		}
	},
	sinceLastActivity() {
		return Template.instance().lastActivityTimer.get();
	},
	userStatus() {
		const stat = Session.get('user_' + this.name + '_status');
		return 'status-' + stat ? stat : 'offline';
	},
	name() {
		return Template.instance().visitorName.get();
	},
	isLoadingCrmName() {
		return Template.instance().isLoadingCrmName.get();
	}
	,
	roomIcon() {
		return RocketChat.roomTypes.getIcon(this.t);
	},
	active() {
		if (Session.get('openedRoom') === this.rid) {
			return 'active';
		}
	},
	route() {
		return RocketChat.roomTypes.getRouteLink(this.t, this);
	}
});

Template.livechatRoomItem.onRendered(function () {
	const param = FlowRouter.getParam('_id');
	if (!(param && param === this.data.id) && !(this.data.ls && this.data.alert === true)) {
		KonchatNotification.newRoom(this.data.rid);
	}

	const self = this;
	actualizeTimer(self);

	this.timerId = Meteor.setInterval(() => {
		actualizeTimer(self);
	}, 1000);
});

function actualizeTimer(instance) {
	let lastDate = instance.data.answered ? instance.data.lastActivity : instance.data.lastCustomerActivity;

	if (!_.isDate(lastDate)) {
		lastDate = new Date();
	}

	instance.lastActivityTimer.set(new _dbs.Duration(new Date() - lastDate).toMM());
}

Template.livechatRoomItem.onCreated(function () {
	this.lastActivityTimer = new ReactiveVar(0);
	this.isLoadingCrmName = new ReactiveVar(true);

	const self = this;
	const currentData = self.data;

	this.visitorName = new ReactiveVar(currentData.name);

	if (currentData && currentData.rid) {
		this.subscribe('livechat:visitorInfo', {rid: currentData.rid});
		this.subscribe('livechat:visitorCrm', {rid: currentData.rid});
		this.subscribe('livechat:rooms', {rid: currentData.rid});
	}

	this.autorun(()=> {
		if (Template.instance().subscriptionsReady()) {
			let room = ChatRoom.findOne(currentData.rid);

			if (room && room.v && room.v._id) {
				let visitorId = room.v._id;

				if (visitorId) {
					let user = Meteor.users.findOne({'_id': visitorId});

					if (user && user.crmContactId) {
						Meteor.call('livechat:getCrmContact', user.crmContactId, (err, contact) => {
							self.isLoadingCrmName.set(false);

							if (!err && contact) {
								let crmName =
									(contact.firstname ? contact.firstname : '') +
									(contact.firstname && contact.lastname ? ', ' : '') +
									(contact.lastname ? contact.lastname : '');

								if (crmName && crmName.length > 0) {
									self.visitorName.set(crmName);
								}
							}
						});
					}
					else {
						self.isLoadingCrmName.set(false);
					}
				}
			}
		}
	})
});

Template.livechatRoomItem.onDestroyed(function () {
	Meteor.clearInterval(this.timerId);
});

Template.livechatRoomItem.events({
	'click .open-room': function (e) {
		menu.close();
	},
	'click .hide-room': function (e) {
		e.stopPropagation();
		e.preventDefault();

		const rid = this.rid;
		swal({
			title: t('Are_you_sure'),
			text: t('Hide_Private_Warning', this.name),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes_hide_it'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: true,
			html: false
		}, () => {
			if (Session.get('openedRoom') === rid) {
				FlowRouter.go('home');
			}
			Meteor.call('hideRoom', rid, (err) => {
				if (err) {
					handleError(err);
				}
			});
		});
	}
});
