// koffee 1.4.0

/*
 0000000  000   000  00000000  000      00000000
000       000   000  000       000      000     
0000000   000000000  0000000   000      000000  
     000  000   000  000       000      000     
0000000   000   000  00000000  0000000  000
 */
var $, Column, Row, Scroller, Shelf, _, clamp, elem, empty, first, fuzzy, hub, kerror, keyinfo, last, popup, post, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), stopEvent = ref.stopEvent, keyinfo = ref.keyinfo, slash = ref.slash, post = ref.post, popup = ref.popup, elem = ref.elem, clamp = ref.clamp, empty = ref.empty, first = ref.first, last = ref.last, kerror = ref.kerror, $ = ref.$, _ = ref._;

Row = require('./row');

Scroller = require('./scroller');

Column = require('./column');

fuzzy = require('fuzzy');

hub = require('../git/hub');

Shelf = (function(superClass) {
    extend(Shelf, superClass);

    function Shelf(browser) {
        this.onKey = bind(this.onKey, this);
        this.showContextMenu = bind(this.showContextMenu, this);
        this.removeObject = bind(this.removeObject, this);
        this.onDblClick = bind(this.onDblClick, this);
        this.onClick = bind(this.onClick, this);
        this.onMouseOut = bind(this.onMouseOut, this);
        this.onMouseOver = bind(this.onMouseOver, this);
        this.onFocus = bind(this.onFocus, this);
        this.onNavigateIndexChanged = bind(this.onNavigateIndexChanged, this);
        this.onNavigateHistoryChanged = bind(this.onNavigateHistoryChanged, this);
        this.clearHistory = bind(this.clearHistory, this);
        this.toggleHistory = bind(this.toggleHistory, this);
        this.loadGitStatus = bind(this.loadGitStatus, this);
        this.addPath = bind(this.addPath, this);
        this.onFile = bind(this.onFile, this);
        Shelf.__super__.constructor.call(this, browser);
        this.items = [];
        this.index = -1;
        this.div.id = 'shelf';
        this.showHistory = window.stash.get('shelf|history', true);
        post.on('gitStatus', this.loadGitStatus);
        post.on('addToShelf', this.addPath);
        post.on('navigateHistoryChanged', this.onNavigateHistoryChanged);
        post.on('navigateIndexChanged', this.onNavigateIndexChanged);
        post.on('file', this.onFile);
    }

    Shelf.prototype.activateRow = function(row) {
        var item, ref1;
        item = row.item;
        if (item.type === 'historySeparator') {
            row.setActive({
                emit: false
            });
            return;
        }
        if ((ref1 = $('.hover')) != null) {
            ref1.classList.remove('hover');
        }
        row.setActive({
            emit: true
        });
        if (item.type === 'file') {
            return post.emit('jumpToFile', item);
        } else {
            return post.emit('filebrowser', 'loadItem', item);
        }
    };

    Shelf.prototype.onFile = function(file) {
        var index, item, j, matches, ref1, ref2, ref3;
        if (empty(file)) {
            return;
        }
        if (this.navigatingRows) {
            delete this.navigatingRows;
            return;
        }
        for (index = j = 0, ref1 = this.items.length; 0 <= ref1 ? j < ref1 : j > ref1; index = 0 <= ref1 ? ++j : --j) {
            if (this.items[index].file === file) {
                this.rows[index].setActive();
                return;
            }
        }
        matches = [];
        ref2 = this.items;
        for (index in ref2) {
            item = ref2[index];
            if (file != null ? file.startsWith(item.file) : void 0) {
                matches.push([index, item]);
            }
        }
        if (!empty(matches)) {
            matches.sort(function(a, b) {
                return b[1].file.length - a[1].file.length;
            });
            ref3 = first(matches), index = ref3[0], item = ref3[1];
            return this.rows[index].setActive();
        }
    };

    Shelf.prototype.browserDidInitColumns = function() {
        if (this.didInit) {
            return;
        }
        this.didInit = true;
        this.loadShelfItems();
        if (this.showHistory) {
            this.loadHistory();
        }
        return this.loadGitStatus();
    };

    Shelf.prototype.loadShelfItems = function() {
        var items;
        items = window.state.get("shelf|items");
        return this.setItems(items, {
            save: false
        });
    };

    Shelf.prototype.addPath = function(path, opt) {
        if (slash.isDir(path)) {
            return this.addDir(path, opt);
        } else {
            return this.addFile(path, opt);
        }
    };

    Shelf.prototype.itemPaths = function() {
        return this.rows.map(function(r) {
            return r.path();
        });
    };

    Shelf.prototype.savePrefs = function() {
        return window.state.set("shelf|items", this.items);
    };

    Shelf.prototype.setItems = function(items1, opt) {
        this.items = items1;
        this.clear();
        if (this.items != null) {
            this.items;
        } else {
            this.items = [];
        }
        this.addItems(this.items);
        if ((opt != null ? opt.save : void 0) !== false) {
            this.savePrefs();
        }
        return this;
    };

    Shelf.prototype.addItems = function(items, opt) {
        var item, j, len;
        if (empty(items)) {
            return;
        }
        for (j = 0, len = items.length; j < len; j++) {
            item = items[j];
            this.rows.push(new Row(this, item));
        }
        this.scroll.update();
        return this;
    };

    Shelf.prototype.addDir = function(dir, opt) {
        var item;
        item = {
            name: slash.file(slash.tilde(dir)),
            type: 'dir',
            file: slash.path(dir)
        };
        return this.addItem(item, opt);
    };

    Shelf.prototype.addFile = function(file, opt) {
        var item;
        item = {
            name: slash.file(file),
            type: 'file',
            file: slash.path(file)
        };
        if (slash.isText(file)) {
            item.textFile = true;
        }
        return this.addItem(item, opt);
    };

    Shelf.prototype.addItem = function(item, opt) {
        var index;
        _.pullAllWith(this.items, [item], _.isEqual);
        if (opt != null ? opt.pos : void 0) {
            index = this.rowIndexAtPos(opt.pos);
            this.items.splice(Math.min(index, this.items.length), 0, item);
        } else {
            this.items.push(item);
        }
        this.setItems(this.items);
        if (this.showHistory) {
            this.loadHistory();
        }
        return this.loadGitStatus();
    };

    Shelf.prototype.dropRow = function(row, pos) {
        return this.addItem(row.item, {
            pos: pos
        });
    };

    Shelf.prototype.isEmpty = function() {
        return empty(this.rows);
    };

    Shelf.prototype.clear = function() {
        this.clearSearch();
        this.div.scrollTop = 0;
        this.table.innerHTML = '';
        this.rows = [];
        return this.scroll.update();
    };

    Shelf.prototype.name = function() {
        return 'shelf';
    };

    Shelf.prototype.loadGitStatus = function() {
        var fileStatus, j, len, ref1, ref2, results, row;
        ref1 = this.rows;
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
            row = ref1[j];
            if ((ref2 = $('.browserStatusIcon', row.div)) != null) {
                ref2.remove();
            }
            fileStatus = function(row) {
                return (function(_this) {
                    return function(status) {
                        var file, ref3, results1;
                        ref3 = hub.statusFiles(status);
                        results1 = [];
                        for (file in ref3) {
                            status = ref3[file];
                            if (file.startsWith(row.path())) {
                                if (row.item.type === 'dir') {
                                    status = 'dirs';
                                }
                                row.div.appendChild(elem('span', {
                                    "class": "git-" + status + "-icon browserStatusIcon"
                                }));
                                break;
                            } else {
                                results1.push(void 0);
                            }
                        }
                        return results1;
                    };
                })(this);
            };
            results.push(hub.status(row.path(), fileStatus(row)));
        }
        return results;
    };

    Shelf.prototype.updateGitFiles = function() {
        return this.loadGitStatus();
    };

    Shelf.prototype.toggleHistory = function() {
        this.showHistory = !this.showHistory;
        if (this.showHistory) {
            this.loadHistory();
        } else {
            this.removeHistory();
        }
        window.stash.set('shelf|history', this.showHistory);
        return window.stash.set('shelf|history', this.showHistory);
    };

    Shelf.prototype.clearHistory = function() {
        window.navigate.clear();
        if (this.showHistory) {
            return this.setHistoryItems([
                {
                    file: window.editor.currentFile,
                    pos: window.editor.mainCursor(),
                    text: slash.file(window.editor.currentFile)
                }
            ]);
        }
    };

    Shelf.prototype.historySeparatorIndex = function() {
        var i, j, ref1;
        for (i = j = 0, ref1 = this.numRows(); 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
            if (this.row(i).item.type === 'historySeparator') {
                return i;
            }
        }
        return this.numRows();
    };

    Shelf.prototype.removeHistory = function() {
        var results, separatorIndex;
        separatorIndex = this.historySeparatorIndex();
        results = [];
        while (this.numRows() && this.numRows() > separatorIndex) {
            results.push(this.removeRow(this.row(this.numRows() - 1)));
        }
        return results;
    };

    Shelf.prototype.onNavigateHistoryChanged = function(filePositions, currentIndex) {
        if (this.showHistory) {
            return this.setHistoryItems(filePositions);
        }
    };

    Shelf.prototype.onNavigateIndexChanged = function(currentIndex, currentItem) {
        var ref1, ref2, reverseIndex;
        if (this.showHistory) {
            reverseIndex = this.numRows() - currentIndex - 1;
            if (currentItem.file !== ((ref1 = this.activeRow()) != null ? ref1.item.file : void 0)) {
                return (ref2 = this.row(reverseIndex)) != null ? ref2.setActive() : void 0;
            }
        }
    };

    Shelf.prototype.loadHistory = function() {
        return this.setHistoryItems(post.get('navigate', 'filePositions'));
    };

    Shelf.prototype.setHistoryItems = function(items) {
        this.removeHistory();
        items.map(function(h) {
            h.type = 'file';
            return h.text = slash.removeColumn(h.text);
        });
        items.reverse();
        items.unshift({
            type: 'historySeparator',
            icon: 'history-icon'
        });
        return this.addItems(items);
    };

    Shelf.prototype.onFocus = function() {
        window.setLastFocus('shelf');
        this.div.classList.add('focus');
        if (this.browser.shelfSize < 200) {
            return this.browser.setShelfSize(200);
        }
    };

    Shelf.prototype.onMouseOver = function(event) {
        var ref1;
        return (ref1 = this.row(event.target)) != null ? ref1.onMouseOver() : void 0;
    };

    Shelf.prototype.onMouseOut = function(event) {
        var ref1;
        return (ref1 = this.row(event.target)) != null ? ref1.onMouseOut() : void 0;
    };

    Shelf.prototype.onClick = function(event) {
        var ref1;
        return (ref1 = this.row(event.target)) != null ? ref1.activate(event) : void 0;
    };

    Shelf.prototype.onDblClick = function(event) {
        return this.navigateCols('enter');
    };

    Shelf.prototype.navigateRows = function(key) {
        var index, navigate, ref1, ref2, ref3;
        if (!this.numRows()) {
            return kerror("no rows in column " + this.index + "?");
        }
        index = (ref1 = (ref2 = this.activeRow()) != null ? ref2.index() : void 0) != null ? ref1 : -1;
        if ((index == null) || Number.isNaN(index)) {
            kerror("no index from activeRow? " + index + "?", this.activeRow());
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
                    return this.items.length;
                case 'page up':
                    return index - this.numVisible();
                case 'page down':
                    return clamp(0, this.items.length, index + this.numVisible());
                default:
                    return index;
            }
        }).call(this);
        if ((index == null) || Number.isNaN(index)) {
            kerror("no index " + index + "? " + (this.numVisible()));
        }
        index = clamp(0, this.numRows() - 1, index);
        if (((ref3 = this.rows[index]) != null ? ref3.activate : void 0) == null) {
            kerror("no row at index " + index + "/" + (this.numRows() - 1) + "?", this.numRows());
        }
        navigate = (function(_this) {
            return function(action) {
                _this.navigatingRows = true;
                return post.emit('menuAction', action);
            };
        })(this);
        if (key === 'up' && index > this.items.length) {
            return navigate('Navigate Forward');
        } else if (key === 'down' && index > this.items.length + 1) {
            return navigate('Navigate Backward');
        } else {
            return this.rows[index].activate();
        }
    };

    Shelf.prototype.openFileInNewWindow = function() {
        var item, ref1;
        if (item = (ref1 = this.activeRow()) != null ? ref1.item : void 0) {
            if (item.type === 'file' && item.textFile) {
                window.openFiles([item.file], {
                    newWindow: true
                });
            }
        }
        return this;
    };

    Shelf.prototype.removeObject = function() {
        var nextOrPrev, ref1, row;
        if (row = this.activeRow()) {
            if (this.showHistory) {
                if (row.item.type === 'historySeparator') {
                    this.toggleHistory();
                    return;
                }
                if (row.index() > this.historySeparatorIndex()) {
                    window.navigate.delFilePos(row.item);
                }
            }
            nextOrPrev = (ref1 = row.next()) != null ? ref1 : row.prev();
            row.div.remove();
            this.items.splice(row.index(), 1);
            this.rows.splice(row.index(), 1);
            if (nextOrPrev != null) {
                nextOrPrev.activate();
            }
            this.savePrefs();
        }
        return this;
    };

    Shelf.prototype.showContextMenu = function(absPos) {
        var opt;
        if (absPos == null) {
            absPos = pos(this.view.getBoundingClientRect().left, this.view.getBoundingClientRect().top);
        }
        opt = {
            items: [
                {
                    text: 'Toggle History',
                    combo: 'alt+h',
                    cb: this.toggleHistory
                }, {
                    text: 'Toggle Extensions',
                    combo: 'ctrl+e',
                    cb: this.toggleExtensions
                }, {
                    text: 'Remove',
                    combo: 'backspace',
                    cb: this.removeObject
                }, {
                    text: 'Clear History',
                    cb: this.clearHistory
                }
            ]
        };
        opt.x = absPos.x;
        opt.y = absPos.y;
        return popup.menu(opt);
    };

    Shelf.prototype.onKey = function(event) {
        var char, combo, key, mod, ref1;
        ref1 = keyinfo.forEvent(event), mod = ref1.mod, key = ref1.key, combo = ref1.combo, char = ref1.char;
        switch (combo) {
            case 'command+enter':
            case 'ctrl+enter':
                return this.openFileInNewWindow();
            case 'backspace':
            case 'delete':
                return stopEvent(event, this.clearSearch().removeObject());
            case 'command+k':
            case 'ctrl+k':
                if (this.browser.cleanUp()) {
                    return stopEvent(event);
                }
                break;
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
        switch (key) {
            case 'up':
            case 'down':
            case 'page up':
            case 'page down':
            case 'home':
            case 'end':
                return stopEvent(event, this.navigateRows(key));
            case 'right':
            case 'enter':
                return stopEvent(event, this.focusBrowser());
        }
        switch (char) {
            case '~':
            case '/':
                return stopEvent(event, this.navigateRoot(char));
        }
        if ((mod === 'shift' || mod === '') && char) {
            this.doSearch(char);
        }
        if (key === 'left') {
            return stopEvent(event);
        }
    };

    return Shelf;

})(Column);

module.exports = Shelf;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGYuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLG9JQUFBO0lBQUE7Ozs7QUFRQSxNQUE0RixPQUFBLENBQVEsS0FBUixDQUE1RixFQUFFLHlCQUFGLEVBQWEscUJBQWIsRUFBc0IsaUJBQXRCLEVBQTZCLGVBQTdCLEVBQW1DLGlCQUFuQyxFQUEwQyxlQUExQyxFQUFnRCxpQkFBaEQsRUFBdUQsaUJBQXZELEVBQThELGlCQUE5RCxFQUFxRSxlQUFyRSxFQUEyRSxtQkFBM0UsRUFBbUYsU0FBbkYsRUFBc0Y7O0FBRXRGLEdBQUEsR0FBVyxPQUFBLENBQVEsT0FBUjs7QUFDWCxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBQ1gsTUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsT0FBUjs7QUFDWCxHQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBRUw7OztJQUVXLGVBQUMsT0FBRDs7Ozs7Ozs7Ozs7Ozs7OztRQUVULHVDQUFNLE9BQU47UUFFQSxJQUFDLENBQUEsS0FBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLEtBQUQsR0FBVSxDQUFDO1FBQ1gsSUFBQyxDQUFBLEdBQUcsQ0FBQyxFQUFMLEdBQVU7UUFFVixJQUFDLENBQUEsV0FBRCxHQUFlLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBYixDQUFpQixlQUFqQixFQUFpQyxJQUFqQztRQUVmLElBQUksQ0FBQyxFQUFMLENBQVEsV0FBUixFQUFpQyxJQUFDLENBQUEsYUFBbEM7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFlBQVIsRUFBaUMsSUFBQyxDQUFBLE9BQWxDO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSx3QkFBUixFQUFpQyxJQUFDLENBQUEsd0JBQWxDO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxzQkFBUixFQUFpQyxJQUFDLENBQUEsc0JBQWxDO1FBRUEs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QUFELENBQWMsSUFBZCxDQUFqQjtBQUQ5QjtRQUdBLElBQUcsQ0FBQSxHQUFBLEtBQVEsT0FBUixJQUFBLEdBQUEsS0FBaUIsRUFBakIsQ0FBQSxJQUF5QixJQUE1QjtZQUFzQyxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsRUFBdEM7O1FBRUEsSUFBRyxHQUFBLEtBQVEsTUFBWDtBQUF3QixtQkFBTyxTQUFBLENBQVUsS0FBVixFQUEvQjs7SUEzQkc7Ozs7R0F0WVM7O0FBbWFwQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICBcbjAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAgIFxuICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICBcbiMjI1xuXG57IHN0b3BFdmVudCwga2V5aW5mbywgc2xhc2gsIHBvc3QsIHBvcHVwLCBlbGVtLCBjbGFtcCwgZW1wdHksIGZpcnN0LCBsYXN0LCBrZXJyb3IsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuUm93ICAgICAgPSByZXF1aXJlICcuL3JvdydcblNjcm9sbGVyID0gcmVxdWlyZSAnLi9zY3JvbGxlcidcbkNvbHVtbiAgID0gcmVxdWlyZSAnLi9jb2x1bW4nXG5mdXp6eSAgICA9IHJlcXVpcmUgJ2Z1enp5J1xuaHViICAgICAgPSByZXF1aXJlICcuLi9naXQvaHViJ1xuICAgIFxuY2xhc3MgU2hlbGYgZXh0ZW5kcyBDb2x1bW5cblxuICAgIGNvbnN0cnVjdG9yOiAoYnJvd3NlcikgLT5cblxuICAgICAgICBzdXBlciBicm93c2VyXG4gICAgICAgIFxuICAgICAgICBAaXRlbXMgID0gW11cbiAgICAgICAgQGluZGV4ICA9IC0xXG4gICAgICAgIEBkaXYuaWQgPSAnc2hlbGYnXG4gICAgICAgIFxuICAgICAgICBAc2hvd0hpc3RvcnkgPSB3aW5kb3cuc3Rhc2guZ2V0ICdzaGVsZnxoaXN0b3J5JyB0cnVlXG5cbiAgICAgICAgcG9zdC5vbiAnZ2l0U3RhdHVzJyAgICAgICAgICAgICAgQGxvYWRHaXRTdGF0dXNcbiAgICAgICAgcG9zdC5vbiAnYWRkVG9TaGVsZicgICAgICAgICAgICAgQGFkZFBhdGhcbiAgICAgICAgcG9zdC5vbiAnbmF2aWdhdGVIaXN0b3J5Q2hhbmdlZCcgQG9uTmF2aWdhdGVIaXN0b3J5Q2hhbmdlZFxuICAgICAgICBwb3N0Lm9uICduYXZpZ2F0ZUluZGV4Q2hhbmdlZCcgICBAb25OYXZpZ2F0ZUluZGV4Q2hhbmdlZFxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnZmlsZScgQG9uRmlsZVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICBcbiAgIFxuICAgIGFjdGl2YXRlUm93OiAocm93KSAtPiBcbiAgICAgICAgXG4gICAgICAgIGl0ZW0gPSByb3cuaXRlbVxuICAgICAgICBcbiAgICAgICAgaWYgaXRlbS50eXBlID09ICdoaXN0b3J5U2VwYXJhdG9yJ1xuICAgICAgICAgICAgcm93LnNldEFjdGl2ZSBlbWl0OmZhbHNlXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgICQoJy5ob3ZlcicpPy5jbGFzc0xpc3QucmVtb3ZlICdob3ZlcidcbiAgICAgICAgcm93LnNldEFjdGl2ZSBlbWl0OnRydWVcbiAgICAgICAgXG4gICAgICAgIGlmIGl0ZW0udHlwZSA9PSAnZmlsZSdcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvRmlsZScsIGl0ZW1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdmaWxlYnJvd3NlcicsICdsb2FkSXRlbScsIGl0ZW1cbiAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgb25GaWxlOiAoZmlsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBmaWxlXG4gICAgICAgIGlmIEBuYXZpZ2F0aW5nUm93c1xuICAgICAgICAgICAgZGVsZXRlIEBuYXZpZ2F0aW5nUm93c1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBmb3IgaW5kZXggaW4gWzAuLi5AaXRlbXMubGVuZ3RoXVxuICAgICAgICAgICAgaWYgQGl0ZW1zW2luZGV4XS5maWxlID09IGZpbGVcbiAgICAgICAgICAgICAgICBAcm93c1tpbmRleF0uc2V0QWN0aXZlKClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIG1hdGNoZXMgPSBbXVxuICAgICAgICBmb3IgaW5kZXgsaXRlbSBvZiBAaXRlbXNcbiAgICAgICAgICAgIGlmIGZpbGU/LnN0YXJ0c1dpdGggaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgbWF0Y2hlcy5wdXNoIFtpbmRleCwgaXRlbV1cblxuICAgICAgICBpZiBub3QgZW1wdHkgbWF0Y2hlc1xuICAgICAgICAgICAgbWF0Y2hlcy5zb3J0IChhLGIpIC0+IGJbMV0uZmlsZS5sZW5ndGggLSBhWzFdLmZpbGUubGVuZ3RoXG4gICAgICAgICAgICBbaW5kZXgsIGl0ZW1dID0gZmlyc3QgbWF0Y2hlc1xuICAgICAgICAgICAgQHJvd3NbaW5kZXhdLnNldEFjdGl2ZSgpXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIGJyb3dzZXJEaWRJbml0Q29sdW1uczogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBAZGlkSW5pdFxuICAgICAgICBcbiAgICAgICAgQGRpZEluaXQgPSB0cnVlXG4gICAgICAgIFxuICAgICAgICBAbG9hZFNoZWxmSXRlbXMoKVxuICAgICAgICBcbiAgICAgICAgQGxvYWRIaXN0b3J5KCkgaWYgQHNob3dIaXN0b3J5XG4gICAgICAgIFxuICAgICAgICBAbG9hZEdpdFN0YXR1cygpXG4gICAgICAgICAgICAgICAgXG4gICAgbG9hZFNoZWxmSXRlbXM6IC0+XG4gICAgICAgIFxuICAgICAgICBpdGVtcyA9IHdpbmRvdy5zdGF0ZS5nZXQgXCJzaGVsZnxpdGVtc1wiXG4gICAgICAgIEBzZXRJdGVtcyBpdGVtcywgc2F2ZTpmYWxzZVxuICAgICAgICAgICAgICAgIFxuICAgIGFkZFBhdGg6IChwYXRoLCBvcHQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBzbGFzaC5pc0RpciBwYXRoXG4gICAgICAgICAgICBAYWRkRGlyIHBhdGgsIG9wdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAYWRkRmlsZSBwYXRoLCBvcHRcbiAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcblxuICAgIGl0ZW1QYXRoczogLT4gQHJvd3MubWFwIChyKSAtPiByLnBhdGgoKVxuICAgIFxuICAgIHNhdmVQcmVmczogLT4gXG4gICAgICAgIHdpbmRvdy5zdGF0ZS5zZXQgXCJzaGVsZnxpdGVtc1wiLCBAaXRlbXNcbiAgICBcbiAgICBzZXRJdGVtczogKEBpdGVtcywgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgQGNsZWFyKClcbiAgICAgICAgXG4gICAgICAgIEBpdGVtcyA/PSBbXVxuICAgICAgICBAYWRkSXRlbXMgQGl0ZW1zXG4gICAgICAgIFxuICAgICAgICBpZiBvcHQ/LnNhdmUgIT0gZmFsc2VcbiAgICAgICAgICAgIEBzYXZlUHJlZnMoKSAgICAgICAgICAgIFxuICAgICAgICBAXG4gICAgICAgIFxuICAgIGFkZEl0ZW1zOiAoaXRlbXMsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBpdGVtc1xuICAgICAgICBcbiAgICAgICAgZm9yIGl0ZW0gaW4gaXRlbXNcbiAgICAgICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgICAgICBcbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgIGFkZERpcjogKGRpciwgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgaXRlbSA9IFxuICAgICAgICAgICAgbmFtZTogc2xhc2guZmlsZSBzbGFzaC50aWxkZSBkaXJcbiAgICAgICAgICAgIHR5cGU6ICdkaXInXG4gICAgICAgICAgICBmaWxlOiBzbGFzaC5wYXRoIGRpclxuICAgICAgICBcbiAgICAgICAgQGFkZEl0ZW0gaXRlbSwgb3B0XG5cbiAgICBhZGRGaWxlOiAoZmlsZSwgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgaXRlbSA9IFxuICAgICAgICAgICAgbmFtZTogc2xhc2guZmlsZSBmaWxlXG4gICAgICAgICAgICB0eXBlOiAnZmlsZSdcbiAgICAgICAgICAgIGZpbGU6IHNsYXNoLnBhdGggZmlsZVxuICAgICAgICBpdGVtLnRleHRGaWxlID0gdHJ1ZSBpZiBzbGFzaC5pc1RleHQgZmlsZVxuICAgICAgICBAYWRkSXRlbSBpdGVtLCBvcHRcbiAgICAgICAgXG4gICAgYWRkSXRlbTogIChpdGVtLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBfLnB1bGxBbGxXaXRoIEBpdGVtcywgW2l0ZW1dLCBfLmlzRXF1YWwgIyByZW1vdmUgaXRlbSBpZiBvbiBzaGVsZiBhbHJlYWR5XG4gICAgICAgIFxuICAgICAgICBpZiBvcHQ/LnBvc1xuICAgICAgICAgICAgaW5kZXggPSBAcm93SW5kZXhBdFBvcyBvcHQucG9zXG4gICAgICAgICAgICBAaXRlbXMuc3BsaWNlIE1hdGgubWluKGluZGV4LCBAaXRlbXMubGVuZ3RoKSwgMCwgaXRlbVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaXRlbXMucHVzaCBpdGVtXG4gICAgICAgICAgICBcbiAgICAgICAgQHNldEl0ZW1zIEBpdGVtc1xuICAgICAgICBAbG9hZEhpc3RvcnkoKSBpZiBAc2hvd0hpc3RvcnlcbiAgICAgICAgQGxvYWRHaXRTdGF0dXMoKVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgZHJvcFJvdzogKHJvdywgcG9zKSAtPiBAYWRkSXRlbSByb3cuaXRlbSwgcG9zOnBvc1xuICAgICAgICAgICAgXG4gICAgaXNFbXB0eTogLT4gZW1wdHkgQHJvd3NcbiAgICBcbiAgICBjbGVhcjogLT5cbiAgICAgICAgXG4gICAgICAgIEBjbGVhclNlYXJjaCgpXG4gICAgICAgIEBkaXYuc2Nyb2xsVG9wID0gMFxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgQHJvd3MgPSBbXVxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIG5hbWU6IC0+ICdzaGVsZidcblxuICAgICMgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBsb2FkR2l0U3RhdHVzOiA9PlxuICAgICAgICBcbiAgICAgICAgZm9yIHJvdyBpbiBAcm93c1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAkKCcuYnJvd3NlclN0YXR1c0ljb24nLCByb3cuZGl2KT8ucmVtb3ZlKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZmlsZVN0YXR1cyA9IChyb3cpIC0+IChzdGF0dXMpID0+XG4gICAgICAgICAgICAgICAgZm9yIGZpbGUsIHN0YXR1cyBvZiBodWIuc3RhdHVzRmlsZXMgc3RhdHVzXG4gICAgICAgICAgICAgICAgICAgIGlmIGZpbGUuc3RhcnRzV2l0aCByb3cucGF0aCgpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiByb3cuaXRlbS50eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzID0gJ2RpcnMnXG4gICAgICAgICAgICAgICAgICAgICAgICByb3cuZGl2LmFwcGVuZENoaWxkIGVsZW0gJ3NwYW4nLCBjbGFzczpcImdpdC0je3N0YXR1c30taWNvbiBicm93c2VyU3RhdHVzSWNvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBodWIuc3RhdHVzIHJvdy5wYXRoKCksIGZpbGVTdGF0dXMgcm93XG5cbiAgICB1cGRhdGVHaXRGaWxlczogLT4gQGxvYWRHaXRTdGF0dXMoKVxuICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHRvZ2dsZUhpc3Rvcnk6ID0+XG4gICAgICAgIFxuICAgICAgICBAc2hvd0hpc3RvcnkgPSBub3QgQHNob3dIaXN0b3J5XG4gICAgICAgIGlmIEBzaG93SGlzdG9yeVxuICAgICAgICAgICAgQGxvYWRIaXN0b3J5KClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHJlbW92ZUhpc3RvcnkoKVxuICAgICAgICB3aW5kb3cuc3Rhc2guc2V0ICdzaGVsZnxoaXN0b3J5JyBAc2hvd0hpc3RvcnlcbiAgICAgICAgd2luZG93LnN0YXNoLnNldCAnc2hlbGZ8aGlzdG9yeScgQHNob3dIaXN0b3J5XG4gICAgY2xlYXJIaXN0b3J5OiA9PlxuICAgICAgICBcbiAgICAgICAgd2luZG93Lm5hdmlnYXRlLmNsZWFyKClcbiAgICAgICAgaWYgQHNob3dIaXN0b3J5IHRoZW4gQHNldEhpc3RvcnlJdGVtcyBbXG4gICAgICAgICAgICBmaWxlOiAgIHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgICAgIHBvczogICAgd2luZG93LmVkaXRvci5tYWluQ3Vyc29yKClcbiAgICAgICAgICAgIHRleHQ6ICAgc2xhc2guZmlsZSB3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgaGlzdG9yeVNlcGFyYXRvckluZGV4OiAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5AbnVtUm93cygpXVxuICAgICAgICAgICAgaWYgQHJvdyhpKS5pdGVtLnR5cGUgPT0gJ2hpc3RvcnlTZXBhcmF0b3InXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlcbiAgICAgICAgcmV0dXJuIEBudW1Sb3dzKClcbiAgICAgICAgXG4gICAgcmVtb3ZlSGlzdG9yeTogLT5cbiAgICAgICAgXG4gICAgICAgIHNlcGFyYXRvckluZGV4ID0gQGhpc3RvcnlTZXBhcmF0b3JJbmRleCgpXG4gICAgICAgIHdoaWxlIEBudW1Sb3dzKCkgYW5kIEBudW1Sb3dzKCkgPiBzZXBhcmF0b3JJbmRleFxuICAgICAgICAgICAgQHJlbW92ZVJvdyBAcm93KEBudW1Sb3dzKCktMSlcblxuICAgIG9uTmF2aWdhdGVIaXN0b3J5Q2hhbmdlZDogKGZpbGVQb3NpdGlvbnMsIGN1cnJlbnRJbmRleCkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBzaG93SGlzdG9yeVxuICAgICAgICAgICAgQHNldEhpc3RvcnlJdGVtcyBmaWxlUG9zaXRpb25zXG5cbiAgICBvbk5hdmlnYXRlSW5kZXhDaGFuZ2VkOiAoY3VycmVudEluZGV4LCBjdXJyZW50SXRlbSkgPT5cblxuICAgICAgICBpZiBAc2hvd0hpc3RvcnlcbiAgICAgICAgICAgIHJldmVyc2VJbmRleCA9IEBudW1Sb3dzKCkgLSBjdXJyZW50SW5kZXggLSAxXG4gICAgICAgICAgICBpZiBjdXJyZW50SXRlbS5maWxlICE9IEBhY3RpdmVSb3coKT8uaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgQHJvdyhyZXZlcnNlSW5kZXgpPy5zZXRBY3RpdmUoKVxuICAgICAgICAgICAgXG4gICAgbG9hZEhpc3Rvcnk6IC0+XG4gICAgICAgIFxuICAgICAgICBAc2V0SGlzdG9yeUl0ZW1zIHBvc3QuZ2V0ICduYXZpZ2F0ZScsICdmaWxlUG9zaXRpb25zJ1xuXG4gICAgc2V0SGlzdG9yeUl0ZW1zOiAoaXRlbXMpIC0+XG4gICAgXG4gICAgICAgIEByZW1vdmVIaXN0b3J5KClcbiAgICAgICAgXG4gICAgICAgIGl0ZW1zLm1hcCAoaCkgLT4gXG4gICAgICAgICAgICBoLnR5cGUgPSAnZmlsZSdcbiAgICAgICAgICAgIGgudGV4dCA9IHNsYXNoLnJlbW92ZUNvbHVtbiBoLnRleHRcbiAgICAgICAgaXRlbXMucmV2ZXJzZSgpXG4gICAgICAgIFxuICAgICAgICBpdGVtcy51bnNoaWZ0XG4gICAgICAgICAgICB0eXBlOiAnaGlzdG9yeVNlcGFyYXRvcidcbiAgICAgICAgICAgIGljb246ICdoaXN0b3J5LWljb24nXG4gICAgICAgIFxuICAgICAgICBAYWRkSXRlbXMgaXRlbXNcbiAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIG9uRm9jdXM6ID0+IFxuXG4gICAgICAgIHdpbmRvdy5zZXRMYXN0Rm9jdXMgJ3NoZWxmJ1xuICAgICAgICBAZGl2LmNsYXNzTGlzdC5hZGQgJ2ZvY3VzJ1xuICAgICAgICBpZiBAYnJvd3Nlci5zaGVsZlNpemUgPCAyMDBcbiAgICAgICAgICAgIEBicm93c2VyLnNldFNoZWxmU2l6ZSAyMDBcbiAgICAgICAgXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBvbk1vdXNlT3ZlcjogKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/Lm9uTW91c2VPdmVyKClcbiAgICBvbk1vdXNlT3V0OiAgKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/Lm9uTW91c2VPdXQoKVxuICAgIG9uQ2xpY2s6ICAgICAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8uYWN0aXZhdGUgZXZlbnRcbiAgICBvbkRibENsaWNrOiAgKGV2ZW50KSA9PiBAbmF2aWdhdGVDb2xzICdlbnRlcidcblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcblxuICAgIG5hdmlnYXRlUm93czogKGtleSkgLT5cblxuICAgICAgICByZXR1cm4ga2Vycm9yIFwibm8gcm93cyBpbiBjb2x1bW4gI3tAaW5kZXh9P1wiIGlmIG5vdCBAbnVtUm93cygpXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gLTFcbiAgICAgICAga2Vycm9yIFwibm8gaW5kZXggZnJvbSBhY3RpdmVSb3c/ICN7aW5kZXh9P1wiLCBAYWN0aXZlUm93KCkgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAndXAnICAgICAgICB0aGVuIGluZGV4LTFcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nICAgICAgdGhlbiBpbmRleCsxXG4gICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gMFxuICAgICAgICAgICAgd2hlbiAnZW5kJyAgICAgICB0aGVuIEBpdGVtcy5sZW5ndGhcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICAgdGhlbiBpbmRleC1AbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gY2xhbXAgMCwgQGl0ZW1zLmxlbmd0aCwgaW5kZXgrQG51bVZpc2libGUoKVxuICAgICAgICAgICAgZWxzZSBpbmRleFxuICAgICAgICAgICAgXG4gICAgICAgIGtlcnJvciBcIm5vIGluZGV4ICN7aW5kZXh9PyAje0BudW1WaXNpYmxlKCl9XCIgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXggICAgICAgIFxuICAgICAgICBpbmRleCA9IGNsYW1wIDAsIEBudW1Sb3dzKCktMSwgaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGtlcnJvciBcIm5vIHJvdyBhdCBpbmRleCAje2luZGV4fS8je0BudW1Sb3dzKCktMX0/XCIsIEBudW1Sb3dzKCkgaWYgbm90IEByb3dzW2luZGV4XT8uYWN0aXZhdGU/XG5cbiAgICAgICAgbmF2aWdhdGUgPSAoYWN0aW9uKSA9PlxuICAgICAgICAgICAgQG5hdmlnYXRpbmdSb3dzID0gdHJ1ZVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdtZW51QWN0aW9uJywgYWN0aW9uXG4gICAgICAgIFxuICAgICAgICBpZiAgICAgIGtleSA9PSAndXAnICAgYW5kIGluZGV4ID4gQGl0ZW1zLmxlbmd0aCAgICAgdGhlbiBuYXZpZ2F0ZSAnTmF2aWdhdGUgRm9yd2FyZCdcbiAgICAgICAgZWxzZSBpZiBrZXkgPT0gJ2Rvd24nIGFuZCBpbmRleCA+IEBpdGVtcy5sZW5ndGggKyAxIHRoZW4gbmF2aWdhdGUgJ05hdmlnYXRlIEJhY2t3YXJkJ1xuICAgICAgICBlbHNlIEByb3dzW2luZGV4XS5hY3RpdmF0ZSgpXG4gICAgXG4gICAgb3BlbkZpbGVJbk5ld1dpbmRvdzogLT4gIFxuICAgICAgICBcbiAgICAgICAgaWYgaXRlbSA9IEBhY3RpdmVSb3coKT8uaXRlbVxuICAgICAgICAgICAgaWYgaXRlbS50eXBlID09ICdmaWxlJyBhbmQgaXRlbS50ZXh0RmlsZVxuICAgICAgICAgICAgICAgIHdpbmRvdy5vcGVuRmlsZXMgW2l0ZW0uZmlsZV0sIG5ld1dpbmRvdzogdHJ1ZVxuICAgICAgICBAXG4gICAgXG4gICAgcmVtb3ZlT2JqZWN0OiA9PlxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiByb3cgPSBAYWN0aXZlUm93KClcbiAgICAgICAgICAgIGlmIEBzaG93SGlzdG9yeVxuICAgICAgICAgICAgICAgIGlmIHJvdy5pdGVtLnR5cGUgPT0gJ2hpc3RvcnlTZXBhcmF0b3InXG4gICAgICAgICAgICAgICAgICAgIEB0b2dnbGVIaXN0b3J5KClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgaWYgcm93LmluZGV4KCkgPiBAaGlzdG9yeVNlcGFyYXRvckluZGV4KClcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lm5hdmlnYXRlLmRlbEZpbGVQb3Mgcm93Lml0ZW1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIG5leHRPclByZXYgPSByb3cubmV4dCgpID8gcm93LnByZXYoKVxuICAgICAgICAgICAgcm93LmRpdi5yZW1vdmUoKVxuICAgICAgICAgICAgQGl0ZW1zLnNwbGljZSByb3cuaW5kZXgoKSwgMVxuICAgICAgICAgICAgQHJvd3Muc3BsaWNlIHJvdy5pbmRleCgpLCAxXG4gICAgICAgICAgICBuZXh0T3JQcmV2Py5hY3RpdmF0ZSgpXG4gICAgICAgICAgICBAc2F2ZVByZWZzKClcbiAgICAgICAgQFxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgXG4gICAgXG4gICAgc2hvd0NvbnRleHRNZW51OiAoYWJzUG9zKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGFic1Bvcz9cbiAgICAgICAgICAgIGFic1BvcyA9IHBvcyBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0LCBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3BcbiAgICAgICAgXG4gICAgICAgIG9wdCA9IGl0ZW1zOiBbIFxuICAgICAgICAgICAgdGV4dDogICAnVG9nZ2xlIEhpc3RvcnknXG4gICAgICAgICAgICBjb21ibzogICdhbHQraCcgXG4gICAgICAgICAgICBjYjogICAgIEB0b2dnbGVIaXN0b3J5XG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ1RvZ2dsZSBFeHRlbnNpb25zJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQHRvZ2dsZUV4dGVuc2lvbnNcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnUmVtb3ZlJ1xuICAgICAgICAgICAgY29tYm86ICAnYmFja3NwYWNlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQHJlbW92ZU9iamVjdFxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdDbGVhciBIaXN0b3J5J1xuICAgICAgICAgICAgY2I6ICAgICBAY2xlYXJIaXN0b3J5XG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgb3B0LnkgPSBhYnNQb3MueVxuICAgICAgICBwb3B1cC5tZW51IG9wdFxuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIG9uS2V5OiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciB9ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2VudGVyJywgJ2N0cmwrZW50ZXInIHRoZW4gcmV0dXJuIEBvcGVuRmlsZUluTmV3V2luZG93KClcbiAgICAgICAgICAgIHdoZW4gJ2JhY2tzcGFjZScsICdkZWxldGUnIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGNsZWFyU2VhcmNoKCkucmVtb3ZlT2JqZWN0KClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQraycsICdjdHJsK2snIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCBpZiBAYnJvd3Nlci5jbGVhblVwKClcbiAgICAgICAgICAgIHdoZW4gJ3RhYicgICAgXG4gICAgICAgICAgICAgICAgaWYgQHNlYXJjaC5sZW5ndGggdGhlbiBAZG9TZWFyY2ggJydcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICB3aGVuICdlc2MnXG4gICAgICAgICAgICAgICAgaWYgQHNlYXJjaC5sZW5ndGggdGhlbiBAY2xlYXJTZWFyY2goKVxuICAgICAgICAgICAgICAgIGVsc2Ugd2luZG93LnNwbGl0LmZvY3VzICdjb21tYW5kbGluZS1lZGl0b3InXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudFxuXG4gICAgICAgIHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ3VwJywgJ2Rvd24nLCAncGFnZSB1cCcsICdwYWdlIGRvd24nLCAnaG9tZScsICdlbmQnIFxuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvd3Mga2V5XG4gICAgICAgICAgICB3aGVuICdyaWdodCcsICdlbnRlcidcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAZm9jdXNCcm93c2VyKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNoYXJcbiAgICAgICAgICAgIHdoZW4gJ34nLCAnLycgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb290IGNoYXJcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBtb2QgaW4gWydzaGlmdCcsICcnXSBhbmQgY2hhciB0aGVuIEBkb1NlYXJjaCBjaGFyXG4gICAgICAgIFxuICAgICAgICBpZiBrZXkgaW4gWydsZWZ0J10gdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBTaGVsZlxuIl19
//# sourceURL=../../coffee/browser/shelf.coffee