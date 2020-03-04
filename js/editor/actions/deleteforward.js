// koffee 1.11.0
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVsZXRlZm9yd2FyZC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLi9jb2ZmZWUvZWRpdG9yL2FjdGlvbnMiLCJzb3VyY2VzIjpbImRlbGV0ZWZvcndhcmQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFPQSxJQUFBOztBQUFFLFdBQWEsT0FBQSxDQUFRLEtBQVI7O0FBRWYsTUFBTSxDQUFDLE9BQVAsR0FFSTtJQUFBLE9BQUEsRUFDSTtRQUFBLElBQUEsRUFBTSxRQUFOO1FBRUEsYUFBQSxFQUNJO1lBQUEsSUFBQSxFQUFRLGdCQUFSO1lBQ0EsS0FBQSxFQUFRLFFBRFI7WUFFQSxJQUFBLEVBQVEsK0JBRlI7U0FISjtRQU9BLGlCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQVEsdUJBQVI7WUFDQSxLQUFBLEVBQVEsY0FEUjtZQUVBLElBQUEsRUFBUSxzQ0FGUjtTQVJKO1FBWUEsNEJBQUEsRUFDSTtZQUFBLElBQUEsRUFBUSw0Q0FBUjtZQUNBLEtBQUEsRUFBUSxRQURSO1lBRUEsSUFBQSxFQUFRLHNHQUZSO1NBYko7S0FESjtJQW9CQSxpQkFBQSxFQUFtQixTQUFBO1FBRWYsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEtBQUosQ0FBQTtRQUNBLElBQUMsQ0FBQSx5QkFBRCxDQUEyQixPQUEzQixFQUFvQztZQUFBLE1BQUEsRUFBTyxJQUFQO1NBQXBDO1FBQ0EsSUFBQyxDQUFBLGVBQUQsQ0FBaUI7WUFBQSxXQUFBLEVBQVksS0FBWjtTQUFqQjtlQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7SUFMZSxDQXBCbkI7SUEyQkEsNEJBQUEsRUFBOEIsU0FBQTtBQUUxQixZQUFBO1FBQUEsT0FBQSxHQUFVLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxPQUFKLENBQUEsQ0FBQSxJQUFrQixJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsT0FBSixDQUFBLENBQWxCLElBQW1DLElBQUMsQ0FBQSxPQUFELENBQUE7QUFDN0MsYUFBQSx5Q0FBQTs7WUFDSSxJQUFHLENBQUUsQ0FBQSxDQUFBLENBQUYsS0FBUSxDQUFSLElBQWMsQ0FBSSxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsQ0FBckIsQ0FBckI7QUFDSSx1QkFBTyxJQUFDLENBQUEsaUJBQUQsQ0FBQSxFQURYOztBQURKO1FBSUEsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEtBQUosQ0FBQTtRQUNBLElBQUMsQ0FBQSxlQUFELENBQUE7UUFDQSxJQUFDLENBQUEsZUFBRCxDQUFpQjtZQUFBLFdBQUEsRUFBWSxJQUFaO1NBQWpCO2VBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEdBQUosQ0FBQTtJQVYwQixDQTNCOUI7SUF1Q0EsYUFBQSxFQUFlLFNBQUE7QUFFWCxZQUFBO1FBQUEsSUFBRyxJQUFDLENBQUEsYUFBRCxDQUFBLENBQUg7bUJBQ0ksSUFBQyxDQUFBLGVBQUQsQ0FBQSxFQURKO1NBQUEsTUFBQTtZQUdJLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxLQUFKLENBQUE7WUFDQSxVQUFBLEdBQWEsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE9BQUosQ0FBQTtBQUNiO0FBQUEsaUJBQUEscUNBQUE7O2dCQUVJLElBQUcsSUFBQyxDQUFBLG1CQUFELENBQXFCLENBQXJCLENBQUg7b0JBQ0ksSUFBRyxDQUFJLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixDQUFwQixDQUFQO3dCQUVJLEVBQUEsR0FBSyxJQUFDLENBQUEsSUFBRCxDQUFNLENBQUUsQ0FBQSxDQUFBLENBQVIsQ0FBVyxDQUFDO3dCQUVqQixJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsTUFBSixDQUFXLENBQUUsQ0FBQSxDQUFBLENBQWIsRUFBaUIsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLElBQUosQ0FBUyxDQUFFLENBQUEsQ0FBQSxDQUFYLENBQUEsR0FBaUIsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLElBQUosQ0FBUyxDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQUssQ0FBZCxDQUFsQzt3QkFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLEVBQUMsTUFBRCxFQUFILENBQVcsQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFLLENBQWhCO0FBR0E7QUFBQSw2QkFBQSx3Q0FBQTs7NEJBQ0ksV0FBQSxDQUFZLEVBQVosRUFBZ0IsRUFBaEIsRUFBb0IsQ0FBQyxDQUFyQjtBQURKO0FBR0E7QUFBQSw2QkFBQSx3Q0FBQTs7NEJBQ0ksV0FBQSxDQUFZLEVBQVosRUFBZ0IsQ0FBaEIsRUFBbUIsQ0FBQyxDQUFwQjtBQURKLHlCQVhKO3FCQURKO2lCQUFBLE1BQUE7b0JBZUksSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE1BQUosQ0FBVyxDQUFFLENBQUEsQ0FBQSxDQUFiLEVBQWlCLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsQ0FBRSxDQUFBLENBQUEsQ0FBWCxDQUFjLENBQUMsTUFBZixDQUFzQixDQUFFLENBQUEsQ0FBQSxDQUF4QixFQUE0QixDQUE1QixDQUFqQjtBQUNBO0FBQUEseUJBQUEsd0NBQUE7O3dCQUNJLElBQUcsRUFBRyxDQUFBLENBQUEsQ0FBSCxHQUFRLENBQUUsQ0FBQSxDQUFBLENBQWI7NEJBQ0ksV0FBQSxDQUFZLEVBQVosRUFBZ0IsQ0FBQyxDQUFqQixFQURKOztBQURKLHFCQWhCSjs7QUFGSjtZQXNCQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsVUFBSixDQUFlLFVBQWY7bUJBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEdBQUosQ0FBQSxFQTVCSjs7SUFGVyxDQXZDZiIsInNvdXJjZXNDb250ZW50IjpbIlxuIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgIFxuXG57IHJldmVyc2VkIH0gPSByZXF1aXJlICdreGsnXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgICBcbiAgICBhY3Rpb25zOlxuICAgICAgICBtZW51OiAnRGVsZXRlJ1xuICAgICAgICBcbiAgICAgICAgZGVsZXRlRm9yd2FyZDpcbiAgICAgICAgICAgIG5hbWU6ICAgJ0RlbGV0ZSBGb3J3YXJkJ1xuICAgICAgICAgICAgY29tYm86ICAnZGVsZXRlJ1xuICAgICAgICAgICAgdGV4dDogICAnZGVsZXRlIGNoYXJhY3RlciB0byB0aGUgcmlnaHQnXG5cbiAgICAgICAgZGVsZXRlVG9FbmRPZkxpbmU6XG4gICAgICAgICAgICBuYW1lOiAgICdEZWxldGUgdG8gRW5kIG9mIExpbmUnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK3NoaWZ0K2snXG4gICAgICAgICAgICB0ZXh0OiAgICdkZWxldGUgY2hhcmFjdGVycyB0byB0aGUgZW5kIG9mIGxpbmUnXG4gICAgICAgICAgICBcbiAgICAgICAgZGVsZXRlVG9FbmRPZkxpbmVPcldob2xlTGluZTpcbiAgICAgICAgICAgIG5hbWU6ICAgJ0RlbGV0ZSB0byBFbmQgb2YgTGluZSBvciBEZWxldGUgV2hvbGUgTGluZSdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwraydcbiAgICAgICAgICAgIHRleHQ6ICAgXCJcIlwiZGVsZXRlIGNoYXJhY3RlcnMgdG8gdGhlIGVuZCBvZiBsaW5lLCBpZiBjdXJzb3IgaXMgbm90IGF0IGVuZCBvZiBsaW5lLlxuICAgICAgICAgICAgICAgIGRlbGV0ZSB3aG9sZSBsaW5lIG90aGVyd2lzZS5cbiAgICAgICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgICAgICBcbiAgICBkZWxldGVUb0VuZE9mTGluZTogLT5cbiAgICAgICAgXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBtb3ZlQ3Vyc29yc1RvTGluZUJvdW5kYXJ5ICdyaWdodCcsIGV4dGVuZDp0cnVlXG4gICAgICAgIEBkZWxldGVTZWxlY3Rpb24gZGVsZXRlTGluZXM6ZmFsc2VcbiAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgIFxuICAgIGRlbGV0ZVRvRW5kT2ZMaW5lT3JXaG9sZUxpbmU6IC0+XG4gICAgICAgIFxuICAgICAgICBjdXJzb3JzID0gQGRvLmlzRG9pbmcoKSBhbmQgQGRvLmN1cnNvcnMoKSBvciBAY3Vyc29ycygpXG4gICAgICAgIGZvciBjIGluIGN1cnNvcnNcbiAgICAgICAgICAgIGlmIGNbMF0gIT0gMCBhbmQgbm90IEBpc0N1cnNvckF0RW5kT2ZMaW5lKGMpXG4gICAgICAgICAgICAgICAgcmV0dXJuIEBkZWxldGVUb0VuZE9mTGluZSgpXG4gICAgICAgIFxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBAc2VsZWN0TW9yZUxpbmVzKClcbiAgICAgICAgQGRlbGV0ZVNlbGVjdGlvbiBkZWxldGVMaW5lczp0cnVlICAgICAgXG4gICAgICAgIEBkby5lbmQoKVxuXG4gICAgZGVsZXRlRm9yd2FyZDogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBudW1TZWxlY3Rpb25zKClcbiAgICAgICAgICAgIEBkZWxldGVTZWxlY3Rpb24oKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICAgICAgbmV3Q3Vyc29ycyA9IEBkby5jdXJzb3JzKClcbiAgICAgICAgICAgIGZvciBjIGluIHJldmVyc2VkIG5ld0N1cnNvcnNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIEBpc0N1cnNvckF0RW5kT2ZMaW5lIGMgIyBjdXJzb3IgYXQgZW5kIG9mIGxpbmVcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IEBpc0N1cnNvckluTGFzdExpbmUgYyAjIGN1cnNvciBub3QgaW4gZmlyc3QgbGluZVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGxsID0gQGxpbmUoY1sxXSkubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgQGRvLmNoYW5nZSBjWzFdLCBAZG8ubGluZShjWzFdKSArIEBkby5saW5lKGNbMV0rMSlcbiAgICAgICAgICAgICAgICAgICAgICAgIEBkby5kZWxldGUgY1sxXSsxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICMgbW92ZSBjdXJzb3JzIGluIGpvaW5lZCBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgbmMgaW4gcG9zaXRpb25zQXRMaW5lSW5kZXhJblBvc2l0aW9ucyBjWzFdKzEsIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3JEZWx0YSBuYywgbGwsIC0xXG4gICAgICAgICAgICAgICAgICAgICAgICAjIG1vdmUgY3Vyc29ycyBiZWxvdyBkZWxldGVkIGxpbmUgdXBcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciBuYyBpbiBwb3NpdGlvbnNCZWxvd0xpbmVJbmRleEluUG9zaXRpb25zIGNbMV0rMSwgbmV3Q3Vyc29yc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvckRlbHRhIG5jLCAwLCAtMVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGRvLmNoYW5nZSBjWzFdLCBAZG8ubGluZShjWzFdKS5zcGxpY2UgY1swXSwgMVxuICAgICAgICAgICAgICAgICAgICBmb3IgbmMgaW4gcG9zaXRpb25zQXRMaW5lSW5kZXhJblBvc2l0aW9ucyBjWzFdLCBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBuY1swXSA+IGNbMF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3JEZWx0YSBuYywgLTFcblxuICAgICAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29yc1xuICAgICAgICAgICAgQGRvLmVuZCgpXG4iXX0=
//# sourceURL=../../../coffee/editor/actions/deleteforward.coffee