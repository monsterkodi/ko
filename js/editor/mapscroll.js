// koffee 1.19.0

/*
00     00   0000000   00000000          0000000   0000000  00000000    0000000   000      000    
000   000  000   000  000   000        000       000       000   000  000   000  000      000    
000000000  000000000  00000000         0000000   000       0000000    000   000  000      000    
000 0 000  000   000  000                   000  000       000   000  000   000  000      000    
000   000  000   000  000              0000000    0000000  000   000   0000000   0000000  0000000
 */
var MapScroll, clamp, events,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = Object.hasOwn;

clamp = require('kxk').clamp;

events = require('events');

MapScroll = (function(superClass) {
    extend(MapScroll, superClass);

    function MapScroll(cfg) {
        this.setLineHeight = bind(this.setLineHeight, this);
        this.setNumLines = bind(this.setNumLines, this);
        this.setViewHeight = bind(this.setViewHeight, this);
        this.deleteLine = bind(this.deleteLine, this);
        this.insertLine = bind(this.insertLine, this);
        this.setTop = bind(this.setTop, this);
        this.by = bind(this.by, this);
        this.to = bind(this.to, this);
        this.reset = bind(this.reset, this);
        var ref, ref1, ref2, ref3;
        MapScroll.__super__.constructor.call(this);
        this.lineHeight = (ref = cfg.lineHeight) != null ? ref : 0;
        this.viewHeight = (ref1 = cfg.viewHeight) != null ? ref1 : 0;
        this.exposeMax = (ref2 = cfg.exposeMax) != null ? ref2 : -4;
        this.smooth = (ref3 = cfg.smooth) != null ? ref3 : true;
        this.init();
    }

    MapScroll.prototype.init = function() {
        this.scroll = 0;
        this.offsetTop = 0;
        this.offsetSmooth = 0;
        this.fullHeight = 0;
        this.numLines = 0;
        this.top = 0;
        this.bot = 0;
        this.exposed = 0;
        this.exposeTop = 0;
        this.exposeBot = -1;
        this.calc();
        return this.offsetTop = -1;
    };

    MapScroll.prototype.calc = function() {
        this.scrollMax = Math.max(0, this.fullHeight - this.viewHeight);
        this.fullLines = Math.floor(this.viewHeight / this.lineHeight);
        this.viewLines = Math.ceil(this.viewHeight / this.lineHeight);
        this.linesHeight = this.viewLines * this.lineHeight;
        if (this.exposeMax < 0) {
            this.exposeNum = -this.exposeMax * this.viewLines;
        } else {
            this.exposeNum = this.exposeMax;
        }
        return this.exposeHeight = this.exposeNum * this.lineHeight;
    };

    MapScroll.prototype.info = function() {
        return {
            topbot: this.top + " .. " + this.bot + " = " + (this.bot - this.top) + " / " + this.numLines + " lines",
            expose: this.exposeTop + " .. " + this.exposeBot + " = " + (this.exposeBot - this.exposeTop) + " / " + this.exposeNum + " px " + this.exposeHeight,
            scroll: this.scroll + " offsetTop " + this.offsetTop + " scrollMax " + this.scrollMax + " fullLines " + this.fullLines + " viewLines " + this.viewLines + " viewHeight " + this.viewHeight
        };
    };

    MapScroll.prototype.reset = function() {
        this.emit('clearLines');
        return this.init();
    };

    MapScroll.prototype.to = function(p) {
        return this.by(p - this.scroll);
    };

    MapScroll.prototype.by = function(delta) {
        var offset, scroll, top;
        scroll = this.scroll;
        if (Number.isNaN(delta)) {
            delta = 0;
        }
        this.scroll = parseInt(clamp(0, this.scrollMax, this.scroll + delta));
        top = parseInt(this.scroll / this.lineHeight);
        this.offsetSmooth = this.scroll - top * this.lineHeight;
        this.setTop(top);
        offset = 0;
        if (this.smooth) {
            offset += this.offsetSmooth;
        }
        offset += (top - this.exposeTop) * this.lineHeight;
        if (offset !== this.offsetTop || scroll !== this.scroll) {
            this.offsetTop = parseInt(offset);
            return this.emit('scroll', this.scroll, this.offsetTop);
        }
    };

    MapScroll.prototype.setTop = function(top) {
        var n, num, oldBot, oldTop;
        if (this.exposeBot < 0 && this.numLines < 1) {
            return;
        }
        oldTop = this.top;
        oldBot = this.bot;
        this.top = top;
        this.bot = Math.min(this.top + this.viewLines, this.numLines - 1);
        if (oldTop === this.top && oldBot === this.bot && this.exposeBot >= this.bot) {
            return;
        }
        if ((this.top >= this.exposeBot) || (this.bot <= this.exposeTop)) {
            this.emit('clearLines');
            this.exposeTop = this.top;
            this.exposeBot = this.bot;
            num = this.bot - this.top + 1;
            if (num > 0) {
                this.emit('exposeLines', {
                    top: this.top,
                    bot: this.bot,
                    num: num
                });
                this.emit('scroll', this.scroll, this.offsetTop);
            }
            return;
        }
        if (this.top < this.exposeTop) {
            oldTop = this.exposeTop;
            this.exposeTop = Math.max(0, this.top - (Math.min(this.viewLines, this.exposeNum - this.viewLines)));
            num = oldTop - this.exposeTop;
            if (num > 0) {
                this.emit('exposeLines', {
                    top: this.exposeTop,
                    bot: oldTop - 1,
                    num: num
                });
            }
        }
        while (this.bot > this.exposeBot) {
            this.exposeBot += 1;
            this.emit('exposeLine', this.exposeBot);
        }
        if (this.exposeBot - this.exposeTop + 1 > this.exposeNum) {
            num = this.exposeBot - this.exposeTop + 1 - this.exposeNum;
            if (this.top > oldTop) {
                n = clamp(0, this.top - this.exposeTop, num);
                this.exposeTop += n;
                return this.emit('vanishLines', {
                    top: n
                });
            } else {
                n = clamp(0, this.exposeBot - this.bot, num);
                this.exposeBot -= n;
                return this.emit('vanishLines', {
                    bot: n
                });
            }
        }
    };

    MapScroll.prototype.insertLine = function(li, oi) {
        if (this.lineIndexIsInExpose(oi)) {
            this.exposeBot += 1;
        }
        if (this.lineIndexIsInView(oi)) {
            this.bot += 1;
        }
        if (oi < this.top) {
            this.top += 1;
        }
        this.numLines += 1;
        this.fullHeight = this.numLines * this.lineHeight;
        return this.calc();
    };

    MapScroll.prototype.deleteLine = function(li, oi) {
        if (this.lineIndexIsInExpose(oi) || this.numLines < this.exposeNum) {
            this.exposeBot -= 1;
        }
        if (this.lineIndexIsInView(oi)) {
            return this.bot -= 1;
        }
    };

    MapScroll.prototype.lineIndexIsInView = function(li) {
        if ((this.top <= li && li <= this.bot)) {
            return true;
        }
        return this.bot - this.top + 1 < this.fullLines;
    };

    MapScroll.prototype.lineIndexIsInExpose = function(li) {
        if ((this.exposeTop <= li && li <= this.exposeBot)) {
            return true;
        }
        return this.exposeBot - this.exposeTop + 1 < this.exposeNum;
    };

    MapScroll.prototype.setViewHeight = function(h) {
        if (this.viewHeight !== h) {
            this.viewHeight = h;
            this.calc();
            return this.by(0);
        }
    };

    MapScroll.prototype.setNumLines = function(n) {
        if (this.numLines !== n) {
            this.numLines = n;
            this.fullHeight = this.numLines * this.lineHeight;
            if (this.numLines) {
                this.calc();
                return this.by(0);
            } else {
                this.init();
                return this.emit('clearLines');
            }
        }
    };

    MapScroll.prototype.setLineHeight = function(h) {
        if (this.lineHeight !== h) {
            this.lineHeight = h;
            this.fullHeight = this.numLines * this.lineHeight;
            this.calc();
            return this.by(0);
        }
    };

    return MapScroll;

})(events);

module.exports = MapScroll;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwc2Nyb2xsLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9lZGl0b3IiLCJzb3VyY2VzIjpbIm1hcHNjcm9sbC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsd0JBQUE7SUFBQTs7OztBQVFFLFFBQVUsT0FBQSxDQUFRLEtBQVI7O0FBRVosTUFBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSOztBQUVIOzs7SUFFQyxtQkFBQyxHQUFEOzs7Ozs7Ozs7O0FBRUMsWUFBQTtRQUFBLHlDQUFBO1FBQ0EsSUFBQyxDQUFBLFVBQUQsMENBQStCO1FBQy9CLElBQUMsQ0FBQSxVQUFELDRDQUErQjtRQUMvQixJQUFDLENBQUEsU0FBRCwyQ0FBOEIsQ0FBQztRQUMvQixJQUFDLENBQUEsTUFBRCx3Q0FBMkI7UUFDM0IsSUFBQyxDQUFBLElBQUQsQ0FBQTtJQVBEOzt3QkFlSCxJQUFBLEdBQU0sU0FBQTtRQUNGLElBQUMsQ0FBQSxNQUFELEdBQWlCO1FBQ2pCLElBQUMsQ0FBQSxTQUFELEdBQWlCO1FBQ2pCLElBQUMsQ0FBQSxZQUFELEdBQWlCO1FBQ2pCLElBQUMsQ0FBQSxVQUFELEdBQWlCO1FBQ2pCLElBQUMsQ0FBQSxRQUFELEdBQWlCO1FBQ2pCLElBQUMsQ0FBQSxHQUFELEdBQWlCO1FBQ2pCLElBQUMsQ0FBQSxHQUFELEdBQWlCO1FBQ2pCLElBQUMsQ0FBQSxPQUFELEdBQWlCO1FBQ2pCLElBQUMsQ0FBQSxTQUFELEdBQWlCO1FBQ2pCLElBQUMsQ0FBQSxTQUFELEdBQWdCLENBQUM7UUFDakIsSUFBQyxDQUFBLElBQUQsQ0FBQTtlQUNBLElBQUMsQ0FBQSxTQUFELEdBQWdCLENBQUM7SUFaZjs7d0JBY04sSUFBQSxHQUFNLFNBQUE7UUFDRixJQUFDLENBQUEsU0FBRCxHQUFlLElBQUksQ0FBQyxHQUFMLENBQVMsQ0FBVCxFQUFXLElBQUMsQ0FBQSxVQUFELEdBQWMsSUFBQyxDQUFBLFVBQTFCO1FBQ2YsSUFBQyxD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QUQsQ0FBQTt1QkFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLFlBQU4sRUFMSjthQUhKOztJQUZTOzt3QkFrQmIsYUFBQSxHQUFlLFNBQUMsQ0FBRDtRQUVYLElBQUcsSUFBQyxDQUFBLFVBQUQsS0FBZSxDQUFsQjtZQUNJLElBQUMsQ0FBQSxVQUFELEdBQWM7WUFDZCxJQUFDLENBQUEsVUFBRCxHQUFjLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBO1lBQzNCLElBQUMsQ0FBQSxJQUFELENBQUE7bUJBQ0EsSUFBQyxDQUFBLEVBQUQsQ0FBSSxDQUFKLEVBSko7O0lBRlc7Ozs7R0FyTks7O0FBNk54QixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgIFxuMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgIFxuMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgICAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMFxuIyMjXG5cbnsgY2xhbXAgfSA9IHJlcXVpcmUgJ2t4aydcblxuZXZlbnRzID0gcmVxdWlyZSAnZXZlbnRzJ1xuXG5jbGFzcyBNYXBTY3JvbGwgZXh0ZW5kcyBldmVudHNcblxuICAgIEA6IChjZmcpIC0+XG5cbiAgICAgICAgc3VwZXIoKVxuICAgICAgICBAbGluZUhlaWdodCA9IGNmZy5saW5lSGVpZ2h0ID8gMFxuICAgICAgICBAdmlld0hlaWdodCA9IGNmZy52aWV3SGVpZ2h0ID8gMFxuICAgICAgICBAZXhwb3NlTWF4ICA9IGNmZy5leHBvc2VNYXggPyAtNCAjIDwwOiAtdiAqIHZpZXdMaW5lcyB8IDA6IHVubGltaXRlZCB8ID4wOiB2ICogMVxuICAgICAgICBAc21vb3RoICAgICA9IGNmZy5zbW9vdGggPyB0cnVlXG4gICAgICAgIEBpbml0KClcbiAgICAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgIFxuXG4gICAgaW5pdDogLT5cbiAgICAgICAgQHNjcm9sbCAgICAgICA9ICAwICMgY3VycmVudCBzY3JvbGwgdmFsdWUgZnJvbSBkb2N1bWVudCBzdGFydCAocGl4ZWxzKVxuICAgICAgICBAb2Zmc2V0VG9wICAgID0gIDAgIyBoZWlnaHQgb2YgdmlldyBhYm92ZSBmaXJzdCB2aXNpYmxlIGxpbmUgKHBpeGVscylcbiAgICAgICAgQG9mZnNldFNtb290aCA9ICAwICMgc21vb3RoIHNjcm9sbGluZyBvZmZzZXQgLyBwYXJ0IG9mIHRvcCBsaW5lIHRoYXQgaXMgaGlkZGVuIChwaXhlbHMpXG4gICAgICAgIEBmdWxsSGVpZ2h0ICAgPSAgMCAjIHRvdGFsIGhlaWdodCBvZiBidWZmZXIgKHBpeGVscylcbiAgICAgICAgQG51bUxpbmVzICAgICA9ICAwICMgdG90YWwgbnVtYmVyIG9mIGxpbmVzIGluIGJ1ZmZlclxuICAgICAgICBAdG9wICAgICAgICAgID0gIDAgIyBpbmRleCBvZiBmaXJzdCB2aXNpYmxlIGxpbmUgaW4gdmlld1xuICAgICAgICBAYm90ICAgICAgICAgID0gIDAgIyBpbmRleCBvZiBsYXN0ICB2aXNpYmxlIGxpbmUgaW4gdmlld1xuICAgICAgICBAZXhwb3NlZCAgICAgID0gIDAgIyBudW1iZXIgb2YgY3VycmVudGx5IGV4cG9zZWQgbGluZXNcbiAgICAgICAgQGV4cG9zZVRvcCAgICA9ICAwICMgaW5kZXggb2YgdG9wbW9zdCBsaW5lIGluIHZpZXcgKGFsd2F5cyA8PSBAdG9wKVxuICAgICAgICBAZXhwb3NlQm90ICAgID0gLTEgIyBpbmRleCBvZiBib3R0b20gbGluZSBpbiB2aWV3IChhbHdheXMgPj0gQGJvdClcbiAgICAgICAgQGNhbGMoKVxuICAgICAgICBAb2Zmc2V0VG9wICAgID0gLTEgIyBoYWNrIHRvIGVtaXQgaW5pdGlhbCBzY3JvbGxcblxuICAgIGNhbGM6IC0+XG4gICAgICAgIEBzY3JvbGxNYXggICA9IE1hdGgubWF4KDAsQGZ1bGxIZWlnaHQgLSBAdmlld0hlaWdodCkgICMgbWF4aW11bSBzY3JvbGwgb2Zmc2V0IChwaXhlbHMpXG4gICAgICAgIEBmdWxsTGluZXMgICA9IE1hdGguZmxvb3IoQHZpZXdIZWlnaHQgLyBAbGluZUhlaWdodCkgICMgbnVtYmVyIG9mIGxpbmVzIGluIHZpZXcgKGV4Y2x1ZGluZyBwYXJ0aWFscylcbiAgICAgICAgQHZpZXdMaW5lcyAgID0gTWF0aC5jZWlsKEB2aWV3SGVpZ2h0IC8gQGxpbmVIZWlnaHQpICAgIyBudW1iZXIgb2YgbGluZXMgaW4gdmlldyAoaW5jbHVkaW5nIHBhcnRpYWxzKVxuICAgICAgICBAbGluZXNIZWlnaHQgPSBAdmlld0xpbmVzICogQGxpbmVIZWlnaHQgICAgICAgICAgICAgICAjIGhlaWdodCBvZiB2aXNpYmxlIGxpbmVzIChwaXhlbHMpXG5cbiAgICAgICAgaWYgQGV4cG9zZU1heCA8IDBcbiAgICAgICAgICAgIEBleHBvc2VOdW0gPSAtQGV4cG9zZU1heCAqIEB2aWV3TGluZXMgIyBtYXhpbXVtIHNpemUgb2YgZXhwb3NlIHJhbmdlIGlzIHZpZXdIZWlnaHQgZGVwZW5kZW50XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBleHBvc2VOdW0gPSBAZXhwb3NlTWF4XG4gICAgICAgICAgICBcbiAgICAgICAgQGV4cG9zZUhlaWdodCA9IEBleHBvc2VOdW0gKiBAbGluZUhlaWdodFxuXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCBcbiAgICBcbiAgICBpbmZvOiAtPlxuICAgICAgICB0b3Bib3Q6IFwiI3tAdG9wfSAuLiAje0Bib3R9ID0gI3tAYm90LUB0b3B9IC8gI3tAbnVtTGluZXN9IGxpbmVzXCJcbiAgICAgICAgZXhwb3NlOiBcIiN7QGV4cG9zZVRvcH0gLi4gI3tAZXhwb3NlQm90fSA9ICN7QGV4cG9zZUJvdC1AZXhwb3NlVG9wfSAvICN7QGV4cG9zZU51bX0gcHggI3tAZXhwb3NlSGVpZ2h0fVwiXG4gICAgICAgIHNjcm9sbDogXCIje0BzY3JvbGx9IG9mZnNldFRvcCAje0BvZmZzZXRUb3B9IHNjcm9sbE1heCAje0BzY3JvbGxNYXh9IGZ1bGxMaW5lcyAje0BmdWxsTGluZXN9IHZpZXdMaW5lcyAje0B2aWV3TGluZXN9IHZpZXdIZWlnaHQgI3tAdmlld0hlaWdodH1cIlxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgIFxuICAgIFxuICAgIHJlc2V0OiA9PlxuICAgICAgICBAZW1pdCAnY2xlYXJMaW5lcydcbiAgICAgICAgQGluaXQoKVxuXG4gICAgIyAwMDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMFxuICAgICMgICAgMDAwICAgICAgMDAwMDAwMCBcbiAgICBcbiAgICB0bzogKHApID0+IEBieSBwLUBzY3JvbGxcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwIDAwMCBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAgICAwMDAgICBcbiAgICAgICAgXG4gICAgYnk6IChkZWx0YSkgPT5cbiAgICAgICAgXG4gICAgICAgIHNjcm9sbCA9IEBzY3JvbGxcbiAgICAgICAgZGVsdGEgPSAwIGlmIE51bWJlci5pc05hTiBkZWx0YVxuICAgICAgICBAc2Nyb2xsID0gcGFyc2VJbnQgY2xhbXAgMCwgQHNjcm9sbE1heCwgQHNjcm9sbCtkZWx0YVxuICAgICAgICB0b3AgPSBwYXJzZUludCBAc2Nyb2xsIC8gQGxpbmVIZWlnaHRcbiAgICAgICAgQG9mZnNldFNtb290aCA9IEBzY3JvbGwgLSB0b3AgKiBAbGluZUhlaWdodCBcbiAgICAgICAgXG4gICAgICAgIEBzZXRUb3AgdG9wXG5cbiAgICAgICAgb2Zmc2V0ID0gMFxuICAgICAgICBvZmZzZXQgKz0gQG9mZnNldFNtb290aCBpZiBAc21vb3RoXG4gICAgICAgIG9mZnNldCArPSAodG9wIC0gQGV4cG9zZVRvcCkgKiBAbGluZUhlaWdodFxuICAgICAgICBcbiAgICAgICAgaWYgb2Zmc2V0ICE9IEBvZmZzZXRUb3Agb3Igc2Nyb2xsICE9IEBzY3JvbGxcbiAgICAgICAgICAgIEBvZmZzZXRUb3AgPSBwYXJzZUludCBvZmZzZXRcbiAgICAgICAgICAgIEBlbWl0ICdzY3JvbGwnLCBAc2Nyb2xsLCBAb2Zmc2V0VG9wXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwMCBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgICAgIFxuICAgICAgICAgICAgXG4gICAgc2V0VG9wOiAodG9wKSA9PlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIEBleHBvc2VCb3QgPCAwIGFuZCBAbnVtTGluZXMgPCAxXG4gICAgICAgIFxuICAgICAgICBvbGRUb3AgPSBAdG9wXG4gICAgICAgIG9sZEJvdCA9IEBib3RcbiAgICAgICAgQHRvcCA9IHRvcFxuICAgICAgICBAYm90ID0gTWF0aC5taW4gQHRvcCtAdmlld0xpbmVzLCBAbnVtTGluZXMtMVxuICAgICAgICByZXR1cm4gaWYgb2xkVG9wID09IEB0b3AgYW5kIG9sZEJvdCA9PSBAYm90IGFuZCBAZXhwb3NlQm90ID49IEBib3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgKEB0b3AgPj0gQGV4cG9zZUJvdCkgb3IgKEBib3QgPD0gQGV4cG9zZVRvcCkgIyBuZXcgcmFuZ2Ugb3V0c2lkZSwgc3RhcnQgZnJvbSBzY3JhdGNoXG4gICAgICAgICAgICBAZW1pdCAnY2xlYXJMaW5lcydcbiAgICAgICAgICAgIEBleHBvc2VUb3AgPSBAdG9wXG4gICAgICAgICAgICBAZXhwb3NlQm90ID0gQGJvdFxuICAgICAgICAgICAgbnVtID0gQGJvdCAtIEB0b3AgKyAxXG4gICAgICAgICAgICBpZiBudW0gPiAwXG4gICAgICAgICAgICAgICAgQGVtaXQgJ2V4cG9zZUxpbmVzJyB0b3A6QHRvcCwgYm90OkBib3QsIG51bTogbnVtXG4gICAgICAgICAgICAgICAgQGVtaXQgJ3Njcm9sbCcgQHNjcm9sbCwgQG9mZnNldFRvcFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBpZiBAdG9wIDwgQGV4cG9zZVRvcFxuICAgICAgICAgICAgb2xkVG9wID0gQGV4cG9zZVRvcFxuICAgICAgICAgICAgQGV4cG9zZVRvcCA9IE1hdGgubWF4IDAsIEB0b3AgLSAoTWF0aC5taW4gQHZpZXdMaW5lcywgQGV4cG9zZU51bSAtIEB2aWV3TGluZXMpXG4gICAgICAgICAgICBudW0gPSBvbGRUb3AgLSBAZXhwb3NlVG9wXG4gICAgICAgICAgICBpZiBudW0gPiAwXG4gICAgICAgICAgICAgICAgQGVtaXQgJ2V4cG9zZUxpbmVzJyB0b3A6QGV4cG9zZVRvcCwgYm90Om9sZFRvcC0xLCBudW06IG51bVxuICAgICAgICAgICAgICAgIFxuICAgICAgICB3aGlsZSBAYm90ID4gQGV4cG9zZUJvdFxuICAgICAgICAgICAgQGV4cG9zZUJvdCArPSAxXG4gICAgICAgICAgICBAZW1pdCAnZXhwb3NlTGluZScgQGV4cG9zZUJvdFxuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBleHBvc2VCb3QtQGV4cG9zZVRvcCsxID4gQGV4cG9zZU51bSBcbiAgICAgICAgICAgIG51bSAgPSBAZXhwb3NlQm90LUBleHBvc2VUb3ArMSAtIEBleHBvc2VOdW1cbiAgICAgICAgICAgIGlmIEB0b3A+b2xkVG9wXG4gICAgICAgICAgICAgICAgbiA9IGNsYW1wIDAsIEB0b3AtQGV4cG9zZVRvcCwgbnVtXG4gICAgICAgICAgICAgICAgQGV4cG9zZVRvcCArPSBuXG4gICAgICAgICAgICAgICAgQGVtaXQgJ3ZhbmlzaExpbmVzJyB0b3A6IG5cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBuID0gY2xhbXAgMCwgQGV4cG9zZUJvdC1AYm90LCBudW1cbiAgICAgICAgICAgICAgICBAZXhwb3NlQm90IC09IG5cbiAgICAgICAgICAgICAgICBAZW1pdCAndmFuaXNoTGluZXMnIGJvdDogblxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgXG4gICAgaW5zZXJ0TGluZTogKGxpLG9pKSA9PlxuICAgICAgICBAZXhwb3NlQm90ICs9IDEgaWYgQGxpbmVJbmRleElzSW5FeHBvc2Ugb2lcbiAgICAgICAgQGJvdCAgICAgICArPSAxIGlmIEBsaW5lSW5kZXhJc0luVmlldyBvaVxuICAgICAgICBAdG9wICAgICAgICs9IDEgaWYgb2kgPCBAdG9wXG4gICAgICAgIEBudW1MaW5lcyAgKz0gMVxuICAgICAgICBAZnVsbEhlaWdodCA9IEBudW1MaW5lcyAqIEBsaW5lSGVpZ2h0XG4gICAgICAgIEBjYWxjKClcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIGRlbGV0ZUxpbmU6IChsaSxvaSkgPT5cbiAgICAgICAgQGV4cG9zZUJvdCAtPSAxIGlmIEBsaW5lSW5kZXhJc0luRXhwb3NlKG9pKSBvciBAbnVtTGluZXMgPCBAZXhwb3NlTnVtXG4gICAgICAgIEBib3QgICAgICAgLT0gMSBpZiBAbGluZUluZGV4SXNJblZpZXcgb2lcbiAgICBcbiAgICBsaW5lSW5kZXhJc0luVmlldzogKGxpKSAtPiBcbiAgICAgICAgcmV0dXJuIHRydWUgaWYgQHRvcCA8PSBsaSA8PSBAYm90XG4gICAgICAgIHJldHVybiBAYm90LUB0b3ArMSA8IEBmdWxsTGluZXNcbiAgICAgICAgXG4gICAgbGluZUluZGV4SXNJbkV4cG9zZTogKGxpKSAtPlxuICAgICAgICByZXR1cm4gdHJ1ZSBpZiBAZXhwb3NlVG9wIDw9IGxpIDw9IEBleHBvc2VCb3QgXG4gICAgICAgIHJldHVybiBAZXhwb3NlQm90LUBleHBvc2VUb3ArMSA8IEBleHBvc2VOdW1cbiAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjICAwMDAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjICAgICAwICAgICAgMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICBcblxuICAgIHNldFZpZXdIZWlnaHQ6IChoKSA9PlxuICAgICAgICBpZiBAdmlld0hlaWdodCAhPSBoXG4gICAgICAgICAgICBAdmlld0hlaWdodCA9IGhcbiAgICAgICAgICAgIEBjYWxjKClcbiAgICAgICAgICAgIEBieSAwXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCBcbiAgICAgICAgXG4gICAgc2V0TnVtTGluZXM6IChuKSA9PlxuXG4gICAgICAgIGlmIEBudW1MaW5lcyAhPSBuXG4gICAgICAgICAgICBAbnVtTGluZXMgPSBuXG4gICAgICAgICAgICBAZnVsbEhlaWdodCA9IEBudW1MaW5lcyAqIEBsaW5lSGVpZ2h0ICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBAbnVtTGluZXNcbiAgICAgICAgICAgICAgICBAY2FsYygpXG4gICAgICAgICAgICAgICAgQGJ5IDBcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAaW5pdCgpXG4gICAgICAgICAgICAgICAgQGVtaXQgJ2NsZWFyTGluZXMnICAgICAgICAgICAgIFxuXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICBcblxuICAgIHNldExpbmVIZWlnaHQ6IChoKSA9PlxuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBsaW5lSGVpZ2h0ICE9IGhcbiAgICAgICAgICAgIEBsaW5lSGVpZ2h0ID0gaFxuICAgICAgICAgICAgQGZ1bGxIZWlnaHQgPSBAbnVtTGluZXMgKiBAbGluZUhlaWdodFxuICAgICAgICAgICAgQGNhbGMoKVxuICAgICAgICAgICAgQGJ5IDBcblxubW9kdWxlLmV4cG9ydHMgPSBNYXBTY3JvbGxcbiJdfQ==
//# sourceURL=../../coffee/editor/mapscroll.coffee