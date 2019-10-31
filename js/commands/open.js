// koffee 1.4.0

/*
 0000000   00000000   00000000  000   000
000   000  000   000  000       0000  000
000   000  00000000   0000000   000 0 000
000   000  000        000       000  0000
 0000000   000        00000000  000   000
 */
var Command, File, Open, Projects, _, clamp, empty, fs, fuzzy, os, post, ref, relative, render, slash, syntax, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), post = ref.post, valid = ref.valid, empty = ref.empty, clamp = ref.clamp, slash = ref.slash, fs = ref.fs, os = ref.os, _ = ref._;

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
        if (this.commandList && this.selected === this.commandList.meta.metas.length - 1) {
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
            ref2 = slash.splitFilePos(path), file = ref2[0], pos = ref2[1];
            file = this.resolvedPath(path);
            file = slash.joinFilePos(file, pos);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3Blbi5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsZ0hBQUE7SUFBQTs7OztBQVFBLE1BQWtELE9BQUEsQ0FBUSxLQUFSLENBQWxELEVBQUUsZUFBRixFQUFRLGlCQUFSLEVBQWUsaUJBQWYsRUFBc0IsaUJBQXRCLEVBQTZCLGlCQUE3QixFQUFvQyxXQUFwQyxFQUF3QyxXQUF4QyxFQUE0Qzs7QUFFNUMsUUFBQSxHQUFZLE9BQUEsQ0FBUSxtQkFBUjs7QUFDWixJQUFBLEdBQVksT0FBQSxDQUFRLGVBQVI7O0FBQ1osT0FBQSxHQUFZLE9BQUEsQ0FBUSx3QkFBUjs7QUFDWixNQUFBLEdBQVksT0FBQSxDQUFRLGtCQUFSOztBQUNaLE1BQUEsR0FBWSxPQUFBLENBQVEsa0JBQVI7O0FBQ1osS0FBQSxHQUFZLE9BQUEsQ0FBUSxPQUFSOztBQUVaLFFBQUEsR0FBVyxTQUFDLEdBQUQsRUFBTSxFQUFOO0FBRVAsUUFBQTtJQUFBLENBQUEsR0FBSSxLQUFLLENBQUMsUUFBTixDQUFlLEdBQWYsRUFBb0IsRUFBcEI7SUFFSixJQUFHLENBQUMsQ0FBQyxVQUFGLENBQWEsUUFBYixDQUFIO1FBQ0ksS0FBQSxHQUFRLEtBQUssQ0FBQyxLQUFOLENBQVksR0FBWjtRQUNSLElBQUcsS0FBSyxDQUFDLE1BQU4sR0FBZSxDQUFDLENBQUMsTUFBcEI7WUFDSSxDQUFBLEdBQUksTUFEUjtTQUZKOztJQUlBLElBQUcsR0FBRyxDQUFDLE1BQUosR0FBYSxDQUFDLENBQUMsTUFBbEI7UUFDSSxDQUFBLEdBQUksSUFEUjs7V0FFQTtBQVZPOztBQVlMOzs7SUFFQyxjQUFDLFdBQUQ7OztRQUVDLHNDQUFNLFdBQU47UUFFQSxJQUFJLENBQUMsRUFBTCxDQUFRLE1BQVIsRUFBZ0IsSUFBQyxDQUFBLE1BQWpCO1FBRUEsSUFBQyxDQUFBLEtBQUQsR0FBWSxDQUFDLE1BQUQsRUFBUyxZQUFUO1FB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QixLQUFsQjtBQUVwQixnQkFBTyxLQUFQO0FBQUEsaUJBQ1MsSUFEVDtBQUNxQix1QkFBTyxJQUFDLENBQUEsV0FBRCxDQUFBO0FBRDVCLGlCQUVTLE1BRlQ7QUFFcUIsdUJBQU8sSUFBQyxDQUFBLFNBQUQsQ0FBQTtBQUY1QjtlQUdBLGlEQUFNLEdBQU4sRUFBVyxHQUFYLEVBQWdCLEtBQWhCLEVBQXVCLEtBQXZCO0lBTG9COzs7O0dBMVVUOztBQWlWbkIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMFxuMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgMCAwMDBcbjAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwXG4gMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwgdmFsaWQsIGVtcHR5LCBjbGFtcCwgc2xhc2gsIGZzLCBvcywgXyB9ID0gcmVxdWlyZSAna3hrJ1xuICBcblByb2plY3RzICA9IHJlcXVpcmUgJy4uL3Rvb2xzL3Byb2plY3RzJ1xuRmlsZSAgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvZmlsZSdcbkNvbW1hbmQgICA9IHJlcXVpcmUgJy4uL2NvbW1hbmRsaW5lL2NvbW1hbmQnXG5yZW5kZXIgICAgPSByZXF1aXJlICcuLi9lZGl0b3IvcmVuZGVyJ1xuc3ludGF4ICAgID0gcmVxdWlyZSAnLi4vZWRpdG9yL3N5bnRheCdcbmZ1enp5ICAgICA9IHJlcXVpcmUgJ2Z1enp5J1xuICAgICAgICAgICAgICAgICBcbnJlbGF0aXZlID0gKHJlbCwgdG8pIC0+XG4gICAgXG4gICAgciA9IHNsYXNoLnJlbGF0aXZlIHJlbCwgdG9cblxuICAgIGlmIHIuc3RhcnRzV2l0aCAnLi4vLi4vJyBcbiAgICAgICAgdGlsZGUgPSBzbGFzaC50aWxkZSByZWxcbiAgICAgICAgaWYgdGlsZGUubGVuZ3RoIDwgci5sZW5ndGhcbiAgICAgICAgICAgIHIgPSB0aWxkZVxuICAgIGlmIHJlbC5sZW5ndGggPCByLmxlbmd0aCAgICBcbiAgICAgICAgciA9IHJlbFxuICAgIHIgICAgXG5cbmNsYXNzIE9wZW4gZXh0ZW5kcyBDb21tYW5kXG5cbiAgICBAOiAoY29tbWFuZGxpbmUpIC0+XG4gICAgICAgIFxuICAgICAgICBzdXBlciBjb21tYW5kbGluZVxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnZmlsZScsIEBvbkZpbGVcbiAgICAgICAgXG4gICAgICAgIEBuYW1lcyAgICA9IFtcIm9wZW5cIiwgXCJuZXcgd2luZG93XCJdXG4gICAgICAgIEBmaWxlcyAgICA9IFtdXG4gICAgICAgIEBmaWxlICAgICA9IG51bGxcbiAgICAgICAgQGRpciAgICAgID0gbnVsbFxuICAgICAgICBAcGtnICAgICAgPSBudWxsXG4gICAgICAgIEBzZWxlY3RlZCA9IDBcbiAgICAgICAgICBcbiAgICBvbkZpbGU6IChmaWxlKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGlzQWN0aXZlKCkgXG4gICAgICAgICAgICBpZiBlbXB0eSBmaWxlXG4gICAgICAgICAgICAgICAgQHNldFRleHQgJydcbiAgICAgICAgICAgIGVsc2UgaWYgQGdldFRleHQoKSAhPSBzbGFzaC5maWxlIGZpbGVcbiAgICAgICAgICAgICAgICBAc2V0VGV4dCBzbGFzaC50aWxkZSBmaWxlXG4gICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgXG5cbiAgICBjaGFuZ2VkOiAoY29tbWFuZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGNvbW1hbmQgPSBjb21tYW5kLnRyaW0oKVxuXG4gICAgICAgIFtmaWxlLCBwb3NdID0gc2xhc2guc3BsaXRGaWxlUG9zIGNvbW1hbmQgPyBAZ2V0VGV4dCgpLnRyaW0oKVxuXG4gICAgICAgIGl0ZW1zID0gQGxpc3RJdGVtcyBjdXJyZW50VGV4dDpjb21tYW5kLCBtYXhJdGVtczoxMDAwMFxuICAgICAgICBcbiAgICAgICAgaWYgY29tbWFuZC5sZW5ndGhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZnV6emllZCA9IGZ1enp5LmZpbHRlciBzbGFzaC5iYXNlbmFtZShmaWxlKSwgaXRlbXMsIGV4dHJhY3Q6IChvKSAtPiBvLnRleHQgICAgICAgICAgICBcbiAgICAgICAgICAgIGl0ZW1zID0gKGYub3JpZ2luYWwgZm9yIGYgaW4gZnV6emllZClcbiAgICAgICAgICAgIGl0ZW1zLnNvcnQgKGEsYikgLT4gYi53ZWlnaHQgLSBhLndlaWdodFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgaXRlbXMubGVuZ3RoXG4gICAgICAgICAgICBAc2hvd0l0ZW1zIGl0ZW1zLnNsaWNlIDAsIDMwMFxuICAgICAgICAgICAgQHNlbGVjdCAwXG4gICAgICAgICAgICBAcG9zaXRpb25MaXN0KClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGhpZGVMaXN0KClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIGNvbXBsZXRlOiAtPlxuXG4gICAgICAgIGlmIEBjb21tYW5kTGlzdD8gYW5kIEBjb21tYW5kTGlzdC5saW5lKEBzZWxlY3RlZCkuc3RhcnRzV2l0aChzbGFzaC5iYXNlbmFtZSBAZ2V0VGV4dCgpKSBhbmQgbm90IEBnZXRUZXh0KCkudHJpbSgpLmVuZHNXaXRoKCcvJylcbiAgICAgICAgICAgIEBzZXRUZXh0IHNsYXNoLmpvaW4oc2xhc2guZGlyKEBnZXRUZXh0KCkpLCBAY29tbWFuZExpc3QubGluZShAc2VsZWN0ZWQpKVxuICAgICAgICAgICAgaWYgc2xhc2guZGlyRXhpc3RzIEBnZXRUZXh0KClcbiAgICAgICAgICAgICAgICBAc2V0VGV4dCBAZ2V0VGV4dCgpICsgJy8nXG4gICAgICAgICAgICAgICAgQGNoYW5nZWQgQGdldFRleHQoKVxuICAgICAgICAgICAgdHJ1ZVxuICAgICAgICBlbHNlIGlmIG5vdCBAZ2V0VGV4dCgpLnRyaW0oKS5lbmRzV2l0aCgnLycpIGFuZCBzbGFzaC5kaXJFeGlzdHMgQGdldFRleHQoKVxuICAgICAgICAgICAgQHNldFRleHQgQGdldFRleHQoKSArICcvJ1xuICAgICAgICAgICAgQGNoYW5nZWQgQGdldFRleHQoKVxuICAgICAgICAgICAgdHJ1ZSAgICAgICAgICAgIFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwcm9qZWN0cyA9IHBvc3QuZ2V0ICdpbmRleGVyJywgJ3Byb2plY3RzJ1xuICAgICAgICAgICAgZm9yIHAgaW4gT2JqZWN0LmtleXMocHJvamVjdHMpLnNvcnQoKVxuICAgICAgICAgICAgICAgIGlmIHAuc3RhcnRzV2l0aCBAZ2V0VGV4dCgpXG4gICAgICAgICAgICAgICAgICAgIHBkaXIgPSBwcm9qZWN0c1twXS5kaXJcbiAgICAgICAgICAgICAgICAgICAgcGRpciA9IHNsYXNoLmpvaW4ocGRpciwgJ2NvZmZlZScpIGlmIHNsYXNoLmRpckV4aXN0cyBzbGFzaC5qb2luIHBkaXIsICdjb2ZmZWUnXG4gICAgICAgICAgICAgICAgICAgIEBzZXRUZXh0IHBkaXIgKyAnLydcbiAgICAgICAgICAgICAgICAgICAgQGNoYW5nZWQgQGdldFRleHQoKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgc3VwZXIoKVxuICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICBcblxuICAgIHdlaWdodDogKGl0ZW0sIG9wdCkgPT4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGl0ZW0uYm9udXMgaWYgaXRlbS5ib251cz9cbiAgICAgICAgXG4gICAgICAgIGYgPSBpdGVtLmZpbGVcbiAgICAgICAgciA9IGl0ZW0udGV4dFxuICAgICAgICBiID0gc2xhc2guZmlsZSBmXG4gICAgICAgIG4gPSBzbGFzaC5iYXNlIGZcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgcmVsQm9udXMgPSAwXG4gICAgICAgIG5hbWVCb251cyA9IDBcbiAgICAgICAgaWYgb3B0LmN1cnJlbnRUZXh0Py5sZW5ndGhcbiAgICAgICAgICAgIHJlbEJvbnVzICA9IHIuc3RhcnRzV2l0aChvcHQuY3VycmVudFRleHQpIGFuZCA2NTUzNSAqIChvcHQuY3VycmVudFRleHQubGVuZ3RoL3IubGVuZ3RoKSBvciAwIFxuICAgICAgICAgICAgbmFtZUJvbnVzID0gbi5zdGFydHNXaXRoKG9wdC5jdXJyZW50VGV4dCkgYW5kIDIxODQgICogKG9wdC5jdXJyZW50VGV4dC5sZW5ndGgvbi5sZW5ndGgpIG9yIDBcbiAgICAgICAgICAgXG4gICAgICAgIGV4dGVuc2lvbkJvbnVzID0gc3dpdGNoIHNsYXNoLmV4dCBiXG4gICAgICAgICAgICB3aGVuICdjb2ZmZWUnLCAna29mZmVlJyAgIHRoZW4gMTAwMFxuICAgICAgICAgICAgd2hlbiAnY3BwJywgJ2hwcCcsICdoJyAgICB0aGVuIDkwXG4gICAgICAgICAgICB3aGVuICdtZCcsICdzdHlsJywgJ3B1ZycgIHRoZW4gNTBcbiAgICAgICAgICAgIHdoZW4gJ25vb24nICAgICAgICAgICAgICAgdGhlbiAyNVxuICAgICAgICAgICAgd2hlbiAnanMnLCAnanNvbicsICdodG1sJyB0aGVuIC0xMFxuICAgICAgICAgICAgZWxzZSAwIFxuICAgICAgICBcbiAgICAgICAgaWYgQGZpbGUgYW5kIHNsYXNoLmV4dChAZmlsZSkgPT0gc2xhc2guZXh0IGJcbiAgICAgICAgICAgIGV4dGVuc2lvbkJvbnVzICs9IDEwMDBcbiAgICAgICAgXG4gICAgICAgIGxlbmd0aFBlbmFsdHkgPSBzbGFzaC5kaXIoZikubGVuZ3RoXG4gICAgICAgICAgICBcbiAgICAgICAgdXBkaXJQZW5hbHR5ICAgPSByLnNwbGl0KCcuLi8nKS5sZW5ndGggKiA4MTlcbiAgICAgICAgXG4gICAgICAgIGlmIGYuc3RhcnRzV2l0aCBAZGlyXG4gICAgICAgICAgICBsb2NhbEJvbnVzID0gTWF0aC5tYXggMCwgKDUtci5zcGxpdCgnLycpLmxlbmd0aCkgKiA0MDk1XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGxvY2FsQm9udXMgPSBNYXRoLm1heCAwLCAoNS1yLnNwbGl0KCcuLi8nKS5sZW5ndGgpICogODE5XG4gICAgICAgIFxuICAgICAgICBpdGVtLndlaWdodCA9IGxvY2FsQm9udXMgKyByZWxCb251cyArIG5hbWVCb251cyArIGV4dGVuc2lvbkJvbnVzIC0gbGVuZ3RoUGVuYWx0eSAtIHVwZGlyUGVuYWx0eVxuICAgICAgICAgICAgXG4gICAgd2VpZ2h0ZWRJdGVtczogKGl0ZW1zLCBvcHQpIC0+IFxuICAgICAgICBcbiAgICAgICAgaXRlbXMuc29ydCAoYSxiKSA9PiBAd2VpZ2h0KGIsIG9wdCkgLSBAd2VpZ2h0KGEsIG9wdClcbiAgICAgICAgaXRlbXNcbiAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgXG4gICAgICAgIFxuICAgIGxpc3RJdGVtczogKG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIG9wdCA/PSB7fVxuICAgICAgICBvcHQubWF4SXRlbXMgPz0gMjAwXG4gICAgICAgIG9wdC5mbGF0ID89IHRydWVcbiAgICAgICAgXG4gICAgICAgIGljb25TcGFuID0gKGZpbGUpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNsYXNzTmFtZSA9IEZpbGUuaWNvbkNsYXNzTmFtZSBmaWxlXG4gICAgICAgICAgICBcIjxzcGFuIGNsYXNzPScje2NsYXNzTmFtZX0gb3BlbkZpbGVJY29uJy8+XCJcbiAgICAgICAgXG4gICAgICAgIGl0ZW1zID0gW11cbiAgICAgICAgXG4gICAgICAgIEBsYXN0RmlsZUluZGV4ID0gMFxuICAgICAgICBcbiAgICAgICAgQGRpciA9IHNsYXNoLnJlc29sdmUgJ34nIGlmIG5vdCBAZGlyP1xuICAgICAgICBcbiAgICAgICAgaWYgQGhpc3Rvcnk/IGFuZCBub3Qgb3B0LmN1cnJlbnRUZXh0IGFuZCBAaGlzdG9yeS5sZW5ndGggPiAxXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGYgPSBAaGlzdG9yeVtAaGlzdG9yeS5sZW5ndGgtMl1cbiAgICAgICAgICAgIGl0ZW0gPSBPYmplY3QuY3JlYXRlIG51bGxcbiAgICAgICAgICAgIGl0ZW0udGV4dCA9IHJlbGF0aXZlIGYsIEBkaXJcbiAgICAgICAgICAgIGl0ZW0ubGluZSA9IGljb25TcGFuIGZcbiAgICAgICAgICAgIGl0ZW0uZmlsZSA9IGZcbiAgICAgICAgICAgIGl0ZW0uYm9udXMgPSAxMDQ4NTc1XG4gICAgICAgICAgICBpdGVtcy5wdXNoIGl0ZW1cbiAgICAgICAgICAgIEBsYXN0RmlsZUluZGV4ID0gMFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBmb3IgZmlsZSBpbiBAZmlsZXNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmVsID0gcmVsYXRpdmUgZmlsZSwgQGRpclxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiByZWwubGVuZ3RoXG4gICAgICAgICAgICAgICAgaXRlbSA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICAgICAgICAgIGl0ZW0ubGluZSA9IGljb25TcGFuIGZpbGVcbiAgICAgICAgICAgICAgICBpdGVtLnRleHQgPSByZWxcbiAgICAgICAgICAgICAgICBpdGVtLmZpbGUgPSBmaWxlXG4gICAgICAgICAgICAgICAgaXRlbXMucHVzaCBpdGVtXG5cbiAgICAgICAgaXRlbXMgPSBAd2VpZ2h0ZWRJdGVtcyBpdGVtcywgb3B0XG4gICAgICAgIGl0ZW1zID0gXy51bmlxQnkgaXRlbXMsIChvKSAtPiBvLnRleHRcbiAgICAgICAgXG4gICAgICAgIGl0ZW1zLnNsaWNlIDAsIG9wdC5tYXhJdGVtc1xuICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHNob3dIaXN0b3J5OiAoKSAtPlxuXG4gICAgICAgIGlmIEBoaXN0b3J5Lmxlbmd0aCA+IDEgYW5kIEBzZWxlY3RlZCA8PSAwXG4gICAgICAgICAgICBpdGVtcyA9IFtdXG4gICAgICAgICAgICBib251cyA9IDEwNDg1NzVcbiAgICAgICAgICAgIGZvciBmIGluIEBoaXN0b3J5XG4gICAgICAgICAgICAgICAgaXRlbSA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICAgICAgICAgIGl0ZW0udGV4dCA9IHJlbGF0aXZlIGYsIEBkaXJcbiAgICAgICAgICAgICAgICBpdGVtLmZpbGUgPSBmXG4gICAgICAgICAgICAgICAgaXRlbS5ib251cyA9IGJvbnVzXG4gICAgICAgICAgICAgICAgaXRlbXMucHVzaCBpdGVtXG4gICAgICAgICAgICAgICAgYm9udXMgLT0gMSBcbiAgICAgICAgICAgIGl0ZW1zLnBvcCgpXG4gICAgICAgICAgICBAc2hvd0l0ZW1zIGl0ZW1zXG4gICAgICAgICAgICBAc2VsZWN0IGl0ZW1zLmxlbmd0aC0xXG4gICAgICAgICAgICBAc2V0QW5kU2VsZWN0VGV4dCBpdGVtc1tAc2VsZWN0ZWRdLnRleHRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgJ3VuaGFuZGxlZCdcblxuICAgIHNob3dGaXJzdDogKCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBjb21tYW5kTGlzdCBhbmQgQHNlbGVjdGVkID09IEBjb21tYW5kTGlzdC5tZXRhLm1ldGFzLmxlbmd0aCAtIDFcbiAgICAgICAgICAgIEBzaG93SXRlbXMgQGxpc3RJdGVtcygpXG4gICAgICAgICAgICBAc2VsZWN0IDBcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgJ3VuaGFuZGxlZCdcbiAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgIFxuICAgIGNhbmNlbDogKG5hbWUpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBuYW1lID09IEBuYW1lc1swXSAjIGNvbW1hbmQrcCBjb21tYW5kK3AgdG8gb3BlbiBwcmV2aW91cyBmaWxlXG4gICAgICAgICAgICBpZiBAY29tbWFuZExpc3Q/IGFuZCBAbGFzdEZpbGVJbmRleCA9PSBAc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICByZXR1cm4gQGV4ZWN1dGUoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBzdXBlciBuYW1lXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgICAgIFxuICAgIHN0YXJ0OiAobmFtZSkgLT4gXG4gICAgICAgIFxuICAgICAgICBAc2V0TmFtZSBuYW1lXG4gICAgICAgIFxuICAgICAgICBpZiBAY29tbWFuZGxpbmUubGFzdEZvY3VzID09ICdjb21tYW5kbGluZS1lZGl0b3InID09IHdpbmRvdy5sYXN0Rm9jdXNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGZpbGUgPSB3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICAgICBpZiBkaXIgPSBzbGFzaC5yZXNvbHZlIEBjb21tYW5kbGluZS50ZXh0KClcbiAgICAgICAgICAgICAgICBAZGlyID0gZGlyXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGRpciA9IHNsYXNoLmRpcihAZmlsZSkgPyBwcm9jZXNzLmN3ZCgpXG4gICAgICAgIFxuICAgICAgICBlbHNlIGlmIEBjb21tYW5kbGluZS5sYXN0Rm9jdXMgPT0gJ3NoZWxmJyBvciBAY29tbWFuZGxpbmUubGFzdEZvY3VzLnN0YXJ0c1dpdGggJ0ZpbGVCcm93c2VyJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpdGVtID0gd2luZG93LmZpbGVicm93c2VyLmxhc3RVc2VkQ29sdW1uKCkucGFyZW50XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN3aXRjaCBpdGVtLnR5cGVcbiAgICAgICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgICAgIEBmaWxlID0gd2luZG93LmVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgICAgICAgICBAZGlyICA9IGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgIHdoZW4gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgIEBmaWxlID0gaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgIEBkaXIgID0gc2xhc2guZGlyIEBmaWxlXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBlbHNlIGlmIHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGU/XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBmaWxlID0gd2luZG93LmVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgQGRpciAgPSBzbGFzaC5kaXIgQGZpbGVcbiAgICAgICAgICAgIFxuICAgICAgICBlbHNlIFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZmlsZSA9IG51bGxcbiAgICAgICAgICAgIEBkaXIgID0gcHJvY2Vzcy5jd2QoKVxuICAgICAgICAgICAgXG4gICAgICAgIEBmaWxlcyA9IFByb2plY3RzLmZpbGVzIEBkaXJcbiAgICAgICAgXG4gICAgICAgIEBsb2FkU3RhdGUoKVxuICAgICAgICBAc2hvd0xpc3QoKVxuICAgICAgICBAc2hvd0l0ZW1zIEBsaXN0SXRlbXMoKVxuICAgICAgICBAZ3JhYkZvY3VzKClcbiAgICAgICAgQHNlbGVjdCAwICBcbiAgICAgICAgXG4gICAgICAgIHRleHQ6ICAgQGNvbW1hbmRMaXN0LmxpbmUgQHNlbGVjdGVkXG4gICAgICAgIHNlbGVjdDogdHJ1ZVxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwXG4gICAgICAgIFxuICAgIGV4ZWN1dGU6IChjb21tYW5kKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQHNlbGVjdGVkIDwgMCB0aGVuIHJldHVybiBzdGF0dXM6J2ZhaWxlZCdcbiAgICAgICAgICAgIFxuICAgICAgICBwYXRoID0gQGNvbW1hbmRMaXN0Py5saW5lIEBzZWxlY3RlZFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgQGhpZGVMaXN0KClcblxuICAgICAgICBpZiB2YWxpZCBwYXRoXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFtmaWxlLCBwb3NdID0gc2xhc2guc3BsaXRGaWxlUG9zIHBhdGhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZmlsZSA9IEByZXNvbHZlZFBhdGggcGF0aFxuICAgICAgICAgICAgZmlsZSA9IHNsYXNoLmpvaW5GaWxlUG9zIGZpbGUsIHBvc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBAbmFtZSA9PSAnbmV3IHdpbmRvdydcbiAgICAgICAgICAgICAgICBwb3N0LnRvTWFpbiAnbmV3V2luZG93V2l0aEZpbGUnLCBmaWxlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG9GaWxlJywgZmlsZTpmaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHN1cGVyIGZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHRleHQ6ICAgZmlsZVxuICAgICAgICAgICAgZm9jdXM6ICAnZWRpdG9yJ1xuICAgICAgICAgICAgc2hvdzogICAnZWRpdG9yJ1xuICAgICAgICAgICAgc3RhdHVzOiAnb2snXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHN0YXR1czogJ2ZhaWxlZCdcbiAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgIFxuICAgIFxuICAgIHJlc29sdmVkUGF0aDogKHAsIHBhcmVudD1AZGlyKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIChwYXJlbnQgPyBzbGFzaC5yZXNvbHZlICd+JykgaWYgbm90IHA/XG4gICAgICAgIGlmIHBbMF0gaW4gWyd+JywgJy8nXSBvciBwWzFdID09ICc6J1xuICAgICAgICAgICAgc2xhc2gucmVzb2x2ZSBwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNsYXNoLnJlc29sdmUgc2xhc2guam9pbiBwYXJlbnQsIHBcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICBcbiAgICBcbiAgICBoYW5kbGVNb2RLZXlDb21ib0V2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBldmVudCkgLT4gXG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgIHRoZW4gcmV0dXJuIEBzaG93SGlzdG9yeSgpXG4gICAgICAgICAgICB3aGVuICdkb3duJyB0aGVuIHJldHVybiBAc2hvd0ZpcnN0KClcbiAgICAgICAgc3VwZXIgbW9kLCBrZXksIGNvbWJvLCBldmVudFxuXG5tb2R1bGUuZXhwb3J0cyA9IE9wZW5cbiJdfQ==
//# sourceURL=../../coffee/commands/open.coffee