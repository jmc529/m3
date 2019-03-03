import { PubSub } from "../player/classes/PubSub.js"
import { WebPlayer } from "../player/classes/WebPlayer.js"

window.pubSub = new PubSub();
window.start = start;

async function start(accessToken) {
    let player = new Spotify.Player({
        name: 'M3',
        getOAuthToken: callback => {
            callback(accessToken);
        }
    });
	var webPlayer = new WebPlayer(player);
	window.onSpotifyWebPlaybackSDKReady = webPlayer.connect();

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
