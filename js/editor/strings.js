// koffee 0.56.0

/*
 0000000  000000000  00000000   000  000   000   0000000    0000000
000          000     000   000  000  0000  000  000        000     
0000000      000     0000000    000  000 0 000  000  0000  0000000 
     000     000     000   000  000  000  0000  000   000       000
0000000      000     000   000  000  000   000   0000000   0000000
 */
var Strings, _, matchr,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

_ = require('kxk')._;

matchr = require('../tools/matchr');

Strings = (function() {
    function Strings(editor) {
        this.editor = editor;
        this.onCursor = bind(this.onCursor, this);
        this.setupConfig = bind(this.setupConfig, this);
        this.editor.on('cursor', this.onCursor);
        this.editor.on('fileTypeChanged', this.setupConfig);
        this.setupConfig();
    }

    Strings.prototype.setupConfig = function() {
        var a, p;
        return this.config = (function() {
            var ref, results;
            ref = this.editor.stringCharacters;
            results = [];
            for (p in ref) {
                a = ref[p];
                results.push([new RegExp(_.escapeRegExp(p)), a]);
            }
            return results;
        }).call(this);
    };

    Strings.prototype.onCursor = function() {
        var h, j, len, ref;
        if (this.editor.numHighlights()) {
            ref = this.editor.highlights();
            for (j = 0, len = ref.length; j < len; j++) {
                h = ref[j];
                if (h[2] == null) {
                    return;
                }
            }
        }
        if (this.highlightInside(this.editor.cursorPos())) {
            return;
        }
        this.clear();
        return this.editor.renderHighlights();
    };

    Strings.prototype.highlightInside = function(pos) {
        var cp, i, j, li, line, pair, pairs, ref, ref1, ref2, rngs, stack, ths;
        stack = [];
        pairs = [];
        pair = null;
        cp = pos[0], li = pos[1];
        line = this.editor.line(li);
        rngs = matchr.ranges(this.config, line);
        if (!rngs.length) {
            return;
        }
        for (i = j = 0, ref = rngs.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
            ths = rngs[i];
            if (ths.start > 0 && line[ths.start - 1] === '\\') {
                if (ths.start - 1 <= 0 || line[ths.start - 2] !== '\\') {
                    continue;
                }
            }
            if ((((ref1 = _.last(stack)) != null ? ref1.match : void 0) === "'" && "'" === ths.match) && _.last(stack).start === ths.start - 1) {
                stack.pop();
                continue;
            }
            if (((ref2 = _.last(stack)) != null ? ref2.match : void 0) === ths.match) {
                pairs.push([stack.pop(), ths]);
                if (pair == null) {
                    if ((_.last(pairs)[0].start <= cp && cp <= ths.start + 1)) {
                        pair = _.last(pairs);
                    }
                }
                continue;
            }
            if (stack.length > 1 && stack[stack.length - 2].match === ths.match) {
                stack.pop();
                pairs.push([stack.pop(), ths]);
                if (pair == null) {
                    if ((_.last(pairs)[0].start <= cp && cp <= ths.start + 1)) {
                        pair = _.last(pairs);
                    }
                }
                continue;
            }
            stack.push(ths);
        }
        if (pair != null) {
            this.highlight(pair, li);
            return true;
        }
    };

    Strings.prototype.highlight = function(pair, li) {
        var cls, opn;
        this.clear();
        opn = pair[0], cls = pair[1];
        pair[0].clss = "stringmatch " + this.editor.stringCharacters[opn.match];
        pair[1].clss = "stringmatch " + this.editor.stringCharacters[cls.match];
        this.editor.addHighlight([li, [opn.start, opn.start + opn.match.length], pair[0]]);
        this.editor.addHighlight([li, [cls.start, cls.start + cls.match.length], pair[1]]);
        return this.editor.renderHighlights();
    };

    Strings.prototype.clear = function() {
        return this.editor.setHighlights(this.editor.highlights().filter(function(h) {
            var ref, ref1;
            return !((ref = h[2]) != null ? (ref1 = ref.clss) != null ? ref1.startsWith('stringmatch') : void 0 : void 0);
        }));
    };

    return Strings;

})();

module.exports = Strings;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyaW5ncy5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsa0JBQUE7SUFBQTs7QUFRRSxJQUFNLE9BQUEsQ0FBUSxLQUFSOztBQUVSLE1BQUEsR0FBUyxPQUFBLENBQVEsaUJBQVI7O0FBRUg7SUFFVyxpQkFBQyxNQUFEO1FBQUMsSUFBQyxDQUFBLFNBQUQ7OztRQUVWLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFFBQVgsRUFBcUIsSUFBQyxDQUFBLFFBQXRCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsaUJBQVgsRUFBOEIsSUFBQyxDQUFBLFdBQS9CO1FBQ0EsSUFBQyxDQUFBLFdBQUQsQ0FBQTtJQUpTOztzQkFNYixXQUFBLEdBQWEsU0FBQTtBQUNULFlBQUE7ZUFBQSxJQUFDLENBQUEsTUFBRDs7QUFBWTtBQUFBO2lCQUFBLFFBQUE7OzZCQUFBLENBQUMsSUFBSSxNQUFKLENBQVcsQ0FBQyxDQUFDLFlBQUYsQ0FBZSxDQUFmLENBQVgsQ0FBRCxFQUFnQyxDQUFoQztBQUFBOzs7SUFESDs7c0JBR2IsUUFBQSxHQUFVLFNBQUE7QUFDTixZQUFBO1FBQUEsSUFBRyxJQUFDLENBQUEsTUFBTSxDQUFDLGFBQVIsQ0FBQSxDQUFIO0FBQ0k7QUFBQSxpQkFBQSxxQ0FBQTs7Z0JBQ0ksSUFBYyxZQUFkO0FBQUEsMkJBQUE7O0FBREosYUFESjs7UUFJQSxJQUFVLElBQUMsQ0FBQSxlQUFELENBQWlCLElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBUixDQUFBLENBQWpCLENBQVY7QUFBQSxtQkFBQTs7UUFFQSxJQUFDLENBQUEsS0FBRCxDQUFBO2VBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQkFBUixDQUFBO0lBUk07O3NCQVVWLGVBQUEsR0FBaUIsU0FBQyxHQUFEO0FBQ2IsWUFBQTtRQUFBLEtBQUEsR0FBUTtRQUNSLEtBQUEsR0FBUTtRQUNS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LE1BQU0sQ0FBQyxZQUFSLENBQXFCLENBQUMsRUFBRCxFQUFLLENBQUMsR0FBRyxDQUFDLEtBQUwsRUFBWSxHQUFHLENBQUMsS0FBSixHQUFVLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBaEMsQ0FBTCxFQUE4QyxJQUFLLENBQUEsQ0FBQSxDQUFuRCxDQUFyQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsWUFBUixDQUFxQixDQUFDLEVBQUQsRUFBSyxDQUFDLEdBQUcsQ0FBQyxLQUFMLEVBQVksR0FBRyxDQUFDLEtBQUosR0FBVSxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQWhDLENBQUwsRUFBOEMsSUFBSyxDQUFBLENBQUEsQ0FBbkQsQ0FBckI7ZUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLGdCQUFSLENBQUE7SUFQTzs7c0JBU1gsS0FBQSxHQUFPLFNBQUE7ZUFDSCxJQUFDLENBQUEsTUFBTSxDQUFDLGFBQVIsQ0FBc0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLENBQUEsQ0FBb0IsQ0FBQyxNQUFyQixDQUE0QixTQUFDLENBQUQ7QUFBTyxnQkFBQTttQkFBQSx5REFBYyxDQUFFLFVBQVosQ0FBdUIsYUFBdkI7UUFBWCxDQUE1QixDQUF0QjtJQURHOzs7Ozs7QUFHWCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMFxuMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgIFxuMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwIFxuICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAgIDAwMFxuMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwIFxuIyMjXG5cbnsgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5tYXRjaHIgPSByZXF1aXJlICcuLi90b29scy9tYXRjaHInXG5cbmNsYXNzIFN0cmluZ3NcbiAgICBcbiAgICBjb25zdHJ1Y3RvcjogKEBlZGl0b3IpIC0+XG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLm9uICdjdXJzb3InLCBAb25DdXJzb3JcbiAgICAgICAgQGVkaXRvci5vbiAnZmlsZVR5cGVDaGFuZ2VkJywgQHNldHVwQ29uZmlnXG4gICAgICAgIEBzZXR1cENvbmZpZygpXG4gICAgICAgICAgICBcbiAgICBzZXR1cENvbmZpZzogPT4gXG4gICAgICAgIEBjb25maWcgPSAoIFtuZXcgUmVnRXhwKF8uZXNjYXBlUmVnRXhwKHApKSwgYV0gZm9yIHAsYSBvZiBAZWRpdG9yLnN0cmluZ0NoYXJhY3RlcnMgKVxuICAgICAgICBcbiAgICBvbkN1cnNvcjogPT5cbiAgICAgICAgaWYgQGVkaXRvci5udW1IaWdobGlnaHRzKCkgIyBkb24ndCBoaWdobGlnaHQgc3RyaW5ncyB3aGVuIG90aGVyIGhpZ2hsaWdodHMgZXhpc3RcbiAgICAgICAgICAgIGZvciBoIGluIEBlZGl0b3IuaGlnaGxpZ2h0cygpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIG5vdCBoWzJdP1xuICAgICAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgQGhpZ2hsaWdodEluc2lkZSBAZWRpdG9yLmN1cnNvclBvcygpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBjbGVhcigpXG4gICAgICAgIEBlZGl0b3IucmVuZGVySGlnaGxpZ2h0cygpXG5cbiAgICBoaWdobGlnaHRJbnNpZGU6IChwb3MpIC0+XG4gICAgICAgIHN0YWNrID0gW11cbiAgICAgICAgcGFpcnMgPSBbXVxuICAgICAgICBwYWlyICA9IG51bGxcbiAgICAgICAgW2NwLCBsaV0gPSBwb3NcbiAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZShsaSlcbiAgICAgICAgcm5ncyA9IG1hdGNoci5yYW5nZXMgQGNvbmZpZywgbGluZSAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBybmdzLmxlbmd0aFxuICAgICAgICBmb3IgaSBpbiBbMC4uLnJuZ3MubGVuZ3RoXVxuICAgICAgICAgICAgdGhzID0gcm5nc1tpXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiB0aHMuc3RhcnQgPiAwIGFuZCBsaW5lW3Rocy5zdGFydC0xXSA9PSAnXFxcXCcgXG4gICAgICAgICAgICAgICAgaWYgdGhzLnN0YXJ0LTEgPD0gMCBvciBsaW5lW3Rocy5zdGFydC0yXSAhPSAnXFxcXCdcbiAgICAgICAgICAgICAgICAgICAgY29udGludWUgIyBpZ25vcmUgZXNjYXBlZFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgXy5sYXN0KHN0YWNrKT8ubWF0Y2ggPT0gXCInXCIgPT0gdGhzLm1hdGNoIGFuZCBfLmxhc3Qoc3RhY2spLnN0YXJ0ID09IHRocy5zdGFydC0xXG4gICAgICAgICAgICAgICAgc3RhY2sucG9wKCkgIyByZW1vdmUgJydcbiAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgXy5sYXN0KHN0YWNrKT8ubWF0Y2ggPT0gdGhzLm1hdGNoXG4gICAgICAgICAgICAgICAgcGFpcnMucHVzaCBbc3RhY2sucG9wKCksIHRoc11cbiAgICAgICAgICAgICAgICBpZiBub3QgcGFpcj8gXG4gICAgICAgICAgICAgICAgICAgIGlmIF8ubGFzdChwYWlycylbMF0uc3RhcnQgPD0gY3AgPD0gdGhzLnN0YXJ0KzFcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhaXIgPSBfLmxhc3QgcGFpcnNcbiAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICBpZiBzdGFjay5sZW5ndGggPiAxIGFuZCBzdGFja1tzdGFjay5sZW5ndGgtMl0ubWF0Y2ggPT0gdGhzLm1hdGNoXG4gICAgICAgICAgICAgICAgc3RhY2sucG9wKClcbiAgICAgICAgICAgICAgICBwYWlycy5wdXNoIFtzdGFjay5wb3AoKSwgdGhzXVxuICAgICAgICAgICAgICAgIGlmIG5vdCBwYWlyPyBcbiAgICAgICAgICAgICAgICAgICAgaWYgXy5sYXN0KHBhaXJzKVswXS5zdGFydCA8PSBjcCA8PSB0aHMuc3RhcnQrMVxuICAgICAgICAgICAgICAgICAgICAgICAgcGFpciA9IF8ubGFzdCBwYWlyc1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN0YWNrLnB1c2ggdGhzXG4gICAgICAgIFxuICAgICAgICBpZiBwYWlyP1xuICAgICAgICAgICAgQGhpZ2hsaWdodCBwYWlyLCBsaVxuICAgICAgICAgICAgdHJ1ZVxuICAgICAgICBcbiAgICBoaWdobGlnaHQ6IChwYWlyLCBsaSkgLT5cbiAgICAgICAgQGNsZWFyKClcbiAgICAgICAgW29wbixjbHNdID0gcGFpclxuICAgICAgICBwYWlyWzBdLmNsc3MgPSBcInN0cmluZ21hdGNoICN7QGVkaXRvci5zdHJpbmdDaGFyYWN0ZXJzW29wbi5tYXRjaF19XCJcbiAgICAgICAgcGFpclsxXS5jbHNzID0gXCJzdHJpbmdtYXRjaCAje0BlZGl0b3Iuc3RyaW5nQ2hhcmFjdGVyc1tjbHMubWF0Y2hdfVwiXG4gICAgICAgIEBlZGl0b3IuYWRkSGlnaGxpZ2h0IFtsaSwgW29wbi5zdGFydCwgb3BuLnN0YXJ0K29wbi5tYXRjaC5sZW5ndGhdLCBwYWlyWzBdXVxuICAgICAgICBAZWRpdG9yLmFkZEhpZ2hsaWdodCBbbGksIFtjbHMuc3RhcnQsIGNscy5zdGFydCtjbHMubWF0Y2gubGVuZ3RoXSwgcGFpclsxXV1cbiAgICAgICAgQGVkaXRvci5yZW5kZXJIaWdobGlnaHRzKClcbiAgICAgICAgXG4gICAgY2xlYXI6IC0+XG4gICAgICAgIEBlZGl0b3Iuc2V0SGlnaGxpZ2h0cyBAZWRpdG9yLmhpZ2hsaWdodHMoKS5maWx0ZXIgKGgpIC0+IG5vdCBoWzJdPy5jbHNzPy5zdGFydHNXaXRoICdzdHJpbmdtYXRjaCdcblxubW9kdWxlLmV4cG9ydHMgPSBTdHJpbmdzXG4iXX0=
//# sourceURL=../../coffee/editor/strings.coffee