import { Song } from "./Song.js";
import { getAccessToken } from "../oauth/SpotifyAuthorization.js";

let onOpen = true;
let interval;

async function start() {
	await getAccessToken();
    await browser.runtime.sendMessage({start: true});
	document.getElementById("sign-in").hidden = true;
	document.getElementById("player").hidden = false;
	interval = window.setInterval(update, 1000);
}

async function setVolume() {
	let value = document.getElementById("volume-slider").value;
    browser.runtime.sendMessage({setVolume: value});
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

		songTitle.addEventListener("click", () => {browser.tabs.create({url: song.url})});
		artist.addEventListener("click", () => {browser.tabs.create({url: song.artistUrl})});
		album.addEventListener("click", () => {browser.tabs.create({url: song.albumUrl})});
	}
  	document.getElementById("current-time").textContent = song.getCurrentTime();
  	document.getElementById("time-slider").value = song.getCurrentTimeAsPercentage();
}

document.getElementById("volume-slider").addEventListener("mouseup", setVolume);

async function update() {
	let data = await browser.storage.local.get();
	if (onOpen) {
		/* if the access token needs to be refreshed */
		browser.runtime.onMessage.addListener(async (req, sender, res) => {
			if (req.refresh) {
				await start();
				res({updated: true});
			}
		});

		/* trys to update from cache might not be faster, in that case gonna have to add loading thing */
		if (data.state) {
			handleSong(data.state);
		} 
		/* updates volume */
		browser.runtime.sendMessage({getVolume: true}).then((response) => {
			if (response.volume) {
				document.getElementById("volume-slider").value = response.volume;
			}
		}, (err) => { console.error(err); });
		onOpen = false;
	}

	browser.runtime.sendMessage({state: true}).then((state) => {
		if (state) {
			handleSong(state);
			/*set cache*/
			browser.storage.local.get().then((data) => {
				data.state = state;
				browser.storage.local.set(data);
			});
		}
	}, (err) => { console.error(err); });
}

browser.storage.local.get().then((data) => {
	/*trys to hide sign-in if possible*/
	if (data.access_token) {
		document.getElementById("sign-in").hidden = true;
		document.getElementById("player").hidden = false;
		document.getElementById("album-cover").addEventListener('click', () => { browser.runtime.sendMessage({start: true}); });
		update();
		interval = window.setInterval(update, 1000);
	} else {
		document.getElementById("sign-in").addEventListener("click", start);
		window.clearInterval(interval);
	}
}).catch((err) => {	console.error(err); });