( () => {
  window.Sentry.onLoad( function() {
    window.Sentry.init( {
      beforeSend( event ) {
        return sanitizeEvent( event );
      },
      integrations: [
        window.Sentry.replayIntegration( {
          maskAllText: false,
          blockAllMedia: false,
        } )
      ]
    } );
  } );

  function sanitizeEvent( event ) {
    event = sanitizeExceptions( event );

    return event;
  }

  function sanitizeExceptions( event ) {
    if ( event.exceptions && event.exceptions.values ) {
      event.exceptions.values.forEach( ( exception ) => {
        if ( exception.stacktrace && exception.stacktrace.frames ) {
          exception.stacktrace.frames.forEach( ( frame ) => {
            frame.filename = obfuscatePath( frame.filename ); // Obfuscate local file paths
          } );
        }
      } );
    }
    return event;
  }

  function obfuscatePath( filePath ) {
    if ( typeof filePath !== 'string' ) {
      return filePath;
    }
    // Replace user directory with a placeholder
    const userDirectory = process.env.HOME || process.env.USERPROFILE;
    return filePath.replace( userDirectory, '[USER_DIR]' );
  }
} )();