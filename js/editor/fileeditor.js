// koffee 0.56.0

/*
00000000  000  000      00000000        00000000  0000000    000  000000000   0000000   00000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000000    000  000      0000000         0000000   000   000  000     000     000   000  0000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000       000  0000000  00000000        00000000  0000000    000     000      0000000   000   000
 */
var FileEditor, Syntax, TextEditor, Watcher, _, clamp, electron, empty, fs, kerror, kpos, popup, post, ref, setStyle, slash, srcmap, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf;

ref = require('kxk'), post = ref.post, stopEvent = ref.stopEvent, setStyle = ref.setStyle, srcmap = ref.srcmap, popup = ref.popup, slash = ref.slash, empty = ref.empty, clamp = ref.clamp, kpos = ref.kpos, fs = ref.fs, kerror = ref.kerror, _ = ref._;

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
        var fileExists;
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
        }
        post.emit('file', this.currentFile);
        this.emit('file', this.currentFile);
        return post.emit('dirty', this.dirty);
    };

    FileEditor.prototype.restoreFromTabState = function(tabsState) {
        if (tabsState.file == null) {
            return kerror("no tabsState.file?");
        }
        return this.setCurrentFile(tabsState.file, tabsState.state);
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
            this.syntax.fillDiss(this.mainCursor()[1]);
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
                if (file != null) {
                    post.emit('loadFile', slash.joinFileLine(file, line, col));
                    return true;
                }
        }
        counterparts = {
            'cpp': ['hpp', 'h'],
            'cc': ['hpp', 'h'],
            'h': ['cpp', 'c'],
            'hpp': ['cpp', 'c'],
            'coffee': ['js'],
            'koffee': ['js'],
            'js': ['coffee', 'koffee'],
            'pug': ['html'],
            'html': ['pug'],
            'css': ['styl'],
            'styl': ['css']
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
            counter = swapExt(this.currentFile, ext);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsMElBQUE7SUFBQTs7Ozs7QUFRQSxNQUF5RixPQUFBLENBQVEsS0FBUixDQUF6RixFQUFFLGVBQUYsRUFBUSx5QkFBUixFQUFtQix1QkFBbkIsRUFBNkIsbUJBQTdCLEVBQXFDLGlCQUFyQyxFQUE0QyxpQkFBNUMsRUFBbUQsaUJBQW5ELEVBQTBELGlCQUExRCxFQUFpRSxlQUFqRSxFQUF1RSxXQUF2RSxFQUEyRSxtQkFBM0UsRUFBbUY7O0FBRW5GLE9BQUEsR0FBYSxPQUFBLENBQVEsa0JBQVI7O0FBQ2IsVUFBQSxHQUFhLE9BQUEsQ0FBUSxjQUFSOztBQUNiLE1BQUEsR0FBYSxPQUFBLENBQVEsVUFBUjs7QUFDYixRQUFBLEdBQWEsT0FBQSxDQUFRLFVBQVI7O0FBRVA7OztJQUVXLG9CQUFDLFFBQUQ7Ozs7OztRQUVULDRDQUFNLFFBQU4sRUFDSTtZQUFBLFFBQUEsRUFBVSxDQUNOLFNBRE0sRUFFTixXQUZNLEVBR04sU0FITSxFQUlOLFNBSk0sRUFLTixNQUxNLEVBTU4sY0FOTSxFQU9OLFVBUE0sRUFRTixTQVJNLEVBU04sWUFUTSxDQUFWO1lBV0EsUUFBQSxFQUFVLEVBWFY7U0FESjtRQWNBLElBQUMsQ0FBQSxXQUFELEdBQWU7UUFDZixJQUFDLENBQUEsS0FBRCxHQUFlO1FBRWYsSUFBQyxDQUFBLElBQUksQ0FBQyxnQkFBTixDQUF1QixhQUF2QixFQUFzQyxJQUFDLENBQUEsYUFBdkM7UUFFQSxJQUFJLENBQUMsRUFBTCxDQUFRLGFBQVIsRUFBeUIsSUFBQyxDQUFBLGFBQTFCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxRQUFSLEVBQXlCLElBQUMsQ0FBQSxNQUExQjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsWUFBUixFQUF5QixJQUFDLENBQUEsVUFBMUI7UUFFQSxJQUFDLENBQUEs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LEVBQXVCLElBQXZCLEVBQTZCLEtBQTdCLENBQXpCO0FBQUEsbUJBQUE7O0FBQ0EsZ0JBQU8sS0FBUDtBQUFBLGlCQUNTLGdCQURUO0FBQ3FDLHVCQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFuQyxDQUErQyxJQUFDLENBQUEsMkJBQUQsQ0FBQSxDQUEvQztBQUQ1QyxpQkFFUyxzQkFGVDtBQUVxQyx1QkFBTyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsaUJBQW5DLENBQXFELElBQUMsQ0FBQSw0QkFBRCxDQUFBLENBQXJEO0FBRjVDLGlCQUdTLGdCQUhUO0FBQUEsaUJBRzJCLE9BSDNCO0FBR3dDLHVCQUFPLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0FBSC9DLGlCQUlTLEtBSlQ7Z0JBS1EsS0FBQSxHQUFRLE1BQU0sQ0FBQztnQkFDZixJQUFHLEtBQUssQ0FBQyxlQUFOLENBQUEsQ0FBSDtvQkFDSSxLQUFLLENBQUMsWUFBTixDQUFBLEVBREo7aUJBQUEsTUFFSyxJQUFHLEtBQUssQ0FBQyxrQkFBTixDQUFBLENBQUg7b0JBQ0QsS0FBSyxDQUFDLGVBQU4sQ0FBQSxFQURDOztBQUVMO0FBVlI7ZUFXQTtJQWR3Qjs7OztHQXhiUDs7QUF3Y3pCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4jIyNcblxueyBwb3N0LCBzdG9wRXZlbnQsIHNldFN0eWxlLCBzcmNtYXAsIHBvcHVwLCBzbGFzaCwgZW1wdHksIGNsYW1wLCBrcG9zLCBmcywga2Vycm9yLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbldhdGNoZXIgICAgPSByZXF1aXJlICcuLi90b29scy93YXRjaGVyJ1xuVGV4dEVkaXRvciA9IHJlcXVpcmUgJy4vdGV4dGVkaXRvcidcblN5bnRheCAgICAgPSByZXF1aXJlICcuL3N5bnRheCdcbmVsZWN0cm9uICAgPSByZXF1aXJlICdlbGVjdHJvbidcblxuY2xhc3MgRmlsZUVkaXRvciBleHRlbmRzIFRleHRFZGl0b3JcblxuICAgIGNvbnN0cnVjdG9yOiAodmlld0VsZW0pIC0+XG5cbiAgICAgICAgc3VwZXIgdmlld0VsZW0sXG4gICAgICAgICAgICBmZWF0dXJlczogW1xuICAgICAgICAgICAgICAgICdEaWZmYmFyJ1xuICAgICAgICAgICAgICAgICdTY3JvbGxiYXInXG4gICAgICAgICAgICAgICAgJ051bWJlcnMnXG4gICAgICAgICAgICAgICAgJ01pbmltYXAnXG4gICAgICAgICAgICAgICAgJ01ldGEnXG4gICAgICAgICAgICAgICAgJ0F1dG9jb21wbGV0ZSdcbiAgICAgICAgICAgICAgICAnQnJhY2tldHMnXG4gICAgICAgICAgICAgICAgJ1N0cmluZ3MnXG4gICAgICAgICAgICAgICAgJ0N1cnNvckxpbmUnXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZm9udFNpemU6IDE5XG5cbiAgICAgICAgQGN1cnJlbnRGaWxlID0gbnVsbFxuICAgICAgICBAd2F0Y2ggICAgICAgPSBudWxsXG5cbiAgICAgICAgQHZpZXcuYWRkRXZlbnRMaXN0ZW5lciBcImNvbnRleHRtZW51XCIsIEBvbkNvbnRleHRNZW51XG5cbiAgICAgICAgcG9zdC5vbiAnY29tbWFuZGxpbmUnLCAgIEBvbkNvbW1hbmRsaW5lXG4gICAgICAgIHBvc3Qub24gJ2p1bXBUbycsICAgICAgICBAanVtcFRvXG4gICAgICAgIHBvc3Qub24gJ2p1bXBUb0ZpbGUnLCAgICBAanVtcFRvRmlsZVxuXG4gICAgICAgIEBpbml0UGlnbWVudHMoKVxuICAgICAgICBAaW5pdEludmlzaWJsZXMoKVxuXG4gICAgICAgIEBzZXRUZXh0ICcnXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgY2hhbmdlZDogKGNoYW5nZUluZm8pIC0+XG5cbiAgICAgICAgc3VwZXIgY2hhbmdlSW5mb1xuICAgICAgICBkaXJ0eSA9IEBkby5oYXNMaW5lQ2hhbmdlcygpXG4gICAgICAgIGlmIEBkaXJ0eSAhPSBkaXJ0eVxuICAgICAgICAgICAgQGRpcnR5ID0gZGlydHlcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnZGlydHknLCBAZGlydHlcblxuICAgICMgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG4gICAgY2xlYXI6IC0+XG5cbiAgICAgICAgQGRpcnR5ID0gZmFsc2VcbiAgICAgICAgQHNldFNhbHRlck1vZGUgZmFsc2VcbiAgICAgICAgQHN0b3BXYXRjaGVyKClcbiAgICAgICAgQGRpZmZiYXI/LmNsZWFyKClcbiAgICAgICAgQG1ldGE/LmNsZWFyKClcbiAgICAgICAgQHNldExpbmVzIFsnJ11cbiAgICAgICAgQGRvLnJlc2V0KClcblxuICAgIHNldEN1cnJlbnRGaWxlOiAoZmlsZSwgcmVzdG9yZVN0YXRlKSAtPlxuXG4gICAgICAgIEBjbGVhcigpXG4gICAgICAgIEBzdG9wV2F0Y2hlcigpXG5cbiAgICAgICAgQGN1cnJlbnRGaWxlID0gZmlsZVxuXG4gICAgICAgIEBzZXR1cEZpbGVUeXBlKClcblxuICAgICAgICBmaWxlRXhpc3RzID0gQGN1cnJlbnRGaWxlPyBhbmQgc2xhc2guZmlsZUV4aXN0cyBAY3VycmVudEZpbGVcblxuICAgICAgICBpZiByZXN0b3JlU3RhdGVcbiAgICAgICAgICAgIEBzZXRUZXh0IHJlc3RvcmVTdGF0ZS50ZXh0KClcbiAgICAgICAgICAgIEBzdGF0ZSA9IHJlc3RvcmVTdGF0ZVxuICAgICAgICAgICAgQGRpcnR5ID0gdHJ1ZVxuICAgICAgICBlbHNlIGlmIGZpbGVFeGlzdHNcbiAgICAgICAgICAgIEBzZXRUZXh0IHNsYXNoLnJlYWRUZXh0IEBjdXJyZW50RmlsZVxuXG4gICAgICAgIGlmIGZpbGVFeGlzdHNcbiAgICAgICAgICAgIEB3YXRjaCA9IG5ldyBXYXRjaGVyIEBjdXJyZW50RmlsZVxuXG4gICAgICAgIHBvc3QuZW1pdCAnZmlsZScsIEBjdXJyZW50RmlsZSAjIGJyb3dzZXIgJiBzaGVsZlxuXG4gICAgICAgIEBlbWl0ICdmaWxlJywgQGN1cnJlbnRGaWxlICMgZGlmZmJhciwgcGlnbWVudHMsIC4uLlxuXG4gICAgICAgIHBvc3QuZW1pdCAnZGlydHknLCBAZGlydHlcblxuICAgIHJlc3RvcmVGcm9tVGFiU3RhdGU6ICh0YWJzU3RhdGUpIC0+XG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciBcIm5vIHRhYnNTdGF0ZS5maWxlP1wiIGlmIG5vdCB0YWJzU3RhdGUuZmlsZT9cbiAgICAgICAgQHNldEN1cnJlbnRGaWxlIHRhYnNTdGF0ZS5maWxlLCB0YWJzU3RhdGUuc3RhdGVcblxuICAgIHN0b3BXYXRjaGVyOiAtPlxuXG4gICAgICAgIEB3YXRjaD8uc3RvcCgpXG4gICAgICAgIEB3YXRjaCA9IG51bGxcblxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgIDAwMCAwMDAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgICAgMDAwICAgICAgIDAwMDAwICAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAwMDAwMFxuXG4gICAgc2hlYmFuZ0ZpbGVUeXBlOiAtPlxuXG4gICAgICAgIGZpbGVUeXBlID0gU3ludGF4LnNoZWJhbmcgQGxpbmUoMCkgaWYgQG51bUxpbmVzKClcbiAgICAgICAgaWYgZmlsZVR5cGUgPT0gJ3R4dCdcbiAgICAgICAgICAgIGlmIEBjdXJyZW50RmlsZT9cbiAgICAgICAgICAgICAgICBleHQgPSBzbGFzaC5leHQgQGN1cnJlbnRGaWxlXG4gICAgICAgICAgICAgICAgaWYgZXh0IGluIFN5bnRheC5zeW50YXhOYW1lc1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXh0XG4gICAgICAgIGVsc2UgaWYgZmlsZVR5cGVcbiAgICAgICAgICAgIHJldHVybiBmaWxlVHlwZVxuXG4gICAgICAgIHN1cGVyKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcblxuICAgIG9uQ29tbWFuZGxpbmU6IChlKSA9PlxuXG4gICAgICAgIHN3aXRjaCBlXG4gICAgICAgICAgICB3aGVuICdoaWRkZW4nLCAnc2hvd24nXG4gICAgICAgICAgICAgICAgZCA9IHdpbmRvdy5zcGxpdC5jb21tYW5kbGluZUhlaWdodCArIHdpbmRvdy5zcGxpdC5oYW5kbGVIZWlnaHRcbiAgICAgICAgICAgICAgICBkID0gTWF0aC5taW4gZCwgQHNjcm9sbC5zY3JvbGxNYXggLSBAc2Nyb2xsLnNjcm9sbFxuICAgICAgICAgICAgICAgIGQgKj0gLTEgaWYgZSA9PSAnaGlkZGVuJ1xuICAgICAgICAgICAgICAgIEBzY3JvbGwuYnkgZFxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAwMDAwMFxuXG4gICAgc2F2ZVNjcm9sbEN1cnNvcnNBbmRTZWxlY3Rpb25zOiAob3B0KSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGN1cnJlbnRGaWxlXG4gICAgICAgIHMgPSB7fVxuXG4gICAgICAgIHMubWFpbiAgICAgICA9IEBzdGF0ZS5tYWluKClcbiAgICAgICAgcy5jdXJzb3JzICAgID0gQHN0YXRlLmN1cnNvcnMoKSAgICBpZiBAbnVtQ3Vyc29ycygpID4gMSBvciBAY3Vyc29yUG9zKClbMF0gb3IgQGN1cnNvclBvcygpWzFdXG4gICAgICAgIHMuc2VsZWN0aW9ucyA9IEBzdGF0ZS5zZWxlY3Rpb25zKCkgaWYgQG51bVNlbGVjdGlvbnMoKVxuICAgICAgICBzLmhpZ2hsaWdodHMgPSBAc3RhdGUuaGlnaGxpZ2h0cygpIGlmIEBudW1IaWdobGlnaHRzKClcblxuICAgICAgICBzLnNjcm9sbCA9IEBzY3JvbGwuc2Nyb2xsIGlmIEBzY3JvbGwuc2Nyb2xsXG5cbiAgICAgICAgZmlsZVBvc2l0aW9ucyA9IHdpbmRvdy5zdGFzaC5nZXQgJ2ZpbGVQb3NpdGlvbnMnLCBPYmplY3QuY3JlYXRlIG51bGxcbiAgICAgICAgaWYgbm90IF8uaXNQbGFpbk9iamVjdCBmaWxlUG9zaXRpb25zXG4gICAgICAgICAgICBmaWxlUG9zaXRpb25zID0gT2JqZWN0LmNyZWF0ZSBudWxsXG4gICAgICAgIGZpbGVQb3NpdGlvbnNbQGN1cnJlbnRGaWxlXSA9IHNcbiAgICAgICAgd2luZG93LnN0YXNoLnNldCAnZmlsZVBvc2l0aW9ucycsIGZpbGVQb3NpdGlvbnNcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG5cbiAgICByZXN0b3JlU2Nyb2xsQ3Vyc29yc0FuZFNlbGVjdGlvbnM6IC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY3VycmVudEZpbGVcblxuICAgICAgICBmaWxlUG9zaXRpb25zID0gd2luZG93LnN0YXNoLmdldCAnZmlsZVBvc2l0aW9ucycsIHt9XG5cbiAgICAgICAgaWYgZmlsZVBvc2l0aW9uc1tAY3VycmVudEZpbGVdP1xuXG4gICAgICAgICAgICBzID0gZmlsZVBvc2l0aW9uc1tAY3VycmVudEZpbGVdXG5cbiAgICAgICAgICAgIGN1cnNvcnMgPSBzLmN1cnNvcnMgPyBbWzAsMF1dXG4gICAgICAgICAgICBjdXJzb3JzID0gY3Vyc29ycy5tYXAgKGMpID0+IFtjWzBdLCBjbGFtcCgwLEBudW1MaW5lcygpLTEsY1sxXSldXG5cbiAgICAgICAgICAgIEBzZXRDdXJzb3JzICAgIGN1cnNvcnNcbiAgICAgICAgICAgIEBzZXRTZWxlY3Rpb25zIHMuc2VsZWN0aW9ucyA/IFtdXG4gICAgICAgICAgICBAc2V0SGlnaGxpZ2h0cyBzLmhpZ2hsaWdodHMgPyBbXVxuICAgICAgICAgICAgQHNldE1haW4gICAgICAgcy5tYWluID8gMFxuICAgICAgICAgICAgQHNldFN0YXRlIEBzdGF0ZVxuXG4gICAgICAgICAgICBAc3ludGF4LmZpbGxEaXNzIEBtYWluQ3Vyc29yKClbMV1cblxuICAgICAgICAgICAgQHNjcm9sbC50byBzLnNjcm9sbCBpZiBzLnNjcm9sbFxuICAgICAgICAgICAgQHNjcm9sbC5jdXJzb3JJbnRvVmlldygpXG5cbiAgICAgICAgZWxzZVxuXG4gICAgICAgICAgICBAc2luZ2xlQ3Vyc29yQXRQb3MgWzAsMF1cbiAgICAgICAgICAgIEBzY3JvbGwudG9wID0gMCBpZiBAbWFpbkN1cnNvcigpWzFdID09IDBcbiAgICAgICAgICAgIEBzY3JvbGwuYm90ID0gQHNjcm9sbC50b3AtMVxuICAgICAgICAgICAgQHNjcm9sbC50byAwXG4gICAgICAgICAgICBAc2Nyb2xsLmN1cnNvckludG9WaWV3KClcblxuICAgICAgICBAdXBkYXRlTGF5ZXJzKClcbiAgICAgICAgQG51bWJlcnM/LnVwZGF0ZUNvbG9ycygpXG4gICAgICAgIEBtaW5pbWFwLm9uRWRpdG9yU2Nyb2xsKClcbiAgICAgICAgQGVtaXQgJ2N1cnNvcidcbiAgICAgICAgQGVtaXQgJ3NlbGVjdGlvbidcblxuICAgICMgICAgICAgMDAwICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwMDAwMDBcbiAgICAjICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwXG5cbiAgICBqdW1wVG9GaWxlOiAob3B0KSA9PlxuXG4gICAgICAgIHdpbmRvdy50YWJzLmFjdGl2ZVRhYiB0cnVlXG5cbiAgICAgICAgIyBsb2cgJ2p1bXBUb0ZpbGUnLCByZXF1aXJlKCdreGsnKS5ub29uLnN0cmluZ2lmeSBvcHRcblxuICAgICAgICBpZiBvcHQubmV3VGFiXG5cbiAgICAgICAgICAgIGZpbGUgPSBvcHQuZmlsZVxuICAgICAgICAgICAgZmlsZSArPSAnOicgKyBvcHQubGluZSBpZiBvcHQubGluZVxuICAgICAgICAgICAgZmlsZSArPSAnOicgKyBvcHQuY29sIGlmIG9wdC5jb2xcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnbmV3VGFiV2l0aEZpbGUnLCBmaWxlXG5cbiAgICAgICAgZWxzZVxuXG4gICAgICAgICAgICBbZmlsZSwgZnBvc10gPSBzbGFzaC5zcGxpdEZpbGVQb3Mgb3B0LmZpbGVcbiAgICAgICAgICAgIG9wdC5wb3MgPSBmcG9zXG4gICAgICAgICAgICBvcHQucG9zWzBdID0gb3B0LmNvbCBpZiBvcHQuY29sXG4gICAgICAgICAgICBvcHQucG9zWzFdID0gb3B0LmxpbmUtMSBpZiBvcHQubGluZVxuICAgICAgICAgICAgb3B0LndpbklEICA9IHdpbmRvdy53aW5JRFxuXG4gICAgICAgICAgICBvcHQub2xkUG9zID0gQGN1cnNvclBvcygpXG4gICAgICAgICAgICBvcHQub2xkRmlsZSA9IEBjdXJyZW50RmlsZVxuICAgICAgICAgICAgd2luZG93Lm5hdmlnYXRlLmdvdG9GaWxlUG9zIG9wdFxuXG4gICAganVtcFRvOiAod29yZCwgb3B0KSA9PlxuXG4gICAgICAgIGlmIF8uaXNPYmplY3Qod29yZCkgYW5kIG5vdCBvcHQ/XG4gICAgICAgICAgICBvcHQgID0gd29yZFxuICAgICAgICAgICAgd29yZCA9IG9wdC53b3JkXG5cbiAgICAgICAgb3B0ID89IHt9XG5cbiAgICAgICAgaWYgb3B0LmZpbGU/XG4gICAgICAgICAgICBAanVtcFRvRmlsZSBvcHRcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciAnbm90aGluZyB0byBqdW1wIHRvPycgaWYgZW1wdHkgd29yZFxuXG4gICAgICAgIGZpbmQgPSB3b3JkLnRvTG93ZXJDYXNlKCkudHJpbSgpXG4gICAgICAgIGZpbmQgPSBmaW5kLnNsaWNlIDEgaWYgZmluZFswXSA9PSAnQCdcblxuICAgICAgICByZXR1cm4ga2Vycm9yICdGaWxlRWRpdG9yLmp1bXBUbyAtLSBub3RoaW5nIHRvIGZpbmQ/JyBpZiBlbXB0eSBmaW5kXG5cbiAgICAgICAgdHlwZSA9IG9wdD8udHlwZVxuXG4gICAgICAgIGlmIG5vdCB0eXBlIG9yIHR5cGUgPT0gJ2NsYXNzJ1xuICAgICAgICAgICAgY2xhc3NlcyA9IHBvc3QuZ2V0ICdpbmRleGVyJywgJ2NsYXNzZXMnXG4gICAgICAgICAgICBmb3IgY2xzcywgaW5mbyBvZiBjbGFzc2VzXG4gICAgICAgICAgICAgICAgaWYgY2xzcy50b0xvd2VyQ2FzZSgpID09IGZpbmRcbiAgICAgICAgICAgICAgICAgICAgQGp1bXBUb0ZpbGUgaW5mb1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgICAgIGlmIG5vdCB0eXBlIG9yIHR5cGUgPT0gJ2Z1bmMnXG4gICAgICAgICAgICBmdW5jcyA9IHBvc3QuZ2V0ICdpbmRleGVyJywgJ2Z1bmNzJ1xuICAgICAgICAgICAgZm9yIGZ1bmMsIGluZm9zIG9mIGZ1bmNzXG4gICAgICAgICAgICAgICAgaWYgZnVuYy50b0xvd2VyQ2FzZSgpID09IGZpbmRcbiAgICAgICAgICAgICAgICAgICAgaW5mbyA9IGluZm9zWzBdXG4gICAgICAgICAgICAgICAgICAgIGZvciBpIGluIGluZm9zXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBpLmZpbGUgPT0gQGN1cnJlbnRGaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mbyA9IGlcbiAgICAgICAgICAgICAgICAgICAgIyBpZiBpbmZvcy5sZW5ndGggPiAxIGFuZCBub3Qgb3B0Py5kb250TGlzdFxuICAgICAgICAgICAgICAgICAgICAgICAgIyB3aW5kb3cuY29tbWFuZGxpbmUuY29tbWFuZHMudGVybS5leGVjdXRlIFwiZnVuYyBeI3t3b3JkfSRcIlxuICAgICAgICAgICAgICAgICAgICBAanVtcFRvRmlsZSBpbmZvXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAgICAgaWYgbm90IHR5cGUgb3IgdHlwZSA9PSAnZmlsZSdcbiAgICAgICAgICAgIGZpbGVzID0gcG9zdC5nZXQgJ2luZGV4ZXInLCAnZmlsZXMnXG4gICAgICAgICAgICBmb3IgZmlsZSwgaW5mbyBvZiBmaWxlc1xuICAgICAgICAgICAgICAgIGlmIHNsYXNoLmJhc2UoZmlsZSkudG9Mb3dlckNhc2UoKSA9PSBmaW5kIGFuZCBmaWxlICE9IEBjdXJyZW50RmlsZVxuICAgICAgICAgICAgICAgICAgICBAanVtcFRvRmlsZSBmaWxlOmZpbGUsIGxpbmU6NlxuXG4gICAgICAgIHdpbmRvdy5jb21tYW5kbGluZS5jb21tYW5kcy5zZWFyY2guc3RhcnQgJ3NlYXJjaCdcbiAgICAgICAgd2luZG93LmNvbW1hbmRsaW5lLmNvbW1hbmRzLnNlYXJjaC5leGVjdXRlIHdvcmRcblxuICAgICAgICB3aW5kb3cuc3BsaXQuZG8gJ3Nob3cgdGVybWluYWwnXG5cbiAgICAgICAgdHJ1ZVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAganVtcFRvQ291bnRlcnBhcnQ6ICgpIC0+XG5cbiAgICAgICAgY3AgPSBAY3Vyc29yUG9zKClcbiAgICAgICAgY3VycmV4dCA9IHNsYXNoLmV4dCBAY3VycmVudEZpbGVcblxuICAgICAgICBzd2l0Y2ggY3VycmV4dFxuICAgICAgICAgICAgd2hlbiAnY29mZmVlJywgJ2tvZmZlZSdcbiAgICAgICAgICAgICAgICBbZmlsZSxsaW5lLGNvbF0gPSBzcmNtYXAudG9KcyBAY3VycmVudEZpbGUsIGNwWzFdKzEsIGNwWzBdXG4gICAgICAgICAgICAgICAgaWYgZmlsZT9cbiAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdsb2FkRmlsZScsIHNsYXNoLmpvaW5GaWxlTGluZSBmaWxlLGxpbmUsY29sXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICB3aGVuICdqcydcbiAgICAgICAgICAgICAgICBbZmlsZSxsaW5lLGNvbF0gPSBzcmNtYXAudG9Db2ZmZWUgQGN1cnJlbnRGaWxlLCBjcFsxXSsxLCBjcFswXVxuICAgICAgICAgICAgICAgIGlmIGZpbGU/XG4gICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnbG9hZEZpbGUnLCBzbGFzaC5qb2luRmlsZUxpbmUgZmlsZSxsaW5lLGNvbFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgICAgIGNvdW50ZXJwYXJ0cyA9XG4gICAgICAgICAgICAnY3BwJzogICAgIFsnaHBwJywgJ2gnXVxuICAgICAgICAgICAgJ2NjJzogICAgICBbJ2hwcCcsICdoJ11cbiAgICAgICAgICAgICdoJzogICAgICAgWydjcHAnLCAnYyddXG4gICAgICAgICAgICAnaHBwJzogICAgIFsnY3BwJywgJ2MnXVxuICAgICAgICAgICAgJ2NvZmZlZSc6ICBbJ2pzJ11cbiAgICAgICAgICAgICdrb2ZmZWUnOiAgWydqcyddXG4gICAgICAgICAgICAnanMnOiAgICAgIFsnY29mZmVlJywna29mZmVlJ11cbiAgICAgICAgICAgICdwdWcnOiAgICAgWydodG1sJ11cbiAgICAgICAgICAgICdodG1sJzogICAgWydwdWcnXVxuICAgICAgICAgICAgJ2Nzcyc6ICAgICBbJ3N0eWwnXVxuICAgICAgICAgICAgJ3N0eWwnOiAgICBbJ2NzcyddXG5cbiAgICAgICAgZm9yIGV4dCBpbiAoY291bnRlcnBhcnRzW2N1cnJleHRdID8gW10pXG4gICAgICAgICAgICBpZiBzbGFzaC5maWxlRXhpc3RzIHNsYXNoLnN3YXBFeHQgQGN1cnJlbnRGaWxlLCBleHRcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJywgc2xhc2guc3dhcEV4dCBAY3VycmVudEZpbGUsIGV4dFxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAgICAgZm9yIGV4dCBpbiAoY291bnRlcnBhcnRzW2N1cnJleHRdID8gW10pXG4gICAgICAgICAgICBjb3VudGVyID0gc3dhcEV4dCBAY3VycmVudEZpbGUsIGV4dFxuICAgICAgICAgICAgY291bnRlciA9IGNvdW50ZXIucmVwbGFjZSBcIi8je2N1cnJleHR9L1wiLCBcIi8je2V4dH0vXCJcbiAgICAgICAgICAgIGlmIHNsYXNoLmZpbGVFeGlzdHMgY291bnRlclxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnbG9hZEZpbGUnLCBjb3VudGVyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZmFsc2VcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY2VudGVyVGV4dDogKGNlbnRlciwgYW5pbWF0ZT0zMDApIC0+XG5cbiAgICAgICAgQHNpemUuY2VudGVyVGV4dCA9IGNlbnRlclxuICAgICAgICBAdXBkYXRlTGF5ZXJzKClcblxuICAgICAgICBAc2l6ZS5vZmZzZXRYID0gTWF0aC5mbG9vciBAc2l6ZS5jaGFyV2lkdGgvMiArIEBzaXplLm51bWJlcnNXaWR0aFxuICAgICAgICBpZiBjZW50ZXJcbiAgICAgICAgICAgIGJyICAgICAgICA9IEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICB2aXNDb2xzICAgPSBwYXJzZUludCBici53aWR0aCAvIEBzaXplLmNoYXJXaWR0aFxuICAgICAgICAgICAgbmV3T2Zmc2V0ID0gcGFyc2VJbnQgQHNpemUuY2hhcldpZHRoICogKHZpc0NvbHMgLSAxMDApIC8gMlxuICAgICAgICAgICAgQHNpemUub2Zmc2V0WCA9IE1hdGgubWF4IEBzaXplLm9mZnNldFgsIG5ld09mZnNldFxuICAgICAgICAgICAgQHNpemUuY2VudGVyVGV4dCA9IHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHNpemUuY2VudGVyVGV4dCA9IGZhbHNlXG5cbiAgICAgICAgQHVwZGF0ZUxpbmVQb3NpdGlvbnMgYW5pbWF0ZVxuXG4gICAgICAgIGlmIGFuaW1hdGVcbiAgICAgICAgICAgIGxheWVycyA9IFsnLnNlbGVjdGlvbnMnLCAnLmhpZ2hsaWdodHMnLCAnLmN1cnNvcnMnXVxuICAgICAgICAgICAgdHJhbnNpID0gWycuc2VsZWN0aW9uJywgICcuaGlnaGxpZ2h0JywgICcuY3Vyc29yJyBdLmNvbmNhdCBsYXllcnNcbiAgICAgICAgICAgIHJlc2V0VHJhbnMgPSA9PlxuICAgICAgICAgICAgICAgIHNldFN0eWxlICcuZWRpdG9yIC5sYXllcnMgJytsLCAndHJhbnNmb3JtJywgXCJ0cmFuc2xhdGVYKDApXCIgZm9yIGwgaW4gbGF5ZXJzXG4gICAgICAgICAgICAgICAgc2V0U3R5bGUgJy5lZGl0b3IgLmxheWVycyAnK3QsICd0cmFuc2l0aW9uJywgXCJpbml0aWFsXCIgZm9yIHQgaW4gdHJhbnNpXG4gICAgICAgICAgICAgICAgQHVwZGF0ZUxheWVycygpXG5cbiAgICAgICAgICAgIGlmIGNlbnRlclxuICAgICAgICAgICAgICAgIG9mZnNldFggPSBAc2l6ZS5vZmZzZXRYIC0gQHNpemUubnVtYmVyc1dpZHRoIC0gQHNpemUuY2hhcldpZHRoLzJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBvZmZzZXRYID0gTWF0aC5mbG9vciBAc2l6ZS5jaGFyV2lkdGgvMiArIEBzaXplLm51bWJlcnNXaWR0aFxuICAgICAgICAgICAgICAgIG9mZnNldFggPSBNYXRoLm1heCBvZmZzZXRYLCAoQHNjcmVlblNpemUoKS53aWR0aCAtIEBzY3JlZW5TaXplKCkuaGVpZ2h0KSAvIDJcbiAgICAgICAgICAgICAgICBvZmZzZXRYIC09IEBzaXplLm51bWJlcnNXaWR0aCArIEBzaXplLmNoYXJXaWR0aC8yXG4gICAgICAgICAgICAgICAgb2Zmc2V0WCAqPSAtMVxuXG4gICAgICAgICAgICBzZXRTdHlsZSAnLmVkaXRvciAubGF5ZXJzICcrbCwgJ3RyYW5zZm9ybScsIFwidHJhbnNsYXRlWCgje29mZnNldFh9cHgpXCIgZm9yIGwgaW4gbGF5ZXJzXG4gICAgICAgICAgICBzZXRTdHlsZSAnLmVkaXRvciAubGF5ZXJzICcrdCwgJ3RyYW5zaXRpb24nLCBcImFsbCAje2FuaW1hdGUvMTAwMH1zXCIgZm9yIHQgaW4gdHJhbnNpXG4gICAgICAgICAgICBzZXRUaW1lb3V0IHJlc2V0VHJhbnMsIGFuaW1hdGVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHVwZGF0ZUxheWVycygpXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDBcblxuICAgIG9uQ29udGV4dE1lbnU6IChldmVudCkgPT4gc3RvcEV2ZW50IGV2ZW50LCBAc2hvd0NvbnRleHRNZW51IGtwb3MgZXZlbnRcblxuICAgIHNob3dDb250ZXh0TWVudTogKGFic1BvcykgPT5cblxuICAgICAgICBpZiBub3QgYWJzUG9zP1xuICAgICAgICAgICAgYWJzUG9zID0ga3BvcyBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0LCBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3BcblxuICAgICAgICBvcHQgPSBpdGVtczogW1xuICAgICAgICAgICAgdGV4dDogICAnQnJvd3NlJ1xuICAgICAgICAgICAgY29tYm86ICAnY29tbWFuZCsuJ1xuICAgICAgICAgICAgYWNjZWw6ICAnY3RybCsuJ1xuICAgICAgICAgICAgY2I6ICAgICAtPiB3aW5kb3cuY29tbWFuZGxpbmUuc3RhcnRDb21tYW5kICdicm93c2UnXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ0JhY2snXG4gICAgICAgICAgICBjb21ibzogICdjb21tYW5kKzEnXG4gICAgICAgICAgICBjYjogICAgIC0+IHBvc3QuZW1pdCAnbWVudUFjdGlvbicsICdOYXZpZ2F0ZSBCYWNrd2FyZCdcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnJ1xuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdNYXhpbWl6ZSdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2NvbW1hbmQrc2hpZnQreSdcbiAgICAgICAgICAgIGFjY2VsOiAgJ2N0cmwrc2hpZnQreSdcbiAgICAgICAgICAgIGNiOiAgICAgLT4gd2luZG93LnNwbGl0Lm1heGltaXplRWRpdG9yKClcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnJ1xuICAgICAgICBdXG5cbiAgICAgICAgb3B0Lml0ZW1zID0gb3B0Lml0ZW1zLmNvbmNhdCB3aW5kb3cudGl0bGViYXIubWVudVRlbXBsYXRlKClcblxuICAgICAgICBvcHQueCA9IGFic1Bvcy54XG4gICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgcG9wdXAubWVudSBvcHRcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBjbGlja0F0UG9zOiAocCwgZXZlbnQpIC0+XG5cbiAgICAgICAgaWYgZXZlbnQubWV0YUtleVxuICAgICAgICAgICAgaWYga3BvcyhldmVudCkueCA8PSBAc2l6ZS5udW1iZXJzV2lkdGhcbiAgICAgICAgICAgICAgICBAc2luZ2xlQ3Vyc29yQXRQb3MgcFxuICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIHN1cGVyIHAsIGV2ZW50XG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0NoYXJFdmVudDogKG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnQpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmICd1bmhhbmRsZWQnICE9IHN1cGVyIG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnRcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdhbHQrY3RybCtlbnRlcicgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmNvbW1hbmRsaW5lLmNvbW1hbmRzLmNvZmZlZS5leGVjdXRlVGV4dCBAdGV4dE9mU2VsZWN0aW9uRm9yQ2xpcGJvYXJkKClcbiAgICAgICAgICAgIHdoZW4gJ2FsdCtjdHJsK3NoaWZ0K2VudGVyJyB0aGVuIHJldHVybiB3aW5kb3cuY29tbWFuZGxpbmUuY29tbWFuZHMuY29mZmVlLmV4ZWN1dGVUZXh0SW5NYWluIEB0ZXh0T2ZTZWxlY3Rpb25Gb3JDbGlwYm9hcmR0KClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrYWx0K3VwJywgJ2FsdCtvJyB0aGVuIHJldHVybiBAanVtcFRvQ291bnRlcnBhcnQoKVxuICAgICAgICAgICAgd2hlbiAnZXNjJ1xuICAgICAgICAgICAgICAgIHNwbGl0ID0gd2luZG93LnNwbGl0XG4gICAgICAgICAgICAgICAgaWYgc3BsaXQudGVybWluYWxWaXNpYmxlKClcbiAgICAgICAgICAgICAgICAgICAgc3BsaXQuaGlkZVRlcm1pbmFsKClcbiAgICAgICAgICAgICAgICBlbHNlIGlmIHNwbGl0LmNvbW1hbmRsaW5lVmlzaWJsZSgpXG4gICAgICAgICAgICAgICAgICAgIHNwbGl0LmhpZGVDb21tYW5kbGluZSgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICd1bmhhbmRsZWQnXG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZUVkaXRvclxuIl19
//# sourceURL=../../coffee/editor/fileeditor.coffee