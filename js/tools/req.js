// koffee 1.4.0

/*
00000000   00000000   0000000 
000   000  000       000   000
0000000    0000000   000 00 00
000   000  000       000 0000 
000   000  00000000   00000 00
 */
var _, empty, globalRegExp, kxk, post, ref, req, requireRegExp, slash, valid,
    indexOf = [].indexOf;

ref = require('kxk'), post = ref.post, slash = ref.slash, valid = ref.valid, empty = ref.empty, _ = ref._;

kxk = require('kxk');

requireRegExp = /^(.+)=\s+require\s+[\'\"]([\.\/\w]+)[\'\"]/;

globalRegExp = /^(console|process|global|module|exports|window|null|undefined|true|false|return|if|then|else|for|in|not|continue|break|switch|when)$/;

req = function(file, lines, words, editor) {
    var ci, diss, exports, f, firstIndex, handled, i, indent, j, k, kxkValues, l, len, len1, len2, len3, li, m, modValue, modValues, n, name, o, operations, pkgPath, projectFiles, ref1, ref2, ref3, regex, requires, reqvalues, text, weight, word;
    operations = [];
    words = words.filter(function(w) {
        return /\w+/.test(w);
    });
    words = words.filter(function(w) {
        return !globalRegExp.test(w);
    });
    if (pkgPath = slash.pkg(file)) {
        projectFiles = post.get('indexer', 'project', pkgPath).files;
        if (valid(projectFiles)) {
            projectFiles = projectFiles.filter(function(f) {
                var ref1;
                return (ref1 = slash.ext(f)) === 'coffee' || ref1 === 'json' || ref1 === 'js';
            });
            projectFiles = projectFiles.map(function(f) {
                var p;
                p = slash.splitExt(slash.relative(f, slash.dir(file)))[0];
                if (!p.startsWith('.')) {
                    p = '.' + p;
                }
                return p;
            });
        }
    }
    if (projectFiles != null) {
        projectFiles;
    } else {
        projectFiles = [];
    }
    requires = {};
    reqvalues = {};
    exports = {};
    kxkValues = [];
    modValues = [];
    firstIndex = null;
    indent = '';
    for (li = i = 0, ref1 = lines.length; 0 <= ref1 ? i < ref1 : i > ref1; li = 0 <= ref1 ? ++i : --i) {
        m = lines[li].match(requireRegExp);
        if (((m != null ? m[1] : void 0) != null) && ((m != null ? m[2] : void 0) != null)) {
            if (!requires[m[2]]) {
                if (m[2] === 'kxk') {
                    ci = 0;
                    while (m[1][ci] === ' ') {
                        indent += ' ';
                        ci += 1;
                    }
                }
                requires[m[2]] = {
                    index: li,
                    value: m[1].trim(),
                    module: m[2]
                };
                reqvalues[m[1].trim()] = m[2];
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
        ref3 = Object.keys(kxk);
        for (j = 0, len = ref3.length; j < len; j++) {
            k = ref3[j];
            if (reqvalues[k]) {
                continue;
            }
            if (k === '$') {
                regex = /[^*\)\'\"\\]?\$[\s\(]/;
            } else {
                regex = new RegExp("(^|[\\:\\(\\{]|\\s+)" + k + "(\\s+[^:]|\\s*$|[\\.\\(])");
            }
            if (regex.test(lines[li])) {
                diss = editor.syntax.getDiss(li);
                diss = diss.filter(function(d) {
                    return (d != null ? d.clss : void 0) && !d.clss.startsWith('comment') && !d.clss.startsWith('string');
                });
                text = diss.map(function(s) {
                    return s.match;
                }).join(' ');
                if (regex.test(text)) {
                    kxkValues.push(k);
                }
            }
        }
    }
    if (firstIndex != null) {
        firstIndex;
    } else {
        firstIndex = 0;
    }
    if (requires['kxk']) {
        firstIndex = requires['kxk'].index + 1;
    } else {
        return [];
    }
    for (l = 0, len1 = words.length; l < len1; l++) {
        word = words[l];
        if (indexOf.call(Object.keys(kxk), word) >= 0) {
            kxkValues.push(word);
        } else {
            for (n = 0, len2 = projectFiles.length; n < len2; n++) {
                f = projectFiles[n];
                if (word.toLowerCase() === slash.base(f)) {
                    modValues.push({
                        value: word,
                        module: f
                    });
                    handled = true;
                    break;
                }
            }
            if (!handled) {
                modValues.push({
                    value: word,
                    module: word.toLowerCase()
                });
            }
        }
    }
    kxkValues = _.uniq(kxkValues);
    kxkValues = kxkValues.filter(function(v) {
        return indexOf.call(Object.keys(exports).concat(['state']), v) < 0;
    });
    if (valid(kxkValues)) {
        weight = function(v) {
            switch (v) {
                case 'post':
                    return 0;
                case '_':
                    return 1000;
                case '$':
                    return 999;
                case 'kerror':
                    return 900;
                case 'klog':
                    return 901;
                default:
                    return Math.max(0, 500 - v.length);
            }
        };
        kxkValues.sort(function(a, b) {
            return weight(a) - weight(b);
        });
        text = indent + "{ " + (kxkValues.join(', ')) + " } = require 'kxk'";
        if (requires['kxk']) {
            operations.push({
                op: 'change',
                index: requires['kxk'].index,
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
    for (o = 0, len3 = modValues.length; o < len3; o++) {
        modValue = modValues[o];
        if (empty(requires[modValue.module])) {
            operations.push({
                op: 'insert',
                index: firstIndex,
                text: modValue.value + " = require '" + modValue.module + "'"
            });
        }
    }
    return operations;
};

module.exports = req;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx3RUFBQTtJQUFBOztBQVFBLE1BQW1DLE9BQUEsQ0FBUSxLQUFSLENBQW5DLEVBQUUsZUFBRixFQUFRLGlCQUFSLEVBQWUsaUJBQWYsRUFBc0IsaUJBQXRCLEVBQTZCOztBQUU3QixHQUFBLEdBQU0sT0FBQSxDQUFRLEtBQVI7O0FBRU4sYUFBQSxHQUFnQjs7QUFDaEIsWUFBQSxHQUFnQjs7QUFFaEIsR0FBQSxHQUFNLFNBQUMsSUFBRCxFQUFPLEtBQVAsRUFBYyxLQUFkLEVBQXFCLE1BQXJCO0FBRUYsUUFBQTtJQUFBLFVBQUEsR0FBYTtJQUViLEtBQUEsR0FBUSxLQUFLLENBQUMsTUFBTixDQUFhLFNBQUMsQ0FBRDtlQUFPLEtBQUssQ0FBQyxJQUFOLENBQVcsQ0FBWDtJQUFQLENBQWI7SUFDUixLQUFBLEdBQVEsS0FBSyxDQUFDLE1BQU4sQ0FBYSxTQUFDLENBQUQ7ZUFBTyxDQUFJLFlBQVksQ0FBQyxJQUFiLENBQWtCLENBQWxCO0lBQVgsQ0FBYjtJQUVSLElBQUcsT0FBQSxHQUFVLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixDQUFiO1FBQ0ksWUFBQSxHQUFlLElBQUksQ0FBQyxHQUFMLENBQVMsU0FBVCxFQUFtQixTQUFuQixFQUE2QixPQUE3QixDQUFxQyxDQUFDO1FBQ3JELElBQUcsS0FBQSxDQUFNLFlBQU4sQ0FBSDtZQUNJLFlBQUEsR0FBZSxZQUFZLENBQUMsTUFBYixDQUFvQixTQUFDLENBQUQ7QUFBTyxvQkFBQTsrQkFBQSxLQUFLLENBQUMsR0FBTixDQUFVLENBQVYsRUFBQSxLQUFpQixRQUFqQixJQUFBLElBQUEsS0FBMEIsTUFBMUIsSUFBQSxJQUFBLEtBQWlDO1lBQXhDLENBQXBCO1lBQ2YsWUFBQSxHQUFlLFlBQVksQ0FBQyxHQUFiLENBQWlCLFNBQUMsQ0FBRDtBQUM1QixvQkFBQTtn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QTNHTDs7QUE2R04sTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwIFxuMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMDAgMDBcbjAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAwMDAwIFxuMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwIDAwXG4jIyNcblxueyBwb3N0LCBzbGFzaCwgdmFsaWQsIGVtcHR5LCBfIH0gPSByZXF1aXJlICdreGsnXG5cbmt4ayA9IHJlcXVpcmUgJ2t4aydcblxucmVxdWlyZVJlZ0V4cCA9IC9eKC4rKT1cXHMrcmVxdWlyZVxccytbXFwnXFxcIl0oW1xcLlxcL1xcd10rKVtcXCdcXFwiXS9cbmdsb2JhbFJlZ0V4cCAgPSAvXihjb25zb2xlfHByb2Nlc3N8Z2xvYmFsfG1vZHVsZXxleHBvcnRzfHdpbmRvd3xudWxsfHVuZGVmaW5lZHx0cnVlfGZhbHNlfHJldHVybnxpZnx0aGVufGVsc2V8Zm9yfGlufG5vdHxjb250aW51ZXxicmVha3xzd2l0Y2h8d2hlbikkL1xuXG5yZXEgPSAoZmlsZSwgbGluZXMsIHdvcmRzLCBlZGl0b3IpIC0+XG4gICAgXG4gICAgb3BlcmF0aW9ucyA9IFtdXG5cbiAgICB3b3JkcyA9IHdvcmRzLmZpbHRlciAodykgLT4gL1xcdysvLnRlc3Qgd1xuICAgIHdvcmRzID0gd29yZHMuZmlsdGVyICh3KSAtPiBub3QgZ2xvYmFsUmVnRXhwLnRlc3Qgd1xuICAgIFxuICAgIGlmIHBrZ1BhdGggPSBzbGFzaC5wa2cgZmlsZVxuICAgICAgICBwcm9qZWN0RmlsZXMgPSBwb3N0LmdldCgnaW5kZXhlcicgJ3Byb2plY3QnIHBrZ1BhdGgpLmZpbGVzXG4gICAgICAgIGlmIHZhbGlkIHByb2plY3RGaWxlc1xuICAgICAgICAgICAgcHJvamVjdEZpbGVzID0gcHJvamVjdEZpbGVzLmZpbHRlciAoZikgLT4gc2xhc2guZXh0KGYpIGluIFsnY29mZmVlJyAnanNvbicgJ2pzJ11cbiAgICAgICAgICAgIHByb2plY3RGaWxlcyA9IHByb2plY3RGaWxlcy5tYXAgKGYpIC0+IFxuICAgICAgICAgICAgICAgIHAgPSBzbGFzaC5zcGxpdEV4dChzbGFzaC5yZWxhdGl2ZSBmLCBzbGFzaC5kaXIgZmlsZSlbMF1cbiAgICAgICAgICAgICAgICBwID0gJy4nICsgcCBpZiBub3QgcC5zdGFydHNXaXRoICcuJ1xuICAgICAgICAgICAgICAgIHBcbiAgICAgICAgICAgICAgICBcbiAgICBwcm9qZWN0RmlsZXMgPz0gW11cbiAgICBcbiAgICByZXF1aXJlcyAgPSB7fVxuICAgIHJlcXZhbHVlcyA9IHt9XG4gICAgZXhwb3J0cyAgID0ge31cbiAgICBreGtWYWx1ZXMgPSBbXVxuICAgIG1vZFZhbHVlcyA9IFtdXG4gICAgZmlyc3RJbmRleCA9IG51bGxcbiAgICBpbmRlbnQgPSAnJ1xuICAgIFxuICAgIGZvciBsaSBpbiBbMC4uLmxpbmVzLmxlbmd0aF1cbiAgICAgICAgXG4gICAgICAgIG0gPSBsaW5lc1tsaV0ubWF0Y2ggcmVxdWlyZVJlZ0V4cFxuICAgICAgICBpZiBtP1sxXT8gYW5kIG0/WzJdP1xuICAgICAgICAgICAgaWYgbm90IHJlcXVpcmVzW21bMl1dXG4gICAgICAgICAgICAgICAgaWYgbVsyXSA9PSAna3hrJ1xuICAgICAgICAgICAgICAgICAgICBjaSA9IDBcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgbVsxXVtjaV0gPT0gJyAnXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRlbnQgKz0gJyAnXG4gICAgICAgICAgICAgICAgICAgICAgICBjaSArPSAxXG4gICAgICAgICAgICAgICAgcmVxdWlyZXNbbVsyXV0gPSBpbmRleDpsaSwgdmFsdWU6bVsxXS50cmltKCksIG1vZHVsZTptWzJdIFxuICAgICAgICAgICAgICAgIHJlcXZhbHVlc1ttWzFdLnRyaW0oKV0gPSBtWzJdXG4gICAgICAgICAgICAgICAgZmlyc3RJbmRleCA/PSBsaVxuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBsaW5lc1tsaV0udHJpbSgpLnN0YXJ0c1dpdGggJ21vZHVsZS5leHBvcnRzJ1xuICAgICAgICAgICAgbmFtZSA9IGxpbmVzW2xpXS50cmltKCkuc3BsaXQoJz0nKVsxXT8udHJpbSgpXG4gICAgICAgICAgICBpZiBuYW1lIGFuZCAvXFx3Ky8udGVzdCBuYW1lXG4gICAgICAgICAgICAgICAgZXhwb3J0c1tuYW1lLnRvTG93ZXJDYXNlKCldID0gdHJ1ZVxuICAgICAgICAgICAgXG4gICAgICAgIGZvciBrIGluIE9iamVjdC5rZXlzIGt4a1xuICAgICAgICAgICAgY29udGludWUgaWYgcmVxdmFsdWVzW2tdXG4gICAgICAgICAgICBpZiBrID09ICckJ1xuICAgICAgICAgICAgICAgIHJlZ2V4ID0gL1teKlxcKVxcJ1xcXCJcXFxcXT9cXCRbXFxzXFwoXS9cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZWdleCA9IG5ldyBSZWdFeHAgXCIoXnxbXFxcXDpcXFxcKFxcXFx7XXxcXFxccyspI3trfShcXFxccytbXjpdfFxcXFxzKiR8W1xcXFwuXFxcXChdKVwiXG4gICAgICAgICAgICBpZiByZWdleC50ZXN0IGxpbmVzW2xpXVxuICAgICAgICAgICAgICAgIGRpc3MgPSBlZGl0b3Iuc3ludGF4LmdldERpc3MgbGlcbiAgICAgICAgICAgICAgICBkaXNzID0gZGlzcy5maWx0ZXIgKGQpIC0+IGQ/LmNsc3MgYW5kIG5vdCBkLmNsc3Muc3RhcnRzV2l0aCgnY29tbWVudCcpIGFuZCBub3QgZC5jbHNzLnN0YXJ0c1dpdGgoJ3N0cmluZycpXG4gICAgICAgICAgICAgICAgdGV4dCA9IGRpc3MubWFwKChzKSAtPiBzLm1hdGNoKS5qb2luICcgJ1xuICAgICAgICAgICAgICAgIGlmIHJlZ2V4LnRlc3QgdGV4dFxuICAgICAgICAgICAgICAgICAgICBreGtWYWx1ZXMucHVzaCBrXG4gICAgXG4gICAgZmlyc3RJbmRleCA/PSAwXG4gICAgXG4gICAgaWYgcmVxdWlyZXNbJ2t4ayddXG4gICAgICAgIGZpcnN0SW5kZXggPSByZXF1aXJlc1sna3hrJ10uaW5kZXggKyAxXG4gICAgZWxzZSBcbiAgICAgICAgcmV0dXJuIFtdXG4gICAgXG4gICAgZm9yIHdvcmQgaW4gd29yZHNcbiAgICAgICAgXG4gICAgICAgIGlmIHdvcmQgaW4gT2JqZWN0LmtleXMga3hrXG4gICAgICAgICAgICBreGtWYWx1ZXMucHVzaCB3b3JkXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGYgaW4gcHJvamVjdEZpbGVzXG4gICAgICAgICAgICAgICAgaWYgd29yZC50b0xvd2VyQ2FzZSgpID09IHNsYXNoLmJhc2UgZlxuICAgICAgICAgICAgICAgICAgICBtb2RWYWx1ZXMucHVzaCB2YWx1ZTp3b3JkLCBtb2R1bGU6ZlxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG5vdCBoYW5kbGVkXG4gICAgICAgICAgICAgICAgbW9kVmFsdWVzLnB1c2ggdmFsdWU6d29yZCwgbW9kdWxlOndvcmQudG9Mb3dlckNhc2UoKVxuXG4gICAga3hrVmFsdWVzID0gXy51bmlxIGt4a1ZhbHVlc1xuICAgIGt4a1ZhbHVlcyA9IGt4a1ZhbHVlcy5maWx0ZXIgKHYpIC0+IHYgbm90IGluIE9iamVjdC5rZXlzKGV4cG9ydHMpLmNvbmNhdCBbJ3N0YXRlJ11cbiAgICBcbiAgICBpZiB2YWxpZCBreGtWYWx1ZXNcbiAgICAgICAgXG4gICAgICAgIHdlaWdodCA9ICh2KSAtPlxuICAgICAgICAgICAgc3dpdGNoIHZcbiAgICAgICAgICAgICAgICB3aGVuICdwb3N0JyAgIHRoZW4gMFxuICAgICAgICAgICAgICAgIHdoZW4gJ18nICAgICAgdGhlbiAxMDAwXG4gICAgICAgICAgICAgICAgd2hlbiAnJCcgICAgICB0aGVuIDk5OVxuICAgICAgICAgICAgICAgIHdoZW4gJ2tlcnJvcicgdGhlbiA5MDBcbiAgICAgICAgICAgICAgICB3aGVuICdrbG9nJyAgIHRoZW4gOTAxXG4gICAgICAgICAgICAgICAgZWxzZSBNYXRoLm1heCgwLCA1MDAgLSB2Lmxlbmd0aClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAga3hrVmFsdWVzLnNvcnQgKGEsYikgLT4gd2VpZ2h0KGEpIC0gd2VpZ2h0KGIpXG4gICAgICAgIFxuICAgICAgICB0ZXh0ID0gXCIje2luZGVudH17ICN7a3hrVmFsdWVzLmpvaW4gJywgJ30gfSA9IHJlcXVpcmUgJ2t4aydcIlxuICAgICAgICBpZiByZXF1aXJlc1sna3hrJ11cbiAgICAgICAgICAgIG9wZXJhdGlvbnMucHVzaCBvcDonY2hhbmdlJyBpbmRleDpyZXF1aXJlc1sna3hrJ10uaW5kZXgsIHRleHQ6dGV4dFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBvcGVyYXRpb25zLnB1c2ggb3A6J2luc2VydCcgaW5kZXg6Zmlyc3RJbmRleCwgdGV4dDp0ZXh0XG4gICAgXG4gICAgZm9yIG1vZFZhbHVlIGluIG1vZFZhbHVlc1xuICAgICAgICBpZiBlbXB0eSByZXF1aXJlc1ttb2RWYWx1ZS5tb2R1bGVdXG4gICAgICAgICAgICBvcGVyYXRpb25zLnB1c2ggb3A6J2luc2VydCcgaW5kZXg6Zmlyc3RJbmRleCwgdGV4dDpcIiN7bW9kVmFsdWUudmFsdWV9ID0gcmVxdWlyZSAnI3ttb2RWYWx1ZS5tb2R1bGV9J1wiXG4gICAgICAgICAgICBcbiAgICByZXR1cm4gb3BlcmF0aW9uc1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcVxuIl19
//# sourceURL=../../coffee/tools/req.coffee