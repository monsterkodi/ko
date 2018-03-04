#!/usr/bin/env bash
cd `dirname $0`/..

konrad

node_modules/.bin/electron-rebuild

IGNORE="/(.*\.dmg$|Icon$|coffee$|.*md$|styl$|package\.noon$|.*\.lock$|three/examples)"
node_modules/electron-packager/cli.js . --overwrite --icon=img/ko.ico --no-prune --ignore $IGNORE

rm -f ko-win32-x64/LICENSE*
rm -f ko-win32-x64/version

