// koffee 1.7.0

/*
00000000  000  000      00000000        00000000  0000000    000  000000000   0000000   00000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000000    000  000      0000000         0000000   000   000  000     000     000   000  0000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000       000  0000000  00000000        00000000  0000000    000     000      0000000   000   000
 */
var FileEditor, Syntax, TextEditor, Watcher, _, clamp, electron, empty, kerror, klog, kpos, popup, post, ref, setStyle, slash, srcmap, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf;

ref = require('kxk'), _ = ref._, clamp = ref.clamp, empty = ref.empty, kerror = ref.kerror, klog = ref.klog, kpos = ref.kpos, popup = ref.popup, post = ref.post, setStyle = ref.setStyle, slash = ref.slash, srcmap = ref.srcmap, stopEvent = ref.stopEvent;

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
            klog('fileEditor.setCurrentFile', this.currentFile);
            if (koffee_97_12 = process.hrtime.bigint()) {
                this.setText(slash.readText(this.currentFile));
                console.log('setText', (function(b){ let f=1000n; for (let u of ['ns','μs','ms','s']) { if (u=='s' || b<f) { return ''+(1000n*b/f)+u; } f*=1000n; }})(process.hrtime.bigint()-koffee_97_12));
            };
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
                if (file != null) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsNElBQUE7SUFBQTs7Ozs7QUFRQSxNQUEyRixPQUFBLENBQVEsS0FBUixDQUEzRixFQUFFLFNBQUYsRUFBSyxpQkFBTCxFQUFZLGlCQUFaLEVBQW1CLG1CQUFuQixFQUEyQixlQUEzQixFQUFpQyxlQUFqQyxFQUF1QyxpQkFBdkMsRUFBOEMsZUFBOUMsRUFBb0QsdUJBQXBELEVBQThELGlCQUE5RCxFQUFxRSxtQkFBckUsRUFBNkU7O0FBRTdFLE9BQUEsR0FBYSxPQUFBLENBQVEsa0JBQVI7O0FBQ2IsVUFBQSxHQUFhLE9BQUEsQ0FBUSxjQUFSOztBQUNiLE1BQUEsR0FBYSxPQUFBLENBQVEsVUFBUjs7QUFDYixRQUFBLEdBQWEsT0FBQSxDQUFRLFVBQVI7O0FBRVA7OztJQUVDLG9CQUFDLFFBQUQ7Ozs7OztRQUVDLDRDQUFNLFFBQU4sRUFDSTtZQUFBLFFBQUEsRUFBVSxDQUNOLFNBRE0sRUFFTixXQUZNLEVBR04sU0FITSxFQUlOLFNBSk0sRUFLTixNQUxNLEVBTU4sY0FOTSxFQU9OLFVBUE0sRUFRTixTQVJNLEVBU04sWUFUTSxDQUFWO1lBV0EsUUFBQSxFQUFVLEVBWFY7U0FESjtRQWNBLElBQUMsQ0FBQSxXQUFELEdBQWU7UUFDZixJQUFDLENBQUEsS0FBRCxHQUFlO1FBRWYsSUFBQyxDQUFBLElBQUksQ0FBQyxnQkFBTixDQUF1QixhQUF2QixFQUFzQyxJQUFDLENBQUEsYUFBdkM7UUFFQSxJQUFJLENBQUMsRUFBTCxDQUFRLGFBQVIsRUFBd0IsSUFBQyxDQUFBLGFBQXpCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxRQUFSLEVBQXdCLElBQUMsQ0FBQSxNQUF6QjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsWUFBUixFQUF3QixJQUFDLENBQUEsVUFBekI7UUFFQSxJQUFDLENBQUEsWUFB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LElBQUksQ0FBQyxZQUExQjtnQkFDSSxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsQ0FBbkI7QUFDQSx1QkFGSjthQURKOztlQUtBLDJDQUFNLENBQU4sRUFBUyxLQUFUO0lBUFE7O3lCQWVaLDBCQUFBLEdBQTRCLFNBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxLQUFYLEVBQWtCLElBQWxCLEVBQXdCLEtBQXhCO0FBRXhCLFlBQUE7UUFBQSxJQUFVLFdBQUEsS0FBZSwyREFBTSxHQUFOLEVBQVcsR0FBWCxFQUFnQixLQUFoQixFQUF1QixJQUF2QixFQUE2QixLQUE3QixDQUF6QjtBQUFBLG1CQUFBOztBQUNBLGdCQUFPLEtBQVA7QUFBQSxpQkFDUyxnQkFEVDtBQUNxQyx1QkFBTyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsV0FBbkMsQ0FBK0MsSUFBQyxDQUFBLDJCQUFELENBQUEsQ0FBL0M7QUFENUMsaUJBRVMsc0JBRlQ7QUFFcUMsdUJBQU8sTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLGlCQUFuQyxDQUFxRCxJQUFDLENBQUEsNEJBQUQsQ0FBQSxDQUFyRDtBQUY1QyxpQkFHUyxnQkFIVDtBQUFBLGlCQUcwQixPQUgxQjtBQUd1Qyx1QkFBTyxJQUFDLENBQUEsaUJBQUQsQ0FBQTtBQUg5QyxpQkFJUyxLQUpUO2dCQUtRLEtBQUEsR0FBUSxNQUFNLENBQUM7Z0JBQ2YsSUFBRyxLQUFLLENBQUMsZUFBTixDQUFBLENBQUg7b0JBQ0ksS0FBSyxDQUFDLFlBQU4sQ0FBQSxFQURKO2lCQUFBLE1BRUssSUFBRyxLQUFLLENBQUMsa0JBQU4sQ0FBQSxDQUFIO29CQUNELEtBQUssQ0FBQyxlQUFOLENBQUEsRUFEQzs7QUFFTDtBQVZSO2VBV0E7SUFkd0I7Ozs7R0E5YlA7O0FBOGN6QixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgXywgY2xhbXAsIGVtcHR5LCBrZXJyb3IsIGtsb2csIGtwb3MsIHBvcHVwLCBwb3N0LCBzZXRTdHlsZSwgc2xhc2gsIHNyY21hcCwgc3RvcEV2ZW50IH0gPSByZXF1aXJlICdreGsnXG5cbldhdGNoZXIgICAgPSByZXF1aXJlICcuLi90b29scy93YXRjaGVyJ1xuVGV4dEVkaXRvciA9IHJlcXVpcmUgJy4vdGV4dGVkaXRvcidcblN5bnRheCAgICAgPSByZXF1aXJlICcuL3N5bnRheCdcbmVsZWN0cm9uICAgPSByZXF1aXJlICdlbGVjdHJvbidcblxuY2xhc3MgRmlsZUVkaXRvciBleHRlbmRzIFRleHRFZGl0b3JcblxuICAgIEA6ICh2aWV3RWxlbSkgLT5cblxuICAgICAgICBzdXBlciB2aWV3RWxlbSxcbiAgICAgICAgICAgIGZlYXR1cmVzOiBbXG4gICAgICAgICAgICAgICAgJ0RpZmZiYXInXG4gICAgICAgICAgICAgICAgJ1Njcm9sbGJhcidcbiAgICAgICAgICAgICAgICAnTnVtYmVycydcbiAgICAgICAgICAgICAgICAnTWluaW1hcCdcbiAgICAgICAgICAgICAgICAnTWV0YSdcbiAgICAgICAgICAgICAgICAnQXV0b2NvbXBsZXRlJ1xuICAgICAgICAgICAgICAgICdCcmFja2V0cydcbiAgICAgICAgICAgICAgICAnU3RyaW5ncydcbiAgICAgICAgICAgICAgICAnQ3Vyc29yTGluZSdcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBmb250U2l6ZTogMTlcblxuICAgICAgICBAY3VycmVudEZpbGUgPSBudWxsXG4gICAgICAgIEB3YXRjaCAgICAgICA9IG51bGxcblxuICAgICAgICBAdmlldy5hZGRFdmVudExpc3RlbmVyIFwiY29udGV4dG1lbnVcIiwgQG9uQ29udGV4dE1lbnVcblxuICAgICAgICBwb3N0Lm9uICdjb21tYW5kbGluZScgICBAb25Db21tYW5kbGluZVxuICAgICAgICBwb3N0Lm9uICdqdW1wVG8nICAgICAgICBAanVtcFRvXG4gICAgICAgIHBvc3Qub24gJ2p1bXBUb0ZpbGUnICAgIEBqdW1wVG9GaWxlXG5cbiAgICAgICAgQGluaXRQaWdtZW50cygpXG4gICAgICAgIEBpbml0SW52aXNpYmxlcygpXG5cbiAgICAgICAgQHNldFRleHQgJydcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBjaGFuZ2VkOiAoY2hhbmdlSW5mbykgLT5cblxuICAgICAgICBzdXBlciBjaGFuZ2VJbmZvXG4gICAgICAgIGRpcnR5ID0gQGRvLmhhc0xpbmVDaGFuZ2VzKClcbiAgICAgICAgaWYgQGRpcnR5ICE9IGRpcnR5XG4gICAgICAgICAgICBAZGlydHkgPSBkaXJ0eVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdkaXJ0eScgQGRpcnR5XG5cbiAgICAjIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIGNsZWFyOiAtPlxuXG4gICAgICAgIEBkaXJ0eSA9IGZhbHNlXG4gICAgICAgIEBzZXRTYWx0ZXJNb2RlIGZhbHNlXG4gICAgICAgIEBzdG9wV2F0Y2hlcigpXG4gICAgICAgIEBkaWZmYmFyPy5jbGVhcigpXG4gICAgICAgIEBtZXRhPy5jbGVhcigpXG4gICAgICAgIEBzZXRMaW5lcyBbJyddXG4gICAgICAgIEBkby5yZXNldCgpXG5cbiAgICBzZXRDdXJyZW50RmlsZTogKGZpbGUsIHJlc3RvcmVTdGF0ZSkgLT5cblxuICAgICAgICAjIGtsb2cgJ3NldEN1cnJlbnRGaWxlJyBmaWxlICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIEBjbGVhcigpXG4gICAgICAgIEBzdG9wV2F0Y2hlcigpXG5cbiAgICAgICAgQGN1cnJlbnRGaWxlID0gZmlsZVxuXG4gICAgICAgIEBzZXR1cEZpbGVUeXBlKClcblxuICAgICAgICBmaWxlRXhpc3RzID0gQGN1cnJlbnRGaWxlPyBhbmQgc2xhc2guZmlsZUV4aXN0cyBAY3VycmVudEZpbGVcblxuICAgICAgICBpZiByZXN0b3JlU3RhdGVcbiAgICAgICAgICAgIEBzZXRUZXh0IHJlc3RvcmVTdGF0ZS50ZXh0KClcbiAgICAgICAgICAgIEBzdGF0ZSA9IHJlc3RvcmVTdGF0ZVxuICAgICAgICAgICAgQGRpcnR5ID0gdHJ1ZVxuICAgICAgICBlbHNlIGlmIGZpbGVFeGlzdHNcbiAgICAgICAgICAgIGtsb2cgJ2ZpbGVFZGl0b3Iuc2V0Q3VycmVudEZpbGUnIEBjdXJyZW50RmlsZVxuICAgICAgICAgICAg4pa4cHJvZmlsZSAnc2V0VGV4dCdcbiAgICAgICAgICAgICAgICBAc2V0VGV4dCBzbGFzaC5yZWFkVGV4dCBAY3VycmVudEZpbGVcblxuICAgICAgICBpZiBmaWxlRXhpc3RzXG4gICAgICAgICAgICBAd2F0Y2ggPSBuZXcgV2F0Y2hlciBAY3VycmVudEZpbGVcbiAgICAgICAgICAgIHdpbmRvdy50YWJzLmFjdGl2ZVRhYigpPy5zZXRGaWxlIEBjdXJyZW50RmlsZVxuICAgICAgICAgICAgXG4gICAgICAgIHBvc3QuZW1pdCAnZmlsZScgQGN1cnJlbnRGaWxlICMgYnJvd3NlciAmIHNoZWxmXG5cbiAgICAgICAgQGVtaXQgJ2ZpbGUnIEBjdXJyZW50RmlsZSAjIGRpZmZiYXIsIHBpZ21lbnRzLCAuLi5cblxuICAgICAgICBwb3N0LmVtaXQgJ2RpcnR5JyBAZGlydHlcblxuICAgIGN1cnJlbnREaXI6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAY3VycmVudEZpbGU/IGFuZCBzbGFzaC5maWxlRXhpc3RzIEBjdXJyZW50RmlsZVxuICAgICAgICAgICAgc2xhc2guZGlyIEBjdXJyZW50RmlsZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzbGFzaC5wYXRoIHByb2Nlc3MuY3dkKClcbiAgICAgICAgXG4gICAgcmVzdG9yZUZyb21UYWJTdGF0ZTogKHRhYlN0YXRlKSAtPlxuXG4gICAgICAgIHJldHVybiBrZXJyb3IgXCJubyB0YWJTdGF0ZS5maWxlP1wiIGlmIG5vdCB0YWJTdGF0ZS5maWxlP1xuICAgICAgICBAc2V0Q3VycmVudEZpbGUgdGFiU3RhdGUuZmlsZSwgdGFiU3RhdGUuc3RhdGVcblxuICAgIHN0b3BXYXRjaGVyOiAtPlxuXG4gICAgICAgIEB3YXRjaD8uc3RvcCgpXG4gICAgICAgIEB3YXRjaCA9IG51bGxcblxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgIDAwMCAwMDAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgICAgMDAwICAgICAgIDAwMDAwICAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAwMDAwMFxuXG4gICAgc2hlYmFuZ0ZpbGVUeXBlOiAtPlxuXG4gICAgICAgIGZpbGVUeXBlID0gU3ludGF4LnNoZWJhbmcgQGxpbmUoMCkgaWYgQG51bUxpbmVzKClcbiAgICAgICAgaWYgZmlsZVR5cGUgPT0gJ3R4dCdcbiAgICAgICAgICAgIGlmIEBjdXJyZW50RmlsZT9cbiAgICAgICAgICAgICAgICBleHQgPSBzbGFzaC5leHQgQGN1cnJlbnRGaWxlXG4gICAgICAgICAgICAgICAgaWYgZXh0IGluIFN5bnRheC5zeW50YXhOYW1lc1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXh0XG4gICAgICAgIGVsc2UgaWYgZmlsZVR5cGVcbiAgICAgICAgICAgIHJldHVybiBmaWxlVHlwZVxuXG4gICAgICAgIHN1cGVyKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcblxuICAgIG9uQ29tbWFuZGxpbmU6IChlKSA9PlxuXG4gICAgICAgIHN3aXRjaCBlXG4gICAgICAgICAgICB3aGVuICdoaWRkZW4nICdzaG93bidcbiAgICAgICAgICAgICAgICBkID0gd2luZG93LnNwbGl0LmNvbW1hbmRsaW5lSGVpZ2h0ICsgd2luZG93LnNwbGl0LmhhbmRsZUhlaWdodFxuICAgICAgICAgICAgICAgIGQgPSBNYXRoLm1pbiBkLCBAc2Nyb2xsLnNjcm9sbE1heCAtIEBzY3JvbGwuc2Nyb2xsXG4gICAgICAgICAgICAgICAgZCAqPSAtMSBpZiBlID09ICdoaWRkZW4nXG4gICAgICAgICAgICAgICAgQHNjcm9sbC5ieSBkXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMDAwMDAwXG5cbiAgICBzYXZlU2Nyb2xsQ3Vyc29yc0FuZFNlbGVjdGlvbnM6IChvcHQpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY3VycmVudEZpbGVcbiAgICAgICAgcyA9IHt9XG5cbiAgICAgICAgcy5tYWluICAgICAgID0gQHN0YXRlLm1haW4oKVxuICAgICAgICBzLmN1cnNvcnMgICAgPSBAc3RhdGUuY3Vyc29ycygpICAgIGlmIEBudW1DdXJzb3JzKCkgPiAxIG9yIEBjdXJzb3JQb3MoKVswXSBvciBAY3Vyc29yUG9zKClbMV1cbiAgICAgICAgcy5zZWxlY3Rpb25zID0gQHN0YXRlLnNlbGVjdGlvbnMoKSBpZiBAbnVtU2VsZWN0aW9ucygpXG4gICAgICAgIHMuaGlnaGxpZ2h0cyA9IEBzdGF0ZS5oaWdobGlnaHRzKCkgaWYgQG51bUhpZ2hsaWdodHMoKVxuXG4gICAgICAgIHMuc2Nyb2xsID0gQHNjcm9sbC5zY3JvbGwgaWYgQHNjcm9sbC5zY3JvbGxcblxuICAgICAgICBmaWxlUG9zaXRpb25zID0gd2luZG93LnN0YXNoLmdldCAnZmlsZVBvc2l0aW9ucycgT2JqZWN0LmNyZWF0ZSBudWxsXG4gICAgICAgIGlmIG5vdCBfLmlzUGxhaW5PYmplY3QgZmlsZVBvc2l0aW9uc1xuICAgICAgICAgICAgZmlsZVBvc2l0aW9ucyA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICBmaWxlUG9zaXRpb25zW0BjdXJyZW50RmlsZV0gPSBzXG4gICAgICAgIHdpbmRvdy5zdGFzaC5zZXQgJ2ZpbGVQb3NpdGlvbnMnIGZpbGVQb3NpdGlvbnNcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG5cbiAgICByZXN0b3JlU2Nyb2xsQ3Vyc29yc0FuZFNlbGVjdGlvbnM6IC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY3VycmVudEZpbGVcbiAgICAgICAgXG4gICAgICAgIGZpbGVQb3NpdGlvbnMgPSB3aW5kb3cuc3Rhc2guZ2V0ICdmaWxlUG9zaXRpb25zJyB7fVxuXG4gICAgICAgIGlmIGZpbGVQb3NpdGlvbnNbQGN1cnJlbnRGaWxlXT9cblxuICAgICAgICAgICAgcyA9IGZpbGVQb3NpdGlvbnNbQGN1cnJlbnRGaWxlXVxuXG4gICAgICAgICAgICBjdXJzb3JzID0gcy5jdXJzb3JzID8gW1swLDBdXVxuICAgICAgICAgICAgY3Vyc29ycyA9IGN1cnNvcnMubWFwIChjKSA9PiBbY1swXSwgY2xhbXAoMCxAbnVtTGluZXMoKS0xLGNbMV0pXVxuXG4gICAgICAgICAgICBAc2V0Q3Vyc29ycyAgICBjdXJzb3JzXG4gICAgICAgICAgICBAc2V0U2VsZWN0aW9ucyBzLnNlbGVjdGlvbnMgPyBbXVxuICAgICAgICAgICAgQHNldEhpZ2hsaWdodHMgcy5oaWdobGlnaHRzID8gW11cbiAgICAgICAgICAgIEBzZXRNYWluICAgICAgIHMubWFpbiA/IDBcbiAgICAgICAgICAgIEBzZXRTdGF0ZSBAc3RhdGVcblxuICAgICAgICAgICAgQHNjcm9sbC50byBzLnNjcm9sbCBpZiBzLnNjcm9sbFxuICAgICAgICAgICAgQHNjcm9sbC5jdXJzb3JJbnRvVmlldygpXG5cbiAgICAgICAgZWxzZVxuXG4gICAgICAgICAgICBAc2luZ2xlQ3Vyc29yQXRQb3MgWzAsMF1cbiAgICAgICAgICAgIEBzY3JvbGwudG9wID0gMCBpZiBAbWFpbkN1cnNvcigpWzFdID09IDBcbiAgICAgICAgICAgIEBzY3JvbGwuYm90ID0gQHNjcm9sbC50b3AtMVxuICAgICAgICAgICAgQHNjcm9sbC50byAwXG4gICAgICAgICAgICBAc2Nyb2xsLmN1cnNvckludG9WaWV3KClcblxuICAgICAgICBAdXBkYXRlTGF5ZXJzKClcbiAgICAgICAgQG51bWJlcnM/LnVwZGF0ZUNvbG9ycygpXG4gICAgICAgIEBtaW5pbWFwLm9uRWRpdG9yU2Nyb2xsKClcbiAgICAgICAgQGVtaXQgJ2N1cnNvcidcbiAgICAgICAgQGVtaXQgJ3NlbGVjdGlvbidcblxuICAgICMgICAgICAgMDAwICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwMDAwMDBcbiAgICAjICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwXG5cbiAgICBqdW1wVG9GaWxlOiAob3B0KSA9PlxuXG4gICAgICAgIHdpbmRvdy50YWJzLmFjdGl2ZVRhYiB0cnVlXG5cbiAgICAgICAgaWYgb3B0Lm5ld1RhYlxuXG4gICAgICAgICAgICBmaWxlID0gb3B0LmZpbGVcbiAgICAgICAgICAgIGZpbGUgKz0gJzonICsgb3B0LmxpbmUgaWYgb3B0LmxpbmVcbiAgICAgICAgICAgIGZpbGUgKz0gJzonICsgb3B0LmNvbCBpZiBvcHQuY29sXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ25ld1RhYldpdGhGaWxlJyBmaWxlXG5cbiAgICAgICAgZWxzZVxuXG4gICAgICAgICAgICBbZmlsZSwgZnBvc10gPSBzbGFzaC5zcGxpdEZpbGVQb3Mgb3B0LmZpbGVcbiAgICAgICAgICAgIG9wdC5wb3MgPSBmcG9zXG4gICAgICAgICAgICBvcHQucG9zWzBdID0gb3B0LmNvbCBpZiBvcHQuY29sXG4gICAgICAgICAgICBvcHQucG9zWzFdID0gb3B0LmxpbmUtMSBpZiBvcHQubGluZVxuICAgICAgICAgICAgb3B0LndpbklEICA9IHdpbmRvdy53aW5JRFxuXG4gICAgICAgICAgICBvcHQub2xkUG9zID0gQGN1cnNvclBvcygpXG4gICAgICAgICAgICBvcHQub2xkRmlsZSA9IEBjdXJyZW50RmlsZVxuICAgICAgICAgICAgd2luZG93Lm5hdmlnYXRlLmdvdG9GaWxlUG9zIG9wdFxuXG4gICAganVtcFRvOiAod29yZCwgb3B0KSA9PlxuXG4gICAgICAgIGlmIF8uaXNPYmplY3Qod29yZCkgYW5kIG5vdCBvcHQ/XG4gICAgICAgICAgICBvcHQgID0gd29yZFxuICAgICAgICAgICAgd29yZCA9IG9wdC53b3JkXG5cbiAgICAgICAgb3B0ID89IHt9XG5cbiAgICAgICAgaWYgb3B0LmZpbGU/XG4gICAgICAgICAgICBAanVtcFRvRmlsZSBvcHRcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciAnbm90aGluZyB0byBqdW1wIHRvPycgaWYgZW1wdHkgd29yZFxuXG4gICAgICAgIGZpbmQgPSB3b3JkLnRvTG93ZXJDYXNlKCkudHJpbSgpXG4gICAgICAgIGZpbmQgPSBmaW5kLnNsaWNlIDEgaWYgZmluZFswXSA9PSAnQCdcblxuICAgICAgICByZXR1cm4ga2Vycm9yICdGaWxlRWRpdG9yLmp1bXBUbyAtLSBub3RoaW5nIHRvIGZpbmQ/JyBpZiBlbXB0eSBmaW5kXG5cbiAgICAgICAgdHlwZSA9IG9wdD8udHlwZVxuXG4gICAgICAgIGlmIG5vdCB0eXBlIG9yIHR5cGUgPT0gJ2NsYXNzJ1xuICAgICAgICAgICAgY2xhc3NlcyA9IHBvc3QuZ2V0ICdpbmRleGVyJyAnY2xhc3NlcydcbiAgICAgICAgICAgIGZvciBjbHNzLCBpbmZvIG9mIGNsYXNzZXNcbiAgICAgICAgICAgICAgICBpZiBjbHNzLnRvTG93ZXJDYXNlKCkgPT0gZmluZFxuICAgICAgICAgICAgICAgICAgICBAanVtcFRvRmlsZSBpbmZvXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAgICAgaWYgbm90IHR5cGUgb3IgdHlwZSA9PSAnZnVuYydcbiAgICAgICAgICAgIGZ1bmNzID0gcG9zdC5nZXQgJ2luZGV4ZXInICdmdW5jcydcbiAgICAgICAgICAgIGZvciBmdW5jLCBpbmZvcyBvZiBmdW5jc1xuICAgICAgICAgICAgICAgIGlmIGZ1bmMudG9Mb3dlckNhc2UoKSA9PSBmaW5kXG4gICAgICAgICAgICAgICAgICAgIGluZm8gPSBpbmZvc1swXVxuICAgICAgICAgICAgICAgICAgICBmb3IgaSBpbiBpbmZvc1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgaS5maWxlID09IEBjdXJyZW50RmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8gPSBpXG4gICAgICAgICAgICAgICAgICAgIEBqdW1wVG9GaWxlIGluZm9cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgICBpZiBub3QgdHlwZSBvciB0eXBlID09ICdmaWxlJ1xuICAgICAgICAgICAgZmlsZXMgPSBwb3N0LmdldCAnaW5kZXhlcicgJ2ZpbGVzJ1xuICAgICAgICAgICAgZm9yIGZpbGUsIGluZm8gb2YgZmlsZXNcbiAgICAgICAgICAgICAgICBpZiBzbGFzaC5iYXNlKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT0gZmluZCBhbmQgZmlsZSAhPSBAY3VycmVudEZpbGVcbiAgICAgICAgICAgICAgICAgICAgQGp1bXBUb0ZpbGUgZmlsZTpmaWxlLCBsaW5lOjZcblxuICAgICAgICB3aW5kb3cuY29tbWFuZGxpbmUuY29tbWFuZHMuc2VhcmNoLnN0YXJ0ICdzZWFyY2gnXG4gICAgICAgIHdpbmRvdy5jb21tYW5kbGluZS5jb21tYW5kcy5zZWFyY2guZXhlY3V0ZSB3b3JkXG5cbiAgICAgICAgd2luZG93LnNwbGl0LmRvICdzaG93IHRlcm1pbmFsJ1xuXG4gICAgICAgIHRydWVcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIGp1bXBUb0NvdW50ZXJwYXJ0OiAoKSAtPlxuXG4gICAgICAgIGNwID0gQGN1cnNvclBvcygpXG4gICAgICAgIGN1cnJleHQgPSBzbGFzaC5leHQgQGN1cnJlbnRGaWxlXG5cbiAgICAgICAgc3dpdGNoIGN1cnJleHRcbiAgICAgICAgICAgIHdoZW4gJ2NvZmZlZScgJ2tvZmZlZSdcbiAgICAgICAgICAgICAgICBbZmlsZSxsaW5lLGNvbF0gPSBzcmNtYXAudG9KcyBAY3VycmVudEZpbGUsIGNwWzFdKzEsIGNwWzBdXG4gICAgICAgICAgICAgICAgaWYgZmlsZT9cbiAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdsb2FkRmlsZScgc2xhc2guam9pbkZpbGVMaW5lIGZpbGUsbGluZSxjb2xcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIHdoZW4gJ2pzJ1xuICAgICAgICAgICAgICAgIFtmaWxlLGxpbmUsY29sXSA9IHNyY21hcC50b0NvZmZlZSBAY3VycmVudEZpbGUsIGNwWzFdKzEsIGNwWzBdXG4gICAgICAgICAgICAgICAgaWYgZmlsZT9cbiAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdsb2FkRmlsZScgc2xhc2guam9pbkZpbGVMaW5lIGZpbGUsbGluZSxjb2xcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgICBjb3VudGVycGFydHMgPVxuICAgICAgICAgICAgY3BwOiAgICAgWydocHAnICdoJ11cbiAgICAgICAgICAgIGNjOiAgICAgIFsnaHBwJyAnaCddXG4gICAgICAgICAgICBoOiAgICAgICBbJ2NwcCcgJ2MnXVxuICAgICAgICAgICAgaHBwOiAgICAgWydjcHAnICdjJ11cbiAgICAgICAgICAgIGNvZmZlZTogIFsnanMnXVxuICAgICAgICAgICAga29mZmVlOiAgWydqcyddXG4gICAgICAgICAgICBqczogICAgICBbJ2NvZmZlZScna29mZmVlJ11cbiAgICAgICAgICAgIHB1ZzogICAgIFsnaHRtbCddXG4gICAgICAgICAgICBodG1sOiAgICBbJ3B1ZyddXG4gICAgICAgICAgICBjc3M6ICAgICBbJ3N0eWwnXVxuICAgICAgICAgICAgc3R5bDogICAgWydjc3MnXVxuXG4gICAgICAgIGZvciBleHQgaW4gKGNvdW50ZXJwYXJ0c1tjdXJyZXh0XSA/IFtdKVxuICAgICAgICAgICAgaWYgc2xhc2guZmlsZUV4aXN0cyBzbGFzaC5zd2FwRXh0IEBjdXJyZW50RmlsZSwgZXh0XG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdsb2FkRmlsZScgc2xhc2guc3dhcEV4dCBAY3VycmVudEZpbGUsIGV4dFxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAgICAgZm9yIGV4dCBpbiAoY291bnRlcnBhcnRzW2N1cnJleHRdID8gW10pXG4gICAgICAgICAgICBjb3VudGVyID0gc3dhcEV4dCBAY3VycmVudEZpbGUsIGV4dFxuICAgICAgICAgICAgY291bnRlciA9IGNvdW50ZXIucmVwbGFjZSBcIi8je2N1cnJleHR9L1wiIFwiLyN7ZXh0fS9cIlxuICAgICAgICAgICAgaWYgc2xhc2guZmlsZUV4aXN0cyBjb3VudGVyXG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdsb2FkRmlsZScgY291bnRlclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGZhbHNlXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGNlbnRlclRleHQ6IChjZW50ZXIsIGFuaW1hdGU9MzAwKSAtPlxuXG4gICAgICAgIEBzaXplLmNlbnRlclRleHQgPSBjZW50ZXJcbiAgICAgICAgQHVwZGF0ZUxheWVycygpXG5cbiAgICAgICAgQHNpemUub2Zmc2V0WCA9IE1hdGguZmxvb3IgQHNpemUuY2hhcldpZHRoLzIgKyBAc2l6ZS5udW1iZXJzV2lkdGhcbiAgICAgICAgaWYgY2VudGVyXG4gICAgICAgICAgICBiciAgICAgICAgPSBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgICAgdmlzQ29scyAgID0gcGFyc2VJbnQgYnIud2lkdGggLyBAc2l6ZS5jaGFyV2lkdGhcbiAgICAgICAgICAgIG5ld09mZnNldCA9IHBhcnNlSW50IEBzaXplLmNoYXJXaWR0aCAqICh2aXNDb2xzIC0gMTAwKSAvIDJcbiAgICAgICAgICAgIEBzaXplLm9mZnNldFggPSBNYXRoLm1heCBAc2l6ZS5vZmZzZXRYLCBuZXdPZmZzZXRcbiAgICAgICAgICAgIEBzaXplLmNlbnRlclRleHQgPSB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzaXplLmNlbnRlclRleHQgPSBmYWxzZVxuXG4gICAgICAgIEB1cGRhdGVMaW5lUG9zaXRpb25zIGFuaW1hdGVcblxuICAgICAgICBpZiBhbmltYXRlXG4gICAgICAgICAgICBsYXllcnMgPSBbJy5zZWxlY3Rpb25zJyAnLmhpZ2hsaWdodHMnICcuY3Vyc29ycyddXG4gICAgICAgICAgICB0cmFuc2kgPSBbJy5zZWxlY3Rpb24nICAnLmhpZ2hsaWdodCcgICcuY3Vyc29yJyBdLmNvbmNhdCBsYXllcnNcbiAgICAgICAgICAgIHJlc2V0VHJhbnMgPSA9PlxuICAgICAgICAgICAgICAgIHNldFN0eWxlICcuZWRpdG9yIC5sYXllcnMgJytsLCAndHJhbnNmb3JtJyBcInRyYW5zbGF0ZVgoMClcIiBmb3IgbCBpbiBsYXllcnNcbiAgICAgICAgICAgICAgICBzZXRTdHlsZSAnLmVkaXRvciAubGF5ZXJzICcrdCwgJ3RyYW5zaXRpb24nIFwiaW5pdGlhbFwiIGZvciB0IGluIHRyYW5zaVxuICAgICAgICAgICAgICAgIEB1cGRhdGVMYXllcnMoKVxuXG4gICAgICAgICAgICBpZiBjZW50ZXJcbiAgICAgICAgICAgICAgICBvZmZzZXRYID0gQHNpemUub2Zmc2V0WCAtIEBzaXplLm51bWJlcnNXaWR0aCAtIEBzaXplLmNoYXJXaWR0aC8yXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgb2Zmc2V0WCA9IE1hdGguZmxvb3IgQHNpemUuY2hhcldpZHRoLzIgKyBAc2l6ZS5udW1iZXJzV2lkdGhcbiAgICAgICAgICAgICAgICBvZmZzZXRYID0gTWF0aC5tYXggb2Zmc2V0WCwgKEBzY3JlZW5TaXplKCkud2lkdGggLSBAc2NyZWVuU2l6ZSgpLmhlaWdodCkgLyAyXG4gICAgICAgICAgICAgICAgb2Zmc2V0WCAtPSBAc2l6ZS5udW1iZXJzV2lkdGggKyBAc2l6ZS5jaGFyV2lkdGgvMlxuICAgICAgICAgICAgICAgIG9mZnNldFggKj0gLTFcblxuICAgICAgICAgICAgc2V0U3R5bGUgJy5lZGl0b3IgLmxheWVycyAnK2wsICd0cmFuc2Zvcm0nIFwidHJhbnNsYXRlWCgje29mZnNldFh9cHgpXCIgZm9yIGwgaW4gbGF5ZXJzXG4gICAgICAgICAgICBzZXRTdHlsZSAnLmVkaXRvciAubGF5ZXJzICcrdCwgJ3RyYW5zaXRpb24nIFwiYWxsICN7YW5pbWF0ZS8xMDAwfXNcIiBmb3IgdCBpbiB0cmFuc2lcbiAgICAgICAgICAgIHNldFRpbWVvdXQgcmVzZXRUcmFucywgYW5pbWF0ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdXBkYXRlTGF5ZXJzKClcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMFxuXG4gICAgb25Db250ZXh0TWVudTogKGV2ZW50KSA9PiBzdG9wRXZlbnQgZXZlbnQsIEBzaG93Q29udGV4dE1lbnUga3BvcyBldmVudFxuXG4gICAgc2hvd0NvbnRleHRNZW51OiAoYWJzUG9zKSA9PlxuXG4gICAgICAgIGlmIG5vdCBhYnNQb3M/XG4gICAgICAgICAgICBhYnNQb3MgPSBrcG9zIEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQsIEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcFxuXG4gICAgICAgIG9wdCA9IGl0ZW1zOiBbXG4gICAgICAgICAgICB0ZXh0OiAgICdCcm93c2UnXG4gICAgICAgICAgICBjb21ibzogICdjb21tYW5kKy4nXG4gICAgICAgICAgICBhY2NlbDogICdjdHJsKy4nXG4gICAgICAgICAgICBjYjogICAgIC0+IHdpbmRvdy5jb21tYW5kbGluZS5zdGFydENvbW1hbmQgJ2Jyb3dzZSdcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnQmFjaydcbiAgICAgICAgICAgIGNvbWJvOiAgJ2NvbW1hbmQrMSdcbiAgICAgICAgICAgIGNiOiAgICAgLT4gcG9zdC5lbWl0ICdtZW51QWN0aW9uJyAnTmF2aWdhdGUgQmFja3dhcmQnICMgZml4IG1lISBpbiBzYW1lIGZpbGUgbmF2aWdhdGlvbiFcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnJ1xuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdNYXhpbWl6ZSdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2NvbW1hbmQrc2hpZnQreSdcbiAgICAgICAgICAgIGFjY2VsOiAgJ2N0cmwrc2hpZnQreSdcbiAgICAgICAgICAgIGNiOiAgICAgLT4gd2luZG93LnNwbGl0Lm1heGltaXplRWRpdG9yKClcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnJ1xuICAgICAgICBdXG5cbiAgICAgICAgb3B0Lml0ZW1zID0gb3B0Lml0ZW1zLmNvbmNhdCB3aW5kb3cudGl0bGViYXIubWVudVRlbXBsYXRlKClcblxuICAgICAgICBvcHQueCA9IGFic1Bvcy54XG4gICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgcG9wdXAubWVudSBvcHRcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBjbGlja0F0UG9zOiAocCwgZXZlbnQpIC0+XG5cbiAgICAgICAgaWYgZXZlbnQubWV0YUtleVxuICAgICAgICAgICAgaWYga3BvcyhldmVudCkueCA8PSBAc2l6ZS5udW1iZXJzV2lkdGhcbiAgICAgICAgICAgICAgICBAc2luZ2xlQ3Vyc29yQXRQb3MgcFxuICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIHN1cGVyIHAsIGV2ZW50XG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0NoYXJFdmVudDogKG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnQpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmICd1bmhhbmRsZWQnICE9IHN1cGVyIG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnRcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdhbHQrY3RybCtlbnRlcicgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmNvbW1hbmRsaW5lLmNvbW1hbmRzLmNvZmZlZS5leGVjdXRlVGV4dCBAdGV4dE9mU2VsZWN0aW9uRm9yQ2xpcGJvYXJkKClcbiAgICAgICAgICAgIHdoZW4gJ2FsdCtjdHJsK3NoaWZ0K2VudGVyJyB0aGVuIHJldHVybiB3aW5kb3cuY29tbWFuZGxpbmUuY29tbWFuZHMuY29mZmVlLmV4ZWN1dGVUZXh0SW5NYWluIEB0ZXh0T2ZTZWxlY3Rpb25Gb3JDbGlwYm9hcmR0KClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrYWx0K3VwJyAnYWx0K28nIHRoZW4gcmV0dXJuIEBqdW1wVG9Db3VudGVycGFydCgpXG4gICAgICAgICAgICB3aGVuICdlc2MnXG4gICAgICAgICAgICAgICAgc3BsaXQgPSB3aW5kb3cuc3BsaXRcbiAgICAgICAgICAgICAgICBpZiBzcGxpdC50ZXJtaW5hbFZpc2libGUoKVxuICAgICAgICAgICAgICAgICAgICBzcGxpdC5oaWRlVGVybWluYWwoKVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgc3BsaXQuY29tbWFuZGxpbmVWaXNpYmxlKClcbiAgICAgICAgICAgICAgICAgICAgc3BsaXQuaGlkZUNvbW1hbmRsaW5lKClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgJ3VuaGFuZGxlZCdcblxubW9kdWxlLmV4cG9ydHMgPSBGaWxlRWRpdG9yXG4iXX0=
//# sourceURL=../../coffee/editor/fileeditor.coffee