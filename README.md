[![ci](https://github.com/ItsSim/fsolauncher/actions/workflows/ci_build_publish.yml/badge.svg)](https://github.com/ItsSim/fsolauncher/actions/workflows/ci_build_publish.yml)

# FreeSO Launcher
The official FreeSO Launcher available for Windows and Mac OS X.

<img width="1202" alt="Screenshot 2022-04-26 at 14 43 19" src="https://user-images.githubusercontent.com/35347872/165303049-e2176513-7ce0-4279-bd40-62d1bd571f61.png">

<img width="1202" alt="Screenshot 2022-04-26 at 14 43 37" src="https://user-images.githubusercontent.com/35347872/165303098-1cfbae44-2227-4d30-ab39-3537e0229a37.png">

<img width="1202" alt="Screenshot 2022-04-26 at 14 44 04" src="https://user-images.githubusercontent.com/35347872/165303154-a0b65f66-d88d-42fd-8355-66e371ea8f8d.png">

<img width="1202" alt="Screenshot 2022-04-26 at 16 36 33" src="https://user-images.githubusercontent.com/35347872/165325139-82fe05be-62a7-4603-ab03-bcef9a2ad66c.png">

![image](https://i.imgur.com/u5iJ0qD.png)

<img width="1202" alt="Screenshot 2022-04-26 at 14 46 41" src="https://user-images.githubusercontent.com/35347872/165303264-02c54e3c-fd11-4ec3-9886-3ef907876ad7.png">

<!--![image](https://i.imgur.com/hWXan8k.png)
![image](https://i.imgur.com/UPqQgBZ.png)
![image](https://i.imgur.com/JLznCnv.png)
![image](https://i.imgur.com/cEV2qqs.png)-->
<!--![image](https://i.imgur.com/yCUFHhE.png)-->
<!--![image](https://i.imgur.com/86vaK8l.png)-->
<!--![image](https://i.imgur.com/1h6OPE2.png)-->
<!--![image](https://i.imgur.com/aF5RX5n.png)--><!-- ![image](https://i.imgur.com/dPRDgHh.jpg) -->

### Prerequisites for development
* You must have `Node 14.16` installed on your system.
* It’s recommended to build the launcher on the target OS. If you’re building for Mac, use a Mac. If you’re building for Windows, use a PC. I have not tested building both on one single OS, so I’m not sure if it works.
* You might have to install the vendor dependencies (inside the /vendor/ folder) using `npm` before running or building the project: 
  - Enter each folder inside vendor and run `npm i --production`.

## How to run
Clone the repo and then:
```
cd src
npm i 
npm run start
```
## How to build
After cloning and `npm i` the repo, run from the `src` folder:
* For Windows:
```
npm run buildwin
```
* For Mac:
```
npm run builddarwin
```
Built binaries are generated in the `release` folder (`FreeSO Launcher.dmg` for Mac and `FreeSO Launcher Setup.exe` for Windows)

## Latest Releases
[Microsoft Windows 7 or later](https://beta.freeso.org/FreeSO%20Launcher%20Setup.exe) <br/>
[Mac OS X 10.10 (Yosemite) or later](https://beta.freeso.org/fsolauncher.dmg)

## On Linux support
I do not think it’s worth it to have linux support at this time.

A Lutris script exists that should install FreeSO and all of its dependencies: https://lutris.net/games/freeso/

## Visit the FreeSO Launcher wiki
Visit the [wiki](https://github.com/ItsSim/fsolauncher/wiki) for documentation, [user guides](https://github.com/ItsSim/fsolauncher/wiki/Using-FreeSO-Launcher) and [FAQs](https://github.com/ItsSim/fsolauncher/wiki/FAQ).

Developer guides: https://github.com/ItsSim/fsolauncher/wiki/Development-guide
