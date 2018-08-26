#!/usr/bin/env bash
cd `dirname $0`/..

if rm -rf ko-darwin-x64; then

    ../konrad/bin/konrad --run
    node_modules/.bin/electron-rebuild
    
    IGNORE="/(.*\.dmg$|Icon$|.*md$|.*\.lock$|three/examples)"
    node_modules/electron-packager/cli.js . --overwrite --icon=img/app.icns --ignore $IGNORE --extend-info ./bin/info.plist --extra-resource ./img/file.icns
    
fi
