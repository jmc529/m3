import { Song } from "./Song.js";
import { getAccessToken } from "../oauth/SpotifyAuthorization.js";

let onOpen = true;
let interval;
let repeatMode = 0;
let songDuration = 0;
let shuffle = false;

/**
 * Creates listeners for all buttons that need to communicate with Spotify.
 */
function instantiateListeners() {
	/* Set the volume to some value */
	document.getElementById("volume-slider").addEventListener("click", () => {
		let value = document.getElementById("volume-slider").value;
	    browser.runtime.sendMessage({setVolume: value});
	});

	/* Set the current location of the seek bar; changes listening postion */
	document.getElementById("time-slider").addEventListener("click", async () => {
		let percentage = (document.getElementById("time-slider").value)/100;
		let current_ms = songDuration * percentage;
	    browser.runtime.sendMessage({seek: current_ms});
	});

	/* Pauses or resume playback */
	document.getElementById("play/pause").addEventListener("click", () => {
		browser.runtime.sendMessage({togglePlayBack: true});
	});

	/* Toggles shuffle */
	document.getElementById("shuffle").addEventListener("click", () => {
		browser.runtime.sendMessage({toggleShuffle: shuffle});
	});

	/* Loops through the repeat cycle */
	document.getElementById("repeat").addEventListener("click", () => {
		repeatMode = (++repeatMode > 2) ? 0 : ++repeatMode;
		browser.runtime.sendMessage({repeat: repeatMode});
	});

	/* Plays the next song */
	document.getElementById("forward").addEventListener("click", () => {
	    browser.runtime.sendMessage({forward: true});
	});

	/* Plays the previous song */
	document.getElementById("backward").addEventListener("click", () => {
	    browser.runtime.sendMessage({backward: true});
	});
}


/**
 * Requests token data from Spotify, then attempts to hide the sign-in player
 */
async function start() {
	await getAccessToken();
    await browser.runtime.sendMessage({start: true});
	document.getElementById("sign-in").hidden = true;
	document.getElementById("player").hidden = false;
	update();
	interval = window.setInterval(update, 1000);
	instantiateListeners();
}

function handleSong(state) {
	let song = new Song(state);

	let songTitle = document.getElementById("song-title");
	let album = document.getElementById("album-cover");
	if (song.title !== songTitle.textContent || song.album !== album.alt) {
		let artist = document.getElementById("artist");

		songTitle.textContent = song.title;
		artist.textContent = song.artist.name;
		album.alt = song.album;
		album.src = song.albumImage.url;
		document.getElementById("total-time").textContent = song.getTotalTime();
		songDuration = song.duration;

		songTitle.addEventListener("click", () => {browser.tabs.create({url: song.url})});
		artist.addEventListener("click", () => {browser.tabs.create({url: song.artistUrl})});
		album.addEventListener("click", () => {browser.tabs.create({url: song.albumUrl})});
	}
	/* Update repeat icon */
	switch (state.repeat_mode) {
		case 0:
			document.getElementById("repeat").style.color = "#b3b3b3";
			repeatMode = 0;
			break;
		case 1:
			document.getElementById("repeat").style.color = "#1ed760";
			repeatMode = 1;
			/*update to once icon*/;
			break;
		case 2:
			document.getElementById("repeat").style.color = "#1ed760";
			repeatMode = 2;
			break;
	}
	
	if (state.shuffle) {
		document.getElementById("shuffle").style.color = "#1ed760";
		shuffle = true;
	} else {
		document.getElementById("shuffle").style.color = "#b3b3b3";
		shuffle = false;
	}

	/* Update Play/Pause Icon */
	if (state.paused) {
		document.getElementById("play/pause").classList.replace("fa-pause", "fa-play");
	} else {
		document.getElementById("play/pause").classList.replace("fa-play", "fa-pause");
	}
  	document.getElementById("current-time").textContent = song.getCurrentTime();
  	document.getElementById("time-slider").value = song.getCurrentTimeAsPercentage();
}


async function update() {
	let data = await browser.storage.local.get();
	if (onOpen) {
		/* if the access token needs to be refreshed */
		browser.runtime.onMessage.addListener((req, sender, res) => {
			if (req.refresh) {
				return start();
			}
		});
		/* trys to update from cache might not be faster, in that case gonna have to add loading thing */
		if (data.state) {
			handleSong(data.state);
		} 
		/* updates volume */
		let volume = await browser.runtime.sendMessage({getVolume: true});
		if (volume) {
			document.getElementById("volume-slider").value = volume*100;
		}
		onOpen = false;
	}

	let state = await browser.runtime.sendMessage({state: true});
	if (state) {
		handleSong(state);
		/*set cache*/
		browser.storage.local.get().then((data) => {
			data.state = state;
			browser.storage.local.set(data);
		});
	}
}

browser.storage.local.get().then((data) => {
	/*trys to hide sign-in if possible*/
	if (data.access_token) {
		document.getElementById("sign-in").hidden = true;
		document.getElementById("player").hidden = false;
		document.getElementById("shuffle").addEventListener('click', () => { browser.runtime.sendMessage({start: true}); });
		update();
		interval = window.setInterval(update, 1000);
		instantiateListeners();
	} else {
		document.getElementById("sign-in").addEventListener("click", start);
		window.clearInterval(interval);
	}
}).catch((err) => {	console.error(err); });