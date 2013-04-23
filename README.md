
Bookmarklet: sane development, familiar format
==============================================

Bookmarklet is a nodejs module for compiling bookmarklets in server-side code and directly from the shell.

You can run it on any JavaScript file—it will minify it using uglify-js, wrap it in a self executing function, and return an escaped bookmarklet.

More so, it supports a metadata block—modeled after the [greasemonkey user script block]—to specify metadata and script includes, which can look like this:

    // ==Bookmarklet==
    // @name LoveGames
    // @author Old Gregg
    // @script https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
    // ==/Bookmarklet==

Most notably, you can specify any external scripts that you’d like your bookmarklet to include via the `@script` rule, which can be repeated as many times as you’d like.

This project is new and open to suggestions & pull requests.
