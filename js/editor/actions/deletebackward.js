// koffee 1.19.0
var _, ref, reversed;

ref = require('kxk'), reversed = ref.reversed, _ = ref._;

module.exports = {
    actions: {
        menu: 'Delete',
        deleteBackward: {
            name: 'Delete Backward',
            text: 'delete character to the left',
            combo: 'backspace'
        },
        deleteBackwardIgnoreLineBoundary: {
            name: 'Delete Backward Over Line Boundaries',
            combo: 'command+backspace',
            accel: 'ctrl+backspace'
        },
        deleteBackwardSwallowWhitespace: {
            name: 'Delete Backward Over Whitespace',
            combo: 'alt+backspace'
        }
    },
    deleteBackwardIgnoreLineBoundary: function() {
        return this.deleteBackward({
            ignoreLineBoundary: true
        });
    },
    deleteBackwardSwallowWhitespace: function() {
        return this.deleteBackward({
            ignoreTabBoundary: true
        });
    },
    deleteBackward: function(opt) {
        this["do"].start();
        if (this["do"].numSelections()) {
            this.deleteSelection();
        } else if (this.salterMode) {
            this.deleteSalterCharacter();
        } else if (!this.deleteEmptySurrounds()) {
            this.deleteCharacterBackward(opt);
        }
        return this["do"].end();
    },
    deleteCharacterBackward: function(opt) {
        var c, i, j, k, l, len, len1, len2, len3, ll, n, nc, newCursors, ref1, ref2, ref3, ref4, removeNum, t;
        newCursors = this["do"].cursors();
        removeNum = (function() {
            switch (false) {
                case !(opt != null ? opt.singleCharacter : void 0):
                    return 1;
                case !(opt != null ? opt.ignoreLineBoundary : void 0):
                    return -1;
                case !(opt != null ? opt.ignoreTabBoundary : void 0):
                    return Math.max(1, _.min(newCursors.map((function(_this) {
                        return function(c) {
                            var n, t;
                            t = _this["do"].textInRange([c[1], [0, c[0]]]);
                            n = t.length - t.trimRight().length;
                            if (_this.isCursorVirtual(c)) {
                                n += c[0] - _this["do"].line(c[1]).length;
                            }
                            return Math.max(1, n);
                        };
                    })(this))));
                default:
                    return Math.max(1, _.min(newCursors.map((function(_this) {
                        return function(c) {
                            var n, t;
                            n = (c[0] % _this.indentString.length) || _this.indentString.length;
                            t = _this["do"].textInRange([c[1], [Math.max(0, c[0] - n), c[0]]]);
                            n -= t.trimRight().length;
                            return Math.max(1, n);
                        };
                    })(this))));
            }
        }).call(this);
        ref1 = reversed(newCursors);
        for (i = 0, len = ref1.length; i < len; i++) {
            c = ref1[i];
            if (c[0] === 0) {
                if ((opt != null ? opt.ignoreLineBoundary : void 0) || this["do"].numCursors() === 1) {
                    if (c[1] > 0) {
                        ll = this["do"].line(c[1] - 1).length;
                        this["do"].change(c[1] - 1, this["do"].line(c[1] - 1) + this["do"].line(c[1]));
                        this["do"]["delete"](c[1]);
                        ref2 = positionsAtLineIndexInPositions(c[1], newCursors);
                        for (j = 0, len1 = ref2.length; j < len1; j++) {
                            nc = ref2[j];
                            cursorDelta(nc, ll, -1);
                        }
                        ref3 = positionsBelowLineIndexInPositions(c[1], newCursors);
                        for (k = 0, len2 = ref3.length; k < len2; k++) {
                            nc = ref3[k];
                            cursorDelta(nc, 0, -1);
                        }
                    }
                }
            } else {
                if (removeNum < 1) {
                    t = this["do"].textInRange([c[1], [0, c[0]]]);
                    n = t.length - t.trimRight().length;
                    if (this.isCursorVirtual(c)) {
                        n += c[0] - this["do"].line(c[1]).length;
                    }
                    n = Math.max(1, n);
                } else {
                    n = removeNum;
                }
                this["do"].change(c[1], this["do"].line(c[1]).splice(c[0] - n, n));
                ref4 = positionsAtLineIndexInPositions(c[1], newCursors);
                for (l = 0, len3 = ref4.length; l < len3; l++) {
                    nc = ref4[l];
                    if (nc[0] >= c[0]) {
                        cursorDelta(nc, -n);
                    }
                }
            }
        }
        return this["do"].setCursors(newCursors);
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVsZXRlYmFja3dhcmQuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4vY29mZmVlL2VkaXRvci9hY3Rpb25zIiwic291cmNlcyI6WyJkZWxldGViYWNrd2FyZC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQU9BLElBQUE7O0FBQUEsTUFBa0IsT0FBQSxDQUFRLEtBQVIsQ0FBbEIsRUFBRSx1QkFBRixFQUFZOztBQUVaLE1BQU0sQ0FBQyxPQUFQLEdBRUk7SUFBQSxPQUFBLEVBQ0k7UUFBQSxJQUFBLEVBQU0sUUFBTjtRQUVBLGNBQUEsRUFDSTtZQUFBLElBQUEsRUFBTyxpQkFBUDtZQUNBLElBQUEsRUFBTyw4QkFEUDtZQUVBLEtBQUEsRUFBTyxXQUZQO1NBSEo7UUFPQSxnQ0FBQSxFQUNJO1lBQUEsSUFBQSxFQUFRLHNDQUFSO1lBQ0EsS0FBQSxFQUFRLG1CQURSO1lBRUEsS0FBQSxFQUFRLGdCQUZSO1NBUko7UUFZQSwrQkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFRLGlDQUFSO1lBQ0EsS0FBQSxFQUFRLGVBRFI7U0FiSjtLQURKO0lBaUJBLGdDQUFBLEVBQWtDLFNBQUE7ZUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQjtZQUFBLGtCQUFBLEVBQW1CLElBQW5CO1NBQWhCO0lBQUgsQ0FqQmxDO0lBa0JBLCtCQUFBLEVBQWtDLFNBQUE7ZUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQjtZQUFBLGlCQUFBLEVBQWtCLElBQWxCO1NBQWhCO0lBQUgsQ0FsQmxDO0lBb0JBLGNBQUEsRUFBZ0IsU0FBQyxHQUFEO1FBRVosSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEtBQUosQ0FBQTtRQUNBLElBQUcsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLGFBQUosQ0FBQSxDQUFIO1lBQ0ksSUFBQyxDQUFBLGVBQUQsQ0FBQSxFQURKO1NBQUEsTUFFSyxJQUFHLElBQUMsQ0FBQSxVQUFKO1lBQ0QsSUFBQyxDQUFBLHFCQUFELENBQUEsRUFEQztTQUFBLE1BRUEsSUFB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RUFBRSxDQUFDLE1BQUosQ0FBVyxDQUFFLENBQUEsQ0FBQSxDQUFiLEVBQWlCLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsQ0FBRSxDQUFBLENBQUEsQ0FBWCxDQUFjLENBQUMsTUFBZixDQUFzQixDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQUssQ0FBM0IsRUFBOEIsQ0FBOUIsQ0FBakI7QUFDQTtBQUFBLHFCQUFBLHdDQUFBOztvQkFDSSxJQUFHLEVBQUcsQ0FBQSxDQUFBLENBQUgsSUFBUyxDQUFFLENBQUEsQ0FBQSxDQUFkO3dCQUNJLFdBQUEsQ0FBWSxFQUFaLEVBQWdCLENBQUMsQ0FBakIsRUFESjs7QUFESixpQkFyQko7O0FBREo7ZUEwQkEsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFVBQUosQ0FBZSxVQUFmO0lBOUNxQixDQS9CekIiLCJzb3VyY2VzQ29udGVudCI6WyJcbiMgMDAwMDAwMCAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwMDAwMCAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxueyByZXZlcnNlZCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5cbiAgICBhY3Rpb25zOlxuICAgICAgICBtZW51OiAnRGVsZXRlJ1xuXG4gICAgICAgIGRlbGV0ZUJhY2t3YXJkOlxuICAgICAgICAgICAgbmFtZTogICdEZWxldGUgQmFja3dhcmQnXG4gICAgICAgICAgICB0ZXh0OiAgJ2RlbGV0ZSBjaGFyYWN0ZXIgdG8gdGhlIGxlZnQnXG4gICAgICAgICAgICBjb21ibzogJ2JhY2tzcGFjZSdcblxuICAgICAgICBkZWxldGVCYWNrd2FyZElnbm9yZUxpbmVCb3VuZGFyeTpcbiAgICAgICAgICAgIG5hbWU6ICAgJ0RlbGV0ZSBCYWNrd2FyZCBPdmVyIExpbmUgQm91bmRhcmllcydcbiAgICAgICAgICAgIGNvbWJvOiAgJ2NvbW1hbmQrYmFja3NwYWNlJ1xuICAgICAgICAgICAgYWNjZWw6ICAnY3RybCtiYWNrc3BhY2UnXG5cbiAgICAgICAgZGVsZXRlQmFja3dhcmRTd2FsbG93V2hpdGVzcGFjZTpcbiAgICAgICAgICAgIG5hbWU6ICAgJ0RlbGV0ZSBCYWNrd2FyZCBPdmVyIFdoaXRlc3BhY2UnXG4gICAgICAgICAgICBjb21ibzogICdhbHQrYmFja3NwYWNlJ1xuXG4gICAgZGVsZXRlQmFja3dhcmRJZ25vcmVMaW5lQm91bmRhcnk6IC0+IEBkZWxldGVCYWNrd2FyZCBpZ25vcmVMaW5lQm91bmRhcnk6dHJ1ZSBcbiAgICBkZWxldGVCYWNrd2FyZFN3YWxsb3dXaGl0ZXNwYWNlOiAgLT4gQGRlbGV0ZUJhY2t3YXJkIGlnbm9yZVRhYkJvdW5kYXJ5OnRydWUgXG4gICAgICAgICAgICBcbiAgICBkZWxldGVCYWNrd2FyZDogKG9wdCkgLT5cblxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBpZiBAZG8ubnVtU2VsZWN0aW9ucygpXG4gICAgICAgICAgICBAZGVsZXRlU2VsZWN0aW9uKClcbiAgICAgICAgZWxzZSBpZiBAc2FsdGVyTW9kZVxuICAgICAgICAgICAgQGRlbGV0ZVNhbHRlckNoYXJhY3RlcigpXG4gICAgICAgIGVsc2UgaWYgbm90IEBkZWxldGVFbXB0eVN1cnJvdW5kcygpXG4gICAgICAgICAgICBAZGVsZXRlQ2hhcmFjdGVyQmFja3dhcmQgb3B0XG4gICAgICAgIEBkby5lbmQoKVxuXG4gICAgZGVsZXRlQ2hhcmFjdGVyQmFja3dhcmQ6IChvcHQpIC0+XG5cbiAgICAgICAgbmV3Q3Vyc29ycyA9IEBkby5jdXJzb3JzKClcblxuICAgICAgICByZW1vdmVOdW0gPSBzd2l0Y2hcbiAgICAgICAgICAgIHdoZW4gb3B0Py5zaW5nbGVDaGFyYWN0ZXIgICAgdGhlbiAxXG4gICAgICAgICAgICB3aGVuIG9wdD8uaWdub3JlTGluZUJvdW5kYXJ5IHRoZW4gLTEgIyBkZWxldGUgc3BhY2VzIHRvIGxpbmUgc3RhcnQgb3IgbGluZSBlbmRcbiAgICAgICAgICAgIHdoZW4gb3B0Py5pZ25vcmVUYWJCb3VuZGFyeSAjIGRlbGV0ZSBzcGFjZSBjb2x1bW5zXG4gICAgICAgICAgICAgICAgTWF0aC5tYXggMSwgXy5taW4gbmV3Q3Vyc29ycy5tYXAgKGMpID0+XG4gICAgICAgICAgICAgICAgICAgIHQgPSBAZG8udGV4dEluUmFuZ2UgW2NbMV0sIFswLCBjWzBdXV1cbiAgICAgICAgICAgICAgICAgICAgbiA9IHQubGVuZ3RoIC0gdC50cmltUmlnaHQoKS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgbiArPSBjWzBdIC0gQGRvLmxpbmUoY1sxXSkubGVuZ3RoIGlmIEBpc0N1cnNvclZpcnR1YWwgY1xuICAgICAgICAgICAgICAgICAgICBNYXRoLm1heCAxLCBuXG4gICAgICAgICAgICBlbHNlICMgZGVsZXRlIHNwYWNlcyB0byBwcmV2aW91cyB0YWIgY29sdW1uXG4gICAgICAgICAgICAgICAgTWF0aC5tYXggMSwgXy5taW4gbmV3Q3Vyc29ycy5tYXAgKGMpID0+XG4gICAgICAgICAgICAgICAgICAgIG4gPSAoY1swXSAlIEBpbmRlbnRTdHJpbmcubGVuZ3RoKSBvciBAaW5kZW50U3RyaW5nLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICB0ID0gQGRvLnRleHRJblJhbmdlIFtjWzFdLCBbTWF0aC5tYXgoMCwgY1swXS1uKSwgY1swXV1dXG4gICAgICAgICAgICAgICAgICAgIG4gLT0gdC50cmltUmlnaHQoKS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5tYXggMSwgblxuXG4gICAgICAgIGZvciBjIGluIHJldmVyc2VkIG5ld0N1cnNvcnNcbiAgICAgICAgICAgIGlmIGNbMF0gPT0gMCAjIGN1cnNvciBhdCBzdGFydCBvZiBsaW5lXG4gICAgICAgICAgICAgICAgaWYgb3B0Py5pZ25vcmVMaW5lQm91bmRhcnkgb3IgQGRvLm51bUN1cnNvcnMoKSA9PSAxXG4gICAgICAgICAgICAgICAgICAgIGlmIGNbMV0gPiAwICMgY3Vyc29yIG5vdCBpbiBmaXJzdCBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICBsbCA9IEBkby5saW5lKGNbMV0tMSkubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICBAZG8uY2hhbmdlIGNbMV0tMSwgQGRvLmxpbmUoY1sxXS0xKSArIEBkby5saW5lKGNbMV0pXG4gICAgICAgICAgICAgICAgICAgICAgICBAZG8uZGVsZXRlIGNbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICMgbW92ZSBjdXJzb3JzIGluIGpvaW5lZCBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgbmMgaW4gcG9zaXRpb25zQXRMaW5lSW5kZXhJblBvc2l0aW9ucyBjWzFdLCBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yRGVsdGEgbmMsIGxsLCAtMVxuICAgICAgICAgICAgICAgICAgICAgICAgIyBtb3ZlIGN1cnNvcnMgYmVsb3cgZGVsZXRlZCBsaW5lIHVwXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgbmMgaW4gcG9zaXRpb25zQmVsb3dMaW5lSW5kZXhJblBvc2l0aW9ucyBjWzFdLCBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yRGVsdGEgbmMsIDAsIC0xXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgcmVtb3ZlTnVtIDwgMSAjIGRlbGV0ZSBzcGFjZXMgdG8gbGluZSBzdGFydCBvciBsaW5lIGVuZFxuICAgICAgICAgICAgICAgICAgICB0ID0gQGRvLnRleHRJblJhbmdlIFtjWzFdLCBbMCwgY1swXV1dXG4gICAgICAgICAgICAgICAgICAgIG4gPSB0Lmxlbmd0aCAtIHQudHJpbVJpZ2h0KCkubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIG4gKz0gY1swXSAtIEBkby5saW5lKGNbMV0pLmxlbmd0aCBpZiBAaXNDdXJzb3JWaXJ0dWFsIGNcbiAgICAgICAgICAgICAgICAgICAgbiA9IE1hdGgubWF4IDEsIG5cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIG4gPSByZW1vdmVOdW1cbiAgICAgICAgICAgICAgICBAZG8uY2hhbmdlIGNbMV0sIEBkby5saW5lKGNbMV0pLnNwbGljZSBjWzBdLW4sIG5cbiAgICAgICAgICAgICAgICBmb3IgbmMgaW4gcG9zaXRpb25zQXRMaW5lSW5kZXhJblBvc2l0aW9ucyBjWzFdLCBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgICAgIGlmIG5jWzBdID49IGNbMF1cbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvckRlbHRhIG5jLCAtblxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnNcbiJdfQ==
//# sourceURL=../../../coffee/editor/actions/deletebackward.coffee