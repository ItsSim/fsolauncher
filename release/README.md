# Build Directory

This is where builds are generated when running `npm run build`.

Note: After building, you must prepare the executable using ResourceHacker (change logo and other info) and make it force admin access using the tools in the /tools/ directory. Then you need to copy the contents of `fsolauncher-build-extras` to the build.

`.asar` packages are generated in the asar directory when running `npm run buildasar`.

Contains installer build script for InnoSetup, currently only for Windows 7 and above, 32 and 64-bit.
Installer for InnoSetup is available in the /tools/ folder of this repo.