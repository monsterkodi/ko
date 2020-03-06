// koffee 1.12.0

/*
 0000000  000   000  00000000  000      00000000
000       000   000  000       000      000     
0000000   000000000  0000000   000      000000  
     000  000   000  000       000      000     
0000000   000   000  00000000  0000000  000
 */
var $, Column, Row, Scroller, Shelf, _, clamp, elem, empty, first, fuzzy, hub, kerror, keyinfo, kpos, popup, post, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), $ = ref.$, _ = ref._, clamp = ref.clamp, elem = ref.elem, empty = ref.empty, first = ref.first, kerror = ref.kerror, keyinfo = ref.keyinfo, kpos = ref.kpos, popup = ref.popup, post = ref.post, slash = ref.slash, stopEvent = ref.stopEvent;

Row = require('./row');

Scroller = require('./scroller');

Column = require('./column');

fuzzy = require('fuzzy');

hub = require('../git/hub');

Shelf = (function(superClass) {
    extend(Shelf, superClass);

    function Shelf(browser) {
        this.onKeyUp = bind(this.onKeyUp, this);
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
        this.onDrop = bind(this.onDrop, this);
        this.addPath = bind(this.addPath, this);
        this.onFile = bind(this.onFile, this);
        Shelf.__super__.constructor.call(this, browser);
        this.items = [];
        this.index = -1;
        this.div.id = 'shelf';
        this.showHistory = window.stash.get('shelf|history', false);
        post.on('gitStatus', this.loadGitStatus);
        post.on('addToShelf', this.addPath);
        post.on('navigateHistoryChanged', this.onNavigateHistoryChanged);
        post.on('navigateIndexChanged', this.onNavigateIndexChanged);
        post.on('file', this.onFile);
    }

    Shelf.prototype.activateRow = function(row) {
        var item, ref1;
        if ((ref1 = $('.hover')) != null) {
            ref1.classList.remove('hover');
        }
        item = row.item;
        if (item.type === 'historySeparator') {
            row.setActive({
                emit: false
            });
            return;
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

    Shelf.prototype.addFiles = function(files, opt) {
        var file, j, len, results;
        results = [];
        for (j = 0, len = files.length; j < len; j++) {
            file = files[j];
            if (slash.isDir(file)) {
                results.push(this.addDir(file, opt));
            } else {
                results.push(this.addFile(file, opt));
            }
        }
        return results;
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
        return this.setItems(this.items);
    };

    Shelf.prototype.onDrop = function(event) {
        var action, item, source;
        action = event.getModifierState('Shift') && 'copy' || 'move';
        source = event.dataTransfer.getData('text/plain');
        item = this.browser.fileItem(source);
        return this.addItem(item, {
            pos: kpos(event)
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
                if (this.dragDiv) {
                    this.dragDiv.drag.dragStop();
                    this.dragDiv.remove();
                    delete this.dragDiv;
                }
                if (this.search.length) {
                    this.clearSearch();
                }
                return stopEvent(event);
            case 'up':
            case 'down':
            case 'page up':
            case 'page down':
            case 'home':
            case 'end':
                return stopEvent(event, this.navigateRows(key));
            case 'right':
            case 'alt+right':
            case 'enter':
                return stopEvent(event, this.focusBrowser());
        }
        if ((mod === 'shift' || mod === '') && char) {
            this.doSearch(char);
        }
        if (this.dragDiv) {
            return this.updateDragIndicator(event);
        }
    };

    Shelf.prototype.onKeyUp = function(event) {
        if (this.dragDiv) {
            return this.updateDragIndicator(event);
        }
    };

    return Shelf;

})(Column);

module.exports = Shelf;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGYuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2Jyb3dzZXIiLCJzb3VyY2VzIjpbInNoZWxmLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxvSUFBQTtJQUFBOzs7O0FBUUEsTUFBNEYsT0FBQSxDQUFRLEtBQVIsQ0FBNUYsRUFBRSxTQUFGLEVBQUssU0FBTCxFQUFRLGlCQUFSLEVBQWUsZUFBZixFQUFxQixpQkFBckIsRUFBNEIsaUJBQTVCLEVBQW1DLG1CQUFuQyxFQUEyQyxxQkFBM0MsRUFBb0QsZUFBcEQsRUFBMEQsaUJBQTFELEVBQWlFLGVBQWpFLEVBQXVFLGlCQUF2RSxFQUE4RTs7QUFFOUUsR0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUNYLEdBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFFTDs7O0lBRUMsZUFBQyxPQUFEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7UUFFQyx1Q0FBTSxPQUFOO1FBRUEsSUFBQyxDQUFBLEtBQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxLQUFELEdBQVUsQ0FBQztRQUNYLElBQUMsQ0FBQSxHQUFHLENBQUMsRUFBTCxHQUFVO1FBRVYsSUFBQyxDQUFBLFdBQUQsR0FBZSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQWIsQ0FBaUIsZUFBakIsRUFBaUMsS0FBakM7UUFFZixJQUFJLENBQUMsRUFBTCxDQUFRLFdBQVIsRUFBaUMsSUFBQyxDQUFBLGFBQWxDO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxZQUFSLEVBQWlDLElBQUMsQ0FBQSxPQUFsQztRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsd0JBQVIsRUFBaUMsSUFBQyxDQUFBLHdCQUFsQztRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsc0JBQVIs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QUFWO0FBYmYsaUJBY1MsSUFkVDtBQUFBLGlCQWNjLE1BZGQ7QUFBQSxpQkFjcUIsU0FkckI7QUFBQSxpQkFjK0IsV0FkL0I7QUFBQSxpQkFjMkMsTUFkM0M7QUFBQSxpQkFja0QsS0FkbEQ7QUFlUSx1QkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixJQUFDLENBQUEsWUFBRCxDQUFjLEdBQWQsQ0FBakI7QUFmZixpQkFnQlMsT0FoQlQ7QUFBQSxpQkFnQmlCLFdBaEJqQjtBQUFBLGlCQWdCNkIsT0FoQjdCO0FBaUJRLHVCQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxZQUFELENBQUEsQ0FBakI7QUFqQmY7UUFtQkEsSUFBRyxDQUFBLEdBQUEsS0FBUSxPQUFSLElBQUEsR0FBQSxLQUFnQixFQUFoQixDQUFBLElBQXdCLElBQTNCO1lBQXFDLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixFQUFyQzs7UUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFKO21CQUNJLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixLQUFyQixFQURKOztJQXpCRzs7b0JBNEJQLE9BQUEsR0FBUyxTQUFDLEtBQUQ7UUFFTCxJQUFHLElBQUMsQ0FBQSxPQUFKO21CQUNJLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixLQUFyQixFQURKOztJQUZLOzs7O0dBamJPOztBQXNicEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwICBcbiAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgIFxuMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgICAgXG4jIyNcblxueyAkLCBfLCBjbGFtcCwgZWxlbSwgZW1wdHksIGZpcnN0LCBrZXJyb3IsIGtleWluZm8sIGtwb3MsIHBvcHVwLCBwb3N0LCBzbGFzaCwgc3RvcEV2ZW50IH0gPSByZXF1aXJlICdreGsnXG5cblJvdyAgICAgID0gcmVxdWlyZSAnLi9yb3cnXG5TY3JvbGxlciA9IHJlcXVpcmUgJy4vc2Nyb2xsZXInXG5Db2x1bW4gICA9IHJlcXVpcmUgJy4vY29sdW1uJ1xuZnV6enkgICAgPSByZXF1aXJlICdmdXp6eSdcbmh1YiAgICAgID0gcmVxdWlyZSAnLi4vZ2l0L2h1YidcbiAgICBcbmNsYXNzIFNoZWxmIGV4dGVuZHMgQ29sdW1uXG5cbiAgICBAOiAoYnJvd3NlcikgLT5cblxuICAgICAgICBzdXBlciBicm93c2VyXG4gICAgICAgIFxuICAgICAgICBAaXRlbXMgID0gW11cbiAgICAgICAgQGluZGV4ICA9IC0xXG4gICAgICAgIEBkaXYuaWQgPSAnc2hlbGYnXG4gICAgICAgIFxuICAgICAgICBAc2hvd0hpc3RvcnkgPSB3aW5kb3cuc3Rhc2guZ2V0ICdzaGVsZnxoaXN0b3J5JyBmYWxzZVxuXG4gICAgICAgIHBvc3Qub24gJ2dpdFN0YXR1cycgICAgICAgICAgICAgIEBsb2FkR2l0U3RhdHVzXG4gICAgICAgIHBvc3Qub24gJ2FkZFRvU2hlbGYnICAgICAgICAgICAgIEBhZGRQYXRoXG4gICAgICAgIHBvc3Qub24gJ25hdmlnYXRlSGlzdG9yeUNoYW5nZWQnIEBvbk5hdmlnYXRlSGlzdG9yeUNoYW5nZWRcbiAgICAgICAgcG9zdC5vbiAnbmF2aWdhdGVJbmRleENoYW5nZWQnICAgQG9uTmF2aWdhdGVJbmRleENoYW5nZWRcbiAgICAgICAgXG4gICAgICAgIHBvc3Qub24gJ2ZpbGUnIEBvbkZpbGVcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgXG4gICBcbiAgICBhY3RpdmF0ZVJvdzogKHJvdykgLT4gXG4gICAgICAgIFxuICAgICAgICAkKCcuaG92ZXInKT8uY2xhc3NMaXN0LnJlbW92ZSAnaG92ZXInXG4gICAgICAgIFxuICAgICAgICBpdGVtID0gcm93Lml0ZW1cbiAgICAgICAgIFxuICAgICAgICBpZiBpdGVtLnR5cGUgPT0gJ2hpc3RvcnlTZXBhcmF0b3InXG4gICAgICAgICAgICByb3cuc2V0QWN0aXZlIGVtaXQ6ZmFsc2VcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgcm93LnNldEFjdGl2ZSBlbWl0OnRydWVcbiAgICAgICAgXG4gICAgICAgIGlmIGl0ZW0udHlwZSA9PSAnZmlsZSdcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvRmlsZScgaXRlbVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ2ZpbGVicm93c2VyJyAnbG9hZEl0ZW0nIGl0ZW1cbiAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgb25GaWxlOiAoZmlsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBmaWxlXG4gICAgICAgIGlmIEBuYXZpZ2F0aW5nUm93c1xuICAgICAgICAgICAgZGVsZXRlIEBuYXZpZ2F0aW5nUm93c1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBmb3IgaW5kZXggaW4gWzAuLi5AaXRlbXMubGVuZ3RoXVxuICAgICAgICAgICAgaWYgQGl0ZW1zW2luZGV4XS5maWxlID09IGZpbGVcbiAgICAgICAgICAgICAgICBAcm93c1tpbmRleF0uc2V0QWN0aXZlKClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIG1hdGNoZXMgPSBbXVxuICAgICAgICBmb3IgaW5kZXgsaXRlbSBvZiBAaXRlbXNcbiAgICAgICAgICAgIGlmIGZpbGU/LnN0YXJ0c1dpdGggaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgbWF0Y2hlcy5wdXNoIFtpbmRleCwgaXRlbV1cblxuICAgICAgICBpZiBub3QgZW1wdHkgbWF0Y2hlc1xuICAgICAgICAgICAgbWF0Y2hlcy5zb3J0IChhLGIpIC0+IGJbMV0uZmlsZS5sZW5ndGggLSBhWzFdLmZpbGUubGVuZ3RoXG4gICAgICAgICAgICBbaW5kZXgsIGl0ZW1dID0gZmlyc3QgbWF0Y2hlc1xuICAgICAgICAgICAgQHJvd3NbaW5kZXhdLnNldEFjdGl2ZSgpXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIGJyb3dzZXJEaWRJbml0Q29sdW1uczogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBAZGlkSW5pdFxuICAgICAgICBcbiAgICAgICAgQGRpZEluaXQgPSB0cnVlXG4gICAgICAgIFxuICAgICAgICBAbG9hZFNoZWxmSXRlbXMoKVxuICAgICAgICBcbiAgICAgICAgQGxvYWRIaXN0b3J5KCkgaWYgQHNob3dIaXN0b3J5XG4gICAgICAgIFxuICAgICAgICBAbG9hZEdpdFN0YXR1cygpXG4gICAgICAgICAgICAgICAgXG4gICAgbG9hZFNoZWxmSXRlbXM6IC0+XG4gICAgICAgIFxuICAgICAgICBpdGVtcyA9IHdpbmRvdy5zdGF0ZS5nZXQgXCJzaGVsZnxpdGVtc1wiXG4gICAgICAgIEBzZXRJdGVtcyBpdGVtcywgc2F2ZTpmYWxzZVxuICAgICAgICAgICAgICAgIFxuICAgIGFkZFBhdGg6IChwYXRoLCBvcHQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBzbGFzaC5pc0RpciBwYXRoXG4gICAgICAgICAgICBAYWRkRGlyIHBhdGgsIG9wdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAYWRkRmlsZSBwYXRoLCBvcHRcbiAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcblxuICAgIGl0ZW1QYXRoczogLT4gQHJvd3MubWFwIChyKSAtPiByLnBhdGgoKVxuICAgIFxuICAgIHNhdmVQcmVmczogLT4gd2luZG93LnN0YXRlLnNldCBcInNoZWxmfGl0ZW1zXCIgQGl0ZW1zXG4gICAgICAgICMgcHJlZnMuc2V0IFwic2hlbGbilrhpdGVtc1wiIEBpdGVtc1xuICAgIFxuICAgIHNldEl0ZW1zOiAoQGl0ZW1zLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBAY2xlYXIoKVxuICAgICAgICBcbiAgICAgICAgQGl0ZW1zID89IFtdXG4gICAgICAgIEBhZGRJdGVtcyBAaXRlbXNcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdD8uc2F2ZSAhPSBmYWxzZVxuICAgICAgICAgICAgQHNhdmVQcmVmcygpICAgICAgICAgICAgXG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgYWRkSXRlbXM6IChpdGVtcywgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGl0ZW1zXG4gICAgICAgIFxuICAgICAgICBmb3IgaXRlbSBpbiBpdGVtc1xuICAgICAgICAgICAgQHJvd3MucHVzaCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgICAgIFxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgYWRkRGlyOiAoZGlyLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBpdGVtID0gXG4gICAgICAgICAgICBuYW1lOiBzbGFzaC5maWxlIHNsYXNoLnRpbGRlIGRpclxuICAgICAgICAgICAgdHlwZTogJ2RpcidcbiAgICAgICAgICAgIGZpbGU6IHNsYXNoLnBhdGggZGlyXG4gICAgICAgIFxuICAgICAgICBAYWRkSXRlbSBpdGVtLCBvcHRcblxuICAgIGFkZEZpbGU6IChmaWxlLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBpdGVtID0gXG4gICAgICAgICAgICBuYW1lOiBzbGFzaC5maWxlIGZpbGVcbiAgICAgICAgICAgIHR5cGU6ICdmaWxlJ1xuICAgICAgICAgICAgZmlsZTogc2xhc2gucGF0aCBmaWxlXG4gICAgICAgIGl0ZW0udGV4dEZpbGUgPSB0cnVlIGlmIHNsYXNoLmlzVGV4dCBmaWxlXG4gICAgICAgIEBhZGRJdGVtIGl0ZW0sIG9wdFxuICAgICAgICBcbiAgICBhZGRGaWxlczogKGZpbGVzLCBvcHQpIC0+XG4gICAgICAgICMga2xvZyAnZmlsZXMnIGZpbGVzXG4gICAgICAgIGZvciBmaWxlIGluIGZpbGVzXG4gICAgICAgICAgICBpZiBzbGFzaC5pc0RpciBmaWxlXG4gICAgICAgICAgICAgICAgIyBrbG9nICdhZGREaXInIGZpbGVcbiAgICAgICAgICAgICAgICBAYWRkRGlyIGZpbGUsIG9wdFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICMga2xvZyAnYWRkRmlsZScgZmlsZVxuICAgICAgICAgICAgICAgIEBhZGRGaWxlIGZpbGUsIG9wdFxuICAgICAgICBcbiAgICBhZGRJdGVtOiAgKGl0ZW0sIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIF8ucHVsbEFsbFdpdGggQGl0ZW1zLCBbaXRlbV0sIF8uaXNFcXVhbCAjIHJlbW92ZSBpdGVtIGlmIG9uIHNoZWxmIGFscmVhZHlcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdD8ucG9zXG4gICAgICAgICAgICBpbmRleCA9IEByb3dJbmRleEF0UG9zIG9wdC5wb3NcbiAgICAgICAgICAgIEBpdGVtcy5zcGxpY2UgTWF0aC5taW4oaW5kZXgsIEBpdGVtcy5sZW5ndGgpLCAwLCBpdGVtXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBpdGVtcy5wdXNoIGl0ZW1cbiAgICAgICAgICAgIFxuICAgICAgICBAc2V0SXRlbXMgQGl0ZW1zXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBvbkRyb3A6IChldmVudCkgPT4gXG4gICAgXG4gICAgICAgIGFjdGlvbiA9IGV2ZW50LmdldE1vZGlmaWVyU3RhdGUoJ1NoaWZ0JykgYW5kICdjb3B5JyBvciAnbW92ZSdcbiAgICAgICAgc291cmNlID0gZXZlbnQuZGF0YVRyYW5zZmVyLmdldERhdGEgJ3RleHQvcGxhaW4nXG4gICAgICAgIFxuICAgICAgICBpdGVtID0gQGJyb3dzZXIuZmlsZUl0ZW0gc291cmNlXG4gICAgICAgIEBhZGRJdGVtIGl0ZW0sIHBvczprcG9zIGV2ZW50XG4gICAgXG4gICAgaXNFbXB0eTogLT4gZW1wdHkgQHJvd3NcbiAgICBcbiAgICBjbGVhcjogLT5cbiAgICAgICAgXG4gICAgICAgIEBjbGVhclNlYXJjaCgpXG4gICAgICAgIEBkaXYuc2Nyb2xsVG9wID0gMFxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgQHJvd3MgPSBbXVxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIG5hbWU6IC0+ICdzaGVsZidcblxuICAgICMgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICBcblxuICAgIGxvYWRHaXRTdGF0dXM6ID0+XG4gICAgICAgIFxuICAgICAgICBmb3Igcm93IGluIEByb3dzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgICQoJy5icm93c2VyU3RhdHVzSWNvbicsIHJvdy5kaXYpPy5yZW1vdmUoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmaWxlU3RhdHVzID0gKHJvdykgLT4gKHN0YXR1cykgPT5cbiAgICAgICAgICAgICAgICBmb3IgZmlsZSwgc3RhdHVzIG9mIGh1Yi5zdGF0dXNGaWxlcyBzdGF0dXNcbiAgICAgICAgICAgICAgICAgICAgaWYgZmlsZS5zdGFydHNXaXRoIHJvdy5wYXRoKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHJvdy5pdGVtLnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXMgPSAnZGlycydcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvdy5kaXYuYXBwZW5kQ2hpbGQgZWxlbSAnc3BhbicsIGNsYXNzOlwiZ2l0LSN7c3RhdHVzfS1pY29uIGJyb3dzZXJTdGF0dXNJY29uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGh1Yi5zdGF0dXMgcm93LnBhdGgoKSwgZmlsZVN0YXR1cyByb3dcblxuICAgIHVwZGF0ZUdpdEZpbGVzOiAtPiBAbG9hZEdpdFN0YXR1cygpXG4gICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgdG9nZ2xlSGlzdG9yeTogPT5cbiAgICAgICAgXG4gICAgICAgIEBzaG93SGlzdG9yeSA9IG5vdCBAc2hvd0hpc3RvcnlcbiAgICAgICAgaWYgQHNob3dIaXN0b3J5XG4gICAgICAgICAgICBAbG9hZEhpc3RvcnkoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAcmVtb3ZlSGlzdG9yeSgpXG4gICAgICAgIHdpbmRvdy5zdGFzaC5zZXQgJ3NoZWxmfGhpc3RvcnknIEBzaG93SGlzdG9yeVxuICAgICAgICB3aW5kb3cuc3Rhc2guc2V0ICdzaGVsZnxoaXN0b3J5JyBAc2hvd0hpc3RvcnlcbiAgICBjbGVhckhpc3Rvcnk6ID0+XG4gICAgICAgIFxuICAgICAgICB3aW5kb3cubmF2aWdhdGUuY2xlYXIoKVxuICAgICAgICBpZiBAc2hvd0hpc3RvcnkgdGhlbiBAc2V0SGlzdG9yeUl0ZW1zIFtcbiAgICAgICAgICAgIGZpbGU6ICAgd2luZG93LmVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgcG9zOiAgICB3aW5kb3cuZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICAgICAgdGV4dDogICBzbGFzaC5maWxlIHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgXVxuICAgICAgICBcbiAgICBoaXN0b3J5U2VwYXJhdG9ySW5kZXg6IC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgaSBpbiBbMC4uLkBudW1Sb3dzKCldXG4gICAgICAgICAgICBpZiBAcm93KGkpLml0ZW0udHlwZSA9PSAnaGlzdG9yeVNlcGFyYXRvcidcbiAgICAgICAgICAgICAgICByZXR1cm4gaVxuICAgICAgICByZXR1cm4gQG51bVJvd3MoKVxuICAgICAgICBcbiAgICByZW1vdmVIaXN0b3J5OiAtPlxuICAgICAgICBcbiAgICAgICAgc2VwYXJhdG9ySW5kZXggPSBAaGlzdG9yeVNlcGFyYXRvckluZGV4KClcbiAgICAgICAgd2hpbGUgQG51bVJvd3MoKSBhbmQgQG51bVJvd3MoKSA+IHNlcGFyYXRvckluZGV4XG4gICAgICAgICAgICBAcmVtb3ZlUm93IEByb3coQG51bVJvd3MoKS0xKVxuXG4gICAgb25OYXZpZ2F0ZUhpc3RvcnlDaGFuZ2VkOiAoZmlsZVBvc2l0aW9ucywgY3VycmVudEluZGV4KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQHNob3dIaXN0b3J5XG4gICAgICAgICAgICBAc2V0SGlzdG9yeUl0ZW1zIGZpbGVQb3NpdGlvbnNcblxuICAgIG9uTmF2aWdhdGVJbmRleENoYW5nZWQ6IChjdXJyZW50SW5kZXgsIGN1cnJlbnRJdGVtKSA9PlxuXG4gICAgICAgIGlmIEBzaG93SGlzdG9yeVxuICAgICAgICAgICAgcmV2ZXJzZUluZGV4ID0gQG51bVJvd3MoKSAtIGN1cnJlbnRJbmRleCAtIDFcbiAgICAgICAgICAgIGlmIGN1cnJlbnRJdGVtLmZpbGUgIT0gQGFjdGl2ZVJvdygpPy5pdGVtLmZpbGVcbiAgICAgICAgICAgICAgICBAcm93KHJldmVyc2VJbmRleCk/LnNldEFjdGl2ZSgpXG4gICAgICAgICAgICBcbiAgICBsb2FkSGlzdG9yeTogLT5cbiAgICAgICAgXG4gICAgICAgIEBzZXRIaXN0b3J5SXRlbXMgcG9zdC5nZXQgJ25hdmlnYXRlJywgJ2ZpbGVQb3NpdGlvbnMnXG5cbiAgICBzZXRIaXN0b3J5SXRlbXM6IChpdGVtcykgLT5cbiAgICBcbiAgICAgICAgQHJlbW92ZUhpc3RvcnkoKVxuICAgICAgICBcbiAgICAgICAgaXRlbXMubWFwIChoKSAtPiBcbiAgICAgICAgICAgIGgudHlwZSA9ICdmaWxlJ1xuICAgICAgICAgICAgaC50ZXh0ID0gc2xhc2gucmVtb3ZlQ29sdW1uIGgudGV4dFxuICAgICAgICBpdGVtcy5yZXZlcnNlKClcbiAgICAgICAgXG4gICAgICAgIGl0ZW1zLnVuc2hpZnRcbiAgICAgICAgICAgIHR5cGU6ICdoaXN0b3J5U2VwYXJhdG9yJ1xuICAgICAgICAgICAgaWNvbjogJ2hpc3RvcnktaWNvbidcbiAgICAgICAgXG4gICAgICAgIEBhZGRJdGVtcyBpdGVtc1xuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIG9uRm9jdXM6ID0+IFxuXG4gICAgICAgIEBkaXYuY2xhc3NMaXN0LmFkZCAnZm9jdXMnXG4gICAgICAgIGlmIEBicm93c2VyLnNoZWxmU2l6ZSA8IDIwMFxuICAgICAgICAgICAgQGJyb3dzZXIuc2V0U2hlbGZTaXplIDIwMFxuICAgICAgICAgICAgXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBvbk1vdXNlT3ZlcjogKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/Lm9uTW91c2VPdmVyKClcbiAgICBvbk1vdXNlT3V0OiAgKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/Lm9uTW91c2VPdXQoKVxuICAgIG9uQ2xpY2s6ICAgICAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8uYWN0aXZhdGUgZXZlbnRcbiAgICBvbkRibENsaWNrOiAgKGV2ZW50KSA9PiBAbmF2aWdhdGVDb2xzICdlbnRlcidcblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcblxuICAgIG5hdmlnYXRlUm93czogKGtleSkgLT5cblxuICAgICAgICByZXR1cm4ga2Vycm9yIFwibm8gcm93cyBpbiBjb2x1bW4gI3tAaW5kZXh9P1wiIGlmIG5vdCBAbnVtUm93cygpXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gLTFcbiAgICAgICAga2Vycm9yIFwibm8gaW5kZXggZnJvbSBhY3RpdmVSb3c/ICN7aW5kZXh9P1wiLCBAYWN0aXZlUm93KCkgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAndXAnICAgICAgICB0aGVuIGluZGV4LTFcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nICAgICAgdGhlbiBpbmRleCsxXG4gICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gMFxuICAgICAgICAgICAgd2hlbiAnZW5kJyAgICAgICB0aGVuIEBpdGVtcy5sZW5ndGhcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICAgdGhlbiBpbmRleC1AbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gY2xhbXAgMCwgQGl0ZW1zLmxlbmd0aCwgaW5kZXgrQG51bVZpc2libGUoKVxuICAgICAgICAgICAgZWxzZSBpbmRleFxuICAgICAgICAgICAgXG4gICAgICAgIGtlcnJvciBcIm5vIGluZGV4ICN7aW5kZXh9PyAje0BudW1WaXNpYmxlKCl9XCIgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXggICAgICAgIFxuICAgICAgICBpbmRleCA9IGNsYW1wIDAsIEBudW1Sb3dzKCktMSwgaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGtlcnJvciBcIm5vIHJvdyBhdCBpbmRleCAje2luZGV4fS8je0BudW1Sb3dzKCktMX0/XCIsIEBudW1Sb3dzKCkgaWYgbm90IEByb3dzW2luZGV4XT8uYWN0aXZhdGU/XG5cbiAgICAgICAgbmF2aWdhdGUgPSAoYWN0aW9uKSA9PlxuICAgICAgICAgICAgQG5hdmlnYXRpbmdSb3dzID0gdHJ1ZVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdtZW51QWN0aW9uJyBhY3Rpb25cbiAgICAgICAgXG4gICAgICAgIGlmICAgICAga2V5ID09ICd1cCcgICBhbmQgaW5kZXggPiBAaXRlbXMubGVuZ3RoICAgICB0aGVuIG5hdmlnYXRlICdOYXZpZ2F0ZSBGb3J3YXJkJ1xuICAgICAgICBlbHNlIGlmIGtleSA9PSAnZG93bicgYW5kIGluZGV4ID4gQGl0ZW1zLmxlbmd0aCArIDEgdGhlbiBuYXZpZ2F0ZSAnTmF2aWdhdGUgQmFja3dhcmQnXG4gICAgICAgIGVsc2UgQHJvd3NbaW5kZXhdLmFjdGl2YXRlKClcbiAgICBcbiAgICBvcGVuRmlsZUluTmV3V2luZG93OiAtPiAgXG4gICAgICAgIFxuICAgICAgICBpZiBpdGVtID0gQGFjdGl2ZVJvdygpPy5pdGVtXG4gICAgICAgICAgICBpZiBpdGVtLnR5cGUgPT0gJ2ZpbGUnIGFuZCBpdGVtLnRleHRGaWxlXG4gICAgICAgICAgICAgICAgd2luZG93Lm9wZW5GaWxlcyBbaXRlbS5maWxlXSwgbmV3V2luZG93OiB0cnVlXG4gICAgICAgIEBcbiAgICBcbiAgICByZW1vdmVPYmplY3Q6ID0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIHJvdyA9IEBhY3RpdmVSb3coKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBAc2hvd0hpc3RvcnlcbiAgICAgICAgICAgICAgICBpZiByb3cuaXRlbS50eXBlID09ICdoaXN0b3J5U2VwYXJhdG9yJ1xuICAgICAgICAgICAgICAgICAgICBAdG9nZ2xlSGlzdG9yeSgpXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIGlmIHJvdy5pbmRleCgpID4gQGhpc3RvcnlTZXBhcmF0b3JJbmRleCgpXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5uYXZpZ2F0ZS5kZWxGaWxlUG9zIHJvdy5pdGVtXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBuZXh0T3JQcmV2ID0gcm93Lm5leHQoKSA/IHJvdy5wcmV2KClcbiAgICAgICAgICAgIHJvdy5kaXYucmVtb3ZlKClcbiAgICAgICAgICAgIEBpdGVtcy5zcGxpY2Ugcm93LmluZGV4KCksIDFcbiAgICAgICAgICAgIEByb3dzLnNwbGljZSByb3cuaW5kZXgoKSwgMVxuICAgICAgICAgICAgbmV4dE9yUHJldj8uYWN0aXZhdGUoKVxuICAgICAgICAgICAgQHNhdmVQcmVmcygpXG4gICAgICAgIEBcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgIFxuICAgIFxuICAgIHNob3dDb250ZXh0TWVudTogKGFic1BvcykgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBhYnNQb3M/XG4gICAgICAgICAgICBhYnNQb3MgPSBwb3MgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCwgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG4gICAgICAgIFxuICAgICAgICBvcHQgPSBpdGVtczogWyBcbiAgICAgICAgICAgIHRleHQ6ICAgJ1RvZ2dsZSBIaXN0b3J5J1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K2gnIFxuICAgICAgICAgICAgY2I6ICAgICBAdG9nZ2xlSGlzdG9yeVxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdUb2dnbGUgRXh0ZW5zaW9ucydcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrZScgXG4gICAgICAgICAgICBjYjogICAgIEB0b2dnbGVFeHRlbnNpb25zXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ1JlbW92ZSdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2JhY2tzcGFjZScgXG4gICAgICAgICAgICBjYjogICAgIEByZW1vdmVPYmplY3RcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnQ2xlYXIgSGlzdG9yeSdcbiAgICAgICAgICAgIGNiOiAgICAgQGNsZWFySGlzdG9yeVxuICAgICAgICBdXG4gICAgICAgIFxuICAgICAgICBvcHQueCA9IGFic1Bvcy54XG4gICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgcG9wdXAubWVudSBvcHRcbiAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBvbktleTogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgeyBtb2QsIGtleSwgY29tYm8sIGNoYXIgfSA9IGtleWluZm8uZm9yRXZlbnQgZXZlbnRcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtlbnRlcicgJ2N0cmwrZW50ZXInIHRoZW4gcmV0dXJuIEBvcGVuRmlsZUluTmV3V2luZG93KClcbiAgICAgICAgICAgIHdoZW4gJ2JhY2tzcGFjZScgJ2RlbGV0ZScgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAY2xlYXJTZWFyY2goKS5yZW1vdmVPYmplY3QoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtrJyAnY3RybCtrJyB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQgaWYgQGJyb3dzZXIuY2xlYW5VcCgpXG4gICAgICAgICAgICB3aGVuICd0YWInICAgIFxuICAgICAgICAgICAgICAgIGlmIEBzZWFyY2gubGVuZ3RoIHRoZW4gQGRvU2VhcmNoICcnXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudFxuICAgICAgICAgICAgd2hlbiAnZXNjJ1xuICAgICAgICAgICAgICAgIGlmIEBkcmFnRGl2XG4gICAgICAgICAgICAgICAgICAgIEBkcmFnRGl2LmRyYWcuZHJhZ1N0b3AoKVxuICAgICAgICAgICAgICAgICAgICBAZHJhZ0Rpdi5yZW1vdmUoKVxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgQGRyYWdEaXZcbiAgICAgICAgICAgICAgICBpZiBAc2VhcmNoLmxlbmd0aCB0aGVuIEBjbGVhclNlYXJjaCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudFxuICAgICAgICAgICAgd2hlbiAndXAnICdkb3duJyAncGFnZSB1cCcgJ3BhZ2UgZG93bicgJ2hvbWUnICdlbmQnIFxuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvd3Mga2V5XG4gICAgICAgICAgICB3aGVuICdyaWdodCcgJ2FsdCtyaWdodCcgJ2VudGVyJ1xuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBmb2N1c0Jyb3dzZXIoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBtb2QgaW4gWydzaGlmdCcgJyddIGFuZCBjaGFyIHRoZW4gQGRvU2VhcmNoIGNoYXJcbiAgICAgICAgXG4gICAgICAgIGlmIEBkcmFnRGl2XG4gICAgICAgICAgICBAdXBkYXRlRHJhZ0luZGljYXRvciBldmVudFxuICAgICAgICAgICAgXG4gICAgb25LZXlVcDogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGRyYWdEaXZcbiAgICAgICAgICAgIEB1cGRhdGVEcmFnSW5kaWNhdG9yIGV2ZW50XG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBTaGVsZlxuIl19
//# sourceURL=../../coffee/browser/shelf.coffee