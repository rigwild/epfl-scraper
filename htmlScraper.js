import fs from 'node:fs/promises'
import fetch from 'node-fetch'
import { spawn, Pool, Worker } from 'threads'

const uriPrefix = 'https://people.epfl.ch/'
const ouputDir = new URL('./output/', import.meta.url)

export const toChunkedArray = (arr, chunkSize = 1) =>
  new Array(Math.ceil(arr.length / chunkSize))
    .fill(0)
    .map((_, i) => arr.slice(i * chunkSize, i * chunkSize + chunkSize))

const getUsernamesList = async () => {
  const xml = await fetch('https://people.epfl.ch/private/common/sitemap.xml').then(res => res.text())
  return [
    ...new Set(
      xml
        .trim()
        .replace(/<url><loc>/g, '')
        .replace(/<\/loc><\/url>/g, '')
        .replace(/https:\/\/people\.epfl\.ch\//g, '')
        .split('\n')
        .slice(2)
        .slice(0, -1)
        .sort()
    )
  ]
}

await fs.mkdir(ouputDir).catch(() => {})

console.time('scrape')
const usernames = await getUsernamesList()
console.log(`Got ${usernames.length} usernames`)
await fs.writeFile(new URL(`./htmlScrape_usernames.txt`, import.meta.url), usernames.join('\n'))

const pool = Pool(() => spawn(new Worker('./worker')), { size: 16, concurrency: 8 })

const chunks = toChunkedArray(usernames, 100)
let addedChunks = 0
let count = 0

const job =
  username =>
  async ({ scrape }) => {
    const uri = `${uriPrefix}${username}`
    try {
      const res = await scrape(uri)
      await fs.writeFile(new URL(`./${username}.html`, ouputDir), res)
      console.log(`[${++count}] Scraped ${uri}`)
    } catch {
      console.error(`[${++count}] FAIL ${uri}`)
    }
  }

// Add to pool in chunks as there's a ton of jobs to run
// else it would timeout just for synchronously adding all the 20k+ jobs at once
const intervalId = setInterval(() => {
  chunks[addedChunks++].forEach(username => pool.queue(job(username)))
  if (addedChunks >= chunks.length) clearInterval(intervalId)
}, 500)

await pool.settled()
await pool.terminate()

console.log('Done!')
console.timeEnd('scrape')
