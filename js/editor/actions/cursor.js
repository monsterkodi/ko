// koffee 1.16.0

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
            combos: ['ctrl+home', 'ctrl+end', 'page up', 'page down', 'ctrl+shift+home', 'ctrl+shift+end', 'shift+page up', 'shift+page down', 'alt+-', 'alt+=', 'alt+[', 'alt+]']
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
        switch (info.combo) {
            case 'alt+-':
                key = 'page up';
                break;
            case 'alt+=':
                key = 'page down';
                break;
            case 'alt+[':
                key = 'home';
                break;
            case 'alt+]':
                key = 'end';
        }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uL2NvZmZlZS9lZGl0b3IvYWN0aW9ucyIsInNvdXJjZXMiOlsiY3Vyc29yLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUErQixPQUFBLENBQVEsS0FBUixDQUEvQixFQUFFLFNBQUYsRUFBSyxpQkFBTCxFQUFZLGVBQVosRUFBa0I7O0FBRWxCLE1BQU0sQ0FBQyxPQUFQLEdBRUk7SUFBQSxPQUFBLEVBQ0k7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUVBLGdCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU8scUJBQVA7WUFDQSxLQUFBLEVBQU8sT0FEUDtTQUhKO1FBTUEsY0FBQSxFQUNJO1lBQUEsU0FBQSxFQUFXLElBQVg7WUFDQSxJQUFBLEVBQU0sb0NBRE47WUFFQSxLQUFBLEVBQU8sbUJBRlA7U0FQSjtRQVdBLGdCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU0sdUNBQU47WUFDQSxLQUFBLEVBQU8scUJBRFA7U0FaSjtRQWVBLGdCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU0scUNBQU47U0FoQko7UUFtQkEsaUJBQUEsRUFDSTtZQUFBLElBQUEsRUFBTSxzQ0FBTjtTQXBCSjtRQXVCQSxtQkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFNLHdCQUFOO1lBQ0EsSUFBQSxFQUFNLHdEQUROO1lBRUEsS0FBQSxFQUFPLGFBRlA7U0F4Qko7UUE0QkEsK0NBQUEsRUFDSTtZQUFBLFNBQUEsRUFBVyxJQUFYO1lBQ0EsSUFBQSxFQUFNLDJEQUROO1lBRUEsSUFBQSxFQUFNLG1HQUZOO1lBTUEsS0FBQSxFQUFPLGVBTlA7WUFPQSxLQUFBLEVBQU8sWUFQUDtTQTdCSjtRQXNDQSxZQUFBLEVBQ0k7WUFBQSxTQUFBLEVBQVcsSUFBWDtZQUNBLElBQUEsRUFBTSxnQkFETjtZQUVBLEtBQUEsRUFBTyxZQUZQO1lBR0EsS0FBQSxFQUFPLFNBSFA7U0F2Q0o7UUE0Q0EsY0FB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QUFqQixFQUFpQyxVQUFqQyxDQUFBLElBQWlELENBQUksZ0JBQUEsQ0FBaUIsQ0FBQyxDQUFFLENBQUEsQ0FBQSxDQUFILEVBQU8sQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFLLENBQVosQ0FBakIsRUFBaUMsVUFBakMsQ0FBeEQ7NEJBQ0ksRUFBQSxHQUFLLFVBQVUsQ0FBQyxPQUFYLENBQW1CLENBQW5COzBDQUNMLFVBQVUsQ0FBQyxNQUFYLENBQWtCLEVBQWxCLEVBQXNCLENBQXRCLEdBRko7eUJBQUEsTUFBQTtrREFBQTs7QUFESjs7QUFQSjs7UUFXSixJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsVUFBSixDQUFlLFVBQWYsRUFBMkI7WUFBQSxJQUFBLEVBQUssU0FBTDtTQUEzQjtlQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7SUFoQlEsQ0F6UFo7SUFpUkEsWUFBQSxFQUFjLFNBQUE7UUFDVixJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsS0FBSixDQUFBO1FBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFVBQUosQ0FBZSxDQUFDLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBRCxDQUFmO2VBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEdBQUosQ0FBQTtJQUhVLENBalJkO0lBc1JBLHlCQUFBLEVBQTJCLFNBQUE7UUFDdkIsSUFBQyxDQUFBLFlBQUQsQ0FBQTtlQUNBLElBQUMsQ0FBQSxlQUFELENBQUE7SUFGdUIsQ0F0UjNCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgXywgZmlyc3QsIGxhc3QsIHJldmVyc2VkIH0gPSByZXF1aXJlICdreGsnXG5cbm1vZHVsZS5leHBvcnRzID1cblxuICAgIGFjdGlvbnM6XG4gICAgICAgIG1lbnU6ICdDdXJzb3JzJ1xuXG4gICAgICAgIGN1cnNvckluQWxsTGluZXM6XG4gICAgICAgICAgICBuYW1lOiAgJ0N1cnNvciBpbiBBbGwgTGluZXMnXG4gICAgICAgICAgICBjb21ibzogJ2FsdCthJ1xuXG4gICAgICAgIGFsaWduQ3Vyc29yc1VwOlxuICAgICAgICAgICAgc2VwYXJhdG9yOiB0cnVlXG4gICAgICAgICAgICBuYW1lOiAnQWxpZ24gQ3Vyc29ycyB3aXRoIFRvcC1tb3N0IEN1cnNvcidcbiAgICAgICAgICAgIGNvbWJvOiAnYWx0K2N0cmwrc2hpZnQrdXAnXG5cbiAgICAgICAgYWxpZ25DdXJzb3JzRG93bjpcbiAgICAgICAgICAgIG5hbWU6ICdBbGlnbiBDdXJzb3JzIHdpdGggQm90dG9tLW1vc3QgQ3Vyc29yJ1xuICAgICAgICAgICAgY29tYm86ICdhbHQrY3RybCtzaGlmdCtkb3duJ1xuXG4gICAgICAgIGFsaWduQ3Vyc29yc0xlZnQ6XG4gICAgICAgICAgICBuYW1lOiAnQWxpZ24gQ3Vyc29ycyB3aXRoIExlZnQtbW9zdCBDdXJzb3InXG4gICAgICAgICAgICAjIGNvbWJvOiAnYWx0K2N0cmwrc2hpZnQrbGVmdCdcblxuICAgICAgICBhbGlnbkN1cnNvcnNSaWdodDpcbiAgICAgICAgICAgIG5hbWU6ICdBbGlnbiBDdXJzb3JzIHdpdGggUmlnaHQtbW9zdCBDdXJzb3InXG4gICAgICAgICAgICAjIGNvbWJvOiAnYWx0K2N0cmwrc2hpZnQrcmlnaHQnXG5cbiAgICAgICAgYWxpZ25DdXJzb3JzQW5kVGV4dDpcbiAgICAgICAgICAgIG5hbWU6ICdBbGlnbiBDdXJzb3JzIGFuZCBUZXh0J1xuICAgICAgICAgICAgdGV4dDogJ2FsaWduIHRleHQgdG8gdGhlIHJpZ2h0IG9mIGN1cnNvcnMgYnkgaW5zZXJ0aW5nIHNwYWNlcydcbiAgICAgICAgICAgIGNvbWJvOiAnYWx0K3NoaWZ0K2EnXG5cbiAgICAgICAgc2V0Q3Vyc29yc0F0U2VsZWN0aW9uQm91bmRhcmllc09yU2VsZWN0U3Vycm91bmQ6XG4gICAgICAgICAgICBzZXBhcmF0b3I6IHRydWVcbiAgICAgICAgICAgIG5hbWU6ICdDdXJzb3JzIGF0IFNlbGVjdGlvbiBCb3VuZGFyaWVzIG9yIFNlbGVjdCBCcmFja2V0cy9RdW90ZXMnXG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgICAgICBzZXQgY3Vyc29ycyBhdCBzZWxlY3Rpb24gYm91bmRhcmllcywgaWYgYSBzZWxlY3Rpb24gZXhpc3RzLlxuICAgICAgICAgICAgICAgIHNlbGVjdCBicmFja2V0cyBvciBxdW90ZXMgb3RoZXJ3aXNlLlxuICAgICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK2FsdCtiJ1xuICAgICAgICAgICAgYWNjZWw6ICdhbHQrY3RybCtiJ1xuXG4gICAgICAgIGFkZEN1cnNvcnNVcDpcbiAgICAgICAgICAgIHNlcGFyYXRvcjogdHJ1ZVxuICAgICAgICAgICAgbmFtZTogJ0FkZCBDdXJzb3JzIFVwJ1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK3VwJ1xuICAgICAgICAgICAgYWNjZWw6ICdjdHJsK3VwJ1xuXG4gICAgICAgIGFkZEN1cnNvcnNEb3duOlxuICAgICAgICAgICAgbmFtZTogJ0FkZCBDdXJzb3JzIERvd24nXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrZG93bidcbiAgICAgICAgICAgIGFjY2VsOiAnY3RybCtkb3duJ1xuXG4gICAgICAgIGRlbEN1cnNvcnNVcDpcbiAgICAgICAgICAgIHNlcGFyYXRvcjogdHJ1ZVxuICAgICAgICAgICAgbmFtZTogJ1JlbW92ZSBDdXJzb3JzIFVwJ1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK3NoaWZ0K3VwJ1xuICAgICAgICAgICAgYWNjZWw6ICdjdHJsK3NoaWZ0K3VwJ1xuXG4gICAgICAgIGRlbEN1cnNvcnNEb3duOlxuICAgICAgICAgICAgbmFtZTogJ1JlbW92ZSBDdXJzb3JzIERvd24nXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrc2hpZnQrZG93bidcbiAgICAgICAgICAgIGFjY2VsOiAnY3RybCtzaGlmdCtkb3duJ1xuXG4gICAgICAgIGN1cnNvck1vdmVzOlxuICAgICAgICAgICAgbmFtZTogICdNb3ZlIEN1cnNvcnMgVG8gU3RhcnQnXG4gICAgICAgICAgICBjb21ib3M6IFsnY3RybCtob21lJyAnY3RybCtlbmQnICdwYWdlIHVwJyAncGFnZSBkb3duJyAnY3RybCtzaGlmdCtob21lJyBcbiAgICAgICAgICAgICAgICAgICAgICdjdHJsK3NoaWZ0K2VuZCcgJ3NoaWZ0K3BhZ2UgdXAnICdzaGlmdCtwYWdlIGRvd24nICdhbHQrLScgJ2FsdCs9JyAnYWx0K1snICdhbHQrXSddXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMFxuXG4gICAgc2luZ2xlQ3Vyc29yQXRQb3M6IChwLCBvcHQgPSBleHRlbmQ6ZmFsc2UpIC0+XG5cbiAgICAgICAgaWYgQG51bUxpbmVzKCkgPT0gMFxuICAgICAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgICAgIEBkby5pbnNlcnQgMCAnJ1xuICAgICAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgICAgICBcbiAgICAgICAgcCA9IEBjbGFtcFBvcyBwXG4gICAgICAgIG1jID0gQG1haW5DdXJzb3IoKVxuICAgICAgICBcbiAgICAgICAgaWYgcFswXSA9PSBtY1swXSBhbmQgcFsxXSA9PSBtY1sxXSBhbmQgQG51bUN1cnNvcnMoKSA9PSAxXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBAc3RhcnRTZWxlY3Rpb24gb3B0XG4gICAgICAgIEBkby5zZXRDdXJzb3JzIFtbcFswXSwgcFsxXV1dXG4gICAgICAgIEBlbmRTZWxlY3Rpb24gb3B0XG4gICAgICAgIEBkby5lbmQoKVxuXG4gICAgc2V0Q3Vyc29yOiAoYyxsKSAtPlxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBbW2MsbF1dXG4gICAgICAgIEBkby5lbmQoKVxuXG4gICAgY3Vyc29yTW92ZXM6IChrZXksIGluZm8pIC0+XG4gICAgICAgIGV4dGVuZCA9IGluZm8/LmV4dGVuZCA/IDAgPD0gaW5mbz8ubW9kLmluZGV4T2YgJ3NoaWZ0J1xuXG4gICAgICAgIHN3aXRjaCBpbmZvLmNvbWJvXG4gICAgICAgICAgICB3aGVuICdhbHQrLScgdGhlbiBrZXkgPSAncGFnZSB1cCdcbiAgICAgICAgICAgIHdoZW4gJ2FsdCs9JyB0aGVuIGtleSA9ICdwYWdlIGRvd24nXG4gICAgICAgICAgICB3aGVuICdhbHQrWycgdGhlbiBrZXkgPSAnaG9tZSdcbiAgICAgICAgICAgIHdoZW4gJ2FsdCtdJyB0aGVuIGtleSA9ICdlbmQnXG4gICAgICAgIFxuICAgICAgICBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gQHNpbmdsZUN1cnNvckF0UG9zIFswLCAwXSwgZXh0ZW5kOiBleHRlbmRcbiAgICAgICAgICAgIHdoZW4gJ2VuZCcgICAgICAgdGhlbiBAc2luZ2xlQ3Vyc29yQXRQb3MgWzAsQG51bUxpbmVzKCktMV0sIGV4dGVuZDogZXh0ZW5kXG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAgIHRoZW4gQG1vdmVDdXJzb3JzVXAgICBleHRlbmQsIEBudW1GdWxsTGluZXMoKS0zXG4gICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gQG1vdmVDdXJzb3JzRG93biBleHRlbmQsIEBudW1GdWxsTGluZXMoKS0zXG4gICAgICAgIFxuICAgIHNldEN1cnNvcnNBdFNlbGVjdGlvbkJvdW5kYXJpZXNPclNlbGVjdFN1cnJvdW5kOiAtPlxuXG4gICAgICAgIGlmIEBudW1TZWxlY3Rpb25zKClcbiAgICAgICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgICAgICBuZXdDdXJzb3JzID0gW11cbiAgICAgICAgICAgIGZvciBzIGluIEBkby5zZWxlY3Rpb25zKClcbiAgICAgICAgICAgICAgICBuZXdDdXJzb3JzLnB1c2ggcmFuZ2VTdGFydFBvcyBzXG4gICAgICAgICAgICAgICAgbmV3Q3Vyc29ycy5wdXNoIHJhbmdlRW5kUG9zIHNcbiAgICAgICAgICAgIEBkby5zZWxlY3QgW11cbiAgICAgICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnNcbiAgICAgICAgICAgIEBkby5lbmQoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc2VsZWN0U3Vycm91bmQoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDBcblxuICAgIHRvZ2dsZUN1cnNvckF0UG9zOiAocCkgLT5cblxuICAgICAgICBpZiBpc1Bvc0luUG9zaXRpb25zIHAsIEBzdGF0ZS5jdXJzb3JzKClcbiAgICAgICAgICAgIEBkZWxDdXJzb3JBdFBvcyBwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBhZGRDdXJzb3JBdFBvcyBwXG5cbiAgICBhZGRDdXJzb3JBdFBvczogKHApIC0+XG5cbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgbmV3Q3Vyc29ycyA9IEBkby5jdXJzb3JzKClcbiAgICAgICAgbmV3Q3Vyc29ycy5wdXNoIHBcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29ycywgbWFpbjonbGFzdCdcbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICBhZGRDdXJzb3JzVXA6ICAgLT4gQGFkZEN1cnNvcnMgJ3VwJ1xuICAgIGFkZEN1cnNvcnNEb3duOiAtPiBAYWRkQ3Vyc29ycyAnZG93bidcbiAgICAgICAgXG4gICAgYWRkQ3Vyc29yczogKGtleSkgLT5cblxuICAgICAgICBkaXIgPSBrZXlcbiAgICAgICAgcmV0dXJuIGlmIEBudW1DdXJzb3JzKCkgPj0gOTk5XG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIGQgPSBzd2l0Y2ggZGlyXG4gICAgICAgICAgICB3aGVuICd1cCcgICAgdGhlbiAtMVxuICAgICAgICAgICAgd2hlbiAnZG93bicgIHRoZW4gKzFcbiAgICAgICAgb2xkQ3Vyc29ycyA9IEBzdGF0ZS5jdXJzb3JzKClcbiAgICAgICAgbmV3Q3Vyc29ycyA9IEBkby5jdXJzb3JzKClcbiAgICAgICAgZm9yIGMgaW4gb2xkQ3Vyc29yc1xuICAgICAgICAgICAgaWYgbm90IGlzUG9zSW5Qb3NpdGlvbnMgW2NbMF0sIGNbMV0rZF0sIG9sZEN1cnNvcnNcbiAgICAgICAgICAgICAgICBuZXdDdXJzb3JzLnB1c2ggW2NbMF0sIGNbMV0rZF1cbiAgICAgICAgICAgICAgICBicmVhayBpZiBuZXdDdXJzb3JzLmxlbmd0aCA+PSA5OTlcbiAgICAgICAgc29ydFBvc2l0aW9ucyBuZXdDdXJzb3JzXG4gICAgICAgIG1haW4gPSBzd2l0Y2ggZGlyXG4gICAgICAgICAgICB3aGVuICd1cCcgICAgdGhlbiAnZmlyc3QnXG4gICAgICAgICAgICB3aGVuICdkb3duJyAgdGhlbiAnbGFzdCdcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29ycywgbWFpbjptYWluXG4gICAgICAgIEBkby5lbmQoKVxuXG4gICAgY3Vyc29ySW5BbGxMaW5lczogLT4gICAgICAgXG5cbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgKFswLGldIGZvciBpIGluIFswLi4uQG51bUxpbmVzKCldKSwgbWFpbjonY2xvc2VzdCdcbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICBjdXJzb3JDb2x1bW5zOiAobnVtLCBzdGVwPTEpIC0+XG4gICAgICAgIGNwID0gQGN1cnNvclBvcygpXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIChbY3BbMF0raSpzdGVwLGNwWzFdXSBmb3IgaSBpbiBbMC4uLm51bV0pLCBtYWluOidjbG9zZXN0J1xuICAgICAgICBAZG8uZW5kKClcblxuICAgIGN1cnNvckxpbmVzOiAobnVtLCBzdGVwPTEpIC0+XG4gICAgICAgIGNwID0gQGN1cnNvclBvcygpXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIChbY3BbMF0sY3BbMV0raSpzdGVwXSBmb3IgaSBpbiBbMC4uLm51bV0pLCBtYWluOidjbG9zZXN0J1xuICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAgICAgIDAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG4gICAgYWxpZ25DdXJzb3JzQW5kVGV4dDogLT5cblxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBuZXdDdXJzb3JzID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICBuZXdYID0gXy5tYXggKGNbMF0gZm9yIGMgaW4gbmV3Q3Vyc29ycylcbiAgICAgICAgbGluZXMgPSB7fVxuICAgICAgICBmb3IgbmMgaW4gbmV3Q3Vyc29yc1xuICAgICAgICAgICAgbGluZXNbbmNbMV1dID0gbmNbMF1cbiAgICAgICAgICAgIGN1cnNvclNldCBuYywgbmV3WCwgY1sxXVxuICAgICAgICBmb3IgbGksIGN4IG9mIGxpbmVzXG4gICAgICAgICAgICBAZG8uY2hhbmdlIGxpLCBAZG8ubGluZShsaSkuc2xpY2UoMCwgY3gpICsgXy5wYWRTdGFydCgnJywgbmV3WC1jeCkgKyBAZG8ubGluZShsaSkuc2xpY2UoY3gpXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnNcbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICBhbGlnbkN1cnNvcnNVcDogICAgLT4gQGFsaWduQ3Vyc29ycyAndXAnICAgXG4gICAgYWxpZ25DdXJzb3JzTGVmdDogIC0+IEBhbGlnbkN1cnNvcnMgJ2xlZnQnICAgXG4gICAgYWxpZ25DdXJzb3JzUmlnaHQ6IC0+IEBhbGlnbkN1cnNvcnMgJ3JpZ2h0JyAgIFxuICAgIGFsaWduQ3Vyc29yc0Rvd246ICAtPiBAYWxpZ25DdXJzb3JzICdkb3duJyAgIFxuICAgICAgICBcbiAgICBhbGlnbkN1cnNvcnM6IChkaXI9J2Rvd24nKSAtPlxuXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIG5ld0N1cnNvcnMgPSBAZG8uY3Vyc29ycygpXG4gICAgICAgIGNoYXJQb3MgPSBzd2l0Y2ggZGlyXG4gICAgICAgICAgICB3aGVuICd1cCcgICAgdGhlbiBmaXJzdChuZXdDdXJzb3JzKVswXVxuICAgICAgICAgICAgd2hlbiAnZG93bicgIHRoZW4gbGFzdChuZXdDdXJzb3JzKVswXVxuICAgICAgICAgICAgd2hlbiAnbGVmdCcgIHRoZW4gXy5taW4gKGNbMF0gZm9yIGMgaW4gbmV3Q3Vyc29ycylcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuIF8ubWF4IChjWzBdIGZvciBjIGluIG5ld0N1cnNvcnMpXG4gICAgICAgIGZvciBjIGluIG5ld0N1cnNvcnNcbiAgICAgICAgICAgIGN1cnNvclNldCBjLCBjaGFyUG9zLCBjWzFdXG4gICAgICAgIG1haW4gPSBzd2l0Y2ggZGlyXG4gICAgICAgICAgICB3aGVuICd1cCcgICAgdGhlbiAnZmlyc3QnXG4gICAgICAgICAgICB3aGVuICdkb3duJyAgdGhlbiAnbGFzdCdcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29ycywgbWFpbjptYWluXG4gICAgICAgIEBkby5lbmQoKVxuXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGRlbEN1cnNvckF0UG9zOiAocCkgLT5cbiAgICAgICAgb2xkQ3Vyc29ycyA9IEBzdGF0ZS5jdXJzb3JzKClcbiAgICAgICAgYyA9IHBvc0luUG9zaXRpb25zIHAsIG9sZEN1cnNvcnNcbiAgICAgICAgaWYgYyBhbmQgQG51bUN1cnNvcnMoKSA+IDFcbiAgICAgICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgICAgICBuZXdDdXJzb3JzID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICAgICAgbmV3Q3Vyc29ycy5zcGxpY2Ugb2xkQ3Vyc29ycy5pbmRleE9mKGMpLCAxXG4gICAgICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzLCBtYWluOidjbG9zZXN0J1xuICAgICAgICAgICAgQGRvLmVuZCgpXG5cbiAgICBkZWxDdXJzb3JzVXA6ICAgLT4gQGRlbEN1cnNvcnMgJ3VwJ1xuICAgIGRlbEN1cnNvcnNEb3duOiAtPiBAZGVsQ3Vyc29ycyAnZG93bidcbiAgICAgICAgICAgIFxuICAgIGRlbEN1cnNvcnM6IChrZXksIGluZm8pIC0+XG4gICAgICAgIGRpciA9IGtleVxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBuZXdDdXJzb3JzID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICBkID0gc3dpdGNoIGRpclxuICAgICAgICAgICAgd2hlbiAndXAnXG4gICAgICAgICAgICAgICAgZm9yIGMgaW4gQGRvLmN1cnNvcnMoKVxuICAgICAgICAgICAgICAgICAgICBpZiBpc1Bvc0luUG9zaXRpb25zKFtjWzBdLCBjWzFdLTFdLCBuZXdDdXJzb3JzKSBhbmQgbm90IGlzUG9zSW5Qb3NpdGlvbnMgW2NbMF0sIGNbMV0rMV0sIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGNpID0gbmV3Q3Vyc29ycy5pbmRleE9mIGNcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0N1cnNvcnMuc3BsaWNlIGNpLCAxXG4gICAgICAgICAgICB3aGVuICdkb3duJ1xuICAgICAgICAgICAgICAgIGZvciBjIGluIHJldmVyc2VkIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICAgICAgaWYgaXNQb3NJblBvc2l0aW9ucyhbY1swXSwgY1sxXSsxXSwgbmV3Q3Vyc29ycykgYW5kIG5vdCBpc1Bvc0luUG9zaXRpb25zIFtjWzBdLCBjWzFdLTFdLCBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgICAgICAgICBjaSA9IG5ld0N1cnNvcnMuaW5kZXhPZiBjXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdDdXJzb3JzLnNwbGljZSBjaSwgMVxuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzLCBtYWluOidjbG9zZXN0J1xuICAgICAgICBAZG8uZW5kKClcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY2xlYXJDdXJzb3JzOiAoKSAtPlxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBbQG1haW5DdXJzb3IoKV1cbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICBjbGVhckN1cnNvcnNBbmRIaWdobGlnaHRzOiAoKSAtPlxuICAgICAgICBAY2xlYXJDdXJzb3JzKClcbiAgICAgICAgQGNsZWFySGlnaGxpZ2h0cygpXG5cbiJdfQ==
//# sourceURL=../../../coffee/editor/actions/cursor.coffee