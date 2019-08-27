// koffee 1.4.0

/*
 0000000  000000000   0000000   000000000  00000000
000          000     000   000     000     000
0000000      000     000000000     000     0000000
     000     000     000   000     000     000
0000000      000     000   000     000     00000000
 */
var Immutable, State, _, kerror, kstr, ref;

ref = require('kxk'), kerror = ref.kerror, kstr = ref.kstr, _ = ref._;

Immutable = require('seamless-immutable');

State = (function() {
    function State(opt) {
        var lines, ref1, y;
        if ((opt != null) && Immutable.isImmutable(opt)) {
            this.s = opt;
        } else {
            lines = (ref1 = opt != null ? opt.lines : void 0) != null ? ref1 : [];
            y = lines.length === 0 && -1 || 0;
            this.s = Immutable({
                lines: lines.map(function(l) {
                    return {
                        text: l
                    };
                }),
                cursors: [[0, y]],
                selections: [],
                highlights: [],
                main: 0
            });
        }
    }

    State.prototype.text = function(n) {
        var tabLines;
        if (n == null) {
            n = '\n';
        }
        tabLines = this.s.lines.map(function(l) {
            return l.text;
        });
        return tabLines.join(n);
    };

    State.prototype.tabline = function(i) {
        return this.s.lines[i].text;
    };

    State.prototype.line = function(i) {
        if (this.s.lines[i] == null) {
            kerror("editor/state -- requesting invalid line at index " + i + "?");
            return '';
        }
        return kstr.detab(this.s.lines[i].text);
    };

    State.prototype.lines = function() {
        return this.s.lines.map(function(l) {
            return kstr.detab(l.text);
        });
    };

    State.prototype.cursors = function() {
        return this.s.cursors.asMutable({
            deep: true
        });
    };

    State.prototype.highlights = function() {
        return this.s.highlights.asMutable({
            deep: true
        });
    };

    State.prototype.selections = function() {
        return this.s.selections.asMutable({
            deep: true
        });
    };

    State.prototype.main = function() {
        return this.s.main;
    };

    State.prototype.cursor = function(i) {
        var ref1;
        return (ref1 = this.s.cursors[i]) != null ? ref1.asMutable({
            deep: true
        }) : void 0;
    };

    State.prototype.selection = function(i) {
        var ref1;
        return (ref1 = this.s.selections[i]) != null ? ref1.asMutable({
            deep: true
        }) : void 0;
    };

    State.prototype.highlight = function(i) {
        var ref1;
        return (ref1 = this.s.highlights[i]) != null ? ref1.asMutable({
            deep: true
        }) : void 0;
    };

    State.prototype.numLines = function() {
        return this.s.lines.length;
    };

    State.prototype.numCursors = function() {
        return this.s.cursors.length;
    };

    State.prototype.numSelections = function() {
        return this.s.selections.length;
    };

    State.prototype.numHighlights = function() {
        return this.s.highlights.length;
    };

    State.prototype.mainCursor = function() {
        return this.s.cursors[this.s.main].asMutable({
            deep: true
        });
    };

    State.prototype.setSelections = function(s) {
        return new State(this.s.set('selections', s));
    };

    State.prototype.setHighlights = function(h) {
        return new State(this.s.set('highlights', h));
    };

    State.prototype.setCursors = function(c) {
        return new State(this.s.set('cursors', c));
    };

    State.prototype.setMain = function(m) {
        return new State(this.s.set('main', m));
    };

    State.prototype.changeLine = function(i, t) {
        return new State(this.s.setIn(['lines', i], {
            text: t
        }));
    };

    State.prototype.insertLine = function(i, t) {
        var l;
        l = this.s.lines.asMutable();
        l.splice(i, 0, {
            text: t
        });
        return new State(this.s.set('lines', l));
    };

    State.prototype.deleteLine = function(i) {
        var l;
        l = this.s.lines.asMutable();
        l.splice(i, 1);
        return new State(this.s.set('lines', l));
    };

    State.prototype.appendLine = function(t) {
        var l;
        l = this.s.lines.asMutable();
        l.push({
            text: t
        });
        return new State(this.s.set('lines', l));
    };

    State.prototype.addHighlight = function(h) {
        var m;
        m = this.s.highlights.asMutable();
        m.push(h);
        return new State(this.s.set('highlights', m));
    };

    return State;

})();

module.exports = State;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLE1BQXNCLE9BQUEsQ0FBUSxLQUFSLENBQXRCLEVBQUUsbUJBQUYsRUFBVSxlQUFWLEVBQWdCOztBQUVoQixTQUFBLEdBQVksT0FBQSxDQUFRLG9CQUFSOztBQUVOO0lBRVcsZUFBQyxHQUFEO0FBRVQsWUFBQTtRQUFBLElBQUcsYUFBQSxJQUFTLFNBQVMsQ0FBQyxXQUFWLENBQXNCLEdBQXRCLENBQVo7WUFDSSxJQUFDLENBQUEsQ0FBRCxHQUFLLElBRFQ7U0FBQSxNQUFBO1lBR0ksS0FBQSw4REFBcUI7WUFDckIsQ0FBQSxHQUFJLEtBQUssQ0FBQyxNQUFOLEtBQWdCLENBQWhCLElBQXNCLENBQUMsQ0FBdkIsSUFBNEI7WUFDaEMsSUFBQyxDQUFBLENBQUQsR0FBSyxTQUFBLENBQ0Q7Z0JBQUEsS0FBQSxFQUFZLEtBQUssQ0FBQyxHQUFOLENBQVUsU0FBQyxDQUFEOzJCQUFPO3dCQUFBLElBQUEsRUFBSyxDQUFMOztnQkFBUCxDQUFWLENBQVo7Z0JBQ0EsT0FBQSxFQUFZLENBQUMsQ0FBQyxDQUFELEVBQUcsQ0FBSCxDQUFELENBRFo7Z0JBRUEsVUFBQSxFQUFZLEVBRlo7Z0JBR0EsVUFBQSxFQUFZLEVBSFo7Z0JBSUEsSUFBQSxFQUFZLENBSlo7YUFEQyxFQUxUOztJQUZTOztvQkFnQmIsSUFBQSxHQUFNLFNBQUMsQ0FBRDtBQUNGLFlBQUE7O1lBREcsSUFBRTs7UUFDTCxRQUFBLEdBQVcsSUFBQyxDQUFBLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBVCxDQUFhLFNBQUMsQ0FBRDttQkFBTyxDQUFDLENBQUM7UUFBVCxDQUFiO2VBQ1gsUUFBUSxDQUFDLElBQVQsQ0FBYyxDQUFkO0lBRkU7O29CQUlOLE9BQUEsR0FBVyxTQUFDLENBQUQ7ZUFBTyxJQUFDLENBQUEsQ0FBQyxDQUFDLEtBQU0sQ0FB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QTJCLENBQUMsQ0FBQyxJQUFGLENBQU8sQ0FBUDtlQUFrQixJQUFJLEtBQUosQ0FBVSxJQUFDLENBQUEsQ0FBQyxDQUFDLEdBQUgsQ0FBTyxZQUFQLEVBQXFCLENBQXJCLENBQVY7SUFBeEQ7Ozs7OztBQUVsQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4wMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG4jIyNcblxueyBrZXJyb3IsIGtzdHIsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuSW1tdXRhYmxlID0gcmVxdWlyZSAnc2VhbWxlc3MtaW1tdXRhYmxlJ1xuXG5jbGFzcyBTdGF0ZVxuXG4gICAgY29uc3RydWN0b3I6IChvcHQpIC0+XG5cbiAgICAgICAgaWYgb3B0PyBhbmQgSW1tdXRhYmxlLmlzSW1tdXRhYmxlIG9wdFxuICAgICAgICAgICAgQHMgPSBvcHRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbGluZXMgPSBvcHQ/LmxpbmVzID8gW11cbiAgICAgICAgICAgIHkgPSBsaW5lcy5sZW5ndGggPT0gMCBhbmQgLTEgb3IgMFxuICAgICAgICAgICAgQHMgPSBJbW11dGFibGVcbiAgICAgICAgICAgICAgICBsaW5lczogICAgICBsaW5lcy5tYXAgKGwpIC0+IHRleHQ6bFxuICAgICAgICAgICAgICAgIGN1cnNvcnM6ICAgIFtbMCx5XV1cbiAgICAgICAgICAgICAgICBzZWxlY3Rpb25zOiBbXVxuICAgICAgICAgICAgICAgIGhpZ2hsaWdodHM6IFtdXG4gICAgICAgICAgICAgICAgbWFpbjogICAgICAgMFxuXG4gICAgIyByZWFkIG9ubHk6XG5cbiAgICB0ZXh0OiAobj0nXFxuJykgLT5cbiAgICAgICAgdGFiTGluZXMgPSBAcy5saW5lcy5tYXAgKGwpIC0+IGwudGV4dFxuICAgICAgICB0YWJMaW5lcy5qb2luIG5cblxuICAgIHRhYmxpbmU6ICAgKGkpIC0+IEBzLmxpbmVzW2ldLnRleHRcbiAgICBsaW5lOiAgICAgIChpKSAtPlxuICAgICAgICBpZiBub3QgQHMubGluZXNbaV0/XG4gICAgICAgICAgICBrZXJyb3IgXCJlZGl0b3Ivc3RhdGUgLS0gcmVxdWVzdGluZyBpbnZhbGlkIGxpbmUgYXQgaW5kZXggI3tpfT9cIlxuICAgICAgICAgICAgcmV0dXJuICcnXG4gICAgICAgIGtzdHIuZGV0YWIgQHMubGluZXNbaV0udGV4dFxuXG4gICAgbGluZXM6ICAgICAgICAgLT4gQHMubGluZXMubWFwIChsKSAtPiBrc3RyLmRldGFiIGwudGV4dFxuICAgIGN1cnNvcnM6ICAgICAgIC0+IEBzLmN1cnNvcnMuYXNNdXRhYmxlIGRlZXA6IHRydWVcbiAgICBoaWdobGlnaHRzOiAgICAtPiBAcy5oaWdobGlnaHRzLmFzTXV0YWJsZSBkZWVwOiB0cnVlXG4gICAgc2VsZWN0aW9uczogICAgLT4gQHMuc2VsZWN0aW9ucy5hc011dGFibGUgZGVlcDogdHJ1ZVxuICAgIG1haW46ICAgICAgICAgIC0+IEBzLm1haW5cblxuICAgIGN1cnNvcjogICAgKGkpIC0+IEBzLmN1cnNvcnNbaV0/LmFzTXV0YWJsZSBkZWVwOiB0cnVlXG4gICAgc2VsZWN0aW9uOiAoaSkgLT4gQHMuc2VsZWN0aW9uc1tpXT8uYXNNdXRhYmxlIGRlZXA6IHRydWVcbiAgICBoaWdobGlnaHQ6IChpKSAtPiBAcy5oaWdobGlnaHRzW2ldPy5hc011dGFibGUgZGVlcDogdHJ1ZVxuXG4gICAgbnVtTGluZXM6ICAgICAgLT4gQHMubGluZXMubGVuZ3RoXG4gICAgbnVtQ3Vyc29yczogICAgLT4gQHMuY3Vyc29ycy5sZW5ndGhcbiAgICBudW1TZWxlY3Rpb25zOiAtPiBAcy5zZWxlY3Rpb25zLmxlbmd0aFxuICAgIG51bUhpZ2hsaWdodHM6IC0+IEBzLmhpZ2hsaWdodHMubGVuZ3RoXG4gICAgbWFpbkN1cnNvcjogICAgLT4gQHMuY3Vyc29yc1tAcy5tYWluXS5hc011dGFibGUgZGVlcDogdHJ1ZVxuXG4gICAgIyBtb2RpZnk6XG5cbiAgICBzZXRTZWxlY3Rpb25zOiAocykgLT4gbmV3IFN0YXRlIEBzLnNldCAnc2VsZWN0aW9ucycsIHNcbiAgICBzZXRIaWdobGlnaHRzOiAoaCkgLT4gbmV3IFN0YXRlIEBzLnNldCAnaGlnaGxpZ2h0cycsIGhcbiAgICBzZXRDdXJzb3JzOiAgICAoYykgLT4gbmV3IFN0YXRlIEBzLnNldCAnY3Vyc29ycycsICAgIGNcbiAgICBzZXRNYWluOiAgICAgICAobSkgLT4gbmV3IFN0YXRlIEBzLnNldCAnbWFpbicsICAgICAgIG1cblxuICAgIGNoYW5nZUxpbmU6IChpLHQpIC0+IG5ldyBTdGF0ZSBAcy5zZXRJbiBbJ2xpbmVzJywgaV0sIHRleHQ6dFxuICAgIGluc2VydExpbmU6IChpLHQpIC0+IGwgPSBAcy5saW5lcy5hc011dGFibGUoKTsgbC5zcGxpY2UgaSwgMCwgdGV4dDp0OyBuZXcgU3RhdGUgQHMuc2V0ICdsaW5lcycsIGxcbiAgICBkZWxldGVMaW5lOiAoaSkgICAtPiBsID0gQHMubGluZXMuYXNNdXRhYmxlKCk7IGwuc3BsaWNlIGksIDE7ICAgICAgICAgbmV3IFN0YXRlIEBzLnNldCAnbGluZXMnLCBsXG4gICAgYXBwZW5kTGluZTogICAodCkgLT4gbCA9IEBzLmxpbmVzLmFzTXV0YWJsZSgpOyBsLnB1c2ggdGV4dDp0OyAgICAgICAgIG5ldyBTdGF0ZSBAcy5zZXQgJ2xpbmVzJywgbFxuICAgIGFkZEhpZ2hsaWdodDogKGgpIC0+IG0gPSBAcy5oaWdobGlnaHRzLmFzTXV0YWJsZSgpOyBtLnB1c2ggaDsgICAgICAgICBuZXcgU3RhdGUgQHMuc2V0ICdoaWdobGlnaHRzJywgbVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXRlXG4iXX0=
//# sourceURL=../../coffee/editor/state.coffee