// koffee 1.11.0

/*
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
 */
var File, childp, empty, fs, icons, ref, slash, valid;

ref = require('kxk'), childp = ref.childp, empty = ref.empty, fs = ref.fs, slash = ref.slash, valid = ref.valid;

icons = require('./icons.json');

File = (function() {
    function File() {}

    File.sourceFileExtensions = ['koffee', 'coffee', 'styl', 'swift', 'pug', 'md', 'noon', 'txt', 'json', 'sh', 'py', 'cpp', 'cc', 'c', 'cs', 'h', 'hpp', 'ts', 'js', 'frag', 'vert'];

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvdG9vbHMiLCJzb3VyY2VzIjpbImZpbGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLE1BQXNDLE9BQUEsQ0FBUSxLQUFSLENBQXRDLEVBQUUsbUJBQUYsRUFBVSxpQkFBVixFQUFpQixXQUFqQixFQUFxQixpQkFBckIsRUFBNEI7O0FBRTVCLEtBQUEsR0FBUSxPQUFBLENBQVEsY0FBUjs7QUFFRjs7O0lBRUYsSUFBQyxDQUFBLG9CQUFELEdBQXVCLENBQUUsUUFBRixFQUFXLFFBQVgsRUFBb0IsTUFBcEIsRUFBMkIsT0FBM0IsRUFBbUMsS0FBbkMsRUFBeUMsSUFBekMsRUFBOEMsTUFBOUMsRUFBcUQsS0FBckQsRUFBMkQsTUFBM0QsRUFBa0UsSUFBbEUsRUFBdUUsSUFBdkUsRUFBNEUsS0FBNUUsRUFBa0YsSUFBbEYsRUFBdUYsR0FBdkYsRUFBMkYsSUFBM0YsRUFBZ0csR0FBaEcsRUFBb0csS0FBcEcsRUFBMEcsSUFBMUcsRUFBK0csSUFBL0csRUFBb0gsTUFBcEgsRUFBMkgsTUFBM0g7O0lBRXZCLElBQUMsQ0FBQSxhQUFELEdBQWdCLFNBQUMsSUFBRDtBQUVaLFlBQUE7UUFBQSxJQUFBLEdBQU8sS0FBSyxDQUFDLGFBQU4sQ0FBb0IsSUFBcEI7UUFFUCxJQUFBLEdBQVEsS0FBSyxDQUFDLEdBQUksQ0FBQSxLQUFLLENBQUMsR0FBTixDQUFVLElBQVYsQ0FBQTs7WUFDbEI7O1lBQUEsT0FBUSxLQUFLLENBQUMsSUFBSyxDQUFBLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxDQUFnQixDQUFDLFdBQWpCLENBQUEsQ0FBQTs7O1lBQ25COztZQUFBLE9BQVE7O2VBQ1IsT0FBQSxHQUFRO0lBUEk7O0lBU2hCLElBQUMsQ0FBQSxLQUFELEdBQVEsU0FBQyxJQUFELEVBQU8sSUFBUCxFQUFhLElBQWIsRUFBbUIsRUFBbkI7UUFFSixLQUFLLENBQUMsU0FBTixHQUFrQjtlQUVsQixLQUFLLENBQUMsU0FBTixDQUFnQixJQUFoQixFQUFzQixJQUF0QixFQUE0QixTQUFDLElBQUQ7WUFDeEIsSUFBRyxLQUFBLENBQU0sSUFBTixDQUFIO3VCQUNJLEVBQUEsQ0FBRyxjQUFBLEdBQWUsSUFBbEIsRUFESjthQUFBLE1BQUE7dUJBR0ksRUFBQSxDQUFHLElBQUgsRUFBUyxJQUFULEVBSEo7O1FBRHdCLENBQTVCO0lBSkk7O0lBYVIsSUFBQyxDQUFBLE1BQUQsR0FBUyxTQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsRUFBYjtlQUVMLEVBQUUsQ0FBQyxLQUFILENBQVMsSUFBVCxFQUFlLEtBQWYsRUFBc0IsU0FBQyxHQUFEO1lBRWxCLElBQUcsS0FBQSxDQUFNLEdBQU4sQ0FBSDt1QkFDSSxFQUFBLENBQUcsR0FBSCxFQURKO2FBQUEsTUFBQTt1QkFHSSxJQUFJLENBQUMsS0FBTCxDQUFXLElBQVgsRUFBaUIsSUFBakIsRUFBdUIsS0FBdkIsRUFBOEIsRUFBOUIsRUFISjs7UUFGa0IsQ0FBdEI7SUFGSzs7SUFTVCxJQUFDLENBQUEsTUFBRCxHQUFTLFNBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxFQUFiO0FBRUwsWUFBQTtRQUFBLEtBQUssQ0FBQyxTQUFOLEdBQWtCO1FBRWxCLElBQUcsS0FBSyxDQUFDLEdBQU4sQ0FBQSxDQUFIO0FBQ0k7dUJBQ0ksTUFBTSxDQUFDLElBQVAsQ0FBWSxVQUFBLEdBQVUsQ0FBQyxLQUFLLENBQUMsT0FBTixDQUFjLElBQWQsQ0FBRCxDQUF0QixFQUE4QyxTQUFDLEdBQUQ7b0JBQzFDLElBQUcsS0FBQSxDQUFNLEdBQU4sQ0FBSDsrQkFDSSxJQUFJLENBQUMsTUFBTCxDQUFZLElBQVosRUFBa0IsSUFBbEIsRUFBd0IsRUFBeEIsRUFESjtxQkFBQSxNQUFBOytCQUdJLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBWCxFQUFpQixJQUFqQixFQUF1QixLQUF2QixFQUE4QixFQUE5QixFQUhKOztnQkFEMEMsQ0FBOUMsRUFESjthQUFBLGFBQUE7Z0JBTU07dUJBQ0YsSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFaLEVBQWtCLElBQWxCLEVBQXdCLEVBQXhCLEVBUEo7YUFESjtTQUFBLE1BQUE7bUJBVUksSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFaLEVBQWtCLElBQWxCLEVBQXdCLEVBQXhCLEVBVko7O0lBSks7O0lBZ0JULElBQUMsQ0FBQSxJQUFELEdBQU8sU0FBQyxJQUFELEVBQU8sSUFBUCxFQUFhLEVBQWI7UUFFSCxLQUFLLENBQUMsU0FBTixHQUFrQjtlQUVsQixLQUFLLENBQUMsVUFBTixDQUFpQixJQUFqQixFQUF1QixTQUFDLElBQUQ7WUFFbkIsSUFBRyxJQUFIO3VCQUVJLEtBQUssQ0FBQyxVQUFOLENBQWlCLElBQWpCLEVBQXVCLFNBQUMsUUFBRDtvQkFFbkIsSUFBRyxRQUFIOytCQUVJLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBWCxFQUFpQixJQUFqQixFQUF1QixJQUFJLENBQUMsSUFBNUIsRUFBa0MsRUFBbEMsRUFGSjtxQkFBQSxNQUFBOytCQU1JLElBQUksQ0FBQyxNQUFMLENBQVksSUFBWixFQUFrQixJQUFsQixFQUF3QixFQUF4QixFQU5KOztnQkFGbUIsQ0FBdkIsRUFGSjthQUFBLE1BQUE7dUJBWUksSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFYLEVBQWlCLElBQWpCLEVBQXVCLEtBQXZCLEVBQThCLEVBQTlCLEVBWko7O1FBRm1CLENBQXZCO0lBSkc7Ozs7OztBQW9CWCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwIFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICBcbjAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIyNcblxueyBjaGlsZHAsIGVtcHR5LCBmcywgc2xhc2gsIHZhbGlkIH0gPSByZXF1aXJlICdreGsnXG5cbmljb25zID0gcmVxdWlyZSAnLi9pY29ucy5qc29uJ1xuXG5jbGFzcyBGaWxlXG4gICAgXG4gICAgQHNvdXJjZUZpbGVFeHRlbnNpb25zOiBbICdrb2ZmZWUnICdjb2ZmZWUnICdzdHlsJyAnc3dpZnQnICdwdWcnICdtZCcgJ25vb24nICd0eHQnICdqc29uJyAnc2gnICdweScgJ2NwcCcgJ2NjJyAnYycgJ2NzJyAnaCcgJ2hwcCcgJ3RzJyAnanMnICdmcmFnJyAndmVydCddXG5cbiAgICBAaWNvbkNsYXNzTmFtZTogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBmaWxlID0gc2xhc2gucmVtb3ZlTGluZVBvcyBmaWxlXG4gICAgICAgIFxuICAgICAgICBjbHNzICA9IGljb25zLmV4dFtzbGFzaC5leHQgZmlsZV1cbiAgICAgICAgY2xzcyA/PSBpY29ucy5iYXNlW3NsYXNoLmJhc2UoZmlsZSkudG9Mb3dlckNhc2UoKV1cbiAgICAgICAgY2xzcyA/PSAnZmlsZSdcbiAgICAgICAgXCJpY29uICN7Y2xzc31cIlxuICAgICAgICBcbiAgICBAd3JpdGU6IChmaWxlLCB0ZXh0LCBtb2RlLCBjYikgLT5cbiAgXG4gICAgICAgIHNsYXNoLmxvZ0Vycm9ycyA9IHRydWVcbiAgICAgICAgXG4gICAgICAgIHNsYXNoLndyaXRlVGV4dCBmaWxlLCB0ZXh0LCAoZG9uZSkgLT5cbiAgICAgICAgICAgIGlmIGVtcHR5IGRvbmVcbiAgICAgICAgICAgICAgICBjYiBcImNhbid0IHdyaXRlICN7ZmlsZX1cIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNiIG51bGwsIGRvbmVcbiAgICAgICAgIyBmcy53cml0ZUZpbGUgZmlsZSwgdGV4dCwgeyBlbmNvZGluZzogJ3V0ZjgnLCBtb2RlOiBtb2RlIH0sIChlcnIpIC0+XG4gICAgICAgICAgICAjIGlmIHZhbGlkIGVyciB0aGVuIGNiIGVyclxuICAgICAgICAgICAgIyBlbHNlIGNiIG51bGwsIGZpbGVcbiAgICBcbiAgICBAdW5sb2NrOiAoZmlsZSwgdGV4dCwgY2IpIC0+XG4gICAgICAgIFxuICAgICAgICBmcy5jaG1vZCBmaWxlLCAwbzY2NiwgKGVycikgLT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgdmFsaWQgZXJyXG4gICAgICAgICAgICAgICAgY2IgZXJyXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgRmlsZS53cml0ZSBmaWxlLCB0ZXh0LCAwbzY2NiwgY2JcbiAgICAgICAgICAgIFxuICAgIEBwNGVkaXQ6IChmaWxlLCB0ZXh0LCBjYikgLT5cbiAgICAgICAgXG4gICAgICAgIHNsYXNoLmxvZ0Vycm9ycyA9IHRydWVcbiAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLndpbigpXG4gICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAgICBjaGlsZHAuZXhlYyBcInA0IGVkaXQgI3tzbGFzaC51bnNsYXNoKGZpbGUpfVwiLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgICAgICBpZiB2YWxpZCBlcnJcbiAgICAgICAgICAgICAgICAgICAgICAgIEZpbGUudW5sb2NrIGZpbGUsIHRleHQsIGNiXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEZpbGUud3JpdGUgZmlsZSwgdGV4dCwgMG82NjYsIGNiXG4gICAgICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgICAgICBGaWxlLnVubG9jayBmaWxlLCB0ZXh0LCBjYlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBGaWxlLnVubG9jayBmaWxlLCB0ZXh0LCBjYlxuICAgICAgICAgICAgXG4gICAgQHNhdmU6IChmaWxlLCB0ZXh0LCBjYikgLT5cbiAgICBcbiAgICAgICAgc2xhc2gubG9nRXJyb3JzID0gdHJ1ZVxuICAgICAgICBcbiAgICAgICAgc2xhc2guZmlsZUV4aXN0cyBmaWxlLCAoc3RhdCkgLT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgc3RhdFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHNsYXNoLmlzV3JpdGFibGUgZmlsZSwgKHdyaXRhYmxlKSAtPlxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgd3JpdGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgRmlsZS53cml0ZSBmaWxlLCB0ZXh0LCBzdGF0Lm1vZGUsIGNiXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBGaWxlLnA0ZWRpdCBmaWxlLCB0ZXh0LCBjYlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEZpbGUud3JpdGUgZmlsZSwgdGV4dCwgMG82NjYsIGNiXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBGaWxlXG4iXX0=
//# sourceURL=../../coffee/tools/file.coffee