// koffee 0.56.0

/*
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
 */
var File, _, atomic, childp, empty, fs, ref, slash, valid;

ref = require('kxk'), empty = ref.empty, valid = ref.valid, childp = ref.childp, slash = ref.slash, atomic = ref.atomic, fs = ref.fs, _ = ref._;

File = (function() {
    function File() {}

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

    File.atomic = function(file, text, mode, cb) {
        return atomic(file, text, {
            encoding: 'utf8',
            mode: mode
        }, function(err) {
            if (valid(err)) {
                return cb(err);
            } else {
                return cb(null, file);
            }
        });
    };

    File.write = function(file, text, mode, cb) {
        return fs.writeFile(file, text, {
            encoding: 'utf8',
            mode: mode
        }, function(err) {
            if (valid(err)) {
                return cb(err);
            } else {
                return cb(null, file);
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
                return File.write(file, text, 438, cb);
            }
        });
    };

    return File;

})();

module.exports = File;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBaUQsT0FBQSxDQUFRLEtBQVIsQ0FBakQsRUFBRSxpQkFBRixFQUFTLGlCQUFULEVBQWdCLG1CQUFoQixFQUF3QixpQkFBeEIsRUFBK0IsbUJBQS9CLEVBQXVDLFdBQXZDLEVBQTJDOztBQUVyQzs7O0lBRUYsSUFBQyxDQUFBLGFBQUQsR0FBZ0IsU0FBQyxJQUFEO0FBRVosWUFBQTtRQUFBLElBQUEsR0FBTyxLQUFLLENBQUMsYUFBTixDQUFvQixJQUFwQjtBQUNQLGdCQUFPLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixDQUFQO0FBQUEsaUJBQ1MsTUFEVDtnQkFDdUIsU0FBQSxHQUFZO0FBQTFCO0FBRFQsaUJBRVMsUUFGVDtnQkFFdUIsU0FBQSxHQUFZO0FBQTFCO0FBRlQ7QUFJUTtvQkFDSSxTQUFBLEdBQVksT0FBQSxDQUFRLGVBQVI7b0JBQ1osU0FBQSxHQUFZLFNBQVMsQ0FBQyxRQUFWLENBQW1CLElBQW5CLEVBRmhCO2lCQUFBLGFBQUE7b0JBR007b0JBQ0YsS0FKSjs7QUFKUjs7WUFVQTs7WUFBQSxZQUFhOztlQUNiO0lBZFk7O0lBZ0JoQixJQUFDLENBQUEsTUFBRCxHQUFTLFNBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxJQUFiLEVBQW1CLEVBQW5CO2VBRUwsTUFBQSxDQUFPLElBQVAsRUFBYSxJQUFiLEVBQW1CO1lBQUUsUUFBQSxFQUFVLE1BQVo7WUFBb0IsSUFBQSxFQUFNLElBQTFCO1NBQW5CLEVBQXFELFNBQUMsR0FBRDtZQUNqRCxJQUFHLEtBQUEsQ0FBTSxHQUFOLENBQUg7dUJBQWtCLEVBQUEsQ0FBRyxHQUFILEVBQWxCO2FBQUEsTUFBQTt1QkFDSyxFQUFBLENBQUcsSUFBSCxFQUFTLElBQVQsRUFETDs7UUFEaUQsQ0FBckQ7SUFGSzs7SUFNVCxJQUFDLENBQUEsS0FBRCxHQUFRLFNBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxJQUFiLEVBQW1CLEVBQW5CO2VBRUosRUFBRSxDQUFDLFNBQUgsQ0FBYSxJQUFiLEVBQW1CLElBQW5CLEVBQXlCO1lBQUUsUUFBQSxFQUFVLE1BQVo7WUFBb0IsSUFBQSxFQUFNLElBQTFCO1NBQXpCLEVBQTJELFNBQUMsR0FBRDtZQUN2RCxJQUFHLEtBQUEsQ0FBTSxHQUFOLENBQUg7dUJBQWtCLEVBQUEsQ0FBRyxHQUFILEVBQWxCO2FBQUEsTUFBQTt1QkFDSyxFQUFBLENBQUcsSUFBSCxFQUFTLElBQVQsRUFETDs7UUFEdUQsQ0FBM0Q7SUFGSTs7SUFNUixJQUFDLENBQUEsTUFBRCxHQUFTLFNBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxFQUFiO2VBRUwsRUFBRSxDQUFDLEtBQUgsQ0FBUyxJQUFULEVBQWUsS0FBZixFQUFzQixTQUFDLEdBQUQ7WUFFbEIsSUFBRyxLQUFBLENBQU0sR0FBTixDQUFIO3VCQUNJLEVBQUEsQ0FBRyxHQUFILEVBREo7YUFBQSxNQUFBO3VCQUdJLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBWCxFQUFpQixJQUFqQixFQUF1QixLQUF2QixFQUE4QixFQUE5QixFQUhKOztRQUZrQixDQUF0QjtJQUZLOztJQVNULElBQUMsQ0FBQSxNQUFELEdBQVMsU0FBQyxJQUFELEVBQU8sSUFBUCxFQUFhLEVBQWI7QUFFTCxZQUFBO1FBQUEsSUFBRyxLQUFLLENBQUMsR0FBTixDQUFBLENBQUg7QUFDSTt1QkFDSSxNQUFNLENBQUMsSUFBUCxDQUFZLFVBQUEsR0FBVSxDQUFDLEtBQUssQ0FBQyxPQUFOLENBQWMsSUFBZCxDQUFELENBQXRCLEVBQThDLFNBQUMsR0FBRDtvQkFDMUMsSUFBRyxLQUFBLENBQU0sR0FBTixDQUFIOytCQUNJLElBQUksQ0FBQyxNQUFMLENBQVksSUFBWixFQUFrQixJQUFsQixFQUF3QixFQUF4QixFQURKO3FCQUFBLE1BQUE7K0JBR0ksSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFYLEVBQWlCLElBQWpCLEVBQXVCLEtBQXZCLEVBQThCLEVBQTlCLEVBSEo7O2dCQUQwQyxDQUE5QyxFQURKO2FBQUEsYUFBQTtnQkFNTTt1QkFDRixJQUFJLENBQUMsTUFBTCxDQUFZLElBQVosRUFBa0IsSUFBbEIsRUFBd0IsRUFBeEIsRUFQSjthQURKO1NBQUEsTUFBQTttQkFVSSxJQUFJLENBQUMsTUFBTCxDQUFZLElBQVosRUFBa0IsSUFBbEIsRUFBd0IsRUFBeEIsRUFWSjs7SUFGSzs7SUFjVCxJQUFDLENBQUEsSUFBRCxHQUFPLFNBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxFQUFiO2VBRUgsS0FBSyxDQUFDLFVBQU4sQ0FBaUIsSUFBakIsRUFBdUIsU0FBQyxJQUFEO1lBRW5CLElBQUcsSUFBSDt1QkFFSSxLQUFLLENBQUMsVUFBTixDQUFpQixJQUFqQixFQUF1QixTQUFDLFFBQUQ7b0JBRW5CLElBQUcsUUFBSDsrQkFFSSxJQUFJLENBQUMsS0FBTCxDQUFXLElBQVgsRUFBaUIsSUFBakIsRUFBdUIsSUFBSSxDQUFDLElBQTVCLEVBQWtDLEVBQWxDLEVBRko7cUJBQUEsTUFBQTsrQkFNSSxJQUFJLENBQUMsTUFBTCxDQUFZLElBQVosRUFBa0IsSUFBbEIsRUFBd0IsRUFBeEIsRUFOSjs7Z0JBRm1CLENBQXZCLEVBRko7YUFBQSxNQUFBO3VCQVlJLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBWCxFQUFpQixJQUFqQixFQUF1QixHQUF2QixFQUE0QixFQUE1QixFQVpKOztRQUZtQixDQUF2QjtJQUZHOzs7Ozs7QUFrQlgsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgIFxuMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuIyMjXG5cbnsgZW1wdHksIHZhbGlkLCBjaGlsZHAsIHNsYXNoLCBhdG9taWMsIGZzLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIEZpbGVcblxuICAgIEBpY29uQ2xhc3NOYW1lOiAoZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGZpbGUgPSBzbGFzaC5yZW1vdmVMaW5lUG9zIGZpbGVcbiAgICAgICAgc3dpdGNoIHNsYXNoLmV4dCBmaWxlXG4gICAgICAgICAgICB3aGVuICdub29uJyAgIHRoZW4gY2xhc3NOYW1lID0gJ25vb24taWNvbidcbiAgICAgICAgICAgIHdoZW4gJ2tvZmZlZScgdGhlbiBjbGFzc05hbWUgPSAnY29mZmVlLWljb24nXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgICAgICAgIGZpbGVJY29ucyA9IHJlcXVpcmUgJ2ZpbGUtaWNvbnMtanMnXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA9IGZpbGVJY29ucy5nZXRDbGFzcyBmaWxlXG4gICAgICAgICAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICAgICAgICAgIHRydWVcbiAgICAgICAgICAgICAgICAgICAgIyBsb2cgXCJubyBpY29uPyAje2ZpbGV9XCJcbiAgICAgICAgY2xhc3NOYW1lID89ICdmaWxlLWljb24nXG4gICAgICAgIGNsYXNzTmFtZVxuICAgIFxuICAgIEBhdG9taWM6IChmaWxlLCB0ZXh0LCBtb2RlLCBjYikgLT5cblxuICAgICAgICBhdG9taWMgZmlsZSwgdGV4dCwgeyBlbmNvZGluZzogJ3V0ZjgnLCBtb2RlOiBtb2RlIH0sIChlcnIpIC0+XG4gICAgICAgICAgICBpZiB2YWxpZCBlcnIgdGhlbiBjYiBlcnJcbiAgICAgICAgICAgIGVsc2UgY2IgbnVsbCwgZmlsZVxuICAgICAgICBcbiAgICBAd3JpdGU6IChmaWxlLCB0ZXh0LCBtb2RlLCBjYikgLT5cbiAgICAgICAgICAgIFxuICAgICAgICBmcy53cml0ZUZpbGUgZmlsZSwgdGV4dCwgeyBlbmNvZGluZzogJ3V0ZjgnLCBtb2RlOiBtb2RlIH0sIChlcnIpIC0+XG4gICAgICAgICAgICBpZiB2YWxpZCBlcnIgdGhlbiBjYiBlcnJcbiAgICAgICAgICAgIGVsc2UgY2IgbnVsbCwgZmlsZVxuICAgIFxuICAgIEB1bmxvY2s6IChmaWxlLCB0ZXh0LCBjYikgLT5cbiAgICAgICAgXG4gICAgICAgIGZzLmNobW9kIGZpbGUsIDBvNjY2LCAoZXJyKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiB2YWxpZCBlcnJcbiAgICAgICAgICAgICAgICBjYiBlcnJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBGaWxlLndyaXRlIGZpbGUsIHRleHQsIDBvNjY2LCBjYlxuICAgICAgICAgICAgXG4gICAgQHA0ZWRpdDogKGZpbGUsIHRleHQsIGNiKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgc2xhc2gud2luKClcbiAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICAgIGNoaWxkcC5leGVjIFwicDQgZWRpdCAje3NsYXNoLnVuc2xhc2goZmlsZSl9XCIsIChlcnIpIC0+XG4gICAgICAgICAgICAgICAgICAgIGlmIHZhbGlkIGVyclxuICAgICAgICAgICAgICAgICAgICAgICAgRmlsZS51bmxvY2sgZmlsZSwgdGV4dCwgY2JcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgRmlsZS53cml0ZSBmaWxlLCB0ZXh0LCAwbzY2NiwgY2JcbiAgICAgICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgICAgIEZpbGUudW5sb2NrIGZpbGUsIHRleHQsIGNiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEZpbGUudW5sb2NrIGZpbGUsIHRleHQsIGNiXG4gICAgICAgICAgICBcbiAgICBAc2F2ZTogKGZpbGUsIHRleHQsIGNiKSAtPlxuICAgIFxuICAgICAgICBzbGFzaC5maWxlRXhpc3RzIGZpbGUsIChzdGF0KSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBzdGF0XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgc2xhc2guaXNXcml0YWJsZSBmaWxlLCAod3JpdGFibGUpIC0+XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiB3cml0YWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBGaWxlLndyaXRlIGZpbGUsIHRleHQsIHN0YXQubW9kZSwgY2JcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIEZpbGUucDRlZGl0IGZpbGUsIHRleHQsIGNiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgRmlsZS53cml0ZSBmaWxlLCB0ZXh0LCA0MzgsIGNiXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBGaWxlXG4iXX0=
//# sourceURL=../../coffee/tools/file.coffee