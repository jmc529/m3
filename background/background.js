import { Webplayer } from './Webplayer.js'
import { getAccessToken } from './oauth/SpotifyAuthorization.js'
import { Song } from '../popup/Song.js'

let interval, songId, webplayer

window.onSpotifyWebPlaybackSDKReady = () => {
  browser.runtime.onMessage.addListener((req, sender, res) => {
    if (req.start) {
      start()
    }
  })
}

async function start() {
  let data = await browser.storage.local.get()
  if (data.expire_time === undefined) {
    await getAccessToken()
  }

  let player = new Spotify.Player({
    name: 'M3',
    getOAuthToken: async (callback) => {
      data = await browser.storage.local.get()
      if (Date.now() * 1000 > data.expire_time) {
        await getAccessToken()
        data = await browser.storage.local.get()
        if (webplayer !== undefined) {
          webplayer.updateToken(data.access_token)
        }
      }
      callback(data.access_token)
    },
  })

  if (data.access_token !== undefined) {
    await loadOptions(player, data)
    setControls()
  }
}

async function loadOptions(player, data) {
  webplayer = new Webplayer(data.access_token, player)
  webplayer.instantiateListeners()
  webplayer.connect()

  if (data.options.notify === 'on') {
    interval = window.setInterval(displayNotification, 1000)
  } else {
    window.clearInterval(interval)
  }
}

function setControls(player) {
  /* Listener that interprets requests sent from popup and sends a request to Spotify */
  browser.runtime.onMessage.addListener((req, sender, res) => {
    switch (Object.keys(req)[0]) {
      case 'state':
        return webplayer.getState()
        break
      case 'setVolume':
        webplayer.setVolume(req.setVolume)
        break
      case 'togglePlayBack':
        webplayer.togglePlayBack()
        break
      case 'seek':
        webplayer.seek(req.seek)
        break
      case 'forward':
        webplayer.nextTrack()
        break
      case 'backward':
        webplayer.previousTrack()
        break
      case 'toggleShuffle':
        webplayer.setShuffle()
        break
      case 'repeat':
        webplayer.setRepeat()
        break
      case 'queue':
        return webplayer.getQueue()
        break
      case 'search':
        return webplayer.search(req.search)
        break
      case 'playSong':
        webplayer.playTrack(req.playSong)
        break
    }
  })

  browser.commands.onCommand.addListener(function (command) {
    if (command === 'previous-track') {
      webplayer.previousTrack()
    } else if (command === 'play-track') {
      webplayer.togglePlayBack()
    } else if (command === 'next-track') {
      webplayer.nextTrack()
    } else if (command === 'shuffle') {
      webplayer.setShuffle()
    } else if (command === 'repeat') {
      webplayer.setRepeat()
    }
  })
}

async function displayNotification() {
  let state = await webplayer.getState()
  if (state.item.id && state.item.id !== songId) {
    songId = state.item.id ? state.item.id : state.track_window.current_track.id
    let song = new Song(state.item)
    browser.notifications.create('song-notification', {
      type: 'basic',
      iconUrl: song.albumImage,
      title: song.title,
      message: song.artist,
    })
    window.setTimeout(() => {
      browser.notifications.clear('song-notification')
    }, 2500)
  }
}

async function defaultOptions() {
  let data = await browser.storage.local.get()
  data.options = {
    notify: 'on',
    mediaPrev: false,
    mediaPlay: true,
    mediaNext: false,
    shuffle: {
      modifer: 'Ctrl',
      shift: true,
      key: 'End',
    },
    prev: {
      modifer: 'Ctrl',
      shift: true,
      key: 'Insert',
    },
    play: {
      modifer: 'Ctrl',
      shift: false,
      key: 'A',
    },
    next: {
      modifer: 'Ctrl',
      shift: true,
      key: 'Delete',
    },
    repeat: {
      modifer: 'Ctrl',
      shift: true,
      key: 'Home',
    }
  }

  browser.storage.local.set(data)
}

async function handleUpdate(details) {
  if (details.reason === 'update') {
    let data = await browser.storage.local.get()
    if (data.access_token) {
      start()
    }
  }
}

browser.runtime.onInstalled.addListener(handleUpdate)
browser.runtime.onInstalled.addListener(defaultOptions)
