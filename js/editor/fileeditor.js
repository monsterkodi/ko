// koffee 1.7.0

/*
00000000  000  000      00000000        00000000  0000000    000  000000000   0000000   00000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000000    000  000      0000000         0000000   000   000  000     000     000   000  0000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000       000  0000000  00000000        00000000  0000000    000     000      0000000   000   000
 */
var FileEditor, Syntax, TextEditor, Watcher, _, clamp, electron, empty, kerror, kpos, popup, post, ref, setStyle, slash, srcmap, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf;

ref = require('kxk'), _ = ref._, clamp = ref.clamp, empty = ref.empty, kerror = ref.kerror, kpos = ref.kpos, popup = ref.popup, post = ref.post, setStyle = ref.setStyle, slash = ref.slash, srcmap = ref.srcmap, stopEvent = ref.stopEvent;

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
            if (koffee_96_12 = process.hrtime.bigint()) {
                this.setText(slash.readText(this.currentFile));
                console.log('setText', (function(b){ let f=1000n; for (let u of ['ns','μs','ms','s']) { if (u=='s' || b<f) { return ''+(1000n*b/f)+u; } f*=1000n; }})(process.hrtime.bigint()-koffee_96_12));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsc0lBQUE7SUFBQTs7Ozs7QUFRQSxNQUFxRixPQUFBLENBQVEsS0FBUixDQUFyRixFQUFFLFNBQUYsRUFBSyxpQkFBTCxFQUFZLGlCQUFaLEVBQW1CLG1CQUFuQixFQUEyQixlQUEzQixFQUFpQyxpQkFBakMsRUFBd0MsZUFBeEMsRUFBOEMsdUJBQTlDLEVBQXdELGlCQUF4RCxFQUErRCxtQkFBL0QsRUFBdUU7O0FBRXZFLE9BQUEsR0FBYSxPQUFBLENBQVEsa0JBQVI7O0FBQ2IsVUFBQSxHQUFhLE9BQUEsQ0FBUSxjQUFSOztBQUNiLE1BQUEsR0FBYSxPQUFBLENBQVEsVUFBUjs7QUFDYixRQUFBLEdBQWEsT0FBQSxDQUFRLFVBQVI7O0FBRVA7OztJQUVDLG9CQUFDLFFBQUQ7Ozs7OztRQUVDLDRDQUFNLFFBQU4sRUFDSTtZQUFBLFFBQUEsRUFBVSxDQUNOLFNBRE0sRUFFTixXQUZNLEVBR04sU0FITSxFQUlOLFNBSk0sRUFLTixNQUxNLEVBTU4sY0FOTSxFQU9OLFVBUE0sRUFRTixTQVJNLEVBU04sWUFUTSxDQUFWO1lBV0EsUUFBQSxFQUFVLEVBWFY7U0FESjtRQWNBLElBQUMsQ0FBQSxXQUFELEdBQWU7UUFDZixJQUFDLENBQUEsS0FBRCxHQUFlO1FBRWYsSUFBQyxDQUFBLElBQUksQ0FBQyxnQkFBTixDQUF1QixhQUF2QixFQUFzQyxJQUFDLENBQUEsYUFBdkM7UUFFQSxJQUFJLENBQUMsRUFBTCxDQUFRLGFBQVIsRUFBd0IsSUFBQyxDQUFBLGFBQXpCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxRQUFSLEVBQXdCLElBQUMsQ0FBQSxNQUF6QjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsWUFBUixFQUF3QixJQUFDLENBQUEsVUFBekI7UUFFQSxJQUFDLENBQUEsWUFBRCxDQUFBO1FBQ0EsSUFBQyxDQUFBLGNBQUQsQ0FBQTtRQUVBLElBQUMsQ0FBQSxPQUFELENBQVMsRUFBVDtJQTVCRDs7eUJBb0NILE9BQUEsR0FBUyxTQUFDLFVBQUQ7QUFFTCxZQUFBO1FBQUEsd0NBQU0sVUFBTjtRQUNBLEtBQUEsR0FBUSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsY0FBSixDQUFBO1FBQ1IsSUFBRyxJQUFDLENBQUEsS0FBRCxLQUFVLEtBQWI7WUFDSSxJQUFDLENBQUEsS0FBRCxHQUFTO21CQUNULElBQUksQ0FBQyxJQUFMLENBQVUsT0FBVixFQUFrQixJQUFDLENBQUEsS0FBbkIsRUFGSjs7SUFKSzs7eUJBY1QsS0FBQSxHQUFPLFNBQUE7QUFFSCxZQUFBO1FBQUEsSUFBQyxDQUFBLEtBQUQsR0FBUztRQUNULElBQUMsQ0FBQSxhQUFELENBQWUsS0FBZjtRQUNBLElBQUMsQ0FBQSxXQUFELENBQUE7O2dCQUNRLENBQUUsS0FBVixDQUFBOzs7Z0JBQ0ssQ0FBRSxLQUFQLENBQUE7O1FBQ0EsSUFBQyxDQUFBLFFBQUQsQ0FBVSxDQUFDLEVBQUQsQ0FBVjtlQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxLQUFKLENBQUE7SUFSRzs7eUJBVVAsY0FBQSxHQUFnQixTQUFDLElBQUQsRUFBTyxZQUFQO0FBSVosWUFBQTtRQUFBLElBQUMsQ0FBQSxLQUFELENBQUE7UUFDQSxJQUFDLENBQUEsV0FBRCxDQUFBO1FBRUEsSUFBQyxDQUFBLFdBQUQsR0FBZTtRQUVmLElBQUMsQ0FBQSxhQUFELENBQUE7UUFFQSxVQUFBLEdBQWEsMEJBQUEsSUFBa0IsS0FBSyxDQUFDLFVBQU4sQ0FBaUIsSUFBQyxDQUFBLFdBQWxCO1FBRS9CLElBQUcsWUFBSDtZQUNJLElBQUMsQ0FBQSxPQUFELENBQVMsWUFBWSxDQUFDLElBQWIsQ0FBQSxDQUFUO1lBQ0EsSUFBQyxDQUFBLEtBQUQsR0FBUztZQUNULElBQUMsQ0FBQSxLQUFELEdBQVMsS0FIYjtTQUFBLE1BSUssSUFBRyxVQUFIO1lBQ0YsSUFBQSxzQ0FBQTtnQkFDSyxJQUFDLENBQUEsT0FBRCxDQUFTLEtBQUssQ0FBQyxRQUFOLENBQWUsSUFBQyxDQUFBLFdBQWhCLENBQVQsRUFETDs2TUFBQTtjQURFOztRQUlMLElBQUcsVUFBSDtZQUNJLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBSSxPQUFKLENBQVksSUFBQyxDQUFBLFdBQWI7O29CQUNjLENBQUUsT0FBekIsQ0FBaUMsSUFBQyxDQUFBLFdBQWxDO2FBRko7O1FBSUEsSUFBSSxDQUFDLElBQUwsQ0FBVSxNQUFWLEVBQWlCLElBQUMsQ0FBQSxXQUFsQjtRQUVBLElBQUMsQ0FBQSxJQUFELENBQU0sTUFBTixFQUFhLElBQUMsQ0FBQSxXQUFkO2VBRUEsSUFBSSxDQUFDLElBQUwsQ0FBVSxPQUFWLEVBQWtCLElBQUMsQ0FBQSxLQUFuQjtJQTdCWTs7eUJBK0JoQixVQUFBLEdBQVksU0FBQTtRQUVSLElBQUcsMEJBQUEsSUFBa0IsS0FBSyxDQUFDLFVBQU4sQ0FBaUIsSUFBQyxDQUFBLFdBQWxCLENBQXJCO21CQUNJLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBQyxDQUFBLFdBQVgsRUFESjtTQUFBLE1BQUE7bUJBR0ksS0FBSyxDQUFDLElBQU4sQ0FBVyxPQUFPLENBQUMsR0FBUixDQUFBLENBQVgsRUFISjs7SUFGUTs7eUJBT1osbUJBQUEsR0FBcUIsU0FBQyxRQUFEO1FBRWpCLElBQXlDLHFCQUF6QztBQUFBLG1CQUFPLE1BQUEsQ0FBTyxtQkFBUCxFQUFQOztlQUNBLElBQUMsQ0FBQSxjQUFELENBQWdCLFFBQVEsQ0FBQyxJQUF6QixFQUErQixRQUFRLENBQUMsS0FBeEM7SUFIaUI7O3lCQUtyQixXQUFBLEdBQWEsU0FBQTtBQUVULFlBQUE7O2dCQUFNLENBQUUsSUFBUixDQUFBOztlQUNBLElBQUMsQ0FBQSxLQUFELEdBQVM7SUFIQTs7eUJBV2IsZUFBQSxHQUFpQixTQUFBO0FBRWIsWUFBQTtRQUFBLElBQXNDLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBdEM7WUFBQSxRQUFBLEdBQVcsTUFBTSxDQUFDLE9BQVAsQ0FBZSxJQUFDLENBQUEsSUFBRCxDQUFNLENBQU4sQ0FBZixFQUFYOztRQUNBLElBQUcsUUFBQSxLQUFZLEtBQWY7WUFDSSxJQUFHLHdCQUFIO2dCQUNJLEdBQUEsR0FBTSxLQUFLLENBQUMsR0FBTixDQUFVLElBQUMsQ0FBQSxXQUFYO2dCQUNOLElBQUcsYUFBTyxNQUFNLENBQUMsV0FBZCxFQUFBLEdBQUEsTUFBSDtBQUNJLDJCQUFPLElBRFg7aUJBRko7YUFESjtTQUFBLE1BS0ssSUFBRyxRQUFIO0FBQ0QsbUJBQU8sU0FETjs7ZUFHTCw4Q0FBQTtJQVhhOzt5QkFtQmpCLGFBQUEsR0FBZSxTQUFDLENBQUQ7QUFFWCxZQUFBO0FBQUEsZ0JBQU8sQ0FBUDtBQUFBLGlCQUNTLFFBRFQ7QUFBQSxpQkFDa0IsT0FEbEI7Z0JBRVEsQ0FBQSxHQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsaUJBQWIsR0FBaUMsTUFBTSxDQUFDLEtBQUssQ0FBQztnQkFDbEQsQ0FBQSxHQUFJLElBQUksQ0FBQyxHQUFMLENBQVMsQ0FBVCxFQUFZLElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBUixHQUFvQixJQUFDLENBQUEsTUFBTSxDQUFDLE1BQXhDO2dCQUNKLElBQVcsQ0FBQSxLQUFLLFFBQWhCO29CQUFBLENBQUEsSUFBSyxDQUFDLEVBQU47O3VCQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLENBQVg7QUFMUjtJQUZXOzt5QkFlZiw4QkFBQSxHQUFnQyxTQUFDLEdBQUQ7QUFFNUIsWUFBQTtRQUFBLElBQVUsQ0FBSSxJQUFDLENBQUEsV0FBZjtBQUFBLG1CQUFBOztRQUNBLENBQUEsR0FBSTtRQUVKLENBQUMsQ0FBQyxJQUFGLEdBQWUsSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLENBQUE7UUFDZixJQUFzQyxJQUFDLENBQUEsVUFBRCxDQUFBLENBQUEsR0FBZ0IsQ0FBaEIsSUFBcUIsSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFhLENBQUEsQ0FBQSxDQUFsQyxJQUF3QyxJQUFDLENBQUEsU0FBRCxDQUFBLENBQWEsQ0FBQSxDQUFBLENBQTNGO1lBQUEsQ0FBQyxDQUFDLE9BQUYsR0FBZSxJQUFDLENBQUEsS0FBSyxDQUFDLE9BQVAsQ0FBQSxFQUFmOztRQUNBLElBQXNDLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBdEM7WUFBQSxDQUFDLENBQUMsVUFBRixHQUFlLElBQUMsQ0FBQSxLQUFLLENBQUMsVUFBUCxDQUFBLEVBQWY7O1FBQ0EsSUFBc0MsSUFBQyxDQUFBLGFBQUQsQ0FBQSxDQUF0QztZQUFBLENBQUMsQ0FBQyxVQUFGLEdBQWUsSUFBQyxDQUFBLEtBQUssQ0FBQyxVQUFQLENBQUEsRUFBZjs7UUFFQSxJQUE2QixJQUFDLENBQUEsTUFBTSxDQUFDLE1BQXJDO1lBQUEsQ0FBQyxDQUFDLE1BQUYsR0FBVyxJQUFDLENBQUEsTUFBTSxDQUFDLE9BQW5COztRQUVBLGFBQUEsR0FBZ0IsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFiLENBQWlCLGVBQWpCLEVBQWlDLE1BQU0sQ0FBQyxNQUFQLENBQWMsSUFBZCxDQUFqQztRQUNoQixJQUFHLENBQUksQ0FBQyxDQUFDLGFBQUYsQ0FBZ0IsYUFBaEIsQ0FBUDtZQUNJLGFBQUEsR0FBZ0IsTUFBTSxDQUFDLE1BQVAsQ0FBYyxJQUFkLEVBRHBCOztRQUVBLGFBQWMsQ0FBQSxJQUFDLENBQUEsV0FBRCxDQUFkLEdBQThCO2VBQzlCLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBYixDQUFpQixlQUFqQixFQUFpQyxhQUFqQztJQWhCNEI7O3lCQXdCaEMsaUNBQUEsR0FBbUMsU0FBQTtBQUUvQixZQUFBO1FBQUEsSUFBVSxDQUFJLElBQUMsQ0FBQSxXQUFmO0FBQUEsbUJBQUE7O1FBRUEsYUFBQSxHQUFnQixNQUFNLENBQUMsS0FBSyxDQUFDLEdBQWIsQ0FBaUIsZUFBakIsRUFBaUMsRUFBakM7UUFFaEIsSUFBRyx1Q0FBSDtZQUVJLENBQUEsR0FBSSxhQUFjLENBQUEsSUFBQyxDQUFBLFdBQUQ7WUFFbEIsT0FBQSx1Q0FBc0IsQ0FBQyxDQUFDLENBQUQsRUFBRyxDQUFILENBQUQ7WUFDdEIsT0FBQSxHQUFVLE9BQU8sQ0FBQyxHQUFSLENBQVksQ0FBQSxTQUFBLEtBQUE7dUJBQUEsU0FBQyxDQUFEOzJCQUFPLENBQUMsQ0FBRSxDQUFBLENBQUEsQ0FBSCxFQUFPLEtBQUEsQ0FBTSxDQUFOLEVBQVEsS0FBQyxDQUFBLFFBQUQsQ0FBQSxDQUFBLEdBQVksQ0FBcEIsRUFBc0IsQ0FBRSxDQUFBLENBQUEsQ0FBeEIsQ0FBUDtnQkFBUDtZQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBWjtZQUVWLElBQUMsQ0FBQSxVQUFELENBQWUsT0FBZjtZQUNBLElBQUMsQ0FBQSxhQUFELHdDQUE4QixFQUE5QjtZQUNBLElBQUMsQ0FBQSxhQUFELHdDQUE4QixFQUE5QjtZQUNBLElBQUMsQ0FBQSxPQUFELGtDQUF3QixDQUF4QjtZQUNBLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBQyxDQUFBLEtBQVg7WUFFQSxJQUF1QixDQUFDLENBQUMsTUFBekI7Z0JBQUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsQ0FBQyxDQUFDLE1BQWIsRUFBQTs7WUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLGNBQVIsQ0FBQSxFQWRKO1NBQUEsTUFBQTtZQWtCSSxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsQ0FBQyxDQUFELEVBQUcsQ0FBSCxDQUFuQjtZQUNBLElBQW1CLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBYyxDQUFBLENBQUEsQ0FBZCxLQUFvQixDQUF2QztnQkFBQSxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQVIsR0FBYyxFQUFkOztZQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FBUixHQUFjLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FBUixHQUFZO1lBQzFCLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLENBQVg7WUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLGNBQVIsQ0FBQSxFQXRCSjs7UUF3QkEsSUFBQyxDQUFBLFlBQUQsQ0FBQTs7Z0JBQ1EsQ0FBRSxZQUFWLENBQUE7O1FBQ0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxjQUFULENBQUE7UUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLFFBQU47ZUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLFdBQU47SUFsQytCOzt5QkEwQ25DLFVBQUEsR0FBWSxTQUFDLEdBQUQ7QUFFUixZQUFBO1FBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFaLENBQXNCLElBQXRCO1FBRUEsSUFBRyxHQUFHLENBQUMsTUFBUDtZQUVJLElBQUEsR0FBTyxHQUFHLENBQUM7WUFDWCxJQUEwQixHQUFHLENBQUMsSUFBOUI7Z0JBQUEsSUFBQSxJQUFRLEdBQUEsR0FBTSxHQUFHLENBQUMsS0FBbEI7O1lBQ0EsSUFBeUIsR0FBRyxDQUFDLEdBQTdCO2dCQUFBLElBQUEsSUFBUSxHQUFBLEdBQU0sR0FBRyxDQUFDLElBQWxCOzttQkFDQSxJQUFJLENBQUMsSUFBTCxDQUFVLGdCQUFWLEVBQTJCLElBQTNCLEVBTEo7U0FBQSxNQUFBO1lBU0ksT0FBZSxLQUFLLENBQUMsWUFBTixDQUFtQixHQUFHLENBQUMsSUFBdkIsQ0FBZixFQUFDLGNBQUQsRUFBTztZQUNQLEdBQUcsQ0FBQyxHQUFKLEdBQVU7WUFDVixJQUF3QixHQUFHLENBQUMsR0FBNUI7Z0JBQUEsR0FBRyxDQUFDLEdBQUksQ0FBQSxDQUFBLENBQVIsR0FBYSxHQUFHLENBQUMsSUFBakI7O1lBQ0EsSUFBMkIsR0FBRyxDQUFDLElBQS9CO2dCQUFBLEdBQUcsQ0FBQyxHQUFJLENBQUEsQ0FBQSxDQUFSLEdBQWEsR0FBRyxDQUFDLElBQUosR0FBUyxFQUF0Qjs7WUFDQSxHQUFHLENBQUMsS0FBSixHQUFhLE1BQU0sQ0FBQztZQUVwQixHQUFHLENBQUMsTUFBSixHQUFhLElBQUMsQ0FBQSxTQUFELENBQUE7WUFDYixHQUFHLENBQUMsT0FBSixHQUFjLElBQUMsQ0FBQTttQkFDZixNQUFNLENBQUMsUUFBUSxDQUFDLFdBQWhCLENBQTRCLEdBQTVCLEVBakJKOztJQUpROzt5QkF1QlosTUFBQSxHQUFRLFNBQUMsSUFBRCxFQUFPLEdBQVA7QUFFSixZQUFBO1FBQUEsSUFBRyxDQUFDLENBQUMsUUFBRixDQUFXLElBQVgsQ0FBQSxJQUF5QixhQUE1QjtZQUNJLEdBQUEsR0FBTztZQUNQLElBQUEsR0FBTyxHQUFHLENBQUMsS0FGZjs7O1lBSUE7O1lBQUEsTUFBTzs7UUFFUCxJQUFHLGdCQUFIO1lBQ0ksSUFBQyxDQUFBLFVBQUQsQ0FBWSxHQUFaO0FBQ0EsbUJBQU8sS0FGWDs7UUFJQSxJQUF1QyxLQUFBLENBQU0sSUFBTixDQUF2QztBQUFBLG1CQUFPLE1BQUEsQ0FBTyxxQkFBUCxFQUFQOztRQUVBLElBQUEsR0FBTyxJQUFJLENBQUMsV0FBTCxDQUFBLENBQWtCLENBQUMsSUFBbkIsQ0FBQTtRQUNQLElBQXVCLElBQUssQ0FBQSxDQUFBLENBQUwsS0FBVyxHQUFsQztZQUFBLElBQUEsR0FBTyxJQUFJLENBQUMsS0FBTCxDQUFXLENBQVgsRUFBUDs7UUFFQSxJQUF5RCxLQUFBLENBQU0sSUFBTixDQUF6RDtBQUFBLG1CQUFPLE1BQUEsQ0FBTyx1Q0FBUCxFQUFQOztRQUVBLElBQUEsaUJBQU8sR0FBRyxDQUFFO1FBRVosSUFBRyxDQUFJLElBQUosSUFBWSxJQUFBLEtBQVEsT0FBdkI7WUFDSSxPQUFBLEdBQVUsSUFBSSxDQUFDLEdBQUwsQ0FBUyxTQUFULEVBQW1CLFNBQW5CO0FBQ1YsaUJBQUEsZUFBQTs7Z0JBQ0ksSUFBRyxJQUFJLENBQUMsV0FBTCxDQUFBLENBQUEsS0FBc0IsSUFBekI7b0JBQ0ksSUFBQyxDQUFBLFVBQUQsQ0FBWSxJQUFaO0FBQ0EsMkJBQU8sS0FGWDs7QUFESixhQUZKOztRQU9BLElBQUcsQ0FBSSxJQUFKLElBQVksSUFBQSxLQUFRLE1BQXZCO1lBQ0ksS0FBQSxHQUFRLElBQUksQ0FBQyxHQUFMLENBQVMsU0FBVCxFQUFtQixPQUFuQjtBQUNSLGlCQUFBLGFBQUE7O2dCQUNJLElBQUcsSUFBSSxDQUFDLFdBQUwsQ0FBQSxDQUFBLEtBQXNCLElBQXpCO29CQUNJLElBQUEsR0FBTyxLQUFNLENBQUEsQ0FBQTtBQUNiLHlCQUFBLHVDQUFBOzt3QkFDSSxJQUFHLENBQUMsQ0FBQyxJQUFGLEtBQVUsSUFBQyxDQUFBLFdBQWQ7NEJBQ0ksSUFBQSxHQUFPLEVBRFg7O0FBREo7b0JBR0EsSUFBQyxDQUFBLFVBQUQsQ0FBWSxJQUFaO0FBQ0EsMkJBQU8sS0FOWDs7QUFESixhQUZKOztRQVdBLElBQUcsQ0FBSSxJQUFKLElBQVksSUFBQSxLQUFRLE1BQXZCO1lBQ0ksS0FBQSxHQUFRLElBQUksQ0FBQyxHQUFMLENBQVMsU0FBVCxFQUFtQixPQUFuQjtBQUNSLGlCQUFBLGFBQUE7O2dCQUNJLElBQUcsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLENBQWdCLENBQUMsV0FBakIsQ0FBQSxDQUFBLEtBQWtDLElBQWxDLElBQTJDLElBQUEsS0FBUSxJQUFDLENBQUEsV0FBdkQ7b0JBQ0ksSUFBQyxDQUFBLFVBQUQsQ0FBWTt3QkFBQSxJQUFBLEVBQUssSUFBTDt3QkFBVyxJQUFBLEVBQUssQ0FBaEI7cUJBQVosRUFESjs7QUFESixhQUZKOztRQU1BLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFuQyxDQUF5QyxRQUF6QztRQUNBLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFuQyxDQUEyQyxJQUEzQztRQUVBLE1BQU0sQ0FBQyxLQUFLLEVBQUMsRUFBRCxFQUFaLENBQWdCLGVBQWhCO2VBRUE7SUFsREk7O3lCQTBEUixpQkFBQSxHQUFtQixTQUFBO0FBRWYsWUFBQTtRQUFBLEVBQUEsR0FBSyxJQUFDLENBQUEsU0FBRCxDQUFBO1FBQ0wsT0FBQSxHQUFVLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBQyxDQUFBLFdBQVg7QUFFVixnQkFBTyxPQUFQO0FBQUEsaUJBQ1MsUUFEVDtBQUFBLGlCQUNrQixRQURsQjtnQkFFUSxPQUFrQixNQUFNLENBQUMsSUFBUCxDQUFZLElBQUMsQ0FBQSxXQUFiLEVBQTBCLEVBQUcsQ0FBQSxDQUFBLENBQUgsR0FBTSxDQUFoQyxFQUFtQyxFQUFHLENBQUEsQ0FBQSxDQUF0QyxDQUFsQixFQUFDLGNBQUQsRUFBTSxjQUFOLEVBQVc7Z0JBQ1gsSUFBRyxZQUFIO29CQUNJLElBQUksQ0FBQyxJQUFMLENBQVUsVUFBVixFQUFxQixLQUFLLENBQUMsWUFBTixDQUFtQixJQUFuQixFQUF3QixJQUF4QixFQUE2QixHQUE3QixDQUFyQjtBQUNBLDJCQUFPLEtBRlg7O0FBRlU7QUFEbEIsaUJBTVMsSUFOVDtnQkFPUSxPQUFrQixNQUFNLENBQUMsUUFBUCxDQUFnQixJQUFDLENBQUEsV0FBakIsRUFBOEIsRUFBRyxDQUFBLENBQUEsQ0FBSCxHQUFNLENBQXBDLEVBQXVDLEVBQUcsQ0FBQSxDQUFBLENBQTFDLENBQWxCLEVBQUMsY0FBRCxFQUFNLGNBQU4sRUFBVztnQkFDWCxJQUFHLFlBQUg7b0JBQ0ksSUFBSSxDQUFDLElBQUwsQ0FBVSxVQUFWLEVBQXFCLEtBQUssQ0FBQyxZQUFOLENBQW1CLElBQW5CLEVBQXdCLElBQXhCLEVBQTZCLEdBQTdCLENBQXJCO0FBQ0EsMkJBQU8sS0FGWDs7QUFSUjtRQVlBLFlBQUEsR0FDSTtZQUFBLEdBQUEsRUFBUyxDQUFDLEtBQUQsRUFBTyxHQUFQLENBQVQ7WUFDQSxFQUFBLEVBQVMsQ0FBQyxLQUFELEVBQU8sR0FBUCxDQURUO1lBRUEsQ0FBQSxFQUFTLENBQUMsS0FBRCxFQUFPLEdBQVAsQ0FGVDtZQUdBLEdBQUEsRUFBUyxDQUFDLEtBQUQsRUFBTyxHQUFQLENBSFQ7WUFJQSxNQUFBLEVBQVMsQ0FBQyxJQUFELENBSlQ7WUFLQSxNQUFBLEVBQVMsQ0FBQyxJQUFELENBTFQ7WUFNQSxFQUFBLEVBQVMsQ0FBQyxRQUFELEVBQVMsUUFBVCxDQU5UO1lBT0EsR0FBQSxFQUFTLENBQUMsTUFBRCxDQVBUO1lBUUEsSUFBQSxFQUFTLENBQUMsS0FBRCxDQVJUO1lBU0EsR0FBQSxFQUFTLENBQUMsTUFBRCxDQVRUO1lBVUEsSUFBQSxFQUFTLENBQUMsS0FBRCxDQVZUOztBQVlKO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxJQUFHLEtBQUssQ0FBQyxVQUFOLENBQWlCLEtBQUssQ0FBQyxPQUFOLENBQWMsSUFBQyxDQUFBLFdBQWYsRUFBNEIsR0FBNUIsQ0FBakIsQ0FBSDtnQkFDSSxJQUFJLENBQUMsSUFBTCxDQUFVLFVBQVYsRUFBcUIsS0FBSyxDQUFDLE9BQU4sQ0FBYyxJQUFDLENBQUEsV0FBZixFQUE0QixHQUE1QixDQUFyQjtBQUNBLHVCQUFPLEtBRlg7O0FBREo7QUFLQTtBQUFBLGFBQUEsd0NBQUE7O1lBQ0ksT0FBQSxHQUFVLE9BQUEsQ0FBUSxJQUFDLENBQUEsV0FBVCxFQUFzQixHQUF0QjtZQUNWLE9BQUEsR0FBVSxPQUFPLENBQUMsT0FBUixDQUFnQixHQUFBLEdBQUksT0FBSixHQUFZLEdBQTVCLEVBQStCLEdBQUEsR0FBSSxHQUFKLEdBQVEsR0FBdkM7WUFDVixJQUFHLEtBQUssQ0FBQyxVQUFOLENBQWlCLE9BQWpCLENBQUg7Z0JBQ0ksSUFBSSxDQUFDLElBQUwsQ0FBVSxVQUFWLEVBQXFCLE9BQXJCO0FBQ0EsdUJBQU8sS0FGWDs7QUFISjtlQU1BO0lBekNlOzt5QkFpRG5CLFVBQUEsR0FBWSxTQUFDLE1BQUQsRUFBUyxPQUFUO0FBRVIsWUFBQTs7WUFGaUIsVUFBUTs7UUFFekIsSUFBQyxDQUFBLElBQUksQ0FBQyxVQUFOLEdBQW1CO1FBQ25CLElBQUMsQ0FBQSxZQUFELENBQUE7UUFFQSxJQUFDLENBQUEsSUFBSSxDQUFDLE9BQU4sR0FBZ0IsSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sR0FBZ0IsQ0FBaEIsR0FBb0IsSUFBQyxDQUFBLElBQUksQ0FBQyxZQUFyQztRQUNoQixJQUFHLE1BQUg7WUFDSSxFQUFBLEdBQVksSUFBQyxDQUFBLElBQUksQ0FBQyxxQkFBTixDQUFBO1lBQ1osT0FBQSxHQUFZLFFBQUEsQ0FBUyxFQUFFLENBQUMsS0FBSCxHQUFXLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBMUI7WUFDWixTQUFBLEdBQVksUUFBQSxDQUFTLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBTixHQUFrQixDQUFDLE9BQUEsR0FBVSxHQUFYLENBQWxCLEdBQW9DLENBQTdDO1lBQ1osSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFOLEdBQWdCLElBQUksQ0FBQyxHQUFMLENBQVMsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFmLEVBQXdCLFNBQXhCO1lBQ2hCLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBTixHQUFtQixLQUx2QjtTQUFBLE1BQUE7WUFPSSxJQUFDLENBQUEsSUFBSSxDQUFDLFVBQU4sR0FBbUIsTUFQdkI7O1FBU0EsSUFBQyxDQUFBLG1CQUFELENBQXFCLE9BQXJCO1FBRUEsSUFBRyxPQUFIO1lBQ0ksTUFBQSxHQUFTLENBQUMsYUFBRCxFQUFlLGFBQWYsRUFBNkIsVUFBN0I7WUFDVCxNQUFBLEdBQVMsQ0FBQyxZQUFELEVBQWUsWUFBZixFQUE2QixTQUE3QixDQUF3QyxDQUFDLE1BQXpDLENBQWdELE1BQWhEO1lBQ1QsVUFBQSxHQUFhLENBQUEsU0FBQSxLQUFBO3VCQUFBLFNBQUE7QUFDVCx3QkFBQTtBQUFBLHlCQUFBLHdDQUFBOzt3QkFBQSxRQUFBLENBQVMsa0JBQUEsR0FBbUIsQ0FBNUIsRUFBK0IsV0FBL0IsRUFBMkMsZUFBM0M7QUFBQTtBQUNBLHlCQUFBLDBDQUFBOzt3QkFBQSxRQUFBLENBQVMsa0JBQUEsR0FBbUIsQ0FBNUIsRUFBK0IsWUFBL0IsRUFBNEMsU0FBNUM7QUFBQTsyQkFDQSxLQUFDLENBQUEsWUFBRCxDQUFBO2dCQUhTO1lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtZQUtiLElBQUcsTUFBSDtnQkFDSSxPQUFBLEdBQVUsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFOLEdBQWdCLElBQUMsQ0FBQSxJQUFJLENBQUMsWUFBdEIsR0FBcUMsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLEdBQWdCLEVBRG5FO2FBQUEsTUFBQTtnQkFHSSxPQUFBLEdBQVUsSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sR0FBZ0IsQ0FBaEIsR0FBb0IsSUFBQyxDQUFBLElBQUksQ0FBQyxZQUFyQztnQkFDVixPQUFBLEdBQVUsSUFBSSxDQUFDLEdBQUwsQ0FBUyxPQUFULEVBQWtCLENBQUMsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFhLENBQUMsS0FBZCxHQUFzQixJQUFDLENBQUEsVUFBRCxDQUFBLENBQWEsQ0FBQyxNQUFyQyxDQUFBLEdBQStDLENBQWpFO2dCQUNWLE9BQUEsSUFBVyxJQUFDLENBQUEsSUFBSSxDQUFDLFlBQU4sR0FBcUIsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLEdBQWdCO2dCQUNoRCxPQUFBLElBQVcsQ0FBQyxFQU5oQjs7QUFRQSxpQkFBQSx3Q0FBQTs7Z0JBQUEsUUFBQSxDQUFTLGtCQUFBLEdBQW1CLENBQTVCLEVBQStCLFdBQS9CLEVBQTJDLGFBQUEsR0FBYyxPQUFkLEdBQXNCLEtBQWpFO0FBQUE7QUFDQSxpQkFBQSwwQ0FBQTs7Z0JBQUEsUUFBQSxDQUFTLGtCQUFBLEdBQW1CLENBQTVCLEVBQStCLFlBQS9CLEVBQTRDLE1BQUEsR0FBTSxDQUFDLE9BQUEsR0FBUSxJQUFULENBQU4sR0FBb0IsR0FBaEU7QUFBQTttQkFDQSxVQUFBLENBQVcsVUFBWCxFQUF1QixPQUF2QixFQWxCSjtTQUFBLE1BQUE7bUJBb0JJLElBQUMsQ0FBQSxZQUFELENBQUEsRUFwQko7O0lBakJROzt5QkE2Q1osYUFBQSxHQUFlLFNBQUMsS0FBRDtlQUFXLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxlQUFELENBQWlCLElBQUEsQ0FBSyxLQUFMLENBQWpCLENBQWpCO0lBQVg7O3lCQUVmLGVBQUEsR0FBaUIsU0FBQyxNQUFEO0FBRWIsWUFBQTtRQUFBLElBQU8sY0FBUDtZQUNJLE1BQUEsR0FBUyxJQUFBLENBQUssSUFBQyxDQUFBLElBQUksQ0FBQyxxQkFBTixDQUFBLENBQTZCLENBQUMsSUFBbkMsRUFBeUMsSUFBQyxDQUFBLElBQUksQ0FBQyxxQkFBTixDQUFBLENBQTZCLENBQUMsR0FBdkUsRUFEYjs7UUFHQSxHQUFBLEdBQU07WUFBQSxLQUFBLEVBQU87Z0JBQ1Q7b0JBQUEsSUFBQSxFQUFRLFFBQVI7b0JBQ0EsS0FBQSxFQUFRLFdBRFI7b0JBRUEsS0FBQSxFQUFRLFFBRlI7b0JBR0EsRUFBQSxFQUFRLFNBQUE7K0JBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFuQixDQUFnQyxRQUFoQztvQkFBSCxDQUhSO2lCQURTLEVBTVQ7b0JBQUEsSUFBQSxFQUFRLE1BQVI7b0JBQ0EsS0FBQSxFQUFRLFdBRFI7b0JBRUEsRUFBQSxFQUFRLFNBQUE7K0JBQUcsSUFBSSxDQUFDLElBQUwsQ0FBVSxZQUFWLEVBQXVCLG1CQUF2QjtvQkFBSCxDQUZSO2lCQU5TLEVBVVQ7b0JBQUEsSUFBQSxFQUFRLEVBQVI7aUJBVlMsRUFZVDtvQkFBQSxJQUFBLEVBQVEsVUFBUjtvQkFDQSxLQUFBLEVBQVEsaUJBRFI7b0JBRUEsS0FBQSxFQUFRLGNBRlI7b0JBR0EsRUFBQSxFQUFRLFNBQUE7K0JBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxjQUFiLENBQUE7b0JBQUgsQ0FIUjtpQkFaUyxFQWlCVDtvQkFBQSxJQUFBLEVBQVEsRUFBUjtpQkFqQlM7YUFBUDs7UUFvQk4sR0FBRyxDQUFDLEtBQUosR0FBWSxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQVYsQ0FBaUIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxZQUFoQixDQUFBLENBQWpCO1FBRVosR0FBRyxDQUFDLENBQUosR0FBUSxNQUFNLENBQUM7UUFDZixHQUFHLENBQUMsQ0FBSixHQUFRLE1BQU0sQ0FBQztlQUNmLEtBQUssQ0FBQyxJQUFOLENBQVcsR0FBWDtJQTdCYTs7eUJBcUNqQixVQUFBLEdBQVksU0FBQyxDQUFELEVBQUksS0FBSjtRQUVSLElBQUcsS0FBSyxDQUFDLE9BQVQ7WUFDSSxJQUFHLElBQUEsQ0FBSyxLQUFMLENBQVcsQ0FBQyxDQUFaLElBQWlCLElBQUMsQ0FBQSxJQUFJLENBQUMsWUFBMUI7Z0JBQ0ksSUFBQyxDQUFBLGlCQUFELENBQW1CLENBQW5CO0FBQ0EsdUJBRko7YUFESjs7ZUFLQSwyQ0FBTSxDQUFOLEVBQVMsS0FBVDtJQVBROzt5QkFlWiwwQkFBQSxHQUE0QixTQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsS0FBWCxFQUFrQixJQUFsQixFQUF3QixLQUF4QjtBQUV4QixZQUFBO1FBQUEsSUFBVSxXQUFBLEtBQWUsMkRBQU0sR0FBTixFQUFXLEdBQVgsRUFBZ0IsS0FBaEIsRUFBdUIsSUFBdkIsRUFBNkIsS0FBN0IsQ0FBekI7QUFBQSxtQkFBQTs7QUFDQSxnQkFBTyxLQUFQO0FBQUEsaUJBQ1MsZ0JBRFQ7QUFDcUMsdUJBQU8sTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFdBQW5DLENBQStDLElBQUMsQ0FBQSwyQkFBRCxDQUFBLENBQS9DO0FBRDVDLGlCQUVTLHNCQUZUO0FBRXFDLHVCQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxpQkFBbkMsQ0FBcUQsSUFBQyxDQUFBLDRCQUFELENBQUEsQ0FBckQ7QUFGNUMsaUJBR1MsZ0JBSFQ7QUFBQSxpQkFHMEIsT0FIMUI7QUFHdUMsdUJBQU8sSUFBQyxDQUFBLGlCQUFELENBQUE7QUFIOUMsaUJBSVMsS0FKVDtnQkFLUSxLQUFBLEdBQVEsTUFBTSxDQUFDO2dCQUNmLElBQUcsS0FBSyxDQUFDLGVBQU4sQ0FBQSxDQUFIO29CQUNJLEtBQUssQ0FBQyxZQUFOLENBQUEsRUFESjtpQkFBQSxNQUVLLElBQUcsS0FBSyxDQUFDLGtCQUFOLENBQUEsQ0FBSDtvQkFDRCxLQUFLLENBQUMsZUFBTixDQUFBLEVBREM7O0FBRUw7QUFWUjtlQVdBO0lBZHdCOzs7O0dBN2JQOztBQTZjekIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiMjI1xuXG57IF8sIGNsYW1wLCBlbXB0eSwga2Vycm9yLCBrcG9zLCBwb3B1cCwgcG9zdCwgc2V0U3R5bGUsIHNsYXNoLCBzcmNtYXAsIHN0b3BFdmVudCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5XYXRjaGVyICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvd2F0Y2hlcidcblRleHRFZGl0b3IgPSByZXF1aXJlICcuL3RleHRlZGl0b3InXG5TeW50YXggICAgID0gcmVxdWlyZSAnLi9zeW50YXgnXG5lbGVjdHJvbiAgID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5cbmNsYXNzIEZpbGVFZGl0b3IgZXh0ZW5kcyBUZXh0RWRpdG9yXG5cbiAgICBAOiAodmlld0VsZW0pIC0+XG5cbiAgICAgICAgc3VwZXIgdmlld0VsZW0sXG4gICAgICAgICAgICBmZWF0dXJlczogW1xuICAgICAgICAgICAgICAgICdEaWZmYmFyJ1xuICAgICAgICAgICAgICAgICdTY3JvbGxiYXInXG4gICAgICAgICAgICAgICAgJ051bWJlcnMnXG4gICAgICAgICAgICAgICAgJ01pbmltYXAnXG4gICAgICAgICAgICAgICAgJ01ldGEnXG4gICAgICAgICAgICAgICAgJ0F1dG9jb21wbGV0ZSdcbiAgICAgICAgICAgICAgICAnQnJhY2tldHMnXG4gICAgICAgICAgICAgICAgJ1N0cmluZ3MnXG4gICAgICAgICAgICAgICAgJ0N1cnNvckxpbmUnXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZm9udFNpemU6IDE5XG5cbiAgICAgICAgQGN1cnJlbnRGaWxlID0gbnVsbFxuICAgICAgICBAd2F0Y2ggICAgICAgPSBudWxsXG5cbiAgICAgICAgQHZpZXcuYWRkRXZlbnRMaXN0ZW5lciBcImNvbnRleHRtZW51XCIsIEBvbkNvbnRleHRNZW51XG5cbiAgICAgICAgcG9zdC5vbiAnY29tbWFuZGxpbmUnICAgQG9uQ29tbWFuZGxpbmVcbiAgICAgICAgcG9zdC5vbiAnanVtcFRvJyAgICAgICAgQGp1bXBUb1xuICAgICAgICBwb3N0Lm9uICdqdW1wVG9GaWxlJyAgICBAanVtcFRvRmlsZVxuXG4gICAgICAgIEBpbml0UGlnbWVudHMoKVxuICAgICAgICBAaW5pdEludmlzaWJsZXMoKVxuXG4gICAgICAgIEBzZXRUZXh0ICcnXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgY2hhbmdlZDogKGNoYW5nZUluZm8pIC0+XG5cbiAgICAgICAgc3VwZXIgY2hhbmdlSW5mb1xuICAgICAgICBkaXJ0eSA9IEBkby5oYXNMaW5lQ2hhbmdlcygpXG4gICAgICAgIGlmIEBkaXJ0eSAhPSBkaXJ0eVxuICAgICAgICAgICAgQGRpcnR5ID0gZGlydHlcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnZGlydHknIEBkaXJ0eVxuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICBjbGVhcjogLT5cblxuICAgICAgICBAZGlydHkgPSBmYWxzZVxuICAgICAgICBAc2V0U2FsdGVyTW9kZSBmYWxzZVxuICAgICAgICBAc3RvcFdhdGNoZXIoKVxuICAgICAgICBAZGlmZmJhcj8uY2xlYXIoKVxuICAgICAgICBAbWV0YT8uY2xlYXIoKVxuICAgICAgICBAc2V0TGluZXMgWycnXVxuICAgICAgICBAZG8ucmVzZXQoKVxuXG4gICAgc2V0Q3VycmVudEZpbGU6IChmaWxlLCByZXN0b3JlU3RhdGUpIC0+XG5cbiAgICAgICAgIyBrbG9nICdzZXRDdXJyZW50RmlsZScgZmlsZSAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBAY2xlYXIoKVxuICAgICAgICBAc3RvcFdhdGNoZXIoKVxuXG4gICAgICAgIEBjdXJyZW50RmlsZSA9IGZpbGVcblxuICAgICAgICBAc2V0dXBGaWxlVHlwZSgpXG5cbiAgICAgICAgZmlsZUV4aXN0cyA9IEBjdXJyZW50RmlsZT8gYW5kIHNsYXNoLmZpbGVFeGlzdHMgQGN1cnJlbnRGaWxlXG5cbiAgICAgICAgaWYgcmVzdG9yZVN0YXRlXG4gICAgICAgICAgICBAc2V0VGV4dCByZXN0b3JlU3RhdGUudGV4dCgpXG4gICAgICAgICAgICBAc3RhdGUgPSByZXN0b3JlU3RhdGVcbiAgICAgICAgICAgIEBkaXJ0eSA9IHRydWVcbiAgICAgICAgZWxzZSBpZiBmaWxlRXhpc3RzXG4gICAgICAgICAgICDilrhwcm9maWxlICdzZXRUZXh0J1xuICAgICAgICAgICAgICAgIEBzZXRUZXh0IHNsYXNoLnJlYWRUZXh0IEBjdXJyZW50RmlsZVxuXG4gICAgICAgIGlmIGZpbGVFeGlzdHNcbiAgICAgICAgICAgIEB3YXRjaCA9IG5ldyBXYXRjaGVyIEBjdXJyZW50RmlsZVxuICAgICAgICAgICAgd2luZG93LnRhYnMuYWN0aXZlVGFiKCk/LnNldEZpbGUgQGN1cnJlbnRGaWxlXG4gICAgICAgICAgICBcbiAgICAgICAgcG9zdC5lbWl0ICdmaWxlJyBAY3VycmVudEZpbGUgIyBicm93c2VyICYgc2hlbGZcblxuICAgICAgICBAZW1pdCAnZmlsZScgQGN1cnJlbnRGaWxlICMgZGlmZmJhciwgcGlnbWVudHMsIC4uLlxuXG4gICAgICAgIHBvc3QuZW1pdCAnZGlydHknIEBkaXJ0eVxuXG4gICAgY3VycmVudERpcjogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBjdXJyZW50RmlsZT8gYW5kIHNsYXNoLmZpbGVFeGlzdHMgQGN1cnJlbnRGaWxlXG4gICAgICAgICAgICBzbGFzaC5kaXIgQGN1cnJlbnRGaWxlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNsYXNoLnBhdGggcHJvY2Vzcy5jd2QoKVxuICAgICAgICBcbiAgICByZXN0b3JlRnJvbVRhYlN0YXRlOiAodGFiU3RhdGUpIC0+XG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciBcIm5vIHRhYlN0YXRlLmZpbGU/XCIgaWYgbm90IHRhYlN0YXRlLmZpbGU/XG4gICAgICAgIEBzZXRDdXJyZW50RmlsZSB0YWJTdGF0ZS5maWxlLCB0YWJTdGF0ZS5zdGF0ZVxuXG4gICAgc3RvcFdhdGNoZXI6IC0+XG5cbiAgICAgICAgQHdhdGNoPy5zdG9wKClcbiAgICAgICAgQHdhdGNoID0gbnVsbFxuXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAgICAwMDAgICAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMDAwMDAwXG5cbiAgICBzaGViYW5nRmlsZVR5cGU6IC0+XG5cbiAgICAgICAgZmlsZVR5cGUgPSBTeW50YXguc2hlYmFuZyBAbGluZSgwKSBpZiBAbnVtTGluZXMoKVxuICAgICAgICBpZiBmaWxlVHlwZSA9PSAndHh0J1xuICAgICAgICAgICAgaWYgQGN1cnJlbnRGaWxlP1xuICAgICAgICAgICAgICAgIGV4dCA9IHNsYXNoLmV4dCBAY3VycmVudEZpbGVcbiAgICAgICAgICAgICAgICBpZiBleHQgaW4gU3ludGF4LnN5bnRheE5hbWVzXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBleHRcbiAgICAgICAgZWxzZSBpZiBmaWxlVHlwZVxuICAgICAgICAgICAgcmV0dXJuIGZpbGVUeXBlXG5cbiAgICAgICAgc3VwZXIoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMFxuXG4gICAgb25Db21tYW5kbGluZTogKGUpID0+XG5cbiAgICAgICAgc3dpdGNoIGVcbiAgICAgICAgICAgIHdoZW4gJ2hpZGRlbicgJ3Nob3duJ1xuICAgICAgICAgICAgICAgIGQgPSB3aW5kb3cuc3BsaXQuY29tbWFuZGxpbmVIZWlnaHQgKyB3aW5kb3cuc3BsaXQuaGFuZGxlSGVpZ2h0XG4gICAgICAgICAgICAgICAgZCA9IE1hdGgubWluIGQsIEBzY3JvbGwuc2Nyb2xsTWF4IC0gQHNjcm9sbC5zY3JvbGxcbiAgICAgICAgICAgICAgICBkICo9IC0xIGlmIGUgPT0gJ2hpZGRlbidcbiAgICAgICAgICAgICAgICBAc2Nyb2xsLmJ5IGRcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwMDAwMDBcblxuICAgIHNhdmVTY3JvbGxDdXJzb3JzQW5kU2VsZWN0aW9uczogKG9wdCkgLT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IEBjdXJyZW50RmlsZVxuICAgICAgICBzID0ge31cblxuICAgICAgICBzLm1haW4gICAgICAgPSBAc3RhdGUubWFpbigpXG4gICAgICAgIHMuY3Vyc29ycyAgICA9IEBzdGF0ZS5jdXJzb3JzKCkgICAgaWYgQG51bUN1cnNvcnMoKSA+IDEgb3IgQGN1cnNvclBvcygpWzBdIG9yIEBjdXJzb3JQb3MoKVsxXVxuICAgICAgICBzLnNlbGVjdGlvbnMgPSBAc3RhdGUuc2VsZWN0aW9ucygpIGlmIEBudW1TZWxlY3Rpb25zKClcbiAgICAgICAgcy5oaWdobGlnaHRzID0gQHN0YXRlLmhpZ2hsaWdodHMoKSBpZiBAbnVtSGlnaGxpZ2h0cygpXG5cbiAgICAgICAgcy5zY3JvbGwgPSBAc2Nyb2xsLnNjcm9sbCBpZiBAc2Nyb2xsLnNjcm9sbFxuXG4gICAgICAgIGZpbGVQb3NpdGlvbnMgPSB3aW5kb3cuc3Rhc2guZ2V0ICdmaWxlUG9zaXRpb25zJyBPYmplY3QuY3JlYXRlIG51bGxcbiAgICAgICAgaWYgbm90IF8uaXNQbGFpbk9iamVjdCBmaWxlUG9zaXRpb25zXG4gICAgICAgICAgICBmaWxlUG9zaXRpb25zID0gT2JqZWN0LmNyZWF0ZSBudWxsXG4gICAgICAgIGZpbGVQb3NpdGlvbnNbQGN1cnJlbnRGaWxlXSA9IHNcbiAgICAgICAgd2luZG93LnN0YXNoLnNldCAnZmlsZVBvc2l0aW9ucycgZmlsZVBvc2l0aW9uc1xuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcblxuICAgIHJlc3RvcmVTY3JvbGxDdXJzb3JzQW5kU2VsZWN0aW9uczogLT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IEBjdXJyZW50RmlsZVxuICAgICAgICBcbiAgICAgICAgZmlsZVBvc2l0aW9ucyA9IHdpbmRvdy5zdGFzaC5nZXQgJ2ZpbGVQb3NpdGlvbnMnIHt9XG5cbiAgICAgICAgaWYgZmlsZVBvc2l0aW9uc1tAY3VycmVudEZpbGVdP1xuXG4gICAgICAgICAgICBzID0gZmlsZVBvc2l0aW9uc1tAY3VycmVudEZpbGVdXG5cbiAgICAgICAgICAgIGN1cnNvcnMgPSBzLmN1cnNvcnMgPyBbWzAsMF1dXG4gICAgICAgICAgICBjdXJzb3JzID0gY3Vyc29ycy5tYXAgKGMpID0+IFtjWzBdLCBjbGFtcCgwLEBudW1MaW5lcygpLTEsY1sxXSldXG5cbiAgICAgICAgICAgIEBzZXRDdXJzb3JzICAgIGN1cnNvcnNcbiAgICAgICAgICAgIEBzZXRTZWxlY3Rpb25zIHMuc2VsZWN0aW9ucyA/IFtdXG4gICAgICAgICAgICBAc2V0SGlnaGxpZ2h0cyBzLmhpZ2hsaWdodHMgPyBbXVxuICAgICAgICAgICAgQHNldE1haW4gICAgICAgcy5tYWluID8gMFxuICAgICAgICAgICAgQHNldFN0YXRlIEBzdGF0ZVxuXG4gICAgICAgICAgICBAc2Nyb2xsLnRvIHMuc2Nyb2xsIGlmIHMuc2Nyb2xsXG4gICAgICAgICAgICBAc2Nyb2xsLmN1cnNvckludG9WaWV3KClcblxuICAgICAgICBlbHNlXG5cbiAgICAgICAgICAgIEBzaW5nbGVDdXJzb3JBdFBvcyBbMCwwXVxuICAgICAgICAgICAgQHNjcm9sbC50b3AgPSAwIGlmIEBtYWluQ3Vyc29yKClbMV0gPT0gMFxuICAgICAgICAgICAgQHNjcm9sbC5ib3QgPSBAc2Nyb2xsLnRvcC0xXG4gICAgICAgICAgICBAc2Nyb2xsLnRvIDBcbiAgICAgICAgICAgIEBzY3JvbGwuY3Vyc29ySW50b1ZpZXcoKVxuXG4gICAgICAgIEB1cGRhdGVMYXllcnMoKVxuICAgICAgICBAbnVtYmVycz8udXBkYXRlQ29sb3JzKClcbiAgICAgICAgQG1pbmltYXAub25FZGl0b3JTY3JvbGwoKVxuICAgICAgICBAZW1pdCAnY3Vyc29yJ1xuICAgICAgICBAZW1pdCAnc2VsZWN0aW9uJ1xuXG4gICAgIyAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAwMDAwMFxuICAgICMgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDBcblxuICAgIGp1bXBUb0ZpbGU6IChvcHQpID0+XG5cbiAgICAgICAgd2luZG93LnRhYnMuYWN0aXZlVGFiIHRydWVcblxuICAgICAgICBpZiBvcHQubmV3VGFiXG5cbiAgICAgICAgICAgIGZpbGUgPSBvcHQuZmlsZVxuICAgICAgICAgICAgZmlsZSArPSAnOicgKyBvcHQubGluZSBpZiBvcHQubGluZVxuICAgICAgICAgICAgZmlsZSArPSAnOicgKyBvcHQuY29sIGlmIG9wdC5jb2xcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnbmV3VGFiV2l0aEZpbGUnIGZpbGVcblxuICAgICAgICBlbHNlXG5cbiAgICAgICAgICAgIFtmaWxlLCBmcG9zXSA9IHNsYXNoLnNwbGl0RmlsZVBvcyBvcHQuZmlsZVxuICAgICAgICAgICAgb3B0LnBvcyA9IGZwb3NcbiAgICAgICAgICAgIG9wdC5wb3NbMF0gPSBvcHQuY29sIGlmIG9wdC5jb2xcbiAgICAgICAgICAgIG9wdC5wb3NbMV0gPSBvcHQubGluZS0xIGlmIG9wdC5saW5lXG4gICAgICAgICAgICBvcHQud2luSUQgID0gd2luZG93LndpbklEXG5cbiAgICAgICAgICAgIG9wdC5vbGRQb3MgPSBAY3Vyc29yUG9zKClcbiAgICAgICAgICAgIG9wdC5vbGRGaWxlID0gQGN1cnJlbnRGaWxlXG4gICAgICAgICAgICB3aW5kb3cubmF2aWdhdGUuZ290b0ZpbGVQb3Mgb3B0XG5cbiAgICBqdW1wVG86ICh3b3JkLCBvcHQpID0+XG5cbiAgICAgICAgaWYgXy5pc09iamVjdCh3b3JkKSBhbmQgbm90IG9wdD9cbiAgICAgICAgICAgIG9wdCAgPSB3b3JkXG4gICAgICAgICAgICB3b3JkID0gb3B0LndvcmRcblxuICAgICAgICBvcHQgPz0ge31cblxuICAgICAgICBpZiBvcHQuZmlsZT9cbiAgICAgICAgICAgIEBqdW1wVG9GaWxlIG9wdFxuICAgICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgICByZXR1cm4ga2Vycm9yICdub3RoaW5nIHRvIGp1bXAgdG8/JyBpZiBlbXB0eSB3b3JkXG5cbiAgICAgICAgZmluZCA9IHdvcmQudG9Mb3dlckNhc2UoKS50cmltKClcbiAgICAgICAgZmluZCA9IGZpbmQuc2xpY2UgMSBpZiBmaW5kWzBdID09ICdAJ1xuXG4gICAgICAgIHJldHVybiBrZXJyb3IgJ0ZpbGVFZGl0b3IuanVtcFRvIC0tIG5vdGhpbmcgdG8gZmluZD8nIGlmIGVtcHR5IGZpbmRcblxuICAgICAgICB0eXBlID0gb3B0Py50eXBlXG5cbiAgICAgICAgaWYgbm90IHR5cGUgb3IgdHlwZSA9PSAnY2xhc3MnXG4gICAgICAgICAgICBjbGFzc2VzID0gcG9zdC5nZXQgJ2luZGV4ZXInICdjbGFzc2VzJ1xuICAgICAgICAgICAgZm9yIGNsc3MsIGluZm8gb2YgY2xhc3Nlc1xuICAgICAgICAgICAgICAgIGlmIGNsc3MudG9Mb3dlckNhc2UoKSA9PSBmaW5kXG4gICAgICAgICAgICAgICAgICAgIEBqdW1wVG9GaWxlIGluZm9cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgICBpZiBub3QgdHlwZSBvciB0eXBlID09ICdmdW5jJ1xuICAgICAgICAgICAgZnVuY3MgPSBwb3N0LmdldCAnaW5kZXhlcicgJ2Z1bmNzJ1xuICAgICAgICAgICAgZm9yIGZ1bmMsIGluZm9zIG9mIGZ1bmNzXG4gICAgICAgICAgICAgICAgaWYgZnVuYy50b0xvd2VyQ2FzZSgpID09IGZpbmRcbiAgICAgICAgICAgICAgICAgICAgaW5mbyA9IGluZm9zWzBdXG4gICAgICAgICAgICAgICAgICAgIGZvciBpIGluIGluZm9zXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBpLmZpbGUgPT0gQGN1cnJlbnRGaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mbyA9IGlcbiAgICAgICAgICAgICAgICAgICAgQGp1bXBUb0ZpbGUgaW5mb1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgICAgIGlmIG5vdCB0eXBlIG9yIHR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICAgICBmaWxlcyA9IHBvc3QuZ2V0ICdpbmRleGVyJyAnZmlsZXMnXG4gICAgICAgICAgICBmb3IgZmlsZSwgaW5mbyBvZiBmaWxlc1xuICAgICAgICAgICAgICAgIGlmIHNsYXNoLmJhc2UoZmlsZSkudG9Mb3dlckNhc2UoKSA9PSBmaW5kIGFuZCBmaWxlICE9IEBjdXJyZW50RmlsZVxuICAgICAgICAgICAgICAgICAgICBAanVtcFRvRmlsZSBmaWxlOmZpbGUsIGxpbmU6NlxuXG4gICAgICAgIHdpbmRvdy5jb21tYW5kbGluZS5jb21tYW5kcy5zZWFyY2guc3RhcnQgJ3NlYXJjaCdcbiAgICAgICAgd2luZG93LmNvbW1hbmRsaW5lLmNvbW1hbmRzLnNlYXJjaC5leGVjdXRlIHdvcmRcblxuICAgICAgICB3aW5kb3cuc3BsaXQuZG8gJ3Nob3cgdGVybWluYWwnXG5cbiAgICAgICAgdHJ1ZVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAganVtcFRvQ291bnRlcnBhcnQ6ICgpIC0+XG5cbiAgICAgICAgY3AgPSBAY3Vyc29yUG9zKClcbiAgICAgICAgY3VycmV4dCA9IHNsYXNoLmV4dCBAY3VycmVudEZpbGVcblxuICAgICAgICBzd2l0Y2ggY3VycmV4dFxuICAgICAgICAgICAgd2hlbiAnY29mZmVlJyAna29mZmVlJ1xuICAgICAgICAgICAgICAgIFtmaWxlLGxpbmUsY29sXSA9IHNyY21hcC50b0pzIEBjdXJyZW50RmlsZSwgY3BbMV0rMSwgY3BbMF1cbiAgICAgICAgICAgICAgICBpZiBmaWxlP1xuICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJyBzbGFzaC5qb2luRmlsZUxpbmUgZmlsZSxsaW5lLGNvbFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgd2hlbiAnanMnXG4gICAgICAgICAgICAgICAgW2ZpbGUsbGluZSxjb2xdID0gc3JjbWFwLnRvQ29mZmVlIEBjdXJyZW50RmlsZSwgY3BbMV0rMSwgY3BbMF1cbiAgICAgICAgICAgICAgICBpZiBmaWxlP1xuICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJyBzbGFzaC5qb2luRmlsZUxpbmUgZmlsZSxsaW5lLGNvbFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgICAgIGNvdW50ZXJwYXJ0cyA9XG4gICAgICAgICAgICBjcHA6ICAgICBbJ2hwcCcgJ2gnXVxuICAgICAgICAgICAgY2M6ICAgICAgWydocHAnICdoJ11cbiAgICAgICAgICAgIGg6ICAgICAgIFsnY3BwJyAnYyddXG4gICAgICAgICAgICBocHA6ICAgICBbJ2NwcCcgJ2MnXVxuICAgICAgICAgICAgY29mZmVlOiAgWydqcyddXG4gICAgICAgICAgICBrb2ZmZWU6ICBbJ2pzJ11cbiAgICAgICAgICAgIGpzOiAgICAgIFsnY29mZmVlJydrb2ZmZWUnXVxuICAgICAgICAgICAgcHVnOiAgICAgWydodG1sJ11cbiAgICAgICAgICAgIGh0bWw6ICAgIFsncHVnJ11cbiAgICAgICAgICAgIGNzczogICAgIFsnc3R5bCddXG4gICAgICAgICAgICBzdHlsOiAgICBbJ2NzcyddXG5cbiAgICAgICAgZm9yIGV4dCBpbiAoY291bnRlcnBhcnRzW2N1cnJleHRdID8gW10pXG4gICAgICAgICAgICBpZiBzbGFzaC5maWxlRXhpc3RzIHNsYXNoLnN3YXBFeHQgQGN1cnJlbnRGaWxlLCBleHRcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJyBzbGFzaC5zd2FwRXh0IEBjdXJyZW50RmlsZSwgZXh0XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgICBmb3IgZXh0IGluIChjb3VudGVycGFydHNbY3VycmV4dF0gPyBbXSlcbiAgICAgICAgICAgIGNvdW50ZXIgPSBzd2FwRXh0IEBjdXJyZW50RmlsZSwgZXh0XG4gICAgICAgICAgICBjb3VudGVyID0gY291bnRlci5yZXBsYWNlIFwiLyN7Y3VycmV4dH0vXCIgXCIvI3tleHR9L1wiXG4gICAgICAgICAgICBpZiBzbGFzaC5maWxlRXhpc3RzIGNvdW50ZXJcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJyBjb3VudGVyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZmFsc2VcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY2VudGVyVGV4dDogKGNlbnRlciwgYW5pbWF0ZT0zMDApIC0+XG5cbiAgICAgICAgQHNpemUuY2VudGVyVGV4dCA9IGNlbnRlclxuICAgICAgICBAdXBkYXRlTGF5ZXJzKClcblxuICAgICAgICBAc2l6ZS5vZmZzZXRYID0gTWF0aC5mbG9vciBAc2l6ZS5jaGFyV2lkdGgvMiArIEBzaXplLm51bWJlcnNXaWR0aFxuICAgICAgICBpZiBjZW50ZXJcbiAgICAgICAgICAgIGJyICAgICAgICA9IEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICB2aXNDb2xzICAgPSBwYXJzZUludCBici53aWR0aCAvIEBzaXplLmNoYXJXaWR0aFxuICAgICAgICAgICAgbmV3T2Zmc2V0ID0gcGFyc2VJbnQgQHNpemUuY2hhcldpZHRoICogKHZpc0NvbHMgLSAxMDApIC8gMlxuICAgICAgICAgICAgQHNpemUub2Zmc2V0WCA9IE1hdGgubWF4IEBzaXplLm9mZnNldFgsIG5ld09mZnNldFxuICAgICAgICAgICAgQHNpemUuY2VudGVyVGV4dCA9IHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHNpemUuY2VudGVyVGV4dCA9IGZhbHNlXG5cbiAgICAgICAgQHVwZGF0ZUxpbmVQb3NpdGlvbnMgYW5pbWF0ZVxuXG4gICAgICAgIGlmIGFuaW1hdGVcbiAgICAgICAgICAgIGxheWVycyA9IFsnLnNlbGVjdGlvbnMnICcuaGlnaGxpZ2h0cycgJy5jdXJzb3JzJ11cbiAgICAgICAgICAgIHRyYW5zaSA9IFsnLnNlbGVjdGlvbicgICcuaGlnaGxpZ2h0JyAgJy5jdXJzb3InIF0uY29uY2F0IGxheWVyc1xuICAgICAgICAgICAgcmVzZXRUcmFucyA9ID0+XG4gICAgICAgICAgICAgICAgc2V0U3R5bGUgJy5lZGl0b3IgLmxheWVycyAnK2wsICd0cmFuc2Zvcm0nIFwidHJhbnNsYXRlWCgwKVwiIGZvciBsIGluIGxheWVyc1xuICAgICAgICAgICAgICAgIHNldFN0eWxlICcuZWRpdG9yIC5sYXllcnMgJyt0LCAndHJhbnNpdGlvbicgXCJpbml0aWFsXCIgZm9yIHQgaW4gdHJhbnNpXG4gICAgICAgICAgICAgICAgQHVwZGF0ZUxheWVycygpXG5cbiAgICAgICAgICAgIGlmIGNlbnRlclxuICAgICAgICAgICAgICAgIG9mZnNldFggPSBAc2l6ZS5vZmZzZXRYIC0gQHNpemUubnVtYmVyc1dpZHRoIC0gQHNpemUuY2hhcldpZHRoLzJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBvZmZzZXRYID0gTWF0aC5mbG9vciBAc2l6ZS5jaGFyV2lkdGgvMiArIEBzaXplLm51bWJlcnNXaWR0aFxuICAgICAgICAgICAgICAgIG9mZnNldFggPSBNYXRoLm1heCBvZmZzZXRYLCAoQHNjcmVlblNpemUoKS53aWR0aCAtIEBzY3JlZW5TaXplKCkuaGVpZ2h0KSAvIDJcbiAgICAgICAgICAgICAgICBvZmZzZXRYIC09IEBzaXplLm51bWJlcnNXaWR0aCArIEBzaXplLmNoYXJXaWR0aC8yXG4gICAgICAgICAgICAgICAgb2Zmc2V0WCAqPSAtMVxuXG4gICAgICAgICAgICBzZXRTdHlsZSAnLmVkaXRvciAubGF5ZXJzICcrbCwgJ3RyYW5zZm9ybScgXCJ0cmFuc2xhdGVYKCN7b2Zmc2V0WH1weClcIiBmb3IgbCBpbiBsYXllcnNcbiAgICAgICAgICAgIHNldFN0eWxlICcuZWRpdG9yIC5sYXllcnMgJyt0LCAndHJhbnNpdGlvbicgXCJhbGwgI3thbmltYXRlLzEwMDB9c1wiIGZvciB0IGluIHRyYW5zaVxuICAgICAgICAgICAgc2V0VGltZW91dCByZXNldFRyYW5zLCBhbmltYXRlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB1cGRhdGVMYXllcnMoKVxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwXG5cbiAgICBvbkNvbnRleHRNZW51OiAoZXZlbnQpID0+IHN0b3BFdmVudCBldmVudCwgQHNob3dDb250ZXh0TWVudSBrcG9zIGV2ZW50XG5cbiAgICBzaG93Q29udGV4dE1lbnU6IChhYnNQb3MpID0+XG5cbiAgICAgICAgaWYgbm90IGFic1Bvcz9cbiAgICAgICAgICAgIGFic1BvcyA9IGtwb3MgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCwgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG5cbiAgICAgICAgb3B0ID0gaXRlbXM6IFtcbiAgICAgICAgICAgIHRleHQ6ICAgJ0Jyb3dzZSdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2NvbW1hbmQrLidcbiAgICAgICAgICAgIGFjY2VsOiAgJ2N0cmwrLidcbiAgICAgICAgICAgIGNiOiAgICAgLT4gd2luZG93LmNvbW1hbmRsaW5lLnN0YXJ0Q29tbWFuZCAnYnJvd3NlJ1xuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdCYWNrJ1xuICAgICAgICAgICAgY29tYm86ICAnY29tbWFuZCsxJ1xuICAgICAgICAgICAgY2I6ICAgICAtPiBwb3N0LmVtaXQgJ21lbnVBY3Rpb24nICdOYXZpZ2F0ZSBCYWNrd2FyZCcgIyBmaXggbWUhIGluIHNhbWUgZmlsZSBuYXZpZ2F0aW9uIVxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICcnXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ01heGltaXplJ1xuICAgICAgICAgICAgY29tYm86ICAnY29tbWFuZCtzaGlmdCt5J1xuICAgICAgICAgICAgYWNjZWw6ICAnY3RybCtzaGlmdCt5J1xuICAgICAgICAgICAgY2I6ICAgICAtPiB3aW5kb3cuc3BsaXQubWF4aW1pemVFZGl0b3IoKVxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICcnXG4gICAgICAgIF1cblxuICAgICAgICBvcHQuaXRlbXMgPSBvcHQuaXRlbXMuY29uY2F0IHdpbmRvdy50aXRsZWJhci5tZW51VGVtcGxhdGUoKVxuXG4gICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgb3B0LnkgPSBhYnNQb3MueVxuICAgICAgICBwb3B1cC5tZW51IG9wdFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGNsaWNrQXRQb3M6IChwLCBldmVudCkgLT5cblxuICAgICAgICBpZiBldmVudC5tZXRhS2V5XG4gICAgICAgICAgICBpZiBrcG9zKGV2ZW50KS54IDw9IEBzaXplLm51bWJlcnNXaWR0aFxuICAgICAgICAgICAgICAgIEBzaW5nbGVDdXJzb3JBdFBvcyBwXG4gICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgc3VwZXIgcCwgZXZlbnRcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDBcblxuICAgIGhhbmRsZU1vZEtleUNvbWJvQ2hhckV2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudCkgLT5cblxuICAgICAgICByZXR1cm4gaWYgJ3VuaGFuZGxlZCcgIT0gc3VwZXIgbW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2FsdCtjdHJsK2VudGVyJyAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuY29tbWFuZGxpbmUuY29tbWFuZHMuY29mZmVlLmV4ZWN1dGVUZXh0IEB0ZXh0T2ZTZWxlY3Rpb25Gb3JDbGlwYm9hcmQoKVxuICAgICAgICAgICAgd2hlbiAnYWx0K2N0cmwrc2hpZnQrZW50ZXInIHRoZW4gcmV0dXJuIHdpbmRvdy5jb21tYW5kbGluZS5jb21tYW5kcy5jb2ZmZWUuZXhlY3V0ZVRleHRJbk1haW4gQHRleHRPZlNlbGVjdGlvbkZvckNsaXBib2FyZHQoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCthbHQrdXAnICdhbHQrbycgdGhlbiByZXR1cm4gQGp1bXBUb0NvdW50ZXJwYXJ0KClcbiAgICAgICAgICAgIHdoZW4gJ2VzYydcbiAgICAgICAgICAgICAgICBzcGxpdCA9IHdpbmRvdy5zcGxpdFxuICAgICAgICAgICAgICAgIGlmIHNwbGl0LnRlcm1pbmFsVmlzaWJsZSgpXG4gICAgICAgICAgICAgICAgICAgIHNwbGl0LmhpZGVUZXJtaW5hbCgpXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBzcGxpdC5jb21tYW5kbGluZVZpc2libGUoKVxuICAgICAgICAgICAgICAgICAgICBzcGxpdC5oaWRlQ29tbWFuZGxpbmUoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAndW5oYW5kbGVkJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVFZGl0b3JcbiJdfQ==
//# sourceURL=../../coffee/editor/fileeditor.coffee