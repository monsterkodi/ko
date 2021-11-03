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
        } else if (moduleName === 'electron') {
            required = require('electron');
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS90b29scyIsInNvdXJjZXMiOlsicmVxLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxpR0FBQTtJQUFBOztBQVFBLEdBQUEsR0FBTSxPQUFBLENBQVEsS0FBUjs7QUFDSixTQUFGLEVBQUssbUJBQUwsRUFBYSxlQUFiLEVBQW1CLGVBQW5CLEVBQXlCLGlCQUF6QixFQUFnQzs7QUFDaEMsV0FBQSxHQUFjLE9BQUEsQ0FBUSxjQUFSOztBQUVkLGFBQUEsR0FBZ0I7O0FBQ2hCLFVBQUEsR0FBYzs7QUFFZCxVQUFBLEdBQWEsU0FBQyxVQUFELEVBQWEsSUFBYjtBQU1ULFFBQUE7QUFBQTtRQUNJLElBQUcsVUFBVSxDQUFDLFFBQVgsQ0FBb0IsS0FBcEIsQ0FBSDtZQUNJLFFBQUEsR0FBVyxJQURmO1NBQUEsTUFFSyxJQUFHLFVBQUEsS0FBYyxVQUFqQjtZQUNELFFBQUEsR0FBVyxPQUFBLENBQVEsVUFBUixFQURWO1NBQUEsTUFBQTtZQUdELFFBQUEsR0FBVyxXQUFBLENBQVksSUFBWixFQUFrQixJQUFsQjtZQUNYLFFBQUEsR0FBVyxRQUFBLENBQVMsVUFBVCxFQUpWO1NBSFQ7S0FBQSxhQUFBO1FBU007UUFDSCxPQUFBLENBQUMsS0FBRCxDQUFPLGdCQUFBLEdBQWlCLFVBQXhCLEVBQXFDLEdBQXJDLEVBVkg7O0lBWUEsSUFBQSxHQUFPO0lBQ1AsSUFBRyxRQUFIO1FBQ0ksSUFBRyxRQUFRLENBQUMsU0FBWjtZQUNJLElBQUEsR0FBTyxNQUFNLENBQUMsSUFBUCxDQUFZLFFBQVEsQ0FBQyxTQUFyQixFQURYO1NBQUEsTUFFSyxJQUFHLENBQUMsQ0FBQyxVQUFGLENBQWEsUUFBUSxDQUFDLG1CQUF0QixDQUFIO1lBQ0QsSUFBQSxHQUFPLFFBQVEsQ0FBQyxtQkFBVCxDQUFBLEVBRE47U0FBQSxNQUVBLElBQUcsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxRQUFY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LElBQXRCLEdBQXlCLENBQUMsTUFBTSxDQUFDLElBQVAsQ0FBWSxJQUFaLENBQUQsQ0FBekIsR0FBMkMsZUFBM0MsR0FBMEQsSUFIdkU7O1lBS0EsSUFBRyxRQUFTLENBQUEsR0FBQSxDQUFaO2dCQUNJLFVBQVUsQ0FBQyxJQUFYLENBQWdCO29CQUFBLEVBQUEsRUFBRyxRQUFIO29CQUFZLEtBQUEsRUFBTSxRQUFTLENBQUEsR0FBQSxDQUFJLENBQUMsS0FBaEM7b0JBQXVDLElBQUEsRUFBSyxJQUE1QztpQkFBaEIsRUFESjthQUFBLE1BQUE7Z0JBR0ksVUFBVSxDQUFDLElBQVgsQ0FBZ0I7b0JBQUEsRUFBQSxFQUFHLFFBQUg7b0JBQVksS0FBQSxFQUFNLFVBQWxCO29CQUE4QixJQUFBLEVBQUssSUFBbkM7aUJBQWhCLEVBSEo7YUFUSjs7QUFaSjtXQTBCQTtBQXJHRTs7QUF1R04sR0FBRyxDQUFDLFVBQUosR0FBaUI7O0FBRWpCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCBcbjAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAwIDAwXG4wMDAgICAwMDAgIDAwMCAgICAgICAwMDAgMDAwMCBcbjAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMCAwMFxuIyMjXG5cbmt4ayA9IHJlcXVpcmUgJ2t4aydcbnsgXywga2Vycm9yLCBrbG9nLCBrc3RyLCBzbGFzaCwgdmFsaWQgfSA9IGt4a1xucmVxdWlyZUxpa2UgPSByZXF1aXJlICdyZXF1aXJlLWxpa2UnXG5cbnJlcXVpcmVSZWdFeHAgPSAvXihcXHMqXFx7LitcXH0pXFxzKj1cXHMqcmVxdWlyZVxccysoW1xcJ1xcXCJdW1xcLlxcL1xcd10rW1xcJ1xcXCJdKS9cbm1hdGhSZWdFeHAgID0gL14oXFxzKlxcey4rXFx9KVxccyo9XFxzKihNYXRoKVxccyokL1xuXG5tb2R1bGVLZXlzID0gKG1vZHVsZU5hbWUsIGZpbGUpIC0+XG4gICAgXG4gICAgIyBrbG9nICdmaWxlJyBmaWxlXG4gICAgIyBpZiBtb2R1bGVOYW1lLnN0YXJ0c1dpdGggJy4nXG4gICAgICAgICMgbW9kdWxlTmFtZSA9IHNsYXNoLnJlc29sdmUoc2xhc2guam9pbiBzbGFzaC5kaXIoZmlsZSksIG1vZHVsZU5hbWUpLnJlcGxhY2UgJy9jb2ZmZWUvJyAnL2pzLydcblxuICAgIHRyeVxuICAgICAgICBpZiBtb2R1bGVOYW1lLmVuZHNXaXRoICdreGsnXG4gICAgICAgICAgICByZXF1aXJlZCA9IGt4a1xuICAgICAgICBlbHNlIGlmIG1vZHVsZU5hbWUgPT0gJ2VsZWN0cm9uJ1xuICAgICAgICAgICAgcmVxdWlyZWQgPSByZXF1aXJlICdlbGVjdHJvbidcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbVJlcXVpcmUgPSByZXF1aXJlTGlrZSBmaWxlLCB0cnVlXG4gICAgICAgICAgICByZXF1aXJlZCA9IG1SZXF1aXJlIG1vZHVsZU5hbWVcbiAgICAgICAgXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIGVycm9yIFwiY2FuJ3QgcmVxdWlyZSAje21vZHVsZU5hbWV9XCIgZXJyXG4gICAgXG4gICAga2V5cyA9IFtdXG4gICAgaWYgcmVxdWlyZWRcbiAgICAgICAgaWYgcmVxdWlyZWQucHJvdG90eXBlIFxuICAgICAgICAgICAga2V5cyA9IE9iamVjdC5rZXlzIHJlcXVpcmVkLnByb3RvdHlwZVxuICAgICAgICBlbHNlIGlmIF8uaXNGdW5jdGlvbiByZXF1aXJlZC5nZXRPd25Qcm9wZXJ0eU5hbWVzXG4gICAgICAgICAgICBrZXlzID0gcmVxdWlyZWQuZ2V0T3duUHJvcGVydHlOYW1lcygpXG4gICAgICAgIGVsc2UgaWYgXy5pc09iamVjdCByZXF1aXJlZFxuICAgICAgICAgICAga2V5cyA9IE9iamVjdC5rZXlzIHJlcXVpcmVkXG4gICAgICAgICAgICBcbiAgICBpZiBtb2R1bGVOYW1lLmVuZHNXaXRoICdreGsnIHRoZW4ga2V5cy5wdXNoICdhcHAnICMgb21nISB3aGF0IGFuIHVnbHkgaGFjayA6LSlcbiAgICBrZXlzXG4gICAgXG5yZXEgPSAoZmlsZSwgbGluZXMsIGVkaXRvcikgLT5cblxuICAgIHJlcXVpcmVzICA9IHt9XG4gICAgZXhwb3J0cyAgID0ge31cbiAgICByZXFWYWx1ZXMgPSB7fVxuICAgIHJlZ2V4ZXMgICA9ICckJzogL1teKlxcKVxcJ1xcXCJcXFxcXT9cXCRbXFxzXFwoXS9cbiAgICBmaXJzdEluZGV4ID0gbnVsbFxuICAgIFxuICAgIGtleXMgPSBNYXRoOiBbXG4gICAgICAgICdFJydMTjInJ0xOMTAnJ0xPRzJFJydMT0cxMEUnJ1BJJydTUVJUMV8yJydTUVJUMidcbiAgICAgICAgJ2FicycnYWNvcycnYWNvc2gnJ2FzaW4nJ2FzaW5oJydhdGFuJydhdGFuaCcnYXRhbjInXG4gICAgICAgICdjYnJ0JydjZWlsJydjbHozMicnY29zJydjb3NoJydleHAnJ2V4cG0xJydmbG9vcicnZnJvdW5kJ1xuICAgICAgICAnaHlwb3QnJ2ltdWwnJ2xvZzFwJydsb2cxMCcnbG9nMicnbWF4JydtaW4nJ3BvdycncmFuZG9tJ1xuICAgICAgICAncm91bmQnJ3NpZ24nJ3Npbicnc2luaCcnc3FydCcndGFuJyd0YW5oJyd0cnVuYydcbiAgICAgICAgXVxuICAgXG4gICAgZm9yIGxpIGluIFswLi4ubGluZXMubGVuZ3RoXVxuICAgICAgICBcbiAgICAgICAgbSA9IGxpbmVzW2xpXS5tYXRjaCByZXF1aXJlUmVnRXhwXG5cbiAgICAgICAgaWYgbm90IG0/WzFdP1xuICAgICAgICAgICAgbSA9IGxpbmVzW2xpXS5tYXRjaCBtYXRoUmVnRXhwXG4gICAgICAgIFxuICAgICAgICBpZiBtP1sxXT8gYW5kIG0/WzJdP1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBub3QgcmVxdWlyZXNbbVsyXV1cbiAgICAgICAgICAgICAgICBpbmRlbnQgPSAnJ1xuICAgICAgICAgICAgICAgIGNpID0gMFxuICAgICAgICAgICAgICAgIHdoaWxlIG1bMV1bY2ldID09ICcgJ1xuICAgICAgICAgICAgICAgICAgICBpbmRlbnQgKz0gJyAnXG4gICAgICAgICAgICAgICAgICAgIGNpICs9IDFcbiAgICAgICAgICAgICAgICByZXF1aXJlc1ttWzJdXSA9IGluZGV4OmxpLCB2YWx1ZTptWzFdLnRyaW0oKSwgbW9kdWxlOm1bMl0sIGluZGVudDppbmRlbnRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiByZXF1aXJlc1ttWzJdXS52YWx1ZS5zdGFydHNXaXRoICd7J1xuICAgICAgICAgICAgICAgICAgICBpZiBub3Qga2V5c1ttWzJdXVxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kdWxlTmFtZSA9IGtzdHIuc3RyaXAgbVsyXSwgJ1wiXFwnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0tleXMgPSBtb2R1bGVLZXlzIG1vZHVsZU5hbWUsIGZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXlzW21bMl1dID0gbmV3S2V5c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciBrIGluIG5ld0tleXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVnZXhlc1trXSA/PSBuZXcgUmVnRXhwIFwiKF58W1xcXFw6XFxcXChcXFxce118XFxcXHMrKSN7a30oXFxcXHMrW146XXxcXFxccyokfFtcXFxcLlxcXFwsXFxcXChdKVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXJyb3IgXCJjYW4ndCByZXF1aXJlICN7bVsyXX0gZm9yICN7ZmlsZX06ICN7ZXJyfSBcXG5tb2R1bGUucGF0aHM6XCIgbW9kdWxlLnBhdGhzXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZmlyc3RJbmRleCA/PSBsaVxuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBsaW5lc1tsaV0udHJpbSgpLnN0YXJ0c1dpdGggJ21vZHVsZS5leHBvcnRzJ1xuICAgICAgICAgICAgbmFtZSA9IGxpbmVzW2xpXS50cmltKCkuc3BsaXQoJz0nKVsxXT8udHJpbSgpXG4gICAgICAgICAgICBpZiBuYW1lIGFuZCAvXFx3Ky8udGVzdCBuYW1lXG4gICAgICAgICAgICAgICAgZXhwb3J0c1tuYW1lLnRvTG93ZXJDYXNlKCldID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBmb3IgbW9kLHZhbHVlcyBvZiBrZXlzXG5cbiAgICAgICAgICAgIGZvciBrIGluIHZhbHVlc1xuXG4gICAgICAgICAgICAgICAgcmVxVmFsdWVzW21vZF0gPz0gW11cblxuICAgICAgICAgICAgICAgIGlmIGsgaW4gcmVxVmFsdWVzW21vZF1cbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZWdleGVzW2tdID89IG5ldyBSZWdFeHAgXCIoXnxbXFxcXCxcXFxcOlxcXFwoXFxcXFtcXFxce118XFxcXHMrKSN7a30oXFxcXHMrW146XXxcXFxccyokfFtcXFxcLlxcXFwsXFxcXChdKVwiXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIHJlZ2V4ZXNba10udGVzdCBsaW5lc1tsaV1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGRpc3MgPSBlZGl0b3Iuc3ludGF4LmdldERpc3MgbGlcbiAgICAgICAgICAgICAgICAgICAgZGlzcyA9IGRpc3MuZmlsdGVyIChkKSAtPiBkPy5jbHNzIGFuZCBub3QgZC5jbHNzLnN0YXJ0c1dpdGgoJ2NvbW1lbnQnKSBhbmQgbm90IGQuY2xzcy5zdGFydHNXaXRoKCdzdHJpbmcnKVxuICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gZGlzcy5tYXAoKHMpIC0+IHMubWF0Y2gpLmpvaW4gJyAnXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiByZWdleGVzW2tdLnRlc3QgdGV4dFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxVmFsdWVzW21vZF0ucHVzaCBrXG5cbiAgICBvcGVyYXRpb25zID0gW11cbiAgICAgICAgIFxuICAgIGZvciBtb2QsdmFsdWVzIG9mIHJlcVZhbHVlc1xuICAgIFxuICAgICAgICBmaXJzdEluZGV4ID89IDBcbiAgICAgICAgXG4gICAgICAgIGlmIHJlcXVpcmVzW21vZF1cbiAgICAgICAgICAgIGZpcnN0SW5kZXggPSByZXF1aXJlc1ttb2RdLmluZGV4ICsgMVxuICAgICAgICBlbHNlIFxuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICB2YWx1ZXMgPSBfLnVuaXEgdmFsdWVzXG4gICAgICAgIHZhbHVlcyA9IHZhbHVlcy5maWx0ZXIgKHYpIC0+IHYgbm90IGluIE9iamVjdC5rZXlzKGV4cG9ydHMpLmNvbmNhdCBbJ3N0YXRlJ11cbiAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkIHZhbHVlc1xuICAgIFxuICAgICAgICAgICAgdmFsdWVzLnNvcnQoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBtb2QgPT0gJ01hdGgnXG4gICAgICAgICAgICAgICAgdGV4dCA9IFwiI3tyZXF1aXJlc1ttb2RdLmluZGVudH17ICN7dmFsdWVzLmpvaW4gJywgJ30gfSA9ICN7bW9kfVwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdGV4dCA9IFwiI3tyZXF1aXJlc1ttb2RdLmluZGVudH17ICN7dmFsdWVzLmpvaW4gJywgJ30gfSA9IHJlcXVpcmUgI3ttb2R9XCJcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHJlcXVpcmVzW21vZF1cbiAgICAgICAgICAgICAgICBvcGVyYXRpb25zLnB1c2ggb3A6J2NoYW5nZScgaW5kZXg6cmVxdWlyZXNbbW9kXS5pbmRleCwgdGV4dDp0ZXh0XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgb3BlcmF0aW9ucy5wdXNoIG9wOidpbnNlcnQnIGluZGV4OmZpcnN0SW5kZXgsIHRleHQ6dGV4dFxuICAgICAgICAgICAgICAgIFxuICAgIG9wZXJhdGlvbnNcblxucmVxLm1vZHVsZUtleXMgPSBtb2R1bGVLZXlzXG4gICAgXG5tb2R1bGUuZXhwb3J0cyA9IHJlcVxuIl19
//# sourceURL=../../coffee/tools/req.coffee