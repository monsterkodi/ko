// koffee 1.4.0
var _, clamp, ref, reversed,
    indexOf = [].indexOf;

ref = require('kxk'), reversed = ref.reversed, clamp = ref.clamp, _ = ref._;

module.exports = {
    insertCharacter: function(ch) {
        var cc, cline, i, j, len, len1, nc, newCursors, ref1, sline;
        if (ch === '\n') {
            return this.newline();
        }
        if (this.salterMode && this.insertSalterCharacter(ch)) {
            return;
        }
        this["do"].start();
        this.clampCursorOrFillVirtualSpaces();
        if (indexOf.call(this.surroundCharacters, ch) >= 0) {
            if (this.insertSurroundCharacter(ch)) {
                this["do"].end();
                return;
            }
        }
        this.deleteSelection();
        newCursors = this["do"].cursors();
        for (i = 0, len = newCursors.length; i < len; i++) {
            cc = newCursors[i];
            cline = this["do"].line(cc[1]);
            sline = this.twiggleSubstitute({
                line: cline,
                cursor: cc,
                char: ch
            });
            if (sline) {
                this["do"].change(cc[1], sline);
            } else {
                this["do"].change(cc[1], cline.splice(cc[0], 0, ch));
                ref1 = positionsAtLineIndexInPositions(cc[1], newCursors);
                for (j = 0, len1 = ref1.length; j < len1; j++) {
                    nc = ref1[j];
                    if (nc[0] >= cc[0]) {
                        nc[0] += 1;
                    }
                }
            }
        }
        this["do"].setCursors(newCursors);
        this["do"].end();
        return this.emitEdit('insert');
    },
    twiggleSubstitute: function(arg) {
        var char, cursor, line, ref1, ref2, ref3, substitute;
        line = (ref1 = arg.line) != null ? ref1 : null, cursor = (ref2 = arg.cursor) != null ? ref2 : null, char = (ref3 = arg.char) != null ? ref3 : null;
        if (cursor[0] && line[cursor[0] - 1] === '~') {
            substitute = (function() {
                switch (char) {
                    case '>':
                        return '▸';
                    case '<':
                        return '◂';
                    case '^':
                        return '▴';
                    case 'v':
                        return '▾';
                    case 'd':
                        return '◆';
                    case 'c':
                        return '●';
                    case 'o':
                        return '○';
                    case 's':
                        return '▪';
                    case 'S':
                        return '■';
                }
            })();
            if (substitute) {
                return line.splice(cursor[0] - 1, 1, substitute);
            }
        }
    },
    clampCursorOrFillVirtualSpaces: function() {
        var cursor, lineLength, x, y;
        this["do"].start();
        if (this["do"].numCursors() === 1) {
            cursor = this["do"].cursor(0);
            y = clamp(0, this["do"].numLines() - 1, cursor[1]);
            lineLength = this["do"].numLines() && this["do"].line(cursor[1]).length || 0;
            x = clamp(0, lineLength, cursor[0]);
            this["do"].setCursors([[x, y]]);
        } else {
            this.fillVirtualSpaces();
        }
        return this["do"].end();
    },
    fillVirtualSpaces: function() {
        var c, i, len, ref1;
        this["do"].start();
        ref1 = reversed(this["do"].cursors());
        for (i = 0, len = ref1.length; i < len; i++) {
            c = ref1[i];
            if (c[0] > this["do"].line(c[1]).length) {
                this["do"].change(c[1], this["do"].line(c[1]).splice(c[0], 0, _.padStart('', c[0] - this["do"].line(c[1]).length)));
            }
        }
        return this["do"].end();
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zZXJ0Y2hhcmFjdGVyLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBT0EsSUFBQSx1QkFBQTtJQUFBOztBQUFBLE1BQXlCLE9BQUEsQ0FBUSxLQUFSLENBQXpCLEVBQUUsdUJBQUYsRUFBWSxpQkFBWixFQUFtQjs7QUFFbkIsTUFBTSxDQUFDLE9BQVAsR0FFSTtJQUFBLGVBQUEsRUFBaUIsU0FBQyxFQUFEO0FBRWIsWUFBQTtRQUFBLElBQXFCLEVBQUEsS0FBTSxJQUEzQjtBQUFBLG1CQUFPLElBQUMsQ0FBQSxPQUFELENBQUEsRUFBUDs7UUFDQSxJQUFVLElBQUMsQ0FBQSxVQUFELElBQWdCLElBQUMsQ0FBQSxxQkFBRCxDQUF1QixFQUF2QixDQUExQjtBQUFBLG1CQUFBOztRQUVBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxLQUFKLENBQUE7UUFDQSxJQUFDLENBQUEsOEJBQUQsQ0FBQTtRQUVBLElBQUcsYUFBTSxJQUFDLENBQUEsa0JBQVAsRUFBQSxFQUFBLE1BQUg7WUFDSSxJQUFHLElBQUMsQ0FBQSx1QkFBRCxDQUF5QixFQUF6QixDQUFIO2dCQUNJLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7QUFDQSx1QkFGSjthQURKOztRQUtBLElBQUMsQ0FBQSxlQUFELENBQUE7UUFFQSxVQUFBLEdBQWEsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE9BQUosQ0FBQTtBQUViLGFBQUEsNENBQUE7O1lBQ0ksS0FBQSxHQUFRLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsRUFBRyxDQUFBLENBQUEsQ0FBWjtZQUNSLEtBQUEsR0FBUSxJQUFDLENBQUEsaUJBQUQsQ0FBbUI7Z0JBQUEsSUFBQSxFQUFLLEtBQUw7Z0JBQVksTUFBQSxFQUFPLEVBQW5CO2dCQUF1QixJQUFBLEVBQUssRUFBNUI7YUFBbkI7WUFDUixJQUFHLEtBQUg7Z0JBQ0ksSUFBQyxFQUFBLEVB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QUFPLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsQ0FBRSxDQUFBLENBQUEsQ0FBWCxDQUFjLENBQUMsTUFBekI7Z0JBQ0ksSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE1BQUosQ0FBVyxDQUFFLENBQUEsQ0FBQSxDQUFiLEVBQWlCLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsQ0FBRSxDQUFBLENBQUEsQ0FBWCxDQUFjLENBQUMsTUFBZixDQUFzQixDQUFFLENBQUEsQ0FBQSxDQUF4QixFQUE0QixDQUE1QixFQUErQixDQUFDLENBQUMsUUFBRixDQUFXLEVBQVgsRUFBZSxDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQUssSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLElBQUosQ0FBUyxDQUFFLENBQUEsQ0FBQSxDQUFYLENBQWMsQ0FBQyxNQUFuQyxDQUEvQixDQUFqQixFQURKOztBQURKO2VBR0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEdBQUosQ0FBQTtJQU5lLENBN0RuQiIsInNvdXJjZXNDb250ZW50IjpbIlxuIyAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMFxuIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgIFxuIyAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgIDAwMCAgIFxuIyAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgIFxuIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuXG57IHJldmVyc2VkLCBjbGFtcCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG4gICAgXG4gICAgaW5zZXJ0Q2hhcmFjdGVyOiAoY2gpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gQG5ld2xpbmUoKSBpZiBjaCA9PSAnXFxuJ1xuICAgICAgICByZXR1cm4gaWYgQHNhbHRlck1vZGUgYW5kIEBpbnNlcnRTYWx0ZXJDaGFyYWN0ZXIgY2hcbiAgICAgICAgXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBjbGFtcEN1cnNvck9yRmlsbFZpcnR1YWxTcGFjZXMoKVxuICAgICAgICBcbiAgICAgICAgaWYgY2ggaW4gQHN1cnJvdW5kQ2hhcmFjdGVyc1xuICAgICAgICAgICAgaWYgQGluc2VydFN1cnJvdW5kQ2hhcmFjdGVyIGNoXG4gICAgICAgICAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgXG4gICAgICAgIEBkZWxldGVTZWxlY3Rpb24oKVxuXG4gICAgICAgIG5ld0N1cnNvcnMgPSBAZG8uY3Vyc29ycygpXG4gICAgICAgIFxuICAgICAgICBmb3IgY2MgaW4gbmV3Q3Vyc29yc1xuICAgICAgICAgICAgY2xpbmUgPSBAZG8ubGluZShjY1sxXSlcbiAgICAgICAgICAgIHNsaW5lID0gQHR3aWdnbGVTdWJzdGl0dXRlIGxpbmU6Y2xpbmUsIGN1cnNvcjpjYywgY2hhcjpjaFxuICAgICAgICAgICAgaWYgc2xpbmVcbiAgICAgICAgICAgICAgICBAZG8uY2hhbmdlIGNjWzFdLCBzbGluZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBkby5jaGFuZ2UgY2NbMV0sIGNsaW5lLnNwbGljZSBjY1swXSwgMCwgY2hcbiAgICAgICAgICAgICAgICBmb3IgbmMgaW4gcG9zaXRpb25zQXRMaW5lSW5kZXhJblBvc2l0aW9ucyBjY1sxXSwgbmV3Q3Vyc29yc1xuICAgICAgICAgICAgICAgICAgICBpZiBuY1swXSA+PSBjY1swXVxuICAgICAgICAgICAgICAgICAgICAgICAgbmNbMF0gKz0gMVxuICAgICAgICBcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29yc1xuICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgQGVtaXRFZGl0ICdpbnNlcnQnXG5cbiAgICB0d2lnZ2xlU3Vic3RpdHV0ZTogKGxpbmU6LGN1cnNvcjosY2hhcjopIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBjdXJzb3JbMF0gYW5kIGxpbmVbY3Vyc29yWzBdLTFdID09ICd+J1xuICAgICAgICAgICAgc3Vic3RpdHV0ZSA9IHN3aXRjaCBjaGFyXG4gICAgICAgICAgICAgICAgd2hlbiAnPicgdGhlbiAn4pa4J1xuICAgICAgICAgICAgICAgIHdoZW4gJzwnIHRoZW4gJ+KXgidcbiAgICAgICAgICAgICAgICB3aGVuICdeJyB0aGVuICfilrQnXG4gICAgICAgICAgICAgICAgd2hlbiAndicgdGhlbiAn4pa+J1xuICAgICAgICAgICAgICAgIHdoZW4gJ2QnIHRoZW4gJ+KXhidcbiAgICAgICAgICAgICAgICB3aGVuICdjJyB0aGVuICfil48nXG4gICAgICAgICAgICAgICAgd2hlbiAnbycgdGhlbiAn4peLJ1xuICAgICAgICAgICAgICAgIHdoZW4gJ3MnIHRoZW4gJ+KWqidcbiAgICAgICAgICAgICAgICB3aGVuICdTJyB0aGVuICfilqAnXG4gICAgICAgICAgICBpZiBzdWJzdGl0dXRlXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxpbmUuc3BsaWNlIGN1cnNvclswXS0xLCAxLCBzdWJzdGl0dXRlXG4gICAgICAgIFxuICAgIGNsYW1wQ3Vyc29yT3JGaWxsVmlydHVhbFNwYWNlczogLT5cbiAgICAgICAgXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIGlmIEBkby5udW1DdXJzb3JzKCkgPT0gMVxuICAgICAgICAgICAgY3Vyc29yID0gQGRvLmN1cnNvciAwXG4gICAgICAgICAgICB5ID0gY2xhbXAgMCwgQGRvLm51bUxpbmVzKCktMSwgY3Vyc29yWzFdXG4gICAgICAgICAgICBsaW5lTGVuZ3RoID0gQGRvLm51bUxpbmVzKCkgYW5kIEBkby5saW5lKGN1cnNvclsxXSkubGVuZ3RoIG9yIDBcbiAgICAgICAgICAgIHggPSBjbGFtcCAwLCBsaW5lTGVuZ3RoLCBjdXJzb3JbMF1cbiAgICAgICAgICAgIEBkby5zZXRDdXJzb3JzIFtbeCx5XV1cbiAgICAgICAgZWxzZSBcbiAgICAgICAgICAgIEBmaWxsVmlydHVhbFNwYWNlcygpXG4gICAgICAgIEBkby5lbmQoKVxuXG4gICAgZmlsbFZpcnR1YWxTcGFjZXM6IC0+ICMgZmlsbCBzcGFjZXMgYmV0d2VlbiBsaW5lIGVuZHMgYW5kIGN1cnNvcnNcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQGRvLnN0YXJ0KCkgXG4gICAgICAgIGZvciBjIGluIHJldmVyc2VkIEBkby5jdXJzb3JzKClcbiAgICAgICAgICAgIGlmIGNbMF0gPiBAZG8ubGluZShjWzFdKS5sZW5ndGhcbiAgICAgICAgICAgICAgICBAZG8uY2hhbmdlIGNbMV0sIEBkby5saW5lKGNbMV0pLnNwbGljZSBjWzBdLCAwLCBfLnBhZFN0YXJ0ICcnLCBjWzBdLUBkby5saW5lKGNbMV0pLmxlbmd0aFxuICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgIl19
//# sourceURL=../../../coffee/editor/actions/insertcharacter.coffee