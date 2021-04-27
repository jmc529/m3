browser.runtime.onMessage.addListener((message) => {
  let value
  if (message.type !==undefined){
    value = message.value
    message = message.type
  } 
  switch (message) {
    case 'shuffle':
      clickElementByRole(shuffleButton)
      break
    case 'previous':
      clickElementByTitle(previousButton)
      break
    case 'play':
      clickElementByTitle(playButton)
      clickElementByTitle(pauseButton)
      break
    case 'playTrack':
      setTimeout(() => {
        clickElementByTitle(playButton)
      }, 1000)
      break
    case 'next':
      clickElementByTitle(nextButton)
      break
    case 'repeat':
      clickElementByRole(repeatButton)
      break
    case 'seek':
      clickScrollBarByClassName(progressBar, value)
      break
    case 'volume':
      clickScrollBarByClassName(volumeBar, value)
      break
  }
})

const shuffleButton = 'switch'
const previousButton = 'Previous'
const playButton = 'Play'
const pauseButton = 'Pause'
const nextButton = 'Next'
const repeatButton = 'checkbox'
const progressBar = 'progress-bar'
const volumeBar = 'volume-bar'

function clickElementByTitle(title) {
  const button = document
    .getElementsByClassName('player-controls')[0]
    .querySelector(`[title=${title}]`)
  if (button == null) return
  simulateMouseClick(button)
}

function clickElementByRole(role) {
  const button = document
    .getElementsByClassName('player-controls')[0]
    .querySelector(`[role=${role}]`)
  if (button == null) return
  simulateMouseClick(button)
}

function clickScrollBarByClassName(className, x) {
  console.log(className, x)
  const button = document.getElementsByClassName(className)[0]
  if (button == null) return
  simulateMouseClickX(button, x)
}

function simulateMouseClick(element) {
  element.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      buttons: 1,
    })
  )
}

function simulateMouseClickX(element, x) {
  element.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      buttons: 1,
      screenX: x,
    })
  )
}
