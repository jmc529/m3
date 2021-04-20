browser.runtime.onMessage.addListener((message) => {
  switch (message) {
    case 'shuffle':
      clickBasedOnXPath(shuffleButtonPath)
      break
    case 'previous':
      clickBasedOnXPath(previousButtonPath)
      break
    case 'play':
      clickBasedOnXPath(playPauseButtonPath)
      break
    case 'playTrack':
      setTimeout(() => {
        clickBasedOnXPath(playTrackButtonPath)
      }, 3000)
      break
    case 'next':
      console.log('next')
      clickBasedOnXPath(nextButtonPath)
      break
    case 'repeat':
      clickBasedOnXPath(repeatButtonPath)
      break
    case 'connect':
      clickBasedOnXPath(connectButtonPath)
      setTimeout(() => {
        try {
          let devicePath = document.evaluate(
            devicesButtonPath,
            document,
            null,
            XPathResult.UNORDERED_NODE_ITERATOR_TYPE,
            null
          )
          let devices = devicePath.iterateNext()
          let children = devices.childNodes
          for (node in children) {
            let name = children[node].innerText
            if (name.includes('M3')) {
              simulateMouseClick(children[node])
              break
            }
          }
          simulateMouseClick(devices)
        } catch (e) {
          console.error(e)
        }
      }, 2000)
      break
  }
})

/* Code below was heavily inspired from and copied from https://github.com/carlin-q-scott/browser-media-players */
let shuffleButtonPath =
  '/html/body/div[1]/div/div[4]/div[3]/footer/div[1]/div[2]/div/div[1]/button[1]'
let previousButtonPath =
  '/html/body/div[1]/div/div[4]/div[3]/footer/div[1]/div[2]/div/div[1]/button[2]'
let playPauseButtonPath =
  '/html/body/div[1]/div/div[4]/div[3]/footer/div[1]/div[2]/div/div[1]/button[3]'
let nextButtonPath =
  '/html/body/div[1]/div/div[4]/div[3]/footer/div[1]/div[2]/div/div[1]/button[4]'
let repeatButtonPath =
  '/html/body/div[1]/div/div[4]/div[3]/footer/div[1]/div[2]/div/div[1]/button[5]'
let connectButtonPath =
  '/html/body/div[1]/div/div[4]/div[3]/footer/div[1]/div[3]/div/div/div[2]/span/button'
let devicesButtonPath =
  '/html/body/div[1]/div/div[4]/div[3]/footer/div[1]/div[3]/div/div/div[2]/span/div/div/ul'
let playTrackButtonPath =
  '/html/body/div[1]/div/div[5]/div/div/div[2]/div[1]/button'

function getSingleElementByXpath(path) {
  return document.evaluate(
    path,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue
}

function simulateMouseClick(element) {
  element.dispatchEvent(
    new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
      buttons: 1,
    })
  )
}

function clickBasedOnXPath(path) {
  let button = getSingleElementByXpath(path)
  if (button == null) return
  simulateMouseClick(button)
}
