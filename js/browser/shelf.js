// koffee 1.20.0

/*
 0000000  000   000  00000000  000      00000000
000       000   000  000       000      000     
0000000   000000000  0000000   000      000000  
     000  000   000  000       000      000     
0000000   000   000  00000000  0000000  000
 */
var $, Column, Row, Scroller, Shelf, _, clamp, elem, empty, first, fuzzy, hub, kerror, keyinfo, klog, kpos, popup, post, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = Object.hasOwn;

ref = require('kxk'), $ = ref.$, _ = ref._, clamp = ref.clamp, elem = ref.elem, empty = ref.empty, first = ref.first, kerror = ref.kerror, keyinfo = ref.keyinfo, klog = ref.klog, kpos = ref.kpos, popup = ref.popup, post = ref.post, slash = ref.slash, stopEvent = ref.stopEvent;

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
        this.onMouseOut = bind(this.onMouseOut, this);
        this.onMouseOver = bind(this.onMouseOver, this);
        this.onFocus = bind(this.onFocus, this);
        this.onNavigateIndexChanged = bind(this.onNavigateIndexChanged, this);
        this.onNavigateHistoryChanged = bind(this.onNavigateHistoryChanged, this);
        this.clearHistory = bind(this.clearHistory, this);
        this.toggleHistory = bind(this.toggleHistory, this);
        this.loadGitStatus = bind(this.loadGitStatus, this);
        this.onGitStatus = bind(this.onGitStatus, this);
        this.onDrop = bind(this.onDrop, this);
        this.addPath = bind(this.addPath, this);
        this.onFile = bind(this.onFile, this);
        this.makeRoot = bind(this.makeRoot, this);
        Shelf.__super__.constructor.call(this, browser);
        this.items = [];
        this.index = -1;
        this.div.id = 'shelf';
        this.showHistory = window.stash.get('shelf|history', false);
        post.on('gitStatus', this.onGitStatus);
        post.on('addToShelf', this.addPath);
        post.on('navigateHistoryChanged', this.onNavigateHistoryChanged);
        post.on('navigateIndexChanged', this.onNavigateIndexChanged);
        post.on('file', this.onFile);
    }

    Shelf.prototype.makeRoot = function() {
        return this.toggleHistory();
    };

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
        return setTimeout(this.loadGitStatus, 2000);
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

    Shelf.prototype.onGitStatus = function(gitDir, status) {
        var j, len, ref1, ref2, row;
        ref1 = this.rows;
        for (j = 0, len = ref1.length; j < len; j++) {
            row = ref1[j];
            if (gitDir.startsWith(row.path())) {
                if (row.item.type === 'dir') {
                    status = 'dirs';
                }
                if ((ref2 = $('.browserStatusIcon', row.div)) != null) {
                    ref2.remove();
                }
                row.div.appendChild(elem('span', {
                    "class": "git-" + status + "-icon browserStatusIcon"
                }));
                return;
            }
        }
    };

    Shelf.prototype.loadGitStatus = function() {
        var fileStatus, row, rows;
        rows = _.clone(this.rows);
        fileStatus = function(row, rows) {
            return (function(_this) {
                return function(status) {
                    var file, ref1, ref2;
                    ref1 = hub.statusFiles(status);
                    for (file in ref1) {
                        status = ref1[file];
                        if (file.startsWith(row.path())) {
                            if (row.item.type === 'dir') {
                                status = 'dirs';
                            }
                            if ((ref2 = $('.browserStatusIcon', row.div)) != null) {
                                ref2.remove();
                            }
                            row.div.appendChild(elem('span', {
                                "class": "git-" + status + "-icon browserStatusIcon"
                            }));
                            break;
                        }
                    }
                    if (rows.length) {
                        row = rows.shift();
                        return hub.status(row.path(), fileStatus(row, rows));
                    }
                };
            })(this);
        };
        row = rows.shift();
        return hub.status(row.path(), fileStatus(row, rows));
    };

    Shelf.prototype.toggleHistory = function() {
        this.showHistory = !this.showHistory;
        if (this.showHistory) {
            this.loadHistory();
        } else {
            this.removeHistory();
        }
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
        var ref1, reverseIndex;
        if (this.showHistory) {
            klog('onNavigateIndexChanged', currentIndex, currentItem);
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
        this.div.classList.add('focus');
        if (this.browser.shelfSize < 200) {
            return this.browser.setShelfSize(200);
        }
    };

    Shelf.prototype.onMouseOver = function(event) {
        var ref1;
        return (ref1 = this.row(event.target)) != null ? typeof ref1.onMouseOver === "function" ? ref1.onMouseOver() : void 0 : void 0;
    };

    Shelf.prototype.onMouseOut = function(event) {
        var ref1;
        return (ref1 = this.row(event.target)) != null ? typeof ref1.onMouseOut === "function" ? ref1.onMouseOut() : void 0 : void 0;
    };

    Shelf.prototype.onDblClick = function(event) {
        return this.navigateCols('enter');
    };

    Shelf.prototype.navigateRows = function(key) {
        var index, navigate, ref1, ref2, ref3, row;
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
            row = this.rows[index];
            row.setActive({
                emit: false
            });
            if (row.item.type === 'file') {
                return post.emit('jumpToFile', row.item);
            } else {
                return post.emit('filebrowser', 'loadItem', row.item, {
                    focus: false
                });
            }
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
        var nextOrPrev, ref1, ref2, row;
        row = (ref1 = this.activeRow()) != null ? ref1 : this.selectedRow();
        if (row) {
            if (this.showHistory) {
                if (row.item.type === 'historySeparator') {
                    this.toggleHistory();
                    return;
                }
                if (row.index() > this.historySeparatorIndex()) {
                    window.navigate.delFilePos(row.item);
                }
            }
            nextOrPrev = (ref2 = row.next()) != null ? ref2 : row.prev();
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
            case 'ctrl+e':
                this.toggleExtensions();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGYuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2Jyb3dzZXIiLCJzb3VyY2VzIjpbInNoZWxmLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSwwSUFBQTtJQUFBOzs7O0FBUUEsTUFBa0csT0FBQSxDQUFRLEtBQVIsQ0FBbEcsRUFBRSxTQUFGLEVBQUssU0FBTCxFQUFRLGlCQUFSLEVBQWUsZUFBZixFQUFxQixpQkFBckIsRUFBNEIsaUJBQTVCLEVBQW1DLG1CQUFuQyxFQUEyQyxxQkFBM0MsRUFBb0QsZUFBcEQsRUFBMEQsZUFBMUQsRUFBZ0UsaUJBQWhFLEVBQXVFLGVBQXZFLEVBQTZFLGlCQUE3RSxFQUFvRjs7QUFFcEYsR0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUNYLEdBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFFTDs7O0lBRUMsZUFBQyxPQUFEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBRUMsdUNBQU0sT0FBTjtRQUVBLElBQUMsQ0FBQSxLQUFELEdBQVU7UUFDVixJQUFDLENBQUEsS0FBRCxHQUFVLENBQUM7UUFDWCxJQUFDLENBQUEsR0FBRyxDQUFDLEVBQUwsR0FBVTtRQUVWLElBQUMsQ0FBQSxXQUFELEdBQWUsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFiLENBQWlCLGVBQWpCLEVBQWlDLEtBQWpDO1FBRWYsSUFBSSxDQUFDLEVBQUwsQ0FBUSxXQUFSLEVBQWlDLElBQUMsQ0FBQSxXQUFsQztRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsWUFBUixFQUFpQyxJQUFDLENBQUEsT0FBbEM7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLHdCQUFSLEVBQWlDLElBQUMsQ0FBQSx3QkFBbEM7UUFDQSxJQUFJLENBQUMsRUFB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aUIsSUFBQyxDQUFBLFlBQUQsQ0FBYyxHQUFkLENBQWpCO0FBaEJmLGlCQWlCUyxPQWpCVDtBQUFBLGlCQWlCaUIsV0FqQmpCO0FBQUEsaUJBaUI2QixPQWpCN0I7QUFrQlEsdUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFlBQUQsQ0FBQSxDQUFqQjtBQWxCZjtRQW9CQSxJQUFHLENBQUEsR0FBQSxLQUFRLE9BQVIsSUFBQSxHQUFBLEtBQWdCLEVBQWhCLENBQUEsSUFBd0IsSUFBM0I7WUFBcUMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLEVBQXJDOztRQUVBLElBQUcsSUFBQyxDQUFBLE9BQUo7bUJBQ0ksSUFBQyxDQUFBLG1CQUFELENBQXFCLEtBQXJCLEVBREo7O0lBNUJHOztvQkErQlAsT0FBQSxHQUFTLFNBQUMsS0FBRDtRQUVMLElBQUcsSUFBQyxDQUFBLE9BQUo7bUJBQ0ksSUFBQyxDQUFBLG1CQUFELENBQXFCLEtBQXJCLEVBREo7O0lBRks7Ozs7R0F2Y087O0FBNGNwQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICBcbjAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAgIFxuICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICBcbiMjI1xuXG57ICQsIF8sIGNsYW1wLCBlbGVtLCBlbXB0eSwgZmlyc3QsIGtlcnJvciwga2V5aW5mbywga2xvZywga3BvcywgcG9wdXAsIHBvc3QsIHNsYXNoLCBzdG9wRXZlbnQgfSA9IHJlcXVpcmUgJ2t4aydcblxuUm93ICAgICAgPSByZXF1aXJlICcuL3JvdydcblNjcm9sbGVyID0gcmVxdWlyZSAnLi9zY3JvbGxlcidcbkNvbHVtbiAgID0gcmVxdWlyZSAnLi9jb2x1bW4nXG5mdXp6eSAgICA9IHJlcXVpcmUgJ2Z1enp5J1xuaHViICAgICAgPSByZXF1aXJlICcuLi9naXQvaHViJ1xuICAgIFxuY2xhc3MgU2hlbGYgZXh0ZW5kcyBDb2x1bW5cblxuICAgIEA6IChicm93c2VyKSAtPlxuXG4gICAgICAgIHN1cGVyIGJyb3dzZXJcbiAgICAgICAgXG4gICAgICAgIEBpdGVtcyAgPSBbXVxuICAgICAgICBAaW5kZXggID0gLTFcbiAgICAgICAgQGRpdi5pZCA9ICdzaGVsZidcbiAgICAgICAgXG4gICAgICAgIEBzaG93SGlzdG9yeSA9IHdpbmRvdy5zdGFzaC5nZXQgJ3NoZWxmfGhpc3RvcnknIGZhbHNlXG5cbiAgICAgICAgcG9zdC5vbiAnZ2l0U3RhdHVzJyAgICAgICAgICAgICAgQG9uR2l0U3RhdHVzXG4gICAgICAgIHBvc3Qub24gJ2FkZFRvU2hlbGYnICAgICAgICAgICAgIEBhZGRQYXRoXG4gICAgICAgIHBvc3Qub24gJ25hdmlnYXRlSGlzdG9yeUNoYW5nZWQnIEBvbk5hdmlnYXRlSGlzdG9yeUNoYW5nZWRcbiAgICAgICAgcG9zdC5vbiAnbmF2aWdhdGVJbmRleENoYW5nZWQnICAgQG9uTmF2aWdhdGVJbmRleENoYW5nZWRcbiAgICAgICAgXG4gICAgICAgIHBvc3Qub24gJ2ZpbGUnIEBvbkZpbGVcbiAgICAgICBcbiAgICBtYWtlUm9vdDogPT4gQHRvZ2dsZUhpc3RvcnkoKVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICBcbiAgIFxuICAgIGFjdGl2YXRlUm93OiAocm93KSAtPiBcbiAgICAgICAgXG4gICAgICAgICQoJy5ob3ZlcicpPy5jbGFzc0xpc3QucmVtb3ZlICdob3ZlcidcbiAgICAgICAgXG4gICAgICAgIGl0ZW0gPSByb3cuaXRlbVxuICAgICAgICAgXG4gICAgICAgIGlmIGl0ZW0udHlwZSA9PSAnaGlzdG9yeVNlcGFyYXRvcidcbiAgICAgICAgICAgIHJvdy5zZXRBY3RpdmUgZW1pdDpmYWxzZVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICByb3cuc2V0QWN0aXZlIGVtaXQ6dHJ1ZVxuICAgICAgICBcbiAgICAgICAgaWYgaXRlbS50eXBlID09ICdmaWxlJ1xuICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG9GaWxlJyBpdGVtXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnZmlsZWJyb3dzZXInICdsb2FkSXRlbScgaXRlbVxuICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBvbkZpbGU6IChmaWxlKSA9PlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGZpbGVcbiAgICAgICAgaWYgQG5hdmlnYXRpbmdSb3dzXG4gICAgICAgICAgICBkZWxldGUgQG5hdmlnYXRpbmdSb3dzXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIGZvciBpbmRleCBpbiBbMC4uLkBpdGVtcy5sZW5ndGhdXG4gICAgICAgICAgICBpZiBAaXRlbXNbaW5kZXhdLmZpbGUgPT0gZmlsZVxuICAgICAgICAgICAgICAgIEByb3dzW2luZGV4XS5zZXRBY3RpdmUoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgbWF0Y2hlcyA9IFtdXG4gICAgICAgIGZvciBpbmRleCxpdGVtIG9mIEBpdGVtc1xuICAgICAgICAgICAgaWYgZmlsZT8uc3RhcnRzV2l0aCBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICBtYXRjaGVzLnB1c2ggW2luZGV4LCBpdGVtXVxuXG4gICAgICAgIGlmIG5vdCBlbXB0eSBtYXRjaGVzXG4gICAgICAgICAgICBtYXRjaGVzLnNvcnQgKGEsYikgLT4gYlsxXS5maWxlLmxlbmd0aCAtIGFbMV0uZmlsZS5sZW5ndGhcbiAgICAgICAgICAgIFtpbmRleCwgaXRlbV0gPSBmaXJzdCBtYXRjaGVzXG4gICAgICAgICAgICBAcm93c1tpbmRleF0uc2V0QWN0aXZlKClcblxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgYnJvd3NlckRpZEluaXRDb2x1bW5zOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIEBkaWRJbml0XG4gICAgICAgIFxuICAgICAgICBAZGlkSW5pdCA9IHRydWVcbiAgICAgICAgXG4gICAgICAgIEBsb2FkU2hlbGZJdGVtcygpXG4gICAgICAgIFxuICAgICAgICBAbG9hZEhpc3RvcnkoKSBpZiBAc2hvd0hpc3RvcnlcbiAgICAgICAgXG4gICAgICAgIHNldFRpbWVvdXQgQGxvYWRHaXRTdGF0dXMsIDIwMDBcbiAgICAgICAgICAgICAgICBcbiAgICBsb2FkU2hlbGZJdGVtczogLT5cbiAgICAgICAgXG4gICAgICAgIGl0ZW1zID0gd2luZG93LnN0YXRlLmdldCBcInNoZWxmfGl0ZW1zXCJcbiAgICAgICAgQHNldEl0ZW1zIGl0ZW1zLCBzYXZlOmZhbHNlXG4gICAgICAgICAgICAgICAgXG4gICAgYWRkUGF0aDogKHBhdGgsIG9wdCkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmlzRGlyIHBhdGhcbiAgICAgICAgICAgIEBhZGREaXIgcGF0aCwgb3B0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBhZGRGaWxlIHBhdGgsIG9wdFxuICAgICAgICBcbiAgICAjIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG4gICAgaXRlbVBhdGhzOiAtPiBAcm93cy5tYXAgKHIpIC0+IHIucGF0aCgpXG4gICAgXG4gICAgc2F2ZVByZWZzOiAtPiB3aW5kb3cuc3RhdGUuc2V0IFwic2hlbGZ8aXRlbXNcIiBAaXRlbXNcbiAgICAgICAgIyBwcmVmcy5zZXQgXCJzaGVsZuKWuGl0ZW1zXCIgQGl0ZW1zXG4gICAgXG4gICAgc2V0SXRlbXM6IChAaXRlbXMsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjbGVhcigpXG4gICAgICAgIFxuICAgICAgICBAaXRlbXMgPz0gW11cbiAgICAgICAgQGFkZEl0ZW1zIEBpdGVtc1xuICAgICAgICBcbiAgICAgICAgaWYgb3B0Py5zYXZlICE9IGZhbHNlXG4gICAgICAgICAgICBAc2F2ZVByZWZzKCkgICAgICAgICAgICBcbiAgICAgICAgQFxuICAgICAgICBcbiAgICBhZGRJdGVtczogKGl0ZW1zLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgZW1wdHkgaXRlbXNcbiAgICAgICAgXG4gICAgICAgIGZvciBpdGVtIGluIGl0ZW1zXG4gICAgICAgICAgICBAcm93cy5wdXNoIG5ldyBSb3cgQCwgaXRlbVxuICAgICAgICAgICAgXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgQFxuICAgICAgICBcbiAgICBhZGREaXI6IChkaXIsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIGl0ZW0gPSBcbiAgICAgICAgICAgIG5hbWU6IHNsYXNoLmZpbGUgc2xhc2gudGlsZGUgZGlyXG4gICAgICAgICAgICB0eXBlOiAnZGlyJ1xuICAgICAgICAgICAgZmlsZTogc2xhc2gucGF0aCBkaXJcbiAgICAgICAgXG4gICAgICAgIEBhZGRJdGVtIGl0ZW0sIG9wdFxuXG4gICAgYWRkRmlsZTogKGZpbGUsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIGl0ZW0gPSBcbiAgICAgICAgICAgIG5hbWU6IHNsYXNoLmZpbGUgZmlsZVxuICAgICAgICAgICAgdHlwZTogJ2ZpbGUnXG4gICAgICAgICAgICBmaWxlOiBzbGFzaC5wYXRoIGZpbGVcbiAgICAgICAgaXRlbS50ZXh0RmlsZSA9IHRydWUgaWYgc2xhc2guaXNUZXh0IGZpbGVcbiAgICAgICAgQGFkZEl0ZW0gaXRlbSwgb3B0XG4gICAgICAgIFxuICAgIGFkZEZpbGVzOiAoZmlsZXMsIG9wdCkgLT5cbiAgICAgICAgZm9yIGZpbGUgaW4gZmlsZXNcbiAgICAgICAgICAgIGlmIHNsYXNoLmlzRGlyIGZpbGVcbiAgICAgICAgICAgICAgICBAYWRkRGlyIGZpbGUsIG9wdFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBhZGRGaWxlIGZpbGUsIG9wdFxuICAgICAgICBcbiAgICBhZGRJdGVtOiAgKGl0ZW0sIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIF8ucHVsbEFsbFdpdGggQGl0ZW1zLCBbaXRlbV0sIF8uaXNFcXVhbCAjIHJlbW92ZSBpdGVtIGlmIG9uIHNoZWxmIGFscmVhZHlcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdD8ucG9zXG4gICAgICAgICAgICBpbmRleCA9IEByb3dJbmRleEF0UG9zIG9wdC5wb3NcbiAgICAgICAgICAgIEBpdGVtcy5zcGxpY2UgTWF0aC5taW4oaW5kZXgsIEBpdGVtcy5sZW5ndGgpLCAwLCBpdGVtXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBpdGVtcy5wdXNoIGl0ZW1cbiAgICAgICAgICAgIFxuICAgICAgICBAc2V0SXRlbXMgQGl0ZW1zXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBvbkRyb3A6IChldmVudCkgPT4gXG4gICAgXG4gICAgICAgIGFjdGlvbiA9IGV2ZW50LmdldE1vZGlmaWVyU3RhdGUoJ1NoaWZ0JykgYW5kICdjb3B5JyBvciAnbW92ZSdcbiAgICAgICAgc291cmNlID0gZXZlbnQuZGF0YVRyYW5zZmVyLmdldERhdGEgJ3RleHQvcGxhaW4nXG4gICAgICAgIFxuICAgICAgICBpdGVtID0gQGJyb3dzZXIuZmlsZUl0ZW0gc291cmNlXG4gICAgICAgIEBhZGRJdGVtIGl0ZW0sIHBvczprcG9zIGV2ZW50XG4gICAgXG4gICAgaXNFbXB0eTogLT4gZW1wdHkgQHJvd3NcbiAgICBcbiAgICBjbGVhcjogLT5cbiAgICAgICAgXG4gICAgICAgIEBjbGVhclNlYXJjaCgpXG4gICAgICAgIEBkaXYuc2Nyb2xsVG9wID0gMFxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgQHJvd3MgPSBbXVxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIG5hbWU6IC0+ICdzaGVsZidcblxuICAgICMgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICBcblxuICAgIG9uR2l0U3RhdHVzOiAoZ2l0RGlyLCBzdGF0dXMpID0+XG4gICAgICAgIFxuICAgICAgICAjIGxvZyAnb25HaXRTdGF0dXMnIGdpdERpciwgc3RhdHVzXG4gICAgICAgIFxuICAgICAgICBmb3Igcm93IGluIEByb3dzXG4gICAgICAgICAgICBpZiBnaXREaXIuc3RhcnRzV2l0aCByb3cucGF0aCgpXG4gICAgICAgICAgICAgICAgaWYgcm93Lml0ZW0udHlwZSA9PSAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMgPSAnZGlycydcbiAgICAgICAgICAgICAgICAkKCcuYnJvd3NlclN0YXR1c0ljb24nLCByb3cuZGl2KT8ucmVtb3ZlKClcbiAgICAgICAgICAgICAgICByb3cuZGl2LmFwcGVuZENoaWxkIGVsZW0gJ3NwYW4nLCBjbGFzczpcImdpdC0je3N0YXR1c30taWNvbiBicm93c2VyU3RhdHVzSWNvblwiXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgIGxvYWRHaXRTdGF0dXM6ID0+XG4gICAgICAgIFxuICAgICAgICByb3dzID0gXy5jbG9uZSBAcm93c1xuICAgICAgICBcbiAgICAgICAgZmlsZVN0YXR1cyA9IChyb3csIHJvd3MpIC0+IChzdGF0dXMpID0+XG4gICAgICAgICAgICBmb3IgZmlsZSwgc3RhdHVzIG9mIGh1Yi5zdGF0dXNGaWxlcyBzdGF0dXNcbiAgICAgICAgICAgICAgICBpZiBmaWxlLnN0YXJ0c1dpdGggcm93LnBhdGgoKVxuICAgICAgICAgICAgICAgICAgICBpZiByb3cuaXRlbS50eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXMgPSAnZGlycydcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJyb3dzZXJTdGF0dXNJY29uJywgcm93LmRpdik/LnJlbW92ZSgpXG4gICAgICAgICAgICAgICAgICAgIHJvdy5kaXYuYXBwZW5kQ2hpbGQgZWxlbSAnc3BhbicsIGNsYXNzOlwiZ2l0LSN7c3RhdHVzfS1pY29uIGJyb3dzZXJTdGF0dXNJY29uXCJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGlmIHJvd3MubGVuZ3RoXG4gICAgICAgICAgICAgICAgcm93ID0gcm93cy5zaGlmdCgpXG4gICAgICAgICAgICAgICAgaHViLnN0YXR1cyByb3cucGF0aCgpLCBmaWxlU3RhdHVzIHJvdywgcm93c1xuICAgICAgICBcbiAgICAgICAgcm93ID0gcm93cy5zaGlmdCgpXG4gICAgICAgIGh1Yi5zdGF0dXMgcm93LnBhdGgoKSwgZmlsZVN0YXR1cyByb3csIHJvd3NcblxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHRvZ2dsZUhpc3Rvcnk6ID0+XG4gICAgICAgIFxuICAgICAgICBAc2hvd0hpc3RvcnkgPSBub3QgQHNob3dIaXN0b3J5XG4gICAgICAgIGlmIEBzaG93SGlzdG9yeVxuICAgICAgICAgICAgQGxvYWRIaXN0b3J5KClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHJlbW92ZUhpc3RvcnkoKVxuICAgICAgICB3aW5kb3cuc3Rhc2guc2V0ICdzaGVsZnxoaXN0b3J5JyBAc2hvd0hpc3RvcnlcbiAgICAgICAgXG4gICAgY2xlYXJIaXN0b3J5OiA9PlxuICAgICAgICBcbiAgICAgICAgd2luZG93Lm5hdmlnYXRlLmNsZWFyKClcbiAgICAgICAgaWYgQHNob3dIaXN0b3J5IHRoZW4gQHNldEhpc3RvcnlJdGVtcyBbXG4gICAgICAgICAgICBmaWxlOiAgIHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgICAgIHBvczogICAgd2luZG93LmVkaXRvci5tYWluQ3Vyc29yKClcbiAgICAgICAgICAgIHRleHQ6ICAgc2xhc2guZmlsZSB3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgaGlzdG9yeVNlcGFyYXRvckluZGV4OiAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5AbnVtUm93cygpXVxuICAgICAgICAgICAgaWYgQHJvdyhpKS5pdGVtLnR5cGUgPT0gJ2hpc3RvcnlTZXBhcmF0b3InXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlcbiAgICAgICAgcmV0dXJuIEBudW1Sb3dzKClcbiAgICAgICAgXG4gICAgcmVtb3ZlSGlzdG9yeTogLT5cbiAgICAgICAgXG4gICAgICAgIHNlcGFyYXRvckluZGV4ID0gQGhpc3RvcnlTZXBhcmF0b3JJbmRleCgpXG4gICAgICAgIHdoaWxlIEBudW1Sb3dzKCkgYW5kIEBudW1Sb3dzKCkgPiBzZXBhcmF0b3JJbmRleFxuICAgICAgICAgICAgQHJlbW92ZVJvdyBAcm93KEBudW1Sb3dzKCktMSlcblxuICAgIG9uTmF2aWdhdGVIaXN0b3J5Q2hhbmdlZDogKGZpbGVQb3NpdGlvbnMsIGN1cnJlbnRJbmRleCkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBzaG93SGlzdG9yeVxuICAgICAgICAgICAgQHNldEhpc3RvcnlJdGVtcyBmaWxlUG9zaXRpb25zXG5cbiAgICBvbk5hdmlnYXRlSW5kZXhDaGFuZ2VkOiAoY3VycmVudEluZGV4LCBjdXJyZW50SXRlbSkgPT5cblxuICAgICAgICBpZiBAc2hvd0hpc3RvcnlcbiAgICAgICAgICAgIGtsb2cgJ29uTmF2aWdhdGVJbmRleENoYW5nZWQnIGN1cnJlbnRJbmRleCwgY3VycmVudEl0ZW1cbiAgICAgICAgICAgIHJldmVyc2VJbmRleCA9IEBudW1Sb3dzKCkgLSBjdXJyZW50SW5kZXggLSAxXG4gICAgICAgICAgICAjIGlmIGN1cnJlbnRJdGVtLmZpbGUgIT0gQGFjdGl2ZVJvdygpPy5pdGVtLmZpbGVcbiAgICAgICAgICAgIEByb3cocmV2ZXJzZUluZGV4KT8uc2V0QWN0aXZlKClcbiAgICAgICAgICAgIFxuICAgIGxvYWRIaXN0b3J5OiAtPlxuICAgICAgICBcbiAgICAgICAgQHNldEhpc3RvcnlJdGVtcyBwb3N0LmdldCAnbmF2aWdhdGUnLCAnZmlsZVBvc2l0aW9ucydcblxuICAgIHNldEhpc3RvcnlJdGVtczogKGl0ZW1zKSAtPlxuICAgIFxuICAgICAgICBAcmVtb3ZlSGlzdG9yeSgpXG4gICAgICAgIFxuICAgICAgICBpdGVtcy5tYXAgKGgpIC0+IFxuICAgICAgICAgICAgaC50eXBlID0gJ2ZpbGUnXG4gICAgICAgICAgICBoLnRleHQgPSBzbGFzaC5yZW1vdmVDb2x1bW4gaC50ZXh0XG4gICAgICAgIGl0ZW1zLnJldmVyc2UoKVxuICAgICAgICBcbiAgICAgICAgaXRlbXMudW5zaGlmdFxuICAgICAgICAgICAgdHlwZTogJ2hpc3RvcnlTZXBhcmF0b3InXG4gICAgICAgICAgICBpY29uOiAnaGlzdG9yeS1pY29uJ1xuICAgICAgICBcbiAgICAgICAgQGFkZEl0ZW1zIGl0ZW1zXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgb25Gb2N1czogPT4gXG5cbiAgICAgICAgQGRpdi5jbGFzc0xpc3QuYWRkICdmb2N1cydcbiAgICAgICAgaWYgQGJyb3dzZXIuc2hlbGZTaXplIDwgMjAwXG4gICAgICAgICAgICBAYnJvd3Nlci5zZXRTaGVsZlNpemUgMjAwXG4gICAgICAgICAgICBcbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG9uTW91c2VPdmVyOiAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8ub25Nb3VzZU92ZXI/KClcbiAgICBvbk1vdXNlT3V0OiAgKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/Lm9uTW91c2VPdXQ/KClcbiAgICBvbkRibENsaWNrOiAgKGV2ZW50KSA9PiBAbmF2aWdhdGVDb2xzICdlbnRlcidcblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcblxuICAgIG5hdmlnYXRlUm93czogKGtleSkgLT5cblxuICAgICAgICByZXR1cm4ga2Vycm9yIFwibm8gcm93cyBpbiBjb2x1bW4gI3tAaW5kZXh9P1wiIGlmIG5vdCBAbnVtUm93cygpXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gLTFcbiAgICAgICAga2Vycm9yIFwibm8gaW5kZXggZnJvbSBhY3RpdmVSb3c/ICN7aW5kZXh9P1wiLCBAYWN0aXZlUm93KCkgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAndXAnICAgICAgICB0aGVuIGluZGV4LTFcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nICAgICAgdGhlbiBpbmRleCsxXG4gICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gMFxuICAgICAgICAgICAgd2hlbiAnZW5kJyAgICAgICB0aGVuIEBpdGVtcy5sZW5ndGhcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICAgdGhlbiBpbmRleC1AbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gY2xhbXAgMCwgQGl0ZW1zLmxlbmd0aCwgaW5kZXgrQG51bVZpc2libGUoKVxuICAgICAgICAgICAgZWxzZSBpbmRleFxuICAgICAgICAgICAgXG4gICAgICAgIGtlcnJvciBcIm5vIGluZGV4ICN7aW5kZXh9PyAje0BudW1WaXNpYmxlKCl9XCIgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXggICAgICAgIFxuICAgICAgICBpbmRleCA9IGNsYW1wIDAsIEBudW1Sb3dzKCktMSwgaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGtlcnJvciBcIm5vIHJvdyBhdCBpbmRleCAje2luZGV4fS8je0BudW1Sb3dzKCktMX0/XCIsIEBudW1Sb3dzKCkgaWYgbm90IEByb3dzW2luZGV4XT8uYWN0aXZhdGU/XG5cbiAgICAgICAgbmF2aWdhdGUgPSAoYWN0aW9uKSA9PlxuICAgICAgICAgICAgQG5hdmlnYXRpbmdSb3dzID0gdHJ1ZVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdtZW51QWN0aW9uJyBhY3Rpb25cbiAgICAgICAgXG4gICAgICAgIGlmICAgICAga2V5ID09ICd1cCcgICBhbmQgaW5kZXggPiBAaXRlbXMubGVuZ3RoICAgICB0aGVuIG5hdmlnYXRlICdOYXZpZ2F0ZSBGb3J3YXJkJ1xuICAgICAgICBlbHNlIGlmIGtleSA9PSAnZG93bicgYW5kIGluZGV4ID4gQGl0ZW1zLmxlbmd0aCArIDEgdGhlbiBuYXZpZ2F0ZSAnTmF2aWdhdGUgQmFja3dhcmQnXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJvdyA9IEByb3dzW2luZGV4XVxuICAgICAgICAgICAgcm93LnNldEFjdGl2ZSBlbWl0OmZhbHNlXG4gICAgICAgICAgICBpZiByb3cuaXRlbS50eXBlID09ICdmaWxlJ1xuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvRmlsZScgcm93Lml0ZW1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2ZpbGVicm93c2VyJyAnbG9hZEl0ZW0nIHJvdy5pdGVtLCBmb2N1czpmYWxzZVxuICAgIFxuICAgIG9wZW5GaWxlSW5OZXdXaW5kb3c6IC0+ICBcbiAgICAgICAgXG4gICAgICAgIGlmIGl0ZW0gPSBAYWN0aXZlUm93KCk/Lml0ZW1cbiAgICAgICAgICAgIGlmIGl0ZW0udHlwZSA9PSAnZmlsZScgYW5kIGl0ZW0udGV4dEZpbGVcbiAgICAgICAgICAgICAgICB3aW5kb3cub3BlbkZpbGVzIFtpdGVtLmZpbGVdLCBuZXdXaW5kb3c6IHRydWVcbiAgICAgICAgQFxuICAgIFxuICAgIHJlbW92ZU9iamVjdDogPT5cbiAgICAgICAgXG4gICAgICAgIHJvdyA9IEBhY3RpdmVSb3coKSA/IEBzZWxlY3RlZFJvdygpXG4gICAgICAgIFxuICAgICAgICBpZiByb3dcbiAgICAgICAgICAgIGlmIEBzaG93SGlzdG9yeVxuICAgICAgICAgICAgICAgIGlmIHJvdy5pdGVtLnR5cGUgPT0gJ2hpc3RvcnlTZXBhcmF0b3InXG4gICAgICAgICAgICAgICAgICAgIEB0b2dnbGVIaXN0b3J5KClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgaWYgcm93LmluZGV4KCkgPiBAaGlzdG9yeVNlcGFyYXRvckluZGV4KClcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lm5hdmlnYXRlLmRlbEZpbGVQb3Mgcm93Lml0ZW1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIG5leHRPclByZXYgPSByb3cubmV4dCgpID8gcm93LnByZXYoKVxuICAgICAgICAgICAgcm93LmRpdi5yZW1vdmUoKVxuICAgICAgICAgICAgQGl0ZW1zLnNwbGljZSByb3cuaW5kZXgoKSwgMVxuICAgICAgICAgICAgQHJvd3Muc3BsaWNlIHJvdy5pbmRleCgpLCAxXG4gICAgICAgICAgICBuZXh0T3JQcmV2Py5hY3RpdmF0ZSgpXG4gICAgICAgICAgICBAc2F2ZVByZWZzKClcbiAgICAgICAgQFxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgXG4gICAgXG4gICAgc2hvd0NvbnRleHRNZW51OiAoYWJzUG9zKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGFic1Bvcz9cbiAgICAgICAgICAgIGFic1BvcyA9IHBvcyBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0LCBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3BcbiAgICAgICAgXG4gICAgICAgIG9wdCA9IGl0ZW1zOiBbIFxuICAgICAgICAgICAgdGV4dDogICAnVG9nZ2xlIEhpc3RvcnknXG4gICAgICAgICAgICBjb21ibzogICdhbHQraCcgXG4gICAgICAgICAgICBjYjogICAgIEB0b2dnbGVIaXN0b3J5XG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ1RvZ2dsZSBFeHRlbnNpb25zJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQHRvZ2dsZUV4dGVuc2lvbnNcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnUmVtb3ZlJ1xuICAgICAgICAgICAgY29tYm86ICAnYmFja3NwYWNlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQHJlbW92ZU9iamVjdFxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdDbGVhciBIaXN0b3J5J1xuICAgICAgICAgICAgY2I6ICAgICBAY2xlYXJIaXN0b3J5XG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgb3B0LnkgPSBhYnNQb3MueVxuICAgICAgICBwb3B1cC5tZW51IG9wdFxuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIG9uS2V5OiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciB9ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuICAgICAgICBcbiAgICAgICAgIyBrbG9nICdjb21ibzonIGNvbWJvXG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrZW50ZXInICdjdHJsK2VudGVyJyB0aGVuIHJldHVybiBAb3BlbkZpbGVJbk5ld1dpbmRvdygpXG4gICAgICAgICAgICB3aGVuICdiYWNrc3BhY2UnICdkZWxldGUnIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGNsZWFyU2VhcmNoKCkucmVtb3ZlT2JqZWN0KClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQraycgJ2N0cmwraycgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50IGlmIEBicm93c2VyLmNsZWFuVXAoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCtlJyB0aGVuIEB0b2dnbGVFeHRlbnNpb25zKClcbiAgICAgICAgICAgIHdoZW4gJ3RhYicgICAgXG4gICAgICAgICAgICAgICAgaWYgQHNlYXJjaC5sZW5ndGggdGhlbiBAZG9TZWFyY2ggJydcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICB3aGVuICdlc2MnXG4gICAgICAgICAgICAgICAgaWYgQGRyYWdEaXZcbiAgICAgICAgICAgICAgICAgICAgQGRyYWdEaXYuZHJhZy5kcmFnU3RvcCgpXG4gICAgICAgICAgICAgICAgICAgIEBkcmFnRGl2LnJlbW92ZSgpXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBAZHJhZ0RpdlxuICAgICAgICAgICAgICAgIGlmIEBzZWFyY2gubGVuZ3RoIHRoZW4gQGNsZWFyU2VhcmNoKClcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICB3aGVuICd1cCcgJ2Rvd24nICdwYWdlIHVwJyAncGFnZSBkb3duJyAnaG9tZScgJ2VuZCcgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyBrZXlcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyAnYWx0K3JpZ2h0JyAnZW50ZXInXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGZvY3VzQnJvd3NlcigpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG1vZCBpbiBbJ3NoaWZ0JyAnJ10gYW5kIGNoYXIgdGhlbiBAZG9TZWFyY2ggY2hhclxuICAgICAgICBcbiAgICAgICAgaWYgQGRyYWdEaXZcbiAgICAgICAgICAgIEB1cGRhdGVEcmFnSW5kaWNhdG9yIGV2ZW50XG4gICAgICAgICAgICBcbiAgICBvbktleVVwOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgQHVwZGF0ZURyYWdJbmRpY2F0b3IgZXZlbnRcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFNoZWxmXG4iXX0=
//# sourceURL=../../coffee/browser/shelf.coffee