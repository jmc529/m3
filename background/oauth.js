import {client_id, client_secret} from './secret.js'
const redirect_url = browser.identity.getRedirectURL();
const stored_state = generateRandomString(16);
const scope = "user-modify-playback-state user-read-recently-played user-read-currently-playing"
	+ " streaming user-read-birthdate user-read-email user-read-private user-library-read user-library-modify";

/**	
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
function generateRandomString(length) {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

function checkResponse(response) {
	return new Promise((resolve, reject) => {
		if (response.status != 200) {
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
 * @param {string} uri the string to parse through
 * @return {Array} in this order: code info, state info, error info
 */
function extractOAuthInfo(uri) {
  let m = uri.match(/[#?](.*)/);
  if (!m || m.length < 1)
	return null;
  let params = new URLSearchParams(m[1].split("#")[0]);
  return [params.get("code"), params.get("state"), params.get("error")];
}


/**
 * Sends a request to spotify for authorization.
 * @return {string} if promise is fullfilled returns URI with auth info
 */
function authorize() {
	let auth_url = `https://accounts.spotify.com/authorize?` +
		`&response_type=code` +
		`&client_id=${client_id}` +
		`&redirect_uri=${redirect_url}` +
		`&scope=${scope}` +
		`&state=${stored_state}`;

	return browser.identity.launchWebAuthFlow({
		interactive: true,
		url: auth_url
	});
}

/**
* Takes uri from authorize and, if error isn't present and state hasn't been compromised, sends
* a validation request to spotify. If that works spotify sends back data from which we grab 
* the access and refresh token.
* @returns {promise} if fullfilled holds the access token and refresh token
*/
function validate(auth_info) {
	const [code, state, error] = extractOAuthInfo(auth_info);
	if (error || code === null) {
		throw `Authorization failure\n${error}`;
	} else if (state === null || state !== stored_state) {
		throw "State mismatch failure";
	} else {
		const validation_request = new Request("https://accounts.spotify.com/api/token", {
			method: "POST",
			body: `grant_type=authorization_code&code=${code}&redirect_uri=${redirect_url}`,
			headers: {
				'Authorization': 'Basic ' + window.btoa(client_id + ':' + client_secret),
                'Content-Type':'application/x-www-form-urlencoded'
			}
		});

		return window.fetch(validation_request).then(checkResponse)
		.catch((err) => {
	        console.log(`Error: ${err}`);
	    });
	}
}


function refreshAccessToken(refreshToken) {
  	const validation_request = new Request("https://accounts.spotify.com/api/token", {
		method: "POST",
		body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
		headers: {
			'Authorization': 'Basic ' + window.btoa(client_id + ':' + client_secret),
            'Content-Type':'application/x-www-form-urlencoded'
		}
	});
	return window.fetch(validation_request).then(checkResponse)
	.catch((err) => {
        console.log(`Error: ${err}`);
    });
}

/**
 * Updates browser.storage's spotify token data.
 */
async function getTokenData() {
	const data = await browser.storage.local.get();

	if (Object.keys(data).length === 0 && data.constructor == Object) {
		return authorize().then(validate);
	}
	else {
		return refreshAccessToken(data["refresh_token"]);
	}
}

export { getTokenData };