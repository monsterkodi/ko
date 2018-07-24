#!/usr/bin/env bash
cd `dirname $0`/..

if rm -rf ko-win32-x64; then

    konrad
    
    node_modules/.bin/electron-rebuild
    
    IGNORE="(.*\.dmg$|Icon$|/inno$|.*\.lock$|three/examples)"
    node_modules/electron-packager/cli.js . --overwrite --icon=img/app.ico --ignore $IGNORE
    
fi    