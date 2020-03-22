// koffee 1.12.0

/*
 0000000  000   000  00000000    0000000   0000000   00000000
000       000   000  000   000  000       000   000  000   000
000       000   000  0000000    0000000   000   000  0000000  
000       000   000  000   000       000  000   000  000   000
 0000000   0000000   000   000  0000000    0000000   000   000
 */
var _, first, last, ref, reversed;

ref = require('kxk'), _ = ref._, first = ref.first, last = ref.last, reversed = ref.reversed;

module.exports = {
    actions: {
        menu: 'Cursors',
        cursorInAllLines: {
            name: 'Cursor in All Lines',
            combo: 'alt+a'
        },
        alignCursorsUp: {
            separator: true,
            name: 'Align Cursors with Top-most Cursor',
            combo: 'alt+ctrl+shift+up'
        },
        alignCursorsDown: {
            name: 'Align Cursors with Bottom-most Cursor',
            combo: 'alt+ctrl+shift+down'
        },
        alignCursorsLeft: {
            name: 'Align Cursors with Left-most Cursor'
        },
        alignCursorsRight: {
            name: 'Align Cursors with Right-most Cursor'
        },
        alignCursorsAndText: {
            name: 'Align Cursors and Text',
            text: 'align text to the right of cursors by inserting spaces',
            combo: 'alt+shift+a'
        },
        setCursorsAtSelectionBoundariesOrSelectSurround: {
            separator: true,
            name: 'Cursors at Selection Boundaries or Select Brackets/Quotes',
            text: "set cursors at selection boundaries, if a selection exists.\nselect brackets or quotes otherwise.",
            combo: 'command+alt+b',
            accel: 'alt+ctrl+b'
        },
        addCursorsUp: {
            separator: true,
            name: 'Add Cursors Up',
            combo: 'command+up',
            accel: 'ctrl+up'
        },
        addCursorsDown: {
            name: 'Add Cursors Down',
            combo: 'command+down',
            accel: 'ctrl+down'
        },
        delCursorsUp: {
            separator: true,
            name: 'Remove Cursors Up',
            combo: 'command+shift+up',
            accel: 'ctrl+shift+up'
        },
        delCursorsDown: {
            name: 'Remove Cursors Down',
            combo: 'command+shift+down',
            accel: 'ctrl+shift+down'
        },
        cursorMoves: {
            name: 'Move Cursors To Start',
            combos: ['ctrl+home', 'ctrl+end', 'page up', 'page down', 'ctrl+shift+home', 'ctrl+shift+end', 'shift+page up', 'shift+page down']
        }
    },
    singleCursorAtPos: function(p, opt) {
        var mc;
        if (opt == null) {
            opt = {
                extend: false
            };
        }
        if (this.numLines() === 0) {
            this["do"].start();
            this["do"].insert(0, '');
            this["do"].end();
        }
        p = this.clampPos(p);
        mc = this.mainCursor();
        if (p[0] === mc[0] && p[1] === mc[1] && this.numCursors() === 1) {
            return;
        }
        this["do"].start();
        this.startSelection(opt);
        this["do"].setCursors([[p[0], p[1]]]);
        this.endSelection(opt);
        return this["do"].end();
    },
    setCursor: function(c, l) {
        this["do"].start();
        this["do"].setCursors([[c, l]]);
        return this["do"].end();
    },
    cursorMoves: function(key, info) {
        var extend, ref1;
        extend = (ref1 = info != null ? info.extend : void 0) != null ? ref1 : 0 <= (info != null ? info.mod.indexOf('shift') : void 0);
        switch (key) {
            case 'home':
                return this.singleCursorAtPos([0, 0], {
                    extend: extend
                });
            case 'end':
                return this.singleCursorAtPos([0, this.numLines() - 1], {
                    extend: extend
                });
            case 'page up':
                return this.moveCursorsUp(extend, this.numFullLines() - 3);
            case 'page down':
                return this.moveCursorsDown(extend, this.numFullLines() - 3);
        }
    },
    setCursorsAtSelectionBoundariesOrSelectSurround: function() {
        var j, len, newCursors, ref1, s;
        if (this.numSelections()) {
            this["do"].start();
            newCursors = [];
            ref1 = this["do"].selections();
            for (j = 0, len = ref1.length; j < len; j++) {
                s = ref1[j];
                newCursors.push(rangeStartPos(s));
                newCursors.push(rangeEndPos(s));
            }
            this["do"].select([]);
            this["do"].setCursors(newCursors);
            return this["do"].end();
        } else {
            return this.selectSurround();
        }
    },
    toggleCursorAtPos: function(p) {
        if (isPosInPositions(p, this.state.cursors())) {
            return this.delCursorAtPos(p);
        } else {
            return this.addCursorAtPos(p);
        }
    },
    addCursorAtPos: function(p) {
        var newCursors;
        this["do"].start();
        newCursors = this["do"].cursors();
        newCursors.push(p);
        this["do"].setCursors(newCursors, {
            main: 'last'
        });
        return this["do"].end();
    },
    addCursorsUp: function() {
        return this.addCursors('up');
    },
    addCursorsDown: function() {
        return this.addCursors('down');
    },
    addCursors: function(key) {
        var c, d, dir, j, len, main, newCursors, oldCursors;
        dir = key;
        if (this.numCursors() >= 999) {
            return;
        }
        this["do"].start();
        d = (function() {
            switch (dir) {
                case 'up':
                    return -1;
                case 'down':
                    return +1;
            }
        })();
        oldCursors = this.state.cursors();
        newCursors = this["do"].cursors();
        for (j = 0, len = oldCursors.length; j < len; j++) {
            c = oldCursors[j];
            if (!isPosInPositions([c[0], c[1] + d], oldCursors)) {
                newCursors.push([c[0], c[1] + d]);
                if (newCursors.length >= 999) {
                    break;
                }
            }
        }
        sortPositions(newCursors);
        main = (function() {
            switch (dir) {
                case 'up':
                    return 'first';
                case 'down':
                    return 'last';
            }
        })();
        this["do"].setCursors(newCursors, {
            main: main
        });
        return this["do"].end();
    },
    cursorInAllLines: function() {
        var i;
        this["do"].start();
        this["do"].setCursors((function() {
            var j, ref1, results;
            results = [];
            for (i = j = 0, ref1 = this.numLines(); 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
                results.push([0, i]);
            }
            return results;
        }).call(this), {
            main: 'closest'
        });
        return this["do"].end();
    },
    cursorColumns: function(num, step) {
        var cp, i;
        if (step == null) {
            step = 1;
        }
        cp = this.cursorPos();
        this["do"].start();
        this["do"].setCursors((function() {
            var j, ref1, results;
            results = [];
            for (i = j = 0, ref1 = num; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
                results.push([cp[0] + i * step, cp[1]]);
            }
            return results;
        })(), {
            main: 'closest'
        });
        return this["do"].end();
    },
    cursorLines: function(num, step) {
        var cp, i;
        if (step == null) {
            step = 1;
        }
        cp = this.cursorPos();
        this["do"].start();
        this["do"].setCursors((function() {
            var j, ref1, results;
            results = [];
            for (i = j = 0, ref1 = num; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
                results.push([cp[0], cp[1] + i * step]);
            }
            return results;
        })(), {
            main: 'closest'
        });
        return this["do"].end();
    },
    alignCursorsAndText: function() {
        var c, cx, j, len, li, lines, nc, newCursors, newX;
        this["do"].start();
        newCursors = this["do"].cursors();
        newX = _.max((function() {
            var j, len, results;
            results = [];
            for (j = 0, len = newCursors.length; j < len; j++) {
                c = newCursors[j];
                results.push(c[0]);
            }
            return results;
        })());
        lines = {};
        for (j = 0, len = newCursors.length; j < len; j++) {
            nc = newCursors[j];
            lines[nc[1]] = nc[0];
            cursorSet(nc, newX, c[1]);
        }
        for (li in lines) {
            cx = lines[li];
            this["do"].change(li, this["do"].line(li).slice(0, cx) + _.padStart('', newX - cx) + this["do"].line(li).slice(cx));
        }
        this["do"].setCursors(newCursors);
        return this["do"].end();
    },
    alignCursorsUp: function() {
        return this.alignCursors('up');
    },
    alignCursorsLeft: function() {
        return this.alignCursors('left');
    },
    alignCursorsRight: function() {
        return this.alignCursors('right');
    },
    alignCursorsDown: function() {
        return this.alignCursors('down');
    },
    alignCursors: function(dir) {
        var c, charPos, j, len, main, newCursors;
        if (dir == null) {
            dir = 'down';
        }
        this["do"].start();
        newCursors = this["do"].cursors();
        charPos = (function() {
            switch (dir) {
                case 'up':
                    return first(newCursors)[0];
                case 'down':
                    return last(newCursors)[0];
                case 'left':
                    return _.min((function() {
                        var j, len, results;
                        results = [];
                        for (j = 0, len = newCursors.length; j < len; j++) {
                            c = newCursors[j];
                            results.push(c[0]);
                        }
                        return results;
                    })());
                case 'right':
                    return _.max((function() {
                        var j, len, results;
                        results = [];
                        for (j = 0, len = newCursors.length; j < len; j++) {
                            c = newCursors[j];
                            results.push(c[0]);
                        }
                        return results;
                    })());
            }
        })();
        for (j = 0, len = newCursors.length; j < len; j++) {
            c = newCursors[j];
            cursorSet(c, charPos, c[1]);
        }
        main = (function() {
            switch (dir) {
                case 'up':
                    return 'first';
                case 'down':
                    return 'last';
            }
        })();
        this["do"].setCursors(newCursors, {
            main: main
        });
        return this["do"].end();
    },
    delCursorAtPos: function(p) {
        var c, newCursors, oldCursors;
        oldCursors = this.state.cursors();
        c = posInPositions(p, oldCursors);
        if (c && this.numCursors() > 1) {
            this["do"].start();
            newCursors = this["do"].cursors();
            newCursors.splice(oldCursors.indexOf(c), 1);
            this["do"].setCursors(newCursors, {
                main: 'closest'
            });
            return this["do"].end();
        }
    },
    delCursorsUp: function() {
        return this.delCursors('up');
    },
    delCursorsDown: function() {
        return this.delCursors('down');
    },
    delCursors: function(key, info) {
        var c, ci, d, dir, newCursors;
        dir = key;
        this["do"].start();
        newCursors = this["do"].cursors();
        d = (function() {
            var j, k, len, len1, ref1, ref2, results, results1;
            switch (dir) {
                case 'up':
                    ref1 = this["do"].cursors();
                    results = [];
                    for (j = 0, len = ref1.length; j < len; j++) {
                        c = ref1[j];
                        if (isPosInPositions([c[0], c[1] - 1], newCursors) && !isPosInPositions([c[0], c[1] + 1], newCursors)) {
                            ci = newCursors.indexOf(c);
                            results.push(newCursors.splice(ci, 1));
                        } else {
                            results.push(void 0);
                        }
                    }
                    return results;
                    break;
                case 'down':
                    ref2 = reversed(newCursors);
                    results1 = [];
                    for (k = 0, len1 = ref2.length; k < len1; k++) {
                        c = ref2[k];
                        if (isPosInPositions([c[0], c[1] + 1], newCursors) && !isPosInPositions([c[0], c[1] - 1], newCursors)) {
                            ci = newCursors.indexOf(c);
                            results1.push(newCursors.splice(ci, 1));
                        } else {
                            results1.push(void 0);
                        }
                    }
                    return results1;
            }
        }).call(this);
        this["do"].setCursors(newCursors, {
            main: 'closest'
        });
        return this["do"].end();
    },
    clearCursors: function() {
        this["do"].start();
        this["do"].setCursors([this.mainCursor()]);
        return this["do"].end();
    },
    clearCursorsAndHighlights: function() {
        this.clearCursors();
        return this.clearHighlights();
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uL2NvZmZlZS9lZGl0b3IvYWN0aW9ucyIsInNvdXJjZXMiOlsiY3Vyc29yLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUErQixPQUFBLENBQVEsS0FBUixDQUEvQixFQUFFLFNBQUYsRUFBSyxpQkFBTCxFQUFZLGVBQVosRUFBa0I7O0FBRWxCLE1BQU0sQ0FBQyxPQUFQLEdBRUk7SUFBQSxPQUFBLEVBQ0k7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUVBLGdCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU8scUJBQVA7WUFDQSxLQUFBLEVBQU8sT0FEUDtTQUhKO1FBTUEsY0FBQSxFQUNJO1lBQUEsU0FBQSxFQUFXLElBQVg7WUFDQSxJQUFBLEVBQU0sb0NBRE47WUFFQSxLQUFBLEVBQU8sbUJBRlA7U0FQSjtRQVdBLGdCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU0sdUNBQU47WUFDQSxLQUFBLEVBQU8scUJBRFA7U0FaSjtRQWVBLGdCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU0scUNBQU47U0FoQko7UUFtQkEsaUJBQUEsRUFDSTtZQUFBLElBQUEsRUFBTSxzQ0FBTjtTQXBCSjtRQXVCQSxtQkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFNLHdCQUFOO1lBQ0EsSUFBQSxFQUFNLHdEQUROO1lBRUEsS0FBQSxFQUFPLGFBRlA7U0F4Qko7UUE0QkEsK0NBQUEsRUFDSTtZQUFBLFNBQUEsRUFBVyxJQUFYO1lBQ0EsSUFBQSxFQUFNLDJEQUROO1lBRUEsSUFBQSxFQUFNLG1HQUZOO1lBTUEsS0FBQSxFQUFPLGVBTlA7WUFPQSxLQUFBLEVBQU8sWUFQUDtTQTdCSjtRQXNDQSxZQUFBLEVBQ0k7WUFBQSxTQUFBLEVBQVcsSUFBWDtZQUNBLElBQUEsRUFBTSxnQkFETjtZQUVBLEtBQUEsRUFBTyxZQUZQO1lBR0EsS0FBQSxFQUFPLFNBSFA7U0F2Q0o7UUE0Q0EsY0FB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QUE7a0RBQUE7O0FBREo7O0FBUEo7O1FBV0osSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFVBQUosQ0FBZSxVQUFmLEVBQTJCO1lBQUEsSUFBQSxFQUFLLFNBQUw7U0FBM0I7ZUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsR0FBSixDQUFBO0lBaEJRLENBblBaO0lBMlFBLFlBQUEsRUFBYyxTQUFBO1FBQ1YsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEtBQUosQ0FBQTtRQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxVQUFKLENBQWUsQ0FBQyxJQUFDLENBQUEsVUFBRCxDQUFBLENBQUQsQ0FBZjtlQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7SUFIVSxDQTNRZDtJQWdSQSx5QkFBQSxFQUEyQixTQUFBO1FBQ3ZCLElBQUMsQ0FBQSxZQUFELENBQUE7ZUFDQSxJQUFDLENBQUEsZUFBRCxDQUFBO0lBRnVCLENBaFIzQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiMjI1xuXG57IF8sIGZpcnN0LCBsYXN0LCByZXZlcnNlZCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5cbiAgICBhY3Rpb25zOlxuICAgICAgICBtZW51OiAnQ3Vyc29ycydcblxuICAgICAgICBjdXJzb3JJbkFsbExpbmVzOlxuICAgICAgICAgICAgbmFtZTogICdDdXJzb3IgaW4gQWxsIExpbmVzJ1xuICAgICAgICAgICAgY29tYm86ICdhbHQrYSdcblxuICAgICAgICBhbGlnbkN1cnNvcnNVcDpcbiAgICAgICAgICAgIHNlcGFyYXRvcjogdHJ1ZVxuICAgICAgICAgICAgbmFtZTogJ0FsaWduIEN1cnNvcnMgd2l0aCBUb3AtbW9zdCBDdXJzb3InXG4gICAgICAgICAgICBjb21ibzogJ2FsdCtjdHJsK3NoaWZ0K3VwJ1xuXG4gICAgICAgIGFsaWduQ3Vyc29yc0Rvd246XG4gICAgICAgICAgICBuYW1lOiAnQWxpZ24gQ3Vyc29ycyB3aXRoIEJvdHRvbS1tb3N0IEN1cnNvcidcbiAgICAgICAgICAgIGNvbWJvOiAnYWx0K2N0cmwrc2hpZnQrZG93bidcblxuICAgICAgICBhbGlnbkN1cnNvcnNMZWZ0OlxuICAgICAgICAgICAgbmFtZTogJ0FsaWduIEN1cnNvcnMgd2l0aCBMZWZ0LW1vc3QgQ3Vyc29yJ1xuICAgICAgICAgICAgIyBjb21ibzogJ2FsdCtjdHJsK3NoaWZ0K2xlZnQnXG5cbiAgICAgICAgYWxpZ25DdXJzb3JzUmlnaHQ6XG4gICAgICAgICAgICBuYW1lOiAnQWxpZ24gQ3Vyc29ycyB3aXRoIFJpZ2h0LW1vc3QgQ3Vyc29yJ1xuICAgICAgICAgICAgIyBjb21ibzogJ2FsdCtjdHJsK3NoaWZ0K3JpZ2h0J1xuXG4gICAgICAgIGFsaWduQ3Vyc29yc0FuZFRleHQ6XG4gICAgICAgICAgICBuYW1lOiAnQWxpZ24gQ3Vyc29ycyBhbmQgVGV4dCdcbiAgICAgICAgICAgIHRleHQ6ICdhbGlnbiB0ZXh0IHRvIHRoZSByaWdodCBvZiBjdXJzb3JzIGJ5IGluc2VydGluZyBzcGFjZXMnXG4gICAgICAgICAgICBjb21ibzogJ2FsdCtzaGlmdCthJ1xuXG4gICAgICAgIHNldEN1cnNvcnNBdFNlbGVjdGlvbkJvdW5kYXJpZXNPclNlbGVjdFN1cnJvdW5kOlxuICAgICAgICAgICAgc2VwYXJhdG9yOiB0cnVlXG4gICAgICAgICAgICBuYW1lOiAnQ3Vyc29ycyBhdCBTZWxlY3Rpb24gQm91bmRhcmllcyBvciBTZWxlY3QgQnJhY2tldHMvUXVvdGVzJ1xuICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAgICAgc2V0IGN1cnNvcnMgYXQgc2VsZWN0aW9uIGJvdW5kYXJpZXMsIGlmIGEgc2VsZWN0aW9uIGV4aXN0cy5cbiAgICAgICAgICAgICAgICBzZWxlY3QgYnJhY2tldHMgb3IgcXVvdGVzIG90aGVyd2lzZS5cbiAgICAgICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIGNvbWJvOiAnY29tbWFuZCthbHQrYidcbiAgICAgICAgICAgIGFjY2VsOiAnYWx0K2N0cmwrYidcblxuICAgICAgICBhZGRDdXJzb3JzVXA6XG4gICAgICAgICAgICBzZXBhcmF0b3I6IHRydWVcbiAgICAgICAgICAgIG5hbWU6ICdBZGQgQ3Vyc29ycyBVcCdcbiAgICAgICAgICAgIGNvbWJvOiAnY29tbWFuZCt1cCdcbiAgICAgICAgICAgIGFjY2VsOiAnY3RybCt1cCdcblxuICAgICAgICBhZGRDdXJzb3JzRG93bjpcbiAgICAgICAgICAgIG5hbWU6ICdBZGQgQ3Vyc29ycyBEb3duJ1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK2Rvd24nXG4gICAgICAgICAgICBhY2NlbDogJ2N0cmwrZG93bidcblxuICAgICAgICBkZWxDdXJzb3JzVXA6XG4gICAgICAgICAgICBzZXBhcmF0b3I6IHRydWVcbiAgICAgICAgICAgIG5hbWU6ICdSZW1vdmUgQ3Vyc29ycyBVcCdcbiAgICAgICAgICAgIGNvbWJvOiAnY29tbWFuZCtzaGlmdCt1cCdcbiAgICAgICAgICAgIGFjY2VsOiAnY3RybCtzaGlmdCt1cCdcblxuICAgICAgICBkZWxDdXJzb3JzRG93bjpcbiAgICAgICAgICAgIG5hbWU6ICdSZW1vdmUgQ3Vyc29ycyBEb3duJ1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK3NoaWZ0K2Rvd24nXG4gICAgICAgICAgICBhY2NlbDogJ2N0cmwrc2hpZnQrZG93bidcblxuICAgICAgICBjdXJzb3JNb3ZlczpcbiAgICAgICAgICAgIG5hbWU6ICAnTW92ZSBDdXJzb3JzIFRvIFN0YXJ0J1xuICAgICAgICAgICAgY29tYm9zOiBbJ2N0cmwraG9tZScgJ2N0cmwrZW5kJyAncGFnZSB1cCcgJ3BhZ2UgZG93bicgJ2N0cmwrc2hpZnQraG9tZScgXG4gICAgICAgICAgICAgICAgICAgICAnY3RybCtzaGlmdCtlbmQnICdzaGlmdCtwYWdlIHVwJyAnc2hpZnQrcGFnZSBkb3duJ11cblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwXG5cbiAgICBzaW5nbGVDdXJzb3JBdFBvczogKHAsIG9wdCA9IGV4dGVuZDpmYWxzZSkgLT5cblxuICAgICAgICBpZiBAbnVtTGluZXMoKSA9PSAwXG4gICAgICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICAgICAgQGRvLmluc2VydCAwICcnXG4gICAgICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgICAgIFxuICAgICAgICBwID0gQGNsYW1wUG9zIHBcbiAgICAgICAgbWMgPSBAbWFpbkN1cnNvcigpXG4gICAgICAgIFxuICAgICAgICBpZiBwWzBdID09IG1jWzBdIGFuZCBwWzFdID09IG1jWzFdIGFuZCBAbnVtQ3Vyc29ycygpID09IDFcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBzdGFydFNlbGVjdGlvbiBvcHRcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgW1twWzBdLCBwWzFdXV1cbiAgICAgICAgQGVuZFNlbGVjdGlvbiBvcHRcbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICBzZXRDdXJzb3I6IChjLGwpIC0+XG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIFtbYyxsXV1cbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICBjdXJzb3JNb3ZlczogKGtleSwgaW5mbykgLT5cbiAgICAgICAgZXh0ZW5kID0gaW5mbz8uZXh0ZW5kID8gMCA8PSBpbmZvPy5tb2QuaW5kZXhPZiAnc2hpZnQnXG4gICAgICAgIFxuICAgICAgICBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gQHNpbmdsZUN1cnNvckF0UG9zIFswLCAwXSwgZXh0ZW5kOiBleHRlbmRcbiAgICAgICAgICAgIHdoZW4gJ2VuZCcgICAgICAgdGhlbiBAc2luZ2xlQ3Vyc29yQXRQb3MgWzAsQG51bUxpbmVzKCktMV0sIGV4dGVuZDogZXh0ZW5kXG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAgIHRoZW4gQG1vdmVDdXJzb3JzVXAgICBleHRlbmQsIEBudW1GdWxsTGluZXMoKS0zXG4gICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gQG1vdmVDdXJzb3JzRG93biBleHRlbmQsIEBudW1GdWxsTGluZXMoKS0zXG4gICAgICAgIFxuICAgIHNldEN1cnNvcnNBdFNlbGVjdGlvbkJvdW5kYXJpZXNPclNlbGVjdFN1cnJvdW5kOiAtPlxuXG4gICAgICAgIGlmIEBudW1TZWxlY3Rpb25zKClcbiAgICAgICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgICAgICBuZXdDdXJzb3JzID0gW11cbiAgICAgICAgICAgIGZvciBzIGluIEBkby5zZWxlY3Rpb25zKClcbiAgICAgICAgICAgICAgICBuZXdDdXJzb3JzLnB1c2ggcmFuZ2VTdGFydFBvcyBzXG4gICAgICAgICAgICAgICAgbmV3Q3Vyc29ycy5wdXNoIHJhbmdlRW5kUG9zIHNcbiAgICAgICAgICAgIEBkby5zZWxlY3QgW11cbiAgICAgICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnNcbiAgICAgICAgICAgIEBkby5lbmQoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc2VsZWN0U3Vycm91bmQoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDBcblxuICAgIHRvZ2dsZUN1cnNvckF0UG9zOiAocCkgLT5cblxuICAgICAgICBpZiBpc1Bvc0luUG9zaXRpb25zIHAsIEBzdGF0ZS5jdXJzb3JzKClcbiAgICAgICAgICAgIEBkZWxDdXJzb3JBdFBvcyBwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBhZGRDdXJzb3JBdFBvcyBwXG5cbiAgICBhZGRDdXJzb3JBdFBvczogKHApIC0+XG5cbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgbmV3Q3Vyc29ycyA9IEBkby5jdXJzb3JzKClcbiAgICAgICAgbmV3Q3Vyc29ycy5wdXNoIHBcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29ycywgbWFpbjonbGFzdCdcbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICBhZGRDdXJzb3JzVXA6ICAgLT4gQGFkZEN1cnNvcnMgJ3VwJ1xuICAgIGFkZEN1cnNvcnNEb3duOiAtPiBAYWRkQ3Vyc29ycyAnZG93bidcbiAgICAgICAgXG4gICAgYWRkQ3Vyc29yczogKGtleSkgLT5cblxuICAgICAgICBkaXIgPSBrZXlcbiAgICAgICAgcmV0dXJuIGlmIEBudW1DdXJzb3JzKCkgPj0gOTk5XG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIGQgPSBzd2l0Y2ggZGlyXG4gICAgICAgICAgICB3aGVuICd1cCcgICAgdGhlbiAtMVxuICAgICAgICAgICAgd2hlbiAnZG93bicgIHRoZW4gKzFcbiAgICAgICAgb2xkQ3Vyc29ycyA9IEBzdGF0ZS5jdXJzb3JzKClcbiAgICAgICAgbmV3Q3Vyc29ycyA9IEBkby5jdXJzb3JzKClcbiAgICAgICAgZm9yIGMgaW4gb2xkQ3Vyc29yc1xuICAgICAgICAgICAgaWYgbm90IGlzUG9zSW5Qb3NpdGlvbnMgW2NbMF0sIGNbMV0rZF0sIG9sZEN1cnNvcnNcbiAgICAgICAgICAgICAgICBuZXdDdXJzb3JzLnB1c2ggW2NbMF0sIGNbMV0rZF1cbiAgICAgICAgICAgICAgICBicmVhayBpZiBuZXdDdXJzb3JzLmxlbmd0aCA+PSA5OTlcbiAgICAgICAgc29ydFBvc2l0aW9ucyBuZXdDdXJzb3JzXG4gICAgICAgIG1haW4gPSBzd2l0Y2ggZGlyXG4gICAgICAgICAgICB3aGVuICd1cCcgICAgdGhlbiAnZmlyc3QnXG4gICAgICAgICAgICB3aGVuICdkb3duJyAgdGhlbiAnbGFzdCdcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29ycywgbWFpbjptYWluXG4gICAgICAgIEBkby5lbmQoKVxuXG4gICAgY3Vyc29ySW5BbGxMaW5lczogLT4gICAgICAgXG5cbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgKFswLGldIGZvciBpIGluIFswLi4uQG51bUxpbmVzKCldKSwgbWFpbjonY2xvc2VzdCdcbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICBjdXJzb3JDb2x1bW5zOiAobnVtLCBzdGVwPTEpIC0+XG4gICAgICAgIGNwID0gQGN1cnNvclBvcygpXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIChbY3BbMF0raSpzdGVwLGNwWzFdXSBmb3IgaSBpbiBbMC4uLm51bV0pLCBtYWluOidjbG9zZXN0J1xuICAgICAgICBAZG8uZW5kKClcblxuICAgIGN1cnNvckxpbmVzOiAobnVtLCBzdGVwPTEpIC0+XG4gICAgICAgIGNwID0gQGN1cnNvclBvcygpXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIChbY3BbMF0sY3BbMV0raSpzdGVwXSBmb3IgaSBpbiBbMC4uLm51bV0pLCBtYWluOidjbG9zZXN0J1xuICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAgICAgIDAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG4gICAgYWxpZ25DdXJzb3JzQW5kVGV4dDogLT5cblxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBuZXdDdXJzb3JzID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICBuZXdYID0gXy5tYXggKGNbMF0gZm9yIGMgaW4gbmV3Q3Vyc29ycylcbiAgICAgICAgbGluZXMgPSB7fVxuICAgICAgICBmb3IgbmMgaW4gbmV3Q3Vyc29yc1xuICAgICAgICAgICAgbGluZXNbbmNbMV1dID0gbmNbMF1cbiAgICAgICAgICAgIGN1cnNvclNldCBuYywgbmV3WCwgY1sxXVxuICAgICAgICBmb3IgbGksIGN4IG9mIGxpbmVzXG4gICAgICAgICAgICBAZG8uY2hhbmdlIGxpLCBAZG8ubGluZShsaSkuc2xpY2UoMCwgY3gpICsgXy5wYWRTdGFydCgnJywgbmV3WC1jeCkgKyBAZG8ubGluZShsaSkuc2xpY2UoY3gpXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnNcbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICBhbGlnbkN1cnNvcnNVcDogICAgLT4gQGFsaWduQ3Vyc29ycyAndXAnICAgXG4gICAgYWxpZ25DdXJzb3JzTGVmdDogIC0+IEBhbGlnbkN1cnNvcnMgJ2xlZnQnICAgXG4gICAgYWxpZ25DdXJzb3JzUmlnaHQ6IC0+IEBhbGlnbkN1cnNvcnMgJ3JpZ2h0JyAgIFxuICAgIGFsaWduQ3Vyc29yc0Rvd246ICAtPiBAYWxpZ25DdXJzb3JzICdkb3duJyAgIFxuICAgICAgICBcbiAgICBhbGlnbkN1cnNvcnM6IChkaXI9J2Rvd24nKSAtPlxuXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIG5ld0N1cnNvcnMgPSBAZG8uY3Vyc29ycygpXG4gICAgICAgIGNoYXJQb3MgPSBzd2l0Y2ggZGlyXG4gICAgICAgICAgICB3aGVuICd1cCcgICAgdGhlbiBmaXJzdChuZXdDdXJzb3JzKVswXVxuICAgICAgICAgICAgd2hlbiAnZG93bicgIHRoZW4gbGFzdChuZXdDdXJzb3JzKVswXVxuICAgICAgICAgICAgd2hlbiAnbGVmdCcgIHRoZW4gXy5taW4gKGNbMF0gZm9yIGMgaW4gbmV3Q3Vyc29ycylcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuIF8ubWF4IChjWzBdIGZvciBjIGluIG5ld0N1cnNvcnMpXG4gICAgICAgIGZvciBjIGluIG5ld0N1cnNvcnNcbiAgICAgICAgICAgIGN1cnNvclNldCBjLCBjaGFyUG9zLCBjWzFdXG4gICAgICAgIG1haW4gPSBzd2l0Y2ggZGlyXG4gICAgICAgICAgICB3aGVuICd1cCcgICAgdGhlbiAnZmlyc3QnXG4gICAgICAgICAgICB3aGVuICdkb3duJyAgdGhlbiAnbGFzdCdcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29ycywgbWFpbjptYWluXG4gICAgICAgIEBkby5lbmQoKVxuXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGRlbEN1cnNvckF0UG9zOiAocCkgLT5cbiAgICAgICAgb2xkQ3Vyc29ycyA9IEBzdGF0ZS5jdXJzb3JzKClcbiAgICAgICAgYyA9IHBvc0luUG9zaXRpb25zIHAsIG9sZEN1cnNvcnNcbiAgICAgICAgaWYgYyBhbmQgQG51bUN1cnNvcnMoKSA+IDFcbiAgICAgICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgICAgICBuZXdDdXJzb3JzID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICAgICAgbmV3Q3Vyc29ycy5zcGxpY2Ugb2xkQ3Vyc29ycy5pbmRleE9mKGMpLCAxXG4gICAgICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzLCBtYWluOidjbG9zZXN0J1xuICAgICAgICAgICAgQGRvLmVuZCgpXG5cbiAgICBkZWxDdXJzb3JzVXA6ICAgLT4gQGRlbEN1cnNvcnMgJ3VwJ1xuICAgIGRlbEN1cnNvcnNEb3duOiAtPiBAZGVsQ3Vyc29ycyAnZG93bidcbiAgICAgICAgICAgIFxuICAgIGRlbEN1cnNvcnM6IChrZXksIGluZm8pIC0+XG4gICAgICAgIGRpciA9IGtleVxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBuZXdDdXJzb3JzID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICBkID0gc3dpdGNoIGRpclxuICAgICAgICAgICAgd2hlbiAndXAnXG4gICAgICAgICAgICAgICAgZm9yIGMgaW4gQGRvLmN1cnNvcnMoKVxuICAgICAgICAgICAgICAgICAgICBpZiBpc1Bvc0luUG9zaXRpb25zKFtjWzBdLCBjWzFdLTFdLCBuZXdDdXJzb3JzKSBhbmQgbm90IGlzUG9zSW5Qb3NpdGlvbnMgW2NbMF0sIGNbMV0rMV0sIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGNpID0gbmV3Q3Vyc29ycy5pbmRleE9mIGNcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0N1cnNvcnMuc3BsaWNlIGNpLCAxXG4gICAgICAgICAgICB3aGVuICdkb3duJ1xuICAgICAgICAgICAgICAgIGZvciBjIGluIHJldmVyc2VkIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICAgICAgaWYgaXNQb3NJblBvc2l0aW9ucyhbY1swXSwgY1sxXSsxXSwgbmV3Q3Vyc29ycykgYW5kIG5vdCBpc1Bvc0luUG9zaXRpb25zIFtjWzBdLCBjWzFdLTFdLCBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgICAgICAgICBjaSA9IG5ld0N1cnNvcnMuaW5kZXhPZiBjXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdDdXJzb3JzLnNwbGljZSBjaSwgMVxuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzLCBtYWluOidjbG9zZXN0J1xuICAgICAgICBAZG8uZW5kKClcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY2xlYXJDdXJzb3JzOiAoKSAtPlxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBbQG1haW5DdXJzb3IoKV1cbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICBjbGVhckN1cnNvcnNBbmRIaWdobGlnaHRzOiAoKSAtPlxuICAgICAgICBAY2xlYXJDdXJzb3JzKClcbiAgICAgICAgQGNsZWFySGlnaGxpZ2h0cygpXG5cbiJdfQ==
//# sourceURL=../../../coffee/editor/actions/cursor.coffee