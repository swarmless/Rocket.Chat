Template.livechatCurrentChats.helpers({
	closedLivechatRoom() {
		return ChatRoom.find({t: 'l', open: {$ne: true}}, {sort: {ts: -1}});
	},
	openLivechatRoom() {
		return ChatRoom.find({t: 'l', open: true}, {sort: {ts: -1}});
	},
	tableSettings: () => {
		return {
			fields: [
				{
					key: 'label',
					label: 'Name'
				},
				// TODO add crm data (vor-/nachname)
				{
					key: 'ts',
					label: 'Started_At',
					fn: (value, object) => {
						if (!value && object && object.ts) {
							value = object.ts;
						}
						return moment(value).format('L LT');
					}
				},
				{
					key: 'lm',
					label: 'Last_Message_At',
					fn: (value, object) => {
						if (!value && object && object.lm) {
							value = object.lm;
						}
						return moment(value).format('L LT');
					},
					sortOrder: 0,
					sortDirection: 'desc'
				},
				{
					key: 'rbInfo.source',
					label: 'Medium'
				},
				{
					key: 'topic',
					label: 'Topic'
				},
				{
					key: 'agents',
					label: 'Agents',
					fn :(value, object) => {
						let roomid = object._id;
						console.log(roomid);

						// TODO fix
						let uniqueUsers = _.uniq(
							ChatMessage.find({rid: roomid})
								.fetch()
								.map((entry) => entry.u.username)
							, true);

						return '';
					}
				}
			]
		}
	}
});

Template.livechatCurrentChats.events({
	'click .reactive-table tbody tr': function () {
		FlowRouter.go('live', {code: this.code});
	}
});

Template.livechatCurrentChats.onCreated(function () {
	this.subscribe('livechat:rooms');
	this.subscribe('rocketchat_message');
});
