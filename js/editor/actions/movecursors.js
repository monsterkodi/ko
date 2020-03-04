// koffee 1.11.0
var _;

_ = require('kxk')._;

module.exports = {
    actions: {
        menu: 'Cursors',
        moveCursorsAtBoundaryLeft: {
            name: 'Move Cursors to Indent or Start of Line',
            combo: 'command+left',
            accel: 'ctrl+left'
        },
        moveCursorsAtBoundaryRight: {
            name: 'Move Cursors to End of Line',
            combo: 'command+right',
            accel: 'ctrl+right'
        },
        moveCursorsToWordBoundary: {
            name: 'move cursors to word boundaries',
            text: 'moves cursors to word boundaries. extends selections, if shift is pressed.',
            combos: ['alt+shift+left', 'alt+shift+right']
        },
        moveCursorsToWordBoundaryLeft: {
            separator: true,
            name: 'Move Cursors to Start of Word',
            combo: 'alt+left'
        },
        moveCursorsToWordBoundaryRight: {
            name: 'Move Cursors to End of Word',
            combo: 'alt+right'
        },
        moveCursorsToLineBoundary: {
            name: 'move cursors to line boundaries',
            text: 'moves cursors to line boundaries. extends selections, if shift is pressed.',
            combos: ['home', 'end', 'command+shift+left', 'command+shift+right', 'ctrl+shift+left', 'ctrl+shift+right'],
            accels: ['home', 'end', 'shift+home', 'shift+end', 'ctrl+shift+left', 'ctrl+shift+right']
        },
        moveMainCursor: {
            name: 'move main cursor',
            text: "move main cursor independently of other cursors.\nerases other cursors if shift is pressed. \nsets new cursors otherwise.",
            combos: ['ctrl+shift+up', 'ctrl+shift+down', 'ctrl+shift+left', 'ctrl+shift+right', 'ctrl+up', 'ctrl+down', 'ctrl+left', 'ctrl+right'],
            accels: ['ctrl+shift+up', 'ctrl+shift+down']
        },
        moveCursors: {
            name: 'move cursors',
            combos: ['left', 'right', 'up', 'down', 'shift+down', 'shift+right', 'shift+up', 'shift+left']
        }
    },
    moveCursorsAtBoundaryLeft: function() {
        return this.setOrMoveCursorsAtBoundary('left');
    },
    moveCursorsAtBoundaryRight: function() {
        return this.setOrMoveCursorsAtBoundary('right');
    },
    setOrMoveCursorsAtBoundary: function(key) {
        if (this.numSelections() > 1 && this.numCursors() === 1) {
            return this.setCursorsAtSelectionBoundary(key);
        } else {
            return this.moveCursorsToLineBoundary(key);
        }
    },
    moveMainCursor: function(key, info) {
        var dir, dx, dy, hrz, newCursors, newMain, oldMain, opt, ref, ref1;
        dir = key;
        hrz = key === 'left' || key === 'right';
        opt = _.clone(info);
        if (opt.erase != null) {
            opt.erase;
        } else {
            opt.erase = ((ref = info.mod) != null ? ref.indexOf('shift') : void 0) >= 0 || hrz;
        }
        this["do"].start();
        ref1 = (function() {
            switch (dir) {
                case 'up':
                    return [0, -1];
                case 'down':
                    return [0, +1];
                case 'left':
                    return [-1, 0];
                case 'right':
                    return [+1, 0];
            }
        })(), dx = ref1[0], dy = ref1[1];
        newCursors = this["do"].cursors();
        oldMain = this.mainCursor();
        newMain = [oldMain[0] + dx, oldMain[1] + dy];
        _.remove(newCursors, function(c) {
            if (opt != null ? opt.erase : void 0) {
                return isSamePos(c, oldMain) || isSamePos(c, newMain);
            } else {
                return isSamePos(c, newMain);
            }
        });
        newCursors.push(newMain);
        this["do"].setCursors(newCursors, {
            main: newMain
        });
        return this["do"].end();
    },
    moveCursorsToWordBoundaryLeft: function() {
        return this.moveCursorsToWordBoundary('left');
    },
    moveCursorsToWordBoundaryRight: function() {
        return this.moveCursorsToWordBoundary('right');
    },
    moveCursorsToWordBoundary: function(leftOrRight, info) {
        var extend, f, ref;
        if (info == null) {
            info = {
                extend: false
            };
        }
        extend = (ref = info.extend) != null ? ref : 0 <= info.mod.indexOf('shift');
        f = (function() {
            switch (leftOrRight) {
                case 'right':
                    return this.endOfWordAtPos;
                case 'left':
                    return this.startOfWordAtPos;
            }
        }).call(this);
        this.moveAllCursors(f, {
            extend: extend,
            keepLine: true
        });
        return true;
    },
    moveCursorsToLineBoundary: function(key, info) {
        var extend, func, ref;
        if (info == null) {
            info = {
                extend: false
            };
        }
        this["do"].start();
        extend = (ref = info.extend) != null ? ref : 0 <= info.mod.indexOf('shift');
        func = (function() {
            switch (key) {
                case 'right':
                case 'e':
                case 'end':
                    return (function(_this) {
                        return function(c) {
                            return [_this["do"].line(c[1]).length, c[1]];
                        };
                    })(this);
                case 'left':
                case 'a':
                case 'home':
                    return (function(_this) {
                        return function(c) {
                            var d;
                            if (_this["do"].line(c[1]).slice(0, c[0]).trim().length === 0) {
                                return [0, c[1]];
                            } else {
                                d = _this["do"].line(c[1]).length - _this["do"].line(c[1]).trimLeft().length;
                                return [d, c[1]];
                            }
                        };
                    })(this);
            }
        }).call(this);
        this.moveAllCursors(func, {
            extend: extend,
            keepLine: true
        });
        return this["do"].end();
    },
    moveCursors: function(key, info) {
        var extend, ref;
        if (info == null) {
            info = {
                extend: false
            };
        }
        extend = (ref = info.extend) != null ? ref : 'shift' === info.mod;
        switch (key) {
            case 'left':
                return this.moveCursorsLeft(extend);
            case 'right':
                return this.moveCursorsRight(extend);
            case 'up':
                return this.moveCursorsUp(extend);
            case 'down':
                return this.moveCursorsDown(extend);
        }
    },
    setCursorsAtSelectionBoundary: function(leftOrRight) {
        var i, j, len, main, newCursors, p, ref, s;
        if (leftOrRight == null) {
            leftOrRight = 'right';
        }
        this["do"].start();
        i = leftOrRight === 'right' && 1 || 0;
        newCursors = [];
        main = 'last';
        ref = this["do"].selections();
        for (j = 0, len = ref.length; j < len; j++) {
            s = ref[j];
            p = rangeIndexPos(s, i);
            newCursors.push(p);
            if (this.isCursorInRange(s)) {
                main = newCursors.indexOf(p);
            }
        }
        this["do"].setCursors(newCursors, {
            main: main
        });
        return this["do"].end();
    },
    moveAllCursors: function(func, opt) {
        var c, j, len, main, mainLine, newCursors, newPos, oldMain;
        if (opt == null) {
            opt = {
                extend: false,
                keepLine: true
            };
        }
        this["do"].start();
        this.startSelection(opt);
        newCursors = this["do"].cursors();
        oldMain = this["do"].mainCursor();
        mainLine = oldMain[1];
        if (newCursors.length > 1) {
            for (j = 0, len = newCursors.length; j < len; j++) {
                c = newCursors[j];
                newPos = func(c);
                if (newPos[1] === c[1] || !opt.keepLine) {
                    if (isSamePos(oldMain, c)) {
                        mainLine = newPos[1];
                    }
                    cursorSet(c, newPos);
                }
            }
        } else {
            cursorSet(newCursors[0], func(newCursors[0]));
            mainLine = newCursors[0][1];
        }
        main = (function() {
            switch (opt.main) {
                case 'top':
                    return 'first';
                case 'bot':
                    return 'last';
                case 'left':
                    return 'closest';
                case 'right':
                    return 'closest';
            }
        })();
        this["do"].setCursors(newCursors, {
            main: main
        });
        this.endSelection(opt);
        return this["do"].end();
    },
    moveCursorsUp: function(e, n) {
        if (n == null) {
            n = 1;
        }
        return this.moveAllCursors((function(n) {
            return function(c) {
                return [c[0], c[1] - n];
            };
        })(n), {
            extend: e,
            main: 'top'
        });
    },
    moveCursorsRight: function(e, n) {
        var moveRight;
        if (n == null) {
            n = 1;
        }
        moveRight = function(n) {
            return function(c) {
                return [c[0] + n, c[1]];
            };
        };
        return this.moveAllCursors(moveRight(n), {
            extend: e,
            keepLine: true,
            main: 'right'
        });
    },
    moveCursorsLeft: function(e, n) {
        var moveLeft;
        if (n == null) {
            n = 1;
        }
        moveLeft = function(n) {
            return function(c) {
                return [Math.max(0, c[0] - n), c[1]];
            };
        };
        return this.moveAllCursors(moveLeft(n), {
            extend: e,
            keepLine: true,
            main: 'left'
        });
    },
    moveCursorsDown: function(e, n) {
        var c, newSelections;
        if (n == null) {
            n = 1;
        }
        if (e && this.numSelections() === 0) {
            if (0 === _.max((function() {
                var j, len, ref, results;
                ref = this.cursors();
                results = [];
                for (j = 0, len = ref.length; j < len; j++) {
                    c = ref[j];
                    results.push(c[0]);
                }
                return results;
            }).call(this))) {
                this["do"].start();
                this["do"].select(this.rangesForCursorLines());
                this["do"].end();
                return;
            }
        } else if (e && this.stickySelection && this.numCursors() === 1) {
            if (this.mainCursor()[0] === 0 && !this.isSelectedLineAtIndex(this.mainCursor()[1])) {
                this["do"].start();
                newSelections = this["do"].selections();
                newSelections.push(this.rangeForLineAtIndex(this.mainCursor()[1]));
                this["do"].select(newSelections);
                this["do"].end();
                return;
            }
        }
        return this.moveAllCursors((function(n) {
            return function(c) {
                return [c[0], c[1] + n];
            };
        })(n), {
            extend: e,
            main: 'bot'
        });
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW92ZWN1cnNvcnMuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4vY29mZmVlL2VkaXRvci9hY3Rpb25zIiwic291cmNlcyI6WyJtb3ZlY3Vyc29ycy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQU9BLElBQUE7O0FBQUUsSUFBTSxPQUFBLENBQVEsS0FBUjs7QUFFUixNQUFNLENBQUMsT0FBUCxHQUVJO0lBQUEsT0FBQSxFQUNJO1FBQUEsSUFBQSxFQUFNLFNBQU47UUFFQSx5QkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFNLHlDQUFOO1lBQ0EsS0FBQSxFQUFPLGNBRFA7WUFFQSxLQUFBLEVBQU8sV0FGUDtTQUhKO1FBT0EsMEJBQUEsRUFDSTtZQUFBLElBQUEsRUFBTSw2QkFBTjtZQUNBLEtBQUEsRUFBTyxlQURQO1lBRUEsS0FBQSxFQUFPLFlBRlA7U0FSSjtRQVlBLHlCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQVEsaUNBQVI7WUFDQSxJQUFBLEVBQVEsNEVBRFI7WUFFQSxNQUFBLEVBQVEsQ0FBQyxnQkFBRCxFQUFtQixpQkFBbkIsQ0FGUjtTQWJKO1FBaUJBLDZCQUFBLEVBQ0k7WUFBQSxTQUFBLEVBQVcsSUFBWDtZQUNBLElBQUEsRUFBUSwrQkFEUjtZQUVBLEtBQUEsRUFBUSxVQUZSO1NBbEJKO1FBc0JBLDhCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQVEsNkJBQVI7WUFDQSxLQUFBLEVBQVEsV0FEUjtTQXZCSjtRQTBCQSx5QkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFRLGlDQUFSO1lBQ0EsSUFBQSxFQUFRLDRFQURSO1lBRUEsTUFBQSxFQUFRLENBQUMsTUFBRCxFQUFTLEtBQVQsRUFBZ0Isb0JBQWhCLEVBQXNDLHFCQUF0QyxFQUE2RCxpQkFBN0QsRUFBZ0Ysa0JBQWhGLENBRlI7WUFHQSxNQUFBLEVBQVEsQ0FBQyxNQUFELEVBQVMsS0FBVCxFQUFnQixZQUFoQixFQUE4QixXQUE5QixFQUEyQyxpQkFBM0MsRUFBOEQsa0JBQTlELENBSFI7U0Ez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Q0FBZ0IsQ0FBQyxTQUFDLENBQUQ7bUJBQUssU0FBQyxDQUFEO3VCQUFLLENBQUMsQ0FBRSxDQUFBLENBQUEsQ0FBSCxFQUFNLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBSyxDQUFYO1lBQUw7UUFBTCxDQUFELENBQUEsQ0FBMEIsQ0FBMUIsQ0FBaEIsRUFBOEM7WUFBQSxNQUFBLEVBQU8sQ0FBUDtZQUFVLElBQUEsRUFBTSxLQUFoQjtTQUE5QztJQWpCYSxDQXBNakIiLCJzb3VyY2VzQ29udGVudCI6WyJcbiMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4jIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiMgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAgIDAgICAgICAwMDAwMDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbnsgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IFxuXG4gICAgYWN0aW9uczpcbiAgICAgICAgbWVudTogJ0N1cnNvcnMnXG4gICAgICAgIFxuICAgICAgICBtb3ZlQ3Vyc29yc0F0Qm91bmRhcnlMZWZ0OiBcbiAgICAgICAgICAgIG5hbWU6ICdNb3ZlIEN1cnNvcnMgdG8gSW5kZW50IG9yIFN0YXJ0IG9mIExpbmUnXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrbGVmdCdcbiAgICAgICAgICAgIGFjY2VsOiAnY3RybCtsZWZ0J1xuXG4gICAgICAgIG1vdmVDdXJzb3JzQXRCb3VuZGFyeVJpZ2h0OiBcbiAgICAgICAgICAgIG5hbWU6ICdNb3ZlIEN1cnNvcnMgdG8gRW5kIG9mIExpbmUnXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrcmlnaHQnXG4gICAgICAgICAgICBhY2NlbDogJ2N0cmwrcmlnaHQnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIG1vdmVDdXJzb3JzVG9Xb3JkQm91bmRhcnk6XG4gICAgICAgICAgICBuYW1lOiAgICdtb3ZlIGN1cnNvcnMgdG8gd29yZCBib3VuZGFyaWVzJ1xuICAgICAgICAgICAgdGV4dDogICAnbW92ZXMgY3Vyc29ycyB0byB3b3JkIGJvdW5kYXJpZXMuIGV4dGVuZHMgc2VsZWN0aW9ucywgaWYgc2hpZnQgaXMgcHJlc3NlZC4nICAgICAgICAgICAgXG4gICAgICAgICAgICBjb21ib3M6IFsnYWx0K3NoaWZ0K2xlZnQnLCAnYWx0K3NoaWZ0K3JpZ2h0J11cbiAgICAgICAgXG4gICAgICAgIG1vdmVDdXJzb3JzVG9Xb3JkQm91bmRhcnlMZWZ0OlxuICAgICAgICAgICAgc2VwYXJhdG9yOiB0cnVlXG4gICAgICAgICAgICBuYW1lOiAgICdNb3ZlIEN1cnNvcnMgdG8gU3RhcnQgb2YgV29yZCdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtsZWZ0J1xuXG4gICAgICAgIG1vdmVDdXJzb3JzVG9Xb3JkQm91bmRhcnlSaWdodDpcbiAgICAgICAgICAgIG5hbWU6ICAgJ01vdmUgQ3Vyc29ycyB0byBFbmQgb2YgV29yZCdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtyaWdodCdcbiAgICAgICAgICAgIFxuICAgICAgICBtb3ZlQ3Vyc29yc1RvTGluZUJvdW5kYXJ5OlxuICAgICAgICAgICAgbmFtZTogICAnbW92ZSBjdXJzb3JzIHRvIGxpbmUgYm91bmRhcmllcydcbiAgICAgICAgICAgIHRleHQ6ICAgJ21vdmVzIGN1cnNvcnMgdG8gbGluZSBib3VuZGFyaWVzLiBleHRlbmRzIHNlbGVjdGlvbnMsIGlmIHNoaWZ0IGlzIHByZXNzZWQuJ1xuICAgICAgICAgICAgY29tYm9zOiBbJ2hvbWUnLCAnZW5kJywgJ2NvbW1hbmQrc2hpZnQrbGVmdCcsICdjb21tYW5kK3NoaWZ0K3JpZ2h0JywgJ2N0cmwrc2hpZnQrbGVmdCcsICdjdHJsK3NoaWZ0K3JpZ2h0J11cbiAgICAgICAgICAgIGFjY2VsczogWydob21lJywgJ2VuZCcsICdzaGlmdCtob21lJywgJ3NoaWZ0K2VuZCcsICdjdHJsK3NoaWZ0K2xlZnQnLCAnY3RybCtzaGlmdCtyaWdodCddXG5cbiAgICAgICAgbW92ZU1haW5DdXJzb3I6XG4gICAgICAgICAgICBuYW1lOiAgICdtb3ZlIG1haW4gY3Vyc29yJ1xuICAgICAgICAgICAgdGV4dDogICBcIlwiXCJtb3ZlIG1haW4gY3Vyc29yIGluZGVwZW5kZW50bHkgb2Ygb3RoZXIgY3Vyc29ycy5cbiAgICAgICAgICAgICAgICBlcmFzZXMgb3RoZXIgY3Vyc29ycyBpZiBzaGlmdCBpcyBwcmVzc2VkLiBcbiAgICAgICAgICAgICAgICBzZXRzIG5ldyBjdXJzb3JzIG90aGVyd2lzZS5cIlwiXCJcbiAgICAgICAgICAgIGNvbWJvczogWyAnY3RybCtzaGlmdCt1cCcsICdjdHJsK3NoaWZ0K2Rvd24nLCAnY3RybCtzaGlmdCtsZWZ0JywgJ2N0cmwrc2hpZnQrcmlnaHQnLCAnY3RybCt1cCcsICdjdHJsK2Rvd24nLCAnY3RybCtsZWZ0JywgJ2N0cmwrcmlnaHQnXVxuICAgICAgICAgICAgYWNjZWxzOiBbICdjdHJsK3NoaWZ0K3VwJywgJ2N0cmwrc2hpZnQrZG93biddXG4gICAgICAgICAgICBcbiAgICAgICAgbW92ZUN1cnNvcnM6XG4gICAgICAgICAgICBuYW1lOiAgJ21vdmUgY3Vyc29ycydcbiAgICAgICAgICAgIGNvbWJvczogWydsZWZ0JywgJ3JpZ2h0JywgJ3VwJywgJ2Rvd24nLCAnc2hpZnQrZG93bicsICdzaGlmdCtyaWdodCcsICdzaGlmdCt1cCcsICdzaGlmdCtsZWZ0J11cblxuICAgIG1vdmVDdXJzb3JzQXRCb3VuZGFyeUxlZnQ6ICAtPiBAc2V0T3JNb3ZlQ3Vyc29yc0F0Qm91bmRhcnkgJ2xlZnQnXG4gICAgbW92ZUN1cnNvcnNBdEJvdW5kYXJ5UmlnaHQ6IC0+IEBzZXRPck1vdmVDdXJzb3JzQXRCb3VuZGFyeSAncmlnaHQnXG4gICAgICAgIFxuICAgIHNldE9yTW92ZUN1cnNvcnNBdEJvdW5kYXJ5OiAoa2V5KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQG51bVNlbGVjdGlvbnMoKSA+IDEgYW5kIEBudW1DdXJzb3JzKCkgPT0gMVxuICAgICAgICAgICAgQHNldEN1cnNvcnNBdFNlbGVjdGlvbkJvdW5kYXJ5IGtleVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbW92ZUN1cnNvcnNUb0xpbmVCb3VuZGFyeSBrZXlcblxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgbW92ZU1haW5DdXJzb3I6IChrZXksIGluZm8pIC0+XG4gICAgICAgIFxuICAgICAgICBkaXIgPSBrZXkgXG4gICAgICAgIGhyeiA9IGtleSBpbiBbJ2xlZnQnLCAncmlnaHQnXVxuICAgICAgICBvcHQgPSBfLmNsb25lIGluZm9cbiAgICAgICAgb3B0LmVyYXNlID89IGluZm8ubW9kPy5pbmRleE9mKCdzaGlmdCcpID49IDAgb3IgaHJ6XG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIFtkeCwgZHldID0gc3dpdGNoIGRpclxuICAgICAgICAgICAgd2hlbiAndXAnICAgIHRoZW4gWzAsLTFdXG4gICAgICAgICAgICB3aGVuICdkb3duJyAgdGhlbiBbMCwrMV1cbiAgICAgICAgICAgIHdoZW4gJ2xlZnQnICB0aGVuIFstMSwwXVxuICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gWysxLDBdXG4gICAgICAgIG5ld0N1cnNvcnMgPSBAZG8uY3Vyc29ycygpXG4gICAgICAgIG9sZE1haW4gPSBAbWFpbkN1cnNvcigpXG4gICAgICAgIG5ld01haW4gPSBbb2xkTWFpblswXStkeCwgb2xkTWFpblsxXStkeV1cbiAgICAgICAgXy5yZW1vdmUgbmV3Q3Vyc29ycywgKGMpIC0+IFxuICAgICAgICAgICAgaWYgb3B0Py5lcmFzZVxuICAgICAgICAgICAgICAgIGlzU2FtZVBvcyhjLCBvbGRNYWluKSBvciBpc1NhbWVQb3MoYywgbmV3TWFpbilcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpc1NhbWVQb3MoYywgbmV3TWFpbilcbiAgICAgICAgbmV3Q3Vyc29ycy5wdXNoIG5ld01haW5cbiAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29ycywgbWFpbjpuZXdNYWluXG4gICAgICAgIEBkby5lbmQoKVxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBcbiAgICBtb3ZlQ3Vyc29yc1RvV29yZEJvdW5kYXJ5TGVmdDogIC0+IEBtb3ZlQ3Vyc29yc1RvV29yZEJvdW5kYXJ5ICdsZWZ0J1xuICAgIG1vdmVDdXJzb3JzVG9Xb3JkQm91bmRhcnlSaWdodDogLT4gQG1vdmVDdXJzb3JzVG9Xb3JkQm91bmRhcnkgJ3JpZ2h0J1xuICAgIFxuICAgIG1vdmVDdXJzb3JzVG9Xb3JkQm91bmRhcnk6IChsZWZ0T3JSaWdodCwgaW5mbyA9IGV4dGVuZDpmYWxzZSkgLT5cbiAgICAgICAgZXh0ZW5kID0gaW5mby5leHRlbmQgPyAwIDw9IGluZm8ubW9kLmluZGV4T2YgJ3NoaWZ0J1xuICAgICAgICBmID0gc3dpdGNoIGxlZnRPclJpZ2h0XG4gICAgICAgICAgICB3aGVuICdyaWdodCcgdGhlbiBAZW5kT2ZXb3JkQXRQb3NcbiAgICAgICAgICAgIHdoZW4gJ2xlZnQnICB0aGVuIEBzdGFydE9mV29yZEF0UG9zXG4gICAgICAgIEBtb3ZlQWxsQ3Vyc29ycyBmLCBleHRlbmQ6ZXh0ZW5kLCBrZWVwTGluZTp0cnVlXG4gICAgICAgIHRydWVcblxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgbW92ZUN1cnNvcnNUb0xpbmVCb3VuZGFyeTogKGtleSwgaW5mbyA9IGV4dGVuZDpmYWxzZSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIGV4dGVuZCA9IGluZm8uZXh0ZW5kID8gMCA8PSBpbmZvLm1vZC5pbmRleE9mICdzaGlmdCdcbiAgICAgICAgZnVuYyA9IHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JywgJ2UnLCAnZW5kJyB0aGVuIChjKSA9PiBbQGRvLmxpbmUoY1sxXSkubGVuZ3RoLCBjWzFdXVxuICAgICAgICAgICAgd2hlbiAnbGVmdCcsICdhJywgJ2hvbWUnICB0aGVuIChjKSA9PiBcbiAgICAgICAgICAgICAgICBpZiBAZG8ubGluZShjWzFdKS5zbGljZSgwLGNbMF0pLnRyaW0oKS5sZW5ndGggPT0gMFxuICAgICAgICAgICAgICAgICAgICBbMCwgY1sxXV1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGQgPSBAZG8ubGluZShjWzFdKS5sZW5ndGggLSBAZG8ubGluZShjWzFdKS50cmltTGVmdCgpLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBbZCwgY1sxXV1cbiAgICAgICAgQG1vdmVBbGxDdXJzb3JzIGZ1bmMsIGV4dGVuZDpleHRlbmQsIGtlZXBMaW5lOnRydWVcbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICBtb3ZlQ3Vyc29yczogKGtleSwgaW5mbyA9IGV4dGVuZDpmYWxzZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGV4dGVuZCA9IGluZm8uZXh0ZW5kID8gJ3NoaWZ0JyA9PSBpbmZvLm1vZFxuICAgICAgICBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiBAbW92ZUN1cnNvcnNMZWZ0ICBleHRlbmRcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuIEBtb3ZlQ3Vyc29yc1JpZ2h0IGV4dGVuZFxuICAgICAgICAgICAgd2hlbiAndXAnICAgIHRoZW4gQG1vdmVDdXJzb3JzVXAgICAgZXh0ZW5kXG4gICAgICAgICAgICB3aGVuICdkb3duJyAgdGhlbiBAbW92ZUN1cnNvcnNEb3duICBleHRlbmRcbiAgICAgICAgXG4gICAgc2V0Q3Vyc29yc0F0U2VsZWN0aW9uQm91bmRhcnk6IChsZWZ0T3JSaWdodD0ncmlnaHQnKSAtPlxuICAgICAgICBcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgaSA9IGxlZnRPclJpZ2h0ID09ICdyaWdodCcgYW5kIDEgb3IgMFxuICAgICAgICBuZXdDdXJzb3JzID0gW11cbiAgICAgICAgbWFpbiA9ICdsYXN0J1xuICAgICAgICBmb3IgcyBpbiBAZG8uc2VsZWN0aW9ucygpXG4gICAgICAgICAgICBwID0gcmFuZ2VJbmRleFBvcyBzLGlcbiAgICAgICAgICAgIG5ld0N1cnNvcnMucHVzaCBwXG4gICAgICAgICAgICBpZiBAaXNDdXJzb3JJblJhbmdlIHNcbiAgICAgICAgICAgICAgICBtYWluID0gbmV3Q3Vyc29ycy5pbmRleE9mIHBcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29ycywgbWFpbjptYWluXG4gICAgICAgIEBkby5lbmQoKSAgICAgICBcbiAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAgIFxuICAgIFxuICAgIG1vdmVBbGxDdXJzb3JzOiAoZnVuYywgb3B0ID0gZXh0ZW5kOmZhbHNlLCBrZWVwTGluZTp0cnVlKSAtPiBcbiAgICAgICAgXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBAc3RhcnRTZWxlY3Rpb24gb3B0XG4gICAgICAgIG5ld0N1cnNvcnMgPSBAZG8uY3Vyc29ycygpXG4gICAgICAgIG9sZE1haW4gPSBAZG8ubWFpbkN1cnNvcigpXG4gICAgICAgIG1haW5MaW5lID0gb2xkTWFpblsxXVxuICAgICAgICBcbiAgICAgICAgaWYgbmV3Q3Vyc29ycy5sZW5ndGggPiAxXG4gICAgICAgICAgICBmb3IgYyBpbiBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgbmV3UG9zID0gZnVuYyBjIFxuICAgICAgICAgICAgICAgIGlmIG5ld1Bvc1sxXSA9PSBjWzFdIG9yIG5vdCBvcHQua2VlcExpbmVcbiAgICAgICAgICAgICAgICAgICAgbWFpbkxpbmUgPSBuZXdQb3NbMV0gaWYgaXNTYW1lUG9zIG9sZE1haW4sIGNcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yU2V0IGMsIG5ld1Bvc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjdXJzb3JTZXQgbmV3Q3Vyc29yc1swXSwgZnVuYyBuZXdDdXJzb3JzWzBdXG4gICAgICAgICAgICBtYWluTGluZSA9IG5ld0N1cnNvcnNbMF1bMV1cbiAgICAgICAgICAgIFxuICAgICAgICBtYWluID0gc3dpdGNoIG9wdC5tYWluXG4gICAgICAgICAgICB3aGVuICd0b3AnICAgdGhlbiAnZmlyc3QnXG4gICAgICAgICAgICB3aGVuICdib3QnICAgdGhlbiAnbGFzdCdcbiAgICAgICAgICAgIHdoZW4gJ2xlZnQnICB0aGVuICdjbG9zZXN0J1xuICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gJ2Nsb3Nlc3QnXG4gICAgICAgICAgICBcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29ycywgbWFpbjptYWluXG4gICAgICAgIEBlbmRTZWxlY3Rpb24gb3B0XG4gICAgICAgIEBkby5lbmQoKVxuICAgICAgICBcbiAgICBtb3ZlQ3Vyc29yc1VwOiAoZSwgbj0xKSAtPiBcbiAgICAgICAgXG4gICAgICAgIEBtb3ZlQWxsQ3Vyc29ycyAoKG4pLT4oYyktPltjWzBdLGNbMV0tbl0pKG4pLCBleHRlbmQ6ZSwgbWFpbjogJ3RvcCdcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIG1vdmVDdXJzb3JzUmlnaHQ6IChlLCBuPTEpIC0+XG4gICAgICAgIFxuICAgICAgICBtb3ZlUmlnaHQgPSAobikgLT4gKGMpIC0+IFtjWzBdK24sIGNbMV1dXG4gICAgICAgIEBtb3ZlQWxsQ3Vyc29ycyBtb3ZlUmlnaHQobiksIGV4dGVuZDplLCBrZWVwTGluZTp0cnVlLCBtYWluOiAncmlnaHQnXG4gICAgXG4gICAgbW92ZUN1cnNvcnNMZWZ0OiAoZSwgbj0xKSAtPlxuICAgICAgICBcbiAgICAgICAgbW92ZUxlZnQgPSAobikgLT4gKGMpIC0+IFtNYXRoLm1heCgwLGNbMF0tbiksIGNbMV1dXG4gICAgICAgIEBtb3ZlQWxsQ3Vyc29ycyBtb3ZlTGVmdChuKSwgZXh0ZW5kOmUsIGtlZXBMaW5lOnRydWUsIG1haW46ICdsZWZ0J1xuICAgICAgICBcbiAgICBtb3ZlQ3Vyc29yc0Rvd246IChlLCBuPTEpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBlIGFuZCBAbnVtU2VsZWN0aW9ucygpID09IDAgIyBzZWxlY3RpbmcgbGluZXMgZG93blxuICAgICAgICAgICAgaWYgMCA9PSBfLm1heCAoY1swXSBmb3IgYyBpbiBAY3Vyc29ycygpKSAjIGFsbCBjdXJzb3JzIGluIGZpcnN0IGNvbHVtblxuICAgICAgICAgICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgICAgICAgICAgQGRvLnNlbGVjdCBAcmFuZ2VzRm9yQ3Vyc29yTGluZXMoKSAjIHNlbGVjdCBsaW5lcyB3aXRob3V0IG1vdmluZyBjdXJzb3JzXG4gICAgICAgICAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIGVsc2UgaWYgZSBhbmQgQHN0aWNreVNlbGVjdGlvbiBhbmQgQG51bUN1cnNvcnMoKSA9PSAxXG4gICAgICAgICAgICBpZiBAbWFpbkN1cnNvcigpWzBdID09IDAgYW5kIG5vdCBAaXNTZWxlY3RlZExpbmVBdEluZGV4IEBtYWluQ3Vyc29yKClbMV1cbiAgICAgICAgICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICAgICAgICAgIG5ld1NlbGVjdGlvbnMgPSBAZG8uc2VsZWN0aW9ucygpXG4gICAgICAgICAgICAgICAgbmV3U2VsZWN0aW9ucy5wdXNoIEByYW5nZUZvckxpbmVBdEluZGV4IEBtYWluQ3Vyc29yKClbMV1cbiAgICAgICAgICAgICAgICBAZG8uc2VsZWN0IG5ld1NlbGVjdGlvbnNcbiAgICAgICAgICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICBAbW92ZUFsbEN1cnNvcnMgKChuKS0+KGMpLT5bY1swXSxjWzFdK25dKShuKSwgZXh0ZW5kOmUsIG1haW46ICdib3QnXG4gICAgICAgIFxuIl19
//# sourceURL=../../../coffee/editor/actions/movecursors.coffee