#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const bookmarklet = require('../bookmarklet');

//
// Input parsing
//

var args = process.argv.slice(2);

if (['-V', '--version'].some(flag => args.indexOf(flag) !== -1)) {
  console.log(bookmarklet.version.join('.'));
  process.exit(0);
}

function help() {
  console.error(
    `Bookmarklet v${bookmarklet.version.join(
      '.'
    )} usage: bookmarklet source [destination]

source      - path to file to read from or ` -
      ` for stdin',
destination - path to file to write to

More info: https://github.com/mrcoles/bookmarklet
    `
  );
}

function die(msg) {
  msg && console.error(`[ERROR] bookmarklet: ${msg}`);
  process.exit(1);
}

function warn(msg) {
  console.error(`[WARN] bookmarklet: ${msg}`);
}

if (
  args.length == 0 ||
  args.filter(arg => arg == '-h' || arg == '--help').length
) {
  help();
  process.exit(0);
}

if (args.length > 2) {
  die('invalid arguments, run with --help to see usage.\n\n');
}

var source = args[0];
var destination = args[1];

var readStdin = source === '-';
var writeStdout = !destination;

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

  var code = bookmarklet.convert(data.code, data.options);
  if (destination) {
    fs.writeFileSync(destination, code);
  } else {
    console.log(code);
  }
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
