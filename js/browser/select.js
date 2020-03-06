// koffee 1.12.0

/*
 0000000  00000000  000      00000000   0000000  000000000
000       000       000      000       000          000   
0000000   0000000   000      0000000   000          000   
     000  000       000      000       000          000   
0000000   00000000  0000000  00000000   0000000     000
 */
var Select, klog;

klog = require('kxk').klog;

Select = (function() {
    function Select(browser) {
        this.browser = browser;
        this.rows = [];
        this.active = null;
    }

    Select.prototype.files = function() {
        var rows;
        rows = this.rows.filter(function(row) {
            return row.item.name !== '..';
        });
        return rows.map(function(row) {
            return row.item.file;
        });
    };

    Select.prototype.freeIndex = function() {
        var index;
        if (!this.active) {
            return -1;
        }
        index = this.active.index();
        while (index < this.active.column.numRows() - 1) {
            index += 1;
            if (!this.active.column.rows[index].isSelected()) {
                return index;
            }
        }
        index = this.active.index();
        while (index > 0) {
            index -= 1;
            if (!this.active.column.rows[index].isSelected()) {
                return index;
            }
        }
        return -1;
    };

    Select.prototype.clear = function() {
        var i, len, ref, ref1, row;
        ref1 = (ref = this.rows) != null ? ref : [];
        for (i = 0, len = ref1.length; i < len; i++) {
            row = ref1[i];
            row.clearSelected();
        }
        this.rows = [];
        return this.active = null;
    };

    Select.prototype.toggle = function(row) {
        var ref;
        if (row.column !== ((ref = this.active) != null ? ref.column : void 0)) {
            this.row(row);
            return;
        }
        if (row.isSelected()) {
            klog('unselect', row.item.file);
            row.clearActive();
            row.clearSelected();
            return this.rows.splice(this.rows.indexOf(row), 1);
        } else {
            row.setSelected();
            this.active = row;
            return this.rows.push(row);
        }
    };

    Select.prototype.row = function(row, activate) {
        var ref, ref1;
        if (activate == null) {
            activate = true;
        }
        if (!row) {
            return;
        }
        if (((ref = this.active) != null ? ref.column : void 0) === row.column && activate) {
            if ((ref1 = this.active) != null) {
                ref1.clearActive();
            }
        }
        this.clear();
        this.rows = [row];
        this.active = row;
        row.setSelected();
        if (!row.isActive() && activate) {
            return row.activate();
        }
    };

    Select.prototype.to = function(row, moveActive) {
        var from, i, index, r, ref, ref1, ref2, to;
        if (moveActive == null) {
            moveActive = false;
        }
        if (!row) {
            return;
        }
        if (row === this.active) {
            return;
        }
        if (!this.active) {
            return;
        }
        if (row.column !== this.active.column) {
            this.row(row);
            return;
        }
        if (row.index() > this.active.index()) {
            from = this.active.index() + 1;
            to = row.index();
        } else {
            from = row.index();
            to = this.active.index() - 1;
        }
        for (index = i = ref = from, ref1 = to; ref <= ref1 ? i <= ref1 : i >= ref1; index = ref <= ref1 ? ++i : --i) {
            r = this.active.column.rows[index];
            if (!r.isSelected()) {
                r.setSelected();
                this.rows.push(r);
            }
        }
        if (moveActive) {
            if ((ref2 = this.active) != null) {
                ref2.clearActive();
            }
            this.active = row;
            return this.active.setActive();
        }
    };

    return Select;

})();

module.exports = Select;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9icm93c2VyIiwic291cmNlcyI6WyJzZWxlY3QuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFFLE9BQVMsT0FBQSxDQUFRLEtBQVI7O0FBRUw7SUFFQyxnQkFBQyxPQUFEO1FBQUMsSUFBQyxDQUFBLFVBQUQ7UUFFQSxJQUFDLENBQUEsSUFBRCxHQUFRO1FBQ1IsSUFBQyxDQUFBLE1BQUQsR0FBVTtJQUhYOztxQkFLSCxLQUFBLEdBQU8sU0FBQTtBQUVILFlBQUE7UUFBQSxJQUFBLEdBQU8sSUFBQyxDQUFBLElBQUksQ0FBQyxNQUFOLENBQWEsU0FBQyxHQUFEO21CQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBVCxLQUFpQjtRQUExQixDQUFiO2VBQ1AsSUFBSSxDQUFDLEdBQUwsQ0FBUyxTQUFDLEdBQUQ7bUJBQVMsR0FBRyxDQUFDLElBQUksQ0FBQztRQUFsQixDQUFUO0lBSEc7O3FCQUtQLFNBQUEsR0FBVyxTQUFBO0FBRVAsWUFBQTtRQUFBLElBQWEsQ0FBSSxJQUFDLENBQUEsTUFBbEI7QUFBQSxtQkFBTyxDQUFDLEVBQVI7O1FBRUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixDQUFBO0FBQ1IsZUFBTSxLQUFBLEdBQVEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBZixDQUFBLENBQUEsR0FBeUIsQ0FBdkM7WUFDSSxLQUFBLElBQVM7WUFDVCxJQUFHLENBQUksSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSyxDQUFBLEtBQUEsQ0FBTSxDQUFDLFVBQTNCLENBQUEsQ0FBUDtBQUNJLHVCQUFPLE1BRFg7O1FBRko7UUFLQSxLQUFBLEdBQVEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLENBQUE7QUFDUixlQUFNLEtBQUEsR0FBUSxDQUFkO1lBQ0ksS0FBQSxJQUFTO1lBQ1QsSUFB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O2dCQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsSUFBTixDQUFXLENBQVgsRUFGSjs7QUFGSjtRQU1BLElBQUcsVUFBSDs7b0JBQ1csQ0FBRSxXQUFULENBQUE7O1lBQ0EsSUFBQyxDQUFBLE1BQUQsR0FBVTttQkFDVixJQUFDLENBQUEsTUFBTSxDQUFDLFNBQVIsQ0FBQSxFQUhKOztJQXZCQTs7Ozs7O0FBNEJSLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgXG4wMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgXG4wMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwICAgXG4jIyNcblxueyBrbG9nIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIFNlbGVjdFxuXG4gICAgQDogKEBicm93c2VyKSAtPiBcbiAgICBcbiAgICAgICAgQHJvd3MgPSBbXVxuICAgICAgICBAYWN0aXZlID0gbnVsbFxuICAgICAgICBcbiAgICBmaWxlczogLT4gXG4gICAgXG4gICAgICAgIHJvd3MgPSBAcm93cy5maWx0ZXIgKHJvdykgLT4gcm93Lml0ZW0ubmFtZSAhPSAnLi4nXG4gICAgICAgIHJvd3MubWFwIChyb3cpIC0+IHJvdy5pdGVtLmZpbGVcbiAgICAgICAgXG4gICAgZnJlZUluZGV4OiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIC0xIGlmIG5vdCBAYWN0aXZlXG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IEBhY3RpdmUuaW5kZXgoKVxuICAgICAgICB3aGlsZSBpbmRleCA8IEBhY3RpdmUuY29sdW1uLm51bVJvd3MoKS0xXG4gICAgICAgICAgICBpbmRleCArPSAxXG4gICAgICAgICAgICBpZiBub3QgQGFjdGl2ZS5jb2x1bW4ucm93c1tpbmRleF0uaXNTZWxlY3RlZCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4XG4gICAgICAgICAgICAgXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZS5pbmRleCgpXG4gICAgICAgIHdoaWxlIGluZGV4ID4gMFxuICAgICAgICAgICAgaW5kZXggLT0gMVxuICAgICAgICAgICAgaWYgbm90IEBhY3RpdmUuY29sdW1uLnJvd3NbaW5kZXhdLmlzU2VsZWN0ZWQoKVxuICAgICAgICAgICAgICAgIHJldHVybiBpbmRleFxuICAgICAgICAtMVxuICAgICAgICBcbiAgICBjbGVhcjogLT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgZm9yIHJvdyBpbiBAcm93cyA/IFtdXG4gICAgICAgICAgICByb3cuY2xlYXJTZWxlY3RlZCgpXG4gICAgICAgICAgICBcbiAgICAgICAgQHJvd3MgPSBbXVxuICAgICAgICBAYWN0aXZlID0gbnVsbFxuICAgIFxuICAgIHRvZ2dsZTogKHJvdykgLT5cblxuICAgICAgICAjIHJldHVybiBpZiByb3cgPT0gQGFjdGl2ZVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIHJvdy5jb2x1bW4gIT0gQGFjdGl2ZT8uY29sdW1uXG4gICAgICAgICAgICBAcm93IHJvd1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBpZiByb3cuaXNTZWxlY3RlZCgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGtsb2cgJ3Vuc2VsZWN0JyByb3cuaXRlbS5maWxlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJvdy5jbGVhckFjdGl2ZSgpXG4gICAgICAgICAgICByb3cuY2xlYXJTZWxlY3RlZCgpICAgICAgICAgICAgXG4gICAgICAgICAgICBAcm93cy5zcGxpY2UgQHJvd3MuaW5kZXhPZihyb3cpLCAxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJvdy5zZXRTZWxlY3RlZCgpXG4gICAgICAgICAgICBAYWN0aXZlID0gcm93XG4gICAgICAgICAgICBAcm93cy5wdXNoIHJvd1xuICAgIFxuICAgIHJvdzogKHJvdywgYWN0aXZhdGU9dHJ1ZSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3Qgcm93XG4gICAgICAgIFxuICAgICAgICBpZiBAYWN0aXZlPy5jb2x1bW4gPT0gcm93LmNvbHVtbiBhbmQgYWN0aXZhdGVcbiAgICAgICAgICAgIEBhY3RpdmU/LmNsZWFyQWN0aXZlKClcbiAgICAgICAgXG4gICAgICAgIEBjbGVhcigpXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgQHJvd3MgPSBbcm93XVxuICAgICAgICBAYWN0aXZlID0gcm93XG4gICAgICAgIHJvdy5zZXRTZWxlY3RlZCgpXG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgcm93LmlzQWN0aXZlKCkgYW5kIGFjdGl2YXRlXG4gICAgICAgICAgICByb3cuYWN0aXZhdGUoKVxuICAgICAgICAgICAgXG4gICAgdG86IChyb3csIG1vdmVBY3RpdmU9ZmFsc2UpIC0+IFxuXG4gICAgICAgIHJldHVybiBpZiBub3Qgcm93XG4gICAgICAgIHJldHVybiBpZiByb3cgPT0gQGFjdGl2ZVxuICAgICAgICByZXR1cm4gaWYgbm90IEBhY3RpdmVcbiAgICAgICAgXG4gICAgICAgIGlmIHJvdy5jb2x1bW4gIT0gQGFjdGl2ZS5jb2x1bW5cbiAgICAgICAgICAgIEByb3cgcm93XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIGlmIHJvdy5pbmRleCgpID4gQGFjdGl2ZS5pbmRleCgpXG4gICAgICAgICAgICBmcm9tID0gQGFjdGl2ZS5pbmRleCgpKzFcbiAgICAgICAgICAgIHRvICAgPSByb3cuaW5kZXgoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmcm9tID0gcm93LmluZGV4KClcbiAgICAgICAgICAgIHRvICAgPSBAYWN0aXZlLmluZGV4KCktMVxuICAgICAgICAgICAgXG4gICAgICAgIGZvciBpbmRleCBpbiBbZnJvbS4udG9dXG4gICAgICAgICAgICByID0gQGFjdGl2ZS5jb2x1bW4ucm93c1tpbmRleF1cbiAgICAgICAgICAgIGlmIG5vdCByLmlzU2VsZWN0ZWQoKSBcbiAgICAgICAgICAgICAgICByLnNldFNlbGVjdGVkKClcbiAgICAgICAgICAgICAgICBAcm93cy5wdXNoIHJcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgbW92ZUFjdGl2ZVxuICAgICAgICAgICAgQGFjdGl2ZT8uY2xlYXJBY3RpdmUoKVxuICAgICAgICAgICAgQGFjdGl2ZSA9IHJvd1xuICAgICAgICAgICAgQGFjdGl2ZS5zZXRBY3RpdmUoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbGVjdFxuIl19
//# sourceURL=../../coffee/browser/select.coffee