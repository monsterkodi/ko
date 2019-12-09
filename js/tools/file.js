// koffee 1.6.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBc0MsT0FBQSxDQUFRLEtBQVIsQ0FBdEMsRUFBRSxtQkFBRixFQUFVLGlCQUFWLEVBQWlCLFdBQWpCLEVBQXFCLGlCQUFyQixFQUE0Qjs7QUFFNUIsS0FBQSxHQUFRLE9BQUEsQ0FBUSxjQUFSOztBQUVGOzs7SUFFRixJQUFDLENBQUEsb0JBQUQsR0FBdUIsQ0FBRSxRQUFGLEVBQVcsUUFBWCxFQUFvQixNQUFwQixFQUEyQixPQUEzQixFQUFtQyxLQUFuQyxFQUF5QyxJQUF6QyxFQUE4QyxNQUE5QyxFQUFxRCxLQUFyRCxFQUEyRCxNQUEzRCxFQUFrRSxJQUFsRSxFQUF1RSxJQUF2RSxFQUE0RSxLQUE1RSxFQUFrRixJQUFsRixFQUF1RixHQUF2RixFQUEyRixJQUEzRixFQUFnRyxHQUFoRyxFQUFvRyxLQUFwRyxFQUEwRyxJQUExRyxFQUErRyxJQUEvRzs7SUFFdkIsSUFBQyxDQUFBLGFBQUQsR0FBZ0IsU0FBQyxJQUFEO0FBRVosWUFBQTtRQUFBLElBQUEsR0FBTyxLQUFLLENBQUMsYUFBTixDQUFvQixJQUFwQjtRQUVQLElBQUEsR0FBUSxLQUFLLENBQUMsR0FBSSxDQUFBLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixDQUFBOztZQUNsQjs7WUFBQSxPQUFRLEtBQUssQ0FBQyxJQUFLLENBQUEsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLENBQWdCLENBQUMsV0FBakIsQ0FBQSxDQUFBOzs7WUFDbkI7O1lBQUEsT0FBUTs7ZUFDUixPQUFBLEdBQVE7SUFQSTs7SUFTaEIsSUFBQyxDQUFBLEtBQUQsR0FBUSxTQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsSUFBYixFQUFtQixFQUFuQjtRQUVKLEtBQUssQ0FBQyxTQUFOLEdBQWtCO2VBRWxCLEtBQUssQ0FBQyxTQUFOLENBQWdCLElBQWhCLEVBQXNCLElBQXRCLEVBQTRCLFNBQUMsSUFBRDtZQUN4QixJQUFHLEtBQUEsQ0FBTSxJQUFOLENBQUg7dUJBQ0ksRUFBQSxDQUFHLGNBQUEsR0FBZSxJQUFsQixFQURKO2FBQUEsTUFBQTt1QkFHSSxFQUFBLENBQUcsSUFBSCxFQUFTLElBQVQsRUFISjs7UUFEd0IsQ0FBNUI7SUFKSTs7SUFhUixJQUFDLENBQUEsTUFBRCxHQUFTLFNBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxFQUFiO2VBRUwsRUFBRSxDQUFDLEtBQUgsQ0FBUyxJQUFULEVBQWUsS0FBZixFQUFzQixTQUFDLEdBQUQ7WUFFbEIsSUFBRyxLQUFBLENBQU0sR0FBTixDQUFIO3VCQUNJLEVBQUEsQ0FBRyxHQUFILEVBREo7YUFBQSxNQUFBO3VCQUdJLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBWCxFQUFpQixJQUFqQixFQUF1QixLQUF2QixFQUE4QixFQUE5QixFQUhKOztRQUZrQixDQUF0QjtJQUZLOztJQVNULElBQUMsQ0FBQSxNQUFELEdBQVMsU0FBQyxJQUFELEVBQU8sSUFBUCxFQUFhLEVBQWI7QUFFTCxZQUFBO1FBQUEsS0FBSyxDQUFDLFNBQU4sR0FBa0I7UUFFbEIsSUFBRyxLQUFLLENBQUMsR0FBTixDQUFBLENBQUg7QUFDSTt1QkFDSSxNQUFNLENBQUMsSUFBUCxDQUFZLFVBQUEsR0FBVSxDQUFDLEtBQUssQ0FBQyxPQUFOLENBQWMsSUFBZCxDQUFELENBQXRCLEVBQThDLFNBQUMsR0FBRDtvQkFDMUMsSUFBRyxLQUFBLENBQU0sR0FBTixDQUFIOytCQUNJLElBQUksQ0FBQyxNQUFMLENBQVksSUFBWixFQUFrQixJQUFsQixFQUF3QixFQUF4QixFQURKO3FCQUFBLE1BQUE7K0JBR0ksSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFYLEVBQWlCLElBQWpCLEVBQXVCLEtBQXZCLEVBQThCLEVBQTlCLEVBSEo7O2dCQUQwQyxDQUE5QyxFQURKO2FBQUEsYUFBQTtnQkFNTTt1QkFDRixJQUFJLENBQUMsTUFBTCxDQUFZLElBQVosRUFBa0IsSUFBbEIsRUFBd0IsRUFBeEIsRUFQSjthQURKO1NBQUEsTUFBQTttQkFVSSxJQUFJLENBQUMsTUFBTCxDQUFZLElBQVosRUFBa0IsSUFBbEIsRUFBd0IsRUFBeEIsRUFWSjs7SUFKSzs7SUFnQlQsSUFBQyxDQUFBLElBQUQsR0FBTyxTQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsRUFBYjtRQUVILEtBQUssQ0FBQyxTQUFOLEdBQWtCO2VBRWxCLEtBQUssQ0FBQyxVQUFOLENBQWlCLElBQWpCLEVBQXVCLFNBQUMsSUFBRDtZQUVuQixJQUFHLElBQUg7dUJBRUksS0FBSyxDQUFDLFVBQU4sQ0FBaUIsSUFBakIsRUFBdUIsU0FBQyxRQUFEO29CQUVuQixJQUFHLFFBQUg7K0JBRUksSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFYLEVBQWlCLElBQWpCLEVBQXVCLElBQUksQ0FBQyxJQUE1QixFQUFrQyxFQUFsQyxFQUZKO3FCQUFBLE1BQUE7K0JBTUksSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFaLEVBQWtCLElBQWxCLEVBQXdCLEVBQXhCLEVBTko7O2dCQUZtQixDQUF2QixFQUZKO2FBQUEsTUFBQTt1QkFZSSxJQUFJLENBQUMsS0FBTCxDQUFXLElBQVgsRUFBaUIsSUFBakIsRUFBdUIsS0FBdkIsRUFBOEIsRUFBOUIsRUFaSjs7UUFGbUIsQ0FBdkI7SUFKRzs7Ozs7O0FBb0JYLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICBcbjAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgIFxuMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiMjI1xuXG57IGNoaWxkcCwgZW1wdHksIGZzLCBzbGFzaCwgdmFsaWQgfSA9IHJlcXVpcmUgJ2t4aydcblxuaWNvbnMgPSByZXF1aXJlICcuL2ljb25zLmpzb24nXG5cbmNsYXNzIEZpbGVcbiAgICBcbiAgICBAc291cmNlRmlsZUV4dGVuc2lvbnM6IFsgJ2tvZmZlZScgJ2NvZmZlZScgJ3N0eWwnICdzd2lmdCcgJ3B1ZycgJ21kJyAnbm9vbicgJ3R4dCcgJ2pzb24nICdzaCcgJ3B5JyAnY3BwJyAnY2MnICdjJyAnY3MnICdoJyAnaHBwJyAndHMnICdqcyddXG5cbiAgICBAaWNvbkNsYXNzTmFtZTogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBmaWxlID0gc2xhc2gucmVtb3ZlTGluZVBvcyBmaWxlXG4gICAgICAgIFxuICAgICAgICBjbHNzICA9IGljb25zLmV4dFtzbGFzaC5leHQgZmlsZV1cbiAgICAgICAgY2xzcyA/PSBpY29ucy5iYXNlW3NsYXNoLmJhc2UoZmlsZSkudG9Mb3dlckNhc2UoKV1cbiAgICAgICAgY2xzcyA/PSAnZmlsZSdcbiAgICAgICAgXCJpY29uICN7Y2xzc31cIlxuICAgICAgICBcbiAgICBAd3JpdGU6IChmaWxlLCB0ZXh0LCBtb2RlLCBjYikgLT5cbiAgXG4gICAgICAgIHNsYXNoLmxvZ0Vycm9ycyA9IHRydWVcbiAgICAgICAgXG4gICAgICAgIHNsYXNoLndyaXRlVGV4dCBmaWxlLCB0ZXh0LCAoZG9uZSkgLT5cbiAgICAgICAgICAgIGlmIGVtcHR5IGRvbmVcbiAgICAgICAgICAgICAgICBjYiBcImNhbid0IHdyaXRlICN7ZmlsZX1cIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNiIG51bGwsIGRvbmVcbiAgICAgICAgIyBmcy53cml0ZUZpbGUgZmlsZSwgdGV4dCwgeyBlbmNvZGluZzogJ3V0ZjgnLCBtb2RlOiBtb2RlIH0sIChlcnIpIC0+XG4gICAgICAgICAgICAjIGlmIHZhbGlkIGVyciB0aGVuIGNiIGVyclxuICAgICAgICAgICAgIyBlbHNlIGNiIG51bGwsIGZpbGVcbiAgICBcbiAgICBAdW5sb2NrOiAoZmlsZSwgdGV4dCwgY2IpIC0+XG4gICAgICAgIFxuICAgICAgICBmcy5jaG1vZCBmaWxlLCAwbzY2NiwgKGVycikgLT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgdmFsaWQgZXJyXG4gICAgICAgICAgICAgICAgY2IgZXJyXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgRmlsZS53cml0ZSBmaWxlLCB0ZXh0LCAwbzY2NiwgY2JcbiAgICAgICAgICAgIFxuICAgIEBwNGVkaXQ6IChmaWxlLCB0ZXh0LCBjYikgLT5cbiAgICAgICAgXG4gICAgICAgIHNsYXNoLmxvZ0Vycm9ycyA9IHRydWVcbiAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLndpbigpXG4gICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAgICBjaGlsZHAuZXhlYyBcInA0IGVkaXQgI3tzbGFzaC51bnNsYXNoKGZpbGUpfVwiLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgICAgICBpZiB2YWxpZCBlcnJcbiAgICAgICAgICAgICAgICAgICAgICAgIEZpbGUudW5sb2NrIGZpbGUsIHRleHQsIGNiXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEZpbGUud3JpdGUgZmlsZSwgdGV4dCwgMG82NjYsIGNiXG4gICAgICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgICAgICBGaWxlLnVubG9jayBmaWxlLCB0ZXh0LCBjYlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBGaWxlLnVubG9jayBmaWxlLCB0ZXh0LCBjYlxuICAgICAgICAgICAgXG4gICAgQHNhdmU6IChmaWxlLCB0ZXh0LCBjYikgLT5cbiAgICBcbiAgICAgICAgc2xhc2gubG9nRXJyb3JzID0gdHJ1ZVxuICAgICAgICBcbiAgICAgICAgc2xhc2guZmlsZUV4aXN0cyBmaWxlLCAoc3RhdCkgLT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgc3RhdFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHNsYXNoLmlzV3JpdGFibGUgZmlsZSwgKHdyaXRhYmxlKSAtPlxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgd3JpdGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgRmlsZS53cml0ZSBmaWxlLCB0ZXh0LCBzdGF0Lm1vZGUsIGNiXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBGaWxlLnA0ZWRpdCBmaWxlLCB0ZXh0LCBjYlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEZpbGUud3JpdGUgZmlsZSwgdGV4dCwgMG82NjYsIGNiXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBGaWxlXG4iXX0=
//# sourceURL=../../coffee/tools/file.coffee