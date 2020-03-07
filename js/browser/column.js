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
        this.browser.skipOnDblClick = false;
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
            this.focus({
                activate: false
            });
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
        if (_.isNumber(row)) {
            return (0 <= row && row < this.numRows()) && this.rows[row] || null;
        } else if (_.isElement(row)) {
            return _.find(this.rows, function(r) {
                return r.div.contains(row);
            });
        } else if (_.isString(row)) {
            return _.find(this.rows, function(r) {
                return r.item.name === row || r.item.file === row;
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
        return (ref1 = this.row(event.target)) != null ? ref1.onMouseOver() : void 0;
    };

    Column.prototype.onMouseOut = function(event) {
        var ref1;
        return (ref1 = this.row(event.target)) != null ? ref1.onMouseOut() : void 0;
    };

    Column.prototype.onDblClick = function(event) {
        this.browser.skipOnDblClick = true;
        return this.navigateCols('enter');
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
            stateKey = "browser|showHidden|" + this.parent.file;
            if (window.state.get(stateKey)) {
                window.state.del(stateKey);
            } else {
                prefs.set(stateKey, true);
            }
            klog('toggleDotFiles');
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sdW1uLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9icm93c2VyIiwic291cmNlcyI6WyJjb2x1bW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHFNQUFBO0lBQUE7O0FBUUEsTUFBbUksT0FBQSxDQUFRLEtBQVIsQ0FBbkksRUFBRSxTQUFGLEVBQUssU0FBTCxFQUFRLGlCQUFSLEVBQWUsZUFBZixFQUFxQixlQUFyQixFQUEyQixpQkFBM0IsRUFBa0MsV0FBbEMsRUFBc0MsbUJBQXRDLEVBQThDLHFCQUE5QyxFQUF1RCxlQUF2RCxFQUE2RCxlQUE3RCxFQUFtRSxlQUFuRSxFQUF5RSxpQkFBekUsRUFBZ0YsZUFBaEYsRUFBc0YsaUJBQXRGLEVBQTZGLHVCQUE3RixFQUF1RyxpQkFBdkcsRUFBOEcseUJBQTlHLEVBQXlIOztBQUV6SCxHQUFBLEdBQVcsT0FBQSxDQUFRLE9BQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxTQUFSOztBQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFDWCxRQUFBLEdBQVcsT0FBQSxDQUFRLG1CQUFSOztBQUNYLElBQUEsR0FBVyxPQUFBLENBQVEsZUFBUjs7QUFDWCxLQUFBLEdBQVcsT0FBQSxDQUFRLE9BQVI7O0FBQ1gsR0FBQSxHQUFXLE9BQUEsQ0FBUSxLQUFSOztBQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsVUFBUjs7QUFFTDtJQUVDLGdCQUFDLE9BQUQ7QUFFQyxZQUFBO1FBRkEsSUFBQyxDQUFBLFVBQUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBRUEsSUFBQyxDQUFBLFdBQUQsR0FBZTtRQUNmLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsS0FBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUVWLElBQUMsQ0FBQSxHQUFELEdBQVcsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxl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QUFBLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBaEIsQ0FBQSxDQUF1QixDQUFDLE1BQXhCLEdBQWlDLENBQXBDO29CQUNELElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQWhCLENBQW9CLElBQUMsQ0FBQSxTQUFELENBQUEsQ0FBcEIsRUFEQztpQkFBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFYO29CQUF1QixJQUFDLENBQUEsV0FBRCxDQUFBLEVBQXZCOztBQUNMLHVCQUFPLFNBQUEsQ0FBVSxLQUFWO0FBeENmO1FBMENBLElBQUcsS0FBQSxLQUFVLElBQVYsSUFBQSxLQUFBLEtBQWlCLE1BQXBCO0FBQWtDLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxZQUFELENBQWMsR0FBZCxDQUFqQixFQUF6Qzs7UUFDQSxJQUFHLEtBQUEsS0FBVSxNQUFWLElBQUEsS0FBQSxLQUFpQixPQUFwQjtBQUFrQyxtQkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixJQUFDLENBQUEsWUFBRCxDQUFjLEdBQWQsQ0FBakIsRUFBekM7O1FBRUEsSUFBRyxDQUFBLEdBQUEsS0FBUSxPQUFSLElBQUEsR0FBQSxLQUFnQixFQUFoQixDQUFBLElBQXdCLElBQTNCO1lBQXFDLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixFQUFyQzs7UUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFKO21CQUNJLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixLQUFyQixFQURKOztJQW5ERzs7cUJBc0RQLE9BQUEsR0FBUyxTQUFDLEtBQUQ7UUFFTCxJQUFHLElBQUMsQ0FBQSxPQUFKO21CQUNJLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixLQUFyQixFQURKOztJQUZLOzs7Ozs7QUFLYixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMCAgIDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMFxuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgJCwgXywgY2xhbXAsIGRyYWcsIGVsZW0sIGVtcHR5LCBmcywga2Vycm9yLCBrZXlpbmZvLCBrbG9nLCBrcG9zLCBvcGVuLCBwb3B1cCwgcG9zdCwgcHJlZnMsIHNldFN0eWxlLCBzbGFzaCwgc3RvcEV2ZW50LCB2YWxpZCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Sb3cgICAgICA9IHJlcXVpcmUgJy4vcm93J1xuQ3J1bWIgICAgPSByZXF1aXJlICcuL2NydW1iJ1xuU2Nyb2xsZXIgPSByZXF1aXJlICcuL3Njcm9sbGVyJ1xuRGlyV2F0Y2ggPSByZXF1aXJlICcuLi90b29scy9kaXJ3YXRjaCdcbkZpbGUgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvZmlsZSdcbmZ1enp5ICAgID0gcmVxdWlyZSAnZnV6enknXG53eHcgICAgICA9IHJlcXVpcmUgJ3d4dydcbmVsZWN0cm9uID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5cbmNsYXNzIENvbHVtblxuICAgIFxuICAgIEA6IChAYnJvd3NlcikgLT5cbiAgICAgICAgXG4gICAgICAgIEBzZWFyY2hUaW1lciA9IG51bGxcbiAgICAgICAgQHNlYXJjaCA9ICcnXG4gICAgICAgIEBpdGVtcyAgPSBbXVxuICAgICAgICBAcm93cyAgID0gW11cbiAgICAgICAgXG4gICAgICAgIEBkaXYgICAgID0gZWxlbSBjbGFzczogJ2Jyb3dzZXJDb2x1bW4nICAgICAgICB0YWJJbmRleDo2IGlkOiBAbmFtZSgpXG4gICAgICAgIEBjb250ZW50ID0gZWxlbSBjbGFzczogJ2Jyb3dzZXJDb2x1bW5Db250ZW50JyBwYXJlbnQ6IEBkaXZcbiAgICAgICAgQHRhYmxlICAgPSBlbGVtIGNsYXNzOiAnYnJvd3NlckNvbHVtblRhYmxlJyAgIHBhcmVudDogQGNvbnRlbnRcbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLmNvbHM/LmFwcGVuZENoaWxkIEBkaXZcbiAgICAgICAgXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnZm9jdXMnICAgICBAb25Gb2N1c1xuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2JsdXInICAgICAgQG9uQmx1clxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2tleWRvd24nICAgQG9uS2V5XG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAna2V5dXAnICAgICBAb25LZXlVcFxuICAgICAgICBcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdtb3VzZW92ZXInIEBvbk1vdXNlT3ZlclxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlb3V0JyAgQG9uTW91c2VPdXRcblxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2RibGNsaWNrJyAgQG9uRGJsQ2xpY2tcbiAgICAgICAgXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnY29udGV4dG1lbnUnIEBvbkNvbnRleHRNZW51XG4gIFxuICAgICAgICBAZHJhZyA9IG5ldyBkcmFnXG4gICAgICAgICAgICB0YXJnZXQ6ICBAZGl2XG4gICAgICAgICAgICBvblN0YXJ0OiBAb25EcmFnU3RhcnRcbiAgICAgICAgICAgIG9uTW92ZTogIEBvbkRyYWdNb3ZlXG4gICAgICAgICAgICBvblN0b3A6ICBAb25EcmFnU3RvcFxuICAgICAgICBcbiAgICAgICAgQGNydW1iICA9IG5ldyBDcnVtYiBAXG4gICAgICAgIEBzY3JvbGwgPSBuZXcgU2Nyb2xsZXIgQCwgQGNvbnRlbnRcbiAgICAgICAgXG4gICAgICAgIEBzZXRJbmRleCBAYnJvd3Nlci5jb2x1bW5zPy5sZW5ndGhcbiAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgbG9hZEl0ZW1zOiAoaXRlbXMsIHBhcmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgICMga2xvZyBAcGFyZW50Py5maWxlLCBwYXJlbnQuZmlsZSwgaXRlbXMubGVuZ3RoXG4gICAgICAgIEBjbGVhcigpXG5cbiAgICAgICAgQHBhcmVudCA9IHBhcmVudFxuICAgICAgICBcbiAgICAgICAgaWYgQGluZGV4ID09IDAgb3IgQGluZGV4LTEgPCBAYnJvd3Nlci5udW1Db2xzKCkgYW5kIEBicm93c2VyLmNvbHVtbnNbQGluZGV4LTFdLmFjdGl2ZVJvdygpPy5pdGVtLm5hbWUgPT0gJy4uJyBhbmQgbm90IHNsYXNoLmlzUm9vdCBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIGlmIGl0ZW1zWzBdPy5uYW1lIG5vdCBpbiBbJy4uJyAnLyddXG4gICAgICAgICAgICAgICAgZGlyID0gQHBhcmVudC5maWxlXG4gICAgICAgICAgICAgICAgdXBkaXIgPSBzbGFzaC5kaXIgZGlyXG4gICAgICAgICAgICAgICAgaWYgdXBkaXIgIT0gZGlyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zLnVuc2hpZnRcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICcuLidcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiAgdXBkaXJcbiAgICAgICAgXG4gICAgICAgIEBpdGVtcyA9IGl0ZW1zXG4gIFxuICAgICAgICBAZGl2LmNsYXNzTGlzdC5yZW1vdmUgJ2Jyb3dzZXJDb2x1bW5Db2RlJ1xuICAgICAgICBcbiAgICAgICAgQGNydW1iLnNob3coKVxuICAgICAgICBcbiAgICAgICAgaWYgQHBhcmVudC50eXBlID09ICdkaXInXG4gICAgICAgICAgICAjIGtsb2cgJ2xvYWRJdGVtcycgQHBhcmVudC5maWxlXG4gICAgICAgICAgICBEaXJXYXRjaC53YXRjaCBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIEBjcnVtYi5zZXRGaWxlIEBwYXJlbnQuZmlsZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBGaWxlLmlzQ29kZSBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgICAgICBAY3J1bWIuc2V0RmlsZSBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgICAgICBAZGl2LmNsYXNzTGlzdC5hZGQgJ2Jyb3dzZXJDb2x1bW5Db2RlJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBAcGFyZW50LnR5cGUgPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICBrbG9nICd1bmRlZmluZWQgcGFyZW50IHR5cGU/J1xuICAgICAgICAgICAgQHBhcmVudC50eXBlID0gc2xhc2guaXNEaXIoQHBhcmVudC5maWxlKSBhbmQgJ2Rpcicgb3IgJ2ZpbGUnXG4gICAgICAgIFxuICAgICAgICBrZXJyb3IgXCJubyBwYXJlbnQgaXRlbT9cIiBpZiBub3QgQHBhcmVudD9cbiAgICAgICAga2Vycm9yIFwibG9hZEl0ZW1zIC0tIG5vIHBhcmVudCB0eXBlP1wiLCBAcGFyZW50IGlmIG5vdCBAcGFyZW50LnR5cGU/XG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBAaXRlbXNcbiAgICAgICAgICAgIGZvciBpdGVtIGluIEBpdGVtc1xuICAgICAgICAgICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIFxuICAgICAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSAnZGlyJyBhbmQgc2xhc2guc2FtZVBhdGggJ34vRG93bmxvYWRzJyBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIEBzb3J0QnlEYXRlQWRkZWQoKVxuICAgICAgICBAXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICB1cGRhdGVEcmFnSW5kaWNhdG9yOiAoZXZlbnQpIC0+XG4gICAgICAgIFxuICAgICAgICBAZHJhZ0luZD8uY2xhc3NMaXN0LnRvZ2dsZSAnY29weScgZXZlbnQuc2hpZnRLZXlcbiAgICAgICAgQGRyYWdJbmQ/LmNsYXNzTGlzdC50b2dnbGUgJ21vdmUnIGV2ZW50LmN0cmxLZXkgb3IgZXZlbnQubWV0YUtleSBvciBldmVudC5hbHRLZXlcbiAgICBcbiAgICBvbkRyYWdTdGFydDogKGQsIGUpID0+IFxuICAgIFxuICAgICAgICBAZHJhZ1N0YXJ0Um93ID0gQHJvdyBlLnRhcmdldFxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuc2tpcE9uRGJsQ2xpY2sgPSBmYWxzZVxuICAgICAgICBcbiAgICAgICAgZGVsZXRlIEB0b2dnbGVcbiAgICAgICAgXG4gICAgICAgIGlmIEBkcmFnU3RhcnRSb3dcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgZS5zaGlmdEtleVxuICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC50byBAZHJhZ1N0YXJ0Um93XG4gICAgICAgICAgICBlbHNlIGlmIGUubWV0YUtleSBvciBlLmFsdEtleSBvciBlLmN0cmxLZXlcbiAgICAgICAgICAgICAgICBpZiBub3QgQGRyYWdTdGFydFJvdy5pc1NlbGVjdGVkKClcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnRvZ2dsZSBAZHJhZ1N0YXJ0Um93XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAdG9nZ2xlID0gdHJ1ZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlmIEBkcmFnU3RhcnRSb3cuaXNTZWxlY3RlZCgpXG4gICAgICAgICAgICAgICAgICAgIEBkZXNlbGVjdCA9IHRydWVcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBhY3RpdmVSb3coKT8uY2xlYXJBY3RpdmUoKVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3Qucm93IEBkcmFnU3RhcnRSb3csIGZhbHNlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIEBoYXNGb2N1cygpIGFuZCBAYWN0aXZlUm93KClcbiAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3Qucm93IEBhY3RpdmVSb3coKVxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAgIDAgICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgb25EcmFnTW92ZTogKGQsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBkcmFnU3RhcnRSb3cgYW5kIG5vdCBAZHJhZ0RpdiBhbmQgdmFsaWQgQGJyb3dzZXIuc2VsZWN0LmZpbGVzKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGlmIE1hdGguYWJzKGQuZGVsdGFTdW0ueCkgPCAyMCBhbmQgTWF0aC5hYnMoZC5kZWx0YVN1bS55KSA8IDEwXG5cbiAgICAgICAgICAgIGRlbGV0ZSBAdG9nZ2xlIFxuICAgICAgICAgICAgZGVsZXRlIEBkZXNlbGVjdFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZHJhZ0RpdiA9IGVsZW0gJ2RpdidcbiAgICAgICAgICAgIEBkcmFnRGl2LmRyYWcgPSBkXG4gICAgICAgICAgICBAZHJhZ0Rpdi5maWxlcyA9IEBicm93c2VyLnNlbGVjdC5maWxlcygpXG4gICAgICAgICAgICBwb3MgPSBrcG9zIGUucGFnZVgsIGUucGFnZVlcbiAgICAgICAgICAgIHJvdyA9IEBicm93c2VyLnNlbGVjdC5yb3dzWzBdXG5cbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLnBvc2l0aW9uICAgICAgPSAnYWJzb2x1dGUnXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS5vcGFjaXR5ICAgICAgID0gXCIwLjdcIlxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUudG9wICAgICAgICAgICA9IFwiI3twb3MueS1kLmRlbHRhU3VtLnl9cHhcIlxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUubGVmdCAgICAgICAgICA9IFwiI3twb3MueC1kLmRlbHRhU3VtLnh9cHhcIlxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUud2lkdGggICAgICAgICA9IFwiI3tAd2lkdGgoKS0xMn1weFwiXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBkcmFnSW5kID0gZWxlbSBjbGFzczonZHJhZ0luZGljYXRvcidcbiAgICAgICAgICAgIEBkcmFnRGl2LmFwcGVuZENoaWxkIEBkcmFnSW5kXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciByb3cgaW4gQGJyb3dzZXIuc2VsZWN0LnJvd3NcbiAgICAgICAgICAgICAgICByb3dDbG9uZSA9IHJvdy5kaXYuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgICAgICAgICByb3dDbG9uZS5zdHlsZS5mbGV4ICAgICAgICAgID0gJ3Vuc2V0J1xuICAgICAgICAgICAgICAgIHJvd0Nsb25lLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSdcbiAgICAgICAgICAgICAgICByb3dDbG9uZS5zdHlsZS5ib3JkZXIgICAgICAgID0gJ25vbmUnXG4gICAgICAgICAgICAgICAgcm93Q2xvbmUuc3R5bGUubWFyZ2luQm90dG9tICA9ICctMXB4J1xuICAgICAgICAgICAgICAgIEBkcmFnRGl2LmFwcGVuZENoaWxkIHJvd0Nsb25lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkIEBkcmFnRGl2XG4gICAgICAgICAgICBAZm9jdXMgYWN0aXZhdGU6ZmFsc2VcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBvblNwcmluZ0xvYWRUaW1lb3V0ID0gPT5cbiAgICAgICAgICAgICAgICBpZiBjb2x1bW4gPSBAYnJvd3Nlci5jb2x1bW5Gb3JGaWxlIEBicm93c2VyLnNwcmluZ0xvYWRUYXJnZXRcbiAgICAgICAgICAgICAgICAgICAgaWYgcm93ID0gY29sdW1uLnJvdyBAYnJvd3Nlci5zcHJpbmdMb2FkVGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgICAgICByb3cuYWN0aXZhdGUoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0IEBicm93c2VyLnNwcmluZ0xvYWRUaW1lclxuICAgICAgICAgICAgZGVsZXRlIEBicm93c2VyLnNwcmluZ0xvYWRUYXJnZXRcbiAgICAgICAgICAgIGlmIHJvdyA9IEBicm93c2VyLnJvd0F0UG9zIGQucG9zXG4gICAgICAgICAgICAgICAgaWYgcm93Lml0ZW0udHlwZSA9PSAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zcHJpbmdMb2FkVGltZXIgPSBzZXRUaW1lb3V0IG9uU3ByaW5nTG9hZFRpbWVvdXQsIDEwMDBcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc3ByaW5nTG9hZFRhcmdldCA9IHJvdy5pdGVtLmZpbGVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQHVwZGF0ZURyYWdJbmRpY2F0b3IgZSBcbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlWCgje2QuZGVsdGFTdW0ueH1weCkgdHJhbnNsYXRlWSgje2QuZGVsdGFTdW0ueX1weClcIlxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgXG4gICAgXG4gICAgb25EcmFnU3RvcDogKGQsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIGNsZWFyVGltZW91dCBAYnJvd3Nlci5zcHJpbmdMb2FkVGltZXJcbiAgICAgICAgZGVsZXRlIEBicm93c2VyLnNwcmluZ0xvYWRUYXJnZXRcbiAgICAgICAgXG4gICAgICAgIGlmIEBkcmFnRGl2P1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZHJhZ0Rpdi5yZW1vdmUoKVxuICAgICAgICAgICAgZmlsZXMgPSBAZHJhZ0Rpdi5maWxlc1xuICAgICAgICAgICAgZGVsZXRlIEBkcmFnRGl2XG4gICAgICAgICAgICBkZWxldGUgQGRyYWdTdGFydFJvd1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiByb3cgPSBAYnJvd3Nlci5yb3dBdFBvcyBkLnBvc1xuICAgICAgICAgICAgICAgIGNvbHVtbiA9IHJvdy5jb2x1bW5cbiAgICAgICAgICAgICAgICB0YXJnZXQgPSByb3cuaXRlbS5maWxlXG4gICAgICAgICAgICBlbHNlIGlmIGNvbHVtbiA9IEBicm93c2VyLmNvbHVtbkF0UG9zIGQucG9zXG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gY29sdW1uLnBhcmVudD8uZmlsZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGtsb2cgJ25vIGRyb3AgdGFyZ2V0J1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGFjdGlvbiA9IGUuc2hpZnRLZXkgYW5kICdjb3B5JyBvciAnbW92ZSdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGNvbHVtbiA9PSBAYnJvd3Nlci5zaGVsZiBcbiAgICAgICAgICAgICAgICBpZiB0YXJnZXQgYW5kIChlLmN0cmxLZXkgb3IgZS5zaGlmdEtleSBvciBlLm1ldGFLZXkgb3IgZS5hbHRLZXkpXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLmRyb3BBY3Rpb24gYWN0aW9uLCBmaWxlcywgdGFyZ2V0XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zaGVsZi5hZGRGaWxlcyBmaWxlcywgcG9zOmQucG9zXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGJyb3dzZXIuZHJvcEFjdGlvbiBhY3Rpb24sIGZpbGVzLCB0YXJnZXRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZm9jdXMgYWN0aXZhdGU6ZmFsc2VcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgcm93ID0gQHJvdyBlLnRhcmdldFxuICAgICAgICAgICAgICAgIGlmIHJvdy5pc1NlbGVjdGVkKClcbiAgICAgICAgICAgICAgICAgICAgaWYgZS5tZXRhS2V5IG9yIGUuYWx0S2V5IG9yIGUuY3RybEtleSBvciBlLnNoaWZ0S2V5XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBAdG9nZ2xlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIEB0b2dnbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3QudG9nZ2xlIHJvd1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBAZGVzZWxlY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgQGRlc2VsZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyByb3dcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3cuYWN0aXZhdGUoKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBhY3RpdmVSb3coKT8uY2xlYXJBY3RpdmUoKVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAgMCAgICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICByZW1vdmVGaWxlOiAoZmlsZSkgPT4gXG4gICAgICAgIFxuICAgICAgICBpZiByb3cgPSBAcm93IHNsYXNoLmZpbGUgZmlsZVxuICAgICAgICAgICAgQHJlbW92ZVJvdyByb3dcbiAgICAgICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIGluc2VydEZpbGU6IChmaWxlKSA9PiBcblxuICAgICAgICBpdGVtID0gQGJyb3dzZXIuZmlsZUl0ZW0gZmlsZVxuICAgICAgICByb3cgPSBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgQHJvd3MucHVzaCByb3dcbiAgICAgICAgcm93XG4gICAgICAgICAgICBcbiAgICAjIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICB1bnNoaWZ0SXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIFxuICAgICAgICBAaXRlbXMudW5zaGlmdCBpdGVtXG4gICAgICAgIEByb3dzLnVuc2hpZnQgbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIEB0YWJsZS5pbnNlcnRCZWZvcmUgQHRhYmxlLmxhc3RDaGlsZCwgQHRhYmxlLmZpcnN0Q2hpbGRcbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAcm93c1swXVxuICAgICAgICBcbiAgICBwdXNoSXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIFxuICAgICAgICBAaXRlbXMucHVzaCBpdGVtXG4gICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgQHJvd3NbLTFdXG4gICAgICAgIFxuICAgIGFkZEl0ZW06IChpdGVtKSAtPlxuICAgICAgICBcbiAgICAgICAgcm93ID0gQHB1c2hJdGVtIGl0ZW1cbiAgICAgICAgQHNvcnRCeU5hbWUoKVxuICAgICAgICByb3dcblxuICAgIHNldEl0ZW1zOiAoQGl0ZW1zLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5jbGVhckNvbHVtbiBAaW5kZXhcbiAgICAgICAgXG4gICAgICAgIEBwYXJlbnQgPSBvcHQucGFyZW50XG4gICAgICAgIGtlcnJvciBcIm5vIHBhcmVudCBpdGVtP1wiIGlmIG5vdCBAcGFyZW50P1xuICAgICAgICBrZXJyb3IgXCJzZXRJdGVtcyAtLSBubyBwYXJlbnQgdHlwZT9cIiwgQHBhcmVudCBpZiBub3QgQHBhcmVudC50eXBlP1xuICAgICAgICBcbiAgICAgICAgZm9yIGl0ZW0gaW4gQGl0ZW1zXG4gICAgICAgICAgICBAcm93cy5wdXNoIG5ldyBSb3cgQCwgaXRlbVxuICAgICAgICBcbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAXG5cbiAgICAjIDAwICAgICAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgIFxuICAgICAgICBcbiAgICBpc0RpcjogIC0+IEBwYXJlbnQ/LnR5cGUgPT0gJ2RpcicgXG4gICAgaXNGaWxlOiAtPiBAcGFyZW50Py50eXBlID09ICdmaWxlJyBcbiAgICAgICAgXG4gICAgaXNFbXB0eTogLT4gZW1wdHkgQHBhcmVudFxuICAgIGNsZWFyOiAgIC0+XG4gICAgICAgIGlmIEBwYXJlbnQ/LmZpbGUgYW5kIEBwYXJlbnQ/LnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICMga2xvZyAnY29sdW1uLmNsZWFyIHVud2F0Y2g/JyBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIERpcldhdGNoLnVud2F0Y2ggQHBhcmVudC5maWxlXG4gICAgICAgIGRlbGV0ZSBAcGFyZW50XG4gICAgICAgIEBjbGVhclNlYXJjaCgpXG4gICAgICAgIEBkaXYuc2Nyb2xsVG9wID0gMFxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgQGNydW1iLmNsZWFyKClcbiAgICAgICAgQHJvd3MgPSBbXVxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgICAgIFxuICAgIHNldEluZGV4OiAoQGluZGV4KSAtPlxuICAgICAgICBcbiAgICAgICAgQGNydW1iPy5lbGVtLmNvbHVtbkluZGV4ID0gQGluZGV4XG4gICAgICAgIFxuICAgIHdpZHRoOiAtPiBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwICAgICAgMDAwMDAwMDAgIFxuICAgXG4gICAgYWN0aXZhdGVSb3c6IChyb3cpIC0+IEByb3cocm93KT8uYWN0aXZhdGUoKVxuICAgICAgIFxuICAgIGFjdGl2ZVJvdzogLT4gXy5maW5kIEByb3dzLCAocikgLT4gci5pc0FjdGl2ZSgpXG4gICAgYWN0aXZlUGF0aDogLT4gQGFjdGl2ZVJvdygpPy5wYXRoKCkgPyBAcGFyZW50LmZpbGVcbiAgICBcbiAgICByb3c6IChyb3cpIC0+ICMgYWNjZXB0cyBlbGVtZW50LCBpbmRleCwgc3RyaW5nIG9yIHJvd1xuICAgICAgICBpZiAgICAgIF8uaXNOdW1iZXIgIHJvdyB0aGVuIHJldHVybiAwIDw9IHJvdyA8IEBudW1Sb3dzKCkgYW5kIEByb3dzW3Jvd10gb3IgbnVsbFxuICAgICAgICBlbHNlIGlmIF8uaXNFbGVtZW50IHJvdyB0aGVuIHJldHVybiBfLmZpbmQgQHJvd3MsIChyKSAtPiByLmRpdi5jb250YWlucyByb3dcbiAgICAgICAgZWxzZSBpZiBfLmlzU3RyaW5nICByb3cgdGhlbiByZXR1cm4gXy5maW5kIEByb3dzLCAocikgLT4gci5pdGVtLm5hbWUgPT0gcm93IG9yIHIuaXRlbS5maWxlID09IHJvd1xuICAgICAgICBlbHNlIHJldHVybiByb3dcbiAgICAgICAgICAgIFxuICAgIG5leHRDb2x1bW46IC0+IEBicm93c2VyLmNvbHVtbiBAaW5kZXgrMVxuICAgIHByZXZDb2x1bW46IC0+IEBicm93c2VyLmNvbHVtbiBAaW5kZXgtMVxuICAgICAgICBcbiAgICBuYW1lOiAtPiBcIiN7QGJyb3dzZXIubmFtZX06I3tAaW5kZXh9XCJcbiAgICBwYXRoOiAtPiBAcGFyZW50Py5maWxlID8gJydcbiAgICAgICAgXG4gICAgbnVtUm93czogICAgLT4gQHJvd3MubGVuZ3RoID8gMCAgIFxuICAgIHJvd0hlaWdodDogIC0+IEByb3dzWzBdPy5kaXYuY2xpZW50SGVpZ2h0ID8gMFxuICAgIG51bVZpc2libGU6IC0+IEByb3dIZWlnaHQoKSBhbmQgcGFyc2VJbnQoQGJyb3dzZXIuaGVpZ2h0KCkgLyBAcm93SGVpZ2h0KCkpIG9yIDBcbiAgICBcbiAgICByb3dBdFBvczogKHBvcykgLT4gQHJvdyBAcm93SW5kZXhBdFBvcyBwb3NcbiAgICBcbiAgICByb3dJbmRleEF0UG9zOiAocG9zKSAtPlxuICAgICAgICBkeSA9IHBvcy55IC0gQGNvbnRlbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG4gICAgICAgIGlmIGR5ID49IDBcbiAgICAgICAgICAgIE1hdGguZmxvb3IgZHkvQHJvd0hlaWdodCgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIC0xICAgICAgICAgICAgXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgaGFzRm9jdXM6IC0+IEBkaXYuY2xhc3NMaXN0LmNvbnRhaW5zICdmb2N1cydcblxuICAgIGZvY3VzOiAob3B0PXt9KSAtPlxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBub3QgQGFjdGl2ZVJvdygpIGFuZCBAbnVtUm93cygpIGFuZCBvcHQ/LmFjdGl2YXRlICE9IGZhbHNlXG4gICAgICAgICAgICBAcm93c1swXS5zZXRBY3RpdmUoKVxuICAgICAgICAgICAgXG4gICAgICAgIEBkaXYuZm9jdXMoKVxuICAgICAgICBAZGl2LmNsYXNzTGlzdC5hZGQgJ2ZvY3VzJ1xuICAgICAgICB3aW5kb3cuc2V0TGFzdEZvY3VzIEBuYW1lKClcbiAgICAgICAgQFxuICAgICAgICBcbiAgICBvbkZvY3VzOiA9PiBAZGl2LmNsYXNzTGlzdC5hZGQgJ2ZvY3VzJ1xuICAgIG9uQmx1cjogID0+IEBkaXYuY2xhc3NMaXN0LnJlbW92ZSAnZm9jdXMnXG5cbiAgICBmb2N1c0Jyb3dzZXI6IC0+IEBicm93c2VyLmZvY3VzKClcbiAgICBcbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG9uTW91c2VPdmVyOiAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8ub25Nb3VzZU92ZXIoKVxuICAgIG9uTW91c2VPdXQ6ICAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8ub25Nb3VzZU91dCgpXG4gICAgXG4gICAgb25EYmxDbGljazogIChldmVudCkgPT4gXG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5za2lwT25EYmxDbGljayA9IHRydWVcbiAgICAgICAgQG5hdmlnYXRlQ29scyAnZW50ZXInXG4gICAgXG4gICAgZXh0ZW5kU2VsZWN0aW9uOiAoa2V5KSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGVycm9yIFwibm8gcm93cyBpbiBjb2x1bW4gI3tAaW5kZXh9P1wiIGlmIG5vdCBAbnVtUm93cygpICAgICAgICBcbiAgICAgICAgaW5kZXggPSBAYWN0aXZlUm93KCk/LmluZGV4KCkgPyAtMVxuICAgICAgICBlcnJvciBcIm5vIGluZGV4IGZyb20gYWN0aXZlUm93PyAje2luZGV4fT9cIiwgQGFjdGl2ZVJvdygpIGlmIG5vdCBpbmRleD8gb3IgTnVtYmVyLmlzTmFOIGluZGV4XG4gICAgICAgICAgICBcbiAgICAgICAgdG9JbmRleCA9IHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgICAgICAgdGhlbiBpbmRleC0xXG4gICAgICAgICAgICB3aGVuICdkb3duJyAgICAgIHRoZW4gaW5kZXgrMVxuICAgICAgICAgICAgd2hlbiAnaG9tZScgICAgICB0aGVuIDBcbiAgICAgICAgICAgIHdoZW4gJ2VuZCcgICAgICAgdGhlbiBAbnVtUm93cygpLTFcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICAgdGhlbiBNYXRoLm1heCAwLCBpbmRleC1AbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gTWF0aC5taW4gQG51bVJvd3MoKS0xLCBpbmRleCtAbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICBlbHNlIGluZGV4XG4gICAgXG4gICAgICAgIEBicm93c2VyLnNlbGVjdC50byBAcm93KHRvSW5kZXgpLCB0cnVlXG4gICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuXG4gICAgbmF2aWdhdGVSb3dzOiAoa2V5KSAtPlxuXG4gICAgICAgIHJldHVybiBlcnJvciBcIm5vIHJvd3MgaW4gY29sdW1uICN7QGluZGV4fT9cIiBpZiBub3QgQG51bVJvd3MoKVxuICAgICAgICBpbmRleCA9IEBhY3RpdmVSb3coKT8uaW5kZXgoKSA/IC0xXG4gICAgICAgIGVycm9yIFwibm8gaW5kZXggZnJvbSBhY3RpdmVSb3c/ICN7aW5kZXh9P1wiIEBhY3RpdmVSb3coKSBpZiBub3QgaW5kZXg/IG9yIE51bWJlci5pc05hTiBpbmRleFxuICAgICAgICBcbiAgICAgICAgbmV3SW5kZXggPSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICd1cCcgICAgICAgIHRoZW4gaW5kZXgtMVxuICAgICAgICAgICAgd2hlbiAnZG93bicgICAgICB0aGVuIGluZGV4KzFcbiAgICAgICAgICAgIHdoZW4gJ2hvbWUnICAgICAgdGhlbiAwXG4gICAgICAgICAgICB3aGVuICdlbmQnICAgICAgIHRoZW4gQG51bVJvd3MoKS0xXG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAgIHRoZW4gaW5kZXgtQG51bVZpc2libGUoKVxuICAgICAgICAgICAgd2hlbiAncGFnZSBkb3duJyB0aGVuIGluZGV4K0BudW1WaXNpYmxlKClcbiAgICAgICAgICAgIGVsc2UgaW5kZXhcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBub3QgbmV3SW5kZXg/IG9yIE51bWJlci5pc05hTiBuZXdJbmRleCAgICAgICAgXG4gICAgICAgICAgICBlcnJvciBcIm5vIGluZGV4ICN7bmV3SW5kZXh9PyAje0BudW1WaXNpYmxlKCl9XCJcbiAgICAgICAgICAgIFxuICAgICAgICBuZXdJbmRleCA9IGNsYW1wIDAgQG51bVJvd3MoKS0xIG5ld0luZGV4XG4gICAgICAgIFxuICAgICAgICBpZiBuZXdJbmRleCAhPSBpbmRleFxuICAgICAgICAgICAgQHJvd3NbbmV3SW5kZXhdLmFjdGl2YXRlIG51bGwgQHBhcmVudC50eXBlPT0nZmlsZSdcbiAgICBcbiAgICBuYXZpZ2F0ZUNvbHM6IChrZXkpIC0+ICMgbW92ZSB0byBmaWxlIGJyb3dzZXI/XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICd1cCcgICAgdGhlbiBAYnJvd3Nlci5uYXZpZ2F0ZSAndXAnXG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiBAYnJvd3Nlci5uYXZpZ2F0ZSAnbGVmdCdcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuIEBicm93c2VyLm5hdmlnYXRlICdyaWdodCdcbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJ1xuICAgICAgICAgICAgICAgIGlmIGl0ZW0gPSBAYWN0aXZlUm93KCk/Lml0ZW1cbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9IGl0ZW0udHlwZVxuICAgICAgICAgICAgICAgICAgICBpZiB0eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5sb2FkSXRlbSBpdGVtXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUbycgaXRlbVxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdmb2N1cycgJ2VkaXRvcidcbiAgICAgICAgQFxuXG4gICAgbmF2aWdhdGVSb290OiAoa2V5KSAtPiBcbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLmJyb3dzZSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiBzbGFzaC5kaXIgQHBhcmVudC5maWxlXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgdGhlbiBAYWN0aXZlUm93KCkuaXRlbS5maWxlXG4gICAgICAgIEBcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAgMDAwMDAwMDAwICAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgXG4gICAgXG4gICAgZG9TZWFyY2g6IChjaGFyKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbnVtUm93cygpXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQHNlYXJjaERpdlxuICAgICAgICAgICAgQHNlYXJjaERpdiA9IGVsZW0gY2xhc3M6ICdicm93c2VyU2VhcmNoJ1xuICAgICAgICAgICAgXG4gICAgICAgIEBzZXRTZWFyY2ggQHNlYXJjaCArIGNoYXJcbiAgICAgICAgXG4gICAgYmFja3NwYWNlU2VhcmNoOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQHNlYXJjaERpdiBhbmQgQHNlYXJjaC5sZW5ndGhcbiAgICAgICAgICAgIEBzZXRTZWFyY2ggQHNlYXJjaFswLi4uQHNlYXJjaC5sZW5ndGgtMV1cbiAgICAgICAgICAgIFxuICAgIHNldFNlYXJjaDogKEBzZWFyY2gpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBzZWFyY2hUaW1lclxuICAgICAgICBAc2VhcmNoVGltZXIgPSBzZXRUaW1lb3V0IEBjbGVhclNlYXJjaCwgMjAwMFxuICAgICAgICBcbiAgICAgICAgQHNlYXJjaERpdi50ZXh0Q29udGVudCA9IEBzZWFyY2hcblxuICAgICAgICBhY3RpdmVJbmRleCAgPSBAYWN0aXZlUm93KCk/LmluZGV4KCkgPyAwXG4gICAgICAgIGFjdGl2ZUluZGV4ICs9IDEgaWYgKEBzZWFyY2gubGVuZ3RoID09IDEpICNvciAoY2hhciA9PSAnJylcbiAgICAgICAgYWN0aXZlSW5kZXggID0gMCBpZiBhY3RpdmVJbmRleCA+PSBAbnVtUm93cygpXG4gICAgICAgIFxuICAgICAgICBmb3Igcm93cyBpbiBbQHJvd3Muc2xpY2UoYWN0aXZlSW5kZXgpLCBAcm93cy5zbGljZSgwLGFjdGl2ZUluZGV4KzEpXVxuICAgICAgICAgICAgZnV6emllZCA9IGZ1enp5LmZpbHRlciBAc2VhcmNoLCByb3dzLCBleHRyYWN0OiAocikgLT4gci5pdGVtLm5hbWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgZnV6emllZC5sZW5ndGhcbiAgICAgICAgICAgICAgICByb3cgPSBmdXp6aWVkWzBdLm9yaWdpbmFsXG4gICAgICAgICAgICAgICAgcm93LmRpdi5hcHBlbmRDaGlsZCBAc2VhcmNoRGl2XG4gICAgICAgICAgICAgICAgcm93LmFjdGl2YXRlKClcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICBAXG4gICAgXG4gICAgY2xlYXJTZWFyY2g6ID0+XG4gICAgICAgIFxuICAgICAgICBAc2VhcmNoID0gJydcbiAgICAgICAgQHNlYXJjaERpdj8ucmVtb3ZlKClcbiAgICAgICAgZGVsZXRlIEBzZWFyY2hEaXZcbiAgICAgICAgQFxuICAgIFxuICAgIHJlbW92ZU9iamVjdDogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIHJvdyA9IEBhY3RpdmVSb3coKVxuICAgICAgICAgICAgbmV4dE9yUHJldiA9IHJvdy5uZXh0KCkgPyByb3cucHJldigpXG4gICAgICAgICAgICBAcmVtb3ZlUm93IHJvd1xuICAgICAgICAgICAgbmV4dE9yUHJldj8uYWN0aXZhdGUoKVxuICAgICAgICBAXG5cbiAgICByZW1vdmVSb3c6IChyb3cpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiByb3cgPT0gQGFjdGl2ZVJvdygpXG4gICAgICAgICAgICBpZiBAbmV4dENvbHVtbigpPy5wYXJlbnQ/LmZpbGUgPT0gcm93Lml0ZW0/LmZpbGVcbiAgICAgICAgICAgICAgICBAYnJvd3Nlci5jbGVhckNvbHVtbnNGcm9tIEBpbmRleCArIDFcbiAgICAgICAgICAgIFxuICAgICAgICByb3cuZGl2LnJlbW92ZSgpXG4gICAgICAgIEBpdGVtcy5zcGxpY2Ugcm93LmluZGV4KCksIDFcbiAgICAgICAgQHJvd3Muc3BsaWNlIHJvdy5pbmRleCgpLCAxXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHNvcnRCeU5hbWU6ID0+XG4gICAgICAgICBcbiAgICAgICAgQHJvd3Muc29ydCAoYSxiKSAtPiBcbiAgICAgICAgICAgIChhLml0ZW0udHlwZSArIGEuaXRlbS5uYW1lKS5sb2NhbGVDb21wYXJlKGIuaXRlbS50eXBlICsgYi5pdGVtLm5hbWUpXG4gICAgICAgICAgICBcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3NcbiAgICAgICAgICAgIEB0YWJsZS5hcHBlbmRDaGlsZCByb3cuZGl2XG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgc29ydEJ5VHlwZTogPT5cbiAgICAgICAgXG4gICAgICAgIEByb3dzLnNvcnQgKGEsYikgLT4gXG4gICAgICAgICAgICBhdHlwZSA9IGEuaXRlbS50eXBlID09ICdmaWxlJyBhbmQgc2xhc2guZXh0KGEuaXRlbS5uYW1lKSBvciAnX19fJyAjYS5pdGVtLnR5cGVcbiAgICAgICAgICAgIGJ0eXBlID0gYi5pdGVtLnR5cGUgPT0gJ2ZpbGUnIGFuZCBzbGFzaC5leHQoYi5pdGVtLm5hbWUpIG9yICdfX18nICNiLml0ZW0udHlwZVxuICAgICAgICAgICAgKGEuaXRlbS50eXBlICsgYXR5cGUgKyBhLml0ZW0ubmFtZSkubG9jYWxlQ29tcGFyZShiLml0ZW0udHlwZSArIGJ0eXBlICsgYi5pdGVtLm5hbWUsIHVuZGVmaW5lZCwgbnVtZXJpYzp0cnVlKVxuICAgICAgICAgICAgXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBmb3Igcm93IGluIEByb3dzXG4gICAgICAgICAgICBAdGFibGUuYXBwZW5kQ2hpbGQgcm93LmRpdlxuICAgICAgICBAXG5cbiAgICBzb3J0QnlEYXRlQWRkZWQ6ID0+XG4gICAgICAgIFxuICAgICAgICBAcm93cy5zb3J0IChhLGIpIC0+IGIuaXRlbS5zdGF0Py5hdGltZU1zIC0gYS5pdGVtLnN0YXQ/LmF0aW1lTXNcbiAgICAgICAgICAgIFxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgZm9yIHJvdyBpbiBAcm93c1xuICAgICAgICAgICAgQHRhYmxlLmFwcGVuZENoaWxkIHJvdy5kaXZcbiAgICAgICAgQFxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgdG9nZ2xlRG90RmlsZXM6ID0+XG5cbiAgICAgICAgaWYgQHBhcmVudC50eXBlID09IHVuZGVmaW5lZFxuICAgICAgICAgICAgQHBhcmVudC50eXBlID0gc2xhc2guaXNEaXIoQHBhcmVudC5maWxlKSBhbmQgJ2Rpcicgb3IgJ2ZpbGUnXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQHBhcmVudC50eXBlID09ICdkaXInICAgICAgICAgICAgXG4gICAgICAgICAgICBzdGF0ZUtleSA9IFwiYnJvd3NlcnxzaG93SGlkZGVufCN7QHBhcmVudC5maWxlfVwiXG4gICAgICAgICAgICBpZiB3aW5kb3cuc3RhdGUuZ2V0IHN0YXRlS2V5XG4gICAgICAgICAgICAgICAgd2luZG93LnN0YXRlLmRlbCBzdGF0ZUtleVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHByZWZzLnNldCBzdGF0ZUtleSwgdHJ1ZVxuICAgICAgICAgICAga2xvZyAndG9nZ2xlRG90RmlsZXMnXG4gICAgICAgICAgICBAYnJvd3Nlci5sb2FkRGlySXRlbSBAcGFyZW50LCBAaW5kZXgsIGlnbm9yZUNhY2hlOnRydWVcbiAgICAgICAgQFxuICAgICAgICAgXG4gICAgdG9nZ2xlRXh0ZW5zaW9uczogPT5cblxuICAgICAgICBzdGF0ZUtleSA9IFwiYnJvd3NlcnxoaWRlRXh0ZW5zaW9uc1wiXG4gICAgICAgIHdpbmRvdy5zdGF0ZS5zZXQgc3RhdGVLZXksIG5vdCB3aW5kb3cuc3RhdGUuZ2V0IHN0YXRlS2V5LCBmYWxzZVxuICAgICAgICBzZXRTdHlsZSAnLmJyb3dzZXJSb3cgLmV4dCcgJ2Rpc3BsYXknIHdpbmRvdy5zdGF0ZS5nZXQoc3RhdGVLZXkpIGFuZCAnbm9uZScgb3IgJ2luaXRpYWwnXG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG1vdmVUb1RyYXNoOiA9PlxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBAYnJvd3Nlci5zZWxlY3QuZnJlZUluZGV4KClcbiAgICAgICAgaWYgaW5kZXggPj0gMFxuICAgICAgICAgICAgc2VsZWN0Um93ID0gQHJvdyBpbmRleFxuICAgICAgICBcbiAgICAgICAgZm9yIHJvdyBpbiBAYnJvd3Nlci5zZWxlY3Qucm93c1xuICAgICAgICAgICAgd3h3ICd0cmFzaCcgcm93LnBhdGgoKVxuICAgICAgICAgICAgQHJlbW92ZVJvdyByb3dcbiAgICAgICAgICAgXG4gICAgICAgIGlmIHNlbGVjdFJvd1xuICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyBzZWxlY3RSb3dcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG5hdmlnYXRlQ29scyAnbGVmdCdcblxuICAgIGFkZFRvU2hlbGY6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBwYXRoVG9TaGVsZiA9IEBhY3RpdmVQYXRoKClcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnYWRkVG9TaGVsZicgcGF0aFRvU2hlbGZcbiAgICAgICAgXG4gICAgbmV3Rm9sZGVyOiA9PlxuICAgICAgICBcbiAgICAgICAgc2xhc2gudW51c2VkIHNsYXNoLmpvaW4oQHBhdGgoKSwgJ05ldyBmb2xkZXInKSwgKG5ld0RpcikgPT5cbiAgICAgICAgICAgIGZzLm1rZGlyIG5ld0RpciwgKGVycikgPT5cbiAgICAgICAgICAgICAgICBpZiBlbXB0eSBlcnJcbiAgICAgICAgICAgICAgICAgICAgcm93ID0gQGluc2VydEZpbGUgbmV3RGlyXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgcm93XG4gICAgICAgICAgICAgICAgICAgIHJvdy5lZGl0TmFtZSgpXG4gICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGR1cGxpY2F0ZUZpbGU6ID0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGZvciBmaWxlIGluIEBicm93c2VyLnNlbGVjdC5maWxlcygpXG4gICAgICAgICAgICBGaWxlLmR1cGxpY2F0ZSBmaWxlLCAoc291cmNlLCB0YXJnZXQpID0+XG4gICAgICAgICAgICAgICAgaWYgQHBhcmVudC50eXBlID09ICdmaWxlJ1xuICAgICAgICAgICAgICAgICAgICBjb2wgPSBAcHJldkNvbHVtbigpXG4gICAgICAgICAgICAgICAgICAgIGNvbC5mb2N1cygpXG4gICAgICAgICAgICAgICAgZWxzZSBjb2wgPSBAXG4gICAgICAgICAgICAgICAgcm93ID0gY29sLmluc2VydEZpbGUgdGFyZ2V0XG4gICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyByb3dcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGV4cGxvcmVyOiA9PlxuICAgICAgICBcbiAgICAgICAgb3BlbiBzbGFzaC5kaXIgQGFjdGl2ZVBhdGgoKVxuICAgICAgICBcbiAgICBvcGVuOiA9PlxuXG4gICAgICAgIG9wZW4gQGFjdGl2ZVBhdGgoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICB1cGRhdGVHaXRGaWxlczogKGZpbGVzKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIHJvdyBpbiBAcm93c1xuICAgICAgICAgICAgcmV0dXJuIGlmIHJvdy5pdGVtLnR5cGUgbm90IGluIFsnZGlyJyAnZmlsZSddXG4gICAgICAgICAgICBzdGF0dXMgPSBmaWxlc1tyb3cuaXRlbS5maWxlXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAkKCcuYnJvd3NlclN0YXR1c0ljb24nIHJvdy5kaXYpPy5yZW1vdmUoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBzdGF0dXM/XG4gICAgICAgICAgICAgICAgcm93LmRpdi5hcHBlbmRDaGlsZCBlbGVtICdzcGFuJyBjbGFzczpcImdpdC0je3N0YXR1c30taWNvbiBicm93c2VyU3RhdHVzSWNvblwiXG4gICAgICAgICAgICBlbHNlIGlmIHJvdy5pdGVtLnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICBmb3IgZmlsZSwgc3RhdHVzIG9mIGZpbGVzXG4gICAgICAgICAgICAgICAgICAgIGlmIHJvdy5pdGVtLm5hbWUgIT0gJy4uJyBhbmQgZmlsZS5zdGFydHNXaXRoIHJvdy5pdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvdy5kaXYuYXBwZW5kQ2hpbGQgZWxlbSAnc3BhbicgY2xhc3M6XCJnaXQtZGlycy1pY29uIGJyb3dzZXJTdGF0dXNJY29uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICBcbiAgICAgICAgXG4gICAgbWFrZVJvb3Q6ID0+IFxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuc2hpZnRDb2x1bW5zVG8gQGluZGV4XG4gICAgICAgIFxuICAgICAgICBpZiBAYnJvd3Nlci5jb2x1bW5zWzBdLml0ZW1zWzBdLm5hbWUgIT0gJy4uJ1xuXG4gICAgICAgICAgICBAdW5zaGlmdEl0ZW0gXG4gICAgICAgICAgICAgICAgbmFtZTogJy4uJ1xuICAgICAgICAgICAgICAgIHR5cGU6ICdkaXInXG4gICAgICAgICAgICAgICAgZmlsZTogc2xhc2guZGlyIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBAY3J1bWIuc2V0RmlsZSBAcGFyZW50LmZpbGVcbiAgICBcbiAgICBvbkNvbnRleHRNZW51OiAoZXZlbnQsIGNvbHVtbikgPT4gXG4gICAgICAgIFxuICAgICAgICBzdG9wRXZlbnQgZXZlbnRcbiAgICAgICAgXG4gICAgICAgIGFic1BvcyA9IGtwb3MgZXZlbnRcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBjb2x1bW5cbiAgICAgICAgICAgIEBzaG93Q29udGV4dE1lbnUgYWJzUG9zXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgb3B0ID0gaXRlbXM6IFsgXG4gICAgICAgICAgICAgICAgdGV4dDogICAnUm9vdCdcbiAgICAgICAgICAgICAgICBjYjogICAgIEBtYWtlUm9vdFxuICAgICAgICAgICAgLFxuICAgICAgICAgICAgICAgIHRleHQ6ICAgJ0FkZCB0byBTaGVsZidcbiAgICAgICAgICAgICAgICBjb21ibzogICdhbHQrc2hpZnQrLidcbiAgICAgICAgICAgICAgICBjYjogICAgID0+IHBvc3QuZW1pdCAnYWRkVG9TaGVsZicgQHBhcmVudC5maWxlXG4gICAgICAgICAgICAsXG4gICAgICAgICAgICAgICAgdGV4dDogICAnRXhwbG9yZXInXG4gICAgICAgICAgICAgICAgY29tYm86ICAnYWx0K2UnIFxuICAgICAgICAgICAgICAgIGNiOiAgICAgPT4gb3BlbiBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIF1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgb3B0LnggPSBhYnNQb3MueFxuICAgICAgICAgICAgb3B0LnkgPSBhYnNQb3MueVxuICAgICAgICAgICAgcG9wdXAubWVudSBvcHQgICAgXG4gICAgICAgICAgICAgIFxuICAgIHNob3dDb250ZXh0TWVudTogKGFic1BvcykgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBhYnNQb3M/XG4gICAgICAgICAgICBhYnNQb3MgPSBrcG9zIEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCwgQGRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3BcbiAgICAgICAgXG4gICAgICAgIG9wdCA9IGl0ZW1zOiBbIFxuICAgICAgICAgICAgdGV4dDogICAnVG9nZ2xlIEludmlzaWJsZSdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwraScgXG4gICAgICAgICAgICBjYjogICAgIEB0b2dnbGVEb3RGaWxlc1xuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdUb2dnbGUgRXh0ZW5zaW9ucydcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrZScgXG4gICAgICAgICAgICBjYjogICAgIEB0b2dnbGVFeHRlbnNpb25zXG4gICAgICAgICwgICAgICAgICAgICBcbiAgICAgICAgICAgIHRleHQ6ICAgJydcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnRXhwbG9yZXInXG4gICAgICAgICAgICBjb21ibzogICdhbHQrZScgXG4gICAgICAgICAgICBjYjogICAgIEBleHBsb3JlclxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICcnXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ0FkZCB0byBTaGVsZidcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtzaGlmdCsuJ1xuICAgICAgICAgICAgY2I6ICAgICBAYWRkVG9TaGVsZlxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICcnXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ01vdmUgdG8gVHJhc2gnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK2JhY2tzcGFjZScgXG4gICAgICAgICAgICBjYjogICAgIEBtb3ZlVG9UcmFzaFxuICAgICAgICAsICAgXG4gICAgICAgICAgICB0ZXh0OiAgICcnXG4gICAgICAgICAgICBoaWRlOiAgIEBwYXJlbnQudHlwZSA9PSAnZmlsZSdcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnRHVwbGljYXRlJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtkJyBcbiAgICAgICAgICAgIGNiOiAgICAgQGR1cGxpY2F0ZUZpbGVcbiAgICAgICAgICAgIGhpZGU6ICAgQHBhcmVudC50eXBlID09ICdmaWxlJ1xuICAgICAgICAsICAgXG4gICAgICAgICAgICB0ZXh0OiAgICdOZXcgRm9sZGVyJ1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K24nIFxuICAgICAgICAgICAgY2I6ICAgICBAbmV3Rm9sZGVyXG4gICAgICAgICAgICBoaWRlOiAgIEBwYXJlbnQudHlwZSA9PSAnZmlsZSdcbiAgICAgICAgXVxuICAgICAgICBcbiAgICAgICAgaWYgQHBhcmVudC50eXBlICE9ICdmaWxlJ1xuICAgICAgICAgICAgb3B0Lml0ZW1zID0gb3B0Lml0ZW1zLmNvbmNhdCBbXG4gICAgICAgICAgICAgICAgdGV4dDogICAnJ1xuICAgICAgICAgICAgLCAgIFxuICAgICAgICAgICAgICAgIHRleHQ6ICAgJ1NvcnQnXG4gICAgICAgICAgICAgICAgbWVudTogW1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnQnkgTmFtZScgY29tYm86J2N0cmwrbicsIGNiOkBzb3J0QnlOYW1lXG4gICAgICAgICAgICAgICAgLFxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnQnkgVHlwZScgY29tYm86J2N0cmwrdCcsIGNiOkBzb3J0QnlUeXBlXG4gICAgICAgICAgICAgICAgLFxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnQnkgRGF0ZScgY29tYm86J2N0cmwrYScsIGNiOkBzb3J0QnlEYXRlQWRkZWRcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICBdXG4gICAgICAgIFxuICAgICAgICBvcHQueCA9IGFic1Bvcy54XG4gICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgcG9wdXAubWVudSBvcHQgICAgICAgIFxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAgMDAwICAgICBcbiAgICBcbiAgICBjb3B5UGF0aHM6IC0+XG4gICAgICAgIHBhdGhzID0gQGJyb3dzZXIuc2VsZWN0LmZpbGVzKCkuam9pbiAnXFxuJ1xuICAgICAgICBlbGVjdHJvbi5jbGlwYm9hcmQud3JpdGVUZXh0IHBhdGhzXG4gICAgICAgIHBhdGhzXG4gICAgICAgIFxuICAgIGN1dFBhdGhzOiAtPlxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuY3V0UGF0aHMgPSBAY29weVBhdGhzKClcbiAgICAgICAgXG4gICAgcGFzdGVQYXRoczogLT5cbiAgICAgICAgXG4gICAgICAgIHRleHQgPSBlbGVjdHJvbi5jbGlwYm9hcmQucmVhZFRleHQoKVxuICAgICAgICBwYXRocyA9IHRleHQuc3BsaXQgJ1xcbidcbiAgICAgICAgXG4gICAgICAgIGlmIHRleHQgPT0gQGJyb3dzZXIuY3V0UGF0aHNcbiAgICAgICAgICAgIGFjdGlvbiA9ICdtb3ZlJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBhY3Rpb24gPSAnY29weSdcbiAgICAgICAgdGFyZ2V0ID0gQHBhcmVudC5maWxlXG4gICAgICAgIGlmIEBhY3RpdmVSb3coKT8uaXRlbS50eXBlID09ICdkaXInXG4gICAgICAgICAgICB0YXJnZXQgPSBAYWN0aXZlUm93KCkuaXRlbS5maWxlXG4gICAgICAgIEBicm93c2VyLmRyb3BBY3Rpb24gYWN0aW9uLCBwYXRocywgdGFyZ2V0XG4gICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgb25LZXk6IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIHsgbW9kLCBrZXksIGNvbWJvLCBjaGFyIH0gPSBrZXlpbmZvLmZvckV2ZW50IGV2ZW50XG5cbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdzaGlmdCtgJyAnficgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYnJvd3Nlci5icm93c2UgJ34nXG4gICAgICAgICAgICB3aGVuICcvJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYnJvd3Nlci5icm93c2UgJy8nXG4gICAgICAgICAgICB3aGVuICdiYWNrc3BhY2UnICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYnJvd3Nlci5vbkJhY2tzcGFjZUluQ29sdW1uIEBcbiAgICAgICAgICAgIHdoZW4gJ2RlbGV0ZScgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBicm93c2VyLm9uRGVsZXRlSW5Db2x1bW4gQFxuICAgICAgICAgICAgd2hlbiAnYWx0K2xlZnQnICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgd2luZG93LnNwbGl0LmZvY3VzICdzaGVsZidcbiAgICAgICAgICAgIHdoZW4gJ2FsdCtzaGlmdCsuJyAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBhZGRUb1NoZWxmKClcbiAgICAgICAgICAgIHdoZW4gJ2FsdCtlJyAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBleHBsb3JlcigpXG4gICAgICAgICAgICB3aGVuICdhbHQrbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmV3Rm9sZGVyKClcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwreCcgJ2NvbW1hbmQreCcgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBjdXRQYXRocygpXG4gICAgICAgICAgICB3aGVuICdjdHJsK2MnICdjb21tYW5kK2MnICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAY29weVBhdGhzKClcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrdicgJ2NvbW1hbmQrdicgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBwYXN0ZVBhdGhzKClcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICdwYWdlIGRvd24nICdob21lJyAnZW5kJyB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvd3Mga2V5XG4gICAgICAgICAgICB3aGVuICdlbnRlcicnYWx0K3VwJyAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVDb2xzIGtleVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCt1cCcgJ2N0cmwrdXAnICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyAnaG9tZSdcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrZG93bicgJ2N0cmwrZG93bicgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvd3MgJ2VuZCdcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrdCcgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBzb3J0QnlUeXBlKClcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrbicgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBzb3J0QnlOYW1lKClcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrYScgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBzb3J0QnlEYXRlQWRkZWQoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtpJyAnY3RybCtpJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHRvZ2dsZURvdEZpbGVzKClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrZCcgJ2N0cmwrZCcgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBkdXBsaWNhdGVGaWxlKClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQraycgJ2N0cmwraycgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQgaWYgQGJyb3dzZXIuY2xlYW5VcCgpICMgbmVlZGVkP1xuICAgICAgICAgICAgd2hlbiAnZjInICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGFjdGl2ZVJvdygpPy5lZGl0TmFtZSgpXG4gICAgICAgICAgICB3aGVuICdzaGlmdCt1cCcgJ3NoaWZ0K2Rvd24nICdzaGlmdCtob21lJyAnc2hpZnQrZW5kJyAnc2hpZnQrcGFnZSB1cCcgJ3NoaWZ0K3BhZ2UgZG93bicgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGV4dGVuZFNlbGVjdGlvbiBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrbGVmdCcgJ2NvbW1hbmQrcmlnaHQnICdjdHJsK2xlZnQnICdjdHJsK3JpZ2h0J1xuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvb3Qga2V5XG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2JhY2tzcGFjZScgJ2N0cmwrYmFja3NwYWNlJyAnY29tbWFuZCtkZWxldGUnICdjdHJsK2RlbGV0ZScgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG1vdmVUb1RyYXNoKClcbiAgICAgICAgICAgIHdoZW4gJ3RhYicgICAgXG4gICAgICAgICAgICAgICAgaWYgQHNlYXJjaC5sZW5ndGggdGhlbiBAZG9TZWFyY2ggJydcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICB3aGVuICdlc2MnXG4gICAgICAgICAgICAgICAgaWYgQGRyYWdEaXZcbiAgICAgICAgICAgICAgICAgICAgQGRyYWdEaXYuZHJhZy5kcmFnU3RvcCgpXG4gICAgICAgICAgICAgICAgICAgIEBkcmFnRGl2LnJlbW92ZSgpXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBAZHJhZ0RpdlxuICAgICAgICAgICAgICAgIGVsc2UgaWYgQGJyb3dzZXIuc2VsZWN0LmZpbGVzKCkubGVuZ3RoID4gMVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3Qucm93IEBhY3RpdmVSb3coKVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgQHNlYXJjaC5sZW5ndGggdGhlbiBAY2xlYXJTZWFyY2goKVxuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnRcblxuICAgICAgICBpZiBjb21ibyBpbiBbJ3VwJyAgICdkb3duJ10gIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyBrZXkgICAgICAgICAgICAgIFxuICAgICAgICBpZiBjb21ibyBpbiBbJ2xlZnQnICdyaWdodCddIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlQ29scyBrZXlcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBtb2QgaW4gWydzaGlmdCcgJyddIGFuZCBjaGFyIHRoZW4gQGRvU2VhcmNoIGNoYXJcbiAgICAgICAgXG4gICAgICAgIGlmIEBkcmFnRGl2XG4gICAgICAgICAgICBAdXBkYXRlRHJhZ0luZGljYXRvciBldmVudFxuICAgICAgICAgICAgXG4gICAgb25LZXlVcDogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGRyYWdEaXZcbiAgICAgICAgICAgIEB1cGRhdGVEcmFnSW5kaWNhdG9yIGV2ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQ29sdW1uXG5cblxuIl19
//# sourceURL=../../coffee/browser/column.coffee