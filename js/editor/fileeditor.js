// koffee 1.14.0

/*
00000000  000  000      00000000        00000000  0000000    000  000000000   0000000   00000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000000    000  000      0000000         0000000   000   000  000     000     000   000  0000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000       000  0000000  00000000        00000000  0000000    000     000      0000000   000   000
 */
var FileEditor, Syntax, TextEditor, clamp, electron, empty, fs, kerror, klog, kpos, popup, post, ref, setStyle, slash, srcmap, stopEvent, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
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
        klog('jumpToFile', opt.type, opt.file);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvZWRpdG9yIiwic291cmNlcyI6WyJmaWxlZWRpdG9yLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSwySUFBQTtJQUFBOzs7OztBQVFBLE1BQW1HLE9BQUEsQ0FBUSxLQUFSLENBQW5HLEVBQUUsaUJBQUYsRUFBUyxpQkFBVCxFQUFnQixXQUFoQixFQUFvQixtQkFBcEIsRUFBNEIsZUFBNUIsRUFBa0MsZUFBbEMsRUFBd0MsaUJBQXhDLEVBQStDLGVBQS9DLEVBQXFELHVCQUFyRCxFQUErRCxpQkFBL0QsRUFBc0UsbUJBQXRFLEVBQThFLHlCQUE5RSxFQUF5Rjs7QUFFekYsVUFBQSxHQUFhLE9BQUEsQ0FBUSxjQUFSOztBQUNiLE1BQUEsR0FBYSxPQUFBLENBQVEsVUFBUjs7QUFDYixRQUFBLEdBQWEsT0FBQSxDQUFRLFVBQVI7O0FBRVA7OztJQUVDLG9CQUFDLFFBQUQ7Ozs7OztRQUVDLDRDQUFNLFFBQU4sRUFDSTtZQUFBLFFBQUEsRUFBVSxDQUNOLFNBRE0sRUFFTixXQUZNLEVBR04sU0FITSxFQUlOLFNBSk0sRUFLTixNQUxNLEVBTU4sY0FOTSxFQU9OLFVBUE0sRUFRTixTQVJNLEVBU04sWUFUTSxDQUFWO1lBV0EsUUFBQSxFQUFVLEVBWFY7U0FESjtRQWNBLElBQUMsQ0FBQSxXQUFELEdBQWU7UUFFZixJQUFDLENBQUEsSUFBSSxDQUFDLGdCQUFOLENBQXVCLGFBQXZCLEVBQXFDLElBQUMsQ0FBQSxhQUF0QztRQUVBLElBQUksQ0FBQyxFQUFMLENBQVEsYUFBUixFQUF3QixJQUFDLENBQUEsYUFBekI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFFBQVIsRUFBd0IsSUFBQyxDQUFBLE1BQXpCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxZQUFSLEVBQXdCLElBQUMsQ0FBQSxVQUF6QjtRQUVBLElBQUMsQ0FBQSxZQUFELENBQUE7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R0FBTixFQUFXLEtBQVgsRUFBa0IsSUFBbEIsRUFBd0IsS0FBeEI7QUFFeEIsWUFBQTtRQUFBLElBQVUsV0FBQSxLQUFlLDJEQUFNLEdBQU4sRUFBVyxHQUFYLEVBQWdCLEtBQWhCLEVBQXVCLElBQXZCLEVBQTZCLEtBQTdCLENBQXpCO0FBQUEsbUJBQUE7O0FBQ0EsZ0JBQU8sS0FBUDtBQUFBLGlCQUNTLGdCQURUO0FBQ3FDLHVCQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFuQyxDQUErQyxJQUFDLENBQUEsMkJBQUQsQ0FBQSxDQUEvQztBQUQ1QyxpQkFFUyxzQkFGVDtBQUVxQyx1QkFBTyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsaUJBQW5DLENBQXFELElBQUMsQ0FBQSw0QkFBRCxDQUFBLENBQXJEO0FBRjVDLGlCQUdTLGdCQUhUO0FBQUEsaUJBRzBCLE9BSDFCO0FBR3VDLHVCQUFPLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0FBSDlDLGlCQUlTLEtBSlQ7Z0JBS1EsS0FBQSxHQUFRLE1BQU0sQ0FBQztnQkFDZixJQUFHLEtBQUssQ0FBQyxlQUFOLENBQUEsQ0FBSDtvQkFDSSxLQUFLLENBQUMsWUFBTixDQUFBLEVBREo7aUJBQUEsTUFFSyxJQUFHLEtBQUssQ0FBQyxrQkFBTixDQUFBLENBQUg7b0JBQ0QsS0FBSyxDQUFDLGVBQU4sQ0FBQSxFQURDOztBQUVMO0FBVlI7ZUFXQTtJQWR3Qjs7OztHQWhkUDs7QUFnZXpCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4jIyNcblxueyBjbGFtcCwgZW1wdHksIGZzLCBrZXJyb3IsIGtsb2csIGtwb3MsIHBvcHVwLCBwb3N0LCBzZXRTdHlsZSwgc2xhc2gsIHNyY21hcCwgc3RvcEV2ZW50LCB2YWxpZCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5UZXh0RWRpdG9yID0gcmVxdWlyZSAnLi90ZXh0ZWRpdG9yJ1xuU3ludGF4ICAgICA9IHJlcXVpcmUgJy4vc3ludGF4J1xuZWxlY3Ryb24gICA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuXG5jbGFzcyBGaWxlRWRpdG9yIGV4dGVuZHMgVGV4dEVkaXRvclxuXG4gICAgQDogKHZpZXdFbGVtKSAtPlxuXG4gICAgICAgIHN1cGVyIHZpZXdFbGVtLFxuICAgICAgICAgICAgZmVhdHVyZXM6IFtcbiAgICAgICAgICAgICAgICAnRGlmZmJhcidcbiAgICAgICAgICAgICAgICAnU2Nyb2xsYmFyJ1xuICAgICAgICAgICAgICAgICdOdW1iZXJzJ1xuICAgICAgICAgICAgICAgICdNaW5pbWFwJ1xuICAgICAgICAgICAgICAgICdNZXRhJ1xuICAgICAgICAgICAgICAgICdBdXRvY29tcGxldGUnXG4gICAgICAgICAgICAgICAgJ0JyYWNrZXRzJ1xuICAgICAgICAgICAgICAgICdTdHJpbmdzJ1xuICAgICAgICAgICAgICAgICdDdXJzb3JMaW5lJ1xuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGZvbnRTaXplOiAxOVxuXG4gICAgICAgIEBjdXJyZW50RmlsZSA9IG51bGxcblxuICAgICAgICBAdmlldy5hZGRFdmVudExpc3RlbmVyICdjb250ZXh0bWVudScgQG9uQ29udGV4dE1lbnVcblxuICAgICAgICBwb3N0Lm9uICdjb21tYW5kbGluZScgICBAb25Db21tYW5kbGluZVxuICAgICAgICBwb3N0Lm9uICdqdW1wVG8nICAgICAgICBAanVtcFRvXG4gICAgICAgIHBvc3Qub24gJ2p1bXBUb0ZpbGUnICAgIEBqdW1wVG9GaWxlXG5cbiAgICAgICAgQGluaXRQaWdtZW50cygpXG4gICAgICAgIEBpbml0SW52aXNpYmxlcygpXG4gICAgICAgIFxuICAgICAgICBAc2V0VGV4dCAnJ1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGNoYW5nZWQ6IChjaGFuZ2VJbmZvKSAtPlxuXG4gICAgICAgIHN1cGVyIGNoYW5nZUluZm9cbiAgICAgICAgXG4gICAgICAgIGlmIGNoYW5nZUluZm8uY2hhbmdlcy5sZW5ndGhcbiAgICAgICAgICAgIGRpcnR5ID0gQGRvLmhhc0NoYW5nZXMoKVxuICAgICAgICAgICAgaWYgQGRpcnR5ICE9IGRpcnR5XG4gICAgICAgICAgICAgICAgQGRpcnR5ID0gZGlydHlcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2RpcnR5JyBAZGlydHlcblxuICAgICMgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG4gICAgY2xlYXI6IC0+XG5cbiAgICAgICAgQGRpcnR5ID0gZmFsc2VcbiAgICAgICAgQHNldFNhbHRlck1vZGUgZmFsc2VcbiAgICAgICAgQGRpZmZiYXI/LmNsZWFyKClcbiAgICAgICAgQG1ldGE/LmNsZWFyKClcbiAgICAgICAgQHNldExpbmVzIFsnJ11cbiAgICAgICAgQGRvLnJlc2V0KClcblxuICAgIHNldEN1cnJlbnRGaWxlOiAoZmlsZSwgcmVzdG9yZVN0YXRlKSAtPlxuXG4gICAgICAgIEBjbGVhcigpXG4gICAgICAgIFxuICAgICAgICBAY3VycmVudEZpbGUgPSBmaWxlXG5cbiAgICAgICAgQHNldHVwRmlsZVR5cGUoKVxuXG4gICAgICAgIGZpbGVFeGlzdHMgPSBAY3VycmVudEZpbGU/IGFuZCBzbGFzaC5maWxlRXhpc3RzIEBjdXJyZW50RmlsZVxuXG4gICAgICAgIGlmIHJlc3RvcmVTdGF0ZVxuICAgICAgICAgICAgQHNldFRleHQgcmVzdG9yZVN0YXRlLnRleHQoKVxuICAgICAgICAgICAgQHN0YXRlID0gcmVzdG9yZVN0YXRlXG4gICAgICAgICAgICBAZGlydHkgPSB0cnVlXG4gICAgICAgIGVsc2UgaWYgZmlsZUV4aXN0c1xuICAgICAgICAgICAgQHNldFRleHQgc2xhc2gucmVhZFRleHQgQGN1cnJlbnRGaWxlXG5cbiAgICAgICAgaWYgZmlsZUV4aXN0c1xuICAgICAgICAgICAgd2luZG93LnRhYnMuYWN0aXZlVGFiKCk/LnNldEZpbGUgQGN1cnJlbnRGaWxlXG4gICAgICAgICAgICBcbiAgICAgICAgcG9zdC5lbWl0ICdmaWxlJyBAY3VycmVudEZpbGUgIyBicm93c2VyICYgc2hlbGZcblxuICAgICAgICBAZW1pdCAnZmlsZScgQGN1cnJlbnRGaWxlICMgZGlmZmJhciwgcGlnbWVudHMsIC4uLlxuXG4gICAgICAgIHBvc3QuZW1pdCAnZGlydHknIEBkaXJ0eVxuXG4gICAgY3VycmVudERpcjogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBjdXJyZW50RmlsZT8gYW5kIHNsYXNoLmZpbGVFeGlzdHMgQGN1cnJlbnRGaWxlXG4gICAgICAgICAgICBzbGFzaC5kaXIgQGN1cnJlbnRGaWxlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNsYXNoLnBhdGggcHJvY2Vzcy5jd2QoKVxuICAgICAgICBcbiAgICByZXN0b3JlRnJvbVRhYlN0YXRlOiAodGFiU3RhdGUpIC0+XG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciBcIm5vIHRhYlN0YXRlLmZpbGU/XCIgaWYgbm90IHRhYlN0YXRlLmZpbGU/XG4gICAgICAgIEBzZXRDdXJyZW50RmlsZSB0YWJTdGF0ZS5maWxlLCB0YWJTdGF0ZS5zdGF0ZVxuXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAgICAwMDAgICAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMDAwMDAwXG5cbiAgICBzaGViYW5nRmlsZVR5cGU6IC0+XG5cbiAgICAgICAgZmlsZVR5cGUgPSBTeW50YXguc2hlYmFuZyBAbGluZSgwKSBpZiBAbnVtTGluZXMoKVxuICAgICAgICBpZiBmaWxlVHlwZSA9PSAndHh0J1xuICAgICAgICAgICAgaWYgQGN1cnJlbnRGaWxlP1xuICAgICAgICAgICAgICAgIGV4dCA9IHNsYXNoLmV4dCBAY3VycmVudEZpbGVcbiAgICAgICAgICAgICAgICBpZiBleHQgaW4gU3ludGF4LnN5bnRheE5hbWVzXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBleHRcbiAgICAgICAgZWxzZSBpZiBmaWxlVHlwZVxuICAgICAgICAgICAgcmV0dXJuIGZpbGVUeXBlXG5cbiAgICAgICAgc3VwZXIoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMFxuXG4gICAgb25Db21tYW5kbGluZTogKGUpID0+XG5cbiAgICAgICAgc3dpdGNoIGVcbiAgICAgICAgICAgIHdoZW4gJ2hpZGRlbicgJ3Nob3duJ1xuICAgICAgICAgICAgICAgIGQgPSB3aW5kb3cuc3BsaXQuY29tbWFuZGxpbmVIZWlnaHQgKyB3aW5kb3cuc3BsaXQuaGFuZGxlSGVpZ2h0XG4gICAgICAgICAgICAgICAgZCA9IE1hdGgubWluIGQsIEBzY3JvbGwuc2Nyb2xsTWF4IC0gQHNjcm9sbC5zY3JvbGxcbiAgICAgICAgICAgICAgICBkICo9IC0xIGlmIGUgPT0gJ2hpZGRlbidcbiAgICAgICAgICAgICAgICBAc2Nyb2xsLmJ5IGRcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwMDAwMDBcblxuICAgIHNhdmVTY3JvbGxDdXJzb3JzQW5kU2VsZWN0aW9uczogKG9wdCkgLT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IEBjdXJyZW50RmlsZVxuICAgICAgICBzID0ge31cblxuICAgICAgICBzLm1haW4gICAgICAgPSBAc3RhdGUubWFpbigpXG4gICAgICAgIHMuY3Vyc29ycyAgICA9IEBzdGF0ZS5jdXJzb3JzKCkgICAgaWYgQG51bUN1cnNvcnMoKSA+IDEgb3IgQGN1cnNvclBvcygpWzBdIG9yIEBjdXJzb3JQb3MoKVsxXVxuICAgICAgICBzLnNlbGVjdGlvbnMgPSBAc3RhdGUuc2VsZWN0aW9ucygpIGlmIEBudW1TZWxlY3Rpb25zKCkgYW5kIEBudW1TZWxlY3Rpb25zKCkgPCAxMFxuICAgICAgICBzLmhpZ2hsaWdodHMgPSBAc3RhdGUuaGlnaGxpZ2h0cygpIGlmIEBudW1IaWdobGlnaHRzKCkgYW5kIEBudW1IaWdobGlnaHRzKCkgPCAxMFxuXG4gICAgICAgIHMuc2Nyb2xsID0gQHNjcm9sbC5zY3JvbGwgaWYgQHNjcm9sbC5zY3JvbGxcblxuICAgICAgICBmaWxlUG9zaXRpb25zID0gd2luZG93LnN0YXNoLmdldCAnZmlsZVBvc2l0aW9ucycgT2JqZWN0LmNyZWF0ZSBudWxsXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgZmlsZVBvc2l0aW9ucyBvciB0eXBlb2YoZmlsZVBvc2l0aW9ucykgIT0gJ29iamVjdCdcbiAgICAgICAgICAgIGZpbGVQb3NpdGlvbnMgPSBPYmplY3QuY3JlYXRlIG51bGxcbiAgICAgICAgICAgIFxuICAgICAgICBmaWxlUG9zaXRpb25zW0BjdXJyZW50RmlsZV0gPSBzXG4gICAgICAgIHdpbmRvdy5zdGFzaC5zZXQgJ2ZpbGVQb3NpdGlvbnMnIGZpbGVQb3NpdGlvbnNcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG5cbiAgICByZXN0b3JlU2Nyb2xsQ3Vyc29yc0FuZFNlbGVjdGlvbnM6IC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY3VycmVudEZpbGVcbiAgICAgICAgXG4gICAgICAgIGZpbGVQb3NpdGlvbnMgPSB3aW5kb3cuc3Rhc2guZ2V0ICdmaWxlUG9zaXRpb25zJyB7fVxuXG4gICAgICAgIGlmIGZpbGVQb3NpdGlvbnNbQGN1cnJlbnRGaWxlXT9cblxuICAgICAgICAgICAgcyA9IGZpbGVQb3NpdGlvbnNbQGN1cnJlbnRGaWxlXVxuXG4gICAgICAgICAgICBjdXJzb3JzID0gcy5jdXJzb3JzID8gW1swLDBdXVxuICAgICAgICAgICAgY3Vyc29ycyA9IGN1cnNvcnMubWFwIChjKSA9PiBbY1swXSwgY2xhbXAoMCxAbnVtTGluZXMoKS0xLGNbMV0pXVxuXG4gICAgICAgICAgICBAc2V0Q3Vyc29ycyAgICBjdXJzb3JzXG4gICAgICAgICAgICBAc2V0U2VsZWN0aW9ucyBzLnNlbGVjdGlvbnMgPyBbXVxuICAgICAgICAgICAgQHNldEhpZ2hsaWdodHMgcy5oaWdobGlnaHRzID8gW11cbiAgICAgICAgICAgIEBzZXRNYWluICAgICAgIHMubWFpbiA/IDBcbiAgICAgICAgICAgIEBzZXRTdGF0ZSBAc3RhdGVcblxuICAgICAgICAgICAgQHNjcm9sbC50byBzLnNjcm9sbCBpZiBzLnNjcm9sbFxuICAgICAgICAgICAgQHNjcm9sbC5jdXJzb3JJbnRvVmlldygpXG5cbiAgICAgICAgZWxzZVxuXG4gICAgICAgICAgICBAc2luZ2xlQ3Vyc29yQXRQb3MgWzAsMF1cbiAgICAgICAgICAgIEBzY3JvbGwudG9wID0gMCBpZiBAbWFpbkN1cnNvcigpWzFdID09IDBcbiAgICAgICAgICAgIEBzY3JvbGwuYm90ID0gQHNjcm9sbC50b3AtMVxuICAgICAgICAgICAgQHNjcm9sbC50byAwXG4gICAgICAgICAgICBAc2Nyb2xsLmN1cnNvckludG9WaWV3KClcblxuICAgICAgICBAdXBkYXRlTGF5ZXJzKClcbiAgICAgICAgQG51bWJlcnM/LnVwZGF0ZUNvbG9ycygpXG4gICAgICAgIEBtaW5pbWFwLm9uRWRpdG9yU2Nyb2xsKClcbiAgICAgICAgQGVtaXQgJ2N1cnNvcidcbiAgICAgICAgQGVtaXQgJ3NlbGVjdGlvbidcblxuICAgICMgICAgICAgMDAwICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwMDAwMDBcbiAgICAjICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwXG5cbiAgICBqdW1wVG9GaWxlOiAob3B0KSA9PlxuXG4gICAgICAgIGtsb2cgJ2p1bXBUb0ZpbGUnIG9wdC50eXBlLCBvcHQuZmlsZVxuICAgICAgICBcbiAgICAgICAgd2luZG93LnRhYnMuYWN0aXZlVGFiIHRydWVcblxuICAgICAgICBpZiBvcHQubmV3VGFiXG5cbiAgICAgICAgICAgIGZpbGUgPSBvcHQuZmlsZVxuICAgICAgICAgICAgZmlsZSArPSAnOicgKyBvcHQubGluZSBpZiBvcHQubGluZVxuICAgICAgICAgICAgZmlsZSArPSAnOicgKyBvcHQuY29sIGlmIG9wdC5jb2xcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnbmV3VGFiV2l0aEZpbGUnIGZpbGVcblxuICAgICAgICBlbHNlXG5cbiAgICAgICAgICAgIFtmaWxlLCBmcG9zXSA9IHNsYXNoLnNwbGl0RmlsZVBvcyBvcHQuZmlsZVxuICAgICAgICAgICAgb3B0LnBvcyA9IGZwb3NcbiAgICAgICAgICAgIG9wdC5wb3NbMF0gPSBvcHQuY29sIGlmIG9wdC5jb2xcbiAgICAgICAgICAgIG9wdC5wb3NbMV0gPSBvcHQubGluZS0xIGlmIG9wdC5saW5lXG4gICAgICAgICAgICBvcHQud2luSUQgID0gd2luZG93LndpbklEXG5cbiAgICAgICAgICAgIG9wdC5vbGRQb3MgPSBAY3Vyc29yUG9zKClcbiAgICAgICAgICAgIG9wdC5vbGRGaWxlID0gQGN1cnJlbnRGaWxlXG4gICAgICAgICAgICB3aW5kb3cubmF2aWdhdGUuZ290b0ZpbGVQb3Mgb3B0XG5cbiAgICBqdW1wVG86ICh3b3JkLCBvcHQpID0+XG5cbiAgICAgICAgaWYgdHlwZW9mKHdvcmQpID09ICdvYmplY3QnIGFuZCBub3Qgb3B0P1xuICAgICAgICAgICAgb3B0ICA9IHdvcmRcbiAgICAgICAgICAgIHdvcmQgPSBvcHQud29yZFxuXG4gICAgICAgIG9wdCA/PSB7fVxuXG4gICAgICAgIGlmIG9wdC5maWxlP1xuICAgICAgICAgICAgQGp1bXBUb0ZpbGUgb3B0XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgICAgIHJldHVybiBrZXJyb3IgJ25vdGhpbmcgdG8ganVtcCB0bz8nIGlmIGVtcHR5IHdvcmRcblxuICAgICAgICBmaW5kID0gd29yZC50b0xvd2VyQ2FzZSgpLnRyaW0oKVxuICAgICAgICBmaW5kID0gZmluZC5zbGljZSAxIGlmIGZpbmRbMF0gPT0gJ0AnXG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciAnRmlsZUVkaXRvci5qdW1wVG8gLS0gbm90aGluZyB0byBmaW5kPycgaWYgZW1wdHkgZmluZFxuXG4gICAgICAgIHR5cGUgPSBvcHQ/LnR5cGVcblxuICAgICAgICBpZiBub3QgdHlwZSBvciB0eXBlID09ICdjbGFzcydcbiAgICAgICAgICAgIGNsYXNzZXMgPSBwb3N0LmdldCAnaW5kZXhlcicgJ2NsYXNzZXMnXG4gICAgICAgICAgICBmb3IgY2xzcywgaW5mbyBvZiBjbGFzc2VzXG4gICAgICAgICAgICAgICAgaWYgY2xzcy50b0xvd2VyQ2FzZSgpID09IGZpbmRcbiAgICAgICAgICAgICAgICAgICAgQGp1bXBUb0ZpbGUgaW5mb1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgICAgIGlmIG5vdCB0eXBlIG9yIHR5cGUgPT0gJ2Z1bmMnXG4gICAgICAgICAgICBmdW5jcyA9IHBvc3QuZ2V0ICdpbmRleGVyJyAnZnVuY3MnXG4gICAgICAgICAgICBmb3IgZnVuYywgaW5mb3Mgb2YgZnVuY3NcbiAgICAgICAgICAgICAgICBpZiBmdW5jLnRvTG93ZXJDYXNlKCkgPT0gZmluZFxuICAgICAgICAgICAgICAgICAgICBpbmZvID0gaW5mb3NbMF1cbiAgICAgICAgICAgICAgICAgICAgZm9yIGkgaW4gaW5mb3NcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGkuZmlsZSA9PSBAY3VycmVudEZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvID0gaVxuICAgICAgICAgICAgICAgICAgICBAanVtcFRvRmlsZSBpbmZvXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAgICAgaWYgbm90IHR5cGUgb3IgdHlwZSA9PSAnZmlsZSdcbiAgICAgICAgICAgIGZpbGVzID0gcG9zdC5nZXQgJ2luZGV4ZXInICdmaWxlcydcbiAgICAgICAgICAgIGZvciBmaWxlLCBpbmZvIG9mIGZpbGVzXG4gICAgICAgICAgICAgICAgaWYgc2xhc2guYmFzZShmaWxlKS50b0xvd2VyQ2FzZSgpID09IGZpbmQgYW5kIGZpbGUgIT0gQGN1cnJlbnRGaWxlXG4gICAgICAgICAgICAgICAgICAgIEBqdW1wVG9GaWxlIGZpbGU6ZmlsZSwgbGluZTo2XG5cbiAgICAgICAgd2luZG93LmNvbW1hbmRsaW5lLmNvbW1hbmRzLnNlYXJjaC5zdGFydCAnc2VhcmNoJ1xuICAgICAgICB3aW5kb3cuY29tbWFuZGxpbmUuY29tbWFuZHMuc2VhcmNoLmV4ZWN1dGUgd29yZFxuXG4gICAgICAgIHdpbmRvdy5zcGxpdC5kbyAnc2hvdyB0ZXJtaW5hbCdcblxuICAgICAgICB0cnVlXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbiAgICBqdW1wVG9Db3VudGVycGFydDogKCkgLT5cblxuICAgICAgICBjcCA9IEBjdXJzb3JQb3MoKVxuICAgICAgICBjdXJyZXh0ID0gc2xhc2guZXh0IEBjdXJyZW50RmlsZVxuXG4gICAgICAgIHN3aXRjaCBjdXJyZXh0XG4gICAgICAgICAgICB3aGVuICdjb2ZmZWUnICdrb2ZmZWUnXG4gICAgICAgICAgICAgICAgW2ZpbGUsbGluZSxjb2xdID0gc3JjbWFwLnRvSnMgQGN1cnJlbnRGaWxlLCBjcFsxXSsxLCBjcFswXVxuICAgICAgICAgICAgd2hlbiAnanMnXG4gICAgICAgICAgICAgICAgW2ZpbGUsbGluZSxjb2xdID0gc3JjbWFwLnRvQ29mZmVlIEBjdXJyZW50RmlsZSwgY3BbMV0rMSwgY3BbMF1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQoZmlsZSkgYW5kIHNsYXNoLmZpbGVFeGlzdHMgZmlsZVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdsb2FkRmlsZScgc2xhc2guam9pbkZpbGVMaW5lIGZpbGUsbGluZSxjb2xcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAgICAgY291bnRlcnBhcnRzID1cbiAgICAgICAgICAgIGNwcDogICAgIFsnaHBwJyAnaCddXG4gICAgICAgICAgICBjYzogICAgICBbJ2hwcCcgJ2gnXVxuICAgICAgICAgICAgaDogICAgICAgWydjcHAnICdjJ11cbiAgICAgICAgICAgIGhwcDogICAgIFsnY3BwJyAnYyddXG4gICAgICAgICAgICBjb2ZmZWU6ICBbJ2pzJ11cbiAgICAgICAgICAgIGtvZmZlZTogIFsnanMnXVxuICAgICAgICAgICAganM6ICAgICAgWydjb2ZmZWUnJ2tvZmZlZSddXG4gICAgICAgICAgICBwdWc6ICAgICBbJ2h0bWwnXVxuICAgICAgICAgICAgaHRtbDogICAgWydwdWcnXVxuICAgICAgICAgICAgY3NzOiAgICAgWydzdHlsJ11cbiAgICAgICAgICAgIHN0eWw6ICAgIFsnY3NzJ11cblxuICAgICAgICBmb3IgZXh0IGluIChjb3VudGVycGFydHNbY3VycmV4dF0gPyBbXSlcbiAgICAgICAgICAgIGlmIHNsYXNoLmZpbGVFeGlzdHMgc2xhc2guc3dhcEV4dCBAY3VycmVudEZpbGUsIGV4dFxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnbG9hZEZpbGUnIHNsYXNoLnN3YXBFeHQgQGN1cnJlbnRGaWxlLCBleHRcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgICAgIGZvciBleHQgaW4gKGNvdW50ZXJwYXJ0c1tjdXJyZXh0XSA/IFtdKVxuICAgICAgICAgICAgY291bnRlciA9IHNsYXNoLnN3YXBFeHQgQGN1cnJlbnRGaWxlLCBleHRcbiAgICAgICAgICAgIGNvdW50ZXIgPSBjb3VudGVyLnJlcGxhY2UgXCIvI3tjdXJyZXh0fS9cIiBcIi8je2V4dH0vXCJcbiAgICAgICAgICAgIGlmIHNsYXNoLmZpbGVFeGlzdHMgY291bnRlclxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnbG9hZEZpbGUnIGNvdW50ZXJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBmYWxzZVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBjZW50ZXJUZXh0OiAoY2VudGVyLCBhbmltYXRlPTMwMCkgLT5cblxuICAgICAgICBAc2l6ZS5jZW50ZXJUZXh0ID0gY2VudGVyXG4gICAgICAgIEB1cGRhdGVMYXllcnMoKVxuXG4gICAgICAgIEBzaXplLm9mZnNldFggPSBNYXRoLmZsb29yIEBzaXplLmNoYXJXaWR0aC8yICsgQHNpemUubnVtYmVyc1dpZHRoXG4gICAgICAgIGlmIGNlbnRlclxuICAgICAgICAgICAgYnIgICAgICAgID0gQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgICAgIHZpc0NvbHMgICA9IHBhcnNlSW50IGJyLndpZHRoIC8gQHNpemUuY2hhcldpZHRoXG4gICAgICAgICAgICBuZXdPZmZzZXQgPSBwYXJzZUludCBAc2l6ZS5jaGFyV2lkdGggKiAodmlzQ29scyAtIDEwMCkgLyAyXG4gICAgICAgICAgICBAc2l6ZS5vZmZzZXRYID0gTWF0aC5tYXggQHNpemUub2Zmc2V0WCwgbmV3T2Zmc2V0XG4gICAgICAgICAgICBAc2l6ZS5jZW50ZXJUZXh0ID0gdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc2l6ZS5jZW50ZXJUZXh0ID0gZmFsc2VcblxuICAgICAgICBAdXBkYXRlTGluZVBvc2l0aW9ucyBhbmltYXRlXG5cbiAgICAgICAgaWYgYW5pbWF0ZVxuICAgICAgICAgICAgbGF5ZXJzID0gWycuc2VsZWN0aW9ucycgJy5oaWdobGlnaHRzJyAnLmN1cnNvcnMnXVxuICAgICAgICAgICAgdHJhbnNpID0gWycuc2VsZWN0aW9uJyAgJy5oaWdobGlnaHQnICAnLmN1cnNvcicgXS5jb25jYXQgbGF5ZXJzXG4gICAgICAgICAgICByZXNldFRyYW5zID0gPT5cbiAgICAgICAgICAgICAgICBzZXRTdHlsZSAnLmVkaXRvciAubGF5ZXJzICcrbCwgJ3RyYW5zZm9ybScgXCJ0cmFuc2xhdGVYKDApXCIgZm9yIGwgaW4gbGF5ZXJzXG4gICAgICAgICAgICAgICAgc2V0U3R5bGUgJy5lZGl0b3IgLmxheWVycyAnK3QsICd0cmFuc2l0aW9uJyBcImluaXRpYWxcIiBmb3IgdCBpbiB0cmFuc2lcbiAgICAgICAgICAgICAgICBAdXBkYXRlTGF5ZXJzKClcblxuICAgICAgICAgICAgaWYgY2VudGVyXG4gICAgICAgICAgICAgICAgb2Zmc2V0WCA9IEBzaXplLm9mZnNldFggLSBAc2l6ZS5udW1iZXJzV2lkdGggLSBAc2l6ZS5jaGFyV2lkdGgvMlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIG9mZnNldFggPSBNYXRoLmZsb29yIEBzaXplLmNoYXJXaWR0aC8yICsgQHNpemUubnVtYmVyc1dpZHRoXG4gICAgICAgICAgICAgICAgb2Zmc2V0WCAtPSBAc2l6ZS5udW1iZXJzV2lkdGggKyBAc2l6ZS5jaGFyV2lkdGgvMlxuICAgICAgICAgICAgICAgIG9mZnNldFggKj0gLTFcblxuICAgICAgICAgICAgc2V0U3R5bGUgJy5lZGl0b3IgLmxheWVycyAnK2wsICd0cmFuc2Zvcm0nIFwidHJhbnNsYXRlWCgje29mZnNldFh9cHgpXCIgZm9yIGwgaW4gbGF5ZXJzXG4gICAgICAgICAgICBzZXRTdHlsZSAnLmVkaXRvciAubGF5ZXJzICcrdCwgJ3RyYW5zaXRpb24nIFwiYWxsICN7YW5pbWF0ZS8xMDAwfXNcIiBmb3IgdCBpbiB0cmFuc2lcbiAgICAgICAgICAgIHNldFRpbWVvdXQgcmVzZXRUcmFucywgYW5pbWF0ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdXBkYXRlTGF5ZXJzKClcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMFxuXG4gICAgb25Db250ZXh0TWVudTogKGV2ZW50KSA9PiBzdG9wRXZlbnQgZXZlbnQsIEBzaG93Q29udGV4dE1lbnUga3BvcyBldmVudFxuXG4gICAgc2hvd0NvbnRleHRNZW51OiAoYWJzUG9zKSA9PlxuXG4gICAgICAgIGlmIG5vdCBhYnNQb3M/XG4gICAgICAgICAgICBhYnNQb3MgPSBrcG9zIEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQsIEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcFxuXG4gICAgICAgIG9wdCA9IGl0ZW1zOiBbXG4gICAgICAgICAgICB0ZXh0OiAgICdCcm93c2UnXG4gICAgICAgICAgICBjb21ibzogICdjb21tYW5kKy4nXG4gICAgICAgICAgICBhY2NlbDogICdjdHJsKy4nXG4gICAgICAgICAgICBjYjogICAgIC0+IHdpbmRvdy5jb21tYW5kbGluZS5zdGFydENvbW1hbmQgJ2Jyb3dzZSdcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnQmFjaydcbiAgICAgICAgICAgIGNvbWJvOiAgJ2NvbW1hbmQrMSdcbiAgICAgICAgICAgIGNiOiAgICAgLT4gcG9zdC5lbWl0ICdtZW51QWN0aW9uJyAnTmF2aWdhdGUgQmFja3dhcmQnXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJydcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnTWF4aW1pemUnXG4gICAgICAgICAgICBjb21ibzogICdjb21tYW5kK3NoaWZ0K3knXG4gICAgICAgICAgICBhY2NlbDogICdjdHJsK3NoaWZ0K3knXG4gICAgICAgICAgICBjYjogICAgIC0+IHdpbmRvdy5zcGxpdC5tYXhpbWl6ZUVkaXRvcigpXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJydcbiAgICAgICAgXVxuXG4gICAgICAgIG9wdC5pdGVtcyA9IG9wdC5pdGVtcy5jb25jYXQgd2luZG93LnRpdGxlYmFyLm1lbnVUZW1wbGF0ZSgpXG5cbiAgICAgICAgUmVjZW50TWVudSA9IFtdXG4gICAgICAgIFxuICAgICAgICBmaWxlU3BhbiA9IChmKSAtPlxuICAgICAgICAgICAgaWYgZj9cbiAgICAgICAgICAgICAgICBzcGFuICA9IFN5bnRheC5zcGFuRm9yVGV4dEFuZFN5bnRheCBzbGFzaC50aWxkZShzbGFzaC5kaXIoZikpLCAnYnJvd3NlcidcbiAgICAgICAgICAgICAgICBzcGFuICs9IFN5bnRheC5zcGFuRm9yVGV4dEFuZFN5bnRheCAnLycgKyBzbGFzaC5iYXNlKGYpLCAnYnJvd3NlcidcbiAgICAgICAgICAgIHJldHVybiBzcGFuXG4gICAgICAgIFxuICAgICAgICByZWNlbnQgPSB3aW5kb3cuc3RhdGU/LmdldCAncmVjZW50RmlsZXMnIFtdXG4gICAgICAgIHJlY2VudCA/PSBbXVxuICAgICAgICBmb3IgZiBpbiByZWNlbnRcbiAgICAgICAgICAgIGlmIGZzLmV4aXN0c1N5bmMgZlxuICAgICAgICAgICAgICAgIFJlY2VudE1lbnUudW5zaGlmdFxuICAgICAgICAgICAgICAgICAgICBodG1sOiBmaWxlU3BhbiBmXG4gICAgICAgICAgICAgICAgICAgIGFyZzogZlxuICAgICAgICAgICAgICAgICAgICBjYjogKGFyZykgLT4gcG9zdC5lbWl0ICduZXdUYWJXaXRoRmlsZScgYXJnXG4gICAgICAgIFxuICAgICAgICBnZXRNZW51ID0gKHRlbXBsYXRlLCBuYW1lKSAtPlxuICAgICAgICAgICAgZm9yIGl0ZW0gaW4gdGVtcGxhdGVcbiAgICAgICAgICAgICAgICBpZiBpdGVtLnRleHQgPT0gbmFtZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlbVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgUmVjZW50TWVudS5sZW5ndGhcbiAgICAgICAgICAgIFJlY2VudE1lbnUucHVzaCB0ZXh0OiAnJ1xuICAgICAgICAgICAgUmVjZW50TWVudS5wdXNoIHRleHQ6ICdDbGVhciBMaXN0J1xuICAgICAgICAgICAgZmlsZU1lbnUgPSBnZXRNZW51IG9wdC5pdGVtcywgJ0ZpbGUnXG4gICAgICAgICAgICBmaWxlTWVudS5tZW51ID0gW3t0ZXh0OidSZWNlbnQnIG1lbnU6UmVjZW50TWVudX0sIHt0ZXh0OicnfV0uY29uY2F0IGZpbGVNZW51Lm1lbnVcbiAgICAgICAgXG4gICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgb3B0LnkgPSBhYnNQb3MueVxuICAgICAgICBwb3B1cC5tZW51IG9wdFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGNsaWNrQXRQb3M6IChwLCBldmVudCkgLT5cblxuICAgICAgICBpZiBldmVudC5tZXRhS2V5XG4gICAgICAgICAgICBpZiBrcG9zKGV2ZW50KS54IDw9IEBzaXplLm51bWJlcnNXaWR0aFxuICAgICAgICAgICAgICAgIEBzaW5nbGVDdXJzb3JBdFBvcyBwXG4gICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgc3VwZXIgcCwgZXZlbnRcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDBcblxuICAgIGhhbmRsZU1vZEtleUNvbWJvQ2hhckV2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudCkgLT5cblxuICAgICAgICByZXR1cm4gaWYgJ3VuaGFuZGxlZCcgIT0gc3VwZXIgbW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2FsdCtjdHJsK2VudGVyJyAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuY29tbWFuZGxpbmUuY29tbWFuZHMuY29mZmVlLmV4ZWN1dGVUZXh0IEB0ZXh0T2ZTZWxlY3Rpb25Gb3JDbGlwYm9hcmQoKVxuICAgICAgICAgICAgd2hlbiAnYWx0K2N0cmwrc2hpZnQrZW50ZXInIHRoZW4gcmV0dXJuIHdpbmRvdy5jb21tYW5kbGluZS5jb21tYW5kcy5jb2ZmZWUuZXhlY3V0ZVRleHRJbk1haW4gQHRleHRPZlNlbGVjdGlvbkZvckNsaXBib2FyZHQoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCthbHQrdXAnICdhbHQrbycgdGhlbiByZXR1cm4gQGp1bXBUb0NvdW50ZXJwYXJ0KClcbiAgICAgICAgICAgIHdoZW4gJ2VzYydcbiAgICAgICAgICAgICAgICBzcGxpdCA9IHdpbmRvdy5zcGxpdFxuICAgICAgICAgICAgICAgIGlmIHNwbGl0LnRlcm1pbmFsVmlzaWJsZSgpXG4gICAgICAgICAgICAgICAgICAgIHNwbGl0LmhpZGVUZXJtaW5hbCgpXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBzcGxpdC5jb21tYW5kbGluZVZpc2libGUoKVxuICAgICAgICAgICAgICAgICAgICBzcGxpdC5oaWRlQ29tbWFuZGxpbmUoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAndW5oYW5kbGVkJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVFZGl0b3JcbiJdfQ==
//# sourceURL=../../coffee/editor/fileeditor.coffee