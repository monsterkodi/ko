// koffee 1.11.0

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

ref = require('kxk'), post = ref.post, slash = ref.slash, empty = ref.empty, clamp = ref.clamp, kerror = ref.kerror, klog = ref.klog, $ = ref.$;

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
        klog('changedCallback', files);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3NlLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9jb21tYW5kcyIsInNvdXJjZXMiOlsiYnJvd3NlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSw2RUFBQTtJQUFBOzs7O0FBUUEsTUFBaUQsT0FBQSxDQUFRLEtBQVIsQ0FBakQsRUFBRSxlQUFGLEVBQVEsaUJBQVIsRUFBZSxpQkFBZixFQUFzQixpQkFBdEIsRUFBNkIsbUJBQTdCLEVBQXFDLGVBQXJDLEVBQTJDOztBQUUzQyxPQUFBLEdBQWMsT0FBQSxDQUFRLHdCQUFSOztBQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsd0JBQVI7O0FBRVI7OztJQUVDLGdCQUFDLFdBQUQ7Ozs7OztRQUVDLHdDQUFNLFdBQU47UUFFQSxJQUFDLENBQUEsS0FBRCxHQUFZO1FBQ1osSUFBQyxDQUFBLE9BQUQsR0FBWSxJQUFJLFdBQUosQ0FBZ0IsQ0FBQSxDQUFFLFNBQUYsQ0FBaEI7UUFDWixJQUFDLENBQUEsUUFBRCxHQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWMsSUFBZDtRQUNaLElBQUMsQ0FBQSxLQUFELEdBQVksQ0FBQyxRQUFELEVBQVUsUUFBVixFQUFtQixPQUFuQjtRQUVaLElBQUksQ0FBQyxFQUFMLENBQVEsTUFBUixFQUFlLElBQUMsQ0FBQSxNQUFoQjtRQUVBLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLGVBQVosRUFBNEIsSUFBQyxDQUFBLHNCQUE3QjtRQUVBLElBQUMsQ0FBQSxVQUFELEdBQWM7SUFiZjs7cUJBZUgsTUFBQSxHQUFRLFNBQUMsSUFBRDtRQUVKLElBQUcsSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFBLElBQWdCLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBQSxLQUFjLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBWixDQUFqQzttQkFDSSxJQUFDLENBQUEsT0FBRCxDQUFTLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBWixDQUFULEVB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SEM7YUFMVDs7ZUFVQSxNQUFBLENBQU8sNkJBQVAsRUFBc0MsR0FBdEM7SUFsQks7O3FCQW9CVCxzQkFBQSxHQUF3QixTQUFDLElBQUQ7QUFFcEIsWUFBQTtRQUFBLElBQUcsQ0FBSSxJQUFDLENBQUEsUUFBRCxDQUFBLENBQVA7Ozt3QkFDd0IsQ0FBRSx1QkFBd0I7OztBQUM5QyxtQkFGSjs7UUFJQSxJQUFHLElBQUksQ0FBQyxJQUFSO1lBQ0ksR0FBQSxHQUFNLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBSSxDQUFDLElBQWpCO1lBQ04sSUFBRyxJQUFJLENBQUMsSUFBTCxLQUFhLEtBQWhCO2dCQUNJLEdBQUEsSUFBTztnQkFDUCxJQUFHLElBQUksQ0FBQyxJQUFMLEtBQWEsSUFBYix1RkFBcUQsQ0FBRSx1QkFBMUQ7b0JBRUksR0FBQSxHQUFNLEtBQUssQ0FBQyxLQUFOLG1GQUEyQyxDQUFFLHNCQUE3QyxFQUZWO2lCQUZKOzttQkFNQSxJQUFDLENBQUEsV0FBVyxDQUFDLE9BQWIsQ0FBcUIsR0FBckIsRUFSSjs7SUFOb0I7Ozs7R0FqVFA7O0FBaVVyQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMFxuMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAgICAwMDAwMDAwMFxuIyMjXG5cbnsgcG9zdCwgc2xhc2gsIGVtcHR5LCBjbGFtcCwga2Vycm9yLCBrbG9nLCAkIH0gPSByZXF1aXJlICdreGsnXG5cbkNvbW1hbmQgICAgID0gcmVxdWlyZSAnLi4vY29tbWFuZGxpbmUvY29tbWFuZCdcbkZpbGVCcm93c2VyID0gcmVxdWlyZSAnLi4vYnJvd3Nlci9maWxlYnJvd3NlcidcblxuY2xhc3MgQnJvd3NlIGV4dGVuZHMgQ29tbWFuZFxuXG4gICAgQDogKGNvbW1hbmRsaW5lKSAtPlxuXG4gICAgICAgIHN1cGVyIGNvbW1hbmRsaW5lXG5cbiAgICAgICAgQGNtZElEICAgID0gMFxuICAgICAgICBAYnJvd3NlciAgPSBuZXcgRmlsZUJyb3dzZXIgJCAnYnJvd3NlcidcbiAgICAgICAgQGNvbW1hbmRzID0gT2JqZWN0LmNyZWF0ZSBudWxsXG4gICAgICAgIEBuYW1lcyAgICA9IFsnYnJvd3NlJyAnQnJvd3NlJyAnc2hlbGYnXVxuXG4gICAgICAgIHBvc3Qub24gJ2ZpbGUnIEBvbkZpbGVcblxuICAgICAgICBAYnJvd3Nlci5vbiAnaXRlbUFjdGl2YXRlZCcgQG9uQnJvd3Nlckl0ZW1BY3RpdmF0ZWRcblxuICAgICAgICBAc3ludGF4TmFtZSA9ICdicm93c2VyJ1xuXG4gICAgb25GaWxlOiAoZmlsZSkgPT5cblxuICAgICAgICBpZiBAaXNBY3RpdmUoKSBhbmQgQGdldFRleHQoKSAhPSBzbGFzaC50aWxkZSBmaWxlXG4gICAgICAgICAgICBAc2V0VGV4dCBzbGFzaC50aWxkZSBmaWxlXG5cbiAgICBjbGVhcjogLT5cbiAgICAgICAgcmV0dXJuIGlmIEBicm93c2VyLmNsZWFuVXAoKVxuICAgICAgICBzdXBlcigpXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIHN0YXJ0OiAoYWN0aW9uKSAtPlxuXG4gICAgICAgICMga2xvZyAnYnJvd3NlLnN0YXJ0JyBhY3Rpb25cbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLnN0YXJ0KClcblxuICAgICAgICBpZiBhY3Rpb24gIT0gJ3NoZWxmJ1xuICAgICAgICAgICAgaWYgd2luZG93LmVkaXRvci5jdXJyZW50RmlsZT8gYW5kIHNsYXNoLmlzRmlsZSB3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICAgICAgICAgQGJyb3dzZXIubmF2aWdhdGVUb0ZpbGUgd2luZG93LmVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnZmlsZWJyb3dzZXInICdsb2FkSXRlbScgZmlsZTpwcm9jZXNzLmN3ZCgpLCB0eXBlOidkaXInXG4gICAgICAgICAgICBAYnJvd3Nlci5mb2N1cygpXG5cbiAgICAgICAgbmFtZSA9IGFjdGlvblxuICAgICAgICBuYW1lID0gJ2Jyb3dzZScgaWYgYWN0aW9uID09ICdzaGVsZidcblxuICAgICAgICBzdXBlciBuYW1lXG5cbiAgICAgICAgc2VsZWN0OiB0cnVlXG4gICAgICAgIGRvOiAgICAgQG5hbWUgPT0gJ0Jyb3dzZScgYW5kICdoYWxmIGJyb3dzZXInIG9yICdxdWFydCBicm93c2VyJ1xuICAgICAgICBmb2N1czogIGFjdGlvbiA9PSAnc2hlbGYnIGFuZCAnc2hlbGYnIG9yIG51bGxcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBjb21wbGV0ZUNhbGxiYWNrOiAoZmlsZXMpID0+XG5cbiAgICAgICAgaWYgbm90IGVtcHR5IEBnZXRUZXh0KCkudHJpbSgpXG4gICAgICAgICAgICB0ZXh0ID0gc2xhc2gucmVzb2x2ZSBAZ2V0VGV4dCgpLnRyaW0oKVxuICAgICAgICAgICAgbWF0Y2hlcyA9IGZpbGVzLmZpbHRlciAoZikgLT4gZi5maWxlLnN0YXJ0c1dpdGggdGV4dFxuXG4gICAgICAgICAgICBpZiBub3QgZW1wdHkgbWF0Y2hlc1xuICAgICAgICAgICAgICAgIEBzZXRUZXh0IHNsYXNoLnRpbGRlIG1hdGNoZXNbMF0uZmlsZVxuXG4gICAgICAgICAgICBpZiBtYXRjaGVzLmxlbmd0aCA+IDFcblxuICAgICAgICAgICAgICAgIGl0ZW1zID0gbWF0Y2hlcy5tYXAgKG0pIC0+XG5cbiAgICAgICAgICAgICAgICAgICAgaXRlbSA9IE9iamVjdC5jcmVhdGUgbnVsbFxuXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCBtLnR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gJyAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jbHNzID0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gJ+KWuCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNsc3MgPSAnZGlyZWN0b3J5J1xuXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0udGV4dCA9IHNsYXNoLmZpbGUgbS5maWxlXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZmlsZSA9IG0uZmlsZVxuICAgICAgICAgICAgICAgICAgICBpdGVtXG5cbiAgICAgICAgICAgICAgICBAc2hvd0l0ZW1zIGl0ZW1zXG4gICAgICAgICAgICAgICAgQHNlbGVjdCAwXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIEBoaWRlTGlzdCgpXG5cbiAgICBjb21wbGV0ZTogLT5cblxuICAgICAgICB0ZXh0ID0gQGdldFRleHQoKS50cmltKClcblxuICAgICAgICBpZiBub3QgdGV4dC5lbmRzV2l0aCgnLycpIGFuZCBzbGFzaC5kaXJFeGlzdHMgdGV4dFxuICAgICAgICAgICAgQHNldFRleHQgdGV4dCArICcvJ1xuICAgICAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgICAgIHRydWVcbiAgICAgICAgZWxzZSBpZiB0ZXh0LmVuZHNXaXRoICcvJ1xuICAgICAgICAgICAgaWYgc2xhc2guZGlyRXhpc3RzIHNsYXNoLnJlc29sdmUgdGV4dFxuICAgICAgICAgICAgICAgIHNsYXNoLmxpc3Qgc2xhc2gucmVzb2x2ZSh0ZXh0KSwgQGNvbXBsZXRlQ2FsbGJhY2tcbiAgICAgICAgICAgICAgICB0cnVlXG4gICAgICAgIGVsc2UgaWYgbm90IGVtcHR5IHNsYXNoLmRpciB0ZXh0XG4gICAgICAgICAgICBpZiBzbGFzaC5kaXJFeGlzdHMgc2xhc2gucmVzb2x2ZSBzbGFzaC5kaXIgdGV4dFxuICAgICAgICAgICAgICAgIHNsYXNoLmxpc3Qgc2xhc2gucmVzb2x2ZShzbGFzaC5kaXIodGV4dCkpLCBAY29tcGxldGVDYWxsYmFja1xuICAgICAgICAgICAgICAgIHRydWVcblxuICAgIG9uVGFiQ29tcGxldGlvbjogLT5cblxuICAgICAgICBAY29tcGxldGUoKVxuICAgICAgICB0cnVlXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgY29tbW9uUHJlZml4OiAoc3RyQSxzdHJCKSAtPlxuXG4gICAgICAgIHByZWZpeCA9ICcnXG4gICAgICAgIGZvciBpIGluIFswLi4uTWF0aC5taW4oc3RyQS5sZW5ndGgsIHN0ckIubGVuZ3RoKV1cbiAgICAgICAgICAgIGJyZWFrIGlmIHN0ckFbaV0gIT0gc3RyQltpXVxuICAgICAgICAgICAgcHJlZml4ICs9IHN0ckFbaV1cbiAgICAgICAgcHJlZml4XG5cbiAgICBjbGVhckJyb2tlblBhcnRGb3JGaWxlczogKGZpbGVzKSAtPlxuXG4gICAgICAgIGJyb2tlblBhdGggPSBzbGFzaC5yZXNvbHZlIEBnZXRUZXh0KClcbiAgICAgICAgbG9uZ2VzdE1hdGNoID0gJydcbiAgICAgICAgZm9yIGZpbGUgaW4gZmlsZXNcbiAgICAgICAgICAgIGZpbGUgPSBmaWxlLmZpbGVcbiAgICAgICAgICAgIHByZWZpeCA9IEBjb21tb25QcmVmaXggZmlsZSwgYnJva2VuUGF0aFxuICAgICAgICAgICAgaWYgcHJlZml4Lmxlbmd0aCA+IGxvbmdlc3RNYXRjaC5sZW5ndGhcbiAgICAgICAgICAgICAgICBsb25nZXN0TWF0Y2ggPSBwcmVmaXhcbiAgICAgICAgbCA9IEBnZXRUZXh0KCkubGVuZ3RoXG5cbiAgICAgICAgaWYgbm90IGVtcHR5IGxvbmdlc3RNYXRjaFxuICAgICAgICAgICAgQHNldFRleHQgc2xhc2gudGlsZGUgbG9uZ2VzdE1hdGNoXG4gICAgICAgICAgICBAY29tcGxldGUoKVxuXG4gICAgY2hhbmdlZENhbGxiYWNrOiAoZmlsZXMpID0+XG5cbiAgICAgICAga2xvZyAnY2hhbmdlZENhbGxiYWNrJyBmaWxlc1xuICAgICAgICBcbiAgICAgICAgaWYgZW1wdHkgQGdldFRleHQoKS50cmltKClcbiAgICAgICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBwYXRoID0gc2xhc2gucmVzb2x2ZSBAZ2V0VGV4dCgpLnRyaW0oKVxuICAgICAgICBtYXRjaGVzID0gZmlsZXMuZmlsdGVyIChmKSAtPiBmLmZpbGUuc3RhcnRzV2l0aCBwYXRoXG5cbiAgICAgICAgaWYgZW1wdHkgbWF0Y2hlc1xuICAgICAgICAgICAgQGNsZWFyQnJva2VuUGFydEZvckZpbGVzIGZpbGVzXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBzID0gc2xhc2gudGlsZGUocGF0aCkubGVuZ3RoXG5cbiAgICAgICAgdGV4dCA9IHNsYXNoLnRpbGRlIHNsYXNoLnRpbGRlIG1hdGNoZXNbMF0uZmlsZVxuICAgICAgICBAc2V0VGV4dCB0ZXh0XG5cbiAgICAgICAgbCA9IHRleHQubGVuZ3RoXG5cbiAgICAgICAgQGNvbW1hbmRsaW5lLnNlbGVjdFNpbmdsZVJhbmdlIFswLCBbcyxsXV0sIGJlZm9yZTogdHJ1ZVxuXG4gICAgICAgIGlmIG1hdGNoZXMubGVuZ3RoIDwgMlxuICAgICAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgZWxzZVxuXG4gICAgICAgICAgICBpdGVtcyA9IG1hdGNoZXMubWFwIChtKSAtPlxuXG4gICAgICAgICAgICAgICAgaXRlbSA9IE9iamVjdC5jcmVhdGUgbnVsbFxuXG4gICAgICAgICAgICAgICAgc3dpdGNoIG0udHlwZVxuICAgICAgICAgICAgICAgICAgICB3aGVuICdmaWxlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gJyAnXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNsc3MgPSAnZmlsZSdcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gJ+KWuCdcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY2xzcyA9ICdkaXJlY3RvcnknXG5cbiAgICAgICAgICAgICAgICBpdGVtLnRleHQgPSBzbGFzaC5maWxlIG0uZmlsZVxuICAgICAgICAgICAgICAgIGl0ZW0uZmlsZSA9IG0uZmlsZVxuICAgICAgICAgICAgICAgIGl0ZW1cblxuICAgICAgICAgICAgQHNob3dJdGVtcyBpdGVtc1xuXG4gICAgY2hhbmdlZDogKGNvbW1hbmQpIC0+XG5cbiAgICAgICAga2xvZyAnYnJvd3NlLmNoYW5nZWQnIGNvbW1hbmRcbiAgICAgICAgdGV4dCA9IEBnZXRUZXh0KCkudHJpbSgpXG4gICAgICAgIGlmIG5vdCB0ZXh0LmVuZHNXaXRoICcvJ1xuICAgICAgICAgICAgQHdhbGtlcj8uZW5kKClcbiAgICAgICAgICAgIEB3YWxrZXIgPSBzbGFzaC5saXN0IHNsYXNoLnJlc29sdmUoc2xhc2guZGlyKHRleHQpKSwgQGNoYW5nZWRDYWxsYmFja1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaGlkZUxpc3QoKVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMFxuXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9FdmVudDogKG1vZCwga2V5LCBjb21ibywgZXZlbnQpIC0+XG5cbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdiYWNrc3BhY2UnXG4gICAgICAgICAgICAgICAgaWYgY29tbWFuZGxpbmUubWFpbkN1cnNvcigpWzBdID09IGNvbW1hbmRsaW5lLnNlbGVjdGlvbigwKT9bMV1bMF0gIyBjdXJzb3IgaXMgYXQgc2VsZWN0aW9uIHN0YXJ0XG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRsaW5lLmRvLnN0YXJ0KCkgICAgICAgICAjIGZvcmNlIHNpbXVsdGFuZW91c1xuICAgICAgICAgICAgICAgICAgICBjb21tYW5kbGluZS5kZWxldGVTZWxlY3Rpb24oKSAgIyBkZWxldGlvbiBvZiBzZWxlY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZGxpbmUuZGVsZXRlQmFja3dhcmQoKSAgICMgYW5kIGJhY2tzcGFjZS5cbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZGxpbmUuZG8uZW5kKCkgICAgICAgICAgICMgaXQgc2hvdWxkIGZlZWwgYXMgaWYgc2VsZWN0aW9uIHdhc24ndCB0aGVyZS5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB3aGVuICdlbnRlcidcbiAgICAgICAgICAgICAgICBAZXhlY3V0ZSBAZ2V0VGV4dCgpXG4gICAgICAgICAgICAgICAgZm9jdXNCcm93c2VyID0gPT4gQGJyb3dzZXIuZm9jdXMoKVxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQgZm9jdXNCcm93c2VyLCAxMDBcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgJ3VuaGFuZGxlZCdcblxuICAgICMgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbGlzdENsaWNrOiAoaW5kZXgpID0+XG5cbiAgICAgICAgZmlsZSA9IEBjb21tYW5kTGlzdC5pdGVtc1tpbmRleF0/LmZpbGVcbiAgICAgICAgZmlsZSA9IHNsYXNoLnRpbGRlIGZpbGUgaWYgZmlsZT9cbiAgICAgICAgZmlsZSA/PSBAY29tbWFuZExpc3QubGluZSBpbmRleFxuICAgICAgICBAc2VsZWN0ZWQgPSBpbmRleFxuICAgICAgICBAZXhlY3V0ZSBmaWxlXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDBcblxuICAgIHNlbGVjdDogKGkpIC0+XG5cbiAgICAgICAgQHNlbGVjdGVkID0gY2xhbXAgLTEsIEBjb21tYW5kTGlzdD8ubnVtTGluZXMoKS0xLCBpXG5cbiAgICAgICAgaWYgQHNlbGVjdGVkIDwgMFxuICAgICAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIEBjb21tYW5kTGlzdD8uc2VsZWN0U2luZ2xlUmFuZ2UgQGNvbW1hbmRMaXN0LnJhbmdlRm9yTGluZUF0SW5kZXggQHNlbGVjdGVkXG4gICAgICAgIEBjb21tYW5kTGlzdD8uZG8uY3Vyc29ycyBbWzAsIEBzZWxlY3RlZF1dXG5cbiAgICAgICAgdGV4dCA9IHNsYXNoLnRpbGRlIEBjb21tYW5kTGlzdC5pdGVtc1tAc2VsZWN0ZWRdLmZpbGVcbiAgICAgICAgQHNldFRleHQgdGV4dFxuICAgICAgICBzID0gc2xhc2guZmlsZSh0ZXh0KS5sZW5ndGhcbiAgICAgICAgbCA9IHRleHQubGVuZ3RoXG4gICAgICAgIEBjb21tYW5kbGluZS5zZWxlY3RTaW5nbGVSYW5nZSBbMCwgW2wtcyxsXV1cblxuICAgIHNlbGVjdExpc3RJdGVtOiAoZGlyKSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGNvbW1hbmRMaXN0P1xuXG4gICAgICAgIHN3aXRjaCBkaXJcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgIHRoZW4gQHNlbGVjdCBAc2VsZWN0ZWQtMVxuICAgICAgICAgICAgd2hlbiAnZG93bicgdGhlbiBAc2VsZWN0IEBzZWxlY3RlZCsxXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBjYW5jZWw6IC0+XG5cbiAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgZm9jdXM6IEByZWNlaXZlclxuICAgICAgICBzaG93OiAnZWRpdG9yJ1xuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBleGVjdXRlOiAoY29tbWFuZCkgLT5cblxuICAgICAgICByZXR1cm4ga2Vycm9yIFwibm8gY29tbWFuZD9cIiBpZiBub3QgY29tbWFuZD9cblxuICAgICAgICBAaGlkZUxpc3QoKVxuXG4gICAgICAgIEBjbWRJRCArPSAxXG4gICAgICAgIGNtZCA9IGNvbW1hbmQudHJpbSgpXG4gICAgICAgIGlmIGNtZC5sZW5ndGhcbiAgICAgICAgICAgIGlmIHNsYXNoLmRpckV4aXN0cyBzbGFzaC5yZW1vdmVMaW5lUG9zIGNtZFxuICAgICAgICAgICAgICAgIEBicm93c2VyLmxvYWRJdGVtIGZpbGU6Y21kLCB0eXBlOidkaXInXG4gICAgICAgICAgICAgICAgQGNvbW1hbmRsaW5lLnNldFRleHQgY21kXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBlbHNlIGlmIHNsYXNoLmZpbGVFeGlzdHMgc2xhc2gucmVtb3ZlTGluZVBvcyBjbWRcbiAgICAgICAgICAgICAgICBAY29tbWFuZGxpbmUuc2V0VGV4dCBjbWRcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUb0ZpbGUnIGZpbGU6Y21kXG4gICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAga2Vycm9yICdicm93c2UuZXhlY3V0ZSAtLSB1bmhhbmRsZWQnLCBjbWRcblxuICAgIG9uQnJvd3Nlckl0ZW1BY3RpdmF0ZWQ6IChpdGVtKSA9PlxuXG4gICAgICAgIGlmIG5vdCBAaXNBY3RpdmUoKVxuICAgICAgICAgICAgQGNvbW1hbmRsaW5lLmNvbW1hbmQ/Lm9uQnJvd3Nlckl0ZW1BY3RpdmF0ZWQ/IGl0ZW1cbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIGl0ZW0uZmlsZVxuICAgICAgICAgICAgcHRoID0gc2xhc2gudGlsZGUgaXRlbS5maWxlXG4gICAgICAgICAgICBpZiBpdGVtLnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICBwdGggKz0gJy8nXG4gICAgICAgICAgICAgICAgaWYgaXRlbS5uYW1lID09ICcuLicgYW5kIEBicm93c2VyLmFjdGl2ZUNvbHVtbigpPy5wYXJlbnQ/LmZpbGVcbiAgICAgICAgICAgICAgICAgICAgIyBzaG93IGN1cnJlbnQgcGF0aCBpbnN0ZWFkIG9mIHVwZGlyIHdoZW4gLi4gaXRlbSB3YXMgYWN0aXZhdGVkXG4gICAgICAgICAgICAgICAgICAgIHB0aCA9IHNsYXNoLnRpbGRlIEBicm93c2VyLmFjdGl2ZUNvbHVtbigpPy5wYXJlbnQ/LmZpbGVcblxuICAgICAgICAgICAgQGNvbW1hbmRsaW5lLnNldFRleHQgcHRoXG5cbm1vZHVsZS5leHBvcnRzID0gQnJvd3NlXG4iXX0=
//# sourceURL=../../coffee/commands/browse.coffee