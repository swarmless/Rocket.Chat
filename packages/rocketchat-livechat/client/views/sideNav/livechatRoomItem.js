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
		return this.name;
	},
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
	let lastDate = this.data.answered ?this.data.lastActivity :  this.data.lastCustomerActivity;
	if (!_.isDate(lastDate)) {
		lastDate = new Date();
	}
	this.timerId = Meteor.setInterval(() => {
		self.lastActivityTimer.set(new _dbs.Duration(new Date() - lastDate).toMM());
	}, 1000);
});

Template.livechatRoomItem.onCreated(function () {
	this.lastActivityTimer = new ReactiveVar(0);
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
