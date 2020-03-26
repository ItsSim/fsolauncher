Version: 2020 1.7.x
Author: Sim

Changelog:
- 2020.03.27: GitHub FreeSO Installer, FreeSO AutoDetect
- 2020.03.12: Dependency switch to deflate-js.
- 2020.03.09: Installer refactoring. Dependency switch to yauzl.
- 2019.11.29: Simitone installer tweaks and other improvements.
- 2019.11.28: Simitone support.
- 2019.07.27: Installed indicator, style changes.
- 2019.06.12: Updated to Electron 5.0.3.
- 2019.06.05: UI tweaks, re-added direct launch mode. Launcher can act as a FreeSO.exe shortcut.
- 2019.31.03: Quick fix for the FilePlanet archive.org URL.
- 2019.04.03: Quick fix for a very specific bug where download fileStreams weren't closing when retrying. Also commented electron-notify again. Sigh...
- 2019.03.03: Reworked download process, should make Archive.org downloads work most of the time.
- 2018.18.10: Improved launcher loading time, overall performance improvement.
- 2018.13.10: Updated Electron from 1.7.9 to 3.0.3 and some dependencies.
- 2018.09.10: Small bugfix for alternative TSO download.
- 2018.08.10: Added alternative TSO download link (Archive.org EA LargeFiles FTP), UI tweaks.
- 2018.16.09: Added alternative TSO download link (FilePlanet).
- 2018.09.04: Added Spanish language, minor fixes and stability improvements.
- 2018.02.04: Added Remesh Package installer option, improved workflow.

Thank you for downloading the official FreeSO Launcher.
This program was made using:
- Electron 8.2.0

* This program does not include a copy of The Sims Online or any other type of content of EA IP. It downloads everything needed from EA's public FTP server (http://largedownloads.ea.com/pub/misc/tso/) upon the user's request through the Installer tab.
* FreeSO is downloaded from the official FreeSO Servo distribution platform (http://servo.freeso.org).
* OpenAL and .NET 4.6 are included in the launcher's source files and do not need an active internet connection to be installed.
* Remeshes are hosted compressed on a remote server and are downloaded upon user request.
* This program periodically makes requests to a remote server in order to check for new updates. For statistics, better troubleshooting, and to help me find issues quicker, the your current launcher version is included as a GET parameter in the request.
* This program connects via socket to a remote server in order to receive live updates and news from FreeSO Administrators in the form of desktop notifications. The launcher is NOT able to perform any other remote task other than receiving desktop notifications.

Special Thanks to:
- Womsy: Spanish Translator
- Alessandro: Italian Translator
- Maria: FreeSO Admin/Collaborator

Contact:
- Discord: Sim#0046 
- Email Address: dbhdane@outlook.com

GitHub repository: https://github.com/ItsSim/fsolauncher 
For launcher issues please submit a GitHub issue to https://github.com/ItsSim/fsolauncher/issues