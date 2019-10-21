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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUUsV0FBYSxPQUFBLENBQVEsS0FBUjs7QUFFVDtJQUVXLGNBQUMsR0FBRDtBQUVULFlBQUE7QUFBQSxhQUFBLFFBQUE7O1lBQUEsSUFBRSxDQUFBLENBQUEsQ0FBRixHQUFPO0FBQVA7O1lBQ0EsSUFBQyxDQUFBOztZQUFELElBQUMsQ0FBQSxZQUFhOzs7WUFDZCxJQUFDLENBQUE7O1lBQUQsSUFBQyxDQUFBLDZFQUEyQjs7UUFDNUIsSUFBa0IsSUFBQyxDQUFBLFNBQW5CO1lBQUEsSUFBQyxDQUFBLElBQUQsR0FBWSxDQUFDLEVBQWI7OztZQUNBLElBQUMsQ0FBQTs7WUFBRCxJQUFDLENBQUEsMkNBQXFCOztRQUN0QixJQUFrQyxJQUFDLENBQUEsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBckQ7O2dCQUFBLElBQUMsQ0FBQTs7Z0JBQUQsSUFBQyxDQUFBLFVBQVcsSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFLLENBQUM7YUFBdkI7O1FBQ0EsSUFBaUQsbUJBQWpEOztnQkFBQSxJQUFDLENBQUE7O2dCQUFELElBQUMsQ0FBQSxVQUFXLFFBQUEsQ0FBUyxHQUFBLEdBQUksSUFBQyxDQUFBLEdBQUcsQ0FBQyxFQUFsQixFQUF3QixTQUF4QjthQUFaOztRQUNBLElBQWlFLElBQUMsQ0FBQSxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQWhGOztnQkFBQSxJQUFDLENBQUE7O2dCQUFELElBQUMsQ0FBQSxVQUFXLFFBQUEsQ0FBUyxJQUFBLEdBQUssSUFBQyxDQUFBLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBZixDQUFxQixHQUFyQixDQUF5QixDQUFDLElBQTFCLENBQStCLElBQS9CLENBQWQ7YUFBWjs7O1lBQ0EsSUFBQyxDQUFBOztZQUFELElBQUMsQ0FBQSxVQUFXOztJQVZIOzttQkFZYixNQUFBLEdBQVEsU0FBQTtRQUVKLElBQUMsQ0FBQSxJQUFELEdBQVEsUUFBQSxDQUFTLElBQUMsQ0FBQSxTQUFELElBQWUsQ0FBQyxDQUFoQixJQUFxQixJQUFJLENBQUMsR0FBTCxDQUFTLElBQUMsQ0FBQSxJQUFWLEVBQWdCLENBQWhCLENBQTlCO1FBQ1IsSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBWCxHQUFxQixJQUFDLENBQUEsU0FBRCxJQUFlLE1BQWYsSUFBeUIsSUFBQyxDQUFBO1FBRS9DLElBQUcsSUFBQyxDQUFBLEtBQUo7WUFDSSxJQUFDLENBQUEsR0FBRyxDQUFDLEtBQU0sQ0FBQSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sQ0FBWCxHQUFpQyxJQUFDLENBQUEsS0FBRixHQUFRO21CQUN4QyxJQUFDLENBQUEsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFYLEdBQWtCLE1BQUEsR0FBTyxJQUFDLENBQUEsS0FBUixHQUFjLEtBRnBDO1NBQUEsTUFHSyxJQUFHLElBQUMsQ0FBQSxJQUFELEdBQVEsQ0FBWDttQkFDRCxJQUFDLENBQUEsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFYLEdBQWtCLE1BQUEsR0FBTyxJQUFDLENBQUEsSUFBUixHQUFhLEtBRDlCO1NBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxJQUFELEtBQVMsQ0FBWjttQkFDRCxJQUFDLENBQUEsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFYLEdBQWtCLGNBRGpCO1NBQUEsTUFBQTttQkFHRCxJQUFDLENBQUEsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFYLEdBQWtCLFFBSGpCOztJQVZEOzttQkFlUixPQUFBLEdBQVMsU0FBQyxJQUFEO1FBQUMsSUFBQyxDQUFBLE9BQUQ7UUFFTixJQUFDLENBQUEsU0FBRCxHQUFhLElBQUMsQ0FBQSxJQUFELEdBQVE7ZUFDckIsSUFBQyxDQUFBLE1BQUQsQ0FBQTtJQUhLOzttQkFLVCxHQUFBLEdBQVcsU0FBQTtBQUFHLFlBQUE7O2VBQUksQ0FBRSxNQUFOLENBQUE7O2VBQWlCLE9BQU8sSUFBQyxDQUFBO0lBQTVCOzttQkFDWCxRQUFBLEdBQVcsU0FBQTtlQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsQ0FBQyxDQUFWO0lBQUg7O21CQUNYLE1BQUEsR0FBVyxTQUFBO0FBQUcsWUFBQTtRQUFBLE9BQU8sSUFBQyxDQUFBO2VBQVcsSUFBQyxDQUFBLE9BQUQsb0NBQWtCLENBQWxCO0lBQXRCOzttQkFDWCxTQUFBLEdBQVcsU0FBQTtlQUFHLENBQUksSUFBQyxDQUFBO0lBQVI7O21CQUNYLEdBQUEsR0FBVyxTQUFBO2VBQUcsSUFBQyxDQUFBLFNBQUQsQ0FBQTtJQUFIOzttQkFDWCxTQUFBLEdBQVcsU0FBQTtBQUVQLFlBQUE7UUFBQSxJQUFDLENBQUEsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFYLEdBQXFCLElBQUMsQ0FBQTtRQUN0QixDQUFBLEdBQUksSUFBQyxDQUFBLEdBQUcsQ0FBQyxxQkFBTCxDQUFBLENBQTZCLENBQUEsSUFBQyxDQUFBLElBQUksQ0FBQyxRQUFOO1FBQ2pDLElBQUMsQ0FBQSxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQVgsR0FBcUIsSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFBLElBQWlCLElBQUMsQ0FBQSxPQUFsQixJQUE2QjtlQUNsRCxRQUFBLENBQVMsQ0FBQSxHQUFJLElBQUMsQ0FBQSxJQUFJLENBQUMsR0FBTixDQUFBLENBQWI7SUFMTzs7bUJBT1gsVUFBQSxHQUFZLFNBQUE7UUFFUixJQUFHLElBQUMsQ0FBQSxTQUFKO0FBQW1CLG1CQUFPLENBQUMsRUFBM0I7O2VBQ0EsUUFBQSxDQUFTLElBQUMsQ0FBQSxHQUFHLENBQUMscUJBQUwsQ0FBQSxDQUE2QixDQUFBLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBTixDQUF0QztJQUhROzs7Ozs7QUFLaEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgIFxuMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCBcbjAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgXG4wMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMFxuIyMjXG5cbnsgZ2V0U3R5bGUgfSA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgUGFuZVxuICAgIFxuICAgIGNvbnN0cnVjdG9yOiAob3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgQFtrXSA9IHYgZm9yIGssdiBvZiBvcHRcbiAgICAgICAgQGNvbGxhcHNlZCA/PSBmYWxzZVxuICAgICAgICBAc2l6ZSAgICA/PSBAZml4ZWQgPyBAbWluID8gMFxuICAgICAgICBAc2l6ZSAgICAgPSAtMSBpZiBAY29sbGFwc2VkXG4gICAgICAgIEBpZCAgICAgID89IEBkaXYuaWQgPyBcInBhbmVcIlxuICAgICAgICBAZGlzcGxheSA/PSBAZGl2LnN0eWxlLmRpc3BsYXkgaWYgQGRpdi5zdHlsZS5kaXNwbGF5Lmxlbmd0aFxuICAgICAgICBAZGlzcGxheSA/PSBnZXRTdHlsZSBcIiMje0BkaXYuaWR9XCIsICdkaXNwbGF5JyBpZiBAZGl2LmlkP1xuICAgICAgICBAZGlzcGxheSA/PSBnZXRTdHlsZSAnIC4nK0BkaXYuY2xhc3NOYW1lLnNwbGl0KCcgJykuam9pbiAnIC4nIGlmIEBkaXYuY2xhc3NOYW1lLmxlbmd0aFxuICAgICAgICBAZGlzcGxheSA/PSAnaW5pdGlhbCdcbiAgICBcbiAgICB1cGRhdGU6IC0+XG5cbiAgICAgICAgQHNpemUgPSBwYXJzZUludCBAY29sbGFwc2VkIGFuZCAtMSBvciBNYXRoLm1heCBAc2l6ZSwgMFxuICAgICAgICBAZGl2LnN0eWxlLmRpc3BsYXkgPSBAY29sbGFwc2VkIGFuZCAnbm9uZScgb3IgQGRpc3BsYXlcbiAgICAgICAgXG4gICAgICAgIGlmIEBmaXhlZFxuICAgICAgICAgICAgQGRpdi5zdHlsZVtAZmxleC5kaW1lbnNpb25dID0gXCIje0BmaXhlZH1weFwiXG4gICAgICAgICAgICBAZGl2LnN0eWxlLmZsZXggPSBcIjAgMCAje0BmaXhlZH1weFwiXG4gICAgICAgIGVsc2UgaWYgQHNpemUgPiAwXG4gICAgICAgICAgICBAZGl2LnN0eWxlLmZsZXggPSBcIjEgMSAje0BzaXplfXB4XCJcbiAgICAgICAgZWxzZSBpZiBAc2l6ZSA9PSAwXG4gICAgICAgICAgICBAZGl2LnN0eWxlLmZsZXggPSBcIjAuMDEgMC4wMSAwXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGRpdi5zdHlsZS5mbGV4ID0gXCIwIDAgMFwiXG5cbiAgICBzZXRTaXplOiAoQHNpemUpIC0+IFxuXG4gICAgICAgIEBjb2xsYXBzZWQgPSBAc2l6ZSA8IDBcbiAgICAgICAgQHVwZGF0ZSgpXG4gICAgXG4gICAgZGVsOiAgICAgICAtPiBAZGl2Py5yZW1vdmUoKSA7IGRlbGV0ZSBAZGl2XG4gICAgY29sbGFwc2U6ICAtPiBAc2V0U2l6ZSAtMVxuICAgIGV4cGFuZDogICAgLT4gZGVsZXRlIEBjb2xsYXBzZWQ7IEBzZXRTaXplIEBmaXhlZCA/IDBcbiAgICBpc1Zpc2libGU6IC0+IG5vdCBAY29sbGFwc2VkXG4gICAgcG9zOiAgICAgICAtPiBAYWN0dWFsUG9zKClcbiAgICBhY3R1YWxQb3M6IC0+XG4gICAgICAgIFxuICAgICAgICBAZGl2LnN0eWxlLmRpc3BsYXkgPSBAZGlzcGxheVxuICAgICAgICByID0gQGRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVtAZmxleC5wb3NpdGlvbl1cbiAgICAgICAgQGRpdi5zdHlsZS5kaXNwbGF5ID0gQGlzVmlzaWJsZSgpIGFuZCBAZGlzcGxheSBvciAnbm9uZSdcbiAgICAgICAgcGFyc2VJbnQgciAtIEBmbGV4LnBvcygpXG5cbiAgICBhY3R1YWxTaXplOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQGNvbGxhcHNlZCB0aGVuIHJldHVybiAtMVxuICAgICAgICBwYXJzZUludCBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpW0BmbGV4LmRpbWVuc2lvbl1cbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFBhbmVcbiJdfQ==
//# sourceURL=../../../coffee/win/flex/pane.coffee