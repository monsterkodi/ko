// koffee 1.3.0
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHVwbGljYXRlbGluZXMuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFPQSxNQUFNLENBQUMsT0FBUCxHQUVJO0lBQUEsT0FBQSxFQUNJO1FBQUEsSUFBQSxFQUFNLE1BQU47UUFFQSxnQkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFNLG9CQUFOO1lBQ0EsS0FBQSxFQUFPLGNBRFA7U0FISjtRQU1BLGtCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU0sc0JBQU47WUFDQSxLQUFBLEVBQU8sZ0JBRFA7U0FQSjtLQURKO0lBV0EsZ0JBQUEsRUFBb0IsU0FBQTtlQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLElBQWhCO0lBQUgsQ0FYcEI7SUFZQSxrQkFBQSxFQUFvQixTQUFBO2VBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEI7SUFBSCxDQVpwQjtJQWNBLGNBQUEsRUFBZ0IsU0FBQyxHQUFEO0FBRVosWUFBQTtRQUFBLEdBQUEsR0FBTSxJQUFDLENBQUEsMENBQUQsQ0FBQTtRQUVOLElBQVUsQ0FBSSxHQUFHLENBQUMsTUFBbEI7QUFBQSxtQkFBQTs7UUFFQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsS0FBSixDQUFBO1FBRUEsSUFBRyxJQUFDLENBQUEsYUFBRCxDQUFBLENBQUg7WUFDSSxJQUFDLENBQUEsNkJBQUQsQ0FBK0IsTUFBL0IsRUFESjs7UUFHQSxVQUFBLEdBQWEsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE9BQUosQ0FBQTtBQUViO0FBQUEsYUFBQSxxQ0FBQTs7WUFDSSxFQUFBLEdBQUs7QUFDTCxpQkFBVSxzR0FBVjtnQkFDSSxFQUFFLENBQUMsSUFBSCxDQUFRLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsRUFBVCxDQUFSO0FBREo7QUFHQSxpQkFBUyx1RkFBVDtnQkFDSSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsTUFBSixDQUFXLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBSyxDQUFMLEdBQU8sQ0FBbEIsRUFBcUIsRUFBRyxDQUFBLENBQUEsQ0FBeEI7QUFESjtBQUdBO0FBQUEsaUJBQUEsd0NBQUE7O2dCQUNJLFdBQUEsQ0FBWSxFQUFaLEVBQWdCLENBQWhCLEVBQW1CLEVBQUUsQ0FBQyxNQUF0QjtBQURKO1lBR0EsSUFBRyxHQUFBLEtBQU8sTUFBVjtBQUNJLHFCQUFTLHVGQUFUO0FBQ0k7QUFBQSx5QkFBQSx3Q0FBQTs7d0JBQ0ksV0FBQSxDQUFZLEVBQVosRUFBZ0IsQ0FBaEIsRUFBbUIsRUFBRSxDQUFDLE1BQXRCO0FBREo7QUFESixpQkFESjs7QUFYSjtRQWdCQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsTUFBSixDQUFXLEVBQVg7UUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsVUFBSixDQUFlLFVBQWY7ZUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsR0FBSixDQUFBO0lBL0JZLENBZGhCIiwic291cmNlc0NvbnRlbnQiOlsiXG4jIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG5cbm1vZHVsZS5leHBvcnRzID0gXG4gICAgXG4gICAgYWN0aW9uczpcbiAgICAgICAgbWVudTogJ0xpbmUnXG4gICAgICAgIFxuICAgICAgICBkdXBsaWNhdGVMaW5lc1VwOlxuICAgICAgICAgICAgbmFtZTogJ0R1cGxpY2F0ZSBMaW5lcyBVcCdcbiAgICAgICAgICAgIGNvbWJvOiAnYWx0K3NoaWZ0K3VwJ1xuICAgICAgICAgICAgXG4gICAgICAgIGR1cGxpY2F0ZUxpbmVzRG93bjpcbiAgICAgICAgICAgIG5hbWU6ICdEdXBsaWNhdGUgTGluZXMgRG93bidcbiAgICAgICAgICAgIGNvbWJvOiAnYWx0K3NoaWZ0K2Rvd24nXG5cbiAgICBkdXBsaWNhdGVMaW5lc1VwOiAgIC0+IEBkdXBsaWNhdGVMaW5lcyAndXAnXG4gICAgZHVwbGljYXRlTGluZXNEb3duOiAtPiBAZHVwbGljYXRlTGluZXMgJ2Rvd24nXG4gICAgICAgICAgICBcbiAgICBkdXBsaWNhdGVMaW5lczogKGRpcikgLT5cbiAgICAgICAgXG4gICAgICAgIGNzciA9IEBjb250aW51b3VzQ3Vyc29yQW5kU2VsZWN0ZWRMaW5lSW5kZXhSYW5nZXMoKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBjc3IubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBcbiAgICAgICAgaWYgQG51bVNlbGVjdGlvbnMoKVxuICAgICAgICAgICAgQHNldEN1cnNvcnNBdFNlbGVjdGlvbkJvdW5kYXJ5ICdsZWZ0J1xuICAgICAgICAgICAgXG4gICAgICAgIG5ld0N1cnNvcnMgPSBAZG8uY3Vyc29ycygpXG5cbiAgICAgICAgZm9yIHIgaW4gY3NyLnJldmVyc2UoKVxuICAgICAgICAgICAgbHMgPSBbXVxuICAgICAgICAgICAgZm9yIGxpIGluIFtyWzBdLi5yWzFdXVxuICAgICAgICAgICAgICAgIGxzLnB1c2ggQGRvLmxpbmUobGkpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBpIGluIFswLi4ubHMubGVuZ3RoXVxuICAgICAgICAgICAgICAgIEBkby5pbnNlcnQgclsxXSsxK2ksIGxzW2ldXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgbmMgaW4gcG9zaXRpb25zQmVsb3dMaW5lSW5kZXhJblBvc2l0aW9ucyByWzFdKzEsIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICBjdXJzb3JEZWx0YSBuYywgMCwgbHMubGVuZ3RoICMgbW92ZSBjdXJzb3JzIGJlbG93IGluc2VydGVkIGxpbmVzIGRvd25cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGRpciA9PSAnZG93bidcbiAgICAgICAgICAgICAgICBmb3IgaSBpbiBbMC4uLmxzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICAgICAgZm9yIG5jIGluIHBvc2l0aW9uc0F0TGluZUluZGV4SW5Qb3NpdGlvbnMgclswXStpLCBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3JEZWx0YSBuYywgMCwgbHMubGVuZ3RoICMgbW92ZSBjdXJzb3JzIGluIGluc2VydGVkIGxpbmVzIGRvd25cblxuICAgICAgICBAZG8uc2VsZWN0IFtdXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnNcbiAgICAgICAgQGRvLmVuZCgpICAgICAgIFxuIl19
//# sourceURL=../../../coffee/editor/actions/duplicatelines.coffee