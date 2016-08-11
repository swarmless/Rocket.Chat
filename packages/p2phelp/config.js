Meteor.startup(()=>{
	RocketChat.settings.addGroup('Peer2PeerHelp');

	RocketChat.settings.add('P2pHelp_Room_Count', 1, {
		group: 'Peer2PeerHelp',
		i18nLabel: 'P2pHelp_room_count'
	});

	RocketChat.settings.add('P2pHelp_Bot_Username', "", {
		group: 'Peer2PeerHelp',
		i18nLabel: 'P2pHelp_Bot_Username'
	});

	RocketChat.settings.add('P2pHelp_Bot_Automated_Response_Threshold', 50, {
		group: 'Peer2PeerHelp',
		i18nLabel: 'P2pHelp_Bot_Automated_Response_Threshold'
	});
});
