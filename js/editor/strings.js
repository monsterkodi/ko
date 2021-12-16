// koffee 1.20.0

/*
 0000000  000000000  00000000   000  000   000   0000000    0000000
000          000     000   000  000  0000  000  000        000     
0000000      000     0000000    000  000 0 000  000  0000  0000000 
     000     000     000   000  000  000  0000  000   000       000
0000000      000     000   000  000  000   000   0000000   0000000
 */
var Strings, _, matchr, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), _ = ref._, matchr = ref.matchr;

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
            var ref1, results;
            ref1 = this.editor.stringCharacters;
            results = [];
            for (p in ref1) {
                a = ref1[p];
                results.push([new RegExp(_.escapeRegExp(p)), a]);
            }
            return results;
        }).call(this);
    };

    Strings.prototype.onCursor = function() {
        var h, j, len, ref1;
        if (this.editor.numHighlights()) {
            ref1 = this.editor.highlights();
            for (j = 0, len = ref1.length; j < len; j++) {
                h = ref1[j];
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
        var cp, i, j, li, line, pair, pairs, ref1, ref2, ref3, rngs, stack, ths;
        stack = [];
        pairs = [];
        pair = null;
        cp = pos[0], li = pos[1];
        line = this.editor.line(li);
        rngs = matchr.ranges(this.config, line);
        if (!rngs.length) {
            return;
        }
        for (i = j = 0, ref1 = rngs.length; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
            ths = rngs[i];
            if (ths.start > 0 && line[ths.start - 1] === '\\') {
                if (ths.start - 1 <= 0 || line[ths.start - 2] !== '\\') {
                    continue;
                }
            }
            if ((((ref2 = _.last(stack)) != null ? ref2.match : void 0) === "'" && "'" === ths.match) && _.last(stack).start === ths.start - 1) {
                stack.pop();
                continue;
            }
            if (((ref3 = _.last(stack)) != null ? ref3.match : void 0) === ths.match) {
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
            var ref1, ref2;
            return !((ref1 = h[2]) != null ? (ref2 = ref1.clss) != null ? ref2.startsWith('stringmatch') : void 0 : void 0);
        }));
    };

    return Strings;

})();

module.exports = Strings;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyaW5ncy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvZWRpdG9yIiwic291cmNlcyI6WyJzdHJpbmdzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx1QkFBQTtJQUFBOztBQVFBLE1BQWdCLE9BQUEsQ0FBUSxLQUFSLENBQWhCLEVBQUUsU0FBRixFQUFLOztBQUVDO0lBRUMsaUJBQUMsTUFBRDtRQUFDLElBQUMsQ0FBQSxTQUFEOzs7UUFFQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxRQUFYLEVBQW9CLElBQUMsQ0FBQSxRQUFyQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLGlCQUFYLEVBQTZCLElBQUMsQ0FBQSxXQUE5QjtRQUNBLElBQUMsQ0FBQSxXQUFELENBQUE7SUFKRDs7c0JBTUgsV0FBQSxHQUFhLFNBQUE7QUFFVCxZQUFBO2VBQUEsSUFBQyxDQUFBLE1BQUQ7O0FBQVk7QUFBQTtpQkFBQSxTQUFBOzs2QkFBQSxDQUFDLElBQUksTUFBSixDQUFXLENBQUMsQ0FBQyxZQUFGLENBQWUsQ0FBZixDQUFYLENBQUQsRUFBZ0MsQ0FBaEM7QUFBQTs7O0lBRkg7O3NCQUliLFFBQUEsR0FBVSxTQUFBO0FBRU4sWUFBQTtRQUFBLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxhQUFSLENBQUEsQ0FBSDtBQUNJO0FBQUEsaUJBQUEsc0NBQUE7O2dCQUNJLElBQWMsWUFBZDtBQUFBLDJCQUFBOztBQURKLGFBREo7O1FBSUEsSUFBVSxJQUFDLENBQUEsZUFBRCxDQUFpQixJQUFDLENBQUEsTUFBTSxDQUFDLFNBQVIsQ0FBQSxDQUFqQixDQUFWO0FBQUEsbUJBQUE7O1FBRUEsSUFBQyxDQUFBLEtBQUQsQ0FBQTtlQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsZ0JBQVIsQ0FBQTtJQVRNOztzQkFXVixlQUFBLEdBQWlCLFNBQUMsR0FBRDtBQUViLFlBQUE7UUFBQSxLQUFBLEdB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QyxLQUFKO1FBQ3ZELElBQUMsQ0FBQSxNQUFNLENBQUMsWUFBUixDQUFxQixDQUFDLEVBQUQsRUFBSyxDQUFDLEdBQUcsQ0FBQyxLQUFMLEVBQVksR0FBRyxDQUFDLEtBQUosR0FBVSxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQWhDLENBQUwsRUFBOEMsSUFBSyxDQUFBLENBQUEsQ0FBbkQsQ0FBckI7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLFlBQVIsQ0FBcUIsQ0FBQyxFQUFELEVBQUssQ0FBQyxHQUFHLENBQUMsS0FBTCxFQUFZLEdBQUcsQ0FBQyxLQUFKLEdBQVUsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFoQyxDQUFMLEVBQThDLElBQUssQ0FBQSxDQUFBLENBQW5ELENBQXJCO2VBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQkFBUixDQUFBO0lBUE87O3NCQVNYLEtBQUEsR0FBTyxTQUFBO2VBQ0gsSUFBQyxDQUFBLE1BQU0sQ0FBQyxhQUFSLENBQXNCLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBUixDQUFBLENBQW9CLENBQUMsTUFBckIsQ0FBNEIsU0FBQyxDQUFEO0FBQU8sZ0JBQUE7bUJBQUEsMkRBQWMsQ0FBRSxVQUFaLENBQXVCLGFBQXZCO1FBQVgsQ0FBNUIsQ0FBdEI7SUFERzs7Ozs7O0FBR1gsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDBcbjAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICBcbjAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCBcbiAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDBcbjAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCBcbiMjI1xuXG57IF8sIG1hdGNociB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBTdHJpbmdzXG4gICAgXG4gICAgQDogKEBlZGl0b3IpIC0+XG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLm9uICdjdXJzb3InIEBvbkN1cnNvclxuICAgICAgICBAZWRpdG9yLm9uICdmaWxlVHlwZUNoYW5nZWQnIEBzZXR1cENvbmZpZ1xuICAgICAgICBAc2V0dXBDb25maWcoKVxuICAgICAgICAgICAgXG4gICAgc2V0dXBDb25maWc6ID0+XG4gICAgICAgIFxuICAgICAgICBAY29uZmlnID0gKCBbbmV3IFJlZ0V4cChfLmVzY2FwZVJlZ0V4cChwKSksIGFdIGZvciBwLGEgb2YgQGVkaXRvci5zdHJpbmdDaGFyYWN0ZXJzIClcbiAgICAgICAgXG4gICAgb25DdXJzb3I6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAZWRpdG9yLm51bUhpZ2hsaWdodHMoKSAjIGRvbid0IGhpZ2hsaWdodCBzdHJpbmdzIHdoZW4gb3RoZXIgaGlnaGxpZ2h0cyBleGlzdFxuICAgICAgICAgICAgZm9yIGggaW4gQGVkaXRvci5oaWdobGlnaHRzKClcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgbm90IGhbMl0/XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBAaGlnaGxpZ2h0SW5zaWRlIEBlZGl0b3IuY3Vyc29yUG9zKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQGNsZWFyKClcbiAgICAgICAgQGVkaXRvci5yZW5kZXJIaWdobGlnaHRzKClcblxuICAgIGhpZ2hsaWdodEluc2lkZTogKHBvcykgLT5cbiAgICAgICAgXG4gICAgICAgIHN0YWNrID0gW11cbiAgICAgICAgcGFpcnMgPSBbXVxuICAgICAgICBwYWlyICA9IG51bGxcbiAgICAgICAgW2NwLCBsaV0gPSBwb3NcbiAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZShsaSlcbiAgICAgICAgcm5ncyA9IG1hdGNoci5yYW5nZXMgQGNvbmZpZywgbGluZSAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBybmdzLmxlbmd0aFxuICAgICAgICBmb3IgaSBpbiBbMC4uLnJuZ3MubGVuZ3RoXVxuICAgICAgICAgICAgdGhzID0gcm5nc1tpXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiB0aHMuc3RhcnQgPiAwIGFuZCBsaW5lW3Rocy5zdGFydC0xXSA9PSAnXFxcXCcgXG4gICAgICAgICAgICAgICAgaWYgdGhzLnN0YXJ0LTEgPD0gMCBvciBsaW5lW3Rocy5zdGFydC0yXSAhPSAnXFxcXCdcbiAgICAgICAgICAgICAgICAgICAgY29udGludWUgIyBpZ25vcmUgZXNjYXBlZFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgXy5sYXN0KHN0YWNrKT8ubWF0Y2ggPT0gXCInXCIgPT0gdGhzLm1hdGNoIGFuZCBfLmxhc3Qoc3RhY2spLnN0YXJ0ID09IHRocy5zdGFydC0xXG4gICAgICAgICAgICAgICAgc3RhY2sucG9wKCkgIyByZW1vdmUgJydcbiAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgXy5sYXN0KHN0YWNrKT8ubWF0Y2ggPT0gdGhzLm1hdGNoXG4gICAgICAgICAgICAgICAgcGFpcnMucHVzaCBbc3RhY2sucG9wKCksIHRoc11cbiAgICAgICAgICAgICAgICBpZiBub3QgcGFpcj8gXG4gICAgICAgICAgICAgICAgICAgIGlmIF8ubGFzdChwYWlycylbMF0uc3RhcnQgPD0gY3AgPD0gdGhzLnN0YXJ0KzFcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhaXIgPSBfLmxhc3QgcGFpcnNcbiAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICBpZiBzdGFjay5sZW5ndGggPiAxIGFuZCBzdGFja1tzdGFjay5sZW5ndGgtMl0ubWF0Y2ggPT0gdGhzLm1hdGNoXG4gICAgICAgICAgICAgICAgc3RhY2sucG9wKClcbiAgICAgICAgICAgICAgICBwYWlycy5wdXNoIFtzdGFjay5wb3AoKSwgdGhzXVxuICAgICAgICAgICAgICAgIGlmIG5vdCBwYWlyPyBcbiAgICAgICAgICAgICAgICAgICAgaWYgXy5sYXN0KHBhaXJzKVswXS5zdGFydCA8PSBjcCA8PSB0aHMuc3RhcnQrMVxuICAgICAgICAgICAgICAgICAgICAgICAgcGFpciA9IF8ubGFzdCBwYWlyc1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN0YWNrLnB1c2ggdGhzXG4gICAgICAgIFxuICAgICAgICBpZiBwYWlyP1xuICAgICAgICAgICAgQGhpZ2hsaWdodCBwYWlyLCBsaVxuICAgICAgICAgICAgdHJ1ZVxuICAgICAgICBcbiAgICBoaWdobGlnaHQ6IChwYWlyLCBsaSkgLT5cbiAgICAgICAgQGNsZWFyKClcbiAgICAgICAgW29wbixjbHNdID0gcGFpclxuICAgICAgICBwYWlyWzBdLmNsc3MgPSBcInN0cmluZ21hdGNoICN7QGVkaXRvci5zdHJpbmdDaGFyYWN0ZXJzW29wbi5tYXRjaF19XCJcbiAgICAgICAgcGFpclsxXS5jbHNzID0gXCJzdHJpbmdtYXRjaCAje0BlZGl0b3Iuc3RyaW5nQ2hhcmFjdGVyc1tjbHMubWF0Y2hdfVwiXG4gICAgICAgIEBlZGl0b3IuYWRkSGlnaGxpZ2h0IFtsaSwgW29wbi5zdGFydCwgb3BuLnN0YXJ0K29wbi5tYXRjaC5sZW5ndGhdLCBwYWlyWzBdXVxuICAgICAgICBAZWRpdG9yLmFkZEhpZ2hsaWdodCBbbGksIFtjbHMuc3RhcnQsIGNscy5zdGFydCtjbHMubWF0Y2gubGVuZ3RoXSwgcGFpclsxXV1cbiAgICAgICAgQGVkaXRvci5yZW5kZXJIaWdobGlnaHRzKClcbiAgICAgICAgXG4gICAgY2xlYXI6IC0+XG4gICAgICAgIEBlZGl0b3Iuc2V0SGlnaGxpZ2h0cyBAZWRpdG9yLmhpZ2hsaWdodHMoKS5maWx0ZXIgKGgpIC0+IG5vdCBoWzJdPy5jbHNzPy5zdGFydHNXaXRoICdzdHJpbmdtYXRjaCdcblxubW9kdWxlLmV4cG9ydHMgPSBTdHJpbmdzXG4iXX0=
//# sourceURL=../../coffee/editor/strings.coffee