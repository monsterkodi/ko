// koffee 1.4.0

/*
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
 */
var File, childp, empty, fs, icons, ref, slash, valid;

ref = require('kxk'), childp = ref.childp, slash = ref.slash, empty = ref.empty, valid = ref.valid, fs = ref.fs;

icons = require('./icons.json');

File = (function() {
    function File() {}

    File.sourceFileExtensions = ['koffee', 'coffee', 'styl', 'swift', 'pug', 'md', 'noon', 'txt', 'json', 'sh', 'py', 'cpp', 'cc', 'c', 'cs', 'h', 'hpp', 'ts', 'js'];

    File.iconClassName = function(file) {
        var clss;
        file = slash.removeLinePos(file);
        clss = icons.ext[slash.ext(file)];
        if (clss != null) {
            clss;
        } else {
            clss = icons.base[slash.base(file).toLowerCase()];
        }
        if (clss != null) {
            clss;
        } else {
            clss = 'file';
        }
        return "icon " + clss;
    };

    File.write = function(file, text, mode, cb) {
        slash.logErrors = true;
        return slash.writeText(file, text, function(done) {
            if (empty(done)) {
                return cb("can't write " + file);
            } else {
                return cb(null, done);
            }
        });
    };

    File.unlock = function(file, text, cb) {
        return fs.chmod(file, 0x1b6, function(err) {
            if (valid(err)) {
                return cb(err);
            } else {
                return File.write(file, text, 0x1b6, cb);
            }
        });
    };

    File.p4edit = function(file, text, cb) {
        var err;
        slash.logErrors = true;
        if (slash.win()) {
            try {
                return childp.exec("p4 edit " + (slash.unslash(file)), function(err) {
                    if (valid(err)) {
                        return File.unlock(file, text, cb);
                    } else {
                        return File.write(file, text, 0x1b6, cb);
                    }
                });
            } catch (error) {
                err = error;
                return File.unlock(file, text, cb);
            }
        } else {
            return File.unlock(file, text, cb);
        }
    };

    File.save = function(file, text, cb) {
        slash.logErrors = true;
        return slash.fileExists(file, function(stat) {
            if (stat) {
                return slash.isWritable(file, function(writable) {
                    if (writable) {
                        return File.write(file, text, stat.mode, cb);
                    } else {
                        return File.p4edit(file, text, cb);
                    }
                });
            } else {
                return File.write(file, text, 0x1b6, cb);
            }
        });
    };

    return File;

})();

module.exports = File;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBc0MsT0FBQSxDQUFRLEtBQVIsQ0FBdEMsRUFBRSxtQkFBRixFQUFVLGlCQUFWLEVBQWlCLGlCQUFqQixFQUF3QixpQkFBeEIsRUFBK0I7O0FBRS9CLEtBQUEsR0FBUSxPQUFBLENBQVEsY0FBUjs7QUFFRjs7O0lBRUYsSUFBQyxDQUFBLG9CQUFELEdBQXVCLENBQUUsUUFBRixFQUFXLFFBQVgsRUFBb0IsTUFBcEIsRUFBMkIsT0FBM0IsRUFBbUMsS0FBbkMsRUFBeUMsSUFBekMsRUFBOEMsTUFBOUMsRUFBcUQsS0FBckQsRUFBMkQsTUFBM0QsRUFBa0UsSUFBbEUsRUFBdUUsSUFBdkUsRUFBNEUsS0FBNUUsRUFBa0YsSUFBbEYsRUFBdUYsR0FBdkYsRUFBMkYsSUFBM0YsRUFBZ0csR0FBaEcsRUFBb0csS0FBcEcsRUFBMEcsSUFBMUcsRUFBK0csSUFBL0c7O0lBRXZCLElBQUMsQ0FBQSxhQUFELEdBQWdCLFNBQUMsSUFBRDtBQUVaLFlBQUE7UUFBQSxJQUFBLEdBQU8sS0FBSyxDQUFDLGFBQU4sQ0FBb0IsSUFBcEI7UUFFUCxJQUFBLEdBQVEsS0FBSyxDQUFDLEdBQUksQ0FBQSxLQUFLLENBQUMsR0FBTixDQUFVLElBQVYsQ0FBQTs7WUFDbEI7O1lBQUEsT0FBUSxLQUFLLENBQUMsSUFBSyxDQUFBLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxDQUFnQixDQUFDLFdBQWpCLENBQUEsQ0FBQTs7O1lBQ25COztZQUFBLE9BQVE7O2VBQ1IsT0FBQSxHQUFRO0lBUEk7O0lBU2hCLElBQUMsQ0FBQSxLQUFELEdBQVEsU0FBQyxJQUFELEVBQU8sSUFBUCxFQUFhLElBQWIsRUFBbUIsRUFBbkI7UUFFSixLQUFLLENBQUMsU0FBTixHQUFrQjtlQUVsQixLQUFLLENBQUMsU0FBTixDQUFnQixJQUFoQixFQUFzQixJQUF0QixFQUE0QixTQUFDLElBQUQ7WUFDeEIsSUFBRyxLQUFBLENBQU0sSUFBTixDQUFIO3VCQUNJLEVBQUEsQ0FBRyxjQUFBLEdBQWUsSUFBbEIsRUFESjthQUFBLE1BQUE7dUJBR0ksRUFBQSxDQUFHLElBQUgsRUFBUyxJQUFULEVBSEo7O1FBRHdCLENBQTVCO0lBSkk7O0lBYVIsSUFBQyxDQUFBLE1BQUQsR0FBUyxTQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsRUFBYjtlQUVMLEVBQUUsQ0FBQyxLQUFILENBQVMsSUFBVCxFQUFlLEtBQWYsRUFBc0IsU0FBQyxHQUFEO1lBRWxCLElBQUcsS0FBQSxDQUFNLEdBQU4sQ0FBSDt1QkFDSSxFQUFBLENBQUcsR0FBSCxFQURKO2FBQUEsTUFBQTt1QkFHSSxJQUFJLENBQUMsS0FBTCxDQUFXLElBQVgsRUFBaUIsSUFBakIsRUFBdUIsS0FBdkIsRUFBOEIsRUFBOUIsRUFISjs7UUFGa0IsQ0FBdEI7SUFGSzs7SUFTVCxJQUFDLENBQUEsTUFBRCxHQUFTLFNBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxFQUFiO0FBRUwsWUFBQTtRQUFBLEtBQUssQ0FBQyxTQUFOLEdBQWtCO1FBRWxCLElBQUcsS0FBSyxDQUFDLEdBQU4sQ0FBQSxDQUFIO0FBQ0k7dUJBQ0ksTUFBTSxDQUFDLElBQVAsQ0FBWSxVQUFBLEdBQVUsQ0FBQyxLQUFLLENBQUMsT0FBTixDQUFjLElBQWQsQ0FBRCxDQUF0QixFQUE4QyxTQUFDLEdBQUQ7b0JBQzFDLElBQUcsS0FBQSxDQUFNLEdBQU4sQ0FBSDsrQkFDSSxJQUFJLENBQUMsTUFBTCxDQUFZLElBQVosRUFBa0IsSUFBbEIsRUFBd0IsRUFBeEIsRUFESjtxQkFBQSxNQUFBOytCQUdJLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBWCxFQUFpQixJQUFqQixFQUF1QixLQUF2QixFQUE4QixFQUE5QixFQUhKOztnQkFEMEMsQ0FBOUMsRUFESjthQUFBLGFBQUE7Z0JBTU07dUJBQ0YsSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFaLEVBQWtCLElBQWxCLEVBQXdCLEVBQXhCLEVBUEo7YUFESjtTQUFBLE1BQUE7bUJBVUksSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFaLEVBQWtCLElBQWxCLEVBQXdCLEVBQXhCLEVBVko7O0lBSks7O0lBZ0JULElBQUMsQ0FBQSxJQUFELEdBQU8sU0FBQyxJQUFELEVBQU8sSUFBUCxFQUFhLEVBQWI7UUFFSCxLQUFLLENBQUMsU0FBTixHQUFrQjtlQUVsQixLQUFLLENBQUMsVUFBTixDQUFpQixJQUFqQixFQUF1QixTQUFDLElBQUQ7WUFFbkIsSUFBRyxJQUFIO3VCQUVJLEtBQUssQ0FBQyxVQUFOLENBQWlCLElBQWpCLEVBQXVCLFNBQUMsUUFBRDtvQkFFbkIsSUFBRyxRQUFIOytCQUVJLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBWCxFQUFpQixJQUFqQixFQUF1QixJQUFJLENBQUMsSUFBNUIsRUFBa0MsRUFBbEMsRUFGSjtxQkFBQSxNQUFBOytCQU1JLElBQUksQ0FBQyxNQUFMLENBQVksSUFBWixFQUFrQixJQUFsQixFQUF3QixFQUF4QixFQU5KOztnQkFGbUIsQ0FBdkIsRUFGSjthQUFBLE1BQUE7dUJBWUksSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFYLEVBQWlCLElBQWpCLEVBQXVCLEtBQXZCLEVBQThCLEVBQTlCLEVBWko7O1FBRm1CLENBQXZCO0lBSkc7Ozs7OztBQW9CWCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwIFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICBcbjAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIyNcblxueyBjaGlsZHAsIHNsYXNoLCBlbXB0eSwgdmFsaWQsIGZzIH0gPSByZXF1aXJlICdreGsnXG5cbmljb25zID0gcmVxdWlyZSAnLi9pY29ucy5qc29uJ1xuXG5jbGFzcyBGaWxlXG4gICAgXG4gICAgQHNvdXJjZUZpbGVFeHRlbnNpb25zOiBbICdrb2ZmZWUnICdjb2ZmZWUnICdzdHlsJyAnc3dpZnQnICdwdWcnICdtZCcgJ25vb24nICd0eHQnICdqc29uJyAnc2gnICdweScgJ2NwcCcgJ2NjJyAnYycgJ2NzJyAnaCcgJ2hwcCcgJ3RzJyAnanMnXVxuXG4gICAgQGljb25DbGFzc05hbWU6IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgZmlsZSA9IHNsYXNoLnJlbW92ZUxpbmVQb3MgZmlsZVxuICAgICAgICBcbiAgICAgICAgY2xzcyAgPSBpY29ucy5leHRbc2xhc2guZXh0IGZpbGVdXG4gICAgICAgIGNsc3MgPz0gaWNvbnMuYmFzZVtzbGFzaC5iYXNlKGZpbGUpLnRvTG93ZXJDYXNlKCldXG4gICAgICAgIGNsc3MgPz0gJ2ZpbGUnXG4gICAgICAgIFwiaWNvbiAje2Nsc3N9XCJcbiAgICAgICAgXG4gICAgQHdyaXRlOiAoZmlsZSwgdGV4dCwgbW9kZSwgY2IpIC0+XG4gIFxuICAgICAgICBzbGFzaC5sb2dFcnJvcnMgPSB0cnVlXG4gICAgICAgIFxuICAgICAgICBzbGFzaC53cml0ZVRleHQgZmlsZSwgdGV4dCwgKGRvbmUpIC0+XG4gICAgICAgICAgICBpZiBlbXB0eSBkb25lXG4gICAgICAgICAgICAgICAgY2IgXCJjYW4ndCB3cml0ZSAje2ZpbGV9XCJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBjYiBudWxsLCBkb25lXG4gICAgICAgICMgZnMud3JpdGVGaWxlIGZpbGUsIHRleHQsIHsgZW5jb2Rpbmc6ICd1dGY4JywgbW9kZTogbW9kZSB9LCAoZXJyKSAtPlxuICAgICAgICAgICAgIyBpZiB2YWxpZCBlcnIgdGhlbiBjYiBlcnJcbiAgICAgICAgICAgICMgZWxzZSBjYiBudWxsLCBmaWxlXG4gICAgXG4gICAgQHVubG9jazogKGZpbGUsIHRleHQsIGNiKSAtPlxuICAgICAgICBcbiAgICAgICAgZnMuY2htb2QgZmlsZSwgMG82NjYsIChlcnIpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHZhbGlkIGVyclxuICAgICAgICAgICAgICAgIGNiIGVyclxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEZpbGUud3JpdGUgZmlsZSwgdGV4dCwgMG82NjYsIGNiXG4gICAgICAgICAgICBcbiAgICBAcDRlZGl0OiAoZmlsZSwgdGV4dCwgY2IpIC0+XG4gICAgICAgIFxuICAgICAgICBzbGFzaC5sb2dFcnJvcnMgPSB0cnVlXG4gICAgICAgIFxuICAgICAgICBpZiBzbGFzaC53aW4oKVxuICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgICAgY2hpbGRwLmV4ZWMgXCJwNCBlZGl0ICN7c2xhc2gudW5zbGFzaChmaWxlKX1cIiwgKGVycikgLT5cbiAgICAgICAgICAgICAgICAgICAgaWYgdmFsaWQgZXJyXG4gICAgICAgICAgICAgICAgICAgICAgICBGaWxlLnVubG9jayBmaWxlLCB0ZXh0LCBjYlxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBGaWxlLndyaXRlIGZpbGUsIHRleHQsIDBvNjY2LCBjYlxuICAgICAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICAgICAgRmlsZS51bmxvY2sgZmlsZSwgdGV4dCwgY2JcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgRmlsZS51bmxvY2sgZmlsZSwgdGV4dCwgY2JcbiAgICAgICAgICAgIFxuICAgIEBzYXZlOiAoZmlsZSwgdGV4dCwgY2IpIC0+XG4gICAgXG4gICAgICAgIHNsYXNoLmxvZ0Vycm9ycyA9IHRydWVcbiAgICAgICAgXG4gICAgICAgIHNsYXNoLmZpbGVFeGlzdHMgZmlsZSwgKHN0YXQpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHN0YXRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBzbGFzaC5pc1dyaXRhYmxlIGZpbGUsICh3cml0YWJsZSkgLT5cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIHdyaXRhYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIEZpbGUud3JpdGUgZmlsZSwgdGV4dCwgc3RhdC5tb2RlLCBjYlxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgRmlsZS5wNGVkaXQgZmlsZSwgdGV4dCwgY2JcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBGaWxlLndyaXRlIGZpbGUsIHRleHQsIDBvNjY2LCBjYlxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gRmlsZVxuIl19
//# sourceURL=../../coffee/tools/file.coffee