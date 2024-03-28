[![Build Status](https://github.com/ItsSim/fsolauncher/actions/workflows/electron_ci.yml/badge.svg)](https://github.com/ItsSim/fsolauncher/actions/workflows/electron_ci.yml)

# FreeSO Launcher

The official FreeSO Launcher for Windows and macOS.

<img width="1202" src="https://github.com/ItsSim/fsolauncher/assets/35347872/8170e1b5-e4ed-44ac-9c2d-a0a53c81cbc7">
<img width="1202" src="https://github.com/ItsSim/fsolauncher/assets/35347872/7e498aa9-3a67-44df-bd23-26c94fe751dc">
<img width="1202" src="https://github.com/ItsSim/fsolauncher/assets/35347872/1e78df0b-720f-433e-a452-8cda132571f9">
<img width="1202" src="https://github.com/ItsSim/fsolauncher/assets/35347872/c0af405d-eacf-4938-b9ab-3467e66bd626">
<img width="1202" src="https://github.com/ItsSim/fsolauncher/assets/35347872/90285e17-95be-4008-b207-757da1a17a7f">
<img width="1202" src="https://github.com/ItsSim/fsolauncher/assets/35347872/c01eae1a-78c8-4aa9-8c03-dea96f518066">
<img width="1202" src="https://github.com/ItsSim/fsolauncher/assets/35347872/58315823-4d6f-4361-bfd5-ce5e02b7a2d0">

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
