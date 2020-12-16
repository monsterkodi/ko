// koffee 1.14.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLi9jb2ZmZWUvd2luL2ZsZXgiLCJzb3VyY2VzIjpbInBhbmUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFFLFdBQWEsT0FBQSxDQUFRLEtBQVI7O0FBRVQ7SUFFQyxjQUFDLEdBQUQ7QUFFQyxZQUFBO0FBQUEsYUFBQSxRQUFBOztZQUFBLElBQUUsQ0FBQSxDQUFBLENBQUYsR0FBTztBQUFQOztZQUNBLElBQUMsQ0FBQTs7WUFBRCxJQUFDLENBQUEsWUFBYTs7O1lBQ2QsSUFBQyxDQUFBOztZQUFELElBQUMsQ0FBQSw2RUFBMkI7O1FBQzVCLElBQWtCLElBQUMsQ0FBQSxTQUFuQjtZQUFBLElBQUMsQ0FBQSxJQUFELEdBQVksQ0FBQyxFQUFiOzs7WUFDQSxJQUFDLENBQUE7O1lBQUQsSUFBQyxDQUFBLDJDQUFxQjs7UUFDdEIsSUFBa0MsSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQXJEOztnQkFBQSxJQUFDLENBQUE7O2dCQUFELElBQUMsQ0FBQSxVQUFXLElBQUMsQ0FBQSxHQUFHLENBQUMsS0FBSyxDQUFDO2FBQXZCOztRQUNBLElBQWlELG1CQUFqRDs7Z0JBQUEsSUFBQyxDQUFBOztnQkFBRCxJQUFDLENBQUEsVUFBVyxRQUFBLENBQVMsR0FBQSxHQUFJLElBQUMsQ0FBQSxHQUFHLENBQUMsRUFBbEIsRUFBd0IsU0FBeEI7YUFBWjs7UUFDQSxJQUFpRSxJQUFDLENBQUEsR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFoRjs7Z0JBQUEsSUFBQyxDQUFBOztnQkFBRCxJQUFDLENBQUEsVUFBVyxRQUFBLENBQVMsSUFBQSxHQUFLLElBQUMsQ0FBQSxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQWYsQ0FBcUIsR0FBckIsQ0FBeUIsQ0FBQyxJQUExQixDQUErQixJQUEvQixDQUFkO2FBQVo7OztZQUNBLElBQUMsQ0FBQTs7WUFBRCxJQUFDLENBQUEsVUFBVzs7SUFWYjs7bUJBWUgsTUFBQSxHQUFRLFNBQUE7UUFFSixJQUFDLENBQUEsSUFBRCxHQUFRLFFBQUEsQ0FBUyxJQUFDLENBQUEsU0FBRCxJQUFlLENBQUMsQ0FBaEIsSUFBcUIsSUFBSSxDQUFDLEdBQUwsQ0FBUyxJQUFDLENBQUEsSUFBVixFQUFnQixDQUFoQixDQUE5QjtRQUNSLElBQUMsQ0FBQSxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQVgsR0FBcUIsSUFBQyxDQUFBLFNBQUQsSUFBZSxNQUFmLElBQXlCLElBQUMsQ0FBQTtRQUUvQyxJQUFHLElBQUMsQ0FBQSxLQUFKO1lBQ0ksSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFNLENBQUEsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLENBQVgsR0FBaUMsSUFBQyxDQUFBLEtBQUYsR0FBUTttQkFDeEMsSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBWCxHQUFrQixNQUFBLEdBQU8sSUFBQyxDQUFBLEtBQVIsR0FBYyxLQUZwQztTQUFBLE1BR0ssSUFBRyxJQUFDLENBQUEsSUFBRCxHQUFRLENBQVg7bUJBQ0QsSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBWCxHQUFrQixNQUFBLEdBQU8sSUFBQyxDQUFBLElBQVIsR0FBYSxLQUQ5QjtTQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsSUFBRCxLQUFTLENBQVo7bUJBQ0QsSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBWCxHQUFrQixjQURqQjtTQUFBLE1BQUE7bUJBR0QsSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBWCxHQUFrQixRQUhqQjs7SUFWRDs7bUJBZVIsT0FBQSxHQUFTLFNBQUMsSUFBRDtRQUFDLElBQUMsQ0FBQSxPQUFEO1FBRU4sSUFBQyxDQUFBLFNBQUQsR0FBYSxJQUFDLENBQUEsSUFBRCxHQUFRO2VBQ3JCLElBQUMsQ0FBQSxNQUFELENBQUE7SUFISzs7bUJBS1QsR0FBQSxHQUFXLFNBQUE7QUFBRyxZQUFBOztlQUFJLENBQUUsTUFBTixDQUFBOztlQUFpQixPQUFPLElBQUMsQ0FBQTtJQUE1Qjs7bUJBQ1gsUUFBQSxHQUFXLFNBQUE7ZUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLENBQUMsQ0FBVjtJQUFIOzttQkFDWCxNQUFBLEdBQVcsU0FBQTtBQUFHLFlBQUE7UUFBQSxPQUFPLElBQUMsQ0FBQTtlQUFXLElBQUMsQ0FBQSxPQUFELG9DQUFrQixDQUFsQjtJQUF0Qjs7bUJBQ1gsU0FBQSxHQUFXLFNBQUE7ZUFBRyxDQUFJLElBQUMsQ0FBQTtJQUFSOzttQkFDWCxHQUFBLEdBQVcsU0FBQTtlQUFHLElBQUMsQ0FBQSxTQUFELENBQUE7SUFBSDs7bUJBQ1gsU0FBQSxHQUFXLFNBQUE7QUFFUCxZQUFBO1FBQUEsSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBWCxHQUFxQixJQUFDLENBQUE7UUFDdEIsQ0FBQSxHQUFJLElBQUMsQ0FBQSxHQUFHLENBQUMscUJBQUwsQ0FBQSxDQUE2QixDQUFBLElBQUMsQ0FBQSxJQUFJLENBQUMsUUFBTjtRQUNqQyxJQUFDLENBQUEsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFYLEdBQXFCLElBQUMsQ0FBQSxTQUFELENBQUEsQ0FBQSxJQUFpQixJQUFDLENBQUEsT0FBbEIsSUFBNkI7ZUFDbEQsUUFBQSxDQUFTLENBQUEsR0FBSSxJQUFDLENBQUEsSUFBSSxDQUFDLEdBQU4sQ0FBQSxDQUFiO0lBTE87O21CQU9YLFVBQUEsR0FBWSxTQUFBO1FBRVIsSUFBRyxJQUFDLENBQUEsU0FBSjtBQUFtQixtQkFBTyxDQUFDLEVBQTNCOztlQUNBLFFBQUEsQ0FBUyxJQUFDLENBQUEsR0FBRyxDQUFDLHFCQUFMLENBQUEsQ0FBNkIsQ0FBQSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sQ0FBdEM7SUFIUTs7Ozs7O0FBS2hCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICBcbjAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgXG4wMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgIFxuMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiMjI1xuXG57IGdldFN0eWxlIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIFBhbmVcbiAgICBcbiAgICBAOiAob3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgQFtrXSA9IHYgZm9yIGssdiBvZiBvcHRcbiAgICAgICAgQGNvbGxhcHNlZCA/PSBmYWxzZVxuICAgICAgICBAc2l6ZSAgICA/PSBAZml4ZWQgPyBAbWluID8gMFxuICAgICAgICBAc2l6ZSAgICAgPSAtMSBpZiBAY29sbGFwc2VkXG4gICAgICAgIEBpZCAgICAgID89IEBkaXYuaWQgPyBcInBhbmVcIlxuICAgICAgICBAZGlzcGxheSA/PSBAZGl2LnN0eWxlLmRpc3BsYXkgaWYgQGRpdi5zdHlsZS5kaXNwbGF5Lmxlbmd0aFxuICAgICAgICBAZGlzcGxheSA/PSBnZXRTdHlsZSBcIiMje0BkaXYuaWR9XCIsICdkaXNwbGF5JyBpZiBAZGl2LmlkP1xuICAgICAgICBAZGlzcGxheSA/PSBnZXRTdHlsZSAnIC4nK0BkaXYuY2xhc3NOYW1lLnNwbGl0KCcgJykuam9pbiAnIC4nIGlmIEBkaXYuY2xhc3NOYW1lLmxlbmd0aFxuICAgICAgICBAZGlzcGxheSA/PSAnaW5pdGlhbCdcbiAgICBcbiAgICB1cGRhdGU6IC0+XG5cbiAgICAgICAgQHNpemUgPSBwYXJzZUludCBAY29sbGFwc2VkIGFuZCAtMSBvciBNYXRoLm1heCBAc2l6ZSwgMFxuICAgICAgICBAZGl2LnN0eWxlLmRpc3BsYXkgPSBAY29sbGFwc2VkIGFuZCAnbm9uZScgb3IgQGRpc3BsYXlcbiAgICAgICAgXG4gICAgICAgIGlmIEBmaXhlZFxuICAgICAgICAgICAgQGRpdi5zdHlsZVtAZmxleC5kaW1lbnNpb25dID0gXCIje0BmaXhlZH1weFwiXG4gICAgICAgICAgICBAZGl2LnN0eWxlLmZsZXggPSBcIjAgMCAje0BmaXhlZH1weFwiXG4gICAgICAgIGVsc2UgaWYgQHNpemUgPiAwXG4gICAgICAgICAgICBAZGl2LnN0eWxlLmZsZXggPSBcIjEgMSAje0BzaXplfXB4XCJcbiAgICAgICAgZWxzZSBpZiBAc2l6ZSA9PSAwXG4gICAgICAgICAgICBAZGl2LnN0eWxlLmZsZXggPSBcIjAuMDEgMC4wMSAwXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGRpdi5zdHlsZS5mbGV4ID0gXCIwIDAgMFwiXG5cbiAgICBzZXRTaXplOiAoQHNpemUpIC0+IFxuXG4gICAgICAgIEBjb2xsYXBzZWQgPSBAc2l6ZSA8IDBcbiAgICAgICAgQHVwZGF0ZSgpXG4gICAgXG4gICAgZGVsOiAgICAgICAtPiBAZGl2Py5yZW1vdmUoKSA7IGRlbGV0ZSBAZGl2XG4gICAgY29sbGFwc2U6ICAtPiBAc2V0U2l6ZSAtMVxuICAgIGV4cGFuZDogICAgLT4gZGVsZXRlIEBjb2xsYXBzZWQ7IEBzZXRTaXplIEBmaXhlZCA/IDBcbiAgICBpc1Zpc2libGU6IC0+IG5vdCBAY29sbGFwc2VkXG4gICAgcG9zOiAgICAgICAtPiBAYWN0dWFsUG9zKClcbiAgICBhY3R1YWxQb3M6IC0+XG4gICAgICAgIFxuICAgICAgICBAZGl2LnN0eWxlLmRpc3BsYXkgPSBAZGlzcGxheVxuICAgICAgICByID0gQGRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVtAZmxleC5wb3NpdGlvbl1cbiAgICAgICAgQGRpdi5zdHlsZS5kaXNwbGF5ID0gQGlzVmlzaWJsZSgpIGFuZCBAZGlzcGxheSBvciAnbm9uZSdcbiAgICAgICAgcGFyc2VJbnQgciAtIEBmbGV4LnBvcygpXG5cbiAgICBhY3R1YWxTaXplOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQGNvbGxhcHNlZCB0aGVuIHJldHVybiAtMVxuICAgICAgICBwYXJzZUludCBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpW0BmbGV4LmRpbWVuc2lvbl1cbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFBhbmVcbiJdfQ==
//# sourceURL=../../../coffee/win/flex/pane.coffee