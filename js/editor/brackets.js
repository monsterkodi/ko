// koffee 1.19.0

/*
0000000    00000000    0000000    0000000  000   000  00000000  000000000   0000000
000   000  000   000  000   000  000       000  000   000          000     000     
0000000    0000000    000000000  000       0000000    0000000      000     0000000 
000   000  000   000  000   000  000       000  000   000          000          000
0000000    000   000  000   000   0000000  000   000  00000000     000     0000000
 */
var Brackets, _, matchr, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), _ = ref._, matchr = ref.matchr;

Brackets = (function() {
    function Brackets(editor) {
        this.editor = editor;
        this.onCursor = bind(this.onCursor, this);
        this.setupConfig = bind(this.setupConfig, this);
        this.editor.on('cursor', this.onCursor);
        this.editor.on('fileTypeChanged', this.setupConfig);
        this.setupConfig();
    }

    Brackets.prototype.setupConfig = function() {
        this.open = this.editor.bracketCharacters.open;
        return this.config = this.editor.bracketCharacters.regexps;
    };

    Brackets.prototype.onCursor = function() {
        var after, before, cp, h, j, len, ref1, ref2;
        if (this.editor.numHighlights()) {
            ref1 = this.editor.highlights();
            for (j = 0, len = ref1.length; j < len; j++) {
                h = ref1[j];
                if (h[2] == null) {
                    return;
                }
            }
        }
        cp = this.editor.cursorPos();
        ref2 = this.beforeAfterForPos(cp), before = ref2[0], after = ref2[1];
        if (after.length || before.length) {
            if (after.length && _.first(after).start === cp[0] && _.first(after).clss === 'open') {
                cp[0] += 1;
            }
            if (before.length && _.last(before).start === cp[0] - 1 && _.last(before).clss === 'close') {
                cp[0] -= 1;
            }
        }
        if (this.highlightInside(cp)) {
            return;
        }
        this.clear();
        return this.editor.renderHighlights();
    };

    Brackets.prototype.highlightInside = function(pos) {
        var after, before, cnt, firstClose, lastOpen, next, pp, prev, ref1, ref2, stack;
        stack = [];
        pp = pos;
        cnt = 0;
        while (pp[1] >= 0) {
            ref1 = this.beforeAfterForPos(pp), before = ref1[0], after = ref1[1];
            while (before.length) {
                prev = before.pop();
                if (prev.clss === 'open') {
                    if (stack.length) {
                        if (this.open[prev.match] === _.last(stack).match) {
                            stack.pop();
                            continue;
                        } else {
                            return;
                        }
                    }
                    lastOpen = prev;
                    break;
                } else {
                    stack.push(prev);
                }
            }
            if (lastOpen != null) {
                break;
            }
            if (pp[1] < 1) {
                return;
            }
            if (cnt++ > 1000) {
                return;
            }
            pp = [this.editor.line(pp[1] - 1).length, pp[1] - 1];
        }
        if (lastOpen == null) {
            return;
        }
        stack = [];
        pp = pos;
        while (pp[1] <= this.editor.numLines()) {
            ref2 = this.beforeAfterForPos(pp), before = ref2[0], after = ref2[1];
            while (after.length) {
                next = after.shift();
                if (next.clss === 'close') {
                    if (stack.length) {
                        if (this.open[_.last(stack).match] === next.match) {
                            stack.pop();
                            continue;
                        } else {
                            return;
                        }
                    }
                    firstClose = next;
                    break;
                } else {
                    stack.push(next);
                }
            }
            if (firstClose != null) {
                break;
            }
            if (pp[1] >= this.editor.numLines() - 1) {
                return;
            }
            if (cnt++ > 1000) {
                return;
            }
            pp = [0, pp[1] + 1];
        }
        if (firstClose == null) {
            return;
        }
        if (this.open[lastOpen.match] === firstClose.match) {
            this.highlight(lastOpen, firstClose);
            return true;
        }
    };

    Brackets.prototype.beforeAfterForPos = function(pos) {
        var after, before, cp, firstAfterIndex, fst, i, j, k, len, li, line, lst, r, ref1, rngs;
        cp = pos[0], li = pos[1];
        line = this.editor.line(li);
        rngs = matchr.ranges(this.config, line);
        i = rngs.length - 1;
        while (i >= 0) {
            if (rngs[i].start > 0 && line[rngs[i].start - 1] === '\\') {
                rngs.splice(i, 1);
            }
            i -= 1;
        }
        i = rngs.length - 1;
        while (i > 0) {
            if (rngs[i - 1].clss === 'open' && rngs[i].clss === 'close' && this.open[rngs[i - 1].match] === rngs[i].match && rngs[i - 1].start === rngs[i].start - 1) {
                rngs.splice(i - 1, 2);
                i -= 1;
            }
            i -= 1;
        }
        if (rngs.length) {
            for (j = 0, len = rngs.length; j < len; j++) {
                r = rngs[j];
                r.line = li;
            }
            lst = _.last(rngs);
            fst = _.first(rngs);
            for (firstAfterIndex = k = 0, ref1 = rngs.length; 0 <= ref1 ? k < ref1 : k > ref1; firstAfterIndex = 0 <= ref1 ? ++k : --k) {
                if (rngs[firstAfterIndex].start >= cp) {
                    break;
                }
            }
            before = rngs.slice(0, firstAfterIndex);
            after = rngs.slice(firstAfterIndex);
            return [before, after];
        }
        return [[], []];
    };

    Brackets.prototype.highlight = function(opn, cls) {
        this.clear();
        opn.clss = 'bracketmatch';
        cls.clss = 'bracketmatch';
        this.editor.addHighlight([opn.line, [opn.start, opn.start + opn.match.length], opn]);
        this.editor.addHighlight([cls.line, [cls.start, cls.start + cls.match.length], cls]);
        return this.editor.renderHighlights();
    };

    Brackets.prototype.clear = function() {
        return this.editor.setHighlights(this.editor.highlights().filter(function(h) {
            var ref1;
            return ((ref1 = h[2]) != null ? ref1.clss : void 0) !== 'bracketmatch';
        }));
    };

    return Brackets;

})();

module.exports = Brackets;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhY2tldHMuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2VkaXRvciIsInNvdXJjZXMiOlsiYnJhY2tldHMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHdCQUFBO0lBQUE7O0FBUUEsTUFBZ0IsT0FBQSxDQUFRLEtBQVIsQ0FBaEIsRUFBRSxTQUFGLEVBQUs7O0FBRUM7SUFFQyxrQkFBQyxNQUFEO1FBQUMsSUFBQyxDQUFBLFNBQUQ7OztRQUVBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFFBQVgsRUFBNkIsSUFBQyxDQUFBLFFBQTlCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsaUJBQVgsRUFBNkIsSUFBQyxDQUFBLFdBQTlCO1FBRUEsSUFBQyxDQUFBLFdBQUQsQ0FBQTtJQUxEOzt1QkFPSCxXQUFBLEdBQWEsU0FBQTtRQUVULElBQUMsQ0FBQSxJQUFELEdBQVUsSUFBQyxDQUFBLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztlQUNwQyxJQUFDLENBQUEsTUFBRCxHQUFVLElBQUMsQ0FBQSxNQUFNLENBQUMsaUJBQWlCLENBQUM7SUFIM0I7O3VCQVdiLFFBQUEsR0FBVSxTQUFBO0FBRU4sWUFBQTtRQUFBLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxhQUFSLENBQUEsQ0FBSDtBQUNJO0FBQUEsaUJBQUEsc0NBQUE7O2dCQUNJLElBQWMsWUFBZDtBQUFBLDJCQUFBOztBQURKLGFBREo7O1FBSUEsRUFBQSxHQUFLLElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBUixDQUFBO1FBQ0wsT0FBa0IsSUFBQyxDQUFBLGlCQUFELENBQW1CLEVBQW5CLENBQWxCLEVBQUMsZ0JBQUQsRUFBUztRQUVULElBQUcsS0FBSyxDQUFDLE1BQU4sSUFBZ0IsTUFBTSxDQUFDLE1BQTFCO1lBQ0ksSUFBRyxLQUFLLENBQUMsTUFBTixJQUFpQixDQUFDLENBQUMsS0FBRixDQUFRLEtBQVIsQ0FBYyxD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QUFDLElBQUosR0FBVztRQUNYLEdBQUcsQ0FBQyxJQUFKLEdBQVc7UUFDWCxJQUFDLENBQUEsTUFBTSxDQUFDLFlBQVIsQ0FBcUIsQ0FBQyxHQUFHLENBQUMsSUFBTCxFQUFXLENBQUMsR0FBRyxDQUFDLEtBQUwsRUFBWSxHQUFHLENBQUMsS0FBSixHQUFVLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBaEMsQ0FBWCxFQUFvRCxHQUFwRCxDQUFyQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsWUFBUixDQUFxQixDQUFDLEdBQUcsQ0FBQyxJQUFMLEVBQVcsQ0FBQyxHQUFHLENBQUMsS0FBTCxFQUFZLEdBQUcsQ0FBQyxLQUFKLEdBQVUsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFoQyxDQUFYLEVBQW9ELEdBQXBELENBQXJCO2VBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQkFBUixDQUFBO0lBUE87O3VCQWVYLEtBQUEsR0FBTyxTQUFBO2VBRUgsSUFBQyxDQUFBLE1BQU0sQ0FBQyxhQUFSLENBQXNCLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBUixDQUFBLENBQW9CLENBQUMsTUFBckIsQ0FBNEIsU0FBQyxDQUFEO0FBQU8sZ0JBQUE7Z0RBQUksQ0FBRSxjQUFOLEtBQWM7UUFBckIsQ0FBNUIsQ0FBdEI7SUFGRzs7Ozs7O0FBSVgsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgICAgICAgMDAwXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwIFxuIyMjXG5cbnsgXywgbWF0Y2hyIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIEJyYWNrZXRzXG4gICAgXG4gICAgQDogKEBlZGl0b3IpIC0+XG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLm9uICdjdXJzb3InICAgICAgICAgIEBvbkN1cnNvclxuICAgICAgICBAZWRpdG9yLm9uICdmaWxlVHlwZUNoYW5nZWQnIEBzZXR1cENvbmZpZ1xuICAgICAgICBcbiAgICAgICAgQHNldHVwQ29uZmlnKClcbiAgICAgICAgICAgIFxuICAgIHNldHVwQ29uZmlnOiA9PiBcblxuICAgICAgICBAb3BlbiAgID0gQGVkaXRvci5icmFja2V0Q2hhcmFjdGVycy5vcGVuXG4gICAgICAgIEBjb25maWcgPSBAZWRpdG9yLmJyYWNrZXRDaGFyYWN0ZXJzLnJlZ2V4cHNcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG9uQ3Vyc29yOiA9PiBcblxuICAgICAgICBpZiBAZWRpdG9yLm51bUhpZ2hsaWdodHMoKSAjIGRvbid0IGhpZ2hsaWdodCBicmFja2V0cyB3aGVuIG90aGVyIGhpZ2hsaWdodHMgZXhpc3RcbiAgICAgICAgICAgIGZvciBoIGluIEBlZGl0b3IuaGlnaGxpZ2h0cygpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIG5vdCBoWzJdP1xuICAgICAgICAgICAgICAgIFxuICAgICAgICBjcCA9IEBlZGl0b3IuY3Vyc29yUG9zKClcbiAgICAgICAgW2JlZm9yZSwgYWZ0ZXJdID0gQGJlZm9yZUFmdGVyRm9yUG9zIGNwXG5cbiAgICAgICAgaWYgYWZ0ZXIubGVuZ3RoIG9yIGJlZm9yZS5sZW5ndGhcbiAgICAgICAgICAgIGlmIGFmdGVyLmxlbmd0aCBhbmQgXy5maXJzdChhZnRlcikuc3RhcnQgPT0gY3BbMF0gYW5kIF8uZmlyc3QoYWZ0ZXIpLmNsc3MgPT0gJ29wZW4nIHRoZW4gY3BbMF0gKz0gMVxuICAgICAgICAgICAgaWYgYmVmb3JlLmxlbmd0aCBhbmQgXy5sYXN0KGJlZm9yZSkuc3RhcnQgPT0gY3BbMF0tMSBhbmQgXy5sYXN0KGJlZm9yZSkuY2xzcyA9PSAnY2xvc2UnIHRoZW4gY3BbMF0gLT0gMVxuXG4gICAgICAgIGlmIEBoaWdobGlnaHRJbnNpZGUgY3BcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIEBjbGVhcigpXG4gICAgICAgIEBlZGl0b3IucmVuZGVySGlnaGxpZ2h0cygpXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBoaWdobGlnaHRJbnNpZGU6IChwb3MpIC0+XG4gICAgICAgIFxuICAgICAgICBzdGFjayA9IFtdXG4gICAgICAgIHBwICAgID0gcG9zXG4gICAgICAgIGNudCAgID0gMFxuICAgICAgICB3aGlsZSBwcFsxXSA+PSAwICMgZmluZCBsYXN0IG9wZW4gYnJhY2tldCBiZWZvcmVcbiAgICAgICAgICAgIFtiZWZvcmUsIGFmdGVyXSA9IEBiZWZvcmVBZnRlckZvclBvcyBwcFxuICAgICAgICAgICAgd2hpbGUgYmVmb3JlLmxlbmd0aCBcbiAgICAgICAgICAgICAgICBwcmV2ID0gYmVmb3JlLnBvcCgpXG4gICAgICAgICAgICAgICAgaWYgcHJldi5jbHNzID09ICdvcGVuJ1xuICAgICAgICAgICAgICAgICAgICBpZiBzdGFjay5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIEBvcGVuW3ByZXYubWF0Y2hdID09IF8ubGFzdChzdGFjaykubWF0Y2hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5wb3AoKSAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAjIHN0YWNrIG1pc21hdGNoXG4gICAgICAgICAgICAgICAgICAgIGxhc3RPcGVuID0gcHJldlxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIGVsc2UgIyBpZiBwcmV2IGlzICdjbG9zZSdcbiAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaCBwcmV2XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGJyZWFrIGlmIGxhc3RPcGVuP1xuICAgICAgICAgICAgcmV0dXJuIGlmIHBwWzFdIDwgMVxuICAgICAgICAgICAgcmV0dXJuIGlmIGNudCsrID4gMTAwMCAjIG1heGltdW0gbnVtYmVyIG9mIGxpbmVzIGV4Y2VlZGVkXG4gICAgICAgICAgICBwcCA9IFtAZWRpdG9yLmxpbmUocHBbMV0tMSkubGVuZ3RoLCBwcFsxXS0xXVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBsYXN0T3Blbj9cbiAgICAgICAgXG4gICAgICAgIHN0YWNrID0gW11cbiAgICAgICAgcHAgPSBwb3NcbiAgICAgICAgd2hpbGUgcHBbMV0gPD0gQGVkaXRvci5udW1MaW5lcygpICMgZmluZCBmaXJzdCBjbG9zZSBicmFja2V0IGFmdGVyXG4gICAgICAgICAgICBbYmVmb3JlLCBhZnRlcl0gPSBAYmVmb3JlQWZ0ZXJGb3JQb3MgcHBcbiAgICAgICAgICAgIHdoaWxlIGFmdGVyLmxlbmd0aFxuICAgICAgICAgICAgICAgIG5leHQgPSBhZnRlci5zaGlmdCgpXG4gICAgICAgICAgICAgICAgaWYgbmV4dC5jbHNzID09ICdjbG9zZSdcbiAgICAgICAgICAgICAgICAgICAgaWYgc3RhY2subGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBAb3BlbltfLmxhc3Qoc3RhY2spLm1hdGNoXSA9PSBuZXh0Lm1hdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2sucG9wKCkgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gIyBzdGFjayBtaXNtYXRjaFxuICAgICAgICAgICAgICAgICAgICBmaXJzdENsb3NlID0gbmV4dFxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIGVsc2UgIyBpZiBuZXh0IGlzICdvcGVuJ1xuICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoIG5leHRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGJyZWFrIGlmIGZpcnN0Q2xvc2U/XG4gICAgICAgICAgICByZXR1cm4gaWYgcHBbMV0gPj0gQGVkaXRvci5udW1MaW5lcygpLTFcbiAgICAgICAgICAgIHJldHVybiBpZiBjbnQrKyA+IDEwMDAgIyBtYXhpbXVtIG51bWJlciBvZiBsaW5lcyBleGNlZWRlZFxuICAgICAgICAgICAgcHAgPSBbMCwgcHBbMV0rMV1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgZmlyc3RDbG9zZT9cbiAgICAgICAgXG4gICAgICAgIGlmIEBvcGVuW2xhc3RPcGVuLm1hdGNoXSA9PSBmaXJzdENsb3NlLm1hdGNoXG4gICAgICAgICAgICBAaGlnaGxpZ2h0IGxhc3RPcGVuLCBmaXJzdENsb3NlXG4gICAgICAgICAgICB0cnVlXG4gICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwICAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBiZWZvcmVBZnRlckZvclBvczogKHBvcykgLT5cbiAgICAgICAgXG4gICAgICAgIFtjcCwgbGldID0gcG9zXG4gICAgICAgIGxpbmUgPSBAZWRpdG9yLmxpbmUobGkpXG4gICAgICAgIHJuZ3MgPSBtYXRjaHIucmFuZ2VzIEBjb25maWcsIGxpbmUgICAgIFxuICAgICAgICBcbiAgICAgICAgaSA9IHJuZ3MubGVuZ3RoLTFcbiAgICAgICAgd2hpbGUgaSA+PSAwICMgcmVtb3ZlIGVzY2FwZWRcbiAgICAgICAgICAgIGlmIHJuZ3NbaV0uc3RhcnQgPiAwIGFuZCBsaW5lW3JuZ3NbaV0uc3RhcnQtMV0gPT0gJ1xcXFwnXG4gICAgICAgICAgICAgICAgcm5ncy5zcGxpY2UgaSwgMVxuICAgICAgICAgICAgaSAtPSAxXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpID0gcm5ncy5sZW5ndGgtMSBcbiAgICAgICAgd2hpbGUgaSA+IDAgIyByZW1vdmUgdHJpdmlhbDogKCksIHt9LCBbXVxuICAgICAgICAgICAgaWYgcm5nc1tpLTFdLmNsc3MgPT0gJ29wZW4nIGFuZCBybmdzW2ldLmNsc3MgPT0gJ2Nsb3NlJyBhbmRcbiAgICAgICAgICAgICAgICBAb3BlbltybmdzW2ktMV0ubWF0Y2hdID09IHJuZ3NbaV0ubWF0Y2ggYW5kIFxuICAgICAgICAgICAgICAgICAgICBybmdzW2ktMV0uc3RhcnQgPT0gcm5nc1tpXS5zdGFydCAtIDFcbiAgICAgICAgICAgICAgICAgICAgICAgIHJuZ3Muc3BsaWNlIGktMSwgMlxuICAgICAgICAgICAgICAgICAgICAgICAgaSAtPSAxXG4gICAgICAgICAgICBpIC09IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgcm5ncy5sZW5ndGhcbiAgICAgICAgICAgIHIubGluZSA9IGxpIGZvciByIGluIHJuZ3NcbiAgICAgICAgICAgIGxzdCA9IF8ubGFzdCBybmdzXG4gICAgICAgICAgICBmc3QgPSBfLmZpcnN0IHJuZ3NcbiAgICAgICAgICAgIGZvciBmaXJzdEFmdGVySW5kZXggaW4gWzAuLi5ybmdzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICBicmVhayBpZiBybmdzW2ZpcnN0QWZ0ZXJJbmRleF0uc3RhcnQgPj0gY3BcbiAgICAgICAgICAgIGJlZm9yZSA9IHJuZ3Muc2xpY2UgMCwgZmlyc3RBZnRlckluZGV4XG4gICAgICAgICAgICBhZnRlciAgPSBybmdzLnNsaWNlIGZpcnN0QWZ0ZXJJbmRleFxuICAgICAgICAgICAgcmV0dXJuIFtiZWZvcmUsIGFmdGVyXVxuICAgICAgICBbW10sW11dXG4gICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgaGlnaGxpZ2h0OiAob3BuLCBjbHMpIC0+XG4gICAgICAgIFxuICAgICAgICBAY2xlYXIoKVxuICAgICAgICBvcG4uY2xzcyA9ICdicmFja2V0bWF0Y2gnXG4gICAgICAgIGNscy5jbHNzID0gJ2JyYWNrZXRtYXRjaCdcbiAgICAgICAgQGVkaXRvci5hZGRIaWdobGlnaHQgW29wbi5saW5lLCBbb3BuLnN0YXJ0LCBvcG4uc3RhcnQrb3BuLm1hdGNoLmxlbmd0aF0sIG9wbl1cbiAgICAgICAgQGVkaXRvci5hZGRIaWdobGlnaHQgW2Nscy5saW5lLCBbY2xzLnN0YXJ0LCBjbHMuc3RhcnQrY2xzLm1hdGNoLmxlbmd0aF0sIGNsc11cbiAgICAgICAgQGVkaXRvci5yZW5kZXJIaWdobGlnaHRzKClcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBjbGVhcjogLT5cbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3Iuc2V0SGlnaGxpZ2h0cyBAZWRpdG9yLmhpZ2hsaWdodHMoKS5maWx0ZXIgKGgpIC0+IGhbMl0/LmNsc3MgIT0gJ2JyYWNrZXRtYXRjaCdcblxubW9kdWxlLmV4cG9ydHMgPSBCcmFja2V0c1xuIl19
//# sourceURL=../../coffee/editor/brackets.coffee