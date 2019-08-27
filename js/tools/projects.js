// koffee 1.4.0

/*
00000000   00000000    0000000         000  00000000   0000000  000000000   0000000  
000   000  000   000  000   000        000  000       000          000     000       
00000000   0000000    000   000        000  0000000   000          000     0000000   
000        000   000  000   000  000   000  000       000          000          000  
000        000   000   0000000    0000000   00000000   0000000     000     0000000
 */
var Projects, _, empty, files, numFiles, post, ref, slash, valid;

ref = require('kxk'), post = ref.post, valid = ref.valid, empty = ref.empty, slash = ref.slash, _ = ref._;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdHMuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLE1BQW1DLE9BQUEsQ0FBUSxLQUFSLENBQW5DLEVBQUUsZUFBRixFQUFRLGlCQUFSLEVBQWUsaUJBQWYsRUFBc0IsaUJBQXRCLEVBQTZCOztBQUU3QixLQUFBLEdBQVc7O0FBQ1gsUUFBQSxHQUFXOztBQUVMOzs7SUFFRixRQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7ZUFFTixLQUFBLEdBQVE7SUFGRjs7SUFJVixRQUFDLENBQUEsU0FBRCxHQUFZLFNBQUMsSUFBRDtRQUVSLElBQUcsS0FBQSxDQUFNLElBQUksQ0FBQyxLQUFYLENBQUg7WUFDSSxLQUFNLENBQUEsSUFBSSxDQUFDLEdBQUwsQ0FBTixHQUFrQixJQUFJLENBQUM7bUJBQ3ZCLFFBQUEsSUFBWSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BRjNCOztJQUZROztJQU1aLFFBQUMsQ0FBQSxLQUFELEdBQVEsU0FBQyxJQUFEO0FBRUosWUFBQTtRQUFBLElBQUcsQ0FBSSxJQUFQO0FBQ0ksbUJBQU8sR0FEWDs7QUFHQSxhQUFBLFlBQUE7O1lBQ0ksSUFBRyxJQUFJLENBQUMsVUFBTCxDQUFnQixHQUFoQixDQUFIO0FBQ0ksdUJBQU8sS0FEWDs7QUFESjtRQUlBLElBQUcsR0FBQSxHQUFNLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixDQUFUO1lBQ0ksSUFBRyxJQUFBLEdBQU8sSUFBSSxDQUFDLEdBQUwsQ0FBUyxTQUFULEVBQW9CLFNBQXBCLEVBQStCLEdBQS9CLENBQVY7Z0JBQ0ksUUFBUSxDQUFDLFNBQVQsQ0FBbUIsSUFBbkI7QUFDQSx1QkFBTyxLQUFNLENBQUEsSUFBSSxDQUFDLEdBQUwsRUFGakI7YUFESjs7UUFLQSxPQUFBLENBQUEsR0FBQSxDQUFJLDRCQUFBLEdBQTZCLElBQWpDLEVBQXlDLE1BQU0sQ0FBQyxJQUFQLENBQVksS0FBWixDQUF6QztlQUNBO0lBZkk7Ozs7OztBQWlCWixJQUFJLENBQUMsRUFBTCxDQUFRLGdCQUFSLEVBQTBCLFFBQVEsQ0FBQyxTQUFuQzs7QUFFQSxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgICAgICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICAgICAwMDAgIFxuMDAwICAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuIyMjXG5cbnsgcG9zdCwgdmFsaWQsIGVtcHR5LCBzbGFzaCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5maWxlcyAgICA9IHt9XG5udW1GaWxlcyA9IDBcblxuY2xhc3MgUHJvamVjdHNcbiAgICBcbiAgICBAcmVmcmVzaDogLT4gXG4gICAgICAgIFxuICAgICAgICBmaWxlcyA9IHt9XG4gICAgICAgIFxuICAgIEBvbkluZGV4ZWQ6IChpbmZvKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgaW5mby5maWxlc1xuICAgICAgICAgICAgZmlsZXNbaW5mby5kaXJdID0gaW5mby5maWxlc1xuICAgICAgICAgICAgbnVtRmlsZXMgKz0gaW5mby5maWxlcy5sZW5ndGhcbiAgICAgICAgXG4gICAgQGZpbGVzOiAoZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBmaWxlXG4gICAgICAgICAgICByZXR1cm4gW11cbiAgICAgICAgXG4gICAgICAgIGZvciBkaXIsbGlzdCBvZiBmaWxlc1xuICAgICAgICAgICAgaWYgZmlsZS5zdGFydHNXaXRoKGRpcilcbiAgICAgICAgICAgICAgICByZXR1cm4gbGlzdFxuICAgICAgICAgICAgXG4gICAgICAgIGlmIGRpciA9IHNsYXNoLnBrZyBmaWxlXG4gICAgICAgICAgICBpZiBpbmZvID0gcG9zdC5nZXQgJ2luZGV4ZXInLCAncHJvamVjdCcsIGRpclxuICAgICAgICAgICAgICAgIFByb2plY3RzLm9uSW5kZXhlZCBpbmZvXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbGVzW2luZm8uZGlyXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBsb2cgXCJubyBwcm9qZWN0IGZpbGVzIGZvciBmaWxlICN7ZmlsZX1cIiwgT2JqZWN0LmtleXMgZmlsZXNcbiAgICAgICAgW11cbiBcbnBvc3Qub24gJ3Byb2plY3RJbmRleGVkJywgUHJvamVjdHMub25JbmRleGVkXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBQcm9qZWN0c1xuIl19
//# sourceURL=../../coffee/tools/projects.coffee