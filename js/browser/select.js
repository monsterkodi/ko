// koffee 1.18.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9icm93c2VyIiwic291cmNlcyI6WyJzZWxlY3QuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFFLE9BQVMsT0FBQSxDQUFRLEtBQVI7O0FBRUw7SUFFQyxnQkFBQyxPQUFEO1FBQUMsSUFBQyxDQUFBLFVBQUQ7UUFFQSxJQUFDLENBQUEsSUFBRCxHQUFRO1FBQ1IsSUFBQyxDQUFBLE1BQUQsR0FBVTtJQUhYOztxQkFLSCxLQUFBLEdBQU8sU0FBQTtBQUVILFlBQUE7UUFBQSxJQUFBLEdBQU8sSUFBQyxDQUFBLElBQUksQ0FBQyxNQUFOLENBQWEsU0FBQyxHQUFEO21CQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBVCxLQUFpQjtRQUExQixDQUFiO2VBQ1AsSUFBSSxDQUFDLEdBQUwsQ0FBUyxTQUFDLEdBQUQ7bUJBQVMsR0FBRyxDQUFDLElBQUksQ0FBQztRQUFsQixDQUFUO0lBSEc7O3FCQUtQLFNBQUEsR0FBVyxTQUFBO0FBRVAsWUFBQTtRQUFBLElBQWEsQ0FBSSxJQUFDLENBQUEsTUFBbEI7QUFBQSxtQkFBTyxDQUFDLEVBQVI7O1FBRUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixDQUFBO0FBQ1IsZUFBTSxLQUFBLEdBQVEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBZixDQUFBLENBQUEsR0FBeUIsQ0FBdkM7WUFDSSxLQUFBLElBQVM7WUFDVCxJQUFHLENBQUksSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSyxDQUFBLEtBQUEsQ0FBTSxDQUFDLFVBQTNCLENBQUEsQ0FBUDtBQUNJLHVCQUFPLE1BRFg7O1FBRko7UUFLQSxLQUFBLEdBQVEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLENBQUE7QUFDUixlQUFNLEtBQUEsR0FBUSxDQUFkO1lBQ0ksS0FBQSxJQUFTO1lBQ1QsSUFB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O2dCQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsSUFBTixDQUFXLENBQVgsRUFGSjs7QUFGSjtRQU1BLElBQUcsVUFBSDs7b0JBQ1csQ0FBRSxXQUFULENBQUE7O1lBQ0EsSUFBQyxDQUFBLE1BQUQsR0FBVTttQkFDVixJQUFDLENBQUEsTUFBTSxDQUFDLFNBQVIsQ0FBQSxFQUhKOztJQXZCQTs7Ozs7O0FBNEJSLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgXG4wMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgXG4wMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwICAgXG4jIyNcblxueyBrbG9nIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIFNlbGVjdFxuXG4gICAgQDogKEBicm93c2VyKSAtPlxuICAgIFxuICAgICAgICBAcm93cyA9IFtdXG4gICAgICAgIEBhY3RpdmUgPSBudWxsXG4gICAgICAgIFxuICAgIGZpbGVzOiAtPiBcbiAgICBcbiAgICAgICAgcm93cyA9IEByb3dzLmZpbHRlciAocm93KSAtPiByb3cuaXRlbS5uYW1lICE9ICcuLidcbiAgICAgICAgcm93cy5tYXAgKHJvdykgLT4gcm93Lml0ZW0uZmlsZVxuICAgICAgICBcbiAgICBmcmVlSW5kZXg6IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gLTEgaWYgbm90IEBhY3RpdmVcbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZS5pbmRleCgpXG4gICAgICAgIHdoaWxlIGluZGV4IDwgQGFjdGl2ZS5jb2x1bW4ubnVtUm93cygpLTFcbiAgICAgICAgICAgIGluZGV4ICs9IDFcbiAgICAgICAgICAgIGlmIG5vdCBAYWN0aXZlLmNvbHVtbi5yb3dzW2luZGV4XS5pc1NlbGVjdGVkKClcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5kZXhcbiAgICAgICAgICAgICBcbiAgICAgICAgaW5kZXggPSBAYWN0aXZlLmluZGV4KClcbiAgICAgICAgd2hpbGUgaW5kZXggPiAwXG4gICAgICAgICAgICBpbmRleCAtPSAxXG4gICAgICAgICAgICBpZiBub3QgQGFjdGl2ZS5jb2x1bW4ucm93c1tpbmRleF0uaXNTZWxlY3RlZCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4XG4gICAgICAgIC0xXG4gICAgICAgIFxuICAgIGNsZWFyOiAtPlxuICAgICAgICAgICAgICAgIFxuICAgICAgICBmb3Igcm93IGluIEByb3dzID8gW11cbiAgICAgICAgICAgIHJvdy5jbGVhclNlbGVjdGVkKClcbiAgICAgICAgICAgIFxuICAgICAgICBAcm93cyA9IFtdXG4gICAgICAgIEBhY3RpdmUgPSBudWxsXG4gICAgXG4gICAgdG9nZ2xlOiAocm93KSAtPlxuXG4gICAgICAgICMgcmV0dXJuIGlmIHJvdyA9PSBAYWN0aXZlXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgcm93LmNvbHVtbiAhPSBAYWN0aXZlPy5jb2x1bW5cbiAgICAgICAgICAgIEByb3cgcm93XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIGlmIHJvdy5pc1NlbGVjdGVkKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAga2xvZyAndW5zZWxlY3QnIHJvdy5pdGVtLmZpbGVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcm93LmNsZWFyQWN0aXZlKClcbiAgICAgICAgICAgIHJvdy5jbGVhclNlbGVjdGVkKCkgICAgICAgICAgICBcbiAgICAgICAgICAgIEByb3dzLnNwbGljZSBAcm93cy5pbmRleE9mKHJvdyksIDFcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcm93LnNldFNlbGVjdGVkKClcbiAgICAgICAgICAgIEBhY3RpdmUgPSByb3dcbiAgICAgICAgICAgIEByb3dzLnB1c2ggcm93XG4gICAgXG4gICAgcm93OiAocm93LCBhY3RpdmF0ZT10cnVlKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCByb3dcbiAgICAgICAgXG4gICAgICAgIGlmIEBhY3RpdmU/LmNvbHVtbiA9PSByb3cuY29sdW1uIGFuZCBhY3RpdmF0ZVxuICAgICAgICAgICAgQGFjdGl2ZT8uY2xlYXJBY3RpdmUoKVxuICAgICAgICBcbiAgICAgICAgQGNsZWFyKClcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBAcm93cyA9IFtyb3ddXG4gICAgICAgIEBhY3RpdmUgPSByb3dcbiAgICAgICAgcm93LnNldFNlbGVjdGVkKClcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCByb3cuaXNBY3RpdmUoKSBhbmQgYWN0aXZhdGVcbiAgICAgICAgICAgIHJvdy5hY3RpdmF0ZSgpXG4gICAgICAgICAgICBcbiAgICB0bzogKHJvdywgbW92ZUFjdGl2ZT1mYWxzZSkgLT4gXG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCByb3dcbiAgICAgICAgcmV0dXJuIGlmIHJvdyA9PSBAYWN0aXZlXG4gICAgICAgIHJldHVybiBpZiBub3QgQGFjdGl2ZVxuICAgICAgICBcbiAgICAgICAgaWYgcm93LmNvbHVtbiAhPSBAYWN0aXZlLmNvbHVtblxuICAgICAgICAgICAgQHJvdyByb3dcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgaWYgcm93LmluZGV4KCkgPiBAYWN0aXZlLmluZGV4KClcbiAgICAgICAgICAgIGZyb20gPSBAYWN0aXZlLmluZGV4KCkrMVxuICAgICAgICAgICAgdG8gICA9IHJvdy5pbmRleCgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZyb20gPSByb3cuaW5kZXgoKVxuICAgICAgICAgICAgdG8gICA9IEBhY3RpdmUuaW5kZXgoKS0xXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIGluZGV4IGluIFtmcm9tLi50b11cbiAgICAgICAgICAgIHIgPSBAYWN0aXZlLmNvbHVtbi5yb3dzW2luZGV4XVxuICAgICAgICAgICAgaWYgbm90IHIuaXNTZWxlY3RlZCgpIFxuICAgICAgICAgICAgICAgIHIuc2V0U2VsZWN0ZWQoKVxuICAgICAgICAgICAgICAgIEByb3dzLnB1c2ggclxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBtb3ZlQWN0aXZlXG4gICAgICAgICAgICBAYWN0aXZlPy5jbGVhckFjdGl2ZSgpXG4gICAgICAgICAgICBAYWN0aXZlID0gcm93XG4gICAgICAgICAgICBAYWN0aXZlLnNldEFjdGl2ZSgpXG5cbm1vZHVsZS5leHBvcnRzID0gU2VsZWN0XG4iXX0=
//# sourceURL=../../coffee/browser/select.coffee