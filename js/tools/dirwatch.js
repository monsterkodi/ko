// koffee 1.12.0

/*
0000000    000  00000000   000   000   0000000   000000000   0000000  000   000  
000   000  000  000   000  000 0 000  000   000     000     000       000   000  
000   000  000  0000000    000000000  000000000     000     000       000000000  
000   000  000  000   000  000   000  000   000     000     000       000   000  
0000000    000  000   000  00     00  000   000     000      0000000  000   000
 */
var DirWatch, post, ref, watch;

ref = require('kxk'), post = ref.post, watch = ref.watch;

DirWatch = (function() {
    function DirWatch() {}

    DirWatch.watches = {};

    DirWatch.watch = function(dir) {
        var watcher;
        if (DirWatch.watches[dir]) {
            return;
        }
        watcher = watch.dir(dir, {
            skipSave: true
        });
        watcher.on('change', function(info) {
            if (info.change !== 'change') {
                return post.emit('dirChanged', info);
            }
        });
        watcher.on('error', function(err) {
            return console.error("watch.error " + err);
        });
        return DirWatch.watches[dir] = watcher;
    };

    DirWatch.unwatch = function(dir) {
        var ref1;
        if ((ref1 = DirWatch.watches[dir]) != null) {
            ref1.close();
        }
        return delete DirWatch.watches[dir];
    };

    return DirWatch;

})();

module.exports = DirWatch;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyd2F0Y2guanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL3Rvb2xzIiwic291cmNlcyI6WyJkaXJ3YXRjaC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBa0IsT0FBQSxDQUFRLEtBQVIsQ0FBbEIsRUFBRSxlQUFGLEVBQVE7O0FBRUY7OztJQUVGLFFBQUMsQ0FBQSxPQUFELEdBQVc7O0lBRVgsUUFBQyxDQUFBLEtBQUQsR0FBUSxTQUFDLEdBQUQ7QUFFSixZQUFBO1FBQUEsSUFBVSxRQUFRLENBQUMsT0FBUSxDQUFBLEdBQUEsQ0FBM0I7QUFBQSxtQkFBQTs7UUFHQSxPQUFBLEdBQVUsS0FBSyxDQUFDLEdBQU4sQ0FBVSxHQUFWLEVBQWU7WUFBQSxRQUFBLEVBQVMsSUFBVDtTQUFmO1FBQ1YsT0FBTyxDQUFDLEVBQVIsQ0FBVyxRQUFYLEVBQW9CLFNBQUMsSUFBRDtZQUNoQixJQUFHLElBQUksQ0FBQyxNQUFMLEtBQWUsUUFBbEI7dUJBRUksSUFBSSxDQUFDLElBQUwsQ0FBVSxZQUFWLEVBQXVCLElBQXZCLEVBRko7O1FBRGdCLENBQXBCO1FBSUEsT0FBTyxDQUFDLEVBQVIsQ0FBVyxPQUFYLEVBQW1CLFNBQUMsR0FBRDttQkFBTyxPQUFBLENBQUUsS0FBRixDQUFRLGNBQUEsR0FBZSxHQUF2QjtRQUFQLENBQW5CO2VBQ0EsUUFBUSxDQUFDLE9BQVEsQ0FBQSxHQUFBLENBQWpCLEdBQXdCO0lBWHBCOztJQWFSLFFBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQyxHQUFEO0FBRU4sWUFBQTs7Z0JBQXFCLENBQUUsS0FBdkIsQ0FBQTs7ZUFDQSxPQUFPLFFBQVEsQ0FBQyxPQUFRLENBQUEsR0FBQTtJQUhsQjs7Ozs7O0FBTWQsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICBcbjAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMCAgICAwMDAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIyNcblxueyBwb3N0LCB3YXRjaCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBEaXJXYXRjaFxuICAgICAgIFxuICAgIEB3YXRjaGVzID0ge31cbiAgICAgICAgXG4gICAgQHdhdGNoOiAoZGlyKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIERpcldhdGNoLndhdGNoZXNbZGlyXVxuICAgICAgICAjIGtsb2cgXCJ3YXRjaCAje2Rpcn1cIiBPYmplY3Qua2V5cyBEaXJXYXRjaC53YXRjaGVzXG4gICAgICAgIFxuICAgICAgICB3YXRjaGVyID0gd2F0Y2guZGlyIGRpciwgc2tpcFNhdmU6dHJ1ZVxuICAgICAgICB3YXRjaGVyLm9uICdjaGFuZ2UnIChpbmZvKSAtPlxuICAgICAgICAgICAgaWYgaW5mby5jaGFuZ2UgIT0gJ2NoYW5nZSdcbiAgICAgICAgICAgICAgICAjIGtsb2cgJ0RpcldhdGNoJyBpbmZvLmNoYW5nZSwgaW5mby5wYXRoLCBpbmZvLmRpclxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnZGlyQ2hhbmdlZCcgaW5mb1xuICAgICAgICB3YXRjaGVyLm9uICdlcnJvcicgKGVycikgLT4gZXJyb3IgXCJ3YXRjaC5lcnJvciAje2Vycn1cIlxuICAgICAgICBEaXJXYXRjaC53YXRjaGVzW2Rpcl0gPSB3YXRjaGVyXG4gICAgICAgIFxuICAgIEB1bndhdGNoOiAoZGlyKSAtPiBcbiAgICAgICAgXG4gICAgICAgIERpcldhdGNoLndhdGNoZXNbZGlyXT8uY2xvc2UoKVxuICAgICAgICBkZWxldGUgRGlyV2F0Y2gud2F0Y2hlc1tkaXJdXG4gICAgICAgICMga2xvZyBcInVud2F0Y2ggI3tkaXJ9XCIgT2JqZWN0LmtleXMgRGlyV2F0Y2gud2F0Y2hlc1xuXG5tb2R1bGUuZXhwb3J0cyA9IERpcldhdGNoXG4iXX0=
//# sourceURL=../../coffee/tools/dirwatch.coffee