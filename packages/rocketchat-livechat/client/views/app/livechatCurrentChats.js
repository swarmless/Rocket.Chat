Template.livechatCurrentChats.helpers({
/*	openChats() {
		return new Tabular.Table({
			name: "openChats",
			collection: ChatRoom,
			columns: [
				{data: "label", title: "Name"},
				{data: "startedAt()", title: "Started_At"},
				{data: "lastMessage()", title: "Last_Message_At"},
				{data: "medium()", title: "Medium"},
				{data: "topic", title: "Topic"},
				{data: "agents()", title: "Agents"}
			]
		});
	},*/
	closedLivechatRoom() {
		return ChatRoom.find({ t: 'l', open: {$ne: true} }, { sort: { ts: -1 } });
	},
	openLivechatRoom() {
		return ChatRoom.find({ t: 'l', open: true }, { sort: { ts: -1 } });
	},
	startedAt() {
		return moment(this.ts).format('L LT');
	},
	lastMessage() {
		return moment(this.lm).format('L LT');
	},
	medium() {
		return this.rbInfo? this.rbInfo.source : '';
	},
	agents() {
		return this.servedBy? this.servedBy.username : '';
	}
});

Template.livechatCurrentChats.events({
	'click .row-link': function() {
		FlowRouter.go('live', { code: this.code });
	}
});

Template.livechatCurrentChats.onCreated(function() {
	this.subscribe('livechat:rooms');
});
