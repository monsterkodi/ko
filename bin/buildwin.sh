#!/usr/bin/env bash
cd `dirname $0`/..

if rm -rf ko-win32-x64; then

    konrad
    
    node_modules/.bin/electron-rebuild
    
    IGNORE="/(.*\.dmg$|Icon$|coffee$|.*md$|styl$|package\.noon$|.*\.lock$|three/examples)"
    node_modules/electron-packager/cli.js . --overwrite --icon=img/ko.ico --no-prune --ignore $IGNORE
    
fi    