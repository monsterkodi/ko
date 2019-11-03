// koffee 1.4.0

/*
0000000    00000000    0000000   000   000   0000000  00000000  00000000   
000   000  000   000  000   000  000 0 000  000       000       000   000  
0000000    0000000    000   000  000000000  0000000   0000000   0000000    
000   000  000   000  000   000  000   000       000  000       000   000  
0000000    000   000   0000000   00     00  0000000   00000000  000   000
 */
var Browser, Column, _, childp, clamp, elem, event, flex, fs, kerror, klog, os, ref, setStyle, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), setStyle = ref.setStyle, childp = ref.childp, clamp = ref.clamp, slash = ref.slash, elem = ref.elem, os = ref.os, fs = ref.fs, kerror = ref.kerror, klog = ref.klog, _ = ref._;

Column = require('./column');

flex = require('../win/flex/flex');

event = require('events');

Browser = (function(superClass) {
    extend(Browser, superClass);

    function Browser(view) {
        this.view = view;
        this.refresh = bind(this.refresh, this);
        this.updateColumnScrolls = bind(this.updateColumnScrolls, this);
        this.focus = bind(this.focus, this);
        this.columns = [];
        setStyle('.browserRow .ext', 'display', window.state.get('browser|hideExtensions') && 'none' || 'initial');
    }

    Browser.prototype.initColumns = function() {
        if ((this.cols != null) && this.cols.parentNode === this.view) {
            return;
        }
        this.view.innerHTML = '';
        if (this.cols != null) {
            this.view.appendChild(this.cols);
            return;
        }
        this.cols = elem({
            "class": 'browser',
            id: 'columns'
        });
        this.view.appendChild(this.cols);
        this.columns = [];
        return this.flex = new flex({
            view: this.cols,
            onPaneSize: this.updateColumnScrolls
        });
    };

    Browser.prototype.columnAtPos = function(pos) {
        var column, j, len, ref1;
        ref1 = this.columns;
        for (j = 0, len = ref1.length; j < len; j++) {
            column = ref1[j];
            if (elem.containsPos(column.div, pos)) {
                return column;
            }
        }
        return null;
    };

    Browser.prototype.loadItems = function(items, opt) {
        var col, ref1, ref2, ref3;
        if (!this.flex) {
            return;
        }
        col = this.emptyColumn(opt != null ? opt.column : void 0);
        this.clearColumnsFrom(col.index);
        col.setItems(items, opt);
        if (opt.activate != null) {
            if ((ref1 = col.row(opt.activate)) != null) {
                ref1.activate();
            }
        }
        if (opt.row != null) {
            col.focus();
        }
        if (opt.focus) {
            this.focus();
            if ((ref2 = this.lastUsedColumn()) != null) {
                if ((ref3 = ref2.activeRow()) != null) {
                    ref3.setActive();
                }
            }
        }
        this.popEmptyColumns({
            relax: false
        });
        return this;
    };

    Browser.prototype.navigate = function(key) {
        var index, ref1, ref2;
        index = (ref1 = (ref2 = this.focusColumn()) != null ? ref2.index : void 0) != null ? ref1 : 0;
        index += (function() {
            switch (key) {
                case 'left':
                    return -1;
                case 'right':
                    return +1;
            }
        })();
        index = clamp(0, this.numCols() - 1, index);
        if (this.columns[index].numRows()) {
            this.columns[index].focus().activeRow().activate();
        }
        return this;
    };

    Browser.prototype.focus = function(opt) {
        var ref1;
        if ((ref1 = this.lastUsedColumn()) != null) {
            ref1.focus(opt);
        }
        return this;
    };

    Browser.prototype.focusColumn = function() {
        var c, j, len, ref1;
        ref1 = this.columns;
        for (j = 0, len = ref1.length; j < len; j++) {
            c = ref1[j];
            if (c.hasFocus()) {
                return c;
            }
        }
    };

    Browser.prototype.emptyColumn = function(colIndex) {
        var c, col, j, k, len, ref1, ref2, ref3;
        if (colIndex != null) {
            for (c = j = ref1 = colIndex, ref2 = this.numCols(); ref1 <= ref2 ? j < ref2 : j > ref2; c = ref1 <= ref2 ? ++j : --j) {
                this.clearColumn(c);
            }
        }
        ref3 = this.columns;
        for (k = 0, len = ref3.length; k < len; k++) {
            col = ref3[k];
            if (col.isEmpty()) {
                return col;
            }
        }
        return this.addColumn();
    };

    Browser.prototype.activeColumn = function() {
        return this.column(this.activeColumnIndex());
    };

    Browser.prototype.activeColumnIndex = function() {
        var col, j, len, ref1;
        ref1 = this.columns;
        for (j = 0, len = ref1.length; j < len; j++) {
            col = ref1[j];
            if (col.hasFocus()) {
                return col.index;
            }
        }
        return 0;
    };

    Browser.prototype.activeColumnID = function() {
        var col, j, len, ref1;
        ref1 = this.columns;
        for (j = 0, len = ref1.length; j < len; j++) {
            col = ref1[j];
            if (col.hasFocus()) {
                return col.div.id;
            }
        }
        return 'column0';
    };

    Browser.prototype.lastUsedColumn = function() {
        var col, j, len, ref1, used;
        used = null;
        ref1 = this.columns;
        for (j = 0, len = ref1.length; j < len; j++) {
            col = ref1[j];
            if (!col.isEmpty()) {
                used = col;
            } else {
                break;
            }
        }
        return used;
    };

    Browser.prototype.hasEmptyColumns = function() {
        return _.last(this.columns).isEmpty();
    };

    Browser.prototype.height = function() {
        var ref1;
        return (ref1 = this.flex) != null ? ref1.height() : void 0;
    };

    Browser.prototype.numCols = function() {
        return this.columns.length;
    };

    Browser.prototype.column = function(i) {
        if ((0 <= i && i < this.numCols())) {
            return this.columns[i];
        }
    };

    Browser.prototype.columnWithName = function(name) {
        return this.columns.find(function(c) {
            return c.name() === name;
        });
    };

    Browser.prototype.onBackspaceInColumn = function(column) {
        return column.clearSearch().removeObject();
    };

    Browser.prototype.addColumn = function() {
        var col;
        if (!this.flex) {
            return;
        }
        col = new Column(this);
        this.columns.push(col);
        this.flex.addPane({
            div: col.div,
            size: 50
        });
        return col;
    };

    Browser.prototype.clearColumn = function(index) {
        return this.columns[index].clear();
    };

    Browser.prototype.popColumn = function(opt) {
        if (!this.flex) {
            return;
        }
        this.clearColumn(this.columns.length - 1);
        this.flex.popPane(opt);
        return this.columns.pop();
    };

    Browser.prototype.popEmptyColumns = function(opt) {
        var results;
        results = [];
        while (this.hasEmptyColumns()) {
            results.push(this.popColumn(opt));
        }
        return results;
    };

    Browser.prototype.popColumnsFrom = function(col) {
        var results;
        results = [];
        while (this.numCols() > col) {
            results.push(this.popColumn());
        }
        return results;
    };

    Browser.prototype.clear = function() {
        return this.clearColumnsFrom(0, {
            pop: true
        });
    };

    Browser.prototype.clearColumnsFrom = function(c, opt) {
        var results, results1;
        if (c == null) {
            c = 0;
        }
        if (opt == null) {
            opt = {
                pop: false
            };
        }
        if ((c == null) || c < 0) {
            return kerror("clearColumnsFrom " + c + "?");
        }
        if (opt.pop) {
            if (c < this.numCols()) {
                this.clearColumn(c);
                c++;
            }
            results = [];
            while (c < this.numCols()) {
                this.popColumn();
                results.push(c++);
            }
            return results;
        } else {
            results1 = [];
            while (c < this.numCols()) {
                this.clearColumn(c);
                results1.push(c++);
            }
            return results1;
        }
    };

    Browser.prototype.isMessy = function() {
        return !this.flex.relaxed || this.hasEmptyColumns();
    };

    Browser.prototype.cleanUp = function() {
        if (this.flex == null) {
            return false;
        }
        if (!this.isMessy()) {
            return false;
        }
        this.popEmptyColumns();
        this.flex.relax();
        return true;
    };

    Browser.prototype.resized = function() {
        return this.updateColumnScrolls();
    };

    Browser.prototype.updateColumnScrolls = function() {
        var c, j, len, ref1, results;
        ref1 = this.columns;
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
            c = ref1[j];
            results.push(c.scroll.update());
        }
        return results;
    };

    Browser.prototype.reset = function() {
        delete this.cols;
        return this.initColumns();
    };

    Browser.prototype.stop = function() {
        this.cols.remove();
        return this.cols = null;
    };

    Browser.prototype.start = function() {
        return this.initColumns();
    };

    Browser.prototype.refresh = function() {
        return reset();
    };

    Browser.prototype.convertPXM = function(row) {
        var file, item, tmpPNG, tmpPXM;
        item = row.item;
        file = item.file;
        tmpPXM = slash.join(os.tmpdir(), "ko-" + (slash.base(file)) + ".pxm");
        tmpPNG = slash.swapExt(tmpPXM, '.png');
        return fs.copy(file, tmpPXM, (function(_this) {
            return function(err) {
                if (err != null) {
                    return kerror("can't copy pxm image " + file + " to " + tmpPXM + ": " + err);
                }
                return childp.exec("open " + __dirname + "/../../bin/pxm2png.app --args " + tmpPXM, function(err) {
                    var loadDelayed;
                    if (err != null) {
                        return kerror("can't convert pxm image " + tmpPXM + " to " + tmpPNG + ": " + err);
                    }
                    loadDelayed = function() {
                        return _this.loadImage(tmpPNG);
                    };
                    return setTimeout(loadDelayed, 300);
                });
            };
        })(this));
    };

    Browser.prototype.convertImage = function(file) {
        var tmpImage;
        klog('convertImage', file);
        tmpImage = slash.join(os.tmpdir(), "ko-" + (slash.basename(file)) + ".png");
        return childp.exec("/usr/bin/sips -s format png \"" + file + "\" --out \"" + tmpImage + "\"", (function(_this) {
            return function(err) {
                if (err != null) {
                    return kerror("can't convert image " + file + ": " + err);
                }
                return _this.loadImage(tmpImage);
            };
        })(this));
    };

    Browser.prototype.loadImage = function(file) {
        var cnt, col, row;
        row = this.row(file);
        if (!(row != null ? row.isActive() : void 0)) {
            return;
        }
        col = this.emptyColumn(typeof opt !== "undefined" && opt !== null ? opt.column : void 0);
        this.clearColumnsFrom(col.index);
        cnt = elem({
            "class": 'browserImageContainer',
            child: elem('img', {
                "class": 'browserImage',
                src: slash.fileUrl(file)
            })
        });
        return col.table.appendChild(cnt);
    };

    return Browser;

})(event);

module.exports = Browser;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsZ0dBQUE7SUFBQTs7OztBQVFBLE1BQW9FLE9BQUEsQ0FBUSxLQUFSLENBQXBFLEVBQUUsdUJBQUYsRUFBWSxtQkFBWixFQUFvQixpQkFBcEIsRUFBMkIsaUJBQTNCLEVBQWtDLGVBQWxDLEVBQXdDLFdBQXhDLEVBQTRDLFdBQTVDLEVBQWdELG1CQUFoRCxFQUF3RCxlQUF4RCxFQUE4RDs7QUFFOUQsTUFBQSxHQUFTLE9BQUEsQ0FBUSxVQUFSOztBQUNULElBQUEsR0FBUyxPQUFBLENBQVEsa0JBQVI7O0FBQ1QsS0FBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSOztBQUVIOzs7SUFFQyxpQkFBQyxJQUFEO1FBQUMsSUFBQyxDQUFBLE9BQUQ7Ozs7UUFFQSxJQUFDLENBQUEsT0FBRCxHQUFXO1FBRVgsUUFBQSxDQUFTLGtCQUFULEVBQTRCLFNBQTVCLEVBQXNDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBYixDQUFpQix3QkFBakIsQ0FBQSxJQUErQyxNQUEvQyxJQUF5RCxTQUEvRjtJQUpEOztzQkFZSCxXQUFBLEdBQWEsU0FBQTtRQUVULElBQVUsbUJBQUEsSUFBVyxJQUFDLENBQUEsSUFBSSxDQUFDLFVBQU4sS0FBb0IsSUFBQyxDQUFBLElBQTFDO0FBQUEsbUJBQUE7O1FBRUEsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLEdBQWtCO1FBRWxCLElBQUcsaUJBQUg7WUFDSSxJQUFDLENBQUEsSUFBSSxDQUFDLFdBQU4sQ0FBa0IsSUFBQyxDQUFBLElBQW5CO0FBQ0EsbUJBRko7O1FBSUEsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLFNBQU47WUFBZ0IsRUFBQSxFQUFHLFNBQW5CO1NBQUw7UUFDUixJQUFDLENBQUEsSUFBSSxDQUFDLFdBQU4sQ0FBa0IsSUFB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O1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyx1QkFBUDtZQUFnQyxLQUFBLEVBQ3ZDLElBQUEsQ0FBSyxLQUFMLEVBQVk7Z0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFQO2dCQUF1QixHQUFBLEVBQUssS0FBSyxDQUFDLE9BQU4sQ0FBYyxJQUFkLENBQTVCO2FBQVosQ0FETztTQUFMO2VBRU4sR0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFWLENBQXNCLEdBQXRCO0lBVE87Ozs7R0E1UU87O0FBdVJ0QixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbjAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiMjI1xuXG57IHNldFN0eWxlLCBjaGlsZHAsIGNsYW1wLCBzbGFzaCwgZWxlbSwgb3MsIGZzLCBrZXJyb3IsIGtsb2csIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuQ29sdW1uID0gcmVxdWlyZSAnLi9jb2x1bW4nXG5mbGV4ICAgPSByZXF1aXJlICcuLi93aW4vZmxleC9mbGV4J1xuZXZlbnQgID0gcmVxdWlyZSAnZXZlbnRzJ1xuXG5jbGFzcyBCcm93c2VyIGV4dGVuZHMgZXZlbnRcbiAgICBcbiAgICBAOiAoQHZpZXcpIC0+XG4gICAgICAgIFxuICAgICAgICBAY29sdW1ucyA9IFtdXG4gICAgICAgIFxuICAgICAgICBzZXRTdHlsZSAnLmJyb3dzZXJSb3cgLmV4dCcgJ2Rpc3BsYXknIHdpbmRvdy5zdGF0ZS5nZXQoJ2Jyb3dzZXJ8aGlkZUV4dGVuc2lvbnMnKSBhbmQgJ25vbmUnIG9yICdpbml0aWFsJ1xuXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgaW5pdENvbHVtbnM6IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgQGNvbHM/IGFuZCBAY29scy5wYXJlbnROb2RlID09IEB2aWV3XG4gICAgICAgIFxuICAgICAgICBAdmlldy5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBcbiAgICAgICAgaWYgQGNvbHM/XG4gICAgICAgICAgICBAdmlldy5hcHBlbmRDaGlsZCBAY29sc1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgQGNvbHMgPSBlbGVtIGNsYXNzOidicm93c2VyJyBpZDonY29sdW1ucydcbiAgICAgICAgQHZpZXcuYXBwZW5kQ2hpbGQgQGNvbHNcbiAgICAgICAgXG4gICAgICAgIEBjb2x1bW5zID0gW11cblxuICAgICAgICBAZmxleCA9IG5ldyBmbGV4IFxuICAgICAgICAgICAgdmlldzogICAgICAgQGNvbHNcbiAgICAgICAgICAgIG9uUGFuZVNpemU6IEB1cGRhdGVDb2x1bW5TY3JvbGxzXG4gICAgICAgIFxuICAgIGNvbHVtbkF0UG9zOiAocG9zKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGNvbHVtbiBpbiBAY29sdW1uc1xuICAgICAgICAgICAgaWYgZWxlbS5jb250YWluc1BvcyBjb2x1bW4uZGl2LCBwb3NcbiAgICAgICAgICAgICAgICByZXR1cm4gY29sdW1uXG4gICAgICAgIG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBsb2FkSXRlbXM6IChpdGVtcywgb3B0KSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGZsZXhcbiAgICAgICAgY29sID0gQGVtcHR5Q29sdW1uIG9wdD8uY29sdW1uXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbC5pbmRleFxuICAgICAgICBjb2wuc2V0SXRlbXMgaXRlbXMsIG9wdFxuXG4gICAgICAgIGlmIG9wdC5hY3RpdmF0ZT9cbiAgICAgICAgICAgIGNvbC5yb3cob3B0LmFjdGl2YXRlKT8uYWN0aXZhdGUoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBvcHQucm93P1xuICAgICAgICAgICAgY29sLmZvY3VzKClcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBvcHQuZm9jdXNcbiAgICAgICAgICAgIEBmb2N1cygpXG4gICAgICAgICAgICBAbGFzdFVzZWRDb2x1bW4oKT8uYWN0aXZlUm93KCk/LnNldEFjdGl2ZSgpICAgICAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgQHBvcEVtcHR5Q29sdW1ucyByZWxheDpmYWxzZVxuICAgICAgICBAXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgbmF2aWdhdGU6IChrZXkpIC0+XG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IEBmb2N1c0NvbHVtbigpPy5pbmRleCA/IDBcbiAgICAgICAgaW5kZXggKz0gc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAnbGVmdCcgIHRoZW4gLTFcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuICsxXG4gICAgICAgIGluZGV4ID0gY2xhbXAgMCwgQG51bUNvbHMoKS0xLCBpbmRleFxuICAgICAgICBpZiBAY29sdW1uc1tpbmRleF0ubnVtUm93cygpXG4gICAgICAgICAgICBAY29sdW1uc1tpbmRleF0uZm9jdXMoKS5hY3RpdmVSb3coKS5hY3RpdmF0ZSgpXG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgZm9jdXM6IChvcHQpID0+IFxuICAgICAgICBAbGFzdFVzZWRDb2x1bW4oKT8uZm9jdXMgb3B0XG4gICAgICAgIEBcbiAgICBcbiAgICBmb2N1c0NvbHVtbjogLT4gXG4gICAgICAgIGZvciBjIGluIEBjb2x1bW5zXG4gICAgICAgICAgICByZXR1cm4gYyBpZiBjLmhhc0ZvY3VzKClcbiAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgICAgMDAwICAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICBcbiAgICBcbiAgICBlbXB0eUNvbHVtbjogKGNvbEluZGV4KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgY29sSW5kZXg/XG4gICAgICAgICAgICBmb3IgYyBpbiBbY29sSW5kZXguLi5AbnVtQ29scygpXVxuICAgICAgICAgICAgICAgIEBjbGVhckNvbHVtbiBjXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGZvciBjb2wgaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIHJldHVybiBjb2wgaWYgY29sLmlzRW1wdHkoKVxuICAgICAgICAgICAgXG4gICAgICAgIEBhZGRDb2x1bW4oKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICAgICAgXG4gICAgXG4gICAgYWN0aXZlQ29sdW1uOiAtPiBAY29sdW1uIEBhY3RpdmVDb2x1bW5JbmRleCgpXG4gICAgYWN0aXZlQ29sdW1uSW5kZXg6IC0+IFxuICAgICAgICBcbiAgICAgICAgZm9yIGNvbCBpbiBAY29sdW1uc1xuICAgICAgICAgICAgaWYgY29sLmhhc0ZvY3VzKCkgdGhlbiByZXR1cm4gY29sLmluZGV4XG4gICAgICAgIDBcbiAgICAgICAgXG4gICAgYWN0aXZlQ29sdW1uSUQ6IC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgY29sIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBjb2wuaGFzRm9jdXMoKSB0aGVuIHJldHVybiBjb2wuZGl2LmlkXG4gICAgICAgICdjb2x1bW4wJ1xuXG4gICAgbGFzdFVzZWRDb2x1bW46IC0+XG4gICAgICAgIFxuICAgICAgICB1c2VkID0gbnVsbFxuICAgICAgICBmb3IgY29sIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBub3QgY29sLmlzRW1wdHkoKVxuICAgICAgICAgICAgICAgIHVzZWQgPSBjb2wgXG4gICAgICAgICAgICBlbHNlIGJyZWFrXG4gICAgICAgIHVzZWRcblxuICAgIGhhc0VtcHR5Q29sdW1uczogLT4gXy5sYXN0KEBjb2x1bW5zKS5pc0VtcHR5KClcblxuICAgIGhlaWdodDogLT4gQGZsZXg/LmhlaWdodCgpXG4gICAgbnVtQ29sczogLT4gQGNvbHVtbnMubGVuZ3RoIFxuICAgIGNvbHVtbjogKGkpIC0+IEBjb2x1bW5zW2ldIGlmIDAgPD0gaSA8IEBudW1Db2xzKClcblxuICAgIGNvbHVtbldpdGhOYW1lOiAobmFtZSkgLT4gQGNvbHVtbnMuZmluZCAoYykgLT4gYy5uYW1lKCkgPT0gbmFtZVxuXG4gICAgb25CYWNrc3BhY2VJbkNvbHVtbjogKGNvbHVtbikgLT4gY29sdW1uLmNsZWFyU2VhcmNoKCkucmVtb3ZlT2JqZWN0KCkgICAgXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICAgICAgIFxuICAgIGFkZENvbHVtbjogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGZsZXhcblxuICAgICAgICBjb2wgPSBuZXcgQ29sdW1uIEBcbiAgICAgICAgQGNvbHVtbnMucHVzaCBjb2xcbiAgICAgICAgQGZsZXguYWRkUGFuZSBkaXY6Y29sLmRpdiwgc2l6ZTo1MFxuICAgICAgICBjb2xcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgXG4gICAgXG4gICAgY2xlYXJDb2x1bW46IChpbmRleCkgLT4gQGNvbHVtbnNbaW5kZXhdLmNsZWFyKClcbiAgICBcbiAgICBwb3BDb2x1bW46IChvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBmbGV4XG4gICAgICAgIEBjbGVhckNvbHVtbiBAY29sdW1ucy5sZW5ndGgtMVxuICAgICAgICBAZmxleC5wb3BQYW5lIG9wdFxuICAgICAgICBAY29sdW1ucy5wb3AoKVxuICAgICAgICBcbiAgICBwb3BFbXB0eUNvbHVtbnM6IChvcHQpIC0+IEBwb3BDb2x1bW4ob3B0KSB3aGlsZSBAaGFzRW1wdHlDb2x1bW5zKClcbiAgICAgICAgXG4gICAgcG9wQ29sdW1uc0Zyb206IChjb2wpIC0+IFxuICAgICAgICBcbiAgICAgICAgd2hpbGUgQG51bUNvbHMoKSA+IGNvbCBcbiAgICAgICAgICAgIEBwb3BDb2x1bW4oKVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgY2xlYXI6IC0+IEBjbGVhckNvbHVtbnNGcm9tIDAsIHBvcDp0cnVlIFxuICAgIFxuICAgIGNsZWFyQ29sdW1uc0Zyb206IChjPTAsIG9wdD1wb3A6ZmFsc2UpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2xlYXJDb2x1bW5zRnJvbSAje2N9P1wiIGlmIG5vdCBjPyBvciBjIDwgMFxuICAgICAgICBcbiAgICAgICAgaWYgb3B0LnBvcFxuICAgICAgICAgICAgaWYgYyA8IEBudW1Db2xzKClcbiAgICAgICAgICAgICAgICBAY2xlYXJDb2x1bW4gY1xuICAgICAgICAgICAgICAgIGMrK1xuICAgICAgICAgICAgd2hpbGUgYyA8IEBudW1Db2xzKClcbiAgICAgICAgICAgICAgICBAcG9wQ29sdW1uKClcbiAgICAgICAgICAgICAgICBjKytcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2hpbGUgYyA8IEBudW1Db2xzKClcbiAgICAgICAgICAgICAgICBAY2xlYXJDb2x1bW4gY1xuICAgICAgICAgICAgICAgIGMrK1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGlzTWVzc3k6IC0+IG5vdCBAZmxleC5yZWxheGVkIG9yIEBoYXNFbXB0eUNvbHVtbnMoKVxuICAgIFxuICAgIGNsZWFuVXA6IC0+IFxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IEBmbGV4P1xuICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IEBpc01lc3N5KClcbiAgICAgICAgQHBvcEVtcHR5Q29sdW1ucygpXG4gICAgICAgIEBmbGV4LnJlbGF4KClcbiAgICAgICAgdHJ1ZVxuXG4gICAgcmVzaXplZDogLT4gQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgIFxuICAgIHVwZGF0ZUNvbHVtblNjcm9sbHM6ID0+XG4gICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY29sdW1uc1xuICAgICAgICAgICAgYy5zY3JvbGwudXBkYXRlKClcblxuICAgIHJlc2V0OiAtPiBkZWxldGUgQGNvbHM7IEBpbml0Q29sdW1ucygpXG4gICAgc3RvcDogIC0+IEBjb2xzLnJlbW92ZSgpOyBAY29scyA9IG51bGxcbiAgICBzdGFydDogLT4gQGluaXRDb2x1bW5zKClcblxuICAgIHJlZnJlc2g6ID0+IHJlc2V0KClcbiAgICAgICAgXG4gICAgIyAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGNvbnZlcnRQWE06IChyb3cpIC0+XG4gICAgICAgIFxuICAgICAgICBpdGVtID0gcm93Lml0ZW1cbiAgICAgICAgZmlsZSA9IGl0ZW0uZmlsZVxuICAgICAgICB0bXBQWE0gPSBzbGFzaC5qb2luIG9zLnRtcGRpcigpLCBcImtvLSN7c2xhc2guYmFzZSBmaWxlfS5weG1cIlxuICAgICAgICB0bXBQTkcgPSBzbGFzaC5zd2FwRXh0IHRtcFBYTSwgJy5wbmcnXG5cbiAgICAgICAgZnMuY29weSBmaWxlLCB0bXBQWE0sIChlcnIpID0+XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2FuJ3QgY29weSBweG0gaW1hZ2UgI3tmaWxlfSB0byAje3RtcFBYTX06ICN7ZXJyfVwiIGlmIGVycj9cbiAgICAgICAgICAgIGNoaWxkcC5leGVjIFwib3BlbiAje19fZGlybmFtZX0vLi4vLi4vYmluL3B4bTJwbmcuYXBwIC0tYXJncyAje3RtcFBYTX1cIiwgKGVycikgPT5cbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2FuJ3QgY29udmVydCBweG0gaW1hZ2UgI3t0bXBQWE19IHRvICN7dG1wUE5HfTogI3tlcnJ9XCIgaWYgZXJyP1xuICAgICAgICAgICAgICAgIGxvYWREZWxheWVkID0gPT4gQGxvYWRJbWFnZSB0bXBQTkdcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0IGxvYWREZWxheWVkLCAzMDBcblxuICAgIGNvbnZlcnRJbWFnZTogKGZpbGUpIC0+XG4gICAgICAgIGtsb2cgJ2NvbnZlcnRJbWFnZScgZmlsZVxuICAgICAgICB0bXBJbWFnZSA9IHNsYXNoLmpvaW4gb3MudG1wZGlyKCksIFwia28tI3tzbGFzaC5iYXNlbmFtZSBmaWxlfS5wbmdcIlxuICAgICAgICBjaGlsZHAuZXhlYyBcIi91c3IvYmluL3NpcHMgLXMgZm9ybWF0IHBuZyBcXFwiI3tmaWxlfVxcXCIgLS1vdXQgXFxcIiN7dG1wSW1hZ2V9XFxcIlwiLCAoZXJyKSA9PlxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcImNhbid0IGNvbnZlcnQgaW1hZ2UgI3tmaWxlfTogI3tlcnJ9XCIgaWYgZXJyP1xuICAgICAgICAgICAgQGxvYWRJbWFnZSB0bXBJbWFnZVxuXG4gICAgbG9hZEltYWdlOiAoZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJvdyA9IEByb3cgZmlsZVxuICAgICAgICByZXR1cm4gaWYgbm90IHJvdz8uaXNBY3RpdmUoKVxuXG4gICAgICAgIGNvbCA9IEBlbXB0eUNvbHVtbiBvcHQ/LmNvbHVtblxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2wuaW5kZXhcbiAgICAgICAgY250ID0gZWxlbSBjbGFzczogJ2Jyb3dzZXJJbWFnZUNvbnRhaW5lcicsIGNoaWxkOiBcbiAgICAgICAgICAgIGVsZW0gJ2ltZycsIGNsYXNzOiAnYnJvd3NlckltYWdlJywgc3JjOiBzbGFzaC5maWxlVXJsIGZpbGVcbiAgICAgICAgY29sLnRhYmxlLmFwcGVuZENoaWxkIGNudFxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQnJvd3NlclxuIl19
//# sourceURL=../../coffee/browser/browser.coffee