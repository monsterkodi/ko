// koffee 1.11.0
var _, ref, stopEvent;

ref = require('kxk'), stopEvent = ref.stopEvent, _ = ref._;

module.exports = {
    actions: {
        insertOrDeleteTab: {
            combos: ['tab', 'shift+tab']
        }
    },
    insertOrDeleteTab: function(key, info) {
        stopEvent(info != null ? info.event : void 0);
        switch (info.combo) {
            case 'tab':
                return this.insertTab();
            case 'shift+tab':
                return this.deleteTab();
        }
    },
    insertTab: function() {
        var c, i, il, len, n, newCursors;
        if (this.numSelections()) {
            return this.indent();
        } else {
            this["do"].start();
            newCursors = this["do"].cursors();
            il = this.indentString.length;
            for (i = 0, len = newCursors.length; i < len; i++) {
                c = newCursors[i];
                n = 4 - (c[0] % il);
                this["do"].change(c[1], this["do"].line(c[1]).splice(c[0], 0, _.padStart("", n)));
                cursorDelta(c, n);
            }
            this["do"].setCursors(newCursors);
            return this["do"].end();
        }
    },
    deleteTab: function() {
        var c, i, len, n, newCursors, t;
        if (this.numSelections()) {
            return this.deIndent();
        } else {
            this["do"].start();
            newCursors = this["do"].cursors();
            for (i = 0, len = newCursors.length; i < len; i++) {
                c = newCursors[i];
                if (c[0]) {
                    n = (c[0] % this.indentString.length) || this.indentString.length;
                    t = this["do"].textInRange([c[1], [c[0] - n, c[0]]]);
                    if (t.trim().length === 0) {
                        this["do"].change(c[1], this["do"].line(c[1]).splice(c[0] - n, n));
                        cursorDelta(c, -n);
                    }
                }
            }
            this["do"].setCursors(newCursors);
            return this["do"].end();
        }
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFiLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uL2NvZmZlZS9lZGl0b3IvYWN0aW9ucyIsInNvdXJjZXMiOlsidGFiLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBT0EsSUFBQTs7QUFBQSxNQUFtQixPQUFBLENBQVEsS0FBUixDQUFuQixFQUFFLHlCQUFGLEVBQWE7O0FBRWIsTUFBTSxDQUFDLE9BQVAsR0FFSTtJQUFBLE9BQUEsRUFDSTtRQUFBLGlCQUFBLEVBQ0k7WUFBQSxNQUFBLEVBQVEsQ0FBQyxLQUFELEVBQVEsV0FBUixDQUFSO1NBREo7S0FESjtJQUlBLGlCQUFBLEVBQW1CLFNBQUMsR0FBRCxFQUFNLElBQU47UUFFZixTQUFBLGdCQUFVLElBQUksQ0FBRSxjQUFoQjtBQUVBLGdCQUFPLElBQUksQ0FBQyxLQUFaO0FBQUEsaUJBQ1MsS0FEVDt1QkFDMEIsSUFBQyxDQUFBLFNBQUQsQ0FBQTtBQUQxQixpQkFFUyxXQUZUO3VCQUUwQixJQUFDLENBQUEsU0FBRCxDQUFBO0FBRjFCO0lBSmUsQ0FKbkI7SUFZQSxTQUFBLEVBQVcsU0FBQTtBQUVQLFlBQUE7UUFBQSxJQUFHLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBSDttQkFDSSxJQUFDLENBQUEsTUFBRCxDQUFBLEVBREo7U0FBQSxNQUFBO1lBR0ksSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEtBQUosQ0FBQTtZQUNBLFVBQUEsR0FBYSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsT0FBSixDQUFBO1lBQ2IsRUFBQSxHQUFLLElBQUMsQ0FBQSxZQUFZLENBQUM7QUFDbkIsaUJBQUEsNENBQUE7O2dCQUNJLENBQUEsR0FBSSxDQUFBLEdBQUUsQ0FBQyxDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQUssRUFBTjtnQkFDTixJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsTUFBSixDQUFXLENBQUUsQ0FBQSxDQUFBLENBQWIsRUFBaUIsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLElBQUosQ0FBUyxDQUFFLENBQUEsQ0FBQSxDQUFYLENBQWMsQ0FBQyxNQUFmLENBQXNCLENBQUUsQ0FBQSxDQUFBLENBQXhCLEVBQTRCLENBQTVCLEVBQStCLENBQUMsQ0FBQyxRQUFGLENBQVcsRUFBWCxFQUFlLENBQWYsQ0FBL0IsQ0FBakI7Z0JBQ0EsV0FBQSxDQUFZLENBQVosRUFBZSxDQUFmO0FBSEo7WUFJQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsVUFBSixDQUFlLFVBQWY7bUJBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEdBQUosQ0FBQSxFQVhKOztJQUZPLENBWlg7SUEyQkEsU0FBQSxFQUFXLFNBQUE7QUFFUCxZQUFBO1FBQUEsSUFBRyxJQUFDLENBQUEsYUFBRCxDQUFBLENBQUg7bUJBQ0ksSUFBQyxDQUFBLFFBQUQsQ0FBQSxFQURKO1NBQUEsTUFBQTtZQUdJLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxLQUFKLENBQUE7WUFDQSxVQUFBLEdBQWEsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE9BQUosQ0FBQTtBQUNiLGlCQUFBLDRDQUFBOztnQkFDSSxJQUFHLENBQUUsQ0FBQSxDQUFBLENBQUw7b0JBQ0ksQ0FBQSxHQUFJLENBQUMsQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFPLElBQUMsQ0FBQSxZQUFZLENBQUMsTUFBdEIsQ0FBQSxJQUFpQyxJQUFDLENBQUEsWUFBWSxDQUFDO29CQUNuRCxDQUFBLEdBQUksSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFdBQUosQ0FBZ0IsQ0FBQyxDQUFFLENBQUEsQ0FBQSxDQUFILEVBQU8sQ0FBQyxDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQUssQ0FBTixFQUFTLENBQUUsQ0FBQSxDQUFBLENBQVgsQ0FBUCxDQUFoQjtvQkFDSixJQUFHLENBQUMsQ0FBQyxJQUFGLENBQUEsQ0FBUSxDQUFDLE1BQVQsS0FBbUIsQ0FBdEI7d0JBQ0ksSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE1BQUosQ0FBVyxDQUFFLENBQUEsQ0FBQSxDQUFiLEVBQWlCLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsQ0FBRSxDQUFBLENBQUEsQ0FBWCxDQUFjLENBQUMsTUFBZixDQUFzQixDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQUssQ0FBM0IsRUFBOEIsQ0FBOUIsQ0FBakI7d0JBQ0EsV0FBQSxDQUFZLENBQVosRUFBZSxDQUFDLENBQWhCLEVBRko7cUJBSEo7O0FBREo7WUFPQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsVUFBSixDQUFlLFVBQWY7bUJBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEdBQUosQ0FBQSxFQWJKOztJQUZPLENBM0JYIiwic291cmNlc0NvbnRlbnQiOlsiXG4jIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiMgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcblxueyBzdG9wRXZlbnQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxubW9kdWxlLmV4cG9ydHMgPSBcbiAgICBcbiAgICBhY3Rpb25zOlxuICAgICAgICBpbnNlcnRPckRlbGV0ZVRhYjpcbiAgICAgICAgICAgIGNvbWJvczogWyd0YWInLCAnc2hpZnQrdGFiJ11cbiAgICAgICAgXG4gICAgaW5zZXJ0T3JEZWxldGVUYWI6IChrZXksIGluZm8pIC0+XG4gICAgICAgIFxuICAgICAgICBzdG9wRXZlbnQgaW5mbz8uZXZlbnRcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBpbmZvLmNvbWJvXG4gICAgICAgICAgICB3aGVuICd0YWInICAgICAgIHRoZW4gQGluc2VydFRhYigpXG4gICAgICAgICAgICB3aGVuICdzaGlmdCt0YWInIHRoZW4gQGRlbGV0ZVRhYigpXG4gICAgICAgICAgICBcbiAgICBpbnNlcnRUYWI6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbnVtU2VsZWN0aW9ucygpXG4gICAgICAgICAgICBAaW5kZW50KClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgICAgIG5ld0N1cnNvcnMgPSBAZG8uY3Vyc29ycygpXG4gICAgICAgICAgICBpbCA9IEBpbmRlbnRTdHJpbmcubGVuZ3RoXG4gICAgICAgICAgICBmb3IgYyBpbiBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgbiA9IDQtKGNbMF0laWwpXG4gICAgICAgICAgICAgICAgQGRvLmNoYW5nZSBjWzFdLCBAZG8ubGluZShjWzFdKS5zcGxpY2UgY1swXSwgMCwgXy5wYWRTdGFydCBcIlwiLCBuXG4gICAgICAgICAgICAgICAgY3Vyc29yRGVsdGEgYywgblxuICAgICAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29yc1xuICAgICAgICAgICAgQGRvLmVuZCgpICAgXG5cbiAgICBkZWxldGVUYWI6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbnVtU2VsZWN0aW9ucygpXG4gICAgICAgICAgICBAZGVJbmRlbnQoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICAgICAgbmV3Q3Vyc29ycyA9IEBkby5jdXJzb3JzKClcbiAgICAgICAgICAgIGZvciBjIGluIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICBpZiBjWzBdXG4gICAgICAgICAgICAgICAgICAgIG4gPSAoY1swXSAlIEBpbmRlbnRTdHJpbmcubGVuZ3RoKSBvciBAaW5kZW50U3RyaW5nLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICB0ID0gQGRvLnRleHRJblJhbmdlIFtjWzFdLCBbY1swXS1uLCBjWzBdXV1cbiAgICAgICAgICAgICAgICAgICAgaWYgdC50cmltKCkubGVuZ3RoID09IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIEBkby5jaGFuZ2UgY1sxXSwgQGRvLmxpbmUoY1sxXSkuc3BsaWNlIGNbMF0tbiwgblxuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yRGVsdGEgYywgLW5cbiAgICAgICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnNcbiAgICAgICAgICAgIEBkby5lbmQoKVxuXG4iXX0=
//# sourceURL=../../../coffee/editor/actions/tab.coffee