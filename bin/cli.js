#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const yargs = require('yargs/yargs');
const JSON5 = require('json5');
const bookmarklet = require('../bookmarklet');

//
// Input parsing
//

const argv = yargs(process.argv.slice(2))
  .command('<source> [destination]', false)
  .version(false).help(false)
  .option('version', {alias: 'V', type: 'boolean'})
  .option('help', {alias: 'h', type: 'boolean'})
  .option('demo', {alias: 'd', type: 'boolean'})
  .option('minify', {alias: 'm', type: 'string'})
  .argv;

let [source, destination] = argv._;

if (argv.version) {
  console.log(bookmarklet.version.join('.'));
  process.exit(0);
}

function help() {
  console.error(`
Bookmarklet v${bookmarklet.version.join('.')}

Usage: bookmarklet [options] source [destination]
  source       path to file to read from or - for stdin
  destination  path to file to write to

Options:
  -d, --demo   generate a demo HTML page
  -m, --minify options for minifier in JSON format

More info: https://github.com/mrcoles/bookmarklet
  `);
}

function die(msg) {
  msg && console.error(`[ERROR] bookmarklet: ${msg}`);
  process.exit(1);
}

function warn(msg) {
  console.error(`[WARN] bookmarklet: ${msg}`);
}

// flags

const makeDemo = argv.demo;

// help

if (argv._.length == 0 || argv.help) {
  help();
  process.exit(0);
}

// minify options

let minifyOptions;

if (argv.minify) {
  try {
    minifyOptions = JSON5.parse(argv.minify);
  } catch (e) {
    die(`Fail parsing minify option: ${e.message}`);
  }
}

// file paths

if (argv._.length > 2) {
  die('invalid arguments, run with --help to see usage.\n\n');
}

const readStdin = source === '-';

if (source && source[0] !== '/' && !readStdin) {
  source = path.join(process.cwd(), source);
}

if (destination) {
  if (destination[0] !== '/') {
    destination = path.join(process.cwd(), destination);
  }
  let isDirectory = destination.endsWith('/');
  if (!isDirectory) {
    try {
      let destStat = fs.statSync(destination);
      isDirectory = destStat.isDirectory();
    } catch (e) {}
  }

  if (isDirectory) {
    if (readStdin) {
      die('must name output file if reading from stdin\n\n');
    }

    let filename = path.basename(source);
    destination = path.join(destination, filename);
  }
}

//
// Main
//

function dataCallback(e, data) {
  if (e) {
    die(e.message);
  }

  data = bookmarklet.parseFile(data);

  if (data.errors) {
    die(data.errors.join('\n'));
  }

  return bookmarklet
    .convert(data.code, data.options, minifyOptions)
    .then(code => {
      if (makeDemo) {
        code = bookmarklet.makeDemo(code, data.options);
      }

      if (destination) {
        fs.writeFileSync(destination, code);
      } else {
        console.log(code);
      }
    })
    .catch(e => {
      die(e);
    });
}

if (source !== '-') {
  fs.readFile(source, 'utf8', dataCallback);
} else {
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  var buffer = '';
  process.stdin.on('data', data => (buffer += data));
  process.stdin.on('end', () => dataCallback(false, buffer));
}
