// koffee 1.7.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZGxpbmUuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHFGQUFBO0lBQUE7Ozs7O0FBUUEsTUFBOEQsT0FBQSxDQUFRLEtBQVIsQ0FBOUQsRUFBRSxTQUFGLEVBQUssZUFBTCxFQUFXLGVBQVgsRUFBaUIsdUJBQWpCLEVBQTJCLG1CQUEzQixFQUFtQyxlQUFuQyxFQUF5QyxpQkFBekMsRUFBZ0Q7O0FBRWhELFVBQUEsR0FBYSxPQUFBLENBQVEsc0JBQVI7O0FBRVA7OztJQUVDLHFCQUFDLFFBQUQ7Ozs7O1FBRUMsNkNBQU0sUUFBTixFQUFnQjtZQUFBLFFBQUEsRUFBVSxFQUFWO1lBQWMsUUFBQSxFQUFVLEVBQXhCO1lBQTRCLFVBQUEsRUFBVyxhQUF2QztTQUFoQjtRQUVBLElBQUMsQ0FBQSxZQUFELEdBQWdCLENBQUMsUUFBRCxFQUFVLE1BQVYsRUFBaUIsTUFBakIsRUFBd0IsUUFBeEIsRUFBaUMsTUFBakMsRUFBd0MsT0FBeEM7UUFDaEIsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsQ0FBQyxTQUFELEVBQVcsUUFBWDtRQUVoQixJQUFDLENBQUEsSUFBSSxDQUFDLFVBQU4sR0FBbUI7UUFDbkIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxhQUFSLENBQXNCLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBNUI7UUFFQSxJQUFDLENBQUEsTUFBRCxHQUFTLENBQUEsQ0FBRSxvQkFBRjtRQUNULElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQWxCLENBQXNCLE9BQXRCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQkFBUixDQUF5QixXQUF6QixFQUFxQyxJQUFDLENBQUEsV0FBdEM7UUFFQSxJQUFDLENBQUEsUUFBRCxHQUFZO1FBQ1osSUFBQyxDQUFBLE9BQUQsR0FBVztRQUVYLElBQUMsQ0FBQSxZQUFELENBQUE7UUFFQSxJQUFJLENBQUMsRUFBTCxDQUFR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MCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMFxuIyMjXG5cbnsgJCwgYXJncywgZWxlbSwgZmlsZWxpc3QsIGtlcnJvciwgcG9zdCwgc2xhc2gsIHN0b3BFdmVudCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5UZXh0RWRpdG9yID0gcmVxdWlyZSAnLi4vZWRpdG9yL3RleHRlZGl0b3InXG5cbmNsYXNzIENvbW1hbmRsaW5lIGV4dGVuZHMgVGV4dEVkaXRvclxuXG4gICAgQDogKHZpZXdFbGVtKSAtPlxuXG4gICAgICAgIHN1cGVyIHZpZXdFbGVtLCBmZWF0dXJlczogW10sIGZvbnRTaXplOiAyNCwgc3ludGF4TmFtZTonY29tbWFuZGxpbmUnXG5cbiAgICAgICAgQG1haW5Db21tYW5kcyA9IFsnYnJvd3NlJyAnZ290bycgJ29wZW4nICdzZWFyY2gnICdmaW5kJyAnbWFjcm8nXVxuICAgICAgICBAaGlkZUNvbW1hbmRzID0gWydzZWxlY3RvJyAnQnJvd3NlJ11cblxuICAgICAgICBAc2l6ZS5saW5lSGVpZ2h0ID0gMzBcbiAgICAgICAgQHNjcm9sbC5zZXRMaW5lSGVpZ2h0IEBzaXplLmxpbmVIZWlnaHRcblxuICAgICAgICBAYnV0dG9uID0kICdjb21tYW5kbGluZS1idXR0b24nXG4gICAgICAgIEBidXR0b24uY2xhc3NMaXN0LmFkZCAnZW1wdHknXG4gICAgICAgIEBidXR0b24uYWRkRXZlbnRMaXN0ZW5lciAnbW91c2Vkb3duJyBAb25DbW1kQ2xpY2tcblxuICAgICAgICBAY29tbWFuZHMgPSB7fVxuICAgICAgICBAY29tbWFuZCA9IG51bGxcblxuICAgICAgICBAbG9hZENvbW1hbmRzKClcblxuICAgICAgICBwb3N0Lm9uICdzcGxpdCcgICBAb25TcGxpdFxuICAgICAgICBwb3N0Lm9uICdyZXN0b3JlJyBAcmVzdG9yZVxuICAgICAgICBwb3N0Lm9uICdzdGFzaCcgICBAc3Rhc2hcblxuICAgICAgICBAdmlldy5vbmJsdXIgPSA9PlxuICAgICAgICAgICAgQGJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlICdhY3RpdmUnXG4gICAgICAgICAgICBAbGlzdD8ucmVtb3ZlKClcbiAgICAgICAgICAgIEBsaXN0ID0gbnVsbFxuICAgICAgICAgICAgQGNvbW1hbmQ/Lm9uQmx1cigpXG5cbiAgICAgICAgQHZpZXcub25mb2N1cyA9ID0+XG4gICAgICAgICAgICBAYnV0dG9uLmNsYXNzTmFtZSA9IFwiY29tbWFuZGxpbmUtYnV0dG9uIGFjdGl2ZSAje0Bjb21tYW5kPy5wcmVmc0lEfVwiXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbiAgICBzdGFzaDogPT5cblxuICAgICAgICBpZiBAY29tbWFuZD9cbiAgICAgICAgICAgIHdpbmRvdy5zdGFzaC5zZXQgJ2NvbW1hbmRsaW5lJyBAY29tbWFuZC5zdGF0ZSgpXG5cbiAgICByZXN0b3JlOiA9PlxuXG4gICAgICAgIHN0YXRlID0gd2luZG93LnN0YXNoLmdldCAnY29tbWFuZGxpbmUnXG5cbiAgICAgICAgQHNldFRleHQgc3RhdGU/LnRleHQgPyBcIlwiXG5cbiAgICAgICAgbmFtZSA9IHN0YXRlPy5uYW1lID8gJ29wZW4nXG5cbiAgICAgICAgaWYgQGNvbW1hbmQgPSBAY29tbWFuZEZvck5hbWUgbmFtZVxuICAgICAgICAgICAgYWN0aXZlSUQgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmlkXG4gICAgICAgICAgICBpZiBhY3RpdmVJRC5zdGFydHNXaXRoICdjb2x1bW4nIHRoZW4gYWN0aXZlSUQgPSAnZWRpdG9yJ1xuICAgICAgICAgICAgQGNvbW1hbmQuc2V0UmVjZWl2ZXIgYWN0aXZlSUQgIT0gJ2NvbW1hbmRsaW5lLWVkaXRvcicgYW5kIGFjdGl2ZUlEIG9yIG51bGxcbiAgICAgICAgICAgIEBzZXROYW1lIG5hbWVcbiAgICAgICAgICAgIEBidXR0b24uY2xhc3NOYW1lID0gXCJjb21tYW5kbGluZS1idXR0b24gYWN0aXZlICN7QGNvbW1hbmQucHJlZnNJRH1cIlxuICAgICAgICAgICAgQGNvbW1hbmRzW25hbWVdPy5yZXN0b3JlU3RhdGU/IHN0YXRlXG5cbiAgICAjIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgbG9hZENvbW1hbmRzOiAtPlxuXG4gICAgICAgIGZpbGVzID0gZmlsZWxpc3QgXCIje19fZGlybmFtZX0vLi4vY29tbWFuZHNcIlxuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlc1xuICAgICAgICAgICAgY29udGludWUgaWYgc2xhc2guZXh0KGZpbGUpICE9ICdqcydcbiAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICAgIGNvbW1hbmRDbGFzcyA9IHJlcXVpcmUgZmlsZVxuICAgICAgICAgICAgICAgIGNvbW1hbmQgPSBuZXcgY29tbWFuZENsYXNzIEBcbiAgICAgICAgICAgICAgICBjb21tYW5kLnNldFByZWZzSUQgY29tbWFuZENsYXNzLm5hbWUudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgIEBjb21tYW5kc1tjb21tYW5kLnByZWZzSURdID0gY29tbWFuZFxuICAgICAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICAgICAga2Vycm9yIFwiY2FuJ3QgbG9hZCBjb21tYW5kIGZyb20gZmlsZSAnI3tmaWxlfSc6ICN7ZXJyfVwiXG5cbiAgICBzZXROYW1lOiAobmFtZSkgLT5cblxuICAgICAgICBAYnV0dG9uLmlubmVySFRNTCA9IG5hbWVcbiAgICAgICAgQGxheWVycy5zdHlsZS53aWR0aCA9IEB2aWV3LnN0eWxlLndpZHRoXG5cbiAgICBzZXRMaW5lczogKGwpIC0+XG5cbiAgICAgICAgQHNjcm9sbC5yZXNldCgpXG4gICAgICAgIHN1cGVyIGxcblxuICAgIHNldEFuZFNlbGVjdFRleHQ6ICh0KSAtPlxuXG4gICAgICAgIEBzZXRMaW5lcyBbdCA/ICcnXVxuICAgICAgICBAc2VsZWN0QWxsKClcbiAgICAgICAgQHNlbGVjdFNpbmdsZVJhbmdlIEByYW5nZUZvckxpbmVBdEluZGV4IDBcblxuICAgIHNldFRleHQ6ICh0KSAtPlxuXG4gICAgICAgIEBzZXRMaW5lcyBbdCA/ICcnXVxuICAgICAgICBAc2luZ2xlQ3Vyc29yQXRQb3MgW0BsaW5lKDApLmxlbmd0aCwgMF1cblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBjaGFuZ2VkOiAoY2hhbmdlSW5mbykgLT5cblxuICAgICAgICBAaGlkZUxpc3QoKVxuICAgICAgICBzdXBlciBjaGFuZ2VJbmZvXG4gICAgICAgIGlmIGNoYW5nZUluZm8uY2hhbmdlcy5sZW5ndGhcbiAgICAgICAgICAgIEBidXR0b24uY2xhc3NOYW1lID0gXCJjb21tYW5kbGluZS1idXR0b24gYWN0aXZlICN7QGNvbW1hbmQ/LnByZWZzSUR9XCJcbiAgICAgICAgICAgIEBjb21tYW5kPy5jaGFuZ2VkIEBsaW5lKDApXG5cbiAgICBvblNwbGl0OiAocykgPT5cblxuICAgICAgICBAY29tbWFuZD8ub25Cb3Q/IHNbMV1cbiAgICAgICAgQHBvc2l0aW9uTGlzdCgpXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIHN0YXJ0Q29tbWFuZDogKG5hbWUpIC0+XG5cbiAgICAgICAgciA9IEBjb21tYW5kPy5jYW5jZWwgbmFtZVxuXG4gICAgICAgIGlmIHI/LnN0YXR1cyA9PSAnb2snXG4gICAgICAgICAgICBAcmVzdWx0cyByXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICB3aW5kb3cuc3BsaXQuc2hvd0NvbW1hbmRsaW5lKClcblxuICAgICAgICBpZiBAY29tbWFuZCA9IEBjb21tYW5kRm9yTmFtZSBuYW1lXG5cbiAgICAgICAgICAgIGFjdGl2ZUlEID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5pZFxuICAgICAgICAgICAgaWYgYWN0aXZlSUQuc3RhcnRzV2l0aCAnY29sdW1uJyB0aGVuIGFjdGl2ZUlEID0gJ2VkaXRvcidcbiAgICAgICAgICAgIGlmIGFjdGl2ZUlEIGFuZCBhY3RpdmVJRCAhPSAnY29tbWFuZGxpbmUtZWRpdG9yJ1xuICAgICAgICAgICAgICAgIEBjb21tYW5kLnNldFJlY2VpdmVyIGFjdGl2ZUlEXG5cbiAgICAgICAgICAgIEBsYXN0Rm9jdXMgPSB3aW5kb3cubGFzdEZvY3VzXG4gICAgICAgICAgICBAdmlldy5mb2N1cygpXG4gICAgICAgICAgICBAc2V0TmFtZSBuYW1lXG4gICAgICAgICAgICBAcmVzdWx0cyBAY29tbWFuZC5zdGFydCBuYW1lICMgPC0tIGNvbW1hbmQgc3RhcnRcblxuICAgICAgICAgICAgQGJ1dHRvbi5jbGFzc05hbWUgPSBcImNvbW1hbmRsaW5lLWJ1dHRvbiBhY3RpdmUgI3tAY29tbWFuZC5wcmVmc0lEfVwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGtlcnJvciBcIm5vIGNvbW1hbmQgI3tuYW1lfVwiXG5cbiAgICBjb21tYW5kRm9yTmFtZTogKG5hbWUpIC0+XG5cbiAgICAgICAgZm9yIG4sYyBvZiBAY29tbWFuZHNcbiAgICAgICAgICAgIGlmIG4gPT0gbmFtZSBvciBuYW1lIGluIGMubmFtZXNcbiAgICAgICAgICAgICAgICByZXR1cm4gY1xuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBleGVjdXRlOiAtPiBAcmVzdWx0cyBAY29tbWFuZD8uZXhlY3V0ZSBAbGluZSAwXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuXG4gICAgcmVzdWx0czogKHIpIC0+XG5cbiAgICAgICAgQHNldE5hbWUgci5uYW1lIGlmIHI/Lm5hbWU/XG4gICAgICAgIEBzZXRUZXh0IHIudGV4dCBpZiByPy50ZXh0P1xuICAgICAgICBpZiByPy5zZWxlY3QgdGhlbiBAc2VsZWN0QWxsKCkgZWxzZSBAc2VsZWN0Tm9uZSgpXG4gICAgICAgIHdpbmRvdy5zcGxpdC5zaG93ICAgci5zaG93ICAgaWYgcj8uc2hvdz9cbiAgICAgICAgd2luZG93LnNwbGl0LmZvY3VzICByLmZvY3VzICBpZiByPy5mb2N1cz9cbiAgICAgICAgd2luZG93LnNwbGl0LmRvICAgICByLmRvICAgICBpZiByPy5kbz9cbiAgICAgICAgQFxuXG4gICAgY2FuY2VsOiAtPiBAcmVzdWx0cyBAY29tbWFuZD8uY2FuY2VsKClcbiAgICBjbGVhcjogIC0+XG4gICAgICAgIGlmIEB0ZXh0KCkgPT0gJydcbiAgICAgICAgICAgIEByZXN1bHRzIEBjb21tYW5kPy5jbGVhcigpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHN1cGVyLmNsZWFyKClcblxuICAgICMgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDBcblxuICAgIG9uQ21tZENsaWNrOiAoZXZlbnQpID0+XG5cbiAgICAgICAgaWYgbm90IEBsaXN0P1xuICAgICAgICAgICAgQGxpc3QgPSBlbGVtIGNsYXNzOiAnbGlzdCBjb21tYW5kcydcbiAgICAgICAgICAgIEBwb3NpdGlvbkxpc3QoKVxuICAgICAgICAgICAgd2luZG93LnNwbGl0LmVsZW0uYXBwZW5kQ2hpbGQgQGxpc3RcbiAgICAgICAgQGNvbW1hbmQ/LmhpZGVMaXN0PygpXG4gICAgICAgIEBsaXN0Q29tbWFuZHMoKVxuICAgICAgICBAZm9jdXMoKVxuICAgICAgICBAcG9zaXRpb25MaXN0KClcbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG5cbiAgICBsaXN0Q29tbWFuZHM6IC0+XG5cbiAgICAgICAgQGxpc3QuaW5uZXJIVE1MID0gXCJcIlxuICAgICAgICBAbGlzdC5zdHlsZS5kaXNwbGF5ID0gJ3Vuc2V0J1xuICAgICAgICBmb3IgbmFtZSBpbiBAbWFpbkNvbW1hbmRzXG4gICAgICAgICAgICBjbW1kID0gQGNvbW1hbmRzW25hbWVdXG4gICAgICAgICAgICBmb3IgY2kgaW4gWzAuLi5jbW1kLm5hbWVzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICBjbmFtZSA9IGNtbWQubmFtZXNbY2ldXG4gICAgICAgICAgICAgICAgY29udGludWUgaWYgY25hbWUgaW4gQGhpZGVDb21tYW5kc1xuICAgICAgICAgICAgICAgIGRpdiA9IGVsZW0gY2xhc3M6IFwibGlzdC1pdGVtXCJcbiAgICAgICAgICAgICAgICBuYW1lc3BhbiA9IFwiPHNwYW4gY2xhc3M9XFxcImtvIGNvbW1hbmQgI3tjbW1kLnByZWZzSUR9XFxcIiBzdHlsZT1cXFwicG9zaXRpb246YWJzb2x1dGU7IGxlZnQ6ICN7Y2kgPiAwIGFuZCA4MCBvciAxMn1weFxcXCI+I3tjbmFtZX08L3NwYW4+XCJcbiAgICAgICAgICAgICAgICBkaXYuaW5uZXJIVE1MID0gbmFtZXNwYW5cbiAgICAgICAgICAgICAgICBzdGFydCA9IChuYW1lKSA9PiAoZXZlbnQpID0+XG4gICAgICAgICAgICAgICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgICAgICAgICAgICAgIEBzdGFydENvbW1hbmQgbmFtZVxuICAgICAgICAgICAgICAgICAgICBzdG9wRXZlbnQgZXZlbnRcbiAgICAgICAgICAgICAgICBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2Vkb3duJywgc3RhcnQgY25hbWVcbiAgICAgICAgICAgICAgICBAbGlzdC5hcHBlbmRDaGlsZCBkaXZcblxuICAgIGhpZGVMaXN0OiAtPlxuXG4gICAgICAgIEBsaXN0Py5yZW1vdmUoKVxuICAgICAgICBAbGlzdCA9IG51bGxcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG4gICAgcG9zaXRpb25MaXN0OiAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGxpc3Q/XG4gICAgICAgIGxpc3RIZWlnaHQgPSBAbGlzdC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHRcbiAgICAgICAgZmxleCA9IHdpbmRvdy5zcGxpdC5mbGV4XG4gICAgICAgIGxpc3RUb3AgPSBmbGV4LnBvc09mUGFuZSAyXG4gICAgICAgIHNwYWNlQmVsb3cgPSBmbGV4LnNpemUoKSAtIGxpc3RUb3BcbiAgICAgICAgc3BhY2VBYm92ZSA9IGZsZXguc2l6ZU9mUGFuZSAwXG4gICAgICAgIGlmIHNwYWNlQmVsb3cgPCBsaXN0SGVpZ2h0IGFuZCBzcGFjZUFib3ZlID4gc3BhY2VCZWxvd1xuICAgICAgICAgICAgbGlzdFRvcCA9IHNwYWNlQWJvdmUgLSBsaXN0SGVpZ2h0XG4gICAgICAgIEBsaXN0Py5zdHlsZS50b3AgPSBcIiN7bGlzdFRvcH1weFwiXG5cbiAgICByZXNpemVkOiAtPlxuXG4gICAgICAgIEBsaXN0Py5yZXNpemVkPygpXG4gICAgICAgIEBjb21tYW5kPy5jb21tYW5kTGlzdD8ucmVzaXplZCgpXG4gICAgICAgIHN1cGVyKClcblxuICAgIGZvY3VzVGVybWluYWw6IC0+XG5cbiAgICAgICAgaWYgd2luZG93LnRlcm1pbmFsLm51bUxpbmVzKCkgPT0gMFxuICAgICAgICAgICAgd2luZG93LnRlcm1pbmFsLnNpbmdsZUN1cnNvckF0UG9zIFswLDBdXG4gICAgICAgIHdpbmRvdy5zcGxpdC5kbyBcImZvY3VzIHRlcm1pbmFsXCJcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDBcblxuICAgIGhhbmRsZU1lbnVBY3Rpb246IChuYW1lLCBhcmdzKSAtPlxuXG4gICAgICAgIGlmIGFyZ3M/LmNvbW1hbmRcbiAgICAgICAgICAgIGlmIEBjb21tYW5kRm9yTmFtZSBhcmdzLmNvbW1hbmRcbiAgICAgICAgICAgICAgICBAc3RhcnRDb21tYW5kIGFyZ3MuY29tbWFuZFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAndW5oYW5kbGVkJ1xuXG4gICAgZ2xvYmFsTW9kS2V5Q29tYm9FdmVudDogKG1vZCwga2V5LCBjb21ibywgZXZlbnQpIC0+XG5cbiAgICAgICAgaWYgY29tYm8gPT0gJ2VzYydcbiAgICAgICAgICAgIGlmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT0gQHZpZXdcbiAgICAgICAgICAgICAgICBzdG9wRXZlbnQgZXZlbnRcbiAgICAgICAgICAgICAgICByZXR1cm4gQGNhbmNlbCgpXG5cbiAgICAgICAgaWYgQGNvbW1hbmQ/XG4gICAgICAgICAgICByZXR1cm4gQGNvbW1hbmQuZ2xvYmFsTW9kS2V5Q29tYm9FdmVudCBtb2QsIGtleSwgY29tYm8sIGV2ZW50XG5cbiAgICAgICAgJ3VuaGFuZGxlZCdcblxuICAgIGhhbmRsZU1vZEtleUNvbWJvQ2hhckV2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudCkgLT5cblxuICAgICAgICBpZiBAY29tbWFuZD9cbiAgICAgICAgICAgIHJldHVybiBpZiAndW5oYW5kbGVkJyAhPSBAY29tbWFuZC5oYW5kbGVNb2RLZXlDb21ib0V2ZW50IG1vZCwga2V5LCBjb21ibywgZXZlbnRcblxuICAgICAgICBzcGxpdCA9IHdpbmRvdy5zcGxpdFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJyAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAZXhlY3V0ZSgpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2VudGVyJyAgICAgICAgdGhlbiByZXR1cm4gQGV4ZWN1dGUoKSArIHdpbmRvdy5zcGxpdC5kbyBcImZvY3VzICN7QGNvbW1hbmQ/LmZvY3VzfVwiXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK3NoaWZ0K2VudGVyJyAgdGhlbiByZXR1cm4gQGZvY3VzVGVybWluYWwoKVxuICAgICAgICAgICAgd2hlbiAndXAnICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBjb21tYW5kPy5zZWxlY3RMaXN0SXRlbSAndXAnXG4gICAgICAgICAgICB3aGVuICdkb3duJyAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQGNvbW1hbmQ/LnNlbGVjdExpc3RJdGVtICdkb3duJ1xuICAgICAgICAgICAgd2hlbiAnZXNjJyAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBjYW5jZWwoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtrJyAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBjbGVhcigpXG4gICAgICAgICAgICB3aGVuICdzaGlmdCt0YWInICAgICAgICAgICAgdGhlbiByZXR1cm5cbiAgICAgICAgICAgIHdoZW4gJ2hvbWUnLCAnY29tbWFuZCt1cCcgICB0aGVuIHJldHVybiBzcGxpdC5kbyAnbWF4aW1pemUgZWRpdG9yJ1xuICAgICAgICAgICAgd2hlbiAnZW5kJywgJ2NvbW1hbmQrZG93bicgIHRoZW4gcmV0dXJuIHNwbGl0LmRvICdtaW5pbWl6ZSBlZGl0b3InXG4gICAgICAgICAgICB3aGVuICdhbHQrdXAnICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3BsaXQuZG8gJ2VubGFyZ2UgZWRpdG9yJ1xuICAgICAgICAgICAgd2hlbiAnY3RybCt1cCcgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHNwbGl0LmRvICdlbmxhcmdlIGVkaXRvciBieSAyMCdcbiAgICAgICAgICAgIHdoZW4gJ2FsdCtkb3duJyAgICAgICAgICAgICB0aGVuIHJldHVybiBzcGxpdC5kbyAncmVkdWNlIGVkaXRvcidcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrZG93bicgICAgICAgICAgICB0aGVuIHJldHVybiBzcGxpdC5kbyAncmVkdWNlIGVkaXRvciBieSAyMCdcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JywgJ3RhYicgICAgICAgICB0aGVuIHJldHVybiBpZiBAY29tbWFuZD8ub25UYWJDb21wbGV0aW9uIGNvbWJvXG5cbiAgICAgICAgcmV0dXJuIHN1cGVyIG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnRcblxubW9kdWxlLmV4cG9ydHMgPSBDb21tYW5kbGluZVxuIl19
//# sourceURL=../../coffee/commandline/commandline.coffee