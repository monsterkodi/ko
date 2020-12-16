// koffee 1.14.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mby5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvZ2l0Iiwic291cmNlcyI6WyJpbmZvLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUFzQixPQUFBLENBQVEsS0FBUixDQUF0QixFQUFFLGlCQUFGLEVBQVMsaUJBQVQsRUFBZ0I7O0FBRWhCLE1BQUEsR0FBUyxPQUFBLENBQVEsVUFBUjs7QUFDVCxJQUFBLEdBQVMsT0FBQSxDQUFRLFFBQVI7O0FBRVQsSUFBQSxHQUFPLFNBQUMsTUFBRCxFQUFTLEVBQVQ7QUFFSCxRQUFBO0lBQUEsSUFBRyxDQUFDLENBQUMsVUFBRixDQUFhLEVBQWIsQ0FBSDtlQUVJLE1BQUEsQ0FBTyxNQUFQLEVBQWUsU0FBQyxJQUFEO0FBQ1gsZ0JBQUE7WUFBQSxJQUFHLEtBQUEsQ0FBTSxJQUFOLENBQUg7dUJBQ0ksRUFBQSxDQUFHLEVBQUgsRUFESjthQUFBLE1BQUE7Z0JBR0ksUUFBQSxHQUFXLElBQUksQ0FBQyxPQUFPLENBQUM7Z0JBQ3hCLE9BQUEsR0FBVTtBQUNWO0FBQUE7cUJBQUEsc0NBQUE7O29CQUVJLFFBQUEsR0FBVyxTQUFDLElBQUQ7K0JBQVUsU0FBQyxJQUFEOzRCQUNqQixPQUFPLENBQUMsSUFBUixDQUFhLElBQWI7NEJBQ0EsUUFBQSxJQUFZOzRCQUNaLElBQUcsUUFBQSxLQUFZLENBQWY7Z0NBQ0ksSUFBSSxDQUFDLE9BQUwsR0FBZTt1Q0FDZixFQUFBLENBQUcsSUFBSCxFQUZKOzt3QkFIaUI7b0JBQVY7aUNBT1gsSUFBQSxDQUFLLElBQUwsRUFBVyxRQUFBLENBQVMsSUFBVCxDQUFYO0FBVEo7K0JBTEo7O1FBRFcsQ0FBZixFQUZKO0tBQUEsTUFBQTtRQW1CSSxJQUFBLEdBQU8sTUFBQSxDQUFPLE1BQVA7UUFDUCxJQUFHLEtBQUEsQ0FBTSxJQUFOLENBQUg7QUFDSSxtQkFBTyxHQURYO1NBQUEsTUFBQTtZQUdJLElBQUksQ0FBQyxPQUFMLEdBQWUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFiLENBQWlCLFNBQUMsSUFBRDt1QkFBVSxJQUFBLENBQUssSUFBTDtZQUFWLENBQWpCO0FBQ2YsbUJBQU8sS0FKWDtTQXBCSjs7QUFGRzs7QUFrQ1AsSUFBRyxNQUFNLENBQUMsTUFBVjtJQUVJLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLEtBRnJCO0NBQUEsTUFBQTtJQU1JLElBQUcsQ0FBSSxLQUFBLENBQU0sT0FBTyxDQUFDLElBQUssQ0FBQSxDQUFBLENBQW5CLENBQVA7UUFDSSxHQUFBLEdBQU0sS0FBSyxDQUFDLE9BQU4sQ0FBYyxPQUFPLENBQUMsSUFBSyxDQUFBLENBQUEsQ0FBM0IsRUFEVjtLQUFBLE1BQUE7UUFHSSxHQUFBLEdBQU0sT0FBTyxDQUFDLEdBQVIsQ0FBQSxFQUhWOztJQUtBLE9BQUEsQ0FBQSxHQUFBLENBQUksSUFBQSxDQUFLLEdBQUwsQ0FBSixFQVhKIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgXG4wMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAgIDAwMCAwIDAwMCAgMDAwMDAwICAgIDAwMCAgIDAwMCAgXG4wMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAgXG4jIyNcblxueyBlbXB0eSwgc2xhc2gsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuc3RhdHVzID0gcmVxdWlyZSAnLi9zdGF0dXMnXG5kaWZmICAgPSByZXF1aXJlICcuL2RpZmYnXG5cbmluZm8gPSAoZ2l0RGlyLCBjYikgLT5cbiAgICBcbiAgICBpZiBfLmlzRnVuY3Rpb24gY2JcblxuICAgICAgICBzdGF0dXMgZ2l0RGlyLCAoc3R0cykgLT5cbiAgICAgICAgICAgIGlmIGVtcHR5IHN0dHNcbiAgICAgICAgICAgICAgICBjYiB7fVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIG51bUZpbGVzID0gc3R0cy5jaGFuZ2VkLmxlbmd0aFxuICAgICAgICAgICAgICAgIGNoYW5nZWQgPSBbXVxuICAgICAgICAgICAgICAgIGZvciBmaWxlIGluIHN0dHMuY2hhbmdlZFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgcHVzaEZpbGUgPSAoZmlsZSkgLT4gKGRzdHMpIC0+IFxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlZC5wdXNoIGRzdHNcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bUZpbGVzIC09IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG51bUZpbGVzID09IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHRzLmNoYW5nZWQgPSBjaGFuZ2VkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2Igc3R0c1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZGlmZiBmaWxlLCBwdXNoRmlsZSBmaWxlXG4gICAgZWxzZVxuICAgICAgICBzdHRzID0gc3RhdHVzIGdpdERpclxuICAgICAgICBpZiBlbXB0eSBzdHRzXG4gICAgICAgICAgICByZXR1cm4ge31cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc3R0cy5jaGFuZ2VkID0gc3R0cy5jaGFuZ2VkLm1hcCAoZmlsZSkgLT4gZGlmZiBmaWxlXG4gICAgICAgICAgICByZXR1cm4gc3R0c1xuXG4jIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4jIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuaWYgbW9kdWxlLnBhcmVudFxuICAgIFxuICAgIG1vZHVsZS5leHBvcnRzID0gaW5mb1xuICAgIFxuZWxzZVxuICAgIFxuICAgIGlmIG5vdCBlbXB0eSBwcm9jZXNzLmFyZ3ZbMl1cbiAgICAgICAgZGlyID0gc2xhc2gucmVzb2x2ZSBwcm9jZXNzLmFyZ3ZbMl1cbiAgICBlbHNlXG4gICAgICAgIGRpciA9IHByb2Nlc3MuY3dkKClcbiAgICAgICAgXG4gICAgbG9nIGluZm8gZGlyXG4gICAgIl19
//# sourceURL=../../coffee/git/info.coffee