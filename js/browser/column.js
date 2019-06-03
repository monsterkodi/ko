// koffee 0.56.0

/*
 0000000   0000000   000      000   000  00     00  000   000
000       000   000  000      000   000  000   000  0000  000
000       000   000  000      000   000  000000000  000 0 000
000       000   000  000      000   000  000 0 000  000  0000
 0000000   0000000   0000000   0000000   000   000  000   000
 */
var $, Column, Row, Scroller, _, clamp, elem, empty, fs, fuzzy, kerror, keyinfo, kpos, open, popup, post, ref, setStyle, slash, state, stopEvent, trash, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, stopEvent = ref.stopEvent, setStyle = ref.setStyle, keyinfo = ref.keyinfo, popup = ref.popup, slash = ref.slash, valid = ref.valid, clamp = ref.clamp, empty = ref.empty, state = ref.state, open = ref.open, elem = ref.elem, kpos = ref.kpos, fs = ref.fs, kerror = ref.kerror, $ = ref.$, _ = ref._;

Row = require('./row');

Scroller = require('./scroller');

fuzzy = require('fuzzy');

trash = require('trash');

Column = (function() {
    function Column(browser) {
        var ref1, ref2;
        this.browser = browser;
        this.onKey = bind(this.onKey, this);
        this.showContextMenu = bind(this.showContextMenu, this);
        this.onContextMenu = bind(this.onContextMenu, this);
        this.open = bind(this.open, this);
        this.explorer = bind(this.explorer, this);
        this.duplicateFile = bind(this.duplicateFile, this);
        this.addToShelf = bind(this.addToShelf, this);
        this.moveToTrash = bind(this.moveToTrash, this);
        this.toggleExtensions = bind(this.toggleExtensions, this);
        this.toggleDotFiles = bind(this.toggleDotFiles, this);
        this.removeObject = bind(this.removeObject, this);
        this.clearSearch = bind(this.clearSearch, this);
        this.onDblClick = bind(this.onDblClick, this);
        this.onClick = bind(this.onClick, this);
        this.onMouseOut = bind(this.onMouseOut, this);
        this.onMouseOver = bind(this.onMouseOver, this);
        this.onBlur = bind(this.onBlur, this);
        this.onFocus = bind(this.onFocus, this);
        this.index = (ref1 = this.browser.columns) != null ? ref1.length : void 0;
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
        if ((ref2 = this.browser.cols) != null) {
            ref2.appendChild(this.div);
        }
        this.div.addEventListener('focus', this.onFocus);
        this.div.addEventListener('blur', this.onBlur);
        this.div.addEventListener('keydown', this.onKey);
        this.div.addEventListener('mouseover', this.onMouseOver);
        this.div.addEventListener('mouseout', this.onMouseOut);
        this.div.addEventListener('mouseup', this.onClick);
        this.div.addEventListener('dblclick', this.onDblClick);
        this.div.addEventListener("contextmenu", this.onContextMenu);
        this.scroll = new Scroller(this);
    }

    Column.prototype.loadItems = function(items, parent) {
        var i, item, len, ref1;
        this.browser.clearColumn(this.index);
        this.items = items;
        this.parent = parent;
        if (this.parent == null) {
            kerror("no parent item?");
        }
        if (valid(this.items)) {
            ref1 = this.items;
            for (i = 0, len = ref1.length; i < len; i++) {
                item = ref1[i];
                this.rows.push(new Row(this, item));
            }
            this.scroll.update();
        }
        return this;
    };

    Column.prototype.setItems = function(items1, opt) {
        var i, item, len, ref1;
        this.items = items1;
        this.browser.clearColumn(this.index);
        this.parent = opt.parent;
        if (this.parent == null) {
            kerror("no parent item?");
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
        return this.parent.type === 'dir';
    };

    Column.prototype.isFile = function() {
        return this.parent.type === 'file';
    };

    Column.prototype.isEmpty = function() {
        return empty(this.rows);
    };

    Column.prototype.clear = function() {
        var ref1;
        this.clearSearch();
        delete this.parent;
        this.div.scrollTop = 0;
        if ((ref1 = this.editor) != null) {
            ref1.del();
        }
        this.table.innerHTML = '';
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
        var ref1;
        return (ref1 = this.activeRow()) != null ? ref1.path() : void 0;
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
                return r.item.name === row;
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

    Column.prototype.onClick = function(event) {
        var ref1;
        return (ref1 = this.row(event.target)) != null ? ref1.activate(event) : void 0;
    };

    Column.prototype.onDblClick = function(event) {
        var item, ref1;
        this.navigateCols('enter');
        if (item = (ref1 = this.activeRow()) != null ? ref1.item : void 0) {
            if (item.file && item.type === 'file') {
                return post.emit('singleCursorAtPos', [0, 0]);
            }
        }
    };

    Column.prototype.navigateRows = function(key) {
        var index, ref1, ref2, ref3;
        if (!this.numRows()) {
            return console.error("no rows in column " + this.index + "?");
        }
        index = (ref1 = (ref2 = this.activeRow()) != null ? ref2.index() : void 0) != null ? ref1 : -1;
        if ((index == null) || Number.isNaN(index)) {
            console.error("no index from activeRow? " + index + "?", this.activeRow());
        }
        index = (function() {
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
        if ((index == null) || Number.isNaN(index)) {
            console.error("no index " + index + "? " + (this.numVisible()));
        }
        index = clamp(0, this.numRows() - 1, index);
        if (((ref3 = this.rows[index]) != null ? ref3.activate : void 0) == null) {
            console.error("no row at index " + index + "/" + (this.numRows() - 1) + "?", this.numRows());
        }
        return this.rows[index].activate();
    };

    Column.prototype.navigateCols = function(key) {
        var item, ref1, type;
        switch (key) {
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
                        post.emit('filebrowser', 'loadItem', item, {
                            focus: true
                        });
                    } else if (item.file) {
                        post.emit('jumpTo', item);
                        post.emit('focus', 'editor');
                    }
                }
        }
        return this;
    };

    Column.prototype.navigateRoot = function(key) {
        if (this.browser.browse == null) {
            return;
        }
        this.browser.browse((function() {
            switch (key) {
                case 'left':
                    return slash.dir(this.parent.file);
                case 'up':
                    return this.parent.file;
                case 'right':
                    return this.activeRow().item.file;
                case 'down':
                    return slash.pkg(this.parent.file);
                case '~':
                    return '~';
                case '/':
                    return '/';
            }
        }).call(this));
        return this;
    };

    Column.prototype.openFileInNewWindow = function() {
        var item, ref1;
        if (item = (ref1 = this.activeRow()) != null ? ref1.item : void 0) {
            if (item.type === 'file' && item.textFile && item.file) {
                post.emit('openFiles', [item.file], {
                    newWindow: true
                });
            }
        }
        return this;
    };

    Column.prototype.doSearch = function(char) {
        var activeIndex, fuzzied, i, len, ref1, ref2, ref3, row, rows;
        if (!this.numRows()) {
            return;
        }
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(this.clearSearch, 2000);
        this.search += char;
        if (!this.searchDiv) {
            this.searchDiv = elem({
                "class": 'browserSearch'
            });
        }
        this.searchDiv.textContent = this.search;
        activeIndex = (ref1 = (ref2 = this.activeRow()) != null ? ref2.index() : void 0) != null ? ref1 : 0;
        if ((this.search.length === 1) || (char === '')) {
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
            this.browser.emit('willRemoveRow', row, this);
            nextOrPrev = (ref1 = row.next()) != null ? ref1 : row.prev();
            this.removeRow(row);
            if (nextOrPrev != null) {
                nextOrPrev.activate();
            }
        }
        return this;
    };

    Column.prototype.removeRow = function(row) {
        row.div.remove();
        this.items.splice(row.index(), 1);
        return this.rows.splice(row.index(), 1);
    };

    Column.prototype.sortByName = function() {
        var i, len, ref1, row;
        this.rows.sort(function(a, b) {
            return a.item.name.localeCompare(b.item.name);
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
            atype = a.item.type === 'file' && slash.ext(a.item.name) || a.item.type;
            btype = b.item.type === 'file' && slash.ext(b.item.name) || b.item.type;
            return (atype + a.item.name).localeCompare(btype + b.item.name);
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
        if (this.parent.type === 'dir') {
            stateKey = "browser|showHidden|" + this.parent.file;
            if (window.state.get(stateKey)) {
                window.state.set(stateKey, false);
            } else {
                window.state.set(stateKey, true);
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
        var pathToTrash;
        pathToTrash = this.activePath();
        if (pathToTrash === window.tabs.activeTab().file) {
            window.tabs.closeTab(window.tabs.activeTab());
        }
        this.removeObject();
        return trash([pathToTrash])["catch"](function(err) {
            return console.error("failed to trash " + pathToTrash + " " + err);
        });
    };

    Column.prototype.addToShelf = function() {
        var pathToShelf;
        if (pathToShelf = this.activePath()) {
            post.emit('addToShelf', pathToShelf);
            return window.split.focus('shelf');
        }
    };

    Column.prototype.duplicateFile = function() {
        var unusedFilename;
        unusedFilename = require('unused-filename');
        return unusedFilename(this.activePath()).then((function(_this) {
            return function(fileName) {
                fileName = slash.path(fileName);
                if (fs.copy != null) {
                    return fs.copy(_this.activePath(), fileName, function(err) {
                        if (err != null) {
                            return console.error('copy file failed', err);
                        }
                        return post.emit('loadFile', fileName);
                    });
                }
            };
        })(this));
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

    Column.prototype.onContextMenu = function(event) {
        return stopEvent(event, this.showContextMenu(kpos(event)));
    };

    Column.prototype.showContextMenu = function(absPos) {
        var opt;
        if (absPos == null) {
            absPos = kpos(this.view.getBoundingClientRect().left, this.view.getBoundingClientRect().top);
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
                    text: 'Refresh',
                    combo: 'ctrl+r',
                    cb: this.browser.refresh
                }, {
                    text: 'Duplicate',
                    combo: 'ctrl+d',
                    cb: this.duplicateFile
                }, {
                    text: 'Move to Trash',
                    combo: 'ctrl+backspace',
                    cb: this.moveToTrash
                }, {
                    text: 'Add to Shelf',
                    combo: 'alt+shift+.',
                    cb: this.addToShelf
                }, {
                    text: 'Explorer',
                    combo: 'alt+e',
                    cb: this.explorer
                }, {
                    text: 'Open',
                    combo: 'alt+o',
                    cb: this.open
                }
            ]
        };
        opt.x = absPos.x;
        opt.y = absPos.y;
        return popup.menu(opt);
    };

    Column.prototype.onKey = function(event) {
        var char, combo, key, mod, ref1, ref2;
        ref1 = keyinfo.forEvent(event), mod = ref1.mod, key = ref1.key, combo = ref1.combo, char = ref1.char;
        switch (combo) {
            case 'alt+e':
                return this.explorer();
            case 'alt+o':
                return this.open();
            case 'page up':
            case 'page down':
            case 'home':
            case 'end':
                return stopEvent(event, this.navigateRows(key));
            case 'enter':
                return stopEvent(event, this.navigateCols(key));
            case 'command+enter':
            case 'ctrl+enter':
                return this.openFileInNewWindow();
            case 'command+left':
            case 'command+up':
            case 'command+right':
            case 'command+down':
            case 'ctrl+left':
            case 'ctrl+up':
            case 'ctrl+right':
            case 'ctrl+down':
                return stopEvent(event, this.navigateRoot(key));
            case 'command+backspace':
            case 'ctrl+backspace':
            case 'command+delete':
            case 'ctrl+delete':
                return stopEvent(event, this.moveToTrash());
            case 'alt+left':
                return stopEvent(event, window.split.focus('shelf'));
            case 'backspace':
            case 'delete':
                return stopEvent(event, this.browser.onBackspaceInColumn(this));
            case 'ctrl+t':
                return stopEvent(event, this.sortByType());
            case 'ctrl+n':
                return stopEvent(event, this.sortByName());
            case 'command+i':
            case 'ctrl+i':
                return stopEvent(event, this.toggleDotFiles());
            case 'command+d':
            case 'ctrl+d':
                return stopEvent(event, this.duplicateFile());
            case 'command+e':
            case 'ctrl+e':
                return stopEvent(event, this.toggleExtensions());
            case 'command+k':
            case 'ctrl+k':
                if (this.browser.cleanUp()) {
                    return stopEvent(event);
                }
                break;
            case 'f2':
                return stopEvent(event, (ref2 = this.activeRow()) != null ? ref2.editName() : void 0);
            case 'tab':
                if (this.search.length) {
                    this.doSearch('');
                }
                return stopEvent(event);
            case 'esc':
                if (this.search.length) {
                    this.clearSearch();
                } else {
                    window.split.focus('commandline-editor');
                }
                return stopEvent(event);
        }
        if (key === 'up' || key === 'down') {
            return stopEvent(event, this.navigateRows(key));
        }
        if (key === 'left' || key === 'right') {
            return stopEvent(event, this.navigateCols(key));
        }
        switch (char) {
            case '~':
            case '/':
                return stopEvent(event, this.navigateRoot(char));
        }
        if ((mod === 'shift' || mod === '') && char) {
            return this.doSearch(char);
        }
    };

    return Column;

})();

module.exports = Column;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sdW1uLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSwwSkFBQTtJQUFBOztBQVFBLE1BQXVILE9BQUEsQ0FBUSxLQUFSLENBQXZILEVBQUUsZUFBRixFQUFRLHlCQUFSLEVBQW1CLHVCQUFuQixFQUE2QixxQkFBN0IsRUFBc0MsaUJBQXRDLEVBQTZDLGlCQUE3QyxFQUFvRCxpQkFBcEQsRUFBMkQsaUJBQTNELEVBQWtFLGlCQUFsRSxFQUF5RSxpQkFBekUsRUFBZ0YsZUFBaEYsRUFBc0YsZUFBdEYsRUFBNEYsZUFBNUYsRUFBa0csV0FBbEcsRUFBc0csbUJBQXRHLEVBQThHLFNBQTlHLEVBQWlIOztBQUVqSCxHQUFBLEdBQVcsT0FBQSxDQUFRLE9BQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsT0FBUjs7QUFDWCxLQUFBLEdBQVcsT0FBQSxDQUFRLE9BQVI7O0FBRUw7SUFFVyxnQkFBQyxPQUFEO0FBRVQsWUFBQTtRQUZVLElBQUMsQ0FBQSxVQUFEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBRVYsSUFBQyxDQUFBLEtBQUQsK0NBQXlCLENBQUU7UUFDM0IsSUFBQyxDQUFBLFdBQUQsR0FBZTtRQUNmLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsS0FBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUVWLElBQUMsQ0FBQSxHQUFELEdBQVMsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxlQUFQO1lBQXdCLFFBQUEsRUFBVSxDQUFsQztZQUFxQyxFQUFBLEVBQUksSUFBQyxDQUFBLElBQUQsQ0FBQSxDQUF6QztTQUFMO1FBQ1QsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG9CQUFQO1NBQUw7UUFDVCxJQUFD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MDAwICAgICAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMCAgIDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMFxuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwgc3RvcEV2ZW50LCBzZXRTdHlsZSwga2V5aW5mbywgcG9wdXAsIHNsYXNoLCB2YWxpZCwgY2xhbXAsIGVtcHR5LCBzdGF0ZSwgb3BlbiwgZWxlbSwga3BvcywgZnMsIGtlcnJvciwgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Sb3cgICAgICA9IHJlcXVpcmUgJy4vcm93J1xuU2Nyb2xsZXIgPSByZXF1aXJlICcuL3Njcm9sbGVyJ1xuZnV6enkgICAgPSByZXF1aXJlICdmdXp6eSdcbnRyYXNoICAgID0gcmVxdWlyZSAndHJhc2gnXG5cbmNsYXNzIENvbHVtblxuICAgIFxuICAgIGNvbnN0cnVjdG9yOiAoQGJyb3dzZXIpIC0+XG4gICAgICAgIFxuICAgICAgICBAaW5kZXggPSBAYnJvd3Nlci5jb2x1bW5zPy5sZW5ndGhcbiAgICAgICAgQHNlYXJjaFRpbWVyID0gbnVsbFxuICAgICAgICBAc2VhcmNoID0gJydcbiAgICAgICAgQGl0ZW1zICA9IFtdXG4gICAgICAgIEByb3dzICAgPSBbXVxuICAgICAgICBcbiAgICAgICAgQGRpdiAgID0gZWxlbSBjbGFzczogJ2Jyb3dzZXJDb2x1bW4nLCB0YWJJbmRleDogNiwgaWQ6IEBuYW1lKClcbiAgICAgICAgQHRhYmxlID0gZWxlbSBjbGFzczogJ2Jyb3dzZXJDb2x1bW5UYWJsZSdcbiAgICAgICAgQGRpdi5hcHBlbmRDaGlsZCBAdGFibGVcbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLmNvbHM/LmFwcGVuZENoaWxkIEBkaXZcbiAgICAgICAgXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnZm9jdXMnLCAgICAgQG9uRm9jdXNcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdibHVyJywgICAgICBAb25CbHVyXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAna2V5ZG93bicsICAgQG9uS2V5XG4gICAgICAgIFxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlb3ZlcicsIEBvbk1vdXNlT3ZlclxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlb3V0JywgIEBvbk1vdXNlT3V0XG5cbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdtb3VzZXVwJywgICBAb25DbGlja1xuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2RibGNsaWNrJywgIEBvbkRibENsaWNrXG4gICAgICAgIFxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgXCJjb250ZXh0bWVudVwiLCBAb25Db250ZXh0TWVudVxuICAgICAgICBcbiAgICAgICAgQHNjcm9sbCA9IG5ldyBTY3JvbGxlciBAXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBsb2FkSXRlbXM6IChpdGVtcywgcGFyZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuY2xlYXJDb2x1bW4gQGluZGV4XG4gICAgICAgIFxuICAgICAgICBAaXRlbXMgID0gaXRlbXNcbiAgICAgICAgQHBhcmVudCA9IHBhcmVudFxuICAgICAgICBcbiAgICAgICAga2Vycm9yIFwibm8gcGFyZW50IGl0ZW0/XCIgaWYgbm90IEBwYXJlbnQ/XG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBAaXRlbXNcbiAgICAgICAgICAgIGZvciBpdGVtIGluIEBpdGVtc1xuICAgICAgICAgICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIFxuICAgICAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAXG5cbiAgICBzZXRJdGVtczogKEBpdGVtcywgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuY2xlYXJDb2x1bW4gQGluZGV4XG4gICAgICAgIFxuICAgICAgICBAcGFyZW50ID0gb3B0LnBhcmVudFxuICAgICAgICBrZXJyb3IgXCJubyBwYXJlbnQgaXRlbT9cIiBpZiBub3QgQHBhcmVudD9cbiAgICAgICAgXG4gICAgICAgIGZvciBpdGVtIGluIEBpdGVtc1xuICAgICAgICAgICAgQHJvd3MucHVzaCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgQFxuXG4gICAgaXNEaXI6ICAtPiBAcGFyZW50LnR5cGUgPT0gJ2RpcicgXG4gICAgaXNGaWxlOiAtPiBAcGFyZW50LnR5cGUgPT0gJ2ZpbGUnIFxuICAgICAgICBcbiAgICBpc0VtcHR5OiAtPiBlbXB0eSBAcm93c1xuICAgIGNsZWFyOiAgIC0+XG4gICAgICAgIEBjbGVhclNlYXJjaCgpXG4gICAgICAgIGRlbGV0ZSBAcGFyZW50XG4gICAgICAgIEBkaXYuc2Nyb2xsVG9wID0gMFxuICAgICAgICBAZWRpdG9yPy5kZWwoKVxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgQHJvd3MgPSBbXVxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwICAgICAgMDAwMDAwMDAgIFxuICAgXG4gICAgYWN0aXZhdGVSb3c6ICAocm93KSAtPiBAcm93KHJvdyk/LmFjdGl2YXRlKClcbiAgICAgICBcbiAgICBhY3RpdmVSb3c6IC0+IF8uZmluZCBAcm93cywgKHIpIC0+IHIuaXNBY3RpdmUoKVxuICAgIGFjdGl2ZVBhdGg6IC0+IEBhY3RpdmVSb3coKT8ucGF0aCgpXG4gICAgXG4gICAgcm93OiAocm93KSAtPiAjIGFjY2VwdHMgZWxlbWVudCwgaW5kZXgsIHN0cmluZyBvciByb3dcbiAgICAgICAgaWYgICAgICBfLmlzTnVtYmVyICByb3cgdGhlbiByZXR1cm4gMCA8PSByb3cgPCBAbnVtUm93cygpIGFuZCBAcm93c1tyb3ddIG9yIG51bGxcbiAgICAgICAgZWxzZSBpZiBfLmlzRWxlbWVudCByb3cgdGhlbiByZXR1cm4gXy5maW5kIEByb3dzLCAocikgLT4gci5kaXYuY29udGFpbnMgcm93XG4gICAgICAgIGVsc2UgaWYgXy5pc1N0cmluZyAgcm93IHRoZW4gcmV0dXJuIF8uZmluZCBAcm93cywgKHIpIC0+IHIuaXRlbS5uYW1lID09IHJvd1xuICAgICAgICBlbHNlIHJldHVybiByb3dcbiAgICAgICAgICAgIFxuICAgIG5leHRDb2x1bW46IC0+IEBicm93c2VyLmNvbHVtbiBAaW5kZXgrMVxuICAgIHByZXZDb2x1bW46IC0+IEBicm93c2VyLmNvbHVtbiBAaW5kZXgtMVxuICAgICAgICBcbiAgICBuYW1lOiAtPiBcIiN7QGJyb3dzZXIubmFtZX06I3tAaW5kZXh9XCJcbiAgICBwYXRoOiAtPiBAcGFyZW50Py5maWxlID8gJydcbiAgICAgICAgXG4gICAgbnVtUm93czogICAgLT4gQHJvd3MubGVuZ3RoID8gMCAgIFxuICAgIHJvd0hlaWdodDogIC0+IEByb3dzWzBdPy5kaXYuY2xpZW50SGVpZ2h0ID8gMFxuICAgIG51bVZpc2libGU6IC0+IEByb3dIZWlnaHQoKSBhbmQgcGFyc2VJbnQoQGJyb3dzZXIuaGVpZ2h0KCkgLyBAcm93SGVpZ2h0KCkpIG9yIDBcbiAgICBcbiAgICByb3dJbmRleEF0UG9zOiAocG9zKSAtPlxuICAgICAgICBcbiAgICAgICAgTWF0aC5tYXggMCwgTWF0aC5mbG9vciAocG9zLnkgLSBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCkgLyBAcm93SGVpZ2h0KClcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBoYXNGb2N1czogLT4gQGRpdi5jbGFzc0xpc3QuY29udGFpbnMgJ2ZvY3VzJ1xuXG4gICAgZm9jdXM6IChvcHQ9e30pIC0+XG4gICAgICAgIGlmIG5vdCBAYWN0aXZlUm93KCkgYW5kIEBudW1Sb3dzKCkgYW5kIG9wdD8uYWN0aXZhdGUgIT0gZmFsc2VcbiAgICAgICAgICAgIEByb3dzWzBdLnNldEFjdGl2ZSgpXG4gICAgICAgIEBkaXYuZm9jdXMoKVxuICAgICAgICB3aW5kb3cuc2V0TGFzdEZvY3VzIEBuYW1lKClcbiAgICAgICAgQFxuICAgICAgICBcbiAgICBvbkZvY3VzOiA9PiBAZGl2LmNsYXNzTGlzdC5hZGQgJ2ZvY3VzJ1xuICAgIG9uQmx1cjogID0+IEBkaXYuY2xhc3NMaXN0LnJlbW92ZSAnZm9jdXMnXG5cbiAgICBmb2N1c0Jyb3dzZXI6IC0+IEBicm93c2VyLmZvY3VzKClcbiAgICBcbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG9uTW91c2VPdmVyOiAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8ub25Nb3VzZU92ZXIoKVxuICAgIG9uTW91c2VPdXQ6ICAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8ub25Nb3VzZU91dCgpXG4gICAgb25DbGljazogICAgIChldmVudCkgPT4gQHJvdyhldmVudC50YXJnZXQpPy5hY3RpdmF0ZSBldmVudFxuICAgIG9uRGJsQ2xpY2s6ICAoZXZlbnQpID0+IFxuICAgICAgICBAbmF2aWdhdGVDb2xzICdlbnRlcidcbiAgICAgICAgaWYgaXRlbSA9IEBhY3RpdmVSb3coKT8uaXRlbVxuICAgICAgICAgICAgaWYgaXRlbS5maWxlIGFuZCBpdGVtLnR5cGUgPT0gJ2ZpbGUnICMganVtcCB0byB0b3Agb2YgZmlsZSBvbiBkb3VibGUgY2xpY2tcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ3NpbmdsZUN1cnNvckF0UG9zJywgWzAsIDBdXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG5cbiAgICBuYXZpZ2F0ZVJvd3M6IChrZXkpIC0+XG5cbiAgICAgICAgcmV0dXJuIGVycm9yIFwibm8gcm93cyBpbiBjb2x1bW4gI3tAaW5kZXh9P1wiIGlmIG5vdCBAbnVtUm93cygpXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gLTFcbiAgICAgICAgZXJyb3IgXCJubyBpbmRleCBmcm9tIGFjdGl2ZVJvdz8gI3tpbmRleH0/XCIsIEBhY3RpdmVSb3coKSBpZiBub3QgaW5kZXg/IG9yIE51bWJlci5pc05hTiBpbmRleFxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICd1cCcgICAgICAgIHRoZW4gaW5kZXgtMVxuICAgICAgICAgICAgd2hlbiAnZG93bicgICAgICB0aGVuIGluZGV4KzFcbiAgICAgICAgICAgIHdoZW4gJ2hvbWUnICAgICAgdGhlbiAwXG4gICAgICAgICAgICB3aGVuICdlbmQnICAgICAgIHRoZW4gQG51bVJvd3MoKS0xXG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAgIHRoZW4gaW5kZXgtQG51bVZpc2libGUoKVxuICAgICAgICAgICAgd2hlbiAncGFnZSBkb3duJyB0aGVuIGluZGV4K0BudW1WaXNpYmxlKClcbiAgICAgICAgICAgIGVsc2UgaW5kZXhcbiAgICAgICAgICAgIFxuICAgICAgICBlcnJvciBcIm5vIGluZGV4ICN7aW5kZXh9PyAje0BudW1WaXNpYmxlKCl9XCIgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXggICAgICAgIFxuICAgICAgICBpbmRleCA9IGNsYW1wIDAsIEBudW1Sb3dzKCktMSwgaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGVycm9yIFwibm8gcm93IGF0IGluZGV4ICN7aW5kZXh9LyN7QG51bVJvd3MoKS0xfT9cIiwgQG51bVJvd3MoKSBpZiBub3QgQHJvd3NbaW5kZXhdPy5hY3RpdmF0ZT9cbiAgICAgICAgQHJvd3NbaW5kZXhdLmFjdGl2YXRlKClcbiAgICBcbiAgICBuYXZpZ2F0ZUNvbHM6IChrZXkpIC0+ICMgbW92ZSB0byBmaWxlIGJyb3dzZXI/XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiBAYnJvd3Nlci5uYXZpZ2F0ZSAnbGVmdCdcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuIEBicm93c2VyLm5hdmlnYXRlICdyaWdodCdcbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJ1xuICAgICAgICAgICAgICAgIGlmIGl0ZW0gPSBAYWN0aXZlUm93KCk/Lml0ZW1cbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9IGl0ZW0udHlwZVxuICAgICAgICAgICAgICAgICAgICBpZiB0eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2ZpbGVicm93c2VyJywgJ2xvYWRJdGVtJywgaXRlbSwgZm9jdXM6dHJ1ZVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG8nLCBpdGVtXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2ZvY3VzJywgJ2VkaXRvcidcbiAgICAgICAgQFxuXG4gICAgbmF2aWdhdGVSb290OiAoa2V5KSAtPiAjIG1vdmUgdG8gZmlsZSBicm93c2VyP1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAYnJvd3Nlci5icm93c2U/XG4gICAgICAgIEBicm93c2VyLmJyb3dzZSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiBzbGFzaC5kaXIgQHBhcmVudC5maWxlXG4gICAgICAgICAgICB3aGVuICd1cCcgICAgdGhlbiBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuIEBhY3RpdmVSb3coKS5pdGVtLmZpbGVcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nICB0aGVuIHNsYXNoLnBrZyBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIHdoZW4gJ34nICAgICB0aGVuICd+J1xuICAgICAgICAgICAgd2hlbiAnLycgICAgIHRoZW4gJy8nXG4gICAgICAgIEBcbiAgICAgICAgICAgIFxuICAgIG9wZW5GaWxlSW5OZXdXaW5kb3c6IC0+ICBcbiAgICAgICAgXG4gICAgICAgIGlmIGl0ZW0gPSBAYWN0aXZlUm93KCk/Lml0ZW1cbiAgICAgICAgICAgIGlmIGl0ZW0udHlwZSA9PSAnZmlsZScgYW5kIGl0ZW0udGV4dEZpbGUgYW5kIGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnb3BlbkZpbGVzJywgW2l0ZW0uZmlsZV0sIG5ld1dpbmRvdzogdHJ1ZVxuICAgICAgICBAXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgIFxuICAgIFxuICAgIGRvU2VhcmNoOiAoY2hhcikgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQG51bVJvd3MoKVxuICAgICAgICBcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBzZWFyY2hUaW1lclxuICAgICAgICBAc2VhcmNoVGltZXIgPSBzZXRUaW1lb3V0IEBjbGVhclNlYXJjaCwgMjAwMFxuICAgICAgICBAc2VhcmNoICs9IGNoYXJcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAc2VhcmNoRGl2XG4gICAgICAgICAgICBAc2VhcmNoRGl2ID0gZWxlbSBjbGFzczogJ2Jyb3dzZXJTZWFyY2gnXG4gICAgICAgICAgICBcbiAgICAgICAgQHNlYXJjaERpdi50ZXh0Q29udGVudCA9IEBzZWFyY2hcblxuICAgICAgICBhY3RpdmVJbmRleCAgPSBAYWN0aXZlUm93KCk/LmluZGV4KCkgPyAwXG4gICAgICAgIGFjdGl2ZUluZGV4ICs9IDEgaWYgKEBzZWFyY2gubGVuZ3RoID09IDEpIG9yIChjaGFyID09ICcnKVxuICAgICAgICBhY3RpdmVJbmRleCAgPSAwIGlmIGFjdGl2ZUluZGV4ID49IEBudW1Sb3dzKClcbiAgICAgICAgXG4gICAgICAgIGZvciByb3dzIGluIFtAcm93cy5zbGljZShhY3RpdmVJbmRleCksIEByb3dzLnNsaWNlKDAsYWN0aXZlSW5kZXgrMSldXG4gICAgICAgICAgICBmdXp6aWVkID0gZnV6enkuZmlsdGVyIEBzZWFyY2gsIHJvd3MsIGV4dHJhY3Q6IChyKSAtPiByLml0ZW0ubmFtZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBmdXp6aWVkLmxlbmd0aFxuICAgICAgICAgICAgICAgIHJvdyA9IGZ1enppZWRbMF0ub3JpZ2luYWxcbiAgICAgICAgICAgICAgICByb3cuZGl2LmFwcGVuZENoaWxkIEBzZWFyY2hEaXZcbiAgICAgICAgICAgICAgICByb3cuYWN0aXZhdGUoKVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIEBcbiAgICBcbiAgICBjbGVhclNlYXJjaDogPT5cbiAgICAgICAgXG4gICAgICAgIEBzZWFyY2ggPSAnJ1xuICAgICAgICBAc2VhcmNoRGl2Py5yZW1vdmUoKVxuICAgICAgICBkZWxldGUgQHNlYXJjaERpdlxuICAgICAgICBAXG4gICAgXG4gICAgcmVtb3ZlT2JqZWN0OiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgcm93ID0gQGFjdGl2ZVJvdygpXG4gICAgICAgICAgICBAYnJvd3Nlci5lbWl0ICd3aWxsUmVtb3ZlUm93Jywgcm93LCBAXG4gICAgICAgICAgICBuZXh0T3JQcmV2ID0gcm93Lm5leHQoKSA/IHJvdy5wcmV2KClcbiAgICAgICAgICAgIEByZW1vdmVSb3cgcm93XG4gICAgICAgICAgICBuZXh0T3JQcmV2Py5hY3RpdmF0ZSgpXG4gICAgICAgIEBcblxuICAgIHJlbW92ZVJvdzogKHJvdykgLT5cbiAgICAgICAgXG4gICAgICAgIHJvdy5kaXYucmVtb3ZlKClcbiAgICAgICAgQGl0ZW1zLnNwbGljZSByb3cuaW5kZXgoKSwgMVxuICAgICAgICBAcm93cy5zcGxpY2Ugcm93LmluZGV4KCksIDFcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgc29ydEJ5TmFtZTogLT5cbiAgICAgICAgIFxuICAgICAgICBAcm93cy5zb3J0IChhLGIpIC0+IFxuICAgICAgICAgICAgYS5pdGVtLm5hbWUubG9jYWxlQ29tcGFyZSBiLml0ZW0ubmFtZVxuICAgICAgICAgICAgXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBmb3Igcm93IGluIEByb3dzXG4gICAgICAgICAgICBAdGFibGUuYXBwZW5kQ2hpbGQgcm93LmRpdlxuICAgICAgICBAXG4gICAgICAgIFxuICAgIHNvcnRCeVR5cGU6IC0+XG4gICAgICAgIFxuICAgICAgICBAcm93cy5zb3J0IChhLGIpIC0+IFxuICAgICAgICAgICAgYXR5cGUgPSBhLml0ZW0udHlwZSA9PSAnZmlsZScgYW5kIHNsYXNoLmV4dChhLml0ZW0ubmFtZSkgb3IgYS5pdGVtLnR5cGVcbiAgICAgICAgICAgIGJ0eXBlID0gYi5pdGVtLnR5cGUgPT0gJ2ZpbGUnIGFuZCBzbGFzaC5leHQoYi5pdGVtLm5hbWUpIG9yIGIuaXRlbS50eXBlXG4gICAgICAgICAgICAoYXR5cGUgKyBhLml0ZW0ubmFtZSkubG9jYWxlQ29tcGFyZSBidHlwZSArIGIuaXRlbS5uYW1lXG4gICAgICAgICAgICBcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3NcbiAgICAgICAgICAgIEB0YWJsZS5hcHBlbmRDaGlsZCByb3cuZGl2XG4gICAgICAgIEBcbiAgXG4gICAgIyAwMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIHRvZ2dsZURvdEZpbGVzOiA9PlxuXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSAnZGlyJyAgICAgICAgICAgIFxuICAgICAgICAgICAgc3RhdGVLZXkgPSBcImJyb3dzZXJ8c2hvd0hpZGRlbnwje0BwYXJlbnQuZmlsZX1cIlxuICAgICAgICAgICAgaWYgd2luZG93LnN0YXRlLmdldCBzdGF0ZUtleVxuICAgICAgICAgICAgICAgIHdpbmRvdy5zdGF0ZS5zZXQgc3RhdGVLZXksIGZhbHNlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgd2luZG93LnN0YXRlLnNldCBzdGF0ZUtleSwgdHJ1ZVxuICAgICAgICAgICAgQGJyb3dzZXIubG9hZERpckl0ZW0gQHBhcmVudCwgQGluZGV4LCBpZ25vcmVDYWNoZTp0cnVlXG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgdG9nZ2xlRXh0ZW5zaW9uczogPT5cblxuICAgICAgICBzdGF0ZUtleSA9IFwiYnJvd3NlcnxoaWRlRXh0ZW5zaW9uc1wiXG4gICAgICAgIHdpbmRvdy5zdGF0ZS5zZXQgc3RhdGVLZXksIG5vdCB3aW5kb3cuc3RhdGUuZ2V0IHN0YXRlS2V5LCBmYWxzZVxuICAgICAgICBzZXRTdHlsZSAnLmJyb3dzZXJSb3cgLmV4dCcsICdkaXNwbGF5Jywgd2luZG93LnN0YXRlLmdldChzdGF0ZUtleSkgYW5kICdub25lJyBvciAnaW5pdGlhbCdcbiAgICAgICAgQFxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgbW92ZVRvVHJhc2g6ID0+XG4gICAgICAgIFxuICAgICAgICBwYXRoVG9UcmFzaCA9IEBhY3RpdmVQYXRoKClcbiAgICAgICAgaWYgcGF0aFRvVHJhc2ggPT0gd2luZG93LnRhYnMuYWN0aXZlVGFiKCkuZmlsZVxuICAgICAgICAgICAgd2luZG93LnRhYnMuY2xvc2VUYWIgd2luZG93LnRhYnMuYWN0aXZlVGFiKClcbiAgICAgICAgQHJlbW92ZU9iamVjdCgpXG4gICAgICAgIFxuICAgICAgICB0cmFzaChbcGF0aFRvVHJhc2hdKS5jYXRjaCAoZXJyKSAtPiBlcnJvciBcImZhaWxlZCB0byB0cmFzaCAje3BhdGhUb1RyYXNofSAje2Vycn1cIlxuXG4gICAgYWRkVG9TaGVsZjogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIHBhdGhUb1NoZWxmID0gQGFjdGl2ZVBhdGgoKVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdhZGRUb1NoZWxmJywgcGF0aFRvU2hlbGZcbiAgICAgICAgICAgIHdpbmRvdy5zcGxpdC5mb2N1cyAnc2hlbGYnXG4gICAgICAgIFxuICAgIGR1cGxpY2F0ZUZpbGU6ID0+XG4gICAgICAgIFxuICAgICAgICB1bnVzZWRGaWxlbmFtZSA9IHJlcXVpcmUgJ3VudXNlZC1maWxlbmFtZSdcbiAgICAgICAgdW51c2VkRmlsZW5hbWUoQGFjdGl2ZVBhdGgoKSkudGhlbiAoZmlsZU5hbWUpID0+XG4gICAgICAgICAgICBmaWxlTmFtZSA9IHNsYXNoLnBhdGggZmlsZU5hbWVcbiAgICAgICAgICAgIGlmIGZzLmNvcHk/ICMgZnMuY29weUZpbGUgaW4gbm9kZSA+IDguNFxuICAgICAgICAgICAgICAgIGZzLmNvcHkgQGFjdGl2ZVBhdGgoKSwgZmlsZU5hbWUsIChlcnIpID0+XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnJvciAnY29weSBmaWxlIGZhaWxlZCcsIGVyciBpZiBlcnI/XG4gICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnbG9hZEZpbGUnLCBmaWxlTmFtZVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgZXhwbG9yZXI6ID0+XG4gICAgICAgIFxuICAgICAgICBvcGVuIHNsYXNoLmRpciBAYWN0aXZlUGF0aCgpXG4gICAgICAgIFxuICAgIG9wZW46ID0+XG4gICAgICAgIFxuICAgICAgICBvcGVuIEBhY3RpdmVQYXRoKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgdXBkYXRlR2l0RmlsZXM6IChmaWxlcykgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3NcbiAgICAgICAgICAgIHJldHVybiBpZiByb3cuaXRlbS50eXBlIG5vdCBpbiBbJ2RpcicsICdmaWxlJ11cbiAgICAgICAgICAgIHN0YXR1cyA9IGZpbGVzW3Jvdy5pdGVtLmZpbGVdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgICQoJy5icm93c2VyU3RhdHVzSWNvbicsIHJvdy5kaXYpPy5yZW1vdmUoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBzdGF0dXM/XG4gICAgICAgICAgICAgICAgcm93LmRpdi5hcHBlbmRDaGlsZCBlbGVtICdzcGFuJywgY2xhc3M6XCJnaXQtI3tzdGF0dXN9LWljb24gYnJvd3NlclN0YXR1c0ljb25cIlxuICAgICAgICAgICAgZWxzZSBpZiByb3cuaXRlbS50eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgZm9yIGZpbGUsIHN0YXR1cyBvZiBmaWxlc1xuICAgICAgICAgICAgICAgICAgICBpZiByb3cuaXRlbS5uYW1lICE9ICcuLicgYW5kIGZpbGUuc3RhcnRzV2l0aCByb3cuaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgICAgICByb3cuZGl2LmFwcGVuZENoaWxkIGVsZW0gJ3NwYW4nLCBjbGFzczpcImdpdC1kaXJzLWljb24gYnJvd3NlclN0YXR1c0ljb25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIFxuICAgICAgICBcbiAgICBvbkNvbnRleHRNZW51OiAoZXZlbnQpID0+IHN0b3BFdmVudCBldmVudCwgQHNob3dDb250ZXh0TWVudSBrcG9zIGV2ZW50XG4gICAgICAgICAgICAgIFxuICAgIHNob3dDb250ZXh0TWVudTogKGFic1BvcykgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBhYnNQb3M/XG4gICAgICAgICAgICBhYnNQb3MgPSBrcG9zIEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQsIEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcFxuICAgICAgICBcbiAgICAgICAgb3B0ID0gaXRlbXM6IFsgXG4gICAgICAgICAgICB0ZXh0OiAgICdUb2dnbGUgSW52aXNpYmxlJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtpJyBcbiAgICAgICAgICAgIGNiOiAgICAgQHRvZ2dsZURvdEZpbGVzXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ1RvZ2dsZSBFeHRlbnNpb25zJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQHRvZ2dsZUV4dGVuc2lvbnNcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnUmVmcmVzaCdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrcicgXG4gICAgICAgICAgICBjYjogICAgIEBicm93c2VyLnJlZnJlc2hcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnRHVwbGljYXRlJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtkJyBcbiAgICAgICAgICAgIGNiOiAgICAgQGR1cGxpY2F0ZUZpbGVcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnTW92ZSB0byBUcmFzaCdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrYmFja3NwYWNlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQG1vdmVUb1RyYXNoXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ0FkZCB0byBTaGVsZidcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtzaGlmdCsuJ1xuICAgICAgICAgICAgY2I6ICAgICBAYWRkVG9TaGVsZlxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdFeHBsb3JlcidcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQGV4cGxvcmVyXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ09wZW4nXG4gICAgICAgICAgICBjb21ibzogICdhbHQrbycgXG4gICAgICAgICAgICBjYjogICAgIEBvcGVuXG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgb3B0LnkgPSBhYnNQb3MueVxuICAgICAgICBwb3B1cC5tZW51IG9wdCAgICAgICAgXG4gICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgb25LZXk6IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIHsgbW9kLCBrZXksIGNvbWJvLCBjaGFyIH0gPSBrZXlpbmZvLmZvckV2ZW50IGV2ZW50XG5cbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdhbHQrZScgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAZXhwbG9yZXIoKVxuICAgICAgICAgICAgd2hlbiAnYWx0K28nICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQG9wZW4oKVxuICAgICAgICAgICAgd2hlbiAncGFnZSB1cCcsICdwYWdlIGRvd24nLCAnaG9tZScsICdlbmQnIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlQ29scyBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrZW50ZXInLCAnY3RybCtlbnRlcicgdGhlbiByZXR1cm4gQG9wZW5GaWxlSW5OZXdXaW5kb3coKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtsZWZ0JywgJ2NvbW1hbmQrdXAnLCAnY29tbWFuZCtyaWdodCcsICdjb21tYW5kK2Rvd24nLCAnY3RybCtsZWZ0JywgJ2N0cmwrdXAnLCAnY3RybCtyaWdodCcsICdjdHJsK2Rvd24nXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm9vdCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrYmFja3NwYWNlJywgJ2N0cmwrYmFja3NwYWNlJywgJ2NvbW1hbmQrZGVsZXRlJywgJ2N0cmwrZGVsZXRlJyBcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbW92ZVRvVHJhc2goKVxuICAgICAgICAgICAgd2hlbiAnYWx0K2xlZnQnICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCB3aW5kb3cuc3BsaXQuZm9jdXMgJ3NoZWxmJ1xuICAgICAgICAgICAgd2hlbiAnYmFja3NwYWNlJywgJ2RlbGV0ZScgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYnJvd3Nlci5vbkJhY2tzcGFjZUluQ29sdW1uIEBcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrdCcgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeVR5cGUoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCtuJyAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAc29ydEJ5TmFtZSgpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2knLCAnY3RybCtpJyB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEB0b2dnbGVEb3RGaWxlcygpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2QnLCAnY3RybCtkJyB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBkdXBsaWNhdGVGaWxlKClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrZScsICdjdHJsK2UnIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHRvZ2dsZUV4dGVuc2lvbnMoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtrJywgJ2N0cmwraycgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50IGlmIEBicm93c2VyLmNsZWFuVXAoKVxuICAgICAgICAgICAgd2hlbiAnZjInICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYWN0aXZlUm93KCk/LmVkaXROYW1lKClcbiAgICAgICAgICAgIHdoZW4gJ3RhYicgICAgXG4gICAgICAgICAgICAgICAgaWYgQHNlYXJjaC5sZW5ndGggdGhlbiBAZG9TZWFyY2ggJydcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICB3aGVuICdlc2MnXG4gICAgICAgICAgICAgICAgaWYgQHNlYXJjaC5sZW5ndGggdGhlbiBAY2xlYXJTZWFyY2goKVxuICAgICAgICAgICAgICAgIGVsc2Ugd2luZG93LnNwbGl0LmZvY3VzICdjb21tYW5kbGluZS1lZGl0b3InXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudFxuXG4gICAgICAgIGlmIGtleSBpbiBbJ3VwJywgICAnZG93biddICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvd3Mga2V5ICAgICAgICAgICAgICBcbiAgICAgICAgaWYga2V5IGluIFsnbGVmdCcsICdyaWdodCddIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlQ29scyBrZXkgICAgICAgIFxuICAgICAgICAgICAgXG4gICAgICAgIHN3aXRjaCBjaGFyXG4gICAgICAgICAgICB3aGVuICd+JywgJy8nIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm9vdCBjaGFyXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgbW9kIGluIFsnc2hpZnQnLCAnJ10gYW5kIGNoYXIgdGhlbiBAZG9TZWFyY2ggY2hhclxuICAgICAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBDb2x1bW5cblxuXG4iXX0=
//# sourceURL=../../coffee/browser/column.coffee