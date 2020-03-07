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
        this.makeRoot = bind(this.makeRoot, this);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGYuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2Jyb3dzZXIiLCJzb3VyY2VzIjpbInNoZWxmLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxvSUFBQTtJQUFBOzs7O0FBUUEsTUFBNEYsT0FBQSxDQUFRLEtBQVIsQ0FBNUYsRUFBRSxTQUFGLEVBQUssU0FBTCxFQUFRLGlCQUFSLEVBQWUsZUFBZixFQUFxQixpQkFBckIsRUFBNEIsaUJBQTVCLEVBQW1DLG1CQUFuQyxFQUEyQyxxQkFBM0MsRUFBb0QsZUFBcEQsRUFBMEQsaUJBQTFELEVBQWlFLGVBQWpFLEVBQXVFLGlCQUF2RSxFQUE4RTs7QUFFOUUsR0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUNYLEdBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFFTDs7O0lBRUMsZUFBQyxPQUFEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBRUMsdUNBQU0sT0FBTjtRQUVBLElBQUMsQ0FBQSxLQUFELEdBQVU7UUFDVixJQUFDLENBQUEsS0FBRCxHQUFVLENBQUM7UUFDWCxJQUFDLENBQUEsR0FBRyxDQUFDLEVBQUwsR0FBVTtRQUVWLElBQUMsQ0FBQSxXQUFELEdBQWUsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFiLENBQWlCLGVBQWpCLEVBQWlDLEtBQWpDO1FBRWYsSUFBSSxDQUFDLEVBQUwsQ0FBUSxXQUFSLEVBQWlDLElBQUMsQ0FBQSxhQUFsQztRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsWUFBUixFQUFpQyxJQUFDLENBQUEsT0FBbEM7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLHdCQUFSLEVBQWlDLElBQUMsQ0FBQSx3QkFBbEM7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLHNCQUFS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QXVCLElBQUMsQ0FBQSxXQUFELENBQUEsRUFBdkI7O0FBQ0EsdUJBQU8sU0FBQSxDQUFVLEtBQVY7QUFiZixpQkFjUyxJQWRUO0FBQUEsaUJBY2MsTUFkZDtBQUFBLGlCQWNxQixTQWRyQjtBQUFBLGlCQWMrQixXQWQvQjtBQUFBLGlCQWMyQyxNQWQzQztBQUFBLGlCQWNrRCxLQWRsRDtBQWVRLHVCQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxZQUFELENBQWMsR0FBZCxDQUFqQjtBQWZmLGlCQWdCUyxPQWhCVDtBQUFBLGlCQWdCaUIsV0FoQmpCO0FBQUEsaUJBZ0I2QixPQWhCN0I7QUFpQlEsdUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFlBQUQsQ0FBQSxDQUFqQjtBQWpCZjtRQW1CQSxJQUFHLENBQUEsR0FBQSxLQUFRLE9BQVIsSUFBQSxHQUFBLEtBQWdCLEVBQWhCLENBQUEsSUFBd0IsSUFBM0I7WUFBcUMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLEVBQXJDOztRQUVBLElBQUcsSUFBQyxDQUFBLE9BQUo7bUJBQ0ksSUFBQyxDQUFBLG1CQUFELENBQXFCLEtBQXJCLEVBREo7O0lBekJHOztvQkE0QlAsT0FBQSxHQUFTLFNBQUMsS0FBRDtRQUVMLElBQUcsSUFBQyxDQUFBLE9BQUo7bUJBQ0ksSUFBQyxDQUFBLG1CQUFELENBQXFCLEtBQXJCLEVBREo7O0lBRks7Ozs7R0FoYk87O0FBcWJwQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICBcbjAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAgIFxuICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICBcbiMjI1xuXG57ICQsIF8sIGNsYW1wLCBlbGVtLCBlbXB0eSwgZmlyc3QsIGtlcnJvciwga2V5aW5mbywga3BvcywgcG9wdXAsIHBvc3QsIHNsYXNoLCBzdG9wRXZlbnQgfSA9IHJlcXVpcmUgJ2t4aydcblxuUm93ICAgICAgPSByZXF1aXJlICcuL3JvdydcblNjcm9sbGVyID0gcmVxdWlyZSAnLi9zY3JvbGxlcidcbkNvbHVtbiAgID0gcmVxdWlyZSAnLi9jb2x1bW4nXG5mdXp6eSAgICA9IHJlcXVpcmUgJ2Z1enp5J1xuaHViICAgICAgPSByZXF1aXJlICcuLi9naXQvaHViJ1xuICAgIFxuY2xhc3MgU2hlbGYgZXh0ZW5kcyBDb2x1bW5cblxuICAgIEA6IChicm93c2VyKSAtPlxuXG4gICAgICAgIHN1cGVyIGJyb3dzZXJcbiAgICAgICAgXG4gICAgICAgIEBpdGVtcyAgPSBbXVxuICAgICAgICBAaW5kZXggID0gLTFcbiAgICAgICAgQGRpdi5pZCA9ICdzaGVsZidcbiAgICAgICAgXG4gICAgICAgIEBzaG93SGlzdG9yeSA9IHdpbmRvdy5zdGFzaC5nZXQgJ3NoZWxmfGhpc3RvcnknIGZhbHNlXG5cbiAgICAgICAgcG9zdC5vbiAnZ2l0U3RhdHVzJyAgICAgICAgICAgICAgQGxvYWRHaXRTdGF0dXNcbiAgICAgICAgcG9zdC5vbiAnYWRkVG9TaGVsZicgICAgICAgICAgICAgQGFkZFBhdGhcbiAgICAgICAgcG9zdC5vbiAnbmF2aWdhdGVIaXN0b3J5Q2hhbmdlZCcgQG9uTmF2aWdhdGVIaXN0b3J5Q2hhbmdlZFxuICAgICAgICBwb3N0Lm9uICduYXZpZ2F0ZUluZGV4Q2hhbmdlZCcgICBAb25OYXZpZ2F0ZUluZGV4Q2hhbmdlZFxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnZmlsZScgQG9uRmlsZVxuICAgICAgIFxuICAgIG1ha2VSb290OiA9PiBAdG9nZ2xlSGlzdG9yeSgpXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIFxuICAgXG4gICAgYWN0aXZhdGVSb3c6IChyb3cpIC0+IFxuICAgICAgICBcbiAgICAgICAgJCgnLmhvdmVyJyk/LmNsYXNzTGlzdC5yZW1vdmUgJ2hvdmVyJ1xuICAgICAgICBcbiAgICAgICAgaXRlbSA9IHJvdy5pdGVtXG4gICAgICAgICBcbiAgICAgICAgaWYgaXRlbS50eXBlID09ICdoaXN0b3J5U2VwYXJhdG9yJ1xuICAgICAgICAgICAgcm93LnNldEFjdGl2ZSBlbWl0OmZhbHNlXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIHJvdy5zZXRBY3RpdmUgZW1pdDp0cnVlXG4gICAgICAgIFxuICAgICAgICBpZiBpdGVtLnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUb0ZpbGUnIGl0ZW1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdmaWxlYnJvd3NlcicgJ2xvYWRJdGVtJyBpdGVtXG4gICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgICAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG9uRmlsZTogKGZpbGUpID0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgZW1wdHkgZmlsZVxuICAgICAgICBpZiBAbmF2aWdhdGluZ1Jvd3NcbiAgICAgICAgICAgIGRlbGV0ZSBAbmF2aWdhdGluZ1Jvd3NcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgZm9yIGluZGV4IGluIFswLi4uQGl0ZW1zLmxlbmd0aF1cbiAgICAgICAgICAgIGlmIEBpdGVtc1tpbmRleF0uZmlsZSA9PSBmaWxlXG4gICAgICAgICAgICAgICAgQHJvd3NbaW5kZXhdLnNldEFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBtYXRjaGVzID0gW11cbiAgICAgICAgZm9yIGluZGV4LGl0ZW0gb2YgQGl0ZW1zXG4gICAgICAgICAgICBpZiBmaWxlPy5zdGFydHNXaXRoIGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgIG1hdGNoZXMucHVzaCBbaW5kZXgsIGl0ZW1dXG5cbiAgICAgICAgaWYgbm90IGVtcHR5IG1hdGNoZXNcbiAgICAgICAgICAgIG1hdGNoZXMuc29ydCAoYSxiKSAtPiBiWzFdLmZpbGUubGVuZ3RoIC0gYVsxXS5maWxlLmxlbmd0aFxuICAgICAgICAgICAgW2luZGV4LCBpdGVtXSA9IGZpcnN0IG1hdGNoZXNcbiAgICAgICAgICAgIEByb3dzW2luZGV4XS5zZXRBY3RpdmUoKVxuXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBicm93c2VyRGlkSW5pdENvbHVtbnM6IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgQGRpZEluaXRcbiAgICAgICAgXG4gICAgICAgIEBkaWRJbml0ID0gdHJ1ZVxuICAgICAgICBcbiAgICAgICAgQGxvYWRTaGVsZkl0ZW1zKClcbiAgICAgICAgXG4gICAgICAgIEBsb2FkSGlzdG9yeSgpIGlmIEBzaG93SGlzdG9yeVxuICAgICAgICBcbiAgICAgICAgQGxvYWRHaXRTdGF0dXMoKVxuICAgICAgICAgICAgICAgIFxuICAgIGxvYWRTaGVsZkl0ZW1zOiAtPlxuICAgICAgICBcbiAgICAgICAgaXRlbXMgPSB3aW5kb3cuc3RhdGUuZ2V0IFwic2hlbGZ8aXRlbXNcIlxuICAgICAgICBAc2V0SXRlbXMgaXRlbXMsIHNhdmU6ZmFsc2VcbiAgICAgICAgICAgICAgICBcbiAgICBhZGRQYXRoOiAocGF0aCwgb3B0KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgc2xhc2guaXNEaXIgcGF0aFxuICAgICAgICAgICAgQGFkZERpciBwYXRoLCBvcHRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGFkZEZpbGUgcGF0aCwgb3B0XG4gICAgICAgIFxuICAgICMgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbiAgICBpdGVtUGF0aHM6IC0+IEByb3dzLm1hcCAocikgLT4gci5wYXRoKClcbiAgICBcbiAgICBzYXZlUHJlZnM6IC0+IHdpbmRvdy5zdGF0ZS5zZXQgXCJzaGVsZnxpdGVtc1wiIEBpdGVtc1xuICAgICAgICAjIHByZWZzLnNldCBcInNoZWxm4pa4aXRlbXNcIiBAaXRlbXNcbiAgICBcbiAgICBzZXRJdGVtczogKEBpdGVtcywgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgQGNsZWFyKClcbiAgICAgICAgXG4gICAgICAgIEBpdGVtcyA/PSBbXVxuICAgICAgICBAYWRkSXRlbXMgQGl0ZW1zXG4gICAgICAgIFxuICAgICAgICBpZiBvcHQ/LnNhdmUgIT0gZmFsc2VcbiAgICAgICAgICAgIEBzYXZlUHJlZnMoKSAgICAgICAgICAgIFxuICAgICAgICBAXG4gICAgICAgIFxuICAgIGFkZEl0ZW1zOiAoaXRlbXMsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBpdGVtc1xuICAgICAgICBcbiAgICAgICAgZm9yIGl0ZW0gaW4gaXRlbXNcbiAgICAgICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgICAgICBcbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgIGFkZERpcjogKGRpciwgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgaXRlbSA9IFxuICAgICAgICAgICAgbmFtZTogc2xhc2guZmlsZSBzbGFzaC50aWxkZSBkaXJcbiAgICAgICAgICAgIHR5cGU6ICdkaXInXG4gICAgICAgICAgICBmaWxlOiBzbGFzaC5wYXRoIGRpclxuICAgICAgICBcbiAgICAgICAgQGFkZEl0ZW0gaXRlbSwgb3B0XG5cbiAgICBhZGRGaWxlOiAoZmlsZSwgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgaXRlbSA9IFxuICAgICAgICAgICAgbmFtZTogc2xhc2guZmlsZSBmaWxlXG4gICAgICAgICAgICB0eXBlOiAnZmlsZSdcbiAgICAgICAgICAgIGZpbGU6IHNsYXNoLnBhdGggZmlsZVxuICAgICAgICBpdGVtLnRleHRGaWxlID0gdHJ1ZSBpZiBzbGFzaC5pc1RleHQgZmlsZVxuICAgICAgICBAYWRkSXRlbSBpdGVtLCBvcHRcbiAgICAgICAgXG4gICAgYWRkRmlsZXM6IChmaWxlcywgb3B0KSAtPlxuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlc1xuICAgICAgICAgICAgaWYgc2xhc2guaXNEaXIgZmlsZVxuICAgICAgICAgICAgICAgIEBhZGREaXIgZmlsZSwgb3B0XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGFkZEZpbGUgZmlsZSwgb3B0XG4gICAgICAgIFxuICAgIGFkZEl0ZW06ICAoaXRlbSwgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgXy5wdWxsQWxsV2l0aCBAaXRlbXMsIFtpdGVtXSwgXy5pc0VxdWFsICMgcmVtb3ZlIGl0ZW0gaWYgb24gc2hlbGYgYWxyZWFkeVxuICAgICAgICBcbiAgICAgICAgaWYgb3B0Py5wb3NcbiAgICAgICAgICAgIGluZGV4ID0gQHJvd0luZGV4QXRQb3Mgb3B0LnBvc1xuICAgICAgICAgICAgQGl0ZW1zLnNwbGljZSBNYXRoLm1pbihpbmRleCwgQGl0ZW1zLmxlbmd0aCksIDAsIGl0ZW1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGl0ZW1zLnB1c2ggaXRlbVxuICAgICAgICAgICAgXG4gICAgICAgIEBzZXRJdGVtcyBAaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIG9uRHJvcDogKGV2ZW50KSA9PiBcbiAgICBcbiAgICAgICAgYWN0aW9uID0gZXZlbnQuZ2V0TW9kaWZpZXJTdGF0ZSgnU2hpZnQnKSBhbmQgJ2NvcHknIG9yICdtb3ZlJ1xuICAgICAgICBzb3VyY2UgPSBldmVudC5kYXRhVHJhbnNmZXIuZ2V0RGF0YSAndGV4dC9wbGFpbidcbiAgICAgICAgXG4gICAgICAgIGl0ZW0gPSBAYnJvd3Nlci5maWxlSXRlbSBzb3VyY2VcbiAgICAgICAgQGFkZEl0ZW0gaXRlbSwgcG9zOmtwb3MgZXZlbnRcbiAgICBcbiAgICBpc0VtcHR5OiAtPiBlbXB0eSBAcm93c1xuICAgIFxuICAgIGNsZWFyOiAtPlxuICAgICAgICBcbiAgICAgICAgQGNsZWFyU2VhcmNoKClcbiAgICAgICAgQGRpdi5zY3JvbGxUb3AgPSAwXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBAcm93cyA9IFtdXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgbmFtZTogLT4gJ3NoZWxmJ1xuXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIFxuXG4gICAgbG9hZEdpdFN0YXR1czogPT5cbiAgICAgICAgXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3NcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgJCgnLmJyb3dzZXJTdGF0dXNJY29uJywgcm93LmRpdik/LnJlbW92ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZpbGVTdGF0dXMgPSAocm93KSAtPiAoc3RhdHVzKSA9PlxuICAgICAgICAgICAgICAgIGZvciBmaWxlLCBzdGF0dXMgb2YgaHViLnN0YXR1c0ZpbGVzIHN0YXR1c1xuICAgICAgICAgICAgICAgICAgICBpZiBmaWxlLnN0YXJ0c1dpdGggcm93LnBhdGgoKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgcm93Lml0ZW0udHlwZSA9PSAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1cyA9ICdkaXJzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgcm93LmRpdi5hcHBlbmRDaGlsZCBlbGVtICdzcGFuJywgY2xhc3M6XCJnaXQtI3tzdGF0dXN9LWljb24gYnJvd3NlclN0YXR1c0ljb25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaHViLnN0YXR1cyByb3cucGF0aCgpLCBmaWxlU3RhdHVzIHJvd1xuXG4gICAgdXBkYXRlR2l0RmlsZXM6IC0+IEBsb2FkR2l0U3RhdHVzKClcbiAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICB0b2dnbGVIaXN0b3J5OiA9PlxuICAgICAgICBcbiAgICAgICAgQHNob3dIaXN0b3J5ID0gbm90IEBzaG93SGlzdG9yeVxuICAgICAgICBpZiBAc2hvd0hpc3RvcnlcbiAgICAgICAgICAgIEBsb2FkSGlzdG9yeSgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEByZW1vdmVIaXN0b3J5KClcbiAgICAgICAgd2luZG93LnN0YXNoLnNldCAnc2hlbGZ8aGlzdG9yeScgQHNob3dIaXN0b3J5XG4gICAgICAgIHdpbmRvdy5zdGFzaC5zZXQgJ3NoZWxmfGhpc3RvcnknIEBzaG93SGlzdG9yeVxuICAgIGNsZWFySGlzdG9yeTogPT5cbiAgICAgICAgXG4gICAgICAgIHdpbmRvdy5uYXZpZ2F0ZS5jbGVhcigpXG4gICAgICAgIGlmIEBzaG93SGlzdG9yeSB0aGVuIEBzZXRIaXN0b3J5SXRlbXMgW1xuICAgICAgICAgICAgZmlsZTogICB3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICAgICBwb3M6ICAgIHdpbmRvdy5lZGl0b3IubWFpbkN1cnNvcigpXG4gICAgICAgICAgICB0ZXh0OiAgIHNsYXNoLmZpbGUgd2luZG93LmVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICBdXG4gICAgICAgIFxuICAgIGhpc3RvcnlTZXBhcmF0b3JJbmRleDogLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBpIGluIFswLi4uQG51bVJvd3MoKV1cbiAgICAgICAgICAgIGlmIEByb3coaSkuaXRlbS50eXBlID09ICdoaXN0b3J5U2VwYXJhdG9yJ1xuICAgICAgICAgICAgICAgIHJldHVybiBpXG4gICAgICAgIHJldHVybiBAbnVtUm93cygpXG4gICAgICAgIFxuICAgIHJlbW92ZUhpc3Rvcnk6IC0+XG4gICAgICAgIFxuICAgICAgICBzZXBhcmF0b3JJbmRleCA9IEBoaXN0b3J5U2VwYXJhdG9ySW5kZXgoKVxuICAgICAgICB3aGlsZSBAbnVtUm93cygpIGFuZCBAbnVtUm93cygpID4gc2VwYXJhdG9ySW5kZXhcbiAgICAgICAgICAgIEByZW1vdmVSb3cgQHJvdyhAbnVtUm93cygpLTEpXG5cbiAgICBvbk5hdmlnYXRlSGlzdG9yeUNoYW5nZWQ6IChmaWxlUG9zaXRpb25zLCBjdXJyZW50SW5kZXgpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAc2hvd0hpc3RvcnlcbiAgICAgICAgICAgIEBzZXRIaXN0b3J5SXRlbXMgZmlsZVBvc2l0aW9uc1xuXG4gICAgb25OYXZpZ2F0ZUluZGV4Q2hhbmdlZDogKGN1cnJlbnRJbmRleCwgY3VycmVudEl0ZW0pID0+XG5cbiAgICAgICAgaWYgQHNob3dIaXN0b3J5XG4gICAgICAgICAgICByZXZlcnNlSW5kZXggPSBAbnVtUm93cygpIC0gY3VycmVudEluZGV4IC0gMVxuICAgICAgICAgICAgaWYgY3VycmVudEl0ZW0uZmlsZSAhPSBAYWN0aXZlUm93KCk/Lml0ZW0uZmlsZVxuICAgICAgICAgICAgICAgIEByb3cocmV2ZXJzZUluZGV4KT8uc2V0QWN0aXZlKClcbiAgICAgICAgICAgIFxuICAgIGxvYWRIaXN0b3J5OiAtPlxuICAgICAgICBcbiAgICAgICAgQHNldEhpc3RvcnlJdGVtcyBwb3N0LmdldCAnbmF2aWdhdGUnLCAnZmlsZVBvc2l0aW9ucydcblxuICAgIHNldEhpc3RvcnlJdGVtczogKGl0ZW1zKSAtPlxuICAgIFxuICAgICAgICBAcmVtb3ZlSGlzdG9yeSgpXG4gICAgICAgIFxuICAgICAgICBpdGVtcy5tYXAgKGgpIC0+IFxuICAgICAgICAgICAgaC50eXBlID0gJ2ZpbGUnXG4gICAgICAgICAgICBoLnRleHQgPSBzbGFzaC5yZW1vdmVDb2x1bW4gaC50ZXh0XG4gICAgICAgIGl0ZW1zLnJldmVyc2UoKVxuICAgICAgICBcbiAgICAgICAgaXRlbXMudW5zaGlmdFxuICAgICAgICAgICAgdHlwZTogJ2hpc3RvcnlTZXBhcmF0b3InXG4gICAgICAgICAgICBpY29uOiAnaGlzdG9yeS1pY29uJ1xuICAgICAgICBcbiAgICAgICAgQGFkZEl0ZW1zIGl0ZW1zXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgb25Gb2N1czogPT4gXG5cbiAgICAgICAgQGRpdi5jbGFzc0xpc3QuYWRkICdmb2N1cydcbiAgICAgICAgaWYgQGJyb3dzZXIuc2hlbGZTaXplIDwgMjAwXG4gICAgICAgICAgICBAYnJvd3Nlci5zZXRTaGVsZlNpemUgMjAwXG4gICAgICAgICAgICBcbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG9uTW91c2VPdmVyOiAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8ub25Nb3VzZU92ZXIoKVxuICAgIG9uTW91c2VPdXQ6ICAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8ub25Nb3VzZU91dCgpXG4gICAgb25DbGljazogICAgIChldmVudCkgPT4gQHJvdyhldmVudC50YXJnZXQpPy5hY3RpdmF0ZSBldmVudFxuICAgIG9uRGJsQ2xpY2s6ICAoZXZlbnQpID0+IEBuYXZpZ2F0ZUNvbHMgJ2VudGVyJ1xuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuXG4gICAgbmF2aWdhdGVSb3dzOiAoa2V5KSAtPlxuXG4gICAgICAgIHJldHVybiBrZXJyb3IgXCJubyByb3dzIGluIGNvbHVtbiAje0BpbmRleH0/XCIgaWYgbm90IEBudW1Sb3dzKClcbiAgICAgICAgaW5kZXggPSBAYWN0aXZlUm93KCk/LmluZGV4KCkgPyAtMVxuICAgICAgICBrZXJyb3IgXCJubyBpbmRleCBmcm9tIGFjdGl2ZVJvdz8gI3tpbmRleH0/XCIsIEBhY3RpdmVSb3coKSBpZiBub3QgaW5kZXg/IG9yIE51bWJlci5pc05hTiBpbmRleFxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICd1cCcgICAgICAgIHRoZW4gaW5kZXgtMVxuICAgICAgICAgICAgd2hlbiAnZG93bicgICAgICB0aGVuIGluZGV4KzFcbiAgICAgICAgICAgIHdoZW4gJ2hvbWUnICAgICAgdGhlbiAwXG4gICAgICAgICAgICB3aGVuICdlbmQnICAgICAgIHRoZW4gQGl0ZW1zLmxlbmd0aFxuICAgICAgICAgICAgd2hlbiAncGFnZSB1cCcgICB0aGVuIGluZGV4LUBudW1WaXNpYmxlKClcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgZG93bicgdGhlbiBjbGFtcCAwLCBAaXRlbXMubGVuZ3RoLCBpbmRleCtAbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICBlbHNlIGluZGV4XG4gICAgICAgICAgICBcbiAgICAgICAga2Vycm9yIFwibm8gaW5kZXggI3tpbmRleH0/ICN7QG51bVZpc2libGUoKX1cIiBpZiBub3QgaW5kZXg/IG9yIE51bWJlci5pc05hTiBpbmRleCAgICAgICAgXG4gICAgICAgIGluZGV4ID0gY2xhbXAgMCwgQG51bVJvd3MoKS0xLCBpbmRleFxuICAgICAgICBcbiAgICAgICAga2Vycm9yIFwibm8gcm93IGF0IGluZGV4ICN7aW5kZXh9LyN7QG51bVJvd3MoKS0xfT9cIiwgQG51bVJvd3MoKSBpZiBub3QgQHJvd3NbaW5kZXhdPy5hY3RpdmF0ZT9cblxuICAgICAgICBuYXZpZ2F0ZSA9IChhY3Rpb24pID0+XG4gICAgICAgICAgICBAbmF2aWdhdGluZ1Jvd3MgPSB0cnVlXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ21lbnVBY3Rpb24nIGFjdGlvblxuICAgICAgICBcbiAgICAgICAgaWYgICAgICBrZXkgPT0gJ3VwJyAgIGFuZCBpbmRleCA+IEBpdGVtcy5sZW5ndGggICAgIHRoZW4gbmF2aWdhdGUgJ05hdmlnYXRlIEZvcndhcmQnXG4gICAgICAgIGVsc2UgaWYga2V5ID09ICdkb3duJyBhbmQgaW5kZXggPiBAaXRlbXMubGVuZ3RoICsgMSB0aGVuIG5hdmlnYXRlICdOYXZpZ2F0ZSBCYWNrd2FyZCdcbiAgICAgICAgZWxzZSBAcm93c1tpbmRleF0uYWN0aXZhdGUoKVxuICAgIFxuICAgIG9wZW5GaWxlSW5OZXdXaW5kb3c6IC0+ICBcbiAgICAgICAgXG4gICAgICAgIGlmIGl0ZW0gPSBAYWN0aXZlUm93KCk/Lml0ZW1cbiAgICAgICAgICAgIGlmIGl0ZW0udHlwZSA9PSAnZmlsZScgYW5kIGl0ZW0udGV4dEZpbGVcbiAgICAgICAgICAgICAgICB3aW5kb3cub3BlbkZpbGVzIFtpdGVtLmZpbGVdLCBuZXdXaW5kb3c6IHRydWVcbiAgICAgICAgQFxuICAgIFxuICAgIHJlbW92ZU9iamVjdDogPT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgcm93ID0gQGFjdGl2ZVJvdygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEBzaG93SGlzdG9yeVxuICAgICAgICAgICAgICAgIGlmIHJvdy5pdGVtLnR5cGUgPT0gJ2hpc3RvcnlTZXBhcmF0b3InXG4gICAgICAgICAgICAgICAgICAgIEB0b2dnbGVIaXN0b3J5KClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgaWYgcm93LmluZGV4KCkgPiBAaGlzdG9yeVNlcGFyYXRvckluZGV4KClcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lm5hdmlnYXRlLmRlbEZpbGVQb3Mgcm93Lml0ZW1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIG5leHRPclByZXYgPSByb3cubmV4dCgpID8gcm93LnByZXYoKVxuICAgICAgICAgICAgcm93LmRpdi5yZW1vdmUoKVxuICAgICAgICAgICAgQGl0ZW1zLnNwbGljZSByb3cuaW5kZXgoKSwgMVxuICAgICAgICAgICAgQHJvd3Muc3BsaWNlIHJvdy5pbmRleCgpLCAxXG4gICAgICAgICAgICBuZXh0T3JQcmV2Py5hY3RpdmF0ZSgpXG4gICAgICAgICAgICBAc2F2ZVByZWZzKClcbiAgICAgICAgQFxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgXG4gICAgXG4gICAgc2hvd0NvbnRleHRNZW51OiAoYWJzUG9zKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGFic1Bvcz9cbiAgICAgICAgICAgIGFic1BvcyA9IHBvcyBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0LCBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3BcbiAgICAgICAgXG4gICAgICAgIG9wdCA9IGl0ZW1zOiBbIFxuICAgICAgICAgICAgdGV4dDogICAnVG9nZ2xlIEhpc3RvcnknXG4gICAgICAgICAgICBjb21ibzogICdhbHQraCcgXG4gICAgICAgICAgICBjYjogICAgIEB0b2dnbGVIaXN0b3J5XG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ1RvZ2dsZSBFeHRlbnNpb25zJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQHRvZ2dsZUV4dGVuc2lvbnNcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnUmVtb3ZlJ1xuICAgICAgICAgICAgY29tYm86ICAnYmFja3NwYWNlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQHJlbW92ZU9iamVjdFxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdDbGVhciBIaXN0b3J5J1xuICAgICAgICAgICAgY2I6ICAgICBAY2xlYXJIaXN0b3J5XG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgb3B0LnkgPSBhYnNQb3MueVxuICAgICAgICBwb3B1cC5tZW51IG9wdFxuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIG9uS2V5OiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciB9ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2VudGVyJyAnY3RybCtlbnRlcicgdGhlbiByZXR1cm4gQG9wZW5GaWxlSW5OZXdXaW5kb3coKVxuICAgICAgICAgICAgd2hlbiAnYmFja3NwYWNlJyAnZGVsZXRlJyB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBjbGVhclNlYXJjaCgpLnJlbW92ZU9iamVjdCgpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2snICdjdHJsK2snIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCBpZiBAYnJvd3Nlci5jbGVhblVwKClcbiAgICAgICAgICAgIHdoZW4gJ3RhYicgICAgXG4gICAgICAgICAgICAgICAgaWYgQHNlYXJjaC5sZW5ndGggdGhlbiBAZG9TZWFyY2ggJydcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICB3aGVuICdlc2MnXG4gICAgICAgICAgICAgICAgaWYgQGRyYWdEaXZcbiAgICAgICAgICAgICAgICAgICAgQGRyYWdEaXYuZHJhZy5kcmFnU3RvcCgpXG4gICAgICAgICAgICAgICAgICAgIEBkcmFnRGl2LnJlbW92ZSgpXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBAZHJhZ0RpdlxuICAgICAgICAgICAgICAgIGlmIEBzZWFyY2gubGVuZ3RoIHRoZW4gQGNsZWFyU2VhcmNoKClcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICB3aGVuICd1cCcgJ2Rvd24nICdwYWdlIHVwJyAncGFnZSBkb3duJyAnaG9tZScgJ2VuZCcgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyBrZXlcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyAnYWx0K3JpZ2h0JyAnZW50ZXInXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGZvY3VzQnJvd3NlcigpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG1vZCBpbiBbJ3NoaWZ0JyAnJ10gYW5kIGNoYXIgdGhlbiBAZG9TZWFyY2ggY2hhclxuICAgICAgICBcbiAgICAgICAgaWYgQGRyYWdEaXZcbiAgICAgICAgICAgIEB1cGRhdGVEcmFnSW5kaWNhdG9yIGV2ZW50XG4gICAgICAgICAgICBcbiAgICBvbktleVVwOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgQHVwZGF0ZURyYWdJbmRpY2F0b3IgZXZlbnRcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFNoZWxmXG4iXX0=
//# sourceURL=../../coffee/browser/shelf.coffee