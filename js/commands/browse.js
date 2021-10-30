// koffee 1.14.0

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
        klog('browse.onFile', file);
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
        klog('browse.start', action);
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
        klog('onBrowserItemActivated', item.type, item.file);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3NlLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9jb21tYW5kcyIsInNvdXJjZXMiOlsiYnJvd3NlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSw2RUFBQTtJQUFBOzs7O0FBUUEsTUFBaUQsT0FBQSxDQUFRLEtBQVIsQ0FBakQsRUFBRSxTQUFGLEVBQUssaUJBQUwsRUFBWSxpQkFBWixFQUFtQixtQkFBbkIsRUFBMkIsZUFBM0IsRUFBaUMsZUFBakMsRUFBdUM7O0FBRXZDLE9BQUEsR0FBYyxPQUFBLENBQVEsd0JBQVI7O0FBQ2QsV0FBQSxHQUFjLE9BQUEsQ0FBUSx3QkFBUjs7QUFFUjs7O0lBRUMsZ0JBQUMsV0FBRDs7Ozs7O1FBRUMsd0NBQU0sV0FBTjtRQUVBLElBQUMsQ0FBQSxLQUFELEdBQVk7UUFDWixJQUFDLENBQUEsT0FBRCxHQUFZLElBQUksV0FBSixDQUFnQixDQUFBLENBQUUsU0FBRixDQUFoQjtRQUNaLElBQUMsQ0FBQSxRQUFELEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYyxJQUFkO1FBQ1osSUFBQyxDQUFBLEtBQUQsR0FBWSxDQUFDLFFBQUQsRUFBVSxRQUFWLEVBQW1CLE9BQW5CO1FBRVosSUFBSSxDQUFDLEVBQUwsQ0FBUSxNQUFSLEVBQWUsSUFBQyxDQUFBLE1BQWhCO1FBRUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksZUFBWixFQUE0QixJQUFDLENBQUEsc0JBQTdCO1FBRUEsSUFBQyxDQUFBLFVBQUQsR0FBYztJQWJmOztxQkFlSCxNQUFBLEdBQVEsU0FBQyxJQUFEO1FBRUosSUFBQSxDQUFLLGVBQUwsRUFBcUIsSUFBckI7UUFDQSxJQUFHLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBQSxJQUFnQixJQUFDLENBQUEsT0FBRCxDQUFBLENBQUEsS0FBYyxLQUFLLENBQUMsS0FBTixDQUFZLElBQVosQ0FBakM7bUJBQ0ksSUFBQyxDQUFBLE9BQUQsQ0FBUyxL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Q0FBakIsQ0FBSDtnQkFDRCxJQUFDLENBQUEsV0FBVyxDQUFDLE9BQWIsQ0FBcUIsR0FBckI7Z0JBQ0EsSUFBSSxDQUFDLElBQUwsQ0FBVSxZQUFWLEVBQXVCO29CQUFBLElBQUEsRUFBSyxHQUFMO2lCQUF2QjtBQUNBLHVCQUhDO2FBTFQ7O2VBVUEsTUFBQSxDQUFPLDZCQUFQLEVBQXFDLEdBQXJDO0lBbEJLOztxQkFvQlQsc0JBQUEsR0FBd0IsU0FBQyxJQUFEO0FBRXBCLFlBQUE7UUFBQSxJQUFBLENBQUssd0JBQUwsRUFBOEIsSUFBSSxDQUFDLElBQW5DLEVBQXlDLElBQUksQ0FBQyxJQUE5QztRQUVBLElBQUcsQ0FBSSxJQUFDLENBQUEsUUFBRCxDQUFBLENBQVA7Ozt3QkFDd0IsQ0FBRSx1QkFBd0I7OztBQUM5QyxtQkFGSjs7UUFJQSxJQUFHLElBQUksQ0FBQyxJQUFSO1lBQ0ksR0FBQSxHQUFNLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBSSxDQUFDLElBQWpCO1lBQ04sSUFBRyxJQUFJLENBQUMsSUFBTCxLQUFhLEtBQWhCO2dCQUNJLEdBQUEsSUFBTztnQkFDUCxJQUFHLElBQUksQ0FBQyxJQUFMLEtBQWEsSUFBYix1RkFBcUQsQ0FBRSx1QkFBMUQ7b0JBRUksR0FBQSxHQUFNLEtBQUssQ0FBQyxLQUFOLG1GQUEyQyxDQUFFLHNCQUE3QyxFQUZWO2lCQUZKOzttQkFNQSxJQUFDLENBQUEsV0FBVyxDQUFDLE9BQWIsQ0FBcUIsR0FBckIsRUFSSjs7SUFSb0I7Ozs7R0FqVFA7O0FBbVVyQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMFxuMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAgICAwMDAwMDAwMFxuIyMjXG5cbnsgJCwgY2xhbXAsIGVtcHR5LCBrZXJyb3IsIGtsb2csIHBvc3QsIHNsYXNoIH0gPSByZXF1aXJlICdreGsnXG5cbkNvbW1hbmQgICAgID0gcmVxdWlyZSAnLi4vY29tbWFuZGxpbmUvY29tbWFuZCdcbkZpbGVCcm93c2VyID0gcmVxdWlyZSAnLi4vYnJvd3Nlci9maWxlYnJvd3NlcidcblxuY2xhc3MgQnJvd3NlIGV4dGVuZHMgQ29tbWFuZFxuXG4gICAgQDogKGNvbW1hbmRsaW5lKSAtPlxuXG4gICAgICAgIHN1cGVyIGNvbW1hbmRsaW5lXG5cbiAgICAgICAgQGNtZElEICAgID0gMFxuICAgICAgICBAYnJvd3NlciAgPSBuZXcgRmlsZUJyb3dzZXIgJCAnYnJvd3NlcidcbiAgICAgICAgQGNvbW1hbmRzID0gT2JqZWN0LmNyZWF0ZSBudWxsXG4gICAgICAgIEBuYW1lcyAgICA9IFsnYnJvd3NlJyAnQnJvd3NlJyAnc2hlbGYnXSAjIEJyb3dzZSBhbmQgc2hlbGYgYXJlIGhpZGRlbiBpbiBjb21tYW5kbGluZSBtZW51XG5cbiAgICAgICAgcG9zdC5vbiAnZmlsZScgQG9uRmlsZVxuXG4gICAgICAgIEBicm93c2VyLm9uICdpdGVtQWN0aXZhdGVkJyBAb25Ccm93c2VySXRlbUFjdGl2YXRlZFxuXG4gICAgICAgIEBzeW50YXhOYW1lID0gJ2Jyb3dzZXInXG5cbiAgICBvbkZpbGU6IChmaWxlKSA9PlxuXG4gICAgICAgIGtsb2cgJ2Jyb3dzZS5vbkZpbGUnIGZpbGVcbiAgICAgICAgaWYgQGlzQWN0aXZlKCkgYW5kIEBnZXRUZXh0KCkgIT0gc2xhc2gudGlsZGUgZmlsZVxuICAgICAgICAgICAgQHNldFRleHQgc2xhc2gudGlsZGUgZmlsZVxuXG4gICAgY2xlYXI6IC0+XG4gICAgICAgIHJldHVybiBpZiBAYnJvd3Nlci5jbGVhblVwKClcbiAgICAgICAgc3VwZXIoKVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbiAgICBzdGFydDogKGFjdGlvbikgLT5cblxuICAgICAgICBrbG9nICdicm93c2Uuc3RhcnQnIGFjdGlvblxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuc3RhcnQoKVxuXG4gICAgICAgIGlmIGFjdGlvbiAhPSAnc2hlbGYnXG4gICAgICAgICAgICBpZiB3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlPyBhbmQgc2xhc2guaXNGaWxlIHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgICAgICAgICBAc2V0VGV4dCBzbGFzaC50aWxkZSB3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICAgICAgICAgQGJyb3dzZXIubmF2aWdhdGVUb0ZpbGUgd2luZG93LmVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnZmlsZWJyb3dzZXInICdsb2FkSXRlbScgZmlsZTpwcm9jZXNzLmN3ZCgpLCB0eXBlOidkaXInXG4gICAgICAgICAgICBAYnJvd3Nlci5mb2N1cyBmb3JjZTp0cnVlXG5cbiAgICAgICAgbmFtZSA9IGFjdGlvblxuICAgICAgICBuYW1lID0gJ2Jyb3dzZScgaWYgYWN0aW9uID09ICdzaGVsZidcblxuICAgICAgICBzdXBlciBuYW1lXG5cbiAgICAgICAgc2VsZWN0OiB0cnVlXG4gICAgICAgIGRvOiAgICAgQG5hbWUgPT0gJ0Jyb3dzZScgYW5kICdoYWxmIGJyb3dzZXInIG9yICdxdWFydCBicm93c2VyJ1xuICAgICAgICBmb2N1czogIGFjdGlvbiA9PSAnc2hlbGYnIGFuZCAnc2hlbGYnIG9yIG51bGxcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBjb21wbGV0ZUNhbGxiYWNrOiAoZmlsZXMpID0+XG5cbiAgICAgICAgaWYgbm90IGVtcHR5IEBnZXRUZXh0KCkudHJpbSgpXG4gICAgICAgICAgICB0ZXh0ID0gc2xhc2gucmVzb2x2ZSBAZ2V0VGV4dCgpLnRyaW0oKVxuICAgICAgICAgICAgbWF0Y2hlcyA9IGZpbGVzLmZpbHRlciAoZikgLT4gZi5maWxlLnN0YXJ0c1dpdGggdGV4dFxuXG4gICAgICAgICAgICBpZiBub3QgZW1wdHkgbWF0Y2hlc1xuICAgICAgICAgICAgICAgIEBzZXRUZXh0IHNsYXNoLnRpbGRlIG1hdGNoZXNbMF0uZmlsZVxuXG4gICAgICAgICAgICBpZiBtYXRjaGVzLmxlbmd0aCA+IDFcblxuICAgICAgICAgICAgICAgIGl0ZW1zID0gbWF0Y2hlcy5tYXAgKG0pIC0+XG5cbiAgICAgICAgICAgICAgICAgICAgaXRlbSA9IE9iamVjdC5jcmVhdGUgbnVsbFxuXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCBtLnR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gJyAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jbHNzID0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gJ+KWuCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNsc3MgPSAnZGlyZWN0b3J5J1xuXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0udGV4dCA9IHNsYXNoLmZpbGUgbS5maWxlXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZmlsZSA9IG0uZmlsZVxuICAgICAgICAgICAgICAgICAgICBpdGVtXG5cbiAgICAgICAgICAgICAgICBAc2hvd0l0ZW1zIGl0ZW1zXG4gICAgICAgICAgICAgICAgQHNlbGVjdCAwXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIEBoaWRlTGlzdCgpXG5cbiAgICBjb21wbGV0ZTogLT5cblxuICAgICAgICB0ZXh0ID0gQGdldFRleHQoKS50cmltKClcblxuICAgICAgICBpZiBub3QgdGV4dC5lbmRzV2l0aCgnLycpIGFuZCBzbGFzaC5kaXJFeGlzdHMgdGV4dFxuICAgICAgICAgICAgQHNldFRleHQgdGV4dCArICcvJ1xuICAgICAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgICAgIHRydWVcbiAgICAgICAgZWxzZSBpZiB0ZXh0LmVuZHNXaXRoICcvJ1xuICAgICAgICAgICAgaWYgc2xhc2guZGlyRXhpc3RzIHNsYXNoLnJlc29sdmUgdGV4dFxuICAgICAgICAgICAgICAgIHNsYXNoLmxpc3Qgc2xhc2gucmVzb2x2ZSh0ZXh0KSwgQGNvbXBsZXRlQ2FsbGJhY2tcbiAgICAgICAgICAgICAgICB0cnVlXG4gICAgICAgIGVsc2UgaWYgbm90IGVtcHR5IHNsYXNoLmRpciB0ZXh0XG4gICAgICAgICAgICBpZiBzbGFzaC5kaXJFeGlzdHMgc2xhc2gucmVzb2x2ZSBzbGFzaC5kaXIgdGV4dFxuICAgICAgICAgICAgICAgIHNsYXNoLmxpc3Qgc2xhc2gucmVzb2x2ZShzbGFzaC5kaXIodGV4dCkpLCBAY29tcGxldGVDYWxsYmFja1xuICAgICAgICAgICAgICAgIHRydWVcblxuICAgIG9uVGFiQ29tcGxldGlvbjogLT5cblxuICAgICAgICBAY29tcGxldGUoKVxuICAgICAgICB0cnVlXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgY29tbW9uUHJlZml4OiAoc3RyQSxzdHJCKSAtPlxuXG4gICAgICAgIHByZWZpeCA9ICcnXG4gICAgICAgIGZvciBpIGluIFswLi4uTWF0aC5taW4oc3RyQS5sZW5ndGgsIHN0ckIubGVuZ3RoKV1cbiAgICAgICAgICAgIGJyZWFrIGlmIHN0ckFbaV0gIT0gc3RyQltpXVxuICAgICAgICAgICAgcHJlZml4ICs9IHN0ckFbaV1cbiAgICAgICAgcHJlZml4XG5cbiAgICBjbGVhckJyb2tlblBhcnRGb3JGaWxlczogKGZpbGVzKSAtPlxuXG4gICAgICAgIGJyb2tlblBhdGggPSBzbGFzaC5yZXNvbHZlIEBnZXRUZXh0KClcbiAgICAgICAgbG9uZ2VzdE1hdGNoID0gJydcbiAgICAgICAgZm9yIGZpbGUgaW4gZmlsZXNcbiAgICAgICAgICAgIGZpbGUgPSBmaWxlLmZpbGVcbiAgICAgICAgICAgIHByZWZpeCA9IEBjb21tb25QcmVmaXggZmlsZSwgYnJva2VuUGF0aFxuICAgICAgICAgICAgaWYgcHJlZml4Lmxlbmd0aCA+IGxvbmdlc3RNYXRjaC5sZW5ndGhcbiAgICAgICAgICAgICAgICBsb25nZXN0TWF0Y2ggPSBwcmVmaXhcbiAgICAgICAgbCA9IEBnZXRUZXh0KCkubGVuZ3RoXG5cbiAgICAgICAgaWYgbm90IGVtcHR5IGxvbmdlc3RNYXRjaFxuICAgICAgICAgICAgQHNldFRleHQgc2xhc2gudGlsZGUgbG9uZ2VzdE1hdGNoXG4gICAgICAgICAgICBAY29tcGxldGUoKVxuXG4gICAgY2hhbmdlZENhbGxiYWNrOiAoZmlsZXMpID0+XG5cbiAgICAgICAgaWYgZW1wdHkgQGdldFRleHQoKS50cmltKClcbiAgICAgICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBwYXRoID0gc2xhc2gucmVzb2x2ZSBAZ2V0VGV4dCgpLnRyaW0oKVxuICAgICAgICBtYXRjaGVzID0gZmlsZXMuZmlsdGVyIChmKSAtPiBmLmZpbGUuc3RhcnRzV2l0aCBwYXRoXG5cbiAgICAgICAgaWYgZW1wdHkgbWF0Y2hlc1xuICAgICAgICAgICAgQGNsZWFyQnJva2VuUGFydEZvckZpbGVzIGZpbGVzXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBzID0gc2xhc2gudGlsZGUocGF0aCkubGVuZ3RoXG5cbiAgICAgICAgdGV4dCA9IHNsYXNoLnRpbGRlIHNsYXNoLnRpbGRlIG1hdGNoZXNbMF0uZmlsZVxuICAgICAgICBAc2V0VGV4dCB0ZXh0XG5cbiAgICAgICAgbCA9IHRleHQubGVuZ3RoXG5cbiAgICAgICAgQGNvbW1hbmRsaW5lLnNlbGVjdFNpbmdsZVJhbmdlIFswLCBbcyxsXV0sIGJlZm9yZTogdHJ1ZVxuXG4gICAgICAgIGlmIG1hdGNoZXMubGVuZ3RoIDwgMlxuICAgICAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgZWxzZVxuXG4gICAgICAgICAgICBpdGVtcyA9IG1hdGNoZXMubWFwIChtKSAtPlxuXG4gICAgICAgICAgICAgICAgaXRlbSA9IE9iamVjdC5jcmVhdGUgbnVsbFxuXG4gICAgICAgICAgICAgICAgc3dpdGNoIG0udHlwZVxuICAgICAgICAgICAgICAgICAgICB3aGVuICdmaWxlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gJyAnXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNsc3MgPSAnZmlsZSdcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gJ+KWuCdcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY2xzcyA9ICdkaXJlY3RvcnknXG5cbiAgICAgICAgICAgICAgICBpdGVtLnRleHQgPSBzbGFzaC5maWxlIG0uZmlsZVxuICAgICAgICAgICAgICAgIGl0ZW0uZmlsZSA9IG0uZmlsZVxuICAgICAgICAgICAgICAgIGl0ZW1cblxuICAgICAgICAgICAgQHNob3dJdGVtcyBpdGVtc1xuXG4gICAgY2hhbmdlZDogKGNvbW1hbmQpIC0+XG5cbiAgICAgICAgIyBrbG9nICdicm93c2UuY2hhbmdlZCcgY29tbWFuZFxuICAgICAgICB0ZXh0ID0gQGdldFRleHQoKS50cmltKClcbiAgICAgICAgaWYgbm90IHRleHQuZW5kc1dpdGggJy8nXG4gICAgICAgICAgICBAd2Fsa2VyPy5lbmQoKVxuICAgICAgICAgICAgQHdhbGtlciA9IHNsYXNoLmxpc3Qgc2xhc2gucmVzb2x2ZShzbGFzaC5kaXIodGV4dCkpLCBAY2hhbmdlZENhbGxiYWNrXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBoaWRlTGlzdCgpXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0V2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBldmVudCkgLT5cblxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2JhY2tzcGFjZSdcbiAgICAgICAgICAgICAgICBpZiBjb21tYW5kbGluZS5tYWluQ3Vyc29yKClbMF0gPT0gY29tbWFuZGxpbmUuc2VsZWN0aW9uKDApP1sxXVswXSAjIGN1cnNvciBpcyBhdCBzZWxlY3Rpb24gc3RhcnRcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZGxpbmUuZG8uc3RhcnQoKSAgICAgICAgICMgZm9yY2Ugc2ltdWx0YW5lb3VzXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRsaW5lLmRlbGV0ZVNlbGVjdGlvbigpICAjIGRlbGV0aW9uIG9mIHNlbGVjdGlvblxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kbGluZS5kZWxldGVCYWNrd2FyZCgpICAgIyBhbmQgYmFja3NwYWNlLlxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kbGluZS5kby5lbmQoKSAgICAgICAgICAgIyBpdCBzaG91bGQgZmVlbCBhcyBpZiBzZWxlY3Rpb24gd2Fzbid0IHRoZXJlLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJ1xuICAgICAgICAgICAgICAgIEBleGVjdXRlIEBnZXRUZXh0KClcbiAgICAgICAgICAgICAgICBmb2N1c0Jyb3dzZXIgPSA9PiBAYnJvd3Nlci5mb2N1cyBmb3JjZTp0cnVlXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCBmb2N1c0Jyb3dzZXIsIDEwMFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAndW5oYW5kbGVkJ1xuXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsaXN0Q2xpY2s6IChpbmRleCkgPT5cblxuICAgICAgICBmaWxlID0gQGNvbW1hbmRMaXN0Lml0ZW1zW2luZGV4XT8uZmlsZVxuICAgICAgICBmaWxlID0gc2xhc2gudGlsZGUgZmlsZSBpZiBmaWxlP1xuICAgICAgICBmaWxlID89IEBjb21tYW5kTGlzdC5saW5lIGluZGV4XG4gICAgICAgIEBzZWxlY3RlZCA9IGluZGV4XG4gICAgICAgIEBleGVjdXRlIGZpbGVcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMFxuXG4gICAgc2VsZWN0OiAoaSkgLT5cblxuICAgICAgICBAc2VsZWN0ZWQgPSBjbGFtcCAtMSwgQGNvbW1hbmRMaXN0Py5udW1MaW5lcygpLTEsIGlcblxuICAgICAgICBpZiBAc2VsZWN0ZWQgPCAwXG4gICAgICAgICAgICBAaGlkZUxpc3QoKVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgQGNvbW1hbmRMaXN0Py5zZWxlY3RTaW5nbGVSYW5nZSBAY29tbWFuZExpc3QucmFuZ2VGb3JMaW5lQXRJbmRleCBAc2VsZWN0ZWRcbiAgICAgICAgQGNvbW1hbmRMaXN0Py5kby5jdXJzb3JzIFtbMCwgQHNlbGVjdGVkXV1cblxuICAgICAgICB0ZXh0ID0gc2xhc2gudGlsZGUgQGNvbW1hbmRMaXN0Lml0ZW1zW0BzZWxlY3RlZF0uZmlsZVxuICAgICAgICBAc2V0VGV4dCB0ZXh0XG4gICAgICAgIHMgPSBzbGFzaC5maWxlKHRleHQpLmxlbmd0aFxuICAgICAgICBsID0gdGV4dC5sZW5ndGhcbiAgICAgICAgQGNvbW1hbmRsaW5lLnNlbGVjdFNpbmdsZVJhbmdlIFswLCBbbC1zLGxdXVxuXG4gICAgc2VsZWN0TGlzdEl0ZW06IChkaXIpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY29tbWFuZExpc3Q/XG5cbiAgICAgICAgc3dpdGNoIGRpclxuICAgICAgICAgICAgd2hlbiAndXAnICAgdGhlbiBAc2VsZWN0IEBzZWxlY3RlZC0xXG4gICAgICAgICAgICB3aGVuICdkb3duJyB0aGVuIEBzZWxlY3QgQHNlbGVjdGVkKzFcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGNhbmNlbDogLT5cblxuICAgICAgICBAaGlkZUxpc3QoKVxuICAgICAgICBmb2N1czogQHJlY2VpdmVyXG4gICAgICAgIHNob3c6ICdlZGl0b3InXG5cbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIGV4ZWN1dGU6IChjb21tYW5kKSAtPlxuXG4gICAgICAgIHJldHVybiBrZXJyb3IgXCJubyBjb21tYW5kP1wiIGlmIG5vdCBjb21tYW5kP1xuXG4gICAgICAgIEBoaWRlTGlzdCgpXG5cbiAgICAgICAgQGNtZElEICs9IDFcbiAgICAgICAgY21kID0gY29tbWFuZC50cmltKClcbiAgICAgICAgaWYgY21kLmxlbmd0aFxuICAgICAgICAgICAgaWYgc2xhc2guZGlyRXhpc3RzIHNsYXNoLnJlbW92ZUxpbmVQb3MgY21kXG4gICAgICAgICAgICAgICAgQGJyb3dzZXIubG9hZEl0ZW0gZmlsZTpjbWQsIHR5cGU6J2RpcidcbiAgICAgICAgICAgICAgICBAY29tbWFuZGxpbmUuc2V0VGV4dCBjbWRcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIGVsc2UgaWYgc2xhc2guZmlsZUV4aXN0cyBzbGFzaC5yZW1vdmVMaW5lUG9zIGNtZFxuICAgICAgICAgICAgICAgIEBjb21tYW5kbGluZS5zZXRUZXh0IGNtZFxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvRmlsZScgZmlsZTpjbWRcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBrZXJyb3IgJ2Jyb3dzZS5leGVjdXRlIC0tIHVuaGFuZGxlZCcgY21kXG5cbiAgICBvbkJyb3dzZXJJdGVtQWN0aXZhdGVkOiAoaXRlbSkgPT5cblxuICAgICAgICBrbG9nICdvbkJyb3dzZXJJdGVtQWN0aXZhdGVkJyBpdGVtLnR5cGUsIGl0ZW0uZmlsZVxuICAgICAgICBcbiAgICAgICAgaWYgbm90IEBpc0FjdGl2ZSgpXG4gICAgICAgICAgICBAY29tbWFuZGxpbmUuY29tbWFuZD8ub25Ccm93c2VySXRlbUFjdGl2YXRlZD8gaXRlbVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgaWYgaXRlbS5maWxlXG4gICAgICAgICAgICBwdGggPSBzbGFzaC50aWxkZSBpdGVtLmZpbGVcbiAgICAgICAgICAgIGlmIGl0ZW0udHlwZSA9PSAnZGlyJ1xuICAgICAgICAgICAgICAgIHB0aCArPSAnLydcbiAgICAgICAgICAgICAgICBpZiBpdGVtLm5hbWUgPT0gJy4uJyBhbmQgQGJyb3dzZXIuYWN0aXZlQ29sdW1uKCk/LnBhcmVudD8uZmlsZVxuICAgICAgICAgICAgICAgICAgICAjIHNob3cgY3VycmVudCBwYXRoIGluc3RlYWQgb2YgdXBkaXIgd2hlbiAuLiBpdGVtIHdhcyBhY3RpdmF0ZWRcbiAgICAgICAgICAgICAgICAgICAgcHRoID0gc2xhc2gudGlsZGUgQGJyb3dzZXIuYWN0aXZlQ29sdW1uKCk/LnBhcmVudD8uZmlsZVxuXG4gICAgICAgICAgICBAY29tbWFuZGxpbmUuc2V0VGV4dCBwdGhcblxubW9kdWxlLmV4cG9ydHMgPSBCcm93c2VcbiJdfQ==
//# sourceURL=../../coffee/commands/browse.coffee