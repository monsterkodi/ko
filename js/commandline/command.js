// koffee 1.4.0

/*
 0000000   0000000   00     00  00     00   0000000   000   000  0000000  
000       000   000  000   000  000   000  000   000  0000  000  000   000
000       000   000  000000000  000000000  000000000  000 0 000  000   000
000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000
 0000000   0000000   000   000  000   000  000   000  000   000  0000000
 */
var Command, CommandList, _, clamp, elem, empty, fuzzy, history, kerror, ref, reversed, syntax,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), reversed = ref.reversed, history = ref.history, empty = ref.empty, clamp = ref.clamp, elem = ref.elem, kerror = ref.kerror, _ = ref._;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsMEZBQUE7SUFBQTs7QUFRQSxNQUF1RCxPQUFBLENBQVEsS0FBUixDQUF2RCxFQUFFLHVCQUFGLEVBQVkscUJBQVosRUFBcUIsaUJBQXJCLEVBQTRCLGlCQUE1QixFQUFtQyxlQUFuQyxFQUF5QyxtQkFBekMsRUFBaUQ7O0FBRWpELE1BQUEsR0FBYyxPQUFBLENBQVEsa0JBQVI7O0FBQ2QsV0FBQSxHQUFjLE9BQUEsQ0FBUSxlQUFSOztBQUNkLEtBQUEsR0FBYyxPQUFBLENBQVEsT0FBUjs7QUFFUjtJQUVDLGlCQUFDLFdBQUQ7UUFBQyxJQUFDLENBQUEsY0FBRDs7OztRQUVBLElBQUMsQ0FBQSxVQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsVUFBRCxHQUFjO0lBSGY7O3NCQVdILEtBQUEsR0FBTyxTQUFBO2VBQ0g7WUFBQSxJQUFBLEVBQU8sSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFQO1lBQ0EsSUFBQSxFQUFPLElBQUMsQ0FBQSxJQURSOztJQURHOztzQkFJUCxZQUFBLEdBQWMsU0FBQyxLQUFEO1FBRVYsb0JBQUcsS0FBSyxDQUFFLGFBQVY7WUFDSSxJQUFDLENBQUEsSUFBRCxHQUFRLEtBQUssQ0FBQyxLQURsQjs7ZUFFQSxJQUFDLENBQUEsU0FBRCxDQUFBO0lBSlU7O3NCQVlkLEtBQUEsR0FBTyxTQUFDLElBQUQ7QUFFSCxZQUFBO1FBQUEsSUFBQyxDQUFBLE9BQUQsQ0FBUyxJQUFUO1FBQ0EsSUFBQyxDQUFBLFNBQUQsQ0FBQTtRQUNBLElBQUEsR0FBTyxJQUFDLENBQUEsT0FBRCxDQUFBO1FBQ1AsSUFBa0IsaUJBQUksSUFBSSxDQUFFLGdCQUE1QjtZQUFBLElBQUEsR0FBTyxJQUFDLENBQUEsSUFBRCxDQUFBLEVBQVA7O2VBQ0E7WUFBQSxJQUFBLEVBQVEsSUFBUjtZQUNBLE1BQUEsRUFBUSxJ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QUEsUUFBRCxHQUFVLENBQUMsSUFBQyxDQUFBLFdBQVcsQ0FBQyxZQUFiLENBQUEsQ0FBQSxHQUE0QixDQUE3QixDQUFBLEdBQWdDLENBQUMsS0FBQSxLQUFPLFNBQVAsSUFBcUIsQ0FBQyxDQUF0QixJQUEyQixDQUE1QixDQUE5RSxDQUFSLEVBRlg7O0FBRlI7ZUFLQTtJQU5vQjs7c0JBUXhCLGVBQUEsR0FBaUIsU0FBQyxLQUFEO1FBRWIsSUFBRyxJQUFDLENBQUEsV0FBVyxDQUFDLG1CQUFiLENBQUEsQ0FBSDtZQUNJLElBQUMsQ0FBQSxRQUFELENBQUE7bUJBQ0EsS0FGSjtTQUFBLE1BR0ssSUFBRyxLQUFBLEtBQVMsS0FBWjttQkFDRCxLQURDO1NBQUEsTUFBQTttQkFHRCxNQUhDOztJQUxROzs7Ozs7QUFVckIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgIFxuIyMjXG5cbnsgcmV2ZXJzZWQsIGhpc3RvcnksIGVtcHR5LCBjbGFtcCwgZWxlbSwga2Vycm9yLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbnN5bnRheCAgICAgID0gcmVxdWlyZSAnLi4vZWRpdG9yL3N5bnRheCdcbkNvbW1hbmRMaXN0ID0gcmVxdWlyZSAnLi9jb21tYW5kbGlzdCdcbmZ1enp5ICAgICAgID0gcmVxdWlyZSAnZnV6enknXG5cbmNsYXNzIENvbW1hbmRcblxuICAgIEA6IChAY29tbWFuZGxpbmUpIC0+XG4gICAgICAgIFxuICAgICAgICBAc3ludGF4TmFtZSA9ICdrbydcbiAgICAgICAgQG1heEhpc3RvcnkgPSAyMFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBzdGF0ZTogLT5cbiAgICAgICAgdGV4dDogIEBnZXRUZXh0KClcbiAgICAgICAgbmFtZTogIEBuYW1lXG4gICAgICAgIFxuICAgIHJlc3RvcmVTdGF0ZTogKHN0YXRlKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgc3RhdGU/Lm5hbWVcbiAgICAgICAgICAgIEBuYW1lID0gc3RhdGUubmFtZVxuICAgICAgICBAbG9hZFN0YXRlKClcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgXG4gICAgc3RhcnQ6IChuYW1lKSAtPlxuICAgICAgICBcbiAgICAgICAgQHNldE5hbWUgbmFtZVxuICAgICAgICBAbG9hZFN0YXRlKClcbiAgICAgICAgdGV4dCA9IEBnZXRUZXh0KClcbiAgICAgICAgdGV4dCA9IEBsYXN0KCkgaWYgbm90IHRleHQ/Lmxlbmd0aFxuICAgICAgICB0ZXh0OiAgIHRleHRcbiAgICAgICAgc2VsZWN0OiB0cnVlXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwXG4gICAgICAgIFxuICAgIGV4ZWN1dGU6IChjb21tYW5kKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgZW1wdHkgY29tbWFuZFxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnbm8gY29tbWFuZCEnXG4gICAgICAgIFxuICAgICAgICBpZiBAY29tbWFuZExpc3Q/IFxuICAgICAgICAgICAgaWYgMCA8PSBAc2VsZWN0ZWQgPCBAY29tbWFuZExpc3QubnVtTGluZXMoKVxuICAgICAgICAgICAgICAgIGNvbW1hbmQgPSBAY29tbWFuZExpc3Q/LmxpbmUgQHNlbGVjdGVkXG4gICAgICAgICAgICBAaGlkZUxpc3QoKVxuICAgICAgICAgICAgXG4gICAgICAgIGNvbW1hbmQgPSBjb21tYW5kLnRyaW0oKVxuICAgICAgICBAc2V0Q3VycmVudCBjb21tYW5kXG4gICAgICAgIGNvbW1hbmRcbiAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwICBcbiAgICBcbiAgICBjaGFuZ2VkOiAoY29tbWFuZCkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGNvbW1hbmRMaXN0P1xuICAgICAgICBcbiAgICAgICAgY29tbWFuZCA9IGNvbW1hbmQudHJpbSgpXG4gICAgICAgIGl0ZW1zID0gQGxpc3RJdGVtcygpXG4gICAgICAgIFxuICAgICAgICBpZiBpdGVtcy5sZW5ndGhcbiAgICAgICAgICAgIGlmIGNvbW1hbmQubGVuZ3RoXG4gICAgICAgICAgICAgICAgZnV6emllZCA9IGZ1enp5LmZpbHRlciBjb21tYW5kLCBpdGVtcywgZXh0cmFjdDogKG8pIC0+IFxuICAgICAgICAgICAgICAgICAgICBpZiBvP1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG8gaWYgXy5pc1N0cmluZyBvXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gby50ZXh0IGlmIF8uaXNTdHJpbmcgby50ZXh0XG4gICAgICAgICAgICAgICAgICAgICcnICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaXRlbXMgPSAoZi5vcmlnaW5hbCBmb3IgZiBpbiBfLnNvcnRCeSBmdXp6aWVkLCAobykgLT4gby5pbmRleClcbiAgICAgICAgICAgIEBzaG93SXRlbXMgQHdlaWdodGVkSXRlbXMgaXRlbXMsIGN1cnJlbnRUZXh0OiBjb21tYW5kXG4gICAgICAgICAgICBAc2VsZWN0IDBcbiAgICAgICAgICAgIEBwb3NpdGlvbkxpc3QoKVxuXG4gICAgd2VpZ2h0OiAoaXRlbSwgb3B0KSAtPlxuICAgICAgICB3ID0gMFxuICAgICAgICB3ICs9IGl0ZW0udGV4dC5zdGFydHNXaXRoKG9wdC5jdXJyZW50VGV4dCkgYW5kIDY1NTM1ICogKG9wdC5jdXJyZW50VGV4dC5sZW5ndGgvaXRlbS50ZXh0Lmxlbmd0aCkgb3IgMCBcbiAgICAgICAgd1xuICAgIFxuICAgIHdlaWdodGVkSXRlbXM6IChpdGVtcywgb3B0KSAtPiBpdGVtcy5zb3J0IChhLGIpID0+IEB3ZWlnaHQoYiwgb3B0KSAtIEB3ZWlnaHQoYSwgb3B0KVxuICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgXG4gICAgY2FuY2VsOiAtPlxuICAgICAgICBcbiAgICAgICAgQGhpZGVMaXN0KCkgICAgICAgIFxuICAgICAgICB0ZXh0OiAnJ1xuICAgICAgICBmb2N1czogQHJlY2VpdmVyXG4gICAgICAgIHNob3c6ICdlZGl0b3InXG4gICAgICAgIFxuICAgIGNsZWFyOiAtPlxuICAgICAgICBpZiB3aW5kb3cudGVybWluYWwubnVtTGluZXMoKSA+IDBcbiAgICAgICAgICAgIHdpbmRvdy50ZXJtaW5hbC5jbGVhcigpXG4gICAgICAgICAgICB7fVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0ZXh0OiAnJ1xuICAgIFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICBcblxuICAgIHNob3dMaXN0OiAtPlxuXG4gICAgICAgIGlmIG5vdCBAY29tbWFuZExpc3Q/XG4gICAgICAgICAgICBsaXN0VmlldyA9IGVsZW0gY2xhc3M6IFwiY29tbWFuZGxpc3QgI3tAcHJlZnNJRH1cIlxuICAgICAgICAgICAgd2luZG93LnNwbGl0LmVsZW0uYXBwZW5kQ2hpbGQgbGlzdFZpZXdcbiAgICAgICAgICAgIEBjb21tYW5kTGlzdCA9IG5ldyBDb21tYW5kTGlzdCBALCAnLmNvbW1hbmRsaXN0JyBzeW50YXhOYW1lOkBzeW50YXhOYW1lXG4gICAgXG4gICAgbGlzdEl0ZW1zOiAoKSAtPiByZXZlcnNlZCBAaGlzdG9yeVxuXG4gICAgc2hvd0l0ZW1zOiAoaXRlbXMpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBjb21tYW5kTGlzdD8gYW5kIG5vdCBpdGVtcy5sZW5ndGhcbiAgICAgICAgcmV0dXJuIEBoaWRlTGlzdCgpIGlmIG5vdCBpdGVtcy5sZW5ndGhcbiAgICAgICAgQHNob3dMaXN0KCkgaWYgbm90IEBjb21tYW5kTGlzdD9cbiAgICAgICAgQGNvbW1hbmRMaXN0LmFkZEl0ZW1zIGl0ZW1zXG4gICAgICAgIEBwb3NpdGlvbkxpc3QoKVxuICAgIFxuICAgIGxpc3RDbGljazogKGluZGV4KSA9PlxuICAgICAgICBcbiAgICAgICAgQHNlbGVjdGVkID0gaW5kZXhcbiAgICAgICAgQGV4ZWN1dGUgQGNvbW1hbmRMaXN0LmxpbmUgaW5kZXggXG4gICAgXG4gICAgb25Cb3Q6IChib3QpID0+IEBwb3NpdGlvbkxpc3QoKVxuICAgIFxuICAgIHBvc2l0aW9uTGlzdDogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGNvbW1hbmRMaXN0P1xuICAgICAgICBmbGV4ID0gd2luZG93LnNwbGl0LmZsZXhcbiAgICAgICAgZmxleC51cGRhdGUoKVxuICAgICAgICBsaXN0VG9wID0gZmxleC5wb3NPZlBhbmUgMiBcbiAgICAgICAgbGlzdEhlaWdodCA9IEBjb21tYW5kTGlzdC52aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodFxuICAgICAgICBzcGFjZUJlbG93ID0gZmxleC5zaXplKCkgLSBsaXN0VG9wXG4gICAgICAgIGlmIHNwYWNlQmVsb3cgPCBsaXN0SGVpZ2h0XG4gICAgICAgICAgICBpZiBmbGV4LnNpemVPZlBhbmUoMCkgPiBzcGFjZUJlbG93XG4gICAgICAgICAgICAgICAgbGlzdFRvcCA9IGZsZXgucG9zT2ZIYW5kbGUoMCkgLSBsaXN0SGVpZ2h0XG4gICAgICAgICAgICAgICAgaWYgbGlzdFRvcCA8IDBcbiAgICAgICAgICAgICAgICAgICAgQGNvbW1hbmRMaXN0LnZpZXcuc3R5bGUuaGVpZ2h0ID0gXCIje2xpc3RIZWlnaHQrbGlzdFRvcH1weFwiXG4gICAgICAgICAgICAgICAgICAgIGxpc3RUb3AgPSAwXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGNvbW1hbmRMaXN0LnZpZXcuc3R5bGUuaGVpZ2h0ID0gXCIje3NwYWNlQmVsb3d9cHhcIlxuICAgICAgICBAY29tbWFuZExpc3Q/LnZpZXcuc3R5bGUudG9wID0gXCIje2xpc3RUb3B9cHhcIlxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwICAgXG4gICAgICAgIFxuICAgIHNlbGVjdDogKGkpIC0+IFxuICAgICAgICByZXR1cm4gaWYgbm90IEBjb21tYW5kTGlzdD9cbiAgICAgICAgQHNlbGVjdGVkID0gY2xhbXAgLTEsIEBjb21tYW5kTGlzdC5udW1MaW5lcygpLTEsIGlcbiAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgIEBjb21tYW5kTGlzdC5zZWxlY3RTaW5nbGVSYW5nZSBAY29tbWFuZExpc3QucmFuZ2VGb3JMaW5lQXRJbmRleChAc2VsZWN0ZWQpLCBiZWZvcmU6dHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAY29tbWFuZExpc3Quc2luZ2xlQ3Vyc29yQXRQb3MgWzAsMF0gXG4gICAgICAgIEBjb21tYW5kTGlzdC5zY3JvbGwuY3Vyc29ySW50b1ZpZXcoKVxuICAgICAgICAgICAgICAgIFxuICAgIHNlbGVjdExpc3RJdGVtOiAoZGlyKSAtPlxuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGRpclxuICAgICAgICAgICAgd2hlbiAndXAnICAgdGhlbiBAc2V0QW5kU2VsZWN0VGV4dCBAcHJldigpXG4gICAgICAgICAgICB3aGVuICdkb3duJyB0aGVuIEBzZXRBbmRTZWxlY3RUZXh0IEBuZXh0KClcbiAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAgMDAwIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgIDAgICAgXG4gICAgICAgICAgICBcbiAgICBwcmV2OiAtPiBcbiAgICAgICAgaWYgQGNvbW1hbmRMaXN0P1xuICAgICAgICAgICAgQHNlbGVjdCBjbGFtcCAtMSwgQGNvbW1hbmRMaXN0Lm51bUxpbmVzKCktMSwgQHNlbGVjdGVkLTFcbiAgICAgICAgICAgIGlmIEBzZWxlY3RlZCA8IDBcbiAgICAgICAgICAgICAgICBAaGlkZUxpc3QoKSBcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gQGNvbW1hbmRMaXN0LmxpbmUoQHNlbGVjdGVkKVxuICAgICAgICBlbHNlICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBAc2VsZWN0ZWQgPCAwXG4gICAgICAgICAgICAgICAgQHNlbGVjdGVkID0gQGhpc3RvcnkubGVuZ3RoLTEgXG4gICAgICAgICAgICBlbHNlIGlmIEBzZWxlY3RlZCA+IDBcbiAgICAgICAgICAgICAgICBAc2VsZWN0ZWQgLT0gMVxuICAgICAgICAgICAgcmV0dXJuIEBoaXN0b3J5W0BzZWxlY3RlZF1cbiAgICAgICAgJydcbiAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICBcbiAgICBuZXh0OiAtPiBcbiAgICAgICAgaWYgbm90IEBjb21tYW5kTGlzdD8gYW5kIEBsaXN0SXRlbXMoKS5sZW5ndGhcbiAgICAgICAgICAgIEBzaG93SXRlbXMgQGxpc3RJdGVtcygpIFxuICAgICAgICAgICAgQHNlbGVjdCAtMVxuICAgICAgICBpZiBAY29tbWFuZExpc3Q/IFxuICAgICAgICAgICAgQHNlbGVjdCBjbGFtcCAwLCBAY29tbWFuZExpc3QubnVtTGluZXMoKS0xLCBAc2VsZWN0ZWQrMVxuICAgICAgICAgICAgcmV0dXJuIEBjb21tYW5kTGlzdC5saW5lKEBzZWxlY3RlZClcbiAgICAgICAgZWxzZSBpZiBAaGlzdG9yeS5sZW5ndGhcbiAgICAgICAgICAgIEBzZWxlY3RlZCA9IGNsYW1wIDAsIEBoaXN0b3J5Lmxlbmd0aC0xLCBAc2VsZWN0ZWQrMVxuICAgICAgICAgICAgcmV0dXJuIG5ldyBAaGlzdG9yeVtAc2VsZWN0ZWRdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzZWxlY3RlZCA9IC0xXG4gICAgICAgICAgICByZXR1cm4gJydcblxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwXG4gICAgICAgICBcbiAgICBvbkJsdXI6ID0+IFxuICAgICAgICBcbiAgICAgICAgaWYgbm90IEBza2lwQmx1clxuICAgICAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHNraXBCbHVyID0gbnVsbFxuICAgICAgICAgICAgXG4gICAgaGlkZUxpc3Q6IC0+XG5cbiAgICAgICAgQHNlbGVjdGVkID0gLTFcbiAgICAgICAgQGNvbW1hbmRMaXN0Py5kZWwoKVxuICAgICAgICBAY29tbWFuZExpc3Q/LnZpZXc/LnJlbW92ZSgpXG4gICAgICAgIEBjb21tYW5kTGlzdCA9IG51bGxcblxuICAgIGNhbmNlbExpc3Q6IC0+IEBoaWRlTGlzdCgpXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICBcbiAgICBoaXN0b3J5S2V5OiAtPiAnaGlzdG9yeSdcbiAgICBcbiAgICBjbGVhckhpc3Rvcnk6IC0+XG4gICAgICAgIFxuICAgICAgICBAaGlzdG9yeSA9IFtdXG4gICAgICAgIEBzZWxlY3RlZCA9IC0xXG4gICAgICAgIEBzZXRTdGF0ZSBAaGlzdG9yeUtleSgpLCBAaGlzdG9yeVxuICAgXG4gICAgc2V0SGlzdG9yeTogKEBoaXN0b3J5KSAtPlxuICAgICAgICBcbiAgICAgICAgQHNldFN0YXRlIEBoaXN0b3J5S2V5KCksIEBoaXN0b3J5XG4gICAgXG4gICAgc2V0Q3VycmVudDogKGNvbW1hbmQpIC0+XG4gICAgICAgIFxuICAgICAgICBAbG9hZFN0YXRlKCkgaWYgbm90IEBoaXN0b3J5P1xuICAgICAgICBpZiBub3QgXy5pc0FycmF5IEBoaXN0b3J5XG4gICAgICAgICAgICBrZXJyb3IgXCJDb21tYW5kLnNldEN1cnJlbnQgLS0gI3tAaGlzdG9yeUtleSgpfSA6IGhpc3Rvcnkgbm90IGFuIGFycmF5P1wiIHR5cGVvZiBAaGlzdG9yeSBcbiAgICAgICAgICAgIEBoaXN0b3J5ID0gW11cbiAgICAgICAgXy5wdWxsIEBoaXN0b3J5LCBjb21tYW5kXG4gICAgICAgIEBoaXN0b3J5LnB1c2ggY29tbWFuZCBpZiBjb21tYW5kLnRyaW0oKS5sZW5ndGhcbiAgICAgICAgd2hpbGUgQGhpc3RvcnkubGVuZ3RoID4gQG1heEhpc3RvcnlcbiAgICAgICAgICAgIEBoaXN0b3J5LnNoaWZ0KClcbiAgICAgICAgQHNlbGVjdGVkID0gQGhpc3RvcnkubGVuZ3RoLTFcbiAgICAgICAgQHNldFN0YXRlIEBoaXN0b3J5S2V5KCksIEBoaXN0b3J5XG4gICAgICAgIFxuICAgIGN1cnJlbnQ6IC0+IEBoaXN0b3J5W0BzZWxlY3RlZF0gPyAnJ1xuICAgICAgICBcbiAgICBsYXN0OiAtPlxuICAgICAgICBpZiBAY29tbWFuZExpc3Q/XG4gICAgICAgICAgICBAc2VsZWN0ZWQgPSBAY29tbWFuZExpc3QubnVtTGluZXMoKS0xXG4gICAgICAgICAgICBAY29tbWFuZExpc3QubGluZShAc2VsZWN0ZWQpXG4gICAgICAgIGVsc2UgICAgICAgICAgICBcbiAgICAgICAgICAgIEBzZWxlY3RlZCA9IEBoaXN0b3J5Lmxlbmd0aC0xXG4gICAgICAgICAgICByZXR1cm4gQGhpc3RvcnlbQHNlbGVjdGVkXSBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICAnJ1xuICAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgIFxuICAgIHNldFRleHQ6ICh0KSAtPiBcbiAgICAgICAgQGN1cnJlbnRUZXh0ID0gdFxuICAgICAgICBAY29tbWFuZGxpbmUuc2V0VGV4dCB0XG4gICAgICAgIFxuICAgIHNldEFuZFNlbGVjdFRleHQ6ICh0KSAtPiBcbiAgICAgICAgQGN1cnJlbnRUZXh0ID0gdFxuICAgICAgICBAY29tbWFuZGxpbmUuc2V0QW5kU2VsZWN0VGV4dCB0XG4gICAgICAgIFxuICAgIGdldFRleHQ6IC0+IEBjb21tYW5kbGluZS5saW5lKDApXG4gICAgICAgIFxuICAgIHNldE5hbWU6IChuKSAtPlxuICAgICAgICBAbmFtZSA9IG5cbiAgICAgICAgQGNvbW1hbmRsaW5lLnNldE5hbWUgblxuXG4gICAgY29tcGxldGU6IC0+IFxuICAgICAgICByZXR1cm4gaWYgbm90IEBjb21tYW5kTGlzdD8gXG4gICAgICAgIGlmIEBjb21tYW5kTGlzdC5saW5lKEBzZWxlY3RlZCkgIT0gQGdldFRleHQoKSBhbmQgQGNvbW1hbmRMaXN0LmxpbmUoQHNlbGVjdGVkKS5zdGFydHNXaXRoIEBnZXRUZXh0KClcbiAgICAgICAgICAgIEBzZXRUZXh0IEBjb21tYW5kTGlzdC5saW5lKEBzZWxlY3RlZClcbiAgICAgICAgICAgIHRydWVcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgIFxuICAgIGdyYWJGb2N1czogLT4gQGNvbW1hbmRsaW5lLmZvY3VzKClcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgc2V0UmVjZWl2ZXI6IChyZWNlaXZlcikgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiByZWNlaXZlciA9PSAnYm9keSdcbiAgICAgICAgQHJlY2VpdmVyID0gcmVjZWl2ZXIgPyAnZWRpdG9yJ1xuXG4gICAgcmVjZWl2aW5nRWRpdG9yOiAtPiB3aW5kb3cuZWRpdG9yV2l0aE5hbWUgQHJlY2VpdmVyXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHNldFByZWZzSUQ6IChpZCkgLT5cbiAgICAgICAgQHByZWZzSUQgPSBpZFxuICAgICAgICBAbG9hZFN0YXRlKClcbiAgICAgICAgXG4gICAgbG9hZFN0YXRlOiAtPlxuICAgICAgICBAaGlzdG9yeSA9IEBnZXRTdGF0ZSBAaGlzdG9yeUtleSgpLCBbXVxuICAgICAgICBAc2VsZWN0ZWQgPSBAaGlzdG9yeS5sZW5ndGgtMVxuXG4gICAgc2V0U3RhdGU6IChrZXksIHZhbHVlKSAtPlxuICAgICAgICByZXR1cm4gaWYgbm90IEBwcmVmc0lEXG4gICAgICAgIGlmIEBwcmVmc0lEXG4gICAgICAgICAgICB3aW5kb3cuc3RhdGUuc2V0IFwiY29tbWFuZHwje0BwcmVmc0lEfXwje2tleX1cIiwgdmFsdWVcbiAgICAgICAgXG4gICAgZ2V0U3RhdGU6IChrZXksIHZhbHVlKSAtPlxuICAgICAgICByZXR1cm4gdmFsdWUgaWYgbm90IEBwcmVmc0lEXG4gICAgICAgIHdpbmRvdy5zdGF0ZS5nZXQgXCJjb21tYW5kfCN7QHByZWZzSUR9fCN7a2V5fVwiLCB2YWx1ZVxuICAgICAgICBcbiAgICBkZWxTdGF0ZTogKGtleSkgLT5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAcHJlZnNJRFxuICAgICAgICB3aW5kb3cuc3RhdGUuZGVsIFwiY29tbWFuZHwje0BwcmVmc0lEfXwje2tleX1cIlxuXG4gICAgaXNBY3RpdmU6IC0+IEBjb21tYW5kbGluZS5jb21tYW5kID09IEBcbiAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgIFxuICAgIFxuICAgIGdsb2JhbE1vZEtleUNvbWJvRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGV2ZW50KSAtPiAndW5oYW5kbGVkJ1xuICAgICAgICBcbiAgICBoYW5kbGVNb2RLZXlDb21ib0V2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBldmVudCkgLT4gXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAncGFnZSB1cCcsICdwYWdlIGRvd24nXG4gICAgICAgICAgICAgICAgaWYgQGNvbW1hbmRMaXN0P1xuICAgICAgICAgICAgICAgICAgICAjIHJldHVybiBAc2VsZWN0IGNsYW1wIDAsIEBjb21tYW5kTGlzdC5udW1MaW5lcygpLCBAc2VsZWN0ZWQrQGNvbW1hbmRMaXN0Lm1heExpbmVzKihjb21ibz09J3BhZ2UgdXAnIGFuZCAtMSBvciAxKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gQHNlbGVjdCBjbGFtcCAwLCBAY29tbWFuZExpc3QubnVtTGluZXMoKS0xLCBAc2VsZWN0ZWQrKEBjb21tYW5kTGlzdC5udW1GdWxsTGluZXMoKS0xKSooY29tYm89PSdwYWdlIHVwJyBhbmQgLTEgb3IgMSlcbiAgICAgICAgJ3VuaGFuZGxlZCdcblxuICAgIG9uVGFiQ29tcGxldGlvbjogKGNvbWJvKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQGNvbW1hbmRsaW5lLmlzQ3Vyc29yQXRFbmRPZkxpbmUoKVxuICAgICAgICAgICAgQGNvbXBsZXRlKClcbiAgICAgICAgICAgIHRydWVcbiAgICAgICAgZWxzZSBpZiBjb21ibyA9PSAndGFiJyBcbiAgICAgICAgICAgIHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZmFsc2VcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IENvbW1hbmRcbiJdfQ==
//# sourceURL=../../coffee/commandline/command.coffee