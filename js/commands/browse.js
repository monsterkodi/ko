// koffee 1.4.0

/*
0000000    00000000    0000000   000   000   0000000  00000000
000   000  000   000  000   000  000 0 000  000       000
0000000    0000000    000   000  000000000  0000000   0000000
000   000  000   000  000   000  000   000       000  000
0000000    000   000   0000000   00     00  0000000   00000000
 */
var $, Browse, Command, FileBrowser, clamp, empty, kerror, klog, os, post, ref, slash, stopEvent, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), post = ref.post, slash = ref.slash, os = ref.os, valid = ref.valid, empty = ref.empty, clamp = ref.clamp, stopEvent = ref.stopEvent, klog = ref.klog, kerror = ref.kerror, $ = ref.$;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3NlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxtR0FBQTtJQUFBOzs7O0FBUUEsTUFBdUUsT0FBQSxDQUFRLEtBQVIsQ0FBdkUsRUFBRSxlQUFGLEVBQVEsaUJBQVIsRUFBZSxXQUFmLEVBQW1CLGlCQUFuQixFQUEwQixpQkFBMUIsRUFBaUMsaUJBQWpDLEVBQXdDLHlCQUF4QyxFQUFtRCxlQUFuRCxFQUF5RCxtQkFBekQsRUFBaUU7O0FBRWpFLE9BQUEsR0FBYyxPQUFBLENBQVEsd0JBQVI7O0FBQ2QsV0FBQSxHQUFjLE9BQUEsQ0FBUSx3QkFBUjs7QUFFUjs7O0lBRUMsZ0JBQUMsV0FBRDs7Ozs7O1FBRUMsd0NBQU0sV0FBTjtRQUVBLElBQUMsQ0FBQSxLQUFELEdBQVk7UUFDWixJQUFDLENBQUEsT0FBRCxHQUFZLElBQUksV0FBSixDQUFnQixDQUFBLENBQUUsU0FBRixDQUFoQjtRQUNaLElBQUMsQ0FBQSxRQUFELEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYyxJQUFkO1FBQ1osSUFBQyxDQUFBLEtBQUQsR0FBWSxDQUFDLFFBQUQsRUFBVSxRQUFWLEVBQW1CLE9BQW5CO1FBRVosSUFBSSxDQUFDLEVBQUwsQ0FBUSxNQUFSLEVBQWUsSUFBQyxDQUFBLE1BQWhCO1FBRUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksZUFBWixFQUE0QixJQUFDLENBQUEsc0JBQTdCO1FBRUEsSUFBQyxDQUFBLFVBQUQsR0FBYztJQWJmOztxQkFlSCxNQUFBLEdBQVEsU0FBQyxJQUFEO1FBRUosSUFBRyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQUEsSUFBZ0IsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFBLEtBQWMsS0FBSyxDQUFDLEtBQU4sQ0FBWSxJQUFaLENBQWpDO21CQUNJLElBQUMsQ0FBQSxPQUFELENBQVMsS0FBSyxDQUFDLEtBQU4sQ0FBWSxJQUFaLENB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QSx1QkFIQzthQUxUOztlQVVBLE1BQUEsQ0FBTyw2QkFBUCxFQUFzQyxHQUF0QztJQWxCSzs7cUJBb0JULHNCQUFBLEdBQXdCLFNBQUMsSUFBRDtBQUVwQixZQUFBO1FBQUEsSUFBRyxDQUFJLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBUDs7O3dCQUN3QixDQUFFLHVCQUF3Qjs7O0FBQzlDLG1CQUZKOztRQUlBLElBQUcsSUFBSSxDQUFDLElBQVI7WUFDSSxHQUFBLEdBQU0sS0FBSyxDQUFDLEtBQU4sQ0FBWSxJQUFJLENBQUMsSUFBakI7WUFDTixJQUFHLElBQUksQ0FBQyxJQUFMLEtBQWEsS0FBaEI7Z0JBQ0ksR0FBQSxJQUFPO2dCQUNQLElBQUcsSUFBSSxDQUFDLElBQUwsS0FBYSxJQUFiLHVGQUFxRCxDQUFFLHVCQUExRDtvQkFFSSxHQUFBLEdBQU0sS0FBSyxDQUFDLEtBQU4sbUZBQTJDLENBQUUsc0JBQTdDLEVBRlY7aUJBRko7O21CQU1BLElBQUMsQ0FBQSxXQUFXLENBQUMsT0FBYixDQUFxQixHQUFyQixFQVJKOztJQU5vQjs7OztHQWpUUDs7QUFpVXJCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwXG4wMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbjAwMDAwMDAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwXG4jIyNcblxueyBwb3N0LCBzbGFzaCwgb3MsIHZhbGlkLCBlbXB0eSwgY2xhbXAsIHN0b3BFdmVudCwga2xvZywga2Vycm9yLCAkIH0gPSByZXF1aXJlICdreGsnXG5cbkNvbW1hbmQgICAgID0gcmVxdWlyZSAnLi4vY29tbWFuZGxpbmUvY29tbWFuZCdcbkZpbGVCcm93c2VyID0gcmVxdWlyZSAnLi4vYnJvd3Nlci9maWxlYnJvd3NlcidcblxuY2xhc3MgQnJvd3NlIGV4dGVuZHMgQ29tbWFuZFxuXG4gICAgQDogKGNvbW1hbmRsaW5lKSAtPlxuXG4gICAgICAgIHN1cGVyIGNvbW1hbmRsaW5lXG5cbiAgICAgICAgQGNtZElEICAgID0gMFxuICAgICAgICBAYnJvd3NlciAgPSBuZXcgRmlsZUJyb3dzZXIgJCAnYnJvd3NlcidcbiAgICAgICAgQGNvbW1hbmRzID0gT2JqZWN0LmNyZWF0ZSBudWxsXG4gICAgICAgIEBuYW1lcyAgICA9IFsnYnJvd3NlJyAnQnJvd3NlJyAnc2hlbGYnXVxuXG4gICAgICAgIHBvc3Qub24gJ2ZpbGUnIEBvbkZpbGVcblxuICAgICAgICBAYnJvd3Nlci5vbiAnaXRlbUFjdGl2YXRlZCcgQG9uQnJvd3Nlckl0ZW1BY3RpdmF0ZWRcblxuICAgICAgICBAc3ludGF4TmFtZSA9ICdicm93c2VyJ1xuXG4gICAgb25GaWxlOiAoZmlsZSkgPT5cblxuICAgICAgICBpZiBAaXNBY3RpdmUoKSBhbmQgQGdldFRleHQoKSAhPSBzbGFzaC50aWxkZSBmaWxlXG4gICAgICAgICAgICBAc2V0VGV4dCBzbGFzaC50aWxkZSBmaWxlXG5cbiAgICBjbGVhcjogLT5cbiAgICAgICAgcmV0dXJuIGlmIEBicm93c2VyLmNsZWFuVXAoKVxuICAgICAgICBzdXBlcigpXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIHN0YXJ0OiAoYWN0aW9uKSAtPlxuXG4gICAgICAgICMga2xvZyAnYnJvd3NlLnN0YXJ0JyBhY3Rpb25cbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLnN0YXJ0KClcblxuICAgICAgICBpZiBhY3Rpb24gIT0gJ3NoZWxmJ1xuICAgICAgICAgICAgaWYgd2luZG93LmVkaXRvci5jdXJyZW50RmlsZT8gYW5kIHNsYXNoLmlzRmlsZSB3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICAgICAgICAgQGJyb3dzZXIubmF2aWdhdGVUb0ZpbGUgd2luZG93LmVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnZmlsZWJyb3dzZXInICdsb2FkSXRlbScgZmlsZTpwcm9jZXNzLmN3ZCgpLCB0eXBlOidkaXInXG4gICAgICAgICAgICBAYnJvd3Nlci5mb2N1cygpXG5cbiAgICAgICAgbmFtZSA9IGFjdGlvblxuICAgICAgICBuYW1lID0gJ2Jyb3dzZScgaWYgYWN0aW9uID09ICdzaGVsZidcblxuICAgICAgICBzdXBlciBuYW1lXG5cbiAgICAgICAgc2VsZWN0OiB0cnVlXG4gICAgICAgIGRvOiAgICAgQG5hbWUgPT0gJ0Jyb3dzZScgYW5kICdoYWxmIGJyb3dzZXInIG9yICdxdWFydCBicm93c2VyJ1xuICAgICAgICBmb2N1czogIGFjdGlvbiA9PSAnc2hlbGYnIGFuZCAnc2hlbGYnIG9yIG51bGxcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBjb21wbGV0ZUNhbGxiYWNrOiAoZmlsZXMpID0+XG5cbiAgICAgICAgaWYgbm90IGVtcHR5IEBnZXRUZXh0KCkudHJpbSgpXG4gICAgICAgICAgICB0ZXh0ID0gc2xhc2gucmVzb2x2ZSBAZ2V0VGV4dCgpLnRyaW0oKVxuICAgICAgICAgICAgbWF0Y2hlcyA9IGZpbGVzLmZpbHRlciAoZikgLT4gZi5maWxlLnN0YXJ0c1dpdGggdGV4dFxuXG4gICAgICAgICAgICBpZiBub3QgZW1wdHkgbWF0Y2hlc1xuICAgICAgICAgICAgICAgIEBzZXRUZXh0IHNsYXNoLnRpbGRlIG1hdGNoZXNbMF0uZmlsZVxuXG4gICAgICAgICAgICBpZiBtYXRjaGVzLmxlbmd0aCA+IDFcblxuICAgICAgICAgICAgICAgIGl0ZW1zID0gbWF0Y2hlcy5tYXAgKG0pIC0+XG5cbiAgICAgICAgICAgICAgICAgICAgaXRlbSA9IE9iamVjdC5jcmVhdGUgbnVsbFxuXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCBtLnR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gJyAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jbHNzID0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gJ+KWuCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNsc3MgPSAnZGlyZWN0b3J5J1xuXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0udGV4dCA9IHNsYXNoLmZpbGUgbS5maWxlXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZmlsZSA9IG0uZmlsZVxuICAgICAgICAgICAgICAgICAgICBpdGVtXG5cbiAgICAgICAgICAgICAgICBAc2hvd0l0ZW1zIGl0ZW1zXG4gICAgICAgICAgICAgICAgQHNlbGVjdCAwXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIEBoaWRlTGlzdCgpXG5cbiAgICBjb21wbGV0ZTogLT5cblxuICAgICAgICB0ZXh0ID0gQGdldFRleHQoKS50cmltKClcblxuICAgICAgICBpZiBub3QgdGV4dC5lbmRzV2l0aCgnLycpIGFuZCBzbGFzaC5kaXJFeGlzdHMgdGV4dFxuICAgICAgICAgICAgQHNldFRleHQgdGV4dCArICcvJ1xuICAgICAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgICAgIHRydWVcbiAgICAgICAgZWxzZSBpZiB0ZXh0LmVuZHNXaXRoICcvJ1xuICAgICAgICAgICAgaWYgc2xhc2guZGlyRXhpc3RzIHNsYXNoLnJlc29sdmUgdGV4dFxuICAgICAgICAgICAgICAgIHNsYXNoLmxpc3Qgc2xhc2gucmVzb2x2ZSh0ZXh0KSwgQGNvbXBsZXRlQ2FsbGJhY2tcbiAgICAgICAgICAgICAgICB0cnVlXG4gICAgICAgIGVsc2UgaWYgbm90IGVtcHR5IHNsYXNoLmRpciB0ZXh0XG4gICAgICAgICAgICBpZiBzbGFzaC5kaXJFeGlzdHMgc2xhc2gucmVzb2x2ZSBzbGFzaC5kaXIgdGV4dFxuICAgICAgICAgICAgICAgIHNsYXNoLmxpc3Qgc2xhc2gucmVzb2x2ZShzbGFzaC5kaXIodGV4dCkpLCBAY29tcGxldGVDYWxsYmFja1xuICAgICAgICAgICAgICAgIHRydWVcblxuICAgIG9uVGFiQ29tcGxldGlvbjogLT5cblxuICAgICAgICBAY29tcGxldGUoKVxuICAgICAgICB0cnVlXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgY29tbW9uUHJlZml4OiAoc3RyQSxzdHJCKSAtPlxuXG4gICAgICAgIHByZWZpeCA9ICcnXG4gICAgICAgIGZvciBpIGluIFswLi4uTWF0aC5taW4oc3RyQS5sZW5ndGgsIHN0ckIubGVuZ3RoKV1cbiAgICAgICAgICAgIGJyZWFrIGlmIHN0ckFbaV0gIT0gc3RyQltpXVxuICAgICAgICAgICAgcHJlZml4ICs9IHN0ckFbaV1cbiAgICAgICAgcHJlZml4XG5cbiAgICBjbGVhckJyb2tlblBhcnRGb3JGaWxlczogKGZpbGVzKSAtPlxuXG4gICAgICAgIGJyb2tlblBhdGggPSBzbGFzaC5yZXNvbHZlIEBnZXRUZXh0KClcbiAgICAgICAgbG9uZ2VzdE1hdGNoID0gJydcbiAgICAgICAgZm9yIGZpbGUgaW4gZmlsZXNcbiAgICAgICAgICAgIGZpbGUgPSBmaWxlLmZpbGVcbiAgICAgICAgICAgIHByZWZpeCA9IEBjb21tb25QcmVmaXggZmlsZSwgYnJva2VuUGF0aFxuICAgICAgICAgICAgaWYgcHJlZml4Lmxlbmd0aCA+IGxvbmdlc3RNYXRjaC5sZW5ndGhcbiAgICAgICAgICAgICAgICBsb25nZXN0TWF0Y2ggPSBwcmVmaXhcbiAgICAgICAgbCA9IEBnZXRUZXh0KCkubGVuZ3RoXG5cbiAgICAgICAgaWYgbm90IGVtcHR5IGxvbmdlc3RNYXRjaFxuICAgICAgICAgICAgQHNldFRleHQgc2xhc2gudGlsZGUgbG9uZ2VzdE1hdGNoXG4gICAgICAgICAgICBAY29tcGxldGUoKVxuXG4gICAgY2hhbmdlZENhbGxiYWNrOiAoZmlsZXMpID0+XG5cbiAgICAgICAga2xvZyAnY2hhbmdlZENhbGxiYWNrJyBmaWxlc1xuICAgICAgICBcbiAgICAgICAgaWYgZW1wdHkgQGdldFRleHQoKS50cmltKClcbiAgICAgICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBwYXRoID0gc2xhc2gucmVzb2x2ZSBAZ2V0VGV4dCgpLnRyaW0oKVxuICAgICAgICBtYXRjaGVzID0gZmlsZXMuZmlsdGVyIChmKSAtPiBmLmZpbGUuc3RhcnRzV2l0aCBwYXRoXG5cbiAgICAgICAgaWYgZW1wdHkgbWF0Y2hlc1xuICAgICAgICAgICAgQGNsZWFyQnJva2VuUGFydEZvckZpbGVzIGZpbGVzXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBzID0gc2xhc2gudGlsZGUocGF0aCkubGVuZ3RoXG5cbiAgICAgICAgdGV4dCA9IHNsYXNoLnRpbGRlIHNsYXNoLnRpbGRlIG1hdGNoZXNbMF0uZmlsZVxuICAgICAgICBAc2V0VGV4dCB0ZXh0XG5cbiAgICAgICAgbCA9IHRleHQubGVuZ3RoXG5cbiAgICAgICAgQGNvbW1hbmRsaW5lLnNlbGVjdFNpbmdsZVJhbmdlIFswLCBbcyxsXV0sIGJlZm9yZTogdHJ1ZVxuXG4gICAgICAgIGlmIG1hdGNoZXMubGVuZ3RoIDwgMlxuICAgICAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgZWxzZVxuXG4gICAgICAgICAgICBpdGVtcyA9IG1hdGNoZXMubWFwIChtKSAtPlxuXG4gICAgICAgICAgICAgICAgaXRlbSA9IE9iamVjdC5jcmVhdGUgbnVsbFxuXG4gICAgICAgICAgICAgICAgc3dpdGNoIG0udHlwZVxuICAgICAgICAgICAgICAgICAgICB3aGVuICdmaWxlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gJyAnXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNsc3MgPSAnZmlsZSdcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gJ+KWuCdcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY2xzcyA9ICdkaXJlY3RvcnknXG5cbiAgICAgICAgICAgICAgICBpdGVtLnRleHQgPSBzbGFzaC5maWxlIG0uZmlsZVxuICAgICAgICAgICAgICAgIGl0ZW0uZmlsZSA9IG0uZmlsZVxuICAgICAgICAgICAgICAgIGl0ZW1cblxuICAgICAgICAgICAgQHNob3dJdGVtcyBpdGVtc1xuXG4gICAgY2hhbmdlZDogKGNvbW1hbmQpIC0+XG5cbiAgICAgICAga2xvZyAnYnJvd3NlLmNoYW5nZWQnIGNvbW1hbmRcbiAgICAgICAgdGV4dCA9IEBnZXRUZXh0KCkudHJpbSgpXG4gICAgICAgIGlmIG5vdCB0ZXh0LmVuZHNXaXRoICcvJ1xuICAgICAgICAgICAgQHdhbGtlcj8uZW5kKClcbiAgICAgICAgICAgIEB3YWxrZXIgPSBzbGFzaC5saXN0IHNsYXNoLnJlc29sdmUoc2xhc2guZGlyKHRleHQpKSwgQGNoYW5nZWRDYWxsYmFja1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaGlkZUxpc3QoKVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMFxuXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9FdmVudDogKG1vZCwga2V5LCBjb21ibywgZXZlbnQpIC0+XG5cbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdiYWNrc3BhY2UnXG4gICAgICAgICAgICAgICAgaWYgY29tbWFuZGxpbmUubWFpbkN1cnNvcigpWzBdID09IGNvbW1hbmRsaW5lLnNlbGVjdGlvbigwKT9bMV1bMF0gIyBjdXJzb3IgaXMgYXQgc2VsZWN0aW9uIHN0YXJ0XG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRsaW5lLmRvLnN0YXJ0KCkgICAgICAgICAjIGZvcmNlIHNpbXVsdGFuZW91c1xuICAgICAgICAgICAgICAgICAgICBjb21tYW5kbGluZS5kZWxldGVTZWxlY3Rpb24oKSAgIyBkZWxldGlvbiBvZiBzZWxlY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZGxpbmUuZGVsZXRlQmFja3dhcmQoKSAgICMgYW5kIGJhY2tzcGFjZS5cbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZGxpbmUuZG8uZW5kKCkgICAgICAgICAgICMgaXQgc2hvdWxkIGZlZWwgYXMgaWYgc2VsZWN0aW9uIHdhc24ndCB0aGVyZS5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB3aGVuICdlbnRlcidcbiAgICAgICAgICAgICAgICBAZXhlY3V0ZSBAZ2V0VGV4dCgpXG4gICAgICAgICAgICAgICAgZm9jdXNCcm93c2VyID0gPT4gQGJyb3dzZXIuZm9jdXMoKVxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQgZm9jdXNCcm93c2VyLCAxMDBcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgJ3VuaGFuZGxlZCdcblxuICAgICMgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbGlzdENsaWNrOiAoaW5kZXgpID0+XG5cbiAgICAgICAgZmlsZSA9IEBjb21tYW5kTGlzdC5pdGVtc1tpbmRleF0/LmZpbGVcbiAgICAgICAgZmlsZSA9IHNsYXNoLnRpbGRlIGZpbGUgaWYgZmlsZT9cbiAgICAgICAgZmlsZSA/PSBAY29tbWFuZExpc3QubGluZSBpbmRleFxuICAgICAgICBAc2VsZWN0ZWQgPSBpbmRleFxuICAgICAgICBAZXhlY3V0ZSBmaWxlXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDBcblxuICAgIHNlbGVjdDogKGkpIC0+XG5cbiAgICAgICAgQHNlbGVjdGVkID0gY2xhbXAgLTEsIEBjb21tYW5kTGlzdD8ubnVtTGluZXMoKS0xLCBpXG5cbiAgICAgICAgaWYgQHNlbGVjdGVkIDwgMFxuICAgICAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIEBjb21tYW5kTGlzdD8uc2VsZWN0U2luZ2xlUmFuZ2UgQGNvbW1hbmRMaXN0LnJhbmdlRm9yTGluZUF0SW5kZXggQHNlbGVjdGVkXG4gICAgICAgIEBjb21tYW5kTGlzdD8uZG8uY3Vyc29ycyBbWzAsIEBzZWxlY3RlZF1dXG5cbiAgICAgICAgdGV4dCA9IHNsYXNoLnRpbGRlIEBjb21tYW5kTGlzdC5pdGVtc1tAc2VsZWN0ZWRdLmZpbGVcbiAgICAgICAgQHNldFRleHQgdGV4dFxuICAgICAgICBzID0gc2xhc2guZmlsZSh0ZXh0KS5sZW5ndGhcbiAgICAgICAgbCA9IHRleHQubGVuZ3RoXG4gICAgICAgIEBjb21tYW5kbGluZS5zZWxlY3RTaW5nbGVSYW5nZSBbMCwgW2wtcyxsXV1cblxuICAgIHNlbGVjdExpc3RJdGVtOiAoZGlyKSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGNvbW1hbmRMaXN0P1xuXG4gICAgICAgIHN3aXRjaCBkaXJcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgIHRoZW4gQHNlbGVjdCBAc2VsZWN0ZWQtMVxuICAgICAgICAgICAgd2hlbiAnZG93bicgdGhlbiBAc2VsZWN0IEBzZWxlY3RlZCsxXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBjYW5jZWw6IC0+XG5cbiAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgZm9jdXM6IEByZWNlaXZlclxuICAgICAgICBzaG93OiAnZWRpdG9yJ1xuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBleGVjdXRlOiAoY29tbWFuZCkgLT5cblxuICAgICAgICByZXR1cm4ga2Vycm9yIFwibm8gY29tbWFuZD9cIiBpZiBub3QgY29tbWFuZD9cblxuICAgICAgICBAaGlkZUxpc3QoKVxuXG4gICAgICAgIEBjbWRJRCArPSAxXG4gICAgICAgIGNtZCA9IGNvbW1hbmQudHJpbSgpXG4gICAgICAgIGlmIGNtZC5sZW5ndGhcbiAgICAgICAgICAgIGlmIHNsYXNoLmRpckV4aXN0cyBzbGFzaC5yZW1vdmVMaW5lUG9zIGNtZFxuICAgICAgICAgICAgICAgIEBicm93c2VyLmxvYWRJdGVtIGZpbGU6Y21kLCB0eXBlOidkaXInXG4gICAgICAgICAgICAgICAgQGNvbW1hbmRsaW5lLnNldFRleHQgY21kXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBlbHNlIGlmIHNsYXNoLmZpbGVFeGlzdHMgc2xhc2gucmVtb3ZlTGluZVBvcyBjbWRcbiAgICAgICAgICAgICAgICBAY29tbWFuZGxpbmUuc2V0VGV4dCBjbWRcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUb0ZpbGUnIGZpbGU6Y21kXG4gICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAga2Vycm9yICdicm93c2UuZXhlY3V0ZSAtLSB1bmhhbmRsZWQnLCBjbWRcblxuICAgIG9uQnJvd3Nlckl0ZW1BY3RpdmF0ZWQ6IChpdGVtKSA9PlxuXG4gICAgICAgIGlmIG5vdCBAaXNBY3RpdmUoKVxuICAgICAgICAgICAgQGNvbW1hbmRsaW5lLmNvbW1hbmQ/Lm9uQnJvd3Nlckl0ZW1BY3RpdmF0ZWQ/IGl0ZW1cbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIGl0ZW0uZmlsZVxuICAgICAgICAgICAgcHRoID0gc2xhc2gudGlsZGUgaXRlbS5maWxlXG4gICAgICAgICAgICBpZiBpdGVtLnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICBwdGggKz0gJy8nXG4gICAgICAgICAgICAgICAgaWYgaXRlbS5uYW1lID09ICcuLicgYW5kIEBicm93c2VyLmFjdGl2ZUNvbHVtbigpPy5wYXJlbnQ/LmZpbGVcbiAgICAgICAgICAgICAgICAgICAgIyBzaG93IGN1cnJlbnQgcGF0aCBpbnN0ZWFkIG9mIHVwZGlyIHdoZW4gLi4gaXRlbSB3YXMgYWN0aXZhdGVkXG4gICAgICAgICAgICAgICAgICAgIHB0aCA9IHNsYXNoLnRpbGRlIEBicm93c2VyLmFjdGl2ZUNvbHVtbigpPy5wYXJlbnQ/LmZpbGVcblxuICAgICAgICAgICAgQGNvbW1hbmRsaW5lLnNldFRleHQgcHRoXG5cbm1vZHVsZS5leHBvcnRzID0gQnJvd3NlXG4iXX0=
//# sourceURL=../../coffee/commands/browse.coffee