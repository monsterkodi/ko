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

    FileBrowser.prototype.browse = function(file, opt) {
        if (file) {
            return this.loadItem(this.fileItem(file), opt);
        }
    };

    FileBrowser.prototype.navigateToFile = function(file) {
        var col, i, index, item, lastPath, opt, paths, ref1, ref2, row;
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
                return this.loadDirItem(item, col + 1, {
                    focus: false
                });
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
                clearTimeout(_this.openTimer);
                return open(file);
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
        var lastColumn, ref1, ref2, row;
        this.updateColumnScrolls();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWJyb3dzZXIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2Jyb3dzZXIiLCJzb3VyY2VzIjpbImZpbGVicm93c2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxvSkFBQTtJQUFBOzs7O0FBUUEsTUFBNEUsT0FBQSxDQUFRLEtBQVIsQ0FBNUUsRUFBRSxTQUFGLEVBQUssaUJBQUwsRUFBWSxlQUFaLEVBQWtCLGVBQWxCLEVBQXdCLGlCQUF4QixFQUErQix1QkFBL0IsRUFBeUMsZUFBekMsRUFBK0MsZUFBL0MsRUFBcUQsZUFBckQsRUFBMkQsaUJBQTNELEVBQWtFOztBQUVsRSxPQUFBLEdBQVcsT0FBQSxDQUFRLFdBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxTQUFSOztBQUNYLE1BQUEsR0FBVyxPQUFBLENBQVEsVUFBUjs7QUFDWCxJQUFBLEdBQVcsT0FBQSxDQUFRLGVBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxtQkFBUjs7QUFDWCxHQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBQ1gsTUFBQSxHQUFXLE9BQUEsQ0FBUSxjQUFSOztBQUNYLE1BQUEsR0FBVyxPQUFBLENBQVEsUUFBUjs7QUFFTDs7O0lBRUMscUJBQUMsSUFBRDs7Ozs7Ozs7Ozs7Ozs7O1FBRUMsNkNBQU0sSUFBTjtRQUVBLE1BQU0sQ0FBQyxXQUFQLEdBQXFCO1FBRXJCLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsS0FBRCxHQUFVLElBQUksS0FBSixDQUFVLElBQVY7UUFDVixJQUFDLENBQUEsTUFBRCxHQUFVLElBQUksTUFBSixDQUFXLElBQVg7UUFDVixJQUFDLENBQUEsSUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLFFBQUQsR0FBWTtRQUVaLElBQUksQ0FBQyxFQUFMLENBQVEsTUFBUixFQUF5QixJQUFDLENBQUEsTUFBMUI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFFBQVIs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QUE7UUFBQSxJQUFHLElBQUMsQ0FBQSxTQUFELEdBQWEsQ0FBaEI7WUFDSSxJQUFDLENBQUEsWUFBRCxDQUFjLEdBQWQsRUFESjtTQUFBLE1BQUE7O29CQUdxQixDQUFFLEtBQW5CLENBQUE7O1lBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBYyxDQUFkLEVBSko7O2VBTUEsSUFBQyxDQUFBLG1CQUFELENBQUE7SUFSUzs7MEJBVWIsT0FBQSxHQUFTLFNBQUE7QUFFTCxZQUFBO1FBQUEsR0FBRyxDQUFDLE9BQUosQ0FBQTtRQUNBLFFBQVEsQ0FBQyxLQUFULENBQUE7UUFDQSxJQUFDLENBQUEsUUFBRCxHQUFZO1FBRVosSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFBLENBQUg7WUFDSSxJQUFBLENBQUssU0FBTCwrQ0FBZ0MsQ0FBRSxJQUFuQixDQUFBLFVBQWY7bUJBQ0EsSUFBQyxDQUFBLGNBQUQsOENBQWlDLENBQUUsSUFBbkIsQ0FBQSxVQUFoQixFQUZKOztJQU5LOzs7O0dBeGxCYTs7QUFrbUIxQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyAkLCBjbGFtcCwgZHJhZywgZWxlbSwgZW1wdHksIGZpbGVsaXN0LCBrbG9nLCBvcGVuLCBwb3N0LCBzbGFzaCwgdmFsaWQgfSA9IHJlcXVpcmUgJ2t4aydcblxuQnJvd3NlciAgPSByZXF1aXJlICcuL2Jyb3dzZXInXG5TaGVsZiAgICA9IHJlcXVpcmUgJy4vc2hlbGYnXG5TZWxlY3QgICA9IHJlcXVpcmUgJy4vc2VsZWN0J1xuRmlsZSAgICAgPSByZXF1aXJlICcuLi90b29scy9maWxlJ1xuZGlyQ2FjaGUgPSByZXF1aXJlICcuLi90b29scy9kaXJjYWNoZSdcbmh1YiAgICAgID0gcmVxdWlyZSAnLi4vZ2l0L2h1YidcbnBieXRlcyAgID0gcmVxdWlyZSAncHJldHR5LWJ5dGVzJ1xubW9tZW50ICAgPSByZXF1aXJlICdtb21lbnQnXG5cbmNsYXNzIEZpbGVCcm93c2VyIGV4dGVuZHMgQnJvd3NlclxuXG4gICAgQDogKHZpZXcpIC0+XG5cbiAgICAgICAgc3VwZXIgdmlld1xuXG4gICAgICAgIHdpbmRvdy5maWxlYnJvd3NlciA9IEBcblxuICAgICAgICBAbG9hZElEID0gMFxuICAgICAgICBAc2hlbGYgID0gbmV3IFNoZWxmIEBcbiAgICAgICAgQHNlbGVjdCA9IG5ldyBTZWxlY3QgQFxuICAgICAgICBAbmFtZSAgID0gJ0ZpbGVCcm93c2VyJ1xuICAgICAgICBAc3JjQ2FjaGUgPSB7fVxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnZmlsZScgICAgICAgICAgIEBvbkZpbGVcbiAgICAgICAgcG9zdC5vbiAnYnJvd3NlJyAgICAgICAgIEBicm93c2VcbiAgICAgICAgcG9zdC5vbiAnZmlsZWJyb3dzZXInICAgIEBvbkZpbGVCcm93c2VyXG4gICAgICAgIHBvc3Qub24gJ29wZW5GaWxlJyAgICAgICBAb25PcGVuRmlsZVxuICAgICAgICBwb3N0Lm9uICduYXZpZ2F0ZVRvRmlsZScgQG5hdmlnYXRlVG9GaWxlXG5cbiAgICAgICAgcG9zdC5vbiAnZ2l0U3RhdHVzJyAgICAgIEBvbkdpdFN0YXR1c1xuICAgICAgICBwb3N0Lm9uICdmaWxlSW5kZXhlZCcgICAgQG9uRmlsZUluZGV4ZWRcbiAgICAgICAgcG9zdC5vbiAnZGlyY2FjaGUnICAgICAgIEBvbkRpckNhY2hlXG4gICAgICAgIFxuICAgICAgICBAc2hlbGZSZXNpemUgPSBlbGVtICdkaXYnIGNsYXNzOiAnc2hlbGZSZXNpemUnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLnRvcCAgICAgID0gJzBweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmJvdHRvbSAgID0gJzBweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmxlZnQgICAgID0gJzE5NHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUud2lkdGggICAgPSAnNnB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUuY3Vyc29yICAgPSAnZXctcmVzaXplJ1xuXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBzaGVsZlJlc2l6ZVxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uU2hlbGZEcmFnXG5cbiAgICAgICAgQHNoZWxmU2l6ZSA9IHdpbmRvdy5zdGF0ZS5nZXQgJ3NoZWxmfHNpemUnIDIwMFxuXG4gICAgICAgIEBpbml0Q29sdW1ucygpXG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGRyb3BBY3Rpb246IChhY3Rpb24sIHNvdXJjZXMsIHRhcmdldCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmlzRmlsZSB0YXJnZXRcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGFyZ2V0ID0gc2xhc2guZGlyIHRhcmdldFxuICAgICAgICBcbiAgICAgICAgZm9yIHNvdXJjZSBpbiBzb3VyY2VzXG4gICAgICAgIFxuICAgICAgICAgICAgaWYgYWN0aW9uID09ICdtb3ZlJyBcbiAgICAgICAgICAgICAgICBpZiBzb3VyY2UgPT0gdGFyZ2V0IG9yIHNsYXNoLmRpcihzb3VyY2UpID09IHRhcmdldFxuICAgICAgICAgICAgICAgICAgICBrbG9nICdub29wJyBzb3VyY2UsIHRhcmdldFxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBmb3Igc291cmNlIGluIHNvdXJjZXNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3dpdGNoIGFjdGlvblxuICAgICAgICAgICAgICAgIHdoZW4gJ21vdmUnXG4gICAgICAgICAgICAgICAgICAgIEZpbGUucmVuYW1lIHNvdXJjZSwgdGFyZ2V0LCAoc291cmNlLCB0YXJnZXQpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBzb3VyY2VDb2x1bW4gPSBAY29sdW1uRm9yRmlsZSBzb3VyY2UgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlQ29sdW1uLnJlbW92ZUZpbGUgc291cmNlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiB0YXJnZXRDb2x1bW4gPSBAY29sdW1uRm9yRmlsZSB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBub3QgdGFyZ2V0Q29sdW1uLnJvdyB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Q29sdW1uLmluc2VydEZpbGUgdGFyZ2V0XG4gICAgICAgICAgICAgICAgd2hlbiAnY29weSdcbiAgICAgICAgICAgICAgICAgICAgRmlsZS5jb3B5IHNvdXJjZSwgdGFyZ2V0LCAoc291cmNlLCB0YXJnZXQpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiB0YXJnZXRDb2x1bW4gPSBAY29sdW1uRm9yRmlsZSB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBub3QgdGFyZ2V0Q29sdW1uLnJvdyB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Q29sdW1uLmluc2VydEZpbGUgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgIFxuICAgIGNvbHVtbkZvckZpbGU6IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGNvbHVtbiBpbiBAY29sdW1uc1xuICAgICAgICAgICAgaWYgY29sdW1uLnBhcmVudD8uZmlsZSA9PSBzbGFzaC5kaXIgZmlsZVxuICAgICAgICAgICAgICAgIHJldHVybiBjb2x1bW5cbiAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgc2hhcmVkQ29sdW1uSW5kZXg6IChmaWxlKSAtPiBcbiAgICAgICAgXG4gICAgICAgIGNvbCA9IDBcbiAgICAgICAgXG4gICAgICAgIGZvciBjb2x1bW4gaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIGNvbHVtbi5pc0RpcigpIGFuZCBmaWxlLnN0YXJ0c1dpdGggY29sdW1uLnBhdGgoKVxuICAgICAgICAgICAgICAgIGNvbCArPSAxXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgY29sID09IDEgYW5kIHNsYXNoLmRpcihmaWxlKSAhPSBAY29sdW1uc1swXT8ucGF0aCgpXG4gICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICBNYXRoLm1heCAtMSwgY29sLTJcblxuICAgIGJyb3dzZTogKGZpbGUsIG9wdCkgPT4gXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgZmlsZSB0aGVuIEBsb2FkSXRlbSBAZmlsZUl0ZW0oZmlsZSksIG9wdFxuICAgICAgICBcbiAgICBuYXZpZ2F0ZVRvRmlsZTogKGZpbGUpID0+XG5cbiAgICAgICAgbGFzdFBhdGggPSBAbGFzdERpckNvbHVtbigpPy5wYXRoKClcbiAgICAgICAgXG4gICAgICAgIGZpbGUgPSBzbGFzaC5wYXRoIGZpbGVcblxuICAgICAgICBrbG9nICduYXZpZ2F0ZVRvRmlsZScgZmlsZSwgbGFzdFBhdGgsIEBsYXN0Q29sdW1uUGF0aCgpXG4gICAgICAgIFxuICAgICAgICBpZiBmaWxlID09IGxhc3RQYXRoIG9yIGZpbGUgPT0gQGxhc3RDb2x1bW5QYXRoKCkgb3Igc2xhc2guaXNSZWxhdGl2ZSBmaWxlXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBjb2wgPSBAc2hhcmVkQ29sdW1uSW5kZXggZmlsZVxuICAgICAgICBcbiAgICAgICAgZmlsZWxpc3QgPSBzbGFzaC5wYXRobGlzdCBmaWxlXG4gICAgICAgIFxuICAgICAgICBpZiBjb2wgPj0gMFxuICAgICAgICAgICAgcGF0aHMgPSBmaWxlbGlzdC5zbGljZSBmaWxlbGlzdC5pbmRleE9mKEBjb2x1bW5zW2NvbF0ucGF0aCgpKSsxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHBhdGhzID0gZmlsZWxpc3Quc2xpY2UgZmlsZWxpc3QubGVuZ3RoLTJcbiAgICAgICAgICAgIFxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2wrMSwgcG9wOnRydWUgY2xlYXI6Y29sK3BhdGhzLmxlbmd0aFxuICAgICAgICBcbiAgICAgICAgd2hpbGUgQG51bUNvbHMoKSA8IHBhdGhzLmxlbmd0aFxuICAgICAgICAgICAgQGFkZENvbHVtbigpXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgZm9yIGluZGV4IGluIFswLi4ucGF0aHMubGVuZ3RoXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpdGVtID0gQGZpbGVJdGVtIHBhdGhzW2luZGV4XVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICAgICAgd2hlbiAnZmlsZScgXG4gICAgICAgICAgICAgICAgICAgICMga2xvZyAnZmlsZWJyb3dzZXIubmF2aWdhdGVUb0ZpbGUnIGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICBAbG9hZEZpbGVJdGVtIGl0ZW0sIGNvbCsxK2luZGV4XG4gICAgICAgICAgICAgICAgd2hlbiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICBvcHQgPSB7fVxuICAgICAgICAgICAgICAgICAgICBpZiBpbmRleCA8IHBhdGhzLmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHQuYWN0aXZlID0gcGF0aHNbaW5kZXgrMV1cbiAgICAgICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtIGl0ZW0sIGNvbCsxK2luZGV4LCBvcHRcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNvbCA9IEBsYXN0RGlyQ29sdW1uKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgcm93ID0gY29sLnJvdyhzbGFzaC5maWxlIGZpbGUpXG4gICAgICAgICAgICAgICAgcm93LnNldEFjdGl2ZSgpXG5cbiAgICAjIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBmaWxlSXRlbTogKHBhdGgpIC0+XG4gICAgICAgIFxuICAgICAgICBwID0gc2xhc2gucmVzb2x2ZSBwYXRoXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGZpbGU6cFxuICAgICAgICB0eXBlOnNsYXNoLmlzRmlsZShwKSBhbmQgJ2ZpbGUnIG9yICdkaXInXG4gICAgICAgIG5hbWU6c2xhc2guZmlsZSBwXG4gICAgICAgIFxuICAgIG9uRmlsZUJyb3dzZXI6IChhY3Rpb24sIGl0ZW0sIGFyZykgPT5cblxuICAgICAgICBzd2l0Y2ggYWN0aW9uXG4gICAgICAgICAgICB3aGVuICdsb2FkSXRlbScgICAgIHRoZW4gQGxvYWRJdGVtICAgICBpdGVtLCBhcmdcbiAgICAgICAgICAgIHdoZW4gJ2FjdGl2YXRlSXRlbScgdGhlbiBAYWN0aXZhdGVJdGVtIGl0ZW0sIGFyZ1xuICAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsb2FkRGlyOiAocGF0aCkgLT4gQGxvYWRJdGVtIHR5cGU6J2RpcicgZmlsZTpwYXRoXG4gICAgXG4gICAgbG9hZEl0ZW06IChpdGVtLCBvcHQpIC0+XG5cbiAgICAgICAgb3B0ID89IGFjdGl2ZTonLi4nIGZvY3VzOnRydWVcbiAgICAgICAgaXRlbS5uYW1lID89IHNsYXNoLmZpbGUgaXRlbS5maWxlXG5cbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gMSwgcG9wOnRydWUsIGNsZWFyOm9wdC5jbGVhciA/IDFcblxuICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICB3aGVuICdkaXInICB0aGVuIEBsb2FkRGlySXRlbSBpdGVtLCAwLCBvcHRcbiAgICAgICAgICAgIHdoZW4gJ2ZpbGUnIFxuICAgICAgICAgICAgICAgIG9wdC5hY3RpdmF0ZSA9IGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgIHdoaWxlIEBudW1Db2xzKCkgPCAyIHRoZW4gQGFkZENvbHVtbigpXG4gICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtIEBmaWxlSXRlbShzbGFzaC5kaXIoaXRlbS5maWxlKSksIDAsIG9wdFxuXG4gICAgICAgIGlmIG9wdC5mb2N1c1xuICAgICAgICAgICAgQGNvbHVtbnNbMF0/LmZvY3VzKClcblxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBhY3RpdmF0ZUl0ZW06IChpdGVtLCBjb2wpIC0+XG5cbiAgICAgICAga2xvZyAnYWN0aXZhdGVJdGVtJyBpdGVtLmZpbGVcbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sKzIgcG9wOnRydWVcblxuICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtICBpdGVtLCBjb2wrMSwgZm9jdXM6ZmFsc2VcbiAgICAgICAgICAgIHdoZW4gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgQGxvYWRGaWxlSXRlbSBpdGVtLCBjb2wrMVxuICAgICAgICAgICAgICAgIGlmIGl0ZW0udGV4dEZpbGUgb3IgRmlsZS5pc1RleHQgaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgIGtsb2cgJ2FjdGl2YXRlSXRlbSBqdW1wVG9GaWxlJyBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG9GaWxlJyBpdGVtXG5cbiAgICAjIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsb2FkRmlsZUl0ZW06IChpdGVtLCBjb2w9MCkgLT5cblxuICAgICAgICBrbG9nICdsb2FkRmlsZUl0ZW0nIGNvbCwgaXRlbS5maWxlXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbCwgcG9wOnRydWVcblxuICAgICAgICB3aGlsZSBjb2wgPj0gQG51bUNvbHMoKVxuICAgICAgICAgICAgQGFkZENvbHVtbigpXG5cbiAgICAgICAgZmlsZSA9IGl0ZW0uZmlsZVxuXG4gICAgICAgIEBjb2x1bW5zW2NvbF0ucGFyZW50ID0gaXRlbVxuICAgICAgICBcbiAgICAgICAgaWYgRmlsZS5pc0ltYWdlIGZpbGVcbiAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0udGFibGUuYXBwZW5kQ2hpbGQgQGltYWdlSW5mbyBmaWxlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHN3aXRjaCBzbGFzaC5leHQgZmlsZVxuICAgICAgICAgICAgICAgIHdoZW4gJ3RpZmYnICd0aWYnXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBzbGFzaC53aW4oKVxuICAgICAgICAgICAgICAgICAgICAgICAgQGNvbnZlcnRJbWFnZSByb3dcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQGNvbHVtbnNbY29sXS50YWJsZS5hcHBlbmRDaGlsZCBAZmlsZUluZm8gZmlsZVxuICAgICAgICAgICAgICAgIHdoZW4gJ3B4bSdcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgICAgICAgICBAY29udmVydFBYTSByb3dcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQGNvbHVtbnNbY29sXS50YWJsZS5hcHBlbmRDaGlsZCBAZmlsZUluZm8gZmlsZVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaWYgRmlsZS5pc1RleHQgaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBAbG9hZFNvdXJjZUl0ZW0gaXRlbSwgY29sXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBGaWxlLmlzQ2xhc3MgaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBAY29sdW1uc1tjb2xdLnRhYmxlLmFwcGVuZENoaWxkIEBmaWxlSW5mbyBmaWxlXG5cbiAgICAgICAgcG9zdC5lbWl0ICdsb2FkJyBjb2x1bW46Y29sLCBpdGVtOml0ZW1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuXG4gICAgIyAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBpbWFnZUluZm86IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAga2xvZyAnaW1hZ2VJbmZvJyBmaWxlXG4gICAgICAgIGltZyA9IGVsZW0gJ2ltZycgY2xhc3M6J2Jyb3dzZXJJbWFnZScgc3JjOnNsYXNoLmZpbGVVcmwgZmlsZVxuICAgICAgICBjbnQgPSBlbGVtIGNsYXNzOidicm93c2VySW1hZ2VDb250YWluZXInIGNoaWxkOmltZ1xuICAgICAgICBjbnQuYWRkRXZlbnRMaXN0ZW5lciAnZGJsY2xpY2snID0+IGNsZWFyVGltZW91dCBAb3BlblRpbWVyOyBvcGVuIGZpbGVcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGltZy5vbmxvYWQgPSAtPlxuICAgICAgICAgICAgaW1nID0kICcuYnJvd3NlckltYWdlJ1xuICAgICAgICAgICAgYnIgPSBpbWcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgICAgIHggPSBpbWcuY2xpZW50WFxuICAgICAgICAgICAgd2lkdGggID0gcGFyc2VJbnQgYnIucmlnaHQgLSBici5sZWZ0IC0gMlxuICAgICAgICAgICAgaGVpZ2h0ID0gcGFyc2VJbnQgYnIuYm90dG9tIC0gYnIudG9wIC0gMlxuXG4gICAgICAgICAgICBpbWcuc3R5bGUub3BhY2l0eSAgID0gJzEnXG4gICAgICAgICAgICBpbWcuc3R5bGUubWF4V2lkdGggID0gJzEwMCUnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN0YXQgPSBzbGFzaC5maWxlRXhpc3RzIGZpbGVcbiAgICAgICAgICAgIHNpemUgPSBwYnl0ZXMoc3RhdC5zaXplKS5zcGxpdCAnICdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgYWdlID0gbW9tZW50KCkudG8obW9tZW50KHN0YXQubXRpbWUpLCB0cnVlKVxuICAgICAgICAgICAgW251bSwgcmFuZ2VdID0gYWdlLnNwbGl0ICcgJ1xuICAgICAgICAgICAgbnVtID0gJzEnIGlmIG51bVswXSA9PSAnYSdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaHRtbCAgPSBcIjx0cj48dGggY29sc3Bhbj0yPiN7d2lkdGh9PHNwYW4gY2xhc3M9J3B1bmN0Jz54PC9zcGFuPiN7aGVpZ2h0fTwvdGg+PC90cj5cIlxuICAgICAgICAgICAgaHRtbCArPSBcIjx0cj48dGg+I3tzaXplWzBdfTwvdGg+PHRkPiN7c2l6ZVsxXX08L3RkPjwvdHI+XCJcbiAgICAgICAgICAgIGh0bWwgKz0gXCI8dHI+PHRoPiN7bnVtfTwvdGg+PHRkPiN7cmFuZ2V9PC90ZD48L3RyPlwiXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGluZm8gPSBlbGVtIGNsYXNzOidicm93c2VyRmlsZUluZm8nIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAgZWxlbSAnZGl2JyBjbGFzczpcImZpbGVJbmZvRmlsZSAje3NsYXNoLmV4dCBmaWxlfVwiIGh0bWw6RmlsZS5zcGFuIGZpbGVcbiAgICAgICAgICAgICAgICBlbGVtICd0YWJsZScgY2xhc3M6XCJmaWxlSW5mb0RhdGFcIiBodG1sOmh0bWxcbiAgICAgICAgICAgIF1cbiAgICAgICAgICAgIGNudCA9JCAnLmJyb3dzZXJJbWFnZUNvbnRhaW5lcidcbiAgICAgICAgICAgIGNudC5hcHBlbmRDaGlsZCBpbmZvXG4gICAgICAgIFxuICAgICAgICBjbnRcbiAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgICAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIFxuICAgICAgICBcbiAgICBmaWxlSW5mbzogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBrbG9nICdmaWxlSW5mbycgZmlsZVxuICAgICAgICBzdGF0ID0gc2xhc2guZmlsZUV4aXN0cyBmaWxlXG4gICAgICAgIHNpemUgPSBwYnl0ZXMoc3RhdC5zaXplKS5zcGxpdCAnICdcbiAgICAgICAgXG4gICAgICAgIHQgPSBtb21lbnQgc3RhdC5tdGltZVxuXG4gICAgICAgIGFnZSA9IG1vbWVudCgpLnRvKHQsIHRydWUpXG4gICAgICAgIFtudW0sIHJhbmdlXSA9IGFnZS5zcGxpdCAnICdcbiAgICAgICAgbnVtID0gJzEnIGlmIG51bVswXSA9PSAnYSdcbiAgICAgICAgaWYgcmFuZ2UgPT0gJ2ZldydcbiAgICAgICAgICAgIG51bSA9IG1vbWVudCgpLmRpZmYgdCwgJ3NlY29uZHMnXG4gICAgICAgICAgICByYW5nZSA9ICdzZWNvbmRzJ1xuICAgICAgICBcbiAgICAgICAgaW5mbyA9IGVsZW0gY2xhc3M6J2Jyb3dzZXJGaWxlSW5mbycgY2hpbGRyZW46IFtcbiAgICAgICAgICAgIGVsZW0gJ2RpdicgY2xhc3M6XCJmaWxlSW5mb0ljb24gI3tzbGFzaC5leHQgZmlsZX0gI3tGaWxlLmljb25DbGFzc05hbWUgZmlsZX1cIlxuICAgICAgICAgICAgZWxlbSAnZGl2JyBjbGFzczpcImZpbGVJbmZvRmlsZSAje3NsYXNoLmV4dCBmaWxlfVwiIGh0bWw6RmlsZS5zcGFuIGZpbGVcbiAgICAgICAgICAgIGVsZW0gJ3RhYmxlJyBjbGFzczpcImZpbGVJbmZvRGF0YVwiIGh0bWw6XCI8dHI+PHRoPiN7c2l6ZVswXX08L3RoPjx0ZD4je3NpemVbMV19PC90ZD48L3RyPjx0cj48dGg+I3tudW19PC90aD48dGQ+I3tyYW5nZX08L3RkPjwvdHI+XCJcbiAgICAgICAgXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpbmZvXG4gICAgICAgIFxuICAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgIFxuICAgICBvbkRpckNhY2hlOiAoZGlyKSA9PlxuIFxuICAgICAgICAgZm9yIGNvbHVtbiBpbiBAY29sdW1uc1xuICAgICAgICAgICAgIGlmIGNvbHVtbi5wYXRoKCkgPT0gZGlyXG4gICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbSB7ZmlsZTpkaXIsIHR5cGU6J2Rpcid9LCBjb2x1bW4uaW5kZXgsIGFjdGl2ZTpjb2x1bW4uYWN0aXZlUGF0aCgpXG4gICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgXG4gICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuIFxuICAgICBvbkZpbGVJbmRleGVkOiAoZmlsZSwgaW5mbykgPT5cbiBcbiAgICAgICAgIEBzcmNDYWNoZVtmaWxlXSA9IGluZm9cbiBcbiAgICAgICAgIGlmIGZpbGUgPT0gQGxhc3RVc2VkQ29sdW1uKCk/LnBhcmVudD8uZmlsZVxuICAgICAgICAgICAgIEBsb2FkU291cmNlSXRlbSB7IGZpbGU6ZmlsZSwgdHlwZTonZmlsZScgfSwgQGxhc3RVc2VkQ29sdW1uKCk/LmluZGV4XG4gICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGxvYWRTb3VyY2VJdGVtOiAoaXRlbSwgY29sKSAtPlxuXG4gICAgICAgICMga2xvZyAnbG9hZFNvdXJjZUl0ZW0nIGl0ZW0sIGNvbFxuICAgICAgICBpZiBub3QgQHNyY0NhY2hlW2l0ZW0uZmlsZV0/XG5cbiAgICAgICAgICAgIEBzcmNDYWNoZVtpdGVtLmZpbGVdID0gcG9zdC5nZXQgJ2luZGV4ZXInICdmaWxlJyBpdGVtLmZpbGVcblxuICAgICAgICBpbmZvID0gQHNyY0NhY2hlW2l0ZW0uZmlsZV1cblxuICAgICAgICBpZiBlbXB0eSBpbmZvXG4gICAgICAgICAgICBAY29sdW1uc1tjb2xdLmxvYWRJdGVtcyBbXSwgaXRlbVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgaXRlbXMgPSBbXVxuICAgICAgICBjbHNzcyA9IGluZm8uY2xhc3NlcyA/IFtdXG4gICAgICAgIGZvciBjbHNzIGluIGNsc3NzXG4gICAgICAgICAgICB0ZXh0ID0gJ+KXjyAnK2Nsc3MubmFtZVxuICAgICAgICAgICAgaXRlbXMucHVzaCBuYW1lOmNsc3MubmFtZSwgdGV4dDp0ZXh0LCB0eXBlOidjbGFzcycsIGZpbGU6aXRlbS5maWxlLCBsaW5lOmNsc3MubGluZVxuXG4gICAgICAgIGZ1bmNzID0gaW5mby5mdW5jcyA/IFtdXG4gICAgICAgIGZvciBmdW5jIGluIGZ1bmNzXG4gICAgICAgICAgICBpZiBmdW5jLnRlc3QgPT0gJ2Rlc2NyaWJlJ1xuICAgICAgICAgICAgICAgIHRleHQgPSAn4pePICcrZnVuYy5uYW1lXG4gICAgICAgICAgICBlbHNlIGlmIGZ1bmMuc3RhdGljXG4gICAgICAgICAgICAgICAgdGV4dCA9ICcgIOKXhiAnK2Z1bmMubmFtZVxuICAgICAgICAgICAgZWxzZSBpZiBmdW5jLnBvc3RcbiAgICAgICAgICAgICAgICB0ZXh0ID0gJyAg4qyiICcrZnVuYy5uYW1lXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdGV4dCA9ICcgIOKWuCAnK2Z1bmMubmFtZVxuICAgICAgICAgICAgaXRlbXMucHVzaCBuYW1lOmZ1bmMubmFtZSwgdGV4dDp0ZXh0LCB0eXBlOidmdW5jJywgZmlsZTppdGVtLmZpbGUsIGxpbmU6ZnVuYy5saW5lXG5cbiAgICAgICAgaWYgdmFsaWQgaXRlbXNcbiAgICAgICAgICAgIGl0ZW1zLnNvcnQgKGEsYikgLT4gYS5saW5lIC0gYi5saW5lXG4gICAgICAgICAgICBAY29sdW1uc1tjb2xdLmxvYWRJdGVtcyBpdGVtcywgaXRlbVxuICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsb2FkRGlySXRlbTogKGl0ZW0sIGNvbD0wLCBvcHQ9e30pIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIGNvbCA+IDAgYW5kIGl0ZW0ubmFtZSA9PSAnLydcblxuICAgICAgICBkaXIgPSBpdGVtLmZpbGVcblxuICAgICAgICBpZiBkaXJDYWNoZS5oYXMoZGlyKSBhbmQgbm90IG9wdC5pZ25vcmVDYWNoZVxuICAgICAgICAgICAgIyBrbG9nIFwiZGlyQ2FjaGUgI3tkaXJ9XCJcbiAgICAgICAgICAgIEBsb2FkRGlySXRlbXMgZGlyLCBpdGVtLCBkaXJDYWNoZS5nZXQoZGlyKSwgY29sLCBvcHRcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnZGlyJyBkaXJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgb3B0Lmlnbm9yZUhpZGRlbiA9IG5vdCB3aW5kb3cuc3RhdGUuZ2V0IFwiYnJvd3NlcnxzaG93SGlkZGVufCN7ZGlyfVwiXG4gICAgICAgICAgICBvcHQudGV4dFRlc3QgPSB0cnVlXG4gICAgICAgICAgICBzbGFzaC5saXN0IGRpciwgb3B0LCAoaXRlbXMpID0+XG5cbiAgICAgICAgICAgICAgICBwb3N0LnRvTWFpbiAnZGlyTG9hZGVkJyBkaXJcblxuICAgICAgICAgICAgICAgIGRpckNhY2hlLnNldCBkaXIsIGl0ZW1zXG4gICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtcyBkaXIsIGl0ZW0sIGl0ZW1zLCBjb2wsIG9wdFxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnZGlyJyBkaXJcbiAgICAgICAgICAgICAgICBcbiAgICBsb2FkRGlySXRlbXM6IChkaXIsIGl0ZW0sIGl0ZW1zLCBjb2wsIG9wdCkgPT5cbiAgICAgICAgXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgIyB1cGRpciA9IHNsYXNoLnJlc29sdmUgc2xhc2guam9pbiBkaXIsICcuLidcblxuICAgICAgICAjIGlmIGNvbCA9PSAwIG9yIGNvbC0xIDwgQG51bUNvbHMoKSBhbmQgQGNvbHVtbnNbY29sLTFdLmFjdGl2ZVJvdygpPy5pdGVtLm5hbWUgPT0gJy4uJ1xuICAgICAgICAgICAgIyBpZiBpdGVtc1swXT8ubmFtZSBub3QgaW4gWycuLicgJy8nXVxuICAgICAgICAgICAgICAgICMgaWYgdXBkaXIgIT0gZGlyXG4gICAgICAgICAgICAgICAgICAgICMga2xvZyAnQG51bUNvbHMoKScgQG51bUNvbHMoKVxuICAgICAgICAgICAgICAgICAgICAjIGtsb2cgJ0Bjb2x1bW5zW2NvbC0xXS5hY3RpdmVSb3coKT8uaXRlbS5uYW1lJyBAY29sdW1uc1tjb2wtMV0/LmFjdGl2ZVJvdygpPy5pdGVtLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgIyBrbG9nICdjb2wnIGNvbFxuICAgICAgICAgICAgICAgICAgICAjIGtsb2cgJ2l0ZW1zWzBdJyBpdGVtc1swXT8ubmFtZVxuICAgICAgICAgICAgICAgICAgICAjIGtsb2cgJ3VwZGlyJyB1cGRpclxuICAgICAgICAgICAgICAgICAgICAjIGtsb2cgJ2RpcicgZGlyXG4gICAgICAgICAgICAgICAgICAgICMgaXRlbXMudW5zaGlmdFxuICAgICAgICAgICAgICAgICAgICAgICAgIyBuYW1lOiAnLi4nXG4gICAgICAgICAgICAgICAgICAgICAgICAjIHR5cGU6ICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICAjIGZpbGU6ICB1cGRpclxuXG4gICAgICAgIHdoaWxlIGNvbCA+PSBAbnVtQ29scygpXG4gICAgICAgICAgICBAYWRkQ29sdW1uKClcblxuICAgICAgICBAY29sdW1uc1tjb2xdLmxvYWRJdGVtcyBpdGVtcywgaXRlbVxuXG4gICAgICAgIHBvc3QuZW1pdCAnbG9hZCcgY29sdW1uOmNvbCwgaXRlbTppdGVtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG9wdC5hY3RpdmF0ZVxuICAgICAgICAgICAgaWYgcm93ID0gQGNvbHVtbnNbY29sXS5yb3cgc2xhc2guZmlsZSBvcHQuYWN0aXZhdGVcbiAgICAgICAgICAgICAgICByb3cuYWN0aXZhdGUoKVxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnbG9hZCcgY29sdW1uOmNvbCsxIGl0ZW06cm93Lml0ZW1cbiAgICAgICAgZWxzZSBpZiBvcHQuYWN0aXZlXG4gICAgICAgICAgICBAY29sdW1uc1tjb2xdLnJvdyhzbGFzaC5maWxlIG9wdC5hY3RpdmUpPy5zZXRBY3RpdmUoKVxuICAgICAgICBcbiAgICAgICAgQGdldEdpdFN0YXR1cyBpdGVtLCBjb2xcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdC5mb2N1cyAhPSBmYWxzZSBhbmQgZW1wdHkoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkgYW5kIGVtcHR5KCQoJy5wb3B1cCcpPy5vdXRlckhUTUwpXG4gICAgICAgICAgICBpZiBsYXN0Q29sdW1uID0gQGxhc3REaXJDb2x1bW4oKVxuICAgICAgICAgICAgICAgICMga2xvZyAnbGFzdENvbHVtbiBmb2N1cydcbiAgICAgICAgICAgICAgICBsYXN0Q29sdW1uLmZvY3VzKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgb3B0LmNiPyBjb2x1bW46Y29sLCBpdGVtOml0ZW1cblxuICAgICAgICBpZiBjb2wgPj0gMiBhbmQgQGNvbHVtbnNbMF0ud2lkdGgoKSA8IDI1MFxuICAgICAgICAgICAgQGNvbHVtbnNbMV0ubWFrZVJvb3QoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIG9uRmlsZTogKGZpbGUpID0+XG5cbiAgICAgICAga2xvZyAnb25GaWxlJyBmaWxlXG4gICAgICAgIHJldHVybiBpZiBub3QgZmlsZVxuICAgICAgICByZXR1cm4gaWYgbm90IEBmbGV4XG5cbiAgICAgICAgQG5hdmlnYXRlVG9GaWxlIGZpbGVcblxuICAgIG9uT3BlbkZpbGU6IChmaWxlKSA9PlxuICAgICAgICBcbiAgICAgICAgb3BlbiBmaWxlXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGluaXRDb2x1bW5zOiAtPlxuXG4gICAgICAgIHN1cGVyKClcblxuICAgICAgICBAdmlldy5pbnNlcnRCZWZvcmUgQHNoZWxmLmRpdiwgQHZpZXcuZmlyc3RDaGlsZFxuICAgICAgICBAdmlldy5pbnNlcnRCZWZvcmUgQHNoZWxmUmVzaXplLCBudWxsXG5cbiAgICAgICAgQHNoZWxmLmJyb3dzZXJEaWRJbml0Q29sdW1ucygpXG5cbiAgICAgICAgQHNldFNoZWxmU2l6ZSBAc2hlbGZTaXplXG5cbiAgICBjb2x1bW5BdFBvczogKHBvcykgLT5cblxuICAgICAgICBpZiBjb2x1bW4gPSBzdXBlciBwb3NcbiAgICAgICAgICAgIHJldHVybiBjb2x1bW5cblxuICAgICAgICBpZiBlbGVtLmNvbnRhaW5zUG9zIEBzaGVsZi5kaXYsIHBvc1xuICAgICAgICAgICAgcmV0dXJuIEBzaGVsZlxuICAgICAgICAgICAgXG4gICAgbGFzdENvbHVtblBhdGg6IC0+XG5cbiAgICAgICAgaWYgbGFzdENvbHVtbiA9IEBsYXN0VXNlZENvbHVtbigpXG4gICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtbi5wYXRoKClcblxuICAgIGxhc3REaXJDb2x1bW46IC0+XG5cbiAgICAgICAgaWYgbGFzdENvbHVtbiA9IEBsYXN0VXNlZENvbHVtbigpXG4gICAgICAgICAgICBpZiBsYXN0Q29sdW1uLmlzRGlyKClcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtblxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBsYXN0Q29sdW1uLnByZXZDb2x1bW4oKVxuXG4gICAgb25CYWNrc3BhY2VJbkNvbHVtbjogKGNvbHVtbikgLT5cblxuICAgICAgICBjb2x1bW4uYmFja3NwYWNlU2VhcmNoKClcbiAgICAgICAgXG4gICAgb25EZWxldGVJbkNvbHVtbjogKGNvbHVtbikgLT4gXG4gICAgXG4gICAgICAgIGlmIGNvbHVtbi5zZWFyY2hEaXZcbiAgICAgICAgICAgIGNvbHVtbi5jbGVhclNlYXJjaCgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNvbHVtbi5tb3ZlVG9UcmFzaCgpXG4gICAgICAgIFxuICAgIHVwZGF0ZUNvbHVtblNjcm9sbHM6ID0+XG5cbiAgICAgICAgc3VwZXIoKVxuICAgICAgICBAc2hlbGY/LnNjcm9sbC51cGRhdGUoKVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDBcblxuICAgIG9uU2hlbGZEcmFnOiAoZHJhZywgZXZlbnQpID0+XG5cbiAgICAgICAgc2hlbGZTaXplID0gY2xhbXAgMCwgNDAwLCBkcmFnLnBvcy54XG4gICAgICAgIEBzZXRTaGVsZlNpemUgc2hlbGZTaXplXG5cbiAgICBzZXRTaGVsZlNpemU6IChAc2hlbGZTaXplKSAtPlxuXG4gICAgICAgIHdpbmRvdy5zdGF0ZS5zZXQgJ3NoZWxmfHNpemUnIEBzaGVsZlNpemVcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmxlZnQgPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEBzaGVsZi5kaXYuc3R5bGUud2lkdGggPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEBjb2xzLnN0eWxlLmxlZnQgPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDBcblxuICAgIGdldEdpdFN0YXR1czogKGl0ZW0sIGNvbCkgPT5cblxuICAgICAgICBmaWxlID0gaXRlbS5maWxlID8gaXRlbS5wYXJlbnQ/LmZpbGVcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGZpbGVcblxuICAgICAgICBodWIuc3RhdHVzIGZpbGUsIChzdGF0dXMpID0+IEBhcHBseUdpdFN0YXR1c0ZpbGVzIGNvbCwgaHViLnN0YXR1c0ZpbGVzIHN0YXR1c1xuXG4gICAgYXBwbHlHaXRTdGF0dXNGaWxlczogKGNvbCwgZmlsZXMpID0+XG5cbiAgICAgICAgQGNvbHVtbnNbY29sXT8udXBkYXRlR2l0RmlsZXMgZmlsZXNcblxuICAgIG9uR2l0U3RhdHVzOiAoZ2l0RGlyLCBzdGF0dXMpID0+XG5cbiAgICAgICAgZmlsZXMgPSBodWIuc3RhdHVzRmlsZXMgc3RhdHVzXG4gICAgICAgIGZvciBjb2wgaW4gWzAuLkBjb2x1bW5zLmxlbmd0aF1cbiAgICAgICAgICAgIEBhcHBseUdpdFN0YXR1c0ZpbGVzIGNvbCwgZmlsZXNcblxuICAgICAgICBAc2hlbGY/LnVwZGF0ZUdpdEZpbGVzIGZpbGVzXG5cbiAgICAjIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMCAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAgICAwMDAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICAgIFxuICAgIFxuICAgIHRvZ2dsZVNoZWxmOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQHNoZWxmU2l6ZSA8IDFcbiAgICAgICAgICAgIEBzZXRTaGVsZlNpemUgMjAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBsYXN0VXNlZENvbHVtbigpPy5mb2N1cygpXG4gICAgICAgICAgICBAc2V0U2hlbGZTaXplIDBcbiAgICAgICAgICAgIFxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG4gICAgICAgIFxuICAgIHJlZnJlc2g6ID0+XG5cbiAgICAgICAgaHViLnJlZnJlc2goKVxuICAgICAgICBkaXJDYWNoZS5yZXNldCgpXG4gICAgICAgIEBzcmNDYWNoZSA9IHt9XG5cbiAgICAgICAgaWYgQGxhc3RVc2VkQ29sdW1uKClcbiAgICAgICAgICAgIGtsb2cgJ3JlZnJlc2gnIEBsYXN0VXNlZENvbHVtbigpPy5wYXRoKClcbiAgICAgICAgICAgIEBuYXZpZ2F0ZVRvRmlsZSBAbGFzdFVzZWRDb2x1bW4oKT8ucGF0aCgpXG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZUJyb3dzZXJcbiJdfQ==
//# sourceURL=../../coffee/browser/filebrowser.coffee