// koffee 1.12.0

/*
 0000000  000000000   0000000   000000000  00000000
000          000     000   000     000     000
0000000      000     000000000     000     0000000
     000     000     000   000     000     000
0000000      000     000   000     000     00000000
 */
var Immutable, State, kerror, kstr, ref;

ref = require('kxk'), kerror = ref.kerror, kstr = ref.kstr;

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
                lines: lines,
                cursors: [[0, y]],
                selections: [],
                highlights: [],
                main: 0
            });
        }
    }

    State.prototype.text = function(n) {
        if (n == null) {
            n = '\n';
        }
        return this.s.lines.join(n);
    };

    State.prototype.tabline = function(i) {
        return this.s.lines[i];
    };

    State.prototype.line = function(i) {
        if (this.s.lines[i] == null) {
            kerror("editor/state -- requesting invalid line at index " + i + "?");
            return '';
        }
        return kstr.detab(this.s.lines[i]);
    };

    State.prototype.lines = function() {
        return this.s.lines.map(function(l) {
            return kstr.detab(l);
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
        return new State(this.s.setIn(['lines', i], t));
    };

    State.prototype.insertLine = function(i, t) {
        var l;
        l = this.s.lines.asMutable();
        l.splice(i, 0, t);
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
        l.push(t);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2VkaXRvciIsInNvdXJjZXMiOlsic3RhdGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLE1BQW1CLE9BQUEsQ0FBUSxLQUFSLENBQW5CLEVBQUUsbUJBQUYsRUFBVTs7QUFFVixTQUFBLEdBQVksT0FBQSxDQUFRLG9CQUFSOztBQUVOO0lBRUMsZUFBQyxHQUFEO0FBRUMsWUFBQTtRQUFBLElBQUcsYUFBQSxJQUFTLFNBQVMsQ0FBQyxXQUFWLENBQXNCLEdBQXRCLENBQVo7WUFDSSxJQUFDLENBQUEsQ0FBRCxHQUFLLElBRFQ7U0FBQSxNQUFBO1lBR0ksS0FBQSw4REFBcUI7WUFDckIsQ0FBQSxHQUFJLEtBQUssQ0FBQyxNQUFOLEtBQWdCLENBQWhCLElBQXNCLENBQUMsQ0FBdkIsSUFBNEI7WUFDaEMsSUFBQyxDQUFBLENBQUQsR0FBSyxTQUFBLENBQ0Q7Z0JBQUEsS0FBQSxFQUFZLEtBQVo7Z0JBQ0EsT0FBQSxFQUFZLENBQUMsQ0FBQyxDQUFELEVBQUcsQ0FBSCxDQUFELENBRFo7Z0JBRUEsVUFBQSxFQUFZLEVBRlo7Z0JBR0EsVUFBQSxFQUFZLEVBSFo7Z0JBSUEsSUFBQSxFQUFZLENBSlo7YUFEQyxFQUxUOztJQUZEOztvQkFnQkgsSUFBQSxHQUFNLFNBQUMsQ0FBRDs7WUFBQyxJQUFFOztlQUFTLElBQUMsQ0FBQSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQVQsQ0FBYyxDQUFkO0lBQVo7O29CQUNOLE9BQUEsR0FBVyxTQUFDLENBQUQ7ZUFBTyxJQUFDLENBQUEsQ0FBQyxDQUFDLEtBQU0sQ0FBQSxDQUFBO0lBQWhCOztvQkFDWCxJQUFBLEdBQVcsU0FBQyxDQUFEO1FBQ1AsSUFBTyx1QkFBUDtZQUNJLE1BQUEsQ0FBTyxtREFBQSxHQUFvRCxDQUFwRCxHQUFzRCxHQUE3RDtBQUNBLG1CQUFPLEdBRlg7O2VBR0EsSUFBSSxDQUFD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SUFBQyxDQUFBLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBVCxDQUFBO1FBQXNCLENBQUMsQ0FBQyxNQUFGLENBQVMsQ0FBVCxFQUFZLENBQVosRUFBZSxDQUFmO2VBQWtCLElBQUksS0FBSixDQUFVLElBQUMsQ0FBQSxDQUFDLENBQUMsR0FBSCxDQUFPLE9BQVAsRUFBZSxDQUFmLENBQVY7SUFBckQ7O29CQUNaLFVBQUEsR0FBWSxTQUFDLENBQUQ7QUFBUyxZQUFBO1FBQUEsQ0FBQSxHQUFJLElBQUMsQ0FBQSxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVQsQ0FBQTtRQUFzQixDQUFDLENBQUMsTUFBRixDQUFTLENBQVQsRUFBWSxDQUFaO2VBQWtCLElBQUksS0FBSixDQUFVLElBQUMsQ0FBQSxDQUFDLENBQUMsR0FBSCxDQUFPLE9BQVAsRUFBZSxDQUFmLENBQVY7SUFBckQ7O29CQUNaLFVBQUEsR0FBYyxTQUFDLENBQUQ7QUFBTyxZQUFBO1FBQUEsQ0FBQSxHQUFJLElBQUMsQ0FBQSxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVQsQ0FBQTtRQUFzQixDQUFDLENBQUMsSUFBRixDQUFPLENBQVA7ZUFBa0IsSUFBSSxLQUFKLENBQVUsSUFBQyxDQUFBLENBQUMsQ0FBQyxHQUFILENBQU8sT0FBUCxFQUFlLENBQWYsQ0FBVjtJQUFuRDs7b0JBQ2QsWUFBQSxHQUFjLFNBQUMsQ0FBRDtBQUFPLFlBQUE7UUFBQSxDQUFBLEdBQUksSUFBQyxDQUFBLENBQUMsQ0FBQyxVQUFVLENBQUMsU0FBZCxDQUFBO1FBQTJCLENBQUMsQ0FBQyxJQUFGLENBQU8sQ0FBUDtlQUFhLElBQUksS0FBSixDQUFVLElBQUMsQ0FBQSxDQUFDLENBQUMsR0FBSCxDQUFPLFlBQVAsRUFBb0IsQ0FBcEIsQ0FBVjtJQUFuRDs7Ozs7O0FBRWxCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbjAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4wMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiMjI1xuXG57IGtlcnJvciwga3N0ciB9ID0gcmVxdWlyZSAna3hrJ1xuXG5JbW11dGFibGUgPSByZXF1aXJlICdzZWFtbGVzcy1pbW11dGFibGUnXG5cbmNsYXNzIFN0YXRlXG5cbiAgICBAOiAob3B0KSAtPlxuXG4gICAgICAgIGlmIG9wdD8gYW5kIEltbXV0YWJsZS5pc0ltbXV0YWJsZSBvcHRcbiAgICAgICAgICAgIEBzID0gb3B0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGxpbmVzID0gb3B0Py5saW5lcyA/IFtdXG4gICAgICAgICAgICB5ID0gbGluZXMubGVuZ3RoID09IDAgYW5kIC0xIG9yIDBcbiAgICAgICAgICAgIEBzID0gSW1tdXRhYmxlXG4gICAgICAgICAgICAgICAgbGluZXM6ICAgICAgbGluZXNcbiAgICAgICAgICAgICAgICBjdXJzb3JzOiAgICBbWzAseV1dXG4gICAgICAgICAgICAgICAgc2VsZWN0aW9uczogW11cbiAgICAgICAgICAgICAgICBoaWdobGlnaHRzOiBbXVxuICAgICAgICAgICAgICAgIG1haW46ICAgICAgIDBcblxuICAgICMgcmVhZCBvbmx5OlxuICAgIFxuICAgIHRleHQ6IChuPSdcXG4nKSAtPiBAcy5saW5lcy5qb2luIG5cbiAgICB0YWJsaW5lOiAgIChpKSAtPiBAcy5saW5lc1tpXVxuICAgIGxpbmU6ICAgICAgKGkpIC0+XG4gICAgICAgIGlmIG5vdCBAcy5saW5lc1tpXT9cbiAgICAgICAgICAgIGtlcnJvciBcImVkaXRvci9zdGF0ZSAtLSByZXF1ZXN0aW5nIGludmFsaWQgbGluZSBhdCBpbmRleCAje2l9P1wiXG4gICAgICAgICAgICByZXR1cm4gJydcbiAgICAgICAga3N0ci5kZXRhYiBAcy5saW5lc1tpXVxuICAgIFxuICAgIGxpbmVzOiAgICAgICAgIC0+IEBzLmxpbmVzLm1hcCAobCkgLT4ga3N0ci5kZXRhYiBsXG4gICAgY3Vyc29yczogICAgICAgLT4gQHMuY3Vyc29ycy5hc011dGFibGUgICAgZGVlcDogdHJ1ZVxuICAgIGhpZ2hsaWdodHM6ICAgIC0+IEBzLmhpZ2hsaWdodHMuYXNNdXRhYmxlIGRlZXA6IHRydWVcbiAgICBzZWxlY3Rpb25zOiAgICAtPiBAcy5zZWxlY3Rpb25zLmFzTXV0YWJsZSBkZWVwOiB0cnVlXG4gICAgbWFpbjogICAgICAgICAgLT4gQHMubWFpblxuXG4gICAgY3Vyc29yOiAgICAoaSkgLT4gQHMuY3Vyc29yc1tpXT8uYXNNdXRhYmxlICAgIGRlZXA6IHRydWVcbiAgICBzZWxlY3Rpb246IChpKSAtPiBAcy5zZWxlY3Rpb25zW2ldPy5hc011dGFibGUgZGVlcDogdHJ1ZVxuICAgIGhpZ2hsaWdodDogKGkpIC0+IEBzLmhpZ2hsaWdodHNbaV0/LmFzTXV0YWJsZSBkZWVwOiB0cnVlXG5cbiAgICBudW1MaW5lczogICAgICAtPiBAcy5saW5lcy5sZW5ndGhcbiAgICBudW1DdXJzb3JzOiAgICAtPiBAcy5jdXJzb3JzLmxlbmd0aFxuICAgIG51bVNlbGVjdGlvbnM6IC0+IEBzLnNlbGVjdGlvbnMubGVuZ3RoXG4gICAgbnVtSGlnaGxpZ2h0czogLT4gQHMuaGlnaGxpZ2h0cy5sZW5ndGhcbiAgICBtYWluQ3Vyc29yOiAgICAtPiBAcy5jdXJzb3JzW0BzLm1haW5dLmFzTXV0YWJsZSBkZWVwOiB0cnVlXG5cbiAgICAjIG1vZGlmeTpcblxuICAgIHNldFNlbGVjdGlvbnM6IChzKSAtPiBuZXcgU3RhdGUgQHMuc2V0ICdzZWxlY3Rpb25zJyBzXG4gICAgc2V0SGlnaGxpZ2h0czogKGgpIC0+IG5ldyBTdGF0ZSBAcy5zZXQgJ2hpZ2hsaWdodHMnIGhcbiAgICBzZXRDdXJzb3JzOiAgICAoYykgLT4gbmV3IFN0YXRlIEBzLnNldCAnY3Vyc29ycycgICAgY1xuICAgIHNldE1haW46ICAgICAgIChtKSAtPiBuZXcgU3RhdGUgQHMuc2V0ICdtYWluJyAgICAgICBtXG5cbiAgICBjaGFuZ2VMaW5lOiAoaSx0KSAtPiBuZXcgU3RhdGUgQHMuc2V0SW4gWydsaW5lcycgaV0sIHRcbiAgICBpbnNlcnRMaW5lOiAoaSx0KSAtPiBsID0gQHMubGluZXMuYXNNdXRhYmxlKCk7IGwuc3BsaWNlIGksIDAsIHQ7IG5ldyBTdGF0ZSBAcy5zZXQgJ2xpbmVzJyBsXG4gICAgZGVsZXRlTGluZTogKGkpICAgLT4gbCA9IEBzLmxpbmVzLmFzTXV0YWJsZSgpOyBsLnNwbGljZSBpLCAxOyAgICBuZXcgU3RhdGUgQHMuc2V0ICdsaW5lcycgbFxuICAgIGFwcGVuZExpbmU6ICAgKHQpIC0+IGwgPSBAcy5saW5lcy5hc011dGFibGUoKTsgbC5wdXNoIHQ7ICAgICAgICAgbmV3IFN0YXRlIEBzLnNldCAnbGluZXMnIGxcbiAgICBhZGRIaWdobGlnaHQ6IChoKSAtPiBtID0gQHMuaGlnaGxpZ2h0cy5hc011dGFibGUoKTsgbS5wdXNoIGg7ICAgIG5ldyBTdGF0ZSBAcy5zZXQgJ2hpZ2hsaWdodHMnIG1cblxubW9kdWxlLmV4cG9ydHMgPSBTdGF0ZVxuIl19
//# sourceURL=../../coffee/editor/state.coffee