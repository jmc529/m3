import { getTokenData } from "../../oauth/SpotifyAuthorization.js";

async function start() {
	let page = await browser.runtime.getBackgroundPage();
	let tokens = await getTokenData();
	browser.storage.local.set({access_token: tokens[0], refresh_token: tokens[1]});
	await page.pubSub.publish("start", tokens[0]);
	console.log("yes");
}

document.getElementById("sign-in").addEventListener("click", start);