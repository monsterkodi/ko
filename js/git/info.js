// koffee 1.4.0

/*
000  000   000  00000000   0000000   
000  0000  000  000       000   000  
000  000 0 000  000000    000   000  
000  000  0000  000       000   000  
000  000   000  000        0000000
 */
var _, diff, dir, empty, info, ref, slash, status;

ref = require('kxk'), empty = ref.empty, slash = ref.slash, _ = ref._;

status = require('./status');

diff = require('./diff');

info = function(gitDir, cb) {
    var stts;
    if (_.isFunction(cb)) {
        return status(gitDir, function(stts) {
            var changed, file, i, len, numFiles, pushFile, ref1, results;
            if (empty(stts)) {
                return cb({});
            } else {
                numFiles = stts.changed.length;
                changed = [];
                ref1 = stts.changed;
                results = [];
                for (i = 0, len = ref1.length; i < len; i++) {
                    file = ref1[i];
                    pushFile = function(file) {
                        return function(dsts) {
                            changed.push(dsts);
                            numFiles -= 1;
                            if (numFiles === 0) {
                                stts.changed = changed;
                                return cb(stts);
                            }
                        };
                    };
                    results.push(diff(file, pushFile(file)));
                }
                return results;
            }
        });
    } else {
        stts = status(gitDir);
        if (empty(stts)) {
            return {};
        } else {
            stts.changed = stts.changed.map(function(file) {
                return diff(file);
            });
            return stts;
        }
    }
};

if (module.parent) {
    module.exports = info;
} else {
    if (!empty(process.argv[2])) {
        dir = slash.resolve(process.argv[2]);
    } else {
        dir = process.cwd();
    }
    console.log(info(dir));
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mby5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBc0IsT0FBQSxDQUFRLEtBQVIsQ0FBdEIsRUFBRSxpQkFBRixFQUFTLGlCQUFULEVBQWdCOztBQUVoQixNQUFBLEdBQVMsT0FBQSxDQUFRLFVBQVI7O0FBQ1QsSUFBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSOztBQUVULElBQUEsR0FBTyxTQUFDLE1BQUQsRUFBUyxFQUFUO0FBRUgsUUFBQTtJQUFBLElBQUcsQ0FBQyxDQUFDLFVBQUYsQ0FBYSxFQUFiLENBQUg7ZUFFSSxNQUFBLENBQU8sTUFBUCxFQUFlLFNBQUMsSUFBRDtBQUNYLGdCQUFBO1lBQUEsSUFBRyxLQUFBLENBQU0sSUFBTixDQUFIO3VCQUNJLEVBQUEsQ0FBRyxFQUFILEVBREo7YUFBQSxNQUFBO2dCQUdJLFFBQUEsR0FBVyxJQUFJLENBQUMsT0FBTyxDQUFDO2dCQUN4QixPQUFBLEdBQVU7QUFDVjtBQUFBO3FCQUFBLHNDQUFBOztvQkFFSSxRQUFBLEdBQVcsU0FBQyxJQUFEOytCQUFVLFNBQUMsSUFBRDs0QkFDakIsT0FBTyxDQUFDLElBQVIsQ0FBYSxJQUFiOzRCQUNBLFFBQUEsSUFBWTs0QkFDWixJQUFHLFFBQUEsS0FBWSxDQUFmO2dDQUNJLElBQUksQ0FBQyxPQUFMLEdBQWU7dUNBQ2YsRUFBQSxDQUFHLElBQUgsRUFGSjs7d0JBSGlCO29CQUFWO2lDQU9YLElBQUEsQ0FBSyxJQUFMLEVBQVcsUUFBQSxDQUFTLElBQVQsQ0FBWDtBQVRKOytCQUxKOztRQURXLENBQWYsRUFGSjtLQUFBLE1BQUE7UUFtQkksSUFBQSxHQUFPLE1BQUEsQ0FBTyxNQUFQO1FBQ1AsSUFBRyxLQUFBLENBQU0sSUFBTixDQUFIO0FBQ0ksbUJBQU8sR0FEWDtTQUFBLE1BQUE7WUFHSSxJQUFJLENBQUMsT0FBTCxHQUFlLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBYixDQUFpQixTQUFDLElBQUQ7dUJBQVUsSUFBQSxDQUFLLElBQUw7WUFBVixDQUFqQjtBQUNmLG1CQUFPLEtBSlg7U0FwQko7O0FBRkc7O0FBa0NQLElBQUcsTUFBTSxDQUFDLE1BQVY7SUFFSSxNQUFNLENBQUMsT0FBUCxHQUFpQixLQUZyQjtDQUFBLE1BQUE7SUFNSSxJQUFHLENBQUksS0FBQSxDQUFNLE9BQU8sQ0FBQyxJQUFLLENBQUEsQ0FBQSxDQUFuQixDQUFQO1FBQ0ksR0FBQSxHQUFNLEtBQUssQ0FBQyxPQUFOLENBQWMsT0FBTyxDQUFDLElBQUssQ0FBQSxDQUFBLENBQTNCLEVBRFY7S0FBQSxNQUFBO1FBR0ksR0FBQSxHQUFNLE9BQU8sQ0FBQyxHQUFSLENBQUEsRUFIVjs7SUFLQSxPQUFBLENBQUEsR0FBQSxDQUFJLElBQUEsQ0FBSyxHQUFMLENBQUosRUFYSiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIFxuMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwICAwMDAgMCAwMDAgIDAwMDAwMCAgICAwMDAgICAwMDAgIFxuMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIFxuIyMjXG5cbnsgZW1wdHksIHNsYXNoLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbnN0YXR1cyA9IHJlcXVpcmUgJy4vc3RhdHVzJ1xuZGlmZiAgID0gcmVxdWlyZSAnLi9kaWZmJ1xuXG5pbmZvID0gKGdpdERpciwgY2IpIC0+XG4gICAgXG4gICAgaWYgXy5pc0Z1bmN0aW9uIGNiXG5cbiAgICAgICAgc3RhdHVzIGdpdERpciwgKHN0dHMpIC0+XG4gICAgICAgICAgICBpZiBlbXB0eSBzdHRzXG4gICAgICAgICAgICAgICAgY2Ige31cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBudW1GaWxlcyA9IHN0dHMuY2hhbmdlZC5sZW5ndGhcbiAgICAgICAgICAgICAgICBjaGFuZ2VkID0gW11cbiAgICAgICAgICAgICAgICBmb3IgZmlsZSBpbiBzdHRzLmNoYW5nZWRcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHB1c2hGaWxlID0gKGZpbGUpIC0+IChkc3RzKSAtPiBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZWQucHVzaCBkc3RzXG4gICAgICAgICAgICAgICAgICAgICAgICBudW1GaWxlcyAtPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBudW1GaWxlcyA9PSAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R0cy5jaGFuZ2VkID0gY2hhbmdlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNiIHN0dHNcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGRpZmYgZmlsZSwgcHVzaEZpbGUgZmlsZVxuICAgIGVsc2VcbiAgICAgICAgc3R0cyA9IHN0YXR1cyBnaXREaXJcbiAgICAgICAgaWYgZW1wdHkgc3R0c1xuICAgICAgICAgICAgcmV0dXJuIHt9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHN0dHMuY2hhbmdlZCA9IHN0dHMuY2hhbmdlZC5tYXAgKGZpbGUpIC0+IGRpZmYgZmlsZVxuICAgICAgICAgICAgcmV0dXJuIHN0dHNcblxuIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbmlmIG1vZHVsZS5wYXJlbnRcbiAgICBcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGluZm9cbiAgICBcbmVsc2VcbiAgICBcbiAgICBpZiBub3QgZW1wdHkgcHJvY2Vzcy5hcmd2WzJdXG4gICAgICAgIGRpciA9IHNsYXNoLnJlc29sdmUgcHJvY2Vzcy5hcmd2WzJdXG4gICAgZWxzZVxuICAgICAgICBkaXIgPSBwcm9jZXNzLmN3ZCgpXG4gICAgICAgIFxuICAgIGxvZyBpbmZvIGRpclxuICAgICJdfQ==
//# sourceURL=../../coffee/git/info.coffee