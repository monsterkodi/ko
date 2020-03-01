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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx5RUFBQTtJQUFBOzs7QUFRQSxNQUErQyxPQUFBLENBQVEsS0FBUixDQUEvQyxFQUFFLFNBQUYsRUFBSyxpQkFBTCxFQUFZLHVCQUFaLEVBQXNCLG1CQUF0QixFQUE4QixpQkFBOUIsRUFBcUM7O0FBRXJDLE1BQUEsR0FBVSxPQUFBLENBQVEsVUFBUjs7QUFDVixNQUFBLEdBQVUsT0FBQSxDQUFRLFVBQVI7O0FBQ1YsRUFBQSxHQUFVLE9BQUEsQ0FBUSxNQUFSOztBQUVKOzs7SUFFRixNQUFDLENBQUEsT0FBRCxHQUFXOztJQUVSLGdCQUFDLElBQUQsRUFBTyxNQUFQO0FBRUMsWUFBQTtRQUFBLHNDQUFBO1FBRUEsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxNQUFELG9CQUFVLFNBQVM7O2dCQUNaLENBQUM7O2dCQUFELENBQUMsYUFBYzs7UUFFdEIsSUFBNEIsc0JBQTVCO1lBQUEsTUFBTSxDQUFDLFdBQVAsQ0FBQSxFQUFBOztRQUVBLElBQUMsQ0FBQSxZQUFELEdBQW1CLENBQUMsQ0FBQyxRQUFGLENBQVcsRUFBWCxFQUFlLENBQWY7UUFDbkIsSUFBQyxDQUFBLGVBQUQsR0FBbUI7UUFDbkIsSUFBQyxDQUFBLE1BQUQsR0FBbUIsSUFBSSxNQUFKLENBQVcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFuQixFQUErQixJQUFDLENBQUEsSUFBaEMsRUFBc0MsSUFBQyxDQUFBLEtBQXZDO1FBQ25CLElBQUMsRUFBQSxFQUFBLEVBQUQsR0FBbUIsSUFBSSxFQUFKLENBQU8sSUFBUDtRQUVuQixJQUFDLENBQUEsYUFBRCxDQUFBO0lBZkQ7O3FCQWlCSCxHQUFBLEdBQUssU0FBQTtlQUVELElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7SUFGQzs7SUFVTCxNQUFDLENBQUEsV0FB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QUFHLEVBQUEsS0FBTSxDQUFUO29CQUNJLElBQUcsMkNBQUEsSUFBbUMsSUFBQyxDQUFBLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxJQUE5QixDQUFtQyxJQUFuQyxDQUF0Qzt3QkFDSSxFQUFBLEdBQUssVUFBQSxHQUFhLGFBRHRCO3FCQURKO2lCQU5KOztZQVVBLElBQW1CLEVBQUEsS0FBTSxDQUF6QjtnQkFBQSxFQUFBLEdBQUssV0FBTDs7WUFDQSxFQUFBLEdBQUssSUFBSSxDQUFDLEdBQUwsQ0FBUyxFQUFULEVBQWEsSUFBQyxDQUFBLHNCQUFELENBQXdCLEVBQUEsR0FBRyxDQUEzQixDQUFiO21CQUVMLENBQUMsQ0FBQyxRQUFGLENBQVcsRUFBWCxFQUFlLEVBQWYsRUFwQko7U0FBQSxNQUFBO21CQXNCSSxHQXRCSjs7SUFMd0I7Ozs7R0EzTVg7O0FBd09yQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiMjI1xuXG57IF8sIGVtcHR5LCBmaWxlbGlzdCwga2Vycm9yLCBzbGFzaCwgdmFsaWQgfSA9IHJlcXVpcmUgJ2t4aydcblxuQnVmZmVyICA9IHJlcXVpcmUgJy4vYnVmZmVyJ1xuU3ludGF4ICA9IHJlcXVpcmUgJy4vc3ludGF4J1xuRG8gICAgICA9IHJlcXVpcmUgJy4vZG8nXG5cbmNsYXNzIEVkaXRvciBleHRlbmRzIEJ1ZmZlclxuXG4gICAgQGFjdGlvbnMgPSBudWxsXG5cbiAgICBAOiAobmFtZSwgY29uZmlnKSAtPlxuXG4gICAgICAgIHN1cGVyKClcblxuICAgICAgICBAbmFtZSAgID0gbmFtZVxuICAgICAgICBAY29uZmlnID0gY29uZmlnID8ge31cbiAgICAgICAgQGNvbmZpZy5zeW50YXhOYW1lID89ICd0eHQnXG5cbiAgICAgICAgRWRpdG9yLmluaXRBY3Rpb25zKCkgaWYgbm90IEVkaXRvci5hY3Rpb25zP1xuXG4gICAgICAgIEBpbmRlbnRTdHJpbmcgICAgPSBfLnBhZFN0YXJ0IFwiXCIsIDRcbiAgICAgICAgQHN0aWNreVNlbGVjdGlvbiA9IGZhbHNlXG4gICAgICAgIEBzeW50YXggICAgICAgICAgPSBuZXcgU3ludGF4IEBjb25maWcuc3ludGF4TmFtZSwgQGxpbmUsIEBsaW5lc1xuICAgICAgICBAZG8gICAgICAgICAgICAgID0gbmV3IERvIEBcblxuICAgICAgICBAc2V0dXBGaWxlVHlwZSgpXG5cbiAgICBkZWw6IC0+XG5cbiAgICAgICAgQGRvLmRlbCgpXG5cbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgQGluaXRBY3Rpb25zOiAtPlxuXG4gICAgICAgIEBhY3Rpb25zID0gW11cbiAgICAgICAgZm9yIGFjdGlvbkZpbGUgaW4gZmlsZWxpc3Qoc2xhc2guam9pbiBfX2Rpcm5hbWUsICdhY3Rpb25zJylcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIHNsYXNoLmV4dChhY3Rpb25GaWxlKSBub3QgaW4gWydqcycsICdjb2ZmZWUnXVxuICAgICAgICAgICAgYWN0aW9ucyA9IHJlcXVpcmUgYWN0aW9uRmlsZVxuICAgICAgICAgICAgZm9yIGtleSx2YWx1ZSBvZiBhY3Rpb25zXG4gICAgICAgICAgICAgICAgaWYgXy5pc0Z1bmN0aW9uIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIEBwcm90b3R5cGVba2V5XSA9IHZhbHVlXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBrZXkgPT0gJ2FjdGlvbnMnXG4gICAgICAgICAgICAgICAgICAgIGZvciBrLHYgb2YgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG5vdCBfLmlzU3RyaW5nIHZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2LmtleSA9IGsgaWYgbm90IHYua2V5P1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBhY3Rpb25zLnB1c2ggdlxuXG4gICAgICAgICMgdG9vIGVhcmx5IGZvciBsb2cgaGVyZSFcbiAgICAgICAgIyBjb25zb2xlLmxvZyBzdHIgQGFjdGlvbnNcblxuICAgIEBhY3Rpb25XaXRoTmFtZTogKG5hbWUpIC0+XG5cbiAgICAgICAgZm9yIGFjdGlvbiBpbiBFZGl0b3IuYWN0aW9uc1xuICAgICAgICAgICAgaWYgYWN0aW9uLm5hbWUgPT0gbmFtZVxuICAgICAgICAgICAgICAgIHJldHVybiBhY3Rpb25cbiAgICAgICAgbnVsbFxuXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAgICAwMDAgICAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMDAwMDAwXG5cbiAgICBzaGViYW5nRmlsZVR5cGU6IC0+IEBjb25maWc/LnN5bnRheE5hbWUgPyAndHh0J1xuXG4gICAgc2V0dXBGaWxlVHlwZTogLT5cblxuICAgICAgICBvbGRUeXBlID0gQGZpbGVUeXBlXG4gICAgICAgIG5ld1R5cGUgPSBAc2hlYmFuZ0ZpbGVUeXBlKClcblxuICAgICAgICBAc3ludGF4Py5uYW1lID0gbmV3VHlwZVxuICAgICAgICBAc2V0RmlsZVR5cGUgbmV3VHlwZVxuXG4gICAgICAgIGlmIG9sZFR5cGUgIT0gQGZpbGVUeXBlXG4gICAgICAgICAgICBAZW1pdCAnZmlsZVR5cGVDaGFuZ2VkJywgQGZpbGVUeXBlXG5cbiAgICBzZXRGaWxlVHlwZTogKEBmaWxlVHlwZSkgLT5cblxuICAgICAgICAjIF9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fXyBzdHJpbmdzXG5cbiAgICAgICAgQHN0cmluZ0NoYXJhY3RlcnMgPVxuICAgICAgICAgICAgXCInXCI6ICAnc2luZ2xlJ1xuICAgICAgICAgICAgJ1wiJzogICdkb3VibGUnXG5cbiAgICAgICAgc3dpdGNoIEBmaWxlVHlwZVxuICAgICAgICAgICAgd2hlbiAnbWQnICAgdGhlbiBAc3RyaW5nQ2hhcmFjdGVyc1snKiddID0gJ2JvbGQnXG4gICAgICAgICAgICB3aGVuICdub29uJyB0aGVuIEBzdHJpbmdDaGFyYWN0ZXJzWyd8J10gPSAncGlwZSdcblxuICAgICAgICAjIF9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fXyBicmFja2V0c1xuXG4gICAgICAgIEBicmFja2V0Q2hhcmFjdGVycyA9XG4gICAgICAgICAgICBvcGVuOlxuICAgICAgICAgICAgICAgICdbJzogJ10nXG4gICAgICAgICAgICAgICAgJ3snOiAnfSdcbiAgICAgICAgICAgICAgICAnKCc6ICcpJ1xuICAgICAgICAgICAgY2xvc2U6ICAge31cbiAgICAgICAgICAgIHJlZ2V4cHM6IFtdXG5cbiAgICAgICAgc3dpdGNoIEBmaWxlVHlwZVxuICAgICAgICAgICAgd2hlbiAnaHRtbCcgdGhlbiBAYnJhY2tldENoYXJhY3RlcnMub3BlblsnPCddID0gJz4nXG5cbiAgICAgICAgZm9yIGssdiBvZiBAYnJhY2tldENoYXJhY3RlcnMub3BlblxuICAgICAgICAgICAgQGJyYWNrZXRDaGFyYWN0ZXJzLmNsb3NlW3ZdID0ga1xuXG4gICAgICAgIEBicmFja2V0Q2hhcmFjdGVycy5yZWdleHAgPSBbXVxuICAgICAgICBmb3Iga2V5IGluIFsnb3BlbicgJ2Nsb3NlJ11cbiAgICAgICAgICAgIGNzdHIgPSBfLmtleXMoQGJyYWNrZXRDaGFyYWN0ZXJzW2tleV0pLmpvaW4gJydcbiAgICAgICAgICAgIHJlZyA9IG5ldyBSZWdFeHAgXCJbI3tfLmVzY2FwZVJlZ0V4cCBjc3RyfV1cIlxuICAgICAgICAgICAgQGJyYWNrZXRDaGFyYWN0ZXJzLnJlZ2V4cHMucHVzaCBbcmVnLCBrZXldXG5cbiAgICAgICAgQGluaXRTdXJyb3VuZCgpXG5cbiAgICAgICAgIyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gaW5kZW50XG5cbiAgICAgICAgQGluZGVudE5ld0xpbmVNb3JlID0gbnVsbFxuICAgICAgICBAaW5kZW50TmV3TGluZUxlc3MgPSBudWxsXG4gICAgICAgIEBpbnNlcnRJbmRlbnRlZEVtcHR5TGluZUJldHdlZW4gPSAne30nXG5cbiAgICAgICAgc3dpdGNoIEBmaWxlVHlwZVxuICAgICAgICAgICAgd2hlbiAnY29mZmVlJywgJ2tvZmZlZSdcbiAgICAgICAgICAgICAgICBAaW5kZW50TmV3TGluZU1vcmUgPVxuICAgICAgICAgICAgICAgICAgICBsaW5lRW5kc1dpdGg6IFsnLT4nLCAnPT4nLCAnOicsICc9J11cbiAgICAgICAgICAgICAgICAgICAgbGluZVJlZ0V4cDogICAvXihcXHMrd2hlbnxcXHMqaWZ8XFxzKmVsc2VcXHMraWZcXHMrKSg/IS4qXFxzdGhlblxccyl8KF58XFxzKShlbHNlXFxzKiR8c3dpdGNoXFxzfGZvclxcc3x3aGlsZVxcc3xjbGFzc1xccykvXG5cbiAgICAgICAgIyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gY29tbWVudFxuICAgICAgICBcbiAgICAgICAgQG11bHRpQ29tbWVudCA9IHN3aXRjaCBAZmlsZVR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2NvZmZlZScgJ2tvZmZlZScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gb3BlbjonIyMjJyAgY2xvc2U6JyMjIydcbiAgICAgICAgICAgIHdoZW4gJ2h0bWwnICdtZCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gb3BlbjonPCEtLScgY2xvc2U6Jy0tPidcbiAgICAgICAgICAgIHdoZW4gJ3N0eWwnICdjcHAnICdjJyAnaCcgJ2hwcCcgJ2N4eCcgJ2NzJyAnanMnICdzY3NzJyAndHMnICdzd2lmdCcgJ2ZyYWcnICd2ZXJ0JyB0aGVuIG9wZW46Jy8qJyAgIGNsb3NlOicqLydcbiAgICAgICAgXG4gICAgICAgIEBsaW5lQ29tbWVudCA9IHN3aXRjaCBAZmlsZVR5cGVcbiAgICAgICAgICAgICB3aGVuICdjb2ZmZWUnICdrb2ZmZWUnICdzaCcgJ2JhdCcgJ25vb24nICdrbycgJ3R4dCcgJ2Zpc2gnICAgICAgICAgICAgICB0aGVuICcjJ1xuICAgICAgICAgICAgIHdoZW4gJ3N0eWwnICdjcHAnICdjJyAnaCcgJ2hwcCcgJ2N4eCcgJ2NzJyAnanMnICdzY3NzJyAndHMnICdzd2lmdCcgJ2ZyYWcnICd2ZXJ0JyB0aGVuICcvLydcbiAgICAgICAgICAgICB3aGVuICdpc3MnICdpbmknICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuICc7J1xuICAgICAgICAgICAgIFxuICAgICAgICBpZiBAbGluZUNvbW1lbnRcbiAgICAgICAgICAgIEBoZWFkZXJSZWdFeHAgPSBuZXcgUmVnRXhwKFwiXihcXFxccyoje18uZXNjYXBlUmVnRXhwIEBsaW5lQ29tbWVudH1cXFxccyopPyhcXFxccyowWzBcXFxcc10rKSRcIilcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgICAgICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgc2V0VGV4dDogKHRleHQ9XCJcIikgLT5cblxuICAgICAgICBpZiBAc3ludGF4Lm5hbWUgPT0gJ3R4dCdcbiAgICAgICAgICAgIEBzeW50YXgubmFtZSA9IFN5bnRheC5zaGViYW5nIHRleHQuc2xpY2UgMCwgdGV4dC5zZWFyY2ggL1xccj9cXG4vXG5cbiAgICAgICAgbGluZXMgPSB0ZXh0LnNwbGl0IC9cXG4vXG5cbiAgICAgICAgQG5ld2xpbmVDaGFyYWN0ZXJzID0gJ1xcbidcbiAgICAgICAgaWYgdmFsaWQgbGluZXNcbiAgICAgICAgICAgIGlmIGxpbmVzWzBdLmVuZHNXaXRoICdcXHInXG4gICAgICAgICAgICAgICAgbGluZXMgPSB0ZXh0LnNwbGl0IC9cXHI/XFxuL1xuICAgICAgICAgICAgICAgIEBuZXdsaW5lQ2hhcmFjdGVycyA9ICdcXHJcXG4nXG5cbiAgICAgICAgQHNldExpbmVzIGxpbmVzXG5cbiAgICBzZXRMaW5lczogKGxpbmVzKSAtPlxuXG4gICAgICAgIEBzeW50YXguc2V0TGluZXMgbGluZXNcbiAgICAgICAgc3VwZXIgbGluZXNcbiAgICAgICAgQGVtaXQgJ2xpbmVzU2V0JyBsaW5lc1xuXG4gICAgdGV4dE9mU2VsZWN0aW9uRm9yQ2xpcGJvYXJkOiAtPlxuXG4gICAgICAgIGlmIEBudW1TZWxlY3Rpb25zKClcbiAgICAgICAgICAgIEB0ZXh0T2ZTZWxlY3Rpb24oKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdGV4dEluUmFuZ2VzIEByYW5nZXNGb3JDdXJzb3JMaW5lcygpXG5cbiAgICBzcGxpdFN0YXRlTGluZUF0UG9zOiAoc3RhdGUsIHBvcykgLT5cblxuICAgICAgICBsID0gc3RhdGUubGluZSBwb3NbMV1cbiAgICAgICAga2Vycm9yIFwibm8gbGluZSBhdCBwb3MgI3twb3N9P1wiIGlmIG5vdCBsP1xuICAgICAgICByZXR1cm4gWycnICcnXSBpZiBub3QgbD9cbiAgICAgICAgW2wuc2xpY2UoMCwgcG9zWzBdKSwgbC5zbGljZShwb3NbMF0pXVxuXG4gICAgIyAwMDAwMDAwMCAgMDAgICAgIDAwICAwMDAgIDAwMDAwMDAwMCAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDBcblxuICAgIGVtaXRFZGl0OiAoYWN0aW9uKSAtPlxuXG4gICAgICAgIG1jID0gQG1haW5DdXJzb3IoKVxuICAgICAgICBsaW5lID0gQGxpbmUgbWNbMV1cblxuICAgICAgICBAZW1pdCAnZWRpdCcsXG4gICAgICAgICAgICBhY3Rpb246IGFjdGlvblxuICAgICAgICAgICAgbGluZTogICBsaW5lXG4gICAgICAgICAgICBiZWZvcmU6IGxpbmUuc2xpY2UgMCwgbWNbMF1cbiAgICAgICAgICAgIGFmdGVyOiAgbGluZS5zbGljZSBtY1swXVxuICAgICAgICAgICAgY3Vyc29yOiBtY1xuXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDBcblxuICAgIGluZGVudFN0cmluZ0ZvckxpbmVBdEluZGV4OiAobGkpIC0+XG5cbiAgICAgICAgd2hpbGUgZW1wdHkoQGxpbmUobGkpLnRyaW0oKSkgYW5kIGxpID4gMFxuICAgICAgICAgICAgbGktLVxuXG4gICAgICAgIGlmIDAgPD0gbGkgPCBAbnVtTGluZXMoKVxuXG4gICAgICAgICAgICBpbCA9IDBcbiAgICAgICAgICAgIGxpbmUgPSBAbGluZSBsaVxuICAgICAgICAgICAgdGhpc0luZGVudCAgID0gQGluZGVudGF0aW9uQXRMaW5lSW5kZXggbGlcbiAgICAgICAgICAgIGluZGVudExlbmd0aCA9IEBpbmRlbnRTdHJpbmcubGVuZ3RoXG5cbiAgICAgICAgICAgIGlmIEBpbmRlbnROZXdMaW5lTW9yZT9cbiAgICAgICAgICAgICAgICBpZiBAaW5kZW50TmV3TGluZU1vcmUubGluZUVuZHNXaXRoPy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgZm9yIGUgaW4gQGluZGVudE5ld0xpbmVNb3JlLmxpbmVFbmRzV2l0aFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbGluZS50cmltKCkuZW5kc1dpdGggZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlsID0gdGhpc0luZGVudCArIGluZGVudExlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgaWYgaWwgPT0gMFxuICAgICAgICAgICAgICAgICAgICBpZiBAaW5kZW50TmV3TGluZU1vcmUubGluZVJlZ0V4cD8gYW5kIEBpbmRlbnROZXdMaW5lTW9yZS5saW5lUmVnRXhwLnRlc3QgbGluZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWwgPSB0aGlzSW5kZW50ICsgaW5kZW50TGVuZ3RoXG5cbiAgICAgICAgICAgIGlsID0gdGhpc0luZGVudCBpZiBpbCA9PSAwXG4gICAgICAgICAgICBpbCA9IE1hdGgubWF4IGlsLCBAaW5kZW50YXRpb25BdExpbmVJbmRleCBsaSsxXG5cbiAgICAgICAgICAgIF8ucGFkU3RhcnQgXCJcIiwgaWxcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgJydcblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3JcbiJdfQ==
//# sourceURL=../../coffee/editor/editor.coffee