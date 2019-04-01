import { Webplayer } from "./Webplayer.js";
import { getAccessToken, setSecret } from "./oauth/SpotifyAuthorization.js";

window.onSpotifyWebPlaybackSDKReady = () => {
	browser.runtime.onMessage.addListener((req, sender, res) => {
		if (req.start) {
			start(req.start);
		}
	});
}

async function start(module) {
	setSecret(module.CLIENT_SECRET);
	await getAccessToken();
	let data = await browser.storage.local.get();
	let player = new Spotify.Player({
        name: 'M3',
        getOAuthToken: (callback) => {
        	callback(data.access_token);
        }
    });
	let webplayer = new Webplayer(data.access_token, player);
	webplayer.instantiateListeners();
	webplayer.connect();

    /* Listener that interprets requests sent from popup and sends a request to Spotify */
	browser.runtime.onMessage.addListener((req, sender, res) => {
		switch(Object.keys(req)[0]) {
			case "state":
				return webplayer.getState();
				break;
			case "setVolume":
				webplayer.setVolume(req.setVolume);
				break;
			case "togglePlayBack":
				webplayer.togglePlayBack(req.togglePlayBack);
				break;
			case "seek":
				player.seek(req.seek);
				break;
			case "forward":
				webplayer.nextTrack()
				break;
			case "backward":
				webplayer.previousTrack();
				break;
			case "toggleShuffle":
				webplayer.setShuffle(req.toggleShuffle);
				break;
			case "repeat":
				webplayer.setRepeat(req.repeat);
				break;
		}
	});
}

async function defaultOptions() {
	let data = await browser.storage.local.get();
	data.options = {
		notify: "on",
		mediaPrev: true,
		mediaPlay: true,
		mediaNext: true,
		shuffle: {
			modifer: "ctrl",
			shift: true,
			key: "end"
		},
		prev: {
			modifer: "ctrl",
			shift: false,
			key: "a"
		},
		play: {
			modifer: "ctrl",
			shift: false,
			key: "a"
		},
		next: {
			modifer: "ctrl",
			shift: false,
			key: "a"
		},
		repeat: {
			modifer: "ctrl",
			shift: true,
			key: "home"
		},
		spotifyTab: "off"
	};
	browser.storage.local.set(data);
}

browser.runtime.onInstalled.addListener(defaultOptions);