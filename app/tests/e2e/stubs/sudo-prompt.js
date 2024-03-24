module.exports = {
  exec: ( command, options, callback ) => {
    console.info( 'stub sudo-prompt called' );
    require( 'child_process' ).exec( command, options, callback );
  }
};