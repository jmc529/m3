import { Webplayer } from "./Webplayer.js";
import { getAccessToken, setSecret } from "./oauth/SpotifyAuthorization.js";
import { Song } from "../popup/Song.js";

let interval, songId;

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
				webplayer.nextTrack();
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

	if (data.options.notify === "on") {
		console.log("yep");
		interval = window.setInterval(displayNotification, 1000);
	} else {
		console.log("no");
		window.clearInterval(interval);
	}

	async function displayNotification() {
		let state = await webplayer.getState();
		console.log(state.item.id, songId);
		if ((state.item.id && state.item.id !== songId)
			|| (state.track_window.current_track.id 
				&& state.track_window.current_track.id !== songId)) {
			songId = state.item.id ? state.item.id : state.track_window.current_track.id;
			let song = new Song(state);
			browser.notifications.create("song-notification", {
			    "type": "basic",
			    "iconUrl": song.albumImage.url,
			    "title": song.title,
			    "message": song.artist
			});
			window.setTimeout(() => {browser.notifications.clear("song-notification")}, 2500);
		}
	}
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