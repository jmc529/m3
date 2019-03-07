import { Song } from "./Song.js";
import { getAccessToken } from "../oauth/SpotifyAuthorization.js";

let onOpen = true;
let interval;

document.getElementById("volume-slider").addEventListener("mouseup", () => {
	let value = document.getElementById("volume-slider").value;
    browser.runtime.sendMessage({setVolume: value});
});

document.getElementById("time-slider").addEventListener("mouseup", async () => {
	let percentage = (document.getElementById("time-slider").value)/100;
	let data = await browser.storage.local.get();
	let current_ms = data.total_time * percentage;
    browser.runtime.sendMessage({seek: current_ms});
});

document.getElementById("play/pause").addEventListener("mouseup", () => {
	browser.runtime.sendMessage({togglePlayBack: true});
});

document.getElementById("backward").addEventListener("mouseup", () => {
    browser.runtime.sendMessage({backward: true});
});

document.getElementById("forward").addEventListener("mouseup", () => {
    browser.runtime.sendMessage({forward: true});
});

document.getElementById("backward").addEventListener("mouseup", () => {
    browser.runtime.sendMessage({backward: true});
});

async function start() {
	await getAccessToken();
    await browser.runtime.sendMessage({start: true});
	document.getElementById("sign-in").hidden = true;
	document.getElementById("player").hidden = false;
	interval = window.setInterval(update, 1000);
}

function handleSong(track) {
	let song = new Song(track);

	let songTitle = document.getElementById("song-title");
	let album = document.getElementById("album-cover");
	if (song.title !== songTitle.textContent || song.album !== album.alt) {
		let artist = document.getElementById("artist");

		songTitle.textContent = song.title;
		artist.textContent = song.artist.name;
		album.alt = song.album;
		album.src = song.albumImage.url;
		document.getElementById("total-time").textContent = song.getTotalTime();
		browser.storage.local.get((data) => {
			data.total_time = song.duration;
			browser.storage.local.set(data);
		});

		songTitle.addEventListener("click", () => {browser.tabs.create({url: song.url})});
		artist.addEventListener("click", () => {browser.tabs.create({url: song.artistUrl})});
		album.addEventListener("click", () => {browser.tabs.create({url: song.albumUrl})});
	}

	if (track.paused) {
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
	} else {
		document.getElementById("sign-in").addEventListener("click", start);
		window.clearInterval(interval);
	}
}).catch((err) => {	console.error(err); });