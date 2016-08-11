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

function keysToLowerCase(obj) {
	var keys = Object.keys(obj);
	var n = keys.length;
	while (n--) {
		var key = keys[n]; // "cache" it, for less lookups to the array
		if (key !== key.toLowerCase()) { // might already be in its lower case version
			obj[key.toLowerCase()] = obj[key]; // swap the value to a new lower case key
			delete obj[key]; // delete the old key
		}
	}
	return (obj);
}

function keysToUpperCase(obj) {
	var keys = Object.keys(obj);
	var n = keys.length;
	while (n--) {
		var key = keys[n]; // "cache" it, for less lookups to the array
		if (key !== key.toUpperCase()) { // might already be in its lower case version
			obj[key.toUpperCase()] = obj[key]; // swap the value to a new lower case key
			delete obj[key]; // delete the old key
		}
	}
	return (obj);
}


function preProcessBody(body) {

	// Extract properties from the load encapsulated in an additional REQUEST-object
	if (body.REQUEST) {
		let keys = Object.keys(body.REQUEST);
		let n = keys.length;
		while (n--) {
			let key = keys[n];
			body[key.toLowerCase()] = body.REQUEST[key];
			delete body.REQUEST[key];
		}

		delete body.REQUEST;
	}

	//dereference references
	for (let key in body){
		if(typeof body[key] === 'object'){
			for (let prop in body[key]){
				if( prop === "%ref") {
					let refId = body[key][prop].replace(/\#/, "");
					body[key] = body["%heap"][refId]["%val"];
				}
			}
		}
	}
	delete body["%heap"];
}

API.addRoute('helpDiscussion', {
	/**
	 * Creates a room with an initial question and adds users who could possibly help
	 * @see packages\rocketchat-api\server\routes.coffee
	 * @return {*} statusCode 40x on error or  200 and information on the created room on success
	 */
	post() {

		// keysToLowerCase(this.bodyParams);
		preProcessBody(this.bodyParams);

		const api = new p2ph.P2pHelpApi();
		try {
			p2ph.P2pHelpApi.validateHelpDiscussionPostRequest(this.bodyParams)
		} catch (err) {
			console.log('P2PHelp rejected malformed request:', JSON.stringify(this.request.body, " ", 2));
			throw new Meteor.Error('Malformed request:' + JSON.stringify(err, " ", 2));
		}

		// if (!this.request.headers['X-Auth-Token'])) { //todo: Check authorization - or is this done by Restivus once setting another parameter?
		// 	return {statusCode: 401, message: "Authentication failed."};
		// }

		const creationResult = api.processHelpDiscussionPostRequest(this.bodyParams);

		return {
			status_code: 200,
			result: creationResult,
			RESULT: keysToUpperCase(creationResult)
		}
	}
});
