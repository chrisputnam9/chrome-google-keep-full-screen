#!/bin/bash

SCRIPT_PATH="$(realpath "${BASH_SOURCE[0]}")"
EXTENSION_FOLDER="$(dirname -- "$SCRIPT_PATH")"
EXTENSION_NAME="$(basename "$EXTENSION_FOLDER")"

# Package for Firefox first
rm -f "$HOME/Downloads/$EXTENSION_NAME-firefox.zip"
cd "$EXTENSION_FOLDER" || exit 1
mv manifest.json manifest-3.0.json
mv manifest-2.0.json manifest.json
zip -r "$HOME/Downloads/$EXTENSION_NAME-firefox.zip" . \
	--exclude ".*" \
	--exclude "manifest-2.0.json" \
	--exclude "manifest-3.0.json" \
	--exclude "publish.sh" \
	-q

# Package for Chrome
rm -f "$HOME/Downloads/$EXTENSION_NAME-chrome.zip"
mv manifest.json manifest-2.0.json
mv manifest-3.0.json manifest.json
cd ..
zip -r "$HOME/Downloads/$EXTENSION_NAME-chrome.zip" "$EXTENSION_NAME" \
	--exclude "$EXTENSION_NAME/.*" \
	--exclude "$EXTENSION_NAME/manifest-2.0.json" \
	--exclude "$EXTENSION_NAME/manifest-3.0.json" \
	--exclude "$EXTENSION_NAME/publish.sh" \
	-q
