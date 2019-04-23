import { Song } from "./Song.js";

let onOpen = true;
let songDuration = 0;

/**
 * Creates listeners for all buttons that need to communicate with Spotify.
 */
function instantiateListeners() {
	/* Set the volume to some value */
	document.getElementById("volume-slider").addEventListener("change", () => {
		let value = document.getElementById("volume-slider").value;
	    browser.runtime.sendMessage({setVolume: value});
	    if (value > 0) {
	    	browser.storage.local.get().then((data) => {
	    		if (data.mute) {
	    			data.mute = false;
	    			browser.storage.local.set(data);
	    		}
	    	});
	    }
	});

	document.getElementById("volume-button").addEventListener("click", () => {
    	browser.storage.local.get().then((data) => {
    		if (data.mute) {
    			browser.runtime.sendMessage({setVolume: data.mute_value});
    			document.getElementById("volume-slider").value = data.mute_value;
    			data.mute = false;
    			browser.storage.local.set(data);
    		} else {
		    	browser.runtime.sendMessage({setVolume: 0});
		    	data.mute_value = document.getElementById("volume-slider").value;
    			document.getElementById("volume-slider").value = 0;
    			data.mute = true;
    			browser.storage.local.set(data);
    		}
    	});
	});

	/* Set the current location of the seek bar; changes listening postion */
	document.getElementById("time-slider").addEventListener("change", async () => {
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
		browser.runtime.sendMessage({toggleShuffle: true});
	});

	/* Loops through the repeat cycle */
	document.getElementById("repeat").addEventListener("click", () => {
		browser.runtime.sendMessage({repeat: true});
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

function handleSong(state) {
	/* Variables */
	let stateTrack = state.item;
	stateTrack.progress_ms = state.progress_ms;
	
	let song = new Song(stateTrack);
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

		/*used for looping the title if it overflows*/
		let titleLength = songTitle.scrollWidth;
		if (titleLength > 200) {
			songTitle.className += " " + "scrollEnabled"
			/* 3s times a length percentage for pacing for duration */
			let duration = `${3*(titleLength/200)}s`;
			songTitle.style.setProperty('--duration', duration);
		}
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

	function setColorAndTitle(elem, colorStyle, title) {
		elem.style.color = colorStyle;
		elem.title = title;
	}

	/* Update repeat icon */
	if (state.repeat_state === "off") {
		setColorAndTitle(repeat, "#b3b3b3",  "Enable repeat");
		repeat.firstElementChild.classList.replace("icon-repeat-one", "icon-repeat");
	} else if (state.repeat_state === "track") {
		setColorAndTitle(repeat, "#1ed760",  "Enable repeat one");
		repeat.firstElementChild.classList.replace("icon-repeat", "icon-repeat-one");
	} else if (state.repeat_state === "context") {
		setColorAndTitle(repeat, "#1ed760",  "Disable repeat");
	}
	/* Update shuffle Icon */
	if (state.shuffle_state) {
		setColorAndTitle(shuffle, "#1ed760",  "Disable shuffle");
	} else {
		setColorAndTitle(shuffle, "#b3b3b3",  "Enable shuffle");
	}
	/* Update play/pause Icon */
	if (state.is_playing) {
		playPause.firstElementChild.classList.replace("icon-play", "icon-pause");
		playPause.title="Pause";
	} else {
		playPause.firstElementChild.classList.replace("icon-pause", "icon-play");
		playPause.title="Play";
	}
	/* Update volume */
	if (volumeSlider.value > 66) {
		volumeButton.className = "icon-volume-up";
	} else if (volumeSlider.value > 33 && volumeSlider.value <= 66) {
		volumeButton.className = "icon-volume";
	} else if (volumeSlider.value > 0 && volumeSlider.value <= 33)  {
		volumeButton.className = "icon-volume-down";
	} else if (volumeSlider.value <= 0) {
		volumeButton.className = "icon-volume-off";
	}
}


function handleQueue(state) {
	let queue = state.track_window.next_tracks;
	const QUEUE_TEMPLATE = document.getElementById("queue-item");
	const QUEUE_LIST = document.getElementById("queue-list");

	queue.forEach((track) => {
		url = "https://open.spotify.com/track/" + track.uri.slice(14);
		let liNode = QUEUE_TEMPLATE.content.cloneNode(true);
		liNode.getElementById("queue-title").innerText = track.name;
		liNode.getElementById("queue-artist-album").innerText = 
			`${track.artists[0].name} &centerdot; ${track.album.name}`;
		liNode.addEventListener("click", () => {browser.tabs.create({url});})
		QUEUE_LIST.appendChild(liNode);
	});
}

async function update() {
	let state = await browser.runtime.sendMessage({state: true});
	if (onOpen) {
		document.getElementById("volume-slider").value = state.device.volume_percent;
		onOpen = false;
	}

	if (state.item === undefined) {
		if (queue.className.includes("disabled")) {
			queue.classList.remove("disabled");
			queue.title = "Queue";
			queue.addEventListener("click", queueListener);
		}
	} else {
		if (!queue.className.includes("disabled")) {
			queue.classList.add("disabled");
			queue.title = "Connect to M3";
			queue.removeEventListener("click", queueListener);
		}
	}

	if (state) {
		if (!displayQueue) {
			handleSong(state);
			handlePlayer(state);
		} else {
			handleQueue(state);
		}
	}
}

browser.storage.local.get().then((data) => {
	/*trys to hide sign-in if possible*/
	if (data.access_token) {
		document.getElementById("sign-in").classList.add("hidden");
		document.getElementById("player").classList.remove("hidden");
		update();
		window.setInterval(update, 1000);
		instantiateListeners();
	} else {
		document.getElementById("sign-in").addEventListener("click", () => { 
			browser.runtime.sendMessage({start: true});
		});
	}
}).catch((err) => {	console.error(err); });