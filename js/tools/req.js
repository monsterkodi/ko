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
    var err, fileDir, nodeModules, pkgDir, required;
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
    if (required) {
        if (required.prototype) {
            return Object.keys(required.prototype);
        }
        if (required.getOwnPropertyNames) {
            return required.getOwnPropertyNames();
        }
        return Object.keys(required);
    }
    return [];
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
                    regexes[k] = new RegExp("(^|[\\:\\(\\{]|\\s+)" + k + "(\\s+[^:]|\\s*$|[\\.\\,\\(])");
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS90b29scyIsInNvdXJjZXMiOlsicmVxLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSw4RUFBQTtJQUFBOztBQVFBLE1BQW9DLE9BQUEsQ0FBUSxLQUFSLENBQXBDLEVBQUUsU0FBRixFQUFLLG1CQUFMLEVBQWEsZUFBYixFQUFtQixpQkFBbkIsRUFBMEI7O0FBRTFCLGFBQUEsR0FBZ0I7O0FBQ2hCLFVBQUEsR0FBYTs7QUFFYixVQUFBLEdBQWEsU0FBQyxVQUFELEVBQWEsSUFBYjtBQUVULFFBQUE7SUFBQSxJQUFHLE1BQUEsR0FBUyxLQUFLLENBQUMsR0FBTixDQUFVLElBQVYsQ0FBWjtRQUNJLFdBQUEsR0FBYyxLQUFLLENBQUMsT0FBTixDQUFjLEtBQUssQ0FBQyxJQUFOLENBQVcsTUFBWCxFQUFtQixjQUFuQixDQUFkO1FBQ2QsSUFBRyxhQUFtQixNQUFNLENBQUMsS0FBMUIsRUFBQSxXQUFBLEtBQUg7WUFDSSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQWIsQ0FBa0IsV0FBbEIsRUFESjtTQUZKOztJQUtBLElBQUcsVUFBVSxDQUFDLFVBQVgsQ0FBc0IsR0FBdEIsQ0FBSDtRQUNJLE9BQUEsR0FBVSxLQUFLLENBQUMsT0FBTixDQUFjLEtBQUssQ0FBQyxJQUFOLENBQVcsS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWLENBQVgsRUFBNEIsVUFBNUIsQ0FBZCxDQUFxRCxDQUFDLE9BQXRELENBQThELFVBQTlELEVBQXlFLE1BQXpFO1FBQ1YsT0FBQSxHQUFVLEtBQUssQ0FBQyxPQUFOLENBQWMsS0FBSyxDQUFDLEdBQU4sQ0FBVSxPQUFWLENBQWQ7UUFDVixJQUFHLGFBQWUsTUFBTSxDQUFDLEtBQXRCLEVBQUEsT0FBQSxLQUFIO1lBQ0ksTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFiLENBQXFCLE9BQXJCLEVBREo7O1FBRUEsVUFBQSxHQUFhLEtBQUss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O1lBRUEsSUFBRyxHQUFBLEtBQU8sTUFBVjtnQkFDSSxJQUFBLEdBQVUsUUFBUyxDQUFBLEdBQUEsQ0FBSSxDQUFDLE1BQWYsR0FBc0IsSUFBdEIsR0FBeUIsQ0FBQyxNQUFNLENBQUMsSUFBUCxDQUFZLElBQVosQ0FBRCxDQUF6QixHQUEyQyxPQUEzQyxHQUFrRCxJQUQvRDthQUFBLE1BQUE7Z0JBR0ksSUFBQSxHQUFVLFFBQVMsQ0FBQSxHQUFBLENBQUksQ0FBQyxNQUFmLEdBQXNCLElBQXRCLEdBQXlCLENBQUMsTUFBTSxDQUFDLElBQVAsQ0FBWSxJQUFaLENBQUQsQ0FBekIsR0FBMkMsZUFBM0MsR0FBMEQsSUFIdkU7O1lBS0EsSUFBRyxRQUFTLENBQUEsR0FBQSxDQUFaO2dCQUNJLFVBQVUsQ0FBQyxJQUFYLENBQWdCO29CQUFBLEVBQUEsRUFBRyxRQUFIO29CQUFZLEtBQUEsRUFBTSxRQUFTLENBQUEsR0FBQSxDQUFJLENBQUMsS0FBaEM7b0JBQXVDLElBQUEsRUFBSyxJQUE1QztpQkFBaEIsRUFESjthQUFBLE1BQUE7Z0JBR0ksVUFBVSxDQUFDLElBQVgsQ0FBZ0I7b0JBQUEsRUFBQSxFQUFHLFFBQUg7b0JBQVksS0FBQSxFQUFNLFVBQWxCO29CQUE4QixJQUFBLEVBQUssSUFBbkM7aUJBQWhCLEVBSEo7YUFUSjs7QUFaSjtXQTBCQTtBQXJHRTs7QUF1R04sR0FBRyxDQUFDLFVBQUosR0FBaUI7O0FBRWpCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCBcbjAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAwIDAwXG4wMDAgICAwMDAgIDAwMCAgICAgICAwMDAgMDAwMCBcbjAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMCAwMFxuIyMjXG5cbnsgXywga2Vycm9yLCBrc3RyLCBzbGFzaCwgdmFsaWQgfSA9IHJlcXVpcmUgJ2t4aydcblxucmVxdWlyZVJlZ0V4cCA9IC9eKFxccypcXHsuK1xcfSlcXHMqPVxccypyZXF1aXJlXFxzKyhbXFwnXFxcIl1bXFwuXFwvXFx3XStbXFwnXFxcIl0pL1xubWF0aFJlZ0V4cCA9IC9eKFxccypcXHsuK1xcfSlcXHMqPVxccyooTWF0aClcXHMqJC9cblxubW9kdWxlS2V5cyA9IChtb2R1bGVOYW1lLCBmaWxlKSAtPlxuICAgIFxuICAgIGlmIHBrZ0RpciA9IHNsYXNoLnBrZyBmaWxlXG4gICAgICAgIG5vZGVNb2R1bGVzID0gc2xhc2gudW5zbGFzaCBzbGFzaC5qb2luIHBrZ0RpciwgJ25vZGVfbW9kdWxlcydcbiAgICAgICAgaWYgbm9kZU1vZHVsZXMgbm90IGluIG1vZHVsZS5wYXRoc1xuICAgICAgICAgICAgbW9kdWxlLnBhdGhzLnB1c2ggbm9kZU1vZHVsZXNcbiAgICAgICAgIFxuICAgIGlmIG1vZHVsZU5hbWUuc3RhcnRzV2l0aCAnLidcbiAgICAgICAgZmlsZURpciA9IHNsYXNoLnJlc29sdmUoc2xhc2guam9pbiBzbGFzaC5kaXIoZmlsZSksIG1vZHVsZU5hbWUpLnJlcGxhY2UgJy9jb2ZmZWUvJyAnL2pzLydcbiAgICAgICAgZmlsZURpciA9IHNsYXNoLnVuc2xhc2ggc2xhc2guZGlyIGZpbGVEaXJcbiAgICAgICAgaWYgZmlsZURpciBub3QgaW4gbW9kdWxlLnBhdGhzXG4gICAgICAgICAgICBtb2R1bGUucGF0aHMudW5zaGlmdCBmaWxlRGlyXG4gICAgICAgIG1vZHVsZU5hbWUgPSBzbGFzaC5maWxlIG1vZHVsZU5hbWVcbiAgICAgICAgIFxuICAgIHRyeVxuICAgICAgICByZXF1aXJlZCA9IHJlcXVpcmUgbW9kdWxlTmFtZVxuICAgIGNhdGNoIGVyclxuICAgICAgICBlcnJvciBcImNhbid0IHJlcXVpcmUgI3ttb2R1bGVOYW1lfSAje2Vycn1cIlxuICAgICAgICBcbiAgICBpZiByZXF1aXJlZFxuICAgICAgICBpZiByZXF1aXJlZC5wcm90b3R5cGVcbiAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyByZXF1aXJlZC5wcm90b3R5cGVcbiAgICAgICAgaWYgcmVxdWlyZWQuZ2V0T3duUHJvcGVydHlOYW1lc1xuICAgICAgICAgICAgcmV0dXJuIHJlcXVpcmVkLmdldE93blByb3BlcnR5TmFtZXMoKVxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMgcmVxdWlyZWRcbiAgICBbXVxuICAgIFxucmVxID0gKGZpbGUsIGxpbmVzLCBlZGl0b3IpIC0+XG5cbiAgICByZXF1aXJlcyAgPSB7fVxuICAgIGV4cG9ydHMgICA9IHt9XG4gICAgcmVxVmFsdWVzID0ge31cbiAgICByZWdleGVzICAgPSAnJCc6IC9bXipcXClcXCdcXFwiXFxcXF0/XFwkW1xcc1xcKF0vXG4gICAgZmlyc3RJbmRleCA9IG51bGxcbiAgICBcbiAgICBrZXlzID0gTWF0aDogW1xuICAgICAgICAnRScnTE4yJydMTjEwJydMT0cyRScnTE9HMTBFJydQSScnU1FSVDFfMicnU1FSVDInXG4gICAgICAgICdhYnMnJ2Fjb3MnJ2Fjb3NoJydhc2luJydhc2luaCcnYXRhbicnYXRhbmgnJ2F0YW4yJ1xuICAgICAgICAnY2JydCcnY2VpbCcnY2x6MzInJ2NvcycnY29zaCcnZXhwJydleHBtMScnZmxvb3InJ2Zyb3VuZCdcbiAgICAgICAgJ2h5cG90JydpbXVsJydsb2cxcCcnbG9nMTAnJ2xvZzInJ21heCcnbWluJydwb3cnJ3JhbmRvbSdcbiAgICAgICAgJ3JvdW5kJydzaWduJydzaW4nJ3NpbmgnJ3NxcnQnJ3RhbicndGFuaCcndHJ1bmMnXG4gICAgICAgIF1cbiAgIFxuICAgIGZvciBsaSBpbiBbMC4uLmxpbmVzLmxlbmd0aF1cbiAgICAgICAgXG4gICAgICAgIG0gPSBsaW5lc1tsaV0ubWF0Y2ggcmVxdWlyZVJlZ0V4cFxuXG4gICAgICAgIGlmIG5vdCBtP1sxXT9cbiAgICAgICAgICAgIG0gPSBsaW5lc1tsaV0ubWF0Y2ggbWF0aFJlZ0V4cFxuICAgICAgICBcbiAgICAgICAgaWYgbT9bMV0/IGFuZCBtP1syXT9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgbm90IHJlcXVpcmVzW21bMl1dXG4gICAgICAgICAgICAgICAgaW5kZW50ID0gJydcbiAgICAgICAgICAgICAgICBjaSA9IDBcbiAgICAgICAgICAgICAgICB3aGlsZSBtWzFdW2NpXSA9PSAnICdcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50ICs9ICcgJ1xuICAgICAgICAgICAgICAgICAgICBjaSArPSAxXG4gICAgICAgICAgICAgICAgcmVxdWlyZXNbbVsyXV0gPSBpbmRleDpsaSwgdmFsdWU6bVsxXS50cmltKCksIG1vZHVsZTptWzJdLCBpbmRlbnQ6aW5kZW50XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgcmVxdWlyZXNbbVsyXV0udmFsdWUuc3RhcnRzV2l0aCAneydcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IGtleXNbbVsyXV1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZHVsZU5hbWUgPSBrc3RyLnN0cmlwIG1bMl0sICdcIlxcJydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdLZXlzID0gbW9kdWxlS2V5cyBtb2R1bGVOYW1lLCBmaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5c1ttWzJdXSA9IG5ld0tleXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgayBpbiBuZXdLZXlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZ2V4ZXNba10gPz0gbmV3IFJlZ0V4cCBcIihefFtcXFxcOlxcXFwoXFxcXHtdfFxcXFxzKykje2t9KFxcXFxzK1teOl18XFxcXHMqJHxbXFxcXC5cXFxcLFxcXFwoXSlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2Vycm9yIFwiY2FuJ3QgcmVxdWlyZSAje21bMl19IGZvciAje2ZpbGV9OiAje2Vycn0gXFxubW9kdWxlLnBhdGhzOlwiIG1vZHVsZS5wYXRoc1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZpcnN0SW5kZXggPz0gbGlcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgbGluZXNbbGldLnRyaW0oKS5zdGFydHNXaXRoICdtb2R1bGUuZXhwb3J0cydcbiAgICAgICAgICAgIG5hbWUgPSBsaW5lc1tsaV0udHJpbSgpLnNwbGl0KCc9JylbMV0/LnRyaW0oKVxuICAgICAgICAgICAgaWYgbmFtZSBhbmQgL1xcdysvLnRlc3QgbmFtZVxuICAgICAgICAgICAgICAgIGV4cG9ydHNbbmFtZS50b0xvd2VyQ2FzZSgpXSA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgZm9yIG1vZCx2YWx1ZXMgb2Yga2V5c1xuXG4gICAgICAgICAgICBmb3IgayBpbiB2YWx1ZXNcblxuICAgICAgICAgICAgICAgIHJlcVZhbHVlc1ttb2RdID89IFtdXG5cbiAgICAgICAgICAgICAgICBpZiBrIGluIHJlcVZhbHVlc1ttb2RdXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmVnZXhlc1trXSA/PSBuZXcgUmVnRXhwIFwiKF58W1xcXFw6XFxcXChcXFxce118XFxcXHMrKSN7a30oXFxcXHMrW146XXxcXFxccyokfFtcXFxcLlxcXFwsXFxcXChdKVwiXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIHJlZ2V4ZXNba10udGVzdCBsaW5lc1tsaV1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGRpc3MgPSBlZGl0b3Iuc3ludGF4LmdldERpc3MgbGlcbiAgICAgICAgICAgICAgICAgICAgZGlzcyA9IGRpc3MuZmlsdGVyIChkKSAtPiBkPy5jbHNzIGFuZCBub3QgZC5jbHNzLnN0YXJ0c1dpdGgoJ2NvbW1lbnQnKSBhbmQgbm90IGQuY2xzcy5zdGFydHNXaXRoKCdzdHJpbmcnKVxuICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gZGlzcy5tYXAoKHMpIC0+IHMubWF0Y2gpLmpvaW4gJyAnXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiByZWdleGVzW2tdLnRlc3QgdGV4dFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxVmFsdWVzW21vZF0ucHVzaCBrXG5cbiAgICBvcGVyYXRpb25zID0gW11cbiAgICAgICAgIFxuICAgIGZvciBtb2QsdmFsdWVzIG9mIHJlcVZhbHVlc1xuICAgIFxuICAgICAgICBmaXJzdEluZGV4ID89IDBcbiAgICAgICAgXG4gICAgICAgIGlmIHJlcXVpcmVzW21vZF1cbiAgICAgICAgICAgIGZpcnN0SW5kZXggPSByZXF1aXJlc1ttb2RdLmluZGV4ICsgMVxuICAgICAgICBlbHNlIFxuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICB2YWx1ZXMgPSBfLnVuaXEgdmFsdWVzXG4gICAgICAgIHZhbHVlcyA9IHZhbHVlcy5maWx0ZXIgKHYpIC0+IHYgbm90IGluIE9iamVjdC5rZXlzKGV4cG9ydHMpLmNvbmNhdCBbJ3N0YXRlJ11cbiAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkIHZhbHVlc1xuICAgIFxuICAgICAgICAgICAgdmFsdWVzLnNvcnQoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBtb2QgPT0gJ01hdGgnXG4gICAgICAgICAgICAgICAgdGV4dCA9IFwiI3tyZXF1aXJlc1ttb2RdLmluZGVudH17ICN7dmFsdWVzLmpvaW4gJywgJ30gfSA9ICN7bW9kfVwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdGV4dCA9IFwiI3tyZXF1aXJlc1ttb2RdLmluZGVudH17ICN7dmFsdWVzLmpvaW4gJywgJ30gfSA9IHJlcXVpcmUgI3ttb2R9XCJcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHJlcXVpcmVzW21vZF1cbiAgICAgICAgICAgICAgICBvcGVyYXRpb25zLnB1c2ggb3A6J2NoYW5nZScgaW5kZXg6cmVxdWlyZXNbbW9kXS5pbmRleCwgdGV4dDp0ZXh0XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgb3BlcmF0aW9ucy5wdXNoIG9wOidpbnNlcnQnIGluZGV4OmZpcnN0SW5kZXgsIHRleHQ6dGV4dFxuICAgICAgICAgICAgICAgIFxuICAgIG9wZXJhdGlvbnNcblxucmVxLm1vZHVsZUtleXMgPSBtb2R1bGVLZXlzXG4gICAgXG5tb2R1bGUuZXhwb3J0cyA9IHJlcVxuIl19
//# sourceURL=../../coffee/tools/req.coffee