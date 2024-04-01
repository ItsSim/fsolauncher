const os = require( 'os' );
const packageJson = require( '../package.json' );

const homeDir = os.homedir();
const appData = process.platform === 'darwin' ? `${homeDir}/Library/Application Support/FreeSO Launcher` : '.';
const gameLanguages = {
  English: 0,
  French: 3,
  German: 4,
  Italian: 5,
  Spanish: 6,
  Dutch: 7,
  Danish: 8,
  Swedish: 9,
  Norwegian: 10,
  Finish: 11,
  Hebrew: 12,
  Russian: 13,
  Portuguese: 14,
  Japanese: 15,
  Polish: 16,
  SimplifiedChinese: 17,
  TraditionalChinese: 18,
  Thai: 19,
  Korean: 20,

  //begin freeso
  Slovak: 21
};
const isTestMode = process.argv.indexOf( '--fl-test-mode' ) !== -1;
const fileLogEnabled = process.argv.indexOf( '--fl-filelog' ) !== -1;
const devToolsEnabled = process.argv.indexOf( '--fl-devtools' ) !== -1;
const version = packageJson.version;
const defaultRefreshRate = 60;
const defaultGameLanguage = 'English';
const dependencies = {
  'FSO': [ 'TSO', ...( process.platform === 'darwin' ? [ 'Mono', 'SDL' ] : [ 'OpenAL' ] ) ],
  'RMS': [ 'FSO' ],
  'MacExtras': [ 'FSO' ],
  'Simitone': ( process.platform === 'darwin' ) ? [ 'Mono', 'SDL' ] : []
};
const needInternet = [
  'TSO',
  'FSO',
  'RMS',
  'Simitone',
  'Mono',
  'MacExtras',
  'SDL'
];
const darkThemes = [
  'halloween', 'dark', 'indigo'
];
const components = {
  'TSO': 'The Sims Online',
  'FSO': 'FreeSO',
  'OpenAL': 'OpenAL',
  'NET': '.NET Framework',
  'RMS': 'Remesh Package',
  'Simitone': 'Simitone for Windows',
  'Mono': 'Mono Runtime',
  'MacExtras': 'FreeSO MacExtras',
  'SDL': 'SDL2'
};
const versionChecks = {
  remeshPackageUrl: 'https://beta.freeso.org/RemeshPackage',
  updatesUrl: 'https://beta.freeso.org/UpdateCheck',
  interval: 5 * 60 * 1000 // every 5 minutes
};
const links = {
  updateWizardUrl: 'https://beta.freeso.org/update',
  repoNewIssueUrl: 'https://github.com/ItsSim/fsolauncher/issues/new/choose',
  repoViewIssuesUrl: 'https://github.com/ItsSim/fsolauncher/issues',
  repoDocsUrl: 'https://github.com/ItsSim/fsolauncher/wiki',
  repoUrl: 'https://github.com/ItsSim/fsolauncher',
};
const releases = {
  simitoneUrl: 'https://api.github.com/repos/riperiperi/Simitone/releases/latest',
  fsoGithubUrl: 'https://api.github.com/repos/riperiperi/FreeSO/releases/latest',
  fsoApiUrl: 'https://api.freeso.org/userapi/update/beta',
};
const resourceCentral = {
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
};
const temp = {
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
};
const registry = {
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
};

module.exports = {
  homeDir,
  appData,
  gameLanguages,
  isTestMode,
  fileLogEnabled,
  devToolsEnabled,
  version,
  defaultRefreshRate,
  defaultGameLanguage,
  dependencies,
  needInternet,
  darkThemes,
  components,
  versionChecks,
  links,
  releases,
  resourceCentral,
  temp,
  registry
};
