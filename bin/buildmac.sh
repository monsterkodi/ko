#!/usr/bin/env bash
cd `dirname $0`/..

2>/dev/null 1>/dev/null killall ko
2>/dev/null 1>/dev/null killall ko

if rm -rf ko-darwin-x64; then

    konrad --run
    node_modules/.bin/electron-rebuild
    
    IGNORE="/(.*\.dmg$|Icon$|coffee$|.*md$|styl$|package\.noon$|.*\.lock$|three/examples)"
    node_modules/electron-packager/cli.js . --overwrite --icon=img/ko.icns --ignore $IGNORE --extend-info ./bin/info.plist --extra-resource ./img/file.icns
    
    rm ko-darwin-x64/LICENSE*
    rm ko-darwin-x64/version
    
fi
