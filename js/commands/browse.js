// koffee 1.12.0

/*
0000000    00000000    0000000   000   000   0000000  00000000
000   000  000   000  000   000  000 0 000  000       000
0000000    0000000    000   000  000000000  0000000   0000000
000   000  000   000  000   000  000   000       000  000
0000000    000   000   0000000   00     00  0000000   00000000
 */
var $, Browse, Command, FileBrowser, clamp, empty, kerror, klog, post, ref, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), $ = ref.$, clamp = ref.clamp, empty = ref.empty, kerror = ref.kerror, klog = ref.klog, post = ref.post, slash = ref.slash;

Command = require('../commandline/command');

FileBrowser = require('../browser/filebrowser');

Browse = (function(superClass) {
    extend(Browse, superClass);

    function Browse(commandline) {
        this.onBrowserItemActivated = bind(this.onBrowserItemActivated, this);
        this.listClick = bind(this.listClick, this);
        this.changedCallback = bind(this.changedCallback, this);
        this.completeCallback = bind(this.completeCallback, this);
        this.onFile = bind(this.onFile, this);
        Browse.__super__.constructor.call(this, commandline);
        this.cmdID = 0;
        this.browser = new FileBrowser($('browser'));
        this.commands = Object.create(null);
        this.names = ['browse', 'Browse', 'shelf'];
        post.on('file', this.onFile);
        this.browser.on('itemActivated', this.onBrowserItemActivated);
        this.syntaxName = 'browser';
    }

    Browse.prototype.onFile = function(file) {
        if (this.isActive() && this.getText() !== slash.tilde(file)) {
            return this.setText(slash.tilde(file));
        }
    };

    Browse.prototype.clear = function() {
        if (this.browser.cleanUp()) {
            return;
        }
        return Browse.__super__.clear.call(this);
    };

    Browse.prototype.start = function(action) {
        var name;
        this.browser.start();
        if (action !== 'shelf') {
            if ((window.editor.currentFile != null) && slash.isFile(window.editor.currentFile)) {
                this.browser.navigateToFile(window.editor.currentFile);
            } else {
                post.emit('filebrowser', 'loadItem', {
                    file: process.cwd(),
                    type: 'dir'
                });
            }
            this.browser.focus();
        }
        name = action;
        if (action === 'shelf') {
            name = 'browse';
        }
        Browse.__super__.start.call(this, name);
        return {
            select: true,
            "do": this.name === 'Browse' && 'half browser' || 'quart browser',
            focus: action === 'shelf' && 'shelf' || null
        };
    };

    Browse.prototype.completeCallback = function(files) {
        var items, matches, text;
        if (!empty(this.getText().trim())) {
            text = slash.resolve(this.getText().trim());
            matches = files.filter(function(f) {
                return f.file.startsWith(text);
            });
            if (!empty(matches)) {
                this.setText(slash.tilde(matches[0].file));
            }
            if (matches.length > 1) {
                items = matches.map(function(m) {
                    var item;
                    item = Object.create(null);
                    switch (m.type) {
                        case 'file':
                            item.line = ' ';
                            item.clss = 'file';
                            break;
                        case 'dir':
                            item.line = '▸';
                            item.clss = 'directory';
                    }
                    item.text = slash.file(m.file);
                    item.file = m.file;
                    return item;
                });
                this.showItems(items);
                this.select(0);
                return;
            }
        }
        return this.hideList();
    };

    Browse.prototype.complete = function() {
        var text;
        text = this.getText().trim();
        if (!text.endsWith('/') && slash.dirExists(text)) {
            this.setText(text + '/');
            this.hideList();
            return true;
        } else if (text.endsWith('/')) {
            if (slash.dirExists(slash.resolve(text))) {
                slash.list(slash.resolve(text), this.completeCallback);
                return true;
            }
        } else if (!empty(slash.dir(text))) {
            if (slash.dirExists(slash.resolve(slash.dir(text)))) {
                slash.list(slash.resolve(slash.dir(text)), this.completeCallback);
                return true;
            }
        }
    };

    Browse.prototype.onTabCompletion = function() {
        this.complete();
        return true;
    };

    Browse.prototype.commonPrefix = function(strA, strB) {
        var i, j, prefix, ref1;
        prefix = '';
        for (i = j = 0, ref1 = Math.min(strA.length, strB.length); 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
            if (strA[i] !== strB[i]) {
                break;
            }
            prefix += strA[i];
        }
        return prefix;
    };

    Browse.prototype.clearBrokenPartForFiles = function(files) {
        var brokenPath, file, j, l, len, longestMatch, prefix;
        brokenPath = slash.resolve(this.getText());
        longestMatch = '';
        for (j = 0, len = files.length; j < len; j++) {
            file = files[j];
            file = file.file;
            prefix = this.commonPrefix(file, brokenPath);
            if (prefix.length > longestMatch.length) {
                longestMatch = prefix;
            }
        }
        l = this.getText().length;
        if (!empty(longestMatch)) {
            this.setText(slash.tilde(longestMatch));
            return this.complete();
        }
    };

    Browse.prototype.changedCallback = function(files) {
        var items, l, matches, path, s, text;
        if (empty(this.getText().trim())) {
            this.hideList();
            return;
        }
        path = slash.resolve(this.getText().trim());
        matches = files.filter(function(f) {
            return f.file.startsWith(path);
        });
        if (empty(matches)) {
            this.clearBrokenPartForFiles(files);
            return;
        }
        s = slash.tilde(path).length;
        text = slash.tilde(slash.tilde(matches[0].file));
        this.setText(text);
        l = text.length;
        this.commandline.selectSingleRange([0, [s, l]], {
            before: true
        });
        if (matches.length < 2) {
            return this.hideList();
        } else {
            items = matches.map(function(m) {
                var item;
                item = Object.create(null);
                switch (m.type) {
                    case 'file':
                        item.line = ' ';
                        item.clss = 'file';
                        break;
                    case 'dir':
                        item.line = '▸';
                        item.clss = 'directory';
                }
                item.text = slash.file(m.file);
                item.file = m.file;
                return item;
            });
            return this.showItems(items);
        }
    };

    Browse.prototype.changed = function(command) {
        var ref1, text;
        klog('browse.changed', command);
        text = this.getText().trim();
        if (!text.endsWith('/')) {
            if ((ref1 = this.walker) != null) {
                ref1.end();
            }
            return this.walker = slash.list(slash.resolve(slash.dir(text)), this.changedCallback);
        } else {
            return this.hideList();
        }
    };

    Browse.prototype.handleModKeyComboEvent = function(mod, key, combo, event) {
        var focusBrowser, ref1;
        switch (combo) {
            case 'backspace':
                if (commandline.mainCursor()[0] === ((ref1 = commandline.selection(0)) != null ? ref1[1][0] : void 0)) {
                    commandline["do"].start();
                    commandline.deleteSelection();
                    commandline.deleteBackward();
                    commandline["do"].end();
                    return;
                }
                break;
            case 'enter':
                this.execute(this.getText());
                focusBrowser = (function(_this) {
                    return function() {
                        return _this.browser.focus();
                    };
                })(this);
                setTimeout(focusBrowser, 100);
                return;
        }
        return 'unhandled';
    };

    Browse.prototype.listClick = function(index) {
        var file, ref1;
        file = (ref1 = this.commandList.items[index]) != null ? ref1.file : void 0;
        if (file != null) {
            file = slash.tilde(file);
        }
        if (file != null) {
            file;
        } else {
            file = this.commandList.line(index);
        }
        this.selected = index;
        return this.execute(file);
    };

    Browse.prototype.select = function(i) {
        var l, ref1, ref2, ref3, s, text;
        this.selected = clamp(-1, ((ref1 = this.commandList) != null ? ref1.numLines() : void 0) - 1, i);
        if (this.selected < 0) {
            this.hideList();
            return;
        }
        if ((ref2 = this.commandList) != null) {
            ref2.selectSingleRange(this.commandList.rangeForLineAtIndex(this.selected));
        }
        if ((ref3 = this.commandList) != null) {
            ref3["do"].cursors([[0, this.selected]]);
        }
        text = slash.tilde(this.commandList.items[this.selected].file);
        this.setText(text);
        s = slash.file(text).length;
        l = text.length;
        return this.commandline.selectSingleRange([0, [l - s, l]]);
    };

    Browse.prototype.selectListItem = function(dir) {
        if (this.commandList == null) {
            return;
        }
        switch (dir) {
            case 'up':
                return this.select(this.selected - 1);
            case 'down':
                return this.select(this.selected + 1);
        }
    };

    Browse.prototype.cancel = function() {
        this.hideList();
        return {
            focus: this.receiver,
            show: 'editor'
        };
    };

    Browse.prototype.execute = function(command) {
        var cmd;
        if (command == null) {
            return kerror("no command?");
        }
        this.hideList();
        this.cmdID += 1;
        cmd = command.trim();
        if (cmd.length) {
            if (slash.dirExists(slash.removeLinePos(cmd))) {
                this.browser.loadItem({
                    file: cmd,
                    type: 'dir'
                });
                this.commandline.setText(cmd);
                return;
            } else if (slash.fileExists(slash.removeLinePos(cmd))) {
                this.commandline.setText(cmd);
                post.emit('jumpToFile', {
                    file: cmd
                });
                return;
            }
        }
        return kerror('browse.execute -- unhandled', cmd);
    };

    Browse.prototype.onBrowserItemActivated = function(item) {
        var pth, ref1, ref2, ref3, ref4, ref5;
        if (!this.isActive()) {
            if ((ref1 = this.commandline.command) != null) {
                if (typeof ref1.onBrowserItemActivated === "function") {
                    ref1.onBrowserItemActivated(item);
                }
            }
            return;
        }
        if (item.file) {
            pth = slash.tilde(item.file);
            if (item.type === 'dir') {
                pth += '/';
                if (item.name === '..' && ((ref2 = this.browser.activeColumn()) != null ? (ref3 = ref2.parent) != null ? ref3.file : void 0 : void 0)) {
                    pth = slash.tilde((ref4 = this.browser.activeColumn()) != null ? (ref5 = ref4.parent) != null ? ref5.file : void 0 : void 0);
                }
            }
            return this.commandline.setText(pth);
        }
    };

    return Browse;

})(Command);

module.exports = Browse;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3NlLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9jb21tYW5kcyIsInNvdXJjZXMiOlsiYnJvd3NlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSw2RUFBQTtJQUFBOzs7O0FBUUEsTUFBaUQsT0FBQSxDQUFRLEtBQVIsQ0FBakQsRUFBRSxTQUFGLEVBQUssaUJBQUwsRUFBWSxpQkFBWixFQUFtQixtQkFBbkIsRUFBMkIsZUFBM0IsRUFBaUMsZUFBakMsRUFBdUM7O0FBRXZDLE9BQUEsR0FBYyxPQUFBLENBQVEsd0JBQVI7O0FBQ2QsV0FBQSxHQUFjLE9BQUEsQ0FBUSx3QkFBUjs7QUFFUjs7O0lBRUMsZ0JBQUMsV0FBRDs7Ozs7O1FBRUMsd0NBQU0sV0FBTjtRQUVBLElBQUMsQ0FBQSxLQUFELEdBQVk7UUFDWixJQUFDLENBQUEsT0FBRCxHQUFZLElBQUksV0FBSixDQUFnQixDQUFBLENBQUUsU0FBRixDQUFoQjtRQUNaLElBQUMsQ0FBQSxRQUFELEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYyxJQUFkO1FBQ1osSUFBQyxDQUFBLEtBQUQsR0FBWSxDQUFDLFFBQUQsRUFBVSxRQUFWLEVBQW1CLE9BQW5CO1FBRVosSUFBSSxDQUFDLEVBQUwsQ0FBUSxNQUFSLEVBQWUsSUFBQyxDQUFBLE1BQWhCO1FBRUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksZUFBWixFQUE0QixJQUFDLENBQUEsc0JBQTdCO1FBRUEsSUFBQyxDQUFBLFVBQUQsR0FBYztJQWJmOztxQkFlSCxNQUFBLEdBQVEsU0FBQyxJQUFEO1FBRUosSUFBRyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQUEsSUFBZ0IsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFBLEtBQWMsS0FBSyxDQUFDLEtBQU4sQ0FBWSxJQUFaLENBQWpDO21CQUNJLElBQUMsQ0FBQSxPQUFELENBQVMsS0FBSyxDQUFDLEtBQU4sQ0FBWSxJQUFaLENBQVQsRUFE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QyxHQUF0QztJQWxCSzs7cUJBb0JULHNCQUFBLEdBQXdCLFNBQUMsSUFBRDtBQUdwQixZQUFBO1FBQUEsSUFBRyxDQUFJLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBUDs7O3dCQUN3QixDQUFFLHVCQUF3Qjs7O0FBQzlDLG1CQUZKOztRQUlBLElBQUcsSUFBSSxDQUFDLElBQVI7WUFDSSxHQUFBLEdBQU0sS0FBSyxDQUFDLEtBQU4sQ0FBWSxJQUFJLENBQUMsSUFBakI7WUFDTixJQUFHLElBQUksQ0FBQyxJQUFMLEtBQWEsS0FBaEI7Z0JBQ0ksR0FBQSxJQUFPO2dCQUNQLElBQUcsSUFBSSxDQUFDLElBQUwsS0FBYSxJQUFiLHVGQUFxRCxDQUFFLHVCQUExRDtvQkFFSSxHQUFBLEdBQU0sS0FBSyxDQUFDLEtBQU4sbUZBQTJDLENBQUUsc0JBQTdDLEVBRlY7aUJBRko7O21CQU1BLElBQUMsQ0FBQSxXQUFXLENBQUMsT0FBYixDQUFxQixHQUFyQixFQVJKOztJQVBvQjs7OztHQS9TUDs7QUFnVXJCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwXG4wMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbjAwMDAwMDAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwXG4jIyNcblxueyAkLCBjbGFtcCwgZW1wdHksIGtlcnJvciwga2xvZywgcG9zdCwgc2xhc2ggfSA9IHJlcXVpcmUgJ2t4aydcblxuQ29tbWFuZCAgICAgPSByZXF1aXJlICcuLi9jb21tYW5kbGluZS9jb21tYW5kJ1xuRmlsZUJyb3dzZXIgPSByZXF1aXJlICcuLi9icm93c2VyL2ZpbGVicm93c2VyJ1xuXG5jbGFzcyBCcm93c2UgZXh0ZW5kcyBDb21tYW5kXG5cbiAgICBAOiAoY29tbWFuZGxpbmUpIC0+XG5cbiAgICAgICAgc3VwZXIgY29tbWFuZGxpbmVcblxuICAgICAgICBAY21kSUQgICAgPSAwXG4gICAgICAgIEBicm93c2VyICA9IG5ldyBGaWxlQnJvd3NlciAkICdicm93c2VyJ1xuICAgICAgICBAY29tbWFuZHMgPSBPYmplY3QuY3JlYXRlIG51bGxcbiAgICAgICAgQG5hbWVzICAgID0gWydicm93c2UnICdCcm93c2UnICdzaGVsZiddXG5cbiAgICAgICAgcG9zdC5vbiAnZmlsZScgQG9uRmlsZVxuXG4gICAgICAgIEBicm93c2VyLm9uICdpdGVtQWN0aXZhdGVkJyBAb25Ccm93c2VySXRlbUFjdGl2YXRlZFxuXG4gICAgICAgIEBzeW50YXhOYW1lID0gJ2Jyb3dzZXInXG5cbiAgICBvbkZpbGU6IChmaWxlKSA9PlxuXG4gICAgICAgIGlmIEBpc0FjdGl2ZSgpIGFuZCBAZ2V0VGV4dCgpICE9IHNsYXNoLnRpbGRlIGZpbGVcbiAgICAgICAgICAgIEBzZXRUZXh0IHNsYXNoLnRpbGRlIGZpbGVcblxuICAgIGNsZWFyOiAtPlxuICAgICAgICByZXR1cm4gaWYgQGJyb3dzZXIuY2xlYW5VcCgpXG4gICAgICAgIHN1cGVyKClcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgIDAwMFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAgc3RhcnQ6IChhY3Rpb24pIC0+XG5cbiAgICAgICAgIyBrbG9nICdicm93c2Uuc3RhcnQnIGFjdGlvblxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuc3RhcnQoKVxuXG4gICAgICAgIGlmIGFjdGlvbiAhPSAnc2hlbGYnXG4gICAgICAgICAgICBpZiB3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlPyBhbmQgc2xhc2guaXNGaWxlIHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgICAgICAgICBAYnJvd3Nlci5uYXZpZ2F0ZVRvRmlsZSB3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdmaWxlYnJvd3NlcicgJ2xvYWRJdGVtJyBmaWxlOnByb2Nlc3MuY3dkKCksIHR5cGU6J2RpcidcbiAgICAgICAgICAgIEBicm93c2VyLmZvY3VzKClcblxuICAgICAgICBuYW1lID0gYWN0aW9uXG4gICAgICAgIG5hbWUgPSAnYnJvd3NlJyBpZiBhY3Rpb24gPT0gJ3NoZWxmJ1xuXG4gICAgICAgIHN1cGVyIG5hbWVcblxuICAgICAgICBzZWxlY3Q6IHRydWVcbiAgICAgICAgZG86ICAgICBAbmFtZSA9PSAnQnJvd3NlJyBhbmQgJ2hhbGYgYnJvd3Nlcicgb3IgJ3F1YXJ0IGJyb3dzZXInXG4gICAgICAgIGZvY3VzOiAgYWN0aW9uID09ICdzaGVsZicgYW5kICdzaGVsZicgb3IgbnVsbFxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIGNvbXBsZXRlQ2FsbGJhY2s6IChmaWxlcykgPT5cblxuICAgICAgICBpZiBub3QgZW1wdHkgQGdldFRleHQoKS50cmltKClcbiAgICAgICAgICAgIHRleHQgPSBzbGFzaC5yZXNvbHZlIEBnZXRUZXh0KCkudHJpbSgpXG4gICAgICAgICAgICBtYXRjaGVzID0gZmlsZXMuZmlsdGVyIChmKSAtPiBmLmZpbGUuc3RhcnRzV2l0aCB0ZXh0XG5cbiAgICAgICAgICAgIGlmIG5vdCBlbXB0eSBtYXRjaGVzXG4gICAgICAgICAgICAgICAgQHNldFRleHQgc2xhc2gudGlsZGUgbWF0Y2hlc1swXS5maWxlXG5cbiAgICAgICAgICAgIGlmIG1hdGNoZXMubGVuZ3RoID4gMVxuXG4gICAgICAgICAgICAgICAgaXRlbXMgPSBtYXRjaGVzLm1hcCAobSkgLT5cblxuICAgICAgICAgICAgICAgICAgICBpdGVtID0gT2JqZWN0LmNyZWF0ZSBudWxsXG5cbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIG0udHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAnZmlsZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmxpbmUgPSAnICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNsc3MgPSAnZmlsZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmxpbmUgPSAn4pa4J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY2xzcyA9ICdkaXJlY3RvcnknXG5cbiAgICAgICAgICAgICAgICAgICAgaXRlbS50ZXh0ID0gc2xhc2guZmlsZSBtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5maWxlID0gbS5maWxlXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1cblxuICAgICAgICAgICAgICAgIEBzaG93SXRlbXMgaXRlbXNcbiAgICAgICAgICAgICAgICBAc2VsZWN0IDBcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgQGhpZGVMaXN0KClcblxuICAgIGNvbXBsZXRlOiAtPlxuXG4gICAgICAgIHRleHQgPSBAZ2V0VGV4dCgpLnRyaW0oKVxuXG4gICAgICAgIGlmIG5vdCB0ZXh0LmVuZHNXaXRoKCcvJykgYW5kIHNsYXNoLmRpckV4aXN0cyB0ZXh0XG4gICAgICAgICAgICBAc2V0VGV4dCB0ZXh0ICsgJy8nXG4gICAgICAgICAgICBAaGlkZUxpc3QoKVxuICAgICAgICAgICAgdHJ1ZVxuICAgICAgICBlbHNlIGlmIHRleHQuZW5kc1dpdGggJy8nXG4gICAgICAgICAgICBpZiBzbGFzaC5kaXJFeGlzdHMgc2xhc2gucmVzb2x2ZSB0ZXh0XG4gICAgICAgICAgICAgICAgc2xhc2gubGlzdCBzbGFzaC5yZXNvbHZlKHRleHQpLCBAY29tcGxldGVDYWxsYmFja1xuICAgICAgICAgICAgICAgIHRydWVcbiAgICAgICAgZWxzZSBpZiBub3QgZW1wdHkgc2xhc2guZGlyIHRleHRcbiAgICAgICAgICAgIGlmIHNsYXNoLmRpckV4aXN0cyBzbGFzaC5yZXNvbHZlIHNsYXNoLmRpciB0ZXh0XG4gICAgICAgICAgICAgICAgc2xhc2gubGlzdCBzbGFzaC5yZXNvbHZlKHNsYXNoLmRpcih0ZXh0KSksIEBjb21wbGV0ZUNhbGxiYWNrXG4gICAgICAgICAgICAgICAgdHJ1ZVxuXG4gICAgb25UYWJDb21wbGV0aW9uOiAtPlxuXG4gICAgICAgIEBjb21wbGV0ZSgpXG4gICAgICAgIHRydWVcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBjb21tb25QcmVmaXg6IChzdHJBLHN0ckIpIC0+XG5cbiAgICAgICAgcHJlZml4ID0gJydcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5NYXRoLm1pbihzdHJBLmxlbmd0aCwgc3RyQi5sZW5ndGgpXVxuICAgICAgICAgICAgYnJlYWsgaWYgc3RyQVtpXSAhPSBzdHJCW2ldXG4gICAgICAgICAgICBwcmVmaXggKz0gc3RyQVtpXVxuICAgICAgICBwcmVmaXhcblxuICAgIGNsZWFyQnJva2VuUGFydEZvckZpbGVzOiAoZmlsZXMpIC0+XG5cbiAgICAgICAgYnJva2VuUGF0aCA9IHNsYXNoLnJlc29sdmUgQGdldFRleHQoKVxuICAgICAgICBsb25nZXN0TWF0Y2ggPSAnJ1xuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlc1xuICAgICAgICAgICAgZmlsZSA9IGZpbGUuZmlsZVxuICAgICAgICAgICAgcHJlZml4ID0gQGNvbW1vblByZWZpeCBmaWxlLCBicm9rZW5QYXRoXG4gICAgICAgICAgICBpZiBwcmVmaXgubGVuZ3RoID4gbG9uZ2VzdE1hdGNoLmxlbmd0aFxuICAgICAgICAgICAgICAgIGxvbmdlc3RNYXRjaCA9IHByZWZpeFxuICAgICAgICBsID0gQGdldFRleHQoKS5sZW5ndGhcblxuICAgICAgICBpZiBub3QgZW1wdHkgbG9uZ2VzdE1hdGNoXG4gICAgICAgICAgICBAc2V0VGV4dCBzbGFzaC50aWxkZSBsb25nZXN0TWF0Y2hcbiAgICAgICAgICAgIEBjb21wbGV0ZSgpXG5cbiAgICBjaGFuZ2VkQ2FsbGJhY2s6IChmaWxlcykgPT5cblxuICAgICAgICBpZiBlbXB0eSBAZ2V0VGV4dCgpLnRyaW0oKVxuICAgICAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIHBhdGggPSBzbGFzaC5yZXNvbHZlIEBnZXRUZXh0KCkudHJpbSgpXG4gICAgICAgIG1hdGNoZXMgPSBmaWxlcy5maWx0ZXIgKGYpIC0+IGYuZmlsZS5zdGFydHNXaXRoIHBhdGhcblxuICAgICAgICBpZiBlbXB0eSBtYXRjaGVzXG4gICAgICAgICAgICBAY2xlYXJCcm9rZW5QYXJ0Rm9yRmlsZXMgZmlsZXNcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIHMgPSBzbGFzaC50aWxkZShwYXRoKS5sZW5ndGhcblxuICAgICAgICB0ZXh0ID0gc2xhc2gudGlsZGUgc2xhc2gudGlsZGUgbWF0Y2hlc1swXS5maWxlXG4gICAgICAgIEBzZXRUZXh0IHRleHRcblxuICAgICAgICBsID0gdGV4dC5sZW5ndGhcblxuICAgICAgICBAY29tbWFuZGxpbmUuc2VsZWN0U2luZ2xlUmFuZ2UgWzAsIFtzLGxdXSwgYmVmb3JlOiB0cnVlXG5cbiAgICAgICAgaWYgbWF0Y2hlcy5sZW5ndGggPCAyXG4gICAgICAgICAgICBAaGlkZUxpc3QoKVxuICAgICAgICBlbHNlXG5cbiAgICAgICAgICAgIGl0ZW1zID0gbWF0Y2hlcy5tYXAgKG0pIC0+XG5cbiAgICAgICAgICAgICAgICBpdGVtID0gT2JqZWN0LmNyZWF0ZSBudWxsXG5cbiAgICAgICAgICAgICAgICBzd2l0Y2ggbS50eXBlXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmxpbmUgPSAnICdcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY2xzcyA9ICdmaWxlJ1xuICAgICAgICAgICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmxpbmUgPSAn4pa4J1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jbHNzID0gJ2RpcmVjdG9yeSdcblxuICAgICAgICAgICAgICAgIGl0ZW0udGV4dCA9IHNsYXNoLmZpbGUgbS5maWxlXG4gICAgICAgICAgICAgICAgaXRlbS5maWxlID0gbS5maWxlXG4gICAgICAgICAgICAgICAgaXRlbVxuXG4gICAgICAgICAgICBAc2hvd0l0ZW1zIGl0ZW1zXG5cbiAgICBjaGFuZ2VkOiAoY29tbWFuZCkgLT5cblxuICAgICAgICBrbG9nICdicm93c2UuY2hhbmdlZCcgY29tbWFuZFxuICAgICAgICB0ZXh0ID0gQGdldFRleHQoKS50cmltKClcbiAgICAgICAgaWYgbm90IHRleHQuZW5kc1dpdGggJy8nXG4gICAgICAgICAgICBAd2Fsa2VyPy5lbmQoKVxuICAgICAgICAgICAgQHdhbGtlciA9IHNsYXNoLmxpc3Qgc2xhc2gucmVzb2x2ZShzbGFzaC5kaXIodGV4dCkpLCBAY2hhbmdlZENhbGxiYWNrXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBoaWRlTGlzdCgpXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0V2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBldmVudCkgLT5cblxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2JhY2tzcGFjZSdcbiAgICAgICAgICAgICAgICBpZiBjb21tYW5kbGluZS5tYWluQ3Vyc29yKClbMF0gPT0gY29tbWFuZGxpbmUuc2VsZWN0aW9uKDApP1sxXVswXSAjIGN1cnNvciBpcyBhdCBzZWxlY3Rpb24gc3RhcnRcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZGxpbmUuZG8uc3RhcnQoKSAgICAgICAgICMgZm9yY2Ugc2ltdWx0YW5lb3VzXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRsaW5lLmRlbGV0ZVNlbGVjdGlvbigpICAjIGRlbGV0aW9uIG9mIHNlbGVjdGlvblxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kbGluZS5kZWxldGVCYWNrd2FyZCgpICAgIyBhbmQgYmFja3NwYWNlLlxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kbGluZS5kby5lbmQoKSAgICAgICAgICAgIyBpdCBzaG91bGQgZmVlbCBhcyBpZiBzZWxlY3Rpb24gd2Fzbid0IHRoZXJlLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJ1xuICAgICAgICAgICAgICAgIEBleGVjdXRlIEBnZXRUZXh0KClcbiAgICAgICAgICAgICAgICBmb2N1c0Jyb3dzZXIgPSA9PiBAYnJvd3Nlci5mb2N1cygpXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCBmb2N1c0Jyb3dzZXIsIDEwMFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAndW5oYW5kbGVkJ1xuXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsaXN0Q2xpY2s6IChpbmRleCkgPT5cblxuICAgICAgICBmaWxlID0gQGNvbW1hbmRMaXN0Lml0ZW1zW2luZGV4XT8uZmlsZVxuICAgICAgICBmaWxlID0gc2xhc2gudGlsZGUgZmlsZSBpZiBmaWxlP1xuICAgICAgICBmaWxlID89IEBjb21tYW5kTGlzdC5saW5lIGluZGV4XG4gICAgICAgIEBzZWxlY3RlZCA9IGluZGV4XG4gICAgICAgIEBleGVjdXRlIGZpbGVcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMFxuXG4gICAgc2VsZWN0OiAoaSkgLT5cblxuICAgICAgICBAc2VsZWN0ZWQgPSBjbGFtcCAtMSwgQGNvbW1hbmRMaXN0Py5udW1MaW5lcygpLTEsIGlcblxuICAgICAgICBpZiBAc2VsZWN0ZWQgPCAwXG4gICAgICAgICAgICBAaGlkZUxpc3QoKVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgQGNvbW1hbmRMaXN0Py5zZWxlY3RTaW5nbGVSYW5nZSBAY29tbWFuZExpc3QucmFuZ2VGb3JMaW5lQXRJbmRleCBAc2VsZWN0ZWRcbiAgICAgICAgQGNvbW1hbmRMaXN0Py5kby5jdXJzb3JzIFtbMCwgQHNlbGVjdGVkXV1cblxuICAgICAgICB0ZXh0ID0gc2xhc2gudGlsZGUgQGNvbW1hbmRMaXN0Lml0ZW1zW0BzZWxlY3RlZF0uZmlsZVxuICAgICAgICBAc2V0VGV4dCB0ZXh0XG4gICAgICAgIHMgPSBzbGFzaC5maWxlKHRleHQpLmxlbmd0aFxuICAgICAgICBsID0gdGV4dC5sZW5ndGhcbiAgICAgICAgQGNvbW1hbmRsaW5lLnNlbGVjdFNpbmdsZVJhbmdlIFswLCBbbC1zLGxdXVxuXG4gICAgc2VsZWN0TGlzdEl0ZW06IChkaXIpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY29tbWFuZExpc3Q/XG5cbiAgICAgICAgc3dpdGNoIGRpclxuICAgICAgICAgICAgd2hlbiAndXAnICAgdGhlbiBAc2VsZWN0IEBzZWxlY3RlZC0xXG4gICAgICAgICAgICB3aGVuICdkb3duJyB0aGVuIEBzZWxlY3QgQHNlbGVjdGVkKzFcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGNhbmNlbDogLT5cblxuICAgICAgICBAaGlkZUxpc3QoKVxuICAgICAgICBmb2N1czogQHJlY2VpdmVyXG4gICAgICAgIHNob3c6ICdlZGl0b3InXG5cbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIGV4ZWN1dGU6IChjb21tYW5kKSAtPlxuXG4gICAgICAgIHJldHVybiBrZXJyb3IgXCJubyBjb21tYW5kP1wiIGlmIG5vdCBjb21tYW5kP1xuXG4gICAgICAgIEBoaWRlTGlzdCgpXG5cbiAgICAgICAgQGNtZElEICs9IDFcbiAgICAgICAgY21kID0gY29tbWFuZC50cmltKClcbiAgICAgICAgaWYgY21kLmxlbmd0aFxuICAgICAgICAgICAgaWYgc2xhc2guZGlyRXhpc3RzIHNsYXNoLnJlbW92ZUxpbmVQb3MgY21kXG4gICAgICAgICAgICAgICAgQGJyb3dzZXIubG9hZEl0ZW0gZmlsZTpjbWQsIHR5cGU6J2RpcidcbiAgICAgICAgICAgICAgICBAY29tbWFuZGxpbmUuc2V0VGV4dCBjbWRcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIGVsc2UgaWYgc2xhc2guZmlsZUV4aXN0cyBzbGFzaC5yZW1vdmVMaW5lUG9zIGNtZFxuICAgICAgICAgICAgICAgIEBjb21tYW5kbGluZS5zZXRUZXh0IGNtZFxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvRmlsZScgZmlsZTpjbWRcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBrZXJyb3IgJ2Jyb3dzZS5leGVjdXRlIC0tIHVuaGFuZGxlZCcsIGNtZFxuXG4gICAgb25Ccm93c2VySXRlbUFjdGl2YXRlZDogKGl0ZW0pID0+XG5cbiAgICAgICAgIyBrbG9nICdvbkJyb3dzZXJJdGVtQWN0aXZhdGVkJyBpdGVtXG4gICAgICAgIGlmIG5vdCBAaXNBY3RpdmUoKVxuICAgICAgICAgICAgQGNvbW1hbmRsaW5lLmNvbW1hbmQ/Lm9uQnJvd3Nlckl0ZW1BY3RpdmF0ZWQ/IGl0ZW1cbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIGl0ZW0uZmlsZVxuICAgICAgICAgICAgcHRoID0gc2xhc2gudGlsZGUgaXRlbS5maWxlXG4gICAgICAgICAgICBpZiBpdGVtLnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICBwdGggKz0gJy8nXG4gICAgICAgICAgICAgICAgaWYgaXRlbS5uYW1lID09ICcuLicgYW5kIEBicm93c2VyLmFjdGl2ZUNvbHVtbigpPy5wYXJlbnQ/LmZpbGVcbiAgICAgICAgICAgICAgICAgICAgIyBzaG93IGN1cnJlbnQgcGF0aCBpbnN0ZWFkIG9mIHVwZGlyIHdoZW4gLi4gaXRlbSB3YXMgYWN0aXZhdGVkXG4gICAgICAgICAgICAgICAgICAgIHB0aCA9IHNsYXNoLnRpbGRlIEBicm93c2VyLmFjdGl2ZUNvbHVtbigpPy5wYXJlbnQ/LmZpbGVcblxuICAgICAgICAgICAgQGNvbW1hbmRsaW5lLnNldFRleHQgcHRoXG5cbm1vZHVsZS5leHBvcnRzID0gQnJvd3NlXG4iXX0=
//# sourceURL=../../coffee/commands/browse.coffee