// koffee 1.12.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9lZGl0b3IiLCJzb3VyY2VzIjpbImVkaXRvci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEseUVBQUE7SUFBQTs7O0FBUUEsTUFBK0MsT0FBQSxDQUFRLEtBQVIsQ0FBL0MsRUFBRSxTQUFGLEVBQUssaUJBQUwsRUFBWSx1QkFBWixFQUFzQixtQkFBdEIsRUFBOEIsaUJBQTlCLEVBQXFDOztBQUVyQyxNQUFBLEdBQVUsT0FBQSxDQUFRLFVBQVI7O0FBQ1YsTUFBQSxHQUFVLE9BQUEsQ0FBUSxVQUFSOztBQUNWLEVBQUEsR0FBVSxPQUFBLENBQVEsTUFBUjs7QUFFSjs7O0lBRUYsTUFBQyxDQUFBLE9BQUQsR0FBVzs7SUFFUixnQkFBQyxJQUFELEVBQU8sTUFBUDtBQUVDLFlBQUE7UUFBQSxzQ0FBQTtRQUVBLElBQUMsQ0FBQSxJQUFELEdBQVU7UUFDVixJQUFDLENBQUEsTUFBRCxvQkFBVSxTQUFTOztnQkFDWixDQUFDOztnQkFBRCxDQUFDLGFBQWM7O1FBRXRCLElBQTRCLHNCQUE1QjtZQUFBLE1BQU0sQ0FBQyxXQUFQLENBQUEsRUFBQTs7UUFFQSxJQUFDLENBQUEsWUFBRCxHQUFtQixDQUFDLENBQUMsUUFBRixDQUFXLEVBQVgsRUFBZSxDQUFmO1FBQ25CLElBQUMsQ0FBQSxlQUFELEdBQW1CO1FBQ25CLElBQUMsQ0FBQSxNQUFELEdBQW1CLElBQUksTUFBSixDQUFXLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBbkIsRUFBK0IsSUFBQyxDQUFBLElBQWhDLEVBQXNDLElBQUMsQ0FBQSxLQUF2QztRQUNuQixJQUFDLEVBQUEsRUFBQSxFQUFELEdBQW1CLElBQUksRUFBSixDQUFPLElBQVA7UUFFbkIsSUFBQyxDQUFBLGFBQUQsQ0FBQTtJQWZEOztxQkFpQkgsR0FBQSxHQUFLLFNBQUE7ZUFFRCxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsR0FB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QUNsQixrQ0FGSjs7QUFESixxQkFESjs7Z0JBS0EsSUFBRyxFQUFBLEtBQU0sQ0FBVDtvQkFDSSxJQUFHLDJDQUFBLElBQW1DLElBQUMsQ0FBQSxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsSUFBOUIsQ0FBbUMsSUFBbkMsQ0FBdEM7d0JBQ0ksRUFBQSxHQUFLLFVBQUEsR0FBYSxhQUR0QjtxQkFESjtpQkFOSjs7WUFVQSxJQUFtQixFQUFBLEtBQU0sQ0FBekI7Z0JBQUEsRUFBQSxHQUFLLFdBQUw7O1lBQ0EsRUFBQSxHQUFLLElBQUksQ0FBQyxHQUFMLENBQVMsRUFBVCxFQUFhLElBQUMsQ0FBQSxzQkFBRCxDQUF3QixFQUFBLEdBQUcsQ0FBM0IsQ0FBYjttQkFFTCxDQUFDLENBQUMsUUFBRixDQUFXLEVBQVgsRUFBZSxFQUFmLEVBcEJKO1NBQUEsTUFBQTttQkFzQkksR0F0Qko7O0lBTHdCOzs7O0dBM01YOztBQXdPckIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4jIyNcblxueyBfLCBlbXB0eSwgZmlsZWxpc3QsIGtlcnJvciwgc2xhc2gsIHZhbGlkIH0gPSByZXF1aXJlICdreGsnXG5cbkJ1ZmZlciAgPSByZXF1aXJlICcuL2J1ZmZlcidcblN5bnRheCAgPSByZXF1aXJlICcuL3N5bnRheCdcbkRvICAgICAgPSByZXF1aXJlICcuL2RvJ1xuXG5jbGFzcyBFZGl0b3IgZXh0ZW5kcyBCdWZmZXJcblxuICAgIEBhY3Rpb25zID0gbnVsbFxuXG4gICAgQDogKG5hbWUsIGNvbmZpZykgLT5cblxuICAgICAgICBzdXBlcigpXG5cbiAgICAgICAgQG5hbWUgICA9IG5hbWVcbiAgICAgICAgQGNvbmZpZyA9IGNvbmZpZyA/IHt9XG4gICAgICAgIEBjb25maWcuc3ludGF4TmFtZSA/PSAndHh0J1xuXG4gICAgICAgIEVkaXRvci5pbml0QWN0aW9ucygpIGlmIG5vdCBFZGl0b3IuYWN0aW9ucz9cblxuICAgICAgICBAaW5kZW50U3RyaW5nICAgID0gXy5wYWRTdGFydCBcIlwiLCA0XG4gICAgICAgIEBzdGlja3lTZWxlY3Rpb24gPSBmYWxzZVxuICAgICAgICBAc3ludGF4ICAgICAgICAgID0gbmV3IFN5bnRheCBAY29uZmlnLnN5bnRheE5hbWUsIEBsaW5lLCBAbGluZXNcbiAgICAgICAgQGRvICAgICAgICAgICAgICA9IG5ldyBEbyBAXG5cbiAgICAgICAgQHNldHVwRmlsZVR5cGUoKVxuXG4gICAgZGVsOiAtPlxuXG4gICAgICAgIEBkby5kZWwoKVxuXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIEBpbml0QWN0aW9uczogLT5cblxuICAgICAgICBAYWN0aW9ucyA9IFtdXG4gICAgICAgIGZvciBhY3Rpb25GaWxlIGluIGZpbGVsaXN0KHNsYXNoLmpvaW4gX19kaXJuYW1lLCAnYWN0aW9ucycpXG4gICAgICAgICAgICBjb250aW51ZSBpZiBzbGFzaC5leHQoYWN0aW9uRmlsZSkgbm90IGluIFsnanMnICdjb2ZmZWUnXVxuICAgICAgICAgICAgYWN0aW9ucyA9IHJlcXVpcmUgYWN0aW9uRmlsZVxuICAgICAgICAgICAgZm9yIGtleSx2YWx1ZSBvZiBhY3Rpb25zXG4gICAgICAgICAgICAgICAgaWYgXy5pc0Z1bmN0aW9uIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIEBwcm90b3R5cGVba2V5XSA9IHZhbHVlXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBrZXkgPT0gJ2FjdGlvbnMnXG4gICAgICAgICAgICAgICAgICAgIGZvciBrLHYgb2YgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG5vdCBfLmlzU3RyaW5nIHZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2LmtleSA9IGsgaWYgbm90IHYua2V5P1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBhY3Rpb25zLnB1c2ggdlxuXG4gICAgICAgICMgdG9vIGVhcmx5IGZvciBsb2cgaGVyZSFcbiAgICAgICAgIyBjb25zb2xlLmxvZyBzdHIgQGFjdGlvbnNcblxuICAgIEBhY3Rpb25XaXRoTmFtZTogKG5hbWUpIC0+XG5cbiAgICAgICAgZm9yIGFjdGlvbiBpbiBFZGl0b3IuYWN0aW9uc1xuICAgICAgICAgICAgaWYgYWN0aW9uLm5hbWUgPT0gbmFtZVxuICAgICAgICAgICAgICAgIHJldHVybiBhY3Rpb25cbiAgICAgICAgbnVsbFxuXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAgICAwMDAgICAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMDAwMDAwXG5cbiAgICBzaGViYW5nRmlsZVR5cGU6IC0+IEBjb25maWc/LnN5bnRheE5hbWUgPyAndHh0J1xuXG4gICAgc2V0dXBGaWxlVHlwZTogLT5cblxuICAgICAgICBvbGRUeXBlID0gQGZpbGVUeXBlXG4gICAgICAgIG5ld1R5cGUgPSBAc2hlYmFuZ0ZpbGVUeXBlKClcblxuICAgICAgICBAc3ludGF4Py5uYW1lID0gbmV3VHlwZVxuICAgICAgICBAc2V0RmlsZVR5cGUgbmV3VHlwZVxuXG4gICAgICAgIGlmIG9sZFR5cGUgIT0gQGZpbGVUeXBlXG4gICAgICAgICAgICBAZW1pdCAnZmlsZVR5cGVDaGFuZ2VkJywgQGZpbGVUeXBlXG5cbiAgICBzZXRGaWxlVHlwZTogKEBmaWxlVHlwZSkgLT5cblxuICAgICAgICAjIF9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fXyBzdHJpbmdzXG5cbiAgICAgICAgQHN0cmluZ0NoYXJhY3RlcnMgPVxuICAgICAgICAgICAgXCInXCI6ICAnc2luZ2xlJ1xuICAgICAgICAgICAgJ1wiJzogICdkb3VibGUnXG5cbiAgICAgICAgc3dpdGNoIEBmaWxlVHlwZVxuICAgICAgICAgICAgd2hlbiAnbWQnICAgdGhlbiBAc3RyaW5nQ2hhcmFjdGVyc1snKiddID0gJ2JvbGQnXG4gICAgICAgICAgICB3aGVuICdub29uJyB0aGVuIEBzdHJpbmdDaGFyYWN0ZXJzWyd8J10gPSAncGlwZSdcblxuICAgICAgICAjIF9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fXyBicmFja2V0c1xuXG4gICAgICAgIEBicmFja2V0Q2hhcmFjdGVycyA9XG4gICAgICAgICAgICBvcGVuOlxuICAgICAgICAgICAgICAgICdbJzogJ10nXG4gICAgICAgICAgICAgICAgJ3snOiAnfSdcbiAgICAgICAgICAgICAgICAnKCc6ICcpJ1xuICAgICAgICAgICAgY2xvc2U6ICAge31cbiAgICAgICAgICAgIHJlZ2V4cHM6IFtdXG5cbiAgICAgICAgc3dpdGNoIEBmaWxlVHlwZVxuICAgICAgICAgICAgd2hlbiAnaHRtbCcgdGhlbiBAYnJhY2tldENoYXJhY3RlcnMub3BlblsnPCddID0gJz4nXG5cbiAgICAgICAgZm9yIGssdiBvZiBAYnJhY2tldENoYXJhY3RlcnMub3BlblxuICAgICAgICAgICAgQGJyYWNrZXRDaGFyYWN0ZXJzLmNsb3NlW3ZdID0ga1xuXG4gICAgICAgIEBicmFja2V0Q2hhcmFjdGVycy5yZWdleHAgPSBbXVxuICAgICAgICBmb3Iga2V5IGluIFsnb3BlbicgJ2Nsb3NlJ11cbiAgICAgICAgICAgIGNzdHIgPSBfLmtleXMoQGJyYWNrZXRDaGFyYWN0ZXJzW2tleV0pLmpvaW4gJydcbiAgICAgICAgICAgIHJlZyA9IG5ldyBSZWdFeHAgXCJbI3tfLmVzY2FwZVJlZ0V4cCBjc3RyfV1cIlxuICAgICAgICAgICAgQGJyYWNrZXRDaGFyYWN0ZXJzLnJlZ2V4cHMucHVzaCBbcmVnLCBrZXldXG5cbiAgICAgICAgQGluaXRTdXJyb3VuZCgpXG5cbiAgICAgICAgIyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gaW5kZW50XG5cbiAgICAgICAgQGluZGVudE5ld0xpbmVNb3JlID0gbnVsbFxuICAgICAgICBAaW5kZW50TmV3TGluZUxlc3MgPSBudWxsXG4gICAgICAgIEBpbnNlcnRJbmRlbnRlZEVtcHR5TGluZUJldHdlZW4gPSAne30nXG5cbiAgICAgICAgc3dpdGNoIEBmaWxlVHlwZVxuICAgICAgICAgICAgd2hlbiAnY29mZmVlJywgJ2tvZmZlZSdcbiAgICAgICAgICAgICAgICBAaW5kZW50TmV3TGluZU1vcmUgPVxuICAgICAgICAgICAgICAgICAgICBsaW5lRW5kc1dpdGg6IFsnLT4nLCAnPT4nLCAnOicsICc9J11cbiAgICAgICAgICAgICAgICAgICAgbGluZVJlZ0V4cDogICAvXihcXHMrd2hlbnxcXHMqaWZ8XFxzKmVsc2VcXHMraWZcXHMrKSg/IS4qXFxzdGhlblxccyl8KF58XFxzKShlbHNlXFxzKiR8c3dpdGNoXFxzfGZvclxcc3x3aGlsZVxcc3xjbGFzc1xccykvXG5cbiAgICAgICAgIyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gY29tbWVudFxuICAgICAgICBcbiAgICAgICAgQG11bHRpQ29tbWVudCA9IHN3aXRjaCBAZmlsZVR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2NvZmZlZScgJ2tvZmZlZScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gb3BlbjonIyMjJyAgY2xvc2U6JyMjIydcbiAgICAgICAgICAgIHdoZW4gJ2h0bWwnICdtZCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gb3BlbjonPCEtLScgY2xvc2U6Jy0tPidcbiAgICAgICAgICAgIHdoZW4gJ3N0eWwnICdjcHAnICdjJyAnaCcgJ2hwcCcgJ2N4eCcgJ2NzJyAnanMnICdzY3NzJyAndHMnICdzd2lmdCcgJ2ZyYWcnICd2ZXJ0JyB0aGVuIG9wZW46Jy8qJyAgIGNsb3NlOicqLydcbiAgICAgICAgXG4gICAgICAgIEBsaW5lQ29tbWVudCA9IHN3aXRjaCBAZmlsZVR5cGVcbiAgICAgICAgICAgICB3aGVuICdjb2ZmZWUnICdrb2ZmZWUnICdzaCcgJ2JhdCcgJ25vb24nICdrbycgJ3R4dCcgJ2Zpc2gnICAgICAgICAgICAgICB0aGVuICcjJ1xuICAgICAgICAgICAgIHdoZW4gJ3N0eWwnICdjcHAnICdjJyAnaCcgJ2hwcCcgJ2N4eCcgJ2NzJyAnanMnICdzY3NzJyAndHMnICdzd2lmdCcgJ2ZyYWcnICd2ZXJ0JyB0aGVuICcvLydcbiAgICAgICAgICAgICB3aGVuICdpc3MnICdpbmknICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuICc7J1xuICAgICAgICAgICAgIFxuICAgICAgICBpZiBAbGluZUNvbW1lbnRcbiAgICAgICAgICAgIEBoZWFkZXJSZWdFeHAgPSBuZXcgUmVnRXhwKFwiXihcXFxccyoje18uZXNjYXBlUmVnRXhwIEBsaW5lQ29tbWVudH1cXFxccyopPyhcXFxccyowWzBcXFxcc10rKSRcIilcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgICAgICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgc2V0VGV4dDogKHRleHQ9XCJcIikgLT5cblxuICAgICAgICBpZiBAc3ludGF4Lm5hbWUgPT0gJ3R4dCdcbiAgICAgICAgICAgIEBzeW50YXgubmFtZSA9IFN5bnRheC5zaGViYW5nIHRleHQuc2xpY2UgMCwgdGV4dC5zZWFyY2ggL1xccj9cXG4vXG5cbiAgICAgICAgbGluZXMgPSB0ZXh0LnNwbGl0IC9cXG4vXG5cbiAgICAgICAgQG5ld2xpbmVDaGFyYWN0ZXJzID0gJ1xcbidcbiAgICAgICAgaWYgdmFsaWQgbGluZXNcbiAgICAgICAgICAgIGlmIGxpbmVzWzBdLmVuZHNXaXRoICdcXHInXG4gICAgICAgICAgICAgICAgbGluZXMgPSB0ZXh0LnNwbGl0IC9cXHI/XFxuL1xuICAgICAgICAgICAgICAgIEBuZXdsaW5lQ2hhcmFjdGVycyA9ICdcXHJcXG4nXG5cbiAgICAgICAgQHNldExpbmVzIGxpbmVzXG5cbiAgICBzZXRMaW5lczogKGxpbmVzKSAtPlxuXG4gICAgICAgIEBzeW50YXguc2V0TGluZXMgbGluZXNcbiAgICAgICAgc3VwZXIgbGluZXNcbiAgICAgICAgQGVtaXQgJ2xpbmVzU2V0JyBsaW5lc1xuXG4gICAgdGV4dE9mU2VsZWN0aW9uRm9yQ2xpcGJvYXJkOiAtPlxuXG4gICAgICAgIGlmIEBudW1TZWxlY3Rpb25zKClcbiAgICAgICAgICAgIEB0ZXh0T2ZTZWxlY3Rpb24oKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdGV4dEluUmFuZ2VzIEByYW5nZXNGb3JDdXJzb3JMaW5lcygpXG5cbiAgICBzcGxpdFN0YXRlTGluZUF0UG9zOiAoc3RhdGUsIHBvcykgLT5cblxuICAgICAgICBsID0gc3RhdGUubGluZSBwb3NbMV1cbiAgICAgICAga2Vycm9yIFwibm8gbGluZSBhdCBwb3MgI3twb3N9P1wiIGlmIG5vdCBsP1xuICAgICAgICByZXR1cm4gWycnICcnXSBpZiBub3QgbD9cbiAgICAgICAgW2wuc2xpY2UoMCwgcG9zWzBdKSwgbC5zbGljZShwb3NbMF0pXVxuXG4gICAgIyAwMDAwMDAwMCAgMDAgICAgIDAwICAwMDAgIDAwMDAwMDAwMCAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDBcblxuICAgIGVtaXRFZGl0OiAoYWN0aW9uKSAtPlxuXG4gICAgICAgIG1jID0gQG1haW5DdXJzb3IoKVxuICAgICAgICBsaW5lID0gQGxpbmUgbWNbMV1cblxuICAgICAgICBAZW1pdCAnZWRpdCcsXG4gICAgICAgICAgICBhY3Rpb246IGFjdGlvblxuICAgICAgICAgICAgbGluZTogICBsaW5lXG4gICAgICAgICAgICBiZWZvcmU6IGxpbmUuc2xpY2UgMCwgbWNbMF1cbiAgICAgICAgICAgIGFmdGVyOiAgbGluZS5zbGljZSBtY1swXVxuICAgICAgICAgICAgY3Vyc29yOiBtY1xuXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDBcblxuICAgIGluZGVudFN0cmluZ0ZvckxpbmVBdEluZGV4OiAobGkpIC0+XG5cbiAgICAgICAgd2hpbGUgZW1wdHkoQGxpbmUobGkpLnRyaW0oKSkgYW5kIGxpID4gMFxuICAgICAgICAgICAgbGktLVxuXG4gICAgICAgIGlmIDAgPD0gbGkgPCBAbnVtTGluZXMoKVxuXG4gICAgICAgICAgICBpbCA9IDBcbiAgICAgICAgICAgIGxpbmUgPSBAbGluZSBsaVxuICAgICAgICAgICAgdGhpc0luZGVudCAgID0gQGluZGVudGF0aW9uQXRMaW5lSW5kZXggbGlcbiAgICAgICAgICAgIGluZGVudExlbmd0aCA9IEBpbmRlbnRTdHJpbmcubGVuZ3RoXG5cbiAgICAgICAgICAgIGlmIEBpbmRlbnROZXdMaW5lTW9yZT9cbiAgICAgICAgICAgICAgICBpZiBAaW5kZW50TmV3TGluZU1vcmUubGluZUVuZHNXaXRoPy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgZm9yIGUgaW4gQGluZGVudE5ld0xpbmVNb3JlLmxpbmVFbmRzV2l0aFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbGluZS50cmltKCkuZW5kc1dpdGggZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlsID0gdGhpc0luZGVudCArIGluZGVudExlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgaWYgaWwgPT0gMFxuICAgICAgICAgICAgICAgICAgICBpZiBAaW5kZW50TmV3TGluZU1vcmUubGluZVJlZ0V4cD8gYW5kIEBpbmRlbnROZXdMaW5lTW9yZS5saW5lUmVnRXhwLnRlc3QgbGluZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWwgPSB0aGlzSW5kZW50ICsgaW5kZW50TGVuZ3RoXG5cbiAgICAgICAgICAgIGlsID0gdGhpc0luZGVudCBpZiBpbCA9PSAwXG4gICAgICAgICAgICBpbCA9IE1hdGgubWF4IGlsLCBAaW5kZW50YXRpb25BdExpbmVJbmRleCBsaSsxXG5cbiAgICAgICAgICAgIF8ucGFkU3RhcnQgXCJcIiwgaWxcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgJydcblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3JcbiJdfQ==
//# sourceURL=../../coffee/editor/editor.coffee