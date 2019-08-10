// koffee 1.4.0

/*
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
 */
var File, _, childp, empty, fs, ref, slash, valid;

ref = require('kxk'), empty = ref.empty, valid = ref.valid, childp = ref.childp, slash = ref.slash, fs = ref.fs, _ = ref._;

File = (function() {
    function File() {}

    File.sourceFileExtensions = ['koffee', 'coffee', 'styl', 'swift', 'pug', 'md', 'noon', 'txt', 'json', 'sh', 'py', 'cpp', 'cc', 'c', 'cs', 'h', 'hpp', 'ts', 'js'];

    File.iconClassName = function(file) {
        var className, err, fileIcons;
        file = slash.removeLinePos(file);
        switch (slash.ext(file)) {
            case 'noon':
                className = 'noon-icon';
                break;
            case 'koffee':
                className = 'coffee-icon';
                break;
            default:
                try {
                    fileIcons = require('file-icons-js');
                    className = fileIcons.getClass(file);
                } catch (error) {
                    err = error;
                    true;
                }
        }
        if (className != null) {
            className;
        } else {
            className = 'file-icon';
        }
        return className;
    };

    File.write = function(file, text, mode, cb) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBeUMsT0FBQSxDQUFRLEtBQVIsQ0FBekMsRUFBRSxpQkFBRixFQUFTLGlCQUFULEVBQWdCLG1CQUFoQixFQUF3QixpQkFBeEIsRUFBK0IsV0FBL0IsRUFBbUM7O0FBRTdCOzs7SUFFRixJQUFDLENBQUEsb0JBQUQsR0FBdUIsQ0FBRSxRQUFGLEVBQVcsUUFBWCxFQUFvQixNQUFwQixFQUEyQixPQUEzQixFQUFtQyxLQUFuQyxFQUF5QyxJQUF6QyxFQUE4QyxNQUE5QyxFQUFxRCxLQUFyRCxFQUEyRCxNQUEzRCxFQUFrRSxJQUFsRSxFQUF1RSxJQUF2RSxFQUE0RSxLQUE1RSxFQUFrRixJQUFsRixFQUF1RixHQUF2RixFQUEyRixJQUEzRixFQUFnRyxHQUFoRyxFQUFvRyxLQUFwRyxFQUEwRyxJQUExRyxFQUErRyxJQUEvRzs7SUFFdkIsSUFBQyxDQUFBLGFBQUQsR0FBZ0IsU0FBQyxJQUFEO0FBRVosWUFBQTtRQUFBLElBQUEsR0FBTyxLQUFLLENBQUMsYUFBTixDQUFvQixJQUFwQjtBQUNQLGdCQUFPLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixDQUFQO0FBQUEsaUJBQ1MsTUFEVDtnQkFDdUIsU0FBQSxHQUFZO0FBQTFCO0FBRFQsaUJBRVMsUUFGVDtnQkFFdUIsU0FBQSxHQUFZO0FBQTFCO0FBRlQ7QUFJUTtvQkFDSSxTQUFBLEdBQVksT0FBQSxDQUFRLGVBQVI7b0JBQ1osU0FBQSxHQUFZLFNBQVMsQ0FBQyxRQUFWLENBQW1CLElBQW5CLEVBRmhCO2lCQUFBLGFBQUE7b0JBR007b0JBQ0YsS0FKSjs7QUFKUjs7WUFVQTs7WUFBQSxZQUFhOztlQUNiO0lBZFk7O0lBZ0JoQixJQUFDLENBQUEsS0FBRCxHQUFRLFNBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxJQUFiLEVBQW1CLEVBQW5CO2VBRUosS0FBSyxDQUFDLFNBQU4sQ0FBZ0IsSUFBaEIsRUFBc0IsSUFBdEIsRUFBNEIsU0FBQyxJQUFEO1lBQ3hCLElBQUcsS0FBQSxDQUFNLElBQU4sQ0FBSDt1QkFDSSxFQUFBLENBQUcsY0FBQSxHQUFlLElBQWxCLEVBREo7YUFBQSxNQUFBO3VCQUdJLEVBQUEsQ0FBRyxJQUFILEVBQVMsSUFBVCxFQUhKOztRQUR3QixDQUE1QjtJQUZJOztJQVdSLElBQUMsQ0FBQSxNQUFELEdBQVMsU0FBQyxJQUFELEVBQU8sSUFBUCxFQUFhLEVBQWI7ZUFFTCxFQUFFLENBQUMsS0FBSCxDQUFTLElBQVQsRUFBZSxLQUFmLEVBQXNCLFNBQUMsR0FBRDtZQUVsQixJQUFHLEtBQUEsQ0FBTSxHQUFOLENBQUg7dUJBQ0ksRUFBQSxDQUFHLEdBQUgsRUFESjthQUFBLE1BQUE7dUJBR0ksSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFYLEVBQWlCLElBQWpCLEVBQXVCLEtBQXZCLEVBQThCLEVBQTlCLEVBSEo7O1FBRmtCLENBQXRCO0lBRks7O0lBU1QsSUFBQyxDQUFBLE1BQUQsR0FBUyxTQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsRUFBYjtBQUVMLFlBQUE7UUFBQSxJQUFHLEtBQUssQ0FBQyxHQUFOLENBQUEsQ0FBSDtBQUNJO3VCQUNJLE1BQU0sQ0FBQyxJQUFQLENBQVksVUFBQSxHQUFVLENBQUMsS0FBSyxDQUFDLE9BQU4sQ0FBYyxJQUFkLENBQUQsQ0FBdEIsRUFBOEMsU0FBQyxHQUFEO29CQUMxQyxJQUFHLEtBQUEsQ0FBTSxHQUFOLENBQUg7K0JBQ0ksSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFaLEVBQWtCLElBQWxCLEVBQXdCLEVBQXhCLEVBREo7cUJBQUEsTUFBQTsrQkFHSSxJQUFJLENBQUMsS0FBTCxDQUFXLElBQVgsRUFBaUIsSUFBakIsRUFBdUIsS0FBdkIsRUFBOEIsRUFBOUIsRUFISjs7Z0JBRDBDLENBQTlDLEVBREo7YUFBQSxhQUFBO2dCQU1NO3VCQUNGLElBQUksQ0FBQyxNQUFMLENBQVksSUFBWixFQUFrQixJQUFsQixFQUF3QixFQUF4QixFQVBKO2FBREo7U0FBQSxNQUFBO21CQVVJLElBQUksQ0FBQyxNQUFMLENBQVksSUFBWixFQUFrQixJQUFsQixFQUF3QixFQUF4QixFQVZKOztJQUZLOztJQWNULElBQUMsQ0FBQSxJQUFELEdBQU8sU0FBQyxJQUFELEVBQU8sSUFBUCxFQUFhLEVBQWI7ZUFFSCxLQUFLLENBQUMsVUFBTixDQUFpQixJQUFqQixFQUF1QixTQUFDLElBQUQ7WUFFbkIsSUFBRyxJQUFIO3VCQUVJLEtBQUssQ0FBQyxVQUFOLENBQWlCLElBQWpCLEVBQXVCLFNBQUMsUUFBRDtvQkFFbkIsSUFBRyxRQUFIOytCQUVJLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBWCxFQUFpQixJQUFqQixFQUF1QixJQUFJLENBQUMsSUFBNUIsRUFBa0MsRUFBbEMsRUFGSjtxQkFBQSxNQUFBOytCQU1JLElBQUksQ0FBQyxNQUFMLENBQVksSUFBWixFQUFrQixJQUFsQixFQUF3QixFQUF4QixFQU5KOztnQkFGbUIsQ0FBdkIsRUFGSjthQUFBLE1BQUE7dUJBWUksSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFYLEVBQWlCLElBQWpCLEVBQXVCLEtBQXZCLEVBQThCLEVBQTlCLEVBWko7O1FBRm1CLENBQXZCO0lBRkc7Ozs7OztBQWtCWCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwIFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICBcbjAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIyNcblxueyBlbXB0eSwgdmFsaWQsIGNoaWxkcCwgc2xhc2gsIGZzLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIEZpbGVcbiAgICBcbiAgICBAc291cmNlRmlsZUV4dGVuc2lvbnM6IFsgJ2tvZmZlZScgJ2NvZmZlZScgJ3N0eWwnICdzd2lmdCcgJ3B1ZycgJ21kJyAnbm9vbicgJ3R4dCcgJ2pzb24nICdzaCcgJ3B5JyAnY3BwJyAnY2MnICdjJyAnY3MnICdoJyAnaHBwJyAndHMnICdqcyddXG5cbiAgICBAaWNvbkNsYXNzTmFtZTogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBmaWxlID0gc2xhc2gucmVtb3ZlTGluZVBvcyBmaWxlXG4gICAgICAgIHN3aXRjaCBzbGFzaC5leHQgZmlsZVxuICAgICAgICAgICAgd2hlbiAnbm9vbicgICB0aGVuIGNsYXNzTmFtZSA9ICdub29uLWljb24nXG4gICAgICAgICAgICB3aGVuICdrb2ZmZWUnIHRoZW4gY2xhc3NOYW1lID0gJ2NvZmZlZS1pY29uJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICAgICAgICBmaWxlSWNvbnMgPSByZXF1aXJlICdmaWxlLWljb25zLWpzJ1xuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWUgPSBmaWxlSWNvbnMuZ2V0Q2xhc3MgZmlsZVxuICAgICAgICAgICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgICAgICAgICB0cnVlXG4gICAgICAgICAgICAgICAgICAgICMgbG9nIFwibm8gaWNvbj8gI3tmaWxlfVwiXG4gICAgICAgIGNsYXNzTmFtZSA/PSAnZmlsZS1pY29uJ1xuICAgICAgICBjbGFzc05hbWVcbiAgICAgICAgICAgIFxuICAgIEB3cml0ZTogKGZpbGUsIHRleHQsIG1vZGUsIGNiKSAtPlxuICBcbiAgICAgICAgc2xhc2gud3JpdGVUZXh0IGZpbGUsIHRleHQsIChkb25lKSAtPlxuICAgICAgICAgICAgaWYgZW1wdHkgZG9uZVxuICAgICAgICAgICAgICAgIGNiIFwiY2FuJ3Qgd3JpdGUgI3tmaWxlfVwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgY2IgbnVsbCwgZG9uZVxuICAgICAgICAjIGZzLndyaXRlRmlsZSBmaWxlLCB0ZXh0LCB7IGVuY29kaW5nOiAndXRmOCcsIG1vZGU6IG1vZGUgfSwgKGVycikgLT5cbiAgICAgICAgICAgICMgaWYgdmFsaWQgZXJyIHRoZW4gY2IgZXJyXG4gICAgICAgICAgICAjIGVsc2UgY2IgbnVsbCwgZmlsZVxuICAgIFxuICAgIEB1bmxvY2s6IChmaWxlLCB0ZXh0LCBjYikgLT5cbiAgICAgICAgXG4gICAgICAgIGZzLmNobW9kIGZpbGUsIDBvNjY2LCAoZXJyKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiB2YWxpZCBlcnJcbiAgICAgICAgICAgICAgICBjYiBlcnJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBGaWxlLndyaXRlIGZpbGUsIHRleHQsIDBvNjY2LCBjYlxuICAgICAgICAgICAgXG4gICAgQHA0ZWRpdDogKGZpbGUsIHRleHQsIGNiKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgc2xhc2gud2luKClcbiAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICAgIGNoaWxkcC5leGVjIFwicDQgZWRpdCAje3NsYXNoLnVuc2xhc2goZmlsZSl9XCIsIChlcnIpIC0+XG4gICAgICAgICAgICAgICAgICAgIGlmIHZhbGlkIGVyclxuICAgICAgICAgICAgICAgICAgICAgICAgRmlsZS51bmxvY2sgZmlsZSwgdGV4dCwgY2JcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgRmlsZS53cml0ZSBmaWxlLCB0ZXh0LCAwbzY2NiwgY2JcbiAgICAgICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgICAgIEZpbGUudW5sb2NrIGZpbGUsIHRleHQsIGNiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEZpbGUudW5sb2NrIGZpbGUsIHRleHQsIGNiXG4gICAgICAgICAgICBcbiAgICBAc2F2ZTogKGZpbGUsIHRleHQsIGNiKSAtPlxuICAgIFxuICAgICAgICBzbGFzaC5maWxlRXhpc3RzIGZpbGUsIChzdGF0KSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBzdGF0XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgc2xhc2guaXNXcml0YWJsZSBmaWxlLCAod3JpdGFibGUpIC0+XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiB3cml0YWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBGaWxlLndyaXRlIGZpbGUsIHRleHQsIHN0YXQubW9kZSwgY2JcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIEZpbGUucDRlZGl0IGZpbGUsIHRleHQsIGNiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgRmlsZS53cml0ZSBmaWxlLCB0ZXh0LCAwbzY2NiwgY2JcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVcbiJdfQ==
//# sourceURL=../../coffee/tools/file.coffee