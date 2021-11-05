// koffee 1.16.0

/*
00000000   00000000    0000000         000  00000000   0000000  000000000   0000000  
000   000  000   000  000   000        000  000       000          000     000       
00000000   0000000    000   000        000  0000000   000          000     0000000   
000        000   000  000   000  000   000  000       000          000          000  
000        000   000   0000000    0000000   00000000   0000000     000     0000000
 */
var Projects, files, numFiles, post, ref, slash, valid;

ref = require('kxk'), post = ref.post, slash = ref.slash, valid = ref.valid;

files = {};

numFiles = 0;

Projects = (function() {
    function Projects() {}

    Projects.refresh = function() {
        return files = {};
    };

    Projects.onIndexed = function(info) {
        if (valid(info.files)) {
            files[info.dir] = info.files;
            return numFiles += info.files.length;
        }
    };

    Projects.files = function(file) {
        var dir, info, list;
        if (!file) {
            return [];
        }
        for (dir in files) {
            list = files[dir];
            if (file.startsWith(dir)) {
                return list;
            }
        }
        if (dir = slash.pkg(file)) {
            if (info = post.get('indexer', 'project', dir)) {
                Projects.onIndexed(info);
                return files[info.dir];
            }
        }
        console.log("no project files for file " + file, Object.keys(files));
        return [];
    };

    return Projects;

})();

post.on('projectIndexed', Projects.onIndexed);

module.exports = Projects;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdHMuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL3Rvb2xzIiwic291cmNlcyI6WyJwcm9qZWN0cy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBeUIsT0FBQSxDQUFRLEtBQVIsQ0FBekIsRUFBRSxlQUFGLEVBQVEsaUJBQVIsRUFBZTs7QUFFZixLQUFBLEdBQVc7O0FBQ1gsUUFBQSxHQUFXOztBQUVMOzs7SUFFRixRQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7ZUFFTixLQUFBLEdBQVE7SUFGRjs7SUFJVixRQUFDLENBQUEsU0FBRCxHQUFZLFNBQUMsSUFBRDtRQUVSLElBQUcsS0FBQSxDQUFNLElBQUksQ0FBQyxLQUFYLENBQUg7WUFDSSxLQUFNLENBQUEsSUFBSSxDQUFDLEdBQUwsQ0FBTixHQUFrQixJQUFJLENBQUM7bUJBQ3ZCLFFBQUEsSUFBWSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BRjNCOztJQUZROztJQU1aLFFBQUMsQ0FBQSxLQUFELEdBQVEsU0FBQyxJQUFEO0FBRUosWUFBQTtRQUFBLElBQUcsQ0FBSSxJQUFQO0FBQ0ksbUJBQU8sR0FEWDs7QUFHQSxhQUFBLFlBQUE7O1lBQ0ksSUFBRyxJQUFJLENBQUMsVUFBTCxDQUFnQixHQUFoQixDQUFIO0FBQ0ksdUJBQU8sS0FEWDs7QUFESjtRQUlBLElBQUcsR0FBQSxHQUFNLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixDQUFUO1lBQ0ksSUFBRyxJQUFBLEdBQU8sSUFBSSxDQUFDLEdBQUwsQ0FBUyxTQUFULEVBQW1CLFNBQW5CLEVBQTZCLEdBQTdCLENBQVY7Z0JBQ0ksUUFBUSxDQUFDLFNBQVQsQ0FBbUIsSUFBbkI7QUFDQSx1QkFBTyxLQUFNLENBQUEsSUFBSSxDQUFDLEdBQUwsRUFGakI7YUFESjs7UUFLQSxPQUFBLENBQUEsR0FBQSxDQUFJLDRCQUFBLEdBQTZCLElBQWpDLEVBQXdDLE1BQU0sQ0FBQyxJQUFQLENBQVksS0FBWixDQUF4QztlQUNBO0lBZkk7Ozs7OztBQWlCWixJQUFJLENBQUMsRUFBTCxDQUFRLGdCQUFSLEVBQTBCLFFBQVEsQ0FBQyxTQUFuQzs7QUFFQSxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgICAgICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICAgICAwMDAgIFxuMDAwICAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuIyMjXG5cbnsgcG9zdCwgc2xhc2gsIHZhbGlkIH0gPSByZXF1aXJlICdreGsnXG5cbmZpbGVzICAgID0ge31cbm51bUZpbGVzID0gMFxuXG5jbGFzcyBQcm9qZWN0c1xuICAgIFxuICAgIEByZWZyZXNoOiAtPiBcbiAgICAgICAgXG4gICAgICAgIGZpbGVzID0ge31cbiAgICAgICAgXG4gICAgQG9uSW5kZXhlZDogKGluZm8pIC0+XG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBpbmZvLmZpbGVzXG4gICAgICAgICAgICBmaWxlc1tpbmZvLmRpcl0gPSBpbmZvLmZpbGVzXG4gICAgICAgICAgICBudW1GaWxlcyArPSBpbmZvLmZpbGVzLmxlbmd0aFxuICAgICAgICBcbiAgICBAZmlsZXM6IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGZpbGVcbiAgICAgICAgICAgIHJldHVybiBbXVxuICAgICAgICBcbiAgICAgICAgZm9yIGRpcixsaXN0IG9mIGZpbGVzXG4gICAgICAgICAgICBpZiBmaWxlLnN0YXJ0c1dpdGgoZGlyKVxuICAgICAgICAgICAgICAgIHJldHVybiBsaXN0XG4gICAgICAgICAgICBcbiAgICAgICAgaWYgZGlyID0gc2xhc2gucGtnIGZpbGVcbiAgICAgICAgICAgIGlmIGluZm8gPSBwb3N0LmdldCAnaW5kZXhlcicgJ3Byb2plY3QnIGRpclxuICAgICAgICAgICAgICAgIFByb2plY3RzLm9uSW5kZXhlZCBpbmZvXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbGVzW2luZm8uZGlyXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBsb2cgXCJubyBwcm9qZWN0IGZpbGVzIGZvciBmaWxlICN7ZmlsZX1cIiBPYmplY3Qua2V5cyBmaWxlc1xuICAgICAgICBbXVxuIFxucG9zdC5vbiAncHJvamVjdEluZGV4ZWQnLCBQcm9qZWN0cy5vbkluZGV4ZWRcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFByb2plY3RzXG4iXX0=
//# sourceURL=../../coffee/tools/projects.coffee