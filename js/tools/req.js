// koffee 1.3.0

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
    var diss, f, firstIndex, handled, i, j, k, kxkValues, l, len, len1, len2, len3, li, m, modValue, modValues, n, o, operations, pkgPath, projectFiles, ref1, ref2, regex, requires, reqvalues, text, weight, word;
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
    kxkValues = [];
    modValues = [];
    firstIndex = null;
    for (li = i = 0, ref1 = lines.length; 0 <= ref1 ? i < ref1 : i > ref1; li = 0 <= ref1 ? ++i : --i) {
        m = lines[li].match(requireRegExp);
        if (((m != null ? m[1] : void 0) != null) && ((m != null ? m[2] : void 0) != null)) {
            if (!requires[m[2]]) {
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
        ref2 = Object.keys(kxk);
        for (j = 0, len = ref2.length; j < len; j++) {
            k = ref2[j];
            if (reqvalues[k]) {
                continue;
            }
            if (k === '$') {
                regex = new RegExp("[^*\\)\'\"\\\\]\\$");
            } else {
                regex = new RegExp("(^|[\\:\\(\\{]|\\s+)" + k + "(\\s+[^:]|\\s*$|[\\.\\(])");
            }
            if (regex.test(lines[li])) {
                diss = editor.syntax.getDiss(li);
                diss = diss.filter(function(d) {
                    return !d.value.startsWith('comment') && !d.value.startsWith('string');
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
        return v !== 'state';
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
                case 'error':
                    return 900;
                case 'log':
                    return 901;
                default:
                    return Math.max(0, 500 - v.length);
            }
        };
        kxkValues.sort(function(a, b) {
            return weight(a) - weight(b);
        });
        text = "{ " + (kxkValues.join(', ')) + " } = require 'kxk'";
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx3RUFBQTtJQUFBOztBQVFBLE1BQW1DLE9BQUEsQ0FBUSxLQUFSLENBQW5DLEVBQUUsZUFBRixFQUFRLGlCQUFSLEVBQWUsaUJBQWYsRUFBc0IsaUJBQXRCLEVBQTZCOztBQUU3QixHQUFBLEdBQU0sT0FBQSxDQUFRLEtBQVI7O0FBRU4sYUFBQSxHQUFnQjs7QUFDaEIsWUFBQSxHQUFnQjs7QUFFaEIsR0FBQSxHQUFNLFNBQUMsSUFBRCxFQUFPLEtBQVAsRUFBYyxLQUFkLEVBQXFCLE1BQXJCO0FBRUYsUUFBQTtJQUFBLFVBQUEsR0FBYTtJQUViLEtBQUEsR0FBUSxLQUFLLENBQUMsTUFBTixDQUFhLFNBQUMsQ0FBRDtlQUFPLEtBQUssQ0FBQyxJQUFOLENBQVcsQ0FBWDtJQUFQLENBQWI7SUFDUixLQUFBLEdBQVEsS0FBSyxDQUFDLE1BQU4sQ0FBYSxTQUFDLENBQUQ7ZUFBTyxDQUFJLFlBQVksQ0FBQyxJQUFiLENBQWtCLENBQWxCO0lBQVgsQ0FBYjtJQUVSLElBQUcsT0FBQSxHQUFVLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixDQUFiO1FBQ0ksWUFBQSxHQUFlLElBQUksQ0FBQyxHQUFMLENBQVMsU0FBVCxFQUFvQixTQUFwQixFQUErQixPQUEvQixDQUF1QyxDQUFDO1FBQ3ZELElBQUcsS0FBQSxDQUFNLFlBQU4sQ0FBSDtZQUNJLFlBQUEsR0FBZSxZQUFZLENBQUMsTUFBYixDQUFvQixTQUFDLENBQUQ7QUFBTyxvQkFBQTsrQkFBQSxLQUFLLENBQUMsR0FBTixDQUFVLENBQVYsRUFBQSxLQUFpQixRQUFqQixJQUFBLElBQUEsS0FBMkIsTUFBM0IsSUFBQSxJQUFBLEtBQW1DO1lBQTFDLENBQXBCO1lBQ2YsWUFBQSxHQUFlLFlBQVksQ0FBQyxHQUFiLENBQWlCLFNBQUMsQ0FBRDtBQUM1QixvQkFBQTtn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aEIsRUFESjtTQUFBLE1BQUE7WUFHSSxVQUFVLENBQUMsSUFBWCxDQUFnQjtnQkFBQSxFQUFBLEVBQUcsUUFBSDtnQkFBYSxLQUFBLEVBQU0sVUFBbkI7Z0JBQStCLElBQUEsRUFBSyxJQUFwQzthQUFoQixFQUhKO1NBZEo7O0FBbUJBLFNBQUEsNkNBQUE7O1FBQ0ksSUFBRyxLQUFBLENBQU0sUUFBUyxDQUFBLFFBQVEsQ0FBQyxNQUFULENBQWYsQ0FBSDtZQUNJLFVBQVUsQ0FBQyxJQUFYLENBQWdCO2dCQUFBLEVBQUEsRUFBRyxRQUFIO2dCQUFhLEtBQUEsRUFBTSxVQUFuQjtnQkFBK0IsSUFBQSxFQUFRLFFBQVEsQ0FBQyxLQUFWLEdBQWdCLGNBQWhCLEdBQThCLFFBQVEsQ0FBQyxNQUF2QyxHQUE4QyxHQUFwRjthQUFoQixFQURKOztBQURKO0FBSUEsV0FBTztBQTdGTDs7QUErRk4sTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwIFxuMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMDAgMDBcbjAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAwMDAwIFxuMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwIDAwXG4jIyNcblxueyBwb3N0LCBzbGFzaCwgdmFsaWQsIGVtcHR5LCBfIH0gPSByZXF1aXJlICdreGsnXG5cbmt4ayA9IHJlcXVpcmUgJ2t4aydcblxucmVxdWlyZVJlZ0V4cCA9IC9eKC4rKT1cXHMrcmVxdWlyZVxccytbXFwnXFxcIl0oW1xcLlxcL1xcd10rKVtcXCdcXFwiXS9cbmdsb2JhbFJlZ0V4cCAgPSAvXihjb25zb2xlfHByb2Nlc3N8Z2xvYmFsfG1vZHVsZXxleHBvcnRzfHdpbmRvd3xudWxsfHVuZGVmaW5lZHx0cnVlfGZhbHNlfHJldHVybnxpZnx0aGVufGVsc2V8Zm9yfGlufG5vdHxjb250aW51ZXxicmVha3xzd2l0Y2h8d2hlbikkL1xuXG5yZXEgPSAoZmlsZSwgbGluZXMsIHdvcmRzLCBlZGl0b3IpIC0+XG4gICAgXG4gICAgb3BlcmF0aW9ucyA9IFtdXG5cbiAgICB3b3JkcyA9IHdvcmRzLmZpbHRlciAodykgLT4gL1xcdysvLnRlc3Qgd1xuICAgIHdvcmRzID0gd29yZHMuZmlsdGVyICh3KSAtPiBub3QgZ2xvYmFsUmVnRXhwLnRlc3Qgd1xuICAgIFxuICAgIGlmIHBrZ1BhdGggPSBzbGFzaC5wa2cgZmlsZVxuICAgICAgICBwcm9qZWN0RmlsZXMgPSBwb3N0LmdldCgnaW5kZXhlcicsICdwcm9qZWN0JywgcGtnUGF0aCkuZmlsZXNcbiAgICAgICAgaWYgdmFsaWQgcHJvamVjdEZpbGVzXG4gICAgICAgICAgICBwcm9qZWN0RmlsZXMgPSBwcm9qZWN0RmlsZXMuZmlsdGVyIChmKSAtPiBzbGFzaC5leHQoZikgaW4gWydjb2ZmZWUnLCAnanNvbicsICdqcyddXG4gICAgICAgICAgICBwcm9qZWN0RmlsZXMgPSBwcm9qZWN0RmlsZXMubWFwIChmKSAtPiBcbiAgICAgICAgICAgICAgICBwID0gc2xhc2guc3BsaXRFeHQoc2xhc2gucmVsYXRpdmUgZiwgc2xhc2guZGlyIGZpbGUpWzBdXG4gICAgICAgICAgICAgICAgcCA9ICcuJyArIHAgaWYgbm90IHAuc3RhcnRzV2l0aCAnLidcbiAgICAgICAgICAgICAgICBwXG4gICAgICAgICAgICAgICAgXG4gICAgcHJvamVjdEZpbGVzID89IFtdXG4gICAgXG4gICAgcmVxdWlyZXMgID0ge31cbiAgICByZXF2YWx1ZXMgPSB7fVxuICAgIGt4a1ZhbHVlcyA9IFtdXG4gICAgbW9kVmFsdWVzID0gW11cbiAgICBmaXJzdEluZGV4ID0gbnVsbFxuICAgIFxuICAgIGZvciBsaSBpbiBbMC4uLmxpbmVzLmxlbmd0aF1cbiAgICAgICAgXG4gICAgICAgIG0gPSBsaW5lc1tsaV0ubWF0Y2ggcmVxdWlyZVJlZ0V4cFxuICAgICAgICBpZiBtP1sxXT8gYW5kIG0/WzJdP1xuICAgICAgICAgICAgaWYgbm90IHJlcXVpcmVzW21bMl1dXG4gICAgICAgICAgICAgICAgcmVxdWlyZXNbbVsyXV0gPSBpbmRleDpsaSwgdmFsdWU6bVsxXS50cmltKCksIG1vZHVsZTptWzJdXG4gICAgICAgICAgICAgICAgcmVxdmFsdWVzW21bMV0udHJpbSgpXSA9IG1bMl1cbiAgICAgICAgICAgICAgICBmaXJzdEluZGV4ID89IGxpXG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgXG4gICAgICAgIGZvciBrIGluIE9iamVjdC5rZXlzIGt4a1xuICAgICAgICAgICAgY29udGludWUgaWYgcmVxdmFsdWVzW2tdXG4gICAgICAgICAgICBpZiBrID09ICckJ1xuICAgICAgICAgICAgICAgIHJlZ2V4ID0gbmV3IFJlZ0V4cCBcIlteKlxcXFwpXFwnXFxcIlxcXFxcXFxcXVxcXFwkXCJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZWdleCA9IG5ldyBSZWdFeHAgXCIoXnxbXFxcXDpcXFxcKFxcXFx7XXxcXFxccyspI3trfShcXFxccytbXjpdfFxcXFxzKiR8W1xcXFwuXFxcXChdKVwiXG4gICAgICAgICAgICBpZiByZWdleC50ZXN0IGxpbmVzW2xpXVxuICAgICAgICAgICAgICAgIGRpc3MgPSBlZGl0b3Iuc3ludGF4LmdldERpc3MgbGlcbiAgICAgICAgICAgICAgICBkaXNzID0gZGlzcy5maWx0ZXIgKGQpIC0+IG5vdCBkLnZhbHVlLnN0YXJ0c1dpdGgoJ2NvbW1lbnQnKSBhbmQgbm90IGQudmFsdWUuc3RhcnRzV2l0aCgnc3RyaW5nJylcbiAgICAgICAgICAgICAgICB0ZXh0ID0gZGlzcy5tYXAoKHMpIC0+IHMubWF0Y2gpLmpvaW4gJyAnXG4gICAgICAgICAgICAgICAgaWYgcmVnZXgudGVzdCB0ZXh0XG4gICAgICAgICAgICAgICAgICAgIGt4a1ZhbHVlcy5wdXNoIGtcbiAgICBcbiAgICBmaXJzdEluZGV4ID89IDBcbiAgICBcbiAgICBpZiByZXF1aXJlc1sna3hrJ11cbiAgICAgICAgZmlyc3RJbmRleCA9IHJlcXVpcmVzWydreGsnXS5pbmRleCArIDFcbiAgICBcbiAgICBmb3Igd29yZCBpbiB3b3Jkc1xuICAgICAgICBcbiAgICAgICAgaWYgd29yZCBpbiBPYmplY3Qua2V5cyBreGtcbiAgICAgICAgICAgIGt4a1ZhbHVlcy5wdXNoIHdvcmRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgZiBpbiBwcm9qZWN0RmlsZXNcbiAgICAgICAgICAgICAgICBpZiB3b3JkLnRvTG93ZXJDYXNlKCkgPT0gc2xhc2guYmFzZSBmXG4gICAgICAgICAgICAgICAgICAgIG1vZFZhbHVlcy5wdXNoIHZhbHVlOndvcmQsIG1vZHVsZTpmXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgbm90IGhhbmRsZWRcbiAgICAgICAgICAgICAgICBtb2RWYWx1ZXMucHVzaCB2YWx1ZTp3b3JkLCBtb2R1bGU6d29yZC50b0xvd2VyQ2FzZSgpXG5cbiAgICBreGtWYWx1ZXMgPSBfLnVuaXEga3hrVmFsdWVzXG4gICAga3hrVmFsdWVzID0ga3hrVmFsdWVzLmZpbHRlciAodikgLT4gdiBub3QgaW4gWydzdGF0ZSddXG4gICAgXG4gICAgaWYgdmFsaWQga3hrVmFsdWVzXG4gICAgICAgIFxuICAgICAgICB3ZWlnaHQgPSAodikgLT5cbiAgICAgICAgICAgIHN3aXRjaCB2XG4gICAgICAgICAgICAgICAgd2hlbiAncG9zdCcgIHRoZW4gMFxuICAgICAgICAgICAgICAgIHdoZW4gJ18nICAgICB0aGVuIDEwMDBcbiAgICAgICAgICAgICAgICB3aGVuICckJyAgICAgdGhlbiA5OTlcbiAgICAgICAgICAgICAgICB3aGVuICdlcnJvcicgdGhlbiA5MDBcbiAgICAgICAgICAgICAgICB3aGVuICdsb2cnICAgdGhlbiA5MDFcbiAgICAgICAgICAgICAgICBlbHNlIE1hdGgubWF4KDAsIDUwMCAtIHYubGVuZ3RoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBreGtWYWx1ZXMuc29ydCAoYSxiKSAtPiB3ZWlnaHQoYSkgLSB3ZWlnaHQoYilcbiAgICAgICAgXG4gICAgICAgIHRleHQgPSBcInsgI3treGtWYWx1ZXMuam9pbiAnLCAnfSB9ID0gcmVxdWlyZSAna3hrJ1wiXG4gICAgICAgIGlmIHJlcXVpcmVzWydreGsnXVxuICAgICAgICAgICAgb3BlcmF0aW9ucy5wdXNoIG9wOidjaGFuZ2UnLCBpbmRleDpyZXF1aXJlc1sna3hrJ10uaW5kZXgsIHRleHQ6dGV4dFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBvcGVyYXRpb25zLnB1c2ggb3A6J2luc2VydCcsIGluZGV4OmZpcnN0SW5kZXgsIHRleHQ6dGV4dFxuICAgIFxuICAgIGZvciBtb2RWYWx1ZSBpbiBtb2RWYWx1ZXNcbiAgICAgICAgaWYgZW1wdHkgcmVxdWlyZXNbbW9kVmFsdWUubW9kdWxlXVxuICAgICAgICAgICAgb3BlcmF0aW9ucy5wdXNoIG9wOidpbnNlcnQnLCBpbmRleDpmaXJzdEluZGV4LCB0ZXh0OlwiI3ttb2RWYWx1ZS52YWx1ZX0gPSByZXF1aXJlICcje21vZFZhbHVlLm1vZHVsZX0nXCJcbiAgICAgICAgICAgIFxuICAgIHJldHVybiBvcGVyYXRpb25zXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxXG4iXX0=
//# sourceURL=../../coffee/tools/req.coffee