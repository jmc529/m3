window.onSpotifyWebPlaybackSDKReady = () => {
	browser.runtime.onMessage.addListener(async (req, sender, res) => {
		if (req.start) {
			await start();
			res();
		}
	});
}

async function start() {
	let data = await browser.storage.local.get();
	let player = new Spotify.Player({
        name: 'M3',
        getOAuthToken: (callback) => {
        	callback(data.access_token);
        }
    });

    // Error handling
    player.addListener('initialization_error', ({ message }) => { console.error(message); });
    player.addListener('authentication_error', async () => {
    	try {
    		await browser.runtime.sendMessage({refresh: true});
	        data = await browser.storage.local.get();
	    } catch (err) {
	    	console.error(err);
	    }
    });
    player.addListener('account_error', ({ message }) => { console.error(message); });
    player.addListener('playback_error', ({ message }) => { console.error(message); });

    connect();

    async function connect() {
    	let state = await player.getCurrentState();
		player.connect();

	    /* Attempt to automatically link to the player (only works on premium accounts) */
	    player.addListener('ready', (data) => {
	    	let playbackChange = new Request("https://api.spotify.com/v1/me/player", {
				method: "PUT",
				body: JSON.stringify(data),
				headers: {
					'Authorization': 'Bearer ' + data.access_token,
		            'Content-Type':'application/json'
				}
			});
			return window.fetch(playbackChange).then((response) => {
				if (response.status === 204) {
					player.getCurrentState().then((state) => {
						if (!state) {
							throw "big ol nope";
						}
					});
				} else if (response.status === 403) {
					throw "spotify is greedy smh";
				}
			})
			.catch((err) => {
		        console.log(`Error: ${err}`);
		    });
	    });
    }

    /* Listener that interprets requests sent from popup and sends a request to Spotify */
	browser.runtime.onMessage.addListener((req, sender, res) => {
		switch(Object.keys(req)[0]) {
			case "state":
				return player.getCurrentState();
				break;
			case "getVolume":
			    return player.getVolume();
				break;
			case "setVolume":
				player.setVolume(req.setVolume/100);
				break;
			case "togglePlayBack":
				player.togglePlay();
				break;
			case "seek":
				player.seek(req.seek);
				break;
			case "forward":
				player.nextTrack()
				break;
			case "backward":
				player.previousTrack();
				break;
			case "connect":
				connect();
				break;
		}
	});
}
