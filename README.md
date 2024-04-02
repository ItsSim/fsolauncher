[![Build Status](https://github.com/ItsSim/fsolauncher/actions/workflows/electron_ci.yml/badge.svg)](https://github.com/ItsSim/fsolauncher/actions/workflows/electron_ci.yml)

# FreeSO Launcher

The official FreeSO Launcher for Windows and macOS.

<img width="1202" src="https://github.com/ItsSim/fsolauncher/assets/35347872/105321ac-504e-4f19-b205-325cdfb27124">
<img width="1202" src="https://github.com/ItsSim/fsolauncher/assets/35347872/c075b834-945b-4a8b-b29a-9d00287fba15">
<img width="1202" src="https://github.com/ItsSim/fsolauncher/assets/35347872/b8aeb6da-b1f7-4855-96f5-d37a98f2fecd">
<img width="1202" src="https://github.com/ItsSim/fsolauncher/assets/35347872/684a314b-cbe1-4143-bfca-34520f9b2c25">
<img width="1202" src="https://github.com/ItsSim/fsolauncher/assets/35347872/6e1c8779-f9b1-4bfc-85d5-0836720be624">
<img width="1202" src="https://github.com/ItsSim/fsolauncher/assets/35347872/3159de70-cb75-49d5-9266-81d421a51c6b">
<img width="1202" src="https://github.com/ItsSim/fsolauncher/assets/35347872/ed5b68ca-aafb-40f5-a60b-cae60d1a4e94">

## Prerequisites for Development

- Latest Node.js LTS on a Windows or macOS machine.

## Running the Launcher Locally

1. Clone the repository.
2. Navigate to the `app` folder.
3. Run `npm install`.
4. Run `npm run start`.

## Building the Launcher

After cloning and running `npm install`, build the launcher by following the steps below:

- **For Windows**: In the `app` folder, run `npm run buildwin`.
- **For macOS**: In the `app` folder, run `npm run builddarwin`.

Built binaries are generated in the `release` folder (`FreeSO Launcher.dmg` for macOS and `FreeSO Launcher Setup.exe` for Windows).

Notes on building for multiple platforms:
* If you're using a macOS machine for development, you can generate builds for both macOS and Windows using the commands above. You need to have [wine](https://formulae.brew.sh/cask/wine-stable) installed before running `npm run buildwin`.
* If you're using a Windows machine for development, you can only generate builds for Windows via `npm run buildwin`. This is due to the .dmg creation process during macOS builds, which is incompatible with Windows systems.

## Latest Releases

Visit the [Releases page](https://github.com/ItsSim/fsolauncher/releases) to download the latest version of FreeSO Launcher for Windows and macOS.

## Linux Support

At this time, Linux support is not planned.

## Windows 7/8/8.1 Support

As of launcher version 1.11.x and onward, we no longer support Windows 7, 8, and 8.1. Users of these operating systems will need to remain on launcher version 1.10.x or earlier. You can find the last 1.10.x release [here](https://github.com/ItsSim/fsolauncher/releases/tag/1.10.4-prod.2).

This change follows the discontinuation of support for these versions of Windows by Electron (and Chromium also) starting with Electron 23. For further details, please refer to [this informative article](https://www.electronjs.org/blog/windows-7-to-8-1-deprecation-notice) on the Electron blog.

## FreeSO Launcher Wiki

Visit the [FreeSO Launcher Wiki](https://github.com/ItsSim/fsolauncher/wiki) for:

- [Documentation](https://github.com/ItsSim/fsolauncher/wiki)
- [User Guides](https://github.com/ItsSim/fsolauncher/wiki/Using-FreeSO-Launcher)
- [FAQs](https://github.com/ItsSim/fsolauncher/wiki/FAQ)
- [Developer Guides](https://github.com/ItsSim/fsolauncher/wiki/Development-guide)
