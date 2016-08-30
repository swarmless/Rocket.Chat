Template.HelpRequestContext.helpers({
	relevantParameters(){
		const instance = Template.instance();
		const environment = instance.data.environment;
		let relevantParameters = [];

		if (environment) {
			let value = '';
			let name = '';

			if (environment.SYSTEM) {
				let systemClient = environment.SYSTEM;
				if (environment.CLIENT) {
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

			// Transaction +  Title
			name = '';
			value = environment.TCODE || environment.PROGRAM;
			if (environment.TITLE) {
				value = value + ' - ' + environment.TITLE;
			}
			if (environment.TCODE) {
				name = 'transaction';
			} else {
				if (environment.PROGRAM) {
					name = 'program';
				}
			}

			if (name) {
				relevantParameters.push({
					name,
					value
				});
			}
		}

		return relevantParameters;
	}
});

Template.HelpRequestContext.onCreated(function () {
	this.helpRequest = new ReactiveVar({});
	this.autorun(() => {
		if (Template.currentData().rid && this.helpRequest.get()) {
			this.subscribe('p2phelp:helpRequests', Template.currentData().rid);
			this.helpRequest.set(
				RocketChat.models.HelpRequests.findOneByRoomId(Template.currentData())
			);
		}
	});
});
