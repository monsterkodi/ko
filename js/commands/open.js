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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3Blbi5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvY29tbWFuZHMiLCJzb3VyY2VzIjpbIm9wZW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHVHQUFBO0lBQUE7Ozs7QUFRQSxNQUF5QyxPQUFBLENBQVEsS0FBUixDQUF6QyxFQUFFLFNBQUYsRUFBSyxpQkFBTCxFQUFZLGVBQVosRUFBa0IsZUFBbEIsRUFBd0IsaUJBQXhCLEVBQStCOztBQUUvQixRQUFBLEdBQVksT0FBQSxDQUFRLG1CQUFSOztBQUNaLElBQUEsR0FBWSxPQUFBLENBQVEsZUFBUjs7QUFDWixPQUFBLEdBQVksT0FBQSxDQUFRLHdCQUFSOztBQUNaLE1BQUEsR0FBWSxPQUFBLENBQVEsa0JBQVI7O0FBQ1osTUFBQSxHQUFZLE9BQUEsQ0FBUSxrQkFBUjs7QUFDWixLQUFBLEdBQVksT0FBQSxDQUFRLE9BQVI7O0FBRVosUUFBQSxHQUFXLFNBQUMsR0FBRCxFQUFNLEVBQU47QUFFUCxRQUFBO0lBQUEsQ0FBQSxHQUFJLEtBQUssQ0FBQyxRQUFOLENBQWUsR0FBZixFQUFvQixFQUFwQjtJQUVKLElBQUcsQ0FBQyxDQUFDLFVBQUYsQ0FBYSxRQUFiLENBQUg7UUFDSSxLQUFBLEdBQVEsS0FBSyxDQUFDLEtBQU4sQ0FBWSxHQUFaO1FBQ1IsSUFBRyxLQUFLLENBQUMsTUFBTixHQUFlLENBQUMsQ0FBQyxNQUFwQjtZQUNJLENBQUEsR0FBSSxNQURSO1NBRko7O0lBSUEsSUFBRyxHQUFHLENBQUMsTUFBSixHQUFhLENBQUMsQ0FBQyxNQUFsQjtRQUNJLENBQUEsR0FBSSxJQURSOztXQUVBO0FBVk87O0FBWUw7OztJQUVDLGNBQUMsV0FBRDs7O1FBRUMsc0NBQU0sV0FBTjtRQUVBLElBQUksQ0FBQyxFQUFMLENBQVEsTUFBUixFQUFnQixJQUFDLENBQUEsTUFBakI7UUFFQSxJQUFDLENBQUEsS0FBRCxHQUFZLENBQUMsTUFBRCxFQUFTLFlB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QSxJQUFBLEtBQWMsR0FBZCxDQUFBLElBQXNCLENBQUUsQ0FBQSxDQUFBLENBQUYsS0FBUSxHQUFqQzttQkFDSSxLQUFLLENBQUMsT0FBTixDQUFjLENBQWQsRUFESjtTQUFBLE1BQUE7bUJBR0ksS0FBSyxDQUFDLE9BQU4sQ0FBYyxLQUFLLENBQUMsSUFBTixDQUFXLE1BQVgsRUFBbUIsQ0FBbkIsQ0FBZCxFQUhKOztJQUhVOzttQkFjZCxzQkFBQSxHQUF3QixTQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsS0FBWCxFQUFrQixLQUFsQjtBQUVwQixnQkFBTyxLQUFQO0FBQUEsaUJBQ1MsSUFEVDtBQUNxQix1QkFBTyxJQUFDLENBQUEsV0FBRCxDQUFBO0FBRDVCLGlCQUVTLE1BRlQ7QUFFcUIsdUJBQU8sSUFBQyxDQUFBLFNBQUQsQ0FBQTtBQUY1QjtlQUdBLGlEQUFNLEdBQU4sRUFBVyxHQUFYLEVBQWdCLEtBQWhCLEVBQXVCLEtBQXZCO0lBTG9COzs7O0dBclZUOztBQTRWbkIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMFxuMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgMCAwMDBcbjAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwXG4gMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgXywgZW1wdHksIGtsb2csIHBvc3QsIHNsYXNoLCB2YWxpZCB9ID0gcmVxdWlyZSAna3hrJ1xuICBcblByb2plY3RzICA9IHJlcXVpcmUgJy4uL3Rvb2xzL3Byb2plY3RzJ1xuRmlsZSAgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvZmlsZSdcbkNvbW1hbmQgICA9IHJlcXVpcmUgJy4uL2NvbW1hbmRsaW5lL2NvbW1hbmQnXG5yZW5kZXIgICAgPSByZXF1aXJlICcuLi9lZGl0b3IvcmVuZGVyJ1xuc3ludGF4ICAgID0gcmVxdWlyZSAnLi4vZWRpdG9yL3N5bnRheCdcbmZ1enp5ICAgICA9IHJlcXVpcmUgJ2Z1enp5J1xuICAgICAgICAgICAgICAgICBcbnJlbGF0aXZlID0gKHJlbCwgdG8pIC0+XG4gICAgXG4gICAgciA9IHNsYXNoLnJlbGF0aXZlIHJlbCwgdG9cblxuICAgIGlmIHIuc3RhcnRzV2l0aCAnLi4vLi4vJyBcbiAgICAgICAgdGlsZGUgPSBzbGFzaC50aWxkZSByZWxcbiAgICAgICAgaWYgdGlsZGUubGVuZ3RoIDwgci5sZW5ndGhcbiAgICAgICAgICAgIHIgPSB0aWxkZVxuICAgIGlmIHJlbC5sZW5ndGggPCByLmxlbmd0aCAgICBcbiAgICAgICAgciA9IHJlbFxuICAgIHIgICAgXG5cbmNsYXNzIE9wZW4gZXh0ZW5kcyBDb21tYW5kXG5cbiAgICBAOiAoY29tbWFuZGxpbmUpIC0+XG4gICAgICAgIFxuICAgICAgICBzdXBlciBjb21tYW5kbGluZVxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnZmlsZScsIEBvbkZpbGVcbiAgICAgICAgXG4gICAgICAgIEBuYW1lcyAgICA9IFtcIm9wZW5cIiwgXCJuZXcgd2luZG93XCJdXG4gICAgICAgIEBmaWxlcyAgICA9IFtdXG4gICAgICAgIEBmaWxlICAgICA9IG51bGxcbiAgICAgICAgQGRpciAgICAgID0gbnVsbFxuICAgICAgICBAcGtnICAgICAgPSBudWxsXG4gICAgICAgIEBzZWxlY3RlZCA9IDBcbiAgICAgICAgICBcbiAgICBvbkZpbGU6IChmaWxlKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGlzQWN0aXZlKCkgXG4gICAgICAgICAgICBpZiBlbXB0eSBmaWxlXG4gICAgICAgICAgICAgICAgQHNldFRleHQgJydcbiAgICAgICAgICAgIGVsc2UgaWYgQGdldFRleHQoKSAhPSBzbGFzaC5maWxlIGZpbGVcbiAgICAgICAgICAgICAgICBAc2V0VGV4dCBzbGFzaC50aWxkZSBmaWxlXG4gICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgXG5cbiAgICBjaGFuZ2VkOiAoY29tbWFuZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGNvbW1hbmQgPSBjb21tYW5kLnRyaW0oKVxuXG4gICAgICAgIFtmaWxlLCBwb3NdID0gc2xhc2guc3BsaXRGaWxlUG9zIGNvbW1hbmQgPyBAZ2V0VGV4dCgpLnRyaW0oKVxuXG4gICAgICAgIGl0ZW1zID0gQGxpc3RJdGVtcyBjdXJyZW50VGV4dDpjb21tYW5kLCBtYXhJdGVtczoxMDAwMFxuICAgICAgICBcbiAgICAgICAgaWYgY29tbWFuZC5sZW5ndGhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZnV6emllZCA9IGZ1enp5LmZpbHRlciBzbGFzaC5iYXNlbmFtZShmaWxlKSwgaXRlbXMsIGV4dHJhY3Q6IChvKSAtPiBvLnRleHQgICAgICAgICAgICBcbiAgICAgICAgICAgIGl0ZW1zID0gKGYub3JpZ2luYWwgZm9yIGYgaW4gZnV6emllZClcbiAgICAgICAgICAgIGl0ZW1zLnNvcnQgKGEsYikgLT4gYi53ZWlnaHQgLSBhLndlaWdodFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgaXRlbXMubGVuZ3RoXG4gICAgICAgICAgICBAc2hvd0l0ZW1zIGl0ZW1zLnNsaWNlIDAsIDMwMFxuICAgICAgICAgICAgQHNlbGVjdCAwXG4gICAgICAgICAgICBAcG9zaXRpb25MaXN0KClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGhpZGVMaXN0KClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIGNvbXBsZXRlOiAtPlxuXG4gICAgICAgIGlmIEBjb21tYW5kTGlzdD8gYW5kIEBjb21tYW5kTGlzdC5saW5lKEBzZWxlY3RlZCkuc3RhcnRzV2l0aChzbGFzaC5iYXNlbmFtZSBAZ2V0VGV4dCgpKSBhbmQgbm90IEBnZXRUZXh0KCkudHJpbSgpLmVuZHNXaXRoKCcvJylcbiAgICAgICAgICAgIEBzZXRUZXh0IHNsYXNoLmpvaW4oc2xhc2guZGlyKEBnZXRUZXh0KCkpLCBAY29tbWFuZExpc3QubGluZShAc2VsZWN0ZWQpKVxuICAgICAgICAgICAgaWYgc2xhc2guZGlyRXhpc3RzIEBnZXRUZXh0KClcbiAgICAgICAgICAgICAgICBAc2V0VGV4dCBAZ2V0VGV4dCgpICsgJy8nXG4gICAgICAgICAgICAgICAgQGNoYW5nZWQgQGdldFRleHQoKVxuICAgICAgICAgICAgdHJ1ZVxuICAgICAgICBlbHNlIGlmIG5vdCBAZ2V0VGV4dCgpLnRyaW0oKS5lbmRzV2l0aCgnLycpIGFuZCBzbGFzaC5kaXJFeGlzdHMgQGdldFRleHQoKVxuICAgICAgICAgICAgQHNldFRleHQgQGdldFRleHQoKSArICcvJ1xuICAgICAgICAgICAgQGNoYW5nZWQgQGdldFRleHQoKVxuICAgICAgICAgICAgdHJ1ZSAgICAgICAgICAgIFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwcm9qZWN0cyA9IHBvc3QuZ2V0ICdpbmRleGVyJywgJ3Byb2plY3RzJ1xuICAgICAgICAgICAgZm9yIHAgaW4gT2JqZWN0LmtleXMocHJvamVjdHMpLnNvcnQoKVxuICAgICAgICAgICAgICAgIGlmIHAuc3RhcnRzV2l0aCBAZ2V0VGV4dCgpXG4gICAgICAgICAgICAgICAgICAgIHBkaXIgPSBwcm9qZWN0c1twXS5kaXJcbiAgICAgICAgICAgICAgICAgICAgcGRpciA9IHNsYXNoLmpvaW4ocGRpciwgJ2NvZmZlZScpIGlmIHNsYXNoLmRpckV4aXN0cyBzbGFzaC5qb2luIHBkaXIsICdjb2ZmZWUnXG4gICAgICAgICAgICAgICAgICAgIEBzZXRUZXh0IHBkaXIgKyAnLydcbiAgICAgICAgICAgICAgICAgICAgQGNoYW5nZWQgQGdldFRleHQoKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgc3VwZXIoKVxuICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICBcblxuICAgIHdlaWdodDogKGl0ZW0sIG9wdCkgPT4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGl0ZW0uYm9udXMgaWYgaXRlbS5ib251cz9cbiAgICAgICAgXG4gICAgICAgIGYgPSBpdGVtLmZpbGVcbiAgICAgICAgciA9IGl0ZW0udGV4dFxuICAgICAgICBiID0gc2xhc2guZmlsZSBmXG4gICAgICAgIG4gPSBzbGFzaC5iYXNlIGZcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgcmVsQm9udXMgPSAwXG4gICAgICAgIG5hbWVCb251cyA9IDBcbiAgICAgICAgaWYgb3B0LmN1cnJlbnRUZXh0Py5sZW5ndGhcbiAgICAgICAgICAgIHJlbEJvbnVzICA9IHIuc3RhcnRzV2l0aChvcHQuY3VycmVudFRleHQpIGFuZCA2NTUzNSAqIChvcHQuY3VycmVudFRleHQubGVuZ3RoL3IubGVuZ3RoKSBvciAwIFxuICAgICAgICAgICAgbmFtZUJvbnVzID0gbi5zdGFydHNXaXRoKG9wdC5jdXJyZW50VGV4dCkgYW5kIDIxODQgICogKG9wdC5jdXJyZW50VGV4dC5sZW5ndGgvbi5sZW5ndGgpIG9yIDBcbiAgICAgICAgICAgXG4gICAgICAgIGV4dGVuc2lvbkJvbnVzID0gc3dpdGNoIHNsYXNoLmV4dCBiXG4gICAgICAgICAgICB3aGVuICdjb2ZmZWUnLCAna29mZmVlJyAgIHRoZW4gMTAwMFxuICAgICAgICAgICAgd2hlbiAnY3BwJywgJ2hwcCcsICdoJyAgICB0aGVuIDkwXG4gICAgICAgICAgICB3aGVuICdtZCcsICdzdHlsJywgJ3B1ZycgIHRoZW4gNTBcbiAgICAgICAgICAgIHdoZW4gJ25vb24nICAgICAgICAgICAgICAgdGhlbiAyNVxuICAgICAgICAgICAgd2hlbiAnanMnLCAnanNvbicsICdodG1sJyB0aGVuIC0xMFxuICAgICAgICAgICAgZWxzZSAwIFxuICAgICAgICBcbiAgICAgICAgaWYgQGZpbGUgYW5kIHNsYXNoLmV4dChAZmlsZSkgPT0gc2xhc2guZXh0IGJcbiAgICAgICAgICAgIGV4dGVuc2lvbkJvbnVzICs9IDEwMDBcbiAgICAgICAgXG4gICAgICAgIGxlbmd0aFBlbmFsdHkgPSBzbGFzaC5kaXIoZikubGVuZ3RoXG4gICAgICAgICAgICBcbiAgICAgICAgdXBkaXJQZW5hbHR5ICAgPSByLnNwbGl0KCcuLi8nKS5sZW5ndGggKiA4MTlcbiAgICAgICAgXG4gICAgICAgIGlmIGYuc3RhcnRzV2l0aCBAZGlyXG4gICAgICAgICAgICBsb2NhbEJvbnVzID0gTWF0aC5tYXggMCwgKDUtci5zcGxpdCgnLycpLmxlbmd0aCkgKiA0MDk1XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGxvY2FsQm9udXMgPSBNYXRoLm1heCAwLCAoNS1yLnNwbGl0KCcuLi8nKS5sZW5ndGgpICogODE5XG4gICAgICAgIFxuICAgICAgICBpdGVtLndlaWdodCA9IGxvY2FsQm9udXMgKyByZWxCb251cyArIG5hbWVCb251cyArIGV4dGVuc2lvbkJvbnVzIC0gbGVuZ3RoUGVuYWx0eSAtIHVwZGlyUGVuYWx0eVxuICAgICAgICAgICAgXG4gICAgd2VpZ2h0ZWRJdGVtczogKGl0ZW1zLCBvcHQpIC0+IFxuICAgICAgICBcbiAgICAgICAgaXRlbXMuc29ydCAoYSxiKSA9PiBAd2VpZ2h0KGIsIG9wdCkgLSBAd2VpZ2h0KGEsIG9wdClcbiAgICAgICAgaXRlbXNcbiAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgXG4gICAgICAgIFxuICAgIGxpc3RJdGVtczogKG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIG9wdCA/PSB7fVxuICAgICAgICBvcHQubWF4SXRlbXMgPz0gMjAwXG4gICAgICAgIG9wdC5mbGF0ID89IHRydWVcbiAgICAgICAgXG4gICAgICAgIGljb25TcGFuID0gKGZpbGUpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNsYXNzTmFtZSA9IEZpbGUuaWNvbkNsYXNzTmFtZSBmaWxlXG4gICAgICAgICAgICBcIjxzcGFuIGNsYXNzPScje2NsYXNzTmFtZX0gb3BlbkZpbGVJY29uJy8+XCJcbiAgICAgICAgXG4gICAgICAgIGl0ZW1zID0gW11cbiAgICAgICAgXG4gICAgICAgIEBsYXN0RmlsZUluZGV4ID0gMFxuICAgICAgICBcbiAgICAgICAgQGRpciA9IHNsYXNoLnJlc29sdmUgJ34nIGlmIG5vdCBAZGlyP1xuICAgICAgICBcbiAgICAgICAgaWYgQGhpc3Rvcnk/IGFuZCBub3Qgb3B0LmN1cnJlbnRUZXh0IGFuZCBAaGlzdG9yeS5sZW5ndGggPiAxXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGYgPSBAaGlzdG9yeVtAaGlzdG9yeS5sZW5ndGgtMl1cbiAgICAgICAgICAgIGl0ZW0gPSBPYmplY3QuY3JlYXRlIG51bGxcbiAgICAgICAgICAgIGl0ZW0udGV4dCA9IHJlbGF0aXZlIGYsIEBkaXJcbiAgICAgICAgICAgIGl0ZW0ubGluZSA9IGljb25TcGFuIGZcbiAgICAgICAgICAgIGl0ZW0uZmlsZSA9IGZcbiAgICAgICAgICAgIGl0ZW0uYm9udXMgPSAxMDQ4NTc1XG4gICAgICAgICAgICBpdGVtcy5wdXNoIGl0ZW1cbiAgICAgICAgICAgIEBsYXN0RmlsZUluZGV4ID0gMFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBAZmlsZXNcbiAgICAgICAgICAgIGZvciBmaWxlIGluIEBmaWxlc1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJlbCA9IHJlbGF0aXZlIGZpbGUsIEBkaXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiByZWwubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBPYmplY3QuY3JlYXRlIG51bGxcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5saW5lID0gaWNvblNwYW4gZmlsZVxuICAgICAgICAgICAgICAgICAgICBpdGVtLnRleHQgPSByZWxcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5maWxlID0gZmlsZVxuICAgICAgICAgICAgICAgICAgICBpdGVtcy5wdXNoIGl0ZW1cblxuICAgICAgICBpdGVtcyA9IEB3ZWlnaHRlZEl0ZW1zIGl0ZW1zLCBvcHRcbiAgICAgICAgaXRlbXMgPSBfLnVuaXFCeSBpdGVtcywgKG8pIC0+IG8udGV4dFxuICAgICAgICBcbiAgICAgICAgaXRlbXMuc2xpY2UgMCwgb3B0Lm1heEl0ZW1zXG4gICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgc2hvd0hpc3Rvcnk6ICgpIC0+XG5cbiAgICAgICAgaWYgQGhpc3RvcnkubGVuZ3RoID4gMSBhbmQgQHNlbGVjdGVkIDw9IDBcbiAgICAgICAgICAgIGl0ZW1zID0gW11cbiAgICAgICAgICAgIGJvbnVzID0gMTA0ODU3NVxuICAgICAgICAgICAgZm9yIGYgaW4gQGhpc3RvcnlcbiAgICAgICAgICAgICAgICBpdGVtID0gT2JqZWN0LmNyZWF0ZSBudWxsXG4gICAgICAgICAgICAgICAgaXRlbS50ZXh0ID0gcmVsYXRpdmUgZiwgQGRpclxuICAgICAgICAgICAgICAgIGl0ZW0uZmlsZSA9IGZcbiAgICAgICAgICAgICAgICBpdGVtLmJvbnVzID0gYm9udXNcbiAgICAgICAgICAgICAgICBpdGVtcy5wdXNoIGl0ZW1cbiAgICAgICAgICAgICAgICBib251cyAtPSAxIFxuICAgICAgICAgICAgaXRlbXMucG9wKClcbiAgICAgICAgICAgIEBzaG93SXRlbXMgaXRlbXNcbiAgICAgICAgICAgIEBzZWxlY3QgaXRlbXMubGVuZ3RoLTFcbiAgICAgICAgICAgIEBzZXRBbmRTZWxlY3RUZXh0IGl0ZW1zW0BzZWxlY3RlZF0udGV4dFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICAndW5oYW5kbGVkJ1xuXG4gICAgc2hvd0ZpcnN0OiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQGNvbW1hbmRMaXN0IGFuZCBAc2VsZWN0ZWQgPT0gQGNvbW1hbmRMaXN0Lm1ldGE/Lm1ldGFzPy5sZW5ndGggLSAxXG4gICAgICAgICAgICBAc2hvd0l0ZW1zIEBsaXN0SXRlbXMoKVxuICAgICAgICAgICAgQHNlbGVjdCAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgICd1bmhhbmRsZWQnXG4gICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICBcbiAgICBjYW5jZWw6IChuYW1lKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgbmFtZSA9PSBAbmFtZXNbMF0gIyBjb21tYW5kK3AgY29tbWFuZCtwIHRvIG9wZW4gcHJldmlvdXMgZmlsZVxuICAgICAgICAgICAgaWYgQGNvbW1hbmRMaXN0PyBhbmQgQGxhc3RGaWxlSW5kZXggPT0gQHNlbGVjdGVkXG4gICAgICAgICAgICAgICAgcmV0dXJuIEBleGVjdXRlKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgc3VwZXIgbmFtZVxuICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgIDAwMCAgIFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICAgICBcbiAgICBzdGFydDogKG5hbWUpIC0+IFxuICAgICAgICBcbiAgICAgICAgQHNldE5hbWUgbmFtZVxuICAgICAgICBcbiAgICAgICAga2xvZyAnb3Blbi5zdGFydCcgbmFtZVxuICAgICAgICBrbG9nICdvcGVuLnN0YXJ0IEBjb21tYW5kbGluZS5sYXN0Rm9jdXMnIEBjb21tYW5kbGluZS5sYXN0Rm9jdXNcbiAgICAgICAga2xvZyAnb3Blbi5zdGFydCB3aW5kb3cubGFzdEZvY3VzJyB3aW5kb3cubGFzdEZvY3VzXG4gICAgICAgIFxuICAgICAgICBpZiBAY29tbWFuZGxpbmUubGFzdEZvY3VzID09ICdjb21tYW5kbGluZS1lZGl0b3InID09IHdpbmRvdy5sYXN0Rm9jdXNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGZpbGUgPSB3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICAgICBpZiBkaXIgPSBzbGFzaC5yZXNvbHZlIEBjb21tYW5kbGluZS50ZXh0KClcbiAgICAgICAgICAgICAgICBAZGlyID0gZGlyXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGRpciA9IHNsYXNoLmRpcihAZmlsZSkgPyBwcm9jZXNzLmN3ZCgpXG4gICAgICAgIFxuICAgICAgICBlbHNlIGlmIEBjb21tYW5kbGluZS5sYXN0Rm9jdXMgPT0gJ3NoZWxmJyBvciBAY29tbWFuZGxpbmUubGFzdEZvY3VzLnN0YXJ0c1dpdGggJ0ZpbGVCcm93c2VyJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpdGVtID0gd2luZG93LmZpbGVicm93c2VyLmxhc3RVc2VkQ29sdW1uKCkucGFyZW50XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN3aXRjaCBpdGVtLnR5cGVcbiAgICAgICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgICAgIEBmaWxlID0gd2luZG93LmVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgICAgICAgICBAZGlyICA9IGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgIHdoZW4gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgIEBmaWxlID0gaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgIEBkaXIgID0gc2xhc2guZGlyIEBmaWxlXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBlbHNlIGlmIHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGU/XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBmaWxlID0gd2luZG93LmVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgQGRpciAgPSBzbGFzaC5kaXIgQGZpbGVcbiAgICAgICAgICAgIFxuICAgICAgICBlbHNlIFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZmlsZSA9IG51bGxcbiAgICAgICAgICAgIEBkaXIgID0gcHJvY2Vzcy5jd2QoKVxuICAgICAgICAgICAgXG4gICAgICAgIEBmaWxlcyA9IFByb2plY3RzLmZpbGVzIEBkaXJcbiAgICAgICAgXG4gICAgICAgIEBsb2FkU3RhdGUoKVxuICAgICAgICBAc2hvd0xpc3QoKVxuICAgICAgICBAc2hvd0l0ZW1zIEBsaXN0SXRlbXMoKVxuICAgICAgICBAZ3JhYkZvY3VzKClcbiAgICAgICAgQHNlbGVjdCAwICBcbiAgICAgICAgXG4gICAgICAgIHRleHQ6ICAgQGNvbW1hbmRMaXN0LmxpbmUgQHNlbGVjdGVkXG4gICAgICAgIHNlbGVjdDogdHJ1ZVxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwXG4gICAgICAgIFxuICAgIGV4ZWN1dGU6IChjb21tYW5kKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQHNlbGVjdGVkIDwgMCB0aGVuIHJldHVybiBzdGF0dXM6J2ZhaWxlZCdcbiAgICAgICAgICAgIFxuICAgICAgICBwYXRoID0gQGNvbW1hbmRMaXN0Py5saW5lIEBzZWxlY3RlZFxuICAgICAgICBcbiAgICAgICAgIyBrbG9nICdvcGVuLmV4ZWN1dGUnIGNvbW1hbmQsIHBhdGhcbiAgICAgICAgXG4gICAgICAgIEBoaWRlTGlzdCgpXG5cbiAgICAgICAgaWYgdmFsaWQgcGF0aFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBbZmlsZSwgcG9zXSA9IHNsYXNoLnNwbGl0RmlsZVBvcyBjb21tYW5kXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGtsb2cgJ29wZW4uZXhlY3V0ZScgZmlsZSwgcG9zXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZpbGUgPSBAcmVzb2x2ZWRQYXRoIHBhdGhcbiAgICAgICAgICAgIGZpbGUgPSBzbGFzaC5qb2luRmlsZVBvcyBmaWxlLCBwb3NcbiAgICAgICAgICAgIFxuICAgICAgICAgICAga2xvZyAnb3Blbi5leGVjdXRlJyBmaWxlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEBuYW1lID09ICduZXcgd2luZG93J1xuICAgICAgICAgICAgICAgIHBvc3QudG9NYWluICduZXdXaW5kb3dXaXRoRmlsZScsIGZpbGVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUb0ZpbGUnIGZpbGU6ZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBzdXBlciBmaWxlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB0ZXh0OiAgIGZpbGVcbiAgICAgICAgICAgIGZvY3VzOiAgJ2VkaXRvcidcbiAgICAgICAgICAgIHNob3c6ICAgJ2VkaXRvcidcbiAgICAgICAgICAgIHN0YXR1czogJ29rJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzdGF0dXM6ICdmYWlsZWQnXG4gICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwICBcbiAgICBcbiAgICByZXNvbHZlZFBhdGg6IChwLCBwYXJlbnQ9QGRpcikgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiAocGFyZW50ID8gc2xhc2gucmVzb2x2ZSAnficpIGlmIG5vdCBwP1xuICAgICAgICBpZiBwWzBdIGluIFsnficsICcvJ10gb3IgcFsxXSA9PSAnOidcbiAgICAgICAgICAgIHNsYXNoLnJlc29sdmUgcFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzbGFzaC5yZXNvbHZlIHNsYXNoLmpvaW4gcGFyZW50LCBwXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgXG4gICAgXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9FdmVudDogKG1vZCwga2V5LCBjb21ibywgZXZlbnQpIC0+IFxuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICd1cCcgICB0aGVuIHJldHVybiBAc2hvd0hpc3RvcnkoKVxuICAgICAgICAgICAgd2hlbiAnZG93bicgdGhlbiByZXR1cm4gQHNob3dGaXJzdCgpXG4gICAgICAgIHN1cGVyIG1vZCwga2V5LCBjb21ibywgZXZlbnRcblxubW9kdWxlLmV4cG9ydHMgPSBPcGVuXG4iXX0=
//# sourceURL=../../coffee/commands/open.coffee