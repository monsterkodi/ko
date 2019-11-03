// koffee 1.4.0

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

ref = require('kxk'), matchr = ref.matchr, empty = ref.empty, clamp = ref.clamp, kerror = ref.kerror, _ = ref._;

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
        this.setState(new State({
            lines: lines
        }));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmZmVyLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxpRkFBQTtJQUFBOzs7OztBQVFBLE1BQXNDLE9BQUEsQ0FBUSxLQUFSLENBQXRDLEVBQUUsbUJBQUYsRUFBVSxpQkFBVixFQUFpQixpQkFBakIsRUFBd0IsbUJBQXhCLEVBQWdDOztBQUVoQyxLQUFBLEdBQVUsT0FBQSxDQUFRLFNBQVI7O0FBQ1YsS0FBQSxHQUFVLE9BQUEsQ0FBUSxPQUFSOztBQUNWLEtBQUEsR0FBVSxPQUFBLENBQVEsUUFBUjs7QUFFVixPQUFBLEdBQVUsU0FBQyxDQUFEO1dBQU8sQ0FBRSxDQUFBLENBQUE7QUFBVDs7QUFDVixLQUFBLEdBQVUsU0FBQyxDQUFEO1dBQU8sQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFPLElBQUksQ0FBQyxHQUFMLENBQVMsQ0FBVCxFQUFZLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBSyxDQUFFLENBQUEsQ0FBQSxDQUFuQjtBQUFkOztBQUVKOzs7SUFFQyxnQkFBQTs7Ozs7UUFDQyxzQ0FBQTtRQUNBLElBQUMsQ0FBQSxpQkFBRCxHQUFxQjtRQUNyQixJQUFDLENBQUEsVUFBRCxHQUFjLElBQUksTUFBSixDQUFXLG9CQUFYLEVBQWlDLEdBQWpDO1FBQ2QsSUFBQyxDQUFBLGNBQUQsR0FBa0IsSUFBSSxNQUFKLENBQVcsUUFBWCxFQUFxQixHQUFyQjtRQUNsQixJQUFDLENBQUEsUUFBRCxDQUFVLElBQUksS0FBSixDQUFBLENBQVY7SUFMRDs7cUJBT0gsUUFBQSxHQUFVLFNBQUMsS0FBRDtRQUNOLElBQUMsQ0FBQSxJQUFELENBQU0sVUFBTixFQUFrQixDQUFsQjtRQUNBLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBSSxLQUFKLENBQVU7WUFBQSxLQUFBLEVBQU0sS0FBTjtTQUFWLENBQVY7ZUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLFVBQU4sRUFBa0IsSUFB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RCxFQUFLLENBQUEsR0FBRSxDQUFQLENBQUwsQ0FBUDtvQkFDQSxFQUFBLEdBQUs7b0JBQ0wsRUFBQSxHQUFLLENBQUMsRUFIVjtpQkFEQzs7QUFMVDtlQVVBO0lBZjBCOzs7O0dBeFdiOztBQXlYckIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMCAgICAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IG1hdGNociwgZW1wdHksIGNsYW1wLCBrZXJyb3IsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuU3RhdGUgICA9IHJlcXVpcmUgJy4vc3RhdGUnXG5mdXp6eSAgID0gcmVxdWlyZSAnZnV6enknXG5ldmVudCAgID0gcmVxdWlyZSAnZXZlbnRzJ1xuXG5zdGFydE9mID0gKHIpIC0+IHJbMF1cbmVuZE9mICAgPSAocikgLT4gclswXSArIE1hdGgubWF4IDEsIHJbMV0tclswXVxuXG5jbGFzcyBCdWZmZXIgZXh0ZW5kcyBldmVudFxuXG4gICAgQDogLT5cbiAgICAgICAgc3VwZXIoKVxuICAgICAgICBAbmV3bGluZUNoYXJhY3RlcnMgPSAnXFxuJ1xuICAgICAgICBAd29yZFJlZ0V4cCA9IG5ldyBSZWdFeHAgXCIoXFxcXHMrfFxcXFx3K3xbXlxcXFxzXSlcIiwgJ2cnXG4gICAgICAgIEByZWFsV29yZFJlZ0V4cCA9IG5ldyBSZWdFeHAgXCIoXFxcXHcrKVwiLCAnZydcbiAgICAgICAgQHNldFN0YXRlIG5ldyBTdGF0ZSgpXG5cbiAgICBzZXRMaW5lczogKGxpbmVzKSAtPlxuICAgICAgICBAZW1pdCAnbnVtTGluZXMnLCAwICMgZ2l2ZSBsaXN0ZW5lcnMgYSBjaGFuY2UgdG8gY2xlYXIgdGhlaXIgc3R1ZmZcbiAgICAgICAgQHNldFN0YXRlIG5ldyBTdGF0ZSBsaW5lczpsaW5lc1xuICAgICAgICBAZW1pdCAnbnVtTGluZXMnLCBAbnVtTGluZXMoKVxuXG4gICAgc2V0U3RhdGU6IChzdGF0ZSkgLT4gQHN0YXRlID0gbmV3IFN0YXRlIHN0YXRlLnNcblxuICAgIG1haW5DdXJzb3I6ICAgIC0+IEBzdGF0ZS5tYWluQ3Vyc29yKClcbiAgICBsaW5lOiAgICAgIChpKSA9PiBAc3RhdGUubGluZSBpXG4gICAgdGFibGluZTogICAoaSkgLT4gQHN0YXRlLnRhYmxpbmUgaVxuICAgIGN1cnNvcjogICAgKGkpIC0+IEBzdGF0ZS5jdXJzb3IgaVxuICAgIGhpZ2hsaWdodDogKGkpIC0+IEBzdGF0ZS5oaWdobGlnaHQgaVxuICAgIHNlbGVjdGlvbjogKGkpIC0+IEBzdGF0ZS5zZWxlY3Rpb24gaVxuXG4gICAgbGluZXM6ICAgICAgICAgPT4gQHN0YXRlLmxpbmVzKClcbiAgICBjdXJzb3JzOiAgICAgICAtPiBAc3RhdGUuY3Vyc29ycygpXG4gICAgaGlnaGxpZ2h0czogICAgLT4gQHN0YXRlLmhpZ2hsaWdodHMoKVxuICAgIHNlbGVjdGlvbnM6ICAgIC0+IEBzdGF0ZS5zZWxlY3Rpb25zKClcblxuICAgIG51bUxpbmVzOiAgICAgIC0+IEBzdGF0ZS5udW1MaW5lcygpXG4gICAgbnVtQ3Vyc29yczogICAgLT4gQHN0YXRlLm51bUN1cnNvcnMoKVxuICAgIG51bVNlbGVjdGlvbnM6IC0+IEBzdGF0ZS5udW1TZWxlY3Rpb25zKClcbiAgICBudW1IaWdobGlnaHRzOiAtPiBAc3RhdGUubnVtSGlnaGxpZ2h0cygpXG5cbiAgICAjIHRoZXNlIGFyZSB1c2VkIGZyb20gdGVzdHMgYW5kIHJlc3RvcmVcbiAgICBzZXRDdXJzb3JzOiAgICAoYykgLT4gQHN0YXRlID0gQHN0YXRlLnNldEN1cnNvcnMgICAgY1xuICAgIHNldFNlbGVjdGlvbnM6IChzKSAtPiBAc3RhdGUgPSBAc3RhdGUuc2V0U2VsZWN0aW9ucyBzXG4gICAgc2V0SGlnaGxpZ2h0czogKGgpIC0+IEBzdGF0ZSA9IEBzdGF0ZS5zZXRIaWdobGlnaHRzIGhcbiAgICBzZXRNYWluOiAgICAgICAobSkgLT4gQHN0YXRlID0gQHN0YXRlLnNldE1haW4gICAgICAgbVxuICAgIGFkZEhpZ2hsaWdodDogIChoKSAtPiBAc3RhdGUgPSBAc3RhdGUuYWRkSGlnaGxpZ2h0ICBoXG5cbiAgICBzZWxlY3Q6IChzKSAtPlxuXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5zZWxlY3Qgc1xuICAgICAgICBAZG8uZW5kKClcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgaXNDdXJzb3JWaXJ0dWFsOiAgICAgICAoYz1AbWFpbkN1cnNvcigpKSAtPiBAbnVtTGluZXMoKSBhbmQgY1sxXSA8IEBudW1MaW5lcygpIGFuZCBjWzBdID4gQGxpbmUoY1sxXSkubGVuZ3RoXG4gICAgaXNDdXJzb3JBdEVuZE9mTGluZTogICAoYz1AbWFpbkN1cnNvcigpKSAtPiBAbnVtTGluZXMoKSBhbmQgY1sxXSA8IEBudW1MaW5lcygpIGFuZCBjWzBdID49IEBsaW5lKGNbMV0pLmxlbmd0aFxuICAgIGlzQ3Vyc29yQXRTdGFydE9mTGluZTogKGM9QG1haW5DdXJzb3IoKSkgLT4gY1swXSA9PSAwXG4gICAgaXNDdXJzb3JJbkluZGVudDogICAgICAoYz1AbWFpbkN1cnNvcigpKSAtPiBAbnVtTGluZXMoKSBhbmQgQGxpbmUoY1sxXSkuc2xpY2UoMCwgY1swXSkudHJpbSgpLmxlbmd0aCA9PSAwIGFuZCBAbGluZShjWzFdKS5zbGljZShjWzBdKS50cmltKCkubGVuZ3RoXG4gICAgaXNDdXJzb3JJbkxhc3RMaW5lOiAgICAoYz1AbWFpbkN1cnNvcigpKSAtPiBjWzFdID09IEBudW1MaW5lcygpLTFcbiAgICBpc0N1cnNvckluRmlyc3RMaW5lOiAgIChjPUBtYWluQ3Vyc29yKCkpIC0+IGNbMV0gPT0gMFxuICAgIGlzQ3Vyc29ySW5SYW5nZTogICAgICAgKHIsYz1AbWFpbkN1cnNvcigpKSAtPiBpc1Bvc0luUmFuZ2UgYywgclxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICB3b3JkQXRDdXJzb3I6IC0+IEB3b3JkQXRQb3MgQG1haW5DdXJzb3IoKVxuICAgIHdvcmRBdFBvczogKGMpIC0+IEB0ZXh0SW5SYW5nZSBAcmFuZ2VGb3JSZWFsV29yZEF0UG9zIGNcbiAgICB3b3Jkc0F0Q3Vyc29yczogKGNzPUBjdXJzb3JzKCksIG9wdCkgLT4gKEB0ZXh0SW5SYW5nZSByIGZvciByIGluIEByYW5nZXNGb3JXb3Jkc0F0Q3Vyc29ycyBjcywgb3B0KVxuXG4gICAgcmFuZ2VzRm9yV29yZHNBdEN1cnNvcnM6IChjcz1AY3Vyc29ycygpLCBvcHQpIC0+XG4gICAgICAgIHJuZ3MgPSAoQHJhbmdlRm9yV29yZEF0UG9zKGMsIG9wdCkgZm9yIGMgaW4gY3MpXG4gICAgICAgIHJuZ3MgPSBjbGVhblJhbmdlcyBybmdzXG5cbiAgICBzZWxlY3Rpb25UZXh0T3JXb3JkQXRDdXJzb3I6ICgpIC0+XG5cbiAgICAgICAgaWYgQG51bVNlbGVjdGlvbnMoKSA9PSAxXG4gICAgICAgICAgICBAdGV4dEluUmFuZ2UgQHNlbGVjdGlvbiAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB3b3JkQXRDdXJzb3IoKVxuXG4gICAgcmFuZ2VGb3JXb3JkQXRQb3M6IChwb3MsIG9wdCkgLT5cblxuICAgICAgICBwID0gQGNsYW1wUG9zIHBvc1xuICAgICAgICB3ciA9IEB3b3JkUmFuZ2VzSW5MaW5lQXRJbmRleCBwWzFdLCBvcHRcbiAgICAgICAgciA9IHJhbmdlQXRQb3NJblJhbmdlcyBwLCB3clxuICAgICAgICByXG5cbiAgICByYW5nZUZvclJlYWxXb3JkQXRQb3M6IChwb3MsIG9wdCkgLT5cblxuICAgICAgICBwID0gQGNsYW1wUG9zIHBvc1xuICAgICAgICB3ciA9IEByZWFsV29yZFJhbmdlc0luTGluZUF0SW5kZXggcFsxXSwgb3B0XG5cbiAgICAgICAgciA9IHJhbmdlQXRQb3NJblJhbmdlcyBwLCB3clxuICAgICAgICBpZiBub3Qgcj8gb3IgZW1wdHkgQHRleHRJblJhbmdlKHIpLnRyaW0oKVxuICAgICAgICAgICAgciA9IHJhbmdlQmVmb3JlUG9zSW5SYW5nZXMgcCwgd3JcbiAgICAgICAgaWYgbm90IHI/IG9yIGVtcHR5IEB0ZXh0SW5SYW5nZShyKS50cmltKClcbiAgICAgICAgICAgIHIgPSByYW5nZUFmdGVyUG9zSW5SYW5nZXMgcCwgd3JcbiAgICAgICAgciA/PSByYW5nZUZvclBvcyBwXG4gICAgICAgIHJcblxuICAgIGVuZE9mV29yZEF0UG9zOiAoYykgPT5cblxuICAgICAgICByID0gQHJhbmdlRm9yV29yZEF0UG9zIGNcbiAgICAgICAgaWYgQGlzQ3Vyc29yQXRFbmRPZkxpbmUgY1xuICAgICAgICAgICAgcmV0dXJuIGMgaWYgQGlzQ3Vyc29ySW5MYXN0TGluZSBjXG4gICAgICAgICAgICByID0gQHJhbmdlRm9yV29yZEF0UG9zIFswLCBjWzFdKzFdXG4gICAgICAgIFtyWzFdWzFdLCByWzBdXVxuXG4gICAgc3RhcnRPZldvcmRBdFBvczogKGMpID0+XG5cbiAgICAgICAgaWYgQGlzQ3Vyc29yQXRTdGFydE9mTGluZSBjXG4gICAgICAgICAgICByZXR1cm4gYyBpZiBAaXNDdXJzb3JJbkZpcnN0TGluZSBjXG4gICAgICAgICAgICByID0gQHJhbmdlRm9yV29yZEF0UG9zIFtAbGluZShjWzFdLTEpLmxlbmd0aCwgY1sxXS0xXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByID0gQHJhbmdlRm9yV29yZEF0UG9zIGNcbiAgICAgICAgICAgIGlmIHJbMV1bMF0gPT0gY1swXVxuICAgICAgICAgICAgICAgIHIgPSBAcmFuZ2VGb3JXb3JkQXRQb3MgW2NbMF0tMSwgY1sxXV1cbiAgICAgICAgW3JbMV1bMF0sIHJbMF1dXG5cbiAgICB3b3JkUmFuZ2VzSW5MaW5lQXRJbmRleDogKGxpLCBvcHQ9e30pIC0+XG5cbiAgICAgICAgb3B0LnJlZ0V4cCA/PSBAd29yZFJlZ0V4cFxuICAgICAgICBvcHQucmVnRXhwID0gbmV3IFJlZ0V4cCBcIihcXFxccyt8W1xcXFx3I3tvcHQuaW5jbHVkZX1dK3xbXlxcXFxzXSlcIiwgJ2cnIGlmIG9wdD8uaW5jbHVkZT8ubGVuZ3RoXG4gICAgICAgIHIgPSBbXVxuICAgICAgICB3aGlsZSAobXRjaCA9IG9wdC5yZWdFeHAuZXhlYyhAbGluZShsaSkpKSAhPSBudWxsXG4gICAgICAgICAgICByLnB1c2ggW2xpLCBbbXRjaC5pbmRleCwgb3B0LnJlZ0V4cC5sYXN0SW5kZXhdXVxuICAgICAgICByLmxlbmd0aCBhbmQgciBvciBbW2xpLCBbMCwwXV1dXG5cbiAgICByZWFsV29yZFJhbmdlc0luTGluZUF0SW5kZXg6IChsaSwgb3B0PXt9KSAtPlxuXG4gICAgICAgIHIgPSBbXVxuICAgICAgICB3aGlsZSAobXRjaCA9IEByZWFsV29yZFJlZ0V4cC5leGVjKEBsaW5lKGxpKSkpICE9IG51bGxcbiAgICAgICAgICAgIHIucHVzaCBbbGksIFttdGNoLmluZGV4LCBAcmVhbFdvcmRSZWdFeHAubGFzdEluZGV4XV1cbiAgICAgICAgci5sZW5ndGggYW5kIHIgb3IgW1tsaSwgWzAsMF1dXVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG5cbiAgICBoaWdobGlnaHRzSW5MaW5lSW5kZXhSYW5nZVJlbGF0aXZlVG9MaW5lSW5kZXg6IChsaW5lSW5kZXhSYW5nZSwgcmVsSW5kZXgpIC0+XG5cbiAgICAgICAgaGwgPSBAaGlnaGxpZ2h0c0luTGluZUluZGV4UmFuZ2UgbGluZUluZGV4UmFuZ2VcbiAgICAgICAgaWYgaGxcbiAgICAgICAgICAgIChbc1swXS1yZWxJbmRleCwgW3NbMV1bMF0sIHNbMV1bMV1dLCBzWzJdXSBmb3IgcyBpbiBobClcblxuICAgIGhpZ2hsaWdodHNJbkxpbmVJbmRleFJhbmdlOiAobGluZUluZGV4UmFuZ2UpIC0+XG5cbiAgICAgICAgQGhpZ2hsaWdodHMoKS5maWx0ZXIgKHMpIC0+IHNbMF0gPj0gbGluZUluZGV4UmFuZ2VbMF0gYW5kIHNbMF0gPD0gbGluZUluZGV4UmFuZ2VbMV1cblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIHNlbGVjdGlvbnNJbkxpbmVJbmRleFJhbmdlUmVsYXRpdmVUb0xpbmVJbmRleDogKGxpbmVJbmRleFJhbmdlLCByZWxJbmRleCkgLT5cblxuICAgICAgICBzbCA9IEBzZWxlY3Rpb25zSW5MaW5lSW5kZXhSYW5nZSBsaW5lSW5kZXhSYW5nZVxuICAgICAgICBpZiBzbFxuICAgICAgICAgICAgKFtzWzBdLXJlbEluZGV4LCBbc1sxXVswXSwgc1sxXVsxXV1dIGZvciBzIGluIHNsKVxuXG4gICAgc2VsZWN0aW9uc0luTGluZUluZGV4UmFuZ2U6IChsaW5lSW5kZXhSYW5nZSkgLT5cblxuICAgICAgICBAc2VsZWN0aW9ucygpLmZpbHRlciAocykgLT4gc1swXSA+PSBsaW5lSW5kZXhSYW5nZVswXSBhbmQgc1swXSA8PSBsaW5lSW5kZXhSYW5nZVsxXVxuXG4gICAgc2VsZWN0ZWRMaW5lSW5kaWNlczogLT4gXy51bmlxIChzWzBdIGZvciBzIGluIEBzZWxlY3Rpb25zKCkpXG4gICAgY3Vyc29yTGluZUluZGljZXM6ICAgLT4gXy51bmlxIChjWzFdIGZvciBjIGluIEBjdXJzb3JzKCkpXG5cbiAgICBzZWxlY3RlZEFuZEN1cnNvckxpbmVJbmRpY2VzOiAtPlxuXG4gICAgICAgIF8udW5pcSBAc2VsZWN0ZWRMaW5lSW5kaWNlcygpLmNvbmNhdCBAY3Vyc29yTGluZUluZGljZXMoKVxuXG4gICAgY29udGludW91c0N1cnNvckFuZFNlbGVjdGVkTGluZUluZGV4UmFuZ2VzOiAtPlxuXG4gICAgICAgIGlsID0gQHNlbGVjdGVkQW5kQ3Vyc29yTGluZUluZGljZXMoKVxuICAgICAgICBjc3IgPSBbXVxuICAgICAgICBpZiBpbC5sZW5ndGhcbiAgICAgICAgICAgIGZvciBsaSBpbiBpbFxuICAgICAgICAgICAgICAgIGlmIGNzci5sZW5ndGggYW5kIF8ubGFzdChjc3IpWzFdID09IGxpLTFcbiAgICAgICAgICAgICAgICAgICAgXy5sYXN0KGNzcilbMV0gPSBsaVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgY3NyLnB1c2ggW2xpLGxpXVxuICAgICAgICBjc3JcblxuICAgIGlzU2VsZWN0ZWRMaW5lQXRJbmRleDogKGxpKSAtPlxuXG4gICAgICAgIGlsID0gQHNlbGVjdGVkTGluZUluZGljZXMoKVxuICAgICAgICBpZiBsaSBpbiBpbFxuICAgICAgICAgICAgcyA9IEBzZWxlY3Rpb24oaWwuaW5kZXhPZiBsaSlcbiAgICAgICAgICAgIGlmIHNbMV1bMF0gPT0gMCBhbmQgc1sxXVsxXSA9PSBAbGluZShsaSkubGVuZ3RoXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZmFsc2VcblxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgIDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbiAgICB0ZXh0OiAgICAgICAgICAgICAgICAtPiBAc3RhdGUudGV4dCBAbmV3bGluZUNoYXJhY3RlcnNcbiAgICB0ZXh0SW5SYW5nZTogICAocmcpICAtPiBAbGluZShyZ1swXSkuc2xpY2U/IHJnWzFdWzBdLCByZ1sxXVsxXVxuICAgIHRleHRzSW5SYW5nZXM6IChyZ3MpIC0+IChAdGV4dEluUmFuZ2UocikgZm9yIHIgaW4gcmdzKVxuICAgIHRleHRJblJhbmdlczogIChyZ3MpIC0+IEB0ZXh0c0luUmFuZ2VzKHJncykuam9pbiAnXFxuJ1xuICAgIHRleHRPZlNlbGVjdGlvbjogICAgIC0+IEB0ZXh0SW5SYW5nZXMgQHNlbGVjdGlvbnMoKVxuICAgIHRleHRPZkhpZ2hsaWdodDogICAgIC0+IEBudW1IaWdobGlnaHRzKCkgYW5kIEB0ZXh0SW5SYW5nZShAaGlnaGxpZ2h0IDApIG9yICcnXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbiAgICBpbmRlbnRhdGlvbkF0TGluZUluZGV4OiAobGkpIC0+XG5cbiAgICAgICAgcmV0dXJuIDAgaWYgbGkgPj0gQG51bUxpbmVzKClcbiAgICAgICAgbGluZSA9IEBsaW5lIGxpXG4gICAgICAgIHdoaWxlIGVtcHR5KGxpbmUudHJpbSgpKSBhbmQgbGkgPiAwXG4gICAgICAgICAgICBsaS0tXG4gICAgICAgICAgICBsaW5lID0gQGxpbmUgbGlcbiAgICAgICAgaW5kZW50YXRpb25JbkxpbmUgbGluZVxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbiAgICBsYXN0UG9zOiAtPlxuXG4gICAgICAgIGxsaSA9IEBudW1MaW5lcygpLTFcbiAgICAgICAgW0BsaW5lKGxsaSkubGVuZ3RoLCBsbGldXG5cbiAgICBjdXJzb3JQb3M6IC0+IEBjbGFtcFBvcyBAbWFpbkN1cnNvcigpXG5cbiAgICBjbGFtcFBvczogKHApIC0+XG5cbiAgICAgICAgaWYgbm90IEBudW1MaW5lcygpIHRoZW4gcmV0dXJuIFswLC0xXVxuICAgICAgICBsID0gY2xhbXAgMCwgQG51bUxpbmVzKCktMSwgIHBbMV1cbiAgICAgICAgYyA9IGNsYW1wIDAsIEBsaW5lKGwpLmxlbmd0aCwgcFswXVxuICAgICAgICBbIGMsIGwgXVxuXG4gICAgd29yZFN0YXJ0UG9zQWZ0ZXJQb3M6IChwPUBjdXJzb3JQb3MoKSkgLT5cblxuICAgICAgICByZXR1cm4gcCBpZiBwWzBdIDwgQGxpbmUocFsxXSkubGVuZ3RoIGFuZCBAbGluZShwWzFdKVtwWzBdXSAhPSAnICdcblxuICAgICAgICB3aGlsZSBwWzBdIDwgQGxpbmUocFsxXSkubGVuZ3RoLTFcbiAgICAgICAgICAgIHJldHVybiBbcFswXSsxLCBwWzFdXSBpZiBAbGluZShwWzFdKVtwWzBdKzFdICE9ICcgJ1xuICAgICAgICAgICAgcFswXSArPSAxXG5cbiAgICAgICAgaWYgcFsxXSA8IEBudW1MaW5lcygpLTFcbiAgICAgICAgICAgIEB3b3JkU3RhcnRQb3NBZnRlclBvcyBbMCwgcFsxXSsxXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBudWxsXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICByYW5nZUZvckxpbmVBdEluZGV4OiAoaSkgLT5cblxuICAgICAgICByZXR1cm4ga2Vycm9yIFwiQnVmZmVyLnJhbmdlRm9yTGluZUF0SW5kZXggLS0gaW5kZXggI3tpfSA+PSAje0BudW1MaW5lcygpfVwiIGlmIGkgPj0gQG51bUxpbmVzKClcbiAgICAgICAgW2ksIFswLCBAbGluZShpKS5sZW5ndGhdXVxuXG4gICAgaXNSYW5nZUluU3RyaW5nOiAocikgLT4gQHJhbmdlT2ZTdHJpbmdTdXJyb3VuZGluZ1JhbmdlKHIpP1xuXG4gICAgcmFuZ2VPZklubmVyU3RyaW5nU3Vycm91bmRpbmdSYW5nZTogKHIpIC0+XG5cbiAgICAgICAgcmdzID0gQHJhbmdlc09mU3RyaW5nc0luTGluZUF0SW5kZXggclswXVxuICAgICAgICByZ3MgPSByYW5nZXNTaHJ1bmtlbkJ5IHJncywgMVxuICAgICAgICByYW5nZUNvbnRhaW5pbmdSYW5nZUluUmFuZ2VzIHIsIHJnc1xuXG4gICAgcmFuZ2VPZlN0cmluZ1N1cnJvdW5kaW5nUmFuZ2U6IChyKSAtPlxuXG4gICAgICAgIGlmIGlyID0gQHJhbmdlT2ZJbm5lclN0cmluZ1N1cnJvdW5kaW5nUmFuZ2UgclxuICAgICAgICAgICAgcmFuZ2VHcm93bkJ5IGlyLCAxXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIGRpc3RhbmNlT2ZXb3JkOiAodywgcG9zPUBjdXJzb3JQb3MoKSkgLT5cblxuICAgICAgICByZXR1cm4gMCBpZiBAbGluZShwb3NbMV0pLmluZGV4T2YodykgPj0gMFxuICAgICAgICBkID0gMVxuICAgICAgICBsYiA9IHBvc1sxXS1kXG4gICAgICAgIGxhID0gcG9zWzFdK2RcbiAgICAgICAgd2hpbGUgbGIgPj0gMCBvciBsYSA8IEBudW1MaW5lcygpXG4gICAgICAgICAgICBpZiBsYiA+PSAwXG4gICAgICAgICAgICAgICAgaWYgQGxpbmUobGIpLmluZGV4T2YodykgPj0gMCB0aGVuIHJldHVybiBkXG4gICAgICAgICAgICBpZiBsYSA8IEBudW1MaW5lcygpXG4gICAgICAgICAgICAgICAgaWYgQGxpbmUobGEpLmluZGV4T2YodykgPj0gMCB0aGVuIHJldHVybiBkXG4gICAgICAgICAgICBkKytcbiAgICAgICAgICAgIGxiID0gcG9zWzFdLWRcbiAgICAgICAgICAgIGxhID0gcG9zWzFdK2RcblxuICAgICAgICBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUlxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgcmFuZ2VzRm9yQ3Vyc29yTGluZXM6IChjcz1AY3Vyc29ycygpKSAtPiAoQHJhbmdlRm9yTGluZUF0SW5kZXggY1sxXSBmb3IgYyBpbiBjcylcbiAgICByYW5nZXNGb3JBbGxMaW5lczogLT4gQHJhbmdlc0ZvckxpbmVzRnJvbVRvcFRvQm90IDAsIEBudW1MaW5lcygpXG5cbiAgICByYW5nZXNGb3JMaW5lc0JldHdlZW5Qb3NpdGlvbnM6IChhLCBiLCBleHRlbmQ9ZmFsc2UpIC0+XG4gICAgICAgIHIgPSBbXVxuICAgICAgICBbYSxiXSA9IHNvcnRQb3NpdGlvbnMgW2EsYl1cbiAgICAgICAgaWYgYVsxXSA9PSBiWzFdXG4gICAgICAgICAgICByLnB1c2ggW2FbMV0sIFthWzBdLCBiWzBdXV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgci5wdXNoIFthWzFdLCBbYVswXSwgQGxpbmUoYVsxXSkubGVuZ3RoXV1cbiAgICAgICAgICAgIGlmIGJbMV0gLSBhWzFdID4gMVxuICAgICAgICAgICAgICAgIGZvciBpIGluIFthWzFdKzEuLi5iWzFdXVxuICAgICAgICAgICAgICAgICAgICByLnB1c2ggW2ksIFswLEBsaW5lKGkpLmxlbmd0aF1dXG4gICAgICAgICAgICByLnB1c2ggW2JbMV0sIFswLCBleHRlbmQgYW5kIGJbMF0gPT0gMCBhbmQgQGxpbmUoYlsxXSkubGVuZ3RoIG9yIGJbMF1dXVxuICAgICAgICByXG5cbiAgICByYW5nZXNGb3JMaW5lc0Zyb21Ub3BUb0JvdDogKHRvcCxib3QpIC0+XG4gICAgICAgIHIgPSBbXVxuICAgICAgICBpciA9IFt0b3AsYm90XVxuICAgICAgICBmb3IgbGkgaW4gW3N0YXJ0T2YoaXIpLi4uZW5kT2YoaXIpXVxuICAgICAgICAgICAgci5wdXNoIEByYW5nZUZvckxpbmVBdEluZGV4IGxpXG4gICAgICAgIHJcblxuICAgIHJhbmdlc0ZvclRleHQ6ICh0LCBvcHQpIC0+XG4gICAgICAgIHQgPSB0LnNwbGl0KCdcXG4nKVswXVxuICAgICAgICByID0gW11cbiAgICAgICAgZm9yIGxpIGluIFswLi4uQG51bUxpbmVzKCldXG4gICAgICAgICAgICByID0gci5jb25jYXQgQHJhbmdlc0ZvclRleHRJbkxpbmVBdEluZGV4IHQsIGxpLCBvcHRcbiAgICAgICAgICAgIGJyZWFrIGlmIHIubGVuZ3RoID49IChvcHQ/Lm1heCA/IDk5OSlcbiAgICAgICAgclxuXG4gICAgcmFuZ2VzRm9yVGV4dEluTGluZUF0SW5kZXg6ICh0LCBpLCBvcHQpIC0+XG4gICAgICAgIHIgPSBbXVxuICAgICAgICB0eXBlID0gb3B0Py50eXBlID8gJ3N0cidcbiAgICAgICAgc3dpdGNoIHR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2Z1enp5J1xuICAgICAgICAgICAgICAgIHJlID0gbmV3IFJlZ0V4cCBcIlxcXFx3K1wiLCAnZydcbiAgICAgICAgICAgICAgICB3aGlsZSAobXRjaCA9IHJlLmV4ZWMoQGxpbmUoaSkpKSAhPSBudWxsXG4gICAgICAgICAgICAgICAgICAgIHIucHVzaCBbaSwgW210Y2guaW5kZXgsIHJlLmxhc3RJbmRleF1dIGlmIGZ1enp5LnRlc3QgdCwgQGxpbmUoaSkuc2xpY2UgbXRjaC5pbmRleCwgcmUubGFzdEluZGV4XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdCA9IF8uZXNjYXBlUmVnRXhwIHQgaWYgdHlwZSBpbiBbJ3N0cicsICdTdHInLCAnZ2xvYiddXG4gICAgICAgICAgICAgICAgaWYgdHlwZSBpcyAnZ2xvYidcbiAgICAgICAgICAgICAgICAgICAgdCA9IHQucmVwbGFjZSBuZXcgUmVnRXhwKFwiXFxcXCpcIiwgJ2cnKSwgXCJcXHcqXCJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHIgaWYgbm90IHQubGVuZ3RoXG5cbiAgICAgICAgICAgICAgICBybmdzID0gbWF0Y2hyLnJhbmdlcyB0LCBAbGluZShpKSwgdHlwZSBpbiBbJ3N0cicsICdyZWcnLCAnZ2xvYiddIGFuZCAnaScgb3IgJydcbiAgICAgICAgICAgICAgICBmb3Igcm5nIGluIHJuZ3NcbiAgICAgICAgICAgICAgICAgICAgci5wdXNoIFtpLCBbcm5nLnN0YXJ0LCBybmcuc3RhcnQgKyBybmcubWF0Y2gubGVuZ3RoXV1cbiAgICAgICAgclxuXG4gICAgcmFuZ2VzT2ZTdHJpbmdzSW5MaW5lQXRJbmRleDogKGxpKSAtPiAjIHRvZG86IGhhbmRsZSAje31cbiAgICAgICAgdCA9IEBsaW5lKGxpKVxuICAgICAgICByID0gW11cbiAgICAgICAgc3MgPSAtMVxuICAgICAgICBjYyA9IG51bGxcbiAgICAgICAgZm9yIGkgaW4gWzAuLi50Lmxlbmd0aF1cbiAgICAgICAgICAgIGMgPSB0W2ldXG4gICAgICAgICAgICBpZiBub3QgY2MgYW5kIGMgaW4gXCInXFxcIlwiXG4gICAgICAgICAgICAgICAgY2MgPSBjXG4gICAgICAgICAgICAgICAgc3MgPSBpXG4gICAgICAgICAgICBlbHNlIGlmIGMgPT0gY2NcbiAgICAgICAgICAgICAgICBpZiAodFtpLTFdICE9ICdcXFxcJykgb3IgKGk+MiBhbmQgdFtpLTJdID09ICdcXFxcJylcbiAgICAgICAgICAgICAgICAgICAgci5wdXNoIFtsaSwgW3NzLCBpKzFdXVxuICAgICAgICAgICAgICAgICAgICBjYyA9IG51bGxcbiAgICAgICAgICAgICAgICAgICAgc3MgPSAtMVxuICAgICAgICByXG5cbm1vZHVsZS5leHBvcnRzID0gQnVmZmVyXG4iXX0=
//# sourceURL=../../coffee/editor/buffer.coffee