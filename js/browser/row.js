// koffee 1.11.0

/*
00000000    0000000   000   000
000   000  000   000  000 0 000
0000000    000   000  000000000
000   000  000   000  000   000
000   000   0000000   00     00
 */
var $, File, Row, Syntax, _, app, drag, electron, elem, empty, fs, kerror, keyinfo, post, ref, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, keyinfo = ref.keyinfo, empty = ref.empty, slash = ref.slash, elem = ref.elem, drag = ref.drag, app = ref.app, fs = ref.fs, kerror = ref.kerror, $ = ref.$, _ = ref._;

Syntax = require('../editor/syntax');

electron = require('electron');

File = require('../tools/file');

app = electron.remote.app;

Row = (function() {
    function Row(column1, item) {
        var html, ref1, ref2, text;
        this.column = column1;
        this.item = item;
        this.onDragStop = bind(this.onDragStop, this);
        this.onDragMove = bind(this.onDragMove, this);
        this.onDragStart = bind(this.onDragStart, this);
        this.onNameChange = bind(this.onNameChange, this);
        this.onNameFocusOut = bind(this.onNameFocusOut, this);
        this.onNameKeyDown = bind(this.onNameKeyDown, this);
        this.editName = bind(this.editName, this);
        this.activate = bind(this.activate, this);
        this.browser = this.column.browser;
        text = (ref1 = this.item.text) != null ? ref1 : this.item.name;
        if (empty(text) || empty(text.trim())) {
            html = '<span> </span>';
        } else {
            html = Syntax.spanForTextAndSyntax(text, 'browser');
        }
        this.div = elem({
            "class": 'browserRow',
            html: html
        });
        this.div.classList.add(this.item.type);
        this.column.table.appendChild(this.div);
        if (((ref2 = this.item.type) === 'file' || ref2 === 'dir') || this.item.icon) {
            this.setIcon();
        }
        this.drag = new drag({
            target: this.div,
            onStart: this.onDragStart,
            onMove: this.onDragMove,
            onStop: this.onDragStop
        });
    }

    Row.prototype.next = function() {
        return this.index() < this.column.numRows() - 1 && this.column.rows[this.index() + 1] || null;
    };

    Row.prototype.prev = function() {
        return this.index() > 0 && this.column.rows[this.index() - 1] || null;
    };

    Row.prototype.index = function() {
        return this.column.rows.indexOf(this);
    };

    Row.prototype.onMouseOut = function() {
        return this.div.classList.remove('hover');
    };

    Row.prototype.onMouseOver = function() {
        return this.div.classList.add('hover');
    };

    Row.prototype.path = function() {
        var ref1;
        if ((this.item.file != null) && _.isString(this.item.file)) {
            return this.item.file;
        }
        if ((((ref1 = this.item.obj) != null ? ref1.file : void 0) != null) && _.isString(this.item.obj.file)) {
            return this.item.obj.file;
        }
    };

    Row.prototype.setIcon = function() {
        var className, icon;
        if (this.item.icon) {
            className = this.item.icon;
        } else {
            if (this.item.type === 'dir') {
                className = 'folder-icon';
            } else {
                className = File.iconClassName(this.item.file);
            }
        }
        icon = elem('span', {
            "class": className + ' browserFileIcon'
        });
        return this.div.firstChild.insertBefore(icon, this.div.firstChild.firstChild);
    };

    Row.prototype.activate = function(event) {
        var mod, opt, ref1, ref2, ref3;
        if (this.column.index < 0) {
            this.column.activateRow(this);
            return;
        }
        if (event != null) {
            mod = keyinfo.forEvent(event).mod;
            switch (mod) {
                case 'alt':
                case 'command+alt':
                case 'ctrl+alt':
                    if (this.item.type === 'file' && this.item.textFile) {
                        post.toMain('newWindowWithFile', this.item.file);
                        return;
                    }
            }
        }
        if ((ref1 = $('.hover')) != null) {
            ref1.classList.remove('hover');
        }
        this.setActive({
            emit: true
        });
        opt = {
            file: this.item.file
        };
        switch (this.item.type) {
            case 'dir':
            case 'file':
                post.emit('filebrowser', 'activateItem', this.item, this.column.index);
                break;
            default:
                if ((this.item.file != null) && _.isString(this.item.file) && this.item.type !== 'obj') {
                    opt.line = this.item.line;
                    opt.col = this.item.column;
                    post.emit('jumpToFile', opt);
                } else if ((this.column.parent.obj != null) && this.column.parent.type === 'obj') {
                    if (this.item.type === 'obj') {
                        this.browser.loadObjectItem(this.item, {
                            column: this.column.index + 1
                        });
                        this.browser.previewObjectItem(this.item, {
                            column: this.column.index + 2
                        });
                        if ((((ref2 = this.item.obj) != null ? ref2.file : void 0) != null) && _.isString(this.item.obj.file)) {
                            opt.line = this.item.obj.line;
                            opt.col = this.item.obj.column;
                            post.emit('jumpToFile', opt);
                        }
                    }
                } else if ((((ref3 = this.item.obj) != null ? ref3.file : void 0) != null) && _.isString(this.item.obj.file)) {
                    opt = {
                        file: this.item.obj.file,
                        line: this.item.obj.line,
                        col: this.item.obj.column,
                        newTab: opt.newTab
                    };
                    post.emit('jumpToFile', opt);
                } else {
                    this.browser.clearColumnsFrom(this.column.index + 1);
                }
        }
        return this;
    };

    Row.prototype.isActive = function() {
        return this.div.classList.contains('active');
    };

    Row.prototype.setActive = function(opt) {
        var ref1;
        if (opt == null) {
            opt = {};
        }
        if ((ref1 = this.column.activeRow()) != null) {
            ref1.clearActive();
        }
        this.div.classList.add('active');
        if ((opt != null ? opt.scroll : void 0) !== false) {
            this.column.scroll.toIndex(this.index());
        }
        window.setLastFocus(this.column.name());
        if (opt != null ? opt.emit : void 0) {
            this.browser.emit('itemActivated', this.item);
            if (this.item.type === 'dir') {
                post.emit('setCWD', this.item.file);
            } else if (this.item.type === 'file') {
                post.emit('setCWD', slash.dir(this.item.file));
            }
        }
        return this;
    };

    Row.prototype.clearActive = function() {
        this.div.classList.remove('active');
        return this;
    };

    Row.prototype.editName = function() {
        if (this.input != null) {
            return;
        }
        this.input = elem('input', {
            "class": 'rowNameInput'
        });
        this.input.value = slash.file(this.item.file);
        this.div.appendChild(this.input);
        this.input.addEventListener('change', this.onNameChange);
        this.input.addEventListener('keydown', this.onNameKeyDown);
        this.input.addEventListener('focusout', this.onNameFocusOut);
        this.input.focus();
        return this.input.setSelectionRange(0, slash.base(this.item.file).length);
    };

    Row.prototype.onNameKeyDown = function(event) {
        var combo, key, mod, ref1;
        ref1 = keyinfo.forEvent(event), mod = ref1.mod, key = ref1.key, combo = ref1.combo;
        switch (combo) {
            case 'enter':
            case 'esc':
                if (this.input.value === this.file || combo !== 'enter') {
                    this.input.value = this.file;
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    this.onNameFocusOut();
                }
        }
        return event.stopPropagation();
    };

    Row.prototype.removeInput = function() {
        if (this.input == null) {
            return;
        }
        this.input.removeEventListener('focusout', this.onNameFocusOut);
        this.input.removeEventListener('change', this.onNameChange);
        this.input.removeEventListener('keydown', this.onNameKeyDown);
        this.input.remove();
        delete this.input;
        this.input = null;
        if ((document.activeElement == null) || document.activeElement === document.body) {
            return this.column.focus({
                activate: false
            });
        }
    };

    Row.prototype.onNameFocusOut = function(event) {
        return this.removeInput();
    };

    Row.prototype.onNameChange = function(event) {
        var newFile, trimmed, unusedFilename;
        trimmed = this.input.value.trim();
        if (trimmed.length) {
            newFile = slash.join(slash.dir(this.item.file), trimmed);
            unusedFilename = require('unused-filename');
            unusedFilename(newFile).then((function(_this) {
                return function(newFile) {
                    return fs.rename(_this.item.file, newFile, function(err) {
                        if (err) {
                            return kerror('rename failed', err);
                        }
                        return post.emit('loadFile', newFile);
                    });
                };
            })(this));
        }
        return this.removeInput();
    };

    Row.prototype.onDragStart = function(d, e) {
        this.column.focus({
            activate: false
        });
        return this.setActive({
            scroll: false
        });
    };

    Row.prototype.onDragMove = function(d, e) {
        var br;
        if (!this.column.dragDiv) {
            if (Math.abs(d.deltaSum.x) < 20 && Math.abs(d.deltaSum.y) < 10) {
                return;
            }
            this.column.dragDiv = this.div.cloneNode(true);
            br = this.div.getBoundingClientRect();
            this.column.dragDiv.style.position = 'absolute';
            this.column.dragDiv.style.top = br.top + "px";
            this.column.dragDiv.style.left = br.left + "px";
            this.column.dragDiv.style.width = (br.width - 12) + "px";
            this.column.dragDiv.style.height = (br.height - 3) + "px";
            this.column.dragDiv.style.flex = 'unset';
            this.column.dragDiv.style.pointerEvents = 'none';
            document.body.appendChild(this.column.dragDiv);
        }
        return this.column.dragDiv.style.transform = "translateX(" + d.deltaSum.x + "px) translateY(" + d.deltaSum.y + "px)";
    };

    Row.prototype.onDragStop = function(d, e) {
        var column;
        if (this.column.dragDiv != null) {
            this.column.dragDiv.remove();
            delete this.column.dragDiv;
            if (column = this.browser.columnAtPos(d.pos)) {
                return typeof column.dropRow === "function" ? column.dropRow(this, d.pos) : void 0;
            }
        }
    };

    return Row;

})();

module.exports = Row;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm93LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9icm93c2VyIiwic291cmNlcyI6WyJyb3cuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGdHQUFBO0lBQUE7O0FBUUEsTUFBcUUsT0FBQSxDQUFRLEtBQVIsQ0FBckUsRUFBRSxlQUFGLEVBQVEscUJBQVIsRUFBaUIsaUJBQWpCLEVBQXdCLGlCQUF4QixFQUErQixlQUEvQixFQUFxQyxlQUFyQyxFQUEyQyxhQUEzQyxFQUFnRCxXQUFoRCxFQUFvRCxtQkFBcEQsRUFBNEQsU0FBNUQsRUFBK0Q7O0FBRS9ELE1BQUEsR0FBWSxPQUFBLENBQVEsa0JBQVI7O0FBQ1osUUFBQSxHQUFZLE9BQUEsQ0FBUSxVQUFSOztBQUNaLElBQUEsR0FBWSxPQUFBLENBQVEsZUFBUjs7QUFFWixHQUFBLEdBQU0sUUFBUSxDQUFDLE1BQU0sQ0FBQzs7QUFFaEI7SUFFQyxhQUFDLE9BQUQsRUFBVSxJQUFWO0FBRUMsWUFBQTtRQUZBLElBQUMsQ0FBQSxTQUFEO1FBQVMsSUFBQyxDQUFBLE9BQUQ7Ozs7Ozs7OztRQUVULElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQyxDQUFBLE1BQU0sQ0FBQztRQUNuQixJQUFBLDRDQUFvQixJQUFDLENBQUEsSUFBSSxDQUFDO1FBQzFCLElBQUcsS0FBQSxDQUFNLElBQU4sQ0FBQSxJQUFlLEtBQUEsQ0FBTSxJQUFJLENBQUMsSUFBTCxDQUFBLENBQU4sQ0FBbEI7WUFDSSxJQUFBLEdBQU8saUJBRFg7U0FBQSxNQUFBO1lBR0ksSUFBQSxHQUFPLE1BQU0sQ0FBQyxvQkFBUCxDQUE0QixJQUE1QixFQUFrQyxTQUFsQyxFQUhYOztRQUlBLElBQUMsQ0FBQSxHQUFELEdBQU8sSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxZQUFQO1lBQW9CLElBQUEsRUFBTSxJQUExQjtTQUFMO1FBQ1AsSUFBQyxDQUFBLEdBQUcsQ0FBQyxTQUFT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QUFNLENBQUMsT0FBTyxDQUFDLE1BQWhCLENBQUE7WUFDQSxPQUFPLElBQUMsQ0FBQSxNQUFNLENBQUM7WUFFZixJQUFHLE1BQUEsR0FBUyxJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVQsQ0FBcUIsQ0FBQyxDQUFDLEdBQXZCLENBQVo7OERBQ0ksTUFBTSxDQUFDLFFBQVMsTUFBRyxDQUFDLENBQUMsY0FEekI7YUFMSjs7SUFGUTs7Ozs7O0FBVWhCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwXG4jIyNcblxueyBwb3N0LCBrZXlpbmZvLCBlbXB0eSwgc2xhc2gsIGVsZW0sIGRyYWcsIGFwcCwgZnMsIGtlcnJvciwgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5TeW50YXggICAgPSByZXF1aXJlICcuLi9lZGl0b3Ivc3ludGF4J1xuZWxlY3Ryb24gID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5GaWxlICAgICAgPSByZXF1aXJlICcuLi90b29scy9maWxlJ1xuXG5hcHAgPSBlbGVjdHJvbi5yZW1vdGUuYXBwXG5cbmNsYXNzIFJvd1xuICAgIFxuICAgIEA6IChAY29sdW1uLCBAaXRlbSkgLT5cblxuICAgICAgICBAYnJvd3NlciA9IEBjb2x1bW4uYnJvd3NlclxuICAgICAgICB0ZXh0ID0gQGl0ZW0udGV4dCA/IEBpdGVtLm5hbWVcbiAgICAgICAgaWYgZW1wdHkodGV4dCkgb3IgZW1wdHkgdGV4dC50cmltKClcbiAgICAgICAgICAgIGh0bWwgPSAnPHNwYW4+IDwvc3Bhbj4nXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGh0bWwgPSBTeW50YXguc3BhbkZvclRleHRBbmRTeW50YXggdGV4dCwgJ2Jyb3dzZXInXG4gICAgICAgIEBkaXYgPSBlbGVtIGNsYXNzOiAnYnJvd3NlclJvdycgaHRtbDogaHRtbFxuICAgICAgICBAZGl2LmNsYXNzTGlzdC5hZGQgQGl0ZW0udHlwZVxuICAgICAgICBAY29sdW1uLnRhYmxlLmFwcGVuZENoaWxkIEBkaXZcblxuICAgICAgICBpZiBAaXRlbS50eXBlIGluIFsnZmlsZScgJ2RpciddIG9yIEBpdGVtLmljb25cbiAgICAgICAgICAgIEBzZXRJY29uKClcbiAgICAgICAgXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBkaXZcbiAgICAgICAgICAgIG9uU3RhcnQ6IEBvbkRyYWdTdGFydFxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uRHJhZ01vdmVcbiAgICAgICAgICAgIG9uU3RvcDogIEBvbkRyYWdTdG9wXG4gICBcbiAgICBuZXh0OiAgICAgICAgLT4gQGluZGV4KCkgPCBAY29sdW1uLm51bVJvd3MoKS0xIGFuZCBAY29sdW1uLnJvd3NbQGluZGV4KCkrMV0gb3IgbnVsbFxuICAgIHByZXY6ICAgICAgICAtPiBAaW5kZXgoKSA+IDAgYW5kIEBjb2x1bW4ucm93c1tAaW5kZXgoKS0xXSBvciBudWxsXG4gICAgaW5kZXg6ICAgICAgIC0+IEBjb2x1bW4ucm93cy5pbmRleE9mIEAgICAgXG4gICAgb25Nb3VzZU91dDogIC0+IEBkaXYuY2xhc3NMaXN0LnJlbW92ZSAnaG92ZXInXG4gICAgb25Nb3VzZU92ZXI6IC0+IEBkaXYuY2xhc3NMaXN0LmFkZCAnaG92ZXInXG5cbiAgICBwYXRoOiAtPiBcbiAgICAgICAgaWYgQGl0ZW0uZmlsZT8gYW5kIF8uaXNTdHJpbmcgQGl0ZW0uZmlsZVxuICAgICAgICAgICAgcmV0dXJuIEBpdGVtLmZpbGVcbiAgICAgICAgaWYgQGl0ZW0ub2JqPy5maWxlPyBhbmQgXy5pc1N0cmluZyBAaXRlbS5vYmouZmlsZVxuICAgICAgICAgICAgcmV0dXJuIEBpdGVtLm9iai5maWxlXG5cbiAgICBzZXRJY29uOiAtPlxuXG4gICAgICAgIGlmIEBpdGVtLmljb25cbiAgICAgICAgICAgIGNsYXNzTmFtZSA9IEBpdGVtLmljb25cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQGl0ZW0udHlwZSA9PSAnZGlyJ1xuICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA9ICdmb2xkZXItaWNvbidcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBjbGFzc05hbWUgPSBGaWxlLmljb25DbGFzc05hbWUgQGl0ZW0uZmlsZVxuICAgICAgICAgICAgXG4gICAgICAgIGljb24gPSBlbGVtKCdzcGFuJyBjbGFzczpjbGFzc05hbWUgKyAnIGJyb3dzZXJGaWxlSWNvbicpXG4gICAgICAgICAgICBcbiAgICAgICAgQGRpdi5maXJzdENoaWxkLmluc2VydEJlZm9yZSBpY29uLCBAZGl2LmZpcnN0Q2hpbGQuZmlyc3RDaGlsZFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGFjdGl2YXRlOiAoZXZlbnQpID0+XG5cbiAgICAgICAgaWYgQGNvbHVtbi5pbmRleCA8IDAgIyBzaGVsZiBoYW5kbGVzIHJvdyBhY3RpdmF0aW9uXG4gICAgICAgICAgICBAY29sdW1uLmFjdGl2YXRlUm93IEBcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgaWYgZXZlbnQ/XG4gICAgICAgICAgICB7IG1vZCB9ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuICAgICAgICAgICAgc3dpdGNoIG1vZFxuICAgICAgICAgICAgICAgIHdoZW4gJ2FsdCcgJ2NvbW1hbmQrYWx0JyAnY3RybCthbHQnXG4gICAgICAgICAgICAgICAgICAgIGlmIEBpdGVtLnR5cGUgPT0gJ2ZpbGUnIGFuZCBAaXRlbS50ZXh0RmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdC50b01haW4gJ25ld1dpbmRvd1dpdGhGaWxlJyBAaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICAkKCcuaG92ZXInKT8uY2xhc3NMaXN0LnJlbW92ZSAnaG92ZXInXG4gICAgICAgIFxuICAgICAgICBAc2V0QWN0aXZlIGVtaXQ6dHJ1ZVxuICAgICAgICBcbiAgICAgICAgb3B0ID0gZmlsZTpAaXRlbS5maWxlXG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggQGl0ZW0udHlwZVxuICAgICAgICAgICAgd2hlbiAnZGlyJyAnZmlsZScgXG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdmaWxlYnJvd3NlcicgJ2FjdGl2YXRlSXRlbScgQGl0ZW0sIEBjb2x1bW4uaW5kZXhcbiAgICAgICAgICAgIGVsc2UgICAgXG4gICAgICAgICAgICAgICAgaWYgQGl0ZW0uZmlsZT8gYW5kIF8uaXNTdHJpbmcoQGl0ZW0uZmlsZSkgYW5kIEBpdGVtLnR5cGUgIT0gJ29iaidcbiAgICAgICAgICAgICAgICAgICAgb3B0LmxpbmUgPSBAaXRlbS5saW5lXG4gICAgICAgICAgICAgICAgICAgIG9wdC5jb2wgID0gQGl0ZW0uY29sdW1uXG4gICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvRmlsZScgb3B0XG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAY29sdW1uLnBhcmVudC5vYmo/IGFuZCBAY29sdW1uLnBhcmVudC50eXBlID09ICdvYmonXG4gICAgICAgICAgICAgICAgICAgIGlmIEBpdGVtLnR5cGUgPT0gJ29iaidcbiAgICAgICAgICAgICAgICAgICAgICAgIEBicm93c2VyLmxvYWRPYmplY3RJdGVtIEBpdGVtLCBjb2x1bW46QGNvbHVtbi5pbmRleCsxXG4gICAgICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5wcmV2aWV3T2JqZWN0SXRlbSAgQGl0ZW0sIGNvbHVtbjpAY29sdW1uLmluZGV4KzJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIEBpdGVtLm9iaj8uZmlsZT8gYW5kIF8uaXNTdHJpbmcgQGl0ZW0ub2JqLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHQubGluZSA9IEBpdGVtLm9iai5saW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0LmNvbCAgPSBAaXRlbS5vYmouY29sdW1uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG9GaWxlJyBvcHRcbiAgICAgICAgICAgICAgICBlbHNlIGlmIEBpdGVtLm9iaj8uZmlsZT8gYW5kIF8uaXNTdHJpbmcgQGl0ZW0ub2JqLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgb3B0ID0gZmlsZTpAaXRlbS5vYmouZmlsZSwgbGluZTpAaXRlbS5vYmoubGluZSwgY29sOkBpdGVtLm9iai5jb2x1bW4sIG5ld1RhYjpvcHQubmV3VGFiXG4gICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvRmlsZScgb3B0XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5jbGVhckNvbHVtbnNGcm9tIEBjb2x1bW4uaW5kZXgrMVxuICAgICAgICBAXG4gICAgXG4gICAgaXNBY3RpdmU6IC0+IEBkaXYuY2xhc3NMaXN0LmNvbnRhaW5zICdhY3RpdmUnXG4gICAgXG4gICAgc2V0QWN0aXZlOiAob3B0ID0ge30pIC0+XG4gICAgICAgIFxuICAgICAgICBAY29sdW1uLmFjdGl2ZVJvdygpPy5jbGVhckFjdGl2ZSgpXG4gICAgICAgIEBkaXYuY2xhc3NMaXN0LmFkZCAnYWN0aXZlJ1xuICAgICAgICBcbiAgICAgICAgaWYgb3B0Py5zY3JvbGwgIT0gZmFsc2VcbiAgICAgICAgICAgIEBjb2x1bW4uc2Nyb2xsLnRvSW5kZXggQGluZGV4KClcbiAgICAgICAgICAgIFxuICAgICAgICB3aW5kb3cuc2V0TGFzdEZvY3VzIEBjb2x1bW4ubmFtZSgpXG4gICAgICAgIFxuICAgICAgICBpZiBvcHQ/LmVtaXQgXG4gICAgICAgICAgICBAYnJvd3Nlci5lbWl0ICdpdGVtQWN0aXZhdGVkJyBAaXRlbVxuICAgICAgICAgICAgaWYgQGl0ZW0udHlwZSA9PSAnZGlyJ1xuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnc2V0Q1dEJyBAaXRlbS5maWxlXG4gICAgICAgICAgICBlbHNlIGlmIEBpdGVtLnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdzZXRDV0QnIHNsYXNoLmRpciBAaXRlbS5maWxlXG4gICAgICAgIEBcbiAgICAgICAgICAgICAgICBcbiAgICBjbGVhckFjdGl2ZTogLT5cbiAgICAgICAgQGRpdi5jbGFzc0xpc3QucmVtb3ZlICdhY3RpdmUnXG4gICAgICAgIEBcblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgICAgICAgICAgXG4gICAgZWRpdE5hbWU6ID0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgQGlucHV0PyBcbiAgICAgICAgQGlucHV0ID0gZWxlbSAnaW5wdXQnIGNsYXNzOiAncm93TmFtZUlucHV0J1xuICAgICAgICBAaW5wdXQudmFsdWUgPSBzbGFzaC5maWxlIEBpdGVtLmZpbGVcbiAgICAgICAgXG4gICAgICAgIEBkaXYuYXBwZW5kQ2hpbGQgQGlucHV0XG4gICAgICAgIEBpbnB1dC5hZGRFdmVudExpc3RlbmVyICdjaGFuZ2UnICAgQG9uTmFtZUNoYW5nZVxuICAgICAgICBAaW5wdXQuYWRkRXZlbnRMaXN0ZW5lciAna2V5ZG93bicgIEBvbk5hbWVLZXlEb3duXG4gICAgICAgIEBpbnB1dC5hZGRFdmVudExpc3RlbmVyICdmb2N1c291dCcgQG9uTmFtZUZvY3VzT3V0XG4gICAgICAgIEBpbnB1dC5mb2N1cygpXG4gICAgICAgIFxuICAgICAgICBAaW5wdXQuc2V0U2VsZWN0aW9uUmFuZ2UgMCwgc2xhc2guYmFzZShAaXRlbS5maWxlKS5sZW5ndGhcblxuICAgIG9uTmFtZUtleURvd246IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIHttb2QsIGtleSwgY29tYm99ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJyAnZXNjJ1xuICAgICAgICAgICAgICAgIGlmIEBpbnB1dC52YWx1ZSA9PSBAZmlsZSBvciBjb21ibyAhPSAnZW50ZXInXG4gICAgICAgICAgICAgICAgICAgIEBpbnB1dC52YWx1ZSA9IEBmaWxlXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgQG9uTmFtZUZvY3VzT3V0KClcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgXG4gICAgcmVtb3ZlSW5wdXQ6IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBpbnB1dD9cbiAgICAgICAgQGlucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2ZvY3Vzb3V0JyBAb25OYW1lRm9jdXNPdXRcbiAgICAgICAgQGlucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2NoYW5nZScgICBAb25OYW1lQ2hhbmdlXG4gICAgICAgIEBpbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyICdrZXlkb3duJyAgQG9uTmFtZUtleURvd25cbiAgICAgICAgQGlucHV0LnJlbW92ZSgpXG4gICAgICAgIGRlbGV0ZSBAaW5wdXRcbiAgICAgICAgQGlucHV0ID0gbnVsbFxuICAgICAgICBpZiBub3QgZG9jdW1lbnQuYWN0aXZlRWxlbWVudD8gb3IgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PSBkb2N1bWVudC5ib2R5XG4gICAgICAgICAgICBAY29sdW1uLmZvY3VzIGFjdGl2YXRlOmZhbHNlXG4gICAgXG4gICAgb25OYW1lRm9jdXNPdXQ6IChldmVudCkgPT4gQHJlbW92ZUlucHV0KClcbiAgICBcbiAgICBvbk5hbWVDaGFuZ2U6IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIHRyaW1tZWQgPSBAaW5wdXQudmFsdWUudHJpbSgpXG4gICAgICAgIGlmIHRyaW1tZWQubGVuZ3RoXG4gICAgICAgICAgICBuZXdGaWxlID0gc2xhc2guam9pbiBzbGFzaC5kaXIoQGl0ZW0uZmlsZSksIHRyaW1tZWRcbiAgICAgICAgICAgIHVudXNlZEZpbGVuYW1lID0gcmVxdWlyZSAndW51c2VkLWZpbGVuYW1lJ1xuICAgICAgICAgICAgdW51c2VkRmlsZW5hbWUobmV3RmlsZSkudGhlbiAobmV3RmlsZSkgPT5cbiAgICAgICAgICAgICAgICBmcy5yZW5hbWUgQGl0ZW0uZmlsZSwgbmV3RmlsZSwgKGVycikgPT5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAncmVuYW1lIGZhaWxlZCcgZXJyIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJyBuZXdGaWxlXG4gICAgICAgIEByZW1vdmVJbnB1dCgpXG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgb25EcmFnU3RhcnQ6IChkLCBlKSA9PlxuICAgICAgICBcbiAgICAgICAgQGNvbHVtbi5mb2N1cyBhY3RpdmF0ZTpmYWxzZVxuICAgICAgICBAc2V0QWN0aXZlIHNjcm9sbDpmYWxzZVxuXG4gICAgb25EcmFnTW92ZTogKGQsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAY29sdW1uLmRyYWdEaXZcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGlmIE1hdGguYWJzKGQuZGVsdGFTdW0ueCkgPCAyMCBhbmQgTWF0aC5hYnMoZC5kZWx0YVN1bS55KSA8IDEwXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0RpdiA9IEBkaXYuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgICAgIGJyID0gQGRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgICAgQGNvbHVtbi5kcmFnRGl2LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xuICAgICAgICAgICAgQGNvbHVtbi5kcmFnRGl2LnN0eWxlLnRvcCAgPSBcIiN7YnIudG9wfXB4XCJcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS5sZWZ0ID0gXCIje2JyLmxlZnR9cHhcIlxuICAgICAgICAgICAgQGNvbHVtbi5kcmFnRGl2LnN0eWxlLndpZHRoID0gXCIje2JyLndpZHRoLTEyfXB4XCJcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS5oZWlnaHQgPSBcIiN7YnIuaGVpZ2h0LTN9cHhcIlxuICAgICAgICAgICAgQGNvbHVtbi5kcmFnRGl2LnN0eWxlLmZsZXggPSAndW5zZXQnXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJ1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCBAY29sdW1uLmRyYWdEaXZcbiAgICAgICAgXG4gICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZVgoI3tkLmRlbHRhU3VtLnh9cHgpIHRyYW5zbGF0ZVkoI3tkLmRlbHRhU3VtLnl9cHgpXCJcblxuICAgIG9uRHJhZ1N0b3A6IChkLGUpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAY29sdW1uLmRyYWdEaXY/XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5yZW1vdmUoKVxuICAgICAgICAgICAgZGVsZXRlIEBjb2x1bW4uZHJhZ0RpdlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBjb2x1bW4gPSBAYnJvd3Nlci5jb2x1bW5BdFBvcyBkLnBvc1xuICAgICAgICAgICAgICAgIGNvbHVtbi5kcm9wUm93PyBALCBkLnBvc1xuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gUm93XG4iXX0=
//# sourceURL=../../coffee/browser/row.coffee