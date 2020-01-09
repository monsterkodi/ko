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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBc0MsT0FBQSxDQUFRLEtBQVIsQ0FBdEMsRUFBRSxtQkFBRixFQUFVLGlCQUFWLEVBQWlCLFdBQWpCLEVBQXFCLGlCQUFyQixFQUE0Qjs7QUFFNUIsS0FBQSxHQUFRLE9BQUEsQ0FBUSxjQUFSOztBQUVGOzs7SUFFRixJQUFDLENBQUEsb0JBQUQsR0FBdUIsQ0FBRSxRQUFGLEVBQVcsUUFBWCxFQUFvQixNQUFwQixFQUEyQixPQUEzQixFQUFtQyxLQUFuQyxFQUF5QyxJQUF6QyxFQUE4QyxNQUE5QyxFQUFxRCxLQUFyRCxFQUEyRCxNQUEzRCxFQUFrRSxJQUFsRSxFQUF1RSxJQUF2RSxFQUE0RSxLQUE1RSxFQUFrRixJQUFsRixFQUF1RixHQUF2RixFQUEyRixJQUEzRixFQUFnRyxHQUFoRyxFQUFvRyxLQUFwRyxFQUEwRyxJQUExRyxFQUErRyxJQUEvRyxFQUFvSCxNQUFwSCxFQUEySCxNQUEzSDs7SUFFdkIsSUFBQyxDQUFBLGFBQUQsR0FBZ0IsU0FBQyxJQUFEO0FBRVosWUFBQTtRQUFBLElBQUEsR0FBTyxLQUFLLENBQUMsYUFBTixDQUFvQixJQUFwQjtRQUVQLElBQUEsR0FBUSxLQUFLLENBQUMsR0FBSSxDQUFBLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixDQUFBOztZQUNsQjs7WUFBQSxPQUFRLEtBQUssQ0FBQyxJQUFLLENBQUEsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLENBQWdCLENBQUMsV0FBakIsQ0FBQSxDQUFBOzs7WUFDbkI7O1lBQUEsT0FBUTs7ZUFDUixPQUFBLEdBQVE7SUFQSTs7SUFTaEIsSUFBQyxDQUFBLEtBQUQsR0FBUSxTQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsSUFBYixFQUFtQixFQUFuQjtRQUVKLEtBQUssQ0FBQyxTQUFOLEdBQWtCO2VBRWxCLEtBQUssQ0FBQyxTQUFOLENBQWdCLElBQWhCLEVBQXNCLElBQXRCLEVBQTRCLFNBQUMsSUFBRDtZQUN4QixJQUFHLEtBQUEsQ0FBTSxJQUFOLENBQUg7dUJBQ0ksRUFBQSxDQUFHLGNBQUEsR0FBZSxJQUFsQixFQURKO2FBQUEsTUFBQTt1QkFHSSxFQUFBLENBQUcsSUFBSCxFQUFTLElBQVQsRUFISjs7UUFEd0IsQ0FBNUI7SUFKSTs7SUFhUixJQUFDLENBQUEsTUFBRCxHQUFTLFNBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxFQUFiO2VBRUwsRUFBRSxDQUFDLEtBQUgsQ0FBUyxJQUFULEVBQWUsS0FBZixFQUFzQixTQUFDLEdBQUQ7WUFFbEIsSUFBRyxLQUFBLENBQU0sR0FBTixDQUFIO3VCQUNJLEVBQUEsQ0FBRyxHQUFILEVBREo7YUFBQSxNQUFBO3VCQUdJLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBWCxFQUFpQixJQUFqQixFQUF1QixLQUF2QixFQUE4QixFQUE5QixFQUhKOztRQUZrQixDQUF0QjtJQUZLOztJQVNULElBQUMsQ0FBQSxNQUFELEdBQVMsU0FBQyxJQUFELEVBQU8sSUFBUCxFQUFhLEVBQWI7QUFFTCxZQUFBO1FBQUEsS0FBSyxDQUFDLFNBQU4sR0FBa0I7UUFFbEIsSUFBRyxLQUFLLENBQUMsR0FBTixDQUFBLENBQUg7QUFDSTt1QkFDSSxNQUFNLENBQUMsSUFBUCxDQUFZLFVBQUEsR0FBVSxDQUFDLEtBQUssQ0FBQyxPQUFOLENBQWMsSUFBZCxDQUFELENBQXRCLEVBQThDLFNBQUMsR0FBRDtvQkFDMUMsSUFBRyxLQUFBLENBQU0sR0FBTixDQUFIOytCQUNJLElBQUksQ0FBQyxNQUFMLENBQVksSUFBWixFQUFrQixJQUFsQixFQUF3QixFQUF4QixFQURKO3FCQUFBLE1BQUE7K0JBR0ksSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFYLEVBQWlCLElBQWpCLEVBQXVCLEtBQXZCLEVBQThCLEVBQTlCLEVBSEo7O2dCQUQwQyxDQUE5QyxFQURKO2FBQUEsYUFBQTtnQkFNTTt1QkFDRixJQUFJLENBQUMsTUFBTCxDQUFZLElBQVosRUFBa0IsSUFBbEIsRUFBd0IsRUFBeEIsRUFQSjthQURKO1NBQUEsTUFBQTttQkFVSSxJQUFJLENBQUMsTUFBTCxDQUFZLElBQVosRUFBa0IsSUFBbEIsRUFBd0IsRUFBeEIsRUFWSjs7SUFKSzs7SUFnQlQsSUFBQyxDQUFBLElBQUQsR0FBTyxTQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsRUFBYjtRQUVILEtBQUssQ0FBQyxTQUFOLEdBQWtCO2VBRWxCLEtBQUssQ0FBQyxVQUFOLENBQWlCLElBQWpCLEVBQXVCLFNBQUMsSUFBRDtZQUVuQixJQUFHLElBQUg7dUJBRUksS0FBSyxDQUFDLFVBQU4sQ0FBaUIsSUFBakIsRUFBdUIsU0FBQyxRQUFEO29CQUVuQixJQUFHLFFBQUg7K0JBRUksSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFYLEVBQWlCLElBQWpCLEVBQXVCLElBQUksQ0FBQyxJQUE1QixFQUFrQyxFQUFsQyxFQUZKO3FCQUFBLE1BQUE7K0JBTUksSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFaLEVBQWtCLElBQWxCLEVBQXdCLEVBQXhCLEVBTko7O2dCQUZtQixDQUF2QixFQUZKO2FBQUEsTUFBQTt1QkFZSSxJQUFJLENBQUMsS0FBTCxDQUFXLElBQVgsRUFBaUIsSUFBakIsRUFBdUIsS0FBdkIsRUFBOEIsRUFBOUIsRUFaSjs7UUFGbUIsQ0FBdkI7SUFKRzs7Ozs7O0FBb0JYLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICBcbjAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgIFxuMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiMjI1xuXG57IGNoaWxkcCwgZW1wdHksIGZzLCBzbGFzaCwgdmFsaWQgfSA9IHJlcXVpcmUgJ2t4aydcblxuaWNvbnMgPSByZXF1aXJlICcuL2ljb25zLmpzb24nXG5cbmNsYXNzIEZpbGVcbiAgICBcbiAgICBAc291cmNlRmlsZUV4dGVuc2lvbnM6IFsgJ2tvZmZlZScgJ2NvZmZlZScgJ3N0eWwnICdzd2lmdCcgJ3B1ZycgJ21kJyAnbm9vbicgJ3R4dCcgJ2pzb24nICdzaCcgJ3B5JyAnY3BwJyAnY2MnICdjJyAnY3MnICdoJyAnaHBwJyAndHMnICdqcycgJ2ZyYWcnICd2ZXJ0J11cblxuICAgIEBpY29uQ2xhc3NOYW1lOiAoZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGZpbGUgPSBzbGFzaC5yZW1vdmVMaW5lUG9zIGZpbGVcbiAgICAgICAgXG4gICAgICAgIGNsc3MgID0gaWNvbnMuZXh0W3NsYXNoLmV4dCBmaWxlXVxuICAgICAgICBjbHNzID89IGljb25zLmJhc2Vbc2xhc2guYmFzZShmaWxlKS50b0xvd2VyQ2FzZSgpXVxuICAgICAgICBjbHNzID89ICdmaWxlJ1xuICAgICAgICBcImljb24gI3tjbHNzfVwiXG4gICAgICAgIFxuICAgIEB3cml0ZTogKGZpbGUsIHRleHQsIG1vZGUsIGNiKSAtPlxuICBcbiAgICAgICAgc2xhc2gubG9nRXJyb3JzID0gdHJ1ZVxuICAgICAgICBcbiAgICAgICAgc2xhc2gud3JpdGVUZXh0IGZpbGUsIHRleHQsIChkb25lKSAtPlxuICAgICAgICAgICAgaWYgZW1wdHkgZG9uZVxuICAgICAgICAgICAgICAgIGNiIFwiY2FuJ3Qgd3JpdGUgI3tmaWxlfVwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgY2IgbnVsbCwgZG9uZVxuICAgICAgICAjIGZzLndyaXRlRmlsZSBmaWxlLCB0ZXh0LCB7IGVuY29kaW5nOiAndXRmOCcsIG1vZGU6IG1vZGUgfSwgKGVycikgLT5cbiAgICAgICAgICAgICMgaWYgdmFsaWQgZXJyIHRoZW4gY2IgZXJyXG4gICAgICAgICAgICAjIGVsc2UgY2IgbnVsbCwgZmlsZVxuICAgIFxuICAgIEB1bmxvY2s6IChmaWxlLCB0ZXh0LCBjYikgLT5cbiAgICAgICAgXG4gICAgICAgIGZzLmNobW9kIGZpbGUsIDBvNjY2LCAoZXJyKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiB2YWxpZCBlcnJcbiAgICAgICAgICAgICAgICBjYiBlcnJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBGaWxlLndyaXRlIGZpbGUsIHRleHQsIDBvNjY2LCBjYlxuICAgICAgICAgICAgXG4gICAgQHA0ZWRpdDogKGZpbGUsIHRleHQsIGNiKSAtPlxuICAgICAgICBcbiAgICAgICAgc2xhc2gubG9nRXJyb3JzID0gdHJ1ZVxuICAgICAgICBcbiAgICAgICAgaWYgc2xhc2gud2luKClcbiAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICAgIGNoaWxkcC5leGVjIFwicDQgZWRpdCAje3NsYXNoLnVuc2xhc2goZmlsZSl9XCIsIChlcnIpIC0+XG4gICAgICAgICAgICAgICAgICAgIGlmIHZhbGlkIGVyclxuICAgICAgICAgICAgICAgICAgICAgICAgRmlsZS51bmxvY2sgZmlsZSwgdGV4dCwgY2JcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgRmlsZS53cml0ZSBmaWxlLCB0ZXh0LCAwbzY2NiwgY2JcbiAgICAgICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgICAgIEZpbGUudW5sb2NrIGZpbGUsIHRleHQsIGNiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEZpbGUudW5sb2NrIGZpbGUsIHRleHQsIGNiXG4gICAgICAgICAgICBcbiAgICBAc2F2ZTogKGZpbGUsIHRleHQsIGNiKSAtPlxuICAgIFxuICAgICAgICBzbGFzaC5sb2dFcnJvcnMgPSB0cnVlXG4gICAgICAgIFxuICAgICAgICBzbGFzaC5maWxlRXhpc3RzIGZpbGUsIChzdGF0KSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBzdGF0XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgc2xhc2guaXNXcml0YWJsZSBmaWxlLCAod3JpdGFibGUpIC0+XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiB3cml0YWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBGaWxlLndyaXRlIGZpbGUsIHRleHQsIHN0YXQubW9kZSwgY2JcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIEZpbGUucDRlZGl0IGZpbGUsIHRleHQsIGNiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgRmlsZS53cml0ZSBmaWxlLCB0ZXh0LCAwbzY2NiwgY2JcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVcbiJdfQ==
//# sourceURL=../../coffee/tools/file.coffee