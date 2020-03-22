// koffee 1.12.0

/*
 0000000   0000000   000      000   000  00     00  000   000
000       000   000  000      000   000  000   000  0000  000
000       000   000  000      000   000  000000000  000 0 000
000       000   000  000      000   000  000 0 000  000  0000
 0000000   0000000   0000000   0000000   000   000  000   000
 */
var $, Column, Crumb, DirWatch, File, Row, Scroller, _, clamp, drag, electron, elem, empty, fs, fuzzy, kerror, keyinfo, klog, kpos, open, popup, post, prefs, ref, setStyle, slash, stopEvent, valid, wxw,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), $ = ref.$, _ = ref._, clamp = ref.clamp, drag = ref.drag, elem = ref.elem, empty = ref.empty, fs = ref.fs, kerror = ref.kerror, keyinfo = ref.keyinfo, klog = ref.klog, kpos = ref.kpos, open = ref.open, popup = ref.popup, post = ref.post, prefs = ref.prefs, setStyle = ref.setStyle, slash = ref.slash, stopEvent = ref.stopEvent, valid = ref.valid;

Row = require('./row');

Crumb = require('./crumb');

Scroller = require('./scroller');

DirWatch = require('../tools/dirwatch');

File = require('../tools/file');

fuzzy = require('fuzzy');

wxw = require('wxw');

electron = require('electron');

Column = (function() {
    function Column(browser) {
        var ref1, ref2;
        this.browser = browser;
        this.onKeyUp = bind(this.onKeyUp, this);
        this.onKey = bind(this.onKey, this);
        this.showContextMenu = bind(this.showContextMenu, this);
        this.onContextMenu = bind(this.onContextMenu, this);
        this.makeRoot = bind(this.makeRoot, this);
        this.open = bind(this.open, this);
        this.explorer = bind(this.explorer, this);
        this.duplicateFile = bind(this.duplicateFile, this);
        this.newFolder = bind(this.newFolder, this);
        this.addToShelf = bind(this.addToShelf, this);
        this.moveToTrash = bind(this.moveToTrash, this);
        this.toggleExtensions = bind(this.toggleExtensions, this);
        this.toggleDotFiles = bind(this.toggleDotFiles, this);
        this.sortByDateAdded = bind(this.sortByDateAdded, this);
        this.sortByType = bind(this.sortByType, this);
        this.sortByName = bind(this.sortByName, this);
        this.removeObject = bind(this.removeObject, this);
        this.clearSearch = bind(this.clearSearch, this);
        this.onDblClick = bind(this.onDblClick, this);
        this.onMouseOut = bind(this.onMouseOut, this);
        this.onMouseOver = bind(this.onMouseOver, this);
        this.onBlur = bind(this.onBlur, this);
        this.onFocus = bind(this.onFocus, this);
        this.insertFile = bind(this.insertFile, this);
        this.removeFile = bind(this.removeFile, this);
        this.onDragStop = bind(this.onDragStop, this);
        this.onDragMove = bind(this.onDragMove, this);
        this.onDragStart = bind(this.onDragStart, this);
        this.searchTimer = null;
        this.search = '';
        this.items = [];
        this.rows = [];
        this.div = elem({
            "class": 'browserColumn',
            tabIndex: 6,
            id: this.name()
        });
        this.content = elem({
            "class": 'browserColumnContent',
            parent: this.div
        });
        this.table = elem({
            "class": 'browserColumnTable',
            parent: this.content
        });
        if ((ref1 = this.browser.cols) != null) {
            ref1.appendChild(this.div);
        }
        this.div.addEventListener('focus', this.onFocus);
        this.div.addEventListener('blur', this.onBlur);
        this.div.addEventListener('keydown', this.onKey);
        this.div.addEventListener('keyup', this.onKeyUp);
        this.div.addEventListener('mouseover', this.onMouseOver);
        this.div.addEventListener('mouseout', this.onMouseOut);
        this.div.addEventListener('dblclick', this.onDblClick);
        this.div.addEventListener('contextmenu', this.onContextMenu);
        this.drag = new drag({
            target: this.div,
            onStart: this.onDragStart,
            onMove: this.onDragMove,
            onStop: this.onDragStop
        });
        this.crumb = new Crumb(this);
        this.scroll = new Scroller(this, this.content);
        this.setIndex((ref2 = this.browser.columns) != null ? ref2.length : void 0);
    }

    Column.prototype.loadItems = function(items, parent) {
        var dir, i, item, len, ref1, ref2, ref3, ref4, updir;
        this.clear();
        this.parent = parent;
        if (this.index === 0 || this.index - 1 < this.browser.numCols() && ((ref1 = this.browser.columns[this.index - 1].activeRow()) != null ? ref1.item.name : void 0) === '..' && !slash.isRoot(this.parent.file)) {
            if ((ref2 = (ref3 = items[0]) != null ? ref3.name : void 0) !== '..' && ref2 !== '/') {
                dir = this.parent.file;
                updir = slash.dir(dir);
                if (updir !== dir) {
                    items.unshift({
                        name: '..',
                        type: 'dir',
                        file: updir
                    });
                }
            }
        }
        this.items = items;
        this.div.classList.remove('browserColumnCode');
        this.crumb.show();
        if (this.parent.type === 'dir') {
            DirWatch.watch(this.parent.file);
            this.crumb.setFile(this.parent.file);
        } else {
            if (File.isCode(this.parent.file)) {
                this.crumb.setFile(this.parent.file);
                this.div.classList.add('browserColumnCode');
            }
        }
        if (this.parent.type === void 0) {
            klog('undefined parent type?');
            this.parent.type = slash.isDir(this.parent.file) && 'dir' || 'file';
        }
        if (this.parent == null) {
            kerror("no parent item?");
        }
        if (this.parent.type == null) {
            kerror("loadItems -- no parent type?", this.parent);
        }
        if (valid(this.items)) {
            ref4 = this.items;
            for (i = 0, len = ref4.length; i < len; i++) {
                item = ref4[i];
                this.rows.push(new Row(this, item));
            }
            this.scroll.update();
        }
        if (this.parent.type === 'dir' && slash.samePath('~/Downloads', this.parent.file)) {
            this.sortByDateAdded();
        }
        return this;
    };

    Column.prototype.updateDragIndicator = function(event) {
        var ref1, ref2;
        if ((ref1 = this.dragInd) != null) {
            ref1.classList.toggle('copy', event.shiftKey);
        }
        return (ref2 = this.dragInd) != null ? ref2.classList.toggle('move', event.ctrlKey || event.metaKey || event.altKey) : void 0;
    };

    Column.prototype.onDragStart = function(d, e) {
        var ref1;
        this.dragStartRow = this.row(e.target);
        delete this.toggle;
        if (this.dragStartRow) {
            if (e.shiftKey) {
                return this.browser.select.to(this.dragStartRow);
            } else if (e.metaKey || e.altKey || e.ctrlKey) {
                if (!this.dragStartRow.isSelected()) {
                    return this.browser.select.toggle(this.dragStartRow);
                } else {
                    return this.toggle = true;
                }
            } else {
                if (this.dragStartRow.isSelected()) {
                    return this.deselect = true;
                } else {
                    if ((ref1 = this.activeRow()) != null) {
                        ref1.clearActive();
                    }
                    return this.browser.select.row(this.dragStartRow, false);
                }
            }
        } else {
            if (this.hasFocus() && this.activeRow()) {
                return this.browser.select.row(this.activeRow());
            }
        }
    };

    Column.prototype.onDragMove = function(d, e) {
        var i, len, onSpringLoadTimeout, pos, ref1, row, rowClone;
        if (this.dragStartRow && !this.dragDiv && valid(this.browser.select.files())) {
            if (Math.abs(d.deltaSum.x) < 20 && Math.abs(d.deltaSum.y) < 10) {
                return;
            }
            delete this.toggle;
            delete this.deselect;
            this.dragDiv = elem('div');
            this.dragDiv.drag = d;
            this.dragDiv.files = this.browser.select.files();
            pos = kpos(e.pageX, e.pageY);
            row = this.browser.select.rows[0];
            this.dragDiv.style.position = 'absolute';
            this.dragDiv.style.opacity = "0.7";
            this.dragDiv.style.top = (pos.y - d.deltaSum.y) + "px";
            this.dragDiv.style.left = (pos.x - d.deltaSum.x) + "px";
            this.dragDiv.style.width = (this.width() - 12) + "px";
            this.dragDiv.style.pointerEvents = 'none';
            this.dragInd = elem({
                "class": 'dragIndicator'
            });
            this.dragDiv.appendChild(this.dragInd);
            ref1 = this.browser.select.rows;
            for (i = 0, len = ref1.length; i < len; i++) {
                row = ref1[i];
                rowClone = row.div.cloneNode(true);
                rowClone.style.flex = 'unset';
                rowClone.style.pointerEvents = 'none';
                rowClone.style.border = 'none';
                rowClone.style.marginBottom = '-1px';
                this.dragDiv.appendChild(rowClone);
            }
            document.body.appendChild(this.dragDiv);
            this.focus({
                activate: false
            });
        }
        if (this.dragDiv) {
            onSpringLoadTimeout = (function(_this) {
                return function() {
                    var column;
                    if (column = _this.browser.columnForFile(_this.browser.springLoadTarget)) {
                        if (row = column.row(_this.browser.springLoadTarget)) {
                            return row.activate();
                        }
                    }
                };
            })(this);
            clearTimeout(this.browser.springLoadTimer);
            delete this.browser.springLoadTarget;
            if (row = this.browser.rowAtPos(d.pos)) {
                if (row.item.type === 'dir') {
                    this.browser.springLoadTimer = setTimeout(onSpringLoadTimeout, 1000);
                    this.browser.springLoadTarget = row.item.file;
                }
            }
            this.updateDragIndicator(e);
            return this.dragDiv.style.transform = "translateX(" + d.deltaSum.x + "px) translateY(" + d.deltaSum.y + "px)";
        }
    };

    Column.prototype.onDragStop = function(d, e) {
        var action, column, files, ref1, ref2, row, target;
        clearTimeout(this.browser.springLoadTimer);
        delete this.browser.springLoadTarget;
        if (this.dragDiv != null) {
            this.dragDiv.remove();
            files = this.dragDiv.files;
            delete this.dragDiv;
            delete this.dragStartRow;
            if (row = this.browser.rowAtPos(d.pos)) {
                column = row.column;
                target = row.item.file;
            } else if (column = this.browser.columnAtPos(d.pos)) {
                target = (ref1 = column.parent) != null ? ref1.file : void 0;
            } else {
                klog('no drop target');
                return;
            }
            action = e.shiftKey && 'copy' || 'move';
            if (column === this.browser.shelf) {
                if (target && (e.ctrlKey || e.shiftKey || e.metaKey || e.altKey)) {
                    return this.browser.dropAction(action, files, target);
                } else {
                    return this.browser.shelf.addFiles(files, {
                        pos: d.pos
                    });
                }
            } else {
                return this.browser.dropAction(action, files, target);
            }
        } else {
            if (row = this.row(e.target)) {
                if (row.isSelected()) {
                    if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) {
                        if (this.toggle) {
                            delete this.toggle;
                            return this.browser.select.toggle(row);
                        }
                    } else {
                        if (this.deselect) {
                            delete this.deselect;
                            return this.browser.select.row(row);
                        } else {
                            return row.activate();
                        }
                    }
                }
            } else {
                return (ref2 = this.activeRow()) != null ? ref2.clearActive() : void 0;
            }
        }
    };

    Column.prototype.removeFile = function(file) {
        var row;
        if (row = this.row(slash.file(file))) {
            this.removeRow(row);
            return this.scroll.update();
        }
    };

    Column.prototype.insertFile = function(file) {
        var item, row;
        item = this.browser.fileItem(file);
        row = new Row(this, item);
        this.rows.push(row);
        return row;
    };

    Column.prototype.unshiftItem = function(item) {
        this.items.unshift(item);
        this.rows.unshift(new Row(this, item));
        this.table.insertBefore(this.table.lastChild, this.table.firstChild);
        this.scroll.update();
        return this.rows[0];
    };

    Column.prototype.pushItem = function(item) {
        this.items.push(item);
        this.rows.push(new Row(this, item));
        this.scroll.update();
        return this.rows.slice(-1)[0];
    };

    Column.prototype.addItem = function(item) {
        var row;
        row = this.pushItem(item);
        this.sortByName();
        return row;
    };

    Column.prototype.setItems = function(items1, opt) {
        var i, item, len, ref1;
        this.items = items1;
        this.browser.clearColumn(this.index);
        this.parent = opt.parent;
        if (this.parent == null) {
            kerror("no parent item?");
        }
        if (this.parent.type == null) {
            kerror("setItems -- no parent type?", this.parent);
        }
        ref1 = this.items;
        for (i = 0, len = ref1.length; i < len; i++) {
            item = ref1[i];
            this.rows.push(new Row(this, item));
        }
        this.scroll.update();
        return this;
    };

    Column.prototype.isDir = function() {
        var ref1;
        return ((ref1 = this.parent) != null ? ref1.type : void 0) === 'dir';
    };

    Column.prototype.isFile = function() {
        var ref1;
        return ((ref1 = this.parent) != null ? ref1.type : void 0) === 'file';
    };

    Column.prototype.isEmpty = function() {
        return empty(this.parent);
    };

    Column.prototype.clear = function() {
        var ref1, ref2;
        if (((ref1 = this.parent) != null ? ref1.file : void 0) && ((ref2 = this.parent) != null ? ref2.type : void 0) === 'dir') {
            DirWatch.unwatch(this.parent.file);
        }
        delete this.parent;
        this.clearSearch();
        this.div.scrollTop = 0;
        this.table.innerHTML = '';
        this.crumb.clear();
        this.rows = [];
        return this.scroll.update();
    };

    Column.prototype.setIndex = function(index1) {
        var ref1;
        this.index = index1;
        return (ref1 = this.crumb) != null ? ref1.elem.columnIndex = this.index : void 0;
    };

    Column.prototype.width = function() {
        return this.div.getBoundingClientRect().width;
    };

    Column.prototype.activateRow = function(row) {
        var ref1;
        return (ref1 = this.row(row)) != null ? ref1.activate() : void 0;
    };

    Column.prototype.activeRow = function() {
        return _.find(this.rows, function(r) {
            return r.isActive();
        });
    };

    Column.prototype.activePath = function() {
        var ref1, ref2;
        return (ref1 = (ref2 = this.activeRow()) != null ? ref2.path() : void 0) != null ? ref1 : this.parent.file;
    };

    Column.prototype.row = function(row) {
        if (Number.isInteger(row)) {
            return (0 <= row && row < this.numRows()) && this.rows[row] || null;
        } else if (typeof row === 'string') {
            return _.find(this.rows, function(r) {
                return r.item.name === row || r.item.file === row;
            });
        } else if (row instanceof HTMLElement) {
            return _.find(this.rows, function(r) {
                return r.div.contains(row);
            });
        } else {
            return row;
        }
    };

    Column.prototype.nextColumn = function() {
        return this.browser.column(this.index + 1);
    };

    Column.prototype.prevColumn = function() {
        return this.browser.column(this.index - 1);
    };

    Column.prototype.name = function() {
        return this.browser.name + ":" + this.index;
    };

    Column.prototype.path = function() {
        var ref1, ref2;
        return (ref1 = (ref2 = this.parent) != null ? ref2.file : void 0) != null ? ref1 : '';
    };

    Column.prototype.numRows = function() {
        var ref1;
        return (ref1 = this.rows.length) != null ? ref1 : 0;
    };

    Column.prototype.rowHeight = function() {
        var ref1, ref2;
        return (ref1 = (ref2 = this.rows[0]) != null ? ref2.div.clientHeight : void 0) != null ? ref1 : 0;
    };

    Column.prototype.numVisible = function() {
        return this.rowHeight() && parseInt(this.browser.height() / this.rowHeight()) || 0;
    };

    Column.prototype.rowAtPos = function(pos) {
        return this.row(this.rowIndexAtPos(pos));
    };

    Column.prototype.rowIndexAtPos = function(pos) {
        var dy;
        dy = pos.y - this.content.getBoundingClientRect().top;
        if (dy >= 0) {
            return Math.floor(dy / this.rowHeight());
        } else {
            return -1;
        }
    };

    Column.prototype.hasFocus = function() {
        return this.div.classList.contains('focus');
    };

    Column.prototype.focus = function(opt) {
        if (opt == null) {
            opt = {};
        }
        if (!this.activeRow() && this.numRows() && (opt != null ? opt.activate : void 0) !== false) {
            this.rows[0].setActive();
        }
        this.div.focus();
        this.div.classList.add('focus');
        window.setLastFocus(this.name());
        return this;
    };

    Column.prototype.onFocus = function() {
        return this.div.classList.add('focus');
    };

    Column.prototype.onBlur = function() {
        return this.div.classList.remove('focus');
    };

    Column.prototype.focusBrowser = function() {
        return this.browser.focus();
    };

    Column.prototype.onMouseOver = function(event) {
        var ref1;
        return (ref1 = this.row(event.target)) != null ? typeof ref1.onMouseOver === "function" ? ref1.onMouseOver() : void 0 : void 0;
    };

    Column.prototype.onMouseOut = function(event) {
        var ref1;
        return (ref1 = this.row(event.target)) != null ? typeof ref1.onMouseOut === "function" ? ref1.onMouseOut() : void 0 : void 0;
    };

    Column.prototype.onDblClick = function(event) {
        var item, ref1;
        this.browser.skipOnDblClick = true;
        item = (ref1 = this.activeRow()) != null ? ref1.item : void 0;
        if (item.type === 'dir') {
            this.browser.clearColumnsFrom(1, {
                pop: true
            });
            return this.browser.loadDirItem(item, 0, {
                activate: false
            });
        } else {
            return editor.focus();
        }
    };

    Column.prototype.extendSelection = function(key) {
        var index, ref1, ref2, toIndex;
        if (!this.numRows()) {
            return console.error("no rows in column " + this.index + "?");
        }
        index = (ref1 = (ref2 = this.activeRow()) != null ? ref2.index() : void 0) != null ? ref1 : -1;
        if ((index == null) || Number.isNaN(index)) {
            console.error("no index from activeRow? " + index + "?", this.activeRow());
        }
        toIndex = (function() {
            switch (key) {
                case 'up':
                    return index - 1;
                case 'down':
                    return index + 1;
                case 'home':
                    return 0;
                case 'end':
                    return this.numRows() - 1;
                case 'page up':
                    return Math.max(0, index - this.numVisible());
                case 'page down':
                    return Math.min(this.numRows() - 1, index + this.numVisible());
                default:
                    return index;
            }
        }).call(this);
        return this.browser.select.to(this.row(toIndex), true);
    };

    Column.prototype.navigateRows = function(key) {
        var index, newIndex, ref1, ref2;
        if (!this.numRows()) {
            return console.error("no rows in column " + this.index + "?");
        }
        index = (ref1 = (ref2 = this.activeRow()) != null ? ref2.index() : void 0) != null ? ref1 : -1;
        if ((index == null) || Number.isNaN(index)) {
            console.error("no index from activeRow? " + index + "?", this.activeRow());
        }
        newIndex = (function() {
            switch (key) {
                case 'up':
                    return index - 1;
                case 'down':
                    return index + 1;
                case 'home':
                    return 0;
                case 'end':
                    return this.numRows() - 1;
                case 'page up':
                    return index - this.numVisible();
                case 'page down':
                    return index + this.numVisible();
                default:
                    return index;
            }
        }).call(this);
        if ((newIndex == null) || Number.isNaN(newIndex)) {
            console.error("no index " + newIndex + "? " + (this.numVisible()));
        }
        newIndex = clamp(0, this.numRows() - 1, newIndex);
        if (newIndex !== index) {
            return this.rows[newIndex].activate(null, this.parent.type === 'file');
        }
    };

    Column.prototype.navigateCols = function(key) {
        var item, ref1, type;
        switch (key) {
            case 'up':
                this.browser.navigate('up');
                break;
            case 'left':
                this.browser.navigate('left');
                break;
            case 'right':
                this.browser.navigate('right');
                break;
            case 'enter':
                if (item = (ref1 = this.activeRow()) != null ? ref1.item : void 0) {
                    type = item.type;
                    if (type === 'dir') {
                        this.browser.loadItem(item);
                    } else if (item.file) {
                        post.emit('jumpTo', item);
                        post.emit('focus', 'editor');
                    }
                }
        }
        return this;
    };

    Column.prototype.navigateRoot = function(key) {
        this.browser.browse((function() {
            switch (key) {
                case 'left':
                    return slash.dir(this.parent.file);
                case 'right':
                    return this.activeRow().item.file;
            }
        }).call(this));
        return this;
    };

    Column.prototype.doSearch = function(char) {
        if (!this.numRows()) {
            return;
        }
        if (!this.searchDiv) {
            this.searchDiv = elem({
                "class": 'browserSearch'
            });
        }
        return this.setSearch(this.search + char);
    };

    Column.prototype.backspaceSearch = function() {
        if (this.searchDiv && this.search.length) {
            return this.setSearch(this.search.slice(0, this.search.length - 1));
        }
    };

    Column.prototype.setSearch = function(search) {
        var activeIndex, fuzzied, i, len, ref1, ref2, ref3, row, rows;
        this.search = search;
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(this.clearSearch, 2000);
        this.searchDiv.textContent = this.search;
        activeIndex = (ref1 = (ref2 = this.activeRow()) != null ? ref2.index() : void 0) != null ? ref1 : 0;
        if (this.search.length === 1) {
            activeIndex += 1;
        }
        if (activeIndex >= this.numRows()) {
            activeIndex = 0;
        }
        ref3 = [this.rows.slice(activeIndex), this.rows.slice(0, activeIndex + 1)];
        for (i = 0, len = ref3.length; i < len; i++) {
            rows = ref3[i];
            fuzzied = fuzzy.filter(this.search, rows, {
                extract: function(r) {
                    return r.item.name;
                }
            });
            if (fuzzied.length) {
                row = fuzzied[0].original;
                row.div.appendChild(this.searchDiv);
                row.activate();
                break;
            }
        }
        return this;
    };

    Column.prototype.clearSearch = function() {
        var ref1;
        this.search = '';
        if ((ref1 = this.searchDiv) != null) {
            ref1.remove();
        }
        delete this.searchDiv;
        return this;
    };

    Column.prototype.removeObject = function() {
        var nextOrPrev, ref1, row;
        if (row = this.activeRow()) {
            nextOrPrev = (ref1 = row.next()) != null ? ref1 : row.prev();
            this.removeRow(row);
            if (nextOrPrev != null) {
                nextOrPrev.activate();
            }
        }
        return this;
    };

    Column.prototype.removeRow = function(row) {
        var ref1, ref2, ref3;
        if (row === this.activeRow()) {
            if (((ref1 = this.nextColumn()) != null ? (ref2 = ref1.parent) != null ? ref2.file : void 0 : void 0) === ((ref3 = row.item) != null ? ref3.file : void 0)) {
                this.browser.clearColumnsFrom(this.index + 1);
            }
        }
        row.div.remove();
        this.items.splice(row.index(), 1);
        return this.rows.splice(row.index(), 1);
    };

    Column.prototype.sortByName = function() {
        var i, len, ref1, row;
        this.rows.sort(function(a, b) {
            return (a.item.type + a.item.name).localeCompare(b.item.type + b.item.name);
        });
        this.table.innerHTML = '';
        ref1 = this.rows;
        for (i = 0, len = ref1.length; i < len; i++) {
            row = ref1[i];
            this.table.appendChild(row.div);
        }
        return this;
    };

    Column.prototype.sortByType = function() {
        var i, len, ref1, row;
        this.rows.sort(function(a, b) {
            var atype, btype;
            atype = a.item.type === 'file' && slash.ext(a.item.name) || '___';
            btype = b.item.type === 'file' && slash.ext(b.item.name) || '___';
            return (a.item.type + atype + a.item.name).localeCompare(b.item.type + btype + b.item.name, void 0, {
                numeric: true
            });
        });
        this.table.innerHTML = '';
        ref1 = this.rows;
        for (i = 0, len = ref1.length; i < len; i++) {
            row = ref1[i];
            this.table.appendChild(row.div);
        }
        return this;
    };

    Column.prototype.sortByDateAdded = function() {
        var i, len, ref1, row;
        this.rows.sort(function(a, b) {
            var ref1, ref2;
            return ((ref1 = b.item.stat) != null ? ref1.atimeMs : void 0) - ((ref2 = a.item.stat) != null ? ref2.atimeMs : void 0);
        });
        this.table.innerHTML = '';
        ref1 = this.rows;
        for (i = 0, len = ref1.length; i < len; i++) {
            row = ref1[i];
            this.table.appendChild(row.div);
        }
        return this;
    };

    Column.prototype.toggleDotFiles = function() {
        var stateKey;
        if (this.parent.type === void 0) {
            this.parent.type = slash.isDir(this.parent.file) && 'dir' || 'file';
        }
        if (this.parent.type === 'dir') {
            stateKey = "browser▸showHidden▸" + this.parent.file;
            klog('toggleDotFiles', stateKey);
            if (prefs.get(stateKey)) {
                prefs.del(stateKey);
            } else {
                prefs.set(stateKey, true);
            }
            this.browser.loadDirItem(this.parent, this.index, {
                ignoreCache: true
            });
        }
        return this;
    };

    Column.prototype.toggleExtensions = function() {
        var stateKey;
        stateKey = "browser|hideExtensions";
        window.state.set(stateKey, !window.state.get(stateKey, false));
        setStyle('.browserRow .ext', 'display', window.state.get(stateKey) && 'none' || 'initial');
        return this;
    };

    Column.prototype.moveToTrash = function() {
        var i, index, len, ref1, row, selectRow;
        index = this.browser.select.freeIndex();
        if (index >= 0) {
            selectRow = this.row(index);
        }
        ref1 = this.browser.select.rows;
        for (i = 0, len = ref1.length; i < len; i++) {
            row = ref1[i];
            wxw('trash', row.path());
            this.removeRow(row);
        }
        if (selectRow) {
            return this.browser.select.row(selectRow);
        } else {
            return this.navigateCols('left');
        }
    };

    Column.prototype.addToShelf = function() {
        var pathToShelf;
        if (pathToShelf = this.activePath()) {
            return post.emit('addToShelf', pathToShelf);
        }
    };

    Column.prototype.newFolder = function() {
        return slash.unused(slash.join(this.path(), 'New folder'), (function(_this) {
            return function(newDir) {
                return fs.mkdir(newDir, function(err) {
                    var row;
                    if (empty(err)) {
                        row = _this.insertFile(newDir);
                        _this.browser.select.row(row);
                        return row.editName();
                    }
                });
            };
        })(this));
    };

    Column.prototype.duplicateFile = function() {
        var file, i, len, ref1, results;
        ref1 = this.browser.select.files();
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            file = ref1[i];
            results.push(File.duplicate(file, (function(_this) {
                return function(source, target) {
                    var col, row;
                    if (_this.parent.type === 'file') {
                        col = _this.prevColumn();
                        col.focus();
                    } else {
                        col = _this;
                    }
                    row = col.insertFile(target);
                    return _this.browser.select.row(row);
                };
            })(this)));
        }
        return results;
    };

    Column.prototype.explorer = function() {
        return open(slash.dir(this.activePath()));
    };

    Column.prototype.open = function() {
        return open(this.activePath());
    };

    Column.prototype.updateGitFiles = function(files) {
        var file, i, len, ref1, ref2, ref3, row, status;
        ref1 = this.rows;
        for (i = 0, len = ref1.length; i < len; i++) {
            row = ref1[i];
            if ((ref2 = row.item.type) !== 'dir' && ref2 !== 'file') {
                return;
            }
            status = files[row.item.file];
            if ((ref3 = $('.browserStatusIcon', row.div)) != null) {
                ref3.remove();
            }
            if (status != null) {
                row.div.appendChild(elem('span', {
                    "class": "git-" + status + "-icon browserStatusIcon"
                }));
            } else if (row.item.type === 'dir') {
                for (file in files) {
                    status = files[file];
                    if (row.item.name !== '..' && file.startsWith(row.item.file)) {
                        row.div.appendChild(elem('span', {
                            "class": "git-dirs-icon browserStatusIcon"
                        }));
                        break;
                    }
                }
            }
        }
    };

    Column.prototype.makeRoot = function() {
        this.browser.shiftColumnsTo(this.index);
        if (this.browser.columns[0].items[0].name !== '..') {
            this.unshiftItem({
                name: '..',
                type: 'dir',
                file: slash.dir(this.parent.file)
            });
        }
        return this.crumb.setFile(this.parent.file);
    };

    Column.prototype.onContextMenu = function(event, column) {
        var absPos, opt;
        stopEvent(event);
        absPos = kpos(event);
        if (!column) {
            return this.showContextMenu(absPos);
        } else {
            opt = {
                items: [
                    {
                        text: 'Root',
                        cb: this.makeRoot
                    }, {
                        text: 'Add to Shelf',
                        combo: 'alt+shift+.',
                        cb: (function(_this) {
                            return function() {
                                return post.emit('addToShelf', _this.parent.file);
                            };
                        })(this)
                    }, {
                        text: 'Explorer',
                        combo: 'alt+e',
                        cb: (function(_this) {
                            return function() {
                                return open(_this.parent.file);
                            };
                        })(this)
                    }
                ]
            };
            opt.x = absPos.x;
            opt.y = absPos.y;
            return popup.menu(opt);
        }
    };

    Column.prototype.showContextMenu = function(absPos) {
        var opt;
        if (absPos == null) {
            absPos = kpos(this.div.getBoundingClientRect().left, this.div.getBoundingClientRect().top);
        }
        opt = {
            items: [
                {
                    text: 'Toggle Invisible',
                    combo: 'ctrl+i',
                    cb: this.toggleDotFiles
                }, {
                    text: 'Toggle Extensions',
                    combo: 'ctrl+e',
                    cb: this.toggleExtensions
                }, {
                    text: ''
                }, {
                    text: 'Explorer',
                    combo: 'alt+e',
                    cb: this.explorer
                }, {
                    text: ''
                }, {
                    text: 'Add to Shelf',
                    combo: 'alt+shift+.',
                    cb: this.addToShelf
                }, {
                    text: ''
                }, {
                    text: 'Move to Trash',
                    combo: 'ctrl+backspace',
                    cb: this.moveToTrash
                }, {
                    text: '',
                    hide: this.parent.type === 'file'
                }, {
                    text: 'Duplicate',
                    combo: 'ctrl+d',
                    cb: this.duplicateFile,
                    hide: this.parent.type === 'file'
                }, {
                    text: 'New Folder',
                    combo: 'alt+n',
                    cb: this.newFolder,
                    hide: this.parent.type === 'file'
                }
            ]
        };
        if (this.parent.type !== 'file') {
            opt.items = opt.items.concat([
                {
                    text: ''
                }, {
                    text: 'Sort',
                    menu: [
                        {
                            text: 'By Name',
                            combo: 'ctrl+n',
                            cb: this.sortByName
                        }, {
                            text: 'By Type',
                            combo: 'ctrl+t',
                            cb: this.sortByType
                        }, {
                            text: 'By Date',
                            combo: 'ctrl+a',
                            cb: this.sortByDateAdded
                        }
                    ]
                }
            ]);
        }
        opt.x = absPos.x;
        opt.y = absPos.y;
        return popup.menu(opt);
    };

    Column.prototype.copyPaths = function() {
        var paths;
        paths = this.browser.select.files().join('\n');
        electron.clipboard.writeText(paths);
        return paths;
    };

    Column.prototype.cutPaths = function() {
        return this.browser.cutPaths = this.copyPaths();
    };

    Column.prototype.pastePaths = function() {
        var action, paths, ref1, target, text;
        text = electron.clipboard.readText();
        paths = text.split('\n');
        if (text === this.browser.cutPaths) {
            action = 'move';
        } else {
            action = 'copy';
        }
        target = this.parent.file;
        if (((ref1 = this.activeRow()) != null ? ref1.item.type : void 0) === 'dir') {
            target = this.activeRow().item.file;
        }
        return this.browser.dropAction(action, paths, target);
    };

    Column.prototype.onKey = function(event) {
        var char, combo, key, mod, ref1, ref2;
        ref1 = keyinfo.forEvent(event), mod = ref1.mod, key = ref1.key, combo = ref1.combo, char = ref1.char;
        switch (combo) {
            case 'shift+`':
            case '~':
                return stopEvent(event, this.browser.browse('~'));
            case '/':
                return stopEvent(event, this.browser.browse('/'));
            case 'backspace':
                return stopEvent(event, this.browser.onBackspaceInColumn(this));
            case 'delete':
                return stopEvent(event, this.browser.onDeleteInColumn(this));
            case 'alt+left':
                return stopEvent(event, window.split.focus('shelf'));
            case 'alt+shift+.':
                return stopEvent(event, this.addToShelf());
            case 'alt+e':
                return stopEvent(event, this.explorer());
            case 'alt+n':
                return stopEvent(event, this.newFolder());
            case 'ctrl+x':
            case 'command+x':
                return stopEvent(event, this.cutPaths());
            case 'ctrl+c':
            case 'command+c':
                return stopEvent(event, this.copyPaths());
            case 'ctrl+v':
            case 'command+v':
                return stopEvent(event, this.pastePaths());
            case 'page up':
            case 'page down':
            case 'home':
            case 'end':
                return stopEvent(event, this.navigateRows(key));
            case 'enter':
            case 'alt+up':
                return stopEvent(event, this.navigateCols(key));
            case 'command+up':
            case 'ctrl+up':
                return stopEvent(event, this.navigateRows('home'));
            case 'command+down':
            case 'ctrl+down':
                return stopEvent(event, this.navigateRows('end'));
            case 'ctrl+t':
                return stopEvent(event, this.sortByType());
            case 'ctrl+n':
                return stopEvent(event, this.sortByName());
            case 'ctrl+a':
                return stopEvent(event, this.sortByDateAdded());
            case 'command+i':
            case 'ctrl+i':
                return stopEvent(event, this.toggleDotFiles());
            case 'command+d':
            case 'ctrl+d':
                return stopEvent(event, this.duplicateFile());
            case 'command+k':
            case 'ctrl+k':
                if (this.browser.cleanUp()) {
                    return stopEvent(event);
                }
                break;
            case 'f2':
                return stopEvent(event, (ref2 = this.activeRow()) != null ? ref2.editName() : void 0);
            case 'shift+up':
            case 'shift+down':
            case 'shift+home':
            case 'shift+end':
            case 'shift+page up':
            case 'shift+page down':
                return stopEvent(event, this.extendSelection(key));
            case 'command+left':
            case 'command+right':
            case 'ctrl+left':
            case 'ctrl+right':
                return stopEvent(event, this.navigateRoot(key));
            case 'command+backspace':
            case 'ctrl+backspace':
            case 'command+delete':
            case 'ctrl+delete':
                return stopEvent(event, this.moveToTrash());
            case 'tab':
                if (this.search.length) {
                    this.doSearch('');
                }
                return stopEvent(event);
            case 'esc':
                if (this.dragDiv) {
                    this.dragDiv.drag.dragStop();
                    this.dragDiv.remove();
                    delete this.dragDiv;
                } else if (this.browser.select.files().length > 1) {
                    this.browser.select.row(this.activeRow());
                } else if (this.search.length) {
                    this.clearSearch();
                }
                return stopEvent(event);
        }
        if (combo === 'up' || combo === 'down') {
            return stopEvent(event, this.navigateRows(key));
        }
        if (combo === 'left' || combo === 'right') {
            return stopEvent(event, this.navigateCols(key));
        }
        if ((mod === 'shift' || mod === '') && char) {
            this.doSearch(char);
        }
        if (this.dragDiv) {
            return this.updateDragIndicator(event);
        }
    };

    Column.prototype.onKeyUp = function(event) {
        if (this.dragDiv) {
            return this.updateDragIndicator(event);
        }
    };

    return Column;

})();

module.exports = Column;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sdW1uLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9icm93c2VyIiwic291cmNlcyI6WyJjb2x1bW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHFNQUFBO0lBQUE7O0FBUUEsTUFBbUksT0FBQSxDQUFRLEtBQVIsQ0FBbkksRUFBRSxTQUFGLEVBQUssU0FBTCxFQUFRLGlCQUFSLEVBQWUsZUFBZixFQUFxQixlQUFyQixFQUEyQixpQkFBM0IsRUFBa0MsV0FBbEMsRUFBc0MsbUJBQXRDLEVBQThDLHFCQUE5QyxFQUF1RCxlQUF2RCxFQUE2RCxlQUE3RCxFQUFtRSxlQUFuRSxFQUF5RSxpQkFBekUsRUFBZ0YsZUFBaEYsRUFBc0YsaUJBQXRGLEVBQTZGLHVCQUE3RixFQUF1RyxpQkFBdkcsRUFBOEcseUJBQTlHLEVBQXlIOztBQUV6SCxHQUFBLEdBQVcsT0FBQSxDQUFRLE9BQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxTQUFSOztBQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFDWCxRQUFBLEdBQVcsT0FBQSxDQUFRLG1CQUFSOztBQUNYLElBQUEsR0FBVyxPQUFBLENBQVEsZUFBUjs7QUFDWCxLQUFBLEdBQVcsT0FBQSxDQUFRLE9BQVI7O0FBQ1gsR0FBQSxHQUFXLE9BQUEsQ0FBUSxLQUFSOztBQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsVUFBUjs7QUFFTDtJQUVDLGdCQUFDLE9BQUQ7QUFFQyxZQUFBO1FBRkEsSUFBQyxDQUFBLFVBQUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBRUEsSUFBQyxDQUFBLFdBQUQsR0FBZTtRQUNmLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsS0FBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUVWLElBQUMsQ0FBQSxHQUFELEdBQVcsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxl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QWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyAkLCBfLCBjbGFtcCwgZHJhZywgZWxlbSwgZW1wdHksIGZzLCBrZXJyb3IsIGtleWluZm8sIGtsb2csIGtwb3MsIG9wZW4sIHBvcHVwLCBwb3N0LCBwcmVmcywgc2V0U3R5bGUsIHNsYXNoLCBzdG9wRXZlbnQsIHZhbGlkIH0gPSByZXF1aXJlICdreGsnXG5cblJvdyAgICAgID0gcmVxdWlyZSAnLi9yb3cnXG5DcnVtYiAgICA9IHJlcXVpcmUgJy4vY3J1bWInXG5TY3JvbGxlciA9IHJlcXVpcmUgJy4vc2Nyb2xsZXInXG5EaXJXYXRjaCA9IHJlcXVpcmUgJy4uL3Rvb2xzL2RpcndhdGNoJ1xuRmlsZSAgICAgPSByZXF1aXJlICcuLi90b29scy9maWxlJ1xuZnV6enkgICAgPSByZXF1aXJlICdmdXp6eSdcbnd4dyAgICAgID0gcmVxdWlyZSAnd3h3J1xuZWxlY3Ryb24gPSByZXF1aXJlICdlbGVjdHJvbidcblxuY2xhc3MgQ29sdW1uXG4gICAgXG4gICAgQDogKEBicm93c2VyKSAtPlxuICAgICAgICBcbiAgICAgICAgQHNlYXJjaFRpbWVyID0gbnVsbFxuICAgICAgICBAc2VhcmNoID0gJydcbiAgICAgICAgQGl0ZW1zICA9IFtdXG4gICAgICAgIEByb3dzICAgPSBbXVxuICAgICAgICBcbiAgICAgICAgQGRpdiAgICAgPSBlbGVtIGNsYXNzOiAnYnJvd3NlckNvbHVtbicgICAgICAgIHRhYkluZGV4OjYgaWQ6IEBuYW1lKClcbiAgICAgICAgQGNvbnRlbnQgPSBlbGVtIGNsYXNzOiAnYnJvd3NlckNvbHVtbkNvbnRlbnQnIHBhcmVudDogQGRpdlxuICAgICAgICBAdGFibGUgICA9IGVsZW0gY2xhc3M6ICdicm93c2VyQ29sdW1uVGFibGUnICAgcGFyZW50OiBAY29udGVudFxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuY29scz8uYXBwZW5kQ2hpbGQgQGRpdlxuICAgICAgICBcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdmb2N1cycgICAgIEBvbkZvY3VzXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnYmx1cicgICAgICBAb25CbHVyXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAna2V5ZG93bicgICBAb25LZXlcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdrZXl1cCcgICAgIEBvbktleVVwXG4gICAgICAgIFxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlb3ZlcicgQG9uTW91c2VPdmVyXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2VvdXQnICBAb25Nb3VzZU91dFxuXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnZGJsY2xpY2snICBAb25EYmxDbGlja1xuICAgICAgICBcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdjb250ZXh0bWVudScgQG9uQ29udGV4dE1lbnVcbiAgXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBkaXZcbiAgICAgICAgICAgIG9uU3RhcnQ6IEBvbkRyYWdTdGFydFxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uRHJhZ01vdmVcbiAgICAgICAgICAgIG9uU3RvcDogIEBvbkRyYWdTdG9wXG4gICAgICAgIFxuICAgICAgICBAY3J1bWIgID0gbmV3IENydW1iIEBcbiAgICAgICAgQHNjcm9sbCA9IG5ldyBTY3JvbGxlciBALCBAY29udGVudFxuICAgICAgICBcbiAgICAgICAgQHNldEluZGV4IEBicm93c2VyLmNvbHVtbnM/Lmxlbmd0aFxuICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBsb2FkSXRlbXM6IChpdGVtcywgcGFyZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgIyBrbG9nIEBwYXJlbnQ/LmZpbGUsIHBhcmVudC5maWxlLCBpdGVtcy5sZW5ndGhcbiAgICAgICAgQGNsZWFyKClcblxuICAgICAgICBAcGFyZW50ID0gcGFyZW50XG4gICAgICAgIFxuICAgICAgICBpZiBAaW5kZXggPT0gMCBvciBAaW5kZXgtMSA8IEBicm93c2VyLm51bUNvbHMoKSBhbmQgQGJyb3dzZXIuY29sdW1uc1tAaW5kZXgtMV0uYWN0aXZlUm93KCk/Lml0ZW0ubmFtZSA9PSAnLi4nIGFuZCBub3Qgc2xhc2guaXNSb290IEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgaWYgaXRlbXNbMF0/Lm5hbWUgbm90IGluIFsnLi4nICcvJ11cbiAgICAgICAgICAgICAgICBkaXIgPSBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgICAgICB1cGRpciA9IHNsYXNoLmRpciBkaXJcbiAgICAgICAgICAgICAgICBpZiB1cGRpciAhPSBkaXJcbiAgICAgICAgICAgICAgICAgICAgaXRlbXMudW5zaGlmdFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJy4uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6ICB1cGRpclxuICAgICAgICBcbiAgICAgICAgQGl0ZW1zID0gaXRlbXNcbiAgXG4gICAgICAgIEBkaXYuY2xhc3NMaXN0LnJlbW92ZSAnYnJvd3NlckNvbHVtbkNvZGUnXG4gICAgICAgIFxuICAgICAgICBAY3J1bWIuc2hvdygpXG4gICAgICAgIFxuICAgICAgICBpZiBAcGFyZW50LnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICMga2xvZyAnbG9hZEl0ZW1zJyBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIERpcldhdGNoLndhdGNoIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgQGNydW1iLnNldEZpbGUgQHBhcmVudC5maWxlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIEZpbGUuaXNDb2RlIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgICAgIEBjcnVtYi5zZXRGaWxlIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgICAgIEBkaXYuY2xhc3NMaXN0LmFkZCAnYnJvd3NlckNvbHVtbkNvZGUnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSB1bmRlZmluZWRcbiAgICAgICAgICAgIGtsb2cgJ3VuZGVmaW5lZCBwYXJlbnQgdHlwZT8nXG4gICAgICAgICAgICBAcGFyZW50LnR5cGUgPSBzbGFzaC5pc0RpcihAcGFyZW50LmZpbGUpIGFuZCAnZGlyJyBvciAnZmlsZSdcbiAgICAgICAgXG4gICAgICAgIGtlcnJvciBcIm5vIHBhcmVudCBpdGVtP1wiIGlmIG5vdCBAcGFyZW50P1xuICAgICAgICBrZXJyb3IgXCJsb2FkSXRlbXMgLS0gbm8gcGFyZW50IHR5cGU/XCIsIEBwYXJlbnQgaWYgbm90IEBwYXJlbnQudHlwZT9cbiAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkIEBpdGVtc1xuICAgICAgICAgICAgZm9yIGl0ZW0gaW4gQGl0ZW1zXG4gICAgICAgICAgICAgICAgQHJvd3MucHVzaCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgXG4gICAgICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQHBhcmVudC50eXBlID09ICdkaXInIGFuZCBzbGFzaC5zYW1lUGF0aCAnfi9Eb3dubG9hZHMnIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgQHNvcnRCeURhdGVBZGRlZCgpXG4gICAgICAgIEBcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIHVwZGF0ZURyYWdJbmRpY2F0b3I6IChldmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBkcmFnSW5kPy5jbGFzc0xpc3QudG9nZ2xlICdjb3B5JyBldmVudC5zaGlmdEtleVxuICAgICAgICBAZHJhZ0luZD8uY2xhc3NMaXN0LnRvZ2dsZSAnbW92ZScgZXZlbnQuY3RybEtleSBvciBldmVudC5tZXRhS2V5IG9yIGV2ZW50LmFsdEtleVxuICAgIFxuICAgIG9uRHJhZ1N0YXJ0OiAoZCwgZSkgPT4gXG4gICAgXG4gICAgICAgIEBkcmFnU3RhcnRSb3cgPSBAcm93IGUudGFyZ2V0XG4gICAgICAgIFxuICAgICAgICAjIEBicm93c2VyLnNraXBPbkRibENsaWNrID0gZmFsc2VcbiAgICAgICAgXG4gICAgICAgIGRlbGV0ZSBAdG9nZ2xlXG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ1N0YXJ0Um93XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGUuc2hpZnRLZXlcbiAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3QudG8gQGRyYWdTdGFydFJvd1xuICAgICAgICAgICAgZWxzZSBpZiBlLm1ldGFLZXkgb3IgZS5hbHRLZXkgb3IgZS5jdHJsS2V5XG4gICAgICAgICAgICAgICAgaWYgbm90IEBkcmFnU3RhcnRSb3cuaXNTZWxlY3RlZCgpXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC50b2dnbGUgQGRyYWdTdGFydFJvd1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQHRvZ2dsZSA9IHRydWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiBAZHJhZ1N0YXJ0Um93LmlzU2VsZWN0ZWQoKVxuICAgICAgICAgICAgICAgICAgICBAZGVzZWxlY3QgPSB0cnVlXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAYWN0aXZlUm93KCk/LmNsZWFyQWN0aXZlKClcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyBAZHJhZ1N0YXJ0Um93LCBmYWxzZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBAaGFzRm9jdXMoKSBhbmQgQGFjdGl2ZVJvdygpXG4gICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyBAYWN0aXZlUm93KClcblxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgICAwICAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG9uRHJhZ01vdmU6IChkLGUpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ1N0YXJ0Um93IGFuZCBub3QgQGRyYWdEaXYgYW5kIHZhbGlkIEBicm93c2VyLnNlbGVjdC5maWxlcygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBpZiBNYXRoLmFicyhkLmRlbHRhU3VtLngpIDwgMjAgYW5kIE1hdGguYWJzKGQuZGVsdGFTdW0ueSkgPCAxMFxuXG4gICAgICAgICAgICBkZWxldGUgQHRvZ2dsZSBcbiAgICAgICAgICAgIGRlbGV0ZSBAZGVzZWxlY3RcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGRyYWdEaXYgPSBlbGVtICdkaXYnXG4gICAgICAgICAgICBAZHJhZ0Rpdi5kcmFnID0gZFxuICAgICAgICAgICAgQGRyYWdEaXYuZmlsZXMgPSBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKVxuICAgICAgICAgICAgcG9zID0ga3BvcyBlLnBhZ2VYLCBlLnBhZ2VZXG4gICAgICAgICAgICByb3cgPSBAYnJvd3Nlci5zZWxlY3Qucm93c1swXVxuXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS5wb3NpdGlvbiAgICAgID0gJ2Fic29sdXRlJ1xuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUub3BhY2l0eSAgICAgICA9IFwiMC43XCJcbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLnRvcCAgICAgICAgICAgPSBcIiN7cG9zLnktZC5kZWx0YVN1bS55fXB4XCJcbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLmxlZnQgICAgICAgICAgPSBcIiN7cG9zLngtZC5kZWx0YVN1bS54fXB4XCJcbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLndpZHRoICAgICAgICAgPSBcIiN7QHdpZHRoKCktMTJ9cHhcIlxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZHJhZ0luZCA9IGVsZW0gY2xhc3M6J2RyYWdJbmRpY2F0b3InXG4gICAgICAgICAgICBAZHJhZ0Rpdi5hcHBlbmRDaGlsZCBAZHJhZ0luZFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3Igcm93IGluIEBicm93c2VyLnNlbGVjdC5yb3dzXG4gICAgICAgICAgICAgICAgcm93Q2xvbmUgPSByb3cuZGl2LmNsb25lTm9kZSB0cnVlXG4gICAgICAgICAgICAgICAgcm93Q2xvbmUuc3R5bGUuZmxleCAgICAgICAgICA9ICd1bnNldCdcbiAgICAgICAgICAgICAgICByb3dDbG9uZS5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnXG4gICAgICAgICAgICAgICAgcm93Q2xvbmUuc3R5bGUuYm9yZGVyICAgICAgICA9ICdub25lJ1xuICAgICAgICAgICAgICAgIHJvd0Nsb25lLnN0eWxlLm1hcmdpbkJvdHRvbSAgPSAnLTFweCdcbiAgICAgICAgICAgICAgICBAZHJhZ0Rpdi5hcHBlbmRDaGlsZCByb3dDbG9uZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCBAZHJhZ0RpdlxuICAgICAgICAgICAgQGZvY3VzIGFjdGl2YXRlOmZhbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQGRyYWdEaXZcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgb25TcHJpbmdMb2FkVGltZW91dCA9ID0+XG4gICAgICAgICAgICAgICAgaWYgY29sdW1uID0gQGJyb3dzZXIuY29sdW1uRm9yRmlsZSBAYnJvd3Nlci5zcHJpbmdMb2FkVGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgIGlmIHJvdyA9IGNvbHVtbi5yb3cgQGJyb3dzZXIuc3ByaW5nTG9hZFRhcmdldFxuICAgICAgICAgICAgICAgICAgICAgICAgcm93LmFjdGl2YXRlKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCBAYnJvd3Nlci5zcHJpbmdMb2FkVGltZXJcbiAgICAgICAgICAgIGRlbGV0ZSBAYnJvd3Nlci5zcHJpbmdMb2FkVGFyZ2V0XG4gICAgICAgICAgICBpZiByb3cgPSBAYnJvd3Nlci5yb3dBdFBvcyBkLnBvc1xuICAgICAgICAgICAgICAgIGlmIHJvdy5pdGVtLnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc3ByaW5nTG9hZFRpbWVyID0gc2V0VGltZW91dCBvblNwcmluZ0xvYWRUaW1lb3V0LCAxMDAwXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNwcmluZ0xvYWRUYXJnZXQgPSByb3cuaXRlbS5maWxlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEB1cGRhdGVEcmFnSW5kaWNhdG9yIGUgXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZVgoI3tkLmRlbHRhU3VtLnh9cHgpIHRyYW5zbGF0ZVkoI3tkLmRlbHRhU3VtLnl9cHgpXCJcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgIFxuICAgIFxuICAgIG9uRHJhZ1N0b3A6IChkLGUpID0+XG4gICAgICAgIFxuICAgICAgICBjbGVhclRpbWVvdXQgQGJyb3dzZXIuc3ByaW5nTG9hZFRpbWVyXG4gICAgICAgIGRlbGV0ZSBAYnJvd3Nlci5zcHJpbmdMb2FkVGFyZ2V0XG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ0Rpdj9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGRyYWdEaXYucmVtb3ZlKClcbiAgICAgICAgICAgIGZpbGVzID0gQGRyYWdEaXYuZmlsZXNcbiAgICAgICAgICAgIGRlbGV0ZSBAZHJhZ0RpdlxuICAgICAgICAgICAgZGVsZXRlIEBkcmFnU3RhcnRSb3dcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgcm93ID0gQGJyb3dzZXIucm93QXRQb3MgZC5wb3NcbiAgICAgICAgICAgICAgICBjb2x1bW4gPSByb3cuY29sdW1uXG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gcm93Lml0ZW0uZmlsZVxuICAgICAgICAgICAgZWxzZSBpZiBjb2x1bW4gPSBAYnJvd3Nlci5jb2x1bW5BdFBvcyBkLnBvc1xuICAgICAgICAgICAgICAgIHRhcmdldCA9IGNvbHVtbi5wYXJlbnQ/LmZpbGVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBrbG9nICdubyBkcm9wIHRhcmdldCdcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBhY3Rpb24gPSBlLnNoaWZ0S2V5IGFuZCAnY29weScgb3IgJ21vdmUnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBjb2x1bW4gPT0gQGJyb3dzZXIuc2hlbGYgXG4gICAgICAgICAgICAgICAgaWYgdGFyZ2V0IGFuZCAoZS5jdHJsS2V5IG9yIGUuc2hpZnRLZXkgb3IgZS5tZXRhS2V5IG9yIGUuYWx0S2V5KVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5kcm9wQWN0aW9uIGFjdGlvbiwgZmlsZXMsIHRhcmdldFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2hlbGYuYWRkRmlsZXMgZmlsZXMsIHBvczpkLnBvc1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBicm93c2VyLmRyb3BBY3Rpb24gYWN0aW9uLCBmaWxlcywgdGFyZ2V0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgICMgQGZvY3VzIGFjdGl2YXRlOmZhbHNlICMgdGhpcyBicmVha3MgY29udGV4dG1lbnUgcG9wdXBzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHJvdyA9IEByb3cgZS50YXJnZXRcbiAgICAgICAgICAgICAgICBpZiByb3cuaXNTZWxlY3RlZCgpXG4gICAgICAgICAgICAgICAgICAgIGlmIGUubWV0YUtleSBvciBlLmFsdEtleSBvciBlLmN0cmxLZXkgb3IgZS5zaGlmdEtleVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgQHRvZ2dsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBAdG9nZ2xlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnRvZ2dsZSByb3dcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgQGRlc2VsZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIEBkZXNlbGVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgcm93XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm93LmFjdGl2YXRlKClcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAYWN0aXZlUm93KCk/LmNsZWFyQWN0aXZlKClcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAgIDAgICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgcmVtb3ZlRmlsZTogKGZpbGUpID0+IFxuICAgICAgICBcbiAgICAgICAgaWYgcm93ID0gQHJvdyBzbGFzaC5maWxlIGZpbGVcbiAgICAgICAgICAgIEByZW1vdmVSb3cgcm93XG4gICAgICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBpbnNlcnRGaWxlOiAoZmlsZSkgPT4gXG5cbiAgICAgICAgaXRlbSA9IEBicm93c2VyLmZpbGVJdGVtIGZpbGVcbiAgICAgICAgcm93ID0gbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIEByb3dzLnB1c2ggcm93XG4gICAgICAgIHJvd1xuICAgICAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgdW5zaGlmdEl0ZW06IChpdGVtKSAtPlxuICAgICAgICBcbiAgICAgICAgQGl0ZW1zLnVuc2hpZnQgaXRlbVxuICAgICAgICBAcm93cy51bnNoaWZ0IG5ldyBSb3cgQCwgaXRlbVxuICAgICAgICBAdGFibGUuaW5zZXJ0QmVmb3JlIEB0YWJsZS5sYXN0Q2hpbGQsIEB0YWJsZS5maXJzdENoaWxkXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgQHJvd3NbMF1cbiAgICAgICAgXG4gICAgcHVzaEl0ZW06IChpdGVtKSAtPlxuICAgICAgICBcbiAgICAgICAgQGl0ZW1zLnB1c2ggaXRlbVxuICAgICAgICBAcm93cy5wdXNoIG5ldyBSb3cgQCwgaXRlbVxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgIEByb3dzWy0xXVxuICAgICAgICBcbiAgICBhZGRJdGVtOiAoaXRlbSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJvdyA9IEBwdXNoSXRlbSBpdGVtXG4gICAgICAgIEBzb3J0QnlOYW1lKClcbiAgICAgICAgcm93XG5cbiAgICBzZXRJdGVtczogKEBpdGVtcywgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuY2xlYXJDb2x1bW4gQGluZGV4XG4gICAgICAgIFxuICAgICAgICBAcGFyZW50ID0gb3B0LnBhcmVudFxuICAgICAgICBrZXJyb3IgXCJubyBwYXJlbnQgaXRlbT9cIiBpZiBub3QgQHBhcmVudD9cbiAgICAgICAga2Vycm9yIFwic2V0SXRlbXMgLS0gbm8gcGFyZW50IHR5cGU/XCIsIEBwYXJlbnQgaWYgbm90IEBwYXJlbnQudHlwZT9cbiAgICAgICAgXG4gICAgICAgIGZvciBpdGVtIGluIEBpdGVtc1xuICAgICAgICAgICAgQHJvd3MucHVzaCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgQFxuXG4gICAgIyAwMCAgICAgMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgMDAwICAgICAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICBcbiAgICAgICAgXG4gICAgaXNEaXI6ICAtPiBAcGFyZW50Py50eXBlID09ICdkaXInIFxuICAgIGlzRmlsZTogLT4gQHBhcmVudD8udHlwZSA9PSAnZmlsZScgXG4gICAgICAgIFxuICAgIGlzRW1wdHk6IC0+IGVtcHR5IEBwYXJlbnRcbiAgICBjbGVhcjogICAtPlxuICAgICAgICBpZiBAcGFyZW50Py5maWxlIGFuZCBAcGFyZW50Py50eXBlID09ICdkaXInXG4gICAgICAgICAgICAjIGtsb2cgJ2NvbHVtbi5jbGVhciB1bndhdGNoPycgQHBhcmVudC5maWxlXG4gICAgICAgICAgICBEaXJXYXRjaC51bndhdGNoIEBwYXJlbnQuZmlsZVxuICAgICAgICBkZWxldGUgQHBhcmVudFxuICAgICAgICBAY2xlYXJTZWFyY2goKVxuICAgICAgICBAZGl2LnNjcm9sbFRvcCA9IDBcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIEBjcnVtYi5jbGVhcigpXG4gICAgICAgIEByb3dzID0gW11cbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICAgICBcbiAgICBzZXRJbmRleDogKEBpbmRleCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjcnVtYj8uZWxlbS5jb2x1bW5JbmRleCA9IEBpbmRleFxuICAgICAgICBcbiAgICB3aWR0aDogLT4gQGRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS53aWR0aFxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMCAgICAgIDAwMDAwMDAwICBcbiAgIFxuICAgIGFjdGl2YXRlUm93OiAocm93KSAtPiBAcm93KHJvdyk/LmFjdGl2YXRlKClcbiAgICAgICBcbiAgICBhY3RpdmVSb3c6IC0+IF8uZmluZCBAcm93cywgKHIpIC0+IHIuaXNBY3RpdmUoKVxuICAgIGFjdGl2ZVBhdGg6IC0+IEBhY3RpdmVSb3coKT8ucGF0aCgpID8gQHBhcmVudC5maWxlXG4gICAgXG4gICAgcm93OiAocm93KSAtPiAjIGFjY2VwdHMgZWxlbWVudCwgaW5kZXgsIHN0cmluZyBvciByb3dcbiAgICAgICAgaWYgICAgICBOdW1iZXIuaXNJbnRlZ2VyKHJvdykgdGhlbiByZXR1cm4gMCA8PSByb3cgPCBAbnVtUm93cygpIGFuZCBAcm93c1tyb3ddIG9yIG51bGxcbiAgICAgICAgZWxzZSBpZiB0eXBlb2Yocm93KSA9PSAnc3RyaW5nJyB0aGVuIHJldHVybiBfLmZpbmQgQHJvd3MsIChyKSAtPiByLml0ZW0ubmFtZSA9PSByb3cgb3Igci5pdGVtLmZpbGUgPT0gcm93XG4gICAgICAgIGVsc2UgaWYgcm93IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgdGhlbiByZXR1cm4gXy5maW5kIEByb3dzLCAocikgLT4gci5kaXYuY29udGFpbnMgcm93XG4gICAgICAgIGVsc2UgcmV0dXJuIHJvd1xuICAgICAgICAgICAgXG4gICAgbmV4dENvbHVtbjogLT4gQGJyb3dzZXIuY29sdW1uIEBpbmRleCsxXG4gICAgcHJldkNvbHVtbjogLT4gQGJyb3dzZXIuY29sdW1uIEBpbmRleC0xXG4gICAgICAgIFxuICAgIG5hbWU6IC0+IFwiI3tAYnJvd3Nlci5uYW1lfToje0BpbmRleH1cIlxuICAgIHBhdGg6IC0+IEBwYXJlbnQ/LmZpbGUgPyAnJ1xuICAgICAgICBcbiAgICBudW1Sb3dzOiAgICAtPiBAcm93cy5sZW5ndGggPyAwICAgXG4gICAgcm93SGVpZ2h0OiAgLT4gQHJvd3NbMF0/LmRpdi5jbGllbnRIZWlnaHQgPyAwXG4gICAgbnVtVmlzaWJsZTogLT4gQHJvd0hlaWdodCgpIGFuZCBwYXJzZUludChAYnJvd3Nlci5oZWlnaHQoKSAvIEByb3dIZWlnaHQoKSkgb3IgMFxuICAgIFxuICAgIHJvd0F0UG9zOiAocG9zKSAtPiBAcm93IEByb3dJbmRleEF0UG9zIHBvc1xuICAgIFxuICAgIHJvd0luZGV4QXRQb3M6IChwb3MpIC0+XG4gICAgICAgIGR5ID0gcG9zLnkgLSBAY29udGVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3BcbiAgICAgICAgaWYgZHkgPj0gMFxuICAgICAgICAgICAgTWF0aC5mbG9vciBkeS9Acm93SGVpZ2h0KClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgLTEgICAgICAgICAgICBcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBoYXNGb2N1czogLT4gQGRpdi5jbGFzc0xpc3QuY29udGFpbnMgJ2ZvY3VzJ1xuXG4gICAgZm9jdXM6IChvcHQ9e30pIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAYWN0aXZlUm93KCkgYW5kIEBudW1Sb3dzKCkgYW5kIG9wdD8uYWN0aXZhdGUgIT0gZmFsc2VcbiAgICAgICAgICAgIEByb3dzWzBdLnNldEFjdGl2ZSgpXG4gICAgICAgICAgXG4gICAgICAgIEBkaXYuZm9jdXMoKVxuICAgICAgICBAZGl2LmNsYXNzTGlzdC5hZGQgJ2ZvY3VzJ1xuICAgICAgICB3aW5kb3cuc2V0TGFzdEZvY3VzIEBuYW1lKClcbiAgICAgICAgQFxuICAgICAgICBcbiAgICBvbkZvY3VzOiA9PiBAZGl2LmNsYXNzTGlzdC5hZGQgJ2ZvY3VzJ1xuICAgIG9uQmx1cjogID0+IEBkaXYuY2xhc3NMaXN0LnJlbW92ZSAnZm9jdXMnXG5cbiAgICBmb2N1c0Jyb3dzZXI6IC0+IEBicm93c2VyLmZvY3VzKClcbiAgICBcbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG9uTW91c2VPdmVyOiAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8ub25Nb3VzZU92ZXI/KClcbiAgICBvbk1vdXNlT3V0OiAgKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/Lm9uTW91c2VPdXQ/KClcbiAgICBcbiAgICBvbkRibENsaWNrOiAgKGV2ZW50KSA9PiBcbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLnNraXBPbkRibENsaWNrID0gdHJ1ZVxuICAgICAgICBpdGVtID0gQGFjdGl2ZVJvdygpPy5pdGVtXG4gICAgICAgIGlmIGl0ZW0udHlwZSA9PSAnZGlyJ1xuICAgICAgICAgICAgQGJyb3dzZXIuY2xlYXJDb2x1bW5zRnJvbSAxIHBvcDp0cnVlIFxuICAgICAgICAgICAgQGJyb3dzZXIubG9hZERpckl0ZW0gaXRlbSwgMCBhY3RpdmF0ZTpmYWxzZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBlZGl0b3IuZm9jdXMoKSAjIHRlc3QgaWYgZWRpdG9yLmN1cnJlbnRGaWxlID09IGl0ZW0uZmlsZSA/XG4gICAgXG4gICAgZXh0ZW5kU2VsZWN0aW9uOiAoa2V5KSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGVycm9yIFwibm8gcm93cyBpbiBjb2x1bW4gI3tAaW5kZXh9P1wiIGlmIG5vdCBAbnVtUm93cygpICAgICAgICBcbiAgICAgICAgaW5kZXggPSBAYWN0aXZlUm93KCk/LmluZGV4KCkgPyAtMVxuICAgICAgICBlcnJvciBcIm5vIGluZGV4IGZyb20gYWN0aXZlUm93PyAje2luZGV4fT9cIiwgQGFjdGl2ZVJvdygpIGlmIG5vdCBpbmRleD8gb3IgTnVtYmVyLmlzTmFOIGluZGV4XG4gICAgICAgICAgICBcbiAgICAgICAgdG9JbmRleCA9IHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgICAgICAgdGhlbiBpbmRleC0xXG4gICAgICAgICAgICB3aGVuICdkb3duJyAgICAgIHRoZW4gaW5kZXgrMVxuICAgICAgICAgICAgd2hlbiAnaG9tZScgICAgICB0aGVuIDBcbiAgICAgICAgICAgIHdoZW4gJ2VuZCcgICAgICAgdGhlbiBAbnVtUm93cygpLTFcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICAgdGhlbiBNYXRoLm1heCAwLCBpbmRleC1AbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gTWF0aC5taW4gQG51bVJvd3MoKS0xLCBpbmRleCtAbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICBlbHNlIGluZGV4XG4gICAgXG4gICAgICAgIEBicm93c2VyLnNlbGVjdC50byBAcm93KHRvSW5kZXgpLCB0cnVlXG4gICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuXG4gICAgbmF2aWdhdGVSb3dzOiAoa2V5KSAtPlxuXG4gICAgICAgIHJldHVybiBlcnJvciBcIm5vIHJvd3MgaW4gY29sdW1uICN7QGluZGV4fT9cIiBpZiBub3QgQG51bVJvd3MoKVxuICAgICAgICBpbmRleCA9IEBhY3RpdmVSb3coKT8uaW5kZXgoKSA/IC0xXG4gICAgICAgIGVycm9yIFwibm8gaW5kZXggZnJvbSBhY3RpdmVSb3c/ICN7aW5kZXh9P1wiIEBhY3RpdmVSb3coKSBpZiBub3QgaW5kZXg/IG9yIE51bWJlci5pc05hTiBpbmRleFxuICAgICAgICBcbiAgICAgICAgbmV3SW5kZXggPSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICd1cCcgICAgICAgIHRoZW4gaW5kZXgtMVxuICAgICAgICAgICAgd2hlbiAnZG93bicgICAgICB0aGVuIGluZGV4KzFcbiAgICAgICAgICAgIHdoZW4gJ2hvbWUnICAgICAgdGhlbiAwXG4gICAgICAgICAgICB3aGVuICdlbmQnICAgICAgIHRoZW4gQG51bVJvd3MoKS0xXG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAgIHRoZW4gaW5kZXgtQG51bVZpc2libGUoKVxuICAgICAgICAgICAgd2hlbiAncGFnZSBkb3duJyB0aGVuIGluZGV4K0BudW1WaXNpYmxlKClcbiAgICAgICAgICAgIGVsc2UgaW5kZXhcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBub3QgbmV3SW5kZXg/IG9yIE51bWJlci5pc05hTiBuZXdJbmRleCAgICAgICAgXG4gICAgICAgICAgICBlcnJvciBcIm5vIGluZGV4ICN7bmV3SW5kZXh9PyAje0BudW1WaXNpYmxlKCl9XCJcbiAgICAgICAgICAgIFxuICAgICAgICBuZXdJbmRleCA9IGNsYW1wIDAgQG51bVJvd3MoKS0xIG5ld0luZGV4XG4gICAgICAgIFxuICAgICAgICBpZiBuZXdJbmRleCAhPSBpbmRleFxuICAgICAgICAgICAgQHJvd3NbbmV3SW5kZXhdLmFjdGl2YXRlIG51bGwgQHBhcmVudC50eXBlPT0nZmlsZSdcbiAgICBcbiAgICBuYXZpZ2F0ZUNvbHM6IChrZXkpIC0+ICMgbW92ZSB0byBmaWxlIGJyb3dzZXI/XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICd1cCcgICAgdGhlbiBAYnJvd3Nlci5uYXZpZ2F0ZSAndXAnXG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiBAYnJvd3Nlci5uYXZpZ2F0ZSAnbGVmdCdcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuIEBicm93c2VyLm5hdmlnYXRlICdyaWdodCdcbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJ1xuICAgICAgICAgICAgICAgIGlmIGl0ZW0gPSBAYWN0aXZlUm93KCk/Lml0ZW1cbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9IGl0ZW0udHlwZVxuICAgICAgICAgICAgICAgICAgICBpZiB0eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5sb2FkSXRlbSBpdGVtXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUbycgaXRlbVxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdmb2N1cycgJ2VkaXRvcidcbiAgICAgICAgQFxuXG4gICAgbmF2aWdhdGVSb290OiAoa2V5KSAtPiBcbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLmJyb3dzZSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiBzbGFzaC5kaXIgQHBhcmVudC5maWxlXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgdGhlbiBAYWN0aXZlUm93KCkuaXRlbS5maWxlXG4gICAgICAgIEBcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAgMDAwMDAwMDAwICAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgXG4gICAgXG4gICAgZG9TZWFyY2g6IChjaGFyKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbnVtUm93cygpXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQHNlYXJjaERpdlxuICAgICAgICAgICAgQHNlYXJjaERpdiA9IGVsZW0gY2xhc3M6ICdicm93c2VyU2VhcmNoJ1xuICAgICAgICAgICAgXG4gICAgICAgIEBzZXRTZWFyY2ggQHNlYXJjaCArIGNoYXJcbiAgICAgICAgXG4gICAgYmFja3NwYWNlU2VhcmNoOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQHNlYXJjaERpdiBhbmQgQHNlYXJjaC5sZW5ndGhcbiAgICAgICAgICAgIEBzZXRTZWFyY2ggQHNlYXJjaFswLi4uQHNlYXJjaC5sZW5ndGgtMV1cbiAgICAgICAgICAgIFxuICAgIHNldFNlYXJjaDogKEBzZWFyY2gpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBzZWFyY2hUaW1lclxuICAgICAgICBAc2VhcmNoVGltZXIgPSBzZXRUaW1lb3V0IEBjbGVhclNlYXJjaCwgMjAwMFxuICAgICAgICBcbiAgICAgICAgQHNlYXJjaERpdi50ZXh0Q29udGVudCA9IEBzZWFyY2hcblxuICAgICAgICBhY3RpdmVJbmRleCAgPSBAYWN0aXZlUm93KCk/LmluZGV4KCkgPyAwXG4gICAgICAgIGFjdGl2ZUluZGV4ICs9IDEgaWYgKEBzZWFyY2gubGVuZ3RoID09IDEpICNvciAoY2hhciA9PSAnJylcbiAgICAgICAgYWN0aXZlSW5kZXggID0gMCBpZiBhY3RpdmVJbmRleCA+PSBAbnVtUm93cygpXG4gICAgICAgIFxuICAgICAgICBmb3Igcm93cyBpbiBbQHJvd3Muc2xpY2UoYWN0aXZlSW5kZXgpLCBAcm93cy5zbGljZSgwLGFjdGl2ZUluZGV4KzEpXVxuICAgICAgICAgICAgZnV6emllZCA9IGZ1enp5LmZpbHRlciBAc2VhcmNoLCByb3dzLCBleHRyYWN0OiAocikgLT4gci5pdGVtLm5hbWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgZnV6emllZC5sZW5ndGhcbiAgICAgICAgICAgICAgICByb3cgPSBmdXp6aWVkWzBdLm9yaWdpbmFsXG4gICAgICAgICAgICAgICAgcm93LmRpdi5hcHBlbmRDaGlsZCBAc2VhcmNoRGl2XG4gICAgICAgICAgICAgICAgcm93LmFjdGl2YXRlKClcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICBAXG4gICAgXG4gICAgY2xlYXJTZWFyY2g6ID0+XG4gICAgICAgIFxuICAgICAgICBAc2VhcmNoID0gJydcbiAgICAgICAgQHNlYXJjaERpdj8ucmVtb3ZlKClcbiAgICAgICAgZGVsZXRlIEBzZWFyY2hEaXZcbiAgICAgICAgQFxuICAgIFxuICAgIHJlbW92ZU9iamVjdDogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIHJvdyA9IEBhY3RpdmVSb3coKVxuICAgICAgICAgICAgbmV4dE9yUHJldiA9IHJvdy5uZXh0KCkgPyByb3cucHJldigpXG4gICAgICAgICAgICBAcmVtb3ZlUm93IHJvd1xuICAgICAgICAgICAgbmV4dE9yUHJldj8uYWN0aXZhdGUoKVxuICAgICAgICBAXG5cbiAgICByZW1vdmVSb3c6IChyb3cpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiByb3cgPT0gQGFjdGl2ZVJvdygpXG4gICAgICAgICAgICBpZiBAbmV4dENvbHVtbigpPy5wYXJlbnQ/LmZpbGUgPT0gcm93Lml0ZW0/LmZpbGVcbiAgICAgICAgICAgICAgICBAYnJvd3Nlci5jbGVhckNvbHVtbnNGcm9tIEBpbmRleCArIDFcbiAgICAgICAgICAgIFxuICAgICAgICByb3cuZGl2LnJlbW92ZSgpXG4gICAgICAgIEBpdGVtcy5zcGxpY2Ugcm93LmluZGV4KCksIDFcbiAgICAgICAgQHJvd3Muc3BsaWNlIHJvdy5pbmRleCgpLCAxXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHNvcnRCeU5hbWU6ID0+XG4gICAgICAgICBcbiAgICAgICAgQHJvd3Muc29ydCAoYSxiKSAtPiBcbiAgICAgICAgICAgIChhLml0ZW0udHlwZSArIGEuaXRlbS5uYW1lKS5sb2NhbGVDb21wYXJlKGIuaXRlbS50eXBlICsgYi5pdGVtLm5hbWUpXG4gICAgICAgICAgICBcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3NcbiAgICAgICAgICAgIEB0YWJsZS5hcHBlbmRDaGlsZCByb3cuZGl2XG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgc29ydEJ5VHlwZTogPT5cbiAgICAgICAgXG4gICAgICAgIEByb3dzLnNvcnQgKGEsYikgLT4gXG4gICAgICAgICAgICBhdHlwZSA9IGEuaXRlbS50eXBlID09ICdmaWxlJyBhbmQgc2xhc2guZXh0KGEuaXRlbS5uYW1lKSBvciAnX19fJyAjYS5pdGVtLnR5cGVcbiAgICAgICAgICAgIGJ0eXBlID0gYi5pdGVtLnR5cGUgPT0gJ2ZpbGUnIGFuZCBzbGFzaC5leHQoYi5pdGVtLm5hbWUpIG9yICdfX18nICNiLml0ZW0udHlwZVxuICAgICAgICAgICAgKGEuaXRlbS50eXBlICsgYXR5cGUgKyBhLml0ZW0ubmFtZSkubG9jYWxlQ29tcGFyZShiLml0ZW0udHlwZSArIGJ0eXBlICsgYi5pdGVtLm5hbWUsIHVuZGVmaW5lZCwgbnVtZXJpYzp0cnVlKVxuICAgICAgICAgICAgXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBmb3Igcm93IGluIEByb3dzXG4gICAgICAgICAgICBAdGFibGUuYXBwZW5kQ2hpbGQgcm93LmRpdlxuICAgICAgICBAXG5cbiAgICBzb3J0QnlEYXRlQWRkZWQ6ID0+XG4gICAgICAgIFxuICAgICAgICBAcm93cy5zb3J0IChhLGIpIC0+IGIuaXRlbS5zdGF0Py5hdGltZU1zIC0gYS5pdGVtLnN0YXQ/LmF0aW1lTXNcbiAgICAgICAgICAgIFxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgZm9yIHJvdyBpbiBAcm93c1xuICAgICAgICAgICAgQHRhYmxlLmFwcGVuZENoaWxkIHJvdy5kaXZcbiAgICAgICAgQFxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgdG9nZ2xlRG90RmlsZXM6ID0+XG5cbiAgICAgICAgIyBrbG9nICd0b2dnbGVEb3RGaWxlcydcbiAgICAgICAgaWYgQHBhcmVudC50eXBlID09IHVuZGVmaW5lZFxuICAgICAgICAgICAgQHBhcmVudC50eXBlID0gc2xhc2guaXNEaXIoQHBhcmVudC5maWxlKSBhbmQgJ2Rpcicgb3IgJ2ZpbGUnXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQHBhcmVudC50eXBlID09ICdkaXInICAgICAgICAgICAgXG4gICAgICAgICAgICBzdGF0ZUtleSA9IFwiYnJvd3NlcuKWuHNob3dIaWRkZW7ilrgje0BwYXJlbnQuZmlsZX1cIlxuICAgICAgICAgICAga2xvZyAndG9nZ2xlRG90RmlsZXMnIHN0YXRlS2V5XG4gICAgICAgICAgICBpZiBwcmVmcy5nZXQgc3RhdGVLZXlcbiAgICAgICAgICAgICAgICBwcmVmcy5kZWwgc3RhdGVLZXlcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwcmVmcy5zZXQgc3RhdGVLZXksIHRydWVcbiAgICAgICAgICAgIEBicm93c2VyLmxvYWREaXJJdGVtIEBwYXJlbnQsIEBpbmRleCwgaWdub3JlQ2FjaGU6dHJ1ZVxuICAgICAgICBAXG4gICAgICAgICBcbiAgICB0b2dnbGVFeHRlbnNpb25zOiA9PlxuXG4gICAgICAgIHN0YXRlS2V5ID0gXCJicm93c2VyfGhpZGVFeHRlbnNpb25zXCJcbiAgICAgICAgd2luZG93LnN0YXRlLnNldCBzdGF0ZUtleSwgbm90IHdpbmRvdy5zdGF0ZS5nZXQgc3RhdGVLZXksIGZhbHNlXG4gICAgICAgIHNldFN0eWxlICcuYnJvd3NlclJvdyAuZXh0JyAnZGlzcGxheScgd2luZG93LnN0YXRlLmdldChzdGF0ZUtleSkgYW5kICdub25lJyBvciAnaW5pdGlhbCdcbiAgICAgICAgQFxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgbW92ZVRvVHJhc2g6ID0+XG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IEBicm93c2VyLnNlbGVjdC5mcmVlSW5kZXgoKVxuICAgICAgICBpZiBpbmRleCA+PSAwXG4gICAgICAgICAgICBzZWxlY3RSb3cgPSBAcm93IGluZGV4XG4gICAgICAgIFxuICAgICAgICBmb3Igcm93IGluIEBicm93c2VyLnNlbGVjdC5yb3dzXG4gICAgICAgICAgICB3eHcgJ3RyYXNoJyByb3cucGF0aCgpXG4gICAgICAgICAgICBAcmVtb3ZlUm93IHJvd1xuICAgICAgICAgICBcbiAgICAgICAgaWYgc2VsZWN0Um93XG4gICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3Qucm93IHNlbGVjdFJvd1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbmF2aWdhdGVDb2xzICdsZWZ0J1xuXG4gICAgYWRkVG9TaGVsZjogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIHBhdGhUb1NoZWxmID0gQGFjdGl2ZVBhdGgoKVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdhZGRUb1NoZWxmJyBwYXRoVG9TaGVsZlxuICAgICAgICBcbiAgICBuZXdGb2xkZXI6ID0+XG4gICAgICAgIFxuICAgICAgICBzbGFzaC51bnVzZWQgc2xhc2guam9pbihAcGF0aCgpLCAnTmV3IGZvbGRlcicpLCAobmV3RGlyKSA9PlxuICAgICAgICAgICAgZnMubWtkaXIgbmV3RGlyLCAoZXJyKSA9PlxuICAgICAgICAgICAgICAgIGlmIGVtcHR5IGVyclxuICAgICAgICAgICAgICAgICAgICByb3cgPSBAaW5zZXJ0RmlsZSBuZXdEaXJcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyByb3dcbiAgICAgICAgICAgICAgICAgICAgcm93LmVkaXROYW1lKClcbiAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgZHVwbGljYXRlRmlsZTogPT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgZm9yIGZpbGUgaW4gQGJyb3dzZXIuc2VsZWN0LmZpbGVzKClcbiAgICAgICAgICAgIEZpbGUuZHVwbGljYXRlIGZpbGUsIChzb3VyY2UsIHRhcmdldCkgPT5cbiAgICAgICAgICAgICAgICBpZiBAcGFyZW50LnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgIGNvbCA9IEBwcmV2Q29sdW1uKClcbiAgICAgICAgICAgICAgICAgICAgY29sLmZvY3VzKClcbiAgICAgICAgICAgICAgICBlbHNlIGNvbCA9IEBcbiAgICAgICAgICAgICAgICByb3cgPSBjb2wuaW5zZXJ0RmlsZSB0YXJnZXRcbiAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3Qucm93IHJvd1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgZXhwbG9yZXI6ID0+XG4gICAgICAgIFxuICAgICAgICBvcGVuIHNsYXNoLmRpciBAYWN0aXZlUGF0aCgpXG4gICAgICAgIFxuICAgIG9wZW46ID0+XG5cbiAgICAgICAgb3BlbiBAYWN0aXZlUGF0aCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHVwZGF0ZUdpdEZpbGVzOiAoZmlsZXMpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3Igcm93IGluIEByb3dzXG4gICAgICAgICAgICByZXR1cm4gaWYgcm93Lml0ZW0udHlwZSBub3QgaW4gWydkaXInICdmaWxlJ11cbiAgICAgICAgICAgIHN0YXR1cyA9IGZpbGVzW3Jvdy5pdGVtLmZpbGVdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgICQoJy5icm93c2VyU3RhdHVzSWNvbicgcm93LmRpdik/LnJlbW92ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHN0YXR1cz9cbiAgICAgICAgICAgICAgICByb3cuZGl2LmFwcGVuZENoaWxkIGVsZW0gJ3NwYW4nIGNsYXNzOlwiZ2l0LSN7c3RhdHVzfS1pY29uIGJyb3dzZXJTdGF0dXNJY29uXCJcbiAgICAgICAgICAgIGVsc2UgaWYgcm93Lml0ZW0udHlwZSA9PSAnZGlyJ1xuICAgICAgICAgICAgICAgIGZvciBmaWxlLCBzdGF0dXMgb2YgZmlsZXNcbiAgICAgICAgICAgICAgICAgICAgaWYgcm93Lml0ZW0ubmFtZSAhPSAnLi4nIGFuZCBmaWxlLnN0YXJ0c1dpdGggcm93Lml0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgcm93LmRpdi5hcHBlbmRDaGlsZCBlbGVtICdzcGFuJyBjbGFzczpcImdpdC1kaXJzLWljb24gYnJvd3NlclN0YXR1c0ljb25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIFxuICAgICAgICBcbiAgICBtYWtlUm9vdDogPT4gXG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5zaGlmdENvbHVtbnNUbyBAaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGlmIEBicm93c2VyLmNvbHVtbnNbMF0uaXRlbXNbMF0ubmFtZSAhPSAnLi4nXG5cbiAgICAgICAgICAgIEB1bnNoaWZ0SXRlbSBcbiAgICAgICAgICAgICAgICBuYW1lOiAnLi4nXG4gICAgICAgICAgICAgICAgdHlwZTogJ2RpcidcbiAgICAgICAgICAgICAgICBmaWxlOiBzbGFzaC5kaXIgQHBhcmVudC5maWxlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBjcnVtYi5zZXRGaWxlIEBwYXJlbnQuZmlsZVxuICAgIFxuICAgIG9uQ29udGV4dE1lbnU6IChldmVudCwgY29sdW1uKSA9PiBcbiAgICAgICAgXG4gICAgICAgIHN0b3BFdmVudCBldmVudFxuICAgICAgICBcbiAgICAgICAgYWJzUG9zID0ga3BvcyBldmVudFxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGNvbHVtblxuICAgICAgICAgICAgQHNob3dDb250ZXh0TWVudSBhYnNQb3NcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBvcHQgPSBpdGVtczogWyBcbiAgICAgICAgICAgICAgICB0ZXh0OiAgICdSb290J1xuICAgICAgICAgICAgICAgIGNiOiAgICAgQG1ha2VSb290XG4gICAgICAgICAgICAsXG4gICAgICAgICAgICAgICAgdGV4dDogICAnQWRkIHRvIFNoZWxmJ1xuICAgICAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtzaGlmdCsuJ1xuICAgICAgICAgICAgICAgIGNiOiAgICAgPT4gcG9zdC5lbWl0ICdhZGRUb1NoZWxmJyBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgICxcbiAgICAgICAgICAgICAgICB0ZXh0OiAgICdFeHBsb3JlcidcbiAgICAgICAgICAgICAgICBjb21ibzogICdhbHQrZScgXG4gICAgICAgICAgICAgICAgY2I6ICAgICA9PiBvcGVuIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBvcHQueCA9IGFic1Bvcy54XG4gICAgICAgICAgICBvcHQueSA9IGFic1Bvcy55XG4gICAgICAgICAgICBwb3B1cC5tZW51IG9wdCAgICBcbiAgICAgICAgICAgICAgXG4gICAgc2hvd0NvbnRleHRNZW51OiAoYWJzUG9zKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGFic1Bvcz9cbiAgICAgICAgICAgIGFic1BvcyA9IGtwb3MgQGRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0LCBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcFxuICAgICAgICBcbiAgICAgICAgb3B0ID0gaXRlbXM6IFsgXG4gICAgICAgICAgICB0ZXh0OiAgICdUb2dnbGUgSW52aXNpYmxlJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtpJyBcbiAgICAgICAgICAgIGNiOiAgICAgQHRvZ2dsZURvdEZpbGVzXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ1RvZ2dsZSBFeHRlbnNpb25zJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQHRvZ2dsZUV4dGVuc2lvbnNcbiAgICAgICAgLCAgICAgICAgICAgIFxuICAgICAgICAgICAgdGV4dDogICAnJ1xuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdFeHBsb3JlcidcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQGV4cGxvcmVyXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJydcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnQWRkIHRvIFNoZWxmJ1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K3NoaWZ0Ky4nXG4gICAgICAgICAgICBjYjogICAgIEBhZGRUb1NoZWxmXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJydcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnTW92ZSB0byBUcmFzaCdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrYmFja3NwYWNlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQG1vdmVUb1RyYXNoXG4gICAgICAgICwgICBcbiAgICAgICAgICAgIHRleHQ6ICAgJydcbiAgICAgICAgICAgIGhpZGU6ICAgQHBhcmVudC50eXBlID09ICdmaWxlJ1xuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdEdXBsaWNhdGUnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK2QnIFxuICAgICAgICAgICAgY2I6ICAgICBAZHVwbGljYXRlRmlsZVxuICAgICAgICAgICAgaGlkZTogICBAcGFyZW50LnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICwgICBcbiAgICAgICAgICAgIHRleHQ6ICAgJ05ldyBGb2xkZXInXG4gICAgICAgICAgICBjb21ibzogICdhbHQrbicgXG4gICAgICAgICAgICBjYjogICAgIEBuZXdGb2xkZXJcbiAgICAgICAgICAgIGhpZGU6ICAgQHBhcmVudC50eXBlID09ICdmaWxlJ1xuICAgICAgICBdXG4gICAgICAgIFxuICAgICAgICBpZiBAcGFyZW50LnR5cGUgIT0gJ2ZpbGUnXG4gICAgICAgICAgICBvcHQuaXRlbXMgPSBvcHQuaXRlbXMuY29uY2F0IFtcbiAgICAgICAgICAgICAgICB0ZXh0OiAgICcnXG4gICAgICAgICAgICAsICAgXG4gICAgICAgICAgICAgICAgdGV4dDogICAnU29ydCdcbiAgICAgICAgICAgICAgICBtZW51OiBbXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICdCeSBOYW1lJyBjb21ibzonY3RybCtuJywgY2I6QHNvcnRCeU5hbWVcbiAgICAgICAgICAgICAgICAsXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICdCeSBUeXBlJyBjb21ibzonY3RybCt0JywgY2I6QHNvcnRCeVR5cGVcbiAgICAgICAgICAgICAgICAsXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICdCeSBEYXRlJyBjb21ibzonY3RybCthJywgY2I6QHNvcnRCeURhdGVBZGRlZFxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgb3B0LnkgPSBhYnNQb3MueVxuICAgICAgICBwb3B1cC5tZW51IG9wdCAgICAgICAgXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgICAgICAwMDAgICAgIFxuICAgIFxuICAgIGNvcHlQYXRoczogLT5cbiAgICAgICAgcGF0aHMgPSBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKS5qb2luICdcXG4nXG4gICAgICAgIGVsZWN0cm9uLmNsaXBib2FyZC53cml0ZVRleHQgcGF0aHNcbiAgICAgICAgcGF0aHNcbiAgICAgICAgXG4gICAgY3V0UGF0aHM6IC0+XG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5jdXRQYXRocyA9IEBjb3B5UGF0aHMoKVxuICAgICAgICBcbiAgICBwYXN0ZVBhdGhzOiAtPlxuICAgICAgICBcbiAgICAgICAgdGV4dCA9IGVsZWN0cm9uLmNsaXBib2FyZC5yZWFkVGV4dCgpXG4gICAgICAgIHBhdGhzID0gdGV4dC5zcGxpdCAnXFxuJ1xuICAgICAgICBcbiAgICAgICAgaWYgdGV4dCA9PSBAYnJvd3Nlci5jdXRQYXRoc1xuICAgICAgICAgICAgYWN0aW9uID0gJ21vdmUnXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGFjdGlvbiA9ICdjb3B5J1xuICAgICAgICB0YXJnZXQgPSBAcGFyZW50LmZpbGVcbiAgICAgICAgaWYgQGFjdGl2ZVJvdygpPy5pdGVtLnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgIHRhcmdldCA9IEBhY3RpdmVSb3coKS5pdGVtLmZpbGVcbiAgICAgICAgQGJyb3dzZXIuZHJvcEFjdGlvbiBhY3Rpb24sIHBhdGhzLCB0YXJnZXRcbiAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBvbktleTogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgeyBtb2QsIGtleSwgY29tYm8sIGNoYXIgfSA9IGtleWluZm8uZm9yRXZlbnQgZXZlbnRcblxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ3NoaWZ0K2AnICd+JyAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBicm93c2VyLmJyb3dzZSAnfidcbiAgICAgICAgICAgIHdoZW4gJy8nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBicm93c2VyLmJyb3dzZSAnLydcbiAgICAgICAgICAgIHdoZW4gJ2JhY2tzcGFjZScgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBicm93c2VyLm9uQmFja3NwYWNlSW5Db2x1bW4gQFxuICAgICAgICAgICAgd2hlbiAnZGVsZXRlJyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGJyb3dzZXIub25EZWxldGVJbkNvbHVtbiBAXG4gICAgICAgICAgICB3aGVuICdhbHQrbGVmdCcgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCB3aW5kb3cuc3BsaXQuZm9jdXMgJ3NoZWxmJ1xuICAgICAgICAgICAgd2hlbiAnYWx0K3NoaWZ0Ky4nICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGFkZFRvU2hlbGYoKVxuICAgICAgICAgICAgd2hlbiAnYWx0K2UnICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGV4cGxvcmVyKClcbiAgICAgICAgICAgIHdoZW4gJ2FsdCtuJyAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuZXdGb2xkZXIoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCt4JyAnY29tbWFuZCt4JyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGN1dFBhdGhzKClcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrYycgJ2NvbW1hbmQrYycgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBjb3B5UGF0aHMoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCt2JyAnY29tbWFuZCt2JyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHBhc3RlUGF0aHMoKVxuICAgICAgICAgICAgd2hlbiAncGFnZSB1cCcgJ3BhZ2UgZG93bicgJ2hvbWUnICdlbmQnIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJydhbHQrdXAnICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZUNvbHMga2V5XG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK3VwJyAnY3RybCt1cCcgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb3dzICdob21lJ1xuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtkb3duJyAnY3RybCtkb3duJyAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyAnZW5kJ1xuICAgICAgICAgICAgd2hlbiAnY3RybCt0JyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeVR5cGUoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCtuJyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeU5hbWUoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCthJyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeURhdGVBZGRlZCgpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2knICdjdHJsK2knICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAdG9nZ2xlRG90RmlsZXMoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtkJyAnY3RybCtkJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGR1cGxpY2F0ZUZpbGUoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtrJyAnY3RybCtrJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCBpZiBAYnJvd3Nlci5jbGVhblVwKCkgIyBuZWVkZWQ/XG4gICAgICAgICAgICB3aGVuICdmMicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYWN0aXZlUm93KCk/LmVkaXROYW1lKClcbiAgICAgICAgICAgIHdoZW4gJ3NoaWZ0K3VwJyAnc2hpZnQrZG93bicgJ3NoaWZ0K2hvbWUnICdzaGlmdCtlbmQnICdzaGlmdCtwYWdlIHVwJyAnc2hpZnQrcGFnZSBkb3duJyBcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAZXh0ZW5kU2VsZWN0aW9uIGtleVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtsZWZ0JyAnY29tbWFuZCtyaWdodCcgJ2N0cmwrbGVmdCcgJ2N0cmwrcmlnaHQnXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm9vdCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrYmFja3NwYWNlJyAnY3RybCtiYWNrc3BhY2UnICdjb21tYW5kK2RlbGV0ZScgJ2N0cmwrZGVsZXRlJyBcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbW92ZVRvVHJhc2goKVxuICAgICAgICAgICAgd2hlbiAndGFiJyAgICBcbiAgICAgICAgICAgICAgICBpZiBAc2VhcmNoLmxlbmd0aCB0aGVuIEBkb1NlYXJjaCAnJ1xuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnRcbiAgICAgICAgICAgIHdoZW4gJ2VzYydcbiAgICAgICAgICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgICAgICAgICBAZHJhZ0Rpdi5kcmFnLmRyYWdTdG9wKClcbiAgICAgICAgICAgICAgICAgICAgQGRyYWdEaXYucmVtb3ZlKClcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIEBkcmFnRGl2XG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKS5sZW5ndGggPiAxXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgQGFjdGl2ZVJvdygpXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAc2VhcmNoLmxlbmd0aCB0aGVuIEBjbGVhclNlYXJjaCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudFxuXG4gICAgICAgIGlmIGNvbWJvIGluIFsndXAnICAgJ2Rvd24nXSAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb3dzIGtleSAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNvbWJvIGluIFsnbGVmdCcgJ3JpZ2h0J10gdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVDb2xzIGtleVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG1vZCBpbiBbJ3NoaWZ0JyAnJ10gYW5kIGNoYXIgdGhlbiBAZG9TZWFyY2ggY2hhclxuICAgICAgICBcbiAgICAgICAgaWYgQGRyYWdEaXZcbiAgICAgICAgICAgIEB1cGRhdGVEcmFnSW5kaWNhdG9yIGV2ZW50XG4gICAgICAgICAgICBcbiAgICBvbktleVVwOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgQHVwZGF0ZURyYWdJbmRpY2F0b3IgZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBDb2x1bW5cblxuXG4iXX0=
//# sourceURL=../../coffee/browser/column.coffee