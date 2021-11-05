// koffee 1.16.0
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHVwbGljYXRlbGluZXMuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4vY29mZmVlL2VkaXRvci9hY3Rpb25zIiwic291cmNlcyI6WyJkdXBsaWNhdGVsaW5lcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQU9BLE1BQU0sQ0FBQyxPQUFQLEdBRUk7SUFBQSxPQUFBLEVBQ0k7UUFBQSxJQUFBLEVBQU0sTUFBTjtRQUVBLGdCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU0sb0JBQU47WUFDQSxLQUFBLEVBQU8sY0FEUDtTQUhKO1FBTUEsa0JBQUEsRUFDSTtZQUFBLElBQUEsRUFBTSxzQkFBTjtZQUNBLEtBQUEsRUFBTyxnQkFEUDtTQVBKO0tBREo7SUFXQSxnQkFBQSxFQUFvQixTQUFBO2VBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsSUFBaEI7SUFBSCxDQVhwQjtJQVlBLGtCQUFBLEVBQW9CLFNBQUE7ZUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQjtJQUFILENBWnBCO0lBY0EsY0FBQSxFQUFnQixTQUFDLEdBQUQ7QUFFWixZQUFBO1FBQUEsR0FBQSxHQUFNLElBQUMsQ0FBQSwwQ0FBRCxDQUFBO1FBRU4sSUFBVSxDQUFJLEdBQUcsQ0FBQyxNQUFsQjtBQUFBLG1CQUFBOztRQUVBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxLQUFKLENBQUE7UUFFQSxJQUFHLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBSDtZQUNJLElBQUMsQ0FBQSw2QkFBRCxDQUErQixNQUEvQixFQURKOztRQUdBLFVBQUEsR0FBYSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsT0FBSixDQUFBO0FBRWI7QUFBQSxhQUFBLHFDQUFBOztZQUNJLEVBQUEsR0FBSztBQUNMLGlCQUFVLHNHQUFWO2dCQUNJLEVBQUUsQ0FBQyxJQUFILENBQVEsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLElBQUosQ0FBUyxFQUFULENBQVI7QUFESjtBQUdBLGlCQUFTLHVGQUFUO2dCQUNJLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxNQUFKLENBQVcsQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFLLENBQUwsR0FBTyxDQUFsQixFQUFxQixFQUFHLENBQUEsQ0FBQSxDQUF4QjtBQURKO0FBR0E7QUFBQSxpQkFBQSx3Q0FBQTs7Z0JBQ0ksV0FBQSxDQUFZLEVBQVosRUFBZ0IsQ0FBaEIsRUFBbUIsRUFBRSxDQUFDLE1BQXRCO0FBREo7WUFHQSxJQUFHLEdBQUEsS0FBTyxNQUFWO0FBQ0kscUJBQVMsdUZBQVQ7QUFDSTtBQUFBLHlCQUFBLHdDQUFBOzt3QkFDSSxXQUFBLENBQVksRUFBWixFQUFnQixDQUFoQixFQUFtQixFQUFFLENBQUMsTUFBdEI7QUFESjtBQURKLGlCQURKOztBQVhKO1FBZ0JBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxNQUFKLENBQVcsRUFBWDtRQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxVQUFKLENBQWUsVUFBZjtlQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7SUEvQlksQ0FkaEIiLCJzb3VyY2VzQ29udGVudCI6WyJcbiMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcblxubW9kdWxlLmV4cG9ydHMgPSBcbiAgICBcbiAgICBhY3Rpb25zOlxuICAgICAgICBtZW51OiAnTGluZSdcbiAgICAgICAgXG4gICAgICAgIGR1cGxpY2F0ZUxpbmVzVXA6XG4gICAgICAgICAgICBuYW1lOiAnRHVwbGljYXRlIExpbmVzIFVwJ1xuICAgICAgICAgICAgY29tYm86ICdhbHQrc2hpZnQrdXAnXG4gICAgICAgICAgICBcbiAgICAgICAgZHVwbGljYXRlTGluZXNEb3duOlxuICAgICAgICAgICAgbmFtZTogJ0R1cGxpY2F0ZSBMaW5lcyBEb3duJ1xuICAgICAgICAgICAgY29tYm86ICdhbHQrc2hpZnQrZG93bidcblxuICAgIGR1cGxpY2F0ZUxpbmVzVXA6ICAgLT4gQGR1cGxpY2F0ZUxpbmVzICd1cCdcbiAgICBkdXBsaWNhdGVMaW5lc0Rvd246IC0+IEBkdXBsaWNhdGVMaW5lcyAnZG93bidcbiAgICAgICAgICAgIFxuICAgIGR1cGxpY2F0ZUxpbmVzOiAoZGlyKSAtPlxuICAgICAgICBcbiAgICAgICAgY3NyID0gQGNvbnRpbnVvdXNDdXJzb3JBbmRTZWxlY3RlZExpbmVJbmRleFJhbmdlcygpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IGNzci5sZW5ndGhcbiAgICAgICAgXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIFxuICAgICAgICBpZiBAbnVtU2VsZWN0aW9ucygpXG4gICAgICAgICAgICBAc2V0Q3Vyc29yc0F0U2VsZWN0aW9uQm91bmRhcnkgJ2xlZnQnXG4gICAgICAgICAgICBcbiAgICAgICAgbmV3Q3Vyc29ycyA9IEBkby5jdXJzb3JzKClcblxuICAgICAgICBmb3IgciBpbiBjc3IucmV2ZXJzZSgpXG4gICAgICAgICAgICBscyA9IFtdXG4gICAgICAgICAgICBmb3IgbGkgaW4gW3JbMF0uLnJbMV1dXG4gICAgICAgICAgICAgICAgbHMucHVzaCBAZG8ubGluZShsaSlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGkgaW4gWzAuLi5scy5sZW5ndGhdXG4gICAgICAgICAgICAgICAgQGRvLmluc2VydCByWzFdKzEraSwgbHNbaV1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBuYyBpbiBwb3NpdGlvbnNCZWxvd0xpbmVJbmRleEluUG9zaXRpb25zIHJbMV0rMSwgbmV3Q3Vyc29yc1xuICAgICAgICAgICAgICAgIGN1cnNvckRlbHRhIG5jLCAwLCBscy5sZW5ndGggIyBtb3ZlIGN1cnNvcnMgYmVsb3cgaW5zZXJ0ZWQgbGluZXMgZG93blxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgZGlyID09ICdkb3duJ1xuICAgICAgICAgICAgICAgIGZvciBpIGluIFswLi4ubHMubGVuZ3RoXVxuICAgICAgICAgICAgICAgICAgICBmb3IgbmMgaW4gcG9zaXRpb25zQXRMaW5lSW5kZXhJblBvc2l0aW9ucyByWzBdK2ksIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvckRlbHRhIG5jLCAwLCBscy5sZW5ndGggIyBtb3ZlIGN1cnNvcnMgaW4gaW5zZXJ0ZWQgbGluZXMgZG93blxuXG4gICAgICAgIEBkby5zZWxlY3QgW11cbiAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29yc1xuICAgICAgICBAZG8uZW5kKCkgICAgICAgXG4iXX0=
//# sourceURL=../../../coffee/editor/actions/duplicatelines.coffee