Template.livechat.helpers({
	isActive() {
		if (ChatSubscription.findOne({
			t: 'l',
			f: {
				$ne: true
			},
			open: true,
			rid: Session.get('openedRoom')
		}, {
			fields: {
				_id: 1
			}
		}) != null) {
			return 'active';
		}
	},
	rooms() {
		return ChatSubscription.find({
			t: 'l',
			open: true,
			answered: true
		}, {
			sort: {'lastActivity': 'asc'}
		});
	},
	roomsUnread() {
		return ChatSubscription.find({
			t: 'l',
			open: true,
			answered: false
		}, {
			sort: {'lastActivity': 'desc'}
		});
	},
	available() {
		const user = Meteor.user();
		return {
			status: user.statusLivechat,
			icon: user.statusLivechat === 'available' ? 'icon-toggle-on' : 'icon-toggle-off',
			hint: user.statusLivechat === 'available' ? t('Available') : t('Not_Available')
		};
	},
	livechatAvailable() {
		const user = Meteor.user();

		if (user) {
			return user.statusLivechat;
		}
	}
});

Template.livechat.events({
	'click .livechat-status'() {
		Meteor.call('livechat:changeLivechatStatus', (err /*, results*/) => {
			if (err) {
				return handleError(err);
			}
		});
	}
});
