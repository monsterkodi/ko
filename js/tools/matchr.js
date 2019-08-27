// koffee 1.4.0

/*
00     00   0000000   000000000   0000000  000   000  00000000
000   000  000   000     000     000       000   000  000   000
000000000  000000000     000     000       000000000  0000000
000 0 000  000   000     000     000       000   000  000   000
000   000  000   000     000      0000000  000   000  000   000
 */
var _, config, dissect, empty, last, merge, ranges, ref, sortRanges;

ref = require('kxk'), empty = ref.empty, last = ref.last, _ = ref._;

config = function(patterns, flags) {
    var a, p, results;
    results = [];
    for (p in patterns) {
        a = patterns[p];
        results.push([new RegExp(p, flags), a]);
    }
    return results;
};

sortRanges = function(rgs) {
    return rgs.sort(function(a, b) {
        if (a.start === b.start) {
            return a.index - b.index;
        } else {
            return a.start - b.start;
        }
    });
};

ranges = function(regexes, text, flags) {
    var arg, gi, gs, i, j, k, l, match, r, ref1, ref2, reg, rgs, s, value;
    if (!_.isArray(regexes)) {
        if (_.isString(regexes)) {
            regexes = [[new RegExp(regexes, flags), 'found']];
        } else {
            regexes = [[regexes, 'found']];
        }
    } else if (!_.isArray(regexes[0])) {
        regexes = [regexes];
    }
    rgs = [];
    if (text == null) {
        return rgs;
    }
    for (r = k = 0, ref1 = regexes.length; 0 <= ref1 ? k < ref1 : k > ref1; r = 0 <= ref1 ? ++k : --k) {
        reg = regexes[r][0];
        if ((reg == null) || (reg.exec == null)) {
            console.error('no reg?', regexes, text, flags);
            return rgs;
        }
        arg = regexes[r][1];
        i = 0;
        s = text;
        while (s.length) {
            match = reg.exec(s);
            if (match == null) {
                break;
            }
            if (match.length === 1) {
                if (match[0].length > 0) {
                    rgs.push({
                        start: match.index + i,
                        match: match[0],
                        value: arg,
                        index: r
                    });
                }
                i += match.index + Math.max(1, match[0].length);
                s = text.slice(i);
            } else {
                gs = 0;
                for (j = l = 0, ref2 = match.length - 2; 0 <= ref2 ? l <= ref2 : l >= ref2; j = 0 <= ref2 ? ++l : --l) {
                    value = arg;
                    if (_.isArray(value) && j < value.length) {
                        value = value[j];
                    } else if (_.isObject(value) && j < _.size(value)) {
                        value = [_.keys(value)[j], value[_.keys(value)[j]]];
                    }
                    if (match[j + 1] == null) {
                        break;
                    }
                    gi = match[0].slice(gs).indexOf(match[j + 1]);
                    rgs.push({
                        start: match.index + i + gs + gi,
                        match: match[j + 1],
                        value: value,
                        index: r
                    });
                    gs += match[j + 1].length;
                }
                i += match.index + match[0].length;
                s = text.slice(i);
            }
        }
    }
    return sortRanges(rgs);
};

dissect = function(ranges, opt) {
    var c, d, di, dps, i, k, l, len, len1, len2, len3, len4, len5, m, n, o, p, pn, q, r, ref1, ref2, ref3, ref4, ref5, rg, ri, si, t, u;
    if (opt == null) {
        opt = {
            join: false
        };
    }
    if (!ranges.length) {
        return [];
    }
    di = [];
    for (k = 0, len = ranges.length; k < len; k++) {
        rg = ranges[k];
        di.push([rg.start, rg.index]);
        di.push([rg.start + rg.match.length, rg.index]);
    }
    di.sort(function(a, b) {
        if (a[0] === b[0]) {
            return a[1] - b[1];
        } else {
            return a[0] - b[0];
        }
    });
    d = [];
    si = -1;
    for (l = 0, len1 = di.length; l < len1; l++) {
        dps = di[l];
        if (dps[0] > si) {
            si = dps[0];
            d.push({
                start: si,
                cls: []
            });
        }
    }
    p = 0;
    for (ri = m = 0, ref1 = ranges.length; 0 <= ref1 ? m < ref1 : m > ref1; ri = 0 <= ref1 ? ++m : --m) {
        rg = ranges[ri];
        while (d[p].start < rg.start) {
            p += 1;
        }
        pn = p;
        while (d[pn].start < rg.start + rg.match.length) {
            if (rg.value != null) {
                if (rg.value.split == null) {
                    ref2 = rg.value;
                    for (n = 0, len2 = ref2.length; n < len2; n++) {
                        r = ref2[n];
                        if (r.split == null) {
                            continue;
                        }
                        ref3 = r.split('.');
                        for (o = 0, len3 = ref3.length; o < len3; o++) {
                            c = ref3[o];
                            if (d[pn].cls.indexOf(c) < 0) {
                                d[pn].cls.push(c);
                            }
                        }
                    }
                } else {
                    ref4 = rg.value.split('.');
                    for (q = 0, len4 = ref4.length; q < len4; q++) {
                        c = ref4[q];
                        if (d[pn].cls.indexOf(c) < 0) {
                            d[pn].cls.push(c);
                        }
                    }
                }
            }
            if (pn + 1 < d.length) {
                if (!d[pn].match) {
                    d[pn].match = rg.match.substr(d[pn].start - rg.start, d[pn + 1].start - d[pn].start);
                }
                pn += 1;
            } else {
                if (!d[pn].match) {
                    d[pn].match = rg.match.substr(d[pn].start - rg.start);
                }
                break;
            }
        }
    }
    d = d.filter(function(i) {
        var ref5;
        return (ref5 = i.match) != null ? ref5.trim().length : void 0;
    });
    for (t = 0, len5 = d.length; t < len5; t++) {
        i = d[t];
        i.value = i.cls.join(' ');
        delete i.cls;
    }
    if (d.length > 1) {
        for (i = u = ref5 = d.length - 2; ref5 <= 0 ? u <= 0 : u >= 0; i = ref5 <= 0 ? ++u : --u) {
            if (d[i].start + d[i].match.length === d[i + 1].start) {
                if (d[i].value === d[i + 1].value) {
                    d[i].match += d[i + 1].match;
                    d.splice(i + 1, 1);
                }
            }
        }
    }
    return d;
};

merge = function(dssA, dssB) {
    var A, B, d, result;
    result = [];
    A = dssA.shift();
    B = dssB.shift();
    while (A && B) {
        if (A.start + A.match.length < B.start) {
            result.push(A);
            A = dssA.shift();
            continue;
        }
        if (B.start + B.match.length < A.start) {
            result.push(B);
            B = dssB.shift();
            continue;
        }
        if (A.start < B.start) {
            d = B.start - A.start;
            result.push({
                start: A.start,
                value: A.value,
                match: A.match.slice(0, d)
            });
            A.start += d;
            A.match = A.match.slice(d);
            continue;
        }
        if (B.start < A.start) {
            d = A.start - B.start;
            result.push({
                start: B.start,
                value: B.value,
                match: B.match.slice(0, d)
            });
            B.start += d;
            B.match = B.match.slice(d);
            continue;
        }
        if (A.start === B.start) {
            d = A.match.length - B.match.length;
            result.push({
                start: A.start,
                value: A.value + " " + B.value,
                match: d >= 0 && B.match || A.match
            });
            if (d > 0) {
                A.match = A.match.slice(B.match.length);
                A.start += B.match.length;
                B = dssB.shift();
            } else if (d < 0) {
                B.match = B.match.slice(A.match.length);
                B.start += A.match.length;
                A = dssA.shift();
            } else {
                A = dssA.shift();
                B = dssB.shift();
            }
        }
    }
    if (B && !A) {
        result = result.concat([B], dssB);
    }
    if (A && !B) {
        result = result.concat([A], dssA);
    }
    return result;
};

module.exports = {
    config: config,
    ranges: ranges,
    dissect: dissect,
    sortRanges: sortRanges,
    merge: merge
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0Y2hyLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUFxQixPQUFBLENBQVEsS0FBUixDQUFyQixFQUFFLGlCQUFGLEVBQVMsZUFBVCxFQUFlOztBQVVmLE1BQUEsR0FBUyxTQUFDLFFBQUQsRUFBVyxLQUFYO0FBQXFCLFFBQUE7QUFBRTtTQUFBLGFBQUE7O3FCQUFBLENBQUMsSUFBSSxNQUFKLENBQVcsQ0FBWCxFQUFjLEtBQWQsQ0FBRCxFQUF1QixDQUF2QjtBQUFBOztBQUF2Qjs7QUFFVCxVQUFBLEdBQWEsU0FBQyxHQUFEO1dBRVQsR0FBRyxDQUFDLElBQUosQ0FBUyxTQUFDLENBQUQsRUFBRyxDQUFIO1FBQ0wsSUFBRyxDQUFDLENBQUMsS0FBRixLQUFXLENBQUMsQ0FBQyxLQUFoQjttQkFDSSxDQUFDLENBQUMsS0FBRixHQUFVLENBQUMsQ0FBQyxNQURoQjtTQUFBLE1BQUE7bUJBR0ksQ0FBQyxDQUFDLEtBQUYsR0FBVSxDQUFDLENBQUMsTUFIaEI7O0lBREssQ0FBVDtBQUZTOztBQTZCYixNQUFBLEdBQVMsU0FBQyxPQUFELEVBQVUsSUFBVixFQUFnQixLQUFoQjtBQUVMLFFBQUE7SUFBQSxJQUFHLENBQUksQ0FBQyxDQUFDLE9BQUYsQ0FBVSxPQUFWLENBQVA7UUFDSSxJQUFHLENBQUMsQ0FBQyxRQUFGLENBQVcsT0FBWCxDQUFIO1lBSUksT0FBQSxHQUFVLENBQUMsQ0FBQyxJQUFJLE1BQUosQ0FBVyxPQUFYLEVBQW9CLEtBQXBCLENBQUQsRUFBNkIsT0FBN0IsQ0FBRCxFQUpkO1NBQUEsTUFBQTtZQU1JLE9BQUEsR0FBVSxDQUFDLENBQUMsT0FBRCxFQUFVLE9BQVYsQ0FBRCxFQU5kO1NBREo7S0FBQSxNQVFLLElBQUcsQ0FBSSxDQUFDLENBQUMsT0FBRixDQUFVLE9BQVEsQ0FBQSxDQUFBLENBQWxCLENBQVA7UUFDRCxPQUFBLEdB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SUFBSSxDQUFDLEtBQUwsQ0FBQSxFQU5IO2FBVlQ7O0lBaENKO0lBa0RBLElBQUcsQ0FBQSxJQUFNLENBQUksQ0FBYjtRQUNJLE1BQUEsR0FBUyxNQUFNLENBQUMsTUFBUCxDQUFjLENBQUMsQ0FBRCxDQUFkLEVBQW1CLElBQW5CLEVBRGI7O0lBRUEsSUFBRyxDQUFBLElBQU0sQ0FBSSxDQUFiO1FBQ0ksTUFBQSxHQUFTLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBQyxDQUFELENBQWQsRUFBbUIsSUFBbkIsRUFEYjs7V0FFQTtBQTVESTs7QUE4RFIsTUFBTSxDQUFDLE9BQVAsR0FDSTtJQUFBLE1BQUEsRUFBWSxNQUFaO0lBQ0EsTUFBQSxFQUFZLE1BRFo7SUFFQSxPQUFBLEVBQVksT0FGWjtJQUdBLFVBQUEsRUFBWSxVQUhaO0lBSUEsS0FBQSxFQUFZLEtBSloiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDBcbjAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBlbXB0eSwgbGFzdCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAwMDAgIDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAwMDBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwMDAwMFxuXG4jIGNvbnZlcnQgdGhlIHBhdHRlcm5zIG9iamVjdCB0byBhIGxpc3Qgb2YgW1JlZ0V4cChrZXkpLCB2YWx1ZV0gcGFpcnNcblxuY29uZmlnID0gKHBhdHRlcm5zLCBmbGFncykgLT4gKCBbbmV3IFJlZ0V4cChwLCBmbGFncyksIGFdIGZvciBwLGEgb2YgcGF0dGVybnMgKVxuXG5zb3J0UmFuZ2VzID0gKHJncykgLT5cblxuICAgIHJncy5zb3J0IChhLGIpIC0+XG4gICAgICAgIGlmIGEuc3RhcnQgPT0gYi5zdGFydFxuICAgICAgICAgICAgYS5pbmRleCAtIGIuaW5kZXhcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgYS5zdGFydCAtIGIuc3RhcnRcblxuIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDBcbiMgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiMgYWNjZXB0cyBhIGxpc3Qgb2YgW3JlZ2V4cCwgdmFsdWUocyldIHBhaXJzIGFuZCBhIHN0cmluZ1xuIyByZXR1cm5zIGEgbGlzdCBvZiBvYmplY3RzIHdpdGggaW5mb3JtYXRpb24gYWJvdXQgdGhlIG1hdGNoZXM6XG5cbiMgICAgIG1hdGNoOiB0aGUgbWF0Y2hlZCBzdWJzdHJpbmdcbiMgICAgIHN0YXJ0OiBwb3NpdGlvbiBvZiBtYXRjaCBpbiBzdHJcbiMgICAgIHZhbHVlOiB0aGUgdmFsdWUgZm9yIHRoZSBtYXRjaFxuIyAgICAgaW5kZXg6IGluZGV4IG9mIHRoZSByZWdleHBcblxuIyAgICAgdGhlIG9iamVjdHMgYXJlIHNvcnRlZCBieSBzdGFydCBhbmQgaW5kZXhcblxuIyAgICAgaWYgdGhlIHJlZ2V4cCBoYXMgY2FwdHVyZSBncm91cHMgdGhlblxuIyAgICAgICAgIHRoZSB2YWx1ZSBmb3IgdGhlIG1hdGNoIG9mIHRoZSBudGggZ3JvdXAgaXNcbiMgICAgICAgICAgICAgdGhlIG50aCBpdGVtIG9mIHZhbHVlcyhzKSBpZiB2YWx1ZShzKSBpcyBhbiBhcnJheVxuIyAgICAgICAgICAgICB0aGUgbnRoIFtrZXksIHZhbHVlXSBwYWlyIGlmIHZhbHVlKHMpIGlzIGFuIG9iamVjdFxuXG5yYW5nZXMgPSAocmVnZXhlcywgdGV4dCwgZmxhZ3MpIC0+XG5cbiAgICBpZiBub3QgXy5pc0FycmF5IHJlZ2V4ZXNcbiAgICAgICAgaWYgXy5pc1N0cmluZyByZWdleGVzXG4gICAgICAgICAgICAjIGlmIHJlZ2V4ZXMuaW5kZXhPZignfCcpID49IDBcbiAgICAgICAgICAgICAgICAjIHJlZ2V4ZXMgPSAoW25ldyBSZWdFeHAociwgZmxhZ3MpLCAnZm91bmQnXSBmb3IgciBpbiByZWdleGVzLnNwbGl0KCd8JykpXG4gICAgICAgICAgICAjIGVsc2VcbiAgICAgICAgICAgIHJlZ2V4ZXMgPSBbW25ldyBSZWdFeHAocmVnZXhlcywgZmxhZ3MpLCAnZm91bmQnXV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVnZXhlcyA9IFtbcmVnZXhlcywgJ2ZvdW5kJ11dXG4gICAgZWxzZSBpZiBub3QgXy5pc0FycmF5IHJlZ2V4ZXNbMF1cbiAgICAgICAgcmVnZXhlcyA9IFtyZWdleGVzXVxuXG4gICAgcmdzID0gW11cbiAgICByZXR1cm4gcmdzIGlmIG5vdCB0ZXh0P1xuXG4gICAgZm9yIHIgaW4gWzAuLi5yZWdleGVzLmxlbmd0aF1cblxuICAgICAgICByZWcgPSByZWdleGVzW3JdWzBdXG5cbiAgICAgICAgaWYgbm90IHJlZz8gb3Igbm90IHJlZy5leGVjP1xuICAgICAgICAgICAgY29uc29sZS5lcnJvciAnbm8gcmVnPycsIHJlZ2V4ZXMsIHRleHQsIGZsYWdzXG4gICAgICAgICAgICByZXR1cm4gcmdzXG5cbiAgICAgICAgYXJnID0gcmVnZXhlc1tyXVsxXVxuICAgICAgICBpID0gMFxuICAgICAgICBzID0gdGV4dFxuXG4gICAgICAgIHdoaWxlIHMubGVuZ3RoXG5cbiAgICAgICAgICAgIG1hdGNoID0gcmVnLmV4ZWMgc1xuXG4gICAgICAgICAgICBicmVhayBpZiBub3QgbWF0Y2g/XG5cbiAgICAgICAgICAgIGlmIG1hdGNoLmxlbmd0aCA9PSAxXG5cbiAgICAgICAgICAgICAgICBpZiBtYXRjaFswXS5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgICAgIHJncy5wdXNoXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogbWF0Y2guaW5kZXggKyBpXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaDogbWF0Y2hbMF1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBhcmdcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiByXG5cbiAgICAgICAgICAgICAgICBpICs9IG1hdGNoLmluZGV4ICsgTWF0aC5tYXggMSwgbWF0Y2hbMF0ubGVuZ3RoXG4gICAgICAgICAgICAgICAgcyA9IHRleHQuc2xpY2UgaVxuXG4gICAgICAgICAgICBlbHNlXG5cbiAgICAgICAgICAgICAgICBncyA9IDBcblxuICAgICAgICAgICAgICAgIGZvciBqIGluIFswLi5tYXRjaC5sZW5ndGgtMl1cbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBhcmdcbiAgICAgICAgICAgICAgICAgICAgaWYgXy5pc0FycmF5KHZhbHVlKSBhbmQgaiA8IHZhbHVlLmxlbmd0aCB0aGVuIHZhbHVlID0gdmFsdWVbal1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBfLmlzT2JqZWN0KHZhbHVlKSBhbmQgaiA8IF8uc2l6ZSh2YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gW18ua2V5cyh2YWx1ZSlbal0sIHZhbHVlW18ua2V5cyh2YWx1ZSlbal1dXVxuICAgICAgICAgICAgICAgICAgICBicmVhayBpZiBub3QgbWF0Y2hbaisxXT9cbiAgICAgICAgICAgICAgICAgICAgZ2kgPSBtYXRjaFswXS5zbGljZShncykuaW5kZXhPZiBtYXRjaFtqKzFdXG5cbiAgICAgICAgICAgICAgICAgICAgcmdzLnB1c2hcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBtYXRjaC5pbmRleCArIGkgKyBncyArIGdpXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaDogbWF0Y2hbaisxXVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogclxuXG4gICAgICAgICAgICAgICAgICAgIGdzICs9IG1hdGNoW2orMV0ubGVuZ3RoXG4gICAgICAgICAgICAgICAgaSArPSBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aFxuICAgICAgICAgICAgICAgIHMgPSB0ZXh0LnNsaWNlIGlcblxuICAgIHNvcnRSYW5nZXMgcmdzXG5cbiMgMDAwMDAwMCAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDBcbiMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDBcblxuIyBhY2NlcHRzIGEgbGlzdCBvZiByYW5nZXNcbiMgcmV0dXJucyBhIGxpc3Qgb2Ygb2JqZWN0czpcblxuIyAgICAgbWF0Y2g6IHRoZSBtYXRjaGVkIHN1YnN0cmluZ1xuIyAgICAgc3RhcnQ6IHBvc2l0aW9uIG9mIG1hdGNoIGluIHN0clxuIyAgICAgdmFsdWU6IHN0cmluZyBvZiBjbGFzc25hbWVzIGpvaW5lZCB3aXRoIGEgc3BhY2VcblxuIyAgICAgd2l0aCBub25lIG9mIHRoZSBbc3RhcnQsIHN0YXJ0K21hdGNoLmxlbmd0aF0gcmFuZ2VzIG92ZXJsYXBwaW5nXG5cbmRpc3NlY3QgPSAocmFuZ2VzLCBvcHQgPSBqb2luOmZhbHNlKSAtPlxuXG4gICAgIyBsb2cgPSBvcHQ/LmxvZyA/IC0+XG5cbiAgICByZXR1cm4gW10gaWYgbm90IHJhbmdlcy5sZW5ndGhcbiAgICAjIGNvbnNvbGUubG9nIFwiZGlzc2VjdCAtLSAje0pTT04uc3RyaW5naWZ5IHJhbmdlc31cIlxuXG4gICAgZGkgPSBbXSAjIGNvbGxlY3QgYSBsaXN0IG9mIHBvc2l0aW9ucyB3aGVyZSBhIG1hdGNoIHN0YXJ0cyBvciBlbmRzXG4gICAgZm9yIHJnIGluIHJhbmdlc1xuICAgICAgICBkaS5wdXNoIFtyZy5zdGFydCwgcmcuaW5kZXhdXG4gICAgICAgIGRpLnB1c2ggW3JnLnN0YXJ0ICsgcmcubWF0Y2gubGVuZ3RoLCByZy5pbmRleF1cblxuICAgIGRpLnNvcnQgKGEsYikgLT4gIyBzb3J0IHRoZSBzdGFydC9lbmQgcG9zaXRpb25zIGJ5IHggb3IgaW5kZXhcbiAgICAgICAgaWYgYVswXT09YlswXVxuICAgICAgICAgICAgYVsxXS1iWzFdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGFbMF0tYlswXVxuXG4gICAgZCA9IFtdXG4gICAgc2kgPSAtMVxuXG4gICAgZm9yIGRwcyBpbiBkaSAgICAgICAgICAjIGNyZWF0ZSBhIGxpc3Qgb2YgZHVtbXkgcmFuZ2VzXG4gICAgICAgIGlmIGRwc1swXSA+IHNpICAgICAjIG9uZSByYW5nZSBmb3IgZWFjaCBwb3NpdGlvblxuICAgICAgICAgICAgc2kgPSBkcHNbMF1cbiAgICAgICAgICAgIGQucHVzaFxuICAgICAgICAgICAgICAgIHN0YXJ0OiBzaVxuICAgICAgICAgICAgICAgIGNsczogICBbXVxuXG4gICAgcCA9IDBcbiAgICBmb3IgcmkgaW4gWzAuLi5yYW5nZXMubGVuZ3RoXVxuICAgICAgICByZyA9IHJhbmdlc1tyaV1cbiAgICAgICAgd2hpbGUgZFtwXS5zdGFydCA8IHJnLnN0YXJ0XG4gICAgICAgICAgICBwICs9IDFcbiAgICAgICAgcG4gPSBwXG4gICAgICAgIHdoaWxlIGRbcG5dLnN0YXJ0IDwgcmcuc3RhcnQrcmcubWF0Y2gubGVuZ3RoXG4gICAgICAgICAgICBpZiByZy52YWx1ZT9cbiAgICAgICAgICAgICAgICBpZiBub3QgcmcudmFsdWUuc3BsaXQ/XG4gICAgICAgICAgICAgICAgICAgIGZvciByIGluIHJnLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBpZiBub3Qgci5zcGxpdD9cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciBjIGluIHIuc3BsaXQgJy4nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZFtwbl0uY2xzLnB1c2ggYyBpZiBkW3BuXS5jbHMuaW5kZXhPZihjKSA8IDBcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGZvciBjIGluIHJnLnZhbHVlLnNwbGl0ICcuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZFtwbl0uY2xzLnB1c2ggYyBpZiBkW3BuXS5jbHMuaW5kZXhPZihjKSA8IDBcbiAgICAgICAgICAgIGlmIHBuKzEgPCBkLmxlbmd0aFxuICAgICAgICAgICAgICAgIGlmIG5vdCBkW3BuXS5tYXRjaFxuICAgICAgICAgICAgICAgICAgICBkW3BuXS5tYXRjaCA9IHJnLm1hdGNoLnN1YnN0ciBkW3BuXS5zdGFydC1yZy5zdGFydCwgZFtwbisxXS5zdGFydC1kW3BuXS5zdGFydFxuICAgICAgICAgICAgICAgIHBuICs9IDFcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiBub3QgZFtwbl0ubWF0Y2hcbiAgICAgICAgICAgICAgICAgICAgZFtwbl0ubWF0Y2ggPSByZy5tYXRjaC5zdWJzdHIgZFtwbl0uc3RhcnQtcmcuc3RhcnRcbiAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgZCA9IGQuZmlsdGVyIChpKSAtPiBpLm1hdGNoPy50cmltKCkubGVuZ3RoXG5cbiAgICBmb3IgaSBpbiBkXG4gICAgICAgIGkudmFsdWUgPSBpLmNscy5qb2luICcgJ1xuICAgICAgICBkZWxldGUgaS5jbHNcblxuICAgIGlmIGQubGVuZ3RoID4gMVxuICAgICAgICBmb3IgaSBpbiBbZC5sZW5ndGgtMi4uMF1cbiAgICAgICAgICAgIGlmIGRbaV0uc3RhcnQgKyBkW2ldLm1hdGNoLmxlbmd0aCA9PSBkW2krMV0uc3RhcnRcbiAgICAgICAgICAgICAgICBpZiBkW2ldLnZhbHVlID09IGRbaSsxXS52YWx1ZVxuICAgICAgICAgICAgICAgICAgICBkW2ldLm1hdGNoICs9IGRbaSsxXS5tYXRjaFxuICAgICAgICAgICAgICAgICAgICBkLnNwbGljZSBpKzEsIDFcbiAgICBkXG5cbiMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDBcbiMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgIDAwMDAgIDAwMDAwMDBcbiMgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuIyBtZXJnZXMgdHdvIHNvcnRlZCBsaXN0cyBvZiBkaXNzZWN0aW9uc1xuXG5tZXJnZSA9IChkc3NBLCBkc3NCKSAtPlxuXG4gICAgcmVzdWx0ID0gW11cbiAgICBBID0gZHNzQS5zaGlmdCgpXG4gICAgQiA9IGRzc0Iuc2hpZnQoKVxuXG4gICAgd2hpbGUgQSBhbmQgQlxuXG4gICAgICAgIGlmIEEuc3RhcnQrQS5tYXRjaC5sZW5ndGggPCBCLnN0YXJ0XG4gICAgICAgICAgICByZXN1bHQucHVzaCBBXG4gICAgICAgICAgICBBID0gZHNzQS5zaGlmdCgpXG4gICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgIGlmIEIuc3RhcnQrQi5tYXRjaC5sZW5ndGggPCBBLnN0YXJ0XG4gICAgICAgICAgICByZXN1bHQucHVzaCBCXG4gICAgICAgICAgICBCID0gZHNzQi5zaGlmdCgpXG4gICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgIGlmIEEuc3RhcnQgPCBCLnN0YXJ0XG4gICAgICAgICAgICBkID0gQi5zdGFydC1BLnN0YXJ0XG4gICAgICAgICAgICByZXN1bHQucHVzaFxuICAgICAgICAgICAgICAgIHN0YXJ0OiBBLnN0YXJ0XG4gICAgICAgICAgICAgICAgdmFsdWU6IEEudmFsdWVcbiAgICAgICAgICAgICAgICBtYXRjaDogQS5tYXRjaC5zbGljZSAwLCBkXG4gICAgICAgICAgICBBLnN0YXJ0ICs9IGRcbiAgICAgICAgICAgIEEubWF0Y2ggPSBBLm1hdGNoLnNsaWNlIGRcbiAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgaWYgQi5zdGFydCA8IEEuc3RhcnRcbiAgICAgICAgICAgIGQgPSBBLnN0YXJ0LUIuc3RhcnRcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoXG4gICAgICAgICAgICAgICAgc3RhcnQ6IEIuc3RhcnRcbiAgICAgICAgICAgICAgICB2YWx1ZTogQi52YWx1ZVxuICAgICAgICAgICAgICAgIG1hdGNoOiBCLm1hdGNoLnNsaWNlIDAsIGRcbiAgICAgICAgICAgIEIuc3RhcnQgKz0gZFxuICAgICAgICAgICAgQi5tYXRjaCA9IEIubWF0Y2guc2xpY2UgZFxuICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICBpZiBBLnN0YXJ0ID09IEIuc3RhcnRcbiAgICAgICAgICAgIGQgPSBBLm1hdGNoLmxlbmd0aCAtIEIubWF0Y2gubGVuZ3RoXG4gICAgICAgICAgICByZXN1bHQucHVzaFxuICAgICAgICAgICAgICAgIHN0YXJ0OiBBLnN0YXJ0XG4gICAgICAgICAgICAgICAgdmFsdWU6IEEudmFsdWUgKyBcIiBcIiArIEIudmFsdWVcbiAgICAgICAgICAgICAgICBtYXRjaDogZCA+PSAwIGFuZCBCLm1hdGNoIG9yIEEubWF0Y2hcbiAgICAgICAgICAgIGlmIGQgPiAwXG4gICAgICAgICAgICAgICAgQS5tYXRjaCA9IEEubWF0Y2guc2xpY2UgQi5tYXRjaC5sZW5ndGhcbiAgICAgICAgICAgICAgICBBLnN0YXJ0ICs9IEIubWF0Y2gubGVuZ3RoXG4gICAgICAgICAgICAgICAgQiA9IGRzc0Iuc2hpZnQoKVxuICAgICAgICAgICAgZWxzZSBpZiBkIDwgMFxuICAgICAgICAgICAgICAgIEIubWF0Y2ggPSBCLm1hdGNoLnNsaWNlIEEubWF0Y2gubGVuZ3RoXG4gICAgICAgICAgICAgICAgQi5zdGFydCArPSBBLm1hdGNoLmxlbmd0aFxuICAgICAgICAgICAgICAgIEEgPSBkc3NBLnNoaWZ0KClcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBBID0gZHNzQS5zaGlmdCgpXG4gICAgICAgICAgICAgICAgQiA9IGRzc0Iuc2hpZnQoKVxuXG4gICAgaWYgQiBhbmQgbm90IEFcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdCBbQl0sIGRzc0JcbiAgICBpZiBBIGFuZCBub3QgQlxuICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0IFtBXSwgZHNzQVxuICAgIHJlc3VsdFxuXG5tb2R1bGUuZXhwb3J0cyA9XG4gICAgY29uZmlnOiAgICAgY29uZmlnXG4gICAgcmFuZ2VzOiAgICAgcmFuZ2VzXG4gICAgZGlzc2VjdDogICAgZGlzc2VjdFxuICAgIHNvcnRSYW5nZXM6IHNvcnRSYW5nZXNcbiAgICBtZXJnZTogICAgICBtZXJnZVxuIl19
//# sourceURL=../../coffee/tools/matchr.coffee