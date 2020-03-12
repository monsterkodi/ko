// koffee 1.12.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmZmVyLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9lZGl0b3IiLCJzb3VyY2VzIjpbImJ1ZmZlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsaUZBQUE7SUFBQTs7Ozs7QUFRQSxNQUFzQyxPQUFBLENBQVEsS0FBUixDQUF0QyxFQUFFLFNBQUYsRUFBSyxpQkFBTCxFQUFZLGlCQUFaLEVBQW1CLG1CQUFuQixFQUEyQjs7QUFFM0IsS0FBQSxHQUFVLE9BQUEsQ0FBUSxTQUFSOztBQUNWLEtBQUEsR0FBVSxPQUFBLENBQVEsT0FBUjs7QUFDVixLQUFBLEdBQVUsT0FBQSxDQUFRLFFBQVI7O0FBRVYsT0FBQSxHQUFVLFNBQUMsQ0FBRDtXQUFPLENBQUUsQ0FBQSxDQUFBO0FBQVQ7O0FBQ1YsS0FBQSxHQUFVLFNBQUMsQ0FBRDtXQUFPLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBTyxJQUFJLENBQUMsR0FBTCxDQUFTLENBQVQsRUFBWSxDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQUssQ0FBRSxDQUFBLENBQUEsQ0FBbkI7QUFBZDs7QUFFSjs7O0lBRUMsZ0JBQUE7Ozs7O1FBRUMsc0NBQUE7UUFDQSxJQUFDLENBQUEsaUJBQUQsR0FBcUI7UUFDckIsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFJLE1BQUosQ0FBVyxvQkFBWCxFQUFpQyxHQUFqQztRQUNkLElBQUMsQ0FBQSxjQUFELEdBQWtCLElBQUksTUFBSixDQUFXLFFBQVgsRUFBcUIsR0FBckI7UUFDbEIsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFJLEtBQUosQ0FBQSxDQUFWO0lBTkQ7O3FCQVFILFFBQUEsR0FBVSxTQUFDLEtBQUQ7UUFDTixJQUFDLENBQUEsSUFBRCxDQUFNLFVBQU4sRUFBaUIsQ0FBakI7UUFDQSxJQUFDLENBQUEsS0FBRCxHQUFTLElBQUksS0FBSixDQUFVO1lBQUEsS0FBQSxFQUFNLEtBQU47U0FBVjtlQUNULElBQUMsQ0FBQSxJ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Q0FBQyxFQUFELEVBQUssQ0FBQyxFQUFELEVBQUssQ0FBQSxHQUFFLENBQVAsQ0FBTCxDQUFQO29CQUNBLEVBQUEsR0FBSztvQkFDTCxFQUFBLEdBQUssQ0FBQyxFQUhWO2lCQURDOztBQUxUO2VBVUE7SUFmMEI7Ozs7R0EzV2I7O0FBNFhyQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwICAgIDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgXywgY2xhbXAsIGVtcHR5LCBrZXJyb3IsIG1hdGNociB9ID0gcmVxdWlyZSAna3hrJ1xuXG5TdGF0ZSAgID0gcmVxdWlyZSAnLi9zdGF0ZSdcbmZ1enp5ICAgPSByZXF1aXJlICdmdXp6eSdcbmV2ZW50ICAgPSByZXF1aXJlICdldmVudHMnXG5cbnN0YXJ0T2YgPSAocikgLT4gclswXVxuZW5kT2YgICA9IChyKSAtPiByWzBdICsgTWF0aC5tYXggMSwgclsxXS1yWzBdXG5cbmNsYXNzIEJ1ZmZlciBleHRlbmRzIGV2ZW50XG5cbiAgICBAOiAtPlxuICAgICAgICBcbiAgICAgICAgc3VwZXIoKVxuICAgICAgICBAbmV3bGluZUNoYXJhY3RlcnMgPSAnXFxuJ1xuICAgICAgICBAd29yZFJlZ0V4cCA9IG5ldyBSZWdFeHAgXCIoXFxcXHMrfFxcXFx3K3xbXlxcXFxzXSlcIiwgJ2cnXG4gICAgICAgIEByZWFsV29yZFJlZ0V4cCA9IG5ldyBSZWdFeHAgXCIoXFxcXHcrKVwiLCAnZydcbiAgICAgICAgQHNldFN0YXRlIG5ldyBTdGF0ZSgpXG5cbiAgICBzZXRMaW5lczogKGxpbmVzKSAtPlxuICAgICAgICBAZW1pdCAnbnVtTGluZXMnIDAgIyBnaXZlIGxpc3RlbmVycyBhIGNoYW5jZSB0byBjbGVhciB0aGVpciBzdHVmZlxuICAgICAgICBAc3RhdGUgPSBuZXcgU3RhdGUgbGluZXM6bGluZXNcbiAgICAgICAgQGVtaXQgJ251bUxpbmVzJyBAbnVtTGluZXMoKVxuXG4gICAgc2V0U3RhdGU6IChzdGF0ZSkgLT4gQHN0YXRlID0gbmV3IFN0YXRlIHN0YXRlLnNcblxuICAgIG1haW5DdXJzb3I6ICAgIC0+IEBzdGF0ZS5tYWluQ3Vyc29yKClcbiAgICBsaW5lOiAgICAgIChpKSA9PiBAc3RhdGUubGluZSBpXG4gICAgdGFibGluZTogICAoaSkgLT4gQHN0YXRlLnRhYmxpbmUgaVxuICAgIGN1cnNvcjogICAgKGkpIC0+IEBzdGF0ZS5jdXJzb3IgaVxuICAgIGhpZ2hsaWdodDogKGkpIC0+IEBzdGF0ZS5oaWdobGlnaHQgaVxuICAgIHNlbGVjdGlvbjogKGkpIC0+IEBzdGF0ZS5zZWxlY3Rpb24gaVxuXG4gICAgbGluZXM6ICAgICAgICAgPT4gQHN0YXRlLmxpbmVzKClcbiAgICBjdXJzb3JzOiAgICAgICAtPiBAc3RhdGUuY3Vyc29ycygpXG4gICAgaGlnaGxpZ2h0czogICAgLT4gQHN0YXRlLmhpZ2hsaWdodHMoKVxuICAgIHNlbGVjdGlvbnM6ICAgIC0+IEBzdGF0ZS5zZWxlY3Rpb25zKClcblxuICAgIG51bUxpbmVzOiAgICAgIC0+IEBzdGF0ZS5udW1MaW5lcygpXG4gICAgbnVtQ3Vyc29yczogICAgLT4gQHN0YXRlLm51bUN1cnNvcnMoKVxuICAgIG51bVNlbGVjdGlvbnM6IC0+IEBzdGF0ZS5udW1TZWxlY3Rpb25zKClcbiAgICBudW1IaWdobGlnaHRzOiAtPiBAc3RhdGUubnVtSGlnaGxpZ2h0cygpXG5cbiAgICAjIHRoZXNlIGFyZSB1c2VkIGZyb20gdGVzdHMgYW5kIHJlc3RvcmVcbiAgICBzZXRDdXJzb3JzOiAgICAoYykgLT4gQHN0YXRlID0gQHN0YXRlLnNldEN1cnNvcnMgICAgY1xuICAgIHNldFNlbGVjdGlvbnM6IChzKSAtPiBAc3RhdGUgPSBAc3RhdGUuc2V0U2VsZWN0aW9ucyBzXG4gICAgc2V0SGlnaGxpZ2h0czogKGgpIC0+IEBzdGF0ZSA9IEBzdGF0ZS5zZXRIaWdobGlnaHRzIGhcbiAgICBzZXRNYWluOiAgICAgICAobSkgLT4gQHN0YXRlID0gQHN0YXRlLnNldE1haW4gICAgICAgbVxuICAgIGFkZEhpZ2hsaWdodDogIChoKSAtPiBAc3RhdGUgPSBAc3RhdGUuYWRkSGlnaGxpZ2h0ICBoXG5cbiAgICBzZWxlY3Q6IChzKSAtPlxuXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5zZWxlY3Qgc1xuICAgICAgICBAZG8uZW5kKClcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgaXNDdXJzb3JWaXJ0dWFsOiAgICAgICAoYz1AbWFpbkN1cnNvcigpKSAtPiBAbnVtTGluZXMoKSBhbmQgY1sxXSA8IEBudW1MaW5lcygpIGFuZCBjWzBdID4gQGxpbmUoY1sxXSkubGVuZ3RoXG4gICAgaXNDdXJzb3JBdEVuZE9mTGluZTogICAoYz1AbWFpbkN1cnNvcigpKSAtPiBAbnVtTGluZXMoKSBhbmQgY1sxXSA8IEBudW1MaW5lcygpIGFuZCBjWzBdID49IEBsaW5lKGNbMV0pLmxlbmd0aFxuICAgIGlzQ3Vyc29yQXRTdGFydE9mTGluZTogKGM9QG1haW5DdXJzb3IoKSkgLT4gY1swXSA9PSAwXG4gICAgaXNDdXJzb3JJbkluZGVudDogICAgICAoYz1AbWFpbkN1cnNvcigpKSAtPiBAbnVtTGluZXMoKSBhbmQgQGxpbmUoY1sxXSkuc2xpY2UoMCwgY1swXSkudHJpbSgpLmxlbmd0aCA9PSAwIGFuZCBAbGluZShjWzFdKS5zbGljZShjWzBdKS50cmltKCkubGVuZ3RoXG4gICAgaXNDdXJzb3JJbkxhc3RMaW5lOiAgICAoYz1AbWFpbkN1cnNvcigpKSAtPiBjWzFdID09IEBudW1MaW5lcygpLTFcbiAgICBpc0N1cnNvckluRmlyc3RMaW5lOiAgIChjPUBtYWluQ3Vyc29yKCkpIC0+IGNbMV0gPT0gMFxuICAgIGlzQ3Vyc29ySW5SYW5nZTogICAgICAgKHIsYz1AbWFpbkN1cnNvcigpKSAtPiBpc1Bvc0luUmFuZ2UgYywgclxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICB3b3JkQXRDdXJzb3I6IC0+IEB3b3JkQXRQb3MgQG1haW5DdXJzb3IoKVxuICAgIHdvcmRBdFBvczogKGMpIC0+IEB0ZXh0SW5SYW5nZSBAcmFuZ2VGb3JSZWFsV29yZEF0UG9zIGNcbiAgICB3b3Jkc0F0Q3Vyc29yczogKGNzPUBjdXJzb3JzKCksIG9wdCkgLT4gKEB0ZXh0SW5SYW5nZSByIGZvciByIGluIEByYW5nZXNGb3JXb3Jkc0F0Q3Vyc29ycyBjcywgb3B0KVxuXG4gICAgcmFuZ2VzRm9yV29yZHNBdEN1cnNvcnM6IChjcz1AY3Vyc29ycygpLCBvcHQpIC0+XG4gICAgICAgIHJuZ3MgPSAoQHJhbmdlRm9yV29yZEF0UG9zKGMsIG9wdCkgZm9yIGMgaW4gY3MpXG4gICAgICAgIHJuZ3MgPSBjbGVhblJhbmdlcyBybmdzXG5cbiAgICBzZWxlY3Rpb25UZXh0T3JXb3JkQXRDdXJzb3I6ICgpIC0+XG5cbiAgICAgICAgaWYgQG51bVNlbGVjdGlvbnMoKSA9PSAxXG4gICAgICAgICAgICBAdGV4dEluUmFuZ2UgQHNlbGVjdGlvbiAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB3b3JkQXRDdXJzb3IoKVxuXG4gICAgcmFuZ2VGb3JXb3JkQXRQb3M6IChwb3MsIG9wdCkgLT5cblxuICAgICAgICAjIGZpeCBtZSEgdGhpcyBpcyBmdWNraW5nIHNsb3cgb24gdmVyeSBsb25nIGxpbmVzLiBcbiAgICAgICAgIyB3ZSBjb3VsZCBqdXN0IHdhbGsgZm9yd2FyZCBhbmQgYmFja3dhcmRzIGZyb20gcG9zIHVudGlsIHdvcmQgYm91bmRhcnkgaXMgZGV0ZWN0ZWQhXG4gICAgICAgIHAgPSBAY2xhbXBQb3MgcG9zXG4gICAgICAgIHdyID0gQHdvcmRSYW5nZXNJbkxpbmVBdEluZGV4IHBbMV0sIG9wdFxuICAgICAgICByID0gcmFuZ2VBdFBvc0luUmFuZ2VzIHAsIHdyXG4gICAgICAgIHJcblxuICAgIHJhbmdlRm9yUmVhbFdvcmRBdFBvczogKHBvcywgb3B0KSAtPlxuXG4gICAgICAgIHAgPSBAY2xhbXBQb3MgcG9zXG4gICAgICAgIHdyID0gQHJlYWxXb3JkUmFuZ2VzSW5MaW5lQXRJbmRleCBwWzFdLCBvcHRcblxuICAgICAgICByID0gcmFuZ2VBdFBvc0luUmFuZ2VzIHAsIHdyXG4gICAgICAgIGlmIG5vdCByPyBvciBlbXB0eSBAdGV4dEluUmFuZ2UocikudHJpbSgpXG4gICAgICAgICAgICByID0gcmFuZ2VCZWZvcmVQb3NJblJhbmdlcyBwLCB3clxuICAgICAgICBpZiBub3Qgcj8gb3IgZW1wdHkgQHRleHRJblJhbmdlKHIpLnRyaW0oKVxuICAgICAgICAgICAgciA9IHJhbmdlQWZ0ZXJQb3NJblJhbmdlcyBwLCB3clxuICAgICAgICByID89IHJhbmdlRm9yUG9zIHBcbiAgICAgICAgclxuXG4gICAgZW5kT2ZXb3JkQXRQb3M6IChjKSA9PlxuXG4gICAgICAgIHIgPSBAcmFuZ2VGb3JXb3JkQXRQb3MgY1xuICAgICAgICBpZiBAaXNDdXJzb3JBdEVuZE9mTGluZSBjXG4gICAgICAgICAgICByZXR1cm4gYyBpZiBAaXNDdXJzb3JJbkxhc3RMaW5lIGNcbiAgICAgICAgICAgIHIgPSBAcmFuZ2VGb3JXb3JkQXRQb3MgWzAsIGNbMV0rMV1cbiAgICAgICAgW3JbMV1bMV0sIHJbMF1dXG5cbiAgICBzdGFydE9mV29yZEF0UG9zOiAoYykgPT5cblxuICAgICAgICBpZiBAaXNDdXJzb3JBdFN0YXJ0T2ZMaW5lIGNcbiAgICAgICAgICAgIHJldHVybiBjIGlmIEBpc0N1cnNvckluRmlyc3RMaW5lIGNcbiAgICAgICAgICAgIHIgPSBAcmFuZ2VGb3JXb3JkQXRQb3MgW0BsaW5lKGNbMV0tMSkubGVuZ3RoLCBjWzFdLTFdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHIgPSBAcmFuZ2VGb3JXb3JkQXRQb3MgY1xuICAgICAgICAgICAgaWYgclsxXVswXSA9PSBjWzBdXG4gICAgICAgICAgICAgICAgciA9IEByYW5nZUZvcldvcmRBdFBvcyBbY1swXS0xLCBjWzFdXVxuICAgICAgICBbclsxXVswXSwgclswXV1cblxuICAgIHdvcmRSYW5nZXNJbkxpbmVBdEluZGV4OiAobGksIG9wdD17fSkgLT5cblxuICAgICAgICBvcHQucmVnRXhwID89IEB3b3JkUmVnRXhwXG4gICAgICAgIG9wdC5yZWdFeHAgPSBuZXcgUmVnRXhwIFwiKFxcXFxzK3xbXFxcXHcje29wdC5pbmNsdWRlfV0rfFteXFxcXHNdKVwiLCAnZycgaWYgb3B0Py5pbmNsdWRlPy5sZW5ndGhcbiAgICAgICAgciA9IFtdXG4gICAgICAgIHdoaWxlIChtdGNoID0gb3B0LnJlZ0V4cC5leGVjKEBsaW5lKGxpKSkpICE9IG51bGxcbiAgICAgICAgICAgIHIucHVzaCBbbGksIFttdGNoLmluZGV4LCBvcHQucmVnRXhwLmxhc3RJbmRleF1dXG4gICAgICAgIHIubGVuZ3RoIGFuZCByIG9yIFtbbGksIFswLDBdXV1cblxuICAgIHJlYWxXb3JkUmFuZ2VzSW5MaW5lQXRJbmRleDogKGxpLCBvcHQ9e30pIC0+XG5cbiAgICAgICAgciA9IFtdXG4gICAgICAgIHdoaWxlIChtdGNoID0gQHJlYWxXb3JkUmVnRXhwLmV4ZWMoQGxpbmUobGkpKSkgIT0gbnVsbFxuICAgICAgICAgICAgci5wdXNoIFtsaSwgW210Y2guaW5kZXgsIEByZWFsV29yZFJlZ0V4cC5sYXN0SW5kZXhdXVxuICAgICAgICByLmxlbmd0aCBhbmQgciBvciBbW2xpLCBbMCwwXV1dXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDBcblxuICAgIGhpZ2hsaWdodHNJbkxpbmVJbmRleFJhbmdlUmVsYXRpdmVUb0xpbmVJbmRleDogKGxpbmVJbmRleFJhbmdlLCByZWxJbmRleCkgLT5cblxuICAgICAgICBobCA9IEBoaWdobGlnaHRzSW5MaW5lSW5kZXhSYW5nZSBsaW5lSW5kZXhSYW5nZVxuICAgICAgICBpZiBobFxuICAgICAgICAgICAgKFtzWzBdLXJlbEluZGV4LCBbc1sxXVswXSwgc1sxXVsxXV0sIHNbMl1dIGZvciBzIGluIGhsKVxuXG4gICAgaGlnaGxpZ2h0c0luTGluZUluZGV4UmFuZ2U6IChsaW5lSW5kZXhSYW5nZSkgLT5cblxuICAgICAgICBAaGlnaGxpZ2h0cygpLmZpbHRlciAocykgLT4gc1swXSA+PSBsaW5lSW5kZXhSYW5nZVswXSBhbmQgc1swXSA8PSBsaW5lSW5kZXhSYW5nZVsxXVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgc2VsZWN0aW9uc0luTGluZUluZGV4UmFuZ2VSZWxhdGl2ZVRvTGluZUluZGV4OiAobGluZUluZGV4UmFuZ2UsIHJlbEluZGV4KSAtPlxuXG4gICAgICAgIHNsID0gQHNlbGVjdGlvbnNJbkxpbmVJbmRleFJhbmdlIGxpbmVJbmRleFJhbmdlXG4gICAgICAgIGlmIHNsXG4gICAgICAgICAgICAoW3NbMF0tcmVsSW5kZXgsIFtzWzFdWzBdLCBzWzFdWzFdXV0gZm9yIHMgaW4gc2wpXG5cbiAgICBzZWxlY3Rpb25zSW5MaW5lSW5kZXhSYW5nZTogKGxpbmVJbmRleFJhbmdlKSAtPlxuXG4gICAgICAgIEBzZWxlY3Rpb25zKCkuZmlsdGVyIChzKSAtPiBzWzBdID49IGxpbmVJbmRleFJhbmdlWzBdIGFuZCBzWzBdIDw9IGxpbmVJbmRleFJhbmdlWzFdXG5cbiAgICBzZWxlY3RlZExpbmVJbmRpY2VzOiAtPiBfLnVuaXEgKHNbMF0gZm9yIHMgaW4gQHNlbGVjdGlvbnMoKSlcbiAgICBjdXJzb3JMaW5lSW5kaWNlczogICAtPiBfLnVuaXEgKGNbMV0gZm9yIGMgaW4gQGN1cnNvcnMoKSlcblxuICAgIHNlbGVjdGVkQW5kQ3Vyc29yTGluZUluZGljZXM6IC0+XG5cbiAgICAgICAgXy51bmlxIEBzZWxlY3RlZExpbmVJbmRpY2VzKCkuY29uY2F0IEBjdXJzb3JMaW5lSW5kaWNlcygpXG5cbiAgICBjb250aW51b3VzQ3Vyc29yQW5kU2VsZWN0ZWRMaW5lSW5kZXhSYW5nZXM6IC0+XG5cbiAgICAgICAgaWwgPSBAc2VsZWN0ZWRBbmRDdXJzb3JMaW5lSW5kaWNlcygpXG4gICAgICAgIGNzciA9IFtdXG4gICAgICAgIGlmIGlsLmxlbmd0aFxuICAgICAgICAgICAgZm9yIGxpIGluIGlsXG4gICAgICAgICAgICAgICAgaWYgY3NyLmxlbmd0aCBhbmQgXy5sYXN0KGNzcilbMV0gPT0gbGktMVxuICAgICAgICAgICAgICAgICAgICBfLmxhc3QoY3NyKVsxXSA9IGxpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBjc3IucHVzaCBbbGksbGldXG4gICAgICAgIGNzclxuXG4gICAgaXNTZWxlY3RlZExpbmVBdEluZGV4OiAobGkpIC0+XG5cbiAgICAgICAgaWwgPSBAc2VsZWN0ZWRMaW5lSW5kaWNlcygpXG4gICAgICAgIGlmIGxpIGluIGlsXG4gICAgICAgICAgICBzID0gQHNlbGVjdGlvbihpbC5pbmRleE9mIGxpKVxuICAgICAgICAgICAgaWYgc1sxXVswXSA9PSAwIGFuZCBzWzFdWzFdID09IEBsaW5lKGxpKS5sZW5ndGhcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBmYWxzZVxuXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIHRleHQ6ICAgICAgICAgICAgICAgIC0+IEBzdGF0ZS50ZXh0IEBuZXdsaW5lQ2hhcmFjdGVyc1xuICAgIHRleHRJblJhbmdlOiAgIChyZykgIC0+IEBsaW5lKHJnWzBdKS5zbGljZT8gcmdbMV1bMF0sIHJnWzFdWzFdXG4gICAgdGV4dHNJblJhbmdlczogKHJncykgLT4gKEB0ZXh0SW5SYW5nZShyKSBmb3IgciBpbiByZ3MpXG4gICAgdGV4dEluUmFuZ2VzOiAgKHJncykgLT4gQHRleHRzSW5SYW5nZXMocmdzKS5qb2luICdcXG4nXG4gICAgdGV4dE9mU2VsZWN0aW9uOiAgICAgLT4gQHRleHRJblJhbmdlcyBAc2VsZWN0aW9ucygpXG4gICAgdGV4dE9mSGlnaGxpZ2h0OiAgICAgLT4gQG51bUhpZ2hsaWdodHMoKSBhbmQgQHRleHRJblJhbmdlKEBoaWdobGlnaHQgMCkgb3IgJydcblxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIGluZGVudGF0aW9uQXRMaW5lSW5kZXg6IChsaSkgLT5cblxuICAgICAgICByZXR1cm4gMCBpZiBsaSA+PSBAbnVtTGluZXMoKVxuICAgICAgICBsaW5lID0gQGxpbmUgbGlcbiAgICAgICAgd2hpbGUgZW1wdHkobGluZS50cmltKCkpIGFuZCBsaSA+IDBcbiAgICAgICAgICAgIGxpLS1cbiAgICAgICAgICAgIGxpbmUgPSBAbGluZSBsaVxuICAgICAgICBpbmRlbnRhdGlvbkluTGluZSBsaW5lXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDBcblxuICAgIGxhc3RQb3M6IC0+XG5cbiAgICAgICAgbGxpID0gQG51bUxpbmVzKCktMVxuICAgICAgICBbQGxpbmUobGxpKS5sZW5ndGgsIGxsaV1cblxuICAgIGN1cnNvclBvczogLT4gQGNsYW1wUG9zIEBtYWluQ3Vyc29yKClcblxuICAgIGNsYW1wUG9zOiAocCkgLT5cblxuICAgICAgICBpZiBub3QgQG51bUxpbmVzKCkgdGhlbiByZXR1cm4gWzAsLTFdXG4gICAgICAgIGwgPSBjbGFtcCAwLCBAbnVtTGluZXMoKS0xLCAgcFsxXVxuICAgICAgICBjID0gY2xhbXAgMCwgQGxpbmUobCkubGVuZ3RoLCBwWzBdXG4gICAgICAgIFsgYywgbCBdXG5cbiAgICB3b3JkU3RhcnRQb3NBZnRlclBvczogKHA9QGN1cnNvclBvcygpKSAtPlxuXG4gICAgICAgIHJldHVybiBwIGlmIHBbMF0gPCBAbGluZShwWzFdKS5sZW5ndGggYW5kIEBsaW5lKHBbMV0pW3BbMF1dICE9ICcgJ1xuXG4gICAgICAgIHdoaWxlIHBbMF0gPCBAbGluZShwWzFdKS5sZW5ndGgtMVxuICAgICAgICAgICAgcmV0dXJuIFtwWzBdKzEsIHBbMV1dIGlmIEBsaW5lKHBbMV0pW3BbMF0rMV0gIT0gJyAnXG4gICAgICAgICAgICBwWzBdICs9IDFcblxuICAgICAgICBpZiBwWzFdIDwgQG51bUxpbmVzKCktMVxuICAgICAgICAgICAgQHdvcmRTdGFydFBvc0FmdGVyUG9zIFswLCBwWzFdKzFdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIG51bGxcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIHJhbmdlRm9yTGluZUF0SW5kZXg6IChpKSAtPlxuXG4gICAgICAgIHJldHVybiBrZXJyb3IgXCJCdWZmZXIucmFuZ2VGb3JMaW5lQXRJbmRleCAtLSBpbmRleCAje2l9ID49ICN7QG51bUxpbmVzKCl9XCIgaWYgaSA+PSBAbnVtTGluZXMoKVxuICAgICAgICBbaSwgWzAsIEBsaW5lKGkpLmxlbmd0aF1dXG5cbiAgICBpc1JhbmdlSW5TdHJpbmc6IChyKSAtPiBAcmFuZ2VPZlN0cmluZ1N1cnJvdW5kaW5nUmFuZ2Uocik/XG5cbiAgICByYW5nZU9mSW5uZXJTdHJpbmdTdXJyb3VuZGluZ1JhbmdlOiAocikgLT5cblxuICAgICAgICByZ3MgPSBAcmFuZ2VzT2ZTdHJpbmdzSW5MaW5lQXRJbmRleCByWzBdXG4gICAgICAgIHJncyA9IHJhbmdlc1NocnVua2VuQnkgcmdzLCAxXG4gICAgICAgIHJhbmdlQ29udGFpbmluZ1JhbmdlSW5SYW5nZXMgciwgcmdzXG5cbiAgICByYW5nZU9mU3RyaW5nU3Vycm91bmRpbmdSYW5nZTogKHIpIC0+XG5cbiAgICAgICAgaWYgaXIgPSBAcmFuZ2VPZklubmVyU3RyaW5nU3Vycm91bmRpbmdSYW5nZSByXG4gICAgICAgICAgICByYW5nZUdyb3duQnkgaXIsIDFcblxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMFxuXG4gICAgZGlzdGFuY2VPZldvcmQ6ICh3LCBwb3M9QGN1cnNvclBvcygpKSAtPlxuXG4gICAgICAgIHJldHVybiAwIGlmIEBsaW5lKHBvc1sxXSkuaW5kZXhPZih3KSA+PSAwXG4gICAgICAgIGQgPSAxXG4gICAgICAgIGxiID0gcG9zWzFdLWRcbiAgICAgICAgbGEgPSBwb3NbMV0rZFxuICAgICAgICB3aGlsZSBsYiA+PSAwIG9yIGxhIDwgQG51bUxpbmVzKClcbiAgICAgICAgICAgIGlmIGxiID49IDBcbiAgICAgICAgICAgICAgICBpZiBAbGluZShsYikuaW5kZXhPZih3KSA+PSAwIHRoZW4gcmV0dXJuIGRcbiAgICAgICAgICAgIGlmIGxhIDwgQG51bUxpbmVzKClcbiAgICAgICAgICAgICAgICBpZiBAbGluZShsYSkuaW5kZXhPZih3KSA+PSAwIHRoZW4gcmV0dXJuIGRcbiAgICAgICAgICAgIGQrK1xuICAgICAgICAgICAgbGIgPSBwb3NbMV0tZFxuICAgICAgICAgICAgbGEgPSBwb3NbMV0rZFxuXG4gICAgICAgIE51bWJlci5NQVhfU0FGRV9JTlRFR0VSXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICByYW5nZXNGb3JDdXJzb3JMaW5lczogKGNzPUBjdXJzb3JzKCkpIC0+IChAcmFuZ2VGb3JMaW5lQXRJbmRleCBjWzFdIGZvciBjIGluIGNzKVxuICAgIHJhbmdlc0ZvckFsbExpbmVzOiAtPiBAcmFuZ2VzRm9yTGluZXNGcm9tVG9wVG9Cb3QgMCwgQG51bUxpbmVzKClcblxuICAgIHJhbmdlc0ZvckxpbmVzQmV0d2VlblBvc2l0aW9uczogKGEsIGIsIGV4dGVuZD1mYWxzZSkgLT5cbiAgICAgICAgciA9IFtdXG4gICAgICAgIFthLGJdID0gc29ydFBvc2l0aW9ucyBbYSxiXVxuICAgICAgICBpZiBhWzFdID09IGJbMV1cbiAgICAgICAgICAgIHIucHVzaCBbYVsxXSwgW2FbMF0sIGJbMF1dXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByLnB1c2ggW2FbMV0sIFthWzBdLCBAbGluZShhWzFdKS5sZW5ndGhdXVxuICAgICAgICAgICAgaWYgYlsxXSAtIGFbMV0gPiAxXG4gICAgICAgICAgICAgICAgZm9yIGkgaW4gW2FbMV0rMS4uLmJbMV1dXG4gICAgICAgICAgICAgICAgICAgIHIucHVzaCBbaSwgWzAsQGxpbmUoaSkubGVuZ3RoXV1cbiAgICAgICAgICAgIHIucHVzaCBbYlsxXSwgWzAsIGV4dGVuZCBhbmQgYlswXSA9PSAwIGFuZCBAbGluZShiWzFdKS5sZW5ndGggb3IgYlswXV1dXG4gICAgICAgIHJcblxuICAgIHJhbmdlc0ZvckxpbmVzRnJvbVRvcFRvQm90OiAodG9wLGJvdCkgLT5cbiAgICAgICAgciA9IFtdXG4gICAgICAgIGlyID0gW3RvcCxib3RdXG4gICAgICAgIGZvciBsaSBpbiBbc3RhcnRPZihpcikuLi5lbmRPZihpcildXG4gICAgICAgICAgICByLnB1c2ggQHJhbmdlRm9yTGluZUF0SW5kZXggbGlcbiAgICAgICAgclxuXG4gICAgcmFuZ2VzRm9yVGV4dDogKHQsIG9wdCkgLT5cbiAgICAgICAgdCA9IHQuc3BsaXQoJ1xcbicpWzBdXG4gICAgICAgIHIgPSBbXVxuICAgICAgICBmb3IgbGkgaW4gWzAuLi5AbnVtTGluZXMoKV1cbiAgICAgICAgICAgIHIgPSByLmNvbmNhdCBAcmFuZ2VzRm9yVGV4dEluTGluZUF0SW5kZXggdCwgbGksIG9wdFxuICAgICAgICAgICAgYnJlYWsgaWYgci5sZW5ndGggPj0gKG9wdD8ubWF4ID8gOTk5KVxuICAgICAgICByXG5cbiAgICByYW5nZXNGb3JUZXh0SW5MaW5lQXRJbmRleDogKHQsIGksIG9wdCkgLT5cbiAgICAgICAgciA9IFtdXG4gICAgICAgIHR5cGUgPSBvcHQ/LnR5cGUgPyAnc3RyJ1xuICAgICAgICBzd2l0Y2ggdHlwZVxuICAgICAgICAgICAgd2hlbiAnZnV6enknXG4gICAgICAgICAgICAgICAgcmUgPSBuZXcgUmVnRXhwIFwiXFxcXHcrXCIsICdnJ1xuICAgICAgICAgICAgICAgIHdoaWxlIChtdGNoID0gcmUuZXhlYyhAbGluZShpKSkpICE9IG51bGxcbiAgICAgICAgICAgICAgICAgICAgci5wdXNoIFtpLCBbbXRjaC5pbmRleCwgcmUubGFzdEluZGV4XV0gaWYgZnV6enkudGVzdCB0LCBAbGluZShpKS5zbGljZSBtdGNoLmluZGV4LCByZS5sYXN0SW5kZXhcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0ID0gXy5lc2NhcGVSZWdFeHAgdCBpZiB0eXBlIGluIFsnc3RyJywgJ1N0cicsICdnbG9iJ11cbiAgICAgICAgICAgICAgICBpZiB0eXBlIGlzICdnbG9iJ1xuICAgICAgICAgICAgICAgICAgICB0ID0gdC5yZXBsYWNlIG5ldyBSZWdFeHAoXCJcXFxcKlwiLCAnZycpLCBcIlxcdypcIlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gciBpZiBub3QgdC5sZW5ndGhcblxuICAgICAgICAgICAgICAgIHJuZ3MgPSBtYXRjaHIucmFuZ2VzIHQsIEBsaW5lKGkpLCB0eXBlIGluIFsnc3RyJywgJ3JlZycsICdnbG9iJ10gYW5kICdpJyBvciAnJ1xuICAgICAgICAgICAgICAgIGZvciBybmcgaW4gcm5nc1xuICAgICAgICAgICAgICAgICAgICByLnB1c2ggW2ksIFtybmcuc3RhcnQsIHJuZy5zdGFydCArIHJuZy5tYXRjaC5sZW5ndGhdXVxuICAgICAgICByXG5cbiAgICByYW5nZXNPZlN0cmluZ3NJbkxpbmVBdEluZGV4OiAobGkpIC0+ICMgdG9kbzogaGFuZGxlICN7fVxuICAgICAgICB0ID0gQGxpbmUobGkpXG4gICAgICAgIHIgPSBbXVxuICAgICAgICBzcyA9IC0xXG4gICAgICAgIGNjID0gbnVsbFxuICAgICAgICBmb3IgaSBpbiBbMC4uLnQubGVuZ3RoXVxuICAgICAgICAgICAgYyA9IHRbaV1cbiAgICAgICAgICAgIGlmIG5vdCBjYyBhbmQgYyBpbiBcIidcXFwiXCJcbiAgICAgICAgICAgICAgICBjYyA9IGNcbiAgICAgICAgICAgICAgICBzcyA9IGlcbiAgICAgICAgICAgIGVsc2UgaWYgYyA9PSBjY1xuICAgICAgICAgICAgICAgIGlmICh0W2ktMV0gIT0gJ1xcXFwnKSBvciAoaT4yIGFuZCB0W2ktMl0gPT0gJ1xcXFwnKVxuICAgICAgICAgICAgICAgICAgICByLnB1c2ggW2xpLCBbc3MsIGkrMV1dXG4gICAgICAgICAgICAgICAgICAgIGNjID0gbnVsbFxuICAgICAgICAgICAgICAgICAgICBzcyA9IC0xXG4gICAgICAgIHJcblxubW9kdWxlLmV4cG9ydHMgPSBCdWZmZXJcbiJdfQ==
//# sourceURL=../../coffee/editor/buffer.coffee