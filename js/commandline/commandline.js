// koffee 1.19.0

/*
 0000000   0000000   00     00  00     00   0000000   000   000  0000000    000      000  000   000  00000000
000       000   000  000   000  000   000  000   000  0000  000  000   000  000      000  0000  000  000
000       000   000  000000000  000000000  000000000  000 0 000  000   000  000      000  000 0 000  0000000
000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  000      000  000  0000  000
 0000000   0000000   000   000  000   000  000   000  000   000  0000000    0000000  000  000   000  00000000
 */
var $, Commandline, TextEditor, elem, filelist, kerror, post, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = Object.hasOwn,
    indexOf = [].indexOf;

ref = require('kxk'), $ = ref.$, elem = ref.elem, filelist = ref.filelist, kerror = ref.kerror, post = ref.post, slash = ref.slash, stopEvent = ref.stopEvent;

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
        this.hideCommands = ['selecto', 'Browse', 'shelf'];
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
        return this.setAndSelectText(text);
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

    Commandline.prototype.handleMenuAction = function(name, opt) {
        if (opt != null ? opt.command : void 0) {
            if (this.commandForName(opt.command)) {
                this.startCommand(opt.command);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZGxpbmUuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2NvbW1hbmRsaW5lIiwic291cmNlcyI6WyJjb21tYW5kbGluZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsK0VBQUE7SUFBQTs7Ozs7QUFRQSxNQUF3RCxPQUFBLENBQVEsS0FBUixDQUF4RCxFQUFFLFNBQUYsRUFBSyxlQUFMLEVBQVcsdUJBQVgsRUFBcUIsbUJBQXJCLEVBQTZCLGVBQTdCLEVBQW1DLGlCQUFuQyxFQUEwQzs7QUFFMUMsVUFBQSxHQUFhLE9BQUEsQ0FBUSxzQkFBUjs7QUFFUDs7O0lBRUMscUJBQUMsUUFBRDs7Ozs7O1FBRUMsNkNBQU0sUUFBTixFQUFnQjtZQUFBLFFBQUEsRUFBVSxFQUFWO1lBQWMsUUFBQSxFQUFVLEVBQXhCO1lBQTRCLFVBQUEsRUFBVyxhQUF2QztTQUFoQjtRQUVBLElBQUMsQ0FBQSxZQUFELEdBQWdCLENBQUMsUUFBRCxFQUFVLE1BQVYsRUFBaUIsTUFBakIsRUFBd0IsUUFBeEIsRUFBaUMsTUFBakMsRUFBd0MsT0FBeEM7UUFDaEIsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsQ0FBQyxTQUFELEVBQVcsUUFBWCxFQUFvQixPQUFwQjtRQUVoQixJQUFDLENBQUEsSUFBSSxDQUFDLFVBQU4sR0FBbUI7UUFDbkIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxhQUFSLENBQXNCLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBNUI7UUFFQSxJQUFDLENBQUEsTUFBRCxHQUFTLENBQUEsQ0FBRSxvQkFBRjtRQUNULElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQWxCLENBQXNCLE9BQXRCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQkFBUixDQUF5QixXQUF6QixFQUFxQyxJQUFDLENBQUEsV0FBdEM7UUFFQSxJQUFDLENBQUEsUUFBRCxHQUFZO1FBQ1osSUFBQyxDQUFBLE9BQUQsR0FBVztRQUVYLElB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QUEsaUJBVWUsY0FWZjtBQVVxQyx1QkFBTyxLQUFLLEVBQUMsRUFBRCxFQUFMLENBQVMsaUJBQVQ7QUFWNUMsaUJBV1MsUUFYVDtBQVdxQyx1QkFBTyxLQUFLLEVBQUMsRUFBRCxFQUFMLENBQVMsZ0JBQVQ7QUFYNUMsaUJBWVMsU0FaVDtBQVlxQyx1QkFBTyxLQUFLLEVBQUMsRUFBRCxFQUFMLENBQVMsc0JBQVQ7QUFaNUMsaUJBYVMsVUFiVDtBQWFxQyx1QkFBTyxLQUFLLEVBQUMsRUFBRCxFQUFMLENBQVMsZUFBVDtBQWI1QyxpQkFjUyxXQWRUO0FBY3FDLHVCQUFPLEtBQUssRUFBQyxFQUFELEVBQUwsQ0FBUyxxQkFBVDtBQWQ1QyxpQkFlUyxPQWZUO0FBQUEsaUJBZWlCLEtBZmpCO2dCQWVxQyx3Q0FBa0IsQ0FBRSxlQUFWLENBQTBCLEtBQTFCLFVBQVY7QUFBQSwyQkFBQTs7QUFmckM7QUFpQkEsZUFBTyw0REFBTSxHQUFOLEVBQVcsR0FBWCxFQUFnQixLQUFoQixFQUF1QixJQUF2QixFQUE2QixLQUE3QjtJQXZCaUI7Ozs7R0FsVE47O0FBMlUxQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDBcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiMjI1xuXG57ICQsIGVsZW0sIGZpbGVsaXN0LCBrZXJyb3IsIHBvc3QsIHNsYXNoLCBzdG9wRXZlbnQgfSA9IHJlcXVpcmUgJ2t4aydcblxuVGV4dEVkaXRvciA9IHJlcXVpcmUgJy4uL2VkaXRvci90ZXh0ZWRpdG9yJ1xuXG5jbGFzcyBDb21tYW5kbGluZSBleHRlbmRzIFRleHRFZGl0b3JcblxuICAgIEA6ICh2aWV3RWxlbSkgLT5cblxuICAgICAgICBzdXBlciB2aWV3RWxlbSwgZmVhdHVyZXM6IFtdLCBmb250U2l6ZTogMjQsIHN5bnRheE5hbWU6J2NvbW1hbmRsaW5lJ1xuXG4gICAgICAgIEBtYWluQ29tbWFuZHMgPSBbJ2Jyb3dzZScgJ2dvdG8nICdvcGVuJyAnc2VhcmNoJyAnZmluZCcgJ21hY3JvJ11cbiAgICAgICAgQGhpZGVDb21tYW5kcyA9IFsnc2VsZWN0bycgJ0Jyb3dzZScgJ3NoZWxmJ11cblxuICAgICAgICBAc2l6ZS5saW5lSGVpZ2h0ID0gMzBcbiAgICAgICAgQHNjcm9sbC5zZXRMaW5lSGVpZ2h0IEBzaXplLmxpbmVIZWlnaHRcblxuICAgICAgICBAYnV0dG9uID0kICdjb21tYW5kbGluZS1idXR0b24nXG4gICAgICAgIEBidXR0b24uY2xhc3NMaXN0LmFkZCAnZW1wdHknXG4gICAgICAgIEBidXR0b24uYWRkRXZlbnRMaXN0ZW5lciAnbW91c2Vkb3duJyBAb25DbW1kQ2xpY2tcblxuICAgICAgICBAY29tbWFuZHMgPSB7fVxuICAgICAgICBAY29tbWFuZCA9IG51bGxcblxuICAgICAgICBAbG9hZENvbW1hbmRzKClcblxuICAgICAgICBwb3N0Lm9uICdzcGxpdCcgICAgICBAb25TcGxpdFxuICAgICAgICBwb3N0Lm9uICdyZXN0b3JlJyAgICBAcmVzdG9yZVxuICAgICAgICBwb3N0Lm9uICdzdGFzaCcgICAgICBAc3Rhc2hcbiAgICAgICAgcG9zdC5vbiAnc2VhcmNoVGV4dCcgQG9uU2VhcmNoVGV4dFxuXG4gICAgICAgIEB2aWV3Lm9uYmx1ciA9ID0+XG4gICAgICAgICAgICBAYnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUgJ2FjdGl2ZSdcbiAgICAgICAgICAgIEBsaXN0Py5yZW1vdmUoKVxuICAgICAgICAgICAgQGxpc3QgPSBudWxsXG4gICAgICAgICAgICBAY29tbWFuZD8ub25CbHVyKClcblxuICAgICAgICBAdmlldy5vbmZvY3VzID0gPT5cbiAgICAgICAgICAgIEBidXR0b24uY2xhc3NOYW1lID0gXCJjb21tYW5kbGluZS1idXR0b24gYWN0aXZlICN7QGNvbW1hbmQ/LnByZWZzSUR9XCJcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIG9uU2VhcmNoVGV4dDogKHRleHQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiB3aW5kb3cuc3BsaXQuY29tbWFuZGxpbmVWaXNpYmxlKClcbiAgICAgICAgICAgIGlmIEBjb21tYW5kPy5wcmVmc0lEIG5vdCBpbiBbJ3NlYXJjaCcgJ2ZpbmQnXVxuICAgICAgICAgICAgICAgIEBzdGFydENvbW1hbmQgJ2ZpbmQnIFxuICAgICAgICBAY29tbWFuZHMuZmluZC5jdXJyZW50VGV4dCA9IHRleHRcbiAgICAgICAgQGNvbW1hbmRzLnNlYXJjaC5jdXJyZW50VGV4dCA9IHRleHRcbiAgICAgICAgQHNldEFuZFNlbGVjdFRleHQgdGV4dFxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG4gICAgc3Rhc2g6ID0+XG5cbiAgICAgICAgaWYgQGNvbW1hbmQ/XG4gICAgICAgICAgICB3aW5kb3cuc3Rhc2guc2V0ICdjb21tYW5kbGluZScgQGNvbW1hbmQuc3RhdGUoKVxuXG4gICAgcmVzdG9yZTogPT5cblxuICAgICAgICBzdGF0ZSA9IHdpbmRvdy5zdGFzaC5nZXQgJ2NvbW1hbmRsaW5lJ1xuXG4gICAgICAgIEBzZXRUZXh0IHN0YXRlPy50ZXh0ID8gXCJcIlxuXG4gICAgICAgIG5hbWUgPSBzdGF0ZT8ubmFtZSA/ICdvcGVuJ1xuXG4gICAgICAgIGlmIEBjb21tYW5kID0gQGNvbW1hbmRGb3JOYW1lIG5hbWVcbiAgICAgICAgICAgIGFjdGl2ZUlEID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5pZFxuICAgICAgICAgICAgaWYgYWN0aXZlSUQuc3RhcnRzV2l0aCAnY29sdW1uJyB0aGVuIGFjdGl2ZUlEID0gJ2VkaXRvcidcbiAgICAgICAgICAgIEBjb21tYW5kLnNldFJlY2VpdmVyIGFjdGl2ZUlEICE9ICdjb21tYW5kbGluZS1lZGl0b3InIGFuZCBhY3RpdmVJRCBvciBudWxsXG4gICAgICAgICAgICBAc2V0TmFtZSBuYW1lXG4gICAgICAgICAgICBAYnV0dG9uLmNsYXNzTmFtZSA9IFwiY29tbWFuZGxpbmUtYnV0dG9uIGFjdGl2ZSAje0Bjb21tYW5kLnByZWZzSUR9XCJcbiAgICAgICAgICAgIEBjb21tYW5kc1tuYW1lXT8ucmVzdG9yZVN0YXRlPyBzdGF0ZVxuXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGxvYWRDb21tYW5kczogLT5cblxuICAgICAgICBmaWxlcyA9IGZpbGVsaXN0IFwiI3tfX2Rpcm5hbWV9Ly4uL2NvbW1hbmRzXCJcbiAgICAgICAgZm9yIGZpbGUgaW4gZmlsZXNcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIHNsYXNoLmV4dChmaWxlKSAhPSAnanMnXG4gICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAgICBjb21tYW5kQ2xhc3MgPSByZXF1aXJlIGZpbGVcbiAgICAgICAgICAgICAgICBjb21tYW5kID0gbmV3IGNvbW1hbmRDbGFzcyBAXG4gICAgICAgICAgICAgICAgY29tbWFuZC5zZXRQcmVmc0lEIGNvbW1hbmRDbGFzcy5uYW1lLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICBAY29tbWFuZHNbY29tbWFuZC5wcmVmc0lEXSA9IGNvbW1hbmRcbiAgICAgICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgICAgIGtlcnJvciBcImNhbid0IGxvYWQgY29tbWFuZCBmcm9tIGZpbGUgJyN7ZmlsZX0nOiAje2Vycn1cIlxuXG4gICAgc2V0TmFtZTogKG5hbWUpIC0+XG5cbiAgICAgICAgQGJ1dHRvbi5pbm5lckhUTUwgPSBuYW1lXG4gICAgICAgIEBsYXllcnMuc3R5bGUud2lkdGggPSBAdmlldy5zdHlsZS53aWR0aFxuXG4gICAgc2V0TGluZXM6IChsKSAtPlxuXG4gICAgICAgIEBzY3JvbGwucmVzZXQoKVxuICAgICAgICBzdXBlciBsXG5cbiAgICBzZXRBbmRTZWxlY3RUZXh0OiAodCkgLT5cblxuICAgICAgICBAc2V0TGluZXMgW3QgPyAnJ11cbiAgICAgICAgQHNlbGVjdEFsbCgpXG4gICAgICAgIEBzZWxlY3RTaW5nbGVSYW5nZSBAcmFuZ2VGb3JMaW5lQXRJbmRleCAwXG5cbiAgICBzZXRUZXh0OiAodCkgLT5cblxuICAgICAgICBAc2V0TGluZXMgW3QgPyAnJ11cbiAgICAgICAgQHNpbmdsZUN1cnNvckF0UG9zIFtAbGluZSgwKS5sZW5ndGgsIDBdXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgY2hhbmdlZDogKGNoYW5nZUluZm8pIC0+XG5cbiAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgc3VwZXIgY2hhbmdlSW5mb1xuICAgICAgICBpZiBjaGFuZ2VJbmZvLmNoYW5nZXMubGVuZ3RoXG4gICAgICAgICAgICBAYnV0dG9uLmNsYXNzTmFtZSA9IFwiY29tbWFuZGxpbmUtYnV0dG9uIGFjdGl2ZSAje0Bjb21tYW5kPy5wcmVmc0lEfVwiXG4gICAgICAgICAgICBAY29tbWFuZD8uY2hhbmdlZCBAbGluZSgwKVxuXG4gICAgb25TcGxpdDogKHMpID0+XG5cbiAgICAgICAgQGNvbW1hbmQ/Lm9uQm90PyBzWzFdXG4gICAgICAgIEBwb3NpdGlvbkxpc3QoKVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbiAgICBzdGFydENvbW1hbmQ6IChuYW1lKSAtPlxuXG4gICAgICAgIHIgPSBAY29tbWFuZD8uY2FuY2VsIG5hbWVcblxuICAgICAgICBpZiByPy5zdGF0dXMgPT0gJ29rJ1xuICAgICAgICAgICAgQHJlc3VsdHMgclxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgd2luZG93LnNwbGl0LnNob3dDb21tYW5kbGluZSgpXG5cbiAgICAgICAgaWYgQGNvbW1hbmQgPSBAY29tbWFuZEZvck5hbWUgbmFtZVxuXG4gICAgICAgICAgICBhY3RpdmVJRCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuaWRcbiAgICAgICAgICAgIGlmIGFjdGl2ZUlELnN0YXJ0c1dpdGggJ2NvbHVtbicgdGhlbiBhY3RpdmVJRCA9ICdlZGl0b3InXG4gICAgICAgICAgICBpZiBhY3RpdmVJRCBhbmQgYWN0aXZlSUQgIT0gJ2NvbW1hbmRsaW5lLWVkaXRvcidcbiAgICAgICAgICAgICAgICBAY29tbWFuZC5zZXRSZWNlaXZlciBhY3RpdmVJRFxuXG4gICAgICAgICAgICBAbGFzdEZvY3VzID0gd2luZG93Lmxhc3RGb2N1c1xuICAgICAgICAgICAgQHZpZXcuZm9jdXMoKVxuICAgICAgICAgICAgQHNldE5hbWUgbmFtZVxuICAgICAgICAgICAgQHJlc3VsdHMgQGNvbW1hbmQuc3RhcnQgbmFtZSAjIDwtLSBjb21tYW5kIHN0YXJ0XG5cbiAgICAgICAgICAgIGlmIG5hbWUgaW4gWydzZWFyY2gnICdmaW5kJ11cbiAgICAgICAgICAgICAgICB3aW5kb3cudGV4dEVkaXRvci5oaWdobGlnaHRUZXh0T2ZTZWxlY3Rpb25PcldvcmRBdEN1cnNvcigpXG4gICAgICAgICAgICAgICAgQHZpZXcuZm9jdXMoKVxuICAgICAgICAgICAgQGJ1dHRvbi5jbGFzc05hbWUgPSBcImNvbW1hbmRsaW5lLWJ1dHRvbiBhY3RpdmUgI3tAY29tbWFuZC5wcmVmc0lEfVwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGtlcnJvciBcIm5vIGNvbW1hbmQgI3tuYW1lfVwiXG5cbiAgICBjb21tYW5kRm9yTmFtZTogKG5hbWUpIC0+XG5cbiAgICAgICAgZm9yIG4sYyBvZiBAY29tbWFuZHNcbiAgICAgICAgICAgIGlmIG4gPT0gbmFtZSBvciBuYW1lIGluIGMubmFtZXNcbiAgICAgICAgICAgICAgICByZXR1cm4gY1xuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBleGVjdXRlOiAtPiBAcmVzdWx0cyBAY29tbWFuZD8uZXhlY3V0ZSBAbGluZSAwXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuXG4gICAgcmVzdWx0czogKHIpIC0+XG5cbiAgICAgICAgQHNldE5hbWUgci5uYW1lIGlmIHI/Lm5hbWU/XG4gICAgICAgIEBzZXRUZXh0IHIudGV4dCBpZiByPy50ZXh0P1xuICAgICAgICBpZiByPy5zZWxlY3QgdGhlbiBAc2VsZWN0QWxsKCkgZWxzZSBAc2VsZWN0Tm9uZSgpXG4gICAgICAgIHdpbmRvdy5zcGxpdC5zaG93ICAgci5zaG93ICAgaWYgcj8uc2hvdz9cbiAgICAgICAgd2luZG93LnNwbGl0LmZvY3VzICByLmZvY3VzICBpZiByPy5mb2N1cz9cbiAgICAgICAgd2luZG93LnNwbGl0LmRvICAgICByLmRvICAgICBpZiByPy5kbz9cbiAgICAgICAgQFxuXG4gICAgY2FuY2VsOiAtPiBAcmVzdWx0cyBAY29tbWFuZD8uY2FuY2VsKClcbiAgICBjbGVhcjogIC0+XG4gICAgICAgIGlmIEB0ZXh0KCkgPT0gJydcbiAgICAgICAgICAgIEByZXN1bHRzIEBjb21tYW5kPy5jbGVhcigpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHN1cGVyLmNsZWFyKClcblxuICAgICMgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDBcblxuICAgIG9uQ21tZENsaWNrOiAoZXZlbnQpID0+XG5cbiAgICAgICAgaWYgbm90IEBsaXN0P1xuICAgICAgICAgICAgQGxpc3QgPSBlbGVtIGNsYXNzOiAnbGlzdCBjb21tYW5kcydcbiAgICAgICAgICAgIEBwb3NpdGlvbkxpc3QoKVxuICAgICAgICAgICAgd2luZG93LnNwbGl0LmVsZW0uYXBwZW5kQ2hpbGQgQGxpc3RcbiAgICAgICAgQGNvbW1hbmQ/LmhpZGVMaXN0PygpXG4gICAgICAgIEBsaXN0Q29tbWFuZHMoKVxuICAgICAgICBAZm9jdXMoKVxuICAgICAgICBAcG9zaXRpb25MaXN0KClcbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG5cbiAgICBsaXN0Q29tbWFuZHM6IC0+XG5cbiAgICAgICAgQGxpc3QuaW5uZXJIVE1MID0gXCJcIlxuICAgICAgICBAbGlzdC5zdHlsZS5kaXNwbGF5ID0gJ3Vuc2V0J1xuICAgICAgICBmb3IgbmFtZSBpbiBAbWFpbkNvbW1hbmRzXG4gICAgICAgICAgICBjbW1kID0gQGNvbW1hbmRzW25hbWVdXG4gICAgICAgICAgICBmb3IgY2kgaW4gWzAuLi5jbW1kLm5hbWVzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICBjbmFtZSA9IGNtbWQubmFtZXNbY2ldXG4gICAgICAgICAgICAgICAgY29udGludWUgaWYgY25hbWUgaW4gQGhpZGVDb21tYW5kc1xuICAgICAgICAgICAgICAgIGRpdiA9IGVsZW0gY2xhc3M6IFwibGlzdC1pdGVtXCJcbiAgICAgICAgICAgICAgICBuYW1lc3BhbiA9IFwiPHNwYW4gY2xhc3M9XFxcImtvIGNvbW1hbmQgI3tjbW1kLnByZWZzSUR9XFxcIiBzdHlsZT1cXFwicG9zaXRpb246YWJzb2x1dGU7IGxlZnQ6ICN7Y2kgPiAwIGFuZCA4MCBvciAxMn1weFxcXCI+I3tjbmFtZX08L3NwYW4+XCJcbiAgICAgICAgICAgICAgICBkaXYuaW5uZXJIVE1MID0gbmFtZXNwYW5cbiAgICAgICAgICAgICAgICBzdGFydCA9IChuYW1lKSA9PiAoZXZlbnQpID0+XG4gICAgICAgICAgICAgICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgICAgICAgICAgICAgIEBzdGFydENvbW1hbmQgbmFtZVxuICAgICAgICAgICAgICAgICAgICBzdG9wRXZlbnQgZXZlbnRcbiAgICAgICAgICAgICAgICBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2Vkb3duJyBzdGFydCBjbmFtZVxuICAgICAgICAgICAgICAgIEBsaXN0LmFwcGVuZENoaWxkIGRpdlxuXG4gICAgaGlkZUxpc3Q6IC0+XG5cbiAgICAgICAgQGxpc3Q/LnJlbW92ZSgpXG4gICAgICAgIEBsaXN0ID0gbnVsbFxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbiAgICBwb3NpdGlvbkxpc3Q6IC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbGlzdD9cbiAgICAgICAgbGlzdEhlaWdodCA9IEBsaXN0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodFxuICAgICAgICBmbGV4ID0gd2luZG93LnNwbGl0LmZsZXhcbiAgICAgICAgbGlzdFRvcCA9IGZsZXgucG9zT2ZQYW5lIDJcbiAgICAgICAgc3BhY2VCZWxvdyA9IGZsZXguc2l6ZSgpIC0gbGlzdFRvcFxuICAgICAgICBzcGFjZUFib3ZlID0gZmxleC5zaXplT2ZQYW5lIDBcbiAgICAgICAgaWYgc3BhY2VCZWxvdyA8IGxpc3RIZWlnaHQgYW5kIHNwYWNlQWJvdmUgPiBzcGFjZUJlbG93XG4gICAgICAgICAgICBsaXN0VG9wID0gc3BhY2VBYm92ZSAtIGxpc3RIZWlnaHRcbiAgICAgICAgQGxpc3Q/LnN0eWxlLnRvcCA9IFwiI3tsaXN0VG9wfXB4XCJcblxuICAgIHJlc2l6ZWQ6IC0+XG5cbiAgICAgICAgQGxpc3Q/LnJlc2l6ZWQ/KClcbiAgICAgICAgQGNvbW1hbmQ/LmNvbW1hbmRMaXN0Py5yZXNpemVkKClcbiAgICAgICAgc3VwZXIoKVxuXG4gICAgZm9jdXNUZXJtaW5hbDogLT5cblxuICAgICAgICBpZiB3aW5kb3cudGVybWluYWwubnVtTGluZXMoKSA9PSAwXG4gICAgICAgICAgICB3aW5kb3cudGVybWluYWwuc2luZ2xlQ3Vyc29yQXRQb3MgWzAsMF1cbiAgICAgICAgd2luZG93LnNwbGl0LmRvIFwiZm9jdXMgdGVybWluYWxcIlxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMFxuXG4gICAgaGFuZGxlTWVudUFjdGlvbjogKG5hbWUsIG9wdCkgLT5cblxuICAgICAgICBpZiBvcHQ/LmNvbW1hbmRcbiAgICAgICAgICAgIGlmIEBjb21tYW5kRm9yTmFtZSBvcHQuY29tbWFuZFxuICAgICAgICAgICAgICAgIEBzdGFydENvbW1hbmQgb3B0LmNvbW1hbmRcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgJ3VuaGFuZGxlZCdcblxuICAgIGdsb2JhbE1vZEtleUNvbWJvRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGV2ZW50KSAtPlxuXG4gICAgICAgIGlmIGNvbWJvID09ICdlc2MnXG4gICAgICAgICAgICBpZiBkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09IEB2aWV3XG4gICAgICAgICAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICAgICAgcmV0dXJuIEBjYW5jZWwoKVxuXG4gICAgICAgIGlmIEBjb21tYW5kP1xuICAgICAgICAgICAgcmV0dXJuIEBjb21tYW5kLmdsb2JhbE1vZEtleUNvbWJvRXZlbnQgbW9kLCBrZXksIGNvbWJvLCBldmVudFxuXG4gICAgICAgICd1bmhhbmRsZWQnXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0NoYXJFdmVudDogKG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnQpIC0+XG5cbiAgICAgICAgaWYgQGNvbW1hbmQ/XG4gICAgICAgICAgICByZXR1cm4gaWYgJ3VuaGFuZGxlZCcgIT0gQGNvbW1hbmQuaGFuZGxlTW9kS2V5Q29tYm9FdmVudCBtb2QsIGtleSwgY29tYm8sIGV2ZW50XG5cbiAgICAgICAgc3BsaXQgPSB3aW5kb3cuc3BsaXRcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdlbnRlcicgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQGV4ZWN1dGUoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtlbnRlcicgICAgICAgIHRoZW4gcmV0dXJuIEBleGVjdXRlKCkgKyB3aW5kb3cuc3BsaXQuZG8gXCJmb2N1cyAje0Bjb21tYW5kPy5mb2N1c31cIlxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtzaGlmdCtlbnRlcicgIHRoZW4gcmV0dXJuIEBmb2N1c1Rlcm1pbmFsKClcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAY29tbWFuZD8uc2VsZWN0TGlzdEl0ZW0gJ3VwJ1xuICAgICAgICAgICAgd2hlbiAnZG93bicgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBjb21tYW5kPy5zZWxlY3RMaXN0SXRlbSAnZG93bidcbiAgICAgICAgICAgIHdoZW4gJ2VzYycgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAY2FuY2VsKClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQraycgICAgICAgICAgICB0aGVuIHJldHVybiBAY2xlYXIoKVxuICAgICAgICAgICAgd2hlbiAnc2hpZnQrdGFiJyAgICAgICAgICAgIHRoZW4gcmV0dXJuXG4gICAgICAgICAgICB3aGVuICdob21lJyAnY29tbWFuZCt1cCcgICAgdGhlbiByZXR1cm4gc3BsaXQuZG8gJ21heGltaXplIGVkaXRvcidcbiAgICAgICAgICAgIHdoZW4gJ2VuZCcgJ2NvbW1hbmQrZG93bicgICB0aGVuIHJldHVybiBzcGxpdC5kbyAnbWluaW1pemUgZWRpdG9yJ1xuICAgICAgICAgICAgd2hlbiAnYWx0K3VwJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHNwbGl0LmRvICdlbmxhcmdlIGVkaXRvcidcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrdXAnICAgICAgICAgICAgICB0aGVuIHJldHVybiBzcGxpdC5kbyAnZW5sYXJnZSBlZGl0b3IgYnkgMjAnXG4gICAgICAgICAgICB3aGVuICdhbHQrZG93bicgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3BsaXQuZG8gJ3JlZHVjZSBlZGl0b3InXG4gICAgICAgICAgICB3aGVuICdjdHJsK2Rvd24nICAgICAgICAgICAgdGhlbiByZXR1cm4gc3BsaXQuZG8gJ3JlZHVjZSBlZGl0b3IgYnkgMjAnXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgJ3RhYicgICAgICAgICAgdGhlbiByZXR1cm4gaWYgQGNvbW1hbmQ/Lm9uVGFiQ29tcGxldGlvbiBjb21ib1xuXG4gICAgICAgIHJldHVybiBzdXBlciBtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tbWFuZGxpbmVcbiJdfQ==
//# sourceURL=../../coffee/commandline/commandline.coffee