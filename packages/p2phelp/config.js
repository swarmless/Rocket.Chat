Meteor.startup(()=>{
	RocketChat.settings.addGroup('Peer2PeerHelp');

	RocketChat.settings.add('P2pHelp_Room_Count', 1, {
		type: 'int',
		group: 'Peer2PeerHelp',
		i18nLabel: 'P2pHelp_room_count'
	});

	RocketChat.settings.add('P2pHelp_Bot_Username', 1, {
		type: 'string',
		group: 'Peer2PeerHelp',
		i18nLabel: 'P2pHelp_Bot_Username'
	});
});
