import { Song } from "./classes/Song.js";
import { WebPlayer } from "./classes/WebPlayer.js"
import { getTokenData } from "../background/oauth.js";


async function start() {
	let page = await browser.runtime.getBackgroundPage();

	let tokens = await getTokenData();
	browser.storage.local.set({access_token: tokens[0], refresh_token: tokens[1]});
    let player = new page.Spotify.Player({
        name: 'M3',
        getOAuthToken: callback => {
            callback(tokens[0]);
        }
    });

	let webPlayer = new WebPlayer(player);
	page.onSpotifyWebPlaybackSDKReady = webPlayer.connect();
}

let anchor = document.getElementById("album-cover");
anchor.addEventListener("click", start);

let anchor2 = document.getElementById("song-title");
anchor2.addEventListener("click", )