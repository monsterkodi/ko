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
        var ref1;
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
                setTimeout(this.browser.focus, 100);
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
        klog('onBrowserItemActivated', item);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3NlLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9jb21tYW5kcyIsInNvdXJjZXMiOlsiYnJvd3NlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSw2RUFBQTtJQUFBOzs7O0FBUUEsTUFBaUQsT0FBQSxDQUFRLEtBQVIsQ0FBakQsRUFBRSxTQUFGLEVBQUssaUJBQUwsRUFBWSxpQkFBWixFQUFtQixtQkFBbkIsRUFBMkIsZUFBM0IsRUFBaUMsZUFBakMsRUFBdUM7O0FBRXZDLE9BQUEsR0FBYyxPQUFBLENBQVEsd0JBQVI7O0FBQ2QsV0FBQSxHQUFjLE9BQUEsQ0FBUSx3QkFBUjs7QUFFUjs7O0lBRUMsZ0JBQUMsV0FBRDs7Ozs7O1FBRUMsd0NBQU0sV0FBTjtRQUVBLElBQUMsQ0FBQSxLQUFELEdBQVk7UUFDWixJQUFDLENBQUEsT0FBRCxHQUFZLElBQUksV0FBSixDQUFnQixDQUFBLENBQUUsU0FBRixDQUFoQjtRQUNaLElBQUMsQ0FBQSxRQUFELEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYyxJQUFkO1FBQ1osSUFBQyxDQUFBLEtBQUQsR0FBWSxDQUFDLFFBQUQsRUFBVSxRQUFWLEVBQW1CLE9BQW5CO1FBRVosSUFBSSxDQUFDLEVBQUwsQ0FBUSxNQUFSLEVBQWUsSUFBQyxDQUFBLE1BQWhCO1FBRUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksZUFBWixFQUE0QixJQUFDLENBQUEsc0JBQTdCO1FBRUEsSUFBQyxDQUFBLFVBQUQsR0FBYztJQWJmOztxQkFlSCxNQUFBLEdBQVEsU0FBQyxJQUFEO1FBRUosSUFBRyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQUEsSUFBZ0IsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFBLEtBQWMsS0FBSyxDQUFDLEtBQU4sQ0FBWSxJQUFaLENBQWpDO21CQUNJLElBQUMsQ0FBQSxPQUFELENBQVMsS0FBSyxDQUFDLEtBQU4sQ0FBWSxJQUFaLENBQVQsRUFE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QXdCLFNBQUMsSUFBRDtBQUVwQixZQUFBO1FBQUEsSUFBQSxDQUFLLHdCQUFMLEVBQThCLElBQTlCO1FBRUEsSUFBRyxDQUFJLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBUDs7O3dCQUN3QixDQUFFLHVCQUF3Qjs7O0FBQzlDLG1CQUZKOztRQUlBLElBQUcsSUFBSSxDQUFDLElBQVI7WUFDSSxHQUFBLEdBQU0sS0FBSyxDQUFDLEtBQU4sQ0FBWSxJQUFJLENBQUMsSUFBakI7WUFDTixJQUFHLElBQUksQ0FBQyxJQUFMLEtBQWEsS0FBaEI7Z0JBQ0ksR0FBQSxJQUFPO2dCQUNQLElBQUcsSUFBSSxDQUFDLElBQUwsS0FBYSxJQUFiLHVGQUFxRCxDQUFFLHVCQUExRDtvQkFFSSxHQUFBLEdBQU0sS0FBSyxDQUFDLEtBQU4sbUZBQTJDLENBQUUsc0JBQTdDLEVBRlY7aUJBRko7O21CQU1BLElBQUMsQ0FBQSxXQUFXLENBQUMsT0FBYixDQUFxQixHQUFyQixFQVJKOztJQVJvQjs7OztHQWhUUDs7QUFrVXJCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwXG4wMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbjAwMDAwMDAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwXG4jIyNcblxueyAkLCBjbGFtcCwgZW1wdHksIGtlcnJvciwga2xvZywgcG9zdCwgc2xhc2ggfSA9IHJlcXVpcmUgJ2t4aydcblxuQ29tbWFuZCAgICAgPSByZXF1aXJlICcuLi9jb21tYW5kbGluZS9jb21tYW5kJ1xuRmlsZUJyb3dzZXIgPSByZXF1aXJlICcuLi9icm93c2VyL2ZpbGVicm93c2VyJ1xuXG5jbGFzcyBCcm93c2UgZXh0ZW5kcyBDb21tYW5kXG5cbiAgICBAOiAoY29tbWFuZGxpbmUpIC0+XG5cbiAgICAgICAgc3VwZXIgY29tbWFuZGxpbmVcblxuICAgICAgICBAY21kSUQgICAgPSAwXG4gICAgICAgIEBicm93c2VyICA9IG5ldyBGaWxlQnJvd3NlciAkICdicm93c2VyJ1xuICAgICAgICBAY29tbWFuZHMgPSBPYmplY3QuY3JlYXRlIG51bGxcbiAgICAgICAgQG5hbWVzICAgID0gWydicm93c2UnICdCcm93c2UnICdzaGVsZiddXG5cbiAgICAgICAgcG9zdC5vbiAnZmlsZScgQG9uRmlsZVxuXG4gICAgICAgIEBicm93c2VyLm9uICdpdGVtQWN0aXZhdGVkJyBAb25Ccm93c2VySXRlbUFjdGl2YXRlZFxuXG4gICAgICAgIEBzeW50YXhOYW1lID0gJ2Jyb3dzZXInXG5cbiAgICBvbkZpbGU6IChmaWxlKSA9PlxuXG4gICAgICAgIGlmIEBpc0FjdGl2ZSgpIGFuZCBAZ2V0VGV4dCgpICE9IHNsYXNoLnRpbGRlIGZpbGVcbiAgICAgICAgICAgIEBzZXRUZXh0IHNsYXNoLnRpbGRlIGZpbGVcblxuICAgIGNsZWFyOiAtPlxuICAgICAgICByZXR1cm4gaWYgQGJyb3dzZXIuY2xlYW5VcCgpXG4gICAgICAgIHN1cGVyKClcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgIDAwMFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAgc3RhcnQ6IChhY3Rpb24pIC0+XG5cbiAgICAgICAga2xvZyAnYnJvd3NlLnN0YXJ0JyBhY3Rpb25cbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLnN0YXJ0KClcblxuICAgICAgICBpZiBhY3Rpb24gIT0gJ3NoZWxmJ1xuICAgICAgICAgICAgaWYgd2luZG93LmVkaXRvci5jdXJyZW50RmlsZT8gYW5kIHNsYXNoLmlzRmlsZSB3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICAgICAgICAgQGJyb3dzZXIubmF2aWdhdGVUb0ZpbGUgd2luZG93LmVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnZmlsZWJyb3dzZXInICdsb2FkSXRlbScgZmlsZTpwcm9jZXNzLmN3ZCgpLCB0eXBlOidkaXInXG4gICAgICAgICAgICBAYnJvd3Nlci5mb2N1cyBmb3JjZTp0cnVlXG5cbiAgICAgICAgbmFtZSA9IGFjdGlvblxuICAgICAgICBuYW1lID0gJ2Jyb3dzZScgaWYgYWN0aW9uID09ICdzaGVsZidcblxuICAgICAgICBzdXBlciBuYW1lXG5cbiAgICAgICAgc2VsZWN0OiB0cnVlXG4gICAgICAgIGRvOiAgICAgQG5hbWUgPT0gJ0Jyb3dzZScgYW5kICdoYWxmIGJyb3dzZXInIG9yICdxdWFydCBicm93c2VyJ1xuICAgICAgICBmb2N1czogIGFjdGlvbiA9PSAnc2hlbGYnIGFuZCAnc2hlbGYnIG9yIG51bGxcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBjb21wbGV0ZUNhbGxiYWNrOiAoZmlsZXMpID0+XG5cbiAgICAgICAgaWYgbm90IGVtcHR5IEBnZXRUZXh0KCkudHJpbSgpXG4gICAgICAgICAgICB0ZXh0ID0gc2xhc2gucmVzb2x2ZSBAZ2V0VGV4dCgpLnRyaW0oKVxuICAgICAgICAgICAgbWF0Y2hlcyA9IGZpbGVzLmZpbHRlciAoZikgLT4gZi5maWxlLnN0YXJ0c1dpdGggdGV4dFxuXG4gICAgICAgICAgICBpZiBub3QgZW1wdHkgbWF0Y2hlc1xuICAgICAgICAgICAgICAgIEBzZXRUZXh0IHNsYXNoLnRpbGRlIG1hdGNoZXNbMF0uZmlsZVxuXG4gICAgICAgICAgICBpZiBtYXRjaGVzLmxlbmd0aCA+IDFcblxuICAgICAgICAgICAgICAgIGl0ZW1zID0gbWF0Y2hlcy5tYXAgKG0pIC0+XG5cbiAgICAgICAgICAgICAgICAgICAgaXRlbSA9IE9iamVjdC5jcmVhdGUgbnVsbFxuXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCBtLnR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gJyAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jbHNzID0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gJ+KWuCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNsc3MgPSAnZGlyZWN0b3J5J1xuXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0udGV4dCA9IHNsYXNoLmZpbGUgbS5maWxlXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZmlsZSA9IG0uZmlsZVxuICAgICAgICAgICAgICAgICAgICBpdGVtXG5cbiAgICAgICAgICAgICAgICBAc2hvd0l0ZW1zIGl0ZW1zXG4gICAgICAgICAgICAgICAgQHNlbGVjdCAwXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIEBoaWRlTGlzdCgpXG5cbiAgICBjb21wbGV0ZTogLT5cblxuICAgICAgICB0ZXh0ID0gQGdldFRleHQoKS50cmltKClcblxuICAgICAgICBpZiBub3QgdGV4dC5lbmRzV2l0aCgnLycpIGFuZCBzbGFzaC5kaXJFeGlzdHMgdGV4dFxuICAgICAgICAgICAgQHNldFRleHQgdGV4dCArICcvJ1xuICAgICAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgICAgIHRydWVcbiAgICAgICAgZWxzZSBpZiB0ZXh0LmVuZHNXaXRoICcvJ1xuICAgICAgICAgICAgaWYgc2xhc2guZGlyRXhpc3RzIHNsYXNoLnJlc29sdmUgdGV4dFxuICAgICAgICAgICAgICAgIHNsYXNoLmxpc3Qgc2xhc2gucmVzb2x2ZSh0ZXh0KSwgQGNvbXBsZXRlQ2FsbGJhY2tcbiAgICAgICAgICAgICAgICB0cnVlXG4gICAgICAgIGVsc2UgaWYgbm90IGVtcHR5IHNsYXNoLmRpciB0ZXh0XG4gICAgICAgICAgICBpZiBzbGFzaC5kaXJFeGlzdHMgc2xhc2gucmVzb2x2ZSBzbGFzaC5kaXIgdGV4dFxuICAgICAgICAgICAgICAgIHNsYXNoLmxpc3Qgc2xhc2gucmVzb2x2ZShzbGFzaC5kaXIodGV4dCkpLCBAY29tcGxldGVDYWxsYmFja1xuICAgICAgICAgICAgICAgIHRydWVcblxuICAgIG9uVGFiQ29tcGxldGlvbjogLT5cblxuICAgICAgICBAY29tcGxldGUoKVxuICAgICAgICB0cnVlXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgY29tbW9uUHJlZml4OiAoc3RyQSxzdHJCKSAtPlxuXG4gICAgICAgIHByZWZpeCA9ICcnXG4gICAgICAgIGZvciBpIGluIFswLi4uTWF0aC5taW4oc3RyQS5sZW5ndGgsIHN0ckIubGVuZ3RoKV1cbiAgICAgICAgICAgIGJyZWFrIGlmIHN0ckFbaV0gIT0gc3RyQltpXVxuICAgICAgICAgICAgcHJlZml4ICs9IHN0ckFbaV1cbiAgICAgICAgcHJlZml4XG5cbiAgICBjbGVhckJyb2tlblBhcnRGb3JGaWxlczogKGZpbGVzKSAtPlxuXG4gICAgICAgIGJyb2tlblBhdGggPSBzbGFzaC5yZXNvbHZlIEBnZXRUZXh0KClcbiAgICAgICAgbG9uZ2VzdE1hdGNoID0gJydcbiAgICAgICAgZm9yIGZpbGUgaW4gZmlsZXNcbiAgICAgICAgICAgIGZpbGUgPSBmaWxlLmZpbGVcbiAgICAgICAgICAgIHByZWZpeCA9IEBjb21tb25QcmVmaXggZmlsZSwgYnJva2VuUGF0aFxuICAgICAgICAgICAgaWYgcHJlZml4Lmxlbmd0aCA+IGxvbmdlc3RNYXRjaC5sZW5ndGhcbiAgICAgICAgICAgICAgICBsb25nZXN0TWF0Y2ggPSBwcmVmaXhcbiAgICAgICAgbCA9IEBnZXRUZXh0KCkubGVuZ3RoXG5cbiAgICAgICAgaWYgbm90IGVtcHR5IGxvbmdlc3RNYXRjaFxuICAgICAgICAgICAgQHNldFRleHQgc2xhc2gudGlsZGUgbG9uZ2VzdE1hdGNoXG4gICAgICAgICAgICBAY29tcGxldGUoKVxuXG4gICAgY2hhbmdlZENhbGxiYWNrOiAoZmlsZXMpID0+XG5cbiAgICAgICAgaWYgZW1wdHkgQGdldFRleHQoKS50cmltKClcbiAgICAgICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBwYXRoID0gc2xhc2gucmVzb2x2ZSBAZ2V0VGV4dCgpLnRyaW0oKVxuICAgICAgICBtYXRjaGVzID0gZmlsZXMuZmlsdGVyIChmKSAtPiBmLmZpbGUuc3RhcnRzV2l0aCBwYXRoXG5cbiAgICAgICAgaWYgZW1wdHkgbWF0Y2hlc1xuICAgICAgICAgICAgQGNsZWFyQnJva2VuUGFydEZvckZpbGVzIGZpbGVzXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBzID0gc2xhc2gudGlsZGUocGF0aCkubGVuZ3RoXG5cbiAgICAgICAgdGV4dCA9IHNsYXNoLnRpbGRlIHNsYXNoLnRpbGRlIG1hdGNoZXNbMF0uZmlsZVxuICAgICAgICBAc2V0VGV4dCB0ZXh0XG5cbiAgICAgICAgbCA9IHRleHQubGVuZ3RoXG5cbiAgICAgICAgQGNvbW1hbmRsaW5lLnNlbGVjdFNpbmdsZVJhbmdlIFswLCBbcyxsXV0sIGJlZm9yZTogdHJ1ZVxuXG4gICAgICAgIGlmIG1hdGNoZXMubGVuZ3RoIDwgMlxuICAgICAgICAgICAgQGhpZGVMaXN0KClcbiAgICAgICAgZWxzZVxuXG4gICAgICAgICAgICBpdGVtcyA9IG1hdGNoZXMubWFwIChtKSAtPlxuXG4gICAgICAgICAgICAgICAgaXRlbSA9IE9iamVjdC5jcmVhdGUgbnVsbFxuXG4gICAgICAgICAgICAgICAgc3dpdGNoIG0udHlwZVxuICAgICAgICAgICAgICAgICAgICB3aGVuICdmaWxlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gJyAnXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNsc3MgPSAnZmlsZSdcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gJ+KWuCdcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY2xzcyA9ICdkaXJlY3RvcnknXG5cbiAgICAgICAgICAgICAgICBpdGVtLnRleHQgPSBzbGFzaC5maWxlIG0uZmlsZVxuICAgICAgICAgICAgICAgIGl0ZW0uZmlsZSA9IG0uZmlsZVxuICAgICAgICAgICAgICAgIGl0ZW1cblxuICAgICAgICAgICAgQHNob3dJdGVtcyBpdGVtc1xuXG4gICAgY2hhbmdlZDogKGNvbW1hbmQpIC0+XG5cbiAgICAgICAga2xvZyAnYnJvd3NlLmNoYW5nZWQnIGNvbW1hbmRcbiAgICAgICAgdGV4dCA9IEBnZXRUZXh0KCkudHJpbSgpXG4gICAgICAgIGlmIG5vdCB0ZXh0LmVuZHNXaXRoICcvJ1xuICAgICAgICAgICAgQHdhbGtlcj8uZW5kKClcbiAgICAgICAgICAgIEB3YWxrZXIgPSBzbGFzaC5saXN0IHNsYXNoLnJlc29sdmUoc2xhc2guZGlyKHRleHQpKSwgQGNoYW5nZWRDYWxsYmFja1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaGlkZUxpc3QoKVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMFxuXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9FdmVudDogKG1vZCwga2V5LCBjb21ibywgZXZlbnQpIC0+XG5cbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdiYWNrc3BhY2UnXG4gICAgICAgICAgICAgICAgaWYgY29tbWFuZGxpbmUubWFpbkN1cnNvcigpWzBdID09IGNvbW1hbmRsaW5lLnNlbGVjdGlvbigwKT9bMV1bMF0gIyBjdXJzb3IgaXMgYXQgc2VsZWN0aW9uIHN0YXJ0XG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRsaW5lLmRvLnN0YXJ0KCkgICAgICAgICAjIGZvcmNlIHNpbXVsdGFuZW91c1xuICAgICAgICAgICAgICAgICAgICBjb21tYW5kbGluZS5kZWxldGVTZWxlY3Rpb24oKSAgIyBkZWxldGlvbiBvZiBzZWxlY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZGxpbmUuZGVsZXRlQmFja3dhcmQoKSAgICMgYW5kIGJhY2tzcGFjZS5cbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZGxpbmUuZG8uZW5kKCkgICAgICAgICAgICMgaXQgc2hvdWxkIGZlZWwgYXMgaWYgc2VsZWN0aW9uIHdhc24ndCB0aGVyZS5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB3aGVuICdlbnRlcidcbiAgICAgICAgICAgICAgICBAZXhlY3V0ZSBAZ2V0VGV4dCgpXG4gICAgICAgICAgICAgICAgIyBmb2N1c0Jyb3dzZXIgPSA9PiBAYnJvd3Nlci5mb2N1cygpXG4gICAgICAgICAgICAgICAgIyBzZXRUaW1lb3V0IGZvY3VzQnJvd3NlciwgMTAwXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCBAYnJvd3Nlci5mb2N1cywgMTAwXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICd1bmhhbmRsZWQnXG5cbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGxpc3RDbGljazogKGluZGV4KSA9PlxuXG4gICAgICAgIGZpbGUgPSBAY29tbWFuZExpc3QuaXRlbXNbaW5kZXhdPy5maWxlXG4gICAgICAgIGZpbGUgPSBzbGFzaC50aWxkZSBmaWxlIGlmIGZpbGU/XG4gICAgICAgIGZpbGUgPz0gQGNvbW1hbmRMaXN0LmxpbmUgaW5kZXhcbiAgICAgICAgQHNlbGVjdGVkID0gaW5kZXhcbiAgICAgICAgQGV4ZWN1dGUgZmlsZVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwXG5cbiAgICBzZWxlY3Q6IChpKSAtPlxuXG4gICAgICAgIEBzZWxlY3RlZCA9IGNsYW1wIC0xLCBAY29tbWFuZExpc3Q/Lm51bUxpbmVzKCktMSwgaVxuXG4gICAgICAgIGlmIEBzZWxlY3RlZCA8IDBcbiAgICAgICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBAY29tbWFuZExpc3Q/LnNlbGVjdFNpbmdsZVJhbmdlIEBjb21tYW5kTGlzdC5yYW5nZUZvckxpbmVBdEluZGV4IEBzZWxlY3RlZFxuICAgICAgICBAY29tbWFuZExpc3Q/LmRvLmN1cnNvcnMgW1swLCBAc2VsZWN0ZWRdXVxuXG4gICAgICAgIHRleHQgPSBzbGFzaC50aWxkZSBAY29tbWFuZExpc3QuaXRlbXNbQHNlbGVjdGVkXS5maWxlXG4gICAgICAgIEBzZXRUZXh0IHRleHRcbiAgICAgICAgcyA9IHNsYXNoLmZpbGUodGV4dCkubGVuZ3RoXG4gICAgICAgIGwgPSB0ZXh0Lmxlbmd0aFxuICAgICAgICBAY29tbWFuZGxpbmUuc2VsZWN0U2luZ2xlUmFuZ2UgWzAsIFtsLXMsbF1dXG5cbiAgICBzZWxlY3RMaXN0SXRlbTogKGRpcikgLT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IEBjb21tYW5kTGlzdD9cblxuICAgICAgICBzd2l0Y2ggZGlyXG4gICAgICAgICAgICB3aGVuICd1cCcgICB0aGVuIEBzZWxlY3QgQHNlbGVjdGVkLTFcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nIHRoZW4gQHNlbGVjdCBAc2VsZWN0ZWQrMVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgY2FuY2VsOiAtPlxuXG4gICAgICAgIEBoaWRlTGlzdCgpXG4gICAgICAgIGZvY3VzOiBAcmVjZWl2ZXJcbiAgICAgICAgc2hvdzogJ2VkaXRvcidcblxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgZXhlY3V0ZTogKGNvbW1hbmQpIC0+XG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciBcIm5vIGNvbW1hbmQ/XCIgaWYgbm90IGNvbW1hbmQ/XG5cbiAgICAgICAgQGhpZGVMaXN0KClcblxuICAgICAgICBAY21kSUQgKz0gMVxuICAgICAgICBjbWQgPSBjb21tYW5kLnRyaW0oKVxuICAgICAgICBpZiBjbWQubGVuZ3RoXG4gICAgICAgICAgICBpZiBzbGFzaC5kaXJFeGlzdHMgc2xhc2gucmVtb3ZlTGluZVBvcyBjbWRcbiAgICAgICAgICAgICAgICBAYnJvd3Nlci5sb2FkSXRlbSBmaWxlOmNtZCwgdHlwZTonZGlyJ1xuICAgICAgICAgICAgICAgIEBjb21tYW5kbGluZS5zZXRUZXh0IGNtZFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgZWxzZSBpZiBzbGFzaC5maWxlRXhpc3RzIHNsYXNoLnJlbW92ZUxpbmVQb3MgY21kXG4gICAgICAgICAgICAgICAgQGNvbW1hbmRsaW5lLnNldFRleHQgY21kXG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG9GaWxlJyBmaWxlOmNtZFxuICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGtlcnJvciAnYnJvd3NlLmV4ZWN1dGUgLS0gdW5oYW5kbGVkJywgY21kXG5cbiAgICBvbkJyb3dzZXJJdGVtQWN0aXZhdGVkOiAoaXRlbSkgPT5cblxuICAgICAgICBrbG9nICdvbkJyb3dzZXJJdGVtQWN0aXZhdGVkJyBpdGVtXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQGlzQWN0aXZlKClcbiAgICAgICAgICAgIEBjb21tYW5kbGluZS5jb21tYW5kPy5vbkJyb3dzZXJJdGVtQWN0aXZhdGVkPyBpdGVtXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpZiBpdGVtLmZpbGVcbiAgICAgICAgICAgIHB0aCA9IHNsYXNoLnRpbGRlIGl0ZW0uZmlsZVxuICAgICAgICAgICAgaWYgaXRlbS50eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgcHRoICs9ICcvJ1xuICAgICAgICAgICAgICAgIGlmIGl0ZW0ubmFtZSA9PSAnLi4nIGFuZCBAYnJvd3Nlci5hY3RpdmVDb2x1bW4oKT8ucGFyZW50Py5maWxlXG4gICAgICAgICAgICAgICAgICAgICMgc2hvdyBjdXJyZW50IHBhdGggaW5zdGVhZCBvZiB1cGRpciB3aGVuIC4uIGl0ZW0gd2FzIGFjdGl2YXRlZFxuICAgICAgICAgICAgICAgICAgICBwdGggPSBzbGFzaC50aWxkZSBAYnJvd3Nlci5hY3RpdmVDb2x1bW4oKT8ucGFyZW50Py5maWxlXG5cbiAgICAgICAgICAgIEBjb21tYW5kbGluZS5zZXRUZXh0IHB0aFxuXG5tb2R1bGUuZXhwb3J0cyA9IEJyb3dzZVxuIl19
//# sourceURL=../../coffee/commands/browse.coffee