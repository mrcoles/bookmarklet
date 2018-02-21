const version = [1, 0, 1];

const babel = require('babel-core');
const babelPresetEnv = require('babel-preset-env');
const md5 = require('md5');
const uglify = require('uglify-js');

// metadata
const str = 1;
const list = 2;
const bool = 3;
const metadata = {
  types: {
    string: str,
    list: list,
    boolean: bool
  },
  keys: {
    name: str,
    version: str,
    description: str,
    repository: str,
    author: str,
    email: str,
    url: str,
    license: str,
    script: list,
    style: list
  }
};

function quoteEscape(x) {
  return x.replace('"', '\\"').replace("'", "\\'");
}

function extractOptions(path) {
  // Returns {
  //   path: the updated path string (minus any options)
  //   opts: plain object of options
  // }
  //
  // You can prefix a path with options in the form of:
  //
  // ```
  // @style !loadOnce !foo=false https://example.com/foo.css
  // ```
  //
  // If there is no `=`, then the value of the option defaults to `true`.
  // Values get converted via JSON.parse if possible, o/w they're a string.
  //
  let opts = {};
  while (true) {
    let m = path.match(/^(\![^\s]+)\s+/);
    if (m) {
      path = path.substring(m.index + m[0].length);
      let opt = m[1].substring(1).split('=');
      opts[opt[0]] = opt[1] === undefined ? true : _fuzzyParse(opt[1]);
    } else {
      break;
    }
  }
  return { path, opts };
}

const _fuzzyParse = val => {
  try {
    return JSON.parse(val);
  } catch (e) {
    return val;
  }
};

function loadScript(code, path, loadOnce) {
  loadOnce = !!loadOnce;
  let id = `bookmarklet__script_${md5(path).substring(0, 7)}`;
  return `
        function callback(){
          ${code}
        }

        if (!${loadOnce} || !document.getElementById("${id}")) {
          var s = document.createElement("script");
          if (s.addEventListener) {
            s.addEventListener("load", callback, false)
          } else if (s.readyState) {
            s.onreadystatechange = callback
          }
          if (${loadOnce}) {
            s.id = "${id}";
          }
          s.src = "${quoteEscape(path)}";
          document.body.appendChild(s);
        } else {
          callback();
        }
    `;
}

function loadStyle(code, path, loadOnce) {
  loadOnce = !!loadOnce;
  let id = `bookmarklet__style_${md5(path).substring(0, 7)}`;
  return `${code}
        if (!${loadOnce} || !document.getElementById("${id}")) {
          var link = document.createElement("link");
          if (${loadOnce}) {
            link.id = "${id}";
          }
          link.rel="stylesheet";
          link.href = "${quoteEscape(path)}";
          document.body.appendChild(link);
        }
    `;
}

function minify(code) {
  let result = babel.transform(code, { presets: [babelPresetEnv] });
  return uglify.minify(result.code).code;
}

function convert(code, options) {
  code = minify(code);
  let stylesCode = '';

  if (options.script) {
    options.script = options.script.reverse();
    options.script.forEach(s => {
      let { path, opts } = extractOptions(s);
      code = loadScript(code, path, opts.loadOnce);
    });
    code = minify(code);
  }

  if (options.style) {
    options.style.forEach(s => {
      let { path, opts } = extractOptions(s);
      stylesCode = loadStyle(stylesCode, path, opts.loadOnce);
    });
    code = minify(stylesCode) + code;
  }

  code = `(function(){${code}})()`;
  return `javascript:${encodeURIComponent(code)}`;
}

function parseFile(data) {
  let inMetadataBlock = false;
  let openMetadata = '==Bookmarklet==';
  let closeMetadata = '==/Bookmarklet==';
  let rComment = /^(\s*\/\/\s*)/;
  let mdKeys = metadata.keys;
  let mdTypes = metadata.types;
  let options = {};
  let code = [];
  let errors = [];

  // parse file and gather options from metadata block if available
  data.match(/[^\r\n]+/g).forEach(function(line, i, lines) {
    // comment
    if (rComment.test(line)) {
      let comment = line.replace(rComment, '').trim(),
        canonicalComment = comment.toLowerCase().replace(/\s+/g, '');

      if (!inMetadataBlock) {
        if (canonicalComment == openMetadata.toLowerCase()) {
          inMetadataBlock = true;
        }
      } else {
        if (canonicalComment == closeMetadata.toLowerCase()) {
          inMetadataBlock = false;
        } else {
          let m = comment.match(/^@([^\s]+)\s+(.*)$/);
          if (m) {
            let k = m[1];
            let v = m[2];
            if (k) {
              if (mdKeys[k] == mdTypes.list) {
                options[k] = options[k] || [];
                options[k].push(v);
              } else if (mdKeys[k] == mdTypes.boolean) {
                options[k] = v.toLowerCase() == 'true';
              } else {
                options[k] = v;
              }
            } else {
              warn(`ignoring invalid metadata option: '${k}'`);
            }
          }
        }
      }

      // code
    } else {
      code.push(line);
    }

    if (inMetadataBlock && i + 1 == lines.length) {
      errors.push(`missing metdata block closing '${closeMetadata}'`);
    }
  });

  return {
    code: code.join('\n'),
    options: options,
    errors: errors.length ? errors : null
  };
}

// Exports

Object.assign(exports, {
  version: version,
  convert: convert,
  parseFile: parseFile,
  metadata: metadata
});
