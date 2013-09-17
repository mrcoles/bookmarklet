
var version = [0, 0, 4];

var uglify = require('uglify-js');

// metadata
var str = 1,
    list = 2,
	metadata = {
        types: {
            string: str,
            list: list
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

function loadScript(code, path) {
    return (''
            + 'function callback(){'
            // + (isJQuery ? '(function($){var jQuery=$;' : '')
            + code
            // + (isJQuery ? '})(jQuery.noConflict(true))' : '')
            + '}'
            + 'var s = document.createElement("script");'
            + 'if (s.addEventListener) {'
            + '  s.addEventListener("load", callback, false)'
            + '} else if (s.readyState) {'
            + '  s.onreadystatechange = callback'
            + '}'
            + 's.src = "' + quoteEscape(path) + '";'
            + 'document.body.appendChild(s);'
           );
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
            code = loadScript(code, options.script[i]);
        }
        code = minify(code);
    }

    if (options.style) {
        for (var j=0, length=options.style.length; j<length; j++) {
            stylesCode += 'var link = document.createElement("link"); link.rel="stylesheet"; link.href = "' + quoteEscape(options.style[j]) + '"; document.body.appendChild(link);';
        }
        code = minify(stylesCode) + code;
    }

    code = '(function(){' + code + '})()';
    return 'javascript:' + encodeURIComponent(code);
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
                            } else {
                                options[m[1]] = m[2];
                            }
                        } else {
                            warn('ignoring invalid metadata option: `' + k + '`');
                        }
                    }
                }
            }

        // code
        } else {
            code.push(line);
        }

        if (inMetadataBlock && i + 1 == lines.length) {
            errors.push('missing metdata block closing `' +
                        closeMetadata + '`');
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
