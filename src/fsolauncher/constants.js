module.exports = {
  dependency: {
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
    0:  [ 'English',    'en' ], // default
    6:  [ 'Spanish',    'es' ],
    5:  [ 'Italian',    'it' ],
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
  }
}