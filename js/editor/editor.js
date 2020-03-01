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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxrRUFBQTtJQUFBOzs7QUFRQSxNQUF3QyxPQUFBLENBQVEsS0FBUixDQUF4QyxFQUFFLFNBQUYsRUFBSyxpQkFBTCxFQUFZLHVCQUFaLEVBQXNCLG1CQUF0QixFQUE4Qjs7QUFFOUIsTUFBQSxHQUFVLE9BQUEsQ0FBUSxVQUFSOztBQUNWLE1BQUEsR0FBVSxPQUFBLENBQVEsVUFBUjs7QUFDVixFQUFBLEdBQVUsT0FBQSxDQUFRLE1BQVI7O0FBRUo7OztJQUVGLE1BQUMsQ0FBQSxPQUFELEdBQVc7O0lBRVIsZ0JBQUMsSUFBRCxFQUFPLE1BQVA7QUFFQyxZQUFBO1FBQUEsc0NBQUE7UUFFQSxJQUFDLENBQUEsSUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLE1BQUQsb0JBQVUsU0FBUzs7Z0JBQ1osQ0FBQzs7Z0JBQUQsQ0FBQyxhQUFjOztRQUV0QixJQUE0QixzQkFBNUI7WUFBQSxNQUFNLENBQUMsV0FBUCxDQUFBLEVBQUE7O1FBRUEsSUFBQyxDQUFBLFlBQUQsR0FBbUIsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxFQUFYLEVBQWUsQ0FBZjtRQUNuQixJQUFDLENBQUEsZUFBRCxHQUFtQjtRQUNuQixJQUFDLENBQUEsTUFBRCxHQUFtQixJQUFJLE1BQUosQ0FBVyxJQUFDLENBQUEsTUFBTSxDQUFDLFVBQW5CLEVBQStCLElBQUMsQ0FBQSxJQUFoQyxFQUFzQyxJQUFDLENBQUEsS0FBdkM7UUFDbkIsSUFBQyxFQUFBLEVBQUEsRUFBRCxHQUFtQixJQUFJLEVBQUosQ0FBTyxJQUFQO1FBRW5CLElBQUMsQ0FBQSxhQUFELENBQUE7SUFmRDs7cUJBaUJILEdBQUEsR0FBSyxTQUFBO2VBRUQsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEdBQUosQ0FBQTtJQUZDOztJQVVMLE1BQUMsQ0FBQSxXQUFELEdBQWMsU0FBQTtB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LEVBQUEsS0FBTSxDQUFUO29CQUNJLElBQUcsMkNBQUEsSUFBbUMsSUFBQyxDQUFBLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxJQUE5QixDQUFtQyxJQUFuQyxDQUF0Qzt3QkFDSSxFQUFBLEdBQUssVUFBQSxHQUFhLGFBRHRCO3FCQURKO2lCQU5KOztZQVVBLElBQW1CLEVBQUEsS0FBTSxDQUF6QjtnQkFBQSxFQUFBLEdBQUssV0FBTDs7WUFDQSxFQUFBLEdBQUssSUFBSSxDQUFDLEdBQUwsQ0FBUyxFQUFULEVBQWEsSUFBQyxDQUFBLHNCQUFELENBQXdCLEVBQUEsR0FBRyxDQUEzQixDQUFiO21CQUVMLENBQUMsQ0FBQyxRQUFGLENBQVcsRUFBWCxFQUFlLEVBQWYsRUFwQko7U0FBQSxNQUFBO21CQXNCSSxHQXRCSjs7SUFMd0I7Ozs7R0E3TVg7O0FBME9yQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiMjI1xuXG57IF8sIGVtcHR5LCBmaWxlbGlzdCwga2Vycm9yLCBzbGFzaCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5CdWZmZXIgID0gcmVxdWlyZSAnLi9idWZmZXInXG5TeW50YXggID0gcmVxdWlyZSAnLi9zeW50YXgnXG5EbyAgICAgID0gcmVxdWlyZSAnLi9kbydcblxuY2xhc3MgRWRpdG9yIGV4dGVuZHMgQnVmZmVyXG5cbiAgICBAYWN0aW9ucyA9IG51bGxcblxuICAgIEA6IChuYW1lLCBjb25maWcpIC0+XG5cbiAgICAgICAgc3VwZXIoKVxuXG4gICAgICAgIEBuYW1lICAgPSBuYW1lXG4gICAgICAgIEBjb25maWcgPSBjb25maWcgPyB7fVxuICAgICAgICBAY29uZmlnLnN5bnRheE5hbWUgPz0gJ3R4dCdcblxuICAgICAgICBFZGl0b3IuaW5pdEFjdGlvbnMoKSBpZiBub3QgRWRpdG9yLmFjdGlvbnM/XG5cbiAgICAgICAgQGluZGVudFN0cmluZyAgICA9IF8ucGFkU3RhcnQgXCJcIiwgNFxuICAgICAgICBAc3RpY2t5U2VsZWN0aW9uID0gZmFsc2VcbiAgICAgICAgQHN5bnRheCAgICAgICAgICA9IG5ldyBTeW50YXggQGNvbmZpZy5zeW50YXhOYW1lLCBAbGluZSwgQGxpbmVzXG4gICAgICAgIEBkbyAgICAgICAgICAgICAgPSBuZXcgRG8gQFxuXG4gICAgICAgIEBzZXR1cEZpbGVUeXBlKClcblxuICAgIGRlbDogLT5cblxuICAgICAgICBAZG8uZGVsKClcblxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBAaW5pdEFjdGlvbnM6IC0+XG5cbiAgICAgICAgQGFjdGlvbnMgPSBbXVxuICAgICAgICBmb3IgYWN0aW9uRmlsZSBpbiBmaWxlbGlzdChzbGFzaC5qb2luIF9fZGlybmFtZSwgJ2FjdGlvbnMnKVxuICAgICAgICAgICAgY29udGludWUgaWYgc2xhc2guZXh0KGFjdGlvbkZpbGUpIG5vdCBpbiBbJ2pzJywgJ2NvZmZlZSddXG4gICAgICAgICAgICBhY3Rpb25zID0gcmVxdWlyZSBhY3Rpb25GaWxlXG4gICAgICAgICAgICBmb3Iga2V5LHZhbHVlIG9mIGFjdGlvbnNcbiAgICAgICAgICAgICAgICBpZiBfLmlzRnVuY3Rpb24gdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgQHByb3RvdHlwZVtrZXldID0gdmFsdWVcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGtleSA9PSAnYWN0aW9ucydcbiAgICAgICAgICAgICAgICAgICAgZm9yIGssdiBvZiB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm90IF8uaXNTdHJpbmcgdlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYua2V5ID0gayBpZiBub3Qgdi5rZXk/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGFjdGlvbnMucHVzaCB2XG5cbiAgICAgICAgIyB0b28gZWFybHkgZm9yIGxvZyBoZXJlIVxuICAgICAgICAjIGNvbnNvbGUubG9nIHN0ciBAYWN0aW9uc1xuXG4gICAgQGFjdGlvbldpdGhOYW1lOiAobmFtZSkgLT5cblxuICAgICAgICBmb3IgYWN0aW9uIGluIEVkaXRvci5hY3Rpb25zXG4gICAgICAgICAgICBpZiBhY3Rpb24ubmFtZSA9PSBuYW1lXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjdGlvblxuICAgICAgICBudWxsXG5cbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgICAwMDAgMDAwICAgMDAwICAgMDAwICAwMDBcbiAgICAjICAgIDAwMCAgICAgICAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMFxuICAgICMgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMDBcblxuICAgIHNoZWJhbmdGaWxlVHlwZTogLT4gQGNvbmZpZz8uc3ludGF4TmFtZSA/ICd0eHQnXG5cbiAgICBzZXR1cEZpbGVUeXBlOiAtPlxuXG4gICAgICAgIG9sZFR5cGUgPSBAZmlsZVR5cGVcbiAgICAgICAgbmV3VHlwZSA9IEBzaGViYW5nRmlsZVR5cGUoKVxuXG4gICAgICAgIEBzeW50YXg/LnNldEZpbGVUeXBlIG5ld1R5cGVcbiAgICAgICAgQHNldEZpbGVUeXBlIG5ld1R5cGVcblxuICAgICAgICBpZiBvbGRUeXBlICE9IEBmaWxlVHlwZVxuICAgICAgICAgICAgQGVtaXQgJ2ZpbGVUeXBlQ2hhbmdlZCcsIEBmaWxlVHlwZVxuXG4gICAgc2V0RmlsZVR5cGU6IChAZmlsZVR5cGUpIC0+XG5cbiAgICAgICAgIyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gc3RyaW5nc1xuXG4gICAgICAgIEBzdHJpbmdDaGFyYWN0ZXJzID1cbiAgICAgICAgICAgIFwiJ1wiOiAgJ3NpbmdsZSdcbiAgICAgICAgICAgICdcIic6ICAnZG91YmxlJ1xuXG4gICAgICAgIHN3aXRjaCBAZmlsZVR5cGVcbiAgICAgICAgICAgIHdoZW4gJ21kJyAgIHRoZW4gQHN0cmluZ0NoYXJhY3RlcnNbJyonXSA9ICdib2xkJ1xuICAgICAgICAgICAgd2hlbiAnbm9vbicgdGhlbiBAc3RyaW5nQ2hhcmFjdGVyc1snfCddID0gJ3BpcGUnXG5cbiAgICAgICAgIyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gYnJhY2tldHNcblxuICAgICAgICBAYnJhY2tldENoYXJhY3RlcnMgPVxuICAgICAgICAgICAgb3BlbjpcbiAgICAgICAgICAgICAgICAnWyc6ICddJ1xuICAgICAgICAgICAgICAgICd7JzogJ30nXG4gICAgICAgICAgICAgICAgJygnOiAnKSdcbiAgICAgICAgICAgIGNsb3NlOiAgIHt9XG4gICAgICAgICAgICByZWdleHBzOiBbXVxuXG4gICAgICAgIHN3aXRjaCBAZmlsZVR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2h0bWwnIHRoZW4gQGJyYWNrZXRDaGFyYWN0ZXJzLm9wZW5bJzwnXSA9ICc+J1xuXG4gICAgICAgIGZvciBrLHYgb2YgQGJyYWNrZXRDaGFyYWN0ZXJzLm9wZW5cbiAgICAgICAgICAgIEBicmFja2V0Q2hhcmFjdGVycy5jbG9zZVt2XSA9IGtcblxuICAgICAgICBAYnJhY2tldENoYXJhY3RlcnMucmVnZXhwID0gW11cbiAgICAgICAgZm9yIGtleSBpbiBbJ29wZW4nICdjbG9zZSddXG4gICAgICAgICAgICBjc3RyID0gXy5rZXlzKEBicmFja2V0Q2hhcmFjdGVyc1trZXldKS5qb2luICcnXG4gICAgICAgICAgICByZWcgPSBuZXcgUmVnRXhwIFwiWyN7Xy5lc2NhcGVSZWdFeHAgY3N0cn1dXCJcbiAgICAgICAgICAgIEBicmFja2V0Q2hhcmFjdGVycy5yZWdleHBzLnB1c2ggW3JlZywga2V5XVxuXG4gICAgICAgICMgX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fIHN1cnJvdW5kXG5cbiAgICAgICAgQGluaXRTdXJyb3VuZCgpXG5cbiAgICAgICAgIyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gaW5kZW50XG5cbiAgICAgICAgQGluZGVudE5ld0xpbmVNb3JlID0gbnVsbFxuICAgICAgICBAaW5kZW50TmV3TGluZUxlc3MgPSBudWxsXG4gICAgICAgIEBpbnNlcnRJbmRlbnRlZEVtcHR5TGluZUJldHdlZW4gPSAne30nXG5cbiAgICAgICAgc3dpdGNoIEBmaWxlVHlwZVxuICAgICAgICAgICAgd2hlbiAnY29mZmVlJywgJ2tvZmZlZSdcbiAgICAgICAgICAgICAgICBAaW5kZW50TmV3TGluZU1vcmUgPVxuICAgICAgICAgICAgICAgICAgICBsaW5lRW5kc1dpdGg6IFsnLT4nLCAnPT4nLCAnOicsICc9J11cbiAgICAgICAgICAgICAgICAgICAgbGluZVJlZ0V4cDogICAvXihcXHMrd2hlbnxcXHMqaWZ8XFxzKmVsc2VcXHMraWZcXHMrKSg/IS4qXFxzdGhlblxccyl8KF58XFxzKShlbHNlXFxzKiR8c3dpdGNoXFxzfGZvclxcc3x3aGlsZVxcc3xjbGFzc1xccykvXG5cbiAgICAgICAgIyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gY29tbWVudFxuICAgICAgICBcbiAgICAgICAgQG11bHRpQ29tbWVudCA9IHN3aXRjaCBAZmlsZVR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2NvZmZlZScgJ2tvZmZlZScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gb3BlbjonIyMjJyAgY2xvc2U6JyMjIydcbiAgICAgICAgICAgIHdoZW4gJ2h0bWwnICdtZCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gb3BlbjonPCEtLScgY2xvc2U6Jy0tPidcbiAgICAgICAgICAgIHdoZW4gJ3N0eWwnICdjcHAnICdjJyAnaCcgJ2hwcCcgJ2N4eCcgJ2NzJyAnanMnICdzY3NzJyAndHMnICdzd2lmdCcgJ2ZyYWcnICd2ZXJ0JyB0aGVuIG9wZW46Jy8qJyAgIGNsb3NlOicqLydcbiAgICAgICAgXG4gICAgICAgIEBsaW5lQ29tbWVudCA9IHN3aXRjaCBAZmlsZVR5cGVcbiAgICAgICAgICAgICB3aGVuICdjb2ZmZWUnICdrb2ZmZWUnICdzaCcgJ2JhdCcgJ25vb24nICdrbycgJ3R4dCcgJ2Zpc2gnICAgICAgICAgICAgICB0aGVuICcjJ1xuICAgICAgICAgICAgIHdoZW4gJ3N0eWwnICdjcHAnICdjJyAnaCcgJ2hwcCcgJ2N4eCcgJ2NzJyAnanMnICdzY3NzJyAndHMnICdzd2lmdCcgJ2ZyYWcnICd2ZXJ0JyB0aGVuICcvLydcbiAgICAgICAgICAgICB3aGVuICdpc3MnICdpbmknICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuICc7J1xuICAgICAgICAgICAgIFxuICAgICAgICBpZiBAbGluZUNvbW1lbnRcbiAgICAgICAgICAgIEBoZWFkZXJSZWdFeHAgPSBuZXcgUmVnRXhwKFwiXihcXFxccyoje18uZXNjYXBlUmVnRXhwIEBsaW5lQ29tbWVudH1cXFxccyopPyhcXFxccyowWzBcXFxcc10rKSRcIilcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgICAgICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgc2V0VGV4dDogKHRleHQ9XCJcIikgLT5cblxuICAgICAgICBpZiBAc3ludGF4Lm5hbWUgPT0gJ3R4dCdcbiAgICAgICAgICAgIEBzeW50YXgubmFtZSA9IFN5bnRheC5zaGViYW5nIHRleHQuc2xpY2UgMCwgdGV4dC5zZWFyY2ggL1xccj9cXG4vXG5cbiAgICAgICAgbGluZXMgPSB0ZXh0LnNwbGl0IC9cXG4vXG5cbiAgICAgICAgQG5ld2xpbmVDaGFyYWN0ZXJzID0gJ1xcbidcbiAgICAgICAgaWYgbm90IGVtcHR5IGxpbmVzXG4gICAgICAgICAgICBpZiBsaW5lc1swXS5lbmRzV2l0aCAnXFxyJ1xuICAgICAgICAgICAgICAgIGxpbmVzID0gdGV4dC5zcGxpdCAvXFxyP1xcbi9cbiAgICAgICAgICAgICAgICBAbmV3bGluZUNoYXJhY3RlcnMgPSAnXFxyXFxuJ1xuXG4gICAgICAgIEBzZXRMaW5lcyBsaW5lc1xuXG4gICAgc2V0TGluZXM6IChsaW5lcykgLT5cblxuICAgICAgICBAc3ludGF4LnNldExpbmVzIGxpbmVzXG4gICAgICAgIHN1cGVyIGxpbmVzXG4gICAgICAgIEBlbWl0ICdsaW5lc1NldCcgbGluZXNcblxuICAgIHRleHRPZlNlbGVjdGlvbkZvckNsaXBib2FyZDogLT5cblxuICAgICAgICBpZiBAbnVtU2VsZWN0aW9ucygpXG4gICAgICAgICAgICBAdGV4dE9mU2VsZWN0aW9uKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRleHRJblJhbmdlcyBAcmFuZ2VzRm9yQ3Vyc29yTGluZXMoKVxuXG4gICAgc3BsaXRTdGF0ZUxpbmVBdFBvczogKHN0YXRlLCBwb3MpIC0+XG5cbiAgICAgICAgbCA9IHN0YXRlLmxpbmUgcG9zWzFdXG4gICAgICAgIGtlcnJvciBcIm5vIGxpbmUgYXQgcG9zICN7cG9zfT9cIiBpZiBub3QgbD9cbiAgICAgICAgcmV0dXJuIFsnJywnJ10gaWYgbm90IGw/XG4gICAgICAgIFtsLnNsaWNlKDAsIHBvc1swXSksIGwuc2xpY2UocG9zWzBdKV1cblxuICAgICMgMDAwMDAwMDAgIDAwICAgICAwMCAgMDAwICAwMDAwMDAwMDAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwXG5cbiAgICBlbWl0RWRpdDogKGFjdGlvbikgLT5cblxuICAgICAgICBtYyA9IEBtYWluQ3Vyc29yKClcbiAgICAgICAgbGluZSA9IEBsaW5lIG1jWzFdXG5cbiAgICAgICAgQGVtaXQgJ2VkaXQnLFxuICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb25cbiAgICAgICAgICAgIGxpbmU6ICAgbGluZVxuICAgICAgICAgICAgYmVmb3JlOiBsaW5lLnNsaWNlIDAsIG1jWzBdXG4gICAgICAgICAgICBhZnRlcjogIGxpbmUuc2xpY2UgbWNbMF1cbiAgICAgICAgICAgIGN1cnNvcjogbWNcblxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwXG5cbiAgICBpbmRlbnRTdHJpbmdGb3JMaW5lQXRJbmRleDogKGxpKSAtPlxuXG4gICAgICAgIHdoaWxlIGVtcHR5KEBsaW5lKGxpKS50cmltKCkpIGFuZCBsaSA+IDBcbiAgICAgICAgICAgIGxpLS1cblxuICAgICAgICBpZiAwIDw9IGxpIDwgQG51bUxpbmVzKClcblxuICAgICAgICAgICAgaWwgPSAwXG4gICAgICAgICAgICBsaW5lID0gQGxpbmUgbGlcbiAgICAgICAgICAgIHRoaXNJbmRlbnQgICA9IEBpbmRlbnRhdGlvbkF0TGluZUluZGV4IGxpXG4gICAgICAgICAgICBpbmRlbnRMZW5ndGggPSBAaW5kZW50U3RyaW5nLmxlbmd0aFxuXG4gICAgICAgICAgICBpZiBAaW5kZW50TmV3TGluZU1vcmU/XG4gICAgICAgICAgICAgICAgaWYgQGluZGVudE5ld0xpbmVNb3JlLmxpbmVFbmRzV2l0aD8ubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIGZvciBlIGluIEBpbmRlbnROZXdMaW5lTW9yZS5saW5lRW5kc1dpdGhcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGxpbmUudHJpbSgpLmVuZHNXaXRoIGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbCA9IHRoaXNJbmRlbnQgKyBpbmRlbnRMZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIGlmIGlsID09IDBcbiAgICAgICAgICAgICAgICAgICAgaWYgQGluZGVudE5ld0xpbmVNb3JlLmxpbmVSZWdFeHA/IGFuZCBAaW5kZW50TmV3TGluZU1vcmUubGluZVJlZ0V4cC50ZXN0IGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlsID0gdGhpc0luZGVudCArIGluZGVudExlbmd0aFxuXG4gICAgICAgICAgICBpbCA9IHRoaXNJbmRlbnQgaWYgaWwgPT0gMFxuICAgICAgICAgICAgaWwgPSBNYXRoLm1heCBpbCwgQGluZGVudGF0aW9uQXRMaW5lSW5kZXggbGkrMVxuXG4gICAgICAgICAgICBfLnBhZFN0YXJ0IFwiXCIsIGlsXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgICcnXG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yXG4iXX0=
//# sourceURL=../../coffee/editor/editor.coffee