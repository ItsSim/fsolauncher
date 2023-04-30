[![Build Status](https://github.com/ItsSim/fsolauncher/actions/workflows/electron_ci.yml/badge.svg)](https://github.com/ItsSim/fsolauncher/actions/workflows/electron_ci.yml)

# FreeSO Launcher

The official FreeSO Launcher for Windows and macOS.

![Screenshot](https://user-images.githubusercontent.com/35347872/165303049-e2176513-7ce0-4279-bd40-62d1bd571f61.png)
![Screenshot](https://user-images.githubusercontent.com/35347872/165303098-1cfbae44-2227-4d30-ab39-3537e0229a37.png)
![Screenshot](https://user-images.githubusercontent.com/35347872/165303154-a0b65f66-d88d-42fd-8355-66e371ea8f8d.png)
![Screenshot](https://user-images.githubusercontent.com/35347872/165325139-82fe05be-62a7-4603-ab03-bcef9a2ad66c.png)
![Screenshot 2023-04-29 at 00 34 21](https://user-images.githubusercontent.com/35347872/235264926-bd4fb2ca-1efc-459f-8581-18d33aa2c725.png)
![Screenshot](https://i.imgur.com/u5iJ0qD.png)
![Screenshot](https://user-images.githubusercontent.com/35347872/165303264-02c54e3c-fd11-4ec3-9886-3ef907876ad7.png)

## Prerequisites for Development

- Node.js `v14.16` or higher
- A build environment corresponding to the target platform (macOS for Mac builds, Windows for Windows builds)

## Running the Launcher Locally

1. Clone the repository.
2. Navigate to the `src` folder.
3. Run `npm install`.
4. Run `npm run start`.

## Building the Launcher

After cloning and running `npm install`, build the launcher by following the steps below:

- **For Windows**: In the `src` folder, run `npm run buildwin`.
- **For macOS**: In the `src` folder, run `npm run builddarwin`.

Built binaries are generated in the `release` folder (`FreeSO Launcher.dmg` for macOS and `FreeSO Launcher Setup.exe` for Windows).

## Latest Releases

Visit the [Releases page](https://github.com/ItsSim/fsolauncher/releases) to download the latest version of FreeSO Launcher for Windows and macOS.

## Linux Support

At this time, Linux support is not planned. However, a Lutris script exists to install FreeSO and its dependencies: [FreeSO on Lutris](https://lutris.net/games/freeso/)

## FreeSO Launcher Wiki

Visit the [FreeSO Launcher Wiki](https://github.com/ItsSim/fsolauncher/wiki) for:

- [Documentation](https://github.com/ItsSim/fsolauncher/wiki)
- [User Guides](https://github.com/ItsSim/fsolauncher/wiki/Using-FreeSO-Launcher)
- [FAQs](https://github.com/ItsSim/fsolauncher/wiki/FAQ)
- [Developer Guides](https://github.com/ItsSim/fsolauncher/wiki/Development-guide)
 