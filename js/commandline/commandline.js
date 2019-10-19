// koffee 1.3.0

/*
 0000000   0000000   00     00  00     00   0000000   000   000  0000000    000      000  000   000  00000000
000       000   000  000   000  000   000  000   000  0000  000  000   000  000      000  0000  000  000
000       000   000  000000000  000000000  000000000  000 0 000  000   000  000      000  000 0 000  0000000
000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  000      000  000  0000  000
 0000000   0000000   000   000  000   000  000   000  000   000  0000000    0000000  000  000   000  00000000
 */
var $, Commandline, TextEditor, _, clamp, elem, filelist, kerror, keyinfo, os, post, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf;

ref = require('kxk'), post = ref.post, filelist = ref.filelist, stopEvent = ref.stopEvent, elem = ref.elem, keyinfo = ref.keyinfo, clamp = ref.clamp, slash = ref.slash, kerror = ref.kerror, os = ref.os, $ = ref.$, _ = ref._;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZGxpbmUuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHNHQUFBO0lBQUE7Ozs7O0FBUUEsTUFBK0UsT0FBQSxDQUFRLEtBQVIsQ0FBL0UsRUFBRSxlQUFGLEVBQVEsdUJBQVIsRUFBa0IseUJBQWxCLEVBQTZCLGVBQTdCLEVBQW1DLHFCQUFuQyxFQUE0QyxpQkFBNUMsRUFBbUQsaUJBQW5ELEVBQTBELG1CQUExRCxFQUFrRSxXQUFsRSxFQUFzRSxTQUF0RSxFQUF5RTs7QUFFekUsVUFBQSxHQUFhLE9BQUEsQ0FBUSxzQkFBUjs7QUFFUDs7O0lBRVcscUJBQUMsUUFBRDs7Ozs7UUFFVCw2Q0FBTSxRQUFOLEVBQWdCO1lBQUEsUUFBQSxFQUFVLEVBQVY7WUFBYyxRQUFBLEVBQVUsRUFBeEI7WUFBNEIsVUFBQSxFQUFXLGFBQXZDO1NBQWhCO1FBRUEsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsQ0FBQyxRQUFELEVBQVcsTUFBWCxFQUFtQixNQUFuQixFQUEyQixRQUEzQixFQUFxQyxNQUFyQyxFQUE2QyxPQUE3QztRQUNoQixJQUFDLENBQUEsWUFBRCxHQUFnQixDQUFDLFNBQUQsRUFBWSxRQUFaO1FBRWhCLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBTixHQUFtQjtRQUNuQixJQUFDLENBQUEsTUFBTSxDQUFDLGFBQVIsQ0FBc0IsSUFBQyxDQUFBLElBQUksQ0FBQyxVQUE1QjtRQUVBLElBQUMsQ0FBQSxNQUFELEdBQVMsQ0FBQSxDQUFFLG9CQUFGO1FBQ1QsSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBbEIsQ0FBc0IsT0FBdEI7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLGdCQUFSLENBQXlCLFdBQXpCLEVBQXNDLElBQUMsQ0FBQSxXQUF2QztRQUVBLElBQUMsQ0FBQSxRQUFELEdBQVk7UUFDWixJQUFDLENBQUEsT0FBRCxHQUFXO1FBRVgsSUFB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UCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDBcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiMjI1xuXG57IHBvc3QsIGZpbGVsaXN0LCBzdG9wRXZlbnQsIGVsZW0sIGtleWluZm8sIGNsYW1wLCBzbGFzaCwga2Vycm9yLCBvcywgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5UZXh0RWRpdG9yID0gcmVxdWlyZSAnLi4vZWRpdG9yL3RleHRlZGl0b3InXG5cbmNsYXNzIENvbW1hbmRsaW5lIGV4dGVuZHMgVGV4dEVkaXRvclxuXG4gICAgY29uc3RydWN0b3I6ICh2aWV3RWxlbSkgLT5cblxuICAgICAgICBzdXBlciB2aWV3RWxlbSwgZmVhdHVyZXM6IFtdLCBmb250U2l6ZTogMjQsIHN5bnRheE5hbWU6J2NvbW1hbmRsaW5lJ1xuXG4gICAgICAgIEBtYWluQ29tbWFuZHMgPSBbJ2Jyb3dzZScsICdnb3RvJywgJ29wZW4nLCAnc2VhcmNoJywgJ2ZpbmQnLCAnbWFjcm8nXVxuICAgICAgICBAaGlkZUNvbW1hbmRzID0gWydzZWxlY3RvJywgJ0Jyb3dzZSddXG5cbiAgICAgICAgQHNpemUubGluZUhlaWdodCA9IDMwXG4gICAgICAgIEBzY3JvbGwuc2V0TGluZUhlaWdodCBAc2l6ZS5saW5lSGVpZ2h0XG5cbiAgICAgICAgQGJ1dHRvbiA9JCAnY29tbWFuZGxpbmUtYnV0dG9uJ1xuICAgICAgICBAYnV0dG9uLmNsYXNzTGlzdC5hZGQgJ2VtcHR5J1xuICAgICAgICBAYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicsIEBvbkNtbWRDbGlja1xuXG4gICAgICAgIEBjb21tYW5kcyA9IHt9XG4gICAgICAgIEBjb21tYW5kID0gbnVsbFxuXG4gICAgICAgIEBsb2FkQ29tbWFuZHMoKVxuXG4gICAgICAgIHBvc3Qub24gJ3NwbGl0JywgICBAb25TcGxpdFxuICAgICAgICBwb3N0Lm9uICdyZXN0b3JlJywgQHJlc3RvcmVcbiAgICAgICAgcG9zdC5vbiAnc3Rhc2gnLCAgIEBzdGFzaFxuXG4gICAgICAgIEB2aWV3Lm9uYmx1ciA9ID0+XG4gICAgICAgICAgICBAYnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUgJ2FjdGl2ZSdcbiAgICAgICAgICAgIEBsaXN0Py5yZW1vdmUoKVxuICAgICAgICAgICAgQGxpc3QgPSBudWxsXG4gICAgICAgICAgICBAY29tbWFuZD8ub25CbHVyKClcblxuICAgICAgICBAdmlldy5vbmZvY3VzID0gPT5cbiAgICAgICAgICAgIEBidXR0b24uY2xhc3NOYW1lID0gXCJjb21tYW5kbGluZS1idXR0b24gYWN0aXZlICN7QGNvbW1hbmQ/LnByZWZzSUR9XCJcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxuICAgIHN0YXNoOiA9PlxuXG4gICAgICAgIGlmIEBjb21tYW5kP1xuICAgICAgICAgICAgd2luZG93LnN0YXNoLnNldCAnY29tbWFuZGxpbmUnIEBjb21tYW5kLnN0YXRlKClcblxuICAgIHJlc3RvcmU6ID0+XG5cbiAgICAgICAgc3RhdGUgPSB3aW5kb3cuc3Rhc2guZ2V0ICdjb21tYW5kbGluZSdcblxuICAgICAgICBAc2V0VGV4dCBzdGF0ZT8udGV4dCA/IFwiXCJcblxuICAgICAgICBuYW1lID0gc3RhdGU/Lm5hbWUgPyAnb3BlbidcblxuICAgICAgICBpZiBAY29tbWFuZCA9IEBjb21tYW5kRm9yTmFtZSBuYW1lXG4gICAgICAgICAgICBhY3RpdmVJRCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuaWRcbiAgICAgICAgICAgIGlmIGFjdGl2ZUlELnN0YXJ0c1dpdGggJ2NvbHVtbicgdGhlbiBhY3RpdmVJRCA9ICdlZGl0b3InXG4gICAgICAgICAgICBAY29tbWFuZC5zZXRSZWNlaXZlciBhY3RpdmVJRCAhPSAnY29tbWFuZGxpbmUtZWRpdG9yJyBhbmQgYWN0aXZlSUQgb3IgbnVsbFxuICAgICAgICAgICAgQHNldE5hbWUgbmFtZVxuICAgICAgICAgICAgQGJ1dHRvbi5jbGFzc05hbWUgPSBcImNvbW1hbmRsaW5lLWJ1dHRvbiBhY3RpdmUgI3tAY29tbWFuZC5wcmVmc0lEfVwiXG4gICAgICAgICAgICBAY29tbWFuZHNbbmFtZV0/LnJlc3RvcmVTdGF0ZT8gc3RhdGVcblxuICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBsb2FkQ29tbWFuZHM6IC0+XG5cbiAgICAgICAgZmlsZXMgPSBmaWxlbGlzdCBcIiN7X19kaXJuYW1lfS8uLi9jb21tYW5kc1wiXG4gICAgICAgIGZvciBmaWxlIGluIGZpbGVzXG4gICAgICAgICAgICBjb250aW51ZSBpZiBzbGFzaC5leHQoZmlsZSkgIT0gJ2pzJ1xuICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgICAgY29tbWFuZENsYXNzID0gcmVxdWlyZSBmaWxlXG4gICAgICAgICAgICAgICAgY29tbWFuZCA9IG5ldyBjb21tYW5kQ2xhc3MgQFxuICAgICAgICAgICAgICAgIGNvbW1hbmQuc2V0UHJlZnNJRCBjb21tYW5kQ2xhc3MubmFtZS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgICAgQGNvbW1hbmRzW2NvbW1hbmQucHJlZnNJRF0gPSBjb21tYW5kXG4gICAgICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgICAgICBrZXJyb3IgXCJjYW4ndCBsb2FkIGNvbW1hbmQgZnJvbSBmaWxlICcje2ZpbGV9JzogI3tlcnJ9XCJcblxuICAgIHNldE5hbWU6IChuYW1lKSAtPlxuXG4gICAgICAgIEBidXR0b24uaW5uZXJIVE1MID0gbmFtZVxuICAgICAgICBAbGF5ZXJzLnN0eWxlLndpZHRoID0gQHZpZXcuc3R5bGUud2lkdGhcblxuICAgIHNldExpbmVzOiAobCkgLT5cblxuICAgICAgICBAc2Nyb2xsLnJlc2V0KClcbiAgICAgICAgc3VwZXIgbFxuXG4gICAgc2V0QW5kU2VsZWN0VGV4dDogKHQpIC0+XG5cbiAgICAgICAgQHNldExpbmVzIFt0ID8gJyddXG4gICAgICAgIEBzZWxlY3RBbGwoKVxuICAgICAgICBAc2VsZWN0U2luZ2xlUmFuZ2UgQHJhbmdlRm9yTGluZUF0SW5kZXggMFxuXG4gICAgc2V0VGV4dDogKHQpIC0+XG5cbiAgICAgICAgQHNldExpbmVzIFt0ID8gJyddXG4gICAgICAgIEBzaW5nbGVDdXJzb3JBdFBvcyBbQGxpbmUoMCkubGVuZ3RoLCAwXVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGNoYW5nZWQ6IChjaGFuZ2VJbmZvKSAtPlxuXG4gICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgIHN1cGVyIGNoYW5nZUluZm9cbiAgICAgICAgaWYgY2hhbmdlSW5mby5jaGFuZ2VzLmxlbmd0aFxuICAgICAgICAgICAgQGJ1dHRvbi5jbGFzc05hbWUgPSBcImNvbW1hbmRsaW5lLWJ1dHRvbiBhY3RpdmUgI3tAY29tbWFuZD8ucHJlZnNJRH1cIlxuICAgICAgICAgICAgQGNvbW1hbmQ/LmNoYW5nZWQgQGxpbmUoMClcblxuICAgIG9uU3BsaXQ6IChzKSA9PlxuXG4gICAgICAgIEBjb21tYW5kPy5vbkJvdD8gc1sxXVxuICAgICAgICBAcG9zaXRpb25MaXN0KClcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgIDAwMFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAgc3RhcnRDb21tYW5kOiAobmFtZSkgLT5cblxuICAgICAgICByID0gQGNvbW1hbmQ/LmNhbmNlbCBuYW1lXG5cbiAgICAgICAgaWYgcj8uc3RhdHVzID09ICdvaydcbiAgICAgICAgICAgIEByZXN1bHRzIHJcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIHdpbmRvdy5zcGxpdC5zaG93Q29tbWFuZGxpbmUoKVxuXG4gICAgICAgIGlmIEBjb21tYW5kID0gQGNvbW1hbmRGb3JOYW1lIG5hbWVcblxuICAgICAgICAgICAgYWN0aXZlSUQgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmlkXG4gICAgICAgICAgICBpZiBhY3RpdmVJRC5zdGFydHNXaXRoICdjb2x1bW4nIHRoZW4gYWN0aXZlSUQgPSAnZWRpdG9yJ1xuICAgICAgICAgICAgaWYgYWN0aXZlSUQgYW5kIGFjdGl2ZUlEICE9ICdjb21tYW5kbGluZS1lZGl0b3InXG4gICAgICAgICAgICAgICAgQGNvbW1hbmQuc2V0UmVjZWl2ZXIgYWN0aXZlSURcblxuICAgICAgICAgICAgQGxhc3RGb2N1cyA9IHdpbmRvdy5sYXN0Rm9jdXNcbiAgICAgICAgICAgIEB2aWV3LmZvY3VzKClcbiAgICAgICAgICAgIEBzZXROYW1lIG5hbWVcbiAgICAgICAgICAgIEByZXN1bHRzIEBjb21tYW5kLnN0YXJ0IG5hbWUgIyA8LS0gY29tbWFuZCBzdGFydFxuXG4gICAgICAgICAgICBAYnV0dG9uLmNsYXNzTmFtZSA9IFwiY29tbWFuZGxpbmUtYnV0dG9uIGFjdGl2ZSAje0Bjb21tYW5kLnByZWZzSUR9XCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAga2Vycm9yIFwibm8gY29tbWFuZCAje25hbWV9XCJcblxuICAgIGNvbW1hbmRGb3JOYW1lOiAobmFtZSkgLT5cblxuICAgICAgICBmb3IgbixjIG9mIEBjb21tYW5kc1xuICAgICAgICAgICAgaWYgbiA9PSBuYW1lIG9yIG5hbWUgaW4gYy5uYW1lc1xuICAgICAgICAgICAgICAgIHJldHVybiBjXG5cbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIGV4ZWN1dGU6IC0+IEByZXN1bHRzIEBjb21tYW5kPy5leGVjdXRlIEBsaW5lIDBcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG5cbiAgICByZXN1bHRzOiAocikgLT5cblxuICAgICAgICBAc2V0TmFtZSByLm5hbWUgaWYgcj8ubmFtZT9cbiAgICAgICAgQHNldFRleHQgci50ZXh0IGlmIHI/LnRleHQ/XG4gICAgICAgIGlmIHI/LnNlbGVjdCB0aGVuIEBzZWxlY3RBbGwoKSBlbHNlIEBzZWxlY3ROb25lKClcbiAgICAgICAgd2luZG93LnNwbGl0LnNob3cgICByLnNob3cgICBpZiByPy5zaG93P1xuICAgICAgICB3aW5kb3cuc3BsaXQuZm9jdXMgIHIuZm9jdXMgIGlmIHI/LmZvY3VzP1xuICAgICAgICB3aW5kb3cuc3BsaXQuZG8gICAgIHIuZG8gICAgIGlmIHI/LmRvP1xuICAgICAgICBAXG5cbiAgICBjYW5jZWw6IC0+IEByZXN1bHRzIEBjb21tYW5kPy5jYW5jZWwoKVxuICAgIGNsZWFyOiAgLT5cbiAgICAgICAgaWYgQHRleHQoKSA9PSAnJ1xuICAgICAgICAgICAgQHJlc3VsdHMgQGNvbW1hbmQ/LmNsZWFyKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc3VwZXIuY2xlYXIoKVxuXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwICAwMDAwMDAwICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMFxuXG4gICAgb25DbW1kQ2xpY2s6IChldmVudCkgPT5cblxuICAgICAgICBpZiBub3QgQGxpc3Q/XG4gICAgICAgICAgICBAbGlzdCA9IGVsZW0gY2xhc3M6ICdsaXN0IGNvbW1hbmRzJ1xuICAgICAgICAgICAgQHBvc2l0aW9uTGlzdCgpXG4gICAgICAgICAgICB3aW5kb3cuc3BsaXQuZWxlbS5hcHBlbmRDaGlsZCBAbGlzdFxuICAgICAgICBAY29tbWFuZD8uaGlkZUxpc3Q/KClcbiAgICAgICAgQGxpc3RDb21tYW5kcygpXG4gICAgICAgIEBmb2N1cygpXG4gICAgICAgIEBwb3NpdGlvbkxpc3QoKVxuICAgICAgICBzdG9wRXZlbnQgZXZlbnRcblxuICAgIGxpc3RDb21tYW5kczogLT5cblxuICAgICAgICBAbGlzdC5pbm5lckhUTUwgPSBcIlwiXG4gICAgICAgIEBsaXN0LnN0eWxlLmRpc3BsYXkgPSAndW5zZXQnXG4gICAgICAgIGZvciBuYW1lIGluIEBtYWluQ29tbWFuZHNcbiAgICAgICAgICAgIGNtbWQgPSBAY29tbWFuZHNbbmFtZV1cbiAgICAgICAgICAgIGZvciBjaSBpbiBbMC4uLmNtbWQubmFtZXMubGVuZ3RoXVxuICAgICAgICAgICAgICAgIGNuYW1lID0gY21tZC5uYW1lc1tjaV1cbiAgICAgICAgICAgICAgICBjb250aW51ZSBpZiBjbmFtZSBpbiBAaGlkZUNvbW1hbmRzXG4gICAgICAgICAgICAgICAgZGl2ID0gZWxlbSBjbGFzczogXCJsaXN0LWl0ZW1cIlxuICAgICAgICAgICAgICAgIG5hbWVzcGFuID0gXCI8c3BhbiBjbGFzcz1cXFwia28gY29tbWFuZCAje2NtbWQucHJlZnNJRH1cXFwiIHN0eWxlPVxcXCJwb3NpdGlvbjphYnNvbHV0ZTsgbGVmdDogI3tjaSA+IDAgYW5kIDgwIG9yIDEyfXB4XFxcIj4je2NuYW1lfTwvc3Bhbj5cIlxuICAgICAgICAgICAgICAgIGRpdi5pbm5lckhUTUwgPSBuYW1lc3BhblxuICAgICAgICAgICAgICAgIHN0YXJ0ID0gKG5hbWUpID0+IChldmVudCkgPT5cbiAgICAgICAgICAgICAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgICAgICAgICAgICAgQHN0YXJ0Q29tbWFuZCBuYW1lXG4gICAgICAgICAgICAgICAgICAgIHN0b3BFdmVudCBldmVudFxuICAgICAgICAgICAgICAgIGRpdi5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nLCBzdGFydCBjbmFtZVxuICAgICAgICAgICAgICAgIEBsaXN0LmFwcGVuZENoaWxkIGRpdlxuXG4gICAgaGlkZUxpc3Q6IC0+XG5cbiAgICAgICAgQGxpc3Q/LnJlbW92ZSgpXG4gICAgICAgIEBsaXN0ID0gbnVsbFxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbiAgICBwb3NpdGlvbkxpc3Q6IC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbGlzdD9cbiAgICAgICAgbGlzdEhlaWdodCA9IEBsaXN0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodFxuICAgICAgICBmbGV4ID0gd2luZG93LnNwbGl0LmZsZXhcbiAgICAgICAgbGlzdFRvcCA9IGZsZXgucG9zT2ZQYW5lIDJcbiAgICAgICAgc3BhY2VCZWxvdyA9IGZsZXguc2l6ZSgpIC0gbGlzdFRvcFxuICAgICAgICBzcGFjZUFib3ZlID0gZmxleC5zaXplT2ZQYW5lIDBcbiAgICAgICAgaWYgc3BhY2VCZWxvdyA8IGxpc3RIZWlnaHQgYW5kIHNwYWNlQWJvdmUgPiBzcGFjZUJlbG93XG4gICAgICAgICAgICBsaXN0VG9wID0gc3BhY2VBYm92ZSAtIGxpc3RIZWlnaHRcbiAgICAgICAgQGxpc3Q/LnN0eWxlLnRvcCA9IFwiI3tsaXN0VG9wfXB4XCJcblxuICAgIHJlc2l6ZWQ6IC0+XG5cbiAgICAgICAgQGxpc3Q/LnJlc2l6ZWQ/KClcbiAgICAgICAgQGNvbW1hbmQ/LmNvbW1hbmRMaXN0Py5yZXNpemVkKClcbiAgICAgICAgc3VwZXIoKVxuXG4gICAgZm9jdXNUZXJtaW5hbDogLT5cblxuICAgICAgICBpZiB3aW5kb3cudGVybWluYWwubnVtTGluZXMoKSA9PSAwXG4gICAgICAgICAgICB3aW5kb3cudGVybWluYWwuc2luZ2xlQ3Vyc29yQXRQb3MgWzAsMF1cbiAgICAgICAgd2luZG93LnNwbGl0LmRvIFwiZm9jdXMgdGVybWluYWxcIlxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMFxuXG4gICAgaGFuZGxlTWVudUFjdGlvbjogKG5hbWUsIGFyZ3MpIC0+XG5cbiAgICAgICAgaWYgYXJncz8uY29tbWFuZFxuICAgICAgICAgICAgaWYgQGNvbW1hbmRGb3JOYW1lIGFyZ3MuY29tbWFuZFxuICAgICAgICAgICAgICAgIEBzdGFydENvbW1hbmQgYXJncy5jb21tYW5kXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICd1bmhhbmRsZWQnXG5cbiAgICBnbG9iYWxNb2RLZXlDb21ib0V2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBldmVudCkgLT5cblxuICAgICAgICBpZiBjb21ibyA9PSAnZXNjJ1xuICAgICAgICAgICAgaWYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PSBAdmlld1xuICAgICAgICAgICAgICAgIHN0b3BFdmVudCBldmVudFxuICAgICAgICAgICAgICAgIHJldHVybiBAY2FuY2VsKClcblxuICAgICAgICBpZiBAY29tbWFuZD9cbiAgICAgICAgICAgIHJldHVybiBAY29tbWFuZC5nbG9iYWxNb2RLZXlDb21ib0V2ZW50IG1vZCwga2V5LCBjb21ibywgZXZlbnRcblxuICAgICAgICAndW5oYW5kbGVkJ1xuXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9DaGFyRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50KSAtPlxuXG4gICAgICAgIGlmIEBjb21tYW5kP1xuICAgICAgICAgICAgcmV0dXJuIGlmICd1bmhhbmRsZWQnICE9IEBjb21tYW5kLmhhbmRsZU1vZEtleUNvbWJvRXZlbnQgbW9kLCBrZXksIGNvbWJvLCBldmVudFxuXG4gICAgICAgIHNwbGl0ID0gd2luZG93LnNwbGl0XG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnZW50ZXInICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBleGVjdXRlKClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrZW50ZXInICAgICAgICB0aGVuIHJldHVybiBAZXhlY3V0ZSgpICsgd2luZG93LnNwbGl0LmRvIFwiZm9jdXMgI3tAY29tbWFuZD8uZm9jdXN9XCJcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrc2hpZnQrZW50ZXInICB0aGVuIHJldHVybiBAZm9jdXNUZXJtaW5hbCgpXG4gICAgICAgICAgICB3aGVuICd1cCcgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQGNvbW1hbmQ/LnNlbGVjdExpc3RJdGVtICd1cCdcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAY29tbWFuZD8uc2VsZWN0TGlzdEl0ZW0gJ2Rvd24nXG4gICAgICAgICAgICB3aGVuICdlc2MnICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQGNhbmNlbCgpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2snICAgICAgICAgICAgdGhlbiByZXR1cm4gQGNsZWFyKClcbiAgICAgICAgICAgIHdoZW4gJ3NoaWZ0K3RhYicgICAgICAgICAgICB0aGVuIHJldHVyblxuICAgICAgICAgICAgd2hlbiAnaG9tZScsICdjb21tYW5kK3VwJyAgIHRoZW4gcmV0dXJuIHNwbGl0LmRvICdtYXhpbWl6ZSBlZGl0b3InXG4gICAgICAgICAgICB3aGVuICdlbmQnLCAnY29tbWFuZCtkb3duJyAgdGhlbiByZXR1cm4gc3BsaXQuZG8gJ21pbmltaXplIGVkaXRvcidcbiAgICAgICAgICAgIHdoZW4gJ2FsdCt1cCcgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzcGxpdC5kbyAnZW5sYXJnZSBlZGl0b3InXG4gICAgICAgICAgICB3aGVuICdjdHJsK3VwJyAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3BsaXQuZG8gJ2VubGFyZ2UgZWRpdG9yIGJ5IDIwJ1xuICAgICAgICAgICAgd2hlbiAnYWx0K2Rvd24nICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHNwbGl0LmRvICdyZWR1Y2UgZWRpdG9yJ1xuICAgICAgICAgICAgd2hlbiAnY3RybCtkb3duJyAgICAgICAgICAgIHRoZW4gcmV0dXJuIHNwbGl0LmRvICdyZWR1Y2UgZWRpdG9yIGJ5IDIwJ1xuICAgICAgICAgICAgd2hlbiAncmlnaHQnLCAndGFiJyAgICAgICAgIHRoZW4gcmV0dXJuIGlmIEBjb21tYW5kPy5vblRhYkNvbXBsZXRpb24gY29tYm9cblxuICAgICAgICByZXR1cm4gc3VwZXIgbW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudFxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbW1hbmRsaW5lXG4iXX0=
//# sourceURL=../../coffee/commandline/commandline.coffee