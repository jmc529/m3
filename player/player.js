import { Song } from "./classes/Song.js";
import { getTokenData } from "../oauth/SpotifyAuthorization.js";

async function start() {
	let page = await browser.runtime.getBackgroundPage();
	let tokens = await getTokenData();
	browser.storage.local.set({access_token: tokens[0], refresh_token: tokens[1]});
	await page.start(tokens[0]);
}

async function setVolume() {
	let value = document.getElementById("volume-slider").value;
	let page = await browser.runtime.getBackgroundPage();
	page.pubSub.publish("setVolume", value);
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

async function handleStaticProperties() {
	let page = await browser.runtime.getBackgroundPage();
	page.pubSub.publish("getVolume");
	await browser.runtime.onMessage.addListener((req, sender, res) => {
		document.getElementById("volume-slider").value = req.volume;
	});
}

document.getElementById("play/pause").addEventListener("click", start);
document.getElementById("volume-slider").addEventListener("mouseup", setVolume);

async function update() {
	let page = await browser.runtime.getBackgroundPage();
	page.pubSub.publish("state");
	browser.runtime.onMessage.addListener((req, sender, res) => {
		if (req.state) {
			handleSong(req.state);
		}
	});
}

handleStaticProperties();
window.setInterval(update, 1000);