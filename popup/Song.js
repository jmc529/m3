function msToTime(ms) {
	let time = new Date(ms).toISOString().slice(11, -5);
	if (time.slice(0,3) === "00:") {
	  time = time.slice(3);
	}
	if (time.slice(0,1) === "0") {
	  time = time.slice(1);
	}
	return time;
}

class Song {
	constructor(stateObject) {
		this.album = stateObject.item ? stateObject.item.album.name :
			stateObject.track_window.current_track.album.name;
		this.albumImage = stateObject.item ? stateObject.item.album.images[0] :
			stateObject.track_window.current_track.album.images[0];
		this.albumUrl = stateObject.item ? stateObject.item.album.external_urls.spotify :
			"https://open.spotify.com/album/"
				+ stateObject.track_window.current_track.album.uri.slice(14);
		this.artist = stateObject.item ? stateObject.item.artists[0].name :
			stateObject.track_window.current_track.artists[0].name;
		this.artistUrl = stateObject.item ? stateObject.item.artists[0].external_urls.spotify :
			"https://open.spotify.com/artist/"
				+ stateObject.track_window.current_track.artists[0].uri.slice(15);
    	this.duration = stateObject.item ? stateObject.item.duration_ms :
    		stateObject.track_window.current_track.duration_ms;
    	this.position = stateObject.progress_ms ? stateObject.progress_ms :
    		stateObject.position;
    	this.title = stateObject.item ? stateObject.item.name :
    		stateObject.track_window.current_track.name;
    	this.url = stateObject.item ? stateObject.item.external_urls.spotify :
    		"https://open.spotify.com/track/"
				+ stateObject.track_window.current_track.uri.slice(14);
	}

	getCurrentTime() {
		return msToTime(this.position);
	}

	getCurrentTimeAsPercentage() {
		return Math.floor((this.position/this.duration)*100);
	}	

	getTotalTime() {
		return msToTime(this.duration);
	}

	setCurrentTime(position) {
		this.position = position;
	}
}

export { Song };