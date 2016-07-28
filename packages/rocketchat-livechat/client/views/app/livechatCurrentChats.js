Template.livechatCurrentChats.helpers({
	closedLivechatRoom() {
		return LivechatRoomsStats.find({t: 'l', open: {$ne: true}}, {sort: {ts: -1}});
	},
	openLivechatRoom() {
		return LivechatRoomsStats.find({t: 'l', open: true}, {sort: {ts: -1}});
	},
	tableSettings: () => {
		return {
			fields: [
				{
					key: 'label',
					label: TAPi18n.__('Customer_Name')
				},
				{
					key: 'ts',
					label: TAPi18n.__('Started_At')
				},
				{
					key: 'lm',
					label: TAPi18n.__('Last_Message'),
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
					key: 'involvedAgents',
					label: TAPi18n.__('Agent_Names')
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
	i18n.setLanguage(TAPi18n.getLanguage());
	this.subscribe('livechat:room_statistics');
});
