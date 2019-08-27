// koffee 1.4.0
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZW50LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBT0EsTUFBTSxDQUFDLE9BQVAsR0FFSTtJQUFBLE9BQUEsRUFDSTtRQUFBLElBQUEsRUFBTSxNQUFOO1FBRUEsTUFBQSxFQUNJO1lBQUEsSUFBQSxFQUFPLFFBQVA7WUFDQSxLQUFBLEVBQU8sV0FEUDtZQUVBLEtBQUEsRUFBTyxRQUZQO1NBSEo7UUFPQSxRQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU8sU0FBUDtZQUNBLEtBQUEsRUFBTyxXQURQO1lBRUEsS0FBQSxFQUFPLFFBRlA7U0FSSjtLQURKO0lBYUEsTUFBQSxFQUFRLFNBQUE7QUFDSixZQUFBO1FBQUEsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEtBQUosQ0FBQTtRQUNBLGFBQUEsR0FBZ0IsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFVBQUosQ0FBQTtRQUNoQixVQUFBLEdBQWdCLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxPQUFKLENBQUE7QUFDaEI7QUFBQSxhQUFBLHFDQUFBOztZQUNJLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxNQUFKLENBQVcsQ0FBWCxFQUFjLElBQUMsQ0FBQSxZQUFELEdBQWdCLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsQ0FBVCxDQUE5QjtBQUNBO0FBQUEsaUJBQUEsd0NBQUE7O2dCQUNJLFdBQUEsQ0FBWSxFQUFaLEVBQWdCLElBQUMsQ0FBQSxZQUFZLENBQUMsTUFBOUI7QUFESjtBQUVBO0FBQUEsaUJBQUEsd0NBQUE7O2dCQUNJLEVBQUcsQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLENBQU4sSUFBWSxJQUFDLENBQUEsWUFBWSxDQUFDO2dCQUMxQixFQUFHLENBQUEsQ0FBQSxDQUFHLENBQUEsQ0FBQSxDQUFOLElBQVksSUFBQyxDQUFBLFlBQVksQ0FBQztBQUY5QjtBQUpKO1FBT0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE1BQUosQ0FBVyxhQUFYO1FBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFVBQUosQ0FBZSxVQUFmO2VBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEdBQUosQ0FBQTtJQWJJLENBYlI7SUE0QkEsUUFBQSxFQUFVLFNBQUE7QUFDTixZQUFBO1FBQUEsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEtBQUosQ0FBQTtRQUNBLGFBQUEsR0FBZ0IsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFVBQUosQ0FBQTtRQUNoQixVQUFBLEdBQWdCLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxPQUFKLENBQUE7QUFDaEI7QUFBQSxhQUFBLHFDQUFBOztZQUNJLElBQUcsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLElBQUosQ0FBUyxDQUFULENBQVcsQ0FBQyxVQUFaLENBQXVCLElBQUMsQ0FBQSxZQUF4QixDQUFIO2dCQUNJLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxNQUFKLENBQVcsQ0FBWCxFQUFjLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsQ0FBVCxDQUFXLENBQUMsTUFBWixDQUFtQixJQUFDLENBQUEsWUFBWSxDQUFDLE1BQWpDLENBQWQ7Z0JBQ0EsV0FBQSxHQUFjLCtCQUFBLENBQWdDLENBQWhDLEVBQW1DLFVBQW5DO0FBQ2QscUJBQUEsK0NBQUE7O29CQUNJLFdBQUEsQ0FBWSxFQUFaLEVBQWdCLENBQUMsSUFBQyxDQUFBLFlBQVksQ0FBQyxNQUEvQjtBQURKO0FBRUE7QUFBQSxxQkFBQSx3Q0FBQTs7b0JBQ0ksRUFBRyxDQUFBLENBQUEsQ0FBRyxDQUFBLENBQUEsQ0FBTixJQUFZLElBQUMsQ0FBQSxZQUFZLENBQUM7b0JBQzFCLEVBQUcsQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLENBQU4sSUFBWSxJQUFDLENBQUEsWUFBWSxDQUFDO0FBRjlCLGlCQUxKOztBQURKO1FBU0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE1BQUosQ0FBVyxhQUFYO1FBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFVBQUosQ0FBZSxVQUFmO2VBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEdBQUosQ0FBQTtJQWZNLENBNUJWIiwic291cmNlc0NvbnRlbnQiOlsiXHJcbiMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXHJcbiMgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgXHJcbiMgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgXHJcbiMgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgXHJcbiMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9XHJcbiAgICAgIFxyXG4gICAgYWN0aW9uczogXHJcbiAgICAgICAgbWVudTogJ0xpbmUnXHJcbiAgICAgICAgXHJcbiAgICAgICAgaW5kZW50OlxyXG4gICAgICAgICAgICBuYW1lOiAgJ0luZGVudCdcclxuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK10nXHJcbiAgICAgICAgICAgIGFjY2VsOiAnY3RybCtdJ1xyXG4gICAgICAgICAgICBcclxuICAgICAgICBkZUluZGVudDpcclxuICAgICAgICAgICAgbmFtZTogICdPdXRkZW50J1xyXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrWydcclxuICAgICAgICAgICAgYWNjZWw6ICdjdHJsK1snXHJcbiAgICAgICAgICAgIFxyXG4gICAgaW5kZW50OiAtPlxyXG4gICAgICAgIEBkby5zdGFydCgpXHJcbiAgICAgICAgbmV3U2VsZWN0aW9ucyA9IEBkby5zZWxlY3Rpb25zKClcclxuICAgICAgICBuZXdDdXJzb3JzICAgID0gQGRvLmN1cnNvcnMoKVxyXG4gICAgICAgIGZvciBpIGluIEBzZWxlY3RlZEFuZEN1cnNvckxpbmVJbmRpY2VzKClcclxuICAgICAgICAgICAgQGRvLmNoYW5nZSBpLCBAaW5kZW50U3RyaW5nICsgQGRvLmxpbmUoaSlcclxuICAgICAgICAgICAgZm9yIG5jIGluIHBvc2l0aW9uc0F0TGluZUluZGV4SW5Qb3NpdGlvbnMgaSwgbmV3Q3Vyc29yc1xyXG4gICAgICAgICAgICAgICAgY3Vyc29yRGVsdGEgbmMsIEBpbmRlbnRTdHJpbmcubGVuZ3RoXHJcbiAgICAgICAgICAgIGZvciBucyBpbiByYW5nZXNBdExpbmVJbmRleEluUmFuZ2VzIGksIG5ld1NlbGVjdGlvbnNcclxuICAgICAgICAgICAgICAgIG5zWzFdWzBdICs9IEBpbmRlbnRTdHJpbmcubGVuZ3RoXHJcbiAgICAgICAgICAgICAgICBuc1sxXVsxXSArPSBAaW5kZW50U3RyaW5nLmxlbmd0aFxyXG4gICAgICAgIEBkby5zZWxlY3QgbmV3U2VsZWN0aW9uc1xyXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnNcclxuICAgICAgICBAZG8uZW5kKClcclxuXHJcbiAgICBkZUluZGVudDogLT4gXHJcbiAgICAgICAgQGRvLnN0YXJ0KClcclxuICAgICAgICBuZXdTZWxlY3Rpb25zID0gQGRvLnNlbGVjdGlvbnMoKVxyXG4gICAgICAgIG5ld0N1cnNvcnMgICAgPSBAZG8uY3Vyc29ycygpXHJcbiAgICAgICAgZm9yIGkgaW4gQHNlbGVjdGVkQW5kQ3Vyc29yTGluZUluZGljZXMoKVxyXG4gICAgICAgICAgICBpZiBAZG8ubGluZShpKS5zdGFydHNXaXRoIEBpbmRlbnRTdHJpbmdcclxuICAgICAgICAgICAgICAgIEBkby5jaGFuZ2UgaSwgQGRvLmxpbmUoaSkuc3Vic3RyIEBpbmRlbnRTdHJpbmcubGVuZ3RoXHJcbiAgICAgICAgICAgICAgICBsaW5lQ3Vyc29ycyA9IHBvc2l0aW9uc0F0TGluZUluZGV4SW5Qb3NpdGlvbnMgaSwgbmV3Q3Vyc29yc1xyXG4gICAgICAgICAgICAgICAgZm9yIG5jIGluIGxpbmVDdXJzb3JzXHJcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yRGVsdGEgbmMsIC1AaW5kZW50U3RyaW5nLmxlbmd0aFxyXG4gICAgICAgICAgICAgICAgZm9yIG5zIGluIHJhbmdlc0F0TGluZUluZGV4SW5SYW5nZXMgaSwgbmV3U2VsZWN0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgIG5zWzFdWzBdIC09IEBpbmRlbnRTdHJpbmcubGVuZ3RoXHJcbiAgICAgICAgICAgICAgICAgICAgbnNbMV1bMV0gLT0gQGluZGVudFN0cmluZy5sZW5ndGhcclxuICAgICAgICBAZG8uc2VsZWN0IG5ld1NlbGVjdGlvbnNcclxuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzXHJcbiAgICAgICAgQGRvLmVuZCgpXHJcbiJdfQ==
//# sourceURL=../../../coffee/editor/actions/indent.coffee