// koffee 1.4.0
var _, os, ref, reversed;

ref = require('kxk'), reversed = ref.reversed, os = ref.os, _ = ref._;

module.exports = {
    initSurround: function() {
        this.surroundStack = [];
        this.surroundPairs = {
            '#': ['#{', '}'],
            '{': ['{', '}'],
            '}': ['{', '}'],
            '[': ['[', ']'],
            ']': ['[', ']'],
            '(': ['(', ')'],
            ')': ['(', ')'],
            '<': ['<', '>'],
            '>': ['<', '>'],
            "'": ["'", "'"],
            '"': ['"', '"'],
            '*': ['*', '*']
        };
        this.surroundCharacters = "{}[]()\"'".split('');
        switch (this.fileType) {
            case 'html':
                return this.surroundCharacters = this.surroundCharacters.concat(['<', '>']);
            case 'coffee':
            case 'koffee':
                return this.surroundCharacters.push('#');
            case 'md':
                this.surroundCharacters = this.surroundCharacters.concat(['*', '<', '`']);
                this.surroundPairs['<'] = ['<!--', '-->'];
                return this.surroundPairs['`'] = ['`', '`'];
        }
    },
    isUnbalancedSurroundCharacter: function(ch) {
        var c, cl, count, cr, cursor, i, j, len, len1, ref1, ref2, ref3;
        if (ch === "#") {
            return false;
        }
        ref1 = this.surroundPairs[ch], cl = ref1[0], cr = ref1[1];
        if (cl.length > 1) {
            return false;
        }
        ref2 = this.cursors();
        for (i = 0, len = ref2.length; i < len; i++) {
            cursor = ref2[i];
            count = 0;
            ref3 = this.line(cursor[1]);
            for (j = 0, len1 = ref3.length; j < len1; j++) {
                c = ref3[j];
                if (c === cl) {
                    count += 1;
                } else if (c === cr) {
                    count -= 1;
                }
            }
            if (((cl === cr) && (count % 2)) || ((cl !== cr) && count)) {
                return true;
            }
        }
        return false;
    },
    selectionContainsOnlyQuotes: function() {
        var c, i, len, ref1;
        ref1 = this.textOfSelection();
        for (i = 0, len = ref1.length; i < len; i++) {
            c = ref1[i];
            if (c === '\n') {
                continue;
            }
            if (c !== '"' && c !== "'") {
                return false;
            }
        }
        return true;
    },
    insertTripleQuotes: function() {
        var after, before, p, ref1;
        if (this.numCursors() > 1) {
            return false;
        }
        if (this.numSelections()) {
            return false;
        }
        p = this.cursorPos();
        ref1 = this.splitStateLineAtPos(this.state, p), before = ref1[0], after = ref1[1];
        if (!before.endsWith('""')) {
            return false;
        }
        if (before.length > 2 && before[before.length - 3] === '"') {
            return false;
        }
        if (after.startsWith('"')) {
            return false;
        }
        this["do"].start();
        this["do"].change(p[1], before + '""""' + after);
        this["do"].setCursors([[p[0] + 1, p[1]]]);
        this["do"].end();
        return true;
    },
    insertSurroundCharacter: function(ch) {
        var after, afterGood, before, beforeGood, c, cl, cr, found, i, j, k, l, len, len1, len2, len3, len4, len5, len6, len7, len8, len9, m, n, newCursors, newSelections, ns, o, q, r, ref1, ref10, ref11, ref12, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, s, spaces, sr, t, trimmed;
        if (ch === '"' && ((ref1 = this.fileType) === 'coffee' || ref1 === 'koffee') && this.insertTripleQuotes()) {
            return true;
        }
        if (this.isUnbalancedSurroundCharacter(ch)) {
            return false;
        }
        if (this.numSelections() && (ch === '"' || ch === "'") && this.selectionContainsOnlyQuotes()) {
            return false;
        }
        newCursors = this["do"].cursors();
        if (this.surroundStack.length) {
            if (_.last(this.surroundStack)[1] === ch) {
                for (i = 0, len = newCursors.length; i < len; i++) {
                    c = newCursors[i];
                    if (this["do"].line(c[1])[c[0]] !== ch) {
                        this.surroundStack = [];
                        break;
                    }
                }
                if (this.surroundStack.length && _.last(this.surroundStack)[1] === ch) {
                    this["do"].start();
                    this.selectNone();
                    this.deleteForward();
                    this["do"].end();
                    this.surroundStack.pop();
                    return false;
                }
            }
        }
        if (ch === '#' && ((ref2 = this.fileType) === 'coffee' || ref2 === 'koffee')) {
            found = false;
            ref3 = this["do"].selections();
            for (j = 0, len1 = ref3.length; j < len1; j++) {
                s = ref3[j];
                if (this.isRangeInString(s)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                for (k = 0, len2 = newCursors.length; k < len2; k++) {
                    c = newCursors[k];
                    if (this.isRangeInString(rangeForPos(c))) {
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                return false;
            }
        }
        if (ch === "'" && !this.numSelections()) {
            for (l = 0, len3 = newCursors.length; l < len3; l++) {
                c = newCursors[l];
                if (c[0] > 0 && /[A-Za-z]/.test(this["do"].line(c[1])[c[0] - 1])) {
                    return false;
                }
            }
        }
        this["do"].start();
        if (this["do"].numSelections() === 0) {
            newSelections = rangesFromPositions(newCursors);
        } else {
            newSelections = this["do"].selections();
        }
        ref4 = this.surroundPairs[ch], cl = ref4[0], cr = ref4[1];
        this.surroundStack.push([cl, cr]);
        ref5 = reversed(newSelections);
        for (m = 0, len4 = ref5.length; m < len4; m++) {
            ns = ref5[m];
            if (cl === '#{') {
                if (sr = this.rangeOfStringSurroundingRange(ns)) {
                    if (this["do"].line(sr[0])[sr[1][0]] === "'") {
                        this["do"].change(ns[0], this["do"].line(ns[0]).splice(sr[1][0], 1, '"'));
                    }
                    if (this["do"].line(sr[0])[sr[1][1] - 1] === "'") {
                        this["do"].change(ns[0], this["do"].line(ns[0]).splice(sr[1][1] - 1, 1, '"'));
                    }
                }
            } else if (((ref6 = this.fileType) === 'coffee' || ref6 === 'koffee') && cl === '(' && lengthOfRange(ns) > 0) {
                ref7 = this.splitStateLineAtPos(this["do"], rangeStartPos(ns)), before = ref7[0], after = ref7[1];
                trimmed = before.trimRight();
                beforeGood = /\w$/.test(trimmed) && !/(if|when|in|and|or|is|not|else|return)$/.test(trimmed);
                afterGood = after.trim().length && !after.startsWith(' ');
                if (beforeGood && afterGood) {
                    spaces = before.length - trimmed.length;
                    this["do"].change(ns[0], this["do"].line(ns[0]).splice(trimmed.length, spaces));
                    ref8 = positionsAfterLineColInPositions(ns[0], ns[1][0] - 1, newCursors);
                    for (n = 0, len5 = ref8.length; n < len5; n++) {
                        c = ref8[n];
                        c[0] -= spaces;
                    }
                    ns[1][0] -= spaces;
                    ns[1][1] -= spaces;
                }
            }
            this["do"].change(ns[0], this["do"].line(ns[0]).splice(ns[1][1], 0, cr));
            this["do"].change(ns[0], this["do"].line(ns[0]).splice(ns[1][0], 0, cl));
            ref9 = positionsAfterLineColInPositions(ns[0], ns[1][0] - 1, newCursors);
            for (o = 0, len6 = ref9.length; o < len6; o++) {
                c = ref9[o];
                c[0] += cl.length;
            }
            ref10 = rangesAfterLineColInRanges(ns[0], ns[1][1] - 1, newSelections);
            for (q = 0, len7 = ref10.length; q < len7; q++) {
                os = ref10[q];
                os[1][0] += cr.length;
                os[1][1] += cr.length;
            }
            ref11 = rangesAfterLineColInRanges(ns[0], ns[1][0] - 1, newSelections);
            for (r = 0, len8 = ref11.length; r < len8; r++) {
                os = ref11[r];
                os[1][0] += cl.length;
                os[1][1] += cl.length;
            }
            ref12 = positionsAfterLineColInPositions(ns[0], ns[1][1], newCursors);
            for (t = 0, len9 = ref12.length; t < len9; t++) {
                c = ref12[t];
                c[0] += cr.length;
            }
        }
        this["do"].select(rangesNotEmptyInRanges(newSelections));
        this["do"].setCursors(newCursors);
        this["do"].end();
        return true;
    },
    deleteEmptySurrounds: function() {
        var after, before, c, cs, i, j, k, l, len, len1, len2, len3, nc, numPairs, openClosePairs, pairs, ref1, ref2, ref3, sc, so, uniquePairs;
        cs = this["do"].cursors();
        pairs = _.uniqWith(_.values(this.surroundPairs), _.isEqual);
        openClosePairs = [];
        for (i = 0, len = cs.length; i < len; i++) {
            c = cs[i];
            numPairs = openClosePairs.length;
            for (j = 0, len1 = pairs.length; j < len1; j++) {
                ref1 = pairs[j], so = ref1[0], sc = ref1[1];
                before = this["do"].line(c[1]).slice(c[0] - so.length, c[0]);
                after = this["do"].line(c[1]).slice(c[0], c[0] + sc.length);
                if (so === before && sc === after) {
                    openClosePairs.push([so, sc]);
                    break;
                }
            }
            if (numPairs === openClosePairs.length) {
                return false;
            }
        }
        if (cs.length !== openClosePairs.length) {
            return false;
        }
        uniquePairs = _.uniqWith(openClosePairs, _.isEqual);
        for (k = 0, len2 = cs.length; k < len2; k++) {
            c = cs[k];
            ref2 = openClosePairs.shift(), so = ref2[0], sc = ref2[1];
            this["do"].change(c[1], this["do"].line(c[1]).splice(c[0] - so.length, so.length + sc.length));
            ref3 = positionsAfterLineColInPositions(c[1], c[0], cs);
            for (l = 0, len3 = ref3.length; l < len3; l++) {
                nc = ref3[l];
                nc[0] -= sc.length + so.length;
            }
            c[0] -= so.length;
        }
        if (this.surroundStack.length) {
            if (uniquePairs.length === 1 && _.isEqual(uniquePairs[0], _.last(this.surroundStack))) {
                this.surroundStack.pop();
            } else {
                this.surroundStack = [];
            }
        }
        this["do"].setCursors(cs);
        return true;
    },
    highlightsSurroundingCursor: function() {
        var hs;
        if (this.numHighlights() % 2 === 0) {
            hs = this.highlights();
            sortRanges(hs);
            if (this.numHighlights() === 2) {
                return hs;
            } else if (this.numHighlights() === 4) {
                if (areSameRanges([hs[1], hs[2]], this.selections())) {
                    return [hs[0], hs[3]];
                } else {
                    return [hs[1], hs[2]];
                }
            }
        }
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3Vycm91bmQuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFPQSxJQUFBOztBQUFBLE1BQXNCLE9BQUEsQ0FBUSxLQUFSLENBQXRCLEVBQUUsdUJBQUYsRUFBWSxXQUFaLEVBQWdCOztBQUVoQixNQUFNLENBQUMsT0FBUCxHQUVJO0lBQUEsWUFBQSxFQUFjLFNBQUE7UUFFVixJQUFDLENBQUEsYUFBRCxHQUFpQjtRQUVqQixJQUFDLENBQUEsYUFBRCxHQUNJO1lBQUEsR0FBQSxFQUFLLENBQUMsSUFBRCxFQUFPLEdBQVAsQ0FBTDtZQUNBLEdBQUEsRUFBSyxDQUFDLEdBQUQsRUFBTSxHQUFOLENBREw7WUFFQSxHQUFBLEVBQUssQ0FBQyxHQUFELEVBQU0sR0FBTixDQUZMO1lBR0EsR0FBQSxFQUFLLENBQUMsR0FBRCxFQUFNLEdBQU4sQ0FITDtZQUlBLEdBQUEsRUFBSyxDQUFDLEdBQUQsRUFBTSxHQUFOLENBSkw7WUFLQSxHQUFBLEVBQUssQ0FBQyxHQUFELEVBQU0sR0FBTixDQUxMO1lBTUEsR0FBQSxFQUFLLENBQUMsR0FBRCxFQUFNLEdBQU4sQ0FOTDtZQU9BLEdBQUEsRUFBSyxDQUFDLEdBQUQsRUFBTSxHQUFOLENBUEw7WUFRQSxHQUFBLEVBQUssQ0FBQyxHQUFELEVBQU0sR0FBTixDQVJMO1lBU0EsR0FBQSxFQUFLLENBQUMsR0FBRCxFQUFNLEdBQU4sQ0FUTDtZQVVBLEdBQUEsRUFBSyxDQUFDLEdBQUQsRUFBTSxHQUFOLENBVkw7WUFXQSxHQUFBLEVBQUssQ0FBQyxHQUFELEVBQU0sR0FBTixDQVhMOztRQWFKLElBQUMsQ0FBQSxrQkFBRCxHQUFzQixXQUFXLENBQUMsS0FBWixDQUFrQixFQUFsQjtBQUV0QixnQkFBTyxJQUFDLENBQUEsUUFBUjtBQUFBLGlCQUNTLE1BRFQ7dUJBQ3VCLElBQUMsQ0FBQSxrQkFBRCxHQUFzQixJQUFDLENBQUEsa0JBQWtCLENBQUMsTUFBcEIsQ0FBMkIs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QUExQixDQUEvQjtnQkFDSSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBQSxFQURKO2FBQUEsTUFBQTtnQkFHSSxJQUFDLENBQUEsYUFBRCxHQUFpQixHQUhyQjthQURKOztRQU1BLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxVQUFKLENBQWUsRUFBZjtlQUVBO0lBMUNrQixDQXBMdEI7SUFzT0EsMkJBQUEsRUFBNkIsU0FBQTtBQUV6QixZQUFBO1FBQUEsSUFBRyxJQUFDLENBQUEsYUFBRCxDQUFBLENBQUEsR0FBbUIsQ0FBbkIsS0FBd0IsQ0FBM0I7WUFDSSxFQUFBLEdBQUssSUFBQyxDQUFBLFVBQUQsQ0FBQTtZQUNMLFVBQUEsQ0FBVyxFQUFYO1lBQ0EsSUFBRyxJQUFDLENBQUEsYUFBRCxDQUFBLENBQUEsS0FBb0IsQ0FBdkI7QUFDSSx1QkFBTyxHQURYO2FBQUEsTUFFSyxJQUFHLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBQSxLQUFvQixDQUF2QjtnQkFDRCxJQUFHLGFBQUEsQ0FBYyxDQUFDLEVBQUcsQ0FBQSxDQUFBLENBQUosRUFBUSxFQUFHLENBQUEsQ0FBQSxDQUFYLENBQWQsRUFBOEIsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUE5QixDQUFIO0FBQ0ksMkJBQU8sQ0FBQyxFQUFHLENBQUEsQ0FBQSxDQUFKLEVBQVEsRUFBRyxDQUFBLENBQUEsQ0FBWCxFQURYO2lCQUFBLE1BQUE7QUFHSSwyQkFBTyxDQUFDLEVBQUcsQ0FBQSxDQUFBLENBQUosRUFBUSxFQUFHLENBQUEsQ0FBQSxDQUFYLEVBSFg7aUJBREM7YUFMVDs7SUFGeUIsQ0F0TzdCIiwic291cmNlc0NvbnRlbnQiOlsiXG4jICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwXG4jICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgIFxuXG57IHJldmVyc2VkLCBvcywgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5cbiAgICBpbml0U3Vycm91bmQ6IC0+XG4gICAgICAgIFxuICAgICAgICBAc3Vycm91bmRTdGFjayA9IFtdXG5cbiAgICAgICAgQHN1cnJvdW5kUGFpcnMgPSBcbiAgICAgICAgICAgICcjJzogWycjeycsICd9J10gIyA8LSB0aGlzIGhhcyB0byBjb21lXG4gICAgICAgICAgICAneyc6IFsneycsICd9J10gICMgPC0gYmVmb3JlIHRoYXRcbiAgICAgICAgICAgICd9JzogWyd7JywgJ30nXVxuICAgICAgICAgICAgJ1snOiBbJ1snLCAnXSddXG4gICAgICAgICAgICAnXSc6IFsnWycsICddJ11cbiAgICAgICAgICAgICcoJzogWycoJywgJyknXVxuICAgICAgICAgICAgJyknOiBbJygnLCAnKSddXG4gICAgICAgICAgICAnPCc6IFsnPCcsICc+J11cbiAgICAgICAgICAgICc+JzogWyc8JywgJz4nXVxuICAgICAgICAgICAgXCInXCI6IFtcIidcIiwgXCInXCJdXG4gICAgICAgICAgICAnXCInOiBbJ1wiJywgJ1wiJ11cbiAgICAgICAgICAgICcqJzogWycqJywgJyonXSAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBAc3Vycm91bmRDaGFyYWN0ZXJzID0gXCJ7fVtdKClcXFwiJ1wiLnNwbGl0ICcnXG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggQGZpbGVUeXBlXG4gICAgICAgICAgICB3aGVuICdodG1sJyAgIHRoZW4gQHN1cnJvdW5kQ2hhcmFjdGVycyA9IEBzdXJyb3VuZENoYXJhY3RlcnMuY29uY2F0IFsnPCcsJz4nXVxuICAgICAgICAgICAgd2hlbiAnY29mZmVlJywgJ2tvZmZlZScgdGhlbiBAc3Vycm91bmRDaGFyYWN0ZXJzLnB1c2ggJyMnXG4gICAgICAgICAgICB3aGVuICdtZCcgICAgIFxuICAgICAgICAgICAgICAgIEBzdXJyb3VuZENoYXJhY3RlcnMgPSBAc3Vycm91bmRDaGFyYWN0ZXJzLmNvbmNhdCBbJyonLCc8JywgJ2AnXVxuICAgICAgICAgICAgICAgIEBzdXJyb3VuZFBhaXJzWyc8J10gPSBbJzwhLS0nLCAnLS0+J11cbiAgICAgICAgICAgICAgICBAc3Vycm91bmRQYWlyc1snYCddID0gWydgJywgJ2AnXVxuICAgICAgICAgICAgICAgIFxuICAgIGlzVW5iYWxhbmNlZFN1cnJvdW5kQ2hhcmFjdGVyOiAoY2gpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgY2ggaW4gW1wiI1wiXVxuICAgICAgICBbY2wsY3JdID0gQHN1cnJvdW5kUGFpcnNbY2hdXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBjbC5sZW5ndGggPiAxXG4gICAgICAgIGZvciBjdXJzb3IgaW4gQGN1cnNvcnMoKVxuICAgICAgICAgICAgY291bnQgPSAwXG4gICAgICAgICAgICBmb3IgYyBpbiBAbGluZShjdXJzb3JbMV0pXG4gICAgICAgICAgICAgICAgaWYgYyA9PSBjbFxuICAgICAgICAgICAgICAgICAgICBjb3VudCArPSAxXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBjID09IGNyXG4gICAgICAgICAgICAgICAgICAgIGNvdW50IC09IDFcbiAgICAgICAgICAgIGlmICgoY2wgPT0gY3IpIGFuZCAoY291bnQgJSAyKSkgb3IgKChjbCAhPSBjcikgYW5kIGNvdW50KVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIFxuICAgIHNlbGVjdGlvbkNvbnRhaW5zT25seVF1b3RlczogLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBjIGluIEB0ZXh0T2ZTZWxlY3Rpb24oKVxuICAgICAgICAgICAgY29udGludWUgaWYgYyA9PSAnXFxuJ1xuICAgICAgICAgICAgaWYgYyBub3QgaW4gWydcIicsIFwiJ1wiXVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB0cnVlXG4gICAgXG4gICAgaW5zZXJ0VHJpcGxlUXVvdGVzOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIEBudW1DdXJzb3JzKCkgPiAxXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBAbnVtU2VsZWN0aW9ucygpXG4gICAgICAgIHAgPSBAY3Vyc29yUG9zKClcbiAgICAgICAgW2JlZm9yZSwgYWZ0ZXJdID0gQHNwbGl0U3RhdGVMaW5lQXRQb3MgQHN0YXRlLCBwXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBub3QgYmVmb3JlLmVuZHNXaXRoICdcIlwiJ1xuICAgICAgICByZXR1cm4gZmFsc2UgaWYgYmVmb3JlLmxlbmd0aCA+IDIgYW5kIGJlZm9yZVtiZWZvcmUubGVuZ3RoLTNdID09ICdcIidcbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIGFmdGVyLnN0YXJ0c1dpdGggJ1wiJ1xuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBAZG8uY2hhbmdlIHBbMV0sIGJlZm9yZSArICdcIlwiXCJcIicgKyBhZnRlclxuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBbW3BbMF0rMSwgcFsxXV1dXG4gICAgICAgIEBkby5lbmQoKVxuICAgICAgICB0cnVlXG4gICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgaW5zZXJ0U3Vycm91bmRDaGFyYWN0ZXI6IChjaCkgLT5cblxuICAgICAgICBpZiBjaCA9PSAnXCInIGFuZCBAZmlsZVR5cGUgaW4gWydjb2ZmZWUnLCAna29mZmVlJ10gYW5kIEBpbnNlcnRUcmlwbGVRdW90ZXMoKVxuICAgICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgICBpZiBAaXNVbmJhbGFuY2VkU3Vycm91bmRDaGFyYWN0ZXIgY2hcbiAgICAgICAgICAgIHJldHVybiBmYWxzZSBcbiAgICAgICAgXG4gICAgICAgIGlmIEBudW1TZWxlY3Rpb25zKCkgYW5kIGNoIGluIFsnXCInLCBcIidcIl0gYW5kIEBzZWxlY3Rpb25Db250YWluc09ubHlRdW90ZXMoKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIFxuICAgICAgICBuZXdDdXJzb3JzID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICBcbiAgICAgICAgaWYgQHN1cnJvdW5kU3RhY2subGVuZ3RoXG4gICAgICAgICAgICBpZiBfLmxhc3QoQHN1cnJvdW5kU3RhY2spWzFdID09IGNoXG4gICAgICAgICAgICAgICAgZm9yIGMgaW4gbmV3Q3Vyc29yc1xuICAgICAgICAgICAgICAgICAgICBpZiBAZG8ubGluZShjWzFdKVtjWzBdXSAhPSBjaFxuICAgICAgICAgICAgICAgICAgICAgICAgQHN1cnJvdW5kU3RhY2sgPSBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBpZiBAc3Vycm91bmRTdGFjay5sZW5ndGggYW5kIF8ubGFzdChAc3Vycm91bmRTdGFjaylbMV0gPT0gY2hcbiAgICAgICAgICAgICAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgICAgICAgICAgICAgQHNlbGVjdE5vbmUoKVxuICAgICAgICAgICAgICAgICAgICBAZGVsZXRlRm9yd2FyZCgpXG4gICAgICAgICAgICAgICAgICAgIEBkby5lbmQoKVxuICAgICAgICAgICAgICAgICAgICBAc3Vycm91bmRTdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2UgXG4gICAgICAgIFxuICAgICAgICBpZiBjaCA9PSAnIycgYW5kIEBmaWxlVHlwZSBpbiBbJ2NvZmZlZScsICdrb2ZmZWUnXSAjIGNoZWNrIGlmIGFueSBjdXJzb3Igb3Igc2VsZWN0aW9uIGlzIGluc2lkZSBhIHN0cmluZ1xuICAgICAgICAgICAgZm91bmQgPSBmYWxzZVxuICAgICAgICAgICAgZm9yIHMgaW4gQGRvLnNlbGVjdGlvbnMoKVxuICAgICAgICAgICAgICAgIGlmIEBpc1JhbmdlSW5TdHJpbmcgc1xuICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBub3QgZm91bmRcbiAgICAgICAgICAgICAgICBmb3IgYyBpbiBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgICAgIGlmIEBpc1JhbmdlSW5TdHJpbmcgcmFuZ2VGb3JQb3MgY1xuICAgICAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlIGlmIG5vdCBmb3VuZFxuICAgICAgICAgICAgXG4gICAgICAgIGlmIGNoID09IFwiJ1wiIGFuZCBub3QgQG51bVNlbGVjdGlvbnMoKSAjIGNoZWNrIGlmIGFueSBhbHBhYmV0aWNhbCBjaGFyYWN0ZXIgaXMgYmVmb3JlIGFueSBjdXJzb3JcbiAgICAgICAgICAgIGZvciBjIGluIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICBpZiBjWzBdID4gMCBhbmQgL1tBLVphLXpdLy50ZXN0IEBkby5saW5lKGNbMV0pW2NbMF0tMV0gXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICBcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgaWYgQGRvLm51bVNlbGVjdGlvbnMoKSA9PSAwXG4gICAgICAgICAgICBuZXdTZWxlY3Rpb25zID0gcmFuZ2VzRnJvbVBvc2l0aW9ucyBuZXdDdXJzb3JzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIG5ld1NlbGVjdGlvbnMgPSBAZG8uc2VsZWN0aW9ucygpXG4gICAgICAgICAgICBcbiAgICAgICAgW2NsLGNyXSA9IEBzdXJyb3VuZFBhaXJzW2NoXVxuICAgICAgICAgICAgXG4gICAgICAgIEBzdXJyb3VuZFN0YWNrLnB1c2ggW2NsLGNyXVxuXG4gICAgICAgIGZvciBucyBpbiByZXZlcnNlZCBuZXdTZWxlY3Rpb25zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGNsID09ICcjeycgIyBjb252ZXJ0IHNpbmdsZSBzdHJpbmcgdG8gZG91YmxlIHN0cmluZ1xuICAgICAgICAgICAgICAgIGlmIHNyID0gQHJhbmdlT2ZTdHJpbmdTdXJyb3VuZGluZ1JhbmdlIG5zXG4gICAgICAgICAgICAgICAgICAgIGlmIEBkby5saW5lKHNyWzBdKVtzclsxXVswXV0gPT0gXCInXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIEBkby5jaGFuZ2UgbnNbMF0sIEBkby5saW5lKG5zWzBdKS5zcGxpY2Ugc3JbMV1bMF0sIDEsICdcIidcbiAgICAgICAgICAgICAgICAgICAgaWYgQGRvLmxpbmUoc3JbMF0pW3NyWzFdWzFdLTFdID09IFwiJ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICBAZG8uY2hhbmdlIG5zWzBdLCBAZG8ubGluZShuc1swXSkuc3BsaWNlIHNyWzFdWzFdLTEsIDEsICdcIidcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZWxzZSBpZiBAZmlsZVR5cGUgaW4gWydjb2ZmZWUnLCAna29mZmVlJ10gYW5kIGNsID09ICcoJyBhbmQgbGVuZ3RoT2ZSYW5nZShucykgPiAwICMgcmVtb3ZlIHNwYWNlIGFmdGVyIGNhbGxlZVxuICAgICAgICAgICAgICAgIFtiZWZvcmUsIGFmdGVyXSA9IEBzcGxpdFN0YXRlTGluZUF0UG9zIEBkbywgcmFuZ2VTdGFydFBvcyBuc1xuICAgICAgICAgICAgICAgIHRyaW1tZWQgPSBiZWZvcmUudHJpbVJpZ2h0KClcbiAgICAgICAgICAgICAgICBiZWZvcmVHb29kID0gL1xcdyQvLnRlc3QodHJpbW1lZCkgYW5kIG5vdCAvKGlmfHdoZW58aW58YW5kfG9yfGlzfG5vdHxlbHNlfHJldHVybikkLy50ZXN0IHRyaW1tZWRcbiAgICAgICAgICAgICAgICBhZnRlckdvb2QgPSBhZnRlci50cmltKCkubGVuZ3RoIGFuZCBub3QgYWZ0ZXIuc3RhcnRzV2l0aCAnICdcbiAgICAgICAgICAgICAgICBpZiBiZWZvcmVHb29kIGFuZCBhZnRlckdvb2RcbiAgICAgICAgICAgICAgICAgICAgc3BhY2VzID0gYmVmb3JlLmxlbmd0aC10cmltbWVkLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBAZG8uY2hhbmdlIG5zWzBdLCBAZG8ubGluZShuc1swXSkuc3BsaWNlIHRyaW1tZWQubGVuZ3RoLCBzcGFjZXNcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGZvciBjIGluIHBvc2l0aW9uc0FmdGVyTGluZUNvbEluUG9zaXRpb25zIG5zWzBdLCBuc1sxXVswXS0xLCBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgICAgICAgICBjWzBdIC09IHNwYWNlc1xuICAgICAgICAgICAgICAgICAgICBuc1sxXVswXSAtPSBzcGFjZXNcbiAgICAgICAgICAgICAgICAgICAgbnNbMV1bMV0gLT0gc3BhY2VzXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgQGRvLmNoYW5nZSBuc1swXSwgQGRvLmxpbmUobnNbMF0pLnNwbGljZSBuc1sxXVsxXSwgMCwgY3JcbiAgICAgICAgICAgIEBkby5jaGFuZ2UgbnNbMF0sIEBkby5saW5lKG5zWzBdKS5zcGxpY2UgbnNbMV1bMF0sIDAsIGNsXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBjIGluIHBvc2l0aW9uc0FmdGVyTGluZUNvbEluUG9zaXRpb25zIG5zWzBdLCBuc1sxXVswXS0xLCBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgY1swXSArPSBjbC5sZW5ndGhcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBvcyBpbiByYW5nZXNBZnRlckxpbmVDb2xJblJhbmdlcyBuc1swXSwgbnNbMV1bMV0tMSwgbmV3U2VsZWN0aW9uc1xuICAgICAgICAgICAgICAgIG9zWzFdWzBdICs9IGNyLmxlbmd0aFxuICAgICAgICAgICAgICAgIG9zWzFdWzFdICs9IGNyLmxlbmd0aFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIG9zIGluIHJhbmdlc0FmdGVyTGluZUNvbEluUmFuZ2VzIG5zWzBdLCBuc1sxXVswXS0xLCBuZXdTZWxlY3Rpb25zXG4gICAgICAgICAgICAgICAgb3NbMV1bMF0gKz0gY2wubGVuZ3RoXG4gICAgICAgICAgICAgICAgb3NbMV1bMV0gKz0gY2wubGVuZ3RoXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBjIGluIHBvc2l0aW9uc0FmdGVyTGluZUNvbEluUG9zaXRpb25zIG5zWzBdLCBuc1sxXVsxXSwgbmV3Q3Vyc29yc1xuICAgICAgICAgICAgICAgIGNbMF0gKz0gY3IubGVuZ3RoXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBkby5zZWxlY3QgcmFuZ2VzTm90RW1wdHlJblJhbmdlcyBuZXdTZWxlY3Rpb25zXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnNcbiAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBkZWxldGVFbXB0eVN1cnJvdW5kczogLT5cbiAgICAgICAgICAgIFxuICAgICAgICBjcyA9IEBkby5jdXJzb3JzKClcblxuICAgICAgICBwYWlycyA9IF8udW5pcVdpdGggXy52YWx1ZXMoQHN1cnJvdW5kUGFpcnMpLCBfLmlzRXF1YWxcblxuICAgICAgICBvcGVuQ2xvc2VQYWlycyA9IFtdXG4gICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBjc1xuICAgICAgICAgICAgbnVtUGFpcnMgPSBvcGVuQ2xvc2VQYWlycy5sZW5ndGhcbiAgICAgICAgICAgICMgY2hlY2sgaWYgYWxsIGN1cnNvcnMgYXJlIGluc2lkZSBvZiBlbXB0eSBzdXJyb3VuZCBwYWlyc1xuICAgICAgICAgICAgZm9yIFtzbywgc2NdIGluIHBhaXJzXG4gICAgICAgICAgICAgICAgYmVmb3JlID0gQGRvLmxpbmUoY1sxXSkuc2xpY2UgY1swXS1zby5sZW5ndGgsIGNbMF1cbiAgICAgICAgICAgICAgICBhZnRlciAgPSBAZG8ubGluZShjWzFdKS5zbGljZSBjWzBdLCBjWzBdK3NjLmxlbmd0aFxuICAgICAgICAgICAgICAgIGlmIHNvID09IGJlZm9yZSBhbmQgc2MgPT0gYWZ0ZXJcbiAgICAgICAgICAgICAgICAgICAgb3BlbkNsb3NlUGFpcnMucHVzaCBbc28sc2NdXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBpZiBudW1QYWlycyA9PSBvcGVuQ2xvc2VQYWlycy5sZW5ndGhcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2UgXG5cbiAgICAgICAgaWYgY3MubGVuZ3RoICE9IG9wZW5DbG9zZVBhaXJzLmxlbmd0aFxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlIFxuICAgICAgICAgICAgXG4gICAgICAgICMgYWxsIGN1cnNvcnMgaW4gZW1wdHkgc3Vycm91bmQgLT4gcmVtb3ZlIGJvdGggc3Vycm91bmRzXG4gICAgICAgIFxuICAgICAgICB1bmlxdWVQYWlycyA9IF8udW5pcVdpdGggb3BlbkNsb3NlUGFpcnMsIF8uaXNFcXVhbFxuICAgICAgICBmb3IgYyBpbiBjc1xuICAgICAgICAgICAgW3NvLHNjXSA9IG9wZW5DbG9zZVBhaXJzLnNoaWZ0KClcbiAgXG4gICAgICAgICAgICBAZG8uY2hhbmdlIGNbMV0sIEBkby5saW5lKGNbMV0pLnNwbGljZSBjWzBdLXNvLmxlbmd0aCwgc28ubGVuZ3RoK3NjLmxlbmd0aFxuICAgICAgICAgICAgZm9yIG5jIGluIHBvc2l0aW9uc0FmdGVyTGluZUNvbEluUG9zaXRpb25zIGNbMV0sIGNbMF0sIGNzXG4gICAgICAgICAgICAgICAgbmNbMF0gLT0gc2MubGVuZ3RoICsgc28ubGVuZ3RoIFxuICAgICAgICAgICAgY1swXSAtPSBzby5sZW5ndGhcbiAgICAgICAgXG4gICAgICAgIGlmIEBzdXJyb3VuZFN0YWNrLmxlbmd0aCAjIHBvcCBvciBjbGVhbiBzdXJyb3VuZCBzdGFja1xuICAgICAgICAgICAgaWYgdW5pcXVlUGFpcnMubGVuZ3RoID09IDEgYW5kIF8uaXNFcXVhbCB1bmlxdWVQYWlyc1swXSwgXy5sYXN0IEBzdXJyb3VuZFN0YWNrIFxuICAgICAgICAgICAgICAgIEBzdXJyb3VuZFN0YWNrLnBvcCgpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHN1cnJvdW5kU3RhY2sgPSBbXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBjc1xuICAgICAgICBcbiAgICAgICAgdHJ1ZSAgICBcbiAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBoaWdobGlnaHRzU3Vycm91bmRpbmdDdXJzb3I6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbnVtSGlnaGxpZ2h0cygpICUgMiA9PSAwXG4gICAgICAgICAgICBocyA9IEBoaWdobGlnaHRzKClcbiAgICAgICAgICAgIHNvcnRSYW5nZXMgaHNcbiAgICAgICAgICAgIGlmIEBudW1IaWdobGlnaHRzKCkgPT0gMlxuICAgICAgICAgICAgICAgIHJldHVybiBoc1xuICAgICAgICAgICAgZWxzZSBpZiBAbnVtSGlnaGxpZ2h0cygpID09IDRcbiAgICAgICAgICAgICAgICBpZiBhcmVTYW1lUmFuZ2VzIFtoc1sxXSwgaHNbMl1dLCBAc2VsZWN0aW9ucygpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbaHNbMF0sIGhzWzNdXVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtoc1sxXSwgaHNbMl1dXG5cbiJdfQ==
//# sourceURL=../../../coffee/editor/actions/surround.coffee