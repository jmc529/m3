/**
 * Container class for songs
 */
class Song {
	constructor(album, albumImage, artist, duration, title) {
		this.album = album;
		this.albumImage = albumImage; 
		this.artist = artist;
    	this.duration = duration;
    	this.title = title;
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
		return this.title;
	}
}

export { Song };