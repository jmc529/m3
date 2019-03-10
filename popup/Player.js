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
		browser.runtime.sendMessage({toggleShuffle: shuffleMode});
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

	/* Update repeat icon */
	switch (state.repeat_state) {
		case "off":
			repeat.style.color = "#b3b3b3";
			repeat.title = "Enable repeat";
			repeatMode = 0;
			break;
		case "track":
			repeat.style.color = "#1ed760";
			repeat.title = "Enable repeat one";
			repeatMode = 1;
			/*update to once icon*/;
			break;
		case "context":
			repeat.style.color = "#1ed760";
			repeat.title = "Disable repeat";
			repeatMode = 2;
			break;
	}
	/* Update shuffle Icon */
	if (state.shuffle_state) {
		shuffle.style.color = "#1ed760";
		shuffle.title = "Disable shuffle";
		shuffleMode = true;
	} else {
		shuffle.style.color = "#b3b3b3";
		shuffle.title = "Enable shuffle";
		shuffleMode = false;
	}
	/* Update play/pause Icon */
	if (!state.is_playing) {
		playPause.classList.replace("fa-pause", "fa-play");
		playPause.title= "Play";
	} else {
		playPause.classList.replace("fa-play", "fa-pause");
		playPause.title= "Pause";
	}
	/* Update volume icon */
	if (volumeSlider.value > 66) {
		volumeButton.classList.replace("fa-volume*", "fa-volume-up");
	} else if (volumeSlider.value > 33 && volumeSlider.value <= 66) {
		volumeButton.classList.replace("fa-volume*", "fa-volume-down");
	} else if (volumeSlider.value > 0 && volumeSlider.value <= 33)  {
		volumeButton.classList.replace("fa-volume*", "fa-volume-down");
	} else {
		volumeButton.classList.replace("fa-volume*", "fa-volume-mute");
	}
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