// koffee 1.11.0

/*
 0000000   0000000   00     00  00     00   0000000   000   000  0000000  
000       000   000  000   000  000   000  000   000  0000  000  000   000
000       000   000  000000000  000000000  000000000  000 0 000  000   000
000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000
 0000000   0000000   000   000  000   000  000   000  000   000  0000000
 */
var Command, CommandList, _, clamp, elem, empty, fuzzy, history, kerror, ref, reversed, syntax,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), _ = ref._, clamp = ref.clamp, elem = ref.elem, empty = ref.empty, history = ref.history, kerror = ref.kerror, reversed = ref.reversed;

syntax = require('../editor/syntax');

CommandList = require('./commandlist');

fuzzy = require('fuzzy');

Command = (function() {
    function Command(commandline) {
        this.commandline = commandline;
        this.onBlur = bind(this.onBlur, this);
        this.onBot = bind(this.onBot, this);
        this.listClick = bind(this.listClick, this);
        this.syntaxName = 'ko';
        this.maxHistory = 20;
    }

    Command.prototype.state = function() {
        return {
            text: this.getText(),
            name: this.name
        };
    };

    Command.prototype.restoreState = function(state) {
        if (state != null ? state.name : void 0) {
            this.name = state.name;
        }
        return this.loadState();
    };

    Command.prototype.start = function(name) {
        var text;
        this.setName(name);
        this.loadState();
        text = this.getText();
        if (!(text != null ? text.length : void 0)) {
            text = this.last();
        }
        return {
            text: text,
            select: true
        };
    };

    Command.prototype.execute = function(command) {
        var ref1, ref2;
        if (empty(command)) {
            return kerror('no command!');
        }
        if (this.commandList != null) {
            if ((0 <= (ref1 = this.selected) && ref1 < this.commandList.numLines())) {
                command = (ref2 = this.commandList) != null ? ref2.line(this.selected) : void 0;
            }
            this.hideList();
        }
        command = command.trim();
        this.setCurrent(command);
        return command;
    };

    Command.prototype.changed = function(command) {
        var f, fuzzied, items;
        if (this.commandList == null) {
            return;
        }
        command = command.trim();
        items = this.listItems();
        if (items.length) {
            if (command.length) {
                fuzzied = fuzzy.filter(command, items, {
                    extract: function(o) {
                        if (o != null) {
                            if (_.isString(o)) {
                                return o;
                            }
                            if (_.isString(o.text)) {
                                return o.text;
                            }
                        }
                        return '';
                    }
                });
                items = (function() {
                    var j, len, ref1, results;
                    ref1 = _.sortBy(fuzzied, function(o) {
                        return o.index;
                    });
                    results = [];
                    for (j = 0, len = ref1.length; j < len; j++) {
                        f = ref1[j];
                        results.push(f.original);
                    }
                    return results;
                })();
            }
            this.showItems(this.weightedItems(items, {
                currentText: command
            }));
            this.select(0);
            return this.positionList();
        }
    };

    Command.prototype.weight = function(item, opt) {
        var w;
        w = 0;
        w += item.text.startsWith(opt.currentText) && 65535 * (opt.currentText.length / item.text.length) || 0;
        return w;
    };

    Command.prototype.weightedItems = function(items, opt) {
        return items.sort((function(_this) {
            return function(a, b) {
                return _this.weight(b, opt) - _this.weight(a, opt);
            };
        })(this));
    };

    Command.prototype.cancel = function() {
        this.hideList();
        return {
            text: '',
            focus: this.receiver,
            show: 'editor'
        };
    };

    Command.prototype.clear = function() {
        if (window.terminal.numLines() > 0) {
            window.terminal.clear();
            return {};
        } else {
            return {
                text: ''
            };
        }
    };

    Command.prototype.showList = function() {
        var listView;
        if (this.commandList == null) {
            listView = elem({
                "class": "commandlist " + this.prefsID
            });
            window.split.elem.appendChild(listView);
            return this.commandList = new CommandList(this, '.commandlist', {
                syntaxName: this.syntaxName
            });
        }
    };

    Command.prototype.listItems = function() {
        return reversed(this.history);
    };

    Command.prototype.showItems = function(items) {
        if ((this.commandList == null) && !items.length) {
            return;
        }
        if (!items.length) {
            return this.hideList();
        }
        if (this.commandList == null) {
            this.showList();
        }
        this.commandList.addItems(items);
        return this.positionList();
    };

    Command.prototype.listClick = function(index) {
        this.selected = index;
        return this.execute(this.commandList.line(index));
    };

    Command.prototype.onBot = function(bot) {
        return this.positionList();
    };

    Command.prototype.positionList = function() {
        var flex, listHeight, listTop, ref1, spaceBelow;
        if (this.commandList == null) {
            return;
        }
        flex = window.split.flex;
        flex.update();
        listTop = flex.posOfPane(2);
        listHeight = this.commandList.view.getBoundingClientRect().height;
        spaceBelow = flex.size() - listTop;
        if (spaceBelow < listHeight) {
            if (flex.sizeOfPane(0) > spaceBelow) {
                listTop = flex.posOfHandle(0) - listHeight;
                if (listTop < 0) {
                    this.commandList.view.style.height = (listHeight + listTop) + "px";
                    listTop = 0;
                }
            } else {
                this.commandList.view.style.height = spaceBelow + "px";
            }
        }
        return (ref1 = this.commandList) != null ? ref1.view.style.top = listTop + "px" : void 0;
    };

    Command.prototype.select = function(i) {
        if (this.commandList == null) {
            return;
        }
        this.selected = clamp(-1, this.commandList.numLines() - 1, i);
        if (this.selected >= 0) {
            this.commandList.selectSingleRange(this.commandList.rangeForLineAtIndex(this.selected), {
                before: true
            });
        } else {
            this.commandList.singleCursorAtPos([0, 0]);
        }
        return this.commandList.scroll.cursorIntoView();
    };

    Command.prototype.selectListItem = function(dir) {
        switch (dir) {
            case 'up':
                return this.setAndSelectText(this.prev());
            case 'down':
                return this.setAndSelectText(this.next());
        }
    };

    Command.prototype.prev = function() {
        if (this.commandList != null) {
            this.select(clamp(-1, this.commandList.numLines() - 1, this.selected - 1));
            if (this.selected < 0) {
                this.hideList();
            } else {
                return this.commandList.line(this.selected);
            }
        } else {
            if (this.selected < 0) {
                this.selected = this.history.length - 1;
            } else if (this.selected > 0) {
                this.selected -= 1;
            }
            return this.history[this.selected];
        }
        return '';
    };

    Command.prototype.next = function() {
        if ((this.commandList == null) && this.listItems().length) {
            this.showItems(this.listItems());
            this.select(-1);
        }
        if (this.commandList != null) {
            this.select(clamp(0, this.commandList.numLines() - 1, this.selected + 1));
            return this.commandList.line(this.selected);
        } else if (this.history.length) {
            this.selected = clamp(0, this.history.length - 1, this.selected + 1);
            return new this.history[this.selected];
        } else {
            this.selected = -1;
            return '';
        }
    };

    Command.prototype.onBlur = function() {
        if (!this.skipBlur) {
            return this.hideList();
        } else {
            return this.skipBlur = null;
        }
    };

    Command.prototype.hideList = function() {
        var ref1, ref2, ref3;
        this.selected = -1;
        if ((ref1 = this.commandList) != null) {
            ref1.del();
        }
        if ((ref2 = this.commandList) != null) {
            if ((ref3 = ref2.view) != null) {
                ref3.remove();
            }
        }
        return this.commandList = null;
    };

    Command.prototype.cancelList = function() {
        return this.hideList();
    };

    Command.prototype.historyKey = function() {
        return 'history';
    };

    Command.prototype.clearHistory = function() {
        this.history = [];
        this.selected = -1;
        return this.setState(this.historyKey(), this.history);
    };

    Command.prototype.setHistory = function(history1) {
        this.history = history1;
        return this.setState(this.historyKey(), this.history);
    };

    Command.prototype.setCurrent = function(command) {
        if (this.history == null) {
            this.loadState();
        }
        if (!_.isArray(this.history)) {
            kerror("Command.setCurrent -- " + (this.historyKey()) + " : history not an array?", typeof this.history);
            this.history = [];
        }
        _.pull(this.history, command);
        if (command.trim().length) {
            this.history.push(command);
        }
        while (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        this.selected = this.history.length - 1;
        return this.setState(this.historyKey(), this.history);
    };

    Command.prototype.current = function() {
        var ref1;
        return (ref1 = this.history[this.selected]) != null ? ref1 : '';
    };

    Command.prototype.last = function() {
        if (this.commandList != null) {
            this.selected = this.commandList.numLines() - 1;
            this.commandList.line(this.selected);
        } else {
            this.selected = this.history.length - 1;
            if (this.selected >= 0) {
                return this.history[this.selected];
            }
        }
        return '';
    };

    Command.prototype.setText = function(t) {
        this.currentText = t;
        return this.commandline.setText(t);
    };

    Command.prototype.setAndSelectText = function(t) {
        this.currentText = t;
        return this.commandline.setAndSelectText(t);
    };

    Command.prototype.getText = function() {
        return this.commandline.line(0);
    };

    Command.prototype.setName = function(n) {
        this.name = n;
        return this.commandline.setName(n);
    };

    Command.prototype.complete = function() {
        if (this.commandList == null) {
            return;
        }
        if (this.commandList.line(this.selected) !== this.getText() && this.commandList.line(this.selected).startsWith(this.getText())) {
            this.setText(this.commandList.line(this.selected));
            return true;
        }
    };

    Command.prototype.grabFocus = function() {
        return this.commandline.focus();
    };

    Command.prototype.setReceiver = function(receiver) {
        if (receiver === 'body') {
            return;
        }
        return this.receiver = receiver != null ? receiver : 'editor';
    };

    Command.prototype.receivingEditor = function() {
        return window.editorWithName(this.receiver);
    };

    Command.prototype.setPrefsID = function(id) {
        this.prefsID = id;
        return this.loadState();
    };

    Command.prototype.loadState = function() {
        this.history = this.getState(this.historyKey(), []);
        return this.selected = this.history.length - 1;
    };

    Command.prototype.setState = function(key, value) {
        if (!this.prefsID) {
            return;
        }
        if (this.prefsID) {
            return window.state.set("command|" + this.prefsID + "|" + key, value);
        }
    };

    Command.prototype.getState = function(key, value) {
        if (!this.prefsID) {
            return value;
        }
        return window.state.get("command|" + this.prefsID + "|" + key, value);
    };

    Command.prototype.delState = function(key) {
        if (!this.prefsID) {
            return;
        }
        return window.state.del("command|" + this.prefsID + "|" + key);
    };

    Command.prototype.isActive = function() {
        return this.commandline.command === this;
    };

    Command.prototype.globalModKeyComboEvent = function(mod, key, combo, event) {
        return 'unhandled';
    };

    Command.prototype.handleModKeyComboEvent = function(mod, key, combo, event) {
        switch (combo) {
            case 'page up':
            case 'page down':
                if (this.commandList != null) {
                    return this.select(clamp(0, this.commandList.numLines() - 1, this.selected + (this.commandList.numFullLines() - 1) * (combo === 'page up' && -1 || 1)));
                }
        }
        return 'unhandled';
    };

    Command.prototype.onTabCompletion = function(combo) {
        if (this.commandline.isCursorAtEndOfLine()) {
            this.complete();
            return true;
        } else if (combo === 'tab') {
            return true;
        } else {
            return false;
        }
    };

    return Command;

})();

module.exports = Command;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvY29tbWFuZGxpbmUiLCJzb3VyY2VzIjpbImNvbW1hbmQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDBGQUFBO0lBQUE7O0FBUUEsTUFBdUQsT0FBQSxDQUFRLEtBQVIsQ0FBdkQsRUFBRSxTQUFGLEVBQUssaUJBQUwsRUFBWSxlQUFaLEVBQWtCLGlCQUFsQixFQUF5QixxQkFBekIsRUFBa0MsbUJBQWxDLEVBQTBDOztBQUUxQyxNQUFBLEdBQWMsT0FBQSxDQUFRLGtCQUFSOztBQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsZUFBUjs7QUFDZCxLQUFBLEdBQWMsT0FBQSxDQUFRLE9BQVI7O0FBRVI7SUFFQyxpQkFBQyxXQUFEO1FBQUMsSUFBQyxDQUFBLGNBQUQ7Ozs7UUFFQSxJQUFDLENBQUEsVUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLFVBQUQsR0FBYztJQUhmOztzQkFXSCxLQUFBLEdBQU8sU0FBQTtlQUNIO1lBQUEsSUFBQSxFQUFPLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBUDtZQUNBLElBQUEsRUFBTyxJQUFDLENBQUEsSUFEUjs7SUFERzs7c0JBSVAsWUFBQSxHQUFjLFNBQUMsS0FBRDtRQUVWLG9CQUFHLEtBQUssQ0FBRSxhQUFWO1lBQ0ksSUFBQyxDQUFBLElBQUQsR0FBUSxLQUFLLENBQUMsS0FEbEI7O2VBRUEsSUFBQyxDQUFBLFNBQUQsQ0FBQTtJQUpVOztzQkFZZCxLQUFBLEdBQU8sU0FBQyxJQUFEO0FBRUgsWUFBQTtRQUFBLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBVDtRQUNBLElBQUMsQ0FBQSxTQUFELENBQUE7UUFDQSxJQUFBLEdBQU8sSUFBQyxDQUFBLE9BQUQsQ0FBQTtRQUNQLElBQWtCLGlCQUFJLElBQUksQ0FBRSxnQkFBNUI7WUFBQSxJQUFBLEdBQU8sSUFBQyxDQUFBLElBQUQsQ0FBQSxFQUFQOztlQUNBO1lB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QUFBLENBQUEsR0FBd0IsQ0FBakMsRUFBb0MsSUFBQyxDQUFBLFFBQUQsR0FBVSxDQUFDLElBQUMsQ0FBQSxXQUFXLENBQUMsWUFBYixDQUFBLENBQUEsR0FBNEIsQ0FBN0IsQ0FBQSxHQUFnQyxDQUFDLEtBQUEsS0FBTyxTQUFQLElBQXFCLENBQUMsQ0FBdEIsSUFBMkIsQ0FBNUIsQ0FBOUUsQ0FBUixFQUZYOztBQUZSO2VBS0E7SUFOb0I7O3NCQVF4QixlQUFBLEdBQWlCLFNBQUMsS0FBRDtRQUViLElBQUcsSUFBQyxDQUFBLFdBQVcsQ0FBQyxtQkFBYixDQUFBLENBQUg7WUFDSSxJQUFDLENBQUEsUUFBRCxDQUFBO21CQUNBLEtBRko7U0FBQSxNQUdLLElBQUcsS0FBQSxLQUFTLEtBQVo7bUJBQ0QsS0FEQztTQUFBLE1BQUE7bUJBR0QsTUFIQzs7SUFMUTs7Ozs7O0FBVXJCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMFxuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICBcbiMjI1xuXG57IF8sIGNsYW1wLCBlbGVtLCBlbXB0eSwgaGlzdG9yeSwga2Vycm9yLCByZXZlcnNlZCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5zeW50YXggICAgICA9IHJlcXVpcmUgJy4uL2VkaXRvci9zeW50YXgnXG5Db21tYW5kTGlzdCA9IHJlcXVpcmUgJy4vY29tbWFuZGxpc3QnXG5mdXp6eSAgICAgICA9IHJlcXVpcmUgJ2Z1enp5J1xuXG5jbGFzcyBDb21tYW5kXG5cbiAgICBAOiAoQGNvbW1hbmRsaW5lKSAtPlxuICAgICAgICBcbiAgICAgICAgQHN5bnRheE5hbWUgPSAna28nXG4gICAgICAgIEBtYXhIaXN0b3J5ID0gMjBcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgc3RhdGU6IC0+XG4gICAgICAgIHRleHQ6ICBAZ2V0VGV4dCgpXG4gICAgICAgIG5hbWU6ICBAbmFtZVxuICAgICAgICBcbiAgICByZXN0b3JlU3RhdGU6IChzdGF0ZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHN0YXRlPy5uYW1lXG4gICAgICAgICAgICBAbmFtZSA9IHN0YXRlLm5hbWVcbiAgICAgICAgQGxvYWRTdGF0ZSgpXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgIDAwMCAgIFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgIFxuICAgIHN0YXJ0OiAobmFtZSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBzZXROYW1lIG5hbWVcbiAgICAgICAgQGxvYWRTdGF0ZSgpXG4gICAgICAgIHRleHQgPSBAZ2V0VGV4dCgpXG4gICAgICAgIHRleHQgPSBAbGFzdCgpIGlmIG5vdCB0ZXh0Py5sZW5ndGhcbiAgICAgICAgdGV4dDogICB0ZXh0XG4gICAgICAgIHNlbGVjdDogdHJ1ZVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMFxuICAgICAgICBcbiAgICBleGVjdXRlOiAoY29tbWFuZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGVtcHR5IGNvbW1hbmRcbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ25vIGNvbW1hbmQhJ1xuICAgICAgICBcbiAgICAgICAgaWYgQGNvbW1hbmRMaXN0PyBcbiAgICAgICAgICAgIGlmIDAgPD0gQHNlbGVjdGVkIDwgQGNvbW1hbmRMaXN0Lm51bUxpbmVzKClcbiAgICAgICAgICAgICAgICBjb21tYW5kID0gQGNvbW1hbmRMaXN0Py5saW5lIEBzZWxlY3RlZFxuICAgICAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgICAgIFxuICAgICAgICBjb21tYW5kID0gY29tbWFuZC50cmltKClcbiAgICAgICAgQHNldEN1cnJlbnQgY29tbWFuZFxuICAgICAgICBjb21tYW5kXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgXG4gICAgXG4gICAgY2hhbmdlZDogKGNvbW1hbmQpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBjb21tYW5kTGlzdD9cbiAgICAgICAgXG4gICAgICAgIGNvbW1hbmQgPSBjb21tYW5kLnRyaW0oKVxuICAgICAgICBpdGVtcyA9IEBsaXN0SXRlbXMoKVxuICAgICAgICBcbiAgICAgICAgaWYgaXRlbXMubGVuZ3RoXG4gICAgICAgICAgICBpZiBjb21tYW5kLmxlbmd0aFxuICAgICAgICAgICAgICAgIGZ1enppZWQgPSBmdXp6eS5maWx0ZXIgY29tbWFuZCwgaXRlbXMsIGV4dHJhY3Q6IChvKSAtPiBcbiAgICAgICAgICAgICAgICAgICAgaWYgbz9cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvIGlmIF8uaXNTdHJpbmcgb1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG8udGV4dCBpZiBfLmlzU3RyaW5nIG8udGV4dFxuICAgICAgICAgICAgICAgICAgICAnJyAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGl0ZW1zID0gKGYub3JpZ2luYWwgZm9yIGYgaW4gXy5zb3J0QnkgZnV6emllZCwgKG8pIC0+IG8uaW5kZXgpXG4gICAgICAgICAgICBAc2hvd0l0ZW1zIEB3ZWlnaHRlZEl0ZW1zIGl0ZW1zLCBjdXJyZW50VGV4dDogY29tbWFuZFxuICAgICAgICAgICAgQHNlbGVjdCAwXG4gICAgICAgICAgICBAcG9zaXRpb25MaXN0KClcblxuICAgIHdlaWdodDogKGl0ZW0sIG9wdCkgLT5cbiAgICAgICAgdyA9IDBcbiAgICAgICAgdyArPSBpdGVtLnRleHQuc3RhcnRzV2l0aChvcHQuY3VycmVudFRleHQpIGFuZCA2NTUzNSAqIChvcHQuY3VycmVudFRleHQubGVuZ3RoL2l0ZW0udGV4dC5sZW5ndGgpIG9yIDAgXG4gICAgICAgIHdcbiAgICBcbiAgICB3ZWlnaHRlZEl0ZW1zOiAoaXRlbXMsIG9wdCkgLT4gaXRlbXMuc29ydCAoYSxiKSA9PiBAd2VpZ2h0KGIsIG9wdCkgLSBAd2VpZ2h0KGEsIG9wdClcbiAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgIFxuICAgIGNhbmNlbDogLT5cbiAgICAgICAgXG4gICAgICAgIEBoaWRlTGlzdCgpICAgICAgICBcbiAgICAgICAgdGV4dDogJydcbiAgICAgICAgZm9jdXM6IEByZWNlaXZlclxuICAgICAgICBzaG93OiAnZWRpdG9yJ1xuICAgICAgICBcbiAgICBjbGVhcjogLT5cbiAgICAgICAgaWYgd2luZG93LnRlcm1pbmFsLm51bUxpbmVzKCkgPiAwXG4gICAgICAgICAgICB3aW5kb3cudGVybWluYWwuY2xlYXIoKVxuICAgICAgICAgICAge31cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGV4dDogJydcbiAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgXG5cbiAgICBzaG93TGlzdDogLT5cblxuICAgICAgICBpZiBub3QgQGNvbW1hbmRMaXN0P1xuICAgICAgICAgICAgbGlzdFZpZXcgPSBlbGVtIGNsYXNzOiBcImNvbW1hbmRsaXN0ICN7QHByZWZzSUR9XCJcbiAgICAgICAgICAgIHdpbmRvdy5zcGxpdC5lbGVtLmFwcGVuZENoaWxkIGxpc3RWaWV3XG4gICAgICAgICAgICBAY29tbWFuZExpc3QgPSBuZXcgQ29tbWFuZExpc3QgQCwgJy5jb21tYW5kbGlzdCcgc3ludGF4TmFtZTpAc3ludGF4TmFtZVxuICAgIFxuICAgIGxpc3RJdGVtczogKCkgLT4gcmV2ZXJzZWQgQGhpc3RvcnlcblxuICAgIHNob3dJdGVtczogKGl0ZW1zKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY29tbWFuZExpc3Q/IGFuZCBub3QgaXRlbXMubGVuZ3RoXG4gICAgICAgIHJldHVybiBAaGlkZUxpc3QoKSBpZiBub3QgaXRlbXMubGVuZ3RoXG4gICAgICAgIEBzaG93TGlzdCgpIGlmIG5vdCBAY29tbWFuZExpc3Q/XG4gICAgICAgIEBjb21tYW5kTGlzdC5hZGRJdGVtcyBpdGVtc1xuICAgICAgICBAcG9zaXRpb25MaXN0KClcbiAgICBcbiAgICBsaXN0Q2xpY2s6IChpbmRleCkgPT5cbiAgICAgICAgXG4gICAgICAgIEBzZWxlY3RlZCA9IGluZGV4XG4gICAgICAgIEBleGVjdXRlIEBjb21tYW5kTGlzdC5saW5lIGluZGV4IFxuICAgIFxuICAgIG9uQm90OiAoYm90KSA9PiBAcG9zaXRpb25MaXN0KClcbiAgICBcbiAgICBwb3NpdGlvbkxpc3Q6IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBjb21tYW5kTGlzdD9cbiAgICAgICAgZmxleCA9IHdpbmRvdy5zcGxpdC5mbGV4XG4gICAgICAgIGZsZXgudXBkYXRlKClcbiAgICAgICAgbGlzdFRvcCA9IGZsZXgucG9zT2ZQYW5lIDIgXG4gICAgICAgIGxpc3RIZWlnaHQgPSBAY29tbWFuZExpc3Qudmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHRcbiAgICAgICAgc3BhY2VCZWxvdyA9IGZsZXguc2l6ZSgpIC0gbGlzdFRvcFxuICAgICAgICBpZiBzcGFjZUJlbG93IDwgbGlzdEhlaWdodFxuICAgICAgICAgICAgaWYgZmxleC5zaXplT2ZQYW5lKDApID4gc3BhY2VCZWxvd1xuICAgICAgICAgICAgICAgIGxpc3RUb3AgPSBmbGV4LnBvc09mSGFuZGxlKDApIC0gbGlzdEhlaWdodFxuICAgICAgICAgICAgICAgIGlmIGxpc3RUb3AgPCAwXG4gICAgICAgICAgICAgICAgICAgIEBjb21tYW5kTGlzdC52aWV3LnN0eWxlLmhlaWdodCA9IFwiI3tsaXN0SGVpZ2h0K2xpc3RUb3B9cHhcIlxuICAgICAgICAgICAgICAgICAgICBsaXN0VG9wID0gMFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBjb21tYW5kTGlzdC52aWV3LnN0eWxlLmhlaWdodCA9IFwiI3tzcGFjZUJlbG93fXB4XCJcbiAgICAgICAgQGNvbW1hbmRMaXN0Py52aWV3LnN0eWxlLnRvcCA9IFwiI3tsaXN0VG9wfXB4XCJcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgIFxuICAgICAgICBcbiAgICBzZWxlY3Q6IChpKSAtPiBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY29tbWFuZExpc3Q/XG4gICAgICAgIEBzZWxlY3RlZCA9IGNsYW1wIC0xLCBAY29tbWFuZExpc3QubnVtTGluZXMoKS0xLCBpXG4gICAgICAgIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICAgICBAY29tbWFuZExpc3Quc2VsZWN0U2luZ2xlUmFuZ2UgQGNvbW1hbmRMaXN0LnJhbmdlRm9yTGluZUF0SW5kZXgoQHNlbGVjdGVkKSwgYmVmb3JlOnRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNvbW1hbmRMaXN0LnNpbmdsZUN1cnNvckF0UG9zIFswLDBdIFxuICAgICAgICBAY29tbWFuZExpc3Quc2Nyb2xsLmN1cnNvckludG9WaWV3KClcbiAgICAgICAgICAgICAgICBcbiAgICBzZWxlY3RMaXN0SXRlbTogKGRpcikgLT5cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBkaXJcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgIHRoZW4gQHNldEFuZFNlbGVjdFRleHQgQHByZXYoKVxuICAgICAgICAgICAgd2hlbiAnZG93bicgdGhlbiBAc2V0QW5kU2VsZWN0VGV4dCBAbmV4dCgpXG4gICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwIDAwMCBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgICAwICAgIFxuICAgICAgICAgICAgXG4gICAgcHJldjogLT4gXG4gICAgICAgIGlmIEBjb21tYW5kTGlzdD9cbiAgICAgICAgICAgIEBzZWxlY3QgY2xhbXAgLTEsIEBjb21tYW5kTGlzdC5udW1MaW5lcygpLTEsIEBzZWxlY3RlZC0xXG4gICAgICAgICAgICBpZiBAc2VsZWN0ZWQgPCAwXG4gICAgICAgICAgICAgICAgQGhpZGVMaXN0KCkgXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIEBjb21tYW5kTGlzdC5saW5lKEBzZWxlY3RlZClcbiAgICAgICAgZWxzZSAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgQHNlbGVjdGVkIDwgMFxuICAgICAgICAgICAgICAgIEBzZWxlY3RlZCA9IEBoaXN0b3J5Lmxlbmd0aC0xIFxuICAgICAgICAgICAgZWxzZSBpZiBAc2VsZWN0ZWQgPiAwXG4gICAgICAgICAgICAgICAgQHNlbGVjdGVkIC09IDFcbiAgICAgICAgICAgIHJldHVybiBAaGlzdG9yeVtAc2VsZWN0ZWRdXG4gICAgICAgICcnXG4gICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgXG4gICAgbmV4dDogLT4gXG4gICAgICAgIGlmIG5vdCBAY29tbWFuZExpc3Q/IGFuZCBAbGlzdEl0ZW1zKCkubGVuZ3RoXG4gICAgICAgICAgICBAc2hvd0l0ZW1zIEBsaXN0SXRlbXMoKSBcbiAgICAgICAgICAgIEBzZWxlY3QgLTFcbiAgICAgICAgaWYgQGNvbW1hbmRMaXN0PyBcbiAgICAgICAgICAgIEBzZWxlY3QgY2xhbXAgMCwgQGNvbW1hbmRMaXN0Lm51bUxpbmVzKCktMSwgQHNlbGVjdGVkKzFcbiAgICAgICAgICAgIHJldHVybiBAY29tbWFuZExpc3QubGluZShAc2VsZWN0ZWQpXG4gICAgICAgIGVsc2UgaWYgQGhpc3RvcnkubGVuZ3RoXG4gICAgICAgICAgICBAc2VsZWN0ZWQgPSBjbGFtcCAwLCBAaGlzdG9yeS5sZW5ndGgtMSwgQHNlbGVjdGVkKzFcbiAgICAgICAgICAgIHJldHVybiBuZXcgQGhpc3RvcnlbQHNlbGVjdGVkXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc2VsZWN0ZWQgPSAtMVxuICAgICAgICAgICAgcmV0dXJuICcnXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMFxuICAgICAgICAgXG4gICAgb25CbHVyOiA9PiBcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAc2tpcEJsdXJcbiAgICAgICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBza2lwQmx1ciA9IG51bGxcbiAgICAgICAgICAgIFxuICAgIGhpZGVMaXN0OiAtPlxuXG4gICAgICAgIEBzZWxlY3RlZCA9IC0xXG4gICAgICAgIEBjb21tYW5kTGlzdD8uZGVsKClcbiAgICAgICAgQGNvbW1hbmRMaXN0Py52aWV3Py5yZW1vdmUoKVxuICAgICAgICBAY29tbWFuZExpc3QgPSBudWxsXG5cbiAgICBjYW5jZWxMaXN0OiAtPiBAaGlkZUxpc3QoKVxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgXG4gICAgaGlzdG9yeUtleTogLT4gJ2hpc3RvcnknXG4gICAgXG4gICAgY2xlYXJIaXN0b3J5OiAtPlxuICAgICAgICBcbiAgICAgICAgQGhpc3RvcnkgPSBbXVxuICAgICAgICBAc2VsZWN0ZWQgPSAtMVxuICAgICAgICBAc2V0U3RhdGUgQGhpc3RvcnlLZXkoKSwgQGhpc3RvcnlcbiAgIFxuICAgIHNldEhpc3Rvcnk6IChAaGlzdG9yeSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBzZXRTdGF0ZSBAaGlzdG9yeUtleSgpLCBAaGlzdG9yeVxuICAgIFxuICAgIHNldEN1cnJlbnQ6IChjb21tYW5kKSAtPlxuICAgICAgICBcbiAgICAgICAgQGxvYWRTdGF0ZSgpIGlmIG5vdCBAaGlzdG9yeT9cbiAgICAgICAgaWYgbm90IF8uaXNBcnJheSBAaGlzdG9yeVxuICAgICAgICAgICAga2Vycm9yIFwiQ29tbWFuZC5zZXRDdXJyZW50IC0tICN7QGhpc3RvcnlLZXkoKX0gOiBoaXN0b3J5IG5vdCBhbiBhcnJheT9cIiB0eXBlb2YgQGhpc3RvcnkgXG4gICAgICAgICAgICBAaGlzdG9yeSA9IFtdXG4gICAgICAgIF8ucHVsbCBAaGlzdG9yeSwgY29tbWFuZFxuICAgICAgICBAaGlzdG9yeS5wdXNoIGNvbW1hbmQgaWYgY29tbWFuZC50cmltKCkubGVuZ3RoXG4gICAgICAgIHdoaWxlIEBoaXN0b3J5Lmxlbmd0aCA+IEBtYXhIaXN0b3J5XG4gICAgICAgICAgICBAaGlzdG9yeS5zaGlmdCgpXG4gICAgICAgIEBzZWxlY3RlZCA9IEBoaXN0b3J5Lmxlbmd0aC0xXG4gICAgICAgIEBzZXRTdGF0ZSBAaGlzdG9yeUtleSgpLCBAaGlzdG9yeVxuICAgICAgICBcbiAgICBjdXJyZW50OiAtPiBAaGlzdG9yeVtAc2VsZWN0ZWRdID8gJydcbiAgICAgICAgXG4gICAgbGFzdDogLT5cbiAgICAgICAgaWYgQGNvbW1hbmRMaXN0P1xuICAgICAgICAgICAgQHNlbGVjdGVkID0gQGNvbW1hbmRMaXN0Lm51bUxpbmVzKCktMVxuICAgICAgICAgICAgQGNvbW1hbmRMaXN0LmxpbmUoQHNlbGVjdGVkKVxuICAgICAgICBlbHNlICAgICAgICAgICAgXG4gICAgICAgICAgICBAc2VsZWN0ZWQgPSBAaGlzdG9yeS5sZW5ndGgtMVxuICAgICAgICAgICAgcmV0dXJuIEBoaXN0b3J5W0BzZWxlY3RlZF0gaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgJydcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICBcbiAgICBzZXRUZXh0OiAodCkgLT4gXG4gICAgICAgIEBjdXJyZW50VGV4dCA9IHRcbiAgICAgICAgQGNvbW1hbmRsaW5lLnNldFRleHQgdFxuICAgICAgICBcbiAgICBzZXRBbmRTZWxlY3RUZXh0OiAodCkgLT4gXG4gICAgICAgIEBjdXJyZW50VGV4dCA9IHRcbiAgICAgICAgQGNvbW1hbmRsaW5lLnNldEFuZFNlbGVjdFRleHQgdFxuICAgICAgICBcbiAgICBnZXRUZXh0OiAtPiBAY29tbWFuZGxpbmUubGluZSgwKVxuICAgICAgICBcbiAgICBzZXROYW1lOiAobikgLT5cbiAgICAgICAgQG5hbWUgPSBuXG4gICAgICAgIEBjb21tYW5kbGluZS5zZXROYW1lIG5cblxuICAgIGNvbXBsZXRlOiAtPiBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY29tbWFuZExpc3Q/IFxuICAgICAgICBpZiBAY29tbWFuZExpc3QubGluZShAc2VsZWN0ZWQpICE9IEBnZXRUZXh0KCkgYW5kIEBjb21tYW5kTGlzdC5saW5lKEBzZWxlY3RlZCkuc3RhcnRzV2l0aCBAZ2V0VGV4dCgpXG4gICAgICAgICAgICBAc2V0VGV4dCBAY29tbWFuZExpc3QubGluZShAc2VsZWN0ZWQpXG4gICAgICAgICAgICB0cnVlXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICBcbiAgICBncmFiRm9jdXM6IC0+IEBjb21tYW5kbGluZS5mb2N1cygpXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMCAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIHNldFJlY2VpdmVyOiAocmVjZWl2ZXIpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgcmVjZWl2ZXIgPT0gJ2JvZHknXG4gICAgICAgIEByZWNlaXZlciA9IHJlY2VpdmVyID8gJ2VkaXRvcidcblxuICAgIHJlY2VpdmluZ0VkaXRvcjogLT4gd2luZG93LmVkaXRvcldpdGhOYW1lIEByZWNlaXZlclxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBzZXRQcmVmc0lEOiAoaWQpIC0+XG4gICAgICAgIEBwcmVmc0lEID0gaWRcbiAgICAgICAgQGxvYWRTdGF0ZSgpXG4gICAgICAgIFxuICAgIGxvYWRTdGF0ZTogLT5cbiAgICAgICAgQGhpc3RvcnkgPSBAZ2V0U3RhdGUgQGhpc3RvcnlLZXkoKSwgW11cbiAgICAgICAgQHNlbGVjdGVkID0gQGhpc3RvcnkubGVuZ3RoLTFcblxuICAgIHNldFN0YXRlOiAoa2V5LCB2YWx1ZSkgLT5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAcHJlZnNJRFxuICAgICAgICBpZiBAcHJlZnNJRFxuICAgICAgICAgICAgd2luZG93LnN0YXRlLnNldCBcImNvbW1hbmR8I3tAcHJlZnNJRH18I3trZXl9XCIsIHZhbHVlXG4gICAgICAgIFxuICAgIGdldFN0YXRlOiAoa2V5LCB2YWx1ZSkgLT5cbiAgICAgICAgcmV0dXJuIHZhbHVlIGlmIG5vdCBAcHJlZnNJRFxuICAgICAgICB3aW5kb3cuc3RhdGUuZ2V0IFwiY29tbWFuZHwje0BwcmVmc0lEfXwje2tleX1cIiwgdmFsdWVcbiAgICAgICAgXG4gICAgZGVsU3RhdGU6IChrZXkpIC0+XG4gICAgICAgIHJldHVybiBpZiBub3QgQHByZWZzSURcbiAgICAgICAgd2luZG93LnN0YXRlLmRlbCBcImNvbW1hbmR8I3tAcHJlZnNJRH18I3trZXl9XCJcblxuICAgIGlzQWN0aXZlOiAtPiBAY29tbWFuZGxpbmUuY29tbWFuZCA9PSBAXG4gICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICBcbiAgICBcbiAgICBnbG9iYWxNb2RLZXlDb21ib0V2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBldmVudCkgLT4gJ3VuaGFuZGxlZCdcbiAgICAgICAgXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9FdmVudDogKG1vZCwga2V5LCBjb21ibywgZXZlbnQpIC0+IFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnLCAncGFnZSBkb3duJ1xuICAgICAgICAgICAgICAgIGlmIEBjb21tYW5kTGlzdD9cbiAgICAgICAgICAgICAgICAgICAgIyByZXR1cm4gQHNlbGVjdCBjbGFtcCAwLCBAY29tbWFuZExpc3QubnVtTGluZXMoKSwgQHNlbGVjdGVkK0Bjb21tYW5kTGlzdC5tYXhMaW5lcyooY29tYm89PSdwYWdlIHVwJyBhbmQgLTEgb3IgMSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEBzZWxlY3QgY2xhbXAgMCwgQGNvbW1hbmRMaXN0Lm51bUxpbmVzKCktMSwgQHNlbGVjdGVkKyhAY29tbWFuZExpc3QubnVtRnVsbExpbmVzKCktMSkqKGNvbWJvPT0ncGFnZSB1cCcgYW5kIC0xIG9yIDEpXG4gICAgICAgICd1bmhhbmRsZWQnXG5cbiAgICBvblRhYkNvbXBsZXRpb246IChjb21ibykgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBjb21tYW5kbGluZS5pc0N1cnNvckF0RW5kT2ZMaW5lKClcbiAgICAgICAgICAgIEBjb21wbGV0ZSgpXG4gICAgICAgICAgICB0cnVlXG4gICAgICAgIGVsc2UgaWYgY29tYm8gPT0gJ3RhYicgXG4gICAgICAgICAgICB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZhbHNlXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBDb21tYW5kXG4iXX0=
//# sourceURL=../../coffee/commandline/command.coffee