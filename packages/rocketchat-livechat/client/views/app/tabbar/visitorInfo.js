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
		const padZero = function(i){
			return ( i < 10 ? "0" + i : i );
		}
		if (room.duration){
			let date = new Date(room.duration);
			room.formattedDuration = Math.floor(room.duration/3600000) + ':' + padZero(date.getMinutes()) + ':' + padZero(date.getSeconds());
									//new Duration(room.duration).toHHMMSS( ); don't get Duration imported though
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
	constructor(room, onValidatedOk) {
		this.room = room;
		this.action = undefined;
		this.onValidatedOk = onValidatedOk;
	}

	getAction() {
		return this.action;
	}

	display() {
		var self = this;
		swal.withFormAsync({
			title: t('Closing_chat'),
			formFields: [
				{
					id: 'comment',
					type: 'input',
					placeholder: t('Please_add_a_comment')
				},
				{
					id: 'topic',
					value: this.room.topic,
					type: 'input',
					placeholder: t('Please_add_a_topic')
				},
				{
					id: 'tags',
					value: this.room.tags ? this.room.tags.join(", ") : "",
					type: 'input',
					placeholder: t('Please_add_a_tag')
				}
			],

			showCancelButton: true,
			closeOnConfirm: false
		}).then(function (context) {
			if (context._isConfirm) {
				let errorMessage = '';
				if (!context.swalForm.comment || s.trim(context.swalForm.comment) === '') {
					errorMessage = t('Please_add_a_comment_to_close_the_room');
				}

				if (!errorMessage && (!context.swalForm.topic || s.trim(context.swalForm.topic) === '')) {
					errorMessage = t('Please_add_a_topic_to_close_the_room');
				}

				if (!errorMessage && (!context.swalForm.tags || s.trim(context.swalForm.tags) === '')) {
					errorMessage = t('Please_add_a_tag_to_close_the_room');
				}

				if (errorMessage) {
					self.action = undefined;
					//somehow propagate the erroneous form elements to the swal. Maybe. In future.
					self.display();
				} else {
					self.action = 'ok';
					self.onValidatedOk({
						comment: context.swalForm.comment,
						topic: context.swalForm.topic,
						tags: context.swalForm.tags.split(",") //trimming is done somewhere internally
					});
				}
			}
			else self.action = 'cancel';
		});
	}
}

Template.visitorInfo.events({
	'click .edit-livechat'(event, instance) {
		event.preventDefault();

		instance.editing.set(true);
	},
	'click .close-livechat'(event) {
		event.preventDefault();

		const room = RocketChat.models.Rooms.findOne({_id: this.rid});
		const closingDialog = new ClosingDialog(room, function (closingProps) {

			Meteor.call('livechat:closeRoom', this.room._id, closingProps, function (error/*, result*/) {
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

				$('.input-message').attr('disabled', true);
			});
		});

		closingDialog.display();
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
