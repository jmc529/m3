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
				webplayer.togglePlayBack();
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
				webplayer.setShuffle();
				break;
			case "repeat":
				webplayer.setRepeat();
				break;
		}
	});

	browser.commands.onCommand.addListener(function(command) {
		if (command === "previous-track") {
			webplayer.previousTrack();
		} else if (command === "play-track") {
			console.log("hi");
			webplayer.togglePlayBack();
		} else if (command === "next-track") {
			webplayer.nextTrack();
		} else if (command === "shuffle") {
			webplayer.setShuffle();
		} else if (command ==="repeat") {
			webplayer.setRepeat();
		}
	});

	if (data.options.notify === "on") {
		interval = window.setInterval(displayNotification, 1000);
	} else {
		window.clearInterval(interval);
	}

	async function displayNotification() {
		let state = await webplayer.getState();
		if (state.item.id && state.item.id !== songId) {
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
		mediaPrev: false,
		mediaPlay: true,
		mediaNext: false,
		shuffle: {
			modifer: "Ctrl",
			shift: true,
			key: "End"
		},
		prev: {
			modifer: "Ctrl",
			shift: true,
			key: "Insert"
		},
		play: {
			modifer: "Ctrl",
			shift: false,
			key: "A"
		},
		next: {
			modifer: "Ctrl",
			shift: true,
			key: "Delete"
		},
		repeat: {
			modifer: "Ctrl",
			shift: true,
			key: "Home"
		},
		spotifyTab: "off"
	};
	browser.storage.local.set(data);
}


async function spotifyTab() {
	let data = await browser.storage.local.get();
	switch (data.options.spotifyTab) {
		case "on":
			browser.tabs.create({
			    url:"https://open.spotify.com"
			});	
			break;
		case "on-pinned":
			browser.tabs.create({
			    url:"https://open.spotify.com",
			    pinned: true
			});
			break;
	}
}

browser.runtime.onStartup.addListener(spotifyTab);
browser.runtime.onInstalled.addListener(defaultOptions);