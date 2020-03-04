// koffee 1.11.0

/*
 0000000   0000000   00     00  00     00   0000000   000   000  0000000    000      000  000   000  00000000
000       000   000  000   000  000   000  000   000  0000  000  000   000  000      000  0000  000  000
000       000   000  000000000  000000000  000000000  000 0 000  000   000  000      000  000 0 000  0000000
000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  000      000  000  0000  000
 0000000   0000000   000   000  000   000  000   000  000   000  0000000    0000000  000  000   000  00000000
 */
var $, Commandline, TextEditor, args, elem, filelist, kerror, post, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf;

ref = require('kxk'), $ = ref.$, args = ref.args, elem = ref.elem, filelist = ref.filelist, kerror = ref.kerror, post = ref.post, slash = ref.slash, stopEvent = ref.stopEvent;

TextEditor = require('../editor/texteditor');

Commandline = (function(superClass) {
    extend(Commandline, superClass);

    function Commandline(viewElem) {
        this.onCmmdClick = bind(this.onCmmdClick, this);
        this.onSplit = bind(this.onSplit, this);
        this.restore = bind(this.restore, this);
        this.stash = bind(this.stash, this);
        this.onSearchText = bind(this.onSearchText, this);
        Commandline.__super__.constructor.call(this, viewElem, {
            features: [],
            fontSize: 24,
            syntaxName: 'commandline'
        });
        this.mainCommands = ['browse', 'goto', 'open', 'search', 'find', 'macro'];
        this.hideCommands = ['selecto', 'Browse'];
        this.size.lineHeight = 30;
        this.scroll.setLineHeight(this.size.lineHeight);
        this.button = $('commandline-button');
        this.button.classList.add('empty');
        this.button.addEventListener('mousedown', this.onCmmdClick);
        this.commands = {};
        this.command = null;
        this.loadCommands();
        post.on('split', this.onSplit);
        post.on('restore', this.restore);
        post.on('stash', this.stash);
        post.on('searchText', this.onSearchText);
        this.view.onblur = (function(_this) {
            return function() {
                var ref1, ref2;
                _this.button.classList.remove('active');
                if ((ref1 = _this.list) != null) {
                    ref1.remove();
                }
                _this.list = null;
                return (ref2 = _this.command) != null ? ref2.onBlur() : void 0;
            };
        })(this);
        this.view.onfocus = (function(_this) {
            return function() {
                var ref1;
                return _this.button.className = "commandline-button active " + ((ref1 = _this.command) != null ? ref1.prefsID : void 0);
            };
        })(this);
    }

    Commandline.prototype.onSearchText = function(text) {
        var ref1, ref2;
        if (window.split.commandlineVisible()) {
            if ((ref1 = (ref2 = this.command) != null ? ref2.prefsID : void 0) !== 'search' && ref1 !== 'find') {
                this.startCommand('find');
            }
        }
        this.commands.find.currentText = text;
        this.commands.search.currentText = text;
        return this.setText(text);
    };

    Commandline.prototype.stash = function() {
        if (this.command != null) {
            return window.stash.set('commandline', this.command.state());
        }
    };

    Commandline.prototype.restore = function() {
        var activeID, name, ref1, ref2, ref3, state;
        state = window.stash.get('commandline');
        this.setText((ref1 = state != null ? state.text : void 0) != null ? ref1 : "");
        name = (ref2 = state != null ? state.name : void 0) != null ? ref2 : 'open';
        if (this.command = this.commandForName(name)) {
            activeID = document.activeElement.id;
            if (activeID.startsWith('column')) {
                activeID = 'editor';
            }
            this.command.setReceiver(activeID !== 'commandline-editor' && activeID || null);
            this.setName(name);
            this.button.className = "commandline-button active " + this.command.prefsID;
            return (ref3 = this.commands[name]) != null ? typeof ref3.restoreState === "function" ? ref3.restoreState(state) : void 0 : void 0;
        }
    };

    Commandline.prototype.loadCommands = function() {
        var command, commandClass, err, file, files, i, len, results;
        files = filelist(__dirname + "/../commands");
        results = [];
        for (i = 0, len = files.length; i < len; i++) {
            file = files[i];
            if (slash.ext(file) !== 'js') {
                continue;
            }
            try {
                commandClass = require(file);
                command = new commandClass(this);
                command.setPrefsID(commandClass.name.toLowerCase());
                results.push(this.commands[command.prefsID] = command);
            } catch (error) {
                err = error;
                results.push(kerror("can't load command from file '" + file + "': " + err));
            }
        }
        return results;
    };

    Commandline.prototype.setName = function(name) {
        this.button.innerHTML = name;
        return this.layers.style.width = this.view.style.width;
    };

    Commandline.prototype.setLines = function(l) {
        this.scroll.reset();
        return Commandline.__super__.setLines.call(this, l);
    };

    Commandline.prototype.setAndSelectText = function(t) {
        this.setLines([t != null ? t : '']);
        this.selectAll();
        return this.selectSingleRange(this.rangeForLineAtIndex(0));
    };

    Commandline.prototype.setText = function(t) {
        this.setLines([t != null ? t : '']);
        return this.singleCursorAtPos([this.line(0).length, 0]);
    };

    Commandline.prototype.changed = function(changeInfo) {
        var ref1, ref2;
        this.hideList();
        Commandline.__super__.changed.call(this, changeInfo);
        if (changeInfo.changes.length) {
            this.button.className = "commandline-button active " + ((ref1 = this.command) != null ? ref1.prefsID : void 0);
            return (ref2 = this.command) != null ? ref2.changed(this.line(0)) : void 0;
        }
    };

    Commandline.prototype.onSplit = function(s) {
        var ref1;
        if ((ref1 = this.command) != null) {
            if (typeof ref1.onBot === "function") {
                ref1.onBot(s[1]);
            }
        }
        return this.positionList();
    };

    Commandline.prototype.startCommand = function(name) {
        var activeID, r, ref1;
        r = (ref1 = this.command) != null ? ref1.cancel(name) : void 0;
        if ((r != null ? r.status : void 0) === 'ok') {
            this.results(r);
            return;
        }
        window.split.showCommandline();
        if (this.command = this.commandForName(name)) {
            activeID = document.activeElement.id;
            if (activeID.startsWith('column')) {
                activeID = 'editor';
            }
            if (activeID && activeID !== 'commandline-editor') {
                this.command.setReceiver(activeID);
            }
            this.lastFocus = window.lastFocus;
            this.view.focus();
            this.setName(name);
            this.results(this.command.start(name));
            if (name === 'search' || name === 'find') {
                window.textEditor.highlightTextOfSelectionOrWordAtCursor();
                this.view.focus();
            }
            return this.button.className = "commandline-button active " + this.command.prefsID;
        } else {
            return kerror("no command " + name);
        }
    };

    Commandline.prototype.commandForName = function(name) {
        var c, n, ref1;
        ref1 = this.commands;
        for (n in ref1) {
            c = ref1[n];
            if (n === name || indexOf.call(c.names, name) >= 0) {
                return c;
            }
        }
    };

    Commandline.prototype.execute = function() {
        var ref1;
        return this.results((ref1 = this.command) != null ? ref1.execute(this.line(0)) : void 0);
    };

    Commandline.prototype.results = function(r) {
        if ((r != null ? r.name : void 0) != null) {
            this.setName(r.name);
        }
        if ((r != null ? r.text : void 0) != null) {
            this.setText(r.text);
        }
        if (r != null ? r.select : void 0) {
            this.selectAll();
        } else {
            this.selectNone();
        }
        if ((r != null ? r.show : void 0) != null) {
            window.split.show(r.show);
        }
        if ((r != null ? r.focus : void 0) != null) {
            window.split.focus(r.focus);
        }
        if ((r != null ? r["do"] : void 0) != null) {
            window.split["do"](r["do"]);
        }
        return this;
    };

    Commandline.prototype.cancel = function() {
        var ref1;
        return this.results((ref1 = this.command) != null ? ref1.cancel() : void 0);
    };

    Commandline.prototype.clear = function() {
        var ref1;
        if (this.text() === '') {
            return this.results((ref1 = this.command) != null ? ref1.clear() : void 0);
        } else {
            return Commandline.__super__.clear.apply(this, arguments).clear();
        }
    };

    Commandline.prototype.onCmmdClick = function(event) {
        var ref1;
        if (this.list == null) {
            this.list = elem({
                "class": 'list commands'
            });
            this.positionList();
            window.split.elem.appendChild(this.list);
        }
        if ((ref1 = this.command) != null) {
            if (typeof ref1.hideList === "function") {
                ref1.hideList();
            }
        }
        this.listCommands();
        this.focus();
        this.positionList();
        return stopEvent(event);
    };

    Commandline.prototype.listCommands = function() {
        var ci, cmmd, cname, div, i, len, name, namespan, ref1, results, start;
        this.list.innerHTML = "";
        this.list.style.display = 'unset';
        ref1 = this.mainCommands;
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            name = ref1[i];
            cmmd = this.commands[name];
            results.push((function() {
                var j, ref2, results1;
                results1 = [];
                for (ci = j = 0, ref2 = cmmd.names.length; 0 <= ref2 ? j < ref2 : j > ref2; ci = 0 <= ref2 ? ++j : --j) {
                    cname = cmmd.names[ci];
                    if (indexOf.call(this.hideCommands, cname) >= 0) {
                        continue;
                    }
                    div = elem({
                        "class": "list-item"
                    });
                    namespan = "<span class=\"ko command " + cmmd.prefsID + "\" style=\"position:absolute; left: " + (ci > 0 && 80 || 12) + "px\">" + cname + "</span>";
                    div.innerHTML = namespan;
                    start = (function(_this) {
                        return function(name) {
                            return function(event) {
                                _this.hideList();
                                _this.startCommand(name);
                                return stopEvent(event);
                            };
                        };
                    })(this);
                    div.addEventListener('mousedown', start(cname));
                    results1.push(this.list.appendChild(div));
                }
                return results1;
            }).call(this));
        }
        return results;
    };

    Commandline.prototype.hideList = function() {
        var ref1;
        if ((ref1 = this.list) != null) {
            ref1.remove();
        }
        return this.list = null;
    };

    Commandline.prototype.positionList = function() {
        var flex, listHeight, listTop, ref1, spaceAbove, spaceBelow;
        if (this.list == null) {
            return;
        }
        listHeight = this.list.getBoundingClientRect().height;
        flex = window.split.flex;
        listTop = flex.posOfPane(2);
        spaceBelow = flex.size() - listTop;
        spaceAbove = flex.sizeOfPane(0);
        if (spaceBelow < listHeight && spaceAbove > spaceBelow) {
            listTop = spaceAbove - listHeight;
        }
        return (ref1 = this.list) != null ? ref1.style.top = listTop + "px" : void 0;
    };

    Commandline.prototype.resized = function() {
        var ref1, ref2, ref3;
        if ((ref1 = this.list) != null) {
            if (typeof ref1.resized === "function") {
                ref1.resized();
            }
        }
        if ((ref2 = this.command) != null) {
            if ((ref3 = ref2.commandList) != null) {
                ref3.resized();
            }
        }
        return Commandline.__super__.resized.call(this);
    };

    Commandline.prototype.focusTerminal = function() {
        if (window.terminal.numLines() === 0) {
            window.terminal.singleCursorAtPos([0, 0]);
        }
        return window.split["do"]("focus terminal");
    };

    Commandline.prototype.handleMenuAction = function(name, args) {
        if (args != null ? args.command : void 0) {
            if (this.commandForName(args.command)) {
                this.startCommand(args.command);
                return;
            }
        }
        return 'unhandled';
    };

    Commandline.prototype.globalModKeyComboEvent = function(mod, key, combo, event) {
        if (combo === 'esc') {
            if (document.activeElement === this.view) {
                stopEvent(event);
                return this.cancel();
            }
        }
        if (this.command != null) {
            return this.command.globalModKeyComboEvent(mod, key, combo, event);
        }
        return 'unhandled';
    };

    Commandline.prototype.handleModKeyComboCharEvent = function(mod, key, combo, char, event) {
        var ref1, ref2, ref3, ref4, split;
        if (this.command != null) {
            if ('unhandled' !== this.command.handleModKeyComboEvent(mod, key, combo, event)) {
                return;
            }
        }
        split = window.split;
        switch (combo) {
            case 'enter':
                return this.execute();
            case 'command+enter':
                return this.execute() + window.split["do"]("focus " + ((ref1 = this.command) != null ? ref1.focus : void 0));
            case 'command+shift+enter':
                return this.focusTerminal();
            case 'up':
                return (ref2 = this.command) != null ? ref2.selectListItem('up') : void 0;
            case 'down':
                return (ref3 = this.command) != null ? ref3.selectListItem('down') : void 0;
            case 'esc':
                return this.cancel();
            case 'command+k':
                return this.clear();
            case 'shift+tab':
                return;
            case 'home':
            case 'command+up':
                return split["do"]('maximize editor');
            case 'end':
            case 'command+down':
                return split["do"]('minimize editor');
            case 'alt+up':
                return split["do"]('enlarge editor');
            case 'ctrl+up':
                return split["do"]('enlarge editor by 20');
            case 'alt+down':
                return split["do"]('reduce editor');
            case 'ctrl+down':
                return split["do"]('reduce editor by 20');
            case 'right':
            case 'tab':
                if ((ref4 = this.command) != null ? ref4.onTabCompletion(combo) : void 0) {
                    return;
                }
        }
        return Commandline.__super__.handleModKeyComboCharEvent.call(this, mod, key, combo, char, event);
    };

    return Commandline;

})(TextEditor);

module.exports = Commandline;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZGxpbmUuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2NvbW1hbmRsaW5lIiwic291cmNlcyI6WyJjb21tYW5kbGluZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEscUZBQUE7SUFBQTs7Ozs7QUFRQSxNQUE4RCxPQUFBLENBQVEsS0FBUixDQUE5RCxFQUFFLFNBQUYsRUFBSyxlQUFMLEVBQVcsZUFBWCxFQUFpQix1QkFBakIsRUFBMkIsbUJBQTNCLEVBQW1DLGVBQW5DLEVBQXlDLGlCQUF6QyxFQUFnRDs7QUFFaEQsVUFBQSxHQUFhLE9BQUEsQ0FBUSxzQkFBUjs7QUFFUDs7O0lBRUMscUJBQUMsUUFBRDs7Ozs7O1FBRUMsNkNBQU0sUUFBTixFQUFnQjtZQUFBLFFBQUEsRUFBVSxFQUFWO1lBQWMsUUFBQSxFQUFVLEVBQXhCO1lBQTRCLFVBQUEsRUFBVyxhQUF2QztTQUFoQjtRQUVBLElBQUMsQ0FBQSxZQUFELEdBQWdCLENBQUMsUUFBRCxFQUFVLE1BQVYsRUFBaUIsTUFBakIsRUFBd0IsUUFBeEIsRUFBaUMsTUFBakMsRUFBd0MsT0FBeEM7UUFDaEIsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsQ0FBQyxTQUFELEVBQVcsUUFBWDtRQUVoQixJQUFDLENBQUEsSUFBSSxDQUFDLFVBQU4sR0FBbUI7UUFDbkIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxhQUFSLENBQXNCLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBNUI7UUFFQSxJQUFDLENBQUEsTUFBRCxHQUFTLENBQUEsQ0FBRSxvQkFBRjtRQUNULElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQWxCLENBQXNCLE9BQXRCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQkFBUixDQUF5QixXQUF6QixFQUFxQyxJQUFDLENBQUEsV0FBdEM7UUFFQSxJQUFDLENBQUEsUUFBRCxHQUFZO1FBQ1osSUFBQyxDQUFBLE9BQUQsR0FBVztRQUVYLElB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aUJBVWUsY0FWZjtBQVVxQyx1QkFBTyxLQUFLLEVBQUMsRUFBRCxFQUFMLENBQVMsaUJBQVQ7QUFWNUMsaUJBV1MsUUFYVDtBQVdxQyx1QkFBTyxLQUFLLEVBQUMsRUFBRCxFQUFMLENBQVMsZ0JBQVQ7QUFYNUMsaUJBWVMsU0FaVDtBQVlxQyx1QkFBTyxLQUFLLEVBQUMsRUFBRCxFQUFMLENBQVMsc0JBQVQ7QUFaNUMsaUJBYVMsVUFiVDtBQWFxQyx1QkFBTyxLQUFLLEVBQUMsRUFBRCxFQUFMLENBQVMsZUFBVDtBQWI1QyxpQkFjUyxXQWRUO0FBY3FDLHVCQUFPLEtBQUssRUFBQyxFQUFELEVBQUwsQ0FBUyxxQkFBVDtBQWQ1QyxpQkFlUyxPQWZUO0FBQUEsaUJBZWlCLEtBZmpCO2dCQWVxQyx3Q0FBa0IsQ0FBRSxlQUFWLENBQTBCLEtBQTFCLFVBQVY7QUFBQSwyQkFBQTs7QUFmckM7QUFpQkEsZUFBTyw0REFBTSxHQUFOLEVBQVcsR0FBWCxFQUFnQixLQUFoQixFQUF1QixJQUF2QixFQUE2QixLQUE3QjtJQXZCaUI7Ozs7R0FsVE47O0FBMlUxQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDBcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiMjI1xuXG57ICQsIGFyZ3MsIGVsZW0sIGZpbGVsaXN0LCBrZXJyb3IsIHBvc3QsIHNsYXNoLCBzdG9wRXZlbnQgfSA9IHJlcXVpcmUgJ2t4aydcblxuVGV4dEVkaXRvciA9IHJlcXVpcmUgJy4uL2VkaXRvci90ZXh0ZWRpdG9yJ1xuXG5jbGFzcyBDb21tYW5kbGluZSBleHRlbmRzIFRleHRFZGl0b3JcblxuICAgIEA6ICh2aWV3RWxlbSkgLT5cblxuICAgICAgICBzdXBlciB2aWV3RWxlbSwgZmVhdHVyZXM6IFtdLCBmb250U2l6ZTogMjQsIHN5bnRheE5hbWU6J2NvbW1hbmRsaW5lJ1xuXG4gICAgICAgIEBtYWluQ29tbWFuZHMgPSBbJ2Jyb3dzZScgJ2dvdG8nICdvcGVuJyAnc2VhcmNoJyAnZmluZCcgJ21hY3JvJ11cbiAgICAgICAgQGhpZGVDb21tYW5kcyA9IFsnc2VsZWN0bycgJ0Jyb3dzZSddXG5cbiAgICAgICAgQHNpemUubGluZUhlaWdodCA9IDMwXG4gICAgICAgIEBzY3JvbGwuc2V0TGluZUhlaWdodCBAc2l6ZS5saW5lSGVpZ2h0XG5cbiAgICAgICAgQGJ1dHRvbiA9JCAnY29tbWFuZGxpbmUtYnV0dG9uJ1xuICAgICAgICBAYnV0dG9uLmNsYXNzTGlzdC5hZGQgJ2VtcHR5J1xuICAgICAgICBAYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicgQG9uQ21tZENsaWNrXG5cbiAgICAgICAgQGNvbW1hbmRzID0ge31cbiAgICAgICAgQGNvbW1hbmQgPSBudWxsXG5cbiAgICAgICAgQGxvYWRDb21tYW5kcygpXG5cbiAgICAgICAgcG9zdC5vbiAnc3BsaXQnICAgICAgQG9uU3BsaXRcbiAgICAgICAgcG9zdC5vbiAncmVzdG9yZScgICAgQHJlc3RvcmVcbiAgICAgICAgcG9zdC5vbiAnc3Rhc2gnICAgICAgQHN0YXNoXG4gICAgICAgIHBvc3Qub24gJ3NlYXJjaFRleHQnIEBvblNlYXJjaFRleHRcblxuICAgICAgICBAdmlldy5vbmJsdXIgPSA9PlxuICAgICAgICAgICAgQGJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlICdhY3RpdmUnXG4gICAgICAgICAgICBAbGlzdD8ucmVtb3ZlKClcbiAgICAgICAgICAgIEBsaXN0ID0gbnVsbFxuICAgICAgICAgICAgQGNvbW1hbmQ/Lm9uQmx1cigpXG5cbiAgICAgICAgQHZpZXcub25mb2N1cyA9ID0+XG4gICAgICAgICAgICBAYnV0dG9uLmNsYXNzTmFtZSA9IFwiY29tbWFuZGxpbmUtYnV0dG9uIGFjdGl2ZSAje0Bjb21tYW5kPy5wcmVmc0lEfVwiXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBvblNlYXJjaFRleHQ6ICh0ZXh0KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgd2luZG93LnNwbGl0LmNvbW1hbmRsaW5lVmlzaWJsZSgpXG4gICAgICAgICAgICBpZiBAY29tbWFuZD8ucHJlZnNJRCBub3QgaW4gWydzZWFyY2gnICdmaW5kJ11cbiAgICAgICAgICAgICAgICBAc3RhcnRDb21tYW5kICdmaW5kJyBcbiAgICAgICAgQGNvbW1hbmRzLmZpbmQuY3VycmVudFRleHQgPSB0ZXh0XG4gICAgICAgIEBjb21tYW5kcy5zZWFyY2guY3VycmVudFRleHQgPSB0ZXh0XG4gICAgICAgIEBzZXRUZXh0IHRleHRcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxuICAgIHN0YXNoOiA9PlxuXG4gICAgICAgIGlmIEBjb21tYW5kP1xuICAgICAgICAgICAgd2luZG93LnN0YXNoLnNldCAnY29tbWFuZGxpbmUnIEBjb21tYW5kLnN0YXRlKClcblxuICAgIHJlc3RvcmU6ID0+XG5cbiAgICAgICAgc3RhdGUgPSB3aW5kb3cuc3Rhc2guZ2V0ICdjb21tYW5kbGluZSdcblxuICAgICAgICBAc2V0VGV4dCBzdGF0ZT8udGV4dCA/IFwiXCJcblxuICAgICAgICBuYW1lID0gc3RhdGU/Lm5hbWUgPyAnb3BlbidcblxuICAgICAgICBpZiBAY29tbWFuZCA9IEBjb21tYW5kRm9yTmFtZSBuYW1lXG4gICAgICAgICAgICBhY3RpdmVJRCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuaWRcbiAgICAgICAgICAgIGlmIGFjdGl2ZUlELnN0YXJ0c1dpdGggJ2NvbHVtbicgdGhlbiBhY3RpdmVJRCA9ICdlZGl0b3InXG4gICAgICAgICAgICBAY29tbWFuZC5zZXRSZWNlaXZlciBhY3RpdmVJRCAhPSAnY29tbWFuZGxpbmUtZWRpdG9yJyBhbmQgYWN0aXZlSUQgb3IgbnVsbFxuICAgICAgICAgICAgQHNldE5hbWUgbmFtZVxuICAgICAgICAgICAgQGJ1dHRvbi5jbGFzc05hbWUgPSBcImNvbW1hbmRsaW5lLWJ1dHRvbiBhY3RpdmUgI3tAY29tbWFuZC5wcmVmc0lEfVwiXG4gICAgICAgICAgICBAY29tbWFuZHNbbmFtZV0/LnJlc3RvcmVTdGF0ZT8gc3RhdGVcblxuICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBsb2FkQ29tbWFuZHM6IC0+XG5cbiAgICAgICAgZmlsZXMgPSBmaWxlbGlzdCBcIiN7X19kaXJuYW1lfS8uLi9jb21tYW5kc1wiXG4gICAgICAgIGZvciBmaWxlIGluIGZpbGVzXG4gICAgICAgICAgICBjb250aW51ZSBpZiBzbGFzaC5leHQoZmlsZSkgIT0gJ2pzJ1xuICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgICAgY29tbWFuZENsYXNzID0gcmVxdWlyZSBmaWxlXG4gICAgICAgICAgICAgICAgY29tbWFuZCA9IG5ldyBjb21tYW5kQ2xhc3MgQFxuICAgICAgICAgICAgICAgIGNvbW1hbmQuc2V0UHJlZnNJRCBjb21tYW5kQ2xhc3MubmFtZS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgICAgQGNvbW1hbmRzW2NvbW1hbmQucHJlZnNJRF0gPSBjb21tYW5kXG4gICAgICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgICAgICBrZXJyb3IgXCJjYW4ndCBsb2FkIGNvbW1hbmQgZnJvbSBmaWxlICcje2ZpbGV9JzogI3tlcnJ9XCJcblxuICAgIHNldE5hbWU6IChuYW1lKSAtPlxuXG4gICAgICAgIEBidXR0b24uaW5uZXJIVE1MID0gbmFtZVxuICAgICAgICBAbGF5ZXJzLnN0eWxlLndpZHRoID0gQHZpZXcuc3R5bGUud2lkdGhcblxuICAgIHNldExpbmVzOiAobCkgLT5cblxuICAgICAgICBAc2Nyb2xsLnJlc2V0KClcbiAgICAgICAgc3VwZXIgbFxuXG4gICAgc2V0QW5kU2VsZWN0VGV4dDogKHQpIC0+XG5cbiAgICAgICAgQHNldExpbmVzIFt0ID8gJyddXG4gICAgICAgIEBzZWxlY3RBbGwoKVxuICAgICAgICBAc2VsZWN0U2luZ2xlUmFuZ2UgQHJhbmdlRm9yTGluZUF0SW5kZXggMFxuXG4gICAgc2V0VGV4dDogKHQpIC0+XG5cbiAgICAgICAgQHNldExpbmVzIFt0ID8gJyddXG4gICAgICAgIEBzaW5nbGVDdXJzb3JBdFBvcyBbQGxpbmUoMCkubGVuZ3RoLCAwXVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGNoYW5nZWQ6IChjaGFuZ2VJbmZvKSAtPlxuXG4gICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgIHN1cGVyIGNoYW5nZUluZm9cbiAgICAgICAgaWYgY2hhbmdlSW5mby5jaGFuZ2VzLmxlbmd0aFxuICAgICAgICAgICAgQGJ1dHRvbi5jbGFzc05hbWUgPSBcImNvbW1hbmRsaW5lLWJ1dHRvbiBhY3RpdmUgI3tAY29tbWFuZD8ucHJlZnNJRH1cIlxuICAgICAgICAgICAgQGNvbW1hbmQ/LmNoYW5nZWQgQGxpbmUoMClcblxuICAgIG9uU3BsaXQ6IChzKSA9PlxuXG4gICAgICAgIEBjb21tYW5kPy5vbkJvdD8gc1sxXVxuICAgICAgICBAcG9zaXRpb25MaXN0KClcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgIDAwMFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAgc3RhcnRDb21tYW5kOiAobmFtZSkgLT5cblxuICAgICAgICByID0gQGNvbW1hbmQ/LmNhbmNlbCBuYW1lXG5cbiAgICAgICAgaWYgcj8uc3RhdHVzID09ICdvaydcbiAgICAgICAgICAgIEByZXN1bHRzIHJcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIHdpbmRvdy5zcGxpdC5zaG93Q29tbWFuZGxpbmUoKVxuXG4gICAgICAgIGlmIEBjb21tYW5kID0gQGNvbW1hbmRGb3JOYW1lIG5hbWVcblxuICAgICAgICAgICAgYWN0aXZlSUQgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmlkXG4gICAgICAgICAgICBpZiBhY3RpdmVJRC5zdGFydHNXaXRoICdjb2x1bW4nIHRoZW4gYWN0aXZlSUQgPSAnZWRpdG9yJ1xuICAgICAgICAgICAgaWYgYWN0aXZlSUQgYW5kIGFjdGl2ZUlEICE9ICdjb21tYW5kbGluZS1lZGl0b3InXG4gICAgICAgICAgICAgICAgQGNvbW1hbmQuc2V0UmVjZWl2ZXIgYWN0aXZlSURcblxuICAgICAgICAgICAgQGxhc3RGb2N1cyA9IHdpbmRvdy5sYXN0Rm9jdXNcbiAgICAgICAgICAgIEB2aWV3LmZvY3VzKClcbiAgICAgICAgICAgIEBzZXROYW1lIG5hbWVcbiAgICAgICAgICAgIEByZXN1bHRzIEBjb21tYW5kLnN0YXJ0IG5hbWUgIyA8LS0gY29tbWFuZCBzdGFydFxuXG4gICAgICAgICAgICBpZiBuYW1lIGluIFsnc2VhcmNoJyAnZmluZCddXG4gICAgICAgICAgICAgICAgd2luZG93LnRleHRFZGl0b3IuaGlnaGxpZ2h0VGV4dE9mU2VsZWN0aW9uT3JXb3JkQXRDdXJzb3IoKVxuICAgICAgICAgICAgICAgIEB2aWV3LmZvY3VzKClcbiAgICAgICAgICAgIEBidXR0b24uY2xhc3NOYW1lID0gXCJjb21tYW5kbGluZS1idXR0b24gYWN0aXZlICN7QGNvbW1hbmQucHJlZnNJRH1cIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBrZXJyb3IgXCJubyBjb21tYW5kICN7bmFtZX1cIlxuXG4gICAgY29tbWFuZEZvck5hbWU6IChuYW1lKSAtPlxuXG4gICAgICAgIGZvciBuLGMgb2YgQGNvbW1hbmRzXG4gICAgICAgICAgICBpZiBuID09IG5hbWUgb3IgbmFtZSBpbiBjLm5hbWVzXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNcblxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgZXhlY3V0ZTogLT4gQHJlc3VsdHMgQGNvbW1hbmQ/LmV4ZWN1dGUgQGxpbmUgMFxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcblxuICAgIHJlc3VsdHM6IChyKSAtPlxuXG4gICAgICAgIEBzZXROYW1lIHIubmFtZSBpZiByPy5uYW1lP1xuICAgICAgICBAc2V0VGV4dCByLnRleHQgaWYgcj8udGV4dD9cbiAgICAgICAgaWYgcj8uc2VsZWN0IHRoZW4gQHNlbGVjdEFsbCgpIGVsc2UgQHNlbGVjdE5vbmUoKVxuICAgICAgICB3aW5kb3cuc3BsaXQuc2hvdyAgIHIuc2hvdyAgIGlmIHI/LnNob3c/XG4gICAgICAgIHdpbmRvdy5zcGxpdC5mb2N1cyAgci5mb2N1cyAgaWYgcj8uZm9jdXM/XG4gICAgICAgIHdpbmRvdy5zcGxpdC5kbyAgICAgci5kbyAgICAgaWYgcj8uZG8/XG4gICAgICAgIEBcblxuICAgIGNhbmNlbDogLT4gQHJlc3VsdHMgQGNvbW1hbmQ/LmNhbmNlbCgpXG4gICAgY2xlYXI6ICAtPlxuICAgICAgICBpZiBAdGV4dCgpID09ICcnXG4gICAgICAgICAgICBAcmVzdWx0cyBAY29tbWFuZD8uY2xlYXIoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzdXBlci5jbGVhcigpXG5cbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwXG5cbiAgICBvbkNtbWRDbGljazogKGV2ZW50KSA9PlxuXG4gICAgICAgIGlmIG5vdCBAbGlzdD9cbiAgICAgICAgICAgIEBsaXN0ID0gZWxlbSBjbGFzczogJ2xpc3QgY29tbWFuZHMnXG4gICAgICAgICAgICBAcG9zaXRpb25MaXN0KClcbiAgICAgICAgICAgIHdpbmRvdy5zcGxpdC5lbGVtLmFwcGVuZENoaWxkIEBsaXN0XG4gICAgICAgIEBjb21tYW5kPy5oaWRlTGlzdD8oKVxuICAgICAgICBAbGlzdENvbW1hbmRzKClcbiAgICAgICAgQGZvY3VzKClcbiAgICAgICAgQHBvc2l0aW9uTGlzdCgpXG4gICAgICAgIHN0b3BFdmVudCBldmVudFxuXG4gICAgbGlzdENvbW1hbmRzOiAtPlxuXG4gICAgICAgIEBsaXN0LmlubmVySFRNTCA9IFwiXCJcbiAgICAgICAgQGxpc3Quc3R5bGUuZGlzcGxheSA9ICd1bnNldCdcbiAgICAgICAgZm9yIG5hbWUgaW4gQG1haW5Db21tYW5kc1xuICAgICAgICAgICAgY21tZCA9IEBjb21tYW5kc1tuYW1lXVxuICAgICAgICAgICAgZm9yIGNpIGluIFswLi4uY21tZC5uYW1lcy5sZW5ndGhdXG4gICAgICAgICAgICAgICAgY25hbWUgPSBjbW1kLm5hbWVzW2NpXVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlIGlmIGNuYW1lIGluIEBoaWRlQ29tbWFuZHNcbiAgICAgICAgICAgICAgICBkaXYgPSBlbGVtIGNsYXNzOiBcImxpc3QtaXRlbVwiXG4gICAgICAgICAgICAgICAgbmFtZXNwYW4gPSBcIjxzcGFuIGNsYXNzPVxcXCJrbyBjb21tYW5kICN7Y21tZC5wcmVmc0lEfVxcXCIgc3R5bGU9XFxcInBvc2l0aW9uOmFic29sdXRlOyBsZWZ0OiAje2NpID4gMCBhbmQgODAgb3IgMTJ9cHhcXFwiPiN7Y25hbWV9PC9zcGFuPlwiXG4gICAgICAgICAgICAgICAgZGl2LmlubmVySFRNTCA9IG5hbWVzcGFuXG4gICAgICAgICAgICAgICAgc3RhcnQgPSAobmFtZSkgPT4gKGV2ZW50KSA9PlxuICAgICAgICAgICAgICAgICAgICBAaGlkZUxpc3QoKVxuICAgICAgICAgICAgICAgICAgICBAc3RhcnRDb21tYW5kIG5hbWVcbiAgICAgICAgICAgICAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICAgICAgZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicsIHN0YXJ0IGNuYW1lXG4gICAgICAgICAgICAgICAgQGxpc3QuYXBwZW5kQ2hpbGQgZGl2XG5cbiAgICBoaWRlTGlzdDogLT5cblxuICAgICAgICBAbGlzdD8ucmVtb3ZlKClcbiAgICAgICAgQGxpc3QgPSBudWxsXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxuICAgIHBvc2l0aW9uTGlzdDogLT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IEBsaXN0P1xuICAgICAgICBsaXN0SGVpZ2h0ID0gQGxpc3QuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0XG4gICAgICAgIGZsZXggPSB3aW5kb3cuc3BsaXQuZmxleFxuICAgICAgICBsaXN0VG9wID0gZmxleC5wb3NPZlBhbmUgMlxuICAgICAgICBzcGFjZUJlbG93ID0gZmxleC5zaXplKCkgLSBsaXN0VG9wXG4gICAgICAgIHNwYWNlQWJvdmUgPSBmbGV4LnNpemVPZlBhbmUgMFxuICAgICAgICBpZiBzcGFjZUJlbG93IDwgbGlzdEhlaWdodCBhbmQgc3BhY2VBYm92ZSA+IHNwYWNlQmVsb3dcbiAgICAgICAgICAgIGxpc3RUb3AgPSBzcGFjZUFib3ZlIC0gbGlzdEhlaWdodFxuICAgICAgICBAbGlzdD8uc3R5bGUudG9wID0gXCIje2xpc3RUb3B9cHhcIlxuXG4gICAgcmVzaXplZDogLT5cblxuICAgICAgICBAbGlzdD8ucmVzaXplZD8oKVxuICAgICAgICBAY29tbWFuZD8uY29tbWFuZExpc3Q/LnJlc2l6ZWQoKVxuICAgICAgICBzdXBlcigpXG5cbiAgICBmb2N1c1Rlcm1pbmFsOiAtPlxuXG4gICAgICAgIGlmIHdpbmRvdy50ZXJtaW5hbC5udW1MaW5lcygpID09IDBcbiAgICAgICAgICAgIHdpbmRvdy50ZXJtaW5hbC5zaW5nbGVDdXJzb3JBdFBvcyBbMCwwXVxuICAgICAgICB3aW5kb3cuc3BsaXQuZG8gXCJmb2N1cyB0ZXJtaW5hbFwiXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwXG5cbiAgICBoYW5kbGVNZW51QWN0aW9uOiAobmFtZSwgYXJncykgLT5cblxuICAgICAgICBpZiBhcmdzPy5jb21tYW5kXG4gICAgICAgICAgICBpZiBAY29tbWFuZEZvck5hbWUgYXJncy5jb21tYW5kXG4gICAgICAgICAgICAgICAgQHN0YXJ0Q29tbWFuZCBhcmdzLmNvbW1hbmRcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgJ3VuaGFuZGxlZCdcblxuICAgIGdsb2JhbE1vZEtleUNvbWJvRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGV2ZW50KSAtPlxuXG4gICAgICAgIGlmIGNvbWJvID09ICdlc2MnXG4gICAgICAgICAgICBpZiBkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09IEB2aWV3XG4gICAgICAgICAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICAgICAgcmV0dXJuIEBjYW5jZWwoKVxuXG4gICAgICAgIGlmIEBjb21tYW5kP1xuICAgICAgICAgICAgcmV0dXJuIEBjb21tYW5kLmdsb2JhbE1vZEtleUNvbWJvRXZlbnQgbW9kLCBrZXksIGNvbWJvLCBldmVudFxuXG4gICAgICAgICd1bmhhbmRsZWQnXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0NoYXJFdmVudDogKG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnQpIC0+XG5cbiAgICAgICAgaWYgQGNvbW1hbmQ/XG4gICAgICAgICAgICByZXR1cm4gaWYgJ3VuaGFuZGxlZCcgIT0gQGNvbW1hbmQuaGFuZGxlTW9kS2V5Q29tYm9FdmVudCBtb2QsIGtleSwgY29tYm8sIGV2ZW50XG5cbiAgICAgICAgc3BsaXQgPSB3aW5kb3cuc3BsaXRcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdlbnRlcicgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQGV4ZWN1dGUoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtlbnRlcicgICAgICAgIHRoZW4gcmV0dXJuIEBleGVjdXRlKCkgKyB3aW5kb3cuc3BsaXQuZG8gXCJmb2N1cyAje0Bjb21tYW5kPy5mb2N1c31cIlxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtzaGlmdCtlbnRlcicgIHRoZW4gcmV0dXJuIEBmb2N1c1Rlcm1pbmFsKClcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAY29tbWFuZD8uc2VsZWN0TGlzdEl0ZW0gJ3VwJ1xuICAgICAgICAgICAgd2hlbiAnZG93bicgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBjb21tYW5kPy5zZWxlY3RMaXN0SXRlbSAnZG93bidcbiAgICAgICAgICAgIHdoZW4gJ2VzYycgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAY2FuY2VsKClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQraycgICAgICAgICAgICB0aGVuIHJldHVybiBAY2xlYXIoKVxuICAgICAgICAgICAgd2hlbiAnc2hpZnQrdGFiJyAgICAgICAgICAgIHRoZW4gcmV0dXJuXG4gICAgICAgICAgICB3aGVuICdob21lJyAnY29tbWFuZCt1cCcgICAgdGhlbiByZXR1cm4gc3BsaXQuZG8gJ21heGltaXplIGVkaXRvcidcbiAgICAgICAgICAgIHdoZW4gJ2VuZCcgJ2NvbW1hbmQrZG93bicgICB0aGVuIHJldHVybiBzcGxpdC5kbyAnbWluaW1pemUgZWRpdG9yJ1xuICAgICAgICAgICAgd2hlbiAnYWx0K3VwJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHNwbGl0LmRvICdlbmxhcmdlIGVkaXRvcidcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrdXAnICAgICAgICAgICAgICB0aGVuIHJldHVybiBzcGxpdC5kbyAnZW5sYXJnZSBlZGl0b3IgYnkgMjAnXG4gICAgICAgICAgICB3aGVuICdhbHQrZG93bicgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3BsaXQuZG8gJ3JlZHVjZSBlZGl0b3InXG4gICAgICAgICAgICB3aGVuICdjdHJsK2Rvd24nICAgICAgICAgICAgdGhlbiByZXR1cm4gc3BsaXQuZG8gJ3JlZHVjZSBlZGl0b3IgYnkgMjAnXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgJ3RhYicgICAgICAgICAgdGhlbiByZXR1cm4gaWYgQGNvbW1hbmQ/Lm9uVGFiQ29tcGxldGlvbiBjb21ib1xuXG4gICAgICAgIHJldHVybiBzdXBlciBtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tbWFuZGxpbmVcbiJdfQ==
//# sourceURL=../../coffee/commandline/commandline.coffee