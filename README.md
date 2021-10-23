# FreeSO Launcher
The official FreeSO Launcher available for Windows and Mac OS X.


![image](https://i.imgur.com/59YUj54.png)
![image](https://i.imgur.com/F5t1tf0.png)
![image](https://i.imgur.com/HzaHgQc.png)
![image](https://i.imgur.com/yCUFHhE.png)
![image](https://i.imgur.com/BYJqShW.png)
![image](https://i.imgur.com/1h6OPE2.png)
![image](https://i.imgur.com/uRjWpfq.png)<!-- ![image](https://i.imgur.com/dPRDgHh.jpg) -->

### Prerequisites for development
* You must have `Node 14.16` installed on your system.
* It’s recommended to build the launcher on the target OS. If you’re building for Mac, use a Mac. If you’re building for Windows, use a PC. I have not tested building both on one single OS, so I’m not sure if it works.

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

## Visit the FreeSO Launcher wiki
Visit the [wiki](https://github.com/ItsSim/fsolauncher/wiki) for documentation, [user guides](https://github.com/ItsSim/fsolauncher/wiki/Using-FreeSO-Launcher) and [FAQs](https://github.com/ItsSim/fsolauncher/wiki/FAQ).
