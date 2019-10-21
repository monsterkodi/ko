// koffee 1.4.0

/*
0000000    00000000    0000000   000   000   0000000  00000000
000   000  000   000  000   000  000 0 000  000       000
0000000    0000000    000   000  000000000  0000000   0000000
000   000  000   000  000   000  000   000       000  000
0000000    000   000   0000000   00     00  0000000   00000000
 */
var $, Browse, Command, FileBrowser, clamp, dirList, empty, kerror, klog, os, post, ref, slash, stopEvent, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), post = ref.post, slash = ref.slash, os = ref.os, valid = ref.valid, empty = ref.empty, clamp = ref.clamp, stopEvent = ref.stopEvent, klog = ref.klog, kerror = ref.kerror, $ = ref.$;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3NlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSw0R0FBQTtJQUFBOzs7O0FBUUEsTUFBdUUsT0FBQSxDQUFRLEtBQVIsQ0FBdkUsRUFBRSxlQUFGLEVBQVEsaUJBQVIsRUFBZSxXQUFmLEVBQW1CLGlCQUFuQixFQUEwQixpQkFBMUIsRUFBaUMsaUJBQWpDLEVBQXdDLHlCQUF4QyxFQUFtRCxlQUFuRCxFQUF5RCxtQkFBekQsRUFBaUU7O0FBRWpFLE9BQUEsR0FBYyxPQUFBLENBQVEsd0JBQVI7O0FBQ2QsV0FBQSxHQUFjLE9BQUEsQ0FBUSx3QkFBUjs7QUFDZCxPQUFBLEdBQWMsT0FBQSxDQUFRLGtCQUFSOztBQUVSOzs7SUFFVyxnQkFBQyxXQUFEOzs7Ozs7UUFFVCx3Q0FBTSxXQUFOO1FBRUEsSUFBQyxDQUFBLEtBQUQsR0FBWTtRQUNaLElBQUMsQ0FBQSxPQUFELEdBQVksSUFBSSxXQUFKLENBQWdCLENBQUEsQ0FBRSxTQUFGLENBQWhCO1FBQ1osSUFBQyxDQUFBLFFBQUQsR0FBWSxNQUFNLENBQUMsTUFBUCxDQUFjLElBQWQ7UUFDWixJQUFDLENBQUEsS0FBRCxHQUFZLENBQUMsUUFBRCxFQUFVLFFBQVYsRUFBbUIsT0FBbkI7UUFFWixJQUFJLENBQUMsRUFBTCxDQUFRLE1BQVIsRUFBZSxJQUFDLENBQUEsTUFBaEI7UUFFQSxJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxlQUFaLEVBQTRCLElBQUMsQ0FBQSxzQkFBN0I7UUFFQSxJQUFDLENBQUEsVUFBRCxHQUFjO0lBYkw7O3FCQWViLE1BQUEsR0FBUSxTQUFDLElBQUQ7UUFFSixJQUFHLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBQSxJQUFnQixJQUFDLENBQUEsT0FBRCxDQUFBLENBQUEsS0FBYyxLQUFLLENBQUMsS0FBTixDQUFZLElBQVosQ0FBakM7bUJBQ0ksSUFBQyxDQUFBLE9BQUQs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eEI7QUFDQSx1QkFIQzthQUxUOztlQVVBLE1BQUEsQ0FBTyw2QkFBUCxFQUFzQyxHQUF0QztJQWxCSzs7cUJBb0JULHNCQUFBLEdBQXdCLFNBQUMsSUFBRDtBQUVwQixZQUFBO1FBQUEsSUFBRyxDQUFJLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBUDs7O3dCQUN3QixDQUFFLHVCQUF3Qjs7O0FBQzlDLG1CQUZKOztRQUlBLElBQUcsSUFBSSxDQUFDLElBQVI7WUFDSSxHQUFBLEdBQU0sS0FBSyxDQUFDLEtBQU4sQ0FBWSxJQUFJLENBQUMsSUFBakI7WUFDTixJQUFHLElBQUksQ0FBQyxJQUFMLEtBQWEsS0FBaEI7Z0JBQ0ksR0FBQSxJQUFPO2dCQUNQLElBQUcsSUFBSSxDQUFDLElBQUwsS0FBYSxJQUFiLHVGQUFxRCxDQUFFLHVCQUExRDtvQkFFSSxHQUFBLEdBQU0sS0FBSyxDQUFDLEtBQU4sbUZBQTJDLENBQUUsc0JBQTdDLEVBRlY7aUJBRko7O21CQU1BLElBQUMsQ0FBQSxXQUFXLENBQUMsT0FBYixDQUFxQixHQUFyQixFQVJKOztJQU5vQjs7OztHQWpUUDs7QUFpVXJCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwXG4wMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbjAwMDAwMDAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwXG4jIyNcblxueyBwb3N0LCBzbGFzaCwgb3MsIHZhbGlkLCBlbXB0eSwgY2xhbXAsIHN0b3BFdmVudCwga2xvZywga2Vycm9yLCAkIH0gPSByZXF1aXJlICdreGsnXG5cbkNvbW1hbmQgICAgID0gcmVxdWlyZSAnLi4vY29tbWFuZGxpbmUvY29tbWFuZCdcbkZpbGVCcm93c2VyID0gcmVxdWlyZSAnLi4vYnJvd3Nlci9maWxlYnJvd3NlcidcbmRpckxpc3QgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvZGlybGlzdCdcblxuY2xhc3MgQnJvd3NlIGV4dGVuZHMgQ29tbWFuZFxuXG4gICAgY29uc3RydWN0b3I6IChjb21tYW5kbGluZSkgLT5cblxuICAgICAgICBzdXBlciBjb21tYW5kbGluZVxuXG4gICAgICAgIEBjbWRJRCAgICA9IDBcbiAgICAgICAgQGJyb3dzZXIgID0gbmV3IEZpbGVCcm93c2VyICQgJ2Jyb3dzZXInXG4gICAgICAgIEBjb21tYW5kcyA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICBAbmFtZXMgICAgPSBbJ2Jyb3dzZScgJ0Jyb3dzZScgJ3NoZWxmJ11cblxuICAgICAgICBwb3N0Lm9uICdmaWxlJyBAb25GaWxlXG5cbiAgICAgICAgQGJyb3dzZXIub24gJ2l0ZW1BY3RpdmF0ZWQnIEBvbkJyb3dzZXJJdGVtQWN0aXZhdGVkXG5cbiAgICAgICAgQHN5bnRheE5hbWUgPSAnYnJvd3NlcidcblxuICAgIG9uRmlsZTogKGZpbGUpID0+XG5cbiAgICAgICAgaWYgQGlzQWN0aXZlKCkgYW5kIEBnZXRUZXh0KCkgIT0gc2xhc2gudGlsZGUgZmlsZVxuICAgICAgICAgICAgQHNldFRleHQgc2xhc2gudGlsZGUgZmlsZVxuXG4gICAgY2xlYXI6IC0+XG4gICAgICAgIHJldHVybiBpZiBAYnJvd3Nlci5jbGVhblVwKClcbiAgICAgICAgc3VwZXIoKVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbiAgICBzdGFydDogKGFjdGlvbikgLT5cblxuICAgICAgICAjIGtsb2cgJ2Jyb3dzZS5zdGFydCcgYWN0aW9uXG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5zdGFydCgpXG5cbiAgICAgICAgaWYgYWN0aW9uICE9ICdzaGVsZidcbiAgICAgICAgICAgIGlmIHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGU/IGFuZCBzbGFzaC5pc0ZpbGUgd2luZG93LmVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgICAgIEBicm93c2VyLm5hdmlnYXRlVG9GaWxlIHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2ZpbGVicm93c2VyJywgJ2xvYWRJdGVtJywgZmlsZTpwcm9jZXNzLmN3ZCgpLCB0eXBlOidkaXInXG4gICAgICAgICAgICBAYnJvd3Nlci5mb2N1cygpXG5cbiAgICAgICAgbmFtZSA9IGFjdGlvblxuICAgICAgICBuYW1lID0gJ2Jyb3dzZScgaWYgYWN0aW9uID09ICdzaGVsZidcblxuICAgICAgICBzdXBlciBuYW1lXG5cbiAgICAgICAgc2VsZWN0OiB0cnVlXG4gICAgICAgIGRvOiAgICAgQG5hbWUgPT0gJ0Jyb3dzZScgYW5kICdoYWxmIGJyb3dzZXInIG9yICdxdWFydCBicm93c2VyJ1xuICAgICAgICBmb2N1czogIGFjdGlvbiA9PSAnc2hlbGYnIGFuZCAnc2hlbGYnIG9yIG51bGxcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBjb21wbGV0ZUNhbGxiYWNrOiAoZXJyLCBmaWxlcykgPT5cblxuICAgICAgICBpZiBub3QgZXJyP1xuICAgICAgICAgICAgaWYgbm90IGVtcHR5IEBnZXRUZXh0KCkudHJpbSgpXG4gICAgICAgICAgICAgICAgdGV4dCA9IHNsYXNoLnJlc29sdmUgQGdldFRleHQoKS50cmltKClcbiAgICAgICAgICAgICAgICBtYXRjaGVzID0gZmlsZXMuZmlsdGVyIChmKSAtPiBmLmZpbGUuc3RhcnRzV2l0aCB0ZXh0XG5cbiAgICAgICAgICAgICAgICBpZiBub3QgZW1wdHkgbWF0Y2hlc1xuICAgICAgICAgICAgICAgICAgICBAc2V0VGV4dCBzbGFzaC50aWxkZSBtYXRjaGVzWzBdLmZpbGVcblxuICAgICAgICAgICAgICAgIGlmIG1hdGNoZXMubGVuZ3RoID4gMVxuXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zID0gbWF0Y2hlcy5tYXAgKG0pIC0+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBPYmplY3QuY3JlYXRlIG51bGxcblxuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIG0udHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ubGluZSA9ICcgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNsc3MgPSAnZmlsZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ubGluZSA9ICfilrgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY2xzcyA9ICdkaXJlY3RvcnknXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0udGV4dCA9IHNsYXNoLmZpbGUgbS5maWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmZpbGUgPSBtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1cblxuICAgICAgICAgICAgICAgICAgICBAc2hvd0l0ZW1zIGl0ZW1zXG4gICAgICAgICAgICAgICAgICAgIEBzZWxlY3QgMFxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgQGhpZGVMaXN0KClcblxuICAgIGNvbXBsZXRlOiAtPlxuXG4gICAgICAgIHRleHQgPSBAZ2V0VGV4dCgpLnRyaW0oKVxuXG4gICAgICAgIGlmIG5vdCB0ZXh0LmVuZHNXaXRoKCcvJykgYW5kIHNsYXNoLmRpckV4aXN0cyB0ZXh0XG4gICAgICAgICAgICBAc2V0VGV4dCB0ZXh0ICsgJy8nXG4gICAgICAgICAgICBAaGlkZUxpc3QoKVxuICAgICAgICAgICAgdHJ1ZVxuICAgICAgICBlbHNlIGlmIHRleHQuZW5kc1dpdGggJy8nXG4gICAgICAgICAgICBpZiBzbGFzaC5kaXJFeGlzdHMgc2xhc2gucmVzb2x2ZSB0ZXh0XG4gICAgICAgICAgICAgICAgZGlyTGlzdCBzbGFzaC5yZXNvbHZlKHRleHQpLCBAY29tcGxldGVDYWxsYmFja1xuICAgICAgICAgICAgICAgIHRydWVcbiAgICAgICAgZWxzZSBpZiBub3QgZW1wdHkgc2xhc2guZGlyIHRleHRcbiAgICAgICAgICAgIGlmIHNsYXNoLmRpckV4aXN0cyBzbGFzaC5yZXNvbHZlIHNsYXNoLmRpciB0ZXh0XG4gICAgICAgICAgICAgICAgZGlyTGlzdCBzbGFzaC5yZXNvbHZlKHNsYXNoLmRpcih0ZXh0KSksIEBjb21wbGV0ZUNhbGxiYWNrXG4gICAgICAgICAgICAgICAgdHJ1ZVxuXG4gICAgb25UYWJDb21wbGV0aW9uOiAtPlxuXG4gICAgICAgIEBjb21wbGV0ZSgpXG4gICAgICAgIHRydWVcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBjb21tb25QcmVmaXg6IChzdHJBLHN0ckIpIC0+XG5cbiAgICAgICAgcHJlZml4ID0gJydcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5NYXRoLm1pbihzdHJBLmxlbmd0aCwgc3RyQi5sZW5ndGgpXVxuICAgICAgICAgICAgYnJlYWsgaWYgc3RyQVtpXSAhPSBzdHJCW2ldXG4gICAgICAgICAgICBwcmVmaXggKz0gc3RyQVtpXVxuICAgICAgICBwcmVmaXhcblxuICAgIGNsZWFyQnJva2VuUGFydEZvckZpbGVzOiAoZmlsZXMpIC0+XG5cbiAgICAgICAgYnJva2VuUGF0aCA9IHNsYXNoLnJlc29sdmUgQGdldFRleHQoKVxuICAgICAgICBsb25nZXN0TWF0Y2ggPSAnJ1xuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlc1xuICAgICAgICAgICAgZmlsZSA9IGZpbGUuZmlsZVxuICAgICAgICAgICAgcHJlZml4ID0gQGNvbW1vblByZWZpeCBmaWxlLCBicm9rZW5QYXRoXG4gICAgICAgICAgICBpZiBwcmVmaXgubGVuZ3RoID4gbG9uZ2VzdE1hdGNoLmxlbmd0aFxuICAgICAgICAgICAgICAgIGxvbmdlc3RNYXRjaCA9IHByZWZpeFxuICAgICAgICBsID0gQGdldFRleHQoKS5sZW5ndGhcblxuICAgICAgICBpZiBub3QgZW1wdHkgbG9uZ2VzdE1hdGNoXG4gICAgICAgICAgICBAc2V0VGV4dCBzbGFzaC50aWxkZSBsb25nZXN0TWF0Y2hcbiAgICAgICAgICAgIEBjb21wbGV0ZSgpXG5cbiAgICBjaGFuZ2VkQ2FsbGJhY2s6IChlcnIsIGZpbGVzKSA9PlxuXG4gICAgICAgIGlmIG5vdCBlcnI/XG5cbiAgICAgICAgICAgIGlmIGVtcHR5IEBnZXRUZXh0KCkudHJpbSgpXG4gICAgICAgICAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICAgcGF0aCA9IHNsYXNoLnJlc29sdmUgQGdldFRleHQoKS50cmltKClcbiAgICAgICAgICAgIG1hdGNoZXMgPSBmaWxlcy5maWx0ZXIgKGYpIC0+IGYuZmlsZS5zdGFydHNXaXRoIHBhdGhcblxuICAgICAgICAgICAgaWYgZW1wdHkgbWF0Y2hlc1xuICAgICAgICAgICAgICAgIEBjbGVhckJyb2tlblBhcnRGb3JGaWxlcyBmaWxlc1xuICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICBzID0gc2xhc2gudGlsZGUocGF0aCkubGVuZ3RoXG5cbiAgICAgICAgICAgIHRleHQgPSBzbGFzaC50aWxkZSBzbGFzaC50aWxkZSBtYXRjaGVzWzBdLmZpbGVcbiAgICAgICAgICAgIEBzZXRUZXh0IHRleHRcblxuICAgICAgICAgICAgbCA9IHRleHQubGVuZ3RoXG5cbiAgICAgICAgICAgIEBjb21tYW5kbGluZS5zZWxlY3RTaW5nbGVSYW5nZSBbMCwgW3MsbF1dLCBiZWZvcmU6IHRydWVcblxuICAgICAgICAgICAgaWYgbWF0Y2hlcy5sZW5ndGggPCAyXG4gICAgICAgICAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgICAgIGVsc2VcblxuICAgICAgICAgICAgICAgIGl0ZW1zID0gbWF0Y2hlcy5tYXAgKG0pIC0+XG5cbiAgICAgICAgICAgICAgICAgICAgaXRlbSA9IE9iamVjdC5jcmVhdGUgbnVsbFxuXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCBtLnR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gJyAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jbHNzID0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gJ+KWuCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNsc3MgPSAnZGlyZWN0b3J5J1xuXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0udGV4dCA9IHNsYXNoLmZpbGUgbS5maWxlXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZmlsZSA9IG0uZmlsZVxuICAgICAgICAgICAgICAgICAgICBpdGVtXG5cbiAgICAgICAgICAgICAgICBAc2hvd0l0ZW1zIGl0ZW1zXG5cbiAgICBjaGFuZ2VkOiAoY29tbWFuZCkgLT5cblxuICAgICAgICB0ZXh0ID0gQGdldFRleHQoKS50cmltKClcbiAgICAgICAgaWYgbm90IHRleHQuZW5kc1dpdGggJy8nXG4gICAgICAgICAgICBAd2Fsa2VyPy5lbmQoKVxuICAgICAgICAgICAgQHdhbGtlciA9IGRpckxpc3Qgc2xhc2gucmVzb2x2ZShzbGFzaC5kaXIodGV4dCkpLCBAY2hhbmdlZENhbGxiYWNrXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBoaWRlTGlzdCgpXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0V2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBldmVudCkgLT5cblxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2JhY2tzcGFjZSdcbiAgICAgICAgICAgICAgICBpZiBjb21tYW5kbGluZS5tYWluQ3Vyc29yKClbMF0gPT0gY29tbWFuZGxpbmUuc2VsZWN0aW9uKDApP1sxXVswXSAjIGN1cnNvciBpcyBhdCBzZWxlY3Rpb24gc3RhcnRcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZGxpbmUuZG8uc3RhcnQoKSAgICAgICAgICMgZm9yY2Ugc2ltdWx0YW5lb3VzXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRsaW5lLmRlbGV0ZVNlbGVjdGlvbigpICAjIGRlbGV0aW9uIG9mIHNlbGVjdGlvblxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kbGluZS5kZWxldGVCYWNrd2FyZCgpICAgIyBhbmQgYmFja3NwYWNlLlxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kbGluZS5kby5lbmQoKSAgICAgICAgICAgIyBpdCBzaG91bGQgZmVlbCBhcyBpZiBzZWxlY3Rpb24gd2Fzbid0IHRoZXJlLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJ1xuICAgICAgICAgICAgICAgIEBleGVjdXRlIEBnZXRUZXh0KClcbiAgICAgICAgICAgICAgICBmb2N1c0Jyb3dzZXIgPSA9PiBAYnJvd3Nlci5mb2N1cygpXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCBmb2N1c0Jyb3dzZXIsIDEwMFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAndW5oYW5kbGVkJ1xuXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsaXN0Q2xpY2s6IChpbmRleCkgPT5cblxuICAgICAgICBmaWxlID0gQGNvbW1hbmRMaXN0Lml0ZW1zW2luZGV4XT8uZmlsZVxuICAgICAgICBmaWxlID0gc2xhc2gudGlsZGUgZmlsZSBpZiBmaWxlP1xuICAgICAgICBmaWxlID89IEBjb21tYW5kTGlzdC5saW5lIGluZGV4XG4gICAgICAgIEBzZWxlY3RlZCA9IGluZGV4XG4gICAgICAgIEBleGVjdXRlIGZpbGVcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMFxuXG4gICAgc2VsZWN0OiAoaSkgLT5cblxuICAgICAgICBAc2VsZWN0ZWQgPSBjbGFtcCAtMSwgQGNvbW1hbmRMaXN0Py5udW1MaW5lcygpLTEsIGlcblxuICAgICAgICBpZiBAc2VsZWN0ZWQgPCAwXG4gICAgICAgICAgICBAaGlkZUxpc3QoKVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgQGNvbW1hbmRMaXN0Py5zZWxlY3RTaW5nbGVSYW5nZSBAY29tbWFuZExpc3QucmFuZ2VGb3JMaW5lQXRJbmRleCBAc2VsZWN0ZWRcbiAgICAgICAgQGNvbW1hbmRMaXN0Py5kby5jdXJzb3JzIFtbMCwgQHNlbGVjdGVkXV1cblxuICAgICAgICB0ZXh0ID0gc2xhc2gudGlsZGUgQGNvbW1hbmRMaXN0Lml0ZW1zW0BzZWxlY3RlZF0uZmlsZVxuICAgICAgICBAc2V0VGV4dCB0ZXh0XG4gICAgICAgIHMgPSBzbGFzaC5maWxlKHRleHQpLmxlbmd0aFxuICAgICAgICBsID0gdGV4dC5sZW5ndGhcbiAgICAgICAgQGNvbW1hbmRsaW5lLnNlbGVjdFNpbmdsZVJhbmdlIFswLCBbbC1zLGxdXVxuXG4gICAgc2VsZWN0TGlzdEl0ZW06IChkaXIpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY29tbWFuZExpc3Q/XG5cbiAgICAgICAgc3dpdGNoIGRpclxuICAgICAgICAgICAgd2hlbiAndXAnICAgdGhlbiBAc2VsZWN0IEBzZWxlY3RlZC0xXG4gICAgICAgICAgICB3aGVuICdkb3duJyB0aGVuIEBzZWxlY3QgQHNlbGVjdGVkKzFcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGNhbmNlbDogLT5cblxuICAgICAgICBAaGlkZUxpc3QoKVxuICAgICAgICBmb2N1czogQHJlY2VpdmVyXG4gICAgICAgIHNob3c6ICdlZGl0b3InXG5cbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIGV4ZWN1dGU6IChjb21tYW5kKSAtPlxuXG4gICAgICAgIHJldHVybiBrZXJyb3IgXCJubyBjb21tYW5kP1wiIGlmIG5vdCBjb21tYW5kP1xuXG4gICAgICAgIEBoaWRlTGlzdCgpXG5cbiAgICAgICAgQGNtZElEICs9IDFcbiAgICAgICAgY21kID0gY29tbWFuZC50cmltKClcbiAgICAgICAgaWYgY21kLmxlbmd0aFxuICAgICAgICAgICAgaWYgc2xhc2guZGlyRXhpc3RzIHNsYXNoLnJlbW92ZUxpbmVQb3MgY21kXG4gICAgICAgICAgICAgICAgQGJyb3dzZXIubG9hZEl0ZW0gZmlsZTpjbWQsIHR5cGU6J2RpcidcbiAgICAgICAgICAgICAgICBAY29tbWFuZGxpbmUuc2V0VGV4dCBjbWRcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIGVsc2UgaWYgc2xhc2guZmlsZUV4aXN0cyBzbGFzaC5yZW1vdmVMaW5lUG9zIGNtZFxuICAgICAgICAgICAgICAgIEBjb21tYW5kbGluZS5zZXRUZXh0IGNtZFxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvRmlsZScsIGZpbGU6Y21kXG4gICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAga2Vycm9yICdicm93c2UuZXhlY3V0ZSAtLSB1bmhhbmRsZWQnLCBjbWRcblxuICAgIG9uQnJvd3Nlckl0ZW1BY3RpdmF0ZWQ6IChpdGVtKSA9PlxuXG4gICAgICAgIGlmIG5vdCBAaXNBY3RpdmUoKVxuICAgICAgICAgICAgQGNvbW1hbmRsaW5lLmNvbW1hbmQ/Lm9uQnJvd3Nlckl0ZW1BY3RpdmF0ZWQ/IGl0ZW1cbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIGl0ZW0uZmlsZVxuICAgICAgICAgICAgcHRoID0gc2xhc2gudGlsZGUgaXRlbS5maWxlXG4gICAgICAgICAgICBpZiBpdGVtLnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICBwdGggKz0gJy8nXG4gICAgICAgICAgICAgICAgaWYgaXRlbS5uYW1lID09ICcuLicgYW5kIEBicm93c2VyLmFjdGl2ZUNvbHVtbigpPy5wYXJlbnQ/LmZpbGVcbiAgICAgICAgICAgICAgICAgICAgIyBzaG93IGN1cnJlbnQgcGF0aCBpbnN0ZWFkIG9mIHVwZGlyIHdoZW4gLi4gaXRlbSB3YXMgYWN0aXZhdGVkXG4gICAgICAgICAgICAgICAgICAgIHB0aCA9IHNsYXNoLnRpbGRlIEBicm93c2VyLmFjdGl2ZUNvbHVtbigpPy5wYXJlbnQ/LmZpbGVcblxuICAgICAgICAgICAgQGNvbW1hbmRsaW5lLnNldFRleHQgcHRoXG5cbm1vZHVsZS5leHBvcnRzID0gQnJvd3NlXG4iXX0=
//# sourceURL=../../coffee/commands/browse.coffee