// koffee 1.14.0

/*
00000000  000  000      00000000        0000000    00000000    0000000   000   000   0000000  00000000  00000000
000       000  000      000             000   000  000   000  000   000  000 0 000  000       000       000   000
000000    000  000      0000000         0000000    0000000    000   000  000000000  0000000   0000000   0000000
000       000  000      000             000   000  000   000  000   000  000   000       000  000       000   000
000       000  0000000  00000000        0000000    000   000   0000000   00     00  0000000   00000000  000   000
 */
var $, Browser, File, FileBrowser, Info, Select, Shelf, clamp, drag, elem, empty, filelist, hub, klog, post, prefs, ref, slash, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

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
        var col, i, index, item, lastPath, opt, paths, ref1, ref2, ref3, row;
        lastPath = (ref1 = this.lastDirColumn()) != null ? ref1.path() : void 0;
        file = slash.path(file);
        if (file === lastPath || file === this.lastColumnPath() || slash.isRelative(file)) {
            return;
        }
        klog('navigateToFile', file);
        klog('navigateToFile', this.lastColumnPath());
        klog('navigateToFile', (ref2 = this.lastDirColumn()) != null ? ref2.path() : void 0);
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
        for (index = i = 0, ref3 = paths.length; 0 <= ref3 ? i < ref3 : i > ref3; index = 0 <= ref3 ? ++i : --i) {
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
        klog('onFileBrowser', action, item.type, arg);
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
        klog('loadItem', item, opt);
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
            klog('loadItem focus columns[0]');
            return (ref2 = this.columns[0]) != null ? ref2.focus() : void 0;
        }
    };

    FileBrowser.prototype.activateItem = function(item, col) {

        /*
        triggered by post('filebrowser' 'activateItem') in row.activate
        
        loads item in the column to the right of col while keeping the other columns
         */
        klog('activateItem', item.type, item.file, col);
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
        var col, files, i, ref1, ref2;
        files = hub.statusFiles(status);
        for (col = i = 0, ref1 = this.columns.length; 0 <= ref1 ? i <= ref1 : i >= ref1; col = 0 <= ref1 ? ++i : --i) {
            this.applyGitStatusFiles(col, files);
        }
        return (ref2 = this.shelf) != null ? ref2.updateGitFiles(files) : void 0;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWJyb3dzZXIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2Jyb3dzZXIiLCJzb3VyY2VzIjpbImZpbGVicm93c2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxpSUFBQTtJQUFBOzs7O0FBUUEsTUFBNkUsT0FBQSxDQUFRLEtBQVIsQ0FBN0UsRUFBRSxTQUFGLEVBQUssaUJBQUwsRUFBWSxlQUFaLEVBQWtCLGVBQWxCLEVBQXdCLGlCQUF4QixFQUErQix1QkFBL0IsRUFBeUMsZUFBekMsRUFBK0MsZUFBL0MsRUFBcUQsaUJBQXJELEVBQTRELGlCQUE1RCxFQUFtRTs7QUFFbkUsT0FBQSxHQUFXLE9BQUEsQ0FBUSxXQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsU0FBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0FBQ1gsSUFBQSxHQUFXLE9BQUEsQ0FBUSxlQUFSOztBQUNYLElBQUEsR0FBVyxPQUFBLENBQVEsUUFBUjs7QUFDWCxHQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBRUw7OztJQUVDLHFCQUFDLElBQUQ7Ozs7Ozs7Ozs7Ozs7O1FBRUMsNkNBQU0sSUFBTjtRQUVBLE1BQU0sQ0FBQyxXQUFQLEdBQXFCO1FBRXJCLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsS0FBRCxHQUFVLElBQUksS0FBSixDQUFVLElBQVY7UUFDVixJQUFDLENBQUEsTUFBRCxHQUFVLElBQUksTUFBSixDQUFXLElBQVg7UUFDVixJQUFDLENBQUEsSUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLFFBQUQsR0FBWTtRQUVaLElBQUksQ0FBQyxFQUFMLENBQVEsTUFBUixFQUF5QixJQUFDLENBQUEsTUFBMUI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFFBQVIsRUFBeUIsSUFBQyxDQUFBLE1BQTFCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxhQUFSLEVBQXlCLElBQUMsQ0FBQSxhQUExQjtRQUVBLElBQUksQ0FBQyxFQUFMLENBQVEsV0FBUixFQUF5QixJQUFDLENBQUEsV0FBMUI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLGFBQVIsRUFBeUIsSUFBQyxDQUFBLGFBQTFCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxZQUFSLEVBQXlCLElBQUMsQ0FBQSxZQUExQjtRQUVBLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBQSxDQUFLLEtBQUwsRUFBVztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sYUFBUDtTQUFYO1FBQ2YsSUFBQyxDQUFBLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBbkIsR0FBOEI7UUFDOUIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBbkIsR0FBOEI7UUFDOUIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBbkIsR0FBOEI7UUFDOUIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBbkIsR0FBOEI7UUFDOUIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBbkIsR0FBOEI7UUFDOUIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBbkIsR0FBOEI7UUFFOUIsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFJLElBQUosQ0FDSjtZQUFBLE1BQUEsRUFBUyxJQUFDLENBQUEsV0FBVjtZQUNBLE1BQUEsRUFBUyxJQUFDLENBQUEsV0FEVjtTQURJO1FBSVIsSUFBQyxDQUFBLFNBQUQsR0FBYSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQWIsQ0FBaUIsWUFBakIsRUFBOEIsR0FBOUI7UUFFYixJQUFDLENBQUEsV0FBRCxDQUFBO0lBbENEOzswQkEwQ0gsVUFBQSxHQUFZLFNBQUMsTUFBRCxFQUFTLE9BQVQsRUFBa0IsTUFBbEI7QUFFUixZQUFBO1FBQUEsSUFBRyxLQUFLLENBQUMsTUFBTixDQUFhLE1BQWIsQ0FBSDtZQUVJLE1BQUEsR0FBUyxLQUFLLENBQUMsR0FBTixDQUFVLE1BQVYsRUFGYjs7QUFJQSxhQUFBLHlDQUFBOztZQUVJLElBQUcsTUFBQSxLQUFVLE1BQWI7Z0JBQ0ksSUFBRyxNQUFBLEtBQVUsTUFBVixJQUFvQixLQUFLLENBQUMsR0FBTixDQUFVLE1BQVYsQ0FBQSxLQUFxQixNQUE1QztvQkFDSSxJQUFBLENBQUssTUFBTCxFQUFZLE1BQVosRUFBb0IsTUFBcEI7QUFDQSwyQkFGSjtpQkFESjs7QUFGSjtBQU9BO2FBQUEsMkNBQUE7O0FBRUksb0JBQU8sTUFBUDtBQUFBLHFCQUNTLE1BRFQ7aUNBQ3FCLElBQUksQ0FBQyxNQUFMLENBQVksTUFBWixFQUFvQixNQUFwQixFQUE0QixDQUFBLFNBQUEsS0FBQTsrQkFBQSxTQUFDLE1BQUQsRUFBUyxNQUFULEdBQUE7b0JBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE1QjtBQUFaO0FBRFQscUJBRVMsTUFGVDtpQ0FFcUIsSUFBSSxDQUFDLElBQUwsQ0FBVSxNQUFWLEVBQWtCLE1BQWxCLEVBQTBCLENBQUEsU0FBQSxLQUFBOytCQUFBLFNBQUMsTUFBRCxFQUFTLE1BQVQsR0FBQTtvQkFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTFCO0FBQVo7QUFGVDs7QUFBQTtBQUZKOztJQWJROzswQkFtQlosYUFBQSxHQUFlLFNBQUMsSUFBRDtBQUVYLFlBQUE7QUFBQTtBQUFBLGFBQUEsc0NBQUE7O1lBQ0ksMENBQWdCLENBQUUsY0FBZixLQUF1QixLQUFLLENBQUMsR0FBTixDQUFVLElBQVYsQ0FBMUI7QUFDSSx1QkFBTyxPQURYOztBQURKO0lBRlc7OzBCQVlmLGlCQUFBLEdBQW1CLFNBQUMsSUFBRDtBQUVmLFlBQUE7UUFBQSxHQUFBLEdBQU07QUFFTjtBQUFBLGFBQUEsc0NBQUE7O1lBQ0ksSUFBRyxNQUFNLENBQUMsS0FBUCxDQUFBLENBQUEsSUFBbUIsSUFBSSxDQUFDLFVBQUwsQ0FBZ0IsTUFBTSxDQUFDLElBQVAsQ0FBQSxDQUFoQixDQUF0QjtnQkFDSSxHQUFBLElBQU8sRUFEWDthQUFBLE1BQUE7QUFHSSxzQkFISjs7QUFESjtRQU1BLElBQUcsR0FBQSxLQUFPLENBQVAsSUFBYSxLQUFLLENBQUMsR0FBTixDQUFVLElBQVYsQ0FBQSw2Q0FBOEIsQ0FBRSxJQUFiLENBQUEsV0FBbkM7QUFDSSxtQkFBTyxFQURYOztlQUVBLElBQUksQ0FBQyxHQUFMLENBQVMsQ0FBQyxDQUFWLEVBQWEsR0FBQSxHQUFJLENBQWpCO0lBWmU7OzBCQWNuQixNQUFBLEdBQVEsU0FBQyxJQUFELEVBQU8sR0FBUDtRQUVKLElBQUEsQ0FBSyxRQUFMLEVBQWMsSUFBZCxFQUFvQixHQUFwQjtRQUNBLElBQUcsSUFBSDttQkFBYSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixDQUFWLEVBQTJCLEdBQTNCLEVBQWI7O0lBSEk7OzBCQUtSLE1BQUEsR0FBUSxTQUFDLElBQUQ7UUFHSixJQUFHLElBQUEsSUFBUyxJQUFDLENBQUEsSUFBYjttQkFBdUIsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsSUFBaEIsRUFBdkI7O0lBSEk7OzBCQUtSLGNBQUEsR0FBZ0IsU0FBQyxJQUFEOztBQUVaOzs7Ozs7OztBQUFBLFlBQUE7UUFXQSxRQUFBLCtDQUEyQixDQUFFLElBQWxCLENBQUE7UUFFWCxJQUFBLEdBQU8sS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYO1FBRVAsSUFBRyxJQUFBLEtBQVEsUUFBUixJQUFvQixJQUFBLEtBQVEsSUFBQyxDQUFBLGNBQUQsQ0FBQSxDQUE1QixJQUFpRCxLQUFLLENBQUMsVUFBTixDQUFpQixJQUFqQixDQUFwRDtBQUVJLG1CQUZKOztRQUlBLElBQUEsQ0FBSyxnQkFBTCxFQUFzQixJQUF0QjtRQUNBLElBQUEsQ0FBSyxnQkFBTCxFQUFzQixJQUFDLENBQUEsY0FBRCxDQUFBLENBQXRCO1FBQ0EsSUFBQSxDQUFLLGdCQUFMLDhDQUFzQyxDQUFFLElBQWxCLENBQUEsVUFBdEI7UUFFQSxHQUFBLEdBQU0sSUFBQyxDQUFBLGlCQUFELENBQW1CLElBQW5CO1FBRU4sUUFBQSxHQUFXLEtBQUssQ0FBQyxRQUFOLENBQWUsSUFBZjtRQUVYLElBQUcsR0FBQSxJQUFPLENBQVY7WUFDSSxLQUFBLEdBQVEsUUFBUSxDQUFDLEtBQVQsQ0FBZSxRQUFRLENBQUMsT0FBVCxDQUFpQixJQUFDLENBQUEsT0FBUSxDQUFBLEdBQUEsQ0FBSSxDQUFDLElBQWQsQ0FBQSxDQUFqQixDQUFBLEdBQXVDLENBQXRELEVBRFo7U0FBQSxNQUFBO1lBR0ksS0FBQSxHQUFRLFFBQVEsQ0FBQyxLQUFULENBQWUsUUFBUSxDQUFDLE1BQVQsR0FBZ0IsQ0FBL0IsRUFIWjs7UUFLQSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsR0FBQSxHQUFJLENBQXRCLEVBQXlCO1lBQUEsR0FBQSxFQUFJLElBQUo7WUFBUyxLQUFBLEVBQU0sR0FBQSxHQUFJLEtBQUssQ0FBQyxNQUF6QjtTQUF6QjtBQUVBLGVBQU0sSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFBLEdBQWEsS0FBSyxDQUFDLE1BQXpCO1lBQ0ksSUFBQyxDQUFBLFNBQUQsQ0FBQTtRQURKO0FBR0EsYUFBYSxrR0FBYjtZQUVJLElBQUEsR0FBTyxJQUFDLENBQUEsUUFBRCxDQUFVLEtBQU0sQ0FBQSxLQUFBLENBQWhCO0FBRVAsb0JBQU8sSUFBSSxDQUFDLElBQVo7QUFBQSxxQkFDUyxNQURUO29CQUVRLElBQUMsQ0FBQSxZQUFELENBQWMsSUFBZCxFQUFvQixHQUFBLEdBQUksQ0FBSixHQUFNLEtBQTFCO0FBREM7QUFEVCxxQkFHUyxLQUhUO29CQUlRLEdBQUEsR0FBTTtvQkFDTixJQUFHLEtBQUEsR0FBUSxLQUFLLENBQUMsTUFBTixHQUFhLENBQXhCO3dCQUNJLEdBQUcsQ0FBQyxNQUFKLEdBQWEsS0FBTSxDQUFBLEtBQUEsR0FBTSxDQUFOLEVBRHZCOztvQkFFQSxJQUFDLENBQUEsV0FBRCxDQUFhLElBQWIsRUFBbUIsR0FBQSxHQUFJLENBQUosR0FBTSxLQUF6QixFQUFnQyxHQUFoQztBQVBSO0FBSko7UUFhQSxJQUFHLEdBQUEsR0FBTSxJQUFDLENBQUEsYUFBRCxDQUFBLENBQVQ7WUFFSSxJQUFHLEdBQUEsR0FBTSxHQUFHLENBQUMsR0FBSixDQUFRLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxDQUFSLENBQVQ7dUJBQ0ksR0FBRyxDQUFDLFNBQUosQ0FBQSxFQURKO2FBRko7O0lBcERZOzswQkF5RGhCLE9BQUEsR0FBUyxTQUFBO1FBRUwsR0FBRyxDQUFDLE9BQUosQ0FBQTtRQUNBLElBQUMsQ0FBQSxRQUFELEdBQVk7UUFFWixJQUFHLElBQUMsQ0FBQSxjQUFELENBQUEsQ0FBSDttQkFDSSxJQUFDLENBQUEsY0FBRCxDQUFnQixJQUFDLENBQUEsY0FBRCxDQUFBLENBQWlCLENBQUMsSUFBbEIsQ0FBQSxDQUFoQixFQURKOztJQUxLOzswQkFjVCxRQUFBLEdBQVUsU0FBQyxJQUFEO0FBRU4sWUFBQTtRQUFBLENBQUEsR0FBSSxLQUFLLENBQUMsT0FBTixDQUFjLElBQWQ7ZUFFSjtZQUFBLElBQUEsRUFBSyxDQUFMO1lBQ0EsSUFBQSxFQUFLLEtBQUssQ0FBQyxNQUFOLENBQWEsQ0FBYixDQUFBLElBQW9CLE1BQXBCLElBQThCLEtBRG5DO1lBRUEsSUFBQSxFQUFLLEtBQUssQ0FBQyxJQUFOLENBQVcsQ0FBWCxDQUZMOztJQUpNOzswQkFRVixhQUFBLEdBQWUsU0FBQyxNQUFELEVBQVMsSUFBVCxFQUFlLEdBQWY7UUFFWCxJQUFBLENBQUssZUFBTCxFQUFxQixNQUFyQixFQUE2QixJQUFJLENBQUMsSUFBbEMsRUFBd0MsR0FBeEM7QUFDQSxnQkFBTyxNQUFQO0FBQUEsaUJBQ1MsVUFEVDt1QkFDNkIsSUFBQyxDQUFBLFFBQUQsQ0FBYyxJQUFkLEVBQW9CLEdBQXBCO0FBRDdCLGlCQUVTLGNBRlQ7dUJBRTZCLElBQUMsQ0FBQSxZQUFELENBQWMsSUFBZCxFQUFvQixHQUFwQjtBQUY3QjtJQUhXOzswQkFPZixPQUFBLEdBQVMsU0FBQyxJQUFEO2VBQVUsSUFBQyxDQUFBLFFBQUQsQ0FBVTtZQUFBLElBQUEsRUFBSyxLQUFMO1lBQVcsSUFBQSxFQUFLLElBQWhCO1NBQVY7SUFBVjs7MEJBRVQsUUFBQSxHQUFVLFNBQUMsSUFBRCxFQUFPLEdBQVA7O0FBRU47Ozs7Ozs7Ozs7OztBQUFBLFlBQUE7UUFhQSxJQUFBLENBQUssVUFBTCxFQUFnQixJQUFoQixFQUFzQixHQUF0Qjs7WUFFQTs7WUFBQSxNQUFPO2dCQUFBLE1BQUEsRUFBTyxJQUFQO2dCQUFZLEtBQUEsRUFBTSxJQUFsQjs7OztZQUNQLElBQUksQ0FBQzs7WUFBTCxJQUFJLENBQUMsT0FBUSxLQUFLLENBQUMsSUFBTixDQUFXLElBQUksQ0FBQyxJQUFoQjs7UUFFYixJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsQ0FBbEIsRUFBcUI7WUFBQSxHQUFBLEVBQUksSUFBSjtZQUFVLEtBQUEsc0NBQWtCLENBQTVCO1NBQXJCO0FBRUEsZ0JBQU8sSUFBSSxDQUFDLElBQVo7QUFBQSxpQkFDUyxLQURUO2dCQUNxQixJQUFDLENBQUEsV0FBRCxDQUFhLElBQWIsRUFBbUIsQ0FBbkIsRUFBc0IsR0FBdEI7QUFBWjtBQURULGlCQUVTLE1BRlQ7Z0JBR1EsR0FBRyxDQUFDLFFBQUosR0FBZSxJQUFJLENBQUM7QUFDcEIsdUJBQU0sSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFBLEdBQWEsQ0FBbkI7b0JBQTBCLElBQUMsQ0FBQSxTQUFELENBQUE7Z0JBQTFCO2dCQUNBLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBQyxDQUFBLFFBQUQsQ0FBVSxLQUFLLENBQUMsR0FBTixDQUFVLElBQUksQ0FBQyxJQUFmLENBQVYsQ0FBYixFQUE4QyxDQUE5QyxFQUFpRCxHQUFqRDtBQUxSO1FBT0EsSUFBRyxHQUFHLENBQUMsS0FBUDtZQUNJLElBQUEsQ0FBSywyQkFBTDswREFDVyxDQUFFLEtBQWIsQ0FBQSxXQUZKOztJQTdCTTs7MEJBdUNWLFlBQUEsR0FBYyxTQUFDLElBQUQsRUFBTyxHQUFQOztBQUNWOzs7OztRQU1BLElBQUEsQ0FBSyxjQUFMLEVBQW9CLElBQUksQ0FBQyxJQUF6QixFQUErQixJQUFJLENBQUMsSUFBcEMsRUFBMEMsR0FBMUM7UUFFQSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsR0FBQSxHQUFJLENBQXRCLEVBQXdCO1lBQUEsR0FBQSxFQUFJLElBQUo7U0FBeEI7QUFFQSxnQkFBTyxJQUFJLENBQUMsSUFBWjtBQUFBLGlCQUNTLEtBRFQ7dUJBRVEsSUFBQyxDQUFBLFdBQUQsQ0FBYyxJQUFkLEVBQW9CLEdBQUEsR0FBSSxDQUF4QixFQUEyQjtvQkFBQSxLQUFBLEVBQU0sS0FBTjtpQkFBM0I7QUFGUixpQkFHUyxNQUhUO2dCQUlRLElBQUMsQ0FBQSxZQUFELENBQWMsSUFBZCxFQUFvQixHQUFBLEdBQUksQ0FBeEI7Z0JBQ0EsSUFBRyxJQUFJLENBQUMsUUFBTCxJQUFpQixJQUFJLENBQUMsTUFBTCxDQUFZLElBQUksQ0FBQyxJQUFqQixDQUFwQjsyQkFDSSxJQUFJLENBQUMsSUFBTCxDQUFVLFlBQVYsRUFBdUIsSUFBdkIsRUFESjs7QUFMUjtJQVhVOzswQkF5QmQsWUFBQSxHQUFjLFNBQUMsSUFBRCxFQUFPLEdBQVA7QUFFVixZQUFBOztZQUZpQixNQUFJOztRQUVyQixJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsR0FBbEIsRUFBdUI7WUFBQSxHQUFBLEVBQUksSUFBSjtTQUF2QjtBQUVBLGVBQU0sR0FBQSxJQUFPLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBYjtZQUNJLElBQUMsQ0FBQSxTQUFELENBQUE7UUFESjtRQUdBLElBQUEsR0FBTyxJQUFJLENBQUM7UUFFWixJQUFDLENBQUEsT0FBUSxDQUFBLEdBQUEsQ0FBSSxDQUFDLE1BQWQsR0FBdUI7UUFFdkIsSUFBRyxJQUFJLENBQUMsT0FBTCxDQUFhLElBQWIsQ0FBSDtZQUNJLElBQUMsQ0FBQSxlQUFELENBQWlCLEdBQWpCLEVBQXNCLElBQXRCLEVBREo7U0FBQSxNQUFBO0FBR0ksb0JBQU8sS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWLENBQVA7QUFBQSxxQkFDUyxNQURUO0FBQUEscUJBQ2dCLEtBRGhCO29CQUVRLElBQUcsQ0FBSSxLQUFLLENBQUMsR0FBTixDQUFBLENBQVA7d0JBQ0ksSUFBQyxDQUFBLFlBQUQsQ0FBYyxHQUFkLEVBREo7cUJBQUEsTUFBQTt3QkFHSSxJQUFDLENBQUEsY0FBRCxDQUFnQixHQUFoQixFQUFxQixJQUFyQixFQUhKOztBQURRO0FBRGhCLHFCQU1TLEtBTlQ7b0JBT1EsSUFBRyxDQUFJLEtBQUssQ0FBQyxHQUFOLENBQUEsQ0FBUDt3QkFDSSxJQUFDLENBQUEsVUFBRCxDQUFZLEdBQVosRUFESjtxQkFBQSxNQUFBO3dCQUdJLElBQUMsQ0FBQSxjQUFELENBQWdCLEdBQWhCLEVBQXFCLElBQXJCLEVBSEo7O0FBREM7QUFOVDtvQkFZUSxJQUFHLElBQUksQ0FBQyxNQUFMLENBQVksSUFBSSxDQUFDLElBQWpCLENBQUg7d0JBQ0ksSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsSUFBaEIsRUFBc0IsR0FBdEIsRUFESjs7b0JBRUEsSUFBRyxDQUFJLElBQUksQ0FBQyxNQUFMLENBQVksSUFBSSxDQUFDLElBQWpCLENBQVA7d0JBQ0ksSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsR0FBaEIsRUFBcUIsSUFBckIsRUFESjs7QUFkUixhQUhKOztRQW9CQSxJQUFJLENBQUMsSUFBTCxDQUFVLE1BQVYsRUFBaUI7WUFBQSxNQUFBLEVBQU8sR0FBUDtZQUFZLElBQUEsRUFBSyxJQUFqQjtTQUFqQjtlQUVBLElBQUMsQ0FBQSxtQkFBRCxDQUFBO0lBakNVOzswQkFtQ2QsZUFBQSxHQUFpQixTQUFDLEdBQUQsRUFBTSxJQUFOO1FBRWIsSUFBQyxDQUFBLE9BQVEsQ0FBQSxHQUFBLENBQUksQ0FBQyxLQUFLLENBQUMsSUFBcEIsQ0FBQTtlQUNBLElBQUMsQ0FBQSxPQUFRLENBQUEsR0FBQSxDQUFJLENBQUMsS0FBSyxDQUFDLFdBQXBCLENBQWdDLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBWCxDQUFoQztJQUhhOzswQkFLakIsY0FBQSxHQUFnQixTQUFDLEdBQUQsRUFBTSxJQUFOO1FBRVosSUFBQyxDQUFBLE9BQVEsQ0FBQSxHQUFBLENBQUksQ0FBQyxLQUFLLENBQUMsSUFBcEIsQ0FBQTtlQUNBLElBQUMsQ0FBQSxPQUFRLENBQUEsR0FBQSxDQUFJLENBQUMsS0FBSyxDQUFDLFdBQXBCLENBQWdDLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBVixDQUFoQztJQUhZOzswQkFZaEIsYUFBQSxHQUFlLFNBQUMsSUFBRCxFQUFPLElBQVA7QUFJWCxZQUFBO1FBQUEsSUFBQyxDQUFBLFFBQVMsQ0FBQSxJQUFBLENBQVYsR0FBa0I7UUFFbEIsSUFBRyxJQUFBLGtGQUFpQyxDQUFFLHVCQUF0QzttQkFDSSxJQUFDLENBQUEsY0FBRCxDQUFnQjtnQkFBRSxJQUFBLEVBQUssSUFBUDtnQkFBYSxJQUFBLEVBQUssTUFBbEI7YUFBaEIsK0NBQTZELENBQUUsY0FBL0QsRUFESjs7SUFOVzs7MEJBU2YsY0FBQSxHQUFnQixTQUFDLElBQUQsRUFBTyxHQUFQO0FBRVosWUFBQTtRQUFBLElBQU8sZ0NBQVA7WUFFSSxJQUFDLENBQUEsUUFBUyxDQUFBLElBQUksQ0FBQyxJQUFMLENBQVYsR0FBdUIsSUFBSSxDQUFDLEdBQUwsQ0FBUyxTQUFULEVBQW1CLE1BQW5CLEVBQTBCLElBQUksQ0FBQyxJQUEvQixFQUYzQjs7UUFJQSxJQUFBLEdBQU8sSUFBQyxDQUFBLFFBQVMsQ0FBQSxJQUFJLENBQUMsSUFBTDtRQUVqQixJQUFHLEtBQUEsQ0FBTSxJQUFOLENBQUg7WUFDSSxJQUFDLENBQUEsT0FBUSxDQUFBLEdBQUEsQ0FBSSxDQUFDLFNBQWQsQ0FBd0IsRUFBeEIsRUFBNEIsSUFBNUI7QUFDQSxtQkFGSjs7UUFJQSxLQUFBLEdBQVE7UUFDUixLQUFBLDBDQUF1QjtBQUN2QixhQUFBLHVDQUFBOztZQUNJLElBQUEsR0FBTyxJQUFBLEdBQUssSUFBSSxDQUFDO1lBQ2pCLEtBQUssQ0FBQyxJQUFOLENBQVc7Z0JBQUEsSUFBQSxFQUFLLElBQUksQ0FBQyxJQUFWO2dCQUFnQixJQUFBLEVBQUssSUFBckI7Z0JBQTJCLElBQUEsRUFBSyxPQUFoQztnQkFBeUMsSUFBQSxFQUFLLElBQUksQ0FBQyxJQUFuRDtnQkFBeUQsSUFBQSxFQUFLLElBQUksQ0FBQyxJQUFuRTthQUFYO0FBRko7UUFJQSxLQUFBLHdDQUFxQjtBQUNyQixhQUFBLHlDQUFBOztZQUNJLElBQUcsSUFBSSxDQUFDLElBQUwsS0FBYSxVQUFoQjtnQkFDSSxJQUFBLEdBQU8sSUFBQSxHQUFLLElBQUksQ0FBQyxLQURyQjthQUFBLE1BRUssSUFBRyxJQUFJLEVBQUMsTUFBRCxFQUFQO2dCQUNELElBQUEsR0FBTyxNQUFBLEdBQU8sSUFBSSxDQUFDLEtBRGxCO2FBQUEsTUFFQSxJQUFHLElBQUksQ0FBQyxJQUFSO2dCQUNELElBQUEsR0FBTyxNQUFBLEdBQU8sSUFBSSxDQUFDLEtBRGxCO2FBQUEsTUFBQTtnQkFHRCxJQUFBLEdBQU8sTUFBQSxHQUFPLElBQUksQ0FBQyxLQUhsQjs7WUFJTCxLQUFLLENBQUMsSUFBTixDQUFXO2dCQUFBLElBQUEsRUFBSyxJQUFJLENBQUMsSUFBVjtnQkFBZ0IsSUFBQSxFQUFLLElBQXJCO2dCQUEyQixJQUFBLEVBQUssTUFBaEM7Z0JBQXdDLElBQUEsRUFBSyxJQUFJLENBQUMsSUFBbEQ7Z0JBQXdELElBQUEsRUFBSyxJQUFJLENBQUMsSUFBbEU7YUFBWDtBQVRKO1FBV0EsSUFBRyxLQUFBLENBQU0sS0FBTixDQUFIO1lBQ0ksS0FBSyxDQUFDLElBQU4sQ0FBVyxTQUFDLENBQUQsRUFBRyxDQUFIO3VCQUFTLENBQUMsQ0FBQyxJQUFGLEdBQVMsQ0FBQyxDQUFDO1lBQXBCLENBQVg7bUJBQ0EsSUFBQyxDQUFBLE9BQVEsQ0FBQSxHQUFBLENBQUksQ0FBQyxTQUFkLENBQXdCLEtBQXhCLEVBQStCLElBQS9CLEVBRko7O0lBOUJZOzswQkF3Q2hCLFlBQUEsR0FBYyxTQUFDLElBQUQ7QUFHVixZQUFBO0FBQUE7QUFBQTthQUFBLHNDQUFBOztZQUNJLElBQUcsTUFBTSxDQUFDLElBQVAsQ0FBQSxDQUFBLEtBQWlCLElBQUksQ0FBQyxHQUF6QjtnQkFDSSxJQUFDLENBQUEsV0FBRCxDQUFhO29CQUFDLElBQUEsRUFBSyxJQUFJLENBQUMsR0FBWDtvQkFBZ0IsSUFBQSxFQUFLLEtBQXJCO2lCQUFiLEVBQTBDLE1BQU0sQ0FBQyxLQUFqRCxFQUF3RDtvQkFBQSxNQUFBLEVBQU8sTUFBTSxDQUFDLFVBQVAsQ0FBQSxDQUFQO29CQUE0QixLQUFBLEVBQU0sS0FBbEM7aUJBQXhELEVBREo7O1lBRUEsSUFBRyxNQUFNLENBQUMsSUFBUCxDQUFBLENBQUEsS0FBaUIsSUFBSSxDQUFDLElBQXRCLElBQStCLElBQUksQ0FBQyxNQUFMLEtBQWUsUUFBakQ7NkJBQ0ksTUFBTSxDQUFDLEtBQVAsQ0FBQSxHQURKO2FBQUEsTUFBQTtxQ0FBQTs7QUFISjs7SUFIVTs7MEJBU2QsV0FBQSxHQUFhLFNBQUMsSUFBRCxFQUFPLEdBQVAsRUFBYyxHQUFkO0FBRVQsWUFBQTs7WUFGZ0IsTUFBSTs7O1lBQUcsTUFBSTs7UUFFM0IsSUFBVSxHQUFBLEdBQU0sQ0FBTixJQUFZLElBQUksQ0FBQyxJQUFMLEtBQWEsR0FBbkM7QUFBQSxtQkFBQTs7UUFFQSxHQUFBLEdBQU0sSUFBSSxDQUFDO1FBUVgsR0FBRyxDQUFDLFlBQUosR0FBbUIsQ0FBSSxLQUFLLENBQUMsR0FBTixDQUFVLHFCQUFBLEdBQXNCLEdBQWhDO2VBQ3ZCLEtBQUssQ0FBQyxJQUFOLENBQVcsR0FBWCxFQUFnQixHQUFoQixFQUFxQixDQUFBLFNBQUEsS0FBQTttQkFBQSxTQUFDLEtBQUQ7Z0JBQ2pCLElBQUksQ0FBQyxNQUFMLENBQVksV0FBWixFQUF3QixHQUF4QjtnQkFDQSxLQUFDLENBQUEsWUFBRCxDQUFjLEdBQWQsRUFBbUIsSUFBbkIsRUFBeUIsS0FBekIsRUFBZ0MsR0FBaEMsRUFBcUMsR0FBckM7dUJBQ0EsSUFBSSxDQUFDLElBQUwsQ0FBVSxLQUFWLEVBQWdCLEdBQWhCO1lBSGlCO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFyQjtJQWJTOzswQkFrQmIsWUFBQSxHQUFjLFNBQUMsR0FBRCxFQUFNLElBQU4sRUFBWSxLQUFaLEVBQW1CLEdBQW5CLEVBQXdCLEdBQXhCO0FBRVYsWUFBQTtRQUFBLElBQUMsQ0FBQSxtQkFBRCxDQUFBO1FBR0EsSUFBRyxJQUFDLENBQUEsY0FBRCxJQUFvQixHQUFBLEdBQU0sQ0FBN0I7WUFDSSxPQUFPLElBQUMsQ0FBQTtBQUNSLG1CQUZKOztBQUlBLGVBQU0sR0FBQSxJQUFPLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBYjtZQUNJLElBQUMsQ0FBQSxTQUFELENBQUE7UUFESjtRQUdBLElBQUMsQ0FBQSxPQUFRLENBQUEsR0FBQSxDQUFJLENBQUMsU0FBZCxDQUF3QixLQUF4QixFQUErQixJQUEvQjtRQUVBLElBQUksQ0FBQyxJQUFMLENBQVUsTUFBVixFQUFpQjtZQUFBLE1BQUEsRUFBTyxHQUFQO1lBQVksSUFBQSxFQUFLLElBQWpCO1NBQWpCO1FBRUEsSUFBRyxHQUFHLENBQUMsUUFBUDtZQUNJLElBQUcsR0FBQSxHQUFNLElBQUMsQ0FBQSxPQUFRLENBQUEsR0FBQSxDQUFJLENBQUMsR0FBZCxDQUFrQixLQUFLLENBQUMsSUFBTixDQUFXLEdBQUcsQ0FBQyxRQUFmLENBQWxCLENBQVQ7Z0JBQ0ksR0FBRyxDQUFDLFFBQUosQ0FBQTtnQkFDQSxJQUFJLENBQUMsSUFBTCxDQUFVLE1BQVYsRUFBaUI7b0JBQUEsTUFBQSxFQUFPLEdBQUEsR0FBSSxDQUFYO29CQUFhLElBQUEsRUFBSyxHQUFHLENBQUMsSUFBdEI7aUJBQWpCLEVBRko7YUFESjtTQUFBLE1BSUssSUFBRyxHQUFHLENBQUMsTUFBUDs7b0JBQ3VDLENBQUUsU0FBMUMsQ0FBQTthQURDOztRQUdMLElBQUMsQ0FBQSxZQUFELENBQWMsSUFBZCxFQUFvQixHQUFwQjtRQUVBLElBQUcsR0FBRyxDQUFDLEtBQUosS0FBYSxLQUFiLElBQXVCLEtBQUEsQ0FBTSxRQUFRLENBQUMsYUFBZixDQUF2QixJQUF5RCxLQUFBLG9DQUFpQixDQUFFLGtCQUFuQixDQUE1RDtZQUNJLElBQUcsVUFBQSxHQUFhLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBaEI7Z0JBRUksVUFBVSxDQUFDLEtBQVgsQ0FBQSxFQUZKO2FBREo7OztZQUtBLEdBQUcsQ0FBQyxHQUFJO2dCQUFBLE1BQUEsRUFBTyxHQUFQO2dCQUFZLElBQUEsRUFBSyxJQUFqQjs7O1FBRVIsSUFBRyxHQUFBLElBQU8sQ0FBUCxJQUFhLElBQUMsQ0FBQSxPQUFRLENBQUEsQ0FBQSxDQUFFLENBQUMsS0FBWixDQUFBLENBQUEsR0FBc0IsR0FBdEM7bUJBQ0ksSUFBQyxDQUFBLE9BQVEsQ0FBQSxDQUFBLENBQUUsQ0FBQyxRQUFaLENBQUEsRUFESjs7SUFoQ1U7OzBCQXlDZCxXQUFBLEdBQWEsU0FBQTtRQUVULDJDQUFBO1FBRUEsSUFBQyxDQUFBLElBQUksQ0FBQyxZQUFOLENBQW1CLElBQUMsQ0FBQSxLQUFLLENBQUMsR0FBMUIsRUFBK0IsSUFBQyxDQUFBLElBQUksQ0FBQyxVQUFyQztRQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsWUFBTixDQUFtQixJQUFDLENBQUEsV0FBcEIsRUFBaUMsSUFBakM7UUFFQSxJQUFDLENBQUEsS0FBSyxDQUFDLHFCQUFQLENBQUE7ZUFFQSxJQUFDLENBQUEsWUFBRCxDQUFjLElBQUMsQ0FBQSxTQUFmO0lBVFM7OzBCQVdiLFdBQUEsR0FBYSxTQUFDLEdBQUQ7QUFFVCxZQUFBO1FBQUEsSUFBRyxNQUFBLEdBQVMsNkNBQU0sR0FBTixDQUFaO0FBQ0ksbUJBQU8sT0FEWDs7UUFHQSxJQUFHLElBQUksQ0FBQyxXQUFMLENBQWlCLElBQUMsQ0FBQSxLQUFLLENBQUMsR0FBeEIsRUFBNkIsR0FBN0IsQ0FBSDtBQUNJLG1CQUFPLElBQUMsQ0FBQSxNQURaOztJQUxTOzswQkFRYixjQUFBLEdBQWdCLFNBQUE7QUFFWixZQUFBO1FBQUEsSUFBRyxVQUFBLEdBQWEsSUFBQyxDQUFBLGNBQUQsQ0FBQSxDQUFoQjtBQUNJLG1CQUFPLFVBQVUsQ0FBQyxJQUFYLENBQUEsRUFEWDs7SUFGWTs7MEJBS2hCLGFBQUEsR0FBZSxTQUFBO0FBRVgsWUFBQTtRQUFBLElBQUcsVUFBQSxHQUFhLElBQUMsQ0FBQSxjQUFELENBQUEsQ0FBaEI7WUFDSSxJQUFHLFVBQVUsQ0FBQyxLQUFYLENBQUEsQ0FBSDtBQUNJLHVCQUFPLFdBRFg7YUFBQSxNQUFBO0FBR0ksdUJBQU8sVUFBVSxDQUFDLFVBQVgsQ0FBQSxFQUhYO2FBREo7O0lBRlc7OzBCQVFmLGtCQUFBLEdBQW9CLFNBQUE7QUFFaEIsWUFBQTtRQUFBLElBQUcsVUFBQSxHQUFhLElBQUMsQ0FBQSxjQUFELENBQUEsQ0FBaEI7WUFDSSxJQUFHLFVBQVUsQ0FBQyxLQUFYLENBQUEsQ0FBQSxJQUFzQixVQUFVLENBQUMsS0FBWCxDQUFBLENBQXpCO0FBQ0ksdUJBQU8sV0FEWDthQUFBLE1BQUE7QUFHSSx1QkFBTyxVQUFVLENBQUMsVUFBWCxDQUFBLEVBSFg7YUFESjs7SUFGZ0I7OzBCQVFwQixtQkFBQSxHQUFxQixTQUFDLE1BQUQ7ZUFFakIsTUFBTSxDQUFDLGVBQVAsQ0FBQTtJQUZpQjs7MEJBSXJCLGdCQUFBLEdBQWtCLFNBQUMsTUFBRDtRQUVkLElBQUcsTUFBTSxDQUFDLFNBQVY7bUJBQ0ksTUFBTSxDQUFDLFdBQVAsQ0FBQSxFQURKO1NBQUEsTUFBQTttQkFHSSxNQUFNLENBQUMsV0FBUCxDQUFBLEVBSEo7O0lBRmM7OzBCQU9sQixtQkFBQSxHQUFxQixTQUFBO0FBRWpCLFlBQUE7UUFBQSxtREFBQTtpREFDTSxDQUFFLE1BQU0sQ0FBQyxNQUFmLENBQUE7SUFIaUI7OzBCQVdyQixZQUFBLEdBQWMsU0FBQyxJQUFELEVBQU8sR0FBUDtBQUVWLFlBQUE7UUFBQSxJQUFBLDBFQUE4QixDQUFFO1FBQ2hDLElBQVUsS0FBQSxDQUFNLElBQU4sQ0FBVjtBQUFBLG1CQUFBOztlQUVBLEdBQUcsQ0FBQyxNQUFKLENBQVcsSUFBWCxFQUFpQixDQUFBLFNBQUEsS0FBQTttQkFBQSxTQUFDLE1BQUQ7dUJBQVksS0FBQyxDQUFBLG1CQUFELENBQXFCLEdBQXJCLEVBQTBCLEdBQUcsQ0FBQyxXQUFKLENBQWdCLE1BQWhCLENBQTFCO1lBQVo7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWpCO0lBTFU7OzBCQU9kLG1CQUFBLEdBQXFCLFNBQUMsR0FBRCxFQUFNLEtBQU47QUFFakIsWUFBQTt3REFBYSxDQUFFLGNBQWYsQ0FBOEIsS0FBOUI7SUFGaUI7OzBCQUlyQixXQUFBLEdBQWEsU0FBQyxNQUFELEVBQVMsTUFBVDtBQUVULFlBQUE7UUFBQSxLQUFBLEdBQVEsR0FBRyxDQUFDLFdBQUosQ0FBZ0IsTUFBaEI7QUFDUixhQUFXLHVHQUFYO1lBQ0ksSUFBQyxDQUFBLG1CQUFELENBQXFCLEdBQXJCLEVBQTBCLEtBQTFCO0FBREo7aURBR00sQ0FBRSxjQUFSLENBQXVCLEtBQXZCO0lBTlM7OzBCQWNiLFdBQUEsR0FBYSxTQUFDLElBQUQsRUFBTyxLQUFQO0FBRVQsWUFBQTtRQUFBLFNBQUEsR0FBWSxLQUFBLENBQU0sQ0FBTixFQUFTLEdBQVQsRUFBYyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQXZCO2VBQ1osSUFBQyxDQUFBLFlBQUQsQ0FBYyxTQUFkO0lBSFM7OzBCQUtiLFlBQUEsR0FBYyxTQUFDLFVBQUQ7UUFBQyxJQUFDLENBQUEsWUFBRDtRQUVYLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBYixDQUFpQixZQUFqQixFQUE4QixJQUFDLENBQUEsU0FBL0I7UUFDQSxJQUFDLENBQUEsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFuQixHQUE2QixJQUFDLENBQUEsU0FBRixHQUFZO1FBQ3hDLElBQUMsQ0FBQSxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFqQixHQUE0QixJQUFDLENBQUEsU0FBRixHQUFZO1FBQ3ZDLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQVosR0FBc0IsSUFBQyxDQUFBLFNBQUYsR0FBWTtlQUNqQyxJQUFDLENBQUEsbUJBQUQsQ0FBQTtJQU5VOzswQkFRZCxXQUFBLEdBQWEsU0FBQTtBQUVULFlBQUE7UUFBQSxJQUFHLElBQUMsQ0FBQSxTQUFELEdBQWEsQ0FBaEI7WUFDSSxJQUFDLENBQUEsWUFBRCxDQUFjLEdBQWQsRUFESjtTQUFBLE1BQUE7WUFHSSxJQUFBLENBQUssa0NBQUw7O29CQUNpQixDQUFFLEtBQW5CLENBQUE7O1lBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBYyxDQUFkLEVBTEo7O2VBT0EsSUFBQyxDQUFBLG1CQUFELENBQUE7SUFUUzs7OztHQXhnQlM7O0FBbWhCMUIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgJCwgY2xhbXAsIGRyYWcsIGVsZW0sIGVtcHR5LCBmaWxlbGlzdCwga2xvZywgcG9zdCwgcHJlZnMsIHNsYXNoLCB2YWxpZCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Ccm93c2VyICA9IHJlcXVpcmUgJy4vYnJvd3NlcidcblNoZWxmICAgID0gcmVxdWlyZSAnLi9zaGVsZidcblNlbGVjdCAgID0gcmVxdWlyZSAnLi9zZWxlY3QnXG5GaWxlICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL2ZpbGUnXG5JbmZvICAgICA9IHJlcXVpcmUgJy4vaW5mbydcbmh1YiAgICAgID0gcmVxdWlyZSAnLi4vZ2l0L2h1YidcblxuY2xhc3MgRmlsZUJyb3dzZXIgZXh0ZW5kcyBCcm93c2VyXG5cbiAgICBAOiAodmlldykgLT5cblxuICAgICAgICBzdXBlciB2aWV3XG5cbiAgICAgICAgd2luZG93LmZpbGVicm93c2VyID0gQFxuXG4gICAgICAgIEBsb2FkSUQgPSAwXG4gICAgICAgIEBzaGVsZiAgPSBuZXcgU2hlbGYgQFxuICAgICAgICBAc2VsZWN0ID0gbmV3IFNlbGVjdCBAXG4gICAgICAgIEBuYW1lICAgPSAnRmlsZUJyb3dzZXInXG4gICAgICAgIEBzcmNDYWNoZSA9IHt9XG4gICAgICAgIFxuICAgICAgICBwb3N0Lm9uICdmaWxlJyAgICAgICAgICAgQG9uRmlsZVxuICAgICAgICBwb3N0Lm9uICdicm93c2UnICAgICAgICAgQGJyb3dzZVxuICAgICAgICBwb3N0Lm9uICdmaWxlYnJvd3NlcicgICAgQG9uRmlsZUJyb3dzZXJcblxuICAgICAgICBwb3N0Lm9uICdnaXRTdGF0dXMnICAgICAgQG9uR2l0U3RhdHVzXG4gICAgICAgIHBvc3Qub24gJ2ZpbGVJbmRleGVkJyAgICBAb25GaWxlSW5kZXhlZFxuICAgICAgICBwb3N0Lm9uICdkaXJDaGFuZ2VkJyAgICAgQG9uRGlyQ2hhbmdlZFxuICAgICAgICBcbiAgICAgICAgQHNoZWxmUmVzaXplID0gZWxlbSAnZGl2JyBjbGFzczogJ3NoZWxmUmVzaXplJ1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS50b3AgICAgICA9ICcwcHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5ib3R0b20gICA9ICcwcHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5sZWZ0ICAgICA9ICcxOTRweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLndpZHRoICAgID0gJzZweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmN1cnNvciAgID0gJ2V3LXJlc2l6ZSdcblxuICAgICAgICBAZHJhZyA9IG5ldyBkcmFnXG4gICAgICAgICAgICB0YXJnZXQ6ICBAc2hlbGZSZXNpemVcbiAgICAgICAgICAgIG9uTW92ZTogIEBvblNoZWxmRHJhZ1xuXG4gICAgICAgIEBzaGVsZlNpemUgPSB3aW5kb3cuc3RhdGUuZ2V0ICdzaGVsZnxzaXplJyAyMDBcblxuICAgICAgICBAaW5pdENvbHVtbnMoKVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBkcm9wQWN0aW9uOiAoYWN0aW9uLCBzb3VyY2VzLCB0YXJnZXQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBzbGFzaC5pc0ZpbGUgdGFyZ2V0XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRhcmdldCA9IHNsYXNoLmRpciB0YXJnZXRcbiAgICAgICAgXG4gICAgICAgIGZvciBzb3VyY2UgaW4gc291cmNlc1xuICAgICAgICBcbiAgICAgICAgICAgIGlmIGFjdGlvbiA9PSAnbW92ZScgXG4gICAgICAgICAgICAgICAgaWYgc291cmNlID09IHRhcmdldCBvciBzbGFzaC5kaXIoc291cmNlKSA9PSB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAga2xvZyAnbm9vcCcgc291cmNlLCB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgZm9yIHNvdXJjZSBpbiBzb3VyY2VzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN3aXRjaCBhY3Rpb25cbiAgICAgICAgICAgICAgICB3aGVuICdtb3ZlJyB0aGVuIEZpbGUucmVuYW1lIHNvdXJjZSwgdGFyZ2V0LCAoc291cmNlLCB0YXJnZXQpID0+ICMga2xvZyAnZmlsZSBtb3ZlZCcgc291cmNlLCB0YXJnZXRcbiAgICAgICAgICAgICAgICB3aGVuICdjb3B5JyB0aGVuIEZpbGUuY29weSBzb3VyY2UsIHRhcmdldCwgKHNvdXJjZSwgdGFyZ2V0KSA9PiAjIGtsb2cgJ2ZpbGUgY29waWVkJyBzb3VyY2UsIHRhcmdldFxuICAgICAgICAgICAgICAgICAgICBcbiAgICBjb2x1bW5Gb3JGaWxlOiAoZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBjb2x1bW4gaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIGNvbHVtbi5wYXJlbnQ/LmZpbGUgPT0gc2xhc2guZGlyIGZpbGVcbiAgICAgICAgICAgICAgICByZXR1cm4gY29sdW1uXG4gICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHNoYXJlZENvbHVtbkluZGV4OiAoZmlsZSkgLT4gXG4gICAgICAgIFxuICAgICAgICBjb2wgPSAwXG4gICAgICAgIFxuICAgICAgICBmb3IgY29sdW1uIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBjb2x1bW4uaXNEaXIoKSBhbmQgZmlsZS5zdGFydHNXaXRoIGNvbHVtbi5wYXRoKClcbiAgICAgICAgICAgICAgICBjb2wgKz0gMVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNvbCA9PSAxIGFuZCBzbGFzaC5kaXIoZmlsZSkgIT0gQGNvbHVtbnNbMF0/LnBhdGgoKVxuICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgTWF0aC5tYXggLTEsIGNvbC0yXG5cbiAgICBicm93c2U6IChmaWxlLCBvcHQpID0+IFxuXG4gICAgICAgIGtsb2cgJ2Jyb3dzZScgZmlsZSwgb3B0XG4gICAgICAgIGlmIGZpbGUgdGhlbiBAbG9hZEl0ZW0gQGZpbGVJdGVtKGZpbGUpLCBvcHRcbiAgICAgICAgXG4gICAgb25GaWxlOiAoZmlsZSkgPT4gXG4gICAgXG4gICAgICAgICMga2xvZyAnb25GaWxlJyBmaWxlXG4gICAgICAgIGlmIGZpbGUgYW5kIEBmbGV4IHRoZW4gQG5hdmlnYXRlVG9GaWxlIGZpbGVcbiAgICBcbiAgICBuYXZpZ2F0ZVRvRmlsZTogKGZpbGUpID0+XG5cbiAgICAgICAgIyMjXG4gICAgICAgIHRyaWdnZXJlZCBieSBcbiAgICAgICAgICAgIGJyb3dzZS5zdGFydFxuICAgICAgICAgICAgJ2ZpbGUnIHBvc3RlZCBmcm9tIFxuICAgICAgICAgICAgICAgIGZpbGVlZGl0b3Iuc2V0Q3VycmVudEZpbGUgXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHJldXNlcyBzaGFyZWQgY29sdW1ucyBvZiBjdXJyZW50IGFuZCBuZXcgcGF0aFxuICAgICAgICAjIyNcbiAgICAgICAgXG4gICAgICAgICMga2xvZyAnbmF2aWdhdGVUb0ZpbGUnIGZpbGVcbiAgICAgICAgXG4gICAgICAgIGxhc3RQYXRoID0gQGxhc3REaXJDb2x1bW4oKT8ucGF0aCgpXG4gICAgICAgIFxuICAgICAgICBmaWxlID0gc2xhc2gucGF0aCBmaWxlXG5cbiAgICAgICAgaWYgZmlsZSA9PSBsYXN0UGF0aCBvciBmaWxlID09IEBsYXN0Q29sdW1uUGF0aCgpIG9yIHNsYXNoLmlzUmVsYXRpdmUgZmlsZVxuICAgICAgICAgICAgIyBrbG9nICduYXZpZ2F0ZVRvRmlsZSBTS0lQIGFscmVhZHkgbG9hZGVkJyBsYXN0UGF0aCwgQGxhc3RDb2x1bW5QYXRoKClcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGtsb2cgJ25hdmlnYXRlVG9GaWxlJyBmaWxlXG4gICAgICAgIGtsb2cgJ25hdmlnYXRlVG9GaWxlJyBAbGFzdENvbHVtblBhdGgoKVxuICAgICAgICBrbG9nICduYXZpZ2F0ZVRvRmlsZScgQGxhc3REaXJDb2x1bW4oKT8ucGF0aCgpXG4gICAgICAgICAgICBcbiAgICAgICAgY29sID0gQHNoYXJlZENvbHVtbkluZGV4IGZpbGVcbiAgICAgICAgXG4gICAgICAgIGZpbGVsaXN0ID0gc2xhc2gucGF0aGxpc3QgZmlsZVxuICAgICAgICBcbiAgICAgICAgaWYgY29sID49IDBcbiAgICAgICAgICAgIHBhdGhzID0gZmlsZWxpc3Quc2xpY2UgZmlsZWxpc3QuaW5kZXhPZihAY29sdW1uc1tjb2xdLnBhdGgoKSkrMVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwYXRocyA9IGZpbGVsaXN0LnNsaWNlIGZpbGVsaXN0Lmxlbmd0aC0yXG4gICAgICAgICAgICBcbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sKzEsIHBvcDp0cnVlIGNsZWFyOmNvbCtwYXRocy5sZW5ndGhcbiAgICAgICAgXG4gICAgICAgIHdoaWxlIEBudW1Db2xzKCkgPCBwYXRocy5sZW5ndGhcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGZvciBpbmRleCBpbiBbMC4uLnBhdGhzLmxlbmd0aF1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaXRlbSA9IEBmaWxlSXRlbSBwYXRoc1tpbmRleF1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3dpdGNoIGl0ZW0udHlwZVxuICAgICAgICAgICAgICAgIHdoZW4gJ2ZpbGUnIFxuICAgICAgICAgICAgICAgICAgICBAbG9hZEZpbGVJdGVtIGl0ZW0sIGNvbCsxK2luZGV4XG4gICAgICAgICAgICAgICAgd2hlbiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICBvcHQgPSB7fVxuICAgICAgICAgICAgICAgICAgICBpZiBpbmRleCA8IHBhdGhzLmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHQuYWN0aXZlID0gcGF0aHNbaW5kZXgrMV1cbiAgICAgICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtIGl0ZW0sIGNvbCsxK2luZGV4LCBvcHRcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNvbCA9IEBsYXN0RGlyQ29sdW1uKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgcm93ID0gY29sLnJvdyhzbGFzaC5maWxlIGZpbGUpXG4gICAgICAgICAgICAgICAgcm93LnNldEFjdGl2ZSgpXG5cbiAgICByZWZyZXNoOiA9PlxuXG4gICAgICAgIGh1Yi5yZWZyZXNoKClcbiAgICAgICAgQHNyY0NhY2hlID0ge31cblxuICAgICAgICBpZiBAbGFzdFVzZWRDb2x1bW4oKVxuICAgICAgICAgICAgQG5hdmlnYXRlVG9GaWxlIEBsYXN0VXNlZENvbHVtbigpLnBhdGgoKVxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGZpbGVJdGVtOiAocGF0aCkgLT5cbiAgICAgICAgXG4gICAgICAgIHAgPSBzbGFzaC5yZXNvbHZlIHBhdGhcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgZmlsZTpwXG4gICAgICAgIHR5cGU6c2xhc2guaXNGaWxlKHApIGFuZCAnZmlsZScgb3IgJ2RpcidcbiAgICAgICAgbmFtZTpzbGFzaC5maWxlIHBcbiAgICAgICAgXG4gICAgb25GaWxlQnJvd3NlcjogKGFjdGlvbiwgaXRlbSwgYXJnKSA9PlxuXG4gICAgICAgIGtsb2cgJ29uRmlsZUJyb3dzZXInIGFjdGlvbiwgaXRlbS50eXBlLCBhcmdcbiAgICAgICAgc3dpdGNoIGFjdGlvblxuICAgICAgICAgICAgd2hlbiAnbG9hZEl0ZW0nICAgICB0aGVuIEBsb2FkSXRlbSAgICAgaXRlbSwgYXJnXG4gICAgICAgICAgICB3aGVuICdhY3RpdmF0ZUl0ZW0nIHRoZW4gQGFjdGl2YXRlSXRlbSBpdGVtLCBhcmdcbiAgICBcbiAgICBsb2FkRGlyOiAocGF0aCkgLT4gQGxvYWRJdGVtIHR5cGU6J2RpcicgZmlsZTpwYXRoXG4gICAgXG4gICAgbG9hZEl0ZW06IChpdGVtLCBvcHQpIC0+IFxuICAgIFxuICAgICAgICAjIyNcbiAgICAgICAgdHJpZ2dlcmVkIGJ5IFxuICAgICAgICAgICAgQGxvYWREaXJcbiAgICAgICAgICAgIEBicm93c2UgXG4gICAgICAgICAgICBAbmF2aWdhdGUgKGRlZmluZWQgaW4gYnJvd3NlcilcbiAgICAgICAgICAgICdmaWxlYnJvd3NlcicgJ2xvYWRJdGVtJyBwb3N0ZWQgZnJvbSBcbiAgICAgICAgICAgICAgICBzaGVsZi5hY3RpdmF0ZVJvd1xuICAgICAgICAgICAgICAgIHNoZWxmLm5hdmlnYXRpbmdSb3dzXG4gICAgICAgICAgICAgICAgYnJvd3NlLnN0YXJ0XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGNsZWFycyBhbGwgY29sdW1ucywgbG9hZHMgdGhlIGRpciBpbiBjb2x1bW4gMCBhbmQgdGhlIGZpbGUgaW4gY29sdW1uIDEsIGlmIGFueVxuICAgICAgICAjIyNcblxuICAgICAgICBrbG9nICdsb2FkSXRlbScgaXRlbSwgb3B0XG4gICAgICAgIFxuICAgICAgICBvcHQgPz0gYWN0aXZlOicuLicgZm9jdXM6dHJ1ZVxuICAgICAgICBpdGVtLm5hbWUgPz0gc2xhc2guZmlsZSBpdGVtLmZpbGVcblxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSAxLCBwb3A6dHJ1ZSwgY2xlYXI6b3B0LmNsZWFyID8gMVxuXG4gICAgICAgIHN3aXRjaCBpdGVtLnR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2RpcicgIHRoZW4gQGxvYWREaXJJdGVtIGl0ZW0sIDAsIG9wdFxuICAgICAgICAgICAgd2hlbiAnZmlsZScgXG4gICAgICAgICAgICAgICAgb3B0LmFjdGl2YXRlID0gaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgd2hpbGUgQG51bUNvbHMoKSA8IDIgdGhlbiBAYWRkQ29sdW1uKClcbiAgICAgICAgICAgICAgICBAbG9hZERpckl0ZW0gQGZpbGVJdGVtKHNsYXNoLmRpcihpdGVtLmZpbGUpKSwgMCwgb3B0XG5cbiAgICAgICAgaWYgb3B0LmZvY3VzXG4gICAgICAgICAgICBrbG9nICdsb2FkSXRlbSBmb2N1cyBjb2x1bW5zWzBdJyBcbiAgICAgICAgICAgIEBjb2x1bW5zWzBdPy5mb2N1cygpXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgYWN0aXZhdGVJdGVtOiAoaXRlbSwgY29sKSAtPiBcbiAgICAgICAgIyMjXG4gICAgICAgIHRyaWdnZXJlZCBieSBwb3N0KCdmaWxlYnJvd3NlcicgJ2FjdGl2YXRlSXRlbScpIGluIHJvdy5hY3RpdmF0ZVxuICAgICAgICBcbiAgICAgICAgbG9hZHMgaXRlbSBpbiB0aGUgY29sdW1uIHRvIHRoZSByaWdodCBvZiBjb2wgd2hpbGUga2VlcGluZyB0aGUgb3RoZXIgY29sdW1uc1xuICAgICAgICAjIyNcblxuICAgICAgICBrbG9nICdhY3RpdmF0ZUl0ZW0nIGl0ZW0udHlwZSwgaXRlbS5maWxlLCBjb2xcbiAgICAgICAgXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbCsyIHBvcDp0cnVlXG5cbiAgICAgICAgc3dpdGNoIGl0ZW0udHlwZVxuICAgICAgICAgICAgd2hlbiAnZGlyJ1xuICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbSAgaXRlbSwgY29sKzEsIGZvY3VzOmZhbHNlXG4gICAgICAgICAgICB3aGVuICdmaWxlJ1xuICAgICAgICAgICAgICAgIEBsb2FkRmlsZUl0ZW0gaXRlbSwgY29sKzFcbiAgICAgICAgICAgICAgICBpZiBpdGVtLnRleHRGaWxlIG9yIEZpbGUuaXNUZXh0IGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUb0ZpbGUnIGl0ZW1cblxuICAgICMgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGxvYWRGaWxlSXRlbTogKGl0ZW0sIGNvbD0wKSAtPlxuXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbCwgcG9wOnRydWVcblxuICAgICAgICB3aGlsZSBjb2wgPj0gQG51bUNvbHMoKVxuICAgICAgICAgICAgQGFkZENvbHVtbigpXG5cbiAgICAgICAgZmlsZSA9IGl0ZW0uZmlsZVxuXG4gICAgICAgIEBjb2x1bW5zW2NvbF0ucGFyZW50ID0gaXRlbVxuICAgICAgICBcbiAgICAgICAgaWYgRmlsZS5pc0ltYWdlIGZpbGVcbiAgICAgICAgICAgIEBpbWFnZUluZm9Db2x1bW4gY29sLCBmaWxlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHN3aXRjaCBzbGFzaC5leHQgZmlsZVxuICAgICAgICAgICAgICAgIHdoZW4gJ3RpZmYnICd0aWYnXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBzbGFzaC53aW4oKVxuICAgICAgICAgICAgICAgICAgICAgICAgQGNvbnZlcnRJbWFnZSByb3dcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQGZpbGVJbmZvQ29sdW1uIGNvbCwgZmlsZVxuICAgICAgICAgICAgICAgIHdoZW4gJ3B4bSdcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgICAgICAgICBAY29udmVydFBYTSByb3dcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQGZpbGVJbmZvQ29sdW1uIGNvbCwgZmlsZVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaWYgRmlsZS5pc1RleHQgaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBAbG9hZFNvdXJjZUl0ZW0gaXRlbSwgY29sXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBGaWxlLmlzQ29kZSBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIEBmaWxlSW5mb0NvbHVtbiBjb2wsIGZpbGVcblxuICAgICAgICBwb3N0LmVtaXQgJ2xvYWQnIGNvbHVtbjpjb2wsIGl0ZW06aXRlbVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG5cbiAgICBpbWFnZUluZm9Db2x1bW46IChjb2wsIGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBAY29sdW1uc1tjb2xdLmNydW1iLmhpZGUoKVxuICAgICAgICBAY29sdW1uc1tjb2xdLnRhYmxlLmFwcGVuZENoaWxkIEluZm8uaW1hZ2UgZmlsZVxuICAgICAgICBcbiAgICBmaWxlSW5mb0NvbHVtbjogKGNvbCwgZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjb2x1bW5zW2NvbF0uY3J1bWIuaGlkZSgpXG4gICAgICAgIEBjb2x1bW5zW2NvbF0udGFibGUuYXBwZW5kQ2hpbGQgSW5mby5maWxlIGZpbGVcbiAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIG9uRmlsZUluZGV4ZWQ6IChmaWxlLCBpbmZvKSA9PlxuIFxuICAgICAgICAjIGtsb2cgJ29uRmlsZUluZGV4ZWQnIGZpbGVcbiAgICAgICAgXG4gICAgICAgIEBzcmNDYWNoZVtmaWxlXSA9IGluZm9cbiBcbiAgICAgICAgaWYgZmlsZSA9PSBAbGFzdFVzZWRDb2x1bW4oKT8ucGFyZW50Py5maWxlXG4gICAgICAgICAgICBAbG9hZFNvdXJjZUl0ZW0geyBmaWxlOmZpbGUsIHR5cGU6J2ZpbGUnIH0sIEBsYXN0VXNlZENvbHVtbigpPy5pbmRleFxuICAgICAgICAgICAgIFxuICAgIGxvYWRTb3VyY2VJdGVtOiAoaXRlbSwgY29sKSAtPlxuXG4gICAgICAgIGlmIG5vdCBAc3JjQ2FjaGVbaXRlbS5maWxlXT9cblxuICAgICAgICAgICAgQHNyY0NhY2hlW2l0ZW0uZmlsZV0gPSBwb3N0LmdldCAnaW5kZXhlcicgJ2ZpbGUnIGl0ZW0uZmlsZVxuXG4gICAgICAgIGluZm8gPSBAc3JjQ2FjaGVbaXRlbS5maWxlXVxuXG4gICAgICAgIGlmIGVtcHR5IGluZm9cbiAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0ubG9hZEl0ZW1zIFtdLCBpdGVtXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpdGVtcyA9IFtdXG4gICAgICAgIGNsc3NzID0gaW5mby5jbGFzc2VzID8gW11cbiAgICAgICAgZm9yIGNsc3MgaW4gY2xzc3NcbiAgICAgICAgICAgIHRleHQgPSAn4pePICcrY2xzcy5uYW1lXG4gICAgICAgICAgICBpdGVtcy5wdXNoIG5hbWU6Y2xzcy5uYW1lLCB0ZXh0OnRleHQsIHR5cGU6J2NsYXNzJywgZmlsZTppdGVtLmZpbGUsIGxpbmU6Y2xzcy5saW5lXG5cbiAgICAgICAgZnVuY3MgPSBpbmZvLmZ1bmNzID8gW11cbiAgICAgICAgZm9yIGZ1bmMgaW4gZnVuY3NcbiAgICAgICAgICAgIGlmIGZ1bmMudGVzdCA9PSAnZGVzY3JpYmUnXG4gICAgICAgICAgICAgICAgdGV4dCA9ICfil48gJytmdW5jLm5hbWVcbiAgICAgICAgICAgIGVsc2UgaWYgZnVuYy5zdGF0aWNcbiAgICAgICAgICAgICAgICB0ZXh0ID0gJyAg4peGICcrZnVuYy5uYW1lXG4gICAgICAgICAgICBlbHNlIGlmIGZ1bmMucG9zdFxuICAgICAgICAgICAgICAgIHRleHQgPSAnICDirKIgJytmdW5jLm5hbWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0ZXh0ID0gJyAg4pa4ICcrZnVuYy5uYW1lXG4gICAgICAgICAgICBpdGVtcy5wdXNoIG5hbWU6ZnVuYy5uYW1lLCB0ZXh0OnRleHQsIHR5cGU6J2Z1bmMnLCBmaWxlOml0ZW0uZmlsZSwgbGluZTpmdW5jLmxpbmVcblxuICAgICAgICBpZiB2YWxpZCBpdGVtc1xuICAgICAgICAgICAgaXRlbXMuc29ydCAoYSxiKSAtPiBhLmxpbmUgLSBiLmxpbmVcbiAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0ubG9hZEl0ZW1zIGl0ZW1zLCBpdGVtXG4gICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIG9uRGlyQ2hhbmdlZDogKGluZm8pID0+XG4gXG4gICAgICAgICMga2xvZyAnb25EaXJDaGFuZ2VkJyBpbmZvLmNoYW5nZSwgaW5mby5kaXIsIGluZm8ucGF0aFxuICAgICAgICBmb3IgY29sdW1uIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBjb2x1bW4ucGF0aCgpID09IGluZm8uZGlyXG4gICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtIHtmaWxlOmluZm8uZGlyLCB0eXBlOidkaXInfSwgY29sdW1uLmluZGV4LCBhY3RpdmU6Y29sdW1uLmFjdGl2ZVBhdGgoKSwgZm9jdXM6ZmFsc2VcbiAgICAgICAgICAgIGlmIGNvbHVtbi5wYXRoKCkgPT0gaW5mby5wYXRoIGFuZCBpbmZvLmNoYW5nZSA9PSAncmVtb3ZlJ1xuICAgICAgICAgICAgICAgIGNvbHVtbi5jbGVhcigpXG4gICAgXG4gICAgbG9hZERpckl0ZW06IChpdGVtLCBjb2w9MCwgb3B0PXt9KSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBjb2wgPiAwIGFuZCBpdGVtLm5hbWUgPT0gJy8nXG5cbiAgICAgICAgZGlyID0gaXRlbS5maWxlXG5cbiAgICAgICAgIyBpZiBAc2tpcE9uRGJsQ2xpY2tcbiAgICAgICAgICAgICMga2xvZyAnbG9hZERpckl0ZW0gc2tpcCcgY29sLCBkaXJcbiAgICAgICAgICAgICMgZGVsZXRlIEBza2lwT25EYmxDbGlja1xuICAgICAgICAgICAgIyByZXR1cm4gXG4gICAgICAgIFxuICAgICAgICAjIG9wdC5pZ25vcmVIaWRkZW4gPSBub3Qgd2luZG93LnN0YXRlLmdldCBcImJyb3dzZXJ8c2hvd0hpZGRlbnwje2Rpcn1cIlxuICAgICAgICBvcHQuaWdub3JlSGlkZGVuID0gbm90IHByZWZzLmdldCBcImJyb3dzZXLilrhzaG93SGlkZGVu4pa4I3tkaXJ9XCJcbiAgICAgICAgc2xhc2gubGlzdCBkaXIsIG9wdCwgKGl0ZW1zKSA9PlxuICAgICAgICAgICAgcG9zdC50b01haW4gJ2RpckxvYWRlZCcgZGlyXG4gICAgICAgICAgICBAbG9hZERpckl0ZW1zIGRpciwgaXRlbSwgaXRlbXMsIGNvbCwgb3B0XG4gICAgICAgICAgICBwb3N0LmVtaXQgJ2RpcicgZGlyXG4gICAgICAgICAgICAgICAgXG4gICAgbG9hZERpckl0ZW1zOiAoZGlyLCBpdGVtLCBpdGVtcywgY29sLCBvcHQpID0+XG4gICAgICAgIFxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICMga2xvZyAnbG9hZERpckl0ZW1zJyBjb2wsIGRpclxuICAgICAgICBpZiBAc2tpcE9uRGJsQ2xpY2sgYW5kIGNvbCA+IDBcbiAgICAgICAgICAgIGRlbGV0ZSBAc2tpcE9uRGJsQ2xpY2tcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgd2hpbGUgY29sID49IEBudW1Db2xzKClcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuICAgICAgICBcbiAgICAgICAgQGNvbHVtbnNbY29sXS5sb2FkSXRlbXMgaXRlbXMsIGl0ZW1cblxuICAgICAgICBwb3N0LmVtaXQgJ2xvYWQnIGNvbHVtbjpjb2wsIGl0ZW06aXRlbVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBvcHQuYWN0aXZhdGVcbiAgICAgICAgICAgIGlmIHJvdyA9IEBjb2x1bW5zW2NvbF0ucm93IHNsYXNoLmZpbGUgb3B0LmFjdGl2YXRlXG4gICAgICAgICAgICAgICAgcm93LmFjdGl2YXRlKClcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2xvYWQnIGNvbHVtbjpjb2wrMSBpdGVtOnJvdy5pdGVtXG4gICAgICAgIGVsc2UgaWYgb3B0LmFjdGl2ZVxuICAgICAgICAgICAgQGNvbHVtbnNbY29sXS5yb3coc2xhc2guZmlsZSBvcHQuYWN0aXZlKT8uc2V0QWN0aXZlKClcbiAgICAgICAgXG4gICAgICAgIEBnZXRHaXRTdGF0dXMgaXRlbSwgY29sXG4gICAgICAgIFxuICAgICAgICBpZiBvcHQuZm9jdXMgIT0gZmFsc2UgYW5kIGVtcHR5KGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpIGFuZCBlbXB0eSgkKCcucG9wdXAnKT8ub3V0ZXJIVE1MKVxuICAgICAgICAgICAgaWYgbGFzdENvbHVtbiA9IEBsYXN0RGlyQ29sdW1uKClcbiAgICAgICAgICAgICAgICAjIGtsb2cgJ2xvYWREaXJJdGVtcyBsYXN0Q29sdW1uLmZvY3VzJ1xuICAgICAgICAgICAgICAgIGxhc3RDb2x1bW4uZm9jdXMoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBvcHQuY2I/IGNvbHVtbjpjb2wsIGl0ZW06aXRlbVxuXG4gICAgICAgIGlmIGNvbCA+PSAyIGFuZCBAY29sdW1uc1swXS53aWR0aCgpIDwgMjUwXG4gICAgICAgICAgICBAY29sdW1uc1sxXS5tYWtlUm9vdCgpXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGluaXRDb2x1bW5zOiAtPlxuXG4gICAgICAgIHN1cGVyKClcblxuICAgICAgICBAdmlldy5pbnNlcnRCZWZvcmUgQHNoZWxmLmRpdiwgQHZpZXcuZmlyc3RDaGlsZFxuICAgICAgICBAdmlldy5pbnNlcnRCZWZvcmUgQHNoZWxmUmVzaXplLCBudWxsXG5cbiAgICAgICAgQHNoZWxmLmJyb3dzZXJEaWRJbml0Q29sdW1ucygpXG5cbiAgICAgICAgQHNldFNoZWxmU2l6ZSBAc2hlbGZTaXplXG5cbiAgICBjb2x1bW5BdFBvczogKHBvcykgLT5cblxuICAgICAgICBpZiBjb2x1bW4gPSBzdXBlciBwb3NcbiAgICAgICAgICAgIHJldHVybiBjb2x1bW5cblxuICAgICAgICBpZiBlbGVtLmNvbnRhaW5zUG9zIEBzaGVsZi5kaXYsIHBvc1xuICAgICAgICAgICAgcmV0dXJuIEBzaGVsZlxuICAgICAgICAgICAgXG4gICAgbGFzdENvbHVtblBhdGg6IC0+XG5cbiAgICAgICAgaWYgbGFzdENvbHVtbiA9IEBsYXN0VXNlZENvbHVtbigpXG4gICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtbi5wYXRoKClcblxuICAgIGxhc3REaXJDb2x1bW46IC0+XG5cbiAgICAgICAgaWYgbGFzdENvbHVtbiA9IEBsYXN0VXNlZENvbHVtbigpXG4gICAgICAgICAgICBpZiBsYXN0Q29sdW1uLmlzRGlyKClcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtblxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBsYXN0Q29sdW1uLnByZXZDb2x1bW4oKVxuXG4gICAgbGFzdERpck9yU3JjQ29sdW1uOiAtPlxuXG4gICAgICAgIGlmIGxhc3RDb2x1bW4gPSBAbGFzdFVzZWRDb2x1bW4oKVxuICAgICAgICAgICAgaWYgbGFzdENvbHVtbi5pc0RpcigpIG9yIGxhc3RDb2x1bW4uaXNTcmMoKVxuICAgICAgICAgICAgICAgIHJldHVybiBsYXN0Q29sdW1uXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW4ucHJldkNvbHVtbigpXG4gICAgICAgICAgICAgICAgXG4gICAgb25CYWNrc3BhY2VJbkNvbHVtbjogKGNvbHVtbikgLT5cblxuICAgICAgICBjb2x1bW4uYmFja3NwYWNlU2VhcmNoKClcbiAgICAgICAgXG4gICAgb25EZWxldGVJbkNvbHVtbjogKGNvbHVtbikgLT4gXG4gICAgXG4gICAgICAgIGlmIGNvbHVtbi5zZWFyY2hEaXZcbiAgICAgICAgICAgIGNvbHVtbi5jbGVhclNlYXJjaCgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNvbHVtbi5tb3ZlVG9UcmFzaCgpXG4gICAgICAgIFxuICAgIHVwZGF0ZUNvbHVtblNjcm9sbHM6ID0+XG5cbiAgICAgICAgc3VwZXIoKVxuICAgICAgICBAc2hlbGY/LnNjcm9sbC51cGRhdGUoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG4gICAgZ2V0R2l0U3RhdHVzOiAoaXRlbSwgY29sKSA9PlxuXG4gICAgICAgIGZpbGUgPSBpdGVtLmZpbGUgPyBpdGVtLnBhcmVudD8uZmlsZVxuICAgICAgICByZXR1cm4gaWYgZW1wdHkgZmlsZVxuXG4gICAgICAgIGh1Yi5zdGF0dXMgZmlsZSwgKHN0YXR1cykgPT4gQGFwcGx5R2l0U3RhdHVzRmlsZXMgY29sLCBodWIuc3RhdHVzRmlsZXMgc3RhdHVzXG5cbiAgICBhcHBseUdpdFN0YXR1c0ZpbGVzOiAoY29sLCBmaWxlcykgPT5cblxuICAgICAgICBAY29sdW1uc1tjb2xdPy51cGRhdGVHaXRGaWxlcyBmaWxlc1xuXG4gICAgb25HaXRTdGF0dXM6IChnaXREaXIsIHN0YXR1cykgPT5cblxuICAgICAgICBmaWxlcyA9IGh1Yi5zdGF0dXNGaWxlcyBzdGF0dXNcbiAgICAgICAgZm9yIGNvbCBpbiBbMC4uQGNvbHVtbnMubGVuZ3RoXVxuICAgICAgICAgICAgQGFwcGx5R2l0U3RhdHVzRmlsZXMgY29sLCBmaWxlc1xuXG4gICAgICAgIEBzaGVsZj8udXBkYXRlR2l0RmlsZXMgZmlsZXNcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwICAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAgICAgXG5cbiAgICBvblNoZWxmRHJhZzogKGRyYWcsIGV2ZW50KSA9PlxuXG4gICAgICAgIHNoZWxmU2l6ZSA9IGNsYW1wIDAsIDQwMCwgZHJhZy5wb3MueFxuICAgICAgICBAc2V0U2hlbGZTaXplIHNoZWxmU2l6ZVxuXG4gICAgc2V0U2hlbGZTaXplOiAoQHNoZWxmU2l6ZSkgLT5cblxuICAgICAgICB3aW5kb3cuc3RhdGUuc2V0ICdzaGVsZnxzaXplJyBAc2hlbGZTaXplXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5sZWZ0ID0gXCIje0BzaGVsZlNpemV9cHhcIlxuICAgICAgICBAc2hlbGYuZGl2LnN0eWxlLndpZHRoID0gXCIje0BzaGVsZlNpemV9cHhcIlxuICAgICAgICBAY29scy5zdHlsZS5sZWZ0ID0gXCIje0BzaGVsZlNpemV9cHhcIlxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG4gICAgXG4gICAgdG9nZ2xlU2hlbGY6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAc2hlbGZTaXplIDwgMVxuICAgICAgICAgICAgQHNldFNoZWxmU2l6ZSAyMDBcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAga2xvZyAndG9nZ2xlU2hlbGYgbGFzdFVzZWRDb2x1bW4uZm9jdXMnXG4gICAgICAgICAgICBAbGFzdFVzZWRDb2x1bW4oKT8uZm9jdXMoKVxuICAgICAgICAgICAgQHNldFNoZWxmU2l6ZSAwXG4gICAgICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gRmlsZUJyb3dzZXJcbiJdfQ==
//# sourceURL=../../coffee/browser/filebrowser.coffee