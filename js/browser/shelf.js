// koffee 0.56.0

/*
 0000000  000   000  00000000  000      00000000
000       000   000  000       000      000     
0000000   000000000  0000000   000      000000  
     000  000   000  000       000      000     
0000000   000   000  00000000  0000000  000
 */
var $, Column, Row, Scroller, Shelf, _, clamp, elem, empty, first, fuzzy, hub, indexAndItemInItemsWithFunc, kerror, keyinfo, last, popup, post, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), stopEvent = ref.stopEvent, keyinfo = ref.keyinfo, slash = ref.slash, post = ref.post, popup = ref.popup, elem = ref.elem, clamp = ref.clamp, empty = ref.empty, first = ref.first, last = ref.last, kerror = ref.kerror, $ = ref.$, _ = ref._;

Row = require('./row');

Scroller = require('./scroller');

Column = require('./column');

fuzzy = require('fuzzy');

hub = require('../git/hub');

indexAndItemInItemsWithFunc = function(item, items, withFunc) {
    var index, j, ref1;
    for (index = j = 0, ref1 = items.length; 0 <= ref1 ? j < ref1 : j > ref1; index = 0 <= ref1 ? ++j : --j) {
        if (withFunc(items[index], item)) {
            return [index, items[index]];
        }
    }
    return [-1, null];
};

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
        this.showHistory = window.stash.get('shelf:history', false);
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
        var index, item, matches, ref1, ref2, ref3;
        if (empty(file)) {
            return;
        }
        ref1 = indexAndItemInItemsWithFunc(file, this.items, function(f, i) {
            return i.file === f;
        }), index = ref1[0], item = ref1[1];
        if (item) {
            this.rows[index].setActive();
            return;
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
        return window.stash.set('shelf:history', this.showHistory);
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
        var ref1, reverseIndex;
        if (this.showHistory) {
            reverseIndex = this.numRows() - currentIndex - 1;
            return (ref1 = this.row(reverseIndex)) != null ? ref1.setActive() : void 0;
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
        var index, ref1, ref2, ref3;
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
        if (key === 'up' && index > this.items.length) {
            return post.emit('menuAction', 'Navigate Forward');
        } else if (key === 'down' && index > this.items.length + 1) {
            return post.emit('menuAction', 'Navigate Backward');
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGYuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGlLQUFBO0lBQUE7Ozs7QUFRQSxNQUE0RixPQUFBLENBQVEsS0FBUixDQUE1RixFQUFFLHlCQUFGLEVBQWEscUJBQWIsRUFBc0IsaUJBQXRCLEVBQTZCLGVBQTdCLEVBQW1DLGlCQUFuQyxFQUEwQyxlQUExQyxFQUFnRCxpQkFBaEQsRUFBdUQsaUJBQXZELEVBQThELGlCQUE5RCxFQUFxRSxlQUFyRSxFQUEyRSxtQkFBM0UsRUFBbUYsU0FBbkYsRUFBc0Y7O0FBRXRGLEdBQUEsR0FBVyxPQUFBLENBQVEsT0FBUjs7QUFDWCxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBQ1gsTUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsT0FBUjs7QUFDWCxHQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBRVgsMkJBQUEsR0FBOEIsU0FBQyxJQUFELEVBQU8sS0FBUCxFQUFjLFFBQWQ7QUFFMUIsUUFBQTtBQUFBLFNBQWEsa0dBQWI7UUFDSSxJQUFHLFFBQUEsQ0FBUyxLQUFNLENBQUEsS0FBQSxDQUFmLEVBQXVCLElBQXZCLENBQUg7QUFDSSxtQkFBTyxDQUFDLEtBQUQsRUFBUSxLQUFNLENBQUEsS0FBQSxDQUFkLEVBRFg7O0FBREo7QUFHQSxXQUFPLENBQUMsQ0FBQyxDQUFGLEVBQUksSUFBSjtBQUxtQjs7QUFPeEI7OztJQUVXLGVBQUMsT0FBRDs7Ozs7Ozs7Ozs7Ozs7OztRQUVULHVDQUFNLE9BQU47UUFFQSxJQUFDLENBQUEsS0FBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLEtBQUQsR0FBVSxDQUFDO1FBQ1gsSUFBQyxDQUFBLEdBQUcsQ0FBQyxFQUFMLEdBQVU7UUFFVixJQUFDLENBQUEsV0FBRCxHQUFlLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBYixDQUFpQixlQUFq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QWlCLElBQUMsQ0FBQSxZQUFELENBQWMsSUFBZCxDQUFqQjtBQUQ5QjtRQUdBLElBQUcsQ0FBQSxHQUFBLEtBQVEsT0FBUixJQUFBLEdBQUEsS0FBaUIsRUFBakIsQ0FBQSxJQUF5QixJQUE1QjtZQUFzQyxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsRUFBdEM7O1FBRUEsSUFBRyxHQUFBLEtBQVEsTUFBWDtBQUF3QixtQkFBTyxTQUFBLENBQVUsS0FBVixFQUEvQjs7SUEzQkc7Ozs7R0E3WFM7O0FBMFpwQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICBcbjAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAgIFxuICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICBcbiMjI1xuXG57IHN0b3BFdmVudCwga2V5aW5mbywgc2xhc2gsIHBvc3QsIHBvcHVwLCBlbGVtLCBjbGFtcCwgZW1wdHksIGZpcnN0LCBsYXN0LCBrZXJyb3IsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuUm93ICAgICAgPSByZXF1aXJlICcuL3JvdydcblNjcm9sbGVyID0gcmVxdWlyZSAnLi9zY3JvbGxlcidcbkNvbHVtbiAgID0gcmVxdWlyZSAnLi9jb2x1bW4nXG5mdXp6eSAgICA9IHJlcXVpcmUgJ2Z1enp5J1xuaHViICAgICAgPSByZXF1aXJlICcuLi9naXQvaHViJ1xuXG5pbmRleEFuZEl0ZW1Jbkl0ZW1zV2l0aEZ1bmMgPSAoaXRlbSwgaXRlbXMsIHdpdGhGdW5jKSAtPlxuICAgIFxuICAgIGZvciBpbmRleCBpbiBbMC4uLml0ZW1zLmxlbmd0aF1cbiAgICAgICAgaWYgd2l0aEZ1bmMgaXRlbXNbaW5kZXhdLCBpdGVtXG4gICAgICAgICAgICByZXR1cm4gW2luZGV4LCBpdGVtc1tpbmRleF1dXG4gICAgcmV0dXJuIFstMSxudWxsXVxuICAgIFxuY2xhc3MgU2hlbGYgZXh0ZW5kcyBDb2x1bW5cblxuICAgIGNvbnN0cnVjdG9yOiAoYnJvd3NlcikgLT5cblxuICAgICAgICBzdXBlciBicm93c2VyXG4gICAgICAgIFxuICAgICAgICBAaXRlbXMgID0gW11cbiAgICAgICAgQGluZGV4ICA9IC0xXG4gICAgICAgIEBkaXYuaWQgPSAnc2hlbGYnXG4gICAgICAgIFxuICAgICAgICBAc2hvd0hpc3RvcnkgPSB3aW5kb3cuc3Rhc2guZ2V0ICdzaGVsZjpoaXN0b3J5JywgZmFsc2VcblxuICAgICAgICBwb3N0Lm9uICdnaXRTdGF0dXMnLCAgICAgICAgICAgICAgQGxvYWRHaXRTdGF0dXNcbiAgICAgICAgcG9zdC5vbiAnYWRkVG9TaGVsZicsICAgICAgICAgICAgIEBhZGRQYXRoXG4gICAgICAgIHBvc3Qub24gJ25hdmlnYXRlSGlzdG9yeUNoYW5nZWQnLCBAb25OYXZpZ2F0ZUhpc3RvcnlDaGFuZ2VkXG4gICAgICAgIHBvc3Qub24gJ25hdmlnYXRlSW5kZXhDaGFuZ2VkJywgICBAb25OYXZpZ2F0ZUluZGV4Q2hhbmdlZFxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnZmlsZScsIEBvbkZpbGVcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgXG4gICBcbiAgICBhY3RpdmF0ZVJvdzogKHJvdykgLT4gXG4gICAgICAgIFxuICAgICAgICBpdGVtID0gcm93Lml0ZW1cbiAgICAgICAgXG4gICAgICAgIGlmIGl0ZW0udHlwZSA9PSAnaGlzdG9yeVNlcGFyYXRvcidcbiAgICAgICAgICAgIHJvdy5zZXRBY3RpdmUgZW1pdDpmYWxzZVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICAkKCcuaG92ZXInKT8uY2xhc3NMaXN0LnJlbW92ZSAnaG92ZXInXG4gICAgICAgIHJvdy5zZXRBY3RpdmUgZW1pdDp0cnVlXG4gICAgICAgIFxuICAgICAgICBpZiBpdGVtLnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUb0ZpbGUnLCBpdGVtXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnZmlsZWJyb3dzZXInLCAnbG9hZEl0ZW0nLCBpdGVtXG4gICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgICAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG9uRmlsZTogKGZpbGUpID0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgZW1wdHkgZmlsZVxuICAgICAgICBcbiAgICAgICAgW2luZGV4LCBpdGVtXSA9IGluZGV4QW5kSXRlbUluSXRlbXNXaXRoRnVuYyBmaWxlLCBAaXRlbXMsIChmLGkpIC0+IGkuZmlsZSA9PSBmXG4gICAgICAgIGlmIGl0ZW1cbiAgICAgICAgICAgIEByb3dzW2luZGV4XS5zZXRBY3RpdmUoKVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgbWF0Y2hlcyA9IFtdXG4gICAgICAgIGZvciBpbmRleCxpdGVtIG9mIEBpdGVtc1xuICAgICAgICAgICAgaWYgZmlsZT8uc3RhcnRzV2l0aCBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICBtYXRjaGVzLnB1c2ggW2luZGV4LCBpdGVtXVxuXG4gICAgICAgIGlmIG5vdCBlbXB0eSBtYXRjaGVzXG4gICAgICAgICAgICBtYXRjaGVzLnNvcnQgKGEsYikgLT4gYlsxXS5maWxlLmxlbmd0aCAtIGFbMV0uZmlsZS5sZW5ndGhcbiAgICAgICAgICAgIFtpbmRleCwgaXRlbV0gPSBmaXJzdCBtYXRjaGVzXG4gICAgICAgICAgICBAcm93c1tpbmRleF0uc2V0QWN0aXZlKClcblxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgYnJvd3NlckRpZEluaXRDb2x1bW5zOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIEBkaWRJbml0XG4gICAgICAgIFxuICAgICAgICBAZGlkSW5pdCA9IHRydWVcbiAgICAgICAgXG4gICAgICAgIEBsb2FkU2hlbGZJdGVtcygpXG4gICAgICAgIFxuICAgICAgICBAbG9hZEhpc3RvcnkoKSBpZiBAc2hvd0hpc3RvcnlcbiAgICAgICAgXG4gICAgICAgIEBsb2FkR2l0U3RhdHVzKClcbiAgICAgICAgICAgICAgICBcbiAgICBsb2FkU2hlbGZJdGVtczogLT5cbiAgICAgICAgXG4gICAgICAgIGl0ZW1zID0gd2luZG93LnN0YXRlLmdldCBcInNoZWxmfGl0ZW1zXCJcbiAgICAgICAgQHNldEl0ZW1zIGl0ZW1zLCBzYXZlOmZhbHNlXG4gICAgICAgICAgICAgICAgXG4gICAgYWRkUGF0aDogKHBhdGgsIG9wdCkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmlzRGlyIHBhdGhcbiAgICAgICAgICAgIEBhZGREaXIgcGF0aCwgb3B0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBhZGRGaWxlIHBhdGgsIG9wdFxuICAgICAgICBcbiAgICAjIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG4gICAgaXRlbVBhdGhzOiAtPiBAcm93cy5tYXAgKHIpIC0+IHIucGF0aCgpXG4gICAgXG4gICAgc2F2ZVByZWZzOiAtPiBcbiAgICAgICAgd2luZG93LnN0YXRlLnNldCBcInNoZWxmfGl0ZW1zXCIsIEBpdGVtc1xuICAgIFxuICAgIHNldEl0ZW1zOiAoQGl0ZW1zLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBAY2xlYXIoKVxuICAgICAgICBcbiAgICAgICAgQGl0ZW1zID89IFtdXG4gICAgICAgIEBhZGRJdGVtcyBAaXRlbXNcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdD8uc2F2ZSAhPSBmYWxzZVxuICAgICAgICAgICAgQHNhdmVQcmVmcygpICAgICAgICAgICAgXG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgYWRkSXRlbXM6IChpdGVtcywgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGl0ZW1zXG4gICAgICAgIFxuICAgICAgICBmb3IgaXRlbSBpbiBpdGVtc1xuICAgICAgICAgICAgQHJvd3MucHVzaCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgICAgIFxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgYWRkRGlyOiAoZGlyLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBpdGVtID0gXG4gICAgICAgICAgICBuYW1lOiBzbGFzaC5maWxlIHNsYXNoLnRpbGRlIGRpclxuICAgICAgICAgICAgdHlwZTogJ2RpcidcbiAgICAgICAgICAgIGZpbGU6IHNsYXNoLnBhdGggZGlyXG4gICAgICAgIFxuICAgICAgICBAYWRkSXRlbSBpdGVtLCBvcHRcblxuICAgIGFkZEZpbGU6IChmaWxlLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBpdGVtID0gXG4gICAgICAgICAgICBuYW1lOiBzbGFzaC5maWxlIGZpbGVcbiAgICAgICAgICAgIHR5cGU6ICdmaWxlJ1xuICAgICAgICAgICAgZmlsZTogc2xhc2gucGF0aCBmaWxlXG4gICAgICAgIGl0ZW0udGV4dEZpbGUgPSB0cnVlIGlmIHNsYXNoLmlzVGV4dCBmaWxlXG4gICAgICAgIEBhZGRJdGVtIGl0ZW0sIG9wdFxuICAgICAgICBcbiAgICBhZGRJdGVtOiAgKGl0ZW0sIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIF8ucHVsbEFsbFdpdGggQGl0ZW1zLCBbaXRlbV0sIF8uaXNFcXVhbCAjIHJlbW92ZSBpdGVtIGlmIG9uIHNoZWxmIGFscmVhZHlcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdD8ucG9zXG4gICAgICAgICAgICBpbmRleCA9IEByb3dJbmRleEF0UG9zIG9wdC5wb3NcbiAgICAgICAgICAgIEBpdGVtcy5zcGxpY2UgTWF0aC5taW4oaW5kZXgsIEBpdGVtcy5sZW5ndGgpLCAwLCBpdGVtXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBpdGVtcy5wdXNoIGl0ZW1cbiAgICAgICAgICAgIFxuICAgICAgICBAc2V0SXRlbXMgQGl0ZW1zXG4gICAgICAgIEBsb2FkSGlzdG9yeSgpIGlmIEBzaG93SGlzdG9yeVxuICAgICAgICBAbG9hZEdpdFN0YXR1cygpXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBkcm9wUm93OiAocm93LCBwb3MpIC0+IEBhZGRJdGVtIHJvdy5pdGVtLCBwb3M6cG9zXG4gICAgICAgICAgICBcbiAgICBpc0VtcHR5OiAtPiBlbXB0eSBAcm93c1xuICAgIFxuICAgIGNsZWFyOiAtPlxuICAgICAgICBcbiAgICAgICAgQGNsZWFyU2VhcmNoKClcbiAgICAgICAgQGRpdi5zY3JvbGxUb3AgPSAwXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBAcm93cyA9IFtdXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgbmFtZTogLT4gJ3NoZWxmJ1xuXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIGxvYWRHaXRTdGF0dXM6ID0+XG4gICAgICAgIFxuICAgICAgICBmb3Igcm93IGluIEByb3dzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgICQoJy5icm93c2VyU3RhdHVzSWNvbicsIHJvdy5kaXYpPy5yZW1vdmUoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmaWxlU3RhdHVzID0gKHJvdykgLT4gKHN0YXR1cykgPT5cbiAgICAgICAgICAgICAgICBmb3IgZmlsZSwgc3RhdHVzIG9mIGh1Yi5zdGF0dXNGaWxlcyBzdGF0dXNcbiAgICAgICAgICAgICAgICAgICAgaWYgZmlsZS5zdGFydHNXaXRoIHJvdy5wYXRoKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHJvdy5pdGVtLnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXMgPSAnZGlycydcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvdy5kaXYuYXBwZW5kQ2hpbGQgZWxlbSAnc3BhbicsIGNsYXNzOlwiZ2l0LSN7c3RhdHVzfS1pY29uIGJyb3dzZXJTdGF0dXNJY29uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGh1Yi5zdGF0dXMgcm93LnBhdGgoKSwgZmlsZVN0YXR1cyByb3dcblxuICAgIHVwZGF0ZUdpdEZpbGVzOiAtPiBAbG9hZEdpdFN0YXR1cygpXG4gICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgdG9nZ2xlSGlzdG9yeTogPT5cbiAgICAgICAgXG4gICAgICAgIEBzaG93SGlzdG9yeSA9IG5vdCBAc2hvd0hpc3RvcnlcbiAgICAgICAgaWYgQHNob3dIaXN0b3J5XG4gICAgICAgICAgICBAbG9hZEhpc3RvcnkoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAcmVtb3ZlSGlzdG9yeSgpXG4gICAgICAgIHdpbmRvdy5zdGFzaC5zZXQgJ3NoZWxmOmhpc3RvcnknLCBAc2hvd0hpc3RvcnlcbiAgICBcbiAgICBjbGVhckhpc3Rvcnk6ID0+XG4gICAgICAgIFxuICAgICAgICB3aW5kb3cubmF2aWdhdGUuY2xlYXIoKVxuICAgICAgICBpZiBAc2hvd0hpc3RvcnkgdGhlbiBAc2V0SGlzdG9yeUl0ZW1zIFtcbiAgICAgICAgICAgIGZpbGU6ICAgd2luZG93LmVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgcG9zOiAgICB3aW5kb3cuZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICAgICAgdGV4dDogICBzbGFzaC5maWxlIHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgXVxuICAgICAgICBcbiAgICBoaXN0b3J5U2VwYXJhdG9ySW5kZXg6IC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgaSBpbiBbMC4uLkBudW1Sb3dzKCldXG4gICAgICAgICAgICBpZiBAcm93KGkpLml0ZW0udHlwZSA9PSAnaGlzdG9yeVNlcGFyYXRvcidcbiAgICAgICAgICAgICAgICByZXR1cm4gaVxuICAgICAgICByZXR1cm4gQG51bVJvd3MoKVxuICAgICAgICBcbiAgICByZW1vdmVIaXN0b3J5OiAtPlxuICAgICAgICBcbiAgICAgICAgc2VwYXJhdG9ySW5kZXggPSBAaGlzdG9yeVNlcGFyYXRvckluZGV4KClcbiAgICAgICAgd2hpbGUgQG51bVJvd3MoKSBhbmQgQG51bVJvd3MoKSA+IHNlcGFyYXRvckluZGV4XG4gICAgICAgICAgICBAcmVtb3ZlUm93IEByb3coQG51bVJvd3MoKS0xKVxuXG4gICAgb25OYXZpZ2F0ZUhpc3RvcnlDaGFuZ2VkOiAoZmlsZVBvc2l0aW9ucywgY3VycmVudEluZGV4KSA9PlxuICAgICAgICBpZiBAc2hvd0hpc3RvcnlcbiAgICAgICAgICAgIEBzZXRIaXN0b3J5SXRlbXMgZmlsZVBvc2l0aW9uc1xuXG4gICAgb25OYXZpZ2F0ZUluZGV4Q2hhbmdlZDogKGN1cnJlbnRJbmRleCwgY3VycmVudEl0ZW0pID0+XG5cbiAgICAgICAgaWYgQHNob3dIaXN0b3J5XG4gICAgICAgICAgICByZXZlcnNlSW5kZXggPSBAbnVtUm93cygpIC0gY3VycmVudEluZGV4IC0gMVxuICAgICAgICAgICAgQHJvdyhyZXZlcnNlSW5kZXgpPy5zZXRBY3RpdmUoKVxuICAgICAgICAgICAgXG4gICAgbG9hZEhpc3Rvcnk6IC0+XG4gICAgICAgIFxuICAgICAgICBAc2V0SGlzdG9yeUl0ZW1zIHBvc3QuZ2V0ICduYXZpZ2F0ZScsICdmaWxlUG9zaXRpb25zJ1xuXG4gICAgc2V0SGlzdG9yeUl0ZW1zOiAoaXRlbXMpIC0+XG4gICAgXG4gICAgICAgIEByZW1vdmVIaXN0b3J5KClcbiAgICAgICAgXG4gICAgICAgIGl0ZW1zLm1hcCAoaCkgLT4gXG4gICAgICAgICAgICBoLnR5cGUgPSAnZmlsZSdcbiAgICAgICAgICAgIGgudGV4dCA9IHNsYXNoLnJlbW92ZUNvbHVtbiBoLnRleHRcbiAgICAgICAgaXRlbXMucmV2ZXJzZSgpXG4gICAgICAgIFxuICAgICAgICBpdGVtcy51bnNoaWZ0XG4gICAgICAgICAgICB0eXBlOiAnaGlzdG9yeVNlcGFyYXRvcidcbiAgICAgICAgICAgIGljb246ICdoaXN0b3J5LWljb24nXG4gICAgICAgIFxuICAgICAgICBAYWRkSXRlbXMgaXRlbXNcbiAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIG9uRm9jdXM6ID0+IFxuXG4gICAgICAgIHdpbmRvdy5zZXRMYXN0Rm9jdXMgJ3NoZWxmJ1xuICAgICAgICBAZGl2LmNsYXNzTGlzdC5hZGQgJ2ZvY3VzJ1xuICAgICAgICBpZiBAYnJvd3Nlci5zaGVsZlNpemUgPCAyMDBcbiAgICAgICAgICAgIEBicm93c2VyLnNldFNoZWxmU2l6ZSAyMDBcbiAgICAgICAgXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBvbk1vdXNlT3ZlcjogKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/Lm9uTW91c2VPdmVyKClcbiAgICBvbk1vdXNlT3V0OiAgKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/Lm9uTW91c2VPdXQoKVxuICAgIG9uQ2xpY2s6ICAgICAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8uYWN0aXZhdGUgZXZlbnRcbiAgICBvbkRibENsaWNrOiAgKGV2ZW50KSA9PiBAbmF2aWdhdGVDb2xzICdlbnRlcidcblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcblxuICAgIG5hdmlnYXRlUm93czogKGtleSkgLT5cblxuICAgICAgICByZXR1cm4ga2Vycm9yIFwibm8gcm93cyBpbiBjb2x1bW4gI3tAaW5kZXh9P1wiIGlmIG5vdCBAbnVtUm93cygpXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gLTFcbiAgICAgICAga2Vycm9yIFwibm8gaW5kZXggZnJvbSBhY3RpdmVSb3c/ICN7aW5kZXh9P1wiLCBAYWN0aXZlUm93KCkgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAndXAnICAgICAgICB0aGVuIGluZGV4LTFcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nICAgICAgdGhlbiBpbmRleCsxXG4gICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gMFxuICAgICAgICAgICAgd2hlbiAnZW5kJyAgICAgICB0aGVuIEBpdGVtcy5sZW5ndGhcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICAgdGhlbiBpbmRleC1AbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gY2xhbXAgMCwgQGl0ZW1zLmxlbmd0aCwgaW5kZXgrQG51bVZpc2libGUoKVxuICAgICAgICAgICAgZWxzZSBpbmRleFxuICAgICAgICAgICAgXG4gICAgICAgIGtlcnJvciBcIm5vIGluZGV4ICN7aW5kZXh9PyAje0BudW1WaXNpYmxlKCl9XCIgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXggICAgICAgIFxuICAgICAgICBpbmRleCA9IGNsYW1wIDAsIEBudW1Sb3dzKCktMSwgaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGtlcnJvciBcIm5vIHJvdyBhdCBpbmRleCAje2luZGV4fS8je0BudW1Sb3dzKCktMX0/XCIsIEBudW1Sb3dzKCkgaWYgbm90IEByb3dzW2luZGV4XT8uYWN0aXZhdGU/XG5cbiAgICAgICAgaWYgICAgICBrZXkgPT0gJ3VwJyAgIGFuZCBpbmRleCA+IEBpdGVtcy5sZW5ndGggICAgIHRoZW4gcG9zdC5lbWl0ICdtZW51QWN0aW9uJywgJ05hdmlnYXRlIEZvcndhcmQnXG4gICAgICAgIGVsc2UgaWYga2V5ID09ICdkb3duJyBhbmQgaW5kZXggPiBAaXRlbXMubGVuZ3RoICsgMSB0aGVuIHBvc3QuZW1pdCAnbWVudUFjdGlvbicsICdOYXZpZ2F0ZSBCYWNrd2FyZCdcbiAgICAgICAgZWxzZSBAcm93c1tpbmRleF0uYWN0aXZhdGUoKVxuICAgIFxuICAgIG9wZW5GaWxlSW5OZXdXaW5kb3c6IC0+ICBcbiAgICAgICAgXG4gICAgICAgIGlmIGl0ZW0gPSBAYWN0aXZlUm93KCk/Lml0ZW1cbiAgICAgICAgICAgIGlmIGl0ZW0udHlwZSA9PSAnZmlsZScgYW5kIGl0ZW0udGV4dEZpbGVcbiAgICAgICAgICAgICAgICB3aW5kb3cub3BlbkZpbGVzIFtpdGVtLmZpbGVdLCBuZXdXaW5kb3c6IHRydWVcbiAgICAgICAgQFxuICAgIFxuICAgIHJlbW92ZU9iamVjdDogPT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgcm93ID0gQGFjdGl2ZVJvdygpXG4gICAgICAgICAgICBpZiBAc2hvd0hpc3RvcnlcbiAgICAgICAgICAgICAgICBpZiByb3cuaXRlbS50eXBlID09ICdoaXN0b3J5U2VwYXJhdG9yJ1xuICAgICAgICAgICAgICAgICAgICBAdG9nZ2xlSGlzdG9yeSgpXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIGlmIHJvdy5pbmRleCgpID4gQGhpc3RvcnlTZXBhcmF0b3JJbmRleCgpXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5uYXZpZ2F0ZS5kZWxGaWxlUG9zIHJvdy5pdGVtXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBuZXh0T3JQcmV2ID0gcm93Lm5leHQoKSA/IHJvdy5wcmV2KClcbiAgICAgICAgICAgIHJvdy5kaXYucmVtb3ZlKClcbiAgICAgICAgICAgIEBpdGVtcy5zcGxpY2Ugcm93LmluZGV4KCksIDFcbiAgICAgICAgICAgIEByb3dzLnNwbGljZSByb3cuaW5kZXgoKSwgMVxuICAgICAgICAgICAgbmV4dE9yUHJldj8uYWN0aXZhdGUoKVxuICAgICAgICAgICAgQHNhdmVQcmVmcygpXG4gICAgICAgIEBcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgIFxuICAgIFxuICAgIHNob3dDb250ZXh0TWVudTogKGFic1BvcykgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBhYnNQb3M/XG4gICAgICAgICAgICBhYnNQb3MgPSBwb3MgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCwgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG4gICAgICAgIFxuICAgICAgICBvcHQgPSBpdGVtczogWyBcbiAgICAgICAgICAgIHRleHQ6ICAgJ1RvZ2dsZSBIaXN0b3J5J1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K2gnIFxuICAgICAgICAgICAgY2I6ICAgICBAdG9nZ2xlSGlzdG9yeVxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdUb2dnbGUgRXh0ZW5zaW9ucydcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrZScgXG4gICAgICAgICAgICBjYjogICAgIEB0b2dnbGVFeHRlbnNpb25zXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ1JlbW92ZSdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2JhY2tzcGFjZScgXG4gICAgICAgICAgICBjYjogICAgIEByZW1vdmVPYmplY3RcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnQ2xlYXIgSGlzdG9yeSdcbiAgICAgICAgICAgIGNiOiAgICAgQGNsZWFySGlzdG9yeVxuICAgICAgICBdXG4gICAgICAgIFxuICAgICAgICBvcHQueCA9IGFic1Bvcy54XG4gICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgcG9wdXAubWVudSBvcHRcbiAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBvbktleTogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgeyBtb2QsIGtleSwgY29tYm8sIGNoYXIgfSA9IGtleWluZm8uZm9yRXZlbnQgZXZlbnRcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtlbnRlcicsICdjdHJsK2VudGVyJyB0aGVuIHJldHVybiBAb3BlbkZpbGVJbk5ld1dpbmRvdygpXG4gICAgICAgICAgICB3aGVuICdiYWNrc3BhY2UnLCAnZGVsZXRlJyB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBjbGVhclNlYXJjaCgpLnJlbW92ZU9iamVjdCgpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2snLCAnY3RybCtrJyB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQgaWYgQGJyb3dzZXIuY2xlYW5VcCgpXG4gICAgICAgICAgICB3aGVuICd0YWInICAgIFxuICAgICAgICAgICAgICAgIGlmIEBzZWFyY2gubGVuZ3RoIHRoZW4gQGRvU2VhcmNoICcnXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudFxuICAgICAgICAgICAgd2hlbiAnZXNjJ1xuICAgICAgICAgICAgICAgIGlmIEBzZWFyY2gubGVuZ3RoIHRoZW4gQGNsZWFyU2VhcmNoKClcbiAgICAgICAgICAgICAgICBlbHNlIHdpbmRvdy5zcGxpdC5mb2N1cyAnY29tbWFuZGxpbmUtZWRpdG9yJ1xuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnRcblxuICAgICAgICBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICd1cCcsICdkb3duJywgJ3BhZ2UgdXAnLCAncGFnZSBkb3duJywgJ2hvbWUnLCAnZW5kJyBcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb3dzIGtleVxuICAgICAgICAgICAgd2hlbiAncmlnaHQnLCAnZW50ZXInXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGZvY3VzQnJvd3NlcigpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHN3aXRjaCBjaGFyXG4gICAgICAgICAgICB3aGVuICd+JywgJy8nIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm9vdCBjaGFyXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgbW9kIGluIFsnc2hpZnQnLCAnJ10gYW5kIGNoYXIgdGhlbiBAZG9TZWFyY2ggY2hhclxuICAgICAgICBcbiAgICAgICAgaWYga2V5IGluIFsnbGVmdCddIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudFxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gU2hlbGZcbiJdfQ==
//# sourceURL=../../coffee/browser/shelf.coffee