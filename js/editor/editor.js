// koffee 1.18.0

/*
00000000  0000000    000  000000000   0000000   00000000
000       000   000  000     000     000   000  000   000
0000000   000   000  000     000     000   000  0000000
000       000   000  000     000     000   000  000   000
00000000  0000000    000     000      0000000   000   000
 */
var Buffer, Do, Editor, Syntax, _, empty, filelist, kerror, ref, slash, valid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = Object.hasOwn;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9lZGl0b3IiLCJzb3VyY2VzIjpbImVkaXRvci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEseUVBQUE7SUFBQTs7O0FBUUEsTUFBK0MsT0FBQSxDQUFRLEtBQVIsQ0FBL0MsRUFBRSxTQUFGLEVBQUssaUJBQUwsRUFBWSx1QkFBWixFQUFzQixtQkFBdEIsRUFBOEIsaUJBQTlCLEVBQXFDOztBQUVyQyxNQUFBLEdBQVUsT0FBQSxDQUFRLFVBQVI7O0FBQ1YsTUFBQSxHQUFVLE9BQUEsQ0FBUSxVQUFSOztBQUNWLEVBQUEsR0FBVSxPQUFBLENBQVEsTUFBUjs7QUFFSjs7O0lBRUYsTUFBQyxDQUFBLE9BQUQsR0FBVzs7SUFFUixnQkFBQyxJQUFELEVBQU8sTUFBUDtBQUVDLFlBQUE7UUFBQSxzQ0FBQTtRQUVBLElBQUMsQ0FBQSxJQUFELEdBQVU7UUFDVixJQUFDLENBQUEsTUFBRCxvQkFBVSxTQUFTOztnQkFDWixDQUFDOztnQkFBRCxDQUFDLGFBQWM7O1FBRXRCLElBQTRCLHNCQUE1QjtZQUFBLE1BQU0sQ0FBQyxXQUFQLENBQUEsRUFBQTs7UUFFQSxJQUFDLENBQUEsWUFBRCxHQUFtQixDQUFDLENBQUMsUUFBRixDQUFXLEVBQVgsRUFBZSxDQUFmO1FBQ25CLElBQUMsQ0FBQSxlQUFELEdBQW1CO1FBQ25CLElBQUMsQ0FBQSxNQUFELEdBQW1CLElBQUksTUFBSixDQUFXLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBbkIsRUFBK0IsSUFBQyxDQUFBLElBQWhDLEVBQXNDLElBQUMsQ0FBQSxLQUF2QztRQUNuQixJQUFDLEVBQUEsRUFBQSxFQUFELEdBQW1CLElBQUksRUFBSixDQUFPLElBQVA7UUFFbkIsSUFBQyxDQUFBLGFBQUQsQ0FBQTtJQWZEOztxQkFpQkgsR0FBQSxHQUFLLFNBQUE7ZUFFRCxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsR0FB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QUFDbEIsa0NBRko7O0FBREoscUJBREo7O2dCQUtBLElBQUcsRUFBQSxLQUFNLENBQVQ7b0JBQ0ksSUFBRywyQ0FBQSxJQUFtQyxJQUFDLENBQUEsaUJBQWlCLENBQUMsVUFBVSxDQUFDLElBQTlCLENBQW1DLElBQW5DLENBQXRDO3dCQUNJLEVBQUEsR0FBSyxVQUFBLEdBQWEsYUFEdEI7cUJBREo7aUJBTko7O1lBVUEsSUFBbUIsRUFBQSxLQUFNLENBQXpCO2dCQUFBLEVBQUEsR0FBSyxXQUFMOztZQUNBLEVBQUEsR0FBSyxJQUFJLENBQUMsR0FBTCxDQUFTLEVBQVQsRUFBYSxJQUFDLENBQUEsc0JBQUQsQ0FBd0IsRUFBQSxHQUFHLENBQTNCLENBQWI7bUJBRUwsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxFQUFYLEVBQWUsRUFBZixFQXBCSjtTQUFBLE1BQUE7bUJBc0JJLEdBdEJKOztJQUx3Qjs7OztHQTdNWDs7QUEwT3JCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgXywgZW1wdHksIGZpbGVsaXN0LCBrZXJyb3IsIHNsYXNoLCB2YWxpZCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5CdWZmZXIgID0gcmVxdWlyZSAnLi9idWZmZXInXG5TeW50YXggID0gcmVxdWlyZSAnLi9zeW50YXgnXG5EbyAgICAgID0gcmVxdWlyZSAnLi9kbydcblxuY2xhc3MgRWRpdG9yIGV4dGVuZHMgQnVmZmVyXG5cbiAgICBAYWN0aW9ucyA9IG51bGxcblxuICAgIEA6IChuYW1lLCBjb25maWcpIC0+XG5cbiAgICAgICAgc3VwZXIoKVxuXG4gICAgICAgIEBuYW1lICAgPSBuYW1lXG4gICAgICAgIEBjb25maWcgPSBjb25maWcgPyB7fVxuICAgICAgICBAY29uZmlnLnN5bnRheE5hbWUgPz0gJ3R4dCdcblxuICAgICAgICBFZGl0b3IuaW5pdEFjdGlvbnMoKSBpZiBub3QgRWRpdG9yLmFjdGlvbnM/XG5cbiAgICAgICAgQGluZGVudFN0cmluZyAgICA9IF8ucGFkU3RhcnQgXCJcIiwgNFxuICAgICAgICBAc3RpY2t5U2VsZWN0aW9uID0gZmFsc2VcbiAgICAgICAgQHN5bnRheCAgICAgICAgICA9IG5ldyBTeW50YXggQGNvbmZpZy5zeW50YXhOYW1lLCBAbGluZSwgQGxpbmVzXG4gICAgICAgIEBkbyAgICAgICAgICAgICAgPSBuZXcgRG8gQFxuXG4gICAgICAgIEBzZXR1cEZpbGVUeXBlKClcblxuICAgIGRlbDogLT5cblxuICAgICAgICBAZG8uZGVsKClcblxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBAaW5pdEFjdGlvbnM6IC0+XG5cbiAgICAgICAgQGFjdGlvbnMgPSBbXVxuICAgICAgICBmb3IgYWN0aW9uRmlsZSBpbiBmaWxlbGlzdChzbGFzaC5qb2luIF9fZGlybmFtZSwgJ2FjdGlvbnMnKVxuICAgICAgICAgICAgY29udGludWUgaWYgc2xhc2guZXh0KGFjdGlvbkZpbGUpIG5vdCBpbiBbJ2pzJyAnY29mZmVlJ11cbiAgICAgICAgICAgIGFjdGlvbnMgPSByZXF1aXJlIGFjdGlvbkZpbGVcbiAgICAgICAgICAgIGZvciBrZXksdmFsdWUgb2YgYWN0aW9uc1xuICAgICAgICAgICAgICAgIGlmIF8uaXNGdW5jdGlvbiB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICBAcHJvdG90eXBlW2tleV0gPSB2YWx1ZVxuICAgICAgICAgICAgICAgIGVsc2UgaWYga2V5ID09ICdhY3Rpb25zJ1xuICAgICAgICAgICAgICAgICAgICBmb3Igayx2IG9mIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBub3QgXy5pc1N0cmluZyB2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdi5rZXkgPSBrIGlmIG5vdCB2LmtleT9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAYWN0aW9ucy5wdXNoIHZcblxuICAgICAgICAjIHRvbyBlYXJseSBmb3IgbG9nIGhlcmUhXG4gICAgICAgICMgY29uc29sZS5sb2cgc3RyIEBhY3Rpb25zXG5cbiAgICBAYWN0aW9uV2l0aE5hbWU6IChuYW1lKSAtPlxuXG4gICAgICAgIGZvciBhY3Rpb24gaW4gRWRpdG9yLmFjdGlvbnNcbiAgICAgICAgICAgIGlmIGFjdGlvbi5uYW1lID09IG5hbWVcbiAgICAgICAgICAgICAgICByZXR1cm4gYWN0aW9uXG4gICAgICAgIG51bGxcblxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgIDAwMCAwMDAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgICAgMDAwICAgICAgIDAwMDAwICAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAwMDAwMFxuXG4gICAgc2hlYmFuZ0ZpbGVUeXBlOiAtPiBAY29uZmlnPy5zeW50YXhOYW1lID8gJ3R4dCdcblxuICAgIHNldHVwRmlsZVR5cGU6IC0+XG5cbiAgICAgICAgb2xkVHlwZSA9IEBmaWxlVHlwZVxuICAgICAgICBuZXdUeXBlID0gQHNoZWJhbmdGaWxlVHlwZSgpXG5cbiAgICAgICAgQHN5bnRheD8ubmFtZSA9IG5ld1R5cGVcbiAgICAgICAgQHNldEZpbGVUeXBlIG5ld1R5cGVcblxuICAgICAgICBpZiBvbGRUeXBlICE9IEBmaWxlVHlwZVxuICAgICAgICAgICAgQGVtaXQgJ2ZpbGVUeXBlQ2hhbmdlZCcsIEBmaWxlVHlwZVxuXG4gICAgc2V0RmlsZVR5cGU6IChAZmlsZVR5cGUpIC0+XG5cbiAgICAgICAgIyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gc3RyaW5nc1xuXG4gICAgICAgIEBzdHJpbmdDaGFyYWN0ZXJzID1cbiAgICAgICAgICAgIFwiJ1wiOiAgJ3NpbmdsZSdcbiAgICAgICAgICAgICdcIic6ICAnZG91YmxlJ1xuXG4gICAgICAgIHN3aXRjaCBAZmlsZVR5cGVcbiAgICAgICAgICAgIHdoZW4gJ21kJyAgIHRoZW4gQHN0cmluZ0NoYXJhY3RlcnNbJyonXSA9ICdib2xkJ1xuICAgICAgICAgICAgd2hlbiAnbm9vbicgdGhlbiBAc3RyaW5nQ2hhcmFjdGVyc1snfCddID0gJ3BpcGUnXG5cbiAgICAgICAgIyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gYnJhY2tldHNcblxuICAgICAgICBAYnJhY2tldENoYXJhY3RlcnMgPVxuICAgICAgICAgICAgb3BlbjpcbiAgICAgICAgICAgICAgICAnWyc6ICddJ1xuICAgICAgICAgICAgICAgICd7JzogJ30nXG4gICAgICAgICAgICAgICAgJygnOiAnKSdcbiAgICAgICAgICAgIGNsb3NlOiAgIHt9XG4gICAgICAgICAgICByZWdleHBzOiBbXVxuXG4gICAgICAgIHN3aXRjaCBAZmlsZVR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2h0bWwnIHRoZW4gQGJyYWNrZXRDaGFyYWN0ZXJzLm9wZW5bJzwnXSA9ICc+J1xuXG4gICAgICAgIGZvciBrLHYgb2YgQGJyYWNrZXRDaGFyYWN0ZXJzLm9wZW5cbiAgICAgICAgICAgIEBicmFja2V0Q2hhcmFjdGVycy5jbG9zZVt2XSA9IGtcblxuICAgICAgICBAYnJhY2tldENoYXJhY3RlcnMucmVnZXhwID0gW11cbiAgICAgICAgZm9yIGtleSBpbiBbJ29wZW4nICdjbG9zZSddXG4gICAgICAgICAgICBjc3RyID0gXy5rZXlzKEBicmFja2V0Q2hhcmFjdGVyc1trZXldKS5qb2luICcnXG4gICAgICAgICAgICByZWcgPSBuZXcgUmVnRXhwIFwiWyN7Xy5lc2NhcGVSZWdFeHAgY3N0cn1dXCJcbiAgICAgICAgICAgIEBicmFja2V0Q2hhcmFjdGVycy5yZWdleHBzLnB1c2ggW3JlZywga2V5XVxuXG4gICAgICAgIEBpbml0U3Vycm91bmQoKVxuXG4gICAgICAgICMgX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fIGluZGVudFxuXG4gICAgICAgIEBpbmRlbnROZXdMaW5lTW9yZSA9IG51bGxcbiAgICAgICAgQGluZGVudE5ld0xpbmVMZXNzID0gbnVsbFxuICAgICAgICBAaW5zZXJ0SW5kZW50ZWRFbXB0eUxpbmVCZXR3ZWVuID0gJ3t9J1xuXG4gICAgICAgIHN3aXRjaCBAZmlsZVR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2NvZmZlZScsICdrb2ZmZWUnXG4gICAgICAgICAgICAgICAgQGluZGVudE5ld0xpbmVNb3JlID1cbiAgICAgICAgICAgICAgICAgICAgbGluZUVuZHNXaXRoOiBbJy0+JywgJz0+JywgJzonLCAnPSddXG4gICAgICAgICAgICAgICAgICAgIGxpbmVSZWdFeHA6ICAgL14oXFxzK3doZW58XFxzKmlmfFxccyplbHNlXFxzK2lmXFxzKykoPyEuKlxcc3RoZW5cXHMpfChefFxccykoZWxzZVxccyokfHN3aXRjaFxcc3xmb3JcXHN8d2hpbGVcXHN8Y2xhc3NcXHMpL1xuXG4gICAgICAgICMgX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fIGNvbW1lbnRcbiAgICAgICAgXG4gICAgICAgIEBtdWx0aUNvbW1lbnQgPSBzd2l0Y2ggQGZpbGVUeXBlXG4gICAgICAgICAgICB3aGVuICdjb2ZmZWUnICdrb2ZmZWUnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIG9wZW46JyMjIycgIGNsb3NlOicjIyMnXG4gICAgICAgICAgICB3aGVuICdodG1sJyAnbWQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIG9wZW46JzwhLS0nIGNsb3NlOictLT4nXG4gICAgICAgICAgICB3aGVuICdzdHlsJyAnY3BwJyAnYycgJ2gnICdocHAnICdjeHgnICdjcycgJ2pzJyAnc2NzcycgJ3RzJyAnc3dpZnQnICdmcmFnJyAndmVydCcgdGhlbiBvcGVuOicvKicgICBjbG9zZTonKi8nXG4gICAgICAgIFxuICAgICAgICBAbGluZUNvbW1lbnQgPSBzd2l0Y2ggQGZpbGVUeXBlXG4gICAgICAgICAgICAgd2hlbiAnY29mZmVlJyAna29mZmVlJyAnc2gnICdiYXQnICdub29uJyAna28nICd0eHQnICdmaXNoJyAgICAgICAgICAgICAgdGhlbiAnIydcbiAgICAgICAgICAgICB3aGVuICdzdHlsJyAnY3BwJyAnYycgJ2gnICdocHAnICdjeHgnICdjcycgJ2pzJyAnc2NzcycgJ3RzJyAnc3dpZnQnICdmcmFnJyAndmVydCcgdGhlbiAnLy8nXG4gICAgICAgICAgICAgd2hlbiAnaXNzJyAnaW5pJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiAnOydcbiAgICAgICAgICAgICBcbiAgICAgICAgaWYgQGxpbmVDb21tZW50XG4gICAgICAgICAgICBAaGVhZGVyUmVnRXhwID0gbmV3IFJlZ0V4cChcIl4oXFxcXHMqI3tfLmVzY2FwZVJlZ0V4cCBAbGluZUNvbW1lbnR9XFxcXHMqKT8oXFxcXHMqMFswXFxcXHNdKykkXCIpXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAgICAgICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICAgICAgICAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIHNldFRleHQ6ICh0ZXh0PVwiXCIpIC0+XG4gICAgICAgIFxuICAgICAgICAjIGtsb2cgJ3NldFRleHQnIHRleHQubGVuZ3RoXG5cbiAgICAgICAgaWYgQHN5bnRheC5uYW1lID09ICd0eHQnXG4gICAgICAgICAgICBAc3ludGF4Lm5hbWUgPSBTeW50YXguc2hlYmFuZyB0ZXh0LnNsaWNlIDAsIHRleHQuc2VhcmNoIC9cXHI/XFxuL1xuXG4gICAgICAgIGxpbmVzID0gdGV4dC5zcGxpdCAvXFxuL1xuXG4gICAgICAgIEBuZXdsaW5lQ2hhcmFjdGVycyA9ICdcXG4nXG4gICAgICAgIGlmIHZhbGlkIGxpbmVzXG4gICAgICAgICAgICBpZiBsaW5lc1swXS5lbmRzV2l0aCAnXFxyJ1xuICAgICAgICAgICAgICAgIGxpbmVzID0gdGV4dC5zcGxpdCAvXFxyP1xcbi9cbiAgICAgICAgICAgICAgICBAbmV3bGluZUNoYXJhY3RlcnMgPSAnXFxyXFxuJ1xuXG4gICAgICAgIEBzZXRMaW5lcyBsaW5lc1xuXG4gICAgc2V0TGluZXM6IChsaW5lcykgLT5cblxuICAgICAgICBAc3ludGF4LnNldExpbmVzIGxpbmVzXG4gICAgICAgIHN1cGVyIGxpbmVzXG4gICAgICAgIEBlbWl0ICdsaW5lc1NldCcgbGluZXNcblxuICAgIHRleHRPZlNlbGVjdGlvbkZvckNsaXBib2FyZDogLT5cblxuICAgICAgICBpZiBAbnVtU2VsZWN0aW9ucygpXG4gICAgICAgICAgICBAdGV4dE9mU2VsZWN0aW9uKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRleHRJblJhbmdlcyBAcmFuZ2VzRm9yQ3Vyc29yTGluZXMoKVxuXG4gICAgc3BsaXRTdGF0ZUxpbmVBdFBvczogKHN0YXRlLCBwb3MpIC0+XG5cbiAgICAgICAgbCA9IHN0YXRlLmxpbmUgcG9zWzFdXG4gICAgICAgIGtlcnJvciBcIm5vIGxpbmUgYXQgcG9zICN7cG9zfT9cIiBpZiBub3QgbD9cbiAgICAgICAgcmV0dXJuIFsnJyAnJ10gaWYgbm90IGw/XG4gICAgICAgIFtsLnNsaWNlKDAsIHBvc1swXSksIGwuc2xpY2UocG9zWzBdKV1cblxuICAgICMgMDAwMDAwMDAgIDAwICAgICAwMCAgMDAwICAwMDAwMDAwMDAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwXG5cbiAgICBlbWl0RWRpdDogKGFjdGlvbikgLT5cblxuICAgICAgICBtYyA9IEBtYWluQ3Vyc29yKClcbiAgICAgICAgbGluZSA9IEBsaW5lIG1jWzFdXG5cbiAgICAgICAgQGVtaXQgJ2VkaXQnLFxuICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb25cbiAgICAgICAgICAgIGxpbmU6ICAgbGluZVxuICAgICAgICAgICAgYmVmb3JlOiBsaW5lLnNsaWNlIDAsIG1jWzBdXG4gICAgICAgICAgICBhZnRlcjogIGxpbmUuc2xpY2UgbWNbMF1cbiAgICAgICAgICAgIGN1cnNvcjogbWNcblxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwXG5cbiAgICBpbmRlbnRTdHJpbmdGb3JMaW5lQXRJbmRleDogKGxpKSAtPlxuXG4gICAgICAgIHdoaWxlIGVtcHR5KEBsaW5lKGxpKS50cmltKCkpIGFuZCBsaSA+IDBcbiAgICAgICAgICAgIGxpLS1cblxuICAgICAgICBpZiAwIDw9IGxpIDwgQG51bUxpbmVzKClcblxuICAgICAgICAgICAgaWwgPSAwXG4gICAgICAgICAgICBsaW5lID0gQGxpbmUgbGlcbiAgICAgICAgICAgIHRoaXNJbmRlbnQgICA9IEBpbmRlbnRhdGlvbkF0TGluZUluZGV4IGxpXG4gICAgICAgICAgICBpbmRlbnRMZW5ndGggPSBAaW5kZW50U3RyaW5nLmxlbmd0aFxuXG4gICAgICAgICAgICBpZiBAaW5kZW50TmV3TGluZU1vcmU/XG4gICAgICAgICAgICAgICAgaWYgQGluZGVudE5ld0xpbmVNb3JlLmxpbmVFbmRzV2l0aD8ubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIGZvciBlIGluIEBpbmRlbnROZXdMaW5lTW9yZS5saW5lRW5kc1dpdGhcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGxpbmUudHJpbSgpLmVuZHNXaXRoIGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbCA9IHRoaXNJbmRlbnQgKyBpbmRlbnRMZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIGlmIGlsID09IDBcbiAgICAgICAgICAgICAgICAgICAgaWYgQGluZGVudE5ld0xpbmVNb3JlLmxpbmVSZWdFeHA/IGFuZCBAaW5kZW50TmV3TGluZU1vcmUubGluZVJlZ0V4cC50ZXN0IGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlsID0gdGhpc0luZGVudCArIGluZGVudExlbmd0aFxuXG4gICAgICAgICAgICBpbCA9IHRoaXNJbmRlbnQgaWYgaWwgPT0gMFxuICAgICAgICAgICAgaWwgPSBNYXRoLm1heCBpbCwgQGluZGVudGF0aW9uQXRMaW5lSW5kZXggbGkrMVxuXG4gICAgICAgICAgICBfLnBhZFN0YXJ0IFwiXCIsIGlsXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgICcnXG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yXG4iXX0=
//# sourceURL=../../coffee/editor/editor.coffee