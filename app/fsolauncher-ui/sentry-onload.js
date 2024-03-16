( () => {
  window.Sentry.onLoad( function() {
    window.Sentry.init( {
      integrations: [
        window.Sentry.replayIntegration( {
          maskAllText: false,
          blockAllMedia: false,
          maskAllInputs: false
        } )
      ]
    } );
  } );
} )();