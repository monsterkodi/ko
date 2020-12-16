// koffee 1.14.0

/*
 0000000   0000000  00000000    0000000   000      000      00000000  00000000
000       000       000   000  000   000  000      000      000       000   000
0000000   000       0000000    000   000  000      000      0000000   0000000
     000  000       000   000  000   000  000      000      000       000   000
0000000    0000000  000   000   0000000   0000000  0000000  00000000  000   000
 */
var Scroller, clamp, drag, elem, ref, scheme, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), clamp = ref.clamp, drag = ref.drag, elem = ref.elem, scheme = ref.scheme, stopEvent = ref.stopEvent;

scheme = require('../tools/scheme');

Scroller = (function() {
    function Scroller(column, parent) {
        this.column = column;
        this.parent = parent;
        this.update = bind(this.update, this);
        this.onScroll = bind(this.onScroll, this);
        this.onWheel = bind(this.onWheel, this);
        this.onDrag = bind(this.onDrag, this);
        this.onStart = bind(this.onStart, this);
        this.elem = elem({
            "class": 'scrollbar right',
            parent: this.parent
        });
        this.handle = elem({
            "class": 'scrollhandle right',
            parent: this.elem
        });
        this.target = this.column.table;
        this.drag = new drag({
            target: this.elem,
            onStart: this.onStart,
            onMove: this.onDrag,
            cursor: 'ns-resize'
        });
        this.elem.addEventListener('wheel', this.onWheel);
        this.column.div.addEventListener('wheel', this.onWheel);
        this.target.addEventListener('scroll', this.onScroll);
    }

    Scroller.prototype.numRows = function() {
        return this.column.numRows();
    };

    Scroller.prototype.visRows = function() {
        return 1 + parseInt(this.height() / this.column.rowHeight());
    };

    Scroller.prototype.rowHeight = function() {
        return this.column.rowHeight();
    };

    Scroller.prototype.height = function() {
        return this.parent.getBoundingClientRect().height;
    };

    Scroller.prototype.onStart = function(drag, event) {
        var br, ln, ly, sy;
        br = this.elem.getBoundingClientRect();
        sy = clamp(0, this.height(), event.clientY - br.top);
        ln = parseInt(this.numRows() * sy / this.height());
        ly = (ln - this.visRows() / 2) * this.rowHeight();
        return this.target.scrollTop = ly;
    };

    Scroller.prototype.onDrag = function(drag) {
        var delta;
        delta = (drag.delta.y / (this.visRows() * this.rowHeight())) * this.numRows() * this.rowHeight();
        this.target.scrollTop += delta;
        return this.update();
    };

    Scroller.prototype.onWheel = function(event) {
        if (Math.abs(event.deltaX) >= 2 * Math.abs(event.deltaY) || Math.abs(event.deltaY) === 0) {
            this.target.scrollLeft += event.deltaX;
        } else {
            this.target.scrollTop += event.deltaY;
        }
        return stopEvent(event);
    };

    Scroller.prototype.onScroll = function(event) {
        return this.update();
    };

    Scroller.prototype.toIndex = function(i) {
        var newTop, row;
        row = this.column.rows[i].div;
        newTop = this.target.scrollTop;
        if (newTop < row.offsetTop + this.rowHeight() - this.height()) {
            newTop = row.offsetTop + this.rowHeight() - this.height();
        } else if (newTop > row.offsetTop) {
            newTop = row.offsetTop;
        }
        this.target.scrollTop = parseInt(newTop);
        return this.update();
    };

    Scroller.prototype.update = function() {
        var bh, cf, cs, longColor, scrollHeight, scrollTop, shortColor, vh;
        if (this.numRows() * this.rowHeight() < this.height()) {
            this.elem.style.display = 'none';
            this.handle.style.top = "0";
            this.handle.style.height = "0";
            this.handle.style.width = "0";
        } else {
            this.elem.style.display = 'block';
            bh = this.numRows() * this.rowHeight();
            vh = Math.min(this.visRows() * this.rowHeight(), this.height());
            scrollTop = parseInt((this.target.scrollTop / bh) * vh);
            scrollHeight = parseInt(((this.visRows() * this.rowHeight()) / bh) * vh);
            scrollHeight = Math.max(scrollHeight, parseInt(this.rowHeight() / 4));
            scrollTop = Math.min(scrollTop, this.height() - scrollHeight);
            scrollTop = Math.max(0, scrollTop);
            this.handle.style.top = scrollTop + "px";
            this.handle.style.height = scrollHeight + "px";
            this.handle.style.width = "2px";
            longColor = scheme.colorForClass('scroller long');
            shortColor = scheme.colorForClass('scroller short');
            cf = 1 - clamp(0, 1, (scrollHeight - 10) / 200);
            cs = scheme.fadeColor(longColor, shortColor, cf);
            this.handle.style.backgroundColor = cs;
        }
        return this.handle.style.right = "-" + this.target.scrollLeft + "px";
    };

    return Scroller;

})();

module.exports = Scroller;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2Jyb3dzZXIiLCJzb3VyY2VzIjpbInNjcm9sbGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxtREFBQTtJQUFBOztBQVFBLE1BQTJDLE9BQUEsQ0FBUSxLQUFSLENBQTNDLEVBQUUsaUJBQUYsRUFBUyxlQUFULEVBQWUsZUFBZixFQUFxQixtQkFBckIsRUFBNkI7O0FBRTdCLE1BQUEsR0FBUyxPQUFBLENBQVEsaUJBQVI7O0FBRUg7SUFFQyxrQkFBQyxNQUFELEVBQVUsTUFBVjtRQUFDLElBQUMsQ0FBQSxTQUFEO1FBQVMsSUFBQyxDQUFBLFNBQUQ7Ozs7OztRQUVULElBQUMsQ0FBQSxJQUFELEdBQVUsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxpQkFBTjtZQUEyQixNQUFBLEVBQU8sSUFBQyxDQUFBLE1BQW5DO1NBQUw7UUFDVixJQUFDLENBQUEsTUFBRCxHQUFVLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sb0JBQU47WUFBMkIsTUFBQSxFQUFPLElBQUMsQ0FBQSxJQUFuQztTQUFMO1FBQ1YsSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFDLENBQUEsTUFBTSxDQUFDO1FBRWxCLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBSSxJQUFKLENBQ0o7WUFBQSxNQUFBLEVBQVMsSUFBQyxDQUFBLElBQVY7WUFDQSxPQUFBLEVBQVMsSUFBQyxDQUFBLE9BRFY7WUFFQSxNQUFBLEVBQVMsSUFBQyxDQUFBLE1BRlY7WUFHQSxNQUFBLEVBQVMsV0FIVDtTQURJO1FBTVIsSUFBQyxDQUFBLElBQUksQ0FBQyxnQkFBTixDQUE2QixPQUE3QixFQUFzQyxJQUFDLENBQUEsT0FBdkM7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxnQkFBWixDQUE2QixPQUE3QixFQUFzQyxJQUFDLENBQUEsT0FBdkM7UUFD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ICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgY2xhbXAsIGRyYWcsIGVsZW0sIHNjaGVtZSwgc3RvcEV2ZW50IH0gPSByZXF1aXJlICdreGsnXG5cbnNjaGVtZSA9IHJlcXVpcmUgJy4uL3Rvb2xzL3NjaGVtZSdcblxuY2xhc3MgU2Nyb2xsZXJcblxuICAgIEA6IChAY29sdW1uLCBAcGFyZW50KSAtPlxuXG4gICAgICAgIEBlbGVtICAgPSBlbGVtIGNsYXNzOidzY3JvbGxiYXIgcmlnaHQnICAgIHBhcmVudDpAcGFyZW50XG4gICAgICAgIEBoYW5kbGUgPSBlbGVtIGNsYXNzOidzY3JvbGxoYW5kbGUgcmlnaHQnIHBhcmVudDpAZWxlbVxuICAgICAgICBAdGFyZ2V0ID0gQGNvbHVtbi50YWJsZVxuXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBlbGVtXG4gICAgICAgICAgICBvblN0YXJ0OiBAb25TdGFydFxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uRHJhZ1xuICAgICAgICAgICAgY3Vyc29yOiAgJ25zLXJlc2l6ZSdcblxuICAgICAgICBAZWxlbS5hZGRFdmVudExpc3RlbmVyICAgICAgICd3aGVlbCcgIEBvbldoZWVsXG4gICAgICAgIEBjb2x1bW4uZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ3doZWVsJyAgQG9uV2hlZWxcbiAgICAgICAgQHRhcmdldC5hZGRFdmVudExpc3RlbmVyICdzY3JvbGwnIEBvblNjcm9sbFxuICAgICAgICBcbiAgICBudW1Sb3dzOiAgIC0+IEBjb2x1bW4ubnVtUm93cygpXG4gICAgdmlzUm93czogICAtPiAxICsgcGFyc2VJbnQgQGhlaWdodCgpIC8gQGNvbHVtbi5yb3dIZWlnaHQoKVxuICAgIHJvd0hlaWdodDogLT4gQGNvbHVtbi5yb3dIZWlnaHQoKVxuICAgIGhlaWdodDogICAgLT4gQHBhcmVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHRcbiAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIG9uU3RhcnQ6IChkcmFnLCBldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIGJyID0gQGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgc3kgPSBjbGFtcCAwLCBAaGVpZ2h0KCksIGV2ZW50LmNsaWVudFkgLSBici50b3BcbiAgICAgICAgbG4gPSBwYXJzZUludCBAbnVtUm93cygpICogc3kvQGhlaWdodCgpXG4gICAgICAgIGx5ID0gKGxuIC0gQHZpc1Jvd3MoKSAvIDIpICogQHJvd0hlaWdodCgpXG4gICAgICAgIEB0YXJnZXQuc2Nyb2xsVG9wID0gbHlcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG5cbiAgICBvbkRyYWc6IChkcmFnKSA9PlxuICAgICAgICBcbiAgICAgICAgZGVsdGEgPSAoZHJhZy5kZWx0YS55IC8gKEB2aXNSb3dzKCkgKiBAcm93SGVpZ2h0KCkpKSAqIEBudW1Sb3dzKCkgKiBAcm93SGVpZ2h0KClcbiAgICAgICAgQHRhcmdldC5zY3JvbGxUb3AgKz0gZGVsdGFcbiAgICAgICAgQHVwZGF0ZSgpXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAgICAgIDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgb25XaGVlbDogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgTWF0aC5hYnMoZXZlbnQuZGVsdGFYKSA+PSAyKk1hdGguYWJzKGV2ZW50LmRlbHRhWSkgb3IgTWF0aC5hYnMoZXZlbnQuZGVsdGFZKSA9PSAwXG4gICAgICAgICAgICBAdGFyZ2V0LnNjcm9sbExlZnQgKz0gZXZlbnQuZGVsdGFYXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0YXJnZXQuc2Nyb2xsVG9wICs9IGV2ZW50LmRlbHRhWVxuICAgICAgICBzdG9wRXZlbnQgZXZlbnQgICAgXG4gICAgICAgIFxuICAgIG9uU2Nyb2xsOiAoZXZlbnQpID0+IEB1cGRhdGUoKVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHRvSW5kZXg6IChpKSAtPlxuICAgICAgICBcbiAgICAgICAgcm93ID0gQGNvbHVtbi5yb3dzW2ldLmRpdlxuICAgICAgICBuZXdUb3AgPSBAdGFyZ2V0LnNjcm9sbFRvcFxuICAgICAgICBpZiBuZXdUb3AgPCByb3cub2Zmc2V0VG9wICsgQHJvd0hlaWdodCgpIC0gQGhlaWdodCgpXG4gICAgICAgICAgICBuZXdUb3AgPSByb3cub2Zmc2V0VG9wICsgQHJvd0hlaWdodCgpIC0gQGhlaWdodCgpXG4gICAgICAgIGVsc2UgaWYgbmV3VG9wID4gcm93Lm9mZnNldFRvcFxuICAgICAgICAgICAgbmV3VG9wID0gcm93Lm9mZnNldFRvcFxuICAgICAgICBAdGFyZ2V0LnNjcm9sbFRvcCA9IHBhcnNlSW50IG5ld1RvcFxuICAgICAgICBAdXBkYXRlKClcblxuICAgIHVwZGF0ZTogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBudW1Sb3dzKCkgKiBAcm93SGVpZ2h0KCkgPCBAaGVpZ2h0KClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGVsZW0uc3R5bGUuZGlzcGxheSAgID0gJ25vbmUnXG4gICAgICAgICAgICBAaGFuZGxlLnN0eWxlLnRvcCAgICAgPSBcIjBcIlxuICAgICAgICAgICAgQGhhbmRsZS5zdHlsZS5oZWlnaHQgID0gXCIwXCJcbiAgICAgICAgICAgIEBoYW5kbGUuc3R5bGUud2lkdGggICA9IFwiMFwiXG4gICAgICAgICAgICBcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGVsZW0uc3R5bGUuZGlzcGxheSAgID0gJ2Jsb2NrJ1xuICAgICAgICAgICAgYmggICAgICAgICAgID0gQG51bVJvd3MoKSAqIEByb3dIZWlnaHQoKVxuICAgICAgICAgICAgdmggICAgICAgICAgID0gTWF0aC5taW4gKEB2aXNSb3dzKCkgKiBAcm93SGVpZ2h0KCkpLCBAaGVpZ2h0KClcbiAgICAgICAgICAgIHNjcm9sbFRvcCAgICA9IHBhcnNlSW50IChAdGFyZ2V0LnNjcm9sbFRvcCAvIGJoKSAqIHZoXG4gICAgICAgICAgICBzY3JvbGxIZWlnaHQgPSBwYXJzZUludCAoKEB2aXNSb3dzKCkgKiBAcm93SGVpZ2h0KCkpIC8gYmgpICogdmhcbiAgICAgICAgICAgIHNjcm9sbEhlaWdodCA9IE1hdGgubWF4IHNjcm9sbEhlaWdodCwgcGFyc2VJbnQgQHJvd0hlaWdodCgpLzRcbiAgICAgICAgICAgIHNjcm9sbFRvcCAgICA9IE1hdGgubWluIHNjcm9sbFRvcCwgQGhlaWdodCgpLXNjcm9sbEhlaWdodFxuICAgICAgICAgICAgc2Nyb2xsVG9wICAgID0gTWF0aC5tYXggMCwgc2Nyb2xsVG9wXG5cbiAgICAgICAgICAgIEBoYW5kbGUuc3R5bGUudG9wICAgICA9IFwiI3tzY3JvbGxUb3B9cHhcIlxuICAgICAgICAgICAgQGhhbmRsZS5zdHlsZS5oZWlnaHQgID0gXCIje3Njcm9sbEhlaWdodH1weFwiXG4gICAgICAgICAgICBAaGFuZGxlLnN0eWxlLndpZHRoICAgPSBcIjJweFwiXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxvbmdDb2xvciAgPSBzY2hlbWUuY29sb3JGb3JDbGFzcyAnc2Nyb2xsZXIgbG9uZydcbiAgICAgICAgICAgIHNob3J0Q29sb3IgPSBzY2hlbWUuY29sb3JGb3JDbGFzcyAnc2Nyb2xsZXIgc2hvcnQnXG4gICAgICAgICAgICBjZiA9IDEgLSBjbGFtcCAwLCAxLCAoc2Nyb2xsSGVpZ2h0LTEwKS8yMDBcbiAgICAgICAgICAgIGNzID0gc2NoZW1lLmZhZGVDb2xvciBsb25nQ29sb3IsIHNob3J0Q29sb3IsIGNmXG4gICAgICAgICAgICBAaGFuZGxlLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNzXG4gICAgICAgICAgICBcbiAgICAgICAgQGhhbmRsZS5zdHlsZS5yaWdodCA9IFwiLSN7QHRhcmdldC5zY3JvbGxMZWZ0fXB4XCJcblxubW9kdWxlLmV4cG9ydHMgPSBTY3JvbGxlclxuIl19
//# sourceURL=../../coffee/browser/scroller.coffee