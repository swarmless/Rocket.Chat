/**
 * Encapsulates communication to smsGateway and LotusNotes
 * Should not be used as singleton for verifyAuthentification. (Update of user settings). Don't make the methods static
 * @author jakobpannier
 */
class LotusMailCommunicationService {

	constructor() {
		this.defaultSubject = RocketChat.settings.get('SMS_Out_Reisebuddy_defaultSubject');

		this.lotusEndpoint = RocketChat.settings.get('SMS_Out_Reisebuddy_lotusEndpoint');
		this.outgoingAuthHeader = 'Basic ' + new Buffer(RocketChat.settings.get('SMS_Out_Reisebuddy_username') + ':' +
				RocketChat.settings.get('SMS_Out_Reisebuddy_password')).toString('base64');
		this.baseAddress = RocketChat.settings.get('SMS_Out_Reisebuddy_baseAddress');

		this.basicHeader = 'Basic ' + new Buffer(RocketChat.settings.get('Mail_In_Reisebuddy_username') + ':' +
				RocketChat.settings.get('Mail_In_Reisebuddy_password')).toString('base64');
	}

	static SERVICE_NAME() {
		return 'lotusMail';
	}

	getServiceName() {
		return LotusMailCommunicationService.SERVICE_NAME();
	}

	/**
	 * @param mailAddr email
	 * @return {string} value "(sms-)mail" if it is a regular mail or an sms
	 */
	getRoomType(mailAddr) {
		return mailAddr && mailAddr.endsWith("sms.db.de") ? 'sms-mail' : 'mail';
	}

	/**
	 * @param authHeader "Basic abc..."
	 * @return Boolean if ok
	 */
	verifyAuthentification(authHeader) {
		return authHeader === this.basicHeader;
	}

	/**
	 * Converts and verifies payload to message stub
	 * @return {{from: {}, body: {}}}
	 * @throws Match.Error id
	 */
	parse({sender, body, subject} = {}) {
		check(sender, String);
		check(body, String);
		return {
			from: sender,
			body: _.filter([subject, body], (e) => !!e).join(': ') // filter with boolean existence check
		};
	}

	/**
	 * Merge the request infos into a the user to be created.
	 * @param stub userStub
	 * @param requestBody JSON
	 * @return {*} stub
	 */
	extendNewUser(stub, requestBody) {
		stub.emails = {
			address: requestBody.sender
		};
		return stub;
	}

	/**
	 * Sends a mail to the given parameters asynchronously. Log on error.
	 * @param sender optional - default: Mail_Reisebuddy_defaultSSender
	 * @param to
	 * @param message
	 * @param subject optional - default: Mail_Reisebuddy_defaultSubject
	 * @throws Match.Error if params are invalid
	 */
	send({to, message, subject} = {}) {
		check(arguments[0], {
			to: String,
			message: String,
			subject: Match.Optional(String)
		});
		const self = this;

		var regEx = /^\+?\d+@sms.db.de$/;
		if (to.match(regEx)) {
			to = to.replace('@sms.db.de', '');
			SystemLogger.debug("send sms to " + to);

			let requestBody =
			{
				to: to + self.baseAddress,
				subject: subject || self.defaultSubject,
				body: message || ''
			};

			let options = {
				"headers": {
					"Authorization": self.outgoingAuthHeader,
					"Content-Type": "application/json"
				},
				"data": requestBody
			};

			HTTP.post(self.lotusEndpoint, options,
				(error, result) => {
					if (error) {
						SystemLogger.error("unable to send mail to " + to + " -- " + error);
					} else if (result) {
						SystemLogger.debug("mail successfully send to " + to, " with result: \n" + result);
					}
				});
		}
		SystemLogger.error("unable to send mail to " + to + " --  Couldn't extract phone number.");
	}
}

/**
 * ServiceProvider for reisebuddyCommunicationApis
 * @param serviceName
 * @return {*}
 */
_dbs.getCommunicationService = function (serviceName) {
	switch (serviceName) {
		case LotusMailCommunicationService.SERVICE_NAME():
			return new LotusMailCommunicationService();
	}
	return null;
};
