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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsaUZBQUE7SUFBQTs7QUFRQSxNQUE4QyxPQUFBLENBQVEsS0FBUixDQUE5QyxFQUFFLHVCQUFGLEVBQVksaUJBQVosRUFBbUIsaUJBQW5CLEVBQTBCLGVBQTFCLEVBQWdDLG1CQUFoQyxFQUF3Qzs7QUFFeEMsTUFBQSxHQUFjLE9BQUEsQ0FBUSxrQkFBUjs7QUFDZCxXQUFBLEdBQWMsT0FBQSxDQUFRLGVBQVI7O0FBQ2QsS0FBQSxHQUFjLE9BQUEsQ0FBUSxPQUFSOztBQUVSO0lBRUMsaUJBQUMsV0FBRDtRQUFDLElBQUMsQ0FBQSxjQUFEOzs7O1FBRUEsSUFBQyxDQUFBLFVBQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxVQUFELEdBQWM7SUFIZjs7c0JBV0gsS0FBQSxHQUFPLFNBQUE7ZUFDSDtZQUFBLElBQUEsRUFBTyxJQUFDLENBQUEsT0FBRCxDQUFBLENBQVA7WUFDQSxJQUFBLEVBQU8sSUFBQyxDQUFBLElBRFI7O0lBREc7O3NCQUlQLFlBQUEsR0FBYyxTQUFDLEtBQUQ7UUFFVixvQkFBRyxLQUFLLENBQUUsYUFBVjtZQUNJLElBQUMsQ0FBQSxJQUFELEdBQVEsS0FBSyxDQUFDLEtBRGxCOztlQUVBLElBQUMsQ0FBQSxTQUFELENBQUE7SUFKVTs7c0JBWWQsS0FBQSxHQUFPLFNBQUMsSUFBRDtBQUVILFlBQUE7UUFBQSxJQUFDLENBQUEsT0FBRCxDQUFTLElBQVQ7UUFDQSxJQUFDLENBQUEsU0FBRCxDQUFBO1FBQ0EsSUFBQSxHQUFPLElBQUMsQ0FBQSxPQUFELENBQUE7UUFDUCxJQUFrQixpQkFBSSxJQUFJLENBQUUsZ0JBQTVCO1lBQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxJQUFELENBQUEsRUFBUDs7ZUFDQTtZQUFBLElBQUEsRUFBUSxJQUFSO1lBQ0EsTUFBQSxFQUFRLElBRFI7O0lBTkc7O3NC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Q0FBQyxJQUFDLENBQUEsV0FBVyxDQUFDLFlBQWIsQ0FBQSxDQUFBLEdBQTRCLENBQTdCLENBQUEsR0FBZ0MsQ0FBQyxLQUFBLEtBQU8sU0FBUCxJQUFxQixDQUFDLENBQXRCLElBQTJCLENBQTVCLENBQTlFLENBQVIsRUFGWDs7QUFGUjtlQUtBO0lBTm9COztzQkFReEIsZUFBQSxHQUFpQixTQUFDLEtBQUQ7UUFFYixJQUFHLElBQUMsQ0FBQSxXQUFXLENBQUMsbUJBQWIsQ0FBQSxDQUFIO1lBQ0ksSUFBQyxDQUFBLFFBQUQsQ0FBQTttQkFDQSxLQUZKO1NBQUEsTUFHSyxJQUFHLEtBQUEsS0FBUyxLQUFaO21CQUNELEtBREM7U0FBQSxNQUFBO21CQUdELE1BSEM7O0lBTFE7Ozs7OztBQVVyQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDBcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgXG4jIyNcblxueyByZXZlcnNlZCwgY2xhbXAsIGVtcHR5LCBlbGVtLCBrZXJyb3IsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuc3ludGF4ICAgICAgPSByZXF1aXJlICcuLi9lZGl0b3Ivc3ludGF4J1xuQ29tbWFuZExpc3QgPSByZXF1aXJlICcuL2NvbW1hbmRsaXN0J1xuZnV6enkgICAgICAgPSByZXF1aXJlICdmdXp6eSdcblxuY2xhc3MgQ29tbWFuZFxuXG4gICAgQDogKEBjb21tYW5kbGluZSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBzeW50YXhOYW1lID0gJ2tvJ1xuICAgICAgICBAbWF4SGlzdG9yeSA9IDIwXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIHN0YXRlOiAtPlxuICAgICAgICB0ZXh0OiAgQGdldFRleHQoKVxuICAgICAgICBuYW1lOiAgQG5hbWVcbiAgICAgICAgXG4gICAgcmVzdG9yZVN0YXRlOiAoc3RhdGUpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBzdGF0ZT8ubmFtZVxuICAgICAgICAgICAgQG5hbWUgPSBzdGF0ZS5uYW1lXG4gICAgICAgIEBsb2FkU3RhdGUoKVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICBcbiAgICBzdGFydDogKG5hbWUpIC0+XG4gICAgICAgIFxuICAgICAgICBAc2V0TmFtZSBuYW1lXG4gICAgICAgIEBsb2FkU3RhdGUoKVxuICAgICAgICB0ZXh0ID0gQGdldFRleHQoKVxuICAgICAgICB0ZXh0ID0gQGxhc3QoKSBpZiBub3QgdGV4dD8ubGVuZ3RoXG4gICAgICAgIHRleHQ6ICAgdGV4dFxuICAgICAgICBzZWxlY3Q6IHRydWVcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiAgICAgICAgXG4gICAgZXhlY3V0ZTogKGNvbW1hbmQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBlbXB0eSBjb21tYW5kXG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yICdubyBjb21tYW5kISdcbiAgICAgICAgXG4gICAgICAgIGlmIEBjb21tYW5kTGlzdD8gXG4gICAgICAgICAgICBpZiAwIDw9IEBzZWxlY3RlZCA8IEBjb21tYW5kTGlzdC5udW1MaW5lcygpXG4gICAgICAgICAgICAgICAgY29tbWFuZCA9IEBjb21tYW5kTGlzdD8ubGluZSBAc2VsZWN0ZWRcbiAgICAgICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgICAgICBcbiAgICAgICAgY29tbWFuZCA9IGNvbW1hbmQudHJpbSgpXG4gICAgICAgIEBzZXRDdXJyZW50IGNvbW1hbmRcbiAgICAgICAgY29tbWFuZFxuICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgIFxuICAgIFxuICAgIGNoYW5nZWQ6IChjb21tYW5kKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY29tbWFuZExpc3Q/XG4gICAgICAgIFxuICAgICAgICBjb21tYW5kID0gY29tbWFuZC50cmltKClcbiAgICAgICAgaXRlbXMgPSBAbGlzdEl0ZW1zKClcbiAgICAgICAgXG4gICAgICAgIGlmIGl0ZW1zLmxlbmd0aFxuICAgICAgICAgICAgaWYgY29tbWFuZC5sZW5ndGhcbiAgICAgICAgICAgICAgICBmdXp6aWVkID0gZnV6enkuZmlsdGVyIGNvbW1hbmQsIGl0ZW1zLCBleHRyYWN0OiAobykgLT4gXG4gICAgICAgICAgICAgICAgICAgIGlmIG8/XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbyBpZiBfLmlzU3RyaW5nIG9cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvLnRleHQgaWYgXy5pc1N0cmluZyBvLnRleHRcbiAgICAgICAgICAgICAgICAgICAgJycgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpdGVtcyA9IChmLm9yaWdpbmFsIGZvciBmIGluIF8uc29ydEJ5IGZ1enppZWQsIChvKSAtPiBvLmluZGV4KVxuICAgICAgICAgICAgQHNob3dJdGVtcyBAd2VpZ2h0ZWRJdGVtcyBpdGVtcywgY3VycmVudFRleHQ6IGNvbW1hbmRcbiAgICAgICAgICAgIEBzZWxlY3QgMFxuICAgICAgICAgICAgQHBvc2l0aW9uTGlzdCgpXG5cbiAgICB3ZWlnaHQ6IChpdGVtLCBvcHQpIC0+XG4gICAgICAgIHcgPSAwXG4gICAgICAgIHcgKz0gaXRlbS50ZXh0LnN0YXJ0c1dpdGgob3B0LmN1cnJlbnRUZXh0KSBhbmQgNjU1MzUgKiAob3B0LmN1cnJlbnRUZXh0Lmxlbmd0aC9pdGVtLnRleHQubGVuZ3RoKSBvciAwIFxuICAgICAgICB3XG4gICAgXG4gICAgd2VpZ2h0ZWRJdGVtczogKGl0ZW1zLCBvcHQpIC0+IGl0ZW1zLnNvcnQgKGEsYikgPT4gQHdlaWdodChiLCBvcHQpIC0gQHdlaWdodChhLCBvcHQpXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICBcbiAgICBjYW5jZWw6IC0+XG4gICAgICAgIFxuICAgICAgICBAaGlkZUxpc3QoKSAgICAgICAgXG4gICAgICAgIHRleHQ6ICcnXG4gICAgICAgIGZvY3VzOiBAcmVjZWl2ZXJcbiAgICAgICAgc2hvdzogJ2VkaXRvcidcbiAgICAgICAgXG4gICAgY2xlYXI6IC0+XG4gICAgICAgIGlmIHdpbmRvdy50ZXJtaW5hbC5udW1MaW5lcygpID4gMFxuICAgICAgICAgICAgd2luZG93LnRlcm1pbmFsLmNsZWFyKClcbiAgICAgICAgICAgIHt9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRleHQ6ICcnXG4gICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgIFxuXG4gICAgc2hvd0xpc3Q6IC0+XG5cbiAgICAgICAgaWYgbm90IEBjb21tYW5kTGlzdD9cbiAgICAgICAgICAgIGxpc3RWaWV3ID0gZWxlbSBjbGFzczogXCJjb21tYW5kbGlzdCAje0BwcmVmc0lEfVwiXG4gICAgICAgICAgICB3aW5kb3cuc3BsaXQuZWxlbS5hcHBlbmRDaGlsZCBsaXN0Vmlld1xuICAgICAgICAgICAgQGNvbW1hbmRMaXN0ID0gbmV3IENvbW1hbmRMaXN0IEAsICcuY29tbWFuZGxpc3QnLCBzeW50YXhOYW1lOiBAc3ludGF4TmFtZVxuICAgIFxuICAgIGxpc3RJdGVtczogKCkgLT4gcmV2ZXJzZWQgQGhpc3RvcnlcblxuICAgIHNob3dJdGVtczogKGl0ZW1zKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY29tbWFuZExpc3Q/IGFuZCBub3QgaXRlbXMubGVuZ3RoXG4gICAgICAgIHJldHVybiBAaGlkZUxpc3QoKSBpZiBub3QgaXRlbXMubGVuZ3RoXG4gICAgICAgIEBzaG93TGlzdCgpIGlmIG5vdCBAY29tbWFuZExpc3Q/XG4gICAgICAgIEBjb21tYW5kTGlzdC5hZGRJdGVtcyBpdGVtc1xuICAgICAgICBAcG9zaXRpb25MaXN0KClcbiAgICBcbiAgICBsaXN0Q2xpY2s6IChpbmRleCkgPT5cbiAgICAgICAgXG4gICAgICAgIEBzZWxlY3RlZCA9IGluZGV4XG4gICAgICAgIEBleGVjdXRlIEBjb21tYW5kTGlzdC5saW5lIGluZGV4IFxuICAgIFxuICAgIG9uQm90OiAoYm90KSA9PiBAcG9zaXRpb25MaXN0KClcbiAgICBcbiAgICBwb3NpdGlvbkxpc3Q6IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBjb21tYW5kTGlzdD9cbiAgICAgICAgZmxleCA9IHdpbmRvdy5zcGxpdC5mbGV4XG4gICAgICAgIGZsZXgudXBkYXRlKClcbiAgICAgICAgbGlzdFRvcCA9IGZsZXgucG9zT2ZQYW5lIDIgXG4gICAgICAgIGxpc3RIZWlnaHQgPSBAY29tbWFuZExpc3Qudmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHRcbiAgICAgICAgc3BhY2VCZWxvdyA9IGZsZXguc2l6ZSgpIC0gbGlzdFRvcFxuICAgICAgICBpZiBzcGFjZUJlbG93IDwgbGlzdEhlaWdodFxuICAgICAgICAgICAgaWYgZmxleC5zaXplT2ZQYW5lKDApID4gc3BhY2VCZWxvd1xuICAgICAgICAgICAgICAgIGxpc3RUb3AgPSBmbGV4LnBvc09mSGFuZGxlKDApIC0gbGlzdEhlaWdodFxuICAgICAgICAgICAgICAgIGlmIGxpc3RUb3AgPCAwXG4gICAgICAgICAgICAgICAgICAgIEBjb21tYW5kTGlzdC52aWV3LnN0eWxlLmhlaWdodCA9IFwiI3tsaXN0SGVpZ2h0K2xpc3RUb3B9cHhcIlxuICAgICAgICAgICAgICAgICAgICBsaXN0VG9wID0gMFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBjb21tYW5kTGlzdC52aWV3LnN0eWxlLmhlaWdodCA9IFwiI3tzcGFjZUJlbG93fXB4XCJcbiAgICAgICAgQGNvbW1hbmRMaXN0Py52aWV3LnN0eWxlLnRvcCA9IFwiI3tsaXN0VG9wfXB4XCJcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgIFxuICAgICAgICBcbiAgICBzZWxlY3Q6IChpKSAtPiBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY29tbWFuZExpc3Q/XG4gICAgICAgIEBzZWxlY3RlZCA9IGNsYW1wIC0xLCBAY29tbWFuZExpc3QubnVtTGluZXMoKS0xLCBpXG4gICAgICAgIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICAgICBAY29tbWFuZExpc3Quc2VsZWN0U2luZ2xlUmFuZ2UgQGNvbW1hbmRMaXN0LnJhbmdlRm9yTGluZUF0SW5kZXgoQHNlbGVjdGVkKSwgYmVmb3JlOnRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNvbW1hbmRMaXN0LnNpbmdsZUN1cnNvckF0UG9zIFswLDBdIFxuICAgICAgICBAY29tbWFuZExpc3Quc2Nyb2xsLmN1cnNvckludG9WaWV3KClcbiAgICAgICAgICAgICAgICBcbiAgICBzZWxlY3RMaXN0SXRlbTogKGRpcikgLT5cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBkaXJcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgIHRoZW4gQHNldEFuZFNlbGVjdFRleHQgQHByZXYoKVxuICAgICAgICAgICAgd2hlbiAnZG93bicgdGhlbiBAc2V0QW5kU2VsZWN0VGV4dCBAbmV4dCgpXG4gICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwIDAwMCBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgICAwICAgIFxuICAgICAgICAgICAgXG4gICAgcHJldjogLT4gXG4gICAgICAgIGlmIEBjb21tYW5kTGlzdD9cbiAgICAgICAgICAgIEBzZWxlY3QgY2xhbXAgLTEsIEBjb21tYW5kTGlzdC5udW1MaW5lcygpLTEsIEBzZWxlY3RlZC0xXG4gICAgICAgICAgICBpZiBAc2VsZWN0ZWQgPCAwXG4gICAgICAgICAgICAgICAgQGhpZGVMaXN0KCkgXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIEBjb21tYW5kTGlzdC5saW5lKEBzZWxlY3RlZClcbiAgICAgICAgZWxzZSAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgQHNlbGVjdGVkIDwgMFxuICAgICAgICAgICAgICAgIEBzZWxlY3RlZCA9IEBoaXN0b3J5Lmxlbmd0aC0xIFxuICAgICAgICAgICAgZWxzZSBpZiBAc2VsZWN0ZWQgPiAwXG4gICAgICAgICAgICAgICAgQHNlbGVjdGVkIC09IDFcbiAgICAgICAgICAgIHJldHVybiBAaGlzdG9yeVtAc2VsZWN0ZWRdXG4gICAgICAgICcnXG4gICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgXG4gICAgbmV4dDogLT4gXG4gICAgICAgIGlmIG5vdCBAY29tbWFuZExpc3Q/IGFuZCBAbGlzdEl0ZW1zKCkubGVuZ3RoXG4gICAgICAgICAgICBAc2hvd0l0ZW1zIEBsaXN0SXRlbXMoKSBcbiAgICAgICAgICAgIEBzZWxlY3QgLTFcbiAgICAgICAgaWYgQGNvbW1hbmRMaXN0PyBcbiAgICAgICAgICAgIEBzZWxlY3QgY2xhbXAgMCwgQGNvbW1hbmRMaXN0Lm51bUxpbmVzKCktMSwgQHNlbGVjdGVkKzFcbiAgICAgICAgICAgIHJldHVybiBAY29tbWFuZExpc3QubGluZShAc2VsZWN0ZWQpXG4gICAgICAgIGVsc2UgaWYgQGhpc3RvcnkubGVuZ3RoXG4gICAgICAgICAgICBAc2VsZWN0ZWQgPSBjbGFtcCAwLCBAaGlzdG9yeS5sZW5ndGgtMSwgQHNlbGVjdGVkKzFcbiAgICAgICAgICAgIHJldHVybiBuZXcgQGhpc3RvcnlbQHNlbGVjdGVkXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc2VsZWN0ZWQgPSAtMVxuICAgICAgICAgICAgcmV0dXJuICcnXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMFxuICAgICAgICAgXG4gICAgb25CbHVyOiA9PiBcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAc2tpcEJsdXJcbiAgICAgICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBza2lwQmx1ciA9IG51bGxcbiAgICAgICAgICAgIFxuICAgIGhpZGVMaXN0OiAtPlxuXG4gICAgICAgIEBzZWxlY3RlZCA9IC0xXG4gICAgICAgIEBjb21tYW5kTGlzdD8uZGVsKClcbiAgICAgICAgQGNvbW1hbmRMaXN0Py52aWV3Py5yZW1vdmUoKVxuICAgICAgICBAY29tbWFuZExpc3QgPSBudWxsXG5cbiAgICBjYW5jZWxMaXN0OiAtPiBAaGlkZUxpc3QoKVxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgXG4gICAgaGlzdG9yeUtleTogLT4gJ2hpc3RvcnknXG4gICAgXG4gICAgY2xlYXJIaXN0b3J5OiAtPlxuICAgICAgICBcbiAgICAgICAgQGhpc3RvcnkgPSBbXVxuICAgICAgICBAc2VsZWN0ZWQgPSAtMVxuICAgICAgICBAc2V0U3RhdGUgQGhpc3RvcnlLZXkoKSwgQGhpc3RvcnlcbiAgIFxuICAgIHNldEhpc3Rvcnk6IChAaGlzdG9yeSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBzZXRTdGF0ZSBAaGlzdG9yeUtleSgpLCBAaGlzdG9yeVxuICAgIFxuICAgIHNldEN1cnJlbnQ6IChjb21tYW5kKSAtPlxuICAgICAgICBcbiAgICAgICAgQGxvYWRTdGF0ZSgpIGlmIG5vdCBAaGlzdG9yeT9cbiAgICAgICAgaWYgbm90IF8uaXNBcnJheSBAaGlzdG9yeVxuICAgICAgICAgICAga2Vycm9yIFwiQ29tbWFuZC5zZXRDdXJyZW50IC0tICN7QGhpc3RvcnlLZXkoKX0gOiBoaXN0b3J5IG5vdCBhbiBhcnJheT9cIiwgdHlwZW9mIEBoaXN0b3J5IFxuICAgICAgICAgICAgQGhpc3RvcnkgPSBbXVxuICAgICAgICBfLnB1bGwgQGhpc3RvcnksIGNvbW1hbmRcbiAgICAgICAgQGhpc3RvcnkucHVzaCBjb21tYW5kIGlmIGNvbW1hbmQudHJpbSgpLmxlbmd0aFxuICAgICAgICB3aGlsZSBAaGlzdG9yeS5sZW5ndGggPiBAbWF4SGlzdG9yeVxuICAgICAgICAgICAgQGhpc3Rvcnkuc2hpZnQoKVxuICAgICAgICBAc2VsZWN0ZWQgPSBAaGlzdG9yeS5sZW5ndGgtMVxuICAgICAgICBAc2V0U3RhdGUgQGhpc3RvcnlLZXkoKSwgQGhpc3RvcnlcbiAgICAgICAgXG4gICAgY3VycmVudDogLT4gQGhpc3RvcnlbQHNlbGVjdGVkXSA/ICcnXG4gICAgICAgIFxuICAgIGxhc3Q6IC0+XG4gICAgICAgIGlmIEBjb21tYW5kTGlzdD9cbiAgICAgICAgICAgIEBzZWxlY3RlZCA9IEBjb21tYW5kTGlzdC5udW1MaW5lcygpLTFcbiAgICAgICAgICAgIEBjb21tYW5kTGlzdC5saW5lKEBzZWxlY3RlZClcbiAgICAgICAgZWxzZSAgICAgICAgICAgIFxuICAgICAgICAgICAgQHNlbGVjdGVkID0gQGhpc3RvcnkubGVuZ3RoLTFcbiAgICAgICAgICAgIHJldHVybiBAaGlzdG9yeVtAc2VsZWN0ZWRdIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICcnXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgIDAwMCAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgXG4gICAgc2V0VGV4dDogKHQpIC0+IFxuICAgICAgICBAY3VycmVudFRleHQgPSB0XG4gICAgICAgIEBjb21tYW5kbGluZS5zZXRUZXh0IHRcbiAgICAgICAgXG4gICAgc2V0QW5kU2VsZWN0VGV4dDogKHQpIC0+IFxuICAgICAgICBAY3VycmVudFRleHQgPSB0XG4gICAgICAgIEBjb21tYW5kbGluZS5zZXRBbmRTZWxlY3RUZXh0IHRcbiAgICAgICAgXG4gICAgZ2V0VGV4dDogLT4gQGNvbW1hbmRsaW5lLmxpbmUoMClcbiAgICAgICAgXG4gICAgc2V0TmFtZTogKG4pIC0+XG4gICAgICAgIEBuYW1lID0gblxuICAgICAgICBAY29tbWFuZGxpbmUuc2V0TmFtZSBuXG5cbiAgICBjb21wbGV0ZTogLT4gXG4gICAgICAgIHJldHVybiBpZiBub3QgQGNvbW1hbmRMaXN0PyBcbiAgICAgICAgaWYgQGNvbW1hbmRMaXN0LmxpbmUoQHNlbGVjdGVkKSAhPSBAZ2V0VGV4dCgpIGFuZCBAY29tbWFuZExpc3QubGluZShAc2VsZWN0ZWQpLnN0YXJ0c1dpdGggQGdldFRleHQoKVxuICAgICAgICAgICAgQHNldFRleHQgQGNvbW1hbmRMaXN0LmxpbmUoQHNlbGVjdGVkKVxuICAgICAgICAgICAgdHJ1ZVxuICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgXG4gICAgZ3JhYkZvY3VzOiAtPiBAY29tbWFuZGxpbmUuZm9jdXMoKVxuICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBzZXRSZWNlaXZlcjogKHJlY2VpdmVyKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIHJlY2VpdmVyID09ICdib2R5J1xuICAgICAgICBAcmVjZWl2ZXIgPSByZWNlaXZlciA/ICdlZGl0b3InXG5cbiAgICByZWNlaXZpbmdFZGl0b3I6IC0+IHdpbmRvdy5lZGl0b3JXaXRoTmFtZSBAcmVjZWl2ZXJcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgc2V0UHJlZnNJRDogKGlkKSAtPlxuICAgICAgICBAcHJlZnNJRCA9IGlkXG4gICAgICAgIEBsb2FkU3RhdGUoKVxuICAgICAgICBcbiAgICBsb2FkU3RhdGU6IC0+XG4gICAgICAgIEBoaXN0b3J5ID0gQGdldFN0YXRlIEBoaXN0b3J5S2V5KCksIFtdXG4gICAgICAgIEBzZWxlY3RlZCA9IEBoaXN0b3J5Lmxlbmd0aC0xXG5cbiAgICBzZXRTdGF0ZTogKGtleSwgdmFsdWUpIC0+XG4gICAgICAgIHJldHVybiBpZiBub3QgQHByZWZzSURcbiAgICAgICAgaWYgQHByZWZzSURcbiAgICAgICAgICAgIHdpbmRvdy5zdGF0ZS5zZXQgXCJjb21tYW5kfCN7QHByZWZzSUR9fCN7a2V5fVwiLCB2YWx1ZVxuICAgICAgICBcbiAgICBnZXRTdGF0ZTogKGtleSwgdmFsdWUpIC0+XG4gICAgICAgIHJldHVybiB2YWx1ZSBpZiBub3QgQHByZWZzSURcbiAgICAgICAgd2luZG93LnN0YXRlLmdldCBcImNvbW1hbmR8I3tAcHJlZnNJRH18I3trZXl9XCIsIHZhbHVlXG4gICAgICAgIFxuICAgIGRlbFN0YXRlOiAoa2V5KSAtPlxuICAgICAgICByZXR1cm4gaWYgbm90IEBwcmVmc0lEXG4gICAgICAgIHdpbmRvdy5zdGF0ZS5kZWwgXCJjb21tYW5kfCN7QHByZWZzSUR9fCN7a2V5fVwiXG5cbiAgICBpc0FjdGl2ZTogLT4gQGNvbW1hbmRsaW5lLmNvbW1hbmQgPT0gQFxuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgXG4gICAgXG4gICAgZ2xvYmFsTW9kS2V5Q29tYm9FdmVudDogKG1vZCwga2V5LCBjb21ibywgZXZlbnQpIC0+ICd1bmhhbmRsZWQnXG4gICAgICAgIFxuICAgIGhhbmRsZU1vZEtleUNvbWJvRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGV2ZW50KSAtPiBcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJywgJ3BhZ2UgZG93bidcbiAgICAgICAgICAgICAgICBpZiBAY29tbWFuZExpc3Q/XG4gICAgICAgICAgICAgICAgICAgICMgcmV0dXJuIEBzZWxlY3QgY2xhbXAgMCwgQGNvbW1hbmRMaXN0Lm51bUxpbmVzKCksIEBzZWxlY3RlZCtAY29tbWFuZExpc3QubWF4TGluZXMqKGNvbWJvPT0ncGFnZSB1cCcgYW5kIC0xIG9yIDEpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBAc2VsZWN0IGNsYW1wIDAsIEBjb21tYW5kTGlzdC5udW1MaW5lcygpLTEsIEBzZWxlY3RlZCsoQGNvbW1hbmRMaXN0Lm51bUZ1bGxMaW5lcygpLTEpKihjb21ibz09J3BhZ2UgdXAnIGFuZCAtMSBvciAxKVxuICAgICAgICAndW5oYW5kbGVkJ1xuXG4gICAgb25UYWJDb21wbGV0aW9uOiAoY29tYm8pIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAY29tbWFuZGxpbmUuaXNDdXJzb3JBdEVuZE9mTGluZSgpXG4gICAgICAgICAgICBAY29tcGxldGUoKVxuICAgICAgICAgICAgdHJ1ZVxuICAgICAgICBlbHNlIGlmIGNvbWJvID09ICd0YWInIFxuICAgICAgICAgICAgdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmYWxzZVxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQ29tbWFuZFxuIl19
//# sourceURL=../../coffee/commandline/command.coffee