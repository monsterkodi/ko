// koffee 1.4.0

/*
00000000    0000000   000   000  00000000
000   000  000   000  0000  000  000     
00000000   000000000  000 0 000  0000000 
000        000   000  000  0000  000     
000        000   000  000   000  00000000
 */
var Pane, getStyle;

getStyle = require('kxk').getStyle;

Pane = (function() {
    function Pane(opt) {
        var k, ref, ref1, ref2, v;
        for (k in opt) {
            v = opt[k];
            this[k] = v;
        }
        if (this.collapsed != null) {
            this.collapsed;
        } else {
            this.collapsed = false;
        }
        if (this.size != null) {
            this.size;
        } else {
            this.size = (ref = (ref1 = this.fixed) != null ? ref1 : this.min) != null ? ref : 0;
        }
        if (this.collapsed) {
            this.size = -1;
        }
        if (this.id != null) {
            this.id;
        } else {
            this.id = (ref2 = this.div.id) != null ? ref2 : "pane";
        }
        if (this.div.style.display.length) {
            if (this.display != null) {
                this.display;
            } else {
                this.display = this.div.style.display;
            }
        }
        if (this.div.id != null) {
            if (this.display != null) {
                this.display;
            } else {
                this.display = getStyle("#" + this.div.id, 'display');
            }
        }
        if (this.div.className.length) {
            if (this.display != null) {
                this.display;
            } else {
                this.display = getStyle(' .' + this.div.className.split(' ').join(' .'));
            }
        }
        if (this.display != null) {
            this.display;
        } else {
            this.display = 'initial';
        }
    }

    Pane.prototype.update = function() {
        this.size = parseInt(this.collapsed && -1 || Math.max(this.size, 0));
        this.div.style.display = this.collapsed && 'none' || this.display;
        if (this.fixed) {
            this.div.style[this.flex.dimension] = this.fixed + "px";
            return this.div.style.flex = "0 0 " + this.fixed + "px";
        } else if (this.size > 0) {
            return this.div.style.flex = "1 1 " + this.size + "px";
        } else if (this.size === 0) {
            return this.div.style.flex = "0.01 0.01 0";
        } else {
            return this.div.style.flex = "0 0 0";
        }
    };

    Pane.prototype.setSize = function(size) {
        this.size = size;
        this.collapsed = this.size < 0;
        return this.update();
    };

    Pane.prototype.del = function() {
        var ref;
        if ((ref = this.div) != null) {
            ref.remove();
        }
        return delete this.div;
    };

    Pane.prototype.collapse = function() {
        return this.setSize(-1);
    };

    Pane.prototype.expand = function() {
        var ref;
        delete this.collapsed;
        return this.setSize((ref = this.fixed) != null ? ref : 0);
    };

    Pane.prototype.isVisible = function() {
        return !this.collapsed;
    };

    Pane.prototype.pos = function() {
        return this.actualPos();
    };

    Pane.prototype.actualPos = function() {
        var r;
        this.div.style.display = this.display;
        r = this.div.getBoundingClientRect()[this.flex.position];
        this.div.style.display = this.isVisible() && this.display || 'none';
        return parseInt(r - this.flex.pos());
    };

    Pane.prototype.actualSize = function() {
        if (this.collapsed) {
            return -1;
        }
        return parseInt(this.div.getBoundingClientRect()[this.flex.dimension]);
    };

    return Pane;

})();

module.exports = Pane;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUUsV0FBYSxPQUFBLENBQVEsS0FBUjs7QUFFVDtJQUVDLGNBQUMsR0FBRDtBQUVDLFlBQUE7QUFBQSxhQUFBLFFBQUE7O1lBQUEsSUFBRSxDQUFBLENBQUEsQ0FBRixHQUFPO0FBQVA7O1lBQ0EsSUFBQyxDQUFBOztZQUFELElBQUMsQ0FBQSxZQUFhOzs7WUFDZCxJQUFDLENBQUE7O1lBQUQsSUFBQyxDQUFBLDZFQUEyQjs7UUFDNUIsSUFBa0IsSUFBQyxDQUFBLFNBQW5CO1lBQUEsSUFBQyxDQUFBLElBQUQsR0FBWSxDQUFDLEVBQWI7OztZQUNBLElBQUMsQ0FBQTs7WUFBRCxJQUFDLENBQUEsMkNBQXFCOztRQUN0QixJQUFrQyxJQUFDLENBQUEsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBckQ7O2dCQUFBLElBQUMsQ0FBQTs7Z0JBQUQsSUFBQyxDQUFBLFVBQVcsSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFLLENBQUM7YUFBdkI7O1FBQ0EsSUFBaUQsbUJBQWpEOztnQkFBQSxJQUFDLENBQUE7O2dCQUFELElBQUMsQ0FBQSxVQUFXLFFBQUEsQ0FBUyxHQUFBLEdBQUksSUFBQyxDQUFBLEdBQUcsQ0FBQyxFQUFsQixFQUF3QixTQUF4QjthQUFaOztRQUNBLElBQWlFLElBQUMsQ0FBQSxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQWhGOztnQkFBQSxJQUFDLENBQUE7O2dCQUFELElBQUMsQ0FBQSxVQUFXLFFBQUEsQ0FBUyxJQUFBLEdBQUssSUFBQyxDQUFBLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBZixDQUFxQixHQUFyQixDQUF5QixDQUFDLElBQTFCLENBQStCLElBQS9CLENBQWQ7YUFBWjs7O1lBQ0EsSUFBQyxDQUFBOztZQUFELElBQUMsQ0FBQSxVQUFXOztJQVZiOzttQkFZSCxNQUFBLEdBQVEsU0FBQTtRQUVKLElBQUMsQ0FBQSxJQUFELEdBQVEsUUFBQSxDQUFTLElBQUMsQ0FBQSxTQUFELElBQWUsQ0FBQyxDQUFoQixJQUFxQixJQUFJLENBQUMsR0FBTCxDQUFTLElBQUMsQ0FBQSxJQUFWLEVBQWdCLENBQWhCLENBQTlCO1FBQ1IsSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBWCxHQUFxQixJQUFDLENBQUEsU0FBRCxJQUFlLE1BQWYsSUFBeUIsSUFBQyxDQUFBO1FBRS9DLElBQUcsSUFBQyxDQUFBLEtBQUo7WUFDSSxJQUFDLENBQUEsR0FBRyxDQUFDLEtBQU0sQ0FBQSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sQ0FBWCxHQUFpQyxJQUFDLENBQUEsS0FBRixHQUFRO21CQUN4QyxJQUFDLENBQUEsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFYLEdBQWtCLE1BQUEsR0FBTyxJQUFDLENBQUEsS0FBUixHQUFjLEtBRnBDO1NBQUEsTUFHSyxJQUFHLElBQUMsQ0FBQSxJQUFELEdBQVEsQ0FBWDttQkFDRCxJQUFDLENBQUEsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFYLEdBQWtCLE1BQUEsR0FBTyxJQUFDLENBQUEsSUFBUixHQUFhLEtBRDlCO1NBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxJQUFELEtBQVMsQ0FBWjttQkFDRCxJQUFDLENBQUEsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFYLEdBQWtCLGNBRGpCO1NBQUEsTUFBQTttQkFHRCxJQUFDLENBQUEsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFYLEdBQWtCLFFBSGpCOztJQVZEOzttQkFlUixPQUFBLEdBQVMsU0FBQyxJQUFEO1FBQUMsSUFBQyxDQUFBLE9BQUQ7UUFFTixJQUFDLENBQUEsU0FBRCxHQUFhLElBQUMsQ0FBQSxJQUFELEdBQVE7ZUFDckIsSUFBQyxDQUFBLE1BQUQsQ0FBQTtJQUhLOzttQkFLVCxHQUFBLEdBQVcsU0FBQTtBQUFHLFlBQUE7O2VBQUksQ0FBRSxNQUFOLENBQUE7O2VBQWlCLE9BQU8sSUFBQyxDQUFBO0lBQTVCOzttQkFDWCxRQUFBLEdBQVcsU0FBQTtlQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsQ0FBQyxDQUFWO0lBQUg7O21CQUNYLE1BQUEsR0FBVyxTQUFBO0FBQUcsWUFBQTtRQUFBLE9BQU8sSUFBQyxDQUFBO2VBQVcsSUFBQyxDQUFBLE9BQUQsb0NBQWtCLENBQWxCO0lBQXRCOzttQkFDWCxTQUFBLEdBQVcsU0FBQTtlQUFHLENBQUksSUFBQyxDQUFBO0lBQVI7O21CQUNYLEdBQUEsR0FBVyxTQUFBO2VBQUcsSUFBQyxDQUFBLFNBQUQsQ0FBQTtJQUFIOzttQkFDWCxTQUFBLEdBQVcsU0FBQTtBQUVQLFlBQUE7UUFBQSxJQUFDLENBQUEsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFYLEdBQXFCLElBQUMsQ0FBQTtRQUN0QixDQUFBLEdBQUksSUFBQyxDQUFBLEdBQUcsQ0FBQyxxQkFBTCxDQUFBLENBQTZCLENBQUEsSUFBQyxDQUFBLElBQUksQ0FBQyxRQUFOO1FBQ2pDLElBQUMsQ0FBQSxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQVgsR0FBcUIsSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFBLElBQWlCLElBQUMsQ0FBQSxPQUFsQixJQUE2QjtlQUNsRCxRQUFBLENBQVMsQ0FBQSxHQUFJLElBQUMsQ0FBQSxJQUFJLENBQUMsR0FBTixDQUFBLENBQWI7SUFMTzs7bUJBT1gsVUFBQSxHQUFZLFNBQUE7UUFFUixJQUFHLElBQUMsQ0FBQSxTQUFKO0FBQW1CLG1CQUFPLENBQUMsRUFBM0I7O2VBQ0EsUUFBQSxDQUFTLElBQUMsQ0FBQSxHQUFHLENBQUMscUJBQUwsQ0FBQSxDQUE2QixDQUFBLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBTixDQUF0QztJQUhROzs7Ozs7QUFLaEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgIFxuMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCBcbjAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgXG4wMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMFxuIyMjXG5cbnsgZ2V0U3R5bGUgfSA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgUGFuZVxuICAgIFxuICAgIEA6IChvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBAW2tdID0gdiBmb3Igayx2IG9mIG9wdFxuICAgICAgICBAY29sbGFwc2VkID89IGZhbHNlXG4gICAgICAgIEBzaXplICAgID89IEBmaXhlZCA/IEBtaW4gPyAwXG4gICAgICAgIEBzaXplICAgICA9IC0xIGlmIEBjb2xsYXBzZWRcbiAgICAgICAgQGlkICAgICAgPz0gQGRpdi5pZCA/IFwicGFuZVwiXG4gICAgICAgIEBkaXNwbGF5ID89IEBkaXYuc3R5bGUuZGlzcGxheSBpZiBAZGl2LnN0eWxlLmRpc3BsYXkubGVuZ3RoXG4gICAgICAgIEBkaXNwbGF5ID89IGdldFN0eWxlIFwiIyN7QGRpdi5pZH1cIiwgJ2Rpc3BsYXknIGlmIEBkaXYuaWQ/XG4gICAgICAgIEBkaXNwbGF5ID89IGdldFN0eWxlICcgLicrQGRpdi5jbGFzc05hbWUuc3BsaXQoJyAnKS5qb2luICcgLicgaWYgQGRpdi5jbGFzc05hbWUubGVuZ3RoXG4gICAgICAgIEBkaXNwbGF5ID89ICdpbml0aWFsJ1xuICAgIFxuICAgIHVwZGF0ZTogLT5cblxuICAgICAgICBAc2l6ZSA9IHBhcnNlSW50IEBjb2xsYXBzZWQgYW5kIC0xIG9yIE1hdGgubWF4IEBzaXplLCAwXG4gICAgICAgIEBkaXYuc3R5bGUuZGlzcGxheSA9IEBjb2xsYXBzZWQgYW5kICdub25lJyBvciBAZGlzcGxheVxuICAgICAgICBcbiAgICAgICAgaWYgQGZpeGVkXG4gICAgICAgICAgICBAZGl2LnN0eWxlW0BmbGV4LmRpbWVuc2lvbl0gPSBcIiN7QGZpeGVkfXB4XCJcbiAgICAgICAgICAgIEBkaXYuc3R5bGUuZmxleCA9IFwiMCAwICN7QGZpeGVkfXB4XCJcbiAgICAgICAgZWxzZSBpZiBAc2l6ZSA+IDBcbiAgICAgICAgICAgIEBkaXYuc3R5bGUuZmxleCA9IFwiMSAxICN7QHNpemV9cHhcIlxuICAgICAgICBlbHNlIGlmIEBzaXplID09IDBcbiAgICAgICAgICAgIEBkaXYuc3R5bGUuZmxleCA9IFwiMC4wMSAwLjAxIDBcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAZGl2LnN0eWxlLmZsZXggPSBcIjAgMCAwXCJcblxuICAgIHNldFNpemU6IChAc2l6ZSkgLT4gXG5cbiAgICAgICAgQGNvbGxhcHNlZCA9IEBzaXplIDwgMFxuICAgICAgICBAdXBkYXRlKClcbiAgICBcbiAgICBkZWw6ICAgICAgIC0+IEBkaXY/LnJlbW92ZSgpIDsgZGVsZXRlIEBkaXZcbiAgICBjb2xsYXBzZTogIC0+IEBzZXRTaXplIC0xXG4gICAgZXhwYW5kOiAgICAtPiBkZWxldGUgQGNvbGxhcHNlZDsgQHNldFNpemUgQGZpeGVkID8gMFxuICAgIGlzVmlzaWJsZTogLT4gbm90IEBjb2xsYXBzZWRcbiAgICBwb3M6ICAgICAgIC0+IEBhY3R1YWxQb3MoKVxuICAgIGFjdHVhbFBvczogLT5cbiAgICAgICAgXG4gICAgICAgIEBkaXYuc3R5bGUuZGlzcGxheSA9IEBkaXNwbGF5XG4gICAgICAgIHIgPSBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpW0BmbGV4LnBvc2l0aW9uXVxuICAgICAgICBAZGl2LnN0eWxlLmRpc3BsYXkgPSBAaXNWaXNpYmxlKCkgYW5kIEBkaXNwbGF5IG9yICdub25lJ1xuICAgICAgICBwYXJzZUludCByIC0gQGZsZXgucG9zKClcblxuICAgIGFjdHVhbFNpemU6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAY29sbGFwc2VkIHRoZW4gcmV0dXJuIC0xXG4gICAgICAgIHBhcnNlSW50IEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClbQGZsZXguZGltZW5zaW9uXVxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gUGFuZVxuIl19
//# sourceURL=../../../coffee/win/flex/pane.coffee