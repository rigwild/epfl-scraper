import fetch from 'node-fetch'
import { expose } from 'threads/worker'

expose({
  /** @param {string} uri */
  scrape(uri) {
    return fetch(uri).then(res => res.text())
  }
})
