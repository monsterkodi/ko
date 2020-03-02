// koffee 1.7.0

/*
00000000  000  000      00000000        00000000  0000000    000  000000000   0000000   00000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000000    000  000      0000000         0000000   000   000  000     000     000   000  0000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000       000  0000000  00000000        00000000  0000000    000     000      0000000   000   000
 */
var FileEditor, Syntax, TextEditor, Watcher, _, clamp, electron, empty, kerror, kpos, popup, post, ref, setStyle, slash, srcmap, stopEvent, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf;

ref = require('kxk'), _ = ref._, clamp = ref.clamp, empty = ref.empty, kerror = ref.kerror, kpos = ref.kpos, popup = ref.popup, post = ref.post, setStyle = ref.setStyle, slash = ref.slash, srcmap = ref.srcmap, stopEvent = ref.stopEvent, valid = ref.valid;

Watcher = require('../tools/watcher');

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
        this.watch = null;
        this.view.addEventListener("contextmenu", this.onContextMenu);
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
        dirty = this["do"].hasLineChanges();
        if (this.dirty !== dirty) {
            this.dirty = dirty;
            return post.emit('dirty', this.dirty);
        }
    };

    FileEditor.prototype.clear = function() {
        var ref1, ref2;
        this.dirty = false;
        this.setSalterMode(false);
        this.stopWatcher();
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
        this.stopWatcher();
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
            this.watch = new Watcher(this.currentFile);
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

    FileEditor.prototype.stopWatcher = function() {
        var ref1;
        if ((ref1 = this.watch) != null) {
            ref1.stop();
        }
        return this.watch = null;
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
        if (!_.isPlainObject(filePositions)) {
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
        if (_.isObject(word) && (opt == null)) {
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
                if (file != null) {
                    post.emit('loadFile', slash.joinFileLine(file, line, col));
                    return true;
                }
                break;
            case 'js':
                ref2 = srcmap.toCoffee(this.currentFile, cp[1] + 1, cp[0]), file = ref2[0], line = ref2[1], col = ref2[2];
                if (valid(file) && slash.fileExists(file)) {
                    post.emit('loadFile', slash.joinFileLine(file, line, col));
                    return true;
                }
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
                offsetX = Math.max(offsetX, (this.screenSize().width - this.screenSize().height) / 2);
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
        var opt;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsNklBQUE7SUFBQTs7Ozs7QUFRQSxNQUE0RixPQUFBLENBQVEsS0FBUixDQUE1RixFQUFFLFNBQUYsRUFBSyxpQkFBTCxFQUFZLGlCQUFaLEVBQW1CLG1CQUFuQixFQUEyQixlQUEzQixFQUFpQyxpQkFBakMsRUFBd0MsZUFBeEMsRUFBOEMsdUJBQTlDLEVBQXdELGlCQUF4RCxFQUErRCxtQkFBL0QsRUFBdUUseUJBQXZFLEVBQWtGOztBQUVsRixPQUFBLEdBQWEsT0FBQSxDQUFRLGtCQUFSOztBQUNiLFVBQUEsR0FBYSxPQUFBLENBQVEsY0FBUjs7QUFDYixNQUFBLEdBQWEsT0FBQSxDQUFRLFVBQVI7O0FBQ2IsUUFBQSxHQUFhLE9BQUEsQ0FBUSxVQUFSOztBQUVQOzs7SUFFQyxvQkFBQyxRQUFEOzs7Ozs7UUFFQyw0Q0FBTSxRQUFOLEVBQ0k7WUFBQSxRQUFBLEVBQVUsQ0FDTixTQURNLEVBRU4sV0FGTSxFQUdOLFNBSE0sRUFJTixTQUpNLEVBS04sTUFMTSxFQU1OLGNBTk0sRUFPTixVQVBNLEVBUU4sU0FSTSxFQVNOLFlBVE0sQ0FBVjtZQVdBLFFBQUEsRUFBVSxFQVhWO1NBREo7UUFjQSxJQUFDLENBQUEsV0FBRCxHQUFlO1FBQ2YsSUFBQyxDQUFBLEtBQUQsR0FBZTtRQUVmLElBQUMsQ0FBQSxJQUFJLENBQUMsZ0JBQU4sQ0FBdUIsYUFBdkIsRUFBc0MsSUFBQyxDQUFBLGFBQXZDO1FBRUEsSUFBSSxDQUFDLEVBQUwsQ0FBUSxhQUFSLEVBQXdCLElBQUMsQ0FBQSxhQUF6QjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsUUFBUixFQUF3QixJQUFDLENBQUEsTUFBekI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFlBQVIsRUFBd0IsSUFBQyxDQUFBLFVBQXpCO1FBRUEsSUFBQyxDQUFBLFlB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LFlBQTFCO2dCQUNJLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixDQUFuQjtBQUNBLHVCQUZKO2FBREo7O2VBS0EsMkNBQU0sQ0FBTixFQUFTLEtBQVQ7SUFQUTs7eUJBZVosMEJBQUEsR0FBNEIsU0FBQyxHQUFELEVBQU0sR0FBTixFQUFXLEtBQVgsRUFBa0IsSUFBbEIsRUFBd0IsS0FBeEI7QUFFeEIsWUFBQTtRQUFBLElBQVUsV0FBQSxLQUFlLDJEQUFNLEdBQU4sRUFBVyxHQUFYLEVBQWdCLEtBQWhCLEVBQXVCLElBQXZCLEVBQTZCLEtBQTdCLENBQXpCO0FBQUEsbUJBQUE7O0FBQ0EsZ0JBQU8sS0FBUDtBQUFBLGlCQUNTLGdCQURUO0FBQ3FDLHVCQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFuQyxDQUErQyxJQUFDLENBQUEsMkJBQUQsQ0FBQSxDQUEvQztBQUQ1QyxpQkFFUyxzQkFGVDtBQUVxQyx1QkFBTyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsaUJBQW5DLENBQXFELElBQUMsQ0FBQSw0QkFBRCxDQUFBLENBQXJEO0FBRjVDLGlCQUdTLGdCQUhUO0FBQUEsaUJBRzBCLE9BSDFCO0FBR3VDLHVCQUFPLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0FBSDlDLGlCQUlTLEtBSlQ7Z0JBS1EsS0FBQSxHQUFRLE1BQU0sQ0FBQztnQkFDZixJQUFHLEtBQUssQ0FBQyxlQUFOLENBQUEsQ0FBSDtvQkFDSSxLQUFLLENBQUMsWUFBTixDQUFBLEVBREo7aUJBQUEsTUFFSyxJQUFHLEtBQUssQ0FBQyxrQkFBTixDQUFBLENBQUg7b0JBQ0QsS0FBSyxDQUFDLGVBQU4sQ0FBQSxFQURDOztBQUVMO0FBVlI7ZUFXQTtJQWR3Qjs7OztHQTViUDs7QUE0Y3pCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4jIyNcblxueyBfLCBjbGFtcCwgZW1wdHksIGtlcnJvciwga3BvcywgcG9wdXAsIHBvc3QsIHNldFN0eWxlLCBzbGFzaCwgc3JjbWFwLCBzdG9wRXZlbnQsIHZhbGlkIH0gPSByZXF1aXJlICdreGsnXG5cbldhdGNoZXIgICAgPSByZXF1aXJlICcuLi90b29scy93YXRjaGVyJ1xuVGV4dEVkaXRvciA9IHJlcXVpcmUgJy4vdGV4dGVkaXRvcidcblN5bnRheCAgICAgPSByZXF1aXJlICcuL3N5bnRheCdcbmVsZWN0cm9uICAgPSByZXF1aXJlICdlbGVjdHJvbidcblxuY2xhc3MgRmlsZUVkaXRvciBleHRlbmRzIFRleHRFZGl0b3JcblxuICAgIEA6ICh2aWV3RWxlbSkgLT5cblxuICAgICAgICBzdXBlciB2aWV3RWxlbSxcbiAgICAgICAgICAgIGZlYXR1cmVzOiBbXG4gICAgICAgICAgICAgICAgJ0RpZmZiYXInXG4gICAgICAgICAgICAgICAgJ1Njcm9sbGJhcidcbiAgICAgICAgICAgICAgICAnTnVtYmVycydcbiAgICAgICAgICAgICAgICAnTWluaW1hcCdcbiAgICAgICAgICAgICAgICAnTWV0YSdcbiAgICAgICAgICAgICAgICAnQXV0b2NvbXBsZXRlJ1xuICAgICAgICAgICAgICAgICdCcmFja2V0cydcbiAgICAgICAgICAgICAgICAnU3RyaW5ncydcbiAgICAgICAgICAgICAgICAnQ3Vyc29yTGluZSdcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBmb250U2l6ZTogMTlcblxuICAgICAgICBAY3VycmVudEZpbGUgPSBudWxsXG4gICAgICAgIEB3YXRjaCAgICAgICA9IG51bGxcblxuICAgICAgICBAdmlldy5hZGRFdmVudExpc3RlbmVyIFwiY29udGV4dG1lbnVcIiwgQG9uQ29udGV4dE1lbnVcblxuICAgICAgICBwb3N0Lm9uICdjb21tYW5kbGluZScgICBAb25Db21tYW5kbGluZVxuICAgICAgICBwb3N0Lm9uICdqdW1wVG8nICAgICAgICBAanVtcFRvXG4gICAgICAgIHBvc3Qub24gJ2p1bXBUb0ZpbGUnICAgIEBqdW1wVG9GaWxlXG5cbiAgICAgICAgQGluaXRQaWdtZW50cygpXG4gICAgICAgIEBpbml0SW52aXNpYmxlcygpXG5cbiAgICAgICAgQHNldFRleHQgJydcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBjaGFuZ2VkOiAoY2hhbmdlSW5mbykgLT5cblxuICAgICAgICBzdXBlciBjaGFuZ2VJbmZvXG4gICAgICAgIGRpcnR5ID0gQGRvLmhhc0xpbmVDaGFuZ2VzKClcbiAgICAgICAgaWYgQGRpcnR5ICE9IGRpcnR5XG4gICAgICAgICAgICBAZGlydHkgPSBkaXJ0eVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdkaXJ0eScgQGRpcnR5XG5cbiAgICAjIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIGNsZWFyOiAtPlxuXG4gICAgICAgIEBkaXJ0eSA9IGZhbHNlXG4gICAgICAgIEBzZXRTYWx0ZXJNb2RlIGZhbHNlXG4gICAgICAgIEBzdG9wV2F0Y2hlcigpXG4gICAgICAgIEBkaWZmYmFyPy5jbGVhcigpXG4gICAgICAgIEBtZXRhPy5jbGVhcigpXG4gICAgICAgIEBzZXRMaW5lcyBbJyddXG4gICAgICAgIEBkby5yZXNldCgpXG5cbiAgICBzZXRDdXJyZW50RmlsZTogKGZpbGUsIHJlc3RvcmVTdGF0ZSkgLT5cblxuICAgICAgICAjIGtsb2cgJ3NldEN1cnJlbnRGaWxlJyBmaWxlXG4gICAgICAgIFxuICAgICAgICBAY2xlYXIoKVxuICAgICAgICBAc3RvcFdhdGNoZXIoKVxuXG4gICAgICAgIEBjdXJyZW50RmlsZSA9IGZpbGVcblxuICAgICAgICBAc2V0dXBGaWxlVHlwZSgpXG5cbiAgICAgICAgZmlsZUV4aXN0cyA9IEBjdXJyZW50RmlsZT8gYW5kIHNsYXNoLmZpbGVFeGlzdHMgQGN1cnJlbnRGaWxlXG5cbiAgICAgICAgaWYgcmVzdG9yZVN0YXRlXG4gICAgICAgICAgICBAc2V0VGV4dCByZXN0b3JlU3RhdGUudGV4dCgpXG4gICAgICAgICAgICBAc3RhdGUgPSByZXN0b3JlU3RhdGVcbiAgICAgICAgICAgIEBkaXJ0eSA9IHRydWVcbiAgICAgICAgZWxzZSBpZiBmaWxlRXhpc3RzXG4gICAgICAgICAgICBAc2V0VGV4dCBzbGFzaC5yZWFkVGV4dCBAY3VycmVudEZpbGVcblxuICAgICAgICBpZiBmaWxlRXhpc3RzXG4gICAgICAgICAgICBAd2F0Y2ggPSBuZXcgV2F0Y2hlciBAY3VycmVudEZpbGVcbiAgICAgICAgICAgIHdpbmRvdy50YWJzLmFjdGl2ZVRhYigpPy5zZXRGaWxlIEBjdXJyZW50RmlsZVxuICAgICAgICAgICAgXG4gICAgICAgIHBvc3QuZW1pdCAnZmlsZScgQGN1cnJlbnRGaWxlICMgYnJvd3NlciAmIHNoZWxmXG5cbiAgICAgICAgQGVtaXQgJ2ZpbGUnIEBjdXJyZW50RmlsZSAjIGRpZmZiYXIsIHBpZ21lbnRzLCAuLi5cblxuICAgICAgICBwb3N0LmVtaXQgJ2RpcnR5JyBAZGlydHlcblxuICAgIGN1cnJlbnREaXI6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAY3VycmVudEZpbGU/IGFuZCBzbGFzaC5maWxlRXhpc3RzIEBjdXJyZW50RmlsZVxuICAgICAgICAgICAgc2xhc2guZGlyIEBjdXJyZW50RmlsZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzbGFzaC5wYXRoIHByb2Nlc3MuY3dkKClcbiAgICAgICAgXG4gICAgcmVzdG9yZUZyb21UYWJTdGF0ZTogKHRhYlN0YXRlKSAtPlxuXG4gICAgICAgIHJldHVybiBrZXJyb3IgXCJubyB0YWJTdGF0ZS5maWxlP1wiIGlmIG5vdCB0YWJTdGF0ZS5maWxlP1xuICAgICAgICBAc2V0Q3VycmVudEZpbGUgdGFiU3RhdGUuZmlsZSwgdGFiU3RhdGUuc3RhdGVcblxuICAgIHN0b3BXYXRjaGVyOiAtPlxuXG4gICAgICAgIEB3YXRjaD8uc3RvcCgpXG4gICAgICAgIEB3YXRjaCA9IG51bGxcblxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgIDAwMCAwMDAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgICAgMDAwICAgICAgIDAwMDAwICAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAwMDAwMFxuXG4gICAgc2hlYmFuZ0ZpbGVUeXBlOiAtPlxuXG4gICAgICAgIGZpbGVUeXBlID0gU3ludGF4LnNoZWJhbmcgQGxpbmUoMCkgaWYgQG51bUxpbmVzKClcbiAgICAgICAgaWYgZmlsZVR5cGUgPT0gJ3R4dCdcbiAgICAgICAgICAgIGlmIEBjdXJyZW50RmlsZT9cbiAgICAgICAgICAgICAgICBleHQgPSBzbGFzaC5leHQgQGN1cnJlbnRGaWxlXG4gICAgICAgICAgICAgICAgaWYgZXh0IGluIFN5bnRheC5zeW50YXhOYW1lc1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXh0XG4gICAgICAgIGVsc2UgaWYgZmlsZVR5cGVcbiAgICAgICAgICAgIHJldHVybiBmaWxlVHlwZVxuXG4gICAgICAgIHN1cGVyKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcblxuICAgIG9uQ29tbWFuZGxpbmU6IChlKSA9PlxuXG4gICAgICAgIHN3aXRjaCBlXG4gICAgICAgICAgICB3aGVuICdoaWRkZW4nICdzaG93bidcbiAgICAgICAgICAgICAgICBkID0gd2luZG93LnNwbGl0LmNvbW1hbmRsaW5lSGVpZ2h0ICsgd2luZG93LnNwbGl0LmhhbmRsZUhlaWdodFxuICAgICAgICAgICAgICAgIGQgPSBNYXRoLm1pbiBkLCBAc2Nyb2xsLnNjcm9sbE1heCAtIEBzY3JvbGwuc2Nyb2xsXG4gICAgICAgICAgICAgICAgZCAqPSAtMSBpZiBlID09ICdoaWRkZW4nXG4gICAgICAgICAgICAgICAgQHNjcm9sbC5ieSBkXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMDAwMDAwXG5cbiAgICBzYXZlU2Nyb2xsQ3Vyc29yc0FuZFNlbGVjdGlvbnM6IChvcHQpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY3VycmVudEZpbGVcbiAgICAgICAgcyA9IHt9XG5cbiAgICAgICAgcy5tYWluICAgICAgID0gQHN0YXRlLm1haW4oKVxuICAgICAgICBzLmN1cnNvcnMgICAgPSBAc3RhdGUuY3Vyc29ycygpICAgIGlmIEBudW1DdXJzb3JzKCkgPiAxIG9yIEBjdXJzb3JQb3MoKVswXSBvciBAY3Vyc29yUG9zKClbMV1cbiAgICAgICAgcy5zZWxlY3Rpb25zID0gQHN0YXRlLnNlbGVjdGlvbnMoKSBpZiBAbnVtU2VsZWN0aW9ucygpXG4gICAgICAgIHMuaGlnaGxpZ2h0cyA9IEBzdGF0ZS5oaWdobGlnaHRzKCkgaWYgQG51bUhpZ2hsaWdodHMoKVxuXG4gICAgICAgIHMuc2Nyb2xsID0gQHNjcm9sbC5zY3JvbGwgaWYgQHNjcm9sbC5zY3JvbGxcblxuICAgICAgICBmaWxlUG9zaXRpb25zID0gd2luZG93LnN0YXNoLmdldCAnZmlsZVBvc2l0aW9ucycgT2JqZWN0LmNyZWF0ZSBudWxsXG4gICAgICAgIGlmIG5vdCBfLmlzUGxhaW5PYmplY3QgZmlsZVBvc2l0aW9uc1xuICAgICAgICAgICAgZmlsZVBvc2l0aW9ucyA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICBmaWxlUG9zaXRpb25zW0BjdXJyZW50RmlsZV0gPSBzXG4gICAgICAgIHdpbmRvdy5zdGFzaC5zZXQgJ2ZpbGVQb3NpdGlvbnMnIGZpbGVQb3NpdGlvbnNcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG5cbiAgICByZXN0b3JlU2Nyb2xsQ3Vyc29yc0FuZFNlbGVjdGlvbnM6IC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY3VycmVudEZpbGVcbiAgICAgICAgXG4gICAgICAgIGZpbGVQb3NpdGlvbnMgPSB3aW5kb3cuc3Rhc2guZ2V0ICdmaWxlUG9zaXRpb25zJyB7fVxuXG4gICAgICAgIGlmIGZpbGVQb3NpdGlvbnNbQGN1cnJlbnRGaWxlXT9cblxuICAgICAgICAgICAgcyA9IGZpbGVQb3NpdGlvbnNbQGN1cnJlbnRGaWxlXVxuXG4gICAgICAgICAgICBjdXJzb3JzID0gcy5jdXJzb3JzID8gW1swLDBdXVxuICAgICAgICAgICAgY3Vyc29ycyA9IGN1cnNvcnMubWFwIChjKSA9PiBbY1swXSwgY2xhbXAoMCxAbnVtTGluZXMoKS0xLGNbMV0pXVxuXG4gICAgICAgICAgICBAc2V0Q3Vyc29ycyAgICBjdXJzb3JzXG4gICAgICAgICAgICBAc2V0U2VsZWN0aW9ucyBzLnNlbGVjdGlvbnMgPyBbXVxuICAgICAgICAgICAgQHNldEhpZ2hsaWdodHMgcy5oaWdobGlnaHRzID8gW11cbiAgICAgICAgICAgIEBzZXRNYWluICAgICAgIHMubWFpbiA/IDBcbiAgICAgICAgICAgIEBzZXRTdGF0ZSBAc3RhdGVcblxuICAgICAgICAgICAgQHNjcm9sbC50byBzLnNjcm9sbCBpZiBzLnNjcm9sbFxuICAgICAgICAgICAgQHNjcm9sbC5jdXJzb3JJbnRvVmlldygpXG5cbiAgICAgICAgZWxzZVxuXG4gICAgICAgICAgICBAc2luZ2xlQ3Vyc29yQXRQb3MgWzAsMF1cbiAgICAgICAgICAgIEBzY3JvbGwudG9wID0gMCBpZiBAbWFpbkN1cnNvcigpWzFdID09IDBcbiAgICAgICAgICAgIEBzY3JvbGwuYm90ID0gQHNjcm9sbC50b3AtMVxuICAgICAgICAgICAgQHNjcm9sbC50byAwXG4gICAgICAgICAgICBAc2Nyb2xsLmN1cnNvckludG9WaWV3KClcblxuICAgICAgICBAdXBkYXRlTGF5ZXJzKClcbiAgICAgICAgQG51bWJlcnM/LnVwZGF0ZUNvbG9ycygpXG4gICAgICAgIEBtaW5pbWFwLm9uRWRpdG9yU2Nyb2xsKClcbiAgICAgICAgQGVtaXQgJ2N1cnNvcidcbiAgICAgICAgQGVtaXQgJ3NlbGVjdGlvbidcblxuICAgICMgICAgICAgMDAwICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwMDAwMDBcbiAgICAjICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwXG5cbiAgICBqdW1wVG9GaWxlOiAob3B0KSA9PlxuXG4gICAgICAgIHdpbmRvdy50YWJzLmFjdGl2ZVRhYiB0cnVlXG5cbiAgICAgICAgaWYgb3B0Lm5ld1RhYlxuXG4gICAgICAgICAgICBmaWxlID0gb3B0LmZpbGVcbiAgICAgICAgICAgIGZpbGUgKz0gJzonICsgb3B0LmxpbmUgaWYgb3B0LmxpbmVcbiAgICAgICAgICAgIGZpbGUgKz0gJzonICsgb3B0LmNvbCBpZiBvcHQuY29sXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ25ld1RhYldpdGhGaWxlJyBmaWxlXG5cbiAgICAgICAgZWxzZVxuXG4gICAgICAgICAgICBbZmlsZSwgZnBvc10gPSBzbGFzaC5zcGxpdEZpbGVQb3Mgb3B0LmZpbGVcbiAgICAgICAgICAgIG9wdC5wb3MgPSBmcG9zXG4gICAgICAgICAgICBvcHQucG9zWzBdID0gb3B0LmNvbCBpZiBvcHQuY29sXG4gICAgICAgICAgICBvcHQucG9zWzFdID0gb3B0LmxpbmUtMSBpZiBvcHQubGluZVxuICAgICAgICAgICAgb3B0LndpbklEICA9IHdpbmRvdy53aW5JRFxuXG4gICAgICAgICAgICBvcHQub2xkUG9zID0gQGN1cnNvclBvcygpXG4gICAgICAgICAgICBvcHQub2xkRmlsZSA9IEBjdXJyZW50RmlsZVxuICAgICAgICAgICAgd2luZG93Lm5hdmlnYXRlLmdvdG9GaWxlUG9zIG9wdFxuXG4gICAganVtcFRvOiAod29yZCwgb3B0KSA9PlxuXG4gICAgICAgIGlmIF8uaXNPYmplY3Qod29yZCkgYW5kIG5vdCBvcHQ/XG4gICAgICAgICAgICBvcHQgID0gd29yZFxuICAgICAgICAgICAgd29yZCA9IG9wdC53b3JkXG5cbiAgICAgICAgb3B0ID89IHt9XG5cbiAgICAgICAgaWYgb3B0LmZpbGU/XG4gICAgICAgICAgICBAanVtcFRvRmlsZSBvcHRcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciAnbm90aGluZyB0byBqdW1wIHRvPycgaWYgZW1wdHkgd29yZFxuXG4gICAgICAgIGZpbmQgPSB3b3JkLnRvTG93ZXJDYXNlKCkudHJpbSgpXG4gICAgICAgIGZpbmQgPSBmaW5kLnNsaWNlIDEgaWYgZmluZFswXSA9PSAnQCdcblxuICAgICAgICByZXR1cm4ga2Vycm9yICdGaWxlRWRpdG9yLmp1bXBUbyAtLSBub3RoaW5nIHRvIGZpbmQ/JyBpZiBlbXB0eSBmaW5kXG5cbiAgICAgICAgdHlwZSA9IG9wdD8udHlwZVxuXG4gICAgICAgIGlmIG5vdCB0eXBlIG9yIHR5cGUgPT0gJ2NsYXNzJ1xuICAgICAgICAgICAgY2xhc3NlcyA9IHBvc3QuZ2V0ICdpbmRleGVyJyAnY2xhc3NlcydcbiAgICAgICAgICAgIGZvciBjbHNzLCBpbmZvIG9mIGNsYXNzZXNcbiAgICAgICAgICAgICAgICBpZiBjbHNzLnRvTG93ZXJDYXNlKCkgPT0gZmluZFxuICAgICAgICAgICAgICAgICAgICBAanVtcFRvRmlsZSBpbmZvXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAgICAgaWYgbm90IHR5cGUgb3IgdHlwZSA9PSAnZnVuYydcbiAgICAgICAgICAgIGZ1bmNzID0gcG9zdC5nZXQgJ2luZGV4ZXInICdmdW5jcydcbiAgICAgICAgICAgIGZvciBmdW5jLCBpbmZvcyBvZiBmdW5jc1xuICAgICAgICAgICAgICAgIGlmIGZ1bmMudG9Mb3dlckNhc2UoKSA9PSBmaW5kXG4gICAgICAgICAgICAgICAgICAgIGluZm8gPSBpbmZvc1swXVxuICAgICAgICAgICAgICAgICAgICBmb3IgaSBpbiBpbmZvc1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgaS5maWxlID09IEBjdXJyZW50RmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8gPSBpXG4gICAgICAgICAgICAgICAgICAgIEBqdW1wVG9GaWxlIGluZm9cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgICBpZiBub3QgdHlwZSBvciB0eXBlID09ICdmaWxlJ1xuICAgICAgICAgICAgZmlsZXMgPSBwb3N0LmdldCAnaW5kZXhlcicgJ2ZpbGVzJ1xuICAgICAgICAgICAgZm9yIGZpbGUsIGluZm8gb2YgZmlsZXNcbiAgICAgICAgICAgICAgICBpZiBzbGFzaC5iYXNlKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT0gZmluZCBhbmQgZmlsZSAhPSBAY3VycmVudEZpbGVcbiAgICAgICAgICAgICAgICAgICAgQGp1bXBUb0ZpbGUgZmlsZTpmaWxlLCBsaW5lOjZcblxuICAgICAgICB3aW5kb3cuY29tbWFuZGxpbmUuY29tbWFuZHMuc2VhcmNoLnN0YXJ0ICdzZWFyY2gnXG4gICAgICAgIHdpbmRvdy5jb21tYW5kbGluZS5jb21tYW5kcy5zZWFyY2guZXhlY3V0ZSB3b3JkXG5cbiAgICAgICAgd2luZG93LnNwbGl0LmRvICdzaG93IHRlcm1pbmFsJ1xuXG4gICAgICAgIHRydWVcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIGp1bXBUb0NvdW50ZXJwYXJ0OiAoKSAtPlxuXG4gICAgICAgIGNwID0gQGN1cnNvclBvcygpXG4gICAgICAgIGN1cnJleHQgPSBzbGFzaC5leHQgQGN1cnJlbnRGaWxlXG5cbiAgICAgICAgc3dpdGNoIGN1cnJleHRcbiAgICAgICAgICAgIHdoZW4gJ2NvZmZlZScgJ2tvZmZlZSdcbiAgICAgICAgICAgICAgICBbZmlsZSxsaW5lLGNvbF0gPSBzcmNtYXAudG9KcyBAY3VycmVudEZpbGUsIGNwWzFdKzEsIGNwWzBdXG4gICAgICAgICAgICAgICAgaWYgZmlsZT9cbiAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdsb2FkRmlsZScgc2xhc2guam9pbkZpbGVMaW5lIGZpbGUsbGluZSxjb2xcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIHdoZW4gJ2pzJ1xuICAgICAgICAgICAgICAgIFtmaWxlLGxpbmUsY29sXSA9IHNyY21hcC50b0NvZmZlZSBAY3VycmVudEZpbGUsIGNwWzFdKzEsIGNwWzBdXG4gICAgICAgICAgICAgICAgaWYgdmFsaWQoZmlsZSkgYW5kIHNsYXNoLmZpbGVFeGlzdHMgZmlsZVxuICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJyBzbGFzaC5qb2luRmlsZUxpbmUgZmlsZSxsaW5lLGNvbFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgICAgIGNvdW50ZXJwYXJ0cyA9XG4gICAgICAgICAgICBjcHA6ICAgICBbJ2hwcCcgJ2gnXVxuICAgICAgICAgICAgY2M6ICAgICAgWydocHAnICdoJ11cbiAgICAgICAgICAgIGg6ICAgICAgIFsnY3BwJyAnYyddXG4gICAgICAgICAgICBocHA6ICAgICBbJ2NwcCcgJ2MnXVxuICAgICAgICAgICAgY29mZmVlOiAgWydqcyddXG4gICAgICAgICAgICBrb2ZmZWU6ICBbJ2pzJ11cbiAgICAgICAgICAgIGpzOiAgICAgIFsnY29mZmVlJydrb2ZmZWUnXVxuICAgICAgICAgICAgcHVnOiAgICAgWydodG1sJ11cbiAgICAgICAgICAgIGh0bWw6ICAgIFsncHVnJ11cbiAgICAgICAgICAgIGNzczogICAgIFsnc3R5bCddXG4gICAgICAgICAgICBzdHlsOiAgICBbJ2NzcyddXG5cbiAgICAgICAgZm9yIGV4dCBpbiAoY291bnRlcnBhcnRzW2N1cnJleHRdID8gW10pXG4gICAgICAgICAgICBpZiBzbGFzaC5maWxlRXhpc3RzIHNsYXNoLnN3YXBFeHQgQGN1cnJlbnRGaWxlLCBleHRcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJyBzbGFzaC5zd2FwRXh0IEBjdXJyZW50RmlsZSwgZXh0XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgICBmb3IgZXh0IGluIChjb3VudGVycGFydHNbY3VycmV4dF0gPyBbXSlcbiAgICAgICAgICAgIGNvdW50ZXIgPSBzbGFzaC5zd2FwRXh0IEBjdXJyZW50RmlsZSwgZXh0XG4gICAgICAgICAgICBjb3VudGVyID0gY291bnRlci5yZXBsYWNlIFwiLyN7Y3VycmV4dH0vXCIgXCIvI3tleHR9L1wiXG4gICAgICAgICAgICBpZiBzbGFzaC5maWxlRXhpc3RzIGNvdW50ZXJcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJyBjb3VudGVyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZmFsc2VcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY2VudGVyVGV4dDogKGNlbnRlciwgYW5pbWF0ZT0zMDApIC0+XG5cbiAgICAgICAgQHNpemUuY2VudGVyVGV4dCA9IGNlbnRlclxuICAgICAgICBAdXBkYXRlTGF5ZXJzKClcblxuICAgICAgICBAc2l6ZS5vZmZzZXRYID0gTWF0aC5mbG9vciBAc2l6ZS5jaGFyV2lkdGgvMiArIEBzaXplLm51bWJlcnNXaWR0aFxuICAgICAgICBpZiBjZW50ZXJcbiAgICAgICAgICAgIGJyICAgICAgICA9IEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICB2aXNDb2xzICAgPSBwYXJzZUludCBici53aWR0aCAvIEBzaXplLmNoYXJXaWR0aFxuICAgICAgICAgICAgbmV3T2Zmc2V0ID0gcGFyc2VJbnQgQHNpemUuY2hhcldpZHRoICogKHZpc0NvbHMgLSAxMDApIC8gMlxuICAgICAgICAgICAgQHNpemUub2Zmc2V0WCA9IE1hdGgubWF4IEBzaXplLm9mZnNldFgsIG5ld09mZnNldFxuICAgICAgICAgICAgQHNpemUuY2VudGVyVGV4dCA9IHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHNpemUuY2VudGVyVGV4dCA9IGZhbHNlXG5cbiAgICAgICAgQHVwZGF0ZUxpbmVQb3NpdGlvbnMgYW5pbWF0ZVxuXG4gICAgICAgIGlmIGFuaW1hdGVcbiAgICAgICAgICAgIGxheWVycyA9IFsnLnNlbGVjdGlvbnMnICcuaGlnaGxpZ2h0cycgJy5jdXJzb3JzJ11cbiAgICAgICAgICAgIHRyYW5zaSA9IFsnLnNlbGVjdGlvbicgICcuaGlnaGxpZ2h0JyAgJy5jdXJzb3InIF0uY29uY2F0IGxheWVyc1xuICAgICAgICAgICAgcmVzZXRUcmFucyA9ID0+XG4gICAgICAgICAgICAgICAgc2V0U3R5bGUgJy5lZGl0b3IgLmxheWVycyAnK2wsICd0cmFuc2Zvcm0nIFwidHJhbnNsYXRlWCgwKVwiIGZvciBsIGluIGxheWVyc1xuICAgICAgICAgICAgICAgIHNldFN0eWxlICcuZWRpdG9yIC5sYXllcnMgJyt0LCAndHJhbnNpdGlvbicgXCJpbml0aWFsXCIgZm9yIHQgaW4gdHJhbnNpXG4gICAgICAgICAgICAgICAgQHVwZGF0ZUxheWVycygpXG5cbiAgICAgICAgICAgIGlmIGNlbnRlclxuICAgICAgICAgICAgICAgIG9mZnNldFggPSBAc2l6ZS5vZmZzZXRYIC0gQHNpemUubnVtYmVyc1dpZHRoIC0gQHNpemUuY2hhcldpZHRoLzJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBvZmZzZXRYID0gTWF0aC5mbG9vciBAc2l6ZS5jaGFyV2lkdGgvMiArIEBzaXplLm51bWJlcnNXaWR0aFxuICAgICAgICAgICAgICAgIG9mZnNldFggPSBNYXRoLm1heCBvZmZzZXRYLCAoQHNjcmVlblNpemUoKS53aWR0aCAtIEBzY3JlZW5TaXplKCkuaGVpZ2h0KSAvIDJcbiAgICAgICAgICAgICAgICBvZmZzZXRYIC09IEBzaXplLm51bWJlcnNXaWR0aCArIEBzaXplLmNoYXJXaWR0aC8yXG4gICAgICAgICAgICAgICAgb2Zmc2V0WCAqPSAtMVxuXG4gICAgICAgICAgICBzZXRTdHlsZSAnLmVkaXRvciAubGF5ZXJzICcrbCwgJ3RyYW5zZm9ybScgXCJ0cmFuc2xhdGVYKCN7b2Zmc2V0WH1weClcIiBmb3IgbCBpbiBsYXllcnNcbiAgICAgICAgICAgIHNldFN0eWxlICcuZWRpdG9yIC5sYXllcnMgJyt0LCAndHJhbnNpdGlvbicgXCJhbGwgI3thbmltYXRlLzEwMDB9c1wiIGZvciB0IGluIHRyYW5zaVxuICAgICAgICAgICAgc2V0VGltZW91dCByZXNldFRyYW5zLCBhbmltYXRlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB1cGRhdGVMYXllcnMoKVxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwXG5cbiAgICBvbkNvbnRleHRNZW51OiAoZXZlbnQpID0+IHN0b3BFdmVudCBldmVudCwgQHNob3dDb250ZXh0TWVudSBrcG9zIGV2ZW50XG5cbiAgICBzaG93Q29udGV4dE1lbnU6IChhYnNQb3MpID0+XG5cbiAgICAgICAgaWYgbm90IGFic1Bvcz9cbiAgICAgICAgICAgIGFic1BvcyA9IGtwb3MgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCwgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG5cbiAgICAgICAgb3B0ID0gaXRlbXM6IFtcbiAgICAgICAgICAgIHRleHQ6ICAgJ0Jyb3dzZSdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2NvbW1hbmQrLidcbiAgICAgICAgICAgIGFjY2VsOiAgJ2N0cmwrLidcbiAgICAgICAgICAgIGNiOiAgICAgLT4gd2luZG93LmNvbW1hbmRsaW5lLnN0YXJ0Q29tbWFuZCAnYnJvd3NlJ1xuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdCYWNrJ1xuICAgICAgICAgICAgY29tYm86ICAnY29tbWFuZCsxJ1xuICAgICAgICAgICAgY2I6ICAgICAtPiBwb3N0LmVtaXQgJ21lbnVBY3Rpb24nICdOYXZpZ2F0ZSBCYWNrd2FyZCcgIyBmaXggbWUhIGluIHNhbWUgZmlsZSBuYXZpZ2F0aW9uIVxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICcnXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ01heGltaXplJ1xuICAgICAgICAgICAgY29tYm86ICAnY29tbWFuZCtzaGlmdCt5J1xuICAgICAgICAgICAgYWNjZWw6ICAnY3RybCtzaGlmdCt5J1xuICAgICAgICAgICAgY2I6ICAgICAtPiB3aW5kb3cuc3BsaXQubWF4aW1pemVFZGl0b3IoKVxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICcnXG4gICAgICAgIF1cblxuICAgICAgICBvcHQuaXRlbXMgPSBvcHQuaXRlbXMuY29uY2F0IHdpbmRvdy50aXRsZWJhci5tZW51VGVtcGxhdGUoKVxuXG4gICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgb3B0LnkgPSBhYnNQb3MueVxuICAgICAgICBwb3B1cC5tZW51IG9wdFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGNsaWNrQXRQb3M6IChwLCBldmVudCkgLT5cblxuICAgICAgICBpZiBldmVudC5tZXRhS2V5XG4gICAgICAgICAgICBpZiBrcG9zKGV2ZW50KS54IDw9IEBzaXplLm51bWJlcnNXaWR0aFxuICAgICAgICAgICAgICAgIEBzaW5nbGVDdXJzb3JBdFBvcyBwXG4gICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgc3VwZXIgcCwgZXZlbnRcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDBcblxuICAgIGhhbmRsZU1vZEtleUNvbWJvQ2hhckV2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudCkgLT5cblxuICAgICAgICByZXR1cm4gaWYgJ3VuaGFuZGxlZCcgIT0gc3VwZXIgbW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2FsdCtjdHJsK2VudGVyJyAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuY29tbWFuZGxpbmUuY29tbWFuZHMuY29mZmVlLmV4ZWN1dGVUZXh0IEB0ZXh0T2ZTZWxlY3Rpb25Gb3JDbGlwYm9hcmQoKVxuICAgICAgICAgICAgd2hlbiAnYWx0K2N0cmwrc2hpZnQrZW50ZXInIHRoZW4gcmV0dXJuIHdpbmRvdy5jb21tYW5kbGluZS5jb21tYW5kcy5jb2ZmZWUuZXhlY3V0ZVRleHRJbk1haW4gQHRleHRPZlNlbGVjdGlvbkZvckNsaXBib2FyZHQoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCthbHQrdXAnICdhbHQrbycgdGhlbiByZXR1cm4gQGp1bXBUb0NvdW50ZXJwYXJ0KClcbiAgICAgICAgICAgIHdoZW4gJ2VzYydcbiAgICAgICAgICAgICAgICBzcGxpdCA9IHdpbmRvdy5zcGxpdFxuICAgICAgICAgICAgICAgIGlmIHNwbGl0LnRlcm1pbmFsVmlzaWJsZSgpXG4gICAgICAgICAgICAgICAgICAgIHNwbGl0LmhpZGVUZXJtaW5hbCgpXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBzcGxpdC5jb21tYW5kbGluZVZpc2libGUoKVxuICAgICAgICAgICAgICAgICAgICBzcGxpdC5oaWRlQ29tbWFuZGxpbmUoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAndW5oYW5kbGVkJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVFZGl0b3JcbiJdfQ==
//# sourceURL=../../coffee/editor/fileeditor.coffee