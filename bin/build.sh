#!/usr/bin/env bash
cd `dirname $0`/..

killall ko
konrad --run

node_modules/.bin/electron-rebuild
node_modules/electron-packager/cli.js . --overwrite --icon=img/ko.icns

rm ko-darwin-x64/LICENSE*
rm ko-darwin-x64/version

open ko-darwin-x64/ko.app
