#!/usr/bin/env bash
cd `dirname $0`/..

NAME=`sds productName`

2>/dev/null 1>/dev/null killall $NAME
2>/dev/null 1>/dev/null killall $NAME

konrad --run
node_modules/.bin/electron-rebuild

IGNORE="/(.*\.dmg$|Icon$|coffee$|.*md$|pug$|styl$|test$|package\.noon$|.*\.lock$|three/examples)"
node_modules/electron-packager/cli.js . --overwrite --icon=img/$NAME.icns --ignore $IGNORE --extend-info ./bin/info.plist --extra-resource ./img/file.icns

rm $NAME-darwin-x64/LICENSE*
rm $NAME-darwin-x64/version

