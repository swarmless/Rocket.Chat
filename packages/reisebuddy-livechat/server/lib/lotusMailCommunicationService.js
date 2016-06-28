/**
 * Encapsulates communication to smsGateway and LotusNotes
 * Should not be used as singleton. (Update of user settings). Don't make the methods static
 * @author jakobpannier
 */
class LotusMailCommunicationService {

	constructor() {
		this.defaultSender = RocketChat.settings.get('Mail_Reisebuddy_defaultSender');
		this.defaultSubject = RocketChat.settings.get('Mail_Reisebuddy_defaultSubject');

		this.basicHeader = 'Basic ' + new Buffer(RocketChat.settings.get('Mail_Reisebuddy_username') + ':' +
												 RocketChat.settings.get('Mail_Reisebuddy_authToken')).toString('base64');
	}

	static SERVICE_NAME() {
		return 'lotusMail';
	}

	getCombinedMessage(subject, body){
		if(subject && !body){
			return subject;
		}

		if(!subject && body){
			return body;
		}

		if(subject && body){
			return subject + ": " + body;
		}
	}

	getServiceName() {
		return LotusMailCommunicationService.SERVICE_NAME();
	}

	/**
	 * @param mailAddr email
	 * @return {string} value "(sms-)mail" if it is a regular mail or an sms
	 */
	getRoomType(mailAddr) {
		return mailAddr.endsWith("sms.db.de") ? 'sms-mail' : 'mail';
	}

	/**
	 * @param authHeader "Basic abc..."
	 * @return Boolean if ok
	 */
	verifyAuthentification(authHeader) {
		return authHeader === this.basicHeader;
	}

	/**
	 * Converts and verifies payload
	 * @return {{from: {}, body: {}, subject: {}}}
	 * @throws Match.Error id
	 */
	parse({sender, body, subject} = {}) {
		check(sender, String);
		check(body, String);
		return {
			from: sender,
			body: body,
			subject: subject

		};
	}

	/**
	 * Sends a mail to the given parameters asynchronously. Log on error.
	 * @param sender optional - default: Mail_Reisebuddy_defaultSSender
	 * @param to
	 * @param message
	 * @param subject optional - default: Mail_Reisebuddy_defaultSubject
	 * @throws Match.Error if params are invalid
	 */
	send({sender, to, message, subject} = {}) {
		check(arguments[0], {
			to: String,
			sender: Match.Optional(String),
			message: String,
			subject: Match.Optional(String)
		});
		const self = this;
		Meteor.defer(() => {
			const logId = Random.id();
			SystemLogger.debug("send mail to " + to + " --- logId: " + logId);
			try {
				Email.send({
					from:    sender || self.defaultSender,
					to: to,
					subject: subject || self.defaultSubject,
					text:    message || ''
				});
				SystemLogger.debug("mail successfully send " + to + " --- logId: " + logId);
			} catch (e) {
				SystemLogger.error("unable to send mail to " + to + " -- " + e);
			}
		});
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
