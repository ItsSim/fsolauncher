const homeDir = require( 'os' ).homedir();
const appData = process.platform == 'darwin' ? `${homeDir}/Library/Application Support/FreeSO Launcher` : '.';

module.exports = {
  homeDir,
  appData,
  isTestMode: process.argv.indexOf( '--fl-test-mode' ) !== -1,
  fileLogEnabled: process.argv.indexOf( '--fl-filelog' ) !== -1,
  devToolsEnabled: process.argv.indexOf( '--fl-devtools' ) !== -1,
  version: require( '../package.json' ).version,
  defaultRefreshRate: 60,
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
  darkThemes: [
    'halloween', 'dark', 'indigo'
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
  versionChecks: {
    remeshPackageUrl: 'https://beta.freeso.org/RemeshPackage',
    updatesUrl: 'https://beta.freeso.org/UpdateCheck',
    interval: 5 * 60 * 1000 // every 5 minutes
  },
  links: {
    updateWizardUrl: 'https://beta.freeso.org/update',
    repoNewIssueUrl: 'https://github.com/ItsSim/fsolauncher/issues/new/choose',
    repoViewIssuesUrl: 'https://github.com/ItsSim/fsolauncher/issues',
    repoDocsUrl: 'https://github.com/ItsSim/fsolauncher/wiki',
    repoUrl: 'https://github.com/ItsSim/fsolauncher',
  },
  releases: {
    simitoneUrl: 'https://api.github.com/repos/riperiperi/Simitone/releases/latest',
    fsoGithubUrl: 'https://api.github.com/repos/riperiperi/FreeSO/releases/latest',
    fsoApiUrl: 'https://api.freeso.org/userapi/update/beta',
  },
  resourceCentral: {
    'TheSimsOnline': 'https://beta.freeso.org/LauncherResourceCentral/TheSimsOnline',
    'FreeSO': 'https://beta.freeso.org/LauncherResourceCentral/FreeSO',
    '3DModels': 'https://beta.freeso.org/LauncherResourceCentral/3DModels',
    'Simitone': 'https://beta.freeso.org/LauncherResourceCentral/Simitone',
    'Mono': 'https://beta.freeso.org/LauncherResourceCentral/Mono',
    'MacExtras': 'https://beta.freeso.org/LauncherResourceCentral/MacExtras',
    'SDL': 'https://beta.freeso.org/LauncherResourceCentral/SDL',
    'WS': 'https://beta.freeso.org/LauncherResourceCentral/ws',
    'TrendingLots': 'https://beta.freeso.org/LauncherResourceCentral/TrendingLots',
    'Scenarios': 'https://beta.freeso.org/LauncherResourceCentral/Scenarios'
  },
  temp: {
    'FSO': `${appData}/temp/artifacts-freeso-%s.zip`,
    'MacExtras': `${appData}/temp/macextras-%s.zip`,
    'Mono': `${appData}/temp/mono-%s.pkg`,
    'RMS': `${appData}/temp/artifacts-remeshes-%s.zip`,
    'SDL': `${appData}/temp/sdl2-%s.dmg`,
    'Simitone': `${appData}/temp/artifacts-simitone-%s.zip`,
    'TSO': {
      path: `${appData}/temp/tsoclient`,
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
        `${appData}/GameComponents/The Sims Online/TSOClient/TSOClient.exe`,

      'FSO': process.platform === 'win32' ?
        'HKLM\\SOFTWARE\\Rhys Simpson\\FreeSO' : `${appData}/GameComponents/FreeSO/FreeSO.exe`,

      'TS1': process.platform === 'win32' ?
        'HKLM\\SOFTWARE\\Maxis\\The Sims' : `${appData}/GameComponents/The Sims/Sims.exe`,

      'Simitone': process.platform === 'win32' ?
        'HKLM\\SOFTWARE\\Rhys Simpson\\Simitone' :
        `${appData}/GameComponents/Simitone for Windows/Simitone.Windows.exe`,

      'OpenAL': 'HKLM\\SOFTWARE\\OpenAL',
      'NET': 'HKLM\\SOFTWARE\\Microsoft\\NET Framework Setup\\NDP',
      'Mono': '/Library/Frameworks/Mono.framework',
      'SDL': '/Library/Frameworks/SDL2.framework'
    },
    fallbacks: process.platform === 'win32' ? {
      // Windows fallbacks
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
    } : {
      // macOS fallbacks
      'TSO': [
        `${appData}/GameComponents/The Sims Online/TSOClient/TSOClient.exe`,
        `${homeDir}/Documents/The Sims Online/TSOClient/TSOClient.exe`,
      ],
      'FSO': [
        `${appData}/GameComponents/FreeSO/FreeSO.exe`,
        `${homeDir}/Documents/FreeSO/FreeSO.exe`,
      ],
      'Simitone': [
        `${appData}/GameComponents/Simitone for Windows/Simitone.Windows.exe`,
        `${homeDir}/Documents/Simitone for Windows/Simitone.Windows.exe`,
      ],
      'TS1': [
        `${appData}/GameComponents/The Sims`,
        `${homeDir}/Documents/The Sims`
      ]
    }
  }
};