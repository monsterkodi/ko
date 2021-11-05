// koffee 1.16.0

/*
000   000  000   000  00     00  0000000    00000000  00000000    0000000
0000  000  000   000  000   000  000   000  000       000   000  000
000 0 000  000   000  000000000  0000000    0000000   0000000    0000000
000  0000  000   000  000 0 000  000   000  000       000   000       000
000   000   0000000   000   000  0000000    00000000  000   000  0000000
 */
var $, Numbers, elem, event, ref, setStyle,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = Object.hasOwn,
    indexOf = [].indexOf;

ref = require('kxk'), $ = ref.$, elem = ref.elem, setStyle = ref.setStyle;

event = require('events');

Numbers = (function(superClass) {
    extend(Numbers, superClass);

    function Numbers(editor) {
        this.editor = editor;
        this.updateColor = bind(this.updateColor, this);
        this.updateColors = bind(this.updateColors, this);
        this.onFontSizeChange = bind(this.onFontSizeChange, this);
        this.onClearLines = bind(this.onClearLines, this);
        this.onLinesShifted = bind(this.onLinesShifted, this);
        this.onLinesShown = bind(this.onLinesShown, this);
        Numbers.__super__.constructor.call(this);
        this.lineDivs = {};
        this.elem = $('.numbers', this.editor.view);
        this.editor.on('clearLines', this.onClearLines);
        this.editor.on('linesShown', this.onLinesShown);
        this.editor.on('linesShifted', this.onLinesShifted);
        this.editor.on('fontSizeChanged', this.onFontSizeChange);
        this.editor.on('highlight', this.updateColors);
        this.editor.on('changed', this.updateColors);
        this.editor.on('linesSet', this.updateColors);
        this.onFontSizeChange();
    }

    Numbers.prototype.onLinesShown = function(top, bot, num) {
        var div, i, li, ref1, ref2;
        this.elem.innerHTML = '';
        this.lineDivs = {};
        for (li = i = ref1 = top, ref2 = bot; ref1 <= ref2 ? i <= ref2 : i >= ref2; li = ref1 <= ref2 ? ++i : --i) {
            div = this.addLine(li);
            this.emit('numberAdded', {
                numberDiv: div,
                numberSpan: div.firstChild,
                lineIndex: li
            });
            this.updateColor(li);
        }
        return this.updateLinePositions();
    };

    Numbers.prototype.onLinesShifted = function(top, bot, num) {
        var divInto, oldBot, oldTop;
        oldTop = top - num;
        oldBot = bot - num;
        divInto = (function(_this) {
            return function(li, lo) {
                var numberDiv, numberSpan;
                if (!_this.lineDivs[lo]) {
                    console.log(_this.editor.name + ".onLinesShifted.divInto -- no number div? top " + top + " bot " + bot + " num " + num + " lo " + lo + " li " + li);
                    return;
                }
                numberDiv = _this.lineDivs[li] = _this.lineDivs[lo];
                delete _this.lineDivs[lo];
                numberSpan = numberDiv.firstChild;
                numberSpan.textContent = li + 1;
                _this.updateColor(li);
                return _this.emit('numberChanged', {
                    numberDiv: numberDiv,
                    numberSpan: numberSpan,
                    lineIndex: li
                });
            };
        })(this);
        if (num > 0) {
            while (oldBot < bot) {
                oldBot += 1;
                divInto(oldBot, oldTop);
                oldTop += 1;
            }
        } else {
            while (oldTop > top) {
                oldTop -= 1;
                divInto(oldTop, oldBot);
                oldBot -= 1;
            }
        }
        return this.updateLinePositions();
    };

    Numbers.prototype.updateLinePositions = function() {
        var div, li, ref1, results, y;
        ref1 = this.lineDivs;
        results = [];
        for (li in ref1) {
            div = ref1[li];
            if (!(div != null ? div.style : void 0)) {
                continue;
            }
            y = this.editor.size.lineHeight * (li - this.editor.scroll.top);
            results.push(div.style.transform = "translate3d(0, " + y + "px, 0)");
        }
        return results;
    };

    Numbers.prototype.addLine = function(li) {
        var div;
        div = elem({
            "class": 'linenumber',
            child: elem('span', {
                text: "" + (li + 1)
            })
        });
        div.style.height = this.editor.size.lineHeight + "px";
        this.lineDivs[li] = div;
        this.elem.appendChild(div);
        return div;
    };

    Numbers.prototype.onClearLines = function() {
        this.lineDivs = {};
        return this.elem.innerHTML = "";
    };

    Numbers.prototype.onFontSizeChange = function() {
        var fsz;
        fsz = Math.min(22, this.editor.size.fontSize - 4);
        this.elem.style.fontSize = fsz + "px";
        return setStyle('.linenumber', 'padding-top', (parseInt(this.editor.size.fontSize / 10)) + "px");
    };

    Numbers.prototype.updateColors = function() {
        var i, li, ref1, ref2, results;
        if (this.editor.scroll.bot > this.editor.scroll.top) {
            results = [];
            for (li = i = ref1 = this.editor.scroll.top, ref2 = this.editor.scroll.bot; ref1 <= ref2 ? i <= ref2 : i >= ref2; li = ref1 <= ref2 ? ++i : --i) {
                results.push(this.updateColor(li));
            }
            return results;
        }
    };

    Numbers.prototype.updateColor = function(li) {
        var ci, cls, hi, s, si;
        if (this.lineDivs[li] == null) {
            return;
        }
        if ((this.lineDivs[li].firstChild != null) && this.lineDivs[li].firstChild.classList.contains('gitInfoLine')) {
            return;
        }
        si = (function() {
            var i, len, ref1, results;
            ref1 = rangesFromTopToBotInRanges(li, li, this.editor.selections());
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
                s = ref1[i];
                results.push(s[0]);
            }
            return results;
        }).call(this);
        hi = (function() {
            var i, len, ref1, results;
            ref1 = rangesFromTopToBotInRanges(li, li, this.editor.highlights());
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
                s = ref1[i];
                results.push(s[0]);
            }
            return results;
        }).call(this);
        ci = (function() {
            var i, len, ref1, results;
            ref1 = rangesFromTopToBotInRanges(li, li, rangesFromPositions(this.editor.cursors()));
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
                s = ref1[i];
                results.push(s[0]);
            }
            return results;
        }).call(this);
        cls = '';
        if (indexOf.call(ci, li) >= 0) {
            cls += ' cursored';
        }
        if (li === this.editor.mainCursor()[1]) {
            cls += ' main';
        }
        if (indexOf.call(si, li) >= 0) {
            cls += ' selected';
        }
        if (indexOf.call(hi, li) >= 0) {
            cls += ' highligd';
        }
        return this.lineDivs[li].className = 'linenumber' + cls;
    };

    return Numbers;

})(event);

module.exports = Numbers;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVtYmVycy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvZWRpdG9yIiwic291cmNlcyI6WyJudW1iZXJzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxzQ0FBQTtJQUFBOzs7OztBQVFBLE1BQXdCLE9BQUEsQ0FBUSxLQUFSLENBQXhCLEVBQUUsU0FBRixFQUFLLGVBQUwsRUFBVzs7QUFFWCxLQUFBLEdBQVEsT0FBQSxDQUFRLFFBQVI7O0FBRUY7OztJQUVDLGlCQUFDLE1BQUQ7UUFBQyxJQUFDLENBQUEsU0FBRDs7Ozs7OztRQUVBLHVDQUFBO1FBRUEsSUFBQyxDQUFBLFFBQUQsR0FBWTtRQUVaLElBQUMsQ0FBQSxJQUFELEdBQU8sQ0FBQSxDQUFFLFVBQUYsRUFBYSxJQUFDLENBQUEsTUFBTSxDQUFDLElBQXJCO1FBRVAsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsWUFBWCxFQUE4QixJQUFDLENBQUEsWUFBL0I7UUFFQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxZQUFYLEVBQThCLElBQUMsQ0FBQSxZQUEvQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLGNBQVgsRUFBOEIsSUFBQyxDQUFBLGNBQS9CO1FBRUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsaUJBQVgsRUFBOEIsSUFBQyxDQUFBLGdCQUEvQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFdBQVgsRUFBOEIsSUFBQyxDQUFBLFlBQS9CO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsU0FBWCxFQUE4QixJQUFDLENBQUEsWUFBL0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxVQUFYLEVBQThCLElBQUMsQ0FBQSxZQUEvQjtRQUVBLElBQUMsQ0FBQSxnQkFBRCxDQUFBO0lBbEJEOztzQkEwQkgsWUFBQSxHQUFjLFNBQUMsR0FBRCxF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RyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsUUFBbkMsQ0FBNEMsYUFBNUMsQ0FBakM7QUFDSSxtQkFESjs7UUFHQSxFQUFBOztBQUFNO0FBQUE7aUJBQUEsc0NBQUE7OzZCQUFBLENBQUUsQ0FBQSxDQUFBO0FBQUY7OztRQUNOLEVBQUE7O0FBQU07QUFBQTtpQkFBQSxzQ0FBQTs7NkJBQUEsQ0FBRSxDQUFBLENBQUE7QUFBRjs7O1FBQ04sRUFBQTs7QUFBTTtBQUFBO2lCQUFBLHNDQUFBOzs2QkFBQSxDQUFFLENBQUEsQ0FBQTtBQUFGOzs7UUFFTixHQUFBLEdBQU07UUFDTixJQUFHLGFBQU0sRUFBTixFQUFBLEVBQUEsTUFBSDtZQUNJLEdBQUEsSUFBTyxZQURYOztRQUVBLElBQUcsRUFBQSxLQUFNLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBUixDQUFBLENBQXFCLENBQUEsQ0FBQSxDQUE5QjtZQUNJLEdBQUEsSUFBTyxRQURYOztRQUVBLElBQUcsYUFBTSxFQUFOLEVBQUEsRUFBQSxNQUFIO1lBQ0ksR0FBQSxJQUFPLFlBRFg7O1FBRUEsSUFBRyxhQUFNLEVBQU4sRUFBQSxFQUFBLE1BQUg7WUFDSSxHQUFBLElBQU8sWUFEWDs7ZUFHQSxJQUFDLENBQUEsUUFBUyxDQUFBLEVBQUEsQ0FBRyxDQUFDLFNBQWQsR0FBMEIsWUFBQSxHQUFlO0lBcEJoQzs7OztHQS9JSzs7QUFxS3RCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwXG4wMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMFxuMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwXG4wMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4wMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcbiMjI1xuXG57ICQsIGVsZW0sIHNldFN0eWxlIH0gPSByZXF1aXJlICdreGsnXG5cbmV2ZW50ID0gcmVxdWlyZSAnZXZlbnRzJ1xuXG5jbGFzcyBOdW1iZXJzIGV4dGVuZHMgZXZlbnRcblxuICAgIEA6IChAZWRpdG9yKSAtPlxuXG4gICAgICAgIHN1cGVyKClcbiAgICAgICAgXG4gICAgICAgIEBsaW5lRGl2cyA9IHt9XG5cbiAgICAgICAgQGVsZW0gPSQgJy5udW1iZXJzJyBAZWRpdG9yLnZpZXdcblxuICAgICAgICBAZWRpdG9yLm9uICdjbGVhckxpbmVzJyAgICAgICBAb25DbGVhckxpbmVzXG5cbiAgICAgICAgQGVkaXRvci5vbiAnbGluZXNTaG93bicgICAgICAgQG9uTGluZXNTaG93blxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lc1NoaWZ0ZWQnICAgICBAb25MaW5lc1NoaWZ0ZWRcblxuICAgICAgICBAZWRpdG9yLm9uICdmb250U2l6ZUNoYW5nZWQnICBAb25Gb250U2l6ZUNoYW5nZVxuICAgICAgICBAZWRpdG9yLm9uICdoaWdobGlnaHQnICAgICAgICBAdXBkYXRlQ29sb3JzXG4gICAgICAgIEBlZGl0b3Iub24gJ2NoYW5nZWQnICAgICAgICAgIEB1cGRhdGVDb2xvcnNcbiAgICAgICAgQGVkaXRvci5vbiAnbGluZXNTZXQnICAgICAgICAgQHVwZGF0ZUNvbG9yc1xuICAgICAgICBcbiAgICAgICAgQG9uRm9udFNpemVDaGFuZ2UoKVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwICAgMDAwXG5cbiAgICBvbkxpbmVzU2hvd246ICh0b3AsIGJvdCwgbnVtKSA9PlxuXG4gICAgICAgIEBlbGVtLmlubmVySFRNTCA9ICcnXG4gICAgICAgIEBsaW5lRGl2cyA9IHt9XG5cbiAgICAgICAgZm9yIGxpIGluIFt0b3AuLmJvdF1cblxuICAgICAgICAgICAgZGl2ID0gQGFkZExpbmUgbGlcblxuICAgICAgICAgICAgQGVtaXQgJ251bWJlckFkZGVkJyxcbiAgICAgICAgICAgICAgICBudW1iZXJEaXY6ICBkaXZcbiAgICAgICAgICAgICAgICBudW1iZXJTcGFuOiBkaXYuZmlyc3RDaGlsZFxuICAgICAgICAgICAgICAgIGxpbmVJbmRleDogIGxpXG5cbiAgICAgICAgICAgIEB1cGRhdGVDb2xvciBsaVxuICAgIFxuICAgICAgICBAdXBkYXRlTGluZVBvc2l0aW9ucygpXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAgICAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIG9uTGluZXNTaGlmdGVkOiAodG9wLCBib3QsIG51bSkgPT5cblxuICAgICAgICBvbGRUb3AgPSB0b3AgLSBudW1cbiAgICAgICAgb2xkQm90ID0gYm90IC0gbnVtXG5cbiAgICAgICAgZGl2SW50byA9IChsaSxsbykgPT5cblxuICAgICAgICAgICAgaWYgbm90IEBsaW5lRGl2c1tsb11cbiAgICAgICAgICAgICAgICBsb2cgXCIje0BlZGl0b3IubmFtZX0ub25MaW5lc1NoaWZ0ZWQuZGl2SW50byAtLSBubyBudW1iZXIgZGl2PyB0b3AgI3t0b3B9IGJvdCAje2JvdH0gbnVtICN7bnVtfSBsbyAje2xvfSBsaSAje2xpfVwiXG4gICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICAgIG51bWJlckRpdiA9IEBsaW5lRGl2c1tsaV0gPSBAbGluZURpdnNbbG9dXG4gICAgICAgICAgICBkZWxldGUgQGxpbmVEaXZzW2xvXVxuXG4gICAgICAgICAgICBudW1iZXJTcGFuID0gbnVtYmVyRGl2LmZpcnN0Q2hpbGRcbiAgICAgICAgICAgIG51bWJlclNwYW4udGV4dENvbnRlbnQgPSBsaSsxXG4gICAgICAgICAgICBAdXBkYXRlQ29sb3IgbGlcbiAgICAgICAgICAgIEBlbWl0ICdudW1iZXJDaGFuZ2VkJyxcbiAgICAgICAgICAgICAgICBudW1iZXJEaXY6ICBudW1iZXJEaXZcbiAgICAgICAgICAgICAgICBudW1iZXJTcGFuOiBudW1iZXJTcGFuXG4gICAgICAgICAgICAgICAgbGluZUluZGV4OiAgbGlcblxuICAgICAgICBpZiBudW0gPiAwXG4gICAgICAgICAgICB3aGlsZSBvbGRCb3QgPCBib3RcbiAgICAgICAgICAgICAgICBvbGRCb3QgKz0gMVxuICAgICAgICAgICAgICAgIGRpdkludG8gb2xkQm90LCBvbGRUb3BcbiAgICAgICAgICAgICAgICBvbGRUb3AgKz0gMVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB3aGlsZSBvbGRUb3AgPiB0b3BcbiAgICAgICAgICAgICAgICBvbGRUb3AgLT0gMVxuICAgICAgICAgICAgICAgIGRpdkludG8gb2xkVG9wLCBvbGRCb3RcbiAgICAgICAgICAgICAgICBvbGRCb3QgLT0gMVxuXG4gICAgICAgIEB1cGRhdGVMaW5lUG9zaXRpb25zKClcblxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDBcblxuICAgIHVwZGF0ZUxpbmVQb3NpdGlvbnM6IC0+XG5cbiAgICAgICAgZm9yIGxpLCBkaXYgb2YgQGxpbmVEaXZzXG4gICAgICAgICAgICBjb250aW51ZSBpZiBub3QgZGl2Py5zdHlsZVxuICAgICAgICAgICAgeSA9IEBlZGl0b3Iuc2l6ZS5saW5lSGVpZ2h0ICogKGxpIC0gQGVkaXRvci5zY3JvbGwudG9wKVxuICAgICAgICAgICAgZGl2LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlM2QoMCwgI3t5fXB4LCAwKVwiXG5cbiAgICBhZGRMaW5lOiAobGkpIC0+XG5cbiAgICAgICAgZGl2ID0gZWxlbSBjbGFzczonbGluZW51bWJlcicgY2hpbGQ6ZWxlbSAnc3BhbicgdGV4dDpcIiN7bGkrMX1cIlxuICAgICAgICBkaXYuc3R5bGUuaGVpZ2h0ID0gXCIje0BlZGl0b3Iuc2l6ZS5saW5lSGVpZ2h0fXB4XCJcbiAgICAgICAgQGxpbmVEaXZzW2xpXSA9IGRpdlxuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBkaXZcbiAgICAgICAgZGl2XG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcblxuICAgIG9uQ2xlYXJMaW5lczogPT5cblxuICAgICAgICBAbGluZURpdnMgPSB7fVxuICAgICAgICBAZWxlbS5pbm5lckhUTUwgPSBcIlwiXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICBvbkZvbnRTaXplQ2hhbmdlOiA9PlxuXG4gICAgICAgIGZzeiA9IE1hdGgubWluIDIyLCBAZWRpdG9yLnNpemUuZm9udFNpemUtNFxuICAgICAgICBAZWxlbS5zdHlsZS5mb250U2l6ZSA9IFwiI3tmc3p9cHhcIlxuICAgICAgICBzZXRTdHlsZSAnLmxpbmVudW1iZXInICdwYWRkaW5nLXRvcCcgXCIje3BhcnNlSW50IEBlZGl0b3Iuc2l6ZS5mb250U2l6ZS8xMH1weFwiXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIHVwZGF0ZUNvbG9yczogPT5cblxuICAgICAgICBpZiBAZWRpdG9yLnNjcm9sbC5ib3QgPiBAZWRpdG9yLnNjcm9sbC50b3BcbiAgICAgICAgICAgIGZvciBsaSBpbiBbQGVkaXRvci5zY3JvbGwudG9wLi5AZWRpdG9yLnNjcm9sbC5ib3RdXG4gICAgICAgICAgICAgICAgQHVwZGF0ZUNvbG9yIGxpXG5cbiAgICB1cGRhdGVDb2xvcjogKGxpKSA9PlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGxpbmVEaXZzW2xpXT8gIyBvazogZS5nLiBjb21tYW5kbGlzdFxuICAgICAgICBpZiBAbGluZURpdnNbbGldLmZpcnN0Q2hpbGQ/IGFuZCBAbGluZURpdnNbbGldLmZpcnN0Q2hpbGQuY2xhc3NMaXN0LmNvbnRhaW5zICdnaXRJbmZvTGluZSdcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIHNpID0gKHNbMF0gZm9yIHMgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgbGksIGxpLCBAZWRpdG9yLnNlbGVjdGlvbnMoKSlcbiAgICAgICAgaGkgPSAoc1swXSBmb3IgcyBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBsaSwgbGksIEBlZGl0b3IuaGlnaGxpZ2h0cygpKVxuICAgICAgICBjaSA9IChzWzBdIGZvciBzIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIGxpLCBsaSwgcmFuZ2VzRnJvbVBvc2l0aW9ucyBAZWRpdG9yLmN1cnNvcnMoKSlcblxuICAgICAgICBjbHMgPSAnJ1xuICAgICAgICBpZiBsaSBpbiBjaVxuICAgICAgICAgICAgY2xzICs9ICcgY3Vyc29yZWQnXG4gICAgICAgIGlmIGxpID09IEBlZGl0b3IubWFpbkN1cnNvcigpWzFdXG4gICAgICAgICAgICBjbHMgKz0gJyBtYWluJ1xuICAgICAgICBpZiBsaSBpbiBzaVxuICAgICAgICAgICAgY2xzICs9ICcgc2VsZWN0ZWQnXG4gICAgICAgIGlmIGxpIGluIGhpXG4gICAgICAgICAgICBjbHMgKz0gJyBoaWdobGlnZCdcblxuICAgICAgICBAbGluZURpdnNbbGldLmNsYXNzTmFtZSA9ICdsaW5lbnVtYmVyJyArIGNsc1xuXG5tb2R1bGUuZXhwb3J0cyA9IE51bWJlcnNcbiJdfQ==
//# sourceURL=../../coffee/editor/numbers.coffee