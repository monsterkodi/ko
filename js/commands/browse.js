// koffee 1.3.0

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
        klog('browse.start', action);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3NlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSw0R0FBQTtJQUFBOzs7O0FBUUEsTUFBdUUsT0FBQSxDQUFRLEtBQVIsQ0FBdkUsRUFBRSxlQUFGLEVBQVEsaUJBQVIsRUFBZSxXQUFmLEVBQW1CLGlCQUFuQixFQUEwQixpQkFBMUIsRUFBaUMsaUJBQWpDLEVBQXdDLHlCQUF4QyxFQUFtRCxlQUFuRCxFQUF5RCxtQkFBekQsRUFBaUU7O0FBRWpFLE9BQUEsR0FBYyxPQUFBLENBQVEsd0JBQVI7O0FBQ2QsV0FBQSxHQUFjLE9BQUEsQ0FBUSx3QkFBUjs7QUFDZCxPQUFBLEdBQWMsT0FBQSxDQUFRLGtCQUFSOztBQUVSOzs7SUFFVyxnQkFBQyxXQUFEOzs7Ozs7UUFFVCx3Q0FBTSxXQUFOO1FBRUEsSUFBQyxDQUFBLEtBQUQsR0FBWTtRQUNaLElBQUMsQ0FBQSxPQUFELEdBQVksSUFBSSxXQUFKLENBQWdCLENBQUEsQ0FBRSxTQUFGLENBQWhCO1FBQ1osSUFBQyxDQUFBLFFBQUQsR0FBWSxNQUFNLENBQUMsTUFBUCxDQUFjLElBQWQ7UUFDWixJQUFDLENBQUEsS0FBRCxHQUFZLENBQUMsUUFBRCxFQUFVLFFBQVYsRUFBbUIsT0FBbkI7UUFFWixJQUFJLENBQUMsRUFBTCxDQUFRLE1BQVIsRUFBZSxJQUFDLENBQUEsTUFBaEI7UUFFQSxJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxlQUFaLEVBQTRCLElBQUMsQ0FBQSxzQkFBN0I7UUFFQSxJQUFDLENBQUEsVUFBRCxHQUFjO0lBYkw7O3FCQWViLE1BQUEsR0FBUSxTQUFDLElBQUQ7UUFFSixJQUFHLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBQSxJQUFnQixJQUFDLENBQUEsT0FBRCxDQUFBLENBQUEsS0FBYyxLQUFLLENBQUMsS0FBTixDQUFZLElBQVosQ0FBakM7bUJBQ0ksSUFBQyxDQUFBLE9BQUQs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LEVBQXdCO29CQUFBLElBQUEsRUFBSyxHQUFMO2lCQUF4QjtBQUNBLHVCQUhDO2FBTFQ7O2VBVUEsTUFBQSxDQUFPLDZCQUFQLEVBQXNDLEdBQXRDO0lBbEJLOztxQkFvQlQsc0JBQUEsR0FBd0IsU0FBQyxJQUFEO0FBRXBCLFlBQUE7UUFBQSxJQUFHLENBQUksSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFQOzs7d0JBQ3dCLENBQUUsdUJBQXdCOzs7QUFDOUMsbUJBRko7O1FBSUEsSUFBRyxJQUFJLENBQUMsSUFBUjtZQUNJLEdBQUEsR0FBTSxLQUFLLENBQUMsS0FBTixDQUFZLElBQUksQ0FBQyxJQUFqQjtZQUNOLElBQUcsSUFBSSxDQUFDLElBQUwsS0FBYSxLQUFoQjtnQkFDSSxHQUFBLElBQU87Z0JBQ1AsSUFBRyxJQUFJLENBQUMsSUFBTCxLQUFhLElBQWIsdUZBQXFELENBQUUsdUJBQTFEO29CQUVJLEdBQUEsR0FBTSxLQUFLLENBQUMsS0FBTixtRkFBMkMsQ0FBRSxzQkFBN0MsRUFGVjtpQkFGSjs7bUJBTUEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxPQUFiLENBQXFCLEdBQXJCLEVBUko7O0lBTm9COzs7O0dBalRQOztBQWlVckIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDBcbjAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMFxuMDAwMDAwMCAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwICAgMDAwMDAwMDBcbiMjI1xuXG57IHBvc3QsIHNsYXNoLCBvcywgdmFsaWQsIGVtcHR5LCBjbGFtcCwgc3RvcEV2ZW50LCBrbG9nLCBrZXJyb3IsICQgfSA9IHJlcXVpcmUgJ2t4aydcblxuQ29tbWFuZCAgICAgPSByZXF1aXJlICcuLi9jb21tYW5kbGluZS9jb21tYW5kJ1xuRmlsZUJyb3dzZXIgPSByZXF1aXJlICcuLi9icm93c2VyL2ZpbGVicm93c2VyJ1xuZGlyTGlzdCAgICAgPSByZXF1aXJlICcuLi90b29scy9kaXJsaXN0J1xuXG5jbGFzcyBCcm93c2UgZXh0ZW5kcyBDb21tYW5kXG5cbiAgICBjb25zdHJ1Y3RvcjogKGNvbW1hbmRsaW5lKSAtPlxuXG4gICAgICAgIHN1cGVyIGNvbW1hbmRsaW5lXG5cbiAgICAgICAgQGNtZElEICAgID0gMFxuICAgICAgICBAYnJvd3NlciAgPSBuZXcgRmlsZUJyb3dzZXIgJCAnYnJvd3NlcidcbiAgICAgICAgQGNvbW1hbmRzID0gT2JqZWN0LmNyZWF0ZSBudWxsXG4gICAgICAgIEBuYW1lcyAgICA9IFsnYnJvd3NlJyAnQnJvd3NlJyAnc2hlbGYnXVxuXG4gICAgICAgIHBvc3Qub24gJ2ZpbGUnIEBvbkZpbGVcblxuICAgICAgICBAYnJvd3Nlci5vbiAnaXRlbUFjdGl2YXRlZCcgQG9uQnJvd3Nlckl0ZW1BY3RpdmF0ZWRcblxuICAgICAgICBAc3ludGF4TmFtZSA9ICdicm93c2VyJ1xuXG4gICAgb25GaWxlOiAoZmlsZSkgPT5cblxuICAgICAgICBpZiBAaXNBY3RpdmUoKSBhbmQgQGdldFRleHQoKSAhPSBzbGFzaC50aWxkZSBmaWxlXG4gICAgICAgICAgICBAc2V0VGV4dCBzbGFzaC50aWxkZSBmaWxlXG5cbiAgICBjbGVhcjogLT5cbiAgICAgICAgcmV0dXJuIGlmIEBicm93c2VyLmNsZWFuVXAoKVxuICAgICAgICBzdXBlcigpXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIHN0YXJ0OiAoYWN0aW9uKSAtPlxuXG4gICAgICAgIGtsb2cgJ2Jyb3dzZS5zdGFydCcgYWN0aW9uXG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5zdGFydCgpXG5cbiAgICAgICAgaWYgYWN0aW9uICE9ICdzaGVsZidcbiAgICAgICAgICAgIGlmIHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGU/IGFuZCBzbGFzaC5pc0ZpbGUgd2luZG93LmVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgICAgIEBicm93c2VyLm5hdmlnYXRlVG9GaWxlIHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2ZpbGVicm93c2VyJywgJ2xvYWRJdGVtJywgZmlsZTpwcm9jZXNzLmN3ZCgpLCB0eXBlOidkaXInXG4gICAgICAgICAgICBAYnJvd3Nlci5mb2N1cygpXG5cbiAgICAgICAgbmFtZSA9IGFjdGlvblxuICAgICAgICBuYW1lID0gJ2Jyb3dzZScgaWYgYWN0aW9uID09ICdzaGVsZidcblxuICAgICAgICBzdXBlciBuYW1lXG5cbiAgICAgICAgc2VsZWN0OiB0cnVlXG4gICAgICAgIGRvOiAgICAgQG5hbWUgPT0gJ0Jyb3dzZScgYW5kICdoYWxmIGJyb3dzZXInIG9yICdxdWFydCBicm93c2VyJ1xuICAgICAgICBmb2N1czogIGFjdGlvbiA9PSAnc2hlbGYnIGFuZCAnc2hlbGYnIG9yIG51bGxcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBjb21wbGV0ZUNhbGxiYWNrOiAoZXJyLCBmaWxlcykgPT5cblxuICAgICAgICBpZiBub3QgZXJyP1xuICAgICAgICAgICAgaWYgbm90IGVtcHR5IEBnZXRUZXh0KCkudHJpbSgpXG4gICAgICAgICAgICAgICAgdGV4dCA9IHNsYXNoLnJlc29sdmUgQGdldFRleHQoKS50cmltKClcbiAgICAgICAgICAgICAgICBtYXRjaGVzID0gZmlsZXMuZmlsdGVyIChmKSAtPiBmLmZpbGUuc3RhcnRzV2l0aCB0ZXh0XG5cbiAgICAgICAgICAgICAgICBpZiBub3QgZW1wdHkgbWF0Y2hlc1xuICAgICAgICAgICAgICAgICAgICBAc2V0VGV4dCBzbGFzaC50aWxkZSBtYXRjaGVzWzBdLmZpbGVcblxuICAgICAgICAgICAgICAgIGlmIG1hdGNoZXMubGVuZ3RoID4gMVxuXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zID0gbWF0Y2hlcy5tYXAgKG0pIC0+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBPYmplY3QuY3JlYXRlIG51bGxcblxuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIG0udHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ubGluZSA9ICcgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNsc3MgPSAnZmlsZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ubGluZSA9ICfilrgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY2xzcyA9ICdkaXJlY3RvcnknXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0udGV4dCA9IHNsYXNoLmZpbGUgbS5maWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmZpbGUgPSBtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1cblxuICAgICAgICAgICAgICAgICAgICBAc2hvd0l0ZW1zIGl0ZW1zXG4gICAgICAgICAgICAgICAgICAgIEBzZWxlY3QgMFxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgQGhpZGVMaXN0KClcblxuICAgIGNvbXBsZXRlOiAtPlxuXG4gICAgICAgIHRleHQgPSBAZ2V0VGV4dCgpLnRyaW0oKVxuXG4gICAgICAgIGlmIG5vdCB0ZXh0LmVuZHNXaXRoKCcvJykgYW5kIHNsYXNoLmRpckV4aXN0cyB0ZXh0XG4gICAgICAgICAgICBAc2V0VGV4dCB0ZXh0ICsgJy8nXG4gICAgICAgICAgICBAaGlkZUxpc3QoKVxuICAgICAgICAgICAgdHJ1ZVxuICAgICAgICBlbHNlIGlmIHRleHQuZW5kc1dpdGggJy8nXG4gICAgICAgICAgICBpZiBzbGFzaC5kaXJFeGlzdHMgc2xhc2gucmVzb2x2ZSB0ZXh0XG4gICAgICAgICAgICAgICAgZGlyTGlzdCBzbGFzaC5yZXNvbHZlKHRleHQpLCBAY29tcGxldGVDYWxsYmFja1xuICAgICAgICAgICAgICAgIHRydWVcbiAgICAgICAgZWxzZSBpZiBub3QgZW1wdHkgc2xhc2guZGlyIHRleHRcbiAgICAgICAgICAgIGlmIHNsYXNoLmRpckV4aXN0cyBzbGFzaC5yZXNvbHZlIHNsYXNoLmRpciB0ZXh0XG4gICAgICAgICAgICAgICAgZGlyTGlzdCBzbGFzaC5yZXNvbHZlKHNsYXNoLmRpcih0ZXh0KSksIEBjb21wbGV0ZUNhbGxiYWNrXG4gICAgICAgICAgICAgICAgdHJ1ZVxuXG4gICAgb25UYWJDb21wbGV0aW9uOiAtPlxuXG4gICAgICAgIEBjb21wbGV0ZSgpXG4gICAgICAgIHRydWVcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBjb21tb25QcmVmaXg6IChzdHJBLHN0ckIpIC0+XG5cbiAgICAgICAgcHJlZml4ID0gJydcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5NYXRoLm1pbihzdHJBLmxlbmd0aCwgc3RyQi5sZW5ndGgpXVxuICAgICAgICAgICAgYnJlYWsgaWYgc3RyQVtpXSAhPSBzdHJCW2ldXG4gICAgICAgICAgICBwcmVmaXggKz0gc3RyQVtpXVxuICAgICAgICBwcmVmaXhcblxuICAgIGNsZWFyQnJva2VuUGFydEZvckZpbGVzOiAoZmlsZXMpIC0+XG5cbiAgICAgICAgYnJva2VuUGF0aCA9IHNsYXNoLnJlc29sdmUgQGdldFRleHQoKVxuICAgICAgICBsb25nZXN0TWF0Y2ggPSAnJ1xuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlc1xuICAgICAgICAgICAgZmlsZSA9IGZpbGUuZmlsZVxuICAgICAgICAgICAgcHJlZml4ID0gQGNvbW1vblByZWZpeCBmaWxlLCBicm9rZW5QYXRoXG4gICAgICAgICAgICBpZiBwcmVmaXgubGVuZ3RoID4gbG9uZ2VzdE1hdGNoLmxlbmd0aFxuICAgICAgICAgICAgICAgIGxvbmdlc3RNYXRjaCA9IHByZWZpeFxuICAgICAgICBsID0gQGdldFRleHQoKS5sZW5ndGhcblxuICAgICAgICBpZiBub3QgZW1wdHkgbG9uZ2VzdE1hdGNoXG4gICAgICAgICAgICBAc2V0VGV4dCBzbGFzaC50aWxkZSBsb25nZXN0TWF0Y2hcbiAgICAgICAgICAgIEBjb21wbGV0ZSgpXG5cbiAgICBjaGFuZ2VkQ2FsbGJhY2s6IChlcnIsIGZpbGVzKSA9PlxuXG4gICAgICAgIGlmIG5vdCBlcnI/XG5cbiAgICAgICAgICAgIGlmIGVtcHR5IEBnZXRUZXh0KCkudHJpbSgpXG4gICAgICAgICAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICAgcGF0aCA9IHNsYXNoLnJlc29sdmUgQGdldFRleHQoKS50cmltKClcbiAgICAgICAgICAgIG1hdGNoZXMgPSBmaWxlcy5maWx0ZXIgKGYpIC0+IGYuZmlsZS5zdGFydHNXaXRoIHBhdGhcblxuICAgICAgICAgICAgaWYgZW1wdHkgbWF0Y2hlc1xuICAgICAgICAgICAgICAgIEBjbGVhckJyb2tlblBhcnRGb3JGaWxlcyBmaWxlc1xuICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICBzID0gc2xhc2gudGlsZGUocGF0aCkubGVuZ3RoXG5cbiAgICAgICAgICAgIHRleHQgPSBzbGFzaC50aWxkZSBzbGFzaC50aWxkZSBtYXRjaGVzWzBdLmZpbGVcbiAgICAgICAgICAgIEBzZXRUZXh0IHRleHRcblxuICAgICAgICAgICAgbCA9IHRleHQubGVuZ3RoXG5cbiAgICAgICAgICAgIEBjb21tYW5kbGluZS5zZWxlY3RTaW5nbGVSYW5nZSBbMCwgW3MsbF1dLCBiZWZvcmU6IHRydWVcblxuICAgICAgICAgICAgaWYgbWF0Y2hlcy5sZW5ndGggPCAyXG4gICAgICAgICAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgICAgIGVsc2VcblxuICAgICAgICAgICAgICAgIGl0ZW1zID0gbWF0Y2hlcy5tYXAgKG0pIC0+XG5cbiAgICAgICAgICAgICAgICAgICAgaXRlbSA9IE9iamVjdC5jcmVhdGUgbnVsbFxuXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCBtLnR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gJyAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jbHNzID0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gJ+KWuCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNsc3MgPSAnZGlyZWN0b3J5J1xuXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0udGV4dCA9IHNsYXNoLmZpbGUgbS5maWxlXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZmlsZSA9IG0uZmlsZVxuICAgICAgICAgICAgICAgICAgICBpdGVtXG5cbiAgICAgICAgICAgICAgICBAc2hvd0l0ZW1zIGl0ZW1zXG5cbiAgICBjaGFuZ2VkOiAoY29tbWFuZCkgLT5cblxuICAgICAgICB0ZXh0ID0gQGdldFRleHQoKS50cmltKClcbiAgICAgICAgaWYgbm90IHRleHQuZW5kc1dpdGggJy8nXG4gICAgICAgICAgICBAd2Fsa2VyPy5lbmQoKVxuICAgICAgICAgICAgQHdhbGtlciA9IGRpckxpc3Qgc2xhc2gucmVzb2x2ZShzbGFzaC5kaXIodGV4dCkpLCBAY2hhbmdlZENhbGxiYWNrXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBoaWRlTGlzdCgpXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0V2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBldmVudCkgLT5cblxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2JhY2tzcGFjZSdcbiAgICAgICAgICAgICAgICBpZiBjb21tYW5kbGluZS5tYWluQ3Vyc29yKClbMF0gPT0gY29tbWFuZGxpbmUuc2VsZWN0aW9uKDApP1sxXVswXSAjIGN1cnNvciBpcyBhdCBzZWxlY3Rpb24gc3RhcnRcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZGxpbmUuZG8uc3RhcnQoKSAgICAgICAgICMgZm9yY2Ugc2ltdWx0YW5lb3VzXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRsaW5lLmRlbGV0ZVNlbGVjdGlvbigpICAjIGRlbGV0aW9uIG9mIHNlbGVjdGlvblxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kbGluZS5kZWxldGVCYWNrd2FyZCgpICAgIyBhbmQgYmFja3NwYWNlLlxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kbGluZS5kby5lbmQoKSAgICAgICAgICAgIyBpdCBzaG91bGQgZmVlbCBhcyBpZiBzZWxlY3Rpb24gd2Fzbid0IHRoZXJlLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJ1xuICAgICAgICAgICAgICAgIEBleGVjdXRlIEBnZXRUZXh0KClcbiAgICAgICAgICAgICAgICBmb2N1c0Jyb3dzZXIgPSA9PiBAYnJvd3Nlci5mb2N1cygpXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCBmb2N1c0Jyb3dzZXIsIDEwMFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAndW5oYW5kbGVkJ1xuXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsaXN0Q2xpY2s6IChpbmRleCkgPT5cblxuICAgICAgICBmaWxlID0gQGNvbW1hbmRMaXN0Lml0ZW1zW2luZGV4XT8uZmlsZVxuICAgICAgICBmaWxlID0gc2xhc2gudGlsZGUgZmlsZSBpZiBmaWxlP1xuICAgICAgICBmaWxlID89IEBjb21tYW5kTGlzdC5saW5lIGluZGV4XG4gICAgICAgIEBzZWxlY3RlZCA9IGluZGV4XG4gICAgICAgIEBleGVjdXRlIGZpbGVcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMFxuXG4gICAgc2VsZWN0OiAoaSkgLT5cblxuICAgICAgICBAc2VsZWN0ZWQgPSBjbGFtcCAtMSwgQGNvbW1hbmRMaXN0Py5udW1MaW5lcygpLTEsIGlcblxuICAgICAgICBpZiBAc2VsZWN0ZWQgPCAwXG4gICAgICAgICAgICBAaGlkZUxpc3QoKVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgQGNvbW1hbmRMaXN0Py5zZWxlY3RTaW5nbGVSYW5nZSBAY29tbWFuZExpc3QucmFuZ2VGb3JMaW5lQXRJbmRleCBAc2VsZWN0ZWRcbiAgICAgICAgQGNvbW1hbmRMaXN0Py5kby5jdXJzb3JzIFtbMCwgQHNlbGVjdGVkXV1cblxuICAgICAgICB0ZXh0ID0gc2xhc2gudGlsZGUgQGNvbW1hbmRMaXN0Lml0ZW1zW0BzZWxlY3RlZF0uZmlsZVxuICAgICAgICBAc2V0VGV4dCB0ZXh0XG4gICAgICAgIHMgPSBzbGFzaC5maWxlKHRleHQpLmxlbmd0aFxuICAgICAgICBsID0gdGV4dC5sZW5ndGhcbiAgICAgICAgQGNvbW1hbmRsaW5lLnNlbGVjdFNpbmdsZVJhbmdlIFswLCBbbC1zLGxdXVxuXG4gICAgc2VsZWN0TGlzdEl0ZW06IChkaXIpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY29tbWFuZExpc3Q/XG5cbiAgICAgICAgc3dpdGNoIGRpclxuICAgICAgICAgICAgd2hlbiAndXAnICAgdGhlbiBAc2VsZWN0IEBzZWxlY3RlZC0xXG4gICAgICAgICAgICB3aGVuICdkb3duJyB0aGVuIEBzZWxlY3QgQHNlbGVjdGVkKzFcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGNhbmNlbDogLT5cblxuICAgICAgICBAaGlkZUxpc3QoKVxuICAgICAgICBmb2N1czogQHJlY2VpdmVyXG4gICAgICAgIHNob3c6ICdlZGl0b3InXG5cbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIGV4ZWN1dGU6IChjb21tYW5kKSAtPlxuXG4gICAgICAgIHJldHVybiBrZXJyb3IgXCJubyBjb21tYW5kP1wiIGlmIG5vdCBjb21tYW5kP1xuXG4gICAgICAgIEBoaWRlTGlzdCgpXG5cbiAgICAgICAgQGNtZElEICs9IDFcbiAgICAgICAgY21kID0gY29tbWFuZC50cmltKClcbiAgICAgICAgaWYgY21kLmxlbmd0aFxuICAgICAgICAgICAgaWYgc2xhc2guZGlyRXhpc3RzIHNsYXNoLnJlbW92ZUxpbmVQb3MgY21kXG4gICAgICAgICAgICAgICAgQGJyb3dzZXIubG9hZEl0ZW0gZmlsZTpjbWQsIHR5cGU6J2RpcidcbiAgICAgICAgICAgICAgICBAY29tbWFuZGxpbmUuc2V0VGV4dCBjbWRcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIGVsc2UgaWYgc2xhc2guZmlsZUV4aXN0cyBzbGFzaC5yZW1vdmVMaW5lUG9zIGNtZFxuICAgICAgICAgICAgICAgIEBjb21tYW5kbGluZS5zZXRUZXh0IGNtZFxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvRmlsZScsIGZpbGU6Y21kXG4gICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAga2Vycm9yICdicm93c2UuZXhlY3V0ZSAtLSB1bmhhbmRsZWQnLCBjbWRcblxuICAgIG9uQnJvd3Nlckl0ZW1BY3RpdmF0ZWQ6IChpdGVtKSA9PlxuXG4gICAgICAgIGlmIG5vdCBAaXNBY3RpdmUoKVxuICAgICAgICAgICAgQGNvbW1hbmRsaW5lLmNvbW1hbmQ/Lm9uQnJvd3Nlckl0ZW1BY3RpdmF0ZWQ/IGl0ZW1cbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIGl0ZW0uZmlsZVxuICAgICAgICAgICAgcHRoID0gc2xhc2gudGlsZGUgaXRlbS5maWxlXG4gICAgICAgICAgICBpZiBpdGVtLnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICBwdGggKz0gJy8nXG4gICAgICAgICAgICAgICAgaWYgaXRlbS5uYW1lID09ICcuLicgYW5kIEBicm93c2VyLmFjdGl2ZUNvbHVtbigpPy5wYXJlbnQ/LmZpbGVcbiAgICAgICAgICAgICAgICAgICAgIyBzaG93IGN1cnJlbnQgcGF0aCBpbnN0ZWFkIG9mIHVwZGlyIHdoZW4gLi4gaXRlbSB3YXMgYWN0aXZhdGVkXG4gICAgICAgICAgICAgICAgICAgIHB0aCA9IHNsYXNoLnRpbGRlIEBicm93c2VyLmFjdGl2ZUNvbHVtbigpPy5wYXJlbnQ/LmZpbGVcblxuICAgICAgICAgICAgQGNvbW1hbmRsaW5lLnNldFRleHQgcHRoXG5cbm1vZHVsZS5leHBvcnRzID0gQnJvd3NlXG4iXX0=
//# sourceURL=../../coffee/commands/browse.coffee