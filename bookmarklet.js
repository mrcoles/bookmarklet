
var version = [0, 0, 7];

var uglify = require('uglify-js'),
    md5 = require('md5');

// metadata
var str = 1,
    list = 2,
    bool = 3,
	metadata = {
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
    var id = `script_${md5(path).substring(0, 7)}`;
    return (`
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
            if( ${loadOnce} ) {
                s.id="${id}";
            }
            s.src = "${quoteEscape(path)}";
            document.body.appendChild(s);
        } else {
            callback();
        }
    `);
}

function loadStyle(code, path, loadOnce) {
    var id = `style_${md5(path).substring(0, 7)}`;
    return (`${code}
        if (!document.getElementById("${id}")) {
            var link = document.createElement("link");
            if( ${loadOnce} ){ 
                link.id="${id}";
            }
            link.rel="stylesheet";
            link.href = "${quoteEscape(path)}";
            document.body.appendChild(link);
        }
    `);
}

function minify(code) {
    return uglify.minify(code, {fromString: true}).code;
}

function convert(code, options) {
    code = minify(code);
    var stylesCode = '';

    if (options.script) {
        options.script = options.script.reverse();
        for (var i=0, len=options.script.length; i<len; i++) {
            code = loadScript(code, options.script[i], options.loadOnce);
        }
        code = minify(code);
    }

    if (options.style) {
        for (var j=0, length=options.style.length; j<length; j++) {
            stylesCode = loadStyle(stylesCode, options.style[j], options.loadOnce);
        }
        code = minify(stylesCode) + code;
    }

    code = `(function(){ ${code} })()`;
    return `javascript:${encodeURIComponent(code)}`;
}

function parseFile(data) {
    var inMetadataBlock = false,
        openMetadata = '==Bookmarklet==',
        closeMetadata = '==/Bookmarklet==',
        rComment = /^(\s*\/\/\s*)/,
        mdKeys = metadata.keys,
        mdTypes = metadata.types,
        options = {},
        code = [],
        errors = [];

    // parse file and gather options from metadata block if available
    data.match(/[^\r\n]+/g).forEach(function(line, i, lines) {

        // comment
        if (rComment.test(line)) {
            var comment = line.replace(rComment, '').trim(),
                canonicalComment = comment.toLowerCase().replace(/\s+/g, '');

            if (!inMetadataBlock) {
                if (canonicalComment == openMetadata.toLowerCase()) {
                    inMetadataBlock = true;
                }
            } else {
                if (canonicalComment == closeMetadata.toLowerCase()) {
                    inMetadataBlock = false;
                } else {
                    var m = comment.match(/^@([^\s]+)\s+(.*)$/);
                    if (m) {
                        var k = m[1], v = m[2];
                        if (k) {
                            if (mdKeys[k] == mdTypes.list) {
                                options[k] = options[k] || [];
                                options[k].push(v);
                            } else if (mdKeys[k] == mdTypes.boolean) {
                                options[k] = (v.toLowerCase() == 'true');
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

var _exports = {
    version: version,
    convert: convert,
    parseFile: parseFile,
    metadata: metadata
};

for (var k in _exports) {
    exports[k] = _exports[k];
}
