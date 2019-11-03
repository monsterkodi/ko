// koffee 1.4.0
var _, kerror, post, ref,
    indexOf = [].indexOf;

ref = require('kxk'), post = ref.post, kerror = ref.kerror, _ = ref._;

module.exports = {
    actions: {
        menu: 'Select',
        selectAll: {
            name: 'Select All',
            combo: 'command+a',
            accel: 'ctrl+a'
        },
        selectNone: {
            name: 'Deselect',
            combo: 'command+shift+a',
            accel: 'ctrl+shift+a'
        },
        selectInverted: {
            name: 'Invert Selection',
            text: 'selects all lines that have no cursors and no selections',
            combo: 'command+shift+i',
            accel: 'ctrl+shift+i'
        },
        selectNextHighlight: {
            separator: true,
            name: 'Select Next Highlight',
            combo: 'command+g',
            accel: 'ctrl+g'
        },
        selectPrevHighlight: {
            name: 'Select Previous Highlight',
            combo: 'command+shift+g',
            accel: 'ctrl+shift+g'
        },
        selectTextBetweenCursorsOrSurround: {
            name: 'Select Between Cursors, Brackets or Quotes',
            text: "select text between even cursors, if at least two cursors exist. \nselect text between highlighted brackets or quotes otherwise.",
            combo: 'command+alt+b',
            accel: 'alt+ctrl+b'
        },
        toggleStickySelection: {
            separator: true,
            name: 'Toggle Sticky Selection',
            text: 'current selection is not removed when adding new selections',
            combo: 'command+`',
            accel: "ctrl+'"
        }
    },
    selectSingleRange: function(r, opt) {
        var cursorX;
        if (r == null) {
            return kerror("Editor." + name + ".selectSingleRange -- undefined range!");
        }
        cursorX = (opt != null ? opt.before : void 0) ? r[1][0] : r[1][1];
        this["do"].start();
        this["do"].setCursors([[cursorX, r[0]]]);
        this["do"].select([r]);
        this["do"].end();
        return this;
    },
    toggleStickySelection: function() {
        if (this.stickySelection) {
            return this.endStickySelection();
        } else {
            return this.startStickySelection();
        }
    },
    startStickySelection: function() {
        this.stickySelection = true;
        post.emit('sticky', true);
        return this.emit('selection');
    },
    endStickySelection: function() {
        this.stickySelection = false;
        post.emit('sticky', false);
        return this.emit('selection');
    },
    startSelection: function(opt) {
        var c, j, len, ref1, sel;
        if (opt == null) {
            opt = {
                extend: false
            };
        }
        if (!(opt != null ? opt.extend : void 0)) {
            this.startSelectionCursors = null;
            if (!this.stickySelection) {
                this["do"].select([]);
            }
            return;
        }
        if (!this.startSelectionCursors || this.numCursors() !== this.startSelectionCursors.length) {
            this.startSelectionCursors = this["do"].cursors();
            if (this.numSelections()) {
                ref1 = this.startSelectionCursors;
                for (j = 0, len = ref1.length; j < len; j++) {
                    c = ref1[j];
                    if (sel = this.continuousSelectionAtPosInRanges(c, this["do"].selections())) {
                        if (isSamePos(sel[1], c)) {
                            c[0] = sel[0][0];
                            c[1] = sel[0][1];
                        }
                    }
                }
            }
            if (!this.stickySelection) {
                return this["do"].select(rangesFromPositions(this.startSelectionCursors));
            }
        }
    },
    endSelection: function(opt) {
        var ci, j, nc, newCursors, newSelection, oc, oldCursors, ranges, ref1, ref2;
        if (opt == null) {
            opt = {
                extend: false
            };
        }
        if (!(opt != null ? opt.extend : void 0)) {
            this.startSelectionCursors = null;
            if (!this.stickySelection) {
                this["do"].select([]);
            }
        } else {
            oldCursors = (ref1 = this.startSelectionCursors) != null ? ref1 : this["do"].cursors();
            newSelection = this.stickySelection && this["do"].selections() || [];
            newCursors = this["do"].cursors();
            if (oldCursors.length !== newCursors.length) {
                return kerror("Editor." + this.name + ".endSelection -- oldCursors.size != newCursors.size", oldCursors.length, newCursors.length);
            }
            for (ci = j = 0, ref2 = this["do"].numCursors(); 0 <= ref2 ? j < ref2 : j > ref2; ci = 0 <= ref2 ? ++j : --j) {
                oc = oldCursors[ci];
                nc = newCursors[ci];
                if ((oc == null) || (nc == null)) {
                    return kerror("Editor." + this.name + ".endSelection -- invalid cursors", oc, nc);
                } else {
                    ranges = this.rangesForLinesBetweenPositions(oc, nc, true);
                    newSelection = newSelection.concat(ranges);
                }
            }
            this["do"].select(newSelection);
        }
        return this.checkSalterMode();
    },
    addRangeToSelection: function(range) {
        var newSelections;
        this["do"].start();
        newSelections = this["do"].selections();
        newSelections.push(range);
        this["do"].setCursors(endPositionsFromRanges(newSelections), {
            main: 'last'
        });
        this["do"].select(newSelections);
        return this["do"].end();
    },
    removeSelectionAtIndex: function(si) {
        var newCursors, newSelections;
        this["do"].start();
        newSelections = this["do"].selections();
        newSelections.splice(si, 1);
        if (newSelections.length) {
            newCursors = endPositionsFromRanges(newSelections);
            this["do"].setCursors(newCursors, {
                main: (newCursors.length + si - 1) % newCursors.length
            });
        }
        this["do"].select(newSelections);
        return this["do"].end();
    },
    clearSelection: function() {
        return this.selectNone();
    },
    selectNone: function() {
        this["do"].start();
        this["do"].select([]);
        return this["do"].end();
    },
    selectAll: function() {
        this["do"].start();
        this["do"].select(this.rangesForAllLines());
        return this["do"].end();
    },
    selectInverted: function() {
        var invertedRanges, j, li, ref1, sc;
        invertedRanges = [];
        sc = this.selectedAndCursorLineIndices();
        for (li = j = 0, ref1 = this.numLines(); 0 <= ref1 ? j < ref1 : j > ref1; li = 0 <= ref1 ? ++j : --j) {
            if (indexOf.call(sc, li) < 0) {
                invertedRanges.push(this.rangeForLineAtIndex(li));
            }
        }
        if (invertedRanges.length) {
            this["do"].start();
            this["do"].setCursors([rangeStartPos(_.first(invertedRanges))]);
            this["do"].select(invertedRanges);
            return this["do"].end();
        }
    },
    selectTextBetweenCursorsOrSurround: function() {
        var c0, c1, i, j, newCursors, newSelections, oldCursors, ref1;
        if (this.numCursors() && this.numCursors() % 2 === 0) {
            this["do"].start();
            newSelections = [];
            newCursors = [];
            oldCursors = this["do"].cursors();
            for (i = j = 0, ref1 = oldCursors.length; j < ref1; i = j += 2) {
                c0 = oldCursors[i];
                c1 = oldCursors[i + 1];
                newSelections = newSelections.concat(this.rangesForLinesBetweenPositions(c0, c1));
                newCursors.push(c1);
            }
            this["do"].setCursors(newCursors);
            this["do"].select(newSelections);
            return this["do"].end();
        } else {
            return this.selectBetweenSurround();
        }
    },
    selectBetweenSurround: function() {
        var end, s, start, surr;
        if (surr = this.highlightsSurroundingCursor()) {
            this["do"].start();
            start = rangeEndPos(surr[0]);
            end = rangeStartPos(surr[1]);
            s = this.rangesForLinesBetweenPositions(start, end);
            s = cleanRanges(s);
            if (s.length) {
                this["do"].select(s);
                if (this["do"].numSelections()) {
                    this["do"].setCursors([rangeEndPos(_.last(s))], {
                        Main: 'closest'
                    });
                }
            }
            return this["do"].end();
        }
    },
    selectSurround: function() {
        var r, surr;
        if (surr = this.highlightsSurroundingCursor()) {
            this["do"].start();
            this["do"].select(surr);
            if (this["do"].numSelections()) {
                this["do"].setCursors((function() {
                    var j, len, ref1, results;
                    ref1 = this["do"].selections();
                    results = [];
                    for (j = 0, len = ref1.length; j < len; j++) {
                        r = ref1[j];
                        results.push(rangeEndPos(r));
                    }
                    return results;
                }).call(this), {
                    main: 'closest'
                });
            }
            return this["do"].end();
        }
    },
    selectNextHighlight: function() {
        var r, ref1, ref2, searchText;
        if (!this.numHighlights() && (typeof window !== "undefined" && window !== null)) {
            searchText = (ref1 = window.commandline.commands.find) != null ? ref1.currentText : void 0;
            if (searchText != null ? searchText.length : void 0) {
                this.highlightText(searchText);
            }
        }
        if (!this.numHighlights()) {
            return;
        }
        r = rangeAfterPosInRanges(this.cursorPos(), this.highlights());
        if (r != null) {
            r;
        } else {
            r = this.highlight(0);
        }
        if (r != null) {
            this.selectSingleRange(r, {
                before: ((ref2 = r[2]) != null ? ref2.clss : void 0) === 'close'
            });
            return typeof this.scrollCursorIntoView === "function" ? this.scrollCursorIntoView() : void 0;
        }
    },
    selectPrevHighlight: function() {
        var hs, r, ref1, searchText;
        if (!this.numHighlights() && (typeof window !== "undefined" && window !== null)) {
            searchText = (ref1 = window.commandline.commands.find) != null ? ref1.currentText : void 0;
            if (searchText != null ? searchText.length : void 0) {
                this.highlightText(searchText);
            }
        }
        if (!this.numHighlights()) {
            return;
        }
        hs = this.highlights();
        r = rangeBeforePosInRanges(this.cursorPos(), hs);
        if (r != null) {
            r;
        } else {
            r = _.last(hs);
        }
        if (r != null) {
            return this.selectSingleRange(r);
        }
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0aW9uLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBT0EsSUFBQSxvQkFBQTtJQUFBOztBQUFBLE1BQXNCLE9BQUEsQ0FBUSxLQUFSLENBQXRCLEVBQUUsZUFBRixFQUFRLG1CQUFSLEVBQWdCOztBQUVoQixNQUFNLENBQUMsT0FBUCxHQUVJO0lBQUEsT0FBQSxFQUNJO1FBQUEsSUFBQSxFQUFNLFFBQU47UUFFQSxTQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU8sWUFBUDtZQUNBLEtBQUEsRUFBTyxXQURQO1lBRUEsS0FBQSxFQUFPLFFBRlA7U0FISjtRQU9BLFVBQUEsRUFDSTtZQUFBLElBQUEsRUFBTyxVQUFQO1lBQ0EsS0FBQSxFQUFPLGlCQURQO1lBRUEsS0FBQSxFQUFPLGNBRlA7U0FSSjtRQVlBLGNBQUEsRUFDSTtZQUFBLElBQUEsRUFBTyxrQkFBUDtZQUNBLElBQUEsRUFBTywwREFEUDtZQUVBLEtBQUEsRUFBTyxpQkFGUDtZQUdBLEtBQUEsRUFBTyxjQUhQO1NBYko7UUFrQkEsbUJBQUEsRUFDSTtZQUFBLFNBQUEsRUFBVyxJQUFYO1lBQ0EsSUFBQSxFQUFPLHVCQURQO1lBRUEsS0FBQSxFQUFPLFdBRlA7WUFHQSxLQUFBLEVBQU8sUUFIUDtTQW5CSjtRQXdCQSxtQkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFPLDJCQUFQO1lBQ0EsS0FBQSxFQUFPLGlCQURQO1lBRUEsS0FBQSxFQUFPLGNBRlA7U0F6Qko7UUE2QkEsa0NBQUEsRUFDSTtZQUFBLElBQUEsRUFBTSw0Q0FBTjtZQUNBLElBQUEsRUFBTSxrSUFETjtZQUtBLEtBQUEsRUFBTyxlQUxQO1lBTUEsS0FBQSxFQUFPLFlBTlA7U0E5Qko7UUFzQ0EscUJBQUEsRUFDSTtZQUFBLFNBQUEsRUFBVyxJQUFYO1lBQ0EsSUFBQSxFQUFPLHlCQURQO1lBRUEsSUFBQSxFQUFPLDZEQUZQO1lBR0EsS0FBQSxFQUFPLFdBSFA7WUFJQSxLQUFB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QUFDLENBQUEsYUFBRCxDQUFlLFVBQWYsRUFBQTthQUZKOztRQUdBLElBQVUsQ0FBSSxJQUFDLENBQUEsYUFBRCxDQUFBLENBQWQ7QUFBQSxtQkFBQTs7UUFDQSxDQUFBLEdBQUkscUJBQUEsQ0FBc0IsSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUF0QixFQUFvQyxJQUFDLENBQUEsVUFBRCxDQUFBLENBQXBDOztZQUNKOztZQUFBLElBQUssSUFBQyxDQUFBLFNBQUQsQ0FBVyxDQUFYOztRQUNMLElBQUcsU0FBSDtZQUNJLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixDQUFuQixFQUFzQjtnQkFBQSxNQUFBLCtCQUFXLENBQUUsY0FBTixLQUFjLE9BQXJCO2FBQXRCO3FFQUNBLElBQUMsQ0FBQSxnQ0FGTDs7SUFSaUIsQ0F6UHJCO0lBcVFBLG1CQUFBLEVBQXFCLFNBQUE7QUFFakIsWUFBQTtRQUFBLElBQUcsQ0FBSSxJQUFDLENBQUEsYUFBRCxDQUFBLENBQUosSUFBeUIsa0RBQTVCO1lBQ0ksVUFBQSwyREFBNkMsQ0FBRTtZQUMvQyx5QkFBNkIsVUFBVSxDQUFFLGVBQXpDO2dCQUFBLElBQUMsQ0FBQSxhQUFELENBQWUsVUFBZixFQUFBO2FBRko7O1FBR0EsSUFBVSxDQUFJLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBZDtBQUFBLG1CQUFBOztRQUNBLEVBQUEsR0FBSyxJQUFDLENBQUEsVUFBRCxDQUFBO1FBQ0wsQ0FBQSxHQUFJLHNCQUFBLENBQXVCLElBQUMsQ0FBQSxTQUFELENBQUEsQ0FBdkIsRUFBcUMsRUFBckM7O1lBQ0o7O1lBQUEsSUFBSyxDQUFDLENBQUMsSUFBRixDQUFPLEVBQVA7O1FBQ0wsSUFBd0IsU0FBeEI7bUJBQUEsSUFBQyxDQUFBLGlCQUFELENBQW1CLENBQW5CLEVBQUE7O0lBVGlCLENBclFyQiIsInNvdXJjZXNDb250ZW50IjpbIlxuIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4jIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDBcbiMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuIyAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4jIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxueyBwb3N0LCBrZXJyb3IsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxubW9kdWxlLmV4cG9ydHMgPVxuICAgIFxuICAgIGFjdGlvbnM6XG4gICAgICAgIG1lbnU6ICdTZWxlY3QnXG4gICAgICAgIFxuICAgICAgICBzZWxlY3RBbGw6XG4gICAgICAgICAgICBuYW1lOiAgJ1NlbGVjdCBBbGwnXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrYSdcbiAgICAgICAgICAgIGFjY2VsOiAnY3RybCthJ1xuICAgICAgICAgICAgXG4gICAgICAgIHNlbGVjdE5vbmU6XG4gICAgICAgICAgICBuYW1lOiAgJ0Rlc2VsZWN0J1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK3NoaWZ0K2EnXG4gICAgICAgICAgICBhY2NlbDogJ2N0cmwrc2hpZnQrYSdcbiAgICAgICAgICAgIFxuICAgICAgICBzZWxlY3RJbnZlcnRlZDpcbiAgICAgICAgICAgIG5hbWU6ICAnSW52ZXJ0IFNlbGVjdGlvbidcbiAgICAgICAgICAgIHRleHQ6ICAnc2VsZWN0cyBhbGwgbGluZXMgdGhhdCBoYXZlIG5vIGN1cnNvcnMgYW5kIG5vIHNlbGVjdGlvbnMnXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrc2hpZnQraSdcbiAgICAgICAgICAgIGFjY2VsOiAnY3RybCtzaGlmdCtpJ1xuICAgICAgICAgICAgXG4gICAgICAgIHNlbGVjdE5leHRIaWdobGlnaHQ6XG4gICAgICAgICAgICBzZXBhcmF0b3I6IHRydWVcbiAgICAgICAgICAgIG5hbWU6ICAnU2VsZWN0IE5leHQgSGlnaGxpZ2h0J1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK2cnXG4gICAgICAgICAgICBhY2NlbDogJ2N0cmwrZydcbiAgICAgICAgICAgIFxuICAgICAgICBzZWxlY3RQcmV2SGlnaGxpZ2h0OlxuICAgICAgICAgICAgbmFtZTogICdTZWxlY3QgUHJldmlvdXMgSGlnaGxpZ2h0J1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK3NoaWZ0K2cnXG4gICAgICAgICAgICBhY2NlbDogJ2N0cmwrc2hpZnQrZydcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBzZWxlY3RUZXh0QmV0d2VlbkN1cnNvcnNPclN1cnJvdW5kOlxuICAgICAgICAgICAgbmFtZTogJ1NlbGVjdCBCZXR3ZWVuIEN1cnNvcnMsIEJyYWNrZXRzIG9yIFF1b3RlcydcbiAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgICAgIHNlbGVjdCB0ZXh0IGJldHdlZW4gZXZlbiBjdXJzb3JzLCBpZiBhdCBsZWFzdCB0d28gY3Vyc29ycyBleGlzdC4gXG4gICAgICAgICAgICAgICAgc2VsZWN0IHRleHQgYmV0d2VlbiBoaWdobGlnaHRlZCBicmFja2V0cyBvciBxdW90ZXMgb3RoZXJ3aXNlLlxuICAgICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK2FsdCtiJ1xuICAgICAgICAgICAgYWNjZWw6ICdhbHQrY3RybCtiJ1xuXG4gICAgICAgIHRvZ2dsZVN0aWNreVNlbGVjdGlvbjpcbiAgICAgICAgICAgIHNlcGFyYXRvcjogdHJ1ZVxuICAgICAgICAgICAgbmFtZTogICdUb2dnbGUgU3RpY2t5IFNlbGVjdGlvbidcbiAgICAgICAgICAgIHRleHQ6ICAnY3VycmVudCBzZWxlY3Rpb24gaXMgbm90IHJlbW92ZWQgd2hlbiBhZGRpbmcgbmV3IHNlbGVjdGlvbnMnXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrYCdcbiAgICAgICAgICAgIGFjY2VsOiBcImN0cmwrJ1wiXG4gICAgICAgICAgICBcbiAgICBzZWxlY3RTaW5nbGVSYW5nZTogKHIsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCByP1xuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcIkVkaXRvci4je25hbWV9LnNlbGVjdFNpbmdsZVJhbmdlIC0tIHVuZGVmaW5lZCByYW5nZSFcIlxuICAgICAgICAgICAgXG4gICAgICAgIGN1cnNvclggPSBpZiBvcHQ/LmJlZm9yZSB0aGVuIHJbMV1bMF0gZWxzZSByWzFdWzFdXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIFtbY3Vyc29yWCwgclswXV1dXG4gICAgICAgIEBkby5zZWxlY3QgW3JdXG4gICAgICAgIEBkby5lbmQoKVxuICAgICAgICBAXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgICAwMDAwMCAgICBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICB0b2dnbGVTdGlja3lTZWxlY3Rpb246IC0+XG5cbiAgICAgICAgaWYgQHN0aWNreVNlbGVjdGlvbiB0aGVuIEBlbmRTdGlja3lTZWxlY3Rpb24oKVxuICAgICAgICBlbHNlIEBzdGFydFN0aWNreVNlbGVjdGlvbigpXG4gICAgXG4gICAgc3RhcnRTdGlja3lTZWxlY3Rpb246IC0+XG4gICAgICAgIFxuICAgICAgICBAc3RpY2t5U2VsZWN0aW9uID0gdHJ1ZVxuICAgICAgICBwb3N0LmVtaXQgJ3N0aWNreScsIHRydWVcbiAgICAgICAgQGVtaXQgJ3NlbGVjdGlvbidcblxuICAgIGVuZFN0aWNreVNlbGVjdGlvbjogLT5cbiAgICAgICAgXG4gICAgICAgIEBzdGlja3lTZWxlY3Rpb24gPSBmYWxzZVxuICAgICAgICBwb3N0LmVtaXQgJ3N0aWNreScsIGZhbHNlXG4gICAgICAgIEBlbWl0ICdzZWxlY3Rpb24nXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgICAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAgICAgICAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICAgIDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBzdGFydFNlbGVjdGlvbjogKG9wdCA9IGV4dGVuZDpmYWxzZSkgLT5cblxuICAgICAgICBpZiBub3Qgb3B0Py5leHRlbmRcbiAgICAgICAgICAgIEBzdGFydFNlbGVjdGlvbkN1cnNvcnMgPSBudWxsXG4gICAgICAgICAgICBpZiBub3QgQHN0aWNreVNlbGVjdGlvblxuICAgICAgICAgICAgICAgIEBkby5zZWxlY3QgW11cbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIG5vdCBAc3RhcnRTZWxlY3Rpb25DdXJzb3JzIG9yIEBudW1DdXJzb3JzKCkgIT0gQHN0YXJ0U2VsZWN0aW9uQ3Vyc29ycy5sZW5ndGhcbiAgICAgICAgICAgIEBzdGFydFNlbGVjdGlvbkN1cnNvcnMgPSBAZG8uY3Vyc29ycygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEBudW1TZWxlY3Rpb25zKClcbiAgICAgICAgICAgICAgICBmb3IgYyBpbiBAc3RhcnRTZWxlY3Rpb25DdXJzb3JzXG4gICAgICAgICAgICAgICAgICAgIGlmIHNlbCA9IEBjb250aW51b3VzU2VsZWN0aW9uQXRQb3NJblJhbmdlcyBjLCBAZG8uc2VsZWN0aW9ucygpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBpc1NhbWVQb3Mgc2VsWzFdLCBjXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY1swXSA9IHNlbFswXVswXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNbMV0gPSBzZWxbMF1bMV1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgbm90IEBzdGlja3lTZWxlY3Rpb25cbiAgICAgICAgICAgICAgICBAZG8uc2VsZWN0IHJhbmdlc0Zyb21Qb3NpdGlvbnMgQHN0YXJ0U2VsZWN0aW9uQ3Vyc29yc1xuICAgICAgICAgICAgICAgICAgICBcbiAgICBlbmRTZWxlY3Rpb246IChvcHQgPSBleHRlbmQ6ZmFsc2UpIC0+XG5cbiAgICAgICAgaWYgbm90IG9wdD8uZXh0ZW5kIFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAc3RhcnRTZWxlY3Rpb25DdXJzb3JzID0gbnVsbFxuICAgICAgICAgICAgaWYgbm90IEBzdGlja3lTZWxlY3Rpb25cbiAgICAgICAgICAgICAgICBAZG8uc2VsZWN0IFtdXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgb2xkQ3Vyc29ycyAgID0gQHN0YXJ0U2VsZWN0aW9uQ3Vyc29ycyA/IEBkby5jdXJzb3JzKClcbiAgICAgICAgICAgIG5ld1NlbGVjdGlvbiA9IEBzdGlja3lTZWxlY3Rpb24gYW5kIEBkby5zZWxlY3Rpb25zKCkgb3IgW10gICAgICAgICAgICBcbiAgICAgICAgICAgIG5ld0N1cnNvcnMgICA9IEBkby5jdXJzb3JzKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgb2xkQ3Vyc29ycy5sZW5ndGggIT0gbmV3Q3Vyc29ycy5sZW5ndGhcbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiRWRpdG9yLiN7QG5hbWV9LmVuZFNlbGVjdGlvbiAtLSBvbGRDdXJzb3JzLnNpemUgIT0gbmV3Q3Vyc29ycy5zaXplXCIsIG9sZEN1cnNvcnMubGVuZ3RoLCBuZXdDdXJzb3JzLmxlbmd0aFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgY2kgaW4gWzAuLi5AZG8ubnVtQ3Vyc29ycygpXVxuICAgICAgICAgICAgICAgIG9jID0gb2xkQ3Vyc29yc1tjaV1cbiAgICAgICAgICAgICAgICBuYyA9IG5ld0N1cnNvcnNbY2ldXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgbm90IG9jPyBvciBub3QgbmM/XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJFZGl0b3IuI3tAbmFtZX0uZW5kU2VsZWN0aW9uIC0tIGludmFsaWQgY3Vyc29yc1wiLCBvYywgbmNcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlcyA9IEByYW5nZXNGb3JMaW5lc0JldHdlZW5Qb3NpdGlvbnMgb2MsIG5jLCB0cnVlICM8IGV4dGVuZCB0byBmdWxsIGxpbmVzIGlmIGN1cnNvciBhdCBzdGFydCBvZiBsaW5lICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBuZXdTZWxlY3Rpb24gPSBuZXdTZWxlY3Rpb24uY29uY2F0IHJhbmdlc1xuICAgIFxuICAgICAgICAgICAgQGRvLnNlbGVjdCBuZXdTZWxlY3Rpb25cbiAgICAgICAgICAgIFxuICAgICAgICBAY2hlY2tTYWx0ZXJNb2RlKCkgICAgICBcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBhZGRSYW5nZVRvU2VsZWN0aW9uOiAocmFuZ2UpIC0+XG4gICAgICAgIFxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBuZXdTZWxlY3Rpb25zID0gQGRvLnNlbGVjdGlvbnMoKVxuICAgICAgICBuZXdTZWxlY3Rpb25zLnB1c2ggcmFuZ2VcbiAgICAgICAgXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIGVuZFBvc2l0aW9uc0Zyb21SYW5nZXMobmV3U2VsZWN0aW9ucyksIG1haW46J2xhc3QnXG4gICAgICAgIEBkby5zZWxlY3QgbmV3U2VsZWN0aW9uc1xuICAgICAgICBAZG8uZW5kKClcblxuICAgIHJlbW92ZVNlbGVjdGlvbkF0SW5kZXg6IChzaSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIG5ld1NlbGVjdGlvbnMgPSBAZG8uc2VsZWN0aW9ucygpXG4gICAgICAgIG5ld1NlbGVjdGlvbnMuc3BsaWNlIHNpLCAxXG4gICAgICAgIGlmIG5ld1NlbGVjdGlvbnMubGVuZ3RoXG4gICAgICAgICAgICBuZXdDdXJzb3JzID0gZW5kUG9zaXRpb25zRnJvbVJhbmdlcyBuZXdTZWxlY3Rpb25zXG4gICAgICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzLCBtYWluOihuZXdDdXJzb3JzLmxlbmd0aCtzaS0xKSAlIG5ld0N1cnNvcnMubGVuZ3RoXG4gICAgICAgIEBkby5zZWxlY3QgbmV3U2VsZWN0aW9uc1xuICAgICAgICBAZG8uZW5kKCkgICAgICAgIFxuXG4gICAgY2xlYXJTZWxlY3Rpb246IC0+IEBzZWxlY3ROb25lKClcbiAgICBzZWxlY3ROb25lOiAtPiBcbiAgICAgICAgXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5zZWxlY3QgW11cbiAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgIFxuICAgIHNlbGVjdEFsbDogLT5cbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgQGRvLnNlbGVjdCBAcmFuZ2VzRm9yQWxsTGluZXMoKVxuICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBzZWxlY3RJbnZlcnRlZDogLT5cbiAgICAgICAgXG4gICAgICAgIGludmVydGVkUmFuZ2VzID0gW10gICAgICAgIFxuICAgICAgICBzYyA9IEBzZWxlY3RlZEFuZEN1cnNvckxpbmVJbmRpY2VzKClcbiAgICAgICAgZm9yIGxpIGluIFswLi4uQG51bUxpbmVzKCldXG4gICAgICAgICAgICBpZiBsaSBub3QgaW4gc2NcbiAgICAgICAgICAgICAgICBpbnZlcnRlZFJhbmdlcy5wdXNoIEByYW5nZUZvckxpbmVBdEluZGV4IGxpXG4gICAgICAgIGlmIGludmVydGVkUmFuZ2VzLmxlbmd0aFxuICAgICAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgICAgIEBkby5zZXRDdXJzb3JzIFtyYW5nZVN0YXJ0UG9zIF8uZmlyc3QgaW52ZXJ0ZWRSYW5nZXNdXG4gICAgICAgICAgICBAZG8uc2VsZWN0IGludmVydGVkUmFuZ2VzXG4gICAgICAgICAgICBAZG8uZW5kKCkgICAgIFxuXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwMCAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAgMDAwICAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBzZWxlY3RUZXh0QmV0d2VlbkN1cnNvcnNPclN1cnJvdW5kOiAtPlxuXG4gICAgICAgIGlmIEBudW1DdXJzb3JzKCkgYW5kIEBudW1DdXJzb3JzKCkgJSAyID09IDAgIFxuICAgICAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgICAgIG5ld1NlbGVjdGlvbnMgPSBbXVxuICAgICAgICAgICAgbmV3Q3Vyc29ycyA9IFtdXG4gICAgICAgICAgICBvbGRDdXJzb3JzID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICAgICAgZm9yIGkgaW4gWzAuLi5vbGRDdXJzb3JzLmxlbmd0aF0gYnkgMlxuICAgICAgICAgICAgICAgIGMwID0gb2xkQ3Vyc29yc1tpXVxuICAgICAgICAgICAgICAgIGMxID0gb2xkQ3Vyc29yc1tpKzFdXG4gICAgICAgICAgICAgICAgbmV3U2VsZWN0aW9ucyA9IG5ld1NlbGVjdGlvbnMuY29uY2F0IEByYW5nZXNGb3JMaW5lc0JldHdlZW5Qb3NpdGlvbnMgYzAsIGMxXG4gICAgICAgICAgICAgICAgbmV3Q3Vyc29ycy5wdXNoIGMxXG4gICAgICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzXG4gICAgICAgICAgICBAZG8uc2VsZWN0IG5ld1NlbGVjdGlvbnNcbiAgICAgICAgICAgIEBkby5lbmQoKVxuICAgICAgICBlbHNlIEBzZWxlY3RCZXR3ZWVuU3Vycm91bmQoKVxuXG4gICAgc2VsZWN0QmV0d2VlblN1cnJvdW5kOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgc3VyciA9IEBoaWdobGlnaHRzU3Vycm91bmRpbmdDdXJzb3IoKVxuICAgICAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgICAgIHN0YXJ0ID0gcmFuZ2VFbmRQb3Mgc3VyclswXVxuICAgICAgICAgICAgZW5kID0gcmFuZ2VTdGFydFBvcyBzdXJyWzFdXG4gICAgICAgICAgICBzID0gQHJhbmdlc0ZvckxpbmVzQmV0d2VlblBvc2l0aW9ucyBzdGFydCwgZW5kXG4gICAgICAgICAgICBzID0gY2xlYW5SYW5nZXMgc1xuICAgICAgICAgICAgaWYgcy5sZW5ndGhcbiAgICAgICAgICAgICAgICBAZG8uc2VsZWN0IHNcbiAgICAgICAgICAgICAgICBpZiBAZG8ubnVtU2VsZWN0aW9ucygpXG4gICAgICAgICAgICAgICAgICAgIEBkby5zZXRDdXJzb3JzIFtyYW5nZUVuZFBvcyhfLmxhc3QgcyldLCBNYWluOiAnY2xvc2VzdCdcbiAgICAgICAgICAgIEBkby5lbmQoKVxuICAgICAgICAgICAgXG4gICAgc2VsZWN0U3Vycm91bmQ6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBzdXJyID0gQGhpZ2hsaWdodHNTdXJyb3VuZGluZ0N1cnNvcigpXG4gICAgICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICAgICAgQGRvLnNlbGVjdCBzdXJyXG4gICAgICAgICAgICBpZiBAZG8ubnVtU2VsZWN0aW9ucygpXG4gICAgICAgICAgICAgICAgQGRvLnNldEN1cnNvcnMgKHJhbmdlRW5kUG9zKHIpIGZvciByIGluIEBkby5zZWxlY3Rpb25zKCkpLCBtYWluOiAnY2xvc2VzdCdcbiAgICAgICAgICAgIEBkby5lbmQoKVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAgICAgXG4gICAgc2VsZWN0TmV4dEhpZ2hsaWdodDogLT4gIyBjb21tYW5kK2dcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAbnVtSGlnaGxpZ2h0cygpIGFuZCB3aW5kb3c/ICMgPCB0aGlzIHN1Y2tzXG4gICAgICAgICAgICBzZWFyY2hUZXh0ID0gd2luZG93LmNvbW1hbmRsaW5lLmNvbW1hbmRzLmZpbmQ/LmN1cnJlbnRUZXh0XG4gICAgICAgICAgICBAaGlnaGxpZ2h0VGV4dCBzZWFyY2hUZXh0IGlmIHNlYXJjaFRleHQ/Lmxlbmd0aFxuICAgICAgICByZXR1cm4gaWYgbm90IEBudW1IaWdobGlnaHRzKClcbiAgICAgICAgciA9IHJhbmdlQWZ0ZXJQb3NJblJhbmdlcyBAY3Vyc29yUG9zKCksIEBoaWdobGlnaHRzKClcbiAgICAgICAgciA/PSBAaGlnaGxpZ2h0IDBcbiAgICAgICAgaWYgcj9cbiAgICAgICAgICAgIEBzZWxlY3RTaW5nbGVSYW5nZSByLCBiZWZvcmU6clsyXT8uY2xzcyA9PSAnY2xvc2UnXG4gICAgICAgICAgICBAc2Nyb2xsQ3Vyc29ySW50b1ZpZXc/KCkgIyA8IHRoaXMgYWxzbyBzdWNrc1xuXG4gICAgc2VsZWN0UHJldkhpZ2hsaWdodDogLT4gIyBjb21tYW5kK3NoaWZ0K2dcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAbnVtSGlnaGxpZ2h0cygpIGFuZCB3aW5kb3c/ICMgPCB0aGlzIHN1Y2tzXG4gICAgICAgICAgICBzZWFyY2hUZXh0ID0gd2luZG93LmNvbW1hbmRsaW5lLmNvbW1hbmRzLmZpbmQ/LmN1cnJlbnRUZXh0XG4gICAgICAgICAgICBAaGlnaGxpZ2h0VGV4dCBzZWFyY2hUZXh0IGlmIHNlYXJjaFRleHQ/Lmxlbmd0aFxuICAgICAgICByZXR1cm4gaWYgbm90IEBudW1IaWdobGlnaHRzKClcbiAgICAgICAgaHMgPSBAaGlnaGxpZ2h0cygpXG4gICAgICAgIHIgPSByYW5nZUJlZm9yZVBvc0luUmFuZ2VzIEBjdXJzb3JQb3MoKSwgaHNcbiAgICAgICAgciA/PSBfLmxhc3QgaHNcbiAgICAgICAgQHNlbGVjdFNpbmdsZVJhbmdlIHIgaWYgcj9cblxuIl19
//# sourceURL=../../../coffee/editor/actions/selection.coffee