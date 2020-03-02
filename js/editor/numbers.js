// koffee 1.7.0

/*
000   000  000   000  00     00  0000000    00000000  00000000    0000000
0000  000  000   000  000   000  000   000  000       000   000  000
000 0 000  000   000  000000000  0000000    0000000   0000000    0000000
000  0000  000   000  000 0 000  000   000  000       000   000       000
000   000   0000000   000   000  0000000    00000000  000   000  0000000
 */
var $, Numbers, elem, event, ref, setStyle,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVtYmVycy5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsc0NBQUE7SUFBQTs7Ozs7QUFRQSxNQUF3QixPQUFBLENBQVEsS0FBUixDQUF4QixFQUFFLFNBQUYsRUFBSyxlQUFMLEVBQVc7O0FBRVgsS0FBQSxHQUFRLE9BQUEsQ0FBUSxRQUFSOztBQUVGOzs7SUFFQyxpQkFBQyxNQUFEO1FBQUMsSUFBQyxDQUFBLFNBQUQ7Ozs7Ozs7UUFFQSx1Q0FBQTtRQUVBLElBQUMsQ0FBQSxRQUFELEdBQVk7UUFFWixJQUFDLENBQUEsSUFBRCxHQUFPLENBQUEsQ0FBRSxVQUFGLEVBQWEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFyQjtRQUVQLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFlBQVgsRUFBOEIsSUFBQyxDQUFBLFlBQS9CO1FBRUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsWUFBWCxFQUE4QixJQUFDLENBQUEsWUFBL0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxjQUFYLEVBQThCLElBQUMsQ0FBQSxjQUEvQjtRQUVBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLGlCQUFYLEVBQThCLElBQUMsQ0FBQSxnQkFBL0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxXQUFYLEVBQThCLElBQUMsQ0FBQSxZQUEvQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFNBQVgsRUFBOEIsSUFBQyxDQUFBLFlBQS9CO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsVUFBWCxFQUE4QixJQUFDLENBQUEsWUFBL0I7UUFFQSxJQUFDLENBQUEsZ0JBQUQsQ0FBQTtJQWxCRDs7c0JBMEJILFlBQUEsR0FBYyxTQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWDtBQUVWLFlBQUE7UUFB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LENBQTRDLGFBQTVDLENBQWpDO0FBQ0ksbUJBREo7O1FBR0EsRUFBQTs7QUFBTTtBQUFBO2lCQUFBLHNDQUFBOzs2QkFBQSxDQUFFLENBQUEsQ0FBQTtBQUFGOzs7UUFDTixFQUFBOztBQUFNO0FBQUE7aUJBQUEsc0NBQUE7OzZCQUFBLENBQUUsQ0FBQSxDQUFBO0FBQUY7OztRQUNOLEVBQUE7O0FBQU07QUFBQTtpQkFBQSxzQ0FBQTs7NkJBQUEsQ0FBRSxDQUFBLENBQUE7QUFBRjs7O1FBRU4sR0FBQSxHQUFNO1FBQ04sSUFBRyxhQUFNLEVBQU4sRUFBQSxFQUFBLE1BQUg7WUFDSSxHQUFBLElBQU8sWUFEWDs7UUFFQSxJQUFHLEVBQUEsS0FBTSxJQUFDLENBQUEsTUFBTSxDQUFDLFVBQVIsQ0FBQSxDQUFxQixDQUFBLENBQUEsQ0FBOUI7WUFDSSxHQUFBLElBQU8sUUFEWDs7UUFFQSxJQUFHLGFBQU0sRUFBTixFQUFBLEVBQUEsTUFBSDtZQUNJLEdBQUEsSUFBTyxZQURYOztRQUVBLElBQUcsYUFBTSxFQUFOLEVBQUEsRUFBQSxNQUFIO1lBQ0ksR0FBQSxJQUFPLFlBRFg7O2VBR0EsSUFBQyxDQUFBLFFBQVMsQ0FBQSxFQUFBLENBQUcsQ0FBQyxTQUFkLEdBQTBCLFlBQUEsR0FBZTtJQXBCaEM7Ozs7R0EvSUs7O0FBcUt0QixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMFxuMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDBcbjAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMFxuMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG4jIyNcblxueyAkLCBlbGVtLCBzZXRTdHlsZSB9ID0gcmVxdWlyZSAna3hrJ1xuXG5ldmVudCA9IHJlcXVpcmUgJ2V2ZW50cydcblxuY2xhc3MgTnVtYmVycyBleHRlbmRzIGV2ZW50XG5cbiAgICBAOiAoQGVkaXRvcikgLT5cblxuICAgICAgICBzdXBlcigpXG4gICAgICAgIFxuICAgICAgICBAbGluZURpdnMgPSB7fVxuXG4gICAgICAgIEBlbGVtID0kICcubnVtYmVycycgQGVkaXRvci52aWV3XG5cbiAgICAgICAgQGVkaXRvci5vbiAnY2xlYXJMaW5lcycgICAgICAgQG9uQ2xlYXJMaW5lc1xuXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVzU2hvd24nICAgICAgIEBvbkxpbmVzU2hvd25cbiAgICAgICAgQGVkaXRvci5vbiAnbGluZXNTaGlmdGVkJyAgICAgQG9uTGluZXNTaGlmdGVkXG5cbiAgICAgICAgQGVkaXRvci5vbiAnZm9udFNpemVDaGFuZ2VkJyAgQG9uRm9udFNpemVDaGFuZ2VcbiAgICAgICAgQGVkaXRvci5vbiAnaGlnaGxpZ2h0JyAgICAgICAgQHVwZGF0ZUNvbG9yc1xuICAgICAgICBAZWRpdG9yLm9uICdjaGFuZ2VkJyAgICAgICAgICBAdXBkYXRlQ29sb3JzXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVzU2V0JyAgICAgICAgIEB1cGRhdGVDb2xvcnNcblxuICAgICAgICBAb25Gb250U2l6ZUNoYW5nZSgpXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAgICAwMDBcblxuICAgIG9uTGluZXNTaG93bjogKHRvcCwgYm90LCBudW0pID0+XG5cbiAgICAgICAgQGVsZW0uaW5uZXJIVE1MID0gJydcbiAgICAgICAgQGxpbmVEaXZzID0ge31cblxuICAgICAgICBmb3IgbGkgaW4gW3RvcC4uYm90XVxuXG4gICAgICAgICAgICBkaXYgPSBAYWRkTGluZSBsaVxuXG4gICAgICAgICAgICBAZW1pdCAnbnVtYmVyQWRkZWQnLFxuICAgICAgICAgICAgICAgIG51bWJlckRpdjogIGRpdlxuICAgICAgICAgICAgICAgIG51bWJlclNwYW46IGRpdi5maXJzdENoaWxkXG4gICAgICAgICAgICAgICAgbGluZUluZGV4OiAgbGlcblxuICAgICAgICAgICAgQHVwZGF0ZUNvbG9yIGxpXG4gICAgXG4gICAgICAgIEB1cGRhdGVMaW5lUG9zaXRpb25zKClcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMCAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgb25MaW5lc1NoaWZ0ZWQ6ICh0b3AsIGJvdCwgbnVtKSA9PlxuXG4gICAgICAgIG9sZFRvcCA9IHRvcCAtIG51bVxuICAgICAgICBvbGRCb3QgPSBib3QgLSBudW1cblxuICAgICAgICBkaXZJbnRvID0gKGxpLGxvKSA9PlxuXG4gICAgICAgICAgICBpZiBub3QgQGxpbmVEaXZzW2xvXVxuICAgICAgICAgICAgICAgIGxvZyBcIiN7QGVkaXRvci5uYW1lfS5vbkxpbmVzU2hpZnRlZC5kaXZJbnRvIC0tIG5vIG51bWJlciBkaXY/IHRvcCAje3RvcH0gYm90ICN7Ym90fSBudW0gI3tudW19IGxvICN7bG99IGxpICN7bGl9XCJcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICAgbnVtYmVyRGl2ID0gQGxpbmVEaXZzW2xpXSA9IEBsaW5lRGl2c1tsb11cbiAgICAgICAgICAgIGRlbGV0ZSBAbGluZURpdnNbbG9dXG5cbiAgICAgICAgICAgIG51bWJlclNwYW4gPSBudW1iZXJEaXYuZmlyc3RDaGlsZFxuICAgICAgICAgICAgbnVtYmVyU3Bhbi50ZXh0Q29udGVudCA9IGxpKzFcbiAgICAgICAgICAgIEB1cGRhdGVDb2xvciBsaVxuICAgICAgICAgICAgQGVtaXQgJ251bWJlckNoYW5nZWQnLFxuICAgICAgICAgICAgICAgIG51bWJlckRpdjogIG51bWJlckRpdlxuICAgICAgICAgICAgICAgIG51bWJlclNwYW46IG51bWJlclNwYW5cbiAgICAgICAgICAgICAgICBsaW5lSW5kZXg6ICBsaVxuXG4gICAgICAgIGlmIG51bSA+IDBcbiAgICAgICAgICAgIHdoaWxlIG9sZEJvdCA8IGJvdFxuICAgICAgICAgICAgICAgIG9sZEJvdCArPSAxXG4gICAgICAgICAgICAgICAgZGl2SW50byBvbGRCb3QsIG9sZFRvcFxuICAgICAgICAgICAgICAgIG9sZFRvcCArPSAxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHdoaWxlIG9sZFRvcCA+IHRvcFxuICAgICAgICAgICAgICAgIG9sZFRvcCAtPSAxXG4gICAgICAgICAgICAgICAgZGl2SW50byBvbGRUb3AsIG9sZEJvdFxuICAgICAgICAgICAgICAgIG9sZEJvdCAtPSAxXG5cbiAgICAgICAgQHVwZGF0ZUxpbmVQb3NpdGlvbnMoKVxuXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgICAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG4gICAgdXBkYXRlTGluZVBvc2l0aW9uczogLT5cblxuICAgICAgICBmb3IgbGksIGRpdiBvZiBAbGluZURpdnNcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIG5vdCBkaXY/LnN0eWxlXG4gICAgICAgICAgICB5ID0gQGVkaXRvci5zaXplLmxpbmVIZWlnaHQgKiAobGkgLSBAZWRpdG9yLnNjcm9sbC50b3ApXG4gICAgICAgICAgICBkaXYuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUzZCgwLCAje3l9cHgsIDApXCJcblxuICAgIGFkZExpbmU6IChsaSkgLT5cblxuICAgICAgICBkaXYgPSBlbGVtIGNsYXNzOiAnbGluZW51bWJlcicsIGNoaWxkOiBlbGVtICdzcGFuJywgdGV4dDogXCIje2xpKzF9XCJcbiAgICAgICAgZGl2LnN0eWxlLmhlaWdodCA9IFwiI3tAZWRpdG9yLnNpemUubGluZUhlaWdodH1weFwiXG4gICAgICAgIEBsaW5lRGl2c1tsaV0gPSBkaXZcbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgZGl2XG4gICAgICAgIGRpdlxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG5cbiAgICBvbkNsZWFyTGluZXM6ID0+XG5cbiAgICAgICAgQGxpbmVEaXZzID0ge31cbiAgICAgICAgQGVsZW0uaW5uZXJIVE1MID0gXCJcIlxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG4gICAgb25Gb250U2l6ZUNoYW5nZTogPT5cblxuICAgICAgICBmc3ogPSBNYXRoLm1pbiAyMiwgQGVkaXRvci5zaXplLmZvbnRTaXplLTRcbiAgICAgICAgQGVsZW0uc3R5bGUuZm9udFNpemUgPSBcIiN7ZnN6fXB4XCJcbiAgICAgICAgc2V0U3R5bGUgJy5saW5lbnVtYmVyJyAncGFkZGluZy10b3AnIFwiI3twYXJzZUludCBAZWRpdG9yLnNpemUuZm9udFNpemUvMTB9cHhcIlxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICB1cGRhdGVDb2xvcnM6ID0+XG5cbiAgICAgICAgaWYgQGVkaXRvci5zY3JvbGwuYm90ID4gQGVkaXRvci5zY3JvbGwudG9wXG4gICAgICAgICAgICBmb3IgbGkgaW4gW0BlZGl0b3Iuc2Nyb2xsLnRvcC4uQGVkaXRvci5zY3JvbGwuYm90XVxuICAgICAgICAgICAgICAgIEB1cGRhdGVDb2xvciBsaVxuXG4gICAgdXBkYXRlQ29sb3I6IChsaSkgPT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IEBsaW5lRGl2c1tsaV0/ICMgb2s6IGUuZy4gY29tbWFuZGxpc3RcbiAgICAgICAgaWYgQGxpbmVEaXZzW2xpXS5maXJzdENoaWxkPyBhbmQgQGxpbmVEaXZzW2xpXS5maXJzdENoaWxkLmNsYXNzTGlzdC5jb250YWlucyAnZ2l0SW5mb0xpbmUnXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBzaSA9IChzWzBdIGZvciBzIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIGxpLCBsaSwgQGVkaXRvci5zZWxlY3Rpb25zKCkpXG4gICAgICAgIGhpID0gKHNbMF0gZm9yIHMgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgbGksIGxpLCBAZWRpdG9yLmhpZ2hsaWdodHMoKSlcbiAgICAgICAgY2kgPSAoc1swXSBmb3IgcyBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBsaSwgbGksIHJhbmdlc0Zyb21Qb3NpdGlvbnMgQGVkaXRvci5jdXJzb3JzKCkpXG5cbiAgICAgICAgY2xzID0gJydcbiAgICAgICAgaWYgbGkgaW4gY2lcbiAgICAgICAgICAgIGNscyArPSAnIGN1cnNvcmVkJ1xuICAgICAgICBpZiBsaSA9PSBAZWRpdG9yLm1haW5DdXJzb3IoKVsxXVxuICAgICAgICAgICAgY2xzICs9ICcgbWFpbidcbiAgICAgICAgaWYgbGkgaW4gc2lcbiAgICAgICAgICAgIGNscyArPSAnIHNlbGVjdGVkJ1xuICAgICAgICBpZiBsaSBpbiBoaVxuICAgICAgICAgICAgY2xzICs9ICcgaGlnaGxpZ2QnXG5cbiAgICAgICAgQGxpbmVEaXZzW2xpXS5jbGFzc05hbWUgPSAnbGluZW51bWJlcicgKyBjbHNcblxubW9kdWxlLmV4cG9ydHMgPSBOdW1iZXJzXG4iXX0=
//# sourceURL=../../coffee/editor/numbers.coffee