import { Song } from "./Song.js";

/* Sections */
const SIGN_IN = document.getElementById("sign-in");
const PLAYER = document.getElementById("player");
const QUEUE = document.getElementById("queue");
/* Player */
const VOL_BUTTON = document.getElementById("volume-button");
const VOL_SLIDER = document.getElementById("volume-slider");
const SONG_TITLE = document.getElementById("song-title");
const ARTIST = document.getElementById("artist");
const ALBUM = document.getElementById("album-cover");
const QUEUE_BUTTON = document.getElementById("queue-button");
const REPEAT = document.getElementById("repeat");
const BACKWARD = document.getElementById("backward");
const PLAY_PAUSE = document.getElementById("play/pause");
const FORWARD = document.getElementById("forward");
const SHUFFLE = document.getElementById("shuffle");
const SEARCH_BUTTON = document.getElementById("search-button");
const TIME_SLIDER = document.getElementById("time-slider");
const CURRENT_TIME = document.getElementById("current-time");
const TOTAL_TIME = document.getElementById("total-time");
/* Queue */
const QUEUE_TEMPLATE = document.getElementById("queue-item");
const QUEUE_LIST = document.getElementById("queue-list");
const QUEUE_BACK = document.getElementById("queue-back");

let onOpen = true;
let songDuration = 0;
let displayQueue = false;
let queueListener = async function() {
	displayQueue = displayQueue ? false : true;
	let queue = await browser.runtime.sendMessage({queue: true});
	handleQueue(queue);
}

/**
 * Creates listeners for all buttons that need to communicate with Spotify.
 */
function instantiateListeners() {
	/* Set the volume to some value */
	VOL_SLIDER.addEventListener("change", () => {
		let value = VOL_SLIDER.value;
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
	VOL_BUTTON.addEventListener("click", () => {
    	browser.storage.local.get().then((data) => {
    		if (data.mute) {
    			browser.runtime.sendMessage({setVolume: data.mute_value});
    			VOL_SLIDER.value = data.mute_value;
    			data.mute = false;
    			browser.storage.local.set(data);
    		} else {
		    	browser.runtime.sendMessage({setVolume: 0});
		    	data.mute_value = VOL_SLIDER.value;
    			VOL_SLIDER.value = 0;
    			data.mute = true;
    			browser.storage.local.set(data);
    		}
    	});
	});
	/* Set the current location of the seek bar; changes listening postion */
	TIME_SLIDER.addEventListener("change", async () => {
		let percentage = (TIME_SLIDER.value)/100;
		let current_ms = songDuration * percentage;
	    browser.runtime.sendMessage({seek: current_ms});
	});
	/* Pauses or resume playback */
	PLAY_PAUSE.addEventListener("click", () => {
		browser.runtime.sendMessage({togglePlayBack: true});
	});
	/* Toggles shuffle */
	SHUFFLE.addEventListener("click", () => {
		browser.runtime.sendMessage({toggleShuffle: true});
	});
	/* Loops through the repeat cycle */
	REPEAT.addEventListener("click", () => {
		browser.runtime.sendMessage({repeat: true});
	});
	/* Plays the next song */
	FORWARD.addEventListener("click", () => {
	    browser.runtime.sendMessage({forward: true});
	});
	/* Plays the previous song */
	BACKWARD.addEventListener("click", () => {
	    browser.runtime.sendMessage({backward: true});
	});
	/* Goes back to player from queue */
	QUEUE_BACK.addEventListener("click", () => {
		QUEUE.classList.add("hidden");
		PLAYER.classList.remove("hidden");
		displayQueue = displayQueue ? false : true;
	});
}

function handleSong(state) {
	state.item.progress_ms = state.progress_ms;
	let song = new Song(state.item);

	/* Update Song Context */
	if (song.title !== SONG_TITLE.textContent || song.album !== ALBUM.alt) {
		SONG_TITLE.textContent = song.title;
		ARTIST.textContent = song.artist;
		ALBUM.alt = song.album;
		ALBUM.src = song.albumImage.url;
		TOTAL_TIME.textContent = song.getTotalTime();
		songDuration = song.duration;

		SONG_TITLE.addEventListener("click", () => {browser.tabs.create({url: song.url})});
		SONG_TITLE.title = song.url;
		ARTIST.addEventListener("click", () => {browser.tabs.create({url: song.artistUrl})});
		ARTIST.title = song.artistUrl;
		ALBUM.addEventListener("click", () => {browser.tabs.create({url: song.albumUrl})});
		ALBUM.title = song.albumUrl;

		/*used for looping the title if it overflows*/
		let titleLength = SONG_TITLE.scrollWidth;
		if (titleLength > 200) {
			SONG_TITLE.className += " " + "scrollEnabled"
			/* 3s times a length percentage for pacing for duration */
			let duration = `${3*(titleLength/200)}s`;
			SONG_TITLE.style.setProperty('--duration', duration);
		}
	}
	CURRENT_TIME.textContent = song.getCurrentTime();
  	TIME_SLIDER.value = song.getCurrentTimeAsPercentage();
}

function handlePlayer(state) {
	let setColorAndTitle = function(elem, colorStyle, title) {
		elem.style.color = colorStyle;
		elem.title = title;
	}
	/* Update repeat icon */
	if (state.repeat_state === "off") {
		setColorAndTitle(REPEAT, "#b3b3b3",  "Enable repeat");
		REPEAT.firstElementChild.classList.replace("icon-repeat-one", "icon-repeat");
	} else if (state.repeat_state === "track") {
		setColorAndTitle(REPEAT, "#1ed760",  "Enable repeat one");
		REPEAT.firstElementChild.classList.replace("icon-repeat", "icon-repeat-one");
	} else if (state.repeat_state === "context") {
		setColorAndTitle(REPEAT, "#1ed760",  "Disable repeat");
	}
	/* Update shuffle Icon */
	if (state.shuffle_state) {
		setColorAndTitle(SHUFFLE, "#1ed760",  "Disable shuffle");
	} else {
		setColorAndTitle(SHUFFLE, "#b3b3b3",  "Enable shuffle");
	}
	/* Update play/pause Icon */
	if (state.is_playing) {
		PLAY_PAUSE.firstElementChild.classList.replace("icon-play", "icon-pause");
		PLAY_PAUSE.title="Pause";
	} else {
		PLAY_PAUSE.firstElementChild.classList.replace("icon-pause", "icon-play");
		PLAY_PAUSE.title="Play";
	}
	/* Update volume */
	if (VOL_SLIDER.value > 66) {
		VOL_BUTTON.className = "icon-volume-up";
	} else if (VOL_SLIDER.value > 33 && VOL_SLIDER.value <= 66) {
		VOL_BUTTON.className = "icon-volume";
	} else if (VOL_SLIDER.value > 0 && VOL_SLIDER.value <= 33)  {
		VOL_BUTTON.className = "icon-volume-down";
	} else if (VOL_SLIDER.value <= 0) {
		VOL_BUTTON.className = "icon-volume-off";
	}
}


function handleQueue(nextTracks) {
	QUEUE.classList.remove("hidden");
	PLAYER.classList.add("hidden");
	console.log(nextTracks);
	while (QUEUE_LIST.lastChild) {
	    QUEUE_LIST.removeChild(QUEUE_LIST.lastChild);
	}
	nextTracks.forEach((track) => {
		let url = "https://open.spotify.com/track/" + track.uri.slice(14);
		let artistUrl = "https://open.spotify.com/artist/" + track.artists[0].uri.slice(15);
		let albumUrl = "https://open.spotify.com/album/" + track.album.uri.slice(14);
		let node = QUEUE_TEMPLATE.content.cloneNode(true);
		let title = node.getElementById("queue-title");
		let artist = node.getElementById("queue-artist");
		let album = node.getElementById("queue-album");

		title.innerText = track.name;
		artist.innerText = track.artists[0].name;
		album.innerText = track.album.name;
		title.addEventListener("click", () => {browser.tabs.create({url: url});})
		title.title = url;
		artist.addEventListener("click", () => {browser.tabs.create({url: artistUrl})});
		artist.title = artistUrl;
		album.addEventListener("click", () => {browser.tabs.create({url: albumUrl})});
		album.title = albumUrl;
		QUEUE_LIST.appendChild(node);
	});
}

async function update() {
	if (!displayQueue) {
		let state = await browser.runtime.sendMessage({state: true});
		if (onOpen) {
			document.getElementById("volume-slider").value = state.device.volume_percent;
			onOpen = false;
		}
		if (state) {
			handleSong(state);
			handlePlayer(state);
		}
	}

	browser.runtime.sendMessage({queue: true})
	.then((response) => {
		if (response) {
			if (QUEUE_BUTTON.className.includes("disabled")) {
				QUEUE_BUTTON.classList.remove("disabled");
				QUEUE_BUTTON.title = "Queue";
				QUEUE_BUTTON.addEventListener("click", queueListener);
			}
		} else {
			QUEUE_BUTTON.classList.add("disabled");
			QUEUE_BUTTON.title = "Connect to M3";
			QUEUE_BUTTON.removeEventListener("click", queueListener);
		}
	}).catch((err) => {console.error(err);});
}

browser.storage.local.get().then((data) => {
	/*trys to hide sign-in if possible*/
	if (data.access_token) {
		SIGN_IN.classList.add("hidden");
		PLAYER.classList.remove("hidden");
		update();
		window.setInterval(update, 1000);
		instantiateListeners();
	} else {
		SIGN_IN.addEventListener("click", () => { 
			browser.runtime.sendMessage({start: true});
		});
	}
}).catch((err) => {	console.error(err); });