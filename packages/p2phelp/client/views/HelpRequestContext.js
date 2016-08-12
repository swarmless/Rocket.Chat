Template.HelpRequestContext.helpers({
	relevantParameters(){
		const instance = Template.instance();
		const environment = instance.data.environment;
		let relevantParameters = [];

		if(environment) {

			if (environment.SYSTEM) {
				let systemClient = environment.SYSTEM;
				if(environment.CLIENT){
					systemClient = systemClient + "(" + environment.CLIENT + ")";
				}
				relevantParameters.push({
					name: 'system',
					value: systemClient
				});
			}

			if (environment.RELEASE) {
				relevantParameters.push({
					name: 'release',
					value: environment.RELEASE
				});
			}

			if (environment.TCODE) {
				relevantParameters.push({
					name: 'transaction',
					value: environment.TCODE
				});
			} else {
				if (environment.PROGRAM) {
					relevantParameters.push({
						name: 'program',
						value: environment.PROGRAM
					});
				}
			}

			if (environment.TITLE) {
				relevantParameters.push({
					name: 'gui_title',
					value: environment.TITLE
				});
			}
		}

		return relevantParameters;
	}
});

Template.HelpRequestContext.onCreated(function(){
	this.helpRequest = new ReactiveVar({});
	this.autorun(() => {
		this.subscribe('p2phelp:helpRequests', Template.currentData().rid);
		this.helpRequest.set(
			RocketChat.models.HelpRequests.findOneByRoomId(Template.currentData())
		);
	});
});
