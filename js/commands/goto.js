// koffee 1.3.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ290by5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsa0NBQUE7SUFBQTs7O0FBUUEsTUFBcUIsT0FBQSxDQUFRLEtBQVIsQ0FBckIsRUFBRSxpQkFBRixFQUFTLGVBQVQsRUFBZTs7QUFFZixPQUFBLEdBQVUsT0FBQSxDQUFRLHdCQUFSOztBQUVKOzs7SUFFVyxjQUFDLFdBQUQ7UUFFVCxzQ0FBTSxXQUFOO1FBRUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxDQUFDLE1BQUQsRUFBUyxTQUFUO0lBSkE7O21CQVliLEtBQUEsR0FBTyxTQUFDLElBQUQ7UUFDSCxnQ0FBTSxJQUFOO1FBQ0EsSUFBQyxDQUFBLFFBQUQsQ0FBQTtRQUNBLElBQUMsQ0FBQSxTQUFELENBQVcsSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFYO1FBQ0EsSUFBQyxDQUFBLE1BQUQsQ0FBUSxDQUFSO1FBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBQTtlQUNBO1lBQUEsSUFBQSxFQUFNLElBQUMsQ0FBQSxXQUFXLENBQUMsSUFBYixDQUFrQixDQUFsQixDQUFOO1lBQ0EsTUFBQSxFQUFRLElBRFI7O0lBTkc7O21CQWVQLFNBQUEsR0FBVyxTQUFBO0FBRVAsWUFBQTtRQUFBLEtBQUEsR0FBUTtRQUNSLElBQUMsQ0FBQSxLQUFELEdBQVM7UUFFVCxLQUFBLEdBQVEsSUFBSSxDQUFDLEdBQUwsQ0FBUyxTQUFULEVBQW9CLE9BQXBCO1FBQ1IsS0FBQSwyREFBd0MsQ0FBRTs7WUFDMUM7O1lBQUEsUUFBUzs7QUFFVCxhQUFBLHVDQUFBOztZQUNJLEtBQUssQ0FBQyxJQUFOLENBQVc7Z0JBQUEsSUFBQSxFQUFLLElBQUksQ0FBQyxJQUFWO2dCQUFnQixJQUFBLEVBQUssR0FBckI7Z0JBQTBCLElBQUEsRUFBSyxRQUEvQjthQUFYO1lBQ0EsSUFBQyxDQUFBLEtBQU0sQ0FBQSxJQUFJLENBQUMsSUFBTCxDQUFQLEdBQW9CO0FBRnhCO1FBSUEsS0FBQSxHQUFRLElBQUksQ0FBQyxHQUFMLENBQVMsU0FBVCxFQUFvQixTQUFwQjtBQUNSO0FBQUEsYUFBQSx3Q0FBQTs7WUFDSSxJQUFBLEdBQU87WUFDUCxLQUFLLENBQUMsSUFBTixDQUFXO2dCQUFBLElBQUEsRUFBTSxDQUFOO2dCQUFTLElBQUEsRUFBSyxHQUFkO2dCQUFtQixJQUFBLEVBQUssT0FBeEI7YUFBWDtZQUNBLElBQUMsQ0FBQSxLQUFNLENBQUEsSUFBQSxDQUFQLEdBQWU7QUFIbkI7ZUFLQTtJQW5CTzs7bUJBMkJYLE9BQUEsR0FBUyxTQUFDLE9BQUQ7QUFFTCxZQUFBO1FBQUEsT0FBQSxHQUFVLGtDQUFNLE9BQU47UUFFVixJQUFHLFVBQVUsQ0FBQyxJQUFYLENBQWdCLE9BQWhCLENBQUg7WUFDSSxJQUFBLEdBQU8sUUFBQSxDQUFTLE9BQVQ7WUFDUCxNQUFBLEdBQVMsSUFBQyxDQUFBLGVBQUQsQ0FBQTtZQUNULElBQXFELGNBQXJEO0FBQUEsdUJBQUssT0FBQSxDQUFFLEtBQUYsQ0FBUSxvQkFBQSxHQUFxQixJQUFDLENBQUEsUUFBOUIsRUFBTDs7WUFDQSxJQUFHLElBQUEsR0FBTyxDQUFWO2dCQUNJLElBQUEsR0FBTyxNQUFNLENBQUMsUUFBUCxDQUFBLENBQUEsR0FBb0IsS0FEL0I7YUFBQSxNQUFBO2dCQUdJLElBQUEsSUFBUSxFQUhaOztZQUlBLElBQUEsR0FBTyxLQUFBLENBQU0sQ0FBTixFQUFTLE1BQU0sQ0FBQyxRQUFQLENBQUEsQ0FBQSxHQUFrQixDQUEzQixFQUE4QixJQUE5QjtZQUNQLE1BQU0sQ0FBQyxpQkFBUCxDQUF5QixDQUFDLENBQUQsRUFBRyxJQUFILENBQXpCLEVBQW1DO2dCQUFBLE1BQUEsRUFBUSxJQUFDLENBQUEsSUFBRCxLQUFTLFNBQWpCO2FBQW5DO1lBQ0EsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFkLENBQUE7bUJBQ0E7Z0JBQUEsS0FBQSxFQUFPLElBQUMsQ0FBQSxRQUFSO2dCQUNBLENBQUEsRUFBQSxDQUFBLEVBQUksT0FBQSxHQUFRLE1BQU0sQ0FBQyxJQURuQjtjQVhKO1NBQUEsTUFhSyxJQUFHLE9BQU8sQ0FBQyxNQUFYO1lBQ0QsSUFBQSxpREFBeUI7WUFDekIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFkLENBQXFCLE9BQXJCLEVBQThCO2dCQUFBLElBQUEsRUFBSyxJQUFMO2dCQUFXLFFBQUEsRUFBVSxJQUFyQjtnQkFBMkIsTUFBQSxFQUFRLElBQUMsQ0FBQSxJQUFELEtBQVMsU0FBNUM7YUFBOUI7bUJBQ0E7Z0JBQUEsS0FBQSxFQUFPLFFBQVA7Z0JBQ0EsQ0FBQSxFQUFBLENBQUEsRUFBSSxhQURKO2NBSEM7U0FBQSxNQUFBO21CQU1EO2dCQUFBLElBQUEsRUFBTSxFQUFOO2NBTkM7O0lBakJBOzs7O0dBeERNOztBQWlGbkIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwIFxuMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4wMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMFxuIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgXG4jIyNcblxueyBjbGFtcCwgcG9zdCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Db21tYW5kID0gcmVxdWlyZSAnLi4vY29tbWFuZGxpbmUvY29tbWFuZCdcblxuY2xhc3MgR290byBleHRlbmRzIENvbW1hbmRcblxuICAgIGNvbnN0cnVjdG9yOiAoY29tbWFuZGxpbmUpIC0+XG4gICAgICAgIFxuICAgICAgICBzdXBlciBjb21tYW5kbGluZVxuICAgICAgICBcbiAgICAgICAgQG5hbWVzID0gWydnb3RvJywgJ3NlbGVjdG8nXVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgICAgIFxuICAgIHN0YXJ0OiAobmFtZSkgLT5cbiAgICAgICAgc3VwZXIgbmFtZVxuICAgICAgICBAc2hvd0xpc3QoKVxuICAgICAgICBAc2hvd0l0ZW1zIEBsaXN0SXRlbXMoKSBcbiAgICAgICAgQHNlbGVjdCAwXG4gICAgICAgIEBwb3NpdGlvbkxpc3QoKVxuICAgICAgICB0ZXh0OiBAY29tbWFuZExpc3QubGluZSgwKVxuICAgICAgICBzZWxlY3Q6IHRydWVcbiAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCBcbiAgICBcbiAgICBsaXN0SXRlbXM6ICgpIC0+IFxuICAgICAgICBcbiAgICAgICAgaXRlbXMgPSBbXVxuICAgICAgICBAdHlwZXMgPSB7fVxuICAgICAgICBcbiAgICAgICAgZmlsZXMgPSBwb3N0LmdldCAnaW5kZXhlcicsICdmaWxlcydcbiAgICAgICAgZnVuY3MgPSBmaWxlc1t3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlXT8uZnVuY3NcbiAgICAgICAgZnVuY3MgPz0gW11cbiAgICAgICAgXG4gICAgICAgIGZvciBmdW5jIGluIGZ1bmNzXG4gICAgICAgICAgICBpdGVtcy5wdXNoIHRleHQ6ZnVuYy5uYW1lLCBsaW5lOifilrgnLCBjbHNzOidtZXRob2QnXG4gICAgICAgICAgICBAdHlwZXNbZnVuYy5uYW1lXSA9ICdmdW5jJ1xuICAgICAgICAgICAgXG4gICAgICAgIGNsc3NzID0gcG9zdC5nZXQgJ2luZGV4ZXInLCAnY2xhc3NlcydcbiAgICAgICAgZm9yIGsgaW4gXy5rZXlzIGNsc3NzXG4gICAgICAgICAgICBuYW1lID0ga1xuICAgICAgICAgICAgaXRlbXMucHVzaCB0ZXh0OiBrLCBsaW5lOifil48nLCBjbHNzOidjbGFzcydcbiAgICAgICAgICAgIEB0eXBlc1tuYW1lXSA9ICdjbGFzcydcbiAgICAgICAgICAgIFxuICAgICAgICBpdGVtc1xuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiAgICAgICAgXG4gICAgZXhlY3V0ZTogKGNvbW1hbmQpIC0+XG4gICAgICAgIFxuICAgICAgICBjb21tYW5kID0gc3VwZXIgY29tbWFuZFxuICAgICAgICBcbiAgICAgICAgaWYgL15cXC0/XFxkKyQvLnRlc3QgY29tbWFuZCAjIGdvdG8gbGluZSBudW1iZXJcbiAgICAgICAgICAgIGxpbmUgPSBwYXJzZUludCBjb21tYW5kXG4gICAgICAgICAgICBlZGl0b3IgPSBAcmVjZWl2aW5nRWRpdG9yKClcbiAgICAgICAgICAgIHJldHVybiBlcnJvciBcIm5vIGVkaXRvcj8gZm9jdXM6ICN7QHJlY2VpdmVyfVwiIGlmIG5vdCBlZGl0b3I/XG4gICAgICAgICAgICBpZiBsaW5lIDwgMFxuICAgICAgICAgICAgICAgIGxpbmUgPSBlZGl0b3IubnVtTGluZXMoKSArIGxpbmVcbiAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgbGluZSAtPSAxXG4gICAgICAgICAgICBsaW5lID0gY2xhbXAgMCwgZWRpdG9yLm51bUxpbmVzKCktMSwgbGluZVxuICAgICAgICAgICAgZWRpdG9yLnNpbmdsZUN1cnNvckF0UG9zIFswLGxpbmVdLCBleHRlbmQ6IEBuYW1lID09ICdzZWxlY3RvJ1xuICAgICAgICAgICAgZWRpdG9yLnNjcm9sbC5jdXJzb3JUb1RvcCgpXG4gICAgICAgICAgICBmb2N1czogQHJlY2VpdmVyXG4gICAgICAgICAgICBkbzogXCJzaG93ICN7ZWRpdG9yLm5hbWV9XCJcbiAgICAgICAgZWxzZSBpZiBjb21tYW5kLmxlbmd0aFxuICAgICAgICAgICAgdHlwZSA9IEB0eXBlc1tjb21tYW5kXSA/ICdmdW5jJ1xuICAgICAgICAgICAgd2luZG93LmVkaXRvci5qdW1wVG8gY29tbWFuZCwgdHlwZTp0eXBlLCBkb250TGlzdDogdHJ1ZSwgZXh0ZW5kOiBAbmFtZSA9PSAnc2VsZWN0bydcbiAgICAgICAgICAgIGZvY3VzOiAnZWRpdG9yJ1xuICAgICAgICAgICAgZG86IFwic2hvdyBlZGl0b3JcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0ZXh0OiAnJ1xuICAgICAgICAgICAgICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gR290b1xuIl19
//# sourceURL=../../coffee/commands/goto.coffee