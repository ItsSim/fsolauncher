# FreeSO Launcher

![image](https://i.imgur.com/RbugnjU.png)

# Installing FreeSO
To install FreeSO you will also need to install OpenAL, .NET Framework >= 4.0 and the original The Sims Online client. These dependencies are all included in the launcher.

By clicking the **COMPLETE INSTALLATION** button in the **INSTALLER** tab you can install FreeSO and all of its dependencies all together.

If you already have some of the dependencies installed, you can install the ones you don't have by clicking them separately in the installer tab. 

# Using a previous FreeSO installation
If you have already installed FreeSO before, you can reuse your installation by installing it in the same directory. If the game files are already present, the launcher will not perform a reinstallation. It will choose your previous installation as the primary one.

For example, if you already have FreeSO installed in C:/Program Files/FreeSO, then install FreeSO from the launcher choosing the **Program Files** directory. 

The folder needs to be named **FreeSO** in order for the launcher to pick up previous installations.

# Extra features
* You can right click the Play button to run FreeSO along with the Volcanic IDE.
* You can change your game language in settings.
* You can change your game mode (3D or 2D).
* You can change the graphics mode (DirectX, OpenGL or Software).
* You can turn on Text-To-Speech for the game.

# Problems
* If your The Sims Online download fails continuosly at different .cabs, it is most likely due to a bad internet connection. You can use the original The Sims Online installer which seems to retry multiple times after failing, which means it may take more time to install, but it might work for you. [Click here to download the original The Sims Online installer](http://largedownloads.ea.com/pub/misc/tso/Setup%20The%20Sims%20Online.exe).

# How to build
1. Install Node.js
2. Install Electron 1.7.9 using NPM (`npm i -g electron@1.7.9`)
3. Run `npm run build` in the folder where package.json is to build Electron binaries
4. Run `npm run buildasar` in the folder where package.json is to build the launcher 
5. Copy the app.asar file and the app.asar.unpacked folder to the resources folder of the Electron binaries
6. Run electron.exe

**Make sure to run it as an administrator!**

