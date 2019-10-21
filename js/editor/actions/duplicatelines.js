// koffee 1.4.0
module.exports = {
    actions: {
        menu: 'Line',
        duplicateLinesUp: {
            name: 'Duplicate Lines Up',
            combo: 'alt+shift+up'
        },
        duplicateLinesDown: {
            name: 'Duplicate Lines Down',
            combo: 'alt+shift+down'
        }
    },
    duplicateLinesUp: function() {
        return this.duplicateLines('up');
    },
    duplicateLinesDown: function() {
        return this.duplicateLines('down');
    },
    duplicateLines: function(dir) {
        var csr, i, j, k, l, len, len1, len2, li, ls, m, n, nc, newCursors, o, r, ref, ref1, ref2, ref3, ref4, ref5, ref6;
        csr = this.continuousCursorAndSelectedLineIndexRanges();
        if (!csr.length) {
            return;
        }
        this["do"].start();
        if (this.numSelections()) {
            this.setCursorsAtSelectionBoundary('left');
        }
        newCursors = this["do"].cursors();
        ref = csr.reverse();
        for (j = 0, len = ref.length; j < len; j++) {
            r = ref[j];
            ls = [];
            for (li = k = ref1 = r[0], ref2 = r[1]; ref1 <= ref2 ? k <= ref2 : k >= ref2; li = ref1 <= ref2 ? ++k : --k) {
                ls.push(this["do"].line(li));
            }
            for (i = l = 0, ref3 = ls.length; 0 <= ref3 ? l < ref3 : l > ref3; i = 0 <= ref3 ? ++l : --l) {
                this["do"].insert(r[1] + 1 + i, ls[i]);
            }
            ref4 = positionsBelowLineIndexInPositions(r[1] + 1, newCursors);
            for (m = 0, len1 = ref4.length; m < len1; m++) {
                nc = ref4[m];
                cursorDelta(nc, 0, ls.length);
            }
            if (dir === 'down') {
                for (i = n = 0, ref5 = ls.length; 0 <= ref5 ? n < ref5 : n > ref5; i = 0 <= ref5 ? ++n : --n) {
                    ref6 = positionsAtLineIndexInPositions(r[0] + i, newCursors);
                    for (o = 0, len2 = ref6.length; o < len2; o++) {
                        nc = ref6[o];
                        cursorDelta(nc, 0, ls.length);
                    }
                }
            }
        }
        this["do"].select([]);
        this["do"].setCursors(newCursors);
        return this["do"].end();
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHVwbGljYXRlbGluZXMuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFPQSxNQUFNLENBQUMsT0FBUCxHQUVJO0lBQUEsT0FBQSxFQUNJO1FBQUEsSUFBQSxFQUFNLE1BQU47UUFFQSxnQkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFNLG9CQUFOO1lBQ0EsS0FBQSxFQUFPLGNBRFA7U0FISjtRQU1BLGtCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU0sc0JBQU47WUFDQSxLQUFBLEVBQU8sZ0JBRFA7U0FQSjtLQURKO0lBV0EsZ0JBQUEsRUFBb0IsU0FBQTtlQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLElBQWhCO0lBQUgsQ0FYcEI7SUFZQSxrQkFBQSxFQUFvQixTQUFBO2VBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEI7SUFBSCxDQVpwQjtJQWNBLGNBQUEsRUFBZ0IsU0FBQyxHQUFEO0FBRVosWUFBQTtRQUFBLEdBQUEsR0FBTSxJQUFDLENBQUEsMENBQUQsQ0FBQTtRQUVOLElBQVUsQ0FBSSxHQUFHLENBQUMsTUFBbEI7QUFBQSxtQkFBQTs7UUFFQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsS0FBSixDQUFBO1FBRUEsSUFBRyxJQUFDLENBQUEsYUFBRCxDQUFBLENBQUg7WUFDSSxJQUFDLENBQUEsNkJBQUQsQ0FBK0IsTUFBL0IsRUFESjs7UUFHQSxVQUFBLEdBQWEsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE9BQUosQ0FBQTtBQUViO0FBQUEsYUFBQSxxQ0FBQTs7WUFDSSxFQUFBLEdBQUs7QUFDTCxpQkFBVSxzR0FBVjtnQkFDSSxFQUFFLENBQUMsSUFBSCxDQUFRLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsRUFBVCxDQUFSO0FBREo7QUFHQSxpQkFBUyx1RkFBVDtnQkFDSSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsTUFBSixDQUFXLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBSyxDQUFMLEdBQU8sQ0FBbEIsRUFBcUIsRUFBRyxDQUFBLENBQUEsQ0FBeEI7QUFESjtBQUdBO0FBQUEsaUJBQUEsd0NBQUE7O2dCQUNJLFdBQUEsQ0FBWSxFQUFaLEVBQWdCLENBQWhCLEVBQW1CLEVBQUUsQ0FBQyxNQUF0QjtBQURKO1lBR0EsSUFBRyxHQUFBLEtBQU8sTUFBVjtBQUNJLHFCQUFTLHVGQUFUO0FBQ0k7QUFBQSx5QkFBQSx3Q0FBQTs7d0JBQ0ksV0FBQSxDQUFZLEVBQVosRUFBZ0IsQ0FBaEIsRUFBbUIsRUFBRSxDQUFDLE1BQXRCO0FBREo7QUFESixpQkFESjs7QUFYSjtRQWdCQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsTUFBSixDQUFXLEVBQVg7UUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsVUFBSixDQUFlLFVBQWY7ZUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsR0FBSixDQUFBO0lBL0JZLENBZGhCIiwic291cmNlc0NvbnRlbnQiOlsiXHJcbiMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcclxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxyXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXHJcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcclxuIyAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBcclxuICAgIFxyXG4gICAgYWN0aW9uczpcclxuICAgICAgICBtZW51OiAnTGluZSdcclxuICAgICAgICBcclxuICAgICAgICBkdXBsaWNhdGVMaW5lc1VwOlxyXG4gICAgICAgICAgICBuYW1lOiAnRHVwbGljYXRlIExpbmVzIFVwJ1xyXG4gICAgICAgICAgICBjb21ibzogJ2FsdCtzaGlmdCt1cCdcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgZHVwbGljYXRlTGluZXNEb3duOlxyXG4gICAgICAgICAgICBuYW1lOiAnRHVwbGljYXRlIExpbmVzIERvd24nXHJcbiAgICAgICAgICAgIGNvbWJvOiAnYWx0K3NoaWZ0K2Rvd24nXHJcblxyXG4gICAgZHVwbGljYXRlTGluZXNVcDogICAtPiBAZHVwbGljYXRlTGluZXMgJ3VwJ1xyXG4gICAgZHVwbGljYXRlTGluZXNEb3duOiAtPiBAZHVwbGljYXRlTGluZXMgJ2Rvd24nXHJcbiAgICAgICAgICAgIFxyXG4gICAgZHVwbGljYXRlTGluZXM6IChkaXIpIC0+XHJcbiAgICAgICAgXHJcbiAgICAgICAgY3NyID0gQGNvbnRpbnVvdXNDdXJzb3JBbmRTZWxlY3RlZExpbmVJbmRleFJhbmdlcygpXHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBjc3IubGVuZ3RoXHJcbiAgICAgICAgXHJcbiAgICAgICAgQGRvLnN0YXJ0KClcclxuICAgICAgICBcclxuICAgICAgICBpZiBAbnVtU2VsZWN0aW9ucygpXHJcbiAgICAgICAgICAgIEBzZXRDdXJzb3JzQXRTZWxlY3Rpb25Cb3VuZGFyeSAnbGVmdCdcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgbmV3Q3Vyc29ycyA9IEBkby5jdXJzb3JzKClcclxuXHJcbiAgICAgICAgZm9yIHIgaW4gY3NyLnJldmVyc2UoKVxyXG4gICAgICAgICAgICBscyA9IFtdXHJcbiAgICAgICAgICAgIGZvciBsaSBpbiBbclswXS4uclsxXV1cclxuICAgICAgICAgICAgICAgIGxzLnB1c2ggQGRvLmxpbmUobGkpXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBmb3IgaSBpbiBbMC4uLmxzLmxlbmd0aF1cclxuICAgICAgICAgICAgICAgIEBkby5pbnNlcnQgclsxXSsxK2ksIGxzW2ldXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgZm9yIG5jIGluIHBvc2l0aW9uc0JlbG93TGluZUluZGV4SW5Qb3NpdGlvbnMgclsxXSsxLCBuZXdDdXJzb3JzXHJcbiAgICAgICAgICAgICAgICBjdXJzb3JEZWx0YSBuYywgMCwgbHMubGVuZ3RoICMgbW92ZSBjdXJzb3JzIGJlbG93IGluc2VydGVkIGxpbmVzIGRvd25cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiBkaXIgPT0gJ2Rvd24nXHJcbiAgICAgICAgICAgICAgICBmb3IgaSBpbiBbMC4uLmxzLmxlbmd0aF1cclxuICAgICAgICAgICAgICAgICAgICBmb3IgbmMgaW4gcG9zaXRpb25zQXRMaW5lSW5kZXhJblBvc2l0aW9ucyByWzBdK2ksIG5ld0N1cnNvcnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yRGVsdGEgbmMsIDAsIGxzLmxlbmd0aCAjIG1vdmUgY3Vyc29ycyBpbiBpbnNlcnRlZCBsaW5lcyBkb3duXHJcblxyXG4gICAgICAgIEBkby5zZWxlY3QgW11cclxuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzXHJcbiAgICAgICAgQGRvLmVuZCgpICAgICAgIFxyXG4iXX0=
//# sourceURL=../../../coffee/editor/actions/duplicatelines.coffee