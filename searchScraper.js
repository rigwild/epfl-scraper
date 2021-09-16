//@ts-check
import fs from 'node:fs/promises'
import { spawn, Pool, Worker } from 'threads'

console.time('scrape')
await fs.mkdir(new URL('./search/', import.meta.url)).catch(() => {})
const pool = Pool(() => spawn(new Worker('./worker')), { size: 13 })

let results = []

const job =
  query =>
  async ({ scrape }) => {
    const uri = `https://search-api.epfl.ch/api/ldap?q=${query}&showall=0&hl=en&pageSize=all&siteSearch=people.epfl.ch`
    try {
      console.log(`Scraping "${query}" ${uri}`)
      const res = JSON.parse(await scrape(uri))
      await fs.writeFile(
        new URL(`./search/${query.replace(/\*/g, '')}.json`, import.meta.url),
        JSON.stringify(res, null, 2)
      )
      results.push(res)
      console.log(`[OK] "${query}" ${uri}`)
    } catch {
      console.error(`[FAIL] "${query}" ${uri}`)
    }
  }

for (let i = 0; i < 26; i++) pool.queue(job(`${String.fromCharCode(97 + i)}*`))

await pool.settled()
await pool.terminate()

results = results.reduce((acc, cur) => (cur.forEach(x => acc.add(x)), acc), new Set())
results = [...results].sort((a, b) => (a.profile < b.profile ? -1 : a.profile < b.profile ? 1 : 0))

await fs.writeFile(new URL(`./output.json`, import.meta.url), JSON.stringify(results, null, 2))
await fs.writeFile(new URL(`./output.min.json`, import.meta.url), JSON.stringify(results))

console.log('Done!')
console.timeEnd('scrape')
