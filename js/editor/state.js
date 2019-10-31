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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLE1BQXNCLE9BQUEsQ0FBUSxLQUFSLENBQXRCLEVBQUUsbUJBQUYsRUFBVSxlQUFWLEVBQWdCOztBQUVoQixTQUFBLEdBQVksT0FBQSxDQUFRLG9CQUFSOztBQUVOO0lBRUMsZUFBQyxHQUFEO0FBRUMsWUFBQTtRQUFBLElBQUcsYUFBQSxJQUFTLFNBQVMsQ0FBQyxXQUFWLENBQXNCLEdBQXRCLENBQVo7WUFDSSxJQUFDLENBQUEsQ0FBRCxHQUFLLElBRFQ7U0FBQSxNQUFBO1lBR0ksS0FBQSw4REFBcUI7WUFDckIsQ0FBQSxHQUFJLEtBQUssQ0FBQyxNQUFOLEtBQWdCLENBQWhCLElBQXNCLENBQUMsQ0FBdkIsSUFBNEI7WUFDaEMsSUFBQyxDQUFBLENBQUQsR0FBSyxTQUFBLENBQ0Q7Z0JBQUEsS0FBQSxFQUFZLEtBQUssQ0FBQyxHQUFOLENBQVUsU0FBQyxDQUFEOzJCQUFPO3dCQUFBLElBQUEsRUFBSyxDQUFMOztnQkFBUCxDQUFWLENBQVo7Z0JBQ0EsT0FBQSxFQUFZLENBQUMsQ0FBQyxDQUFELEVBQUcsQ0FBSCxDQUFELENBRFo7Z0JBRUEsVUFBQSxFQUFZLEVBRlo7Z0JBR0EsVUFBQSxFQUFZLEVBSFo7Z0JBSUEsSUFBQSxFQUFZLENBSlo7YUFEQyxFQUxUOztJQUZEOztvQkFnQkgsSUFBQSxHQUFNLFNBQUMsQ0FBRDtBQUNGLFlBQUE7O1lBREcsSUFBRTs7UUFDTCxRQUFBLEdBQVcsSUFBQyxDQUFBLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBVCxDQUFhLFNBQUMsQ0FBRDttQkFBTyxDQUFDLENBQUM7UUFBVCxDQUFiO2VBQ1gsUUFBUSxDQUFDLElBQVQsQ0FBYyxDQUFkO0lBRkU7O29CQUlOLE9BQUEsR0FBVyxTQUFDLENBQUQ7ZUFBTyxJQUFDLENBQUEsQ0FBQyxDQUFDLEtBQU0sQ0FB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QUMsQ0FBQyxJQUFGLENBQU8sQ0FBUDtlQUFrQixJQUFJLEtBQUosQ0FBVSxJQUFDLENBQUEsQ0FBQyxDQUFDLEdBQUgsQ0FBTyxZQUFQLEVBQW9CLENBQXBCLENBQVY7SUFBeEQ7Ozs7OztBQUVsQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4wMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG4jIyNcblxueyBrZXJyb3IsIGtzdHIsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuSW1tdXRhYmxlID0gcmVxdWlyZSAnc2VhbWxlc3MtaW1tdXRhYmxlJ1xuXG5jbGFzcyBTdGF0ZVxuXG4gICAgQDogKG9wdCkgLT5cblxuICAgICAgICBpZiBvcHQ/IGFuZCBJbW11dGFibGUuaXNJbW11dGFibGUgb3B0XG4gICAgICAgICAgICBAcyA9IG9wdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBsaW5lcyA9IG9wdD8ubGluZXMgPyBbXVxuICAgICAgICAgICAgeSA9IGxpbmVzLmxlbmd0aCA9PSAwIGFuZCAtMSBvciAwXG4gICAgICAgICAgICBAcyA9IEltbXV0YWJsZVxuICAgICAgICAgICAgICAgIGxpbmVzOiAgICAgIGxpbmVzLm1hcCAobCkgLT4gdGV4dDpsXG4gICAgICAgICAgICAgICAgY3Vyc29yczogICAgW1swLHldXVxuICAgICAgICAgICAgICAgIHNlbGVjdGlvbnM6IFtdXG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0czogW11cbiAgICAgICAgICAgICAgICBtYWluOiAgICAgICAwXG5cbiAgICAjIHJlYWQgb25seTpcblxuICAgIHRleHQ6IChuPSdcXG4nKSAtPlxuICAgICAgICB0YWJMaW5lcyA9IEBzLmxpbmVzLm1hcCAobCkgLT4gbC50ZXh0XG4gICAgICAgIHRhYkxpbmVzLmpvaW4gblxuXG4gICAgdGFibGluZTogICAoaSkgLT4gQHMubGluZXNbaV0udGV4dFxuICAgIGxpbmU6ICAgICAgKGkpIC0+XG4gICAgICAgIGlmIG5vdCBAcy5saW5lc1tpXT9cbiAgICAgICAgICAgIGtlcnJvciBcImVkaXRvci9zdGF0ZSAtLSByZXF1ZXN0aW5nIGludmFsaWQgbGluZSBhdCBpbmRleCAje2l9P1wiXG4gICAgICAgICAgICByZXR1cm4gJydcbiAgICAgICAga3N0ci5kZXRhYiBAcy5saW5lc1tpXS50ZXh0XG5cbiAgICBsaW5lczogICAgICAgICAtPiBAcy5saW5lcy5tYXAgKGwpIC0+IGtzdHIuZGV0YWIgbC50ZXh0XG4gICAgY3Vyc29yczogICAgICAgLT4gQHMuY3Vyc29ycy5hc011dGFibGUgZGVlcDogdHJ1ZVxuICAgIGhpZ2hsaWdodHM6ICAgIC0+IEBzLmhpZ2hsaWdodHMuYXNNdXRhYmxlIGRlZXA6IHRydWVcbiAgICBzZWxlY3Rpb25zOiAgICAtPiBAcy5zZWxlY3Rpb25zLmFzTXV0YWJsZSBkZWVwOiB0cnVlXG4gICAgbWFpbjogICAgICAgICAgLT4gQHMubWFpblxuXG4gICAgY3Vyc29yOiAgICAoaSkgLT4gQHMuY3Vyc29yc1tpXT8uYXNNdXRhYmxlIGRlZXA6IHRydWVcbiAgICBzZWxlY3Rpb246IChpKSAtPiBAcy5zZWxlY3Rpb25zW2ldPy5hc011dGFibGUgZGVlcDogdHJ1ZVxuICAgIGhpZ2hsaWdodDogKGkpIC0+IEBzLmhpZ2hsaWdodHNbaV0/LmFzTXV0YWJsZSBkZWVwOiB0cnVlXG5cbiAgICBudW1MaW5lczogICAgICAtPiBAcy5saW5lcy5sZW5ndGhcbiAgICBudW1DdXJzb3JzOiAgICAtPiBAcy5jdXJzb3JzLmxlbmd0aFxuICAgIG51bVNlbGVjdGlvbnM6IC0+IEBzLnNlbGVjdGlvbnMubGVuZ3RoXG4gICAgbnVtSGlnaGxpZ2h0czogLT4gQHMuaGlnaGxpZ2h0cy5sZW5ndGhcbiAgICBtYWluQ3Vyc29yOiAgICAtPiBAcy5jdXJzb3JzW0BzLm1haW5dLmFzTXV0YWJsZSBkZWVwOiB0cnVlXG5cbiAgICAjIG1vZGlmeTpcblxuICAgIHNldFNlbGVjdGlvbnM6IChzKSAtPiBuZXcgU3RhdGUgQHMuc2V0ICdzZWxlY3Rpb25zJyBzXG4gICAgc2V0SGlnaGxpZ2h0czogKGgpIC0+IG5ldyBTdGF0ZSBAcy5zZXQgJ2hpZ2hsaWdodHMnIGhcbiAgICBzZXRDdXJzb3JzOiAgICAoYykgLT4gbmV3IFN0YXRlIEBzLnNldCAnY3Vyc29ycycgICAgY1xuICAgIHNldE1haW46ICAgICAgIChtKSAtPiBuZXcgU3RhdGUgQHMuc2V0ICdtYWluJyAgICAgICBtXG5cbiAgICBjaGFuZ2VMaW5lOiAoaSx0KSAtPiBuZXcgU3RhdGUgQHMuc2V0SW4gWydsaW5lcycgaV0sIHRleHQ6dFxuICAgIGluc2VydExpbmU6IChpLHQpIC0+IGwgPSBAcy5saW5lcy5hc011dGFibGUoKTsgbC5zcGxpY2UgaSwgMCwgdGV4dDp0OyBuZXcgU3RhdGUgQHMuc2V0ICdsaW5lcycgbFxuICAgIGRlbGV0ZUxpbmU6IChpKSAgIC0+IGwgPSBAcy5saW5lcy5hc011dGFibGUoKTsgbC5zcGxpY2UgaSwgMTsgICAgICAgICBuZXcgU3RhdGUgQHMuc2V0ICdsaW5lcycgbFxuICAgIGFwcGVuZExpbmU6ICAgKHQpIC0+IGwgPSBAcy5saW5lcy5hc011dGFibGUoKTsgbC5wdXNoIHRleHQ6dDsgICAgICAgICBuZXcgU3RhdGUgQHMuc2V0ICdsaW5lcycgbFxuICAgIGFkZEhpZ2hsaWdodDogKGgpIC0+IG0gPSBAcy5oaWdobGlnaHRzLmFzTXV0YWJsZSgpOyBtLnB1c2ggaDsgICAgICAgICBuZXcgU3RhdGUgQHMuc2V0ICdoaWdobGlnaHRzJyBtXG5cbm1vZHVsZS5leHBvcnRzID0gU3RhdGVcbiJdfQ==
//# sourceURL=../../coffee/editor/state.coffee