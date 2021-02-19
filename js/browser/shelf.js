// koffee 1.14.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGYuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2Jyb3dzZXIiLCJzb3VyY2VzIjpbInNoZWxmLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxvSUFBQTtJQUFBOzs7O0FBUUEsTUFBNEYsT0FBQSxDQUFRLEtBQVIsQ0FBNUYsRUFBRSxTQUFGLEVBQUssU0FBTCxFQUFRLGlCQUFSLEVBQWUsZUFBZixFQUFxQixpQkFBckIsRUFBNEIsaUJBQTVCLEVBQW1DLG1CQUFuQyxFQUEyQyxxQkFBM0MsRUFBb0QsZUFBcEQsRUFBMEQsaUJBQTFELEVBQWlFLGVBQWpFLEVBQXVFLGlCQUF2RSxFQUE4RTs7QUFFOUUsR0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUNYLEdBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFFTDs7O0lBRUMsZUFBQyxPQUFEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7UUFFQyx1Q0FBTSxPQUFOO1FBRUEsSUFBQyxDQUFBLEtBQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxLQUFELEdBQVUsQ0FBQztRQUNYLElBQUMsQ0FBQSxHQUFHLENBQUMsRUFBTCxHQUFVO1FBRVYsSUFBQyxDQUFBLFdBQUQsR0FBZSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQWIsQ0FBaUIsZUFBakIsRUFBaUMsS0FBakM7UUFFZixJQUFJLENBQUMsRUFBTCxDQUFRLFdBQVIsRUFBaUMsSUFBQyxDQUFBLGFBQWxDO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxZQUFSLEVBQWlDLElBQUMsQ0FBQSxPQUFsQztRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsd0JBQVIsRUFBaUMsSUFBQyxDQUFBLHdCQUFsQztRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsc0JBQVIs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LEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgIFxuMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMCAgXG4gICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICBcbjAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAgIFxuIyMjXG5cbnsgJCwgXywgY2xhbXAsIGVsZW0sIGVtcHR5LCBmaXJzdCwga2Vycm9yLCBrZXlpbmZvLCBrcG9zLCBwb3B1cCwgcG9zdCwgc2xhc2gsIHN0b3BFdmVudCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Sb3cgICAgICA9IHJlcXVpcmUgJy4vcm93J1xuU2Nyb2xsZXIgPSByZXF1aXJlICcuL3Njcm9sbGVyJ1xuQ29sdW1uICAgPSByZXF1aXJlICcuL2NvbHVtbidcbmZ1enp5ICAgID0gcmVxdWlyZSAnZnV6enknXG5odWIgICAgICA9IHJlcXVpcmUgJy4uL2dpdC9odWInXG4gICAgXG5jbGFzcyBTaGVsZiBleHRlbmRzIENvbHVtblxuXG4gICAgQDogKGJyb3dzZXIpIC0+XG5cbiAgICAgICAgc3VwZXIgYnJvd3NlclxuICAgICAgICBcbiAgICAgICAgQGl0ZW1zICA9IFtdXG4gICAgICAgIEBpbmRleCAgPSAtMVxuICAgICAgICBAZGl2LmlkID0gJ3NoZWxmJ1xuICAgICAgICBcbiAgICAgICAgQHNob3dIaXN0b3J5ID0gd2luZG93LnN0YXNoLmdldCAnc2hlbGZ8aGlzdG9yeScgZmFsc2VcblxuICAgICAgICBwb3N0Lm9uICdnaXRTdGF0dXMnICAgICAgICAgICAgICBAbG9hZEdpdFN0YXR1c1xuICAgICAgICBwb3N0Lm9uICdhZGRUb1NoZWxmJyAgICAgICAgICAgICBAYWRkUGF0aFxuICAgICAgICBwb3N0Lm9uICduYXZpZ2F0ZUhpc3RvcnlDaGFuZ2VkJyBAb25OYXZpZ2F0ZUhpc3RvcnlDaGFuZ2VkXG4gICAgICAgIHBvc3Qub24gJ25hdmlnYXRlSW5kZXhDaGFuZ2VkJyAgIEBvbk5hdmlnYXRlSW5kZXhDaGFuZ2VkXG4gICAgICAgIFxuICAgICAgICBwb3N0Lm9uICdmaWxlJyBAb25GaWxlXG4gICAgICAgXG4gICAgbWFrZVJvb3Q6ID0+IEB0b2dnbGVIaXN0b3J5KClcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgXG4gICBcbiAgICBhY3RpdmF0ZVJvdzogKHJvdykgLT4gXG4gICAgICAgIFxuICAgICAgICAkKCcuaG92ZXInKT8uY2xhc3NMaXN0LnJlbW92ZSAnaG92ZXInXG4gICAgICAgIFxuICAgICAgICBpdGVtID0gcm93Lml0ZW1cbiAgICAgICAgIFxuICAgICAgICBpZiBpdGVtLnR5cGUgPT0gJ2hpc3RvcnlTZXBhcmF0b3InXG4gICAgICAgICAgICByb3cuc2V0QWN0aXZlIGVtaXQ6ZmFsc2VcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgcm93LnNldEFjdGl2ZSBlbWl0OnRydWVcbiAgICAgICAgXG4gICAgICAgIGlmIGl0ZW0udHlwZSA9PSAnZmlsZSdcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvRmlsZScgaXRlbVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ2ZpbGVicm93c2VyJyAnbG9hZEl0ZW0nIGl0ZW1cbiAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgb25GaWxlOiAoZmlsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBmaWxlXG4gICAgICAgIGlmIEBuYXZpZ2F0aW5nUm93c1xuICAgICAgICAgICAgZGVsZXRlIEBuYXZpZ2F0aW5nUm93c1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBmb3IgaW5kZXggaW4gWzAuLi5AaXRlbXMubGVuZ3RoXVxuICAgICAgICAgICAgaWYgQGl0ZW1zW2luZGV4XS5maWxlID09IGZpbGVcbiAgICAgICAgICAgICAgICBAcm93c1tpbmRleF0uc2V0QWN0aXZlKClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIG1hdGNoZXMgPSBbXVxuICAgICAgICBmb3IgaW5kZXgsaXRlbSBvZiBAaXRlbXNcbiAgICAgICAgICAgIGlmIGZpbGU/LnN0YXJ0c1dpdGggaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgbWF0Y2hlcy5wdXNoIFtpbmRleCwgaXRlbV1cblxuICAgICAgICBpZiBub3QgZW1wdHkgbWF0Y2hlc1xuICAgICAgICAgICAgbWF0Y2hlcy5zb3J0IChhLGIpIC0+IGJbMV0uZmlsZS5sZW5ndGggLSBhWzFdLmZpbGUubGVuZ3RoXG4gICAgICAgICAgICBbaW5kZXgsIGl0ZW1dID0gZmlyc3QgbWF0Y2hlc1xuICAgICAgICAgICAgQHJvd3NbaW5kZXhdLnNldEFjdGl2ZSgpXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIGJyb3dzZXJEaWRJbml0Q29sdW1uczogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBAZGlkSW5pdFxuICAgICAgICBcbiAgICAgICAgQGRpZEluaXQgPSB0cnVlXG4gICAgICAgIFxuICAgICAgICBAbG9hZFNoZWxmSXRlbXMoKVxuICAgICAgICBcbiAgICAgICAgQGxvYWRIaXN0b3J5KCkgaWYgQHNob3dIaXN0b3J5XG4gICAgICAgIFxuICAgICAgICBAbG9hZEdpdFN0YXR1cygpXG4gICAgICAgICAgICAgICAgXG4gICAgbG9hZFNoZWxmSXRlbXM6IC0+XG4gICAgICAgIFxuICAgICAgICBpdGVtcyA9IHdpbmRvdy5zdGF0ZS5nZXQgXCJzaGVsZnxpdGVtc1wiXG4gICAgICAgIEBzZXRJdGVtcyBpdGVtcywgc2F2ZTpmYWxzZVxuICAgICAgICAgICAgICAgIFxuICAgIGFkZFBhdGg6IChwYXRoLCBvcHQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBzbGFzaC5pc0RpciBwYXRoXG4gICAgICAgICAgICBAYWRkRGlyIHBhdGgsIG9wdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAYWRkRmlsZSBwYXRoLCBvcHRcbiAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcblxuICAgIGl0ZW1QYXRoczogLT4gQHJvd3MubWFwIChyKSAtPiByLnBhdGgoKVxuICAgIFxuICAgIHNhdmVQcmVmczogLT4gd2luZG93LnN0YXRlLnNldCBcInNoZWxmfGl0ZW1zXCIgQGl0ZW1zXG4gICAgICAgICMgcHJlZnMuc2V0IFwic2hlbGbilrhpdGVtc1wiIEBpdGVtc1xuICAgIFxuICAgIHNldEl0ZW1zOiAoQGl0ZW1zLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBAY2xlYXIoKVxuICAgICAgICBcbiAgICAgICAgQGl0ZW1zID89IFtdXG4gICAgICAgIEBhZGRJdGVtcyBAaXRlbXNcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdD8uc2F2ZSAhPSBmYWxzZVxuICAgICAgICAgICAgQHNhdmVQcmVmcygpICAgICAgICAgICAgXG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgYWRkSXRlbXM6IChpdGVtcywgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGl0ZW1zXG4gICAgICAgIFxuICAgICAgICBmb3IgaXRlbSBpbiBpdGVtc1xuICAgICAgICAgICAgQHJvd3MucHVzaCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgICAgIFxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgYWRkRGlyOiAoZGlyLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBpdGVtID0gXG4gICAgICAgICAgICBuYW1lOiBzbGFzaC5maWxlIHNsYXNoLnRpbGRlIGRpclxuICAgICAgICAgICAgdHlwZTogJ2RpcidcbiAgICAgICAgICAgIGZpbGU6IHNsYXNoLnBhdGggZGlyXG4gICAgICAgIFxuICAgICAgICBAYWRkSXRlbSBpdGVtLCBvcHRcblxuICAgIGFkZEZpbGU6IChmaWxlLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBpdGVtID0gXG4gICAgICAgICAgICBuYW1lOiBzbGFzaC5maWxlIGZpbGVcbiAgICAgICAgICAgIHR5cGU6ICdmaWxlJ1xuICAgICAgICAgICAgZmlsZTogc2xhc2gucGF0aCBmaWxlXG4gICAgICAgIGl0ZW0udGV4dEZpbGUgPSB0cnVlIGlmIHNsYXNoLmlzVGV4dCBmaWxlXG4gICAgICAgIEBhZGRJdGVtIGl0ZW0sIG9wdFxuICAgICAgICBcbiAgICBhZGRGaWxlczogKGZpbGVzLCBvcHQpIC0+XG4gICAgICAgIGZvciBmaWxlIGluIGZpbGVzXG4gICAgICAgICAgICBpZiBzbGFzaC5pc0RpciBmaWxlXG4gICAgICAgICAgICAgICAgQGFkZERpciBmaWxlLCBvcHRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAYWRkRmlsZSBmaWxlLCBvcHRcbiAgICAgICAgXG4gICAgYWRkSXRlbTogIChpdGVtLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBfLnB1bGxBbGxXaXRoIEBpdGVtcywgW2l0ZW1dLCBfLmlzRXF1YWwgIyByZW1vdmUgaXRlbSBpZiBvbiBzaGVsZiBhbHJlYWR5XG4gICAgICAgIFxuICAgICAgICBpZiBvcHQ/LnBvc1xuICAgICAgICAgICAgaW5kZXggPSBAcm93SW5kZXhBdFBvcyBvcHQucG9zXG4gICAgICAgICAgICBAaXRlbXMuc3BsaWNlIE1hdGgubWluKGluZGV4LCBAaXRlbXMubGVuZ3RoKSwgMCwgaXRlbVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaXRlbXMucHVzaCBpdGVtXG4gICAgICAgICAgICBcbiAgICAgICAgQHNldEl0ZW1zIEBpdGVtc1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgb25Ecm9wOiAoZXZlbnQpID0+IFxuICAgIFxuICAgICAgICBhY3Rpb24gPSBldmVudC5nZXRNb2RpZmllclN0YXRlKCdTaGlmdCcpIGFuZCAnY29weScgb3IgJ21vdmUnXG4gICAgICAgIHNvdXJjZSA9IGV2ZW50LmRhdGFUcmFuc2Zlci5nZXREYXRhICd0ZXh0L3BsYWluJ1xuICAgICAgICBcbiAgICAgICAgaXRlbSA9IEBicm93c2VyLmZpbGVJdGVtIHNvdXJjZVxuICAgICAgICBAYWRkSXRlbSBpdGVtLCBwb3M6a3BvcyBldmVudFxuICAgIFxuICAgIGlzRW1wdHk6IC0+IGVtcHR5IEByb3dzXG4gICAgXG4gICAgY2xlYXI6IC0+XG4gICAgICAgIFxuICAgICAgICBAY2xlYXJTZWFyY2goKVxuICAgICAgICBAZGl2LnNjcm9sbFRvcCA9IDBcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIEByb3dzID0gW11cbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBuYW1lOiAtPiAnc2hlbGYnXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgXG5cbiAgICBsb2FkR2l0U3RhdHVzOiA9PlxuICAgICAgICBcbiAgICAgICAgZm9yIHJvdyBpbiBAcm93c1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAkKCcuYnJvd3NlclN0YXR1c0ljb24nLCByb3cuZGl2KT8ucmVtb3ZlKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZmlsZVN0YXR1cyA9IChyb3cpIC0+IChzdGF0dXMpID0+XG4gICAgICAgICAgICAgICAgZm9yIGZpbGUsIHN0YXR1cyBvZiBodWIuc3RhdHVzRmlsZXMgc3RhdHVzXG4gICAgICAgICAgICAgICAgICAgIGlmIGZpbGUuc3RhcnRzV2l0aCByb3cucGF0aCgpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiByb3cuaXRlbS50eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzID0gJ2RpcnMnXG4gICAgICAgICAgICAgICAgICAgICAgICByb3cuZGl2LmFwcGVuZENoaWxkIGVsZW0gJ3NwYW4nLCBjbGFzczpcImdpdC0je3N0YXR1c30taWNvbiBicm93c2VyU3RhdHVzSWNvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBodWIuc3RhdHVzIHJvdy5wYXRoKCksIGZpbGVTdGF0dXMgcm93XG5cbiAgICB1cGRhdGVHaXRGaWxlczogLT4gQGxvYWRHaXRTdGF0dXMoKVxuICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHRvZ2dsZUhpc3Rvcnk6ID0+XG4gICAgICAgIFxuICAgICAgICBAc2hvd0hpc3RvcnkgPSBub3QgQHNob3dIaXN0b3J5XG4gICAgICAgIGlmIEBzaG93SGlzdG9yeVxuICAgICAgICAgICAgQGxvYWRIaXN0b3J5KClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHJlbW92ZUhpc3RvcnkoKVxuICAgICAgICB3aW5kb3cuc3Rhc2guc2V0ICdzaGVsZnxoaXN0b3J5JyBAc2hvd0hpc3RvcnlcbiAgICAgICAgd2luZG93LnN0YXNoLnNldCAnc2hlbGZ8aGlzdG9yeScgQHNob3dIaXN0b3J5XG4gICAgY2xlYXJIaXN0b3J5OiA9PlxuICAgICAgICBcbiAgICAgICAgd2luZG93Lm5hdmlnYXRlLmNsZWFyKClcbiAgICAgICAgaWYgQHNob3dIaXN0b3J5IHRoZW4gQHNldEhpc3RvcnlJdGVtcyBbXG4gICAgICAgICAgICBmaWxlOiAgIHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgICAgIHBvczogICAgd2luZG93LmVkaXRvci5tYWluQ3Vyc29yKClcbiAgICAgICAgICAgIHRleHQ6ICAgc2xhc2guZmlsZSB3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgaGlzdG9yeVNlcGFyYXRvckluZGV4OiAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5AbnVtUm93cygpXVxuICAgICAgICAgICAgaWYgQHJvdyhpKS5pdGVtLnR5cGUgPT0gJ2hpc3RvcnlTZXBhcmF0b3InXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlcbiAgICAgICAgcmV0dXJuIEBudW1Sb3dzKClcbiAgICAgICAgXG4gICAgcmVtb3ZlSGlzdG9yeTogLT5cbiAgICAgICAgXG4gICAgICAgIHNlcGFyYXRvckluZGV4ID0gQGhpc3RvcnlTZXBhcmF0b3JJbmRleCgpXG4gICAgICAgIHdoaWxlIEBudW1Sb3dzKCkgYW5kIEBudW1Sb3dzKCkgPiBzZXBhcmF0b3JJbmRleFxuICAgICAgICAgICAgQHJlbW92ZVJvdyBAcm93KEBudW1Sb3dzKCktMSlcblxuICAgIG9uTmF2aWdhdGVIaXN0b3J5Q2hhbmdlZDogKGZpbGVQb3NpdGlvbnMsIGN1cnJlbnRJbmRleCkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBzaG93SGlzdG9yeVxuICAgICAgICAgICAgQHNldEhpc3RvcnlJdGVtcyBmaWxlUG9zaXRpb25zXG5cbiAgICBvbk5hdmlnYXRlSW5kZXhDaGFuZ2VkOiAoY3VycmVudEluZGV4LCBjdXJyZW50SXRlbSkgPT5cblxuICAgICAgICBpZiBAc2hvd0hpc3RvcnlcbiAgICAgICAgICAgIHJldmVyc2VJbmRleCA9IEBudW1Sb3dzKCkgLSBjdXJyZW50SW5kZXggLSAxXG4gICAgICAgICAgICBpZiBjdXJyZW50SXRlbS5maWxlICE9IEBhY3RpdmVSb3coKT8uaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgQHJvdyhyZXZlcnNlSW5kZXgpPy5zZXRBY3RpdmUoKVxuICAgICAgICAgICAgXG4gICAgbG9hZEhpc3Rvcnk6IC0+XG4gICAgICAgIFxuICAgICAgICBAc2V0SGlzdG9yeUl0ZW1zIHBvc3QuZ2V0ICduYXZpZ2F0ZScsICdmaWxlUG9zaXRpb25zJ1xuXG4gICAgc2V0SGlzdG9yeUl0ZW1zOiAoaXRlbXMpIC0+XG4gICAgXG4gICAgICAgIEByZW1vdmVIaXN0b3J5KClcbiAgICAgICAgXG4gICAgICAgIGl0ZW1zLm1hcCAoaCkgLT4gXG4gICAgICAgICAgICBoLnR5cGUgPSAnZmlsZSdcbiAgICAgICAgICAgIGgudGV4dCA9IHNsYXNoLnJlbW92ZUNvbHVtbiBoLnRleHRcbiAgICAgICAgaXRlbXMucmV2ZXJzZSgpXG4gICAgICAgIFxuICAgICAgICBpdGVtcy51bnNoaWZ0XG4gICAgICAgICAgICB0eXBlOiAnaGlzdG9yeVNlcGFyYXRvcidcbiAgICAgICAgICAgIGljb246ICdoaXN0b3J5LWljb24nXG4gICAgICAgIFxuICAgICAgICBAYWRkSXRlbXMgaXRlbXNcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBvbkZvY3VzOiA9PiBcblxuICAgICAgICBAZGl2LmNsYXNzTGlzdC5hZGQgJ2ZvY3VzJ1xuICAgICAgICBpZiBAYnJvd3Nlci5zaGVsZlNpemUgPCAyMDBcbiAgICAgICAgICAgIEBicm93c2VyLnNldFNoZWxmU2l6ZSAyMDBcbiAgICAgICAgICAgIFxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgb25Nb3VzZU92ZXI6IChldmVudCkgPT4gQHJvdyhldmVudC50YXJnZXQpPy5vbk1vdXNlT3ZlcigpXG4gICAgb25Nb3VzZU91dDogIChldmVudCkgPT4gQHJvdyhldmVudC50YXJnZXQpPy5vbk1vdXNlT3V0KClcbiAgICBvbkRibENsaWNrOiAgKGV2ZW50KSA9PiBAbmF2aWdhdGVDb2xzICdlbnRlcidcblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcblxuICAgIG5hdmlnYXRlUm93czogKGtleSkgLT5cblxuICAgICAgICByZXR1cm4ga2Vycm9yIFwibm8gcm93cyBpbiBjb2x1bW4gI3tAaW5kZXh9P1wiIGlmIG5vdCBAbnVtUm93cygpXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gLTFcbiAgICAgICAga2Vycm9yIFwibm8gaW5kZXggZnJvbSBhY3RpdmVSb3c/ICN7aW5kZXh9P1wiLCBAYWN0aXZlUm93KCkgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAndXAnICAgICAgICB0aGVuIGluZGV4LTFcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nICAgICAgdGhlbiBpbmRleCsxXG4gICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gMFxuICAgICAgICAgICAgd2hlbiAnZW5kJyAgICAgICB0aGVuIEBpdGVtcy5sZW5ndGhcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICAgdGhlbiBpbmRleC1AbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gY2xhbXAgMCwgQGl0ZW1zLmxlbmd0aCwgaW5kZXgrQG51bVZpc2libGUoKVxuICAgICAgICAgICAgZWxzZSBpbmRleFxuICAgICAgICAgICAgXG4gICAgICAgIGtlcnJvciBcIm5vIGluZGV4ICN7aW5kZXh9PyAje0BudW1WaXNpYmxlKCl9XCIgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXggICAgICAgIFxuICAgICAgICBpbmRleCA9IGNsYW1wIDAsIEBudW1Sb3dzKCktMSwgaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGtlcnJvciBcIm5vIHJvdyBhdCBpbmRleCAje2luZGV4fS8je0BudW1Sb3dzKCktMX0/XCIsIEBudW1Sb3dzKCkgaWYgbm90IEByb3dzW2luZGV4XT8uYWN0aXZhdGU/XG5cbiAgICAgICAgbmF2aWdhdGUgPSAoYWN0aW9uKSA9PlxuICAgICAgICAgICAgQG5hdmlnYXRpbmdSb3dzID0gdHJ1ZVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdtZW51QWN0aW9uJyBhY3Rpb25cbiAgICAgICAgXG4gICAgICAgIGlmICAgICAga2V5ID09ICd1cCcgICBhbmQgaW5kZXggPiBAaXRlbXMubGVuZ3RoICAgICB0aGVuIG5hdmlnYXRlICdOYXZpZ2F0ZSBGb3J3YXJkJ1xuICAgICAgICBlbHNlIGlmIGtleSA9PSAnZG93bicgYW5kIGluZGV4ID4gQGl0ZW1zLmxlbmd0aCArIDEgdGhlbiBuYXZpZ2F0ZSAnTmF2aWdhdGUgQmFja3dhcmQnXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJvdyA9IEByb3dzW2luZGV4XVxuICAgICAgICAgICAgcm93LnNldEFjdGl2ZSBlbWl0OmZhbHNlXG4gICAgICAgICAgICBpZiByb3cuaXRlbS50eXBlID09ICdmaWxlJ1xuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvRmlsZScgcm93Lml0ZW1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2ZpbGVicm93c2VyJyAnbG9hZEl0ZW0nIHJvdy5pdGVtLCBmb2N1czpmYWxzZVxuICAgIFxuICAgIG9wZW5GaWxlSW5OZXdXaW5kb3c6IC0+ICBcbiAgICAgICAgXG4gICAgICAgIGlmIGl0ZW0gPSBAYWN0aXZlUm93KCk/Lml0ZW1cbiAgICAgICAgICAgIGlmIGl0ZW0udHlwZSA9PSAnZmlsZScgYW5kIGl0ZW0udGV4dEZpbGVcbiAgICAgICAgICAgICAgICB3aW5kb3cub3BlbkZpbGVzIFtpdGVtLmZpbGVdLCBuZXdXaW5kb3c6IHRydWVcbiAgICAgICAgQFxuICAgIFxuICAgIHJlbW92ZU9iamVjdDogPT5cbiAgICAgICAgXG4gICAgICAgIHJvdyA9IEBhY3RpdmVSb3coKSA/IEBzZWxlY3RlZFJvdygpXG4gICAgICAgIFxuICAgICAgICBpZiByb3dcbiAgICAgICAgICAgIGlmIEBzaG93SGlzdG9yeVxuICAgICAgICAgICAgICAgIGlmIHJvdy5pdGVtLnR5cGUgPT0gJ2hpc3RvcnlTZXBhcmF0b3InXG4gICAgICAgICAgICAgICAgICAgIEB0b2dnbGVIaXN0b3J5KClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgaWYgcm93LmluZGV4KCkgPiBAaGlzdG9yeVNlcGFyYXRvckluZGV4KClcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lm5hdmlnYXRlLmRlbEZpbGVQb3Mgcm93Lml0ZW1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIG5leHRPclByZXYgPSByb3cubmV4dCgpID8gcm93LnByZXYoKVxuICAgICAgICAgICAgcm93LmRpdi5yZW1vdmUoKVxuICAgICAgICAgICAgQGl0ZW1zLnNwbGljZSByb3cuaW5kZXgoKSwgMVxuICAgICAgICAgICAgQHJvd3Muc3BsaWNlIHJvdy5pbmRleCgpLCAxXG4gICAgICAgICAgICBuZXh0T3JQcmV2Py5hY3RpdmF0ZSgpXG4gICAgICAgICAgICBAc2F2ZVByZWZzKClcbiAgICAgICAgQFxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgXG4gICAgXG4gICAgc2hvd0NvbnRleHRNZW51OiAoYWJzUG9zKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGFic1Bvcz9cbiAgICAgICAgICAgIGFic1BvcyA9IHBvcyBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0LCBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3BcbiAgICAgICAgXG4gICAgICAgIG9wdCA9IGl0ZW1zOiBbIFxuICAgICAgICAgICAgdGV4dDogICAnVG9nZ2xlIEhpc3RvcnknXG4gICAgICAgICAgICBjb21ibzogICdhbHQraCcgXG4gICAgICAgICAgICBjYjogICAgIEB0b2dnbGVIaXN0b3J5XG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ1RvZ2dsZSBFeHRlbnNpb25zJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQHRvZ2dsZUV4dGVuc2lvbnNcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnUmVtb3ZlJ1xuICAgICAgICAgICAgY29tYm86ICAnYmFja3NwYWNlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQHJlbW92ZU9iamVjdFxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdDbGVhciBIaXN0b3J5J1xuICAgICAgICAgICAgY2I6ICAgICBAY2xlYXJIaXN0b3J5XG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgb3B0LnkgPSBhYnNQb3MueVxuICAgICAgICBwb3B1cC5tZW51IG9wdFxuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIG9uS2V5OiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciB9ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuICAgICAgICBcbiAgICAgICAgIyBrbG9nICdjb21ibzonIGNvbWJvXG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrZW50ZXInICdjdHJsK2VudGVyJyB0aGVuIHJldHVybiBAb3BlbkZpbGVJbk5ld1dpbmRvdygpXG4gICAgICAgICAgICB3aGVuICdiYWNrc3BhY2UnICdkZWxldGUnIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGNsZWFyU2VhcmNoKCkucmVtb3ZlT2JqZWN0KClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQraycgJ2N0cmwraycgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50IGlmIEBicm93c2VyLmNsZWFuVXAoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCtlJyB0aGVuIEB0b2dnbGVFeHRlbnNpb25zKClcbiAgICAgICAgICAgIHdoZW4gJ3RhYicgICAgXG4gICAgICAgICAgICAgICAgaWYgQHNlYXJjaC5sZW5ndGggdGhlbiBAZG9TZWFyY2ggJydcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICB3aGVuICdlc2MnXG4gICAgICAgICAgICAgICAgaWYgQGRyYWdEaXZcbiAgICAgICAgICAgICAgICAgICAgQGRyYWdEaXYuZHJhZy5kcmFnU3RvcCgpXG4gICAgICAgICAgICAgICAgICAgIEBkcmFnRGl2LnJlbW92ZSgpXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBAZHJhZ0RpdlxuICAgICAgICAgICAgICAgIGlmIEBzZWFyY2gubGVuZ3RoIHRoZW4gQGNsZWFyU2VhcmNoKClcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICB3aGVuICd1cCcgJ2Rvd24nICdwYWdlIHVwJyAncGFnZSBkb3duJyAnaG9tZScgJ2VuZCcgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyBrZXlcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyAnYWx0K3JpZ2h0JyAnZW50ZXInXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGZvY3VzQnJvd3NlcigpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG1vZCBpbiBbJ3NoaWZ0JyAnJ10gYW5kIGNoYXIgdGhlbiBAZG9TZWFyY2ggY2hhclxuICAgICAgICBcbiAgICAgICAgaWYgQGRyYWdEaXZcbiAgICAgICAgICAgIEB1cGRhdGVEcmFnSW5kaWNhdG9yIGV2ZW50XG4gICAgICAgICAgICBcbiAgICBvbktleVVwOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgQHVwZGF0ZURyYWdJbmRpY2F0b3IgZXZlbnRcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFNoZWxmXG4iXX0=
//# sourceURL=../../coffee/browser/shelf.coffee