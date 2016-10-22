Template.HelpRequestContext.helpers({
	/**
	 * Create a set of name-value-pairs which are being used to visualize the context from which the question has been asked
	 * @returns {Array}
	 */
	relevantParameters(){
		const instance = Template.instance();
		const environment = instance.data.environment;
		let relevantParameters = [];

		if (environment) {
			let value = '';
			let name = '';

			// Transaction +  Title
			name = '';
			value = environment.TCODE || environment.PROGRAM || environment.WD_APPLICATION;
			if (environment.TITLE) {
				value = value + ' - ' + environment.TITLE;
			}
			if (environment.TCODE) {
				name = 'transaction';
			} else {
				if (environment.PROGRAM) {
					name = 'program';
				} else {
					if (environment.WD_APPLICATION) {
						name = 'application'
					}
				}

			}

			if (name) {
				relevantParameters.push({
					name,
					value
				});
			}

			//System information
			if (environment.SYSTEM) {
				let systemClient = environment.SYSTEM;
				if (environment.CLIENT) {
					systemClient = systemClient + "(" + environment.CLIENT + ")";
				}

				if (environment.RELEASE) {
					systemClient = systemClient + ', ' + t('release') + ': ' + environment.RELEASE;
				}

				relevantParameters.push({
					name: 'system',
					value: systemClient
				})
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
