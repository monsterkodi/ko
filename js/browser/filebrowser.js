// koffee 0.56.0

/*
00000000  000  000      00000000        0000000    00000000    0000000   000   000   0000000  00000000  00000000
000       000  000      000             000   000  000   000  000   000  000 0 000  000       000       000   000
000000    000  000      0000000         0000000    0000000    000   000  000000000  0000000   0000000   0000000
000       000  000      000             000   000  000   000  000   000  000   000       000  000       000   000
000       000  0000000  00000000        0000000    000   000   0000000   00     00  0000000   00000000  000   000
 */
var $, Browser, FileBrowser, Shelf, _, clamp, dirCache, dirlist, drag, elem, empty, fs, hub, last, os, post, ref, slash, state, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), post = ref.post, valid = ref.valid, empty = ref.empty, last = ref.last, elem = ref.elem, clamp = ref.clamp, drag = ref.drag, clamp = ref.clamp, state = ref.state, slash = ref.slash, fs = ref.fs, os = ref.os, $ = ref.$, _ = ref._;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWJyb3dzZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGlJQUFBO0lBQUE7Ozs7QUFRQSxNQUFxRixPQUFBLENBQVEsS0FBUixDQUFyRixFQUFFLGVBQUYsRUFBUSxpQkFBUixFQUFlLGlCQUFmLEVBQXNCLGVBQXRCLEVBQTRCLGVBQTVCLEVBQWtDLGlCQUFsQyxFQUF5QyxlQUF6QyxFQUErQyxpQkFBL0MsRUFBc0QsaUJBQXRELEVBQTZELGlCQUE3RCxFQUFvRSxXQUFwRSxFQUF3RSxXQUF4RSxFQUE0RSxTQUE1RSxFQUErRTs7QUFFL0UsT0FBQSxHQUFXLE9BQUEsQ0FBUSxXQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsU0FBUjs7QUFDWCxPQUFBLEdBQVcsT0FBQSxDQUFRLGtCQUFSOztBQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsbUJBQVI7O0FBQ1gsR0FBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztBQUVMOzs7SUFFVyxxQkFBQyxJQUFEOzs7Ozs7Ozs7Ozs7UUFFVCw2Q0FBTSxJQUFOO1FBRUEsTUFBTSxDQUFDLFdBQVAsR0FBcUI7UUFFckIsSUFBQyxDQUFBLE1BQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxLQUFELEdBQVUsSUFBSSxLQUFKLENBQVUsSUFBVjtRQUNWLElBQUMsQ0FBQSxJQUFELEdBQVU7UUFFVixJQUFDLENBQUEsUUFBRCxHQUFZO1FBRVosSUFBSSxDQUFDLEVBQUwsQ0FBUSxXQUFSLEVBQXVCLElBQUMsQ0FBQSxXQUF4QjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsYUFBUixFQUF1QixJQUFDLENBQUEsYUFBeEI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLE1BQVIsRUFBdUIsSUFBQyxDQUFBLE1BQXhCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxhQUFSLEVBQXVCLElBQUMsQ0FBQSxhQUF4QjtRQUNBLElBQUksQ0FB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IDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBwb3N0LCB2YWxpZCwgZW1wdHksIGxhc3QsIGVsZW0sIGNsYW1wLCBkcmFnLCBjbGFtcCwgc3RhdGUsIHNsYXNoLCBmcywgb3MsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuQnJvd3NlciAgPSByZXF1aXJlICcuL2Jyb3dzZXInXG5TaGVsZiAgICA9IHJlcXVpcmUgJy4vc2hlbGYnXG5kaXJsaXN0ICA9IHJlcXVpcmUgJy4uL3Rvb2xzL2Rpcmxpc3QnXG5kaXJDYWNoZSA9IHJlcXVpcmUgJy4uL3Rvb2xzL2RpcmNhY2hlJ1xuaHViICAgICAgPSByZXF1aXJlICcuLi9naXQvaHViJ1xuXG5jbGFzcyBGaWxlQnJvd3NlciBleHRlbmRzIEJyb3dzZXJcblxuICAgIGNvbnN0cnVjdG9yOiAodmlldykgLT5cblxuICAgICAgICBzdXBlciB2aWV3XG5cbiAgICAgICAgd2luZG93LmZpbGVicm93c2VyID0gQFxuXG4gICAgICAgIEBsb2FkSUQgPSAwXG4gICAgICAgIEBzaGVsZiAgPSBuZXcgU2hlbGYgQFxuICAgICAgICBAbmFtZSAgID0gJ0ZpbGVCcm93c2VyJ1xuXG4gICAgICAgIEBzcmNDYWNoZSA9IHt9XG5cbiAgICAgICAgcG9zdC5vbiAnZ2l0U3RhdHVzJywgICBAb25HaXRTdGF0dXNcbiAgICAgICAgcG9zdC5vbiAnZmlsZUluZGV4ZWQnLCBAb25GaWxlSW5kZXhlZFxuICAgICAgICBwb3N0Lm9uICdmaWxlJywgICAgICAgIEBvbkZpbGVcbiAgICAgICAgcG9zdC5vbiAnZmlsZWJyb3dzZXInLCBAb25GaWxlQnJvd3NlclxuICAgICAgICBwb3N0Lm9uICdkaXJjYWNoZScsICAgIEBvbkRpckNhY2hlXG5cbiAgICAgICAgQHNoZWxmUmVzaXplID0gZWxlbSAnZGl2JywgY2xhc3M6ICdzaGVsZlJlc2l6ZSdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUudG9wICAgICAgPSAnMHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUuYm90dG9tICAgPSAnMHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUubGVmdCAgICAgPSAnMTk0cHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS53aWR0aCAgICA9ICc2cHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5jdXJzb3IgICA9ICdldy1yZXNpemUnXG5cbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQHNoZWxmUmVzaXplXG4gICAgICAgICAgICBvbk1vdmU6ICBAb25TaGVsZkRyYWdcblxuICAgICAgICBAc2hlbGZTaXplID0gd2luZG93LnN0YXRlLmdldCAnc2hlbGY6c2l6ZScsIDIwMFxuXG4gICAgICAgIEBpbml0Q29sdW1ucygpXG5cbiAgICBvbkZpbGVCcm93c2VyOiAoYWN0aW9uLCBpdGVtLCBhcmcpID0+XG5cbiAgICAgICAgc3dpdGNoIGFjdGlvblxuICAgICAgICAgICAgd2hlbiAnbG9hZEl0ZW0nICAgICB0aGVuIEBsb2FkSXRlbSAgICAgaXRlbSwgYXJnXG4gICAgICAgICAgICB3aGVuICdhY3RpdmF0ZUl0ZW0nIHRoZW4gQGFjdGl2YXRlSXRlbSBpdGVtLCBhcmdcblxuICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsb2FkSXRlbTogKGl0ZW0sIG9wdCkgLT5cblxuICAgICAgICBvcHQgPz0ge31cbiAgICAgICAgaXRlbS5uYW1lID89IHNsYXNoLmZpbGUgaXRlbS5maWxlXG5cbiAgICAgICAgQHBvcENvbHVtbnNGcm9tIDFcblxuICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICB3aGVuICdmaWxlJyB0aGVuIEBsb2FkRmlsZUl0ZW0gaXRlbVxuICAgICAgICAgICAgd2hlbiAnZGlyJyAgdGhlbiBAbG9hZERpckl0ZW0gIGl0ZW0sIDAsIGFjdGl2ZTonLi4nXG5cbiAgICAgICAgaWYgb3B0LmZvY3VzXG4gICAgICAgICAgICBAY29sdW1uc1swXS5mb2N1cygpXG5cbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgYWN0aXZhdGVJdGVtOiAoaXRlbSwgY29sKSAtPlxuXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbCsyLCBwb3A6dHJ1ZVxuXG4gICAgICAgIHN3aXRjaCBpdGVtLnR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2RpcidcbiAgICAgICAgICAgICAgICBAbG9hZERpckl0ZW0gIGl0ZW0sIGNvbCsxXG4gICAgICAgICAgICB3aGVuICdmaWxlJ1xuICAgICAgICAgICAgICAgIEBsb2FkRmlsZUl0ZW0gaXRlbSwgY29sKzFcbiAgICAgICAgICAgICAgICBpZiBpdGVtLnRleHRGaWxlXG4gICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvRmlsZScsIGl0ZW1cblxuICAgICMgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGxvYWRGaWxlSXRlbTogKGl0ZW0sIGNvbD0wKSAtPlxuXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbCwgcG9wOnRydWVcblxuICAgICAgICB3aGlsZSBjb2wgPj0gQG51bUNvbHMoKVxuICAgICAgICAgICAgQGFkZENvbHVtbigpXG5cbiAgICAgICAgZmlsZSA9IGl0ZW0uZmlsZVxuXG4gICAgICAgIHN3aXRjaCBzbGFzaC5leHQgZmlsZVxuICAgICAgICAgICAgd2hlbiAnZ2lmJywgJ3BuZycsICdqcGcnLCAnanBlZycsICdzdmcnLCAnYm1wJywgJ2ljbydcbiAgICAgICAgICAgICAgICBjbnQgPSBlbGVtIGNsYXNzOiAnYnJvd3NlckltYWdlQ29udGFpbmVyJywgY2hpbGQ6XG4gICAgICAgICAgICAgICAgICAgIGVsZW0gJ2ltZycsIGNsYXNzOiAnYnJvd3NlckltYWdlJywgc3JjOiBzbGFzaC5maWxlVXJsIGZpbGVcbiAgICAgICAgICAgICAgICBAY29sdW1uc1tjb2xdLnRhYmxlLmFwcGVuZENoaWxkIGNudFxuICAgICAgICAgICAgd2hlbiAndGlmZicsICd0aWYnXG4gICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgICAgIEBjb252ZXJ0SW1hZ2Ugcm93XG4gICAgICAgICAgICB3aGVuICdweG0nXG4gICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgICAgIEBjb252ZXJ0UFhNIHJvd1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBsb2FkU291cmNlSXRlbSBpdGVtLCBjb2xcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsb2FkU291cmNlSXRlbTogKGl0ZW0sIGNvbCkgLT5cblxuICAgICAgICBpZiBub3QgQHNyY0NhY2hlW2l0ZW0uZmlsZV0/XG5cbiAgICAgICAgICAgIEBzcmNDYWNoZVtpdGVtLmZpbGVdID0gcG9zdC5nZXQgJ2luZGV4ZXInLCAnZmlsZScsIGl0ZW0uZmlsZVxuXG4gICAgICAgIGluZm8gPSBAc3JjQ2FjaGVbaXRlbS5maWxlXVxuXG4gICAgICAgIGlmIGVtcHR5IGluZm9cbiAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0ubG9hZEl0ZW1zIFtdLCBpdGVtXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpdGVtcyA9IFtdXG4gICAgICAgIGNsc3NzID0gaW5mby5jbGFzc2VzID8gW11cbiAgICAgICAgZm9yIGNsc3MgaW4gY2xzc3NcbiAgICAgICAgICAgIHRleHQgPSAn4pePICcrY2xzcy5uYW1lXG4gICAgICAgICAgICBpdGVtcy5wdXNoIG5hbWU6Y2xzcy5uYW1lLCB0ZXh0OnRleHQsIHR5cGU6J2NsYXNzJywgZmlsZTppdGVtLmZpbGUsIGxpbmU6Y2xzcy5saW5lXG5cbiAgICAgICAgZnVuY3MgPSBpbmZvLmZ1bmNzID8gW11cbiAgICAgICAgZm9yIGZ1bmMgaW4gZnVuY3NcbiAgICAgICAgICAgIGlmIGZ1bmMudGVzdCA9PSAnZGVzY3JpYmUnXG4gICAgICAgICAgICAgICAgdGV4dCA9ICfil48gJytmdW5jLm5hbWVcbiAgICAgICAgICAgIGVsc2UgaWYgZnVuYy5zdGF0aWNcbiAgICAgICAgICAgICAgICB0ZXh0ID0gJyAg4peGICcrZnVuYy5uYW1lXG4gICAgICAgICAgICBlbHNlIGlmIGZ1bmMucG9zdFxuICAgICAgICAgICAgICAgIHRleHQgPSAnICDirKIgJytmdW5jLm5hbWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0ZXh0ID0gJyAg4pa4ICcrZnVuYy5uYW1lXG4gICAgICAgICAgICBpdGVtcy5wdXNoIG5hbWU6ZnVuYy5uYW1lLCB0ZXh0OnRleHQsIHR5cGU6J2Z1bmMnLCBmaWxlOml0ZW0uZmlsZSwgbGluZTpmdW5jLmxpbmVcblxuICAgICAgICBpZiB2YWxpZCBpdGVtc1xuICAgICAgICAgICAgaXRlbXMuc29ydCAoYSxiKSAtPiBhLmxpbmUgLSBiLmxpbmVcbiAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0ubG9hZEl0ZW1zIGl0ZW1zLCBpdGVtXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgb25EaXJDYWNoZTogKGRpcikgPT5cblxuICAgICAgICBmb3IgY29sdW1uIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBjb2x1bW4ucGF0aCgpID09IGRpclxuICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbSB7ZmlsZTpkaXIsIHR5cGU6J2Rpcid9LCBjb2x1bW4uaW5kZXgsIGFjdGl2ZTpjb2x1bW4uYWN0aXZlUGF0aCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICBsb2FkRGlySXRlbTogKGl0ZW0sIGNvbD0wLCBvcHQ9e30pIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIGNvbCA+IDAgYW5kIGl0ZW0ubmFtZSA9PSAnLydcblxuICAgICAgICBkaXIgPSBpdGVtLmZpbGVcblxuICAgICAgICBpZiBkaXJDYWNoZS5oYXMoZGlyKSBhbmQgbm90IG9wdC5pZ25vcmVDYWNoZVxuICAgICAgICAgICAgQGxvYWREaXJJdGVtcyBkaXIsIGl0ZW0sIGRpckNhY2hlLmdldChkaXIpLCBjb2wsIG9wdFxuICAgICAgICAgICAgcG9zdC5lbWl0ICdkaXInLCBkaXJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgb3B0Lmlnbm9yZUhpZGRlbiA9IG5vdCB3aW5kb3cuc3RhdGUuZ2V0IFwiYnJvd3NlcnxzaG93SGlkZGVufCN7ZGlyfVwiXG5cbiAgICAgICAgICAgIGRpcmxpc3QgZGlyLCBvcHQsIChlcnIsIGl0ZW1zKSA9PlxuXG4gICAgICAgICAgICAgICAgaWYgZXJyPyB0aGVuIHJldHVyblxuXG4gICAgICAgICAgICAgICAgcG9zdC50b01haW4gJ2RpckxvYWRlZCcsIGRpclxuXG4gICAgICAgICAgICAgICAgZGlyQ2FjaGUuc2V0IGRpciwgaXRlbXNcbiAgICAgICAgICAgICAgICBAbG9hZERpckl0ZW1zIGRpciwgaXRlbSwgaXRlbXMsIGNvbCwgb3B0XG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdkaXInLCBkaXJcblxuICAgIGxvYWREaXJJdGVtczogKGRpciwgaXRlbSwgaXRlbXMsIGNvbCwgb3B0KSA9PlxuXG4gICAgICAgIHVwZGlyID0gc2xhc2gucmVzb2x2ZSBzbGFzaC5qb2luIGRpciwgJy4uJ1xuXG4gICAgICAgIGlmIGNvbCA9PSAwIG9yIGNvbC0xIDwgQG51bUNvbHMoKSBhbmQgQGNvbHVtbnNbY29sLTFdLmFjdGl2ZVJvdygpPy5pdGVtLm5hbWUgPT0gJy4uJ1xuICAgICAgICAgICAgaWYgaXRlbXNbMF0ubmFtZSBub3QgaW4gWycuLicsICcvJ11cbiAgICAgICAgICAgICAgICBpZiBub3QgKHVwZGlyID09IGRpciA9PSBzbGFzaC5yZXNvbHZlICcvJylcbiAgICAgICAgICAgICAgICAgICAgaXRlbXMudW5zaGlmdFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJy4uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6ICB1cGRpclxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaXRlbXMudW5zaGlmdFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJy8nXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogZGlyXG5cbiAgICAgICAgd2hpbGUgY29sID49IEBudW1Db2xzKClcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuXG4gICAgICAgIEBjb2x1bW5zW2NvbF0ubG9hZEl0ZW1zIGl0ZW1zLCBpdGVtXG5cbiAgICAgICAgaWYgb3B0LmFjdGl2ZVxuICAgICAgICAgICAgQGNvbHVtbnNbY29sXS5yb3coc2xhc2guZmlsZSBvcHQuYWN0aXZlKT8uc2V0QWN0aXZlKClcblxuICAgICAgICBAZ2V0R2l0U3RhdHVzIGl0ZW0sIGNvbFxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgbmF2aWdhdGVUb0ZpbGU6IChmaWxlKSAtPlxuXG4gICAgICAgIGxhc3RQYXRoID0gQGxhc3RVc2VkQ29sdW1uKCk/LnBhdGgoKVxuICAgICAgICBpZiBmaWxlID09IGxhc3RQYXRoXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpZiBzbGFzaC5pc1JlbGF0aXZlIGZpbGVcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGZpbGVsaXN0ID0gc2xhc2gucGF0aGxpc3QgZmlsZVxuICAgICAgICBsYXN0bGlzdCA9IHNsYXNoLnBhdGhsaXN0IGxhc3RQYXRoXG5cbiAgICAgICAgaWYgdmFsaWQgbGFzdGxpc3RcblxuICAgICAgICAgICAgbGFzdGRpciA9IGxhc3QgbGFzdGxpc3RcbiAgICAgICAgICAgIGlmIEBsYXN0VXNlZENvbHVtbigpPy5pc0ZpbGUoKVxuICAgICAgICAgICAgICAgIGxhc3RkaXIgPSBzbGFzaC5kaXIgbGFzdGRpclxuICAgICAgICAgICAgcmVsYXRpdmUgPSBzbGFzaC5yZWxhdGl2ZSBmaWxlLCBsYXN0ZGlyXG5cbiAgICAgICAgICAgIGlmIHNsYXNoLmlzUmVsYXRpdmUgcmVsYXRpdmVcbiAgICAgICAgICAgICAgICB1cENvdW50ID0gMFxuICAgICAgICAgICAgICAgIHdoaWxlIHJlbGF0aXZlLnN0YXJ0c1dpdGggJy4uLydcbiAgICAgICAgICAgICAgICAgICAgdXBDb3VudCArPSAxXG4gICAgICAgICAgICAgICAgICAgIHJlbGF0aXZlID0gcmVsYXRpdmUuc3Vic3RyIDNcblxuICAgICAgICAgICAgICAgIGlmIHVwQ291bnQgPCBAbnVtQ29scygpLTFcbiAgICAgICAgICAgICAgICAgICAgY29sICAgPSBAbnVtQ29scygpIC0gMSAtIHVwQ291bnRcbiAgICAgICAgICAgICAgICAgICAgcmVsc3QgPSBzbGFzaC5wYXRobGlzdCByZWxhdGl2ZVxuICAgICAgICAgICAgICAgICAgICBwYXRocyA9IGZpbGVsaXN0LnNsaWNlIGZpbGVsaXN0Lmxlbmd0aCAtIHJlbHN0Lmxlbmd0aFxuXG4gICAgICAgIGlmIGVtcHR5IHBhdGhzXG5cbiAgICAgICAgICAgIHBrZ0RpciAgID0gc2xhc2gucGtnIGZpbGVcbiAgICAgICAgICAgIHBrZ2xpc3QgID0gc2xhc2gucGF0aGxpc3QgcGtnRGlyXG5cbiAgICAgICAgICAgIGxpc3RpbmRleCA9IHBrZ2xpc3QubGVuZ3RoIC0gMVxuICAgICAgICAgICAgY29sMGluZGV4ID0gbGlzdGluZGV4XG4gICAgICAgICAgICBjb2wgPSAwXG5cbiAgICAgICAgICAgIGlmIGZpbGVsaXN0W2NvbDBpbmRleF0gPT0gQGNvbHVtbnNbMF0/LnBhdGgoKVxuICAgICAgICAgICAgICAgIHdoaWxlIGNvbDBpbmRleCA8IGxhc3RsaXN0Lmxlbmd0aCBhbmQgY29sMGluZGV4IDwgZmlsZWxpc3QubGVuZ3RoIGFuZCBsYXN0bGlzdFtjb2wwaW5kZXhdID09IGZpbGVsaXN0W2NvbDBpbmRleF1cbiAgICAgICAgICAgICAgICAgICAgY29sMGluZGV4ICs9IDFcbiAgICAgICAgICAgICAgICAgICAgY29sICs9IDFcblxuICAgICAgICAgICAgcGF0aHMgPSBmaWxlbGlzdC5zbGljZSBjb2wwaW5kZXhcblxuICAgICAgICBpZiBzbGFzaC5pc0ZpbGUgbGFzdCBwYXRoc1xuICAgICAgICAgICAgbGFzdFR5cGUgPSAnZmlsZSdcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbGFzdFR5cGUgPSAnZGlyJ1xuXG4gICAgICAgIEBwb3BDb2x1bW5zRnJvbSAgIGNvbCtwYXRocy5sZW5ndGhcbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sXG5cbiAgICAgICAgd2hpbGUgQG51bUNvbHMoKSA8IHBhdGhzLmxlbmd0aFxuICAgICAgICAgICAgQGFkZENvbHVtbigpXG5cbiAgICAgICAgaWYgY29sID4gMFxuICAgICAgICAgICAgQGNvbHVtbnNbY29sLTFdLnJvdyhzbGFzaC5maWxlIHBhdGhzWzBdKT8uc2V0QWN0aXZlKClcblxuICAgICAgICBmb3IgaW5kZXggaW4gWzAuLi5wYXRocy5sZW5ndGhdXG4gICAgICAgICAgICB0eXBlID0gaWYgaW5kZXggPT0gcGF0aHMubGVuZ3RoLTEgdGhlbiBsYXN0VHlwZSBlbHNlICdkaXInXG4gICAgICAgICAgICBmaWxlID0gcGF0aHNbaW5kZXhdXG4gICAgICAgICAgICBpdGVtID0gZmlsZTpmaWxlLCB0eXBlOnR5cGVcbiAgICAgICAgICAgIHN3aXRjaCB0eXBlXG4gICAgICAgICAgICAgICAgd2hlbiAnZmlsZScgdGhlbiBAbG9hZEZpbGVJdGVtIGl0ZW0sIGNvbCtpbmRleFxuICAgICAgICAgICAgICAgIHdoZW4gJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgb3B0ID0ge31cbiAgICAgICAgICAgICAgICAgICAgaWYgaW5kZXggPCBwYXRocy5sZW5ndGgtMVxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0LmFjdGl2ZSA9IHBhdGhzW2luZGV4KzFdXG4gICAgICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbSBpdGVtLCBjb2wraW5kZXgsIG9wdFxuXG4gICAgICAgIGxhc3RJdGVtID0gZmlsZTpsYXN0KHBhdGhzKSwgdHlwZTpsYXN0VHlwZVxuICAgICAgICBAZW1pdCAnaXRlbUFjdGl2YXRlZCcsIGxhc3RJdGVtXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG4gICAgb25GaWxlOiAoZmlsZSkgPT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IGZpbGVcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmxleFxuXG4gICAgICAgIEBuYXZpZ2F0ZVRvRmlsZSBmaWxlXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBpbml0Q29sdW1uczogLT5cblxuICAgICAgICBzdXBlcigpXG5cbiAgICAgICAgQHZpZXcuaW5zZXJ0QmVmb3JlIEBzaGVsZi5kaXYsIEB2aWV3LmZpcnN0Q2hpbGRcbiAgICAgICAgQHZpZXcuaW5zZXJ0QmVmb3JlIEBzaGVsZlJlc2l6ZSwgbnVsbFxuXG4gICAgICAgIEBzaGVsZi5icm93c2VyRGlkSW5pdENvbHVtbnMoKVxuXG4gICAgICAgIEBzZXRTaGVsZlNpemUgQHNoZWxmU2l6ZVxuXG4gICAgY29sdW1uQXRQb3M6IChwb3MpIC0+XG5cbiAgICAgICAgaWYgY29sdW1uID0gc3VwZXIgcG9zXG4gICAgICAgICAgICByZXR1cm4gY29sdW1uXG5cbiAgICAgICAgaWYgZWxlbS5jb250YWluc1BvcyBAc2hlbGYuZGl2LCBwb3NcbiAgICAgICAgICAgIHJldHVybiBAc2hlbGZcblxuICAgIGxhc3RDb2x1bW5QYXRoOiAtPlxuXG4gICAgICAgIGlmIGxhc3RDb2x1bW4gPSBAbGFzdFVzZWRDb2x1bW4oKVxuICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW4ucGF0aCgpXG5cbiAgICBsYXN0RGlyQ29sdW1uOiAtPlxuXG4gICAgICAgIGlmIGxhc3RDb2x1bW4gPSBAbGFzdFVzZWRDb2x1bW4oKVxuICAgICAgICAgICAgaWYgbGFzdENvbHVtbi5pc0RpcigpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW5cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtbi5wcmV2Q29sdW1uKClcblxuICAgIG9uQmFja3NwYWNlSW5Db2x1bW46IChjb2x1bW4pIC0+XG5cbiAgICAgICAgY29sdW1uLmNsZWFyU2VhcmNoKClcbiAgICAgICAgQG5hdmlnYXRlICdsZWZ0J1xuXG4gICAgdXBkYXRlQ29sdW1uU2Nyb2xsczogPT5cblxuICAgICAgICBzdXBlcigpXG4gICAgICAgIEBzaGVsZi5zY3JvbGwudXBkYXRlKClcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwXG5cbiAgICBvblNoZWxmRHJhZzogKGRyYWcsIGV2ZW50KSA9PlxuXG4gICAgICAgIHNoZWxmU2l6ZSA9IGNsYW1wIDAsIDQwMCwgZHJhZy5wb3MueFxuICAgICAgICBAc2V0U2hlbGZTaXplIHNoZWxmU2l6ZVxuXG4gICAgc2V0U2hlbGZTaXplOiAoQHNoZWxmU2l6ZSkgLT5cblxuICAgICAgICB3aW5kb3cuc3RhdGUuc2V0ICdzaGVsZnxzaXplJywgQHNoZWxmU2l6ZVxuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUubGVmdCA9IFwiI3tAc2hlbGZTaXplfXB4XCJcbiAgICAgICAgQHNoZWxmLmRpdi5zdHlsZS53aWR0aCA9IFwiI3tAc2hlbGZTaXplfXB4XCJcbiAgICAgICAgQGNvbHMuc3R5bGUubGVmdCA9IFwiI3tAc2hlbGZTaXplfXB4XCJcblxuICAgICMgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDBcblxuICAgIGdldEdpdFN0YXR1czogKGl0ZW0sIGNvbCkgPT5cblxuICAgICAgICBmaWxlID0gaXRlbS5maWxlID8gaXRlbS5wYXJlbnQ/LmZpbGVcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGZpbGVcblxuICAgICAgICBodWIuc3RhdHVzIGZpbGUsIChzdGF0dXMpID0+IEBhcHBseUdpdFN0YXR1c0ZpbGVzIGNvbCwgaHViLnN0YXR1c0ZpbGVzIHN0YXR1c1xuXG4gICAgYXBwbHlHaXRTdGF0dXNGaWxlczogKGNvbCwgZmlsZXMpID0+XG5cbiAgICAgICAgQGNvbHVtbnNbY29sXT8udXBkYXRlR2l0RmlsZXMgZmlsZXNcblxuICAgIG9uR2l0U3RhdHVzOiAoZ2l0RGlyLCBzdGF0dXMpID0+XG5cbiAgICAgICAgZmlsZXMgPSBodWIuc3RhdHVzRmlsZXMgc3RhdHVzXG4gICAgICAgIGZvciBjb2wgaW4gWzAuLkBjb2x1bW5zLmxlbmd0aF1cbiAgICAgICAgICAgIEBhcHBseUdpdFN0YXR1c0ZpbGVzIGNvbCwgZmlsZXNcblxuICAgICAgICBAc2hlbGYudXBkYXRlR2l0RmlsZXMgZmlsZXNcblxuICAgIHJlZnJlc2g6ID0+XG5cbiAgICAgICAgaHViLnJlZnJlc2goKVxuXG4gICAgICAgIGRpckNhY2hlLnJlc2V0KClcbiAgICAgICAgQHNyY0NhY2hlID0ge31cblxuICAgICAgICBpZiBAbGFzdFVzZWRDb2x1bW4oKVxuICAgICAgICAgICAgQG5hdmlnYXRlVG9GaWxlIEBsYXN0VXNlZENvbHVtbigpPy5wYXRoKClcblxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBvbkZpbGVJbmRleGVkOiAoZmlsZSwgaW5mbykgPT5cblxuICAgICAgICBAc3JjQ2FjaGVbZmlsZV0gPSBpbmZvXG5cbiAgICAgICAgaWYgZmlsZSA9PSBAbGFzdFVzZWRDb2x1bW4oKT8ucGFyZW50Py5maWxlXG4gICAgICAgICAgICBAbG9hZFNvdXJjZUl0ZW0geyBmaWxlOmZpbGUsIHR5cGU6J2ZpbGUnIH0sIEBsYXN0VXNlZENvbHVtbigpPy5pbmRleFxuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVCcm93c2VyXG4iXX0=
//# sourceURL=../../coffee/browser/filebrowser.coffee