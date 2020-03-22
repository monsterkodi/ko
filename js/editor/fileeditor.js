// koffee 1.12.0

/*
00000000  000  000      00000000        00000000  0000000    000  000000000   0000000   00000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000000    000  000      0000000         0000000   000   000  000     000     000   000  0000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000       000  0000000  00000000        00000000  0000000    000     000      0000000   000   000
 */
var FileEditor, Syntax, TextEditor, clamp, electron, empty, fs, kerror, kpos, popup, post, ref, setStyle, slash, srcmap, stopEvent, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf;

ref = require('kxk'), clamp = ref.clamp, empty = ref.empty, fs = ref.fs, kerror = ref.kerror, kpos = ref.kpos, popup = ref.popup, post = ref.post, setStyle = ref.setStyle, slash = ref.slash, srcmap = ref.srcmap, stopEvent = ref.stopEvent, valid = ref.valid;

TextEditor = require('./texteditor');

Syntax = require('./syntax');

electron = require('electron');

FileEditor = (function(superClass) {
    extend(FileEditor, superClass);

    function FileEditor(viewElem) {
        this.showContextMenu = bind(this.showContextMenu, this);
        this.onContextMenu = bind(this.onContextMenu, this);
        this.jumpTo = bind(this.jumpTo, this);
        this.jumpToFile = bind(this.jumpToFile, this);
        this.onCommandline = bind(this.onCommandline, this);
        FileEditor.__super__.constructor.call(this, viewElem, {
            features: ['Diffbar', 'Scrollbar', 'Numbers', 'Minimap', 'Meta', 'Autocomplete', 'Brackets', 'Strings', 'CursorLine'],
            fontSize: 19
        });
        this.currentFile = null;
        this.view.addEventListener('contextmenu', this.onContextMenu);
        post.on('commandline', this.onCommandline);
        post.on('jumpTo', this.jumpTo);
        post.on('jumpToFile', this.jumpToFile);
        this.initPigments();
        this.initInvisibles();
        this.setText('');
    }

    FileEditor.prototype.changed = function(changeInfo) {
        var dirty;
        FileEditor.__super__.changed.call(this, changeInfo);
        if (changeInfo.changes.length) {
            dirty = this["do"].hasChanges();
            if (this.dirty !== dirty) {
                this.dirty = dirty;
                return post.emit('dirty', this.dirty);
            }
        }
    };

    FileEditor.prototype.clear = function() {
        var ref1, ref2;
        this.dirty = false;
        this.setSalterMode(false);
        if ((ref1 = this.diffbar) != null) {
            ref1.clear();
        }
        if ((ref2 = this.meta) != null) {
            ref2.clear();
        }
        this.setLines(['']);
        return this["do"].reset();
    };

    FileEditor.prototype.setCurrentFile = function(file, restoreState) {
        var fileExists, ref1;
        this.clear();
        this.currentFile = file;
        this.setupFileType();
        fileExists = (this.currentFile != null) && slash.fileExists(this.currentFile);
        if (restoreState) {
            this.setText(restoreState.text());
            this.state = restoreState;
            this.dirty = true;
        } else if (fileExists) {
            this.setText(slash.readText(this.currentFile));
        }
        if (fileExists) {
            if ((ref1 = window.tabs.activeTab()) != null) {
                ref1.setFile(this.currentFile);
            }
        }
        post.emit('file', this.currentFile);
        this.emit('file', this.currentFile);
        return post.emit('dirty', this.dirty);
    };

    FileEditor.prototype.currentDir = function() {
        if ((this.currentFile != null) && slash.fileExists(this.currentFile)) {
            return slash.dir(this.currentFile);
        } else {
            return slash.path(process.cwd());
        }
    };

    FileEditor.prototype.restoreFromTabState = function(tabState) {
        if (tabState.file == null) {
            return kerror("no tabState.file?");
        }
        return this.setCurrentFile(tabState.file, tabState.state);
    };

    FileEditor.prototype.shebangFileType = function() {
        var ext, fileType;
        if (this.numLines()) {
            fileType = Syntax.shebang(this.line(0));
        }
        if (fileType === 'txt') {
            if (this.currentFile != null) {
                ext = slash.ext(this.currentFile);
                if (indexOf.call(Syntax.syntaxNames, ext) >= 0) {
                    return ext;
                }
            }
        } else if (fileType) {
            return fileType;
        }
        return FileEditor.__super__.shebangFileType.call(this);
    };

    FileEditor.prototype.onCommandline = function(e) {
        var d;
        switch (e) {
            case 'hidden':
            case 'shown':
                d = window.split.commandlineHeight + window.split.handleHeight;
                d = Math.min(d, this.scroll.scrollMax - this.scroll.scroll);
                if (e === 'hidden') {
                    d *= -1;
                }
                return this.scroll.by(d);
        }
    };

    FileEditor.prototype.saveScrollCursorsAndSelections = function(opt) {
        var filePositions, s;
        if (!this.currentFile) {
            return;
        }
        s = {};
        s.main = this.state.main();
        if (this.numCursors() > 1 || this.cursorPos()[0] || this.cursorPos()[1]) {
            s.cursors = this.state.cursors();
        }
        if (this.numSelections()) {
            s.selections = this.state.selections();
        }
        if (this.numHighlights()) {
            s.highlights = this.state.highlights();
        }
        if (this.scroll.scroll) {
            s.scroll = this.scroll.scroll;
        }
        filePositions = window.stash.get('filePositions', Object.create(null));
        if (!filePositions || typeof filePositions !== 'object') {
            filePositions = Object.create(null);
        }
        filePositions[this.currentFile] = s;
        return window.stash.set('filePositions', filePositions);
    };

    FileEditor.prototype.restoreScrollCursorsAndSelections = function() {
        var cursors, filePositions, ref1, ref2, ref3, ref4, ref5, s;
        if (!this.currentFile) {
            return;
        }
        filePositions = window.stash.get('filePositions', {});
        if (filePositions[this.currentFile] != null) {
            s = filePositions[this.currentFile];
            cursors = (ref1 = s.cursors) != null ? ref1 : [[0, 0]];
            cursors = cursors.map((function(_this) {
                return function(c) {
                    return [c[0], clamp(0, _this.numLines() - 1, c[1])];
                };
            })(this));
            this.setCursors(cursors);
            this.setSelections((ref2 = s.selections) != null ? ref2 : []);
            this.setHighlights((ref3 = s.highlights) != null ? ref3 : []);
            this.setMain((ref4 = s.main) != null ? ref4 : 0);
            this.setState(this.state);
            if (s.scroll) {
                this.scroll.to(s.scroll);
            }
            this.scroll.cursorIntoView();
        } else {
            this.singleCursorAtPos([0, 0]);
            if (this.mainCursor()[1] === 0) {
                this.scroll.top = 0;
            }
            this.scroll.bot = this.scroll.top - 1;
            this.scroll.to(0);
            this.scroll.cursorIntoView();
        }
        this.updateLayers();
        if ((ref5 = this.numbers) != null) {
            ref5.updateColors();
        }
        this.minimap.onEditorScroll();
        this.emit('cursor');
        return this.emit('selection');
    };

    FileEditor.prototype.jumpToFile = function(opt) {
        var file, fpos, ref1;
        window.tabs.activeTab(true);
        if (opt.newTab) {
            file = opt.file;
            if (opt.line) {
                file += ':' + opt.line;
            }
            if (opt.col) {
                file += ':' + opt.col;
            }
            return post.emit('newTabWithFile', file);
        } else {
            ref1 = slash.splitFilePos(opt.file), file = ref1[0], fpos = ref1[1];
            opt.pos = fpos;
            if (opt.col) {
                opt.pos[0] = opt.col;
            }
            if (opt.line) {
                opt.pos[1] = opt.line - 1;
            }
            opt.winID = window.winID;
            opt.oldPos = this.cursorPos();
            opt.oldFile = this.currentFile;
            return window.navigate.gotoFilePos(opt);
        }
    };

    FileEditor.prototype.jumpTo = function(word, opt) {
        var classes, clss, file, files, find, func, funcs, i, info, infos, j, len, type;
        if (typeof word === 'object' && (opt == null)) {
            opt = word;
            word = opt.word;
        }
        if (opt != null) {
            opt;
        } else {
            opt = {};
        }
        if (opt.file != null) {
            this.jumpToFile(opt);
            return true;
        }
        if (empty(word)) {
            return kerror('nothing to jump to?');
        }
        find = word.toLowerCase().trim();
        if (find[0] === '@') {
            find = find.slice(1);
        }
        if (empty(find)) {
            return kerror('FileEditor.jumpTo -- nothing to find?');
        }
        type = opt != null ? opt.type : void 0;
        if (!type || type === 'class') {
            classes = post.get('indexer', 'classes');
            for (clss in classes) {
                info = classes[clss];
                if (clss.toLowerCase() === find) {
                    this.jumpToFile(info);
                    return true;
                }
            }
        }
        if (!type || type === 'func') {
            funcs = post.get('indexer', 'funcs');
            for (func in funcs) {
                infos = funcs[func];
                if (func.toLowerCase() === find) {
                    info = infos[0];
                    for (j = 0, len = infos.length; j < len; j++) {
                        i = infos[j];
                        if (i.file === this.currentFile) {
                            info = i;
                        }
                    }
                    this.jumpToFile(info);
                    return true;
                }
            }
        }
        if (!type || type === 'file') {
            files = post.get('indexer', 'files');
            for (file in files) {
                info = files[file];
                if (slash.base(file).toLowerCase() === find && file !== this.currentFile) {
                    this.jumpToFile({
                        file: file,
                        line: 6
                    });
                }
            }
        }
        window.commandline.commands.search.start('search');
        window.commandline.commands.search.execute(word);
        window.split["do"]('show terminal');
        return true;
    };

    FileEditor.prototype.jumpToCounterpart = function() {
        var col, counter, counterparts, cp, currext, ext, file, j, k, len, len1, line, ref1, ref2, ref3, ref4, ref5, ref6;
        cp = this.cursorPos();
        currext = slash.ext(this.currentFile);
        switch (currext) {
            case 'coffee':
            case 'koffee':
                ref1 = srcmap.toJs(this.currentFile, cp[1] + 1, cp[0]), file = ref1[0], line = ref1[1], col = ref1[2];
                break;
            case 'js':
                ref2 = srcmap.toCoffee(this.currentFile, cp[1] + 1, cp[0]), file = ref2[0], line = ref2[1], col = ref2[2];
        }
        if (valid(file) && slash.fileExists(file)) {
            post.emit('loadFile', slash.joinFileLine(file, line, col));
            return true;
        }
        counterparts = {
            cpp: ['hpp', 'h'],
            cc: ['hpp', 'h'],
            h: ['cpp', 'c'],
            hpp: ['cpp', 'c'],
            coffee: ['js'],
            koffee: ['js'],
            js: ['coffee', 'koffee'],
            pug: ['html'],
            html: ['pug'],
            css: ['styl'],
            styl: ['css']
        };
        ref4 = (ref3 = counterparts[currext]) != null ? ref3 : [];
        for (j = 0, len = ref4.length; j < len; j++) {
            ext = ref4[j];
            if (slash.fileExists(slash.swapExt(this.currentFile, ext))) {
                post.emit('loadFile', slash.swapExt(this.currentFile, ext));
                return true;
            }
        }
        ref6 = (ref5 = counterparts[currext]) != null ? ref5 : [];
        for (k = 0, len1 = ref6.length; k < len1; k++) {
            ext = ref6[k];
            counter = slash.swapExt(this.currentFile, ext);
            counter = counter.replace("/" + currext + "/", "/" + ext + "/");
            if (slash.fileExists(counter)) {
                post.emit('loadFile', counter);
                return true;
            }
        }
        return false;
    };

    FileEditor.prototype.centerText = function(center, animate) {
        var br, j, k, l, layers, len, len1, newOffset, offsetX, resetTrans, t, transi, visCols;
        if (animate == null) {
            animate = 300;
        }
        this.size.centerText = center;
        this.updateLayers();
        this.size.offsetX = Math.floor(this.size.charWidth / 2 + this.size.numbersWidth);
        if (center) {
            br = this.view.getBoundingClientRect();
            visCols = parseInt(br.width / this.size.charWidth);
            newOffset = parseInt(this.size.charWidth * (visCols - 100) / 2);
            this.size.offsetX = Math.max(this.size.offsetX, newOffset);
            this.size.centerText = true;
        } else {
            this.size.centerText = false;
        }
        this.updateLinePositions(animate);
        if (animate) {
            layers = ['.selections', '.highlights', '.cursors'];
            transi = ['.selection', '.highlight', '.cursor'].concat(layers);
            resetTrans = (function(_this) {
                return function() {
                    var j, k, l, len, len1, t;
                    for (j = 0, len = layers.length; j < len; j++) {
                        l = layers[j];
                        setStyle('.editor .layers ' + l, 'transform', "translateX(0)");
                    }
                    for (k = 0, len1 = transi.length; k < len1; k++) {
                        t = transi[k];
                        setStyle('.editor .layers ' + t, 'transition', "initial");
                    }
                    return _this.updateLayers();
                };
            })(this);
            if (center) {
                offsetX = this.size.offsetX - this.size.numbersWidth - this.size.charWidth / 2;
            } else {
                offsetX = Math.floor(this.size.charWidth / 2 + this.size.numbersWidth);
                offsetX -= this.size.numbersWidth + this.size.charWidth / 2;
                offsetX *= -1;
            }
            for (j = 0, len = layers.length; j < len; j++) {
                l = layers[j];
                setStyle('.editor .layers ' + l, 'transform', "translateX(" + offsetX + "px)");
            }
            for (k = 0, len1 = transi.length; k < len1; k++) {
                t = transi[k];
                setStyle('.editor .layers ' + t, 'transition', "all " + (animate / 1000) + "s");
            }
            return setTimeout(resetTrans, animate);
        } else {
            return this.updateLayers();
        }
    };

    FileEditor.prototype.onContextMenu = function(event) {
        return stopEvent(event, this.showContextMenu(kpos(event)));
    };

    FileEditor.prototype.showContextMenu = function(absPos) {
        var RecentMenu, f, fileMenu, fileSpan, getMenu, j, len, opt, recent, ref1;
        if (absPos == null) {
            absPos = kpos(this.view.getBoundingClientRect().left, this.view.getBoundingClientRect().top);
        }
        opt = {
            items: [
                {
                    text: 'Browse',
                    combo: 'command+.',
                    accel: 'ctrl+.',
                    cb: function() {
                        return window.commandline.startCommand('browse');
                    }
                }, {
                    text: 'Back',
                    combo: 'command+1',
                    cb: function() {
                        return post.emit('menuAction', 'Navigate Backward');
                    }
                }, {
                    text: ''
                }, {
                    text: 'Maximize',
                    combo: 'command+shift+y',
                    accel: 'ctrl+shift+y',
                    cb: function() {
                        return window.split.maximizeEditor();
                    }
                }, {
                    text: ''
                }
            ]
        };
        opt.items = opt.items.concat(window.titlebar.menuTemplate());
        RecentMenu = [];
        fileSpan = function(f) {
            var span;
            if (f != null) {
                span = Syntax.spanForTextAndSyntax(slash.tilde(slash.dir(f)), 'browser');
                span += Syntax.spanForTextAndSyntax('/' + slash.base(f), 'browser');
            }
            return span;
        };
        recent = (ref1 = window.state) != null ? ref1.get('recentFiles', []) : void 0;
        if (recent != null) {
            recent;
        } else {
            recent = [];
        }
        for (j = 0, len = recent.length; j < len; j++) {
            f = recent[j];
            if (fs.existsSync(f)) {
                RecentMenu.unshift({
                    html: fileSpan(f),
                    arg: f,
                    cb: function(arg) {
                        return post.emit('newTabWithFile', arg);
                    }
                });
            }
        }
        getMenu = function(template, name) {
            var item, k, len1;
            for (k = 0, len1 = template.length; k < len1; k++) {
                item = template[k];
                if (item.text === name) {
                    return item;
                }
            }
        };
        if (RecentMenu.length) {
            RecentMenu.push({
                text: ''
            });
            RecentMenu.push({
                text: 'Clear List'
            });
            fileMenu = getMenu(opt.items, 'File');
            fileMenu.menu = [
                {
                    text: 'Recent',
                    menu: RecentMenu
                }, {
                    text: ''
                }
            ].concat(fileMenu.menu);
        }
        opt.x = absPos.x;
        opt.y = absPos.y;
        return popup.menu(opt);
    };

    FileEditor.prototype.clickAtPos = function(p, event) {
        if (event.metaKey) {
            if (kpos(event).x <= this.size.numbersWidth) {
                this.singleCursorAtPos(p);
                return;
            }
        }
        return FileEditor.__super__.clickAtPos.call(this, p, event);
    };

    FileEditor.prototype.handleModKeyComboCharEvent = function(mod, key, combo, char, event) {
        var split;
        if ('unhandled' !== FileEditor.__super__.handleModKeyComboCharEvent.call(this, mod, key, combo, char, event)) {
            return;
        }
        switch (combo) {
            case 'alt+ctrl+enter':
                return window.commandline.commands.coffee.executeText(this.textOfSelectionForClipboard());
            case 'alt+ctrl+shift+enter':
                return window.commandline.commands.coffee.executeTextInMain(this.textOfSelectionForClipboardt());
            case 'command+alt+up':
            case 'alt+o':
                return this.jumpToCounterpart();
            case 'esc':
                split = window.split;
                if (split.terminalVisible()) {
                    split.hideTerminal();
                } else if (split.commandlineVisible()) {
                    split.hideCommandline();
                }
                return;
        }
        return 'unhandled';
    };

    return FileEditor;

})(TextEditor);

module.exports = FileEditor;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvZWRpdG9yIiwic291cmNlcyI6WyJmaWxlZWRpdG9yLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxxSUFBQTtJQUFBOzs7OztBQVFBLE1BQTZGLE9BQUEsQ0FBUSxLQUFSLENBQTdGLEVBQUUsaUJBQUYsRUFBUyxpQkFBVCxFQUFnQixXQUFoQixFQUFvQixtQkFBcEIsRUFBNEIsZUFBNUIsRUFBa0MsaUJBQWxDLEVBQXlDLGVBQXpDLEVBQStDLHVCQUEvQyxFQUF5RCxpQkFBekQsRUFBZ0UsbUJBQWhFLEVBQXdFLHlCQUF4RSxFQUFtRjs7QUFFbkYsVUFBQSxHQUFhLE9BQUEsQ0FBUSxjQUFSOztBQUNiLE1BQUEsR0FBYSxPQUFBLENBQVEsVUFBUjs7QUFDYixRQUFBLEdBQWEsT0FBQSxDQUFRLFVBQVI7O0FBRVA7OztJQUVDLG9CQUFDLFFBQUQ7Ozs7OztRQUVDLDRDQUFNLFFBQU4sRUFDSTtZQUFBLFFBQUEsRUFBVSxDQUNOLFNBRE0sRUFFTixXQUZNLEVBR04sU0FITSxFQUlOLFNBSk0sRUFLTixNQUxNLEVBTU4sY0FOTSxFQU9OLFVBUE0sRUFRTixTQVJNLEVBU04sWUFUTSxDQUFWO1lBV0EsUUFBQSxFQUFVLEVBWFY7U0FESjtRQWNBLElBQUMsQ0FBQSxXQUFELEdBQWU7UUFFZixJQUFDLENBQUEsSUFBSSxDQUFDLGdCQUFOLENBQXVCLGFBQXZCLEVBQXFDLElBQUMsQ0FBQSxhQUF0QztRQUVBLElBQUksQ0FBQyxFQUFMLENBQVEsYUFBUixFQUF3QixJQUFDLENBQUEsYUFBekI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFFBQVIsRUFBd0IsSUFBQyxDQUFBLE1BQXpCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxZQUFSLEVBQXdCLElBQUMsQ0FBQSxVQUF6QjtRQUVBLElBQUMsQ0FBQSxZQUFELENBQUE7UUFDQSxJQUFDLENB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O0FBQUEsaUJBQ1MsZ0JBRFQ7QUFDcUMsdUJBQU8sTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFdBQW5DLENBQStDLElBQUMsQ0FBQSwyQkFBRCxDQUFBLENBQS9DO0FBRDVDLGlCQUVTLHNCQUZUO0FBRXFDLHVCQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxpQkFBbkMsQ0FBcUQsSUFBQyxDQUFBLDRCQUFELENBQUEsQ0FBckQ7QUFGNUMsaUJBR1MsZ0JBSFQ7QUFBQSxpQkFHMEIsT0FIMUI7QUFHdUMsdUJBQU8sSUFBQyxDQUFBLGlCQUFELENBQUE7QUFIOUMsaUJBSVMsS0FKVDtnQkFLUSxLQUFBLEdBQVEsTUFBTSxDQUFDO2dCQUNmLElBQUcsS0FBSyxDQUFDLGVBQU4sQ0FBQSxDQUFIO29CQUNJLEtBQUssQ0FBQyxZQUFOLENBQUEsRUFESjtpQkFBQSxNQUVLLElBQUcsS0FBSyxDQUFDLGtCQUFOLENBQUEsQ0FBSDtvQkFDRCxLQUFLLENBQUMsZUFBTixDQUFBLEVBREM7O0FBRUw7QUFWUjtlQVdBO0lBZHdCOzs7O0dBOWNQOztBQThkekIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiMjI1xuXG57IGNsYW1wLCBlbXB0eSwgZnMsIGtlcnJvciwga3BvcywgcG9wdXAsIHBvc3QsIHNldFN0eWxlLCBzbGFzaCwgc3JjbWFwLCBzdG9wRXZlbnQsIHZhbGlkIH0gPSByZXF1aXJlICdreGsnXG5cblRleHRFZGl0b3IgPSByZXF1aXJlICcuL3RleHRlZGl0b3InXG5TeW50YXggICAgID0gcmVxdWlyZSAnLi9zeW50YXgnXG5lbGVjdHJvbiAgID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5cbmNsYXNzIEZpbGVFZGl0b3IgZXh0ZW5kcyBUZXh0RWRpdG9yXG5cbiAgICBAOiAodmlld0VsZW0pIC0+XG5cbiAgICAgICAgc3VwZXIgdmlld0VsZW0sXG4gICAgICAgICAgICBmZWF0dXJlczogW1xuICAgICAgICAgICAgICAgICdEaWZmYmFyJ1xuICAgICAgICAgICAgICAgICdTY3JvbGxiYXInXG4gICAgICAgICAgICAgICAgJ051bWJlcnMnXG4gICAgICAgICAgICAgICAgJ01pbmltYXAnXG4gICAgICAgICAgICAgICAgJ01ldGEnXG4gICAgICAgICAgICAgICAgJ0F1dG9jb21wbGV0ZSdcbiAgICAgICAgICAgICAgICAnQnJhY2tldHMnXG4gICAgICAgICAgICAgICAgJ1N0cmluZ3MnXG4gICAgICAgICAgICAgICAgJ0N1cnNvckxpbmUnXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZm9udFNpemU6IDE5XG5cbiAgICAgICAgQGN1cnJlbnRGaWxlID0gbnVsbFxuXG4gICAgICAgIEB2aWV3LmFkZEV2ZW50TGlzdGVuZXIgJ2NvbnRleHRtZW51JyBAb25Db250ZXh0TWVudVxuXG4gICAgICAgIHBvc3Qub24gJ2NvbW1hbmRsaW5lJyAgIEBvbkNvbW1hbmRsaW5lXG4gICAgICAgIHBvc3Qub24gJ2p1bXBUbycgICAgICAgIEBqdW1wVG9cbiAgICAgICAgcG9zdC5vbiAnanVtcFRvRmlsZScgICAgQGp1bXBUb0ZpbGVcblxuICAgICAgICBAaW5pdFBpZ21lbnRzKClcbiAgICAgICAgQGluaXRJbnZpc2libGVzKClcbiAgICAgICAgXG4gICAgICAgIEBzZXRUZXh0ICcnXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgY2hhbmdlZDogKGNoYW5nZUluZm8pIC0+XG5cbiAgICAgICAgc3VwZXIgY2hhbmdlSW5mb1xuICAgICAgICBcbiAgICAgICAgaWYgY2hhbmdlSW5mby5jaGFuZ2VzLmxlbmd0aFxuICAgICAgICAgICAgZGlydHkgPSBAZG8uaGFzQ2hhbmdlcygpXG4gICAgICAgICAgICBpZiBAZGlydHkgIT0gZGlydHlcbiAgICAgICAgICAgICAgICBAZGlydHkgPSBkaXJ0eVxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnZGlydHknIEBkaXJ0eVxuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICBjbGVhcjogLT5cblxuICAgICAgICBAZGlydHkgPSBmYWxzZVxuICAgICAgICBAc2V0U2FsdGVyTW9kZSBmYWxzZVxuICAgICAgICBAZGlmZmJhcj8uY2xlYXIoKVxuICAgICAgICBAbWV0YT8uY2xlYXIoKVxuICAgICAgICBAc2V0TGluZXMgWycnXVxuICAgICAgICBAZG8ucmVzZXQoKVxuXG4gICAgc2V0Q3VycmVudEZpbGU6IChmaWxlLCByZXN0b3JlU3RhdGUpIC0+XG5cbiAgICAgICAgQGNsZWFyKClcbiAgICAgICAgXG4gICAgICAgIEBjdXJyZW50RmlsZSA9IGZpbGVcblxuICAgICAgICBAc2V0dXBGaWxlVHlwZSgpXG5cbiAgICAgICAgZmlsZUV4aXN0cyA9IEBjdXJyZW50RmlsZT8gYW5kIHNsYXNoLmZpbGVFeGlzdHMgQGN1cnJlbnRGaWxlXG5cbiAgICAgICAgaWYgcmVzdG9yZVN0YXRlXG4gICAgICAgICAgICBAc2V0VGV4dCByZXN0b3JlU3RhdGUudGV4dCgpXG4gICAgICAgICAgICBAc3RhdGUgPSByZXN0b3JlU3RhdGVcbiAgICAgICAgICAgIEBkaXJ0eSA9IHRydWVcbiAgICAgICAgZWxzZSBpZiBmaWxlRXhpc3RzXG4gICAgICAgICAgICBAc2V0VGV4dCBzbGFzaC5yZWFkVGV4dCBAY3VycmVudEZpbGVcblxuICAgICAgICBpZiBmaWxlRXhpc3RzXG4gICAgICAgICAgICB3aW5kb3cudGFicy5hY3RpdmVUYWIoKT8uc2V0RmlsZSBAY3VycmVudEZpbGVcbiAgICAgICAgICAgIFxuICAgICAgICBwb3N0LmVtaXQgJ2ZpbGUnIEBjdXJyZW50RmlsZSAjIGJyb3dzZXIgJiBzaGVsZlxuXG4gICAgICAgIEBlbWl0ICdmaWxlJyBAY3VycmVudEZpbGUgIyBkaWZmYmFyLCBwaWdtZW50cywgLi4uXG5cbiAgICAgICAgcG9zdC5lbWl0ICdkaXJ0eScgQGRpcnR5XG5cbiAgICBjdXJyZW50RGlyOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQGN1cnJlbnRGaWxlPyBhbmQgc2xhc2guZmlsZUV4aXN0cyBAY3VycmVudEZpbGVcbiAgICAgICAgICAgIHNsYXNoLmRpciBAY3VycmVudEZpbGVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc2xhc2gucGF0aCBwcm9jZXNzLmN3ZCgpXG4gICAgICAgIFxuICAgIHJlc3RvcmVGcm9tVGFiU3RhdGU6ICh0YWJTdGF0ZSkgLT5cblxuICAgICAgICByZXR1cm4ga2Vycm9yIFwibm8gdGFiU3RhdGUuZmlsZT9cIiBpZiBub3QgdGFiU3RhdGUuZmlsZT9cbiAgICAgICAgQHNldEN1cnJlbnRGaWxlIHRhYlN0YXRlLmZpbGUsIHRhYlN0YXRlLnN0YXRlXG5cbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgICAwMDAgMDAwICAgMDAwICAgMDAwICAwMDBcbiAgICAjICAgIDAwMCAgICAgICAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMFxuICAgICMgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMDBcblxuICAgIHNoZWJhbmdGaWxlVHlwZTogLT5cblxuICAgICAgICBmaWxlVHlwZSA9IFN5bnRheC5zaGViYW5nIEBsaW5lKDApIGlmIEBudW1MaW5lcygpXG4gICAgICAgIGlmIGZpbGVUeXBlID09ICd0eHQnXG4gICAgICAgICAgICBpZiBAY3VycmVudEZpbGU/XG4gICAgICAgICAgICAgICAgZXh0ID0gc2xhc2guZXh0IEBjdXJyZW50RmlsZVxuICAgICAgICAgICAgICAgIGlmIGV4dCBpbiBTeW50YXguc3ludGF4TmFtZXNcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4dFxuICAgICAgICBlbHNlIGlmIGZpbGVUeXBlXG4gICAgICAgICAgICByZXR1cm4gZmlsZVR5cGVcblxuICAgICAgICBzdXBlcigpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwXG5cbiAgICBvbkNvbW1hbmRsaW5lOiAoZSkgPT5cblxuICAgICAgICBzd2l0Y2ggZVxuICAgICAgICAgICAgd2hlbiAnaGlkZGVuJyAnc2hvd24nXG4gICAgICAgICAgICAgICAgZCA9IHdpbmRvdy5zcGxpdC5jb21tYW5kbGluZUhlaWdodCArIHdpbmRvdy5zcGxpdC5oYW5kbGVIZWlnaHRcbiAgICAgICAgICAgICAgICBkID0gTWF0aC5taW4gZCwgQHNjcm9sbC5zY3JvbGxNYXggLSBAc2Nyb2xsLnNjcm9sbFxuICAgICAgICAgICAgICAgIGQgKj0gLTEgaWYgZSA9PSAnaGlkZGVuJ1xuICAgICAgICAgICAgICAgIEBzY3JvbGwuYnkgZFxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAwMDAwMFxuXG4gICAgc2F2ZVNjcm9sbEN1cnNvcnNBbmRTZWxlY3Rpb25zOiAob3B0KSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGN1cnJlbnRGaWxlXG4gICAgICAgIHMgPSB7fVxuXG4gICAgICAgIHMubWFpbiAgICAgICA9IEBzdGF0ZS5tYWluKClcbiAgICAgICAgcy5jdXJzb3JzICAgID0gQHN0YXRlLmN1cnNvcnMoKSAgICBpZiBAbnVtQ3Vyc29ycygpID4gMSBvciBAY3Vyc29yUG9zKClbMF0gb3IgQGN1cnNvclBvcygpWzFdXG4gICAgICAgIHMuc2VsZWN0aW9ucyA9IEBzdGF0ZS5zZWxlY3Rpb25zKCkgaWYgQG51bVNlbGVjdGlvbnMoKVxuICAgICAgICBzLmhpZ2hsaWdodHMgPSBAc3RhdGUuaGlnaGxpZ2h0cygpIGlmIEBudW1IaWdobGlnaHRzKClcblxuICAgICAgICBzLnNjcm9sbCA9IEBzY3JvbGwuc2Nyb2xsIGlmIEBzY3JvbGwuc2Nyb2xsXG5cbiAgICAgICAgZmlsZVBvc2l0aW9ucyA9IHdpbmRvdy5zdGFzaC5nZXQgJ2ZpbGVQb3NpdGlvbnMnIE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGZpbGVQb3NpdGlvbnMgb3IgdHlwZW9mKGZpbGVQb3NpdGlvbnMpICE9ICdvYmplY3QnXG4gICAgICAgICAgICBmaWxlUG9zaXRpb25zID0gT2JqZWN0LmNyZWF0ZSBudWxsXG4gICAgICAgICAgICBcbiAgICAgICAgZmlsZVBvc2l0aW9uc1tAY3VycmVudEZpbGVdID0gc1xuICAgICAgICB3aW5kb3cuc3Rhc2guc2V0ICdmaWxlUG9zaXRpb25zJyBmaWxlUG9zaXRpb25zXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuXG4gICAgcmVzdG9yZVNjcm9sbEN1cnNvcnNBbmRTZWxlY3Rpb25zOiAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGN1cnJlbnRGaWxlXG4gICAgICAgIFxuICAgICAgICBmaWxlUG9zaXRpb25zID0gd2luZG93LnN0YXNoLmdldCAnZmlsZVBvc2l0aW9ucycge31cblxuICAgICAgICBpZiBmaWxlUG9zaXRpb25zW0BjdXJyZW50RmlsZV0/XG5cbiAgICAgICAgICAgIHMgPSBmaWxlUG9zaXRpb25zW0BjdXJyZW50RmlsZV1cblxuICAgICAgICAgICAgY3Vyc29ycyA9IHMuY3Vyc29ycyA/IFtbMCwwXV1cbiAgICAgICAgICAgIGN1cnNvcnMgPSBjdXJzb3JzLm1hcCAoYykgPT4gW2NbMF0sIGNsYW1wKDAsQG51bUxpbmVzKCktMSxjWzFdKV1cblxuICAgICAgICAgICAgQHNldEN1cnNvcnMgICAgY3Vyc29yc1xuICAgICAgICAgICAgQHNldFNlbGVjdGlvbnMgcy5zZWxlY3Rpb25zID8gW11cbiAgICAgICAgICAgIEBzZXRIaWdobGlnaHRzIHMuaGlnaGxpZ2h0cyA/IFtdXG4gICAgICAgICAgICBAc2V0TWFpbiAgICAgICBzLm1haW4gPyAwXG4gICAgICAgICAgICBAc2V0U3RhdGUgQHN0YXRlXG5cbiAgICAgICAgICAgIEBzY3JvbGwudG8gcy5zY3JvbGwgaWYgcy5zY3JvbGxcbiAgICAgICAgICAgIEBzY3JvbGwuY3Vyc29ySW50b1ZpZXcoKVxuXG4gICAgICAgIGVsc2VcblxuICAgICAgICAgICAgQHNpbmdsZUN1cnNvckF0UG9zIFswLDBdXG4gICAgICAgICAgICBAc2Nyb2xsLnRvcCA9IDAgaWYgQG1haW5DdXJzb3IoKVsxXSA9PSAwXG4gICAgICAgICAgICBAc2Nyb2xsLmJvdCA9IEBzY3JvbGwudG9wLTFcbiAgICAgICAgICAgIEBzY3JvbGwudG8gMFxuICAgICAgICAgICAgQHNjcm9sbC5jdXJzb3JJbnRvVmlldygpXG5cbiAgICAgICAgQHVwZGF0ZUxheWVycygpXG4gICAgICAgIEBudW1iZXJzPy51cGRhdGVDb2xvcnMoKVxuICAgICAgICBAbWluaW1hcC5vbkVkaXRvclNjcm9sbCgpXG4gICAgICAgIEBlbWl0ICdjdXJzb3InXG4gICAgICAgIEBlbWl0ICdzZWxlY3Rpb24nXG5cbiAgICAjICAgICAgIDAwMCAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMDAwMDAwXG4gICAgIyAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMFxuXG4gICAganVtcFRvRmlsZTogKG9wdCkgPT5cblxuICAgICAgICB3aW5kb3cudGFicy5hY3RpdmVUYWIgdHJ1ZVxuXG4gICAgICAgIGlmIG9wdC5uZXdUYWJcblxuICAgICAgICAgICAgZmlsZSA9IG9wdC5maWxlXG4gICAgICAgICAgICBmaWxlICs9ICc6JyArIG9wdC5saW5lIGlmIG9wdC5saW5lXG4gICAgICAgICAgICBmaWxlICs9ICc6JyArIG9wdC5jb2wgaWYgb3B0LmNvbFxuICAgICAgICAgICAgcG9zdC5lbWl0ICduZXdUYWJXaXRoRmlsZScgZmlsZVxuXG4gICAgICAgIGVsc2VcblxuICAgICAgICAgICAgW2ZpbGUsIGZwb3NdID0gc2xhc2guc3BsaXRGaWxlUG9zIG9wdC5maWxlXG4gICAgICAgICAgICBvcHQucG9zID0gZnBvc1xuICAgICAgICAgICAgb3B0LnBvc1swXSA9IG9wdC5jb2wgaWYgb3B0LmNvbFxuICAgICAgICAgICAgb3B0LnBvc1sxXSA9IG9wdC5saW5lLTEgaWYgb3B0LmxpbmVcbiAgICAgICAgICAgIG9wdC53aW5JRCAgPSB3aW5kb3cud2luSURcblxuICAgICAgICAgICAgb3B0Lm9sZFBvcyA9IEBjdXJzb3JQb3MoKVxuICAgICAgICAgICAgb3B0Lm9sZEZpbGUgPSBAY3VycmVudEZpbGVcbiAgICAgICAgICAgIHdpbmRvdy5uYXZpZ2F0ZS5nb3RvRmlsZVBvcyBvcHRcblxuICAgIGp1bXBUbzogKHdvcmQsIG9wdCkgPT5cblxuICAgICAgICBpZiB0eXBlb2Yod29yZCkgPT0gJ29iamVjdCcgYW5kIG5vdCBvcHQ/XG4gICAgICAgICAgICBvcHQgID0gd29yZFxuICAgICAgICAgICAgd29yZCA9IG9wdC53b3JkXG5cbiAgICAgICAgb3B0ID89IHt9XG5cbiAgICAgICAgaWYgb3B0LmZpbGU/XG4gICAgICAgICAgICBAanVtcFRvRmlsZSBvcHRcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciAnbm90aGluZyB0byBqdW1wIHRvPycgaWYgZW1wdHkgd29yZFxuXG4gICAgICAgIGZpbmQgPSB3b3JkLnRvTG93ZXJDYXNlKCkudHJpbSgpXG4gICAgICAgIGZpbmQgPSBmaW5kLnNsaWNlIDEgaWYgZmluZFswXSA9PSAnQCdcblxuICAgICAgICByZXR1cm4ga2Vycm9yICdGaWxlRWRpdG9yLmp1bXBUbyAtLSBub3RoaW5nIHRvIGZpbmQ/JyBpZiBlbXB0eSBmaW5kXG5cbiAgICAgICAgdHlwZSA9IG9wdD8udHlwZVxuXG4gICAgICAgIGlmIG5vdCB0eXBlIG9yIHR5cGUgPT0gJ2NsYXNzJ1xuICAgICAgICAgICAgY2xhc3NlcyA9IHBvc3QuZ2V0ICdpbmRleGVyJyAnY2xhc3NlcydcbiAgICAgICAgICAgIGZvciBjbHNzLCBpbmZvIG9mIGNsYXNzZXNcbiAgICAgICAgICAgICAgICBpZiBjbHNzLnRvTG93ZXJDYXNlKCkgPT0gZmluZFxuICAgICAgICAgICAgICAgICAgICBAanVtcFRvRmlsZSBpbmZvXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAgICAgaWYgbm90IHR5cGUgb3IgdHlwZSA9PSAnZnVuYydcbiAgICAgICAgICAgIGZ1bmNzID0gcG9zdC5nZXQgJ2luZGV4ZXInICdmdW5jcydcbiAgICAgICAgICAgIGZvciBmdW5jLCBpbmZvcyBvZiBmdW5jc1xuICAgICAgICAgICAgICAgIGlmIGZ1bmMudG9Mb3dlckNhc2UoKSA9PSBmaW5kXG4gICAgICAgICAgICAgICAgICAgIGluZm8gPSBpbmZvc1swXVxuICAgICAgICAgICAgICAgICAgICBmb3IgaSBpbiBpbmZvc1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgaS5maWxlID09IEBjdXJyZW50RmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8gPSBpXG4gICAgICAgICAgICAgICAgICAgIEBqdW1wVG9GaWxlIGluZm9cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgICBpZiBub3QgdHlwZSBvciB0eXBlID09ICdmaWxlJ1xuICAgICAgICAgICAgZmlsZXMgPSBwb3N0LmdldCAnaW5kZXhlcicgJ2ZpbGVzJ1xuICAgICAgICAgICAgZm9yIGZpbGUsIGluZm8gb2YgZmlsZXNcbiAgICAgICAgICAgICAgICBpZiBzbGFzaC5iYXNlKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT0gZmluZCBhbmQgZmlsZSAhPSBAY3VycmVudEZpbGVcbiAgICAgICAgICAgICAgICAgICAgQGp1bXBUb0ZpbGUgZmlsZTpmaWxlLCBsaW5lOjZcblxuICAgICAgICB3aW5kb3cuY29tbWFuZGxpbmUuY29tbWFuZHMuc2VhcmNoLnN0YXJ0ICdzZWFyY2gnXG4gICAgICAgIHdpbmRvdy5jb21tYW5kbGluZS5jb21tYW5kcy5zZWFyY2guZXhlY3V0ZSB3b3JkXG5cbiAgICAgICAgd2luZG93LnNwbGl0LmRvICdzaG93IHRlcm1pbmFsJ1xuXG4gICAgICAgIHRydWVcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIGp1bXBUb0NvdW50ZXJwYXJ0OiAoKSAtPlxuXG4gICAgICAgIGNwID0gQGN1cnNvclBvcygpXG4gICAgICAgIGN1cnJleHQgPSBzbGFzaC5leHQgQGN1cnJlbnRGaWxlXG5cbiAgICAgICAgc3dpdGNoIGN1cnJleHRcbiAgICAgICAgICAgIHdoZW4gJ2NvZmZlZScgJ2tvZmZlZSdcbiAgICAgICAgICAgICAgICBbZmlsZSxsaW5lLGNvbF0gPSBzcmNtYXAudG9KcyBAY3VycmVudEZpbGUsIGNwWzFdKzEsIGNwWzBdXG4gICAgICAgICAgICB3aGVuICdqcydcbiAgICAgICAgICAgICAgICBbZmlsZSxsaW5lLGNvbF0gPSBzcmNtYXAudG9Db2ZmZWUgQGN1cnJlbnRGaWxlLCBjcFsxXSsxLCBjcFswXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiB2YWxpZChmaWxlKSBhbmQgc2xhc2guZmlsZUV4aXN0cyBmaWxlXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJyBzbGFzaC5qb2luRmlsZUxpbmUgZmlsZSxsaW5lLGNvbFxuICAgICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgICBjb3VudGVycGFydHMgPVxuICAgICAgICAgICAgY3BwOiAgICAgWydocHAnICdoJ11cbiAgICAgICAgICAgIGNjOiAgICAgIFsnaHBwJyAnaCddXG4gICAgICAgICAgICBoOiAgICAgICBbJ2NwcCcgJ2MnXVxuICAgICAgICAgICAgaHBwOiAgICAgWydjcHAnICdjJ11cbiAgICAgICAgICAgIGNvZmZlZTogIFsnanMnXVxuICAgICAgICAgICAga29mZmVlOiAgWydqcyddXG4gICAgICAgICAgICBqczogICAgICBbJ2NvZmZlZScna29mZmVlJ11cbiAgICAgICAgICAgIHB1ZzogICAgIFsnaHRtbCddXG4gICAgICAgICAgICBodG1sOiAgICBbJ3B1ZyddXG4gICAgICAgICAgICBjc3M6ICAgICBbJ3N0eWwnXVxuICAgICAgICAgICAgc3R5bDogICAgWydjc3MnXVxuXG4gICAgICAgIGZvciBleHQgaW4gKGNvdW50ZXJwYXJ0c1tjdXJyZXh0XSA/IFtdKVxuICAgICAgICAgICAgaWYgc2xhc2guZmlsZUV4aXN0cyBzbGFzaC5zd2FwRXh0IEBjdXJyZW50RmlsZSwgZXh0XG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdsb2FkRmlsZScgc2xhc2guc3dhcEV4dCBAY3VycmVudEZpbGUsIGV4dFxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAgICAgZm9yIGV4dCBpbiAoY291bnRlcnBhcnRzW2N1cnJleHRdID8gW10pXG4gICAgICAgICAgICBjb3VudGVyID0gc2xhc2guc3dhcEV4dCBAY3VycmVudEZpbGUsIGV4dFxuICAgICAgICAgICAgY291bnRlciA9IGNvdW50ZXIucmVwbGFjZSBcIi8je2N1cnJleHR9L1wiIFwiLyN7ZXh0fS9cIlxuICAgICAgICAgICAgaWYgc2xhc2guZmlsZUV4aXN0cyBjb3VudGVyXG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdsb2FkRmlsZScgY291bnRlclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGZhbHNlXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGNlbnRlclRleHQ6IChjZW50ZXIsIGFuaW1hdGU9MzAwKSAtPlxuXG4gICAgICAgIEBzaXplLmNlbnRlclRleHQgPSBjZW50ZXJcbiAgICAgICAgQHVwZGF0ZUxheWVycygpXG5cbiAgICAgICAgQHNpemUub2Zmc2V0WCA9IE1hdGguZmxvb3IgQHNpemUuY2hhcldpZHRoLzIgKyBAc2l6ZS5udW1iZXJzV2lkdGhcbiAgICAgICAgaWYgY2VudGVyXG4gICAgICAgICAgICBiciAgICAgICAgPSBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgICAgdmlzQ29scyAgID0gcGFyc2VJbnQgYnIud2lkdGggLyBAc2l6ZS5jaGFyV2lkdGhcbiAgICAgICAgICAgIG5ld09mZnNldCA9IHBhcnNlSW50IEBzaXplLmNoYXJXaWR0aCAqICh2aXNDb2xzIC0gMTAwKSAvIDJcbiAgICAgICAgICAgIEBzaXplLm9mZnNldFggPSBNYXRoLm1heCBAc2l6ZS5vZmZzZXRYLCBuZXdPZmZzZXRcbiAgICAgICAgICAgIEBzaXplLmNlbnRlclRleHQgPSB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzaXplLmNlbnRlclRleHQgPSBmYWxzZVxuXG4gICAgICAgIEB1cGRhdGVMaW5lUG9zaXRpb25zIGFuaW1hdGVcblxuICAgICAgICBpZiBhbmltYXRlXG4gICAgICAgICAgICBsYXllcnMgPSBbJy5zZWxlY3Rpb25zJyAnLmhpZ2hsaWdodHMnICcuY3Vyc29ycyddXG4gICAgICAgICAgICB0cmFuc2kgPSBbJy5zZWxlY3Rpb24nICAnLmhpZ2hsaWdodCcgICcuY3Vyc29yJyBdLmNvbmNhdCBsYXllcnNcbiAgICAgICAgICAgIHJlc2V0VHJhbnMgPSA9PlxuICAgICAgICAgICAgICAgIHNldFN0eWxlICcuZWRpdG9yIC5sYXllcnMgJytsLCAndHJhbnNmb3JtJyBcInRyYW5zbGF0ZVgoMClcIiBmb3IgbCBpbiBsYXllcnNcbiAgICAgICAgICAgICAgICBzZXRTdHlsZSAnLmVkaXRvciAubGF5ZXJzICcrdCwgJ3RyYW5zaXRpb24nIFwiaW5pdGlhbFwiIGZvciB0IGluIHRyYW5zaVxuICAgICAgICAgICAgICAgIEB1cGRhdGVMYXllcnMoKVxuXG4gICAgICAgICAgICBpZiBjZW50ZXJcbiAgICAgICAgICAgICAgICBvZmZzZXRYID0gQHNpemUub2Zmc2V0WCAtIEBzaXplLm51bWJlcnNXaWR0aCAtIEBzaXplLmNoYXJXaWR0aC8yXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgb2Zmc2V0WCA9IE1hdGguZmxvb3IgQHNpemUuY2hhcldpZHRoLzIgKyBAc2l6ZS5udW1iZXJzV2lkdGhcbiAgICAgICAgICAgICAgICBvZmZzZXRYIC09IEBzaXplLm51bWJlcnNXaWR0aCArIEBzaXplLmNoYXJXaWR0aC8yXG4gICAgICAgICAgICAgICAgb2Zmc2V0WCAqPSAtMVxuXG4gICAgICAgICAgICBzZXRTdHlsZSAnLmVkaXRvciAubGF5ZXJzICcrbCwgJ3RyYW5zZm9ybScgXCJ0cmFuc2xhdGVYKCN7b2Zmc2V0WH1weClcIiBmb3IgbCBpbiBsYXllcnNcbiAgICAgICAgICAgIHNldFN0eWxlICcuZWRpdG9yIC5sYXllcnMgJyt0LCAndHJhbnNpdGlvbicgXCJhbGwgI3thbmltYXRlLzEwMDB9c1wiIGZvciB0IGluIHRyYW5zaVxuICAgICAgICAgICAgc2V0VGltZW91dCByZXNldFRyYW5zLCBhbmltYXRlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB1cGRhdGVMYXllcnMoKVxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwXG5cbiAgICBvbkNvbnRleHRNZW51OiAoZXZlbnQpID0+IHN0b3BFdmVudCBldmVudCwgQHNob3dDb250ZXh0TWVudSBrcG9zIGV2ZW50XG5cbiAgICBzaG93Q29udGV4dE1lbnU6IChhYnNQb3MpID0+XG5cbiAgICAgICAgaWYgbm90IGFic1Bvcz9cbiAgICAgICAgICAgIGFic1BvcyA9IGtwb3MgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCwgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG5cbiAgICAgICAgb3B0ID0gaXRlbXM6IFtcbiAgICAgICAgICAgIHRleHQ6ICAgJ0Jyb3dzZSdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2NvbW1hbmQrLidcbiAgICAgICAgICAgIGFjY2VsOiAgJ2N0cmwrLidcbiAgICAgICAgICAgIGNiOiAgICAgLT4gd2luZG93LmNvbW1hbmRsaW5lLnN0YXJ0Q29tbWFuZCAnYnJvd3NlJ1xuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdCYWNrJ1xuICAgICAgICAgICAgY29tYm86ICAnY29tbWFuZCsxJ1xuICAgICAgICAgICAgY2I6ICAgICAtPiBwb3N0LmVtaXQgJ21lbnVBY3Rpb24nICdOYXZpZ2F0ZSBCYWNrd2FyZCdcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnJ1xuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdNYXhpbWl6ZSdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2NvbW1hbmQrc2hpZnQreSdcbiAgICAgICAgICAgIGFjY2VsOiAgJ2N0cmwrc2hpZnQreSdcbiAgICAgICAgICAgIGNiOiAgICAgLT4gd2luZG93LnNwbGl0Lm1heGltaXplRWRpdG9yKClcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnJ1xuICAgICAgICBdXG5cbiAgICAgICAgb3B0Lml0ZW1zID0gb3B0Lml0ZW1zLmNvbmNhdCB3aW5kb3cudGl0bGViYXIubWVudVRlbXBsYXRlKClcblxuICAgICAgICBSZWNlbnRNZW51ID0gW11cbiAgICAgICAgXG4gICAgICAgIGZpbGVTcGFuID0gKGYpIC0+XG4gICAgICAgICAgICBpZiBmP1xuICAgICAgICAgICAgICAgIHNwYW4gID0gU3ludGF4LnNwYW5Gb3JUZXh0QW5kU3ludGF4IHNsYXNoLnRpbGRlKHNsYXNoLmRpcihmKSksICdicm93c2VyJ1xuICAgICAgICAgICAgICAgIHNwYW4gKz0gU3ludGF4LnNwYW5Gb3JUZXh0QW5kU3ludGF4ICcvJyArIHNsYXNoLmJhc2UoZiksICdicm93c2VyJ1xuICAgICAgICAgICAgcmV0dXJuIHNwYW5cbiAgICAgICAgXG4gICAgICAgIHJlY2VudCA9IHdpbmRvdy5zdGF0ZT8uZ2V0ICdyZWNlbnRGaWxlcycgW11cbiAgICAgICAgcmVjZW50ID89IFtdXG4gICAgICAgIGZvciBmIGluIHJlY2VudFxuICAgICAgICAgICAgaWYgZnMuZXhpc3RzU3luYyBmXG4gICAgICAgICAgICAgICAgUmVjZW50TWVudS51bnNoaWZ0XG4gICAgICAgICAgICAgICAgICAgIGh0bWw6IGZpbGVTcGFuIGZcbiAgICAgICAgICAgICAgICAgICAgYXJnOiBmXG4gICAgICAgICAgICAgICAgICAgIGNiOiAoYXJnKSAtPiBwb3N0LmVtaXQgJ25ld1RhYldpdGhGaWxlJyBhcmdcbiAgICAgICAgXG4gICAgICAgIGdldE1lbnUgPSAodGVtcGxhdGUsIG5hbWUpIC0+XG4gICAgICAgICAgICBmb3IgaXRlbSBpbiB0ZW1wbGF0ZVxuICAgICAgICAgICAgICAgIGlmIGl0ZW0udGV4dCA9PSBuYW1lXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBSZWNlbnRNZW51Lmxlbmd0aFxuICAgICAgICAgICAgUmVjZW50TWVudS5wdXNoIHRleHQ6ICcnXG4gICAgICAgICAgICBSZWNlbnRNZW51LnB1c2ggdGV4dDogJ0NsZWFyIExpc3QnXG4gICAgICAgICAgICBmaWxlTWVudSA9IGdldE1lbnUgb3B0Lml0ZW1zLCAnRmlsZSdcbiAgICAgICAgICAgIGZpbGVNZW51Lm1lbnUgPSBbe3RleHQ6J1JlY2VudCcgbWVudTpSZWNlbnRNZW51fSwge3RleHQ6Jyd9XS5jb25jYXQgZmlsZU1lbnUubWVudVxuICAgICAgICBcbiAgICAgICAgb3B0LnggPSBhYnNQb3MueFxuICAgICAgICBvcHQueSA9IGFic1Bvcy55XG4gICAgICAgIHBvcHVwLm1lbnUgb3B0XG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY2xpY2tBdFBvczogKHAsIGV2ZW50KSAtPlxuXG4gICAgICAgIGlmIGV2ZW50Lm1ldGFLZXlcbiAgICAgICAgICAgIGlmIGtwb3MoZXZlbnQpLnggPD0gQHNpemUubnVtYmVyc1dpZHRoXG4gICAgICAgICAgICAgICAgQHNpbmdsZUN1cnNvckF0UG9zIHBcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBzdXBlciBwLCBldmVudFxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMFxuXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9DaGFyRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50KSAtPlxuXG4gICAgICAgIHJldHVybiBpZiAndW5oYW5kbGVkJyAhPSBzdXBlciBtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50XG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnYWx0K2N0cmwrZW50ZXInICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5jb21tYW5kbGluZS5jb21tYW5kcy5jb2ZmZWUuZXhlY3V0ZVRleHQgQHRleHRPZlNlbGVjdGlvbkZvckNsaXBib2FyZCgpXG4gICAgICAgICAgICB3aGVuICdhbHQrY3RybCtzaGlmdCtlbnRlcicgdGhlbiByZXR1cm4gd2luZG93LmNvbW1hbmRsaW5lLmNvbW1hbmRzLmNvZmZlZS5leGVjdXRlVGV4dEluTWFpbiBAdGV4dE9mU2VsZWN0aW9uRm9yQ2xpcGJvYXJkdCgpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2FsdCt1cCcgJ2FsdCtvJyB0aGVuIHJldHVybiBAanVtcFRvQ291bnRlcnBhcnQoKVxuICAgICAgICAgICAgd2hlbiAnZXNjJ1xuICAgICAgICAgICAgICAgIHNwbGl0ID0gd2luZG93LnNwbGl0XG4gICAgICAgICAgICAgICAgaWYgc3BsaXQudGVybWluYWxWaXNpYmxlKClcbiAgICAgICAgICAgICAgICAgICAgc3BsaXQuaGlkZVRlcm1pbmFsKClcbiAgICAgICAgICAgICAgICBlbHNlIGlmIHNwbGl0LmNvbW1hbmRsaW5lVmlzaWJsZSgpXG4gICAgICAgICAgICAgICAgICAgIHNwbGl0LmhpZGVDb21tYW5kbGluZSgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICd1bmhhbmRsZWQnXG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZUVkaXRvclxuIl19
//# sourceURL=../../coffee/editor/fileeditor.coffee