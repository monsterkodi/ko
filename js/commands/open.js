// koffee 1.3.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3Blbi5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsZ0hBQUE7SUFBQTs7OztBQVFBLE1BQWtELE9BQUEsQ0FBUSxLQUFSLENBQWxELEVBQUUsZUFBRixFQUFRLGlCQUFSLEVBQWUsaUJBQWYsRUFBc0IsaUJBQXRCLEVBQTZCLGlCQUE3QixFQUFvQyxXQUFwQyxFQUF3QyxXQUF4QyxFQUE0Qzs7QUFFNUMsUUFBQSxHQUFZLE9BQUEsQ0FBUSxtQkFBUjs7QUFDWixJQUFBLEdBQVksT0FBQSxDQUFRLGVBQVI7O0FBQ1osT0FBQSxHQUFZLE9BQUEsQ0FBUSx3QkFBUjs7QUFDWixNQUFBLEdBQVksT0FBQSxDQUFRLGtCQUFSOztBQUNaLE1BQUEsR0FBWSxPQUFBLENBQVEsa0JBQVI7O0FBQ1osS0FBQSxHQUFZLE9BQUEsQ0FBUSxPQUFSOztBQUVaLFFBQUEsR0FBVyxTQUFDLEdBQUQsRUFBTSxFQUFOO0FBRVAsUUFBQTtJQUFBLENBQUEsR0FBSSxLQUFLLENBQUMsUUFBTixDQUFlLEdBQWYsRUFBb0IsRUFBcEI7SUFFSixJQUFHLENBQUMsQ0FBQyxVQUFGLENBQWEsUUFBYixDQUFIO1FBQ0ksS0FBQSxHQUFRLEtBQUssQ0FBQyxLQUFOLENBQVksR0FBWjtRQUNSLElBQUcsS0FBSyxDQUFDLE1BQU4sR0FBZSxDQUFDLENBQUMsTUFBcEI7WUFDSSxDQUFBLEdBQUksTUFEUjtTQUZKOztJQUlBLElBQUcsR0FBRyxDQUFDLE1BQUosR0FBYSxDQUFDLENBQUMsTUFBbEI7UUFDSSxDQUFBLEdBQUksSUFEUjs7V0FFQTtBQVZPOztBQVlMOzs7SUFFVyxjQUFDLFdBQUQ7OztRQUVULHNDQUFNLFdBQU47UUFFQSxJQUFJLENBQUMsRUFBTCxDQUFRLE1BQVIsRUFBZ0IsSUFBQyxDQUFBLE1BQWpCO1FBRUEsSUFBQyxDQUFBLEtBQUQsR0FBWSxDQUFDLE1BQUQsRUFBUyxZQUFUO1FB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QixLQUFsQjtBQUVwQixnQkFBTyxLQUFQO0FBQUEsaUJBQ1MsSUFEVDtBQUNxQix1QkFBTyxJQUFDLENBQUEsV0FBRCxDQUFBO0FBRDVCLGlCQUVTLE1BRlQ7QUFFcUIsdUJBQU8sSUFBQyxDQUFBLFNBQUQsQ0FBQTtBQUY1QjtlQUdBLGlEQUFNLEdBQU4sRUFBVyxHQUFYLEVBQWdCLEtBQWhCLEVBQXVCLEtBQXZCO0lBTG9COzs7O0dBMVVUOztBQWlWbkIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMFxuMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgMCAwMDBcbjAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwXG4gMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwgdmFsaWQsIGVtcHR5LCBjbGFtcCwgc2xhc2gsIGZzLCBvcywgXyB9ID0gcmVxdWlyZSAna3hrJ1xuICBcblByb2plY3RzICA9IHJlcXVpcmUgJy4uL3Rvb2xzL3Byb2plY3RzJ1xuRmlsZSAgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvZmlsZSdcbkNvbW1hbmQgICA9IHJlcXVpcmUgJy4uL2NvbW1hbmRsaW5lL2NvbW1hbmQnXG5yZW5kZXIgICAgPSByZXF1aXJlICcuLi9lZGl0b3IvcmVuZGVyJ1xuc3ludGF4ICAgID0gcmVxdWlyZSAnLi4vZWRpdG9yL3N5bnRheCdcbmZ1enp5ICAgICA9IHJlcXVpcmUgJ2Z1enp5J1xuICAgICAgICAgICAgICAgICBcbnJlbGF0aXZlID0gKHJlbCwgdG8pIC0+XG4gICAgXG4gICAgciA9IHNsYXNoLnJlbGF0aXZlIHJlbCwgdG9cblxuICAgIGlmIHIuc3RhcnRzV2l0aCAnLi4vLi4vJyBcbiAgICAgICAgdGlsZGUgPSBzbGFzaC50aWxkZSByZWxcbiAgICAgICAgaWYgdGlsZGUubGVuZ3RoIDwgci5sZW5ndGhcbiAgICAgICAgICAgIHIgPSB0aWxkZVxuICAgIGlmIHJlbC5sZW5ndGggPCByLmxlbmd0aCAgICBcbiAgICAgICAgciA9IHJlbFxuICAgIHIgICAgXG5cbmNsYXNzIE9wZW4gZXh0ZW5kcyBDb21tYW5kXG5cbiAgICBjb25zdHJ1Y3RvcjogKGNvbW1hbmRsaW5lKSAtPlxuICAgICAgICBcbiAgICAgICAgc3VwZXIgY29tbWFuZGxpbmVcbiAgICAgICAgXG4gICAgICAgIHBvc3Qub24gJ2ZpbGUnLCBAb25GaWxlXG4gICAgICAgIFxuICAgICAgICBAbmFtZXMgICAgPSBbXCJvcGVuXCIsIFwibmV3IHdpbmRvd1wiXVxuICAgICAgICBAZmlsZXMgICAgPSBbXVxuICAgICAgICBAZmlsZSAgICAgPSBudWxsXG4gICAgICAgIEBkaXIgICAgICA9IG51bGxcbiAgICAgICAgQHBrZyAgICAgID0gbnVsbFxuICAgICAgICBAc2VsZWN0ZWQgPSAwXG4gICAgICAgICAgXG4gICAgb25GaWxlOiAoZmlsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBpc0FjdGl2ZSgpIFxuICAgICAgICAgICAgaWYgZW1wdHkgZmlsZVxuICAgICAgICAgICAgICAgIEBzZXRUZXh0ICcnXG4gICAgICAgICAgICBlbHNlIGlmIEBnZXRUZXh0KCkgIT0gc2xhc2guZmlsZSBmaWxlXG4gICAgICAgICAgICAgICAgQHNldFRleHQgc2xhc2gudGlsZGUgZmlsZVxuICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgIFxuXG4gICAgY2hhbmdlZDogKGNvbW1hbmQpIC0+XG4gICAgICAgIFxuICAgICAgICBjb21tYW5kID0gY29tbWFuZC50cmltKClcblxuICAgICAgICBbZmlsZSwgcG9zXSA9IHNsYXNoLnNwbGl0RmlsZVBvcyBjb21tYW5kID8gQGdldFRleHQoKS50cmltKClcblxuICAgICAgICBpdGVtcyA9IEBsaXN0SXRlbXMgY3VycmVudFRleHQ6Y29tbWFuZCwgbWF4SXRlbXM6MTAwMDBcbiAgICAgICAgXG4gICAgICAgIGlmIGNvbW1hbmQubGVuZ3RoXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZ1enppZWQgPSBmdXp6eS5maWx0ZXIgc2xhc2guYmFzZW5hbWUoZmlsZSksIGl0ZW1zLCBleHRyYWN0OiAobykgLT4gby50ZXh0ICAgICAgICAgICAgXG4gICAgICAgICAgICBpdGVtcyA9IChmLm9yaWdpbmFsIGZvciBmIGluIGZ1enppZWQpXG4gICAgICAgICAgICBpdGVtcy5zb3J0IChhLGIpIC0+IGIud2VpZ2h0IC0gYS53ZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGl0ZW1zLmxlbmd0aFxuICAgICAgICAgICAgQHNob3dJdGVtcyBpdGVtcy5zbGljZSAwLCAzMDBcbiAgICAgICAgICAgIEBzZWxlY3QgMFxuICAgICAgICAgICAgQHBvc2l0aW9uTGlzdCgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBoaWRlTGlzdCgpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBjb21wbGV0ZTogLT5cblxuICAgICAgICBpZiBAY29tbWFuZExpc3Q/IGFuZCBAY29tbWFuZExpc3QubGluZShAc2VsZWN0ZWQpLnN0YXJ0c1dpdGgoc2xhc2guYmFzZW5hbWUgQGdldFRleHQoKSkgYW5kIG5vdCBAZ2V0VGV4dCgpLnRyaW0oKS5lbmRzV2l0aCgnLycpXG4gICAgICAgICAgICBAc2V0VGV4dCBzbGFzaC5qb2luKHNsYXNoLmRpcihAZ2V0VGV4dCgpKSwgQGNvbW1hbmRMaXN0LmxpbmUoQHNlbGVjdGVkKSlcbiAgICAgICAgICAgIGlmIHNsYXNoLmRpckV4aXN0cyBAZ2V0VGV4dCgpXG4gICAgICAgICAgICAgICAgQHNldFRleHQgQGdldFRleHQoKSArICcvJ1xuICAgICAgICAgICAgICAgIEBjaGFuZ2VkIEBnZXRUZXh0KClcbiAgICAgICAgICAgIHRydWVcbiAgICAgICAgZWxzZSBpZiBub3QgQGdldFRleHQoKS50cmltKCkuZW5kc1dpdGgoJy8nKSBhbmQgc2xhc2guZGlyRXhpc3RzIEBnZXRUZXh0KClcbiAgICAgICAgICAgIEBzZXRUZXh0IEBnZXRUZXh0KCkgKyAnLydcbiAgICAgICAgICAgIEBjaGFuZ2VkIEBnZXRUZXh0KClcbiAgICAgICAgICAgIHRydWUgICAgICAgICAgICBcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcHJvamVjdHMgPSBwb3N0LmdldCAnaW5kZXhlcicsICdwcm9qZWN0cydcbiAgICAgICAgICAgIGZvciBwIGluIE9iamVjdC5rZXlzKHByb2plY3RzKS5zb3J0KClcbiAgICAgICAgICAgICAgICBpZiBwLnN0YXJ0c1dpdGggQGdldFRleHQoKVxuICAgICAgICAgICAgICAgICAgICBwZGlyID0gcHJvamVjdHNbcF0uZGlyXG4gICAgICAgICAgICAgICAgICAgIHBkaXIgPSBzbGFzaC5qb2luKHBkaXIsICdjb2ZmZWUnKSBpZiBzbGFzaC5kaXJFeGlzdHMgc2xhc2guam9pbiBwZGlyLCAnY29mZmVlJ1xuICAgICAgICAgICAgICAgICAgICBAc2V0VGV4dCBwZGlyICsgJy8nXG4gICAgICAgICAgICAgICAgICAgIEBjaGFuZ2VkIEBnZXRUZXh0KClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIHN1cGVyKClcbiAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG5cbiAgICB3ZWlnaHQ6IChpdGVtLCBvcHQpID0+ICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBpdGVtLmJvbnVzIGlmIGl0ZW0uYm9udXM/XG4gICAgICAgIFxuICAgICAgICBmID0gaXRlbS5maWxlXG4gICAgICAgIHIgPSBpdGVtLnRleHRcbiAgICAgICAgYiA9IHNsYXNoLmZpbGUgZlxuICAgICAgICBuID0gc2xhc2guYmFzZSBmXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHJlbEJvbnVzID0gMFxuICAgICAgICBuYW1lQm9udXMgPSAwXG4gICAgICAgIGlmIG9wdC5jdXJyZW50VGV4dD8ubGVuZ3RoXG4gICAgICAgICAgICByZWxCb251cyAgPSByLnN0YXJ0c1dpdGgob3B0LmN1cnJlbnRUZXh0KSBhbmQgNjU1MzUgKiAob3B0LmN1cnJlbnRUZXh0Lmxlbmd0aC9yLmxlbmd0aCkgb3IgMCBcbiAgICAgICAgICAgIG5hbWVCb251cyA9IG4uc3RhcnRzV2l0aChvcHQuY3VycmVudFRleHQpIGFuZCAyMTg0ICAqIChvcHQuY3VycmVudFRleHQubGVuZ3RoL24ubGVuZ3RoKSBvciAwXG4gICAgICAgICAgIFxuICAgICAgICBleHRlbnNpb25Cb251cyA9IHN3aXRjaCBzbGFzaC5leHQgYlxuICAgICAgICAgICAgd2hlbiAnY29mZmVlJywgJ2tvZmZlZScgICB0aGVuIDEwMDBcbiAgICAgICAgICAgIHdoZW4gJ2NwcCcsICdocHAnLCAnaCcgICAgdGhlbiA5MFxuICAgICAgICAgICAgd2hlbiAnbWQnLCAnc3R5bCcsICdwdWcnICB0aGVuIDUwXG4gICAgICAgICAgICB3aGVuICdub29uJyAgICAgICAgICAgICAgIHRoZW4gMjVcbiAgICAgICAgICAgIHdoZW4gJ2pzJywgJ2pzb24nLCAnaHRtbCcgdGhlbiAtMTBcbiAgICAgICAgICAgIGVsc2UgMCBcbiAgICAgICAgXG4gICAgICAgIGlmIEBmaWxlIGFuZCBzbGFzaC5leHQoQGZpbGUpID09IHNsYXNoLmV4dCBiXG4gICAgICAgICAgICBleHRlbnNpb25Cb251cyArPSAxMDAwXG4gICAgICAgIFxuICAgICAgICBsZW5ndGhQZW5hbHR5ID0gc2xhc2guZGlyKGYpLmxlbmd0aFxuICAgICAgICAgICAgXG4gICAgICAgIHVwZGlyUGVuYWx0eSAgID0gci5zcGxpdCgnLi4vJykubGVuZ3RoICogODE5XG4gICAgICAgIFxuICAgICAgICBpZiBmLnN0YXJ0c1dpdGggQGRpclxuICAgICAgICAgICAgbG9jYWxCb251cyA9IE1hdGgubWF4IDAsICg1LXIuc3BsaXQoJy8nKS5sZW5ndGgpICogNDA5NVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBsb2NhbEJvbnVzID0gTWF0aC5tYXggMCwgKDUtci5zcGxpdCgnLi4vJykubGVuZ3RoKSAqIDgxOVxuICAgICAgICBcbiAgICAgICAgaXRlbS53ZWlnaHQgPSBsb2NhbEJvbnVzICsgcmVsQm9udXMgKyBuYW1lQm9udXMgKyBleHRlbnNpb25Cb251cyAtIGxlbmd0aFBlbmFsdHkgLSB1cGRpclBlbmFsdHlcbiAgICAgICAgICAgIFxuICAgIHdlaWdodGVkSXRlbXM6IChpdGVtcywgb3B0KSAtPiBcbiAgICAgICAgXG4gICAgICAgIGl0ZW1zLnNvcnQgKGEsYikgPT4gQHdlaWdodChiLCBvcHQpIC0gQHdlaWdodChhLCBvcHQpXG4gICAgICAgIGl0ZW1zXG4gICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgIFxuICAgICAgICBcbiAgICBsaXN0SXRlbXM6IChvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBvcHQgPz0ge31cbiAgICAgICAgb3B0Lm1heEl0ZW1zID89IDIwMFxuICAgICAgICBvcHQuZmxhdCA/PSB0cnVlXG4gICAgICAgIFxuICAgICAgICBpY29uU3BhbiA9IChmaWxlKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBjbGFzc05hbWUgPSBGaWxlLmljb25DbGFzc05hbWUgZmlsZVxuICAgICAgICAgICAgXCI8c3BhbiBjbGFzcz0nI3tjbGFzc05hbWV9IG9wZW5GaWxlSWNvbicvPlwiXG4gICAgICAgIFxuICAgICAgICBpdGVtcyA9IFtdXG4gICAgICAgIFxuICAgICAgICBAbGFzdEZpbGVJbmRleCA9IDBcbiAgICAgICAgXG4gICAgICAgIEBkaXIgPSBzbGFzaC5yZXNvbHZlICd+JyBpZiBub3QgQGRpcj9cbiAgICAgICAgXG4gICAgICAgIGlmIEBoaXN0b3J5PyBhbmQgbm90IG9wdC5jdXJyZW50VGV4dCBhbmQgQGhpc3RvcnkubGVuZ3RoID4gMVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmID0gQGhpc3RvcnlbQGhpc3RvcnkubGVuZ3RoLTJdXG4gICAgICAgICAgICBpdGVtID0gT2JqZWN0LmNyZWF0ZSBudWxsXG4gICAgICAgICAgICBpdGVtLnRleHQgPSByZWxhdGl2ZSBmLCBAZGlyXG4gICAgICAgICAgICBpdGVtLmxpbmUgPSBpY29uU3BhbiBmXG4gICAgICAgICAgICBpdGVtLmZpbGUgPSBmXG4gICAgICAgICAgICBpdGVtLmJvbnVzID0gMTA0ODU3NVxuICAgICAgICAgICAgaXRlbXMucHVzaCBpdGVtXG4gICAgICAgICAgICBAbGFzdEZpbGVJbmRleCA9IDBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgZm9yIGZpbGUgaW4gQGZpbGVzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJlbCA9IHJlbGF0aXZlIGZpbGUsIEBkaXJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgcmVsLmxlbmd0aFxuICAgICAgICAgICAgICAgIGl0ZW0gPSBPYmplY3QuY3JlYXRlIG51bGxcbiAgICAgICAgICAgICAgICBpdGVtLmxpbmUgPSBpY29uU3BhbiBmaWxlXG4gICAgICAgICAgICAgICAgaXRlbS50ZXh0ID0gcmVsXG4gICAgICAgICAgICAgICAgaXRlbS5maWxlID0gZmlsZVxuICAgICAgICAgICAgICAgIGl0ZW1zLnB1c2ggaXRlbVxuXG4gICAgICAgIGl0ZW1zID0gQHdlaWdodGVkSXRlbXMgaXRlbXMsIG9wdFxuICAgICAgICBpdGVtcyA9IF8udW5pcUJ5IGl0ZW1zLCAobykgLT4gby50ZXh0XG4gICAgICAgIFxuICAgICAgICBpdGVtcy5zbGljZSAwLCBvcHQubWF4SXRlbXNcbiAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBzaG93SGlzdG9yeTogKCkgLT5cblxuICAgICAgICBpZiBAaGlzdG9yeS5sZW5ndGggPiAxIGFuZCBAc2VsZWN0ZWQgPD0gMFxuICAgICAgICAgICAgaXRlbXMgPSBbXVxuICAgICAgICAgICAgYm9udXMgPSAxMDQ4NTc1XG4gICAgICAgICAgICBmb3IgZiBpbiBAaGlzdG9yeVxuICAgICAgICAgICAgICAgIGl0ZW0gPSBPYmplY3QuY3JlYXRlIG51bGxcbiAgICAgICAgICAgICAgICBpdGVtLnRleHQgPSByZWxhdGl2ZSBmLCBAZGlyXG4gICAgICAgICAgICAgICAgaXRlbS5maWxlID0gZlxuICAgICAgICAgICAgICAgIGl0ZW0uYm9udXMgPSBib251c1xuICAgICAgICAgICAgICAgIGl0ZW1zLnB1c2ggaXRlbVxuICAgICAgICAgICAgICAgIGJvbnVzIC09IDEgXG4gICAgICAgICAgICBpdGVtcy5wb3AoKVxuICAgICAgICAgICAgQHNob3dJdGVtcyBpdGVtc1xuICAgICAgICAgICAgQHNlbGVjdCBpdGVtcy5sZW5ndGgtMVxuICAgICAgICAgICAgQHNldEFuZFNlbGVjdFRleHQgaXRlbXNbQHNlbGVjdGVkXS50ZXh0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgICd1bmhhbmRsZWQnXG5cbiAgICBzaG93Rmlyc3Q6ICgpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAY29tbWFuZExpc3QgYW5kIEBzZWxlY3RlZCA9PSBAY29tbWFuZExpc3QubWV0YS5tZXRhcy5sZW5ndGggLSAxXG4gICAgICAgICAgICBAc2hvd0l0ZW1zIEBsaXN0SXRlbXMoKVxuICAgICAgICAgICAgQHNlbGVjdCAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgICd1bmhhbmRsZWQnXG4gICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICBcbiAgICBjYW5jZWw6IChuYW1lKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgbmFtZSA9PSBAbmFtZXNbMF0gIyBjb21tYW5kK3AgY29tbWFuZCtwIHRvIG9wZW4gcHJldmlvdXMgZmlsZVxuICAgICAgICAgICAgaWYgQGNvbW1hbmRMaXN0PyBhbmQgQGxhc3RGaWxlSW5kZXggPT0gQHNlbGVjdGVkXG4gICAgICAgICAgICAgICAgcmV0dXJuIEBleGVjdXRlKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgc3VwZXIgbmFtZVxuICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgIDAwMCAgIFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICAgICBcbiAgICBzdGFydDogKG5hbWUpIC0+IFxuICAgICAgICBcbiAgICAgICAgQHNldE5hbWUgbmFtZVxuICAgICAgICBcbiAgICAgICAgaWYgQGNvbW1hbmRsaW5lLmxhc3RGb2N1cyA9PSAnY29tbWFuZGxpbmUtZWRpdG9yJyA9PSB3aW5kb3cubGFzdEZvY3VzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBmaWxlID0gd2luZG93LmVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgaWYgZGlyID0gc2xhc2gucmVzb2x2ZSBAY29tbWFuZGxpbmUudGV4dCgpXG4gICAgICAgICAgICAgICAgQGRpciA9IGRpclxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBkaXIgPSBzbGFzaC5kaXIoQGZpbGUpID8gcHJvY2Vzcy5jd2QoKVxuICAgICAgICBcbiAgICAgICAgZWxzZSBpZiBAY29tbWFuZGxpbmUubGFzdEZvY3VzID09ICdzaGVsZicgb3IgQGNvbW1hbmRsaW5lLmxhc3RGb2N1cy5zdGFydHNXaXRoICdGaWxlQnJvd3NlcidcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaXRlbSA9IHdpbmRvdy5maWxlYnJvd3Nlci5sYXN0VXNlZENvbHVtbigpLnBhcmVudFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICAgICAgd2hlbiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICBAZmlsZSA9IHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgICAgICAgICAgICAgQGRpciAgPSBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICB3aGVuICdmaWxlJ1xuICAgICAgICAgICAgICAgICAgICBAZmlsZSA9IGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICBAZGlyICA9IHNsYXNoLmRpciBAZmlsZVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgZWxzZSBpZiB3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlP1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZmlsZSA9IHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgICAgIEBkaXIgID0gc2xhc2guZGlyIEBmaWxlXG4gICAgICAgICAgICBcbiAgICAgICAgZWxzZSBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGZpbGUgPSBudWxsXG4gICAgICAgICAgICBAZGlyICA9IHByb2Nlc3MuY3dkKClcbiAgICAgICAgICAgIFxuICAgICAgICBAZmlsZXMgPSBQcm9qZWN0cy5maWxlcyBAZGlyXG4gICAgICAgIFxuICAgICAgICBAbG9hZFN0YXRlKClcbiAgICAgICAgQHNob3dMaXN0KClcbiAgICAgICAgQHNob3dJdGVtcyBAbGlzdEl0ZW1zKClcbiAgICAgICAgQGdyYWJGb2N1cygpXG4gICAgICAgIEBzZWxlY3QgMCAgXG4gICAgICAgIFxuICAgICAgICB0ZXh0OiAgIEBjb21tYW5kTGlzdC5saW5lIEBzZWxlY3RlZFxuICAgICAgICBzZWxlY3Q6IHRydWVcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMFxuICAgICAgICBcbiAgICBleGVjdXRlOiAoY29tbWFuZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBzZWxlY3RlZCA8IDAgdGhlbiByZXR1cm4gc3RhdHVzOidmYWlsZWQnXG4gICAgICAgICAgICBcbiAgICAgICAgcGF0aCA9IEBjb21tYW5kTGlzdD8ubGluZSBAc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIEBoaWRlTGlzdCgpXG5cbiAgICAgICAgaWYgdmFsaWQgcGF0aFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBbZmlsZSwgcG9zXSA9IHNsYXNoLnNwbGl0RmlsZVBvcyBwYXRoXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZpbGUgPSBAcmVzb2x2ZWRQYXRoIHBhdGhcbiAgICAgICAgICAgIGZpbGUgPSBzbGFzaC5qb2luRmlsZVBvcyBmaWxlLCBwb3NcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgQG5hbWUgPT0gJ25ldyB3aW5kb3cnXG4gICAgICAgICAgICAgICAgcG9zdC50b01haW4gJ25ld1dpbmRvd1dpdGhGaWxlJywgZmlsZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvRmlsZScsIGZpbGU6ZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBzdXBlciBmaWxlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB0ZXh0OiAgIGZpbGVcbiAgICAgICAgICAgIGZvY3VzOiAgJ2VkaXRvcidcbiAgICAgICAgICAgIHNob3c6ICAgJ2VkaXRvcidcbiAgICAgICAgICAgIHN0YXR1czogJ29rJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzdGF0dXM6ICdmYWlsZWQnXG4gICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwICBcbiAgICBcbiAgICByZXNvbHZlZFBhdGg6IChwLCBwYXJlbnQ9QGRpcikgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiAocGFyZW50ID8gc2xhc2gucmVzb2x2ZSAnficpIGlmIG5vdCBwP1xuICAgICAgICBpZiBwWzBdIGluIFsnficsICcvJ10gb3IgcFsxXSA9PSAnOidcbiAgICAgICAgICAgIHNsYXNoLnJlc29sdmUgcFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzbGFzaC5yZXNvbHZlIHNsYXNoLmpvaW4gcGFyZW50LCBwXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgXG4gICAgXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9FdmVudDogKG1vZCwga2V5LCBjb21ibywgZXZlbnQpIC0+IFxuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICd1cCcgICB0aGVuIHJldHVybiBAc2hvd0hpc3RvcnkoKVxuICAgICAgICAgICAgd2hlbiAnZG93bicgdGhlbiByZXR1cm4gQHNob3dGaXJzdCgpXG4gICAgICAgIHN1cGVyIG1vZCwga2V5LCBjb21ibywgZXZlbnRcblxubW9kdWxlLmV4cG9ydHMgPSBPcGVuXG4iXX0=
//# sourceURL=../../coffee/commands/open.coffee