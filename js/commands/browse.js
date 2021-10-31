// koffee 1.14.0

/*
0000000    00000000    0000000   000   000   0000000  00000000
000   000  000   000  000   000  000 0 000  000       000
0000000    0000000    000   000  000000000  0000000   0000000
000   000  000   000  000   000  000   000       000  000
0000000    000   000   0000000   00     00  0000000   00000000
 */
var $, Browse, Command, FileBrowser, clamp, empty, kerror, post, ref, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), $ = ref.$, clamp = ref.clamp, empty = ref.empty, kerror = ref.kerror, post = ref.post, slash = ref.slash;

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
                this.setText(slash.tilde(window.editor.currentFile));
                this.browser.navigateToFile(window.editor.currentFile);
            } else {
                post.emit('filebrowser', 'loadItem', {
                    file: process.cwd(),
                    type: 'dir'
                });
            }
            this.browser.focus({
                force: true
            });
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
                        return _this.browser.focus({
                            force: true
                        });
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3NlLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9jb21tYW5kcyIsInNvdXJjZXMiOlsiYnJvd3NlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx1RUFBQTtJQUFBOzs7O0FBUUEsTUFBMkMsT0FBQSxDQUFRLEtBQVIsQ0FBM0MsRUFBRSxTQUFGLEVBQUssaUJBQUwsRUFBWSxpQkFBWixFQUFtQixtQkFBbkIsRUFBMkIsZUFBM0IsRUFBaUM7O0FBRWpDLE9BQUEsR0FBYyxPQUFBLENBQVEsd0JBQVI7O0FBQ2QsV0FBQSxHQUFjLE9BQUEsQ0FBUSx3QkFBUjs7QUFFUjs7O0lBRUMsZ0JBQUMsV0FBRDs7Ozs7O1FBRUMsd0NBQU0sV0FBTjtRQUVBLElBQUMsQ0FBQSxLQUFELEdBQVk7UUFDWixJQUFDLENBQUEsT0FBRCxHQUFZLElBQUksV0FBSixDQUFnQixDQUFBLENBQUUsU0FBRixDQUFoQjtRQUNaLElBQUMsQ0FBQSxRQUFELEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYyxJQUFkO1FBQ1osSUFBQyxDQUFBLEtBQUQsR0FBWSxDQUFDLFFBQUQsRUFBVSxRQUFWLEVBQW1CLE9BQW5CO1FBRVosSUFBSSxDQUFDLEVBQUwsQ0FBUSxNQUFSLEVBQWUsSUFBQyxDQUFBLE1BQWhCO1FBRUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksZUFBWixFQUE0QixJQUFDLENBQUEsc0JBQTdCO1FBRUEsSUFBQyxDQUFBLFVBQUQsR0FBYztJQWJmOztxQkFlSCxNQUFBLEdBQVEsU0FBQyxJQUFEO1FBR0osSUFBRyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQUEsSUFBZ0IsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFBLEtBQWMsS0FBSyxDQUFDLEtBQU4sQ0FBWSxJQUFaLENBQWpDO21CQUNJLElBQUMsQ0FBQSxPQUFELENBQVMsS0FBSyxDQUFDLEtBQU4sQ0FBWSxJQUFaLENBQVQsRUFESjs7SUFISTs7cUJB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QUFVLFlBQVYsRUFBdUI7b0JBQUEsSUFBQSxFQUFLLEdBQUw7aUJBQXZCO0FBQ0EsdUJBSEM7YUFMVDs7ZUFVQSxNQUFBLENBQU8sNkJBQVAsRUFBcUMsR0FBckM7SUFsQks7O3FCQW9CVCxzQkFBQSxHQUF3QixTQUFDLElBQUQ7QUFJcEIsWUFBQTtRQUFBLElBQUcsQ0FBSSxJQUFDLENBQUEsUUFBRCxDQUFBLENBQVA7Ozt3QkFDd0IsQ0FBRSx1QkFBd0I7OztBQUM5QyxtQkFGSjs7UUFJQSxJQUFHLElBQUksQ0FBQyxJQUFSO1lBQ0ksR0FBQSxHQUFNLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBSSxDQUFDLElBQWpCO1lBQ04sSUFBRyxJQUFJLENBQUMsSUFBTCxLQUFhLEtBQWhCO2dCQUNJLEdBQUEsSUFBTztnQkFDUCxJQUFHLElBQUksQ0FBQyxJQUFMLEtBQWEsSUFBYix1RkFBcUQsQ0FBRSx1QkFBMUQ7b0JBRUksR0FBQSxHQUFNLEtBQUssQ0FBQyxLQUFOLG1GQUEyQyxDQUFFLHNCQUE3QyxFQUZWO2lCQUZKOzttQkFNQSxJQUFDLENBQUEsV0FBVyxDQUFDLE9BQWIsQ0FBcUIsR0FBckIsRUFSSjs7SUFSb0I7Ozs7R0FqVFA7O0FBbVVyQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMFxuMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAgICAwMDAwMDAwMFxuIyMjXG5cbnsgJCwgY2xhbXAsIGVtcHR5LCBrZXJyb3IsIHBvc3QsIHNsYXNoIH0gPSByZXF1aXJlICdreGsnXG5cbkNvbW1hbmQgICAgID0gcmVxdWlyZSAnLi4vY29tbWFuZGxpbmUvY29tbWFuZCdcbkZpbGVCcm93c2VyID0gcmVxdWlyZSAnLi4vYnJvd3Nlci9maWxlYnJvd3NlcidcblxuY2xhc3MgQnJvd3NlIGV4dGVuZHMgQ29tbWFuZFxuXG4gICAgQDogKGNvbW1hbmRsaW5lKSAtPlxuXG4gICAgICAgIHN1cGVyIGNvbW1hbmRsaW5lXG5cbiAgICAgICAgQGNtZElEICAgID0gMFxuICAgICAgICBAYnJvd3NlciAgPSBuZXcgRmlsZUJyb3dzZXIgJCAnYnJvd3NlcidcbiAgICAgICAgQGNvbW1hbmRzID0gT2JqZWN0LmNyZWF0ZSBudWxsXG4gICAgICAgIEBuYW1lcyAgICA9IFsnYnJvd3NlJyAnQnJvd3NlJyAnc2hlbGYnXSAjIEJyb3dzZSBhbmQgc2hlbGYgYXJlIGhpZGRlbiBpbiBjb21tYW5kbGluZSBtZW51XG5cbiAgICAgICAgcG9zdC5vbiAnZmlsZScgQG9uRmlsZVxuXG4gICAgICAgIEBicm93c2VyLm9uICdpdGVtQWN0aXZhdGVkJyBAb25Ccm93c2VySXRlbUFjdGl2YXRlZFxuXG4gICAgICAgIEBzeW50YXhOYW1lID0gJ2Jyb3dzZXInXG5cbiAgICBvbkZpbGU6IChmaWxlKSA9PlxuXG4gICAgICAgICMga2xvZyAnYnJvd3NlLm9uRmlsZScgZmlsZVxuICAgICAgICBpZiBAaXNBY3RpdmUoKSBhbmQgQGdldFRleHQoKSAhPSBzbGFzaC50aWxkZSBmaWxlXG4gICAgICAgICAgICBAc2V0VGV4dCBzbGFzaC50aWxkZSBmaWxlXG5cbiAgICBjbGVhcjogLT5cbiAgICAgICAgcmV0dXJuIGlmIEBicm93c2VyLmNsZWFuVXAoKVxuICAgICAgICBzdXBlcigpXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIHN0YXJ0OiAoYWN0aW9uKSAtPlxuXG4gICAgICAgICMga2xvZyAnYnJvd3NlLnN0YXJ0JyBhY3Rpb25cbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLnN0YXJ0KClcblxuICAgICAgICBpZiBhY3Rpb24gIT0gJ3NoZWxmJ1xuICAgICAgICAgICAgaWYgd2luZG93LmVkaXRvci5jdXJyZW50RmlsZT8gYW5kIHNsYXNoLmlzRmlsZSB3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICAgICAgICAgQHNldFRleHQgc2xhc2gudGlsZGUgd2luZG93LmVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgICAgIEBicm93c2VyLm5hdmlnYXRlVG9GaWxlIHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2ZpbGVicm93c2VyJyAnbG9hZEl0ZW0nIGZpbGU6cHJvY2Vzcy5jd2QoKSwgdHlwZTonZGlyJ1xuICAgICAgICAgICAgQGJyb3dzZXIuZm9jdXMgZm9yY2U6dHJ1ZVxuXG4gICAgICAgIG5hbWUgPSBhY3Rpb25cbiAgICAgICAgbmFtZSA9ICdicm93c2UnIGlmIGFjdGlvbiA9PSAnc2hlbGYnXG5cbiAgICAgICAgc3VwZXIgbmFtZVxuXG4gICAgICAgIHNlbGVjdDogdHJ1ZVxuICAgICAgICBkbzogICAgIEBuYW1lID09ICdCcm93c2UnIGFuZCAnaGFsZiBicm93c2VyJyBvciAncXVhcnQgYnJvd3NlcidcbiAgICAgICAgZm9jdXM6ICBhY3Rpb24gPT0gJ3NoZWxmJyBhbmQgJ3NoZWxmJyBvciBudWxsXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgY29tcGxldGVDYWxsYmFjazogKGZpbGVzKSA9PlxuXG4gICAgICAgIGlmIG5vdCBlbXB0eSBAZ2V0VGV4dCgpLnRyaW0oKVxuICAgICAgICAgICAgdGV4dCA9IHNsYXNoLnJlc29sdmUgQGdldFRleHQoKS50cmltKClcbiAgICAgICAgICAgIG1hdGNoZXMgPSBmaWxlcy5maWx0ZXIgKGYpIC0+IGYuZmlsZS5zdGFydHNXaXRoIHRleHRcblxuICAgICAgICAgICAgaWYgbm90IGVtcHR5IG1hdGNoZXNcbiAgICAgICAgICAgICAgICBAc2V0VGV4dCBzbGFzaC50aWxkZSBtYXRjaGVzWzBdLmZpbGVcblxuICAgICAgICAgICAgaWYgbWF0Y2hlcy5sZW5ndGggPiAxXG5cbiAgICAgICAgICAgICAgICBpdGVtcyA9IG1hdGNoZXMubWFwIChtKSAtPlxuXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBPYmplY3QuY3JlYXRlIG51bGxcblxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggbS50eXBlXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGVuICdmaWxlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ubGluZSA9ICcgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY2xzcyA9ICdmaWxlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ubGluZSA9ICfilrgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jbHNzID0gJ2RpcmVjdG9yeSdcblxuICAgICAgICAgICAgICAgICAgICBpdGVtLnRleHQgPSBzbGFzaC5maWxlIG0uZmlsZVxuICAgICAgICAgICAgICAgICAgICBpdGVtLmZpbGUgPSBtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgaXRlbVxuXG4gICAgICAgICAgICAgICAgQHNob3dJdGVtcyBpdGVtc1xuICAgICAgICAgICAgICAgIEBzZWxlY3QgMFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICBAaGlkZUxpc3QoKVxuXG4gICAgY29tcGxldGU6IC0+XG5cbiAgICAgICAgdGV4dCA9IEBnZXRUZXh0KCkudHJpbSgpXG5cbiAgICAgICAgaWYgbm90IHRleHQuZW5kc1dpdGgoJy8nKSBhbmQgc2xhc2guZGlyRXhpc3RzIHRleHRcbiAgICAgICAgICAgIEBzZXRUZXh0IHRleHQgKyAnLydcbiAgICAgICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgICAgICB0cnVlXG4gICAgICAgIGVsc2UgaWYgdGV4dC5lbmRzV2l0aCAnLydcbiAgICAgICAgICAgIGlmIHNsYXNoLmRpckV4aXN0cyBzbGFzaC5yZXNvbHZlIHRleHRcbiAgICAgICAgICAgICAgICBzbGFzaC5saXN0IHNsYXNoLnJlc29sdmUodGV4dCksIEBjb21wbGV0ZUNhbGxiYWNrXG4gICAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICBlbHNlIGlmIG5vdCBlbXB0eSBzbGFzaC5kaXIgdGV4dFxuICAgICAgICAgICAgaWYgc2xhc2guZGlyRXhpc3RzIHNsYXNoLnJlc29sdmUgc2xhc2guZGlyIHRleHRcbiAgICAgICAgICAgICAgICBzbGFzaC5saXN0IHNsYXNoLnJlc29sdmUoc2xhc2guZGlyKHRleHQpKSwgQGNvbXBsZXRlQ2FsbGJhY2tcbiAgICAgICAgICAgICAgICB0cnVlXG5cbiAgICBvblRhYkNvbXBsZXRpb246IC0+XG5cbiAgICAgICAgQGNvbXBsZXRlKClcbiAgICAgICAgdHJ1ZVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGNvbW1vblByZWZpeDogKHN0ckEsc3RyQikgLT5cblxuICAgICAgICBwcmVmaXggPSAnJ1xuICAgICAgICBmb3IgaSBpbiBbMC4uLk1hdGgubWluKHN0ckEubGVuZ3RoLCBzdHJCLmxlbmd0aCldXG4gICAgICAgICAgICBicmVhayBpZiBzdHJBW2ldICE9IHN0ckJbaV1cbiAgICAgICAgICAgIHByZWZpeCArPSBzdHJBW2ldXG4gICAgICAgIHByZWZpeFxuXG4gICAgY2xlYXJCcm9rZW5QYXJ0Rm9yRmlsZXM6IChmaWxlcykgLT5cblxuICAgICAgICBicm9rZW5QYXRoID0gc2xhc2gucmVzb2x2ZSBAZ2V0VGV4dCgpXG4gICAgICAgIGxvbmdlc3RNYXRjaCA9ICcnXG4gICAgICAgIGZvciBmaWxlIGluIGZpbGVzXG4gICAgICAgICAgICBmaWxlID0gZmlsZS5maWxlXG4gICAgICAgICAgICBwcmVmaXggPSBAY29tbW9uUHJlZml4IGZpbGUsIGJyb2tlblBhdGhcbiAgICAgICAgICAgIGlmIHByZWZpeC5sZW5ndGggPiBsb25nZXN0TWF0Y2gubGVuZ3RoXG4gICAgICAgICAgICAgICAgbG9uZ2VzdE1hdGNoID0gcHJlZml4XG4gICAgICAgIGwgPSBAZ2V0VGV4dCgpLmxlbmd0aFxuXG4gICAgICAgIGlmIG5vdCBlbXB0eSBsb25nZXN0TWF0Y2hcbiAgICAgICAgICAgIEBzZXRUZXh0IHNsYXNoLnRpbGRlIGxvbmdlc3RNYXRjaFxuICAgICAgICAgICAgQGNvbXBsZXRlKClcblxuICAgIGNoYW5nZWRDYWxsYmFjazogKGZpbGVzKSA9PlxuXG4gICAgICAgIGlmIGVtcHR5IEBnZXRUZXh0KCkudHJpbSgpXG4gICAgICAgICAgICBAaGlkZUxpc3QoKVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgcGF0aCA9IHNsYXNoLnJlc29sdmUgQGdldFRleHQoKS50cmltKClcbiAgICAgICAgbWF0Y2hlcyA9IGZpbGVzLmZpbHRlciAoZikgLT4gZi5maWxlLnN0YXJ0c1dpdGggcGF0aFxuXG4gICAgICAgIGlmIGVtcHR5IG1hdGNoZXNcbiAgICAgICAgICAgIEBjbGVhckJyb2tlblBhcnRGb3JGaWxlcyBmaWxlc1xuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgcyA9IHNsYXNoLnRpbGRlKHBhdGgpLmxlbmd0aFxuXG4gICAgICAgIHRleHQgPSBzbGFzaC50aWxkZSBzbGFzaC50aWxkZSBtYXRjaGVzWzBdLmZpbGVcbiAgICAgICAgQHNldFRleHQgdGV4dFxuXG4gICAgICAgIGwgPSB0ZXh0Lmxlbmd0aFxuXG4gICAgICAgIEBjb21tYW5kbGluZS5zZWxlY3RTaW5nbGVSYW5nZSBbMCwgW3MsbF1dLCBiZWZvcmU6IHRydWVcblxuICAgICAgICBpZiBtYXRjaGVzLmxlbmd0aCA8IDJcbiAgICAgICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgIGVsc2VcblxuICAgICAgICAgICAgaXRlbXMgPSBtYXRjaGVzLm1hcCAobSkgLT5cblxuICAgICAgICAgICAgICAgIGl0ZW0gPSBPYmplY3QuY3JlYXRlIG51bGxcblxuICAgICAgICAgICAgICAgIHN3aXRjaCBtLnR5cGVcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnZmlsZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ubGluZSA9ICcgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jbHNzID0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ubGluZSA9ICfilrgnXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNsc3MgPSAnZGlyZWN0b3J5J1xuXG4gICAgICAgICAgICAgICAgaXRlbS50ZXh0ID0gc2xhc2guZmlsZSBtLmZpbGVcbiAgICAgICAgICAgICAgICBpdGVtLmZpbGUgPSBtLmZpbGVcbiAgICAgICAgICAgICAgICBpdGVtXG5cbiAgICAgICAgICAgIEBzaG93SXRlbXMgaXRlbXNcblxuICAgIGNoYW5nZWQ6IChjb21tYW5kKSAtPlxuXG4gICAgICAgICMga2xvZyAnYnJvd3NlLmNoYW5nZWQnIGNvbW1hbmRcbiAgICAgICAgdGV4dCA9IEBnZXRUZXh0KCkudHJpbSgpXG4gICAgICAgIGlmIG5vdCB0ZXh0LmVuZHNXaXRoICcvJ1xuICAgICAgICAgICAgQHdhbGtlcj8uZW5kKClcbiAgICAgICAgICAgIEB3YWxrZXIgPSBzbGFzaC5saXN0IHNsYXNoLnJlc29sdmUoc2xhc2guZGlyKHRleHQpKSwgQGNoYW5nZWRDYWxsYmFja1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaGlkZUxpc3QoKVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMFxuXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9FdmVudDogKG1vZCwga2V5LCBjb21ibywgZXZlbnQpIC0+XG5cbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdiYWNrc3BhY2UnXG4gICAgICAgICAgICAgICAgaWYgY29tbWFuZGxpbmUubWFpbkN1cnNvcigpWzBdID09IGNvbW1hbmRsaW5lLnNlbGVjdGlvbigwKT9bMV1bMF0gIyBjdXJzb3IgaXMgYXQgc2VsZWN0aW9uIHN0YXJ0XG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRsaW5lLmRvLnN0YXJ0KCkgICAgICAgICAjIGZvcmNlIHNpbXVsdGFuZW91c1xuICAgICAgICAgICAgICAgICAgICBjb21tYW5kbGluZS5kZWxldGVTZWxlY3Rpb24oKSAgIyBkZWxldGlvbiBvZiBzZWxlY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZGxpbmUuZGVsZXRlQmFja3dhcmQoKSAgICMgYW5kIGJhY2tzcGFjZS5cbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZGxpbmUuZG8uZW5kKCkgICAgICAgICAgICMgaXQgc2hvdWxkIGZlZWwgYXMgaWYgc2VsZWN0aW9uIHdhc24ndCB0aGVyZS5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB3aGVuICdlbnRlcidcbiAgICAgICAgICAgICAgICBAZXhlY3V0ZSBAZ2V0VGV4dCgpXG4gICAgICAgICAgICAgICAgZm9jdXNCcm93c2VyID0gPT4gQGJyb3dzZXIuZm9jdXMgZm9yY2U6dHJ1ZVxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQgZm9jdXNCcm93c2VyLCAxMDBcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgJ3VuaGFuZGxlZCdcblxuICAgICMgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbGlzdENsaWNrOiAoaW5kZXgpID0+XG5cbiAgICAgICAgZmlsZSA9IEBjb21tYW5kTGlzdC5pdGVtc1tpbmRleF0/LmZpbGVcbiAgICAgICAgZmlsZSA9IHNsYXNoLnRpbGRlIGZpbGUgaWYgZmlsZT9cbiAgICAgICAgZmlsZSA/PSBAY29tbWFuZExpc3QubGluZSBpbmRleFxuICAgICAgICBAc2VsZWN0ZWQgPSBpbmRleFxuICAgICAgICBAZXhlY3V0ZSBmaWxlXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDBcblxuICAgIHNlbGVjdDogKGkpIC0+XG5cbiAgICAgICAgQHNlbGVjdGVkID0gY2xhbXAgLTEsIEBjb21tYW5kTGlzdD8ubnVtTGluZXMoKS0xLCBpXG5cbiAgICAgICAgaWYgQHNlbGVjdGVkIDwgMFxuICAgICAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIEBjb21tYW5kTGlzdD8uc2VsZWN0U2luZ2xlUmFuZ2UgQGNvbW1hbmRMaXN0LnJhbmdlRm9yTGluZUF0SW5kZXggQHNlbGVjdGVkXG4gICAgICAgIEBjb21tYW5kTGlzdD8uZG8uY3Vyc29ycyBbWzAsIEBzZWxlY3RlZF1dXG5cbiAgICAgICAgdGV4dCA9IHNsYXNoLnRpbGRlIEBjb21tYW5kTGlzdC5pdGVtc1tAc2VsZWN0ZWRdLmZpbGVcbiAgICAgICAgQHNldFRleHQgdGV4dFxuICAgICAgICBzID0gc2xhc2guZmlsZSh0ZXh0KS5sZW5ndGhcbiAgICAgICAgbCA9IHRleHQubGVuZ3RoXG4gICAgICAgIEBjb21tYW5kbGluZS5zZWxlY3RTaW5nbGVSYW5nZSBbMCwgW2wtcyxsXV1cblxuICAgIHNlbGVjdExpc3RJdGVtOiAoZGlyKSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGNvbW1hbmRMaXN0P1xuXG4gICAgICAgIHN3aXRjaCBkaXJcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgIHRoZW4gQHNlbGVjdCBAc2VsZWN0ZWQtMVxuICAgICAgICAgICAgd2hlbiAnZG93bicgdGhlbiBAc2VsZWN0IEBzZWxlY3RlZCsxXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBjYW5jZWw6IC0+XG5cbiAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgZm9jdXM6IEByZWNlaXZlclxuICAgICAgICBzaG93OiAnZWRpdG9yJ1xuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBleGVjdXRlOiAoY29tbWFuZCkgLT5cblxuICAgICAgICByZXR1cm4ga2Vycm9yIFwibm8gY29tbWFuZD9cIiBpZiBub3QgY29tbWFuZD9cblxuICAgICAgICBAaGlkZUxpc3QoKVxuXG4gICAgICAgIEBjbWRJRCArPSAxXG4gICAgICAgIGNtZCA9IGNvbW1hbmQudHJpbSgpXG4gICAgICAgIGlmIGNtZC5sZW5ndGhcbiAgICAgICAgICAgIGlmIHNsYXNoLmRpckV4aXN0cyBzbGFzaC5yZW1vdmVMaW5lUG9zIGNtZFxuICAgICAgICAgICAgICAgIEBicm93c2VyLmxvYWRJdGVtIGZpbGU6Y21kLCB0eXBlOidkaXInXG4gICAgICAgICAgICAgICAgQGNvbW1hbmRsaW5lLnNldFRleHQgY21kXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBlbHNlIGlmIHNsYXNoLmZpbGVFeGlzdHMgc2xhc2gucmVtb3ZlTGluZVBvcyBjbWRcbiAgICAgICAgICAgICAgICBAY29tbWFuZGxpbmUuc2V0VGV4dCBjbWRcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUb0ZpbGUnIGZpbGU6Y21kXG4gICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAga2Vycm9yICdicm93c2UuZXhlY3V0ZSAtLSB1bmhhbmRsZWQnIGNtZFxuXG4gICAgb25Ccm93c2VySXRlbUFjdGl2YXRlZDogKGl0ZW0pID0+XG5cbiAgICAgICAgIyBrbG9nICdvbkJyb3dzZXJJdGVtQWN0aXZhdGVkJyBpdGVtLnR5cGUsIGl0ZW0uZmlsZVxuICAgICAgICBcbiAgICAgICAgaWYgbm90IEBpc0FjdGl2ZSgpXG4gICAgICAgICAgICBAY29tbWFuZGxpbmUuY29tbWFuZD8ub25Ccm93c2VySXRlbUFjdGl2YXRlZD8gaXRlbVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgaWYgaXRlbS5maWxlXG4gICAgICAgICAgICBwdGggPSBzbGFzaC50aWxkZSBpdGVtLmZpbGVcbiAgICAgICAgICAgIGlmIGl0ZW0udHlwZSA9PSAnZGlyJ1xuICAgICAgICAgICAgICAgIHB0aCArPSAnLydcbiAgICAgICAgICAgICAgICBpZiBpdGVtLm5hbWUgPT0gJy4uJyBhbmQgQGJyb3dzZXIuYWN0aXZlQ29sdW1uKCk/LnBhcmVudD8uZmlsZVxuICAgICAgICAgICAgICAgICAgICAjIHNob3cgY3VycmVudCBwYXRoIGluc3RlYWQgb2YgdXBkaXIgd2hlbiAuLiBpdGVtIHdhcyBhY3RpdmF0ZWRcbiAgICAgICAgICAgICAgICAgICAgcHRoID0gc2xhc2gudGlsZGUgQGJyb3dzZXIuYWN0aXZlQ29sdW1uKCk/LnBhcmVudD8uZmlsZVxuXG4gICAgICAgICAgICBAY29tbWFuZGxpbmUuc2V0VGV4dCBwdGhcblxubW9kdWxlLmV4cG9ydHMgPSBCcm93c2VcbiJdfQ==
//# sourceURL=../../coffee/commands/browse.coffee