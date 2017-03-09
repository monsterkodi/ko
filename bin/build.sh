#!/usr/bin/env bash
cd `dirname $0`/..

killall ko
rm -f ko-*.dmg
konrad --run

node_modules/.bin/electron-rebuild
node_modules/electron-packager/cli.js . --overwrite --icon=img/ko.icns

rm -f ko-darwin-x64/LICENSE*
rm -f ko-darwin-x64/version
rm -rf ko-darwin-x64/ko.app/Contents/Resources/app/bin
rm -rf ko-darwin-x64/ko.app/Contents/Resources/app/coffee
rm -rf ko-darwin-x64/ko.app/Contents/Resources/app/md
rm -rf ko-darwin-x64/ko.app/Contents/Resources/app/pug
rm -rf ko-darwin-x64/ko.app/Contents/Resources/app/styl
rm -f  ko-darwin-x64/ko.app/Contents/Resources/app/package.noon
rm -f  ko-darwin-x64/ko.app/Contents/Resources/app/README.md

open ko-darwin-x64/ko.app
