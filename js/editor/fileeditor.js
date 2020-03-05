// koffee 1.11.0

/*
00000000  000  000      00000000        00000000  0000000    000  000000000   0000000   00000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000000    000  000      0000000         0000000   000   000  000     000     000   000  0000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000       000  0000000  00000000        00000000  0000000    000     000      0000000   000   000
 */
var FileEditor, Syntax, TextEditor, _, clamp, electron, empty, kerror, kpos, popup, post, ref, setStyle, slash, srcmap, stopEvent, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf;

ref = require('kxk'), _ = ref._, clamp = ref.clamp, empty = ref.empty, kerror = ref.kerror, kpos = ref.kpos, popup = ref.popup, post = ref.post, setStyle = ref.setStyle, slash = ref.slash, srcmap = ref.srcmap, stopEvent = ref.stopEvent, valid = ref.valid;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvZWRpdG9yIiwic291cmNlcyI6WyJmaWxlZWRpdG9yLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxvSUFBQTtJQUFBOzs7OztBQVFBLE1BQTRGLE9BQUEsQ0FBUSxLQUFSLENBQTVGLEVBQUUsU0FBRixFQUFLLGlCQUFMLEVBQVksaUJBQVosRUFBbUIsbUJBQW5CLEVBQTJCLGVBQTNCLEVBQWlDLGlCQUFqQyxFQUF3QyxlQUF4QyxFQUE4Qyx1QkFBOUMsRUFBd0QsaUJBQXhELEVBQStELG1CQUEvRCxFQUF1RSx5QkFBdkUsRUFBa0Y7O0FBRWxGLFVBQUEsR0FBYSxPQUFBLENBQVEsY0FBUjs7QUFDYixNQUFBLEdBQWEsT0FBQSxDQUFRLFVBQVI7O0FBQ2IsUUFBQSxHQUFhLE9BQUEsQ0FBUSxVQUFSOztBQUVQOzs7SUFFQyxvQkFBQyxRQUFEOzs7Ozs7UUFFQyw0Q0FBTSxRQUFOLEVBQ0k7WUFBQSxRQUFBLEVBQVUsQ0FDTixTQURNLEVBRU4sV0FGTSxFQUdOLFNBSE0sRUFJTixTQUpNLEVBS04sTUFMTSxFQU1OLGNBTk0sRUFPTixVQVBNLEVBUU4sU0FSTSxFQVNOLFlBVE0sQ0FBVjtZQVdBLFFBQUEsRUFBVSxFQVhWO1NBREo7UUFjQSxJQUFDLENBQUEsV0FBRCxHQUFlO1FBRWYsSUFBQyxDQUFBLElBQUksQ0FBQyxnQkFBTixDQUF1QixhQUF2QixFQUFzQyxJQUFDLENBQUEsYUFBdkM7UUFFQSxJQUFJLENBQUMsRUFBTCxDQUFRLGFBQVIsRUFBd0IsSUFBQyxDQUFBLGFBQXpCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxRQUFSLEVBQXdCLElBQUMsQ0FBQSxNQUF6QjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsWUFBUixFQUF3QixJQUFDLENBQUEsVUFBekI7UUFFQSxJQUFDLENBQUEsWUFBRCxDQUFBO1FBQ0EsSUFBQyxDQUFB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QUFDLE1BQU0sQ0FBQyxXQUFuQyxDQUErQyxJQUFDLENBQUEsMkJBQUQsQ0FBQSxDQUEvQztBQUQ1QyxpQkFFUyxzQkFGVDtBQUVxQyx1QkFBTyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsaUJBQW5DLENBQXFELElBQUMsQ0FBQSw0QkFBRCxDQUFBLENBQXJEO0FBRjVDLGlCQUdTLGdCQUhUO0FBQUEsaUJBRzBCLE9BSDFCO0FBR3VDLHVCQUFPLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0FBSDlDLGlCQUlTLEtBSlQ7Z0JBS1EsS0FBQSxHQUFRLE1BQU0sQ0FBQztnQkFDZixJQUFHLEtBQUssQ0FBQyxlQUFOLENBQUEsQ0FBSDtvQkFDSSxLQUFLLENBQUMsWUFBTixDQUFBLEVBREo7aUJBQUEsTUFFSyxJQUFHLEtBQUssQ0FBQyxrQkFBTixDQUFBLENBQUg7b0JBQ0QsS0FBSyxDQUFDLGVBQU4sQ0FBQSxFQURDOztBQUVMO0FBVlI7ZUFXQTtJQWR3Qjs7OztHQWxiUDs7QUFrY3pCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4jIyNcblxueyBfLCBjbGFtcCwgZW1wdHksIGtlcnJvciwga3BvcywgcG9wdXAsIHBvc3QsIHNldFN0eWxlLCBzbGFzaCwgc3JjbWFwLCBzdG9wRXZlbnQsIHZhbGlkIH0gPSByZXF1aXJlICdreGsnXG5cblRleHRFZGl0b3IgPSByZXF1aXJlICcuL3RleHRlZGl0b3InXG5TeW50YXggICAgID0gcmVxdWlyZSAnLi9zeW50YXgnXG5lbGVjdHJvbiAgID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5cbmNsYXNzIEZpbGVFZGl0b3IgZXh0ZW5kcyBUZXh0RWRpdG9yXG5cbiAgICBAOiAodmlld0VsZW0pIC0+XG5cbiAgICAgICAgc3VwZXIgdmlld0VsZW0sXG4gICAgICAgICAgICBmZWF0dXJlczogW1xuICAgICAgICAgICAgICAgICdEaWZmYmFyJ1xuICAgICAgICAgICAgICAgICdTY3JvbGxiYXInXG4gICAgICAgICAgICAgICAgJ051bWJlcnMnXG4gICAgICAgICAgICAgICAgJ01pbmltYXAnXG4gICAgICAgICAgICAgICAgJ01ldGEnXG4gICAgICAgICAgICAgICAgJ0F1dG9jb21wbGV0ZSdcbiAgICAgICAgICAgICAgICAnQnJhY2tldHMnXG4gICAgICAgICAgICAgICAgJ1N0cmluZ3MnXG4gICAgICAgICAgICAgICAgJ0N1cnNvckxpbmUnXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZm9udFNpemU6IDE5XG5cbiAgICAgICAgQGN1cnJlbnRGaWxlID0gbnVsbFxuXG4gICAgICAgIEB2aWV3LmFkZEV2ZW50TGlzdGVuZXIgXCJjb250ZXh0bWVudVwiLCBAb25Db250ZXh0TWVudVxuXG4gICAgICAgIHBvc3Qub24gJ2NvbW1hbmRsaW5lJyAgIEBvbkNvbW1hbmRsaW5lXG4gICAgICAgIHBvc3Qub24gJ2p1bXBUbycgICAgICAgIEBqdW1wVG9cbiAgICAgICAgcG9zdC5vbiAnanVtcFRvRmlsZScgICAgQGp1bXBUb0ZpbGVcblxuICAgICAgICBAaW5pdFBpZ21lbnRzKClcbiAgICAgICAgQGluaXRJbnZpc2libGVzKClcblxuICAgICAgICBAc2V0VGV4dCAnJ1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGNoYW5nZWQ6IChjaGFuZ2VJbmZvKSAtPlxuXG4gICAgICAgIHN1cGVyIGNoYW5nZUluZm9cbiAgICAgICAgZGlydHkgPSBAZG8uaGFzTGluZUNoYW5nZXMoKVxuICAgICAgICBpZiBAZGlydHkgIT0gZGlydHlcbiAgICAgICAgICAgIEBkaXJ0eSA9IGRpcnR5XG4gICAgICAgICAgICBwb3N0LmVtaXQgJ2RpcnR5JyBAZGlydHlcblxuICAgICMgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG4gICAgY2xlYXI6IC0+XG5cbiAgICAgICAgQGRpcnR5ID0gZmFsc2VcbiAgICAgICAgQHNldFNhbHRlck1vZGUgZmFsc2VcbiAgICAgICAgQGRpZmZiYXI/LmNsZWFyKClcbiAgICAgICAgQG1ldGE/LmNsZWFyKClcbiAgICAgICAgQHNldExpbmVzIFsnJ11cbiAgICAgICAgQGRvLnJlc2V0KClcblxuICAgIHNldEN1cnJlbnRGaWxlOiAoZmlsZSwgcmVzdG9yZVN0YXRlKSAtPlxuXG4gICAgICAgICMga2xvZyAnc2V0Q3VycmVudEZpbGUnIGZpbGVcbiAgICAgICAgXG4gICAgICAgIEBjbGVhcigpXG4gICAgICAgIFxuICAgICAgICBAY3VycmVudEZpbGUgPSBmaWxlXG5cbiAgICAgICAgQHNldHVwRmlsZVR5cGUoKVxuXG4gICAgICAgIGZpbGVFeGlzdHMgPSBAY3VycmVudEZpbGU/IGFuZCBzbGFzaC5maWxlRXhpc3RzIEBjdXJyZW50RmlsZVxuXG4gICAgICAgIGlmIHJlc3RvcmVTdGF0ZVxuICAgICAgICAgICAgQHNldFRleHQgcmVzdG9yZVN0YXRlLnRleHQoKVxuICAgICAgICAgICAgQHN0YXRlID0gcmVzdG9yZVN0YXRlXG4gICAgICAgICAgICBAZGlydHkgPSB0cnVlXG4gICAgICAgIGVsc2UgaWYgZmlsZUV4aXN0c1xuICAgICAgICAgICAgQHNldFRleHQgc2xhc2gucmVhZFRleHQgQGN1cnJlbnRGaWxlXG5cbiAgICAgICAgaWYgZmlsZUV4aXN0c1xuICAgICAgICAgICAgd2luZG93LnRhYnMuYWN0aXZlVGFiKCk/LnNldEZpbGUgQGN1cnJlbnRGaWxlXG4gICAgICAgICAgICBcbiAgICAgICAgcG9zdC5lbWl0ICdmaWxlJyBAY3VycmVudEZpbGUgIyBicm93c2VyICYgc2hlbGZcblxuICAgICAgICBAZW1pdCAnZmlsZScgQGN1cnJlbnRGaWxlICMgZGlmZmJhciwgcGlnbWVudHMsIC4uLlxuXG4gICAgICAgIHBvc3QuZW1pdCAnZGlydHknIEBkaXJ0eVxuXG4gICAgY3VycmVudERpcjogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBjdXJyZW50RmlsZT8gYW5kIHNsYXNoLmZpbGVFeGlzdHMgQGN1cnJlbnRGaWxlXG4gICAgICAgICAgICBzbGFzaC5kaXIgQGN1cnJlbnRGaWxlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNsYXNoLnBhdGggcHJvY2Vzcy5jd2QoKVxuICAgICAgICBcbiAgICByZXN0b3JlRnJvbVRhYlN0YXRlOiAodGFiU3RhdGUpIC0+XG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciBcIm5vIHRhYlN0YXRlLmZpbGU/XCIgaWYgbm90IHRhYlN0YXRlLmZpbGU/XG4gICAgICAgIEBzZXRDdXJyZW50RmlsZSB0YWJTdGF0ZS5maWxlLCB0YWJTdGF0ZS5zdGF0ZVxuXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAgICAwMDAgICAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMDAwMDAwXG5cbiAgICBzaGViYW5nRmlsZVR5cGU6IC0+XG5cbiAgICAgICAgZmlsZVR5cGUgPSBTeW50YXguc2hlYmFuZyBAbGluZSgwKSBpZiBAbnVtTGluZXMoKVxuICAgICAgICBpZiBmaWxlVHlwZSA9PSAndHh0J1xuICAgICAgICAgICAgaWYgQGN1cnJlbnRGaWxlP1xuICAgICAgICAgICAgICAgIGV4dCA9IHNsYXNoLmV4dCBAY3VycmVudEZpbGVcbiAgICAgICAgICAgICAgICBpZiBleHQgaW4gU3ludGF4LnN5bnRheE5hbWVzXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBleHRcbiAgICAgICAgZWxzZSBpZiBmaWxlVHlwZVxuICAgICAgICAgICAgcmV0dXJuIGZpbGVUeXBlXG5cbiAgICAgICAgc3VwZXIoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMFxuXG4gICAgb25Db21tYW5kbGluZTogKGUpID0+XG5cbiAgICAgICAgc3dpdGNoIGVcbiAgICAgICAgICAgIHdoZW4gJ2hpZGRlbicgJ3Nob3duJ1xuICAgICAgICAgICAgICAgIGQgPSB3aW5kb3cuc3BsaXQuY29tbWFuZGxpbmVIZWlnaHQgKyB3aW5kb3cuc3BsaXQuaGFuZGxlSGVpZ2h0XG4gICAgICAgICAgICAgICAgZCA9IE1hdGgubWluIGQsIEBzY3JvbGwuc2Nyb2xsTWF4IC0gQHNjcm9sbC5zY3JvbGxcbiAgICAgICAgICAgICAgICBkICo9IC0xIGlmIGUgPT0gJ2hpZGRlbidcbiAgICAgICAgICAgICAgICBAc2Nyb2xsLmJ5IGRcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwMDAwMDBcblxuICAgIHNhdmVTY3JvbGxDdXJzb3JzQW5kU2VsZWN0aW9uczogKG9wdCkgLT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IEBjdXJyZW50RmlsZVxuICAgICAgICBzID0ge31cblxuICAgICAgICBzLm1haW4gICAgICAgPSBAc3RhdGUubWFpbigpXG4gICAgICAgIHMuY3Vyc29ycyAgICA9IEBzdGF0ZS5jdXJzb3JzKCkgICAgaWYgQG51bUN1cnNvcnMoKSA+IDEgb3IgQGN1cnNvclBvcygpWzBdIG9yIEBjdXJzb3JQb3MoKVsxXVxuICAgICAgICBzLnNlbGVjdGlvbnMgPSBAc3RhdGUuc2VsZWN0aW9ucygpIGlmIEBudW1TZWxlY3Rpb25zKClcbiAgICAgICAgcy5oaWdobGlnaHRzID0gQHN0YXRlLmhpZ2hsaWdodHMoKSBpZiBAbnVtSGlnaGxpZ2h0cygpXG5cbiAgICAgICAgcy5zY3JvbGwgPSBAc2Nyb2xsLnNjcm9sbCBpZiBAc2Nyb2xsLnNjcm9sbFxuXG4gICAgICAgIGZpbGVQb3NpdGlvbnMgPSB3aW5kb3cuc3Rhc2guZ2V0ICdmaWxlUG9zaXRpb25zJyBPYmplY3QuY3JlYXRlIG51bGxcbiAgICAgICAgaWYgbm90IF8uaXNQbGFpbk9iamVjdCBmaWxlUG9zaXRpb25zXG4gICAgICAgICAgICBmaWxlUG9zaXRpb25zID0gT2JqZWN0LmNyZWF0ZSBudWxsXG4gICAgICAgIGZpbGVQb3NpdGlvbnNbQGN1cnJlbnRGaWxlXSA9IHNcbiAgICAgICAgd2luZG93LnN0YXNoLnNldCAnZmlsZVBvc2l0aW9ucycgZmlsZVBvc2l0aW9uc1xuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcblxuICAgIHJlc3RvcmVTY3JvbGxDdXJzb3JzQW5kU2VsZWN0aW9uczogLT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IEBjdXJyZW50RmlsZVxuICAgICAgICBcbiAgICAgICAgZmlsZVBvc2l0aW9ucyA9IHdpbmRvdy5zdGFzaC5nZXQgJ2ZpbGVQb3NpdGlvbnMnIHt9XG5cbiAgICAgICAgaWYgZmlsZVBvc2l0aW9uc1tAY3VycmVudEZpbGVdP1xuXG4gICAgICAgICAgICBzID0gZmlsZVBvc2l0aW9uc1tAY3VycmVudEZpbGVdXG5cbiAgICAgICAgICAgIGN1cnNvcnMgPSBzLmN1cnNvcnMgPyBbWzAsMF1dXG4gICAgICAgICAgICBjdXJzb3JzID0gY3Vyc29ycy5tYXAgKGMpID0+IFtjWzBdLCBjbGFtcCgwLEBudW1MaW5lcygpLTEsY1sxXSldXG5cbiAgICAgICAgICAgIEBzZXRDdXJzb3JzICAgIGN1cnNvcnNcbiAgICAgICAgICAgIEBzZXRTZWxlY3Rpb25zIHMuc2VsZWN0aW9ucyA/IFtdXG4gICAgICAgICAgICBAc2V0SGlnaGxpZ2h0cyBzLmhpZ2hsaWdodHMgPyBbXVxuICAgICAgICAgICAgQHNldE1haW4gICAgICAgcy5tYWluID8gMFxuICAgICAgICAgICAgQHNldFN0YXRlIEBzdGF0ZVxuXG4gICAgICAgICAgICBAc2Nyb2xsLnRvIHMuc2Nyb2xsIGlmIHMuc2Nyb2xsXG4gICAgICAgICAgICBAc2Nyb2xsLmN1cnNvckludG9WaWV3KClcblxuICAgICAgICBlbHNlXG5cbiAgICAgICAgICAgIEBzaW5nbGVDdXJzb3JBdFBvcyBbMCwwXVxuICAgICAgICAgICAgQHNjcm9sbC50b3AgPSAwIGlmIEBtYWluQ3Vyc29yKClbMV0gPT0gMFxuICAgICAgICAgICAgQHNjcm9sbC5ib3QgPSBAc2Nyb2xsLnRvcC0xXG4gICAgICAgICAgICBAc2Nyb2xsLnRvIDBcbiAgICAgICAgICAgIEBzY3JvbGwuY3Vyc29ySW50b1ZpZXcoKVxuXG4gICAgICAgIEB1cGRhdGVMYXllcnMoKVxuICAgICAgICBAbnVtYmVycz8udXBkYXRlQ29sb3JzKClcbiAgICAgICAgQG1pbmltYXAub25FZGl0b3JTY3JvbGwoKVxuICAgICAgICBAZW1pdCAnY3Vyc29yJ1xuICAgICAgICBAZW1pdCAnc2VsZWN0aW9uJ1xuXG4gICAgIyAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAwMDAwMFxuICAgICMgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDBcblxuICAgIGp1bXBUb0ZpbGU6IChvcHQpID0+XG5cbiAgICAgICAgd2luZG93LnRhYnMuYWN0aXZlVGFiIHRydWVcblxuICAgICAgICBpZiBvcHQubmV3VGFiXG5cbiAgICAgICAgICAgIGZpbGUgPSBvcHQuZmlsZVxuICAgICAgICAgICAgZmlsZSArPSAnOicgKyBvcHQubGluZSBpZiBvcHQubGluZVxuICAgICAgICAgICAgZmlsZSArPSAnOicgKyBvcHQuY29sIGlmIG9wdC5jb2xcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnbmV3VGFiV2l0aEZpbGUnIGZpbGVcblxuICAgICAgICBlbHNlXG5cbiAgICAgICAgICAgIFtmaWxlLCBmcG9zXSA9IHNsYXNoLnNwbGl0RmlsZVBvcyBvcHQuZmlsZVxuICAgICAgICAgICAgb3B0LnBvcyA9IGZwb3NcbiAgICAgICAgICAgIG9wdC5wb3NbMF0gPSBvcHQuY29sIGlmIG9wdC5jb2xcbiAgICAgICAgICAgIG9wdC5wb3NbMV0gPSBvcHQubGluZS0xIGlmIG9wdC5saW5lXG4gICAgICAgICAgICBvcHQud2luSUQgID0gd2luZG93LndpbklEXG5cbiAgICAgICAgICAgIG9wdC5vbGRQb3MgPSBAY3Vyc29yUG9zKClcbiAgICAgICAgICAgIG9wdC5vbGRGaWxlID0gQGN1cnJlbnRGaWxlXG4gICAgICAgICAgICB3aW5kb3cubmF2aWdhdGUuZ290b0ZpbGVQb3Mgb3B0XG5cbiAgICBqdW1wVG86ICh3b3JkLCBvcHQpID0+XG5cbiAgICAgICAgaWYgXy5pc09iamVjdCh3b3JkKSBhbmQgbm90IG9wdD9cbiAgICAgICAgICAgIG9wdCAgPSB3b3JkXG4gICAgICAgICAgICB3b3JkID0gb3B0LndvcmRcblxuICAgICAgICBvcHQgPz0ge31cblxuICAgICAgICBpZiBvcHQuZmlsZT9cbiAgICAgICAgICAgIEBqdW1wVG9GaWxlIG9wdFxuICAgICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgICByZXR1cm4ga2Vycm9yICdub3RoaW5nIHRvIGp1bXAgdG8/JyBpZiBlbXB0eSB3b3JkXG5cbiAgICAgICAgZmluZCA9IHdvcmQudG9Mb3dlckNhc2UoKS50cmltKClcbiAgICAgICAgZmluZCA9IGZpbmQuc2xpY2UgMSBpZiBmaW5kWzBdID09ICdAJ1xuXG4gICAgICAgIHJldHVybiBrZXJyb3IgJ0ZpbGVFZGl0b3IuanVtcFRvIC0tIG5vdGhpbmcgdG8gZmluZD8nIGlmIGVtcHR5IGZpbmRcblxuICAgICAgICB0eXBlID0gb3B0Py50eXBlXG5cbiAgICAgICAgaWYgbm90IHR5cGUgb3IgdHlwZSA9PSAnY2xhc3MnXG4gICAgICAgICAgICBjbGFzc2VzID0gcG9zdC5nZXQgJ2luZGV4ZXInICdjbGFzc2VzJ1xuICAgICAgICAgICAgZm9yIGNsc3MsIGluZm8gb2YgY2xhc3Nlc1xuICAgICAgICAgICAgICAgIGlmIGNsc3MudG9Mb3dlckNhc2UoKSA9PSBmaW5kXG4gICAgICAgICAgICAgICAgICAgIEBqdW1wVG9GaWxlIGluZm9cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgICBpZiBub3QgdHlwZSBvciB0eXBlID09ICdmdW5jJ1xuICAgICAgICAgICAgZnVuY3MgPSBwb3N0LmdldCAnaW5kZXhlcicgJ2Z1bmNzJ1xuICAgICAgICAgICAgZm9yIGZ1bmMsIGluZm9zIG9mIGZ1bmNzXG4gICAgICAgICAgICAgICAgaWYgZnVuYy50b0xvd2VyQ2FzZSgpID09IGZpbmRcbiAgICAgICAgICAgICAgICAgICAgaW5mbyA9IGluZm9zWzBdXG4gICAgICAgICAgICAgICAgICAgIGZvciBpIGluIGluZm9zXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBpLmZpbGUgPT0gQGN1cnJlbnRGaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mbyA9IGlcbiAgICAgICAgICAgICAgICAgICAgQGp1bXBUb0ZpbGUgaW5mb1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgICAgIGlmIG5vdCB0eXBlIG9yIHR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICAgICBmaWxlcyA9IHBvc3QuZ2V0ICdpbmRleGVyJyAnZmlsZXMnXG4gICAgICAgICAgICBmb3IgZmlsZSwgaW5mbyBvZiBmaWxlc1xuICAgICAgICAgICAgICAgIGlmIHNsYXNoLmJhc2UoZmlsZSkudG9Mb3dlckNhc2UoKSA9PSBmaW5kIGFuZCBmaWxlICE9IEBjdXJyZW50RmlsZVxuICAgICAgICAgICAgICAgICAgICBAanVtcFRvRmlsZSBmaWxlOmZpbGUsIGxpbmU6NlxuXG4gICAgICAgIHdpbmRvdy5jb21tYW5kbGluZS5jb21tYW5kcy5zZWFyY2guc3RhcnQgJ3NlYXJjaCdcbiAgICAgICAgd2luZG93LmNvbW1hbmRsaW5lLmNvbW1hbmRzLnNlYXJjaC5leGVjdXRlIHdvcmRcblxuICAgICAgICB3aW5kb3cuc3BsaXQuZG8gJ3Nob3cgdGVybWluYWwnXG5cbiAgICAgICAgdHJ1ZVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAganVtcFRvQ291bnRlcnBhcnQ6ICgpIC0+XG5cbiAgICAgICAgY3AgPSBAY3Vyc29yUG9zKClcbiAgICAgICAgY3VycmV4dCA9IHNsYXNoLmV4dCBAY3VycmVudEZpbGVcblxuICAgICAgICBzd2l0Y2ggY3VycmV4dFxuICAgICAgICAgICAgd2hlbiAnY29mZmVlJyAna29mZmVlJ1xuICAgICAgICAgICAgICAgIFtmaWxlLGxpbmUsY29sXSA9IHNyY21hcC50b0pzIEBjdXJyZW50RmlsZSwgY3BbMV0rMSwgY3BbMF1cbiAgICAgICAgICAgIHdoZW4gJ2pzJ1xuICAgICAgICAgICAgICAgIFtmaWxlLGxpbmUsY29sXSA9IHNyY21hcC50b0NvZmZlZSBAY3VycmVudEZpbGUsIGNwWzFdKzEsIGNwWzBdXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkKGZpbGUpIGFuZCBzbGFzaC5maWxlRXhpc3RzIGZpbGVcbiAgICAgICAgICAgICMga2xvZyAnbG9hZEZpbGUnIHNsYXNoLmpvaW5GaWxlTGluZSBmaWxlLGxpbmUsY29sXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJyBzbGFzaC5qb2luRmlsZUxpbmUgZmlsZSxsaW5lLGNvbFxuICAgICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgICBjb3VudGVycGFydHMgPVxuICAgICAgICAgICAgY3BwOiAgICAgWydocHAnICdoJ11cbiAgICAgICAgICAgIGNjOiAgICAgIFsnaHBwJyAnaCddXG4gICAgICAgICAgICBoOiAgICAgICBbJ2NwcCcgJ2MnXVxuICAgICAgICAgICAgaHBwOiAgICAgWydjcHAnICdjJ11cbiAgICAgICAgICAgIGNvZmZlZTogIFsnanMnXVxuICAgICAgICAgICAga29mZmVlOiAgWydqcyddXG4gICAgICAgICAgICBqczogICAgICBbJ2NvZmZlZScna29mZmVlJ11cbiAgICAgICAgICAgIHB1ZzogICAgIFsnaHRtbCddXG4gICAgICAgICAgICBodG1sOiAgICBbJ3B1ZyddXG4gICAgICAgICAgICBjc3M6ICAgICBbJ3N0eWwnXVxuICAgICAgICAgICAgc3R5bDogICAgWydjc3MnXVxuXG4gICAgICAgIGZvciBleHQgaW4gKGNvdW50ZXJwYXJ0c1tjdXJyZXh0XSA/IFtdKVxuICAgICAgICAgICAgaWYgc2xhc2guZmlsZUV4aXN0cyBzbGFzaC5zd2FwRXh0IEBjdXJyZW50RmlsZSwgZXh0XG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdsb2FkRmlsZScgc2xhc2guc3dhcEV4dCBAY3VycmVudEZpbGUsIGV4dFxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAgICAgZm9yIGV4dCBpbiAoY291bnRlcnBhcnRzW2N1cnJleHRdID8gW10pXG4gICAgICAgICAgICBjb3VudGVyID0gc2xhc2guc3dhcEV4dCBAY3VycmVudEZpbGUsIGV4dFxuICAgICAgICAgICAgY291bnRlciA9IGNvdW50ZXIucmVwbGFjZSBcIi8je2N1cnJleHR9L1wiIFwiLyN7ZXh0fS9cIlxuICAgICAgICAgICAgaWYgc2xhc2guZmlsZUV4aXN0cyBjb3VudGVyXG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdsb2FkRmlsZScgY291bnRlclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGZhbHNlXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGNlbnRlclRleHQ6IChjZW50ZXIsIGFuaW1hdGU9MzAwKSAtPlxuXG4gICAgICAgIEBzaXplLmNlbnRlclRleHQgPSBjZW50ZXJcbiAgICAgICAgQHVwZGF0ZUxheWVycygpXG5cbiAgICAgICAgQHNpemUub2Zmc2V0WCA9IE1hdGguZmxvb3IgQHNpemUuY2hhcldpZHRoLzIgKyBAc2l6ZS5udW1iZXJzV2lkdGhcbiAgICAgICAgaWYgY2VudGVyXG4gICAgICAgICAgICBiciAgICAgICAgPSBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgICAgdmlzQ29scyAgID0gcGFyc2VJbnQgYnIud2lkdGggLyBAc2l6ZS5jaGFyV2lkdGhcbiAgICAgICAgICAgIG5ld09mZnNldCA9IHBhcnNlSW50IEBzaXplLmNoYXJXaWR0aCAqICh2aXNDb2xzIC0gMTAwKSAvIDJcbiAgICAgICAgICAgIEBzaXplLm9mZnNldFggPSBNYXRoLm1heCBAc2l6ZS5vZmZzZXRYLCBuZXdPZmZzZXRcbiAgICAgICAgICAgIEBzaXplLmNlbnRlclRleHQgPSB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzaXplLmNlbnRlclRleHQgPSBmYWxzZVxuXG4gICAgICAgIEB1cGRhdGVMaW5lUG9zaXRpb25zIGFuaW1hdGVcblxuICAgICAgICBpZiBhbmltYXRlXG4gICAgICAgICAgICBsYXllcnMgPSBbJy5zZWxlY3Rpb25zJyAnLmhpZ2hsaWdodHMnICcuY3Vyc29ycyddXG4gICAgICAgICAgICB0cmFuc2kgPSBbJy5zZWxlY3Rpb24nICAnLmhpZ2hsaWdodCcgICcuY3Vyc29yJyBdLmNvbmNhdCBsYXllcnNcbiAgICAgICAgICAgIHJlc2V0VHJhbnMgPSA9PlxuICAgICAgICAgICAgICAgIHNldFN0eWxlICcuZWRpdG9yIC5sYXllcnMgJytsLCAndHJhbnNmb3JtJyBcInRyYW5zbGF0ZVgoMClcIiBmb3IgbCBpbiBsYXllcnNcbiAgICAgICAgICAgICAgICBzZXRTdHlsZSAnLmVkaXRvciAubGF5ZXJzICcrdCwgJ3RyYW5zaXRpb24nIFwiaW5pdGlhbFwiIGZvciB0IGluIHRyYW5zaVxuICAgICAgICAgICAgICAgIEB1cGRhdGVMYXllcnMoKVxuXG4gICAgICAgICAgICBpZiBjZW50ZXJcbiAgICAgICAgICAgICAgICBvZmZzZXRYID0gQHNpemUub2Zmc2V0WCAtIEBzaXplLm51bWJlcnNXaWR0aCAtIEBzaXplLmNoYXJXaWR0aC8yXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgb2Zmc2V0WCA9IE1hdGguZmxvb3IgQHNpemUuY2hhcldpZHRoLzIgKyBAc2l6ZS5udW1iZXJzV2lkdGhcbiAgICAgICAgICAgICAgICBvZmZzZXRYID0gTWF0aC5tYXggb2Zmc2V0WCwgKEBzY3JlZW5TaXplKCkud2lkdGggLSBAc2NyZWVuU2l6ZSgpLmhlaWdodCkgLyAyXG4gICAgICAgICAgICAgICAgb2Zmc2V0WCAtPSBAc2l6ZS5udW1iZXJzV2lkdGggKyBAc2l6ZS5jaGFyV2lkdGgvMlxuICAgICAgICAgICAgICAgIG9mZnNldFggKj0gLTFcblxuICAgICAgICAgICAgc2V0U3R5bGUgJy5lZGl0b3IgLmxheWVycyAnK2wsICd0cmFuc2Zvcm0nIFwidHJhbnNsYXRlWCgje29mZnNldFh9cHgpXCIgZm9yIGwgaW4gbGF5ZXJzXG4gICAgICAgICAgICBzZXRTdHlsZSAnLmVkaXRvciAubGF5ZXJzICcrdCwgJ3RyYW5zaXRpb24nIFwiYWxsICN7YW5pbWF0ZS8xMDAwfXNcIiBmb3IgdCBpbiB0cmFuc2lcbiAgICAgICAgICAgIHNldFRpbWVvdXQgcmVzZXRUcmFucywgYW5pbWF0ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdXBkYXRlTGF5ZXJzKClcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMFxuXG4gICAgb25Db250ZXh0TWVudTogKGV2ZW50KSA9PiBzdG9wRXZlbnQgZXZlbnQsIEBzaG93Q29udGV4dE1lbnUga3BvcyBldmVudFxuXG4gICAgc2hvd0NvbnRleHRNZW51OiAoYWJzUG9zKSA9PlxuXG4gICAgICAgIGlmIG5vdCBhYnNQb3M/XG4gICAgICAgICAgICBhYnNQb3MgPSBrcG9zIEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQsIEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcFxuXG4gICAgICAgIG9wdCA9IGl0ZW1zOiBbXG4gICAgICAgICAgICB0ZXh0OiAgICdCcm93c2UnXG4gICAgICAgICAgICBjb21ibzogICdjb21tYW5kKy4nXG4gICAgICAgICAgICBhY2NlbDogICdjdHJsKy4nXG4gICAgICAgICAgICBjYjogICAgIC0+IHdpbmRvdy5jb21tYW5kbGluZS5zdGFydENvbW1hbmQgJ2Jyb3dzZSdcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnQmFjaydcbiAgICAgICAgICAgIGNvbWJvOiAgJ2NvbW1hbmQrMSdcbiAgICAgICAgICAgIGNiOiAgICAgLT4gcG9zdC5lbWl0ICdtZW51QWN0aW9uJyAnTmF2aWdhdGUgQmFja3dhcmQnICMgZml4IG1lISBpbiBzYW1lIGZpbGUgbmF2aWdhdGlvbiFcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnJ1xuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdNYXhpbWl6ZSdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2NvbW1hbmQrc2hpZnQreSdcbiAgICAgICAgICAgIGFjY2VsOiAgJ2N0cmwrc2hpZnQreSdcbiAgICAgICAgICAgIGNiOiAgICAgLT4gd2luZG93LnNwbGl0Lm1heGltaXplRWRpdG9yKClcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnJ1xuICAgICAgICBdXG5cbiAgICAgICAgb3B0Lml0ZW1zID0gb3B0Lml0ZW1zLmNvbmNhdCB3aW5kb3cudGl0bGViYXIubWVudVRlbXBsYXRlKClcblxuICAgICAgICBvcHQueCA9IGFic1Bvcy54XG4gICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgcG9wdXAubWVudSBvcHRcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBjbGlja0F0UG9zOiAocCwgZXZlbnQpIC0+XG5cbiAgICAgICAgaWYgZXZlbnQubWV0YUtleVxuICAgICAgICAgICAgaWYga3BvcyhldmVudCkueCA8PSBAc2l6ZS5udW1iZXJzV2lkdGhcbiAgICAgICAgICAgICAgICBAc2luZ2xlQ3Vyc29yQXRQb3MgcFxuICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIHN1cGVyIHAsIGV2ZW50XG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0NoYXJFdmVudDogKG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnQpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmICd1bmhhbmRsZWQnICE9IHN1cGVyIG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnRcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdhbHQrY3RybCtlbnRlcicgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmNvbW1hbmRsaW5lLmNvbW1hbmRzLmNvZmZlZS5leGVjdXRlVGV4dCBAdGV4dE9mU2VsZWN0aW9uRm9yQ2xpcGJvYXJkKClcbiAgICAgICAgICAgIHdoZW4gJ2FsdCtjdHJsK3NoaWZ0K2VudGVyJyB0aGVuIHJldHVybiB3aW5kb3cuY29tbWFuZGxpbmUuY29tbWFuZHMuY29mZmVlLmV4ZWN1dGVUZXh0SW5NYWluIEB0ZXh0T2ZTZWxlY3Rpb25Gb3JDbGlwYm9hcmR0KClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrYWx0K3VwJyAnYWx0K28nIHRoZW4gcmV0dXJuIEBqdW1wVG9Db3VudGVycGFydCgpXG4gICAgICAgICAgICB3aGVuICdlc2MnXG4gICAgICAgICAgICAgICAgc3BsaXQgPSB3aW5kb3cuc3BsaXRcbiAgICAgICAgICAgICAgICBpZiBzcGxpdC50ZXJtaW5hbFZpc2libGUoKVxuICAgICAgICAgICAgICAgICAgICBzcGxpdC5oaWRlVGVybWluYWwoKVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgc3BsaXQuY29tbWFuZGxpbmVWaXNpYmxlKClcbiAgICAgICAgICAgICAgICAgICAgc3BsaXQuaGlkZUNvbW1hbmRsaW5lKClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgJ3VuaGFuZGxlZCdcblxubW9kdWxlLmV4cG9ydHMgPSBGaWxlRWRpdG9yXG4iXX0=
//# sourceURL=../../coffee/editor/fileeditor.coffee