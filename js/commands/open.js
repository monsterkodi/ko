// koffee 1.20.0

/*
 0000000   00000000   00000000  000   000
000   000  000   000  000       0000  000
000   000  00000000   0000000   000 0 000
000   000  000        000       000  0000
 0000000   000        00000000  000   000
 */
var Command, File, Open, Projects, _, empty, fuzzy, post, ref, relative, render, slash, syntax, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = Object.hasOwn;

ref = require('kxk'), _ = ref._, empty = ref.empty, post = ref.post, slash = ref.slash, valid = ref.valid;

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
                case 'kode':
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
            file = this.resolvedPath(path);
            file = slash.joinFilePos(file, pos);
            if (this.name === 'new window') {
                post.toMain('newWindowWithFile', file);
            } else {
                post.emit('jumpToFile', {
                    type: 'file',
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3Blbi5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvY29tbWFuZHMiLCJzb3VyY2VzIjpbIm9wZW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGlHQUFBO0lBQUE7Ozs7QUFRQSxNQUFtQyxPQUFBLENBQVEsS0FBUixDQUFuQyxFQUFFLFNBQUYsRUFBSyxpQkFBTCxFQUFZLGVBQVosRUFBa0IsaUJBQWxCLEVBQXlCOztBQUV6QixRQUFBLEdBQVksT0FBQSxDQUFRLG1CQUFSOztBQUNaLElBQUEsR0FBWSxPQUFBLENBQVEsZUFBUjs7QUFDWixPQUFBLEdBQVksT0FBQSxDQUFRLHdCQUFSOztBQUNaLE1BQUEsR0FBWSxPQUFBLENBQVEsa0JBQVI7O0FBQ1osTUFBQSxHQUFZLE9BQUEsQ0FBUSxrQkFBUjs7QUFDWixLQUFBLEdBQVksT0FBQSxDQUFRLE9BQVI7O0FBRVosUUFBQSxHQUFXLFNBQUMsR0FBRCxFQUFNLEVBQU47QUFFUCxRQUFBO0lBQUEsQ0FBQSxHQUFJLEtBQUssQ0FBQyxRQUFOLENBQWUsR0FBZixFQUFvQixFQUFwQjtJQUVKLElBQUcsQ0FBQyxDQUFDLFVBQUYsQ0FBYSxRQUFiLENBQUg7UUFDSSxLQUFBLEdBQVEsS0FBSyxDQUFDLEtBQU4sQ0FBWSxHQUFaO1FBQ1IsSUFBRyxLQUFLLENBQUMsTUFBTixHQUFlLENBQUMsQ0FBQyxNQUFwQjtZQUNJLENBQUEsR0FBSSxNQURSO1NBRko7O0lBSUEsSUFBRyxHQUFHLENBQUMsTUFBSixHQUFhLENBQUMsQ0FBQyxNQUFsQjtRQUNJLENBQUEsR0FBSSxJQURSOztXQUVBO0FBVk87O0FBWUw7OztJQUVDLGNBQUMsV0FBRDs7O1FBRUMsc0NBQU0sV0FBTjtRQUVBLElBQUksQ0FBQyxFQUFMLENBQVEsTUFBUixFQUFnQixJQUFDLENBQUEsTUFBakI7UUFFQSxJQUFDLENBQUEsS0FBRCxHQUFZLENBQUMsTUFBRCxFQUFTLFlBQVQ7UUFDWixJQUFD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QSxHQUF3QixTQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsS0FBWCxFQUFrQixLQUFsQjtBQUVwQixnQkFBTyxLQUFQO0FBQUEsaUJBQ1MsSUFEVDtBQUNxQix1QkFBTyxJQUFDLENBQUEsV0FBRCxDQUFBO0FBRDVCLGlCQUVTLE1BRlQ7QUFFcUIsdUJBQU8sSUFBQyxDQUFBLFNBQUQsQ0FBQTtBQUY1QjtlQUdBLGlEQUFNLEdBQU4sRUFBVyxHQUFYLEVBQWdCLEtBQWhCLEVBQXVCLEtBQXZCO0lBTG9COzs7O0dBalZUOztBQXdWbkIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMFxuMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgMCAwMDBcbjAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwXG4gMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgXywgZW1wdHksIHBvc3QsIHNsYXNoLCB2YWxpZCB9ID0gcmVxdWlyZSAna3hrJ1xuICBcblByb2plY3RzICA9IHJlcXVpcmUgJy4uL3Rvb2xzL3Byb2plY3RzJ1xuRmlsZSAgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvZmlsZSdcbkNvbW1hbmQgICA9IHJlcXVpcmUgJy4uL2NvbW1hbmRsaW5lL2NvbW1hbmQnXG5yZW5kZXIgICAgPSByZXF1aXJlICcuLi9lZGl0b3IvcmVuZGVyJ1xuc3ludGF4ICAgID0gcmVxdWlyZSAnLi4vZWRpdG9yL3N5bnRheCdcbmZ1enp5ICAgICA9IHJlcXVpcmUgJ2Z1enp5J1xuICAgICAgICAgICAgICAgICBcbnJlbGF0aXZlID0gKHJlbCwgdG8pIC0+XG4gICAgXG4gICAgciA9IHNsYXNoLnJlbGF0aXZlIHJlbCwgdG9cblxuICAgIGlmIHIuc3RhcnRzV2l0aCAnLi4vLi4vJyBcbiAgICAgICAgdGlsZGUgPSBzbGFzaC50aWxkZSByZWxcbiAgICAgICAgaWYgdGlsZGUubGVuZ3RoIDwgci5sZW5ndGhcbiAgICAgICAgICAgIHIgPSB0aWxkZVxuICAgIGlmIHJlbC5sZW5ndGggPCByLmxlbmd0aCAgICBcbiAgICAgICAgciA9IHJlbFxuICAgIHIgICAgXG5cbmNsYXNzIE9wZW4gZXh0ZW5kcyBDb21tYW5kXG5cbiAgICBAOiAoY29tbWFuZGxpbmUpIC0+XG4gICAgICAgIFxuICAgICAgICBzdXBlciBjb21tYW5kbGluZVxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnZmlsZScsIEBvbkZpbGVcbiAgICAgICAgXG4gICAgICAgIEBuYW1lcyAgICA9IFtcIm9wZW5cIiwgXCJuZXcgd2luZG93XCJdXG4gICAgICAgIEBmaWxlcyAgICA9IFtdXG4gICAgICAgIEBmaWxlICAgICA9IG51bGxcbiAgICAgICAgQGRpciAgICAgID0gbnVsbFxuICAgICAgICBAcGtnICAgICAgPSBudWxsXG4gICAgICAgIEBzZWxlY3RlZCA9IDBcbiAgICAgICAgICBcbiAgICBvbkZpbGU6IChmaWxlKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGlzQWN0aXZlKCkgXG4gICAgICAgICAgICBpZiBlbXB0eSBmaWxlXG4gICAgICAgICAgICAgICAgQHNldFRleHQgJydcbiAgICAgICAgICAgIGVsc2UgaWYgQGdldFRleHQoKSAhPSBzbGFzaC5maWxlIGZpbGVcbiAgICAgICAgICAgICAgICBAc2V0VGV4dCBzbGFzaC50aWxkZSBmaWxlXG4gICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgXG5cbiAgICBjaGFuZ2VkOiAoY29tbWFuZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGNvbW1hbmQgPSBjb21tYW5kLnRyaW0oKVxuXG4gICAgICAgIFtmaWxlLCBwb3NdID0gc2xhc2guc3BsaXRGaWxlUG9zIGNvbW1hbmQgPyBAZ2V0VGV4dCgpLnRyaW0oKVxuXG4gICAgICAgIGl0ZW1zID0gQGxpc3RJdGVtcyBjdXJyZW50VGV4dDpjb21tYW5kLCBtYXhJdGVtczoxMDAwMFxuICAgICAgICBcbiAgICAgICAgaWYgY29tbWFuZC5sZW5ndGhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZnV6emllZCA9IGZ1enp5LmZpbHRlciBzbGFzaC5iYXNlbmFtZShmaWxlKSwgaXRlbXMsIGV4dHJhY3Q6IChvKSAtPiBvLnRleHQgICAgICAgICAgICBcbiAgICAgICAgICAgIGl0ZW1zID0gKGYub3JpZ2luYWwgZm9yIGYgaW4gZnV6emllZClcbiAgICAgICAgICAgIGl0ZW1zLnNvcnQgKGEsYikgLT4gYi53ZWlnaHQgLSBhLndlaWdodFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgaXRlbXMubGVuZ3RoXG4gICAgICAgICAgICBAc2hvd0l0ZW1zIGl0ZW1zLnNsaWNlIDAgMzAwXG4gICAgICAgICAgICBAc2VsZWN0IDBcbiAgICAgICAgICAgIEBwb3NpdGlvbkxpc3QoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaGlkZUxpc3QoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgY29tcGxldGU6IC0+XG5cbiAgICAgICAgaWYgQGNvbW1hbmRMaXN0PyBhbmQgQGNvbW1hbmRMaXN0LmxpbmUoQHNlbGVjdGVkKS5zdGFydHNXaXRoKHNsYXNoLmJhc2VuYW1lIEBnZXRUZXh0KCkpIGFuZCBub3QgQGdldFRleHQoKS50cmltKCkuZW5kc1dpdGgoJy8nKVxuICAgICAgICAgICAgQHNldFRleHQgc2xhc2guam9pbihzbGFzaC5kaXIoQGdldFRleHQoKSksIEBjb21tYW5kTGlzdC5saW5lKEBzZWxlY3RlZCkpXG4gICAgICAgICAgICBpZiBzbGFzaC5kaXJFeGlzdHMgQGdldFRleHQoKVxuICAgICAgICAgICAgICAgIEBzZXRUZXh0IEBnZXRUZXh0KCkgKyAnLydcbiAgICAgICAgICAgICAgICBAY2hhbmdlZCBAZ2V0VGV4dCgpXG4gICAgICAgICAgICB0cnVlXG4gICAgICAgIGVsc2UgaWYgbm90IEBnZXRUZXh0KCkudHJpbSgpLmVuZHNXaXRoKCcvJykgYW5kIHNsYXNoLmRpckV4aXN0cyBAZ2V0VGV4dCgpXG4gICAgICAgICAgICBAc2V0VGV4dCBAZ2V0VGV4dCgpICsgJy8nXG4gICAgICAgICAgICBAY2hhbmdlZCBAZ2V0VGV4dCgpXG4gICAgICAgICAgICB0cnVlICAgICAgICAgICAgXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHByb2plY3RzID0gcG9zdC5nZXQgJ2luZGV4ZXInLCAncHJvamVjdHMnXG4gICAgICAgICAgICBmb3IgcCBpbiBPYmplY3Qua2V5cyhwcm9qZWN0cykuc29ydCgpXG4gICAgICAgICAgICAgICAgaWYgcC5zdGFydHNXaXRoIEBnZXRUZXh0KClcbiAgICAgICAgICAgICAgICAgICAgcGRpciA9IHByb2plY3RzW3BdLmRpclxuICAgICAgICAgICAgICAgICAgICBwZGlyID0gc2xhc2guam9pbihwZGlyLCAnY29mZmVlJykgaWYgc2xhc2guZGlyRXhpc3RzIHNsYXNoLmpvaW4gcGRpciwgJ2NvZmZlZSdcbiAgICAgICAgICAgICAgICAgICAgQHNldFRleHQgcGRpciArICcvJ1xuICAgICAgICAgICAgICAgICAgICBAY2hhbmdlZCBAZ2V0VGV4dCgpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICBzdXBlcigpXG4gICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgIFxuXG4gICAgd2VpZ2h0OiAoaXRlbSwgb3B0KSA9PiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gaXRlbS5ib251cyBpZiBpdGVtLmJvbnVzP1xuICAgICAgICBcbiAgICAgICAgZiA9IGl0ZW0uZmlsZVxuICAgICAgICByID0gaXRlbS50ZXh0XG4gICAgICAgIGIgPSBzbGFzaC5maWxlIGZcbiAgICAgICAgbiA9IHNsYXNoLmJhc2UgZlxuICAgICAgICAgICAgICAgIFxuICAgICAgICByZWxCb251cyA9IDBcbiAgICAgICAgbmFtZUJvbnVzID0gMFxuICAgICAgICBpZiBvcHQuY3VycmVudFRleHQ/Lmxlbmd0aFxuICAgICAgICAgICAgcmVsQm9udXMgID0gci5zdGFydHNXaXRoKG9wdC5jdXJyZW50VGV4dCkgYW5kIDY1NTM1ICogKG9wdC5jdXJyZW50VGV4dC5sZW5ndGgvci5sZW5ndGgpIG9yIDAgXG4gICAgICAgICAgICBuYW1lQm9udXMgPSBuLnN0YXJ0c1dpdGgob3B0LmN1cnJlbnRUZXh0KSBhbmQgMjE4NCAgKiAob3B0LmN1cnJlbnRUZXh0Lmxlbmd0aC9uLmxlbmd0aCkgb3IgMFxuICAgICAgICAgICBcbiAgICAgICAgZXh0ZW5zaW9uQm9udXMgPSBzd2l0Y2ggc2xhc2guZXh0IGJcbiAgICAgICAgICAgIHdoZW4gJ2NvZmZlZScgJ2tvZGUnICAgIHRoZW4gMTAwMFxuICAgICAgICAgICAgd2hlbiAnY3BwJyAnaHBwJyAnaCcgICAgdGhlbiA5MFxuICAgICAgICAgICAgd2hlbiAnbWQnICdzdHlsJyAncHVnJyAgdGhlbiA1MFxuICAgICAgICAgICAgd2hlbiAnbm9vbicgICAgICAgICAgICAgdGhlbiAyNVxuICAgICAgICAgICAgd2hlbiAnanMnICdqc29uJyAnaHRtbCcgdGhlbiAtMTBcbiAgICAgICAgICAgIGVsc2UgMCBcbiAgICAgICAgXG4gICAgICAgIGlmIEBmaWxlIGFuZCBzbGFzaC5leHQoQGZpbGUpID09IHNsYXNoLmV4dCBiXG4gICAgICAgICAgICBleHRlbnNpb25Cb251cyArPSAxMDAwXG4gICAgICAgIFxuICAgICAgICBsZW5ndGhQZW5hbHR5ID0gc2xhc2guZGlyKGYpLmxlbmd0aFxuICAgICAgICAgICAgXG4gICAgICAgIHVwZGlyUGVuYWx0eSAgID0gci5zcGxpdCgnLi4vJykubGVuZ3RoICogODE5XG4gICAgICAgIFxuICAgICAgICBpZiBmLnN0YXJ0c1dpdGggQGRpclxuICAgICAgICAgICAgbG9jYWxCb251cyA9IE1hdGgubWF4IDAsICg1LXIuc3BsaXQoJy8nKS5sZW5ndGgpICogNDA5NVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBsb2NhbEJvbnVzID0gTWF0aC5tYXggMCwgKDUtci5zcGxpdCgnLi4vJykubGVuZ3RoKSAqIDgxOVxuICAgICAgICBcbiAgICAgICAgaXRlbS53ZWlnaHQgPSBsb2NhbEJvbnVzICsgcmVsQm9udXMgKyBuYW1lQm9udXMgKyBleHRlbnNpb25Cb251cyAtIGxlbmd0aFBlbmFsdHkgLSB1cGRpclBlbmFsdHlcbiAgICAgICAgICAgIFxuICAgIHdlaWdodGVkSXRlbXM6IChpdGVtcywgb3B0KSAtPiBcbiAgICAgICAgXG4gICAgICAgIGl0ZW1zLnNvcnQgKGEsYikgPT4gQHdlaWdodChiLCBvcHQpIC0gQHdlaWdodChhLCBvcHQpXG4gICAgICAgIGl0ZW1zXG4gICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgIFxuICAgICAgICBcbiAgICBsaXN0SXRlbXM6IChvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBvcHQgPz0ge31cbiAgICAgICAgb3B0Lm1heEl0ZW1zID89IDIwMFxuICAgICAgICBvcHQuZmxhdCA/PSB0cnVlXG4gICAgICAgIFxuICAgICAgICBpY29uU3BhbiA9IChmaWxlKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBjbGFzc05hbWUgPSBGaWxlLmljb25DbGFzc05hbWUgZmlsZVxuICAgICAgICAgICAgXCI8c3BhbiBjbGFzcz0nI3tjbGFzc05hbWV9IG9wZW5GaWxlSWNvbicvPlwiXG4gICAgICAgIFxuICAgICAgICBpdGVtcyA9IFtdXG4gICAgICAgIFxuICAgICAgICBAbGFzdEZpbGVJbmRleCA9IDBcbiAgICAgICAgXG4gICAgICAgIEBkaXIgPSBzbGFzaC5yZXNvbHZlICd+JyBpZiBub3QgQGRpcj9cbiAgICAgICAgXG4gICAgICAgIGlmIEBoaXN0b3J5PyBhbmQgbm90IG9wdC5jdXJyZW50VGV4dCBhbmQgQGhpc3RvcnkubGVuZ3RoID4gMVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmID0gQGhpc3RvcnlbQGhpc3RvcnkubGVuZ3RoLTJdXG4gICAgICAgICAgICBpdGVtID0gT2JqZWN0LmNyZWF0ZSBudWxsXG4gICAgICAgICAgICBpdGVtLnRleHQgPSByZWxhdGl2ZSBmLCBAZGlyXG4gICAgICAgICAgICBpdGVtLmxpbmUgPSBpY29uU3BhbiBmXG4gICAgICAgICAgICBpdGVtLmZpbGUgPSBmXG4gICAgICAgICAgICBpdGVtLmJvbnVzID0gMTA0ODU3NVxuICAgICAgICAgICAgaXRlbXMucHVzaCBpdGVtXG4gICAgICAgICAgICBAbGFzdEZpbGVJbmRleCA9IDBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgQGZpbGVzXG4gICAgICAgICAgICBmb3IgZmlsZSBpbiBAZmlsZXNcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZWwgPSByZWxhdGl2ZSBmaWxlLCBAZGlyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgcmVsLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBpdGVtID0gT2JqZWN0LmNyZWF0ZSBudWxsXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ubGluZSA9IGljb25TcGFuIGZpbGVcbiAgICAgICAgICAgICAgICAgICAgaXRlbS50ZXh0ID0gcmVsXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZmlsZSA9IGZpbGVcbiAgICAgICAgICAgICAgICAgICAgaXRlbXMucHVzaCBpdGVtXG5cbiAgICAgICAgaXRlbXMgPSBAd2VpZ2h0ZWRJdGVtcyBpdGVtcywgb3B0XG4gICAgICAgIGl0ZW1zID0gXy51bmlxQnkgaXRlbXMsIChvKSAtPiBvLnRleHRcbiAgICAgICAgXG4gICAgICAgIGl0ZW1zLnNsaWNlIDAsIG9wdC5tYXhJdGVtc1xuICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHNob3dIaXN0b3J5OiAtPlxuXG4gICAgICAgIGlmIEBoaXN0b3J5Lmxlbmd0aCA+IDEgYW5kIEBzZWxlY3RlZCA8PSAwXG4gICAgICAgICAgICBpdGVtcyA9IFtdXG4gICAgICAgICAgICBib251cyA9IDEwNDg1NzVcbiAgICAgICAgICAgIGZvciBmIGluIEBoaXN0b3J5XG4gICAgICAgICAgICAgICAgaXRlbSA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICAgICAgICAgIGl0ZW0udGV4dCA9IHJlbGF0aXZlIGYsIEBkaXJcbiAgICAgICAgICAgICAgICBpdGVtLmZpbGUgPSBmXG4gICAgICAgICAgICAgICAgaXRlbS5ib251cyA9IGJvbnVzXG4gICAgICAgICAgICAgICAgaXRlbXMucHVzaCBpdGVtXG4gICAgICAgICAgICAgICAgYm9udXMgLT0gMSBcbiAgICAgICAgICAgIGl0ZW1zLnBvcCgpXG4gICAgICAgICAgICBAc2hvd0l0ZW1zIGl0ZW1zXG4gICAgICAgICAgICBAc2VsZWN0IGl0ZW1zLmxlbmd0aC0xXG4gICAgICAgICAgICBAc2V0QW5kU2VsZWN0VGV4dCBpdGVtc1tAc2VsZWN0ZWRdLnRleHRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgJ3VuaGFuZGxlZCdcblxuICAgIHNob3dGaXJzdDogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBjb21tYW5kTGlzdCBhbmQgQHNlbGVjdGVkID09IEBjb21tYW5kTGlzdC5tZXRhPy5tZXRhcz8ubGVuZ3RoIC0gMVxuICAgICAgICAgICAgQHNob3dJdGVtcyBAbGlzdEl0ZW1zKClcbiAgICAgICAgICAgIEBzZWxlY3QgMFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICAndW5oYW5kbGVkJ1xuICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgXG4gICAgY2FuY2VsOiAobmFtZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5hbWUgPT0gQG5hbWVzWzBdICMgY29tbWFuZCtwIGNvbW1hbmQrcCB0byBvcGVuIHByZXZpb3VzIGZpbGVcbiAgICAgICAgICAgIGlmIEBjb21tYW5kTGlzdD8gYW5kIEBsYXN0RmlsZUluZGV4ID09IEBzZWxlY3RlZFxuICAgICAgICAgICAgICAgIHJldHVybiBAZXhlY3V0ZSgpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHN1cGVyIG5hbWVcbiAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAgICAgXG4gICAgc3RhcnQ6IChuYW1lKSAtPiBcbiAgICAgICAgXG4gICAgICAgIEBzZXROYW1lIG5hbWVcbiAgICAgICAgXG4gICAgICAgICMga2xvZyAnb3Blbi5zdGFydCcgbmFtZVxuICAgICAgICAjIGtsb2cgJ29wZW4uc3RhcnQgQGNvbW1hbmRsaW5lLmxhc3RGb2N1cycgQGNvbW1hbmRsaW5lLmxhc3RGb2N1c1xuICAgICAgICAjIGtsb2cgJ29wZW4uc3RhcnQgd2luZG93Lmxhc3RGb2N1cycgd2luZG93Lmxhc3RGb2N1c1xuICAgICAgICBcbiAgICAgICAgaWYgQGNvbW1hbmRsaW5lLmxhc3RGb2N1cyA9PSAnY29tbWFuZGxpbmUtZWRpdG9yJyA9PSB3aW5kb3cubGFzdEZvY3VzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBmaWxlID0gd2luZG93LmVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgaWYgZGlyID0gc2xhc2gucmVzb2x2ZSBAY29tbWFuZGxpbmUudGV4dCgpXG4gICAgICAgICAgICAgICAgQGRpciA9IGRpclxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBkaXIgPSBzbGFzaC5kaXIoQGZpbGUpID8gcHJvY2Vzcy5jd2QoKVxuICAgICAgICBcbiAgICAgICAgZWxzZSBpZiBAY29tbWFuZGxpbmUubGFzdEZvY3VzID09ICdzaGVsZicgb3IgQGNvbW1hbmRsaW5lLmxhc3RGb2N1cy5zdGFydHNXaXRoICdGaWxlQnJvd3NlcidcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaXRlbSA9IHdpbmRvdy5maWxlYnJvd3Nlci5sYXN0VXNlZENvbHVtbigpLnBhcmVudFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICAgICAgd2hlbiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICBAZmlsZSA9IHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgICAgICAgICAgICAgQGRpciAgPSBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICB3aGVuICdmaWxlJ1xuICAgICAgICAgICAgICAgICAgICBAZmlsZSA9IGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICBAZGlyICA9IHNsYXNoLmRpciBAZmlsZVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgZWxzZSBpZiB3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlP1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZmlsZSA9IHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgICAgIEBkaXIgID0gc2xhc2guZGlyIEBmaWxlXG4gICAgICAgICAgICBcbiAgICAgICAgZWxzZSBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGZpbGUgPSBudWxsXG4gICAgICAgICAgICBAZGlyICA9IHByb2Nlc3MuY3dkKClcbiAgICAgICAgICAgIFxuICAgICAgICBAZmlsZXMgPSBQcm9qZWN0cy5maWxlcyBAZGlyXG4gICAgICAgIFxuICAgICAgICBAbG9hZFN0YXRlKClcbiAgICAgICAgQHNob3dMaXN0KClcbiAgICAgICAgQHNob3dJdGVtcyBAbGlzdEl0ZW1zKClcbiAgICAgICAgQGdyYWJGb2N1cygpXG4gICAgICAgIEBzZWxlY3QgMCAgXG4gICAgICAgIFxuICAgICAgICB0ZXh0OiAgIEBjb21tYW5kTGlzdC5saW5lIEBzZWxlY3RlZFxuICAgICAgICBzZWxlY3Q6IHRydWVcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMFxuICAgICAgICBcbiAgICBleGVjdXRlOiAoY29tbWFuZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBzZWxlY3RlZCA8IDAgdGhlbiByZXR1cm4gc3RhdHVzOidmYWlsZWQnXG4gICAgICAgICAgICBcbiAgICAgICAgcGF0aCA9IEBjb21tYW5kTGlzdD8ubGluZSBAc2VsZWN0ZWRcbiAgICAgICAgXG4gICAgICAgICMga2xvZyAnb3Blbi5leGVjdXRlJyBjb21tYW5kLCBwYXRoXG4gICAgICAgIFxuICAgICAgICBAaGlkZUxpc3QoKVxuXG4gICAgICAgIGlmIHZhbGlkIHBhdGhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgW2ZpbGUsIHBvc10gPSBzbGFzaC5zcGxpdEZpbGVQb3MgY29tbWFuZFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmaWxlID0gQHJlc29sdmVkUGF0aCBwYXRoXG4gICAgICAgICAgICBmaWxlID0gc2xhc2guam9pbkZpbGVQb3MgZmlsZSwgcG9zXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEBuYW1lID09ICduZXcgd2luZG93J1xuICAgICAgICAgICAgICAgIHBvc3QudG9NYWluICduZXdXaW5kb3dXaXRoRmlsZScgZmlsZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvRmlsZScgdHlwZTonZmlsZScgZmlsZTpmaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHN1cGVyIGZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHRleHQ6ICAgZmlsZVxuICAgICAgICAgICAgZm9jdXM6ICAnZWRpdG9yJ1xuICAgICAgICAgICAgc2hvdzogICAnZWRpdG9yJ1xuICAgICAgICAgICAgc3RhdHVzOiAnb2snXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHN0YXR1czogJ2ZhaWxlZCdcbiAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgIFxuICAgIFxuICAgIHJlc29sdmVkUGF0aDogKHAsIHBhcmVudD1AZGlyKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIChwYXJlbnQgPyBzbGFzaC5yZXNvbHZlICd+JykgaWYgbm90IHA/XG4gICAgICAgIGlmIHBbMF0gaW4gWyd+JywgJy8nXSBvciBwWzFdID09ICc6J1xuICAgICAgICAgICAgc2xhc2gucmVzb2x2ZSBwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNsYXNoLnJlc29sdmUgc2xhc2guam9pbiBwYXJlbnQsIHBcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICBcbiAgICBcbiAgICBoYW5kbGVNb2RLZXlDb21ib0V2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBldmVudCkgLT4gXG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgIHRoZW4gcmV0dXJuIEBzaG93SGlzdG9yeSgpXG4gICAgICAgICAgICB3aGVuICdkb3duJyB0aGVuIHJldHVybiBAc2hvd0ZpcnN0KClcbiAgICAgICAgc3VwZXIgbW9kLCBrZXksIGNvbWJvLCBldmVudFxuXG5tb2R1bGUuZXhwb3J0cyA9IE9wZW5cbiJdfQ==
//# sourceURL=../../coffee/commands/open.coffee