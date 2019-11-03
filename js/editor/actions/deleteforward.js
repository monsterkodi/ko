// koffee 1.4.0
var reversed;

reversed = require('kxk').reversed;

module.exports = {
    actions: {
        menu: 'Delete',
        deleteForward: {
            name: 'Delete Forward',
            combo: 'delete',
            text: 'delete character to the right'
        },
        deleteToEndOfLine: {
            name: 'Delete to End of Line',
            combo: 'ctrl+shift+k',
            text: 'delete characters to the end of line'
        },
        deleteToEndOfLineOrWholeLine: {
            name: 'Delete to End of Line or Delete Whole Line',
            combo: 'ctrl+k',
            text: "delete characters to the end of line, if cursor is not at end of line.\ndelete whole line otherwise."
        }
    },
    deleteToEndOfLine: function() {
        this["do"].start();
        this.moveCursorsToLineBoundary('right', {
            extend: true
        });
        this.deleteSelection({
            deleteLines: false
        });
        return this["do"].end();
    },
    deleteToEndOfLineOrWholeLine: function() {
        var c, cursors, i, len;
        cursors = this["do"].isDoing() && this["do"].cursors() || this.cursors();
        for (i = 0, len = cursors.length; i < len; i++) {
            c = cursors[i];
            if (c[0] !== 0 && !this.isCursorAtEndOfLine(c)) {
                return this.deleteToEndOfLine();
            }
        }
        this["do"].start();
        this.selectMoreLines();
        this.deleteSelection({
            deleteLines: true
        });
        return this["do"].end();
    },
    deleteForward: function() {
        var c, i, j, k, l, len, len1, len2, len3, ll, nc, newCursors, ref, ref1, ref2, ref3;
        if (this.numSelections()) {
            return this.deleteSelection();
        } else {
            this["do"].start();
            newCursors = this["do"].cursors();
            ref = reversed(newCursors);
            for (i = 0, len = ref.length; i < len; i++) {
                c = ref[i];
                if (this.isCursorAtEndOfLine(c)) {
                    if (!this.isCursorInLastLine(c)) {
                        ll = this.line(c[1]).length;
                        this["do"].change(c[1], this["do"].line(c[1]) + this["do"].line(c[1] + 1));
                        this["do"]["delete"](c[1] + 1);
                        ref1 = positionsAtLineIndexInPositions(c[1] + 1, newCursors);
                        for (j = 0, len1 = ref1.length; j < len1; j++) {
                            nc = ref1[j];
                            cursorDelta(nc, ll, -1);
                        }
                        ref2 = positionsBelowLineIndexInPositions(c[1] + 1, newCursors);
                        for (k = 0, len2 = ref2.length; k < len2; k++) {
                            nc = ref2[k];
                            cursorDelta(nc, 0, -1);
                        }
                    }
                } else {
                    this["do"].change(c[1], this["do"].line(c[1]).splice(c[0], 1));
                    ref3 = positionsAtLineIndexInPositions(c[1], newCursors);
                    for (l = 0, len3 = ref3.length; l < len3; l++) {
                        nc = ref3[l];
                        if (nc[0] > c[0]) {
                            cursorDelta(nc, -1);
                        }
                    }
                }
            }
            this["do"].setCursors(newCursors);
            return this["do"].end();
        }
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVsZXRlZm9yd2FyZC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQU9BLElBQUE7O0FBQUUsV0FBYSxPQUFBLENBQVEsS0FBUjs7QUFFZixNQUFNLENBQUMsT0FBUCxHQUVJO0lBQUEsT0FBQSxFQUNJO1FBQUEsSUFBQSxFQUFNLFFBQU47UUFFQSxhQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQVEsZ0JBQVI7WUFDQSxLQUFBLEVBQVEsUUFEUjtZQUVBLElBQUEsRUFBUSwrQkFGUjtTQUhKO1FBT0EsaUJBQUEsRUFDSTtZQUFBLElBQUEsRUFBUSx1QkFBUjtZQUNBLEtBQUEsRUFBUSxjQURSO1lBRUEsSUFBQSxFQUFRLHNDQUZSO1NBUko7UUFZQSw0QkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFRLDRDQUFSO1lBQ0EsS0FBQSxFQUFRLFFBRFI7WUFFQSxJQUFBLEVBQVEsc0dBRlI7U0FiSjtLQURKO0lBb0JBLGlCQUFBLEVBQW1CLFNBQUE7UUFFZixJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsS0FBSixDQUFBO1FBQ0EsSUFBQyxDQUFBLHlCQUFELENBQTJCLE9BQTNCLEVBQW9DO1lBQUEsTUFBQSxFQUFPLElBQVA7U0FBcEM7UUFDQSxJQUFDLENBQUEsZUFBRCxDQUFpQjtZQUFBLFdBQUEsRUFBWSxLQUFaO1NBQWpCO2VBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEdBQUosQ0FBQTtJQUxlLENBcEJuQjtJQTJCQSw0QkFBQSxFQUE4QixTQUFBO0FBRTFCLFlBQUE7UUFBQSxPQUFBLEdBQVUsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE9BQUosQ0FBQSxDQUFBLElBQWtCLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxPQUFKLENBQUEsQ0FBbEIsSUFBbUMsSUFBQyxDQUFBLE9BQUQsQ0FBQTtBQUM3QyxhQUFBLHlDQUFBOztZQUNJLElBQUcsQ0FBRSxDQUFBLENBQUEsQ0FBRixLQUFRLENBQVIsSUFBYyxDQUFJLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixDQUFyQixDQUFyQjtBQUNJLHVCQUFPLElBQUMsQ0FBQSxpQkFBRCxDQUFBLEVBRFg7O0FBREo7UUFJQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsS0FBSixDQUFBO1FBQ0EsSUFBQyxDQUFBLGVBQUQsQ0FBQTtRQUNBLElBQUMsQ0FBQSxlQUFELENBQWlCO1lBQUEsV0FBQSxFQUFZLElBQVo7U0FBakI7ZUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsR0FBSixDQUFBO0lBVjBCLENBM0I5QjtJQXVDQSxhQUFBLEVBQWUsU0FBQTtBQUVYLFlBQUE7UUFBQSxJQUFHLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBSDttQkFDSSxJQUFDLENBQUEsZUFBRCxDQUFBLEVBREo7U0FBQSxNQUFBO1lBR0ksSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEtBQUosQ0FBQTtZQUNBLFVBQUEsR0FBYSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsT0FBSixDQUFBO0FBQ2I7QUFBQSxpQkFBQSxxQ0FBQTs7Z0JBRUksSUFBRyxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsQ0FBckIsQ0FBSDtvQkFDSSxJQUFHLENBQUksSUFBQyxDQUFBLGtCQUFELENBQW9CLENBQXBCLENBQVA7d0JBRUksRUFBQSxHQUFLLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBRSxDQUFBLENBQUEsQ0FBUixDQUFXLENBQUM7d0JBRWpCLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxNQUFKLENBQVcsQ0FBRSxDQUFBLENBQUEsQ0FBYixFQUFpQixJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsSUFBSixDQUFTLENBQUUsQ0FBQSxDQUFBLENBQVgsQ0FBQSxHQUFpQixJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsSUFBSixDQUFTLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBSyxDQUFkLENBQWxDO3dCQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsRUFBQyxNQUFELEVBQUgsQ0FBVyxDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQUssQ0FBaEI7QUFHQTtBQUFBLDZCQUFBLHdDQUFBOzs0QkFDSSxXQUFBLENBQVksRUFBWixFQUFnQixFQUFoQixFQUFvQixDQUFDLENBQXJCO0FBREo7QUFHQTtBQUFBLDZCQUFBLHdDQUFBOzs0QkFDSSxXQUFBLENBQVksRUFBWixFQUFnQixDQUFoQixFQUFtQixDQUFDLENBQXBCO0FBREoseUJBWEo7cUJBREo7aUJBQUEsTUFBQTtvQkFlSSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsTUFBSixDQUFXLENBQUUsQ0FBQSxDQUFBLENBQWIsRUFBaUIsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLElBQUosQ0FBUyxDQUFFLENBQUEsQ0FBQSxDQUFYLENBQWMsQ0FBQyxNQUFmLENBQXNCLENBQUUsQ0FBQSxDQUFBLENBQXhCLEVBQTRCLENBQTVCLENBQWpCO0FBQ0E7QUFBQSx5QkFBQSx3Q0FBQTs7d0JBQ0ksSUFBRyxFQUFHLENBQUEsQ0FBQSxDQUFILEdBQVEsQ0FBRSxDQUFBLENBQUEsQ0FBYjs0QkFDSSxXQUFBLENBQVksRUFBWixFQUFnQixDQUFDLENBQWpCLEVBREo7O0FBREoscUJBaEJKOztBQUZKO1lBc0JBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxVQUFKLENBQWUsVUFBZjttQkFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsR0FBSixDQUFBLEVBNUJKOztJQUZXLENBdkNmIiwic291cmNlc0NvbnRlbnQiOlsiXG4jIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgXG5cbnsgcmV2ZXJzZWQgfSA9IHJlcXVpcmUgJ2t4aydcblxubW9kdWxlLmV4cG9ydHMgPVxuICAgIFxuICAgIGFjdGlvbnM6XG4gICAgICAgIG1lbnU6ICdEZWxldGUnXG4gICAgICAgIFxuICAgICAgICBkZWxldGVGb3J3YXJkOlxuICAgICAgICAgICAgbmFtZTogICAnRGVsZXRlIEZvcndhcmQnXG4gICAgICAgICAgICBjb21ibzogICdkZWxldGUnXG4gICAgICAgICAgICB0ZXh0OiAgICdkZWxldGUgY2hhcmFjdGVyIHRvIHRoZSByaWdodCdcblxuICAgICAgICBkZWxldGVUb0VuZE9mTGluZTpcbiAgICAgICAgICAgIG5hbWU6ICAgJ0RlbGV0ZSB0byBFbmQgb2YgTGluZSdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrc2hpZnQraydcbiAgICAgICAgICAgIHRleHQ6ICAgJ2RlbGV0ZSBjaGFyYWN0ZXJzIHRvIHRoZSBlbmQgb2YgbGluZSdcbiAgICAgICAgICAgIFxuICAgICAgICBkZWxldGVUb0VuZE9mTGluZU9yV2hvbGVMaW5lOlxuICAgICAgICAgICAgbmFtZTogICAnRGVsZXRlIHRvIEVuZCBvZiBMaW5lIG9yIERlbGV0ZSBXaG9sZSBMaW5lJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtrJ1xuICAgICAgICAgICAgdGV4dDogICBcIlwiXCJkZWxldGUgY2hhcmFjdGVycyB0byB0aGUgZW5kIG9mIGxpbmUsIGlmIGN1cnNvciBpcyBub3QgYXQgZW5kIG9mIGxpbmUuXG4gICAgICAgICAgICAgICAgZGVsZXRlIHdob2xlIGxpbmUgb3RoZXJ3aXNlLlxuICAgICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgICAgIFxuICAgIGRlbGV0ZVRvRW5kT2ZMaW5lOiAtPlxuICAgICAgICBcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgQG1vdmVDdXJzb3JzVG9MaW5lQm91bmRhcnkgJ3JpZ2h0JywgZXh0ZW5kOnRydWVcbiAgICAgICAgQGRlbGV0ZVNlbGVjdGlvbiBkZWxldGVMaW5lczpmYWxzZVxuICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgXG4gICAgZGVsZXRlVG9FbmRPZkxpbmVPcldob2xlTGluZTogLT5cbiAgICAgICAgXG4gICAgICAgIGN1cnNvcnMgPSBAZG8uaXNEb2luZygpIGFuZCBAZG8uY3Vyc29ycygpIG9yIEBjdXJzb3JzKClcbiAgICAgICAgZm9yIGMgaW4gY3Vyc29yc1xuICAgICAgICAgICAgaWYgY1swXSAhPSAwIGFuZCBub3QgQGlzQ3Vyc29yQXRFbmRPZkxpbmUoYylcbiAgICAgICAgICAgICAgICByZXR1cm4gQGRlbGV0ZVRvRW5kT2ZMaW5lKClcbiAgICAgICAgXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBzZWxlY3RNb3JlTGluZXMoKVxuICAgICAgICBAZGVsZXRlU2VsZWN0aW9uIGRlbGV0ZUxpbmVzOnRydWUgICAgICBcbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICBkZWxldGVGb3J3YXJkOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQG51bVNlbGVjdGlvbnMoKVxuICAgICAgICAgICAgQGRlbGV0ZVNlbGVjdGlvbigpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgICAgICBuZXdDdXJzb3JzID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICAgICAgZm9yIGMgaW4gcmV2ZXJzZWQgbmV3Q3Vyc29yc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgQGlzQ3Vyc29yQXRFbmRPZkxpbmUgYyAjIGN1cnNvciBhdCBlbmQgb2YgbGluZVxuICAgICAgICAgICAgICAgICAgICBpZiBub3QgQGlzQ3Vyc29ySW5MYXN0TGluZSBjICMgY3Vyc29yIG5vdCBpbiBmaXJzdCBsaW5lXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgbGwgPSBAbGluZShjWzFdKS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBAZG8uY2hhbmdlIGNbMV0sIEBkby5saW5lKGNbMV0pICsgQGRvLmxpbmUoY1sxXSsxKVxuICAgICAgICAgICAgICAgICAgICAgICAgQGRvLmRlbGV0ZSBjWzFdKzFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgIyBtb3ZlIGN1cnNvcnMgaW4gam9pbmVkIGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciBuYyBpbiBwb3NpdGlvbnNBdExpbmVJbmRleEluUG9zaXRpb25zIGNbMV0rMSwgbmV3Q3Vyc29yc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvckRlbHRhIG5jLCBsbCwgLTFcbiAgICAgICAgICAgICAgICAgICAgICAgICMgbW92ZSBjdXJzb3JzIGJlbG93IGRlbGV0ZWQgbGluZSB1cFxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIG5jIGluIHBvc2l0aW9uc0JlbG93TGluZUluZGV4SW5Qb3NpdGlvbnMgY1sxXSsxLCBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yRGVsdGEgbmMsIDAsIC0xXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAZG8uY2hhbmdlIGNbMV0sIEBkby5saW5lKGNbMV0pLnNwbGljZSBjWzBdLCAxXG4gICAgICAgICAgICAgICAgICAgIGZvciBuYyBpbiBwb3NpdGlvbnNBdExpbmVJbmRleEluUG9zaXRpb25zIGNbMV0sIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG5jWzBdID4gY1swXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvckRlbHRhIG5jLCAtMVxuXG4gICAgICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzXG4gICAgICAgICAgICBAZG8uZW5kKClcbiJdfQ==
//# sourceURL=../../../coffee/editor/actions/deleteforward.coffee