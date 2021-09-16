# EPFL Scraper

Scrape everything from https://people.epfl.ch, including email addresses.

# Install dependencies

You must use Node.js v14.8+ as this project uses [Top-level await](https://v8.dev/features/top-level-await) and [ES modules](https://v8.dev/features/modules).

```sh
yarn
```

# Run search scraper

Abuse the EPFL search API from https://search.epfl.ch/ to get all the data.

Works by querying each letter in the alphabet followed by a `*` (`a*`, `b*`), then merging the results.

```sh
node searchScraper.js

# If you already have the data cached
node searchScraper.js --use-cache
```

- Individual search queries will be cached to the `search/` directory
- Output will be generated at `output.min.json` (7.0 MB, 20623 entries)
- The full usernames list is generated at `output.usernames.txt` (20623 entries)
- The full mailing list is generated at `output.emails.txt` (18760 entries)

# Run page scraper

EPFL conveniently gives us its [full website sitemap](https://people.epfl.ch/private/common/sitemap.xml).

This will download every HTML pages to the `output/` directory. No parsing is done there, just downloading.

You should probably be careful with your IP with this. It could be mistakenly seen as a DOS attack tentative.

```sh
node htmlScraper.js
```

# License

```
           DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
                   Version 2, December 2004

Copyright (C) 2021 rigwild <me@rigwild.dev>

Everyone is permitted to copy and distribute verbatim or modified
copies of this license document, and changing it is allowed as long
as the name is changed.

           DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
  TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

 0. You just DO WHAT THE FUCK YOU WANT TO.
```
