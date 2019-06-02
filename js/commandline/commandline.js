// koffee 0.56.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZGxpbmUuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHNHQUFBO0lBQUE7Ozs7O0FBUUEsTUFBK0UsT0FBQSxDQUFRLEtBQVIsQ0FBL0UsRUFBRSxlQUFGLEVBQVEsdUJBQVIsRUFBa0IseUJBQWxCLEVBQTZCLGVBQTdCLEVBQW1DLHFCQUFuQyxFQUE0QyxpQkFBNUMsRUFBbUQsaUJBQW5ELEVBQTBELG1CQUExRCxFQUFrRSxXQUFsRSxFQUFzRSxTQUF0RSxFQUF5RTs7QUFFekUsVUFBQSxHQUFhLE9BQUEsQ0FBUSxzQkFBUjs7QUFFUDs7O0lBRVcscUJBQUMsUUFBRDs7Ozs7UUFFVCw2Q0FBTSxRQUFOLEVBQWdCO1lBQUEsUUFBQSxFQUFVLEVBQVY7WUFBYyxRQUFBLEVBQVUsRUFBeEI7WUFBNEIsVUFBQSxFQUFXLGFBQXZDO1NBQWhCO1FBRUEsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsQ0FBQyxRQUFELEVBQVcsTUFBWCxFQUFtQixNQUFuQixFQUEyQixRQUEzQixFQUFxQyxNQUFyQyxFQUE2QyxPQUE3QztRQUNoQixJQUFDLENBQUEsWUFBRCxHQUFnQixDQUFDLFNBQUQsRUFBWSxRQUFaO1FBRWhCLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBTixHQUFtQjtRQUNuQixJQUFDLENBQUEsTUFBTSxDQUFDLGFBQVIsQ0FBc0IsSUFBQyxDQUFBLElBQUksQ0FBQyxVQUE1QjtRQUVBLElBQUMsQ0FBQSxNQUFELEdBQVMsQ0FBQSxDQUFFLG9CQUFGO1FBQ1QsSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBbEIsQ0FBc0IsT0FBdEI7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLGdCQUFSLENBQXlCLFdBQXpCLEVBQXNDLElBQUMsQ0FBQSxXQUF2QztRQUVBLElBQUMsQ0FBQSxRQUFELEdBQVk7UUFDWixJQUFDLENBQUEsT0FBRCxHQUFXO1FBRVgsSUFB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UCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDBcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiMjI1xuXG57IHBvc3QsIGZpbGVsaXN0LCBzdG9wRXZlbnQsIGVsZW0sIGtleWluZm8sIGNsYW1wLCBzbGFzaCwga2Vycm9yLCBvcywgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5UZXh0RWRpdG9yID0gcmVxdWlyZSAnLi4vZWRpdG9yL3RleHRlZGl0b3InXG5cbmNsYXNzIENvbW1hbmRsaW5lIGV4dGVuZHMgVGV4dEVkaXRvclxuXG4gICAgY29uc3RydWN0b3I6ICh2aWV3RWxlbSkgLT5cblxuICAgICAgICBzdXBlciB2aWV3RWxlbSwgZmVhdHVyZXM6IFtdLCBmb250U2l6ZTogMjQsIHN5bnRheE5hbWU6J2NvbW1hbmRsaW5lJ1xuXG4gICAgICAgIEBtYWluQ29tbWFuZHMgPSBbJ2Jyb3dzZScsICdnb3RvJywgJ29wZW4nLCAnc2VhcmNoJywgJ2ZpbmQnLCAnbWFjcm8nXVxuICAgICAgICBAaGlkZUNvbW1hbmRzID0gWydzZWxlY3RvJywgJ0Jyb3dzZSddXG5cbiAgICAgICAgQHNpemUubGluZUhlaWdodCA9IDMwXG4gICAgICAgIEBzY3JvbGwuc2V0TGluZUhlaWdodCBAc2l6ZS5saW5lSGVpZ2h0XG5cbiAgICAgICAgQGJ1dHRvbiA9JCAnY29tbWFuZGxpbmUtYnV0dG9uJ1xuICAgICAgICBAYnV0dG9uLmNsYXNzTGlzdC5hZGQgJ2VtcHR5J1xuICAgICAgICBAYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicsIEBvbkNtbWRDbGlja1xuXG4gICAgICAgIEBjb21tYW5kcyA9IHt9XG4gICAgICAgIEBjb21tYW5kID0gbnVsbFxuXG4gICAgICAgIEBsb2FkQ29tbWFuZHMoKVxuXG4gICAgICAgIHBvc3Qub24gJ3NwbGl0JywgICBAb25TcGxpdFxuICAgICAgICBwb3N0Lm9uICdyZXN0b3JlJywgQHJlc3RvcmVcbiAgICAgICAgcG9zdC5vbiAnc3Rhc2gnLCAgIEBzdGFzaFxuXG4gICAgICAgIEB2aWV3Lm9uYmx1ciA9ID0+XG4gICAgICAgICAgICBAYnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUgJ2FjdGl2ZSdcbiAgICAgICAgICAgIEBsaXN0Py5yZW1vdmUoKVxuICAgICAgICAgICAgQGxpc3QgPSBudWxsXG4gICAgICAgICAgICBAY29tbWFuZD8ub25CbHVyKClcblxuICAgICAgICBAdmlldy5vbmZvY3VzID0gPT5cbiAgICAgICAgICAgIEBidXR0b24uY2xhc3NOYW1lID0gXCJjb21tYW5kbGluZS1idXR0b24gYWN0aXZlICN7QGNvbW1hbmQ/LnByZWZzSUR9XCJcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxuICAgIHN0YXNoOiA9PlxuXG4gICAgICAgIGlmIEBjb21tYW5kP1xuICAgICAgICAgICAgd2luZG93LnN0YXNoLnNldCAnY29tbWFuZGxpbmUnLCBAY29tbWFuZC5zdGF0ZSgpXG5cbiAgICByZXN0b3JlOiA9PlxuXG4gICAgICAgIHN0YXRlID0gd2luZG93LnN0YXNoLmdldCAnY29tbWFuZGxpbmUnXG5cbiAgICAgICAgQHNldFRleHQgc3RhdGU/LnRleHQgPyBcIlwiXG5cbiAgICAgICAgbmFtZSA9IHN0YXRlPy5uYW1lID8gJ29wZW4nXG5cbiAgICAgICAgaWYgQGNvbW1hbmQgPSBAY29tbWFuZEZvck5hbWUgbmFtZVxuICAgICAgICAgICAgYWN0aXZlSUQgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmlkXG4gICAgICAgICAgICBpZiBhY3RpdmVJRC5zdGFydHNXaXRoICdjb2x1bW4nIHRoZW4gYWN0aXZlSUQgPSAnZWRpdG9yJ1xuICAgICAgICAgICAgQGNvbW1hbmQuc2V0UmVjZWl2ZXIgYWN0aXZlSUQgIT0gJ2NvbW1hbmRsaW5lLWVkaXRvcicgYW5kIGFjdGl2ZUlEIG9yIG51bGxcbiAgICAgICAgICAgIEBzZXROYW1lIG5hbWVcbiAgICAgICAgICAgIEBidXR0b24uY2xhc3NOYW1lID0gXCJjb21tYW5kbGluZS1idXR0b24gYWN0aXZlICN7QGNvbW1hbmQucHJlZnNJRH1cIlxuICAgICAgICAgICAgQGNvbW1hbmRzW25hbWVdPy5yZXN0b3JlU3RhdGU/IHN0YXRlXG5cbiAgICAjIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgbG9hZENvbW1hbmRzOiAtPlxuXG4gICAgICAgIGZpbGVzID0gZmlsZWxpc3QgXCIje19fZGlybmFtZX0vLi4vY29tbWFuZHNcIlxuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlc1xuICAgICAgICAgICAgY29udGludWUgaWYgc2xhc2guZXh0KGZpbGUpICE9ICdqcydcbiAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICAgIGNvbW1hbmRDbGFzcyA9IHJlcXVpcmUgZmlsZVxuICAgICAgICAgICAgICAgIGNvbW1hbmQgPSBuZXcgY29tbWFuZENsYXNzIEBcbiAgICAgICAgICAgICAgICBjb21tYW5kLnNldFByZWZzSUQgY29tbWFuZENsYXNzLm5hbWUudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgIEBjb21tYW5kc1tjb21tYW5kLnByZWZzSURdID0gY29tbWFuZFxuICAgICAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICAgICAga2Vycm9yIFwiY2FuJ3QgbG9hZCBjb21tYW5kIGZyb20gZmlsZSAnI3tmaWxlfSc6ICN7ZXJyfVwiXG5cbiAgICBzZXROYW1lOiAobmFtZSkgLT5cblxuICAgICAgICBAYnV0dG9uLmlubmVySFRNTCA9IG5hbWVcbiAgICAgICAgQGxheWVycy5zdHlsZS53aWR0aCA9IEB2aWV3LnN0eWxlLndpZHRoXG5cbiAgICBzZXRMaW5lczogKGwpIC0+XG5cbiAgICAgICAgQHNjcm9sbC5yZXNldCgpXG4gICAgICAgIHN1cGVyIGxcblxuICAgIHNldEFuZFNlbGVjdFRleHQ6ICh0KSAtPlxuXG4gICAgICAgIEBzZXRMaW5lcyBbdCA/ICcnXVxuICAgICAgICBAc2VsZWN0QWxsKClcbiAgICAgICAgQHNlbGVjdFNpbmdsZVJhbmdlIEByYW5nZUZvckxpbmVBdEluZGV4IDBcblxuICAgIHNldFRleHQ6ICh0KSAtPlxuXG4gICAgICAgIEBzZXRMaW5lcyBbdCA/ICcnXVxuICAgICAgICBAc2luZ2xlQ3Vyc29yQXRQb3MgW0BsaW5lKDApLmxlbmd0aCwgMF1cblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBjaGFuZ2VkOiAoY2hhbmdlSW5mbykgLT5cblxuICAgICAgICBAaGlkZUxpc3QoKVxuICAgICAgICBzdXBlciBjaGFuZ2VJbmZvXG4gICAgICAgIGlmIGNoYW5nZUluZm8uY2hhbmdlcy5sZW5ndGhcbiAgICAgICAgICAgIEBidXR0b24uY2xhc3NOYW1lID0gXCJjb21tYW5kbGluZS1idXR0b24gYWN0aXZlICN7QGNvbW1hbmQ/LnByZWZzSUR9XCJcbiAgICAgICAgICAgIEBjb21tYW5kPy5jaGFuZ2VkIEBsaW5lKDApXG5cbiAgICBvblNwbGl0OiAocykgPT5cblxuICAgICAgICBAY29tbWFuZD8ub25Cb3Q/IHNbMV1cbiAgICAgICAgQHBvc2l0aW9uTGlzdCgpXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIHN0YXJ0Q29tbWFuZDogKG5hbWUpIC0+XG5cbiAgICAgICAgciA9IEBjb21tYW5kPy5jYW5jZWwgbmFtZVxuXG4gICAgICAgIGlmIHI/LnN0YXR1cyA9PSAnb2snXG4gICAgICAgICAgICBAcmVzdWx0cyByXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICB3aW5kb3cuc3BsaXQuc2hvd0NvbW1hbmRsaW5lKClcblxuICAgICAgICBpZiBAY29tbWFuZCA9IEBjb21tYW5kRm9yTmFtZSBuYW1lXG5cbiAgICAgICAgICAgIGFjdGl2ZUlEID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5pZFxuICAgICAgICAgICAgaWYgYWN0aXZlSUQuc3RhcnRzV2l0aCAnY29sdW1uJyB0aGVuIGFjdGl2ZUlEID0gJ2VkaXRvcidcbiAgICAgICAgICAgIGlmIGFjdGl2ZUlEIGFuZCBhY3RpdmVJRCAhPSAnY29tbWFuZGxpbmUtZWRpdG9yJ1xuICAgICAgICAgICAgICAgIEBjb21tYW5kLnNldFJlY2VpdmVyIGFjdGl2ZUlEXG5cbiAgICAgICAgICAgIEBsYXN0Rm9jdXMgPSB3aW5kb3cubGFzdEZvY3VzXG4gICAgICAgICAgICBAdmlldy5mb2N1cygpXG4gICAgICAgICAgICBAc2V0TmFtZSBuYW1lXG4gICAgICAgICAgICBAcmVzdWx0cyBAY29tbWFuZC5zdGFydCBuYW1lICMgPC0tIGNvbW1hbmQgc3RhcnRcblxuICAgICAgICAgICAgQGJ1dHRvbi5jbGFzc05hbWUgPSBcImNvbW1hbmRsaW5lLWJ1dHRvbiBhY3RpdmUgI3tAY29tbWFuZC5wcmVmc0lEfVwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGtlcnJvciBcIm5vIGNvbW1hbmQgI3tuYW1lfVwiXG5cbiAgICBjb21tYW5kRm9yTmFtZTogKG5hbWUpIC0+XG5cbiAgICAgICAgZm9yIG4sYyBvZiBAY29tbWFuZHNcbiAgICAgICAgICAgIGlmIG4gPT0gbmFtZSBvciBuYW1lIGluIGMubmFtZXNcbiAgICAgICAgICAgICAgICByZXR1cm4gY1xuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBleGVjdXRlOiAtPiBAcmVzdWx0cyBAY29tbWFuZD8uZXhlY3V0ZSBAbGluZSAwXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuXG4gICAgcmVzdWx0czogKHIpIC0+XG5cbiAgICAgICAgQHNldE5hbWUgci5uYW1lIGlmIHI/Lm5hbWU/XG4gICAgICAgIEBzZXRUZXh0IHIudGV4dCBpZiByPy50ZXh0P1xuICAgICAgICBpZiByPy5zZWxlY3QgdGhlbiBAc2VsZWN0QWxsKCkgZWxzZSBAc2VsZWN0Tm9uZSgpXG4gICAgICAgIHdpbmRvdy5zcGxpdC5zaG93ICAgci5zaG93ICAgaWYgcj8uc2hvdz9cbiAgICAgICAgd2luZG93LnNwbGl0LmZvY3VzICByLmZvY3VzICBpZiByPy5mb2N1cz9cbiAgICAgICAgd2luZG93LnNwbGl0LmRvICAgICByLmRvICAgICBpZiByPy5kbz9cbiAgICAgICAgQFxuXG4gICAgY2FuY2VsOiAtPiBAcmVzdWx0cyBAY29tbWFuZD8uY2FuY2VsKClcbiAgICBjbGVhcjogIC0+XG4gICAgICAgIGlmIEB0ZXh0KCkgPT0gJydcbiAgICAgICAgICAgIEByZXN1bHRzIEBjb21tYW5kPy5jbGVhcigpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHN1cGVyLmNsZWFyKClcblxuICAgICMgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDBcblxuICAgIG9uQ21tZENsaWNrOiAoZXZlbnQpID0+XG5cbiAgICAgICAgaWYgbm90IEBsaXN0P1xuICAgICAgICAgICAgQGxpc3QgPSBlbGVtIGNsYXNzOiAnbGlzdCBjb21tYW5kcydcbiAgICAgICAgICAgIEBwb3NpdGlvbkxpc3QoKVxuICAgICAgICAgICAgd2luZG93LnNwbGl0LmVsZW0uYXBwZW5kQ2hpbGQgQGxpc3RcbiAgICAgICAgQGNvbW1hbmQ/LmhpZGVMaXN0PygpXG4gICAgICAgIEBsaXN0Q29tbWFuZHMoKVxuICAgICAgICBAZm9jdXMoKVxuICAgICAgICBAcG9zaXRpb25MaXN0KClcbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG5cbiAgICBsaXN0Q29tbWFuZHM6IC0+XG5cbiAgICAgICAgQGxpc3QuaW5uZXJIVE1MID0gXCJcIlxuICAgICAgICBAbGlzdC5zdHlsZS5kaXNwbGF5ID0gJ3Vuc2V0J1xuICAgICAgICBmb3IgbmFtZSBpbiBAbWFpbkNvbW1hbmRzXG4gICAgICAgICAgICBjbW1kID0gQGNvbW1hbmRzW25hbWVdXG4gICAgICAgICAgICBmb3IgY2kgaW4gWzAuLi5jbW1kLm5hbWVzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICBjbmFtZSA9IGNtbWQubmFtZXNbY2ldXG4gICAgICAgICAgICAgICAgY29udGludWUgaWYgY25hbWUgaW4gQGhpZGVDb21tYW5kc1xuICAgICAgICAgICAgICAgIGRpdiA9IGVsZW0gY2xhc3M6IFwibGlzdC1pdGVtXCJcbiAgICAgICAgICAgICAgICBuYW1lc3BhbiA9IFwiPHNwYW4gY2xhc3M9XFxcImtvIGNvbW1hbmQgI3tjbW1kLnByZWZzSUR9XFxcIiBzdHlsZT1cXFwicG9zaXRpb246YWJzb2x1dGU7IGxlZnQ6ICN7Y2kgPiAwIGFuZCA4MCBvciAxMn1weFxcXCI+I3tjbmFtZX08L3NwYW4+XCJcbiAgICAgICAgICAgICAgICBkaXYuaW5uZXJIVE1MID0gbmFtZXNwYW5cbiAgICAgICAgICAgICAgICBzdGFydCA9IChuYW1lKSA9PiAoZXZlbnQpID0+XG4gICAgICAgICAgICAgICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgICAgICAgICAgICAgIEBzdGFydENvbW1hbmQgbmFtZVxuICAgICAgICAgICAgICAgICAgICBzdG9wRXZlbnQgZXZlbnRcbiAgICAgICAgICAgICAgICBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2Vkb3duJywgc3RhcnQgY25hbWVcbiAgICAgICAgICAgICAgICBAbGlzdC5hcHBlbmRDaGlsZCBkaXZcblxuICAgIGhpZGVMaXN0OiAtPlxuXG4gICAgICAgIEBsaXN0Py5yZW1vdmUoKVxuICAgICAgICBAbGlzdCA9IG51bGxcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG4gICAgcG9zaXRpb25MaXN0OiAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGxpc3Q/XG4gICAgICAgIGxpc3RIZWlnaHQgPSBAbGlzdC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHRcbiAgICAgICAgZmxleCA9IHdpbmRvdy5zcGxpdC5mbGV4XG4gICAgICAgIGxpc3RUb3AgPSBmbGV4LnBvc09mUGFuZSAyXG4gICAgICAgIHNwYWNlQmVsb3cgPSBmbGV4LnNpemUoKSAtIGxpc3RUb3BcbiAgICAgICAgc3BhY2VBYm92ZSA9IGZsZXguc2l6ZU9mUGFuZSAwXG4gICAgICAgIGlmIHNwYWNlQmVsb3cgPCBsaXN0SGVpZ2h0IGFuZCBzcGFjZUFib3ZlID4gc3BhY2VCZWxvd1xuICAgICAgICAgICAgbGlzdFRvcCA9IHNwYWNlQWJvdmUgLSBsaXN0SGVpZ2h0XG4gICAgICAgIEBsaXN0Py5zdHlsZS50b3AgPSBcIiN7bGlzdFRvcH1weFwiXG5cbiAgICByZXNpemVkOiAtPlxuXG4gICAgICAgIEBsaXN0Py5yZXNpemVkPygpXG4gICAgICAgIEBjb21tYW5kPy5jb21tYW5kTGlzdD8ucmVzaXplZCgpXG4gICAgICAgIHN1cGVyKClcblxuICAgIGZvY3VzVGVybWluYWw6IC0+XG5cbiAgICAgICAgaWYgd2luZG93LnRlcm1pbmFsLm51bUxpbmVzKCkgPT0gMFxuICAgICAgICAgICAgd2luZG93LnRlcm1pbmFsLnNpbmdsZUN1cnNvckF0UG9zIFswLDBdXG4gICAgICAgIHdpbmRvdy5zcGxpdC5kbyBcImZvY3VzIHRlcm1pbmFsXCJcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDBcblxuICAgIGhhbmRsZU1lbnVBY3Rpb246IChuYW1lLCBhcmdzKSAtPlxuXG4gICAgICAgIGlmIGFyZ3M/LmNvbW1hbmRcbiAgICAgICAgICAgIGlmIEBjb21tYW5kRm9yTmFtZSBhcmdzLmNvbW1hbmRcbiAgICAgICAgICAgICAgICBAc3RhcnRDb21tYW5kIGFyZ3MuY29tbWFuZFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAndW5oYW5kbGVkJ1xuXG4gICAgZ2xvYmFsTW9kS2V5Q29tYm9FdmVudDogKG1vZCwga2V5LCBjb21ibywgZXZlbnQpIC0+XG5cbiAgICAgICAgaWYgY29tYm8gPT0gJ2VzYydcbiAgICAgICAgICAgIGlmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT0gQHZpZXdcbiAgICAgICAgICAgICAgICBzdG9wRXZlbnQgZXZlbnRcbiAgICAgICAgICAgICAgICByZXR1cm4gQGNhbmNlbCgpXG5cbiAgICAgICAgaWYgQGNvbW1hbmQ/XG4gICAgICAgICAgICByZXR1cm4gQGNvbW1hbmQuZ2xvYmFsTW9kS2V5Q29tYm9FdmVudCBtb2QsIGtleSwgY29tYm8sIGV2ZW50XG5cbiAgICAgICAgJ3VuaGFuZGxlZCdcblxuICAgIGhhbmRsZU1vZEtleUNvbWJvQ2hhckV2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudCkgLT5cblxuICAgICAgICBpZiBAY29tbWFuZD9cbiAgICAgICAgICAgIHJldHVybiBpZiAndW5oYW5kbGVkJyAhPSBAY29tbWFuZC5oYW5kbGVNb2RLZXlDb21ib0V2ZW50IG1vZCwga2V5LCBjb21ibywgZXZlbnRcblxuICAgICAgICBzcGxpdCA9IHdpbmRvdy5zcGxpdFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJyAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAZXhlY3V0ZSgpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2VudGVyJyAgICAgICAgdGhlbiByZXR1cm4gQGV4ZWN1dGUoKSArIHdpbmRvdy5zcGxpdC5kbyBcImZvY3VzICN7QGNvbW1hbmQ/LmZvY3VzfVwiXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK3NoaWZ0K2VudGVyJyAgdGhlbiByZXR1cm4gQGZvY3VzVGVybWluYWwoKVxuICAgICAgICAgICAgd2hlbiAndXAnICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBjb21tYW5kPy5zZWxlY3RMaXN0SXRlbSAndXAnXG4gICAgICAgICAgICB3aGVuICdkb3duJyAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQGNvbW1hbmQ/LnNlbGVjdExpc3RJdGVtICdkb3duJ1xuICAgICAgICAgICAgd2hlbiAnZXNjJyAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBjYW5jZWwoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtrJyAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBjbGVhcigpXG4gICAgICAgICAgICB3aGVuICdzaGlmdCt0YWInICAgICAgICAgICAgdGhlbiByZXR1cm5cbiAgICAgICAgICAgIHdoZW4gJ2hvbWUnLCAnY29tbWFuZCt1cCcgICB0aGVuIHJldHVybiBzcGxpdC5kbyAnbWF4aW1pemUgZWRpdG9yJ1xuICAgICAgICAgICAgd2hlbiAnZW5kJywgJ2NvbW1hbmQrZG93bicgIHRoZW4gcmV0dXJuIHNwbGl0LmRvICdtaW5pbWl6ZSBlZGl0b3InXG4gICAgICAgICAgICB3aGVuICdhbHQrdXAnICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3BsaXQuZG8gJ2VubGFyZ2UgZWRpdG9yJ1xuICAgICAgICAgICAgd2hlbiAnY3RybCt1cCcgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHNwbGl0LmRvICdlbmxhcmdlIGVkaXRvciBieSAyMCdcbiAgICAgICAgICAgIHdoZW4gJ2FsdCtkb3duJyAgICAgICAgICAgICB0aGVuIHJldHVybiBzcGxpdC5kbyAncmVkdWNlIGVkaXRvcidcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrZG93bicgICAgICAgICAgICB0aGVuIHJldHVybiBzcGxpdC5kbyAncmVkdWNlIGVkaXRvciBieSAyMCdcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JywgJ3RhYicgICAgICAgICB0aGVuIHJldHVybiBpZiBAY29tbWFuZD8ub25UYWJDb21wbGV0aW9uIGNvbWJvXG5cbiAgICAgICAgcmV0dXJuIHN1cGVyIG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnRcblxubW9kdWxlLmV4cG9ydHMgPSBDb21tYW5kbGluZVxuIl19
//# sourceURL=../../coffee/commandline/commandline.coffee