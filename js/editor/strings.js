// koffee 1.16.0

/*
 0000000  000000000  00000000   000  000   000   0000000    0000000
000          000     000   000  000  0000  000  000        000     
0000000      000     0000000    000  000 0 000  000  0000  0000000 
     000     000     000   000  000  000  0000  000   000       000
0000000      000     000   000  000  000   000   0000000   0000000
 */
var Strings, _, matchr, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), matchr = ref.matchr, _ = ref._;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyaW5ncy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvZWRpdG9yIiwic291cmNlcyI6WyJzdHJpbmdzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx1QkFBQTtJQUFBOztBQVFBLE1BQWdCLE9BQUEsQ0FBUSxLQUFSLENBQWhCLEVBQUUsbUJBQUYsRUFBVTs7QUFFSjtJQUVDLGlCQUFDLE1BQUQ7UUFBQyxJQUFDLENBQUEsU0FBRDs7O1FBRUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsUUFBWCxFQUFvQixJQUFDLENBQUEsUUFBckI7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxpQkFBWCxFQUE2QixJQUFDLENBQUEsV0FBOUI7UUFDQSxJQUFDLENBQUEsV0FBRCxDQUFBO0lBSkQ7O3NCQU1ILFdBQUEsR0FBYSxTQUFBO0FBQ1QsWUFBQTtlQUFBLElBQUMsQ0FBQSxNQUFEOztBQUFZO0FBQUE7aUJBQUEsU0FBQTs7NkJBQUEsQ0FBQyxJQUFJLE1BQUosQ0FBVyxDQUFDLENBQUMsWUFBRixDQUFlLENBQWYsQ0FBWCxDQUFELEVBQWdDLENBQWhDO0FBQUE7OztJQURIOztzQkFHYixRQUFBLEdBQVUsU0FBQTtBQUNOLFlBQUE7UUFBQSxJQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsYUFBUixDQUFBLENBQUg7QUFDSTtBQUFBLGlCQUFBLHNDQUFBOztnQkFDSSxJQUFjLFlBQWQ7QUFBQSwyQkFBQTs7QUFESixhQURKOztRQUlBLElBQVUsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFSLENBQUEsQ0FBakIsQ0FBVjtBQUFBLG1CQUFBOztRQUVBLElBQUMsQ0FBQSxLQUFELENBQUE7ZUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLGdCQUFSLENBQUE7SUFSTTs7c0JBVVYsZUFBQSxHQUFpQixTQUFDLEdBQUQ7QUFDYixZQUFBO1FBQUEsS0FBQSxH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QUMsS0FBSjtRQUN2RCxJQUFDLENBQUEsTUFBTSxDQUFDLFlBQVIsQ0FBcUIsQ0FBQyxFQUFELEVBQUssQ0FBQyxHQUFHLENBQUMsS0FBTCxFQUFZLEdBQUcsQ0FBQyxLQUFKLEdBQVUsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFoQyxDQUFMLEVBQThDLElBQUssQ0FBQSxDQUFBLENBQW5ELENBQXJCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxZQUFSLENBQXFCLENBQUMsRUFBRCxFQUFLLENBQUMsR0FBRyxDQUFDLEtBQUwsRUFBWSxHQUFHLENBQUMsS0FBSixHQUFVLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBaEMsQ0FBTCxFQUE4QyxJQUFLLENBQUEsQ0FBQSxDQUFuRCxDQUFyQjtlQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsZ0JBQVIsQ0FBQTtJQVBPOztzQkFTWCxLQUFBLEdBQU8sU0FBQTtlQUNILElBQUMsQ0FBQSxNQUFNLENBQUMsYUFBUixDQUFzQixJQUFDLENBQUEsTUFBTSxDQUFDLFVBQVIsQ0FBQSxDQUFvQixDQUFDLE1BQXJCLENBQTRCLFNBQUMsQ0FBRDtBQUFPLGdCQUFBO21CQUFBLDJEQUFjLENBQUUsVUFBWixDQUF1QixhQUF2QjtRQUFYLENBQTVCLENBQXRCO0lBREc7Ozs7OztBQUdYLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwXG4wMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgXG4wMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwICAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgXG4gICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgICAgICAgMDAwXG4wMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgXG4jIyNcblxueyBtYXRjaHIsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgU3RyaW5nc1xuICAgIFxuICAgIEA6IChAZWRpdG9yKSAtPlxuICAgICAgICBcbiAgICAgICAgQGVkaXRvci5vbiAnY3Vyc29yJyBAb25DdXJzb3JcbiAgICAgICAgQGVkaXRvci5vbiAnZmlsZVR5cGVDaGFuZ2VkJyBAc2V0dXBDb25maWdcbiAgICAgICAgQHNldHVwQ29uZmlnKClcbiAgICAgICAgICAgIFxuICAgIHNldHVwQ29uZmlnOiA9PiBcbiAgICAgICAgQGNvbmZpZyA9ICggW25ldyBSZWdFeHAoXy5lc2NhcGVSZWdFeHAocCkpLCBhXSBmb3IgcCxhIG9mIEBlZGl0b3Iuc3RyaW5nQ2hhcmFjdGVycyApXG4gICAgICAgIFxuICAgIG9uQ3Vyc29yOiA9PlxuICAgICAgICBpZiBAZWRpdG9yLm51bUhpZ2hsaWdodHMoKSAjIGRvbid0IGhpZ2hsaWdodCBzdHJpbmdzIHdoZW4gb3RoZXIgaGlnaGxpZ2h0cyBleGlzdFxuICAgICAgICAgICAgZm9yIGggaW4gQGVkaXRvci5oaWdobGlnaHRzKClcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgbm90IGhbMl0/XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBAaGlnaGxpZ2h0SW5zaWRlIEBlZGl0b3IuY3Vyc29yUG9zKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQGNsZWFyKClcbiAgICAgICAgQGVkaXRvci5yZW5kZXJIaWdobGlnaHRzKClcblxuICAgIGhpZ2hsaWdodEluc2lkZTogKHBvcykgLT5cbiAgICAgICAgc3RhY2sgPSBbXVxuICAgICAgICBwYWlycyA9IFtdXG4gICAgICAgIHBhaXIgID0gbnVsbFxuICAgICAgICBbY3AsIGxpXSA9IHBvc1xuICAgICAgICBsaW5lID0gQGVkaXRvci5saW5lKGxpKVxuICAgICAgICBybmdzID0gbWF0Y2hyLnJhbmdlcyBAY29uZmlnLCBsaW5lICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IHJuZ3MubGVuZ3RoXG4gICAgICAgIGZvciBpIGluIFswLi4ucm5ncy5sZW5ndGhdXG4gICAgICAgICAgICB0aHMgPSBybmdzW2ldXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHRocy5zdGFydCA+IDAgYW5kIGxpbmVbdGhzLnN0YXJ0LTFdID09ICdcXFxcJyBcbiAgICAgICAgICAgICAgICBpZiB0aHMuc3RhcnQtMSA8PSAwIG9yIGxpbmVbdGhzLnN0YXJ0LTJdICE9ICdcXFxcJ1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZSAjIGlnbm9yZSBlc2NhcGVkXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBfLmxhc3Qoc3RhY2spPy5tYXRjaCA9PSBcIidcIiA9PSB0aHMubWF0Y2ggYW5kIF8ubGFzdChzdGFjaykuc3RhcnQgPT0gdGhzLnN0YXJ0LTFcbiAgICAgICAgICAgICAgICBzdGFjay5wb3AoKSAjIHJlbW92ZSAnJ1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBfLmxhc3Qoc3RhY2spPy5tYXRjaCA9PSB0aHMubWF0Y2hcbiAgICAgICAgICAgICAgICBwYWlycy5wdXNoIFtzdGFjay5wb3AoKSwgdGhzXVxuICAgICAgICAgICAgICAgIGlmIG5vdCBwYWlyPyBcbiAgICAgICAgICAgICAgICAgICAgaWYgXy5sYXN0KHBhaXJzKVswXS5zdGFydCA8PSBjcCA8PSB0aHMuc3RhcnQrMVxuICAgICAgICAgICAgICAgICAgICAgICAgcGFpciA9IF8ubGFzdCBwYWlyc1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgIGlmIHN0YWNrLmxlbmd0aCA+IDEgYW5kIHN0YWNrW3N0YWNrLmxlbmd0aC0yXS5tYXRjaCA9PSB0aHMubWF0Y2hcbiAgICAgICAgICAgICAgICBzdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgIHBhaXJzLnB1c2ggW3N0YWNrLnBvcCgpLCB0aHNdXG4gICAgICAgICAgICAgICAgaWYgbm90IHBhaXI/IFxuICAgICAgICAgICAgICAgICAgICBpZiBfLmxhc3QocGFpcnMpWzBdLnN0YXJ0IDw9IGNwIDw9IHRocy5zdGFydCsxXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWlyID0gXy5sYXN0IHBhaXJzXG4gICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3RhY2sucHVzaCB0aHNcbiAgICAgICAgXG4gICAgICAgIGlmIHBhaXI/XG4gICAgICAgICAgICBAaGlnaGxpZ2h0IHBhaXIsIGxpXG4gICAgICAgICAgICB0cnVlXG4gICAgICAgIFxuICAgIGhpZ2hsaWdodDogKHBhaXIsIGxpKSAtPlxuICAgICAgICBAY2xlYXIoKVxuICAgICAgICBbb3BuLGNsc10gPSBwYWlyXG4gICAgICAgIHBhaXJbMF0uY2xzcyA9IFwic3RyaW5nbWF0Y2ggI3tAZWRpdG9yLnN0cmluZ0NoYXJhY3RlcnNbb3BuLm1hdGNoXX1cIlxuICAgICAgICBwYWlyWzFdLmNsc3MgPSBcInN0cmluZ21hdGNoICN7QGVkaXRvci5zdHJpbmdDaGFyYWN0ZXJzW2Nscy5tYXRjaF19XCJcbiAgICAgICAgQGVkaXRvci5hZGRIaWdobGlnaHQgW2xpLCBbb3BuLnN0YXJ0LCBvcG4uc3RhcnQrb3BuLm1hdGNoLmxlbmd0aF0sIHBhaXJbMF1dXG4gICAgICAgIEBlZGl0b3IuYWRkSGlnaGxpZ2h0IFtsaSwgW2Nscy5zdGFydCwgY2xzLnN0YXJ0K2Nscy5tYXRjaC5sZW5ndGhdLCBwYWlyWzFdXVxuICAgICAgICBAZWRpdG9yLnJlbmRlckhpZ2hsaWdodHMoKVxuICAgICAgICBcbiAgICBjbGVhcjogLT5cbiAgICAgICAgQGVkaXRvci5zZXRIaWdobGlnaHRzIEBlZGl0b3IuaGlnaGxpZ2h0cygpLmZpbHRlciAoaCkgLT4gbm90IGhbMl0/LmNsc3M/LnN0YXJ0c1dpdGggJ3N0cmluZ21hdGNoJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmluZ3NcbiJdfQ==
//# sourceURL=../../coffee/editor/strings.coffee