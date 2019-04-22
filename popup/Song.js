function msToTime(ms) {
	ms = ms || 0;
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
	constructor(track) {
		this.album = track.album.name;
		this.albumImage = track.album.images[0];
		this.albumUrl = track.album.external_urls.spotify;
		this.artist = track.artists[0].name;
		this.artistUrl = track.artists[0].external_urls.spotify;
    	this.duration = track.duration_ms;
    	this.position = track.progress_ms;
    	this.title = track.name;
    	this.url = track.external_urls.spotify;
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