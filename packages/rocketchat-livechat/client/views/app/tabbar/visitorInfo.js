Template.visitorInfo.helpers({
	user() {
		const user = Template.instance().user.get();
		if (user && user.userAgent) {
			var ua = new UAParser();
			ua.setUA(user.userAgent);

			user.os = ua.getOS().name + ' ' + ua.getOS().version;
			if (['Mac OS', 'iOS'].indexOf(ua.getOS().name) !== -1) {
				user.osIcon = 'icon-apple';
			} else {
				user.osIcon = 'icon-' + ua.getOS().name.toLowerCase();
			}
			user.browser = ua.getBrowser().name + ' ' + ua.getBrowser().version;
			user.browserIcon = 'icon-' + ua.getBrowser().name.toLowerCase();
		}

		return user;
	},

	room() {
		let room = ChatRoom.findOne({_id: this.rid});
		if (room.duration){
			let date = new Date(room.duration);
			room.formattedDuration = new _dbs.Duration(room.duration).toHHMMSS( );
		}
		return room;
	},

	joinTags() {
		return this.tags.join(', ');
	},

	customFields() {
		let fields = [];
		let livechatData = {};
		const user = Template.instance().user.get();
		if (user) {
			livechatData = _.extend(livechatData, user.livechatData);
		}

		let data = Template.currentData();
		if (data && data.rid) {
			let room = RocketChat.models.Rooms.findOne(data.rid);
			if (room) {
				livechatData = _.extend(livechatData, room.livechatData);
			}
		}

		if (!_.isEmpty(livechatData)) {
			for (let _id in livechatData) {
				if (livechatData.hasOwnProperty(_id)) {
					let customFields = Template.instance().customFields.get();
					if (customFields) {
						let field = _.findWhere(customFields, {_id: _id});
						if (field && field.visibility !== 'hidden') {
							fields.push({label: field.label, value: livechatData[_id]});
						}
					}
				}
			}
			return fields;
		}
	},

	createdAt() {
		if (!this.createdAt) {
			return '';
		}
		return moment(this.createdAt).format('L LTS');
	},

	lastLogin() {
		if (!this.lastLogin) {
			return '';
		}
		return moment(this.lastLogin).format('L LTS');
	},

	editing() {
		return Template.instance().editing.get();
	},

	editDetails() {
		const instance = Template.instance();
		const user = instance.user.get();
		return {
			visitorId: user ? user._id : null,
			roomId: this.rid,
			save() {
				instance.editing.set(false);
			},
			cancel() {
				instance.editing.set(false);
			}
		};
	},

	roomOpen() {
		const room = ChatRoom.findOne({_id: this.rid});

		return room.open;
	}
});

class ClosingDialog {
	constructor(room) {
		this.room = room;
	}

	display() {
		var self = this;
		return new Promise(function (resolve) {
			swal.withForm({
				title: t('Closing_chat'),
				formFields: [{
					id: 'comment',
					type: 'input',
					placeholder: t('Please_add_a_comment')
				}, {
					id: 'topic',
					value: self.room.topic,
					type: 'input',
					placeholder: t('Please_add_a_topic')
				}, {
					id: 'tags',
					value: self.room.tags ? self.room.tags.join(", ") : "",
					type: 'input',
					placeholder: t('Please_add_a_tag')
				}],
				showCancelButton: true,
				closeOnConfirm: false
			}, function () {
				let form = this.swalForm;

				for (let key in  form) {
					if (!form.hasOwnProperty(key)) {
						continue;
					}
					if (!form[key]) {
						swal.showInputError(t('Please_add_a_' + key + '_to_close_the_room'));
						$('.sa-input-error').hide();
						return false;
					}
				}
				resolve(form);
			});
		}).then((r) => {
				$('.sa-input-error').show();
				return r;
			});
	}
}

Template.visitorInfo.events({
	'click .edit-livechat': function(event, instance) {
		event.preventDefault();

		instance.editing.set(true);
	},
	'click .close-livechat': function (event) {
		event.preventDefault();

		var room = RocketChat.models.Rooms.findOne({_id: this.rid});
		new ClosingDialog(room).display().then(function(form) {
			let closingProps = form;
			closingProps.tags = form.tags.split(',');

			Meteor.call('livechat:closeRoom', room._id, closingProps, function (error/*, result*/) {
				if (error) {
					return handleError(error);
				}
				swal({
					title: t('Chat_closed'),
					text: t('Chat_closed_successfully'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false
				});
			});
		});
	}
});

Template.visitorInfo.onCreated(function () {
	this.visitorId = new ReactiveVar(null);
	this.customFields = new ReactiveVar([]);
	this.editing = new ReactiveVar(false);
	this.user = new ReactiveVar();

	Meteor.call('livechat:getCustomFields', (err, customFields) => {
		if (customFields) {
			this.customFields.set(customFields);
		}
	});

	var currentData = Template.currentData();

	if (currentData && currentData.rid) {
		this.autorun(() => {
			let room = ChatRoom.findOne(currentData.rid);
			if (room && room.v && room.v._id) {
				this.visitorId.set(room.v._id);
			} else {
				this.visitorId.set();
			}
		});

		this.subscribe('livechat:visitorInfo', {rid: currentData.rid});
	}

	this.autorun(() => {
		this.user.set(Meteor.users.findOne({'_id': this.visitorId.get()}));
	});
});
