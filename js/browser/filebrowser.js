// koffee 1.3.0

/*
00000000  000  000      00000000        0000000    00000000    0000000   000   000   0000000  00000000  00000000
000       000  000      000             000   000  000   000  000   000  000 0 000  000       000       000   000
000000    000  000      0000000         0000000    0000000    000   000  000000000  0000000   0000000   0000000
000       000  000      000             000   000  000   000  000   000  000   000       000  000       000   000
000       000  0000000  00000000        0000000    000   000   0000000   00     00  0000000   00000000  000   000
 */
var $, Browser, FileBrowser, Shelf, _, clamp, dirCache, dirlist, drag, elem, empty, fs, hub, klog, last, os, post, ref, slash, state, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), post = ref.post, valid = ref.valid, empty = ref.empty, clamp = ref.clamp, last = ref.last, elem = ref.elem, drag = ref.drag, state = ref.state, klog = ref.klog, slash = ref.slash, fs = ref.fs, os = ref.os, $ = ref.$, _ = ref._;

Browser = require('./browser');

Shelf = require('./shelf');

dirlist = require('../tools/dirlist');

dirCache = require('../tools/dircache');

hub = require('../git/hub');

FileBrowser = (function(superClass) {
    extend(FileBrowser, superClass);

    function FileBrowser(view) {
        this.onFileIndexed = bind(this.onFileIndexed, this);
        this.refresh = bind(this.refresh, this);
        this.onGitStatus = bind(this.onGitStatus, this);
        this.applyGitStatusFiles = bind(this.applyGitStatusFiles, this);
        this.getGitStatus = bind(this.getGitStatus, this);
        this.onShelfDrag = bind(this.onShelfDrag, this);
        this.updateColumnScrolls = bind(this.updateColumnScrolls, this);
        this.onFile = bind(this.onFile, this);
        this.loadDirItems = bind(this.loadDirItems, this);
        this.onDirCache = bind(this.onDirCache, this);
        this.onFileBrowser = bind(this.onFileBrowser, this);
        FileBrowser.__super__.constructor.call(this, view);
        window.filebrowser = this;
        this.loadID = 0;
        this.shelf = new Shelf(this);
        this.name = 'FileBrowser';
        this.srcCache = {};
        post.on('gitStatus', this.onGitStatus);
        post.on('fileIndexed', this.onFileIndexed);
        post.on('file', this.onFile);
        post.on('filebrowser', this.onFileBrowser);
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
        this.shelfSize = window.state.get('shelf:size', 200);
        this.initColumns();
    }

    FileBrowser.prototype.onFileBrowser = function(action, item, arg) {
        switch (action) {
            case 'loadItem':
                return this.loadItem(item, arg);
            case 'activateItem':
                return this.activateItem(item, arg);
        }
    };

    FileBrowser.prototype.loadItem = function(item, opt) {
        if (opt != null) {
            opt;
        } else {
            opt = {};
        }
        if (item.name != null) {
            item.name;
        } else {
            item.name = slash.file(item.file);
        }
        this.popColumnsFrom(1);
        switch (item.type) {
            case 'file':
                this.loadFileItem(item);
                break;
            case 'dir':
                this.loadDirItem(item, 0, {
                    active: '..'
                });
        }
        if (opt.focus) {
            return this.columns[0].focus();
        }
    };

    FileBrowser.prototype.activateItem = function(item, col) {
        this.clearColumnsFrom(col + 2, {
            pop: true
        });
        switch (item.type) {
            case 'dir':
                return this.loadDirItem(item, col + 1);
            case 'file':
                this.loadFileItem(item, col + 1);
                if (item.textFile) {
                    return post.emit('jumpToFile', item);
                }
        }
    };

    FileBrowser.prototype.loadFileItem = function(item, col) {
        var cnt, file;
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
        switch (slash.ext(file)) {
            case 'gif':
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'svg':
            case 'bmp':
            case 'ico':
                cnt = elem({
                    "class": 'browserImageContainer',
                    child: elem('img', {
                        "class": 'browserImage',
                        src: slash.fileUrl(file)
                    })
                });
                return this.columns[col].table.appendChild(cnt);
            case 'tiff':
            case 'tif':
                if (!slash.win()) {
                    return this.convertImage(row);
                }
                break;
            case 'pxm':
                if (!slash.win()) {
                    return this.convertPXM(row);
                }
                break;
            default:
                return this.loadSourceItem(item, col);
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
            return dirlist(dir, opt, (function(_this) {
                return function(err, items) {
                    if (err != null) {
                        return;
                    }
                    post.toMain('dirLoaded', dir);
                    dirCache.set(dir, items);
                    _this.loadDirItems(dir, item, items, col, opt);
                    return post.emit('dir', dir);
                };
            })(this));
        }
    };

    FileBrowser.prototype.loadDirItems = function(dir, item, items, col, opt) {
        var ref1, ref2, ref3, updir;
        updir = slash.resolve(slash.join(dir, '..'));
        if (col === 0 || col - 1 < this.numCols() && ((ref1 = this.columns[col - 1].activeRow()) != null ? ref1.item.name : void 0) === '..') {
            if ((ref2 = items[0].name) !== '..' && ref2 !== '/') {
                if (!((updir === dir && dir === slash.resolve('/')))) {
                    items.unshift({
                        name: '..',
                        type: 'dir',
                        file: updir
                    });
                } else {
                    items.unshift({
                        name: '/',
                        type: 'dir',
                        file: dir
                    });
                }
            }
        }
        while (col >= this.numCols()) {
            this.addColumn();
        }
        this.columns[col].loadItems(items, item);
        if (opt.active) {
            if ((ref3 = this.columns[col].row(slash.file(opt.active))) != null) {
                ref3.setActive();
            }
        }
        return this.getGitStatus(item, col);
    };

    FileBrowser.prototype.navigateToFile = function(file) {
        var col, col0index, filelist, i, index, item, lastItem, lastPath, lastType, lastdir, lastlist, listindex, opt, paths, pkgDir, pkglist, ref1, ref2, ref3, ref4, ref5, relative, relst, type, upCount;
        lastPath = (ref1 = this.lastUsedColumn()) != null ? ref1.path() : void 0;
        if (file === lastPath) {
            return;
        }
        if (slash.isRelative(file)) {
            return;
        }
        filelist = slash.pathlist(file);
        lastlist = slash.pathlist(lastPath);
        if (valid(lastlist)) {
            lastdir = last(lastlist);
            if ((ref2 = this.lastUsedColumn()) != null ? ref2.isFile() : void 0) {
                lastdir = slash.dir(lastdir);
            }
            relative = slash.relative(file, lastdir);
            if (slash.isRelative(relative)) {
                upCount = 0;
                while (relative.startsWith('../')) {
                    upCount += 1;
                    relative = relative.substr(3);
                }
                if (upCount < this.numCols() - 1) {
                    col = this.numCols() - 1 - upCount;
                    relst = slash.pathlist(relative);
                    paths = filelist.slice(filelist.length - relst.length);
                }
            }
        }
        if (empty(paths)) {
            pkgDir = slash.pkg(file);
            pkglist = slash.pathlist(pkgDir);
            listindex = pkglist.length - 1;
            col0index = listindex;
            col = 0;
            if (filelist[col0index] === ((ref3 = this.columns[0]) != null ? ref3.path() : void 0)) {
                while (col0index < lastlist.length && col0index < filelist.length && lastlist[col0index] === filelist[col0index]) {
                    col0index += 1;
                    col += 1;
                }
            }
            paths = filelist.slice(col0index);
        }
        if (slash.isFile(last(paths))) {
            lastType = 'file';
        } else {
            lastType = 'dir';
        }
        this.popColumnsFrom(col + paths.length);
        this.clearColumnsFrom(col);
        while (this.numCols() < paths.length) {
            this.addColumn();
        }
        if (col > 0) {
            if ((ref4 = this.columns[col - 1].row(slash.file(paths[0]))) != null) {
                ref4.setActive();
            }
        }
        for (index = i = 0, ref5 = paths.length; 0 <= ref5 ? i < ref5 : i > ref5; index = 0 <= ref5 ? ++i : --i) {
            type = index === paths.length - 1 ? lastType : 'dir';
            file = paths[index];
            if ((col === 0 && 0 === index) && type === 'file') {
                type = 'dir';
                file = slash.dir(file);
            }
            item = {
                file: file,
                type: type
            };
            switch (type) {
                case 'file':
                    this.loadFileItem(item, col + index);
                    break;
                case 'dir':
                    opt = {};
                    if (index < paths.length - 1) {
                        opt.active = paths[index + 1];
                    } else if ((col === 0 && 0 === index) && paths.length === 1) {
                        opt.active = paths[0];
                    }
                    this.loadDirItem(item, col + index, opt);
            }
        }
        lastItem = {
            file: last(paths),
            type: lastType
        };
        return this.emit('itemActivated', lastItem);
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
        column.clearSearch();
        return this.navigate('left');
    };

    FileBrowser.prototype.updateColumnScrolls = function() {
        FileBrowser.__super__.updateColumnScrolls.call(this);
        return this.shelf.scroll.update();
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
        return this.cols.style.left = this.shelfSize + "px";
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
        var col, files, i, ref1;
        files = hub.statusFiles(status);
        for (col = i = 0, ref1 = this.columns.length; 0 <= ref1 ? i <= ref1 : i >= ref1; col = 0 <= ref1 ? ++i : --i) {
            this.applyGitStatusFiles(col, files);
        }
        return this.shelf.updateGitFiles(files);
    };

    FileBrowser.prototype.refresh = function() {
        var ref1;
        hub.refresh();
        dirCache.reset();
        this.srcCache = {};
        if (this.lastUsedColumn()) {
            return this.navigateToFile((ref1 = this.lastUsedColumn()) != null ? ref1.path() : void 0);
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

    return FileBrowser;

})(Browser);

module.exports = FileBrowser;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWJyb3dzZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHVJQUFBO0lBQUE7Ozs7QUFRQSxNQUFvRixPQUFBLENBQVEsS0FBUixDQUFwRixFQUFFLGVBQUYsRUFBUSxpQkFBUixFQUFlLGlCQUFmLEVBQXNCLGlCQUF0QixFQUE2QixlQUE3QixFQUFtQyxlQUFuQyxFQUF5QyxlQUF6QyxFQUErQyxpQkFBL0MsRUFBc0QsZUFBdEQsRUFBNEQsaUJBQTVELEVBQW1FLFdBQW5FLEVBQXVFLFdBQXZFLEVBQTJFLFNBQTNFLEVBQThFOztBQUU5RSxPQUFBLEdBQVcsT0FBQSxDQUFRLFdBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxTQUFSOztBQUNYLE9BQUEsR0FBVyxPQUFBLENBQVEsa0JBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxtQkFBUjs7QUFDWCxHQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBRUw7OztJQUVXLHFCQUFDLElBQUQ7Ozs7Ozs7Ozs7OztRQUVULDZDQUFNLElBQU47UUFFQSxNQUFNLENBQUMsV0FBUCxHQUFxQjtRQUVyQixJQUFDLENBQUEsTUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLEtBQUQsR0FBVSxJQUFJLEtBQUosQ0FBVSxJQUFWO1FBQ1YsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUVWLElBQUMsQ0FBQSxRQUFELEdBQVk7UUFFWixJQUFJLENBQUMsRUFBTCxDQUFRLFdBQVIsRUFBdUIsSUFBQyxDQUFBLFdBQXhCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxhQUFSLEVBQXVCLElBQUMsQ0FBQSxhQUF4QjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsTUFBUixFQUF1QixJQUFDLENBQUEsTUFBeEI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLGFBQVIsRUFBdUIsSUFBQyxDQUFBLGFBQXhCO1FBQ0EsSUFBSSxDQUFD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QUEsSUFBQyxDQUFBLFFBQVMsQ0FBQSxJQUFBLENBQVYsR0FBa0I7UUFFbEIsSUFBRyxJQUFBLGtGQUFpQyxDQUFFLHVCQUF0QzttQkFDSSxJQUFDLENBQUEsY0FBRCxDQUFnQjtnQkFBRSxJQUFBLEVBQUssSUFBUDtnQkFBYSxJQUFBLEVBQUssTUFBbEI7YUFBaEIsK0NBQTZELENBQUUsY0FBL0QsRUFESjs7SUFKVzs7OztHQTFhTzs7QUFpYjFCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIHZhbGlkLCBlbXB0eSwgY2xhbXAsIGxhc3QsIGVsZW0sIGRyYWcsIHN0YXRlLCBrbG9nLCBzbGFzaCwgZnMsIG9zLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbkJyb3dzZXIgID0gcmVxdWlyZSAnLi9icm93c2VyJ1xuU2hlbGYgICAgPSByZXF1aXJlICcuL3NoZWxmJ1xuZGlybGlzdCAgPSByZXF1aXJlICcuLi90b29scy9kaXJsaXN0J1xuZGlyQ2FjaGUgPSByZXF1aXJlICcuLi90b29scy9kaXJjYWNoZSdcbmh1YiAgICAgID0gcmVxdWlyZSAnLi4vZ2l0L2h1YidcblxuY2xhc3MgRmlsZUJyb3dzZXIgZXh0ZW5kcyBCcm93c2VyXG5cbiAgICBjb25zdHJ1Y3RvcjogKHZpZXcpIC0+XG5cbiAgICAgICAgc3VwZXIgdmlld1xuXG4gICAgICAgIHdpbmRvdy5maWxlYnJvd3NlciA9IEBcblxuICAgICAgICBAbG9hZElEID0gMFxuICAgICAgICBAc2hlbGYgID0gbmV3IFNoZWxmIEBcbiAgICAgICAgQG5hbWUgICA9ICdGaWxlQnJvd3NlcidcblxuICAgICAgICBAc3JjQ2FjaGUgPSB7fVxuXG4gICAgICAgIHBvc3Qub24gJ2dpdFN0YXR1cycsICAgQG9uR2l0U3RhdHVzXG4gICAgICAgIHBvc3Qub24gJ2ZpbGVJbmRleGVkJywgQG9uRmlsZUluZGV4ZWRcbiAgICAgICAgcG9zdC5vbiAnZmlsZScsICAgICAgICBAb25GaWxlXG4gICAgICAgIHBvc3Qub24gJ2ZpbGVicm93c2VyJywgQG9uRmlsZUJyb3dzZXJcbiAgICAgICAgcG9zdC5vbiAnZGlyY2FjaGUnLCAgICBAb25EaXJDYWNoZVxuXG4gICAgICAgIEBzaGVsZlJlc2l6ZSA9IGVsZW0gJ2RpdicsIGNsYXNzOiAnc2hlbGZSZXNpemUnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLnRvcCAgICAgID0gJzBweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmJvdHRvbSAgID0gJzBweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmxlZnQgICAgID0gJzE5NHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUud2lkdGggICAgPSAnNnB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUuY3Vyc29yICAgPSAnZXctcmVzaXplJ1xuXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBzaGVsZlJlc2l6ZVxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uU2hlbGZEcmFnXG5cbiAgICAgICAgQHNoZWxmU2l6ZSA9IHdpbmRvdy5zdGF0ZS5nZXQgJ3NoZWxmOnNpemUnLCAyMDBcblxuICAgICAgICBAaW5pdENvbHVtbnMoKVxuXG4gICAgb25GaWxlQnJvd3NlcjogKGFjdGlvbiwgaXRlbSwgYXJnKSA9PlxuXG4gICAgICAgIHN3aXRjaCBhY3Rpb25cbiAgICAgICAgICAgIHdoZW4gJ2xvYWRJdGVtJyAgICAgdGhlbiBAbG9hZEl0ZW0gICAgIGl0ZW0sIGFyZ1xuICAgICAgICAgICAgd2hlbiAnYWN0aXZhdGVJdGVtJyB0aGVuIEBhY3RpdmF0ZUl0ZW0gaXRlbSwgYXJnXG5cbiAgICAjIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbG9hZEl0ZW06IChpdGVtLCBvcHQpIC0+XG5cbiAgICAgICAgb3B0ID89IHt9XG4gICAgICAgIGl0ZW0ubmFtZSA/PSBzbGFzaC5maWxlIGl0ZW0uZmlsZVxuXG4gICAgICAgIEBwb3BDb2x1bW5zRnJvbSAxXG5cbiAgICAgICAgc3dpdGNoIGl0ZW0udHlwZVxuICAgICAgICAgICAgd2hlbiAnZmlsZScgdGhlbiBAbG9hZEZpbGVJdGVtIGl0ZW1cbiAgICAgICAgICAgIHdoZW4gJ2RpcicgIHRoZW4gQGxvYWREaXJJdGVtICBpdGVtLCAwLCBhY3RpdmU6Jy4uJ1xuXG4gICAgICAgIGlmIG9wdC5mb2N1c1xuICAgICAgICAgICAgQGNvbHVtbnNbMF0uZm9jdXMoKVxuXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIGFjdGl2YXRlSXRlbTogKGl0ZW0sIGNvbCkgLT5cblxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2wrMiwgcG9wOnRydWVcblxuICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtICBpdGVtLCBjb2wrMVxuICAgICAgICAgICAgd2hlbiAnZmlsZSdcbiAgICAgICAgICAgICAgICBAbG9hZEZpbGVJdGVtIGl0ZW0sIGNvbCsxXG4gICAgICAgICAgICAgICAgaWYgaXRlbS50ZXh0RmlsZVxuICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUb0ZpbGUnLCBpdGVtXG5cbiAgICAjIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsb2FkRmlsZUl0ZW06IChpdGVtLCBjb2w9MCkgLT5cblxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2wsIHBvcDp0cnVlXG5cbiAgICAgICAgd2hpbGUgY29sID49IEBudW1Db2xzKClcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuXG4gICAgICAgIGZpbGUgPSBpdGVtLmZpbGVcblxuICAgICAgICBzd2l0Y2ggc2xhc2guZXh0IGZpbGVcbiAgICAgICAgICAgIHdoZW4gJ2dpZicsICdwbmcnLCAnanBnJywgJ2pwZWcnLCAnc3ZnJywgJ2JtcCcsICdpY28nXG4gICAgICAgICAgICAgICAgY250ID0gZWxlbSBjbGFzczogJ2Jyb3dzZXJJbWFnZUNvbnRhaW5lcicsIGNoaWxkOlxuICAgICAgICAgICAgICAgICAgICBlbGVtICdpbWcnLCBjbGFzczogJ2Jyb3dzZXJJbWFnZScsIHNyYzogc2xhc2guZmlsZVVybCBmaWxlXG4gICAgICAgICAgICAgICAgQGNvbHVtbnNbY29sXS50YWJsZS5hcHBlbmRDaGlsZCBjbnRcbiAgICAgICAgICAgIHdoZW4gJ3RpZmYnLCAndGlmJ1xuICAgICAgICAgICAgICAgIGlmIG5vdCBzbGFzaC53aW4oKVxuICAgICAgICAgICAgICAgICAgICBAY29udmVydEltYWdlIHJvd1xuICAgICAgICAgICAgd2hlbiAncHhtJ1xuICAgICAgICAgICAgICAgIGlmIG5vdCBzbGFzaC53aW4oKVxuICAgICAgICAgICAgICAgICAgICBAY29udmVydFBYTSByb3dcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAbG9hZFNvdXJjZUl0ZW0gaXRlbSwgY29sXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbG9hZFNvdXJjZUl0ZW06IChpdGVtLCBjb2wpIC0+XG5cbiAgICAgICAgaWYgbm90IEBzcmNDYWNoZVtpdGVtLmZpbGVdP1xuXG4gICAgICAgICAgICBAc3JjQ2FjaGVbaXRlbS5maWxlXSA9IHBvc3QuZ2V0ICdpbmRleGVyJyAnZmlsZScgaXRlbS5maWxlXG5cbiAgICAgICAgaW5mbyA9IEBzcmNDYWNoZVtpdGVtLmZpbGVdXG5cbiAgICAgICAgaWYgZW1wdHkgaW5mb1xuICAgICAgICAgICAgQGNvbHVtbnNbY29sXS5sb2FkSXRlbXMgW10sIGl0ZW1cbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGl0ZW1zID0gW11cbiAgICAgICAgY2xzc3MgPSBpbmZvLmNsYXNzZXMgPyBbXVxuICAgICAgICBmb3IgY2xzcyBpbiBjbHNzc1xuICAgICAgICAgICAgdGV4dCA9ICfil48gJytjbHNzLm5hbWVcbiAgICAgICAgICAgIGl0ZW1zLnB1c2ggbmFtZTpjbHNzLm5hbWUsIHRleHQ6dGV4dCwgdHlwZTonY2xhc3MnLCBmaWxlOml0ZW0uZmlsZSwgbGluZTpjbHNzLmxpbmVcblxuICAgICAgICBmdW5jcyA9IGluZm8uZnVuY3MgPyBbXVxuICAgICAgICBmb3IgZnVuYyBpbiBmdW5jc1xuICAgICAgICAgICAgaWYgZnVuYy50ZXN0ID09ICdkZXNjcmliZSdcbiAgICAgICAgICAgICAgICB0ZXh0ID0gJ+KXjyAnK2Z1bmMubmFtZVxuICAgICAgICAgICAgZWxzZSBpZiBmdW5jLnN0YXRpY1xuICAgICAgICAgICAgICAgIHRleHQgPSAnICDil4YgJytmdW5jLm5hbWVcbiAgICAgICAgICAgIGVsc2UgaWYgZnVuYy5wb3N0XG4gICAgICAgICAgICAgICAgdGV4dCA9ICcgIOKsoiAnK2Z1bmMubmFtZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRleHQgPSAnICDilrggJytmdW5jLm5hbWVcbiAgICAgICAgICAgIGl0ZW1zLnB1c2ggbmFtZTpmdW5jLm5hbWUsIHRleHQ6dGV4dCwgdHlwZTonZnVuYycsIGZpbGU6aXRlbS5maWxlLCBsaW5lOmZ1bmMubGluZVxuXG4gICAgICAgIGlmIHZhbGlkIGl0ZW1zXG4gICAgICAgICAgICBpdGVtcy5zb3J0IChhLGIpIC0+IGEubGluZSAtIGIubGluZVxuICAgICAgICAgICAgQGNvbHVtbnNbY29sXS5sb2FkSXRlbXMgaXRlbXMsIGl0ZW1cblxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBvbkRpckNhY2hlOiAoZGlyKSA9PlxuXG4gICAgICAgIGZvciBjb2x1bW4gaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIGNvbHVtbi5wYXRoKCkgPT0gZGlyXG4gICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtIHtmaWxlOmRpciwgdHlwZTonZGlyJ30sIGNvbHVtbi5pbmRleCwgYWN0aXZlOmNvbHVtbi5hY3RpdmVQYXRoKClcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgIGxvYWREaXJJdGVtOiAoaXRlbSwgY29sPTAsIG9wdD17fSkgLT5cblxuICAgICAgICByZXR1cm4gaWYgY29sID4gMCBhbmQgaXRlbS5uYW1lID09ICcvJ1xuXG4gICAgICAgIGRpciA9IGl0ZW0uZmlsZVxuXG4gICAgICAgIGlmIGRpckNhY2hlLmhhcyhkaXIpIGFuZCBub3Qgb3B0Lmlnbm9yZUNhY2hlXG4gICAgICAgICAgICBAbG9hZERpckl0ZW1zIGRpciwgaXRlbSwgZGlyQ2FjaGUuZ2V0KGRpciksIGNvbCwgb3B0XG4gICAgICAgICAgICBwb3N0LmVtaXQgJ2RpcicsIGRpclxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBvcHQuaWdub3JlSGlkZGVuID0gbm90IHdpbmRvdy5zdGF0ZS5nZXQgXCJicm93c2VyfHNob3dIaWRkZW58I3tkaXJ9XCJcblxuICAgICAgICAgICAgZGlybGlzdCBkaXIsIG9wdCwgKGVyciwgaXRlbXMpID0+XG5cbiAgICAgICAgICAgICAgICBpZiBlcnI/IHRoZW4gcmV0dXJuXG5cbiAgICAgICAgICAgICAgICBwb3N0LnRvTWFpbiAnZGlyTG9hZGVkJywgZGlyXG5cbiAgICAgICAgICAgICAgICBkaXJDYWNoZS5zZXQgZGlyLCBpdGVtc1xuICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbXMgZGlyLCBpdGVtLCBpdGVtcywgY29sLCBvcHRcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2RpcicsIGRpclxuXG4gICAgbG9hZERpckl0ZW1zOiAoZGlyLCBpdGVtLCBpdGVtcywgY29sLCBvcHQpID0+XG5cbiAgICAgICAgdXBkaXIgPSBzbGFzaC5yZXNvbHZlIHNsYXNoLmpvaW4gZGlyLCAnLi4nXG5cbiAgICAgICAgaWYgY29sID09IDAgb3IgY29sLTEgPCBAbnVtQ29scygpIGFuZCBAY29sdW1uc1tjb2wtMV0uYWN0aXZlUm93KCk/Lml0ZW0ubmFtZSA9PSAnLi4nXG4gICAgICAgICAgICBpZiBpdGVtc1swXS5uYW1lIG5vdCBpbiBbJy4uJywgJy8nXVxuICAgICAgICAgICAgICAgIGlmIG5vdCAodXBkaXIgPT0gZGlyID09IHNsYXNoLnJlc29sdmUgJy8nKVxuICAgICAgICAgICAgICAgICAgICBpdGVtcy51bnNoaWZ0XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnLi4nXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogIHVwZGlyXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBpdGVtcy51bnNoaWZ0XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnLydcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiBkaXJcblxuICAgICAgICB3aGlsZSBjb2wgPj0gQG51bUNvbHMoKVxuICAgICAgICAgICAgQGFkZENvbHVtbigpXG5cbiAgICAgICAgQGNvbHVtbnNbY29sXS5sb2FkSXRlbXMgaXRlbXMsIGl0ZW1cblxuICAgICAgICBpZiBvcHQuYWN0aXZlXG4gICAgICAgICAgICBAY29sdW1uc1tjb2xdLnJvdyhzbGFzaC5maWxlIG9wdC5hY3RpdmUpPy5zZXRBY3RpdmUoKVxuXG4gICAgICAgIEBnZXRHaXRTdGF0dXMgaXRlbSwgY29sXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBuYXZpZ2F0ZVRvRmlsZTogKGZpbGUpIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICMga2xvZyAnZmlsZWJyb3dzZXIubmF2aWdhdGVUb0ZpbGUnIGZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgbGFzdFBhdGggPSBAbGFzdFVzZWRDb2x1bW4oKT8ucGF0aCgpXG4gICAgICAgIGlmIGZpbGUgPT0gbGFzdFBhdGhcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIHNsYXNoLmlzUmVsYXRpdmUgZmlsZVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgZmlsZWxpc3QgPSBzbGFzaC5wYXRobGlzdCBmaWxlXG4gICAgICAgIGxhc3RsaXN0ID0gc2xhc2gucGF0aGxpc3QgbGFzdFBhdGhcblxuICAgICAgICBpZiB2YWxpZCBsYXN0bGlzdFxuXG4gICAgICAgICAgICBsYXN0ZGlyID0gbGFzdCBsYXN0bGlzdFxuICAgICAgICAgICAgaWYgQGxhc3RVc2VkQ29sdW1uKCk/LmlzRmlsZSgpXG4gICAgICAgICAgICAgICAgbGFzdGRpciA9IHNsYXNoLmRpciBsYXN0ZGlyXG4gICAgICAgICAgICByZWxhdGl2ZSA9IHNsYXNoLnJlbGF0aXZlIGZpbGUsIGxhc3RkaXJcblxuICAgICAgICAgICAgaWYgc2xhc2guaXNSZWxhdGl2ZSByZWxhdGl2ZVxuICAgICAgICAgICAgICAgIHVwQ291bnQgPSAwXG4gICAgICAgICAgICAgICAgd2hpbGUgcmVsYXRpdmUuc3RhcnRzV2l0aCAnLi4vJ1xuICAgICAgICAgICAgICAgICAgICB1cENvdW50ICs9IDFcbiAgICAgICAgICAgICAgICAgICAgcmVsYXRpdmUgPSByZWxhdGl2ZS5zdWJzdHIgM1xuXG4gICAgICAgICAgICAgICAgaWYgdXBDb3VudCA8IEBudW1Db2xzKCktMVxuICAgICAgICAgICAgICAgICAgICBjb2wgICA9IEBudW1Db2xzKCkgLSAxIC0gdXBDb3VudFxuICAgICAgICAgICAgICAgICAgICByZWxzdCA9IHNsYXNoLnBhdGhsaXN0IHJlbGF0aXZlXG4gICAgICAgICAgICAgICAgICAgIHBhdGhzID0gZmlsZWxpc3Quc2xpY2UgZmlsZWxpc3QubGVuZ3RoIC0gcmVsc3QubGVuZ3RoXG5cbiAgICAgICAgaWYgZW1wdHkgcGF0aHNcblxuICAgICAgICAgICAgcGtnRGlyICAgPSBzbGFzaC5wa2cgZmlsZVxuICAgICAgICAgICAgcGtnbGlzdCAgPSBzbGFzaC5wYXRobGlzdCBwa2dEaXJcblxuICAgICAgICAgICAgbGlzdGluZGV4ID0gcGtnbGlzdC5sZW5ndGggLSAxXG4gICAgICAgICAgICBjb2wwaW5kZXggPSBsaXN0aW5kZXhcbiAgICAgICAgICAgIGNvbCA9IDBcblxuICAgICAgICAgICAgaWYgZmlsZWxpc3RbY29sMGluZGV4XSA9PSBAY29sdW1uc1swXT8ucGF0aCgpXG4gICAgICAgICAgICAgICAgd2hpbGUgY29sMGluZGV4IDwgbGFzdGxpc3QubGVuZ3RoIGFuZCBjb2wwaW5kZXggPCBmaWxlbGlzdC5sZW5ndGggYW5kIGxhc3RsaXN0W2NvbDBpbmRleF0gPT0gZmlsZWxpc3RbY29sMGluZGV4XVxuICAgICAgICAgICAgICAgICAgICBjb2wwaW5kZXggKz0gMVxuICAgICAgICAgICAgICAgICAgICBjb2wgKz0gMVxuXG4gICAgICAgICAgICBwYXRocyA9IGZpbGVsaXN0LnNsaWNlIGNvbDBpbmRleFxuICAgICAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmlzRmlsZSBsYXN0IHBhdGhzXG4gICAgICAgICAgICBsYXN0VHlwZSA9ICdmaWxlJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBsYXN0VHlwZSA9ICdkaXInXG5cbiAgICAgICAgQHBvcENvbHVtbnNGcm9tICAgY29sK3BhdGhzLmxlbmd0aFxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2xcbiAgICAgICAgXG4gICAgICAgIHdoaWxlIEBudW1Db2xzKCkgPCBwYXRocy5sZW5ndGhcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuICAgICAgICBcbiAgICAgICAgaWYgY29sID4gMFxuICAgICAgICAgICAgQGNvbHVtbnNbY29sLTFdLnJvdyhzbGFzaC5maWxlIHBhdGhzWzBdKT8uc2V0QWN0aXZlKClcblxuICAgICAgICBmb3IgaW5kZXggaW4gWzAuLi5wYXRocy5sZW5ndGhdXG4gICAgICAgICAgICB0eXBlID0gaWYgaW5kZXggPT0gcGF0aHMubGVuZ3RoLTEgdGhlbiBsYXN0VHlwZSBlbHNlICdkaXInXG4gICAgICAgICAgICBmaWxlID0gcGF0aHNbaW5kZXhdXG4gICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBjb2wgPT0gMCA9PSBpbmRleCBhbmQgdHlwZSA9PSAnZmlsZSdcbiAgICAgICAgICAgICAgICB0eXBlID0gJ2RpcidcbiAgICAgICAgICAgICAgICBmaWxlID0gc2xhc2guZGlyIGZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGl0ZW0gPSBmaWxlOmZpbGUsIHR5cGU6dHlwZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzd2l0Y2ggdHlwZVxuICAgICAgICAgICAgICAgIHdoZW4gJ2ZpbGUnIHRoZW4gQGxvYWRGaWxlSXRlbSBpdGVtLCBjb2wraW5kZXhcbiAgICAgICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgICAgIG9wdCA9IHt9XG4gICAgICAgICAgICAgICAgICAgIGlmIGluZGV4IDwgcGF0aHMubGVuZ3RoLTFcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdC5hY3RpdmUgPSBwYXRoc1tpbmRleCsxXVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGNvbCA9PSAwID09IGluZGV4IGFuZCBwYXRocy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0LmFjdGl2ZSA9IHBhdGhzWzBdXG4gICAgICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbSBpdGVtLCBjb2wraW5kZXgsIG9wdFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICMgaWYgY29sID09IDAgPT0gaW5kZXggYW5kIHBhdGhzLmxlbmd0aCA9PSAxXG4gICAgICAgICAgICAgICAgIyBAY29sdW1uc1tjb2xdLnJvdyhzbGFzaC5maWxlIHBhdGhzWzBdKT8uc2V0QWN0aXZlKClcblxuICAgICAgICBsYXN0SXRlbSA9IGZpbGU6bGFzdChwYXRocyksIHR5cGU6bGFzdFR5cGVcbiAgICAgICAgXG4gICAgICAgIEBlbWl0ICdpdGVtQWN0aXZhdGVkJyBsYXN0SXRlbVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIG9uRmlsZTogKGZpbGUpID0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBmaWxlXG4gICAgICAgIHJldHVybiBpZiBub3QgQGZsZXhcblxuICAgICAgICBAbmF2aWdhdGVUb0ZpbGUgZmlsZVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgaW5pdENvbHVtbnM6IC0+XG5cbiAgICAgICAgc3VwZXIoKVxuXG4gICAgICAgIEB2aWV3Lmluc2VydEJlZm9yZSBAc2hlbGYuZGl2LCBAdmlldy5maXJzdENoaWxkXG4gICAgICAgIEB2aWV3Lmluc2VydEJlZm9yZSBAc2hlbGZSZXNpemUsIG51bGxcblxuICAgICAgICBAc2hlbGYuYnJvd3NlckRpZEluaXRDb2x1bW5zKClcblxuICAgICAgICBAc2V0U2hlbGZTaXplIEBzaGVsZlNpemVcblxuICAgIGNvbHVtbkF0UG9zOiAocG9zKSAtPlxuXG4gICAgICAgIGlmIGNvbHVtbiA9IHN1cGVyIHBvc1xuICAgICAgICAgICAgcmV0dXJuIGNvbHVtblxuXG4gICAgICAgIGlmIGVsZW0uY29udGFpbnNQb3MgQHNoZWxmLmRpdiwgcG9zXG4gICAgICAgICAgICByZXR1cm4gQHNoZWxmXG5cbiAgICBsYXN0Q29sdW1uUGF0aDogLT5cblxuICAgICAgICBpZiBsYXN0Q29sdW1uID0gQGxhc3RVc2VkQ29sdW1uKClcbiAgICAgICAgICAgIHJldHVybiBsYXN0Q29sdW1uLnBhdGgoKVxuXG4gICAgbGFzdERpckNvbHVtbjogLT5cblxuICAgICAgICBpZiBsYXN0Q29sdW1uID0gQGxhc3RVc2VkQ29sdW1uKClcbiAgICAgICAgICAgIGlmIGxhc3RDb2x1bW4uaXNEaXIoKVxuICAgICAgICAgICAgICAgIHJldHVybiBsYXN0Q29sdW1uXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW4ucHJldkNvbHVtbigpXG5cbiAgICBvbkJhY2tzcGFjZUluQ29sdW1uOiAoY29sdW1uKSAtPlxuXG4gICAgICAgIGNvbHVtbi5jbGVhclNlYXJjaCgpXG4gICAgICAgIEBuYXZpZ2F0ZSAnbGVmdCdcblxuICAgIHVwZGF0ZUNvbHVtblNjcm9sbHM6ID0+XG5cbiAgICAgICAgc3VwZXIoKVxuICAgICAgICBAc2hlbGYuc2Nyb2xsLnVwZGF0ZSgpXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMFxuXG4gICAgb25TaGVsZkRyYWc6IChkcmFnLCBldmVudCkgPT5cblxuICAgICAgICBzaGVsZlNpemUgPSBjbGFtcCAwLCA0MDAsIGRyYWcucG9zLnhcbiAgICAgICAgQHNldFNoZWxmU2l6ZSBzaGVsZlNpemVcblxuICAgIHNldFNoZWxmU2l6ZTogKEBzaGVsZlNpemUpIC0+XG5cbiAgICAgICAgd2luZG93LnN0YXRlLnNldCAnc2hlbGZ8c2l6ZScsIEBzaGVsZlNpemVcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmxlZnQgPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEBzaGVsZi5kaXYuc3R5bGUud2lkdGggPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEBjb2xzLnN0eWxlLmxlZnQgPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbiAgICBnZXRHaXRTdGF0dXM6IChpdGVtLCBjb2wpID0+XG5cbiAgICAgICAgZmlsZSA9IGl0ZW0uZmlsZSA/IGl0ZW0ucGFyZW50Py5maWxlXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBmaWxlXG5cbiAgICAgICAgaHViLnN0YXR1cyBmaWxlLCAoc3RhdHVzKSA9PiBAYXBwbHlHaXRTdGF0dXNGaWxlcyBjb2wsIGh1Yi5zdGF0dXNGaWxlcyBzdGF0dXNcblxuICAgIGFwcGx5R2l0U3RhdHVzRmlsZXM6IChjb2wsIGZpbGVzKSA9PlxuXG4gICAgICAgIEBjb2x1bW5zW2NvbF0/LnVwZGF0ZUdpdEZpbGVzIGZpbGVzXG5cbiAgICBvbkdpdFN0YXR1czogKGdpdERpciwgc3RhdHVzKSA9PlxuXG4gICAgICAgIGZpbGVzID0gaHViLnN0YXR1c0ZpbGVzIHN0YXR1c1xuICAgICAgICBmb3IgY29sIGluIFswLi5AY29sdW1ucy5sZW5ndGhdXG4gICAgICAgICAgICBAYXBwbHlHaXRTdGF0dXNGaWxlcyBjb2wsIGZpbGVzXG5cbiAgICAgICAgQHNoZWxmLnVwZGF0ZUdpdEZpbGVzIGZpbGVzXG5cbiAgICByZWZyZXNoOiA9PlxuXG4gICAgICAgIGh1Yi5yZWZyZXNoKClcblxuICAgICAgICBkaXJDYWNoZS5yZXNldCgpXG4gICAgICAgIEBzcmNDYWNoZSA9IHt9XG5cbiAgICAgICAgaWYgQGxhc3RVc2VkQ29sdW1uKClcbiAgICAgICAgICAgIEBuYXZpZ2F0ZVRvRmlsZSBAbGFzdFVzZWRDb2x1bW4oKT8ucGF0aCgpXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgb25GaWxlSW5kZXhlZDogKGZpbGUsIGluZm8pID0+XG5cbiAgICAgICAgQHNyY0NhY2hlW2ZpbGVdID0gaW5mb1xuXG4gICAgICAgIGlmIGZpbGUgPT0gQGxhc3RVc2VkQ29sdW1uKCk/LnBhcmVudD8uZmlsZVxuICAgICAgICAgICAgQGxvYWRTb3VyY2VJdGVtIHsgZmlsZTpmaWxlLCB0eXBlOidmaWxlJyB9LCBAbGFzdFVzZWRDb2x1bW4oKT8uaW5kZXhcblxubW9kdWxlLmV4cG9ydHMgPSBGaWxlQnJvd3NlclxuIl19
//# sourceURL=../../coffee/browser/filebrowser.coffee