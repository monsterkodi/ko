// koffee 1.4.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ290by5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsa0NBQUE7SUFBQTs7O0FBUUEsTUFBcUIsT0FBQSxDQUFRLEtBQVIsQ0FBckIsRUFBRSxlQUFGLEVBQVEsaUJBQVIsRUFBZTs7QUFFZixPQUFBLEdBQVUsT0FBQSxDQUFRLHdCQUFSOztBQUVKOzs7SUFFQyxjQUFDLFdBQUQ7UUFFQyxzQ0FBTSxXQUFOO1FBRUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxDQUFDLE1BQUQsRUFBUyxTQUFUO0lBSlY7O21CQVlILEtBQUEsR0FBTyxTQUFDLElBQUQ7UUFDSCxnQ0FBTSxJQUFOO1FBQ0EsSUFBQyxDQUFBLFFBQUQsQ0FBQTtRQUNBLElBQUMsQ0FBQSxTQUFELENBQVcsSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFYO1FBQ0EsSUFBQyxDQUFBLE1BQUQsQ0FBUSxDQUFSO1FBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBQTtlQUNBO1lBQUEsSUFBQSxFQUFNLElBQUMsQ0FBQSxXQUFXLENBQUMsSUFBYixDQUFrQixDQUFsQixDQUFOO1lBQ0EsTUFBQSxFQUFRLElBRFI7O0lBTkc7O21CQWVQLFNBQUEsR0FBVyxTQUFBO0FBRVAsWUFBQTtRQUFBLEtBQUEsR0FBUTtRQUNSLElBQUMsQ0FBQSxLQUFELEdBQVM7UUFFVCxLQUFBLEdBQVEsSUFBSSxDQUFDLEdBQUwsQ0FBUyxTQUFULEVBQW1CLE9BQW5CO1FBQ1IsS0FBQSwyREFBd0MsQ0FBRTs7WUFDMUM7O1lBQUEsUUFBUzs7QUFFVCxhQUFBLHVDQUFBOztZQUNJLEtBQUssQ0FBQyxJQUFOLENBQVc7Z0JBQUEsSUFBQSxFQUFLLElBQUksQ0FBQyxJQUFWO2dCQUFnQixJQUFBLEVBQUssR0FBckI7Z0JBQXlCLElBQUEsRUFBSyxRQUE5QjthQUFYO1lBQ0EsSUFBQyxDQUFBLEtBQU0sQ0FBQSxJQUFJLENBQUMsSUFBTCxDQUFQLEdBQW9CO0FBRnhCO1FBSUEsS0FBQSxHQUFRLElBQUksQ0FBQyxHQUFMLENBQVMsU0FBVCxFQUFtQixTQUFuQjtBQUNSO0FBQUEsYUFBQSx3Q0FBQTs7WUFDSSxJQUFBLEdBQU87WUFDUCxLQUFLLENBQUMsSUFBTixDQUFXO2dCQUFBLElBQUEsRUFBTSxDQUFOO2dCQUFTLElBQUEsRUFBSyxHQUFkO2dCQUFrQixJQUFBLEVBQUssT0FBdkI7YUFBWDtZQUNBLElBQUMsQ0FBQSxLQUFNLENBQUEsSUFBQSxDQUFQLEdBQWU7QUFIbkI7ZUFLQTtJQW5CTzs7bUJBMkJYLE9BQUEsR0FBUyxTQUFDLE9BQUQ7QUFFTCxZQUFBO1FBQUEsT0FBQSxHQUFVLGtDQUFNLE9BQU47UUFFVixJQUFHLFVBQVUsQ0FBQyxJQUFYLENBQWdCLE9BQWhCLENBQUg7WUFDSSxJQUFBLEdBQU8sUUFBQSxDQUFTLE9BQVQ7WUFDUCxNQUFBLEdBQVMsSUFBQyxDQUFBLGVBQUQsQ0FBQTtZQUNULElBQXFELGNBQXJEO0FBQUEsdUJBQUssT0FBQSxDQUFFLEtBQUYsQ0FBUSxvQkFBQSxHQUFxQixJQUFDLENBQUEsUUFBOUIsRUFBTDs7WUFDQSxJQUFHLElBQUEsR0FBTyxDQUFWO2dCQUNJLElBQUEsR0FBTyxNQUFNLENBQUMsUUFBUCxDQUFBLENBQUEsR0FBb0IsS0FEL0I7YUFBQSxNQUFBO2dCQUdJLElBQUEsSUFBUSxFQUhaOztZQUlBLElBQUEsR0FBTyxLQUFBLENBQU0sQ0FBTixFQUFTLE1BQU0sQ0FBQyxRQUFQLENBQUEsQ0FBQSxHQUFrQixDQUEzQixFQUE4QixJQUE5QjtZQUNQLE1BQU0sQ0FBQyxpQkFBUCxDQUF5QixDQUFDLENBQUQsRUFBRyxJQUFILENBQXpCLEVBQW1DO2dCQUFBLE1BQUEsRUFBUSxJQUFDLENBQUEsSUFBRCxLQUFTLFNBQWpCO2FBQW5DO1lBQ0EsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFkLENBQUE7bUJBQ0E7Z0JBQUEsS0FBQSxFQUFPLElBQUMsQ0FBQSxRQUFSO2dCQUNBLENBQUEsRUFBQSxDQUFBLEVBQUksT0FBQSxHQUFRLE1BQU0sQ0FBQyxJQURuQjtjQVhKO1NBQUEsTUFhSyxJQUFHLE9BQU8sQ0FBQyxNQUFYO1lBQ0QsSUFBQSxpREFBeUI7WUFDekIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFkLENBQXFCLE9BQXJCLEVBQThCO2dCQUFBLElBQUEsRUFBSyxJQUFMO2dCQUFXLFFBQUEsRUFBVSxJQUFyQjtnQkFBMkIsTUFBQSxFQUFRLElBQUMsQ0FBQSxJQUFELEtBQVMsU0FBNUM7YUFBOUI7bUJBQ0E7Z0JBQUEsS0FBQSxFQUFPLFFBQVA7Z0JBQ0EsQ0FBQSxFQUFBLENBQUEsRUFBSSxhQURKO2NBSEM7U0FBQSxNQUFBO21CQU1EO2dCQUFBLElBQUEsRUFBTSxFQUFOO2NBTkM7O0lBakJBOzs7O0dBeERNOztBQWlGbkIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwIFxuMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4wMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMFxuIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgXG4jIyNcblxueyBwb3N0LCBjbGFtcCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Db21tYW5kID0gcmVxdWlyZSAnLi4vY29tbWFuZGxpbmUvY29tbWFuZCdcblxuY2xhc3MgR290byBleHRlbmRzIENvbW1hbmRcblxuICAgIEA6IChjb21tYW5kbGluZSkgLT5cbiAgICAgICAgXG4gICAgICAgIHN1cGVyIGNvbW1hbmRsaW5lXG4gICAgICAgIFxuICAgICAgICBAbmFtZXMgPSBbJ2dvdG8nLCAnc2VsZWN0byddXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAgICAgXG4gICAgc3RhcnQ6IChuYW1lKSAtPlxuICAgICAgICBzdXBlciBuYW1lXG4gICAgICAgIEBzaG93TGlzdCgpXG4gICAgICAgIEBzaG93SXRlbXMgQGxpc3RJdGVtcygpIFxuICAgICAgICBAc2VsZWN0IDBcbiAgICAgICAgQHBvc2l0aW9uTGlzdCgpXG4gICAgICAgIHRleHQ6IEBjb21tYW5kTGlzdC5saW5lKDApXG4gICAgICAgIHNlbGVjdDogdHJ1ZVxuICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCBcbiAgICAjIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwIFxuICAgIFxuICAgIGxpc3RJdGVtczogKCkgLT4gXG4gICAgICAgIFxuICAgICAgICBpdGVtcyA9IFtdXG4gICAgICAgIEB0eXBlcyA9IHt9XG4gICAgICAgIFxuICAgICAgICBmaWxlcyA9IHBvc3QuZ2V0ICdpbmRleGVyJyAnZmlsZXMnXG4gICAgICAgIGZ1bmNzID0gZmlsZXNbd2luZG93LmVkaXRvci5jdXJyZW50RmlsZV0/LmZ1bmNzXG4gICAgICAgIGZ1bmNzID89IFtdXG4gICAgICAgIFxuICAgICAgICBmb3IgZnVuYyBpbiBmdW5jc1xuICAgICAgICAgICAgaXRlbXMucHVzaCB0ZXh0OmZ1bmMubmFtZSwgbGluZTon4pa4JyBjbHNzOidtZXRob2QnXG4gICAgICAgICAgICBAdHlwZXNbZnVuYy5uYW1lXSA9ICdmdW5jJ1xuICAgICAgICAgICAgXG4gICAgICAgIGNsc3NzID0gcG9zdC5nZXQgJ2luZGV4ZXInICdjbGFzc2VzJ1xuICAgICAgICBmb3IgayBpbiBfLmtleXMgY2xzc3NcbiAgICAgICAgICAgIG5hbWUgPSBrXG4gICAgICAgICAgICBpdGVtcy5wdXNoIHRleHQ6IGssIGxpbmU6J+KXjycgY2xzczonY2xhc3MnXG4gICAgICAgICAgICBAdHlwZXNbbmFtZV0gPSAnY2xhc3MnXG4gICAgICAgICAgICBcbiAgICAgICAgaXRlbXNcblxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwXG4gICAgICAgIFxuICAgIGV4ZWN1dGU6IChjb21tYW5kKSAtPlxuICAgICAgICBcbiAgICAgICAgY29tbWFuZCA9IHN1cGVyIGNvbW1hbmRcbiAgICAgICAgXG4gICAgICAgIGlmIC9eXFwtP1xcZCskLy50ZXN0IGNvbW1hbmQgIyBnb3RvIGxpbmUgbnVtYmVyXG4gICAgICAgICAgICBsaW5lID0gcGFyc2VJbnQgY29tbWFuZFxuICAgICAgICAgICAgZWRpdG9yID0gQHJlY2VpdmluZ0VkaXRvcigpXG4gICAgICAgICAgICByZXR1cm4gZXJyb3IgXCJubyBlZGl0b3I/IGZvY3VzOiAje0ByZWNlaXZlcn1cIiBpZiBub3QgZWRpdG9yP1xuICAgICAgICAgICAgaWYgbGluZSA8IDBcbiAgICAgICAgICAgICAgICBsaW5lID0gZWRpdG9yLm51bUxpbmVzKCkgKyBsaW5lXG4gICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgIGxpbmUgLT0gMVxuICAgICAgICAgICAgbGluZSA9IGNsYW1wIDAsIGVkaXRvci5udW1MaW5lcygpLTEsIGxpbmVcbiAgICAgICAgICAgIGVkaXRvci5zaW5nbGVDdXJzb3JBdFBvcyBbMCxsaW5lXSwgZXh0ZW5kOiBAbmFtZSA9PSAnc2VsZWN0bydcbiAgICAgICAgICAgIGVkaXRvci5zY3JvbGwuY3Vyc29yVG9Ub3AoKVxuICAgICAgICAgICAgZm9jdXM6IEByZWNlaXZlclxuICAgICAgICAgICAgZG86IFwic2hvdyAje2VkaXRvci5uYW1lfVwiXG4gICAgICAgIGVsc2UgaWYgY29tbWFuZC5sZW5ndGhcbiAgICAgICAgICAgIHR5cGUgPSBAdHlwZXNbY29tbWFuZF0gPyAnZnVuYydcbiAgICAgICAgICAgIHdpbmRvdy5lZGl0b3IuanVtcFRvIGNvbW1hbmQsIHR5cGU6dHlwZSwgZG9udExpc3Q6IHRydWUsIGV4dGVuZDogQG5hbWUgPT0gJ3NlbGVjdG8nXG4gICAgICAgICAgICBmb2N1czogJ2VkaXRvcidcbiAgICAgICAgICAgIGRvOiBcInNob3cgZWRpdG9yXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGV4dDogJydcbiAgICAgICAgICAgICAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEdvdG9cbiJdfQ==
//# sourceURL=../../coffee/commands/goto.coffee