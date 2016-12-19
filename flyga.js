window.flyga = (() => {

const pages = new Map(),
      defaults = {
        selector: 'main',
        nrOfImagesToPrefetch: 10
      }

let options

const fetchPage = url => {
  if (pages.get(url)) return pages.get(url)

  return fetch(url)
    .then(response => { return response.text() })
    .then(htmlString => {
      return addPage(url, htmlString)
    })
}

const prefetchImages = images => {
  images.splice(0, options.nrOfImagesToPrefetch).map(img => {
    document.head.appendChild(Object.assign(document.createElement('link'), {
      rel: 'prefetch',
      href: img.src
    }))
  })
}

const addPage = (url, htmlString) => {
  const container = document.createElement('div')
  let newContainer

  container.innerHTML = htmlString
  newContainer = container.querySelector(options.selector)

  pages.set(url, Promise.resolve(newContainer))

  prefetchImages(Array.from(newContainer.querySelectorAll('img')))
}

const updatePage = url => {
  var container = document.querySelector(options.selector)

  pages.get(url).then(newContainer => {
    container.replaceWith(newContainer)

    Array.from(newContainer.querySelectorAll('script')).map(script => {
      const newScript = document.createElement('script')

      newScript.innerHTML = script.innerHTML
      script.replaceWith(newScript)
    })
  })
}

const updateHistory = url => {
  const path = url.split('/').slice(-1)[0],
        title = document.title || path

  history.pushState({}, title , url)
}

const onHover = event => {
  var url = event.srcElement.href

  if (
    event.srcElement.nodeName !== 'A' ||
    url.indexOf(location.hostname) === -1 ||
    pages.get(url)
  ) return

  else fetchPage(url)
}

const onClick = event => {
  const url = event.srcElement.href

  event.preventDefault()

  if (event.srcElement.nodeName !== 'A') return
  if (url.indexOf(location.hostname) >= 0) return fetchPage(url).then(() => {
      updatePage(url)
      updateHistory(url)
    })
  else window.location = url
}

const onUserHistoryInteraction = () => { updatePage(location.href) }

const listeners = (on) => {
  const func = `${ on ? `add` : `remove`}EventListener`

  document[func]('mouseover', onHover)
  document[func]('click', onClick)
  window[func]('popstate', onUserHistoryInteraction)
}

return {
  init: (opts) => {
    options = Object.assign(defaults, opts)

    addPage(location.href, document.body.innerHTML)
    listeners(true)
  },
  stop: () => {
    removeListeners()
    listeners(false)
  }
}

})()