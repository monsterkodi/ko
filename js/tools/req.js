// koffee 1.12.0

/*
00000000   00000000   0000000 
000   000  000       000   000
0000000    0000000   000 00 00
000   000  000       000 0000 
000   000  00000000   00000 00
 */
var _, kerror, klog, kstr, mathRegExp, moduleKeys, ref, req, requireRegExp, slash, valid,
    indexOf = [].indexOf;

ref = require('kxk'), _ = ref._, kerror = ref.kerror, klog = ref.klog, kstr = ref.kstr, slash = ref.slash, valid = ref.valid;

requireRegExp = /^(\s*\{.+\})\s*=\s*require\s+([\'\"][\.\/\w]+[\'\"])/;

mathRegExp = /^(\s*\{.+\})\s*=\s*(Math)\s*$/;

moduleKeys = function(moduleName, file) {
    var fileDir, nodeModules, pkgDir, required;
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
    if (required) {
        if (required.prototype) {
            return Object.keys(required.prototype);
        }
        if (required.getOwnPropertyNames) {
            klog('getOwnPropertyNames', required.getOwnPropertyNames());
            return required.getOwnPropertyNames();
        }
        return Object.keys(required);
    }
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

req.moduleKeys = moduleKeys;

module.exports = req;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS90b29scyIsInNvdXJjZXMiOlsicmVxLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxvRkFBQTtJQUFBOztBQVFBLE1BQTBDLE9BQUEsQ0FBUSxLQUFSLENBQTFDLEVBQUUsU0FBRixFQUFLLG1CQUFMLEVBQWEsZUFBYixFQUFtQixlQUFuQixFQUF5QixpQkFBekIsRUFBZ0M7O0FBRWhDLGFBQUEsR0FBZ0I7O0FBQ2hCLFVBQUEsR0FBYTs7QUFFYixVQUFBLEdBQWEsU0FBQyxVQUFELEVBQWEsSUFBYjtBQUVULFFBQUE7SUFBQSxJQUFHLE1BQUEsR0FBUyxLQUFLLENBQUMsR0FBTixDQUFVLElBQVYsQ0FBWjtRQUNJLFdBQUEsR0FBYyxLQUFLLENBQUMsT0FBTixDQUFjLEtBQUssQ0FBQyxJQUFOLENBQVcsTUFBWCxFQUFtQixjQUFuQixDQUFkO1FBQ2QsSUFBRyxhQUFtQixNQUFNLENBQUMsS0FBMUIsRUFBQSxXQUFBLEtBQUg7WUFDSSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQWIsQ0FBa0IsV0FBbEIsRUFESjtTQUZKOztJQUtBLElBQUcsVUFBVSxDQUFDLFVBQVgsQ0FBc0IsR0FBdEIsQ0FBSDtRQUNJLE9BQUEsR0FBVSxLQUFLLENBQUMsT0FBTixDQUFjLEtBQUssQ0FBQyxJQUFOLENBQVcsS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWLENBQVgsRUFBNEIsVUFBNUIsQ0FBZCxDQUFxRCxDQUFDLE9BQXRELENBQThELFVBQTlELEVBQXlFLE1BQXpFO1FBQ1YsT0FBQSxHQUFVLEtBQUssQ0FBQyxPQUFOLENBQWMsS0FBSyxDQUFDLEdBQU4sQ0FBVSxPQUFWLENBQWQ7UUFDVixJQUFHLGFBQWUsTUFBTSxDQUFDLEtBQXRCLEVBQUEsT0FBQSxLQUFIO1lBQ0ksTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFiLENBQXFCLE9BQXJCLEVBREo7O1FBRUEsVUFB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QUFTLENBQUEsR0FBQSxDQUFJLENBQUMsTUFBZixHQUFzQixJQUF0QixHQUF5QixDQUFDLE1BQU0sQ0FBQyxJQUFQLENBQVksSUFBWixDQUFELENBQXpCLEdBQTJDLE9BQTNDLEdBQWtELElBRC9EO2FBQUEsTUFBQTtnQkFHSSxJQUFBLEdBQVUsUUFBUyxDQUFBLEdBQUEsQ0FBSSxDQUFDLE1BQWYsR0FBc0IsSUFBdEIsR0FBeUIsQ0FBQyxNQUFNLENBQUMsSUFBUCxDQUFZLElBQVosQ0FBRCxDQUF6QixHQUEyQyxlQUEzQyxHQUEwRCxJQUh2RTs7WUFLQSxJQUFHLFFBQVMsQ0FBQSxHQUFBLENBQVo7Z0JBQ0ksVUFBVSxDQUFDLElBQVgsQ0FBZ0I7b0JBQUEsRUFBQSxFQUFHLFFBQUg7b0JBQVksS0FBQSxFQUFNLFFBQVMsQ0FBQSxHQUFBLENBQUksQ0FBQyxLQUFoQztvQkFBdUMsSUFBQSxFQUFLLElBQTVDO2lCQUFoQixFQURKO2FBQUEsTUFBQTtnQkFHSSxVQUFVLENBQUMsSUFBWCxDQUFnQjtvQkFBQSxFQUFBLEVBQUcsUUFBSDtvQkFBWSxLQUFBLEVBQU0sVUFBbEI7b0JBQThCLElBQUEsRUFBSyxJQUFuQztpQkFBaEIsRUFISjthQVRKOztBQVpKO1dBMEJBO0FBckdFOztBQXVHTixHQUFHLENBQUMsVUFBSixHQUFpQjs7QUFFakIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwIFxuMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMDAgMDBcbjAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAwMDAwIFxuMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwIDAwXG4jIyNcblxueyBfLCBrZXJyb3IsIGtsb2csIGtzdHIsIHNsYXNoLCB2YWxpZCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5yZXF1aXJlUmVnRXhwID0gL14oXFxzKlxcey4rXFx9KVxccyo9XFxzKnJlcXVpcmVcXHMrKFtcXCdcXFwiXVtcXC5cXC9cXHddK1tcXCdcXFwiXSkvXG5tYXRoUmVnRXhwID0gL14oXFxzKlxcey4rXFx9KVxccyo9XFxzKihNYXRoKVxccyokL1xuXG5tb2R1bGVLZXlzID0gKG1vZHVsZU5hbWUsIGZpbGUpIC0+XG4gICAgXG4gICAgaWYgcGtnRGlyID0gc2xhc2gucGtnIGZpbGVcbiAgICAgICAgbm9kZU1vZHVsZXMgPSBzbGFzaC51bnNsYXNoIHNsYXNoLmpvaW4gcGtnRGlyLCAnbm9kZV9tb2R1bGVzJ1xuICAgICAgICBpZiBub2RlTW9kdWxlcyBub3QgaW4gbW9kdWxlLnBhdGhzXG4gICAgICAgICAgICBtb2R1bGUucGF0aHMucHVzaCBub2RlTW9kdWxlc1xuICAgICAgICAgXG4gICAgaWYgbW9kdWxlTmFtZS5zdGFydHNXaXRoICcuJ1xuICAgICAgICBmaWxlRGlyID0gc2xhc2gucmVzb2x2ZShzbGFzaC5qb2luIHNsYXNoLmRpcihmaWxlKSwgbW9kdWxlTmFtZSkucmVwbGFjZSAnL2NvZmZlZS8nICcvanMvJ1xuICAgICAgICBmaWxlRGlyID0gc2xhc2gudW5zbGFzaCBzbGFzaC5kaXIgZmlsZURpclxuICAgICAgICBpZiBmaWxlRGlyIG5vdCBpbiBtb2R1bGUucGF0aHNcbiAgICAgICAgICAgIG1vZHVsZS5wYXRocy51bnNoaWZ0IGZpbGVEaXJcbiAgICAgICAgbW9kdWxlTmFtZSA9IHNsYXNoLmZpbGUgbW9kdWxlTmFtZVxuICAgICAgICAgXG4gICAgcmVxdWlyZWQgPSByZXF1aXJlIG1vZHVsZU5hbWVcbiAgICBpZiByZXF1aXJlZFxuICAgICAgICBpZiByZXF1aXJlZC5wcm90b3R5cGVcbiAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyByZXF1aXJlZC5wcm90b3R5cGVcbiAgICAgICAgaWYgcmVxdWlyZWQuZ2V0T3duUHJvcGVydHlOYW1lc1xuICAgICAgICAgICAga2xvZyAnZ2V0T3duUHJvcGVydHlOYW1lcycgcmVxdWlyZWQuZ2V0T3duUHJvcGVydHlOYW1lcygpXG4gICAgICAgICAgICByZXR1cm4gcmVxdWlyZWQuZ2V0T3duUHJvcGVydHlOYW1lcygpXG4gICAgICAgIE9iamVjdC5rZXlzIHJlcXVpcmVkXG4gICAgXG5yZXEgPSAoZmlsZSwgbGluZXMsIGVkaXRvcikgLT5cblxuICAgIHJlcXVpcmVzICA9IHt9XG4gICAgZXhwb3J0cyAgID0ge31cbiAgICByZXFWYWx1ZXMgPSB7fVxuICAgIHJlZ2V4ZXMgICA9ICckJzogL1teKlxcKVxcJ1xcXCJcXFxcXT9cXCRbXFxzXFwoXS9cbiAgICBmaXJzdEluZGV4ID0gbnVsbFxuICAgIFxuICAgIGtleXMgPSBNYXRoOiBbXG4gICAgICAgICdFJydMTjInJ0xOMTAnJ0xPRzJFJydMT0cxMEUnJ1BJJydTUVJUMV8yJydTUVJUMidcbiAgICAgICAgJ2FicycnYWNvcycnYWNvc2gnJ2FzaW4nJ2FzaW5oJydhdGFuJydhdGFuaCcnYXRhbjInXG4gICAgICAgICdjYnJ0JydjZWlsJydjbHozMicnY29zJydjb3NoJydleHAnJ2V4cG0xJydmbG9vcicnZnJvdW5kJ1xuICAgICAgICAnaHlwb3QnJ2ltdWwnJ2xvZzFwJydsb2cxMCcnbG9nMicnbWF4JydtaW4nJ3BvdycncmFuZG9tJ1xuICAgICAgICAncm91bmQnJ3NpZ24nJ3Npbicnc2luaCcnc3FydCcndGFuJyd0YW5oJyd0cnVuYydcbiAgICAgICAgXVxuICAgXG4gICAgZm9yIGxpIGluIFswLi4ubGluZXMubGVuZ3RoXVxuICAgICAgICBcbiAgICAgICAgbSA9IGxpbmVzW2xpXS5tYXRjaCByZXF1aXJlUmVnRXhwXG5cbiAgICAgICAgaWYgbm90IG0/WzFdP1xuICAgICAgICAgICAgbSA9IGxpbmVzW2xpXS5tYXRjaCBtYXRoUmVnRXhwXG4gICAgICAgIFxuICAgICAgICBpZiBtP1sxXT8gYW5kIG0/WzJdP1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBub3QgcmVxdWlyZXNbbVsyXV1cbiAgICAgICAgICAgICAgICBpbmRlbnQgPSAnJ1xuICAgICAgICAgICAgICAgIGNpID0gMFxuICAgICAgICAgICAgICAgIHdoaWxlIG1bMV1bY2ldID09ICcgJ1xuICAgICAgICAgICAgICAgICAgICBpbmRlbnQgKz0gJyAnXG4gICAgICAgICAgICAgICAgICAgIGNpICs9IDFcbiAgICAgICAgICAgICAgICByZXF1aXJlc1ttWzJdXSA9IGluZGV4OmxpLCB2YWx1ZTptWzFdLnRyaW0oKSwgbW9kdWxlOm1bMl0sIGluZGVudDppbmRlbnRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiByZXF1aXJlc1ttWzJdXS52YWx1ZS5zdGFydHNXaXRoICd7J1xuICAgICAgICAgICAgICAgICAgICBpZiBub3Qga2V5c1ttWzJdXVxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kdWxlTmFtZSA9IGtzdHIuc3RyaXAgbVsyXSwgJ1wiXFwnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0tleXMgPSBtb2R1bGVLZXlzIG1vZHVsZU5hbWUsIGZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXlzW21bMl1dID0gbmV3S2V5c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciBrIGluIG5ld0tleXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVnZXhlc1trXSA/PSBuZXcgUmVnRXhwIFwiKF58W1xcXFw6XFxcXChcXFxce118XFxcXHMrKSN7a30oXFxcXHMrW146XXxcXFxccyokfFtcXFxcLlxcXFwoXSlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2Vycm9yIFwiY2FuJ3QgcmVxdWlyZSAje21bMl19IGZvciAje2ZpbGV9OiAje2Vycn0gXFxubW9kdWxlLnBhdGhzOlwiIG1vZHVsZS5wYXRoc1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZpcnN0SW5kZXggPz0gbGlcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgbGluZXNbbGldLnRyaW0oKS5zdGFydHNXaXRoICdtb2R1bGUuZXhwb3J0cydcbiAgICAgICAgICAgIG5hbWUgPSBsaW5lc1tsaV0udHJpbSgpLnNwbGl0KCc9JylbMV0/LnRyaW0oKVxuICAgICAgICAgICAgaWYgbmFtZSBhbmQgL1xcdysvLnRlc3QgbmFtZVxuICAgICAgICAgICAgICAgIGV4cG9ydHNbbmFtZS50b0xvd2VyQ2FzZSgpXSA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgZm9yIG1vZCx2YWx1ZXMgb2Yga2V5c1xuXG4gICAgICAgICAgICBmb3IgayBpbiB2YWx1ZXNcblxuICAgICAgICAgICAgICAgIHJlcVZhbHVlc1ttb2RdID89IFtdXG5cbiAgICAgICAgICAgICAgICBpZiBrIGluIHJlcVZhbHVlc1ttb2RdXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmVnZXhlc1trXSA/PSBuZXcgUmVnRXhwIFwiKF58W1xcXFw6XFxcXChcXFxce118XFxcXHMrKSN7a30oXFxcXHMrW146XXxcXFxccyokfFtcXFxcLlxcXFwoXSlcIlxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiByZWdleGVzW2tdLnRlc3QgbGluZXNbbGldXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBkaXNzID0gZWRpdG9yLnN5bnRheC5nZXREaXNzIGxpXG4gICAgICAgICAgICAgICAgICAgIGRpc3MgPSBkaXNzLmZpbHRlciAoZCkgLT4gZD8uY2xzcyBhbmQgbm90IGQuY2xzcy5zdGFydHNXaXRoKCdjb21tZW50JykgYW5kIG5vdCBkLmNsc3Muc3RhcnRzV2l0aCgnc3RyaW5nJylcbiAgICAgICAgICAgICAgICAgICAgdGV4dCA9IGRpc3MubWFwKChzKSAtPiBzLm1hdGNoKS5qb2luICcgJ1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgcmVnZXhlc1trXS50ZXN0IHRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcVZhbHVlc1ttb2RdLnB1c2gga1xuXG4gICAgb3BlcmF0aW9ucyA9IFtdXG4gICAgICAgICBcbiAgICBmb3IgbW9kLHZhbHVlcyBvZiByZXFWYWx1ZXNcbiAgICBcbiAgICAgICAgZmlyc3RJbmRleCA/PSAwXG4gICAgICAgIFxuICAgICAgICBpZiByZXF1aXJlc1ttb2RdXG4gICAgICAgICAgICBmaXJzdEluZGV4ID0gcmVxdWlyZXNbbW9kXS5pbmRleCArIDFcbiAgICAgICAgZWxzZSBcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgdmFsdWVzID0gXy51bmlxIHZhbHVlc1xuICAgICAgICB2YWx1ZXMgPSB2YWx1ZXMuZmlsdGVyICh2KSAtPiB2IG5vdCBpbiBPYmplY3Qua2V5cyhleHBvcnRzKS5jb25jYXQgWydzdGF0ZSddXG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCB2YWx1ZXNcbiAgICBcbiAgICAgICAgICAgIHZhbHVlcy5zb3J0KClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgbW9kID09ICdNYXRoJ1xuICAgICAgICAgICAgICAgIHRleHQgPSBcIiN7cmVxdWlyZXNbbW9kXS5pbmRlbnR9eyAje3ZhbHVlcy5qb2luICcsICd9IH0gPSAje21vZH1cIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRleHQgPSBcIiN7cmVxdWlyZXNbbW9kXS5pbmRlbnR9eyAje3ZhbHVlcy5qb2luICcsICd9IH0gPSByZXF1aXJlICN7bW9kfVwiXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiByZXF1aXJlc1ttb2RdXG4gICAgICAgICAgICAgICAgb3BlcmF0aW9ucy5wdXNoIG9wOidjaGFuZ2UnIGluZGV4OnJlcXVpcmVzW21vZF0uaW5kZXgsIHRleHQ6dGV4dFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIG9wZXJhdGlvbnMucHVzaCBvcDonaW5zZXJ0JyBpbmRleDpmaXJzdEluZGV4LCB0ZXh0OnRleHRcbiAgICAgICAgICAgICAgICBcbiAgICBvcGVyYXRpb25zXG5cbnJlcS5tb2R1bGVLZXlzID0gbW9kdWxlS2V5c1xuICAgIFxubW9kdWxlLmV4cG9ydHMgPSByZXFcbiJdfQ==
//# sourceURL=../../coffee/tools/req.coffee