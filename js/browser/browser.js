// koffee 1.14.0

/*
0000000    00000000    0000000   000   000   0000000  00000000  00000000   
000   000  000   000  000   000  000 0 000  000       000       000   000  
0000000    0000000    000   000  000000000  0000000   0000000   0000000    
000   000  000   000  000   000  000   000       000  000       000   000  
0000000    000   000   0000000   00     00  0000000   00000000  000   000
 */
var Browser, Column, childp, clamp, elem, event, flex, fs, kerror, klog, kpos, os, ref, setStyle, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), childp = ref.childp, clamp = ref.clamp, elem = ref.elem, fs = ref.fs, kerror = ref.kerror, klog = ref.klog, kpos = ref.kpos, os = ref.os, setStyle = ref.setStyle, slash = ref.slash;

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
        var col, index, nuidx, ref1, ref2, ref3, ref4, row;
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
                klog('browser.navigate focus', this.columns[nuidx].name());
                if ((ref3 = this.columns[nuidx].focus()) != null) {
                    if ((ref4 = ref3.activeRow()) != null) {
                        ref4.activate();
                    }
                }
            }
        }
        this.updateColumnScrolls();
        return this;
    };

    Browser.prototype.focus = function(opt) {
        var ref1;
        if ((ref1 = this.lastDirOrSrcColumn()) != null) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvYnJvd3NlciIsInNvdXJjZXMiOlsiYnJvd3Nlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsbUdBQUE7SUFBQTs7OztBQVFBLE1BQXVFLE9BQUEsQ0FBUSxLQUFSLENBQXZFLEVBQUUsbUJBQUYsRUFBVSxpQkFBVixFQUFpQixlQUFqQixFQUF1QixXQUF2QixFQUEyQixtQkFBM0IsRUFBbUMsZUFBbkMsRUFBeUMsZUFBekMsRUFBK0MsV0FBL0MsRUFBbUQsdUJBQW5ELEVBQTZEOztBQUU3RCxNQUFBLEdBQVMsT0FBQSxDQUFRLFVBQVI7O0FBQ1QsSUFBQSxHQUFTLE9BQUEsQ0FBUSxrQkFBUjs7QUFDVCxLQUFBLEdBQVMsT0FBQSxDQUFRLFFBQVI7O0FBRUg7OztJQUVDLGlCQUFDLElBQUQ7UUFBQyxJQUFDLENBQUEsT0FBRDs7OztRQUVBLElBQUMsQ0FBQSxPQUFELEdBQVc7UUFFWCxRQUFBLENBQVMsa0JBQVQsRUFBNEIsU0FBNUIsRUFBc0MsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFiLENBQWlCLHdCQUFqQixDQUFBLElBQStDLE1BQS9DLElBQXlELFNBQS9GO0lBSkQ7O3NCQVlILFdBQUEsR0FBYSxTQUFBO1FBRVQsSUFBVSxtQkFBQSxJQUFXLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBTixLQUFvQixJQUFDLENBQUEsSUFBMUM7QUFBQSxtQkFBQTs7UUFFQSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sR0FBa0I7UUFFbEIsSUFBRyxpQkFBSDtZQUNJLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixDQUFrQixJQUFDLENBQUEsSUFBbkI7QUFDQSxtQkFGSjs7UUFJQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sU0FBTjtZQUFnQixFQUFBLEVBQUcsU0FBbkI7U0FBTDtRQUNSLElB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QUFBLEVBQUksS0FBSyxDQUFDLE9BQU4sQ0FBYyxJQUFkLENBQXpCO2FBQVgsQ0FETztTQUFMO2VBRU4sR0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFWLENBQXNCLEdBQXRCO0lBUk87Ozs7R0EvUk87O0FBeVN0QixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbjAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiMjI1xuXG57IGNoaWxkcCwgY2xhbXAsIGVsZW0sIGZzLCBrZXJyb3IsIGtsb2csIGtwb3MsIG9zLCBzZXRTdHlsZSwgc2xhc2ggfSA9IHJlcXVpcmUgJ2t4aydcblxuQ29sdW1uID0gcmVxdWlyZSAnLi9jb2x1bW4nXG5mbGV4ICAgPSByZXF1aXJlICcuLi93aW4vZmxleC9mbGV4J1xuZXZlbnQgID0gcmVxdWlyZSAnZXZlbnRzJ1xuXG5jbGFzcyBCcm93c2VyIGV4dGVuZHMgZXZlbnRcbiAgICBcbiAgICBAOiAoQHZpZXcpIC0+XG4gICAgICAgIFxuICAgICAgICBAY29sdW1ucyA9IFtdXG4gICAgICAgIFxuICAgICAgICBzZXRTdHlsZSAnLmJyb3dzZXJSb3cgLmV4dCcgJ2Rpc3BsYXknIHdpbmRvdy5zdGF0ZS5nZXQoJ2Jyb3dzZXJ8aGlkZUV4dGVuc2lvbnMnKSBhbmQgJ25vbmUnIG9yICdpbml0aWFsJ1xuXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgaW5pdENvbHVtbnM6IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgQGNvbHM/IGFuZCBAY29scy5wYXJlbnROb2RlID09IEB2aWV3XG4gICAgICAgIFxuICAgICAgICBAdmlldy5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBcbiAgICAgICAgaWYgQGNvbHM/XG4gICAgICAgICAgICBAdmlldy5hcHBlbmRDaGlsZCBAY29sc1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgQGNvbHMgPSBlbGVtIGNsYXNzOidicm93c2VyJyBpZDonY29sdW1ucydcbiAgICAgICAgQHZpZXcuYXBwZW5kQ2hpbGQgQGNvbHNcbiAgICAgICAgXG4gICAgICAgIEBjb2x1bW5zID0gW11cblxuICAgICAgICBAZmxleCA9IG5ldyBmbGV4IFxuICAgICAgICAgICAgdmlldzogICAgICAgQGNvbHNcbiAgICAgICAgICAgIG9uUGFuZVNpemU6IEB1cGRhdGVDb2x1bW5TY3JvbGxzXG4gICAgICAgIFxuICAgIGNvbHVtbkF0UG9zOiAocG9zKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGNvbHVtbiBpbiBAY29sdW1uc1xuICAgICAgICAgICAgaWYgZWxlbS5jb250YWluc1BvcyBjb2x1bW4uZGl2LCBwb3NcbiAgICAgICAgICAgICAgICByZXR1cm4gY29sdW1uXG4gICAgICAgIG51bGxcbiAgICAgICAgXG4gICAgY29sdW1uQXRYOiAoeCkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBjb2x1bW4gaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGNwb3MgPSBrcG9zIGNvbHVtbi5kaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCwgY29sdW1uLmRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3BcbiAgICAgICAgICAgIHBvcyA9IGtwb3MgeCwgY3Bvcy55XG4gICAgICAgICAgICBpZiBlbGVtLmNvbnRhaW5zUG9zIGNvbHVtbi5kaXYsIHBvc1xuICAgICAgICAgICAgICAgIHJldHVybiBjb2x1bW5cbiAgICAgICAgbnVsbFxuICAgICAgICBcbiAgICByb3dBdFBvczogKHBvcykgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGNvbHVtbiA9IEBjb2x1bW5BdFBvcyBwb3NcbiAgICAgICAgICAgIHJldHVybiBjb2x1bW4ucm93QXRQb3MgcG9zXG4gICAgICAgIG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgbmF2aWdhdGU6IChrZXkpIC0+XG4gIFxuICAgICAgICBAc2VsZWN0LmNsZWFyKClcbiAgICAgICAgXG4gICAgICAgIGlmIGtleSA9PSAndXAnXG4gICAgICAgICAgICBpZiBAYWN0aXZlQ29sdW1uSW5kZXgoKSA+IDBcbiAgICAgICAgICAgICAgICBpZiBjb2wgPSBAYWN0aXZlQ29sdW1uKClcbiAgICAgICAgICAgICAgICAgICAgaWYgcm93ID0gY29sLmFjdGl2ZVJvdygpXG4gICAgICAgICAgICAgICAgICAgICAgICBAbG9hZEl0ZW0gQGZpbGVJdGVtIHJvdy5pdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQGxvYWRJdGVtIEBmaWxlSXRlbSBjb2wucGF0aCgpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLmlzUm9vdCBAY29sdW1uc1swXS5wYXRoKClcbiAgICAgICAgICAgICAgICAgICAgQGxvYWRJdGVtIEBmaWxlSXRlbSBzbGFzaC5kaXIgQGNvbHVtbnNbMF0ucGF0aCgpXG4gICAgICAgIGVsc2UgICAgICAgIFxuICAgICAgICAgICAgaW5kZXggPSBAZm9jdXNDb2x1bW4oKT8uaW5kZXggPyAwXG4gICAgICAgICAgICBudWlkeCA9IGluZGV4ICsgc3dpdGNoIGtleVxuICAgICAgICAgICAgICAgIHdoZW4gJ2xlZnQnJ3VwJyB0aGVuIC0xXG4gICAgICAgICAgICAgICAgd2hlbiAncmlnaHQnICAgIHRoZW4gKzFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBudWlkeCA9IGNsYW1wIDAsIEBudW1Db2xzKCktMSwgbnVpZHhcbiAgICAgICAgICAgIHJldHVybiBpZiBudWlkeCA9PSBpbmRleFxuICAgICAgICAgICAgaWYgQGNvbHVtbnNbbnVpZHhdLm51bVJvd3MoKVxuICAgICAgICAgICAgICAgIGtsb2cgJ2Jyb3dzZXIubmF2aWdhdGUgZm9jdXMnIEBjb2x1bW5zW251aWR4XS5uYW1lKCkgXG4gICAgICAgICAgICAgICAgQGNvbHVtbnNbbnVpZHhdLmZvY3VzKCk/LmFjdGl2ZVJvdygpPy5hY3RpdmF0ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGZvY3VzOiAob3B0KSA9PiBcbiAgICAgICAgQGxhc3REaXJPclNyY0NvbHVtbigpPy5mb2N1cyBvcHRcbiAgICAgICAgQFxuICAgIFxuICAgIGZvY3VzQ29sdW1uOiAtPiBcbiAgICAgICAgZm9yIGMgaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIHJldHVybiBjIGlmIGMuaGFzRm9jdXMoKVxuICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAgICAwMDAgICAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgIFxuICAgIFxuICAgIGVtcHR5Q29sdW1uOiAoY29sSW5kZXgpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBjb2xJbmRleD9cbiAgICAgICAgICAgIGZvciBjIGluIFtjb2xJbmRleC4uLkBudW1Db2xzKCldXG4gICAgICAgICAgICAgICAgQGNsZWFyQ29sdW1uIGNcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgZm9yIGNvbCBpbiBAY29sdW1uc1xuICAgICAgICAgICAgcmV0dXJuIGNvbCBpZiBjb2wuaXNFbXB0eSgpXG4gICAgICAgICAgICBcbiAgICAgICAgQGFkZENvbHVtbigpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgICBcbiAgICBcbiAgICBhY3RpdmVDb2x1bW46IC0+IEBjb2x1bW4gQGFjdGl2ZUNvbHVtbkluZGV4KClcbiAgICBhY3RpdmVDb2x1bW5JbmRleDogLT4gXG4gICAgICAgIFxuICAgICAgICBmb3IgY29sIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBjb2wuaGFzRm9jdXMoKSB0aGVuIHJldHVybiBjb2wuaW5kZXhcbiAgICAgICAgMFxuICAgICAgICAgICAgICAgIFxuICAgIGxhc3RVc2VkQ29sdW1uOiAtPlxuICAgICAgICBcbiAgICAgICAgdXNlZCA9IG51bGxcbiAgICAgICAgZm9yIGNvbCBpbiBAY29sdW1uc1xuICAgICAgICAgICAgaWYgbm90IGNvbC5pc0VtcHR5KClcbiAgICAgICAgICAgICAgICB1c2VkID0gY29sIFxuICAgICAgICAgICAgZWxzZSBicmVha1xuICAgICAgICB1c2VkXG5cbiAgICBoYXNFbXB0eUNvbHVtbnM6IC0+IEBjb2x1bW5zWy0xXS5pc0VtcHR5KClcblxuICAgIGhlaWdodDogLT4gQGZsZXg/LmhlaWdodCgpXG4gICAgbnVtQ29sczogLT4gQGNvbHVtbnMubGVuZ3RoIFxuICAgIGNvbHVtbjogKGkpIC0+IEBjb2x1bW5zW2ldIGlmIDAgPD0gaSA8IEBudW1Db2xzKClcbiAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgICAgICAgXG4gICAgYWRkQ29sdW1uOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmxleFxuXG4gICAgICAgIGNvbCA9IG5ldyBDb2x1bW4gQFxuICAgICAgICBAY29sdW1ucy5wdXNoIGNvbFxuICAgICAgICBAZmxleC5hZGRQYW5lIGRpdjpjb2wuZGl2LCBzaXplOjUwXG4gICAgICAgIGNvbFxuICAgIFxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICBcbiAgICBcbiAgICBjbGVhckNvbHVtbjogKGluZGV4KSAtPiBpZiBpbmRleCA8IEBjb2x1bW5zLmxlbmd0aCB0aGVuIEBjb2x1bW5zW2luZGV4XS5jbGVhcigpXG4gICAgXG4gICAgc2hpZnRDb2x1bW46IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBmbGV4XG4gICAgICAgIHJldHVybiBpZiBub3QgQGNvbHVtbnMubGVuZ3RoXG4gICAgICAgIEBjbGVhckNvbHVtbiAwXG4gICAgICAgIEBmbGV4LnNoaWZ0UGFuZSgpXG4gICAgICAgIEBjb2x1bW5zLnNoaWZ0KClcbiAgICAgICAgXG4gICAgICAgIGZvciBpIGluIFswLi4uQGNvbHVtbnMubGVuZ3RoXVxuICAgICAgICAgICAgQGNvbHVtbnNbaV0uc2V0SW5kZXggaVxuICAgIFxuICAgIHBvcENvbHVtbjogKG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGZsZXhcbiAgICAgICAgQGNsZWFyQ29sdW1uIEBjb2x1bW5zLmxlbmd0aC0xXG4gICAgICAgIEBmbGV4LnBvcFBhbmUgb3B0XG4gICAgICAgIEBjb2x1bW5zLnBvcCgpXG4gICAgICAgIFxuICAgIHBvcEVtcHR5Q29sdW1uczogKG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIEBsYXN0RGlyQ29sdW1uKCk/LmluZGV4ID8gMCwgcG9wOnRydWVcbiAgICAgICAgXG4gICAgc2hpZnRDb2x1bW5zVG86IChjb2wpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgaSBpbiBbMC4uLmNvbF1cbiAgICAgICAgICAgIEBzaGlmdENvbHVtbigpXG4gICAgICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgY2xlYXI6IC0+IEBjbGVhckNvbHVtbnNGcm9tIDAsIHBvcDp0cnVlIFxuICAgIFxuICAgIGNsZWFyQ29sdW1uc0Zyb206IChjPTAsIG9wdD1wb3A6ZmFsc2UpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2xlYXJDb2x1bW5zRnJvbSAje2N9P1wiIGlmIG5vdCBjPyBvciBjIDwgMFxuICAgICAgICBcbiAgICAgICAgbnVtID0gQG51bUNvbHMoKVxuICAgICAgICBpZiBvcHQucG9wXG4gICAgICAgICAgICBpZiBvcHQuY2xlYXI/XG4gICAgICAgICAgICAgICAgd2hpbGUgYyA8PSBvcHQuY2xlYXJcbiAgICAgICAgICAgICAgICAgICAgQGNsZWFyQ29sdW1uIGNcbiAgICAgICAgICAgICAgICAgICAgYysrXG4gICAgICAgICAgICB3aGlsZSBjIDwgbnVtXG4gICAgICAgICAgICAgICAgQHBvcENvbHVtbigpXG4gICAgICAgICAgICAgICAgYysrXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHdoaWxlIGMgPCBudW1cbiAgICAgICAgICAgICAgICBAY2xlYXJDb2x1bW4gY1xuICAgICAgICAgICAgICAgIGMrK1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGlzTWVzc3k6IC0+IG5vdCBAZmxleC5yZWxheGVkIG9yIEBoYXNFbXB0eUNvbHVtbnMoKVxuICAgIFxuICAgIGNsZWFuVXA6IC0+IFxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IEBmbGV4P1xuICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IEBpc01lc3N5KClcbiAgICAgICAgQHBvcEVtcHR5Q29sdW1ucygpXG4gICAgICAgIEBmbGV4LnJlbGF4KClcbiAgICAgICAgdHJ1ZVxuXG4gICAgcmVzaXplZDogLT4gXG5cbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgIFxuICAgIHVwZGF0ZUNvbHVtblNjcm9sbHM6ID0+XG4gICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY29sdW1uc1xuICAgICAgICAgICAgYy5zY3JvbGwudXBkYXRlKClcblxuICAgIHJlc2V0OiAtPiBkZWxldGUgQGNvbHM7IEBpbml0Q29sdW1ucygpXG4gICAgc3RvcDogIC0+IEBjb2xzLnJlbW92ZSgpOyBAY29scyA9IG51bGxcbiAgICBzdGFydDogLT4gQGluaXRDb2x1bW5zKClcblxuICAgIHJlZnJlc2g6ID0+IHJlc2V0KClcbiAgICAgICAgXG4gICAgIyAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGNvbnZlcnRQWE06IChyb3cpIC0+XG4gICAgICAgIFxuICAgICAgICBpdGVtICAgPSByb3cuaXRlbVxuICAgICAgICBmaWxlICAgPSBpdGVtLmZpbGVcbiAgICAgICAgdG1wUFhNID0gc2xhc2guam9pbiBvcy50bXBkaXIoKSwgXCJrby0je3NsYXNoLmJhc2UgZmlsZX0ucHhtXCJcbiAgICAgICAgdG1wUE5HID0gc2xhc2guc3dhcEV4dCB0bXBQWE0sICcucG5nJ1xuXG4gICAgICAgIGZzLmNvcHkgZmlsZSwgdG1wUFhNLCAoZXJyKSA9PlxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcImNhbid0IGNvcHkgcHhtIGltYWdlICN7ZmlsZX0gdG8gI3t0bXBQWE19OiAje2Vycn1cIiBpZiBlcnI/XG4gICAgICAgICAgICBjaGlsZHAuZXhlYyBcIm9wZW4gI3tfX2Rpcm5hbWV9Ly4uLy4uL2Jpbi9weG0ycG5nLmFwcCAtLWFyZ3MgI3t0bXBQWE19XCIsIChlcnIpID0+XG4gICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcImNhbid0IGNvbnZlcnQgcHhtIGltYWdlICN7dG1wUFhNfSB0byAje3RtcFBOR306ICN7ZXJyfVwiIGlmIGVycj9cbiAgICAgICAgICAgICAgICBsb2FkRGVsYXllZCA9ID0+IEBsb2FkSW1hZ2Ugcm93LCB0bXBQTkdcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0IGxvYWREZWxheWVkLCAzMDBcblxuICAgIGNvbnZlcnRJbWFnZTogKHJvdykgLT5cbiAgICAgICAgXG4gICAgICAgIGl0ZW0gICA9IHJvdy5pdGVtXG4gICAgICAgIGZpbGUgICA9IGl0ZW0uZmlsZVxuICAgICAgICB0bXBJbWcgPSBzbGFzaC5qb2luIG9zLnRtcGRpcigpLCBcImtvLSN7c2xhc2guYmFzZW5hbWUgZmlsZX0ucG5nXCJcbiAgICAgICAgXG4gICAgICAgIGNoaWxkcC5leGVjIFwiL3Vzci9iaW4vc2lwcyAtcyBmb3JtYXQgcG5nIFxcXCIje2ZpbGV9XFxcIiAtLW91dCBcXFwiI3t0bXBJbWd9XFxcIlwiLCAoZXJyKSA9PlxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcImNhbid0IGNvbnZlcnQgaW1hZ2UgI3tmaWxlfTogI3tlcnJ9XCIgaWYgZXJyP1xuICAgICAgICAgICAgQGxvYWRJbWFnZSByb3csIHRtcEltZ1xuXG4gICAgbG9hZEltYWdlOiAocm93LCBmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCByb3cuaXNBY3RpdmUoKVxuXG4gICAgICAgIGNvbCA9IEBlbXB0eUNvbHVtbiBvcHQ/LmNvbHVtblxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2wuaW5kZXhcbiAgICAgICAgY250ID0gZWxlbSBjbGFzczonYnJvd3NlckltYWdlQ29udGFpbmVyJyBjaGlsZDogXG4gICAgICAgICAgICBlbGVtICdpbWcnIGNsYXNzOidicm93c2VySW1hZ2UnIHNyYzpzbGFzaC5maWxlVXJsIGZpbGVcbiAgICAgICAgY29sLnRhYmxlLmFwcGVuZENoaWxkIGNudFxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQnJvd3NlclxuIl19
//# sourceURL=../../coffee/browser/browser.coffee