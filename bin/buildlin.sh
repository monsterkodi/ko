#!/usr/bin/env bash
cd `dirname $0`/..

if rm -rf ko-linux-ia32; then

    node_modules/.bin/konrad

    node_modules/.bin/electron-rebuild
    
    node_modules/electron-packager/cli.js . ko --no-prune --icon=img/menu@2x.png
    
    rm -rf ko-linux-ia32/resources/app/node_modules/electron-packager
    rm -rf ko-linux-ia32/resources/app/node_modules/electron-rebuild
    rm -rf ko-linux-ia32/resources/app/node_modules/electron
    rm -rf ko-linux-ia32/resources/app/inno

fi
