(function() {
  var app, cp, dmg, download, exec, fs, log, mount, open, path, src, unpack, version;

  fs = require('fs-extra');

  download = require('download');

  path = require('path');

  mount = require('dmg');

  cp = require('child_process');

  exec = cp.exec;

  log = console.log;

  version = require('../package.json').version;

  app = "/Applications/ko.app";

  dmg = __dirname + "/ko-" + version + ".dmg";

  open = function() {
    var args;
    log("open " + app);
    args = process.argv.slice(2).join(" ");
    return exec(("open -a " + app + " ") + args);
  };

  unpack = function() {
    log("mounting " + dmg + " ...");
    return mount.mount(dmg, function(err, dmgPath) {
      var src;
      if (err) {
        return log(err);
      } else {
        src = path.join(dmgPath, "ko.app");
        log("copy " + src + " to " + app);
        return fs.copy(src, app, (function(_this) {
          return function(err) {
            if (err != null) {
              return log(err);
            } else {
              log("unmounting " + dmgPath + " ...");
              return mount.unmount(dmgPath, function(err) {
                if (err != null) {
                  return log(err);
                } else {
                  return open();
                }
              });
            }
          };
        })(this));
      }
    });
  };

  if (!fs.existsSync(app)) {
    log('app not found ...');
    if (!fs.existsSync(dmg)) {
      src = "https://github.com/monsterkodi/ko/releases/download/v" + version + "/ko-" + version + ".dmg";
      log("downloading from github (this might take a while) ...");
      log(src);
      download(src, __dirname).then((function(_this) {
        return function() {
          return unpack();
        };
      })(this));
    } else {
      unpack();
    }
  } else {
    open();
  }

}).call(this);
