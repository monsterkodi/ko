// koffee 1.16.0

/*
 0000000    0000000   000000000   0000000 
000        000   000     000     000   000
000  0000  000   000     000     000   000
000   000  000   000     000     000   000
 0000000    0000000      000      0000000
 */
var Command, Goto, _, clamp, post, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = Object.hasOwn;

ref = require('kxk'), _ = ref._, clamp = ref.clamp, post = ref.post;

Command = require('../commandline/command');

Goto = (function(superClass) {
    extend(Goto, superClass);

    function Goto(commandline) {
        Goto.__super__.constructor.call(this, commandline);
        this.names = ['goto', 'selecto'];
    }

    Goto.prototype.start = function(name) {
        var ref1, ref2;
        Goto.__super__.start.call(this, name);
        this.showList();
        this.showItems(this.listItems());
        this.select(0);
        this.positionList();
        return {
            text: (ref1 = (ref2 = this.commandList) != null ? ref2.line(0) : void 0) != null ? ref1 : '',
            select: true
        };
    };

    Goto.prototype.listItems = function() {
        var clsss, files, func, funcs, i, items, j, k, len, len1, name, ref1, ref2;
        items = [];
        this.types = {};
        files = post.get('indexer', 'files');
        funcs = (ref1 = files[window.editor.currentFile]) != null ? ref1.funcs : void 0;
        if (funcs != null) {
            funcs;
        } else {
            funcs = [];
        }
        for (i = 0, len = funcs.length; i < len; i++) {
            func = funcs[i];
            items.push({
                text: func.name,
                line: '▸',
                clss: 'method'
            });
            this.types[func.name] = 'func';
        }
        clsss = post.get('indexer', 'classes');
        ref2 = _.keys(clsss);
        for (j = 0, len1 = ref2.length; j < len1; j++) {
            k = ref2[j];
            name = k;
            items.push({
                text: k,
                line: '●',
                clss: 'class'
            });
            this.types[name] = 'class';
        }
        return items;
    };

    Goto.prototype.execute = function(command) {
        var editor, line, ref1, type;
        command = Goto.__super__.execute.call(this, command);
        if (/^\-?\d+$/.test(command)) {
            line = parseInt(command);
            editor = this.receivingEditor();
            if (editor == null) {
                return console.error("no editor? focus: " + this.receiver);
            }
            if (line < 0) {
                line = editor.numLines() + line;
            } else {
                line -= 1;
            }
            line = clamp(0, editor.numLines() - 1, line);
            editor.singleCursorAtPos([0, line], {
                extend: this.name === 'selecto'
            });
            editor.scroll.cursorToTop();
            return {
                focus: this.receiver,
                "do": "show " + editor.name
            };
        } else if (command.length) {
            type = (ref1 = this.types[command]) != null ? ref1 : 'func';
            window.editor.jumpTo(command, {
                type: type,
                dontList: true,
                extend: this.name === 'selecto'
            });
            return {
                focus: 'editor',
                "do": "show editor"
            };
        } else {
            return {
                text: ''
            };
        }
    };

    return Goto;

})(Command);

module.exports = Goto;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ290by5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvY29tbWFuZHMiLCJzb3VyY2VzIjpbImdvdG8uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGtDQUFBO0lBQUE7OztBQVFBLE1BQXFCLE9BQUEsQ0FBUSxLQUFSLENBQXJCLEVBQUUsU0FBRixFQUFLLGlCQUFMLEVBQVk7O0FBRVosT0FBQSxHQUFVLE9BQUEsQ0FBUSx3QkFBUjs7QUFFSjs7O0lBRUMsY0FBQyxXQUFEO1FBRUMsc0NBQU0sV0FBTjtRQUVBLElBQUMsQ0FBQSxLQUFELEdBQVMsQ0FBQyxNQUFELEVBQVEsU0FBUjtJQUpWOzttQkFZSCxLQUFBLEdBQU8sU0FBQyxJQUFEO0FBQ0gsWUFBQTtRQUFBLGdDQUFNLElBQU47UUFDQSxJQUFDLENBQUEsUUFBRCxDQUFBO1FBQ0EsSUFBQyxDQUFBLFNBQUQsQ0FBVyxJQUFDLENBQUEsU0FBRCxDQUFBLENBQVg7UUFDQSxJQUFDLENBQUEsTUFBRCxDQUFRLENBQVI7UUFDQSxJQUFDLENBQUEsWUFBRCxDQUFBO2VBQ0E7WUFBQSxJQUFBLHNGQUE4QixFQUE5QjtZQUNBLE1BQUEsRUFBUSxJQURSOztJQU5HOzttQkFlUCxTQUFBLEdBQVcsU0FBQTtBQUVQLFlBQUE7UUFBQSxLQUFBLEdBQVE7UUFDUixJQUFDLENBQUEsS0FBRCxHQUFTO1FBRVQsS0FBQSxHQUFRLElBQUksQ0FBQyxHQUFMLENBQVMsU0FBVCxFQUFtQixPQUFuQjtRQUNSLEtBQUEsMkRBQXdDLENBQUU7O1lBQzFDOztZQUFBLFFBQVM7O0FBRVQsYUFBQSx1Q0FBQTs7WUFDSSxLQUFLLENBQUMsSUFBTixDQUFXO2dCQUFBLElBQUEsRUFBSyxJQUFJLENBQUMsSUFBVjtnQkFBZ0IsSUFBQSxFQUFLLEdBQXJCO2dCQUF5QixJQUFBLEVBQUssUUFBOUI7YUFBWDtZQUNBLElBQUMsQ0FBQSxLQUFNLENBQUEsSUFBSSxDQUFDLElBQUwsQ0FBUCxHQUFvQjtBQUZ4QjtRQUlBLEtBQUEsR0FBUSxJQUFJLENBQUMsR0FBTCxDQUFTLFNBQVQsRUFBbUIsU0FBbkI7QUFDUjtBQUFBLGFBQUEsd0NBQUE7O1lBQ0ksSUFBQSxHQUFPO1lBQ1AsS0FBSyxDQUFDLElBQU4sQ0FBVztnQkFBQSxJQUFBLEVBQU0sQ0FBTjtnQkFBUyxJQUFBLEVBQUssR0FBZDtnQkFBa0IsSUFBQSxFQUFLLE9BQXZCO2FBQVg7WUFDQSxJQUFDLENBQUEsS0FBTSxDQUFBLElBQUEsQ0FBUCxHQUFlO0FBSG5CO2VBS0E7SUFuQk87O21CQTJCWCxPQUFBLEdBQVMsU0FBQyxPQUFEO0FBRUwsWUFBQTtRQUFBLE9BQUEsR0FBVSxrQ0FBTSxPQUFOO1FBRVYsSUFBRyxVQUFVLENBQUMsSUFBWCxDQUFnQixPQUFoQixDQUFIO1lBQ0ksSUFBQSxHQUFPLFFBQUEsQ0FBUyxPQUFUO1lBQ1AsTUFBQSxHQUFTLElBQUMsQ0FBQSxlQUFELENBQUE7WUFDVCxJQUFxRCxjQUFyRDtBQUFBLHVCQUFLLE9BQUEsQ0FBRSxLQUFGLENBQVEsb0JBQUEsR0FBcUIsSUFBQyxDQUFBLFFBQTlCLEVBQUw7O1lBQ0EsSUFBRyxJQUFBLEdBQU8sQ0FBVjtnQkFDSSxJQUFBLEdBQU8sTUFBTSxDQUFDLFFBQVAsQ0FBQSxDQUFBLEdBQW9CLEtBRC9CO2FBQUEsTUFBQTtnQkFHSSxJQUFBLElBQVEsRUFIWjs7WUFJQSxJQUFBLEdBQU8sS0FBQSxDQUFNLENBQU4sRUFBUyxNQUFNLENBQUMsUUFBUCxDQUFBLENBQUEsR0FBa0IsQ0FBM0IsRUFBOEIsSUFBOUI7WUFDUCxNQUFNLENBQUMsaUJBQVAsQ0FBeUIsQ0FBQyxDQUFELEVBQUcsSUFBSCxDQUF6QixFQUFtQztnQkFBQSxNQUFBLEVBQVEsSUFBQyxDQUFBLElBQUQsS0FBUyxTQUFqQjthQUFuQztZQUNBLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBZCxDQUFBO21CQUNBO2dCQUFBLEtBQUEsRUFBTyxJQUFDLENBQUEsUUFBUjtnQkFDQSxDQUFBLEVBQUEsQ0FBQSxFQUFJLE9BQUEsR0FBUSxNQUFNLENBQUMsSUFEbkI7Y0FYSjtTQUFBLE1BYUssSUFBRyxPQUFPLENBQUMsTUFBWDtZQUNELElBQUEsaURBQXlCO1lBQ3pCLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBZCxDQUFxQixPQUFyQixFQUE4QjtnQkFBQSxJQUFBLEVBQUssSUFBTDtnQkFBVyxRQUFBLEVBQVUsSUFBckI7Z0JBQTJCLE1BQUEsRUFBUSxJQUFDLENBQUEsSUFBRCxLQUFTLFNBQTVDO2FBQTlCO21CQUNBO2dCQUFBLEtBQUEsRUFBTyxRQUFQO2dCQUNBLENBQUEsRUFBQSxDQUFBLEVBQUksYUFESjtjQUhDO1NBQUEsTUFBQTttQkFNRDtnQkFBQSxJQUFBLEVBQU0sRUFBTjtjQU5DOztJQWpCQTs7OztHQXhETTs7QUFpRm5CLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCBcbjAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMFxuMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDBcbiAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwIFxuIyMjXG5cbnsgXywgY2xhbXAsIHBvc3QgfSA9IHJlcXVpcmUgJ2t4aydcblxuQ29tbWFuZCA9IHJlcXVpcmUgJy4uL2NvbW1hbmRsaW5lL2NvbW1hbmQnXG5cbmNsYXNzIEdvdG8gZXh0ZW5kcyBDb21tYW5kXG5cbiAgICBAOiAoY29tbWFuZGxpbmUpIC0+XG4gICAgICAgIFxuICAgICAgICBzdXBlciBjb21tYW5kbGluZVxuICAgICAgICBcbiAgICAgICAgQG5hbWVzID0gWydnb3RvJyAnc2VsZWN0byddXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAgICAgXG4gICAgc3RhcnQ6IChuYW1lKSAtPlxuICAgICAgICBzdXBlciBuYW1lXG4gICAgICAgIEBzaG93TGlzdCgpXG4gICAgICAgIEBzaG93SXRlbXMgQGxpc3RJdGVtcygpIFxuICAgICAgICBAc2VsZWN0IDBcbiAgICAgICAgQHBvc2l0aW9uTGlzdCgpXG4gICAgICAgIHRleHQ6IEBjb21tYW5kTGlzdD8ubGluZSgwKSA/ICcnXG4gICAgICAgIHNlbGVjdDogdHJ1ZVxuICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCBcbiAgICAjIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwIFxuICAgIFxuICAgIGxpc3RJdGVtczogKCkgLT4gXG4gICAgICAgIFxuICAgICAgICBpdGVtcyA9IFtdXG4gICAgICAgIEB0eXBlcyA9IHt9XG4gICAgICAgIFxuICAgICAgICBmaWxlcyA9IHBvc3QuZ2V0ICdpbmRleGVyJyAnZmlsZXMnXG4gICAgICAgIGZ1bmNzID0gZmlsZXNbd2luZG93LmVkaXRvci5jdXJyZW50RmlsZV0/LmZ1bmNzXG4gICAgICAgIGZ1bmNzID89IFtdXG4gICAgICAgIFxuICAgICAgICBmb3IgZnVuYyBpbiBmdW5jc1xuICAgICAgICAgICAgaXRlbXMucHVzaCB0ZXh0OmZ1bmMubmFtZSwgbGluZTon4pa4JyBjbHNzOidtZXRob2QnXG4gICAgICAgICAgICBAdHlwZXNbZnVuYy5uYW1lXSA9ICdmdW5jJ1xuICAgICAgICAgICAgXG4gICAgICAgIGNsc3NzID0gcG9zdC5nZXQgJ2luZGV4ZXInICdjbGFzc2VzJ1xuICAgICAgICBmb3IgayBpbiBfLmtleXMgY2xzc3NcbiAgICAgICAgICAgIG5hbWUgPSBrXG4gICAgICAgICAgICBpdGVtcy5wdXNoIHRleHQ6IGssIGxpbmU6J+KXjycgY2xzczonY2xhc3MnXG4gICAgICAgICAgICBAdHlwZXNbbmFtZV0gPSAnY2xhc3MnXG4gICAgICAgICAgICBcbiAgICAgICAgaXRlbXNcblxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwXG4gICAgICAgIFxuICAgIGV4ZWN1dGU6IChjb21tYW5kKSAtPlxuICAgICAgICBcbiAgICAgICAgY29tbWFuZCA9IHN1cGVyIGNvbW1hbmRcbiAgICAgICAgXG4gICAgICAgIGlmIC9eXFwtP1xcZCskLy50ZXN0IGNvbW1hbmQgIyBnb3RvIGxpbmUgbnVtYmVyXG4gICAgICAgICAgICBsaW5lID0gcGFyc2VJbnQgY29tbWFuZFxuICAgICAgICAgICAgZWRpdG9yID0gQHJlY2VpdmluZ0VkaXRvcigpXG4gICAgICAgICAgICByZXR1cm4gZXJyb3IgXCJubyBlZGl0b3I/IGZvY3VzOiAje0ByZWNlaXZlcn1cIiBpZiBub3QgZWRpdG9yP1xuICAgICAgICAgICAgaWYgbGluZSA8IDBcbiAgICAgICAgICAgICAgICBsaW5lID0gZWRpdG9yLm51bUxpbmVzKCkgKyBsaW5lXG4gICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgIGxpbmUgLT0gMVxuICAgICAgICAgICAgbGluZSA9IGNsYW1wIDAsIGVkaXRvci5udW1MaW5lcygpLTEsIGxpbmVcbiAgICAgICAgICAgIGVkaXRvci5zaW5nbGVDdXJzb3JBdFBvcyBbMCxsaW5lXSwgZXh0ZW5kOiBAbmFtZSA9PSAnc2VsZWN0bydcbiAgICAgICAgICAgIGVkaXRvci5zY3JvbGwuY3Vyc29yVG9Ub3AoKVxuICAgICAgICAgICAgZm9jdXM6IEByZWNlaXZlclxuICAgICAgICAgICAgZG86IFwic2hvdyAje2VkaXRvci5uYW1lfVwiXG4gICAgICAgIGVsc2UgaWYgY29tbWFuZC5sZW5ndGhcbiAgICAgICAgICAgIHR5cGUgPSBAdHlwZXNbY29tbWFuZF0gPyAnZnVuYydcbiAgICAgICAgICAgIHdpbmRvdy5lZGl0b3IuanVtcFRvIGNvbW1hbmQsIHR5cGU6dHlwZSwgZG9udExpc3Q6IHRydWUsIGV4dGVuZDogQG5hbWUgPT0gJ3NlbGVjdG8nXG4gICAgICAgICAgICBmb2N1czogJ2VkaXRvcidcbiAgICAgICAgICAgIGRvOiBcInNob3cgZWRpdG9yXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGV4dDogJydcbiAgICAgICAgICAgICAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEdvdG9cbiJdfQ==
//# sourceURL=../../coffee/commands/goto.coffee