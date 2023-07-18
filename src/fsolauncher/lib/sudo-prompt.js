if ( global.isTestMode ) {
  module.exports = {
    exec: ( command, options, callback ) => {
      console.log( 'stub sudo-prompt called' );
      require( 'child_process' ).exec( command, options, callback );
    }
  };
} else {
  module.exports = require( 'sudo-prompt' );
}