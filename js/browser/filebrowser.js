// koffee 1.4.0

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
        this.shelfSize = window.state.get('shelf|size', 200);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWJyb3dzZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHVJQUFBO0lBQUE7Ozs7QUFRQSxNQUFvRixPQUFBLENBQVEsS0FBUixDQUFwRixFQUFFLGVBQUYsRUFBUSxpQkFBUixFQUFlLGlCQUFmLEVBQXNCLGlCQUF0QixFQUE2QixlQUE3QixFQUFtQyxlQUFuQyxFQUF5QyxlQUF6QyxFQUErQyxpQkFBL0MsRUFBc0QsZUFBdEQsRUFBNEQsaUJBQTVELEVBQW1FLFdBQW5FLEVBQXVFLFdBQXZFLEVBQTJFLFNBQTNFLEVBQThFOztBQUU5RSxPQUFBLEdBQVcsT0FBQSxDQUFRLFdBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxTQUFSOztBQUNYLE9BQUEsR0FBVyxPQUFBLENBQVEsa0JBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxtQkFBUjs7QUFDWCxHQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBRUw7OztJQUVXLHFCQUFDLElBQUQ7Ozs7Ozs7Ozs7OztRQUVULDZDQUFNLElBQU47UUFFQSxNQUFNLENBQUMsV0FBUCxHQUFxQjtRQUVyQixJQUFDLENBQUEsTUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLEtBQUQsR0FBVSxJQUFJLEtBQUosQ0FBVSxJQUFWO1FBQ1YsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUVWLElBQUMsQ0FBQSxRQUFELEdBQVk7UUFFWixJQUFJLENBQUMsRUFBTCxDQUFRLFdBQVIsRUFBdUIsSUFBQyxDQUFBLFdBQXhCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxhQUFSLEVBQXVCLElBQUMsQ0FBQSxhQUF4QjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsTUFBUixFQUF1QixJQUFDLENBQUEsTUFBeEI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLGFBQVIsRUFBdUIsSUFBQyxDQUFBLGFBQXhCO1FBQ0EsSUFBSSxDQUFD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LElBQUMsQ0FBQSxRQUFTLENBQUEsSUFBQSxDQUFWLEdBQWtCO1FBRWxCLElBQUcsSUFBQSxrRkFBaUMsQ0FBRSx1QkFBdEM7bUJBQ0ksSUFBQyxDQUFBLGNBQUQsQ0FBZ0I7Z0JBQUUsSUFBQSxFQUFLLElBQVA7Z0JBQWEsSUFBQSxFQUFLLE1BQWxCO2FBQWhCLCtDQUE2RCxDQUFFLGNBQS9ELEVBREo7O0lBSlc7Ozs7R0ExYU87O0FBaWIxQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBwb3N0LCB2YWxpZCwgZW1wdHksIGNsYW1wLCBsYXN0LCBlbGVtLCBkcmFnLCBzdGF0ZSwga2xvZywgc2xhc2gsIGZzLCBvcywgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Ccm93c2VyICA9IHJlcXVpcmUgJy4vYnJvd3NlcidcblNoZWxmICAgID0gcmVxdWlyZSAnLi9zaGVsZidcbmRpcmxpc3QgID0gcmVxdWlyZSAnLi4vdG9vbHMvZGlybGlzdCdcbmRpckNhY2hlID0gcmVxdWlyZSAnLi4vdG9vbHMvZGlyY2FjaGUnXG5odWIgICAgICA9IHJlcXVpcmUgJy4uL2dpdC9odWInXG5cbmNsYXNzIEZpbGVCcm93c2VyIGV4dGVuZHMgQnJvd3NlclxuXG4gICAgY29uc3RydWN0b3I6ICh2aWV3KSAtPlxuXG4gICAgICAgIHN1cGVyIHZpZXdcblxuICAgICAgICB3aW5kb3cuZmlsZWJyb3dzZXIgPSBAXG5cbiAgICAgICAgQGxvYWRJRCA9IDBcbiAgICAgICAgQHNoZWxmICA9IG5ldyBTaGVsZiBAXG4gICAgICAgIEBuYW1lICAgPSAnRmlsZUJyb3dzZXInXG5cbiAgICAgICAgQHNyY0NhY2hlID0ge31cblxuICAgICAgICBwb3N0Lm9uICdnaXRTdGF0dXMnLCAgIEBvbkdpdFN0YXR1c1xuICAgICAgICBwb3N0Lm9uICdmaWxlSW5kZXhlZCcsIEBvbkZpbGVJbmRleGVkXG4gICAgICAgIHBvc3Qub24gJ2ZpbGUnLCAgICAgICAgQG9uRmlsZVxuICAgICAgICBwb3N0Lm9uICdmaWxlYnJvd3NlcicsIEBvbkZpbGVCcm93c2VyXG4gICAgICAgIHBvc3Qub24gJ2RpcmNhY2hlJywgICAgQG9uRGlyQ2FjaGVcblxuICAgICAgICBAc2hlbGZSZXNpemUgPSBlbGVtICdkaXYnLCBjbGFzczogJ3NoZWxmUmVzaXplJ1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS50b3AgICAgICA9ICcwcHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5ib3R0b20gICA9ICcwcHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5sZWZ0ICAgICA9ICcxOTRweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLndpZHRoICAgID0gJzZweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmN1cnNvciAgID0gJ2V3LXJlc2l6ZSdcblxuICAgICAgICBAZHJhZyA9IG5ldyBkcmFnXG4gICAgICAgICAgICB0YXJnZXQ6ICBAc2hlbGZSZXNpemVcbiAgICAgICAgICAgIG9uTW92ZTogIEBvblNoZWxmRHJhZ1xuXG4gICAgICAgIEBzaGVsZlNpemUgPSB3aW5kb3cuc3RhdGUuZ2V0ICdzaGVsZnxzaXplJywgMjAwXG5cbiAgICAgICAgQGluaXRDb2x1bW5zKClcblxuICAgIG9uRmlsZUJyb3dzZXI6IChhY3Rpb24sIGl0ZW0sIGFyZykgPT5cblxuICAgICAgICBzd2l0Y2ggYWN0aW9uXG4gICAgICAgICAgICB3aGVuICdsb2FkSXRlbScgICAgIHRoZW4gQGxvYWRJdGVtICAgICBpdGVtLCBhcmdcbiAgICAgICAgICAgIHdoZW4gJ2FjdGl2YXRlSXRlbScgdGhlbiBAYWN0aXZhdGVJdGVtIGl0ZW0sIGFyZ1xuXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGxvYWRJdGVtOiAoaXRlbSwgb3B0KSAtPlxuXG4gICAgICAgIG9wdCA/PSB7fVxuICAgICAgICBpdGVtLm5hbWUgPz0gc2xhc2guZmlsZSBpdGVtLmZpbGVcblxuICAgICAgICBAcG9wQ29sdW1uc0Zyb20gMVxuXG4gICAgICAgIHN3aXRjaCBpdGVtLnR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2ZpbGUnIHRoZW4gQGxvYWRGaWxlSXRlbSBpdGVtXG4gICAgICAgICAgICB3aGVuICdkaXInICB0aGVuIEBsb2FkRGlySXRlbSAgaXRlbSwgMCwgYWN0aXZlOicuLidcblxuICAgICAgICBpZiBvcHQuZm9jdXNcbiAgICAgICAgICAgIEBjb2x1bW5zWzBdLmZvY3VzKClcblxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBhY3RpdmF0ZUl0ZW06IChpdGVtLCBjb2wpIC0+XG5cbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sKzIsIHBvcDp0cnVlXG5cbiAgICAgICAgc3dpdGNoIGl0ZW0udHlwZVxuICAgICAgICAgICAgd2hlbiAnZGlyJ1xuICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbSAgaXRlbSwgY29sKzFcbiAgICAgICAgICAgIHdoZW4gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgQGxvYWRGaWxlSXRlbSBpdGVtLCBjb2wrMVxuICAgICAgICAgICAgICAgIGlmIGl0ZW0udGV4dEZpbGVcbiAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG9GaWxlJywgaXRlbVxuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbG9hZEZpbGVJdGVtOiAoaXRlbSwgY29sPTApIC0+XG5cbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sLCBwb3A6dHJ1ZVxuXG4gICAgICAgIHdoaWxlIGNvbCA+PSBAbnVtQ29scygpXG4gICAgICAgICAgICBAYWRkQ29sdW1uKClcblxuICAgICAgICBmaWxlID0gaXRlbS5maWxlXG5cbiAgICAgICAgc3dpdGNoIHNsYXNoLmV4dCBmaWxlXG4gICAgICAgICAgICB3aGVuICdnaWYnICdwbmcnICdqcGcnICdqcGVnJyAnc3ZnJyAnYm1wJyAnaWNvJ1xuICAgICAgICAgICAgICAgIGNudCA9IGVsZW0gY2xhc3M6ICdicm93c2VySW1hZ2VDb250YWluZXInIGNoaWxkOlxuICAgICAgICAgICAgICAgICAgICBlbGVtICdpbWcnIGNsYXNzOiAnYnJvd3NlckltYWdlJyBzcmM6IHNsYXNoLmZpbGVVcmwgZmlsZVxuICAgICAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0udGFibGUuYXBwZW5kQ2hpbGQgY250XG4gICAgICAgICAgICB3aGVuICd0aWZmJyAndGlmJ1xuICAgICAgICAgICAgICAgIGlmIG5vdCBzbGFzaC53aW4oKVxuICAgICAgICAgICAgICAgICAgICBAY29udmVydEltYWdlIHJvd1xuICAgICAgICAgICAgd2hlbiAncHhtJ1xuICAgICAgICAgICAgICAgIGlmIG5vdCBzbGFzaC53aW4oKVxuICAgICAgICAgICAgICAgICAgICBAY29udmVydFBYTSByb3dcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAbG9hZFNvdXJjZUl0ZW0gaXRlbSwgY29sXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbG9hZFNvdXJjZUl0ZW06IChpdGVtLCBjb2wpIC0+XG5cbiAgICAgICAgaWYgbm90IEBzcmNDYWNoZVtpdGVtLmZpbGVdP1xuXG4gICAgICAgICAgICBAc3JjQ2FjaGVbaXRlbS5maWxlXSA9IHBvc3QuZ2V0ICdpbmRleGVyJyAnZmlsZScgaXRlbS5maWxlXG5cbiAgICAgICAgaW5mbyA9IEBzcmNDYWNoZVtpdGVtLmZpbGVdXG5cbiAgICAgICAgaWYgZW1wdHkgaW5mb1xuICAgICAgICAgICAgQGNvbHVtbnNbY29sXS5sb2FkSXRlbXMgW10sIGl0ZW1cbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGl0ZW1zID0gW11cbiAgICAgICAgY2xzc3MgPSBpbmZvLmNsYXNzZXMgPyBbXVxuICAgICAgICBmb3IgY2xzcyBpbiBjbHNzc1xuICAgICAgICAgICAgdGV4dCA9ICfil48gJytjbHNzLm5hbWVcbiAgICAgICAgICAgIGl0ZW1zLnB1c2ggbmFtZTpjbHNzLm5hbWUsIHRleHQ6dGV4dCwgdHlwZTonY2xhc3MnLCBmaWxlOml0ZW0uZmlsZSwgbGluZTpjbHNzLmxpbmVcblxuICAgICAgICBmdW5jcyA9IGluZm8uZnVuY3MgPyBbXVxuICAgICAgICBmb3IgZnVuYyBpbiBmdW5jc1xuICAgICAgICAgICAgaWYgZnVuYy50ZXN0ID09ICdkZXNjcmliZSdcbiAgICAgICAgICAgICAgICB0ZXh0ID0gJ+KXjyAnK2Z1bmMubmFtZVxuICAgICAgICAgICAgZWxzZSBpZiBmdW5jLnN0YXRpY1xuICAgICAgICAgICAgICAgIHRleHQgPSAnICDil4YgJytmdW5jLm5hbWVcbiAgICAgICAgICAgIGVsc2UgaWYgZnVuYy5wb3N0XG4gICAgICAgICAgICAgICAgdGV4dCA9ICcgIOKsoiAnK2Z1bmMubmFtZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRleHQgPSAnICDilrggJytmdW5jLm5hbWVcbiAgICAgICAgICAgIGl0ZW1zLnB1c2ggbmFtZTpmdW5jLm5hbWUsIHRleHQ6dGV4dCwgdHlwZTonZnVuYycsIGZpbGU6aXRlbS5maWxlLCBsaW5lOmZ1bmMubGluZVxuXG4gICAgICAgIGlmIHZhbGlkIGl0ZW1zXG4gICAgICAgICAgICBpdGVtcy5zb3J0IChhLGIpIC0+IGEubGluZSAtIGIubGluZVxuICAgICAgICAgICAgQGNvbHVtbnNbY29sXS5sb2FkSXRlbXMgaXRlbXMsIGl0ZW1cblxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBvbkRpckNhY2hlOiAoZGlyKSA9PlxuXG4gICAgICAgIGZvciBjb2x1bW4gaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIGNvbHVtbi5wYXRoKCkgPT0gZGlyXG4gICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtIHtmaWxlOmRpciwgdHlwZTonZGlyJ30sIGNvbHVtbi5pbmRleCwgYWN0aXZlOmNvbHVtbi5hY3RpdmVQYXRoKClcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgIGxvYWREaXJJdGVtOiAoaXRlbSwgY29sPTAsIG9wdD17fSkgLT5cblxuICAgICAgICByZXR1cm4gaWYgY29sID4gMCBhbmQgaXRlbS5uYW1lID09ICcvJ1xuXG4gICAgICAgIGRpciA9IGl0ZW0uZmlsZVxuXG4gICAgICAgIGlmIGRpckNhY2hlLmhhcyhkaXIpIGFuZCBub3Qgb3B0Lmlnbm9yZUNhY2hlXG4gICAgICAgICAgICBAbG9hZERpckl0ZW1zIGRpciwgaXRlbSwgZGlyQ2FjaGUuZ2V0KGRpciksIGNvbCwgb3B0XG4gICAgICAgICAgICBwb3N0LmVtaXQgJ2RpcicsIGRpclxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBvcHQuaWdub3JlSGlkZGVuID0gbm90IHdpbmRvdy5zdGF0ZS5nZXQgXCJicm93c2VyfHNob3dIaWRkZW58I3tkaXJ9XCJcblxuICAgICAgICAgICAgZGlybGlzdCBkaXIsIG9wdCwgKGVyciwgaXRlbXMpID0+XG5cbiAgICAgICAgICAgICAgICBpZiBlcnI/IHRoZW4gcmV0dXJuXG5cbiAgICAgICAgICAgICAgICBwb3N0LnRvTWFpbiAnZGlyTG9hZGVkJywgZGlyXG5cbiAgICAgICAgICAgICAgICBkaXJDYWNoZS5zZXQgZGlyLCBpdGVtc1xuICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbXMgZGlyLCBpdGVtLCBpdGVtcywgY29sLCBvcHRcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2RpcicsIGRpclxuXG4gICAgbG9hZERpckl0ZW1zOiAoZGlyLCBpdGVtLCBpdGVtcywgY29sLCBvcHQpID0+XG5cbiAgICAgICAgdXBkaXIgPSBzbGFzaC5yZXNvbHZlIHNsYXNoLmpvaW4gZGlyLCAnLi4nXG5cbiAgICAgICAgaWYgY29sID09IDAgb3IgY29sLTEgPCBAbnVtQ29scygpIGFuZCBAY29sdW1uc1tjb2wtMV0uYWN0aXZlUm93KCk/Lml0ZW0ubmFtZSA9PSAnLi4nXG4gICAgICAgICAgICBpZiBpdGVtc1swXS5uYW1lIG5vdCBpbiBbJy4uJywgJy8nXVxuICAgICAgICAgICAgICAgIGlmIG5vdCAodXBkaXIgPT0gZGlyID09IHNsYXNoLnJlc29sdmUgJy8nKVxuICAgICAgICAgICAgICAgICAgICBpdGVtcy51bnNoaWZ0XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnLi4nXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogIHVwZGlyXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBpdGVtcy51bnNoaWZ0XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnLydcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiBkaXJcblxuICAgICAgICB3aGlsZSBjb2wgPj0gQG51bUNvbHMoKVxuICAgICAgICAgICAgQGFkZENvbHVtbigpXG5cbiAgICAgICAgQGNvbHVtbnNbY29sXS5sb2FkSXRlbXMgaXRlbXMsIGl0ZW1cblxuICAgICAgICBpZiBvcHQuYWN0aXZlXG4gICAgICAgICAgICBAY29sdW1uc1tjb2xdLnJvdyhzbGFzaC5maWxlIG9wdC5hY3RpdmUpPy5zZXRBY3RpdmUoKVxuXG4gICAgICAgIEBnZXRHaXRTdGF0dXMgaXRlbSwgY29sXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBuYXZpZ2F0ZVRvRmlsZTogKGZpbGUpIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICMga2xvZyAnZmlsZWJyb3dzZXIubmF2aWdhdGVUb0ZpbGUnIGZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgbGFzdFBhdGggPSBAbGFzdFVzZWRDb2x1bW4oKT8ucGF0aCgpXG4gICAgICAgIGlmIGZpbGUgPT0gbGFzdFBhdGhcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIHNsYXNoLmlzUmVsYXRpdmUgZmlsZVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgZmlsZWxpc3QgPSBzbGFzaC5wYXRobGlzdCBmaWxlXG4gICAgICAgIGxhc3RsaXN0ID0gc2xhc2gucGF0aGxpc3QgbGFzdFBhdGhcblxuICAgICAgICBpZiB2YWxpZCBsYXN0bGlzdFxuXG4gICAgICAgICAgICBsYXN0ZGlyID0gbGFzdCBsYXN0bGlzdFxuICAgICAgICAgICAgaWYgQGxhc3RVc2VkQ29sdW1uKCk/LmlzRmlsZSgpXG4gICAgICAgICAgICAgICAgbGFzdGRpciA9IHNsYXNoLmRpciBsYXN0ZGlyXG4gICAgICAgICAgICByZWxhdGl2ZSA9IHNsYXNoLnJlbGF0aXZlIGZpbGUsIGxhc3RkaXJcblxuICAgICAgICAgICAgaWYgc2xhc2guaXNSZWxhdGl2ZSByZWxhdGl2ZVxuICAgICAgICAgICAgICAgIHVwQ291bnQgPSAwXG4gICAgICAgICAgICAgICAgd2hpbGUgcmVsYXRpdmUuc3RhcnRzV2l0aCAnLi4vJ1xuICAgICAgICAgICAgICAgICAgICB1cENvdW50ICs9IDFcbiAgICAgICAgICAgICAgICAgICAgcmVsYXRpdmUgPSByZWxhdGl2ZS5zdWJzdHIgM1xuXG4gICAgICAgICAgICAgICAgaWYgdXBDb3VudCA8IEBudW1Db2xzKCktMVxuICAgICAgICAgICAgICAgICAgICBjb2wgICA9IEBudW1Db2xzKCkgLSAxIC0gdXBDb3VudFxuICAgICAgICAgICAgICAgICAgICByZWxzdCA9IHNsYXNoLnBhdGhsaXN0IHJlbGF0aXZlXG4gICAgICAgICAgICAgICAgICAgIHBhdGhzID0gZmlsZWxpc3Quc2xpY2UgZmlsZWxpc3QubGVuZ3RoIC0gcmVsc3QubGVuZ3RoXG5cbiAgICAgICAgaWYgZW1wdHkgcGF0aHNcblxuICAgICAgICAgICAgcGtnRGlyICAgPSBzbGFzaC5wa2cgZmlsZVxuICAgICAgICAgICAgcGtnbGlzdCAgPSBzbGFzaC5wYXRobGlzdCBwa2dEaXJcblxuICAgICAgICAgICAgbGlzdGluZGV4ID0gcGtnbGlzdC5sZW5ndGggLSAxXG4gICAgICAgICAgICBjb2wwaW5kZXggPSBsaXN0aW5kZXhcbiAgICAgICAgICAgIGNvbCA9IDBcblxuICAgICAgICAgICAgaWYgZmlsZWxpc3RbY29sMGluZGV4XSA9PSBAY29sdW1uc1swXT8ucGF0aCgpXG4gICAgICAgICAgICAgICAgd2hpbGUgY29sMGluZGV4IDwgbGFzdGxpc3QubGVuZ3RoIGFuZCBjb2wwaW5kZXggPCBmaWxlbGlzdC5sZW5ndGggYW5kIGxhc3RsaXN0W2NvbDBpbmRleF0gPT0gZmlsZWxpc3RbY29sMGluZGV4XVxuICAgICAgICAgICAgICAgICAgICBjb2wwaW5kZXggKz0gMVxuICAgICAgICAgICAgICAgICAgICBjb2wgKz0gMVxuXG4gICAgICAgICAgICBwYXRocyA9IGZpbGVsaXN0LnNsaWNlIGNvbDBpbmRleFxuICAgICAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmlzRmlsZSBsYXN0IHBhdGhzXG4gICAgICAgICAgICBsYXN0VHlwZSA9ICdmaWxlJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBsYXN0VHlwZSA9ICdkaXInXG5cbiAgICAgICAgQHBvcENvbHVtbnNGcm9tICAgY29sK3BhdGhzLmxlbmd0aFxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2xcbiAgICAgICAgXG4gICAgICAgIHdoaWxlIEBudW1Db2xzKCkgPCBwYXRocy5sZW5ndGhcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuICAgICAgICBcbiAgICAgICAgaWYgY29sID4gMFxuICAgICAgICAgICAgQGNvbHVtbnNbY29sLTFdLnJvdyhzbGFzaC5maWxlIHBhdGhzWzBdKT8uc2V0QWN0aXZlKClcblxuICAgICAgICBmb3IgaW5kZXggaW4gWzAuLi5wYXRocy5sZW5ndGhdXG4gICAgICAgICAgICB0eXBlID0gaWYgaW5kZXggPT0gcGF0aHMubGVuZ3RoLTEgdGhlbiBsYXN0VHlwZSBlbHNlICdkaXInXG4gICAgICAgICAgICBmaWxlID0gcGF0aHNbaW5kZXhdXG4gICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBjb2wgPT0gMCA9PSBpbmRleCBhbmQgdHlwZSA9PSAnZmlsZSdcbiAgICAgICAgICAgICAgICB0eXBlID0gJ2RpcidcbiAgICAgICAgICAgICAgICBmaWxlID0gc2xhc2guZGlyIGZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGl0ZW0gPSBmaWxlOmZpbGUsIHR5cGU6dHlwZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzd2l0Y2ggdHlwZVxuICAgICAgICAgICAgICAgIHdoZW4gJ2ZpbGUnIHRoZW4gQGxvYWRGaWxlSXRlbSBpdGVtLCBjb2wraW5kZXhcbiAgICAgICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgICAgIG9wdCA9IHt9XG4gICAgICAgICAgICAgICAgICAgIGlmIGluZGV4IDwgcGF0aHMubGVuZ3RoLTFcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdC5hY3RpdmUgPSBwYXRoc1tpbmRleCsxXVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGNvbCA9PSAwID09IGluZGV4IGFuZCBwYXRocy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0LmFjdGl2ZSA9IHBhdGhzWzBdXG4gICAgICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbSBpdGVtLCBjb2wraW5kZXgsIG9wdFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICMgaWYgY29sID09IDAgPT0gaW5kZXggYW5kIHBhdGhzLmxlbmd0aCA9PSAxXG4gICAgICAgICAgICAgICAgIyBAY29sdW1uc1tjb2xdLnJvdyhzbGFzaC5maWxlIHBhdGhzWzBdKT8uc2V0QWN0aXZlKClcblxuICAgICAgICBsYXN0SXRlbSA9IGZpbGU6bGFzdChwYXRocyksIHR5cGU6bGFzdFR5cGVcbiAgICAgICAgXG4gICAgICAgIEBlbWl0ICdpdGVtQWN0aXZhdGVkJyBsYXN0SXRlbVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIG9uRmlsZTogKGZpbGUpID0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBmaWxlXG4gICAgICAgIHJldHVybiBpZiBub3QgQGZsZXhcblxuICAgICAgICBAbmF2aWdhdGVUb0ZpbGUgZmlsZVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgaW5pdENvbHVtbnM6IC0+XG5cbiAgICAgICAgc3VwZXIoKVxuXG4gICAgICAgIEB2aWV3Lmluc2VydEJlZm9yZSBAc2hlbGYuZGl2LCBAdmlldy5maXJzdENoaWxkXG4gICAgICAgIEB2aWV3Lmluc2VydEJlZm9yZSBAc2hlbGZSZXNpemUsIG51bGxcblxuICAgICAgICBAc2hlbGYuYnJvd3NlckRpZEluaXRDb2x1bW5zKClcblxuICAgICAgICBAc2V0U2hlbGZTaXplIEBzaGVsZlNpemVcblxuICAgIGNvbHVtbkF0UG9zOiAocG9zKSAtPlxuXG4gICAgICAgIGlmIGNvbHVtbiA9IHN1cGVyIHBvc1xuICAgICAgICAgICAgcmV0dXJuIGNvbHVtblxuXG4gICAgICAgIGlmIGVsZW0uY29udGFpbnNQb3MgQHNoZWxmLmRpdiwgcG9zXG4gICAgICAgICAgICByZXR1cm4gQHNoZWxmXG5cbiAgICBsYXN0Q29sdW1uUGF0aDogLT5cblxuICAgICAgICBpZiBsYXN0Q29sdW1uID0gQGxhc3RVc2VkQ29sdW1uKClcbiAgICAgICAgICAgIHJldHVybiBsYXN0Q29sdW1uLnBhdGgoKVxuXG4gICAgbGFzdERpckNvbHVtbjogLT5cblxuICAgICAgICBpZiBsYXN0Q29sdW1uID0gQGxhc3RVc2VkQ29sdW1uKClcbiAgICAgICAgICAgIGlmIGxhc3RDb2x1bW4uaXNEaXIoKVxuICAgICAgICAgICAgICAgIHJldHVybiBsYXN0Q29sdW1uXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW4ucHJldkNvbHVtbigpXG5cbiAgICBvbkJhY2tzcGFjZUluQ29sdW1uOiAoY29sdW1uKSAtPlxuXG4gICAgICAgIGNvbHVtbi5jbGVhclNlYXJjaCgpXG4gICAgICAgIEBuYXZpZ2F0ZSAnbGVmdCdcblxuICAgIHVwZGF0ZUNvbHVtblNjcm9sbHM6ID0+XG5cbiAgICAgICAgc3VwZXIoKVxuICAgICAgICBAc2hlbGYuc2Nyb2xsLnVwZGF0ZSgpXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMFxuXG4gICAgb25TaGVsZkRyYWc6IChkcmFnLCBldmVudCkgPT5cblxuICAgICAgICBzaGVsZlNpemUgPSBjbGFtcCAwLCA0MDAsIGRyYWcucG9zLnhcbiAgICAgICAgQHNldFNoZWxmU2l6ZSBzaGVsZlNpemVcblxuICAgIHNldFNoZWxmU2l6ZTogKEBzaGVsZlNpemUpIC0+XG5cbiAgICAgICAgd2luZG93LnN0YXRlLnNldCAnc2hlbGZ8c2l6ZScsIEBzaGVsZlNpemVcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmxlZnQgPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEBzaGVsZi5kaXYuc3R5bGUud2lkdGggPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEBjb2xzLnN0eWxlLmxlZnQgPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbiAgICBnZXRHaXRTdGF0dXM6IChpdGVtLCBjb2wpID0+XG5cbiAgICAgICAgZmlsZSA9IGl0ZW0uZmlsZSA/IGl0ZW0ucGFyZW50Py5maWxlXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBmaWxlXG5cbiAgICAgICAgaHViLnN0YXR1cyBmaWxlLCAoc3RhdHVzKSA9PiBAYXBwbHlHaXRTdGF0dXNGaWxlcyBjb2wsIGh1Yi5zdGF0dXNGaWxlcyBzdGF0dXNcblxuICAgIGFwcGx5R2l0U3RhdHVzRmlsZXM6IChjb2wsIGZpbGVzKSA9PlxuXG4gICAgICAgIEBjb2x1bW5zW2NvbF0/LnVwZGF0ZUdpdEZpbGVzIGZpbGVzXG5cbiAgICBvbkdpdFN0YXR1czogKGdpdERpciwgc3RhdHVzKSA9PlxuXG4gICAgICAgIGZpbGVzID0gaHViLnN0YXR1c0ZpbGVzIHN0YXR1c1xuICAgICAgICBmb3IgY29sIGluIFswLi5AY29sdW1ucy5sZW5ndGhdXG4gICAgICAgICAgICBAYXBwbHlHaXRTdGF0dXNGaWxlcyBjb2wsIGZpbGVzXG5cbiAgICAgICAgQHNoZWxmLnVwZGF0ZUdpdEZpbGVzIGZpbGVzXG5cbiAgICByZWZyZXNoOiA9PlxuXG4gICAgICAgIGh1Yi5yZWZyZXNoKClcblxuICAgICAgICBkaXJDYWNoZS5yZXNldCgpXG4gICAgICAgIEBzcmNDYWNoZSA9IHt9XG5cbiAgICAgICAgaWYgQGxhc3RVc2VkQ29sdW1uKClcbiAgICAgICAgICAgIEBuYXZpZ2F0ZVRvRmlsZSBAbGFzdFVzZWRDb2x1bW4oKT8ucGF0aCgpXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgb25GaWxlSW5kZXhlZDogKGZpbGUsIGluZm8pID0+XG5cbiAgICAgICAgQHNyY0NhY2hlW2ZpbGVdID0gaW5mb1xuXG4gICAgICAgIGlmIGZpbGUgPT0gQGxhc3RVc2VkQ29sdW1uKCk/LnBhcmVudD8uZmlsZVxuICAgICAgICAgICAgQGxvYWRTb3VyY2VJdGVtIHsgZmlsZTpmaWxlLCB0eXBlOidmaWxlJyB9LCBAbGFzdFVzZWRDb2x1bW4oKT8uaW5kZXhcblxubW9kdWxlLmV4cG9ydHMgPSBGaWxlQnJvd3NlclxuIl19
//# sourceURL=../../coffee/browser/filebrowser.coffee