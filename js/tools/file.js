// koffee 1.20.0

/*
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
 */
var File, childp, empty, fs, icons, kerror, klog, ref, slash, valid;

ref = require('kxk'), childp = ref.childp, empty = ref.empty, fs = ref.fs, kerror = ref.kerror, klog = ref.klog, slash = ref.slash, valid = ref.valid;

icons = require('./icons.json');

File = (function() {
    function File() {}

    File.sourceFileExtensions = ['kode', 'coffee', 'styl', 'swift', 'pug', 'md', 'noon', 'txt', 'json', 'sh', 'py', 'cpp', 'cc', 'c', 'cs', 'h', 'hpp', 'ts', 'js', 'frag', 'vert'];

    File.isCode = function(file) {
        var ref1;
        return (ref1 = slash.ext(file)) === 'coffee' || ref1 === 'kode' || ref1 === 'py' || ref1 === 'cpp' || ref1 === 'cc' || ref1 === 'c' || ref1 === 'cs' || ref1 === 'ts' || ref1 === 'js' || ref1 === 'h' || ref1 === 'hpp' || ref1 === 'frag' || ref1 === 'vert';
    };

    File.isImage = function(file) {
        var ref1;
        return (ref1 = slash.ext(file)) === 'gif' || ref1 === 'png' || ref1 === 'jpg' || ref1 === 'jpeg' || ref1 === 'svg' || ref1 === 'bmp' || ref1 === 'ico';
    };

    File.isText = function(file) {
        return slash.isText(file);
    };

    File.rename = function(from, to, cb) {
        return fs.mkdir(slash.dir(to), {
            recursive: true
        }, function(err) {
            if (err) {
                return kerror("mkdir failed " + err);
            }
            if (slash.isDir(to)) {
                to = slash.join(to, slash.file(from));
            }
            return fs.move(from, to, {
                overwrite: true
            }, function(err) {
                var ref1;
                if (err) {
                    return kerror("rename failed " + err);
                }
                if (editor.currentFile === from) {
                    editor.currentFile = to;
                    if (((ref1 = tabs.activeTab()) != null ? ref1.file : void 0) === from) {
                        tabs.activeTab().setFile(to);
                    }
                    if (commandline.command.name === 'browse') {
                        if (commandline.text() === slash.tilde(from)) {
                            commandline.setText(slash.tilde(to));
                        }
                    }
                    if (!tabs.tab(to)) {
                        klog('recreate tab!', tabs.activeTab().file, to);
                    }
                }
                return cb(from, to);
            });
        });
    };

    File.duplicate = function(from, cb) {
        return slash.unused(from, (function(_this) {
            return function(target) {
                return _this.copy(from, target, cb);
            };
        })(this));
    };

    File.copy = function(from, to, cb) {
        if (slash.isDir(to)) {
            to = slash.join(to, slash.file(from));
        }
        return fs.copy(from, to, function(err) {
            if (err) {
                return kerror("copy failed " + err);
            }
            return cb(from, to);
        });
    };

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

    File.span = function(text) {
        var base, clss, ext, span;
        base = slash.base(text);
        ext = slash.ext(text).toLowerCase();
        clss = valid(ext) && ' ' + ext || '';
        if (base.startsWith('.')) {
            clss += ' dotfile';
        }
        span = ("<span class='text" + clss + "'>") + base + "</span>";
        if (valid(ext)) {
            span += ("<span class='ext punct" + clss + "'>.</span>") + ("<span class='ext text" + clss + "'>") + ext + "</span>";
        }
        return span;
    };

    File.crumbSpan = function(file) {
        var i, j, ref1, s, spans, split;
        if (file === '/' || file === '') {
            return "<span>/</span>";
        }
        spans = [];
        split = slash.split(file);
        for (i = j = 0, ref1 = split.length - 1; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
            s = split[i];
            spans.push("<div class='inline path' id='" + (split.slice(0, +i + 1 || 9e9).join('/')) + "'>" + s + "</div>");
        }
        spans.push("<div class='inline' id='" + file + "'>" + split.slice(-1)[0] + "</div>");
        return spans.join("<span class='punct'>/</span>");
    };

    return File;

})();

module.exports = File;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvdG9vbHMiLCJzb3VyY2VzIjpbImZpbGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLE1BQW9ELE9BQUEsQ0FBUSxLQUFSLENBQXBELEVBQUUsbUJBQUYsRUFBVSxpQkFBVixFQUFpQixXQUFqQixFQUFxQixtQkFBckIsRUFBNkIsZUFBN0IsRUFBbUMsaUJBQW5DLEVBQTBDOztBQUUxQyxLQUFBLEdBQVEsT0FBQSxDQUFRLGNBQVI7O0FBRUY7OztJQUVGLElBQUMsQ0FBQSxvQkFBRCxHQUF1QixDQUFFLE1BQUYsRUFBUyxRQUFULEVBQWtCLE1BQWxCLEVBQXlCLE9BQXpCLEVBQWlDLEtBQWpDLEVBQXVDLElBQXZDLEVBQTRDLE1BQTVDLEVBQW1ELEtBQW5ELEVBQXlELE1BQXpELEVBQWdFLElBQWhFLEVBQXFFLElBQXJFLEVBQTBFLEtBQTFFLEVBQWdGLElBQWhGLEVBQXFGLEdBQXJGLEVBQXlGLElBQXpGLEVBQThGLEdBQTlGLEVBQWtHLEtBQWxHLEVBQXdHLElBQXhHLEVBQTZHLElBQTdHLEVBQWtILE1BQWxILEVBQXlILE1BQXpIOztJQUV2QixJQUFDLENBQUEsTUFBRCxHQUFVLFNBQUMsSUFBRDtBQUFVLFlBQUE7dUJBQUEsS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWLEVBQUEsS0FBb0IsUUFBcEIsSUFBQSxJQUFBLEtBQTZCLE1BQTdCLElBQUEsSUFBQSxLQUFvQyxJQUFwQyxJQUFBLElBQUEsS0FBeUMsS0FBekMsSUFBQSxJQUFBLEtBQStDLElBQS9DLElBQUEsSUFBQSxLQUFvRCxHQUFwRCxJQUFBLElBQUEsS0FBd0QsSUFBeEQsSUFBQSxJQUFBLEtBQTZELElBQTdELElBQUEsSUFBQSxLQUFrRSxJQUFsRSxJQUFBLElBQUEsS0FBdUUsR0FBdkUsSUFBQSxJQUFBLEtBQTJFLEtBQTNFLElBQUEsSUFBQSxLQUFpRixNQUFqRixJ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Q0FBWSxJQUFaO0FBRVIsYUFBUyw4RkFBVDtZQUNJLENBQUEsR0FBSSxLQUFNLENBQUEsQ0FBQTtZQUNWLEtBQUssQ0FBQyxJQUFOLENBQVcsK0JBQUEsR0FBK0IsQ0FBQyxLQUFNLHdCQUFLLENBQUMsSUFBWixDQUFpQixHQUFqQixDQUFELENBQS9CLEdBQXFELElBQXJELEdBQXlELENBQXpELEdBQTJELFFBQXRFO0FBRko7UUFHQSxLQUFLLENBQUMsSUFBTixDQUFXLDBCQUFBLEdBQTJCLElBQTNCLEdBQWdDLElBQWhDLEdBQW9DLEtBQU0sVUFBRSxDQUFBLENBQUEsQ0FBNUMsR0FBOEMsUUFBekQ7ZUFDQSxLQUFLLENBQUMsSUFBTixDQUFXLDhCQUFYO0lBWFE7Ozs7OztBQWFoQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwIFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICBcbjAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIyNcblxueyBjaGlsZHAsIGVtcHR5LCBmcywga2Vycm9yLCBrbG9nLCBzbGFzaCwgdmFsaWQgfSA9IHJlcXVpcmUgJ2t4aydcblxuaWNvbnMgPSByZXF1aXJlICcuL2ljb25zLmpzb24nXG5cbmNsYXNzIEZpbGVcbiAgICBcbiAgICBAc291cmNlRmlsZUV4dGVuc2lvbnM6IFsgJ2tvZGUnICdjb2ZmZWUnICdzdHlsJyAnc3dpZnQnICdwdWcnICdtZCcgJ25vb24nICd0eHQnICdqc29uJyAnc2gnICdweScgJ2NwcCcgJ2NjJyAnYycgJ2NzJyAnaCcgJ2hwcCcgJ3RzJyAnanMnICdmcmFnJyAndmVydCddXG5cbiAgICBAaXNDb2RlOiAgKGZpbGUpIC0+IHNsYXNoLmV4dChmaWxlKSBpbiBbJ2NvZmZlZScgJ2tvZGUnICdweScgJ2NwcCcgJ2NjJyAnYycgJ2NzJyAndHMnICdqcycgJ2gnICdocHAnICdmcmFnJyAndmVydCddXG4gICAgQGlzSW1hZ2U6IChmaWxlKSAtPiBzbGFzaC5leHQoZmlsZSkgaW4gWydnaWYnICdwbmcnICdqcGcnICdqcGVnJyAnc3ZnJyAnYm1wJyAnaWNvJ11cbiAgICBAaXNUZXh0OiAgKGZpbGUpIC0+IHNsYXNoLmlzVGV4dCBmaWxlXG4gICBcbiAgICBAcmVuYW1lOiAoZnJvbSwgdG8sIGNiKSAtPlxuICAgICAgICBcbiAgICAgICAgZnMubWtkaXIgc2xhc2guZGlyKHRvKSwgcmVjdXJzaXZlOnRydWUsIChlcnIpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJta2RpciBmYWlsZWQgI3tlcnJ9XCIgaWYgZXJyXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHNsYXNoLmlzRGlyKHRvKVxuICAgICAgICAgICAgICAgIHRvID0gc2xhc2guam9pbiB0bywgc2xhc2guZmlsZSBmcm9tXG5cbiAgICAgICAgICAgIGZzLm1vdmUgZnJvbSwgdG8sIG92ZXJ3cml0ZTp0cnVlLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJyZW5hbWUgZmFpbGVkICN7ZXJyfVwiIGlmIGVyclxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIGVkaXRvci5jdXJyZW50RmlsZSA9PSBmcm9tXG4gICAgICAgICAgICAgICAgICAgIGVkaXRvci5jdXJyZW50RmlsZSA9IHRvXG4gICAgICAgICAgICAgICAgICAgIGlmIHRhYnMuYWN0aXZlVGFiKCk/LmZpbGUgPT0gZnJvbVxuICAgICAgICAgICAgICAgICAgICAgICAgdGFicy5hY3RpdmVUYWIoKS5zZXRGaWxlIHRvXG4gICAgICAgICAgICAgICAgICAgIGlmIGNvbW1hbmRsaW5lLmNvbW1hbmQubmFtZSA9PSAnYnJvd3NlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgY29tbWFuZGxpbmUudGV4dCgpID09IHNsYXNoLnRpbGRlIGZyb21cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21tYW5kbGluZS5zZXRUZXh0IHNsYXNoLnRpbGRlIHRvXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCB0YWJzLnRhYiB0b1xuICAgICAgICAgICAgICAgICAgICAgICAga2xvZyAncmVjcmVhdGUgdGFiIScgdGFicy5hY3RpdmVUYWIoKS5maWxlLCB0b1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNiIGZyb20sIHRvXG5cbiAgICBAZHVwbGljYXRlOiAoZnJvbSwgY2IpIC0+IFxuXG4gICAgICAgIHNsYXNoLnVudXNlZCBmcm9tLCAodGFyZ2V0KSA9PiAgICAgICAgICBcbiAgICAgICAgICAgIEBjb3B5IGZyb20sIHRhcmdldCwgY2JcbiAgICBcbiAgICBAY29weTogKGZyb20sIHRvLCBjYikgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmlzRGlyKHRvKVxuICAgICAgICAgICAgdG8gPSBzbGFzaC5qb2luIHRvLCBzbGFzaC5maWxlIGZyb21cblxuICAgICAgICAjIGtsb2cgXCJjb3B5ICN7ZnJvbX0gI3t0b31cIlxuICAgICAgICBmcy5jb3B5IGZyb20sIHRvLCAoZXJyKSAtPlxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcImNvcHkgZmFpbGVkICN7ZXJyfVwiIGlmIGVyclxuICAgICAgICAgICAgY2IgZnJvbSwgdG9cbiAgICBcbiAgICBAaWNvbkNsYXNzTmFtZTogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBmaWxlID0gc2xhc2gucmVtb3ZlTGluZVBvcyBmaWxlXG4gICAgICAgIFxuICAgICAgICBjbHNzICA9IGljb25zLmV4dFtzbGFzaC5leHQgZmlsZV1cbiAgICAgICAgY2xzcyA/PSBpY29ucy5iYXNlW3NsYXNoLmJhc2UoZmlsZSkudG9Mb3dlckNhc2UoKV1cbiAgICAgICAgY2xzcyA/PSAnZmlsZSdcbiAgICAgICAgXCJpY29uICN7Y2xzc31cIlxuICAgICAgICBcbiAgICBAd3JpdGU6IChmaWxlLCB0ZXh0LCBtb2RlLCBjYikgLT5cbiAgXG4gICAgICAgIHNsYXNoLmxvZ0Vycm9ycyA9IHRydWVcbiAgICAgICAgXG4gICAgICAgIHNsYXNoLndyaXRlVGV4dCBmaWxlLCB0ZXh0LCAoZG9uZSkgLT5cbiAgICAgICAgICAgIGlmIGVtcHR5IGRvbmVcbiAgICAgICAgICAgICAgICBjYiBcImNhbid0IHdyaXRlICN7ZmlsZX1cIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNiIG51bGwsIGRvbmVcbiAgICAgICAgIyBmcy53cml0ZUZpbGUgZmlsZSwgdGV4dCwgeyBlbmNvZGluZzogJ3V0ZjgnLCBtb2RlOiBtb2RlIH0sIChlcnIpIC0+XG4gICAgICAgICAgICAjIGlmIHZhbGlkIGVyciB0aGVuIGNiIGVyclxuICAgICAgICAgICAgIyBlbHNlIGNiIG51bGwsIGZpbGVcbiAgICBcbiAgICBAdW5sb2NrOiAoZmlsZSwgdGV4dCwgY2IpIC0+XG4gICAgICAgIFxuICAgICAgICBmcy5jaG1vZCBmaWxlLCAwbzY2NiwgKGVycikgLT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgdmFsaWQgZXJyXG4gICAgICAgICAgICAgICAgY2IgZXJyXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgRmlsZS53cml0ZSBmaWxlLCB0ZXh0LCAwbzY2NiwgY2JcbiAgICAgICAgICAgIFxuICAgIEBwNGVkaXQ6IChmaWxlLCB0ZXh0LCBjYikgLT5cbiAgICAgICAgXG4gICAgICAgIHNsYXNoLmxvZ0Vycm9ycyA9IHRydWVcbiAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLndpbigpXG4gICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAgICBjaGlsZHAuZXhlYyBcInA0IGVkaXQgI3tzbGFzaC51bnNsYXNoKGZpbGUpfVwiLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgICAgICBpZiB2YWxpZCBlcnJcbiAgICAgICAgICAgICAgICAgICAgICAgIEZpbGUudW5sb2NrIGZpbGUsIHRleHQsIGNiXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEZpbGUud3JpdGUgZmlsZSwgdGV4dCwgMG82NjYsIGNiXG4gICAgICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgICAgICBGaWxlLnVubG9jayBmaWxlLCB0ZXh0LCBjYlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBGaWxlLnVubG9jayBmaWxlLCB0ZXh0LCBjYlxuICAgICAgICAgICAgXG4gICAgQHNhdmU6IChmaWxlLCB0ZXh0LCBjYikgLT5cbiAgICBcbiAgICAgICAgc2xhc2gubG9nRXJyb3JzID0gdHJ1ZVxuICAgICAgICBcbiAgICAgICAgc2xhc2guZmlsZUV4aXN0cyBmaWxlLCAoc3RhdCkgLT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgc3RhdFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHNsYXNoLmlzV3JpdGFibGUgZmlsZSwgKHdyaXRhYmxlKSAtPlxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgd3JpdGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgRmlsZS53cml0ZSBmaWxlLCB0ZXh0LCBzdGF0Lm1vZGUsIGNiXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBGaWxlLnA0ZWRpdCBmaWxlLCB0ZXh0LCBjYlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEZpbGUud3JpdGUgZmlsZSwgdGV4dCwgMG82NjYsIGNiXG4gICAgICAgIFxuICAgIEBzcGFuOiAodGV4dCkgLT5cbiAgICAgICAgXG4gICAgICAgIGJhc2UgPSBzbGFzaC5iYXNlIHRleHRcbiAgICAgICAgZXh0ICA9IHNsYXNoLmV4dCh0ZXh0KS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGNsc3MgPSB2YWxpZChleHQpIGFuZCAnICcrZXh0IG9yICcnXG4gICAgICAgIFxuICAgICAgICBpZiBiYXNlLnN0YXJ0c1dpdGggJy4nIHRoZW4gY2xzcyArPSAnIGRvdGZpbGUnXG4gICAgICAgIFxuICAgICAgICBzcGFuID0gXCI8c3BhbiBjbGFzcz0ndGV4dCN7Y2xzc30nPlwiK2Jhc2UrXCI8L3NwYW4+XCJcbiAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkIGV4dFxuICAgICAgICAgICAgc3BhbiArPSBcIjxzcGFuIGNsYXNzPSdleHQgcHVuY3Qje2Nsc3N9Jz4uPC9zcGFuPlwiICsgXCI8c3BhbiBjbGFzcz0nZXh0IHRleHQje2Nsc3N9Jz5cIitleHQrXCI8L3NwYW4+XCJcbiAgICAgICAgc3BhblxuICAgICAgICAgICAgICAgIFxuICAgIEBjcnVtYlNwYW46IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIFwiPHNwYW4+Lzwvc3Bhbj5cIiBpZiBmaWxlIGluIFsnLycgJyddXG4gICAgICAgIFxuICAgICAgICBzcGFucyA9IFtdXG4gICAgICAgIHNwbGl0ID0gc2xhc2guc3BsaXQgZmlsZVxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5zcGxpdC5sZW5ndGgtMV1cbiAgICAgICAgICAgIHMgPSBzcGxpdFtpXVxuICAgICAgICAgICAgc3BhbnMucHVzaCBcIjxkaXYgY2xhc3M9J2lubGluZSBwYXRoJyBpZD0nI3tzcGxpdFswLi5pXS5qb2luICcvJ30nPiN7c308L2Rpdj5cIlxuICAgICAgICBzcGFucy5wdXNoIFwiPGRpdiBjbGFzcz0naW5saW5lJyBpZD0nI3tmaWxlfSc+I3tzcGxpdFstMV19PC9kaXY+XCJcbiAgICAgICAgc3BhbnMuam9pbiBcIjxzcGFuIGNsYXNzPSdwdW5jdCc+Lzwvc3Bhbj5cIlxuICAgICAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBGaWxlXG4iXX0=
//# sourceURL=../../coffee/tools/file.coffee