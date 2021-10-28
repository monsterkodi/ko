// koffee 1.14.0

/*
00000000   00000000   0000000 
000   000  000       000   000
0000000    0000000   000 00 00
000   000  000       000 0000 
000   000  00000000   00000 00
 */
var _, kerror, kstr, mathRegExp, moduleKeys, ref, req, requireRegExp, slash, valid,
    indexOf = [].indexOf;

ref = require('kxk'), _ = ref._, kerror = ref.kerror, kstr = ref.kstr, slash = ref.slash, valid = ref.valid;

requireRegExp = /^(\s*\{.+\})\s*=\s*require\s+([\'\"][\.\/\w]+[\'\"])/;

mathRegExp = /^(\s*\{.+\})\s*=\s*(Math)\s*$/;

moduleKeys = function(moduleName, file) {
    var err, fileDir, keys, nodeModules, oldModule, oldWindow, pkgDir, required, window;
    oldWindow = _.clone(window);
    oldModule = _.clone(module.paths);
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
    try {
        required = require(moduleName);
    } catch (error) {
        err = error;
        console.error("can't require " + moduleName + " " + err);
    }
    window = oldWindow;
    module.paths = oldModule;
    keys = [];
    if (required.prototype) {
        keys = Object.keys(required.prototype);
    } else if (_.isFunction(required.getOwnPropertyNames)) {
        keys = required.getOwnPropertyNames();
    } else if (_.isObject(required)) {
        keys = Object.keys(required);
    }
    return keys;
};

req = function(file, lines, editor) {
    var ci, diss, err, exports, firstIndex, i, indent, j, k, keys, l, len, len1, li, m, mod, moduleName, name, newKeys, operations, ref1, ref2, regexes, reqValues, requires, text, values;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS90b29scyIsInNvdXJjZXMiOlsicmVxLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSw4RUFBQTtJQUFBOztBQVFBLE1BQW9DLE9BQUEsQ0FBUSxLQUFSLENBQXBDLEVBQUUsU0FBRixFQUFLLG1CQUFMLEVBQWEsZUFBYixFQUFtQixpQkFBbkIsRUFBMEI7O0FBRTFCLGFBQUEsR0FBZ0I7O0FBQ2hCLFVBQUEsR0FBYTs7QUFFYixVQUFBLEdBQWEsU0FBQyxVQUFELEVBQWEsSUFBYjtBQUdULFFBQUE7SUFBQSxTQUFBLEdBQVksQ0FBQyxDQUFDLEtBQUYsQ0FBUSxNQUFSO0lBQ1osU0FBQSxHQUFZLENBQUMsQ0FBQyxLQUFGLENBQVEsTUFBTSxDQUFDLEtBQWY7SUFFWixJQUFHLE1BQUEsR0FBUyxLQUFLLENBQUMsR0FBTixDQUFVLElBQVYsQ0FBWjtRQUNJLFdBQUEsR0FBYyxLQUFLLENBQUMsT0FBTixDQUFjLEtBQUssQ0FBQyxJQUFOLENBQVcsTUFBWCxFQUFtQixjQUFuQixDQUFkO1FBQ2QsSUFBRyxhQUFtQixNQUFNLENBQUMsS0FBMUIsRUFBQSxXQUFBLEtBQUg7WUFDSSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQWIsQ0FBa0IsV0FBbEIsRUFESjtTQUZKOztJQUtBLElBQUcsVUFBVSxDQUFDLFVBQVgsQ0FBc0IsR0FBdEIsQ0FBSDtRQUNJLE9BQUEsR0FBVSxLQUFLLENBQUMsT0FBTixDQUFjLEtBQUssQ0FBQyxJQUFOLENBQVcsS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWLENBQVgsRUFBNEIsVUFBNUIsQ0FBZCxDQUFxRCxDQUFDLE9BQXRELENBQThELFVBQTlELEVBQXlFLE1BQXpFO1FBQ1YsT0FBQSxHQUFVLEtBQUssQ0FBQyxPQUFOLENBQWMsS0FBSyxDQUFDLEdBQU4sQ0FBVSxPQUFWLENBQWQ7UUFDVixJQUFHLGFBQWUsTUFBTSxDQUFD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ICAwMDAwMDAwMCAgIDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAwMCAwMFxuMDAwICAgMDAwICAwMDAgICAgICAgMDAwIDAwMDAgXG4wMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAgMDBcbiMjI1xuXG57IF8sIGtlcnJvciwga3N0ciwgc2xhc2gsIHZhbGlkIH0gPSByZXF1aXJlICdreGsnXG5cbnJlcXVpcmVSZWdFeHAgPSAvXihcXHMqXFx7LitcXH0pXFxzKj1cXHMqcmVxdWlyZVxccysoW1xcJ1xcXCJdW1xcLlxcL1xcd10rW1xcJ1xcXCJdKS9cbm1hdGhSZWdFeHAgPSAvXihcXHMqXFx7LitcXH0pXFxzKj1cXHMqKE1hdGgpXFxzKiQvXG5cbm1vZHVsZUtleXMgPSAobW9kdWxlTmFtZSwgZmlsZSkgLT5cbiAgICBcbiAgICBcbiAgICBvbGRXaW5kb3cgPSBfLmNsb25lIHdpbmRvd1xuICAgIG9sZE1vZHVsZSA9IF8uY2xvbmUgbW9kdWxlLnBhdGhzXG4gICAgXG4gICAgaWYgcGtnRGlyID0gc2xhc2gucGtnIGZpbGVcbiAgICAgICAgbm9kZU1vZHVsZXMgPSBzbGFzaC51bnNsYXNoIHNsYXNoLmpvaW4gcGtnRGlyLCAnbm9kZV9tb2R1bGVzJ1xuICAgICAgICBpZiBub2RlTW9kdWxlcyBub3QgaW4gbW9kdWxlLnBhdGhzXG4gICAgICAgICAgICBtb2R1bGUucGF0aHMucHVzaCBub2RlTW9kdWxlc1xuICAgICAgICAgXG4gICAgaWYgbW9kdWxlTmFtZS5zdGFydHNXaXRoICcuJ1xuICAgICAgICBmaWxlRGlyID0gc2xhc2gucmVzb2x2ZShzbGFzaC5qb2luIHNsYXNoLmRpcihmaWxlKSwgbW9kdWxlTmFtZSkucmVwbGFjZSAnL2NvZmZlZS8nICcvanMvJ1xuICAgICAgICBmaWxlRGlyID0gc2xhc2gudW5zbGFzaCBzbGFzaC5kaXIgZmlsZURpclxuICAgICAgICBpZiBmaWxlRGlyIG5vdCBpbiBtb2R1bGUucGF0aHNcbiAgICAgICAgICAgIG1vZHVsZS5wYXRocy51bnNoaWZ0IGZpbGVEaXJcbiAgICAgICAgbW9kdWxlTmFtZSA9IHNsYXNoLmZpbGUgbW9kdWxlTmFtZVxuICAgICAgICAgXG4gICAgdHJ5XG4gICAgICAgIHJlcXVpcmVkID0gcmVxdWlyZSBtb2R1bGVOYW1lXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIGVycm9yIFwiY2FuJ3QgcmVxdWlyZSAje21vZHVsZU5hbWV9ICN7ZXJyfVwiXG4gICAgICAgIFxuICAgIHdpbmRvdyAgICAgICA9IG9sZFdpbmRvd1xuICAgIG1vZHVsZS5wYXRocyA9IG9sZE1vZHVsZVxuICAgICAgICBcbiAgICBrZXlzID0gW11cbiAgICBpZiByZXF1aXJlZC5wcm90b3R5cGUgXG4gICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyByZXF1aXJlZC5wcm90b3R5cGVcbiAgICBlbHNlIGlmIF8uaXNGdW5jdGlvbiByZXF1aXJlZC5nZXRPd25Qcm9wZXJ0eU5hbWVzXG4gICAgICAgIGtleXMgPSByZXF1aXJlZC5nZXRPd25Qcm9wZXJ0eU5hbWVzKClcbiAgICBlbHNlIGlmIF8uaXNPYmplY3QgcmVxdWlyZWRcbiAgICAgICAga2V5cyA9IE9iamVjdC5rZXlzIHJlcXVpcmVkXG4gICAgIyBrbG9nICdtb2R1bGVLZXlzJyBmaWxlLCBtb2R1bGVOYW1lLCBrZXlzXG4gICAga2V5c1xuICAgIFxucmVxID0gKGZpbGUsIGxpbmVzLCBlZGl0b3IpIC0+XG5cbiAgICByZXF1aXJlcyAgPSB7fVxuICAgIGV4cG9ydHMgICA9IHt9XG4gICAgcmVxVmFsdWVzID0ge31cbiAgICByZWdleGVzICAgPSAnJCc6IC9bXipcXClcXCdcXFwiXFxcXF0/XFwkW1xcc1xcKF0vXG4gICAgZmlyc3RJbmRleCA9IG51bGxcbiAgICBcbiAgICBrZXlzID0gTWF0aDogW1xuICAgICAgICAnRScnTE4yJydMTjEwJydMT0cyRScnTE9HMTBFJydQSScnU1FSVDFfMicnU1FSVDInXG4gICAgICAgICdhYnMnJ2Fjb3MnJ2Fjb3NoJydhc2luJydhc2luaCcnYXRhbicnYXRhbmgnJ2F0YW4yJ1xuICAgICAgICAnY2JydCcnY2VpbCcnY2x6MzInJ2NvcycnY29zaCcnZXhwJydleHBtMScnZmxvb3InJ2Zyb3VuZCdcbiAgICAgICAgJ2h5cG90JydpbXVsJydsb2cxcCcnbG9nMTAnJ2xvZzInJ21heCcnbWluJydwb3cnJ3JhbmRvbSdcbiAgICAgICAgJ3JvdW5kJydzaWduJydzaW4nJ3NpbmgnJ3NxcnQnJ3RhbicndGFuaCcndHJ1bmMnXG4gICAgICAgIF1cbiAgIFxuICAgIGZvciBsaSBpbiBbMC4uLmxpbmVzLmxlbmd0aF1cbiAgICAgICAgXG4gICAgICAgIG0gPSBsaW5lc1tsaV0ubWF0Y2ggcmVxdWlyZVJlZ0V4cFxuXG4gICAgICAgIGlmIG5vdCBtP1sxXT9cbiAgICAgICAgICAgIG0gPSBsaW5lc1tsaV0ubWF0Y2ggbWF0aFJlZ0V4cFxuICAgICAgICBcbiAgICAgICAgaWYgbT9bMV0/IGFuZCBtP1syXT9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgbm90IHJlcXVpcmVzW21bMl1dXG4gICAgICAgICAgICAgICAgaW5kZW50ID0gJydcbiAgICAgICAgICAgICAgICBjaSA9IDBcbiAgICAgICAgICAgICAgICB3aGlsZSBtWzFdW2NpXSA9PSAnICdcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50ICs9ICcgJ1xuICAgICAgICAgICAgICAgICAgICBjaSArPSAxXG4gICAgICAgICAgICAgICAgcmVxdWlyZXNbbVsyXV0gPSBpbmRleDpsaSwgdmFsdWU6bVsxXS50cmltKCksIG1vZHVsZTptWzJdLCBpbmRlbnQ6aW5kZW50XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgcmVxdWlyZXNbbVsyXV0udmFsdWUuc3RhcnRzV2l0aCAneydcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IGtleXNbbVsyXV1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZHVsZU5hbWUgPSBrc3RyLnN0cmlwIG1bMl0sICdcIlxcJydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdLZXlzID0gbW9kdWxlS2V5cyBtb2R1bGVOYW1lLCBmaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5c1ttWzJdXSA9IG5ld0tleXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgayBpbiBuZXdLZXlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZ2V4ZXNba10gPz0gbmV3IFJlZ0V4cCBcIihefFtcXFxcOlxcXFwoXFxcXHtdfFxcXFxzKykje2t9KFxcXFxzK1teOl18XFxcXHMqJHxbXFxcXC5cXFxcLFxcXFwoXSlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2Vycm9yIFwiY2FuJ3QgcmVxdWlyZSAje21bMl19IGZvciAje2ZpbGV9OiAje2Vycn0gXFxubW9kdWxlLnBhdGhzOlwiIG1vZHVsZS5wYXRoc1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZpcnN0SW5kZXggPz0gbGlcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgbGluZXNbbGldLnRyaW0oKS5zdGFydHNXaXRoICdtb2R1bGUuZXhwb3J0cydcbiAgICAgICAgICAgIG5hbWUgPSBsaW5lc1tsaV0udHJpbSgpLnNwbGl0KCc9JylbMV0/LnRyaW0oKVxuICAgICAgICAgICAgaWYgbmFtZSBhbmQgL1xcdysvLnRlc3QgbmFtZVxuICAgICAgICAgICAgICAgIGV4cG9ydHNbbmFtZS50b0xvd2VyQ2FzZSgpXSA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgZm9yIG1vZCx2YWx1ZXMgb2Yga2V5c1xuXG4gICAgICAgICAgICBmb3IgayBpbiB2YWx1ZXNcblxuICAgICAgICAgICAgICAgIHJlcVZhbHVlc1ttb2RdID89IFtdXG5cbiAgICAgICAgICAgICAgICBpZiBrIGluIHJlcVZhbHVlc1ttb2RdXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmVnZXhlc1trXSA/PSBuZXcgUmVnRXhwIFwiKF58W1xcXFwsXFxcXDpcXFxcKFxcXFxbXFxcXHtdfFxcXFxzKykje2t9KFxcXFxzK1teOl18XFxcXHMqJHxbXFxcXC5cXFxcLFxcXFwoXSlcIlxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiByZWdleGVzW2tdLnRlc3QgbGluZXNbbGldXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBkaXNzID0gZWRpdG9yLnN5bnRheC5nZXREaXNzIGxpXG4gICAgICAgICAgICAgICAgICAgIGRpc3MgPSBkaXNzLmZpbHRlciAoZCkgLT4gZD8uY2xzcyBhbmQgbm90IGQuY2xzcy5zdGFydHNXaXRoKCdjb21tZW50JykgYW5kIG5vdCBkLmNsc3Muc3RhcnRzV2l0aCgnc3RyaW5nJylcbiAgICAgICAgICAgICAgICAgICAgdGV4dCA9IGRpc3MubWFwKChzKSAtPiBzLm1hdGNoKS5qb2luICcgJ1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgcmVnZXhlc1trXS50ZXN0IHRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcVZhbHVlc1ttb2RdLnB1c2gga1xuXG4gICAgb3BlcmF0aW9ucyA9IFtdXG4gICAgICAgICBcbiAgICBmb3IgbW9kLHZhbHVlcyBvZiByZXFWYWx1ZXNcbiAgICBcbiAgICAgICAgZmlyc3RJbmRleCA/PSAwXG4gICAgICAgIFxuICAgICAgICBpZiByZXF1aXJlc1ttb2RdXG4gICAgICAgICAgICBmaXJzdEluZGV4ID0gcmVxdWlyZXNbbW9kXS5pbmRleCArIDFcbiAgICAgICAgZWxzZSBcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgdmFsdWVzID0gXy51bmlxIHZhbHVlc1xuICAgICAgICB2YWx1ZXMgPSB2YWx1ZXMuZmlsdGVyICh2KSAtPiB2IG5vdCBpbiBPYmplY3Qua2V5cyhleHBvcnRzKS5jb25jYXQgWydzdGF0ZSddXG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCB2YWx1ZXNcbiAgICBcbiAgICAgICAgICAgIHZhbHVlcy5zb3J0KClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgbW9kID09ICdNYXRoJ1xuICAgICAgICAgICAgICAgIHRleHQgPSBcIiN7cmVxdWlyZXNbbW9kXS5pbmRlbnR9eyAje3ZhbHVlcy5qb2luICcsICd9IH0gPSAje21vZH1cIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRleHQgPSBcIiN7cmVxdWlyZXNbbW9kXS5pbmRlbnR9eyAje3ZhbHVlcy5qb2luICcsICd9IH0gPSByZXF1aXJlICN7bW9kfVwiXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiByZXF1aXJlc1ttb2RdXG4gICAgICAgICAgICAgICAgb3BlcmF0aW9ucy5wdXNoIG9wOidjaGFuZ2UnIGluZGV4OnJlcXVpcmVzW21vZF0uaW5kZXgsIHRleHQ6dGV4dFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIG9wZXJhdGlvbnMucHVzaCBvcDonaW5zZXJ0JyBpbmRleDpmaXJzdEluZGV4LCB0ZXh0OnRleHRcbiAgICAgICAgICAgICAgICBcbiAgICBvcGVyYXRpb25zXG5cbnJlcS5tb2R1bGVLZXlzID0gbW9kdWxlS2V5c1xuICAgIFxubW9kdWxlLmV4cG9ydHMgPSByZXFcbiJdfQ==
//# sourceURL=../../coffee/tools/req.coffee