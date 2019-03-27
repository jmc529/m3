class Webplayer {
	constructor(accessToken, player) {
		this.accessToken = accessToken;
		this.player = player;
	}

	connect() {
		this.player.connect();

	    /* Attempt to automatically link to the player (only works on premium accounts) */
	    this.player.addListener('ready', (data) => {
	    	let playbackChange = new Request("https://api.spotify.com/v1/me/player", {
				method: "PUT",
				body: JSON.stringify(data),
				headers: {
					'Authorization': 'Bearer ' + data.access_token,
		            'Content-Type':'application/json'
				}
			});
			window.fetch(playbackChange).then((response) => {
				if (response.status === 204) {
					this.player.getCurrentState().then((state) => {
						if (!state) {
							throw "big ol nope";
						}
					});
				} else if (response.status === 403) {
					throw "spotify is greedy smh";
				}
			})
			.catch((err) => {
		        console.error(`Error: ${err}`);
		    });
	    });
    }

    instantiateListeners() {
	    // Error handling
	    this.player.addListener('initialization_error', ({ message }) => { console.error(message); });
	    this.player.addListener('authentication_error', ({message}) => { console.error(message); });
	    this.player.addListener('account_error', ({ message }) => { console.error(message); });
	    this.player.addListener('playback_error', ({ message }) => { console.error(message); });
    }

	getState() {
	    let state = new Request("https://api.spotify.com/v1/me/player", {
			method: "GET",
			headers: {
				'Authorization': 'Bearer ' + this.accessToken
			}
		});
		return window.fetch(state).then((response) => {
			return new Promise((resolve, reject) => {
				if (response.status !== 200) {
					reject("Something is not working bruh");
				}
				response.json().then(async (json) => {
					if (json.item === null) {
						let state = await this.player.getCurrentState();
						let volume = await this.player.getVolume();
						if (state) {
							state.device = {volume_percent: volume * 100};
							resolve(state);
						} else {
							reject("Can't find music/podcasts to parse");
						}
					} else if (json.item !== null) {
						resolve(json);
					} else {
						reject("Can't find music/podcasts to parse");
					}
				});
			});
	    });
    }

    nextTrack() {
    	let next = new Request("https://api.spotify.com/v1/me/player/next", {
			method: "POST",
			headers: {
				'Authorization': 'Bearer ' + this.accessToken,
	            'Content-Type':'application/json'
			}
		});
		window.fetch(next).then((response) => {
			if (response.status === 403) {
		       	this.player.nextTrack();
			}
		})
		.catch((err) => {
	        console.error(`Error: ${err}`);
	    });
    }

    previousTrack() {
    	let previous = new Request("https://api.spotify.com/v1/me/player/previous", {
			method: "POST",
			headers: {
				'Authorization': 'Bearer ' + this.accessToken,
	            'Content-Type':'application/json'
			}
		});
		window.fetch(previous).then((response) => {
			if (response.status === 403) {
		       	this.player.previousTrack();
			}
		})
		.catch((err) => {
	        console.error(`Error: ${err}`);
	    });
    }

    seek(position) {
    	let seek = new Request("https://api.spotify.com/v1/me/player/seek", {
			method: "PUT",
			headers: {
				'Authorization': 'Bearer ' + this.accessToken,
	            'Content-Type':'application/json'
			},
			position_ms: position
		});
		window.fetch(seek).then((response) => {
			if (response.status === 403) {
		       	this.player.seek(position);
			}
		})
		.catch((err) => {
	        console.error(`Error: ${err}`);
	    });
    }

    setRepeat(mode) {
    	let state = "off";
    	switch (mode) {
    		case 1:
    			state = "track";
    			break;
    		case 2:
    			state = "context";
    			break;
    	}

	    let repeat = new Request("https://api.spotify.com/v1/me/player/repeat", {
			method: "PUT",
			headers: {
				'Authorization': 'Bearer ' + this.accessToken,
	            'Content-Type':'application/json'
			},
			state: state
		});
		window.fetch(repeat).then((response) => {
			if (response.status === 403) {
				throw "spotify is greedy smh";
			}
		})
		.catch((err) => {
	        console.error(`Error: ${err}`);
	    });
    }

    setShuffle(mode) {
	    let shuffle = new Request("https://api.spotify.com/v1/me/player/shuffle", {
			method: "PUT",
			headers: {
				'Authorization': 'Bearer ' + this.accessToken,
	            'Content-Type':'application/json'
			},
			state: mode
		});
		window.fetch(shuffle).then((response) => {
			if (response.status === 403) {
				throw "spotify is greedy smh";
			}
		})
		.catch((err) => {
	        console.error(`Error: ${err}`);
	    });
    }

    setVolume(percentage) {
    	let volume = new Request("https://api.spotify.com/v1/me/player/volume", {
			method: "PUT",
			headers: {
				'Authorization': 'Bearer ' + this.accessToken,
	            'Content-Type':'application/json'
			},
			volume_percent: percentage
		});
		window.fetch(volume).then((response) => {
			if (response.status === 403) {
			    this.player.setVolume(percentage/100);
			}
		})
		.catch((err) => {
	        console.error(`Error: ${err}`);
	    });
    }

    togglePlayBack(toggle) {
    	toggle = toggle.toLowerCase();
    	let togglePlayBack = new Request(`https://api.spotify.com/v1/me/player/${toggle}`, {
			method: "PUT",
			headers: {
				'Authorization': 'Bearer ' + this.accessToken,
	            'Content-Type':'application/json'
			}
		});
		window.fetch(togglePlayBack).then((response) => {
			if (response.status === 403) {
			    this.player.togglePlay();
			}
		})
		.catch((err) => {
	        console.error(`Error: ${err}`);
	    });
    }

    updateToken(accessToken) {
    	this.accessToken = accessToken;
    }
}

export { Webplayer };