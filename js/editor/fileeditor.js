// koffee 1.19.0

/*
00000000  000  000      00000000        00000000  0000000    000  000000000   0000000   00000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000000    000  000      0000000         0000000   000   000  000     000     000   000  0000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000       000  0000000  00000000        00000000  0000000    000     000      0000000   000   000
 */
var FileEditor, Syntax, TextEditor, clamp, electron, empty, fs, kerror, klog, kpos, popup, post, ref, setStyle, slash, srcmap, stopEvent, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = Object.hasOwn,
    indexOf = [].indexOf;

ref = require('kxk'), clamp = ref.clamp, empty = ref.empty, fs = ref.fs, kerror = ref.kerror, klog = ref.klog, kpos = ref.kpos, popup = ref.popup, post = ref.post, setStyle = ref.setStyle, slash = ref.slash, srcmap = ref.srcmap, stopEvent = ref.stopEvent, valid = ref.valid;

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
        klog('setCurrentFile', file);
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
        if (this.numSelections() && this.numSelections() < 10) {
            s.selections = this.state.selections();
        }
        if (this.numHighlights() && this.numHighlights() < 10) {
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
        } else if (window.lastFocus === 'editor') {
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
        } else {
            file = slash.joinFileLine(opt.file, opt.line, opt.col);
            return post.emit('loadFile', file);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvZWRpdG9yIiwic291cmNlcyI6WyJmaWxlZWRpdG9yLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSwySUFBQTtJQUFBOzs7OztBQVFBLE1BQW1HLE9BQUEsQ0FBUSxLQUFSLENBQW5HLEVBQUUsaUJBQUYsRUFBUyxpQkFBVCxFQUFnQixXQUFoQixFQUFvQixtQkFBcEIsRUFBNEIsZUFBNUIsRUFBa0MsZUFBbEMsRUFBd0MsaUJBQXhDLEVBQStDLGVBQS9DLEVBQXFELHVCQUFyRCxFQUErRCxpQkFBL0QsRUFBc0UsbUJBQXRFLEVBQThFLHlCQUE5RSxFQUF5Rjs7QUFFekYsVUFBQSxHQUFhLE9BQUEsQ0FBUSxjQUFSOztBQUNiLE1BQUEsR0FBYSxPQUFBLENBQVEsVUFBUjs7QUFDYixRQUFBLEdBQWEsT0FBQSxDQUFRLFVBQVI7O0FBRVA7OztJQUVDLG9CQUFDLFFBQUQ7Ozs7OztRQUVDLDRDQUFNLFFBQU4sRUFDSTtZQUFBLFFBQUEsRUFBVSxDQUNOLFNBRE0sRUFFTixXQUZNLEVBR04sU0FITSxFQUlOLFNBSk0sRUFLTixNQUxNLEVBTU4sY0FOTSxFQU9OLFVBUE0sRUFRTixTQVJNLEVBU04sWUFUTSxDQUFWO1lBV0EsUUFBQSxFQUFVLEVBWFY7U0FESjtRQWNBLElBQUMsQ0FBQSxXQUFELEdBQWU7UUFFZixJQUFDLENBQUEsSUFBSSxDQUFDLGdCQUFOLENBQXVCLGFBQXZCLEVBQXFDLElBQUMsQ0FBQSxhQUF0QztRQUVBLElBQUksQ0FBQyxFQUFMLENBQVEsYUFBUixFQUF3QixJQUFDLENBQUEsYUFBekI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFFBQVIsRUFBd0IsSUFBQyxDQUFBLE1BQXpCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxZQUFSLEVBQXdCLElBQUMsQ0FBQSxVQUF6QjtRQUVBLElBQUMsQ0FBQSxZQUFELENBQUE7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MDAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgY2xhbXAsIGVtcHR5LCBmcywga2Vycm9yLCBrbG9nLCBrcG9zLCBwb3B1cCwgcG9zdCwgc2V0U3R5bGUsIHNsYXNoLCBzcmNtYXAsIHN0b3BFdmVudCwgdmFsaWQgfSA9IHJlcXVpcmUgJ2t4aydcblxuVGV4dEVkaXRvciA9IHJlcXVpcmUgJy4vdGV4dGVkaXRvcidcblN5bnRheCAgICAgPSByZXF1aXJlICcuL3N5bnRheCdcbmVsZWN0cm9uICAgPSByZXF1aXJlICdlbGVjdHJvbidcblxuY2xhc3MgRmlsZUVkaXRvciBleHRlbmRzIFRleHRFZGl0b3JcblxuICAgIEA6ICh2aWV3RWxlbSkgLT5cblxuICAgICAgICBzdXBlciB2aWV3RWxlbSxcbiAgICAgICAgICAgIGZlYXR1cmVzOiBbXG4gICAgICAgICAgICAgICAgJ0RpZmZiYXInXG4gICAgICAgICAgICAgICAgJ1Njcm9sbGJhcidcbiAgICAgICAgICAgICAgICAnTnVtYmVycydcbiAgICAgICAgICAgICAgICAnTWluaW1hcCdcbiAgICAgICAgICAgICAgICAnTWV0YSdcbiAgICAgICAgICAgICAgICAnQXV0b2NvbXBsZXRlJ1xuICAgICAgICAgICAgICAgICdCcmFja2V0cydcbiAgICAgICAgICAgICAgICAnU3RyaW5ncydcbiAgICAgICAgICAgICAgICAnQ3Vyc29yTGluZSdcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBmb250U2l6ZTogMTlcblxuICAgICAgICBAY3VycmVudEZpbGUgPSBudWxsXG5cbiAgICAgICAgQHZpZXcuYWRkRXZlbnRMaXN0ZW5lciAnY29udGV4dG1lbnUnIEBvbkNvbnRleHRNZW51XG5cbiAgICAgICAgcG9zdC5vbiAnY29tbWFuZGxpbmUnICAgQG9uQ29tbWFuZGxpbmVcbiAgICAgICAgcG9zdC5vbiAnanVtcFRvJyAgICAgICAgQGp1bXBUb1xuICAgICAgICBwb3N0Lm9uICdqdW1wVG9GaWxlJyAgICBAanVtcFRvRmlsZVxuXG4gICAgICAgIEBpbml0UGlnbWVudHMoKVxuICAgICAgICBAaW5pdEludmlzaWJsZXMoKVxuICAgICAgICBcbiAgICAgICAgQHNldFRleHQgJydcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBjaGFuZ2VkOiAoY2hhbmdlSW5mbykgLT5cblxuICAgICAgICBzdXBlciBjaGFuZ2VJbmZvXG4gICAgICAgIFxuICAgICAgICBpZiBjaGFuZ2VJbmZvLmNoYW5nZXMubGVuZ3RoXG4gICAgICAgICAgICBkaXJ0eSA9IEBkby5oYXNDaGFuZ2VzKClcbiAgICAgICAgICAgIGlmIEBkaXJ0eSAhPSBkaXJ0eVxuICAgICAgICAgICAgICAgIEBkaXJ0eSA9IGRpcnR5XG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdkaXJ0eScgQGRpcnR5XG5cbiAgICAjIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIGNsZWFyOiAtPlxuXG4gICAgICAgIEBkaXJ0eSA9IGZhbHNlXG4gICAgICAgIEBzZXRTYWx0ZXJNb2RlIGZhbHNlXG4gICAgICAgIEBkaWZmYmFyPy5jbGVhcigpXG4gICAgICAgIEBtZXRhPy5jbGVhcigpXG4gICAgICAgIEBzZXRMaW5lcyBbJyddXG4gICAgICAgIEBkby5yZXNldCgpXG5cbiAgICBzZXRDdXJyZW50RmlsZTogKGZpbGUsIHJlc3RvcmVTdGF0ZSkgLT5cblxuICAgICAgICBrbG9nICdzZXRDdXJyZW50RmlsZScgZmlsZVxuICAgICAgICBAY2xlYXIoKVxuICAgICAgICBcbiAgICAgICAgQGN1cnJlbnRGaWxlID0gZmlsZVxuXG4gICAgICAgIEBzZXR1cEZpbGVUeXBlKClcblxuICAgICAgICBmaWxlRXhpc3RzID0gQGN1cnJlbnRGaWxlPyBhbmQgc2xhc2guZmlsZUV4aXN0cyBAY3VycmVudEZpbGVcblxuICAgICAgICBpZiByZXN0b3JlU3RhdGVcbiAgICAgICAgICAgIEBzZXRUZXh0IHJlc3RvcmVTdGF0ZS50ZXh0KClcbiAgICAgICAgICAgIEBzdGF0ZSA9IHJlc3RvcmVTdGF0ZVxuICAgICAgICAgICAgQGRpcnR5ID0gdHJ1ZVxuICAgICAgICBlbHNlIGlmIGZpbGVFeGlzdHNcbiAgICAgICAgICAgIEBzZXRUZXh0IHNsYXNoLnJlYWRUZXh0IEBjdXJyZW50RmlsZVxuXG4gICAgICAgIGlmIGZpbGVFeGlzdHNcbiAgICAgICAgICAgIHdpbmRvdy50YWJzLmFjdGl2ZVRhYigpPy5zZXRGaWxlIEBjdXJyZW50RmlsZVxuICAgICAgICAgICAgXG4gICAgICAgIHBvc3QuZW1pdCAnZmlsZScgQGN1cnJlbnRGaWxlICMgYnJvd3NlciAmIHNoZWxmXG5cbiAgICAgICAgQGVtaXQgJ2ZpbGUnIEBjdXJyZW50RmlsZSAjIGRpZmZiYXIsIHBpZ21lbnRzLCAuLi5cblxuICAgICAgICBwb3N0LmVtaXQgJ2RpcnR5JyBAZGlydHlcblxuICAgIGN1cnJlbnREaXI6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAY3VycmVudEZpbGU/IGFuZCBzbGFzaC5maWxlRXhpc3RzIEBjdXJyZW50RmlsZVxuICAgICAgICAgICAgc2xhc2guZGlyIEBjdXJyZW50RmlsZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzbGFzaC5wYXRoIHByb2Nlc3MuY3dkKClcbiAgICAgICAgXG4gICAgcmVzdG9yZUZyb21UYWJTdGF0ZTogKHRhYlN0YXRlKSAtPlxuXG4gICAgICAgIHJldHVybiBrZXJyb3IgXCJubyB0YWJTdGF0ZS5maWxlP1wiIGlmIG5vdCB0YWJTdGF0ZS5maWxlP1xuICAgICAgICBAc2V0Q3VycmVudEZpbGUgdGFiU3RhdGUuZmlsZSwgdGFiU3RhdGUuc3RhdGVcblxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgIDAwMCAwMDAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgICAgMDAwICAgICAgIDAwMDAwICAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAwMDAwMFxuXG4gICAgc2hlYmFuZ0ZpbGVUeXBlOiAtPlxuXG4gICAgICAgIGZpbGVUeXBlID0gU3ludGF4LnNoZWJhbmcgQGxpbmUoMCkgaWYgQG51bUxpbmVzKClcbiAgICAgICAgaWYgZmlsZVR5cGUgPT0gJ3R4dCdcbiAgICAgICAgICAgIGlmIEBjdXJyZW50RmlsZT9cbiAgICAgICAgICAgICAgICBleHQgPSBzbGFzaC5leHQgQGN1cnJlbnRGaWxlXG4gICAgICAgICAgICAgICAgaWYgZXh0IGluIFN5bnRheC5zeW50YXhOYW1lc1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXh0XG4gICAgICAgIGVsc2UgaWYgZmlsZVR5cGVcbiAgICAgICAgICAgIHJldHVybiBmaWxlVHlwZVxuXG4gICAgICAgIHN1cGVyKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcblxuICAgIG9uQ29tbWFuZGxpbmU6IChlKSA9PlxuXG4gICAgICAgIHN3aXRjaCBlXG4gICAgICAgICAgICB3aGVuICdoaWRkZW4nICdzaG93bidcbiAgICAgICAgICAgICAgICBkID0gd2luZG93LnNwbGl0LmNvbW1hbmRsaW5lSGVpZ2h0ICsgd2luZG93LnNwbGl0LmhhbmRsZUhlaWdodFxuICAgICAgICAgICAgICAgIGQgPSBNYXRoLm1pbiBkLCBAc2Nyb2xsLnNjcm9sbE1heCAtIEBzY3JvbGwuc2Nyb2xsXG4gICAgICAgICAgICAgICAgZCAqPSAtMSBpZiBlID09ICdoaWRkZW4nXG4gICAgICAgICAgICAgICAgQHNjcm9sbC5ieSBkXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMDAwMDAwXG5cbiAgICBzYXZlU2Nyb2xsQ3Vyc29yc0FuZFNlbGVjdGlvbnM6IChvcHQpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY3VycmVudEZpbGVcbiAgICAgICAgcyA9IHt9XG5cbiAgICAgICAgcy5tYWluICAgICAgID0gQHN0YXRlLm1haW4oKVxuICAgICAgICBzLmN1cnNvcnMgICAgPSBAc3RhdGUuY3Vyc29ycygpICAgIGlmIEBudW1DdXJzb3JzKCkgPiAxIG9yIEBjdXJzb3JQb3MoKVswXSBvciBAY3Vyc29yUG9zKClbMV1cbiAgICAgICAgcy5zZWxlY3Rpb25zID0gQHN0YXRlLnNlbGVjdGlvbnMoKSBpZiBAbnVtU2VsZWN0aW9ucygpIGFuZCBAbnVtU2VsZWN0aW9ucygpIDwgMTBcbiAgICAgICAgcy5oaWdobGlnaHRzID0gQHN0YXRlLmhpZ2hsaWdodHMoKSBpZiBAbnVtSGlnaGxpZ2h0cygpIGFuZCBAbnVtSGlnaGxpZ2h0cygpIDwgMTBcblxuICAgICAgICBzLnNjcm9sbCA9IEBzY3JvbGwuc2Nyb2xsIGlmIEBzY3JvbGwuc2Nyb2xsXG5cbiAgICAgICAgZmlsZVBvc2l0aW9ucyA9IHdpbmRvdy5zdGFzaC5nZXQgJ2ZpbGVQb3NpdGlvbnMnIE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGZpbGVQb3NpdGlvbnMgb3IgdHlwZW9mKGZpbGVQb3NpdGlvbnMpICE9ICdvYmplY3QnXG4gICAgICAgICAgICBmaWxlUG9zaXRpb25zID0gT2JqZWN0LmNyZWF0ZSBudWxsXG4gICAgICAgICAgICBcbiAgICAgICAgZmlsZVBvc2l0aW9uc1tAY3VycmVudEZpbGVdID0gc1xuICAgICAgICB3aW5kb3cuc3Rhc2guc2V0ICdmaWxlUG9zaXRpb25zJyBmaWxlUG9zaXRpb25zXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuXG4gICAgcmVzdG9yZVNjcm9sbEN1cnNvcnNBbmRTZWxlY3Rpb25zOiAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGN1cnJlbnRGaWxlXG4gICAgICAgIFxuICAgICAgICBmaWxlUG9zaXRpb25zID0gd2luZG93LnN0YXNoLmdldCAnZmlsZVBvc2l0aW9ucycge31cblxuICAgICAgICBpZiBmaWxlUG9zaXRpb25zW0BjdXJyZW50RmlsZV0/XG5cbiAgICAgICAgICAgIHMgPSBmaWxlUG9zaXRpb25zW0BjdXJyZW50RmlsZV1cblxuICAgICAgICAgICAgY3Vyc29ycyA9IHMuY3Vyc29ycyA/IFtbMCwwXV1cbiAgICAgICAgICAgIGN1cnNvcnMgPSBjdXJzb3JzLm1hcCAoYykgPT4gW2NbMF0sIGNsYW1wKDAsQG51bUxpbmVzKCktMSxjWzFdKV1cblxuICAgICAgICAgICAgQHNldEN1cnNvcnMgICAgY3Vyc29yc1xuICAgICAgICAgICAgQHNldFNlbGVjdGlvbnMgcy5zZWxlY3Rpb25zID8gW11cbiAgICAgICAgICAgIEBzZXRIaWdobGlnaHRzIHMuaGlnaGxpZ2h0cyA/IFtdXG4gICAgICAgICAgICBAc2V0TWFpbiAgICAgICBzLm1haW4gPyAwXG4gICAgICAgICAgICBAc2V0U3RhdGUgQHN0YXRlXG5cbiAgICAgICAgICAgIEBzY3JvbGwudG8gcy5zY3JvbGwgaWYgcy5zY3JvbGxcbiAgICAgICAgICAgIEBzY3JvbGwuY3Vyc29ySW50b1ZpZXcoKVxuXG4gICAgICAgIGVsc2VcblxuICAgICAgICAgICAgQHNpbmdsZUN1cnNvckF0UG9zIFswLDBdXG4gICAgICAgICAgICBAc2Nyb2xsLnRvcCA9IDAgaWYgQG1haW5DdXJzb3IoKVsxXSA9PSAwXG4gICAgICAgICAgICBAc2Nyb2xsLmJvdCA9IEBzY3JvbGwudG9wLTFcbiAgICAgICAgICAgIEBzY3JvbGwudG8gMFxuICAgICAgICAgICAgQHNjcm9sbC5jdXJzb3JJbnRvVmlldygpXG5cbiAgICAgICAgQHVwZGF0ZUxheWVycygpXG4gICAgICAgIEBudW1iZXJzPy51cGRhdGVDb2xvcnMoKVxuICAgICAgICBAbWluaW1hcC5vbkVkaXRvclNjcm9sbCgpXG4gICAgICAgIEBlbWl0ICdjdXJzb3InXG4gICAgICAgIEBlbWl0ICdzZWxlY3Rpb24nXG5cbiAgICAjICAgICAgIDAwMCAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMDAwMDAwXG4gICAgIyAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMFxuXG4gICAganVtcFRvRmlsZTogKG9wdCkgPT5cblxuICAgICAgICAjIGtsb2cgJ2p1bXBUb0ZpbGUnIG9wdFxuICAgICAgICBcbiAgICAgICAgd2luZG93LnRhYnMuYWN0aXZlVGFiIHRydWVcblxuICAgICAgICBpZiBvcHQubmV3VGFiXG5cbiAgICAgICAgICAgIGZpbGUgPSBvcHQuZmlsZVxuICAgICAgICAgICAgZmlsZSArPSAnOicgKyBvcHQubGluZSBpZiBvcHQubGluZVxuICAgICAgICAgICAgZmlsZSArPSAnOicgKyBvcHQuY29sIGlmIG9wdC5jb2xcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnbmV3VGFiV2l0aEZpbGUnIGZpbGVcblxuICAgICAgICBlbHNlIGlmIHdpbmRvdy5sYXN0Rm9jdXMgPT0gJ2VkaXRvcidcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgW2ZpbGUsIGZwb3NdID0gc2xhc2guc3BsaXRGaWxlUG9zIG9wdC5maWxlXG4gICAgICAgICAgICBvcHQucG9zID0gZnBvc1xuICAgICAgICAgICAgb3B0LnBvc1swXSA9IG9wdC5jb2wgaWYgb3B0LmNvbFxuICAgICAgICAgICAgb3B0LnBvc1sxXSA9IG9wdC5saW5lLTEgaWYgb3B0LmxpbmVcbiAgICAgICAgICAgIG9wdC53aW5JRCAgPSB3aW5kb3cud2luSURcblxuICAgICAgICAgICAgb3B0Lm9sZFBvcyA9IEBjdXJzb3JQb3MoKVxuICAgICAgICAgICAgb3B0Lm9sZEZpbGUgPSBAY3VycmVudEZpbGVcbiAgICAgICAgICAgIHdpbmRvdy5uYXZpZ2F0ZS5nb3RvRmlsZVBvcyBvcHRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZmlsZSA9IHNsYXNoLmpvaW5GaWxlTGluZSBvcHQuZmlsZSwgb3B0LmxpbmUsIG9wdC5jb2xcbiAgICAgICAgICAgICMga2xvZyAnYnlwYXNzIG5hdmlnYXRpb24gaGlzdG9yeScgZmlsZVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdsb2FkRmlsZScgZmlsZVxuXG4gICAganVtcFRvOiAod29yZCwgb3B0KSA9PlxuXG4gICAgICAgIGlmIHR5cGVvZih3b3JkKSA9PSAnb2JqZWN0JyBhbmQgbm90IG9wdD9cbiAgICAgICAgICAgIG9wdCAgPSB3b3JkXG4gICAgICAgICAgICB3b3JkID0gb3B0LndvcmRcblxuICAgICAgICBvcHQgPz0ge31cblxuICAgICAgICBpZiBvcHQuZmlsZT9cbiAgICAgICAgICAgIEBqdW1wVG9GaWxlIG9wdFxuICAgICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgICByZXR1cm4ga2Vycm9yICdub3RoaW5nIHRvIGp1bXAgdG8/JyBpZiBlbXB0eSB3b3JkXG5cbiAgICAgICAgZmluZCA9IHdvcmQudG9Mb3dlckNhc2UoKS50cmltKClcbiAgICAgICAgZmluZCA9IGZpbmQuc2xpY2UgMSBpZiBmaW5kWzBdID09ICdAJ1xuXG4gICAgICAgIHJldHVybiBrZXJyb3IgJ0ZpbGVFZGl0b3IuanVtcFRvIC0tIG5vdGhpbmcgdG8gZmluZD8nIGlmIGVtcHR5IGZpbmRcblxuICAgICAgICB0eXBlID0gb3B0Py50eXBlXG5cbiAgICAgICAgaWYgbm90IHR5cGUgb3IgdHlwZSA9PSAnY2xhc3MnXG4gICAgICAgICAgICBjbGFzc2VzID0gcG9zdC5nZXQgJ2luZGV4ZXInICdjbGFzc2VzJ1xuICAgICAgICAgICAgZm9yIGNsc3MsIGluZm8gb2YgY2xhc3Nlc1xuICAgICAgICAgICAgICAgIGlmIGNsc3MudG9Mb3dlckNhc2UoKSA9PSBmaW5kXG4gICAgICAgICAgICAgICAgICAgIEBqdW1wVG9GaWxlIGluZm9cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgICBpZiBub3QgdHlwZSBvciB0eXBlID09ICdmdW5jJ1xuICAgICAgICAgICAgZnVuY3MgPSBwb3N0LmdldCAnaW5kZXhlcicgJ2Z1bmNzJ1xuICAgICAgICAgICAgZm9yIGZ1bmMsIGluZm9zIG9mIGZ1bmNzXG4gICAgICAgICAgICAgICAgaWYgZnVuYy50b0xvd2VyQ2FzZSgpID09IGZpbmRcbiAgICAgICAgICAgICAgICAgICAgaW5mbyA9IGluZm9zWzBdXG4gICAgICAgICAgICAgICAgICAgIGZvciBpIGluIGluZm9zXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBpLmZpbGUgPT0gQGN1cnJlbnRGaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mbyA9IGlcbiAgICAgICAgICAgICAgICAgICAgQGp1bXBUb0ZpbGUgaW5mb1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgICAgIGlmIG5vdCB0eXBlIG9yIHR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICAgICBmaWxlcyA9IHBvc3QuZ2V0ICdpbmRleGVyJyAnZmlsZXMnXG4gICAgICAgICAgICBmb3IgZmlsZSwgaW5mbyBvZiBmaWxlc1xuICAgICAgICAgICAgICAgIGlmIHNsYXNoLmJhc2UoZmlsZSkudG9Mb3dlckNhc2UoKSA9PSBmaW5kIGFuZCBmaWxlICE9IEBjdXJyZW50RmlsZVxuICAgICAgICAgICAgICAgICAgICBAanVtcFRvRmlsZSBmaWxlOmZpbGUsIGxpbmU6NlxuXG4gICAgICAgIHdpbmRvdy5jb21tYW5kbGluZS5jb21tYW5kcy5zZWFyY2guc3RhcnQgJ3NlYXJjaCdcbiAgICAgICAgd2luZG93LmNvbW1hbmRsaW5lLmNvbW1hbmRzLnNlYXJjaC5leGVjdXRlIHdvcmRcblxuICAgICAgICB3aW5kb3cuc3BsaXQuZG8gJ3Nob3cgdGVybWluYWwnXG5cbiAgICAgICAgdHJ1ZVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAganVtcFRvQ291bnRlcnBhcnQ6ICgpIC0+XG5cbiAgICAgICAgY3AgPSBAY3Vyc29yUG9zKClcbiAgICAgICAgY3VycmV4dCA9IHNsYXNoLmV4dCBAY3VycmVudEZpbGVcblxuICAgICAgICBzd2l0Y2ggY3VycmV4dFxuICAgICAgICAgICAgd2hlbiAnY29mZmVlJyAna29mZmVlJ1xuICAgICAgICAgICAgICAgIFtmaWxlLGxpbmUsY29sXSA9IHNyY21hcC50b0pzIEBjdXJyZW50RmlsZSwgY3BbMV0rMSwgY3BbMF1cbiAgICAgICAgICAgIHdoZW4gJ2pzJ1xuICAgICAgICAgICAgICAgIFtmaWxlLGxpbmUsY29sXSA9IHNyY21hcC50b0NvZmZlZSBAY3VycmVudEZpbGUsIGNwWzFdKzEsIGNwWzBdXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkKGZpbGUpIGFuZCBzbGFzaC5maWxlRXhpc3RzIGZpbGVcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnbG9hZEZpbGUnIHNsYXNoLmpvaW5GaWxlTGluZSBmaWxlLGxpbmUsY29sXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgICAgIGNvdW50ZXJwYXJ0cyA9XG4gICAgICAgICAgICBjcHA6ICAgICBbJ2hwcCcgJ2gnXVxuICAgICAgICAgICAgY2M6ICAgICAgWydocHAnICdoJ11cbiAgICAgICAgICAgIGg6ICAgICAgIFsnY3BwJyAnYyddXG4gICAgICAgICAgICBocHA6ICAgICBbJ2NwcCcgJ2MnXVxuICAgICAgICAgICAgY29mZmVlOiAgWydqcyddXG4gICAgICAgICAgICBrb2ZmZWU6ICBbJ2pzJ11cbiAgICAgICAgICAgIGpzOiAgICAgIFsnY29mZmVlJydrb2ZmZWUnXVxuICAgICAgICAgICAgcHVnOiAgICAgWydodG1sJ11cbiAgICAgICAgICAgIGh0bWw6ICAgIFsncHVnJ11cbiAgICAgICAgICAgIGNzczogICAgIFsnc3R5bCddXG4gICAgICAgICAgICBzdHlsOiAgICBbJ2NzcyddXG5cbiAgICAgICAgZm9yIGV4dCBpbiAoY291bnRlcnBhcnRzW2N1cnJleHRdID8gW10pXG4gICAgICAgICAgICBpZiBzbGFzaC5maWxlRXhpc3RzIHNsYXNoLnN3YXBFeHQgQGN1cnJlbnRGaWxlLCBleHRcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJyBzbGFzaC5zd2FwRXh0IEBjdXJyZW50RmlsZSwgZXh0XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgICBmb3IgZXh0IGluIChjb3VudGVycGFydHNbY3VycmV4dF0gPyBbXSlcbiAgICAgICAgICAgIGNvdW50ZXIgPSBzbGFzaC5zd2FwRXh0IEBjdXJyZW50RmlsZSwgZXh0XG4gICAgICAgICAgICBjb3VudGVyID0gY291bnRlci5yZXBsYWNlIFwiLyN7Y3VycmV4dH0vXCIgXCIvI3tleHR9L1wiXG4gICAgICAgICAgICBpZiBzbGFzaC5maWxlRXhpc3RzIGNvdW50ZXJcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJyBjb3VudGVyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZmFsc2VcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY2VudGVyVGV4dDogKGNlbnRlciwgYW5pbWF0ZT0zMDApIC0+XG5cbiAgICAgICAgQHNpemUuY2VudGVyVGV4dCA9IGNlbnRlclxuICAgICAgICBAdXBkYXRlTGF5ZXJzKClcblxuICAgICAgICBAc2l6ZS5vZmZzZXRYID0gTWF0aC5mbG9vciBAc2l6ZS5jaGFyV2lkdGgvMiArIEBzaXplLm51bWJlcnNXaWR0aFxuICAgICAgICBpZiBjZW50ZXJcbiAgICAgICAgICAgIGJyICAgICAgICA9IEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICB2aXNDb2xzICAgPSBwYXJzZUludCBici53aWR0aCAvIEBzaXplLmNoYXJXaWR0aFxuICAgICAgICAgICAgbmV3T2Zmc2V0ID0gcGFyc2VJbnQgQHNpemUuY2hhcldpZHRoICogKHZpc0NvbHMgLSAxMDApIC8gMlxuICAgICAgICAgICAgQHNpemUub2Zmc2V0WCA9IE1hdGgubWF4IEBzaXplLm9mZnNldFgsIG5ld09mZnNldFxuICAgICAgICAgICAgQHNpemUuY2VudGVyVGV4dCA9IHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHNpemUuY2VudGVyVGV4dCA9IGZhbHNlXG5cbiAgICAgICAgQHVwZGF0ZUxpbmVQb3NpdGlvbnMgYW5pbWF0ZVxuXG4gICAgICAgIGlmIGFuaW1hdGVcbiAgICAgICAgICAgIGxheWVycyA9IFsnLnNlbGVjdGlvbnMnICcuaGlnaGxpZ2h0cycgJy5jdXJzb3JzJ11cbiAgICAgICAgICAgIHRyYW5zaSA9IFsnLnNlbGVjdGlvbicgICcuaGlnaGxpZ2h0JyAgJy5jdXJzb3InIF0uY29uY2F0IGxheWVyc1xuICAgICAgICAgICAgcmVzZXRUcmFucyA9ID0+XG4gICAgICAgICAgICAgICAgc2V0U3R5bGUgJy5lZGl0b3IgLmxheWVycyAnK2wsICd0cmFuc2Zvcm0nIFwidHJhbnNsYXRlWCgwKVwiIGZvciBsIGluIGxheWVyc1xuICAgICAgICAgICAgICAgIHNldFN0eWxlICcuZWRpdG9yIC5sYXllcnMgJyt0LCAndHJhbnNpdGlvbicgXCJpbml0aWFsXCIgZm9yIHQgaW4gdHJhbnNpXG4gICAgICAgICAgICAgICAgQHVwZGF0ZUxheWVycygpXG5cbiAgICAgICAgICAgIGlmIGNlbnRlclxuICAgICAgICAgICAgICAgIG9mZnNldFggPSBAc2l6ZS5vZmZzZXRYIC0gQHNpemUubnVtYmVyc1dpZHRoIC0gQHNpemUuY2hhcldpZHRoLzJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBvZmZzZXRYID0gTWF0aC5mbG9vciBAc2l6ZS5jaGFyV2lkdGgvMiArIEBzaXplLm51bWJlcnNXaWR0aFxuICAgICAgICAgICAgICAgIG9mZnNldFggLT0gQHNpemUubnVtYmVyc1dpZHRoICsgQHNpemUuY2hhcldpZHRoLzJcbiAgICAgICAgICAgICAgICBvZmZzZXRYICo9IC0xXG5cbiAgICAgICAgICAgIHNldFN0eWxlICcuZWRpdG9yIC5sYXllcnMgJytsLCAndHJhbnNmb3JtJyBcInRyYW5zbGF0ZVgoI3tvZmZzZXRYfXB4KVwiIGZvciBsIGluIGxheWVyc1xuICAgICAgICAgICAgc2V0U3R5bGUgJy5lZGl0b3IgLmxheWVycyAnK3QsICd0cmFuc2l0aW9uJyBcImFsbCAje2FuaW1hdGUvMTAwMH1zXCIgZm9yIHQgaW4gdHJhbnNpXG4gICAgICAgICAgICBzZXRUaW1lb3V0IHJlc2V0VHJhbnMsIGFuaW1hdGVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHVwZGF0ZUxheWVycygpXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDBcblxuICAgIG9uQ29udGV4dE1lbnU6IChldmVudCkgPT4gc3RvcEV2ZW50IGV2ZW50LCBAc2hvd0NvbnRleHRNZW51IGtwb3MgZXZlbnRcblxuICAgIHNob3dDb250ZXh0TWVudTogKGFic1BvcykgPT5cblxuICAgICAgICBpZiBub3QgYWJzUG9zP1xuICAgICAgICAgICAgYWJzUG9zID0ga3BvcyBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0LCBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3BcblxuICAgICAgICBvcHQgPSBpdGVtczogW1xuICAgICAgICAgICAgdGV4dDogICAnQnJvd3NlJ1xuICAgICAgICAgICAgY29tYm86ICAnY29tbWFuZCsuJ1xuICAgICAgICAgICAgYWNjZWw6ICAnY3RybCsuJ1xuICAgICAgICAgICAgY2I6ICAgICAtPiB3aW5kb3cuY29tbWFuZGxpbmUuc3RhcnRDb21tYW5kICdicm93c2UnXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ0JhY2snXG4gICAgICAgICAgICBjb21ibzogICdjb21tYW5kKzEnXG4gICAgICAgICAgICBjYjogICAgIC0+IHBvc3QuZW1pdCAnbWVudUFjdGlvbicgJ05hdmlnYXRlIEJhY2t3YXJkJ1xuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICcnXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ01heGltaXplJ1xuICAgICAgICAgICAgY29tYm86ICAnY29tbWFuZCtzaGlmdCt5J1xuICAgICAgICAgICAgYWNjZWw6ICAnY3RybCtzaGlmdCt5J1xuICAgICAgICAgICAgY2I6ICAgICAtPiB3aW5kb3cuc3BsaXQubWF4aW1pemVFZGl0b3IoKVxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICcnXG4gICAgICAgIF1cblxuICAgICAgICBvcHQuaXRlbXMgPSBvcHQuaXRlbXMuY29uY2F0IHdpbmRvdy50aXRsZWJhci5tZW51VGVtcGxhdGUoKVxuXG4gICAgICAgIFJlY2VudE1lbnUgPSBbXVxuICAgICAgICBcbiAgICAgICAgZmlsZVNwYW4gPSAoZikgLT5cbiAgICAgICAgICAgIGlmIGY/XG4gICAgICAgICAgICAgICAgc3BhbiAgPSBTeW50YXguc3BhbkZvclRleHRBbmRTeW50YXggc2xhc2gudGlsZGUoc2xhc2guZGlyKGYpKSwgJ2Jyb3dzZXInXG4gICAgICAgICAgICAgICAgc3BhbiArPSBTeW50YXguc3BhbkZvclRleHRBbmRTeW50YXggJy8nICsgc2xhc2guYmFzZShmKSwgJ2Jyb3dzZXInXG4gICAgICAgICAgICByZXR1cm4gc3BhblxuICAgICAgICBcbiAgICAgICAgcmVjZW50ID0gd2luZG93LnN0YXRlPy5nZXQgJ3JlY2VudEZpbGVzJyBbXVxuICAgICAgICByZWNlbnQgPz0gW11cbiAgICAgICAgZm9yIGYgaW4gcmVjZW50XG4gICAgICAgICAgICBpZiBmcy5leGlzdHNTeW5jIGZcbiAgICAgICAgICAgICAgICBSZWNlbnRNZW51LnVuc2hpZnRcbiAgICAgICAgICAgICAgICAgICAgaHRtbDogZmlsZVNwYW4gZlxuICAgICAgICAgICAgICAgICAgICBhcmc6IGZcbiAgICAgICAgICAgICAgICAgICAgY2I6IChhcmcpIC0+IHBvc3QuZW1pdCAnbmV3VGFiV2l0aEZpbGUnIGFyZ1xuICAgICAgICBcbiAgICAgICAgZ2V0TWVudSA9ICh0ZW1wbGF0ZSwgbmFtZSkgLT5cbiAgICAgICAgICAgIGZvciBpdGVtIGluIHRlbXBsYXRlXG4gICAgICAgICAgICAgICAgaWYgaXRlbS50ZXh0ID09IG5hbWVcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIFJlY2VudE1lbnUubGVuZ3RoXG4gICAgICAgICAgICBSZWNlbnRNZW51LnB1c2ggdGV4dDogJydcbiAgICAgICAgICAgIFJlY2VudE1lbnUucHVzaCB0ZXh0OiAnQ2xlYXIgTGlzdCdcbiAgICAgICAgICAgIGZpbGVNZW51ID0gZ2V0TWVudSBvcHQuaXRlbXMsICdGaWxlJ1xuICAgICAgICAgICAgZmlsZU1lbnUubWVudSA9IFt7dGV4dDonUmVjZW50JyBtZW51OlJlY2VudE1lbnV9LCB7dGV4dDonJ31dLmNvbmNhdCBmaWxlTWVudS5tZW51XG4gICAgICAgIFxuICAgICAgICBvcHQueCA9IGFic1Bvcy54XG4gICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgcG9wdXAubWVudSBvcHRcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBjbGlja0F0UG9zOiAocCwgZXZlbnQpIC0+XG5cbiAgICAgICAgaWYgZXZlbnQubWV0YUtleVxuICAgICAgICAgICAgaWYga3BvcyhldmVudCkueCA8PSBAc2l6ZS5udW1iZXJzV2lkdGhcbiAgICAgICAgICAgICAgICBAc2luZ2xlQ3Vyc29yQXRQb3MgcFxuICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIHN1cGVyIHAsIGV2ZW50XG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0NoYXJFdmVudDogKG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnQpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmICd1bmhhbmRsZWQnICE9IHN1cGVyIG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnRcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdhbHQrY3RybCtlbnRlcicgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmNvbW1hbmRsaW5lLmNvbW1hbmRzLmNvZmZlZS5leGVjdXRlVGV4dCBAdGV4dE9mU2VsZWN0aW9uRm9yQ2xpcGJvYXJkKClcbiAgICAgICAgICAgIHdoZW4gJ2FsdCtjdHJsK3NoaWZ0K2VudGVyJyB0aGVuIHJldHVybiB3aW5kb3cuY29tbWFuZGxpbmUuY29tbWFuZHMuY29mZmVlLmV4ZWN1dGVUZXh0SW5NYWluIEB0ZXh0T2ZTZWxlY3Rpb25Gb3JDbGlwYm9hcmR0KClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrYWx0K3VwJyAnYWx0K28nIHRoZW4gcmV0dXJuIEBqdW1wVG9Db3VudGVycGFydCgpXG4gICAgICAgICAgICB3aGVuICdlc2MnXG4gICAgICAgICAgICAgICAgc3BsaXQgPSB3aW5kb3cuc3BsaXRcbiAgICAgICAgICAgICAgICBpZiBzcGxpdC50ZXJtaW5hbFZpc2libGUoKVxuICAgICAgICAgICAgICAgICAgICBzcGxpdC5oaWRlVGVybWluYWwoKVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgc3BsaXQuY29tbWFuZGxpbmVWaXNpYmxlKClcbiAgICAgICAgICAgICAgICAgICAgc3BsaXQuaGlkZUNvbW1hbmRsaW5lKClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgJ3VuaGFuZGxlZCdcblxubW9kdWxlLmV4cG9ydHMgPSBGaWxlRWRpdG9yXG4iXX0=
//# sourceURL=../../coffee/editor/fileeditor.coffee