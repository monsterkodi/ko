// koffee 1.7.0

/*
0000000    000   000  00000000  00000000  00000000  00000000
000   000  000   000  000       000       000       000   000
0000000    000   000  000000    000000    0000000   0000000
000   000  000   000  000       000       000       000   000
0000000     0000000   000       000       00000000  000   000
 */
var Buffer, State, _, clamp, empty, endOf, event, fuzzy, kerror, matchr, ref, startOf,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend1 = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf;

ref = require('kxk'), _ = ref._, clamp = ref.clamp, empty = ref.empty, kerror = ref.kerror, matchr = ref.matchr;

State = require('./state');

fuzzy = require('fuzzy');

event = require('events');

startOf = function(r) {
    return r[0];
};

endOf = function(r) {
    return r[0] + Math.max(1, r[1] - r[0]);
};

Buffer = (function(superClass) {
    extend1(Buffer, superClass);

    function Buffer() {
        this.startOfWordAtPos = bind(this.startOfWordAtPos, this);
        this.endOfWordAtPos = bind(this.endOfWordAtPos, this);
        this.lines = bind(this.lines, this);
        this.line = bind(this.line, this);
        Buffer.__super__.constructor.call(this);
        this.newlineCharacters = '\n';
        this.wordRegExp = new RegExp("(\\s+|\\w+|[^\\s])", 'g');
        this.realWordRegExp = new RegExp("(\\w+)", 'g');
        this.setState(new State());
    }

    Buffer.prototype.setLines = function(lines) {
        this.emit('numLines', 0);
        this.state = new State({
            lines: lines
        });
        return this.emit('numLines', this.numLines());
    };

    Buffer.prototype.setState = function(state) {
        return this.state = new State(state.s);
    };

    Buffer.prototype.mainCursor = function() {
        return this.state.mainCursor();
    };

    Buffer.prototype.line = function(i) {
        return this.state.line(i);
    };

    Buffer.prototype.tabline = function(i) {
        return this.state.tabline(i);
    };

    Buffer.prototype.cursor = function(i) {
        return this.state.cursor(i);
    };

    Buffer.prototype.highlight = function(i) {
        return this.state.highlight(i);
    };

    Buffer.prototype.selection = function(i) {
        return this.state.selection(i);
    };

    Buffer.prototype.lines = function() {
        return this.state.lines();
    };

    Buffer.prototype.cursors = function() {
        return this.state.cursors();
    };

    Buffer.prototype.highlights = function() {
        return this.state.highlights();
    };

    Buffer.prototype.selections = function() {
        return this.state.selections();
    };

    Buffer.prototype.numLines = function() {
        return this.state.numLines();
    };

    Buffer.prototype.numCursors = function() {
        return this.state.numCursors();
    };

    Buffer.prototype.numSelections = function() {
        return this.state.numSelections();
    };

    Buffer.prototype.numHighlights = function() {
        return this.state.numHighlights();
    };

    Buffer.prototype.setCursors = function(c) {
        return this.state = this.state.setCursors(c);
    };

    Buffer.prototype.setSelections = function(s) {
        return this.state = this.state.setSelections(s);
    };

    Buffer.prototype.setHighlights = function(h) {
        return this.state = this.state.setHighlights(h);
    };

    Buffer.prototype.setMain = function(m) {
        return this.state = this.state.setMain(m);
    };

    Buffer.prototype.addHighlight = function(h) {
        return this.state = this.state.addHighlight(h);
    };

    Buffer.prototype.select = function(s) {
        this["do"].start();
        this["do"].select(s);
        return this["do"].end();
    };

    Buffer.prototype.isCursorVirtual = function(c) {
        if (c == null) {
            c = this.mainCursor();
        }
        return this.numLines() && c[1] < this.numLines() && c[0] > this.line(c[1]).length;
    };

    Buffer.prototype.isCursorAtEndOfLine = function(c) {
        if (c == null) {
            c = this.mainCursor();
        }
        return this.numLines() && c[1] < this.numLines() && c[0] >= this.line(c[1]).length;
    };

    Buffer.prototype.isCursorAtStartOfLine = function(c) {
        if (c == null) {
            c = this.mainCursor();
        }
        return c[0] === 0;
    };

    Buffer.prototype.isCursorInIndent = function(c) {
        if (c == null) {
            c = this.mainCursor();
        }
        return this.numLines() && this.line(c[1]).slice(0, c[0]).trim().length === 0 && this.line(c[1]).slice(c[0]).trim().length;
    };

    Buffer.prototype.isCursorInLastLine = function(c) {
        if (c == null) {
            c = this.mainCursor();
        }
        return c[1] === this.numLines() - 1;
    };

    Buffer.prototype.isCursorInFirstLine = function(c) {
        if (c == null) {
            c = this.mainCursor();
        }
        return c[1] === 0;
    };

    Buffer.prototype.isCursorInRange = function(r, c) {
        if (c == null) {
            c = this.mainCursor();
        }
        return isPosInRange(c, r);
    };

    Buffer.prototype.wordAtCursor = function() {
        return this.wordAtPos(this.mainCursor());
    };

    Buffer.prototype.wordAtPos = function(c) {
        return this.textInRange(this.rangeForRealWordAtPos(c));
    };

    Buffer.prototype.wordsAtCursors = function(cs, opt) {
        var j, len, r, ref1, results;
        if (cs == null) {
            cs = this.cursors();
        }
        ref1 = this.rangesForWordsAtCursors(cs, opt);
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
            r = ref1[j];
            results.push(this.textInRange(r));
        }
        return results;
    };

    Buffer.prototype.rangesForWordsAtCursors = function(cs, opt) {
        var c, rngs;
        if (cs == null) {
            cs = this.cursors();
        }
        rngs = (function() {
            var j, len, results;
            results = [];
            for (j = 0, len = cs.length; j < len; j++) {
                c = cs[j];
                results.push(this.rangeForWordAtPos(c, opt));
            }
            return results;
        }).call(this);
        return rngs = cleanRanges(rngs);
    };

    Buffer.prototype.selectionTextOrWordAtCursor = function() {
        if (this.numSelections() === 1) {
            return this.textInRange(this.selection(0));
        } else {
            return this.wordAtCursor();
        }
    };

    Buffer.prototype.rangeForWordAtPos = function(pos, opt) {
        var p, r, wr;
        p = this.clampPos(pos);
        wr = this.wordRangesInLineAtIndex(p[1], opt);
        r = rangeAtPosInRanges(p, wr);
        return r;
    };

    Buffer.prototype.rangeForRealWordAtPos = function(pos, opt) {
        var p, r, wr;
        p = this.clampPos(pos);
        wr = this.realWordRangesInLineAtIndex(p[1], opt);
        r = rangeAtPosInRanges(p, wr);
        if ((r == null) || empty(this.textInRange(r).trim())) {
            r = rangeBeforePosInRanges(p, wr);
        }
        if ((r == null) || empty(this.textInRange(r).trim())) {
            r = rangeAfterPosInRanges(p, wr);
        }
        if (r != null) {
            r;
        } else {
            r = rangeForPos(p);
        }
        return r;
    };

    Buffer.prototype.endOfWordAtPos = function(c) {
        var r;
        r = this.rangeForWordAtPos(c);
        if (this.isCursorAtEndOfLine(c)) {
            if (this.isCursorInLastLine(c)) {
                return c;
            }
            r = this.rangeForWordAtPos([0, c[1] + 1]);
        }
        return [r[1][1], r[0]];
    };

    Buffer.prototype.startOfWordAtPos = function(c) {
        var r;
        if (this.isCursorAtStartOfLine(c)) {
            if (this.isCursorInFirstLine(c)) {
                return c;
            }
            r = this.rangeForWordAtPos([this.line(c[1] - 1).length, c[1] - 1]);
        } else {
            r = this.rangeForWordAtPos(c);
            if (r[1][0] === c[0]) {
                r = this.rangeForWordAtPos([c[0] - 1, c[1]]);
            }
        }
        return [r[1][0], r[0]];
    };

    Buffer.prototype.wordRangesInLineAtIndex = function(li, opt) {
        var mtch, r, ref1;
        if (opt == null) {
            opt = {};
        }
        if (opt.regExp != null) {
            opt.regExp;
        } else {
            opt.regExp = this.wordRegExp;
        }
        if (opt != null ? (ref1 = opt.include) != null ? ref1.length : void 0 : void 0) {
            opt.regExp = new RegExp("(\\s+|[\\w" + opt.include + "]+|[^\\s])", 'g');
        }
        r = [];
        while ((mtch = opt.regExp.exec(this.line(li))) !== null) {
            r.push([li, [mtch.index, opt.regExp.lastIndex]]);
        }
        return r.length && r || [[li, [0, 0]]];
    };

    Buffer.prototype.realWordRangesInLineAtIndex = function(li, opt) {
        var mtch, r;
        if (opt == null) {
            opt = {};
        }
        r = [];
        while ((mtch = this.realWordRegExp.exec(this.line(li))) !== null) {
            r.push([li, [mtch.index, this.realWordRegExp.lastIndex]]);
        }
        return r.length && r || [[li, [0, 0]]];
    };

    Buffer.prototype.highlightsInLineIndexRangeRelativeToLineIndex = function(lineIndexRange, relIndex) {
        var hl, j, len, results, s;
        hl = this.highlightsInLineIndexRange(lineIndexRange);
        if (hl) {
            results = [];
            for (j = 0, len = hl.length; j < len; j++) {
                s = hl[j];
                results.push([s[0] - relIndex, [s[1][0], s[1][1]], s[2]]);
            }
            return results;
        }
    };

    Buffer.prototype.highlightsInLineIndexRange = function(lineIndexRange) {
        return this.highlights().filter(function(s) {
            return s[0] >= lineIndexRange[0] && s[0] <= lineIndexRange[1];
        });
    };

    Buffer.prototype.selectionsInLineIndexRangeRelativeToLineIndex = function(lineIndexRange, relIndex) {
        var j, len, results, s, sl;
        sl = this.selectionsInLineIndexRange(lineIndexRange);
        if (sl) {
            results = [];
            for (j = 0, len = sl.length; j < len; j++) {
                s = sl[j];
                results.push([s[0] - relIndex, [s[1][0], s[1][1]]]);
            }
            return results;
        }
    };

    Buffer.prototype.selectionsInLineIndexRange = function(lineIndexRange) {
        return this.selections().filter(function(s) {
            return s[0] >= lineIndexRange[0] && s[0] <= lineIndexRange[1];
        });
    };

    Buffer.prototype.selectedLineIndices = function() {
        var s;
        return _.uniq((function() {
            var j, len, ref1, results;
            ref1 = this.selections();
            results = [];
            for (j = 0, len = ref1.length; j < len; j++) {
                s = ref1[j];
                results.push(s[0]);
            }
            return results;
        }).call(this));
    };

    Buffer.prototype.cursorLineIndices = function() {
        var c;
        return _.uniq((function() {
            var j, len, ref1, results;
            ref1 = this.cursors();
            results = [];
            for (j = 0, len = ref1.length; j < len; j++) {
                c = ref1[j];
                results.push(c[1]);
            }
            return results;
        }).call(this));
    };

    Buffer.prototype.selectedAndCursorLineIndices = function() {
        return _.uniq(this.selectedLineIndices().concat(this.cursorLineIndices()));
    };

    Buffer.prototype.continuousCursorAndSelectedLineIndexRanges = function() {
        var csr, il, j, len, li;
        il = this.selectedAndCursorLineIndices();
        csr = [];
        if (il.length) {
            for (j = 0, len = il.length; j < len; j++) {
                li = il[j];
                if (csr.length && _.last(csr)[1] === li - 1) {
                    _.last(csr)[1] = li;
                } else {
                    csr.push([li, li]);
                }
            }
        }
        return csr;
    };

    Buffer.prototype.isSelectedLineAtIndex = function(li) {
        var il, s;
        il = this.selectedLineIndices();
        if (indexOf.call(il, li) >= 0) {
            s = this.selection(il.indexOf(li));
            if (s[1][0] === 0 && s[1][1] === this.line(li).length) {
                return true;
            }
        }
        return false;
    };

    Buffer.prototype.text = function() {
        return this.state.text(this.newlineCharacters);
    };

    Buffer.prototype.textInRange = function(rg) {
        var base;
        return typeof (base = this.line(rg[0])).slice === "function" ? base.slice(rg[1][0], rg[1][1]) : void 0;
    };

    Buffer.prototype.textsInRanges = function(rgs) {
        var j, len, r, results;
        results = [];
        for (j = 0, len = rgs.length; j < len; j++) {
            r = rgs[j];
            results.push(this.textInRange(r));
        }
        return results;
    };

    Buffer.prototype.textInRanges = function(rgs) {
        return this.textsInRanges(rgs).join('\n');
    };

    Buffer.prototype.textOfSelection = function() {
        return this.textInRanges(this.selections());
    };

    Buffer.prototype.textOfHighlight = function() {
        return this.numHighlights() && this.textInRange(this.highlight(0)) || '';
    };

    Buffer.prototype.indentationAtLineIndex = function(li) {
        var line;
        if (li >= this.numLines()) {
            return 0;
        }
        line = this.line(li);
        while (empty(line.trim()) && li > 0) {
            li--;
            line = this.line(li);
        }
        return indentationInLine(line);
    };

    Buffer.prototype.lastPos = function() {
        var lli;
        lli = this.numLines() - 1;
        return [this.line(lli).length, lli];
    };

    Buffer.prototype.cursorPos = function() {
        return this.clampPos(this.mainCursor());
    };

    Buffer.prototype.clampPos = function(p) {
        var c, l;
        if (!this.numLines()) {
            return [0, -1];
        }
        l = clamp(0, this.numLines() - 1, p[1]);
        c = clamp(0, this.line(l).length, p[0]);
        return [c, l];
    };

    Buffer.prototype.wordStartPosAfterPos = function(p) {
        if (p == null) {
            p = this.cursorPos();
        }
        if (p[0] < this.line(p[1]).length && this.line(p[1])[p[0]] !== ' ') {
            return p;
        }
        while (p[0] < this.line(p[1]).length - 1) {
            if (this.line(p[1])[p[0] + 1] !== ' ') {
                return [p[0] + 1, p[1]];
            }
            p[0] += 1;
        }
        if (p[1] < this.numLines() - 1) {
            return this.wordStartPosAfterPos([0, p[1] + 1]);
        } else {
            return null;
        }
    };

    Buffer.prototype.rangeForLineAtIndex = function(i) {
        if (i >= this.numLines()) {
            return kerror("Buffer.rangeForLineAtIndex -- index " + i + " >= " + (this.numLines()));
        }
        return [i, [0, this.line(i).length]];
    };

    Buffer.prototype.isRangeInString = function(r) {
        return this.rangeOfStringSurroundingRange(r) != null;
    };

    Buffer.prototype.rangeOfInnerStringSurroundingRange = function(r) {
        var rgs;
        rgs = this.rangesOfStringsInLineAtIndex(r[0]);
        rgs = rangesShrunkenBy(rgs, 1);
        return rangeContainingRangeInRanges(r, rgs);
    };

    Buffer.prototype.rangeOfStringSurroundingRange = function(r) {
        var ir;
        if (ir = this.rangeOfInnerStringSurroundingRange(r)) {
            return rangeGrownBy(ir, 1);
        }
    };

    Buffer.prototype.distanceOfWord = function(w, pos) {
        var d, la, lb;
        if (pos == null) {
            pos = this.cursorPos();
        }
        if (this.line(pos[1]).indexOf(w) >= 0) {
            return 0;
        }
        d = 1;
        lb = pos[1] - d;
        la = pos[1] + d;
        while (lb >= 0 || la < this.numLines()) {
            if (lb >= 0) {
                if (this.line(lb).indexOf(w) >= 0) {
                    return d;
                }
            }
            if (la < this.numLines()) {
                if (this.line(la).indexOf(w) >= 0) {
                    return d;
                }
            }
            d++;
            lb = pos[1] - d;
            la = pos[1] + d;
        }
        return Number.MAX_SAFE_INTEGER;
    };

    Buffer.prototype.rangesForCursorLines = function(cs) {
        var c, j, len, results;
        if (cs == null) {
            cs = this.cursors();
        }
        results = [];
        for (j = 0, len = cs.length; j < len; j++) {
            c = cs[j];
            results.push(this.rangeForLineAtIndex(c[1]));
        }
        return results;
    };

    Buffer.prototype.rangesForAllLines = function() {
        return this.rangesForLinesFromTopToBot(0, this.numLines());
    };

    Buffer.prototype.rangesForLinesBetweenPositions = function(a, b, extend) {
        var i, j, r, ref1, ref2, ref3;
        if (extend == null) {
            extend = false;
        }
        r = [];
        ref1 = sortPositions([a, b]), a = ref1[0], b = ref1[1];
        if (a[1] === b[1]) {
            r.push([a[1], [a[0], b[0]]]);
        } else {
            r.push([a[1], [a[0], this.line(a[1]).length]]);
            if (b[1] - a[1] > 1) {
                for (i = j = ref2 = a[1] + 1, ref3 = b[1]; ref2 <= ref3 ? j < ref3 : j > ref3; i = ref2 <= ref3 ? ++j : --j) {
                    r.push([i, [0, this.line(i).length]]);
                }
            }
            r.push([b[1], [0, extend && b[0] === 0 && this.line(b[1]).length || b[0]]]);
        }
        return r;
    };

    Buffer.prototype.rangesForLinesFromTopToBot = function(top, bot) {
        var ir, j, li, r, ref1, ref2;
        r = [];
        ir = [top, bot];
        for (li = j = ref1 = startOf(ir), ref2 = endOf(ir); ref1 <= ref2 ? j < ref2 : j > ref2; li = ref1 <= ref2 ? ++j : --j) {
            r.push(this.rangeForLineAtIndex(li));
        }
        return r;
    };

    Buffer.prototype.rangesForText = function(t, opt) {
        var j, li, r, ref1, ref2;
        t = t.split('\n')[0];
        r = [];
        for (li = j = 0, ref1 = this.numLines(); 0 <= ref1 ? j < ref1 : j > ref1; li = 0 <= ref1 ? ++j : --j) {
            r = r.concat(this.rangesForTextInLineAtIndex(t, li, opt));
            if (r.length >= ((ref2 = opt != null ? opt.max : void 0) != null ? ref2 : 999)) {
                break;
            }
        }
        return r;
    };

    Buffer.prototype.rangesForTextInLineAtIndex = function(t, i, opt) {
        var j, len, mtch, r, re, ref1, rng, rngs, type;
        r = [];
        type = (ref1 = opt != null ? opt.type : void 0) != null ? ref1 : 'str';
        switch (type) {
            case 'fuzzy':
                re = new RegExp("\\w+", 'g');
                while ((mtch = re.exec(this.line(i))) !== null) {
                    if (fuzzy.test(t, this.line(i).slice(mtch.index, re.lastIndex))) {
                        r.push([i, [mtch.index, re.lastIndex]]);
                    }
                }
                break;
            default:
                if (type === 'str' || type === 'Str' || type === 'glob') {
                    t = _.escapeRegExp(t);
                }
                if (type === 'glob') {
                    t = t.replace(new RegExp("\\*", 'g'), "\w*");
                    if (!t.length) {
                        return r;
                    }
                }
                rngs = matchr.ranges(t, this.line(i), (type === 'str' || type === 'reg' || type === 'glob') && 'i' || '');
                for (j = 0, len = rngs.length; j < len; j++) {
                    rng = rngs[j];
                    r.push([i, [rng.start, rng.start + rng.match.length]]);
                }
        }
        return r;
    };

    Buffer.prototype.rangesOfStringsInLineAtIndex = function(li) {
        var c, cc, i, j, r, ref1, ss, t;
        t = this.line(li);
        r = [];
        ss = -1;
        cc = null;
        for (i = j = 0, ref1 = t.length; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
            c = t[i];
            if (!cc && indexOf.call("'\"", c) >= 0) {
                cc = c;
                ss = i;
            } else if (c === cc) {
                if ((t[i - 1] !== '\\') || (i > 2 && t[i - 2] === '\\')) {
                    r.push([li, [ss, i + 1]]);
                    cc = null;
                    ss = -1;
                }
            }
        }
        return r;
    };

    return Buffer;

})(event);

module.exports = Buffer;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmZmVyLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxpRkFBQTtJQUFBOzs7OztBQVFBLE1BQXNDLE9BQUEsQ0FBUSxLQUFSLENBQXRDLEVBQUUsU0FBRixFQUFLLGlCQUFMLEVBQVksaUJBQVosRUFBbUIsbUJBQW5CLEVBQTJCOztBQUUzQixLQUFBLEdBQVUsT0FBQSxDQUFRLFNBQVI7O0FBQ1YsS0FBQSxHQUFVLE9BQUEsQ0FBUSxPQUFSOztBQUNWLEtBQUEsR0FBVSxPQUFBLENBQVEsUUFBUjs7QUFFVixPQUFBLEdBQVUsU0FBQyxDQUFEO1dBQU8sQ0FBRSxDQUFBLENBQUE7QUFBVDs7QUFDVixLQUFBLEdBQVUsU0FBQyxDQUFEO1dBQU8sQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFPLElBQUksQ0FBQyxHQUFMLENBQVMsQ0FBVCxFQUFZLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBSyxDQUFFLENBQUEsQ0FBQSxDQUFuQjtBQUFkOztBQUVKOzs7SUFFQyxnQkFBQTs7Ozs7UUFDQyxzQ0FBQTtRQUNBLElBQUMsQ0FBQSxpQkFBRCxHQUFxQjtRQUNyQixJQUFDLENBQUEsVUFBRCxHQUFjLElBQUksTUFBSixDQUFXLG9CQUFYLEVBQWlDLEdBQWpDO1FBQ2QsSUFBQyxDQUFBLGNBQUQsR0FBa0IsSUFBSSxNQUFKLENBQVcsUUFBWCxFQUFxQixHQUFyQjtRQUNsQixJQUFDLENBQUEsUUFBRCxDQUFVLElBQUksS0FBSixDQUFBLENBQVY7SUFMRDs7cUJBT0gsUUFBQSxHQUFVLFNBQUMsS0FBRDtRQUNOLElBQUMsQ0FBQSxJQUFELENBQU0sVUFBTixFQUFpQixDQUFqQjtRQUNBLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBSSxLQUFKLENBQVU7WUFBQSxLQUFBLEVBQU0sS0FBTjtTQUFWO2VBQ1QsSUFBQyxDQUFBLElBQUQsQ0FBTSxVQUFOLEVBQWlCLElBQUMsQ0FBQSxR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QUFBLEdBQUUsQ0FBUCxDQUFMLENBQVA7b0JBQ0EsRUFBQSxHQUFLO29CQUNMLEVBQUEsR0FBSyxDQUFDLEVBSFY7aUJBREM7O0FBTFQ7ZUFVQTtJQWYwQjs7OztHQXhXYjs7QUF5WHJCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAgICAgMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBfLCBjbGFtcCwgZW1wdHksIGtlcnJvciwgbWF0Y2hyIH0gPSByZXF1aXJlICdreGsnXG5cblN0YXRlICAgPSByZXF1aXJlICcuL3N0YXRlJ1xuZnV6enkgICA9IHJlcXVpcmUgJ2Z1enp5J1xuZXZlbnQgICA9IHJlcXVpcmUgJ2V2ZW50cydcblxuc3RhcnRPZiA9IChyKSAtPiByWzBdXG5lbmRPZiAgID0gKHIpIC0+IHJbMF0gKyBNYXRoLm1heCAxLCByWzFdLXJbMF1cblxuY2xhc3MgQnVmZmVyIGV4dGVuZHMgZXZlbnRcblxuICAgIEA6IC0+XG4gICAgICAgIHN1cGVyKClcbiAgICAgICAgQG5ld2xpbmVDaGFyYWN0ZXJzID0gJ1xcbidcbiAgICAgICAgQHdvcmRSZWdFeHAgPSBuZXcgUmVnRXhwIFwiKFxcXFxzK3xcXFxcdyt8W15cXFxcc10pXCIsICdnJ1xuICAgICAgICBAcmVhbFdvcmRSZWdFeHAgPSBuZXcgUmVnRXhwIFwiKFxcXFx3KylcIiwgJ2cnXG4gICAgICAgIEBzZXRTdGF0ZSBuZXcgU3RhdGUoKVxuXG4gICAgc2V0TGluZXM6IChsaW5lcykgLT5cbiAgICAgICAgQGVtaXQgJ251bUxpbmVzJyAwICMgZ2l2ZSBsaXN0ZW5lcnMgYSBjaGFuY2UgdG8gY2xlYXIgdGhlaXIgc3R1ZmZcbiAgICAgICAgQHN0YXRlID0gbmV3IFN0YXRlIGxpbmVzOmxpbmVzXG4gICAgICAgIEBlbWl0ICdudW1MaW5lcycgQG51bUxpbmVzKClcblxuICAgIHNldFN0YXRlOiAoc3RhdGUpIC0+IEBzdGF0ZSA9IG5ldyBTdGF0ZSBzdGF0ZS5zXG5cbiAgICBtYWluQ3Vyc29yOiAgICAtPiBAc3RhdGUubWFpbkN1cnNvcigpXG4gICAgbGluZTogICAgICAoaSkgPT4gQHN0YXRlLmxpbmUgaVxuICAgIHRhYmxpbmU6ICAgKGkpIC0+IEBzdGF0ZS50YWJsaW5lIGlcbiAgICBjdXJzb3I6ICAgIChpKSAtPiBAc3RhdGUuY3Vyc29yIGlcbiAgICBoaWdobGlnaHQ6IChpKSAtPiBAc3RhdGUuaGlnaGxpZ2h0IGlcbiAgICBzZWxlY3Rpb246IChpKSAtPiBAc3RhdGUuc2VsZWN0aW9uIGlcblxuICAgIGxpbmVzOiAgICAgICAgID0+IEBzdGF0ZS5saW5lcygpXG4gICAgY3Vyc29yczogICAgICAgLT4gQHN0YXRlLmN1cnNvcnMoKVxuICAgIGhpZ2hsaWdodHM6ICAgIC0+IEBzdGF0ZS5oaWdobGlnaHRzKClcbiAgICBzZWxlY3Rpb25zOiAgICAtPiBAc3RhdGUuc2VsZWN0aW9ucygpXG5cbiAgICBudW1MaW5lczogICAgICAtPiBAc3RhdGUubnVtTGluZXMoKVxuICAgIG51bUN1cnNvcnM6ICAgIC0+IEBzdGF0ZS5udW1DdXJzb3JzKClcbiAgICBudW1TZWxlY3Rpb25zOiAtPiBAc3RhdGUubnVtU2VsZWN0aW9ucygpXG4gICAgbnVtSGlnaGxpZ2h0czogLT4gQHN0YXRlLm51bUhpZ2hsaWdodHMoKVxuXG4gICAgIyB0aGVzZSBhcmUgdXNlZCBmcm9tIHRlc3RzIGFuZCByZXN0b3JlXG4gICAgc2V0Q3Vyc29yczogICAgKGMpIC0+IEBzdGF0ZSA9IEBzdGF0ZS5zZXRDdXJzb3JzICAgIGNcbiAgICBzZXRTZWxlY3Rpb25zOiAocykgLT4gQHN0YXRlID0gQHN0YXRlLnNldFNlbGVjdGlvbnMgc1xuICAgIHNldEhpZ2hsaWdodHM6IChoKSAtPiBAc3RhdGUgPSBAc3RhdGUuc2V0SGlnaGxpZ2h0cyBoXG4gICAgc2V0TWFpbjogICAgICAgKG0pIC0+IEBzdGF0ZSA9IEBzdGF0ZS5zZXRNYWluICAgICAgIG1cbiAgICBhZGRIaWdobGlnaHQ6ICAoaCkgLT4gQHN0YXRlID0gQHN0YXRlLmFkZEhpZ2hsaWdodCAgaFxuXG4gICAgc2VsZWN0OiAocykgLT5cblxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBAZG8uc2VsZWN0IHNcbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGlzQ3Vyc29yVmlydHVhbDogICAgICAgKGM9QG1haW5DdXJzb3IoKSkgLT4gQG51bUxpbmVzKCkgYW5kIGNbMV0gPCBAbnVtTGluZXMoKSBhbmQgY1swXSA+IEBsaW5lKGNbMV0pLmxlbmd0aFxuICAgIGlzQ3Vyc29yQXRFbmRPZkxpbmU6ICAgKGM9QG1haW5DdXJzb3IoKSkgLT4gQG51bUxpbmVzKCkgYW5kIGNbMV0gPCBAbnVtTGluZXMoKSBhbmQgY1swXSA+PSBAbGluZShjWzFdKS5sZW5ndGhcbiAgICBpc0N1cnNvckF0U3RhcnRPZkxpbmU6IChjPUBtYWluQ3Vyc29yKCkpIC0+IGNbMF0gPT0gMFxuICAgIGlzQ3Vyc29ySW5JbmRlbnQ6ICAgICAgKGM9QG1haW5DdXJzb3IoKSkgLT4gQG51bUxpbmVzKCkgYW5kIEBsaW5lKGNbMV0pLnNsaWNlKDAsIGNbMF0pLnRyaW0oKS5sZW5ndGggPT0gMCBhbmQgQGxpbmUoY1sxXSkuc2xpY2UoY1swXSkudHJpbSgpLmxlbmd0aFxuICAgIGlzQ3Vyc29ySW5MYXN0TGluZTogICAgKGM9QG1haW5DdXJzb3IoKSkgLT4gY1sxXSA9PSBAbnVtTGluZXMoKS0xXG4gICAgaXNDdXJzb3JJbkZpcnN0TGluZTogICAoYz1AbWFpbkN1cnNvcigpKSAtPiBjWzFdID09IDBcbiAgICBpc0N1cnNvckluUmFuZ2U6ICAgICAgIChyLGM9QG1haW5DdXJzb3IoKSkgLT4gaXNQb3NJblJhbmdlIGMsIHJcblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgd29yZEF0Q3Vyc29yOiAtPiBAd29yZEF0UG9zIEBtYWluQ3Vyc29yKClcbiAgICB3b3JkQXRQb3M6IChjKSAtPiBAdGV4dEluUmFuZ2UgQHJhbmdlRm9yUmVhbFdvcmRBdFBvcyBjXG4gICAgd29yZHNBdEN1cnNvcnM6IChjcz1AY3Vyc29ycygpLCBvcHQpIC0+IChAdGV4dEluUmFuZ2UgciBmb3IgciBpbiBAcmFuZ2VzRm9yV29yZHNBdEN1cnNvcnMgY3MsIG9wdClcblxuICAgIHJhbmdlc0ZvcldvcmRzQXRDdXJzb3JzOiAoY3M9QGN1cnNvcnMoKSwgb3B0KSAtPlxuICAgICAgICBybmdzID0gKEByYW5nZUZvcldvcmRBdFBvcyhjLCBvcHQpIGZvciBjIGluIGNzKVxuICAgICAgICBybmdzID0gY2xlYW5SYW5nZXMgcm5nc1xuXG4gICAgc2VsZWN0aW9uVGV4dE9yV29yZEF0Q3Vyc29yOiAoKSAtPlxuXG4gICAgICAgIGlmIEBudW1TZWxlY3Rpb25zKCkgPT0gMVxuICAgICAgICAgICAgQHRleHRJblJhbmdlIEBzZWxlY3Rpb24gMFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAd29yZEF0Q3Vyc29yKClcblxuICAgIHJhbmdlRm9yV29yZEF0UG9zOiAocG9zLCBvcHQpIC0+XG5cbiAgICAgICAgcCA9IEBjbGFtcFBvcyBwb3NcbiAgICAgICAgd3IgPSBAd29yZFJhbmdlc0luTGluZUF0SW5kZXggcFsxXSwgb3B0XG4gICAgICAgIHIgPSByYW5nZUF0UG9zSW5SYW5nZXMgcCwgd3JcbiAgICAgICAgclxuXG4gICAgcmFuZ2VGb3JSZWFsV29yZEF0UG9zOiAocG9zLCBvcHQpIC0+XG5cbiAgICAgICAgcCA9IEBjbGFtcFBvcyBwb3NcbiAgICAgICAgd3IgPSBAcmVhbFdvcmRSYW5nZXNJbkxpbmVBdEluZGV4IHBbMV0sIG9wdFxuXG4gICAgICAgIHIgPSByYW5nZUF0UG9zSW5SYW5nZXMgcCwgd3JcbiAgICAgICAgaWYgbm90IHI/IG9yIGVtcHR5IEB0ZXh0SW5SYW5nZShyKS50cmltKClcbiAgICAgICAgICAgIHIgPSByYW5nZUJlZm9yZVBvc0luUmFuZ2VzIHAsIHdyXG4gICAgICAgIGlmIG5vdCByPyBvciBlbXB0eSBAdGV4dEluUmFuZ2UocikudHJpbSgpXG4gICAgICAgICAgICByID0gcmFuZ2VBZnRlclBvc0luUmFuZ2VzIHAsIHdyXG4gICAgICAgIHIgPz0gcmFuZ2VGb3JQb3MgcFxuICAgICAgICByXG5cbiAgICBlbmRPZldvcmRBdFBvczogKGMpID0+XG5cbiAgICAgICAgciA9IEByYW5nZUZvcldvcmRBdFBvcyBjXG4gICAgICAgIGlmIEBpc0N1cnNvckF0RW5kT2ZMaW5lIGNcbiAgICAgICAgICAgIHJldHVybiBjIGlmIEBpc0N1cnNvckluTGFzdExpbmUgY1xuICAgICAgICAgICAgciA9IEByYW5nZUZvcldvcmRBdFBvcyBbMCwgY1sxXSsxXVxuICAgICAgICBbclsxXVsxXSwgclswXV1cblxuICAgIHN0YXJ0T2ZXb3JkQXRQb3M6IChjKSA9PlxuXG4gICAgICAgIGlmIEBpc0N1cnNvckF0U3RhcnRPZkxpbmUgY1xuICAgICAgICAgICAgcmV0dXJuIGMgaWYgQGlzQ3Vyc29ySW5GaXJzdExpbmUgY1xuICAgICAgICAgICAgciA9IEByYW5nZUZvcldvcmRBdFBvcyBbQGxpbmUoY1sxXS0xKS5sZW5ndGgsIGNbMV0tMV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgciA9IEByYW5nZUZvcldvcmRBdFBvcyBjXG4gICAgICAgICAgICBpZiByWzFdWzBdID09IGNbMF1cbiAgICAgICAgICAgICAgICByID0gQHJhbmdlRm9yV29yZEF0UG9zIFtjWzBdLTEsIGNbMV1dXG4gICAgICAgIFtyWzFdWzBdLCByWzBdXVxuXG4gICAgd29yZFJhbmdlc0luTGluZUF0SW5kZXg6IChsaSwgb3B0PXt9KSAtPlxuXG4gICAgICAgIG9wdC5yZWdFeHAgPz0gQHdvcmRSZWdFeHBcbiAgICAgICAgb3B0LnJlZ0V4cCA9IG5ldyBSZWdFeHAgXCIoXFxcXHMrfFtcXFxcdyN7b3B0LmluY2x1ZGV9XSt8W15cXFxcc10pXCIsICdnJyBpZiBvcHQ/LmluY2x1ZGU/Lmxlbmd0aFxuICAgICAgICByID0gW11cbiAgICAgICAgd2hpbGUgKG10Y2ggPSBvcHQucmVnRXhwLmV4ZWMoQGxpbmUobGkpKSkgIT0gbnVsbFxuICAgICAgICAgICAgci5wdXNoIFtsaSwgW210Y2guaW5kZXgsIG9wdC5yZWdFeHAubGFzdEluZGV4XV1cbiAgICAgICAgci5sZW5ndGggYW5kIHIgb3IgW1tsaSwgWzAsMF1dXVxuXG4gICAgcmVhbFdvcmRSYW5nZXNJbkxpbmVBdEluZGV4OiAobGksIG9wdD17fSkgLT5cblxuICAgICAgICByID0gW11cbiAgICAgICAgd2hpbGUgKG10Y2ggPSBAcmVhbFdvcmRSZWdFeHAuZXhlYyhAbGluZShsaSkpKSAhPSBudWxsXG4gICAgICAgICAgICByLnB1c2ggW2xpLCBbbXRjaC5pbmRleCwgQHJlYWxXb3JkUmVnRXhwLmxhc3RJbmRleF1dXG4gICAgICAgIHIubGVuZ3RoIGFuZCByIG9yIFtbbGksIFswLDBdXV1cblxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuXG4gICAgaGlnaGxpZ2h0c0luTGluZUluZGV4UmFuZ2VSZWxhdGl2ZVRvTGluZUluZGV4OiAobGluZUluZGV4UmFuZ2UsIHJlbEluZGV4KSAtPlxuXG4gICAgICAgIGhsID0gQGhpZ2hsaWdodHNJbkxpbmVJbmRleFJhbmdlIGxpbmVJbmRleFJhbmdlXG4gICAgICAgIGlmIGhsXG4gICAgICAgICAgICAoW3NbMF0tcmVsSW5kZXgsIFtzWzFdWzBdLCBzWzFdWzFdXSwgc1syXV0gZm9yIHMgaW4gaGwpXG5cbiAgICBoaWdobGlnaHRzSW5MaW5lSW5kZXhSYW5nZTogKGxpbmVJbmRleFJhbmdlKSAtPlxuXG4gICAgICAgIEBoaWdobGlnaHRzKCkuZmlsdGVyIChzKSAtPiBzWzBdID49IGxpbmVJbmRleFJhbmdlWzBdIGFuZCBzWzBdIDw9IGxpbmVJbmRleFJhbmdlWzFdXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBzZWxlY3Rpb25zSW5MaW5lSW5kZXhSYW5nZVJlbGF0aXZlVG9MaW5lSW5kZXg6IChsaW5lSW5kZXhSYW5nZSwgcmVsSW5kZXgpIC0+XG5cbiAgICAgICAgc2wgPSBAc2VsZWN0aW9uc0luTGluZUluZGV4UmFuZ2UgbGluZUluZGV4UmFuZ2VcbiAgICAgICAgaWYgc2xcbiAgICAgICAgICAgIChbc1swXS1yZWxJbmRleCwgW3NbMV1bMF0sIHNbMV1bMV1dXSBmb3IgcyBpbiBzbClcblxuICAgIHNlbGVjdGlvbnNJbkxpbmVJbmRleFJhbmdlOiAobGluZUluZGV4UmFuZ2UpIC0+XG5cbiAgICAgICAgQHNlbGVjdGlvbnMoKS5maWx0ZXIgKHMpIC0+IHNbMF0gPj0gbGluZUluZGV4UmFuZ2VbMF0gYW5kIHNbMF0gPD0gbGluZUluZGV4UmFuZ2VbMV1cblxuICAgIHNlbGVjdGVkTGluZUluZGljZXM6IC0+IF8udW5pcSAoc1swXSBmb3IgcyBpbiBAc2VsZWN0aW9ucygpKVxuICAgIGN1cnNvckxpbmVJbmRpY2VzOiAgIC0+IF8udW5pcSAoY1sxXSBmb3IgYyBpbiBAY3Vyc29ycygpKVxuXG4gICAgc2VsZWN0ZWRBbmRDdXJzb3JMaW5lSW5kaWNlczogLT5cblxuICAgICAgICBfLnVuaXEgQHNlbGVjdGVkTGluZUluZGljZXMoKS5jb25jYXQgQGN1cnNvckxpbmVJbmRpY2VzKClcblxuICAgIGNvbnRpbnVvdXNDdXJzb3JBbmRTZWxlY3RlZExpbmVJbmRleFJhbmdlczogLT5cblxuICAgICAgICBpbCA9IEBzZWxlY3RlZEFuZEN1cnNvckxpbmVJbmRpY2VzKClcbiAgICAgICAgY3NyID0gW11cbiAgICAgICAgaWYgaWwubGVuZ3RoXG4gICAgICAgICAgICBmb3IgbGkgaW4gaWxcbiAgICAgICAgICAgICAgICBpZiBjc3IubGVuZ3RoIGFuZCBfLmxhc3QoY3NyKVsxXSA9PSBsaS0xXG4gICAgICAgICAgICAgICAgICAgIF8ubGFzdChjc3IpWzFdID0gbGlcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGNzci5wdXNoIFtsaSxsaV1cbiAgICAgICAgY3NyXG5cbiAgICBpc1NlbGVjdGVkTGluZUF0SW5kZXg6IChsaSkgLT5cblxuICAgICAgICBpbCA9IEBzZWxlY3RlZExpbmVJbmRpY2VzKClcbiAgICAgICAgaWYgbGkgaW4gaWxcbiAgICAgICAgICAgIHMgPSBAc2VsZWN0aW9uKGlsLmluZGV4T2YgbGkpXG4gICAgICAgICAgICBpZiBzWzFdWzBdID09IDAgYW5kIHNbMV1bMV0gPT0gQGxpbmUobGkpLmxlbmd0aFxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGZhbHNlXG5cbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAgdGV4dDogICAgICAgICAgICAgICAgLT4gQHN0YXRlLnRleHQgQG5ld2xpbmVDaGFyYWN0ZXJzXG4gICAgdGV4dEluUmFuZ2U6ICAgKHJnKSAgLT4gQGxpbmUocmdbMF0pLnNsaWNlPyByZ1sxXVswXSwgcmdbMV1bMV1cbiAgICB0ZXh0c0luUmFuZ2VzOiAocmdzKSAtPiAoQHRleHRJblJhbmdlKHIpIGZvciByIGluIHJncylcbiAgICB0ZXh0SW5SYW5nZXM6ICAocmdzKSAtPiBAdGV4dHNJblJhbmdlcyhyZ3MpLmpvaW4gJ1xcbidcbiAgICB0ZXh0T2ZTZWxlY3Rpb246ICAgICAtPiBAdGV4dEluUmFuZ2VzIEBzZWxlY3Rpb25zKClcbiAgICB0ZXh0T2ZIaWdobGlnaHQ6ICAgICAtPiBAbnVtSGlnaGxpZ2h0cygpIGFuZCBAdGV4dEluUmFuZ2UoQGhpZ2hsaWdodCAwKSBvciAnJ1xuXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAgaW5kZW50YXRpb25BdExpbmVJbmRleDogKGxpKSAtPlxuXG4gICAgICAgIHJldHVybiAwIGlmIGxpID49IEBudW1MaW5lcygpXG4gICAgICAgIGxpbmUgPSBAbGluZSBsaVxuICAgICAgICB3aGlsZSBlbXB0eShsaW5lLnRyaW0oKSkgYW5kIGxpID4gMFxuICAgICAgICAgICAgbGktLVxuICAgICAgICAgICAgbGluZSA9IEBsaW5lIGxpXG4gICAgICAgIGluZGVudGF0aW9uSW5MaW5lIGxpbmVcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG4gICAgbGFzdFBvczogLT5cblxuICAgICAgICBsbGkgPSBAbnVtTGluZXMoKS0xXG4gICAgICAgIFtAbGluZShsbGkpLmxlbmd0aCwgbGxpXVxuXG4gICAgY3Vyc29yUG9zOiAtPiBAY2xhbXBQb3MgQG1haW5DdXJzb3IoKVxuXG4gICAgY2xhbXBQb3M6IChwKSAtPlxuXG4gICAgICAgIGlmIG5vdCBAbnVtTGluZXMoKSB0aGVuIHJldHVybiBbMCwtMV1cbiAgICAgICAgbCA9IGNsYW1wIDAsIEBudW1MaW5lcygpLTEsICBwWzFdXG4gICAgICAgIGMgPSBjbGFtcCAwLCBAbGluZShsKS5sZW5ndGgsIHBbMF1cbiAgICAgICAgWyBjLCBsIF1cblxuICAgIHdvcmRTdGFydFBvc0FmdGVyUG9zOiAocD1AY3Vyc29yUG9zKCkpIC0+XG5cbiAgICAgICAgcmV0dXJuIHAgaWYgcFswXSA8IEBsaW5lKHBbMV0pLmxlbmd0aCBhbmQgQGxpbmUocFsxXSlbcFswXV0gIT0gJyAnXG5cbiAgICAgICAgd2hpbGUgcFswXSA8IEBsaW5lKHBbMV0pLmxlbmd0aC0xXG4gICAgICAgICAgICByZXR1cm4gW3BbMF0rMSwgcFsxXV0gaWYgQGxpbmUocFsxXSlbcFswXSsxXSAhPSAnICdcbiAgICAgICAgICAgIHBbMF0gKz0gMVxuXG4gICAgICAgIGlmIHBbMV0gPCBAbnVtTGluZXMoKS0xXG4gICAgICAgICAgICBAd29yZFN0YXJ0UG9zQWZ0ZXJQb3MgWzAsIHBbMV0rMV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbnVsbFxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgcmFuZ2VGb3JMaW5lQXRJbmRleDogKGkpIC0+XG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciBcIkJ1ZmZlci5yYW5nZUZvckxpbmVBdEluZGV4IC0tIGluZGV4ICN7aX0gPj0gI3tAbnVtTGluZXMoKX1cIiBpZiBpID49IEBudW1MaW5lcygpXG4gICAgICAgIFtpLCBbMCwgQGxpbmUoaSkubGVuZ3RoXV1cblxuICAgIGlzUmFuZ2VJblN0cmluZzogKHIpIC0+IEByYW5nZU9mU3RyaW5nU3Vycm91bmRpbmdSYW5nZShyKT9cblxuICAgIHJhbmdlT2ZJbm5lclN0cmluZ1N1cnJvdW5kaW5nUmFuZ2U6IChyKSAtPlxuXG4gICAgICAgIHJncyA9IEByYW5nZXNPZlN0cmluZ3NJbkxpbmVBdEluZGV4IHJbMF1cbiAgICAgICAgcmdzID0gcmFuZ2VzU2hydW5rZW5CeSByZ3MsIDFcbiAgICAgICAgcmFuZ2VDb250YWluaW5nUmFuZ2VJblJhbmdlcyByLCByZ3NcblxuICAgIHJhbmdlT2ZTdHJpbmdTdXJyb3VuZGluZ1JhbmdlOiAocikgLT5cblxuICAgICAgICBpZiBpciA9IEByYW5nZU9mSW5uZXJTdHJpbmdTdXJyb3VuZGluZ1JhbmdlIHJcbiAgICAgICAgICAgIHJhbmdlR3Jvd25CeSBpciwgMVxuXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICBkaXN0YW5jZU9mV29yZDogKHcsIHBvcz1AY3Vyc29yUG9zKCkpIC0+XG5cbiAgICAgICAgcmV0dXJuIDAgaWYgQGxpbmUocG9zWzFdKS5pbmRleE9mKHcpID49IDBcbiAgICAgICAgZCA9IDFcbiAgICAgICAgbGIgPSBwb3NbMV0tZFxuICAgICAgICBsYSA9IHBvc1sxXStkXG4gICAgICAgIHdoaWxlIGxiID49IDAgb3IgbGEgPCBAbnVtTGluZXMoKVxuICAgICAgICAgICAgaWYgbGIgPj0gMFxuICAgICAgICAgICAgICAgIGlmIEBsaW5lKGxiKS5pbmRleE9mKHcpID49IDAgdGhlbiByZXR1cm4gZFxuICAgICAgICAgICAgaWYgbGEgPCBAbnVtTGluZXMoKVxuICAgICAgICAgICAgICAgIGlmIEBsaW5lKGxhKS5pbmRleE9mKHcpID49IDAgdGhlbiByZXR1cm4gZFxuICAgICAgICAgICAgZCsrXG4gICAgICAgICAgICBsYiA9IHBvc1sxXS1kXG4gICAgICAgICAgICBsYSA9IHBvc1sxXStkXG5cbiAgICAgICAgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIHJhbmdlc0ZvckN1cnNvckxpbmVzOiAoY3M9QGN1cnNvcnMoKSkgLT4gKEByYW5nZUZvckxpbmVBdEluZGV4IGNbMV0gZm9yIGMgaW4gY3MpXG4gICAgcmFuZ2VzRm9yQWxsTGluZXM6IC0+IEByYW5nZXNGb3JMaW5lc0Zyb21Ub3BUb0JvdCAwLCBAbnVtTGluZXMoKVxuXG4gICAgcmFuZ2VzRm9yTGluZXNCZXR3ZWVuUG9zaXRpb25zOiAoYSwgYiwgZXh0ZW5kPWZhbHNlKSAtPlxuICAgICAgICByID0gW11cbiAgICAgICAgW2EsYl0gPSBzb3J0UG9zaXRpb25zIFthLGJdXG4gICAgICAgIGlmIGFbMV0gPT0gYlsxXVxuICAgICAgICAgICAgci5wdXNoIFthWzFdLCBbYVswXSwgYlswXV1dXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHIucHVzaCBbYVsxXSwgW2FbMF0sIEBsaW5lKGFbMV0pLmxlbmd0aF1dXG4gICAgICAgICAgICBpZiBiWzFdIC0gYVsxXSA+IDFcbiAgICAgICAgICAgICAgICBmb3IgaSBpbiBbYVsxXSsxLi4uYlsxXV1cbiAgICAgICAgICAgICAgICAgICAgci5wdXNoIFtpLCBbMCxAbGluZShpKS5sZW5ndGhdXVxuICAgICAgICAgICAgci5wdXNoIFtiWzFdLCBbMCwgZXh0ZW5kIGFuZCBiWzBdID09IDAgYW5kIEBsaW5lKGJbMV0pLmxlbmd0aCBvciBiWzBdXV1cbiAgICAgICAgclxuXG4gICAgcmFuZ2VzRm9yTGluZXNGcm9tVG9wVG9Cb3Q6ICh0b3AsYm90KSAtPlxuICAgICAgICByID0gW11cbiAgICAgICAgaXIgPSBbdG9wLGJvdF1cbiAgICAgICAgZm9yIGxpIGluIFtzdGFydE9mKGlyKS4uLmVuZE9mKGlyKV1cbiAgICAgICAgICAgIHIucHVzaCBAcmFuZ2VGb3JMaW5lQXRJbmRleCBsaVxuICAgICAgICByXG5cbiAgICByYW5nZXNGb3JUZXh0OiAodCwgb3B0KSAtPlxuICAgICAgICB0ID0gdC5zcGxpdCgnXFxuJylbMF1cbiAgICAgICAgciA9IFtdXG4gICAgICAgIGZvciBsaSBpbiBbMC4uLkBudW1MaW5lcygpXVxuICAgICAgICAgICAgciA9IHIuY29uY2F0IEByYW5nZXNGb3JUZXh0SW5MaW5lQXRJbmRleCB0LCBsaSwgb3B0XG4gICAgICAgICAgICBicmVhayBpZiByLmxlbmd0aCA+PSAob3B0Py5tYXggPyA5OTkpXG4gICAgICAgIHJcblxuICAgIHJhbmdlc0ZvclRleHRJbkxpbmVBdEluZGV4OiAodCwgaSwgb3B0KSAtPlxuICAgICAgICByID0gW11cbiAgICAgICAgdHlwZSA9IG9wdD8udHlwZSA/ICdzdHInXG4gICAgICAgIHN3aXRjaCB0eXBlXG4gICAgICAgICAgICB3aGVuICdmdXp6eSdcbiAgICAgICAgICAgICAgICByZSA9IG5ldyBSZWdFeHAgXCJcXFxcdytcIiwgJ2cnXG4gICAgICAgICAgICAgICAgd2hpbGUgKG10Y2ggPSByZS5leGVjKEBsaW5lKGkpKSkgIT0gbnVsbFxuICAgICAgICAgICAgICAgICAgICByLnB1c2ggW2ksIFttdGNoLmluZGV4LCByZS5sYXN0SW5kZXhdXSBpZiBmdXp6eS50ZXN0IHQsIEBsaW5lKGkpLnNsaWNlIG10Y2guaW5kZXgsIHJlLmxhc3RJbmRleFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHQgPSBfLmVzY2FwZVJlZ0V4cCB0IGlmIHR5cGUgaW4gWydzdHInLCAnU3RyJywgJ2dsb2InXVxuICAgICAgICAgICAgICAgIGlmIHR5cGUgaXMgJ2dsb2InXG4gICAgICAgICAgICAgICAgICAgIHQgPSB0LnJlcGxhY2UgbmV3IFJlZ0V4cChcIlxcXFwqXCIsICdnJyksIFwiXFx3KlwiXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByIGlmIG5vdCB0Lmxlbmd0aFxuXG4gICAgICAgICAgICAgICAgcm5ncyA9IG1hdGNoci5yYW5nZXMgdCwgQGxpbmUoaSksIHR5cGUgaW4gWydzdHInLCAncmVnJywgJ2dsb2InXSBhbmQgJ2knIG9yICcnXG4gICAgICAgICAgICAgICAgZm9yIHJuZyBpbiBybmdzXG4gICAgICAgICAgICAgICAgICAgIHIucHVzaCBbaSwgW3JuZy5zdGFydCwgcm5nLnN0YXJ0ICsgcm5nLm1hdGNoLmxlbmd0aF1dXG4gICAgICAgIHJcblxuICAgIHJhbmdlc09mU3RyaW5nc0luTGluZUF0SW5kZXg6IChsaSkgLT4gIyB0b2RvOiBoYW5kbGUgI3t9XG4gICAgICAgIHQgPSBAbGluZShsaSlcbiAgICAgICAgciA9IFtdXG4gICAgICAgIHNzID0gLTFcbiAgICAgICAgY2MgPSBudWxsXG4gICAgICAgIGZvciBpIGluIFswLi4udC5sZW5ndGhdXG4gICAgICAgICAgICBjID0gdFtpXVxuICAgICAgICAgICAgaWYgbm90IGNjIGFuZCBjIGluIFwiJ1xcXCJcIlxuICAgICAgICAgICAgICAgIGNjID0gY1xuICAgICAgICAgICAgICAgIHNzID0gaVxuICAgICAgICAgICAgZWxzZSBpZiBjID09IGNjXG4gICAgICAgICAgICAgICAgaWYgKHRbaS0xXSAhPSAnXFxcXCcpIG9yIChpPjIgYW5kIHRbaS0yXSA9PSAnXFxcXCcpXG4gICAgICAgICAgICAgICAgICAgIHIucHVzaCBbbGksIFtzcywgaSsxXV1cbiAgICAgICAgICAgICAgICAgICAgY2MgPSBudWxsXG4gICAgICAgICAgICAgICAgICAgIHNzID0gLTFcbiAgICAgICAgclxuXG5tb2R1bGUuZXhwb3J0cyA9IEJ1ZmZlclxuIl19
//# sourceURL=../../coffee/editor/buffer.coffee