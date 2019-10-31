// koffee 1.4.0

/*
00000000  0000000    000  000000000   0000000   00000000
000       000   000  000     000     000   000  000   000
0000000   000   000  000     000     000   000  0000000
000       000   000  000     000     000   000  000   000
00000000  0000000    000     000      0000000   000   000
 */
var Buffer, Do, Editor, Syntax, _, clamp, empty, filelist, kerror, ref, slash,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), clamp = ref.clamp, empty = ref.empty, slash = ref.slash, kerror = ref.kerror, filelist = ref.filelist, _ = ref._;

Buffer = require('./buffer');

Syntax = require('./syntax');

Do = require('./do');

Editor = (function(superClass) {
    extend(Editor, superClass);

    Editor.actions = null;

    function Editor(name, config) {
        var base;
        Editor.__super__.constructor.call(this);
        this.name = name;
        this.config = config != null ? config : {};
        if ((base = this.config).syntaxName != null) {
            base.syntaxName;
        } else {
            base.syntaxName = 'txt';
        }
        if (Editor.actions == null) {
            Editor.initActions();
        }
        this.indentString = _.padStart("", 4);
        this.stickySelection = false;
        this.syntax = new Syntax(this.config.syntaxName, this.line, this.lines);
        this["do"] = new Do(this);
        this.setupFileType();
    }

    Editor.prototype.del = function() {
        return this["do"].del();
    };

    Editor.initActions = function() {
        var actionFile, actions, i, k, key, len, ref1, ref2, results, v, value;
        this.actions = [];
        ref1 = filelist(slash.join(__dirname, 'actions'));
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            actionFile = ref1[i];
            if ((ref2 = slash.ext(actionFile)) !== 'js' && ref2 !== 'coffee') {
                continue;
            }
            actions = require(actionFile);
            results.push((function() {
                var results1;
                results1 = [];
                for (key in actions) {
                    value = actions[key];
                    if (_.isFunction(value)) {
                        results1.push(this.prototype[key] = value);
                    } else if (key === 'actions') {
                        results1.push((function() {
                            var results2;
                            results2 = [];
                            for (k in value) {
                                v = value[k];
                                if (!_.isString(v)) {
                                    if (v.key == null) {
                                        v.key = k;
                                    }
                                    results2.push(this.actions.push(v));
                                } else {
                                    results2.push(void 0);
                                }
                            }
                            return results2;
                        }).call(this));
                    } else {
                        results1.push(void 0);
                    }
                }
                return results1;
            }).call(this));
        }
        return results;
    };

    Editor.actionWithName = function(name) {
        var action, i, len, ref1;
        ref1 = Editor.actions;
        for (i = 0, len = ref1.length; i < len; i++) {
            action = ref1[i];
            if (action.name === name) {
                return action;
            }
        }
        return null;
    };

    Editor.prototype.shebangFileType = function() {
        var ref1, ref2;
        return (ref1 = (ref2 = this.config) != null ? ref2.syntaxName : void 0) != null ? ref1 : 'txt';
    };

    Editor.prototype.setupFileType = function() {
        var newType, oldType, ref1;
        oldType = this.fileType;
        newType = this.shebangFileType();
        if ((ref1 = this.syntax) != null) {
            ref1.setFileType(newType);
        }
        this.setFileType(newType);
        if (oldType !== this.fileType) {
            return this.emit('fileTypeChanged', this.fileType);
        }
    };

    Editor.prototype.setFileType = function(fileType) {
        var cstr, i, k, key, len, ref1, ref2, ref3, reg, v;
        this.fileType = fileType;
        this.stringCharacters = {
            "'": 'single',
            '"': 'double'
        };
        switch (this.fileType) {
            case 'md':
                this.stringCharacters['*'] = 'bold';
                break;
            case 'noon':
                this.stringCharacters['|'] = 'pipe';
        }
        this.bracketCharacters = {
            open: {
                '[': ']',
                '{': '}',
                '(': ')'
            },
            close: {},
            regexps: []
        };
        switch (this.fileType) {
            case 'html':
                this.bracketCharacters.open['<'] = '>';
        }
        ref1 = this.bracketCharacters.open;
        for (k in ref1) {
            v = ref1[k];
            this.bracketCharacters.close[v] = k;
        }
        this.bracketCharacters.regexp = [];
        ref2 = ['open', 'close'];
        for (i = 0, len = ref2.length; i < len; i++) {
            key = ref2[i];
            cstr = _.keys(this.bracketCharacters[key]).join('');
            reg = new RegExp("[" + (_.escapeRegExp(cstr)) + "]");
            this.bracketCharacters.regexps.push([reg, key]);
        }
        this.initSurround();
        this.indentNewLineMore = null;
        this.indentNewLineLess = null;
        this.insertIndentedEmptyLineBetween = '{}';
        switch (this.fileType) {
            case 'coffee':
            case 'koffee':
                this.indentNewLineMore = {
                    lineEndsWith: ['->', '=>', ':', '='],
                    lineRegExp: /^(\s+when|\s*if|\s*else\s+if\s+)(?!.*\sthen\s)|(^|\s)(else\s*$|switch\s|for\s|while\s|class\s)/
                };
        }
        this.lineComment = (ref3 = this.syntax.balancer.regions.lineComment) != null ? ref3.open : void 0;
        return this.multiComment = this.syntax.balancer.regions.multiComment;
    };

    Editor.prototype.setText = function(text) {
        var lines;
        if (text == null) {
            text = "";
        }
        if (this.syntax.name === 'txt') {
            this.syntax.name = Syntax.shebang(text.slice(0, text.search(/\r?\n/)));
        }
        lines = text.split(/\n/);
        this.newlineCharacters = '\n';
        if (!empty(lines)) {
            if (lines[0].endsWith('\r')) {
                lines = text.split(/\r?\n/);
                this.newlineCharacters = '\r\n';
            }
        }
        return this.setLines(lines);
    };

    Editor.prototype.setLines = function(lines) {
        this.syntax.clear();
        this.syntax.setLines(lines);
        Editor.__super__.setLines.call(this, lines);
        return this.emit('linesSet', lines);
    };

    Editor.prototype.textOfSelectionForClipboard = function() {
        if (this.numSelections()) {
            return this.textOfSelection();
        } else {
            return this.textInRanges(this.rangesForCursorLines());
        }
    };

    Editor.prototype.splitStateLineAtPos = function(state, pos) {
        var l;
        l = state.line(pos[1]);
        if (l == null) {
            kerror("no line at pos " + pos + "?");
        }
        if (l == null) {
            return ['', ''];
        }
        return [l.slice(0, pos[0]), l.slice(pos[0])];
    };

    Editor.prototype.emitEdit = function(action) {
        var line, mc;
        mc = this.mainCursor();
        line = this.line(mc[1]);
        return this.emit('edit', {
            action: action,
            line: line,
            before: line.slice(0, mc[0]),
            after: line.slice(mc[0]),
            cursor: mc
        });
    };

    Editor.prototype.indentStringForLineAtIndex = function(li) {
        var e, i, il, indentLength, len, line, ref1, ref2, thisIndent;
        while (empty(this.line(li).trim()) && li > 0) {
            li--;
        }
        if ((0 <= li && li < this.numLines())) {
            il = 0;
            line = this.line(li);
            thisIndent = this.indentationAtLineIndex(li);
            indentLength = this.indentString.length;
            if (this.indentNewLineMore != null) {
                if ((ref1 = this.indentNewLineMore.lineEndsWith) != null ? ref1.length : void 0) {
                    ref2 = this.indentNewLineMore.lineEndsWith;
                    for (i = 0, len = ref2.length; i < len; i++) {
                        e = ref2[i];
                        if (line.trim().endsWith(e)) {
                            il = thisIndent + indentLength;
                            break;
                        }
                    }
                }
                if (il === 0) {
                    if ((this.indentNewLineMore.lineRegExp != null) && this.indentNewLineMore.lineRegExp.test(line)) {
                        il = thisIndent + indentLength;
                    }
                }
            }
            if (il === 0) {
                il = thisIndent;
            }
            il = Math.max(il, this.indentationAtLineIndex(li + 1));
            return _.padStart("", il);
        } else {
            return '';
        }
    };

    return Editor;

})(Buffer);

module.exports = Editor;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx5RUFBQTtJQUFBOzs7QUFRQSxNQUErQyxPQUFBLENBQVEsS0FBUixDQUEvQyxFQUFFLGlCQUFGLEVBQVMsaUJBQVQsRUFBZ0IsaUJBQWhCLEVBQXVCLG1CQUF2QixFQUErQix1QkFBL0IsRUFBeUM7O0FBRXpDLE1BQUEsR0FBVSxPQUFBLENBQVEsVUFBUjs7QUFDVixNQUFBLEdBQVUsT0FBQSxDQUFRLFVBQVI7O0FBQ1YsRUFBQSxHQUFVLE9BQUEsQ0FBUSxNQUFSOztBQUVKOzs7SUFFRixNQUFDLENBQUEsT0FBRCxHQUFXOztJQUVSLGdCQUFDLElBQUQsRUFBTyxNQUFQO0FBRUMsWUFBQTtRQUFBLHNDQUFBO1FBRUEsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxNQUFELG9CQUFVLFNBQVM7O2dCQUNaLENBQUM7O2dCQUFELENBQUMsYUFBYzs7UUFFdEIsSUFBNEIsc0JBQTVCO1lBQUEsTUFBTSxDQUFDLFdBQVAsQ0FBQSxFQUFBOztRQUVBLElBQUMsQ0FBQSxZQUFELEdBQW1CLENBQUMsQ0FBQyxRQUFGLENBQVcsRUFBWCxFQUFlLENBQWY7UUFDbkIsSUFBQyxDQUFBLGVBQUQsR0FBbUI7UUFDbkIsSUFBQyxDQUFBLE1BQUQsR0FBbUIsSUFBSSxNQUFKLENBQVcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFuQixFQUErQixJQUFDLENBQUEsSUFBaEMsRUFBc0MsSUFBQyxDQUFBLEtBQXZDO1FBQ25CLElBQUMsRUFBQSxFQUFBLEVBQUQsR0FBbUIsSUFBSSxFQUFKLENBQU8sSUFBUDtRQUVuQixJQUFDLENBQUEsYUFBRCxDQUFBO0lBZkQ7O3FCQWlCSCxHQUFBLEdBQUssU0FBQTtlQUVELElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7SUFGQzs7SUFVTCxNQUFDLENBQUEs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QUFDLElBQTlCLENBQW1DLElBQW5DLENBQXRDO3dCQUNJLEVBQUEsR0FBSyxVQUFBLEdBQWEsYUFEdEI7cUJBREo7aUJBTko7O1lBVUEsSUFBbUIsRUFBQSxLQUFNLENBQXpCO2dCQUFBLEVBQUEsR0FBSyxXQUFMOztZQUNBLEVBQUEsR0FBSyxJQUFJLENBQUMsR0FBTCxDQUFTLEVBQVQsRUFBYSxJQUFDLENBQUEsc0JBQUQsQ0FBd0IsRUFBQSxHQUFHLENBQTNCLENBQWI7bUJBRUwsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxFQUFYLEVBQWUsRUFBZixFQXBCSjtTQUFBLE1BQUE7bUJBc0JJLEdBdEJKOztJQUx3Qjs7OztHQXBNWDs7QUFpT3JCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgY2xhbXAsIGVtcHR5LCBzbGFzaCwga2Vycm9yLCBmaWxlbGlzdCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5CdWZmZXIgID0gcmVxdWlyZSAnLi9idWZmZXInXG5TeW50YXggID0gcmVxdWlyZSAnLi9zeW50YXgnXG5EbyAgICAgID0gcmVxdWlyZSAnLi9kbydcblxuY2xhc3MgRWRpdG9yIGV4dGVuZHMgQnVmZmVyXG5cbiAgICBAYWN0aW9ucyA9IG51bGxcblxuICAgIEA6IChuYW1lLCBjb25maWcpIC0+XG5cbiAgICAgICAgc3VwZXIoKVxuXG4gICAgICAgIEBuYW1lICAgPSBuYW1lXG4gICAgICAgIEBjb25maWcgPSBjb25maWcgPyB7fVxuICAgICAgICBAY29uZmlnLnN5bnRheE5hbWUgPz0gJ3R4dCdcblxuICAgICAgICBFZGl0b3IuaW5pdEFjdGlvbnMoKSBpZiBub3QgRWRpdG9yLmFjdGlvbnM/XG5cbiAgICAgICAgQGluZGVudFN0cmluZyAgICA9IF8ucGFkU3RhcnQgXCJcIiwgNFxuICAgICAgICBAc3RpY2t5U2VsZWN0aW9uID0gZmFsc2VcbiAgICAgICAgQHN5bnRheCAgICAgICAgICA9IG5ldyBTeW50YXggQGNvbmZpZy5zeW50YXhOYW1lLCBAbGluZSwgQGxpbmVzXG4gICAgICAgIEBkbyAgICAgICAgICAgICAgPSBuZXcgRG8gQFxuXG4gICAgICAgIEBzZXR1cEZpbGVUeXBlKClcblxuICAgIGRlbDogLT5cblxuICAgICAgICBAZG8uZGVsKClcblxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBAaW5pdEFjdGlvbnM6IC0+XG5cbiAgICAgICAgQGFjdGlvbnMgPSBbXVxuICAgICAgICBmb3IgYWN0aW9uRmlsZSBpbiBmaWxlbGlzdChzbGFzaC5qb2luIF9fZGlybmFtZSwgJ2FjdGlvbnMnKVxuICAgICAgICAgICAgY29udGludWUgaWYgc2xhc2guZXh0KGFjdGlvbkZpbGUpIG5vdCBpbiBbJ2pzJywgJ2NvZmZlZSddXG4gICAgICAgICAgICBhY3Rpb25zID0gcmVxdWlyZSBhY3Rpb25GaWxlXG4gICAgICAgICAgICBmb3Iga2V5LHZhbHVlIG9mIGFjdGlvbnNcbiAgICAgICAgICAgICAgICBpZiBfLmlzRnVuY3Rpb24gdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgQHByb3RvdHlwZVtrZXldID0gdmFsdWVcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGtleSA9PSAnYWN0aW9ucydcbiAgICAgICAgICAgICAgICAgICAgZm9yIGssdiBvZiB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm90IF8uaXNTdHJpbmcgdlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYua2V5ID0gayBpZiBub3Qgdi5rZXk/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGFjdGlvbnMucHVzaCB2XG5cbiAgICAgICAgIyB0b28gZWFybHkgZm9yIGxvZyBoZXJlIVxuICAgICAgICAjIGNvbnNvbGUubG9nIHN0ciBAYWN0aW9uc1xuXG4gICAgQGFjdGlvbldpdGhOYW1lOiAobmFtZSkgLT5cblxuICAgICAgICBmb3IgYWN0aW9uIGluIEVkaXRvci5hY3Rpb25zXG4gICAgICAgICAgICBpZiBhY3Rpb24ubmFtZSA9PSBuYW1lXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjdGlvblxuICAgICAgICBudWxsXG5cbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgICAwMDAgMDAwICAgMDAwICAgMDAwICAwMDBcbiAgICAjICAgIDAwMCAgICAgICAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMFxuICAgICMgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMDBcblxuICAgIHNoZWJhbmdGaWxlVHlwZTogLT4gQGNvbmZpZz8uc3ludGF4TmFtZSA/ICd0eHQnXG5cbiAgICBzZXR1cEZpbGVUeXBlOiAtPlxuXG4gICAgICAgIG9sZFR5cGUgPSBAZmlsZVR5cGVcbiAgICAgICAgbmV3VHlwZSA9IEBzaGViYW5nRmlsZVR5cGUoKVxuXG4gICAgICAgIEBzeW50YXg/LnNldEZpbGVUeXBlIG5ld1R5cGVcbiAgICAgICAgQHNldEZpbGVUeXBlIG5ld1R5cGVcblxuICAgICAgICBpZiBvbGRUeXBlICE9IEBmaWxlVHlwZVxuICAgICAgICAgICAgQGVtaXQgJ2ZpbGVUeXBlQ2hhbmdlZCcsIEBmaWxlVHlwZVxuXG4gICAgc2V0RmlsZVR5cGU6IChAZmlsZVR5cGUpIC0+XG5cbiAgICAgICAgIyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gc3RyaW5nc1xuXG4gICAgICAgIEBzdHJpbmdDaGFyYWN0ZXJzID1cbiAgICAgICAgICAgIFwiJ1wiOiAgJ3NpbmdsZSdcbiAgICAgICAgICAgICdcIic6ICAnZG91YmxlJ1xuXG4gICAgICAgIHN3aXRjaCBAZmlsZVR5cGVcbiAgICAgICAgICAgIHdoZW4gJ21kJyAgIHRoZW4gQHN0cmluZ0NoYXJhY3RlcnNbJyonXSA9ICdib2xkJ1xuICAgICAgICAgICAgd2hlbiAnbm9vbicgdGhlbiBAc3RyaW5nQ2hhcmFjdGVyc1snfCddID0gJ3BpcGUnXG5cbiAgICAgICAgIyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gYnJhY2tldHNcblxuICAgICAgICBAYnJhY2tldENoYXJhY3RlcnMgPVxuICAgICAgICAgICAgb3BlbjpcbiAgICAgICAgICAgICAgICAnWyc6ICddJ1xuICAgICAgICAgICAgICAgICd7JzogJ30nXG4gICAgICAgICAgICAgICAgJygnOiAnKSdcbiAgICAgICAgICAgIGNsb3NlOiAgIHt9XG4gICAgICAgICAgICByZWdleHBzOiBbXVxuXG4gICAgICAgIHN3aXRjaCBAZmlsZVR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2h0bWwnIHRoZW4gQGJyYWNrZXRDaGFyYWN0ZXJzLm9wZW5bJzwnXSA9ICc+J1xuXG4gICAgICAgIGZvciBrLHYgb2YgQGJyYWNrZXRDaGFyYWN0ZXJzLm9wZW5cbiAgICAgICAgICAgIEBicmFja2V0Q2hhcmFjdGVycy5jbG9zZVt2XSA9IGtcblxuICAgICAgICBAYnJhY2tldENoYXJhY3RlcnMucmVnZXhwID0gW11cbiAgICAgICAgZm9yIGtleSBpbiBbJ29wZW4nICdjbG9zZSddXG4gICAgICAgICAgICBjc3RyID0gXy5rZXlzKEBicmFja2V0Q2hhcmFjdGVyc1trZXldKS5qb2luICcnXG4gICAgICAgICAgICByZWcgPSBuZXcgUmVnRXhwIFwiWyN7Xy5lc2NhcGVSZWdFeHAgY3N0cn1dXCJcbiAgICAgICAgICAgIEBicmFja2V0Q2hhcmFjdGVycy5yZWdleHBzLnB1c2ggW3JlZywga2V5XVxuXG4gICAgICAgICMgX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fIHN1cnJvdW5kXG5cbiAgICAgICAgQGluaXRTdXJyb3VuZCgpXG5cbiAgICAgICAgIyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gaW5kZW50XG5cbiAgICAgICAgQGluZGVudE5ld0xpbmVNb3JlID0gbnVsbFxuICAgICAgICBAaW5kZW50TmV3TGluZUxlc3MgPSBudWxsXG4gICAgICAgIEBpbnNlcnRJbmRlbnRlZEVtcHR5TGluZUJldHdlZW4gPSAne30nXG5cbiAgICAgICAgc3dpdGNoIEBmaWxlVHlwZVxuICAgICAgICAgICAgd2hlbiAnY29mZmVlJywgJ2tvZmZlZSdcbiAgICAgICAgICAgICAgICBAaW5kZW50TmV3TGluZU1vcmUgPVxuICAgICAgICAgICAgICAgICAgICBsaW5lRW5kc1dpdGg6IFsnLT4nLCAnPT4nLCAnOicsICc9J11cbiAgICAgICAgICAgICAgICAgICAgbGluZVJlZ0V4cDogICAvXihcXHMrd2hlbnxcXHMqaWZ8XFxzKmVsc2VcXHMraWZcXHMrKSg/IS4qXFxzdGhlblxccyl8KF58XFxzKShlbHNlXFxzKiR8c3dpdGNoXFxzfGZvclxcc3x3aGlsZVxcc3xjbGFzc1xccykvXG5cbiAgICAgICAgIyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gY29tbWVudFxuXG4gICAgICAgIEBsaW5lQ29tbWVudCA9IEBzeW50YXguYmFsYW5jZXIucmVnaW9ucy5saW5lQ29tbWVudD8ub3BlblxuICAgICAgICBAbXVsdGlDb21tZW50ID0gQHN5bnRheC5iYWxhbmNlci5yZWdpb25zLm11bHRpQ29tbWVudFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwICAgICAgICAgICAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBzZXRUZXh0OiAodGV4dD1cIlwiKSAtPlxuXG4gICAgICAgIGlmIEBzeW50YXgubmFtZSA9PSAndHh0J1xuICAgICAgICAgICAgQHN5bnRheC5uYW1lID0gU3ludGF4LnNoZWJhbmcgdGV4dC5zbGljZSAwLCB0ZXh0LnNlYXJjaCAvXFxyP1xcbi9cblxuICAgICAgICBsaW5lcyA9IHRleHQuc3BsaXQgL1xcbi9cblxuICAgICAgICBAbmV3bGluZUNoYXJhY3RlcnMgPSAnXFxuJ1xuICAgICAgICBpZiBub3QgZW1wdHkgbGluZXNcbiAgICAgICAgICAgIGlmIGxpbmVzWzBdLmVuZHNXaXRoICdcXHInXG4gICAgICAgICAgICAgICAgbGluZXMgPSB0ZXh0LnNwbGl0IC9cXHI/XFxuL1xuICAgICAgICAgICAgICAgIEBuZXdsaW5lQ2hhcmFjdGVycyA9ICdcXHJcXG4nXG5cbiAgICAgICAgQHNldExpbmVzIGxpbmVzXG5cbiAgICBzZXRMaW5lczogKGxpbmVzKSAtPlxuXG4gICAgICAgIEBzeW50YXguY2xlYXIoKVxuICAgICAgICBAc3ludGF4LnNldExpbmVzIGxpbmVzXG4gICAgICAgIHN1cGVyIGxpbmVzXG4gICAgICAgIEBlbWl0ICdsaW5lc1NldCcsIGxpbmVzXG5cbiAgICB0ZXh0T2ZTZWxlY3Rpb25Gb3JDbGlwYm9hcmQ6IC0+XG5cbiAgICAgICAgaWYgQG51bVNlbGVjdGlvbnMoKVxuICAgICAgICAgICAgQHRleHRPZlNlbGVjdGlvbigpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0ZXh0SW5SYW5nZXMgQHJhbmdlc0ZvckN1cnNvckxpbmVzKClcblxuICAgIHNwbGl0U3RhdGVMaW5lQXRQb3M6IChzdGF0ZSwgcG9zKSAtPlxuXG4gICAgICAgIGwgPSBzdGF0ZS5saW5lIHBvc1sxXVxuICAgICAgICBrZXJyb3IgXCJubyBsaW5lIGF0IHBvcyAje3Bvc30/XCIgaWYgbm90IGw/XG4gICAgICAgIHJldHVybiBbJycsJyddIGlmIG5vdCBsP1xuICAgICAgICBbbC5zbGljZSgwLCBwb3NbMF0pLCBsLnNsaWNlKHBvc1swXSldXG5cbiAgICAjIDAwMDAwMDAwICAwMCAgICAgMDAgIDAwMCAgMDAwMDAwMDAwICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMFxuXG4gICAgZW1pdEVkaXQ6IChhY3Rpb24pIC0+XG5cbiAgICAgICAgbWMgPSBAbWFpbkN1cnNvcigpXG4gICAgICAgIGxpbmUgPSBAbGluZSBtY1sxXVxuXG4gICAgICAgIEBlbWl0ICdlZGl0JyxcbiAgICAgICAgICAgIGFjdGlvbjogYWN0aW9uXG4gICAgICAgICAgICBsaW5lOiAgIGxpbmVcbiAgICAgICAgICAgIGJlZm9yZTogbGluZS5zbGljZSAwLCBtY1swXVxuICAgICAgICAgICAgYWZ0ZXI6ICBsaW5lLnNsaWNlIG1jWzBdXG4gICAgICAgICAgICBjdXJzb3I6IG1jXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuXG4gICAgaW5kZW50U3RyaW5nRm9yTGluZUF0SW5kZXg6IChsaSkgLT5cblxuICAgICAgICB3aGlsZSBlbXB0eShAbGluZShsaSkudHJpbSgpKSBhbmQgbGkgPiAwXG4gICAgICAgICAgICBsaS0tXG5cbiAgICAgICAgaWYgMCA8PSBsaSA8IEBudW1MaW5lcygpXG5cbiAgICAgICAgICAgIGlsID0gMFxuICAgICAgICAgICAgbGluZSA9IEBsaW5lIGxpXG4gICAgICAgICAgICB0aGlzSW5kZW50ICAgPSBAaW5kZW50YXRpb25BdExpbmVJbmRleCBsaVxuICAgICAgICAgICAgaW5kZW50TGVuZ3RoID0gQGluZGVudFN0cmluZy5sZW5ndGhcblxuICAgICAgICAgICAgaWYgQGluZGVudE5ld0xpbmVNb3JlP1xuICAgICAgICAgICAgICAgIGlmIEBpbmRlbnROZXdMaW5lTW9yZS5saW5lRW5kc1dpdGg/Lmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBmb3IgZSBpbiBAaW5kZW50TmV3TGluZU1vcmUubGluZUVuZHNXaXRoXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBsaW5lLnRyaW0oKS5lbmRzV2l0aCBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWwgPSB0aGlzSW5kZW50ICsgaW5kZW50TGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBpZiBpbCA9PSAwXG4gICAgICAgICAgICAgICAgICAgIGlmIEBpbmRlbnROZXdMaW5lTW9yZS5saW5lUmVnRXhwPyBhbmQgQGluZGVudE5ld0xpbmVNb3JlLmxpbmVSZWdFeHAudGVzdCBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICBpbCA9IHRoaXNJbmRlbnQgKyBpbmRlbnRMZW5ndGhcblxuICAgICAgICAgICAgaWwgPSB0aGlzSW5kZW50IGlmIGlsID09IDBcbiAgICAgICAgICAgIGlsID0gTWF0aC5tYXggaWwsIEBpbmRlbnRhdGlvbkF0TGluZUluZGV4IGxpKzFcblxuICAgICAgICAgICAgXy5wYWRTdGFydCBcIlwiLCBpbFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICAnJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRvclxuIl19
//# sourceURL=../../coffee/editor/editor.coffee