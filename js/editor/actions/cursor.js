// koffee 1.7.0

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
        if (p[0] === mc[0] && p[1] === mc[1]) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUErQixPQUFBLENBQVEsS0FBUixDQUEvQixFQUFFLFNBQUYsRUFBSyxpQkFBTCxFQUFZLGVBQVosRUFBa0I7O0FBRWxCLE1BQU0sQ0FBQyxPQUFQLEdBRUk7SUFBQSxPQUFBLEVBQ0k7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUVBLGdCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU8scUJBQVA7WUFDQSxLQUFBLEVBQU8sT0FEUDtTQUhKO1FBTUEsY0FBQSxFQUNJO1lBQUEsU0FBQSxFQUFXLElBQVg7WUFDQSxJQUFBLEVBQU0sb0NBRE47WUFFQSxLQUFBLEVBQU8sbUJBRlA7U0FQSjtRQVdBLGdCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU0sdUNBQU47WUFDQSxLQUFBLEVBQU8scUJBRFA7U0FaSjtRQWVBLGdCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU0scUNBQU47U0FoQko7UUFtQkEsaUJBQUEsRUFDSTtZQUFBLElBQUEsRUFBTSxzQ0FBTjtTQXBCSjtRQXVCQSxtQkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFNLHdCQUFOO1lBQ0EsSUFBQSxFQUFNLHdEQUROO1lBRUEsS0FBQSxFQUFPLGFBRlA7U0F4Qko7UUE0QkEsK0NBQUEsRUFDSTtZQUFBLFNBQUEsRUFBVyxJQUFYO1lBQ0EsSUFBQSxFQUFNLDJEQUROO1lBRUEsSUFBQSxFQUFNLG1HQUZOO1lBTUEsS0FBQSxFQUFPLGVBTlA7WUFPQSxLQUFBLEVBQU8sWUFQUDtTQTdCSjtRQXNDQSxZQUFBLEVBQ0k7WUFBQSxTQUFBLEVBQVcsSUFBWDtZQUNBLElBQUEsRUFBTSxnQkFETjtZQUVBLEtBQUEsRUFBTyxZQUZQO1lBR0EsS0FBQSxFQUFPLFNBSFA7U0F2Q0o7UUE0Q0EsY0FBQSxFQUNJO1lBQUEsSUFBQSxFQUFNLGtCQUFOO1lBQ0EsS0FBQSxFQUFP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QUssU0FBTDtTQUEzQjtlQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7SUFoQlEsQ0FwUFo7SUE0UUEsWUFBQSxFQUFjLFNBQUE7UUFDVixJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsS0FBSixDQUFBO1FBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFVBQUosQ0FBZSxDQUFDLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBRCxDQUFmO2VBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEdBQUosQ0FBQTtJQUhVLENBNVFkO0lBaVJBLHlCQUFBLEVBQTJCLFNBQUE7UUFDdkIsSUFBQyxDQUFBLFlBQUQsQ0FBQTtlQUNBLElBQUMsQ0FBQSxlQUFELENBQUE7SUFGdUIsQ0FqUjNCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgXywgZmlyc3QsIGxhc3QsIHJldmVyc2VkIH0gPSByZXF1aXJlICdreGsnXG5cbm1vZHVsZS5leHBvcnRzID1cblxuICAgIGFjdGlvbnM6XG4gICAgICAgIG1lbnU6ICdDdXJzb3JzJ1xuXG4gICAgICAgIGN1cnNvckluQWxsTGluZXM6XG4gICAgICAgICAgICBuYW1lOiAgJ0N1cnNvciBpbiBBbGwgTGluZXMnXG4gICAgICAgICAgICBjb21ibzogJ2FsdCthJ1xuXG4gICAgICAgIGFsaWduQ3Vyc29yc1VwOlxuICAgICAgICAgICAgc2VwYXJhdG9yOiB0cnVlXG4gICAgICAgICAgICBuYW1lOiAnQWxpZ24gQ3Vyc29ycyB3aXRoIFRvcC1tb3N0IEN1cnNvcidcbiAgICAgICAgICAgIGNvbWJvOiAnYWx0K2N0cmwrc2hpZnQrdXAnXG5cbiAgICAgICAgYWxpZ25DdXJzb3JzRG93bjpcbiAgICAgICAgICAgIG5hbWU6ICdBbGlnbiBDdXJzb3JzIHdpdGggQm90dG9tLW1vc3QgQ3Vyc29yJ1xuICAgICAgICAgICAgY29tYm86ICdhbHQrY3RybCtzaGlmdCtkb3duJ1xuXG4gICAgICAgIGFsaWduQ3Vyc29yc0xlZnQ6XG4gICAgICAgICAgICBuYW1lOiAnQWxpZ24gQ3Vyc29ycyB3aXRoIExlZnQtbW9zdCBDdXJzb3InXG4gICAgICAgICAgICAjIGNvbWJvOiAnYWx0K2N0cmwrc2hpZnQrbGVmdCdcblxuICAgICAgICBhbGlnbkN1cnNvcnNSaWdodDpcbiAgICAgICAgICAgIG5hbWU6ICdBbGlnbiBDdXJzb3JzIHdpdGggUmlnaHQtbW9zdCBDdXJzb3InXG4gICAgICAgICAgICAjIGNvbWJvOiAnYWx0K2N0cmwrc2hpZnQrcmlnaHQnXG5cbiAgICAgICAgYWxpZ25DdXJzb3JzQW5kVGV4dDpcbiAgICAgICAgICAgIG5hbWU6ICdBbGlnbiBDdXJzb3JzIGFuZCBUZXh0J1xuICAgICAgICAgICAgdGV4dDogJ2FsaWduIHRleHQgdG8gdGhlIHJpZ2h0IG9mIGN1cnNvcnMgYnkgaW5zZXJ0aW5nIHNwYWNlcydcbiAgICAgICAgICAgIGNvbWJvOiAnYWx0K3NoaWZ0K2EnXG5cbiAgICAgICAgc2V0Q3Vyc29yc0F0U2VsZWN0aW9uQm91bmRhcmllc09yU2VsZWN0U3Vycm91bmQ6XG4gICAgICAgICAgICBzZXBhcmF0b3I6IHRydWVcbiAgICAgICAgICAgIG5hbWU6ICdDdXJzb3JzIGF0IFNlbGVjdGlvbiBCb3VuZGFyaWVzIG9yIFNlbGVjdCBCcmFja2V0cy9RdW90ZXMnXG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgICAgICBzZXQgY3Vyc29ycyBhdCBzZWxlY3Rpb24gYm91bmRhcmllcywgaWYgYSBzZWxlY3Rpb24gZXhpc3RzLlxuICAgICAgICAgICAgICAgIHNlbGVjdCBicmFja2V0cyBvciBxdW90ZXMgb3RoZXJ3aXNlLlxuICAgICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK2FsdCtiJ1xuICAgICAgICAgICAgYWNjZWw6ICdhbHQrY3RybCtiJ1xuXG4gICAgICAgIGFkZEN1cnNvcnNVcDpcbiAgICAgICAgICAgIHNlcGFyYXRvcjogdHJ1ZVxuICAgICAgICAgICAgbmFtZTogJ0FkZCBDdXJzb3JzIFVwJ1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK3VwJ1xuICAgICAgICAgICAgYWNjZWw6ICdjdHJsK3VwJ1xuXG4gICAgICAgIGFkZEN1cnNvcnNEb3duOlxuICAgICAgICAgICAgbmFtZTogJ0FkZCBDdXJzb3JzIERvd24nXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrZG93bidcbiAgICAgICAgICAgIGFjY2VsOiAnY3RybCtkb3duJ1xuXG4gICAgICAgIGRlbEN1cnNvcnNVcDpcbiAgICAgICAgICAgIHNlcGFyYXRvcjogdHJ1ZVxuICAgICAgICAgICAgbmFtZTogJ1JlbW92ZSBDdXJzb3JzIFVwJ1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK3NoaWZ0K3VwJ1xuICAgICAgICAgICAgYWNjZWw6ICdjdHJsK3NoaWZ0K3VwJ1xuXG4gICAgICAgIGRlbEN1cnNvcnNEb3duOlxuICAgICAgICAgICAgbmFtZTogJ1JlbW92ZSBDdXJzb3JzIERvd24nXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrc2hpZnQrZG93bidcbiAgICAgICAgICAgIGFjY2VsOiAnY3RybCtzaGlmdCtkb3duJ1xuXG4gICAgICAgIGN1cnNvck1vdmVzOlxuICAgICAgICAgICAgbmFtZTogICdNb3ZlIEN1cnNvcnMgVG8gU3RhcnQnXG4gICAgICAgICAgICBjb21ib3M6IFsnY3RybCtob21lJywgJ2N0cmwrZW5kJywgJ3BhZ2UgdXAnLCAncGFnZSBkb3duJywgJ2N0cmwrc2hpZnQraG9tZScsICdjdHJsK3NoaWZ0K2VuZCcsICdzaGlmdCtwYWdlIHVwJywgJ3NoaWZ0K3BhZ2UgZG93biddXG5cblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwXG5cbiAgICBzaW5nbGVDdXJzb3JBdFBvczogKHAsIG9wdCA9IGV4dGVuZDpmYWxzZSkgLT5cblxuICAgICAgICBpZiBAbnVtTGluZXMoKSA9PSAwXG4gICAgICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICAgICAgQGRvLmluc2VydCAwICcnXG4gICAgICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgcCA9IEBjbGFtcFBvcyBwXG5cbiAgICAgICAgbWMgPSBAbWFpbkN1cnNvcigpXG4gICAgICAgIGlmIHBbMF0gPT0gbWNbMF0gYW5kIHBbMV0gPT0gbWNbMV1cbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAjIGtsb2cgJ3NpbmdsZUN1cnNvckF0UG9zJyBwLCBtY1xuXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBzdGFydFNlbGVjdGlvbiBvcHRcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgW1twWzBdLCBwWzFdXV1cbiAgICAgICAgQGVuZFNlbGVjdGlvbiBvcHRcbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICBzZXRDdXJzb3I6IChjLGwpIC0+XG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIFtbYyxsXV1cbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICBjdXJzb3JNb3ZlczogKGtleSwgaW5mbykgLT5cbiAgICAgICAgZXh0ZW5kID0gaW5mbz8uZXh0ZW5kID8gMCA8PSBpbmZvPy5tb2QuaW5kZXhPZiAnc2hpZnQnXG4gICAgICAgIFxuICAgICAgICBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gQHNpbmdsZUN1cnNvckF0UG9zIFswLCAwXSwgZXh0ZW5kOiBleHRlbmRcbiAgICAgICAgICAgIHdoZW4gJ2VuZCcgICAgICAgdGhlbiBAc2luZ2xlQ3Vyc29yQXRQb3MgWzAsQG51bUxpbmVzKCktMV0sIGV4dGVuZDogZXh0ZW5kXG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAgIFxuICAgICAgICAgICAgICAgIEBtb3ZlQ3Vyc29yc1VwICAgZXh0ZW5kLCBAbnVtRnVsbExpbmVzKCktM1xuICAgICAgICAgICAgd2hlbiAncGFnZSBkb3duJyB0aGVuIEBtb3ZlQ3Vyc29yc0Rvd24gZXh0ZW5kLCBAbnVtRnVsbExpbmVzKCktM1xuICAgICAgICBcbiAgICBzZXRDdXJzb3JzQXRTZWxlY3Rpb25Cb3VuZGFyaWVzT3JTZWxlY3RTdXJyb3VuZDogLT5cblxuICAgICAgICBpZiBAbnVtU2VsZWN0aW9ucygpXG4gICAgICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICAgICAgbmV3Q3Vyc29ycyA9IFtdXG4gICAgICAgICAgICBmb3IgcyBpbiBAZG8uc2VsZWN0aW9ucygpXG4gICAgICAgICAgICAgICAgbmV3Q3Vyc29ycy5wdXNoIHJhbmdlU3RhcnRQb3Mgc1xuICAgICAgICAgICAgICAgIG5ld0N1cnNvcnMucHVzaCByYW5nZUVuZFBvcyBzXG4gICAgICAgICAgICBAZG8uc2VsZWN0IFtdXG4gICAgICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzXG4gICAgICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHNlbGVjdFN1cnJvdW5kKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwXG5cbiAgICB0b2dnbGVDdXJzb3JBdFBvczogKHApIC0+XG5cbiAgICAgICAgaWYgaXNQb3NJblBvc2l0aW9ucyBwLCBAc3RhdGUuY3Vyc29ycygpXG4gICAgICAgICAgICBAZGVsQ3Vyc29yQXRQb3MgcFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAYWRkQ3Vyc29yQXRQb3MgcFxuXG4gICAgYWRkQ3Vyc29yQXRQb3M6IChwKSAtPlxuXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIG5ld0N1cnNvcnMgPSBAZG8uY3Vyc29ycygpXG4gICAgICAgIG5ld0N1cnNvcnMucHVzaCBwXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnMsIG1haW46J2xhc3QnXG4gICAgICAgIEBkby5lbmQoKVxuXG4gICAgYWRkQ3Vyc29yc1VwOiAgIC0+IEBhZGRDdXJzb3JzICd1cCdcbiAgICBhZGRDdXJzb3JzRG93bjogLT4gQGFkZEN1cnNvcnMgJ2Rvd24nXG4gICAgICAgIFxuICAgIGFkZEN1cnNvcnM6IChrZXkpIC0+XG5cbiAgICAgICAgZGlyID0ga2V5XG4gICAgICAgIHJldHVybiBpZiBAbnVtQ3Vyc29ycygpID49IDk5OVxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBkID0gc3dpdGNoIGRpclxuICAgICAgICAgICAgd2hlbiAndXAnICAgIHRoZW4gLTFcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nICB0aGVuICsxXG4gICAgICAgIG9sZEN1cnNvcnMgPSBAc3RhdGUuY3Vyc29ycygpXG4gICAgICAgIG5ld0N1cnNvcnMgPSBAZG8uY3Vyc29ycygpXG4gICAgICAgIGZvciBjIGluIG9sZEN1cnNvcnNcbiAgICAgICAgICAgIGlmIG5vdCBpc1Bvc0luUG9zaXRpb25zIFtjWzBdLCBjWzFdK2RdLCBvbGRDdXJzb3JzXG4gICAgICAgICAgICAgICAgbmV3Q3Vyc29ycy5wdXNoIFtjWzBdLCBjWzFdK2RdXG4gICAgICAgICAgICAgICAgYnJlYWsgaWYgbmV3Q3Vyc29ycy5sZW5ndGggPj0gOTk5XG4gICAgICAgIHNvcnRQb3NpdGlvbnMgbmV3Q3Vyc29yc1xuICAgICAgICBtYWluID0gc3dpdGNoIGRpclxuICAgICAgICAgICAgd2hlbiAndXAnICAgIHRoZW4gJ2ZpcnN0J1xuICAgICAgICAgICAgd2hlbiAnZG93bicgIHRoZW4gJ2xhc3QnXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnMsIG1haW46bWFpblxuICAgICAgICBAZG8uZW5kKClcblxuICAgIGN1cnNvckluQWxsTGluZXM6IC0+ICAgICAgIFxuXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIChbMCxpXSBmb3IgaSBpbiBbMC4uLkBudW1MaW5lcygpXSksIG1haW46J2Nsb3Nlc3QnXG4gICAgICAgIEBkby5lbmQoKVxuXG4gICAgY3Vyc29yQ29sdW1uczogKG51bSwgc3RlcD0xKSAtPlxuICAgICAgICBjcCA9IEBjdXJzb3JQb3MoKVxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBAZG8uc2V0Q3Vyc29ycyAoW2NwWzBdK2kqc3RlcCxjcFsxXV0gZm9yIGkgaW4gWzAuLi5udW1dKSwgbWFpbjonY2xvc2VzdCdcbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICBjdXJzb3JMaW5lczogKG51bSwgc3RlcD0xKSAtPlxuICAgICAgICBjcCA9IEBjdXJzb3JQb3MoKVxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBAZG8uc2V0Q3Vyc29ycyAoW2NwWzBdLGNwWzFdK2kqc3RlcF0gZm9yIGkgaW4gWzAuLi5udW1dKSwgbWFpbjonY2xvc2VzdCdcbiAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgICAwMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxuICAgIGFsaWduQ3Vyc29yc0FuZFRleHQ6IC0+XG5cbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgbmV3Q3Vyc29ycyA9IEBkby5jdXJzb3JzKClcbiAgICAgICAgbmV3WCA9IF8ubWF4IChjWzBdIGZvciBjIGluIG5ld0N1cnNvcnMpXG4gICAgICAgIGxpbmVzID0ge31cbiAgICAgICAgZm9yIG5jIGluIG5ld0N1cnNvcnNcbiAgICAgICAgICAgIGxpbmVzW25jWzFdXSA9IG5jWzBdXG4gICAgICAgICAgICBjdXJzb3JTZXQgbmMsIG5ld1gsIGNbMV1cbiAgICAgICAgZm9yIGxpLCBjeCBvZiBsaW5lc1xuICAgICAgICAgICAgQGRvLmNoYW5nZSBsaSwgQGRvLmxpbmUobGkpLnNsaWNlKDAsIGN4KSArIF8ucGFkU3RhcnQoJycsIG5ld1gtY3gpICsgQGRvLmxpbmUobGkpLnNsaWNlKGN4KVxuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzXG4gICAgICAgIEBkby5lbmQoKVxuXG4gICAgYWxpZ25DdXJzb3JzVXA6ICAgIC0+IEBhbGlnbkN1cnNvcnMgJ3VwJyAgIFxuICAgIGFsaWduQ3Vyc29yc0xlZnQ6ICAtPiBAYWxpZ25DdXJzb3JzICdsZWZ0JyAgIFxuICAgIGFsaWduQ3Vyc29yc1JpZ2h0OiAtPiBAYWxpZ25DdXJzb3JzICdyaWdodCcgICBcbiAgICBhbGlnbkN1cnNvcnNEb3duOiAgLT4gQGFsaWduQ3Vyc29ycyAnZG93bicgICBcbiAgICAgICAgXG4gICAgYWxpZ25DdXJzb3JzOiAoZGlyPSdkb3duJykgLT5cblxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBuZXdDdXJzb3JzID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICBjaGFyUG9zID0gc3dpdGNoIGRpclxuICAgICAgICAgICAgd2hlbiAndXAnICAgIHRoZW4gZmlyc3QobmV3Q3Vyc29ycylbMF1cbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nICB0aGVuIGxhc3QobmV3Q3Vyc29ycylbMF1cbiAgICAgICAgICAgIHdoZW4gJ2xlZnQnICB0aGVuIF8ubWluIChjWzBdIGZvciBjIGluIG5ld0N1cnNvcnMpXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgdGhlbiBfLm1heCAoY1swXSBmb3IgYyBpbiBuZXdDdXJzb3JzKVxuICAgICAgICBmb3IgYyBpbiBuZXdDdXJzb3JzXG4gICAgICAgICAgICBjdXJzb3JTZXQgYywgY2hhclBvcywgY1sxXVxuICAgICAgICBtYWluID0gc3dpdGNoIGRpclxuICAgICAgICAgICAgd2hlbiAndXAnICAgIHRoZW4gJ2ZpcnN0J1xuICAgICAgICAgICAgd2hlbiAnZG93bicgIHRoZW4gJ2xhc3QnXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnMsIG1haW46bWFpblxuICAgICAgICBAZG8uZW5kKClcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBkZWxDdXJzb3JBdFBvczogKHApIC0+XG4gICAgICAgIG9sZEN1cnNvcnMgPSBAc3RhdGUuY3Vyc29ycygpXG4gICAgICAgIGMgPSBwb3NJblBvc2l0aW9ucyBwLCBvbGRDdXJzb3JzXG4gICAgICAgIGlmIGMgYW5kIEBudW1DdXJzb3JzKCkgPiAxXG4gICAgICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICAgICAgbmV3Q3Vyc29ycyA9IEBkby5jdXJzb3JzKClcbiAgICAgICAgICAgIG5ld0N1cnNvcnMuc3BsaWNlIG9sZEN1cnNvcnMuaW5kZXhPZihjKSwgMVxuICAgICAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29ycywgbWFpbjonY2xvc2VzdCdcbiAgICAgICAgICAgIEBkby5lbmQoKVxuXG4gICAgZGVsQ3Vyc29yc1VwOiAgIC0+IEBkZWxDdXJzb3JzICd1cCdcbiAgICBkZWxDdXJzb3JzRG93bjogLT4gQGRlbEN1cnNvcnMgJ2Rvd24nXG4gICAgICAgICAgICBcbiAgICBkZWxDdXJzb3JzOiAoa2V5LCBpbmZvKSAtPlxuICAgICAgICBkaXIgPSBrZXlcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgbmV3Q3Vyc29ycyA9IEBkby5jdXJzb3JzKClcbiAgICAgICAgZCA9IHN3aXRjaCBkaXJcbiAgICAgICAgICAgIHdoZW4gJ3VwJ1xuICAgICAgICAgICAgICAgIGZvciBjIGluIEBkby5jdXJzb3JzKClcbiAgICAgICAgICAgICAgICAgICAgaWYgaXNQb3NJblBvc2l0aW9ucyhbY1swXSwgY1sxXS0xXSwgbmV3Q3Vyc29ycykgYW5kIG5vdCBpc1Bvc0luUG9zaXRpb25zIFtjWzBdLCBjWzFdKzFdLCBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgICAgICAgICBjaSA9IG5ld0N1cnNvcnMuaW5kZXhPZiBjXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdDdXJzb3JzLnNwbGljZSBjaSwgMVxuICAgICAgICAgICAgd2hlbiAnZG93bidcbiAgICAgICAgICAgICAgICBmb3IgYyBpbiByZXZlcnNlZCBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgICAgIGlmIGlzUG9zSW5Qb3NpdGlvbnMoW2NbMF0sIGNbMV0rMV0sIG5ld0N1cnNvcnMpIGFuZCBub3QgaXNQb3NJblBvc2l0aW9ucyBbY1swXSwgY1sxXS0xXSwgbmV3Q3Vyc29yc1xuICAgICAgICAgICAgICAgICAgICAgICAgY2kgPSBuZXdDdXJzb3JzLmluZGV4T2YgY1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q3Vyc29ycy5zcGxpY2UgY2ksIDFcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29ycywgbWFpbjonY2xvc2VzdCdcbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcblxuICAgIGNsZWFyQ3Vyc29yczogKCkgLT5cbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgW0BtYWluQ3Vyc29yKCldXG4gICAgICAgIEBkby5lbmQoKVxuXG4gICAgY2xlYXJDdXJzb3JzQW5kSGlnaGxpZ2h0czogKCkgLT5cbiAgICAgICAgQGNsZWFyQ3Vyc29ycygpXG4gICAgICAgIEBjbGVhckhpZ2hsaWdodHMoKVxuXG4iXX0=
//# sourceURL=../../../coffee/editor/actions/cursor.coffee