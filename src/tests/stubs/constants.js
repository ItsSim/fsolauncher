const constants = require( '../../fsolauncher/constants' );

module.exports = function ( exeDir ) {
  if ( process.platform === 'win32' ) {
    constants.appData = exeDir;

    // Recompute properties that depend on appData
    constants.temp.FSO = `${constants.appData}/temp/artifacts-freeso-%s.zip`;
    constants.temp.MacExtras = `${constants.appData}/temp/macextras-%s.zip`;
    constants.temp.Mono = `${constants.appData}/temp/mono-%s.pkg`;
    constants.temp.RMS = `${constants.appData}/temp/artifacts-remeshes-%s.zip`;
    constants.temp.SDL = `${constants.appData}/temp/sdl2-%s.dmg`;
    constants.temp.Simitone = `${constants.appData}/temp/artifacts-simitone-%s.zip`;
    constants.temp.TSO.path = `${constants.appData}/temp/tsoclient`;
  }
};