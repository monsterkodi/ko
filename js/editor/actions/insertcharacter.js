// koffee 1.19.0
var _, clamp, ref, reversed,
    indexOf = [].indexOf;

ref = require('kxk'), _ = ref._, clamp = ref.clamp, reversed = ref.reversed;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zZXJ0Y2hhcmFjdGVyLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uL2NvZmZlZS9lZGl0b3IvYWN0aW9ucyIsInNvdXJjZXMiOlsiaW5zZXJ0Y2hhcmFjdGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBT0EsSUFBQSx1QkFBQTtJQUFBOztBQUFBLE1BQXlCLE9BQUEsQ0FBUSxLQUFSLENBQXpCLEVBQUUsU0FBRixFQUFLLGlCQUFMLEVBQVk7O0FBRVosTUFBTSxDQUFDLE9BQVAsR0FFSTtJQUFBLGVBQUEsRUFBaUIsU0FBQyxFQUFEO0FBRWIsWUFBQTtRQUFBLElBQXFCLEVBQUEsS0FBTSxJQUEzQjtBQUFBLG1CQUFPLElBQUMsQ0FBQSxPQUFELENBQUEsRUFBUDs7UUFDQSxJQUFVLElBQUMsQ0FBQSxVQUFELElBQWdCLElBQUMsQ0FBQSxxQkFBRCxDQUF1QixFQUF2QixDQUExQjtBQUFBLG1CQUFBOztRQUVBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxLQUFKLENBQUE7UUFDQSxJQUFDLENBQUEsOEJBQUQsQ0FBQTtRQUVBLElBQUcsYUFBTSxJQUFDLENBQUEsa0JBQVAsRUFBQSxFQUFBLE1BQUg7WUFDSSxJQUFHLElBQUMsQ0FBQSx1QkFBRCxDQUF5QixFQUF6QixDQUFIO2dCQUNJLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7QUFDQSx1QkFGSjthQURKOztRQUtBLElBQUMsQ0FBQSxlQUFELENBQUE7UUFFQSxVQUFBLEdBQWEsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE9BQUosQ0FBQTtBQUViLGFBQUEsNENBQUE7O1lBQ0ksS0FBQSxHQUFRLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsRUFBRyxDQUFBLENBQUEsQ0FBWjtZQUNSLEtBQUEsR0FBUSxJQUFDLENBQUEsaUJBQUQsQ0FBbUI7Z0JBQUEsSUFBQSxFQUFLLEtBQUw7Z0JBQVksTUFBQSxFQUFPLEVBQW5CO2dCQUF1QixJQUFBLEVB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QUFBQSxhQUFBLHNDQUFBOztZQUNJLElBQUcsQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFPLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsQ0FBRSxDQUFBLENBQUEsQ0FBWCxDQUFjLENBQUMsTUFBekI7Z0JBQ0ksSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE1BQUosQ0FBVyxDQUFFLENBQUEsQ0FBQSxDQUFiLEVBQWlCLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsQ0FBRSxDQUFBLENBQUEsQ0FBWCxDQUFjLENBQUMsTUFBZixDQUFzQixDQUFFLENBQUEsQ0FBQSxDQUF4QixFQUE0QixDQUE1QixFQUErQixDQUFDLENBQUMsUUFBRixDQUFXLEVBQVgsRUFBZSxDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQUssSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLElBQUosQ0FBUyxDQUFFLENBQUEsQ0FBQSxDQUFYLENBQWMsQ0FBQyxNQUFuQyxDQUEvQixDQUFqQixFQURKOztBQURKO2VBR0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEdBQUosQ0FBQTtJQU5lLENBN0RuQiIsInNvdXJjZXNDb250ZW50IjpbIlxuIyAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMFxuIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgIFxuIyAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgIDAwMCAgIFxuIyAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgIFxuIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuXG57IF8sIGNsYW1wLCByZXZlcnNlZCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG4gICAgXG4gICAgaW5zZXJ0Q2hhcmFjdGVyOiAoY2gpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gQG5ld2xpbmUoKSBpZiBjaCA9PSAnXFxuJ1xuICAgICAgICByZXR1cm4gaWYgQHNhbHRlck1vZGUgYW5kIEBpbnNlcnRTYWx0ZXJDaGFyYWN0ZXIgY2hcbiAgICAgICAgXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBjbGFtcEN1cnNvck9yRmlsbFZpcnR1YWxTcGFjZXMoKVxuICAgICAgICBcbiAgICAgICAgaWYgY2ggaW4gQHN1cnJvdW5kQ2hhcmFjdGVyc1xuICAgICAgICAgICAgaWYgQGluc2VydFN1cnJvdW5kQ2hhcmFjdGVyIGNoXG4gICAgICAgICAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgXG4gICAgICAgIEBkZWxldGVTZWxlY3Rpb24oKVxuXG4gICAgICAgIG5ld0N1cnNvcnMgPSBAZG8uY3Vyc29ycygpXG4gICAgICAgIFxuICAgICAgICBmb3IgY2MgaW4gbmV3Q3Vyc29yc1xuICAgICAgICAgICAgY2xpbmUgPSBAZG8ubGluZSBjY1sxXVxuICAgICAgICAgICAgc2xpbmUgPSBAdHdpZ2dsZVN1YnN0aXR1dGUgbGluZTpjbGluZSwgY3Vyc29yOmNjLCBjaGFyOmNoXG4gICAgICAgICAgICBpZiBzbGluZVxuICAgICAgICAgICAgICAgIEBkby5jaGFuZ2UgY2NbMV0sIHNsaW5lXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGRvLmNoYW5nZSBjY1sxXSwgY2xpbmUuc3BsaWNlIGNjWzBdLCAwLCBjaFxuICAgICAgICAgICAgICAgIGZvciBuYyBpbiBwb3NpdGlvbnNBdExpbmVJbmRleEluUG9zaXRpb25zIGNjWzFdLCBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgICAgIGlmIG5jWzBdID49IGNjWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICBuY1swXSArPSAxXG4gICAgICAgIFxuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzXG4gICAgICAgIEBkby5lbmQoKVxuICAgICAgICBAZW1pdEVkaXQgJ2luc2VydCdcblxuICAgIHR3aWdnbGVTdWJzdGl0dXRlOiAobGluZTosY3Vyc29yOixjaGFyOikgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGN1cnNvclswXSBhbmQgbGluZVtjdXJzb3JbMF0tMV0gPT0gJ34nXG4gICAgICAgICAgICBzdWJzdGl0dXRlID0gc3dpdGNoIGNoYXJcbiAgICAgICAgICAgICAgICB3aGVuICc+JyB0aGVuICfilrgnXG4gICAgICAgICAgICAgICAgd2hlbiAnPCcgdGhlbiAn4peCJ1xuICAgICAgICAgICAgICAgIHdoZW4gJ14nIHRoZW4gJ+KWtCdcbiAgICAgICAgICAgICAgICB3aGVuICd2JyB0aGVuICfilr4nXG4gICAgICAgICAgICAgICAgd2hlbiAnZCcgdGhlbiAn4peGJ1xuICAgICAgICAgICAgICAgIHdoZW4gJ2MnIHRoZW4gJ+KXjydcbiAgICAgICAgICAgICAgICB3aGVuICdvJyB0aGVuICfil4snXG4gICAgICAgICAgICAgICAgd2hlbiAncycgdGhlbiAn4paqJ1xuICAgICAgICAgICAgICAgIHdoZW4gJ1MnIHRoZW4gJ+KWoCdcbiAgICAgICAgICAgIGlmIHN1YnN0aXR1dGVcbiAgICAgICAgICAgICAgICByZXR1cm4gbGluZS5zcGxpY2UgY3Vyc29yWzBdLTEsIDEsIHN1YnN0aXR1dGVcbiAgICBcbiAgICBjbGFtcEN1cnNvck9yRmlsbFZpcnR1YWxTcGFjZXM6IC0+XG4gICAgICAgIFxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBpZiBAZG8ubnVtQ3Vyc29ycygpID09IDFcbiAgICAgICAgICAgIGN1cnNvciA9IEBkby5jdXJzb3IgMFxuICAgICAgICAgICAgeSA9IGNsYW1wIDAsIEBkby5udW1MaW5lcygpLTEsIGN1cnNvclsxXVxuICAgICAgICAgICAgbGluZUxlbmd0aCA9IEBkby5udW1MaW5lcygpIGFuZCBAZG8ubGluZShjdXJzb3JbMV0pLmxlbmd0aCBvciAwXG4gICAgICAgICAgICB4ID0gY2xhbXAgMCwgbGluZUxlbmd0aCwgY3Vyc29yWzBdXG4gICAgICAgICAgICBAZG8uc2V0Q3Vyc29ycyBbW3gseV1dXG4gICAgICAgIGVsc2UgXG4gICAgICAgICAgICBAZmlsbFZpcnR1YWxTcGFjZXMoKVxuICAgICAgICBAZG8uZW5kKClcblxuICAgIGZpbGxWaXJ0dWFsU3BhY2VzOiAtPiAjIGZpbGwgc3BhY2VzIGJldHdlZW4gbGluZSBlbmRzIGFuZCBjdXJzb3JzXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBkby5zdGFydCgpIFxuICAgICAgICBmb3IgYyBpbiByZXZlcnNlZCBAZG8uY3Vyc29ycygpXG4gICAgICAgICAgICBpZiBjWzBdID4gQGRvLmxpbmUoY1sxXSkubGVuZ3RoXG4gICAgICAgICAgICAgICAgQGRvLmNoYW5nZSBjWzFdLCBAZG8ubGluZShjWzFdKS5zcGxpY2UgY1swXSwgMCwgXy5wYWRTdGFydCAnJywgY1swXS1AZG8ubGluZShjWzFdKS5sZW5ndGhcbiAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgICJdfQ==
//# sourceURL=../../../coffee/editor/actions/insertcharacter.coffee