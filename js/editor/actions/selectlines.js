// koffee 1.14.0
var _, ref, reversed;

ref = require('kxk'), reversed = ref.reversed, _ = ref._;

module.exports = {
    actions: {
        menu: 'Select',
        selectMoreLines: {
            name: 'Select More Lines',
            text: 'selects line at cursor or next line if cursor line is selected already',
            combo: 'command+l',
            accel: 'ctrl+l'
        },
        selectLessLines: {
            name: 'Select Less Lines',
            text: 'removes a line from each block of selected lines',
            combo: 'command+shift+l',
            accel: 'ctrl+shift+l'
        }
    },
    selectMoreLines: function() {
        var c, j, k, len, len1, newCursors, newSelections, selectCursorLineAtIndex, start;
        this["do"].start();
        newCursors = this["do"].cursors();
        newSelections = this["do"].selections();
        selectCursorLineAtIndex = (function(_this) {
            return function(c, i) {
                var range;
                range = [i, [0, _this["do"].line(i).length]];
                newSelections.push(range);
                return cursorSet(c, rangeEndPos(range));
            };
        })(this);
        start = false;
        for (j = 0, len = newCursors.length; j < len; j++) {
            c = newCursors[j];
            if (!this.isSelectedLineAtIndex(c[1])) {
                selectCursorLineAtIndex(c, c[1]);
                start = true;
            }
        }
        if (!start) {
            for (k = 0, len1 = newCursors.length; k < len1; k++) {
                c = newCursors[k];
                if (c[1] < this.numLines() - 1) {
                    selectCursorLineAtIndex(c, c[1] + 1);
                }
            }
        }
        this["do"].select(newSelections);
        this["do"].setCursors(newCursors);
        return this["do"].end();
    },
    selectLessLines: function() {
        var c, j, len, newCursors, newSelections, ref1, s, thisSel;
        this["do"].start();
        newCursors = this["do"].cursors();
        newSelections = this["do"].selections();
        ref1 = reversed(newCursors);
        for (j = 0, len = ref1.length; j < len; j++) {
            c = ref1[j];
            thisSel = rangesAtLineIndexInRanges(c[1], newSelections);
            if (thisSel.length) {
                if (this.isSelectedLineAtIndex(c[1] - 1)) {
                    s = _.first(rangesAtLineIndexInRanges(c[1] - 1, newSelections));
                    cursorSet(c, s[1][1], s[0]);
                }
                newSelections.splice(newSelections.indexOf(thisSel[0]), 1);
            }
        }
        this["do"].select(newSelections);
        this["do"].setCursors(newCursors);
        return this["do"].end();
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0bGluZXMuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4vY29mZmVlL2VkaXRvci9hY3Rpb25zIiwic291cmNlcyI6WyJzZWxlY3RsaW5lcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQU9BLElBQUE7O0FBQUEsTUFBa0IsT0FBQSxDQUFRLEtBQVIsQ0FBbEIsRUFBRSx1QkFBRixFQUFZOztBQUVaLE1BQU0sQ0FBQyxPQUFQLEdBRUk7SUFBQSxPQUFBLEVBQ0k7UUFBQSxJQUFBLEVBQU0sUUFBTjtRQUVBLGVBQUEsRUFDSTtZQUFBLElBQUEsRUFBTyxtQkFBUDtZQUNBLElBQUEsRUFBTyx3RUFEUDtZQUVBLEtBQUEsRUFBTyxXQUZQO1lBR0EsS0FBQSxFQUFPLFFBSFA7U0FISjtRQVFBLGVBQUEsRUFDSTtZQUFBLElBQUEsRUFBTSxtQkFBTjtZQUNBLElBQUEsRUFBTyxrREFEUDtZQUVBLEtBQUEsRUFBTyxpQkFGUDtZQUdBLEtBQUEsRUFBTyxjQUhQO1NBVEo7S0FESjtJQWVBLGVBQUEsRUFBaUIsU0FBQTtBQUViLFlBQUE7UUFBQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsS0FBSixDQUFBO1FBQ0EsVUFBQSxHQUFnQixJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsT0FBSixDQUFBO1FBQ2hCLGFBQUEsR0FBZ0IsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFVBQUosQ0FBQTtRQUVoQix1QkFBQSxHQUEwQixDQUFBLFNBQUEsS0FBQTttQkFBQSxTQUFDLENBQUQsRUFBRyxDQUFIO0FBQ3RCLG9CQUFBO2dCQUFBLEtBQUEsR0FBUSxDQUFDLENBQUQsRUFBSSxDQUFDLENBQUQsRUFBSSxLQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsSUFBSixDQUFTLENBQVQsQ0FBVyxDQUFDLE1BQWhCLENBQUo7Z0JBQ1IsYUFBYSxDQUFDLElBQWQsQ0FBbUIsS0FBbkI7dUJBQ0EsU0FBQSxDQUFVLENBQVYsRUFBYSxXQUFBLENBQVksS0FBWixDQUFiO1lBSHNCO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtRQUsxQixLQUFBLEdBQVE7QUFDUixhQUFBLDRDQUFBOztZQUNJLElBQUcsQ0FBSSxJQUFDLENBQUEscUJBQUQsQ0FBdUIsQ0FBRSxDQUFBLENBQUEsQ0FBekIsQ0FBUDtnQkFDSSx1QkFBQSxDQUF3QixDQUF4QixFQUEyQixDQUFFLENBQUEsQ0FBQSxDQUE3QjtnQkFDQSxLQUFBLEdBQVEsS0FGWjs7QUFESjtRQUtBLElBQUcsQ0FBSSxLQUFQO0FBQ0ksaUJBQUEsOENBQUE7O2dCQUNJLElBQXFDLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBTyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQUEsR0FBWSxDQUF4RDtvQkFBQSx1QkFBQSxDQUF3QixDQUF4QixFQUEyQixDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQUssQ0FBaEMsRUFBQTs7QUFESixhQURKOztRQUlBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxNQUFKLENBQVcsYUFBWDtRQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxVQUFKLENBQWUsVUFBZjtlQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7SUF2QmEsQ0FmakI7SUF3Q0EsZUFBQSxFQUFpQixTQUFBO0FBRWIsWUFBQTtRQUFBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxLQUFKLENBQUE7UUFDQSxVQUFBLEdBQWdCLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxPQUFKLENBQUE7UUFDaEIsYUFBQSxHQUFnQixJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsVUFBSixDQUFBO0FBRWhCO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxPQUFBLEdBQVUseUJBQUEsQ0FBMEIsQ0FBRSxDQUFBLENBQUEsQ0FBNUIsRUFBZ0MsYUFBaEM7WUFDVixJQUFHLE9BQU8sQ0FBQyxNQUFYO2dCQUNJLElBQUcsSUFBQyxDQUFBLHFCQUFELENBQXVCLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBSyxDQUE1QixDQUFIO29CQUNJLENBQUEsR0FBSSxDQUFDLENBQUMsS0FBRixDQUFRLHlCQUFBLENBQTBCLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBSyxDQUEvQixFQUFrQyxhQUFsQyxDQUFSO29CQUNKLFNBQUEsQ0FBVSxDQUFWLEVBQWEsQ0FBRSxDQUFBLENBQUEsQ0FBRyxDQUFBLENBQUEsQ0FBbEIsRUFBc0IsQ0FBRSxDQUFBLENBQUEsQ0FBeEIsRUFGSjs7Z0JBR0EsYUFBYSxDQUFDLE1BQWQsQ0FBcUIsYUFBYSxDQUFDLE9BQWQsQ0FBc0IsT0FBUSxDQUFBLENBQUEsQ0FBOUIsQ0FBckIsRUFBd0QsQ0FBeEQsRUFKSjs7QUFGSjtRQVFBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxNQUFKLENBQVcsYUFBWDtRQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxVQUFKLENBQWUsVUFBZjtlQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7SUFoQmEsQ0F4Q2pCIiwic291cmNlc0NvbnRlbnQiOlsiXG4jICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAgICAgICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgICAgICAgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4jICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDAgIFxuIyAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAgICAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICBcblxueyByZXZlcnNlZCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5cbiAgICBhY3Rpb25zOlxuICAgICAgICBtZW51OiAnU2VsZWN0J1xuICAgICAgICBcbiAgICAgICAgc2VsZWN0TW9yZUxpbmVzOlxuICAgICAgICAgICAgbmFtZTogICdTZWxlY3QgTW9yZSBMaW5lcydcbiAgICAgICAgICAgIHRleHQ6ICAnc2VsZWN0cyBsaW5lIGF0IGN1cnNvciBvciBuZXh0IGxpbmUgaWYgY3Vyc29yIGxpbmUgaXMgc2VsZWN0ZWQgYWxyZWFkeSdcbiAgICAgICAgICAgIGNvbWJvOiAnY29tbWFuZCtsJ1xuICAgICAgICAgICAgYWNjZWw6ICdjdHJsK2wnXG4gICAgICAgICAgICBcbiAgICAgICAgc2VsZWN0TGVzc0xpbmVzOlxuICAgICAgICAgICAgbmFtZTogJ1NlbGVjdCBMZXNzIExpbmVzJ1xuICAgICAgICAgICAgdGV4dDogICdyZW1vdmVzIGEgbGluZSBmcm9tIGVhY2ggYmxvY2sgb2Ygc2VsZWN0ZWQgbGluZXMnXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrc2hpZnQrbCdcbiAgICAgICAgICAgIGFjY2VsOiAnY3RybCtzaGlmdCtsJ1xuXG4gICAgc2VsZWN0TW9yZUxpbmVzOiAtPlxuICAgICAgICBcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgbmV3Q3Vyc29ycyAgICA9IEBkby5jdXJzb3JzKClcbiAgICAgICAgbmV3U2VsZWN0aW9ucyA9IEBkby5zZWxlY3Rpb25zKClcbiAgICAgICAgXG4gICAgICAgIHNlbGVjdEN1cnNvckxpbmVBdEluZGV4ID0gKGMsaSkgPT5cbiAgICAgICAgICAgIHJhbmdlID0gW2ksIFswLCBAZG8ubGluZShpKS5sZW5ndGhdXSBcbiAgICAgICAgICAgIG5ld1NlbGVjdGlvbnMucHVzaCByYW5nZVxuICAgICAgICAgICAgY3Vyc29yU2V0IGMsIHJhbmdlRW5kUG9zIHJhbmdlXG4gICAgICAgICAgICBcbiAgICAgICAgc3RhcnQgPSBmYWxzZVxuICAgICAgICBmb3IgYyBpbiBuZXdDdXJzb3JzXG4gICAgICAgICAgICBpZiBub3QgQGlzU2VsZWN0ZWRMaW5lQXRJbmRleCBjWzFdXG4gICAgICAgICAgICAgICAgc2VsZWN0Q3Vyc29yTGluZUF0SW5kZXggYywgY1sxXVxuICAgICAgICAgICAgICAgIHN0YXJ0ID0gdHJ1ZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBub3Qgc3RhcnRcbiAgICAgICAgICAgIGZvciBjIGluIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICBzZWxlY3RDdXJzb3JMaW5lQXRJbmRleCBjLCBjWzFdKzEgaWYgY1sxXSA8IEBudW1MaW5lcygpLTFcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQGRvLnNlbGVjdCBuZXdTZWxlY3Rpb25zXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnNcbiAgICAgICAgQGRvLmVuZCgpICAgICAgIFxuXG4gICAgc2VsZWN0TGVzc0xpbmVzOiAtPiBcbiAgICAgICAgXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIG5ld0N1cnNvcnMgICAgPSBAZG8uY3Vyc29ycygpXG4gICAgICAgIG5ld1NlbGVjdGlvbnMgPSBAZG8uc2VsZWN0aW9ucygpXG4gICAgICAgIFxuICAgICAgICBmb3IgYyBpbiByZXZlcnNlZCBuZXdDdXJzb3JzXG4gICAgICAgICAgICB0aGlzU2VsID0gcmFuZ2VzQXRMaW5lSW5kZXhJblJhbmdlcyBjWzFdLCBuZXdTZWxlY3Rpb25zXG4gICAgICAgICAgICBpZiB0aGlzU2VsLmxlbmd0aFxuICAgICAgICAgICAgICAgIGlmIEBpc1NlbGVjdGVkTGluZUF0SW5kZXggY1sxXS0xXG4gICAgICAgICAgICAgICAgICAgIHMgPSBfLmZpcnN0IHJhbmdlc0F0TGluZUluZGV4SW5SYW5nZXMgY1sxXS0xLCBuZXdTZWxlY3Rpb25zXG4gICAgICAgICAgICAgICAgICAgIGN1cnNvclNldCBjLCBzWzFdWzFdLCBzWzBdXG4gICAgICAgICAgICAgICAgbmV3U2VsZWN0aW9ucy5zcGxpY2UgbmV3U2VsZWN0aW9ucy5pbmRleE9mKHRoaXNTZWxbMF0pLCAxXG5cbiAgICAgICAgQGRvLnNlbGVjdCBuZXdTZWxlY3Rpb25zXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnNcbiAgICAgICAgQGRvLmVuZCgpICBcbiJdfQ==
//# sourceURL=../../../coffee/editor/actions/selectlines.coffee