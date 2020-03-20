// koffee 1.12.0

/*
 0000000    0000000   000000000   0000000 
000        000   000     000     000   000
000  0000  000   000     000     000   000
000   000  000   000     000     000   000
 0000000    0000000      000      0000000
 */
var Command, Goto, _, clamp, post, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), post = ref.post, clamp = ref.clamp, _ = ref._;

Command = require('../commandline/command');

Goto = (function(superClass) {
    extend(Goto, superClass);

    function Goto(commandline) {
        Goto.__super__.constructor.call(this, commandline);
        this.names = ['goto', 'selecto'];
    }

    Goto.prototype.start = function(name) {
        Goto.__super__.start.call(this, name);
        this.showList();
        this.showItems(this.listItems());
        this.select(0);
        this.positionList();
        return {
            text: this.commandList.line(0),
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ290by5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvY29tbWFuZHMiLCJzb3VyY2VzIjpbImdvdG8uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGtDQUFBO0lBQUE7OztBQVFBLE1BQXFCLE9BQUEsQ0FBUSxLQUFSLENBQXJCLEVBQUUsZUFBRixFQUFRLGlCQUFSLEVBQWU7O0FBRWYsT0FBQSxHQUFVLE9BQUEsQ0FBUSx3QkFBUjs7QUFFSjs7O0lBRUMsY0FBQyxXQUFEO1FBRUMsc0NBQU0sV0FBTjtRQUVBLElBQUMsQ0FBQSxLQUFELEdBQVMsQ0FBQyxNQUFELEVBQVMsU0FBVDtJQUpWOzttQkFZSCxLQUFBLEdBQU8sU0FBQyxJQUFEO1FBQ0gsZ0NBQU0sSUFBTjtRQUNBLElBQUMsQ0FBQSxRQUFELENBQUE7UUFDQSxJQUFDLENBQUEsU0FBRCxDQUFXLElBQUMsQ0FBQSxTQUFELENBQUEsQ0FBWDtRQUNBLElBQUMsQ0FBQSxNQUFELENBQVEsQ0FBUjtRQUNBLElBQUMsQ0FBQSxZQUFELENBQUE7ZUFDQTtZQUFBLElBQUEsRUFBTSxJQUFDLENBQUEsV0FBVyxDQUFDLElBQWIsQ0FBa0IsQ0FBbEIsQ0FBTjtZQUNBLE1BQUEsRUFBUSxJQURSOztJQU5HOzttQkFlUCxTQUFBLEdBQVcsU0FBQTtBQUVQLFlBQUE7UUFBQSxLQUFBLEdBQVE7UUFDUixJQUFDLENBQUEsS0FBRCxHQUFTO1FBRVQsS0FBQSxHQUFRLElBQUksQ0FBQyxHQUFMLENBQVMsU0FBVCxFQUFtQixPQUFuQjtRQUNSLEtBQUEsMkRBQXdDLENBQUU7O1lBQzFDOztZQUFBLFFBQVM7O0FBRVQsYUFBQSx1Q0FBQTs7WUFDSSxLQUFLLENBQUMsSUFBTixDQUFXO2dCQUFBLElBQUEsRUFBSyxJQUFJLENBQUMsSUFBVjtnQkFBZ0IsSUFBQSxFQUFLLEdBQXJCO2dCQUF5QixJQUFBLEVBQUssUUFBOUI7YUFBWDtZQUNBLElBQUMsQ0FBQSxLQUFNLENBQUEsSUFBSSxDQUFDLElBQUwsQ0FBUCxHQUFvQjtBQUZ4QjtRQUlBLEtBQUEsR0FBUSxJQUFJLENBQUMsR0FBTCxDQUFTLFNBQVQsRUFBbUIsU0FBbkI7QUFDUjtBQUFBLGFBQUEsd0NBQUE7O1lBQ0ksSUFBQSxHQUFPO1lBQ1AsS0FBSyxDQUFDLElBQU4sQ0FBVztnQkFBQSxJQUFBLEVBQU0sQ0FBTjtnQkFBUyxJQUFBLEVBQUssR0FBZDtnQkFBa0IsSUFBQSxFQUFLLE9BQXZCO2FBQVg7WUFDQSxJQUFDLENBQUEsS0FBTSxDQUFBLElBQUEsQ0FBUCxHQUFlO0FBSG5CO2VBS0E7SUFuQk87O21CQTJCWCxPQUFBLEdBQVMsU0FBQyxPQUFEO0FBRUwsWUFBQTtRQUFBLE9BQUEsR0FBVSxrQ0FBTSxPQUFOO1FBRVYsSUFBRyxVQUFVLENBQUMsSUFBWCxDQUFnQixPQUFoQixDQUFIO1lBQ0ksSUFBQSxHQUFPLFFBQUEsQ0FBUyxPQUFUO1lBQ1AsTUFBQSxHQUFTLElBQUMsQ0FBQSxlQUFELENBQUE7WUFDVCxJQUFxRCxjQUFyRDtBQUFBLHVCQUFLLE9BQUEsQ0FBRSxLQUFGLENBQVEsb0JBQUEsR0FBcUIsSUFBQyxDQUFBLFFBQTlCLEVBQUw7O1lBQ0EsSUFBRyxJQUFBLEdBQU8sQ0FBVjtnQkFDSSxJQUFBLEdBQU8sTUFBTSxDQUFDLFFBQVAsQ0FBQSxDQUFBLEdBQW9CLEtBRC9CO2FBQUEsTUFBQTtnQkFHSSxJQUFBLElBQVEsRUFIWjs7WUFJQSxJQUFBLEdBQU8sS0FBQSxDQUFNLENBQU4sRUFBUyxNQUFNLENBQUMsUUFBUCxDQUFBLENBQUEsR0FBa0IsQ0FBM0IsRUFBOEIsSUFBOUI7WUFDUCxNQUFNLENBQUMsaUJBQVAsQ0FBeUIsQ0FBQyxDQUFELEVBQUcsSUFBSCxDQUF6QixFQUFtQztnQkFBQSxNQUFBLEVBQVEsSUFBQyxDQUFBLElBQUQsS0FBUyxTQUFqQjthQUFuQztZQUNBLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBZCxDQUFBO21CQUNBO2dCQUFBLEtBQUEsRUFBTyxJQUFDLENBQUEsUUFBUjtnQkFDQSxDQUFBLEVBQUEsQ0FBQSxFQUFJLE9BQUEsR0FBUSxNQUFNLENBQUMsSUFEbkI7Y0FYSjtTQUFBLE1BYUssSUFBRyxPQUFPLENBQUMsTUFBWDtZQUNELElBQUEsaURBQXlCO1lBQ3pCLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBZCxDQUFxQixPQUFyQixFQUE4QjtnQkFBQSxJQUFBLEVBQUssSUFBTDtnQkFBVyxRQUFBLEVBQVUsSUFBckI7Z0JBQTJCLE1BQUEsRUFBUSxJQUFDLENBQUEsSUFBRCxLQUFTLFNBQTVDO2FBQTlCO21CQUNBO2dCQUFBLEtBQUEsRUFBTyxRQUFQO2dCQUNBLENBQUEsRUFBQSxDQUFBLEVBQUksYUFESjtjQUhDO1NBQUEsTUFBQTttQkFNRDtnQkFBQSxJQUFBLEVBQU0sRUFBTjtjQU5DOztJQWpCQTs7OztHQXhETTs7QUFpRm5CLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCBcbjAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMFxuMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDBcbiAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwIFxuIyMjXG5cbnsgcG9zdCwgY2xhbXAsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuQ29tbWFuZCA9IHJlcXVpcmUgJy4uL2NvbW1hbmRsaW5lL2NvbW1hbmQnXG5cbmNsYXNzIEdvdG8gZXh0ZW5kcyBDb21tYW5kXG5cbiAgICBAOiAoY29tbWFuZGxpbmUpIC0+XG4gICAgICAgIFxuICAgICAgICBzdXBlciBjb21tYW5kbGluZVxuICAgICAgICBcbiAgICAgICAgQG5hbWVzID0gWydnb3RvJywgJ3NlbGVjdG8nXVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgICAgIFxuICAgIHN0YXJ0OiAobmFtZSkgLT5cbiAgICAgICAgc3VwZXIgbmFtZVxuICAgICAgICBAc2hvd0xpc3QoKVxuICAgICAgICBAc2hvd0l0ZW1zIEBsaXN0SXRlbXMoKSBcbiAgICAgICAgQHNlbGVjdCAwXG4gICAgICAgIEBwb3NpdGlvbkxpc3QoKVxuICAgICAgICB0ZXh0OiBAY29tbWFuZExpc3QubGluZSgwKVxuICAgICAgICBzZWxlY3Q6IHRydWVcbiAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCBcbiAgICBcbiAgICBsaXN0SXRlbXM6ICgpIC0+IFxuICAgICAgICBcbiAgICAgICAgaXRlbXMgPSBbXVxuICAgICAgICBAdHlwZXMgPSB7fVxuICAgICAgICBcbiAgICAgICAgZmlsZXMgPSBwb3N0LmdldCAnaW5kZXhlcicgJ2ZpbGVzJ1xuICAgICAgICBmdW5jcyA9IGZpbGVzW3dpbmRvdy5lZGl0b3IuY3VycmVudEZpbGVdPy5mdW5jc1xuICAgICAgICBmdW5jcyA/PSBbXVxuICAgICAgICBcbiAgICAgICAgZm9yIGZ1bmMgaW4gZnVuY3NcbiAgICAgICAgICAgIGl0ZW1zLnB1c2ggdGV4dDpmdW5jLm5hbWUsIGxpbmU6J+KWuCcgY2xzczonbWV0aG9kJ1xuICAgICAgICAgICAgQHR5cGVzW2Z1bmMubmFtZV0gPSAnZnVuYydcbiAgICAgICAgICAgIFxuICAgICAgICBjbHNzcyA9IHBvc3QuZ2V0ICdpbmRleGVyJyAnY2xhc3NlcydcbiAgICAgICAgZm9yIGsgaW4gXy5rZXlzIGNsc3NzXG4gICAgICAgICAgICBuYW1lID0ga1xuICAgICAgICAgICAgaXRlbXMucHVzaCB0ZXh0OiBrLCBsaW5lOifil48nIGNsc3M6J2NsYXNzJ1xuICAgICAgICAgICAgQHR5cGVzW25hbWVdID0gJ2NsYXNzJ1xuICAgICAgICAgICAgXG4gICAgICAgIGl0ZW1zXG5cbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMFxuICAgICAgICBcbiAgICBleGVjdXRlOiAoY29tbWFuZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGNvbW1hbmQgPSBzdXBlciBjb21tYW5kXG4gICAgICAgIFxuICAgICAgICBpZiAvXlxcLT9cXGQrJC8udGVzdCBjb21tYW5kICMgZ290byBsaW5lIG51bWJlclxuICAgICAgICAgICAgbGluZSA9IHBhcnNlSW50IGNvbW1hbmRcbiAgICAgICAgICAgIGVkaXRvciA9IEByZWNlaXZpbmdFZGl0b3IoKVxuICAgICAgICAgICAgcmV0dXJuIGVycm9yIFwibm8gZWRpdG9yPyBmb2N1czogI3tAcmVjZWl2ZXJ9XCIgaWYgbm90IGVkaXRvcj9cbiAgICAgICAgICAgIGlmIGxpbmUgPCAwXG4gICAgICAgICAgICAgICAgbGluZSA9IGVkaXRvci5udW1MaW5lcygpICsgbGluZVxuICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICBsaW5lIC09IDFcbiAgICAgICAgICAgIGxpbmUgPSBjbGFtcCAwLCBlZGl0b3IubnVtTGluZXMoKS0xLCBsaW5lXG4gICAgICAgICAgICBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRQb3MgWzAsbGluZV0sIGV4dGVuZDogQG5hbWUgPT0gJ3NlbGVjdG8nXG4gICAgICAgICAgICBlZGl0b3Iuc2Nyb2xsLmN1cnNvclRvVG9wKClcbiAgICAgICAgICAgIGZvY3VzOiBAcmVjZWl2ZXJcbiAgICAgICAgICAgIGRvOiBcInNob3cgI3tlZGl0b3IubmFtZX1cIlxuICAgICAgICBlbHNlIGlmIGNvbW1hbmQubGVuZ3RoXG4gICAgICAgICAgICB0eXBlID0gQHR5cGVzW2NvbW1hbmRdID8gJ2Z1bmMnXG4gICAgICAgICAgICB3aW5kb3cuZWRpdG9yLmp1bXBUbyBjb21tYW5kLCB0eXBlOnR5cGUsIGRvbnRMaXN0OiB0cnVlLCBleHRlbmQ6IEBuYW1lID09ICdzZWxlY3RvJ1xuICAgICAgICAgICAgZm9jdXM6ICdlZGl0b3InXG4gICAgICAgICAgICBkbzogXCJzaG93IGVkaXRvclwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRleHQ6ICcnXG4gICAgICAgICAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBHb3RvXG4iXX0=
//# sourceURL=../../coffee/commands/goto.coffee