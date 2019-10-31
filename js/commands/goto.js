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

ref = require('kxk'), clamp = ref.clamp, post = ref.post, _ = ref._;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ290by5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsa0NBQUE7SUFBQTs7O0FBUUEsTUFBcUIsT0FBQSxDQUFRLEtBQVIsQ0FBckIsRUFBRSxpQkFBRixFQUFTLGVBQVQsRUFBZTs7QUFFZixPQUFBLEdBQVUsT0FBQSxDQUFRLHdCQUFSOztBQUVKOzs7SUFFQyxjQUFDLFdBQUQ7UUFFQyxzQ0FBTSxXQUFOO1FBRUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxDQUFDLE1BQUQsRUFBUyxTQUFUO0lBSlY7O21CQVlILEtBQUEsR0FBTyxTQUFDLElBQUQ7UUFDSCxnQ0FBTSxJQUFOO1FBQ0EsSUFBQyxDQUFBLFFBQUQsQ0FBQTtRQUNBLElBQUMsQ0FBQSxTQUFELENBQVcsSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFYO1FBQ0EsSUFBQyxDQUFBLE1BQUQsQ0FBUSxDQUFSO1FBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBQTtlQUNBO1lBQUEsSUFBQSxFQUFNLElBQUMsQ0FBQSxXQUFXLENBQUMsSUFBYixDQUFrQixDQUFsQixDQUFOO1lBQ0EsTUFBQSxFQUFRLElBRFI7O0lBTkc7O21CQWVQLFNBQUEsR0FBVyxTQUFBO0FBRVAsWUFBQTtRQUFBLEtBQUEsR0FBUTtRQUNSLElBQUMsQ0FBQSxLQUFELEdBQVM7UUFFVCxLQUFBLEdBQVEsSUFBSSxDQUFDLEdBQUwsQ0FBUyxTQUFULEVBQW9CLE9BQXBCO1FBQ1IsS0FBQSwyREFBd0MsQ0FBRTs7WUFDMUM7O1lBQUEsUUFBUzs7QUFFVCxhQUFBLHVDQUFBOztZQUNJLEtBQUssQ0FBQyxJQUFOLENBQVc7Z0JBQUEsSUFBQSxFQUFLLElBQUksQ0FBQyxJQUFWO2dCQUFnQixJQUFBLEVBQUssR0FBckI7Z0JBQTBCLElBQUEsRUFBSyxRQUEvQjthQUFYO1lBQ0EsSUFBQyxDQUFBLEtBQU0sQ0FBQSxJQUFJLENBQUMsSUFBTCxDQUFQLEdBQW9CO0FBRnhCO1FBSUEsS0FBQSxHQUFRLElBQUksQ0FBQyxHQUFMLENBQVMsU0FBVCxFQUFvQixTQUFwQjtBQUNSO0FBQUEsYUFBQSx3Q0FBQTs7WUFDSSxJQUFBLEdBQU87WUFDUCxLQUFLLENBQUMsSUFBTixDQUFXO2dCQUFBLElBQUEsRUFBTSxDQUFOO2dCQUFTLElBQUEsRUFBSyxHQUFkO2dCQUFtQixJQUFBLEVBQUssT0FBeEI7YUFBWDtZQUNBLElBQUMsQ0FBQSxLQUFNLENBQUEsSUFBQSxDQUFQLEdBQWU7QUFIbkI7ZUFLQTtJQW5CTzs7bUJBMkJYLE9BQUEsR0FBUyxTQUFDLE9BQUQ7QUFFTCxZQUFBO1FBQUEsT0FBQSxHQUFVLGtDQUFNLE9BQU47UUFFVixJQUFHLFVBQVUsQ0FBQyxJQUFYLENBQWdCLE9BQWhCLENBQUg7WUFDSSxJQUFBLEdBQU8sUUFBQSxDQUFTLE9BQVQ7WUFDUCxNQUFBLEdBQVMsSUFBQyxDQUFBLGVBQUQsQ0FBQTtZQUNULElBQXFELGNBQXJEO0FBQUEsdUJBQUssT0FBQSxDQUFFLEtBQUYsQ0FBUSxvQkFBQSxHQUFxQixJQUFDLENBQUEsUUFBOUIsRUFBTDs7WUFDQSxJQUFHLElBQUEsR0FBTyxDQUFWO2dCQUNJLElBQUEsR0FBTyxNQUFNLENBQUMsUUFBUCxDQUFBLENBQUEsR0FBb0IsS0FEL0I7YUFBQSxNQUFBO2dCQUdJLElBQUEsSUFBUSxFQUhaOztZQUlBLElBQUEsR0FBTyxLQUFBLENBQU0sQ0FBTixFQUFTLE1BQU0sQ0FBQyxRQUFQLENBQUEsQ0FBQSxHQUFrQixDQUEzQixFQUE4QixJQUE5QjtZQUNQLE1BQU0sQ0FBQyxpQkFBUCxDQUF5QixDQUFDLENBQUQsRUFBRyxJQUFILENBQXpCLEVBQW1DO2dCQUFBLE1BQUEsRUFBUSxJQUFDLENBQUEsSUFBRCxLQUFTLFNBQWpCO2FBQW5DO1lBQ0EsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFkLENBQUE7bUJBQ0E7Z0JBQUEsS0FBQSxFQUFPLElBQUMsQ0FBQSxRQUFSO2dCQUNBLENBQUEsRUFBQSxDQUFBLEVBQUksT0FBQSxHQUFRLE1BQU0sQ0FBQyxJQURuQjtjQVhKO1NBQUEsTUFhSyxJQUFHLE9BQU8sQ0FBQyxNQUFYO1lBQ0QsSUFBQSxpREFBeUI7WUFDekIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFkLENBQXFCLE9BQXJCLEVBQThCO2dCQUFBLElBQUEsRUFBSyxJQUFMO2dCQUFXLFFBQUEsRUFBVSxJQUFyQjtnQkFBMkIsTUFBQSxFQUFRLElBQUMsQ0FBQSxJQUFELEtBQVMsU0FBNUM7YUFBOUI7bUJBQ0E7Z0JBQUEsS0FBQSxFQUFPLFFBQVA7Z0JBQ0EsQ0FBQSxFQUFBLENBQUEsRUFBSSxhQURKO2NBSEM7U0FBQSxNQUFBO21CQU1EO2dCQUFBLElBQUEsRUFBTSxFQUFOO2NBTkM7O0lBakJBOzs7O0dBeERNOztBQWlGbkIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwIFxuMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4wMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMFxuIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgXG4jIyNcblxueyBjbGFtcCwgcG9zdCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Db21tYW5kID0gcmVxdWlyZSAnLi4vY29tbWFuZGxpbmUvY29tbWFuZCdcblxuY2xhc3MgR290byBleHRlbmRzIENvbW1hbmRcblxuICAgIEA6IChjb21tYW5kbGluZSkgLT5cbiAgICAgICAgXG4gICAgICAgIHN1cGVyIGNvbW1hbmRsaW5lXG4gICAgICAgIFxuICAgICAgICBAbmFtZXMgPSBbJ2dvdG8nLCAnc2VsZWN0byddXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAgICAgXG4gICAgc3RhcnQ6IChuYW1lKSAtPlxuICAgICAgICBzdXBlciBuYW1lXG4gICAgICAgIEBzaG93TGlzdCgpXG4gICAgICAgIEBzaG93SXRlbXMgQGxpc3RJdGVtcygpIFxuICAgICAgICBAc2VsZWN0IDBcbiAgICAgICAgQHBvc2l0aW9uTGlzdCgpXG4gICAgICAgIHRleHQ6IEBjb21tYW5kTGlzdC5saW5lKDApXG4gICAgICAgIHNlbGVjdDogdHJ1ZVxuICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCBcbiAgICAjIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwIFxuICAgIFxuICAgIGxpc3RJdGVtczogKCkgLT4gXG4gICAgICAgIFxuICAgICAgICBpdGVtcyA9IFtdXG4gICAgICAgIEB0eXBlcyA9IHt9XG4gICAgICAgIFxuICAgICAgICBmaWxlcyA9IHBvc3QuZ2V0ICdpbmRleGVyJywgJ2ZpbGVzJ1xuICAgICAgICBmdW5jcyA9IGZpbGVzW3dpbmRvdy5lZGl0b3IuY3VycmVudEZpbGVdPy5mdW5jc1xuICAgICAgICBmdW5jcyA/PSBbXVxuICAgICAgICBcbiAgICAgICAgZm9yIGZ1bmMgaW4gZnVuY3NcbiAgICAgICAgICAgIGl0ZW1zLnB1c2ggdGV4dDpmdW5jLm5hbWUsIGxpbmU6J+KWuCcsIGNsc3M6J21ldGhvZCdcbiAgICAgICAgICAgIEB0eXBlc1tmdW5jLm5hbWVdID0gJ2Z1bmMnXG4gICAgICAgICAgICBcbiAgICAgICAgY2xzc3MgPSBwb3N0LmdldCAnaW5kZXhlcicsICdjbGFzc2VzJ1xuICAgICAgICBmb3IgayBpbiBfLmtleXMgY2xzc3NcbiAgICAgICAgICAgIG5hbWUgPSBrXG4gICAgICAgICAgICBpdGVtcy5wdXNoIHRleHQ6IGssIGxpbmU6J+KXjycsIGNsc3M6J2NsYXNzJ1xuICAgICAgICAgICAgQHR5cGVzW25hbWVdID0gJ2NsYXNzJ1xuICAgICAgICAgICAgXG4gICAgICAgIGl0ZW1zXG5cbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMFxuICAgICAgICBcbiAgICBleGVjdXRlOiAoY29tbWFuZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGNvbW1hbmQgPSBzdXBlciBjb21tYW5kXG4gICAgICAgIFxuICAgICAgICBpZiAvXlxcLT9cXGQrJC8udGVzdCBjb21tYW5kICMgZ290byBsaW5lIG51bWJlclxuICAgICAgICAgICAgbGluZSA9IHBhcnNlSW50IGNvbW1hbmRcbiAgICAgICAgICAgIGVkaXRvciA9IEByZWNlaXZpbmdFZGl0b3IoKVxuICAgICAgICAgICAgcmV0dXJuIGVycm9yIFwibm8gZWRpdG9yPyBmb2N1czogI3tAcmVjZWl2ZXJ9XCIgaWYgbm90IGVkaXRvcj9cbiAgICAgICAgICAgIGlmIGxpbmUgPCAwXG4gICAgICAgICAgICAgICAgbGluZSA9IGVkaXRvci5udW1MaW5lcygpICsgbGluZVxuICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICBsaW5lIC09IDFcbiAgICAgICAgICAgIGxpbmUgPSBjbGFtcCAwLCBlZGl0b3IubnVtTGluZXMoKS0xLCBsaW5lXG4gICAgICAgICAgICBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRQb3MgWzAsbGluZV0sIGV4dGVuZDogQG5hbWUgPT0gJ3NlbGVjdG8nXG4gICAgICAgICAgICBlZGl0b3Iuc2Nyb2xsLmN1cnNvclRvVG9wKClcbiAgICAgICAgICAgIGZvY3VzOiBAcmVjZWl2ZXJcbiAgICAgICAgICAgIGRvOiBcInNob3cgI3tlZGl0b3IubmFtZX1cIlxuICAgICAgICBlbHNlIGlmIGNvbW1hbmQubGVuZ3RoXG4gICAgICAgICAgICB0eXBlID0gQHR5cGVzW2NvbW1hbmRdID8gJ2Z1bmMnXG4gICAgICAgICAgICB3aW5kb3cuZWRpdG9yLmp1bXBUbyBjb21tYW5kLCB0eXBlOnR5cGUsIGRvbnRMaXN0OiB0cnVlLCBleHRlbmQ6IEBuYW1lID09ICdzZWxlY3RvJ1xuICAgICAgICAgICAgZm9jdXM6ICdlZGl0b3InXG4gICAgICAgICAgICBkbzogXCJzaG93IGVkaXRvclwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRleHQ6ICcnXG4gICAgICAgICAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBHb3RvXG4iXX0=
//# sourceURL=../../coffee/commands/goto.coffee