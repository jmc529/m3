class Song {
	constructor(album, albumImage, artist, duration, songName) {
		this.album = album;
		this.albumImage = albumImage; 
		this.artist = artist;
    	this.duration = duration;
    	this.songName = songName;
	}

	/** GETTERS **/
	get album() {
		return this.album;
	}

	get albumImage() {
		return this.albumImage;
	}

	get artist() {
		return this.artist;
	}

	get duration() {
		return this.duration;
	}

	get title() {
		return this.songName;
	}
}

export { Song };