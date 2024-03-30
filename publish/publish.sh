#!/bin/bash

SCRIPT_PATH="$(realpath "${BASH_SOURCE[0]}")"
PUBLISH_FOLDER="$(dirname -- "$SCRIPT_PATH")"
EXTENSION_FOLDER="$(dirname -- "$PUBLISH_FOLDER")"
EXTENSION_NAME="$(basename "$EXTENSION_FOLDER")"

function main {

	# Move symlink temporarily
	cd "$EXTENSION_FOLDER" || exit 1
	mv manifest.json publish/manifest-symlink.json

	# Package for Firefox
	prep_for "firefox"
	package . "firefox"
	zip -r "$HOME/Downloads/$EXTENSION_NAME-firefox.zip" . --exclude ".*" -q

	# Move above folder to package for Edge and Chrome
	cd "$EXTENSION_FOLDER/../" || exit 1

	# Package for Edge
	prep_for "edge"
	package "$EXTENSION_NAME" "edge"

	# Package for Chrome
	prep_for "chrome"
	package "$EXTENSION_NAME" "chrome"

	# Move symlink back into place
	cd "$EXTENSION_FOLDER" || exit 1
	mv publish/manifest-symlink.json manifest.json
}

function package {
	zip -r "$HOME/Downloads/$EXTENSION_NAME-$2.zip" "$1" \
		--exclude "$1/.*" \
		--exclude "$1/publish/*" \
		-q
}

function prep_for {
	rm -f "$HOME/Downloads/$EXTENSION_NAME-$1.zip"
	cp -f "$PUBLISH_FOLDER/manifest-$1.json" "$EXTENSION_FOLDER/manifest.json"
}

main
