import { getTokenData } from "./oauth.js"

async function webplayBack() {
    const tokens = await getTokenData();
    browser.storage.local.set({access_token: tokens[0], refresh_token: tokens[1]});
    const player = new Spotify.Player({
        name: 'M3',
        getOAuthToken: callback => {
            callback(tokens[0]);
        }
    });

    // Error handling
    player.addListener('initialization_error', ({ message }) => { console.error(message); });
    player.addListener('authentication_error', ({ message }) => { console.error(message); });
    player.addListener('account_error', ({ message }) => { console.error(message); });
    player.addListener('playback_error', ({ message }) => { console.error(message); });

    // Playback status updates
    player.addListener('player_state_changed', state => { console.log(state); });

    // Ready
    player.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
    });

    // Not Ready
    player.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id);
    });

    // Connect to the player!
    player.connect();
}

window.onSpotifyWebPlaybackSDKReady = webplayBack;