#!/usr/bin/env bash

rm -rf dist app/js app/img app/css app/bin app/syntax app/*.html app/node_modules
cp -r js css img bin syntax *.html app
cp build/snap.svg.js js
cp build/snap.svg.js app/js
cp coffee/area/voronoi/voronoi.js js/area/voronoi
cp coffee/area/voronoi/voronoi.js app/js/area/voronoi
cd app && npm install
cd ..
