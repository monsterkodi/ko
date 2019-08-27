// koffee 1.4.0

/*
00000000    0000000   000   000   0000000   00000000   0000000
000   000  000   000  0000  000  000        000       000     
0000000    000000000  000 0 000  000  0000  0000000   0000000 
000   000  000   000  000  0000  000   000  000            000
000   000  000   000  000   000   0000000   00000000  0000000
 */
var Ranges, _,
    indexOf = [].indexOf;

_ = require('kxk')._;

Ranges = (function() {
    function Ranges() {}

    Ranges.pollute = function() {
        var j, len, member, ref;
        ref = Object.getOwnPropertyNames(Ranges.prototype);
        for (j = 0, len = ref.length; j < len; j++) {
            member = ref[j];
            if (member === 'constructor') {
                continue;
            }
            global[member] = Ranges.prototype[member];
        }
        return Ranges;
    };

    Ranges.prototype.cursorDelta = function(c, dx, dy) {
        if (dy == null) {
            dy = 0;
        }
        c[0] += dx;
        return c[1] += dy;
    };

    Ranges.prototype.cursorSet = function(c, x, y) {
        var ref;
        if ((y == null) && x.length >= 2) {
            ref = x, x = ref[0], y = ref[1];
        }
        c[0] = x;
        return c[1] = y;
    };

    Ranges.prototype.indentationInLine = function(l) {
        var s;
        s = 0;
        if ((l != null) && l.length > 0) {
            l = l.trimRight();
            while (l[s] === ' ') {
                s += 1;
            }
        }
        return s;
    };

    Ranges.prototype.lastWordInLine = function(l) {
        var i;
        l = l.trim();
        i = l.lastIndexOf(' ');
        return l.slice(i + 1);
    };

    Ranges.prototype.numberOfCharsAtEnd = function(t, c) {
        var i, s;
        s = 0;
        i = t.length - 1;
        while (i >= 0) {
            if (t[i] === c) {
                s++;
                i--;
            } else {
                break;
            }
        }
        return s;
    };

    Ranges.prototype.rangeForPos = function(p) {
        return [p[1], [p[0], p[0]]];
    };

    Ranges.prototype.rangeBetween = function(a, b) {
        var r;
        if (isPos(a) && isPos(b)) {
            return [Math.min(a[1], b[1]), [Math.min(a[0], b[0]), Math.max(a[0], b[0])]];
        } else if (isRange(a) && isRange(b)) {
            r = [a, b];
            sortRanges(r);
            return rangeBetween(rangeEndPos(r[0]), rangeStartPos(r[1]));
        }
    };

    Ranges.prototype.isPos = function(p) {
        return (p != null ? p.length : void 0) === 2 && _.isNumber(p[0]) && _.isNumber(p[1]);
    };

    Ranges.prototype.isRange = function(r) {
        var ref;
        return (r != null ? r.length : void 0) >= 2 && _.isNumber(r[0]) && ((ref = r[1]) != null ? ref.length : void 0) >= 2 && _.isNumber(r[1][0]) && _.isNumber(r[1][1]);
    };

    Ranges.prototype.isSameRange = function(a, b) {
        return a[0] === b[0] && a[1][0] === b[1][0] && a[1][1] === b[1][1];
    };

    Ranges.prototype.isSamePos = function(a, b) {
        return a[1] === b[1] && a[0] === b[0];
    };

    Ranges.prototype.isPosInRange = function(p, r) {
        var ref;
        return (p[1] === r[0]) && ((r[1][0] <= (ref = p[0]) && ref <= r[1][1]));
    };

    Ranges.prototype.isPosInRanges = function(p, rgs) {
        return rangeAtPosInRanges(p, rgs) != null;
    };

    Ranges.prototype.isPosInPositions = function(p, ps) {
        return posInPositions(p, ps) != null;
    };

    Ranges.prototype.rangeEndPos = function(r) {
        return [r[1][1], r[0]];
    };

    Ranges.prototype.rangeStartPos = function(r) {
        return [r[1][0], r[0]];
    };

    Ranges.prototype.lengthOfRange = function(r) {
        return r[1][1] - r[1][0];
    };

    Ranges.prototype.rangeIndexPos = function(r, i) {
        return [r[1][i], r[0]];
    };

    Ranges.prototype.rangeGrownBy = function(r, d) {
        return [r[0], [r[1][0] - d, r[1][1] + d]];
    };

    Ranges.prototype.positionsFromPosInPositions = function(p, pl) {
        var j, len, r, results;
        results = [];
        for (j = 0, len = pl.length; j < len; j++) {
            r = pl[j];
            if ((r[1] > p[1]) || ((r[1] === p[1]) && (r[0] >= p[0]))) {
                results.push(r);
            }
        }
        return results;
    };

    Ranges.prototype.positionsAtLineIndexInPositions = function(li, pl) {
        var j, len, p, results;
        results = [];
        for (j = 0, len = pl.length; j < len; j++) {
            p = pl[j];
            if (p[1] === li) {
                results.push(p);
            }
        }
        return results;
    };

    Ranges.prototype.positionsBelowLineIndexInPositions = function(li, pl) {
        var j, len, p, results;
        results = [];
        for (j = 0, len = pl.length; j < len; j++) {
            p = pl[j];
            if (p[1] > li) {
                results.push(p);
            }
        }
        return results;
    };

    Ranges.prototype.positionsAfterLineColInPositions = function(li, col, pl) {
        var j, len, p, results;
        results = [];
        for (j = 0, len = pl.length; j < len; j++) {
            p = pl[j];
            if (p[1] === li && p[0] > col) {
                results.push(p);
            }
        }
        return results;
    };

    Ranges.prototype.positionsNotInRanges = function(pss, rgs) {
        return _.filter(pss, function(p) {
            return !isPosInRanges(p, rgs);
        });
    };

    Ranges.prototype.positionsBetweenPosAndPosInPositions = function(p1, p2, pl) {
        var a, b, j, len, r, ref, results;
        ref = sortPositions([p1, p2]), a = ref[0], b = ref[1];
        results = [];
        for (j = 0, len = pl.length; j < len; j++) {
            r = pl[j];
            if ((r[1] > a[1] || (r[1] === a[1]) && (r[0] >= a[0])) && (r[1] < b[1] || (r[1] === b[1]) && (r[0] <= b[0]))) {
                results.push(r);
            }
        }
        return results;
    };

    Ranges.prototype.positionsInContinuousLine = function(pl) {
        var c, cp, j, len, ref;
        cp = pl[0];
        ref = pl.slice(1);
        for (j = 0, len = ref.length; j < len; j++) {
            c = ref[j];
            if (c[0] !== cp[0]) {
                return false;
            }
            if (c[1] !== cp[1] + 1) {
                return false;
            }
            cp = c;
        }
        return true;
    };

    Ranges.prototype.manhattanDistance = function(a, b) {
        return Math.abs(a[1] - b[1]) + Math.abs(a[0] - b[0]);
    };

    Ranges.prototype.posInPositions = function(p, pl) {
        var c, j, len;
        for (j = 0, len = pl.length; j < len; j++) {
            c = pl[j];
            if (isSamePos(p, c)) {
                return c;
            }
        }
    };

    Ranges.prototype.posClosestToPosInPositions = function(p, pl) {
        var j, len, mDist, minDist, minPos, ps;
        minDist = 999999;
        for (j = 0, len = pl.length; j < len; j++) {
            ps = pl[j];
            mDist = manhattanDistance(ps, p);
            if (mDist < minDist) {
                minDist = mDist;
                minPos = ps;
            }
        }
        return minPos != null ? minPos : _.last(pl);
    };

    Ranges.prototype.lineIndicesInPositions = function(pl) {
        var indices, j, len, p;
        indices = [];
        for (j = 0, len = pl.length; j < len; j++) {
            p = pl[j];
            indices.push(p[1]);
        }
        return _.uniq(indices).sort();
    };

    Ranges.prototype.endPositionsFromRanges = function(ranges) {
        var j, len, r, results;
        results = [];
        for (j = 0, len = ranges.length; j < len; j++) {
            r = ranges[j];
            results.push(rangeEndPos(r));
        }
        return results;
    };

    Ranges.prototype.startPositionsFromRanges = function(ranges) {
        var j, len, r, results;
        results = [];
        for (j = 0, len = ranges.length; j < len; j++) {
            r = ranges[j];
            results.push(rangeStartPos(r));
        }
        return results;
    };

    Ranges.prototype.rangesFromPositions = function(pl) {
        var j, len, p, results;
        results = [];
        for (j = 0, len = pl.length; j < len; j++) {
            p = pl[j];
            results.push([p[1], [p[0], p[0]]]);
        }
        return results;
    };

    Ranges.prototype.rangesAtLineIndexInRanges = function(li, ranges) {
        var j, len, r, results;
        results = [];
        for (j = 0, len = ranges.length; j < len; j++) {
            r = ranges[j];
            if (r[0] === li) {
                results.push(r);
            }
        }
        return results;
    };

    Ranges.prototype.rangesForLineIndicesInRanges = function(lis, ranges) {
        var j, len, r, ref, results;
        results = [];
        for (j = 0, len = ranges.length; j < len; j++) {
            r = ranges[j];
            if (ref = r[0], indexOf.call(lis, ref) >= 0) {
                results.push(r);
            }
        }
        return results;
    };

    Ranges.prototype.rangesAfterLineColInRanges = function(li, col, ranges) {
        var j, len, r, results;
        results = [];
        for (j = 0, len = ranges.length; j < len; j++) {
            r = ranges[j];
            if (r[0] === li && r[1][0] > col) {
                results.push(r);
            }
        }
        return results;
    };

    Ranges.prototype.rangeAtPosInRanges = function(pos, ranges) {
        var j, r, ref, ref1, ri;
        if (ranges.length === 0) {
            return;
        }
        for (ri = j = ref = ranges.length - 1; ref <= 0 ? j <= 0 : j >= 0; ri = ref <= 0 ? ++j : --j) {
            r = ranges[ri];
            if ((r[0] === pos[1]) && ((r[1][0] <= (ref1 = pos[0]) && ref1 <= r[1][1]))) {
                return r;
            }
        }
    };

    Ranges.prototype.rangesBeforePosInRanges = function(pos, ranges) {
        var j, len, r, rs;
        if (ranges.length === 0) {
            return [];
        }
        rs = [];
        for (j = 0, len = ranges.length; j < len; j++) {
            r = ranges[j];
            if ((r[0] > pos[1]) || ((r[0] === pos[1]) && (r[1][0] > pos[0]))) {
                return rs;
            }
            rs.push(r);
        }
        return rs;
    };

    Ranges.prototype.rangesAfterPosInRanges = function(pos, ranges) {
        var j, r, ref, ri, rs;
        if (ranges.length === 0) {
            return [];
        }
        rs = [];
        for (ri = j = ref = ranges.length - 1; ref <= 0 ? j <= 0 : j >= 0; ri = ref <= 0 ? ++j : --j) {
            r = ranges[ri];
            if ((r[0] < pos[1]) || ((r[0] === pos[1]) && (r[1][1] < pos[0]))) {
                return rs;
            }
            rs.unshift(r);
        }
        return rs;
    };

    Ranges.prototype.rangesSplitAtPosInRanges = function(pos, ranges) {
        var aft, at, bef, j, r, ref, ref1, ref2, ri;
        if (ranges.length === 0) {
            return [[], null, []];
        }
        ref = [[], null, []], bef = ref[0], at = ref[1], aft = ref[2];
        for (ri = j = 0, ref1 = ranges.length; 0 <= ref1 ? j < ref1 : j > ref1; ri = 0 <= ref1 ? ++j : --j) {
            r = ranges[ri];
            if ((r[0] === pos[1]) && ((r[1][0] <= (ref2 = pos[0]) && ref2 <= r[1][1]))) {
                at = r;
                aft = ranges.slice(ri + 1);
                break;
            }
            bef.push(r);
        }
        return [bef, at, aft];
    };

    Ranges.prototype.rangeBeforePosInRanges = function(pos, ranges) {
        var j, r, ref, ri;
        if (ranges.length === 0) {
            return;
        }
        for (ri = j = ref = ranges.length - 1; ref <= 0 ? j <= 0 : j >= 0; ri = ref <= 0 ? ++j : --j) {
            r = ranges[ri];
            if ((r[0] < pos[1]) || ((r[0] === pos[1]) && (r[1][1] < pos[0]))) {
                return r;
            }
        }
    };

    Ranges.prototype.rangeAfterPosInRanges = function(pos, ranges) {
        var j, len, r;
        for (j = 0, len = ranges.length; j < len; j++) {
            r = ranges[j];
            if ((r[0] > pos[1]) || ((r[0] === pos[1]) && (r[1][0] > pos[0]))) {
                return r;
            }
        }
    };

    Ranges.prototype.rangeStartingOrEndingAtPosInRanges = function(p, ranges) {
        var j, r, ref, ri;
        if (ranges.length === 0) {
            return;
        }
        for (ri = j = ref = ranges.length - 1; ref <= 0 ? j <= 0 : j >= 0; ri = ref <= 0 ? ++j : --j) {
            r = ranges[ri];
            if (r[0] === p[1]) {
                if (r[1][0] === p[0] || r[1][1] === p[0]) {
                    return r;
                }
            }
        }
    };

    Ranges.prototype.rangesFromTopToBotInRanges = function(top, bot, ranges) {
        var j, len, r, ref, results;
        results = [];
        for (j = 0, len = ranges.length; j < len; j++) {
            r = ranges[j];
            if ((top <= (ref = r[0]) && ref <= bot)) {
                results.push(r);
            }
        }
        return results;
    };

    Ranges.prototype.rangeContainingRangeInRanges = function(r, ranges) {
        var cr;
        if (cr = rangeAtPosInRanges(rangeStartPos(r), ranges)) {
            if (cr[1][1] >= r[1][1]) {
                return cr;
            }
        }
    };

    Ranges.prototype.rangesShrunkenBy = function(ranges, delta) {
        var j, len, r, results;
        results = [];
        for (j = 0, len = ranges.length; j < len; j++) {
            r = ranges[j];
            if ((r[1][1] - r[1][0]) >= 2 * delta) {
                results.push([r[0], [r[1][0] + delta, r[1][1] - delta]]);
            }
        }
        return results;
    };

    Ranges.prototype.rangesNotEmptyInRanges = function(ranges) {
        return _.filter(ranges, function(r) {
            return r[1][1] - r[1][0];
        });
    };

    Ranges.prototype.areSameRanges = function(ra, rb) {
        var i, j, ref;
        if (ra.length === rb.length) {
            for (i = j = 0, ref = ra.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
                if (!isSameRange(ra[i], rb[i])) {
                    return false;
                }
            }
            return true;
        }
        return false;
    };

    Ranges.prototype.cleanRanges = function(ranges) {
        var j, p, r, ref, ri;
        sortRanges(ranges);
        if (ranges.length > 1) {
            for (ri = j = ref = ranges.length - 1; ref <= 0 ? j < 0 : j > 0; ri = ref <= 0 ? ++j : --j) {
                r = ranges[ri];
                p = ranges[ri - 1];
                if (r[0] === p[0]) {
                    if (r[1][0] <= p[1][1]) {
                        p[1][1] = Math.max(p[1][1], r[1][1]);
                        ranges.splice(ri, 1);
                    }
                }
            }
        }
        return ranges;
    };

    Ranges.prototype.sortRanges = function(ranges) {
        return ranges.sort(function(a, b) {
            if (a[0] !== b[0]) {
                return a[0] - b[0];
            } else {
                if (a[1][0] !== b[1][0]) {
                    return a[1][0] - b[1][0];
                } else {
                    return a[1][1] - b[1][1];
                }
            }
        });
    };

    Ranges.prototype.sortPositions = function(positions) {
        return positions.sort(function(a, b) {
            if (a[1] !== b[1]) {
                return a[1] - b[1];
            } else {
                return a[0] - b[0];
            }
        });
    };

    return Ranges;

})();

module.exports = Ranges.pollute();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFuZ2VzLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxTQUFBO0lBQUE7O0FBUUUsSUFBTSxPQUFBLENBQVEsS0FBUjs7QUFFRjs7O0lBRUYsTUFBQyxDQUFBLE9BQUQsR0FBVSxTQUFBO0FBQ04sWUFBQTtBQUFBO0FBQUEsYUFBQSxxQ0FBQTs7WUFDSSxJQUFZLE1BQUEsS0FBVyxhQUF2QjtBQUFBLHlCQUFBOztZQUNBLE1BQU8sQ0FBQSxNQUFBLENBQVAsR0FBaUIsTUFBTSxDQUFDLFNBQVUsQ0FBQSxNQUFBO0FBRnRDO2VBR0E7SUFKTTs7cUJBTVYsV0FBQSxHQUFhLFNBQUMsQ0FBRCxFQUFJLEVBQUosRUFBUSxFQUFSOztZQUFRLEtBQUc7O1FBQ3BCLENBQUUsQ0FBQSxDQUFBLENBQUYsSUFBUTtlQUNSLENBQUUsQ0FBQSxDQUFBLENBQUYsSUFBUTtJQUZDOztxQkFJYixTQUFBLEdBQVcsU0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVA7QUFDUCxZQUFBO1FBQUEsSUFBaUIsV0FBSixJQUFXLENBQUMsQ0FBQyxNQUFGLElBQVcsQ0FBbkM7WUFBQSxNQUFRLENBQVIsRUFBQyxVQUFELEVBQUcsV0FBSDs7UUFDQSxDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQU87ZUFDUCxDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQU87SUFIQTs7cUJBS1gsaUJBQUEsR0FBbUIsU0FBQyxDQUFEO0FBQ2YsWUFBQTtRQUFBLENBQUEsR0FBSTtRQUNKLElBQUcsV0FBQSxJQUFPLENBQUMsQ0FBQyxNQUFGLEdBQVcsQ0FBckI7WUFDSSxDQUFBLEdBQUksQ0FBQyxDQUFDLFNBQUYsQ0FBQTtBQUNHLG1CQUFNLENBQUUsQ0FBQSxDQUFBLENBQUYsS0FBUSxHQUFkO2dCQUFQLENBQUEsSUFBSztZQUFFLENBRlg7O2VBR0E7SUFMZTs7cUJBT25CLGNBQUEsR0FBZ0IsU0FBQyxDQUFEO0FB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LEtBQVMsQ0FBRSxDQUFBLENBQUEsQ0FBRyxDQUFBLENBQUEsQ0FBakI7MkJBQ0ksQ0FBRSxDQUFBLENBQUEsQ0FBRyxDQUFBLENBQUEsQ0FBTCxHQUFRLENBQUUsQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLEVBRGpCO2lCQUFBLE1BQUE7MkJBR0ksQ0FBRSxDQUFBLENBQUEsQ0FBRyxDQUFBLENBQUEsQ0FBTCxHQUFRLENBQUUsQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLEVBSGpCO2lCQUhKOztRQURRLENBQVo7SUFEUTs7cUJBVVosYUFBQSxHQUFlLFNBQUMsU0FBRDtlQUNYLFNBQVMsQ0FBQyxJQUFWLENBQWUsU0FBQyxDQUFELEVBQUcsQ0FBSDtZQUNYLElBQUcsQ0FBRSxDQUFBLENBQUEsQ0FBRixLQUFNLENBQUUsQ0FBQSxDQUFBLENBQVg7dUJBQ0ksQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFLLENBQUUsQ0FBQSxDQUFBLEVBRFg7YUFBQSxNQUFBO3VCQUdJLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBSyxDQUFFLENBQUEsQ0FBQSxFQUhYOztRQURXLENBQWY7SUFEVzs7Ozs7O0FBT25CLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLE1BQU0sQ0FBQyxPQUFQLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAgIFxuMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwIFxuIyMjXG5cbnsgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBSYW5nZXNcbiAgICBcbiAgICBAcG9sbHV0ZTogLT5cbiAgICAgICAgZm9yIG1lbWJlciBpbiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyBSYW5nZXMucHJvdG90eXBlIFxuICAgICAgICAgICAgY29udGludWUgaWYgbWVtYmVyIGluIFsnY29uc3RydWN0b3InXVxuICAgICAgICAgICAgZ2xvYmFsW21lbWJlcl0gPSBSYW5nZXMucHJvdG90eXBlW21lbWJlcl1cbiAgICAgICAgUmFuZ2VzXG5cbiAgICBjdXJzb3JEZWx0YTogKGMsIGR4LCBkeT0wKSAtPlxuICAgICAgICBjWzBdICs9IGR4XG4gICAgICAgIGNbMV0gKz0gZHlcbiAgICAgICAgXG4gICAgY3Vyc29yU2V0OiAoYywgeCwgeSkgLT4gICAgXG4gICAgICAgIFt4LHldID0geCBpZiBub3QgeT8gYW5kIHgubGVuZ3RoID49MlxuICAgICAgICBjWzBdID0geFxuICAgICAgICBjWzFdID0geVxuXG4gICAgaW5kZW50YXRpb25JbkxpbmU6IChsKSAtPlxuICAgICAgICBzID0gMFxuICAgICAgICBpZiBsPyBhbmQgbC5sZW5ndGggPiAwXG4gICAgICAgICAgICBsID0gbC50cmltUmlnaHQoKVxuICAgICAgICAgICAgcyArPSAxIHdoaWxlIGxbc10gPT0gJyAnXG4gICAgICAgIHNcbiAgICAgICAgXG4gICAgbGFzdFdvcmRJbkxpbmU6IChsKSAtPiBcbiAgICAgICAgbCA9IGwudHJpbSgpXG4gICAgICAgIGkgPSBsLmxhc3RJbmRleE9mICcgJ1xuICAgICAgICBsLnNsaWNlIGkrMVxuXG4gICAgbnVtYmVyT2ZDaGFyc0F0RW5kOiAodCwgYykgLT5cbiAgICAgICAgcyA9IDBcbiAgICAgICAgaSA9IHQubGVuZ3RoLTFcbiAgICAgICAgd2hpbGUgaSA+PSAwXG4gICAgICAgICAgICBpZiB0W2ldID09IGNcbiAgICAgICAgICAgICAgICBzKytcbiAgICAgICAgICAgICAgICBpLS1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICBzXG4gICAgICAgIFxuICAgIHJhbmdlRm9yUG9zOiAgIChwKSAgIC0+IFtwWzFdLCBbcFswXSwgcFswXV1dXG4gICAgcmFuZ2VCZXR3ZWVuOiAoYSxiKSAtPiBcbiAgICAgICAgaWYgaXNQb3MoYSkgYW5kIGlzUG9zKGIpIFxuICAgICAgICAgICAgW01hdGgubWluKGFbMV0sIGJbMV0pLCBbTWF0aC5taW4oYVswXSwgYlswXSksIE1hdGgubWF4KGFbMF0sIGJbMF0pXV1cbiAgICAgICAgZWxzZSBpZiBpc1JhbmdlKGEpIGFuZCBpc1JhbmdlKGIpXG4gICAgICAgICAgICByID0gW2EsYl1cbiAgICAgICAgICAgIHNvcnRSYW5nZXMgclxuICAgICAgICAgICAgcmFuZ2VCZXR3ZWVuIHJhbmdlRW5kUG9zKHJbMF0pLCByYW5nZVN0YXJ0UG9zKHJbMV0pXG4gICAgICAgICAgICBcbiAgICBpc1BvczogICAgICAgICAocCkgICAgICAgLT4gcD8ubGVuZ3RoID09IDIgYW5kIF8uaXNOdW1iZXIocFswXSkgYW5kIF8uaXNOdW1iZXIocFsxXSlcbiAgICBpc1JhbmdlOiAgICAgICAocikgICAgICAgLT4gcj8ubGVuZ3RoID49IDIgYW5kIF8uaXNOdW1iZXIoclswXSkgYW5kIHJbMV0/Lmxlbmd0aCA+PSAyIGFuZCBfLmlzTnVtYmVyKHJbMV1bMF0pIGFuZCBfLmlzTnVtYmVyKHJbMV1bMV0pXG4gICAgaXNTYW1lUmFuZ2U6ICAgKGEsYikgICAgIC0+IGFbMF09PWJbMF0gYW5kIGFbMV1bMF09PWJbMV1bMF0gYW5kIGFbMV1bMV09PWJbMV1bMV1cbiAgICBpc1NhbWVQb3M6ICAgICAoYSxiKSAgICAgLT4gYVsxXT09YlsxXSBhbmQgYVswXT09YlswXVxuICAgIGlzUG9zSW5SYW5nZTogIChwLCByKSAgICAtPiAocFsxXSA9PSByWzBdKSBhbmQgKHJbMV1bMF0gPD0gcFswXSA8PSByWzFdWzFdKVxuICAgIGlzUG9zSW5SYW5nZXM6IChwLCByZ3MpICAtPiByYW5nZUF0UG9zSW5SYW5nZXMocCwgcmdzKT9cbiAgICBpc1Bvc0luUG9zaXRpb25zOiAocCxwcykgLT4gcG9zSW5Qb3NpdGlvbnMocCxwcyk/XG5cbiAgICByYW5nZUVuZFBvczogICAocikgICAgICAgLT4gW3JbMV1bMV0sIHJbMF1dXG4gICAgcmFuZ2VTdGFydFBvczogKHIpICAgICAgIC0+IFtyWzFdWzBdLCByWzBdXVxuICAgIGxlbmd0aE9mUmFuZ2U6IChyKSAgICAgICAtPiByWzFdWzFdIC0gclsxXVswXVxuICAgIHJhbmdlSW5kZXhQb3M6IChyLGkpICAgICAtPiBbclsxXVtpXSwgclswXV1cbiAgICByYW5nZUdyb3duQnk6ICAocixkKSAgICAgLT4gW3JbMF0sIFtyWzFdWzBdLWQsIHJbMV1bMV0rZF1dXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcblxuICAgIHBvc2l0aW9uc0Zyb21Qb3NJblBvc2l0aW9uczogKHAsIHBsKSAtPiAociBmb3IgciBpbiBwbCB3aGVuICgoclsxXSA+IHBbMV0pIG9yICgoclsxXSA9PSBwWzFdKSBhbmQgKHJbMF0gPj0gcFswXSkpKSlcbiAgICBwb3NpdGlvbnNBdExpbmVJbmRleEluUG9zaXRpb25zOiAobGkscGwpIC0+IChwIGZvciBwIGluIHBsIHdoZW4gcFsxXSA9PSBsaSlcbiAgICBwb3NpdGlvbnNCZWxvd0xpbmVJbmRleEluUG9zaXRpb25zOiAobGkscGwpIC0+IChwIGZvciBwIGluIHBsIHdoZW4gcFsxXSA+IGxpKVxuICAgIHBvc2l0aW9uc0FmdGVyTGluZUNvbEluUG9zaXRpb25zOiAobGksY29sLHBsKSAtPiAocCBmb3IgcCBpbiBwbCB3aGVuIHBbMV0gPT0gbGkgYW5kIHBbMF0+Y29sKVxuICAgIHBvc2l0aW9uc05vdEluUmFuZ2VzOiAocHNzLCByZ3MpIC0+IF8uZmlsdGVyIHBzcywgKHApIC0+IG5vdCBpc1Bvc0luUmFuZ2VzIHAsIHJnc1xuICAgIHBvc2l0aW9uc0JldHdlZW5Qb3NBbmRQb3NJblBvc2l0aW9uczogKHAxLHAyLHBsKSAtPiBcbiAgICAgICAgW2EsYl0gPSBzb3J0UG9zaXRpb25zIFtwMSwgcDJdXG4gICAgICAgIChyIGZvciByIGluIHBsIHdoZW4gKCAoclsxXSA+IGFbMV0gb3IgKHJbMV0gPT0gYVsxXSkgYW5kIChyWzBdID49IGFbMF0pKSBhbmQgKHJbMV0gPCBiWzFdIG9yIChyWzFdID09IGJbMV0pIGFuZCAoclswXSA8PSBiWzBdKSkpKSBcblxuICAgIHBvc2l0aW9uc0luQ29udGludW91c0xpbmU6IChwbCkgLT5cbiAgICAgICAgXG4gICAgICAgIGNwID0gcGxbMF1cbiAgICAgICAgZm9yIGMgaW4gcGwuc2xpY2UgMVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlIGlmIGNbMF0gIT0gY3BbMF1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiBjWzFdICE9IGNwWzFdKzFcbiAgICAgICAgICAgIGNwID0gY1xuICAgICAgICB0cnVlXG4gICAgICAgICAgICBcbiAgICBtYW5oYXR0YW5EaXN0YW5jZTogKGEsYikgLT4gTWF0aC5hYnMoYVsxXS1iWzFdKStNYXRoLmFicyhhWzBdLWJbMF0pXG4gICAgICAgIFxuICAgIHBvc0luUG9zaXRpb25zOiAocCxwbCkgLT5cbiAgICAgICAgZm9yIGMgaW4gcGxcbiAgICAgICAgICAgIHJldHVybiBjIGlmIGlzU2FtZVBvcyBwLCBjXG5cbiAgICBwb3NDbG9zZXN0VG9Qb3NJblBvc2l0aW9uczogKHAscGwpIC0+IFxuICAgICAgICBtaW5EaXN0ID0gOTk5OTk5ICAgICAgICBcbiAgICAgICAgZm9yIHBzIGluIHBsXG4gICAgICAgICAgICBtRGlzdCA9IG1hbmhhdHRhbkRpc3RhbmNlIHBzLCBwXG4gICAgICAgICAgICBpZiBtRGlzdCA8IG1pbkRpc3RcbiAgICAgICAgICAgICAgICBtaW5EaXN0ID0gbURpc3RcbiAgICAgICAgICAgICAgICBtaW5Qb3MgPSBwc1xuICAgICAgICBtaW5Qb3MgPyBfLmxhc3QgcGxcbiAgICBcbiAgICBsaW5lSW5kaWNlc0luUG9zaXRpb25zOiAocGwpIC0+XG4gICAgICAgIGluZGljZXMgPSBbXVxuICAgICAgICBmb3IgcCBpbiBwbFxuICAgICAgICAgICAgaW5kaWNlcy5wdXNoIHBbMV0gXG4gICAgICAgIF8udW5pcShpbmRpY2VzKS5zb3J0KClcblxuICAgIGVuZFBvc2l0aW9uc0Zyb21SYW5nZXM6ICAgKHJhbmdlcykgLT4gKHJhbmdlRW5kUG9zKHIpIGZvciByIGluIHJhbmdlcylcbiAgICBzdGFydFBvc2l0aW9uc0Zyb21SYW5nZXM6IChyYW5nZXMpIC0+IChyYW5nZVN0YXJ0UG9zKHIpIGZvciByIGluIHJhbmdlcykgICAgICAgIFxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICByYW5nZXNGcm9tUG9zaXRpb25zOiAocGwpIC0+IChbcFsxXSwgW3BbMF0sIHBbMF1dXSBmb3IgcCBpbiBwbCkgIFxuICAgIHJhbmdlc0F0TGluZUluZGV4SW5SYW5nZXM6IChsaSwgcmFuZ2VzKSAtPiAociBmb3IgciBpbiByYW5nZXMgd2hlbiByWzBdPT1saSlcbiAgICByYW5nZXNGb3JMaW5lSW5kaWNlc0luUmFuZ2VzOiAobGlzLCByYW5nZXMpIC0+IChyIGZvciByIGluIHJhbmdlcyB3aGVuIHJbMF0gaW4gbGlzKVxuICAgIHJhbmdlc0FmdGVyTGluZUNvbEluUmFuZ2VzOiAobGksY29sLHJhbmdlcykgLT4gKHIgZm9yIHIgaW4gcmFuZ2VzIHdoZW4gclswXT09bGkgYW5kIHJbMV1bMF0gPiBjb2wpXG4gICAgXG4gICAgcmFuZ2VBdFBvc0luUmFuZ2VzOiAocG9zLCByYW5nZXMpIC0+XG4gICAgICAgIHJldHVybiBpZiByYW5nZXMubGVuZ3RoID09IDBcbiAgICAgICAgZm9yIHJpIGluIFtyYW5nZXMubGVuZ3RoLTEuLjBdXG4gICAgICAgICAgICByID0gcmFuZ2VzW3JpXVxuICAgICAgICAgICAgaWYgKHJbMF0gPT0gcG9zWzFdKSBhbmQgKHJbMV1bMF0gPD0gcG9zWzBdIDw9IHJbMV1bMV0pXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJcblxuICAgIHJhbmdlc0JlZm9yZVBvc0luUmFuZ2VzOiAocG9zLCByYW5nZXMpIC0+XG4gICAgICAgIHJldHVybiBbXSBpZiByYW5nZXMubGVuZ3RoID09IDBcbiAgICAgICAgcnMgPSBbXVxuICAgICAgICBmb3IgciBpbiByYW5nZXNcbiAgICAgICAgICAgIGlmIChyWzBdID4gcG9zWzFdKSBvciAoKHJbMF0gPT0gcG9zWzFdKSBhbmQgKHJbMV1bMF0gPiBwb3NbMF0pKVxuICAgICAgICAgICAgICAgIHJldHVybiBycyBcbiAgICAgICAgICAgIHJzLnB1c2ggclxuICAgICAgICByc1xuXG4gICAgcmFuZ2VzQWZ0ZXJQb3NJblJhbmdlczogKHBvcywgcmFuZ2VzKSAtPlxuICAgICAgICByZXR1cm4gW10gaWYgcmFuZ2VzLmxlbmd0aCA9PSAwXG4gICAgICAgIHJzID0gW11cbiAgICAgICAgZm9yIHJpIGluIFtyYW5nZXMubGVuZ3RoLTEuLjBdXG4gICAgICAgICAgICByID0gcmFuZ2VzW3JpXVxuICAgICAgICAgICAgaWYgKHJbMF0gPCBwb3NbMV0pIG9yICgoclswXSA9PSBwb3NbMV0pIGFuZCAoclsxXVsxXSA8IHBvc1swXSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJzIFxuICAgICAgICAgICAgcnMudW5zaGlmdCByXG4gICAgICAgIHJzXG4gICAgICAgIFxuICAgIHJhbmdlc1NwbGl0QXRQb3NJblJhbmdlczogKHBvcywgcmFuZ2VzKSAtPlxuICAgICAgICByZXR1cm4gW1tdLG51bGwsW11dIGlmIHJhbmdlcy5sZW5ndGggPT0gMFxuICAgICAgICBbYmVmLGF0LGFmdF0gPSBbW10sbnVsbCxbXV1cbiAgICAgICAgZm9yIHJpIGluIFswLi4ucmFuZ2VzLmxlbmd0aF1cbiAgICAgICAgICAgIHIgPSByYW5nZXNbcmldXG4gICAgICAgICAgICBpZiAoclswXSA9PSBwb3NbMV0pIGFuZCAoclsxXVswXSA8PSBwb3NbMF0gPD0gclsxXVsxXSlcbiAgICAgICAgICAgICAgICBhdCA9IHJcbiAgICAgICAgICAgICAgICBhZnQgPSByYW5nZXMuc2xpY2UgcmkrMVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBiZWYucHVzaCByXG4gICAgICAgIFtiZWYsYXQsYWZ0XVxuICAgICAgICAgICAgXG4gICAgcmFuZ2VCZWZvcmVQb3NJblJhbmdlczogKHBvcywgcmFuZ2VzKSAtPlxuICAgICAgICByZXR1cm4gaWYgcmFuZ2VzLmxlbmd0aCA9PSAwXG4gICAgICAgIGZvciByaSBpbiBbcmFuZ2VzLmxlbmd0aC0xLi4wXVxuICAgICAgICAgICAgciA9IHJhbmdlc1tyaV1cbiAgICAgICAgICAgIGlmIChyWzBdIDwgcG9zWzFdKSBvciAoKHJbMF0gPT0gcG9zWzFdKSBhbmQgKHJbMV1bMV0gPCBwb3NbMF0pKVxuICAgICAgICAgICAgICAgIHJldHVybiByIFxuICAgIFxuICAgIHJhbmdlQWZ0ZXJQb3NJblJhbmdlczogKHBvcywgcmFuZ2VzKSAtPlxuICAgICAgICBmb3IgciBpbiByYW5nZXNcbiAgICAgICAgICAgIGlmIChyWzBdID4gcG9zWzFdKSBvciAoKHJbMF0gPT0gcG9zWzFdKSBhbmQgKHJbMV1bMF0gPiBwb3NbMF0pKVxuICAgICAgICAgICAgICAgIHJldHVybiByXG4gICAgXG4gICAgcmFuZ2VTdGFydGluZ09yRW5kaW5nQXRQb3NJblJhbmdlczogKHAsIHJhbmdlcykgLT5cbiAgICAgICAgcmV0dXJuIGlmIHJhbmdlcy5sZW5ndGggPT0gMFxuICAgICAgICBmb3IgcmkgaW4gW3Jhbmdlcy5sZW5ndGgtMS4uMF1cbiAgICAgICAgICAgIHIgPSByYW5nZXNbcmldXG4gICAgICAgICAgICBpZiByWzBdID09IHBbMV1cbiAgICAgICAgICAgICAgICBpZiByWzFdWzBdID09IHBbMF0gb3IgclsxXVsxXSA9PSBwWzBdXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByXG4gICAgXG4gICAgcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXM6ICh0b3AsIGJvdCwgcmFuZ2VzKSAtPlxuICAgICAgICAociBmb3IgciBpbiByYW5nZXMgd2hlbiB0b3AgPD0gclswXSA8PSBib3QpXG4gICAgICAgIFxuICAgIHJhbmdlQ29udGFpbmluZ1JhbmdlSW5SYW5nZXM6IChyLCByYW5nZXMpIC0+XG4gICAgICAgIGlmIGNyID0gcmFuZ2VBdFBvc0luUmFuZ2VzIHJhbmdlU3RhcnRQb3MociksIHJhbmdlc1xuICAgICAgICAgICAgcmV0dXJuIGNyIGlmIGNyWzFdWzFdID49IHJbMV1bMV1cbiAgICAgICAgXG4gICAgcmFuZ2VzU2hydW5rZW5CeTogKHJhbmdlcywgZGVsdGEpIC0+XG4gICAgICAgIChbclswXSwgW3JbMV1bMF0rZGVsdGEsIHJbMV1bMV0tZGVsdGFdXSBmb3IgciBpbiByYW5nZXMgd2hlbiAoclsxXVsxXS1yWzFdWzBdKT49MipkZWx0YSlcbiAgICAgICAgICAgIFxuICAgIHJhbmdlc05vdEVtcHR5SW5SYW5nZXM6IChyYW5nZXMpIC0+IF8uZmlsdGVyIHJhbmdlcywgKHIpIC0+IHJbMV1bMV0tclsxXVswXVxuXG4gICAgYXJlU2FtZVJhbmdlczogKHJhLCByYikgLT4gXG4gICAgICAgIGlmIHJhLmxlbmd0aCA9PSByYi5sZW5ndGhcbiAgICAgICAgICAgIGZvciBpIGluIFswLi4ucmEubGVuZ3RoXVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiBub3QgaXNTYW1lUmFuZ2UgcmFbaV0sIHJiW2ldXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBmYWxzZVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGNsZWFuUmFuZ2VzOiAocmFuZ2VzKSAtPlxuICAgICAgICBzb3J0UmFuZ2VzIHJhbmdlcyBcbiAgICAgICAgaWYgcmFuZ2VzLmxlbmd0aCA+IDFcbiAgICAgICAgICAgIGZvciByaSBpbiBbcmFuZ2VzLmxlbmd0aC0xLi4uMF1cbiAgICAgICAgICAgICAgICByID0gcmFuZ2VzW3JpXVxuICAgICAgICAgICAgICAgIHAgPSByYW5nZXNbcmktMV1cbiAgICAgICAgICAgICAgICBpZiByWzBdID09IHBbMF0gIyBvbiBzYW1lIGxpbmVcbiAgICAgICAgICAgICAgICAgICAgaWYgclsxXVswXSA8PSBwWzFdWzFdICMgc3RhcnRzIGJlZm9yZSBwcmV2aW91cyBlbmRzXG4gICAgICAgICAgICAgICAgICAgICAgICBwWzFdWzFdID0gTWF0aC5tYXggcFsxXVsxXSwgclsxXVsxXSBcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlcy5zcGxpY2UgcmksIDFcbiAgICAgICAgcmFuZ2VzXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAgICAgICAgICAgICBcbiAgICBzb3J0UmFuZ2VzOiAocmFuZ2VzKSAtPlxuICAgICAgICByYW5nZXMuc29ydCAoYSxiKSAtPiBcbiAgICAgICAgICAgIGlmIGFbMF0hPWJbMF1cbiAgICAgICAgICAgICAgICBhWzBdLWJbMF1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiBhWzFdWzBdIT1iWzFdWzBdXG4gICAgICAgICAgICAgICAgICAgIGFbMV1bMF0tYlsxXVswXVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYVsxXVsxXS1iWzFdWzFdXG4gICAgICAgICAgICAgICAgICAgIFxuICAgIHNvcnRQb3NpdGlvbnM6IChwb3NpdGlvbnMpIC0+XG4gICAgICAgIHBvc2l0aW9ucy5zb3J0IChhLGIpIC0+XG4gICAgICAgICAgICBpZiBhWzFdIT1iWzFdXG4gICAgICAgICAgICAgICAgYVsxXS1iWzFdXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgYVswXS1iWzBdXG4gICAgXG5tb2R1bGUuZXhwb3J0cyA9IFJhbmdlcy5wb2xsdXRlKClcbiJdfQ==
//# sourceURL=../../coffee/tools/ranges.coffee