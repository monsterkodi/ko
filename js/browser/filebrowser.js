// koffee 1.18.0

/*
00000000  000  000      00000000        0000000    00000000    0000000   000   000   0000000  00000000  00000000
000       000  000      000             000   000  000   000  000   000  000 0 000  000       000       000   000
000000    000  000      0000000         0000000    0000000    000   000  000000000  0000000   0000000   0000000
000       000  000      000             000   000  000   000  000   000  000   000       000  000       000   000
000       000  0000000  00000000        0000000    000   000   0000000   00     00  0000000   00000000  000   000
 */
var $, Browser, File, FileBrowser, Info, Select, Shelf, clamp, drag, elem, empty, filelist, hub, klog, post, prefs, ref, slash, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = Object.hasOwn;

ref = require('kxk'), $ = ref.$, clamp = ref.clamp, drag = ref.drag, elem = ref.elem, empty = ref.empty, filelist = ref.filelist, klog = ref.klog, post = ref.post, prefs = ref.prefs, slash = ref.slash, valid = ref.valid;

Browser = require('./browser');

Shelf = require('./shelf');

Select = require('./select');

File = require('../tools/file');

Info = require('./info');

hub = require('../git/hub');

FileBrowser = (function(superClass) {
    extend(FileBrowser, superClass);

    function FileBrowser(view) {
        this.onShelfDrag = bind(this.onShelfDrag, this);
        this.onGitStatus = bind(this.onGitStatus, this);
        this.applyGitStatusFiles = bind(this.applyGitStatusFiles, this);
        this.getGitStatus = bind(this.getGitStatus, this);
        this.updateColumnScrolls = bind(this.updateColumnScrolls, this);
        this.loadDirItems = bind(this.loadDirItems, this);
        this.onDirChanged = bind(this.onDirChanged, this);
        this.onFileIndexed = bind(this.onFileIndexed, this);
        this.onFileBrowser = bind(this.onFileBrowser, this);
        this.refresh = bind(this.refresh, this);
        this.navigateToFile = bind(this.navigateToFile, this);
        this.onFile = bind(this.onFile, this);
        this.browse = bind(this.browse, this);
        FileBrowser.__super__.constructor.call(this, view);
        window.filebrowser = this;
        this.loadID = 0;
        this.shelf = new Shelf(this);
        this.select = new Select(this);
        this.name = 'FileBrowser';
        this.srcCache = {};
        post.on('file', this.onFile);
        post.on('browse', this.browse);
        post.on('filebrowser', this.onFileBrowser);
        post.on('gitStatus', this.onGitStatus);
        post.on('fileIndexed', this.onFileIndexed);
        post.on('dirChanged', this.onDirChanged);
        this.shelfResize = elem('div', {
            "class": 'shelfResize'
        });
        this.shelfResize.style.position = 'absolute';
        this.shelfResize.style.top = '0px';
        this.shelfResize.style.bottom = '0px';
        this.shelfResize.style.left = '194px';
        this.shelfResize.style.width = '6px';
        this.shelfResize.style.cursor = 'ew-resize';
        this.drag = new drag({
            target: this.shelfResize,
            onMove: this.onShelfDrag
        });
        this.shelfSize = window.state.get('shelf|size', 200);
        this.initColumns();
    }

    FileBrowser.prototype.dropAction = function(action, sources, target) {
        var i, j, len, len1, results, source;
        if (slash.isFile(target)) {
            target = slash.dir(target);
        }
        for (i = 0, len = sources.length; i < len; i++) {
            source = sources[i];
            if (action === 'move') {
                if (source === target || slash.dir(source) === target) {
                    klog('noop', source, target);
                    return;
                }
            }
        }
        results = [];
        for (j = 0, len1 = sources.length; j < len1; j++) {
            source = sources[j];
            switch (action) {
                case 'move':
                    results.push(File.rename(source, target, (function(_this) {
                        return function(source, target) {};
                    })(this)));
                    break;
                case 'copy':
                    results.push(File.copy(source, target, (function(_this) {
                        return function(source, target) {};
                    })(this)));
                    break;
                default:
                    results.push(void 0);
            }
        }
        return results;
    };

    FileBrowser.prototype.columnForFile = function(file) {
        var column, i, len, ref1, ref2;
        ref1 = this.columns;
        for (i = 0, len = ref1.length; i < len; i++) {
            column = ref1[i];
            if (((ref2 = column.parent) != null ? ref2.file : void 0) === slash.dir(file)) {
                return column;
            }
        }
    };

    FileBrowser.prototype.sharedColumnIndex = function(file) {
        var col, column, i, len, ref1, ref2;
        col = 0;
        ref1 = this.columns;
        for (i = 0, len = ref1.length; i < len; i++) {
            column = ref1[i];
            if (column.isDir() && file.startsWith(column.path())) {
                col += 1;
            } else {
                break;
            }
        }
        if (col === 1 && slash.dir(file) !== ((ref2 = this.columns[0]) != null ? ref2.path() : void 0)) {
            return 0;
        }
        return Math.max(-1, col - 2);
    };

    FileBrowser.prototype.browse = function(file, opt) {
        klog('browse', file, opt);
        if (file) {
            return this.loadItem(this.fileItem(file), opt);
        }
    };

    FileBrowser.prototype.onFile = function(file) {
        if (file && this.flex) {
            return this.navigateToFile(file);
        }
    };

    FileBrowser.prototype.navigateToFile = function(file) {

        /*
        triggered by 
            browse.start
            'file' posted from 
                fileeditor.setCurrentFile 
                
        reuses shared columns of current and new path
         */
        var col, i, index, item, lastPath, opt, paths, ref1, ref2, row;
        lastPath = (ref1 = this.lastDirColumn()) != null ? ref1.path() : void 0;
        file = slash.path(file);
        if (file === lastPath || file === this.lastColumnPath() || slash.isRelative(file)) {
            return;
        }
        col = this.sharedColumnIndex(file);
        filelist = slash.pathlist(file);
        if (col >= 0) {
            paths = filelist.slice(filelist.indexOf(this.columns[col].path()) + 1);
        } else {
            paths = filelist.slice(filelist.length - 2);
        }
        this.clearColumnsFrom(col + 1, {
            pop: true,
            clear: col + paths.length
        });
        while (this.numCols() < paths.length) {
            this.addColumn();
        }
        for (index = i = 0, ref2 = paths.length; 0 <= ref2 ? i < ref2 : i > ref2; index = 0 <= ref2 ? ++i : --i) {
            item = this.fileItem(paths[index]);
            switch (item.type) {
                case 'file':
                    this.loadFileItem(item, col + 1 + index);
                    break;
                case 'dir':
                    opt = {};
                    if (index < paths.length - 1) {
                        opt.active = paths[index + 1];
                    }
                    this.loadDirItem(item, col + 1 + index, opt);
            }
        }
        if (col = this.lastDirColumn()) {
            if (row = col.row(slash.file(file))) {
                return row.setActive();
            }
        }
    };

    FileBrowser.prototype.refresh = function() {
        hub.refresh();
        this.srcCache = {};
        if (this.lastUsedColumn()) {
            return this.navigateToFile(this.lastUsedColumn().path());
        }
    };

    FileBrowser.prototype.fileItem = function(path) {
        var p;
        p = slash.resolve(path);
        return {
            file: p,
            type: slash.isFile(p) && 'file' || 'dir',
            name: slash.file(p)
        };
    };

    FileBrowser.prototype.onFileBrowser = function(action, item, arg) {
        switch (action) {
            case 'loadItem':
                return this.loadItem(item, arg);
            case 'activateItem':
                return this.activateItem(item, arg);
        }
    };

    FileBrowser.prototype.loadDir = function(path) {
        return this.loadItem({
            type: 'dir',
            file: path
        });
    };

    FileBrowser.prototype.loadItem = function(item, opt) {

        /*
        triggered by 
            @loadDir
            @browse 
            @navigate (defined in browser)
            'filebrowser' 'loadItem' posted from 
                shelf.activateRow
                shelf.navigatingRows
                browse.start
                
        clears all columns, loads the dir in column 0 and the file in column 1, if any
         */
        var ref1, ref2;
        if (opt != null) {
            opt;
        } else {
            opt = {
                active: '..',
                focus: true
            };
        }
        if (item.name != null) {
            item.name;
        } else {
            item.name = slash.file(item.file);
        }
        this.clearColumnsFrom(1, {
            pop: true,
            clear: (ref1 = opt.clear) != null ? ref1 : 1
        });
        switch (item.type) {
            case 'dir':
                this.loadDirItem(item, 0, opt);
                break;
            case 'file':
                opt.activate = item.file;
                while (this.numCols() < 2) {
                    this.addColumn();
                }
                this.loadDirItem(this.fileItem(slash.dir(item.file)), 0, opt);
        }
        if (opt.focus) {
            return (ref2 = this.columns[0]) != null ? ref2.focus() : void 0;
        }
    };

    FileBrowser.prototype.activateItem = function(item, col) {

        /*
        triggered by post('filebrowser' 'activateItem') in row.activate
        
        loads item in the column to the right of col while keeping the other columns
         */
        this.clearColumnsFrom(col + 2, {
            pop: true
        });
        switch (item.type) {
            case 'dir':
                return this.loadDirItem(item, col + 1, {
                    focus: false
                });
            case 'file':
                this.loadFileItem(item, col + 1);
                if (item.textFile || File.isText(item.file)) {
                    return post.emit('jumpToFile', item);
                }
        }
    };

    FileBrowser.prototype.loadFileItem = function(item, col) {
        var file;
        if (col == null) {
            col = 0;
        }
        this.clearColumnsFrom(col, {
            pop: true
        });
        while (col >= this.numCols()) {
            this.addColumn();
        }
        file = item.file;
        this.columns[col].parent = item;
        if (File.isImage(file)) {
            this.imageInfoColumn(col, file);
        } else {
            switch (slash.ext(file)) {
                case 'tiff':
                case 'tif':
                    if (!slash.win()) {
                        this.convertImage(row);
                    } else {
                        this.fileInfoColumn(col, file);
                    }
                    break;
                case 'pxm':
                    if (!slash.win()) {
                        this.convertPXM(row);
                    } else {
                        this.fileInfoColumn(col, file);
                    }
                    break;
                default:
                    if (File.isText(item.file)) {
                        this.loadSourceItem(item, col);
                    }
                    if (!File.isCode(item.file)) {
                        this.fileInfoColumn(col, file);
                    }
            }
        }
        post.emit('load', {
            column: col,
            item: item
        });
        return this.updateColumnScrolls();
    };

    FileBrowser.prototype.imageInfoColumn = function(col, file) {
        this.columns[col].crumb.hide();
        return this.columns[col].table.appendChild(Info.image(file));
    };

    FileBrowser.prototype.fileInfoColumn = function(col, file) {
        this.columns[col].crumb.hide();
        return this.columns[col].table.appendChild(Info.file(file));
    };

    FileBrowser.prototype.onFileIndexed = function(file, info) {
        var ref1, ref2, ref3;
        this.srcCache[file] = info;
        if (file === ((ref1 = this.lastUsedColumn()) != null ? (ref2 = ref1.parent) != null ? ref2.file : void 0 : void 0)) {
            return this.loadSourceItem({
                file: file,
                type: 'file'
            }, (ref3 = this.lastUsedColumn()) != null ? ref3.index : void 0);
        }
    };

    FileBrowser.prototype.loadSourceItem = function(item, col) {
        var clss, clsss, func, funcs, i, info, items, j, len, len1, ref1, ref2, text;
        if (this.srcCache[item.file] == null) {
            this.srcCache[item.file] = post.get('indexer', 'file', item.file);
        }
        info = this.srcCache[item.file];
        if (empty(info)) {
            this.columns[col].loadItems([], item);
            return;
        }
        items = [];
        clsss = (ref1 = info.classes) != null ? ref1 : [];
        for (i = 0, len = clsss.length; i < len; i++) {
            clss = clsss[i];
            text = '● ' + clss.name;
            items.push({
                name: clss.name,
                text: text,
                type: 'class',
                file: item.file,
                line: clss.line
            });
        }
        funcs = (ref2 = info.funcs) != null ? ref2 : [];
        for (j = 0, len1 = funcs.length; j < len1; j++) {
            func = funcs[j];
            if (func.test === 'describe') {
                text = '● ' + func.name;
            } else if (func["static"]) {
                text = '  ◆ ' + func.name;
            } else if (func.post) {
                text = '  ⬢ ' + func.name;
            } else {
                text = '  ▸ ' + func.name;
            }
            items.push({
                name: func.name,
                text: text,
                type: 'func',
                file: item.file,
                line: func.line
            });
        }
        if (valid(items)) {
            items.sort(function(a, b) {
                return a.line - b.line;
            });
            return this.columns[col].loadItems(items, item);
        }
    };

    FileBrowser.prototype.onDirChanged = function(info) {
        var column, i, len, ref1, results;
        ref1 = this.columns;
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            column = ref1[i];
            if (column.path() === info.dir) {
                this.loadDirItem({
                    file: info.dir,
                    type: 'dir'
                }, column.index, {
                    active: column.activePath(),
                    focus: false
                });
            }
            if (column.path() === info.path && info.change === 'remove') {
                results.push(column.clear());
            } else {
                results.push(void 0);
            }
        }
        return results;
    };

    FileBrowser.prototype.loadDirItem = function(item, col, opt) {
        var dir;
        if (col == null) {
            col = 0;
        }
        if (opt == null) {
            opt = {};
        }
        if (col > 0 && item.name === '/') {
            return;
        }
        dir = item.file;
        opt.ignoreHidden = !prefs.get("browser▸showHidden▸" + dir);
        return slash.list(dir, opt, (function(_this) {
            return function(items) {
                post.toMain('dirLoaded', dir);
                _this.loadDirItems(dir, item, items, col, opt);
                return post.emit('dir', dir);
            };
        })(this));
    };

    FileBrowser.prototype.loadDirItems = function(dir, item, items, col, opt) {
        var lastColumn, ref1, ref2, row;
        this.updateColumnScrolls();
        if (this.skipOnDblClick && col > 0) {
            delete this.skipOnDblClick;
            return;
        }
        while (col >= this.numCols()) {
            this.addColumn();
        }
        this.columns[col].loadItems(items, item);
        post.emit('load', {
            column: col,
            item: item
        });
        if (opt.activate) {
            if (row = this.columns[col].row(slash.file(opt.activate))) {
                row.activate();
                post.emit('load', {
                    column: col + 1,
                    item: row.item
                });
            }
        } else if (opt.active) {
            if ((ref1 = this.columns[col].row(slash.file(opt.active))) != null) {
                ref1.setActive();
            }
        }
        this.getGitStatus(item, col);
        if (opt.focus !== false && empty(document.activeElement) && empty((ref2 = $('.popup')) != null ? ref2.outerHTML : void 0)) {
            if (lastColumn = this.lastDirColumn()) {
                lastColumn.focus();
            }
        }
        if (typeof opt.cb === "function") {
            opt.cb({
                column: col,
                item: item
            });
        }
        if (col >= 2 && this.columns[0].width() < 250) {
            return this.columns[1].makeRoot();
        }
    };

    FileBrowser.prototype.initColumns = function() {
        FileBrowser.__super__.initColumns.call(this);
        this.view.insertBefore(this.shelf.div, this.view.firstChild);
        this.view.insertBefore(this.shelfResize, null);
        this.shelf.browserDidInitColumns();
        return this.setShelfSize(this.shelfSize);
    };

    FileBrowser.prototype.columnAtPos = function(pos) {
        var column;
        if (column = FileBrowser.__super__.columnAtPos.call(this, pos)) {
            return column;
        }
        if (elem.containsPos(this.shelf.div, pos)) {
            return this.shelf;
        }
    };

    FileBrowser.prototype.lastColumnPath = function() {
        var lastColumn;
        if (lastColumn = this.lastUsedColumn()) {
            return lastColumn.path();
        }
    };

    FileBrowser.prototype.lastDirColumn = function() {
        var lastColumn;
        if (lastColumn = this.lastUsedColumn()) {
            if (lastColumn.isDir()) {
                return lastColumn;
            } else {
                return lastColumn.prevColumn();
            }
        }
    };

    FileBrowser.prototype.lastDirOrSrcColumn = function() {
        var lastColumn;
        if (lastColumn = this.lastUsedColumn()) {
            if (lastColumn.isDir() || lastColumn.isSrc()) {
                return lastColumn;
            } else {
                return lastColumn.prevColumn();
            }
        }
    };

    FileBrowser.prototype.onBackspaceInColumn = function(column) {
        return column.backspaceSearch();
    };

    FileBrowser.prototype.onDeleteInColumn = function(column) {
        if (column.searchDiv) {
            return column.clearSearch();
        } else {
            return column.moveToTrash();
        }
    };

    FileBrowser.prototype.updateColumnScrolls = function() {
        var ref1;
        FileBrowser.__super__.updateColumnScrolls.call(this);
        return (ref1 = this.shelf) != null ? ref1.scroll.update() : void 0;
    };

    FileBrowser.prototype.getGitStatus = function(item, col) {
        var file, ref1, ref2;
        file = (ref1 = item.file) != null ? ref1 : (ref2 = item.parent) != null ? ref2.file : void 0;
        if (empty(file)) {
            return;
        }
        return hub.status(file, (function(_this) {
            return function(status) {
                return _this.applyGitStatusFiles(col, hub.statusFiles(status));
            };
        })(this));
    };

    FileBrowser.prototype.applyGitStatusFiles = function(col, files) {
        var ref1;
        return (ref1 = this.columns[col]) != null ? ref1.updateGitFiles(files) : void 0;
    };

    FileBrowser.prototype.onGitStatus = function(gitDir, status) {
        var col, files, i, ref1, results;
        files = hub.statusFiles(status);
        results = [];
        for (col = i = 0, ref1 = this.columns.length; 0 <= ref1 ? i <= ref1 : i >= ref1; col = 0 <= ref1 ? ++i : --i) {
            results.push(this.applyGitStatusFiles(col, files));
        }
        return results;
    };

    FileBrowser.prototype.onShelfDrag = function(drag, event) {
        var shelfSize;
        shelfSize = clamp(0, 400, drag.pos.x);
        return this.setShelfSize(shelfSize);
    };

    FileBrowser.prototype.setShelfSize = function(shelfSize1) {
        this.shelfSize = shelfSize1;
        window.state.set('shelf|size', this.shelfSize);
        this.shelfResize.style.left = this.shelfSize + "px";
        this.shelf.div.style.width = this.shelfSize + "px";
        this.cols.style.left = this.shelfSize + "px";
        return this.updateColumnScrolls();
    };

    FileBrowser.prototype.toggleShelf = function() {
        var ref1;
        if (this.shelfSize < 1) {
            this.setShelfSize(200);
        } else {
            klog('toggleShelf lastUsedColumn.focus');
            if ((ref1 = this.lastUsedColumn()) != null) {
                ref1.focus();
            }
            this.setShelfSize(0);
        }
        return this.updateColumnScrolls();
    };

    return FileBrowser;

})(Browser);

module.exports = FileBrowser;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWJyb3dzZXIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2Jyb3dzZXIiLCJzb3VyY2VzIjpbImZpbGVicm93c2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxpSUFBQTtJQUFBOzs7O0FBUUEsTUFBNkUsT0FBQSxDQUFRLEtBQVIsQ0FBN0UsRUFBRSxTQUFGLEVBQUssaUJBQUwsRUFBWSxlQUFaLEVBQWtCLGVBQWxCLEVBQXdCLGlCQUF4QixFQUErQix1QkFBL0IsRUFBeUMsZUFBekMsRUFBK0MsZUFBL0MsRUFBcUQsaUJBQXJELEVBQTRELGlCQUE1RCxFQUFtRTs7QUFFbkUsT0FBQSxHQUFXLE9BQUEsQ0FBUSxXQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsU0FBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0FBQ1gsSUFBQSxHQUFXLE9BQUEsQ0FBUSxlQUFSOztBQUNYLElBQUEsR0FBVyxPQUFBLENBQVEsUUFBUjs7QUFDWCxHQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBRUw7OztJQUVDLHFCQUFDLElBQUQ7Ozs7Ozs7Ozs7Ozs7O1FBRUMsNkNBQU0sSUFBTjtRQUVBLE1BQU0sQ0FBQyxXQUFQLEdBQXFCO1FBRXJCLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsS0FBRCxHQUFVLElBQUksS0FBSixDQUFVLElBQVY7UUFDVixJQUFDLENBQUEsTUFBRCxHQUFVLElBQUksTUFBSixDQUFXLElBQVg7UUFDVixJQUFDLENBQUEsSUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLFFBQUQsR0FBWTtRQUVaLElBQUksQ0FBQyxFQUFMLENBQVEsTUFBUixFQUF5QixJQUFDLENBQUEsTUFBMUI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFFBQVIsRUFBeUIsSUFBQyxDQUFBLE1BQTFCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxhQUFSLEVBQXlCLElBQUMs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O2VBQ1osSUFBQyxDQUFBLFlBQUQsQ0FBYyxTQUFkO0lBSFM7OzBCQUtiLFlBQUEsR0FBYyxTQUFDLFVBQUQ7UUFBQyxJQUFDLENBQUEsWUFBRDtRQUVYLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBYixDQUFpQixZQUFqQixFQUE4QixJQUFDLENBQUEsU0FBL0I7UUFDQSxJQUFDLENBQUEsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFuQixHQUE2QixJQUFDLENBQUEsU0FBRixHQUFZO1FBQ3hDLElBQUMsQ0FBQSxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFqQixHQUE0QixJQUFDLENBQUEsU0FBRixHQUFZO1FBQ3ZDLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQVosR0FBc0IsSUFBQyxDQUFBLFNBQUYsR0FBWTtlQUNqQyxJQUFDLENBQUEsbUJBQUQsQ0FBQTtJQU5VOzswQkFRZCxXQUFBLEdBQWEsU0FBQTtBQUVULFlBQUE7UUFBQSxJQUFHLElBQUMsQ0FBQSxTQUFELEdBQWEsQ0FBaEI7WUFDSSxJQUFDLENBQUEsWUFBRCxDQUFjLEdBQWQsRUFESjtTQUFBLE1BQUE7WUFHSSxJQUFBLENBQUssa0NBQUw7O29CQUNpQixDQUFFLEtBQW5CLENBQUE7O1lBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBYyxDQUFkLEVBTEo7O2VBT0EsSUFBQyxDQUFBLG1CQUFELENBQUE7SUFUUzs7OztHQXRnQlM7O0FBaWhCMUIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgJCwgY2xhbXAsIGRyYWcsIGVsZW0sIGVtcHR5LCBmaWxlbGlzdCwga2xvZywgcG9zdCwgcHJlZnMsIHNsYXNoLCB2YWxpZCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Ccm93c2VyICA9IHJlcXVpcmUgJy4vYnJvd3NlcidcblNoZWxmICAgID0gcmVxdWlyZSAnLi9zaGVsZidcblNlbGVjdCAgID0gcmVxdWlyZSAnLi9zZWxlY3QnXG5GaWxlICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL2ZpbGUnXG5JbmZvICAgICA9IHJlcXVpcmUgJy4vaW5mbydcbmh1YiAgICAgID0gcmVxdWlyZSAnLi4vZ2l0L2h1YidcblxuY2xhc3MgRmlsZUJyb3dzZXIgZXh0ZW5kcyBCcm93c2VyXG5cbiAgICBAOiAodmlldykgLT5cblxuICAgICAgICBzdXBlciB2aWV3XG5cbiAgICAgICAgd2luZG93LmZpbGVicm93c2VyID0gQFxuXG4gICAgICAgIEBsb2FkSUQgPSAwXG4gICAgICAgIEBzaGVsZiAgPSBuZXcgU2hlbGYgQFxuICAgICAgICBAc2VsZWN0ID0gbmV3IFNlbGVjdCBAXG4gICAgICAgIEBuYW1lICAgPSAnRmlsZUJyb3dzZXInXG4gICAgICAgIEBzcmNDYWNoZSA9IHt9XG4gICAgICAgIFxuICAgICAgICBwb3N0Lm9uICdmaWxlJyAgICAgICAgICAgQG9uRmlsZVxuICAgICAgICBwb3N0Lm9uICdicm93c2UnICAgICAgICAgQGJyb3dzZVxuICAgICAgICBwb3N0Lm9uICdmaWxlYnJvd3NlcicgICAgQG9uRmlsZUJyb3dzZXJcblxuICAgICAgICBwb3N0Lm9uICdnaXRTdGF0dXMnICAgICAgQG9uR2l0U3RhdHVzXG4gICAgICAgIHBvc3Qub24gJ2ZpbGVJbmRleGVkJyAgICBAb25GaWxlSW5kZXhlZFxuICAgICAgICBwb3N0Lm9uICdkaXJDaGFuZ2VkJyAgICAgQG9uRGlyQ2hhbmdlZFxuICAgICAgICBcbiAgICAgICAgQHNoZWxmUmVzaXplID0gZWxlbSAnZGl2JyBjbGFzczogJ3NoZWxmUmVzaXplJ1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS50b3AgICAgICA9ICcwcHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5ib3R0b20gICA9ICcwcHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5sZWZ0ICAgICA9ICcxOTRweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLndpZHRoICAgID0gJzZweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmN1cnNvciAgID0gJ2V3LXJlc2l6ZSdcblxuICAgICAgICBAZHJhZyA9IG5ldyBkcmFnXG4gICAgICAgICAgICB0YXJnZXQ6ICBAc2hlbGZSZXNpemVcbiAgICAgICAgICAgIG9uTW92ZTogIEBvblNoZWxmRHJhZ1xuXG4gICAgICAgIEBzaGVsZlNpemUgPSB3aW5kb3cuc3RhdGUuZ2V0ICdzaGVsZnxzaXplJyAyMDBcblxuICAgICAgICBAaW5pdENvbHVtbnMoKVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBkcm9wQWN0aW9uOiAoYWN0aW9uLCBzb3VyY2VzLCB0YXJnZXQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBzbGFzaC5pc0ZpbGUgdGFyZ2V0XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRhcmdldCA9IHNsYXNoLmRpciB0YXJnZXRcbiAgICAgICAgXG4gICAgICAgIGZvciBzb3VyY2UgaW4gc291cmNlc1xuICAgICAgICBcbiAgICAgICAgICAgIGlmIGFjdGlvbiA9PSAnbW92ZScgXG4gICAgICAgICAgICAgICAgaWYgc291cmNlID09IHRhcmdldCBvciBzbGFzaC5kaXIoc291cmNlKSA9PSB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAga2xvZyAnbm9vcCcgc291cmNlLCB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgZm9yIHNvdXJjZSBpbiBzb3VyY2VzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN3aXRjaCBhY3Rpb25cbiAgICAgICAgICAgICAgICB3aGVuICdtb3ZlJyB0aGVuIEZpbGUucmVuYW1lIHNvdXJjZSwgdGFyZ2V0LCAoc291cmNlLCB0YXJnZXQpID0+ICMga2xvZyAnZmlsZSBtb3ZlZCcgc291cmNlLCB0YXJnZXRcbiAgICAgICAgICAgICAgICB3aGVuICdjb3B5JyB0aGVuIEZpbGUuY29weSBzb3VyY2UsIHRhcmdldCwgKHNvdXJjZSwgdGFyZ2V0KSA9PiAjIGtsb2cgJ2ZpbGUgY29waWVkJyBzb3VyY2UsIHRhcmdldFxuICAgICAgICAgICAgICAgICAgICBcbiAgICBjb2x1bW5Gb3JGaWxlOiAoZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBjb2x1bW4gaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIGNvbHVtbi5wYXJlbnQ/LmZpbGUgPT0gc2xhc2guZGlyIGZpbGVcbiAgICAgICAgICAgICAgICByZXR1cm4gY29sdW1uXG4gICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHNoYXJlZENvbHVtbkluZGV4OiAoZmlsZSkgLT4gXG4gICAgICAgIFxuICAgICAgICBjb2wgPSAwXG4gICAgICAgIFxuICAgICAgICBmb3IgY29sdW1uIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBjb2x1bW4uaXNEaXIoKSBhbmQgZmlsZS5zdGFydHNXaXRoIGNvbHVtbi5wYXRoKClcbiAgICAgICAgICAgICAgICBjb2wgKz0gMVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNvbCA9PSAxIGFuZCBzbGFzaC5kaXIoZmlsZSkgIT0gQGNvbHVtbnNbMF0/LnBhdGgoKVxuICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgTWF0aC5tYXggLTEsIGNvbC0yXG5cbiAgICBicm93c2U6IChmaWxlLCBvcHQpID0+IFxuXG4gICAgICAgIGtsb2cgJ2Jyb3dzZScgZmlsZSwgb3B0XG4gICAgICAgIGlmIGZpbGUgdGhlbiBAbG9hZEl0ZW0gQGZpbGVJdGVtKGZpbGUpLCBvcHRcbiAgICAgICAgXG4gICAgb25GaWxlOiAoZmlsZSkgPT4gXG4gICAgXG4gICAgICAgICMga2xvZyAnb25GaWxlJyBmaWxlXG4gICAgICAgIGlmIGZpbGUgYW5kIEBmbGV4IHRoZW4gQG5hdmlnYXRlVG9GaWxlIGZpbGVcbiAgICBcbiAgICBuYXZpZ2F0ZVRvRmlsZTogKGZpbGUpID0+XG5cbiAgICAgICAgIyMjXG4gICAgICAgIHRyaWdnZXJlZCBieSBcbiAgICAgICAgICAgIGJyb3dzZS5zdGFydFxuICAgICAgICAgICAgJ2ZpbGUnIHBvc3RlZCBmcm9tIFxuICAgICAgICAgICAgICAgIGZpbGVlZGl0b3Iuc2V0Q3VycmVudEZpbGUgXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHJldXNlcyBzaGFyZWQgY29sdW1ucyBvZiBjdXJyZW50IGFuZCBuZXcgcGF0aFxuICAgICAgICAjIyNcbiAgICAgICAgXG4gICAgICAgICMga2xvZyAnbmF2aWdhdGVUb0ZpbGUnIGZpbGVcbiAgICAgICAgXG4gICAgICAgIGxhc3RQYXRoID0gQGxhc3REaXJDb2x1bW4oKT8ucGF0aCgpXG4gICAgICAgIFxuICAgICAgICBmaWxlID0gc2xhc2gucGF0aCBmaWxlXG5cbiAgICAgICAgaWYgZmlsZSA9PSBsYXN0UGF0aCBvciBmaWxlID09IEBsYXN0Q29sdW1uUGF0aCgpIG9yIHNsYXNoLmlzUmVsYXRpdmUgZmlsZVxuICAgICAgICAgICAgIyBrbG9nICduYXZpZ2F0ZVRvRmlsZSBTS0lQIGFscmVhZHkgbG9hZGVkJyBsYXN0UGF0aCwgQGxhc3RDb2x1bW5QYXRoKClcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICMga2xvZyAnbmF2aWdhdGVUb0ZpbGUnIGZpbGVcbiAgICAgICAgIyBrbG9nICduYXZpZ2F0ZVRvRmlsZScgQGxhc3RDb2x1bW5QYXRoKClcbiAgICAgICAgIyBrbG9nICduYXZpZ2F0ZVRvRmlsZScgQGxhc3REaXJDb2x1bW4oKT8ucGF0aCgpXG4gICAgICAgICAgICBcbiAgICAgICAgY29sID0gQHNoYXJlZENvbHVtbkluZGV4IGZpbGVcbiAgICAgICAgXG4gICAgICAgIGZpbGVsaXN0ID0gc2xhc2gucGF0aGxpc3QgZmlsZVxuICAgICAgICBcbiAgICAgICAgaWYgY29sID49IDBcbiAgICAgICAgICAgIHBhdGhzID0gZmlsZWxpc3Quc2xpY2UgZmlsZWxpc3QuaW5kZXhPZihAY29sdW1uc1tjb2xdLnBhdGgoKSkrMVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwYXRocyA9IGZpbGVsaXN0LnNsaWNlIGZpbGVsaXN0Lmxlbmd0aC0yXG4gICAgICAgICAgICBcbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sKzEsIHBvcDp0cnVlIGNsZWFyOmNvbCtwYXRocy5sZW5ndGhcbiAgICAgICAgXG4gICAgICAgIHdoaWxlIEBudW1Db2xzKCkgPCBwYXRocy5sZW5ndGhcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGZvciBpbmRleCBpbiBbMC4uLnBhdGhzLmxlbmd0aF1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaXRlbSA9IEBmaWxlSXRlbSBwYXRoc1tpbmRleF1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3dpdGNoIGl0ZW0udHlwZVxuICAgICAgICAgICAgICAgIHdoZW4gJ2ZpbGUnIFxuICAgICAgICAgICAgICAgICAgICBAbG9hZEZpbGVJdGVtIGl0ZW0sIGNvbCsxK2luZGV4XG4gICAgICAgICAgICAgICAgd2hlbiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICBvcHQgPSB7fVxuICAgICAgICAgICAgICAgICAgICBpZiBpbmRleCA8IHBhdGhzLmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHQuYWN0aXZlID0gcGF0aHNbaW5kZXgrMV1cbiAgICAgICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtIGl0ZW0sIGNvbCsxK2luZGV4LCBvcHRcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNvbCA9IEBsYXN0RGlyQ29sdW1uKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgcm93ID0gY29sLnJvdyhzbGFzaC5maWxlIGZpbGUpXG4gICAgICAgICAgICAgICAgcm93LnNldEFjdGl2ZSgpXG5cbiAgICByZWZyZXNoOiA9PlxuXG4gICAgICAgIGh1Yi5yZWZyZXNoKClcbiAgICAgICAgQHNyY0NhY2hlID0ge31cblxuICAgICAgICBpZiBAbGFzdFVzZWRDb2x1bW4oKVxuICAgICAgICAgICAgQG5hdmlnYXRlVG9GaWxlIEBsYXN0VXNlZENvbHVtbigpLnBhdGgoKVxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGZpbGVJdGVtOiAocGF0aCkgLT5cbiAgICAgICAgXG4gICAgICAgIHAgPSBzbGFzaC5yZXNvbHZlIHBhdGhcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgZmlsZTpwXG4gICAgICAgIHR5cGU6c2xhc2guaXNGaWxlKHApIGFuZCAnZmlsZScgb3IgJ2RpcidcbiAgICAgICAgbmFtZTpzbGFzaC5maWxlIHBcbiAgICAgICAgXG4gICAgb25GaWxlQnJvd3NlcjogKGFjdGlvbiwgaXRlbSwgYXJnKSA9PlxuXG4gICAgICAgICMga2xvZyAnb25GaWxlQnJvd3NlcicgYWN0aW9uLCBpdGVtLnR5cGUsIGFyZ1xuICAgICAgICBzd2l0Y2ggYWN0aW9uXG4gICAgICAgICAgICB3aGVuICdsb2FkSXRlbScgICAgIHRoZW4gQGxvYWRJdGVtICAgICBpdGVtLCBhcmdcbiAgICAgICAgICAgIHdoZW4gJ2FjdGl2YXRlSXRlbScgdGhlbiBAYWN0aXZhdGVJdGVtIGl0ZW0sIGFyZ1xuICAgIFxuICAgIGxvYWREaXI6IChwYXRoKSAtPiBAbG9hZEl0ZW0gdHlwZTonZGlyJyBmaWxlOnBhdGhcbiAgICBcbiAgICBsb2FkSXRlbTogKGl0ZW0sIG9wdCkgLT4gXG4gICAgXG4gICAgICAgICMjI1xuICAgICAgICB0cmlnZ2VyZWQgYnkgXG4gICAgICAgICAgICBAbG9hZERpclxuICAgICAgICAgICAgQGJyb3dzZSBcbiAgICAgICAgICAgIEBuYXZpZ2F0ZSAoZGVmaW5lZCBpbiBicm93c2VyKVxuICAgICAgICAgICAgJ2ZpbGVicm93c2VyJyAnbG9hZEl0ZW0nIHBvc3RlZCBmcm9tIFxuICAgICAgICAgICAgICAgIHNoZWxmLmFjdGl2YXRlUm93XG4gICAgICAgICAgICAgICAgc2hlbGYubmF2aWdhdGluZ1Jvd3NcbiAgICAgICAgICAgICAgICBicm93c2Uuc3RhcnRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgY2xlYXJzIGFsbCBjb2x1bW5zLCBsb2FkcyB0aGUgZGlyIGluIGNvbHVtbiAwIGFuZCB0aGUgZmlsZSBpbiBjb2x1bW4gMSwgaWYgYW55XG4gICAgICAgICMjI1xuXG4gICAgICAgICMga2xvZyAnbG9hZEl0ZW0nIGl0ZW0sIG9wdFxuICAgICAgICBcbiAgICAgICAgb3B0ID89IGFjdGl2ZTonLi4nIGZvY3VzOnRydWVcbiAgICAgICAgaXRlbS5uYW1lID89IHNsYXNoLmZpbGUgaXRlbS5maWxlXG5cbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gMSwgcG9wOnRydWUsIGNsZWFyOm9wdC5jbGVhciA/IDFcblxuICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICB3aGVuICdkaXInICB0aGVuIEBsb2FkRGlySXRlbSBpdGVtLCAwLCBvcHRcbiAgICAgICAgICAgIHdoZW4gJ2ZpbGUnIFxuICAgICAgICAgICAgICAgIG9wdC5hY3RpdmF0ZSA9IGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgIHdoaWxlIEBudW1Db2xzKCkgPCAyIHRoZW4gQGFkZENvbHVtbigpXG4gICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtIEBmaWxlSXRlbShzbGFzaC5kaXIoaXRlbS5maWxlKSksIDAsIG9wdFxuXG4gICAgICAgIGlmIG9wdC5mb2N1c1xuICAgICAgICAgICAgIyBrbG9nICdsb2FkSXRlbSBmb2N1cyBjb2x1bW5zWzBdJyBcbiAgICAgICAgICAgIEBjb2x1bW5zWzBdPy5mb2N1cygpXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgYWN0aXZhdGVJdGVtOiAoaXRlbSwgY29sKSAtPiBcbiAgICAgICAgIyMjXG4gICAgICAgIHRyaWdnZXJlZCBieSBwb3N0KCdmaWxlYnJvd3NlcicgJ2FjdGl2YXRlSXRlbScpIGluIHJvdy5hY3RpdmF0ZVxuICAgICAgICBcbiAgICAgICAgbG9hZHMgaXRlbSBpbiB0aGUgY29sdW1uIHRvIHRoZSByaWdodCBvZiBjb2wgd2hpbGUga2VlcGluZyB0aGUgb3RoZXIgY29sdW1uc1xuICAgICAgICAjIyNcblxuICAgICAgICAjIGtsb2cgJ2FjdGl2YXRlSXRlbScgaXRlbS50eXBlLCBpdGVtLmZpbGUsIGNvbFxuICAgICAgICBcbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sKzIgcG9wOnRydWVcblxuICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtICBpdGVtLCBjb2wrMSwgZm9jdXM6ZmFsc2VcbiAgICAgICAgICAgIHdoZW4gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgQGxvYWRGaWxlSXRlbSBpdGVtLCBjb2wrMVxuICAgICAgICAgICAgICAgIGlmIGl0ZW0udGV4dEZpbGUgb3IgRmlsZS5pc1RleHQgaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvRmlsZScgaXRlbVxuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbG9hZEZpbGVJdGVtOiAoaXRlbSwgY29sPTApIC0+XG5cbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sLCBwb3A6dHJ1ZVxuXG4gICAgICAgIHdoaWxlIGNvbCA+PSBAbnVtQ29scygpXG4gICAgICAgICAgICBAYWRkQ29sdW1uKClcblxuICAgICAgICBmaWxlID0gaXRlbS5maWxlXG5cbiAgICAgICAgQGNvbHVtbnNbY29sXS5wYXJlbnQgPSBpdGVtXG4gICAgICAgIFxuICAgICAgICBpZiBGaWxlLmlzSW1hZ2UgZmlsZVxuICAgICAgICAgICAgQGltYWdlSW5mb0NvbHVtbiBjb2wsIGZpbGVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc3dpdGNoIHNsYXNoLmV4dCBmaWxlXG4gICAgICAgICAgICAgICAgd2hlbiAndGlmZicgJ3RpZidcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgICAgICAgICBAY29udmVydEltYWdlIHJvd1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAZmlsZUluZm9Db2x1bW4gY29sLCBmaWxlXG4gICAgICAgICAgICAgICAgd2hlbiAncHhtJ1xuICAgICAgICAgICAgICAgICAgICBpZiBub3Qgc2xhc2gud2luKClcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjb252ZXJ0UFhNIHJvd1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAZmlsZUluZm9Db2x1bW4gY29sLCBmaWxlXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBpZiBGaWxlLmlzVGV4dCBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIEBsb2FkU291cmNlSXRlbSBpdGVtLCBjb2xcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IEZpbGUuaXNDb2RlIGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgQGZpbGVJbmZvQ29sdW1uIGNvbCwgZmlsZVxuXG4gICAgICAgIHBvc3QuZW1pdCAnbG9hZCcgY29sdW1uOmNvbCwgaXRlbTppdGVtXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcblxuICAgIGltYWdlSW5mb0NvbHVtbjogKGNvbCwgZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjb2x1bW5zW2NvbF0uY3J1bWIuaGlkZSgpXG4gICAgICAgIEBjb2x1bW5zW2NvbF0udGFibGUuYXBwZW5kQ2hpbGQgSW5mby5pbWFnZSBmaWxlXG4gICAgICAgIFxuICAgIGZpbGVJbmZvQ29sdW1uOiAoY29sLCBmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgQGNvbHVtbnNbY29sXS5jcnVtYi5oaWRlKClcbiAgICAgICAgQGNvbHVtbnNbY29sXS50YWJsZS5hcHBlbmRDaGlsZCBJbmZvLmZpbGUgZmlsZVxuICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgb25GaWxlSW5kZXhlZDogKGZpbGUsIGluZm8pID0+XG4gXG4gICAgICAgICMga2xvZyAnb25GaWxlSW5kZXhlZCcgZmlsZVxuICAgICAgICBcbiAgICAgICAgQHNyY0NhY2hlW2ZpbGVdID0gaW5mb1xuIFxuICAgICAgICBpZiBmaWxlID09IEBsYXN0VXNlZENvbHVtbigpPy5wYXJlbnQ/LmZpbGVcbiAgICAgICAgICAgIEBsb2FkU291cmNlSXRlbSB7IGZpbGU6ZmlsZSwgdHlwZTonZmlsZScgfSwgQGxhc3RVc2VkQ29sdW1uKCk/LmluZGV4XG4gICAgICAgICAgICAgXG4gICAgbG9hZFNvdXJjZUl0ZW06IChpdGVtLCBjb2wpIC0+XG5cbiAgICAgICAgaWYgbm90IEBzcmNDYWNoZVtpdGVtLmZpbGVdP1xuXG4gICAgICAgICAgICBAc3JjQ2FjaGVbaXRlbS5maWxlXSA9IHBvc3QuZ2V0ICdpbmRleGVyJyAnZmlsZScgaXRlbS5maWxlXG5cbiAgICAgICAgaW5mbyA9IEBzcmNDYWNoZVtpdGVtLmZpbGVdXG5cbiAgICAgICAgaWYgZW1wdHkgaW5mb1xuICAgICAgICAgICAgQGNvbHVtbnNbY29sXS5sb2FkSXRlbXMgW10sIGl0ZW1cbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGl0ZW1zID0gW11cbiAgICAgICAgY2xzc3MgPSBpbmZvLmNsYXNzZXMgPyBbXVxuICAgICAgICBmb3IgY2xzcyBpbiBjbHNzc1xuICAgICAgICAgICAgdGV4dCA9ICfil48gJytjbHNzLm5hbWVcbiAgICAgICAgICAgIGl0ZW1zLnB1c2ggbmFtZTpjbHNzLm5hbWUsIHRleHQ6dGV4dCwgdHlwZTonY2xhc3MnLCBmaWxlOml0ZW0uZmlsZSwgbGluZTpjbHNzLmxpbmVcblxuICAgICAgICBmdW5jcyA9IGluZm8uZnVuY3MgPyBbXVxuICAgICAgICBmb3IgZnVuYyBpbiBmdW5jc1xuICAgICAgICAgICAgaWYgZnVuYy50ZXN0ID09ICdkZXNjcmliZSdcbiAgICAgICAgICAgICAgICB0ZXh0ID0gJ+KXjyAnK2Z1bmMubmFtZVxuICAgICAgICAgICAgZWxzZSBpZiBmdW5jLnN0YXRpY1xuICAgICAgICAgICAgICAgIHRleHQgPSAnICDil4YgJytmdW5jLm5hbWVcbiAgICAgICAgICAgIGVsc2UgaWYgZnVuYy5wb3N0XG4gICAgICAgICAgICAgICAgdGV4dCA9ICcgIOKsoiAnK2Z1bmMubmFtZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRleHQgPSAnICDilrggJytmdW5jLm5hbWVcbiAgICAgICAgICAgIGl0ZW1zLnB1c2ggbmFtZTpmdW5jLm5hbWUsIHRleHQ6dGV4dCwgdHlwZTonZnVuYycsIGZpbGU6aXRlbS5maWxlLCBsaW5lOmZ1bmMubGluZVxuXG4gICAgICAgIGlmIHZhbGlkIGl0ZW1zXG4gICAgICAgICAgICBpdGVtcy5zb3J0IChhLGIpIC0+IGEubGluZSAtIGIubGluZVxuICAgICAgICAgICAgQGNvbHVtbnNbY29sXS5sb2FkSXRlbXMgaXRlbXMsIGl0ZW1cbiAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgb25EaXJDaGFuZ2VkOiAoaW5mbykgPT5cbiBcbiAgICAgICAgIyBrbG9nICdvbkRpckNoYW5nZWQnIGluZm8uY2hhbmdlLCBpbmZvLmRpciwgaW5mby5wYXRoXG4gICAgICAgIGZvciBjb2x1bW4gaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIGNvbHVtbi5wYXRoKCkgPT0gaW5mby5kaXJcbiAgICAgICAgICAgICAgICBAbG9hZERpckl0ZW0ge2ZpbGU6aW5mby5kaXIsIHR5cGU6J2Rpcid9LCBjb2x1bW4uaW5kZXgsIGFjdGl2ZTpjb2x1bW4uYWN0aXZlUGF0aCgpLCBmb2N1czpmYWxzZVxuICAgICAgICAgICAgaWYgY29sdW1uLnBhdGgoKSA9PSBpbmZvLnBhdGggYW5kIGluZm8uY2hhbmdlID09ICdyZW1vdmUnXG4gICAgICAgICAgICAgICAgY29sdW1uLmNsZWFyKClcbiAgICBcbiAgICBsb2FkRGlySXRlbTogKGl0ZW0sIGNvbD0wLCBvcHQ9e30pIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIGNvbCA+IDAgYW5kIGl0ZW0ubmFtZSA9PSAnLydcblxuICAgICAgICBkaXIgPSBpdGVtLmZpbGVcblxuICAgICAgICAjIGlmIEBza2lwT25EYmxDbGlja1xuICAgICAgICAgICAgIyBrbG9nICdsb2FkRGlySXRlbSBza2lwJyBjb2wsIGRpclxuICAgICAgICAgICAgIyBkZWxldGUgQHNraXBPbkRibENsaWNrXG4gICAgICAgICAgICAjIHJldHVybiBcbiAgICAgICAgXG4gICAgICAgICMgb3B0Lmlnbm9yZUhpZGRlbiA9IG5vdCB3aW5kb3cuc3RhdGUuZ2V0IFwiYnJvd3NlcnxzaG93SGlkZGVufCN7ZGlyfVwiXG4gICAgICAgIG9wdC5pZ25vcmVIaWRkZW4gPSBub3QgcHJlZnMuZ2V0IFwiYnJvd3NlcuKWuHNob3dIaWRkZW7ilrgje2Rpcn1cIlxuICAgICAgICBzbGFzaC5saXN0IGRpciwgb3B0LCAoaXRlbXMpID0+XG4gICAgICAgICAgICBwb3N0LnRvTWFpbiAnZGlyTG9hZGVkJyBkaXJcbiAgICAgICAgICAgIEBsb2FkRGlySXRlbXMgZGlyLCBpdGVtLCBpdGVtcywgY29sLCBvcHRcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnZGlyJyBkaXJcbiAgICAgICAgICAgICAgICBcbiAgICBsb2FkRGlySXRlbXM6IChkaXIsIGl0ZW0sIGl0ZW1zLCBjb2wsIG9wdCkgPT5cbiAgICAgICAgXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgIyBrbG9nICdsb2FkRGlySXRlbXMnIGNvbCwgZGlyXG4gICAgICAgIGlmIEBza2lwT25EYmxDbGljayBhbmQgY29sID4gMFxuICAgICAgICAgICAgZGVsZXRlIEBza2lwT25EYmxDbGlja1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICB3aGlsZSBjb2wgPj0gQG51bUNvbHMoKVxuICAgICAgICAgICAgQGFkZENvbHVtbigpXG4gICAgICAgIFxuICAgICAgICBAY29sdW1uc1tjb2xdLmxvYWRJdGVtcyBpdGVtcywgaXRlbVxuXG4gICAgICAgIHBvc3QuZW1pdCAnbG9hZCcgY29sdW1uOmNvbCwgaXRlbTppdGVtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG9wdC5hY3RpdmF0ZVxuICAgICAgICAgICAgaWYgcm93ID0gQGNvbHVtbnNbY29sXS5yb3cgc2xhc2guZmlsZSBvcHQuYWN0aXZhdGVcbiAgICAgICAgICAgICAgICByb3cuYWN0aXZhdGUoKVxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnbG9hZCcgY29sdW1uOmNvbCsxIGl0ZW06cm93Lml0ZW1cbiAgICAgICAgZWxzZSBpZiBvcHQuYWN0aXZlXG4gICAgICAgICAgICBAY29sdW1uc1tjb2xdLnJvdyhzbGFzaC5maWxlIG9wdC5hY3RpdmUpPy5zZXRBY3RpdmUoKVxuICAgICAgICBcbiAgICAgICAgQGdldEdpdFN0YXR1cyBpdGVtLCBjb2xcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdC5mb2N1cyAhPSBmYWxzZSBhbmQgZW1wdHkoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkgYW5kIGVtcHR5KCQoJy5wb3B1cCcpPy5vdXRlckhUTUwpXG4gICAgICAgICAgICBpZiBsYXN0Q29sdW1uID0gQGxhc3REaXJDb2x1bW4oKVxuICAgICAgICAgICAgICAgICMga2xvZyAnbG9hZERpckl0ZW1zIGxhc3RDb2x1bW4uZm9jdXMnXG4gICAgICAgICAgICAgICAgbGFzdENvbHVtbi5mb2N1cygpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIG9wdC5jYj8gY29sdW1uOmNvbCwgaXRlbTppdGVtXG5cbiAgICAgICAgaWYgY29sID49IDIgYW5kIEBjb2x1bW5zWzBdLndpZHRoKCkgPCAyNTBcbiAgICAgICAgICAgIEBjb2x1bW5zWzFdLm1ha2VSb290KClcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgaW5pdENvbHVtbnM6IC0+XG5cbiAgICAgICAgc3VwZXIoKVxuXG4gICAgICAgIEB2aWV3Lmluc2VydEJlZm9yZSBAc2hlbGYuZGl2LCBAdmlldy5maXJzdENoaWxkXG4gICAgICAgIEB2aWV3Lmluc2VydEJlZm9yZSBAc2hlbGZSZXNpemUsIG51bGxcblxuICAgICAgICBAc2hlbGYuYnJvd3NlckRpZEluaXRDb2x1bW5zKClcblxuICAgICAgICBAc2V0U2hlbGZTaXplIEBzaGVsZlNpemVcblxuICAgIGNvbHVtbkF0UG9zOiAocG9zKSAtPlxuXG4gICAgICAgIGlmIGNvbHVtbiA9IHN1cGVyIHBvc1xuICAgICAgICAgICAgcmV0dXJuIGNvbHVtblxuXG4gICAgICAgIGlmIGVsZW0uY29udGFpbnNQb3MgQHNoZWxmLmRpdiwgcG9zXG4gICAgICAgICAgICByZXR1cm4gQHNoZWxmXG4gICAgICAgICAgICBcbiAgICBsYXN0Q29sdW1uUGF0aDogLT5cblxuICAgICAgICBpZiBsYXN0Q29sdW1uID0gQGxhc3RVc2VkQ29sdW1uKClcbiAgICAgICAgICAgIHJldHVybiBsYXN0Q29sdW1uLnBhdGgoKVxuXG4gICAgbGFzdERpckNvbHVtbjogLT5cblxuICAgICAgICBpZiBsYXN0Q29sdW1uID0gQGxhc3RVc2VkQ29sdW1uKClcbiAgICAgICAgICAgIGlmIGxhc3RDb2x1bW4uaXNEaXIoKVxuICAgICAgICAgICAgICAgIHJldHVybiBsYXN0Q29sdW1uXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW4ucHJldkNvbHVtbigpXG5cbiAgICBsYXN0RGlyT3JTcmNDb2x1bW46IC0+XG5cbiAgICAgICAgaWYgbGFzdENvbHVtbiA9IEBsYXN0VXNlZENvbHVtbigpXG4gICAgICAgICAgICBpZiBsYXN0Q29sdW1uLmlzRGlyKCkgb3IgbGFzdENvbHVtbi5pc1NyYygpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW5cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtbi5wcmV2Q29sdW1uKClcbiAgICAgICAgICAgICAgICBcbiAgICBvbkJhY2tzcGFjZUluQ29sdW1uOiAoY29sdW1uKSAtPlxuXG4gICAgICAgIGNvbHVtbi5iYWNrc3BhY2VTZWFyY2goKVxuICAgICAgICBcbiAgICBvbkRlbGV0ZUluQ29sdW1uOiAoY29sdW1uKSAtPiBcbiAgICBcbiAgICAgICAgaWYgY29sdW1uLnNlYXJjaERpdlxuICAgICAgICAgICAgY29sdW1uLmNsZWFyU2VhcmNoKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29sdW1uLm1vdmVUb1RyYXNoKClcbiAgICAgICAgXG4gICAgdXBkYXRlQ29sdW1uU2Nyb2xsczogPT5cblxuICAgICAgICBzdXBlcigpXG4gICAgICAgIEBzaGVsZj8uc2Nyb2xsLnVwZGF0ZSgpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbiAgICBnZXRHaXRTdGF0dXM6IChpdGVtLCBjb2wpID0+XG5cbiAgICAgICAgZmlsZSA9IGl0ZW0uZmlsZSA/IGl0ZW0ucGFyZW50Py5maWxlXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBmaWxlXG5cbiAgICAgICAgaHViLnN0YXR1cyBmaWxlLCAoc3RhdHVzKSA9PiBAYXBwbHlHaXRTdGF0dXNGaWxlcyBjb2wsIGh1Yi5zdGF0dXNGaWxlcyBzdGF0dXNcblxuICAgIGFwcGx5R2l0U3RhdHVzRmlsZXM6IChjb2wsIGZpbGVzKSA9PlxuXG4gICAgICAgIEBjb2x1bW5zW2NvbF0/LnVwZGF0ZUdpdEZpbGVzIGZpbGVzXG5cbiAgICBvbkdpdFN0YXR1czogKGdpdERpciwgc3RhdHVzKSA9PlxuXG4gICAgICAgIGZpbGVzID0gaHViLnN0YXR1c0ZpbGVzIHN0YXR1c1xuICAgICAgICBmb3IgY29sIGluIFswLi5AY29sdW1ucy5sZW5ndGhdXG4gICAgICAgICAgICBAYXBwbHlHaXRTdGF0dXNGaWxlcyBjb2wsIGZpbGVzXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMCAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICAgIFxuXG4gICAgb25TaGVsZkRyYWc6IChkcmFnLCBldmVudCkgPT5cblxuICAgICAgICBzaGVsZlNpemUgPSBjbGFtcCAwLCA0MDAsIGRyYWcucG9zLnhcbiAgICAgICAgQHNldFNoZWxmU2l6ZSBzaGVsZlNpemVcblxuICAgIHNldFNoZWxmU2l6ZTogKEBzaGVsZlNpemUpIC0+XG5cbiAgICAgICAgd2luZG93LnN0YXRlLnNldCAnc2hlbGZ8c2l6ZScgQHNoZWxmU2l6ZVxuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUubGVmdCA9IFwiI3tAc2hlbGZTaXplfXB4XCJcbiAgICAgICAgQHNoZWxmLmRpdi5zdHlsZS53aWR0aCA9IFwiI3tAc2hlbGZTaXplfXB4XCJcbiAgICAgICAgQGNvbHMuc3R5bGUubGVmdCA9IFwiI3tAc2hlbGZTaXplfXB4XCJcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgIFxuICAgIHRvZ2dsZVNoZWxmOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQHNoZWxmU2l6ZSA8IDFcbiAgICAgICAgICAgIEBzZXRTaGVsZlNpemUgMjAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGtsb2cgJ3RvZ2dsZVNoZWxmIGxhc3RVc2VkQ29sdW1uLmZvY3VzJ1xuICAgICAgICAgICAgQGxhc3RVc2VkQ29sdW1uKCk/LmZvY3VzKClcbiAgICAgICAgICAgIEBzZXRTaGVsZlNpemUgMFxuICAgICAgICAgICAgXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVCcm93c2VyXG4iXX0=
//# sourceURL=../../coffee/browser/filebrowser.coffee