#!/usr/bin/env bash
cd `dirname $0`/..

if rm -rf ko-win32-x64; then

    node_modules/.bin/konrad
    
    node_modules/.bin/electron-rebuild
    
    IGNORE="(.*\.dmg$|Icon$|/inno$|.*\.lock$|three/examples)"
    node_modules/.bin/electron-packager . --overwrite --icon=img/app.ico --ignore $IGNORE
    
    ./ko-win32-x64/ko.exe &
fi    