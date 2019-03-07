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
		this.album = stateObject.track_window.current_track.album.name;
		this.albumImage = stateObject.track_window.current_track.album.images[0];
		this.albumUrl = "https://open.spotify.com/album/" 
			+ stateObject.track_window.current_track.album.uri.slice(14);
		this.artist = stateObject.track_window.current_track.artists[0];
		this.artistUrl = "https://open.spotify.com/artist/" 
			+ stateObject.track_window.current_track.artists[0].uri.slice(15);
    	this.duration = stateObject.track_window.current_track.duration_ms;
    	this.position = stateObject.position;
    	this.title = stateObject.track_window.current_track.name;
    	this.url = "https://open.spotify.com/track/" 
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