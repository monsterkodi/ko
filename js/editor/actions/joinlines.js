// koffee 1.16.0
module.exports = {
    actions: {
        menu: 'Line',
        joinLines: {
            name: 'Join Lines',
            combo: 'command+j',
            accel: 'ctrl+j'
        }
    },
    insertThen: function(before, after) {
        var bw;
        if (/(when|if)/.test(before)) {
            bw = lastWordInLine(before);
            if ((bw !== 'and' && bw !== 'or') && (!after.trim().startsWith('then')) && !/then/.test(before)) {
                after = 'then ' + after;
            }
        }
        return after;
    },
    joinLines: function() {
        var after, before, c, i, j, k, len, len1, len2, nc, newCursors, ref, ref1, ref2, ref3;
        this["do"].start();
        newCursors = [];
        ref = this["do"].cursors().reverse();
        for (i = 0, len = ref.length; i < len; i++) {
            c = ref[i];
            if (!this.isCursorInLastLine(c)) {
                before = this["do"].line(c[1]).trimRight() + " ";
                after = this["do"].line(c[1] + 1).trimLeft();
                if ((ref1 = this.fileType) === 'coffee' || ref1 === 'koffee') {
                    after = this.insertThen(before, after);
                }
                this["do"].change(c[1], before + after);
                this["do"]["delete"](c[1] + 1);
                newCursors.push([before.length, c[1]]);
                ref2 = positionsAtLineIndexInPositions(c[1] + 1, newCursors);
                for (j = 0, len1 = ref2.length; j < len1; j++) {
                    nc = ref2[j];
                    cursorDelta(nc, before.length, -1);
                }
                ref3 = positionsBelowLineIndexInPositions(c[1], newCursors);
                for (k = 0, len2 = ref3.length; k < len2; k++) {
                    nc = ref3[k];
                    cursorDelta(nc, 0, -1);
                }
            }
        }
        this["do"].setCursors(newCursors, {
            main: 0
        });
        return this["do"].end();
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiam9pbmxpbmVzLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uL2NvZmZlZS9lZGl0b3IvYWN0aW9ucyIsInNvdXJjZXMiOlsiam9pbmxpbmVzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBT0EsTUFBTSxDQUFDLE9BQVAsR0FFSTtJQUFBLE9BQUEsRUFDSTtRQUFBLElBQUEsRUFBTSxNQUFOO1FBRUEsU0FBQSxFQUNJO1lBQUEsSUFBQSxFQUFNLFlBQU47WUFDQSxLQUFBLEVBQU8sV0FEUDtZQUVBLEtBQUEsRUFBTyxRQUZQO1NBSEo7S0FESjtJQVFBLFVBQUEsRUFBWSxTQUFDLE1BQUQsRUFBUyxLQUFUO0FBQ1IsWUFBQTtRQUFBLElBQUcsV0FBVyxDQUFDLElBQVosQ0FBaUIsTUFBakIsQ0FBSDtZQUNJLEVBQUEsR0FBSyxjQUFBLENBQWUsTUFBZjtZQUNMLElBQUcsQ0FBQSxFQUFBLEtBQVcsS0FBWCxJQUFBLEVBQUEsS0FBa0IsSUFBbEIsQ0FBQSxJQUE0QixDQUFDLENBQUksS0FBSyxDQUFDLElBQU4sQ0FBQSxDQUFZLENBQUMsVUFBYixDQUF3QixNQUF4QixDQUFMLENBQTVCLElBQXFFLENBQUksTUFBTSxDQUFDLElBQVAsQ0FBWSxNQUFaLENBQTVFO2dCQUNJLEtBQUEsR0FBUSxPQUFBLEdBQVUsTUFEdEI7YUFGSjs7ZUFJQTtJQUxRLENBUlo7SUFlQSxTQUFBLEVBQVcsU0FBQTtBQUVQLFlBQUE7UUFBQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsS0FBSixDQUFBO1FBRUEsVUFBQSxHQUFhO0FBQ2I7QUFBQSxhQUFBLHFDQUFBOztZQUVJLElBQUcsQ0FBSSxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsQ0FBcEIsQ0FBUDtnQkFDSSxNQUFBLEdBQVMsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLElBQUosQ0FBUyxDQUFFLENBQUEsQ0FBQSxDQUFYLENBQWMsQ0FBQyxTQUFmLENBQUEsQ0FBQSxHQUE2QjtnQkFDdEMsS0FBQSxHQUFTLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFLLENBQWQsQ0FBZ0IsQ0FBQyxRQUFqQixDQUFBO2dCQUVULFlBQUcsSUFBQyxDQUFBLFNBQUQsS0FBYyxRQUFkLElBQUEsSUFBQSxLQUF3QixRQUEzQjtvQkFDSSxLQUFBLEdBQVEsSUFBQyxDQUFBLFVBQUQsQ0FBWSxNQUFaLEVBQW9CLEtBQXBCLEVBRFo7O2dCQUdBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxNQUFKLENBQVcsQ0FBRSxDQUFBLENBQUEsQ0FBYixFQUFpQixNQUFBLEdBQVMsS0FBMUI7Z0JBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxFQUFDLE1BQUQsRUFBSCxDQUFXLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBSyxDQUFoQjtnQkFFQSxVQUFVLENBQUMsSUFBWCxDQUFnQixDQUFDLE1BQU0sQ0FBQyxNQUFSLEVBQWdCLENBQUUsQ0FBQSxDQUFBLENBQWxCLENBQWhCO0FBRUE7QUFBQSxxQkFBQSx3Q0FBQTs7b0JBQ0ksV0FBQSxDQUFZLEVBQVosRUFBZ0IsTUFBTSxDQUFDLE1BQXZCLEVBQStCLENBQUMsQ0FBaEM7QUFESjtBQUVBO0FBQUEscUJBQUEsd0NBQUE7O29CQUNJLFdBQUEsQ0FBWSxFQUFaLEVBQWdCLENBQWhCLEVBQW1CLENBQUMsQ0FBcEI7QUFESixpQkFkSjs7QUFGSjtRQW1CQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsVUFBSixDQUFlLFVBQWYsRUFBMkI7WUFBQSxJQUFBLEVBQU0sQ0FBTjtTQUEzQjtlQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7SUF6Qk8sQ0FmWCIsInNvdXJjZXNDb250ZW50IjpbIlxuIyAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuIyAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDAgIFxuIyAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuXG5tb2R1bGUuZXhwb3J0cyA9IFxuICAgIFxuICAgIGFjdGlvbnM6XG4gICAgICAgIG1lbnU6ICdMaW5lJ1xuICAgICAgICBcbiAgICAgICAgam9pbkxpbmVzOlxuICAgICAgICAgICAgbmFtZTogJ0pvaW4gTGluZXMnXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQraidcbiAgICAgICAgICAgIGFjY2VsOiAnY3RybCtqJ1xuXG4gICAgaW5zZXJ0VGhlbjogKGJlZm9yZSwgYWZ0ZXIpIC0+XG4gICAgICAgIGlmIC8od2hlbnxpZikvLnRlc3QgYmVmb3JlIFxuICAgICAgICAgICAgYncgPSBsYXN0V29yZEluTGluZSBiZWZvcmVcbiAgICAgICAgICAgIGlmIGJ3IG5vdCBpbiBbJ2FuZCcsICdvciddIGFuZCAobm90IGFmdGVyLnRyaW0oKS5zdGFydHNXaXRoICd0aGVuJykgYW5kIG5vdCAvdGhlbi8udGVzdCBiZWZvcmVcbiAgICAgICAgICAgICAgICBhZnRlciA9ICd0aGVuICcgKyBhZnRlclxuICAgICAgICBhZnRlclxuXG4gICAgam9pbkxpbmVzOiAtPlxuICAgICAgICBcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgXG4gICAgICAgIG5ld0N1cnNvcnMgPSBbXVxuICAgICAgICBmb3IgYyBpbiBAZG8uY3Vyc29ycygpLnJldmVyc2UoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBub3QgQGlzQ3Vyc29ySW5MYXN0TGluZSBjXG4gICAgICAgICAgICAgICAgYmVmb3JlID0gQGRvLmxpbmUoY1sxXSkudHJpbVJpZ2h0KCkgKyBcIiBcIlxuICAgICAgICAgICAgICAgIGFmdGVyICA9IEBkby5saW5lKGNbMV0rMSkudHJpbUxlZnQoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIEBmaWxlVHlwZSBpbiBbJ2NvZmZlZScsICdrb2ZmZWUnXVxuICAgICAgICAgICAgICAgICAgICBhZnRlciA9IEBpbnNlcnRUaGVuIGJlZm9yZSwgYWZ0ZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAZG8uY2hhbmdlIGNbMV0sIGJlZm9yZSArIGFmdGVyXG4gICAgICAgICAgICAgICAgQGRvLmRlbGV0ZSBjWzFdKzFcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBuZXdDdXJzb3JzLnB1c2ggW2JlZm9yZS5sZW5ndGgsIGNbMV1dXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZm9yIG5jIGluIHBvc2l0aW9uc0F0TGluZUluZGV4SW5Qb3NpdGlvbnMgY1sxXSsxLCBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgICAgIGN1cnNvckRlbHRhIG5jLCBiZWZvcmUubGVuZ3RoLCAtMVxuICAgICAgICAgICAgICAgIGZvciBuYyBpbiBwb3NpdGlvbnNCZWxvd0xpbmVJbmRleEluUG9zaXRpb25zIGNbMV0sIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yRGVsdGEgbmMsIDAsIC0xXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzLCBtYWluOiAwXG4gICAgICAgIEBkby5lbmQoKVxuIl19
//# sourceURL=../../../coffee/editor/actions/joinlines.coffee