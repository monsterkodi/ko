// koffee 1.11.0

/*
000   000   0000000   000   000  0000000    000      00000000
000   000  000   000  0000  000  000   000  000      000     
000000000  000000000  000 0 000  000   000  000      0000000 
000   000  000   000  000  0000  000   000  000      000     
000   000  000   000  000   000  0000000    0000000  00000000
 */
var Handle, _, drag, elem, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), elem = ref.elem, drag = ref.drag, _ = ref._;

Handle = (function() {
    function Handle(opt) {
        this.onStop = bind(this.onStop, this);
        this.onDrag = bind(this.onDrag, this);
        this.onStart = bind(this.onStart, this);
        var k, v;
        for (k in opt) {
            v = opt[k];
            this[k] = v;
        }
        this.div = elem({
            "class": this.flex.handleClass
        });
        this.div.style.cursor = this.flex.cursor;
        this.div.style.display = 'block';
        this.flex.view.insertBefore(this.div, this.paneb.div);
        this.update();
        this.drag = new drag({
            target: this.div,
            onStart: this.onStart,
            onMove: this.onDrag,
            onStop: this.onStop,
            cursor: this.flex.cursor
        });
    }

    Handle.prototype.del = function() {
        var ref1;
        if ((ref1 = this.div) != null) {
            ref1.remove();
        }
        return delete this.div;
    };

    Handle.prototype.size = function() {
        return this.isVisible() && this.flex.handleSize || 0;
    };

    Handle.prototype.pos = function() {
        return parseInt(this.flex.posOfPane(this.index + 1) - this.flex.handleSize - (!this.isVisible() && this.flex.handleSize || 0));
    };

    Handle.prototype.actualPos = function() {
        return this.flex.pane(this.index + 1).actualPos() - this.flex.handleSize - (!this.isVisible() && this.flex.handleSize || 0);
    };

    Handle.prototype.update = function() {
        this.div.style.flex = "0 0 " + (this.size()) + "px";
        return this.div.style.display = this.isVisible() && 'block' || 'none';
    };

    Handle.prototype.isVisible = function() {
        return !(this.panea.collapsed && this.paneb.collapsed);
    };

    Handle.prototype.isFirst = function() {
        return this.index === 0;
    };

    Handle.prototype.isLast = function() {
        return this === _.last(this.flex.handles);
    };

    Handle.prototype.prev = function() {
        if (!this.isFirst()) {
            return this.flex.handles[this.index - 1];
        }
    };

    Handle.prototype.next = function() {
        if (!this.isLast()) {
            return this.flex.handles[this.index + 1];
        }
    };

    Handle.prototype.index = function() {
        return this.flex.handles.indexOf(this);
    };

    Handle.prototype.onStart = function() {
        return this.flex.handleStart(this);
    };

    Handle.prototype.onDrag = function(d) {
        return this.flex.handleDrag(this, d);
    };

    Handle.prototype.onStop = function() {
        return this.flex.handleEnd(this);
    };

    return Handle;

})();

module.exports = Handle;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFuZGxlLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uL2NvZmZlZS93aW4vZmxleCIsInNvdXJjZXMiOlsiaGFuZGxlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSwwQkFBQTtJQUFBOztBQVFBLE1BQW9CLE9BQUEsQ0FBUSxLQUFSLENBQXBCLEVBQUUsZUFBRixFQUFRLGVBQVIsRUFBYzs7QUFFUjtJQUVDLGdCQUFDLEdBQUQ7Ozs7QUFFQyxZQUFBO0FBQUEsYUFBQSxRQUFBOztZQUFBLElBQUUsQ0FBQSxDQUFBLENBQUYsR0FBTztBQUFQO1FBRUEsSUFBQyxDQUFBLEdBQUQsR0FBTyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBYjtTQUFMO1FBQ1AsSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBWCxHQUFvQixJQUFDLENBQUEsSUFBSSxDQUFDO1FBQzFCLElBQUMsQ0FBQSxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQVgsR0FBcUI7UUFDckIsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWCxDQUF3QixJQUFDLENBQUEsR0FBekIsRUFBOEIsSUFBQyxDQUFBLEtBQUssQ0FBQyxHQUFyQztRQUVBLElBQUMsQ0FBQSxNQUFELENBQUE7UUFFQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUksSUFBSixDQUNKO1lBQUEsTUFBQSxFQUFTLElBQUMsQ0FBQSxHQUFWO1lBQ0EsT0FBQSxFQUFTLElBQUMsQ0FBQSxPQURWO1lBRUEsTUFBQSxFQUFTLElBQUMsQ0FBQSxNQUZWO1lBR0EsTUFBQSxFQUFTLElBQUMsQ0FBQSxNQUhWO1lBSUEsTUFBQSxFQUFTLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFKZjtTQURJO0lBWFQ7O3FCQWtCSCxHQUFBLEdBQVcsU0FBQTtBQUFHLFlBQUE7O2dCQUFJLENBQUUsTUFBTixDQUFBOztlQUFnQixPQUFPLElBQUMsQ0FBQTtJQUEzQjs7cUJBQ1gsSUFBQSxHQUFXLFNBQUE7ZUFBRyxJQUFDLENBQUEsU0FBRCxDQUFBLENBQUEsSUFBaUIsSUFBQyxDQUFBLElBQUksQ0FBQyxVQUF2QixJQUFxQztJQUF4Qzs7cUJBQ1gsR0FBQSxHQUFXLFNBQUE7ZUFBRyxRQUFBLENBQVMsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLENBQWdCLElBQUMsQ0FBQSxLQUFELEdBQU8sQ0FBdkIsQ0FBQSxHQUE0QixJQUFDLENBQUEsSUFBSSxDQUFDLFVBQWxDLEdBQStDLENBQUMsQ0FBSSxJQUFDLENBQUEsU0FBRCxDQUFBLENBQUosSUFBcUIsSUFBQyxDQUFBLElBQUksQ0FBQyxVQUEzQixJQUF5QyxDQUExQyxDQUF4RDtJQUFIOztxQkFDWCxTQUFBLEdBQVcsU0FBQTtlQUFHLElBQUMsQ0FBQSxJQUFJLENBQUMsSUFBTixDQUFXLElBQUMsQ0FBQSxLQUFELEdBQU8sQ0FBbEIsQ0FBb0IsQ0FBQyxTQUFyQixDQUFBLENBQUEsR0FBbUMsSUFBQyxDQUFBLElBQUksQ0FBQyxVQUF6QyxHQUFzRCxDQUFDLENBQUksSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFKLElBQXFCLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBM0IsSUFBeUMsQ0FBMUM7SUFBekQ7O3FCQUNYLE1BQUEsR0FBVyxTQUFBO1FBQUcsSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBWCxHQUFrQixNQUFBLEdBQU0sQ0FBQyxJQUFDLENBQUEsSUFBRCxDQUFBLENBQUQsQ0FBTixHQUFlO2VBQUssSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBWCxHQUFxQixJQUFDLENBQUEsU0FBRCxDQUFBLENBQUEsSUFBaUIsT0FBakIsSUFBNEI7SUFBMUY7O3FCQUNYLFNBQUEsR0FBVyxTQUFBO2VBQUcsQ0FBSSxDQUFDLElBQUMsQ0FBQSxLQUFLLENBQUMsU0FBUCxJQUFxQixJQUFDLENBQUEsS0FBSyxDQUFDLFNBQTdCO0lBQVA7O3FCQUNYLE9BQUEsR0FBVyxTQUFBO2VBQUcsSUFBQyxDQUFBLEtBQUQsS0FBVTtJQUFiOztxQkFDWCxNQUFBLEdBQVcsU0FBQTtlQUFHLElBQUEsS0FBSyxDQUFDLENBQUMsSUFBRixDQUFPLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBYjtJQUFSOztxQkFDWCxJQUFBLEdBQVcsU0FBQTtRQUFHLElBQTJCLENBQUksSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUEvQjttQkFBQSxJQUFDLENBQUEsSUFBSSxDQUFDLE9BQVEsQ0FBQSxJQUFDLENBQUEsS0FBRCxHQUFPLENBQVAsRUFBZDs7SUFBSDs7cUJBQ1gsSUFBQSxHQUFXLFNBQUE7UUFBRyxJQUEyQixDQUFJLElBQUMsQ0FBQSxNQUFELENBQUEsQ0FBL0I7bUJBQUEsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFRLENBQUEsSUFBQyxDQUFBLEtBQUQsR0FBTyxDQUFQLEVBQWQ7O0lBQUg7O3FCQUNYLEtBQUEsR0FBVyxTQUFBO2VBQUcsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBZCxDQUFzQixJQUF0QjtJQUFIOztxQkFDWCxPQUFBLEdBQVksU0FBQTtlQUFHLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixDQUFrQixJQUFsQjtJQUFIOztxQkFDWixNQUFBLEdBQVEsU0FBQyxDQUFEO2VBQU8sSUFBQyxDQUFBLElBQUksQ0FBQyxVQUFOLENBQWlCLElBQWpCLEVBQW9CLENBQXBCO0lBQVA7O3FCQUNSLE1BQUEsR0FBWSxTQUFBO2VBQUcsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLENBQWdCLElBQWhCO0lBQUg7Ozs7OztBQUVoQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgIFxuMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwIFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuIyMjXG5cbnsgZWxlbSwgZHJhZywgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBIYW5kbGVcbiAgICBcbiAgICBAOiAob3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgQFtrXSA9IHYgZm9yIGssdiBvZiBvcHRcbiAgICAgICAgXG4gICAgICAgIEBkaXYgPSBlbGVtIGNsYXNzOiBAZmxleC5oYW5kbGVDbGFzc1xuICAgICAgICBAZGl2LnN0eWxlLmN1cnNvciA9IEBmbGV4LmN1cnNvclxuICAgICAgICBAZGl2LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXG4gICAgICAgIEBmbGV4LnZpZXcuaW5zZXJ0QmVmb3JlIEBkaXYsIEBwYW5lYi5kaXZcbiAgICAgICAgXG4gICAgICAgIEB1cGRhdGUoKVxuICAgICAgICBcbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQGRpdlxuICAgICAgICAgICAgb25TdGFydDogQG9uU3RhcnRcbiAgICAgICAgICAgIG9uTW92ZTogIEBvbkRyYWdcbiAgICAgICAgICAgIG9uU3RvcDogIEBvblN0b3BcbiAgICAgICAgICAgIGN1cnNvcjogIEBmbGV4LmN1cnNvclxuICAgICAgICAgICAgXG4gICAgZGVsOiAgICAgICAtPiBAZGl2Py5yZW1vdmUoKTsgZGVsZXRlIEBkaXZcbiAgICBzaXplOiAgICAgIC0+IEBpc1Zpc2libGUoKSBhbmQgQGZsZXguaGFuZGxlU2l6ZSBvciAwXG4gICAgcG9zOiAgICAgICAtPiBwYXJzZUludCBAZmxleC5wb3NPZlBhbmUoQGluZGV4KzEpIC0gQGZsZXguaGFuZGxlU2l6ZSAtIChub3QgQGlzVmlzaWJsZSgpIGFuZCBAZmxleC5oYW5kbGVTaXplIG9yIDApXG4gICAgYWN0dWFsUG9zOiAtPiBAZmxleC5wYW5lKEBpbmRleCsxKS5hY3R1YWxQb3MoKSAtIEBmbGV4LmhhbmRsZVNpemUgLSAobm90IEBpc1Zpc2libGUoKSBhbmQgQGZsZXguaGFuZGxlU2l6ZSBvciAwKVxuICAgIHVwZGF0ZTogICAgLT4gQGRpdi5zdHlsZS5mbGV4ID0gXCIwIDAgI3tAc2l6ZSgpfXB4XCI7IEBkaXYuc3R5bGUuZGlzcGxheSA9IEBpc1Zpc2libGUoKSBhbmQgJ2Jsb2NrJyBvciAnbm9uZSdcbiAgICBpc1Zpc2libGU6IC0+IG5vdCAoQHBhbmVhLmNvbGxhcHNlZCBhbmQgQHBhbmViLmNvbGxhcHNlZClcbiAgICBpc0ZpcnN0OiAgIC0+IEBpbmRleCA9PSAwXG4gICAgaXNMYXN0OiAgICAtPiBAID09IF8ubGFzdCBAZmxleC5oYW5kbGVzXG4gICAgcHJldjogICAgICAtPiBAZmxleC5oYW5kbGVzW0BpbmRleC0xXSBpZiBub3QgQGlzRmlyc3QoKVxuICAgIG5leHQ6ICAgICAgLT4gQGZsZXguaGFuZGxlc1tAaW5kZXgrMV0gaWYgbm90IEBpc0xhc3QoKVxuICAgIGluZGV4OiAgICAgLT4gQGZsZXguaGFuZGxlcy5pbmRleE9mIEBcbiAgICBvblN0YXJ0OiAgICA9PiBAZmxleC5oYW5kbGVTdGFydCBAXG4gICAgb25EcmFnOiAoZCkgPT4gQGZsZXguaGFuZGxlRHJhZyBALCBkXG4gICAgb25TdG9wOiAgICAgPT4gQGZsZXguaGFuZGxlRW5kIEBcblxubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGVcbiJdfQ==
//# sourceURL=../../../coffee/win/flex/handle.coffee