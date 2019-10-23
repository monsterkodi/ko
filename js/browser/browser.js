// koffee 1.4.0

/*
0000000    00000000    0000000   000   000   0000000  00000000  00000000   
000   000  000   000  000   000  000 0 000  000       000       000   000  
0000000    0000000    000   000  000000000  0000000   0000000   0000000    
000   000  000   000  000   000  000   000       000  000       000   000  
0000000    000   000   0000000   00     00  0000000   00000000  000   000
 */
var Browser, Column, _, childp, clamp, elem, event, flex, fs, kerror, os, post, ref, setStyle, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), post = ref.post, elem = ref.elem, clamp = ref.clamp, setStyle = ref.setStyle, childp = ref.childp, slash = ref.slash, fs = ref.fs, os = ref.os, kerror = ref.kerror, _ = ref._;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsZ0dBQUE7SUFBQTs7OztBQVFBLE1BQW9FLE9BQUEsQ0FBUSxLQUFSLENBQXBFLEVBQUUsZUFBRixFQUFRLGVBQVIsRUFBYyxpQkFBZCxFQUFxQix1QkFBckIsRUFBK0IsbUJBQS9CLEVBQXVDLGlCQUF2QyxFQUE4QyxXQUE5QyxFQUFrRCxXQUFsRCxFQUFzRCxtQkFBdEQsRUFBOEQ7O0FBRTlELE1BQUEsR0FBUyxPQUFBLENBQVEsVUFBUjs7QUFDVCxJQUFBLEdBQVMsT0FBQSxDQUFRLGtCQUFSOztBQUNULEtBQUEsR0FBUyxPQUFBLENBQVEsUUFBUjs7QUFFSDs7O0lBRVcsaUJBQUMsSUFBRDtRQUFDLElBQUMsQ0FBQSxPQUFEOzs7O1FBRVYsSUFBQyxDQUFBLE9BQUQsR0FBVztRQUVYLFFBQUEsQ0FBUyxrQkFBVCxFQUE0QixTQUE1QixFQUFzQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQWIsQ0FBaUIsd0JBQWpCLENBQUEsSUFBK0MsTUFBL0MsSUFBeUQsU0FBL0Y7SUFKUzs7c0JBWWIsV0FBQSxHQUFhLFNBQUE7UUFFVCxJQUFVLG1CQUFBLElBQVcsSUFBQyxDQUFBLElBQUksQ0FBQyxVQUFOLEtBQW9CLElBQUMsQ0FBQSxJQUExQztBQUFBLG1CQUFBOztRQUVBLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBTixHQUFrQjtRQUVsQixJQUFHLGlCQUFIO1lBQ0ksSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLENBQWtCLElBQUMsQ0FBQSxJQUFuQjtBQUNBLG1CQUZKOztRQUlBLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxTQUFOO1lBQWdCLEVBQUEsRUFBRyxTQUFuQjtTQUFMO1FBQ1IsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLENBQWtCLElBQUMs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QUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sdUJBQVA7WUFBZ0MsS0FBQSxFQUN2QyxJQUFBLENBQUssS0FBTCxFQUFZO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sY0FBUDtnQkFBdUIsR0FBQSxFQUFLLEtBQUssQ0FBQyxPQUFOLENBQWMsSUFBZCxDQUE1QjthQUFaLENBRE87U0FBTDtlQUVOLEdBQUcsQ0FBQyxLQUFLLENBQUMsV0FBVixDQUFzQixHQUF0QjtJQVRPOzs7O0dBNVFPOztBQXVSdEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMCAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIyNcblxueyBwb3N0LCBlbGVtLCBjbGFtcCwgc2V0U3R5bGUsIGNoaWxkcCwgc2xhc2gsIGZzLCBvcywga2Vycm9yLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbkNvbHVtbiA9IHJlcXVpcmUgJy4vY29sdW1uJ1xuZmxleCAgID0gcmVxdWlyZSAnLi4vd2luL2ZsZXgvZmxleCdcbmV2ZW50ICA9IHJlcXVpcmUgJ2V2ZW50cydcblxuY2xhc3MgQnJvd3NlciBleHRlbmRzIGV2ZW50XG4gICAgXG4gICAgY29uc3RydWN0b3I6IChAdmlldykgLT5cbiAgICAgICAgXG4gICAgICAgIEBjb2x1bW5zID0gW11cbiAgICAgICAgXG4gICAgICAgIHNldFN0eWxlICcuYnJvd3NlclJvdyAuZXh0JyAnZGlzcGxheScgd2luZG93LnN0YXRlLmdldCgnYnJvd3NlcnxoaWRlRXh0ZW5zaW9ucycpIGFuZCAnbm9uZScgb3IgJ2luaXRpYWwnXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBpbml0Q29sdW1uczogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBAY29scz8gYW5kIEBjb2xzLnBhcmVudE5vZGUgPT0gQHZpZXdcbiAgICAgICAgXG4gICAgICAgIEB2aWV3LmlubmVySFRNTCA9ICcnXG4gICAgICAgIFxuICAgICAgICBpZiBAY29scz9cbiAgICAgICAgICAgIEB2aWV3LmFwcGVuZENoaWxkIEBjb2xzXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICBAY29scyA9IGVsZW0gY2xhc3M6J2Jyb3dzZXInIGlkOidjb2x1bW5zJ1xuICAgICAgICBAdmlldy5hcHBlbmRDaGlsZCBAY29sc1xuICAgICAgICBcbiAgICAgICAgQGNvbHVtbnMgPSBbXVxuXG4gICAgICAgIEBmbGV4ID0gbmV3IGZsZXggXG4gICAgICAgICAgICB2aWV3OiAgICAgICBAY29sc1xuICAgICAgICAgICAgb25QYW5lU2l6ZTogQHVwZGF0ZUNvbHVtblNjcm9sbHNcbiAgICAgICAgXG4gICAgY29sdW1uQXRQb3M6IChwb3MpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgY29sdW1uIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBlbGVtLmNvbnRhaW5zUG9zIGNvbHVtbi5kaXYsIHBvc1xuICAgICAgICAgICAgICAgIHJldHVybiBjb2x1bW5cbiAgICAgICAgbnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGxvYWRJdGVtczogKGl0ZW1zLCBvcHQpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmxleFxuICAgICAgICBjb2wgPSBAZW1wdHlDb2x1bW4gb3B0Py5jb2x1bW5cbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sLmluZGV4XG4gICAgICAgIGNvbC5zZXRJdGVtcyBpdGVtcywgb3B0XG5cbiAgICAgICAgaWYgb3B0LmFjdGl2YXRlP1xuICAgICAgICAgICAgY29sLnJvdyhvcHQuYWN0aXZhdGUpPy5hY3RpdmF0ZSgpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG9wdC5yb3c/XG4gICAgICAgICAgICBjb2wuZm9jdXMoKVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG9wdC5mb2N1c1xuICAgICAgICAgICAgQGZvY3VzKClcbiAgICAgICAgICAgIEBsYXN0VXNlZENvbHVtbigpPy5hY3RpdmVSb3coKT8uc2V0QWN0aXZlKCkgICAgICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICBAcG9wRW1wdHlDb2x1bW5zIHJlbGF4OmZhbHNlXG4gICAgICAgIEBcblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBuYXZpZ2F0ZTogKGtleSkgLT5cbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gQGZvY3VzQ29sdW1uKCk/LmluZGV4ID8gMFxuICAgICAgICBpbmRleCArPSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiAtMVxuICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gKzFcbiAgICAgICAgaW5kZXggPSBjbGFtcCAwLCBAbnVtQ29scygpLTEsIGluZGV4XG4gICAgICAgIGlmIEBjb2x1bW5zW2luZGV4XS5udW1Sb3dzKClcbiAgICAgICAgICAgIEBjb2x1bW5zW2luZGV4XS5mb2N1cygpLmFjdGl2ZVJvdygpLmFjdGl2YXRlKClcbiAgICAgICAgQFxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBmb2N1czogKG9wdCkgPT4gXG4gICAgICAgIEBsYXN0VXNlZENvbHVtbigpPy5mb2N1cyBvcHRcbiAgICAgICAgQFxuICAgIFxuICAgIGZvY3VzQ29sdW1uOiAtPiBcbiAgICAgICAgZm9yIGMgaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIHJldHVybiBjIGlmIGMuaGFzRm9jdXMoKVxuICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAgICAwMDAgICAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgIFxuICAgIFxuICAgIGVtcHR5Q29sdW1uOiAoY29sSW5kZXgpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBjb2xJbmRleD9cbiAgICAgICAgICAgIGZvciBjIGluIFtjb2xJbmRleC4uLkBudW1Db2xzKCldXG4gICAgICAgICAgICAgICAgQGNsZWFyQ29sdW1uIGNcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgZm9yIGNvbCBpbiBAY29sdW1uc1xuICAgICAgICAgICAgcmV0dXJuIGNvbCBpZiBjb2wuaXNFbXB0eSgpXG4gICAgICAgICAgICBcbiAgICAgICAgQGFkZENvbHVtbigpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgICBcbiAgICBcbiAgICBhY3RpdmVDb2x1bW46IC0+IEBjb2x1bW4gQGFjdGl2ZUNvbHVtbkluZGV4KClcbiAgICBhY3RpdmVDb2x1bW5JbmRleDogLT4gXG4gICAgICAgIFxuICAgICAgICBmb3IgY29sIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBjb2wuaGFzRm9jdXMoKSB0aGVuIHJldHVybiBjb2wuaW5kZXhcbiAgICAgICAgMFxuICAgICAgICBcbiAgICBhY3RpdmVDb2x1bW5JRDogLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBjb2wgaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIGNvbC5oYXNGb2N1cygpIHRoZW4gcmV0dXJuIGNvbC5kaXYuaWRcbiAgICAgICAgJ2NvbHVtbjAnXG5cbiAgICBsYXN0VXNlZENvbHVtbjogLT5cbiAgICAgICAgXG4gICAgICAgIHVzZWQgPSBudWxsXG4gICAgICAgIGZvciBjb2wgaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIG5vdCBjb2wuaXNFbXB0eSgpXG4gICAgICAgICAgICAgICAgdXNlZCA9IGNvbCBcbiAgICAgICAgICAgIGVsc2UgYnJlYWtcbiAgICAgICAgdXNlZFxuXG4gICAgaGFzRW1wdHlDb2x1bW5zOiAtPiBfLmxhc3QoQGNvbHVtbnMpLmlzRW1wdHkoKVxuXG4gICAgaGVpZ2h0OiAtPiBAZmxleD8uaGVpZ2h0KClcbiAgICBudW1Db2xzOiAtPiBAY29sdW1ucy5sZW5ndGggXG4gICAgY29sdW1uOiAoaSkgLT4gQGNvbHVtbnNbaV0gaWYgMCA8PSBpIDwgQG51bUNvbHMoKVxuXG4gICAgY29sdW1uV2l0aE5hbWU6IChuYW1lKSAtPiBAY29sdW1ucy5maW5kIChjKSAtPiBjLm5hbWUoKSA9PSBuYW1lXG5cbiAgICBvbkJhY2tzcGFjZUluQ29sdW1uOiAoY29sdW1uKSAtPiBjb2x1bW4uY2xlYXJTZWFyY2goKS5yZW1vdmVPYmplY3QoKSAgICBcbiAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgICAgICAgXG4gICAgYWRkQ29sdW1uOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmxleFxuXG4gICAgICAgIGNvbCA9IG5ldyBDb2x1bW4gQFxuICAgICAgICBAY29sdW1ucy5wdXNoIGNvbFxuICAgICAgICBAZmxleC5hZGRQYW5lIGRpdjpjb2wuZGl2LCBzaXplOjUwXG4gICAgICAgIGNvbFxuICAgIFxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICBcbiAgICBcbiAgICBjbGVhckNvbHVtbjogKGluZGV4KSAtPiBAY29sdW1uc1tpbmRleF0uY2xlYXIoKVxuICAgIFxuICAgIHBvcENvbHVtbjogKG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGZsZXhcbiAgICAgICAgQGNsZWFyQ29sdW1uIEBjb2x1bW5zLmxlbmd0aC0xXG4gICAgICAgIEBmbGV4LnBvcFBhbmUgb3B0XG4gICAgICAgIEBjb2x1bW5zLnBvcCgpXG4gICAgICAgIFxuICAgIHBvcEVtcHR5Q29sdW1uczogKG9wdCkgLT4gQHBvcENvbHVtbihvcHQpIHdoaWxlIEBoYXNFbXB0eUNvbHVtbnMoKVxuICAgICAgICBcbiAgICBwb3BDb2x1bW5zRnJvbTogKGNvbCkgLT4gXG4gICAgICAgIFxuICAgICAgICB3aGlsZSBAbnVtQ29scygpID4gY29sIFxuICAgICAgICAgICAgQHBvcENvbHVtbigpXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBjbGVhcjogLT4gQGNsZWFyQ29sdW1uc0Zyb20gMCwgcG9wOnRydWUgXG4gICAgXG4gICAgY2xlYXJDb2x1bW5zRnJvbTogKGM9MCwgb3B0PXBvcDpmYWxzZSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBrZXJyb3IgXCJjbGVhckNvbHVtbnNGcm9tICN7Y30/XCIgaWYgbm90IGM/IG9yIGMgPCAwXG4gICAgICAgIFxuICAgICAgICBpZiBvcHQucG9wXG4gICAgICAgICAgICBpZiBjIDwgQG51bUNvbHMoKVxuICAgICAgICAgICAgICAgIEBjbGVhckNvbHVtbiBjXG4gICAgICAgICAgICAgICAgYysrXG4gICAgICAgICAgICB3aGlsZSBjIDwgQG51bUNvbHMoKVxuICAgICAgICAgICAgICAgIEBwb3BDb2x1bW4oKVxuICAgICAgICAgICAgICAgIGMrK1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB3aGlsZSBjIDwgQG51bUNvbHMoKVxuICAgICAgICAgICAgICAgIEBjbGVhckNvbHVtbiBjXG4gICAgICAgICAgICAgICAgYysrXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgaXNNZXNzeTogLT4gbm90IEBmbGV4LnJlbGF4ZWQgb3IgQGhhc0VtcHR5Q29sdW1ucygpXG4gICAgXG4gICAgY2xlYW5VcDogLT4gXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBub3QgQGZsZXg/XG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBub3QgQGlzTWVzc3koKVxuICAgICAgICBAcG9wRW1wdHlDb2x1bW5zKClcbiAgICAgICAgQGZsZXgucmVsYXgoKVxuICAgICAgICB0cnVlXG5cbiAgICByZXNpemVkOiAtPiBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG4gICAgXG4gICAgdXBkYXRlQ29sdW1uU2Nyb2xsczogPT5cbiAgICAgICAgXG4gICAgICAgIGZvciBjIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBjLnNjcm9sbC51cGRhdGUoKVxuXG4gICAgcmVzZXQ6IC0+IGRlbGV0ZSBAY29sczsgQGluaXRDb2x1bW5zKClcbiAgICBzdG9wOiAgLT4gQGNvbHMucmVtb3ZlKCk7IEBjb2xzID0gbnVsbFxuICAgIHN0YXJ0OiAtPiBAaW5pdENvbHVtbnMoKVxuXG4gICAgcmVmcmVzaDogPT4gcmVzZXQoKVxuICAgICAgICBcbiAgICAjIDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgY29udmVydFBYTTogKHJvdykgLT5cbiAgICAgICAgXG4gICAgICAgIGl0ZW0gPSByb3cuaXRlbVxuICAgICAgICBmaWxlID0gaXRlbS5maWxlXG4gICAgICAgIHRtcFBYTSA9IHNsYXNoLmpvaW4gb3MudG1wZGlyKCksIFwia28tI3tzbGFzaC5iYXNlIGZpbGV9LnB4bVwiXG4gICAgICAgIHRtcFBORyA9IHNsYXNoLnN3YXBFeHQgdG1wUFhNLCAnLnBuZydcblxuICAgICAgICBmcy5jb3B5IGZpbGUsIHRtcFBYTSwgKGVycikgPT5cbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJjYW4ndCBjb3B5IHB4bSBpbWFnZSAje2ZpbGV9IHRvICN7dG1wUFhNfTogI3tlcnJ9XCIgaWYgZXJyP1xuICAgICAgICAgICAgY2hpbGRwLmV4ZWMgXCJvcGVuICN7X19kaXJuYW1lfS8uLi8uLi9iaW4vcHhtMnBuZy5hcHAgLS1hcmdzICN7dG1wUFhNfVwiLCAoZXJyKSA9PlxuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJjYW4ndCBjb252ZXJ0IHB4bSBpbWFnZSAje3RtcFBYTX0gdG8gI3t0bXBQTkd9OiAje2Vycn1cIiBpZiBlcnI/XG4gICAgICAgICAgICAgICAgbG9hZERlbGF5ZWQgPSA9PiBAbG9hZEltYWdlIHRtcFBOR1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQgbG9hZERlbGF5ZWQsIDMwMFxuXG4gICAgY29udmVydEltYWdlOiAoZmlsZSkgLT5cbiAgICAgICAga2xvZyAnY29udmVydEltYWdlJyBmaWxlXG4gICAgICAgIHRtcEltYWdlID0gc2xhc2guam9pbiBvcy50bXBkaXIoKSwgXCJrby0je3NsYXNoLmJhc2VuYW1lIGZpbGV9LnBuZ1wiXG4gICAgICAgIGNoaWxkcC5leGVjIFwiL3Vzci9iaW4vc2lwcyAtcyBmb3JtYXQgcG5nIFxcXCIje2ZpbGV9XFxcIiAtLW91dCBcXFwiI3t0bXBJbWFnZX1cXFwiXCIsIChlcnIpID0+XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2FuJ3QgY29udmVydCBpbWFnZSAje2ZpbGV9OiAje2Vycn1cIiBpZiBlcnI/XG4gICAgICAgICAgICBAbG9hZEltYWdlIHRtcEltYWdlXG5cbiAgICBsb2FkSW1hZ2U6IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgcm93ID0gQHJvdyBmaWxlXG4gICAgICAgIHJldHVybiBpZiBub3Qgcm93Py5pc0FjdGl2ZSgpXG5cbiAgICAgICAgY29sID0gQGVtcHR5Q29sdW1uIG9wdD8uY29sdW1uXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbC5pbmRleFxuICAgICAgICBjbnQgPSBlbGVtIGNsYXNzOiAnYnJvd3NlckltYWdlQ29udGFpbmVyJywgY2hpbGQ6IFxuICAgICAgICAgICAgZWxlbSAnaW1nJywgY2xhc3M6ICdicm93c2VySW1hZ2UnLCBzcmM6IHNsYXNoLmZpbGVVcmwgZmlsZVxuICAgICAgICBjb2wudGFibGUuYXBwZW5kQ2hpbGQgY250XG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBCcm93c2VyXG4iXX0=
//# sourceURL=../../coffee/browser/browser.coffee