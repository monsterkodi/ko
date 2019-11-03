// koffee 1.4.0

/*
00000000  0000000    000  000000000   0000000   00000000          0000000   0000000  00000000    0000000   000      000      
000       000   000  000     000     000   000  000   000        000       000       000   000  000   000  000      000      
0000000   000   000  000     000     000   000  0000000          0000000   000       0000000    000   000  000      000      
000       000   000  000     000     000   000  000   000             000  000       000   000  000   000  000      000      
00000000  0000000    000     000      0000000   000   000        0000000    0000000  000   000   0000000   0000000  0000000
 */
var EditorScroll, clamp, events, kxk,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

clamp = require('kxk').clamp;

events = require('events');

kxk = require('kxk');

EditorScroll = (function(superClass) {
    extend(EditorScroll, superClass);

    function EditorScroll(editor) {
        var ref;
        this.editor = editor;
        this.setLineHeight = bind(this.setLineHeight, this);
        this.setNumLines = bind(this.setNumLines, this);
        this.setViewHeight = bind(this.setViewHeight, this);
        this.reset = bind(this.reset, this);
        this.setTop = bind(this.setTop, this);
        this.by = bind(this.by, this);
        this.to = bind(this.to, this);
        this.start = bind(this.start, this);
        EditorScroll.__super__.constructor.call(this);
        this.lineHeight = (ref = this.editor.size.lineHeight) != null ? ref : 0;
        this.viewHeight = -1;
        this.init();
    }

    EditorScroll.prototype.init = function() {
        this.scroll = 0;
        this.offsetTop = 0;
        this.offsetSmooth = 0;
        this.viewHeight = -1;
        this.fullHeight = -1;
        this.fullLines = -1;
        this.viewLines = -1;
        this.scrollMax = -1;
        this.numLines = -1;
        this.top = -1;
        return this.bot = -1;
    };

    EditorScroll.prototype.start = function(viewHeight, numLines) {
        this.viewHeight = viewHeight;
        this.numLines = numLines;
        this.fullHeight = this.numLines * this.lineHeight;
        this.top = 0;
        this.bot = this.top - 1;
        this.calc();
        return this.by(0);
    };

    EditorScroll.prototype.calc = function() {
        if (this.viewHeight <= 0) {
            return;
        }
        this.scrollMax = Math.max(0, this.fullHeight - this.viewHeight);
        this.fullLines = Math.floor(this.viewHeight / this.lineHeight);
        return this.viewLines = Math.ceil(this.viewHeight / this.lineHeight) + 1;
    };

    EditorScroll.prototype.to = function(p) {
        return this.by(p - this.scroll);
    };

    EditorScroll.prototype.by = function(delta, x) {
        var offset, scroll, top;
        if (this.viewLines < 0) {
            return;
        }
        if (x) {
            this.editor.layerScroll.scrollLeft += x;
        }
        if (!delta && this.top < this.bot) {
            return;
        }
        scroll = this.scroll;
        if (Number.isNaN(delta)) {
            delta = 0;
        }
        this.scroll = parseInt(clamp(0, this.scrollMax, this.scroll + delta));
        top = parseInt(this.scroll / this.lineHeight);
        this.offsetSmooth = this.scroll - top * this.lineHeight;
        this.setTop(top);
        offset = 0;
        offset += this.offsetSmooth;
        offset += (top - this.top) * this.lineHeight;
        if (offset !== this.offsetTop || scroll !== this.scroll) {
            this.offsetTop = parseInt(offset);
            this.updateOffset();
            return this.emit('scroll', this.scroll, this.offsetTop);
        }
    };

    EditorScroll.prototype.setTop = function(top) {
        var num, oldBot, oldTop;
        oldTop = this.top;
        oldBot = this.bot;
        this.bot = Math.min(top + this.viewLines, this.numLines - 1);
        this.top = Math.max(0, this.bot - this.viewLines);
        if (oldTop === this.top && oldBot === this.bot) {
            return;
        }
        if ((this.top > oldBot) || (this.bot < oldTop) || (oldBot < oldTop)) {
            num = this.bot - this.top + 1;
            if (num > 0) {
                return this.emit('showLines', this.top, this.bot, num);
            }
        } else {
            num = this.top - oldTop;
            if (0 < Math.abs(num)) {
                return this.emit('shiftLines', this.top, this.bot, num);
            }
        }
    };

    EditorScroll.prototype.lineIndexIsInView = function(li) {
        return (this.top <= li && li <= this.bot);
    };

    EditorScroll.prototype.reset = function() {
        this.emit('clearLines');
        this.init();
        return this.updateOffset();
    };

    EditorScroll.prototype.setViewHeight = function(h) {
        if (this.viewHeight !== h) {
            this.bot = this.top - 1;
            this.viewHeight = h;
            this.calc();
            return this.by(0);
        }
    };

    EditorScroll.prototype.setNumLines = function(n, opt) {
        if (this.numLines !== n) {
            this.fullHeight = n * this.lineHeight;
            if (n) {
                if ((opt != null ? opt.showLines : void 0) !== false) {
                    this.bot = this.top - 1;
                }
                this.numLines = n;
                this.calc();
                return this.by(0);
            } else {
                this.init();
                return this.emit('clearLines');
            }
        }
    };

    EditorScroll.prototype.setLineHeight = function(h) {
        if (this.lineHeight !== h) {
            this.lineHeight = h;
            this.fullHeight = this.numLines * this.lineHeight;
            this.calc();
            return this.by(0);
        }
    };

    EditorScroll.prototype.updateOffset = function() {
        return this.editor.layers.style.transform = "translate3d(0,-" + this.offsetTop + "px, 0)";
    };

    EditorScroll.prototype.cursorToTop = function(topDist) {
        var cp, hl, rg, sl;
        if (topDist == null) {
            topDist = 7;
        }
        cp = this.editor.cursorPos();
        if (cp[1] - this.top > topDist) {
            rg = [this.top, Math.max(0, cp[1] - 1)];
            sl = this.editor.selectionsInLineIndexRange(rg);
            hl = this.editor.highlightsInLineIndexRange(rg);
            if ((sl.length === 0 && 0 === hl.length)) {
                return this.by(this.lineHeight * (cp[1] - this.top - topDist));
            }
        }
    };

    EditorScroll.prototype.cursorIntoView = function() {
        var delta;
        if (delta = this.deltaToEnsureMainCursorIsVisible()) {
            this.by(delta * this.lineHeight - this.offsetSmooth);
        }
        return this.updateCursorOffset();
    };

    EditorScroll.prototype.deltaToEnsureMainCursorIsVisible = function() {
        var cl, maindelta, offset, ref, ref1;
        maindelta = 0;
        cl = this.editor.mainCursor()[1];
        offset = (ref = (ref1 = this.editor.config) != null ? ref1.scrollOffset : void 0) != null ? ref : 2;
        if (cl < this.top + offset + this.offsetTop / this.lineHeight) {
            maindelta = cl - (this.top + offset + this.offsetTop / this.lineHeight);
        } else if (cl > this.top + this.fullLines - offset - 1) {
            maindelta = cl - (this.top + this.fullLines - offset - 1);
        }
        return maindelta;
    };

    EditorScroll.prototype.updateCursorOffset = function() {
        var charWidth, cx, layersWidth, offsetX, scrollLeft;
        offsetX = this.editor.size.offsetX;
        charWidth = this.editor.size.charWidth;
        layersWidth = this.editor.layersWidth;
        scrollLeft = this.editor.layerScroll.scrollLeft;
        cx = this.editor.mainCursor()[0] * charWidth + offsetX;
        if (cx - scrollLeft > layersWidth) {
            return this.editor.layerScroll.scrollLeft = Math.max(0, cx - layersWidth + charWidth);
        } else if (cx - offsetX - scrollLeft < 0) {
            return this.editor.layerScroll.scrollLeft = Math.max(0, cx - offsetX);
        }
    };

    EditorScroll.prototype.info = function() {
        return {
            topbot: this.top + " .. " + this.bot + " = " + (this.bot - this.top) + " / " + this.numLines + " lines",
            scroll: this.scroll + " offsetTop " + this.offsetTop + " viewHeight " + this.viewHeight + " scrollMax " + this.scrollMax + " fullLines " + this.fullLines + " viewLines " + this.viewLines
        };
    };

    return EditorScroll;

})(events);

module.exports = EditorScroll;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yc2Nyb2xsLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxnQ0FBQTtJQUFBOzs7O0FBUUUsUUFBVSxPQUFBLENBQVEsS0FBUjs7QUFFWixNQUFBLEdBQVMsT0FBQSxDQUFRLFFBQVI7O0FBQ1QsR0FBQSxHQUFTLE9BQUEsQ0FBUSxLQUFSOztBQUVIOzs7SUFFQyxzQkFBQyxNQUFEO0FBRUMsWUFBQTtRQUZBLElBQUMsQ0FBQSxTQUFEOzs7Ozs7Ozs7UUFFQSw0Q0FBQTtRQUNBLElBQUMsQ0FBQSxVQUFELHVEQUF3QztRQUN4QyxJQUFDLENBQUEsVUFBRCxHQUFjLENBQUM7UUFDZixJQUFDLENBQUEsSUFBRCxDQUFBO0lBTEQ7OzJCQWFILElBQUEsR0FBTSxTQUFBO1FBRUYsSUFBQyxDQUFBLE1BQUQsR0FBaUI7UUFDakIsSUFBQyxDQUFBLFNBQUQsR0FBaUI7UUFDakIsSUFBQyxDQUFBLFlBQUQsR0FBaUI7UUFFakIsSUFBQyxDQUFBLFVBQUQsR0FBZ0IsQ0FBQztRQUNqQixJQUFDLENBQUEsVUFBRCxHQUFnQixDQUFDO1FBQ2pCLElBQUMsQ0FBQSxTQUFELEdBQWdCLENBQUM7UUFDakIsSUFBQyxDQUFBLFNBQUQsR0FBZ0IsQ0FBQztRQUNqQixJQUFDLENBQUEsU0FBRCxHQUFnQixDQUFDO1FBQ2pCLElBQUMsQ0FBQSxRQUFELEdBQWdCLENBQUM7UUFDakIsSUFBQyxDQUFBLEdBQUQsR0FBZ0IsQ0FBQztlQUNqQixJQUFDLENBQUEsR0FBRCxHQUFnQixDQUFDO0lBYmY7OzJCQWVOLEtBQUEsR0FBTyxTQUFDLFVBQUQsRUFBYyxRQUFkO1FBQUMsSUFBQyxDQUFBLGFBQUQ7UUFBYSxJQUFDLENBQUEsV0FBRDtRQUVqQixJQUFDLENBQUEsVUFBRCxHQUFjLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBO1FBQzNCLElBQUMsQ0FBQSxHQUFELEdBQU87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QUFqQixHQUFxQixDQUFDLElBQUMsQ0FBQSxHQUFELEdBQUssSUFBQyxDQUFBLEdBQVAsQ0FBckIsR0FBZ0MsS0FBaEMsR0FBcUMsSUFBQyxDQUFBLFFBQXRDLEdBQStDLFFBQXpEO1lBQ0EsTUFBQSxFQUFXLElBQUMsQ0FBQSxNQUFGLEdBQVMsYUFBVCxHQUFzQixJQUFDLENBQUEsU0FBdkIsR0FBaUMsY0FBakMsR0FBK0MsSUFBQyxDQUFBLFVBQWhELEdBQTJELGFBQTNELEdBQXdFLElBQUMsQ0FBQSxTQUF6RSxHQUFtRixhQUFuRixHQUFnRyxJQUFDLENBQUEsU0FBakcsR0FBMkcsYUFBM0csR0FBd0gsSUFBQyxDQUFBLFNBRG5JOztJQUZFOzs7O0dBOVBpQjs7QUFtUTNCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgICAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICBcbjAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgIFxuMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwICBcbiMjI1xuXG57IGNsYW1wIH0gPSByZXF1aXJlICdreGsnXG5cbmV2ZW50cyA9IHJlcXVpcmUgJ2V2ZW50cydcbmt4ayAgICA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgRWRpdG9yU2Nyb2xsIGV4dGVuZHMgZXZlbnRzXG5cbiAgICBAOiAoQGVkaXRvcikgLT5cblxuICAgICAgICBzdXBlcigpXG4gICAgICAgIEBsaW5lSGVpZ2h0ID0gQGVkaXRvci5zaXplLmxpbmVIZWlnaHQgPyAwXG4gICAgICAgIEB2aWV3SGVpZ2h0ID0gLTFcbiAgICAgICAgQGluaXQoKVxuICAgICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgXG5cbiAgICBpbml0OiAtPlxuICAgICAgICBcbiAgICAgICAgQHNjcm9sbCAgICAgICA9ICAwICMgY3VycmVudCBzY3JvbGwgdmFsdWUgZnJvbSBkb2N1bWVudCBzdGFydCAocGl4ZWxzKVxuICAgICAgICBAb2Zmc2V0VG9wICAgID0gIDAgIyBoZWlnaHQgb2YgdmlldyBhYm92ZSBmaXJzdCB2aXNpYmxlIGxpbmUgKHBpeGVscylcbiAgICAgICAgQG9mZnNldFNtb290aCA9ICAwICMgc21vb3RoIHNjcm9sbGluZyBvZmZzZXQgLyBwYXJ0IG9mIHRvcCBsaW5lIHRoYXQgaXMgaGlkZGVuIChwaXhlbHMpXG4gICAgICAgIFxuICAgICAgICBAdmlld0hlaWdodCAgID0gLTFcbiAgICAgICAgQGZ1bGxIZWlnaHQgICA9IC0xICMgdG90YWwgaGVpZ2h0IG9mIGJ1ZmZlciAocGl4ZWxzKVxuICAgICAgICBAZnVsbExpbmVzICAgID0gLTEgIyBudW1iZXIgb2YgZnVsbCBsaW5lcyBmaXR0aW5nIGluIHZpZXcgKGV4Y2x1ZGluZyBwYXJ0aWFscylcbiAgICAgICAgQHZpZXdMaW5lcyAgICA9IC0xICMgbnVtYmVyIG9mIGxpbmVzIGZpdHRpbmcgaW4gdmlldyAoaW5jbHVkaW5nIHBhcnRpYWxzKVxuICAgICAgICBAc2Nyb2xsTWF4ICAgID0gLTEgIyBtYXhpbXVtIHNjcm9sbCBvZmZzZXQgKHBpeGVscylcbiAgICAgICAgQG51bUxpbmVzICAgICA9IC0xICMgdG90YWwgbnVtYmVyIG9mIGxpbmVzIGluIGJ1ZmZlclxuICAgICAgICBAdG9wICAgICAgICAgID0gLTEgIyBpbmRleCBvZiBmaXJzdCB2aXNpYmxlIGxpbmUgaW4gdmlld1xuICAgICAgICBAYm90ICAgICAgICAgID0gLTEgIyBpbmRleCBvZiBsYXN0ICB2aXNpYmxlIGxpbmUgaW4gdmlld1xuXG4gICAgc3RhcnQ6IChAdmlld0hlaWdodCwgQG51bUxpbmVzKSA9PlxuICAgICAgICBcbiAgICAgICAgQGZ1bGxIZWlnaHQgPSBAbnVtTGluZXMgKiBAbGluZUhlaWdodFxuICAgICAgICBAdG9wID0gMFxuICAgICAgICBAYm90ID0gQHRvcC0xXG4gICAgICAgIEBjYWxjKClcbiAgICAgICAgQGJ5IDBcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgIFxuICAgIGNhbGM6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAdmlld0hlaWdodCA8PSAwXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICBAc2Nyb2xsTWF4ICAgPSBNYXRoLm1heCgwLEBmdWxsSGVpZ2h0IC0gQHZpZXdIZWlnaHQpICAgIyBtYXhpbXVtIHNjcm9sbCBvZmZzZXQgKHBpeGVscylcbiAgICAgICAgQGZ1bGxMaW5lcyAgID0gTWF0aC5mbG9vcihAdmlld0hlaWdodCAvIEBsaW5lSGVpZ2h0KSAgICMgbnVtYmVyIG9mIGxpbmVzIGluIHZpZXcgKGV4Y2x1ZGluZyBwYXJ0aWFscylcbiAgICAgICAgQHZpZXdMaW5lcyAgID0gTWF0aC5jZWlsKEB2aWV3SGVpZ2h0IC8gQGxpbmVIZWlnaHQpKzEgICMgbnVtYmVyIG9mIGxpbmVzIGluIHZpZXcgKGluY2x1ZGluZyBwYXJ0aWFscylcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwIDAwMCBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAgICAwMDAgICBcbiAgICAgICAgXG4gICAgdG86IChwKSA9PiBAYnkgcC1Ac2Nyb2xsXG4gICAgXG4gICAgYnk6IChkZWx0YSwgeCkgPT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBAdmlld0xpbmVzIDwgMFxuICAgICAgICBcbiAgICAgICAgQGVkaXRvci5sYXllclNjcm9sbC5zY3JvbGxMZWZ0ICs9IHggaWYgeFxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBkZWx0YSBhbmQgQHRvcCA8IEBib3RcbiAgICAgICAgXG4gICAgICAgIHNjcm9sbCA9IEBzY3JvbGxcbiAgICAgICAgZGVsdGEgPSAwIGlmIE51bWJlci5pc05hTiBkZWx0YVxuICAgICAgICBAc2Nyb2xsID0gcGFyc2VJbnQgY2xhbXAgMCwgQHNjcm9sbE1heCwgQHNjcm9sbCtkZWx0YVxuICAgICAgICB0b3AgPSBwYXJzZUludCBAc2Nyb2xsIC8gQGxpbmVIZWlnaHRcbiAgICAgICAgQG9mZnNldFNtb290aCA9IEBzY3JvbGwgLSB0b3AgKiBAbGluZUhlaWdodCBcbiAgICAgICAgXG4gICAgICAgIEBzZXRUb3AgdG9wXG5cbiAgICAgICAgb2Zmc2V0ID0gMFxuICAgICAgICBvZmZzZXQgKz0gQG9mZnNldFNtb290aFxuICAgICAgICBvZmZzZXQgKz0gKHRvcCAtIEB0b3ApICogQGxpbmVIZWlnaHRcbiAgICAgICAgXG4gICAgICAgIGlmIG9mZnNldCAhPSBAb2Zmc2V0VG9wIG9yIHNjcm9sbCAhPSBAc2Nyb2xsXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIEBvZmZzZXRUb3AgPSBwYXJzZUludCBvZmZzZXRcbiAgICAgICAgICAgIEB1cGRhdGVPZmZzZXQoKVxuICAgICAgICAgICAgQGVtaXQgJ3Njcm9sbCcgQHNjcm9sbCwgQG9mZnNldFRvcFxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgICBcbiAgICAgICAgICAgIFxuICAgIHNldFRvcDogKHRvcCkgPT5cbiAgICAgICAgXG4gICAgICAgIG9sZFRvcCA9IEB0b3BcbiAgICAgICAgb2xkQm90ID0gQGJvdFxuICAgICAgICBcbiAgICAgICAgQGJvdCA9IE1hdGgubWluIHRvcCtAdmlld0xpbmVzLCBAbnVtTGluZXMtMVxuICAgICAgICBAdG9wID0gTWF0aC5tYXggMCwgQGJvdCAtIEB2aWV3TGluZXNcblxuICAgICAgICByZXR1cm4gaWYgb2xkVG9wID09IEB0b3AgYW5kIG9sZEJvdCA9PSBAYm90XG4gICAgICAgICAgICBcbiAgICAgICAgaWYgKEB0b3AgPiBvbGRCb3QpIG9yIChAYm90IDwgb2xkVG9wKSBvciAob2xkQm90IDwgb2xkVG9wKSBcbiAgICAgICAgICAgICMgbmV3IHJhbmdlIG91dHNpZGUsIHN0YXJ0IGZyb20gc2NyYXRjaFxuICAgICAgICAgICAgbnVtID0gQGJvdCAtIEB0b3AgKyAxXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG51bSA+IDBcbiAgICAgICAgICAgICAgICBAZW1pdCAnc2hvd0xpbmVzJyBAdG9wLCBAYm90LCBudW1cblxuICAgICAgICBlbHNlICAgXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG51bSA9IEB0b3AgLSBvbGRUb3BcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgMCA8IE1hdGguYWJzIG51bVxuICAgICAgICAgICAgICAgIEBlbWl0ICdzaGlmdExpbmVzJyBAdG9wLCBAYm90LCBudW1cbiAgICAgICAgICAgICAgICBcbiAgICBsaW5lSW5kZXhJc0luVmlldzogKGxpKSAtPiBAdG9wIDw9IGxpIDw9IEBib3RcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgIFxuICAgIFxuICAgIHJlc2V0OiA9PlxuICAgICAgICBcbiAgICAgICAgQGVtaXQgJ2NsZWFyTGluZXMnXG4gICAgICAgIEBpbml0KClcbiAgICAgICAgQHVwZGF0ZU9mZnNldCgpXG4gICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgIDAwMCAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgIFxuICAgICMgICAgMDAwICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgICAgIDAgICAgICAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgIFxuXG4gICAgc2V0Vmlld0hlaWdodDogKGgpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAdmlld0hlaWdodCAhPSBoXG4gICAgICAgICAgICBAYm90ID0gQHRvcC0xICMgYWx3YXlzIGVtaXQgc2hvd0xpbmVzIGlmIGhlaWdodCBjaGFuZ2VzXG4gICAgICAgICAgICBAdmlld0hlaWdodCA9IGhcbiAgICAgICAgICAgIEBjYWxjKClcbiAgICAgICAgICAgIEBieSAwXG4gICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCBcbiAgICAgICAgXG4gICAgc2V0TnVtTGluZXM6IChuLCBvcHQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbnVtTGluZXMgIT0gblxuICAgICAgICAgICAgQGZ1bGxIZWlnaHQgPSBuICogQGxpbmVIZWlnaHRcbiAgICAgICAgICAgIGlmIG5cbiAgICAgICAgICAgICAgICBpZiBvcHQ/LnNob3dMaW5lcyAhPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBAYm90ID0gQHRvcC0xICMgYWx3YXlzIGVtaXQgc2hvd0xpbmVzIGlmIGxpbmUgbnVtYmVyIGNoYW5nZXNcbiAgICAgICAgICAgICAgICBAbnVtTGluZXMgPSBuXG4gICAgICAgICAgICAgICAgQGNhbGMoKVxuICAgICAgICAgICAgICAgIEBieSAwXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGluaXQoKVxuICAgICAgICAgICAgICAgIEBlbWl0ICdjbGVhckxpbmVzJyAgICAgICAgICAgICBcblxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG5cbiAgICBzZXRMaW5lSGVpZ2h0OiAoaCkgPT5cbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAbGluZUhlaWdodCAhPSBoXG4gICAgICAgICAgICBAbGluZUhlaWdodCA9IGhcbiAgICAgICAgICAgIEBmdWxsSGVpZ2h0ID0gQG51bUxpbmVzICogQGxpbmVIZWlnaHRcbiAgICAgICAgICAgIEBjYWxjKClcbiAgICAgICAgICAgIEBieSAwXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAgICAgMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHVwZGF0ZU9mZnNldDogLT4gXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBlZGl0b3IubGF5ZXJzLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlM2QoMCwtI3tAb2Zmc2V0VG9wfXB4LCAwKVwiXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAgICAgICAgIFxuICAgIGN1cnNvclRvVG9wOiAodG9wRGlzdD03KSAtPlxuICAgICAgICAgICAgICAgIFxuICAgICAgICBjcCA9IEBlZGl0b3IuY3Vyc29yUG9zKClcbiAgICAgICAgXG4gICAgICAgIGlmIGNwWzFdIC0gQHRvcCA+IHRvcERpc3RcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmcgPSBbQHRvcCwgTWF0aC5tYXggMCwgY3BbMV0tMV1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2wgPSBAZWRpdG9yLnNlbGVjdGlvbnNJbkxpbmVJbmRleFJhbmdlIHJnXG4gICAgICAgICAgICBobCA9IEBlZGl0b3IuaGlnaGxpZ2h0c0luTGluZUluZGV4UmFuZ2UgcmdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgc2wubGVuZ3RoID09IDAgPT0gaGwubGVuZ3RoXG4gICAgICAgICAgICAgICAgIyBrbG9nICdjdXJzb3JUb1RvcCcgKGNwWzFdIC0gQHRvcCAtIHRvcERpc3QpXG4gICAgICAgICAgICAgICAgQGJ5IEBsaW5lSGVpZ2h0ICogKGNwWzFdIC0gQHRvcCAtIHRvcERpc3QpXG5cbiAgICBjdXJzb3JJbnRvVmlldzogLT5cblxuICAgICAgICBpZiBkZWx0YSA9IEBkZWx0YVRvRW5zdXJlTWFpbkN1cnNvcklzVmlzaWJsZSgpXG4gICAgICAgICAgICBAYnkgZGVsdGEgKiBAbGluZUhlaWdodCAtIEBvZmZzZXRTbW9vdGhcbiAgICAgICAgICAgIFxuICAgICAgICBAdXBkYXRlQ3Vyc29yT2Zmc2V0KClcblxuICAgIGRlbHRhVG9FbnN1cmVNYWluQ3Vyc29ySXNWaXNpYmxlOiAtPlxuICAgICAgICBcbiAgICAgICAgbWFpbmRlbHRhID0gMFxuICAgICAgICBjbCA9IEBlZGl0b3IubWFpbkN1cnNvcigpWzFdXG4gICAgICAgIFxuICAgICAgICBvZmZzZXQgPSBAZWRpdG9yLmNvbmZpZz8uc2Nyb2xsT2Zmc2V0ID8gMlxuICAgICAgICBcbiAgICAgICAgaWYgY2wgPCBAdG9wICsgb2Zmc2V0ICsgQG9mZnNldFRvcCAvIEBsaW5lSGVpZ2h0XG4gICAgICAgICAgICBtYWluZGVsdGEgPSBjbCAtIChAdG9wICsgb2Zmc2V0ICsgQG9mZnNldFRvcCAvIEBsaW5lSGVpZ2h0KVxuICAgICAgICBlbHNlIGlmIGNsID4gQHRvcCArIEBmdWxsTGluZXMgLSBvZmZzZXQgLSAxXG4gICAgICAgICAgICBtYWluZGVsdGEgPSBjbCAtIChAdG9wICsgQGZ1bGxMaW5lcyAtIG9mZnNldCAtIDEpXG5cbiAgICAgICAgbWFpbmRlbHRhXG4gICAgICAgICAgICBcbiAgICB1cGRhdGVDdXJzb3JPZmZzZXQ6IC0+XG4gICAgICAgIFxuICAgICAgICBvZmZzZXRYICAgICA9IEBlZGl0b3Iuc2l6ZS5vZmZzZXRYXG4gICAgICAgIGNoYXJXaWR0aCAgID0gQGVkaXRvci5zaXplLmNoYXJXaWR0aFxuICAgICAgICBsYXllcnNXaWR0aCA9IEBlZGl0b3IubGF5ZXJzV2lkdGhcbiAgICAgICAgc2Nyb2xsTGVmdCAgPSBAZWRpdG9yLmxheWVyU2Nyb2xsLnNjcm9sbExlZnRcblxuICAgICAgICBjeCA9IEBlZGl0b3IubWFpbkN1cnNvcigpWzBdKmNoYXJXaWR0aCtvZmZzZXRYXG4gICAgICAgIFxuICAgICAgICBpZiBjeC1zY3JvbGxMZWZ0ID4gbGF5ZXJzV2lkdGhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGVkaXRvci5sYXllclNjcm9sbC5zY3JvbGxMZWZ0ID0gTWF0aC5tYXggMCwgY3ggLSBsYXllcnNXaWR0aCArIGNoYXJXaWR0aFxuICAgICAgICAgICAgXG4gICAgICAgIGVsc2UgaWYgY3gtb2Zmc2V0WC1zY3JvbGxMZWZ0IDwgMFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZWRpdG9yLmxheWVyU2Nyb2xsLnNjcm9sbExlZnQgPSBNYXRoLm1heCAwLCBjeCAtIG9mZnNldFhcbiAgICAgICAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgXG4gICAgXG4gICAgaW5mbzogLT5cbiAgICAgICAgXG4gICAgICAgIHRvcGJvdDogXCIje0B0b3B9IC4uICN7QGJvdH0gPSAje0Bib3QtQHRvcH0gLyAje0BudW1MaW5lc30gbGluZXNcIlxuICAgICAgICBzY3JvbGw6IFwiI3tAc2Nyb2xsfSBvZmZzZXRUb3AgI3tAb2Zmc2V0VG9wfSB2aWV3SGVpZ2h0ICN7QHZpZXdIZWlnaHR9IHNjcm9sbE1heCAje0BzY3JvbGxNYXh9IGZ1bGxMaW5lcyAje0BmdWxsTGluZXN9IHZpZXdMaW5lcyAje0B2aWV3TGluZXN9XCJcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRvclNjcm9sbFxuIl19
//# sourceURL=../../coffee/editor/editorscroll.coffee