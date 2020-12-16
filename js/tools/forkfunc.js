// koffee 1.14.0

/*
00000000   0000000   00000000   000   000  00000000  000   000  000   000   0000000    
000       000   000  000   000  000  000   000       000   000  0000  000  000         
000000    000   000  0000000    0000000    000000    000   000  000 0 000  000         
000       000   000  000   000  000  000   000       000   000  000  0000  000         
000        0000000   000   000  000   000  000        0000000   000   000   0000000
 */
var args, callFunc, childp, forkfunc, ref, sendResult, slash,
    slice = [].slice;

if (module.parent) {
    ref = require('kxk'), childp = ref.childp, slash = ref.slash, args = ref.args;
    forkfunc = function() {
        var args, callback, cp, dirname, err, file, i, match, onExit, onResult, regx, stack;
        file = arguments[0], args = 3 <= arguments.length ? slice.call(arguments, 1, i = arguments.length - 1) : (i = 1, []), callback = arguments[i++];
        if (/^[.]?\.\//.test(file)) {
            stack = new Error().stack.split(/\r\n|\n/);
            regx = /\(([^\)]*)\)/;
            match = regx.exec(stack[3]);
            dirname = slash.dir(match[1]);
            file = slash.join(dirname, file);
        }
        try {
            cp = childp.fork(__filename);
            onExit = function() {
                cp.removeListener('message', onResult);
                cp.removeListener('exit', onExit);
                if (cp.connected) {
                    cp.disconnect();
                }
                return cp.kill();
            };
            onResult = function(msg) {
                var result;
                result = msg;
                callback(result.err, result.result);
                return onExit();
            };
            cp.on('error', function(err) {
                return callback(err, null);
            });
            cp.on('message', onResult);
            cp.on('exit', onExit);
            cp.send({
                file: file,
                args: args
            });
        } catch (error) {
            err = error;
            callback(err, null);
        }
        return cp;
    };
    module.exports = forkfunc;
} else {
    sendResult = function(err, result) {
        process.removeListener('message', callFunc);
        return process.send({
            err: err,
            result: result
        }, function() {
            if (process.connected) {
                process.disconnect();
            }
            return process.exit(0);
        });
    };
    callFunc = function(msg) {
        var err, func, result;
        try {
            func = require(msg.file);
            result = func.apply(func, msg.args);
            return sendResult(null, result);
        } catch (error) {
            err = error;
            return sendResult(err.stack);
        }
    };
    process.on('message', callFunc);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ya2Z1bmMuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL3Rvb2xzIiwic291cmNlcyI6WyJmb3JrZnVuYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsd0RBQUE7SUFBQTs7QUFRQSxJQUFHLE1BQU0sQ0FBQyxNQUFWO0lBUUksTUFBMEIsT0FBQSxDQUFRLEtBQVIsQ0FBMUIsRUFBRSxtQkFBRixFQUFVLGlCQUFWLEVBQWlCO0lBRWpCLFFBQUEsR0FBVyxTQUFBO0FBRVAsWUFBQTtRQUZRLHFCQUFNLGlHQUFTO1FBRXZCLElBQUcsV0FBVyxDQUFDLElBQVosQ0FBaUIsSUFBakIsQ0FBSDtZQUNJLEtBQUEsR0FBVSxJQUFJLEtBQUosQ0FBQSxDQUFXLENBQUMsS0FBSyxDQUFDLEtBQWxCLENBQXdCLFNBQXhCO1lBQ1YsSUFBQSxHQUFVO1lBQ1YsS0FBQSxHQUFVLElBQUksQ0FBQyxJQUFMLENBQVUsS0FBTSxDQUFBLENBQUEsQ0FBaEI7WUFDVixPQUFBLEdBQVUsS0FBSyxDQUFDLEdBQU4sQ0FBVSxLQUFNLENBQUEsQ0FBQSxDQUFoQjtZQUNWLElBQUEsR0FBVSxLQUFLLENBQUMsSUFBTixDQUFXLE9BQVgsRUFBb0IsSUFBcEIsRUFMZDs7QUFPQTtZQUNJLEVBQUEsR0FBSyxNQUFNLENBQUMsSUFBUCxDQUFZLFVBQVo7WUFFTCxNQUFBLEdBQVMsU0FBQTtnQkFDTCxFQUFFLENBQUMsY0FBSCxDQUFrQixTQUFsQixFQUE0QixRQUE1QjtnQkFDQSxFQUFFLENBQUMsY0FBSCxDQUFrQixNQUFsQixFQUE0QixNQUE1QjtnQkFDQSxJQUFtQixFQUFFLENBQUMsU0FBdEI7b0JBQUEsRUFBRSxDQUFDLFVBQUgsQ0FBQSxFQUFBOzt1QkFDQSxFQUFFLENBQUMsSUFBSCxDQUFBO1lBSks7WUFNVCxRQUFBLEdBQVcsU0FBQyxHQUFEO0FBQ1Asb0JBQUE7Z0JBQUEsTUFBQSxHQUFTO2dCQUNULFFBQUEsQ0FBUyxNQUFNLENBQUMsR0FBaEIsRUFBcUIsTUFBTSxDQUFDLE1BQTVCO3VCQUNBLE1BQUEsQ0FBQTtZQUhPO1lBS1gsRUFBRSxDQUFDLEVBQUgsQ0FBTSxPQUFOLEVBQWdCLFNBQUMsR0FBRDt1QkFBUyxRQUFBLENBQVMsR0FBVCxFQUFjLElBQWQ7WUFBVCxDQUFoQjtZQUNBLEVBQUUsQ0FBQyxFQUFILENBQU0sU0FBTixFQUFnQixRQUFoQjtZQUNBLEVBQUUsQ0FBQyxFQUFILENBQU0sTUFBTixFQUFnQixNQUFoQjtZQUVBLEVBQUUsQ0FBQyxJQUFILENBQ0k7Z0JBQUEsSUFBQSxFQUFPLElBQVA7Z0JBQ0EsSUFBQSxFQUFPLElBRFA7YUFESixFQWxCSjtTQUFBLGFBQUE7WUFzQk07WUFFRixRQUFBLENBQVMsR0FBVCxFQUFjLElBQWQsRUF4Qko7O2VBMEJBO0lBbkNPO0lBcUNYLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFNBL0NyQjtDQUFBLE1BQUE7SUF5REksVUFBQSxHQUFhLFNBQUMsR0FBRCxFQUFNLE1BQU47UUFFVCxPQUFPLENBQUMsY0FBUixDQUF1QixTQUF2QixFQUFpQyxRQUFqQztlQUNBLE9BQU8sQ0FBQyxJQUFSLENBQWE7WUFBQyxHQUFBLEVBQUksR0FBTDtZQUFVLE1BQUEsRUFBTyxNQUFqQjtTQUFiLEVBQXVDLFNBQUE7WUFDbkMsSUFBd0IsT0FBTyxDQUFDLFNBQWhDO2dCQUFBLE9BQU8sQ0FBQyxVQUFSLENBQUEsRUFBQTs7bUJBQ0EsT0FBTyxDQUFDLElBQVIsQ0FBYSxDQUFiO1FBRm1DLENBQXZDO0lBSFM7SUFPYixRQUFBLEdBQVcsU0FBQyxHQUFEO0FBRVAsWUFBQTtBQUFBO1lBRUksSUFBQSxHQUFPLE9BQUEsQ0FBUSxHQUFHLENBQUMsSUFBWjtZQUNQLE1BQUEsR0FBUyxJQUFJLENBQUMsS0FBTCxDQUFXLElBQVgsRUFBaUIsR0FBRyxDQUFDLElBQXJCO21CQUNULFVBQUEsQ0FBVyxJQUFYLEVBQWlCLE1BQWpCLEVBSko7U0FBQSxhQUFBO1lBTU07bUJBRUYsVUFBQSxDQUFXLEdBQUcsQ0FBQyxLQUFmLEVBUko7O0lBRk87SUFZWCxPQUFPLENBQUMsRUFBUixDQUFXLFNBQVgsRUFBcUIsUUFBckIsRUE1RUoiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAgXG4wMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgIFxuMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgXG4jIyNcblxuaWYgbW9kdWxlLnBhcmVudFxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgeyBjaGlsZHAsIHNsYXNoLCBhcmdzIH0gPSByZXF1aXJlICdreGsnXG4gICAgXG4gICAgZm9ya2Z1bmMgPSAoZmlsZSwgYXJncy4uLiwgY2FsbGJhY2spIC0+XG4gICAgICAgIFxuICAgICAgICBpZiAvXlsuXT9cXC5cXC8vLnRlc3QgZmlsZVxuICAgICAgICAgICAgc3RhY2sgICA9IG5ldyBFcnJvcigpLnN0YWNrLnNwbGl0IC9cXHJcXG58XFxuL1xuICAgICAgICAgICAgcmVneCAgICA9IC9cXCgoW15cXCldKilcXCkvXG4gICAgICAgICAgICBtYXRjaCAgID0gcmVneC5leGVjIHN0YWNrWzNdXG4gICAgICAgICAgICBkaXJuYW1lID0gc2xhc2guZGlyIG1hdGNoWzFdXG4gICAgICAgICAgICBmaWxlICAgID0gc2xhc2guam9pbiBkaXJuYW1lLCBmaWxlXG4gICAgICAgICAgICBcbiAgICAgICAgdHJ5XG4gICAgICAgICAgICBjcCA9IGNoaWxkcC5mb3JrIF9fZmlsZW5hbWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgb25FeGl0ID0gLT5cbiAgICAgICAgICAgICAgICBjcC5yZW1vdmVMaXN0ZW5lciAnbWVzc2FnZScgb25SZXN1bHRcbiAgICAgICAgICAgICAgICBjcC5yZW1vdmVMaXN0ZW5lciAnZXhpdCcgICAgb25FeGl0XG4gICAgICAgICAgICAgICAgY3AuZGlzY29ubmVjdCgpIGlmIGNwLmNvbm5lY3RlZFxuICAgICAgICAgICAgICAgIGNwLmtpbGwoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgb25SZXN1bHQgPSAobXNnKSAtPiBcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBtc2dcbiAgICAgICAgICAgICAgICBjYWxsYmFjayByZXN1bHQuZXJyLCByZXN1bHQucmVzdWx0XG4gICAgICAgICAgICAgICAgb25FeGl0KClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGNwLm9uICdlcnJvcicgICAoZXJyKSAtPiBjYWxsYmFjayBlcnIsIG51bGxcbiAgICAgICAgICAgIGNwLm9uICdtZXNzYWdlJyBvblJlc3VsdFxuICAgICAgICAgICAgY3Aub24gJ2V4aXQnICAgIG9uRXhpdFxuXG4gICAgICAgICAgICBjcC5zZW5kXG4gICAgICAgICAgICAgICAgZmlsZTogIGZpbGVcbiAgICAgICAgICAgICAgICBhcmdzOiAgYXJnc1xuXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgXG4gICAgICAgICAgICBjYWxsYmFjayBlcnIsIG51bGxcbiAgICAgICAgICAgIFxuICAgICAgICBjcFxuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmb3JrZnVuY1xuXG5lbHNlXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIHNlbmRSZXN1bHQgPSAoZXJyLCByZXN1bHQpIC0+XG4gICAgICAgIFxuICAgICAgICBwcm9jZXNzLnJlbW92ZUxpc3RlbmVyICdtZXNzYWdlJyBjYWxsRnVuY1xuICAgICAgICBwcm9jZXNzLnNlbmQge2VycjplcnIsIHJlc3VsdDpyZXN1bHR9LCAtPlxuICAgICAgICAgICAgcHJvY2Vzcy5kaXNjb25uZWN0KCkgaWYgcHJvY2Vzcy5jb25uZWN0ZWRcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCAwXG4gICAgICAgIFxuICAgIGNhbGxGdW5jID0gKG1zZykgLT5cbiAgICAgICAgXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmdW5jID0gcmVxdWlyZSBtc2cuZmlsZVxuICAgICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSBmdW5jLCBtc2cuYXJnc1xuICAgICAgICAgICAgc2VuZFJlc3VsdCBudWxsLCByZXN1bHRcbiAgICAgICAgICAgIFxuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2VuZFJlc3VsdCBlcnIuc3RhY2tcblxuICAgIHByb2Nlc3Mub24gJ21lc3NhZ2UnIGNhbGxGdW5jXG4iXX0=
//# sourceURL=../../coffee/tools/forkfunc.coffee