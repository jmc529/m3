import { CLIENT_SECRET } from "../../secret.js";
let CLIENT_ID = "712b025e116445769d4843ae4a2e60eb";

/** VARIABLES **/
const REDIRECT_URL = browser.identity.getRedirectURL();
const STORED_STATE = generateRandomString(16);
const SCOPE = "user-modify-playback-state user-read-recently-played user-read-currently-playing user-read-playback-state"
	+ " streaming user-read-birthdate user-read-email user-read-private user-library-read user-library-modify";


/** PRIVATE FUNCTIONS **/
/** HELPER FUNCTIONS **/
/**	
 * Takes a response from fetch and parse through it's json for relevant information.
 * @param  {Object} response The length of the string
 * @return {Array} if successful [access token, refresh token] else an error
 */
function checkResponse(response) {
	return new Promise((resolve, reject) => {
		if (response.status !== 200) {
			reject("Token validation error");
		}
		response.json().then((json) => {
			if (json.token_type === "Bearer") {
				resolve([json.access_token, json.refresh_token]);
			} else {
				reject("Token validation error");
			}
		});
	});
}

/**
 * Extract information on the passed URI, for spotify OAuth2 response
 * @param {string} uri The string to parse through
 * @return {Array} In this order: code info, state info, error info
 */
function extractOAuthInfo(uri) {
  let m = uri.match(/[#?](.*)/);
  if (!m || m.length < 1)
	return null;
  let params = new URLSearchParams(m[1].split("#")[0]);
  return [params.get("code"), params.get("state"), params.get("error")];
}

/**	
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
function generateRandomString(length) {
	let text = '';
	const POSSIBLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for (var i = 0; i < length; i++) {
		text += POSSIBLE.charAt(Math.floor(Math.random() * POSSIBLE.length));
	}
	return text;
}


/** MAIN FUNCTIONS **/
/**
 * Sends a request to spotify for authorization.
 * @return {string} If promise is fullfilled returns URI with auth info
 */
function authorize() {
	let AUTH_URL = `https://accounts.spotify.com/authorize?` +
		`&response_type=code` +
		`&client_id=${CLIENT_ID}` +
		`&redirect_uri=${REDIRECT_URL}` +
		`&scope=${SCOPE}` +
		`&state=${STORED_STATE}`;

	return browser.identity.launchWebAuthFlow({
		interactive: true,
		url: AUTH_URL
	});
}

/**
 * Sends a request to the spotify API for a new access token.
 * @param {string} refreshToken Should be the refresh token from the validate function
 * @return {Promise} If fullfilled holds the access token and (maybe?) refresh token
 */
function refreshAccessToken(refreshToken) {
  	let validationRequest = new Request("https://accounts.spotify.com/api/token", {
		method: "POST",
		body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
		headers: {
			'Authorization': 'Basic ' + window.btoa(CLIENT_ID + ':' + CLIENT_SECRET),
            'Content-Type':'application/x-www-form-urlencoded'
		}
	});
	return window.fetch(validationRequest).then(checkResponse)
	.catch((err) => {
        console.log(`Error: ${err}`);
    });
}

/**
* Takes uri from authorize and, if error isn't present and state hasn't been compromised, sends
* a validation request to spotify. 
* @param {string} authInfo The URL that holds the user's authentication information
* @returns {Promise} If fullfilled holds the access token and refresh token
*/
function validate(authInfo) {
	let [code, state, error] = extractOAuthInfo(authInfo);
	if (error || code === null) {
		throw `Authorization failure\n${error}`;
	} else if (state === null || state !== STORED_STATE) {
		throw "State mismatch failure";
	} else {
		let validationRequest = new Request("https://accounts.spotify.com/api/token", {
			method: "POST",
			body: `grant_type=authorization_code&code=${code}&redirect_uri=${REDIRECT_URL}`,
			headers: {
				'Authorization': 'Basic ' + window.btoa(CLIENT_ID + ':' + CLIENT_SECRET),
                'Content-Type':'application/x-www-form-urlencoded'
			}
		});

		return window.fetch(validationRequest).then(checkResponse)
		.catch((err) => {
	        console.log(`Error: ${err}`);
	    });
	}
}


/** PUBLIC FUNCTIONS **/
/* Setters */
function setSecret(secret) {
	CLIENT_SECRET = secret;
}

/**
 * Updates browser.storage's spotify token data.
 * @return {String} Access token
 */
async function getAccessToken() {
	try {
		let data = await browser.storage.local.get();
		if (!data.refresh_token){
			let tokens = await authorize().then(validate);
			data.access_token = tokens[0];
			data.refresh_token = tokens[1];
		} else {
			let token = await refreshAccessToken(data.refresh_token);
			if (token[1] !== undefined) {
				data.refresh_token = token[1];
			}
			data.access_token = token[0];
		}
		browser.storage.local.set(data);
	} catch (err) {
		console.error(err);
	}
}

export { getAccessToken, setSecret }; 