// koffee 1.4.0

/*
 0000000   0000000   00     00  00     00   0000000   000   000  0000000  
000       000   000  000   000  000   000  000   000  0000  000  000   000
000       000   000  000000000  000000000  000000000  000 0 000  000   000
000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000
 0000000   0000000   000   000  000   000  000   000  000   000  0000000
 */
var Command, CommandList, _, clamp, elem, empty, fuzzy, kerror, ref, reversed, syntax,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), reversed = ref.reversed, clamp = ref.clamp, empty = ref.empty, elem = ref.elem, kerror = ref.kerror, _ = ref._;

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

    Command.prototype.setHistory = function(history) {
        this.history = history;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsaUZBQUE7SUFBQTs7QUFRQSxNQUE4QyxPQUFBLENBQVEsS0FBUixDQUE5QyxFQUFFLHVCQUFGLEVBQVksaUJBQVosRUFBbUIsaUJBQW5CLEVBQTBCLGVBQTFCLEVBQWdDLG1CQUFoQyxFQUF3Qzs7QUFFeEMsTUFBQSxHQUFjLE9BQUEsQ0FBUSxrQkFBUjs7QUFDZCxXQUFBLEdBQWMsT0FBQSxDQUFRLGVBQVI7O0FBQ2QsS0FBQSxHQUFjLE9BQUEsQ0FBUSxPQUFSOztBQUVSO0lBRVcsaUJBQUMsV0FBRDtRQUFDLElBQUMsQ0FBQSxjQUFEOzs7O1FBRVYsSUFBQyxDQUFBLFVBQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxVQUFELEdBQWM7SUFITDs7c0JBV2IsS0FBQSxHQUFPLFNBQUE7ZUFDSDtZQUFBLElBQUEsRUFBTyxJQUFDLENBQUEsT0FBRCxDQUFBLENBQVA7WUFDQSxJQUFBLEVBQU8sSUFBQyxDQUFBLElBRFI7O0lBREc7O3NCQUlQLFlBQUEsR0FBYyxTQUFDLEtBQUQ7UUFFVixvQkFBRyxLQUFLLENBQUUsYUFBVjtZQUNJLElBQUMsQ0FBQSxJQUFELEdBQVEsS0FBSyxDQUFDLEtBRGxCOztlQUVBLElBQUMsQ0FBQSxTQUFELENBQUE7SUFKVTs7c0JBWWQsS0FBQSxHQUFPLFNBQUMsSUFBRDtBQUVILFlBQUE7UUFBQSxJQUFDLENBQUEsT0FBRCxDQUFTLElBQVQ7UUFDQSxJQUFDLENBQUEsU0FBRCxDQUFBO1FBQ0EsSUFBQSxHQUFPLElBQUMsQ0FBQSxPQUFELENBQUE7UUFDUCxJQUFrQixpQkFBSSxJQUFJLENBQUUsZ0JBQTVCO1lBQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxJQUFELENBQUEsRUFBUDs7ZUFDQTtZQUFBLElBQUEsRUFBUSxJQUFSO1lBQ0EsTUFBQSxFQUFRLElBRFI7O0lBTkc7O3NC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Q0FBQyxJQUFDLENBQUEsV0FBVyxDQUFDLFlBQWIsQ0FBQSxDQUFBLEdBQTRCLENBQTdCLENBQUEsR0FBZ0MsQ0FBQyxLQUFBLEtBQU8sU0FBUCxJQUFxQixDQUFDLENBQXRCLElBQTJCLENBQTVCLENBQTlFLENBQVIsRUFGWDs7QUFGUjtlQUtBO0lBTm9COztzQkFReEIsZUFBQSxHQUFpQixTQUFDLEtBQUQ7UUFFYixJQUFHLElBQUMsQ0FBQSxXQUFXLENBQUMsbUJBQWIsQ0FBQSxDQUFIO1lBQ0ksSUFBQyxDQUFBLFFBQUQsQ0FBQTttQkFDQSxLQUZKO1NBQUEsTUFHSyxJQUFHLEtBQUEsS0FBUyxLQUFaO21CQUNELEtBREM7U0FBQSxNQUFBO21CQUdELE1BSEM7O0lBTFE7Ozs7OztBQVVyQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDBcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgXG4jIyNcblxueyByZXZlcnNlZCwgY2xhbXAsIGVtcHR5LCBlbGVtLCBrZXJyb3IsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuc3ludGF4ICAgICAgPSByZXF1aXJlICcuLi9lZGl0b3Ivc3ludGF4J1xuQ29tbWFuZExpc3QgPSByZXF1aXJlICcuL2NvbW1hbmRsaXN0J1xuZnV6enkgICAgICAgPSByZXF1aXJlICdmdXp6eSdcblxuY2xhc3MgQ29tbWFuZFxuXG4gICAgY29uc3RydWN0b3I6IChAY29tbWFuZGxpbmUpIC0+XG4gICAgICAgIFxuICAgICAgICBAc3ludGF4TmFtZSA9ICdrbydcbiAgICAgICAgQG1heEhpc3RvcnkgPSAyMFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBzdGF0ZTogLT5cbiAgICAgICAgdGV4dDogIEBnZXRUZXh0KClcbiAgICAgICAgbmFtZTogIEBuYW1lXG4gICAgICAgIFxuICAgIHJlc3RvcmVTdGF0ZTogKHN0YXRlKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgc3RhdGU/Lm5hbWVcbiAgICAgICAgICAgIEBuYW1lID0gc3RhdGUubmFtZVxuICAgICAgICBAbG9hZFN0YXRlKClcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgXG4gICAgc3RhcnQ6IChuYW1lKSAtPlxuICAgICAgICBcbiAgICAgICAgQHNldE5hbWUgbmFtZVxuICAgICAgICBAbG9hZFN0YXRlKClcbiAgICAgICAgdGV4dCA9IEBnZXRUZXh0KClcbiAgICAgICAgdGV4dCA9IEBsYXN0KCkgaWYgbm90IHRleHQ/Lmxlbmd0aFxuICAgICAgICB0ZXh0OiAgIHRleHRcbiAgICAgICAgc2VsZWN0OiB0cnVlXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwXG4gICAgICAgIFxuICAgIGV4ZWN1dGU6IChjb21tYW5kKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgZW1wdHkgY29tbWFuZFxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnbm8gY29tbWFuZCEnXG4gICAgICAgIFxuICAgICAgICBpZiBAY29tbWFuZExpc3Q/IFxuICAgICAgICAgICAgaWYgMCA8PSBAc2VsZWN0ZWQgPCBAY29tbWFuZExpc3QubnVtTGluZXMoKVxuICAgICAgICAgICAgICAgIGNvbW1hbmQgPSBAY29tbWFuZExpc3Q/LmxpbmUgQHNlbGVjdGVkXG4gICAgICAgICAgICBAaGlkZUxpc3QoKVxuICAgICAgICAgICAgXG4gICAgICAgIGNvbW1hbmQgPSBjb21tYW5kLnRyaW0oKVxuICAgICAgICBAc2V0Q3VycmVudCBjb21tYW5kXG4gICAgICAgIGNvbW1hbmRcbiAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwICBcbiAgICBcbiAgICBjaGFuZ2VkOiAoY29tbWFuZCkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGNvbW1hbmRMaXN0P1xuICAgICAgICBcbiAgICAgICAgY29tbWFuZCA9IGNvbW1hbmQudHJpbSgpXG4gICAgICAgIGl0ZW1zID0gQGxpc3RJdGVtcygpXG4gICAgICAgIFxuICAgICAgICBpZiBpdGVtcy5sZW5ndGhcbiAgICAgICAgICAgIGlmIGNvbW1hbmQubGVuZ3RoXG4gICAgICAgICAgICAgICAgZnV6emllZCA9IGZ1enp5LmZpbHRlciBjb21tYW5kLCBpdGVtcywgZXh0cmFjdDogKG8pIC0+IFxuICAgICAgICAgICAgICAgICAgICBpZiBvP1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG8gaWYgXy5pc1N0cmluZyBvXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gby50ZXh0IGlmIF8uaXNTdHJpbmcgby50ZXh0XG4gICAgICAgICAgICAgICAgICAgICcnICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaXRlbXMgPSAoZi5vcmlnaW5hbCBmb3IgZiBpbiBfLnNvcnRCeSBmdXp6aWVkLCAobykgLT4gby5pbmRleClcbiAgICAgICAgICAgIEBzaG93SXRlbXMgQHdlaWdodGVkSXRlbXMgaXRlbXMsIGN1cnJlbnRUZXh0OiBjb21tYW5kXG4gICAgICAgICAgICBAc2VsZWN0IDBcbiAgICAgICAgICAgIEBwb3NpdGlvbkxpc3QoKVxuXG4gICAgd2VpZ2h0OiAoaXRlbSwgb3B0KSAtPlxuICAgICAgICB3ID0gMFxuICAgICAgICB3ICs9IGl0ZW0udGV4dC5zdGFydHNXaXRoKG9wdC5jdXJyZW50VGV4dCkgYW5kIDY1NTM1ICogKG9wdC5jdXJyZW50VGV4dC5sZW5ndGgvaXRlbS50ZXh0Lmxlbmd0aCkgb3IgMCBcbiAgICAgICAgd1xuICAgIFxuICAgIHdlaWdodGVkSXRlbXM6IChpdGVtcywgb3B0KSAtPiBpdGVtcy5zb3J0IChhLGIpID0+IEB3ZWlnaHQoYiwgb3B0KSAtIEB3ZWlnaHQoYSwgb3B0KVxuICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgXG4gICAgY2FuY2VsOiAtPlxuICAgICAgICBcbiAgICAgICAgQGhpZGVMaXN0KCkgICAgICAgIFxuICAgICAgICB0ZXh0OiAnJ1xuICAgICAgICBmb2N1czogQHJlY2VpdmVyXG4gICAgICAgIHNob3c6ICdlZGl0b3InXG4gICAgICAgIFxuICAgIGNsZWFyOiAtPlxuICAgICAgICBpZiB3aW5kb3cudGVybWluYWwubnVtTGluZXMoKSA+IDBcbiAgICAgICAgICAgIHdpbmRvdy50ZXJtaW5hbC5jbGVhcigpXG4gICAgICAgICAgICB7fVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0ZXh0OiAnJ1xuICAgIFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICBcblxuICAgIHNob3dMaXN0OiAtPlxuXG4gICAgICAgIGlmIG5vdCBAY29tbWFuZExpc3Q/XG4gICAgICAgICAgICBsaXN0VmlldyA9IGVsZW0gY2xhc3M6IFwiY29tbWFuZGxpc3QgI3tAcHJlZnNJRH1cIlxuICAgICAgICAgICAgd2luZG93LnNwbGl0LmVsZW0uYXBwZW5kQ2hpbGQgbGlzdFZpZXdcbiAgICAgICAgICAgIEBjb21tYW5kTGlzdCA9IG5ldyBDb21tYW5kTGlzdCBALCAnLmNvbW1hbmRsaXN0Jywgc3ludGF4TmFtZTogQHN5bnRheE5hbWVcbiAgICBcbiAgICBsaXN0SXRlbXM6ICgpIC0+IHJldmVyc2VkIEBoaXN0b3J5XG5cbiAgICBzaG93SXRlbXM6IChpdGVtcykgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGNvbW1hbmRMaXN0PyBhbmQgbm90IGl0ZW1zLmxlbmd0aFxuICAgICAgICByZXR1cm4gQGhpZGVMaXN0KCkgaWYgbm90IGl0ZW1zLmxlbmd0aFxuICAgICAgICBAc2hvd0xpc3QoKSBpZiBub3QgQGNvbW1hbmRMaXN0P1xuICAgICAgICBAY29tbWFuZExpc3QuYWRkSXRlbXMgaXRlbXNcbiAgICAgICAgQHBvc2l0aW9uTGlzdCgpXG4gICAgXG4gICAgbGlzdENsaWNrOiAoaW5kZXgpID0+XG4gICAgICAgIFxuICAgICAgICBAc2VsZWN0ZWQgPSBpbmRleFxuICAgICAgICBAZXhlY3V0ZSBAY29tbWFuZExpc3QubGluZSBpbmRleCBcbiAgICBcbiAgICBvbkJvdDogKGJvdCkgPT4gQHBvc2l0aW9uTGlzdCgpXG4gICAgXG4gICAgcG9zaXRpb25MaXN0OiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY29tbWFuZExpc3Q/XG4gICAgICAgIGZsZXggPSB3aW5kb3cuc3BsaXQuZmxleFxuICAgICAgICBmbGV4LnVwZGF0ZSgpXG4gICAgICAgIGxpc3RUb3AgPSBmbGV4LnBvc09mUGFuZSAyIFxuICAgICAgICBsaXN0SGVpZ2h0ID0gQGNvbW1hbmRMaXN0LnZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0XG4gICAgICAgIHNwYWNlQmVsb3cgPSBmbGV4LnNpemUoKSAtIGxpc3RUb3BcbiAgICAgICAgaWYgc3BhY2VCZWxvdyA8IGxpc3RIZWlnaHRcbiAgICAgICAgICAgIGlmIGZsZXguc2l6ZU9mUGFuZSgwKSA+IHNwYWNlQmVsb3dcbiAgICAgICAgICAgICAgICBsaXN0VG9wID0gZmxleC5wb3NPZkhhbmRsZSgwKSAtIGxpc3RIZWlnaHRcbiAgICAgICAgICAgICAgICBpZiBsaXN0VG9wIDwgMFxuICAgICAgICAgICAgICAgICAgICBAY29tbWFuZExpc3Qudmlldy5zdHlsZS5oZWlnaHQgPSBcIiN7bGlzdEhlaWdodCtsaXN0VG9wfXB4XCJcbiAgICAgICAgICAgICAgICAgICAgbGlzdFRvcCA9IDBcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAY29tbWFuZExpc3Qudmlldy5zdHlsZS5oZWlnaHQgPSBcIiN7c3BhY2VCZWxvd31weFwiXG4gICAgICAgIEBjb21tYW5kTGlzdD8udmlldy5zdHlsZS50b3AgPSBcIiN7bGlzdFRvcH1weFwiXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAgICBcbiAgICAgICAgXG4gICAgc2VsZWN0OiAoaSkgLT4gXG4gICAgICAgIHJldHVybiBpZiBub3QgQGNvbW1hbmRMaXN0P1xuICAgICAgICBAc2VsZWN0ZWQgPSBjbGFtcCAtMSwgQGNvbW1hbmRMaXN0Lm51bUxpbmVzKCktMSwgaVxuICAgICAgICBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICAgICAgQGNvbW1hbmRMaXN0LnNlbGVjdFNpbmdsZVJhbmdlIEBjb21tYW5kTGlzdC5yYW5nZUZvckxpbmVBdEluZGV4KEBzZWxlY3RlZCksIGJlZm9yZTp0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBjb21tYW5kTGlzdC5zaW5nbGVDdXJzb3JBdFBvcyBbMCwwXSBcbiAgICAgICAgQGNvbW1hbmRMaXN0LnNjcm9sbC5jdXJzb3JJbnRvVmlldygpXG4gICAgICAgICAgICAgICAgXG4gICAgc2VsZWN0TGlzdEl0ZW06IChkaXIpIC0+XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggZGlyXG4gICAgICAgICAgICB3aGVuICd1cCcgICB0aGVuIEBzZXRBbmRTZWxlY3RUZXh0IEBwcmV2KClcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nIHRoZW4gQHNldEFuZFNlbGVjdFRleHQgQG5leHQoKVxuICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMCAwMDAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAgMCAgICBcbiAgICAgICAgICAgIFxuICAgIHByZXY6IC0+IFxuICAgICAgICBpZiBAY29tbWFuZExpc3Q/XG4gICAgICAgICAgICBAc2VsZWN0IGNsYW1wIC0xLCBAY29tbWFuZExpc3QubnVtTGluZXMoKS0xLCBAc2VsZWN0ZWQtMVxuICAgICAgICAgICAgaWYgQHNlbGVjdGVkIDwgMFxuICAgICAgICAgICAgICAgIEBoaWRlTGlzdCgpIFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBAY29tbWFuZExpc3QubGluZShAc2VsZWN0ZWQpXG4gICAgICAgIGVsc2UgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEBzZWxlY3RlZCA8IDBcbiAgICAgICAgICAgICAgICBAc2VsZWN0ZWQgPSBAaGlzdG9yeS5sZW5ndGgtMSBcbiAgICAgICAgICAgIGVsc2UgaWYgQHNlbGVjdGVkID4gMFxuICAgICAgICAgICAgICAgIEBzZWxlY3RlZCAtPSAxXG4gICAgICAgICAgICByZXR1cm4gQGhpc3RvcnlbQHNlbGVjdGVkXVxuICAgICAgICAnJ1xuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgIFxuICAgIG5leHQ6IC0+IFxuICAgICAgICBpZiBub3QgQGNvbW1hbmRMaXN0PyBhbmQgQGxpc3RJdGVtcygpLmxlbmd0aFxuICAgICAgICAgICAgQHNob3dJdGVtcyBAbGlzdEl0ZW1zKCkgXG4gICAgICAgICAgICBAc2VsZWN0IC0xXG4gICAgICAgIGlmIEBjb21tYW5kTGlzdD8gXG4gICAgICAgICAgICBAc2VsZWN0IGNsYW1wIDAsIEBjb21tYW5kTGlzdC5udW1MaW5lcygpLTEsIEBzZWxlY3RlZCsxXG4gICAgICAgICAgICByZXR1cm4gQGNvbW1hbmRMaXN0LmxpbmUoQHNlbGVjdGVkKVxuICAgICAgICBlbHNlIGlmIEBoaXN0b3J5Lmxlbmd0aFxuICAgICAgICAgICAgQHNlbGVjdGVkID0gY2xhbXAgMCwgQGhpc3RvcnkubGVuZ3RoLTEsIEBzZWxlY3RlZCsxXG4gICAgICAgICAgICByZXR1cm4gbmV3IEBoaXN0b3J5W0BzZWxlY3RlZF1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHNlbGVjdGVkID0gLTFcbiAgICAgICAgICAgIHJldHVybiAnJ1xuXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDBcbiAgICAgICAgIFxuICAgIG9uQmx1cjogPT4gXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQHNraXBCbHVyXG4gICAgICAgICAgICBAaGlkZUxpc3QoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc2tpcEJsdXIgPSBudWxsXG4gICAgICAgICAgICBcbiAgICBoaWRlTGlzdDogLT5cblxuICAgICAgICBAc2VsZWN0ZWQgPSAtMVxuICAgICAgICBAY29tbWFuZExpc3Q/LmRlbCgpXG4gICAgICAgIEBjb21tYW5kTGlzdD8udmlldz8ucmVtb3ZlKClcbiAgICAgICAgQGNvbW1hbmRMaXN0ID0gbnVsbFxuXG4gICAgY2FuY2VsTGlzdDogLT4gQGhpZGVMaXN0KClcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAgMDAwIFxuICAgICMgMDAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgIFxuICAgIGhpc3RvcnlLZXk6IC0+ICdoaXN0b3J5J1xuICAgIFxuICAgIGNsZWFySGlzdG9yeTogLT5cbiAgICAgICAgXG4gICAgICAgIEBoaXN0b3J5ID0gW11cbiAgICAgICAgQHNlbGVjdGVkID0gLTFcbiAgICAgICAgQHNldFN0YXRlIEBoaXN0b3J5S2V5KCksIEBoaXN0b3J5XG4gICBcbiAgICBzZXRIaXN0b3J5OiAoQGhpc3RvcnkpIC0+XG4gICAgICAgIFxuICAgICAgICBAc2V0U3RhdGUgQGhpc3RvcnlLZXkoKSwgQGhpc3RvcnlcbiAgICBcbiAgICBzZXRDdXJyZW50OiAoY29tbWFuZCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBsb2FkU3RhdGUoKSBpZiBub3QgQGhpc3Rvcnk/XG4gICAgICAgIGlmIG5vdCBfLmlzQXJyYXkgQGhpc3RvcnlcbiAgICAgICAgICAgIGtlcnJvciBcIkNvbW1hbmQuc2V0Q3VycmVudCAtLSAje0BoaXN0b3J5S2V5KCl9IDogaGlzdG9yeSBub3QgYW4gYXJyYXk/XCIsIHR5cGVvZiBAaGlzdG9yeSBcbiAgICAgICAgICAgIEBoaXN0b3J5ID0gW11cbiAgICAgICAgXy5wdWxsIEBoaXN0b3J5LCBjb21tYW5kXG4gICAgICAgIEBoaXN0b3J5LnB1c2ggY29tbWFuZCBpZiBjb21tYW5kLnRyaW0oKS5sZW5ndGhcbiAgICAgICAgd2hpbGUgQGhpc3RvcnkubGVuZ3RoID4gQG1heEhpc3RvcnlcbiAgICAgICAgICAgIEBoaXN0b3J5LnNoaWZ0KClcbiAgICAgICAgQHNlbGVjdGVkID0gQGhpc3RvcnkubGVuZ3RoLTFcbiAgICAgICAgQHNldFN0YXRlIEBoaXN0b3J5S2V5KCksIEBoaXN0b3J5XG4gICAgICAgIFxuICAgIGN1cnJlbnQ6IC0+IEBoaXN0b3J5W0BzZWxlY3RlZF0gPyAnJ1xuICAgICAgICBcbiAgICBsYXN0OiAtPlxuICAgICAgICBpZiBAY29tbWFuZExpc3Q/XG4gICAgICAgICAgICBAc2VsZWN0ZWQgPSBAY29tbWFuZExpc3QubnVtTGluZXMoKS0xXG4gICAgICAgICAgICBAY29tbWFuZExpc3QubGluZShAc2VsZWN0ZWQpXG4gICAgICAgIGVsc2UgICAgICAgICAgICBcbiAgICAgICAgICAgIEBzZWxlY3RlZCA9IEBoaXN0b3J5Lmxlbmd0aC0xXG4gICAgICAgICAgICByZXR1cm4gQGhpc3RvcnlbQHNlbGVjdGVkXSBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICAnJ1xuICAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgIFxuICAgIHNldFRleHQ6ICh0KSAtPiBcbiAgICAgICAgQGN1cnJlbnRUZXh0ID0gdFxuICAgICAgICBAY29tbWFuZGxpbmUuc2V0VGV4dCB0XG4gICAgICAgIFxuICAgIHNldEFuZFNlbGVjdFRleHQ6ICh0KSAtPiBcbiAgICAgICAgQGN1cnJlbnRUZXh0ID0gdFxuICAgICAgICBAY29tbWFuZGxpbmUuc2V0QW5kU2VsZWN0VGV4dCB0XG4gICAgICAgIFxuICAgIGdldFRleHQ6IC0+IEBjb21tYW5kbGluZS5saW5lKDApXG4gICAgICAgIFxuICAgIHNldE5hbWU6IChuKSAtPlxuICAgICAgICBAbmFtZSA9IG5cbiAgICAgICAgQGNvbW1hbmRsaW5lLnNldE5hbWUgblxuXG4gICAgY29tcGxldGU6IC0+IFxuICAgICAgICByZXR1cm4gaWYgbm90IEBjb21tYW5kTGlzdD8gXG4gICAgICAgIGlmIEBjb21tYW5kTGlzdC5saW5lKEBzZWxlY3RlZCkgIT0gQGdldFRleHQoKSBhbmQgQGNvbW1hbmRMaXN0LmxpbmUoQHNlbGVjdGVkKS5zdGFydHNXaXRoIEBnZXRUZXh0KClcbiAgICAgICAgICAgIEBzZXRUZXh0IEBjb21tYW5kTGlzdC5saW5lKEBzZWxlY3RlZClcbiAgICAgICAgICAgIHRydWVcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgIFxuICAgIGdyYWJGb2N1czogLT4gQGNvbW1hbmRsaW5lLmZvY3VzKClcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgc2V0UmVjZWl2ZXI6IChyZWNlaXZlcikgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiByZWNlaXZlciA9PSAnYm9keSdcbiAgICAgICAgQHJlY2VpdmVyID0gcmVjZWl2ZXIgPyAnZWRpdG9yJ1xuXG4gICAgcmVjZWl2aW5nRWRpdG9yOiAtPiB3aW5kb3cuZWRpdG9yV2l0aE5hbWUgQHJlY2VpdmVyXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHNldFByZWZzSUQ6IChpZCkgLT5cbiAgICAgICAgQHByZWZzSUQgPSBpZFxuICAgICAgICBAbG9hZFN0YXRlKClcbiAgICAgICAgXG4gICAgbG9hZFN0YXRlOiAtPlxuICAgICAgICBAaGlzdG9yeSA9IEBnZXRTdGF0ZSBAaGlzdG9yeUtleSgpLCBbXVxuICAgICAgICBAc2VsZWN0ZWQgPSBAaGlzdG9yeS5sZW5ndGgtMVxuXG4gICAgc2V0U3RhdGU6IChrZXksIHZhbHVlKSAtPlxuICAgICAgICByZXR1cm4gaWYgbm90IEBwcmVmc0lEXG4gICAgICAgIGlmIEBwcmVmc0lEXG4gICAgICAgICAgICB3aW5kb3cuc3RhdGUuc2V0IFwiY29tbWFuZHwje0BwcmVmc0lEfXwje2tleX1cIiwgdmFsdWVcbiAgICAgICAgXG4gICAgZ2V0U3RhdGU6IChrZXksIHZhbHVlKSAtPlxuICAgICAgICByZXR1cm4gdmFsdWUgaWYgbm90IEBwcmVmc0lEXG4gICAgICAgIHdpbmRvdy5zdGF0ZS5nZXQgXCJjb21tYW5kfCN7QHByZWZzSUR9fCN7a2V5fVwiLCB2YWx1ZVxuICAgICAgICBcbiAgICBkZWxTdGF0ZTogKGtleSkgLT5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAcHJlZnNJRFxuICAgICAgICB3aW5kb3cuc3RhdGUuZGVsIFwiY29tbWFuZHwje0BwcmVmc0lEfXwje2tleX1cIlxuXG4gICAgaXNBY3RpdmU6IC0+IEBjb21tYW5kbGluZS5jb21tYW5kID09IEBcbiAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgIFxuICAgIFxuICAgIGdsb2JhbE1vZEtleUNvbWJvRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGV2ZW50KSAtPiAndW5oYW5kbGVkJ1xuICAgICAgICBcbiAgICBoYW5kbGVNb2RLZXlDb21ib0V2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBldmVudCkgLT4gXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAncGFnZSB1cCcsICdwYWdlIGRvd24nXG4gICAgICAgICAgICAgICAgaWYgQGNvbW1hbmRMaXN0P1xuICAgICAgICAgICAgICAgICAgICAjIHJldHVybiBAc2VsZWN0IGNsYW1wIDAsIEBjb21tYW5kTGlzdC5udW1MaW5lcygpLCBAc2VsZWN0ZWQrQGNvbW1hbmRMaXN0Lm1heExpbmVzKihjb21ibz09J3BhZ2UgdXAnIGFuZCAtMSBvciAxKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gQHNlbGVjdCBjbGFtcCAwLCBAY29tbWFuZExpc3QubnVtTGluZXMoKS0xLCBAc2VsZWN0ZWQrKEBjb21tYW5kTGlzdC5udW1GdWxsTGluZXMoKS0xKSooY29tYm89PSdwYWdlIHVwJyBhbmQgLTEgb3IgMSlcbiAgICAgICAgJ3VuaGFuZGxlZCdcblxuICAgIG9uVGFiQ29tcGxldGlvbjogKGNvbWJvKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQGNvbW1hbmRsaW5lLmlzQ3Vyc29yQXRFbmRPZkxpbmUoKVxuICAgICAgICAgICAgQGNvbXBsZXRlKClcbiAgICAgICAgICAgIHRydWVcbiAgICAgICAgZWxzZSBpZiBjb21ibyA9PSAndGFiJyBcbiAgICAgICAgICAgIHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZmFsc2VcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IENvbW1hbmRcbiJdfQ==
//# sourceURL=../../coffee/commandline/command.coffee