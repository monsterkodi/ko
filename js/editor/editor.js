// koffee 1.7.0

/*
00000000  0000000    000  000000000   0000000   00000000
000       000   000  000     000     000   000  000   000
0000000   000   000  000     000     000   000  0000000
000       000   000  000     000     000   000  000   000
00000000  0000000    000     000      0000000   000   000
 */
var Buffer, Do, Editor, Syntax, _, empty, filelist, kerror, ref, slash, valid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), _ = ref._, empty = ref.empty, filelist = ref.filelist, kerror = ref.kerror, slash = ref.slash, valid = ref.valid;

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
            ref1.name = newType;
        }
        this.setFileType(newType);
        if (oldType !== this.fileType) {
            return this.emit('fileTypeChanged', this.fileType);
        }
    };

    Editor.prototype.setFileType = function(fileType) {
        var cstr, i, k, key, len, ref1, ref2, reg, v;
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
        this.multiComment = (function() {
            switch (this.fileType) {
                case 'coffee':
                case 'koffee':
                    return {
                        open: '###',
                        close: '###'
                    };
                case 'html':
                case 'md':
                    return {
                        open: '<!--',
                        close: '-->'
                    };
                case 'styl':
                case 'cpp':
                case 'c':
                case 'h':
                case 'hpp':
                case 'cxx':
                case 'cs':
                case 'js':
                case 'scss':
                case 'ts':
                case 'swift':
                case 'frag':
                case 'vert':
                    return {
                        open: '/*',
                        close: '*/'
                    };
            }
        }).call(this);
        this.lineComment = (function() {
            switch (this.fileType) {
                case 'coffee':
                case 'koffee':
                case 'sh':
                case 'bat':
                case 'noon':
                case 'ko':
                case 'txt':
                case 'fish':
                    return '#';
                case 'styl':
                case 'cpp':
                case 'c':
                case 'h':
                case 'hpp':
                case 'cxx':
                case 'cs':
                case 'js':
                case 'scss':
                case 'ts':
                case 'swift':
                case 'frag':
                case 'vert':
                    return '//';
                case 'iss':
                case 'ini':
                    return ';';
            }
        }).call(this);
        if (this.lineComment) {
            return this.headerRegExp = new RegExp("^(\\s*" + (_.escapeRegExp(this.lineComment)) + "\\s*)?(\\s*0[0\\s]+)$");
        }
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
        if (valid(lines)) {
            if (lines[0].endsWith('\r')) {
                lines = text.split(/\r?\n/);
                this.newlineCharacters = '\r\n';
            }
        }
        return this.setLines(lines);
    };

    Editor.prototype.setLines = function(lines) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx5RUFBQTtJQUFBOzs7QUFRQSxNQUErQyxPQUFBLENBQVEsS0FBUixDQUEvQyxFQUFFLFNBQUYsRUFBSyxpQkFBTCxFQUFZLHVCQUFaLEVBQXNCLG1CQUF0QixFQUE4QixpQkFBOUIsRUFBcUM7O0FBRXJDLE1BQUEsR0FBVSxPQUFBLENBQVEsVUFBUjs7QUFDVixNQUFBLEdBQVUsT0FBQSxDQUFRLFVBQVI7O0FBQ1YsRUFBQSxHQUFVLE9BQUEsQ0FBUSxNQUFSOztBQUVKOzs7SUFFRixNQUFDLENBQUEsT0FBRCxHQUFXOztJQUVSLGdCQUFDLElBQUQsRUFBTyxNQUFQO0FBRUMsWUFBQTtRQUFBLHNDQUFBO1FBRUEsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxNQUFELG9CQUFVLFNBQVM7O2dCQUNaLENBQUM7O2dCQUFELENBQUMsYUFBYzs7UUFFdEIsSUFBNEIsc0JBQTVCO1lBQUEsTUFBTSxDQUFDLFdBQVAsQ0FBQSxFQUFBOztRQUVBLElBQUMsQ0FBQSxZQUFELEdBQW1CLENBQUMsQ0FBQyxRQUFGLENBQVcsRUFBWCxFQUFlLENBQWY7UUFDbkIsSUFBQyxDQUFBLGVBQUQsR0FBbUI7UUFDbkIsSUFBQyxDQUFBLE1BQUQsR0FBbUIsSUFBSSxNQUFKLENBQVcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFuQixFQUErQixJQUFDLENBQUEsSUFBaEMsRUFBc0MsSUFBQyxDQUFBLEtBQXZDO1FBQ25CLElBQUMsRUFBQSxFQUFBLEVBQUQsR0FBbUIsSUFBSSxFQUFKLENBQU8sSUFBUDtRQUVuQixJQUFDLENBQUEsYUFBRCxDQUFBO0lBZkQ7O3FCQWlCSCxHQUFBLEdBQUssU0FBQTtlQUVELElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7SUFGQzs7SUFVTCxNQUFDLENBQUEsV0FB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QUFHLEVBQUEsS0FBTSxDQUFUO29CQUNJLElBQUcsMkNBQUEsSUFBbUMsSUFBQyxDQUFBLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxJQUE5QixDQUFtQyxJQUFuQyxDQUF0Qzt3QkFDSSxFQUFBLEdBQUssVUFBQSxHQUFhLGFBRHRCO3FCQURKO2lCQU5KOztZQVVBLElBQW1CLEVBQUEsS0FBTSxDQUF6QjtnQkFBQSxFQUFBLEdBQUssV0FBTDs7WUFDQSxFQUFBLEdBQUssSUFBSSxDQUFDLEdBQUwsQ0FBUyxFQUFULEVBQWEsSUFBQyxDQUFBLHNCQUFELENBQXdCLEVBQUEsR0FBRyxDQUEzQixDQUFiO21CQUVMLENBQUMsQ0FBQyxRQUFGLENBQVcsRUFBWCxFQUFlLEVBQWYsRUFwQko7U0FBQSxNQUFBO21CQXNCSSxHQXRCSjs7SUFMd0I7Ozs7R0EzTVg7O0FBd09yQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiMjI1xuXG57IF8sIGVtcHR5LCBmaWxlbGlzdCwga2Vycm9yLCBzbGFzaCwgdmFsaWQgfSA9IHJlcXVpcmUgJ2t4aydcblxuQnVmZmVyICA9IHJlcXVpcmUgJy4vYnVmZmVyJ1xuU3ludGF4ICA9IHJlcXVpcmUgJy4vc3ludGF4J1xuRG8gICAgICA9IHJlcXVpcmUgJy4vZG8nXG5cbmNsYXNzIEVkaXRvciBleHRlbmRzIEJ1ZmZlclxuXG4gICAgQGFjdGlvbnMgPSBudWxsXG5cbiAgICBAOiAobmFtZSwgY29uZmlnKSAtPlxuXG4gICAgICAgIHN1cGVyKClcblxuICAgICAgICBAbmFtZSAgID0gbmFtZVxuICAgICAgICBAY29uZmlnID0gY29uZmlnID8ge31cbiAgICAgICAgQGNvbmZpZy5zeW50YXhOYW1lID89ICd0eHQnXG5cbiAgICAgICAgRWRpdG9yLmluaXRBY3Rpb25zKCkgaWYgbm90IEVkaXRvci5hY3Rpb25zP1xuXG4gICAgICAgIEBpbmRlbnRTdHJpbmcgICAgPSBfLnBhZFN0YXJ0IFwiXCIsIDRcbiAgICAgICAgQHN0aWNreVNlbGVjdGlvbiA9IGZhbHNlXG4gICAgICAgIEBzeW50YXggICAgICAgICAgPSBuZXcgU3ludGF4IEBjb25maWcuc3ludGF4TmFtZSwgQGxpbmUsIEBsaW5lc1xuICAgICAgICBAZG8gICAgICAgICAgICAgID0gbmV3IERvIEBcblxuICAgICAgICBAc2V0dXBGaWxlVHlwZSgpXG5cbiAgICBkZWw6IC0+XG5cbiAgICAgICAgQGRvLmRlbCgpXG5cbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgQGluaXRBY3Rpb25zOiAtPlxuXG4gICAgICAgIEBhY3Rpb25zID0gW11cbiAgICAgICAgZm9yIGFjdGlvbkZpbGUgaW4gZmlsZWxpc3Qoc2xhc2guam9pbiBfX2Rpcm5hbWUsICdhY3Rpb25zJylcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIHNsYXNoLmV4dChhY3Rpb25GaWxlKSBub3QgaW4gWydqcycgJ2NvZmZlZSddXG4gICAgICAgICAgICBhY3Rpb25zID0gcmVxdWlyZSBhY3Rpb25GaWxlXG4gICAgICAgICAgICBmb3Iga2V5LHZhbHVlIG9mIGFjdGlvbnNcbiAgICAgICAgICAgICAgICBpZiBfLmlzRnVuY3Rpb24gdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgQHByb3RvdHlwZVtrZXldID0gdmFsdWVcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGtleSA9PSAnYWN0aW9ucydcbiAgICAgICAgICAgICAgICAgICAgZm9yIGssdiBvZiB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm90IF8uaXNTdHJpbmcgdlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYua2V5ID0gayBpZiBub3Qgdi5rZXk/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGFjdGlvbnMucHVzaCB2XG5cbiAgICAgICAgIyB0b28gZWFybHkgZm9yIGxvZyBoZXJlIVxuICAgICAgICAjIGNvbnNvbGUubG9nIHN0ciBAYWN0aW9uc1xuXG4gICAgQGFjdGlvbldpdGhOYW1lOiAobmFtZSkgLT5cblxuICAgICAgICBmb3IgYWN0aW9uIGluIEVkaXRvci5hY3Rpb25zXG4gICAgICAgICAgICBpZiBhY3Rpb24ubmFtZSA9PSBuYW1lXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjdGlvblxuICAgICAgICBudWxsXG5cbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgICAwMDAgMDAwICAgMDAwICAgMDAwICAwMDBcbiAgICAjICAgIDAwMCAgICAgICAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMFxuICAgICMgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMDBcblxuICAgIHNoZWJhbmdGaWxlVHlwZTogLT4gQGNvbmZpZz8uc3ludGF4TmFtZSA/ICd0eHQnXG5cbiAgICBzZXR1cEZpbGVUeXBlOiAtPlxuXG4gICAgICAgIG9sZFR5cGUgPSBAZmlsZVR5cGVcbiAgICAgICAgbmV3VHlwZSA9IEBzaGViYW5nRmlsZVR5cGUoKVxuXG4gICAgICAgIEBzeW50YXg/Lm5hbWUgPSBuZXdUeXBlXG4gICAgICAgIEBzZXRGaWxlVHlwZSBuZXdUeXBlXG5cbiAgICAgICAgaWYgb2xkVHlwZSAhPSBAZmlsZVR5cGVcbiAgICAgICAgICAgIEBlbWl0ICdmaWxlVHlwZUNoYW5nZWQnLCBAZmlsZVR5cGVcblxuICAgIHNldEZpbGVUeXBlOiAoQGZpbGVUeXBlKSAtPlxuXG4gICAgICAgICMgX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fIHN0cmluZ3NcblxuICAgICAgICBAc3RyaW5nQ2hhcmFjdGVycyA9XG4gICAgICAgICAgICBcIidcIjogICdzaW5nbGUnXG4gICAgICAgICAgICAnXCInOiAgJ2RvdWJsZSdcblxuICAgICAgICBzd2l0Y2ggQGZpbGVUeXBlXG4gICAgICAgICAgICB3aGVuICdtZCcgICB0aGVuIEBzdHJpbmdDaGFyYWN0ZXJzWycqJ10gPSAnYm9sZCdcbiAgICAgICAgICAgIHdoZW4gJ25vb24nIHRoZW4gQHN0cmluZ0NoYXJhY3RlcnNbJ3wnXSA9ICdwaXBlJ1xuXG4gICAgICAgICMgX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fIGJyYWNrZXRzXG5cbiAgICAgICAgQGJyYWNrZXRDaGFyYWN0ZXJzID1cbiAgICAgICAgICAgIG9wZW46XG4gICAgICAgICAgICAgICAgJ1snOiAnXSdcbiAgICAgICAgICAgICAgICAneyc6ICd9J1xuICAgICAgICAgICAgICAgICcoJzogJyknXG4gICAgICAgICAgICBjbG9zZTogICB7fVxuICAgICAgICAgICAgcmVnZXhwczogW11cblxuICAgICAgICBzd2l0Y2ggQGZpbGVUeXBlXG4gICAgICAgICAgICB3aGVuICdodG1sJyB0aGVuIEBicmFja2V0Q2hhcmFjdGVycy5vcGVuWyc8J10gPSAnPidcblxuICAgICAgICBmb3Igayx2IG9mIEBicmFja2V0Q2hhcmFjdGVycy5vcGVuXG4gICAgICAgICAgICBAYnJhY2tldENoYXJhY3RlcnMuY2xvc2Vbdl0gPSBrXG5cbiAgICAgICAgQGJyYWNrZXRDaGFyYWN0ZXJzLnJlZ2V4cCA9IFtdXG4gICAgICAgIGZvciBrZXkgaW4gWydvcGVuJyAnY2xvc2UnXVxuICAgICAgICAgICAgY3N0ciA9IF8ua2V5cyhAYnJhY2tldENoYXJhY3RlcnNba2V5XSkuam9pbiAnJ1xuICAgICAgICAgICAgcmVnID0gbmV3IFJlZ0V4cCBcIlsje18uZXNjYXBlUmVnRXhwIGNzdHJ9XVwiXG4gICAgICAgICAgICBAYnJhY2tldENoYXJhY3RlcnMucmVnZXhwcy5wdXNoIFtyZWcsIGtleV1cblxuICAgICAgICBAaW5pdFN1cnJvdW5kKClcblxuICAgICAgICAjIF9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fXyBpbmRlbnRcblxuICAgICAgICBAaW5kZW50TmV3TGluZU1vcmUgPSBudWxsXG4gICAgICAgIEBpbmRlbnROZXdMaW5lTGVzcyA9IG51bGxcbiAgICAgICAgQGluc2VydEluZGVudGVkRW1wdHlMaW5lQmV0d2VlbiA9ICd7fSdcblxuICAgICAgICBzd2l0Y2ggQGZpbGVUeXBlXG4gICAgICAgICAgICB3aGVuICdjb2ZmZWUnLCAna29mZmVlJ1xuICAgICAgICAgICAgICAgIEBpbmRlbnROZXdMaW5lTW9yZSA9XG4gICAgICAgICAgICAgICAgICAgIGxpbmVFbmRzV2l0aDogWyctPicsICc9PicsICc6JywgJz0nXVxuICAgICAgICAgICAgICAgICAgICBsaW5lUmVnRXhwOiAgIC9eKFxccyt3aGVufFxccyppZnxcXHMqZWxzZVxccytpZlxccyspKD8hLipcXHN0aGVuXFxzKXwoXnxcXHMpKGVsc2VcXHMqJHxzd2l0Y2hcXHN8Zm9yXFxzfHdoaWxlXFxzfGNsYXNzXFxzKS9cblxuICAgICAgICAjIF9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fXyBjb21tZW50XG4gICAgICAgIFxuICAgICAgICBAbXVsdGlDb21tZW50ID0gc3dpdGNoIEBmaWxlVHlwZVxuICAgICAgICAgICAgd2hlbiAnY29mZmVlJyAna29mZmVlJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBvcGVuOicjIyMnICBjbG9zZTonIyMjJ1xuICAgICAgICAgICAgd2hlbiAnaHRtbCcgJ21kJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBvcGVuOic8IS0tJyBjbG9zZTonLS0+J1xuICAgICAgICAgICAgd2hlbiAnc3R5bCcgJ2NwcCcgJ2MnICdoJyAnaHBwJyAnY3h4JyAnY3MnICdqcycgJ3Njc3MnICd0cycgJ3N3aWZ0JyAnZnJhZycgJ3ZlcnQnIHRoZW4gb3BlbjonLyonICAgY2xvc2U6JyovJ1xuICAgICAgICBcbiAgICAgICAgQGxpbmVDb21tZW50ID0gc3dpdGNoIEBmaWxlVHlwZVxuICAgICAgICAgICAgIHdoZW4gJ2NvZmZlZScgJ2tvZmZlZScgJ3NoJyAnYmF0JyAnbm9vbicgJ2tvJyAndHh0JyAnZmlzaCcgICAgICAgICAgICAgIHRoZW4gJyMnXG4gICAgICAgICAgICAgd2hlbiAnc3R5bCcgJ2NwcCcgJ2MnICdoJyAnaHBwJyAnY3h4JyAnY3MnICdqcycgJ3Njc3MnICd0cycgJ3N3aWZ0JyAnZnJhZycgJ3ZlcnQnIHRoZW4gJy8vJ1xuICAgICAgICAgICAgIHdoZW4gJ2lzcycgJ2luaScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gJzsnXG4gICAgICAgICAgICAgXG4gICAgICAgIGlmIEBsaW5lQ29tbWVudFxuICAgICAgICAgICAgQGhlYWRlclJlZ0V4cCA9IG5ldyBSZWdFeHAoXCJeKFxcXFxzKiN7Xy5lc2NhcGVSZWdFeHAgQGxpbmVDb21tZW50fVxcXFxzKik/KFxcXFxzKjBbMFxcXFxzXSspJFwiKVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwICAgICAgICAgICAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBzZXRUZXh0OiAodGV4dD1cIlwiKSAtPlxuXG4gICAgICAgIGlmIEBzeW50YXgubmFtZSA9PSAndHh0J1xuICAgICAgICAgICAgQHN5bnRheC5uYW1lID0gU3ludGF4LnNoZWJhbmcgdGV4dC5zbGljZSAwLCB0ZXh0LnNlYXJjaCAvXFxyP1xcbi9cblxuICAgICAgICBsaW5lcyA9IHRleHQuc3BsaXQgL1xcbi9cblxuICAgICAgICBAbmV3bGluZUNoYXJhY3RlcnMgPSAnXFxuJ1xuICAgICAgICBpZiB2YWxpZCBsaW5lc1xuICAgICAgICAgICAgaWYgbGluZXNbMF0uZW5kc1dpdGggJ1xccidcbiAgICAgICAgICAgICAgICBsaW5lcyA9IHRleHQuc3BsaXQgL1xccj9cXG4vXG4gICAgICAgICAgICAgICAgQG5ld2xpbmVDaGFyYWN0ZXJzID0gJ1xcclxcbidcblxuICAgICAgICBAc2V0TGluZXMgbGluZXNcblxuICAgIHNldExpbmVzOiAobGluZXMpIC0+XG5cbiAgICAgICAgQHN5bnRheC5zZXRMaW5lcyBsaW5lc1xuICAgICAgICBzdXBlciBsaW5lc1xuICAgICAgICBAZW1pdCAnbGluZXNTZXQnIGxpbmVzXG5cbiAgICB0ZXh0T2ZTZWxlY3Rpb25Gb3JDbGlwYm9hcmQ6IC0+XG5cbiAgICAgICAgaWYgQG51bVNlbGVjdGlvbnMoKVxuICAgICAgICAgICAgQHRleHRPZlNlbGVjdGlvbigpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0ZXh0SW5SYW5nZXMgQHJhbmdlc0ZvckN1cnNvckxpbmVzKClcblxuICAgIHNwbGl0U3RhdGVMaW5lQXRQb3M6IChzdGF0ZSwgcG9zKSAtPlxuXG4gICAgICAgIGwgPSBzdGF0ZS5saW5lIHBvc1sxXVxuICAgICAgICBrZXJyb3IgXCJubyBsaW5lIGF0IHBvcyAje3Bvc30/XCIgaWYgbm90IGw/XG4gICAgICAgIHJldHVybiBbJycgJyddIGlmIG5vdCBsP1xuICAgICAgICBbbC5zbGljZSgwLCBwb3NbMF0pLCBsLnNsaWNlKHBvc1swXSldXG5cbiAgICAjIDAwMDAwMDAwICAwMCAgICAgMDAgIDAwMCAgMDAwMDAwMDAwICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMFxuXG4gICAgZW1pdEVkaXQ6IChhY3Rpb24pIC0+XG5cbiAgICAgICAgbWMgPSBAbWFpbkN1cnNvcigpXG4gICAgICAgIGxpbmUgPSBAbGluZSBtY1sxXVxuXG4gICAgICAgIEBlbWl0ICdlZGl0JyxcbiAgICAgICAgICAgIGFjdGlvbjogYWN0aW9uXG4gICAgICAgICAgICBsaW5lOiAgIGxpbmVcbiAgICAgICAgICAgIGJlZm9yZTogbGluZS5zbGljZSAwLCBtY1swXVxuICAgICAgICAgICAgYWZ0ZXI6ICBsaW5lLnNsaWNlIG1jWzBdXG4gICAgICAgICAgICBjdXJzb3I6IG1jXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuXG4gICAgaW5kZW50U3RyaW5nRm9yTGluZUF0SW5kZXg6IChsaSkgLT5cblxuICAgICAgICB3aGlsZSBlbXB0eShAbGluZShsaSkudHJpbSgpKSBhbmQgbGkgPiAwXG4gICAgICAgICAgICBsaS0tXG5cbiAgICAgICAgaWYgMCA8PSBsaSA8IEBudW1MaW5lcygpXG5cbiAgICAgICAgICAgIGlsID0gMFxuICAgICAgICAgICAgbGluZSA9IEBsaW5lIGxpXG4gICAgICAgICAgICB0aGlzSW5kZW50ICAgPSBAaW5kZW50YXRpb25BdExpbmVJbmRleCBsaVxuICAgICAgICAgICAgaW5kZW50TGVuZ3RoID0gQGluZGVudFN0cmluZy5sZW5ndGhcblxuICAgICAgICAgICAgaWYgQGluZGVudE5ld0xpbmVNb3JlP1xuICAgICAgICAgICAgICAgIGlmIEBpbmRlbnROZXdMaW5lTW9yZS5saW5lRW5kc1dpdGg/Lmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBmb3IgZSBpbiBAaW5kZW50TmV3TGluZU1vcmUubGluZUVuZHNXaXRoXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBsaW5lLnRyaW0oKS5lbmRzV2l0aCBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWwgPSB0aGlzSW5kZW50ICsgaW5kZW50TGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBpZiBpbCA9PSAwXG4gICAgICAgICAgICAgICAgICAgIGlmIEBpbmRlbnROZXdMaW5lTW9yZS5saW5lUmVnRXhwPyBhbmQgQGluZGVudE5ld0xpbmVNb3JlLmxpbmVSZWdFeHAudGVzdCBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICBpbCA9IHRoaXNJbmRlbnQgKyBpbmRlbnRMZW5ndGhcblxuICAgICAgICAgICAgaWwgPSB0aGlzSW5kZW50IGlmIGlsID09IDBcbiAgICAgICAgICAgIGlsID0gTWF0aC5tYXggaWwsIEBpbmRlbnRhdGlvbkF0TGluZUluZGV4IGxpKzFcblxuICAgICAgICAgICAgXy5wYWRTdGFydCBcIlwiLCBpbFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICAnJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRvclxuIl19
//# sourceURL=../../coffee/editor/editor.coffee