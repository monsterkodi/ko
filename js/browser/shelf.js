// koffee 1.18.0

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
        return (ref1 = this.row(event.target)) != null ? ref1.onMouseOver() : void 0;
    };

    Shelf.prototype.onMouseOut = function(event) {
        var ref1;
        return (ref1 = this.row(event.target)) != null ? ref1.onMouseOut() : void 0;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGYuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2Jyb3dzZXIiLCJzb3VyY2VzIjpbInNoZWxmLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSwwSUFBQTtJQUFBOzs7O0FBUUEsTUFBa0csT0FBQSxDQUFRLEtBQVIsQ0FBbEcsRUFBRSxTQUFGLEVBQUssU0FBTCxFQUFRLGlCQUFSLEVBQWUsZUFBZixFQUFxQixpQkFBckIsRUFBNEIsaUJBQTVCLEVBQW1DLG1CQUFuQyxFQUEyQyxxQkFBM0MsRUFBb0QsZUFBcEQsRUFBMEQsZUFBMUQsRUFBZ0UsaUJBQWhFLEVBQXVFLGVBQXZFLEVBQTZFLGlCQUE3RSxFQUFvRjs7QUFFcEYsR0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUNYLEdBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFFTDs7O0lBRUMsZUFBQyxPQUFEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBRUMsdUNBQU0sT0FBTjtRQUVBLElBQUMsQ0FBQSxLQUFELEdBQVU7UUFDVixJQUFDLENBQUEsS0FBRCxHQUFVLENBQUM7UUFDWCxJQUFDLENBQUEsR0FBRyxDQUFDLEVBQUwsR0FBVTtRQUVWLElBQUMsQ0FBQSxXQUFELEdBQWUsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFiLENBQWlCLGVBQWpCLEVBQWlDLEtBQWpDO1FBRWYsSUFBSSxDQUFDLEVBQUwsQ0FBUSxXQUFSLEVBQWlDLElBQUMsQ0FBQSxXQUFsQztRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsWUFBUixFQUFpQyxJQUFDLENBQUEsT0FBbEM7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLHdCQUFSLEVBQWlDLElBQUMsQ0FBQSx3QkFBbEM7UUFDQSxJQUFJLENBQUMsRUFB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TyxTQUFBLENBQVUsS0FBVixFQUFpQixJQUFDLENBQUEsWUFBRCxDQUFjLEdBQWQsQ0FBakI7QUFoQmYsaUJBaUJTLE9BakJUO0FBQUEsaUJBaUJpQixXQWpCakI7QUFBQSxpQkFpQjZCLE9BakI3QjtBQWtCUSx1QkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixJQUFDLENBQUEsWUFBRCxDQUFBLENBQWpCO0FBbEJmO1FBb0JBLElBQUcsQ0FBQSxHQUFBLEtBQVEsT0FBUixJQUFBLEdBQUEsS0FBZ0IsRUFBaEIsQ0FBQSxJQUF3QixJQUEzQjtZQUFxQyxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsRUFBckM7O1FBRUEsSUFBRyxJQUFDLENBQUEsT0FBSjttQkFDSSxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsS0FBckIsRUFESjs7SUE1Qkc7O29CQStCUCxPQUFBLEdBQVMsU0FBQyxLQUFEO1FBRUwsSUFBRyxJQUFDLENBQUEsT0FBSjttQkFDSSxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsS0FBckIsRUFESjs7SUFGSzs7OztHQXZjTzs7QUE0Y3BCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgIFxuMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMCAgXG4gICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICBcbjAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAgIFxuIyMjXG5cbnsgJCwgXywgY2xhbXAsIGVsZW0sIGVtcHR5LCBmaXJzdCwga2Vycm9yLCBrZXlpbmZvLCBrbG9nLCBrcG9zLCBwb3B1cCwgcG9zdCwgc2xhc2gsIHN0b3BFdmVudCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Sb3cgICAgICA9IHJlcXVpcmUgJy4vcm93J1xuU2Nyb2xsZXIgPSByZXF1aXJlICcuL3Njcm9sbGVyJ1xuQ29sdW1uICAgPSByZXF1aXJlICcuL2NvbHVtbidcbmZ1enp5ICAgID0gcmVxdWlyZSAnZnV6enknXG5odWIgICAgICA9IHJlcXVpcmUgJy4uL2dpdC9odWInXG4gICAgXG5jbGFzcyBTaGVsZiBleHRlbmRzIENvbHVtblxuXG4gICAgQDogKGJyb3dzZXIpIC0+XG5cbiAgICAgICAgc3VwZXIgYnJvd3NlclxuICAgICAgICBcbiAgICAgICAgQGl0ZW1zICA9IFtdXG4gICAgICAgIEBpbmRleCAgPSAtMVxuICAgICAgICBAZGl2LmlkID0gJ3NoZWxmJ1xuICAgICAgICBcbiAgICAgICAgQHNob3dIaXN0b3J5ID0gd2luZG93LnN0YXNoLmdldCAnc2hlbGZ8aGlzdG9yeScgZmFsc2VcblxuICAgICAgICBwb3N0Lm9uICdnaXRTdGF0dXMnICAgICAgICAgICAgICBAb25HaXRTdGF0dXNcbiAgICAgICAgcG9zdC5vbiAnYWRkVG9TaGVsZicgICAgICAgICAgICAgQGFkZFBhdGhcbiAgICAgICAgcG9zdC5vbiAnbmF2aWdhdGVIaXN0b3J5Q2hhbmdlZCcgQG9uTmF2aWdhdGVIaXN0b3J5Q2hhbmdlZFxuICAgICAgICBwb3N0Lm9uICduYXZpZ2F0ZUluZGV4Q2hhbmdlZCcgICBAb25OYXZpZ2F0ZUluZGV4Q2hhbmdlZFxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnZmlsZScgQG9uRmlsZVxuICAgICAgIFxuICAgIG1ha2VSb290OiA9PiBAdG9nZ2xlSGlzdG9yeSgpXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIFxuICAgXG4gICAgYWN0aXZhdGVSb3c6IChyb3cpIC0+IFxuICAgICAgICBcbiAgICAgICAgJCgnLmhvdmVyJyk/LmNsYXNzTGlzdC5yZW1vdmUgJ2hvdmVyJ1xuICAgICAgICBcbiAgICAgICAgaXRlbSA9IHJvdy5pdGVtXG4gICAgICAgICBcbiAgICAgICAgaWYgaXRlbS50eXBlID09ICdoaXN0b3J5U2VwYXJhdG9yJ1xuICAgICAgICAgICAgcm93LnNldEFjdGl2ZSBlbWl0OmZhbHNlXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIHJvdy5zZXRBY3RpdmUgZW1pdDp0cnVlXG4gICAgICAgIFxuICAgICAgICBpZiBpdGVtLnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUb0ZpbGUnIGl0ZW1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdmaWxlYnJvd3NlcicgJ2xvYWRJdGVtJyBpdGVtXG4gICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgICAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG9uRmlsZTogKGZpbGUpID0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgZW1wdHkgZmlsZVxuICAgICAgICBpZiBAbmF2aWdhdGluZ1Jvd3NcbiAgICAgICAgICAgIGRlbGV0ZSBAbmF2aWdhdGluZ1Jvd3NcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgZm9yIGluZGV4IGluIFswLi4uQGl0ZW1zLmxlbmd0aF1cbiAgICAgICAgICAgIGlmIEBpdGVtc1tpbmRleF0uZmlsZSA9PSBmaWxlXG4gICAgICAgICAgICAgICAgQHJvd3NbaW5kZXhdLnNldEFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBtYXRjaGVzID0gW11cbiAgICAgICAgZm9yIGluZGV4LGl0ZW0gb2YgQGl0ZW1zXG4gICAgICAgICAgICBpZiBmaWxlPy5zdGFydHNXaXRoIGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgIG1hdGNoZXMucHVzaCBbaW5kZXgsIGl0ZW1dXG5cbiAgICAgICAgaWYgbm90IGVtcHR5IG1hdGNoZXNcbiAgICAgICAgICAgIG1hdGNoZXMuc29ydCAoYSxiKSAtPiBiWzFdLmZpbGUubGVuZ3RoIC0gYVsxXS5maWxlLmxlbmd0aFxuICAgICAgICAgICAgW2luZGV4LCBpdGVtXSA9IGZpcnN0IG1hdGNoZXNcbiAgICAgICAgICAgIEByb3dzW2luZGV4XS5zZXRBY3RpdmUoKVxuXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBicm93c2VyRGlkSW5pdENvbHVtbnM6IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgQGRpZEluaXRcbiAgICAgICAgXG4gICAgICAgIEBkaWRJbml0ID0gdHJ1ZVxuICAgICAgICBcbiAgICAgICAgQGxvYWRTaGVsZkl0ZW1zKClcbiAgICAgICAgXG4gICAgICAgIEBsb2FkSGlzdG9yeSgpIGlmIEBzaG93SGlzdG9yeVxuICAgICAgICBcbiAgICAgICAgc2V0VGltZW91dCBAbG9hZEdpdFN0YXR1cywgMjAwMFxuICAgICAgICAgICAgICAgIFxuICAgIGxvYWRTaGVsZkl0ZW1zOiAtPlxuICAgICAgICBcbiAgICAgICAgaXRlbXMgPSB3aW5kb3cuc3RhdGUuZ2V0IFwic2hlbGZ8aXRlbXNcIlxuICAgICAgICBAc2V0SXRlbXMgaXRlbXMsIHNhdmU6ZmFsc2VcbiAgICAgICAgICAgICAgICBcbiAgICBhZGRQYXRoOiAocGF0aCwgb3B0KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgc2xhc2guaXNEaXIgcGF0aFxuICAgICAgICAgICAgQGFkZERpciBwYXRoLCBvcHRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGFkZEZpbGUgcGF0aCwgb3B0XG4gICAgICAgIFxuICAgICMgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbiAgICBpdGVtUGF0aHM6IC0+IEByb3dzLm1hcCAocikgLT4gci5wYXRoKClcbiAgICBcbiAgICBzYXZlUHJlZnM6IC0+IHdpbmRvdy5zdGF0ZS5zZXQgXCJzaGVsZnxpdGVtc1wiIEBpdGVtc1xuICAgICAgICAjIHByZWZzLnNldCBcInNoZWxm4pa4aXRlbXNcIiBAaXRlbXNcbiAgICBcbiAgICBzZXRJdGVtczogKEBpdGVtcywgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgQGNsZWFyKClcbiAgICAgICAgXG4gICAgICAgIEBpdGVtcyA/PSBbXVxuICAgICAgICBAYWRkSXRlbXMgQGl0ZW1zXG4gICAgICAgIFxuICAgICAgICBpZiBvcHQ/LnNhdmUgIT0gZmFsc2VcbiAgICAgICAgICAgIEBzYXZlUHJlZnMoKSAgICAgICAgICAgIFxuICAgICAgICBAXG4gICAgICAgIFxuICAgIGFkZEl0ZW1zOiAoaXRlbXMsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBpdGVtc1xuICAgICAgICBcbiAgICAgICAgZm9yIGl0ZW0gaW4gaXRlbXNcbiAgICAgICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgICAgICBcbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgIGFkZERpcjogKGRpciwgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgaXRlbSA9IFxuICAgICAgICAgICAgbmFtZTogc2xhc2guZmlsZSBzbGFzaC50aWxkZSBkaXJcbiAgICAgICAgICAgIHR5cGU6ICdkaXInXG4gICAgICAgICAgICBmaWxlOiBzbGFzaC5wYXRoIGRpclxuICAgICAgICBcbiAgICAgICAgQGFkZEl0ZW0gaXRlbSwgb3B0XG5cbiAgICBhZGRGaWxlOiAoZmlsZSwgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgaXRlbSA9IFxuICAgICAgICAgICAgbmFtZTogc2xhc2guZmlsZSBmaWxlXG4gICAgICAgICAgICB0eXBlOiAnZmlsZSdcbiAgICAgICAgICAgIGZpbGU6IHNsYXNoLnBhdGggZmlsZVxuICAgICAgICBpdGVtLnRleHRGaWxlID0gdHJ1ZSBpZiBzbGFzaC5pc1RleHQgZmlsZVxuICAgICAgICBAYWRkSXRlbSBpdGVtLCBvcHRcbiAgICAgICAgXG4gICAgYWRkRmlsZXM6IChmaWxlcywgb3B0KSAtPlxuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlc1xuICAgICAgICAgICAgaWYgc2xhc2guaXNEaXIgZmlsZVxuICAgICAgICAgICAgICAgIEBhZGREaXIgZmlsZSwgb3B0XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGFkZEZpbGUgZmlsZSwgb3B0XG4gICAgICAgIFxuICAgIGFkZEl0ZW06ICAoaXRlbSwgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgXy5wdWxsQWxsV2l0aCBAaXRlbXMsIFtpdGVtXSwgXy5pc0VxdWFsICMgcmVtb3ZlIGl0ZW0gaWYgb24gc2hlbGYgYWxyZWFkeVxuICAgICAgICBcbiAgICAgICAgaWYgb3B0Py5wb3NcbiAgICAgICAgICAgIGluZGV4ID0gQHJvd0luZGV4QXRQb3Mgb3B0LnBvc1xuICAgICAgICAgICAgQGl0ZW1zLnNwbGljZSBNYXRoLm1pbihpbmRleCwgQGl0ZW1zLmxlbmd0aCksIDAsIGl0ZW1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGl0ZW1zLnB1c2ggaXRlbVxuICAgICAgICAgICAgXG4gICAgICAgIEBzZXRJdGVtcyBAaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIG9uRHJvcDogKGV2ZW50KSA9PiBcbiAgICBcbiAgICAgICAgYWN0aW9uID0gZXZlbnQuZ2V0TW9kaWZpZXJTdGF0ZSgnU2hpZnQnKSBhbmQgJ2NvcHknIG9yICdtb3ZlJ1xuICAgICAgICBzb3VyY2UgPSBldmVudC5kYXRhVHJhbnNmZXIuZ2V0RGF0YSAndGV4dC9wbGFpbidcbiAgICAgICAgXG4gICAgICAgIGl0ZW0gPSBAYnJvd3Nlci5maWxlSXRlbSBzb3VyY2VcbiAgICAgICAgQGFkZEl0ZW0gaXRlbSwgcG9zOmtwb3MgZXZlbnRcbiAgICBcbiAgICBpc0VtcHR5OiAtPiBlbXB0eSBAcm93c1xuICAgIFxuICAgIGNsZWFyOiAtPlxuICAgICAgICBcbiAgICAgICAgQGNsZWFyU2VhcmNoKClcbiAgICAgICAgQGRpdi5zY3JvbGxUb3AgPSAwXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBAcm93cyA9IFtdXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgbmFtZTogLT4gJ3NoZWxmJ1xuXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIFxuXG4gICAgb25HaXRTdGF0dXM6IChnaXREaXIsIHN0YXR1cykgPT5cbiAgICAgICAgXG4gICAgICAgICMgbG9nICdvbkdpdFN0YXR1cycgZ2l0RGlyLCBzdGF0dXNcbiAgICAgICAgXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3NcbiAgICAgICAgICAgIGlmIGdpdERpci5zdGFydHNXaXRoIHJvdy5wYXRoKClcbiAgICAgICAgICAgICAgICBpZiByb3cuaXRlbS50eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1cyA9ICdkaXJzJ1xuICAgICAgICAgICAgICAgICQoJy5icm93c2VyU3RhdHVzSWNvbicsIHJvdy5kaXYpPy5yZW1vdmUoKVxuICAgICAgICAgICAgICAgIHJvdy5kaXYuYXBwZW5kQ2hpbGQgZWxlbSAnc3BhbicsIGNsYXNzOlwiZ2l0LSN7c3RhdHVzfS1pY29uIGJyb3dzZXJTdGF0dXNJY29uXCJcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgbG9hZEdpdFN0YXR1czogPT5cbiAgICAgICAgXG4gICAgICAgIHJvd3MgPSBfLmNsb25lIEByb3dzXG4gICAgICAgIFxuICAgICAgICBmaWxlU3RhdHVzID0gKHJvdywgcm93cykgLT4gKHN0YXR1cykgPT5cbiAgICAgICAgICAgIGZvciBmaWxlLCBzdGF0dXMgb2YgaHViLnN0YXR1c0ZpbGVzIHN0YXR1c1xuICAgICAgICAgICAgICAgIGlmIGZpbGUuc3RhcnRzV2l0aCByb3cucGF0aCgpXG4gICAgICAgICAgICAgICAgICAgIGlmIHJvdy5pdGVtLnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1cyA9ICdkaXJzJ1xuICAgICAgICAgICAgICAgICAgICAkKCcuYnJvd3NlclN0YXR1c0ljb24nLCByb3cuZGl2KT8ucmVtb3ZlKClcbiAgICAgICAgICAgICAgICAgICAgcm93LmRpdi5hcHBlbmRDaGlsZCBlbGVtICdzcGFuJywgY2xhc3M6XCJnaXQtI3tzdGF0dXN9LWljb24gYnJvd3NlclN0YXR1c0ljb25cIlxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgaWYgcm93cy5sZW5ndGhcbiAgICAgICAgICAgICAgICByb3cgPSByb3dzLnNoaWZ0KClcbiAgICAgICAgICAgICAgICBodWIuc3RhdHVzIHJvdy5wYXRoKCksIGZpbGVTdGF0dXMgcm93LCByb3dzXG4gICAgICAgIFxuICAgICAgICByb3cgPSByb3dzLnNoaWZ0KClcbiAgICAgICAgaHViLnN0YXR1cyByb3cucGF0aCgpLCBmaWxlU3RhdHVzIHJvdywgcm93c1xuXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgdG9nZ2xlSGlzdG9yeTogPT5cbiAgICAgICAgXG4gICAgICAgIEBzaG93SGlzdG9yeSA9IG5vdCBAc2hvd0hpc3RvcnlcbiAgICAgICAgaWYgQHNob3dIaXN0b3J5XG4gICAgICAgICAgICBAbG9hZEhpc3RvcnkoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAcmVtb3ZlSGlzdG9yeSgpXG4gICAgICAgIHdpbmRvdy5zdGFzaC5zZXQgJ3NoZWxmfGhpc3RvcnknIEBzaG93SGlzdG9yeVxuICAgICAgICBcbiAgICBjbGVhckhpc3Rvcnk6ID0+XG4gICAgICAgIFxuICAgICAgICB3aW5kb3cubmF2aWdhdGUuY2xlYXIoKVxuICAgICAgICBpZiBAc2hvd0hpc3RvcnkgdGhlbiBAc2V0SGlzdG9yeUl0ZW1zIFtcbiAgICAgICAgICAgIGZpbGU6ICAgd2luZG93LmVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgcG9zOiAgICB3aW5kb3cuZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICAgICAgdGV4dDogICBzbGFzaC5maWxlIHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgXVxuICAgICAgICBcbiAgICBoaXN0b3J5U2VwYXJhdG9ySW5kZXg6IC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgaSBpbiBbMC4uLkBudW1Sb3dzKCldXG4gICAgICAgICAgICBpZiBAcm93KGkpLml0ZW0udHlwZSA9PSAnaGlzdG9yeVNlcGFyYXRvcidcbiAgICAgICAgICAgICAgICByZXR1cm4gaVxuICAgICAgICByZXR1cm4gQG51bVJvd3MoKVxuICAgICAgICBcbiAgICByZW1vdmVIaXN0b3J5OiAtPlxuICAgICAgICBcbiAgICAgICAgc2VwYXJhdG9ySW5kZXggPSBAaGlzdG9yeVNlcGFyYXRvckluZGV4KClcbiAgICAgICAgd2hpbGUgQG51bVJvd3MoKSBhbmQgQG51bVJvd3MoKSA+IHNlcGFyYXRvckluZGV4XG4gICAgICAgICAgICBAcmVtb3ZlUm93IEByb3coQG51bVJvd3MoKS0xKVxuXG4gICAgb25OYXZpZ2F0ZUhpc3RvcnlDaGFuZ2VkOiAoZmlsZVBvc2l0aW9ucywgY3VycmVudEluZGV4KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQHNob3dIaXN0b3J5XG4gICAgICAgICAgICBAc2V0SGlzdG9yeUl0ZW1zIGZpbGVQb3NpdGlvbnNcblxuICAgIG9uTmF2aWdhdGVJbmRleENoYW5nZWQ6IChjdXJyZW50SW5kZXgsIGN1cnJlbnRJdGVtKSA9PlxuXG4gICAgICAgIGlmIEBzaG93SGlzdG9yeVxuICAgICAgICAgICAga2xvZyAnb25OYXZpZ2F0ZUluZGV4Q2hhbmdlZCcgY3VycmVudEluZGV4LCBjdXJyZW50SXRlbVxuICAgICAgICAgICAgcmV2ZXJzZUluZGV4ID0gQG51bVJvd3MoKSAtIGN1cnJlbnRJbmRleCAtIDFcbiAgICAgICAgICAgICMgaWYgY3VycmVudEl0ZW0uZmlsZSAhPSBAYWN0aXZlUm93KCk/Lml0ZW0uZmlsZVxuICAgICAgICAgICAgQHJvdyhyZXZlcnNlSW5kZXgpPy5zZXRBY3RpdmUoKVxuICAgICAgICAgICAgXG4gICAgbG9hZEhpc3Rvcnk6IC0+XG4gICAgICAgIFxuICAgICAgICBAc2V0SGlzdG9yeUl0ZW1zIHBvc3QuZ2V0ICduYXZpZ2F0ZScsICdmaWxlUG9zaXRpb25zJ1xuXG4gICAgc2V0SGlzdG9yeUl0ZW1zOiAoaXRlbXMpIC0+XG4gICAgXG4gICAgICAgIEByZW1vdmVIaXN0b3J5KClcbiAgICAgICAgXG4gICAgICAgIGl0ZW1zLm1hcCAoaCkgLT4gXG4gICAgICAgICAgICBoLnR5cGUgPSAnZmlsZSdcbiAgICAgICAgICAgIGgudGV4dCA9IHNsYXNoLnJlbW92ZUNvbHVtbiBoLnRleHRcbiAgICAgICAgaXRlbXMucmV2ZXJzZSgpXG4gICAgICAgIFxuICAgICAgICBpdGVtcy51bnNoaWZ0XG4gICAgICAgICAgICB0eXBlOiAnaGlzdG9yeVNlcGFyYXRvcidcbiAgICAgICAgICAgIGljb246ICdoaXN0b3J5LWljb24nXG4gICAgICAgIFxuICAgICAgICBAYWRkSXRlbXMgaXRlbXNcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBvbkZvY3VzOiA9PiBcblxuICAgICAgICBAZGl2LmNsYXNzTGlzdC5hZGQgJ2ZvY3VzJ1xuICAgICAgICBpZiBAYnJvd3Nlci5zaGVsZlNpemUgPCAyMDBcbiAgICAgICAgICAgIEBicm93c2VyLnNldFNoZWxmU2l6ZSAyMDBcbiAgICAgICAgICAgIFxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgb25Nb3VzZU92ZXI6IChldmVudCkgPT4gQHJvdyhldmVudC50YXJnZXQpPy5vbk1vdXNlT3ZlcigpXG4gICAgb25Nb3VzZU91dDogIChldmVudCkgPT4gQHJvdyhldmVudC50YXJnZXQpPy5vbk1vdXNlT3V0KClcbiAgICBvbkRibENsaWNrOiAgKGV2ZW50KSA9PiBAbmF2aWdhdGVDb2xzICdlbnRlcidcblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcblxuICAgIG5hdmlnYXRlUm93czogKGtleSkgLT5cblxuICAgICAgICByZXR1cm4ga2Vycm9yIFwibm8gcm93cyBpbiBjb2x1bW4gI3tAaW5kZXh9P1wiIGlmIG5vdCBAbnVtUm93cygpXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gLTFcbiAgICAgICAga2Vycm9yIFwibm8gaW5kZXggZnJvbSBhY3RpdmVSb3c/ICN7aW5kZXh9P1wiLCBAYWN0aXZlUm93KCkgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAndXAnICAgICAgICB0aGVuIGluZGV4LTFcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nICAgICAgdGhlbiBpbmRleCsxXG4gICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gMFxuICAgICAgICAgICAgd2hlbiAnZW5kJyAgICAgICB0aGVuIEBpdGVtcy5sZW5ndGhcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICAgdGhlbiBpbmRleC1AbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gY2xhbXAgMCwgQGl0ZW1zLmxlbmd0aCwgaW5kZXgrQG51bVZpc2libGUoKVxuICAgICAgICAgICAgZWxzZSBpbmRleFxuICAgICAgICAgICAgXG4gICAgICAgIGtlcnJvciBcIm5vIGluZGV4ICN7aW5kZXh9PyAje0BudW1WaXNpYmxlKCl9XCIgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXggICAgICAgIFxuICAgICAgICBpbmRleCA9IGNsYW1wIDAsIEBudW1Sb3dzKCktMSwgaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGtlcnJvciBcIm5vIHJvdyBhdCBpbmRleCAje2luZGV4fS8je0BudW1Sb3dzKCktMX0/XCIsIEBudW1Sb3dzKCkgaWYgbm90IEByb3dzW2luZGV4XT8uYWN0aXZhdGU/XG5cbiAgICAgICAgbmF2aWdhdGUgPSAoYWN0aW9uKSA9PlxuICAgICAgICAgICAgQG5hdmlnYXRpbmdSb3dzID0gdHJ1ZVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdtZW51QWN0aW9uJyBhY3Rpb25cbiAgICAgICAgXG4gICAgICAgIGlmICAgICAga2V5ID09ICd1cCcgICBhbmQgaW5kZXggPiBAaXRlbXMubGVuZ3RoICAgICB0aGVuIG5hdmlnYXRlICdOYXZpZ2F0ZSBGb3J3YXJkJ1xuICAgICAgICBlbHNlIGlmIGtleSA9PSAnZG93bicgYW5kIGluZGV4ID4gQGl0ZW1zLmxlbmd0aCArIDEgdGhlbiBuYXZpZ2F0ZSAnTmF2aWdhdGUgQmFja3dhcmQnXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJvdyA9IEByb3dzW2luZGV4XVxuICAgICAgICAgICAgcm93LnNldEFjdGl2ZSBlbWl0OmZhbHNlXG4gICAgICAgICAgICBpZiByb3cuaXRlbS50eXBlID09ICdmaWxlJ1xuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvRmlsZScgcm93Lml0ZW1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2ZpbGVicm93c2VyJyAnbG9hZEl0ZW0nIHJvdy5pdGVtLCBmb2N1czpmYWxzZVxuICAgIFxuICAgIG9wZW5GaWxlSW5OZXdXaW5kb3c6IC0+ICBcbiAgICAgICAgXG4gICAgICAgIGlmIGl0ZW0gPSBAYWN0aXZlUm93KCk/Lml0ZW1cbiAgICAgICAgICAgIGlmIGl0ZW0udHlwZSA9PSAnZmlsZScgYW5kIGl0ZW0udGV4dEZpbGVcbiAgICAgICAgICAgICAgICB3aW5kb3cub3BlbkZpbGVzIFtpdGVtLmZpbGVdLCBuZXdXaW5kb3c6IHRydWVcbiAgICAgICAgQFxuICAgIFxuICAgIHJlbW92ZU9iamVjdDogPT5cbiAgICAgICAgXG4gICAgICAgIHJvdyA9IEBhY3RpdmVSb3coKSA/IEBzZWxlY3RlZFJvdygpXG4gICAgICAgIFxuICAgICAgICBpZiByb3dcbiAgICAgICAgICAgIGlmIEBzaG93SGlzdG9yeVxuICAgICAgICAgICAgICAgIGlmIHJvdy5pdGVtLnR5cGUgPT0gJ2hpc3RvcnlTZXBhcmF0b3InXG4gICAgICAgICAgICAgICAgICAgIEB0b2dnbGVIaXN0b3J5KClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgaWYgcm93LmluZGV4KCkgPiBAaGlzdG9yeVNlcGFyYXRvckluZGV4KClcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lm5hdmlnYXRlLmRlbEZpbGVQb3Mgcm93Lml0ZW1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIG5leHRPclByZXYgPSByb3cubmV4dCgpID8gcm93LnByZXYoKVxuICAgICAgICAgICAgcm93LmRpdi5yZW1vdmUoKVxuICAgICAgICAgICAgQGl0ZW1zLnNwbGljZSByb3cuaW5kZXgoKSwgMVxuICAgICAgICAgICAgQHJvd3Muc3BsaWNlIHJvdy5pbmRleCgpLCAxXG4gICAgICAgICAgICBuZXh0T3JQcmV2Py5hY3RpdmF0ZSgpXG4gICAgICAgICAgICBAc2F2ZVByZWZzKClcbiAgICAgICAgQFxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgXG4gICAgXG4gICAgc2hvd0NvbnRleHRNZW51OiAoYWJzUG9zKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGFic1Bvcz9cbiAgICAgICAgICAgIGFic1BvcyA9IHBvcyBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0LCBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3BcbiAgICAgICAgXG4gICAgICAgIG9wdCA9IGl0ZW1zOiBbIFxuICAgICAgICAgICAgdGV4dDogICAnVG9nZ2xlIEhpc3RvcnknXG4gICAgICAgICAgICBjb21ibzogICdhbHQraCcgXG4gICAgICAgICAgICBjYjogICAgIEB0b2dnbGVIaXN0b3J5XG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ1RvZ2dsZSBFeHRlbnNpb25zJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQHRvZ2dsZUV4dGVuc2lvbnNcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnUmVtb3ZlJ1xuICAgICAgICAgICAgY29tYm86ICAnYmFja3NwYWNlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQHJlbW92ZU9iamVjdFxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdDbGVhciBIaXN0b3J5J1xuICAgICAgICAgICAgY2I6ICAgICBAY2xlYXJIaXN0b3J5XG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgb3B0LnkgPSBhYnNQb3MueVxuICAgICAgICBwb3B1cC5tZW51IG9wdFxuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIG9uS2V5OiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciB9ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuICAgICAgICBcbiAgICAgICAgIyBrbG9nICdjb21ibzonIGNvbWJvXG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrZW50ZXInICdjdHJsK2VudGVyJyB0aGVuIHJldHVybiBAb3BlbkZpbGVJbk5ld1dpbmRvdygpXG4gICAgICAgICAgICB3aGVuICdiYWNrc3BhY2UnICdkZWxldGUnIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGNsZWFyU2VhcmNoKCkucmVtb3ZlT2JqZWN0KClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQraycgJ2N0cmwraycgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50IGlmIEBicm93c2VyLmNsZWFuVXAoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCtlJyB0aGVuIEB0b2dnbGVFeHRlbnNpb25zKClcbiAgICAgICAgICAgIHdoZW4gJ3RhYicgICAgXG4gICAgICAgICAgICAgICAgaWYgQHNlYXJjaC5sZW5ndGggdGhlbiBAZG9TZWFyY2ggJydcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICB3aGVuICdlc2MnXG4gICAgICAgICAgICAgICAgaWYgQGRyYWdEaXZcbiAgICAgICAgICAgICAgICAgICAgQGRyYWdEaXYuZHJhZy5kcmFnU3RvcCgpXG4gICAgICAgICAgICAgICAgICAgIEBkcmFnRGl2LnJlbW92ZSgpXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBAZHJhZ0RpdlxuICAgICAgICAgICAgICAgIGlmIEBzZWFyY2gubGVuZ3RoIHRoZW4gQGNsZWFyU2VhcmNoKClcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICB3aGVuICd1cCcgJ2Rvd24nICdwYWdlIHVwJyAncGFnZSBkb3duJyAnaG9tZScgJ2VuZCcgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyBrZXlcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyAnYWx0K3JpZ2h0JyAnZW50ZXInXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGZvY3VzQnJvd3NlcigpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG1vZCBpbiBbJ3NoaWZ0JyAnJ10gYW5kIGNoYXIgdGhlbiBAZG9TZWFyY2ggY2hhclxuICAgICAgICBcbiAgICAgICAgaWYgQGRyYWdEaXZcbiAgICAgICAgICAgIEB1cGRhdGVEcmFnSW5kaWNhdG9yIGV2ZW50XG4gICAgICAgICAgICBcbiAgICBvbktleVVwOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgQHVwZGF0ZURyYWdJbmRpY2F0b3IgZXZlbnRcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFNoZWxmXG4iXX0=
//# sourceURL=../../coffee/browser/shelf.coffee