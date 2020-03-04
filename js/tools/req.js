// koffee 1.11.0

/*
00000000   00000000   0000000 
000   000  000       000   000
0000000    0000000   000 00 00
000   000  000       000 0000 
000   000  00000000   00000 00
 */
var _, kerror, kstr, mathRegExp, ref, req, requireRegExp, slash, valid,
    indexOf = [].indexOf;

ref = require('kxk'), _ = ref._, kerror = ref.kerror, kstr = ref.kstr, slash = ref.slash, valid = ref.valid;

requireRegExp = /^(\s*\{.+\})\s*=\s*require\s+([\'\"][\.\/\w]+[\'\"])/;

mathRegExp = /^(\s*\{.+\})\s*=\s*(Math)\s*$/;

req = function(file, lines, editor) {
    var ci, diss, err, exports, fileDir, firstIndex, i, indent, j, k, keys, l, len, len1, li, m, mod, moduleName, name, newKeys, nodeModules, operations, pkgDir, ref1, ref2, regexes, reqValues, required, requires, text, values;
    requires = {};
    exports = {};
    reqValues = {};
    regexes = {
        '$': /[^*\)\'\"\\]?\$[\s\(]/
    };
    firstIndex = null;
    keys = {
        Math: ['E', 'LN2', 'LN10', 'LOG2E', 'LOG10E', 'PI', 'SQRT1_2', 'SQRT2', 'abs', 'acos', 'acosh', 'asin', 'asinh', 'atan', 'atanh', 'atan2', 'cbrt', 'ceil', 'clz32', 'cos', 'cosh', 'exp', 'expm1', 'floor', 'fround', 'hypot', 'imul', 'log1p', 'log10', 'log2', 'max', 'min', 'pow', 'random', 'round', 'sign', 'sin', 'sinh', 'sqrt', 'tan', 'tanh', 'trunc']
    };
    for (li = i = 0, ref1 = lines.length; 0 <= ref1 ? i < ref1 : i > ref1; li = 0 <= ref1 ? ++i : --i) {
        m = lines[li].match(requireRegExp);
        if ((m != null ? m[1] : void 0) == null) {
            m = lines[li].match(mathRegExp);
        }
        if (((m != null ? m[1] : void 0) != null) && ((m != null ? m[2] : void 0) != null)) {
            if (!requires[m[2]]) {
                indent = '';
                ci = 0;
                while (m[1][ci] === ' ') {
                    indent += ' ';
                    ci += 1;
                }
                requires[m[2]] = {
                    index: li,
                    value: m[1].trim(),
                    module: m[2],
                    indent: indent
                };
                if (requires[m[2]].value.startsWith('{')) {
                    if (!keys[m[2]]) {
                        try {
                            moduleName = kstr.strip(m[2], '"\'');
                            if (pkgDir = slash.pkg(file)) {
                                nodeModules = slash.unslash(slash.join(pkgDir, 'node_modules'));
                                if (indexOf.call(module.paths, nodeModules) < 0) {
                                    module.paths.push(nodeModules);
                                }
                            }
                            if (moduleName.startsWith('.')) {
                                fileDir = slash.resolve(slash.join(slash.dir(file), moduleName)).replace('/coffee/', '/js/');
                                fileDir = slash.unslash(slash.dir(fileDir));
                                if (indexOf.call(module.paths, fileDir) < 0) {
                                    module.paths.unshift(fileDir);
                                }
                                moduleName = slash.file(moduleName);
                            }
                            required = require(moduleName);
                            newKeys = Object.keys(required);
                            keys[m[2]] = newKeys;
                            for (j = 0, len = newKeys.length; j < len; j++) {
                                k = newKeys[j];
                                if (regexes[k] != null) {
                                    regexes[k];
                                } else {
                                    regexes[k] = new RegExp("(^|[\\:\\(\\{]|\\s+)" + k + "(\\s+[^:]|\\s*$|[\\.\\(])");
                                }
                            }
                        } catch (error) {
                            err = error;
                            kerror("can't require " + m[2] + " for " + file + ": " + err + " \nmodule.paths:", module.paths);
                        }
                    }
                }
                if (firstIndex != null) {
                    firstIndex;
                } else {
                    firstIndex = li;
                }
            }
            continue;
        }
        if (lines[li].trim().startsWith('module.exports')) {
            name = (ref2 = lines[li].trim().split('=')[1]) != null ? ref2.trim() : void 0;
            if (name && /\w+/.test(name)) {
                exports[name.toLowerCase()] = true;
            }
        }
        for (mod in keys) {
            values = keys[mod];
            for (l = 0, len1 = values.length; l < len1; l++) {
                k = values[l];
                if (reqValues[mod] != null) {
                    reqValues[mod];
                } else {
                    reqValues[mod] = [];
                }
                if (indexOf.call(reqValues[mod], k) >= 0) {
                    continue;
                }
                if (regexes[k] != null) {
                    regexes[k];
                } else {
                    regexes[k] = new RegExp("(^|[\\:\\(\\{]|\\s+)" + k + "(\\s+[^:]|\\s*$|[\\.\\(])");
                }
                if (regexes[k].test(lines[li])) {
                    diss = editor.syntax.getDiss(li);
                    diss = diss.filter(function(d) {
                        return (d != null ? d.clss : void 0) && !d.clss.startsWith('comment') && !d.clss.startsWith('string');
                    });
                    text = diss.map(function(s) {
                        return s.match;
                    }).join(' ');
                    if (regexes[k].test(text)) {
                        reqValues[mod].push(k);
                    }
                }
            }
        }
    }
    operations = [];
    for (mod in reqValues) {
        values = reqValues[mod];
        if (firstIndex != null) {
            firstIndex;
        } else {
            firstIndex = 0;
        }
        if (requires[mod]) {
            firstIndex = requires[mod].index + 1;
        } else {
            continue;
        }
        values = _.uniq(values);
        values = values.filter(function(v) {
            return indexOf.call(Object.keys(exports).concat(['state']), v) < 0;
        });
        if (valid(values)) {
            values.sort();
            if (mod === 'Math') {
                text = requires[mod].indent + "{ " + (values.join(', ')) + " } = " + mod;
            } else {
                text = requires[mod].indent + "{ " + (values.join(', ')) + " } = require " + mod;
            }
            if (requires[mod]) {
                operations.push({
                    op: 'change',
                    index: requires[mod].index,
                    text: text
                });
            } else {
                operations.push({
                    op: 'insert',
                    index: firstIndex,
                    text: text
                });
            }
        }
    }
    return operations;
};

module.exports = req;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS90b29scyIsInNvdXJjZXMiOlsicmVxLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxrRUFBQTtJQUFBOztBQVFBLE1BQW9DLE9BQUEsQ0FBUSxLQUFSLENBQXBDLEVBQUUsU0FBRixFQUFLLG1CQUFMLEVBQWEsZUFBYixFQUFtQixpQkFBbkIsRUFBMEI7O0FBRTFCLGFBQUEsR0FBZ0I7O0FBQ2hCLFVBQUEsR0FBYTs7QUFFYixHQUFBLEdBQU0sU0FBQyxJQUFELEVBQU8sS0FBUCxFQUFjLE1BQWQ7QUFFRixRQUFBO0lBQUEsUUFBQSxHQUFZO0lBQ1osT0FBQSxHQUFZO0lBQ1osU0FBQSxHQUFZO0lBQ1osT0FBQSxHQUFZO1FBQUEsR0FBQSxFQUFLLHVCQUFMOztJQUNaLFVBQUEsR0FBYTtJQUViLElBQUEsR0FBTztRQUFBLElBQUEsRUFBTSxDQUNULEdBRFMsRUFDTixLQURNLEVBQ0QsTUFEQyxFQUNLLE9BREwsRUFDWSxRQURaLEVBQ29CLElBRHBCLEVBQ3dCLFNBRHhCLEVBQ2lDLE9BRGpDLEVBRVQsS0FGUyxFQUVKLE1BRkksRUFFRSxPQUZGLEVBRVMsTUFGVCxFQUVlLE9BRmYsRUFFc0IsTUFGdEIsRUFFNEIsT0FGNUIsRUFFbUMsT0FGbkMsRUFHVCxNQUhTLEVBR0gsTUFIRyxFQUdHLE9BSEgsRUFHVSxLQUhWLEVBR2UsTUFIZixFQUdxQixLQUhyQixFQUcwQixPQUgxQixFQUdpQyxPQUhqQyxFQUd3QyxRQUh4QyxFQUlULE9BSlMsRUFJRixNQUpFLEVBSUksT0FKSixFQUlXLE9BSlgsRUFJa0IsTUFKbEIsRUFJd0IsS0FKeEIsRUFJNkIsS0FKN0IsRUFJa0MsS0FKbEMsRUFJdUMsUUFKdkMsRUFLVCxPQUxTLEVBS0YsTUFMRSxFQUtJLEtBTEosRUFLUyxNQUxULEVBS2UsTUFMZixFQUtxQixLQUxyQixFQUswQixNQUwxQixFQUtnQyxPQUxo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LElBQVgsQ0FBZ0I7b0JBQUEsRUFBQSxFQUFHLFFBQUg7b0JBQVksS0FBQSxFQUFNLFFBQVMsQ0FBQSxHQUFBLENBQUksQ0FBQyxLQUFoQztvQkFBdUMsSUFBQSxFQUFLLElBQTVDO2lCQUFoQixFQURKO2FBQUEsTUFBQTtnQkFHSSxVQUFVLENBQUMsSUFBWCxDQUFnQjtvQkFBQSxFQUFBLEVBQUcsUUFBSDtvQkFBWSxLQUFBLEVBQU0sVUFBbEI7b0JBQThCLElBQUEsRUFBSyxJQUFuQztpQkFBaEIsRUFISjthQVRKOztBQVpKO1dBMEJBO0FBcEhFOztBQXNITixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAwMCAwMFxuMDAwICAgMDAwICAwMDAgICAgICAgMDAwIDAwMDAgXG4wMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAgMDBcbiMjI1xuXG57IF8sIGtlcnJvciwga3N0ciwgc2xhc2gsIHZhbGlkIH0gPSByZXF1aXJlICdreGsnXG5cbnJlcXVpcmVSZWdFeHAgPSAvXihcXHMqXFx7LitcXH0pXFxzKj1cXHMqcmVxdWlyZVxccysoW1xcJ1xcXCJdW1xcLlxcL1xcd10rW1xcJ1xcXCJdKS9cbm1hdGhSZWdFeHAgPSAvXihcXHMqXFx7LitcXH0pXFxzKj1cXHMqKE1hdGgpXFxzKiQvXG5cbnJlcSA9IChmaWxlLCBsaW5lcywgZWRpdG9yKSAtPlxuXG4gICAgcmVxdWlyZXMgID0ge31cbiAgICBleHBvcnRzICAgPSB7fVxuICAgIHJlcVZhbHVlcyA9IHt9XG4gICAgcmVnZXhlcyAgID0gJyQnOiAvW14qXFwpXFwnXFxcIlxcXFxdP1xcJFtcXHNcXChdL1xuICAgIGZpcnN0SW5kZXggPSBudWxsXG4gICAgXG4gICAga2V5cyA9IE1hdGg6IFtcbiAgICAgICAgJ0UnJ0xOMicnTE4xMCcnTE9HMkUnJ0xPRzEwRScnUEknJ1NRUlQxXzInJ1NRUlQyJ1xuICAgICAgICAnYWJzJydhY29zJydhY29zaCcnYXNpbicnYXNpbmgnJ2F0YW4nJ2F0YW5oJydhdGFuMidcbiAgICAgICAgJ2NicnQnJ2NlaWwnJ2NsejMyJydjb3MnJ2Nvc2gnJ2V4cCcnZXhwbTEnJ2Zsb29yJydmcm91bmQnXG4gICAgICAgICdoeXBvdCcnaW11bCcnbG9nMXAnJ2xvZzEwJydsb2cyJydtYXgnJ21pbicncG93JydyYW5kb20nXG4gICAgICAgICdyb3VuZCcnc2lnbicnc2luJydzaW5oJydzcXJ0Jyd0YW4nJ3RhbmgnJ3RydW5jJ1xuICAgICAgICBdXG4gICBcbiAgICBmb3IgbGkgaW4gWzAuLi5saW5lcy5sZW5ndGhdXG4gICAgICAgIFxuICAgICAgICBtID0gbGluZXNbbGldLm1hdGNoIHJlcXVpcmVSZWdFeHBcbiAgICAgICAgIyBrbG9nIGxpLCBsaW5lc1tsaV0sIG1cbiAgICAgICAgaWYgbm90IG0/WzFdP1xuICAgICAgICAgICAgbSA9IGxpbmVzW2xpXS5tYXRjaCBtYXRoUmVnRXhwXG4gICAgICAgIFxuICAgICAgICBpZiBtP1sxXT8gYW5kIG0/WzJdP1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBub3QgcmVxdWlyZXNbbVsyXV1cbiAgICAgICAgICAgICAgICBpbmRlbnQgPSAnJ1xuICAgICAgICAgICAgICAgIGNpID0gMFxuICAgICAgICAgICAgICAgIHdoaWxlIG1bMV1bY2ldID09ICcgJ1xuICAgICAgICAgICAgICAgICAgICBpbmRlbnQgKz0gJyAnXG4gICAgICAgICAgICAgICAgICAgIGNpICs9IDFcbiAgICAgICAgICAgICAgICByZXF1aXJlc1ttWzJdXSA9IGluZGV4OmxpLCB2YWx1ZTptWzFdLnRyaW0oKSwgbW9kdWxlOm1bMl0sIGluZGVudDppbmRlbnRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiByZXF1aXJlc1ttWzJdXS52YWx1ZS5zdGFydHNXaXRoICd7J1xuICAgICAgICAgICAgICAgICAgICBpZiBub3Qga2V5c1ttWzJdXVxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kdWxlTmFtZSA9IGtzdHIuc3RyaXAgbVsyXSwgJ1wiXFwnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIHBrZ0RpciA9IHNsYXNoLnBrZyBmaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVNb2R1bGVzID0gc2xhc2gudW5zbGFzaCBzbGFzaC5qb2luIHBrZ0RpciwgJ25vZGVfbW9kdWxlcydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm9kZU1vZHVsZXMgbm90IGluIG1vZHVsZS5wYXRoc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kdWxlLnBhdGhzLnB1c2ggbm9kZU1vZHVsZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbW9kdWxlTmFtZS5zdGFydHNXaXRoICcuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlRGlyID0gc2xhc2gucmVzb2x2ZShzbGFzaC5qb2luIHNsYXNoLmRpcihmaWxlKSwgbW9kdWxlTmFtZSkucmVwbGFjZSAnL2NvZmZlZS8nICcvanMvJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlRGlyID0gc2xhc2gudW5zbGFzaCBzbGFzaC5kaXIgZmlsZURpclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBmaWxlRGlyIG5vdCBpbiBtb2R1bGUucGF0aHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZHVsZS5wYXRocy51bnNoaWZ0IGZpbGVEaXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kdWxlTmFtZSA9IHNsYXNoLmZpbGUgbW9kdWxlTmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1aXJlZCA9IHJlcXVpcmUgbW9kdWxlTmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0tleXMgPSBPYmplY3Qua2V5cyByZXF1aXJlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleXNbbVsyXV0gPSBuZXdLZXlzXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgayBpbiBuZXdLZXlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZ2V4ZXNba10gPz0gbmV3IFJlZ0V4cCBcIihefFtcXFxcOlxcXFwoXFxcXHtdfFxcXFxzKykje2t9KFxcXFxzK1teOl18XFxcXHMqJHxbXFxcXC5cXFxcKF0pXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtlcnJvciBcImNhbid0IHJlcXVpcmUgI3ttWzJdfSBmb3IgI3tmaWxlfTogI3tlcnJ9IFxcbm1vZHVsZS5wYXRoczpcIiBtb2R1bGUucGF0aHNcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmaXJzdEluZGV4ID89IGxpXG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIGxpbmVzW2xpXS50cmltKCkuc3RhcnRzV2l0aCAnbW9kdWxlLmV4cG9ydHMnXG4gICAgICAgICAgICBuYW1lID0gbGluZXNbbGldLnRyaW0oKS5zcGxpdCgnPScpWzFdPy50cmltKClcbiAgICAgICAgICAgIGlmIG5hbWUgYW5kIC9cXHcrLy50ZXN0IG5hbWVcbiAgICAgICAgICAgICAgICBleHBvcnRzW25hbWUudG9Mb3dlckNhc2UoKV0gPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGZvciBtb2QsdmFsdWVzIG9mIGtleXNcblxuICAgICAgICAgICAgZm9yIGsgaW4gdmFsdWVzXG5cbiAgICAgICAgICAgICAgICByZXFWYWx1ZXNbbW9kXSA/PSBbXVxuXG4gICAgICAgICAgICAgICAgaWYgayBpbiByZXFWYWx1ZXNbbW9kXVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJlZ2V4ZXNba10gPz0gbmV3IFJlZ0V4cCBcIihefFtcXFxcOlxcXFwoXFxcXHtdfFxcXFxzKykje2t9KFxcXFxzK1teOl18XFxcXHMqJHxbXFxcXC5cXFxcKF0pXCJcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgcmVnZXhlc1trXS50ZXN0IGxpbmVzW2xpXVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZGlzcyA9IGVkaXRvci5zeW50YXguZ2V0RGlzcyBsaVxuICAgICAgICAgICAgICAgICAgICBkaXNzID0gZGlzcy5maWx0ZXIgKGQpIC0+IGQ/LmNsc3MgYW5kIG5vdCBkLmNsc3Muc3RhcnRzV2l0aCgnY29tbWVudCcpIGFuZCBub3QgZC5jbHNzLnN0YXJ0c1dpdGgoJ3N0cmluZycpXG4gICAgICAgICAgICAgICAgICAgIHRleHQgPSBkaXNzLm1hcCgocykgLT4gcy5tYXRjaCkuam9pbiAnICdcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIHJlZ2V4ZXNba10udGVzdCB0ZXh0XG4gICAgICAgICAgICAgICAgICAgICAgICByZXFWYWx1ZXNbbW9kXS5wdXNoIGtcblxuICAgIG9wZXJhdGlvbnMgPSBbXVxuICAgICAgICAgXG4gICAgZm9yIG1vZCx2YWx1ZXMgb2YgcmVxVmFsdWVzXG4gICAgXG4gICAgICAgIGZpcnN0SW5kZXggPz0gMFxuICAgICAgICBcbiAgICAgICAgaWYgcmVxdWlyZXNbbW9kXVxuICAgICAgICAgICAgZmlyc3RJbmRleCA9IHJlcXVpcmVzW21vZF0uaW5kZXggKyAxXG4gICAgICAgIGVsc2UgXG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHZhbHVlcyA9IF8udW5pcSB2YWx1ZXNcbiAgICAgICAgdmFsdWVzID0gdmFsdWVzLmZpbHRlciAodikgLT4gdiBub3QgaW4gT2JqZWN0LmtleXMoZXhwb3J0cykuY29uY2F0IFsnc3RhdGUnXVxuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgdmFsdWVzXG4gICAgXG4gICAgICAgICAgICB2YWx1ZXMuc29ydCgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG1vZCA9PSAnTWF0aCdcbiAgICAgICAgICAgICAgICB0ZXh0ID0gXCIje3JlcXVpcmVzW21vZF0uaW5kZW50fXsgI3t2YWx1ZXMuam9pbiAnLCAnfSB9ID0gI3ttb2R9XCJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0ZXh0ID0gXCIje3JlcXVpcmVzW21vZF0uaW5kZW50fXsgI3t2YWx1ZXMuam9pbiAnLCAnfSB9ID0gcmVxdWlyZSAje21vZH1cIlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgcmVxdWlyZXNbbW9kXVxuICAgICAgICAgICAgICAgIG9wZXJhdGlvbnMucHVzaCBvcDonY2hhbmdlJyBpbmRleDpyZXF1aXJlc1ttb2RdLmluZGV4LCB0ZXh0OnRleHRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBvcGVyYXRpb25zLnB1c2ggb3A6J2luc2VydCcgaW5kZXg6Zmlyc3RJbmRleCwgdGV4dDp0ZXh0XG4gICAgICAgICAgICAgICAgXG4gICAgb3BlcmF0aW9uc1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcVxuIl19
//# sourceURL=../../coffee/tools/req.coffee