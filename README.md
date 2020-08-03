# Utopia Engine Backend

[![Build Status](https://travis-ci.com/AbstractPlay/renderer.svg?branch=master)](https://travis-ci.com/AbstractPlay/renderer)

Manages a game of [Utopia Engine (3rd ed.)](https://boardgamegeek.com/boardgame/75223/utopia-engine). The HTML and text-based frontends will be housed in different repositories.

## Deploy

This is a basic NPM module; it's just private. It's not meant to be generally useful to anyone outside of myself. If someone does use this elsewhere, let me know :)

- Clone the repo.
- From the newly created folder, run the following commands:
  - `npm install` (installs dependencies)
  - `npm run test` (makes sure everything is working)
  - `npm run build` (compiles the TypeScript files into the `./build` folder)
  - `npm run dist-dev` (or `dist-prod` if you want it minified; bundles everything for the browser into the `./dist` folder)
