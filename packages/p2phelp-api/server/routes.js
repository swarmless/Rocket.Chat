/**
 * Restful API endpoints for interaction with external systems
 */

// import {p2ph.P2pHelpApi} from './api';
// import {Restivus} from 'nimble:restivus';

const API = new Restivus({
	apiPath: 'p2p-help/',
	useDefaultAuth: true,
	prettyJson: true
});

API.addRoute('helpDiscussion', {
	/**
	 * Creates a room with an initial question and adds users who could possibly help
	 * @see packages\rocketchat-api\server\routes.coffee
	 * @return {*} statusCode 40x on error or  200 and information on the created room on success
	 */
	post() {
		const api = new p2ph.P2pHelpApi();
		try {
			p2ph.P2pHelpApi.validateHelpDiscussionPostRequest(this.bodyParams)
		} catch(err) {
			console.log('P2PHelp rejected malformed request:', JSON.stringify(this.request.body, " ", 2));
			return {
				statusCode: 500,
				message: 'Malformed request:' + JSON.stringify(err, " ", 2)
			}
		}

		// if (!this.request.headers['X-Auth-Token'])) { //todo: Check authorization - or is this done by Restivus once setting another parameter?
		// 	return {statusCode: 401, message: "Authentication failed."};
		// }

        const creationResult = api.processHelpDiscussionPostRequest(this.bodyParams);

		return {
			statusCode: 200,
			result: creationResult
		}
	}
});
