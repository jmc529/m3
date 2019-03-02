class WebPlayer {
    constructor(player) {
        this.player = player;
    }

    connect() {    
        // Error handling
        this.player.addListener('initialization_error', ({ message }) => { console.error(message); });
        this.player.addListener('authentication_error', ({ message }) => { console.error(message); });
        this.player.addListener('account_error', ({ message }) => { console.error(message); });
        this.player.addListener('playback_error', ({ message }) => { console.error(message); });

        // Ready
        this.player.addListener('ready', ({ device_id }) => {
          console.log('Ready with Device ID', device_id);
        });

        // Not Ready
        this.player.addListener('not_ready', ({ device_id }) => {
          console.log('Device ID has gone offline', device_id);
        });

        // Connect to the player!
        this.player.connect();
    }

    disconnect() {
        this.player.disconnect();    
    }

    async getCurrentState() {
        let state = await this.player.getCurrentState();
        if (!state) {
            console.error('User is not playing music through the Web Playback SDK');
            return;
        }
        
        let {
                current_track,
                next_tracks: [next_track]
            } = state.track_window;

        console.log('Currently Playing', current_track);
        console.log('Playing Next', next_track);
    }

}

export { WebPlayer };