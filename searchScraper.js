// @ts-check
import fs from 'node:fs/promises'
import { spawn, Pool, Worker } from 'threads'

const argv = process.argv.slice(2)
const USE_CACHE = argv.includes('--use-cache')
if (USE_CACHE) console.log('Will use cached search queries')

console.time('scrape')
await fs.mkdir(new URL('./search/', import.meta.url)).catch(() => {})
const pool = Pool(() => spawn(new Worker('./worker')), { size: 13 })

const results = []

const job =
  query =>
  async ({ scrape }) => {
    const uri = `https://search-api.epfl.ch/api/ldap?q=${query}&showall=0&hl=en&pageSize=all&siteSearch=people.epfl.ch`
    try {
      console.log(`Scraping "${query}" ${uri}`)
      const scrapedTxt = await scrape(uri)
      const res = JSON.parse(scrapedTxt)
      await fs.writeFile(new URL(`./search/${query.replace(/\*/g, '')}.json`, import.meta.url), scrapedTxt)
      results.push(res)
      console.log(`[OK] "${query}" ${uri}`)
    } catch (err) {
      console.error(`[FAIL] "${query}" ${uri}`)
      console.error(err)
    }
  }

for (let i = 0; i < 26; i++) {
  const letter = String.fromCharCode(97 + i)
  if (USE_CACHE) {
    const path = `./search/${letter}.json`
    console.log(`[OK] ${path}`)
    results.push(JSON.parse(await fs.readFile(new URL(path, import.meta.url), 'utf8')))
    // @ts-ignore
  } else pool.queue(job(`${letter}*`))
}

if (!USE_CACHE) await pool.settled()

await pool.terminate()

// Move all sub-array into one big array at the root, then remove duplicates and sort
const seenUsernames = new Set()
const cleanedResults = results
  .flat()
  .reduce((acc, cur) => {
    if (!seenUsernames.has(cur.profile)) {
      seenUsernames.add(cur.profile)
      acc.push(cur)
    }
    return acc
  }, [])
  .sort((a, b) => (a.profile < b.profile ? -1 : a.profile < b.profile ? 1 : 0))

const emails = cleanedResults.map(x => x.email).filter(x => x)
const usernames = cleanedResults.map(x => x.profile).filter(x => x)

await fs.writeFile(new URL(`./output.json`, import.meta.url), JSON.stringify(cleanedResults, null, 2))
await fs.writeFile(new URL(`./output.min.json`, import.meta.url), JSON.stringify(cleanedResults))
await fs.writeFile(new URL(`./output.emails.txt`, import.meta.url), emails.join('\n'))
await fs.writeFile(new URL(`./output.usernames.txt`, import.meta.url), usernames.join('\n'))

console.log('Done!')
console.timeEnd('scrape')
