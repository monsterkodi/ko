// koffee 1.14.0

/*
 0000000   00000000   00000000  000   000
000   000  000   000  000       0000  000
000   000  00000000   0000000   000 0 000
000   000  000        000       000  0000
 0000000   000        00000000  000   000
 */
var Command, File, Open, Projects, _, empty, fuzzy, klog, post, ref, relative, render, slash, syntax, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), _ = ref._, empty = ref.empty, klog = ref.klog, post = ref.post, slash = ref.slash, valid = ref.valid;

Projects = require('../tools/projects');

File = require('../tools/file');

Command = require('../commandline/command');

render = require('../editor/render');

syntax = require('../editor/syntax');

fuzzy = require('fuzzy');

relative = function(rel, to) {
    var r, tilde;
    r = slash.relative(rel, to);
    if (r.startsWith('../../')) {
        tilde = slash.tilde(rel);
        if (tilde.length < r.length) {
            r = tilde;
        }
    }
    if (rel.length < r.length) {
        r = rel;
    }
    return r;
};

Open = (function(superClass) {
    extend(Open, superClass);

    function Open(commandline) {
        this.weight = bind(this.weight, this);
        this.onFile = bind(this.onFile, this);
        Open.__super__.constructor.call(this, commandline);
        post.on('file', this.onFile);
        this.names = ["open", "new window"];
        this.files = [];
        this.file = null;
        this.dir = null;
        this.pkg = null;
        this.selected = 0;
    }

    Open.prototype.onFile = function(file) {
        if (this.isActive()) {
            if (empty(file)) {
                return this.setText('');
            } else if (this.getText() !== slash.file(file)) {
                return this.setText(slash.tilde(file));
            }
        }
    };

    Open.prototype.changed = function(command) {
        var f, file, fuzzied, items, pos, ref1;
        command = command.trim();
        ref1 = slash.splitFilePos(command != null ? command : this.getText().trim()), file = ref1[0], pos = ref1[1];
        items = this.listItems({
            currentText: command,
            maxItems: 10000
        });
        if (command.length) {
            fuzzied = fuzzy.filter(slash.basename(file), items, {
                extract: function(o) {
                    return o.text;
                }
            });
            items = (function() {
                var i, len, results;
                results = [];
                for (i = 0, len = fuzzied.length; i < len; i++) {
                    f = fuzzied[i];
                    results.push(f.original);
                }
                return results;
            })();
            items.sort(function(a, b) {
                return b.weight - a.weight;
            });
        }
        if (items.length) {
            this.showItems(items.slice(0, 300));
            this.select(0);
            return this.positionList();
        } else {
            return this.hideList();
        }
    };

    Open.prototype.complete = function() {
        var i, len, p, pdir, projects, ref1;
        if ((this.commandList != null) && this.commandList.line(this.selected).startsWith(slash.basename(this.getText())) && !this.getText().trim().endsWith('/')) {
            this.setText(slash.join(slash.dir(this.getText()), this.commandList.line(this.selected)));
            if (slash.dirExists(this.getText())) {
                this.setText(this.getText() + '/');
                this.changed(this.getText());
            }
            return true;
        } else if (!this.getText().trim().endsWith('/') && slash.dirExists(this.getText())) {
            this.setText(this.getText() + '/');
            this.changed(this.getText());
            return true;
        } else {
            projects = post.get('indexer', 'projects');
            ref1 = Object.keys(projects).sort();
            for (i = 0, len = ref1.length; i < len; i++) {
                p = ref1[i];
                if (p.startsWith(this.getText())) {
                    pdir = projects[p].dir;
                    if (slash.dirExists(slash.join(pdir, 'coffee'))) {
                        pdir = slash.join(pdir, 'coffee');
                    }
                    this.setText(pdir + '/');
                    this.changed(this.getText());
                    return true;
                }
            }
            return Open.__super__.complete.call(this);
        }
    };

    Open.prototype.weight = function(item, opt) {
        var b, extensionBonus, f, lengthPenalty, localBonus, n, nameBonus, r, ref1, relBonus, updirPenalty;
        if (item.bonus != null) {
            return item.bonus;
        }
        f = item.file;
        r = item.text;
        b = slash.file(f);
        n = slash.base(f);
        relBonus = 0;
        nameBonus = 0;
        if ((ref1 = opt.currentText) != null ? ref1.length : void 0) {
            relBonus = r.startsWith(opt.currentText) && 65535 * (opt.currentText.length / r.length) || 0;
            nameBonus = n.startsWith(opt.currentText) && 2184 * (opt.currentText.length / n.length) || 0;
        }
        extensionBonus = (function() {
            switch (slash.ext(b)) {
                case 'coffee':
                case 'koffee':
                    return 1000;
                case 'cpp':
                case 'hpp':
                case 'h':
                    return 90;
                case 'md':
                case 'styl':
                case 'pug':
                    return 50;
                case 'noon':
                    return 25;
                case 'js':
                case 'json':
                case 'html':
                    return -10;
                default:
                    return 0;
            }
        })();
        if (this.file && slash.ext(this.file) === slash.ext(b)) {
            extensionBonus += 1000;
        }
        lengthPenalty = slash.dir(f).length;
        updirPenalty = r.split('../').length * 819;
        if (f.startsWith(this.dir)) {
            localBonus = Math.max(0, (5 - r.split('/').length) * 4095);
        } else {
            localBonus = Math.max(0, (5 - r.split('../').length) * 819);
        }
        return item.weight = localBonus + relBonus + nameBonus + extensionBonus - lengthPenalty - updirPenalty;
    };

    Open.prototype.weightedItems = function(items, opt) {
        items.sort((function(_this) {
            return function(a, b) {
                return _this.weight(b, opt) - _this.weight(a, opt);
            };
        })(this));
        return items;
    };

    Open.prototype.listItems = function(opt) {
        var f, file, i, iconSpan, item, items, len, ref1, rel;
        if (opt != null) {
            opt;
        } else {
            opt = {};
        }
        if (opt.maxItems != null) {
            opt.maxItems;
        } else {
            opt.maxItems = 200;
        }
        if (opt.flat != null) {
            opt.flat;
        } else {
            opt.flat = true;
        }
        iconSpan = function(file) {
            var className;
            className = File.iconClassName(file);
            return "<span class='" + className + " openFileIcon'/>";
        };
        items = [];
        this.lastFileIndex = 0;
        if (this.dir == null) {
            this.dir = slash.resolve('~');
        }
        if ((this.history != null) && !opt.currentText && this.history.length > 1) {
            f = this.history[this.history.length - 2];
            item = Object.create(null);
            item.text = relative(f, this.dir);
            item.line = iconSpan(f);
            item.file = f;
            item.bonus = 1048575;
            items.push(item);
            this.lastFileIndex = 0;
        }
        if (valid(this.files)) {
            ref1 = this.files;
            for (i = 0, len = ref1.length; i < len; i++) {
                file = ref1[i];
                rel = relative(file, this.dir);
                if (rel.length) {
                    item = Object.create(null);
                    item.line = iconSpan(file);
                    item.text = rel;
                    item.file = file;
                    items.push(item);
                }
            }
        }
        items = this.weightedItems(items, opt);
        items = _.uniqBy(items, function(o) {
            return o.text;
        });
        return items.slice(0, opt.maxItems);
    };

    Open.prototype.showHistory = function() {
        var bonus, f, i, item, items, len, ref1;
        if (this.history.length > 1 && this.selected <= 0) {
            items = [];
            bonus = 1048575;
            ref1 = this.history;
            for (i = 0, len = ref1.length; i < len; i++) {
                f = ref1[i];
                item = Object.create(null);
                item.text = relative(f, this.dir);
                item.file = f;
                item.bonus = bonus;
                items.push(item);
                bonus -= 1;
            }
            items.pop();
            this.showItems(items);
            this.select(items.length - 1);
            return this.setAndSelectText(items[this.selected].text);
        } else {
            return 'unhandled';
        }
    };

    Open.prototype.showFirst = function() {
        var ref1, ref2;
        if (this.commandList && this.selected === ((ref1 = this.commandList.meta) != null ? (ref2 = ref1.metas) != null ? ref2.length : void 0 : void 0) - 1) {
            this.showItems(this.listItems());
            return this.select(0);
        } else {
            return 'unhandled';
        }
    };

    Open.prototype.cancel = function(name) {
        if (name === this.names[0]) {
            if ((this.commandList != null) && this.lastFileIndex === this.selected) {
                return this.execute();
            }
        }
        return Open.__super__.cancel.call(this, name);
    };

    Open.prototype.start = function(name) {
        var dir, item, ref1;
        this.setName(name);
        klog('open.start', name);
        klog('open.start @commandline.lastFocus', this.commandline.lastFocus);
        klog('open.start window.lastFocus', window.lastFocus);
        if ((this.commandline.lastFocus === 'commandline-editor' && 'commandline-editor' === window.lastFocus)) {
            this.file = window.editor.currentFile;
            if (dir = slash.resolve(this.commandline.text())) {
                this.dir = dir;
            } else {
                this.dir = (ref1 = slash.dir(this.file)) != null ? ref1 : process.cwd();
            }
        } else if (this.commandline.lastFocus === 'shelf' || this.commandline.lastFocus.startsWith('FileBrowser')) {
            item = window.filebrowser.lastUsedColumn().parent;
            switch (item.type) {
                case 'dir':
                    this.file = window.editor.currentFile;
                    this.dir = item.file;
                    break;
                case 'file':
                    this.file = item.file;
                    this.dir = slash.dir(this.file);
            }
        } else if (window.editor.currentFile != null) {
            this.file = window.editor.currentFile;
            this.dir = slash.dir(this.file);
        } else {
            this.file = null;
            this.dir = process.cwd();
        }
        this.files = Projects.files(this.dir);
        this.loadState();
        this.showList();
        this.showItems(this.listItems());
        this.grabFocus();
        this.select(0);
        return {
            text: this.commandList.line(this.selected),
            select: true
        };
    };

    Open.prototype.execute = function(command) {
        var file, path, pos, ref1, ref2;
        if (this.selected < 0) {
            return {
                status: 'failed'
            };
        }
        path = (ref1 = this.commandList) != null ? ref1.line(this.selected) : void 0;
        this.hideList();
        if (valid(path)) {
            ref2 = slash.splitFilePos(command), file = ref2[0], pos = ref2[1];
            klog('open.execute', file, pos);
            file = this.resolvedPath(path);
            file = slash.joinFilePos(file, pos);
            klog('open.execute', file);
            if (this.name === 'new window') {
                post.toMain('newWindowWithFile', file);
            } else {
                post.emit('jumpToFile', {
                    file: file
                });
            }
            Open.__super__.execute.call(this, file);
            return {
                text: file,
                focus: 'editor',
                show: 'editor',
                status: 'ok'
            };
        } else {
            return {
                status: 'failed'
            };
        }
    };

    Open.prototype.resolvedPath = function(p, parent) {
        var ref1;
        if (parent == null) {
            parent = this.dir;
        }
        if (p == null) {
            return parent != null ? parent : slash.resolve('~');
        }
        if (((ref1 = p[0]) === '~' || ref1 === '/') || p[1] === ':') {
            return slash.resolve(p);
        } else {
            return slash.resolve(slash.join(parent, p));
        }
    };

    Open.prototype.handleModKeyComboEvent = function(mod, key, combo, event) {
        switch (combo) {
            case 'up':
                return this.showHistory();
            case 'down':
                return this.showFirst();
        }
        return Open.__super__.handleModKeyComboEvent.call(this, mod, key, combo, event);
    };

    return Open;

})(Command);

module.exports = Open;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3Blbi5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvY29tbWFuZHMiLCJzb3VyY2VzIjpbIm9wZW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHVHQUFBO0lBQUE7Ozs7QUFRQSxNQUF5QyxPQUFBLENBQVEsS0FBUixDQUF6QyxFQUFFLFNBQUYsRUFBSyxpQkFBTCxFQUFZLGVBQVosRUFBa0IsZUFBbEIsRUFBd0IsaUJBQXhCLEVBQStCOztBQUUvQixRQUFBLEdBQVksT0FBQSxDQUFRLG1CQUFSOztBQUNaLElBQUEsR0FBWSxPQUFBLENBQVEsZUFBUjs7QUFDWixPQUFBLEdBQVksT0FBQSxDQUFRLHdCQUFSOztBQUNaLE1BQUEsR0FBWSxPQUFBLENBQVEsa0JBQVI7O0FBQ1osTUFBQSxHQUFZLE9BQUEsQ0FBUSxrQkFBUjs7QUFDWixLQUFBLEdBQVksT0FBQSxDQUFRLE9BQVI7O0FBRVosUUFBQSxHQUFXLFNBQUMsR0FBRCxFQUFNLEVBQU47QUFFUCxRQUFBO0lBQUEsQ0FBQSxHQUFJLEtBQUssQ0FBQyxRQUFOLENBQWUsR0FBZixFQUFvQixFQUFwQjtJQUVKLElBQUcsQ0FBQyxDQUFDLFVBQUYsQ0FBYSxRQUFiLENBQUg7UUFDSSxLQUFBLEdBQVEsS0FBSyxDQUFDLEtBQU4sQ0FBWSxHQUFaO1FBQ1IsSUFBRyxLQUFLLENBQUMsTUFBTixHQUFlLENBQUMsQ0FBQyxNQUFwQjtZQUNJLENBQUEsR0FBSSxNQURSO1NBRko7O0lBSUEsSUFBRyxHQUFHLENBQUMsTUFBSixHQUFhLENBQUMsQ0FBQyxNQUFsQjtRQUNJLENBQUEsR0FBSSxJQURSOztXQUVBO0FBVk87O0FBWUw7OztJQUVDLGNBQUMsV0FBRDs7O1FBRUMsc0NBQU0sV0FBTjtRQUVBLElBQUksQ0FBQyxFQUFMLENBQVEsTUFBUixFQUFnQixJQUFDLENBQUEsTUFBakI7UUFFQSxJQUFDLENBQUEsS0FBRCxHQUFZLENBQUMsTUFBRCxFQUFTLFlB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QSxJQUFBLEtBQWMsR0FBZCxDQUFBLElBQXNCLENBQUUsQ0FBQSxDQUFBLENBQUYsS0FBUSxHQUFqQzttQkFDSSxLQUFLLENBQUMsT0FBTixDQUFjLENBQWQsRUFESjtTQUFBLE1BQUE7bUJBR0ksS0FBSyxDQUFDLE9BQU4sQ0FBYyxLQUFLLENBQUMsSUFBTixDQUFXLE1BQVgsRUFBbUIsQ0FBbkIsQ0FBZCxFQUhKOztJQUhVOzttQkFjZCxzQkFBQSxHQUF3QixTQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsS0FBWCxFQUFrQixLQUFsQjtBQUVwQixnQkFBTyxLQUFQO0FBQUEsaUJBQ1MsSUFEVDtBQUNxQix1QkFBTyxJQUFDLENBQUEsV0FBRCxDQUFBO0FBRDVCLGlCQUVTLE1BRlQ7QUFFcUIsdUJBQU8sSUFBQyxDQUFBLFNBQUQsQ0FBQTtBQUY1QjtlQUdBLGlEQUFNLEdBQU4sRUFBVyxHQUFYLEVBQWdCLEtBQWhCLEVBQXVCLEtBQXZCO0lBTG9COzs7O0dBclZUOztBQTRWbkIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMFxuMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgMCAwMDBcbjAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwXG4gMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgXywgZW1wdHksIGtsb2csIHBvc3QsIHNsYXNoLCB2YWxpZCB9ID0gcmVxdWlyZSAna3hrJ1xuICBcblByb2plY3RzICA9IHJlcXVpcmUgJy4uL3Rvb2xzL3Byb2plY3RzJ1xuRmlsZSAgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvZmlsZSdcbkNvbW1hbmQgICA9IHJlcXVpcmUgJy4uL2NvbW1hbmRsaW5lL2NvbW1hbmQnXG5yZW5kZXIgICAgPSByZXF1aXJlICcuLi9lZGl0b3IvcmVuZGVyJ1xuc3ludGF4ICAgID0gcmVxdWlyZSAnLi4vZWRpdG9yL3N5bnRheCdcbmZ1enp5ICAgICA9IHJlcXVpcmUgJ2Z1enp5J1xuICAgICAgICAgICAgICAgICBcbnJlbGF0aXZlID0gKHJlbCwgdG8pIC0+XG4gICAgXG4gICAgciA9IHNsYXNoLnJlbGF0aXZlIHJlbCwgdG9cblxuICAgIGlmIHIuc3RhcnRzV2l0aCAnLi4vLi4vJyBcbiAgICAgICAgdGlsZGUgPSBzbGFzaC50aWxkZSByZWxcbiAgICAgICAgaWYgdGlsZGUubGVuZ3RoIDwgci5sZW5ndGhcbiAgICAgICAgICAgIHIgPSB0aWxkZVxuICAgIGlmIHJlbC5sZW5ndGggPCByLmxlbmd0aCAgICBcbiAgICAgICAgciA9IHJlbFxuICAgIHIgICAgXG5cbmNsYXNzIE9wZW4gZXh0ZW5kcyBDb21tYW5kXG5cbiAgICBAOiAoY29tbWFuZGxpbmUpIC0+XG4gICAgICAgIFxuICAgICAgICBzdXBlciBjb21tYW5kbGluZVxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnZmlsZScsIEBvbkZpbGVcbiAgICAgICAgXG4gICAgICAgIEBuYW1lcyAgICA9IFtcIm9wZW5cIiwgXCJuZXcgd2luZG93XCJdXG4gICAgICAgIEBmaWxlcyAgICA9IFtdXG4gICAgICAgIEBmaWxlICAgICA9IG51bGxcbiAgICAgICAgQGRpciAgICAgID0gbnVsbFxuICAgICAgICBAcGtnICAgICAgPSBudWxsXG4gICAgICAgIEBzZWxlY3RlZCA9IDBcbiAgICAgICAgICBcbiAgICBvbkZpbGU6IChmaWxlKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGlzQWN0aXZlKCkgXG4gICAgICAgICAgICBpZiBlbXB0eSBmaWxlXG4gICAgICAgICAgICAgICAgQHNldFRleHQgJydcbiAgICAgICAgICAgIGVsc2UgaWYgQGdldFRleHQoKSAhPSBzbGFzaC5maWxlIGZpbGVcbiAgICAgICAgICAgICAgICBAc2V0VGV4dCBzbGFzaC50aWxkZSBmaWxlXG4gICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgXG5cbiAgICBjaGFuZ2VkOiAoY29tbWFuZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGNvbW1hbmQgPSBjb21tYW5kLnRyaW0oKVxuXG4gICAgICAgIFtmaWxlLCBwb3NdID0gc2xhc2guc3BsaXRGaWxlUG9zIGNvbW1hbmQgPyBAZ2V0VGV4dCgpLnRyaW0oKVxuXG4gICAgICAgIGl0ZW1zID0gQGxpc3RJdGVtcyBjdXJyZW50VGV4dDpjb21tYW5kLCBtYXhJdGVtczoxMDAwMFxuICAgICAgICBcbiAgICAgICAgaWYgY29tbWFuZC5sZW5ndGhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZnV6emllZCA9IGZ1enp5LmZpbHRlciBzbGFzaC5iYXNlbmFtZShmaWxlKSwgaXRlbXMsIGV4dHJhY3Q6IChvKSAtPiBvLnRleHQgICAgICAgICAgICBcbiAgICAgICAgICAgIGl0ZW1zID0gKGYub3JpZ2luYWwgZm9yIGYgaW4gZnV6emllZClcbiAgICAgICAgICAgIGl0ZW1zLnNvcnQgKGEsYikgLT4gYi53ZWlnaHQgLSBhLndlaWdodFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgaXRlbXMubGVuZ3RoXG4gICAgICAgICAgICBAc2hvd0l0ZW1zIGl0ZW1zLnNsaWNlIDAgMzAwXG4gICAgICAgICAgICBAc2VsZWN0IDBcbiAgICAgICAgICAgIEBwb3NpdGlvbkxpc3QoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaGlkZUxpc3QoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgY29tcGxldGU6IC0+XG5cbiAgICAgICAgaWYgQGNvbW1hbmRMaXN0PyBhbmQgQGNvbW1hbmRMaXN0LmxpbmUoQHNlbGVjdGVkKS5zdGFydHNXaXRoKHNsYXNoLmJhc2VuYW1lIEBnZXRUZXh0KCkpIGFuZCBub3QgQGdldFRleHQoKS50cmltKCkuZW5kc1dpdGgoJy8nKVxuICAgICAgICAgICAgQHNldFRleHQgc2xhc2guam9pbihzbGFzaC5kaXIoQGdldFRleHQoKSksIEBjb21tYW5kTGlzdC5saW5lKEBzZWxlY3RlZCkpXG4gICAgICAgICAgICBpZiBzbGFzaC5kaXJFeGlzdHMgQGdldFRleHQoKVxuICAgICAgICAgICAgICAgIEBzZXRUZXh0IEBnZXRUZXh0KCkgKyAnLydcbiAgICAgICAgICAgICAgICBAY2hhbmdlZCBAZ2V0VGV4dCgpXG4gICAgICAgICAgICB0cnVlXG4gICAgICAgIGVsc2UgaWYgbm90IEBnZXRUZXh0KCkudHJpbSgpLmVuZHNXaXRoKCcvJykgYW5kIHNsYXNoLmRpckV4aXN0cyBAZ2V0VGV4dCgpXG4gICAgICAgICAgICBAc2V0VGV4dCBAZ2V0VGV4dCgpICsgJy8nXG4gICAgICAgICAgICBAY2hhbmdlZCBAZ2V0VGV4dCgpXG4gICAgICAgICAgICB0cnVlICAgICAgICAgICAgXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHByb2plY3RzID0gcG9zdC5nZXQgJ2luZGV4ZXInLCAncHJvamVjdHMnXG4gICAgICAgICAgICBmb3IgcCBpbiBPYmplY3Qua2V5cyhwcm9qZWN0cykuc29ydCgpXG4gICAgICAgICAgICAgICAgaWYgcC5zdGFydHNXaXRoIEBnZXRUZXh0KClcbiAgICAgICAgICAgICAgICAgICAgcGRpciA9IHByb2plY3RzW3BdLmRpclxuICAgICAgICAgICAgICAgICAgICBwZGlyID0gc2xhc2guam9pbihwZGlyLCAnY29mZmVlJykgaWYgc2xhc2guZGlyRXhpc3RzIHNsYXNoLmpvaW4gcGRpciwgJ2NvZmZlZSdcbiAgICAgICAgICAgICAgICAgICAgQHNldFRleHQgcGRpciArICcvJ1xuICAgICAgICAgICAgICAgICAgICBAY2hhbmdlZCBAZ2V0VGV4dCgpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICBzdXBlcigpXG4gICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgIFxuXG4gICAgd2VpZ2h0OiAoaXRlbSwgb3B0KSA9PiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gaXRlbS5ib251cyBpZiBpdGVtLmJvbnVzP1xuICAgICAgICBcbiAgICAgICAgZiA9IGl0ZW0uZmlsZVxuICAgICAgICByID0gaXRlbS50ZXh0XG4gICAgICAgIGIgPSBzbGFzaC5maWxlIGZcbiAgICAgICAgbiA9IHNsYXNoLmJhc2UgZlxuICAgICAgICAgICAgICAgIFxuICAgICAgICByZWxCb251cyA9IDBcbiAgICAgICAgbmFtZUJvbnVzID0gMFxuICAgICAgICBpZiBvcHQuY3VycmVudFRleHQ/Lmxlbmd0aFxuICAgICAgICAgICAgcmVsQm9udXMgID0gci5zdGFydHNXaXRoKG9wdC5jdXJyZW50VGV4dCkgYW5kIDY1NTM1ICogKG9wdC5jdXJyZW50VGV4dC5sZW5ndGgvci5sZW5ndGgpIG9yIDAgXG4gICAgICAgICAgICBuYW1lQm9udXMgPSBuLnN0YXJ0c1dpdGgob3B0LmN1cnJlbnRUZXh0KSBhbmQgMjE4NCAgKiAob3B0LmN1cnJlbnRUZXh0Lmxlbmd0aC9uLmxlbmd0aCkgb3IgMFxuICAgICAgICAgICBcbiAgICAgICAgZXh0ZW5zaW9uQm9udXMgPSBzd2l0Y2ggc2xhc2guZXh0IGJcbiAgICAgICAgICAgIHdoZW4gJ2NvZmZlZScsICdrb2ZmZWUnICAgdGhlbiAxMDAwXG4gICAgICAgICAgICB3aGVuICdjcHAnLCAnaHBwJywgJ2gnICAgIHRoZW4gOTBcbiAgICAgICAgICAgIHdoZW4gJ21kJywgJ3N0eWwnLCAncHVnJyAgdGhlbiA1MFxuICAgICAgICAgICAgd2hlbiAnbm9vbicgICAgICAgICAgICAgICB0aGVuIDI1XG4gICAgICAgICAgICB3aGVuICdqcycsICdqc29uJywgJ2h0bWwnIHRoZW4gLTEwXG4gICAgICAgICAgICBlbHNlIDAgXG4gICAgICAgIFxuICAgICAgICBpZiBAZmlsZSBhbmQgc2xhc2guZXh0KEBmaWxlKSA9PSBzbGFzaC5leHQgYlxuICAgICAgICAgICAgZXh0ZW5zaW9uQm9udXMgKz0gMTAwMFxuICAgICAgICBcbiAgICAgICAgbGVuZ3RoUGVuYWx0eSA9IHNsYXNoLmRpcihmKS5sZW5ndGhcbiAgICAgICAgICAgIFxuICAgICAgICB1cGRpclBlbmFsdHkgICA9IHIuc3BsaXQoJy4uLycpLmxlbmd0aCAqIDgxOVxuICAgICAgICBcbiAgICAgICAgaWYgZi5zdGFydHNXaXRoIEBkaXJcbiAgICAgICAgICAgIGxvY2FsQm9udXMgPSBNYXRoLm1heCAwLCAoNS1yLnNwbGl0KCcvJykubGVuZ3RoKSAqIDQwOTVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbG9jYWxCb251cyA9IE1hdGgubWF4IDAsICg1LXIuc3BsaXQoJy4uLycpLmxlbmd0aCkgKiA4MTlcbiAgICAgICAgXG4gICAgICAgIGl0ZW0ud2VpZ2h0ID0gbG9jYWxCb251cyArIHJlbEJvbnVzICsgbmFtZUJvbnVzICsgZXh0ZW5zaW9uQm9udXMgLSBsZW5ndGhQZW5hbHR5IC0gdXBkaXJQZW5hbHR5XG4gICAgICAgICAgICBcbiAgICB3ZWlnaHRlZEl0ZW1zOiAoaXRlbXMsIG9wdCkgLT4gXG4gICAgICAgIFxuICAgICAgICBpdGVtcy5zb3J0IChhLGIpID0+IEB3ZWlnaHQoYiwgb3B0KSAtIEB3ZWlnaHQoYSwgb3B0KVxuICAgICAgICBpdGVtc1xuICAgIFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICBcbiAgICAgICAgXG4gICAgbGlzdEl0ZW1zOiAob3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgb3B0ID89IHt9XG4gICAgICAgIG9wdC5tYXhJdGVtcyA/PSAyMDBcbiAgICAgICAgb3B0LmZsYXQgPz0gdHJ1ZVxuICAgICAgICBcbiAgICAgICAgaWNvblNwYW4gPSAoZmlsZSkgLT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY2xhc3NOYW1lID0gRmlsZS5pY29uQ2xhc3NOYW1lIGZpbGVcbiAgICAgICAgICAgIFwiPHNwYW4gY2xhc3M9JyN7Y2xhc3NOYW1lfSBvcGVuRmlsZUljb24nLz5cIlxuICAgICAgICBcbiAgICAgICAgaXRlbXMgPSBbXVxuICAgICAgICBcbiAgICAgICAgQGxhc3RGaWxlSW5kZXggPSAwXG4gICAgICAgIFxuICAgICAgICBAZGlyID0gc2xhc2gucmVzb2x2ZSAnficgaWYgbm90IEBkaXI/XG4gICAgICAgIFxuICAgICAgICBpZiBAaGlzdG9yeT8gYW5kIG5vdCBvcHQuY3VycmVudFRleHQgYW5kIEBoaXN0b3J5Lmxlbmd0aCA+IDFcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZiA9IEBoaXN0b3J5W0BoaXN0b3J5Lmxlbmd0aC0yXVxuICAgICAgICAgICAgaXRlbSA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICAgICAgaXRlbS50ZXh0ID0gcmVsYXRpdmUgZiwgQGRpclxuICAgICAgICAgICAgaXRlbS5saW5lID0gaWNvblNwYW4gZlxuICAgICAgICAgICAgaXRlbS5maWxlID0gZlxuICAgICAgICAgICAgaXRlbS5ib251cyA9IDEwNDg1NzVcbiAgICAgICAgICAgIGl0ZW1zLnB1c2ggaXRlbVxuICAgICAgICAgICAgQGxhc3RGaWxlSW5kZXggPSAwXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkIEBmaWxlc1xuICAgICAgICAgICAgZm9yIGZpbGUgaW4gQGZpbGVzXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmVsID0gcmVsYXRpdmUgZmlsZSwgQGRpclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIHJlbC5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgaXRlbSA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICAgICAgICAgICAgICBpdGVtLmxpbmUgPSBpY29uU3BhbiBmaWxlXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0udGV4dCA9IHJlbFxuICAgICAgICAgICAgICAgICAgICBpdGVtLmZpbGUgPSBmaWxlXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zLnB1c2ggaXRlbVxuXG4gICAgICAgIGl0ZW1zID0gQHdlaWdodGVkSXRlbXMgaXRlbXMsIG9wdFxuICAgICAgICBpdGVtcyA9IF8udW5pcUJ5IGl0ZW1zLCAobykgLT4gby50ZXh0XG4gICAgICAgIFxuICAgICAgICBpdGVtcy5zbGljZSAwLCBvcHQubWF4SXRlbXNcbiAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBzaG93SGlzdG9yeTogLT5cblxuICAgICAgICBpZiBAaGlzdG9yeS5sZW5ndGggPiAxIGFuZCBAc2VsZWN0ZWQgPD0gMFxuICAgICAgICAgICAgaXRlbXMgPSBbXVxuICAgICAgICAgICAgYm9udXMgPSAxMDQ4NTc1XG4gICAgICAgICAgICBmb3IgZiBpbiBAaGlzdG9yeVxuICAgICAgICAgICAgICAgIGl0ZW0gPSBPYmplY3QuY3JlYXRlIG51bGxcbiAgICAgICAgICAgICAgICBpdGVtLnRleHQgPSByZWxhdGl2ZSBmLCBAZGlyXG4gICAgICAgICAgICAgICAgaXRlbS5maWxlID0gZlxuICAgICAgICAgICAgICAgIGl0ZW0uYm9udXMgPSBib251c1xuICAgICAgICAgICAgICAgIGl0ZW1zLnB1c2ggaXRlbVxuICAgICAgICAgICAgICAgIGJvbnVzIC09IDEgXG4gICAgICAgICAgICBpdGVtcy5wb3AoKVxuICAgICAgICAgICAgQHNob3dJdGVtcyBpdGVtc1xuICAgICAgICAgICAgQHNlbGVjdCBpdGVtcy5sZW5ndGgtMVxuICAgICAgICAgICAgQHNldEFuZFNlbGVjdFRleHQgaXRlbXNbQHNlbGVjdGVkXS50ZXh0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgICd1bmhhbmRsZWQnXG5cbiAgICBzaG93Rmlyc3Q6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAY29tbWFuZExpc3QgYW5kIEBzZWxlY3RlZCA9PSBAY29tbWFuZExpc3QubWV0YT8ubWV0YXM/Lmxlbmd0aCAtIDFcbiAgICAgICAgICAgIEBzaG93SXRlbXMgQGxpc3RJdGVtcygpXG4gICAgICAgICAgICBAc2VsZWN0IDBcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgJ3VuaGFuZGxlZCdcbiAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgIFxuICAgIGNhbmNlbDogKG5hbWUpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBuYW1lID09IEBuYW1lc1swXSAjIGNvbW1hbmQrcCBjb21tYW5kK3AgdG8gb3BlbiBwcmV2aW91cyBmaWxlXG4gICAgICAgICAgICBpZiBAY29tbWFuZExpc3Q/IGFuZCBAbGFzdEZpbGVJbmRleCA9PSBAc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICByZXR1cm4gQGV4ZWN1dGUoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBzdXBlciBuYW1lXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgICAgIFxuICAgIHN0YXJ0OiAobmFtZSkgLT4gXG4gICAgICAgIFxuICAgICAgICBAc2V0TmFtZSBuYW1lXG4gICAgICAgIFxuICAgICAgICBrbG9nICdvcGVuLnN0YXJ0JyBuYW1lXG4gICAgICAgIGtsb2cgJ29wZW4uc3RhcnQgQGNvbW1hbmRsaW5lLmxhc3RGb2N1cycgQGNvbW1hbmRsaW5lLmxhc3RGb2N1c1xuICAgICAgICBrbG9nICdvcGVuLnN0YXJ0IHdpbmRvdy5sYXN0Rm9jdXMnIHdpbmRvdy5sYXN0Rm9jdXNcbiAgICAgICAgXG4gICAgICAgIGlmIEBjb21tYW5kbGluZS5sYXN0Rm9jdXMgPT0gJ2NvbW1hbmRsaW5lLWVkaXRvcicgPT0gd2luZG93Lmxhc3RGb2N1c1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZmlsZSA9IHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgICAgIGlmIGRpciA9IHNsYXNoLnJlc29sdmUgQGNvbW1hbmRsaW5lLnRleHQoKVxuICAgICAgICAgICAgICAgIEBkaXIgPSBkaXJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAZGlyID0gc2xhc2guZGlyKEBmaWxlKSA/IHByb2Nlc3MuY3dkKClcbiAgICAgICAgXG4gICAgICAgIGVsc2UgaWYgQGNvbW1hbmRsaW5lLmxhc3RGb2N1cyA9PSAnc2hlbGYnIG9yIEBjb21tYW5kbGluZS5sYXN0Rm9jdXMuc3RhcnRzV2l0aCAnRmlsZUJyb3dzZXInXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGl0ZW0gPSB3aW5kb3cuZmlsZWJyb3dzZXIubGFzdFVzZWRDb2x1bW4oKS5wYXJlbnRcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3dpdGNoIGl0ZW0udHlwZVxuICAgICAgICAgICAgICAgIHdoZW4gJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgQGZpbGUgPSB3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICAgICAgICAgICAgIEBkaXIgID0gaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgd2hlbiAnZmlsZSdcbiAgICAgICAgICAgICAgICAgICAgQGZpbGUgPSBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgQGRpciAgPSBzbGFzaC5kaXIgQGZpbGVcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGVsc2UgaWYgd2luZG93LmVkaXRvci5jdXJyZW50RmlsZT9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGZpbGUgPSB3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICAgICBAZGlyICA9IHNsYXNoLmRpciBAZmlsZVxuICAgICAgICAgICAgXG4gICAgICAgIGVsc2UgXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBmaWxlID0gbnVsbFxuICAgICAgICAgICAgQGRpciAgPSBwcm9jZXNzLmN3ZCgpXG4gICAgICAgICAgICBcbiAgICAgICAgQGZpbGVzID0gUHJvamVjdHMuZmlsZXMgQGRpclxuICAgICAgICBcbiAgICAgICAgQGxvYWRTdGF0ZSgpXG4gICAgICAgIEBzaG93TGlzdCgpXG4gICAgICAgIEBzaG93SXRlbXMgQGxpc3RJdGVtcygpXG4gICAgICAgIEBncmFiRm9jdXMoKVxuICAgICAgICBAc2VsZWN0IDAgIFxuICAgICAgICBcbiAgICAgICAgdGV4dDogICBAY29tbWFuZExpc3QubGluZSBAc2VsZWN0ZWRcbiAgICAgICAgc2VsZWN0OiB0cnVlXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiAgICAgICAgXG4gICAgZXhlY3V0ZTogKGNvbW1hbmQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAc2VsZWN0ZWQgPCAwIHRoZW4gcmV0dXJuIHN0YXR1czonZmFpbGVkJ1xuICAgICAgICAgICAgXG4gICAgICAgIHBhdGggPSBAY29tbWFuZExpc3Q/LmxpbmUgQHNlbGVjdGVkXG4gICAgICAgIFxuICAgICAgICAjIGtsb2cgJ29wZW4uZXhlY3V0ZScgY29tbWFuZCwgcGF0aFxuICAgICAgICBcbiAgICAgICAgQGhpZGVMaXN0KClcblxuICAgICAgICBpZiB2YWxpZCBwYXRoXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFtmaWxlLCBwb3NdID0gc2xhc2guc3BsaXRGaWxlUG9zIGNvbW1hbmRcbiAgICAgICAgICAgIFxuICAgICAgICAgICAga2xvZyAnb3Blbi5leGVjdXRlJyBmaWxlLCBwb3NcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZmlsZSA9IEByZXNvbHZlZFBhdGggcGF0aFxuICAgICAgICAgICAgZmlsZSA9IHNsYXNoLmpvaW5GaWxlUG9zIGZpbGUsIHBvc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBrbG9nICdvcGVuLmV4ZWN1dGUnIGZpbGVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgQG5hbWUgPT0gJ25ldyB3aW5kb3cnXG4gICAgICAgICAgICAgICAgcG9zdC50b01haW4gJ25ld1dpbmRvd1dpdGhGaWxlJywgZmlsZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvRmlsZScgZmlsZTpmaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHN1cGVyIGZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHRleHQ6ICAgZmlsZVxuICAgICAgICAgICAgZm9jdXM6ICAnZWRpdG9yJ1xuICAgICAgICAgICAgc2hvdzogICAnZWRpdG9yJ1xuICAgICAgICAgICAgc3RhdHVzOiAnb2snXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHN0YXR1czogJ2ZhaWxlZCdcbiAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgIFxuICAgIFxuICAgIHJlc29sdmVkUGF0aDogKHAsIHBhcmVudD1AZGlyKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIChwYXJlbnQgPyBzbGFzaC5yZXNvbHZlICd+JykgaWYgbm90IHA/XG4gICAgICAgIGlmIHBbMF0gaW4gWyd+JywgJy8nXSBvciBwWzFdID09ICc6J1xuICAgICAgICAgICAgc2xhc2gucmVzb2x2ZSBwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNsYXNoLnJlc29sdmUgc2xhc2guam9pbiBwYXJlbnQsIHBcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICBcbiAgICBcbiAgICBoYW5kbGVNb2RLZXlDb21ib0V2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBldmVudCkgLT4gXG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgIHRoZW4gcmV0dXJuIEBzaG93SGlzdG9yeSgpXG4gICAgICAgICAgICB3aGVuICdkb3duJyB0aGVuIHJldHVybiBAc2hvd0ZpcnN0KClcbiAgICAgICAgc3VwZXIgbW9kLCBrZXksIGNvbWJvLCBldmVudFxuXG5tb2R1bGUuZXhwb3J0cyA9IE9wZW5cbiJdfQ==
//# sourceURL=../../coffee/commands/open.coffee