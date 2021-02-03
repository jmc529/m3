class Webplayer {
	constructor(accessToken, player, scriptId) {
		this.accessToken = accessToken;
		this.player = player;
		this.scriptId = scriptId || 0;
		;
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
					'Content-Type': 'application/json'
				}
			});
			window.fetch(playbackChange).then((response) => {
				if (response.status === 204) {
					this.player.getCurrentState().then((state) => {
						if (!state) {
							throw "big ol nope, not connected";
						}
					});
				} else if (response.status === 403 || response.status === 401) {
					browser.tabs.sendMessage(this.scriptId, "connect");
				}
			})
				.catch((err) => {
					console.error(err);
				});
		});
	}

	instantiateListeners() {
		// Error handling
		this.player.addListener('initialization_error', ({ message }) => { console.error(message); });
		this.player.addListener('authentication_error', ({ message }) => { console.error(message); });
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
					if (response.status === 401) {
						this.connect();
					} else if (response.status === 204) {
						reject("No content, open spotify and press play.");
					} else {
						reject(response);
					}
				}
				response.json().then(async (json) => {
					let state = await this.player.getCurrentState();
					if (json.item) {
						resolve(json);
					} else if (state) {
						let track = {
							item: state.track_window.current_track,
							progress_ms: state.position
						}
						resolve(track);
					} else {
						reject(`Error: 801, ${state}`);
					}
				});
			});
		});
	}

	async getQueue() {
		let state = await this.player.getCurrentState();
		if (state) {
			return state.track_window.next_tracks;
		}
		return false;
	}

	nextTrack() {
		let next = new Request("https://api.spotify.com/v1/me/player/next", {
			method: "POST",
			headers: {
				'Authorization': 'Bearer ' + this.accessToken,
				'Content-Type': 'application/json'
			}
		});
		window.fetch(next).then((response) => {
			if (response.status === 403) {
				browser.tabs.get(this.scriptId)
					.then(() => { browser.tabs.sendMessage(this.scriptId, "next"); })
					.catch(() => { this.player.nextTrack(); });
			}
		})
			.catch((err) => {
				console.error(err);
			});
	}

	playTrack(trackUri) {
		let track = new Request(`https://api.spotify.com/v1/me/player/play`, {
			method: "PUT",
			headers: {
				'Authorization': 'Bearer ' + this.accessToken,
				'Content-Type': 'application/json'
			},
			body: {
				context_uri: trackUri
			}
		});
		window.fetch(track).then(async (response) => {
			if (response.status === 403) {
				let completed = "loading";
				let uri = "https://open.spotify.com/track/" + trackUri.slice(14);
				let tab = await browser.tabs.create({ active: false, url: uri });
				while (completed !== "complete") {
					let tabObject = await browser.tabs.get(tab.id);
					completed = tabObject.status;
				}
				browser.tabs.executeScript(tab.id, { file: "../contentScripts/SpotifyScript.js" })
					.then(() => {
						browser.tabs.sendMessage(tab.id, "playTrack")
							.then(setTimeout(() => { browser.tabs.remove(tab.id) }, 4500));
					});

			}
		})
			.catch((err) => {
				console.error(err);
			});
	}

	previousTrack() {
		let previous = new Request("https://api.spotify.com/v1/me/player/previous", {
			method: "POST",
			headers: {
				'Authorization': 'Bearer ' + this.accessToken,
				'Content-Type': 'application/json'
			}
		});
		window.fetch(previous).then((response) => {
			if (response.status === 403) {
				browser.tabs.get(this.scriptId)
					.then(() => { browser.tabs.sendMessage(this.scriptId, "previous"); })
					.catch(() => { this.player.previousTrack(); });
			}
		})
			.catch((err) => {
				console.error(err);
			});
	}

	search(query) {
		let search = new Request(`https://api.spotify.com/v1/search?q=${query}&type=track&market=from_token&limit=7`, {
			method: "GET",
			headers: {
				'Authorization': 'Bearer ' + this.accessToken
			}
		});
		return window.fetch(search).then((response) => {
			return new Promise((resolve, reject) => {
				if (response.status !== 200) {
					reject(response);
				}
				response.json().then((json) => {
					if (json.tracks.items) {
						resolve(json);
					} else {
						reject("Issue fetching query.");
					}
				});
			});
		});
	}

	seek(position) {
		let seek = new Request("https://api.spotify.com/v1/me/player/seek", {
			method: "PUT",
			headers: {
				'Authorization': 'Bearer ' + this.accessToken,
				'Content-Type': 'application/json'
			},
			position_ms: position
		});
		window.fetch(seek).then((response) => {
			if (response.status === 403) {
				this.player.seek(position);
			}
		})
			.catch((err) => {
				console.error(err);
			});
	}

	async setRepeat() {
		let states = ["off", "track", "context"];
		let state = await this.getState();
		let mode = states.indexOf(state.repeat_state) === 2 ? 0 : states.indexOf(state.repeat_state) + 1;
		let repeat = new Request("https://api.spotify.com/v1/me/player/repeat", {
			method: "PUT",
			headers: {
				'Authorization': 'Bearer ' + this.accessToken,
				'Content-Type': 'application/json'
			},
			state: states[mode]
		});
		window.fetch(repeat).then((response) => {
			if (response.status === 403) {
				browser.tabs.get(this.scriptId)
					.then(() => { browser.tabs.sendMessage(this.scriptId, "repeat"); })
					.catch(() => { console.error("No spotify tab."); });
			}
		})
			.catch((err) => {
				console.error(err);
			});
	}

	async setShuffle() {
		let state = await this.getState();
		let mode = state.shuffle_state ? true : false;
		let shuffle = new Request("https://api.spotify.com/v1/me/player/shuffle", {
			method: "PUT",
			headers: {
				'Authorization': 'Bearer ' + this.accessToken,
				'Content-Type': 'application/json'
			},
			state: mode
		});
		window.fetch(shuffle).then((response) => {
			if (response.status === 403) {
				browser.tabs.get(this.scriptId)
					.then(() => { browser.tabs.sendMessage(this.scriptId, "shuffle"); })
					.catch(() => { console.error("No spotify tab."); });
			}
		})
			.catch((err) => {
				console.error(err);
			});
	}

	setVolume(percentage) {
		let volume = new Request("https://api.spotify.com/v1/me/player/volume", {
			method: "PUT",
			headers: {
				'Authorization': 'Bearer ' + this.accessToken,
				'Content-Type': 'application/json'
			},
			volume_percent: percentage
		});
		window.fetch(volume).then((response) => {
			if (response.status === 403) {
				this.player.setVolume(percentage / 100);
			}
		})
			.catch((err) => {
				console.error(err);
			});
	}

	async togglePlayBack() {
		let state = await this.getState();
		let toggle = state.is_playing ? "pause" : "play";
		let togglePlayBack = new Request(`https://api.spotify.com/v1/me/player/${toggle}`, {
			method: "PUT",
			headers: {
				'Authorization': 'Bearer ' + this.accessToken,
				'Content-Type': 'application/json'
			}
		});
		window.fetch(togglePlayBack).then((response) => {
			if (response.status === 403) {
				browser.tabs.get(this.scriptId)
					.then(() => { browser.tabs.sendMessage(this.scriptId, "play"); })
					.catch(() => { this.player.togglePlay(); });
			}
		})
			.catch((err) => {
				console.error(err);
			});
	}

	updateToken(accessToken) {
		this.accessToken = accessToken;
	}
}

export { Webplayer };