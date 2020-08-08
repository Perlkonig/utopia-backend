# Utopia Engine Backend

[![Build Status](https://travis-ci.com/AbstractPlay/renderer.svg?branch=master)](https://travis-ci.com/AbstractPlay/renderer)

Manages a game of [Utopia Engine (3rd ed.)](https://boardgamegeek.com/boardgame/75223/utopia-engine). The HTML and text-based frontends will be housed in different repositories.

## Deploy

This is an unpublished NPM module.

To develop:

- Clone the repo.
- From the newly created folder, run the following commands:
  - `npm install` (installs dependencies)
  - `npm run test` (makes sure everything is working)
  - `npm run build` (compiles the TypeScript files into the `./build` folder)
  - `npm run dist-dev` (or `dist-prod` if you want it minified; bundles everything for the browser into the `./dist` folder)

To use (you want to write a front end for the game):

- Install with the following form `git+https://github.com/Perlkonig/utopia-backend.git`
- No API docs yet, but once it's finished, I will draft those up.
