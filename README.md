# Bookmarklet: sane development, familiar format

[![Build Status](https://travis-ci.org/mrcoles/bookmarklet.svg?branch=master)](https://travis-ci.org/mrcoles/bookmarklet)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

Bookmarklet is a nodejs module for compiling bookmarklets in server-side code and directly from the shell. You can run it on any JavaScript file—it will minify it using [terser][], wrap it in a self executing function, and return an escaped bookmarklet.

More so, it supports a metadata block—modeled after the [greasemonkey userscript metadata block](http://wiki.greasespot.net/Metadata_Block)—to specify metadata, external stylesheets and script includes, which can look like this:

    // ==Bookmarklet==
    // @name LoveGames
    // @author Old Gregg
    // @style !loadOnce https://mrcoles.com/media/css/silly.css
    // @script https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
    // ==/Bookmarklet==

Most notably, you can specify any external scripts that you’d like your bookmarklet to include via the `@script` rule, which can be repeated as many times as you’d like.

NOTE: currently with script includes you have to handle `noConflict` scenarios yourself, e.g., you might want to start off a script with `var $ = jQuery.noConflict(true)`.

In addition, any css files included with `@style` will be injected.

By default, every time the bookmark is hit, it will add the script and style tags again. You customize each one per line by adding a `!loadOnce` declaration between the `@style` or `@script` param and the path for the asset. See the example above.

As of v1.0.0, this now uses Babel with the present "env" to make the code backwards compatible before minifying it.

This project is open to suggestions & pull requests.

Also, if you’re just looking for a quick way to throw together a bookmarklet, try my [browser-based bookmarklet creator](http://mrcoles.com/bookmarklet/).

### Installation

The dependency can be found on [NPM as “bookmarklet”](https://www.npmjs.org/package/bookmarklet). You can install it with:

```bash
npm install bookmarklet
```

### Usage

You can easily see usage by running `bookmarklet -h`:

```bash
> bookmarklet -h
Bookmarklet v3.0.0

Usage: bookmarklet [options] source [destination]
  source       path to file to read from or - for stdin
  destination  path to file to write to

Options:
  -d, --demo   generate a demo HTML page
  -m, --minify options for minifier in JSON format
```

The default output is the raw bookmarlet code. _NEW_ add the `--demo` flag to output a test HTML page that includes the bookmarklet on it.

### Testing

A very basic test script can be run via `bash test/run.sh`



[terser]: https://github.com/terser/terser
