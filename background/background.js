import { PubSub } from "../classes/PubSub.js"
import { WebPlayer } from "../classes/WebPlayer.js"

window.pubSub = new PubSub();
window.onSpotifyWebPlaybackSDKReady = () => {
    pubSub.subscribe("start", start);
}

async function start(accessToken) {
    let player = new Spotify.Player({
        name: 'M3',
        getOAuthToken: callback => {
            callback(accessToken);
        }
    });
	var webPlayer = new WebPlayer(player);
	webPlayer.connect();
	
	pubSub.subscribe("state", async () => {
		let currentState = await webPlayer.getCurrentState();
		browser.runtime.sendMessage({
			state: currentState
		});
	});

	pubSub.subscribe("getVolume", async () => {
		let volume = await webPlayer.getVolume();
		browser.runtime.sendMessage({
			volume: volume
		});
	});

	pubSub.subscribe("setVolume", (data) => {
		player.setVolume(data/100);
	})
}
