#!/usr/bin/env bash
cd `dirname $0`/..

NAME=ko

2>/dev/null 1>/dev/null killall $NAME
2>/dev/null 1>/dev/null killall $NAME

konrad --run
node_modules/.bin/electron-rebuild

IGNORE="/(.*\.dmg$|Icon$|coffee$|.*md$|styl$|package\.noon$|.*\.lock$|three/examples)"
node_modules/electron-packager/cli.js . --overwrite --icon=img/ko.ico --ignore $IGNORE

rm -f ko-win32-x64/LICENSE*
rm -f ko-win32-x64/version

