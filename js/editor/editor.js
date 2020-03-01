// koffee 1.7.0

/*
00000000  0000000    000  000000000   0000000   00000000
000       000   000  000     000     000   000  000   000
0000000   000   000  000     000     000   000  0000000
000       000   000  000     000     000   000  000   000
00000000  0000000    000     000      0000000   000   000
 */
var Buffer, Do, Editor, Syntax, _, empty, filelist, kerror, ref, slash,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), _ = ref._, empty = ref.empty, filelist = ref.filelist, kerror = ref.kerror, slash = ref.slash;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxrRUFBQTtJQUFBOzs7QUFRQSxNQUF3QyxPQUFBLENBQVEsS0FBUixDQUF4QyxFQUFFLFNBQUYsRUFBSyxpQkFBTCxFQUFZLHVCQUFaLEVBQXNCLG1CQUF0QixFQUE4Qjs7QUFFOUIsTUFBQSxHQUFVLE9BQUEsQ0FBUSxVQUFSOztBQUNWLE1BQUEsR0FBVSxPQUFBLENBQVEsVUFBUjs7QUFDVixFQUFBLEdBQVUsT0FBQSxDQUFRLE1BQVI7O0FBRUo7OztJQUVGLE1BQUMsQ0FBQSxPQUFELEdBQVc7O0lBRVIsZ0JBQUMsSUFBRCxFQUFPLE1BQVA7QUFFQyxZQUFBO1FBQUEsc0NBQUE7UUFFQSxJQUFDLENBQUEsSUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLE1BQUQsb0JBQVUsU0FBUzs7Z0JBQ1osQ0FBQzs7Z0JBQUQsQ0FBQyxhQUFjOztRQUV0QixJQUE0QixzQkFBNUI7WUFBQSxNQUFNLENBQUMsV0FBUCxDQUFBLEVBQUE7O1FBRUEsSUFBQyxDQUFBLFlBQUQsR0FBbUIsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxFQUFYLEVBQWUsQ0FBZjtRQUNuQixJQUFDLENBQUEsZUFBRCxHQUFtQjtRQUNuQixJQUFDLENBQUEsTUFBRCxHQUFtQixJQUFJLE1BQUosQ0FBVyxJQUFDLENBQUEsTUFBTSxDQUFDLFVBQW5CLEVBQStCLElBQUMsQ0FBQSxJQUFoQyxFQUFzQyxJQUFDLENBQUEsS0FBdkM7UUFDbkIsSUFBQyxFQUFBLEVBQUEsRUFBRCxHQUFtQixJQUFJLEVBQUosQ0FBTyxJQUFQO1FBRW5CLElBQUMsQ0FBQSxhQUFELENBQUE7SUFmRDs7cUJBaUJILEdBQUEsR0FBSyxTQUFBO2VBRUQsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEdBQUosQ0FBQTtJQUZDOztJQVVMLE1BQUMsQ0FBQSxXQUFELEdBQWMsU0FBQTtB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QUFDbEIsa0NBRko7O0FBREoscUJBREo7O2dCQUtBLElBQUcsRUFBQSxLQUFNLENBQVQ7b0JBQ0ksSUFBRywyQ0FBQSxJQUFtQyxJQUFDLENBQUEsaUJBQWlCLENBQUMsVUFBVSxDQUFDLElBQTlCLENBQW1DLElBQW5DLENBQXRDO3dCQUNJLEVBQUEsR0FBSyxVQUFBLEdBQWEsYUFEdEI7cUJBREo7aUJBTko7O1lBVUEsSUFBbUIsRUFBQSxLQUFNLENBQXpCO2dCQUFBLEVBQUEsR0FBSyxXQUFMOztZQUNBLEVBQUEsR0FBSyxJQUFJLENBQUMsR0FBTCxDQUFTLEVBQVQsRUFBYSxJQUFDLENBQUEsc0JBQUQsQ0FBd0IsRUFBQSxHQUFHLENBQTNCLENBQWI7bUJBRUwsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxFQUFYLEVBQWUsRUFBZixFQXBCSjtTQUFBLE1BQUE7bUJBc0JJLEdBdEJKOztJQUx3Qjs7OztHQTlNWDs7QUEyT3JCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgXywgZW1wdHksIGZpbGVsaXN0LCBrZXJyb3IsIHNsYXNoIH0gPSByZXF1aXJlICdreGsnXG5cbkJ1ZmZlciAgPSByZXF1aXJlICcuL2J1ZmZlcidcblN5bnRheCAgPSByZXF1aXJlICcuL3N5bnRheCdcbkRvICAgICAgPSByZXF1aXJlICcuL2RvJ1xuXG5jbGFzcyBFZGl0b3IgZXh0ZW5kcyBCdWZmZXJcblxuICAgIEBhY3Rpb25zID0gbnVsbFxuXG4gICAgQDogKG5hbWUsIGNvbmZpZykgLT5cblxuICAgICAgICBzdXBlcigpXG5cbiAgICAgICAgQG5hbWUgICA9IG5hbWVcbiAgICAgICAgQGNvbmZpZyA9IGNvbmZpZyA/IHt9XG4gICAgICAgIEBjb25maWcuc3ludGF4TmFtZSA/PSAndHh0J1xuXG4gICAgICAgIEVkaXRvci5pbml0QWN0aW9ucygpIGlmIG5vdCBFZGl0b3IuYWN0aW9ucz9cblxuICAgICAgICBAaW5kZW50U3RyaW5nICAgID0gXy5wYWRTdGFydCBcIlwiLCA0XG4gICAgICAgIEBzdGlja3lTZWxlY3Rpb24gPSBmYWxzZVxuICAgICAgICBAc3ludGF4ICAgICAgICAgID0gbmV3IFN5bnRheCBAY29uZmlnLnN5bnRheE5hbWUsIEBsaW5lLCBAbGluZXNcbiAgICAgICAgQGRvICAgICAgICAgICAgICA9IG5ldyBEbyBAXG5cbiAgICAgICAgQHNldHVwRmlsZVR5cGUoKVxuXG4gICAgZGVsOiAtPlxuXG4gICAgICAgIEBkby5kZWwoKVxuXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIEBpbml0QWN0aW9uczogLT5cblxuICAgICAgICBAYWN0aW9ucyA9IFtdXG4gICAgICAgIGZvciBhY3Rpb25GaWxlIGluIGZpbGVsaXN0KHNsYXNoLmpvaW4gX19kaXJuYW1lLCAnYWN0aW9ucycpXG4gICAgICAgICAgICBjb250aW51ZSBpZiBzbGFzaC5leHQoYWN0aW9uRmlsZSkgbm90IGluIFsnanMnLCAnY29mZmVlJ11cbiAgICAgICAgICAgIGFjdGlvbnMgPSByZXF1aXJlIGFjdGlvbkZpbGVcbiAgICAgICAgICAgIGZvciBrZXksdmFsdWUgb2YgYWN0aW9uc1xuICAgICAgICAgICAgICAgIGlmIF8uaXNGdW5jdGlvbiB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICBAcHJvdG90eXBlW2tleV0gPSB2YWx1ZVxuICAgICAgICAgICAgICAgIGVsc2UgaWYga2V5ID09ICdhY3Rpb25zJ1xuICAgICAgICAgICAgICAgICAgICBmb3Igayx2IG9mIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBub3QgXy5pc1N0cmluZyB2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdi5rZXkgPSBrIGlmIG5vdCB2LmtleT9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAYWN0aW9ucy5wdXNoIHZcblxuICAgICAgICAjIHRvbyBlYXJseSBmb3IgbG9nIGhlcmUhXG4gICAgICAgICMgY29uc29sZS5sb2cgc3RyIEBhY3Rpb25zXG5cbiAgICBAYWN0aW9uV2l0aE5hbWU6IChuYW1lKSAtPlxuXG4gICAgICAgIGZvciBhY3Rpb24gaW4gRWRpdG9yLmFjdGlvbnNcbiAgICAgICAgICAgIGlmIGFjdGlvbi5uYW1lID09IG5hbWVcbiAgICAgICAgICAgICAgICByZXR1cm4gYWN0aW9uXG4gICAgICAgIG51bGxcblxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgIDAwMCAwMDAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgICAgMDAwICAgICAgIDAwMDAwICAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAwMDAwMFxuXG4gICAgc2hlYmFuZ0ZpbGVUeXBlOiAtPiBAY29uZmlnPy5zeW50YXhOYW1lID8gJ3R4dCdcblxuICAgIHNldHVwRmlsZVR5cGU6IC0+XG5cbiAgICAgICAgb2xkVHlwZSA9IEBmaWxlVHlwZVxuICAgICAgICBuZXdUeXBlID0gQHNoZWJhbmdGaWxlVHlwZSgpXG5cbiAgICAgICAgQHN5bnRheD8uc2V0RmlsZVR5cGUgbmV3VHlwZVxuICAgICAgICBAc2V0RmlsZVR5cGUgbmV3VHlwZVxuXG4gICAgICAgIGlmIG9sZFR5cGUgIT0gQGZpbGVUeXBlXG4gICAgICAgICAgICBAZW1pdCAnZmlsZVR5cGVDaGFuZ2VkJywgQGZpbGVUeXBlXG5cbiAgICBzZXRGaWxlVHlwZTogKEBmaWxlVHlwZSkgLT5cblxuICAgICAgICAjIF9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fXyBzdHJpbmdzXG5cbiAgICAgICAgQHN0cmluZ0NoYXJhY3RlcnMgPVxuICAgICAgICAgICAgXCInXCI6ICAnc2luZ2xlJ1xuICAgICAgICAgICAgJ1wiJzogICdkb3VibGUnXG5cbiAgICAgICAgc3dpdGNoIEBmaWxlVHlwZVxuICAgICAgICAgICAgd2hlbiAnbWQnICAgdGhlbiBAc3RyaW5nQ2hhcmFjdGVyc1snKiddID0gJ2JvbGQnXG4gICAgICAgICAgICB3aGVuICdub29uJyB0aGVuIEBzdHJpbmdDaGFyYWN0ZXJzWyd8J10gPSAncGlwZSdcblxuICAgICAgICAjIF9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fXyBicmFja2V0c1xuXG4gICAgICAgIEBicmFja2V0Q2hhcmFjdGVycyA9XG4gICAgICAgICAgICBvcGVuOlxuICAgICAgICAgICAgICAgICdbJzogJ10nXG4gICAgICAgICAgICAgICAgJ3snOiAnfSdcbiAgICAgICAgICAgICAgICAnKCc6ICcpJ1xuICAgICAgICAgICAgY2xvc2U6ICAge31cbiAgICAgICAgICAgIHJlZ2V4cHM6IFtdXG5cbiAgICAgICAgc3dpdGNoIEBmaWxlVHlwZVxuICAgICAgICAgICAgd2hlbiAnaHRtbCcgdGhlbiBAYnJhY2tldENoYXJhY3RlcnMub3BlblsnPCddID0gJz4nXG5cbiAgICAgICAgZm9yIGssdiBvZiBAYnJhY2tldENoYXJhY3RlcnMub3BlblxuICAgICAgICAgICAgQGJyYWNrZXRDaGFyYWN0ZXJzLmNsb3NlW3ZdID0ga1xuXG4gICAgICAgIEBicmFja2V0Q2hhcmFjdGVycy5yZWdleHAgPSBbXVxuICAgICAgICBmb3Iga2V5IGluIFsnb3BlbicgJ2Nsb3NlJ11cbiAgICAgICAgICAgIGNzdHIgPSBfLmtleXMoQGJyYWNrZXRDaGFyYWN0ZXJzW2tleV0pLmpvaW4gJydcbiAgICAgICAgICAgIHJlZyA9IG5ldyBSZWdFeHAgXCJbI3tfLmVzY2FwZVJlZ0V4cCBjc3RyfV1cIlxuICAgICAgICAgICAgQGJyYWNrZXRDaGFyYWN0ZXJzLnJlZ2V4cHMucHVzaCBbcmVnLCBrZXldXG5cbiAgICAgICAgIyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gc3Vycm91bmRcblxuICAgICAgICBAaW5pdFN1cnJvdW5kKClcblxuICAgICAgICAjIF9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fXyBpbmRlbnRcblxuICAgICAgICBAaW5kZW50TmV3TGluZU1vcmUgPSBudWxsXG4gICAgICAgIEBpbmRlbnROZXdMaW5lTGVzcyA9IG51bGxcbiAgICAgICAgQGluc2VydEluZGVudGVkRW1wdHlMaW5lQmV0d2VlbiA9ICd7fSdcblxuICAgICAgICBzd2l0Y2ggQGZpbGVUeXBlXG4gICAgICAgICAgICB3aGVuICdjb2ZmZWUnLCAna29mZmVlJ1xuICAgICAgICAgICAgICAgIEBpbmRlbnROZXdMaW5lTW9yZSA9XG4gICAgICAgICAgICAgICAgICAgIGxpbmVFbmRzV2l0aDogWyctPicsICc9PicsICc6JywgJz0nXVxuICAgICAgICAgICAgICAgICAgICBsaW5lUmVnRXhwOiAgIC9eKFxccyt3aGVufFxccyppZnxcXHMqZWxzZVxccytpZlxccyspKD8hLipcXHN0aGVuXFxzKXwoXnxcXHMpKGVsc2VcXHMqJHxzd2l0Y2hcXHN8Zm9yXFxzfHdoaWxlXFxzfGNsYXNzXFxzKS9cblxuICAgICAgICAjIF9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fXyBjb21tZW50XG4gICAgICAgIFxuICAgICAgICBAbXVsdGlDb21tZW50ID0gc3dpdGNoIEBmaWxlVHlwZVxuICAgICAgICAgICAgd2hlbiAnY29mZmVlJyAna29mZmVlJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBvcGVuOicjIyMnICBjbG9zZTonIyMjJ1xuICAgICAgICAgICAgd2hlbiAnaHRtbCcgJ21kJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBvcGVuOic8IS0tJyBjbG9zZTonLS0+J1xuICAgICAgICAgICAgd2hlbiAnc3R5bCcgJ2NwcCcgJ2MnICdoJyAnaHBwJyAnY3h4JyAnY3MnICdqcycgJ3Njc3MnICd0cycgJ3N3aWZ0JyAnZnJhZycgJ3ZlcnQnIHRoZW4gb3BlbjonLyonICAgY2xvc2U6JyovJ1xuICAgICAgICBcbiAgICAgICAgQGxpbmVDb21tZW50ID0gc3dpdGNoIEBmaWxlVHlwZVxuICAgICAgICAgICAgIHdoZW4gJ2NvZmZlZScgJ2tvZmZlZScgJ3NoJyAnYmF0JyAnbm9vbicgJ2tvJyAndHh0JyAnZmlzaCcgICAgICAgICAgICAgIHRoZW4gJyMnXG4gICAgICAgICAgICAgd2hlbiAnc3R5bCcgJ2NwcCcgJ2MnICdoJyAnaHBwJyAnY3h4JyAnY3MnICdqcycgJ3Njc3MnICd0cycgJ3N3aWZ0JyAnZnJhZycgJ3ZlcnQnIHRoZW4gJy8vJ1xuICAgICAgICAgICAgIHdoZW4gJ2lzcycgJ2luaScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gJzsnXG4gICAgICAgICAgICAgXG4gICAgICAgIGlmIEBsaW5lQ29tbWVudFxuICAgICAgICAgICAgQGhlYWRlclJlZ0V4cCA9IG5ldyBSZWdFeHAoXCJeKFxcXFxzKiN7Xy5lc2NhcGVSZWdFeHAgQGxpbmVDb21tZW50fVxcXFxzKik/KFxcXFxzKjBbMFxcXFxzXSspJFwiKVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwICAgICAgICAgICAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBzZXRUZXh0OiAodGV4dD1cIlwiKSAtPlxuXG4gICAgICAgIGlmIEBzeW50YXgubmFtZSA9PSAndHh0J1xuICAgICAgICAgICAgQHN5bnRheC5uYW1lID0gU3ludGF4LnNoZWJhbmcgdGV4dC5zbGljZSAwLCB0ZXh0LnNlYXJjaCAvXFxyP1xcbi9cblxuICAgICAgICBsaW5lcyA9IHRleHQuc3BsaXQgL1xcbi9cblxuICAgICAgICBAbmV3bGluZUNoYXJhY3RlcnMgPSAnXFxuJ1xuICAgICAgICBpZiBub3QgZW1wdHkgbGluZXNcbiAgICAgICAgICAgIGlmIGxpbmVzWzBdLmVuZHNXaXRoICdcXHInXG4gICAgICAgICAgICAgICAgbGluZXMgPSB0ZXh0LnNwbGl0IC9cXHI/XFxuL1xuICAgICAgICAgICAgICAgIEBuZXdsaW5lQ2hhcmFjdGVycyA9ICdcXHJcXG4nXG5cbiAgICAgICAgQHNldExpbmVzIGxpbmVzXG5cbiAgICBzZXRMaW5lczogKGxpbmVzKSAtPlxuXG4gICAgICAgIEBzeW50YXguY2xlYXIoKVxuICAgICAgICBAc3ludGF4LnNldExpbmVzIGxpbmVzXG4gICAgICAgIHN1cGVyIGxpbmVzXG4gICAgICAgIEBlbWl0ICdsaW5lc1NldCcsIGxpbmVzXG5cbiAgICB0ZXh0T2ZTZWxlY3Rpb25Gb3JDbGlwYm9hcmQ6IC0+XG5cbiAgICAgICAgaWYgQG51bVNlbGVjdGlvbnMoKVxuICAgICAgICAgICAgQHRleHRPZlNlbGVjdGlvbigpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0ZXh0SW5SYW5nZXMgQHJhbmdlc0ZvckN1cnNvckxpbmVzKClcblxuICAgIHNwbGl0U3RhdGVMaW5lQXRQb3M6IChzdGF0ZSwgcG9zKSAtPlxuXG4gICAgICAgIGwgPSBzdGF0ZS5saW5lIHBvc1sxXVxuICAgICAgICBrZXJyb3IgXCJubyBsaW5lIGF0IHBvcyAje3Bvc30/XCIgaWYgbm90IGw/XG4gICAgICAgIHJldHVybiBbJycsJyddIGlmIG5vdCBsP1xuICAgICAgICBbbC5zbGljZSgwLCBwb3NbMF0pLCBsLnNsaWNlKHBvc1swXSldXG5cbiAgICAjIDAwMDAwMDAwICAwMCAgICAgMDAgIDAwMCAgMDAwMDAwMDAwICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMFxuXG4gICAgZW1pdEVkaXQ6IChhY3Rpb24pIC0+XG5cbiAgICAgICAgbWMgPSBAbWFpbkN1cnNvcigpXG4gICAgICAgIGxpbmUgPSBAbGluZSBtY1sxXVxuXG4gICAgICAgIEBlbWl0ICdlZGl0JyxcbiAgICAgICAgICAgIGFjdGlvbjogYWN0aW9uXG4gICAgICAgICAgICBsaW5lOiAgIGxpbmVcbiAgICAgICAgICAgIGJlZm9yZTogbGluZS5zbGljZSAwLCBtY1swXVxuICAgICAgICAgICAgYWZ0ZXI6ICBsaW5lLnNsaWNlIG1jWzBdXG4gICAgICAgICAgICBjdXJzb3I6IG1jXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuXG4gICAgaW5kZW50U3RyaW5nRm9yTGluZUF0SW5kZXg6IChsaSkgLT5cblxuICAgICAgICB3aGlsZSBlbXB0eShAbGluZShsaSkudHJpbSgpKSBhbmQgbGkgPiAwXG4gICAgICAgICAgICBsaS0tXG5cbiAgICAgICAgaWYgMCA8PSBsaSA8IEBudW1MaW5lcygpXG5cbiAgICAgICAgICAgIGlsID0gMFxuICAgICAgICAgICAgbGluZSA9IEBsaW5lIGxpXG4gICAgICAgICAgICB0aGlzSW5kZW50ICAgPSBAaW5kZW50YXRpb25BdExpbmVJbmRleCBsaVxuICAgICAgICAgICAgaW5kZW50TGVuZ3RoID0gQGluZGVudFN0cmluZy5sZW5ndGhcblxuICAgICAgICAgICAgaWYgQGluZGVudE5ld0xpbmVNb3JlP1xuICAgICAgICAgICAgICAgIGlmIEBpbmRlbnROZXdMaW5lTW9yZS5saW5lRW5kc1dpdGg/Lmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBmb3IgZSBpbiBAaW5kZW50TmV3TGluZU1vcmUubGluZUVuZHNXaXRoXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBsaW5lLnRyaW0oKS5lbmRzV2l0aCBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWwgPSB0aGlzSW5kZW50ICsgaW5kZW50TGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBpZiBpbCA9PSAwXG4gICAgICAgICAgICAgICAgICAgIGlmIEBpbmRlbnROZXdMaW5lTW9yZS5saW5lUmVnRXhwPyBhbmQgQGluZGVudE5ld0xpbmVNb3JlLmxpbmVSZWdFeHAudGVzdCBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICBpbCA9IHRoaXNJbmRlbnQgKyBpbmRlbnRMZW5ndGhcblxuICAgICAgICAgICAgaWwgPSB0aGlzSW5kZW50IGlmIGlsID09IDBcbiAgICAgICAgICAgIGlsID0gTWF0aC5tYXggaWwsIEBpbmRlbnRhdGlvbkF0TGluZUluZGV4IGxpKzFcblxuICAgICAgICAgICAgXy5wYWRTdGFydCBcIlwiLCBpbFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICAnJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRvclxuIl19
//# sourceURL=../../coffee/editor/editor.coffee