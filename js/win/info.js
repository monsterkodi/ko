// koffee 1.14.0

/*
000  000   000  00000000   0000000 
000  0000  000  000       000   000
000  000 0 000  000000    000   000
000  000  0000  000       000   000
000  000   000  000        0000000
 */
var $, Info, elem, post, ref, shortCount, tooltip,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), $ = ref.$, elem = ref.elem, post = ref.post, shortCount = ref.shortCount, tooltip = ref.tooltip;

Info = (function() {
    function Info(editor) {
        this.onHighlight = bind(this.onHighlight, this);
        this.onSelection = bind(this.onSelection, this);
        this.onCursor = bind(this.onCursor, this);
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

    Info.prototype.reload = function() {};

    Info.prototype.onNumLines = function(lc) {
        return this.lines.textContent = shortCount(lc != null ? lc : 0);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mby5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvd2luIiwic291cmNlcyI6WyJpbmZvLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSw2Q0FBQTtJQUFBOztBQVFBLE1BQXlDLE9BQUEsQ0FBUSxLQUFSLENBQXpDLEVBQUUsU0FBRixFQUFLLGVBQUwsRUFBVyxlQUFYLEVBQWlCLDJCQUFqQixFQUE2Qjs7QUFFdkI7SUFFQyxjQUFDLE1BQUQ7Ozs7Ozs7QUFFQyxZQUFBO1FBQUEsSUFBSSxDQUFDLEVBQUwsQ0FBUSxhQUFSLEVBQXNCLElBQUMsQ0FBQSxTQUF2QjtRQUVBLElBQUEsR0FBTyxTQUFDLENBQUQsRUFBRyxDQUFIO21CQUFTLElBQUksT0FBSixDQUFZO2dCQUFBLElBQUEsRUFBSyxDQUFMO2dCQUFRLElBQUEsRUFBSyxDQUFiO2dCQUFnQixDQUFBLEVBQUUsQ0FBbEI7Z0JBQXFCLENBQUEsRUFBRSxDQUF2QjtnQkFBMEIsUUFBQSxFQUFVLEVBQXBDO2dCQUF3QyxJQUFBLEVBQUssSUFBN0M7YUFBWjtRQUFUO1FBRVAsSUFBQyxDQUFBLElBQUQsR0FBTyxDQUFBLENBQUUsTUFBRjtRQVFQLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxlQUFQO1NBQUw7UUFFWCxJQUFDLENBQUEsWUFBRCxHQUFnQixJQUFBLENBQUssTUFBTCxFQUFZO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxvQkFBUDtTQUFaO1FBQ2hCLElBQUMsQ0FBQSxZQUFZLENBQUMsT0FBZCxHQUF3QixDQUFBLFNBQUEsS0FBQTttQkFBQSxTQUFBO3VCQUFHLEtBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixDQUFBLENBQUEsR0FBa0IsS0FBQyxDQUFBLE1BQU0sQ0FBQyxpQkFBUixDQUEwQixDQUFDLENBQUQsRUFBSSxLQUFDLENBQUEsTUFBTSxDQUFDLFNBQVIsQ0FBQSxDQUFvQixDQUFBLENBQUEsQ0FBeEIsQ0FBMUI7WUFBckI7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO1FBQ3hCLElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVCxDQUFxQixJQUFDLENBQUEsWUFBdEI7UUFDQSxJQUFBLENBQUssSUFBQyxDQUFBLFlBQU4sRUFBb0IsR0FBcEI7UUFFQSxJQUFDLENBQUEsTUFBRCxHQUFVLElBQUEsQ0FBSyxNQUFMLEVBQVk7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG1CQUFQO1NBQVo7UUFDVixJQUFDLENBQUEsTUFBTSxDQUFDLFNBQVIsR0FBb0I7UUFDcEIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxXQUFULENBQXFCLElBQUMsQ0FBQSxNQUF0QjtRQUVBLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQSxDQUFLLE1BQUwsRUFBWTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sY0FBUDtTQUFaO1FBQ1gsSUFBQyxDQUFBLE9BQU8sQ0FBQyxPQUFULEdBQW1CLENBQUEsU0FBQSxLQUFBO21CQUFBLFNBQUE7dUJBQUcsS0FBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLENBQUEsQ0FBQSxHQUFrQixLQUFDLENBQUEsTUFBTSxDQUFDLFlBQVIsQ0FBQTtZQUFyQjtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUE7UUFDbkIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxXQUFULENBQXFCLElBQUMsQ0FBQSxPQUF0QjtRQUNBLElBQUEsQ0FBSyxJQUFDLENBQUEsT0FBTixFQUFlLFNBQWY7UUFFQSxJQUFDLENBQUEsT0FBRCxHQUFXLElBQUEsQ0FBSyxNQUFMLEVBQVk7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGlCQUFQO1NBQVo7UUFDWCxJQUFDLENBQUEsT0FBTyxDQUFDLE9BQVQsR0FBbUIsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQTt1QkFBRyxLQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsQ0FBQSxDQUFBLEdBQWtCLEtBQUMsQ0FBQSxNQUFNLENBQUMsVUFBUixDQUFBO1lBQXJCO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtRQUNuQixJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVQsQ0FBcUIsSUFBQyxDQUFBLE9BQXRCO1FBQ0EsSUFBQSxDQUFLLElBQUMsQ0FBQSxPQUFOLEVBQWUsWUFBZjtRQUVBLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQSxDQUFLLE1BQUwsRUFBWTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8saUJBQVA7U0FBWjtRQUNYLElBQUMsQ0FBQSxPQUFPLENBQUMsT0FBVCxHQUFtQixDQUFBLFNBQUEsS0FBQTttQkFBQSxTQUFBO3VCQUFHLEtBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixDQUFBLENBQUEsR0FBa0IsS0FBQyxDQUFBLE1BQU0sQ0FBQyxlQUFSLENBQUE7WUFBckI7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO1FBQ25CLElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVCxDQUFxQixJQUFDLENBQUEsT0FBdEI7UUFDQSxJQUFBLENBQUssSUFBQyxDQUFBLE9BQU4sRUFBZSxZQUFmO1FBRUEsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLENBQWtCLElBQUMsQ0FBQSxPQUFuQjtRQVFBLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxlQUFQO1NBQUw7UUFFWCxJQUFDLENBQUEsVUFBRCxHQUFjLElBQUEsQ0FBSyxNQUFMLEVBQVk7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGtCQUFQO1NBQVo7UUFDZCxJQUFDLENBQUEsVUFBVSxDQUFDLE9BQVosR0FBc0IsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQTt1QkFBRyxLQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsQ0FBQSxDQUFBLEdBQWtCLEtBQUMsQ0FBQSxNQUFNLENBQUMsaUJBQVIsQ0FBMEIsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUExQjtZQUFyQjtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUE7UUFDdEIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxXQUFULENBQXFCLElBQUMsQ0FBQSxVQUF0QjtRQUNBLElBQUEsQ0FBSyxJQUFDLENBQUEsVUFBTixFQUFrQixHQUFsQjtRQUVBLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBQSxDQUFLLE1BQUwsRUFBWTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sWUFBUDtTQUFaO1FBQ1QsSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFQLEdBQWlCLENBQUEsU0FBQSxLQUFBO21CQUFBLFNBQUE7dUJBQUcsS0FBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLENBQUEsQ0FBQSxHQUFrQixLQUFDLENBQUEsTUFBTSxDQUFDLGlCQUFSLENBQTBCLENBQUMsQ0FBRCxFQUFJLEtBQUMsQ0FBQSxNQUFNLENBQUMsUUFBUixDQUFBLENBQUosQ0FBMUI7WUFBckI7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO1FBQ2pCLElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVCxDQUFxQixJQUFDLENBQUEsS0FBdEI7UUFDQSxJQUFBLENBQUssSUFBQyxDQUFBLEtBQU4sRUFBYSxPQUFiO1FBRUEsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLENBQWtCLElBQUMsQ0FBQSxPQUFuQjtRQUVBLElBQUMsQ0FBQSxTQUFELENBQVcsTUFBWDtJQTlERDs7bUJBc0VILFNBQUEsR0FBVyxTQUFDLE1BQUQ7UUFFUCxJQUFVLE1BQUEsS0FBVSxJQUFDLENBQUEsTUFBckI7QUFBQSxtQkFBQTs7UUFFQSxJQUFHLG1CQUFIO1lBQ0ksSUFBQyxDQUFBLE1BQU0sQ0FBQyxjQUFSLENBQXVCLFVBQXZCLEVBQXNDLElBQUMsQ0FBQSxVQUF2QztZQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUF1QixjQUF2QixFQUFzQyxJQUFDLENBQUEsVUFBdkM7WUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLGNBQVIsQ0FBdUIsYUFBdkIsRUFBc0MsSUFBQyxDQUFBLFVBQXZDO1lBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxjQUFSLENBQXVCLFdBQXZCLEVBQXNDLElBQUMsQ0FBQSxXQUF2QztZQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUF1QixXQUF2QixFQUFzQyxJQUFDLENBQUEsV0FBdkM7WUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLGNBQVIsQ0FBdUIsUUFBdkIsRUFBc0MsSUFBQyxDQUFBLFFBQXZDLEVBTko7O1FBUUEsSUFBQyxDQUFBLE1BQUQsR0FBVTtRQUVWLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFVBQVgsRUFBMEIsSUFBQyxDQUFBLFVBQTNCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsY0FBWCxFQUEwQixJQUFDLENBQUEsVUFBM0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxhQUFYLEVBQTBCLElBQUMsQ0FBQSxVQUEzQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFdBQVgsRUFBMEIsSUFBQyxDQUFBLFdBQTNCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsV0FBWCxFQUEwQixJQUFDLENBQUEsV0FBM0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxRQUFYLEVBQTBCLElBQUMsQ0FBQSxRQUEzQjtlQUVBLElBQUMsQ0FBQSxVQUFELENBQVksSUFBQyxDQUFBLE1BQU0sQ0FBQyxRQUFSLENBQUEsQ0FBWjtJQXJCTzs7bUJBNkJYLE1BQUEsR0FBUSxTQUFBLEdBQUE7O21CQVFSLFVBQUEsR0FBWSxTQUFDLEVBQUQ7ZUFDUixJQUFDLENBQUEsS0FBSyxDQUFDLFdBQVAsR0FBcUIsVUFBQSxjQUFXLEtBQUssQ0FBaEI7SUFEYjs7bUJBR1osUUFBQSxHQUFVLFNBQUE7UUFDTixJQUFDLENBQUEsVUFBVSxDQUFDLFdBQVosR0FBNEIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLENBQUEsQ0FBcUIsQ0FBQSxDQUFBLENBQXJCLEdBQXdCO1FBQ3BELElBQUMsQ0FBQSxZQUFZLENBQUMsV0FBZCxHQUE0QixJQUFDLENBQUEsTUFBTSxDQUFDLFVBQVIsQ0FBQSxDQUFxQixDQUFBLENBQUE7UUFDakQsSUFBQyxDQUFBLE9BQU8sQ0FBQyxXQUFULEdBQTRCLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBUixDQUFBO1FBQzVCLElBQUMsQ0FBQSxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQXhCLENBQStCLFNBQS9CLEVBQXlDLElBQUMsQ0FBQSxNQUFNLENBQUMsZUFBUixDQUFBLENBQXpDO1FBQ0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBbkIsQ0FBMEIsT0FBMUIsRUFBa0MsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLENBQUEsQ0FBQSxLQUF3QixDQUExRDtlQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQWxCLENBQXlCLE9BQXpCLEVBQWlDLENBQUksSUFBQyxDQUFBLE1BQU0sQ0FBQyxlQUE3QztJQU5NOzttQkFRVixXQUFBLEdBQWEsU0FBQTtRQUNULElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVCxHQUF1QixJQUFDLENBQUEsTUFBTSxDQUFDLGFBQVIsQ0FBQTtRQUN2QixJQUFDLENBQUEsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFuQixDQUEwQixPQUExQixFQUFrQyxJQUFDLENBQUEsTUFBTSxDQUFDLGFBQVIsQ0FBQSxDQUFBLEtBQTJCLENBQTdEO2VBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBbEIsQ0FBeUIsT0FBekIsRUFBaUMsQ0FBSSxJQUFDLENBQUEsTUFBTSxDQUFDLGVBQTdDO0lBSFM7O21CQUtiLFdBQUEsR0FBYSxTQUFBO1FBQ1QsSUFBQyxDQUFBLE9BQU8sQ0FBQyxXQUFULEdBQXVCLElBQUMsQ0FBQSxNQUFNLENBQUMsYUFBUixDQUFBO2VBQ3ZCLElBQUMsQ0FBQSxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQW5CLENBQTBCLE9BQTFCLEVBQWtDLElBQUMsQ0FBQSxNQUFNLENBQUMsYUFBUixDQUFBLENBQUEsS0FBMkIsQ0FBN0Q7SUFGUzs7Ozs7O0FBSWpCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwIFxuMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAgMDAwXG4wMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCBcbiMjI1xuXG57ICQsIGVsZW0sIHBvc3QsIHNob3J0Q291bnQsIHRvb2x0aXAgfSA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgSW5mb1xuICAgIFxuICAgIEA6IChlZGl0b3IpIC0+XG4gICAgICAgIFxuICAgICAgICBwb3N0Lm9uICdlZGl0b3JGb2N1cycgQHNldEVkaXRvclxuXG4gICAgICAgIHR0aXAgPSAoZSx0KSAtPiBuZXcgdG9vbHRpcCBlbGVtOmUsIHRleHQ6dCwgeDowLCB5OjEsIHRleHRTaXplOiAxMSwga2VlcDp0cnVlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBlbGVtID0kICdpbmZvJyBcbiAgICAgICAgXG4gICAgICAgICMgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwIFxuICAgICAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAgICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgXG4gICAgICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgIFxuICAgICAgICAjICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgICBcbiAgICAgICAgXG4gICAgICAgIEB0b3BsaW5lID0gZWxlbSBjbGFzczogXCJpbmZvLWxpbmUgdG9wXCJcbiAgICAgICAgXG4gICAgICAgIEBjdXJzb3JDb2x1bW4gPSBlbGVtICdzcGFuJyBjbGFzczogXCJpbmZvLWN1cnNvci1jb2x1bW5cIlxuICAgICAgICBAY3Vyc29yQ29sdW1uLm9uY2xpY2sgPSA9PiBAZWRpdG9yLmZvY3VzKCkgKyBAZWRpdG9yLnNpbmdsZUN1cnNvckF0UG9zIFswLCBAZWRpdG9yLmN1cnNvclBvcygpWzFdXVxuICAgICAgICBAdG9wbGluZS5hcHBlbmRDaGlsZCBAY3Vyc29yQ29sdW1uXG4gICAgICAgIHR0aXAgQGN1cnNvckNvbHVtbiwgJ3gnXG5cbiAgICAgICAgQHN0aWNreSA9IGVsZW0gJ3NwYW4nIGNsYXNzOiBcImluZm8tc3RpY2t5IGVtcHR5XCJcbiAgICAgICAgQHN0aWNreS5pbm5lckhUTUwgPSAn4peLJ1xuICAgICAgICBAdG9wbGluZS5hcHBlbmRDaGlsZCBAc3RpY2t5XG5cbiAgICAgICAgQGN1cnNvcnMgPSBlbGVtICdzcGFuJyBjbGFzczogXCJpbmZvLWN1cnNvcnNcIlxuICAgICAgICBAY3Vyc29ycy5vbmNsaWNrID0gPT4gQGVkaXRvci5mb2N1cygpICsgQGVkaXRvci5jbGVhckN1cnNvcnMoKVxuICAgICAgICBAdG9wbGluZS5hcHBlbmRDaGlsZCBAY3Vyc29yc1xuICAgICAgICB0dGlwIEBjdXJzb3JzLCAnY3Vyc29ycydcbiAgICAgICAgXG4gICAgICAgIEBzZWxlY3RpID0gZWxlbSAnc3BhbicgY2xhc3M6IFwiaW5mby1zZWxlY3Rpb25zXCJcbiAgICAgICAgQHNlbGVjdGkub25jbGljayA9ID0+IEBlZGl0b3IuZm9jdXMoKSArIEBlZGl0b3Iuc2VsZWN0Tm9uZSgpXG4gICAgICAgIEB0b3BsaW5lLmFwcGVuZENoaWxkIEBzZWxlY3RpXG4gICAgICAgIHR0aXAgQHNlbGVjdGksICdzZWxlY3Rpb25zJ1xuXG4gICAgICAgIEBoaWdobGlnID0gZWxlbSAnc3BhbicgY2xhc3M6IFwiaW5mby1oaWdobGlnaHRzXCJcbiAgICAgICAgQGhpZ2hsaWcub25jbGljayA9ID0+IEBlZGl0b3IuZm9jdXMoKSArIEBlZGl0b3IuY2xlYXJIaWdobGlnaHRzKClcbiAgICAgICAgQHRvcGxpbmUuYXBwZW5kQ2hpbGQgQGhpZ2hsaWdcbiAgICAgICAgdHRpcCBAaGlnaGxpZywgJ2hpZ2hsaWdodHMnXG4gICAgICAgIFxuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBAdG9wbGluZVxuXG4gICAgICAgICMgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAgICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICAgICAjIDAwMDAwMDAgICAgIDAwMDAwMDAgICAgICAwMDAgICBcbiAgICAgICAgXG4gICAgICAgIEBib3RsaW5lID0gZWxlbSBjbGFzczogXCJpbmZvLWxpbmUgYm90XCJcbiAgICAgICAgXG4gICAgICAgIEBjdXJzb3JMaW5lID0gZWxlbSAnc3BhbicgY2xhc3M6IFwiaW5mby1jdXJzb3ItbGluZVwiXG4gICAgICAgIEBjdXJzb3JMaW5lLm9uY2xpY2sgPSA9PiBAZWRpdG9yLmZvY3VzKCkgKyBAZWRpdG9yLnNpbmdsZUN1cnNvckF0UG9zIFswLCAwXVxuICAgICAgICBAYm90bGluZS5hcHBlbmRDaGlsZCBAY3Vyc29yTGluZVxuICAgICAgICB0dGlwIEBjdXJzb3JMaW5lLCAneSdcbiAgICAgICAgXG4gICAgICAgIEBsaW5lcyA9IGVsZW0gJ3NwYW4nIGNsYXNzOiBcImluZm8tbGluZXNcIlxuICAgICAgICBAbGluZXMub25jbGljayA9ID0+IEBlZGl0b3IuZm9jdXMoKSArIEBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRQb3MgWzAsIEBlZGl0b3IubnVtTGluZXMoKV1cbiAgICAgICAgQGJvdGxpbmUuYXBwZW5kQ2hpbGQgQGxpbmVzXG4gICAgICAgIHR0aXAgQGxpbmVzLCAnbGluZXMnXG5cbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQGJvdGxpbmVcbiAgICAgICAgXG4gICAgICAgIEBzZXRFZGl0b3IgZWRpdG9yICAgICAgICBcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgIFxuICAgIHNldEVkaXRvcjogKGVkaXRvcikgPT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBlZGl0b3IgPT0gQGVkaXRvciAgICAgICAgIFxuICAgICAgICBcbiAgICAgICAgaWYgQGVkaXRvcj9cbiAgICAgICAgICAgIEBlZGl0b3IucmVtb3ZlTGlzdGVuZXIgJ251bUxpbmVzJyAgICAgQG9uTnVtTGluZXNcbiAgICAgICAgICAgIEBlZGl0b3IucmVtb3ZlTGlzdGVuZXIgJ2xpbmVJbnNlcnRlZCcgQG9uTnVtTGluZXNcbiAgICAgICAgICAgIEBlZGl0b3IucmVtb3ZlTGlzdGVuZXIgJ2xpbmVEZWxldGVkJyAgQG9uTnVtTGluZXNcbiAgICAgICAgICAgIEBlZGl0b3IucmVtb3ZlTGlzdGVuZXIgJ3NlbGVjdGlvbicgICAgQG9uU2VsZWN0aW9uXG4gICAgICAgICAgICBAZWRpdG9yLnJlbW92ZUxpc3RlbmVyICdoaWdobGlnaHQnICAgIEBvbkhpZ2hsaWdodFxuICAgICAgICAgICAgQGVkaXRvci5yZW1vdmVMaXN0ZW5lciAnY3Vyc29yJyAgICAgICBAb25DdXJzb3JcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQGVkaXRvciA9IGVkaXRvclxuICAgICAgICBcbiAgICAgICAgQGVkaXRvci5vbiAnbnVtTGluZXMnICAgICBAb25OdW1MaW5lc1xuICAgICAgICBAZWRpdG9yLm9uICdsaW5lSW5zZXJ0ZWQnIEBvbk51bUxpbmVzXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVEZWxldGVkJyAgQG9uTnVtTGluZXNcbiAgICAgICAgQGVkaXRvci5vbiAnc2VsZWN0aW9uJyAgICBAb25TZWxlY3Rpb25cbiAgICAgICAgQGVkaXRvci5vbiAnaGlnaGxpZ2h0JyAgICBAb25IaWdobGlnaHRcbiAgICAgICAgQGVkaXRvci5vbiAnY3Vyc29yJyAgICAgICBAb25DdXJzb3JcbiAgICAgICAgXG4gICAgICAgIEBvbk51bUxpbmVzIEBlZGl0b3IubnVtTGluZXMoKVxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgXG4gICAgXG4gICAgcmVsb2FkOiA9PlxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAgMDAwICAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAgIDAwMCAgMDAwICAwMDBcbiAgICBcbiAgICBvbk51bUxpbmVzOiAobGMpID0+IFxuICAgICAgICBAbGluZXMudGV4dENvbnRlbnQgPSBzaG9ydENvdW50IGxjID8gMFxuICAgICAgICAgICAgXG4gICAgb25DdXJzb3I6ID0+IFxuICAgICAgICBAY3Vyc29yTGluZS50ZXh0Q29udGVudCAgID0gQGVkaXRvci5tYWluQ3Vyc29yKClbMV0rMVxuICAgICAgICBAY3Vyc29yQ29sdW1uLnRleHRDb250ZW50ID0gQGVkaXRvci5tYWluQ3Vyc29yKClbMF1cbiAgICAgICAgQGN1cnNvcnMudGV4dENvbnRlbnQgICAgICA9IEBlZGl0b3IubnVtQ3Vyc29ycygpXG4gICAgICAgIEBjdXJzb3JDb2x1bW4uY2xhc3NMaXN0LnRvZ2dsZSAndmlydHVhbCcgQGVkaXRvci5pc0N1cnNvclZpcnR1YWwoKVxuICAgICAgICBAY3Vyc29ycy5jbGFzc0xpc3QudG9nZ2xlICdlbXB0eScgQGVkaXRvci5udW1DdXJzb3JzKCkgPT0gMVxuICAgICAgICBAc3RpY2t5LmNsYXNzTGlzdC50b2dnbGUgJ2VtcHR5JyBub3QgQGVkaXRvci5zdGlja3lTZWxlY3Rpb25cbiAgICAgICAgXG4gICAgb25TZWxlY3Rpb246ID0+XG4gICAgICAgIEBzZWxlY3RpLnRleHRDb250ZW50ID0gQGVkaXRvci5udW1TZWxlY3Rpb25zKClcbiAgICAgICAgQHNlbGVjdGkuY2xhc3NMaXN0LnRvZ2dsZSAnZW1wdHknIEBlZGl0b3IubnVtU2VsZWN0aW9ucygpID09IDBcbiAgICAgICAgQHN0aWNreS5jbGFzc0xpc3QudG9nZ2xlICdlbXB0eScgbm90IEBlZGl0b3Iuc3RpY2t5U2VsZWN0aW9uXG4gICAgICAgIFxuICAgIG9uSGlnaGxpZ2h0OiA9PlxuICAgICAgICBAaGlnaGxpZy50ZXh0Q29udGVudCA9IEBlZGl0b3IubnVtSGlnaGxpZ2h0cygpXG4gICAgICAgIEBoaWdobGlnLmNsYXNzTGlzdC50b2dnbGUgJ2VtcHR5JyBAZWRpdG9yLm51bUhpZ2hsaWdodHMoKSA9PSAwXG4gICAgXG5tb2R1bGUuZXhwb3J0cyA9IEluZm9cblxuIl19
//# sourceURL=../../coffee/win/info.coffee