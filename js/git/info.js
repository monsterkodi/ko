// koffee 1.3.0

/*
000  000   000  00000000   0000000   
000  0000  000  000       000   000  
000  000 0 000  000000    000   000  
000  000  0000  000       000   000  
000  000   000  000        0000000
 */
var _, childp, diff, dir, empty, info, ref, slash, status, str;

ref = require('kxk'), childp = ref.childp, empty = ref.empty, slash = ref.slash, str = ref.str, _ = ref._;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mby5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBbUMsT0FBQSxDQUFRLEtBQVIsQ0FBbkMsRUFBRSxtQkFBRixFQUFVLGlCQUFWLEVBQWlCLGlCQUFqQixFQUF3QixhQUF4QixFQUE2Qjs7QUFFN0IsTUFBQSxHQUFTLE9BQUEsQ0FBUSxVQUFSOztBQUNULElBQUEsR0FBUyxPQUFBLENBQVEsUUFBUjs7QUFFVCxJQUFBLEdBQU8sU0FBQyxNQUFELEVBQVMsRUFBVDtBQUVILFFBQUE7SUFBQSxJQUFHLENBQUMsQ0FBQyxVQUFGLENBQWEsRUFBYixDQUFIO2VBRUksTUFBQSxDQUFPLE1BQVAsRUFBZSxTQUFDLElBQUQ7QUFDWCxnQkFBQTtZQUFBLElBQUcsS0FBQSxDQUFNLElBQU4sQ0FBSDt1QkFDSSxFQUFBLENBQUcsRUFBSCxFQURKO2FBQUEsTUFBQTtnQkFHSSxRQUFBLEdBQVcsSUFBSSxDQUFDLE9BQU8sQ0FBQztnQkFDeEIsT0FBQSxHQUFVO0FBQ1Y7QUFBQTtxQkFBQSxzQ0FBQTs7b0JBRUksUUFBQSxHQUFXLFNBQUMsSUFBRDsrQkFBVSxTQUFDLElBQUQ7NEJBQ2pCLE9BQU8sQ0FBQyxJQUFSLENBQWEsSUFBYjs0QkFDQSxRQUFBLElBQVk7NEJBQ1osSUFBRyxRQUFBLEtBQVksQ0FBZjtnQ0FDSSxJQUFJLENBQUMsT0FBTCxHQUFlO3VDQUNmLEVBQUEsQ0FBRyxJQUFILEVBRko7O3dCQUhpQjtvQkFBVjtpQ0FPWCxJQUFBLENBQUssSUFBTCxFQUFXLFFBQUEsQ0FBUyxJQUFULENBQVg7QUFUSjsrQkFMSjs7UUFEVyxDQUFmLEVBRko7S0FBQSxNQUFBO1FBbUJJLElBQUEsR0FBTyxNQUFBLENBQU8sTUFBUDtRQUNQLElBQUcsS0FBQSxDQUFNLElBQU4sQ0FBSDtBQUNJLG1CQUFPLEdBRFg7U0FBQSxNQUFBO1lBR0ksSUFBSSxDQUFDLE9BQUwsR0FBZSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQWIsQ0FBaUIsU0FBQyxJQUFEO3VCQUFVLElBQUEsQ0FBSyxJQUFMO1lBQVYsQ0FBakI7QUFDZixtQkFBTyxLQUpYO1NBcEJKOztBQUZHOztBQWtDUCxJQUFHLE1BQU0sQ0FBQyxNQUFWO0lBRUksTUFBTSxDQUFDLE9BQVAsR0FBaUIsS0FGckI7Q0FBQSxNQUFBO0lBTUksSUFBRyxDQUFJLEtBQUEsQ0FBTSxPQUFPLENBQUMsSUFBSyxDQUFBLENBQUEsQ0FBbkIsQ0FBUDtRQUNJLEdBQUEsR0FBTSxLQUFLLENBQUMsT0FBTixDQUFjLE9BQU8sQ0FBQyxJQUFLLENBQUEsQ0FBQSxDQUEzQixFQURWO0tBQUEsTUFBQTtRQUdJLEdBQUEsR0FBTSxPQUFPLENBQUMsR0FBUixDQUFBLEVBSFY7O0lBS0EsT0FBQSxDQUFBLEdBQUEsQ0FBSSxJQUFBLENBQUssR0FBTCxDQUFKLEVBWEoiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICBcbjAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbjAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAgMDAwICBcbjAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbjAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgICBcbiMjI1xuXG57IGNoaWxkcCwgZW1wdHksIHNsYXNoLCBzdHIsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuc3RhdHVzID0gcmVxdWlyZSAnLi9zdGF0dXMnXG5kaWZmICAgPSByZXF1aXJlICcuL2RpZmYnXG5cbmluZm8gPSAoZ2l0RGlyLCBjYikgLT5cbiAgICBcbiAgICBpZiBfLmlzRnVuY3Rpb24gY2JcblxuICAgICAgICBzdGF0dXMgZ2l0RGlyLCAoc3R0cykgLT5cbiAgICAgICAgICAgIGlmIGVtcHR5IHN0dHNcbiAgICAgICAgICAgICAgICBjYiB7fVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIG51bUZpbGVzID0gc3R0cy5jaGFuZ2VkLmxlbmd0aFxuICAgICAgICAgICAgICAgIGNoYW5nZWQgPSBbXVxuICAgICAgICAgICAgICAgIGZvciBmaWxlIGluIHN0dHMuY2hhbmdlZFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgcHVzaEZpbGUgPSAoZmlsZSkgLT4gKGRzdHMpIC0+IFxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlZC5wdXNoIGRzdHNcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bUZpbGVzIC09IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG51bUZpbGVzID09IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHRzLmNoYW5nZWQgPSBjaGFuZ2VkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2Igc3R0c1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZGlmZiBmaWxlLCBwdXNoRmlsZSBmaWxlXG4gICAgZWxzZVxuICAgICAgICBzdHRzID0gc3RhdHVzIGdpdERpclxuICAgICAgICBpZiBlbXB0eSBzdHRzXG4gICAgICAgICAgICByZXR1cm4ge31cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc3R0cy5jaGFuZ2VkID0gc3R0cy5jaGFuZ2VkLm1hcCAoZmlsZSkgLT4gZGlmZiBmaWxlXG4gICAgICAgICAgICByZXR1cm4gc3R0c1xuXG4jIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4jIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuaWYgbW9kdWxlLnBhcmVudFxuICAgIFxuICAgIG1vZHVsZS5leHBvcnRzID0gaW5mb1xuICAgIFxuZWxzZVxuICAgIFxuICAgIGlmIG5vdCBlbXB0eSBwcm9jZXNzLmFyZ3ZbMl1cbiAgICAgICAgZGlyID0gc2xhc2gucmVzb2x2ZSBwcm9jZXNzLmFyZ3ZbMl1cbiAgICBlbHNlXG4gICAgICAgIGRpciA9IHByb2Nlc3MuY3dkKClcbiAgICAgICAgXG4gICAgbG9nIGluZm8gZGlyXG4gICAgIl19
//# sourceURL=../../coffee/git/info.coffee