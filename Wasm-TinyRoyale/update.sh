#!/bin/sh
cp -R ~/Work/UnityRoyale/TinyRoyale/Builds/Wasm-TinyRoyale/* .
mv TinyRoyale.html index.html 
git add .
git commit -m "update"
git push
