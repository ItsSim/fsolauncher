module.exports = {
  dependencies: {
    'FSO': [ 'TSO', ...( process.platform === 'darwin' ? [ 'Mono', 'SDL' ] : [ 'OpenAL' ] ) ],
    'RMS': [ 'FSO' ],
    'MacExtras': [ 'FSO' ],
    'Simitone': ( process.platform === 'darwin' ) ? [ 'Mono', 'SDL' ] : []
  },
  needInternet: [
    'TSO',
    'FSO',
    'RMS',
    'Simitone',
    'Mono',
    'MacExtras',
    'SDL'
  ],
  langCodes: {
    'en': 0,
    'es': 6,
    'it': 5,
    'pt': 14
  },
  langStrings: {
    0: [ 'English', 'en' ], // default
    6: [ 'Spanish', 'es' ],
    5: [ 'Italian', 'it' ],
    14: [ 'Portuguese', 'pt' ]
  },
  components: {
    'TSO': 'The Sims Online',
    'FSO': 'FreeSO',
    'OpenAL': 'OpenAL',
    'NET': '.NET Framework',
    'RMS': 'Remesh Package',
    'Simitone': 'Simitone for Windows',
    'Mono': 'Mono Runtime',
    'MacExtras': 'FreeSO MacExtras',
    'SDL': 'SDL2'
  },
  downloads: {
    'TSO': 'https://beta.freeso.org/LauncherResourceCentral/TheSimsOnline',
    'FSO': 'https://beta.freeso.org/LauncherResourceCentral/FreeSO',
    'RMS': 'https://beta.freeso.org/LauncherResourceCentral/3DModels',
    'Simitone': 'https://beta.freeso.org/LauncherResourceCentral/Simitone',
    'Mono': 'https://beta.freeso.org/LauncherResourceCentral/Mono',
    'MacExtras': 'https://beta.freeso.org/LauncherResourceCentral/MacExtras',
    'SDL': 'https://beta.freeso.org/LauncherResourceCentral/SDL'
  },
  temp: {
    'FSO': `${global.appData}temp/artifacts-freeso-%s.zip`,
    'MacExtras': `${global.appData}temp/macextras-%s.zip`,
    'Mono': `${global.appData}temp/mono-%s.pkg`,
    'RMS': `${global.appData}temp/artifacts-remeshes-%s.zip`,
    'SDL': `${global.appData}temp/sdl2-%s.dmg`,
    'Simitone': `${global.appData}temp/artifacts-simitone-%s.zip`,
    'TSO': {
      path: `${global.appData}temp/tsoclient`,
      file: 'client.zip',
      extractionFolder: 'client',
      firstCab: 'TSO_Installer_v1.1239.1.0/Data1.cab',
      rootCab: 'Data1.cab'
    }
  },
  registry: {
    ociName: 'FreeSO Game',
    paths: {
      'TSO': process.platform === 'win32' ?
        'HKLM\\SOFTWARE\\Maxis\\The Sims Online' :
        `${global.homeDir}/Documents/The Sims Online/TSOClient/TSOClient.exe`,

      'FSO': process.platform === 'win32' ?
        'HKLM\\SOFTWARE\\Rhys Simpson\\FreeSO' : `${global.homeDir}/Documents/FreeSO/FreeSO.exe`,

      'TS1': process.platform === 'win32' ?
        'HKLM\\SOFTWARE\\Maxis\\The Sims' : `${global.homeDir}/Documents/The Sims/Sims.exe`,

      'Simitone': process.platform === 'win32' ?
        'HKLM\\SOFTWARE\\Rhys Simpson\\Simitone' :
        `${global.homeDir}/Documents/Simitone for Windows/Simitone.Windows.exe`,

      'OpenAL': 'HKLM\\SOFTWARE\\OpenAL',
      'NET': 'HKLM\\SOFTWARE\\Microsoft\\NET Framework Setup\\NDP',
      'Mono': '/Library/Frameworks/Mono.framework',
      'SDL': '/Library/Frameworks/SDL2.framework'
    },
    win32Fallbacks: {
      'TSO': [
        'C:/Program Files/Maxis/The Sims Online/TSOClient/TSOClient.exe',
        'C:/Program Files/The Sims Online/TSOClient/TSOClient.exe',
        'C:/Program Files/FreeSO Game/The Sims Online/TSOClient/TSOClient.exe'
      ],
      'FSO': [
        'C:/Program Files/FreeSO/FreeSO.exe',
        'C:/Program Files/FreeSO Game/FreeSO/FreeSO.exe'
      ],
      'Simitone': [
        'C:/Program Files/Simitone for Windows/Simitone.Windows.exe',
        'C:/Program Files (x86)/Simitone for Windows/Simitone.Windows.exe'
      ],
      'OpenAL': [
        'C:/Program Files (x86)/OpenAL'
      ],
      'TS1': [
        'C:/Program Files (x86)/Maxis/The Sims'
      ]
    }
  }
};