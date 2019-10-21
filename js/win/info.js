// koffee 1.4.0

/*
000  000   000  00000000   0000000 
000  0000  000  000       000   000
000  000 0 000  000000    000   000
000  000  0000  000       000   000
000  000   000  000        0000000
 */
var $, Info, _, elem, post, ref, shortCount, tooltip,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), shortCount = ref.shortCount, tooltip = ref.tooltip, post = ref.post, elem = ref.elem, $ = ref.$, _ = ref._;

Info = (function() {
    function Info(editor) {
        this.onHighlight = bind(this.onHighlight, this);
        this.onSelection = bind(this.onSelection, this);
        this.onCursor = bind(this.onCursor, this);
        this.onFilesCount = bind(this.onFilesCount, this);
        this.onFuncsCount = bind(this.onFuncsCount, this);
        this.onClassesCount = bind(this.onClassesCount, this);
        this.onWordCount = bind(this.onWordCount, this);
        this.onNumLines = bind(this.onNumLines, this);
        this.reload = bind(this.reload, this);
        this.setEditor = bind(this.setEditor, this);
        var ttip;
        post.on('editorFocus', this.setEditor);
        ttip = function(e, t) {
            return new tooltip({
                elem: e,
                text: t,
                x: 0,
                y: 1,
                textSize: 11,
                keep: true
            });
        };
        this.elem = $('info');
        this.topline = elem({
            "class": "info-line top"
        });
        this.cursorColumn = elem('span', {
            "class": "info-cursor-column"
        });
        this.cursorColumn.onclick = (function(_this) {
            return function() {
                return _this.editor.focus() + _this.editor.singleCursorAtPos([0, _this.editor.cursorPos()[1]]);
            };
        })(this);
        this.topline.appendChild(this.cursorColumn);
        ttip(this.cursorColumn, 'x');
        this.sticky = elem('span', {
            "class": "info-sticky empty"
        });
        this.sticky.innerHTML = '○';
        this.topline.appendChild(this.sticky);
        this.cursors = elem('span', {
            "class": "info-cursors"
        });
        this.cursors.onclick = (function(_this) {
            return function() {
                return _this.editor.focus() + _this.editor.clearCursors();
            };
        })(this);
        this.topline.appendChild(this.cursors);
        ttip(this.cursors, 'cursors');
        this.selecti = elem('span', {
            "class": "info-selections"
        });
        this.selecti.onclick = (function(_this) {
            return function() {
                return _this.editor.focus() + _this.editor.selectNone();
            };
        })(this);
        this.topline.appendChild(this.selecti);
        ttip(this.selecti, 'selections');
        this.highlig = elem('span', {
            "class": "info-highlights"
        });
        this.highlig.onclick = (function(_this) {
            return function() {
                return _this.editor.focus() + _this.editor.clearHighlights();
            };
        })(this);
        this.topline.appendChild(this.highlig);
        ttip(this.highlig, 'highlights');
        this.classes = elem('span', {
            "class": "info-classes empty"
        });
        this.topline.appendChild(this.classes);
        ttip(this.classes, 'classes');
        this.funcs = elem('span', {
            "class": "info-funcs empty"
        });
        this.topline.appendChild(this.funcs);
        ttip(this.funcs, 'funcs');
        post.on('classesCount', (function(_this) {
            return function(count) {
                return _this.onClassesCount(count);
            };
        })(this));
        post.on('funcsCount', (function(_this) {
            return function(count) {
                return _this.onFuncsCount(count);
            };
        })(this));
        this.elem.appendChild(this.topline);
        this.botline = elem({
            "class": "info-line bot"
        });
        this.cursorLine = elem('span', {
            "class": "info-cursor-line"
        });
        this.cursorLine.onclick = (function(_this) {
            return function() {
                return _this.editor.focus() + _this.editor.singleCursorAtPos([0, 0]);
            };
        })(this);
        this.botline.appendChild(this.cursorLine);
        ttip(this.cursorLine, 'y');
        this.lines = elem('span', {
            "class": "info-lines"
        });
        this.lines.onclick = (function(_this) {
            return function() {
                return _this.editor.focus() + _this.editor.singleCursorAtPos([0, _this.editor.numLines()]);
            };
        })(this);
        this.botline.appendChild(this.lines);
        ttip(this.lines, 'lines');
        this.files = elem('span', {
            "class": "info-files"
        });
        this.botline.appendChild(this.files);
        ttip(this.files, 'files');
        this.words = elem('span', {
            "class": "info-words empty"
        });
        this.words.style.display = 'none';
        this.botline.appendChild(this.words);
        ttip(this.words, 'words');
        post.on('filesCount', this.onFilesCount);
        this.elem.appendChild(this.botline);
        this.setEditor(editor);
    }

    Info.prototype.setEditor = function(editor) {
        if (editor === this.editor) {
            return;
        }
        if (this.editor != null) {
            this.editor.removeListener('numLines', this.onNumLines);
            this.editor.removeListener('lineInserted', this.onNumLines);
            this.editor.removeListener('lineDeleted', this.onNumLines);
            this.editor.removeListener('selection', this.onSelection);
            this.editor.removeListener('highlight', this.onHighlight);
            this.editor.removeListener('cursor', this.onCursor);
        }
        this.editor = editor;
        this.editor.on('numLines', this.onNumLines);
        this.editor.on('lineInserted', this.onNumLines);
        this.editor.on('lineDeleted', this.onNumLines);
        this.editor.on('selection', this.onSelection);
        this.editor.on('highlight', this.onHighlight);
        this.editor.on('cursor', this.onCursor);
        return this.onNumLines(this.editor.numLines());
    };

    Info.prototype.reload = function() {
        var counts;
        counts = post.get('indexer', 'counts');
        this.onClassesCount(counts.classes);
        this.onFuncsCount(counts.funcs);
        this.onFilesCount(counts.files);
        return this.onWordCount(counts.words);
    };

    Info.prototype.onNumLines = function(lc) {
        return this.lines.textContent = shortCount(lc != null ? lc : 0);
    };

    Info.prototype.onWordCount = function(wc) {
        this.words.textContent = shortCount(wc);
        return this.words.classList.toggle('empty', wc === 0);
    };

    Info.prototype.onClassesCount = function(cc) {
        this.classes.textContent = shortCount(cc);
        return this.classes.classList.toggle('empty', cc === 0);
    };

    Info.prototype.onFuncsCount = function(fc) {
        this.funcs.textContent = shortCount(fc);
        return this.funcs.classList.toggle('empty', fc === 0);
    };

    Info.prototype.onFilesCount = function(fc) {
        this.files.textContent = shortCount(fc);
        return this.files.classList.toggle('empty', fc === 0);
    };

    Info.prototype.onCursor = function() {
        this.cursorLine.textContent = this.editor.mainCursor()[1] + 1;
        this.cursorColumn.textContent = this.editor.mainCursor()[0];
        this.cursors.textContent = this.editor.numCursors();
        this.cursorColumn.classList.toggle('virtual', this.editor.isCursorVirtual());
        this.cursors.classList.toggle('empty', this.editor.numCursors() === 1);
        return this.sticky.classList.toggle('empty', !this.editor.stickySelection);
    };

    Info.prototype.onSelection = function() {
        this.selecti.textContent = this.editor.numSelections();
        this.selecti.classList.toggle('empty', this.editor.numSelections() === 0);
        return this.sticky.classList.toggle('empty', !this.editor.stickySelection);
    };

    Info.prototype.onHighlight = function() {
        this.highlig.textContent = this.editor.numHighlights();
        return this.highlig.classList.toggle('empty', this.editor.numHighlights() === 0);
    };

    return Info;

})();

module.exports = Info;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mby5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsZ0RBQUE7SUFBQTs7QUFRQSxNQUE0QyxPQUFBLENBQVEsS0FBUixDQUE1QyxFQUFFLDJCQUFGLEVBQWMscUJBQWQsRUFBdUIsZUFBdkIsRUFBNkIsZUFBN0IsRUFBbUMsU0FBbkMsRUFBc0M7O0FBRWhDO0lBRVcsY0FBQyxNQUFEOzs7Ozs7Ozs7OztBQUVULFlBQUE7UUFBQSxJQUFJLENBQUMsRUFBTCxDQUFRLGFBQVIsRUFBdUIsSUFBQyxDQUFBLFNBQXhCO1FBRUEsSUFBQSxHQUFPLFNBQUMsQ0FBRCxFQUFHLENBQUg7bUJBQVMsSUFBSSxPQUFKLENBQVk7Z0JBQUEsSUFBQSxFQUFLLENBQUw7Z0JBQVEsSUFBQSxFQUFLLENBQWI7Z0JBQWdCLENBQUEsRUFBRSxDQUFsQjtnQkFBcUIsQ0FBQSxFQUFFLENBQXZCO2dCQUEwQixRQUFBLEVBQVUsRUFBcEM7Z0JBQXdDLElBQUEsRUFBSyxJQUE3QzthQUFaO1FBQVQ7UUFFUCxJQUFDLENBQUEsSUFBRCxHQUFPLENBQUEsQ0FBRSxNQUFGO1FBUVAsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGVBQVA7U0FBTDtRQUVYLElBQUMsQ0FBQSxZQUFELEdBQWdCLElBQUEsQ0FBSyxNQUFMLEVBQWE7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG9CQUFQO1NBQWI7UUFDaEIsSUFBQyxDQUFBLFlBQVksQ0FBQyxPQUFkLEdBQXdCLENBQUEsU0FBQSxLQUFBO21CQUFBLFNBQUE7dUJBQUcsS0FBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLENBQUEsQ0FBQSxHQUFrQixLQUFDLENBQUEsTUFBTSxDQUFDLGlCQUFSLENBQTBCLENBQUMsQ0FBRCxFQUFJLEtBQUMsQ0FBQSxNQUFNLENBQUMsU0FBUixDQUFBLENBQW9CLENBQUEsQ0FBQSxDQUF4QixDQUExQjtZQUFyQjtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUE7UUFDeEIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxXQUFULENBQXFCLElBQUMsQ0FBQSxZQUF0QjtRQUNBLElBQUEsQ0FBSyxJQUFDLENBQUEsWUFBTixFQUFvQixHQUFwQjtRQUVBLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBQSxDQUFLLE1BQUwsRUFBYTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sbUJBQVA7U0FBYjtRQUNWLElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBUixHQUFvQjtRQUNwQixJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVQsQ0FBcUIsSUFBQyxDQUFBLE1BQXRCO1FBRUEsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFBLENBQUssTUFBTCxFQUFhO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFQO1NBQWI7UUFDWCxJQUFDLENBQUEsT0FBTyxDQUFDLE9BQVQsR0FBbUIsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQTt1QkFBRyxLQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsQ0FBQSxDQUFBLEdBQWtCLEtBQUMsQ0FBQSxNQUFNLENBQUMsWUFBUixDQUFBO1lBQXJCO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtRQUNuQixJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVQsQ0FBcUIsSUFBQyxDQUFBLE9BQXRCO1FBQ0EsSUFBQSxDQUFLLElBQUMsQ0FBQSxPQUFOLEVBQWUsU0FBZjtRQUVBLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQSxDQUFLLE1BQUwsRUFBYTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8saUJBQVA7U0FBYjtRQUNYLElBQUMsQ0FBQSxPQUFPLENBQUMsT0FBVCxHQUFtQixDQUFBLFNBQUEsS0FBQTttQkFBQSxTQUFBO3VCQUFHLEtBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixDQUFBLENBQUEsR0FBa0IsS0FBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLENBQUE7WUFBckI7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO1FBQ25CLElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVCxDQUFxQixJQUFDLENBQUEsT0FBdEI7UUFDQSxJQUFBLENBQUssSUFBQyxDQUFBLE9BQU4sRUFBZSxZQUFmO1FBRUEsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFBLENBQUssTUFBTCxFQUFhO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxpQkFBUDtTQUFiO1FBQ1gsSUFBQyxDQUFBLE9BQU8sQ0FBQyxPQUFULEdBQW1CLENBQUEsU0FBQSxLQUFBO21CQUFBLFNBQUE7dUJBQUcsS0FBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLENBQUEsQ0FBQSxHQUFrQixLQUFDLENBQUEsTUFBTSxDQUFDLGVBQVIsQ0FBQTtZQUFyQjtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUE7UUFDbkIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxXQUFULENBQXFCLElBQUMsQ0FBQSxPQUF0QjtRQUNBLElBQUEsQ0FBSyxJQUFDLENBQUEsT0FBTixFQUFlLFlBQWY7UUFFQSxJQUFDLENBQUEsT0FBRCxHQUFXLElBQUEsQ0FBSyxNQUFMLEVBQWE7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG9CQUFQO1NBQWI7UUFDWCxJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVQsQ0FBcUIsSUFBQyxDQUFBLE9BQXRCO1FBQ0EsSUFBQSxDQUFLLElBQUMsQ0FBQSxPQUFOLEVBQWUsU0FBZjtRQUVBLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBQSxDQUFLLE1BQUwsRUFBYTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sa0JBQVA7U0FBYjtRQUNULElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVCxDQUFxQixJQUFDLENBQUEsS0FBdEI7UUFDQSxJQUFBLENBQUssSUFBQyxDQUFBLEtBQU4sRUFBYSxPQUFiO1FBRUEsSUFBSSxDQUFDLEVBQUwsQ0FBUSxjQUFSLEVBQXdCLENBQUEsU0FBQSxLQUFBO21CQUFBLFNBQUMsS0FBRDt1QkFBVyxLQUFDLENBQUEsY0FBRCxDQUFnQixLQUFoQjtZQUFYO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF4QjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsWUFBUixFQUFzQixDQUFBLFNBQUEsS0FBQTttQkFBQSxTQUFDLEtBQUQ7dUJBQVcsS0FBQyxDQUFBLFlBQUQsQ0FBYyxLQUFkO1lBQVg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXRCO1FBRUEsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLENBQWtCLElBQUMsQ0FBQSxPQUFuQjtRQVFBLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxlQUFQO1NBQUw7UUFFWCxJQUFDLENBQUEsVUFBRCxHQUFjLElBQUEsQ0FBSyxNQUFMLEVBQWE7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGtCQUFQO1NBQWI7UUFDZCxJQUFDLENBQUEsVUFBVSxDQUFDLE9BQVosR0FBc0IsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQTt1QkFBRyxLQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsQ0FBQSxDQUFBLEdBQWtCLEtBQUMsQ0FBQSxNQUFNLENBQUMsaUJBQVIsQ0FBMEIsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUExQjtZQUFyQjtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUE7UUFDdEIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxXQUFULENBQXFCLElBQUMsQ0FBQSxVQUF0QjtRQUNBLElBQUEsQ0FBSyxJQUFDLENBQUEsVUFBTixFQUFrQixHQUFsQjtRQUVBLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBQSxDQUFLLE1BQUwsRUFBYTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sWUFBUDtTQUFiO1FBQ1QsSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFQLEdBQWlCLENBQUEsU0FBQSxLQUFBO21CQUFBLFNBQUE7dUJBQUcsS0FBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLENBQUEsQ0FBQSxHQUFrQixLQUFDLENBQUEsTUFBTSxDQUFDLGlCQUFSLENBQTBCLENBQUMsQ0FBRCxFQUFJLEtBQUMsQ0FBQSxNQUFNLENBQUMsUUFBUixDQUFBLENBQUosQ0FBMUI7WUFBckI7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO1FBQ2pCLElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVCxDQUFxQixJQUFDLENBQUEsS0FBdEI7UUFDQSxJQUFBLENBQUssSUFBQyxDQUFBLEtBQU4sRUFBYSxPQUFiO1FBRUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFBLENBQUssTUFBTCxFQUFhO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxZQUFQO1NBQWI7UUFDVCxJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVQsQ0FBcUIsSUFBQyxDQUFBLEtBQXRCO1FBQ0EsSUFBQSxDQUFLLElBQUMsQ0FBQSxLQUFOLEVBQWEsT0FBYjtRQUVBLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBQSxDQUFLLE1BQUwsRUFBYTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sa0JBQVA7U0FBYjtRQUNULElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQWIsR0FBdUI7UUFDdkIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxXQUFULENBQXFCLElBQUMsQ0FBQSxLQUF0QjtRQUNBLElBQUEsQ0FBSyxJQUFDLENBQUEsS0FBTixFQUFhLE9BQWI7UUFFQSxJQUFJLENBQUMsRUFBTCxDQUFRLFlBQVIsRUFBc0IsSUFBQyxDQUFBLFlBQXZCO1FBRUEsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLENBQWtCLElBQUMsQ0FBQSxPQUFuQjtRQUVBLElBQUMsQ0FBQSxTQUFELENBQVcsTUFBWDtJQXBGUzs7bUJBNEZiLFNBQUEsR0FBVyxTQUFDLE1BQUQ7UUFFUCxJQUFVLE1BQUEsS0FBVSxJQUFDLENBQUEsTUFBckI7QUFBQSxtQkFBQTs7UUFFQSxJQUFHLG1CQUFIO1lBQ0ksSUFBQyxDQUFBLE1BQU0sQ0FBQyxjQUFSLENBQXVCLFVBQXZCLEVBQXVDLElBQUMsQ0FBQSxVQUF4QztZQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUF1QixjQUF2QixFQUF1QyxJQUFDLENBQUEsVUFBeEM7WUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLGNBQVIsQ0FBdUIsYUFBdkIsRUFBdUMsSUFBQyxDQUFBLFVBQXhDO1lBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxjQUFSLENBQXVCLFdBQXZCLEVBQXVDLElBQUMsQ0FBQSxXQUF4QztZQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUF1QixXQUF2QixFQUF1QyxJQUFDLENBQUEsV0FBeEM7WUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLGNBQVIsQ0FBdUIsUUFBdkIsRUFBdUMsSUFBQyxDQUFBLFFBQXhDLEVBTko7O1FBUUEsSUFBQyxDQUFBLE1BQUQsR0FBVTtRQUVWLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFVBQVgsRUFBMkIsSUFBQyxDQUFBLFVBQTVCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsY0FBWCxFQUEyQixJQUFDLENBQUEsVUFBNUI7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxhQUFYLEVBQTJCLElBQUMsQ0FBQSxVQUE1QjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFdBQVgsRUFBMkIsSUFBQyxDQUFBLFdBQTVCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsV0FBWCxFQUEyQixJQUFDLENBQUEsV0FBNUI7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxRQUFYLEVBQTJCLElBQUMsQ0FBQSxRQUE1QjtlQUVBLElBQUMsQ0FBQSxVQUFELENBQVksSUFBQyxDQUFBLE1BQU0sQ0FBQyxRQUFSLENBQUEsQ0FBWjtJQXJCTzs7bUJBNkJYLE1BQUEsR0FBUSxTQUFBO0FBQ0osWUFBQTtRQUFBLE1BQUEsR0FBUyxJQUFJLENBQUMsR0FBTCxDQUFTLFNBQVQsRUFBb0IsUUFBcEI7UUFDVCxJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFNLENBQUMsT0FBdkI7UUFDQSxJQUFDLENBQUEsWUFBRCxDQUFnQixNQUFNLENBQUMsS0FBdkI7UUFDQSxJQUFDLENBQUEsWUFBRCxDQUFnQixNQUFNLENBQUMsS0FBdkI7ZUFDQSxJQUFDLENBQUEsV0FBRCxDQUFnQixNQUFNLENBQUMsS0FBdkI7SUFMSTs7bUJBYVIsVUFBQSxHQUFZLFNBQUMsRUFBRDtlQUNSLElBQUMsQ0FBQSxLQUFLLENBQUMsV0FBUCxHQUFxQixVQUFBLGNBQVcsS0FBSyxDQUFoQjtJQURiOzttQkFHWixXQUFBLEdBQWEsU0FBQyxFQUFEO1FBQ1QsSUFBQyxDQUFBLEtBQUssQ0FBQyxXQUFQLEdBQXFCLFVBQUEsQ0FBWSxFQUFaO2VBQ3JCLElBQUMsQ0FBQSxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQWpCLENBQXdCLE9BQXhCLEVBQWlDLEVBQUEsS0FBTSxDQUF2QztJQUZTOzttQkFJYixjQUFBLEdBQWdCLFNBQUMsRUFBRDtRQUNaLElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVCxHQUF1QixVQUFBLENBQVksRUFBWjtlQUN2QixJQUFDLENBQUEsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFuQixDQUEwQixPQUExQixFQUFtQyxFQUFBLEtBQU0sQ0FBekM7SUFGWTs7bUJBSWhCLFlBQUEsR0FBYyxTQUFDLEVBQUQ7UUFDVixJQUFDLENBQUEsS0FBSyxDQUFDLFdBQVAsR0FBcUIsVUFBQSxDQUFZLEVBQVo7ZUFDckIsSUFBQyxDQUFBLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBakIsQ0FBd0IsT0FBeEIsRUFBaUMsRUFBQSxLQUFNLENBQXZDO0lBRlU7O21CQUlkLFlBQUEsR0FBYyxTQUFDLEVBQUQ7UUFDVixJQUFDLENBQUEsS0FBSyxDQUFDLFdBQVAsR0FBcUIsVUFBQSxDQUFZLEVBQVo7ZUFDckIsSUFBQyxDQUFBLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBakIsQ0FBd0IsT0FBeEIsRUFBaUMsRUFBQSxLQUFNLENBQXZDO0lBRlU7O21CQUlkLFFBQUEsR0FBVSxTQUFBO1FBQ04sSUFBQyxDQUFBLFVBQVUsQ0FBQyxXQUFaLEdBQTRCLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBUixDQUFBLENBQXFCLENBQUEsQ0FBQSxDQUFyQixHQUF3QjtRQUNwRCxJQUFDLENBQUEsWUFBWSxDQUFDLFdBQWQsR0FBNEIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLENBQUEsQ0FBcUIsQ0FBQSxDQUFBO1FBQ2pELElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVCxHQUE0QixJQUFDLENBQUEsTUFBTSxDQUFDLFVBQVIsQ0FBQTtRQUM1QixJQUFDLENBQUEsWUFBWSxDQUFDLFNBQVMsQ0FBQyxNQUF4QixDQUErQixTQUEvQixFQUEwQyxJQUFDLENBQUEsTUFBTSxDQUFDLGVBQVIsQ0FBQSxDQUExQztRQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQW5CLENBQTBCLE9BQTFCLEVBQW1DLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBUixDQUFBLENBQUEsS0FBd0IsQ0FBM0Q7ZUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFsQixDQUF5QixPQUF6QixFQUFrQyxDQUFJLElBQUMsQ0FBQSxNQUFNLENBQUMsZUFBOUM7SUFOTTs7bUJBUVYsV0FBQSxHQUFhLFNBQUE7UUFDVCxJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVQsR0FBdUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxhQUFSLENBQUE7UUFDdkIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBbkIsQ0FBMEIsT0FBMUIsRUFBbUMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxhQUFSLENBQUEsQ0FBQSxLQUEyQixDQUE5RDtlQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQWxCLENBQXlCLE9BQXpCLEVBQWtDLENBQUksSUFBQyxDQUFBLE1BQU0sQ0FBQyxlQUE5QztJQUhTOzttQkFLYixXQUFBLEdBQWEsU0FBQTtRQUNULElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVCxHQUF1QixJQUFDLENBQUEsTUFBTSxDQUFDLGFBQVIsQ0FBQTtlQUN2QixJQUFDLENBQUEsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFuQixDQUEwQixPQUExQixFQUFtQyxJQUFDLENBQUEsTUFBTSxDQUFDLGFBQVIsQ0FBQSxDQUFBLEtBQTJCLENBQTlEO0lBRlM7Ozs7OztBQUlqQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCBcbjAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAgIDAwMCAwIDAwMCAgMDAwMDAwICAgIDAwMCAgIDAwMFxuMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgXG4jIyNcblxueyBzaG9ydENvdW50LCB0b29sdGlwLCBwb3N0LCBlbGVtLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIEluZm9cbiAgICBcbiAgICBjb25zdHJ1Y3RvcjogKGVkaXRvcikgLT4gICAgICAgICAgICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIHBvc3Qub24gJ2VkaXRvckZvY3VzJywgQHNldEVkaXRvclxuXG4gICAgICAgIHR0aXAgPSAoZSx0KSAtPiBuZXcgdG9vbHRpcCBlbGVtOmUsIHRleHQ6dCwgeDowLCB5OjEsIHRleHRTaXplOiAxMSwga2VlcDp0cnVlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBlbGVtID0kICdpbmZvJyBcbiAgICAgICAgXG4gICAgICAgICMgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwIFxuICAgICAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAgICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgXG4gICAgICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgIFxuICAgICAgICAjICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgICBcbiAgICAgICAgXG4gICAgICAgIEB0b3BsaW5lID0gZWxlbSBjbGFzczogXCJpbmZvLWxpbmUgdG9wXCJcbiAgICAgICAgXG4gICAgICAgIEBjdXJzb3JDb2x1bW4gPSBlbGVtICdzcGFuJywgY2xhc3M6IFwiaW5mby1jdXJzb3ItY29sdW1uXCJcbiAgICAgICAgQGN1cnNvckNvbHVtbi5vbmNsaWNrID0gPT4gQGVkaXRvci5mb2N1cygpICsgQGVkaXRvci5zaW5nbGVDdXJzb3JBdFBvcyBbMCwgQGVkaXRvci5jdXJzb3JQb3MoKVsxXV1cbiAgICAgICAgQHRvcGxpbmUuYXBwZW5kQ2hpbGQgQGN1cnNvckNvbHVtblxuICAgICAgICB0dGlwIEBjdXJzb3JDb2x1bW4sICd4J1xuXG4gICAgICAgIEBzdGlja3kgPSBlbGVtICdzcGFuJywgY2xhc3M6IFwiaW5mby1zdGlja3kgZW1wdHlcIlxuICAgICAgICBAc3RpY2t5LmlubmVySFRNTCA9ICfil4snXG4gICAgICAgIEB0b3BsaW5lLmFwcGVuZENoaWxkIEBzdGlja3lcblxuICAgICAgICBAY3Vyc29ycyA9IGVsZW0gJ3NwYW4nLCBjbGFzczogXCJpbmZvLWN1cnNvcnNcIlxuICAgICAgICBAY3Vyc29ycy5vbmNsaWNrID0gPT4gQGVkaXRvci5mb2N1cygpICsgQGVkaXRvci5jbGVhckN1cnNvcnMoKVxuICAgICAgICBAdG9wbGluZS5hcHBlbmRDaGlsZCBAY3Vyc29yc1xuICAgICAgICB0dGlwIEBjdXJzb3JzLCAnY3Vyc29ycydcbiAgICAgICAgXG4gICAgICAgIEBzZWxlY3RpID0gZWxlbSAnc3BhbicsIGNsYXNzOiBcImluZm8tc2VsZWN0aW9uc1wiXG4gICAgICAgIEBzZWxlY3RpLm9uY2xpY2sgPSA9PiBAZWRpdG9yLmZvY3VzKCkgKyBAZWRpdG9yLnNlbGVjdE5vbmUoKVxuICAgICAgICBAdG9wbGluZS5hcHBlbmRDaGlsZCBAc2VsZWN0aVxuICAgICAgICB0dGlwIEBzZWxlY3RpLCAnc2VsZWN0aW9ucydcblxuICAgICAgICBAaGlnaGxpZyA9IGVsZW0gJ3NwYW4nLCBjbGFzczogXCJpbmZvLWhpZ2hsaWdodHNcIlxuICAgICAgICBAaGlnaGxpZy5vbmNsaWNrID0gPT4gQGVkaXRvci5mb2N1cygpICsgQGVkaXRvci5jbGVhckhpZ2hsaWdodHMoKVxuICAgICAgICBAdG9wbGluZS5hcHBlbmRDaGlsZCBAaGlnaGxpZ1xuICAgICAgICB0dGlwIEBoaWdobGlnLCAnaGlnaGxpZ2h0cydcbiAgICAgICAgXG4gICAgICAgIEBjbGFzc2VzID0gZWxlbSAnc3BhbicsIGNsYXNzOiBcImluZm8tY2xhc3NlcyBlbXB0eVwiXG4gICAgICAgIEB0b3BsaW5lLmFwcGVuZENoaWxkIEBjbGFzc2VzXG4gICAgICAgIHR0aXAgQGNsYXNzZXMsICdjbGFzc2VzJ1xuXG4gICAgICAgIEBmdW5jcyA9IGVsZW0gJ3NwYW4nLCBjbGFzczogXCJpbmZvLWZ1bmNzIGVtcHR5XCJcbiAgICAgICAgQHRvcGxpbmUuYXBwZW5kQ2hpbGQgQGZ1bmNzXG4gICAgICAgIHR0aXAgQGZ1bmNzLCAnZnVuY3MnXG4gICAgICAgIFxuICAgICAgICBwb3N0Lm9uICdjbGFzc2VzQ291bnQnLCAoY291bnQpID0+IEBvbkNsYXNzZXNDb3VudCBjb3VudFxuICAgICAgICBwb3N0Lm9uICdmdW5jc0NvdW50JywgKGNvdW50KSA9PiBAb25GdW5jc0NvdW50IGNvdW50XG5cbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQHRvcGxpbmVcblxuICAgICAgICAjIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAgICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAgICAgIyAwMDAwMDAwICAgICAwMDAwMDAwICAgICAgMDAwICAgXG4gICAgICAgIFxuICAgICAgICBAYm90bGluZSA9IGVsZW0gY2xhc3M6IFwiaW5mby1saW5lIGJvdFwiXG4gICAgICAgIFxuICAgICAgICBAY3Vyc29yTGluZSA9IGVsZW0gJ3NwYW4nLCBjbGFzczogXCJpbmZvLWN1cnNvci1saW5lXCJcbiAgICAgICAgQGN1cnNvckxpbmUub25jbGljayA9ID0+IEBlZGl0b3IuZm9jdXMoKSArIEBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRQb3MgWzAsIDBdXG4gICAgICAgIEBib3RsaW5lLmFwcGVuZENoaWxkIEBjdXJzb3JMaW5lXG4gICAgICAgIHR0aXAgQGN1cnNvckxpbmUsICd5J1xuICAgICAgICBcbiAgICAgICAgQGxpbmVzID0gZWxlbSAnc3BhbicsIGNsYXNzOiBcImluZm8tbGluZXNcIlxuICAgICAgICBAbGluZXMub25jbGljayA9ID0+IEBlZGl0b3IuZm9jdXMoKSArIEBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRQb3MgWzAsIEBlZGl0b3IubnVtTGluZXMoKV1cbiAgICAgICAgQGJvdGxpbmUuYXBwZW5kQ2hpbGQgQGxpbmVzXG4gICAgICAgIHR0aXAgQGxpbmVzLCAnbGluZXMnXG5cbiAgICAgICAgQGZpbGVzID0gZWxlbSAnc3BhbicsIGNsYXNzOiBcImluZm8tZmlsZXNcIlxuICAgICAgICBAYm90bGluZS5hcHBlbmRDaGlsZCBAZmlsZXNcbiAgICAgICAgdHRpcCBAZmlsZXMsICdmaWxlcydcbiAgICAgICAgXG4gICAgICAgIEB3b3JkcyA9IGVsZW0gJ3NwYW4nLCBjbGFzczogXCJpbmZvLXdvcmRzIGVtcHR5XCJcbiAgICAgICAgQHdvcmRzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgQGJvdGxpbmUuYXBwZW5kQ2hpbGQgQHdvcmRzXG4gICAgICAgIHR0aXAgQHdvcmRzLCAnd29yZHMnXG4gICAgICAgIFxuICAgICAgICBwb3N0Lm9uICdmaWxlc0NvdW50JywgQG9uRmlsZXNDb3VudFxuXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEBib3RsaW5lXG4gICAgICAgIFxuICAgICAgICBAc2V0RWRpdG9yIGVkaXRvciAgICAgICAgXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwICAgICAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICBcbiAgICBzZXRFZGl0b3I6IChlZGl0b3IpID0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgZWRpdG9yID09IEBlZGl0b3IgICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIGlmIEBlZGl0b3I/XG4gICAgICAgICAgICBAZWRpdG9yLnJlbW92ZUxpc3RlbmVyICdudW1MaW5lcycsICAgICBAb25OdW1MaW5lc1xuICAgICAgICAgICAgQGVkaXRvci5yZW1vdmVMaXN0ZW5lciAnbGluZUluc2VydGVkJywgQG9uTnVtTGluZXNcbiAgICAgICAgICAgIEBlZGl0b3IucmVtb3ZlTGlzdGVuZXIgJ2xpbmVEZWxldGVkJywgIEBvbk51bUxpbmVzXG4gICAgICAgICAgICBAZWRpdG9yLnJlbW92ZUxpc3RlbmVyICdzZWxlY3Rpb24nLCAgICBAb25TZWxlY3Rpb25cbiAgICAgICAgICAgIEBlZGl0b3IucmVtb3ZlTGlzdGVuZXIgJ2hpZ2hsaWdodCcsICAgIEBvbkhpZ2hsaWdodFxuICAgICAgICAgICAgQGVkaXRvci5yZW1vdmVMaXN0ZW5lciAnY3Vyc29yJywgICAgICAgQG9uQ3Vyc29yXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBlZGl0b3IgPSBlZGl0b3JcbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3Iub24gJ251bUxpbmVzJywgICAgIEBvbk51bUxpbmVzXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVJbnNlcnRlZCcsIEBvbk51bUxpbmVzXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVEZWxldGVkJywgIEBvbk51bUxpbmVzXG4gICAgICAgIEBlZGl0b3Iub24gJ3NlbGVjdGlvbicsICAgIEBvblNlbGVjdGlvblxuICAgICAgICBAZWRpdG9yLm9uICdoaWdobGlnaHQnLCAgICBAb25IaWdobGlnaHRcbiAgICAgICAgQGVkaXRvci5vbiAnY3Vyc29yJywgICAgICAgQG9uQ3Vyc29yXG4gICAgICAgIFxuICAgICAgICBAb25OdW1MaW5lcyBAZWRpdG9yLm51bUxpbmVzKClcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgIFxuICAgIFxuICAgIHJlbG9hZDogPT5cbiAgICAgICAgY291bnRzID0gcG9zdC5nZXQgJ2luZGV4ZXInLCAnY291bnRzJ1xuICAgICAgICBAb25DbGFzc2VzQ291bnQgY291bnRzLmNsYXNzZXNcbiAgICAgICAgQG9uRnVuY3NDb3VudCAgIGNvdW50cy5mdW5jc1xuICAgICAgICBAb25GaWxlc0NvdW50ICAgY291bnRzLmZpbGVzXG4gICAgICAgIEBvbldvcmRDb3VudCAgICBjb3VudHMud29yZHNcblxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAgICAgICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgIDAwMCAgMDAwICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgICAwMDAgIDAwMCAgMDAwXG4gICAgXG4gICAgb25OdW1MaW5lczogKGxjKSA9PiBcbiAgICAgICAgQGxpbmVzLnRleHRDb250ZW50ID0gc2hvcnRDb3VudCBsYyA/IDBcbiAgICAgICAgXG4gICAgb25Xb3JkQ291bnQ6ICh3YykgPT5cbiAgICAgICAgQHdvcmRzLnRleHRDb250ZW50ID0gc2hvcnRDb3VudCAgd2NcbiAgICAgICAgQHdvcmRzLmNsYXNzTGlzdC50b2dnbGUgJ2VtcHR5Jywgd2MgPT0gMFxuXG4gICAgb25DbGFzc2VzQ291bnQ6IChjYykgPT5cbiAgICAgICAgQGNsYXNzZXMudGV4dENvbnRlbnQgPSBzaG9ydENvdW50ICBjY1xuICAgICAgICBAY2xhc3Nlcy5jbGFzc0xpc3QudG9nZ2xlICdlbXB0eScsIGNjID09IDBcblxuICAgIG9uRnVuY3NDb3VudDogKGZjKSA9PlxuICAgICAgICBAZnVuY3MudGV4dENvbnRlbnQgPSBzaG9ydENvdW50ICBmY1xuICAgICAgICBAZnVuY3MuY2xhc3NMaXN0LnRvZ2dsZSAnZW1wdHknLCBmYyA9PSAwXG5cbiAgICBvbkZpbGVzQ291bnQ6IChmYykgPT5cbiAgICAgICAgQGZpbGVzLnRleHRDb250ZW50ID0gc2hvcnRDb3VudCAgZmNcbiAgICAgICAgQGZpbGVzLmNsYXNzTGlzdC50b2dnbGUgJ2VtcHR5JywgZmMgPT0gMFxuICAgIFxuICAgIG9uQ3Vyc29yOiA9PiBcbiAgICAgICAgQGN1cnNvckxpbmUudGV4dENvbnRlbnQgICA9IEBlZGl0b3IubWFpbkN1cnNvcigpWzFdKzFcbiAgICAgICAgQGN1cnNvckNvbHVtbi50ZXh0Q29udGVudCA9IEBlZGl0b3IubWFpbkN1cnNvcigpWzBdXG4gICAgICAgIEBjdXJzb3JzLnRleHRDb250ZW50ICAgICAgPSBAZWRpdG9yLm51bUN1cnNvcnMoKVxuICAgICAgICBAY3Vyc29yQ29sdW1uLmNsYXNzTGlzdC50b2dnbGUgJ3ZpcnR1YWwnLCBAZWRpdG9yLmlzQ3Vyc29yVmlydHVhbCgpXG4gICAgICAgIEBjdXJzb3JzLmNsYXNzTGlzdC50b2dnbGUgJ2VtcHR5JywgQGVkaXRvci5udW1DdXJzb3JzKCkgPT0gMVxuICAgICAgICBAc3RpY2t5LmNsYXNzTGlzdC50b2dnbGUgJ2VtcHR5Jywgbm90IEBlZGl0b3Iuc3RpY2t5U2VsZWN0aW9uXG4gICAgICAgIFxuICAgIG9uU2VsZWN0aW9uOiA9PlxuICAgICAgICBAc2VsZWN0aS50ZXh0Q29udGVudCA9IEBlZGl0b3IubnVtU2VsZWN0aW9ucygpXG4gICAgICAgIEBzZWxlY3RpLmNsYXNzTGlzdC50b2dnbGUgJ2VtcHR5JywgQGVkaXRvci5udW1TZWxlY3Rpb25zKCkgPT0gMFxuICAgICAgICBAc3RpY2t5LmNsYXNzTGlzdC50b2dnbGUgJ2VtcHR5Jywgbm90IEBlZGl0b3Iuc3RpY2t5U2VsZWN0aW9uXG4gICAgICAgIFxuICAgIG9uSGlnaGxpZ2h0OiA9PlxuICAgICAgICBAaGlnaGxpZy50ZXh0Q29udGVudCA9IEBlZGl0b3IubnVtSGlnaGxpZ2h0cygpXG4gICAgICAgIEBoaWdobGlnLmNsYXNzTGlzdC50b2dnbGUgJ2VtcHR5JywgQGVkaXRvci5udW1IaWdobGlnaHRzKCkgPT0gMFxuICAgIFxubW9kdWxlLmV4cG9ydHMgPSBJbmZvXG5cbiJdfQ==
//# sourceURL=../../coffee/win/info.coffee