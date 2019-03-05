import { Song } from "./Song.js";
import { getTokenData } from "../oauth/SpotifyAuthorization.js";

let onOpen = true;

async function start() {
	let page = await browser.runtime.getBackgroundPage();
	let player = new page.Spotify.Player({
        name: 'M3',
        getOAuthToken: async (callback) => {
        	let tokens = await getTokenData();
            callback(tokens[0]);
        }
    });
    browser.runtime.sendMessage({start: player});
	document.getElementById("sign-in").hidden = true;
	document.getElementById("player").hidden = false;
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
	console.log("update");
	browser.runtime.sendMessage({state: true}).then((response) => {
		console.log(response.state);
		if (state) { handleSong(response.state); }
	}).catch((err) => {
		console.error(err);
	});
	

	if (onOpen) {
		let response = await browser.runtime.sendMessage({getVolume: true});
		document.getElementById("volume-slider").value = response.volume;
	}

	// let page = await browser.runtime.getBackgroundPage();
	// page.pubSub.publish("state");
	// browser.runtime.onMessage.addListener((req, sender, res) => {
	// 	if (req.state) {
	// 		handleSong(req.state);
	// 	}
	// });

	// if (onOpen) {
	// 	page.pubSub.publish("getVolume");
	// 	await browser.runtime.onMessage.addListener((req, sender, res) => {
	// 		document.getElementById("volume-slider").value = req.volume;
	// 	});
	// }
}

browser.storage.local.get().then((data) => {
	if (data.refresh_token) {
		document.getElementById("sign-in").hidden = true;
		document.getElementById("player").hidden = false;
	}
}).catch((err) => {console.error(err);});

if (document.getElementById("sign-in").hidden) {
	update();
	window.setInterval(update, 1000);
} else {
	document.getElementById("sign-in").addEventListener("click", start);
}