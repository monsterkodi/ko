// koffee 1.4.0
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW92ZWN1cnNvcnMuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFPQSxJQUFBOztBQUFFLElBQU0sT0FBQSxDQUFRLEtBQVI7O0FBRVIsTUFBTSxDQUFDLE9BQVAsR0FFSTtJQUFBLE9BQUEsRUFDSTtRQUFBLElBQUEsRUFBTSxTQUFOO1FBRUEseUJBQUEsRUFDSTtZQUFBLElBQUEsRUFBTSx5Q0FBTjtZQUNBLEtBQUEsRUFBTyxjQURQO1lBRUEsS0FBQSxFQUFPLFdBRlA7U0FISjtRQU9BLDBCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU0sNkJBQU47WUFDQSxLQUFBLEVBQU8sZUFEUDtZQUVBLEtBQUEsRUFBTyxZQUZQO1NBUko7UUFZQSx5QkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFRLGlDQUFSO1lBQ0EsSUFBQSxFQUFRLDRFQURSO1lBRUEsTUFBQSxFQUFRLENBQUMsZ0JBQUQsRUFBbUIsaUJBQW5CLENBRlI7U0FiSjtRQWlCQSw2QkFBQSxFQUNJO1lBQUEsU0FBQSxFQUFXLElBQVg7WUFDQSxJQUFBLEVBQVEsK0JBRFI7WUFFQSxLQUFBLEVBQVEsVUFGUjtTQWxCSjtRQXNCQSw4QkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFRLDZCQUFSO1lBQ0EsS0FBQSxFQUFRLFdBRFI7U0F2Qko7UUEwQkEseUJBQUEsRUFDSTtZQUFBLElBQUEsRUFBUSxpQ0FBUjtZQUNBLElBQUEsRUFBUSw0RUFEUjtZQUVBLE1BQUEsRUFBUSxDQUFDLE1BQUQsRUFBUyxLQUFULEVBQWdCLG9CQUFoQixFQUFzQyxxQkFBdEMsRUFBNkQsaUJBQTdELEVBQWdGLGtCQUFoRixDQUZSO1lBR0EsTUFBQSxFQUFRLENBQUMsTUFBRCxFQUFTLEtBQVQsRUFBZ0IsWUFBaEIsRUFBOEIsV0FBOUIsRUFBMkMsaUJBQTNDLEVBQThELGtCQUE5RCxDQUhSO1NBM0JKO1FBZ0NBLGNBQUEsRUFDSTtZQUFBLElBQUEsRUFBUSxrQkFBUjtZQUNBLElBQUEsRUFBUSwySEFEUjtZQUlBLE1BQUEsRUFBUSxDQUFFLGVBQUYsRUFBbUIsaUJBQW5CLEVBQXNDLGlCQUF0QyxFQUF5RCxrQkFBekQsRUFBNkUsU0FBN0UsRUFBd0YsV0FBeEYsRUFBcUcsV0FBckcsRUFBa0gsWUFBbEgsQ0FKUjtZQUtBLE1BQUEsRUFBUSxDQUFFLGVBQUYsRUFBbUIsaUJBQW5CLENBTFI7U0FqQ0o7UUF3Q0EsV0FBQSxFQUNJO1lBQUEsSUFBQSxFQUFPLGNBQVA7WUFDQSxNQUFBLEVBQVEsQ0FBQyxNQUFELEVBQVMsT0FBVCxFQUFrQixJQUFsQixFQUF3QixNQUF4QixFQUFnQyxZQUFoQyxFQUE4QyxhQUE5QyxFQUE2RCxVQUE3RCxFQUF5RSxZQUF6RSxDQURSO1NBekNKO0tBREo7SUE2Q0EseUJBQUEsRUFBNEIsU0FBQTtlQUFHLElBQUMsQ0FBQSwwQkFBRCxDQUE0QixNQUE1QjtJQUFILENBN0M1QjtJQThDQSwwQkFBQSxFQUE0QixTQUFBO2VBQUcsSUFBQyxDQUFBLDBCQUFELENBQTRCLE9BQTVCO0lBQUgsQ0E5QzVCO0lBZ0RBLDBCQUFBLEVBQTRCLFNBQUMsR0FBRDtRQUV4QixJQUFHLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBQSxHQUFtQixDQUFuQixJQUF5QixJQUFDLENBQUEsVUFBRCxDQUFBLENBQUEsS0FBaUIsQ0FBN0M7bUJBQ0ksSUFBQyxDQUFBLDZCQUFELENBQStCLEdBQS9CLEVBREo7U0FBQSxNQUFBO21CQUdJLElBQUMsQ0FBQSx5QkFBRCxDQUEyQixHQUEzQixFQUhKOztJQUZ3QixDQWhENUI7SUE2REEsY0FBQSxFQUFnQixTQUFDLEdBQUQsRUFBTSxJQUFOO0FBRVosWUFBQTtRQUFBLEdBQUEsR0FBTTtRQUNOLEdBQUEsR0FBTSxHQUFBLEtBQVEsTUFBUixJQUFBLEdBQUEsS0FBZ0I7UUFDdEIsR0FBQSxHQUFNLENBQUMsQ0FBQyxLQUFGLENBQVEsSUFBUjs7WUFDTixHQUFHLENBQUM7O1lBQUosR0FBRyxDQUFDLHVDQUFpQixDQUFFLE9BQVYsQ0FBa0IsT0FBbEIsV0FBQSxJQUE4QixDQUE5QixJQUFtQzs7UUFDaEQsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEtBQUosQ0FBQTtRQUNBO0FBQVcsb0JBQU8sR0FBUDtBQUFBLHFCQUNGLElBREU7MkJBQ1csQ0FBQyxDQUFELEVBQUcsQ0FBQyxDQUFKO0FBRFgscUJBRUYsTUFGRTsyQkFFVyxDQUFDLENBQUQsRUFBRyxDQUFDLENBQUo7QUFGWCxxQkFHRixNQUhFOzJCQUdXLENBQUMsQ0FBQyxDQUFGLEVBQUksQ0FBSjtBQUhYLHFCQUlGLE9BSkU7MkJBSVcsQ0FBQyxDQUFDLENBQUYsRUFBSSxDQUFKO0FBSlg7WUFBWCxFQUFDLFlBQUQsRUFBSztRQUtMLFVBQUEsR0FBYSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsT0FBSixDQUFBO1FBQ2IsT0FBQSxHQUFVLElBQUMsQ0FBQSxVQUFELENBQUE7UUFDVixPQUFBLEdBQVUsQ0FBQyxPQUFRLENBQUEsQ0FBQSxDQUFSLEdBQVcsRUFBWixFQUFnQixPQUFRLENBQUEsQ0FBQSxDQUFSLEdBQVcsRUFBM0I7UUFDVixDQUFDLENBQUMsTUFBRixDQUFTLFVBQVQsRUFBcUIsU0FBQyxDQUFEO1lBQ2pCLGtCQUFHLEdBQUcsQ0FBRSxjQUFSO3VCQUNJLFNBQUEsQ0FBVSxDQUFWLEVBQWEsT0FBYixDQUFBLElBQXlCLFNBQUEsQ0FBVSxDQUFWLEVBQWEsT0FBYixFQUQ3QjthQUFBLE1BQUE7dUJBR0ksU0FBQSxDQUFVLENBQVYsRUFBYSxPQUFiLEVBSEo7O1FBRGlCLENBQXJCO1FBS0EsVUFBVSxDQUFDLElBQVgsQ0FBZ0IsT0FBaEI7UUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsVUFBSixDQUFlLFVBQWYsRUFBMkI7WUFBQSxJQUFBLEVBQUssT0FBTDtTQUEzQjtlQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7SUF0QlksQ0E3RGhCO0lBNEZBLDZCQUFBLEVBQWdDLFNBQUE7ZUFBRyxJQUFDLENBQUEseUJBQUQsQ0FBMkIsTUFBM0I7SUFBSCxDQTVGaEM7SUE2RkEsOEJBQUEsRUFBZ0MsU0FBQTtlQUFHLElBQUMsQ0FBQSx5QkFBRCxDQUEyQixPQUEzQjtJQUFILENBN0ZoQztJQStGQSx5QkFBQSxFQUEyQixTQUFDLFdBQUQsRUFBYyxJQUFkO0FBQ3ZCLFlBQUE7O1lBRHFDLE9BQU87Z0JBQUEsTUFBQSxFQUFPLEtBQVA7OztRQUM1QyxNQUFBLHVDQUF1QixDQUFBLElBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFULENBQWlCLE9BQWpCO1FBQzVCLENBQUE7QUFBSSxvQkFBTyxXQUFQO0FBQUEscUJBQ0ssT0FETDsyQkFDa0IsSUFBQyxDQUFBO0FBRG5CLHFCQUVLLE1BRkw7MkJBRWtCLElBQUMsQ0FBQTtBQUZuQjs7UUFHSixJQUFDLENBQUEsY0FBRCxDQUFnQixDQUFoQixFQUFtQjtZQUFBLE1BQUEsRUFBTyxNQUFQO1lBQWUsUUFBQSxFQUFTLElBQXhCO1NBQW5CO2VBQ0E7SUFOdUIsQ0EvRjNCO0lBNkdBLHlCQUFBLEVBQTJCLFNBQUMsR0FBRCxFQUFNLElBQU47QUFFdkIsWUFBQTs7WUFGNkIsT0FBTztnQkFBQSxNQUFBLEVBQU8sS0FBUDs7O1FBRXBDLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxLQUFKLENBQUE7UUFDQSxNQUFBLHVDQUF1QixDQUFBLElBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFULENBQWlCLE9BQWpCO1FBQzVCLElBQUE7QUFBTyxvQkFBTyxHQUFQO0FBQUEscUJBQ0UsT0FERjtBQUFBLHFCQUNXLEdBRFg7QUFBQSxxQkFDZ0IsS0FEaEI7MkJBQzJCLENBQUEsU0FBQSxLQUFBOytCQUFBLFNBQUMsQ0FBRDttQ0FBTyxDQUFDLEtBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsQ0FBRSxDQUFBLENBQUEsQ0FBWCxDQUFjLENBQUMsTUFBaEIsRUFBd0IsQ0FBRSxDQUFBLENBQUEsQ0FBMUI7d0JBQVA7b0JBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtBQUQzQixxQkFFRSxNQUZGO0FBQUEscUJBRVUsR0FGVjtBQUFBLHFCQUVlLE1BRmY7MkJBRTRCLENBQUEsU0FBQSxLQUFBOytCQUFBLFNBQUMsQ0FBRDtBQUMzQixnQ0FBQTs0QkFBQSxJQUFHLEtBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsQ0FBRSxDQUFBLENBQUEsQ0FBWCxDQUFjLENBQUMsS0FBZixDQUFxQixDQUFyQixFQUF1QixDQUFFLENBQUEsQ0FBQSxDQUF6QixDQUE0QixDQUFDLElBQTdCLENBQUEsQ0FBbUMsQ0FBQyxNQUFwQyxLQUE4QyxDQUFqRDt1Q0FDSSxDQUFDLENBQUQsRUFBSSxDQUFFLENBQUEsQ0FBQSxDQUFOLEVBREo7NkJBQUEsTUFBQTtnQ0FHSSxDQUFBLEdBQUksS0FBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLElBQUosQ0FBUyxDQUFFLENBQUEsQ0FBQSxDQUFYLENBQWMsQ0FBQyxNQUFmLEdBQXdCLEtBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsQ0FBRSxDQUFBLENBQUEsQ0FBWCxDQUFjLENBQUMsUUFBZixDQUFBLENBQXlCLENBQUM7dUNBQ3RELENBQUMsQ0FBRCxFQUFJLENBQUUsQ0FBQSxDQUFBLENBQU4sRUFKSjs7d0JBRDJCO29CQUFBLENBQUEsQ0FBQSxDQUFBLElBQUE7QUFGNUI7O1FBUVAsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsSUFBaEIsRUFBc0I7WUFBQSxNQUFBLEVBQU8sTUFBUDtZQUFlLFFBQUEsRUFBUyxJQUF4QjtTQUF0QjtlQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7SUFidUIsQ0E3RzNCO0lBNEhBLFdBQUEsRUFBYSxTQUFDLEdBQUQsRUFBTSxJQUFOO0FBRVQsWUFBQTs7WUFGZSxPQUFPO2dCQUFBLE1BQUEsRUFBTyxLQUFQOzs7UUFFdEIsTUFBQSx1Q0FBdUIsT0FBQSxLQUFXLElBQUksQ0FBQztBQUN2QyxnQkFBTyxHQUFQO0FBQUEsaUJBQ1MsTUFEVDt1QkFDc0IsSUFBQyxDQUFBLGVBQUQsQ0FBa0IsTUFBbEI7QUFEdEIsaUJBRVMsT0FGVDt1QkFFc0IsSUFBQyxDQUFBLGdCQUFELENBQWtCLE1BQWxCO0FBRnRCLGlCQUdTLElBSFQ7dUJBR3NCLElBQUMsQ0FBQSxhQUFELENBQWtCLE1BQWxCO0FBSHRCLGlCQUlTLE1BSlQ7dUJBSXNCLElBQUMsQ0FBQSxlQUFELENBQWtCLE1BQWxCO0FBSnRCO0lBSFMsQ0E1SGI7SUFxSUEsNkJBQUEsRUFBK0IsU0FBQyxXQUFEO0FBRTNCLFlBQUE7O1lBRjRCLGNBQVk7O1FBRXhDLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxLQUFKLENBQUE7UUFDQSxDQUFBLEdBQUksV0FBQSxLQUFlLE9BQWYsSUFBMkIsQ0FBM0IsSUFBZ0M7UUFDcEMsVUFBQSxHQUFhO1FBQ2IsSUFBQSxHQUFPO0FBQ1A7QUFBQSxhQUFBLHFDQUFBOztZQUNJLENBQUEsR0FBSSxhQUFBLENBQWMsQ0FBZCxFQUFnQixDQUFoQjtZQUNKLFVBQVUsQ0FBQyxJQUFYLENBQWdCLENBQWhCO1lBQ0EsSUFBRyxJQUFDLENBQUEsZUFBRCxDQUFpQixDQUFqQixDQUFIO2dCQUNJLElBQUEsR0FBTyxVQUFVLENBQUMsT0FBWCxDQUFtQixDQUFuQixFQURYOztBQUhKO1FBS0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFVBQUosQ0FBZSxVQUFmLEVBQTJCO1lBQUEsSUFBQSxFQUFLLElBQUw7U0FBM0I7ZUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsR0FBSixDQUFBO0lBWjJCLENBckkvQjtJQXlKQSxjQUFBLEVBQWdCLFNBQUMsSUFBRCxFQUFPLEdBQVA7QUFFWixZQUFBOztZQUZtQixNQUFNO2dCQUFBLE1BQUEsRUFBTyxLQUFQO2dCQUFjLFFBQUEsRUFBUyxJQUF2Qjs7O1FBRXpCLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxLQUFKLENBQUE7UUFFQSxJQUFDLENBQUEsY0FBRCxDQUFnQixHQUFoQjtRQUNBLFVBQUEsR0FBYSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsT0FBSixDQUFBO1FBQ2IsT0FBQSxHQUFVLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxVQUFKLENBQUE7UUFDVixRQUFBLEdBQVcsT0FBUSxDQUFBLENBQUE7UUFFbkIsSUFBRyxVQUFVLENBQUMsTUFBWCxHQUFvQixDQUF2QjtBQUNJLGlCQUFBLDRDQUFBOztnQkFDSSxNQUFBLEdBQVMsSUFBQSxDQUFLLENBQUw7Z0JBQ1QsSUFBRyxNQUFPLENBQUEsQ0FBQSxDQUFQLEtBQWEsQ0FBRSxDQUFBLENBQUEsQ0FBZixJQUFxQixDQUFJLEdBQUcsQ0FBQyxRQUFoQztvQkFDSSxJQUF3QixTQUFBLENBQVUsT0FBVixFQUFtQixDQUFuQixDQUF4Qjt3QkFBQSxRQUFBLEdBQVcsTUFBTyxDQUFBLENBQUEsRUFBbEI7O29CQUNBLFNBQUEsQ0FBVSxDQUFWLEVBQWEsTUFBYixFQUZKOztBQUZKLGFBREo7U0FBQSxNQUFBO1lBT0ksU0FBQSxDQUFVLFVBQVcsQ0FBQSxDQUFBLENBQXJCLEVBQXlCLElBQUEsQ0FBSyxVQUFXLENBQUEsQ0FBQSxDQUFoQixDQUF6QjtZQUNBLFFBQUEsR0FBVyxVQUFXLENBQUEsQ0FBQSxDQUFHLENBQUEsQ0FBQSxFQVI3Qjs7UUFVQSxJQUFBO0FBQU8sb0JBQU8sR0FBRyxDQUFDLElBQVg7QUFBQSxxQkFDRSxLQURGOzJCQUNlO0FBRGYscUJBRUUsS0FGRjsyQkFFZTtBQUZmLHFCQUdFLE1BSEY7MkJBR2U7QUFIZixxQkFJRSxPQUpGOzJCQUllO0FBSmY7O1FBTVAsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFVBQUosQ0FBZSxVQUFmLEVBQTJCO1lBQUEsSUFBQSxFQUFLLElBQUw7U0FBM0I7UUFDQSxJQUFDLENBQUEsWUFBRCxDQUFjLEdBQWQ7ZUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsR0FBSixDQUFBO0lBM0JZLENBekpoQjtJQXNMQSxhQUFBLEVBQWUsU0FBQyxDQUFELEVBQUksQ0FBSjs7WUFBSSxJQUFFOztlQUVqQixJQUFDLENBQUEsY0FBRCxDQUFnQixDQUFDLFNBQUMsQ0FBRDttQkFBSyxTQUFDLENBQUQ7dUJBQUssQ0FBQyxDQUFFLENBQUEsQ0FBQSxDQUFILEVBQU0sQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFLLENBQVg7WUFBTDtRQUFMLENBQUQsQ0FBQSxDQUEwQixDQUExQixDQUFoQixFQUE4QztZQUFBLE1BQUEsRUFBTyxDQUFQO1lBQVUsSUFBQSxFQUFNLEtBQWhCO1NBQTlDO0lBRlcsQ0F0TGY7SUEwTEEsZ0JBQUEsRUFBa0IsU0FBQyxDQUFELEVBQUksQ0FBSjtBQUVkLFlBQUE7O1lBRmtCLElBQUU7O1FBRXBCLFNBQUEsR0FBWSxTQUFDLENBQUQ7bUJBQU8sU0FBQyxDQUFEO3VCQUFPLENBQUMsQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFLLENBQU4sRUFBUyxDQUFFLENBQUEsQ0FBQSxDQUFYO1lBQVA7UUFBUDtlQUNaLElBQUMsQ0FBQSxjQUFELENBQWdCLFNBQUEsQ0FBVSxDQUFWLENBQWhCLEVBQThCO1lBQUEsTUFBQSxFQUFPLENBQVA7WUFBVSxRQUFBLEVBQVMsSUFBbkI7WUFBeUIsSUFBQSxFQUFNLE9BQS9CO1NBQTlCO0lBSGMsQ0ExTGxCO0lBK0xBLGVBQUEsRUFBaUIsU0FBQyxDQUFELEVBQUksQ0FBSjtBQUViLFlBQUE7O1lBRmlCLElBQUU7O1FBRW5CLFFBQUEsR0FBVyxTQUFDLENBQUQ7bUJBQU8sU0FBQyxDQUFEO3VCQUFPLENBQUMsSUFBSSxDQUFDLEdBQUwsQ0FBUyxDQUFULEVBQVcsQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFLLENBQWhCLENBQUQsRUFBcUIsQ0FBRSxDQUFBLENBQUEsQ0FBdkI7WUFBUDtRQUFQO2VBQ1gsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsUUFBQSxDQUFTLENBQVQsQ0FBaEIsRUFBNkI7WUFBQSxNQUFBLEVBQU8sQ0FBUDtZQUFVLFFBQUEsRUFBUyxJQUFuQjtZQUF5QixJQUFBLEVBQU0sTUFBL0I7U0FBN0I7SUFIYSxDQS9MakI7SUFvTUEsZUFBQSxFQUFpQixTQUFDLENBQUQsRUFBSSxDQUFKO0FBRWIsWUFBQTs7WUFGaUIsSUFBRTs7UUFFbkIsSUFBRyxDQUFBLElBQU0sSUFBQyxDQUFBLGFBQUQsQ0FBQSxDQUFBLEtBQW9CLENBQTdCO1lBQ0ksSUFBRyxDQUFBLEtBQUssQ0FBQyxDQUFDLEdBQUY7O0FBQU87QUFBQTtxQkFBQSxxQ0FBQTs7aUNBQUEsQ0FBRSxDQUFBLENBQUE7QUFBRjs7eUJBQVAsQ0FBUjtnQkFDSSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsS0FBSixDQUFBO2dCQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxNQUFKLENBQVcsSUFBQyxDQUFBLG9CQUFELENBQUEsQ0FBWDtnQkFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsR0FBSixDQUFBO0FBQ0EsdUJBSko7YUFESjtTQUFBLE1BTUssSUFBRyxDQUFBLElBQU0sSUFBQyxDQUFBLGVBQVAsSUFBMkIsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFBLEtBQWlCLENBQS9DO1lBQ0QsSUFBRyxJQUFDLENBQUEsVUFBRCxDQUFBLENBQWMsQ0FBQSxDQUFBLENBQWQsS0FBb0IsQ0FBcEIsSUFBMEIsQ0FBSSxJQUFDLENBQUEscUJBQUQsQ0FBdUIsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFjLENBQUEsQ0FBQSxDQUFyQyxDQUFqQztnQkFDSSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsS0FBSixDQUFBO2dCQUNBLGFBQUEsR0FBZ0IsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFVBQUosQ0FBQTtnQkFDaEIsYUFBYSxDQUFDLElBQWQsQ0FBbUIsSUFBQyxDQUFBLG1CQUFELENBQXFCLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBYyxDQUFBLENBQUEsQ0FBbkMsQ0FBbkI7Z0JBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE1BQUosQ0FBVyxhQUFYO2dCQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7QUFDQSx1QkFOSjthQURDOztlQVNMLElBQUMsQ0FBQSxjQUFELENBQWdCLENBQUMsU0FBQyxDQUFEO21CQUFLLFNBQUMsQ0FBRDt1QkFBSyxDQUFDLENBQUUsQ0FBQSxDQUFBLENBQUgsRUFBTSxDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQUssQ0FBWDtZQUFMO1FBQUwsQ0FBRCxDQUFBLENBQTBCLENBQTFCLENBQWhCLEVBQThDO1lBQUEsTUFBQSxFQUFPLENBQVA7WUFBVSxJQUFBLEVBQU0sS0FBaEI7U0FBOUM7SUFqQmEsQ0FwTWpCIiwic291cmNlc0NvbnRlbnQiOlsiXG4jIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgXG4jIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICBcbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgICAwICAgICAgMDAwMDAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG57IF8gfSA9IHJlcXVpcmUgJ2t4aydcblxubW9kdWxlLmV4cG9ydHMgPSBcblxuICAgIGFjdGlvbnM6XG4gICAgICAgIG1lbnU6ICdDdXJzb3JzJ1xuICAgICAgICBcbiAgICAgICAgbW92ZUN1cnNvcnNBdEJvdW5kYXJ5TGVmdDogXG4gICAgICAgICAgICBuYW1lOiAnTW92ZSBDdXJzb3JzIHRvIEluZGVudCBvciBTdGFydCBvZiBMaW5lJ1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK2xlZnQnXG4gICAgICAgICAgICBhY2NlbDogJ2N0cmwrbGVmdCdcblxuICAgICAgICBtb3ZlQ3Vyc29yc0F0Qm91bmRhcnlSaWdodDogXG4gICAgICAgICAgICBuYW1lOiAnTW92ZSBDdXJzb3JzIHRvIEVuZCBvZiBMaW5lJ1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK3JpZ2h0J1xuICAgICAgICAgICAgYWNjZWw6ICdjdHJsK3JpZ2h0J1xuICAgICAgICAgICAgICAgIFxuICAgICAgICBtb3ZlQ3Vyc29yc1RvV29yZEJvdW5kYXJ5OlxuICAgICAgICAgICAgbmFtZTogICAnbW92ZSBjdXJzb3JzIHRvIHdvcmQgYm91bmRhcmllcydcbiAgICAgICAgICAgIHRleHQ6ICAgJ21vdmVzIGN1cnNvcnMgdG8gd29yZCBib3VuZGFyaWVzLiBleHRlbmRzIHNlbGVjdGlvbnMsIGlmIHNoaWZ0IGlzIHByZXNzZWQuJyAgICAgICAgICAgIFxuICAgICAgICAgICAgY29tYm9zOiBbJ2FsdCtzaGlmdCtsZWZ0JywgJ2FsdCtzaGlmdCtyaWdodCddXG4gICAgICAgIFxuICAgICAgICBtb3ZlQ3Vyc29yc1RvV29yZEJvdW5kYXJ5TGVmdDpcbiAgICAgICAgICAgIHNlcGFyYXRvcjogdHJ1ZVxuICAgICAgICAgICAgbmFtZTogICAnTW92ZSBDdXJzb3JzIHRvIFN0YXJ0IG9mIFdvcmQnXG4gICAgICAgICAgICBjb21ibzogICdhbHQrbGVmdCdcblxuICAgICAgICBtb3ZlQ3Vyc29yc1RvV29yZEJvdW5kYXJ5UmlnaHQ6XG4gICAgICAgICAgICBuYW1lOiAgICdNb3ZlIEN1cnNvcnMgdG8gRW5kIG9mIFdvcmQnXG4gICAgICAgICAgICBjb21ibzogICdhbHQrcmlnaHQnXG4gICAgICAgICAgICBcbiAgICAgICAgbW92ZUN1cnNvcnNUb0xpbmVCb3VuZGFyeTpcbiAgICAgICAgICAgIG5hbWU6ICAgJ21vdmUgY3Vyc29ycyB0byBsaW5lIGJvdW5kYXJpZXMnXG4gICAgICAgICAgICB0ZXh0OiAgICdtb3ZlcyBjdXJzb3JzIHRvIGxpbmUgYm91bmRhcmllcy4gZXh0ZW5kcyBzZWxlY3Rpb25zLCBpZiBzaGlmdCBpcyBwcmVzc2VkLidcbiAgICAgICAgICAgIGNvbWJvczogWydob21lJywgJ2VuZCcsICdjb21tYW5kK3NoaWZ0K2xlZnQnLCAnY29tbWFuZCtzaGlmdCtyaWdodCcsICdjdHJsK3NoaWZ0K2xlZnQnLCAnY3RybCtzaGlmdCtyaWdodCddXG4gICAgICAgICAgICBhY2NlbHM6IFsnaG9tZScsICdlbmQnLCAnc2hpZnQraG9tZScsICdzaGlmdCtlbmQnLCAnY3RybCtzaGlmdCtsZWZ0JywgJ2N0cmwrc2hpZnQrcmlnaHQnXVxuXG4gICAgICAgIG1vdmVNYWluQ3Vyc29yOlxuICAgICAgICAgICAgbmFtZTogICAnbW92ZSBtYWluIGN1cnNvcidcbiAgICAgICAgICAgIHRleHQ6ICAgXCJcIlwibW92ZSBtYWluIGN1cnNvciBpbmRlcGVuZGVudGx5IG9mIG90aGVyIGN1cnNvcnMuXG4gICAgICAgICAgICAgICAgZXJhc2VzIG90aGVyIGN1cnNvcnMgaWYgc2hpZnQgaXMgcHJlc3NlZC4gXG4gICAgICAgICAgICAgICAgc2V0cyBuZXcgY3Vyc29ycyBvdGhlcndpc2UuXCJcIlwiXG4gICAgICAgICAgICBjb21ib3M6IFsgJ2N0cmwrc2hpZnQrdXAnLCAnY3RybCtzaGlmdCtkb3duJywgJ2N0cmwrc2hpZnQrbGVmdCcsICdjdHJsK3NoaWZ0K3JpZ2h0JywgJ2N0cmwrdXAnLCAnY3RybCtkb3duJywgJ2N0cmwrbGVmdCcsICdjdHJsK3JpZ2h0J11cbiAgICAgICAgICAgIGFjY2VsczogWyAnY3RybCtzaGlmdCt1cCcsICdjdHJsK3NoaWZ0K2Rvd24nXVxuICAgICAgICAgICAgXG4gICAgICAgIG1vdmVDdXJzb3JzOlxuICAgICAgICAgICAgbmFtZTogICdtb3ZlIGN1cnNvcnMnXG4gICAgICAgICAgICBjb21ib3M6IFsnbGVmdCcsICdyaWdodCcsICd1cCcsICdkb3duJywgJ3NoaWZ0K2Rvd24nLCAnc2hpZnQrcmlnaHQnLCAnc2hpZnQrdXAnLCAnc2hpZnQrbGVmdCddXG5cbiAgICBtb3ZlQ3Vyc29yc0F0Qm91bmRhcnlMZWZ0OiAgLT4gQHNldE9yTW92ZUN1cnNvcnNBdEJvdW5kYXJ5ICdsZWZ0J1xuICAgIG1vdmVDdXJzb3JzQXRCb3VuZGFyeVJpZ2h0OiAtPiBAc2V0T3JNb3ZlQ3Vyc29yc0F0Qm91bmRhcnkgJ3JpZ2h0J1xuICAgICAgICBcbiAgICBzZXRPck1vdmVDdXJzb3JzQXRCb3VuZGFyeTogKGtleSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBudW1TZWxlY3Rpb25zKCkgPiAxIGFuZCBAbnVtQ3Vyc29ycygpID09IDFcbiAgICAgICAgICAgIEBzZXRDdXJzb3JzQXRTZWxlY3Rpb25Cb3VuZGFyeSBrZXlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG1vdmVDdXJzb3JzVG9MaW5lQm91bmRhcnkga2V5XG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG1vdmVNYWluQ3Vyc29yOiAoa2V5LCBpbmZvKSAtPlxuICAgICAgICBcbiAgICAgICAgZGlyID0ga2V5IFxuICAgICAgICBocnogPSBrZXkgaW4gWydsZWZ0JywgJ3JpZ2h0J11cbiAgICAgICAgb3B0ID0gXy5jbG9uZSBpbmZvXG4gICAgICAgIG9wdC5lcmFzZSA/PSBpbmZvLm1vZD8uaW5kZXhPZignc2hpZnQnKSA+PSAwIG9yIGhyelxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBbZHgsIGR5XSA9IHN3aXRjaCBkaXJcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgICB0aGVuIFswLC0xXVxuICAgICAgICAgICAgd2hlbiAnZG93bicgIHRoZW4gWzAsKzFdXG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiBbLTEsMF1cbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuIFsrMSwwXVxuICAgICAgICBuZXdDdXJzb3JzID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICBvbGRNYWluID0gQG1haW5DdXJzb3IoKVxuICAgICAgICBuZXdNYWluID0gW29sZE1haW5bMF0rZHgsIG9sZE1haW5bMV0rZHldXG4gICAgICAgIF8ucmVtb3ZlIG5ld0N1cnNvcnMsIChjKSAtPiBcbiAgICAgICAgICAgIGlmIG9wdD8uZXJhc2VcbiAgICAgICAgICAgICAgICBpc1NhbWVQb3MoYywgb2xkTWFpbikgb3IgaXNTYW1lUG9zKGMsIG5ld01haW4pXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaXNTYW1lUG9zKGMsIG5ld01haW4pXG4gICAgICAgIG5ld0N1cnNvcnMucHVzaCBuZXdNYWluXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnMsIG1haW46bmV3TWFpblxuICAgICAgICBAZG8uZW5kKClcblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgXG4gICAgbW92ZUN1cnNvcnNUb1dvcmRCb3VuZGFyeUxlZnQ6ICAtPiBAbW92ZUN1cnNvcnNUb1dvcmRCb3VuZGFyeSAnbGVmdCdcbiAgICBtb3ZlQ3Vyc29yc1RvV29yZEJvdW5kYXJ5UmlnaHQ6IC0+IEBtb3ZlQ3Vyc29yc1RvV29yZEJvdW5kYXJ5ICdyaWdodCdcbiAgICBcbiAgICBtb3ZlQ3Vyc29yc1RvV29yZEJvdW5kYXJ5OiAobGVmdE9yUmlnaHQsIGluZm8gPSBleHRlbmQ6ZmFsc2UpIC0+XG4gICAgICAgIGV4dGVuZCA9IGluZm8uZXh0ZW5kID8gMCA8PSBpbmZvLm1vZC5pbmRleE9mICdzaGlmdCdcbiAgICAgICAgZiA9IHN3aXRjaCBsZWZ0T3JSaWdodFxuICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gQGVuZE9mV29yZEF0UG9zXG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiBAc3RhcnRPZldvcmRBdFBvc1xuICAgICAgICBAbW92ZUFsbEN1cnNvcnMgZiwgZXh0ZW5kOmV4dGVuZCwga2VlcExpbmU6dHJ1ZVxuICAgICAgICB0cnVlXG5cbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG1vdmVDdXJzb3JzVG9MaW5lQm91bmRhcnk6IChrZXksIGluZm8gPSBleHRlbmQ6ZmFsc2UpIC0+XG4gICAgICAgIFxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBleHRlbmQgPSBpbmZvLmV4dGVuZCA/IDAgPD0gaW5mby5tb2QuaW5kZXhPZiAnc2hpZnQnXG4gICAgICAgIGZ1bmMgPSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdyaWdodCcsICdlJywgJ2VuZCcgdGhlbiAoYykgPT4gW0Bkby5saW5lKGNbMV0pLmxlbmd0aCwgY1sxXV1cbiAgICAgICAgICAgIHdoZW4gJ2xlZnQnLCAnYScsICdob21lJyAgdGhlbiAoYykgPT4gXG4gICAgICAgICAgICAgICAgaWYgQGRvLmxpbmUoY1sxXSkuc2xpY2UoMCxjWzBdKS50cmltKCkubGVuZ3RoID09IDBcbiAgICAgICAgICAgICAgICAgICAgWzAsIGNbMV1dXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBkID0gQGRvLmxpbmUoY1sxXSkubGVuZ3RoIC0gQGRvLmxpbmUoY1sxXSkudHJpbUxlZnQoKS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgW2QsIGNbMV1dXG4gICAgICAgIEBtb3ZlQWxsQ3Vyc29ycyBmdW5jLCBleHRlbmQ6ZXh0ZW5kLCBrZWVwTGluZTp0cnVlXG4gICAgICAgIEBkby5lbmQoKVxuXG4gICAgbW92ZUN1cnNvcnM6IChrZXksIGluZm8gPSBleHRlbmQ6ZmFsc2UpIC0+XG4gICAgICAgIFxuICAgICAgICBleHRlbmQgPSBpbmZvLmV4dGVuZCA/ICdzaGlmdCcgPT0gaW5mby5tb2RcbiAgICAgICAgc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAnbGVmdCcgIHRoZW4gQG1vdmVDdXJzb3JzTGVmdCAgZXh0ZW5kXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgdGhlbiBAbW92ZUN1cnNvcnNSaWdodCBleHRlbmRcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgICB0aGVuIEBtb3ZlQ3Vyc29yc1VwICAgIGV4dGVuZFxuICAgICAgICAgICAgd2hlbiAnZG93bicgIHRoZW4gQG1vdmVDdXJzb3JzRG93biAgZXh0ZW5kXG4gICAgICAgIFxuICAgIHNldEN1cnNvcnNBdFNlbGVjdGlvbkJvdW5kYXJ5OiAobGVmdE9yUmlnaHQ9J3JpZ2h0JykgLT5cbiAgICAgICAgXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIGkgPSBsZWZ0T3JSaWdodCA9PSAncmlnaHQnIGFuZCAxIG9yIDBcbiAgICAgICAgbmV3Q3Vyc29ycyA9IFtdXG4gICAgICAgIG1haW4gPSAnbGFzdCdcbiAgICAgICAgZm9yIHMgaW4gQGRvLnNlbGVjdGlvbnMoKVxuICAgICAgICAgICAgcCA9IHJhbmdlSW5kZXhQb3MgcyxpXG4gICAgICAgICAgICBuZXdDdXJzb3JzLnB1c2ggcFxuICAgICAgICAgICAgaWYgQGlzQ3Vyc29ySW5SYW5nZSBzXG4gICAgICAgICAgICAgICAgbWFpbiA9IG5ld0N1cnNvcnMuaW5kZXhPZiBwXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnMsIG1haW46bWFpblxuICAgICAgICBAZG8uZW5kKCkgICAgICAgXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwICBcbiAgICBcbiAgICBtb3ZlQWxsQ3Vyc29yczogKGZ1bmMsIG9wdCA9IGV4dGVuZDpmYWxzZSwga2VlcExpbmU6dHJ1ZSkgLT4gXG4gICAgICAgIFxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgQHN0YXJ0U2VsZWN0aW9uIG9wdFxuICAgICAgICBuZXdDdXJzb3JzID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICBvbGRNYWluID0gQGRvLm1haW5DdXJzb3IoKVxuICAgICAgICBtYWluTGluZSA9IG9sZE1haW5bMV1cbiAgICAgICAgXG4gICAgICAgIGlmIG5ld0N1cnNvcnMubGVuZ3RoID4gMVxuICAgICAgICAgICAgZm9yIGMgaW4gbmV3Q3Vyc29yc1xuICAgICAgICAgICAgICAgIG5ld1BvcyA9IGZ1bmMgYyBcbiAgICAgICAgICAgICAgICBpZiBuZXdQb3NbMV0gPT0gY1sxXSBvciBub3Qgb3B0LmtlZXBMaW5lXG4gICAgICAgICAgICAgICAgICAgIG1haW5MaW5lID0gbmV3UG9zWzFdIGlmIGlzU2FtZVBvcyBvbGRNYWluLCBjXG4gICAgICAgICAgICAgICAgICAgIGN1cnNvclNldCBjLCBuZXdQb3NcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY3Vyc29yU2V0IG5ld0N1cnNvcnNbMF0sIGZ1bmMgbmV3Q3Vyc29yc1swXVxuICAgICAgICAgICAgbWFpbkxpbmUgPSBuZXdDdXJzb3JzWzBdWzFdXG4gICAgICAgICAgICBcbiAgICAgICAgbWFpbiA9IHN3aXRjaCBvcHQubWFpblxuICAgICAgICAgICAgd2hlbiAndG9wJyAgIHRoZW4gJ2ZpcnN0J1xuICAgICAgICAgICAgd2hlbiAnYm90JyAgIHRoZW4gJ2xhc3QnXG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiAnY2xvc2VzdCdcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuICdjbG9zZXN0J1xuICAgICAgICAgICAgXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnMsIG1haW46bWFpblxuICAgICAgICBAZW5kU2VsZWN0aW9uIG9wdFxuICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgXG4gICAgbW92ZUN1cnNvcnNVcDogKGUsIG49MSkgLT4gXG4gICAgICAgIFxuICAgICAgICBAbW92ZUFsbEN1cnNvcnMgKChuKS0+KGMpLT5bY1swXSxjWzFdLW5dKShuKSwgZXh0ZW5kOmUsIG1haW46ICd0b3AnXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBtb3ZlQ3Vyc29yc1JpZ2h0OiAoZSwgbj0xKSAtPlxuICAgICAgICBcbiAgICAgICAgbW92ZVJpZ2h0ID0gKG4pIC0+IChjKSAtPiBbY1swXStuLCBjWzFdXVxuICAgICAgICBAbW92ZUFsbEN1cnNvcnMgbW92ZVJpZ2h0KG4pLCBleHRlbmQ6ZSwga2VlcExpbmU6dHJ1ZSwgbWFpbjogJ3JpZ2h0J1xuICAgIFxuICAgIG1vdmVDdXJzb3JzTGVmdDogKGUsIG49MSkgLT5cbiAgICAgICAgXG4gICAgICAgIG1vdmVMZWZ0ID0gKG4pIC0+IChjKSAtPiBbTWF0aC5tYXgoMCxjWzBdLW4pLCBjWzFdXVxuICAgICAgICBAbW92ZUFsbEN1cnNvcnMgbW92ZUxlZnQobiksIGV4dGVuZDplLCBrZWVwTGluZTp0cnVlLCBtYWluOiAnbGVmdCdcbiAgICAgICAgXG4gICAgbW92ZUN1cnNvcnNEb3duOiAoZSwgbj0xKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgZSBhbmQgQG51bVNlbGVjdGlvbnMoKSA9PSAwICMgc2VsZWN0aW5nIGxpbmVzIGRvd25cbiAgICAgICAgICAgIGlmIDAgPT0gXy5tYXggKGNbMF0gZm9yIGMgaW4gQGN1cnNvcnMoKSkgIyBhbGwgY3Vyc29ycyBpbiBmaXJzdCBjb2x1bW5cbiAgICAgICAgICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICAgICAgICAgIEBkby5zZWxlY3QgQHJhbmdlc0ZvckN1cnNvckxpbmVzKCkgIyBzZWxlY3QgbGluZXMgd2l0aG91dCBtb3ZpbmcgY3Vyc29yc1xuICAgICAgICAgICAgICAgIEBkby5lbmQoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICBlbHNlIGlmIGUgYW5kIEBzdGlja3lTZWxlY3Rpb24gYW5kIEBudW1DdXJzb3JzKCkgPT0gMVxuICAgICAgICAgICAgaWYgQG1haW5DdXJzb3IoKVswXSA9PSAwIGFuZCBub3QgQGlzU2VsZWN0ZWRMaW5lQXRJbmRleCBAbWFpbkN1cnNvcigpWzFdXG4gICAgICAgICAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgICAgICAgICBuZXdTZWxlY3Rpb25zID0gQGRvLnNlbGVjdGlvbnMoKVxuICAgICAgICAgICAgICAgIG5ld1NlbGVjdGlvbnMucHVzaCBAcmFuZ2VGb3JMaW5lQXRJbmRleCBAbWFpbkN1cnNvcigpWzFdXG4gICAgICAgICAgICAgICAgQGRvLnNlbGVjdCBuZXdTZWxlY3Rpb25zXG4gICAgICAgICAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgQG1vdmVBbGxDdXJzb3JzICgobiktPihjKS0+W2NbMF0sY1sxXStuXSkobiksIGV4dGVuZDplLCBtYWluOiAnYm90J1xuICAgICAgICBcbiJdfQ==
//# sourceURL=../../../coffee/editor/actions/movecursors.coffee