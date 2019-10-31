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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3NlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxtR0FBQTtJQUFBOzs7O0FBUUEsTUFBdUUsT0FBQSxDQUFRLEtBQVIsQ0FBdkUsRUFBRSxlQUFGLEVBQVEsaUJBQVIsRUFBZSxXQUFmLEVBQW1CLGlCQUFuQixFQUEwQixpQkFBMUIsRUFBaUMsaUJBQWpDLEVBQXdDLHlCQUF4QyxFQUFtRCxlQUFuRCxFQUF5RCxtQkFBekQsRUFBaUU7O0FBRWpFLE9BQUEsR0FBYyxPQUFBLENBQVEsd0JBQVI7O0FBQ2QsV0FBQSxHQUFjLE9BQUEsQ0FBUSx3QkFBUjs7QUFFUjs7O0lBRVcsZ0JBQUMsV0FBRDs7Ozs7O1FBRVQsd0NBQU0sV0FBTjtRQUVBLElBQUMsQ0FBQSxLQUFELEdBQVk7UUFDWixJQUFDLENBQUEsT0FBRCxHQUFZLElBQUksV0FBSixDQUFnQixDQUFBLENBQUUsU0FBRixDQUFoQjtRQUNaLElBQUMsQ0FBQSxRQUFELEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYyxJQUFkO1FBQ1osSUFBQyxDQUFBLEtBQUQsR0FBWSxDQUFDLFFBQUQsRUFBVSxRQUFWLEVBQW1CLE9BQW5CO1FBRVosSUFBSSxDQUFDLEVBQUwsQ0FBUSxNQUFSLEVBQWUsSUFBQyxDQUFBLE1BQWhCO1FBRUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksZUFBWixFQUE0QixJQUFDLENBQUEsc0JBQTdCO1FBRUEsSUFBQyxDQUFBLFVBQUQsR0FBYztJQWJMOztxQkFlYixNQUFBLEdBQVEsU0FBQyxJQUFEO1FBRUosSUFBRyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQUEsSUFBZ0IsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFBLEtBQWMsS0FBSyxDQUFDLEtBQU4sQ0FBWSxJQUFaLENBQWpDO21CQUNJLElBQUMsQ0FBQSxPQUFELENBQVMsS0FBSyxDQUFDLEtBQU4sQ0FBWSxJQUFaLENBQVQsRUFESjs7SUFGSTs7cUJBS1IsS0FBQSxHQUFPLFNBQUE7UUFDSCxJQUFVLElBQUMsQ0FBQSxPQUFPLENBQUMsT0FBVCxDQUFBLENBQVY7QUFBQSxtQkFBQTs7ZUFDQSxnQ0FBQTtJQUZHOztxQkFVUCxLQUFBLEdBQU8sU0FBQyxNQUFEO0FBSUgsWUFBQTtRQUFBLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBVCxDQUFBO1FBRUEsSUFBRyxNQUFBLEtBQVUsT0FBYjtZQUNJLElBQUcsbUNBQUEsSUFBK0IsS0FBSyxDQUFDLE1BQU4sQ0FBYSxNQUFNLENBQUMsTUFBTSxDQUFDLFdBQTNCLENBQWxDO2dCQUNJLElBQUMsQ0FBQSxPQUFPLENBQUMsY0FBVCxDQUF3QixNQUFNLENBQUMsTUFBTSxDQUFDLFdBQXRDLEVBREo7YUFBQSxNQUFBO2dCQUdJLElBQUksQ0FBQyxJQUFMLENBQVUsYUFBVixFQUF3QixVQUF4QixFQUFtQztvQkFBQSxJQUFBLEVBQUssT0FBTyxDQUFDLEdBQVIsQ0FBQSxDQUFMO29CQUFvQixJQUFBLEVBQUssS0FBekI7aUJBQW5DLEVBSEo7O1lBSUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFULENBQUEsRUFMSjs7UUFPQSxJQUFBLEdBQU87UUFDUCxJQUFtQixNQUFBLEtBQVUsT0FBN0I7WUFBQSxJQUFBLEdBQU8sU0FBUDs7UUFFQSxrQ0FBTSxJQUFOO2VBRUE7WUFBQSxNQUFBLEVBQVEsSUFBUjtZQUNBLENBQUEsRUFBQSxDQUFBLEVBQVEsSUFBQyxDQUFBLElBQUQsS0FBUyxRQUFULElBQXNCLGNBQXRCLElBQXdDLGVBRGhEO1lBRUEsS0FBQSxFQUFRLE1BQUEsS0FBVSxPQUFWLElBQXNCLE9BQXRCLElBQWlDLElBRnpDOztJQWxCRzs7cUJBNEJQLGdCQUFBLEdBQWtCLFNBQUMsS0FBRDtBQUVkLFlBQUE7UUFBQSxJQUFHLENBQUksS0FBQSxDQUFNLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBVSxDQUFDLElBQVgsQ0FBQSxDQUFOLENBQVA7WUFDSSxJQUFBLEdBQU8sS0FBSyxDQUFDLE9BQU4sQ0FBYyxJQUFDLENBQUEsT0FBRCxDQUFBLENBQVUsQ0FBQyxJQUFYLENBQUEsQ0FBZDtZQUNQLE9BQUEsR0FBVSxLQUFLLENBQUMsTUFBTixDQUFhLFNBQUMsQ0FBRDt1QkFBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVAsQ0FBa0IsSUFBbEI7WUFBUCxDQUFiO1lBRVYsSUFBRyxDQUFJLEtBQUEsQ0FBTSxPQUFOLENBQVA7Z0JBQ0ksSUFBQyxDQUFBLE9BQUQsQ0FBUyxLQUFLLENBQUMsS0FBTixDQUFZLE9BQVEsQ0FBQSxDQUFBLENBQUUsQ0FBQyxJQUF2QixDQUFULEVBREo7O1lBR0EsSUFBRyxPQUFPLENBQUMsTUFBUixHQUFpQixDQUFwQjtnQkFFSSxLQUFBLEdBQVEsT0FBTyxDQUFDLEdBQVIsQ0FBWSxTQUFDLENBQUQ7QUFFaEIsd0JBQUE7b0JBQUEsSUFBQSxHQUFPLE1BQU0sQ0FBQyxNQUFQLENBQWMsSUFBZDtBQUVQLDRCQUFPLENBQUMsQ0FBQyxJQUFUO0FBQUEsNkJBQ1MsTUFEVDs0QkFFUSxJQUFJLENBQUMsSUFBTCxHQUFZOzRCQUNaLElBQUksQ0FBQyxJQUFMLEdBQVk7QUFGWDtBQURULDZCQUlTLEtBSlQ7NEJBS1EsSUFBSSxDQUFDLElBQUwsR0FBWTs0QkFDWixJQUFJLENBQUMsSUFBTCxHQUFZO0FBTnBCO29CQVFBLElBQUksQ0FBQyxJQUFMLEdBQVksS0FBSyxDQUFDLElBQU4sQ0FBVyxDQUFDLENBQUMsSUFBYjtvQkFDWixJQUFJLENBQUMsSUFBTCxHQUFZLENBQUMsQ0FBQzsyQkFDZDtnQkFkZ0IsQ0FBWjtnQkFnQlIsSUFBQyxDQUFBLFNBQUQsQ0FBVyxLQUFYO2dCQUNBLElBQUMsQ0FBQSxNQUFELENBQVEsQ0FBUjtBQUNBLHVCQXBCSjthQVBKOztlQTRCQSxJQUFDLENBQUEsUUFBRCxDQUFBO0lBOUJjOztxQkFnQ2xCLFFBQUEsR0FBVSxTQUFBO0FBRU4sWUFBQTtRQUFBLElBQUEsR0FBTyxJQUFDLENBQUEsT0FBRCxDQUFBLENBQVUsQ0FBQyxJQUFYLENBQUE7UUFFUCxJQUFHLENBQUksSUFBSSxDQUFDLFFBQUwsQ0FBYyxHQUFkLENBQUosSUFBMkIsS0FBSyxDQUFDLFNBQU4sQ0FBZ0IsSUFBaEIsQ0FBOUI7WUFDSSxJQUFDLENBQUEsT0FBRCxDQUFTLElBQUEsR0FBTyxHQUFoQjtZQUNBLElBQUMsQ0FBQSxRQUFELENBQUE7bUJBQ0EsS0FISjtTQUFBLE1BSUssSUFBRyxJQUFJLENBQUMsUUFBTCxDQUFjLEdBQWQsQ0FBSDtZQUNELElBQUcsS0FBSyxDQUFDLFNBQU4sQ0FBZ0IsS0FBSyxDQUFDLE9BQU4sQ0FBYyxJQUFkLENBQWhCLENBQUg7Z0JBQ0ksS0FBSyxDQUFDLElBQU4sQ0FBVyxLQUFLLENBQUMsT0FBTixDQUFjLElBQWQsQ0FBWCxFQUFnQyxJQUFDLENBQUEsZ0JBQWpDO3VCQUNBLEtBRko7YUFEQztTQUFBLE1BSUEsSUFBRyxDQUFJLEtBQUEsQ0FBTSxLQUFLLENBQUMsR0FBTixDQUFVLElBQVYsQ0FBTixDQUFQO1lBQ0QsSUFBRyxLQUFLLENBQUMsU0FBTixDQUFnQixLQUFLLENBQUMsT0FBTixDQUFjLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixDQUFkLENBQWhCLENBQUg7Z0JBQ0ksS0FBSyxDQUFDLElBQU4sQ0FBVyxLQUFLLENBQUMsT0FBTixDQUFjLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixDQUFkLENBQVgsRUFBMkMsSUFBQyxDQUFBLGdCQUE1Qzt1QkFDQSxLQUZKO2FBREM7O0lBWkM7O3FCQWlCVixlQUFBLEdBQWlCLFNBQUE7UUFFYixJQUFDLENBQUEsUUFBRCxDQUFBO2VBQ0E7SUFIYTs7cUJBV2pCLFlBQUEsR0FBYyxTQUFDLElBQUQsRUFBTSxJQUFOO0FBRVYsWUFBQTtRQUFBLE1BQUEsR0FBUztBQUNULGFBQVMsZ0hBQVQ7WUFDSSxJQUFTLElBQUssQ0FBQSxDQUFBLENBQUwsS0FBVyxJQUFLLENBQUEsQ0FBQSxDQUF6QjtBQUFBLHNCQUFBOztZQUNBLE1BQUEsSUFBVSxJQUFLLENBQUEsQ0FBQTtBQUZuQjtlQUdBO0lBTlU7O3FCQVFkLHVCQUFBLEdBQXlCLFNBQUMsS0FBRDtBQUVyQixZQUFBO1FBQUEsVUFBQSxHQUFhLEtBQUssQ0FBQyxPQUFOLENBQWMsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFkO1FBQ2IsWUFBQSxHQUFlO0FBQ2YsYUFBQSx1Q0FBQTs7WUFDSSxJQUFBLEdBQU8sSUFBSSxDQUFDO1lBQ1osTUFBQSxHQUFTLElBQUMsQ0FBQSxZQUFELENBQWMsSUFBZCxFQUFvQixVQUFwQjtZQUNULElBQUcsTUFBTSxDQUFDLE1BQVAsR0FBZ0IsWUFBWSxDQUFDLE1BQWhDO2dCQUNJLFlBQUEsR0FBZSxPQURuQjs7QUFISjtRQUtBLENBQUEsR0FBSSxJQUFDLENBQUEsT0FBRCxDQUFBLENBQVUsQ0FBQztRQUVmLElBQUcsQ0FBSSxLQUFBLENBQU0sWUFBTixDQUFQO1lBQ0ksSUFBQyxDQUFBLE9BQUQsQ0FBUyxLQUFLLENBQUMsS0FBTixDQUFZLFlBQVosQ0FBVDttQkFDQSxJQUFDLENBQUEsUUFBRCxDQUFBLEVBRko7O0lBWHFCOztxQkFlekIsZUFBQSxHQUFpQixTQUFDLEtBQUQ7QUFFYixZQUFBO1FBQUEsSUFBQSxDQUFLLGlCQUFMLEVBQXVCLEtBQXZCO1FBRUEsSUFBRyxLQUFBLENBQU0sSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFVLENBQUMsSUFBWCxDQUFBLENBQU4sQ0FBSDtZQUNJLElBQUMsQ0FBQSxRQUFELENBQUE7QUFDQSxtQkFGSjs7UUFJQSxJQUFBLEdBQU8sS0FBSyxDQUFDLE9BQU4sQ0FBYyxJQUFDLENBQUEsT0FBRCxDQUFBLENBQVUsQ0FBQyxJQUFYLENBQUEsQ0FBZDtRQUNQLE9BQUEsR0FBVSxLQUFLLENBQUMsTUFBTixDQUFhLFNBQUMsQ0FBRDttQkFBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVAsQ0FBa0IsSUFBbEI7UUFBUCxDQUFiO1FBRVYsSUFBRyxLQUFBLENBQU0sT0FBTixDQUFIO1lBQ0ksSUFBQyxDQUFBLHVCQUFELENBQXlCLEtBQXpCO0FBQ0EsbUJBRko7O1FBSUEsQ0FBQSxHQUFJLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBWixDQUFpQixDQUFDO1FBRXRCLElBQUEsR0FBTyxLQUFLLENBQUMsS0FBTixDQUFZLEtBQUssQ0FBQyxLQUFOLENBQVksT0FBUSxDQUFBLENBQUEsQ0FBRSxDQUFDLElBQXZCLENBQVo7UUFDUCxJQUFDLENBQUEsT0FBRCxDQUFTLElBQVQ7UUFFQSxDQUFBLEdBQUksSUFBSSxDQUFDO1FBRVQsSUFBQyxDQUFBLFdBQVcsQ0FBQyxpQkFBYixDQUErQixDQUFDLENBQUQsRUFBSSxDQUFDLENBQUQsRUFBRyxDQUFILENBQUosQ0FBL0IsRUFBMkM7WUFBQSxNQUFBLEVBQVEsSUFBUjtTQUEzQztRQUVBLElBQUcsT0FBTyxDQUFDLE1BQVIsR0FBaUIsQ0FBcEI7bUJBQ0ksSUFBQyxDQUFBLFFBQUQsQ0FBQSxFQURKO1NBQUEsTUFBQTtZQUlJLEtBQUEsR0FBUSxPQUFPLENBQUMsR0FBUixDQUFZLFNBQUMsQ0FBRDtBQUVoQixvQkFBQTtnQkFBQSxJQUFBLEdBQU8sTUFBTSxDQUFDLE1BQVAsQ0FBYyxJQUFkO0FBRVAsd0JBQU8sQ0FBQyxDQUFDLElBQVQ7QUFBQSx5QkFDUyxNQURUO3dCQUVRLElBQUksQ0FBQyxJQUFMLEdBQVk7d0JBQ1osSUFBSSxDQUFDLElBQUwsR0FBWTtBQUZYO0FBRFQseUJBSVMsS0FKVDt3QkFLUSxJQUFJLENBQUMsSUFBTCxHQUFZO3dCQUNaLElBQUksQ0FBQyxJQUFMLEdBQVk7QUFOcEI7Z0JBUUEsSUFBSSxDQUFDLElBQUwsR0FBWSxLQUFLLENBQUMsSUFBTixDQUFXLENBQUMsQ0FBQyxJQUFiO2dCQUNaLElBQUksQ0FBQyxJQUFMLEdBQVksQ0FBQyxDQUFDO3VCQUNkO1lBZGdCLENBQVo7bUJBZ0JSLElBQUMsQ0FBQSxTQUFELENBQVcsS0FBWCxFQXBCSjs7SUF4QmE7O3FCQThDakIsT0FBQSxHQUFTLFNBQUMsT0FBRDtBQUVMLFlBQUE7UUFBQSxJQUFBLENBQUssZ0JBQUwsRUFBc0IsT0FBdEI7UUFDQSxJQUFBLEdBQU8sSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFVLENBQUMsSUFBWCxDQUFBO1FBQ1AsSUFBRyxDQUFJLElBQUksQ0FBQyxRQUFMLENBQWMsR0FBZCxDQUFQOztvQkFDVyxDQUFFLEdBQVQsQ0FBQTs7bUJBQ0EsSUFBQyxDQUFBLE1BQUQsR0FBVSxLQUFLLENBQUMsSUFBTixDQUFXLEtBQUssQ0FBQyxPQUFOLENBQWMsS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWLENBQWQsQ0FBWCxFQUEyQyxJQUFDLENBQUEsZUFBNUMsRUFGZDtTQUFBLE1BQUE7bUJBSUksSUFBQyxDQUFBLFFBQUQsQ0FBQSxFQUpKOztJQUpLOztxQkFnQlQsc0JBQUEsR0FBd0IsU0FBQyxHQUFELEVBQU0sR0FBTixFQUFXLEtBQVgsRUFBa0IsS0FBbEI7QUFFcEIsWUFBQTtBQUFBLGdCQUFPLEtBQVA7QUFBQSxpQkFDUyxXQURUO2dCQUVRLElBQUcsV0FBVyxDQUFDLFVBQVosQ0FBQSxDQUF5QixDQUFBLENBQUEsQ0FBekIsc0RBQXlELENBQUEsQ0FBQSxDQUFHLENBQUEsQ0FBQSxXQUEvRDtvQkFDSSxXQUFXLEVBQUMsRUFBRCxFQUFHLENBQUMsS0FBZixDQUFBO29CQUNBLFdBQVcsQ0FBQyxlQUFaLENBQUE7b0JBQ0EsV0FBVyxDQUFDLGNBQVosQ0FBQTtvQkFDQSxXQUFXLEVBQUMsRUFBRCxFQUFHLENBQUMsR0FBZixDQUFBO0FBQ0EsMkJBTEo7O0FBREM7QUFEVCxpQkFRUyxPQVJUO2dCQVNRLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFUO2dCQUNBLFlBQUEsR0FBZSxDQUFBLFNBQUEsS0FBQTsyQkFBQSxTQUFBOytCQUFHLEtBQUMsQ0FBQSxPQUFPLENBQUMsS0FBVCxDQUFBO29CQUFIO2dCQUFBLENBQUEsQ0FBQSxDQUFBLElBQUE7Z0JBQ2YsVUFBQSxDQUFXLFlBQVgsRUFBeUIsR0FBekI7QUFDQTtBQVpSO2VBYUE7SUFmb0I7O3FCQXVCeEIsU0FBQSxHQUFXLFNBQUMsS0FBRDtBQUVQLFlBQUE7UUFBQSxJQUFBLHdEQUFnQyxDQUFFO1FBQ2xDLElBQTJCLFlBQTNCO1lBQUEsSUFBQSxHQUFPLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBWixFQUFQOzs7WUFDQTs7WUFBQSxPQUFRLElBQUMsQ0FBQSxXQUFXLENBQUMsSUFBYixDQUFrQixLQUFsQjs7UUFDUixJQUFDLENBQUEsUUFBRCxHQUFZO2VBQ1osSUFBQyxDQUFBLE9BQUQsQ0FBUyxJQUFUO0lBTk87O3FCQWNYLE1BQUEsR0FBUSxTQUFDLENBQUQ7QUFFSixZQUFBO1FBQUEsSUFBQyxDQUFBLFFBQUQsR0FBWSxLQUFBLENBQU0sQ0FBQyxDQUFQLDJDQUFzQixDQUFFLFFBQWQsQ0FBQSxXQUFBLEdBQXlCLENBQW5DLEVBQXNDLENBQXRDO1FBRVosSUFBRyxJQUFDLENBQUEsUUFBRCxHQUFZLENBQWY7WUFDSSxJQUFDLENBQUEsUUFBRCxDQUFBO0FBQ0EsbUJBRko7OztnQkFJWSxDQUFFLGlCQUFkLENBQWdDLElBQUMsQ0FBQSxXQUFXLENBQUMsbUJBQWIsQ0FBaUMsSUFBQyxDQUFBLFFBQWxDLENBQWhDOzs7Z0JBQ1ksRUFBRSxFQUFGLEVBQUksQ0FBQyxPQUFqQixDQUF5QixDQUFDLENBQUMsQ0FBRCxFQUFJLElBQUMsQ0FBQSxRQUFMLENBQUQsQ0FBekI7O1FBRUEsSUFBQSxHQUFPLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBQyxDQUFBLFdBQVcsQ0FBQyxLQUFNLENBQUEsSUFBQyxDQUFBLFFBQUQsQ0FBVSxDQUFDLElBQTFDO1FBQ1AsSUFBQyxDQUFBLE9BQUQsQ0FBUyxJQUFUO1FBQ0EsQ0FBQSxHQUFJLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxDQUFnQixDQUFDO1FBQ3JCLENBQUEsR0FBSSxJQUFJLENBQUM7ZUFDVCxJQUFDLENBQUEsV0FBVyxDQUFDLGlCQUFiLENBQStCLENBQUMsQ0FBRCxFQUFJLENBQUMsQ0FBQSxHQUFFLENBQUgsRUFBSyxDQUFMLENBQUosQ0FBL0I7SUFmSTs7cUJBaUJSLGNBQUEsR0FBZ0IsU0FBQyxHQUFEO1FBRVosSUFBYyx3QkFBZDtBQUFBLG1CQUFBOztBQUVBLGdCQUFPLEdBQVA7QUFBQSxpQkFDUyxJQURUO3VCQUNxQixJQUFDLENBQUEsTUFBRCxDQUFRLElBQUMsQ0FBQSxRQUFELEdBQVUsQ0FBbEI7QUFEckIsaUJBRVMsTUFGVDt1QkFFcUIsSUFBQyxDQUFBLE1BQUQsQ0FBUSxJQUFDLENBQUEsUUFBRCxHQUFVLENBQWxCO0FBRnJCO0lBSlk7O3FCQWNoQixNQUFBLEdBQVEsU0FBQTtRQUVKLElBQUMsQ0FBQSxRQUFELENBQUE7ZUFDQTtZQUFBLEtBQUEsRUFBTyxJQUFDLENBQUEsUUFBUjtZQUNBLElBQUEsRUFBTSxRQUROOztJQUhJOztxQkFZUixPQUFBLEdBQVMsU0FBQyxPQUFEO0FBRUwsWUFBQTtRQUFBLElBQW1DLGVBQW5DO0FBQUEsbUJBQU8sTUFBQSxDQUFPLGFBQVAsRUFBUDs7UUFFQSxJQUFDLENBQUEsUUFBRCxDQUFBO1FBRUEsSUFBQyxDQUFBLEtBQUQsSUFBVTtRQUNWLEdBQUEsR0FBTSxPQUFPLENBQUMsSUFBUixDQUFBO1FBQ04sSUFBRyxHQUFHLENBQUMsTUFBUDtZQUNJLElBQUcsS0FBSyxDQUFDLFNBQU4sQ0FBZ0IsS0FBSyxDQUFDLGFBQU4sQ0FBb0IsR0FBcEIsQ0FBaEIsQ0FBSDtnQkFDSSxJQUFDLENBQUEsT0FBTyxDQUFDLFFBQVQsQ0FBa0I7b0JBQUEsSUFBQSxFQUFLLEdBQUw7b0JBQVUsSUFBQSxFQUFLLEtBQWY7aUJBQWxCO2dCQUNBLElBQUMsQ0FBQSxXQUFXLENBQUMsT0FBYixDQUFxQixHQUFyQjtBQUNBLHVCQUhKO2FBQUEsTUFJSyxJQUFHLEtBQUssQ0FBQyxVQUFOLENBQWlCLEtBQUssQ0FBQyxhQUFOLENBQW9CLEdBQXBCLENBQWpCLENBQUg7Z0JBQ0QsSUFBQyxDQUFBLFdBQVcsQ0FBQyxPQUFiLENBQXFCLEdBQXJCO2dCQUNBLElBQUksQ0FBQyxJQUFMLENBQVUsWUFBVixFQUF1QjtvQkFBQSxJQUFBLEVBQUssR0FBTDtpQkFBdkI7QUFDQSx1QkFIQzthQUxUOztlQVVBLE1BQUEsQ0FBTyw2QkFBUCxFQUFzQyxHQUF0QztJQWxCSzs7cUJBb0JULHNCQUFBLEdBQXdCLFNBQUMsSUFBRDtBQUVwQixZQUFBO1FBQUEsSUFBRyxDQUFJLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBUDs7O3dCQUN3QixDQUFFLHVCQUF3Qjs7O0FBQzlDLG1CQUZKOztRQUlBLElBQUcsSUFBSSxDQUFDLElBQVI7WUFDSSxHQUFBLEdBQU0sS0FBSyxDQUFDLEtBQU4sQ0FBWSxJQUFJLENBQUMsSUFBakI7WUFDTixJQUFHLElBQUksQ0FBQyxJQUFMLEtBQWEsS0FBaEI7Z0JBQ0ksR0FBQSxJQUFPO2dCQUNQLElBQUcsSUFBSSxDQUFDLElBQUwsS0FBYSxJQUFiLHVGQUFxRCxDQUFFLHVCQUExRDtvQkFFSSxHQUFBLEdBQU0sS0FBSyxDQUFDLEtBQU4sbUZBQTJDLENBQUUsc0JBQTdDLEVBRlY7aUJBRko7O21CQU1BLElBQUMsQ0FBQSxXQUFXLENBQUMsT0FBYixDQUFxQixHQUFyQixFQVJKOztJQU5vQjs7OztHQWpUUDs7QUFpVXJCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwXG4wMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbjAwMDAwMDAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwXG4jIyNcblxueyBwb3N0LCBzbGFzaCwgb3MsIHZhbGlkLCBlbXB0eSwgY2xhbXAsIHN0b3BFdmVudCwga2xvZywga2Vycm9yLCAkIH0gPSByZXF1aXJlICdreGsnXG5cbkNvbW1hbmQgICAgID0gcmVxdWlyZSAnLi4vY29tbWFuZGxpbmUvY29tbWFuZCdcbkZpbGVCcm93c2VyID0gcmVxdWlyZSAnLi4vYnJvd3Nlci9maWxlYnJvd3NlcidcblxuY2xhc3MgQnJvd3NlIGV4dGVuZHMgQ29tbWFuZFxuXG4gICAgY29uc3RydWN0b3I6IChjb21tYW5kbGluZSkgLT5cblxuICAgICAgICBzdXBlciBjb21tYW5kbGluZVxuXG4gICAgICAgIEBjbWRJRCAgICA9IDBcbiAgICAgICAgQGJyb3dzZXIgID0gbmV3IEZpbGVCcm93c2VyICQgJ2Jyb3dzZXInXG4gICAgICAgIEBjb21tYW5kcyA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICBAbmFtZXMgICAgPSBbJ2Jyb3dzZScgJ0Jyb3dzZScgJ3NoZWxmJ11cblxuICAgICAgICBwb3N0Lm9uICdmaWxlJyBAb25GaWxlXG5cbiAgICAgICAgQGJyb3dzZXIub24gJ2l0ZW1BY3RpdmF0ZWQnIEBvbkJyb3dzZXJJdGVtQWN0aXZhdGVkXG5cbiAgICAgICAgQHN5bnRheE5hbWUgPSAnYnJvd3NlcidcblxuICAgIG9uRmlsZTogKGZpbGUpID0+XG5cbiAgICAgICAgaWYgQGlzQWN0aXZlKCkgYW5kIEBnZXRUZXh0KCkgIT0gc2xhc2gudGlsZGUgZmlsZVxuICAgICAgICAgICAgQHNldFRleHQgc2xhc2gudGlsZGUgZmlsZVxuXG4gICAgY2xlYXI6IC0+XG4gICAgICAgIHJldHVybiBpZiBAYnJvd3Nlci5jbGVhblVwKClcbiAgICAgICAgc3VwZXIoKVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbiAgICBzdGFydDogKGFjdGlvbikgLT5cblxuICAgICAgICAjIGtsb2cgJ2Jyb3dzZS5zdGFydCcgYWN0aW9uXG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5zdGFydCgpXG5cbiAgICAgICAgaWYgYWN0aW9uICE9ICdzaGVsZidcbiAgICAgICAgICAgIGlmIHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGU/IGFuZCBzbGFzaC5pc0ZpbGUgd2luZG93LmVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgICAgIEBicm93c2VyLm5hdmlnYXRlVG9GaWxlIHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2ZpbGVicm93c2VyJyAnbG9hZEl0ZW0nIGZpbGU6cHJvY2Vzcy5jd2QoKSwgdHlwZTonZGlyJ1xuICAgICAgICAgICAgQGJyb3dzZXIuZm9jdXMoKVxuXG4gICAgICAgIG5hbWUgPSBhY3Rpb25cbiAgICAgICAgbmFtZSA9ICdicm93c2UnIGlmIGFjdGlvbiA9PSAnc2hlbGYnXG5cbiAgICAgICAgc3VwZXIgbmFtZVxuXG4gICAgICAgIHNlbGVjdDogdHJ1ZVxuICAgICAgICBkbzogICAgIEBuYW1lID09ICdCcm93c2UnIGFuZCAnaGFsZiBicm93c2VyJyBvciAncXVhcnQgYnJvd3NlcidcbiAgICAgICAgZm9jdXM6ICBhY3Rpb24gPT0gJ3NoZWxmJyBhbmQgJ3NoZWxmJyBvciBudWxsXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgY29tcGxldGVDYWxsYmFjazogKGZpbGVzKSA9PlxuXG4gICAgICAgIGlmIG5vdCBlbXB0eSBAZ2V0VGV4dCgpLnRyaW0oKVxuICAgICAgICAgICAgdGV4dCA9IHNsYXNoLnJlc29sdmUgQGdldFRleHQoKS50cmltKClcbiAgICAgICAgICAgIG1hdGNoZXMgPSBmaWxlcy5maWx0ZXIgKGYpIC0+IGYuZmlsZS5zdGFydHNXaXRoIHRleHRcblxuICAgICAgICAgICAgaWYgbm90IGVtcHR5IG1hdGNoZXNcbiAgICAgICAgICAgICAgICBAc2V0VGV4dCBzbGFzaC50aWxkZSBtYXRjaGVzWzBdLmZpbGVcblxuICAgICAgICAgICAgaWYgbWF0Y2hlcy5sZW5ndGggPiAxXG5cbiAgICAgICAgICAgICAgICBpdGVtcyA9IG1hdGNoZXMubWFwIChtKSAtPlxuXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBPYmplY3QuY3JlYXRlIG51bGxcblxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggbS50eXBlXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGVuICdmaWxlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ubGluZSA9ICcgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY2xzcyA9ICdmaWxlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ubGluZSA9ICfilrgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jbHNzID0gJ2RpcmVjdG9yeSdcblxuICAgICAgICAgICAgICAgICAgICBpdGVtLnRleHQgPSBzbGFzaC5maWxlIG0uZmlsZVxuICAgICAgICAgICAgICAgICAgICBpdGVtLmZpbGUgPSBtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgaXRlbVxuXG4gICAgICAgICAgICAgICAgQHNob3dJdGVtcyBpdGVtc1xuICAgICAgICAgICAgICAgIEBzZWxlY3QgMFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICBAaGlkZUxpc3QoKVxuXG4gICAgY29tcGxldGU6IC0+XG5cbiAgICAgICAgdGV4dCA9IEBnZXRUZXh0KCkudHJpbSgpXG5cbiAgICAgICAgaWYgbm90IHRleHQuZW5kc1dpdGgoJy8nKSBhbmQgc2xhc2guZGlyRXhpc3RzIHRleHRcbiAgICAgICAgICAgIEBzZXRUZXh0IHRleHQgKyAnLydcbiAgICAgICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgICAgICB0cnVlXG4gICAgICAgIGVsc2UgaWYgdGV4dC5lbmRzV2l0aCAnLydcbiAgICAgICAgICAgIGlmIHNsYXNoLmRpckV4aXN0cyBzbGFzaC5yZXNvbHZlIHRleHRcbiAgICAgICAgICAgICAgICBzbGFzaC5saXN0IHNsYXNoLnJlc29sdmUodGV4dCksIEBjb21wbGV0ZUNhbGxiYWNrXG4gICAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICBlbHNlIGlmIG5vdCBlbXB0eSBzbGFzaC5kaXIgdGV4dFxuICAgICAgICAgICAgaWYgc2xhc2guZGlyRXhpc3RzIHNsYXNoLnJlc29sdmUgc2xhc2guZGlyIHRleHRcbiAgICAgICAgICAgICAgICBzbGFzaC5saXN0IHNsYXNoLnJlc29sdmUoc2xhc2guZGlyKHRleHQpKSwgQGNvbXBsZXRlQ2FsbGJhY2tcbiAgICAgICAgICAgICAgICB0cnVlXG5cbiAgICBvblRhYkNvbXBsZXRpb246IC0+XG5cbiAgICAgICAgQGNvbXBsZXRlKClcbiAgICAgICAgdHJ1ZVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGNvbW1vblByZWZpeDogKHN0ckEsc3RyQikgLT5cblxuICAgICAgICBwcmVmaXggPSAnJ1xuICAgICAgICBmb3IgaSBpbiBbMC4uLk1hdGgubWluKHN0ckEubGVuZ3RoLCBzdHJCLmxlbmd0aCldXG4gICAgICAgICAgICBicmVhayBpZiBzdHJBW2ldICE9IHN0ckJbaV1cbiAgICAgICAgICAgIHByZWZpeCArPSBzdHJBW2ldXG4gICAgICAgIHByZWZpeFxuXG4gICAgY2xlYXJCcm9rZW5QYXJ0Rm9yRmlsZXM6IChmaWxlcykgLT5cblxuICAgICAgICBicm9rZW5QYXRoID0gc2xhc2gucmVzb2x2ZSBAZ2V0VGV4dCgpXG4gICAgICAgIGxvbmdlc3RNYXRjaCA9ICcnXG4gICAgICAgIGZvciBmaWxlIGluIGZpbGVzXG4gICAgICAgICAgICBmaWxlID0gZmlsZS5maWxlXG4gICAgICAgICAgICBwcmVmaXggPSBAY29tbW9uUHJlZml4IGZpbGUsIGJyb2tlblBhdGhcbiAgICAgICAgICAgIGlmIHByZWZpeC5sZW5ndGggPiBsb25nZXN0TWF0Y2gubGVuZ3RoXG4gICAgICAgICAgICAgICAgbG9uZ2VzdE1hdGNoID0gcHJlZml4XG4gICAgICAgIGwgPSBAZ2V0VGV4dCgpLmxlbmd0aFxuXG4gICAgICAgIGlmIG5vdCBlbXB0eSBsb25nZXN0TWF0Y2hcbiAgICAgICAgICAgIEBzZXRUZXh0IHNsYXNoLnRpbGRlIGxvbmdlc3RNYXRjaFxuICAgICAgICAgICAgQGNvbXBsZXRlKClcblxuICAgIGNoYW5nZWRDYWxsYmFjazogKGZpbGVzKSA9PlxuXG4gICAgICAgIGtsb2cgJ2NoYW5nZWRDYWxsYmFjaycgZmlsZXNcbiAgICAgICAgXG4gICAgICAgIGlmIGVtcHR5IEBnZXRUZXh0KCkudHJpbSgpXG4gICAgICAgICAgICBAaGlkZUxpc3QoKVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgcGF0aCA9IHNsYXNoLnJlc29sdmUgQGdldFRleHQoKS50cmltKClcbiAgICAgICAgbWF0Y2hlcyA9IGZpbGVzLmZpbHRlciAoZikgLT4gZi5maWxlLnN0YXJ0c1dpdGggcGF0aFxuXG4gICAgICAgIGlmIGVtcHR5IG1hdGNoZXNcbiAgICAgICAgICAgIEBjbGVhckJyb2tlblBhcnRGb3JGaWxlcyBmaWxlc1xuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgcyA9IHNsYXNoLnRpbGRlKHBhdGgpLmxlbmd0aFxuXG4gICAgICAgIHRleHQgPSBzbGFzaC50aWxkZSBzbGFzaC50aWxkZSBtYXRjaGVzWzBdLmZpbGVcbiAgICAgICAgQHNldFRleHQgdGV4dFxuXG4gICAgICAgIGwgPSB0ZXh0Lmxlbmd0aFxuXG4gICAgICAgIEBjb21tYW5kbGluZS5zZWxlY3RTaW5nbGVSYW5nZSBbMCwgW3MsbF1dLCBiZWZvcmU6IHRydWVcblxuICAgICAgICBpZiBtYXRjaGVzLmxlbmd0aCA8IDJcbiAgICAgICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgIGVsc2VcblxuICAgICAgICAgICAgaXRlbXMgPSBtYXRjaGVzLm1hcCAobSkgLT5cblxuICAgICAgICAgICAgICAgIGl0ZW0gPSBPYmplY3QuY3JlYXRlIG51bGxcblxuICAgICAgICAgICAgICAgIHN3aXRjaCBtLnR5cGVcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnZmlsZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ubGluZSA9ICcgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jbHNzID0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ubGluZSA9ICfilrgnXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNsc3MgPSAnZGlyZWN0b3J5J1xuXG4gICAgICAgICAgICAgICAgaXRlbS50ZXh0ID0gc2xhc2guZmlsZSBtLmZpbGVcbiAgICAgICAgICAgICAgICBpdGVtLmZpbGUgPSBtLmZpbGVcbiAgICAgICAgICAgICAgICBpdGVtXG5cbiAgICAgICAgICAgIEBzaG93SXRlbXMgaXRlbXNcblxuICAgIGNoYW5nZWQ6IChjb21tYW5kKSAtPlxuXG4gICAgICAgIGtsb2cgJ2Jyb3dzZS5jaGFuZ2VkJyBjb21tYW5kXG4gICAgICAgIHRleHQgPSBAZ2V0VGV4dCgpLnRyaW0oKVxuICAgICAgICBpZiBub3QgdGV4dC5lbmRzV2l0aCAnLydcbiAgICAgICAgICAgIEB3YWxrZXI/LmVuZCgpXG4gICAgICAgICAgICBAd2Fsa2VyID0gc2xhc2gubGlzdCBzbGFzaC5yZXNvbHZlKHNsYXNoLmRpcih0ZXh0KSksIEBjaGFuZ2VkQ2FsbGJhY2tcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGhpZGVMaXN0KClcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDBcblxuICAgIGhhbmRsZU1vZEtleUNvbWJvRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGV2ZW50KSAtPlxuXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnYmFja3NwYWNlJ1xuICAgICAgICAgICAgICAgIGlmIGNvbW1hbmRsaW5lLm1haW5DdXJzb3IoKVswXSA9PSBjb21tYW5kbGluZS5zZWxlY3Rpb24oMCk/WzFdWzBdICMgY3Vyc29yIGlzIGF0IHNlbGVjdGlvbiBzdGFydFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kbGluZS5kby5zdGFydCgpICAgICAgICAgIyBmb3JjZSBzaW11bHRhbmVvdXNcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZGxpbmUuZGVsZXRlU2VsZWN0aW9uKCkgICMgZGVsZXRpb24gb2Ygc2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRsaW5lLmRlbGV0ZUJhY2t3YXJkKCkgICAjIGFuZCBiYWNrc3BhY2UuXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRsaW5lLmRvLmVuZCgpICAgICAgICAgICAjIGl0IHNob3VsZCBmZWVsIGFzIGlmIHNlbGVjdGlvbiB3YXNuJ3QgdGhlcmUuXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgd2hlbiAnZW50ZXInXG4gICAgICAgICAgICAgICAgQGV4ZWN1dGUgQGdldFRleHQoKVxuICAgICAgICAgICAgICAgIGZvY3VzQnJvd3NlciA9ID0+IEBicm93c2VyLmZvY3VzKClcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0IGZvY3VzQnJvd3NlciwgMTAwXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICd1bmhhbmRsZWQnXG5cbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGxpc3RDbGljazogKGluZGV4KSA9PlxuXG4gICAgICAgIGZpbGUgPSBAY29tbWFuZExpc3QuaXRlbXNbaW5kZXhdPy5maWxlXG4gICAgICAgIGZpbGUgPSBzbGFzaC50aWxkZSBmaWxlIGlmIGZpbGU/XG4gICAgICAgIGZpbGUgPz0gQGNvbW1hbmRMaXN0LmxpbmUgaW5kZXhcbiAgICAgICAgQHNlbGVjdGVkID0gaW5kZXhcbiAgICAgICAgQGV4ZWN1dGUgZmlsZVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwXG5cbiAgICBzZWxlY3Q6IChpKSAtPlxuXG4gICAgICAgIEBzZWxlY3RlZCA9IGNsYW1wIC0xLCBAY29tbWFuZExpc3Q/Lm51bUxpbmVzKCktMSwgaVxuXG4gICAgICAgIGlmIEBzZWxlY3RlZCA8IDBcbiAgICAgICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBAY29tbWFuZExpc3Q/LnNlbGVjdFNpbmdsZVJhbmdlIEBjb21tYW5kTGlzdC5yYW5nZUZvckxpbmVBdEluZGV4IEBzZWxlY3RlZFxuICAgICAgICBAY29tbWFuZExpc3Q/LmRvLmN1cnNvcnMgW1swLCBAc2VsZWN0ZWRdXVxuXG4gICAgICAgIHRleHQgPSBzbGFzaC50aWxkZSBAY29tbWFuZExpc3QuaXRlbXNbQHNlbGVjdGVkXS5maWxlXG4gICAgICAgIEBzZXRUZXh0IHRleHRcbiAgICAgICAgcyA9IHNsYXNoLmZpbGUodGV4dCkubGVuZ3RoXG4gICAgICAgIGwgPSB0ZXh0Lmxlbmd0aFxuICAgICAgICBAY29tbWFuZGxpbmUuc2VsZWN0U2luZ2xlUmFuZ2UgWzAsIFtsLXMsbF1dXG5cbiAgICBzZWxlY3RMaXN0SXRlbTogKGRpcikgLT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IEBjb21tYW5kTGlzdD9cblxuICAgICAgICBzd2l0Y2ggZGlyXG4gICAgICAgICAgICB3aGVuICd1cCcgICB0aGVuIEBzZWxlY3QgQHNlbGVjdGVkLTFcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nIHRoZW4gQHNlbGVjdCBAc2VsZWN0ZWQrMVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgY2FuY2VsOiAtPlxuXG4gICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgIGZvY3VzOiBAcmVjZWl2ZXJcbiAgICAgICAgc2hvdzogJ2VkaXRvcidcblxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgZXhlY3V0ZTogKGNvbW1hbmQpIC0+XG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciBcIm5vIGNvbW1hbmQ/XCIgaWYgbm90IGNvbW1hbmQ/XG5cbiAgICAgICAgQGhpZGVMaXN0KClcblxuICAgICAgICBAY21kSUQgKz0gMVxuICAgICAgICBjbWQgPSBjb21tYW5kLnRyaW0oKVxuICAgICAgICBpZiBjbWQubGVuZ3RoXG4gICAgICAgICAgICBpZiBzbGFzaC5kaXJFeGlzdHMgc2xhc2gucmVtb3ZlTGluZVBvcyBjbWRcbiAgICAgICAgICAgICAgICBAYnJvd3Nlci5sb2FkSXRlbSBmaWxlOmNtZCwgdHlwZTonZGlyJ1xuICAgICAgICAgICAgICAgIEBjb21tYW5kbGluZS5zZXRUZXh0IGNtZFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgZWxzZSBpZiBzbGFzaC5maWxlRXhpc3RzIHNsYXNoLnJlbW92ZUxpbmVQb3MgY21kXG4gICAgICAgICAgICAgICAgQGNvbW1hbmRsaW5lLnNldFRleHQgY21kXG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG9GaWxlJyBmaWxlOmNtZFxuICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGtlcnJvciAnYnJvd3NlLmV4ZWN1dGUgLS0gdW5oYW5kbGVkJywgY21kXG5cbiAgICBvbkJyb3dzZXJJdGVtQWN0aXZhdGVkOiAoaXRlbSkgPT5cblxuICAgICAgICBpZiBub3QgQGlzQWN0aXZlKClcbiAgICAgICAgICAgIEBjb21tYW5kbGluZS5jb21tYW5kPy5vbkJyb3dzZXJJdGVtQWN0aXZhdGVkPyBpdGVtXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpZiBpdGVtLmZpbGVcbiAgICAgICAgICAgIHB0aCA9IHNsYXNoLnRpbGRlIGl0ZW0uZmlsZVxuICAgICAgICAgICAgaWYgaXRlbS50eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgcHRoICs9ICcvJ1xuICAgICAgICAgICAgICAgIGlmIGl0ZW0ubmFtZSA9PSAnLi4nIGFuZCBAYnJvd3Nlci5hY3RpdmVDb2x1bW4oKT8ucGFyZW50Py5maWxlXG4gICAgICAgICAgICAgICAgICAgICMgc2hvdyBjdXJyZW50IHBhdGggaW5zdGVhZCBvZiB1cGRpciB3aGVuIC4uIGl0ZW0gd2FzIGFjdGl2YXRlZFxuICAgICAgICAgICAgICAgICAgICBwdGggPSBzbGFzaC50aWxkZSBAYnJvd3Nlci5hY3RpdmVDb2x1bW4oKT8ucGFyZW50Py5maWxlXG5cbiAgICAgICAgICAgIEBjb21tYW5kbGluZS5zZXRUZXh0IHB0aFxuXG5tb2R1bGUuZXhwb3J0cyA9IEJyb3dzZVxuIl19
//# sourceURL=../../coffee/commands/browse.coffee