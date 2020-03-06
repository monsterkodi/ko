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
        return this.columns[col].table.appendChild(this.imageInfo(file));
    };

    FileBrowser.prototype.fileInfoColumn = function(col, file) {
        this.columns[col].crumb.hide();
        return this.columns[col].table.appendChild(this.fileInfo(file));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWJyb3dzZXIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2Jyb3dzZXIiLCJzb3VyY2VzIjpbImZpbGVicm93c2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxvSkFBQTtJQUFBOzs7O0FBUUEsTUFBNEUsT0FBQSxDQUFRLEtBQVIsQ0FBNUUsRUFBRSxTQUFGLEVBQUssaUJBQUwsRUFBWSxlQUFaLEVBQWtCLGVBQWxCLEVBQXdCLGlCQUF4QixFQUErQix1QkFBL0IsRUFBeUMsZUFBekMsRUFBK0MsZUFBL0MsRUFBcUQsZUFBckQsRUFBMkQsaUJBQTNELEVBQWtFOztBQUVsRSxPQUFBLEdBQVcsT0FBQSxDQUFRLFdBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxTQUFSOztBQUNYLE1BQUEsR0FBVyxPQUFBLENBQVEsVUFBUjs7QUFDWCxJQUFBLEdBQVcsT0FBQSxDQUFRLGVBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxtQkFBUjs7QUFDWCxHQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBQ1gsTUFBQSxHQUFXLE9BQUEsQ0FBUSxjQUFSOztBQUNYLE1BQUEsR0FBVyxPQUFBLENBQVEsUUFBUjs7QUFFTDs7O0lBRUMscUJBQUMsSUFBRDs7Ozs7Ozs7Ozs7Ozs7O1FBRUMsNkNBQU0sSUFBTjtRQUVBLE1BQU0sQ0FBQyxXQUFQLEdBQXFCO1FBRXJCLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsS0FBRCxHQUFVLElBQUksS0FBSixDQUFVLElBQVY7UUFDVixJQUFDLENBQUEsTUFBRCxHQUFVLElBQUksTUFBSixDQUFXLElBQVg7UUFDVixJQUFDLENBQUEsSUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLFFBQUQsR0FBWTtRQUVaLElBQUksQ0FBQyxFQUFMLENBQVEsTUFBUixFQUF5QixJQUFDLENBQUEsTUFBMUI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFFBQVIsRUFBeUIsSUFBQyxDQUFBLE1BQTFCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxhQUFSLEVBQXlCLElBQUMsQ0FBQSxhQUExQjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsVUFBUixFQUF5QixJQUFDLENBQUEsVUFBMUI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLGdCQUFSLEVBQXlCLElBQUMsQ0FBQSxjQUExQjtRQUVBLElBQUksQ0FBQyxFQUFMLENBQVEsV0FBUixFQUF5QixJQUFDLENBQUEsV0FBMUI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLGFBQVIsRUFBeUIsSUFBQyxDQUFBLGFBQTFCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxVQUFSLEVBQXlCLElBQUMsQ0FBQSxVQUExQjtRQUVBLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBQSxDQUFLLEtBQUwsRUFBVztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sYUFBUDtTQUFYO1FBQ2YsSUFBQyxDQUFBLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBbkIsR0FBOEI7UUFDOUIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBbkIsR0FBOEI7UUFDOUIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBbkIsR0FBOEI7UUFDOUIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBbkIsR0FBOEI7UUFDOUIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBbkIsR0FBOEI7UUFDOUIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBbkIsR0FBOEI7UUFFOUIsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFJLElBQUosQ0FDSjtZQUFBLE1BQUEsRUFBUyxJQUFDLENBQUEsV0FBVjtZQUNBLE1BQUEsRUFBUyxJQUFDLENBQUEsV0FEVjtTQURJO1FBSVIsSUFBQyxDQUFBLFNBQUQsR0FBYSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQWIsQ0FBaUIsWUFBakIsRUFBOEIsR0FBOUI7UUFFYixJQUFDLENBQUEsV0FBRCxDQUFBO0lBcENEOzswQkE0Q0gsVUFBQSxHQUFZLFNBQUMsTUFBRCxFQUFTLE9BQVQsRUFBa0IsTUFBbEI7QUFFUixZQUFBO1FBQUEsSUFBRyxLQUFLLENBQUMsTUFBTixDQUFhLE1BQWIsQ0FBSDtZQUVJLE1BQUEsR0FBUyxLQUFLLENBQUMsR0FBTixDQUFVLE1BQVYsRUFGYjs7QUFJQSxhQUFBLHlDQUFBOztZQUVJLElBQUcsTUFBQSxLQUFVLE1BQWI7Z0JBQ0ksSUFBRyxNQUFBLEtBQVUsTUFBVixJQUFvQixLQUFLLENBQUMsR0FBTixDQUFVLE1BQVYsQ0FBQSxLQUFxQixNQUE1QztvQkFDSSxJQUFBLENBQUssTUFBTCxFQUFZLE1BQVosRUFBb0IsTUFBcEI7QUFDQSwyQkFGSjtpQkFESjs7QUFGSjtBQU9BO2FBQUEsMkNBQUE7O0FBRUksb0JBQU8sTUFBUDtBQUFBLHFCQUNTLE1BRFQ7aUNBRVEsSUFBSSxDQUFDLE1BQUwsQ0FBWSxNQUFaLEVBQW9CLE1BQXBCLEVBQTRCLENBQUEsU0FBQSxLQUFBOytCQUFBLFNBQUMsTUFBRCxFQUFTLE1BQVQ7QUFDeEIsZ0NBQUE7NEJBQUEsSUFBRyxZQUFBLEdBQWUsS0FBQyxDQUFBLGFBQUQsQ0FBZSxNQUFmLENBQWxCO2dDQUNJLFlBQVksQ0FBQyxVQUFiLENBQXdCLE1BQXhCLEVBREo7OzRCQUVBLElBQUcsWUFBQSxHQUFlLEtBQUMsQ0FBQSxhQUFELENBQWUsTUFBZixDQUFsQjtnQ0FDSSxJQUFHLENBQUksWUFBWSxDQUFDLEdBQWIsQ0FBaUIsTUFBakIsQ0FBUDsyQ0FDSSxZQUFZLENBQUMsVUFBYixDQUF3QixNQUF4QixFQURKO2lDQURKOzt3QkFId0I7b0JBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE1QjtBQURDO0FBRFQscUJBUVMsTUFSVDtpQ0FTUSxJQUFJLENBQUMsSUFBTCxDQUFVLE1BQVYsRUFBa0IsTUFBbEIsRUFBMEIsQ0FBQSxTQUFBLEtBQUE7K0JBQUEsU0FBQyxNQUFELEVBQVMsTUFBVDtBQUN0QixnQ0FBQTs0QkFBQSxJQUFHLFlBQUEsR0FBZSxLQUFDLENBQUEsYUFBRCxDQUFlLE1BQWYsQ0FBbEI7Z0NBQ0ksSUFBRyxDQUFJLFlBQVksQ0FBQyxHQUFiLENBQWlCLE1BQWpCLENBQVA7MkNBQ0ksWUFBWSxDQUFDLFVBQWIsQ0FBd0IsTUFBeEIsRUFESjtpQ0FESjs7d0JBRHNCO29CQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBMUI7QUFEQztBQVJUOztBQUFBO0FBRko7O0lBYlE7OzBCQTZCWixhQUFBLEdBQWUsU0FBQyxJQUFEO0FBRVgsWUFBQTtBQUFBO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSwwQ0FBZ0IsQ0FBRSxjQUFmLEtBQXVCLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixDQUExQjtBQUNJLHVCQUFPLE9BRFg7O0FBREo7SUFGVzs7MEJBWWYsaUJBQUEsR0FBbUIsU0FBQyxJQUFEO0FBRWYsWUFBQTtRQUFBLEdBQUEsR0FBTTtBQUVOO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxJQUFHLE1BQU0sQ0FBQyxLQUFQLENBQUEsQ0FBQSxJQUFtQixJQUFJLENBQUMsVUFBTCxDQUFnQixNQUFNLENBQUMsSUFBUCxDQUFBLENBQWhCLENBQXRCO2dCQUNJLEdBQUEsSUFBTyxFQURYO2FBQUEsTUFBQTtBQUdJLHNCQUhKOztBQURKO1FBTUEsSUFBRyxHQUFBLEtBQU8sQ0FBUCxJQUFhLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixDQUFBLDZDQUE4QixDQUFFLElBQWIsQ0FBQSxXQUFuQztBQUNJLG1CQUFPLEVBRFg7O2VBRUEsSUFBSSxDQUFDLEdBQUwsQ0FBUyxDQUFDLENBQVYsRUFBYSxHQUFBLEdBQUksQ0FBakI7SUFaZTs7MEJBY25CLE1BQUEsR0FBUSxTQUFDLElBQUQsRUFBTyxHQUFQO1FBRUosSUFBRyxJQUFIO21CQUFhLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLENBQVYsRUFBMkIsR0FBM0IsRUFBYjs7SUFGSTs7MEJBSVIsY0FBQSxHQUFnQixTQUFDLElBQUQ7QUFFWixZQUFBO1FBQUEsUUFBQSwrQ0FBMkIsQ0FBRSxJQUFsQixDQUFBO1FBRVgsSUFBQSxHQUFPLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWDtRQUlQLElBQUcsSUFBQSxLQUFRLFFBQVIsSUFBb0IsSUFBQSxLQUFRLElBQUMsQ0FBQSxjQUFELENBQUEsQ0FBNUIsSUFBaUQsS0FBSyxDQUFDLFVBQU4sQ0FBaUIsSUFBakIsQ0FBcEQ7QUFDSSxtQkFESjs7UUFHQSxHQUFBLEdBQU0sSUFBQyxDQUFBLGlCQUFELENBQW1CLElBQW5CO1FBRU4sUUFBQSxHQUFXLEtBQUssQ0FBQyxRQUFOLENBQWUsSUFBZjtRQUVYLElBQUcsR0FBQSxJQUFPLENBQVY7WUFDSSxLQUFBLEdBQVEsUUFBUSxDQUFDLEtBQVQsQ0FBZSxRQUFRLENBQUMsT0FBVCxDQUFpQixJQUFDLENBQUEsT0FBUSxDQUFBLEdBQUEsQ0FBSSxDQUFDLElBQWQsQ0FBQSxDQUFqQixDQUFBLEdBQXVDLENBQXRELEVBRFo7U0FBQSxNQUFBO1lBR0ksS0FBQSxHQUFRLFFBQVEsQ0FBQyxLQUFULENBQWUsUUFBUSxDQUFDLE1BQVQsR0FBZ0IsQ0FBL0IsRUFIWjs7UUFLQSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsR0FBQSxHQUFJLENBQXRCLEVBQXlCO1lBQUEsR0FBQSxFQUFJLElBQUo7WUFBUyxLQUFBLEVBQU0sR0FBQSxHQUFJLEtBQUssQ0FBQyxNQUF6QjtTQUF6QjtBQUVBLGVBQU0sSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFBLEdBQWEsS0FBSyxDQUFDLE1BQXpCO1lBQ0ksSUFBQyxDQUFBLFNBQUQsQ0FBQTtRQURKO0FBR0EsYUFBYSxrR0FBYjtZQUVJLElBQUEsR0FBTyxJQUFDLENBQUEsUUFBRCxDQUFVLEtBQU0sQ0FBQSxLQUFBLENBQWhCO0FBRVAsb0JBQU8sSUFBSSxDQUFDLElBQVo7QUFBQSxxQkFDUyxNQURUO29CQUdRLElBQUMsQ0FBQSxZQUFELENBQWMsSUFBZCxFQUFvQixHQUFBLEdBQUksQ0FBSixHQUFNLEtBQTFCO0FBRkM7QUFEVCxxQkFJUyxLQUpUO29CQUtRLEdBQUEsR0FBTTtvQkFDTixJQUFHLEtBQUEsR0FBUSxLQUFLLENBQUMsTUFBTixHQUFhLENBQXhCO3dCQUNJLEdBQUcsQ0FBQyxNQUFKLEdBQWEsS0FBTSxDQUFBLEtBQUEsR0FBTSxDQUFOLEVBRHZCOztvQkFFQSxJQUFDLENBQUEsV0FBRCxDQUFhLElBQWIsRUFBbUIsR0FBQSxHQUFJLENBQUosR0FBTSxLQUF6QixFQUFnQyxHQUFoQztBQVJSO0FBSko7UUFjQSxJQUFHLEdBQUEsR0FBTSxJQUFDLENBQUEsYUFBRCxDQUFBLENBQVQ7WUFFSSxJQUFHLEdBQUEsR0FBTSxHQUFHLENBQUMsR0FBSixDQUFRLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxDQUFSLENBQVQ7dUJBQ0ksR0FBRyxDQUFDLFNBQUosQ0FBQSxFQURKO2FBRko7O0lBdkNZOzswQkFrRGhCLFFBQUEsR0FBVSxTQUFDLElBQUQ7QUFFTixZQUFBO1FBQUEsQ0FBQSxHQUFJLEtBQUssQ0FBQyxPQUFOLENBQWMsSUFBZDtlQUVKO1lBQUEsSUFBQSxFQUFLLENBQUw7WUFDQSxJQUFBLEVBQUssS0FBSyxDQUFDLE1BQU4sQ0FBYSxDQUFiLENBQUEsSUFBb0IsTUFBcEIsSUFBOEIsS0FEbkM7WUFFQSxJQUFBLEVBQUssS0FBSyxDQUFDLElBQU4sQ0FBVyxDQUFYLENBRkw7O0lBSk07OzBCQVFWLGFBQUEsR0FBZSxTQUFDLE1BQUQsRUFBUyxJQUFULEVBQWUsR0FBZjtBQUVYLGdCQUFPLE1BQVA7QUFBQSxpQkFDUyxVQURUO3VCQUM2QixJQUFDLENBQUEsUUFBRCxDQUFjLElBQWQsRUFBb0IsR0FBcEI7QUFEN0IsaUJBRVMsY0FGVDt1QkFFNkIsSUFBQyxDQUFBLFlBQUQsQ0FBYyxJQUFkLEVBQW9CLEdBQXBCO0FBRjdCO0lBRlc7OzBCQVlmLE9BQUEsR0FBUyxTQUFDLElBQUQ7ZUFBVSxJQUFDLENBQUEsUUFBRCxDQUFVO1lBQUEsSUFBQSxFQUFLLEtBQUw7WUFBVyxJQUFBLEVBQUssSUFBaEI7U0FBVjtJQUFWOzswQkFFVCxRQUFBLEdBQVUsU0FBQyxJQUFELEVBQU8sR0FBUDtBQUVOLFlBQUE7O1lBQUE7O1lBQUEsTUFBTztnQkFBQSxNQUFBLEVBQU8sSUFBUDtnQkFBWSxLQUFBLEVBQU0sSUFBbEI7Ozs7WUFDUCxJQUFJLENBQUM7O1lBQUwsSUFBSSxDQUFDLE9BQVEsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFJLENBQUMsSUFBaEI7O1FBRWIsSUFBQyxDQUFBLGdCQUFELENBQWtCLENBQWxCLEVBQXFCO1lBQUEsR0FBQSxFQUFJLElBQUo7WUFBVSxLQUFBLHNDQUFrQixDQUE1QjtTQUFyQjtBQUVBLGdCQUFPLElBQUksQ0FBQyxJQUFaO0FBQUEsaUJBQ1MsS0FEVDtnQkFDcUIsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFiLEVBQW1CLENBQW5CLEVBQXNCLEdBQXRCO0FBQVo7QUFEVCxpQkFFUyxNQUZUO2dCQUdRLEdBQUcsQ0FBQyxRQUFKLEdBQWUsSUFBSSxDQUFDO0FBQ3BCLHVCQUFNLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBQSxHQUFhLENBQW5CO29CQUEwQixJQUFDLENBQUEsU0FBRCxDQUFBO2dCQUExQjtnQkFDQSxJQUFDLENBQUEsV0FBRCxDQUFhLElBQUMsQ0FBQSxRQUFELENBQVUsS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFJLENBQUMsSUFBZixDQUFWLENBQWIsRUFBOEMsQ0FBOUMsRUFBaUQsR0FBakQ7QUFMUjtRQU9BLElBQUcsR0FBRyxDQUFDLEtBQVA7MERBQ2UsQ0FBRSxLQUFiLENBQUEsV0FESjs7SUFkTTs7MEJBdUJWLFlBQUEsR0FBYyxTQUFDLElBQUQsRUFBTyxHQUFQO1FBR1YsSUFBQyxDQUFBLGdCQUFELENBQWtCLEdBQUEsR0FBSSxDQUF0QixFQUF3QjtZQUFBLEdBQUEsRUFBSSxJQUFKO1NBQXhCO0FBRUEsZ0JBQU8sSUFBSSxDQUFDLElBQVo7QUFBQSxpQkFDUyxLQURUO3VCQUVRLElBQUMsQ0FBQSxXQUFELENBQWMsSUFBZCxFQUFvQixHQUFBLEdBQUksQ0FBeEIsRUFBMkI7b0JBQUEsS0FBQSxFQUFNLEtBQU47aUJBQTNCO0FBRlIsaUJBR1MsTUFIVDtnQkFJUSxJQUFDLENBQUEsWUFBRCxDQUFjLElBQWQsRUFBb0IsR0FBQSxHQUFJLENBQXhCO2dCQUNBLElBQUcsSUFBSSxDQUFDLFFBQUwsSUFBaUIsSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFJLENBQUMsSUFBakIsQ0FBcEI7MkJBRUksSUFBSSxDQUFDLElBQUwsQ0FBVSxZQUFWLEVBQXVCLElBQXZCLEVBRko7O0FBTFI7SUFMVTs7MEJBb0JkLFlBQUEsR0FBYyxTQUFDLElBQUQsRUFBTyxHQUFQO0FBR1YsWUFBQTs7WUFIaUIsTUFBSTs7UUFHckIsSUFBQyxDQUFBLGdCQUFELENBQWtCLEdBQWxCLEVBQXVCO1lBQUEsR0FBQSxFQUFJLElBQUo7U0FBdkI7QUFFQSxlQUFNLEdBQUEsSUFBTyxJQUFDLENBQUEsT0FBRCxDQUFBLENBQWI7WUFDSSxJQUFDLENBQUEsU0FBRCxDQUFBO1FBREo7UUFHQSxJQUFBLEdBQU8sSUFBSSxDQUFDO1FBRVosSUFBQyxDQUFBLE9BQVEsQ0FBQSxHQUFBLENBQUksQ0FBQyxNQUFkLEdBQXVCO1FBRXZCLElBQUcsSUFBSSxDQUFDLE9BQUwsQ0FBYSxJQUFiLENBQUg7WUFDSSxJQUFDLENBQUEsZUFBRCxDQUFpQixHQUFqQixFQUFzQixJQUF0QixFQURKO1NBQUEsTUFBQTtBQUdJLG9CQUFPLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixDQUFQO0FBQUEscUJBQ1MsTUFEVDtBQUFBLHFCQUNnQixLQURoQjtvQkFFUSxJQUFHLENBQUksS0FBSyxDQUFDLEdBQU4sQ0FBQSxDQUFQO3dCQUNJLElBQUMsQ0FBQSxZQUFELENBQWMsR0FBZCxFQURKO3FCQUFBLE1BQUE7d0JBR0ksSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsR0FBaEIsRUFBcUIsSUFBckIsRUFISjs7QUFEUTtBQURoQixxQkFNUyxLQU5UO29CQU9RLElBQUcsQ0FBSSxLQUFLLENBQUMsR0FBTixDQUFBLENBQVA7d0JBQ0ksSUFBQyxDQUFBLFVBQUQsQ0FBWSxHQUFaLEVBREo7cUJBQUEsTUFBQTt3QkFHSSxJQUFDLENBQUEsY0FBRCxDQUFnQixHQUFoQixFQUFxQixJQUFyQixFQUhKOztBQURDO0FBTlQ7b0JBWVEsSUFBRyxJQUFJLENBQUMsTUFBTCxDQUFZLElBQUksQ0FBQyxJQUFqQixDQUFIO3dCQUNJLElBQUMsQ0FBQSxjQUFELENBQWdCLElBQWhCLEVBQXNCLEdBQXRCLEVBREo7O29CQUVBLElBQUcsQ0FBSSxJQUFJLENBQUMsTUFBTCxDQUFZLElBQUksQ0FBQyxJQUFqQixDQUFQO3dCQUNJLElBQUMsQ0FBQSxjQUFELENBQWdCLEdBQWhCLEVBQXFCLElBQXJCLEVBREo7O0FBZFIsYUFISjs7UUFvQkEsSUFBSSxDQUFDLElBQUwsQ0FBVSxNQUFWLEVBQWlCO1lBQUEsTUFBQSxFQUFPLEdBQVA7WUFBWSxJQUFBLEVBQUssSUFBakI7U0FBakI7ZUFFQSxJQUFDLENBQUEsbUJBQUQsQ0FBQTtJQWxDVTs7MEJBb0NkLGVBQUEsR0FBaUIsU0FBQyxHQUFELEVBQU0sSUFBTjtRQUViLElBQUMsQ0FBQSxPQUFRLENBQUEsR0FBQSxDQUFJLENBQUMsS0FBSyxDQUFDLElBQXBCLENBQUE7ZUFDQSxJQUFDLENBQUEsT0FBUSxDQUFBLEdBQUEsQ0FBSSxDQUFDLEtBQUssQ0FBQyxXQUFwQixDQUFnQyxJQUFDLENBQUEsU0FBRCxDQUFXLElBQVgsQ0FBaEM7SUFIYTs7MEJBS2pCLGNBQUEsR0FBZ0IsU0FBQyxHQUFELEVBQU0sSUFBTjtRQUVaLElBQUMsQ0FBQSxPQUFRLENBQUEsR0FBQSxDQUFJLENBQUMsS0FBSyxDQUFDLElBQXBCLENBQUE7ZUFDQSxJQUFDLENBQUEsT0FBUSxDQUFBLEdBQUEsQ0FBSSxDQUFDLEtBQUssQ0FBQyxXQUFwQixDQUFnQyxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsQ0FBaEM7SUFIWTs7MEJBV2hCLFNBQUEsR0FBVyxTQUFDLElBQUQ7QUFFUCxZQUFBO1FBQUEsSUFBQSxDQUFLLFdBQUwsRUFBaUIsSUFBakI7UUFDQSxHQUFBLEdBQU0sSUFBQSxDQUFLLEtBQUwsRUFBVztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sY0FBTjtZQUFxQixHQUFBLEVBQUksS0FBSyxDQUFDLE9BQU4sQ0FBYyxJQUFkLENBQXpCO1NBQVg7UUFDTixHQUFBLEdBQU0sSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSx1QkFBTjtZQUE4QixLQUFBLEVBQU0sR0FBcEM7U0FBTDtRQUNOLEdBQUcsQ0FBQyxnQkFBSixDQUFxQixVQUFyQixFQUFnQyxDQUFBLFNBQUEsS0FBQTttQkFBQSxTQUFBO2dCQUFHLFlBQUEsQ0FBYSxLQUFDLENBQUEsU0FBZDt1QkFBeUIsSUFBQSxDQUFLLElBQUw7WUFBNUI7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWhDO1FBRUEsR0FBRyxDQUFDLE1BQUosR0FBYSxTQUFBO0FBQ1QsZ0JBQUE7WUFBQSxHQUFBLEdBQUssQ0FBQSxDQUFFLGVBQUY7WUFDTCxFQUFBLEdBQUssR0FBRyxDQUFDLHFCQUFKLENBQUE7WUFDTCxDQUFBLEdBQUksR0FBRyxDQUFDO1lBQ1IsS0FBQSxHQUFTLFFBQUEsQ0FBUyxFQUFFLENBQUMsS0FBSCxHQUFXLEVBQUUsQ0FBQyxJQUFkLEdBQXFCLENBQTlCO1lBQ1QsTUFBQSxHQUFTLFFBQUEsQ0FBUyxFQUFFLENBQUMsTUFBSCxHQUFZLEVBQUUsQ0FBQyxHQUFmLEdBQXFCLENBQTlCO1lBRVQsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFWLEdBQXNCO1lBQ3RCLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBVixHQUFzQjtZQUV0QixJQUFBLEdBQU8sS0FBSyxDQUFDLFVBQU4sQ0FBaUIsSUFBakI7WUFDUCxJQUFBLEdBQU8sTUFBQSxDQUFPLElBQUksQ0FBQyxJQUFaLENBQWlCLENBQUMsS0FBbEIsQ0FBd0IsR0FBeEI7WUFFUCxHQUFBLEdBQU0sTUFBQSxDQUFBLENBQVEsQ0FBQyxFQUFULENBQVksTUFBQSxDQUFPLElBQUksQ0FBQyxLQUFaLENBQVosRUFBZ0MsSUFBaEM7WUFDTixPQUFlLEdBQUcsQ0FBQyxLQUFKLENBQVUsR0FBVixDQUFmLEVBQUMsYUFBRCxFQUFNO1lBQ04sSUFBYSxHQUFJLENBQUEsQ0FBQSxDQUFKLEtBQVUsR0FBdkI7Z0JBQUEsR0FBQSxHQUFNLElBQU47O1lBRUEsSUFBQSxHQUFRLG9CQUFBLEdBQXFCLEtBQXJCLEdBQTJCLDhCQUEzQixHQUF5RCxNQUF6RCxHQUFnRTtZQUN4RSxJQUFBLElBQVEsVUFBQSxHQUFXLElBQUssQ0FBQSxDQUFBLENBQWhCLEdBQW1CLFdBQW5CLEdBQThCLElBQUssQ0FBQSxDQUFBLENBQW5DLEdBQXNDO1lBQzlDLElBQUEsSUFBUSxVQUFBLEdBQVcsR0FBWCxHQUFlLFdBQWYsR0FBMEIsS0FBMUIsR0FBZ0M7WUFFeEMsSUFBQSxHQUFPLElBQUEsQ0FBSztnQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLGlCQUFOO2dCQUF3QixRQUFBLEVBQVU7b0JBQzFDLElBQUEsQ0FBSyxLQUFMLEVBQVc7d0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxlQUFBLEdBQWUsQ0FBQyxLQUFLLENBQUMsR0FBTixDQUFVLElBQVYsQ0FBRCxDQUFyQjt3QkFBdUMsSUFBQSxFQUFLLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBVixDQUE1QztxQkFBWCxDQUQwQyxFQUUxQyxJQUFBLENBQUssT0FBTCxFQUFhO3dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sY0FBTjt3QkFBcUIsSUFBQSxFQUFLLElBQTFCO3FCQUFiLENBRjBDO2lCQUFsQzthQUFMO1lBSVAsR0FBQSxHQUFLLENBQUEsQ0FBRSx3QkFBRjttQkFDTCxHQUFHLENBQUMsV0FBSixDQUFnQixJQUFoQjtRQTFCUztlQTRCYjtJQW5DTzs7MEJBMkNYLFFBQUEsR0FBVSxTQUFDLElBQUQ7QUFFTixZQUFBO1FBQUEsSUFBQSxDQUFLLFVBQUwsRUFBZ0IsSUFBaEI7UUFFQSxJQUFBLEdBQU8sS0FBSyxDQUFDLFVBQU4sQ0FBaUIsSUFBakI7UUFDUCxJQUFBLEdBQU8sTUFBQSxDQUFPLElBQUksQ0FBQyxJQUFaLENBQWlCLENBQUMsS0FBbEIsQ0FBd0IsR0FBeEI7UUFFUCxDQUFBLEdBQUksTUFBQSxDQUFPLElBQUksQ0FBQyxLQUFaO1FBRUosR0FBQSxHQUFNLE1BQUEsQ0FBQSxDQUFRLENBQUMsRUFBVCxDQUFZLENBQVosRUFBZSxJQUFmO1FBQ04sT0FBZSxHQUFHLENBQUMsS0FBSixDQUFVLEdBQVYsQ0FBZixFQUFDLGFBQUQsRUFBTTtRQUNOLElBQWEsR0FBSSxDQUFBLENBQUEsQ0FBSixLQUFVLEdBQXZCO1lBQUEsR0FBQSxHQUFNLElBQU47O1FBQ0EsSUFBRyxLQUFBLEtBQVMsS0FBWjtZQUNJLEdBQUEsR0FBTSxNQUFBLENBQUEsQ0FBUSxDQUFDLElBQVQsQ0FBYyxDQUFkLEVBQWlCLFNBQWpCO1lBQ04sS0FBQSxHQUFRLFVBRlo7O1FBSUEsSUFBQSxHQUFPLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0saUJBQU47WUFBd0IsUUFBQSxFQUFVO2dCQUMxQyxJQUFBLENBQUssS0FBTCxFQUFXO29CQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sZUFBQSxHQUFlLENBQUMsS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWLENBQUQsQ0FBZixHQUErQixHQUEvQixHQUFpQyxDQUFDLElBQUksQ0FBQyxhQUFMLENBQW1CLElBQW5CLENBQUQsQ0FBdkM7aUJBQVgsQ0FEMEMsRUFFMUMsSUFBQSxDQUFLLEtBQUwsRUFBVztvQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLGVBQUEsR0FBZSxDQUFDLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixDQUFELENBQXJCO29CQUF1QyxJQUFBLEVBQUssSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFWLENBQTVDO2lCQUFYLENBRjBDLEVBRzFDLElBQUEsQ0FBSyxPQUFMLEVBQWE7b0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxjQUFOO29CQUFxQixJQUFBLEVBQUssVUFBQSxHQUFXLElBQUssQ0FBQSxDQUFBLENBQWhCLEdBQW1CLFdBQW5CLEdBQThCLElBQUssQ0FBQSxDQUFBLENBQW5DLEdBQXNDLG9CQUF0QyxHQUEwRCxHQUExRCxHQUE4RCxXQUE5RCxHQUF5RSxLQUF6RSxHQUErRSxZQUF6RztpQkFBYixDQUgwQzthQUFsQztTQUFMO2VBTVA7SUF0Qk07OzBCQThCVCxVQUFBLEdBQVksU0FBQyxHQUFEO0FBRVIsWUFBQTtBQUFBO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxJQUFHLE1BQU0sQ0FBQyxJQUFQLENBQUEsQ0FBQSxLQUFpQixHQUFwQjtnQkFDSSxJQUFDLENBQUEsV0FBRCxDQUFhO29CQUFDLElBQUEsRUFBSyxHQUFOO29CQUFXLElBQUEsRUFBSyxLQUFoQjtpQkFBYixFQUFxQyxNQUFNLENBQUMsS0FBNUMsRUFBbUQ7b0JBQUEsTUFBQSxFQUFPLE1BQU0sQ0FBQyxVQUFQLENBQUEsQ0FBUDtpQkFBbkQ7QUFDQSx1QkFGSjs7QUFESjtJQUZROzswQkFhWixhQUFBLEdBQWUsU0FBQyxJQUFELEVBQU8sSUFBUDtBQUVYLFlBQUE7UUFBQSxJQUFDLENBQUEsUUFBUyxDQUFBLElBQUEsQ0FBVixHQUFrQjtRQUVsQixJQUFHLElBQUEsa0ZBQWlDLENBQUUsdUJBQXRDO21CQUNJLElBQUMsQ0FBQSxjQUFELENBQWdCO2dCQUFFLElBQUEsRUFBSyxJQUFQO2dCQUFhLElBQUEsRUFBSyxNQUFsQjthQUFoQiwrQ0FBNkQsQ0FBRSxjQUEvRCxFQURKOztJQUpXOzswQkFhaEIsY0FBQSxHQUFnQixTQUFDLElBQUQsRUFBTyxHQUFQO0FBR1osWUFBQTtRQUFBLElBQU8sZ0NBQVA7WUFFSSxJQUFDLENBQUEsUUFBUyxDQUFBLElBQUksQ0FBQyxJQUFMLENBQVYsR0FBdUIsSUFBSSxDQUFDLEdBQUwsQ0FBUyxTQUFULEVBQW1CLE1BQW5CLEVBQTBCLElBQUksQ0FBQyxJQUEvQixFQUYzQjs7UUFJQSxJQUFBLEdBQU8sSUFBQyxDQUFBLFFBQVMsQ0FBQSxJQUFJLENBQUMsSUFBTDtRQUVqQixJQUFHLEtBQUEsQ0FBTSxJQUFOLENBQUg7WUFDSSxJQUFDLENBQUEsT0FBUSxDQUFBLEdBQUEsQ0FBSSxDQUFDLFNBQWQsQ0FBd0IsRUFBeEIsRUFBNEIsSUFBNUI7QUFDQSxtQkFGSjs7UUFJQSxLQUFBLEdBQVE7UUFDUixLQUFBLDBDQUF1QjtBQUN2QixhQUFBLHVDQUFBOztZQUNJLElBQUEsR0FBTyxJQUFBLEdBQUssSUFBSSxDQUFDO1lBQ2pCLEtBQUssQ0FBQyxJQUFOLENBQVc7Z0JBQUEsSUFBQSxFQUFLLElBQUksQ0FBQyxJQUFWO2dCQUFnQixJQUFBLEVBQUssSUFBckI7Z0JBQTJCLElBQUEsRUFBSyxPQUFoQztnQkFBeUMsSUFBQSxFQUFLLElBQUksQ0FBQyxJQUFuRDtnQkFBeUQsSUFBQSxFQUFLLElBQUksQ0FBQyxJQUFuRTthQUFYO0FBRko7UUFJQSxLQUFBLHdDQUFxQjtBQUNyQixhQUFBLHlDQUFBOztZQUNJLElBQUcsSUFBSSxDQUFDLElBQUwsS0FBYSxVQUFoQjtnQkFDSSxJQUFBLEdBQU8sSUFBQSxHQUFLLElBQUksQ0FBQyxLQURyQjthQUFBLE1BRUssSUFBRyxJQUFJLEVBQUMsTUFBRCxFQUFQO2dCQUNELElBQUEsR0FBTyxNQUFBLEdBQU8sSUFBSSxDQUFDLEtBRGxCO2FBQUEsTUFFQSxJQUFHLElBQUksQ0FBQyxJQUFSO2dCQUNELElBQUEsR0FBTyxNQUFBLEdBQU8sSUFBSSxDQUFDLEtBRGxCO2FBQUEsTUFBQTtnQkFHRCxJQUFBLEdBQU8sTUFBQSxHQUFPLElBQUksQ0FBQyxLQUhsQjs7WUFJTCxLQUFLLENBQUMsSUFBTixDQUFXO2dCQUFBLElBQUEsRUFBSyxJQUFJLENBQUMsSUFBVjtnQkFBZ0IsSUFBQSxFQUFLLElBQXJCO2dCQUEyQixJQUFBLEVBQUssTUFBaEM7Z0JBQXdDLElBQUEsRUFBSyxJQUFJLENBQUMsSUFBbEQ7Z0JBQXdELElBQUEsRUFBSyxJQUFJLENBQUMsSUFBbEU7YUFBWDtBQVRKO1FBV0EsSUFBRyxLQUFBLENBQU0sS0FBTixDQUFIO1lBQ0ksS0FBSyxDQUFDLElBQU4sQ0FBVyxTQUFDLENBQUQsRUFBRyxDQUFIO3VCQUFTLENBQUMsQ0FBQyxJQUFGLEdBQVMsQ0FBQyxDQUFDO1lBQXBCLENBQVg7bUJBQ0EsSUFBQyxDQUFBLE9BQVEsQ0FBQSxHQUFBLENBQUksQ0FBQyxTQUFkLENBQXdCLEtBQXhCLEVBQStCLElBQS9CLEVBRko7O0lBL0JZOzswQkF5Q2hCLFdBQUEsR0FBYSxTQUFDLElBQUQsRUFBTyxHQUFQLEVBQWMsR0FBZDtBQUVULFlBQUE7O1lBRmdCLE1BQUk7OztZQUFHLE1BQUk7O1FBRTNCLElBQVUsR0FBQSxHQUFNLENBQU4sSUFBWSxJQUFJLENBQUMsSUFBTCxLQUFhLEdBQW5DO0FBQUEsbUJBQUE7O1FBRUEsR0FBQSxHQUFNLElBQUksQ0FBQztRQUVYLElBQUcsUUFBUSxDQUFDLEdBQVQsQ0FBYSxHQUFiLENBQUEsSUFBc0IsQ0FBSSxHQUFHLENBQUMsV0FBakM7WUFFSSxJQUFDLENBQUEsWUFBRCxDQUFjLEdBQWQsRUFBbUIsSUFBbkIsRUFBeUIsUUFBUSxDQUFDLEdBQVQsQ0FBYSxHQUFiLENBQXpCLEVBQTRDLEdBQTVDLEVBQWlELEdBQWpEO21CQUNBLElBQUksQ0FBQyxJQUFMLENBQVUsS0FBVixFQUFnQixHQUFoQixFQUhKO1NBQUEsTUFBQTtZQUtJLEdBQUcsQ0FBQyxZQUFKLEdBQW1CLENBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFiLENBQWlCLHFCQUFBLEdBQXNCLEdBQXZDO1lBQ3ZCLEdBQUcsQ0FBQyxRQUFKLEdBQWU7bUJBQ2YsS0FBSyxDQUFDLElBQU4sQ0FBVyxHQUFYLEVBQWdCLEdBQWhCLEVBQXFCLENBQUEsU0FBQSxLQUFBO3VCQUFBLFNBQUMsS0FBRDtvQkFFakIsSUFBSSxDQUFDLE1BQUwsQ0FBWSxXQUFaLEVBQXdCLEdBQXhCO29CQUVBLFFBQVEsQ0FBQyxHQUFULENBQWEsR0FBYixFQUFrQixLQUFsQjtvQkFDQSxLQUFDLENBQUEsWUFBRCxDQUFjLEdBQWQsRUFBbUIsSUFBbkIsRUFBeUIsS0FBekIsRUFBZ0MsR0FBaEMsRUFBcUMsR0FBckM7MkJBQ0EsSUFBSSxDQUFDLElBQUwsQ0FBVSxLQUFWLEVBQWdCLEdBQWhCO2dCQU5pQjtZQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBckIsRUFQSjs7SUFOUzs7MEJBcUJiLFlBQUEsR0FBYyxTQUFDLEdBQUQsRUFBTSxJQUFOLEVBQVksS0FBWixFQUFtQixHQUFuQixFQUF3QixHQUF4QjtBQUVWLFlBQUE7UUFBQSxJQUFDLENBQUEsbUJBQUQsQ0FBQTtBQUVBLGVBQU0sR0FBQSxJQUFPLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBYjtZQUNJLElBQUMsQ0FBQSxTQUFELENBQUE7UUFESjtRQUdBLElBQUMsQ0FBQSxPQUFRLENBQUEsR0FBQSxDQUFJLENBQUMsU0FBZCxDQUF3QixLQUF4QixFQUErQixJQUEvQjtRQUVBLElBQUksQ0FBQyxJQUFMLENBQVUsTUFBVixFQUFpQjtZQUFBLE1BQUEsRUFBTyxHQUFQO1lBQVksSUFBQSxFQUFLLElBQWpCO1NBQWpCO1FBRUEsSUFBRyxHQUFHLENBQUMsUUFBUDtZQUNJLElBQUcsR0FBQSxHQUFNLElBQUMsQ0FBQSxPQUFRLENBQUEsR0FBQSxDQUFJLENBQUMsR0FBZCxDQUFrQixLQUFLLENBQUMsSUFBTixDQUFXLEdBQUcsQ0FBQyxRQUFmLENBQWxCLENBQVQ7Z0JBQ0ksR0FBRyxDQUFDLFFBQUosQ0FBQTtnQkFDQSxJQUFJLENBQUMsSUFBTCxDQUFVLE1BQVYsRUFBaUI7b0JBQUEsTUFBQSxFQUFPLEdBQUEsR0FBSSxDQUFYO29CQUFhLElBQUEsRUFBSyxHQUFHLENBQUMsSUFBdEI7aUJBQWpCLEVBRko7YUFESjtTQUFBLE1BSUssSUFBRyxHQUFHLENBQUMsTUFBUDs7b0JBQ3VDLENBQUUsU0FBMUMsQ0FBQTthQURDOztRQUdMLElBQUMsQ0FBQSxZQUFELENBQWMsSUFBZCxFQUFvQixHQUFwQjtRQUVBLElBQUcsR0FBRyxDQUFDLEtBQUosS0FBYSxLQUFiLElBQXVCLEtBQUEsQ0FBTSxRQUFRLENBQUMsYUFBZixDQUF2QixJQUF5RCxLQUFBLG9DQUFpQixDQUFFLGtCQUFuQixDQUE1RDtZQUNJLElBQUcsVUFBQSxHQUFhLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBaEI7Z0JBRUksVUFBVSxDQUFDLEtBQVgsQ0FBQSxFQUZKO2FBREo7OztZQUtBLEdBQUcsQ0FBQyxHQUFJO2dCQUFBLE1BQUEsRUFBTyxHQUFQO2dCQUFZLElBQUEsRUFBSyxJQUFqQjs7O1FBRVIsSUFBRyxHQUFBLElBQU8sQ0FBUCxJQUFhLElBQUMsQ0FBQSxPQUFRLENBQUEsQ0FBQSxDQUFFLENBQUMsS0FBWixDQUFBLENBQUEsR0FBc0IsR0FBdEM7bUJBQ0ksSUFBQyxDQUFBLE9BQVEsQ0FBQSxDQUFBLENBQUUsQ0FBQyxRQUFaLENBQUEsRUFESjs7SUEzQlU7OzBCQW9DZCxNQUFBLEdBQVEsU0FBQyxJQUFEO1FBR0osSUFBVSxDQUFJLElBQWQ7QUFBQSxtQkFBQTs7UUFDQSxJQUFVLENBQUksSUFBQyxDQUFBLElBQWY7QUFBQSxtQkFBQTs7ZUFFQSxJQUFDLENBQUEsY0FBRCxDQUFnQixJQUFoQjtJQU5JOzswQkFRUixVQUFBLEdBQVksU0FBQyxJQUFEO2VBRVIsSUFBQSxDQUFLLElBQUw7SUFGUTs7MEJBVVosV0FBQSxHQUFhLFNBQUE7UUFFVCwyQ0FBQTtRQUVBLElBQUMsQ0FBQSxJQUFJLENBQUMsWUFBTixDQUFtQixJQUFDLENBQUEsS0FBSyxDQUFDLEdBQTFCLEVBQStCLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBckM7UUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLFlBQU4sQ0FBbUIsSUFBQyxDQUFBLFdBQXBCLEVBQWlDLElBQWpDO1FBRUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxxQkFBUCxDQUFBO2VBRUEsSUFBQyxDQUFBLFlBQUQsQ0FBYyxJQUFDLENBQUEsU0FBZjtJQVRTOzswQkFXYixXQUFBLEdBQWEsU0FBQyxHQUFEO0FBRVQsWUFBQTtRQUFBLElBQUcsTUFBQSxHQUFTLDZDQUFNLEdBQU4sQ0FBWjtBQUNJLG1CQUFPLE9BRFg7O1FBR0EsSUFBRyxJQUFJLENBQUMsV0FBTCxDQUFpQixJQUFDLENBQUEsS0FBSyxDQUFDLEdBQXhCLEVBQTZCLEdBQTdCLENBQUg7QUFDSSxtQkFBTyxJQUFDLENBQUEsTUFEWjs7SUFMUzs7MEJBUWIsY0FBQSxHQUFnQixTQUFBO0FBRVosWUFBQTtRQUFBLElBQUcsVUFBQSxHQUFhLElBQUMsQ0FBQSxjQUFELENBQUEsQ0FBaEI7QUFDSSxtQkFBTyxVQUFVLENBQUMsSUFBWCxDQUFBLEVBRFg7O0lBRlk7OzBCQUtoQixhQUFBLEdBQWUsU0FBQTtBQUVYLFlBQUE7UUFBQSxJQUFHLFVBQUEsR0FBYSxJQUFDLENBQUEsY0FBRCxDQUFBLENBQWhCO1lBQ0ksSUFBRyxVQUFVLENBQUMsS0FBWCxDQUFBLENBQUg7QUFDSSx1QkFBTyxXQURYO2FBQUEsTUFBQTtBQUdJLHVCQUFPLFVBQVUsQ0FBQyxVQUFYLENBQUEsRUFIWDthQURKOztJQUZXOzswQkFRZixtQkFBQSxHQUFxQixTQUFDLE1BQUQ7ZUFFakIsTUFBTSxDQUFDLGVBQVAsQ0FBQTtJQUZpQjs7MEJBSXJCLGdCQUFBLEdBQWtCLFNBQUMsTUFBRDtRQUVkLElBQUcsTUFBTSxDQUFDLFNBQVY7bUJBQ0ksTUFBTSxDQUFDLFdBQVAsQ0FBQSxFQURKO1NBQUEsTUFBQTttQkFHSSxNQUFNLENBQUMsV0FBUCxDQUFBLEVBSEo7O0lBRmM7OzBCQU9sQixtQkFBQSxHQUFxQixTQUFBO0FBRWpCLFlBQUE7UUFBQSxtREFBQTtpREFDTSxDQUFFLE1BQU0sQ0FBQyxNQUFmLENBQUE7SUFIaUI7OzBCQVdyQixXQUFBLEdBQWEsU0FBQyxJQUFELEVBQU8sS0FBUDtBQUVULFlBQUE7UUFBQSxTQUFBLEdBQVksS0FBQSxDQUFNLENBQU4sRUFBUyxHQUFULEVBQWMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUF2QjtlQUNaLElBQUMsQ0FBQSxZQUFELENBQWMsU0FBZDtJQUhTOzswQkFLYixZQUFBLEdBQWMsU0FBQyxVQUFEO1FBQUMsSUFBQyxDQUFBLFlBQUQ7UUFFWCxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQWIsQ0FBaUIsWUFBakIsRUFBOEIsSUFBQyxDQUFBLFNBQS9CO1FBQ0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBbkIsR0FBNkIsSUFBQyxDQUFBLFNBQUYsR0FBWTtRQUN4QyxJQUFDLENBQUEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBakIsR0FBNEIsSUFBQyxDQUFBLFNBQUYsR0FBWTtRQUN2QyxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFaLEdBQXNCLElBQUMsQ0FBQSxTQUFGLEdBQVk7ZUFDakMsSUFBQyxDQUFBLG1CQUFELENBQUE7SUFOVTs7MEJBY2QsWUFBQSxHQUFjLFNBQUMsSUFBRCxFQUFPLEdBQVA7QUFFVixZQUFBO1FBQUEsSUFBQSwwRUFBOEIsQ0FBRTtRQUNoQyxJQUFVLEtBQUEsQ0FBTSxJQUFOLENBQVY7QUFBQSxtQkFBQTs7ZUFFQSxHQUFHLENBQUMsTUFBSixDQUFXLElBQVgsRUFBaUIsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQyxNQUFEO3VCQUFZLEtBQUMsQ0FBQSxtQkFBRCxDQUFxQixHQUFyQixFQUEwQixHQUFHLENBQUMsV0FBSixDQUFnQixNQUFoQixDQUExQjtZQUFaO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFqQjtJQUxVOzswQkFPZCxtQkFBQSxHQUFxQixTQUFDLEdBQUQsRUFBTSxLQUFOO0FBRWpCLFlBQUE7d0RBQWEsQ0FBRSxjQUFmLENBQThCLEtBQTlCO0lBRmlCOzswQkFJckIsV0FBQSxHQUFhLFNBQUMsTUFBRCxFQUFTLE1BQVQ7QUFFVCxZQUFBO1FBQUEsS0FBQSxHQUFRLEdBQUcsQ0FBQyxXQUFKLENBQWdCLE1BQWhCO0FBQ1IsYUFBVyx1R0FBWDtZQUNJLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixHQUFyQixFQUEwQixLQUExQjtBQURKO2lEQUdNLENBQUUsY0FBUixDQUF1QixLQUF2QjtJQU5TOzswQkFjYixXQUFBLEdBQWEsU0FBQTtBQUVULFlBQUE7UUFBQSxJQUFHLElBQUMsQ0FBQSxTQUFELEdBQWEsQ0FBaEI7WUFDSSxJQUFDLENBQUEsWUFBRCxDQUFjLEdBQWQsRUFESjtTQUFBLE1BQUE7O29CQUdxQixDQUFFLEtBQW5CLENBQUE7O1lBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBYyxDQUFkLEVBSko7O2VBTUEsSUFBQyxDQUFBLG1CQUFELENBQUE7SUFSUzs7MEJBVWIsT0FBQSxHQUFTLFNBQUE7QUFFTCxZQUFBO1FBQUEsR0FBRyxDQUFDLE9BQUosQ0FBQTtRQUNBLFFBQVEsQ0FBQyxLQUFULENBQUE7UUFDQSxJQUFDLENBQUEsUUFBRCxHQUFZO1FBRVosSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFBLENBQUg7WUFDSSxJQUFBLENBQUssU0FBTCwrQ0FBZ0MsQ0FBRSxJQUFuQixDQUFBLFVBQWY7bUJBQ0EsSUFBQyxDQUFBLGNBQUQsOENBQWlDLENBQUUsSUFBbkIsQ0FBQSxVQUFoQixFQUZKOztJQU5LOzs7O0dBbmxCYTs7QUE2bEIxQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyAkLCBjbGFtcCwgZHJhZywgZWxlbSwgZW1wdHksIGZpbGVsaXN0LCBrbG9nLCBvcGVuLCBwb3N0LCBzbGFzaCwgdmFsaWQgfSA9IHJlcXVpcmUgJ2t4aydcblxuQnJvd3NlciAgPSByZXF1aXJlICcuL2Jyb3dzZXInXG5TaGVsZiAgICA9IHJlcXVpcmUgJy4vc2hlbGYnXG5TZWxlY3QgICA9IHJlcXVpcmUgJy4vc2VsZWN0J1xuRmlsZSAgICAgPSByZXF1aXJlICcuLi90b29scy9maWxlJ1xuZGlyQ2FjaGUgPSByZXF1aXJlICcuLi90b29scy9kaXJjYWNoZSdcbmh1YiAgICAgID0gcmVxdWlyZSAnLi4vZ2l0L2h1YidcbnBieXRlcyAgID0gcmVxdWlyZSAncHJldHR5LWJ5dGVzJ1xubW9tZW50ICAgPSByZXF1aXJlICdtb21lbnQnXG5cbmNsYXNzIEZpbGVCcm93c2VyIGV4dGVuZHMgQnJvd3NlclxuXG4gICAgQDogKHZpZXcpIC0+XG5cbiAgICAgICAgc3VwZXIgdmlld1xuXG4gICAgICAgIHdpbmRvdy5maWxlYnJvd3NlciA9IEBcblxuICAgICAgICBAbG9hZElEID0gMFxuICAgICAgICBAc2hlbGYgID0gbmV3IFNoZWxmIEBcbiAgICAgICAgQHNlbGVjdCA9IG5ldyBTZWxlY3QgQFxuICAgICAgICBAbmFtZSAgID0gJ0ZpbGVCcm93c2VyJ1xuICAgICAgICBAc3JjQ2FjaGUgPSB7fVxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnZmlsZScgICAgICAgICAgIEBvbkZpbGVcbiAgICAgICAgcG9zdC5vbiAnYnJvd3NlJyAgICAgICAgIEBicm93c2VcbiAgICAgICAgcG9zdC5vbiAnZmlsZWJyb3dzZXInICAgIEBvbkZpbGVCcm93c2VyXG4gICAgICAgIHBvc3Qub24gJ29wZW5GaWxlJyAgICAgICBAb25PcGVuRmlsZVxuICAgICAgICBwb3N0Lm9uICduYXZpZ2F0ZVRvRmlsZScgQG5hdmlnYXRlVG9GaWxlXG5cbiAgICAgICAgcG9zdC5vbiAnZ2l0U3RhdHVzJyAgICAgIEBvbkdpdFN0YXR1c1xuICAgICAgICBwb3N0Lm9uICdmaWxlSW5kZXhlZCcgICAgQG9uRmlsZUluZGV4ZWRcbiAgICAgICAgcG9zdC5vbiAnZGlyY2FjaGUnICAgICAgIEBvbkRpckNhY2hlXG4gICAgICAgIFxuICAgICAgICBAc2hlbGZSZXNpemUgPSBlbGVtICdkaXYnIGNsYXNzOiAnc2hlbGZSZXNpemUnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLnRvcCAgICAgID0gJzBweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmJvdHRvbSAgID0gJzBweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmxlZnQgICAgID0gJzE5NHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUud2lkdGggICAgPSAnNnB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUuY3Vyc29yICAgPSAnZXctcmVzaXplJ1xuXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBzaGVsZlJlc2l6ZVxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uU2hlbGZEcmFnXG5cbiAgICAgICAgQHNoZWxmU2l6ZSA9IHdpbmRvdy5zdGF0ZS5nZXQgJ3NoZWxmfHNpemUnIDIwMFxuXG4gICAgICAgIEBpbml0Q29sdW1ucygpXG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGRyb3BBY3Rpb246IChhY3Rpb24sIHNvdXJjZXMsIHRhcmdldCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmlzRmlsZSB0YXJnZXRcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGFyZ2V0ID0gc2xhc2guZGlyIHRhcmdldFxuICAgICAgICBcbiAgICAgICAgZm9yIHNvdXJjZSBpbiBzb3VyY2VzXG4gICAgICAgIFxuICAgICAgICAgICAgaWYgYWN0aW9uID09ICdtb3ZlJyBcbiAgICAgICAgICAgICAgICBpZiBzb3VyY2UgPT0gdGFyZ2V0IG9yIHNsYXNoLmRpcihzb3VyY2UpID09IHRhcmdldFxuICAgICAgICAgICAgICAgICAgICBrbG9nICdub29wJyBzb3VyY2UsIHRhcmdldFxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBmb3Igc291cmNlIGluIHNvdXJjZXNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3dpdGNoIGFjdGlvblxuICAgICAgICAgICAgICAgIHdoZW4gJ21vdmUnXG4gICAgICAgICAgICAgICAgICAgIEZpbGUucmVuYW1lIHNvdXJjZSwgdGFyZ2V0LCAoc291cmNlLCB0YXJnZXQpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBzb3VyY2VDb2x1bW4gPSBAY29sdW1uRm9yRmlsZSBzb3VyY2UgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlQ29sdW1uLnJlbW92ZUZpbGUgc291cmNlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiB0YXJnZXRDb2x1bW4gPSBAY29sdW1uRm9yRmlsZSB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBub3QgdGFyZ2V0Q29sdW1uLnJvdyB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Q29sdW1uLmluc2VydEZpbGUgdGFyZ2V0XG4gICAgICAgICAgICAgICAgd2hlbiAnY29weSdcbiAgICAgICAgICAgICAgICAgICAgRmlsZS5jb3B5IHNvdXJjZSwgdGFyZ2V0LCAoc291cmNlLCB0YXJnZXQpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiB0YXJnZXRDb2x1bW4gPSBAY29sdW1uRm9yRmlsZSB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBub3QgdGFyZ2V0Q29sdW1uLnJvdyB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Q29sdW1uLmluc2VydEZpbGUgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgIFxuICAgIGNvbHVtbkZvckZpbGU6IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGNvbHVtbiBpbiBAY29sdW1uc1xuICAgICAgICAgICAgaWYgY29sdW1uLnBhcmVudD8uZmlsZSA9PSBzbGFzaC5kaXIgZmlsZVxuICAgICAgICAgICAgICAgIHJldHVybiBjb2x1bW5cbiAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgc2hhcmVkQ29sdW1uSW5kZXg6IChmaWxlKSAtPiBcbiAgICAgICAgXG4gICAgICAgIGNvbCA9IDBcbiAgICAgICAgXG4gICAgICAgIGZvciBjb2x1bW4gaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIGNvbHVtbi5pc0RpcigpIGFuZCBmaWxlLnN0YXJ0c1dpdGggY29sdW1uLnBhdGgoKVxuICAgICAgICAgICAgICAgIGNvbCArPSAxXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgY29sID09IDEgYW5kIHNsYXNoLmRpcihmaWxlKSAhPSBAY29sdW1uc1swXT8ucGF0aCgpXG4gICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICBNYXRoLm1heCAtMSwgY29sLTJcblxuICAgIGJyb3dzZTogKGZpbGUsIG9wdCkgPT4gXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgZmlsZSB0aGVuIEBsb2FkSXRlbSBAZmlsZUl0ZW0oZmlsZSksIG9wdFxuICAgICAgICBcbiAgICBuYXZpZ2F0ZVRvRmlsZTogKGZpbGUpID0+XG5cbiAgICAgICAgbGFzdFBhdGggPSBAbGFzdERpckNvbHVtbigpPy5wYXRoKClcbiAgICAgICAgXG4gICAgICAgIGZpbGUgPSBzbGFzaC5wYXRoIGZpbGVcblxuICAgICAgICAjIGtsb2cgJ25hdmlnYXRlVG9GaWxlJyBmaWxlLCBsYXN0UGF0aCwgQGxhc3RDb2x1bW5QYXRoKClcbiAgICAgICAgXG4gICAgICAgIGlmIGZpbGUgPT0gbGFzdFBhdGggb3IgZmlsZSA9PSBAbGFzdENvbHVtblBhdGgoKSBvciBzbGFzaC5pc1JlbGF0aXZlIGZpbGVcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGNvbCA9IEBzaGFyZWRDb2x1bW5JbmRleCBmaWxlXG4gICAgICAgIFxuICAgICAgICBmaWxlbGlzdCA9IHNsYXNoLnBhdGhsaXN0IGZpbGVcbiAgICAgICAgXG4gICAgICAgIGlmIGNvbCA+PSAwXG4gICAgICAgICAgICBwYXRocyA9IGZpbGVsaXN0LnNsaWNlIGZpbGVsaXN0LmluZGV4T2YoQGNvbHVtbnNbY29sXS5wYXRoKCkpKzFcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcGF0aHMgPSBmaWxlbGlzdC5zbGljZSBmaWxlbGlzdC5sZW5ndGgtMlxuICAgICAgICAgICAgXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbCsxLCBwb3A6dHJ1ZSBjbGVhcjpjb2wrcGF0aHMubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICB3aGlsZSBAbnVtQ29scygpIDwgcGF0aHMubGVuZ3RoXG4gICAgICAgICAgICBAYWRkQ29sdW1uKClcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBmb3IgaW5kZXggaW4gWzAuLi5wYXRocy5sZW5ndGhdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGl0ZW0gPSBAZmlsZUl0ZW0gcGF0aHNbaW5kZXhdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN3aXRjaCBpdGVtLnR5cGVcbiAgICAgICAgICAgICAgICB3aGVuICdmaWxlJyBcbiAgICAgICAgICAgICAgICAgICAgIyBrbG9nICdmaWxlYnJvd3Nlci5uYXZpZ2F0ZVRvRmlsZScgaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgIEBsb2FkRmlsZUl0ZW0gaXRlbSwgY29sKzEraW5kZXhcbiAgICAgICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgICAgIG9wdCA9IHt9XG4gICAgICAgICAgICAgICAgICAgIGlmIGluZGV4IDwgcGF0aHMubGVuZ3RoLTFcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdC5hY3RpdmUgPSBwYXRoc1tpbmRleCsxXVxuICAgICAgICAgICAgICAgICAgICBAbG9hZERpckl0ZW0gaXRlbSwgY29sKzEraW5kZXgsIG9wdFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgY29sID0gQGxhc3REaXJDb2x1bW4oKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiByb3cgPSBjb2wucm93KHNsYXNoLmZpbGUgZmlsZSlcbiAgICAgICAgICAgICAgICByb3cuc2V0QWN0aXZlKClcblxuICAgICMgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGZpbGVJdGVtOiAocGF0aCkgLT5cbiAgICAgICAgXG4gICAgICAgIHAgPSBzbGFzaC5yZXNvbHZlIHBhdGhcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgZmlsZTpwXG4gICAgICAgIHR5cGU6c2xhc2guaXNGaWxlKHApIGFuZCAnZmlsZScgb3IgJ2RpcidcbiAgICAgICAgbmFtZTpzbGFzaC5maWxlIHBcbiAgICAgICAgXG4gICAgb25GaWxlQnJvd3NlcjogKGFjdGlvbiwgaXRlbSwgYXJnKSA9PlxuXG4gICAgICAgIHN3aXRjaCBhY3Rpb25cbiAgICAgICAgICAgIHdoZW4gJ2xvYWRJdGVtJyAgICAgdGhlbiBAbG9hZEl0ZW0gICAgIGl0ZW0sIGFyZ1xuICAgICAgICAgICAgd2hlbiAnYWN0aXZhdGVJdGVtJyB0aGVuIEBhY3RpdmF0ZUl0ZW0gaXRlbSwgYXJnXG4gICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGxvYWREaXI6IChwYXRoKSAtPiBAbG9hZEl0ZW0gdHlwZTonZGlyJyBmaWxlOnBhdGhcbiAgICBcbiAgICBsb2FkSXRlbTogKGl0ZW0sIG9wdCkgLT5cblxuICAgICAgICBvcHQgPz0gYWN0aXZlOicuLicgZm9jdXM6dHJ1ZVxuICAgICAgICBpdGVtLm5hbWUgPz0gc2xhc2guZmlsZSBpdGVtLmZpbGVcblxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSAxLCBwb3A6dHJ1ZSwgY2xlYXI6b3B0LmNsZWFyID8gMVxuXG4gICAgICAgIHN3aXRjaCBpdGVtLnR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2RpcicgIHRoZW4gQGxvYWREaXJJdGVtIGl0ZW0sIDAsIG9wdFxuICAgICAgICAgICAgd2hlbiAnZmlsZScgXG4gICAgICAgICAgICAgICAgb3B0LmFjdGl2YXRlID0gaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgd2hpbGUgQG51bUNvbHMoKSA8IDIgdGhlbiBAYWRkQ29sdW1uKClcbiAgICAgICAgICAgICAgICBAbG9hZERpckl0ZW0gQGZpbGVJdGVtKHNsYXNoLmRpcihpdGVtLmZpbGUpKSwgMCwgb3B0XG5cbiAgICAgICAgaWYgb3B0LmZvY3VzXG4gICAgICAgICAgICBAY29sdW1uc1swXT8uZm9jdXMoKVxuXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIGFjdGl2YXRlSXRlbTogKGl0ZW0sIGNvbCkgLT5cblxuICAgICAgICAjIGtsb2cgJ2FjdGl2YXRlSXRlbScgaXRlbS5maWxlXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbCsyIHBvcDp0cnVlXG5cbiAgICAgICAgc3dpdGNoIGl0ZW0udHlwZVxuICAgICAgICAgICAgd2hlbiAnZGlyJ1xuICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbSAgaXRlbSwgY29sKzEsIGZvY3VzOmZhbHNlXG4gICAgICAgICAgICB3aGVuICdmaWxlJ1xuICAgICAgICAgICAgICAgIEBsb2FkRmlsZUl0ZW0gaXRlbSwgY29sKzFcbiAgICAgICAgICAgICAgICBpZiBpdGVtLnRleHRGaWxlIG9yIEZpbGUuaXNUZXh0IGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICAjIGtsb2cgJ2FjdGl2YXRlSXRlbSBqdW1wVG9GaWxlJyBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG9GaWxlJyBpdGVtXG5cbiAgICAjIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsb2FkRmlsZUl0ZW06IChpdGVtLCBjb2w9MCkgLT5cblxuICAgICAgICAjIGtsb2cgJ2xvYWRGaWxlSXRlbScgY29sLCBpdGVtLmZpbGVcbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sLCBwb3A6dHJ1ZVxuXG4gICAgICAgIHdoaWxlIGNvbCA+PSBAbnVtQ29scygpXG4gICAgICAgICAgICBAYWRkQ29sdW1uKClcblxuICAgICAgICBmaWxlID0gaXRlbS5maWxlXG5cbiAgICAgICAgQGNvbHVtbnNbY29sXS5wYXJlbnQgPSBpdGVtXG4gICAgICAgIFxuICAgICAgICBpZiBGaWxlLmlzSW1hZ2UgZmlsZVxuICAgICAgICAgICAgQGltYWdlSW5mb0NvbHVtbiBjb2wsIGZpbGVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc3dpdGNoIHNsYXNoLmV4dCBmaWxlXG4gICAgICAgICAgICAgICAgd2hlbiAndGlmZicgJ3RpZidcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgICAgICAgICBAY29udmVydEltYWdlIHJvd1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAZmlsZUluZm9Db2x1bW4gY29sLCBmaWxlXG4gICAgICAgICAgICAgICAgd2hlbiAncHhtJ1xuICAgICAgICAgICAgICAgICAgICBpZiBub3Qgc2xhc2gud2luKClcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjb252ZXJ0UFhNIHJvd1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAZmlsZUluZm9Db2x1bW4gY29sLCBmaWxlXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBpZiBGaWxlLmlzVGV4dCBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIEBsb2FkU291cmNlSXRlbSBpdGVtLCBjb2xcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IEZpbGUuaXNDb2RlIGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgQGZpbGVJbmZvQ29sdW1uIGNvbCwgZmlsZVxuXG4gICAgICAgIHBvc3QuZW1pdCAnbG9hZCcgY29sdW1uOmNvbCwgaXRlbTppdGVtXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcblxuICAgIGltYWdlSW5mb0NvbHVtbjogKGNvbCwgZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjb2x1bW5zW2NvbF0uY3J1bWIuaGlkZSgpXG4gICAgICAgIEBjb2x1bW5zW2NvbF0udGFibGUuYXBwZW5kQ2hpbGQgQGltYWdlSW5mbyBmaWxlXG4gICAgICAgIFxuICAgIGZpbGVJbmZvQ29sdW1uOiAoY29sLCBmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgQGNvbHVtbnNbY29sXS5jcnVtYi5oaWRlKClcbiAgICAgICAgQGNvbHVtbnNbY29sXS50YWJsZS5hcHBlbmRDaGlsZCBAZmlsZUluZm8gZmlsZVxuICAgICAgICBcbiAgICAjIDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGltYWdlSW5mbzogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBrbG9nICdpbWFnZUluZm8nIGZpbGVcbiAgICAgICAgaW1nID0gZWxlbSAnaW1nJyBjbGFzczonYnJvd3NlckltYWdlJyBzcmM6c2xhc2guZmlsZVVybCBmaWxlXG4gICAgICAgIGNudCA9IGVsZW0gY2xhc3M6J2Jyb3dzZXJJbWFnZUNvbnRhaW5lcicgY2hpbGQ6aW1nXG4gICAgICAgIGNudC5hZGRFdmVudExpc3RlbmVyICdkYmxjbGljaycgPT4gY2xlYXJUaW1lb3V0IEBvcGVuVGltZXI7IG9wZW4gZmlsZVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaW1nLm9ubG9hZCA9IC0+XG4gICAgICAgICAgICBpbWcgPSQgJy5icm93c2VySW1hZ2UnXG4gICAgICAgICAgICBiciA9IGltZy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgICAgeCA9IGltZy5jbGllbnRYXG4gICAgICAgICAgICB3aWR0aCAgPSBwYXJzZUludCBici5yaWdodCAtIGJyLmxlZnQgLSAyXG4gICAgICAgICAgICBoZWlnaHQgPSBwYXJzZUludCBici5ib3R0b20gLSBici50b3AgLSAyXG5cbiAgICAgICAgICAgIGltZy5zdHlsZS5vcGFjaXR5ICAgPSAnMSdcbiAgICAgICAgICAgIGltZy5zdHlsZS5tYXhXaWR0aCAgPSAnMTAwJSdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3RhdCA9IHNsYXNoLmZpbGVFeGlzdHMgZmlsZVxuICAgICAgICAgICAgc2l6ZSA9IHBieXRlcyhzdGF0LnNpemUpLnNwbGl0ICcgJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBhZ2UgPSBtb21lbnQoKS50byhtb21lbnQoc3RhdC5tdGltZSksIHRydWUpXG4gICAgICAgICAgICBbbnVtLCByYW5nZV0gPSBhZ2Uuc3BsaXQgJyAnXG4gICAgICAgICAgICBudW0gPSAnMScgaWYgbnVtWzBdID09ICdhJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBodG1sICA9IFwiPHRyPjx0aCBjb2xzcGFuPTI+I3t3aWR0aH08c3BhbiBjbGFzcz0ncHVuY3QnPng8L3NwYW4+I3toZWlnaHR9PC90aD48L3RyPlwiXG4gICAgICAgICAgICBodG1sICs9IFwiPHRyPjx0aD4je3NpemVbMF19PC90aD48dGQ+I3tzaXplWzFdfTwvdGQ+PC90cj5cIlxuICAgICAgICAgICAgaHRtbCArPSBcIjx0cj48dGg+I3tudW19PC90aD48dGQ+I3tyYW5nZX08L3RkPjwvdHI+XCJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaW5mbyA9IGVsZW0gY2xhc3M6J2Jyb3dzZXJGaWxlSW5mbycgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICBlbGVtICdkaXYnIGNsYXNzOlwiZmlsZUluZm9GaWxlICN7c2xhc2guZXh0IGZpbGV9XCIgaHRtbDpGaWxlLnNwYW4gZmlsZVxuICAgICAgICAgICAgICAgIGVsZW0gJ3RhYmxlJyBjbGFzczpcImZpbGVJbmZvRGF0YVwiIGh0bWw6aHRtbFxuICAgICAgICAgICAgXVxuICAgICAgICAgICAgY250ID0kICcuYnJvd3NlckltYWdlQ29udGFpbmVyJ1xuICAgICAgICAgICAgY250LmFwcGVuZENoaWxkIGluZm9cbiAgICAgICAgXG4gICAgICAgIGNudFxuICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMCAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAgXG4gICAgICAgIFxuICAgIGZpbGVJbmZvOiAoZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGtsb2cgJ2ZpbGVJbmZvJyBmaWxlXG4gICAgICAgIFxuICAgICAgICBzdGF0ID0gc2xhc2guZmlsZUV4aXN0cyBmaWxlXG4gICAgICAgIHNpemUgPSBwYnl0ZXMoc3RhdC5zaXplKS5zcGxpdCAnICdcbiAgICAgICAgXG4gICAgICAgIHQgPSBtb21lbnQgc3RhdC5tdGltZVxuXG4gICAgICAgIGFnZSA9IG1vbWVudCgpLnRvKHQsIHRydWUpXG4gICAgICAgIFtudW0sIHJhbmdlXSA9IGFnZS5zcGxpdCAnICdcbiAgICAgICAgbnVtID0gJzEnIGlmIG51bVswXSA9PSAnYSdcbiAgICAgICAgaWYgcmFuZ2UgPT0gJ2ZldydcbiAgICAgICAgICAgIG51bSA9IG1vbWVudCgpLmRpZmYgdCwgJ3NlY29uZHMnXG4gICAgICAgICAgICByYW5nZSA9ICdzZWNvbmRzJ1xuICAgICAgICBcbiAgICAgICAgaW5mbyA9IGVsZW0gY2xhc3M6J2Jyb3dzZXJGaWxlSW5mbycgY2hpbGRyZW46IFtcbiAgICAgICAgICAgIGVsZW0gJ2RpdicgY2xhc3M6XCJmaWxlSW5mb0ljb24gI3tzbGFzaC5leHQgZmlsZX0gI3tGaWxlLmljb25DbGFzc05hbWUgZmlsZX1cIlxuICAgICAgICAgICAgZWxlbSAnZGl2JyBjbGFzczpcImZpbGVJbmZvRmlsZSAje3NsYXNoLmV4dCBmaWxlfVwiIGh0bWw6RmlsZS5zcGFuIGZpbGVcbiAgICAgICAgICAgIGVsZW0gJ3RhYmxlJyBjbGFzczpcImZpbGVJbmZvRGF0YVwiIGh0bWw6XCI8dHI+PHRoPiN7c2l6ZVswXX08L3RoPjx0ZD4je3NpemVbMV19PC90ZD48L3RyPjx0cj48dGg+I3tudW19PC90aD48dGQ+I3tyYW5nZX08L3RkPjwvdHI+XCJcbiAgICAgICAgXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpbmZvXG4gICAgICAgIFxuICAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgIFxuICAgICBvbkRpckNhY2hlOiAoZGlyKSA9PlxuIFxuICAgICAgICAgZm9yIGNvbHVtbiBpbiBAY29sdW1uc1xuICAgICAgICAgICAgIGlmIGNvbHVtbi5wYXRoKCkgPT0gZGlyXG4gICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbSB7ZmlsZTpkaXIsIHR5cGU6J2Rpcid9LCBjb2x1bW4uaW5kZXgsIGFjdGl2ZTpjb2x1bW4uYWN0aXZlUGF0aCgpXG4gICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgXG4gICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuIFxuICAgICBvbkZpbGVJbmRleGVkOiAoZmlsZSwgaW5mbykgPT5cbiBcbiAgICAgICAgIEBzcmNDYWNoZVtmaWxlXSA9IGluZm9cbiBcbiAgICAgICAgIGlmIGZpbGUgPT0gQGxhc3RVc2VkQ29sdW1uKCk/LnBhcmVudD8uZmlsZVxuICAgICAgICAgICAgIEBsb2FkU291cmNlSXRlbSB7IGZpbGU6ZmlsZSwgdHlwZTonZmlsZScgfSwgQGxhc3RVc2VkQ29sdW1uKCk/LmluZGV4XG4gICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGxvYWRTb3VyY2VJdGVtOiAoaXRlbSwgY29sKSAtPlxuXG4gICAgICAgICMga2xvZyAnbG9hZFNvdXJjZUl0ZW0nIGl0ZW0sIGNvbFxuICAgICAgICBpZiBub3QgQHNyY0NhY2hlW2l0ZW0uZmlsZV0/XG5cbiAgICAgICAgICAgIEBzcmNDYWNoZVtpdGVtLmZpbGVdID0gcG9zdC5nZXQgJ2luZGV4ZXInICdmaWxlJyBpdGVtLmZpbGVcblxuICAgICAgICBpbmZvID0gQHNyY0NhY2hlW2l0ZW0uZmlsZV1cblxuICAgICAgICBpZiBlbXB0eSBpbmZvXG4gICAgICAgICAgICBAY29sdW1uc1tjb2xdLmxvYWRJdGVtcyBbXSwgaXRlbVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgaXRlbXMgPSBbXVxuICAgICAgICBjbHNzcyA9IGluZm8uY2xhc3NlcyA/IFtdXG4gICAgICAgIGZvciBjbHNzIGluIGNsc3NzXG4gICAgICAgICAgICB0ZXh0ID0gJ+KXjyAnK2Nsc3MubmFtZVxuICAgICAgICAgICAgaXRlbXMucHVzaCBuYW1lOmNsc3MubmFtZSwgdGV4dDp0ZXh0LCB0eXBlOidjbGFzcycsIGZpbGU6aXRlbS5maWxlLCBsaW5lOmNsc3MubGluZVxuXG4gICAgICAgIGZ1bmNzID0gaW5mby5mdW5jcyA/IFtdXG4gICAgICAgIGZvciBmdW5jIGluIGZ1bmNzXG4gICAgICAgICAgICBpZiBmdW5jLnRlc3QgPT0gJ2Rlc2NyaWJlJ1xuICAgICAgICAgICAgICAgIHRleHQgPSAn4pePICcrZnVuYy5uYW1lXG4gICAgICAgICAgICBlbHNlIGlmIGZ1bmMuc3RhdGljXG4gICAgICAgICAgICAgICAgdGV4dCA9ICcgIOKXhiAnK2Z1bmMubmFtZVxuICAgICAgICAgICAgZWxzZSBpZiBmdW5jLnBvc3RcbiAgICAgICAgICAgICAgICB0ZXh0ID0gJyAg4qyiICcrZnVuYy5uYW1lXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdGV4dCA9ICcgIOKWuCAnK2Z1bmMubmFtZVxuICAgICAgICAgICAgaXRlbXMucHVzaCBuYW1lOmZ1bmMubmFtZSwgdGV4dDp0ZXh0LCB0eXBlOidmdW5jJywgZmlsZTppdGVtLmZpbGUsIGxpbmU6ZnVuYy5saW5lXG5cbiAgICAgICAgaWYgdmFsaWQgaXRlbXNcbiAgICAgICAgICAgIGl0ZW1zLnNvcnQgKGEsYikgLT4gYS5saW5lIC0gYi5saW5lXG4gICAgICAgICAgICBAY29sdW1uc1tjb2xdLmxvYWRJdGVtcyBpdGVtcywgaXRlbVxuICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsb2FkRGlySXRlbTogKGl0ZW0sIGNvbD0wLCBvcHQ9e30pIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIGNvbCA+IDAgYW5kIGl0ZW0ubmFtZSA9PSAnLydcblxuICAgICAgICBkaXIgPSBpdGVtLmZpbGVcblxuICAgICAgICBpZiBkaXJDYWNoZS5oYXMoZGlyKSBhbmQgbm90IG9wdC5pZ25vcmVDYWNoZVxuICAgICAgICAgICAgIyBrbG9nIFwiZGlyQ2FjaGUgI3tkaXJ9XCJcbiAgICAgICAgICAgIEBsb2FkRGlySXRlbXMgZGlyLCBpdGVtLCBkaXJDYWNoZS5nZXQoZGlyKSwgY29sLCBvcHRcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnZGlyJyBkaXJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgb3B0Lmlnbm9yZUhpZGRlbiA9IG5vdCB3aW5kb3cuc3RhdGUuZ2V0IFwiYnJvd3NlcnxzaG93SGlkZGVufCN7ZGlyfVwiXG4gICAgICAgICAgICBvcHQudGV4dFRlc3QgPSB0cnVlXG4gICAgICAgICAgICBzbGFzaC5saXN0IGRpciwgb3B0LCAoaXRlbXMpID0+XG5cbiAgICAgICAgICAgICAgICBwb3N0LnRvTWFpbiAnZGlyTG9hZGVkJyBkaXJcblxuICAgICAgICAgICAgICAgIGRpckNhY2hlLnNldCBkaXIsIGl0ZW1zXG4gICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtcyBkaXIsIGl0ZW0sIGl0ZW1zLCBjb2wsIG9wdFxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnZGlyJyBkaXJcbiAgICAgICAgICAgICAgICBcbiAgICBsb2FkRGlySXRlbXM6IChkaXIsIGl0ZW0sIGl0ZW1zLCBjb2wsIG9wdCkgPT5cbiAgICAgICAgXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgd2hpbGUgY29sID49IEBudW1Db2xzKClcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuXG4gICAgICAgIEBjb2x1bW5zW2NvbF0ubG9hZEl0ZW1zIGl0ZW1zLCBpdGVtXG5cbiAgICAgICAgcG9zdC5lbWl0ICdsb2FkJyBjb2x1bW46Y29sLCBpdGVtOml0ZW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgb3B0LmFjdGl2YXRlXG4gICAgICAgICAgICBpZiByb3cgPSBAY29sdW1uc1tjb2xdLnJvdyBzbGFzaC5maWxlIG9wdC5hY3RpdmF0ZVxuICAgICAgICAgICAgICAgIHJvdy5hY3RpdmF0ZSgpXG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdsb2FkJyBjb2x1bW46Y29sKzEgaXRlbTpyb3cuaXRlbVxuICAgICAgICBlbHNlIGlmIG9wdC5hY3RpdmVcbiAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0ucm93KHNsYXNoLmZpbGUgb3B0LmFjdGl2ZSk/LnNldEFjdGl2ZSgpXG4gICAgICAgIFxuICAgICAgICBAZ2V0R2l0U3RhdHVzIGl0ZW0sIGNvbFxuICAgICAgICBcbiAgICAgICAgaWYgb3B0LmZvY3VzICE9IGZhbHNlIGFuZCBlbXB0eShkb2N1bWVudC5hY3RpdmVFbGVtZW50KSBhbmQgZW1wdHkoJCgnLnBvcHVwJyk/Lm91dGVySFRNTClcbiAgICAgICAgICAgIGlmIGxhc3RDb2x1bW4gPSBAbGFzdERpckNvbHVtbigpXG4gICAgICAgICAgICAgICAgIyBrbG9nICdsYXN0Q29sdW1uIGZvY3VzJ1xuICAgICAgICAgICAgICAgIGxhc3RDb2x1bW4uZm9jdXMoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBvcHQuY2I/IGNvbHVtbjpjb2wsIGl0ZW06aXRlbVxuXG4gICAgICAgIGlmIGNvbCA+PSAyIGFuZCBAY29sdW1uc1swXS53aWR0aCgpIDwgMjUwXG4gICAgICAgICAgICBAY29sdW1uc1sxXS5tYWtlUm9vdCgpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG4gICAgb25GaWxlOiAoZmlsZSkgPT5cblxuICAgICAgICAjIGtsb2cgJ29uRmlsZScgZmlsZVxuICAgICAgICByZXR1cm4gaWYgbm90IGZpbGVcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmxleFxuXG4gICAgICAgIEBuYXZpZ2F0ZVRvRmlsZSBmaWxlXG5cbiAgICBvbk9wZW5GaWxlOiAoZmlsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIG9wZW4gZmlsZVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBpbml0Q29sdW1uczogLT5cblxuICAgICAgICBzdXBlcigpXG5cbiAgICAgICAgQHZpZXcuaW5zZXJ0QmVmb3JlIEBzaGVsZi5kaXYsIEB2aWV3LmZpcnN0Q2hpbGRcbiAgICAgICAgQHZpZXcuaW5zZXJ0QmVmb3JlIEBzaGVsZlJlc2l6ZSwgbnVsbFxuXG4gICAgICAgIEBzaGVsZi5icm93c2VyRGlkSW5pdENvbHVtbnMoKVxuXG4gICAgICAgIEBzZXRTaGVsZlNpemUgQHNoZWxmU2l6ZVxuXG4gICAgY29sdW1uQXRQb3M6IChwb3MpIC0+XG5cbiAgICAgICAgaWYgY29sdW1uID0gc3VwZXIgcG9zXG4gICAgICAgICAgICByZXR1cm4gY29sdW1uXG5cbiAgICAgICAgaWYgZWxlbS5jb250YWluc1BvcyBAc2hlbGYuZGl2LCBwb3NcbiAgICAgICAgICAgIHJldHVybiBAc2hlbGZcbiAgICAgICAgICAgIFxuICAgIGxhc3RDb2x1bW5QYXRoOiAtPlxuXG4gICAgICAgIGlmIGxhc3RDb2x1bW4gPSBAbGFzdFVzZWRDb2x1bW4oKVxuICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW4ucGF0aCgpXG5cbiAgICBsYXN0RGlyQ29sdW1uOiAtPlxuXG4gICAgICAgIGlmIGxhc3RDb2x1bW4gPSBAbGFzdFVzZWRDb2x1bW4oKVxuICAgICAgICAgICAgaWYgbGFzdENvbHVtbi5pc0RpcigpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW5cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtbi5wcmV2Q29sdW1uKClcblxuICAgIG9uQmFja3NwYWNlSW5Db2x1bW46IChjb2x1bW4pIC0+XG5cbiAgICAgICAgY29sdW1uLmJhY2tzcGFjZVNlYXJjaCgpXG4gICAgICAgIFxuICAgIG9uRGVsZXRlSW5Db2x1bW46IChjb2x1bW4pIC0+IFxuICAgIFxuICAgICAgICBpZiBjb2x1bW4uc2VhcmNoRGl2XG4gICAgICAgICAgICBjb2x1bW4uY2xlYXJTZWFyY2goKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjb2x1bW4ubW92ZVRvVHJhc2goKVxuICAgICAgICBcbiAgICB1cGRhdGVDb2x1bW5TY3JvbGxzOiA9PlxuXG4gICAgICAgIHN1cGVyKClcbiAgICAgICAgQHNoZWxmPy5zY3JvbGwudXBkYXRlKClcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwXG5cbiAgICBvblNoZWxmRHJhZzogKGRyYWcsIGV2ZW50KSA9PlxuXG4gICAgICAgIHNoZWxmU2l6ZSA9IGNsYW1wIDAsIDQwMCwgZHJhZy5wb3MueFxuICAgICAgICBAc2V0U2hlbGZTaXplIHNoZWxmU2l6ZVxuXG4gICAgc2V0U2hlbGZTaXplOiAoQHNoZWxmU2l6ZSkgLT5cblxuICAgICAgICB3aW5kb3cuc3RhdGUuc2V0ICdzaGVsZnxzaXplJyBAc2hlbGZTaXplXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5sZWZ0ID0gXCIje0BzaGVsZlNpemV9cHhcIlxuICAgICAgICBAc2hlbGYuZGl2LnN0eWxlLndpZHRoID0gXCIje0BzaGVsZlNpemV9cHhcIlxuICAgICAgICBAY29scy5zdHlsZS5sZWZ0ID0gXCIje0BzaGVsZlNpemV9cHhcIlxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbiAgICBnZXRHaXRTdGF0dXM6IChpdGVtLCBjb2wpID0+XG5cbiAgICAgICAgZmlsZSA9IGl0ZW0uZmlsZSA/IGl0ZW0ucGFyZW50Py5maWxlXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBmaWxlXG5cbiAgICAgICAgaHViLnN0YXR1cyBmaWxlLCAoc3RhdHVzKSA9PiBAYXBwbHlHaXRTdGF0dXNGaWxlcyBjb2wsIGh1Yi5zdGF0dXNGaWxlcyBzdGF0dXNcblxuICAgIGFwcGx5R2l0U3RhdHVzRmlsZXM6IChjb2wsIGZpbGVzKSA9PlxuXG4gICAgICAgIEBjb2x1bW5zW2NvbF0/LnVwZGF0ZUdpdEZpbGVzIGZpbGVzXG5cbiAgICBvbkdpdFN0YXR1czogKGdpdERpciwgc3RhdHVzKSA9PlxuXG4gICAgICAgIGZpbGVzID0gaHViLnN0YXR1c0ZpbGVzIHN0YXR1c1xuICAgICAgICBmb3IgY29sIGluIFswLi5AY29sdW1ucy5sZW5ndGhdXG4gICAgICAgICAgICBAYXBwbHlHaXRTdGF0dXNGaWxlcyBjb2wsIGZpbGVzXG5cbiAgICAgICAgQHNoZWxmPy51cGRhdGVHaXRGaWxlcyBmaWxlc1xuXG4gICAgIyAwMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgICAgICBcbiAgICBcbiAgICB0b2dnbGVTaGVsZjogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBzaGVsZlNpemUgPCAxXG4gICAgICAgICAgICBAc2V0U2hlbGZTaXplIDIwMFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbGFzdFVzZWRDb2x1bW4oKT8uZm9jdXMoKVxuICAgICAgICAgICAgQHNldFNoZWxmU2l6ZSAwXG4gICAgICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgICAgICBcbiAgICByZWZyZXNoOiA9PlxuXG4gICAgICAgIGh1Yi5yZWZyZXNoKClcbiAgICAgICAgZGlyQ2FjaGUucmVzZXQoKVxuICAgICAgICBAc3JjQ2FjaGUgPSB7fVxuXG4gICAgICAgIGlmIEBsYXN0VXNlZENvbHVtbigpXG4gICAgICAgICAgICBrbG9nICdyZWZyZXNoJyBAbGFzdFVzZWRDb2x1bW4oKT8ucGF0aCgpXG4gICAgICAgICAgICBAbmF2aWdhdGVUb0ZpbGUgQGxhc3RVc2VkQ29sdW1uKCk/LnBhdGgoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVCcm93c2VyXG4iXX0=
//# sourceURL=../../coffee/browser/filebrowser.coffee