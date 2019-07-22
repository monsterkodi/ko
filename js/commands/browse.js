// koffee 1.3.0

/*
0000000    00000000    0000000   000   000   0000000  00000000
000   000  000   000  000   000  000 0 000  000       000
0000000    0000000    000   000  000000000  0000000   0000000
000   000  000   000  000   000  000   000       000  000
0000000    000   000   0000000   00     00  0000000   00000000
 */
var $, Browse, Command, FileBrowser, clamp, dirList, empty, kerror, os, post, ref, slash, stopEvent, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), post = ref.post, slash = ref.slash, stopEvent = ref.stopEvent, valid = ref.valid, empty = ref.empty, os = ref.os, clamp = ref.clamp, kerror = ref.kerror, $ = ref.$;

Command = require('../commandline/command');

FileBrowser = require('../browser/filebrowser');

dirList = require('../tools/dirlist');

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
        this.names = ["browse", "Browse", "shelf"];
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

    Browse.prototype.completeCallback = function(err, files) {
        var items, matches, text;
        if (err == null) {
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
                dirList(slash.resolve(text), this.completeCallback);
                return true;
            }
        } else if (!empty(slash.dir(text))) {
            if (slash.dirExists(slash.resolve(slash.dir(text)))) {
                dirList(slash.resolve(slash.dir(text)), this.completeCallback);
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

    Browse.prototype.changedCallback = function(err, files) {
        var items, l, matches, path, s, text;
        if (err == null) {
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
        }
    };

    Browse.prototype.changed = function(command) {
        var ref1, text;
        text = this.getText().trim();
        if (!text.endsWith('/')) {
            if ((ref1 = this.walker) != null) {
                ref1.end();
            }
            return this.walker = dirList(slash.resolve(slash.dir(text)), this.changedCallback);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3NlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxzR0FBQTtJQUFBOzs7O0FBUUEsTUFBaUUsT0FBQSxDQUFRLEtBQVIsQ0FBakUsRUFBRSxlQUFGLEVBQVEsaUJBQVIsRUFBZSx5QkFBZixFQUEwQixpQkFBMUIsRUFBaUMsaUJBQWpDLEVBQXdDLFdBQXhDLEVBQTRDLGlCQUE1QyxFQUFtRCxtQkFBbkQsRUFBMkQ7O0FBRTNELE9BQUEsR0FBYyxPQUFBLENBQVEsd0JBQVI7O0FBQ2QsV0FBQSxHQUFjLE9BQUEsQ0FBUSx3QkFBUjs7QUFDZCxPQUFBLEdBQWMsT0FBQSxDQUFRLGtCQUFSOztBQUVSOzs7SUFFVyxnQkFBQyxXQUFEOzs7Ozs7UUFFVCx3Q0FBTSxXQUFOO1FBRUEsSUFBQyxDQUFBLEtBQUQsR0FBWTtRQUNaLElBQUMsQ0FBQSxPQUFELEdBQVksSUFBSSxXQUFKLENBQWdCLENBQUEsQ0FBRSxTQUFGLENBQWhCO1FBQ1osSUFBQyxDQUFBLFFBQUQsR0FBWSxNQUFNLENBQUMsTUFBUCxDQUFjLElBQWQ7UUFDWixJQUFDLENBQUEsS0FBRCxHQUFZLENBQUMsUUFBRCxFQUFXLFFBQVgsRUFBcUIsT0FBckI7UUFFWixJQUFJLENBQUMsRUFBTCxDQUFRLE1BQVIsRUFBZ0IsSUFBQyxDQUFBLE1BQWpCO1FBRUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksZUFBWixFQUE2QixJQUFDLENBQUEsc0JBQTlCO1FBRUEsSUFBQyxDQUFBLFVBQUQsR0FBYztJQWJMOztxQkFlYixNQUFBLEdBQVEsU0FBQyxJQUFEO1FBRUosSUFBRyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQUEsSUFBZ0IsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFBLEtBQWMsS0FBSyxDQUFDLEtBQU4sQ0FBWSxJQUFaLENBQWpDO21CQUNJLElBQUMsQ0FBQSxPQUFELENBQVMsS0FBSyxD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SEM7YUFMVDs7ZUFVQSxNQUFBLENBQU8sNkJBQVAsRUFBc0MsR0FBdEM7SUFsQks7O3FCQW9CVCxzQkFBQSxHQUF3QixTQUFDLElBQUQ7QUFFcEIsWUFBQTtRQUFBLElBQUcsQ0FBSSxJQUFDLENBQUEsUUFBRCxDQUFBLENBQVA7Ozt3QkFDd0IsQ0FBRSx1QkFBd0I7OztBQUM5QyxtQkFGSjs7UUFJQSxJQUFHLElBQUksQ0FBQyxJQUFSO1lBQ0ksR0FBQSxHQUFNLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBSSxDQUFDLElBQWpCO1lBQ04sSUFBRyxJQUFJLENBQUMsSUFBTCxLQUFhLEtBQWhCO2dCQUNJLEdBQUEsSUFBTztnQkFDUCxJQUFHLElBQUksQ0FBQyxJQUFMLEtBQWEsSUFBYix1RkFBcUQsQ0FBRSx1QkFBMUQ7b0JBRUksR0FBQSxHQUFNLEtBQUssQ0FBQyxLQUFOLG1GQUEyQyxDQUFFLHNCQUE3QyxFQUZWO2lCQUZKOzttQkFNQSxJQUFDLENBQUEsV0FBVyxDQUFDLE9BQWIsQ0FBcUIsR0FBckIsRUFSSjs7SUFOb0I7Ozs7R0EvU1A7O0FBK1RyQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMFxuMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAgICAwMDAwMDAwMFxuIyMjXG5cbnsgcG9zdCwgc2xhc2gsIHN0b3BFdmVudCwgdmFsaWQsIGVtcHR5LCBvcywgY2xhbXAsIGtlcnJvciwgJCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Db21tYW5kICAgICA9IHJlcXVpcmUgJy4uL2NvbW1hbmRsaW5lL2NvbW1hbmQnXG5GaWxlQnJvd3NlciA9IHJlcXVpcmUgJy4uL2Jyb3dzZXIvZmlsZWJyb3dzZXInXG5kaXJMaXN0ICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL2Rpcmxpc3QnXG5cbmNsYXNzIEJyb3dzZSBleHRlbmRzIENvbW1hbmRcblxuICAgIGNvbnN0cnVjdG9yOiAoY29tbWFuZGxpbmUpIC0+XG5cbiAgICAgICAgc3VwZXIgY29tbWFuZGxpbmVcblxuICAgICAgICBAY21kSUQgICAgPSAwXG4gICAgICAgIEBicm93c2VyICA9IG5ldyBGaWxlQnJvd3NlciAkICdicm93c2VyJ1xuICAgICAgICBAY29tbWFuZHMgPSBPYmplY3QuY3JlYXRlIG51bGxcbiAgICAgICAgQG5hbWVzICAgID0gW1wiYnJvd3NlXCIsIFwiQnJvd3NlXCIsIFwic2hlbGZcIl1cblxuICAgICAgICBwb3N0Lm9uICdmaWxlJywgQG9uRmlsZVxuXG4gICAgICAgIEBicm93c2VyLm9uICdpdGVtQWN0aXZhdGVkJywgQG9uQnJvd3Nlckl0ZW1BY3RpdmF0ZWRcblxuICAgICAgICBAc3ludGF4TmFtZSA9ICdicm93c2VyJ1xuXG4gICAgb25GaWxlOiAoZmlsZSkgPT5cblxuICAgICAgICBpZiBAaXNBY3RpdmUoKSBhbmQgQGdldFRleHQoKSAhPSBzbGFzaC50aWxkZSBmaWxlXG4gICAgICAgICAgICBAc2V0VGV4dCBzbGFzaC50aWxkZSBmaWxlXG5cbiAgICBjbGVhcjogLT5cbiAgICAgICAgcmV0dXJuIGlmIEBicm93c2VyLmNsZWFuVXAoKVxuICAgICAgICBzdXBlcigpXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIHN0YXJ0OiAoYWN0aW9uKSAtPlxuXG4gICAgICAgIEBicm93c2VyLnN0YXJ0KClcblxuICAgICAgICBpZiBhY3Rpb24gIT0gJ3NoZWxmJ1xuICAgICAgICAgICAgaWYgd2luZG93LmVkaXRvci5jdXJyZW50RmlsZT8gYW5kIHNsYXNoLmlzRmlsZSB3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICAgICAgICAgQGJyb3dzZXIubmF2aWdhdGVUb0ZpbGUgd2luZG93LmVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnZmlsZWJyb3dzZXInLCAnbG9hZEl0ZW0nLCBmaWxlOnByb2Nlc3MuY3dkKCksIHR5cGU6J2RpcidcbiAgICAgICAgICAgIEBicm93c2VyLmZvY3VzKClcblxuICAgICAgICBuYW1lID0gYWN0aW9uXG4gICAgICAgIG5hbWUgPSAnYnJvd3NlJyBpZiBhY3Rpb24gPT0gJ3NoZWxmJ1xuXG4gICAgICAgIHN1cGVyIG5hbWVcblxuICAgICAgICBzZWxlY3Q6IHRydWVcbiAgICAgICAgZG86ICAgICBAbmFtZSA9PSAnQnJvd3NlJyBhbmQgJ2hhbGYgYnJvd3Nlcicgb3IgJ3F1YXJ0IGJyb3dzZXInXG4gICAgICAgIGZvY3VzOiAgYWN0aW9uID09ICdzaGVsZicgYW5kICdzaGVsZicgb3IgbnVsbFxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIGNvbXBsZXRlQ2FsbGJhY2s6IChlcnIsIGZpbGVzKSA9PlxuXG4gICAgICAgIGlmIG5vdCBlcnI/XG4gICAgICAgICAgICBpZiBub3QgZW1wdHkgQGdldFRleHQoKS50cmltKClcbiAgICAgICAgICAgICAgICB0ZXh0ID0gc2xhc2gucmVzb2x2ZSBAZ2V0VGV4dCgpLnRyaW0oKVxuICAgICAgICAgICAgICAgIG1hdGNoZXMgPSBmaWxlcy5maWx0ZXIgKGYpIC0+IGYuZmlsZS5zdGFydHNXaXRoIHRleHRcblxuICAgICAgICAgICAgICAgIGlmIG5vdCBlbXB0eSBtYXRjaGVzXG4gICAgICAgICAgICAgICAgICAgIEBzZXRUZXh0IHNsYXNoLnRpbGRlIG1hdGNoZXNbMF0uZmlsZVxuXG4gICAgICAgICAgICAgICAgaWYgbWF0Y2hlcy5sZW5ndGggPiAxXG5cbiAgICAgICAgICAgICAgICAgICAgaXRlbXMgPSBtYXRjaGVzLm1hcCAobSkgLT5cblxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IE9iamVjdC5jcmVhdGUgbnVsbFxuXG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggbS50eXBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAnZmlsZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gJyAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY2xzcyA9ICdmaWxlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gJ+KWuCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jbHNzID0gJ2RpcmVjdG9yeSdcblxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS50ZXh0ID0gc2xhc2guZmlsZSBtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uZmlsZSA9IG0uZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbVxuXG4gICAgICAgICAgICAgICAgICAgIEBzaG93SXRlbXMgaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgQHNlbGVjdCAwXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICBAaGlkZUxpc3QoKVxuXG4gICAgY29tcGxldGU6IC0+XG5cbiAgICAgICAgdGV4dCA9IEBnZXRUZXh0KCkudHJpbSgpXG5cbiAgICAgICAgaWYgbm90IHRleHQuZW5kc1dpdGgoJy8nKSBhbmQgc2xhc2guZGlyRXhpc3RzIHRleHRcbiAgICAgICAgICAgIEBzZXRUZXh0IHRleHQgKyAnLydcbiAgICAgICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgICAgICB0cnVlXG4gICAgICAgIGVsc2UgaWYgdGV4dC5lbmRzV2l0aCAnLydcbiAgICAgICAgICAgIGlmIHNsYXNoLmRpckV4aXN0cyBzbGFzaC5yZXNvbHZlIHRleHRcbiAgICAgICAgICAgICAgICBkaXJMaXN0IHNsYXNoLnJlc29sdmUodGV4dCksIEBjb21wbGV0ZUNhbGxiYWNrXG4gICAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICBlbHNlIGlmIG5vdCBlbXB0eSBzbGFzaC5kaXIgdGV4dFxuICAgICAgICAgICAgaWYgc2xhc2guZGlyRXhpc3RzIHNsYXNoLnJlc29sdmUgc2xhc2guZGlyIHRleHRcbiAgICAgICAgICAgICAgICBkaXJMaXN0IHNsYXNoLnJlc29sdmUoc2xhc2guZGlyKHRleHQpKSwgQGNvbXBsZXRlQ2FsbGJhY2tcbiAgICAgICAgICAgICAgICB0cnVlXG5cbiAgICBvblRhYkNvbXBsZXRpb246IC0+XG5cbiAgICAgICAgQGNvbXBsZXRlKClcbiAgICAgICAgdHJ1ZVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGNvbW1vblByZWZpeDogKHN0ckEsc3RyQikgLT5cblxuICAgICAgICBwcmVmaXggPSAnJ1xuICAgICAgICBmb3IgaSBpbiBbMC4uLk1hdGgubWluKHN0ckEubGVuZ3RoLCBzdHJCLmxlbmd0aCldXG4gICAgICAgICAgICBicmVhayBpZiBzdHJBW2ldICE9IHN0ckJbaV1cbiAgICAgICAgICAgIHByZWZpeCArPSBzdHJBW2ldXG4gICAgICAgIHByZWZpeFxuXG4gICAgY2xlYXJCcm9rZW5QYXJ0Rm9yRmlsZXM6IChmaWxlcykgLT5cblxuICAgICAgICBicm9rZW5QYXRoID0gc2xhc2gucmVzb2x2ZSBAZ2V0VGV4dCgpXG4gICAgICAgIGxvbmdlc3RNYXRjaCA9ICcnXG4gICAgICAgIGZvciBmaWxlIGluIGZpbGVzXG4gICAgICAgICAgICBmaWxlID0gZmlsZS5maWxlXG4gICAgICAgICAgICBwcmVmaXggPSBAY29tbW9uUHJlZml4IGZpbGUsIGJyb2tlblBhdGhcbiAgICAgICAgICAgIGlmIHByZWZpeC5sZW5ndGggPiBsb25nZXN0TWF0Y2gubGVuZ3RoXG4gICAgICAgICAgICAgICAgbG9uZ2VzdE1hdGNoID0gcHJlZml4XG4gICAgICAgIGwgPSBAZ2V0VGV4dCgpLmxlbmd0aFxuXG4gICAgICAgIGlmIG5vdCBlbXB0eSBsb25nZXN0TWF0Y2hcbiAgICAgICAgICAgIEBzZXRUZXh0IHNsYXNoLnRpbGRlIGxvbmdlc3RNYXRjaFxuICAgICAgICAgICAgQGNvbXBsZXRlKClcblxuICAgIGNoYW5nZWRDYWxsYmFjazogKGVyciwgZmlsZXMpID0+XG5cbiAgICAgICAgaWYgbm90IGVycj9cblxuICAgICAgICAgICAgaWYgZW1wdHkgQGdldFRleHQoKS50cmltKClcbiAgICAgICAgICAgICAgICBAaGlkZUxpc3QoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICBwYXRoID0gc2xhc2gucmVzb2x2ZSBAZ2V0VGV4dCgpLnRyaW0oKVxuICAgICAgICAgICAgbWF0Y2hlcyA9IGZpbGVzLmZpbHRlciAoZikgLT4gZi5maWxlLnN0YXJ0c1dpdGggcGF0aFxuXG4gICAgICAgICAgICBpZiBlbXB0eSBtYXRjaGVzXG4gICAgICAgICAgICAgICAgQGNsZWFyQnJva2VuUGFydEZvckZpbGVzIGZpbGVzXG4gICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICAgIHMgPSBzbGFzaC50aWxkZShwYXRoKS5sZW5ndGhcblxuICAgICAgICAgICAgdGV4dCA9IHNsYXNoLnRpbGRlIHNsYXNoLnRpbGRlIG1hdGNoZXNbMF0uZmlsZVxuICAgICAgICAgICAgQHNldFRleHQgdGV4dFxuXG4gICAgICAgICAgICBsID0gdGV4dC5sZW5ndGhcblxuICAgICAgICAgICAgQGNvbW1hbmRsaW5lLnNlbGVjdFNpbmdsZVJhbmdlIFswLCBbcyxsXV0sIGJlZm9yZTogdHJ1ZVxuXG4gICAgICAgICAgICBpZiBtYXRjaGVzLmxlbmd0aCA8IDJcbiAgICAgICAgICAgICAgICBAaGlkZUxpc3QoKVxuICAgICAgICAgICAgZWxzZVxuXG4gICAgICAgICAgICAgICAgaXRlbXMgPSBtYXRjaGVzLm1hcCAobSkgLT5cblxuICAgICAgICAgICAgICAgICAgICBpdGVtID0gT2JqZWN0LmNyZWF0ZSBudWxsXG5cbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIG0udHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAnZmlsZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmxpbmUgPSAnICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNsc3MgPSAnZmlsZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmxpbmUgPSAn4pa4J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY2xzcyA9ICdkaXJlY3RvcnknXG5cbiAgICAgICAgICAgICAgICAgICAgaXRlbS50ZXh0ID0gc2xhc2guZmlsZSBtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5maWxlID0gbS5maWxlXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1cblxuICAgICAgICAgICAgICAgIEBzaG93SXRlbXMgaXRlbXNcblxuICAgIGNoYW5nZWQ6IChjb21tYW5kKSAtPlxuXG4gICAgICAgIHRleHQgPSBAZ2V0VGV4dCgpLnRyaW0oKVxuICAgICAgICBpZiBub3QgdGV4dC5lbmRzV2l0aCAnLydcbiAgICAgICAgICAgIEB3YWxrZXI/LmVuZCgpXG4gICAgICAgICAgICBAd2Fsa2VyID0gZGlyTGlzdCBzbGFzaC5yZXNvbHZlKHNsYXNoLmRpcih0ZXh0KSksIEBjaGFuZ2VkQ2FsbGJhY2tcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGhpZGVMaXN0KClcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDBcblxuICAgIGhhbmRsZU1vZEtleUNvbWJvRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGV2ZW50KSAtPlxuXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnYmFja3NwYWNlJ1xuICAgICAgICAgICAgICAgIGlmIGNvbW1hbmRsaW5lLm1haW5DdXJzb3IoKVswXSA9PSBjb21tYW5kbGluZS5zZWxlY3Rpb24oMCk/WzFdWzBdICMgY3Vyc29yIGlzIGF0IHNlbGVjdGlvbiBzdGFydFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kbGluZS5kby5zdGFydCgpICAgICAgICAgIyBmb3JjZSBzaW11bHRhbmVvdXNcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZGxpbmUuZGVsZXRlU2VsZWN0aW9uKCkgICMgZGVsZXRpb24gb2Ygc2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRsaW5lLmRlbGV0ZUJhY2t3YXJkKCkgICAjIGFuZCBiYWNrc3BhY2UuXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRsaW5lLmRvLmVuZCgpICAgICAgICAgICAjIGl0IHNob3VsZCBmZWVsIGFzIGlmIHNlbGVjdGlvbiB3YXNuJ3QgdGhlcmUuXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgd2hlbiAnZW50ZXInXG4gICAgICAgICAgICAgICAgQGV4ZWN1dGUgQGdldFRleHQoKVxuICAgICAgICAgICAgICAgIGZvY3VzQnJvd3NlciA9ID0+IEBicm93c2VyLmZvY3VzKClcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0IGZvY3VzQnJvd3NlciwgMTAwXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICd1bmhhbmRsZWQnXG5cbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGxpc3RDbGljazogKGluZGV4KSA9PlxuXG4gICAgICAgIGZpbGUgPSBAY29tbWFuZExpc3QuaXRlbXNbaW5kZXhdPy5maWxlXG4gICAgICAgIGZpbGUgPSBzbGFzaC50aWxkZSBmaWxlIGlmIGZpbGU/XG4gICAgICAgIGZpbGUgPz0gQGNvbW1hbmRMaXN0LmxpbmUgaW5kZXhcbiAgICAgICAgQHNlbGVjdGVkID0gaW5kZXhcbiAgICAgICAgQGV4ZWN1dGUgZmlsZVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwXG5cbiAgICBzZWxlY3Q6IChpKSAtPlxuXG4gICAgICAgIEBzZWxlY3RlZCA9IGNsYW1wIC0xLCBAY29tbWFuZExpc3Q/Lm51bUxpbmVzKCktMSwgaVxuXG4gICAgICAgIGlmIEBzZWxlY3RlZCA8IDBcbiAgICAgICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBAY29tbWFuZExpc3Q/LnNlbGVjdFNpbmdsZVJhbmdlIEBjb21tYW5kTGlzdC5yYW5nZUZvckxpbmVBdEluZGV4IEBzZWxlY3RlZFxuICAgICAgICBAY29tbWFuZExpc3Q/LmRvLmN1cnNvcnMgW1swLCBAc2VsZWN0ZWRdXVxuXG4gICAgICAgIHRleHQgPSBzbGFzaC50aWxkZSBAY29tbWFuZExpc3QuaXRlbXNbQHNlbGVjdGVkXS5maWxlXG4gICAgICAgIEBzZXRUZXh0IHRleHRcbiAgICAgICAgcyA9IHNsYXNoLmZpbGUodGV4dCkubGVuZ3RoXG4gICAgICAgIGwgPSB0ZXh0Lmxlbmd0aFxuICAgICAgICBAY29tbWFuZGxpbmUuc2VsZWN0U2luZ2xlUmFuZ2UgWzAsIFtsLXMsbF1dXG5cbiAgICBzZWxlY3RMaXN0SXRlbTogKGRpcikgLT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IEBjb21tYW5kTGlzdD9cblxuICAgICAgICBzd2l0Y2ggZGlyXG4gICAgICAgICAgICB3aGVuICd1cCcgICB0aGVuIEBzZWxlY3QgQHNlbGVjdGVkLTFcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nIHRoZW4gQHNlbGVjdCBAc2VsZWN0ZWQrMVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgY2FuY2VsOiAtPlxuXG4gICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgIGZvY3VzOiBAcmVjZWl2ZXJcbiAgICAgICAgc2hvdzogJ2VkaXRvcidcblxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgZXhlY3V0ZTogKGNvbW1hbmQpIC0+XG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciBcIm5vIGNvbW1hbmQ/XCIgaWYgbm90IGNvbW1hbmQ/XG5cbiAgICAgICAgQGhpZGVMaXN0KClcblxuICAgICAgICBAY21kSUQgKz0gMVxuICAgICAgICBjbWQgPSBjb21tYW5kLnRyaW0oKVxuICAgICAgICBpZiBjbWQubGVuZ3RoXG4gICAgICAgICAgICBpZiBzbGFzaC5kaXJFeGlzdHMgc2xhc2gucmVtb3ZlTGluZVBvcyBjbWRcbiAgICAgICAgICAgICAgICBAYnJvd3Nlci5sb2FkSXRlbSBmaWxlOmNtZCwgdHlwZTonZGlyJ1xuICAgICAgICAgICAgICAgIEBjb21tYW5kbGluZS5zZXRUZXh0IGNtZFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgZWxzZSBpZiBzbGFzaC5maWxlRXhpc3RzIHNsYXNoLnJlbW92ZUxpbmVQb3MgY21kXG4gICAgICAgICAgICAgICAgQGNvbW1hbmRsaW5lLnNldFRleHQgY21kXG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG9GaWxlJywgZmlsZTpjbWRcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBrZXJyb3IgJ2Jyb3dzZS5leGVjdXRlIC0tIHVuaGFuZGxlZCcsIGNtZFxuXG4gICAgb25Ccm93c2VySXRlbUFjdGl2YXRlZDogKGl0ZW0pID0+XG5cbiAgICAgICAgaWYgbm90IEBpc0FjdGl2ZSgpXG4gICAgICAgICAgICBAY29tbWFuZGxpbmUuY29tbWFuZD8ub25Ccm93c2VySXRlbUFjdGl2YXRlZD8gaXRlbVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgaWYgaXRlbS5maWxlXG4gICAgICAgICAgICBwdGggPSBzbGFzaC50aWxkZSBpdGVtLmZpbGVcbiAgICAgICAgICAgIGlmIGl0ZW0udHlwZSA9PSAnZGlyJ1xuICAgICAgICAgICAgICAgIHB0aCArPSAnLydcbiAgICAgICAgICAgICAgICBpZiBpdGVtLm5hbWUgPT0gJy4uJyBhbmQgQGJyb3dzZXIuYWN0aXZlQ29sdW1uKCk/LnBhcmVudD8uZmlsZVxuICAgICAgICAgICAgICAgICAgICAjIHNob3cgY3VycmVudCBwYXRoIGluc3RlYWQgb2YgdXBkaXIgd2hlbiAuLiBpdGVtIHdhcyBhY3RpdmF0ZWRcbiAgICAgICAgICAgICAgICAgICAgcHRoID0gc2xhc2gudGlsZGUgQGJyb3dzZXIuYWN0aXZlQ29sdW1uKCk/LnBhcmVudD8uZmlsZVxuXG4gICAgICAgICAgICBAY29tbWFuZGxpbmUuc2V0VGV4dCBwdGhcblxubW9kdWxlLmV4cG9ydHMgPSBCcm93c2VcbiJdfQ==
//# sourceURL=../../coffee/commands/browse.coffee