// koffee 1.12.0

/*
0000000    00000000    0000000   000   000   0000000  00000000  00000000   
000   000  000   000  000   000  000 0 000  000       000       000   000  
0000000    0000000    000   000  000000000  0000000   0000000   0000000    
000   000  000   000  000   000  000   000       000  000       000   000  
0000000    000   000   0000000   00     00  0000000   00000000  000   000
 */
var Browser, Column, childp, clamp, elem, event, flex, fs, kerror, kpos, os, ref, setStyle, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), childp = ref.childp, clamp = ref.clamp, elem = ref.elem, fs = ref.fs, kerror = ref.kerror, kpos = ref.kpos, os = ref.os, setStyle = ref.setStyle, slash = ref.slash;

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

    Browser.prototype.columnAtX = function(x) {
        var column, cpos, j, len, pos, ref1;
        ref1 = this.columns;
        for (j = 0, len = ref1.length; j < len; j++) {
            column = ref1[j];
            cpos = kpos(column.div.getBoundingClientRect().left, column.div.getBoundingClientRect().top);
            pos = kpos(x, cpos.y);
            if (elem.containsPos(column.div, pos)) {
                return column;
            }
        }
        return null;
    };

    Browser.prototype.rowAtPos = function(pos) {
        var column;
        if (column = this.columnAtPos(pos)) {
            return column.rowAtPos(pos);
        }
        return null;
    };

    Browser.prototype.navigate = function(key) {
        var col, index, nuidx, ref1, ref2, row;
        this.select.clear();
        if (key === 'up') {
            if (this.activeColumnIndex() > 0) {
                if (col = this.activeColumn()) {
                    if (row = col.activeRow()) {
                        this.loadItem(this.fileItem(row.item.file));
                    } else {
                        this.loadItem(this.fileItem(col.path()));
                    }
                }
            } else {
                if (!slash.isRoot(this.columns[0].path())) {
                    this.loadItem(this.fileItem(slash.dir(this.columns[0].path())));
                }
            }
        } else {
            index = (ref1 = (ref2 = this.focusColumn()) != null ? ref2.index : void 0) != null ? ref1 : 0;
            nuidx = index + (function() {
                switch (key) {
                    case 'left':
                    case 'up':
                        return -1;
                    case 'right':
                        return +1;
                }
            })();
            nuidx = clamp(0, this.numCols() - 1, nuidx);
            if (nuidx === index) {
                return;
            }
            if (this.columns[nuidx].numRows()) {
                this.columns[nuidx].focus().activeRow().activate();
            }
        }
        this.updateColumnScrolls();
        return this;
    };

    Browser.prototype.focus = function(opt) {
        var ref1;
        if ((ref1 = this.lastDirColumn()) != null) {
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
        return this.columns.slice(-1)[0].isEmpty();
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
        if (index < this.columns.length) {
            return this.columns[index].clear();
        }
    };

    Browser.prototype.shiftColumn = function() {
        var i, j, ref1, results;
        if (!this.flex) {
            return;
        }
        if (!this.columns.length) {
            return;
        }
        this.clearColumn(0);
        this.flex.shiftPane();
        this.columns.shift();
        results = [];
        for (i = j = 0, ref1 = this.columns.length; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
            results.push(this.columns[i].setIndex(i));
        }
        return results;
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
        var ref1, ref2;
        return this.clearColumnsFrom((ref1 = (ref2 = this.lastDirColumn()) != null ? ref2.index : void 0) != null ? ref1 : 0, {
            pop: true
        });
    };

    Browser.prototype.shiftColumnsTo = function(col) {
        var i, j, ref1;
        for (i = j = 0, ref1 = col; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
            this.shiftColumn();
        }
        return this.updateColumnScrolls();
    };

    Browser.prototype.clear = function() {
        return this.clearColumnsFrom(0, {
            pop: true
        });
    };

    Browser.prototype.clearColumnsFrom = function(c, opt) {
        var num, results, results1;
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
        num = this.numCols();
        if (opt.pop) {
            if (opt.clear != null) {
                while (c <= opt.clear) {
                    this.clearColumn(c);
                    c++;
                }
            }
            results = [];
            while (c < num) {
                this.popColumn();
                results.push(c++);
            }
            return results;
        } else {
            results1 = [];
            while (c < num) {
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
                        return _this.loadImage(row, tmpPNG);
                    };
                    return setTimeout(loadDelayed, 300);
                });
            };
        })(this));
    };

    Browser.prototype.convertImage = function(row) {
        var file, item, tmpImg;
        item = row.item;
        file = item.file;
        tmpImg = slash.join(os.tmpdir(), "ko-" + (slash.basename(file)) + ".png");
        return childp.exec("/usr/bin/sips -s format png \"" + file + "\" --out \"" + tmpImg + "\"", (function(_this) {
            return function(err) {
                if (err != null) {
                    return kerror("can't convert image " + file + ": " + err);
                }
                return _this.loadImage(row, tmpImg);
            };
        })(this));
    };

    Browser.prototype.loadImage = function(row, file) {
        var cnt, col;
        if (!row.isActive()) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvYnJvd3NlciIsInNvdXJjZXMiOlsiYnJvd3Nlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsNkZBQUE7SUFBQTs7OztBQVFBLE1BQWlFLE9BQUEsQ0FBUSxLQUFSLENBQWpFLEVBQUUsbUJBQUYsRUFBVSxpQkFBVixFQUFpQixlQUFqQixFQUF1QixXQUF2QixFQUEyQixtQkFBM0IsRUFBbUMsZUFBbkMsRUFBeUMsV0FBekMsRUFBNkMsdUJBQTdDLEVBQXVEOztBQUV2RCxNQUFBLEdBQVMsT0FBQSxDQUFRLFVBQVI7O0FBQ1QsSUFBQSxHQUFTLE9BQUEsQ0FBUSxrQkFBUjs7QUFDVCxLQUFBLEdBQVMsT0FBQSxDQUFRLFFBQVI7O0FBRUg7OztJQUVDLGlCQUFDLElBQUQ7UUFBQyxJQUFDLENBQUEsT0FBRDs7OztRQUVBLElBQUMsQ0FBQSxPQUFELEdBQVc7UUFFWCxRQUFBLENBQVMsa0JBQVQsRUFBNEIsU0FBNUIsRUFBc0MsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFiLENBQWlCLHdCQUFqQixDQUFBLElBQStDLE1BQS9DLElBQXlELFNBQS9GO0lBSkQ7O3NCQVlILFdBQUEsR0FBYSxTQUFBO1FBRVQsSUFBVSxtQkFBQSxJQUFXLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBTixLQUFvQixJQUFDLENBQUEsSUFBMUM7QUFBQSxtQkFBQTs7UUFFQSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sR0FBa0I7UUFFbEIsSUFBRyxpQkFBSDtZQUNJLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixDQUFrQixJQUFDLENBQUEsSUFBbkI7QUFDQSxtQkFGSjs7UUFJQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sU0FBTjtZQUFnQixFQUFBLEVBQUcsU0FBbkI7U0FBTDtRQUNSLElBQUMsQ0FBQSxJQUFJ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LENBQWMsSUFBZCxDQUF6QjthQUFYLENBRE87U0FBTDtlQUVOLEdBQUcsQ0FBQyxLQUFLLENBQUMsV0FBVixDQUFzQixHQUF0QjtJQVJPOzs7O0dBOVJPOztBQXdTdEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMCAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIyNcblxueyBjaGlsZHAsIGNsYW1wLCBlbGVtLCBmcywga2Vycm9yLCBrcG9zLCBvcywgc2V0U3R5bGUsIHNsYXNoIH0gPSByZXF1aXJlICdreGsnXG5cbkNvbHVtbiA9IHJlcXVpcmUgJy4vY29sdW1uJ1xuZmxleCAgID0gcmVxdWlyZSAnLi4vd2luL2ZsZXgvZmxleCdcbmV2ZW50ICA9IHJlcXVpcmUgJ2V2ZW50cydcblxuY2xhc3MgQnJvd3NlciBleHRlbmRzIGV2ZW50XG4gICAgXG4gICAgQDogKEB2aWV3KSAtPlxuICAgICAgICBcbiAgICAgICAgQGNvbHVtbnMgPSBbXVxuICAgICAgICBcbiAgICAgICAgc2V0U3R5bGUgJy5icm93c2VyUm93IC5leHQnICdkaXNwbGF5JyB3aW5kb3cuc3RhdGUuZ2V0KCdicm93c2VyfGhpZGVFeHRlbnNpb25zJykgYW5kICdub25lJyBvciAnaW5pdGlhbCdcblxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGluaXRDb2x1bW5zOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIEBjb2xzPyBhbmQgQGNvbHMucGFyZW50Tm9kZSA9PSBAdmlld1xuICAgICAgICBcbiAgICAgICAgQHZpZXcuaW5uZXJIVE1MID0gJydcbiAgICAgICAgXG4gICAgICAgIGlmIEBjb2xzP1xuICAgICAgICAgICAgQHZpZXcuYXBwZW5kQ2hpbGQgQGNvbHNcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIEBjb2xzID0gZWxlbSBjbGFzczonYnJvd3NlcicgaWQ6J2NvbHVtbnMnXG4gICAgICAgIEB2aWV3LmFwcGVuZENoaWxkIEBjb2xzXG4gICAgICAgIFxuICAgICAgICBAY29sdW1ucyA9IFtdXG5cbiAgICAgICAgQGZsZXggPSBuZXcgZmxleCBcbiAgICAgICAgICAgIHZpZXc6ICAgICAgIEBjb2xzXG4gICAgICAgICAgICBvblBhbmVTaXplOiBAdXBkYXRlQ29sdW1uU2Nyb2xsc1xuICAgICAgICBcbiAgICBjb2x1bW5BdFBvczogKHBvcykgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBjb2x1bW4gaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIGVsZW0uY29udGFpbnNQb3MgY29sdW1uLmRpdiwgcG9zXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbHVtblxuICAgICAgICBudWxsXG4gICAgICAgIFxuICAgIGNvbHVtbkF0WDogKHgpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgY29sdW1uIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBjcG9zID0ga3BvcyBjb2x1bW4uZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQsIGNvbHVtbi5kaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG4gICAgICAgICAgICBwb3MgPSBrcG9zIHgsIGNwb3MueVxuICAgICAgICAgICAgaWYgZWxlbS5jb250YWluc1BvcyBjb2x1bW4uZGl2LCBwb3NcbiAgICAgICAgICAgICAgICByZXR1cm4gY29sdW1uXG4gICAgICAgIG51bGxcbiAgICAgICAgXG4gICAgcm93QXRQb3M6IChwb3MpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBjb2x1bW4gPSBAY29sdW1uQXRQb3MgcG9zXG4gICAgICAgICAgICByZXR1cm4gY29sdW1uLnJvd0F0UG9zIHBvc1xuICAgICAgICBudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG5hdmlnYXRlOiAoa2V5KSAtPlxuICBcbiAgICAgICAgQHNlbGVjdC5jbGVhcigpXG4gICAgICAgIFxuICAgICAgICBpZiBrZXkgPT0gJ3VwJ1xuICAgICAgICAgICAgaWYgQGFjdGl2ZUNvbHVtbkluZGV4KCkgPiAwXG4gICAgICAgICAgICAgICAgaWYgY29sID0gQGFjdGl2ZUNvbHVtbigpXG4gICAgICAgICAgICAgICAgICAgIGlmIHJvdyA9IGNvbC5hY3RpdmVSb3coKVxuICAgICAgICAgICAgICAgICAgICAgICAgQGxvYWRJdGVtIEBmaWxlSXRlbSByb3cuaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEBsb2FkSXRlbSBAZmlsZUl0ZW0gY29sLnBhdGgoKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlmIG5vdCBzbGFzaC5pc1Jvb3QgQGNvbHVtbnNbMF0ucGF0aCgpXG4gICAgICAgICAgICAgICAgICAgIEBsb2FkSXRlbSBAZmlsZUl0ZW0gc2xhc2guZGlyIEBjb2x1bW5zWzBdLnBhdGgoKVxuICAgICAgICBlbHNlICAgICAgICBcbiAgICAgICAgICAgIGluZGV4ID0gQGZvY3VzQ29sdW1uKCk/LmluZGV4ID8gMFxuICAgICAgICAgICAgbnVpZHggPSBpbmRleCArIHN3aXRjaCBrZXlcbiAgICAgICAgICAgICAgICB3aGVuICdsZWZ0Jyd1cCcgdGhlbiAtMVxuICAgICAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyAgICB0aGVuICsxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgbnVpZHggPSBjbGFtcCAwLCBAbnVtQ29scygpLTEsIG51aWR4XG4gICAgICAgICAgICByZXR1cm4gaWYgbnVpZHggPT0gaW5kZXhcbiAgICAgICAgICAgIGlmIEBjb2x1bW5zW251aWR4XS5udW1Sb3dzKClcbiAgICAgICAgICAgICAgICBAY29sdW1uc1tudWlkeF0uZm9jdXMoKS5hY3RpdmVSb3coKS5hY3RpdmF0ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGZvY3VzOiAob3B0KSA9PiBcbiAgICAgICAgQGxhc3REaXJDb2x1bW4oKT8uZm9jdXMgb3B0XG4gICAgICAgIEBcbiAgICBcbiAgICBmb2N1c0NvbHVtbjogLT4gXG4gICAgICAgIGZvciBjIGluIEBjb2x1bW5zXG4gICAgICAgICAgICByZXR1cm4gYyBpZiBjLmhhc0ZvY3VzKClcbiAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgICAgMDAwICAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICBcbiAgICBcbiAgICBlbXB0eUNvbHVtbjogKGNvbEluZGV4KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgY29sSW5kZXg/XG4gICAgICAgICAgICBmb3IgYyBpbiBbY29sSW5kZXguLi5AbnVtQ29scygpXVxuICAgICAgICAgICAgICAgIEBjbGVhckNvbHVtbiBjXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGZvciBjb2wgaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIHJldHVybiBjb2wgaWYgY29sLmlzRW1wdHkoKVxuICAgICAgICAgICAgXG4gICAgICAgIEBhZGRDb2x1bW4oKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICAgICAgXG4gICAgXG4gICAgYWN0aXZlQ29sdW1uOiAtPiBAY29sdW1uIEBhY3RpdmVDb2x1bW5JbmRleCgpXG4gICAgYWN0aXZlQ29sdW1uSW5kZXg6IC0+IFxuICAgICAgICBcbiAgICAgICAgZm9yIGNvbCBpbiBAY29sdW1uc1xuICAgICAgICAgICAgaWYgY29sLmhhc0ZvY3VzKCkgdGhlbiByZXR1cm4gY29sLmluZGV4XG4gICAgICAgIDBcbiAgICAgICAgICAgICAgICBcbiAgICBsYXN0VXNlZENvbHVtbjogLT5cbiAgICAgICAgXG4gICAgICAgIHVzZWQgPSBudWxsXG4gICAgICAgIGZvciBjb2wgaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIG5vdCBjb2wuaXNFbXB0eSgpXG4gICAgICAgICAgICAgICAgdXNlZCA9IGNvbCBcbiAgICAgICAgICAgIGVsc2UgYnJlYWtcbiAgICAgICAgdXNlZFxuXG4gICAgaGFzRW1wdHlDb2x1bW5zOiAtPiBAY29sdW1uc1stMV0uaXNFbXB0eSgpXG5cbiAgICBoZWlnaHQ6IC0+IEBmbGV4Py5oZWlnaHQoKVxuICAgIG51bUNvbHM6IC0+IEBjb2x1bW5zLmxlbmd0aCBcbiAgICBjb2x1bW46IChpKSAtPiBAY29sdW1uc1tpXSBpZiAwIDw9IGkgPCBAbnVtQ29scygpXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICAgICAgIFxuICAgIGFkZENvbHVtbjogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGZsZXhcblxuICAgICAgICBjb2wgPSBuZXcgQ29sdW1uIEBcbiAgICAgICAgQGNvbHVtbnMucHVzaCBjb2xcbiAgICAgICAgQGZsZXguYWRkUGFuZSBkaXY6Y29sLmRpdiwgc2l6ZTo1MFxuICAgICAgICBjb2xcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgXG4gICAgXG4gICAgY2xlYXJDb2x1bW46IChpbmRleCkgLT4gaWYgaW5kZXggPCBAY29sdW1ucy5sZW5ndGggdGhlbiBAY29sdW1uc1tpbmRleF0uY2xlYXIoKVxuICAgIFxuICAgIHNoaWZ0Q29sdW1uOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmxleFxuICAgICAgICByZXR1cm4gaWYgbm90IEBjb2x1bW5zLmxlbmd0aFxuICAgICAgICBAY2xlYXJDb2x1bW4gMFxuICAgICAgICBAZmxleC5zaGlmdFBhbmUoKVxuICAgICAgICBAY29sdW1ucy5zaGlmdCgpXG4gICAgICAgIFxuICAgICAgICBmb3IgaSBpbiBbMC4uLkBjb2x1bW5zLmxlbmd0aF1cbiAgICAgICAgICAgIEBjb2x1bW5zW2ldLnNldEluZGV4IGlcbiAgICBcbiAgICBwb3BDb2x1bW46IChvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBmbGV4XG4gICAgICAgIEBjbGVhckNvbHVtbiBAY29sdW1ucy5sZW5ndGgtMVxuICAgICAgICBAZmxleC5wb3BQYW5lIG9wdFxuICAgICAgICBAY29sdW1ucy5wb3AoKVxuICAgICAgICBcbiAgICBwb3BFbXB0eUNvbHVtbnM6IChvcHQpIC0+IFxuICAgICAgICBcbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gQGxhc3REaXJDb2x1bW4oKT8uaW5kZXggPyAwLCBwb3A6dHJ1ZVxuICAgICAgICBcbiAgICBzaGlmdENvbHVtbnNUbzogKGNvbCkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBpIGluIFswLi4uY29sXVxuICAgICAgICAgICAgQHNoaWZ0Q29sdW1uKClcbiAgICAgICAgICAgIFxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBjbGVhcjogLT4gQGNsZWFyQ29sdW1uc0Zyb20gMCwgcG9wOnRydWUgXG4gICAgXG4gICAgY2xlYXJDb2x1bW5zRnJvbTogKGM9MCwgb3B0PXBvcDpmYWxzZSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBrZXJyb3IgXCJjbGVhckNvbHVtbnNGcm9tICN7Y30/XCIgaWYgbm90IGM/IG9yIGMgPCAwXG4gICAgICAgIFxuICAgICAgICBudW0gPSBAbnVtQ29scygpXG4gICAgICAgIGlmIG9wdC5wb3BcbiAgICAgICAgICAgIGlmIG9wdC5jbGVhcj9cbiAgICAgICAgICAgICAgICB3aGlsZSBjIDw9IG9wdC5jbGVhclxuICAgICAgICAgICAgICAgICAgICBAY2xlYXJDb2x1bW4gY1xuICAgICAgICAgICAgICAgICAgICBjKytcbiAgICAgICAgICAgIHdoaWxlIGMgPCBudW1cbiAgICAgICAgICAgICAgICBAcG9wQ29sdW1uKClcbiAgICAgICAgICAgICAgICBjKytcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2hpbGUgYyA8IG51bVxuICAgICAgICAgICAgICAgIEBjbGVhckNvbHVtbiBjXG4gICAgICAgICAgICAgICAgYysrXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgaXNNZXNzeTogLT4gbm90IEBmbGV4LnJlbGF4ZWQgb3IgQGhhc0VtcHR5Q29sdW1ucygpXG4gICAgXG4gICAgY2xlYW5VcDogLT4gXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBub3QgQGZsZXg/XG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBub3QgQGlzTWVzc3koKVxuICAgICAgICBAcG9wRW1wdHlDb2x1bW5zKClcbiAgICAgICAgQGZsZXgucmVsYXgoKVxuICAgICAgICB0cnVlXG5cbiAgICByZXNpemVkOiAtPiBcblxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG4gICAgXG4gICAgdXBkYXRlQ29sdW1uU2Nyb2xsczogPT5cbiAgICAgICAgXG4gICAgICAgIGZvciBjIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBjLnNjcm9sbC51cGRhdGUoKVxuXG4gICAgcmVzZXQ6IC0+IGRlbGV0ZSBAY29sczsgQGluaXRDb2x1bW5zKClcbiAgICBzdG9wOiAgLT4gQGNvbHMucmVtb3ZlKCk7IEBjb2xzID0gbnVsbFxuICAgIHN0YXJ0OiAtPiBAaW5pdENvbHVtbnMoKVxuXG4gICAgcmVmcmVzaDogPT4gcmVzZXQoKVxuICAgICAgICBcbiAgICAjIDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgY29udmVydFBYTTogKHJvdykgLT5cbiAgICAgICAgXG4gICAgICAgIGl0ZW0gICA9IHJvdy5pdGVtXG4gICAgICAgIGZpbGUgICA9IGl0ZW0uZmlsZVxuICAgICAgICB0bXBQWE0gPSBzbGFzaC5qb2luIG9zLnRtcGRpcigpLCBcImtvLSN7c2xhc2guYmFzZSBmaWxlfS5weG1cIlxuICAgICAgICB0bXBQTkcgPSBzbGFzaC5zd2FwRXh0IHRtcFBYTSwgJy5wbmcnXG5cbiAgICAgICAgZnMuY29weSBmaWxlLCB0bXBQWE0sIChlcnIpID0+XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2FuJ3QgY29weSBweG0gaW1hZ2UgI3tmaWxlfSB0byAje3RtcFBYTX06ICN7ZXJyfVwiIGlmIGVycj9cbiAgICAgICAgICAgIGNoaWxkcC5leGVjIFwib3BlbiAje19fZGlybmFtZX0vLi4vLi4vYmluL3B4bTJwbmcuYXBwIC0tYXJncyAje3RtcFBYTX1cIiwgKGVycikgPT5cbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2FuJ3QgY29udmVydCBweG0gaW1hZ2UgI3t0bXBQWE19IHRvICN7dG1wUE5HfTogI3tlcnJ9XCIgaWYgZXJyP1xuICAgICAgICAgICAgICAgIGxvYWREZWxheWVkID0gPT4gQGxvYWRJbWFnZSByb3csIHRtcFBOR1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQgbG9hZERlbGF5ZWQsIDMwMFxuXG4gICAgY29udmVydEltYWdlOiAocm93KSAtPlxuICAgICAgICBcbiAgICAgICAgaXRlbSAgID0gcm93Lml0ZW1cbiAgICAgICAgZmlsZSAgID0gaXRlbS5maWxlXG4gICAgICAgIHRtcEltZyA9IHNsYXNoLmpvaW4gb3MudG1wZGlyKCksIFwia28tI3tzbGFzaC5iYXNlbmFtZSBmaWxlfS5wbmdcIlxuICAgICAgICBcbiAgICAgICAgY2hpbGRwLmV4ZWMgXCIvdXNyL2Jpbi9zaXBzIC1zIGZvcm1hdCBwbmcgXFxcIiN7ZmlsZX1cXFwiIC0tb3V0IFxcXCIje3RtcEltZ31cXFwiXCIsIChlcnIpID0+XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2FuJ3QgY29udmVydCBpbWFnZSAje2ZpbGV9OiAje2Vycn1cIiBpZiBlcnI/XG4gICAgICAgICAgICBAbG9hZEltYWdlIHJvdywgdG1wSW1nXG5cbiAgICBsb2FkSW1hZ2U6IChyb3csIGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IHJvdy5pc0FjdGl2ZSgpXG5cbiAgICAgICAgY29sID0gQGVtcHR5Q29sdW1uIG9wdD8uY29sdW1uXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbC5pbmRleFxuICAgICAgICBjbnQgPSBlbGVtIGNsYXNzOidicm93c2VySW1hZ2VDb250YWluZXInIGNoaWxkOiBcbiAgICAgICAgICAgIGVsZW0gJ2ltZycgY2xhc3M6J2Jyb3dzZXJJbWFnZScgc3JjOnNsYXNoLmZpbGVVcmwgZmlsZVxuICAgICAgICBjb2wudGFibGUuYXBwZW5kQ2hpbGQgY250XG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBCcm93c2VyXG4iXX0=
//# sourceURL=../../coffee/browser/browser.coffee