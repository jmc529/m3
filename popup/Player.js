import { Song } from "./Song.js";
import { getAccessToken } from "./oauth/SpotifyAuthorization.js";

let onOpen = true;
let interval;
let repeatMode = 0;
let songDuration = 0;
let shuffleMode = false;

/**
 * Creates listeners for all buttons that need to communicate with Spotify.
 */
function instantiateListeners() {
	/* Set the volume to some value */
	document.getElementById("volume-slider").addEventListener("mouseup", () => {
		let value = document.getElementById("volume-slider").value;
	    browser.runtime.sendMessage({setVolume: value});
	});

	document.getElementById("volume-button").addEventListener("click", () => {
    	browser.storage.local.get().then((data) => {
    		if (data.mute) {
    			browser.runtime.sendMessage({setVolume: data.mute_value});
    			data.mute = false;
    			browser.storage.local.set(data);
    		} else {
		    	browser.runtime.sendMessage({setVolume: 0});
    			data.mute = true;
    			data.mute_value = document.getElementById("volume-slider").value;
    			browser.storage.local.set(data);
    		}
    	});
	});

	/* Set the current location of the seek bar; changes listening postion */
	document.getElementById("time-slider").addEventListener("mouseup", async () => {
		let percentage = (document.getElementById("time-slider").value)/100;
		let current_ms = songDuration * percentage;
	    browser.runtime.sendMessage({seek: current_ms});
	});

	/* Pauses or resume playback */
	document.getElementById("play/pause").addEventListener("click", () => {
		let title = document.getElementById("play/pause").title;
		browser.runtime.sendMessage({togglePlayBack: title});
	});

	/* Toggles shuffle */
	document.getElementById("shuffle").addEventListener("click", () => {
		browser.runtime.sendMessage({toggleShuffle: shuffleMode});
	});

	/* Loops through the repeat cycle */
	document.getElementById("repeat").addEventListener("click", () => {
		repeatMode = (--repeatMode < 0) ? 2 : --repeatMode;
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
	/* Variables */
	let song = new Song(state);
	let songTitle = document.getElementById("song-title");
	let album = document.getElementById("album-cover");

	/* Update Song Context */
	if (song.title !== songTitle.textContent || song.album !== album.alt) {
		let artist = document.getElementById("artist");

		songTitle.textContent = song.title;
		artist.textContent = song.artist;
		album.alt = song.album;
		album.src = song.albumImage.url;
		document.getElementById("total-time").textContent = song.getTotalTime();
		songDuration = song.duration;

		songTitle.addEventListener("click", () => {browser.tabs.create({url: song.url})});
		songTitle.title=song.url;
		artist.addEventListener("click", () => {browser.tabs.create({url: song.artistUrl})});
		artist.title=song.artistUrl;
		album.addEventListener("click", () => {browser.tabs.create({url: song.albumUrl})});
		album.title=song.albumUrl;
	}
  	document.getElementById("current-time").textContent = song.getCurrentTime();
  	document.getElementById("time-slider").value = song.getCurrentTimeAsPercentage();
}

function handlePlayer(state) {
	let repeat = document.getElementById("repeat");
	let shuffle = document.getElementById("shuffle");
	let playPause = document.getElementById("play/pause");
	let volumeSlider = document.getElementById("volume-slider");
	let volumeButton = document.getElementById("volume-button");
	
	if (state.item === undefined) {
		let repeatArray = ["off", "track", "context"];
		state.repeat_state = repeatArray[state.repeat_mode];
		state.shuffle_state = state.shuffle;
		state.is_playing = !state.paused;
	}

	function setColorAndTitle(elem, color, title) {
		elem.style.color = color;
		elem.title = title;
	}

	/* Update repeat icon */
	switch (state.repeat_state) {
		case "off":
			setColorAndTitle(repeat, "#b3b3b3",  "Enable repeat");
			repeatMode = 0;
			break;
		case "track":
			setColorAndTitle(repeat, "#1ed760",  "Enable repeat one");
			repeatMode = 1;
			/*update to once icon*/;
			break;
		case "context":
			setColorAndTitle(repeat, "#1ed760",  "Disable repeat");
			repeatMode = 2;
			break;
	}
	/* Update shuffle Icon */
	if (state.shuffle_state) {
		setColorAndTitle(shuffle, "#1ed760",  "Disable shuffle");
		shuffleMode = true;
	} else {
		setColorAndTitle(shuffle, "#b3b3b3",  "Enable shuffle");
		shuffleMode = false;
	}
	/* Update play/pause Icon */
	if (!state.is_playing) {
		playPause.classList.replace("fa-pause", "fa-play");
		playPause.title="Play";
	} else {
		playPause.classList.replace("fa-play", "fa-pause");
		playPause.title="Pause";
	}
	/* Update volume icon */
	if (volumeSlider.value > 66) {
		volumeButton.className = "fas fa-volume-up";
	} else if (volumeSlider.value > 33 && volumeSlider.value <= 66) {
		volumeButton.className = "fas fa-volume-down"; /* Need a fourth icon */
	} else if (volumeSlider.value > 0 && volumeSlider.value <= 33)  {
		volumeButton.className = "fas fa-volume-down";
	} else {
		volumeButton.className = "fas fa-volume-mute";
	}
}


async function update() {
	let state = await browser.runtime.sendMessage({state: true});
	if (onOpen) {
		/* if the access token needs to be refreshed */
		browser.runtime.onMessage.addListener((req, sender, res) => {
			if (req.refresh) {
				return start();
			}
		});

		document.getElementById("volume-slider").value = state.device.volume_percent;

		onOpen = false;
	}

	if (state) {
		handleSong(state);
		handlePlayer(state);
	}
}

browser.storage.local.get().then((data) => {
	/*trys to hide sign-in if possible*/
	if (data.access_token) {
		document.getElementById("sign-in").hidden = true;
		document.getElementById("player").hidden = false;
		update();
		interval = window.setInterval(update, 1000);
		instantiateListeners();
		document.getElementById("volume-button").addEventListener("click", start);
	} else {
		document.getElementById("sign-in").addEventListener("click", start);
		window.clearInterval(interval);
	}
}).catch((err) => {	console.error(err); });