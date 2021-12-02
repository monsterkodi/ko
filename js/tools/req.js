// koffee 1.20.0

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
    var err, keys, required;
    try {
        if (moduleName.endsWith('kxk')) {
            required = kxk;
        } else if (moduleName === 'electron') {
            required = require('electron');
        } else {
            console.log('require', moduleName);
            required = require(moduleName);
        }
    } catch (error) {
        err = error;
        console.error("can't require " + moduleName, err);
        return [];
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
                            kerror("ko can't require " + m[2] + " for " + file + ": " + err + " \nmodule.paths:", module.paths);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS90b29scyIsInNvdXJjZXMiOlsicmVxLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxpR0FBQTtJQUFBOztBQVFBLEdBQUEsR0FBTSxPQUFBLENBQVEsS0FBUjs7QUFDSixTQUFGLEVBQUssbUJBQUwsRUFBYSxlQUFiLEVBQW1CLGVBQW5CLEVBQXlCLGlCQUF6QixFQUFnQzs7QUFDaEMsV0FBQSxHQUFjLE9BQUEsQ0FBUSxjQUFSOztBQUVkLGFBQUEsR0FBZ0I7O0FBQ2hCLFVBQUEsR0FBYzs7QUFFZCxVQUFBLEdBQWEsU0FBQyxVQUFELEVBQWEsSUFBYjtBQU1ULFFBQUE7QUFBQTtRQUNJLElBQUcsVUFBVSxDQUFDLFFBQVgsQ0FBb0IsS0FBcEIsQ0FBSDtZQUNJLFFBQUEsR0FBVyxJQURmO1NBQUEsTUFFSyxJQUFHLFVBQUEsS0FBYyxVQUFqQjtZQUNELFFBQUEsR0FBVyxPQUFBLENBQVEsVUFBUixFQURWO1NBQUEsTUFBQTtZQUtGLE9BQUEsQ0FBQyxHQUFELENBQUssU0FBTCxFQUFlLFVBQWY7WUFDQyxRQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVIsRUFOVjtTQUhUO0tBQUEsYUFBQTtRQVdNO1FBQ0gsT0FBQSxDQUFDLEtBQUQsQ0FBTyxnQkFBQSxHQUFpQixVQUF4QixFQUFxQyxHQUFyQztBQUNDLGVBQU8sR0FiWDs7SUFlQSxJQUFBLEdBQU87SUFDUCxJQUFHLFFBQUg7UUFDSSxJQUFHLFFBQVEsQ0FBQyxTQUFaO1lBQ0ksSUFBQSxHQUFPLE1BQU0sQ0FBQyxJQUFQLENBQVksUUFBUSxDQUFDLFNBQXJCLEVBRFg7U0FBQSxNQUVLLElBQUcsQ0FBQyxDQUFDLFVBQUYsQ0FBYSxRQUFRLENBQUMsbUJBQXRCLENBQUg7WUFDRCxJQUFBLEdBQU8sUUFBUSxDQUFDLG1CQUFULENBQUEsRUFETjtTQUFBLE1BRUEsSUFBRyxDQUFDLENBQUMsUUFBRixD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QWYsR0FBc0IsSUFBdEIsR0FBeUIsQ0FBQyxNQUFNLENBQUMsSUFBUCxDQUFZLElBQVosQ0FBRCxDQUF6QixHQUEyQyxlQUEzQyxHQUEwRCxJQUh2RTs7WUFLQSxJQUFHLFFBQVMsQ0FBQSxHQUFBLENBQVo7Z0JBQ0ksVUFBVSxDQUFDLElBQVgsQ0FBZ0I7b0JBQUEsRUFBQSxFQUFHLFFBQUg7b0JBQVksS0FBQSxFQUFNLFFBQVMsQ0FBQSxHQUFBLENBQUksQ0FBQyxLQUFoQztvQkFBdUMsSUFBQSxFQUFLLElBQTVDO2lCQUFoQixFQURKO2FBQUEsTUFBQTtnQkFHSSxVQUFVLENBQUMsSUFBWCxDQUFnQjtvQkFBQSxFQUFBLEVBQUcsUUFBSDtvQkFBWSxLQUFBLEVBQU0sVUFBbEI7b0JBQThCLElBQUEsRUFBSyxJQUFuQztpQkFBaEIsRUFISjthQVRKOztBQVpKO1dBMEJBO0FBdEdFOztBQXdHTixHQUFHLENBQUMsVUFBSixHQUFpQjs7QUFFakIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwIFxuMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMDAgMDBcbjAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAwMDAwIFxuMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwIDAwXG4jIyNcblxua3hrID0gcmVxdWlyZSAna3hrJ1xueyBfLCBrZXJyb3IsIGtsb2csIGtzdHIsIHNsYXNoLCB2YWxpZCB9ID0ga3hrXG5yZXF1aXJlTGlrZSA9IHJlcXVpcmUgJ3JlcXVpcmUtbGlrZSdcblxucmVxdWlyZVJlZ0V4cCA9IC9eKFxccypcXHsuK1xcfSlcXHMqPVxccypyZXF1aXJlXFxzKyhbXFwnXFxcIl1bXFwuXFwvXFx3XStbXFwnXFxcIl0pL1xubWF0aFJlZ0V4cCAgPSAvXihcXHMqXFx7LitcXH0pXFxzKj1cXHMqKE1hdGgpXFxzKiQvXG5cbm1vZHVsZUtleXMgPSAobW9kdWxlTmFtZSwgZmlsZSkgLT5cbiAgICBcbiAgICAjIGtsb2cgJ2ZpbGUnIGZpbGVcbiAgICAjIGlmIG1vZHVsZU5hbWUuc3RhcnRzV2l0aCAnLidcbiAgICAgICAgIyBtb2R1bGVOYW1lID0gc2xhc2gucmVzb2x2ZShzbGFzaC5qb2luIHNsYXNoLmRpcihmaWxlKSwgbW9kdWxlTmFtZSkucmVwbGFjZSAnL2NvZmZlZS8nICcvanMvJ1xuXG4gICAgdHJ5XG4gICAgICAgIGlmIG1vZHVsZU5hbWUuZW5kc1dpdGggJ2t4aydcbiAgICAgICAgICAgIHJlcXVpcmVkID0ga3hrXG4gICAgICAgIGVsc2UgaWYgbW9kdWxlTmFtZSA9PSAnZWxlY3Ryb24nXG4gICAgICAgICAgICByZXF1aXJlZCA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICAjIG1SZXF1aXJlID0gcmVxdWlyZUxpa2UgZmlsZSwgdHJ1ZVxuICAgICAgICAgICAgIyByZXF1aXJlZCA9IG1SZXF1aXJlIG1vZHVsZU5hbWVcbiAgICAgICAgICAgIGxvZyAncmVxdWlyZScgbW9kdWxlTmFtZVxuICAgICAgICAgICAgcmVxdWlyZWQgPSByZXF1aXJlIG1vZHVsZU5hbWVcbiAgICAgICAgXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIGVycm9yIFwiY2FuJ3QgcmVxdWlyZSAje21vZHVsZU5hbWV9XCIgZXJyXG4gICAgICAgIHJldHVybiBbXVxuICAgIFxuICAgIGtleXMgPSBbXVxuICAgIGlmIHJlcXVpcmVkXG4gICAgICAgIGlmIHJlcXVpcmVkLnByb3RvdHlwZSBcbiAgICAgICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyByZXF1aXJlZC5wcm90b3R5cGVcbiAgICAgICAgZWxzZSBpZiBfLmlzRnVuY3Rpb24gcmVxdWlyZWQuZ2V0T3duUHJvcGVydHlOYW1lc1xuICAgICAgICAgICAga2V5cyA9IHJlcXVpcmVkLmdldE93blByb3BlcnR5TmFtZXMoKVxuICAgICAgICBlbHNlIGlmIF8uaXNPYmplY3QgcmVxdWlyZWRcbiAgICAgICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyByZXF1aXJlZFxuICAgICAgICAgICAgXG4gICAgaWYgbW9kdWxlTmFtZS5lbmRzV2l0aCAna3hrJyB0aGVuIGtleXMucHVzaCAnYXBwJyAjIG9tZyEgd2hhdCBhbiB1Z2x5IGhhY2sgOi0pXG4gICAga2V5c1xuICAgIFxucmVxID0gKGZpbGUsIGxpbmVzLCBlZGl0b3IpIC0+XG5cbiAgICByZXF1aXJlcyAgPSB7fVxuICAgIGV4cG9ydHMgICA9IHt9XG4gICAgcmVxVmFsdWVzID0ge31cbiAgICByZWdleGVzICAgPSAnJCc6IC9bXipcXClcXCdcXFwiXFxcXF0/XFwkW1xcc1xcKF0vXG4gICAgZmlyc3RJbmRleCA9IG51bGxcbiAgICBcbiAgICBrZXlzID0gTWF0aDogW1xuICAgICAgICAnRScnTE4yJydMTjEwJydMT0cyRScnTE9HMTBFJydQSScnU1FSVDFfMicnU1FSVDInXG4gICAgICAgICdhYnMnJ2Fjb3MnJ2Fjb3NoJydhc2luJydhc2luaCcnYXRhbicnYXRhbmgnJ2F0YW4yJ1xuICAgICAgICAnY2JydCcnY2VpbCcnY2x6MzInJ2NvcycnY29zaCcnZXhwJydleHBtMScnZmxvb3InJ2Zyb3VuZCdcbiAgICAgICAgJ2h5cG90JydpbXVsJydsb2cxcCcnbG9nMTAnJ2xvZzInJ21heCcnbWluJydwb3cnJ3JhbmRvbSdcbiAgICAgICAgJ3JvdW5kJydzaWduJydzaW4nJ3NpbmgnJ3NxcnQnJ3RhbicndGFuaCcndHJ1bmMnXG4gICAgICAgIF1cbiAgIFxuICAgIGZvciBsaSBpbiBbMC4uLmxpbmVzLmxlbmd0aF1cbiAgICAgICAgXG4gICAgICAgIG0gPSBsaW5lc1tsaV0ubWF0Y2ggcmVxdWlyZVJlZ0V4cFxuXG4gICAgICAgIGlmIG5vdCBtP1sxXT9cbiAgICAgICAgICAgIG0gPSBsaW5lc1tsaV0ubWF0Y2ggbWF0aFJlZ0V4cFxuICAgICAgICBcbiAgICAgICAgaWYgbT9bMV0/IGFuZCBtP1syXT9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgbm90IHJlcXVpcmVzW21bMl1dXG4gICAgICAgICAgICAgICAgaW5kZW50ID0gJydcbiAgICAgICAgICAgICAgICBjaSA9IDBcbiAgICAgICAgICAgICAgICB3aGlsZSBtWzFdW2NpXSA9PSAnICdcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50ICs9ICcgJ1xuICAgICAgICAgICAgICAgICAgICBjaSArPSAxXG4gICAgICAgICAgICAgICAgcmVxdWlyZXNbbVsyXV0gPSBpbmRleDpsaSwgdmFsdWU6bVsxXS50cmltKCksIG1vZHVsZTptWzJdLCBpbmRlbnQ6aW5kZW50XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgcmVxdWlyZXNbbVsyXV0udmFsdWUuc3RhcnRzV2l0aCAneydcbiAgICAgICAgICAgICAgICAgICAgIyBrbG9nICdyZXF1aXJlc1ttWzJdXS52YWx1ZS5zdGFydHNXaXRoIHsnIHJlcXVpcmVzW21bMl1dXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBrZXlzW21bMl1dXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGVOYW1lID0ga3N0ci5zdHJpcCBtWzJdLCAnXCJcXCcnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3S2V5cyA9IG1vZHVsZUtleXMgbW9kdWxlTmFtZSwgZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleXNbbVsyXV0gPSBuZXdLZXlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIGsgaW4gbmV3S2V5c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWdleGVzW2tdID89IG5ldyBSZWdFeHAgXCIoXnxbXFxcXDpcXFxcKFxcXFx7XXxcXFxccyspI3trfShcXFxccytbXjpdfFxcXFxzKiR8W1xcXFwuXFxcXCxcXFxcKF0pXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtlcnJvciBcImtvIGNhbid0IHJlcXVpcmUgI3ttWzJdfSBmb3IgI3tmaWxlfTogI3tlcnJ9IFxcbm1vZHVsZS5wYXRoczpcIiBtb2R1bGUucGF0aHNcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmaXJzdEluZGV4ID89IGxpXG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIGxpbmVzW2xpXS50cmltKCkuc3RhcnRzV2l0aCAnbW9kdWxlLmV4cG9ydHMnXG4gICAgICAgICAgICBuYW1lID0gbGluZXNbbGldLnRyaW0oKS5zcGxpdCgnPScpWzFdPy50cmltKClcbiAgICAgICAgICAgIGlmIG5hbWUgYW5kIC9cXHcrLy50ZXN0IG5hbWVcbiAgICAgICAgICAgICAgICBleHBvcnRzW25hbWUudG9Mb3dlckNhc2UoKV0gPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGZvciBtb2QsdmFsdWVzIG9mIGtleXNcblxuICAgICAgICAgICAgZm9yIGsgaW4gdmFsdWVzXG5cbiAgICAgICAgICAgICAgICByZXFWYWx1ZXNbbW9kXSA/PSBbXVxuXG4gICAgICAgICAgICAgICAgaWYgayBpbiByZXFWYWx1ZXNbbW9kXVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJlZ2V4ZXNba10gPz0gbmV3IFJlZ0V4cCBcIihefFtcXFxcLFxcXFw6XFxcXChcXFxcW1xcXFx7XXxcXFxccyspI3trfShcXFxccytbXjpdfFxcXFxzKiR8W1xcXFwuXFxcXCxcXFxcKF0pXCJcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgcmVnZXhlc1trXS50ZXN0IGxpbmVzW2xpXVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZGlzcyA9IGVkaXRvci5zeW50YXguZ2V0RGlzcyBsaVxuICAgICAgICAgICAgICAgICAgICBkaXNzID0gZGlzcy5maWx0ZXIgKGQpIC0+IGQ/LmNsc3MgYW5kIG5vdCBkLmNsc3Muc3RhcnRzV2l0aCgnY29tbWVudCcpIGFuZCBub3QgZC5jbHNzLnN0YXJ0c1dpdGgoJ3N0cmluZycpXG4gICAgICAgICAgICAgICAgICAgIHRleHQgPSBkaXNzLm1hcCgocykgLT4gcy5tYXRjaCkuam9pbiAnICdcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIHJlZ2V4ZXNba10udGVzdCB0ZXh0XG4gICAgICAgICAgICAgICAgICAgICAgICByZXFWYWx1ZXNbbW9kXS5wdXNoIGtcblxuICAgIG9wZXJhdGlvbnMgPSBbXVxuICAgICAgICAgXG4gICAgZm9yIG1vZCx2YWx1ZXMgb2YgcmVxVmFsdWVzXG4gICAgXG4gICAgICAgIGZpcnN0SW5kZXggPz0gMFxuICAgICAgICBcbiAgICAgICAgaWYgcmVxdWlyZXNbbW9kXVxuICAgICAgICAgICAgZmlyc3RJbmRleCA9IHJlcXVpcmVzW21vZF0uaW5kZXggKyAxXG4gICAgICAgIGVsc2UgXG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHZhbHVlcyA9IF8udW5pcSB2YWx1ZXNcbiAgICAgICAgdmFsdWVzID0gdmFsdWVzLmZpbHRlciAodikgLT4gdiBub3QgaW4gT2JqZWN0LmtleXMoZXhwb3J0cykuY29uY2F0IFsnc3RhdGUnXVxuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgdmFsdWVzXG4gICAgXG4gICAgICAgICAgICB2YWx1ZXMuc29ydCgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG1vZCA9PSAnTWF0aCdcbiAgICAgICAgICAgICAgICB0ZXh0ID0gXCIje3JlcXVpcmVzW21vZF0uaW5kZW50fXsgI3t2YWx1ZXMuam9pbiAnLCAnfSB9ID0gI3ttb2R9XCJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0ZXh0ID0gXCIje3JlcXVpcmVzW21vZF0uaW5kZW50fXsgI3t2YWx1ZXMuam9pbiAnLCAnfSB9ID0gcmVxdWlyZSAje21vZH1cIlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgcmVxdWlyZXNbbW9kXVxuICAgICAgICAgICAgICAgIG9wZXJhdGlvbnMucHVzaCBvcDonY2hhbmdlJyBpbmRleDpyZXF1aXJlc1ttb2RdLmluZGV4LCB0ZXh0OnRleHRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBvcGVyYXRpb25zLnB1c2ggb3A6J2luc2VydCcgaW5kZXg6Zmlyc3RJbmRleCwgdGV4dDp0ZXh0XG4gICAgICAgICAgICAgICAgXG4gICAgb3BlcmF0aW9uc1xuXG5yZXEubW9kdWxlS2V5cyA9IG1vZHVsZUtleXNcbiAgICBcbm1vZHVsZS5leHBvcnRzID0gcmVxXG4iXX0=
//# sourceURL=../../coffee/tools/req.coffee