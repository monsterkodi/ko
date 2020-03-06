// koffee 1.12.0

/*
 0000000   0000000   000      000   000  00     00  000   000
000       000   000  000      000   000  000   000  0000  000
000       000   000  000      000   000  000000000  000 0 000
000       000   000  000      000   000  000 0 000  000  0000
 0000000   0000000   0000000   0000000   000   000  000   000
 */
var $, Column, Crumb, File, Row, Scroller, Viewer, _, clamp, drag, electron, elem, empty, fs, fuzzy, kerror, keyinfo, klog, kpos, open, popup, post, prefs, ref, setStyle, slash, stopEvent, valid, wxw,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), $ = ref.$, _ = ref._, clamp = ref.clamp, drag = ref.drag, elem = ref.elem, empty = ref.empty, fs = ref.fs, kerror = ref.kerror, keyinfo = ref.keyinfo, klog = ref.klog, kpos = ref.kpos, open = ref.open, popup = ref.popup, post = ref.post, prefs = ref.prefs, setStyle = ref.setStyle, slash = ref.slash, stopEvent = ref.stopEvent, valid = ref.valid;

Row = require('./row');

Crumb = require('./crumb');

Scroller = require('./scroller');

File = require('../tools/file');

Viewer = require('./viewer');

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
        this.openViewer = bind(this.openViewer, this);
        this.addToShelf = bind(this.addToShelf, this);
        this.moveToTrash = bind(this.moveToTrash, this);
        this.toggleExtensions = bind(this.toggleExtensions, this);
        this.toggleDotFiles = bind(this.toggleDotFiles, this);
        this.sortByDateAdded = bind(this.sortByDateAdded, this);
        this.sortByType = bind(this.sortByType, this);
        this.sortByName = bind(this.sortByName, this);
        this.removeObject = bind(this.removeObject, this);
        this.clearSearch = bind(this.clearSearch, this);
        this.updateCrumb = bind(this.updateCrumb, this);
        this.onDblClick = bind(this.onDblClick, this);
        this.onMouseOut = bind(this.onMouseOut, this);
        this.onMouseOver = bind(this.onMouseOver, this);
        this.onBlur = bind(this.onBlur, this);
        this.onFocus = bind(this.onFocus, this);
        this.insertFile = bind(this.insertFile, this);
        this.removeFile = bind(this.removeFile, this);
        this.onDragStop = bind(this.onDragStop, this);
        this.onSpringLoadTimeout = bind(this.onSpringLoadTimeout, this);
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
        this.table = elem({
            "class": 'browserColumnTable'
        });
        this.div.appendChild(this.table);
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
        this.scroll = new Scroller(this);
        this.setIndex((ref2 = this.browser.columns) != null ? ref2.length : void 0);
    }

    Column.prototype.setIndex = function(index1) {
        var ref1;
        this.index = index1;
        return (ref1 = this.crumb) != null ? ref1.elem.columnIndex = this.index : void 0;
    };

    Column.prototype.width = function() {
        return this.div.getBoundingClientRect().width;
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
        var i, len, pos, ref1, row, rowClone;
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
            clearTimeout(this.browser.springLoadTimer);
            delete this.browser.springLoadTarget;
            if (row = this.browser.rowAtPos(d.pos)) {
                if (row.item.type === 'dir') {
                    this.browser.springLoadTimer = setTimeout(this.onSpringLoadTimeout, 1000);
                    this.browser.springLoadTarget = row.item.file;
                }
            }
            this.updateDragIndicator(e);
            return this.dragDiv.style.transform = "translateX(" + d.deltaSum.x + "px) translateY(" + d.deltaSum.y + "px)";
        }
    };

    Column.prototype.onSpringLoadTimeout = function() {
        var column, row;
        if (column = this.browser.columnForFile(this.browser.springLoadTarget)) {
            if (row = column.row(this.browser.springLoadTarget)) {
                return row.activate();
            }
        }
    };

    Column.prototype.updateDragIndicator = function(event) {
        var ref1, ref2;
        if ((ref1 = this.dragInd) != null) {
            ref1.classList.toggle('copy', event.shiftKey);
        }
        return (ref2 = this.dragInd) != null ? ref2.classList.toggle('move', event.ctrlKey || event.metaKey || event.altKey) : void 0;
    };

    Column.prototype.onDragStop = function(d, e) {
        var action, column, files, ref1, ref2, ref3, row, target;
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
            } else if (column = this.browser.columnAtX(d.pos.x)) {
                target = (ref2 = column.parent) != null ? ref2.file : void 0;
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
                return (ref3 = this.activeRow()) != null ? ref3.clearActive() : void 0;
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

    Column.prototype.loadItems = function(items, parent) {
        var i, item, len, ref1;
        this.browser.clearColumn(this.index);
        this.items = items;
        this.parent = parent;
        this.crumb.setFile(this.parent.file);
        if (this.parent.type === void 0) {
            this.parent.type = slash.isDir(this.parent.file) && 'dir' || 'file';
        }
        if (this.parent == null) {
            kerror("no parent item?");
        }
        if (this.parent.type == null) {
            kerror("loadItems -- no parent type?", this.parent);
        }
        if (valid(this.items)) {
            ref1 = this.items;
            for (i = 0, len = ref1.length; i < len; i++) {
                item = ref1[i];
                this.rows.push(new Row(this, item));
            }
            this.scroll.update();
        }
        if (this.parent.type === 'dir' && slash.samePath('~/Downloads', this.parent.file)) {
            this.sortByDateAdded();
        }
        return this;
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
        this.clearSearch();
        delete this.parent;
        this.div.scrollTop = 0;
        this.table.innerHTML = '';
        this.crumb.clear();
        this.rows = [];
        return this.scroll.update();
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
        return Math.max(0, Math.floor((pos.y - this.div.getBoundingClientRect().top) / this.rowHeight()));
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

    Column.prototype.updateCrumb = function() {
        return this.crumb.updateRect(this.div.getBoundingClientRect());
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
        var index, newIndex, ref1, ref2, ref3;
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
        if (newIndex === index) {
            return;
        }
        if (((ref3 = this.rows[newIndex]) != null ? ref3.activate : void 0) == null) {
            console.error("no row at index " + newIndex + "/" + (this.numRows() - 1) + "?", this.numRows());
        }
        return this.browser.select.row(this.rows[newIndex]);
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

    Column.prototype.openViewer = function() {
        var path, ref1;
        if (((ref1 = this.activeRow()) != null ? ref1.item.name : void 0) !== '..') {
            path = this.activePath();
        } else {
            path = this.parent.file;
        }
        if (path) {
            if (File.isText(path)) {
                return;
            }
            if (slash.isFile(path)) {
                if (!File.isImage(path)) {
                    path = this.path();
                }
            }
            return this.browser.viewer = new Viewer(this.browser, path);
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
            case 'alt+shift+.':
                return stopEvent(event, this.addToShelf());
            case 'alt+e':
                return this.explorer();
            case 'alt+o':
                return this.open();
            case 'alt+n':
                return this.newFolder();
            case 'space':
            case 'alt+v':
                return this.openViewer();
            case 'ctrl+x':
            case 'command+x':
                return this.cutPaths();
            case 'ctrl+c':
            case 'command+c':
                return this.copyPaths();
            case 'ctrl+v':
            case 'command+v':
                return this.pastePaths();
            case 'shift+up':
            case 'shift+down':
            case 'shift+home':
            case 'shift+end':
            case 'shift+page up':
            case 'shift+page down':
                return stopEvent(event, this.extendSelection(key));
            case 'page up':
            case 'page down':
            case 'home':
            case 'end':
                return stopEvent(event, this.navigateRows(key));
            case 'command+up':
            case 'ctrl+up':
                return stopEvent(event, this.navigateRows('home'));
            case 'command+down':
            case 'ctrl+down':
                return stopEvent(event, this.navigateRows('end'));
            case 'enter':
            case 'alt+up':
                return stopEvent(event, this.navigateCols(key));
            case 'backspace':
                return stopEvent(event, this.browser.onBackspaceInColumn(this));
            case 'delete':
                return stopEvent(event, this.browser.onDeleteInColumn(this));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sdW1uLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9icm93c2VyIiwic291cmNlcyI6WyJjb2x1bW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLG1NQUFBO0lBQUE7O0FBUUEsTUFBbUksT0FBQSxDQUFRLEtBQVIsQ0FBbkksRUFBRSxTQUFGLEVBQUssU0FBTCxFQUFRLGlCQUFSLEVBQWUsZUFBZixFQUFxQixlQUFyQixFQUEyQixpQkFBM0IsRUFBa0MsV0FBbEMsRUFBc0MsbUJBQXRDLEVBQThDLHFCQUE5QyxFQUF1RCxlQUF2RCxFQUE2RCxlQUE3RCxFQUFtRSxlQUFuRSxFQUF5RSxpQkFBekUsRUFBZ0YsZUFBaEYsRUFBc0YsaUJBQXRGLEVBQTZGLHVCQUE3RixFQUF1RyxpQkFBdkcsRUFBOEcseUJBQTlHLEVBQXlIOztBQUV6SCxHQUFBLEdBQVcsT0FBQSxDQUFRLE9BQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxTQUFSOztBQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFDWCxJQUFBLEdBQVcsT0FBQSxDQUFRLGVBQVI7O0FBQ1gsTUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsT0FBUjs7QUFDWCxHQUFBLEdBQVcsT0FBQSxDQUFRLEtBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztBQUVMO0lBRUMsZ0JBQUMsT0FBRDtBQUVDLFlBQUE7UUFGQSxJQUFDLENBQUEsVUFBRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7UUFFQSxJQUFDLENBQUEsV0FBRCxHQUFlO1FBQ2YsSUFBQyxDQUFBLE1BQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxLQUFELEdBQVU7UUFDVixJQUFDLENBQUEsSUFBRCxHQUFVO1FBRVYsSUFBQyxDQUFBLEdBQUQsR0FBUyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFP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Q0FBQSxZQUFELENBQWMsR0FBZCxDQUFqQixFQUF6Qzs7UUFFQSxJQUFHLENBQUEsR0FBQSxLQUFRLE9BQVIsSUFBQSxHQUFBLEtBQWdCLEVBQWhCLENBQUEsSUFBd0IsSUFBM0I7WUFBcUMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLEVBQXJDOztRQUVBLElBQUcsSUFBQyxDQUFBLE9BQUo7bUJBQ0ksSUFBQyxDQUFBLG1CQUFELENBQXFCLEtBQXJCLEVBREo7O0lBbkRHOztxQkFzRFAsT0FBQSxHQUFTLFNBQUMsS0FBRDtRQUVMLElBQUcsSUFBQyxDQUFBLE9BQUo7bUJBQ0ksSUFBQyxDQUFBLG1CQUFELENBQXFCLEtBQXJCLEVBREo7O0lBRks7Ozs7OztBQUtiLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyAkLCBfLCBjbGFtcCwgZHJhZywgZWxlbSwgZW1wdHksIGZzLCBrZXJyb3IsIGtleWluZm8sIGtsb2csIGtwb3MsIG9wZW4sIHBvcHVwLCBwb3N0LCBwcmVmcywgc2V0U3R5bGUsIHNsYXNoLCBzdG9wRXZlbnQsIHZhbGlkIH0gPSByZXF1aXJlICdreGsnXG5cblJvdyAgICAgID0gcmVxdWlyZSAnLi9yb3cnXG5DcnVtYiAgICA9IHJlcXVpcmUgJy4vY3J1bWInXG5TY3JvbGxlciA9IHJlcXVpcmUgJy4vc2Nyb2xsZXInXG5GaWxlICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL2ZpbGUnXG5WaWV3ZXIgICA9IHJlcXVpcmUgJy4vdmlld2VyJ1xuZnV6enkgICAgPSByZXF1aXJlICdmdXp6eSdcbnd4dyAgICAgID0gcmVxdWlyZSAnd3h3J1xuZWxlY3Ryb24gPSByZXF1aXJlICdlbGVjdHJvbidcblxuY2xhc3MgQ29sdW1uXG4gICAgXG4gICAgQDogKEBicm93c2VyKSAtPlxuICAgICAgICBcbiAgICAgICAgQHNlYXJjaFRpbWVyID0gbnVsbFxuICAgICAgICBAc2VhcmNoID0gJydcbiAgICAgICAgQGl0ZW1zICA9IFtdXG4gICAgICAgIEByb3dzICAgPSBbXVxuICAgICAgICBcbiAgICAgICAgQGRpdiAgID0gZWxlbSBjbGFzczogJ2Jyb3dzZXJDb2x1bW4nIHRhYkluZGV4OjYgaWQ6IEBuYW1lKClcbiAgICAgICAgQHRhYmxlID0gZWxlbSBjbGFzczogJ2Jyb3dzZXJDb2x1bW5UYWJsZSdcbiAgICAgICAgQGRpdi5hcHBlbmRDaGlsZCBAdGFibGVcbiAgICAgICAgXG4gICAgICAgICMgQHNldEluZGV4IEBicm93c2VyLmNvbHVtbnM/Lmxlbmd0aFxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuY29scz8uYXBwZW5kQ2hpbGQgQGRpdlxuICAgICAgICBcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdmb2N1cycgICAgIEBvbkZvY3VzXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnYmx1cicgICAgICBAb25CbHVyXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAna2V5ZG93bicgICBAb25LZXlcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdrZXl1cCcgICAgIEBvbktleVVwXG4gICAgICAgIFxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlb3ZlcicgQG9uTW91c2VPdmVyXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2VvdXQnICBAb25Nb3VzZU91dFxuXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnZGJsY2xpY2snICBAb25EYmxDbGlja1xuICAgICAgICBcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdjb250ZXh0bWVudScgQG9uQ29udGV4dE1lbnVcbiAgXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBkaXZcbiAgICAgICAgICAgIG9uU3RhcnQ6IEBvbkRyYWdTdGFydFxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uRHJhZ01vdmVcbiAgICAgICAgICAgIG9uU3RvcDogIEBvbkRyYWdTdG9wXG4gICAgICAgIFxuICAgICAgICBAY3J1bWIgID0gbmV3IENydW1iIEBcbiAgICAgICAgQHNjcm9sbCA9IG5ldyBTY3JvbGxlciBAXG4gICAgICAgIFxuICAgICAgICBAc2V0SW5kZXggQGJyb3dzZXIuY29sdW1ucz8ubGVuZ3RoXG4gICAgICAgIFxuICAgIHNldEluZGV4OiAoQGluZGV4KSAtPlxuICAgICAgICBcbiAgICAgICAgQGNydW1iPy5lbGVtLmNvbHVtbkluZGV4ID0gQGluZGV4XG4gICAgICAgIFxuICAgIHdpZHRoOiAtPiBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoXG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgb25EcmFnU3RhcnQ6IChkLCBlKSA9PiBcbiAgICBcbiAgICAgICAgQGRyYWdTdGFydFJvdyA9IEByb3cgZS50YXJnZXRcbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLnNraXBPbkRibENsaWNrID0gZmFsc2VcbiAgICAgICAgXG4gICAgICAgIGRlbGV0ZSBAdG9nZ2xlXG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ1N0YXJ0Um93XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGUuc2hpZnRLZXlcbiAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3QudG8gQGRyYWdTdGFydFJvd1xuICAgICAgICAgICAgZWxzZSBpZiBlLm1ldGFLZXkgb3IgZS5hbHRLZXkgb3IgZS5jdHJsS2V5XG4gICAgICAgICAgICAgICAgaWYgbm90IEBkcmFnU3RhcnRSb3cuaXNTZWxlY3RlZCgpXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC50b2dnbGUgQGRyYWdTdGFydFJvd1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQHRvZ2dsZSA9IHRydWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiBAZHJhZ1N0YXJ0Um93LmlzU2VsZWN0ZWQoKVxuICAgICAgICAgICAgICAgICAgICBAZGVzZWxlY3QgPSB0cnVlXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAYWN0aXZlUm93KCk/LmNsZWFyQWN0aXZlKClcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyBAZHJhZ1N0YXJ0Um93LCBmYWxzZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBAaGFzRm9jdXMoKSBhbmQgQGFjdGl2ZVJvdygpXG4gICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyBAYWN0aXZlUm93KClcblxuICAgIG9uRHJhZ01vdmU6IChkLGUpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ1N0YXJ0Um93IGFuZCBub3QgQGRyYWdEaXYgYW5kIHZhbGlkIEBicm93c2VyLnNlbGVjdC5maWxlcygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBpZiBNYXRoLmFicyhkLmRlbHRhU3VtLngpIDwgMjAgYW5kIE1hdGguYWJzKGQuZGVsdGFTdW0ueSkgPCAxMFxuXG4gICAgICAgICAgICBkZWxldGUgQHRvZ2dsZSBcbiAgICAgICAgICAgIGRlbGV0ZSBAZGVzZWxlY3RcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGRyYWdEaXYgPSBlbGVtICdkaXYnXG4gICAgICAgICAgICBAZHJhZ0Rpdi5kcmFnID0gZFxuICAgICAgICAgICAgQGRyYWdEaXYuZmlsZXMgPSBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKVxuICAgICAgICAgICAgcG9zID0ga3BvcyBlLnBhZ2VYLCBlLnBhZ2VZXG4gICAgICAgICAgICByb3cgPSBAYnJvd3Nlci5zZWxlY3Qucm93c1swXVxuXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSdcbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLm9wYWNpdHkgID0gXCIwLjdcIlxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUudG9wICA9IFwiI3twb3MueS1kLmRlbHRhU3VtLnl9cHhcIlxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUubGVmdCA9IFwiI3twb3MueC1kLmRlbHRhU3VtLnh9cHhcIlxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUud2lkdGggPSBcIiN7QHdpZHRoKCktMTJ9cHhcIlxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZHJhZ0luZCA9IGVsZW0gY2xhc3M6J2RyYWdJbmRpY2F0b3InXG4gICAgICAgICAgICBAZHJhZ0Rpdi5hcHBlbmRDaGlsZCBAZHJhZ0luZFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3Igcm93IGluIEBicm93c2VyLnNlbGVjdC5yb3dzXG4gICAgICAgICAgICAgICAgcm93Q2xvbmUgPSByb3cuZGl2LmNsb25lTm9kZSB0cnVlXG4gICAgICAgICAgICAgICAgcm93Q2xvbmUuc3R5bGUuZmxleCA9ICd1bnNldCdcbiAgICAgICAgICAgICAgICByb3dDbG9uZS5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnXG4gICAgICAgICAgICAgICAgcm93Q2xvbmUuc3R5bGUuYm9yZGVyID0gJ25vbmUnXG4gICAgICAgICAgICAgICAgcm93Q2xvbmUuc3R5bGUubWFyZ2luQm90dG9tID0gJy0xcHgnXG4gICAgICAgICAgICAgICAgQGRyYWdEaXYuYXBwZW5kQ2hpbGQgcm93Q2xvbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQgQGRyYWdEaXZcbiAgICAgICAgICAgIEBmb2N1cyBhY3RpdmF0ZTpmYWxzZVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBkcmFnRGl2XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCBAYnJvd3Nlci5zcHJpbmdMb2FkVGltZXJcbiAgICAgICAgICAgIGRlbGV0ZSBAYnJvd3Nlci5zcHJpbmdMb2FkVGFyZ2V0XG4gICAgICAgICAgICBpZiByb3cgPSBAYnJvd3Nlci5yb3dBdFBvcyBkLnBvc1xuICAgICAgICAgICAgICAgIGlmIHJvdy5pdGVtLnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc3ByaW5nTG9hZFRpbWVyID0gc2V0VGltZW91dCBAb25TcHJpbmdMb2FkVGltZW91dCwgMTAwMFxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zcHJpbmdMb2FkVGFyZ2V0ID0gcm93Lml0ZW0uZmlsZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAdXBkYXRlRHJhZ0luZGljYXRvciBlIFxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGVYKCN7ZC5kZWx0YVN1bS54fXB4KSB0cmFuc2xhdGVZKCN7ZC5kZWx0YVN1bS55fXB4KVwiXG5cbiAgICBvblNwcmluZ0xvYWRUaW1lb3V0OiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgY29sdW1uID0gQGJyb3dzZXIuY29sdW1uRm9yRmlsZSBAYnJvd3Nlci5zcHJpbmdMb2FkVGFyZ2V0XG4gICAgICAgICAgICBpZiByb3cgPSBjb2x1bW4ucm93IEBicm93c2VyLnNwcmluZ0xvYWRUYXJnZXRcbiAgICAgICAgICAgICAgICByb3cuYWN0aXZhdGUoKVxuICAgICAgICAgICAgXG4gICAgdXBkYXRlRHJhZ0luZGljYXRvcjogKGV2ZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgQGRyYWdJbmQ/LmNsYXNzTGlzdC50b2dnbGUgJ2NvcHknIGV2ZW50LnNoaWZ0S2V5XG4gICAgICAgIEBkcmFnSW5kPy5jbGFzc0xpc3QudG9nZ2xlICdtb3ZlJyBldmVudC5jdHJsS2V5IG9yIGV2ZW50Lm1ldGFLZXkgb3IgZXZlbnQuYWx0S2V5XG4gICAgICAgICAgICBcbiAgICBvbkRyYWdTdG9wOiAoZCxlKSA9PlxuICAgICAgICBcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBicm93c2VyLnNwcmluZ0xvYWRUaW1lclxuICAgICAgICBkZWxldGUgQGJyb3dzZXIuc3ByaW5nTG9hZFRhcmdldFxuICAgICAgICBcbiAgICAgICAgaWYgQGRyYWdEaXY/XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBkcmFnRGl2LnJlbW92ZSgpXG4gICAgICAgICAgICBmaWxlcyA9IEBkcmFnRGl2LmZpbGVzXG4gICAgICAgICAgICBkZWxldGUgQGRyYWdEaXZcbiAgICAgICAgICAgIGRlbGV0ZSBAZHJhZ1N0YXJ0Um93XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHJvdyA9IEBicm93c2VyLnJvd0F0UG9zIGQucG9zXG4gICAgICAgICAgICAgICAgY29sdW1uID0gcm93LmNvbHVtblxuICAgICAgICAgICAgICAgIHRhcmdldCA9IHJvdy5pdGVtLmZpbGVcbiAgICAgICAgICAgIGVsc2UgaWYgY29sdW1uID0gQGJyb3dzZXIuY29sdW1uQXRQb3MgZC5wb3NcbiAgICAgICAgICAgICAgICB0YXJnZXQgPSBjb2x1bW4ucGFyZW50Py5maWxlXG4gICAgICAgICAgICBlbHNlIGlmIGNvbHVtbiA9IEBicm93c2VyLmNvbHVtbkF0WCBkLnBvcy54XG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gY29sdW1uLnBhcmVudD8uZmlsZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGtsb2cgJ25vIGRyb3AgdGFyZ2V0J1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGFjdGlvbiA9IGUuc2hpZnRLZXkgYW5kICdjb3B5JyBvciAnbW92ZSdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGNvbHVtbiA9PSBAYnJvd3Nlci5zaGVsZiBcbiAgICAgICAgICAgICAgICBpZiB0YXJnZXQgYW5kIChlLmN0cmxLZXkgb3IgZS5zaGlmdEtleSBvciBlLm1ldGFLZXkgb3IgZS5hbHRLZXkpXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLmRyb3BBY3Rpb24gYWN0aW9uLCBmaWxlcywgdGFyZ2V0XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zaGVsZi5hZGRGaWxlcyBmaWxlcywgcG9zOmQucG9zXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGJyb3dzZXIuZHJvcEFjdGlvbiBhY3Rpb24sIGZpbGVzLCB0YXJnZXRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZm9jdXMgYWN0aXZhdGU6ZmFsc2VcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgcm93ID0gQHJvdyBlLnRhcmdldFxuICAgICAgICAgICAgICAgIGlmIHJvdy5pc1NlbGVjdGVkKClcbiAgICAgICAgICAgICAgICAgICAgaWYgZS5tZXRhS2V5IG9yIGUuYWx0S2V5IG9yIGUuY3RybEtleSBvciBlLnNoaWZ0S2V5XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBAdG9nZ2xlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIEB0b2dnbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3QudG9nZ2xlIHJvd1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBAZGVzZWxlY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgQGRlc2VsZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyByb3dcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3cuYWN0aXZhdGUoKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBhY3RpdmVSb3coKT8uY2xlYXJBY3RpdmUoKVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgcmVtb3ZlRmlsZTogKGZpbGUpID0+IFxuICAgICAgICBcbiAgICAgICAgaWYgcm93ID0gQHJvdyBzbGFzaC5maWxlIGZpbGVcbiAgICAgICAgICAgIEByZW1vdmVSb3cgcm93XG4gICAgICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgICAgICBcbiAgICBpbnNlcnRGaWxlOiAoZmlsZSkgPT4gXG5cbiAgICAgICAgaXRlbSA9IEBicm93c2VyLmZpbGVJdGVtIGZpbGVcbiAgICAgICAgcm93ID0gbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIEByb3dzLnB1c2ggcm93XG4gICAgICAgIHJvd1xuICAgIFxuICAgIGxvYWRJdGVtczogKGl0ZW1zLCBwYXJlbnQpIC0+XG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5jbGVhckNvbHVtbiBAaW5kZXhcbiAgICAgICAgXG4gICAgICAgIEBpdGVtcyAgPSBpdGVtc1xuICAgICAgICBAcGFyZW50ID0gcGFyZW50XG4gICAgICAgIFxuICAgICAgICBAY3J1bWIuc2V0RmlsZSBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgQHBhcmVudC50eXBlID09IHVuZGVmaW5lZFxuICAgICAgICAgICAgQHBhcmVudC50eXBlID0gc2xhc2guaXNEaXIoQHBhcmVudC5maWxlKSBhbmQgJ2Rpcicgb3IgJ2ZpbGUnXG4gICAgICAgIFxuICAgICAgICBrZXJyb3IgXCJubyBwYXJlbnQgaXRlbT9cIiBpZiBub3QgQHBhcmVudD9cbiAgICAgICAga2Vycm9yIFwibG9hZEl0ZW1zIC0tIG5vIHBhcmVudCB0eXBlP1wiLCBAcGFyZW50IGlmIG5vdCBAcGFyZW50LnR5cGU/XG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBAaXRlbXNcbiAgICAgICAgICAgIGZvciBpdGVtIGluIEBpdGVtc1xuICAgICAgICAgICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIFxuICAgICAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSAnZGlyJyBhbmQgc2xhc2guc2FtZVBhdGggJ34vRG93bmxvYWRzJyBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIEBzb3J0QnlEYXRlQWRkZWQoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgIHVuc2hpZnRJdGVtOiAoaXRlbSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBpdGVtcy51bnNoaWZ0IGl0ZW1cbiAgICAgICAgQHJvd3MudW5zaGlmdCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgQHRhYmxlLmluc2VydEJlZm9yZSBAdGFibGUubGFzdENoaWxkLCBAdGFibGUuZmlyc3RDaGlsZFxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgIEByb3dzWzBdXG4gICAgICAgIFxuICAgIHB1c2hJdGVtOiAoaXRlbSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBpdGVtcy5wdXNoIGl0ZW1cbiAgICAgICAgQHJvd3MucHVzaCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAcm93c1stMV1cbiAgICAgICAgXG4gICAgYWRkSXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIFxuICAgICAgICByb3cgPSBAcHVzaEl0ZW0gaXRlbVxuICAgICAgICBAc29ydEJ5TmFtZSgpXG4gICAgICAgIHJvd1xuXG4gICAgc2V0SXRlbXM6IChAaXRlbXMsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLmNsZWFyQ29sdW1uIEBpbmRleFxuICAgICAgICBcbiAgICAgICAgQHBhcmVudCA9IG9wdC5wYXJlbnRcbiAgICAgICAga2Vycm9yIFwibm8gcGFyZW50IGl0ZW0/XCIgaWYgbm90IEBwYXJlbnQ/XG4gICAgICAgIGtlcnJvciBcInNldEl0ZW1zIC0tIG5vIHBhcmVudCB0eXBlP1wiLCBAcGFyZW50IGlmIG5vdCBAcGFyZW50LnR5cGU/XG4gICAgICAgIFxuICAgICAgICBmb3IgaXRlbSBpbiBAaXRlbXNcbiAgICAgICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIFxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgIEBcblxuICAgIGlzRGlyOiAgLT4gQHBhcmVudD8udHlwZSA9PSAnZGlyJyBcbiAgICBpc0ZpbGU6IC0+IEBwYXJlbnQ/LnR5cGUgPT0gJ2ZpbGUnIFxuICAgICAgICBcbiAgICBpc0VtcHR5OiAtPiBlbXB0eSBAcGFyZW50XG4gICAgY2xlYXI6ICAgLT5cbiAgICAgICAgQGNsZWFyU2VhcmNoKClcbiAgICAgICAgZGVsZXRlIEBwYXJlbnRcbiAgICAgICAgQGRpdi5zY3JvbGxUb3AgPSAwXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBAY3J1bWIuY2xlYXIoKVxuICAgICAgICBAcm93cyA9IFtdXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAwMDAwMCAgXG4gICBcbiAgICBhY3RpdmF0ZVJvdzogKHJvdykgLT4gQHJvdyhyb3cpPy5hY3RpdmF0ZSgpXG4gICAgICAgXG4gICAgYWN0aXZlUm93OiAtPiBfLmZpbmQgQHJvd3MsIChyKSAtPiByLmlzQWN0aXZlKClcbiAgICBhY3RpdmVQYXRoOiAtPiBAYWN0aXZlUm93KCk/LnBhdGgoKSA/IEBwYXJlbnQuZmlsZVxuICAgIFxuICAgIHJvdzogKHJvdykgLT4gIyBhY2NlcHRzIGVsZW1lbnQsIGluZGV4LCBzdHJpbmcgb3Igcm93XG4gICAgICAgIGlmICAgICAgXy5pc051bWJlciAgcm93IHRoZW4gcmV0dXJuIDAgPD0gcm93IDwgQG51bVJvd3MoKSBhbmQgQHJvd3Nbcm93XSBvciBudWxsXG4gICAgICAgIGVsc2UgaWYgXy5pc0VsZW1lbnQgcm93IHRoZW4gcmV0dXJuIF8uZmluZCBAcm93cywgKHIpIC0+IHIuZGl2LmNvbnRhaW5zIHJvd1xuICAgICAgICBlbHNlIGlmIF8uaXNTdHJpbmcgIHJvdyB0aGVuIHJldHVybiBfLmZpbmQgQHJvd3MsIChyKSAtPiByLml0ZW0ubmFtZSA9PSByb3cgb3Igci5pdGVtLmZpbGUgPT0gcm93XG4gICAgICAgIGVsc2UgcmV0dXJuIHJvd1xuICAgICAgICAgICAgXG4gICAgbmV4dENvbHVtbjogLT4gQGJyb3dzZXIuY29sdW1uIEBpbmRleCsxXG4gICAgcHJldkNvbHVtbjogLT4gQGJyb3dzZXIuY29sdW1uIEBpbmRleC0xXG4gICAgICAgIFxuICAgIG5hbWU6IC0+IFwiI3tAYnJvd3Nlci5uYW1lfToje0BpbmRleH1cIlxuICAgIHBhdGg6IC0+IEBwYXJlbnQ/LmZpbGUgPyAnJ1xuICAgICAgICBcbiAgICBudW1Sb3dzOiAgICAtPiBAcm93cy5sZW5ndGggPyAwICAgXG4gICAgcm93SGVpZ2h0OiAgLT4gQHJvd3NbMF0/LmRpdi5jbGllbnRIZWlnaHQgPyAwXG4gICAgbnVtVmlzaWJsZTogLT4gQHJvd0hlaWdodCgpIGFuZCBwYXJzZUludChAYnJvd3Nlci5oZWlnaHQoKSAvIEByb3dIZWlnaHQoKSkgb3IgMFxuICAgIFxuICAgIHJvd0F0UG9zOiAocG9zKSAtPiBAcm93IEByb3dJbmRleEF0UG9zIHBvc1xuICAgIFxuICAgIHJvd0luZGV4QXRQb3M6IChwb3MpIC0+XG4gICAgICAgIFxuICAgICAgICBNYXRoLm1heCAwLCBNYXRoLmZsb29yIChwb3MueSAtIEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wKSAvIEByb3dIZWlnaHQoKVxuICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGhhc0ZvY3VzOiAtPiBAZGl2LmNsYXNzTGlzdC5jb250YWlucyAnZm9jdXMnXG5cbiAgICBmb2N1czogKG9wdD17fSkgLT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgbm90IEBhY3RpdmVSb3coKSBhbmQgQG51bVJvd3MoKSBhbmQgb3B0Py5hY3RpdmF0ZSAhPSBmYWxzZVxuICAgICAgICAgICAgQHJvd3NbMF0uc2V0QWN0aXZlKClcbiAgICAgICAgICAgIFxuICAgICAgICBAZGl2LmZvY3VzKClcbiAgICAgICAgQGRpdi5jbGFzc0xpc3QuYWRkICdmb2N1cydcbiAgICAgICAgd2luZG93LnNldExhc3RGb2N1cyBAbmFtZSgpXG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgb25Gb2N1czogPT4gQGRpdi5jbGFzc0xpc3QuYWRkICdmb2N1cydcbiAgICBvbkJsdXI6ICA9PiBAZGl2LmNsYXNzTGlzdC5yZW1vdmUgJ2ZvY3VzJ1xuXG4gICAgZm9jdXNCcm93c2VyOiAtPiBAYnJvd3Nlci5mb2N1cygpXG4gICAgXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBvbk1vdXNlT3ZlcjogKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/Lm9uTW91c2VPdmVyKClcbiAgICBvbk1vdXNlT3V0OiAgKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/Lm9uTW91c2VPdXQoKVxuICAgIFxuICAgIG9uRGJsQ2xpY2s6ICAoZXZlbnQpID0+IFxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuc2tpcE9uRGJsQ2xpY2sgPSB0cnVlXG4gICAgICAgIEBuYXZpZ2F0ZUNvbHMgJ2VudGVyJ1xuICAgIFxuICAgIHVwZGF0ZUNydW1iOiA9PiBAY3J1bWIudXBkYXRlUmVjdCBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgIFxuICAgIGV4dGVuZFNlbGVjdGlvbjogKGtleSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBlcnJvciBcIm5vIHJvd3MgaW4gY29sdW1uICN7QGluZGV4fT9cIiBpZiBub3QgQG51bVJvd3MoKSAgICAgICAgXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gLTFcbiAgICAgICAgZXJyb3IgXCJubyBpbmRleCBmcm9tIGFjdGl2ZVJvdz8gI3tpbmRleH0/XCIsIEBhY3RpdmVSb3coKSBpZiBub3QgaW5kZXg/IG9yIE51bWJlci5pc05hTiBpbmRleFxuICAgICAgICAgICAgXG4gICAgICAgIHRvSW5kZXggPSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICd1cCcgICAgICAgIHRoZW4gaW5kZXgtMVxuICAgICAgICAgICAgd2hlbiAnZG93bicgICAgICB0aGVuIGluZGV4KzFcbiAgICAgICAgICAgIHdoZW4gJ2hvbWUnICAgICAgdGhlbiAwXG4gICAgICAgICAgICB3aGVuICdlbmQnICAgICAgIHRoZW4gQG51bVJvd3MoKS0xXG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAgIHRoZW4gTWF0aC5tYXggMCwgaW5kZXgtQG51bVZpc2libGUoKVxuICAgICAgICAgICAgd2hlbiAncGFnZSBkb3duJyB0aGVuIE1hdGgubWluIEBudW1Sb3dzKCktMSwgaW5kZXgrQG51bVZpc2libGUoKVxuICAgICAgICAgICAgZWxzZSBpbmRleFxuICAgIFxuICAgICAgICBAYnJvd3Nlci5zZWxlY3QudG8gQHJvdyh0b0luZGV4KSwgdHJ1ZVxuICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcblxuICAgIG5hdmlnYXRlUm93czogKGtleSkgLT5cblxuICAgICAgICByZXR1cm4gZXJyb3IgXCJubyByb3dzIGluIGNvbHVtbiAje0BpbmRleH0/XCIgaWYgbm90IEBudW1Sb3dzKClcbiAgICAgICAgaW5kZXggPSBAYWN0aXZlUm93KCk/LmluZGV4KCkgPyAtMVxuICAgICAgICBlcnJvciBcIm5vIGluZGV4IGZyb20gYWN0aXZlUm93PyAje2luZGV4fT9cIiwgQGFjdGl2ZVJvdygpIGlmIG5vdCBpbmRleD8gb3IgTnVtYmVyLmlzTmFOIGluZGV4XG4gICAgICAgIFxuICAgICAgICBuZXdJbmRleCA9IHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgICAgICAgdGhlbiBpbmRleC0xXG4gICAgICAgICAgICB3aGVuICdkb3duJyAgICAgIHRoZW4gaW5kZXgrMVxuICAgICAgICAgICAgd2hlbiAnaG9tZScgICAgICB0aGVuIDBcbiAgICAgICAgICAgIHdoZW4gJ2VuZCcgICAgICAgdGhlbiBAbnVtUm93cygpLTFcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICAgdGhlbiBpbmRleC1AbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gaW5kZXgrQG51bVZpc2libGUoKVxuICAgICAgICAgICAgZWxzZSBpbmRleFxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG5vdCBuZXdJbmRleD8gb3IgTnVtYmVyLmlzTmFOIG5ld0luZGV4ICAgICAgICBcbiAgICAgICAgICAgIGVycm9yIFwibm8gaW5kZXggI3tuZXdJbmRleH0/ICN7QG51bVZpc2libGUoKX1cIlxuICAgICAgICAgICAgXG4gICAgICAgIG5ld0luZGV4ID0gY2xhbXAgMCwgQG51bVJvd3MoKS0xLCBuZXdJbmRleFxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5ld0luZGV4ID09IGluZGV4XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQHJvd3NbbmV3SW5kZXhdPy5hY3RpdmF0ZT9cbiAgICAgICAgICAgIGVycm9yIFwibm8gcm93IGF0IGluZGV4ICN7bmV3SW5kZXh9LyN7QG51bVJvd3MoKS0xfT9cIiwgQG51bVJvd3MoKSBcbiAgICAgICAgICAgIFxuICAgICAgICAjIEByb3dzW25ld0luZGV4XS5hY3RpdmF0ZSgpXG4gICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgQHJvd3NbbmV3SW5kZXhdXG4gICAgXG4gICAgbmF2aWdhdGVDb2xzOiAoa2V5KSAtPiAjIG1vdmUgdG8gZmlsZSBicm93c2VyP1xuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAndXAnICAgIHRoZW4gQGJyb3dzZXIubmF2aWdhdGUgJ3VwJ1xuICAgICAgICAgICAgd2hlbiAnbGVmdCcgIHRoZW4gQGJyb3dzZXIubmF2aWdhdGUgJ2xlZnQnXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgdGhlbiBAYnJvd3Nlci5uYXZpZ2F0ZSAncmlnaHQnXG4gICAgICAgICAgICB3aGVuICdlbnRlcidcbiAgICAgICAgICAgICAgICBpZiBpdGVtID0gQGFjdGl2ZVJvdygpPy5pdGVtXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSBpdGVtLnR5cGVcbiAgICAgICAgICAgICAgICAgICAgaWYgdHlwZSA9PSAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIubG9hZEl0ZW0gaXRlbVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG8nIGl0ZW1cbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnZm9jdXMnICdlZGl0b3InXG4gICAgICAgICAgICAgICAgICAgICAgICAjIHBvc3QuZW1pdCAnb3BlbkZpbGUnIGl0ZW0uZmlsZVxuICAgICAgICBAXG5cbiAgICBuYXZpZ2F0ZVJvb3Q6IChrZXkpIC0+IFxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuYnJvd3NlIHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2xlZnQnICB0aGVuIHNsYXNoLmRpciBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuIEBhY3RpdmVSb3coKS5pdGVtLmZpbGVcbiAgICAgICAgQFxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwMDAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICBcbiAgICBcbiAgICBkb1NlYXJjaDogKGNoYXIpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBudW1Sb3dzKClcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAc2VhcmNoRGl2XG4gICAgICAgICAgICBAc2VhcmNoRGl2ID0gZWxlbSBjbGFzczogJ2Jyb3dzZXJTZWFyY2gnXG4gICAgICAgICAgICBcbiAgICAgICAgQHNldFNlYXJjaCBAc2VhcmNoICsgY2hhclxuICAgICAgICBcbiAgICBiYWNrc3BhY2VTZWFyY2g6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAc2VhcmNoRGl2IGFuZCBAc2VhcmNoLmxlbmd0aFxuICAgICAgICAgICAgQHNldFNlYXJjaCBAc2VhcmNoWzAuLi5Ac2VhcmNoLmxlbmd0aC0xXVxuICAgICAgICAgICAgXG4gICAgc2V0U2VhcmNoOiAoQHNlYXJjaCkgLT5cbiAgICAgICAgICAgIFxuICAgICAgICBjbGVhclRpbWVvdXQgQHNlYXJjaFRpbWVyXG4gICAgICAgIEBzZWFyY2hUaW1lciA9IHNldFRpbWVvdXQgQGNsZWFyU2VhcmNoLCAyMDAwXG4gICAgICAgIFxuICAgICAgICBAc2VhcmNoRGl2LnRleHRDb250ZW50ID0gQHNlYXJjaFxuXG4gICAgICAgIGFjdGl2ZUluZGV4ICA9IEBhY3RpdmVSb3coKT8uaW5kZXgoKSA/IDBcbiAgICAgICAgYWN0aXZlSW5kZXggKz0gMSBpZiAoQHNlYXJjaC5sZW5ndGggPT0gMSkgI29yIChjaGFyID09ICcnKVxuICAgICAgICBhY3RpdmVJbmRleCAgPSAwIGlmIGFjdGl2ZUluZGV4ID49IEBudW1Sb3dzKClcbiAgICAgICAgXG4gICAgICAgIGZvciByb3dzIGluIFtAcm93cy5zbGljZShhY3RpdmVJbmRleCksIEByb3dzLnNsaWNlKDAsYWN0aXZlSW5kZXgrMSldXG4gICAgICAgICAgICBmdXp6aWVkID0gZnV6enkuZmlsdGVyIEBzZWFyY2gsIHJvd3MsIGV4dHJhY3Q6IChyKSAtPiByLml0ZW0ubmFtZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBmdXp6aWVkLmxlbmd0aFxuICAgICAgICAgICAgICAgIHJvdyA9IGZ1enppZWRbMF0ub3JpZ2luYWxcbiAgICAgICAgICAgICAgICByb3cuZGl2LmFwcGVuZENoaWxkIEBzZWFyY2hEaXZcbiAgICAgICAgICAgICAgICByb3cuYWN0aXZhdGUoKVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIEBcbiAgICBcbiAgICBjbGVhclNlYXJjaDogPT5cbiAgICAgICAgXG4gICAgICAgIEBzZWFyY2ggPSAnJ1xuICAgICAgICBAc2VhcmNoRGl2Py5yZW1vdmUoKVxuICAgICAgICBkZWxldGUgQHNlYXJjaERpdlxuICAgICAgICBAXG4gICAgXG4gICAgcmVtb3ZlT2JqZWN0OiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgcm93ID0gQGFjdGl2ZVJvdygpXG4gICAgICAgICAgICBuZXh0T3JQcmV2ID0gcm93Lm5leHQoKSA/IHJvdy5wcmV2KClcbiAgICAgICAgICAgIEByZW1vdmVSb3cgcm93XG4gICAgICAgICAgICBuZXh0T3JQcmV2Py5hY3RpdmF0ZSgpXG4gICAgICAgIEBcblxuICAgIHJlbW92ZVJvdzogKHJvdykgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHJvdyA9PSBAYWN0aXZlUm93KClcbiAgICAgICAgICAgIGlmIEBuZXh0Q29sdW1uKCk/LnBhcmVudD8uZmlsZSA9PSByb3cuaXRlbT8uZmlsZVxuICAgICAgICAgICAgICAgICMga2xvZyAncmVtb3ZlUm93IGNsZWFyJ1xuICAgICAgICAgICAgICAgIEBicm93c2VyLmNsZWFyQ29sdW1uc0Zyb20gQGluZGV4ICsgMVxuICAgICAgICAgICAgXG4gICAgICAgIHJvdy5kaXYucmVtb3ZlKClcbiAgICAgICAgQGl0ZW1zLnNwbGljZSByb3cuaW5kZXgoKSwgMVxuICAgICAgICBAcm93cy5zcGxpY2Ugcm93LmluZGV4KCksIDFcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgc29ydEJ5TmFtZTogPT5cbiAgICAgICAgIFxuICAgICAgICBAcm93cy5zb3J0IChhLGIpIC0+IFxuICAgICAgICAgICAgKGEuaXRlbS50eXBlICsgYS5pdGVtLm5hbWUpLmxvY2FsZUNvbXBhcmUoYi5pdGVtLnR5cGUgKyBiLml0ZW0ubmFtZSlcbiAgICAgICAgICAgIFxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgZm9yIHJvdyBpbiBAcm93c1xuICAgICAgICAgICAgQHRhYmxlLmFwcGVuZENoaWxkIHJvdy5kaXZcbiAgICAgICAgQFxuICAgICAgICBcbiAgICBzb3J0QnlUeXBlOiA9PlxuICAgICAgICBcbiAgICAgICAgQHJvd3Muc29ydCAoYSxiKSAtPiBcbiAgICAgICAgICAgIGF0eXBlID0gYS5pdGVtLnR5cGUgPT0gJ2ZpbGUnIGFuZCBzbGFzaC5leHQoYS5pdGVtLm5hbWUpIG9yICdfX18nICNhLml0ZW0udHlwZVxuICAgICAgICAgICAgYnR5cGUgPSBiLml0ZW0udHlwZSA9PSAnZmlsZScgYW5kIHNsYXNoLmV4dChiLml0ZW0ubmFtZSkgb3IgJ19fXycgI2IuaXRlbS50eXBlXG4gICAgICAgICAgICAoYS5pdGVtLnR5cGUgKyBhdHlwZSArIGEuaXRlbS5uYW1lKS5sb2NhbGVDb21wYXJlKGIuaXRlbS50eXBlICsgYnR5cGUgKyBiLml0ZW0ubmFtZSwgdW5kZWZpbmVkLCBudW1lcmljOnRydWUpXG4gICAgICAgICAgICBcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3NcbiAgICAgICAgICAgIEB0YWJsZS5hcHBlbmRDaGlsZCByb3cuZGl2XG4gICAgICAgIEBcblxuICAgIHNvcnRCeURhdGVBZGRlZDogPT5cbiAgICAgICAgXG4gICAgICAgIEByb3dzLnNvcnQgKGEsYikgLT4gYi5pdGVtLnN0YXQ/LmF0aW1lTXMgLSBhLml0ZW0uc3RhdD8uYXRpbWVNc1xuICAgICAgICAgICAgXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBmb3Igcm93IGluIEByb3dzXG4gICAgICAgICAgICBAdGFibGUuYXBwZW5kQ2hpbGQgcm93LmRpdlxuICAgICAgICBAXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAgICAwMDAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICB0b2dnbGVEb3RGaWxlczogPT5cblxuICAgICAgICBpZiBAcGFyZW50LnR5cGUgPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICBAcGFyZW50LnR5cGUgPSBzbGFzaC5pc0RpcihAcGFyZW50LmZpbGUpIGFuZCAnZGlyJyBvciAnZmlsZSdcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAcGFyZW50LnR5cGUgPT0gJ2RpcicgICAgICAgICAgICBcbiAgICAgICAgICAgIHN0YXRlS2V5ID0gXCJicm93c2VyfHNob3dIaWRkZW58I3tAcGFyZW50LmZpbGV9XCJcbiAgICAgICAgICAgIGlmIHdpbmRvdy5zdGF0ZS5nZXQgc3RhdGVLZXlcbiAgICAgICAgICAgICAgICB3aW5kb3cuc3RhdGUuZGVsIHN0YXRlS2V5XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcHJlZnMuc2V0IHN0YXRlS2V5LCB0cnVlXG4gICAgICAgICAgICBAYnJvd3Nlci5sb2FkRGlySXRlbSBAcGFyZW50LCBAaW5kZXgsIGlnbm9yZUNhY2hlOnRydWVcbiAgICAgICAgQFxuICAgICAgICAgXG4gICAgdG9nZ2xlRXh0ZW5zaW9uczogPT5cblxuICAgICAgICBzdGF0ZUtleSA9IFwiYnJvd3NlcnxoaWRlRXh0ZW5zaW9uc1wiXG4gICAgICAgIHdpbmRvdy5zdGF0ZS5zZXQgc3RhdGVLZXksIG5vdCB3aW5kb3cuc3RhdGUuZ2V0IHN0YXRlS2V5LCBmYWxzZVxuICAgICAgICBzZXRTdHlsZSAnLmJyb3dzZXJSb3cgLmV4dCcgJ2Rpc3BsYXknIHdpbmRvdy5zdGF0ZS5nZXQoc3RhdGVLZXkpIGFuZCAnbm9uZScgb3IgJ2luaXRpYWwnXG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG1vdmVUb1RyYXNoOiA9PlxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBAYnJvd3Nlci5zZWxlY3QuZnJlZUluZGV4KClcbiAgICAgICAgaWYgaW5kZXggPj0gMFxuICAgICAgICAgICAgc2VsZWN0Um93ID0gQHJvdyBpbmRleFxuICAgICAgICBcbiAgICAgICAgZm9yIHJvdyBpbiBAYnJvd3Nlci5zZWxlY3Qucm93c1xuICAgICAgICAgICAgd3h3ICd0cmFzaCcgcm93LnBhdGgoKVxuICAgICAgICAgICAgQHJlbW92ZVJvdyByb3dcbiAgICAgICAgICAgXG4gICAgICAgIGlmIHNlbGVjdFJvd1xuICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyBzZWxlY3RSb3dcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG5hdmlnYXRlQ29scyAnbGVmdCdcblxuICAgIGFkZFRvU2hlbGY6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBwYXRoVG9TaGVsZiA9IEBhY3RpdmVQYXRoKClcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnYWRkVG9TaGVsZicgcGF0aFRvU2hlbGZcblxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgIDAwMCAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgICAgIDAgICAgICAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG9wZW5WaWV3ZXI6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAYWN0aXZlUm93KCk/Lml0ZW0ubmFtZSAhPSAnLi4nIFxuICAgICAgICAgICAgcGF0aCA9IEBhY3RpdmVQYXRoKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcGF0aCA9IEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIHBhdGhcbiAgICAgICAgICAgIGlmIEZpbGUuaXNUZXh0IHBhdGhcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHNsYXNoLmlzRmlsZSBwYXRoXG4gICAgICAgICAgICAgICAgaWYgbm90IEZpbGUuaXNJbWFnZSBwYXRoXG4gICAgICAgICAgICAgICAgICAgIHBhdGggPSBAcGF0aCgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBicm93c2VyLnZpZXdlciA9IG5ldyBWaWV3ZXIgQGJyb3dzZXIsIHBhdGhcbiAgICAgICAgXG4gICAgbmV3Rm9sZGVyOiA9PlxuICAgICAgICBcbiAgICAgICAgc2xhc2gudW51c2VkIHNsYXNoLmpvaW4oQHBhdGgoKSwgJ05ldyBmb2xkZXInKSwgKG5ld0RpcikgPT5cbiAgICAgICAgICAgIGZzLm1rZGlyIG5ld0RpciwgKGVycikgPT5cbiAgICAgICAgICAgICAgICBpZiBlbXB0eSBlcnJcbiAgICAgICAgICAgICAgICAgICAgcm93ID0gQGluc2VydEZpbGUgbmV3RGlyXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgcm93XG4gICAgICAgICAgICAgICAgICAgIHJvdy5lZGl0TmFtZSgpXG4gICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGR1cGxpY2F0ZUZpbGU6ID0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGZvciBmaWxlIGluIEBicm93c2VyLnNlbGVjdC5maWxlcygpXG4gICAgICAgICAgICBGaWxlLmR1cGxpY2F0ZSBmaWxlLCAoc291cmNlLCB0YXJnZXQpID0+XG4gICAgICAgICAgICAgICAgaWYgQHBhcmVudC50eXBlID09ICdmaWxlJ1xuICAgICAgICAgICAgICAgICAgICBjb2wgPSBAcHJldkNvbHVtbigpXG4gICAgICAgICAgICAgICAgICAgIGNvbC5mb2N1cygpXG4gICAgICAgICAgICAgICAgZWxzZSBjb2wgPSBAXG4gICAgICAgICAgICAgICAgcm93ID0gY29sLmluc2VydEZpbGUgdGFyZ2V0XG4gICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyByb3dcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGV4cGxvcmVyOiA9PlxuICAgICAgICBcbiAgICAgICAgb3BlbiBzbGFzaC5kaXIgQGFjdGl2ZVBhdGgoKVxuICAgICAgICBcbiAgICBvcGVuOiA9PlxuXG4gICAgICAgIG9wZW4gQGFjdGl2ZVBhdGgoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICB1cGRhdGVHaXRGaWxlczogKGZpbGVzKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIHJvdyBpbiBAcm93c1xuICAgICAgICAgICAgcmV0dXJuIGlmIHJvdy5pdGVtLnR5cGUgbm90IGluIFsnZGlyJyAnZmlsZSddXG4gICAgICAgICAgICBzdGF0dXMgPSBmaWxlc1tyb3cuaXRlbS5maWxlXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAkKCcuYnJvd3NlclN0YXR1c0ljb24nIHJvdy5kaXYpPy5yZW1vdmUoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBzdGF0dXM/XG4gICAgICAgICAgICAgICAgcm93LmRpdi5hcHBlbmRDaGlsZCBlbGVtICdzcGFuJyBjbGFzczpcImdpdC0je3N0YXR1c30taWNvbiBicm93c2VyU3RhdHVzSWNvblwiXG4gICAgICAgICAgICBlbHNlIGlmIHJvdy5pdGVtLnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICBmb3IgZmlsZSwgc3RhdHVzIG9mIGZpbGVzXG4gICAgICAgICAgICAgICAgICAgIGlmIHJvdy5pdGVtLm5hbWUgIT0gJy4uJyBhbmQgZmlsZS5zdGFydHNXaXRoIHJvdy5pdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvdy5kaXYuYXBwZW5kQ2hpbGQgZWxlbSAnc3BhbicgY2xhc3M6XCJnaXQtZGlycy1pY29uIGJyb3dzZXJTdGF0dXNJY29uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICBcbiAgICAgICAgXG4gICAgbWFrZVJvb3Q6ID0+IFxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuc2hpZnRDb2x1bW5zVG8gQGluZGV4XG4gICAgICAgIFxuICAgICAgICBpZiBAYnJvd3Nlci5jb2x1bW5zWzBdLml0ZW1zWzBdLm5hbWUgIT0gJy4uJ1xuICAgICAgICAgICAgQHVuc2hpZnRJdGVtIFxuICAgICAgICAgICAgICAgIG5hbWU6ICcuLidcbiAgICAgICAgICAgICAgICB0eXBlOiAnZGlyJ1xuICAgICAgICAgICAgICAgIGZpbGU6IHNsYXNoLmRpciBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQGNydW1iLnNldEZpbGUgQHBhcmVudC5maWxlXG4gICAgXG4gICAgb25Db250ZXh0TWVudTogKGV2ZW50LCBjb2x1bW4pID0+IFxuICAgICAgICBcbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgIFxuICAgICAgICBhYnNQb3MgPSBrcG9zIGV2ZW50XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgY29sdW1uXG4gICAgICAgICAgICBAc2hvd0NvbnRleHRNZW51IGFic1Bvc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG9wdCA9IGl0ZW1zOiBbIFxuICAgICAgICAgICAgICAgIHRleHQ6ICAgJ1Jvb3QnXG4gICAgICAgICAgICAgICAgY2I6ICAgICBAbWFrZVJvb3RcbiAgICAgICAgICAgICxcbiAgICAgICAgICAgICAgICB0ZXh0OiAgICdBZGQgdG8gU2hlbGYnXG4gICAgICAgICAgICAgICAgY29tYm86ICAnYWx0K3NoaWZ0Ky4nXG4gICAgICAgICAgICAgICAgY2I6ICAgICA9PiBwb3N0LmVtaXQgJ2FkZFRvU2hlbGYnIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgLFxuICAgICAgICAgICAgICAgIHRleHQ6ICAgJ0V4cGxvcmVyJ1xuICAgICAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtlJyBcbiAgICAgICAgICAgICAgICBjYjogICAgID0+IG9wZW4gQHBhcmVudC5maWxlXG4gICAgICAgICAgICBdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgICAgIHBvcHVwLm1lbnUgb3B0ICAgIFxuICAgICAgICAgICAgICBcbiAgICBzaG93Q29udGV4dE1lbnU6IChhYnNQb3MpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgYWJzUG9zP1xuICAgICAgICAgICAgYWJzUG9zID0ga3BvcyBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQsIEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG4gICAgICAgIFxuICAgICAgICBvcHQgPSBpdGVtczogWyBcbiAgICAgICAgICAgIHRleHQ6ICAgJ1RvZ2dsZSBJbnZpc2libGUnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK2knIFxuICAgICAgICAgICAgY2I6ICAgICBAdG9nZ2xlRG90RmlsZXNcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnVG9nZ2xlIEV4dGVuc2lvbnMnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK2UnIFxuICAgICAgICAgICAgY2I6ICAgICBAdG9nZ2xlRXh0ZW5zaW9uc1xuICAgICAgICAsICAgICAgICAgICAgXG4gICAgICAgICAgICAjIHRleHQ6ICAgJ09wZW4nXG4gICAgICAgICAgICAjIGNvbWJvOiAgJ3JldHVybiBhbHQrbydcbiAgICAgICAgICAgICMgY2I6ICAgICBAb3BlblxuICAgICAgICAjICxcbiAgICAgICAgICAgICMgdGV4dDogICAnVmlld2VyJ1xuICAgICAgICAgICAgIyBjb21ibzogICdzcGFjZSBhbHQrdicgXG4gICAgICAgICAgICAjIGNiOiAgICAgQG9wZW5WaWV3ZXJcbiAgICAgICAgIyAsXG4gICAgICAgICAgICB0ZXh0OiAgICcnXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ0V4cGxvcmVyJ1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K2UnIFxuICAgICAgICAgICAgY2I6ICAgICBAZXhwbG9yZXJcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnJ1xuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdBZGQgdG8gU2hlbGYnXG4gICAgICAgICAgICBjb21ibzogICdhbHQrc2hpZnQrLidcbiAgICAgICAgICAgIGNiOiAgICAgQGFkZFRvU2hlbGZcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnJ1xuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdNb3ZlIHRvIFRyYXNoJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtiYWNrc3BhY2UnIFxuICAgICAgICAgICAgY2I6ICAgICBAbW92ZVRvVHJhc2hcbiAgICAgICAgLCAgIFxuICAgICAgICAgICAgdGV4dDogICAnJ1xuICAgICAgICAgICAgaGlkZTogICBAcGFyZW50LnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ0R1cGxpY2F0ZSdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrZCcgXG4gICAgICAgICAgICBjYjogICAgIEBkdXBsaWNhdGVGaWxlXG4gICAgICAgICAgICBoaWRlOiAgIEBwYXJlbnQudHlwZSA9PSAnZmlsZSdcbiAgICAgICAgLCAgIFxuICAgICAgICAgICAgdGV4dDogICAnTmV3IEZvbGRlcidcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtuJyBcbiAgICAgICAgICAgIGNiOiAgICAgQG5ld0ZvbGRlclxuICAgICAgICAgICAgaGlkZTogICBAcGFyZW50LnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSAhPSAnZmlsZSdcbiAgICAgICAgICAgIG9wdC5pdGVtcyA9IG9wdC5pdGVtcy5jb25jYXQgW1xuICAgICAgICAgICAgICAgIHRleHQ6ICAgJydcbiAgICAgICAgICAgICwgICBcbiAgICAgICAgICAgICAgICB0ZXh0OiAgICdTb3J0J1xuICAgICAgICAgICAgICAgIG1lbnU6IFtcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0J5IE5hbWUnIGNvbWJvOidjdHJsK24nLCBjYjpAc29ydEJ5TmFtZVxuICAgICAgICAgICAgICAgICxcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0J5IFR5cGUnIGNvbWJvOidjdHJsK3QnLCBjYjpAc29ydEJ5VHlwZVxuICAgICAgICAgICAgICAgICxcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0J5IERhdGUnIGNvbWJvOidjdHJsK2EnLCBjYjpAc29ydEJ5RGF0ZUFkZGVkXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgXVxuICAgICAgICBcbiAgICAgICAgICAgICMgb3B0Lml0ZW1zID0gb3B0Lml0ZW1zLmNvbmNhdCB3aW5kb3cudGl0bGViYXIubWFrZVRlbXBsYXRlIHJlcXVpcmUgJy4uL21lbnUuanNvbidcbiAgICAgICAgXG4gICAgICAgICMga2xvZyAnc2hvd0NvbnRleHRNZW51JyBvcHRcbiAgICAgICAgICAgIFxuICAgICAgICBvcHQueCA9IGFic1Bvcy54XG4gICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgcG9wdXAubWVudSBvcHQgICAgICAgIFxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAgMDAwICAgICBcbiAgICBcbiAgICBjb3B5UGF0aHM6IC0+XG4gICAgICAgIFxuICAgICAgICBwYXRocyA9IEBicm93c2VyLnNlbGVjdC5maWxlcygpLmpvaW4gJ1xcbidcbiAgICAgICAgZWxlY3Ryb24uY2xpcGJvYXJkLndyaXRlVGV4dCBwYXRoc1xuICAgICAgICBwYXRoc1xuICAgICAgICBcbiAgICBjdXRQYXRoczogLT5cbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLmN1dFBhdGhzID0gQGNvcHlQYXRocygpXG4gICAgICAgIFxuICAgIHBhc3RlUGF0aHM6IC0+XG4gICAgICAgIFxuICAgICAgICB0ZXh0ID0gZWxlY3Ryb24uY2xpcGJvYXJkLnJlYWRUZXh0KClcbiAgICAgICAgcGF0aHMgPSB0ZXh0LnNwbGl0ICdcXG4nXG4gICAgICAgIGlmIHRleHQgPT0gQGJyb3dzZXIuY3V0UGF0aHNcbiAgICAgICAgICAgIGFjdGlvbiA9ICdtb3ZlJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBhY3Rpb24gPSAnY29weSdcbiAgICAgICAgdGFyZ2V0ID0gQHBhcmVudC5maWxlXG4gICAgICAgIGlmIEBhY3RpdmVSb3coKT8uaXRlbS50eXBlID09ICdkaXInXG4gICAgICAgICAgICB0YXJnZXQgPSBAYWN0aXZlUm93KCkuaXRlbS5maWxlXG4gICAgICAgIEBicm93c2VyLmRyb3BBY3Rpb24gYWN0aW9uLCBwYXRocywgdGFyZ2V0XG4gICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgb25LZXk6IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIHsgbW9kLCBrZXksIGNvbWJvLCBjaGFyIH0gPSBrZXlpbmZvLmZvckV2ZW50IGV2ZW50XG5cbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdzaGlmdCtgJyAnficgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYnJvd3Nlci5icm93c2UgJ34nXG4gICAgICAgICAgICB3aGVuICcvJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYnJvd3Nlci5icm93c2UgJy8nXG4gICAgICAgICAgICB3aGVuICdhbHQrc2hpZnQrLicgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYWRkVG9TaGVsZigpXG4gICAgICAgICAgICB3aGVuICdhbHQrZScgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQGV4cGxvcmVyKClcbiAgICAgICAgICAgIHdoZW4gJ2FsdCtvJyAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAb3BlbigpXG4gICAgICAgICAgICB3aGVuICdhbHQrbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQG5ld0ZvbGRlcigpXG4gICAgICAgICAgICB3aGVuICdzcGFjZScgJ2FsdCt2JyAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQG9wZW5WaWV3ZXIoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCt4JyAnY29tbWFuZCt4JyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBjdXRQYXRocygpXG4gICAgICAgICAgICB3aGVuICdjdHJsK2MnICdjb21tYW5kK2MnICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQGNvcHlQYXRocygpXG4gICAgICAgICAgICB3aGVuICdjdHJsK3YnICdjb21tYW5kK3YnICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQHBhc3RlUGF0aHMoKVxuICAgICAgICAgICAgd2hlbiAnc2hpZnQrdXAnICdzaGlmdCtkb3duJyAnc2hpZnQraG9tZScgJ3NoaWZ0K2VuZCcgJ3NoaWZ0K3BhZ2UgdXAnICdzaGlmdCtwYWdlIGRvd24nIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGV4dGVuZFNlbGVjdGlvbiBrZXlcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICdwYWdlIGRvd24nICdob21lJyAnZW5kJyB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvd3Mga2V5XG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK3VwJyAnY3RybCt1cCcgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb3dzICdob21lJ1xuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtkb3duJyAnY3RybCtkb3duJyAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyAnZW5kJ1xuICAgICAgICAgICAgd2hlbiAnZW50ZXInJ2FsdCt1cCcgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlQ29scyBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2JhY2tzcGFjZScgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBicm93c2VyLm9uQmFja3NwYWNlSW5Db2x1bW4gQFxuICAgICAgICAgICAgd2hlbiAnZGVsZXRlJyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGJyb3dzZXIub25EZWxldGVJbkNvbHVtbiBAXG4gICAgICAgICAgICB3aGVuICdjdHJsK3QnICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAc29ydEJ5VHlwZSgpXG4gICAgICAgICAgICB3aGVuICdjdHJsK24nICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAc29ydEJ5TmFtZSgpXG4gICAgICAgICAgICB3aGVuICdjdHJsK2EnICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAc29ydEJ5RGF0ZUFkZGVkKClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQraScgJ2N0cmwraScgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEB0b2dnbGVEb3RGaWxlcygpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2QnICdjdHJsK2QnICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAZHVwbGljYXRlRmlsZSgpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2snICdjdHJsK2snICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50IGlmIEBicm93c2VyLmNsZWFuVXAoKVxuICAgICAgICAgICAgd2hlbiAnZjInICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGFjdGl2ZVJvdygpPy5lZGl0TmFtZSgpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2xlZnQnICdjb21tYW5kK3JpZ2h0JyAnY3RybCtsZWZ0JyAnY3RybCtyaWdodCdcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb290IGtleVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtiYWNrc3BhY2UnICdjdHJsK2JhY2tzcGFjZScgJ2NvbW1hbmQrZGVsZXRlJyAnY3RybCtkZWxldGUnIFxuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBtb3ZlVG9UcmFzaCgpXG4gICAgICAgICAgICB3aGVuICd0YWInICAgIFxuICAgICAgICAgICAgICAgIGlmIEBzZWFyY2gubGVuZ3RoIHRoZW4gQGRvU2VhcmNoICcnXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudFxuICAgICAgICAgICAgd2hlbiAnZXNjJ1xuICAgICAgICAgICAgICAgIGlmIEBkcmFnRGl2XG4gICAgICAgICAgICAgICAgICAgIEBkcmFnRGl2LmRyYWcuZHJhZ1N0b3AoKVxuICAgICAgICAgICAgICAgICAgICBAZHJhZ0Rpdi5yZW1vdmUoKVxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgQGRyYWdEaXZcbiAgICAgICAgICAgICAgICBlbHNlIGlmIEBicm93c2VyLnNlbGVjdC5maWxlcygpLmxlbmd0aCA+IDFcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyBAYWN0aXZlUm93KClcbiAgICAgICAgICAgICAgICBlbHNlIGlmIEBzZWFyY2gubGVuZ3RoIHRoZW4gQGNsZWFyU2VhcmNoKClcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG5cbiAgICAgICAgaWYgY29tYm8gaW4gWyd1cCcgICAnZG93biddICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvd3Mga2V5ICAgICAgICAgICAgICBcbiAgICAgICAgaWYgY29tYm8gaW4gWydsZWZ0JyAncmlnaHQnXSB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZUNvbHMga2V5XG4gICAgICAgICAgICBcbiAgICAgICAgaWYgbW9kIGluIFsnc2hpZnQnICcnXSBhbmQgY2hhciB0aGVuIEBkb1NlYXJjaCBjaGFyXG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgQHVwZGF0ZURyYWdJbmRpY2F0b3IgZXZlbnRcbiAgICAgICAgICAgIFxuICAgIG9uS2V5VXA6IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBkcmFnRGl2XG4gICAgICAgICAgICBAdXBkYXRlRHJhZ0luZGljYXRvciBldmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IENvbHVtblxuXG5cbiJdfQ==
//# sourceURL=../../coffee/browser/column.coffee