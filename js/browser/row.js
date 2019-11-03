// koffee 1.4.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm93LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxnR0FBQTtJQUFBOztBQVFBLE1BQXFFLE9BQUEsQ0FBUSxLQUFSLENBQXJFLEVBQUUsZUFBRixFQUFRLHFCQUFSLEVBQWlCLGlCQUFqQixFQUF3QixpQkFBeEIsRUFBK0IsZUFBL0IsRUFBcUMsZUFBckMsRUFBMkMsYUFBM0MsRUFBZ0QsV0FBaEQsRUFBb0QsbUJBQXBELEVBQTRELFNBQTVELEVBQStEOztBQUUvRCxNQUFBLEdBQVksT0FBQSxDQUFRLGtCQUFSOztBQUNaLFFBQUEsR0FBWSxPQUFBLENBQVEsVUFBUjs7QUFDWixJQUFBLEdBQVksT0FBQSxDQUFRLGVBQVI7O0FBRVosR0FBQSxHQUFNLFFBQVEsQ0FBQyxNQUFNLENBQUM7O0FBRWhCO0lBRUMsYUFBQyxPQUFELEVBQVUsSUFBVjtBQUVDLFlBQUE7UUFGQSxJQUFDLENBQUEsU0FBRDtRQUFTLElBQUMsQ0FBQSxPQUFEOzs7Ozs7Ozs7UUFFVCxJQUFDLENBQUEsT0FBRCxHQUFXLElBQUMsQ0FBQSxNQUFNLENBQUM7UUFDbkIsSUFBQSw0Q0FBb0IsSUFBQyxDQUFBLElBQUksQ0FBQztRQUMxQixJQUFHLEtBQUEsQ0FBTSxJQUFOLENBQUEsSUFBZSxLQUFBLENBQU0sSUFBSSxDQUFDLElBQUwsQ0FBQSxDQUFOLENBQWxCO1lBQ0ksSUFBQSxHQUFPLGlCQURYO1NBQUEsTUFBQTtZQUdJLElBQUEsR0FBTyxNQUFNLENBQUMsb0JBQVAsQ0FBNEIsSUFBNUIsRUFBa0MsU0FBbEMsRUFIWDs7UUFJQSxJQUFDLENBQUEsR0FBRCxHQUFPLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sWUFBUDtZQUFvQixJQUFBLEVBQU0sSUFBMUI7U0FBTDtRQUNQLElBQUMsQ0FBQSxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQWYsQ0FBbUIsSUFBQyxDQUFBLElB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O1lBQ0EsT0FBTyxJQUFDLENBQUEsTUFBTSxDQUFDO1lBRWYsSUFBRyxNQUFBLEdBQVMsSUFBQyxDQUFBLE9BQU8sQ0FBQyxXQUFULENBQXFCLENBQUMsQ0FBQyxHQUF2QixDQUFaOzhEQUNJLE1BQU0sQ0FBQyxRQUFTLE1BQUcsQ0FBQyxDQUFDLGNBRHpCO2FBTEo7O0lBRlE7Ozs7OztBQVVoQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMFxuIyMjXG5cbnsgcG9zdCwga2V5aW5mbywgZW1wdHksIHNsYXNoLCBlbGVtLCBkcmFnLCBhcHAsIGZzLCBrZXJyb3IsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuU3ludGF4ICAgID0gcmVxdWlyZSAnLi4vZWRpdG9yL3N5bnRheCdcbmVsZWN0cm9uICA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuRmlsZSAgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvZmlsZSdcblxuYXBwID0gZWxlY3Ryb24ucmVtb3RlLmFwcFxuXG5jbGFzcyBSb3dcbiAgICBcbiAgICBAOiAoQGNvbHVtbiwgQGl0ZW0pIC0+XG5cbiAgICAgICAgQGJyb3dzZXIgPSBAY29sdW1uLmJyb3dzZXJcbiAgICAgICAgdGV4dCA9IEBpdGVtLnRleHQgPyBAaXRlbS5uYW1lXG4gICAgICAgIGlmIGVtcHR5KHRleHQpIG9yIGVtcHR5IHRleHQudHJpbSgpXG4gICAgICAgICAgICBodG1sID0gJzxzcGFuPiA8L3NwYW4+J1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBodG1sID0gU3ludGF4LnNwYW5Gb3JUZXh0QW5kU3ludGF4IHRleHQsICdicm93c2VyJ1xuICAgICAgICBAZGl2ID0gZWxlbSBjbGFzczogJ2Jyb3dzZXJSb3cnIGh0bWw6IGh0bWxcbiAgICAgICAgQGRpdi5jbGFzc0xpc3QuYWRkIEBpdGVtLnR5cGVcbiAgICAgICAgQGNvbHVtbi50YWJsZS5hcHBlbmRDaGlsZCBAZGl2XG5cbiAgICAgICAgaWYgQGl0ZW0udHlwZSBpbiBbJ2ZpbGUnICdkaXInXSBvciBAaXRlbS5pY29uXG4gICAgICAgICAgICBAc2V0SWNvbigpXG4gICAgICAgIFxuICAgICAgICBAZHJhZyA9IG5ldyBkcmFnXG4gICAgICAgICAgICB0YXJnZXQ6ICBAZGl2XG4gICAgICAgICAgICBvblN0YXJ0OiBAb25EcmFnU3RhcnRcbiAgICAgICAgICAgIG9uTW92ZTogIEBvbkRyYWdNb3ZlXG4gICAgICAgICAgICBvblN0b3A6ICBAb25EcmFnU3RvcFxuICAgXG4gICAgbmV4dDogICAgICAgIC0+IEBpbmRleCgpIDwgQGNvbHVtbi5udW1Sb3dzKCktMSBhbmQgQGNvbHVtbi5yb3dzW0BpbmRleCgpKzFdIG9yIG51bGxcbiAgICBwcmV2OiAgICAgICAgLT4gQGluZGV4KCkgPiAwIGFuZCBAY29sdW1uLnJvd3NbQGluZGV4KCktMV0gb3IgbnVsbFxuICAgIGluZGV4OiAgICAgICAtPiBAY29sdW1uLnJvd3MuaW5kZXhPZiBAICAgIFxuICAgIG9uTW91c2VPdXQ6ICAtPiBAZGl2LmNsYXNzTGlzdC5yZW1vdmUgJ2hvdmVyJ1xuICAgIG9uTW91c2VPdmVyOiAtPiBAZGl2LmNsYXNzTGlzdC5hZGQgJ2hvdmVyJ1xuXG4gICAgcGF0aDogLT4gXG4gICAgICAgIGlmIEBpdGVtLmZpbGU/IGFuZCBfLmlzU3RyaW5nIEBpdGVtLmZpbGVcbiAgICAgICAgICAgIHJldHVybiBAaXRlbS5maWxlXG4gICAgICAgIGlmIEBpdGVtLm9iaj8uZmlsZT8gYW5kIF8uaXNTdHJpbmcgQGl0ZW0ub2JqLmZpbGVcbiAgICAgICAgICAgIHJldHVybiBAaXRlbS5vYmouZmlsZVxuXG4gICAgc2V0SWNvbjogLT5cblxuICAgICAgICBpZiBAaXRlbS5pY29uXG4gICAgICAgICAgICBjbGFzc05hbWUgPSBAaXRlbS5pY29uXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIEBpdGVtLnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICBjbGFzc05hbWUgPSAnZm9sZGVyLWljb24nXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lID0gRmlsZS5pY29uQ2xhc3NOYW1lIEBpdGVtLmZpbGVcbiAgICAgICAgICAgIFxuICAgICAgICBpY29uID0gZWxlbSgnc3BhbicgY2xhc3M6Y2xhc3NOYW1lICsgJyBicm93c2VyRmlsZUljb24nKVxuICAgICAgICAgICAgXG4gICAgICAgIEBkaXYuZmlyc3RDaGlsZC5pbnNlcnRCZWZvcmUgaWNvbiwgQGRpdi5maXJzdENoaWxkLmZpcnN0Q2hpbGRcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBhY3RpdmF0ZTogKGV2ZW50KSA9PlxuXG4gICAgICAgIGlmIEBjb2x1bW4uaW5kZXggPCAwICMgc2hlbGYgaGFuZGxlcyByb3cgYWN0aXZhdGlvblxuICAgICAgICAgICAgQGNvbHVtbi5hY3RpdmF0ZVJvdyBAXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIGlmIGV2ZW50P1xuICAgICAgICAgICAgeyBtb2QgfSA9IGtleWluZm8uZm9yRXZlbnQgZXZlbnRcbiAgICAgICAgICAgIHN3aXRjaCBtb2RcbiAgICAgICAgICAgICAgICB3aGVuICdhbHQnICdjb21tYW5kK2FsdCcgJ2N0cmwrYWx0J1xuICAgICAgICAgICAgICAgICAgICBpZiBAaXRlbS50eXBlID09ICdmaWxlJyBhbmQgQGl0ZW0udGV4dEZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3QudG9NYWluICduZXdXaW5kb3dXaXRoRmlsZScgQGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgJCgnLmhvdmVyJyk/LmNsYXNzTGlzdC5yZW1vdmUgJ2hvdmVyJ1xuICAgICAgICBcbiAgICAgICAgQHNldEFjdGl2ZSBlbWl0OnRydWVcbiAgICAgICAgXG4gICAgICAgIG9wdCA9IGZpbGU6QGl0ZW0uZmlsZVxuICAgICAgICBcbiAgICAgICAgc3dpdGNoIEBpdGVtLnR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2RpcicgJ2ZpbGUnIFxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnZmlsZWJyb3dzZXInICdhY3RpdmF0ZUl0ZW0nIEBpdGVtLCBAY29sdW1uLmluZGV4XG4gICAgICAgICAgICBlbHNlICAgIFxuICAgICAgICAgICAgICAgIGlmIEBpdGVtLmZpbGU/IGFuZCBfLmlzU3RyaW5nKEBpdGVtLmZpbGUpIGFuZCBAaXRlbS50eXBlICE9ICdvYmonXG4gICAgICAgICAgICAgICAgICAgIG9wdC5saW5lID0gQGl0ZW0ubGluZVxuICAgICAgICAgICAgICAgICAgICBvcHQuY29sICA9IEBpdGVtLmNvbHVtblxuICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUb0ZpbGUnIG9wdFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgQGNvbHVtbi5wYXJlbnQub2JqPyBhbmQgQGNvbHVtbi5wYXJlbnQudHlwZSA9PSAnb2JqJ1xuICAgICAgICAgICAgICAgICAgICBpZiBAaXRlbS50eXBlID09ICdvYmonXG4gICAgICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5sb2FkT2JqZWN0SXRlbSBAaXRlbSwgY29sdW1uOkBjb2x1bW4uaW5kZXgrMVxuICAgICAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIucHJldmlld09iamVjdEl0ZW0gIEBpdGVtLCBjb2x1bW46QGNvbHVtbi5pbmRleCsyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBAaXRlbS5vYmo/LmZpbGU/IGFuZCBfLmlzU3RyaW5nIEBpdGVtLm9iai5maWxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0LmxpbmUgPSBAaXRlbS5vYmoubGluZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdC5jb2wgID0gQGl0ZW0ub2JqLmNvbHVtblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvRmlsZScgb3B0XG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAaXRlbS5vYmo/LmZpbGU/IGFuZCBfLmlzU3RyaW5nIEBpdGVtLm9iai5maWxlXG4gICAgICAgICAgICAgICAgICAgIG9wdCA9IGZpbGU6QGl0ZW0ub2JqLmZpbGUsIGxpbmU6QGl0ZW0ub2JqLmxpbmUsIGNvbDpAaXRlbS5vYmouY29sdW1uLCBuZXdUYWI6b3B0Lm5ld1RhYlxuICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUb0ZpbGUnIG9wdFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuY2xlYXJDb2x1bW5zRnJvbSBAY29sdW1uLmluZGV4KzFcbiAgICAgICAgQFxuICAgIFxuICAgIGlzQWN0aXZlOiAtPiBAZGl2LmNsYXNzTGlzdC5jb250YWlucyAnYWN0aXZlJ1xuICAgIFxuICAgIHNldEFjdGl2ZTogKG9wdCA9IHt9KSAtPlxuICAgICAgICBcbiAgICAgICAgQGNvbHVtbi5hY3RpdmVSb3coKT8uY2xlYXJBY3RpdmUoKVxuICAgICAgICBAZGl2LmNsYXNzTGlzdC5hZGQgJ2FjdGl2ZSdcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdD8uc2Nyb2xsICE9IGZhbHNlXG4gICAgICAgICAgICBAY29sdW1uLnNjcm9sbC50b0luZGV4IEBpbmRleCgpXG4gICAgICAgICAgICBcbiAgICAgICAgd2luZG93LnNldExhc3RGb2N1cyBAY29sdW1uLm5hbWUoKVxuICAgICAgICBcbiAgICAgICAgaWYgb3B0Py5lbWl0IFxuICAgICAgICAgICAgQGJyb3dzZXIuZW1pdCAnaXRlbUFjdGl2YXRlZCcgQGl0ZW1cbiAgICAgICAgICAgIGlmIEBpdGVtLnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ3NldENXRCcgQGl0ZW0uZmlsZVxuICAgICAgICAgICAgZWxzZSBpZiBAaXRlbS50eXBlID09ICdmaWxlJ1xuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnc2V0Q1dEJyBzbGFzaC5kaXIgQGl0ZW0uZmlsZVxuICAgICAgICBAXG4gICAgICAgICAgICAgICAgXG4gICAgY2xlYXJBY3RpdmU6IC0+XG4gICAgICAgIEBkaXYuY2xhc3NMaXN0LnJlbW92ZSAnYWN0aXZlJ1xuICAgICAgICBAXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICAgICAgICAgIFxuICAgIGVkaXROYW1lOiA9PlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIEBpbnB1dD8gXG4gICAgICAgIEBpbnB1dCA9IGVsZW0gJ2lucHV0JyBjbGFzczogJ3Jvd05hbWVJbnB1dCdcbiAgICAgICAgQGlucHV0LnZhbHVlID0gc2xhc2guZmlsZSBAaXRlbS5maWxlXG4gICAgICAgIFxuICAgICAgICBAZGl2LmFwcGVuZENoaWxkIEBpbnB1dFxuICAgICAgICBAaW5wdXQuYWRkRXZlbnRMaXN0ZW5lciAnY2hhbmdlJyAgIEBvbk5hbWVDaGFuZ2VcbiAgICAgICAgQGlucHV0LmFkZEV2ZW50TGlzdGVuZXIgJ2tleWRvd24nICBAb25OYW1lS2V5RG93blxuICAgICAgICBAaW5wdXQuYWRkRXZlbnRMaXN0ZW5lciAnZm9jdXNvdXQnIEBvbk5hbWVGb2N1c091dFxuICAgICAgICBAaW5wdXQuZm9jdXMoKVxuICAgICAgICBcbiAgICAgICAgQGlucHV0LnNldFNlbGVjdGlvblJhbmdlIDAsIHNsYXNoLmJhc2UoQGl0ZW0uZmlsZSkubGVuZ3RoXG5cbiAgICBvbk5hbWVLZXlEb3duOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICB7bW9kLCBrZXksIGNvbWJvfSA9IGtleWluZm8uZm9yRXZlbnQgZXZlbnRcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdlbnRlcicgJ2VzYydcbiAgICAgICAgICAgICAgICBpZiBAaW5wdXQudmFsdWUgPT0gQGZpbGUgb3IgY29tYm8gIT0gJ2VudGVyJ1xuICAgICAgICAgICAgICAgICAgICBAaW5wdXQudmFsdWUgPSBAZmlsZVxuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgICAgIEBvbk5hbWVGb2N1c091dCgpXG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgIFxuICAgIHJlbW92ZUlucHV0OiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAaW5wdXQ/XG4gICAgICAgIEBpbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyICdmb2N1c291dCcgQG9uTmFtZUZvY3VzT3V0XG4gICAgICAgIEBpbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyICdjaGFuZ2UnICAgQG9uTmFtZUNoYW5nZVxuICAgICAgICBAaW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lciAna2V5ZG93bicgIEBvbk5hbWVLZXlEb3duXG4gICAgICAgIEBpbnB1dC5yZW1vdmUoKVxuICAgICAgICBkZWxldGUgQGlucHV0XG4gICAgICAgIEBpbnB1dCA9IG51bGxcbiAgICAgICAgaWYgbm90IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ/IG9yIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT0gZG9jdW1lbnQuYm9keVxuICAgICAgICAgICAgQGNvbHVtbi5mb2N1cyBhY3RpdmF0ZTpmYWxzZVxuICAgIFxuICAgIG9uTmFtZUZvY3VzT3V0OiAoZXZlbnQpID0+IEByZW1vdmVJbnB1dCgpXG4gICAgXG4gICAgb25OYW1lQ2hhbmdlOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICB0cmltbWVkID0gQGlucHV0LnZhbHVlLnRyaW0oKVxuICAgICAgICBpZiB0cmltbWVkLmxlbmd0aFxuICAgICAgICAgICAgbmV3RmlsZSA9IHNsYXNoLmpvaW4gc2xhc2guZGlyKEBpdGVtLmZpbGUpLCB0cmltbWVkXG4gICAgICAgICAgICB1bnVzZWRGaWxlbmFtZSA9IHJlcXVpcmUgJ3VudXNlZC1maWxlbmFtZSdcbiAgICAgICAgICAgIHVudXNlZEZpbGVuYW1lKG5ld0ZpbGUpLnRoZW4gKG5ld0ZpbGUpID0+XG4gICAgICAgICAgICAgICAgZnMucmVuYW1lIEBpdGVtLmZpbGUsIG5ld0ZpbGUsIChlcnIpID0+XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ3JlbmFtZSBmYWlsZWQnIGVyciBpZiBlcnJcbiAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdsb2FkRmlsZScgbmV3RmlsZVxuICAgICAgICBAcmVtb3ZlSW5wdXQoKVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIG9uRHJhZ1N0YXJ0OiAoZCwgZSkgPT5cbiAgICAgICAgXG4gICAgICAgIEBjb2x1bW4uZm9jdXMgYWN0aXZhdGU6ZmFsc2VcbiAgICAgICAgQHNldEFjdGl2ZSBzY3JvbGw6ZmFsc2VcblxuICAgIG9uRHJhZ01vdmU6IChkLGUpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQGNvbHVtbi5kcmFnRGl2XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBpZiBNYXRoLmFicyhkLmRlbHRhU3VtLngpIDwgMjAgYW5kIE1hdGguYWJzKGQuZGVsdGFTdW0ueSkgPCAxMFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYgPSBAZGl2LmNsb25lTm9kZSB0cnVlXG4gICAgICAgICAgICBiciA9IEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSdcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS50b3AgID0gXCIje2JyLnRvcH1weFwiXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYuc3R5bGUubGVmdCA9IFwiI3tici5sZWZ0fXB4XCJcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS53aWR0aCA9IFwiI3tici53aWR0aC0xMn1weFwiXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYuc3R5bGUuaGVpZ2h0ID0gXCIje2JyLmhlaWdodC0zfXB4XCJcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS5mbGV4ID0gJ3Vuc2V0J1xuICAgICAgICAgICAgQGNvbHVtbi5kcmFnRGl2LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSdcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQgQGNvbHVtbi5kcmFnRGl2XG4gICAgICAgIFxuICAgICAgICBAY29sdW1uLmRyYWdEaXYuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGVYKCN7ZC5kZWx0YVN1bS54fXB4KSB0cmFuc2xhdGVZKCN7ZC5kZWx0YVN1bS55fXB4KVwiXG5cbiAgICBvbkRyYWdTdG9wOiAoZCxlKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGNvbHVtbi5kcmFnRGl2P1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYucmVtb3ZlKClcbiAgICAgICAgICAgIGRlbGV0ZSBAY29sdW1uLmRyYWdEaXZcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgY29sdW1uID0gQGJyb3dzZXIuY29sdW1uQXRQb3MgZC5wb3NcbiAgICAgICAgICAgICAgICBjb2x1bW4uZHJvcFJvdz8gQCwgZC5wb3NcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFJvd1xuIl19
//# sourceURL=../../coffee/browser/row.coffee