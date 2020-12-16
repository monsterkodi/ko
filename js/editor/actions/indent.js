// koffee 1.14.0
module.exports = {
    actions: {
        menu: 'Line',
        indent: {
            name: 'Indent',
            combo: 'command+]',
            accel: 'ctrl+]'
        },
        deIndent: {
            name: 'Outdent',
            combo: 'command+[',
            accel: 'ctrl+['
        }
    },
    indent: function() {
        var i, j, k, l, len, len1, len2, nc, newCursors, newSelections, ns, ref, ref1, ref2;
        this["do"].start();
        newSelections = this["do"].selections();
        newCursors = this["do"].cursors();
        ref = this.selectedAndCursorLineIndices();
        for (j = 0, len = ref.length; j < len; j++) {
            i = ref[j];
            this["do"].change(i, this.indentString + this["do"].line(i));
            ref1 = positionsAtLineIndexInPositions(i, newCursors);
            for (k = 0, len1 = ref1.length; k < len1; k++) {
                nc = ref1[k];
                cursorDelta(nc, this.indentString.length);
            }
            ref2 = rangesAtLineIndexInRanges(i, newSelections);
            for (l = 0, len2 = ref2.length; l < len2; l++) {
                ns = ref2[l];
                ns[1][0] += this.indentString.length;
                ns[1][1] += this.indentString.length;
            }
        }
        this["do"].select(newSelections);
        this["do"].setCursors(newCursors);
        return this["do"].end();
    },
    deIndent: function() {
        var i, j, k, l, len, len1, len2, lineCursors, nc, newCursors, newSelections, ns, ref, ref1;
        this["do"].start();
        newSelections = this["do"].selections();
        newCursors = this["do"].cursors();
        ref = this.selectedAndCursorLineIndices();
        for (j = 0, len = ref.length; j < len; j++) {
            i = ref[j];
            if (this["do"].line(i).startsWith(this.indentString)) {
                this["do"].change(i, this["do"].line(i).substr(this.indentString.length));
                lineCursors = positionsAtLineIndexInPositions(i, newCursors);
                for (k = 0, len1 = lineCursors.length; k < len1; k++) {
                    nc = lineCursors[k];
                    cursorDelta(nc, -this.indentString.length);
                }
                ref1 = rangesAtLineIndexInRanges(i, newSelections);
                for (l = 0, len2 = ref1.length; l < len2; l++) {
                    ns = ref1[l];
                    ns[1][0] -= this.indentString.length;
                    ns[1][1] -= this.indentString.length;
                }
            }
        }
        this["do"].select(newSelections);
        this["do"].setCursors(newCursors);
        return this["do"].end();
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZW50LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uL2NvZmZlZS9lZGl0b3IvYWN0aW9ucyIsInNvdXJjZXMiOlsiaW5kZW50LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBT0EsTUFBTSxDQUFDLE9BQVAsR0FFSTtJQUFBLE9BQUEsRUFDSTtRQUFBLElBQUEsRUFBTSxNQUFOO1FBRUEsTUFBQSxFQUNJO1lBQUEsSUFBQSxFQUFPLFFBQVA7WUFDQSxLQUFBLEVBQU8sV0FEUDtZQUVBLEtBQUEsRUFBTyxRQUZQO1NBSEo7UUFPQSxRQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU8sU0FBUDtZQUNBLEtBQUEsRUFBTyxXQURQO1lBRUEsS0FBQSxFQUFPLFFBRlA7U0FSSjtLQURKO0lBYUEsTUFBQSxFQUFRLFNBQUE7QUFDSixZQUFBO1FBQUEsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEtBQUosQ0FBQTtRQUNBLGFBQUEsR0FBZ0IsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFVBQUosQ0FBQTtRQUNoQixVQUFBLEdBQWdCLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxPQUFKLENBQUE7QUFDaEI7QUFBQSxhQUFBLHFDQUFBOztZQUNJLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxNQUFKLENBQVcsQ0FBWCxFQUFjLElBQUMsQ0FBQSxZQUFELEdBQWdCLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsQ0FBVCxDQUE5QjtBQUNBO0FBQUEsaUJBQUEsd0NBQUE7O2dCQUNJLFdBQUEsQ0FBWSxFQUFaLEVBQWdCLElBQUMsQ0FBQSxZQUFZLENBQUMsTUFBOUI7QUFESjtBQUVBO0FBQUEsaUJBQUEsd0NBQUE7O2dCQUNJLEVBQUcsQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLENBQU4sSUFBWSxJQUFDLENBQUEsWUFBWSxDQUFDO2dCQUMxQixFQUFHLENBQUEsQ0FBQSxDQUFHLENBQUEsQ0FBQSxDQUFOLElBQVksSUFBQyxDQUFBLFlBQVksQ0FBQztBQUY5QjtBQUpKO1FBT0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE1BQUosQ0FBVyxhQUFYO1FBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFVBQUosQ0FBZSxVQUFmO2VBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEdBQUosQ0FBQTtJQWJJLENBYlI7SUE0QkEsUUFBQSxFQUFVLFNBQUE7QUFDTixZQUFBO1FBQUEsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEtBQUosQ0FBQTtRQUNBLGFBQUEsR0FBZ0IsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFVBQUosQ0FBQTtRQUNoQixVQUFBLEdBQWdCLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxPQUFKLENBQUE7QUFDaEI7QUFBQSxhQUFBLHFDQUFBOztZQUNJLElBQUcsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLElBQUosQ0FBUyxDQUFULENBQVcsQ0FBQyxVQUFaLENBQXVCLElBQUMsQ0FBQSxZQUF4QixDQUFIO2dCQUNJLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxNQUFKLENBQVcsQ0FBWCxFQUFjLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsQ0FBVCxDQUFXLENBQUMsTUFBWixDQUFtQixJQUFDLENBQUEsWUFBWSxDQUFDLE1BQWpDLENBQWQ7Z0JBQ0EsV0FBQSxHQUFjLCtCQUFBLENBQWdDLENBQWhDLEVBQW1DLFVBQW5DO0FBQ2QscUJBQUEsK0NBQUE7O29CQUNJLFdBQUEsQ0FBWSxFQUFaLEVBQWdCLENBQUMsSUFBQyxDQUFBLFlBQVksQ0FBQyxNQUEvQjtBQURKO0FBRUE7QUFBQSxxQkFBQSx3Q0FBQTs7b0JBQ0ksRUFBRyxDQUFBLENBQUEsQ0FBRyxDQUFBLENBQUEsQ0FBTixJQUFZLElBQUMsQ0FBQSxZQUFZLENBQUM7b0JBQzFCLEVBQUcsQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLENBQU4sSUFBWSxJQUFDLENBQUEsWUFBWSxDQUFDO0FBRjlCLGlCQUxKOztBQURKO1FBU0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE1BQUosQ0FBVyxhQUFYO1FBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFVBQUosQ0FBZSxVQUFmO2VBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEdBQUosQ0FBQTtJQWZNLENBNUJWIiwic291cmNlc0NvbnRlbnQiOlsiXG4jIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDAgICBcbiMgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgXG4jIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgIFxuIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcblxubW9kdWxlLmV4cG9ydHMgPVxuICAgICAgXG4gICAgYWN0aW9uczogXG4gICAgICAgIG1lbnU6ICdMaW5lJ1xuICAgICAgICBcbiAgICAgICAgaW5kZW50OlxuICAgICAgICAgICAgbmFtZTogICdJbmRlbnQnXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrXSdcbiAgICAgICAgICAgIGFjY2VsOiAnY3RybCtdJ1xuICAgICAgICAgICAgXG4gICAgICAgIGRlSW5kZW50OlxuICAgICAgICAgICAgbmFtZTogICdPdXRkZW50J1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK1snXG4gICAgICAgICAgICBhY2NlbDogJ2N0cmwrWydcbiAgICAgICAgICAgIFxuICAgIGluZGVudDogLT5cbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgbmV3U2VsZWN0aW9ucyA9IEBkby5zZWxlY3Rpb25zKClcbiAgICAgICAgbmV3Q3Vyc29ycyAgICA9IEBkby5jdXJzb3JzKClcbiAgICAgICAgZm9yIGkgaW4gQHNlbGVjdGVkQW5kQ3Vyc29yTGluZUluZGljZXMoKVxuICAgICAgICAgICAgQGRvLmNoYW5nZSBpLCBAaW5kZW50U3RyaW5nICsgQGRvLmxpbmUoaSlcbiAgICAgICAgICAgIGZvciBuYyBpbiBwb3NpdGlvbnNBdExpbmVJbmRleEluUG9zaXRpb25zIGksIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICBjdXJzb3JEZWx0YSBuYywgQGluZGVudFN0cmluZy5sZW5ndGhcbiAgICAgICAgICAgIGZvciBucyBpbiByYW5nZXNBdExpbmVJbmRleEluUmFuZ2VzIGksIG5ld1NlbGVjdGlvbnNcbiAgICAgICAgICAgICAgICBuc1sxXVswXSArPSBAaW5kZW50U3RyaW5nLmxlbmd0aFxuICAgICAgICAgICAgICAgIG5zWzFdWzFdICs9IEBpbmRlbnRTdHJpbmcubGVuZ3RoXG4gICAgICAgIEBkby5zZWxlY3QgbmV3U2VsZWN0aW9uc1xuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzXG4gICAgICAgIEBkby5lbmQoKVxuXG4gICAgZGVJbmRlbnQ6IC0+IFxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBuZXdTZWxlY3Rpb25zID0gQGRvLnNlbGVjdGlvbnMoKVxuICAgICAgICBuZXdDdXJzb3JzICAgID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICBmb3IgaSBpbiBAc2VsZWN0ZWRBbmRDdXJzb3JMaW5lSW5kaWNlcygpXG4gICAgICAgICAgICBpZiBAZG8ubGluZShpKS5zdGFydHNXaXRoIEBpbmRlbnRTdHJpbmdcbiAgICAgICAgICAgICAgICBAZG8uY2hhbmdlIGksIEBkby5saW5lKGkpLnN1YnN0ciBAaW5kZW50U3RyaW5nLmxlbmd0aFxuICAgICAgICAgICAgICAgIGxpbmVDdXJzb3JzID0gcG9zaXRpb25zQXRMaW5lSW5kZXhJblBvc2l0aW9ucyBpLCBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgZm9yIG5jIGluIGxpbmVDdXJzb3JzXG4gICAgICAgICAgICAgICAgICAgIGN1cnNvckRlbHRhIG5jLCAtQGluZGVudFN0cmluZy5sZW5ndGhcbiAgICAgICAgICAgICAgICBmb3IgbnMgaW4gcmFuZ2VzQXRMaW5lSW5kZXhJblJhbmdlcyBpLCBuZXdTZWxlY3Rpb25zXG4gICAgICAgICAgICAgICAgICAgIG5zWzFdWzBdIC09IEBpbmRlbnRTdHJpbmcubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIG5zWzFdWzFdIC09IEBpbmRlbnRTdHJpbmcubGVuZ3RoXG4gICAgICAgIEBkby5zZWxlY3QgbmV3U2VsZWN0aW9uc1xuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzXG4gICAgICAgIEBkby5lbmQoKVxuIl19
//# sourceURL=../../../coffee/editor/actions/indent.coffee