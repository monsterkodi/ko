// koffee 1.4.0

/*
00000000    0000000   000   000
000   000  000   000  000 0 000
0000000    000   000  000000000
000   000  000   000  000   000
000   000   0000000   00     00
 */
var $, File, Row, Syntax, _, app, clamp, drag, electron, elem, empty, fs, kerror, keyinfo, post, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), elem = ref.elem, keyinfo = ref.keyinfo, drag = ref.drag, clamp = ref.clamp, stopEvent = ref.stopEvent, empty = ref.empty, post = ref.post, slash = ref.slash, kerror = ref.kerror, fs = ref.fs, $ = ref.$, _ = ref._;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm93LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxrSEFBQTtJQUFBOztBQVFBLE1BQWtGLE9BQUEsQ0FBUSxLQUFSLENBQWxGLEVBQUUsZUFBRixFQUFRLHFCQUFSLEVBQWlCLGVBQWpCLEVBQXVCLGlCQUF2QixFQUE4Qix5QkFBOUIsRUFBeUMsaUJBQXpDLEVBQWdELGVBQWhELEVBQXNELGlCQUF0RCxFQUE2RCxtQkFBN0QsRUFBcUUsV0FBckUsRUFBeUUsU0FBekUsRUFBNEU7O0FBRTVFLE1BQUEsR0FBWSxPQUFBLENBQVEsa0JBQVI7O0FBQ1osUUFBQSxHQUFZLE9BQUEsQ0FBUSxVQUFSOztBQUNaLElBQUEsR0FBWSxPQUFBLENBQVEsZUFBUjs7QUFFWixHQUFBLEdBQU0sUUFBUSxDQUFDLE1BQU0sQ0FBQzs7QUFFaEI7SUFFVyxhQUFDLE9BQUQsRUFBVSxJQUFWO0FBRVQsWUFBQTtRQUZVLElBQUMsQ0FBQSxTQUFEO1FBQVMsSUFBQyxDQUFBLE9BQUQ7Ozs7Ozs7OztRQUVuQixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUMsQ0FBQSxNQUFNLENBQUM7UUFDbkIsSUFBQSw0Q0FBb0IsSUFBQyxDQUFBLElBQUksQ0FBQztRQUMxQixJQUFHLEtBQUEsQ0FBTSxJQUFOLENBQUEsSUFBZSxLQUFBLENBQU0sSUFBSSxDQUFDLElBQUwsQ0FBQSxDQUFOLENBQWxCO1lBQ0ksSUFBQSxHQUFPLGlCQURYO1NBQUEsTUFBQTtZQUdJLElBQUEsR0FBTyxNQUFNLENBQUMsb0JBQVAsQ0FBNEIsSUFBNUIsRUFBa0MsU0FBbEMsRUFIWDs7UUFJQSxJQUFDLENBQUEsR0FBRCxHQUFPLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sWUFBUDtZQUFxQixJQUFBLEVBQU0sSUFBM0I7U0FBTDtRQUNQLElBQUMsQ0FBQSxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQWYsQ0FB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T0FBTyxDQUFDLE1BQWhCLENBQUE7WUFDQSxPQUFPLElBQUMsQ0FBQSxNQUFNLENBQUM7WUFFZixJQUFHLE1BQUEsR0FBUyxJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVQsQ0FBcUIsQ0FBQyxDQUFDLEdBQXZCLENBQVo7OERBQ0ksTUFBTSxDQUFDLFFBQVMsTUFBRyxDQUFDLENBQUMsY0FEekI7YUFMSjs7SUFGUTs7Ozs7O0FBVWhCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwXG4jIyNcblxueyBlbGVtLCBrZXlpbmZvLCBkcmFnLCBjbGFtcCwgc3RvcEV2ZW50LCBlbXB0eSwgcG9zdCwgc2xhc2gsIGtlcnJvciwgZnMsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aycgXG5cblN5bnRheCAgICA9IHJlcXVpcmUgJy4uL2VkaXRvci9zeW50YXgnXG5lbGVjdHJvbiAgPSByZXF1aXJlICdlbGVjdHJvbidcbkZpbGUgICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL2ZpbGUnXG5cbmFwcCA9IGVsZWN0cm9uLnJlbW90ZS5hcHBcblxuY2xhc3MgUm93XG4gICAgXG4gICAgY29uc3RydWN0b3I6IChAY29sdW1uLCBAaXRlbSkgLT5cblxuICAgICAgICBAYnJvd3NlciA9IEBjb2x1bW4uYnJvd3NlclxuICAgICAgICB0ZXh0ID0gQGl0ZW0udGV4dCA/IEBpdGVtLm5hbWVcbiAgICAgICAgaWYgZW1wdHkodGV4dCkgb3IgZW1wdHkgdGV4dC50cmltKClcbiAgICAgICAgICAgIGh0bWwgPSAnPHNwYW4+IDwvc3Bhbj4nXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGh0bWwgPSBTeW50YXguc3BhbkZvclRleHRBbmRTeW50YXggdGV4dCwgJ2Jyb3dzZXInXG4gICAgICAgIEBkaXYgPSBlbGVtIGNsYXNzOiAnYnJvd3NlclJvdycsIGh0bWw6IGh0bWxcbiAgICAgICAgQGRpdi5jbGFzc0xpc3QuYWRkIEBpdGVtLnR5cGVcbiAgICAgICAgQGNvbHVtbi50YWJsZS5hcHBlbmRDaGlsZCBAZGl2XG5cbiAgICAgICAgaWYgQGl0ZW0udHlwZSBpbiBbJ2ZpbGUnLCAnZGlyJ10gb3IgQGl0ZW0uaWNvblxuICAgICAgICAgICAgQHNldEljb24oKVxuICAgICAgICBcbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQGRpdlxuICAgICAgICAgICAgb25TdGFydDogQG9uRHJhZ1N0YXJ0XG4gICAgICAgICAgICBvbk1vdmU6ICBAb25EcmFnTW92ZVxuICAgICAgICAgICAgb25TdG9wOiAgQG9uRHJhZ1N0b3BcbiAgIFxuICAgIG5leHQ6ICAgICAgICAtPiBAaW5kZXgoKSA8IEBjb2x1bW4ubnVtUm93cygpLTEgYW5kIEBjb2x1bW4ucm93c1tAaW5kZXgoKSsxXSBvciBudWxsXG4gICAgcHJldjogICAgICAgIC0+IEBpbmRleCgpID4gMCBhbmQgQGNvbHVtbi5yb3dzW0BpbmRleCgpLTFdIG9yIG51bGxcbiAgICBpbmRleDogICAgICAgLT4gQGNvbHVtbi5yb3dzLmluZGV4T2YgQCAgICBcbiAgICBvbk1vdXNlT3V0OiAgLT4gQGRpdi5jbGFzc0xpc3QucmVtb3ZlICdob3ZlcidcbiAgICBvbk1vdXNlT3ZlcjogLT4gQGRpdi5jbGFzc0xpc3QuYWRkICdob3ZlcidcblxuICAgIHBhdGg6IC0+IFxuICAgICAgICBpZiBAaXRlbS5maWxlPyBhbmQgXy5pc1N0cmluZyBAaXRlbS5maWxlXG4gICAgICAgICAgICByZXR1cm4gQGl0ZW0uZmlsZVxuICAgICAgICBpZiBAaXRlbS5vYmo/LmZpbGU/IGFuZCBfLmlzU3RyaW5nIEBpdGVtLm9iai5maWxlXG4gICAgICAgICAgICByZXR1cm4gQGl0ZW0ub2JqLmZpbGVcblxuICAgIHNldEljb246IC0+XG5cbiAgICAgICAgaWYgQGl0ZW0uaWNvblxuICAgICAgICAgICAgY2xhc3NOYW1lID0gQGl0ZW0uaWNvblxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBAaXRlbS50eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lID0gJ2ZvbGRlci1pY29uJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA9IEZpbGUuaWNvbkNsYXNzTmFtZSBAaXRlbS5maWxlXG4gICAgICAgICAgICBcbiAgICAgICAgaWNvbiA9IGVsZW0oJ3NwYW4nLCBjbGFzczpjbGFzc05hbWUgKyAnIGJyb3dzZXJGaWxlSWNvbicpXG4gICAgICAgICAgICBcbiAgICAgICAgQGRpdi5maXJzdENoaWxkLmluc2VydEJlZm9yZSBpY29uLCBAZGl2LmZpcnN0Q2hpbGQuZmlyc3RDaGlsZFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGFjdGl2YXRlOiAoZXZlbnQpID0+XG5cbiAgICAgICAgaWYgQGNvbHVtbi5pbmRleCA8IDAgIyBzaGVsZiBoYW5kbGVzIHJvdyBhY3RpdmF0aW9uXG4gICAgICAgICAgICBAY29sdW1uLmFjdGl2YXRlUm93IEBcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgaWYgZXZlbnQ/XG4gICAgICAgICAgICB7IG1vZCB9ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuICAgICAgICAgICAgc3dpdGNoIG1vZFxuICAgICAgICAgICAgICAgIHdoZW4gJ2FsdCcsICdjb21tYW5kK2FsdCcsICdjdHJsK2FsdCdcbiAgICAgICAgICAgICAgICAgICAgaWYgQGl0ZW0udHlwZSA9PSAnZmlsZScgYW5kIEBpdGVtLnRleHRGaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0LnRvTWFpbiAnbmV3V2luZG93V2l0aEZpbGUnLCBAaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICAkKCcuaG92ZXInKT8uY2xhc3NMaXN0LnJlbW92ZSAnaG92ZXInXG4gICAgICAgIFxuICAgICAgICBAc2V0QWN0aXZlIGVtaXQ6dHJ1ZVxuICAgICAgICBcbiAgICAgICAgb3B0ID0gZmlsZTpAaXRlbS5maWxlXG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggQGl0ZW0udHlwZVxuICAgICAgICAgICAgd2hlbiAnZGlyJywgJ2ZpbGUnIFxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnZmlsZWJyb3dzZXInLCAnYWN0aXZhdGVJdGVtJywgQGl0ZW0sIEBjb2x1bW4uaW5kZXhcbiAgICAgICAgICAgIGVsc2UgICAgXG4gICAgICAgICAgICAgICAgaWYgQGl0ZW0uZmlsZT8gYW5kIF8uaXNTdHJpbmcoQGl0ZW0uZmlsZSkgYW5kIEBpdGVtLnR5cGUgIT0gJ29iaidcbiAgICAgICAgICAgICAgICAgICAgb3B0LmxpbmUgPSBAaXRlbS5saW5lXG4gICAgICAgICAgICAgICAgICAgIG9wdC5jb2wgID0gQGl0ZW0uY29sdW1uXG4gICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvRmlsZScsIG9wdFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgQGNvbHVtbi5wYXJlbnQub2JqPyBhbmQgQGNvbHVtbi5wYXJlbnQudHlwZSA9PSAnb2JqJ1xuICAgICAgICAgICAgICAgICAgICBpZiBAaXRlbS50eXBlID09ICdvYmonXG4gICAgICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5sb2FkT2JqZWN0SXRlbSBAaXRlbSwgY29sdW1uOkBjb2x1bW4uaW5kZXgrMVxuICAgICAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIucHJldmlld09iamVjdEl0ZW0gIEBpdGVtLCBjb2x1bW46QGNvbHVtbi5pbmRleCsyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBAaXRlbS5vYmo/LmZpbGU/IGFuZCBfLmlzU3RyaW5nIEBpdGVtLm9iai5maWxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0LmxpbmUgPSBAaXRlbS5vYmoubGluZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdC5jb2wgID0gQGl0ZW0ub2JqLmNvbHVtblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvRmlsZScsIG9wdFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgQGl0ZW0ub2JqPy5maWxlPyBhbmQgXy5pc1N0cmluZyBAaXRlbS5vYmouZmlsZVxuICAgICAgICAgICAgICAgICAgICBvcHQgPSBmaWxlOkBpdGVtLm9iai5maWxlLCBsaW5lOkBpdGVtLm9iai5saW5lLCBjb2w6QGl0ZW0ub2JqLmNvbHVtbiwgbmV3VGFiOm9wdC5uZXdUYWJcbiAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG9GaWxlJywgb3B0XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5jbGVhckNvbHVtbnNGcm9tIEBjb2x1bW4uaW5kZXgrMVxuICAgICAgICBAXG4gICAgXG4gICAgaXNBY3RpdmU6IC0+IEBkaXYuY2xhc3NMaXN0LmNvbnRhaW5zICdhY3RpdmUnXG4gICAgXG4gICAgc2V0QWN0aXZlOiAob3B0ID0ge30pIC0+XG4gICAgICAgIFxuICAgICAgICBAY29sdW1uLmFjdGl2ZVJvdygpPy5jbGVhckFjdGl2ZSgpXG4gICAgICAgIEBkaXYuY2xhc3NMaXN0LmFkZCAnYWN0aXZlJ1xuICAgICAgICBcbiAgICAgICAgaWYgb3B0Py5zY3JvbGwgIT0gZmFsc2VcbiAgICAgICAgICAgIEBjb2x1bW4uc2Nyb2xsLnRvSW5kZXggQGluZGV4KClcbiAgICAgICAgICAgIFxuICAgICAgICB3aW5kb3cuc2V0TGFzdEZvY3VzIEBjb2x1bW4ubmFtZSgpXG4gICAgICAgIFxuICAgICAgICBpZiBvcHQ/LmVtaXQgXG4gICAgICAgICAgICBAYnJvd3Nlci5lbWl0ICdpdGVtQWN0aXZhdGVkJywgQGl0ZW1cbiAgICAgICAgICAgIGlmIEBpdGVtLnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ3NldENXRCcsIEBpdGVtLmZpbGVcbiAgICAgICAgICAgIGVsc2UgaWYgQGl0ZW0udHlwZSA9PSAnZmlsZSdcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ3NldENXRCcsIHNsYXNoLmRpciBAaXRlbS5maWxlXG4gICAgICAgIEBcbiAgICAgICAgICAgICAgICBcbiAgICBjbGVhckFjdGl2ZTogLT5cbiAgICAgICAgQGRpdi5jbGFzc0xpc3QucmVtb3ZlICdhY3RpdmUnXG4gICAgICAgIEBcblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgICAgICAgICAgXG4gICAgZWRpdE5hbWU6ID0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgQGlucHV0PyBcbiAgICAgICAgQGlucHV0ID0gZWxlbSAnaW5wdXQnLCBjbGFzczogJ3Jvd05hbWVJbnB1dCdcbiAgICAgICAgQGlucHV0LnZhbHVlID0gc2xhc2guZmlsZSBAaXRlbS5maWxlXG4gICAgICAgIFxuICAgICAgICBAZGl2LmFwcGVuZENoaWxkIEBpbnB1dFxuICAgICAgICBAaW5wdXQuYWRkRXZlbnRMaXN0ZW5lciAnY2hhbmdlJywgICBAb25OYW1lQ2hhbmdlXG4gICAgICAgIEBpbnB1dC5hZGRFdmVudExpc3RlbmVyICdrZXlkb3duJywgIEBvbk5hbWVLZXlEb3duXG4gICAgICAgIEBpbnB1dC5hZGRFdmVudExpc3RlbmVyICdmb2N1c291dCcsIEBvbk5hbWVGb2N1c091dFxuICAgICAgICBAaW5wdXQuZm9jdXMoKVxuICAgICAgICBcbiAgICAgICAgQGlucHV0LnNldFNlbGVjdGlvblJhbmdlIDAsIHNsYXNoLmJhc2UoQGl0ZW0uZmlsZSkubGVuZ3RoXG5cbiAgICBvbk5hbWVLZXlEb3duOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICB7bW9kLCBrZXksIGNvbWJvfSA9IGtleWluZm8uZm9yRXZlbnQgZXZlbnRcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdlbnRlcicsICdlc2MnXG4gICAgICAgICAgICAgICAgaWYgQGlucHV0LnZhbHVlID09IEBmaWxlIG9yIGNvbWJvICE9ICdlbnRlcidcbiAgICAgICAgICAgICAgICAgICAgQGlucHV0LnZhbHVlID0gQGZpbGVcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICBAb25OYW1lRm9jdXNPdXQoKVxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBcbiAgICByZW1vdmVJbnB1dDogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGlucHV0P1xuICAgICAgICBAaW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lciAnZm9jdXNvdXQnLCBAb25OYW1lRm9jdXNPdXRcbiAgICAgICAgQGlucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2NoYW5nZScsICAgQG9uTmFtZUNoYW5nZVxuICAgICAgICBAaW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lciAna2V5ZG93bicsICBAb25OYW1lS2V5RG93blxuICAgICAgICBAaW5wdXQucmVtb3ZlKClcbiAgICAgICAgZGVsZXRlIEBpbnB1dFxuICAgICAgICBAaW5wdXQgPSBudWxsXG4gICAgICAgIGlmIG5vdCBkb2N1bWVudC5hY3RpdmVFbGVtZW50PyBvciBkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09IGRvY3VtZW50LmJvZHlcbiAgICAgICAgICAgIEBjb2x1bW4uZm9jdXMgYWN0aXZhdGU6ZmFsc2VcbiAgICBcbiAgICBvbk5hbWVGb2N1c091dDogKGV2ZW50KSA9PiBAcmVtb3ZlSW5wdXQoKVxuICAgIFxuICAgIG9uTmFtZUNoYW5nZTogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgdHJpbW1lZCA9IEBpbnB1dC52YWx1ZS50cmltKClcbiAgICAgICAgaWYgdHJpbW1lZC5sZW5ndGhcbiAgICAgICAgICAgIG5ld0ZpbGUgPSBzbGFzaC5qb2luIHNsYXNoLmRpcihAaXRlbS5maWxlKSwgdHJpbW1lZFxuICAgICAgICAgICAgdW51c2VkRmlsZW5hbWUgPSByZXF1aXJlICd1bnVzZWQtZmlsZW5hbWUnXG4gICAgICAgICAgICB1bnVzZWRGaWxlbmFtZShuZXdGaWxlKS50aGVuIChuZXdGaWxlKSA9PlxuICAgICAgICAgICAgICAgIGZzLnJlbmFtZSBAaXRlbS5maWxlLCBuZXdGaWxlLCAoZXJyKSA9PlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yICdyZW5hbWUgZmFpbGVkJywgZXJyIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJywgbmV3RmlsZVxuICAgICAgICBAcmVtb3ZlSW5wdXQoKVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIG9uRHJhZ1N0YXJ0OiAoZCwgZSkgPT5cbiAgICAgICAgXG4gICAgICAgIEBjb2x1bW4uZm9jdXMgYWN0aXZhdGU6ZmFsc2VcbiAgICAgICAgQHNldEFjdGl2ZSBzY3JvbGw6ZmFsc2VcblxuICAgIG9uRHJhZ01vdmU6IChkLGUpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQGNvbHVtbi5kcmFnRGl2XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBpZiBNYXRoLmFicyhkLmRlbHRhU3VtLngpIDwgMjAgYW5kIE1hdGguYWJzKGQuZGVsdGFTdW0ueSkgPCAxMFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYgPSBAZGl2LmNsb25lTm9kZSB0cnVlXG4gICAgICAgICAgICBiciA9IEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSdcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS50b3AgID0gXCIje2JyLnRvcH1weFwiXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYuc3R5bGUubGVmdCA9IFwiI3tici5sZWZ0fXB4XCJcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS53aWR0aCA9IFwiI3tici53aWR0aC0xMn1weFwiXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYuc3R5bGUuaGVpZ2h0ID0gXCIje2JyLmhlaWdodC0zfXB4XCJcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS5mbGV4ID0gJ3Vuc2V0J1xuICAgICAgICAgICAgQGNvbHVtbi5kcmFnRGl2LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSdcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQgQGNvbHVtbi5kcmFnRGl2XG4gICAgICAgIFxuICAgICAgICBAY29sdW1uLmRyYWdEaXYuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGVYKCN7ZC5kZWx0YVN1bS54fXB4KSB0cmFuc2xhdGVZKCN7ZC5kZWx0YVN1bS55fXB4KVwiXG5cbiAgICBvbkRyYWdTdG9wOiAoZCxlKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGNvbHVtbi5kcmFnRGl2P1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYucmVtb3ZlKClcbiAgICAgICAgICAgIGRlbGV0ZSBAY29sdW1uLmRyYWdEaXZcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgY29sdW1uID0gQGJyb3dzZXIuY29sdW1uQXRQb3MgZC5wb3NcbiAgICAgICAgICAgICAgICBjb2x1bW4uZHJvcFJvdz8gQCwgZC5wb3NcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFJvd1xuIl19
//# sourceURL=../../coffee/browser/row.coffee