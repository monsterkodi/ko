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
        klog('onFile', file);
        if (file && this.flex) {
            return this.navigateToFile(file);
        }
    };

    FileBrowser.prototype.navigateToFile = function(file) {
        var col, i, index, item, lastPath, opt, paths, ref1, ref2, row;
        klog('navigateToFile', file);
        lastPath = (ref1 = this.lastDirColumn()) != null ? ref1.path() : void 0;
        file = slash.path(file);
        if (file === lastPath || file === this.lastColumnPath() || slash.isRelative(file)) {
            klog('navigateToFile SKIP already loaded', file);
            return;
        }
        klog('lastColumnPath', this.lastColumnPath());
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
            klog('loadItem focus columns[0]');
            return (ref2 = this.columns[0]) != null ? ref2.focus() : void 0;
        }
    };

    FileBrowser.prototype.activateItem = function(item, col) {
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
                klog('loadDirItems lastColumn.focus');
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWJyb3dzZXIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2Jyb3dzZXIiLCJzb3VyY2VzIjpbImZpbGVicm93c2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxpSUFBQTtJQUFBOzs7O0FBUUEsTUFBNkUsT0FBQSxDQUFRLEtBQVIsQ0FBN0UsRUFBRSxTQUFGLEVBQUssaUJBQUwsRUFBWSxlQUFaLEVBQWtCLGVBQWxCLEVBQXdCLGlCQUF4QixFQUErQix1QkFBL0IsRUFBeUMsZUFBekMsRUFBK0MsZUFBL0MsRUFBcUQsaUJBQXJELEVBQTRELGlCQUE1RCxFQUFtRTs7QUFFbkUsT0FBQSxHQUFXLE9BQUEsQ0FBUSxXQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsU0FBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0FBQ1gsSUFBQSxHQUFXLE9BQUEsQ0FBUSxlQUFSOztBQUNYLElBQUEsR0FBVyxPQUFBLENBQVEsUUFBUjs7QUFDWCxHQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBRUw7OztJQUVDLHFCQUFDLElBQUQ7Ozs7Ozs7Ozs7Ozs7O1FBRUMsNkNBQU0sSUFBTjtRQUVBLE1BQU0sQ0FBQyxXQUFQLEdBQXFCO1FBRXJCLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsS0FBRCxHQUFVLElBQUksS0FBSixDQUFVLElBQVY7UUFDVixJQUFDLENBQUEsTUFBRCxHQUFVLElBQUksTUFBSixDQUFXLElBQVg7UUFDVixJQUFDLENBQUEsSUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLFFBQUQsR0FBWTtRQUVaLElBQUksQ0FBQyxFQUFMLENBQVEsTUFBUixFQUF5QixJQUFDLENBQUEsTUFBMUI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFFBQVIsRUFBeUIsSUFBQyxDQUFBLE1BQTFCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxhQUFSLEVBQXlCLElBQUMs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QXFCLEdBQXJCLEVBQTBCLEtBQTFCO0FBREo7aURBR00sQ0FBRSxjQUFSLENBQXVCLEtBQXZCO0lBTlM7OzBCQWNiLFdBQUEsR0FBYSxTQUFDLElBQUQsRUFBTyxLQUFQO0FBRVQsWUFBQTtRQUFBLFNBQUEsR0FBWSxLQUFBLENBQU0sQ0FBTixFQUFTLEdBQVQsRUFBYyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQXZCO2VBQ1osSUFBQyxDQUFBLFlBQUQsQ0FBYyxTQUFkO0lBSFM7OzBCQUtiLFlBQUEsR0FBYyxTQUFDLFVBQUQ7UUFBQyxJQUFDLENBQUEsWUFBRDtRQUVYLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBYixDQUFpQixZQUFqQixFQUE4QixJQUFDLENBQUEsU0FBL0I7UUFDQSxJQUFDLENBQUEsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFuQixHQUE2QixJQUFDLENBQUEsU0FBRixHQUFZO1FBQ3hDLElBQUMsQ0FBQSxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFqQixHQUE0QixJQUFDLENBQUEsU0FBRixHQUFZO1FBQ3ZDLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQVosR0FBc0IsSUFBQyxDQUFBLFNBQUYsR0FBWTtlQUNqQyxJQUFDLENBQUEsbUJBQUQsQ0FBQTtJQU5VOzswQkFRZCxXQUFBLEdBQWEsU0FBQTtBQUVULFlBQUE7UUFBQSxJQUFHLElBQUMsQ0FBQSxTQUFELEdBQWEsQ0FBaEI7WUFDSSxJQUFDLENBQUEsWUFBRCxDQUFjLEdBQWQsRUFESjtTQUFBLE1BQUE7WUFHSSxJQUFBLENBQUssa0NBQUw7O29CQUNpQixDQUFFLEtBQW5CLENBQUE7O1lBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBYyxDQUFkLEVBTEo7O2VBT0EsSUFBQyxDQUFBLG1CQUFELENBQUE7SUFUUzs7OztHQXhlUzs7QUFtZjFCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiMjI1xuXG57ICQsIGNsYW1wLCBkcmFnLCBlbGVtLCBlbXB0eSwgZmlsZWxpc3QsIGtsb2csIHBvc3QsIHByZWZzLCBzbGFzaCwgdmFsaWQgfSA9IHJlcXVpcmUgJ2t4aydcblxuQnJvd3NlciAgPSByZXF1aXJlICcuL2Jyb3dzZXInXG5TaGVsZiAgICA9IHJlcXVpcmUgJy4vc2hlbGYnXG5TZWxlY3QgICA9IHJlcXVpcmUgJy4vc2VsZWN0J1xuRmlsZSAgICAgPSByZXF1aXJlICcuLi90b29scy9maWxlJ1xuSW5mbyAgICAgPSByZXF1aXJlICcuL2luZm8nXG5odWIgICAgICA9IHJlcXVpcmUgJy4uL2dpdC9odWInXG5cbmNsYXNzIEZpbGVCcm93c2VyIGV4dGVuZHMgQnJvd3NlclxuXG4gICAgQDogKHZpZXcpIC0+XG5cbiAgICAgICAgc3VwZXIgdmlld1xuXG4gICAgICAgIHdpbmRvdy5maWxlYnJvd3NlciA9IEBcblxuICAgICAgICBAbG9hZElEID0gMFxuICAgICAgICBAc2hlbGYgID0gbmV3IFNoZWxmIEBcbiAgICAgICAgQHNlbGVjdCA9IG5ldyBTZWxlY3QgQFxuICAgICAgICBAbmFtZSAgID0gJ0ZpbGVCcm93c2VyJ1xuICAgICAgICBAc3JjQ2FjaGUgPSB7fVxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnZmlsZScgICAgICAgICAgIEBvbkZpbGVcbiAgICAgICAgcG9zdC5vbiAnYnJvd3NlJyAgICAgICAgIEBicm93c2VcbiAgICAgICAgcG9zdC5vbiAnZmlsZWJyb3dzZXInICAgIEBvbkZpbGVCcm93c2VyXG5cbiAgICAgICAgcG9zdC5vbiAnZ2l0U3RhdHVzJyAgICAgIEBvbkdpdFN0YXR1c1xuICAgICAgICBwb3N0Lm9uICdmaWxlSW5kZXhlZCcgICAgQG9uRmlsZUluZGV4ZWRcbiAgICAgICAgcG9zdC5vbiAnZGlyQ2hhbmdlZCcgICAgIEBvbkRpckNoYW5nZWRcbiAgICAgICAgXG4gICAgICAgIEBzaGVsZlJlc2l6ZSA9IGVsZW0gJ2RpdicgY2xhc3M6ICdzaGVsZlJlc2l6ZSdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUudG9wICAgICAgPSAnMHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUuYm90dG9tICAgPSAnMHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUubGVmdCAgICAgPSAnMTk0cHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS53aWR0aCAgICA9ICc2cHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5jdXJzb3IgICA9ICdldy1yZXNpemUnXG5cbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQHNoZWxmUmVzaXplXG4gICAgICAgICAgICBvbk1vdmU6ICBAb25TaGVsZkRyYWdcblxuICAgICAgICBAc2hlbGZTaXplID0gd2luZG93LnN0YXRlLmdldCAnc2hlbGZ8c2l6ZScgMjAwXG5cbiAgICAgICAgQGluaXRDb2x1bW5zKClcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgZHJvcEFjdGlvbjogKGFjdGlvbiwgc291cmNlcywgdGFyZ2V0KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgc2xhc2guaXNGaWxlIHRhcmdldFxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0YXJnZXQgPSBzbGFzaC5kaXIgdGFyZ2V0XG4gICAgICAgIFxuICAgICAgICBmb3Igc291cmNlIGluIHNvdXJjZXNcbiAgICAgICAgXG4gICAgICAgICAgICBpZiBhY3Rpb24gPT0gJ21vdmUnIFxuICAgICAgICAgICAgICAgIGlmIHNvdXJjZSA9PSB0YXJnZXQgb3Igc2xhc2guZGlyKHNvdXJjZSkgPT0gdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgIGtsb2cgJ25vb3AnIHNvdXJjZSwgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGZvciBzb3VyY2UgaW4gc291cmNlc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBzd2l0Y2ggYWN0aW9uXG4gICAgICAgICAgICAgICAgd2hlbiAnbW92ZScgdGhlbiBGaWxlLnJlbmFtZSBzb3VyY2UsIHRhcmdldCwgKHNvdXJjZSwgdGFyZ2V0KSA9PiAjIGtsb2cgJ2ZpbGUgbW92ZWQnIHNvdXJjZSwgdGFyZ2V0XG4gICAgICAgICAgICAgICAgd2hlbiAnY29weScgdGhlbiBGaWxlLmNvcHkgc291cmNlLCB0YXJnZXQsIChzb3VyY2UsIHRhcmdldCkgPT4gIyBrbG9nICdmaWxlIGNvcGllZCcgc291cmNlLCB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgY29sdW1uRm9yRmlsZTogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgY29sdW1uIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBjb2x1bW4ucGFyZW50Py5maWxlID09IHNsYXNoLmRpciBmaWxlXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbHVtblxuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBzaGFyZWRDb2x1bW5JbmRleDogKGZpbGUpIC0+IFxuICAgICAgICBcbiAgICAgICAgY29sID0gMFxuICAgICAgICBcbiAgICAgICAgZm9yIGNvbHVtbiBpbiBAY29sdW1uc1xuICAgICAgICAgICAgaWYgY29sdW1uLmlzRGlyKCkgYW5kIGZpbGUuc3RhcnRzV2l0aCBjb2x1bW4ucGF0aCgpXG4gICAgICAgICAgICAgICAgY29sICs9IDFcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBjb2wgPT0gMSBhbmQgc2xhc2guZGlyKGZpbGUpICE9IEBjb2x1bW5zWzBdPy5wYXRoKClcbiAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgIE1hdGgubWF4IC0xLCBjb2wtMlxuXG4gICAgYnJvd3NlOiAoZmlsZSwgb3B0KSA9PiBcblxuICAgICAgICBrbG9nICdicm93c2UnIGZpbGUsIG9wdFxuICAgICAgICBpZiBmaWxlIHRoZW4gQGxvYWRJdGVtIEBmaWxlSXRlbShmaWxlKSwgb3B0XG4gICAgICAgIFxuICAgIG9uRmlsZTogKGZpbGUpID0+IFxuICAgIFxuICAgICAgICBrbG9nICdvbkZpbGUnIGZpbGVcbiAgICAgICAgaWYgZmlsZSBhbmQgQGZsZXggdGhlbiBAbmF2aWdhdGVUb0ZpbGUgZmlsZVxuICAgIFxuICAgIG5hdmlnYXRlVG9GaWxlOiAoZmlsZSkgPT5cblxuICAgICAgICBrbG9nICduYXZpZ2F0ZVRvRmlsZScgZmlsZVxuICAgICAgICBcbiAgICAgICAgbGFzdFBhdGggPSBAbGFzdERpckNvbHVtbigpPy5wYXRoKClcbiAgICAgICAgXG4gICAgICAgIGZpbGUgPSBzbGFzaC5wYXRoIGZpbGVcblxuICAgICAgICBpZiBmaWxlID09IGxhc3RQYXRoIG9yIGZpbGUgPT0gQGxhc3RDb2x1bW5QYXRoKCkgb3Igc2xhc2guaXNSZWxhdGl2ZSBmaWxlXG4gICAgICAgICAgICBrbG9nICduYXZpZ2F0ZVRvRmlsZSBTS0lQIGFscmVhZHkgbG9hZGVkJyBmaWxlXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBrbG9nICdsYXN0Q29sdW1uUGF0aCcgQGxhc3RDb2x1bW5QYXRoKClcbiAgICAgICAgICAgIFxuICAgICAgICBjb2wgPSBAc2hhcmVkQ29sdW1uSW5kZXggZmlsZVxuICAgICAgICBcbiAgICAgICAgZmlsZWxpc3QgPSBzbGFzaC5wYXRobGlzdCBmaWxlXG4gICAgICAgIFxuICAgICAgICBpZiBjb2wgPj0gMFxuICAgICAgICAgICAgcGF0aHMgPSBmaWxlbGlzdC5zbGljZSBmaWxlbGlzdC5pbmRleE9mKEBjb2x1bW5zW2NvbF0ucGF0aCgpKSsxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHBhdGhzID0gZmlsZWxpc3Quc2xpY2UgZmlsZWxpc3QubGVuZ3RoLTJcbiAgICAgICAgICAgIFxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2wrMSwgcG9wOnRydWUgY2xlYXI6Y29sK3BhdGhzLmxlbmd0aFxuICAgICAgICBcbiAgICAgICAgd2hpbGUgQG51bUNvbHMoKSA8IHBhdGhzLmxlbmd0aFxuICAgICAgICAgICAgQGFkZENvbHVtbigpXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgZm9yIGluZGV4IGluIFswLi4ucGF0aHMubGVuZ3RoXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpdGVtID0gQGZpbGVJdGVtIHBhdGhzW2luZGV4XVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICAgICAgd2hlbiAnZmlsZScgXG4gICAgICAgICAgICAgICAgICAgIEBsb2FkRmlsZUl0ZW0gaXRlbSwgY29sKzEraW5kZXhcbiAgICAgICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgICAgIG9wdCA9IHt9XG4gICAgICAgICAgICAgICAgICAgIGlmIGluZGV4IDwgcGF0aHMubGVuZ3RoLTFcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdC5hY3RpdmUgPSBwYXRoc1tpbmRleCsxXVxuICAgICAgICAgICAgICAgICAgICBAbG9hZERpckl0ZW0gaXRlbSwgY29sKzEraW5kZXgsIG9wdFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgY29sID0gQGxhc3REaXJDb2x1bW4oKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiByb3cgPSBjb2wucm93KHNsYXNoLmZpbGUgZmlsZSlcbiAgICAgICAgICAgICAgICByb3cuc2V0QWN0aXZlKClcblxuICAgIHJlZnJlc2g6ID0+XG5cbiAgICAgICAgaHViLnJlZnJlc2goKVxuICAgICAgICBAc3JjQ2FjaGUgPSB7fVxuXG4gICAgICAgIGlmIEBsYXN0VXNlZENvbHVtbigpXG4gICAgICAgICAgICBAbmF2aWdhdGVUb0ZpbGUgQGxhc3RVc2VkQ29sdW1uKCkucGF0aCgpXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgZmlsZUl0ZW06IChwYXRoKSAtPlxuICAgICAgICBcbiAgICAgICAgcCA9IHNsYXNoLnJlc29sdmUgcGF0aFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBmaWxlOnBcbiAgICAgICAgdHlwZTpzbGFzaC5pc0ZpbGUocCkgYW5kICdmaWxlJyBvciAnZGlyJ1xuICAgICAgICBuYW1lOnNsYXNoLmZpbGUgcFxuICAgICAgICBcbiAgICBvbkZpbGVCcm93c2VyOiAoYWN0aW9uLCBpdGVtLCBhcmcpID0+XG5cbiAgICAgICAgc3dpdGNoIGFjdGlvblxuICAgICAgICAgICAgd2hlbiAnbG9hZEl0ZW0nICAgICB0aGVuIEBsb2FkSXRlbSAgICAgaXRlbSwgYXJnXG4gICAgICAgICAgICB3aGVuICdhY3RpdmF0ZUl0ZW0nIHRoZW4gQGFjdGl2YXRlSXRlbSBpdGVtLCBhcmdcbiAgICBcbiAgICBsb2FkRGlyOiAocGF0aCkgLT4gQGxvYWRJdGVtIHR5cGU6J2RpcicgZmlsZTpwYXRoXG4gICAgXG4gICAgbG9hZEl0ZW06IChpdGVtLCBvcHQpIC0+XG5cbiAgICAgICAgb3B0ID89IGFjdGl2ZTonLi4nIGZvY3VzOnRydWVcbiAgICAgICAgaXRlbS5uYW1lID89IHNsYXNoLmZpbGUgaXRlbS5maWxlXG5cbiAgICAgICAgIyBrbG9nICdsb2FkSXRlbSdcbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gMSwgcG9wOnRydWUsIGNsZWFyOm9wdC5jbGVhciA/IDFcblxuICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICB3aGVuICdkaXInICB0aGVuIEBsb2FkRGlySXRlbSBpdGVtLCAwLCBvcHRcbiAgICAgICAgICAgIHdoZW4gJ2ZpbGUnIFxuICAgICAgICAgICAgICAgIG9wdC5hY3RpdmF0ZSA9IGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgIHdoaWxlIEBudW1Db2xzKCkgPCAyIHRoZW4gQGFkZENvbHVtbigpXG4gICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtIEBmaWxlSXRlbShzbGFzaC5kaXIoaXRlbS5maWxlKSksIDAsIG9wdFxuXG4gICAgICAgIGlmIG9wdC5mb2N1c1xuICAgICAgICAgICAga2xvZyAnbG9hZEl0ZW0gZm9jdXMgY29sdW1uc1swXScgXG4gICAgICAgICAgICBAY29sdW1uc1swXT8uZm9jdXMoKVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIGFjdGl2YXRlSXRlbTogKGl0ZW0sIGNvbCkgLT5cblxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2wrMiBwb3A6dHJ1ZVxuXG4gICAgICAgIHN3aXRjaCBpdGVtLnR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2RpcidcbiAgICAgICAgICAgICAgICAjIGtsb2cgJ2FjdGl2YXRlSXRlbSdcbiAgICAgICAgICAgICAgICBAbG9hZERpckl0ZW0gIGl0ZW0sIGNvbCsxLCBmb2N1czpmYWxzZVxuICAgICAgICAgICAgd2hlbiAnZmlsZSdcbiAgICAgICAgICAgICAgICBAbG9hZEZpbGVJdGVtIGl0ZW0sIGNvbCsxXG4gICAgICAgICAgICAgICAgaWYgaXRlbS50ZXh0RmlsZSBvciBGaWxlLmlzVGV4dCBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG9GaWxlJyBpdGVtXG5cbiAgICAjIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsb2FkRmlsZUl0ZW06IChpdGVtLCBjb2w9MCkgLT5cblxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2wsIHBvcDp0cnVlXG5cbiAgICAgICAgd2hpbGUgY29sID49IEBudW1Db2xzKClcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuXG4gICAgICAgIGZpbGUgPSBpdGVtLmZpbGVcblxuICAgICAgICBAY29sdW1uc1tjb2xdLnBhcmVudCA9IGl0ZW1cbiAgICAgICAgXG4gICAgICAgIGlmIEZpbGUuaXNJbWFnZSBmaWxlXG4gICAgICAgICAgICBAaW1hZ2VJbmZvQ29sdW1uIGNvbCwgZmlsZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzd2l0Y2ggc2xhc2guZXh0IGZpbGVcbiAgICAgICAgICAgICAgICB3aGVuICd0aWZmJyAndGlmJ1xuICAgICAgICAgICAgICAgICAgICBpZiBub3Qgc2xhc2gud2luKClcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjb252ZXJ0SW1hZ2Ugcm93XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEBmaWxlSW5mb0NvbHVtbiBjb2wsIGZpbGVcbiAgICAgICAgICAgICAgICB3aGVuICdweG0nXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBzbGFzaC53aW4oKVxuICAgICAgICAgICAgICAgICAgICAgICAgQGNvbnZlcnRQWE0gcm93XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEBmaWxlSW5mb0NvbHVtbiBjb2wsIGZpbGVcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGlmIEZpbGUuaXNUZXh0IGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgQGxvYWRTb3VyY2VJdGVtIGl0ZW0sIGNvbFxuICAgICAgICAgICAgICAgICAgICBpZiBub3QgRmlsZS5pc0NvZGUgaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBAZmlsZUluZm9Db2x1bW4gY29sLCBmaWxlXG5cbiAgICAgICAgcG9zdC5lbWl0ICdsb2FkJyBjb2x1bW46Y29sLCBpdGVtOml0ZW1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuXG4gICAgaW1hZ2VJbmZvQ29sdW1uOiAoY29sLCBmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgQGNvbHVtbnNbY29sXS5jcnVtYi5oaWRlKClcbiAgICAgICAgQGNvbHVtbnNbY29sXS50YWJsZS5hcHBlbmRDaGlsZCBJbmZvLmltYWdlIGZpbGVcbiAgICAgICAgXG4gICAgZmlsZUluZm9Db2x1bW46IChjb2wsIGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBAY29sdW1uc1tjb2xdLmNydW1iLmhpZGUoKVxuICAgICAgICBAY29sdW1uc1tjb2xdLnRhYmxlLmFwcGVuZENoaWxkIEluZm8uZmlsZSBmaWxlXG4gICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBvbkZpbGVJbmRleGVkOiAoZmlsZSwgaW5mbykgPT5cbiBcbiAgICAgICAgIyBrbG9nICdvbkZpbGVJbmRleGVkJyBmaWxlXG4gICAgICAgIFxuICAgICAgICBAc3JjQ2FjaGVbZmlsZV0gPSBpbmZvXG4gXG4gICAgICAgIGlmIGZpbGUgPT0gQGxhc3RVc2VkQ29sdW1uKCk/LnBhcmVudD8uZmlsZVxuICAgICAgICAgICAgQGxvYWRTb3VyY2VJdGVtIHsgZmlsZTpmaWxlLCB0eXBlOidmaWxlJyB9LCBAbGFzdFVzZWRDb2x1bW4oKT8uaW5kZXhcbiAgICAgICAgICAgICBcbiAgICBsb2FkU291cmNlSXRlbTogKGl0ZW0sIGNvbCkgLT5cblxuICAgICAgICBpZiBub3QgQHNyY0NhY2hlW2l0ZW0uZmlsZV0/XG5cbiAgICAgICAgICAgIEBzcmNDYWNoZVtpdGVtLmZpbGVdID0gcG9zdC5nZXQgJ2luZGV4ZXInICdmaWxlJyBpdGVtLmZpbGVcblxuICAgICAgICBpbmZvID0gQHNyY0NhY2hlW2l0ZW0uZmlsZV1cblxuICAgICAgICBpZiBlbXB0eSBpbmZvXG4gICAgICAgICAgICBAY29sdW1uc1tjb2xdLmxvYWRJdGVtcyBbXSwgaXRlbVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgaXRlbXMgPSBbXVxuICAgICAgICBjbHNzcyA9IGluZm8uY2xhc3NlcyA/IFtdXG4gICAgICAgIGZvciBjbHNzIGluIGNsc3NzXG4gICAgICAgICAgICB0ZXh0ID0gJ+KXjyAnK2Nsc3MubmFtZVxuICAgICAgICAgICAgaXRlbXMucHVzaCBuYW1lOmNsc3MubmFtZSwgdGV4dDp0ZXh0LCB0eXBlOidjbGFzcycsIGZpbGU6aXRlbS5maWxlLCBsaW5lOmNsc3MubGluZVxuXG4gICAgICAgIGZ1bmNzID0gaW5mby5mdW5jcyA/IFtdXG4gICAgICAgIGZvciBmdW5jIGluIGZ1bmNzXG4gICAgICAgICAgICBpZiBmdW5jLnRlc3QgPT0gJ2Rlc2NyaWJlJ1xuICAgICAgICAgICAgICAgIHRleHQgPSAn4pePICcrZnVuYy5uYW1lXG4gICAgICAgICAgICBlbHNlIGlmIGZ1bmMuc3RhdGljXG4gICAgICAgICAgICAgICAgdGV4dCA9ICcgIOKXhiAnK2Z1bmMubmFtZVxuICAgICAgICAgICAgZWxzZSBpZiBmdW5jLnBvc3RcbiAgICAgICAgICAgICAgICB0ZXh0ID0gJyAg4qyiICcrZnVuYy5uYW1lXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdGV4dCA9ICcgIOKWuCAnK2Z1bmMubmFtZVxuICAgICAgICAgICAgaXRlbXMucHVzaCBuYW1lOmZ1bmMubmFtZSwgdGV4dDp0ZXh0LCB0eXBlOidmdW5jJywgZmlsZTppdGVtLmZpbGUsIGxpbmU6ZnVuYy5saW5lXG5cbiAgICAgICAgaWYgdmFsaWQgaXRlbXNcbiAgICAgICAgICAgIGl0ZW1zLnNvcnQgKGEsYikgLT4gYS5saW5lIC0gYi5saW5lXG4gICAgICAgICAgICBAY29sdW1uc1tjb2xdLmxvYWRJdGVtcyBpdGVtcywgaXRlbVxuICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBvbkRpckNoYW5nZWQ6IChpbmZvKSA9PlxuIFxuICAgICAgICAjIGtsb2cgJ29uRGlyQ2hhbmdlZCcgaW5mby5jaGFuZ2UsIGluZm8uZGlyLCBpbmZvLnBhdGhcbiAgICAgICAgZm9yIGNvbHVtbiBpbiBAY29sdW1uc1xuICAgICAgICAgICAgaWYgY29sdW1uLnBhdGgoKSA9PSBpbmZvLmRpclxuICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbSB7ZmlsZTppbmZvLmRpciwgdHlwZTonZGlyJ30sIGNvbHVtbi5pbmRleCwgYWN0aXZlOmNvbHVtbi5hY3RpdmVQYXRoKCksIGZvY3VzOmZhbHNlXG4gICAgICAgICAgICBpZiBjb2x1bW4ucGF0aCgpID09IGluZm8ucGF0aCBhbmQgaW5mby5jaGFuZ2UgPT0gJ3JlbW92ZSdcbiAgICAgICAgICAgICAgICBjb2x1bW4uY2xlYXIoKVxuICAgIFxuICAgIGxvYWREaXJJdGVtOiAoaXRlbSwgY29sPTAsIG9wdD17fSkgLT5cblxuICAgICAgICByZXR1cm4gaWYgY29sID4gMCBhbmQgaXRlbS5uYW1lID09ICcvJ1xuXG4gICAgICAgIGRpciA9IGl0ZW0uZmlsZVxuXG4gICAgICAgICMgaWYgQHNraXBPbkRibENsaWNrXG4gICAgICAgICAgICAjIGtsb2cgJ2xvYWREaXJJdGVtIHNraXAnIGNvbCwgZGlyXG4gICAgICAgICAgICAjIGRlbGV0ZSBAc2tpcE9uRGJsQ2xpY2tcbiAgICAgICAgICAgICMgcmV0dXJuIFxuICAgICAgICBcbiAgICAgICAgIyBvcHQuaWdub3JlSGlkZGVuID0gbm90IHdpbmRvdy5zdGF0ZS5nZXQgXCJicm93c2VyfHNob3dIaWRkZW58I3tkaXJ9XCJcbiAgICAgICAgb3B0Lmlnbm9yZUhpZGRlbiA9IG5vdCBwcmVmcy5nZXQgXCJicm93c2Vy4pa4c2hvd0hpZGRlbuKWuCN7ZGlyfVwiXG4gICAgICAgIHNsYXNoLmxpc3QgZGlyLCBvcHQsIChpdGVtcykgPT5cbiAgICAgICAgICAgIHBvc3QudG9NYWluICdkaXJMb2FkZWQnIGRpclxuICAgICAgICAgICAgQGxvYWREaXJJdGVtcyBkaXIsIGl0ZW0sIGl0ZW1zLCBjb2wsIG9wdFxuICAgICAgICAgICAgcG9zdC5lbWl0ICdkaXInIGRpclxuICAgICAgICAgICAgICAgIFxuICAgIGxvYWREaXJJdGVtczogKGRpciwgaXRlbSwgaXRlbXMsIGNvbCwgb3B0KSA9PlxuICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAjIGtsb2cgJ2xvYWREaXJJdGVtcycgY29sLCBkaXJcbiAgICAgICAgaWYgQHNraXBPbkRibENsaWNrIGFuZCBjb2wgPiAwXG4gICAgICAgICAgICBkZWxldGUgQHNraXBPbkRibENsaWNrXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIHdoaWxlIGNvbCA+PSBAbnVtQ29scygpXG4gICAgICAgICAgICBAYWRkQ29sdW1uKClcbiAgICAgICAgXG4gICAgICAgIEBjb2x1bW5zW2NvbF0ubG9hZEl0ZW1zIGl0ZW1zLCBpdGVtXG5cbiAgICAgICAgcG9zdC5lbWl0ICdsb2FkJyBjb2x1bW46Y29sLCBpdGVtOml0ZW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgb3B0LmFjdGl2YXRlXG4gICAgICAgICAgICBpZiByb3cgPSBAY29sdW1uc1tjb2xdLnJvdyBzbGFzaC5maWxlIG9wdC5hY3RpdmF0ZVxuICAgICAgICAgICAgICAgIHJvdy5hY3RpdmF0ZSgpXG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdsb2FkJyBjb2x1bW46Y29sKzEgaXRlbTpyb3cuaXRlbVxuICAgICAgICBlbHNlIGlmIG9wdC5hY3RpdmVcbiAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0ucm93KHNsYXNoLmZpbGUgb3B0LmFjdGl2ZSk/LnNldEFjdGl2ZSgpXG4gICAgICAgIFxuICAgICAgICBAZ2V0R2l0U3RhdHVzIGl0ZW0sIGNvbFxuICAgICAgICBcbiAgICAgICAgaWYgb3B0LmZvY3VzICE9IGZhbHNlIGFuZCBlbXB0eShkb2N1bWVudC5hY3RpdmVFbGVtZW50KSBhbmQgZW1wdHkoJCgnLnBvcHVwJyk/Lm91dGVySFRNTClcbiAgICAgICAgICAgIGlmIGxhc3RDb2x1bW4gPSBAbGFzdERpckNvbHVtbigpXG4gICAgICAgICAgICAgICAga2xvZyAnbG9hZERpckl0ZW1zIGxhc3RDb2x1bW4uZm9jdXMnXG4gICAgICAgICAgICAgICAgbGFzdENvbHVtbi5mb2N1cygpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIG9wdC5jYj8gY29sdW1uOmNvbCwgaXRlbTppdGVtXG5cbiAgICAgICAgaWYgY29sID49IDIgYW5kIEBjb2x1bW5zWzBdLndpZHRoKCkgPCAyNTBcbiAgICAgICAgICAgIEBjb2x1bW5zWzFdLm1ha2VSb290KClcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgaW5pdENvbHVtbnM6IC0+XG5cbiAgICAgICAgc3VwZXIoKVxuXG4gICAgICAgIEB2aWV3Lmluc2VydEJlZm9yZSBAc2hlbGYuZGl2LCBAdmlldy5maXJzdENoaWxkXG4gICAgICAgIEB2aWV3Lmluc2VydEJlZm9yZSBAc2hlbGZSZXNpemUsIG51bGxcblxuICAgICAgICBAc2hlbGYuYnJvd3NlckRpZEluaXRDb2x1bW5zKClcblxuICAgICAgICBAc2V0U2hlbGZTaXplIEBzaGVsZlNpemVcblxuICAgIGNvbHVtbkF0UG9zOiAocG9zKSAtPlxuXG4gICAgICAgIGlmIGNvbHVtbiA9IHN1cGVyIHBvc1xuICAgICAgICAgICAgcmV0dXJuIGNvbHVtblxuXG4gICAgICAgIGlmIGVsZW0uY29udGFpbnNQb3MgQHNoZWxmLmRpdiwgcG9zXG4gICAgICAgICAgICByZXR1cm4gQHNoZWxmXG4gICAgICAgICAgICBcbiAgICBsYXN0Q29sdW1uUGF0aDogLT5cblxuICAgICAgICBpZiBsYXN0Q29sdW1uID0gQGxhc3RVc2VkQ29sdW1uKClcbiAgICAgICAgICAgIHJldHVybiBsYXN0Q29sdW1uLnBhdGgoKVxuXG4gICAgbGFzdERpckNvbHVtbjogLT5cblxuICAgICAgICBpZiBsYXN0Q29sdW1uID0gQGxhc3RVc2VkQ29sdW1uKClcbiAgICAgICAgICAgIGlmIGxhc3RDb2x1bW4uaXNEaXIoKVxuICAgICAgICAgICAgICAgIHJldHVybiBsYXN0Q29sdW1uXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW4ucHJldkNvbHVtbigpXG5cbiAgICBsYXN0RGlyT3JTcmNDb2x1bW46IC0+XG5cbiAgICAgICAgaWYgbGFzdENvbHVtbiA9IEBsYXN0VXNlZENvbHVtbigpXG4gICAgICAgICAgICBpZiBsYXN0Q29sdW1uLmlzRGlyKCkgb3IgbGFzdENvbHVtbi5pc1NyYygpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW5cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtbi5wcmV2Q29sdW1uKClcbiAgICAgICAgICAgICAgICBcbiAgICBvbkJhY2tzcGFjZUluQ29sdW1uOiAoY29sdW1uKSAtPlxuXG4gICAgICAgIGNvbHVtbi5iYWNrc3BhY2VTZWFyY2goKVxuICAgICAgICBcbiAgICBvbkRlbGV0ZUluQ29sdW1uOiAoY29sdW1uKSAtPiBcbiAgICBcbiAgICAgICAgaWYgY29sdW1uLnNlYXJjaERpdlxuICAgICAgICAgICAgY29sdW1uLmNsZWFyU2VhcmNoKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29sdW1uLm1vdmVUb1RyYXNoKClcbiAgICAgICAgXG4gICAgdXBkYXRlQ29sdW1uU2Nyb2xsczogPT5cblxuICAgICAgICBzdXBlcigpXG4gICAgICAgIEBzaGVsZj8uc2Nyb2xsLnVwZGF0ZSgpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbiAgICBnZXRHaXRTdGF0dXM6IChpdGVtLCBjb2wpID0+XG5cbiAgICAgICAgZmlsZSA9IGl0ZW0uZmlsZSA/IGl0ZW0ucGFyZW50Py5maWxlXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBmaWxlXG5cbiAgICAgICAgaHViLnN0YXR1cyBmaWxlLCAoc3RhdHVzKSA9PiBAYXBwbHlHaXRTdGF0dXNGaWxlcyBjb2wsIGh1Yi5zdGF0dXNGaWxlcyBzdGF0dXNcblxuICAgIGFwcGx5R2l0U3RhdHVzRmlsZXM6IChjb2wsIGZpbGVzKSA9PlxuXG4gICAgICAgIEBjb2x1bW5zW2NvbF0/LnVwZGF0ZUdpdEZpbGVzIGZpbGVzXG5cbiAgICBvbkdpdFN0YXR1czogKGdpdERpciwgc3RhdHVzKSA9PlxuXG4gICAgICAgIGZpbGVzID0gaHViLnN0YXR1c0ZpbGVzIHN0YXR1c1xuICAgICAgICBmb3IgY29sIGluIFswLi5AY29sdW1ucy5sZW5ndGhdXG4gICAgICAgICAgICBAYXBwbHlHaXRTdGF0dXNGaWxlcyBjb2wsIGZpbGVzXG5cbiAgICAgICAgQHNoZWxmPy51cGRhdGVHaXRGaWxlcyBmaWxlc1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgICAgICBcblxuICAgIG9uU2hlbGZEcmFnOiAoZHJhZywgZXZlbnQpID0+XG5cbiAgICAgICAgc2hlbGZTaXplID0gY2xhbXAgMCwgNDAwLCBkcmFnLnBvcy54XG4gICAgICAgIEBzZXRTaGVsZlNpemUgc2hlbGZTaXplXG5cbiAgICBzZXRTaGVsZlNpemU6IChAc2hlbGZTaXplKSAtPlxuXG4gICAgICAgIHdpbmRvdy5zdGF0ZS5zZXQgJ3NoZWxmfHNpemUnIEBzaGVsZlNpemVcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmxlZnQgPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEBzaGVsZi5kaXYuc3R5bGUud2lkdGggPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEBjb2xzLnN0eWxlLmxlZnQgPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcbiAgICBcbiAgICB0b2dnbGVTaGVsZjogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBzaGVsZlNpemUgPCAxXG4gICAgICAgICAgICBAc2V0U2hlbGZTaXplIDIwMFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBrbG9nICd0b2dnbGVTaGVsZiBsYXN0VXNlZENvbHVtbi5mb2N1cydcbiAgICAgICAgICAgIEBsYXN0VXNlZENvbHVtbigpPy5mb2N1cygpXG4gICAgICAgICAgICBAc2V0U2hlbGZTaXplIDBcbiAgICAgICAgICAgIFxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBGaWxlQnJvd3NlclxuIl19
//# sourceURL=../../coffee/browser/filebrowser.coffee