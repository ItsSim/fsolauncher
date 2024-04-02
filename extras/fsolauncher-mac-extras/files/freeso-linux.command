#!/bin/bash
cd -- "$(dirname "$0")"
if [ -f "PatchFiles/patch.zip" ]; then
	rm "PatchFiles/patch/" -r
	cd PatchFiles
	unzip patch.zip -d patch/
	rm patch/PatchFiles/
	rm patch/MonoGame.Framework.dll
	rm patch/MonoGame.Framework.xml
	cd ../
	rsync -a PatchFiles/patch/ .
	rm PatchFiles/patch.zip
	rm PatchFiles/patch/
fi

/usr/bin/mono FreeSO.exe $@