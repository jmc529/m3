let current = 'general'

function instantiateListeners() {
  document.getElementById('general').addEventListener('click', () => {
    switchTabTo('general')
  })
  document.getElementById('spotify').addEventListener('click', () => {
    switchTabTo('spotify')
  })
  document.getElementById('donate').addEventListener('click', () => {
    switchTabTo('donate')
  })
  document.getElementById('save-spotify').addEventListener('click', () => {
    saveData()
  })
  document.getElementById('reset-spotify').addEventListener('click', () => {
    populateData()
  })
  document.getElementById('save-general').addEventListener('click', () => {
    saveData()
  })
  document.getElementById('reset-general').addEventListener('click', () => {
    populateData()
  })
}

function populateCommandBoxes() {
  const COMMAND_TEMPLATE = document.getElementById('command-template')

  function cloneCommandTemplateTo(name) {
    let template = COMMAND_TEMPLATE.content.cloneNode(true)
    template.getElementById('legend').innerText = name
    template.getElementById('modifer').setAttribute('id', `${name}-modifer`)
    template.getElementById('key').setAttribute('id', `${name}-key`)
    template.querySelector('label').setAttribute('for', `${name}-shift`)
    let input = template.querySelector('input')
    input.setAttribute('id', `${name}-shift`)
    input.setAttribute('name', `${name}-shift`)
    return template
  }

  const SHUFFLE = document.getElementById('shuffle')
  const PREVIOUS = document.getElementById('previous')
  const PLAY_PAUSE = document.getElementById('play/pause')
  const NEXT = document.getElementById('next')
  const REPEAT = document.getElementById('repeat')

  SHUFFLE.appendChild(cloneCommandTemplateTo('Shuffle'))
  PREVIOUS.appendChild(cloneCommandTemplateTo('Previous'))
  PLAY_PAUSE.appendChild(cloneCommandTemplateTo('Play/Pause'))
  NEXT.appendChild(cloneCommandTemplateTo('Next'))
  REPEAT.appendChild(cloneCommandTemplateTo('Repeat'))
}

async function populateData() {
  let data = await browser.storage.local.get()
  /*Notifications*/
  document.generalForm.notify.value = data.options.notify
  /*MediaKey*/
  document.getElementById('prev').checked = data.options.mediaPrev
  document.getElementById('play').checked = data.options.mediaPlay
  document.getElementById('next').checked = data.options.mediaNext
  /*Command Keys*/
  document.getElementById('Shuffle-modifer').value =
    data.options.shuffle.modifer
  document.getElementById('Previous-modifer').value = data.options.prev.modifer
  document.getElementById('Play/Pause-modifer').value =
    data.options.play.modifer
  document.getElementById('Next-modifer').value = data.options.next.modifer
  document.getElementById('Repeat-modifer').value = data.options.repeat.modifer

  document.getElementById('Shuffle-shift').checked = data.options.shuffle.shift
  document.getElementById('Previous-shift').checked = data.options.prev.shift
  document.getElementById('Play/Pause-shift').checked = data.options.play.shift
  document.getElementById('Next-shift').checked = data.options.next.shift
  document.getElementById('Repeat-shift').checked = data.options.repeat.shift

  document.getElementById('Shuffle-key').value = data.options.shuffle.key
  document.getElementById('Previous-key').value = data.options.prev.key
  document.getElementById('Play/Pause-key').value = data.options.play.key
  document.getElementById('Next-key').value = data.options.next.key
  document.getElementById('Repeat-key').value = data.options.repeat.key
  /*Spotify Tabs*/
  document.spotifyForm.spotifyTab.value = data.options.spotifyTab
}

function populateMediaKeys() {
  const KEY_TEMPLATE = document.getElementById('media-key-template')

  function cloneKeyTemplateTo(name, key) {
    let template = KEY_TEMPLATE.content.cloneNode(true)
    let label = template.querySelector('label')
    label.setAttribute('for', key)
    let p = document.createElement('P')
    p.innerText = `Use "${name}"`
    label.appendChild(p)
    let input = template.querySelector('input')
    input.setAttribute('id', key)
    input.setAttribute('name', key)
    return template
  }

  const PREVIOUS = document.getElementById('prev-track')
  const PLAY_PAUSE = document.getElementById('play-track')
  const NEXT = document.getElementById('next-track')

  PREVIOUS.appendChild(cloneKeyTemplateTo('MediaPrevTrack', 'prev'))
  PLAY_PAUSE.appendChild(cloneKeyTemplateTo('MediaPlayPause', 'play'))
  NEXT.appendChild(cloneKeyTemplateTo('MediaNextTrack', 'next'))
}

async function saveData() {
  let data = await browser.storage.local.get()
  let generalData = new FormData(document.getElementById('general-form'))
  let spotifyData = new FormData(document.getElementById('spotify-form'))
  /*Notifications*/
  data.options.notify = generalData.get('notify')
  /*MediaKey*/
  data.options.mediaPrev = document.getElementById('prev').checked
  data.options.mediaPlay = document.getElementById('play').checked
  data.options.mediaNext = document.getElementById('next').checked
  /*Command Keys*/
  data.options.shuffle.modifer = document.getElementById(
    'Shuffle-modifer'
  ).value
  data.options.prev.modifer = document.getElementById('Previous-modifer').value
  data.options.play.modifer = document.getElementById(
    'Play/Pause-modifer'
  ).value
  data.options.next.modifer = document.getElementById('Next-modifer').value
  data.options.repeat.modifer = document.getElementById('Repeat-modifer').value

  data.options.shuffle.shift = document.getElementById('Shuffle-shift').checked
  data.options.prev.shift = document.getElementById('Previous-shift').checked
  data.options.play.shift = document.getElementById('Play/Pause-shift').checked
  data.options.next.shift = document.getElementById('Next-shift').checked
  data.options.repeat.shift = document.getElementById('Repeat-shift').checked

  data.options.shuffle.key = document.getElementById('Shuffle-key').value
  data.options.prev.key = document.getElementById('Previous-key').value
  data.options.play.key = document.getElementById('Play/Pause-key').value
  data.options.next.key = document.getElementById('Next-key').value
  data.options.repeat.key = document.getElementById('Repeat-key').value
  /*Spotify Tabs*/
  data.options.spotifyTab = spotifyData.get('spotifyTab')

  browser.storage.local.set(data)
  updateCommands()
  browser.runtime.reload()
}

function switchTabTo(newTab) {
  document.getElementById(current).classList.remove('active')
  document.getElementById(newTab).classList.add('active')
  document.getElementById(`${current}-window`).classList.add('hidden')
  document.getElementById(`${newTab}-window`).classList.remove('hidden')
  current = newTab
}

async function updateCommands() {
  let data = await browser.storage.local.get()
  function updateCmd(name, shortcutObject) {
    let shortcut = shortcutObject.shift
      ? `${shortcutObject.modifer}+Shift+${shortcutObject.key}`
      : `${shortcutObject.modifer}+${shortcutObject.key}`
    browser.commands.update({
      name: name,
      shortcut: shortcut,
    })
  }
  updateCmd('shuffle', data.options.shuffle)
  updateCmd('repeat', data.options.repeat)
  if (data.options.mediaPrev) {
    browser.commands.reset('previous-track')
  } else {
    updateCmd('previous-track', data.options.prev)
  }
  if (data.options.mediaPlay) {
    browser.commands.reset('play-track')
  } else {
    updateCmd('play-track', data.options.play)
  }
  if (data.options.mediaNext) {
    browser.commands.reset('next-track')
  } else {
    updateCmd('next-track', data.options.next)
  }
}

populateCommandBoxes()
populateMediaKeys()
populateData()
instantiateListeners()
