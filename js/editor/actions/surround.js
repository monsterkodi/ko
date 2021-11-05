// koffee 1.16.0
var _, os, ref, reversed;

ref = require('kxk'), _ = ref._, os = ref.os, reversed = ref.reversed;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3Vycm91bmQuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4vY29mZmVlL2VkaXRvci9hY3Rpb25zIiwic291cmNlcyI6WyJzdXJyb3VuZC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQU9BLElBQUE7O0FBQUEsTUFBc0IsT0FBQSxDQUFRLEtBQVIsQ0FBdEIsRUFBRSxTQUFGLEVBQUssV0FBTCxFQUFTOztBQUVULE1BQU0sQ0FBQyxPQUFQLEdBRUk7SUFBQSxZQUFBLEVBQWMsU0FBQTtRQUVWLElBQUMsQ0FBQSxhQUFELEdBQWlCO1FBRWpCLElBQUMsQ0FBQSxhQUFELEdBQ0k7WUFBQSxHQUFBLEVBQUssQ0FBQyxJQUFELEVBQU8sR0FBUCxDQUFMO1lBQ0EsR0FBQSxFQUFLLENBQUMsR0FBRCxFQUFNLEdBQU4sQ0FETDtZQUVBLEdBQUEsRUFBSyxDQUFDLEdBQUQsRUFBTSxHQUFOLENBRkw7WUFHQSxHQUFBLEVBQUssQ0FBQyxHQUFELEVBQU0sR0FBTixDQUhMO1lBSUEsR0FBQSxFQUFLLENBQUMsR0FBRCxFQUFNLEdBQU4sQ0FKTDtZQUtBLEdBQUEsRUFBSyxDQUFDLEdBQUQsRUFBTSxHQUFOLENBTEw7WUFNQSxHQUFBLEVBQUssQ0FBQyxHQUFELEVBQU0sR0FBTixDQU5MO1lBT0EsR0FBQSxFQUFLLENBQUMsR0FBRCxFQUFNLEdBQU4sQ0FQTDtZQVFBLEdBQUEsRUFBSyxDQUFDLEdBQUQsRUFBTSxHQUFOLENBUkw7WUFTQSxHQUFBLEVBQUssQ0FBQyxHQUFELEVBQU0sR0FBTixDQVRMO1lBVUEsR0FBQSxFQUFLLENBQUMsR0FBRCxFQUFNLEdBQU4sQ0FWTDtZQVdBLEdBQUEsRUFBSyxDQUFDLEdBQUQsRUFBTSxHQUFOLENBWEw7O1FBYUosSUFBQyxDQUFBLGtCQUFELEdBQXNCLFdBQVcsQ0FBQyxLQUFaLENBQWtCLEVBQWxCO0FBRXRCLGdCQUFPLElBQUMsQ0FBQSxRQUFSO0FBQUEsaUJBQ1MsTUFEVDt1QkFDdUIsSUFBQyxDQUFBLGtCQUFE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QUEwQixDQUFDLENBQUMsSUFBRixDQUFPLElBQUMsQ0FBQSxhQUFSLENBQTFCLENBQS9CO2dCQUNJLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFBLEVBREo7YUFBQSxNQUFBO2dCQUdJLElBQUMsQ0FBQSxhQUFELEdBQWlCLEdBSHJCO2FBREo7O1FBTUEsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFVBQUosQ0FBZSxFQUFmO2VBRUE7SUExQ2tCLENBcEx0QjtJQXNPQSwyQkFBQSxFQUE2QixTQUFBO0FBRXpCLFlBQUE7UUFBQSxJQUFHLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBQSxHQUFtQixDQUFuQixLQUF3QixDQUEzQjtZQUNJLEVBQUEsR0FBSyxJQUFDLENBQUEsVUFBRCxDQUFBO1lBQ0wsVUFBQSxDQUFXLEVBQVg7WUFDQSxJQUFHLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBQSxLQUFvQixDQUF2QjtBQUNJLHVCQUFPLEdBRFg7YUFBQSxNQUVLLElBQUcsSUFBQyxDQUFBLGFBQUQsQ0FBQSxDQUFBLEtBQW9CLENBQXZCO2dCQUNELElBQUcsYUFBQSxDQUFjLENBQUMsRUFBRyxDQUFBLENBQUEsQ0FBSixFQUFRLEVBQUcsQ0FBQSxDQUFBLENBQVgsQ0FBZCxFQUE4QixJQUFDLENBQUEsVUFBRCxDQUFBLENBQTlCLENBQUg7QUFDSSwyQkFBTyxDQUFDLEVBQUcsQ0FBQSxDQUFBLENBQUosRUFBUSxFQUFHLENBQUEsQ0FBQSxDQUFYLEVBRFg7aUJBQUEsTUFBQTtBQUdJLDJCQUFPLENBQUMsRUFBRyxDQUFBLENBQUEsQ0FBSixFQUFRLEVBQUcsQ0FBQSxDQUFBLENBQVgsRUFIWDtpQkFEQzthQUxUOztJQUZ5QixDQXRPN0IiLCJzb3VyY2VzQ29udGVudCI6WyJcbiMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDBcbiMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgXG5cbnsgXywgb3MsIHJldmVyc2VkIH0gPSByZXF1aXJlICdreGsnXG5cbm1vZHVsZS5leHBvcnRzID1cblxuICAgIGluaXRTdXJyb3VuZDogLT5cbiAgICAgICAgXG4gICAgICAgIEBzdXJyb3VuZFN0YWNrID0gW11cblxuICAgICAgICBAc3Vycm91bmRQYWlycyA9IFxuICAgICAgICAgICAgJyMnOiBbJyN7JywgJ30nXSAjIDwtIHRoaXMgaGFzIHRvIGNvbWVcbiAgICAgICAgICAgICd7JzogWyd7JywgJ30nXSAgIyA8LSBiZWZvcmUgdGhhdFxuICAgICAgICAgICAgJ30nOiBbJ3snLCAnfSddXG4gICAgICAgICAgICAnWyc6IFsnWycsICddJ11cbiAgICAgICAgICAgICddJzogWydbJywgJ10nXVxuICAgICAgICAgICAgJygnOiBbJygnLCAnKSddXG4gICAgICAgICAgICAnKSc6IFsnKCcsICcpJ11cbiAgICAgICAgICAgICc8JzogWyc8JywgJz4nXVxuICAgICAgICAgICAgJz4nOiBbJzwnLCAnPiddXG4gICAgICAgICAgICBcIidcIjogW1wiJ1wiLCBcIidcIl1cbiAgICAgICAgICAgICdcIic6IFsnXCInLCAnXCInXVxuICAgICAgICAgICAgJyonOiBbJyonLCAnKiddICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIEBzdXJyb3VuZENoYXJhY3RlcnMgPSBcInt9W10oKVxcXCInXCIuc3BsaXQgJydcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBAZmlsZVR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2h0bWwnICAgdGhlbiBAc3Vycm91bmRDaGFyYWN0ZXJzID0gQHN1cnJvdW5kQ2hhcmFjdGVycy5jb25jYXQgWyc8JywnPiddXG4gICAgICAgICAgICB3aGVuICdjb2ZmZWUnLCAna29mZmVlJyB0aGVuIEBzdXJyb3VuZENoYXJhY3RlcnMucHVzaCAnIydcbiAgICAgICAgICAgIHdoZW4gJ21kJyAgICAgXG4gICAgICAgICAgICAgICAgQHN1cnJvdW5kQ2hhcmFjdGVycyA9IEBzdXJyb3VuZENoYXJhY3RlcnMuY29uY2F0IFsnKicsJzwnLCAnYCddXG4gICAgICAgICAgICAgICAgQHN1cnJvdW5kUGFpcnNbJzwnXSA9IFsnPCEtLScsICctLT4nXVxuICAgICAgICAgICAgICAgIEBzdXJyb3VuZFBhaXJzWydgJ10gPSBbJ2AnLCAnYCddXG4gICAgICAgICAgICAgICAgXG4gICAgaXNVbmJhbGFuY2VkU3Vycm91bmRDaGFyYWN0ZXI6IChjaCkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBjaCBpbiBbXCIjXCJdXG4gICAgICAgIFtjbCxjcl0gPSBAc3Vycm91bmRQYWlyc1tjaF1cbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIGNsLmxlbmd0aCA+IDFcbiAgICAgICAgZm9yIGN1cnNvciBpbiBAY3Vyc29ycygpXG4gICAgICAgICAgICBjb3VudCA9IDBcbiAgICAgICAgICAgIGZvciBjIGluIEBsaW5lKGN1cnNvclsxXSlcbiAgICAgICAgICAgICAgICBpZiBjID09IGNsXG4gICAgICAgICAgICAgICAgICAgIGNvdW50ICs9IDFcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGMgPT0gY3JcbiAgICAgICAgICAgICAgICAgICAgY291bnQgLT0gMVxuICAgICAgICAgICAgaWYgKChjbCA9PSBjcikgYW5kIChjb3VudCAlIDIpKSBvciAoKGNsICE9IGNyKSBhbmQgY291bnQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgXG4gICAgc2VsZWN0aW9uQ29udGFpbnNPbmx5UXVvdGVzOiAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gQHRleHRPZlNlbGVjdGlvbigpXG4gICAgICAgICAgICBjb250aW51ZSBpZiBjID09ICdcXG4nXG4gICAgICAgICAgICBpZiBjIG5vdCBpbiBbJ1wiJywgXCInXCJdXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIHRydWVcbiAgICBcbiAgICBpbnNlcnRUcmlwbGVRdW90ZXM6IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgQG51bUN1cnNvcnMoKSA+IDFcbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIEBudW1TZWxlY3Rpb25zKClcbiAgICAgICAgcCA9IEBjdXJzb3JQb3MoKVxuICAgICAgICBbYmVmb3JlLCBhZnRlcl0gPSBAc3BsaXRTdGF0ZUxpbmVBdFBvcyBAc3RhdGUsIHBcbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIG5vdCBiZWZvcmUuZW5kc1dpdGggJ1wiXCInXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBiZWZvcmUubGVuZ3RoID4gMiBhbmQgYmVmb3JlW2JlZm9yZS5sZW5ndGgtM10gPT0gJ1wiJ1xuICAgICAgICByZXR1cm4gZmFsc2UgaWYgYWZ0ZXIuc3RhcnRzV2l0aCAnXCInXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5jaGFuZ2UgcFsxXSwgYmVmb3JlICsgJ1wiXCJcIlwiJyArIGFmdGVyXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIFtbcFswXSsxLCBwWzFdXV1cbiAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgIHRydWVcbiAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBpbnNlcnRTdXJyb3VuZENoYXJhY3RlcjogKGNoKSAtPlxuXG4gICAgICAgIGlmIGNoID09ICdcIicgYW5kIEBmaWxlVHlwZSBpbiBbJ2NvZmZlZScgJ2tvZmZlZSddIGFuZCBAaW5zZXJ0VHJpcGxlUXVvdGVzKClcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAgICAgaWYgQGlzVW5iYWxhbmNlZFN1cnJvdW5kQ2hhcmFjdGVyIGNoXG4gICAgICAgICAgICByZXR1cm4gZmFsc2UgXG4gICAgICAgIFxuICAgICAgICBpZiBAbnVtU2VsZWN0aW9ucygpIGFuZCBjaCBpbiBbJ1wiJyBcIidcIl0gYW5kIEBzZWxlY3Rpb25Db250YWluc09ubHlRdW90ZXMoKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIFxuICAgICAgICBuZXdDdXJzb3JzID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICBcbiAgICAgICAgaWYgQHN1cnJvdW5kU3RhY2subGVuZ3RoXG4gICAgICAgICAgICBpZiBfLmxhc3QoQHN1cnJvdW5kU3RhY2spWzFdID09IGNoXG4gICAgICAgICAgICAgICAgZm9yIGMgaW4gbmV3Q3Vyc29yc1xuICAgICAgICAgICAgICAgICAgICBpZiBAZG8ubGluZShjWzFdKVtjWzBdXSAhPSBjaFxuICAgICAgICAgICAgICAgICAgICAgICAgQHN1cnJvdW5kU3RhY2sgPSBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBpZiBAc3Vycm91bmRTdGFjay5sZW5ndGggYW5kIF8ubGFzdChAc3Vycm91bmRTdGFjaylbMV0gPT0gY2hcbiAgICAgICAgICAgICAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgICAgICAgICAgICAgQHNlbGVjdE5vbmUoKVxuICAgICAgICAgICAgICAgICAgICBAZGVsZXRlRm9yd2FyZCgpXG4gICAgICAgICAgICAgICAgICAgIEBkby5lbmQoKVxuICAgICAgICAgICAgICAgICAgICBAc3Vycm91bmRTdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2UgXG4gICAgICAgIFxuICAgICAgICBpZiBjaCA9PSAnIycgYW5kIEBmaWxlVHlwZSBpbiBbJ2NvZmZlZScgJ2tvZmZlZSddICMgY2hlY2sgaWYgYW55IGN1cnNvciBvciBzZWxlY3Rpb24gaXMgaW5zaWRlIGEgc3RyaW5nXG4gICAgICAgICAgICBmb3VuZCA9IGZhbHNlXG4gICAgICAgICAgICBmb3IgcyBpbiBAZG8uc2VsZWN0aW9ucygpXG4gICAgICAgICAgICAgICAgaWYgQGlzUmFuZ2VJblN0cmluZyBzXG4gICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG5vdCBmb3VuZFxuICAgICAgICAgICAgICAgIGZvciBjIGluIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICAgICAgaWYgQGlzUmFuZ2VJblN0cmluZyByYW5nZUZvclBvcyBjXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IGZvdW5kXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgY2ggPT0gXCInXCIgYW5kIG5vdCBAbnVtU2VsZWN0aW9ucygpICMgY2hlY2sgaWYgYW55IGFscGFiZXRpY2FsIGNoYXJhY3RlciBpcyBiZWZvcmUgYW55IGN1cnNvclxuICAgICAgICAgICAgZm9yIGMgaW4gbmV3Q3Vyc29yc1xuICAgICAgICAgICAgICAgIGlmIGNbMF0gPiAwIGFuZCAvW0EtWmEtel0vLnRlc3QgQGRvLmxpbmUoY1sxXSlbY1swXS0xXSBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIFxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBpZiBAZG8ubnVtU2VsZWN0aW9ucygpID09IDBcbiAgICAgICAgICAgIG5ld1NlbGVjdGlvbnMgPSByYW5nZXNGcm9tUG9zaXRpb25zIG5ld0N1cnNvcnNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbmV3U2VsZWN0aW9ucyA9IEBkby5zZWxlY3Rpb25zKClcbiAgICAgICAgICAgIFxuICAgICAgICBbY2wsY3JdID0gQHN1cnJvdW5kUGFpcnNbY2hdXG4gICAgICAgICAgICBcbiAgICAgICAgQHN1cnJvdW5kU3RhY2sucHVzaCBbY2wsY3JdXG5cbiAgICAgICAgZm9yIG5zIGluIHJldmVyc2VkIG5ld1NlbGVjdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgY2wgPT0gJyN7JyAjIGNvbnZlcnQgc2luZ2xlIHN0cmluZyB0byBkb3VibGUgc3RyaW5nXG4gICAgICAgICAgICAgICAgaWYgc3IgPSBAcmFuZ2VPZlN0cmluZ1N1cnJvdW5kaW5nUmFuZ2UgbnNcbiAgICAgICAgICAgICAgICAgICAgaWYgQGRvLmxpbmUoc3JbMF0pW3NyWzFdWzBdXSA9PSBcIidcIlxuICAgICAgICAgICAgICAgICAgICAgICAgQGRvLmNoYW5nZSBuc1swXSwgQGRvLmxpbmUobnNbMF0pLnNwbGljZSBzclsxXVswXSwgMSwgJ1wiJ1xuICAgICAgICAgICAgICAgICAgICBpZiBAZG8ubGluZShzclswXSlbc3JbMV1bMV0tMV0gPT0gXCInXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIEBkby5jaGFuZ2UgbnNbMF0sIEBkby5saW5lKG5zWzBdKS5zcGxpY2Ugc3JbMV1bMV0tMSwgMSwgJ1wiJ1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBlbHNlIGlmIEBmaWxlVHlwZSBpbiBbJ2NvZmZlZScgJ2tvZmZlZSddIGFuZCBjbCA9PSAnKCcgYW5kIGxlbmd0aE9mUmFuZ2UobnMpID4gMCAjIHJlbW92ZSBzcGFjZSBhZnRlciBjYWxsZWVcbiAgICAgICAgICAgICAgICBbYmVmb3JlLCBhZnRlcl0gPSBAc3BsaXRTdGF0ZUxpbmVBdFBvcyBAZG8sIHJhbmdlU3RhcnRQb3MgbnNcbiAgICAgICAgICAgICAgICB0cmltbWVkID0gYmVmb3JlLnRyaW1SaWdodCgpXG4gICAgICAgICAgICAgICAgYmVmb3JlR29vZCA9IC9cXHckLy50ZXN0KHRyaW1tZWQpIGFuZCBub3QgLyhpZnx3aGVufGlufGFuZHxvcnxpc3xub3R8ZWxzZXxyZXR1cm4pJC8udGVzdCB0cmltbWVkXG4gICAgICAgICAgICAgICAgYWZ0ZXJHb29kID0gYWZ0ZXIudHJpbSgpLmxlbmd0aCBhbmQgbm90IGFmdGVyLnN0YXJ0c1dpdGggJyAnXG4gICAgICAgICAgICAgICAgaWYgYmVmb3JlR29vZCBhbmQgYWZ0ZXJHb29kXG4gICAgICAgICAgICAgICAgICAgIHNwYWNlcyA9IGJlZm9yZS5sZW5ndGgtdHJpbW1lZC5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgQGRvLmNoYW5nZSBuc1swXSwgQGRvLmxpbmUobnNbMF0pLnNwbGljZSB0cmltbWVkLmxlbmd0aCwgc3BhY2VzXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBmb3IgYyBpbiBwb3NpdGlvbnNBZnRlckxpbmVDb2xJblBvc2l0aW9ucyBuc1swXSwgbnNbMV1bMF0tMSwgbmV3Q3Vyc29yc1xuICAgICAgICAgICAgICAgICAgICAgICAgY1swXSAtPSBzcGFjZXNcbiAgICAgICAgICAgICAgICAgICAgbnNbMV1bMF0gLT0gc3BhY2VzXG4gICAgICAgICAgICAgICAgICAgIG5zWzFdWzFdIC09IHNwYWNlc1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIEBkby5jaGFuZ2UgbnNbMF0sIEBkby5saW5lKG5zWzBdKS5zcGxpY2UgbnNbMV1bMV0sIDAsIGNyXG4gICAgICAgICAgICBAZG8uY2hhbmdlIG5zWzBdLCBAZG8ubGluZShuc1swXSkuc3BsaWNlIG5zWzFdWzBdLCAwLCBjbFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgYyBpbiBwb3NpdGlvbnNBZnRlckxpbmVDb2xJblBvc2l0aW9ucyBuc1swXSwgbnNbMV1bMF0tMSwgbmV3Q3Vyc29yc1xuICAgICAgICAgICAgICAgIGNbMF0gKz0gY2wubGVuZ3RoXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3Igb3MgaW4gcmFuZ2VzQWZ0ZXJMaW5lQ29sSW5SYW5nZXMgbnNbMF0sIG5zWzFdWzFdLTEsIG5ld1NlbGVjdGlvbnNcbiAgICAgICAgICAgICAgICBvc1sxXVswXSArPSBjci5sZW5ndGhcbiAgICAgICAgICAgICAgICBvc1sxXVsxXSArPSBjci5sZW5ndGhcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBvcyBpbiByYW5nZXNBZnRlckxpbmVDb2xJblJhbmdlcyBuc1swXSwgbnNbMV1bMF0tMSwgbmV3U2VsZWN0aW9uc1xuICAgICAgICAgICAgICAgIG9zWzFdWzBdICs9IGNsLmxlbmd0aFxuICAgICAgICAgICAgICAgIG9zWzFdWzFdICs9IGNsLmxlbmd0aFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgYyBpbiBwb3NpdGlvbnNBZnRlckxpbmVDb2xJblBvc2l0aW9ucyBuc1swXSwgbnNbMV1bMV0sIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICBjWzBdICs9IGNyLmxlbmd0aFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBAZG8uc2VsZWN0IHJhbmdlc05vdEVtcHR5SW5SYW5nZXMgbmV3U2VsZWN0aW9uc1xuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzXG4gICAgICAgIEBkby5lbmQoKVxuICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgZGVsZXRlRW1wdHlTdXJyb3VuZHM6IC0+XG4gICAgICAgICAgICBcbiAgICAgICAgY3MgPSBAZG8uY3Vyc29ycygpXG5cbiAgICAgICAgcGFpcnMgPSBfLnVuaXFXaXRoIF8udmFsdWVzKEBzdXJyb3VuZFBhaXJzKSwgXy5pc0VxdWFsXG5cbiAgICAgICAgb3BlbkNsb3NlUGFpcnMgPSBbXVxuICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gY3NcbiAgICAgICAgICAgIG51bVBhaXJzID0gb3BlbkNsb3NlUGFpcnMubGVuZ3RoXG4gICAgICAgICAgICAjIGNoZWNrIGlmIGFsbCBjdXJzb3JzIGFyZSBpbnNpZGUgb2YgZW1wdHkgc3Vycm91bmQgcGFpcnNcbiAgICAgICAgICAgIGZvciBbc28sIHNjXSBpbiBwYWlyc1xuICAgICAgICAgICAgICAgIGJlZm9yZSA9IEBkby5saW5lKGNbMV0pLnNsaWNlIGNbMF0tc28ubGVuZ3RoLCBjWzBdXG4gICAgICAgICAgICAgICAgYWZ0ZXIgID0gQGRvLmxpbmUoY1sxXSkuc2xpY2UgY1swXSwgY1swXStzYy5sZW5ndGhcbiAgICAgICAgICAgICAgICBpZiBzbyA9PSBiZWZvcmUgYW5kIHNjID09IGFmdGVyXG4gICAgICAgICAgICAgICAgICAgIG9wZW5DbG9zZVBhaXJzLnB1c2ggW3NvLHNjXVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgaWYgbnVtUGFpcnMgPT0gb3BlbkNsb3NlUGFpcnMubGVuZ3RoXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlIFxuXG4gICAgICAgIGlmIGNzLmxlbmd0aCAhPSBvcGVuQ2xvc2VQYWlycy5sZW5ndGhcbiAgICAgICAgICAgIHJldHVybiBmYWxzZSBcbiAgICAgICAgICAgIFxuICAgICAgICAjIGFsbCBjdXJzb3JzIGluIGVtcHR5IHN1cnJvdW5kIC0+IHJlbW92ZSBib3RoIHN1cnJvdW5kc1xuICAgICAgICBcbiAgICAgICAgdW5pcXVlUGFpcnMgPSBfLnVuaXFXaXRoIG9wZW5DbG9zZVBhaXJzLCBfLmlzRXF1YWxcbiAgICAgICAgZm9yIGMgaW4gY3NcbiAgICAgICAgICAgIFtzbyxzY10gPSBvcGVuQ2xvc2VQYWlycy5zaGlmdCgpXG4gIFxuICAgICAgICAgICAgQGRvLmNoYW5nZSBjWzFdLCBAZG8ubGluZShjWzFdKS5zcGxpY2UgY1swXS1zby5sZW5ndGgsIHNvLmxlbmd0aCtzYy5sZW5ndGhcbiAgICAgICAgICAgIGZvciBuYyBpbiBwb3NpdGlvbnNBZnRlckxpbmVDb2xJblBvc2l0aW9ucyBjWzFdLCBjWzBdLCBjc1xuICAgICAgICAgICAgICAgIG5jWzBdIC09IHNjLmxlbmd0aCArIHNvLmxlbmd0aCBcbiAgICAgICAgICAgIGNbMF0gLT0gc28ubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICBpZiBAc3Vycm91bmRTdGFjay5sZW5ndGggIyBwb3Agb3IgY2xlYW4gc3Vycm91bmQgc3RhY2tcbiAgICAgICAgICAgIGlmIHVuaXF1ZVBhaXJzLmxlbmd0aCA9PSAxIGFuZCBfLmlzRXF1YWwgdW5pcXVlUGFpcnNbMF0sIF8ubGFzdCBAc3Vycm91bmRTdGFjayBcbiAgICAgICAgICAgICAgICBAc3Vycm91bmRTdGFjay5wb3AoKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBzdXJyb3VuZFN0YWNrID0gW11cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgY3NcbiAgICAgICAgXG4gICAgICAgIHRydWUgICAgXG4gICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgaGlnaGxpZ2h0c1N1cnJvdW5kaW5nQ3Vyc29yOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQG51bUhpZ2hsaWdodHMoKSAlIDIgPT0gMFxuICAgICAgICAgICAgaHMgPSBAaGlnaGxpZ2h0cygpXG4gICAgICAgICAgICBzb3J0UmFuZ2VzIGhzXG4gICAgICAgICAgICBpZiBAbnVtSGlnaGxpZ2h0cygpID09IDJcbiAgICAgICAgICAgICAgICByZXR1cm4gaHNcbiAgICAgICAgICAgIGVsc2UgaWYgQG51bUhpZ2hsaWdodHMoKSA9PSA0XG4gICAgICAgICAgICAgICAgaWYgYXJlU2FtZVJhbmdlcyBbaHNbMV0sIGhzWzJdXSwgQHNlbGVjdGlvbnMoKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2hzWzBdLCBoc1szXV1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbaHNbMV0sIGhzWzJdXVxuXG4iXX0=
//# sourceURL=../../../coffee/editor/actions/surround.coffee