// koffee 1.12.0

/*
00000000  000  000      00000000        0000000    00000000    0000000   000   000   0000000  00000000  00000000
000       000  000      000             000   000  000   000  000   000  000 0 000  000       000       000   000
000000    000  000      0000000         0000000    0000000    000   000  000000000  0000000   0000000   0000000
000       000  000      000             000   000  000   000  000   000  000   000       000  000       000   000
000       000  0000000  00000000        0000000    000   000   0000000   00     00  0000000   00000000  000   000
 */
var $, Browser, File, FileBrowser, Select, Shelf, clamp, dirCache, drag, elem, empty, filelist, hub, klog, moment, open, pbytes, post, ref, slash, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), $ = ref.$, clamp = ref.clamp, drag = ref.drag, elem = ref.elem, empty = ref.empty, filelist = ref.filelist, klog = ref.klog, open = ref.open, post = ref.post, slash = ref.slash, valid = ref.valid;

Browser = require('./browser');

Shelf = require('./shelf');

Select = require('./select');

File = require('../tools/file');

dirCache = require('../tools/dircache');

hub = require('../git/hub');

pbytes = require('pretty-bytes');

moment = require('moment');

FileBrowser = (function(superClass) {
    extend(FileBrowser, superClass);

    function FileBrowser(view) {
        this.refresh = bind(this.refresh, this);
        this.onGitStatus = bind(this.onGitStatus, this);
        this.applyGitStatusFiles = bind(this.applyGitStatusFiles, this);
        this.getGitStatus = bind(this.getGitStatus, this);
        this.onShelfDrag = bind(this.onShelfDrag, this);
        this.updateColumnScrolls = bind(this.updateColumnScrolls, this);
        this.onOpenFile = bind(this.onOpenFile, this);
        this.onFile = bind(this.onFile, this);
        this.loadDirItems = bind(this.loadDirItems, this);
        this.onFileIndexed = bind(this.onFileIndexed, this);
        this.onDirCache = bind(this.onDirCache, this);
        this.onFileBrowser = bind(this.onFileBrowser, this);
        this.navigateToFile = bind(this.navigateToFile, this);
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
        post.on('openFile', this.onOpenFile);
        post.on('navigateToFile', this.navigateToFile);
        post.on('gitStatus', this.onGitStatus);
        post.on('fileIndexed', this.onFileIndexed);
        post.on('dircache', this.onDirCache);
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
                        return function(source, target) {
                            var sourceColumn, targetColumn;
                            if (sourceColumn = _this.columnForFile(source)) {
                                sourceColumn.removeFile(source);
                            }
                            if (targetColumn = _this.columnForFile(target)) {
                                if (!targetColumn.row(target)) {
                                    return targetColumn.insertFile(target);
                                }
                            }
                        };
                    })(this)));
                    break;
                case 'copy':
                    results.push(File.copy(source, target, (function(_this) {
                        return function(source, target) {
                            var targetColumn;
                            if (targetColumn = _this.columnForFile(target)) {
                                if (!targetColumn.row(target)) {
                                    return targetColumn.insertFile(target);
                                }
                            }
                        };
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

    FileBrowser.prototype.closeViewer = function() {
        var ref1;
        return (ref1 = this.viewer) != null ? ref1.close() : void 0;
    };

    FileBrowser.prototype.browse = function(file, opt) {
        this.closeViewer();
        if (file) {
            return this.loadItem(this.fileItem(file), opt);
        }
    };

    FileBrowser.prototype.navigateToFile = function(file) {
        var col, i, index, item, lastPath, opt, paths, ref1, ref2, row;
        this.closeViewer();
        lastPath = (ref1 = this.lastDirColumn()) != null ? ref1.path() : void 0;
        file = slash.path(file);
        klog('navigateToFile', file, lastPath, this.lastColumnPath());
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
            return (ref2 = this.columns[0]) != null ? ref2.focus() : void 0;
        }
    };

    FileBrowser.prototype.activateItem = function(item, col) {
        klog('activateItem', item.file);
        this.clearColumnsFrom(col + 2, {
            pop: true
        });
        switch (item.type) {
            case 'dir':
                return this.loadDirItem(item, col + 1);
            case 'file':
                this.loadFileItem(item, col + 1);
                if (item.textFile || File.isText(item.file)) {
                    klog('activateItem jumpToFile', item.file);
                    return post.emit('jumpToFile', item);
                }
        }
    };

    FileBrowser.prototype.loadFileItem = function(item, col) {
        var file;
        if (col == null) {
            col = 0;
        }
        klog('loadFileItem', col, item.file);
        this.clearColumnsFrom(col, {
            pop: true
        });
        while (col >= this.numCols()) {
            this.addColumn();
        }
        file = item.file;
        this.columns[col].parent = item;
        if (File.isImage(file)) {
            this.columns[col].table.appendChild(this.imageInfo(file));
        } else {
            switch (slash.ext(file)) {
                case 'tiff':
                case 'tif':
                    if (!slash.win()) {
                        this.convertImage(row);
                    } else {
                        this.columns[col].table.appendChild(this.fileInfo(file));
                    }
                    break;
                case 'pxm':
                    if (!slash.win()) {
                        this.convertPXM(row);
                    } else {
                        this.columns[col].table.appendChild(this.fileInfo(file));
                    }
                    break;
                default:
                    if (File.isText(item.file)) {
                        this.loadSourceItem(item, col);
                    }
                    if (!File.isClass(item.file)) {
                        this.columns[col].table.appendChild(this.fileInfo(file));
                    }
            }
        }
        post.emit('load', {
            column: col,
            item: item
        });
        return this.updateColumnScrolls();
    };

    FileBrowser.prototype.imageInfo = function(file) {
        var cnt, img;
        klog('imageInfo', file);
        img = elem('img', {
            "class": 'browserImage',
            src: slash.fileUrl(file)
        });
        cnt = elem({
            "class": 'browserImageContainer',
            child: img
        });
        cnt.addEventListener('dblclick', (function(_this) {
            return function() {
                clearTimeout(_this.openViewerTimer);
                return open(file);
            };
        })(this));
        cnt.addEventListener('click', (function(_this) {
            return function() {
                clearTimeout(_this.openViewerTimer);
                return _this.openViewerTimer = setTimeout((function() {
                    var ref1;
                    return (ref1 = _this.lastDirColumn()) != null ? ref1.openViewer() : void 0;
                }), 500);
            };
        })(this));
        img.onload = function() {
            var age, br, height, html, info, num, range, ref1, size, stat, width, x;
            img = $('.browserImage');
            br = img.getBoundingClientRect();
            x = img.clientX;
            width = parseInt(br.right - br.left - 2);
            height = parseInt(br.bottom - br.top - 2);
            img.style.opacity = '1';
            img.style.maxWidth = '100%';
            stat = slash.fileExists(file);
            size = pbytes(stat.size).split(' ');
            age = moment().to(moment(stat.mtime), true);
            ref1 = age.split(' '), num = ref1[0], range = ref1[1];
            if (num[0] === 'a') {
                num = '1';
            }
            html = "<tr><th colspan=2>" + width + "<span class='punct'>x</span>" + height + "</th></tr>";
            html += "<tr><th>" + size[0] + "</th><td>" + size[1] + "</td></tr>";
            html += "<tr><th>" + num + "</th><td>" + range + "</td></tr>";
            info = elem({
                "class": 'browserFileInfo',
                children: [
                    elem('div', {
                        "class": "fileInfoFile " + (slash.ext(file)),
                        html: File.span(file)
                    }), elem('table', {
                        "class": "fileInfoData",
                        html: html
                    })
                ]
            });
            cnt = $('.browserImageContainer');
            return cnt.appendChild(info);
        };
        return cnt;
    };

    FileBrowser.prototype.fileInfo = function(file) {
        var age, info, num, range, ref1, size, stat, t;
        klog('fileInfo', file);
        stat = slash.fileExists(file);
        size = pbytes(stat.size).split(' ');
        t = moment(stat.mtime);
        age = moment().to(t, true);
        ref1 = age.split(' '), num = ref1[0], range = ref1[1];
        if (num[0] === 'a') {
            num = '1';
        }
        if (range === 'few') {
            num = moment().diff(t, 'seconds');
            range = 'seconds';
        }
        info = elem({
            "class": 'browserFileInfo',
            children: [
                elem('div', {
                    "class": "fileInfoIcon " + (slash.ext(file)) + " " + (File.iconClassName(file))
                }), elem('div', {
                    "class": "fileInfoFile " + (slash.ext(file)),
                    html: File.span(file)
                }), elem('table', {
                    "class": "fileInfoData",
                    html: "<tr><th>" + size[0] + "</th><td>" + size[1] + "</td></tr><tr><th>" + num + "</th><td>" + range + "</td></tr>"
                })
            ]
        });
        info.addEventListener('dblclick', (function(_this) {
            return function() {
                clearTimeout(_this.openViewerTimer);
                return open(file);
            };
        })(this));
        info.addEventListener('click', (function(_this) {
            return function() {
                clearTimeout(_this.openViewerTimer);
                return _this.openViewerTimer = setTimeout((function() {
                    var ref2;
                    return (ref2 = _this.lastDirColumn()) != null ? ref2.openViewer() : void 0;
                }), 500);
            };
        })(this));
        return info;
    };

    FileBrowser.prototype.onDirCache = function(dir) {
        var column, i, len, ref1;
        ref1 = this.columns;
        for (i = 0, len = ref1.length; i < len; i++) {
            column = ref1[i];
            if (column.path() === dir) {
                this.loadDirItem({
                    file: dir,
                    type: 'dir'
                }, column.index, {
                    active: column.activePath()
                });
                return;
            }
        }
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
        if (dirCache.has(dir) && !opt.ignoreCache) {
            this.loadDirItems(dir, item, dirCache.get(dir), col, opt);
            return post.emit('dir', dir);
        } else {
            opt.ignoreHidden = !window.state.get("browser|showHidden|" + dir);
            opt.textTest = true;
            return slash.list(dir, opt, (function(_this) {
                return function(items) {
                    post.toMain('dirLoaded', dir);
                    dirCache.set(dir, items);
                    _this.loadDirItems(dir, item, items, col, opt);
                    return post.emit('dir', dir);
                };
            })(this));
        }
    };

    FileBrowser.prototype.loadDirItems = function(dir, item, items, col, opt) {
        var lastColumn, ref1, ref2, ref3, ref4, ref5, row, updir;
        this.updateColumnScrolls();
        updir = slash.resolve(slash.join(dir, '..'));
        if (col === 0 || col - 1 < this.numCols() && ((ref1 = this.columns[col - 1].activeRow()) != null ? ref1.item.name : void 0) === '..') {
            if ((ref2 = (ref3 = items[0]) != null ? ref3.name : void 0) !== '..' && ref2 !== '/') {
                if (updir !== dir) {
                    items.unshift({
                        name: '..',
                        type: 'dir',
                        file: updir
                    });
                }
            }
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
            if ((ref4 = this.columns[col].row(slash.file(opt.active))) != null) {
                ref4.setActive();
            }
        }
        this.getGitStatus(item, col);
        if (opt.focus !== false && empty(document.activeElement) && empty((ref5 = $('.popup')) != null ? ref5.outerHTML : void 0)) {
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

    FileBrowser.prototype.onFile = function(file) {
        klog('onFile', file);
        if (!file) {
            return;
        }
        if (!this.flex) {
            return;
        }
        return this.navigateToFile(file);
    };

    FileBrowser.prototype.onOpenFile = function(file) {
        return open(file);
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

    FileBrowser.prototype.toggleShelf = function() {
        var ref1;
        if (this.shelfSize < 1) {
            this.setShelfSize(200);
        } else {
            if ((ref1 = this.lastUsedColumn()) != null) {
                ref1.focus();
            }
            this.setShelfSize(0);
        }
        return this.updateColumnScrolls();
    };

    FileBrowser.prototype.refresh = function() {
        var ref1, ref2;
        hub.refresh();
        dirCache.reset();
        this.srcCache = {};
        if (this.lastUsedColumn()) {
            klog('refresh', (ref1 = this.lastUsedColumn()) != null ? ref1.path() : void 0);
            return this.navigateToFile((ref2 = this.lastUsedColumn()) != null ? ref2.path() : void 0);
        }
    };

    return FileBrowser;

})(Browser);

module.exports = FileBrowser;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWJyb3dzZXIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2Jyb3dzZXIiLCJzb3VyY2VzIjpbImZpbGVicm93c2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxvSkFBQTtJQUFBOzs7O0FBUUEsTUFBNEUsT0FBQSxDQUFRLEtBQVIsQ0FBNUUsRUFBRSxTQUFGLEVBQUssaUJBQUwsRUFBWSxlQUFaLEVBQWtCLGVBQWxCLEVBQXdCLGlCQUF4QixFQUErQix1QkFBL0IsRUFBeUMsZUFBekMsRUFBK0MsZUFBL0MsRUFBcUQsZUFBckQsRUFBMkQsaUJBQTNELEVBQWtFOztBQUVsRSxPQUFBLEdBQVcsT0FBQSxDQUFRLFdBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxTQUFSOztBQUNYLE1BQUEsR0FBVyxPQUFBLENBQVEsVUFBUjs7QUFDWCxJQUFBLEdBQVcsT0FBQSxDQUFRLGVBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxtQkFBUjs7QUFDWCxHQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBQ1gsTUFBQSxHQUFXLE9BQUEsQ0FBUSxjQUFSOztBQUNYLE1BQUEsR0FBVyxPQUFBLENBQVEsUUFBUjs7QUFFTDs7O0lBRUMscUJBQUMsSUFBRDs7Ozs7Ozs7Ozs7Ozs7O1FBRUMsNkNBQU0sSUFBTjtRQUVBLE1BQU0sQ0FBQyxXQUFQLEdBQXFCO1FBRXJCLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsS0FBRCxHQUFVLElBQUksS0FBSixDQUFVLElBQVY7UUFDVixJQUFDLENBQUEsTUFBRCxHQUFVLElBQUksTUFBSixDQUFXLElBQVg7UUFDVixJQUFDLENBQUEsSUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLFFBQUQsR0FBWTtRQUVaLElBQUksQ0FBQyxFQUFMLENBQVEsTUFBUixFQUF5QixJQUFDLENBQUEsTUFBMUI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFFBQVIs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QUFDLE1BQUQsRUFBUyxNQUFUO0FBRVQsWUFBQTtRQUFBLEtBQUEsR0FBUSxHQUFHLENBQUMsV0FBSixDQUFnQixNQUFoQjtBQUNSLGFBQVcsdUdBQVg7WUFDSSxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsR0FBckIsRUFBMEIsS0FBMUI7QUFESjtpREFHTSxDQUFFLGNBQVIsQ0FBdUIsS0FBdkI7SUFOUzs7MEJBY2IsV0FBQSxHQUFhLFNBQUE7QUFFVCxZQUFBO1FBQUEsSUFBRyxJQUFDLENBQUEsU0FBRCxHQUFhLENBQWhCO1lBQ0ksSUFBQyxDQUFBLFlBQUQsQ0FBYyxHQUFkLEVBREo7U0FBQSxNQUFBOztvQkFHcUIsQ0FBRSxLQUFuQixDQUFBOztZQUNBLElBQUMsQ0FBQSxZQUFELENBQWMsQ0FBZCxFQUpKOztlQU1BLElBQUMsQ0FBQSxtQkFBRCxDQUFBO0lBUlM7OzBCQVViLE9BQUEsR0FBUyxTQUFBO0FBRUwsWUFBQTtRQUFBLEdBQUcsQ0FBQyxPQUFKLENBQUE7UUFDQSxRQUFRLENBQUMsS0FBVCxDQUFBO1FBQ0EsSUFBQyxDQUFBLFFBQUQsR0FBWTtRQUVaLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBQSxDQUFIO1lBQ0ksSUFBQSxDQUFLLFNBQUwsK0NBQWdDLENBQUUsSUFBbkIsQ0FBQSxVQUFmO21CQUNBLElBQUMsQ0FBQSxjQUFELDhDQUFpQyxDQUFFLElBQW5CLENBQUEsVUFBaEIsRUFGSjs7SUFOSzs7OztHQWhtQmE7O0FBMG1CMUIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgJCwgY2xhbXAsIGRyYWcsIGVsZW0sIGVtcHR5LCBmaWxlbGlzdCwga2xvZywgb3BlbiwgcG9zdCwgc2xhc2gsIHZhbGlkIH0gPSByZXF1aXJlICdreGsnXG5cbkJyb3dzZXIgID0gcmVxdWlyZSAnLi9icm93c2VyJ1xuU2hlbGYgICAgPSByZXF1aXJlICcuL3NoZWxmJ1xuU2VsZWN0ICAgPSByZXF1aXJlICcuL3NlbGVjdCdcbkZpbGUgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvZmlsZSdcbmRpckNhY2hlID0gcmVxdWlyZSAnLi4vdG9vbHMvZGlyY2FjaGUnXG5odWIgICAgICA9IHJlcXVpcmUgJy4uL2dpdC9odWInXG5wYnl0ZXMgICA9IHJlcXVpcmUgJ3ByZXR0eS1ieXRlcydcbm1vbWVudCAgID0gcmVxdWlyZSAnbW9tZW50J1xuXG5jbGFzcyBGaWxlQnJvd3NlciBleHRlbmRzIEJyb3dzZXJcblxuICAgIEA6ICh2aWV3KSAtPlxuXG4gICAgICAgIHN1cGVyIHZpZXdcblxuICAgICAgICB3aW5kb3cuZmlsZWJyb3dzZXIgPSBAXG5cbiAgICAgICAgQGxvYWRJRCA9IDBcbiAgICAgICAgQHNoZWxmICA9IG5ldyBTaGVsZiBAXG4gICAgICAgIEBzZWxlY3QgPSBuZXcgU2VsZWN0IEBcbiAgICAgICAgQG5hbWUgICA9ICdGaWxlQnJvd3NlcidcbiAgICAgICAgQHNyY0NhY2hlID0ge31cbiAgICAgICAgXG4gICAgICAgIHBvc3Qub24gJ2ZpbGUnICAgICAgICAgICBAb25GaWxlXG4gICAgICAgIHBvc3Qub24gJ2Jyb3dzZScgICAgICAgICBAYnJvd3NlXG4gICAgICAgIHBvc3Qub24gJ2ZpbGVicm93c2VyJyAgICBAb25GaWxlQnJvd3NlclxuICAgICAgICBwb3N0Lm9uICdvcGVuRmlsZScgICAgICAgQG9uT3BlbkZpbGVcbiAgICAgICAgcG9zdC5vbiAnbmF2aWdhdGVUb0ZpbGUnIEBuYXZpZ2F0ZVRvRmlsZVxuXG4gICAgICAgIHBvc3Qub24gJ2dpdFN0YXR1cycgICAgICBAb25HaXRTdGF0dXNcbiAgICAgICAgcG9zdC5vbiAnZmlsZUluZGV4ZWQnICAgIEBvbkZpbGVJbmRleGVkXG4gICAgICAgIHBvc3Qub24gJ2RpcmNhY2hlJyAgICAgICBAb25EaXJDYWNoZVxuICAgICAgICBcbiAgICAgICAgQHNoZWxmUmVzaXplID0gZWxlbSAnZGl2JyBjbGFzczogJ3NoZWxmUmVzaXplJ1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS50b3AgICAgICA9ICcwcHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5ib3R0b20gICA9ICcwcHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5sZWZ0ICAgICA9ICcxOTRweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLndpZHRoICAgID0gJzZweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmN1cnNvciAgID0gJ2V3LXJlc2l6ZSdcblxuICAgICAgICBAZHJhZyA9IG5ldyBkcmFnXG4gICAgICAgICAgICB0YXJnZXQ6ICBAc2hlbGZSZXNpemVcbiAgICAgICAgICAgIG9uTW92ZTogIEBvblNoZWxmRHJhZ1xuXG4gICAgICAgIEBzaGVsZlNpemUgPSB3aW5kb3cuc3RhdGUuZ2V0ICdzaGVsZnxzaXplJyAyMDBcblxuICAgICAgICBAaW5pdENvbHVtbnMoKVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBkcm9wQWN0aW9uOiAoYWN0aW9uLCBzb3VyY2VzLCB0YXJnZXQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBzbGFzaC5pc0ZpbGUgdGFyZ2V0XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRhcmdldCA9IHNsYXNoLmRpciB0YXJnZXRcbiAgICAgICAgXG4gICAgICAgIGZvciBzb3VyY2UgaW4gc291cmNlc1xuICAgICAgICBcbiAgICAgICAgICAgIGlmIGFjdGlvbiA9PSAnbW92ZScgXG4gICAgICAgICAgICAgICAgaWYgc291cmNlID09IHRhcmdldCBvciBzbGFzaC5kaXIoc291cmNlKSA9PSB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAga2xvZyAnbm9vcCcgc291cmNlLCB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgZm9yIHNvdXJjZSBpbiBzb3VyY2VzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN3aXRjaCBhY3Rpb25cbiAgICAgICAgICAgICAgICB3aGVuICdtb3ZlJ1xuICAgICAgICAgICAgICAgICAgICBGaWxlLnJlbmFtZSBzb3VyY2UsIHRhcmdldCwgKHNvdXJjZSwgdGFyZ2V0KSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgc291cmNlQ29sdW1uID0gQGNvbHVtbkZvckZpbGUgc291cmNlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZUNvbHVtbi5yZW1vdmVGaWxlIHNvdXJjZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgdGFyZ2V0Q29sdW1uID0gQGNvbHVtbkZvckZpbGUgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm90IHRhcmdldENvbHVtbi5yb3cgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldENvbHVtbi5pbnNlcnRGaWxlIHRhcmdldFxuICAgICAgICAgICAgICAgIHdoZW4gJ2NvcHknXG4gICAgICAgICAgICAgICAgICAgIEZpbGUuY29weSBzb3VyY2UsIHRhcmdldCwgKHNvdXJjZSwgdGFyZ2V0KSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgdGFyZ2V0Q29sdW1uID0gQGNvbHVtbkZvckZpbGUgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm90IHRhcmdldENvbHVtbi5yb3cgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldENvbHVtbi5pbnNlcnRGaWxlIHRhcmdldFxuICAgICAgICAgICAgICAgICAgICBcbiAgICBjb2x1bW5Gb3JGaWxlOiAoZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBjb2x1bW4gaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIGNvbHVtbi5wYXJlbnQ/LmZpbGUgPT0gc2xhc2guZGlyIGZpbGVcbiAgICAgICAgICAgICAgICByZXR1cm4gY29sdW1uXG4gICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHNoYXJlZENvbHVtbkluZGV4OiAoZmlsZSkgLT4gXG4gICAgICAgIFxuICAgICAgICBjb2wgPSAwXG4gICAgICAgIFxuICAgICAgICBmb3IgY29sdW1uIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBjb2x1bW4uaXNEaXIoKSBhbmQgZmlsZS5zdGFydHNXaXRoIGNvbHVtbi5wYXRoKClcbiAgICAgICAgICAgICAgICBjb2wgKz0gMVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNvbCA9PSAxIGFuZCBzbGFzaC5kaXIoZmlsZSkgIT0gQGNvbHVtbnNbMF0/LnBhdGgoKVxuICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgTWF0aC5tYXggLTEsIGNvbC0yXG5cbiAgICBjbG9zZVZpZXdlcjogLT4gQHZpZXdlcj8uY2xvc2UoKVxuICAgICAgICBcbiAgICBicm93c2U6IChmaWxlLCBvcHQpID0+IFxuICAgICAgICAgICAgXG4gICAgICAgIEBjbG9zZVZpZXdlcigpXG4gICAgICAgIFxuICAgICAgICBpZiBmaWxlIHRoZW4gQGxvYWRJdGVtIEBmaWxlSXRlbShmaWxlKSwgb3B0XG4gICAgICAgIFxuICAgIG5hdmlnYXRlVG9GaWxlOiAoZmlsZSkgPT5cblxuICAgICAgICBAY2xvc2VWaWV3ZXIoKVxuICAgICAgICBcbiAgICAgICAgbGFzdFBhdGggPSBAbGFzdERpckNvbHVtbigpPy5wYXRoKClcbiAgICAgICAgXG4gICAgICAgIGZpbGUgPSBzbGFzaC5wYXRoIGZpbGVcblxuICAgICAgICBrbG9nICduYXZpZ2F0ZVRvRmlsZScgZmlsZSwgbGFzdFBhdGgsIEBsYXN0Q29sdW1uUGF0aCgpXG4gICAgICAgIFxuICAgICAgICBpZiBmaWxlID09IGxhc3RQYXRoIG9yIGZpbGUgPT0gQGxhc3RDb2x1bW5QYXRoKCkgb3Igc2xhc2guaXNSZWxhdGl2ZSBmaWxlXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBjb2wgPSBAc2hhcmVkQ29sdW1uSW5kZXggZmlsZVxuICAgICAgICBcbiAgICAgICAgZmlsZWxpc3QgPSBzbGFzaC5wYXRobGlzdCBmaWxlXG4gICAgICAgIFxuICAgICAgICBpZiBjb2wgPj0gMFxuICAgICAgICAgICAgcGF0aHMgPSBmaWxlbGlzdC5zbGljZSBmaWxlbGlzdC5pbmRleE9mKEBjb2x1bW5zW2NvbF0ucGF0aCgpKSsxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHBhdGhzID0gZmlsZWxpc3Quc2xpY2UgZmlsZWxpc3QubGVuZ3RoLTJcbiAgICAgICAgICAgIFxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2wrMSwgcG9wOnRydWUgY2xlYXI6Y29sK3BhdGhzLmxlbmd0aFxuICAgICAgICBcbiAgICAgICAgd2hpbGUgQG51bUNvbHMoKSA8IHBhdGhzLmxlbmd0aFxuICAgICAgICAgICAgQGFkZENvbHVtbigpXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgZm9yIGluZGV4IGluIFswLi4ucGF0aHMubGVuZ3RoXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpdGVtID0gQGZpbGVJdGVtIHBhdGhzW2luZGV4XVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICAgICAgd2hlbiAnZmlsZScgXG4gICAgICAgICAgICAgICAgICAgICMga2xvZyAnZmlsZWJyb3dzZXIubmF2aWdhdGVUb0ZpbGUnIGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICBAbG9hZEZpbGVJdGVtIGl0ZW0sIGNvbCsxK2luZGV4XG4gICAgICAgICAgICAgICAgd2hlbiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICBvcHQgPSB7fVxuICAgICAgICAgICAgICAgICAgICBpZiBpbmRleCA8IHBhdGhzLmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHQuYWN0aXZlID0gcGF0aHNbaW5kZXgrMV1cbiAgICAgICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtIGl0ZW0sIGNvbCsxK2luZGV4LCBvcHRcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNvbCA9IEBsYXN0RGlyQ29sdW1uKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgcm93ID0gY29sLnJvdyhzbGFzaC5maWxlIGZpbGUpXG4gICAgICAgICAgICAgICAgcm93LnNldEFjdGl2ZSgpXG5cbiAgICAjIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBmaWxlSXRlbTogKHBhdGgpIC0+XG4gICAgICAgIFxuICAgICAgICBwID0gc2xhc2gucmVzb2x2ZSBwYXRoXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGZpbGU6cFxuICAgICAgICB0eXBlOnNsYXNoLmlzRmlsZShwKSBhbmQgJ2ZpbGUnIG9yICdkaXInXG4gICAgICAgIG5hbWU6c2xhc2guZmlsZSBwXG4gICAgICAgIFxuICAgIG9uRmlsZUJyb3dzZXI6IChhY3Rpb24sIGl0ZW0sIGFyZykgPT5cblxuICAgICAgICBzd2l0Y2ggYWN0aW9uXG4gICAgICAgICAgICB3aGVuICdsb2FkSXRlbScgICAgIHRoZW4gQGxvYWRJdGVtICAgICBpdGVtLCBhcmdcbiAgICAgICAgICAgIHdoZW4gJ2FjdGl2YXRlSXRlbScgdGhlbiBAYWN0aXZhdGVJdGVtIGl0ZW0sIGFyZ1xuICAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsb2FkRGlyOiAocGF0aCkgLT4gQGxvYWRJdGVtIHR5cGU6J2RpcicgZmlsZTpwYXRoXG4gICAgXG4gICAgbG9hZEl0ZW06IChpdGVtLCBvcHQpIC0+XG5cbiAgICAgICAgb3B0ID89IGFjdGl2ZTonLi4nIGZvY3VzOnRydWVcbiAgICAgICAgaXRlbS5uYW1lID89IHNsYXNoLmZpbGUgaXRlbS5maWxlXG5cbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gMSwgcG9wOnRydWUsIGNsZWFyOm9wdC5jbGVhciA/IDFcblxuICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICB3aGVuICdkaXInICB0aGVuIEBsb2FkRGlySXRlbSBpdGVtLCAwLCBvcHRcbiAgICAgICAgICAgIHdoZW4gJ2ZpbGUnIFxuICAgICAgICAgICAgICAgIG9wdC5hY3RpdmF0ZSA9IGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgIHdoaWxlIEBudW1Db2xzKCkgPCAyIHRoZW4gQGFkZENvbHVtbigpXG4gICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtIEBmaWxlSXRlbShzbGFzaC5kaXIoaXRlbS5maWxlKSksIDAsIG9wdFxuXG4gICAgICAgIGlmIG9wdC5mb2N1c1xuICAgICAgICAgICAgQGNvbHVtbnNbMF0/LmZvY3VzKClcblxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBhY3RpdmF0ZUl0ZW06IChpdGVtLCBjb2wpIC0+XG5cbiAgICAgICAga2xvZyAnYWN0aXZhdGVJdGVtJyBpdGVtLmZpbGVcbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sKzIgcG9wOnRydWVcblxuICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtICBpdGVtLCBjb2wrMVxuICAgICAgICAgICAgd2hlbiAnZmlsZSdcbiAgICAgICAgICAgICAgICBAbG9hZEZpbGVJdGVtIGl0ZW0sIGNvbCsxXG4gICAgICAgICAgICAgICAgaWYgaXRlbS50ZXh0RmlsZSBvciBGaWxlLmlzVGV4dCBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAga2xvZyAnYWN0aXZhdGVJdGVtIGp1bXBUb0ZpbGUnIGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUb0ZpbGUnIGl0ZW1cblxuICAgICMgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGxvYWRGaWxlSXRlbTogKGl0ZW0sIGNvbD0wKSAtPlxuXG4gICAgICAgIGtsb2cgJ2xvYWRGaWxlSXRlbScgY29sLCBpdGVtLmZpbGVcbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sLCBwb3A6dHJ1ZVxuXG4gICAgICAgIHdoaWxlIGNvbCA+PSBAbnVtQ29scygpXG4gICAgICAgICAgICBAYWRkQ29sdW1uKClcblxuICAgICAgICBmaWxlID0gaXRlbS5maWxlXG5cbiAgICAgICAgQGNvbHVtbnNbY29sXS5wYXJlbnQgPSBpdGVtXG4gICAgICAgIFxuICAgICAgICBpZiBGaWxlLmlzSW1hZ2UgZmlsZVxuICAgICAgICAgICAgQGNvbHVtbnNbY29sXS50YWJsZS5hcHBlbmRDaGlsZCBAaW1hZ2VJbmZvIGZpbGVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc3dpdGNoIHNsYXNoLmV4dCBmaWxlXG4gICAgICAgICAgICAgICAgd2hlbiAndGlmZicgJ3RpZidcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgICAgICAgICBAY29udmVydEltYWdlIHJvd1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAY29sdW1uc1tjb2xdLnRhYmxlLmFwcGVuZENoaWxkIEBmaWxlSW5mbyBmaWxlXG4gICAgICAgICAgICAgICAgd2hlbiAncHhtJ1xuICAgICAgICAgICAgICAgICAgICBpZiBub3Qgc2xhc2gud2luKClcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjb252ZXJ0UFhNIHJvd1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAY29sdW1uc1tjb2xdLnRhYmxlLmFwcGVuZENoaWxkIEBmaWxlSW5mbyBmaWxlXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBpZiBGaWxlLmlzVGV4dCBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIEBsb2FkU291cmNlSXRlbSBpdGVtLCBjb2xcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IEZpbGUuaXNDbGFzcyBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0udGFibGUuYXBwZW5kQ2hpbGQgQGZpbGVJbmZvIGZpbGVcblxuICAgICAgICBwb3N0LmVtaXQgJ2xvYWQnIGNvbHVtbjpjb2wsIGl0ZW06aXRlbVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG5cbiAgICAjIDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGltYWdlSW5mbzogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBrbG9nICdpbWFnZUluZm8nIGZpbGVcbiAgICAgICAgaW1nID0gZWxlbSAnaW1nJyBjbGFzczonYnJvd3NlckltYWdlJyBzcmM6c2xhc2guZmlsZVVybCBmaWxlXG4gICAgICAgIGNudCA9IGVsZW0gY2xhc3M6J2Jyb3dzZXJJbWFnZUNvbnRhaW5lcicgY2hpbGQ6aW1nXG4gICAgICAgIGNudC5hZGRFdmVudExpc3RlbmVyICdkYmxjbGljaycgPT4gY2xlYXJUaW1lb3V0IEBvcGVuVmlld2VyVGltZXI7IG9wZW4gZmlsZVxuICAgICAgICBjbnQuYWRkRXZlbnRMaXN0ZW5lciAnY2xpY2snID0+IGNsZWFyVGltZW91dCBAb3BlblZpZXdlclRpbWVyOyBAb3BlblZpZXdlclRpbWVyID0gc2V0VGltZW91dCAoPT4gQGxhc3REaXJDb2x1bW4oKT8ub3BlblZpZXdlcigpKSwgNTAwXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpbWcub25sb2FkID0gLT5cbiAgICAgICAgICAgIGltZyA9JCAnLmJyb3dzZXJJbWFnZSdcbiAgICAgICAgICAgIGJyID0gaW1nLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICB4ID0gaW1nLmNsaWVudFhcbiAgICAgICAgICAgIHdpZHRoICA9IHBhcnNlSW50IGJyLnJpZ2h0IC0gYnIubGVmdCAtIDJcbiAgICAgICAgICAgIGhlaWdodCA9IHBhcnNlSW50IGJyLmJvdHRvbSAtIGJyLnRvcCAtIDJcblxuICAgICAgICAgICAgaW1nLnN0eWxlLm9wYWNpdHkgICA9ICcxJ1xuICAgICAgICAgICAgaW1nLnN0eWxlLm1heFdpZHRoICA9ICcxMDAlJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBzdGF0ID0gc2xhc2guZmlsZUV4aXN0cyBmaWxlXG4gICAgICAgICAgICBzaXplID0gcGJ5dGVzKHN0YXQuc2l6ZSkuc3BsaXQgJyAnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGFnZSA9IG1vbWVudCgpLnRvKG1vbWVudChzdGF0Lm10aW1lKSwgdHJ1ZSlcbiAgICAgICAgICAgIFtudW0sIHJhbmdlXSA9IGFnZS5zcGxpdCAnICdcbiAgICAgICAgICAgIG51bSA9ICcxJyBpZiBudW1bMF0gPT0gJ2EnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGh0bWwgID0gXCI8dHI+PHRoIGNvbHNwYW49Mj4je3dpZHRofTxzcGFuIGNsYXNzPSdwdW5jdCc+eDwvc3Bhbj4je2hlaWdodH08L3RoPjwvdHI+XCJcbiAgICAgICAgICAgIGh0bWwgKz0gXCI8dHI+PHRoPiN7c2l6ZVswXX08L3RoPjx0ZD4je3NpemVbMV19PC90ZD48L3RyPlwiXG4gICAgICAgICAgICBodG1sICs9IFwiPHRyPjx0aD4je251bX08L3RoPjx0ZD4je3JhbmdlfTwvdGQ+PC90cj5cIlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpbmZvID0gZWxlbSBjbGFzczonYnJvd3NlckZpbGVJbmZvJyBjaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgIGVsZW0gJ2RpdicgY2xhc3M6XCJmaWxlSW5mb0ZpbGUgI3tzbGFzaC5leHQgZmlsZX1cIiBodG1sOkZpbGUuc3BhbiBmaWxlXG4gICAgICAgICAgICAgICAgZWxlbSAndGFibGUnIGNsYXNzOlwiZmlsZUluZm9EYXRhXCIgaHRtbDpodG1sXG4gICAgICAgICAgICBdXG4gICAgICAgICAgICBjbnQgPSQgJy5icm93c2VySW1hZ2VDb250YWluZXInXG4gICAgICAgICAgICBjbnQuYXBwZW5kQ2hpbGQgaW5mb1xuICAgICAgICBcbiAgICAgICAgY250XG4gICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgICBcbiAgICAgICAgXG4gICAgZmlsZUluZm86IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAga2xvZyAnZmlsZUluZm8nIGZpbGVcbiAgICAgICAgc3RhdCA9IHNsYXNoLmZpbGVFeGlzdHMgZmlsZVxuICAgICAgICBzaXplID0gcGJ5dGVzKHN0YXQuc2l6ZSkuc3BsaXQgJyAnXG4gICAgICAgIFxuICAgICAgICB0ID0gbW9tZW50IHN0YXQubXRpbWVcblxuICAgICAgICBhZ2UgPSBtb21lbnQoKS50byh0LCB0cnVlKVxuICAgICAgICBbbnVtLCByYW5nZV0gPSBhZ2Uuc3BsaXQgJyAnXG4gICAgICAgIG51bSA9ICcxJyBpZiBudW1bMF0gPT0gJ2EnXG4gICAgICAgIGlmIHJhbmdlID09ICdmZXcnXG4gICAgICAgICAgICBudW0gPSBtb21lbnQoKS5kaWZmIHQsICdzZWNvbmRzJ1xuICAgICAgICAgICAgcmFuZ2UgPSAnc2Vjb25kcydcbiAgICAgICAgXG4gICAgICAgIGluZm8gPSBlbGVtIGNsYXNzOidicm93c2VyRmlsZUluZm8nIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICBlbGVtICdkaXYnIGNsYXNzOlwiZmlsZUluZm9JY29uICN7c2xhc2guZXh0IGZpbGV9ICN7RmlsZS5pY29uQ2xhc3NOYW1lIGZpbGV9XCJcbiAgICAgICAgICAgIGVsZW0gJ2RpdicgY2xhc3M6XCJmaWxlSW5mb0ZpbGUgI3tzbGFzaC5leHQgZmlsZX1cIiBodG1sOkZpbGUuc3BhbiBmaWxlXG4gICAgICAgICAgICBlbGVtICd0YWJsZScgY2xhc3M6XCJmaWxlSW5mb0RhdGFcIiBodG1sOlwiPHRyPjx0aD4je3NpemVbMF19PC90aD48dGQ+I3tzaXplWzFdfTwvdGQ+PC90cj48dHI+PHRoPiN7bnVtfTwvdGg+PHRkPiN7cmFuZ2V9PC90ZD48L3RyPlwiXG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIGluZm8uYWRkRXZlbnRMaXN0ZW5lciAnZGJsY2xpY2snID0+IGNsZWFyVGltZW91dCBAb3BlblZpZXdlclRpbWVyOyBvcGVuIGZpbGVcbiAgICAgICAgaW5mby5hZGRFdmVudExpc3RlbmVyICdjbGljaycgPT4gY2xlYXJUaW1lb3V0IEBvcGVuVmlld2VyVGltZXI7IEBvcGVuVmlld2VyVGltZXIgPSBzZXRUaW1lb3V0ICg9PiBAbGFzdERpckNvbHVtbigpPy5vcGVuVmlld2VyKCkpLCA1MDBcbiAgICAgICAgXG4gICAgICAgIGluZm9cbiAgICAgICAgXG4gICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICAgXG4gICAgIG9uRGlyQ2FjaGU6IChkaXIpID0+XG4gXG4gICAgICAgICBmb3IgY29sdW1uIGluIEBjb2x1bW5zXG4gICAgICAgICAgICAgaWYgY29sdW1uLnBhdGgoKSA9PSBkaXJcbiAgICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtIHtmaWxlOmRpciwgdHlwZTonZGlyJ30sIGNvbHVtbi5pbmRleCwgYWN0aXZlOmNvbHVtbi5hY3RpdmVQYXRoKClcbiAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICBcbiAgICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG4gXG4gICAgIG9uRmlsZUluZGV4ZWQ6IChmaWxlLCBpbmZvKSA9PlxuIFxuICAgICAgICAgQHNyY0NhY2hlW2ZpbGVdID0gaW5mb1xuIFxuICAgICAgICAgaWYgZmlsZSA9PSBAbGFzdFVzZWRDb2x1bW4oKT8ucGFyZW50Py5maWxlXG4gICAgICAgICAgICAgQGxvYWRTb3VyY2VJdGVtIHsgZmlsZTpmaWxlLCB0eXBlOidmaWxlJyB9LCBAbGFzdFVzZWRDb2x1bW4oKT8uaW5kZXhcbiAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbG9hZFNvdXJjZUl0ZW06IChpdGVtLCBjb2wpIC0+XG5cbiAgICAgICAgIyBrbG9nICdsb2FkU291cmNlSXRlbScgaXRlbSwgY29sXG4gICAgICAgIGlmIG5vdCBAc3JjQ2FjaGVbaXRlbS5maWxlXT9cblxuICAgICAgICAgICAgQHNyY0NhY2hlW2l0ZW0uZmlsZV0gPSBwb3N0LmdldCAnaW5kZXhlcicgJ2ZpbGUnIGl0ZW0uZmlsZVxuXG4gICAgICAgIGluZm8gPSBAc3JjQ2FjaGVbaXRlbS5maWxlXVxuXG4gICAgICAgIGlmIGVtcHR5IGluZm9cbiAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0ubG9hZEl0ZW1zIFtdLCBpdGVtXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpdGVtcyA9IFtdXG4gICAgICAgIGNsc3NzID0gaW5mby5jbGFzc2VzID8gW11cbiAgICAgICAgZm9yIGNsc3MgaW4gY2xzc3NcbiAgICAgICAgICAgIHRleHQgPSAn4pePICcrY2xzcy5uYW1lXG4gICAgICAgICAgICBpdGVtcy5wdXNoIG5hbWU6Y2xzcy5uYW1lLCB0ZXh0OnRleHQsIHR5cGU6J2NsYXNzJywgZmlsZTppdGVtLmZpbGUsIGxpbmU6Y2xzcy5saW5lXG5cbiAgICAgICAgZnVuY3MgPSBpbmZvLmZ1bmNzID8gW11cbiAgICAgICAgZm9yIGZ1bmMgaW4gZnVuY3NcbiAgICAgICAgICAgIGlmIGZ1bmMudGVzdCA9PSAnZGVzY3JpYmUnXG4gICAgICAgICAgICAgICAgdGV4dCA9ICfil48gJytmdW5jLm5hbWVcbiAgICAgICAgICAgIGVsc2UgaWYgZnVuYy5zdGF0aWNcbiAgICAgICAgICAgICAgICB0ZXh0ID0gJyAg4peGICcrZnVuYy5uYW1lXG4gICAgICAgICAgICBlbHNlIGlmIGZ1bmMucG9zdFxuICAgICAgICAgICAgICAgIHRleHQgPSAnICDirKIgJytmdW5jLm5hbWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0ZXh0ID0gJyAg4pa4ICcrZnVuYy5uYW1lXG4gICAgICAgICAgICBpdGVtcy5wdXNoIG5hbWU6ZnVuYy5uYW1lLCB0ZXh0OnRleHQsIHR5cGU6J2Z1bmMnLCBmaWxlOml0ZW0uZmlsZSwgbGluZTpmdW5jLmxpbmVcblxuICAgICAgICBpZiB2YWxpZCBpdGVtc1xuICAgICAgICAgICAgaXRlbXMuc29ydCAoYSxiKSAtPiBhLmxpbmUgLSBiLmxpbmVcbiAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0ubG9hZEl0ZW1zIGl0ZW1zLCBpdGVtXG4gICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGxvYWREaXJJdGVtOiAoaXRlbSwgY29sPTAsIG9wdD17fSkgLT5cblxuICAgICAgICByZXR1cm4gaWYgY29sID4gMCBhbmQgaXRlbS5uYW1lID09ICcvJ1xuXG4gICAgICAgIGRpciA9IGl0ZW0uZmlsZVxuXG4gICAgICAgIGlmIGRpckNhY2hlLmhhcyhkaXIpIGFuZCBub3Qgb3B0Lmlnbm9yZUNhY2hlXG4gICAgICAgICAgICBAbG9hZERpckl0ZW1zIGRpciwgaXRlbSwgZGlyQ2FjaGUuZ2V0KGRpciksIGNvbCwgb3B0XG4gICAgICAgICAgICBwb3N0LmVtaXQgJ2RpcicgZGlyXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIG9wdC5pZ25vcmVIaWRkZW4gPSBub3Qgd2luZG93LnN0YXRlLmdldCBcImJyb3dzZXJ8c2hvd0hpZGRlbnwje2Rpcn1cIlxuICAgICAgICAgICAgb3B0LnRleHRUZXN0ID0gdHJ1ZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzbGFzaC5saXN0IGRpciwgb3B0LCAoaXRlbXMpID0+XG5cbiAgICAgICAgICAgICAgICBwb3N0LnRvTWFpbiAnZGlyTG9hZGVkJyBkaXJcblxuICAgICAgICAgICAgICAgIGRpckNhY2hlLnNldCBkaXIsIGl0ZW1zXG4gICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtcyBkaXIsIGl0ZW0sIGl0ZW1zLCBjb2wsIG9wdFxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnZGlyJyBkaXJcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAjIGlmIEBza2lwT25EYmxDbGlja1xuICAgICAgICAgICAgICAgICAgICAjIGRlbGV0ZSBAc2tpcE9uRGJsQ2xpY2tcbiAgICAgICAgICAgICAgICAgICAgIyBpZiBjb2wgPiAwXG4gICAgICAgICAgICAgICAgICAgICAgICAjIHJldHVybiBcblxuICAgIGxvYWREaXJJdGVtczogKGRpciwgaXRlbSwgaXRlbXMsIGNvbCwgb3B0KSA9PlxuICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICB1cGRpciA9IHNsYXNoLnJlc29sdmUgc2xhc2guam9pbiBkaXIsICcuLidcblxuICAgICAgICBpZiBjb2wgPT0gMCBvciBjb2wtMSA8IEBudW1Db2xzKCkgYW5kIEBjb2x1bW5zW2NvbC0xXS5hY3RpdmVSb3coKT8uaXRlbS5uYW1lID09ICcuLidcbiAgICAgICAgICAgIGlmIGl0ZW1zWzBdPy5uYW1lIG5vdCBpbiBbJy4uJyAnLyddXG4gICAgICAgICAgICAgICAgaWYgdXBkaXIgIT0gZGlyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zLnVuc2hpZnRcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICcuLidcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiAgdXBkaXJcblxuICAgICAgICB3aGlsZSBjb2wgPj0gQG51bUNvbHMoKVxuICAgICAgICAgICAgQGFkZENvbHVtbigpXG5cbiAgICAgICAgQGNvbHVtbnNbY29sXS5sb2FkSXRlbXMgaXRlbXMsIGl0ZW1cblxuICAgICAgICBwb3N0LmVtaXQgJ2xvYWQnIGNvbHVtbjpjb2wsIGl0ZW06aXRlbVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBvcHQuYWN0aXZhdGVcbiAgICAgICAgICAgIGlmIHJvdyA9IEBjb2x1bW5zW2NvbF0ucm93IHNsYXNoLmZpbGUgb3B0LmFjdGl2YXRlXG4gICAgICAgICAgICAgICAgcm93LmFjdGl2YXRlKClcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2xvYWQnIGNvbHVtbjpjb2wrMSBpdGVtOnJvdy5pdGVtXG4gICAgICAgIGVsc2UgaWYgb3B0LmFjdGl2ZVxuICAgICAgICAgICAgQGNvbHVtbnNbY29sXS5yb3coc2xhc2guZmlsZSBvcHQuYWN0aXZlKT8uc2V0QWN0aXZlKClcbiAgICAgICAgXG4gICAgICAgIEBnZXRHaXRTdGF0dXMgaXRlbSwgY29sXG4gICAgICAgIFxuICAgICAgICBpZiBvcHQuZm9jdXMgIT0gZmFsc2UgYW5kIGVtcHR5KGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpIGFuZCBlbXB0eSgkKCcucG9wdXAnKT8ub3V0ZXJIVE1MKVxuICAgICAgICAgICAgaWYgbGFzdENvbHVtbiA9IEBsYXN0RGlyQ29sdW1uKClcbiAgICAgICAgICAgICAgICBsYXN0Q29sdW1uLmZvY3VzKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgb3B0LmNiPyBjb2x1bW46Y29sLCBpdGVtOml0ZW1cblxuICAgICAgICBpZiBjb2wgPj0gMiBhbmQgQGNvbHVtbnNbMF0ud2lkdGgoKSA8IDI1MFxuICAgICAgICAgICAgQGNvbHVtbnNbMV0ubWFrZVJvb3QoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIG9uRmlsZTogKGZpbGUpID0+XG5cbiAgICAgICAga2xvZyAnb25GaWxlJyBmaWxlXG4gICAgICAgIHJldHVybiBpZiBub3QgZmlsZVxuICAgICAgICByZXR1cm4gaWYgbm90IEBmbGV4XG5cbiAgICAgICAgQG5hdmlnYXRlVG9GaWxlIGZpbGVcblxuICAgIG9uT3BlbkZpbGU6IChmaWxlKSA9PlxuICAgICAgICBcbiAgICAgICAgb3BlbiBmaWxlXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGluaXRDb2x1bW5zOiAtPlxuXG4gICAgICAgIHN1cGVyKClcblxuICAgICAgICBAdmlldy5pbnNlcnRCZWZvcmUgQHNoZWxmLmRpdiwgQHZpZXcuZmlyc3RDaGlsZFxuICAgICAgICBAdmlldy5pbnNlcnRCZWZvcmUgQHNoZWxmUmVzaXplLCBudWxsXG5cbiAgICAgICAgQHNoZWxmLmJyb3dzZXJEaWRJbml0Q29sdW1ucygpXG5cbiAgICAgICAgQHNldFNoZWxmU2l6ZSBAc2hlbGZTaXplXG5cbiAgICBjb2x1bW5BdFBvczogKHBvcykgLT5cblxuICAgICAgICBpZiBjb2x1bW4gPSBzdXBlciBwb3NcbiAgICAgICAgICAgIHJldHVybiBjb2x1bW5cblxuICAgICAgICBpZiBlbGVtLmNvbnRhaW5zUG9zIEBzaGVsZi5kaXYsIHBvc1xuICAgICAgICAgICAgcmV0dXJuIEBzaGVsZlxuICAgICAgICAgICAgXG4gICAgbGFzdENvbHVtblBhdGg6IC0+XG5cbiAgICAgICAgaWYgbGFzdENvbHVtbiA9IEBsYXN0VXNlZENvbHVtbigpXG4gICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtbi5wYXRoKClcblxuICAgIGxhc3REaXJDb2x1bW46IC0+XG5cbiAgICAgICAgaWYgbGFzdENvbHVtbiA9IEBsYXN0VXNlZENvbHVtbigpXG4gICAgICAgICAgICBpZiBsYXN0Q29sdW1uLmlzRGlyKClcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtblxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBsYXN0Q29sdW1uLnByZXZDb2x1bW4oKVxuXG4gICAgb25CYWNrc3BhY2VJbkNvbHVtbjogKGNvbHVtbikgLT5cblxuICAgICAgICBjb2x1bW4uYmFja3NwYWNlU2VhcmNoKClcbiAgICAgICAgXG4gICAgb25EZWxldGVJbkNvbHVtbjogKGNvbHVtbikgLT4gXG4gICAgXG4gICAgICAgIGlmIGNvbHVtbi5zZWFyY2hEaXZcbiAgICAgICAgICAgIGNvbHVtbi5jbGVhclNlYXJjaCgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNvbHVtbi5tb3ZlVG9UcmFzaCgpXG4gICAgICAgIFxuICAgIHVwZGF0ZUNvbHVtblNjcm9sbHM6ID0+XG5cbiAgICAgICAgc3VwZXIoKVxuICAgICAgICBAc2hlbGY/LnNjcm9sbC51cGRhdGUoKVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDBcblxuICAgIG9uU2hlbGZEcmFnOiAoZHJhZywgZXZlbnQpID0+XG5cbiAgICAgICAgc2hlbGZTaXplID0gY2xhbXAgMCwgNDAwLCBkcmFnLnBvcy54XG4gICAgICAgIEBzZXRTaGVsZlNpemUgc2hlbGZTaXplXG5cbiAgICBzZXRTaGVsZlNpemU6IChAc2hlbGZTaXplKSAtPlxuXG4gICAgICAgIHdpbmRvdy5zdGF0ZS5zZXQgJ3NoZWxmfHNpemUnIEBzaGVsZlNpemVcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmxlZnQgPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEBzaGVsZi5kaXYuc3R5bGUud2lkdGggPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEBjb2xzLnN0eWxlLmxlZnQgPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDBcblxuICAgIGdldEdpdFN0YXR1czogKGl0ZW0sIGNvbCkgPT5cblxuICAgICAgICBmaWxlID0gaXRlbS5maWxlID8gaXRlbS5wYXJlbnQ/LmZpbGVcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGZpbGVcblxuICAgICAgICBodWIuc3RhdHVzIGZpbGUsIChzdGF0dXMpID0+IEBhcHBseUdpdFN0YXR1c0ZpbGVzIGNvbCwgaHViLnN0YXR1c0ZpbGVzIHN0YXR1c1xuXG4gICAgYXBwbHlHaXRTdGF0dXNGaWxlczogKGNvbCwgZmlsZXMpID0+XG5cbiAgICAgICAgQGNvbHVtbnNbY29sXT8udXBkYXRlR2l0RmlsZXMgZmlsZXNcblxuICAgIG9uR2l0U3RhdHVzOiAoZ2l0RGlyLCBzdGF0dXMpID0+XG5cbiAgICAgICAgZmlsZXMgPSBodWIuc3RhdHVzRmlsZXMgc3RhdHVzXG4gICAgICAgIGZvciBjb2wgaW4gWzAuLkBjb2x1bW5zLmxlbmd0aF1cbiAgICAgICAgICAgIEBhcHBseUdpdFN0YXR1c0ZpbGVzIGNvbCwgZmlsZXNcblxuICAgICAgICBAc2hlbGY/LnVwZGF0ZUdpdEZpbGVzIGZpbGVzXG5cbiAgICAjIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMCAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAgICAwMDAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICAgIFxuICAgIFxuICAgIHRvZ2dsZVNoZWxmOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQHNoZWxmU2l6ZSA8IDFcbiAgICAgICAgICAgIEBzZXRTaGVsZlNpemUgMjAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBsYXN0VXNlZENvbHVtbigpPy5mb2N1cygpXG4gICAgICAgICAgICBAc2V0U2hlbGZTaXplIDBcbiAgICAgICAgICAgIFxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG4gICAgICAgIFxuICAgIHJlZnJlc2g6ID0+XG5cbiAgICAgICAgaHViLnJlZnJlc2goKVxuICAgICAgICBkaXJDYWNoZS5yZXNldCgpXG4gICAgICAgIEBzcmNDYWNoZSA9IHt9XG5cbiAgICAgICAgaWYgQGxhc3RVc2VkQ29sdW1uKClcbiAgICAgICAgICAgIGtsb2cgJ3JlZnJlc2gnIEBsYXN0VXNlZENvbHVtbigpPy5wYXRoKClcbiAgICAgICAgICAgIEBuYXZpZ2F0ZVRvRmlsZSBAbGFzdFVzZWRDb2x1bW4oKT8ucGF0aCgpXG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZUJyb3dzZXJcbiJdfQ==
//# sourceURL=../../coffee/browser/filebrowser.coffee