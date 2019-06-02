// koffee 0.56.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx5RUFBQTtJQUFBOzs7QUFRQSxNQUErQyxPQUFBLENBQVEsS0FBUixDQUEvQyxFQUFFLGlCQUFGLEVBQVMsaUJBQVQsRUFBZ0IsaUJBQWhCLEVBQXVCLG1CQUF2QixFQUErQix1QkFBL0IsRUFBeUM7O0FBRXpDLE1BQUEsR0FBVSxPQUFBLENBQVEsVUFBUjs7QUFDVixNQUFBLEdBQVUsT0FBQSxDQUFRLFVBQVI7O0FBQ1YsRUFBQSxHQUFVLE9BQUEsQ0FBUSxNQUFSOztBQUVKOzs7SUFFRixNQUFDLENBQUEsT0FBRCxHQUFXOztJQUVFLGdCQUFDLElBQUQsRUFBTyxNQUFQO0FBRVQsWUFBQTtRQUFBLHNDQUFBO1FBRUEsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxNQUFELG9CQUFVLFNBQVM7O2dCQUNaLENBQUM7O2dCQUFELENBQUMsYUFBYzs7UUFFdEIsSUFBNEIsc0JBQTVCO1lBQUEsTUFBTSxDQUFDLFdBQVAsQ0FBQSxFQUFBOztRQUVBLElBQUMsQ0FBQSxZQUFELEdBQXFCLENBQUMsQ0FBQyxRQUFGLENBQVcsRUFBWCxFQUFlLENBQWY7UUFDckIsSUFBQyxDQUFBLGVBQUQsR0FBcUI7UUFDckIsSUFBQyxDQUFBLE1BQUQsR0FBcUIsSUFBSSxNQUFKLENBQVcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFuQixFQUErQixJQUFDLENBQUEsSUFBaEMsRUFBc0MsSUFBQyxDQUFBLEtBQXZDO1FBQ3JCLElBQUMsRUFBQSxFQUFBLEVBQUQsR0FBcUIsSUFBSSxFQUFKLENBQU8sSUFBUDtRQUVyQixJQUFDLENBQUEsYUFBRCxDQUFBO0lBZlM7O3FCQWlCYixHQUFBLEdBQUssU0FBQTtlQUVELElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7SUFGQzs7SUFVTCxNQUFDLENBQUEs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VUFBVSxDQUFDLElBQTlCLENBQW1DLElBQW5DLENBQXRDO3dCQUNJLEVBQUEsR0FBSyxVQUFBLEdBQWEsYUFEdEI7cUJBREo7aUJBTko7O1lBVUEsSUFBbUIsRUFBQSxLQUFNLENBQXpCO2dCQUFBLEVBQUEsR0FBSyxXQUFMOztZQUNBLEVBQUEsR0FBSyxJQUFJLENBQUMsR0FBTCxDQUFTLEVBQVQsRUFBYSxJQUFDLENBQUEsc0JBQUQsQ0FBd0IsRUFBQSxHQUFHLENBQTNCLENBQWI7bUJBRUwsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxFQUFYLEVBQWUsRUFBZixFQXBCSjtTQUFBLE1BQUE7bUJBc0JJLEdBdEJKOztJQUx3Qjs7OztHQXhNWDs7QUFxT3JCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgY2xhbXAsIGVtcHR5LCBzbGFzaCwga2Vycm9yLCBmaWxlbGlzdCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5CdWZmZXIgID0gcmVxdWlyZSAnLi9idWZmZXInXG5TeW50YXggID0gcmVxdWlyZSAnLi9zeW50YXgnXG5EbyAgICAgID0gcmVxdWlyZSAnLi9kbydcblxuY2xhc3MgRWRpdG9yIGV4dGVuZHMgQnVmZmVyXG5cbiAgICBAYWN0aW9ucyA9IG51bGxcblxuICAgIGNvbnN0cnVjdG9yOiAobmFtZSwgY29uZmlnKSAtPlxuXG4gICAgICAgIHN1cGVyKClcblxuICAgICAgICBAbmFtZSAgID0gbmFtZVxuICAgICAgICBAY29uZmlnID0gY29uZmlnID8ge31cbiAgICAgICAgQGNvbmZpZy5zeW50YXhOYW1lID89ICd0eHQnXG5cbiAgICAgICAgRWRpdG9yLmluaXRBY3Rpb25zKCkgaWYgbm90IEVkaXRvci5hY3Rpb25zP1xuXG4gICAgICAgIEBpbmRlbnRTdHJpbmcgICAgICA9IF8ucGFkU3RhcnQgXCJcIiwgNFxuICAgICAgICBAc3RpY2t5U2VsZWN0aW9uICAgPSBmYWxzZVxuICAgICAgICBAc3ludGF4ICAgICAgICAgICAgPSBuZXcgU3ludGF4IEBjb25maWcuc3ludGF4TmFtZSwgQGxpbmUsIEBsaW5lc1xuICAgICAgICBAZG8gICAgICAgICAgICAgICAgPSBuZXcgRG8gQFxuXG4gICAgICAgIEBzZXR1cEZpbGVUeXBlKClcblxuICAgIGRlbDogLT5cblxuICAgICAgICBAZG8uZGVsKClcblxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBAaW5pdEFjdGlvbnM6IC0+XG5cbiAgICAgICAgQGFjdGlvbnMgPSBbXVxuICAgICAgICBmb3IgYWN0aW9uRmlsZSBpbiBmaWxlbGlzdCBzbGFzaC5qb2luIF9fZGlybmFtZSwgJ2FjdGlvbnMnXG4gICAgICAgICAgICBjb250aW51ZSBpZiBzbGFzaC5leHQoYWN0aW9uRmlsZSkgbm90IGluIFsnanMnLCAnY29mZmVlJ11cbiAgICAgICAgICAgIGFjdGlvbnMgPSByZXF1aXJlIGFjdGlvbkZpbGVcbiAgICAgICAgICAgIGZvciBrZXksdmFsdWUgb2YgYWN0aW9uc1xuICAgICAgICAgICAgICAgIGlmIF8uaXNGdW5jdGlvbiB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICBAcHJvdG90eXBlW2tleV0gPSB2YWx1ZVxuICAgICAgICAgICAgICAgIGVsc2UgaWYga2V5ID09ICdhY3Rpb25zJ1xuICAgICAgICAgICAgICAgICAgICBmb3Igayx2IG9mIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBub3QgXy5pc1N0cmluZyB2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdi5rZXkgPSBrIGlmIG5vdCB2LmtleT9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAYWN0aW9ucy5wdXNoIHZcblxuICAgICAgICAjIHRvbyBlYXJseSBmb3IgbG9nIGhlcmUhXG4gICAgICAgICMgY29uc29sZS5sb2cgc3RyIEBhY3Rpb25zXG5cbiAgICBAYWN0aW9uV2l0aE5hbWU6IChuYW1lKSAtPlxuXG4gICAgICAgIGZvciBhY3Rpb24gaW4gRWRpdG9yLmFjdGlvbnNcbiAgICAgICAgICAgIGlmIGFjdGlvbi5uYW1lID09IG5hbWVcbiAgICAgICAgICAgICAgICByZXR1cm4gYWN0aW9uXG5cbiAgICAgICAgIyBsb2cgXCJjYW4ndCBmaW5kIGFjdGlvbiB3aXRoIG5hbWUgJyN7bmFtZX0nXCJcbiAgICAgICAgIyBmb3IgYWN0aW9uIGluIEVkaXRvci5hY3Rpb25zXG4gICAgICAgICAgICAjIGxvZyBhY3Rpb24ubmFtZVxuICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAgICAwMDAgICAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMDAwMDAwXG5cbiAgICBzaGViYW5nRmlsZVR5cGU6IC0+IEBjb25maWc/LnN5bnRheE5hbWUgPyAndHh0J1xuXG4gICAgc2V0dXBGaWxlVHlwZTogLT5cblxuICAgICAgICBvbGRUeXBlID0gQGZpbGVUeXBlXG4gICAgICAgIG5ld1R5cGUgPSBAc2hlYmFuZ0ZpbGVUeXBlKClcblxuICAgICAgICBAc3ludGF4Py5zZXRGaWxlVHlwZSBuZXdUeXBlXG4gICAgICAgIEBzZXRGaWxlVHlwZSBuZXdUeXBlXG5cbiAgICAgICAgaWYgb2xkVHlwZSAhPSBAZmlsZVR5cGVcbiAgICAgICAgICAgIEBlbWl0ICdmaWxlVHlwZUNoYW5nZWQnLCBAZmlsZVR5cGVcblxuICAgIHNldEZpbGVUeXBlOiAoQGZpbGVUeXBlKSAtPlxuXG4gICAgICAgICMgX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fIHN0cmluZ3NcblxuICAgICAgICBAc3RyaW5nQ2hhcmFjdGVycyA9XG4gICAgICAgICAgICBcIidcIjogICdzaW5nbGUnXG4gICAgICAgICAgICAnXCInOiAgJ2RvdWJsZSdcblxuICAgICAgICBzd2l0Y2ggQGZpbGVUeXBlXG4gICAgICAgICAgICB3aGVuICdtZCcgICB0aGVuIEBzdHJpbmdDaGFyYWN0ZXJzWycqJ10gPSAnYm9sZCdcbiAgICAgICAgICAgIHdoZW4gJ25vb24nIHRoZW4gQHN0cmluZ0NoYXJhY3RlcnNbJ3wnXSA9ICdwaXBlJ1xuXG4gICAgICAgICMgX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fIGJyYWNrZXRzXG5cbiAgICAgICAgQGJyYWNrZXRDaGFyYWN0ZXJzID1cbiAgICAgICAgICAgIG9wZW46XG4gICAgICAgICAgICAgICAgJ1snOiAnXSdcbiAgICAgICAgICAgICAgICAneyc6ICd9J1xuICAgICAgICAgICAgICAgICcoJzogJyknXG4gICAgICAgICAgICBjbG9zZTogICB7fVxuICAgICAgICAgICAgcmVnZXhwczogW11cblxuICAgICAgICBzd2l0Y2ggQGZpbGVUeXBlXG4gICAgICAgICAgICB3aGVuICdodG1sJyB0aGVuIEBicmFja2V0Q2hhcmFjdGVycy5vcGVuWyc8J10gPSAnPidcblxuICAgICAgICBmb3Igayx2IG9mIEBicmFja2V0Q2hhcmFjdGVycy5vcGVuXG4gICAgICAgICAgICBAYnJhY2tldENoYXJhY3RlcnMuY2xvc2Vbdl0gPSBrXG5cbiAgICAgICAgQGJyYWNrZXRDaGFyYWN0ZXJzLnJlZ2V4cCA9IFtdXG4gICAgICAgIGZvciBrZXkgaW4gWydvcGVuJywgJ2Nsb3NlJ11cbiAgICAgICAgICAgIGNzdHIgPSBfLmtleXMoQGJyYWNrZXRDaGFyYWN0ZXJzW2tleV0pLmpvaW4gJydcbiAgICAgICAgICAgIHJlZyA9IG5ldyBSZWdFeHAgXCJbI3tfLmVzY2FwZVJlZ0V4cCBjc3RyfV1cIlxuICAgICAgICAgICAgQGJyYWNrZXRDaGFyYWN0ZXJzLnJlZ2V4cHMucHVzaCBbcmVnLCBrZXldXG5cbiAgICAgICAgIyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gc3Vycm91bmRcblxuICAgICAgICBAaW5pdFN1cnJvdW5kKClcblxuICAgICAgICAjIF9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fXyBpbmRlbnRcblxuICAgICAgICBAaW5kZW50TmV3TGluZU1vcmUgPSBudWxsXG4gICAgICAgIEBpbmRlbnROZXdMaW5lTGVzcyA9IG51bGxcbiAgICAgICAgQGluc2VydEluZGVudGVkRW1wdHlMaW5lQmV0d2VlbiA9ICd7fSdcblxuICAgICAgICBzd2l0Y2ggQGZpbGVUeXBlXG4gICAgICAgICAgICB3aGVuICdjb2ZmZWUnLCAna29mZmVlJ1xuICAgICAgICAgICAgICAgIEBpbmRlbnROZXdMaW5lTW9yZSA9XG4gICAgICAgICAgICAgICAgICAgIGxpbmVFbmRzV2l0aDogWyctPicsICc9PicsICc6JywgJz0nXVxuICAgICAgICAgICAgICAgICAgICBsaW5lUmVnRXhwOiAgIC9eKFxccyt3aGVufFxccyppZnxcXHMqZWxzZVxccytpZlxccyspKD8hLipcXHN0aGVuXFxzKXwoXnxcXHMpKGVsc2VcXHMqJHxzd2l0Y2hcXHN8Zm9yXFxzfHdoaWxlXFxzfGNsYXNzXFxzKS9cblxuICAgICAgICAjIF9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fXyBjb21tZW50XG5cbiAgICAgICAgQGxpbmVDb21tZW50ID0gQHN5bnRheC5iYWxhbmNlci5yZWdpb25zLmxpbmVDb21tZW50Py5vcGVuXG4gICAgICAgIEBtdWx0aUNvbW1lbnQgPSBAc3ludGF4LmJhbGFuY2VyLnJlZ2lvbnMubXVsdGlDb21tZW50XG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAgICAgICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICAgICAgICAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIHNldFRleHQ6ICh0ZXh0PVwiXCIpIC0+XG5cbiAgICAgICAgaWYgQHN5bnRheC5uYW1lID09ICd0eHQnXG4gICAgICAgICAgICBAc3ludGF4Lm5hbWUgPSBTeW50YXguc2hlYmFuZyB0ZXh0LnNsaWNlIDAsIHRleHQuc2VhcmNoIC9cXHI/XFxuL1xuXG4gICAgICAgIGxpbmVzID0gdGV4dC5zcGxpdCAvXFxuL1xuXG4gICAgICAgIEBuZXdsaW5lQ2hhcmFjdGVycyA9ICdcXG4nXG4gICAgICAgIGlmIG5vdCBlbXB0eSBsaW5lc1xuICAgICAgICAgICAgaWYgbGluZXNbMF0uZW5kc1dpdGggJ1xccidcbiAgICAgICAgICAgICAgICBsaW5lcyA9IHRleHQuc3BsaXQgL1xccj9cXG4vXG4gICAgICAgICAgICAgICAgQG5ld2xpbmVDaGFyYWN0ZXJzID0gJ1xcclxcbidcblxuICAgICAgICBAc2V0TGluZXMgbGluZXNcblxuICAgIHNldExpbmVzOiAobGluZXMpIC0+XG5cbiAgICAgICAgQHN5bnRheC5jbGVhcigpXG4gICAgICAgIEBzeW50YXguc2V0TGluZXMgbGluZXNcbiAgICAgICAgc3VwZXIgbGluZXNcbiAgICAgICAgQGVtaXQgJ2xpbmVzU2V0JywgbGluZXNcblxuICAgIHRleHRPZlNlbGVjdGlvbkZvckNsaXBib2FyZDogLT5cblxuICAgICAgICBpZiBAbnVtU2VsZWN0aW9ucygpXG4gICAgICAgICAgICBAdGV4dE9mU2VsZWN0aW9uKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRleHRJblJhbmdlcyBAcmFuZ2VzRm9yQ3Vyc29yTGluZXMoKVxuXG4gICAgc3BsaXRTdGF0ZUxpbmVBdFBvczogKHN0YXRlLCBwb3MpIC0+XG5cbiAgICAgICAgbCA9IHN0YXRlLmxpbmUgcG9zWzFdXG4gICAgICAgIGtlcnJvciBcIm5vIGxpbmUgYXQgcG9zICN7cG9zfT9cIiBpZiBub3QgbD9cbiAgICAgICAgcmV0dXJuIFsnJywnJ10gaWYgbm90IGw/XG4gICAgICAgIFtsLnNsaWNlKDAsIHBvc1swXSksIGwuc2xpY2UocG9zWzBdKV1cblxuICAgICMgMDAwMDAwMDAgIDAwICAgICAwMCAgMDAwICAwMDAwMDAwMDAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwXG5cbiAgICBlbWl0RWRpdDogKGFjdGlvbikgLT5cblxuICAgICAgICBtYyA9IEBtYWluQ3Vyc29yKClcbiAgICAgICAgbGluZSA9IEBsaW5lIG1jWzFdXG5cbiAgICAgICAgQGVtaXQgJ2VkaXQnLFxuICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb25cbiAgICAgICAgICAgIGxpbmU6ICAgbGluZVxuICAgICAgICAgICAgYmVmb3JlOiBsaW5lLnNsaWNlIDAsIG1jWzBdXG4gICAgICAgICAgICBhZnRlcjogIGxpbmUuc2xpY2UgbWNbMF1cbiAgICAgICAgICAgIGN1cnNvcjogbWNcblxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwXG5cbiAgICBpbmRlbnRTdHJpbmdGb3JMaW5lQXRJbmRleDogKGxpKSAtPlxuXG4gICAgICAgIHdoaWxlIGVtcHR5KEBsaW5lKGxpKS50cmltKCkpIGFuZCBsaSA+IDBcbiAgICAgICAgICAgIGxpLS1cblxuICAgICAgICBpZiAwIDw9IGxpIDwgQG51bUxpbmVzKClcblxuICAgICAgICAgICAgaWwgPSAwXG4gICAgICAgICAgICBsaW5lID0gQGxpbmUgbGlcbiAgICAgICAgICAgIHRoaXNJbmRlbnQgICA9IEBpbmRlbnRhdGlvbkF0TGluZUluZGV4IGxpXG4gICAgICAgICAgICBpbmRlbnRMZW5ndGggPSBAaW5kZW50U3RyaW5nLmxlbmd0aFxuXG4gICAgICAgICAgICBpZiBAaW5kZW50TmV3TGluZU1vcmU/XG4gICAgICAgICAgICAgICAgaWYgQGluZGVudE5ld0xpbmVNb3JlLmxpbmVFbmRzV2l0aD8ubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIGZvciBlIGluIEBpbmRlbnROZXdMaW5lTW9yZS5saW5lRW5kc1dpdGhcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGxpbmUudHJpbSgpLmVuZHNXaXRoIGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbCA9IHRoaXNJbmRlbnQgKyBpbmRlbnRMZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIGlmIGlsID09IDBcbiAgICAgICAgICAgICAgICAgICAgaWYgQGluZGVudE5ld0xpbmVNb3JlLmxpbmVSZWdFeHA/IGFuZCBAaW5kZW50TmV3TGluZU1vcmUubGluZVJlZ0V4cC50ZXN0IGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlsID0gdGhpc0luZGVudCArIGluZGVudExlbmd0aFxuXG4gICAgICAgICAgICBpbCA9IHRoaXNJbmRlbnQgaWYgaWwgPT0gMFxuICAgICAgICAgICAgaWwgPSBNYXRoLm1heCBpbCwgQGluZGVudGF0aW9uQXRMaW5lSW5kZXggbGkrMVxuXG4gICAgICAgICAgICBfLnBhZFN0YXJ0IFwiXCIsIGlsXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgICcnXG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yXG4iXX0=
//# sourceURL=../../coffee/editor/editor.coffee