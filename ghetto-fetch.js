window.ghettoFetch = (() => {

const pages = new Map()

const fetchPage = url => {
  if (pages.get(url)) return pages.get(url)

  return fetch(url)
    .then(response => { return response.text() })
    .then(htmlString => {
      return addPage(url, htmlString)
    })
}

const prefetchImages = images => {
  images.map(img => {
    document.head.appendChild(Object.assign(document.createElement('link'), {
      rel: 'prefetch',
      href: img.src
    }))
  })
}

const addPage = (url, htmlString) => {
  const container = document.createElement('div')
  let newMain

  container.innerHTML = htmlString
  newMain = container.querySelector('main')

  pages.set(url, Promise.resolve(newMain))

  prefetchImages(Array.from(newMain.querySelectorAll('img')))
}

const updatePage = url => {
  var main = document.querySelector('main')

  pages.get(url).then(newMain => { main.replaceWith(newMain) })
}

const updateHistory = url => {
  const path = url.split('/').slice(-1)[0],
        title = document.title || path

  history.pushState({}, title , url)
}

const onHover = event => {
  var url = event.srcElement.href

  if (event.srcElement.nodeName !== 'A') return
  else if (url.indexOf(location.hostname) === -1) return
  else if (pages.get(url)) return
  else fetchPage(url)

}

const onClick = event => {
  const url = event.srcElement.href

  event.preventDefault()

  if (event.srcElement.nodeName !== 'A') return
  else if (url.indexOf(location.hostname) >= 0) {
    fetchPage(url).then(() => {
      updatePage(url)
      updateHistory(url)
    })
  }
  else window.location = url
}

const onHistoryChange = () => { updatePage(location.href) }

const listeners = (on) => {
  const func = `${ on ? `add` : `remove`}EventListener`

  document[func]('mouseover', onHover)
  document[func]('click', onClick)
  window[func]('popstate', onHistoryChange)
}

return {
  init: (options) => {
    addPage(location.href, document.body.innerHTML)
    listeners(true)
  },
  stop: () => {
    removeListeners()
    listeners(false)
  }
}

})()