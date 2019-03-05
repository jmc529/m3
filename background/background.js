window.onSpotifyWebPlaybackSDKReady = () => {
	browser.runtime.onMessage.addListener((req, sender, res) => {
		if (req.start) {
			start(req.start);
		}
	});
}

async function start(player) {
           	
    // Error handling
    player.addListener('initialization_error', ({ message }) => { console.error(message); });
    player.addListener('authentication_error', ({ message }) => { console.error(message); });
    player.addListener('account_error', ({ message }) => { console.error(message); });
    player.addListener('playback_error', ({ message }) => { console.error(message); });

    player.connect();

    // Ready
    player.addListener('ready', (data) => {
    	// attempt to automatically link to the player (only works on premium accounts)
    	let playbackChange = new Request("https://api.spotify.com/v1/me/player", {
			method: "PUT",
			body: JSON.stringify(data),
			headers: {
				'Authorization': 'Bearer ' + accessToken,
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


	browser.runtime.onMessage.addListener(async (req, sender, res) => {
		switch(Object.keys(req)[0]) {
			case "state":
				let currentState = await player.getCurrentState();
				console.log(currentState);
				res({state: currentState});
				break;
			case "getVolume":
			    let volume = await player.getVolume();
				res({volume: volume*100});
				break;
			case "setVolume":
				player.setVolume(req.setVolume/100);
				break;
		}
	});

	// pubSub.subscribe("state", async () => {
	// 	let currentState = await webPlayer.getCurrentState();
	// 	browser.runtime.sendMessage({
	// 		state: currentState
	// 	});
	// });

	// pubSub.subscribe("getVolume", async () => {
	// 	let volume = await webPlayer.getVolume();
	// 	browser.runtime.sendMessage({
	// 		volume: volume
	// 	});
	// });

	// pubSub.subscribe("setVolume", (data) => {
	// 	player.setVolume(data/100);
	// })
}
