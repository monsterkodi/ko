// koffee 1.4.0

/*
 0000000  000000000   0000000   000000000  00000000
000          000     000   000     000     000
0000000      000     000000000     000     0000000
     000     000     000   000     000     000
0000000      000     000   000     000     00000000
 */
var Immutable, State, kerror, kstr, ref;

ref = require('kxk'), kstr = ref.kstr, kerror = ref.kerror;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLE1BQW1CLE9BQUEsQ0FBUSxLQUFSLENBQW5CLEVBQUUsZUFBRixFQUFROztBQUVSLFNBQUEsR0FBWSxPQUFBLENBQVEsb0JBQVI7O0FBRU47SUFFQyxlQUFDLEdBQUQ7QUFFQyxZQUFBO1FBQUEsSUFBRyxhQUFBLElBQVMsU0FBUyxDQUFDLFdBQVYsQ0FBc0IsR0FBdEIsQ0FBWjtZQUNJLElBQUMsQ0FBQSxDQUFELEdBQUssSUFEVDtTQUFBLE1BQUE7WUFHSSxLQUFBLDhEQUFxQjtZQUNyQixDQUFBLEdBQUksS0FBSyxDQUFDLE1BQU4sS0FBZ0IsQ0FBaEIsSUFBc0IsQ0FBQyxDQUF2QixJQUE0QjtZQUNoQyxJQUFDLENBQUEsQ0FBRCxHQUFLLFNBQUEsQ0FDRDtnQkFBQSxLQUFBLEVBQVksS0FBSyxDQUFDLEdBQU4sQ0FBVSxTQUFDLENBQUQ7MkJBQU87d0JBQUEsSUFBQSxFQUFLLENBQUw7O2dCQUFQLENBQVYsQ0FBWjtnQkFDQSxPQUFBLEVBQVksQ0FBQyxDQUFDLENBQUQsRUFBRyxDQUFILENBQUQsQ0FEWjtnQkFFQSxVQUFBLEVBQVksRUFGWjtnQkFHQSxVQUFBLEVBQVksRUFIWjtnQkFJQSxJQUFBLEVBQVksQ0FKWjthQURDLEVBTFQ7O0lBRkQ7O29CQWdCSCxJQUFBLEdBQU0sU0FBQyxDQUFEO0FBQ0YsWUFBQTs7WUFERyxJQUFFOztRQUNMLFFBQUEsR0FBVyxJQUFDLENBQUEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFULENBQWEsU0FBQyxDQUFEO21CQUFPLENBQUMsQ0FBQztRQUFULENBQWI7ZUFDWCxRQUFRLENBQUMsSUFBVCxDQUFjLENBQWQ7SUFGRTs7b0JBSU4sT0FBQSxHQUFXLFNBQUMsQ0FBRDtlQUFPLElBQUMsQ0FBQSxDQUFDLENBQUMsS0FBTSxDQUFBLENBQUEsQ0FBRSxD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Q0FBTyxDQUFQO2VBQWtCLElBQUksS0FBSixDQUFVLElBQUMsQ0FBQSxDQUFDLENBQUMsR0FBSCxDQUFPLFlBQVAsRUFBb0IsQ0FBcEIsQ0FBVjtJQUF4RDs7Ozs7O0FBRWxCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbjAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4wMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiMjI1xuXG57IGtzdHIsIGtlcnJvciB9ID0gcmVxdWlyZSAna3hrJ1xuXG5JbW11dGFibGUgPSByZXF1aXJlICdzZWFtbGVzcy1pbW11dGFibGUnXG5cbmNsYXNzIFN0YXRlXG5cbiAgICBAOiAob3B0KSAtPlxuXG4gICAgICAgIGlmIG9wdD8gYW5kIEltbXV0YWJsZS5pc0ltbXV0YWJsZSBvcHRcbiAgICAgICAgICAgIEBzID0gb3B0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGxpbmVzID0gb3B0Py5saW5lcyA/IFtdXG4gICAgICAgICAgICB5ID0gbGluZXMubGVuZ3RoID09IDAgYW5kIC0xIG9yIDBcbiAgICAgICAgICAgIEBzID0gSW1tdXRhYmxlXG4gICAgICAgICAgICAgICAgbGluZXM6ICAgICAgbGluZXMubWFwIChsKSAtPiB0ZXh0OmxcbiAgICAgICAgICAgICAgICBjdXJzb3JzOiAgICBbWzAseV1dXG4gICAgICAgICAgICAgICAgc2VsZWN0aW9uczogW11cbiAgICAgICAgICAgICAgICBoaWdobGlnaHRzOiBbXVxuICAgICAgICAgICAgICAgIG1haW46ICAgICAgIDBcblxuICAgICMgcmVhZCBvbmx5OlxuXG4gICAgdGV4dDogKG49J1xcbicpIC0+XG4gICAgICAgIHRhYkxpbmVzID0gQHMubGluZXMubWFwIChsKSAtPiBsLnRleHRcbiAgICAgICAgdGFiTGluZXMuam9pbiBuXG5cbiAgICB0YWJsaW5lOiAgIChpKSAtPiBAcy5saW5lc1tpXS50ZXh0XG4gICAgbGluZTogICAgICAoaSkgLT5cbiAgICAgICAgaWYgbm90IEBzLmxpbmVzW2ldP1xuICAgICAgICAgICAga2Vycm9yIFwiZWRpdG9yL3N0YXRlIC0tIHJlcXVlc3RpbmcgaW52YWxpZCBsaW5lIGF0IGluZGV4ICN7aX0/XCJcbiAgICAgICAgICAgIHJldHVybiAnJ1xuICAgICAgICBrc3RyLmRldGFiIEBzLmxpbmVzW2ldLnRleHRcblxuICAgIGxpbmVzOiAgICAgICAgIC0+IEBzLmxpbmVzLm1hcCAobCkgLT4ga3N0ci5kZXRhYiBsLnRleHRcbiAgICBjdXJzb3JzOiAgICAgICAtPiBAcy5jdXJzb3JzLmFzTXV0YWJsZSBkZWVwOiB0cnVlXG4gICAgaGlnaGxpZ2h0czogICAgLT4gQHMuaGlnaGxpZ2h0cy5hc011dGFibGUgZGVlcDogdHJ1ZVxuICAgIHNlbGVjdGlvbnM6ICAgIC0+IEBzLnNlbGVjdGlvbnMuYXNNdXRhYmxlIGRlZXA6IHRydWVcbiAgICBtYWluOiAgICAgICAgICAtPiBAcy5tYWluXG5cbiAgICBjdXJzb3I6ICAgIChpKSAtPiBAcy5jdXJzb3JzW2ldPy5hc011dGFibGUgZGVlcDogdHJ1ZVxuICAgIHNlbGVjdGlvbjogKGkpIC0+IEBzLnNlbGVjdGlvbnNbaV0/LmFzTXV0YWJsZSBkZWVwOiB0cnVlXG4gICAgaGlnaGxpZ2h0OiAoaSkgLT4gQHMuaGlnaGxpZ2h0c1tpXT8uYXNNdXRhYmxlIGRlZXA6IHRydWVcblxuICAgIG51bUxpbmVzOiAgICAgIC0+IEBzLmxpbmVzLmxlbmd0aFxuICAgIG51bUN1cnNvcnM6ICAgIC0+IEBzLmN1cnNvcnMubGVuZ3RoXG4gICAgbnVtU2VsZWN0aW9uczogLT4gQHMuc2VsZWN0aW9ucy5sZW5ndGhcbiAgICBudW1IaWdobGlnaHRzOiAtPiBAcy5oaWdobGlnaHRzLmxlbmd0aFxuICAgIG1haW5DdXJzb3I6ICAgIC0+IEBzLmN1cnNvcnNbQHMubWFpbl0uYXNNdXRhYmxlIGRlZXA6IHRydWVcblxuICAgICMgbW9kaWZ5OlxuXG4gICAgc2V0U2VsZWN0aW9uczogKHMpIC0+IG5ldyBTdGF0ZSBAcy5zZXQgJ3NlbGVjdGlvbnMnIHNcbiAgICBzZXRIaWdobGlnaHRzOiAoaCkgLT4gbmV3IFN0YXRlIEBzLnNldCAnaGlnaGxpZ2h0cycgaFxuICAgIHNldEN1cnNvcnM6ICAgIChjKSAtPiBuZXcgU3RhdGUgQHMuc2V0ICdjdXJzb3JzJyAgICBjXG4gICAgc2V0TWFpbjogICAgICAgKG0pIC0+IG5ldyBTdGF0ZSBAcy5zZXQgJ21haW4nICAgICAgIG1cblxuICAgIGNoYW5nZUxpbmU6IChpLHQpIC0+IG5ldyBTdGF0ZSBAcy5zZXRJbiBbJ2xpbmVzJyBpXSwgdGV4dDp0XG4gICAgaW5zZXJ0TGluZTogKGksdCkgLT4gbCA9IEBzLmxpbmVzLmFzTXV0YWJsZSgpOyBsLnNwbGljZSBpLCAwLCB0ZXh0OnQ7IG5ldyBTdGF0ZSBAcy5zZXQgJ2xpbmVzJyBsXG4gICAgZGVsZXRlTGluZTogKGkpICAgLT4gbCA9IEBzLmxpbmVzLmFzTXV0YWJsZSgpOyBsLnNwbGljZSBpLCAxOyAgICAgICAgIG5ldyBTdGF0ZSBAcy5zZXQgJ2xpbmVzJyBsXG4gICAgYXBwZW5kTGluZTogICAodCkgLT4gbCA9IEBzLmxpbmVzLmFzTXV0YWJsZSgpOyBsLnB1c2ggdGV4dDp0OyAgICAgICAgIG5ldyBTdGF0ZSBAcy5zZXQgJ2xpbmVzJyBsXG4gICAgYWRkSGlnaGxpZ2h0OiAoaCkgLT4gbSA9IEBzLmhpZ2hsaWdodHMuYXNNdXRhYmxlKCk7IG0ucHVzaCBoOyAgICAgICAgIG5ldyBTdGF0ZSBAcy5zZXQgJ2hpZ2hsaWdodHMnIG1cblxubW9kdWxlLmV4cG9ydHMgPSBTdGF0ZVxuIl19
//# sourceURL=../../coffee/editor/state.coffee