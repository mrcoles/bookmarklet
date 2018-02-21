const version = [0, 0, 9];

const babel = require('babel-core');
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
    loadOnce: bool,
    script: list,
    style: list
  }
};

function quoteEscape(x) {
  return x.replace('"', '\\"').replace("'", "\\'");
}

function loadScript(code, path, loadOnce) {
  let id = `script_${md5(path).substring(0, 7)}`;
  return `
        function callback(){
          ${code}
        }

        if (!document.getElementById("${id}")) {
          var s = document.createElement("script");
          if (s.addEventListener) {
            s.addEventListener("load", callback, false)
          } else if (s.readyState) {
            s.onreadystatechange = callback
          }
          if (${loadOnce}) {
            s.id="${id}";
          }
          s.src = "${quoteEscape(path)}";
          document.body.appendChild(s);
        } else {
          callback();
        }
    `;
}

function loadStyle(code, path, loadOnce) {
  let id = `style_${md5(path).substring(0, 7)}`;
  return `${code}
        if (!document.getElementById("${id}")) {
          var link = document.createElement("link");
          if (${loadOnce}) {
              link.id="${id}";
          }
          link.rel="stylesheet";
          link.href = "${quoteEscape(path)}";
          document.body.appendChild(link);
        }
    `;
}

function minify(code) {
  let result = babel.transform(code, { presets: ['env'] });
  return uglify.minify(result.code).code;
}

function convert(code, options) {
  code = minify(code);
  let stylesCode = '';

  if (options.script) {
    options.script = options.script.reverse();
    for (let i = 0, len = options.script.length; i < len; i++) {
      code = loadScript(code, options.script[i], options.loadOnce);
    }
    code = minify(code);
  }

  if (options.style) {
    for (let j = 0, length = options.style.length; j < length; j++) {
      stylesCode = loadStyle(stylesCode, options.style[j], options.loadOnce);
    }
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
