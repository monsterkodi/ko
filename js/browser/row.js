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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm93LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxrSEFBQTtJQUFBOztBQVFBLE1BQWtGLE9BQUEsQ0FBUSxLQUFSLENBQWxGLEVBQUUsZUFBRixFQUFRLHFCQUFSLEVBQWlCLGVBQWpCLEVBQXVCLGlCQUF2QixFQUE4Qix5QkFBOUIsRUFBeUMsaUJBQXpDLEVBQWdELGVBQWhELEVBQXNELGlCQUF0RCxFQUE2RCxtQkFBN0QsRUFBcUUsV0FBckUsRUFBeUUsU0FBekUsRUFBNEU7O0FBRTVFLE1BQUEsR0FBWSxPQUFBLENBQVEsa0JBQVI7O0FBQ1osUUFBQSxHQUFZLE9BQUEsQ0FBUSxVQUFSOztBQUNaLElBQUEsR0FBWSxPQUFBLENBQVEsZUFBUjs7QUFFWixHQUFBLEdBQU0sUUFBUSxDQUFDLE1BQU0sQ0FBQzs7QUFFaEI7SUFFQyxhQUFDLE9BQUQsRUFBVSxJQUFWO0FBRUMsWUFBQTtRQUZBLElBQUMsQ0FBQSxTQUFEO1FBQVMsSUFBQyxDQUFBLE9BQUQ7Ozs7Ozs7OztRQUVULElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQyxDQUFBLE1BQU0sQ0FBQztRQUNuQixJQUFBLDRDQUFvQixJQUFDLENBQUEsSUFBSSxDQUFDO1FBQzFCLElBQUcsS0FBQSxDQUFNLElBQU4sQ0FBQSxJQUFlLEtBQUEsQ0FBTSxJQUFJLENBQUMsSUFBTCxDQUFBLENBQU4sQ0FBbEI7WUFDSSxJQUFBLEdBQU8saUJBRFg7U0FBQSxNQUFBO1lBR0ksSUFBQSxHQUFPLE1BQU0sQ0FBQyxvQkFBUCxDQUE0QixJQUE1QixFQUFrQyxTQUFsQyxFQUhYOztRQUlBLElBQUMsQ0FBQSxHQUFELEdBQU8sSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxZQUFQO1lBQW9CLElBQUEsRUFBTSxJQUExQjtTQUFMO1FBQ1AsSUFBQyxDQUFBLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBZixDQUFt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QUFDLE1BQWhCLENBQUE7WUFDQSxPQUFPLElBQUMsQ0FBQSxNQUFNLENBQUM7WUFFZixJQUFHLE1BQUEsR0FBUyxJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVQsQ0FBcUIsQ0FBQyxDQUFDLEdBQXZCLENBQVo7OERBQ0ksTUFBTSxDQUFDLFFBQVMsTUFBRyxDQUFDLENBQUMsY0FEekI7YUFMSjs7SUFGUTs7Ozs7O0FBVWhCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwXG4jIyNcblxueyBlbGVtLCBrZXlpbmZvLCBkcmFnLCBjbGFtcCwgc3RvcEV2ZW50LCBlbXB0eSwgcG9zdCwgc2xhc2gsIGtlcnJvciwgZnMsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aycgXG5cblN5bnRheCAgICA9IHJlcXVpcmUgJy4uL2VkaXRvci9zeW50YXgnXG5lbGVjdHJvbiAgPSByZXF1aXJlICdlbGVjdHJvbidcbkZpbGUgICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL2ZpbGUnXG5cbmFwcCA9IGVsZWN0cm9uLnJlbW90ZS5hcHBcblxuY2xhc3MgUm93XG4gICAgXG4gICAgQDogKEBjb2x1bW4sIEBpdGVtKSAtPlxuXG4gICAgICAgIEBicm93c2VyID0gQGNvbHVtbi5icm93c2VyXG4gICAgICAgIHRleHQgPSBAaXRlbS50ZXh0ID8gQGl0ZW0ubmFtZVxuICAgICAgICBpZiBlbXB0eSh0ZXh0KSBvciBlbXB0eSB0ZXh0LnRyaW0oKVxuICAgICAgICAgICAgaHRtbCA9ICc8c3Bhbj4gPC9zcGFuPidcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaHRtbCA9IFN5bnRheC5zcGFuRm9yVGV4dEFuZFN5bnRheCB0ZXh0LCAnYnJvd3NlcidcbiAgICAgICAgQGRpdiA9IGVsZW0gY2xhc3M6ICdicm93c2VyUm93JyBodG1sOiBodG1sXG4gICAgICAgIEBkaXYuY2xhc3NMaXN0LmFkZCBAaXRlbS50eXBlXG4gICAgICAgIEBjb2x1bW4udGFibGUuYXBwZW5kQ2hpbGQgQGRpdlxuXG4gICAgICAgIGlmIEBpdGVtLnR5cGUgaW4gWydmaWxlJyAnZGlyJ10gb3IgQGl0ZW0uaWNvblxuICAgICAgICAgICAgQHNldEljb24oKVxuICAgICAgICBcbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQGRpdlxuICAgICAgICAgICAgb25TdGFydDogQG9uRHJhZ1N0YXJ0XG4gICAgICAgICAgICBvbk1vdmU6ICBAb25EcmFnTW92ZVxuICAgICAgICAgICAgb25TdG9wOiAgQG9uRHJhZ1N0b3BcbiAgIFxuICAgIG5leHQ6ICAgICAgICAtPiBAaW5kZXgoKSA8IEBjb2x1bW4ubnVtUm93cygpLTEgYW5kIEBjb2x1bW4ucm93c1tAaW5kZXgoKSsxXSBvciBudWxsXG4gICAgcHJldjogICAgICAgIC0+IEBpbmRleCgpID4gMCBhbmQgQGNvbHVtbi5yb3dzW0BpbmRleCgpLTFdIG9yIG51bGxcbiAgICBpbmRleDogICAgICAgLT4gQGNvbHVtbi5yb3dzLmluZGV4T2YgQCAgICBcbiAgICBvbk1vdXNlT3V0OiAgLT4gQGRpdi5jbGFzc0xpc3QucmVtb3ZlICdob3ZlcidcbiAgICBvbk1vdXNlT3ZlcjogLT4gQGRpdi5jbGFzc0xpc3QuYWRkICdob3ZlcidcblxuICAgIHBhdGg6IC0+IFxuICAgICAgICBpZiBAaXRlbS5maWxlPyBhbmQgXy5pc1N0cmluZyBAaXRlbS5maWxlXG4gICAgICAgICAgICByZXR1cm4gQGl0ZW0uZmlsZVxuICAgICAgICBpZiBAaXRlbS5vYmo/LmZpbGU/IGFuZCBfLmlzU3RyaW5nIEBpdGVtLm9iai5maWxlXG4gICAgICAgICAgICByZXR1cm4gQGl0ZW0ub2JqLmZpbGVcblxuICAgIHNldEljb246IC0+XG5cbiAgICAgICAgaWYgQGl0ZW0uaWNvblxuICAgICAgICAgICAgY2xhc3NOYW1lID0gQGl0ZW0uaWNvblxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBAaXRlbS50eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lID0gJ2ZvbGRlci1pY29uJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA9IEZpbGUuaWNvbkNsYXNzTmFtZSBAaXRlbS5maWxlXG4gICAgICAgICAgICBcbiAgICAgICAgaWNvbiA9IGVsZW0oJ3NwYW4nIGNsYXNzOmNsYXNzTmFtZSArICcgYnJvd3NlckZpbGVJY29uJylcbiAgICAgICAgICAgIFxuICAgICAgICBAZGl2LmZpcnN0Q2hpbGQuaW5zZXJ0QmVmb3JlIGljb24sIEBkaXYuZmlyc3RDaGlsZC5maXJzdENoaWxkXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgYWN0aXZhdGU6IChldmVudCkgPT5cblxuICAgICAgICBpZiBAY29sdW1uLmluZGV4IDwgMCAjIHNoZWxmIGhhbmRsZXMgcm93IGFjdGl2YXRpb25cbiAgICAgICAgICAgIEBjb2x1bW4uYWN0aXZhdGVSb3cgQFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBpZiBldmVudD9cbiAgICAgICAgICAgIHsgbW9kIH0gPSBrZXlpbmZvLmZvckV2ZW50IGV2ZW50XG4gICAgICAgICAgICBzd2l0Y2ggbW9kXG4gICAgICAgICAgICAgICAgd2hlbiAnYWx0JyAnY29tbWFuZCthbHQnICdjdHJsK2FsdCdcbiAgICAgICAgICAgICAgICAgICAgaWYgQGl0ZW0udHlwZSA9PSAnZmlsZScgYW5kIEBpdGVtLnRleHRGaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0LnRvTWFpbiAnbmV3V2luZG93V2l0aEZpbGUnIEBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgICQoJy5ob3ZlcicpPy5jbGFzc0xpc3QucmVtb3ZlICdob3ZlcidcbiAgICAgICAgXG4gICAgICAgIEBzZXRBY3RpdmUgZW1pdDp0cnVlXG4gICAgICAgIFxuICAgICAgICBvcHQgPSBmaWxlOkBpdGVtLmZpbGVcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBAaXRlbS50eXBlXG4gICAgICAgICAgICB3aGVuICdkaXInICdmaWxlJyBcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2ZpbGVicm93c2VyJyAnYWN0aXZhdGVJdGVtJyBAaXRlbSwgQGNvbHVtbi5pbmRleFxuICAgICAgICAgICAgZWxzZSAgICBcbiAgICAgICAgICAgICAgICBpZiBAaXRlbS5maWxlPyBhbmQgXy5pc1N0cmluZyhAaXRlbS5maWxlKSBhbmQgQGl0ZW0udHlwZSAhPSAnb2JqJ1xuICAgICAgICAgICAgICAgICAgICBvcHQubGluZSA9IEBpdGVtLmxpbmVcbiAgICAgICAgICAgICAgICAgICAgb3B0LmNvbCAgPSBAaXRlbS5jb2x1bW5cbiAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG9GaWxlJyBvcHRcbiAgICAgICAgICAgICAgICBlbHNlIGlmIEBjb2x1bW4ucGFyZW50Lm9iaj8gYW5kIEBjb2x1bW4ucGFyZW50LnR5cGUgPT0gJ29iaidcbiAgICAgICAgICAgICAgICAgICAgaWYgQGl0ZW0udHlwZSA9PSAnb2JqJ1xuICAgICAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIubG9hZE9iamVjdEl0ZW0gQGl0ZW0sIGNvbHVtbjpAY29sdW1uLmluZGV4KzFcbiAgICAgICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnByZXZpZXdPYmplY3RJdGVtICBAaXRlbSwgY29sdW1uOkBjb2x1bW4uaW5kZXgrMlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgQGl0ZW0ub2JqPy5maWxlPyBhbmQgXy5pc1N0cmluZyBAaXRlbS5vYmouZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdC5saW5lID0gQGl0ZW0ub2JqLmxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHQuY29sICA9IEBpdGVtLm9iai5jb2x1bW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUb0ZpbGUnIG9wdFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgQGl0ZW0ub2JqPy5maWxlPyBhbmQgXy5pc1N0cmluZyBAaXRlbS5vYmouZmlsZVxuICAgICAgICAgICAgICAgICAgICBvcHQgPSBmaWxlOkBpdGVtLm9iai5maWxlLCBsaW5lOkBpdGVtLm9iai5saW5lLCBjb2w6QGl0ZW0ub2JqLmNvbHVtbiwgbmV3VGFiOm9wdC5uZXdUYWJcbiAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG9GaWxlJyBvcHRcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLmNsZWFyQ29sdW1uc0Zyb20gQGNvbHVtbi5pbmRleCsxXG4gICAgICAgIEBcbiAgICBcbiAgICBpc0FjdGl2ZTogLT4gQGRpdi5jbGFzc0xpc3QuY29udGFpbnMgJ2FjdGl2ZSdcbiAgICBcbiAgICBzZXRBY3RpdmU6IChvcHQgPSB7fSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjb2x1bW4uYWN0aXZlUm93KCk/LmNsZWFyQWN0aXZlKClcbiAgICAgICAgQGRpdi5jbGFzc0xpc3QuYWRkICdhY3RpdmUnXG4gICAgICAgIFxuICAgICAgICBpZiBvcHQ/LnNjcm9sbCAhPSBmYWxzZVxuICAgICAgICAgICAgQGNvbHVtbi5zY3JvbGwudG9JbmRleCBAaW5kZXgoKVxuICAgICAgICAgICAgXG4gICAgICAgIHdpbmRvdy5zZXRMYXN0Rm9jdXMgQGNvbHVtbi5uYW1lKClcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdD8uZW1pdCBcbiAgICAgICAgICAgIEBicm93c2VyLmVtaXQgJ2l0ZW1BY3RpdmF0ZWQnIEBpdGVtXG4gICAgICAgICAgICBpZiBAaXRlbS50eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdzZXRDV0QnIEBpdGVtLmZpbGVcbiAgICAgICAgICAgIGVsc2UgaWYgQGl0ZW0udHlwZSA9PSAnZmlsZSdcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ3NldENXRCcgc2xhc2guZGlyIEBpdGVtLmZpbGVcbiAgICAgICAgQFxuICAgICAgICAgICAgICAgIFxuICAgIGNsZWFyQWN0aXZlOiAtPlxuICAgICAgICBAZGl2LmNsYXNzTGlzdC5yZW1vdmUgJ2FjdGl2ZSdcbiAgICAgICAgQFxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgICAgICAgICBcbiAgICBlZGl0TmFtZTogPT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBAaW5wdXQ/IFxuICAgICAgICBAaW5wdXQgPSBlbGVtICdpbnB1dCcgY2xhc3M6ICdyb3dOYW1lSW5wdXQnXG4gICAgICAgIEBpbnB1dC52YWx1ZSA9IHNsYXNoLmZpbGUgQGl0ZW0uZmlsZVxuICAgICAgICBcbiAgICAgICAgQGRpdi5hcHBlbmRDaGlsZCBAaW5wdXRcbiAgICAgICAgQGlucHV0LmFkZEV2ZW50TGlzdGVuZXIgJ2NoYW5nZScgICBAb25OYW1lQ2hhbmdlXG4gICAgICAgIEBpbnB1dC5hZGRFdmVudExpc3RlbmVyICdrZXlkb3duJyAgQG9uTmFtZUtleURvd25cbiAgICAgICAgQGlucHV0LmFkZEV2ZW50TGlzdGVuZXIgJ2ZvY3Vzb3V0JyBAb25OYW1lRm9jdXNPdXRcbiAgICAgICAgQGlucHV0LmZvY3VzKClcbiAgICAgICAgXG4gICAgICAgIEBpbnB1dC5zZXRTZWxlY3Rpb25SYW5nZSAwLCBzbGFzaC5iYXNlKEBpdGVtLmZpbGUpLmxlbmd0aFxuXG4gICAgb25OYW1lS2V5RG93bjogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAge21vZCwga2V5LCBjb21ib30gPSBrZXlpbmZvLmZvckV2ZW50IGV2ZW50XG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnZW50ZXInICdlc2MnXG4gICAgICAgICAgICAgICAgaWYgQGlucHV0LnZhbHVlID09IEBmaWxlIG9yIGNvbWJvICE9ICdlbnRlcidcbiAgICAgICAgICAgICAgICAgICAgQGlucHV0LnZhbHVlID0gQGZpbGVcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgICAgICBAb25OYW1lRm9jdXNPdXQoKVxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBcbiAgICByZW1vdmVJbnB1dDogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGlucHV0P1xuICAgICAgICBAaW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lciAnZm9jdXNvdXQnIEBvbk5hbWVGb2N1c091dFxuICAgICAgICBAaW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lciAnY2hhbmdlJyAgIEBvbk5hbWVDaGFuZ2VcbiAgICAgICAgQGlucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2tleWRvd24nICBAb25OYW1lS2V5RG93blxuICAgICAgICBAaW5wdXQucmVtb3ZlKClcbiAgICAgICAgZGVsZXRlIEBpbnB1dFxuICAgICAgICBAaW5wdXQgPSBudWxsXG4gICAgICAgIGlmIG5vdCBkb2N1bWVudC5hY3RpdmVFbGVtZW50PyBvciBkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09IGRvY3VtZW50LmJvZHlcbiAgICAgICAgICAgIEBjb2x1bW4uZm9jdXMgYWN0aXZhdGU6ZmFsc2VcbiAgICBcbiAgICBvbk5hbWVGb2N1c091dDogKGV2ZW50KSA9PiBAcmVtb3ZlSW5wdXQoKVxuICAgIFxuICAgIG9uTmFtZUNoYW5nZTogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgdHJpbW1lZCA9IEBpbnB1dC52YWx1ZS50cmltKClcbiAgICAgICAgaWYgdHJpbW1lZC5sZW5ndGhcbiAgICAgICAgICAgIG5ld0ZpbGUgPSBzbGFzaC5qb2luIHNsYXNoLmRpcihAaXRlbS5maWxlKSwgdHJpbW1lZFxuICAgICAgICAgICAgdW51c2VkRmlsZW5hbWUgPSByZXF1aXJlICd1bnVzZWQtZmlsZW5hbWUnXG4gICAgICAgICAgICB1bnVzZWRGaWxlbmFtZShuZXdGaWxlKS50aGVuIChuZXdGaWxlKSA9PlxuICAgICAgICAgICAgICAgIGZzLnJlbmFtZSBAaXRlbS5maWxlLCBuZXdGaWxlLCAoZXJyKSA9PlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yICdyZW5hbWUgZmFpbGVkJyBlcnIgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnbG9hZEZpbGUnIG5ld0ZpbGVcbiAgICAgICAgQHJlbW92ZUlucHV0KClcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBvbkRyYWdTdGFydDogKGQsIGUpID0+XG4gICAgICAgIFxuICAgICAgICBAY29sdW1uLmZvY3VzIGFjdGl2YXRlOmZhbHNlXG4gICAgICAgIEBzZXRBY3RpdmUgc2Nyb2xsOmZhbHNlXG5cbiAgICBvbkRyYWdNb3ZlOiAoZCxlKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IEBjb2x1bW4uZHJhZ0RpdlxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gaWYgTWF0aC5hYnMoZC5kZWx0YVN1bS54KSA8IDIwIGFuZCBNYXRoLmFicyhkLmRlbHRhU3VtLnkpIDwgMTBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGNvbHVtbi5kcmFnRGl2ID0gQGRpdi5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICAgICAgYnIgPSBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYuc3R5bGUudG9wICA9IFwiI3tici50b3B9cHhcIlxuICAgICAgICAgICAgQGNvbHVtbi5kcmFnRGl2LnN0eWxlLmxlZnQgPSBcIiN7YnIubGVmdH1weFwiXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYuc3R5bGUud2lkdGggPSBcIiN7YnIud2lkdGgtMTJ9cHhcIlxuICAgICAgICAgICAgQGNvbHVtbi5kcmFnRGl2LnN0eWxlLmhlaWdodCA9IFwiI3tici5oZWlnaHQtM31weFwiXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYuc3R5bGUuZmxleCA9ICd1bnNldCdcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkIEBjb2x1bW4uZHJhZ0RpdlxuICAgICAgICBcbiAgICAgICAgQGNvbHVtbi5kcmFnRGl2LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlWCgje2QuZGVsdGFTdW0ueH1weCkgdHJhbnNsYXRlWSgje2QuZGVsdGFTdW0ueX1weClcIlxuXG4gICAgb25EcmFnU3RvcDogKGQsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBjb2x1bW4uZHJhZ0Rpdj9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGNvbHVtbi5kcmFnRGl2LnJlbW92ZSgpXG4gICAgICAgICAgICBkZWxldGUgQGNvbHVtbi5kcmFnRGl2XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGNvbHVtbiA9IEBicm93c2VyLmNvbHVtbkF0UG9zIGQucG9zXG4gICAgICAgICAgICAgICAgY29sdW1uLmRyb3BSb3c/IEAsIGQucG9zXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBSb3dcbiJdfQ==
//# sourceURL=../../coffee/browser/row.coffee