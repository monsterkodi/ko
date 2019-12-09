// koffee 1.6.0

/*
00000000  000  000      00000000        0000000    00000000    0000000   000   000   0000000  00000000  00000000
000       000  000      000             000   000  000   000  000   000  000 0 000  000       000       000   000
000000    000  000      0000000         0000000    0000000    000   000  000000000  0000000   0000000   0000000
000       000  000      000             000   000  000   000  000   000  000   000       000  000       000   000
000       000  0000000  00000000        0000000    000   000   0000000   00     00  0000000   00000000  000   000
 */
var Browser, FileBrowser, Shelf, clamp, dirCache, drag, elem, empty, filelist, hub, last, post, ref, slash, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), post = ref.post, filelist = ref.filelist, slash = ref.slash, empty = ref.empty, valid = ref.valid, clamp = ref.clamp, elem = ref.elem, drag = ref.drag, last = ref.last;

Browser = require('./browser');

Shelf = require('./shelf');

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
                this.loadDirItem(item, 0, opt);
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
        var col, col0index, i, index, item, lastItem, lastPath, lastType, lastdir, lastlist, listindex, opt, paths, pkgDir, pkglist, ref1, ref2, ref3, ref4, ref5, relative, relst, type, upCount;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWJyb3dzZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDZHQUFBO0lBQUE7Ozs7QUFRQSxNQUFtRSxPQUFBLENBQVEsS0FBUixDQUFuRSxFQUFFLGVBQUYsRUFBUSx1QkFBUixFQUFrQixpQkFBbEIsRUFBeUIsaUJBQXpCLEVBQWdDLGlCQUFoQyxFQUF1QyxpQkFBdkMsRUFBOEMsZUFBOUMsRUFBb0QsZUFBcEQsRUFBMEQ7O0FBRTFELE9BQUEsR0FBVyxPQUFBLENBQVEsV0FBUjs7QUFDWCxLQUFBLEdBQVcsT0FBQSxDQUFRLFNBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxtQkFBUjs7QUFDWCxHQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBRUw7OztJQUVDLHFCQUFDLElBQUQ7Ozs7Ozs7Ozs7OztRQUVDLDZDQUFNLElBQU47UUFFQSxNQUFNLENBQUMsV0FBUCxHQUFxQjtRQUVyQixJQUFDLENBQUEsTUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLEtBQUQsR0FBVSxJQUFJLEtBQUosQ0FBVSxJQUFWO1FBQ1YsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUVWLElBQUMsQ0FBQSxRQUFELEdBQVk7UUFFWixJQUFJLENBQUMsRUFBTCxDQUFRLFdBQVIsRUFBc0IsSUFBQyxDQUFBLFdBQXZCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxhQUFSLEVBQXNCLElBQUMsQ0FBQSxhQUF2QjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsTUFBUixFQUFzQixJQUFDLENBQUEsTUFBdkI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLGFBQVIsRUFBc0IsSUFBQyxDQUFBLGFBQXZCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxVQUFSLEVBQXNCLElBQUMsQ0FBQSxVQUF2QjtRQUVBLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBQSxDQUFLLEtBQUwsRUFBWTtZQUFBLENB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QUFLLElBQVA7Z0JBQWEsSUFBQSxFQUFLLE1BQWxCO2FBQWhCLCtDQUE2RCxDQUFFLGNBQS9ELEVBREo7O0lBSlc7Ozs7R0ExYU87O0FBaWIxQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBwb3N0LCBmaWxlbGlzdCwgc2xhc2gsIGVtcHR5LCB2YWxpZCwgY2xhbXAsIGVsZW0sIGRyYWcsIGxhc3QgfSA9IHJlcXVpcmUgJ2t4aydcblxuQnJvd3NlciAgPSByZXF1aXJlICcuL2Jyb3dzZXInXG5TaGVsZiAgICA9IHJlcXVpcmUgJy4vc2hlbGYnXG5kaXJDYWNoZSA9IHJlcXVpcmUgJy4uL3Rvb2xzL2RpcmNhY2hlJ1xuaHViICAgICAgPSByZXF1aXJlICcuLi9naXQvaHViJ1xuXG5jbGFzcyBGaWxlQnJvd3NlciBleHRlbmRzIEJyb3dzZXJcblxuICAgIEA6ICh2aWV3KSAtPlxuXG4gICAgICAgIHN1cGVyIHZpZXdcblxuICAgICAgICB3aW5kb3cuZmlsZWJyb3dzZXIgPSBAXG5cbiAgICAgICAgQGxvYWRJRCA9IDBcbiAgICAgICAgQHNoZWxmICA9IG5ldyBTaGVsZiBAXG4gICAgICAgIEBuYW1lICAgPSAnRmlsZUJyb3dzZXInXG5cbiAgICAgICAgQHNyY0NhY2hlID0ge31cblxuICAgICAgICBwb3N0Lm9uICdnaXRTdGF0dXMnICAgQG9uR2l0U3RhdHVzXG4gICAgICAgIHBvc3Qub24gJ2ZpbGVJbmRleGVkJyBAb25GaWxlSW5kZXhlZFxuICAgICAgICBwb3N0Lm9uICdmaWxlJyAgICAgICAgQG9uRmlsZVxuICAgICAgICBwb3N0Lm9uICdmaWxlYnJvd3NlcicgQG9uRmlsZUJyb3dzZXJcbiAgICAgICAgcG9zdC5vbiAnZGlyY2FjaGUnICAgIEBvbkRpckNhY2hlXG5cbiAgICAgICAgQHNoZWxmUmVzaXplID0gZWxlbSAnZGl2JywgY2xhc3M6ICdzaGVsZlJlc2l6ZSdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUudG9wICAgICAgPSAnMHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUuYm90dG9tICAgPSAnMHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUubGVmdCAgICAgPSAnMTk0cHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS53aWR0aCAgICA9ICc2cHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5jdXJzb3IgICA9ICdldy1yZXNpemUnXG5cbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQHNoZWxmUmVzaXplXG4gICAgICAgICAgICBvbk1vdmU6ICBAb25TaGVsZkRyYWdcblxuICAgICAgICBAc2hlbGZTaXplID0gd2luZG93LnN0YXRlLmdldCAnc2hlbGZ8c2l6ZScsIDIwMFxuXG4gICAgICAgIEBpbml0Q29sdW1ucygpXG5cbiAgICBvbkZpbGVCcm93c2VyOiAoYWN0aW9uLCBpdGVtLCBhcmcpID0+XG5cbiAgICAgICAgc3dpdGNoIGFjdGlvblxuICAgICAgICAgICAgd2hlbiAnbG9hZEl0ZW0nICAgICB0aGVuIEBsb2FkSXRlbSAgICAgaXRlbSwgYXJnXG4gICAgICAgICAgICB3aGVuICdhY3RpdmF0ZUl0ZW0nIHRoZW4gQGFjdGl2YXRlSXRlbSBpdGVtLCBhcmdcblxuICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsb2FkSXRlbTogKGl0ZW0sIG9wdCkgLT5cblxuICAgICAgICBvcHQgPz0ge31cbiAgICAgICAgaXRlbS5uYW1lID89IHNsYXNoLmZpbGUgaXRlbS5maWxlXG5cbiAgICAgICAgQHBvcENvbHVtbnNGcm9tIDFcblxuICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICB3aGVuICdmaWxlJyB0aGVuIEBsb2FkRmlsZUl0ZW0gaXRlbVxuICAgICAgICAgICAgd2hlbiAnZGlyJyAgdGhlbiBAbG9hZERpckl0ZW0gIGl0ZW0sIDAsIG9wdCAjLCBhY3RpdmU6Jy4uJ1xuXG4gICAgICAgIGlmIG9wdC5mb2N1c1xuICAgICAgICAgICAgQGNvbHVtbnNbMF0uZm9jdXMoKVxuXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIGFjdGl2YXRlSXRlbTogKGl0ZW0sIGNvbCkgLT5cblxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2wrMiBwb3A6dHJ1ZVxuXG4gICAgICAgIHN3aXRjaCBpdGVtLnR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2RpcidcbiAgICAgICAgICAgICAgICBAbG9hZERpckl0ZW0gIGl0ZW0sIGNvbCsxXG4gICAgICAgICAgICB3aGVuICdmaWxlJ1xuICAgICAgICAgICAgICAgIEBsb2FkRmlsZUl0ZW0gaXRlbSwgY29sKzFcbiAgICAgICAgICAgICAgICAjIGtsb2cgJ2FjdGl2YXRlSXRlbScgaXRlbS50ZXh0RmlsZSwgaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgaWYgaXRlbS50ZXh0RmlsZVxuICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUb0ZpbGUnIGl0ZW1cblxuICAgICMgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGxvYWRGaWxlSXRlbTogKGl0ZW0sIGNvbD0wKSAtPlxuXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbCwgcG9wOnRydWVcblxuICAgICAgICB3aGlsZSBjb2wgPj0gQG51bUNvbHMoKVxuICAgICAgICAgICAgQGFkZENvbHVtbigpXG5cbiAgICAgICAgZmlsZSA9IGl0ZW0uZmlsZVxuXG4gICAgICAgIHN3aXRjaCBzbGFzaC5leHQgZmlsZVxuICAgICAgICAgICAgd2hlbiAnZ2lmJyAncG5nJyAnanBnJyAnanBlZycgJ3N2ZycgJ2JtcCcgJ2ljbydcbiAgICAgICAgICAgICAgICBjbnQgPSBlbGVtIGNsYXNzOiAnYnJvd3NlckltYWdlQ29udGFpbmVyJyBjaGlsZDpcbiAgICAgICAgICAgICAgICAgICAgZWxlbSAnaW1nJyBjbGFzczogJ2Jyb3dzZXJJbWFnZScgc3JjOiBzbGFzaC5maWxlVXJsIGZpbGVcbiAgICAgICAgICAgICAgICBAY29sdW1uc1tjb2xdLnRhYmxlLmFwcGVuZENoaWxkIGNudFxuICAgICAgICAgICAgd2hlbiAndGlmZicgJ3RpZidcbiAgICAgICAgICAgICAgICBpZiBub3Qgc2xhc2gud2luKClcbiAgICAgICAgICAgICAgICAgICAgQGNvbnZlcnRJbWFnZSByb3dcbiAgICAgICAgICAgIHdoZW4gJ3B4bSdcbiAgICAgICAgICAgICAgICBpZiBub3Qgc2xhc2gud2luKClcbiAgICAgICAgICAgICAgICAgICAgQGNvbnZlcnRQWE0gcm93XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGxvYWRTb3VyY2VJdGVtIGl0ZW0sIGNvbFxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGxvYWRTb3VyY2VJdGVtOiAoaXRlbSwgY29sKSAtPlxuXG4gICAgICAgIGlmIG5vdCBAc3JjQ2FjaGVbaXRlbS5maWxlXT9cblxuICAgICAgICAgICAgQHNyY0NhY2hlW2l0ZW0uZmlsZV0gPSBwb3N0LmdldCAnaW5kZXhlcicgJ2ZpbGUnIGl0ZW0uZmlsZVxuXG4gICAgICAgIGluZm8gPSBAc3JjQ2FjaGVbaXRlbS5maWxlXVxuXG4gICAgICAgIGlmIGVtcHR5IGluZm9cbiAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0ubG9hZEl0ZW1zIFtdLCBpdGVtXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpdGVtcyA9IFtdXG4gICAgICAgIGNsc3NzID0gaW5mby5jbGFzc2VzID8gW11cbiAgICAgICAgZm9yIGNsc3MgaW4gY2xzc3NcbiAgICAgICAgICAgIHRleHQgPSAn4pePICcrY2xzcy5uYW1lXG4gICAgICAgICAgICBpdGVtcy5wdXNoIG5hbWU6Y2xzcy5uYW1lLCB0ZXh0OnRleHQsIHR5cGU6J2NsYXNzJywgZmlsZTppdGVtLmZpbGUsIGxpbmU6Y2xzcy5saW5lXG5cbiAgICAgICAgZnVuY3MgPSBpbmZvLmZ1bmNzID8gW11cbiAgICAgICAgZm9yIGZ1bmMgaW4gZnVuY3NcbiAgICAgICAgICAgIGlmIGZ1bmMudGVzdCA9PSAnZGVzY3JpYmUnXG4gICAgICAgICAgICAgICAgdGV4dCA9ICfil48gJytmdW5jLm5hbWVcbiAgICAgICAgICAgIGVsc2UgaWYgZnVuYy5zdGF0aWNcbiAgICAgICAgICAgICAgICB0ZXh0ID0gJyAg4peGICcrZnVuYy5uYW1lXG4gICAgICAgICAgICBlbHNlIGlmIGZ1bmMucG9zdFxuICAgICAgICAgICAgICAgIHRleHQgPSAnICDirKIgJytmdW5jLm5hbWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0ZXh0ID0gJyAg4pa4ICcrZnVuYy5uYW1lXG4gICAgICAgICAgICBpdGVtcy5wdXNoIG5hbWU6ZnVuYy5uYW1lLCB0ZXh0OnRleHQsIHR5cGU6J2Z1bmMnLCBmaWxlOml0ZW0uZmlsZSwgbGluZTpmdW5jLmxpbmVcblxuICAgICAgICBpZiB2YWxpZCBpdGVtc1xuICAgICAgICAgICAgaXRlbXMuc29ydCAoYSxiKSAtPiBhLmxpbmUgLSBiLmxpbmVcbiAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0ubG9hZEl0ZW1zIGl0ZW1zLCBpdGVtXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgb25EaXJDYWNoZTogKGRpcikgPT5cblxuICAgICAgICBmb3IgY29sdW1uIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBjb2x1bW4ucGF0aCgpID09IGRpclxuICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbSB7ZmlsZTpkaXIsIHR5cGU6J2Rpcid9LCBjb2x1bW4uaW5kZXgsIGFjdGl2ZTpjb2x1bW4uYWN0aXZlUGF0aCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICBsb2FkRGlySXRlbTogKGl0ZW0sIGNvbD0wLCBvcHQ9e30pIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIGNvbCA+IDAgYW5kIGl0ZW0ubmFtZSA9PSAnLydcblxuICAgICAgICBkaXIgPSBpdGVtLmZpbGVcblxuICAgICAgICBpZiBkaXJDYWNoZS5oYXMoZGlyKSBhbmQgbm90IG9wdC5pZ25vcmVDYWNoZVxuICAgICAgICAgICAgQGxvYWREaXJJdGVtcyBkaXIsIGl0ZW0sIGRpckNhY2hlLmdldChkaXIpLCBjb2wsIG9wdFxuICAgICAgICAgICAgcG9zdC5lbWl0ICdkaXInIGRpclxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBvcHQuaWdub3JlSGlkZGVuID0gbm90IHdpbmRvdy5zdGF0ZS5nZXQgXCJicm93c2VyfHNob3dIaWRkZW58I3tkaXJ9XCJcbiAgICAgICAgICAgIG9wdC50ZXh0VGVzdCA9IHRydWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2xhc2gubGlzdCBkaXIsIG9wdCwgKGl0ZW1zKSA9PlxuXG4gICAgICAgICAgICAgICAgcG9zdC50b01haW4gJ2RpckxvYWRlZCcgZGlyXG5cbiAgICAgICAgICAgICAgICBkaXJDYWNoZS5zZXQgZGlyLCBpdGVtc1xuICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbXMgZGlyLCBpdGVtLCBpdGVtcywgY29sLCBvcHRcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2RpcicgZGlyXG5cbiAgICBsb2FkRGlySXRlbXM6IChkaXIsIGl0ZW0sIGl0ZW1zLCBjb2wsIG9wdCkgPT5cblxuICAgICAgICB1cGRpciA9IHNsYXNoLnJlc29sdmUgc2xhc2guam9pbiBkaXIsICcuLidcblxuICAgICAgICBpZiBjb2wgPT0gMCBvciBjb2wtMSA8IEBudW1Db2xzKCkgYW5kIEBjb2x1bW5zW2NvbC0xXS5hY3RpdmVSb3coKT8uaXRlbS5uYW1lID09ICcuLidcbiAgICAgICAgICAgIGlmIGl0ZW1zWzBdLm5hbWUgbm90IGluIFsnLi4nICcvJ11cbiAgICAgICAgICAgICAgICBpZiBub3QgKHVwZGlyID09IGRpciA9PSBzbGFzaC5yZXNvbHZlICcvJylcbiAgICAgICAgICAgICAgICAgICAgaXRlbXMudW5zaGlmdFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJy4uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6ICB1cGRpclxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaXRlbXMudW5zaGlmdFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJy8nXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogZGlyXG5cbiAgICAgICAgd2hpbGUgY29sID49IEBudW1Db2xzKClcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuXG4gICAgICAgIEBjb2x1bW5zW2NvbF0ubG9hZEl0ZW1zIGl0ZW1zLCBpdGVtXG5cbiAgICAgICAgaWYgb3B0LmFjdGl2ZVxuICAgICAgICAgICAgQGNvbHVtbnNbY29sXS5yb3coc2xhc2guZmlsZSBvcHQuYWN0aXZlKT8uc2V0QWN0aXZlKClcblxuICAgICAgICBAZ2V0R2l0U3RhdHVzIGl0ZW0sIGNvbFxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgbmF2aWdhdGVUb0ZpbGU6IChmaWxlKSAtPlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAjIGtsb2cgJ2ZpbGVicm93c2VyLm5hdmlnYXRlVG9GaWxlJyBmaWxlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGxhc3RQYXRoID0gQGxhc3RVc2VkQ29sdW1uKCk/LnBhdGgoKVxuICAgICAgICBpZiBmaWxlID09IGxhc3RQYXRoXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpZiBzbGFzaC5pc1JlbGF0aXZlIGZpbGVcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGZpbGVsaXN0ID0gc2xhc2gucGF0aGxpc3QgZmlsZVxuICAgICAgICBsYXN0bGlzdCA9IHNsYXNoLnBhdGhsaXN0IGxhc3RQYXRoXG5cbiAgICAgICAgaWYgdmFsaWQgbGFzdGxpc3RcblxuICAgICAgICAgICAgbGFzdGRpciA9IGxhc3QgbGFzdGxpc3RcbiAgICAgICAgICAgIGlmIEBsYXN0VXNlZENvbHVtbigpPy5pc0ZpbGUoKVxuICAgICAgICAgICAgICAgIGxhc3RkaXIgPSBzbGFzaC5kaXIgbGFzdGRpclxuICAgICAgICAgICAgcmVsYXRpdmUgPSBzbGFzaC5yZWxhdGl2ZSBmaWxlLCBsYXN0ZGlyXG5cbiAgICAgICAgICAgIGlmIHNsYXNoLmlzUmVsYXRpdmUgcmVsYXRpdmVcbiAgICAgICAgICAgICAgICB1cENvdW50ID0gMFxuICAgICAgICAgICAgICAgIHdoaWxlIHJlbGF0aXZlLnN0YXJ0c1dpdGggJy4uLydcbiAgICAgICAgICAgICAgICAgICAgdXBDb3VudCArPSAxXG4gICAgICAgICAgICAgICAgICAgIHJlbGF0aXZlID0gcmVsYXRpdmUuc3Vic3RyIDNcblxuICAgICAgICAgICAgICAgIGlmIHVwQ291bnQgPCBAbnVtQ29scygpLTFcbiAgICAgICAgICAgICAgICAgICAgY29sICAgPSBAbnVtQ29scygpIC0gMSAtIHVwQ291bnRcbiAgICAgICAgICAgICAgICAgICAgcmVsc3QgPSBzbGFzaC5wYXRobGlzdCByZWxhdGl2ZVxuICAgICAgICAgICAgICAgICAgICBwYXRocyA9IGZpbGVsaXN0LnNsaWNlIGZpbGVsaXN0Lmxlbmd0aCAtIHJlbHN0Lmxlbmd0aFxuXG4gICAgICAgIGlmIGVtcHR5IHBhdGhzXG5cbiAgICAgICAgICAgIHBrZ0RpciAgID0gc2xhc2gucGtnIGZpbGVcbiAgICAgICAgICAgIHBrZ2xpc3QgID0gc2xhc2gucGF0aGxpc3QgcGtnRGlyXG5cbiAgICAgICAgICAgIGxpc3RpbmRleCA9IHBrZ2xpc3QubGVuZ3RoIC0gMVxuICAgICAgICAgICAgY29sMGluZGV4ID0gbGlzdGluZGV4XG4gICAgICAgICAgICBjb2wgPSAwXG5cbiAgICAgICAgICAgIGlmIGZpbGVsaXN0W2NvbDBpbmRleF0gPT0gQGNvbHVtbnNbMF0/LnBhdGgoKVxuICAgICAgICAgICAgICAgIHdoaWxlIGNvbDBpbmRleCA8IGxhc3RsaXN0Lmxlbmd0aCBhbmQgY29sMGluZGV4IDwgZmlsZWxpc3QubGVuZ3RoIGFuZCBsYXN0bGlzdFtjb2wwaW5kZXhdID09IGZpbGVsaXN0W2NvbDBpbmRleF1cbiAgICAgICAgICAgICAgICAgICAgY29sMGluZGV4ICs9IDFcbiAgICAgICAgICAgICAgICAgICAgY29sICs9IDFcblxuICAgICAgICAgICAgcGF0aHMgPSBmaWxlbGlzdC5zbGljZSBjb2wwaW5kZXhcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBzbGFzaC5pc0ZpbGUgbGFzdCBwYXRoc1xuICAgICAgICAgICAgbGFzdFR5cGUgPSAnZmlsZSdcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbGFzdFR5cGUgPSAnZGlyJ1xuXG4gICAgICAgIEBwb3BDb2x1bW5zRnJvbSAgIGNvbCtwYXRocy5sZW5ndGhcbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sXG4gICAgICAgIFxuICAgICAgICB3aGlsZSBAbnVtQ29scygpIDwgcGF0aHMubGVuZ3RoXG4gICAgICAgICAgICBAYWRkQ29sdW1uKClcbiAgICAgICAgXG4gICAgICAgIGlmIGNvbCA+IDBcbiAgICAgICAgICAgIEBjb2x1bW5zW2NvbC0xXS5yb3coc2xhc2guZmlsZSBwYXRoc1swXSk/LnNldEFjdGl2ZSgpXG5cbiAgICAgICAgZm9yIGluZGV4IGluIFswLi4ucGF0aHMubGVuZ3RoXVxuICAgICAgICAgICAgdHlwZSA9IGlmIGluZGV4ID09IHBhdGhzLmxlbmd0aC0xIHRoZW4gbGFzdFR5cGUgZWxzZSAnZGlyJ1xuICAgICAgICAgICAgZmlsZSA9IHBhdGhzW2luZGV4XVxuICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgY29sID09IDAgPT0gaW5kZXggYW5kIHR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgdHlwZSA9ICdkaXInXG4gICAgICAgICAgICAgICAgZmlsZSA9IHNsYXNoLmRpciBmaWxlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpdGVtID0gZmlsZTpmaWxlLCB0eXBlOnR5cGVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3dpdGNoIHR5cGVcbiAgICAgICAgICAgICAgICB3aGVuICdmaWxlJyB0aGVuIEBsb2FkRmlsZUl0ZW0gaXRlbSwgY29sK2luZGV4XG4gICAgICAgICAgICAgICAgd2hlbiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICBvcHQgPSB7fVxuICAgICAgICAgICAgICAgICAgICBpZiBpbmRleCA8IHBhdGhzLmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHQuYWN0aXZlID0gcGF0aHNbaW5kZXgrMV1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBjb2wgPT0gMCA9PSBpbmRleCBhbmQgcGF0aHMubGVuZ3RoID09IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdC5hY3RpdmUgPSBwYXRoc1swXVxuICAgICAgICAgICAgICAgICAgICBAbG9hZERpckl0ZW0gaXRlbSwgY29sK2luZGV4LCBvcHRcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAjIGlmIGNvbCA9PSAwID09IGluZGV4IGFuZCBwYXRocy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgICMgQGNvbHVtbnNbY29sXS5yb3coc2xhc2guZmlsZSBwYXRoc1swXSk/LnNldEFjdGl2ZSgpXG5cbiAgICAgICAgbGFzdEl0ZW0gPSBmaWxlOmxhc3QocGF0aHMpLCB0eXBlOmxhc3RUeXBlXG4gICAgICAgIFxuICAgICAgICBAZW1pdCAnaXRlbUFjdGl2YXRlZCcgbGFzdEl0ZW1cblxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICBvbkZpbGU6IChmaWxlKSA9PlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgZmlsZVxuICAgICAgICByZXR1cm4gaWYgbm90IEBmbGV4XG5cbiAgICAgICAgQG5hdmlnYXRlVG9GaWxlIGZpbGVcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGluaXRDb2x1bW5zOiAtPlxuXG4gICAgICAgIHN1cGVyKClcblxuICAgICAgICBAdmlldy5pbnNlcnRCZWZvcmUgQHNoZWxmLmRpdiwgQHZpZXcuZmlyc3RDaGlsZFxuICAgICAgICBAdmlldy5pbnNlcnRCZWZvcmUgQHNoZWxmUmVzaXplLCBudWxsXG5cbiAgICAgICAgQHNoZWxmLmJyb3dzZXJEaWRJbml0Q29sdW1ucygpXG5cbiAgICAgICAgQHNldFNoZWxmU2l6ZSBAc2hlbGZTaXplXG5cbiAgICBjb2x1bW5BdFBvczogKHBvcykgLT5cblxuICAgICAgICBpZiBjb2x1bW4gPSBzdXBlciBwb3NcbiAgICAgICAgICAgIHJldHVybiBjb2x1bW5cblxuICAgICAgICBpZiBlbGVtLmNvbnRhaW5zUG9zIEBzaGVsZi5kaXYsIHBvc1xuICAgICAgICAgICAgcmV0dXJuIEBzaGVsZlxuXG4gICAgbGFzdENvbHVtblBhdGg6IC0+XG5cbiAgICAgICAgaWYgbGFzdENvbHVtbiA9IEBsYXN0VXNlZENvbHVtbigpXG4gICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtbi5wYXRoKClcblxuICAgIGxhc3REaXJDb2x1bW46IC0+XG5cbiAgICAgICAgaWYgbGFzdENvbHVtbiA9IEBsYXN0VXNlZENvbHVtbigpXG4gICAgICAgICAgICBpZiBsYXN0Q29sdW1uLmlzRGlyKClcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtblxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBsYXN0Q29sdW1uLnByZXZDb2x1bW4oKVxuXG4gICAgb25CYWNrc3BhY2VJbkNvbHVtbjogKGNvbHVtbikgLT5cblxuICAgICAgICBjb2x1bW4uY2xlYXJTZWFyY2goKVxuICAgICAgICBAbmF2aWdhdGUgJ2xlZnQnXG5cbiAgICB1cGRhdGVDb2x1bW5TY3JvbGxzOiA9PlxuXG4gICAgICAgIHN1cGVyKClcbiAgICAgICAgQHNoZWxmLnNjcm9sbC51cGRhdGUoKVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDBcblxuICAgIG9uU2hlbGZEcmFnOiAoZHJhZywgZXZlbnQpID0+XG5cbiAgICAgICAgc2hlbGZTaXplID0gY2xhbXAgMCwgNDAwLCBkcmFnLnBvcy54XG4gICAgICAgIEBzZXRTaGVsZlNpemUgc2hlbGZTaXplXG5cbiAgICBzZXRTaGVsZlNpemU6IChAc2hlbGZTaXplKSAtPlxuXG4gICAgICAgIHdpbmRvdy5zdGF0ZS5zZXQgJ3NoZWxmfHNpemUnIEBzaGVsZlNpemVcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmxlZnQgPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEBzaGVsZi5kaXYuc3R5bGUud2lkdGggPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEBjb2xzLnN0eWxlLmxlZnQgPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbiAgICBnZXRHaXRTdGF0dXM6IChpdGVtLCBjb2wpID0+XG5cbiAgICAgICAgZmlsZSA9IGl0ZW0uZmlsZSA/IGl0ZW0ucGFyZW50Py5maWxlXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBmaWxlXG5cbiAgICAgICAgaHViLnN0YXR1cyBmaWxlLCAoc3RhdHVzKSA9PiBAYXBwbHlHaXRTdGF0dXNGaWxlcyBjb2wsIGh1Yi5zdGF0dXNGaWxlcyBzdGF0dXNcblxuICAgIGFwcGx5R2l0U3RhdHVzRmlsZXM6IChjb2wsIGZpbGVzKSA9PlxuXG4gICAgICAgIEBjb2x1bW5zW2NvbF0/LnVwZGF0ZUdpdEZpbGVzIGZpbGVzXG5cbiAgICBvbkdpdFN0YXR1czogKGdpdERpciwgc3RhdHVzKSA9PlxuXG4gICAgICAgIGZpbGVzID0gaHViLnN0YXR1c0ZpbGVzIHN0YXR1c1xuICAgICAgICBmb3IgY29sIGluIFswLi5AY29sdW1ucy5sZW5ndGhdXG4gICAgICAgICAgICBAYXBwbHlHaXRTdGF0dXNGaWxlcyBjb2wsIGZpbGVzXG5cbiAgICAgICAgQHNoZWxmLnVwZGF0ZUdpdEZpbGVzIGZpbGVzXG5cbiAgICByZWZyZXNoOiA9PlxuXG4gICAgICAgIGh1Yi5yZWZyZXNoKClcblxuICAgICAgICBkaXJDYWNoZS5yZXNldCgpXG4gICAgICAgIEBzcmNDYWNoZSA9IHt9XG5cbiAgICAgICAgaWYgQGxhc3RVc2VkQ29sdW1uKClcbiAgICAgICAgICAgIEBuYXZpZ2F0ZVRvRmlsZSBAbGFzdFVzZWRDb2x1bW4oKT8ucGF0aCgpXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgb25GaWxlSW5kZXhlZDogKGZpbGUsIGluZm8pID0+XG5cbiAgICAgICAgQHNyY0NhY2hlW2ZpbGVdID0gaW5mb1xuXG4gICAgICAgIGlmIGZpbGUgPT0gQGxhc3RVc2VkQ29sdW1uKCk/LnBhcmVudD8uZmlsZVxuICAgICAgICAgICAgQGxvYWRTb3VyY2VJdGVtIHsgZmlsZTpmaWxlLCB0eXBlOidmaWxlJyB9LCBAbGFzdFVzZWRDb2x1bW4oKT8uaW5kZXhcblxubW9kdWxlLmV4cG9ydHMgPSBGaWxlQnJvd3NlclxuIl19
//# sourceURL=../../coffee/browser/filebrowser.coffee