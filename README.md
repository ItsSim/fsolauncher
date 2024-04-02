[![Build Status](https://github.com/ItsSim/fsolauncher/actions/workflows/electron_ci.yml/badge.svg)](https://github.com/ItsSim/fsolauncher/actions/workflows/electron_ci.yml)

# FreeSO Launcher

The official FreeSO Launcher for Windows and macOS.

<img width="1202" src="https://github.com/ItsSim/fsolauncher/assets/35347872/a63015a6-649b-461e-8887-08198acb65ee">
<img width="1202" src="https://github.com/ItsSim/fsolauncher/assets/35347872/5f284c25-8b49-432c-be11-1786fc5981b8">
<img width="1202" src="https://github.com/ItsSim/fsolauncher/assets/35347872/53cbe0a5-3c6c-43d0-8472-972694f4f66f">
<img width="1202" src="https://github.com/ItsSim/fsolauncher/assets/35347872/dd7156e2-be51-4400-afde-44ebaaa087d0">
<img width="1202" src="https://github.com/ItsSim/fsolauncher/assets/35347872/fd92ddaa-8eff-4a9d-9ef5-5e0be5d4c003">
<img width="1202" src="https://github.com/ItsSim/fsolauncher/assets/35347872/0b0a3e2d-d32c-444c-bd6c-4fad3a1753b5">
<img width="1202" src="https://github.com/ItsSim/fsolauncher/assets/35347872/ae733da4-b615-478a-81bd-8457edd6c30d">

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
