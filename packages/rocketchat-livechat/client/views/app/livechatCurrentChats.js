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
					label: TAPi18n.__('Customer_Name'),
					fn: (value, object) => {
						/*
						 TODO fetch customer name from crm
						 */

						return value;
					}
				},
				{
					key: 'ts',
					label: TAPi18n.__('Started_At'),
					fn: (value, object) => {
						if (!value && object && object.ts) {
							value = object.ts;
						}
						return moment(value).format('L LT');
					}
				},
				{
					key: 'lm',
					label: TAPi18n.__('Last_Message'),
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
					label: TAPi18n.__('Used_Medium')
				},
				{
					key: 'topic',
					label: TAPi18n.__('Topic')
				},
				{
					key: 'servedBy.username',
					label: TAPi18n.__('Agent_Names'),
					fn: (value, object) => {
						/*
							TODO get _all_ agents
							let roomId = object._id;
						 */

						if(object.servedBy && object.servedBy.username) {
							return object.servedBy.username;
						}
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
});
