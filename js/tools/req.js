// koffee 1.14.0

/*
00000000   00000000   0000000 
000   000  000       000   000
0000000    0000000   000 00 00
000   000  000       000 0000 
000   000  00000000   00000 00
 */
var _, kerror, klog, kstr, kxk, mathRegExp, moduleKeys, req, requireLike, requireRegExp, slash, valid,
    indexOf = [].indexOf;

kxk = require('kxk');

_ = kxk._, kerror = kxk.kerror, klog = kxk.klog, kstr = kxk.kstr, slash = kxk.slash, valid = kxk.valid;

requireLike = require('require-like');

requireRegExp = /^(\s*\{.+\})\s*=\s*require\s+([\'\"][\.\/\w]+[\'\"])/;

mathRegExp = /^(\s*\{.+\})\s*=\s*(Math)\s*$/;

moduleKeys = function(moduleName, file) {
    var err, keys, mRequire, required;
    try {
        if (moduleName.endsWith('kxk')) {
            required = kxk;
        } else {
            mRequire = requireLike(file, true);
            required = mRequire(moduleName);
        }
    } catch (error) {
        err = error;
        console.error("can't require " + moduleName, err);
    }
    keys = [];
    if (required) {
        if (required.prototype) {
            keys = Object.keys(required.prototype);
        } else if (_.isFunction(required.getOwnPropertyNames)) {
            keys = required.getOwnPropertyNames();
        } else if (_.isObject(required)) {
            keys = Object.keys(required);
        }
    }
    if (moduleName.endsWith('kxk')) {
        keys.push('app');
    }
    return keys;
};

req = function(file, lines, editor) {
    var ci, diss, err, exports, firstIndex, i, indent, j, k, keys, l, len, len1, li, m, mod, moduleName, name, newKeys, operations, ref, ref1, regexes, reqValues, requires, text, values;
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
    for (li = i = 0, ref = lines.length; 0 <= ref ? i < ref : i > ref; li = 0 <= ref ? ++i : --i) {
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
                            newKeys = moduleKeys(moduleName, file);
                            keys[m[2]] = newKeys;
                            for (j = 0, len = newKeys.length; j < len; j++) {
                                k = newKeys[j];
                                if (regexes[k] != null) {
                                    regexes[k];
                                } else {
                                    regexes[k] = new RegExp("(^|[\\:\\(\\{]|\\s+)" + k + "(\\s+[^:]|\\s*$|[\\.\\,\\(])");
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
            name = (ref1 = lines[li].trim().split('=')[1]) != null ? ref1.trim() : void 0;
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
                    regexes[k] = new RegExp("(^|[\\,\\:\\(\\[\\{]|\\s+)" + k + "(\\s+[^:]|\\s*$|[\\.\\,\\(])");
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

req.moduleKeys = moduleKeys;

module.exports = req;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS90b29scyIsInNvdXJjZXMiOlsicmVxLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxpR0FBQTtJQUFBOztBQVFBLEdBQUEsR0FBTSxPQUFBLENBQVEsS0FBUjs7QUFDSixTQUFGLEVBQUssbUJBQUwsRUFBYSxlQUFiLEVBQW1CLGVBQW5CLEVBQXlCLGlCQUF6QixFQUFnQzs7QUFDaEMsV0FBQSxHQUFjLE9BQUEsQ0FBUSxjQUFSOztBQUVkLGFBQUEsR0FBZ0I7O0FBQ2hCLFVBQUEsR0FBYzs7QUFFZCxVQUFBLEdBQWEsU0FBQyxVQUFELEVBQWEsSUFBYjtBQU1ULFFBQUE7QUFBQTtRQUNJLElBQUcsVUFBVSxDQUFDLFFBQVgsQ0FBb0IsS0FBcEIsQ0FBSDtZQUNJLFFBQUEsR0FBVyxJQURmO1NBQUEsTUFBQTtZQUdJLFFBQUEsR0FBVyxXQUFBLENBQVksSUFBWixFQUFrQixJQUFsQjtZQUNYLFFBQUEsR0FBVyxRQUFBLENBQVMsVUFBVCxFQUpmO1NBREo7S0FBQSxhQUFBO1FBT007UUFDSCxPQUFBLENBQUMsS0FBRCxDQUFPLGdCQUFBLEdBQWlCLFVBQXhCLEVBQXFDLEdBQXJDLEVBUkg7O0lBVUEsSUFBQSxHQUFPO0lBQ1AsSUFBRyxRQUFIO1FBQ0ksSUFBRyxRQUFRLENBQUMsU0FBWjtZQUNJLElBQUEsR0FBTyxNQUFNLENBQUMsSUFBUCxDQUFZLFFBQVEsQ0FBQyxTQUFyQixFQURYO1NBQUEsTUFFSyxJQUFHLENBQUMsQ0FBQyxVQUFGLENBQWEsUUFBUSxDQUFDLG1CQUF0QixDQUFIO1lBQ0QsSUFBQSxHQUFPLFFBQVEsQ0FBQyxtQkFBVCxDQUFBLEVBRE47U0FBQSxNQUVBLElBQUcsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxRQUFYLENBQUg7WUFDRCxJQUFBLEdBQU8sTUFBTSxDQUFDLElBQVAsQ0FBWSxRQUFaLEVBRE47U0FMVDs7SUFRQSxJQUFH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R0FBMEQsSUFIdkU7O1lBS0EsSUFBRyxRQUFTLENBQUEsR0FBQSxDQUFaO2dCQUNJLFVBQVUsQ0FBQyxJQUFYLENBQWdCO29CQUFBLEVBQUEsRUFBRyxRQUFIO29CQUFZLEtBQUEsRUFBTSxRQUFTLENBQUEsR0FBQSxDQUFJLENBQUMsS0FBaEM7b0JBQXVDLElBQUEsRUFBSyxJQUE1QztpQkFBaEIsRUFESjthQUFBLE1BQUE7Z0JBR0ksVUFBVSxDQUFDLElBQVgsQ0FBZ0I7b0JBQUEsRUFBQSxFQUFHLFFBQUg7b0JBQVksS0FBQSxFQUFNLFVBQWxCO29CQUE4QixJQUFBLEVBQUssSUFBbkM7aUJBQWhCLEVBSEo7YUFUSjs7QUFaSjtXQTBCQTtBQXJHRTs7QUF1R04sR0FBRyxDQUFDLFVBQUosR0FBaUI7O0FBRWpCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCBcbjAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAwIDAwXG4wMDAgICAwMDAgIDAwMCAgICAgICAwMDAgMDAwMCBcbjAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMCAwMFxuIyMjXG5cbmt4ayA9IHJlcXVpcmUgJ2t4aydcbnsgXywga2Vycm9yLCBrbG9nLCBrc3RyLCBzbGFzaCwgdmFsaWQgfSA9IGt4a1xucmVxdWlyZUxpa2UgPSByZXF1aXJlICdyZXF1aXJlLWxpa2UnXG5cbnJlcXVpcmVSZWdFeHAgPSAvXihcXHMqXFx7LitcXH0pXFxzKj1cXHMqcmVxdWlyZVxccysoW1xcJ1xcXCJdW1xcLlxcL1xcd10rW1xcJ1xcXCJdKS9cbm1hdGhSZWdFeHAgID0gL14oXFxzKlxcey4rXFx9KVxccyo9XFxzKihNYXRoKVxccyokL1xuXG5tb2R1bGVLZXlzID0gKG1vZHVsZU5hbWUsIGZpbGUpIC0+XG4gICAgXG4gICAgIyBrbG9nICdmaWxlJyBmaWxlXG4gICAgIyBpZiBtb2R1bGVOYW1lLnN0YXJ0c1dpdGggJy4nXG4gICAgICAgICMgbW9kdWxlTmFtZSA9IHNsYXNoLnJlc29sdmUoc2xhc2guam9pbiBzbGFzaC5kaXIoZmlsZSksIG1vZHVsZU5hbWUpLnJlcGxhY2UgJy9jb2ZmZWUvJyAnL2pzLydcblxuICAgIHRyeVxuICAgICAgICBpZiBtb2R1bGVOYW1lLmVuZHNXaXRoICdreGsnXG4gICAgICAgICAgICByZXF1aXJlZCA9IGt4a1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBtUmVxdWlyZSA9IHJlcXVpcmVMaWtlIGZpbGUsIHRydWVcbiAgICAgICAgICAgIHJlcXVpcmVkID0gbVJlcXVpcmUgbW9kdWxlTmFtZVxuICAgICAgICBcbiAgICBjYXRjaCBlcnJcbiAgICAgICAgZXJyb3IgXCJjYW4ndCByZXF1aXJlICN7bW9kdWxlTmFtZX1cIiBlcnJcbiAgICBcbiAgICBrZXlzID0gW11cbiAgICBpZiByZXF1aXJlZFxuICAgICAgICBpZiByZXF1aXJlZC5wcm90b3R5cGUgXG4gICAgICAgICAgICBrZXlzID0gT2JqZWN0LmtleXMgcmVxdWlyZWQucHJvdG90eXBlXG4gICAgICAgIGVsc2UgaWYgXy5pc0Z1bmN0aW9uIHJlcXVpcmVkLmdldE93blByb3BlcnR5TmFtZXNcbiAgICAgICAgICAgIGtleXMgPSByZXF1aXJlZC5nZXRPd25Qcm9wZXJ0eU5hbWVzKClcbiAgICAgICAgZWxzZSBpZiBfLmlzT2JqZWN0IHJlcXVpcmVkXG4gICAgICAgICAgICBrZXlzID0gT2JqZWN0LmtleXMgcmVxdWlyZWRcbiAgICAgICAgICAgIFxuICAgIGlmIG1vZHVsZU5hbWUuZW5kc1dpdGggJ2t4aycgdGhlbiBrZXlzLnB1c2ggJ2FwcCcgIyBvbWchIHdoYXQgYW4gdWdseSBoYWNrIDotKVxuICAgIGtleXNcbiAgICBcbnJlcSA9IChmaWxlLCBsaW5lcywgZWRpdG9yKSAtPlxuXG4gICAgcmVxdWlyZXMgID0ge31cbiAgICBleHBvcnRzICAgPSB7fVxuICAgIHJlcVZhbHVlcyA9IHt9XG4gICAgcmVnZXhlcyAgID0gJyQnOiAvW14qXFwpXFwnXFxcIlxcXFxdP1xcJFtcXHNcXChdL1xuICAgIGZpcnN0SW5kZXggPSBudWxsXG4gICAgXG4gICAga2V5cyA9IE1hdGg6IFtcbiAgICAgICAgJ0UnJ0xOMicnTE4xMCcnTE9HMkUnJ0xPRzEwRScnUEknJ1NRUlQxXzInJ1NRUlQyJ1xuICAgICAgICAnYWJzJydhY29zJydhY29zaCcnYXNpbicnYXNpbmgnJ2F0YW4nJ2F0YW5oJydhdGFuMidcbiAgICAgICAgJ2NicnQnJ2NlaWwnJ2NsejMyJydjb3MnJ2Nvc2gnJ2V4cCcnZXhwbTEnJ2Zsb29yJydmcm91bmQnXG4gICAgICAgICdoeXBvdCcnaW11bCcnbG9nMXAnJ2xvZzEwJydsb2cyJydtYXgnJ21pbicncG93JydyYW5kb20nXG4gICAgICAgICdyb3VuZCcnc2lnbicnc2luJydzaW5oJydzcXJ0Jyd0YW4nJ3RhbmgnJ3RydW5jJ1xuICAgICAgICBdXG4gICBcbiAgICBmb3IgbGkgaW4gWzAuLi5saW5lcy5sZW5ndGhdXG4gICAgICAgIFxuICAgICAgICBtID0gbGluZXNbbGldLm1hdGNoIHJlcXVpcmVSZWdFeHBcblxuICAgICAgICBpZiBub3QgbT9bMV0/XG4gICAgICAgICAgICBtID0gbGluZXNbbGldLm1hdGNoIG1hdGhSZWdFeHBcbiAgICAgICAgXG4gICAgICAgIGlmIG0/WzFdPyBhbmQgbT9bMl0/XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG5vdCByZXF1aXJlc1ttWzJdXVxuICAgICAgICAgICAgICAgIGluZGVudCA9ICcnXG4gICAgICAgICAgICAgICAgY2kgPSAwXG4gICAgICAgICAgICAgICAgd2hpbGUgbVsxXVtjaV0gPT0gJyAnXG4gICAgICAgICAgICAgICAgICAgIGluZGVudCArPSAnICdcbiAgICAgICAgICAgICAgICAgICAgY2kgKz0gMVxuICAgICAgICAgICAgICAgIHJlcXVpcmVzW21bMl1dID0gaW5kZXg6bGksIHZhbHVlOm1bMV0udHJpbSgpLCBtb2R1bGU6bVsyXSwgaW5kZW50OmluZGVudFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIHJlcXVpcmVzW21bMl1dLnZhbHVlLnN0YXJ0c1dpdGggJ3snXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBrZXlzW21bMl1dXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGVOYW1lID0ga3N0ci5zdHJpcCBtWzJdLCAnXCJcXCcnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3S2V5cyA9IG1vZHVsZUtleXMgbW9kdWxlTmFtZSwgZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleXNbbVsyXV0gPSBuZXdLZXlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIGsgaW4gbmV3S2V5c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWdleGVzW2tdID89IG5ldyBSZWdFeHAgXCIoXnxbXFxcXDpcXFxcKFxcXFx7XXxcXFxccyspI3trfShcXFxccytbXjpdfFxcXFxzKiR8W1xcXFwuXFxcXCxcXFxcKF0pXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtlcnJvciBcImNhbid0IHJlcXVpcmUgI3ttWzJdfSBmb3IgI3tmaWxlfTogI3tlcnJ9IFxcbm1vZHVsZS5wYXRoczpcIiBtb2R1bGUucGF0aHNcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmaXJzdEluZGV4ID89IGxpXG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIGxpbmVzW2xpXS50cmltKCkuc3RhcnRzV2l0aCAnbW9kdWxlLmV4cG9ydHMnXG4gICAgICAgICAgICBuYW1lID0gbGluZXNbbGldLnRyaW0oKS5zcGxpdCgnPScpWzFdPy50cmltKClcbiAgICAgICAgICAgIGlmIG5hbWUgYW5kIC9cXHcrLy50ZXN0IG5hbWVcbiAgICAgICAgICAgICAgICBleHBvcnRzW25hbWUudG9Mb3dlckNhc2UoKV0gPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGZvciBtb2QsdmFsdWVzIG9mIGtleXNcblxuICAgICAgICAgICAgZm9yIGsgaW4gdmFsdWVzXG5cbiAgICAgICAgICAgICAgICByZXFWYWx1ZXNbbW9kXSA/PSBbXVxuXG4gICAgICAgICAgICAgICAgaWYgayBpbiByZXFWYWx1ZXNbbW9kXVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJlZ2V4ZXNba10gPz0gbmV3IFJlZ0V4cCBcIihefFtcXFxcLFxcXFw6XFxcXChcXFxcW1xcXFx7XXxcXFxccyspI3trfShcXFxccytbXjpdfFxcXFxzKiR8W1xcXFwuXFxcXCxcXFxcKF0pXCJcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgcmVnZXhlc1trXS50ZXN0IGxpbmVzW2xpXVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZGlzcyA9IGVkaXRvci5zeW50YXguZ2V0RGlzcyBsaVxuICAgICAgICAgICAgICAgICAgICBkaXNzID0gZGlzcy5maWx0ZXIgKGQpIC0+IGQ/LmNsc3MgYW5kIG5vdCBkLmNsc3Muc3RhcnRzV2l0aCgnY29tbWVudCcpIGFuZCBub3QgZC5jbHNzLnN0YXJ0c1dpdGgoJ3N0cmluZycpXG4gICAgICAgICAgICAgICAgICAgIHRleHQgPSBkaXNzLm1hcCgocykgLT4gcy5tYXRjaCkuam9pbiAnICdcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIHJlZ2V4ZXNba10udGVzdCB0ZXh0XG4gICAgICAgICAgICAgICAgICAgICAgICByZXFWYWx1ZXNbbW9kXS5wdXNoIGtcblxuICAgIG9wZXJhdGlvbnMgPSBbXVxuICAgICAgICAgXG4gICAgZm9yIG1vZCx2YWx1ZXMgb2YgcmVxVmFsdWVzXG4gICAgXG4gICAgICAgIGZpcnN0SW5kZXggPz0gMFxuICAgICAgICBcbiAgICAgICAgaWYgcmVxdWlyZXNbbW9kXVxuICAgICAgICAgICAgZmlyc3RJbmRleCA9IHJlcXVpcmVzW21vZF0uaW5kZXggKyAxXG4gICAgICAgIGVsc2UgXG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHZhbHVlcyA9IF8udW5pcSB2YWx1ZXNcbiAgICAgICAgdmFsdWVzID0gdmFsdWVzLmZpbHRlciAodikgLT4gdiBub3QgaW4gT2JqZWN0LmtleXMoZXhwb3J0cykuY29uY2F0IFsnc3RhdGUnXVxuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgdmFsdWVzXG4gICAgXG4gICAgICAgICAgICB2YWx1ZXMuc29ydCgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG1vZCA9PSAnTWF0aCdcbiAgICAgICAgICAgICAgICB0ZXh0ID0gXCIje3JlcXVpcmVzW21vZF0uaW5kZW50fXsgI3t2YWx1ZXMuam9pbiAnLCAnfSB9ID0gI3ttb2R9XCJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0ZXh0ID0gXCIje3JlcXVpcmVzW21vZF0uaW5kZW50fXsgI3t2YWx1ZXMuam9pbiAnLCAnfSB9ID0gcmVxdWlyZSAje21vZH1cIlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgcmVxdWlyZXNbbW9kXVxuICAgICAgICAgICAgICAgIG9wZXJhdGlvbnMucHVzaCBvcDonY2hhbmdlJyBpbmRleDpyZXF1aXJlc1ttb2RdLmluZGV4LCB0ZXh0OnRleHRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBvcGVyYXRpb25zLnB1c2ggb3A6J2luc2VydCcgaW5kZXg6Zmlyc3RJbmRleCwgdGV4dDp0ZXh0XG4gICAgICAgICAgICAgICAgXG4gICAgb3BlcmF0aW9uc1xuXG5yZXEubW9kdWxlS2V5cyA9IG1vZHVsZUtleXNcbiAgICBcbm1vZHVsZS5leHBvcnRzID0gcmVxXG4iXX0=
//# sourceURL=../../coffee/tools/req.coffee