module.exports = {
  exec: ( command, options, callback ) => {
    console.info( 'stub sudo-prompt called' );
    const sudoCommand = command
      .split( '&&' )
      .map( cmd => 'sudo ' + cmd.trim() )
      .join( ' && ' );
    require( 'child_process' ).exec( sudoCommand, options, callback );
  }
};