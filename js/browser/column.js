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
                klog("action " + action + " " + target, files);
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
        klog('copy paths', paths);
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
        klog('pastePaths', paths);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sdW1uLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9icm93c2VyIiwic291cmNlcyI6WyJjb2x1bW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHFNQUFBO0lBQUE7O0FBUUEsTUFBbUksT0FBQSxDQUFRLEtBQVIsQ0FBbkksRUFBRSxTQUFGLEVBQUssU0FBTCxFQUFRLGlCQUFSLEVBQWUsZUFBZixFQUFxQixlQUFyQixFQUEyQixpQkFBM0IsRUFBa0MsV0FBbEMsRUFBc0MsbUJBQXRDLEVBQThDLHFCQUE5QyxFQUF1RCxlQUF2RCxFQUE2RCxlQUE3RCxFQUFtRSxlQUFuRSxFQUF5RSxpQkFBekUsRUFBZ0YsZUFBaEYsRUFBc0YsaUJBQXRGLEVBQTZGLHVCQUE3RixFQUF1RyxpQkFBdkcsRUFBOEcseUJBQTlHLEVBQXlIOztBQUV6SCxHQUFBLEdBQVcsT0FBQSxDQUFRLE9BQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxTQUFSOztBQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFDWCxRQUFBLEdBQVcsT0FBQSxDQUFRLG1CQUFSOztBQUNYLElBQUEsR0FBVyxPQUFBLENBQVEsZUFBUjs7QUFDWCxLQUFBLEdBQVcsT0FBQSxDQUFRLE9BQVI7O0FBQ1gsR0FBQSxHQUFXLE9BQUEsQ0FBUSxLQUFSOztBQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsVUFBUjs7QUFFTDtJQUVDLGdCQUFDLE9BQUQ7QUFFQyxZQUFBO1FBRkEsSUFBQyxDQUFBLFVBQUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBRUEsSUFBQyxDQUFBLFdBQUQsR0FBZTtRQUNmLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsS0FBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUVWLElBQUMsQ0FBQSxHQUFELEdBQVcsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxl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QUtiLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyAkLCBfLCBjbGFtcCwgZHJhZywgZWxlbSwgZW1wdHksIGZzLCBrZXJyb3IsIGtleWluZm8sIGtsb2csIGtwb3MsIG9wZW4sIHBvcHVwLCBwb3N0LCBwcmVmcywgc2V0U3R5bGUsIHNsYXNoLCBzdG9wRXZlbnQsIHZhbGlkIH0gPSByZXF1aXJlICdreGsnXG5cblJvdyAgICAgID0gcmVxdWlyZSAnLi9yb3cnXG5DcnVtYiAgICA9IHJlcXVpcmUgJy4vY3J1bWInXG5TY3JvbGxlciA9IHJlcXVpcmUgJy4vc2Nyb2xsZXInXG5EaXJXYXRjaCA9IHJlcXVpcmUgJy4uL3Rvb2xzL2RpcndhdGNoJ1xuRmlsZSAgICAgPSByZXF1aXJlICcuLi90b29scy9maWxlJ1xuZnV6enkgICAgPSByZXF1aXJlICdmdXp6eSdcbnd4dyAgICAgID0gcmVxdWlyZSAnd3h3J1xuZWxlY3Ryb24gPSByZXF1aXJlICdlbGVjdHJvbidcblxuY2xhc3MgQ29sdW1uXG4gICAgXG4gICAgQDogKEBicm93c2VyKSAtPlxuICAgICAgICBcbiAgICAgICAgQHNlYXJjaFRpbWVyID0gbnVsbFxuICAgICAgICBAc2VhcmNoID0gJydcbiAgICAgICAgQGl0ZW1zICA9IFtdXG4gICAgICAgIEByb3dzICAgPSBbXVxuICAgICAgICBcbiAgICAgICAgQGRpdiAgICAgPSBlbGVtIGNsYXNzOiAnYnJvd3NlckNvbHVtbicgICAgICAgIHRhYkluZGV4OjYgaWQ6IEBuYW1lKClcbiAgICAgICAgQGNvbnRlbnQgPSBlbGVtIGNsYXNzOiAnYnJvd3NlckNvbHVtbkNvbnRlbnQnIHBhcmVudDogQGRpdlxuICAgICAgICBAdGFibGUgICA9IGVsZW0gY2xhc3M6ICdicm93c2VyQ29sdW1uVGFibGUnICAgcGFyZW50OiBAY29udGVudFxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuY29scz8uYXBwZW5kQ2hpbGQgQGRpdlxuICAgICAgICBcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdmb2N1cycgICAgIEBvbkZvY3VzXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnYmx1cicgICAgICBAb25CbHVyXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAna2V5ZG93bicgICBAb25LZXlcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdrZXl1cCcgICAgIEBvbktleVVwXG4gICAgICAgIFxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlb3ZlcicgQG9uTW91c2VPdmVyXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2VvdXQnICBAb25Nb3VzZU91dFxuXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnZGJsY2xpY2snICBAb25EYmxDbGlja1xuICAgICAgICBcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdjb250ZXh0bWVudScgQG9uQ29udGV4dE1lbnVcbiAgXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBkaXZcbiAgICAgICAgICAgIG9uU3RhcnQ6IEBvbkRyYWdTdGFydFxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uRHJhZ01vdmVcbiAgICAgICAgICAgIG9uU3RvcDogIEBvbkRyYWdTdG9wXG4gICAgICAgIFxuICAgICAgICBAY3J1bWIgID0gbmV3IENydW1iIEBcbiAgICAgICAgQHNjcm9sbCA9IG5ldyBTY3JvbGxlciBALCBAY29udGVudFxuICAgICAgICBcbiAgICAgICAgQHNldEluZGV4IEBicm93c2VyLmNvbHVtbnM/Lmxlbmd0aFxuICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBsb2FkSXRlbXM6IChpdGVtcywgcGFyZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgIyBrbG9nIEBwYXJlbnQ/LmZpbGUsIHBhcmVudC5maWxlLCBpdGVtcy5sZW5ndGhcbiAgICAgICAgQGNsZWFyKClcblxuICAgICAgICBAcGFyZW50ID0gcGFyZW50XG4gICAgICAgIFxuICAgICAgICBpZiBAaW5kZXggPT0gMCBvciBAaW5kZXgtMSA8IEBicm93c2VyLm51bUNvbHMoKSBhbmQgQGJyb3dzZXIuY29sdW1uc1tAaW5kZXgtMV0uYWN0aXZlUm93KCk/Lml0ZW0ubmFtZSA9PSAnLi4nIGFuZCBub3Qgc2xhc2guaXNSb290IEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgaWYgaXRlbXNbMF0/Lm5hbWUgbm90IGluIFsnLi4nICcvJ11cbiAgICAgICAgICAgICAgICBkaXIgPSBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgICAgICB1cGRpciA9IHNsYXNoLmRpciBkaXJcbiAgICAgICAgICAgICAgICBpZiB1cGRpciAhPSBkaXJcbiAgICAgICAgICAgICAgICAgICAgaXRlbXMudW5zaGlmdFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJy4uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6ICB1cGRpclxuICAgICAgICBcbiAgICAgICAgQGl0ZW1zID0gaXRlbXNcbiAgXG4gICAgICAgIEBkaXYuY2xhc3NMaXN0LnJlbW92ZSAnYnJvd3NlckNvbHVtbkNvZGUnXG4gICAgICAgIFxuICAgICAgICBAY3J1bWIuc2hvdygpXG4gICAgICAgIFxuICAgICAgICBpZiBAcGFyZW50LnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICMga2xvZyAnbG9hZEl0ZW1zJyBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIERpcldhdGNoLndhdGNoIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgQGNydW1iLnNldEZpbGUgQHBhcmVudC5maWxlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIEZpbGUuaXNDb2RlIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgICAgIEBjcnVtYi5zZXRGaWxlIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgICAgIEBkaXYuY2xhc3NMaXN0LmFkZCAnYnJvd3NlckNvbHVtbkNvZGUnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSB1bmRlZmluZWRcbiAgICAgICAgICAgIGtsb2cgJ3VuZGVmaW5lZCBwYXJlbnQgdHlwZT8nXG4gICAgICAgICAgICBAcGFyZW50LnR5cGUgPSBzbGFzaC5pc0RpcihAcGFyZW50LmZpbGUpIGFuZCAnZGlyJyBvciAnZmlsZSdcbiAgICAgICAgXG4gICAgICAgIGtlcnJvciBcIm5vIHBhcmVudCBpdGVtP1wiIGlmIG5vdCBAcGFyZW50P1xuICAgICAgICBrZXJyb3IgXCJsb2FkSXRlbXMgLS0gbm8gcGFyZW50IHR5cGU/XCIsIEBwYXJlbnQgaWYgbm90IEBwYXJlbnQudHlwZT9cbiAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkIEBpdGVtc1xuICAgICAgICAgICAgZm9yIGl0ZW0gaW4gQGl0ZW1zXG4gICAgICAgICAgICAgICAgQHJvd3MucHVzaCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgXG4gICAgICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQHBhcmVudC50eXBlID09ICdkaXInIGFuZCBzbGFzaC5zYW1lUGF0aCAnfi9Eb3dubG9hZHMnIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgQHNvcnRCeURhdGVBZGRlZCgpXG4gICAgICAgIEBcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIHVwZGF0ZURyYWdJbmRpY2F0b3I6IChldmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBkcmFnSW5kPy5jbGFzc0xpc3QudG9nZ2xlICdjb3B5JyBldmVudC5zaGlmdEtleVxuICAgICAgICBAZHJhZ0luZD8uY2xhc3NMaXN0LnRvZ2dsZSAnbW92ZScgZXZlbnQuY3RybEtleSBvciBldmVudC5tZXRhS2V5IG9yIGV2ZW50LmFsdEtleVxuICAgIFxuICAgIG9uRHJhZ1N0YXJ0OiAoZCwgZSkgPT4gXG4gICAgXG4gICAgICAgIEBkcmFnU3RhcnRSb3cgPSBAcm93IGUudGFyZ2V0XG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5za2lwT25EYmxDbGljayA9IGZhbHNlXG4gICAgICAgIFxuICAgICAgICBkZWxldGUgQHRvZ2dsZVxuICAgICAgICBcbiAgICAgICAgaWYgQGRyYWdTdGFydFJvd1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBlLnNoaWZ0S2V5XG4gICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnRvIEBkcmFnU3RhcnRSb3dcbiAgICAgICAgICAgIGVsc2UgaWYgZS5tZXRhS2V5IG9yIGUuYWx0S2V5IG9yIGUuY3RybEtleVxuICAgICAgICAgICAgICAgIGlmIG5vdCBAZHJhZ1N0YXJ0Um93LmlzU2VsZWN0ZWQoKVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3QudG9nZ2xlIEBkcmFnU3RhcnRSb3dcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEB0b2dnbGUgPSB0cnVlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgQGRyYWdTdGFydFJvdy5pc1NlbGVjdGVkKClcbiAgICAgICAgICAgICAgICAgICAgQGRlc2VsZWN0ID0gdHJ1ZVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGFjdGl2ZVJvdygpPy5jbGVhckFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgQGRyYWdTdGFydFJvdywgZmFsc2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQGhhc0ZvY3VzKCkgYW5kIEBhY3RpdmVSb3coKVxuICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgQGFjdGl2ZVJvdygpXG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAgMCAgICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBvbkRyYWdNb3ZlOiAoZCxlKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGRyYWdTdGFydFJvdyBhbmQgbm90IEBkcmFnRGl2IGFuZCB2YWxpZCBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gaWYgTWF0aC5hYnMoZC5kZWx0YVN1bS54KSA8IDIwIGFuZCBNYXRoLmFicyhkLmRlbHRhU3VtLnkpIDwgMTBcblxuICAgICAgICAgICAgZGVsZXRlIEB0b2dnbGUgXG4gICAgICAgICAgICBkZWxldGUgQGRlc2VsZWN0XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBkcmFnRGl2ID0gZWxlbSAnZGl2J1xuICAgICAgICAgICAgQGRyYWdEaXYuZHJhZyA9IGRcbiAgICAgICAgICAgIEBkcmFnRGl2LmZpbGVzID0gQGJyb3dzZXIuc2VsZWN0LmZpbGVzKClcbiAgICAgICAgICAgIHBvcyA9IGtwb3MgZS5wYWdlWCwgZS5wYWdlWVxuICAgICAgICAgICAgcm93ID0gQGJyb3dzZXIuc2VsZWN0LnJvd3NbMF1cblxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUucG9zaXRpb24gICAgICA9ICdhYnNvbHV0ZSdcbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLm9wYWNpdHkgICAgICAgPSBcIjAuN1wiXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS50b3AgICAgICAgICAgID0gXCIje3Bvcy55LWQuZGVsdGFTdW0ueX1weFwiXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS5sZWZ0ICAgICAgICAgID0gXCIje3Bvcy54LWQuZGVsdGFTdW0ueH1weFwiXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS53aWR0aCAgICAgICAgID0gXCIje0B3aWR0aCgpLTEyfXB4XCJcbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGRyYWdJbmQgPSBlbGVtIGNsYXNzOidkcmFnSW5kaWNhdG9yJ1xuICAgICAgICAgICAgQGRyYWdEaXYuYXBwZW5kQ2hpbGQgQGRyYWdJbmRcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIHJvdyBpbiBAYnJvd3Nlci5zZWxlY3Qucm93c1xuICAgICAgICAgICAgICAgIHJvd0Nsb25lID0gcm93LmRpdi5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICAgICAgICAgIHJvd0Nsb25lLnN0eWxlLmZsZXggICAgICAgICAgPSAndW5zZXQnXG4gICAgICAgICAgICAgICAgcm93Q2xvbmUuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJ1xuICAgICAgICAgICAgICAgIHJvd0Nsb25lLnN0eWxlLmJvcmRlciAgICAgICAgPSAnbm9uZSdcbiAgICAgICAgICAgICAgICByb3dDbG9uZS5zdHlsZS5tYXJnaW5Cb3R0b20gID0gJy0xcHgnXG4gICAgICAgICAgICAgICAgQGRyYWdEaXYuYXBwZW5kQ2hpbGQgcm93Q2xvbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQgQGRyYWdEaXZcbiAgICAgICAgICAgIEBmb2N1cyBhY3RpdmF0ZTpmYWxzZVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBkcmFnRGl2XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG9uU3ByaW5nTG9hZFRpbWVvdXQgPSA9PlxuICAgICAgICAgICAgICAgIGlmIGNvbHVtbiA9IEBicm93c2VyLmNvbHVtbkZvckZpbGUgQGJyb3dzZXIuc3ByaW5nTG9hZFRhcmdldFxuICAgICAgICAgICAgICAgICAgICBpZiByb3cgPSBjb2x1bW4ucm93IEBicm93c2VyLnNwcmluZ0xvYWRUYXJnZXRcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvdy5hY3RpdmF0ZSgpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQgQGJyb3dzZXIuc3ByaW5nTG9hZFRpbWVyXG4gICAgICAgICAgICBkZWxldGUgQGJyb3dzZXIuc3ByaW5nTG9hZFRhcmdldFxuICAgICAgICAgICAgaWYgcm93ID0gQGJyb3dzZXIucm93QXRQb3MgZC5wb3NcbiAgICAgICAgICAgICAgICBpZiByb3cuaXRlbS50eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNwcmluZ0xvYWRUaW1lciA9IHNldFRpbWVvdXQgb25TcHJpbmdMb2FkVGltZW91dCwgMTAwMFxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zcHJpbmdMb2FkVGFyZ2V0ID0gcm93Lml0ZW0uZmlsZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAdXBkYXRlRHJhZ0luZGljYXRvciBlIFxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGVYKCN7ZC5kZWx0YVN1bS54fXB4KSB0cmFuc2xhdGVZKCN7ZC5kZWx0YVN1bS55fXB4KVwiXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICBcbiAgICBcbiAgICBvbkRyYWdTdG9wOiAoZCxlKSA9PlxuICAgICAgICBcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBicm93c2VyLnNwcmluZ0xvYWRUaW1lclxuICAgICAgICBkZWxldGUgQGJyb3dzZXIuc3ByaW5nTG9hZFRhcmdldFxuICAgICAgICBcbiAgICAgICAgaWYgQGRyYWdEaXY/XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBkcmFnRGl2LnJlbW92ZSgpXG4gICAgICAgICAgICBmaWxlcyA9IEBkcmFnRGl2LmZpbGVzXG4gICAgICAgICAgICBkZWxldGUgQGRyYWdEaXZcbiAgICAgICAgICAgIGRlbGV0ZSBAZHJhZ1N0YXJ0Um93XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHJvdyA9IEBicm93c2VyLnJvd0F0UG9zIGQucG9zXG4gICAgICAgICAgICAgICAgY29sdW1uID0gcm93LmNvbHVtblxuICAgICAgICAgICAgICAgIHRhcmdldCA9IHJvdy5pdGVtLmZpbGVcbiAgICAgICAgICAgIGVsc2UgaWYgY29sdW1uID0gQGJyb3dzZXIuY29sdW1uQXRQb3MgZC5wb3NcbiAgICAgICAgICAgICAgICB0YXJnZXQgPSBjb2x1bW4ucGFyZW50Py5maWxlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAga2xvZyAnbm8gZHJvcCB0YXJnZXQnXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgYWN0aW9uID0gZS5zaGlmdEtleSBhbmQgJ2NvcHknIG9yICdtb3ZlJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgY29sdW1uID09IEBicm93c2VyLnNoZWxmIFxuICAgICAgICAgICAgICAgIGlmIHRhcmdldCBhbmQgKGUuY3RybEtleSBvciBlLnNoaWZ0S2V5IG9yIGUubWV0YUtleSBvciBlLmFsdEtleSlcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuZHJvcEFjdGlvbiBhY3Rpb24sIGZpbGVzLCB0YXJnZXRcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNoZWxmLmFkZEZpbGVzIGZpbGVzLCBwb3M6ZC5wb3NcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBrbG9nIFwiYWN0aW9uICN7YWN0aW9ufSAje3RhcmdldH1cIiBmaWxlc1xuICAgICAgICAgICAgICAgIEBicm93c2VyLmRyb3BBY3Rpb24gYWN0aW9uLCBmaWxlcywgdGFyZ2V0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGZvY3VzIGFjdGl2YXRlOmZhbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHJvdyA9IEByb3cgZS50YXJnZXRcbiAgICAgICAgICAgICAgICBpZiByb3cuaXNTZWxlY3RlZCgpXG4gICAgICAgICAgICAgICAgICAgIGlmIGUubWV0YUtleSBvciBlLmFsdEtleSBvciBlLmN0cmxLZXkgb3IgZS5zaGlmdEtleVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgQHRvZ2dsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBAdG9nZ2xlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnRvZ2dsZSByb3dcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgQGRlc2VsZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIEBkZXNlbGVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgcm93XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm93LmFjdGl2YXRlKClcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAYWN0aXZlUm93KCk/LmNsZWFyQWN0aXZlKClcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAgIDAgICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgcmVtb3ZlRmlsZTogKGZpbGUpID0+IFxuICAgICAgICBcbiAgICAgICAgaWYgcm93ID0gQHJvdyBzbGFzaC5maWxlIGZpbGVcbiAgICAgICAgICAgIEByZW1vdmVSb3cgcm93XG4gICAgICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBpbnNlcnRGaWxlOiAoZmlsZSkgPT4gXG5cbiAgICAgICAgaXRlbSA9IEBicm93c2VyLmZpbGVJdGVtIGZpbGVcbiAgICAgICAgcm93ID0gbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIEByb3dzLnB1c2ggcm93XG4gICAgICAgIHJvd1xuICAgICAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgdW5zaGlmdEl0ZW06IChpdGVtKSAtPlxuICAgICAgICBcbiAgICAgICAgQGl0ZW1zLnVuc2hpZnQgaXRlbVxuICAgICAgICBAcm93cy51bnNoaWZ0IG5ldyBSb3cgQCwgaXRlbVxuICAgICAgICBAdGFibGUuaW5zZXJ0QmVmb3JlIEB0YWJsZS5sYXN0Q2hpbGQsIEB0YWJsZS5maXJzdENoaWxkXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgQHJvd3NbMF1cbiAgICAgICAgXG4gICAgcHVzaEl0ZW06IChpdGVtKSAtPlxuICAgICAgICBcbiAgICAgICAgQGl0ZW1zLnB1c2ggaXRlbVxuICAgICAgICBAcm93cy5wdXNoIG5ldyBSb3cgQCwgaXRlbVxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgIEByb3dzWy0xXVxuICAgICAgICBcbiAgICBhZGRJdGVtOiAoaXRlbSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJvdyA9IEBwdXNoSXRlbSBpdGVtXG4gICAgICAgIEBzb3J0QnlOYW1lKClcbiAgICAgICAgcm93XG5cbiAgICBzZXRJdGVtczogKEBpdGVtcywgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuY2xlYXJDb2x1bW4gQGluZGV4XG4gICAgICAgIFxuICAgICAgICBAcGFyZW50ID0gb3B0LnBhcmVudFxuICAgICAgICBrZXJyb3IgXCJubyBwYXJlbnQgaXRlbT9cIiBpZiBub3QgQHBhcmVudD9cbiAgICAgICAga2Vycm9yIFwic2V0SXRlbXMgLS0gbm8gcGFyZW50IHR5cGU/XCIsIEBwYXJlbnQgaWYgbm90IEBwYXJlbnQudHlwZT9cbiAgICAgICAgXG4gICAgICAgIGZvciBpdGVtIGluIEBpdGVtc1xuICAgICAgICAgICAgQHJvd3MucHVzaCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgQFxuXG4gICAgIyAwMCAgICAgMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgMDAwICAgICAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICBcbiAgICAgICAgXG4gICAgaXNEaXI6ICAtPiBAcGFyZW50Py50eXBlID09ICdkaXInIFxuICAgIGlzRmlsZTogLT4gQHBhcmVudD8udHlwZSA9PSAnZmlsZScgXG4gICAgICAgIFxuICAgIGlzRW1wdHk6IC0+IGVtcHR5IEBwYXJlbnRcbiAgICBjbGVhcjogICAtPlxuICAgICAgICBpZiBAcGFyZW50Py5maWxlIGFuZCBAcGFyZW50Py50eXBlID09ICdkaXInXG4gICAgICAgICAgICAjIGtsb2cgJ2NvbHVtbi5jbGVhciB1bndhdGNoPycgQHBhcmVudC5maWxlXG4gICAgICAgICAgICBEaXJXYXRjaC51bndhdGNoIEBwYXJlbnQuZmlsZVxuICAgICAgICBkZWxldGUgQHBhcmVudFxuICAgICAgICBAY2xlYXJTZWFyY2goKVxuICAgICAgICBAZGl2LnNjcm9sbFRvcCA9IDBcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIEBjcnVtYi5jbGVhcigpXG4gICAgICAgIEByb3dzID0gW11cbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICAgICBcbiAgICBzZXRJbmRleDogKEBpbmRleCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjcnVtYj8uZWxlbS5jb2x1bW5JbmRleCA9IEBpbmRleFxuICAgICAgICBcbiAgICB3aWR0aDogLT4gQGRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS53aWR0aFxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMCAgICAgIDAwMDAwMDAwICBcbiAgIFxuICAgIGFjdGl2YXRlUm93OiAocm93KSAtPiBAcm93KHJvdyk/LmFjdGl2YXRlKClcbiAgICAgICBcbiAgICBhY3RpdmVSb3c6IC0+IF8uZmluZCBAcm93cywgKHIpIC0+IHIuaXNBY3RpdmUoKVxuICAgIGFjdGl2ZVBhdGg6IC0+IEBhY3RpdmVSb3coKT8ucGF0aCgpID8gQHBhcmVudC5maWxlXG4gICAgXG4gICAgcm93OiAocm93KSAtPiAjIGFjY2VwdHMgZWxlbWVudCwgaW5kZXgsIHN0cmluZyBvciByb3dcbiAgICAgICAgaWYgICAgICBfLmlzTnVtYmVyICByb3cgdGhlbiByZXR1cm4gMCA8PSByb3cgPCBAbnVtUm93cygpIGFuZCBAcm93c1tyb3ddIG9yIG51bGxcbiAgICAgICAgZWxzZSBpZiBfLmlzRWxlbWVudCByb3cgdGhlbiByZXR1cm4gXy5maW5kIEByb3dzLCAocikgLT4gci5kaXYuY29udGFpbnMgcm93XG4gICAgICAgIGVsc2UgaWYgXy5pc1N0cmluZyAgcm93IHRoZW4gcmV0dXJuIF8uZmluZCBAcm93cywgKHIpIC0+IHIuaXRlbS5uYW1lID09IHJvdyBvciByLml0ZW0uZmlsZSA9PSByb3dcbiAgICAgICAgZWxzZSByZXR1cm4gcm93XG4gICAgICAgICAgICBcbiAgICBuZXh0Q29sdW1uOiAtPiBAYnJvd3Nlci5jb2x1bW4gQGluZGV4KzFcbiAgICBwcmV2Q29sdW1uOiAtPiBAYnJvd3Nlci5jb2x1bW4gQGluZGV4LTFcbiAgICAgICAgXG4gICAgbmFtZTogLT4gXCIje0Bicm93c2VyLm5hbWV9OiN7QGluZGV4fVwiXG4gICAgcGF0aDogLT4gQHBhcmVudD8uZmlsZSA/ICcnXG4gICAgICAgIFxuICAgIG51bVJvd3M6ICAgIC0+IEByb3dzLmxlbmd0aCA/IDAgICBcbiAgICByb3dIZWlnaHQ6ICAtPiBAcm93c1swXT8uZGl2LmNsaWVudEhlaWdodCA/IDBcbiAgICBudW1WaXNpYmxlOiAtPiBAcm93SGVpZ2h0KCkgYW5kIHBhcnNlSW50KEBicm93c2VyLmhlaWdodCgpIC8gQHJvd0hlaWdodCgpKSBvciAwXG4gICAgXG4gICAgcm93QXRQb3M6IChwb3MpIC0+IEByb3cgQHJvd0luZGV4QXRQb3MgcG9zXG4gICAgXG4gICAgcm93SW5kZXhBdFBvczogKHBvcykgLT5cbiAgICAgICAgZHkgPSBwb3MueSAtIEBjb250ZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcFxuICAgICAgICBpZiBkeSA+PSAwXG4gICAgICAgICAgICBNYXRoLmZsb29yIGR5L0Byb3dIZWlnaHQoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICAtMSAgICAgICAgICAgIFxuICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGhhc0ZvY3VzOiAtPiBAZGl2LmNsYXNzTGlzdC5jb250YWlucyAnZm9jdXMnXG5cbiAgICBmb2N1czogKG9wdD17fSkgLT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgbm90IEBhY3RpdmVSb3coKSBhbmQgQG51bVJvd3MoKSBhbmQgb3B0Py5hY3RpdmF0ZSAhPSBmYWxzZVxuICAgICAgICAgICAgQHJvd3NbMF0uc2V0QWN0aXZlKClcbiAgICAgICAgICAgIFxuICAgICAgICBAZGl2LmZvY3VzKClcbiAgICAgICAgQGRpdi5jbGFzc0xpc3QuYWRkICdmb2N1cydcbiAgICAgICAgd2luZG93LnNldExhc3RGb2N1cyBAbmFtZSgpXG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgb25Gb2N1czogPT4gQGRpdi5jbGFzc0xpc3QuYWRkICdmb2N1cydcbiAgICBvbkJsdXI6ICA9PiBAZGl2LmNsYXNzTGlzdC5yZW1vdmUgJ2ZvY3VzJ1xuXG4gICAgZm9jdXNCcm93c2VyOiAtPiBAYnJvd3Nlci5mb2N1cygpXG4gICAgXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBvbk1vdXNlT3ZlcjogKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/Lm9uTW91c2VPdmVyKClcbiAgICBvbk1vdXNlT3V0OiAgKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/Lm9uTW91c2VPdXQoKVxuICAgIFxuICAgIG9uRGJsQ2xpY2s6ICAoZXZlbnQpID0+IFxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuc2tpcE9uRGJsQ2xpY2sgPSB0cnVlXG4gICAgICAgIEBuYXZpZ2F0ZUNvbHMgJ2VudGVyJ1xuICAgIFxuICAgIGV4dGVuZFNlbGVjdGlvbjogKGtleSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBlcnJvciBcIm5vIHJvd3MgaW4gY29sdW1uICN7QGluZGV4fT9cIiBpZiBub3QgQG51bVJvd3MoKSAgICAgICAgXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gLTFcbiAgICAgICAgZXJyb3IgXCJubyBpbmRleCBmcm9tIGFjdGl2ZVJvdz8gI3tpbmRleH0/XCIsIEBhY3RpdmVSb3coKSBpZiBub3QgaW5kZXg/IG9yIE51bWJlci5pc05hTiBpbmRleFxuICAgICAgICAgICAgXG4gICAgICAgIHRvSW5kZXggPSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICd1cCcgICAgICAgIHRoZW4gaW5kZXgtMVxuICAgICAgICAgICAgd2hlbiAnZG93bicgICAgICB0aGVuIGluZGV4KzFcbiAgICAgICAgICAgIHdoZW4gJ2hvbWUnICAgICAgdGhlbiAwXG4gICAgICAgICAgICB3aGVuICdlbmQnICAgICAgIHRoZW4gQG51bVJvd3MoKS0xXG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAgIHRoZW4gTWF0aC5tYXggMCwgaW5kZXgtQG51bVZpc2libGUoKVxuICAgICAgICAgICAgd2hlbiAncGFnZSBkb3duJyB0aGVuIE1hdGgubWluIEBudW1Sb3dzKCktMSwgaW5kZXgrQG51bVZpc2libGUoKVxuICAgICAgICAgICAgZWxzZSBpbmRleFxuICAgIFxuICAgICAgICBAYnJvd3Nlci5zZWxlY3QudG8gQHJvdyh0b0luZGV4KSwgdHJ1ZVxuICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcblxuICAgIG5hdmlnYXRlUm93czogKGtleSkgLT5cblxuICAgICAgICByZXR1cm4gZXJyb3IgXCJubyByb3dzIGluIGNvbHVtbiAje0BpbmRleH0/XCIgaWYgbm90IEBudW1Sb3dzKClcbiAgICAgICAgaW5kZXggPSBAYWN0aXZlUm93KCk/LmluZGV4KCkgPyAtMVxuICAgICAgICBlcnJvciBcIm5vIGluZGV4IGZyb20gYWN0aXZlUm93PyAje2luZGV4fT9cIiBAYWN0aXZlUm93KCkgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXhcbiAgICAgICAgXG4gICAgICAgIG5ld0luZGV4ID0gc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAndXAnICAgICAgICB0aGVuIGluZGV4LTFcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nICAgICAgdGhlbiBpbmRleCsxXG4gICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gMFxuICAgICAgICAgICAgd2hlbiAnZW5kJyAgICAgICB0aGVuIEBudW1Sb3dzKCktMVxuICAgICAgICAgICAgd2hlbiAncGFnZSB1cCcgICB0aGVuIGluZGV4LUBudW1WaXNpYmxlKClcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgZG93bicgdGhlbiBpbmRleCtAbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICBlbHNlIGluZGV4XG4gICAgICAgICAgICBcbiAgICAgICAgaWYgbm90IG5ld0luZGV4PyBvciBOdW1iZXIuaXNOYU4gbmV3SW5kZXggICAgICAgIFxuICAgICAgICAgICAgZXJyb3IgXCJubyBpbmRleCAje25ld0luZGV4fT8gI3tAbnVtVmlzaWJsZSgpfVwiXG4gICAgICAgICAgICBcbiAgICAgICAgbmV3SW5kZXggPSBjbGFtcCAwIEBudW1Sb3dzKCktMSBuZXdJbmRleFxuICAgICAgICBcbiAgICAgICAgaWYgbmV3SW5kZXggIT0gaW5kZXhcbiAgICAgICAgICAgIEByb3dzW25ld0luZGV4XS5hY3RpdmF0ZSBudWxsIEBwYXJlbnQudHlwZT09J2ZpbGUnXG4gICAgXG4gICAgbmF2aWdhdGVDb2xzOiAoa2V5KSAtPiAjIG1vdmUgdG8gZmlsZSBicm93c2VyP1xuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAndXAnICAgIHRoZW4gQGJyb3dzZXIubmF2aWdhdGUgJ3VwJ1xuICAgICAgICAgICAgd2hlbiAnbGVmdCcgIHRoZW4gQGJyb3dzZXIubmF2aWdhdGUgJ2xlZnQnXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgdGhlbiBAYnJvd3Nlci5uYXZpZ2F0ZSAncmlnaHQnXG4gICAgICAgICAgICB3aGVuICdlbnRlcidcbiAgICAgICAgICAgICAgICBpZiBpdGVtID0gQGFjdGl2ZVJvdygpPy5pdGVtXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSBpdGVtLnR5cGVcbiAgICAgICAgICAgICAgICAgICAgaWYgdHlwZSA9PSAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIubG9hZEl0ZW0gaXRlbVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG8nIGl0ZW1cbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnZm9jdXMnICdlZGl0b3InXG4gICAgICAgIEBcblxuICAgIG5hdmlnYXRlUm9vdDogKGtleSkgLT4gXG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5icm93c2Ugc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAnbGVmdCcgIHRoZW4gc2xhc2guZGlyIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gQGFjdGl2ZVJvdygpLml0ZW0uZmlsZVxuICAgICAgICBAXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgIFxuICAgIFxuICAgIGRvU2VhcmNoOiAoY2hhcikgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQG51bVJvd3MoKVxuICAgICAgICBcbiAgICAgICAgaWYgbm90IEBzZWFyY2hEaXZcbiAgICAgICAgICAgIEBzZWFyY2hEaXYgPSBlbGVtIGNsYXNzOiAnYnJvd3NlclNlYXJjaCdcbiAgICAgICAgICAgIFxuICAgICAgICBAc2V0U2VhcmNoIEBzZWFyY2ggKyBjaGFyXG4gICAgICAgIFxuICAgIGJhY2tzcGFjZVNlYXJjaDogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBzZWFyY2hEaXYgYW5kIEBzZWFyY2gubGVuZ3RoXG4gICAgICAgICAgICBAc2V0U2VhcmNoIEBzZWFyY2hbMC4uLkBzZWFyY2gubGVuZ3RoLTFdXG4gICAgICAgICAgICBcbiAgICBzZXRTZWFyY2g6IChAc2VhcmNoKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgIGNsZWFyVGltZW91dCBAc2VhcmNoVGltZXJcbiAgICAgICAgQHNlYXJjaFRpbWVyID0gc2V0VGltZW91dCBAY2xlYXJTZWFyY2gsIDIwMDBcbiAgICAgICAgXG4gICAgICAgIEBzZWFyY2hEaXYudGV4dENvbnRlbnQgPSBAc2VhcmNoXG5cbiAgICAgICAgYWN0aXZlSW5kZXggID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gMFxuICAgICAgICBhY3RpdmVJbmRleCArPSAxIGlmIChAc2VhcmNoLmxlbmd0aCA9PSAxKSAjb3IgKGNoYXIgPT0gJycpXG4gICAgICAgIGFjdGl2ZUluZGV4ICA9IDAgaWYgYWN0aXZlSW5kZXggPj0gQG51bVJvd3MoKVxuICAgICAgICBcbiAgICAgICAgZm9yIHJvd3MgaW4gW0Byb3dzLnNsaWNlKGFjdGl2ZUluZGV4KSwgQHJvd3Muc2xpY2UoMCxhY3RpdmVJbmRleCsxKV1cbiAgICAgICAgICAgIGZ1enppZWQgPSBmdXp6eS5maWx0ZXIgQHNlYXJjaCwgcm93cywgZXh0cmFjdDogKHIpIC0+IHIuaXRlbS5uYW1lXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGZ1enppZWQubGVuZ3RoXG4gICAgICAgICAgICAgICAgcm93ID0gZnV6emllZFswXS5vcmlnaW5hbFxuICAgICAgICAgICAgICAgIHJvdy5kaXYuYXBwZW5kQ2hpbGQgQHNlYXJjaERpdlxuICAgICAgICAgICAgICAgIHJvdy5hY3RpdmF0ZSgpXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgQFxuICAgIFxuICAgIGNsZWFyU2VhcmNoOiA9PlxuICAgICAgICBcbiAgICAgICAgQHNlYXJjaCA9ICcnXG4gICAgICAgIEBzZWFyY2hEaXY/LnJlbW92ZSgpXG4gICAgICAgIGRlbGV0ZSBAc2VhcmNoRGl2XG4gICAgICAgIEBcbiAgICBcbiAgICByZW1vdmVPYmplY3Q6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiByb3cgPSBAYWN0aXZlUm93KClcbiAgICAgICAgICAgIG5leHRPclByZXYgPSByb3cubmV4dCgpID8gcm93LnByZXYoKVxuICAgICAgICAgICAgQHJlbW92ZVJvdyByb3dcbiAgICAgICAgICAgIG5leHRPclByZXY/LmFjdGl2YXRlKClcbiAgICAgICAgQFxuXG4gICAgcmVtb3ZlUm93OiAocm93KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgcm93ID09IEBhY3RpdmVSb3coKVxuICAgICAgICAgICAgaWYgQG5leHRDb2x1bW4oKT8ucGFyZW50Py5maWxlID09IHJvdy5pdGVtPy5maWxlXG4gICAgICAgICAgICAgICAgQGJyb3dzZXIuY2xlYXJDb2x1bW5zRnJvbSBAaW5kZXggKyAxXG4gICAgICAgICAgICBcbiAgICAgICAgcm93LmRpdi5yZW1vdmUoKVxuICAgICAgICBAaXRlbXMuc3BsaWNlIHJvdy5pbmRleCgpLCAxXG4gICAgICAgIEByb3dzLnNwbGljZSByb3cuaW5kZXgoKSwgMVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBzb3J0QnlOYW1lOiA9PlxuICAgICAgICAgXG4gICAgICAgIEByb3dzLnNvcnQgKGEsYikgLT4gXG4gICAgICAgICAgICAoYS5pdGVtLnR5cGUgKyBhLml0ZW0ubmFtZSkubG9jYWxlQ29tcGFyZShiLml0ZW0udHlwZSArIGIuaXRlbS5uYW1lKVxuICAgICAgICAgICAgXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBmb3Igcm93IGluIEByb3dzXG4gICAgICAgICAgICBAdGFibGUuYXBwZW5kQ2hpbGQgcm93LmRpdlxuICAgICAgICBAXG4gICAgICAgIFxuICAgIHNvcnRCeVR5cGU6ID0+XG4gICAgICAgIFxuICAgICAgICBAcm93cy5zb3J0IChhLGIpIC0+IFxuICAgICAgICAgICAgYXR5cGUgPSBhLml0ZW0udHlwZSA9PSAnZmlsZScgYW5kIHNsYXNoLmV4dChhLml0ZW0ubmFtZSkgb3IgJ19fXycgI2EuaXRlbS50eXBlXG4gICAgICAgICAgICBidHlwZSA9IGIuaXRlbS50eXBlID09ICdmaWxlJyBhbmQgc2xhc2guZXh0KGIuaXRlbS5uYW1lKSBvciAnX19fJyAjYi5pdGVtLnR5cGVcbiAgICAgICAgICAgIChhLml0ZW0udHlwZSArIGF0eXBlICsgYS5pdGVtLm5hbWUpLmxvY2FsZUNvbXBhcmUoYi5pdGVtLnR5cGUgKyBidHlwZSArIGIuaXRlbS5uYW1lLCB1bmRlZmluZWQsIG51bWVyaWM6dHJ1ZSlcbiAgICAgICAgICAgIFxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgZm9yIHJvdyBpbiBAcm93c1xuICAgICAgICAgICAgQHRhYmxlLmFwcGVuZENoaWxkIHJvdy5kaXZcbiAgICAgICAgQFxuXG4gICAgc29ydEJ5RGF0ZUFkZGVkOiA9PlxuICAgICAgICBcbiAgICAgICAgQHJvd3Muc29ydCAoYSxiKSAtPiBiLml0ZW0uc3RhdD8uYXRpbWVNcyAtIGEuaXRlbS5zdGF0Py5hdGltZU1zXG4gICAgICAgICAgICBcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3NcbiAgICAgICAgICAgIEB0YWJsZS5hcHBlbmRDaGlsZCByb3cuZGl2XG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIHRvZ2dsZURvdEZpbGVzOiA9PlxuXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSB1bmRlZmluZWRcbiAgICAgICAgICAgIEBwYXJlbnQudHlwZSA9IHNsYXNoLmlzRGlyKEBwYXJlbnQuZmlsZSkgYW5kICdkaXInIG9yICdmaWxlJ1xuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSAnZGlyJyAgICAgICAgICAgIFxuICAgICAgICAgICAgc3RhdGVLZXkgPSBcImJyb3dzZXJ8c2hvd0hpZGRlbnwje0BwYXJlbnQuZmlsZX1cIlxuICAgICAgICAgICAgaWYgd2luZG93LnN0YXRlLmdldCBzdGF0ZUtleVxuICAgICAgICAgICAgICAgIHdpbmRvdy5zdGF0ZS5kZWwgc3RhdGVLZXlcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwcmVmcy5zZXQgc3RhdGVLZXksIHRydWVcbiAgICAgICAgICAgIGtsb2cgJ3RvZ2dsZURvdEZpbGVzJ1xuICAgICAgICAgICAgQGJyb3dzZXIubG9hZERpckl0ZW0gQHBhcmVudCwgQGluZGV4LCBpZ25vcmVDYWNoZTp0cnVlXG4gICAgICAgIEBcbiAgICAgICAgIFxuICAgIHRvZ2dsZUV4dGVuc2lvbnM6ID0+XG5cbiAgICAgICAgc3RhdGVLZXkgPSBcImJyb3dzZXJ8aGlkZUV4dGVuc2lvbnNcIlxuICAgICAgICB3aW5kb3cuc3RhdGUuc2V0IHN0YXRlS2V5LCBub3Qgd2luZG93LnN0YXRlLmdldCBzdGF0ZUtleSwgZmFsc2VcbiAgICAgICAgc2V0U3R5bGUgJy5icm93c2VyUm93IC5leHQnICdkaXNwbGF5JyB3aW5kb3cuc3RhdGUuZ2V0KHN0YXRlS2V5KSBhbmQgJ25vbmUnIG9yICdpbml0aWFsJ1xuICAgICAgICBAXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBtb3ZlVG9UcmFzaDogPT5cbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gQGJyb3dzZXIuc2VsZWN0LmZyZWVJbmRleCgpXG4gICAgICAgIGlmIGluZGV4ID49IDBcbiAgICAgICAgICAgIHNlbGVjdFJvdyA9IEByb3cgaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGZvciByb3cgaW4gQGJyb3dzZXIuc2VsZWN0LnJvd3NcbiAgICAgICAgICAgIHd4dyAndHJhc2gnIHJvdy5wYXRoKClcbiAgICAgICAgICAgIEByZW1vdmVSb3cgcm93XG4gICAgICAgICAgIFxuICAgICAgICBpZiBzZWxlY3RSb3dcbiAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgc2VsZWN0Um93XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBuYXZpZ2F0ZUNvbHMgJ2xlZnQnXG5cbiAgICBhZGRUb1NoZWxmOiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgcGF0aFRvU2hlbGYgPSBAYWN0aXZlUGF0aCgpXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ2FkZFRvU2hlbGYnIHBhdGhUb1NoZWxmXG4gICAgICAgIFxuICAgIG5ld0ZvbGRlcjogPT5cbiAgICAgICAgXG4gICAgICAgIHNsYXNoLnVudXNlZCBzbGFzaC5qb2luKEBwYXRoKCksICdOZXcgZm9sZGVyJyksIChuZXdEaXIpID0+XG4gICAgICAgICAgICBmcy5ta2RpciBuZXdEaXIsIChlcnIpID0+XG4gICAgICAgICAgICAgICAgaWYgZW1wdHkgZXJyXG4gICAgICAgICAgICAgICAgICAgIHJvdyA9IEBpbnNlcnRGaWxlIG5ld0RpclxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3Qucm93IHJvd1xuICAgICAgICAgICAgICAgICAgICByb3cuZWRpdE5hbWUoKVxuICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBkdXBsaWNhdGVGaWxlOiA9PlxuICAgICAgICAgICAgICAgIFxuICAgICAgICBmb3IgZmlsZSBpbiBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKVxuICAgICAgICAgICAgRmlsZS5kdXBsaWNhdGUgZmlsZSwgKHNvdXJjZSwgdGFyZ2V0KSA9PlxuICAgICAgICAgICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSAnZmlsZSdcbiAgICAgICAgICAgICAgICAgICAgY29sID0gQHByZXZDb2x1bW4oKVxuICAgICAgICAgICAgICAgICAgICBjb2wuZm9jdXMoKVxuICAgICAgICAgICAgICAgIGVsc2UgY29sID0gQFxuICAgICAgICAgICAgICAgIHJvdyA9IGNvbC5pbnNlcnRGaWxlIHRhcmdldFxuICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgcm93XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBleHBsb3JlcjogPT5cbiAgICAgICAgXG4gICAgICAgIG9wZW4gc2xhc2guZGlyIEBhY3RpdmVQYXRoKClcbiAgICAgICAgXG4gICAgb3BlbjogPT5cblxuICAgICAgICBvcGVuIEBhY3RpdmVQYXRoKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgdXBkYXRlR2l0RmlsZXM6IChmaWxlcykgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3NcbiAgICAgICAgICAgIHJldHVybiBpZiByb3cuaXRlbS50eXBlIG5vdCBpbiBbJ2RpcicgJ2ZpbGUnXVxuICAgICAgICAgICAgc3RhdHVzID0gZmlsZXNbcm93Lml0ZW0uZmlsZV1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgJCgnLmJyb3dzZXJTdGF0dXNJY29uJyByb3cuZGl2KT8ucmVtb3ZlKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgc3RhdHVzP1xuICAgICAgICAgICAgICAgIHJvdy5kaXYuYXBwZW5kQ2hpbGQgZWxlbSAnc3BhbicgY2xhc3M6XCJnaXQtI3tzdGF0dXN9LWljb24gYnJvd3NlclN0YXR1c0ljb25cIlxuICAgICAgICAgICAgZWxzZSBpZiByb3cuaXRlbS50eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgZm9yIGZpbGUsIHN0YXR1cyBvZiBmaWxlc1xuICAgICAgICAgICAgICAgICAgICBpZiByb3cuaXRlbS5uYW1lICE9ICcuLicgYW5kIGZpbGUuc3RhcnRzV2l0aCByb3cuaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgICAgICByb3cuZGl2LmFwcGVuZENoaWxkIGVsZW0gJ3NwYW4nIGNsYXNzOlwiZ2l0LWRpcnMtaWNvbiBicm93c2VyU3RhdHVzSWNvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgXG4gICAgICAgIFxuICAgIG1ha2VSb290OiA9PiBcbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLnNoaWZ0Q29sdW1uc1RvIEBpbmRleFxuICAgICAgICBcbiAgICAgICAgaWYgQGJyb3dzZXIuY29sdW1uc1swXS5pdGVtc1swXS5uYW1lICE9ICcuLidcblxuICAgICAgICAgICAgQHVuc2hpZnRJdGVtIFxuICAgICAgICAgICAgICAgIG5hbWU6ICcuLidcbiAgICAgICAgICAgICAgICB0eXBlOiAnZGlyJ1xuICAgICAgICAgICAgICAgIGZpbGU6IHNsYXNoLmRpciBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQGNydW1iLnNldEZpbGUgQHBhcmVudC5maWxlXG4gICAgXG4gICAgb25Db250ZXh0TWVudTogKGV2ZW50LCBjb2x1bW4pID0+IFxuICAgICAgICBcbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgIFxuICAgICAgICBhYnNQb3MgPSBrcG9zIGV2ZW50XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgY29sdW1uXG4gICAgICAgICAgICBAc2hvd0NvbnRleHRNZW51IGFic1Bvc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG9wdCA9IGl0ZW1zOiBbIFxuICAgICAgICAgICAgICAgIHRleHQ6ICAgJ1Jvb3QnXG4gICAgICAgICAgICAgICAgY2I6ICAgICBAbWFrZVJvb3RcbiAgICAgICAgICAgICxcbiAgICAgICAgICAgICAgICB0ZXh0OiAgICdBZGQgdG8gU2hlbGYnXG4gICAgICAgICAgICAgICAgY29tYm86ICAnYWx0K3NoaWZ0Ky4nXG4gICAgICAgICAgICAgICAgY2I6ICAgICA9PiBwb3N0LmVtaXQgJ2FkZFRvU2hlbGYnIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgLFxuICAgICAgICAgICAgICAgIHRleHQ6ICAgJ0V4cGxvcmVyJ1xuICAgICAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtlJyBcbiAgICAgICAgICAgICAgICBjYjogICAgID0+IG9wZW4gQHBhcmVudC5maWxlXG4gICAgICAgICAgICBdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgICAgIHBvcHVwLm1lbnUgb3B0ICAgIFxuICAgICAgICAgICAgICBcbiAgICBzaG93Q29udGV4dE1lbnU6IChhYnNQb3MpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgYWJzUG9zP1xuICAgICAgICAgICAgYWJzUG9zID0ga3BvcyBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQsIEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG4gICAgICAgIFxuICAgICAgICBvcHQgPSBpdGVtczogWyBcbiAgICAgICAgICAgIHRleHQ6ICAgJ1RvZ2dsZSBJbnZpc2libGUnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK2knIFxuICAgICAgICAgICAgY2I6ICAgICBAdG9nZ2xlRG90RmlsZXNcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnVG9nZ2xlIEV4dGVuc2lvbnMnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK2UnIFxuICAgICAgICAgICAgY2I6ICAgICBAdG9nZ2xlRXh0ZW5zaW9uc1xuICAgICAgICAsICAgICAgICAgICAgXG4gICAgICAgICAgICB0ZXh0OiAgICcnXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ0V4cGxvcmVyJ1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K2UnIFxuICAgICAgICAgICAgY2I6ICAgICBAZXhwbG9yZXJcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnJ1xuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdBZGQgdG8gU2hlbGYnXG4gICAgICAgICAgICBjb21ibzogICdhbHQrc2hpZnQrLidcbiAgICAgICAgICAgIGNiOiAgICAgQGFkZFRvU2hlbGZcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnJ1xuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdNb3ZlIHRvIFRyYXNoJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtiYWNrc3BhY2UnIFxuICAgICAgICAgICAgY2I6ICAgICBAbW92ZVRvVHJhc2hcbiAgICAgICAgLCAgIFxuICAgICAgICAgICAgdGV4dDogICAnJ1xuICAgICAgICAgICAgaGlkZTogICBAcGFyZW50LnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ0R1cGxpY2F0ZSdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrZCcgXG4gICAgICAgICAgICBjYjogICAgIEBkdXBsaWNhdGVGaWxlXG4gICAgICAgICAgICBoaWRlOiAgIEBwYXJlbnQudHlwZSA9PSAnZmlsZSdcbiAgICAgICAgLCAgIFxuICAgICAgICAgICAgdGV4dDogICAnTmV3IEZvbGRlcidcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtuJyBcbiAgICAgICAgICAgIGNiOiAgICAgQG5ld0ZvbGRlclxuICAgICAgICAgICAgaGlkZTogICBAcGFyZW50LnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSAhPSAnZmlsZSdcbiAgICAgICAgICAgIG9wdC5pdGVtcyA9IG9wdC5pdGVtcy5jb25jYXQgW1xuICAgICAgICAgICAgICAgIHRleHQ6ICAgJydcbiAgICAgICAgICAgICwgICBcbiAgICAgICAgICAgICAgICB0ZXh0OiAgICdTb3J0J1xuICAgICAgICAgICAgICAgIG1lbnU6IFtcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0J5IE5hbWUnIGNvbWJvOidjdHJsK24nLCBjYjpAc29ydEJ5TmFtZVxuICAgICAgICAgICAgICAgICxcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0J5IFR5cGUnIGNvbWJvOidjdHJsK3QnLCBjYjpAc29ydEJ5VHlwZVxuICAgICAgICAgICAgICAgICxcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0J5IERhdGUnIGNvbWJvOidjdHJsK2EnLCBjYjpAc29ydEJ5RGF0ZUFkZGVkXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgXVxuICAgICAgICBcbiAgICAgICAgb3B0LnggPSBhYnNQb3MueFxuICAgICAgICBvcHQueSA9IGFic1Bvcy55XG4gICAgICAgIHBvcHVwLm1lbnUgb3B0ICAgICAgICBcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgY29weVBhdGhzOiAtPlxuICAgICAgICBwYXRocyA9IEBicm93c2VyLnNlbGVjdC5maWxlcygpLmpvaW4gJ1xcbidcbiAgICAgICAga2xvZyAnY29weSBwYXRocycgcGF0aHNcbiAgICAgICAgZWxlY3Ryb24uY2xpcGJvYXJkLndyaXRlVGV4dCBwYXRoc1xuICAgICAgICBwYXRoc1xuICAgICAgICBcbiAgICBjdXRQYXRoczogLT5cbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLmN1dFBhdGhzID0gQGNvcHlQYXRocygpXG4gICAgICAgIFxuICAgIHBhc3RlUGF0aHM6IC0+XG4gICAgICAgIFxuICAgICAgICB0ZXh0ID0gZWxlY3Ryb24uY2xpcGJvYXJkLnJlYWRUZXh0KClcbiAgICAgICAgcGF0aHMgPSB0ZXh0LnNwbGl0ICdcXG4nXG4gICAgICAgIFxuICAgICAgICBrbG9nICdwYXN0ZVBhdGhzJyBwYXRoc1xuICAgICAgICBcbiAgICAgICAgaWYgdGV4dCA9PSBAYnJvd3Nlci5jdXRQYXRoc1xuICAgICAgICAgICAgYWN0aW9uID0gJ21vdmUnXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGFjdGlvbiA9ICdjb3B5J1xuICAgICAgICB0YXJnZXQgPSBAcGFyZW50LmZpbGVcbiAgICAgICAgaWYgQGFjdGl2ZVJvdygpPy5pdGVtLnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgIHRhcmdldCA9IEBhY3RpdmVSb3coKS5pdGVtLmZpbGVcbiAgICAgICAgQGJyb3dzZXIuZHJvcEFjdGlvbiBhY3Rpb24sIHBhdGhzLCB0YXJnZXRcbiAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBvbktleTogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgeyBtb2QsIGtleSwgY29tYm8sIGNoYXIgfSA9IGtleWluZm8uZm9yRXZlbnQgZXZlbnRcblxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ3NoaWZ0K2AnICd+JyAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBicm93c2VyLmJyb3dzZSAnfidcbiAgICAgICAgICAgIHdoZW4gJy8nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBicm93c2VyLmJyb3dzZSAnLydcbiAgICAgICAgICAgIHdoZW4gJ2JhY2tzcGFjZScgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBicm93c2VyLm9uQmFja3NwYWNlSW5Db2x1bW4gQFxuICAgICAgICAgICAgd2hlbiAnZGVsZXRlJyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGJyb3dzZXIub25EZWxldGVJbkNvbHVtbiBAXG4gICAgICAgICAgICB3aGVuICdhbHQrbGVmdCcgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCB3aW5kb3cuc3BsaXQuZm9jdXMgJ3NoZWxmJ1xuICAgICAgICAgICAgd2hlbiAnYWx0K3NoaWZ0Ky4nICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGFkZFRvU2hlbGYoKVxuICAgICAgICAgICAgd2hlbiAnYWx0K2UnICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGV4cGxvcmVyKClcbiAgICAgICAgICAgIHdoZW4gJ2FsdCtuJyAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuZXdGb2xkZXIoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCt4JyAnY29tbWFuZCt4JyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGN1dFBhdGhzKClcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrYycgJ2NvbW1hbmQrYycgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBjb3B5UGF0aHMoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCt2JyAnY29tbWFuZCt2JyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHBhc3RlUGF0aHMoKVxuICAgICAgICAgICAgd2hlbiAncGFnZSB1cCcgJ3BhZ2UgZG93bicgJ2hvbWUnICdlbmQnIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJydhbHQrdXAnICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZUNvbHMga2V5XG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK3VwJyAnY3RybCt1cCcgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb3dzICdob21lJ1xuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtkb3duJyAnY3RybCtkb3duJyAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyAnZW5kJ1xuICAgICAgICAgICAgd2hlbiAnY3RybCt0JyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeVR5cGUoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCtuJyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeU5hbWUoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCthJyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeURhdGVBZGRlZCgpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2knICdjdHJsK2knICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAdG9nZ2xlRG90RmlsZXMoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtkJyAnY3RybCtkJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGR1cGxpY2F0ZUZpbGUoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtrJyAnY3RybCtrJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCBpZiBAYnJvd3Nlci5jbGVhblVwKCkgIyBuZWVkZWQ/XG4gICAgICAgICAgICB3aGVuICdmMicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYWN0aXZlUm93KCk/LmVkaXROYW1lKClcbiAgICAgICAgICAgIHdoZW4gJ3NoaWZ0K3VwJyAnc2hpZnQrZG93bicgJ3NoaWZ0K2hvbWUnICdzaGlmdCtlbmQnICdzaGlmdCtwYWdlIHVwJyAnc2hpZnQrcGFnZSBkb3duJyBcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAZXh0ZW5kU2VsZWN0aW9uIGtleVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtsZWZ0JyAnY29tbWFuZCtyaWdodCcgJ2N0cmwrbGVmdCcgJ2N0cmwrcmlnaHQnXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm9vdCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrYmFja3NwYWNlJyAnY3RybCtiYWNrc3BhY2UnICdjb21tYW5kK2RlbGV0ZScgJ2N0cmwrZGVsZXRlJyBcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbW92ZVRvVHJhc2goKVxuICAgICAgICAgICAgd2hlbiAndGFiJyAgICBcbiAgICAgICAgICAgICAgICBpZiBAc2VhcmNoLmxlbmd0aCB0aGVuIEBkb1NlYXJjaCAnJ1xuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnRcbiAgICAgICAgICAgIHdoZW4gJ2VzYydcbiAgICAgICAgICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgICAgICAgICBAZHJhZ0Rpdi5kcmFnLmRyYWdTdG9wKClcbiAgICAgICAgICAgICAgICAgICAgQGRyYWdEaXYucmVtb3ZlKClcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIEBkcmFnRGl2XG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKS5sZW5ndGggPiAxXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgQGFjdGl2ZVJvdygpXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAc2VhcmNoLmxlbmd0aCB0aGVuIEBjbGVhclNlYXJjaCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudFxuXG4gICAgICAgIGlmIGNvbWJvIGluIFsndXAnICAgJ2Rvd24nXSAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb3dzIGtleSAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNvbWJvIGluIFsnbGVmdCcgJ3JpZ2h0J10gdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVDb2xzIGtleVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG1vZCBpbiBbJ3NoaWZ0JyAnJ10gYW5kIGNoYXIgdGhlbiBAZG9TZWFyY2ggY2hhclxuICAgICAgICBcbiAgICAgICAgaWYgQGRyYWdEaXZcbiAgICAgICAgICAgIEB1cGRhdGVEcmFnSW5kaWNhdG9yIGV2ZW50XG4gICAgICAgICAgICBcbiAgICBvbktleVVwOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgQHVwZGF0ZURyYWdJbmRpY2F0b3IgZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBDb2x1bW5cblxuXG4iXX0=
//# sourceURL=../../coffee/browser/column.coffee