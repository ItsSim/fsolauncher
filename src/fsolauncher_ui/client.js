/* global io Howl DOMPurify shared RSSParser */
var parser = new RSSParser();

var $  = q => document.querySelector( q );
var $a = q => document.querySelectorAll( q );
var $c = q => document.createElement( q );

// Add a hook to make all links open a new window.
DOMPurify.addHook( 'afterSanitizeAttributes', node => {
  // set all elements owning target to target=_blank.
  if ( 'target' in node ) { node.setAttribute( 'target', '_blank' ); }
  // set non-HTML/MathML links to xlink:show=new.
  if ( !node.hasAttribute( 'target' ) && 
     ( node.hasAttribute( 'xlink:href' ) || node.hasAttribute( 'href' ) ) ) {
    node.setAttribute( 'xlink:show', 'new' );
  }
} );

var darkThemes = [ 'halloween', 'dark' ];

// Expose setCurrentPage to the DOM.
var setCurrentPage;

( () => {
  var sock = io( `https://${ $( 'body' ).getAttribute( 'wsUrl' ) }:${ $( 'body' ).getAttribute( 'wsPort' ) }` );
  var pageTriggerAudio = new Howl( { src: 'fsolauncher_sounds/click.wav', volume: 0.4 } );
  var yesNoAudio = new Howl( { src: 'fsolauncher_sounds/modal.wav', volume: 0.4 } );
  var hasAlreadyLoaded = false;
  var twitterHasAlreadyLoaded = false;
  var simitoneRequirementsCheckInterval;
  var simitoneSuggestedUpdate;
  var platform = $( 'html' ).className;
  var prevTheme;
  var timeout = ( promise, milliseconds = 5000 ) => {
    return new Promise( ( resolve, reject ) => {
      setTimeout( () => {
        reject( new Error( "Timeout exceeded" ) )
      }, milliseconds )
      promise.then( resolve, reject )
    } )
  };
  var init = () => {
    ( sendToMain( 'INIT_DOM' ), setCurrentPage( 'home' ), fetchNews() )
    setInterval( updateTSOClock, 1000 );
    setElectronVersion( shared.electronVersion );
    sock.on( 'receive global message', data => 
      sendToMain( 'SOCKET_MESSAGE', [ data.Message, data.Url ] ) );
  };

  /**
   * Fires an event to the main process.
   * 
   * @param {*} id 
   * @param {*} param 
   */
  var sendToMain = ( id, param ) => shared.send( id, param );

  /**
   * Fires when a message has been received from the main process.
   * 
   * @param {string} id 
   * @param {Function} callback 
   */
  var onMessage = ( id, callback ) => shared.on( id, callback );

  /**
   * Adds an event listener.
   * @param {*} a 
   * @param {*} b 
   * @param {*} c 
   */
  var addEventListener = ( a, b, c ) => {
    a.tagName
      ? a.addEventListener( b, c )
        : $( a ).addEventListener( b, c );
  };

  /**
   * Adds multiple event listeners.
   * @param {*} a 
   * @param {*} b 
   * @param {*} c 
   */
  var addEventListenerAll = ( a, b, c ) => {
    var e = $a( a );
    for ( a = 0; a < e.length; a++ )
      e[a].addEventListener( b, a => c( a, e ) );
  };

  /**
   * Updates the ingame clock.
   */
  var updateTSOClock = () => {
    var a = new Date, b = a.getUTCMinutes(), c = a.getUTCSeconds(), d = 'AM', e = 0;
    1 == a.getUTCHours() % 2 && ( e = 3600, d = 'PM' );
    e = e + 60 * b + c;
    var f = Math.floor( e / 300 );
    12 < f && ( f -= 12 );
    0 == f && ( f = 12 );
    var g = Math.floor( e % 300 / 5 );
    10 > g && ( g = '0' + g );
    var h = $( '#simtime' );
    h && ( h.textContent = f + ':' + g + ' ' + d );
  }

  /**
   * Sets the electron version.
   * @param {string} v The version.
   */
  var setElectronVersion = v => $( '#electron-version' ).textContent = v;

  /**
   * Marks Simitone as installed.
   */
  var simitoneInstalled = () => $( '#simitone-page' )
    .classList.add( 'simitone-installed' );

  /**
   * Marks Simitone as not installed.
   */
  var simitoneNotInstalled = () => $( '#simitone-page' )
    .classList.remove( 'simitone-installed' );

  /**
   * Marks TS1 as installed.
   */
  var simsInstalled = () => $( '#simitone-page' )
    .classList.add( 'ts1cc-installed' );

  /**
   * Marks TS1 as not installed.
   */
  var simsNotInstalled = () => $( '#simitone-page' )
    .classList.remove( 'ts1cc-installed' );

  /**
   * Shows the Simitone updater.
   */
  var simitoneShouldUpdate = () => {
    $( '#simitone-page' ).classList.add( 'simitone-should-update' );
    $( '#simitone-update-version' ).textContent = simitoneSuggestedUpdate;
  }

  /**
   * Hides the Simitone updater.
   */
  var simitoneShouldntUpdate = () => $( '#simitone-page' )
    .classList.remove( 'simitone-should-update' );

  /**
   * @param {*} date 
   * @returns string
   */
  var ago = date => {
    var b = Math.floor( ( new Date - date ) / 1000 );
    return 5 > b ? 'just now' : 
      60 > b ? b + ' seconds ago' : 
      3600 > b ? ( date = Math.floor( b / 60 ), 
        1 < date ? date + ' minutes ago' : '1 minute ago' ) : 
      86400 > b ? ( date = Math.floor( b / 3600 ), 
        1 < date ? date + ' hours ago' : '1 hour ago' )  : 
      172800 > b ? ( date = Math.floor( b / 86400 ), 
        1 < date ? date + ' days ago' : '1 day ago' )  : 
      date.getDate().toString() + ' ' + 
        $( 'body' ).getAttribute( 'monthString' )
          .split( ' ' )[ date.getMonth() ] + ', ' + date.getFullYear();
  }

  /**
   * Changes the launcher theme.
   * @param {string} theme The theme id.
   */
  var setTheme = async ( theme, forced ) => {
    var date = new Date();
    var m = date.getMonth();
    var d = date.getDate(); 
    var y = date.getFullYear();

    if( ! forced ) {
      // Halloween theme activates in October.
      if ( ( m == 9 && d >= 15 && d <= 31 ) || ( m == 10 && d == 1 ) ) {
        theme = 'halloween';
      }

      // Summer 2021 theme.
      if ( y == 2021 && ( ( m == 8 && d >= 12 && d <= 31 ) || ( m == 9 && d >= 1 && d <= 10 ) ) ) {
        theme = 'summer2021';
      }
    }

    $( 'body' ).className = theme;

    try {
      await loadTwitter();
    } catch( terr ) {
      console.log( 'Error loading Twitter:', terr );
    }
  }

  /**
   * Creates a new toast.
   * @param {string} id      The toast id.
   * @param {string} message The toast body.
   */
  var toast = ( id, message ) => {
    var div = $c( 'div' );
        div.style.display = 'block';
        div.className = 'toast';
        div.id = id;
  
    var i = $c( 'i' );
        i.className = 'material-icons spin';
        i.innerHTML = 'loop';
  
    var span = $c( 'span' );
        span.className = 'toast-message';
        span.textContent = message;
  
    div.appendChild( i );
    div.appendChild( span );
  
    $( '#debug' ).appendChild( div );
  }

  /**
   * Removes a toast by id.
   * @param {string} id The toast id.
   */
  var removeToast = id => {
    var $toast = document.getElementById( id );
        $toast?.parentNode?.removeChild( $toast );
  }

  var spinDegrees = 0;

  /**
   * Obtains and displays blog articles from the official blog.
   */
  var fetchNews = async userRequested => {
    console.log( 'Fetching news...' );
    var $rssUrl     = $( 'body' ).getAttribute( 'rss' );
    var $didYouKnow = $( '#did-you-know' );
    var $rss        = $( '#rss' );
    var $spinner    = $( '#rss-loading' );

    var $homeRefreshBtn = $( '#refresh-home-button' );
    var $homeRefreshBtnIcon = $homeRefreshBtn.querySelector( 'i' );

    $homeRefreshBtn.setAttribute( 'disabled', true );
    $homeRefreshBtn.style.cursor = 'not-allowed';
    $didYouKnow.style.display = 'none';
    $rss.style.display = 'none';
    $spinner.style.display = 'block';

    if( userRequested ) {
      spinDegrees += 360;
      $homeRefreshBtnIcon.style.transform = `rotate(${spinDegrees}deg)`;
    }

    if( userRequested || !twitterHasAlreadyLoaded ) {
      try {
        await loadTwitter();
      } catch( terr ) {
        console.log( 'Error loading Twitter:', terr );
      }
    }

    var parseRss = ( errors, response ) => {
      if( ! errors ) {
        hasAlreadyLoaded = true;
      }

      // Short pause before displaying feed to allow display to render correctly.

      setTimeout( () => {
        $didYouKnow.style.display = 'block';
        $rss.style.display = 'block';
        $spinner.style.display    = 'none';
      }, 500 );

      $( '#rss .alt-content' ).style.display = errors ? 'block' : 'none';

      if( errors || ! response ) {
        return console.log( 'RSS Failed:', errors, response );
      }

      // Clear the rss container for the new articles.
      $( '#rss-root' ).innerHTML = '';
      console.log( response ? 'Articles received successfully.' : 'Failed to receive articles' );
      response?.items?.forEach( function( entry ) {
        var articleContainer = $c( 'div' ),
        articleTitle     = $c( 'h1' ),
        articleSpan      = $c( 'span' ),
        articleDiv       = $c( 'div' ),
        articleLink      = $c( 'a' );
        articleContainer.className = 'rss-entry';
        articleTitle.textContent = entry.title;
        articleSpan.textContent = entry.pubDate
          .replace( '+0000', '' )
          .slice( 0, -9 );
        articleDiv.className = 'rss-content';

        var articleContent = entry.content
          .replace( /\s{2,}/g, ' ' )
          .replace( /\n/g, '' );

        articleDiv.innerHTML = DOMPurify.sanitize( articleContent );
        articleLink.textContent = document
          .querySelector( 'body' )
          .getAttribute( 'readMoreString' );
        articleLink.className = 'button';
        articleLink.setAttribute( 'href', entry.link );
        articleLink.setAttribute( 'target', '_blank' );
        articleContainer.appendChild( articleTitle );
        articleContainer.appendChild( articleSpan );
        articleContainer.appendChild( articleDiv );
        articleContainer.appendChild( articleLink );

        $( '#rss-root' ).appendChild( articleContainer );
      } );
    };

    timeout( fetch( $rssUrl ) )
      .then( async response => {
        parser.parseString( await response.text(), parseRss );
      } )
      .catch( error => {
        console.error( 'An error ocurred getting news:', error );
        parseRss( error, null )
      } );

      // Re-enable refresh button after 3 seconds.
      setTimeout( () => { 
        $homeRefreshBtn.removeAttribute( 'disabled' ), 
        $homeRefreshBtn.style.cursor = 'pointer' 
      }, 3000 );
  }

  /**
   * Logic for full installer background slideshow.
   */

  const slideImageArray = [ "slide1.png", "slide2.png", "slide3.jpg" ]; // Array of slideshow images to be shown.
  const slideBasePath = "fsolauncher_images/slideshow/"; // Slideshow image location.
  const slideTransitionSecs = 6; // Transition speed in seconds. Should be longer than the transition time in fsolauncher.css to avoid skipping.
  const slideElement = document.getElementById( "full-install" );

  const slideSequence = () => {
    var k = 0;
    for ( i = 0; i < slideImageArray.length; i++ ) {
      setTimeout(() => {
        slideElement.style.background = "url(" + slideBasePath + slideImageArray[k] + ") no-repeat";
        slideElement.style.backgroundSize = "cover";
        if ( ( k + 1 ) === slideImageArray.length ) {
          if ( slideElement.style.display != 'none' ) { // Restart the slideshow only if the full-install page is visible.
            setTimeout( () => {
              slideSequence();
            }, ( slideTransitionSecs * 1000 ) );
          }

        } else {
          k++;
        }
      }, ( slideTransitionSecs * 1000 ) * i );
    }
  }


  /**
   * Show hints of `pageId`.
   * @param {string} pageId The page id.
   */
  var showHints = pageId => {
    for ( var hints = $a( '[hint-page]' ), i = 0; i < hints.length; i++ ) {
      hints[i].style.display = 'none';
    }
    var hintId = 'HINT_' + pageId;

    if( ! localStorage[hintId] ) {
      hints = $a( `[hint-page="${ pageId }"]` );
      for ( var j = 0; j < hints.length; j++ ) {
        hints[j].style.display = 'block';
        hints[j].addEventListener( 'click', e => {
          e.currentTarget.style.display = 'none';
        } );
      }
      localStorage.setItem( hintId, true );
    }
  }

  /**
   * Loads the twitter widget.
   */
  var loadTwitter = () => {
    console.log( 'Loading Twitter...' );
    return new Promise( ( resolve, reject ) => {
      $( '#did-you-know' ).innerHTML = '';
      var currentTheme = $( 'body' ).className;
      var twitterTheme = darkThemes.includes( currentTheme ) ? 'dark' : 'light';
      var $preloadElement = $c( 'a' );
        $preloadElement.className = 'twitter-timeline';
        $preloadElement.style = 'text-decoration:none;';
        $preloadElement.setAttribute( 'data-height', '490' );
        if( currentTheme != 'summer2021' ) {
          $preloadElement.setAttribute( 'data-chrome', 'transparent' );
        }
        $preloadElement.setAttribute( 'data-theme', twitterTheme );
        $preloadElement.setAttribute( 'href', $( 'body' ).getAttribute( 'twUrl' ) );
        $preloadElement.innerHTML = '@FreeSOGame on Twitter';
        $( '#did-you-know' ).append( $preloadElement );
      var $prevWidget = $( '#tw' );
      if( $prevWidget ) {
        $prevWidget.parentNode.removeChild( $prevWidget );
      }
      var $head = $( 'head' );
      var $script = $c( 'script' );
          $script.setAttribute( 'id', 'tw' );
          $script.src = 'https://platform.twitter.com/widgets.js';
          
      $script.addEventListener( 'load', () => {
        twitterHasAlreadyLoaded = true;
        resolve();
        // twttr.events.bind( 'rendered', resolve );
      } );
      $script.addEventListener( 'error', reject );
      $head.appendChild( $script );
      console.log( 'Twitter loaded successfully' );
    } );
  };

  /**
   * Sets the current page to `pageId`. 
   * @param {string} pageId The page id.
   */
  setCurrentPage = pageId => {
    if( pageId == 'simitone' ) {
      if( $( 'body' ).className != 'simitone' ) {
        prevTheme = $( 'body' ).className;
      }
      
      if( ! darkThemes.includes( prevTheme ) ) { // Stay in dark theme.
        setTheme( 'simitone', true );
      }
      
      sendToMain( 'CHECK_SIMITONE' );

      simitoneRequirementsCheckInterval && clearInterval( simitoneRequirementsCheckInterval );
      simitoneRequirementsCheckInterval = setInterval( 
        () => sendToMain( 'CHECK_SIMITONE' ), 60000 );
    } else {
      if( prevTheme ) {
        setTheme( prevTheme );
        prevTheme = null;
      }

      if( simitoneRequirementsCheckInterval ) {
        clearInterval( simitoneRequirementsCheckInterval );
        simitoneRequirementsCheckInterval = null;
      }
    }

    for( var menuItems = $a( 'li[page-trigger]' ), i = 0; i < menuItems.length; i++ ) {
      menuItems[i].classList.remove( 'active' );
    }

    $( `li[page-trigger="${pageId}"]` ).classList.add( 'active' );

    for( var pages = $a( 'div.page' ), j = pages.length - 1; 0 <= j; j-- ) {
      pages[j].style.display = 'none';
    }
    $( `#${pageId}-page` ).style.display = 'block';

    showHints( pageId );
  }

  /**
   * Restores configuration values into their respective option controls.
   * @param {array} vars Array of unserialized configuration variables. 
   */
  var restoreConfiguration = vars => {
    for( var Section in vars )
    for( var Item in vars[Section] ) {
      var $option = $( `[option-id="${Section}.${Item}"]` );
      if( platform == 'darwin' && Item == 'GraphicsMode' ) continue;
      $option && ( $option.value = vars[Section][Item] );
    }
  }

  /**
   * Creates or updates a full install progress item.
   * @param {string} title    The title.
   * @param {string} text1    The text 1.
   * @param {string} text2    The text 2.
   * @param {number} progress The progress percentage number.
   */
  var updateFullInstallProgressItem = ( title, text1, text2, _progress ) => {
    var $fullInstall = $( '#full-install' );
    if( title && text1 && text2 ) {
      var $title    = $( '#full-install-title' );
      var $text1    = $( '#full-install-text1' );
      var $text2    = $( '#full-install-text2' );
      var $progress = $( '#full-install-progress' );

      $title.textContent = title;
      $text1.textContent = text1;
      $text2.innerHTML = text2;
      $progress.style.width = '100%'; // Does not show real progress.
      $fullInstall.style.display = 'block';
    } else {
      $fullInstall.style.display = 'none';
    }
    slideSequence(); // Start the background slideshow.
  }

  /**
   * Creates a notification item in the notification log.
   * @param {string} title Notification title.
   * @param {string} body  Notification text.
   * @param {string} url   Notification url (optional).
   */
  var createNotificationItem = ( title, body, url ) => {
    $( '#notifications-page .alt-content' ).style.display = 'none';

    var id = Math.floor( Date.now() / 1000 );
    var notification = $c( 'div' );
        notification.className = 'notification';
        notification.setAttribute( 'data-url', url );
        notification.id = `FSONotification${id}`;

    var icon = $c( 'i' );
        icon.className = 'material-icons';
        icon.innerHTML = 'notifications_empty';

    var h1 = $c( 'h1' );
        h1.textContent = title;

    var span = $c( 'span' );
        span.innerHTML = new Date().toLocaleString();

    var p = $c( 'p' );
        p.textContent = DOMPurify.sanitize( body );

    if ( url ) {
      var btn = document.createElement( 'a' );
          btn.className = 'button material-icons';
          btn.target    = '_blank';
          btn.style     = 'float:right;margin-top:-15px;border-radius:50%';
          btn.innerHTML = 'link';
          btn.href      = url;
    }   

    notification.appendChild( icon );
    notification.appendChild( h1 );
    notification.appendChild( p );
    notification.appendChild( span );

    if ( url ) notification.appendChild( btn );

    var $logContainer = $( '#notifications-page .page-content' );
        $logContainer.innerHTML = notification.outerHTML + $logContainer.innerHTML;
  
    $( `#FSONotification${id} p` ).addEventListener( 'click', e => {
        shared.openExternal( e.target.getAttribute( 'data-url' ) );
      },
      false
    );
  }

  /**
   * Creates or modifies a progress item.
   * @param {string} elId         Progress item id.
   * @param {string} title        Progress item title.
   * @param {string} subtitle     Progress item span text.
   * @param {string} progressText Progress item info text.
   * @param {number} percentage   Progress item percentage.
   * @param {string} miniconsole  Miniconsole (deprecated, use null).
   */
  var createOrModifyProgressItem = ( elId, title, subtitle, progressText, percentage, miniconsole ) => {
    document.querySelector( '#downloads-page .alt-content' ).style.display = 'none';
    var d = document.getElementById( elId );
    if ( d )
      ( d.querySelector( 'h1' ).innerHTML = title ),
        ( d.querySelector( 'span' ).innerHTML = subtitle ),
        ( d.querySelector( '.info' ).innerHTML = progressText ),
        ( d.querySelector( '.progress' ).style.width = percentage + '%' ),
        miniconsole
          ? ( ( d.querySelector( '.loading' ).style.display = 'none' ),
            ( percentage = d.querySelector( '.miniconsole' ) ),
            ( percentage.innerHTML += miniconsole ),
            ( percentage.style.display = 'block' ),
            ( percentage.scrollTop = percentage.scrollHeight ) )
          : ( ( d.querySelector( '.loading' ).style.display = 'block' ),
            ( d.querySelector( '.miniconsole' ).style.display = 'none' ) );
    else {
      d = $c( 'div' );
      d.className = 'download';
      d.setAttribute( 'id', elId );

      elId = $c( 'h1' );
      elId.innerHTML = title;

      title = $c( 'span' );
      title.innerHTML = subtitle;

      subtitle = $c( 'div' );
      subtitle.className = 'info';
      subtitle.innerHTML = progressText;

      progressText = $c( 'div' );
      progressText.className = 'loading';

      var h = $c( 'div' );
          h.className = 'miniconsole';
      
          miniconsole
        ? ( ( progressText.style.display = 'none' ),
          ( h.innerHTML += miniconsole ),
          ( h.style.display = 'block' ),
          ( h.scrollTop = h.scrollHeight ) )
        : ( ( progressText.style.display = 'block' ), ( h.style.display = 'none' ) );

      miniconsole = $c( 'div' );
      miniconsole.className = 'progress';
      miniconsole.style.width = percentage + '%';
      progressText.appendChild( miniconsole );
      d.appendChild( elId );
      d.appendChild( title );
      d.appendChild( subtitle );
      d.appendChild( h );
      d.appendChild( progressText );

      $( '#downloads-page .page-content' ).innerHTML =
        d.outerHTML + $( '#downloads-page .page-content' ).innerHTML;
    }
  }

  /**
   * Creates a modal.
   * @param {string} title       The Modal window title.
   * @param {string} text        The main Modal text.
   * @param {string} yesText     The text for an affirmative button.
   * @param {string} noText      The text for a negative response button.
   * @param {string} modalRespId Unique Modal response ID if you want to receive the response in code.
   * @param {string} extra       Extra parameters.
   * @param {string} type        Modal type.
   */
  var yesNo = ( title, text, yesText, noText, modalRespId, extra, type ) => {
    yesNoAudio.play();

    var d = $c( 'div' );
        d.className = 'modal';

    if( type ) {
      d.className += ' modal-' + type;
    }

    var h = $c( 'h1' );
        h.innerHTML = title;

    d.appendChild( h );

    title = $c( 'p' );
    title.innerHTML = text;

    d.appendChild( title );
    text = $c( 'div' );

    title = $c( 'button' );
    title.innerHTML = yesText;
    title.addEventListener( 'click', function() {
      d.parentNode.removeChild( d );
  
      if ( $a( '.modal' ).length == 0 ) {
        $( '#overlay' ).style.display = 'none';
      }
  
      modalRespId && shared.send( modalRespId, !0, extra );
    } );
    text.appendChild( title );
    noText
      ? ( ( yesText = $c( 'span' ) ),
        ( yesText.innerHTML = noText ),
        yesText.addEventListener( 'click', function() {
          d.parentNode.removeChild( d );
          if ( $a( '.modal' ).length == 0 ) {
            $( '#overlay' ).style.display = 'none';
          }
          $( '#overlay' ).style.display = 'none';
          modalRespId && shared.send( modalRespId, !1, extra );
        } ),
        text.appendChild( yesText ) )
      : ( title.style.margin = '0px' );
    d.appendChild( text );
    $( '#launcher' ).appendChild( d );
    $( '#overlay' ).style.display = 'block';
  }

  /**
   * Events received from the main process.
   */
  // HAS_INTERNET
  onMessage( 'HAS_INTERNET', () => {
    console.log( 'HAS_INTERNET' );
    document.body.classList.remove( 'no-internet' );

    //if( ! hasAlreadyLoaded ) {
    //  fetchNews();
    //}
  } );
  // NO_INTERNET
  onMessage( 'NO_INTERNET', () => {
    console.log( 'NO_INTERNET' );
    document.body.classList.remove( 'no-internet' );
    document.body.classList.add( 'no-internet' );
    //hasAlreadyLoaded = false;
  } );
  // REMESH_INFO
  onMessage( 'REMESH_INFO', ( a, v ) => {
    $( '.new' ).style.display = 'none';
    if( ! v ) return;

    var i = parseInt( v );
    var f = ago( new Date( i * 1000 ) );
    var seconds = Math.floor( ( new Date() - new Date( i * 1000 ) ) / 1000 );

    if ( seconds < 172800 ) {
      if ( Math.floor( seconds / 86400 ) <= 1 ) {
        $( '.new' ).style.display = 'block';
      } else {
        $( '.new' ).style.display = 'none';
      }
    } else {
      $( '.new' ).style.display = 'none';
    }

    $( '#remeshinfo' ).style.display = 'block';
    $( '#remeshinfo' ).innerHTML =
      `<i style="vertical-align:middle;float:left;margin-right:5px" class="material-icons">access_time</i> 
      <span style="line-height:25px">${f}</span>`;
  } );
  // SIMITONE_SHOULD_UPDATE
  onMessage( 'SIMITONE_SHOULD_UPDATE', ( a, b ) => {
    if ( ! b ) {
      simitoneSuggestedUpdate = null;
      return simitoneShouldntUpdate();
    }
    simitoneSuggestedUpdate = b;
    simitoneShouldUpdate();
  } );
  onMessage( 'SIMITONE_SET_VER', ( a, b ) => {
    if( b ) {
      $( '#simitone-ver' ).textContent = `(Installed: ${b})`;
    } else {
      $( '#simitone-ver' ).textContent = "";
    }
  } );
  // SET_THEME
  onMessage( 'SET_THEME', ( a, themeId ) => setTheme( themeId ) );
  // SET_TIP
  onMessage( 'SET_TIP', ( a, tipText ) => {
    $( '#tip-text' ).innerHTML = DOMPurify.sanitize( tipText );
  } );
  // TOAST
  onMessage( 'TOAST', ( a, t, c ) => toast( t, c ) );
  // NOTIFLOG
  onMessage( 'NOTIFLOG', ( a, t, l, c ) => createNotificationItem( t, l, c ) );
  // REMOVE_TOAST
  onMessage( 'REMOVE_TOAST', ( a, t ) => removeToast( t ) );
  // POPUP
  onMessage( 'POPUP', ( a, b, c, e, f, g, d, h ) => yesNo( b, c, e, f, g, d, h ) );
  // RESTORE_CONFIGURATION
  onMessage( 'RESTORE_CONFIGURATION', ( a, b ) => restoreConfiguration( b ) );
  // CHANGE_PAGE
  onMessage( 'CHANGE_PAGE', ( a, b ) => setCurrentPage( b ) );
  // INSPROG
  onMessage( 'INSPROG', ( a, b ) => {
    if( ! b ) return;

    if ( b.FSO ) {
      $( '.item[install=FSO]' ).className = 'item installed';
    } else {
      $( '.item[install=FSO]' ).className = 'item';
    }
    if ( b.TSO ) {
      $( '.item[install=TSO]' ).className = 'item installed';
    } else {
      $( '.item[install=TSO]' ).className = 'item';
    }
    if ( b.NET ) {
      $( '.item[install=NET]' ).className = 'item installed';
    } else {
      $( '.item[install=NET]' ).className = 'item';
    }
    if ( b.OpenAL ) {
      $( '.item[install=OpenAL]' ).className = 'item installed';
    } else {
      $( '.item[install=OpenAL]' ).className = 'item';
    }
    if ( b.TS1 ) {
      simsInstalled();
    } else {
      simsNotInstalled();
    }
    if ( b.Simitone ) {
      simitoneInstalled();
    } else {
      simitoneNotInstalled();
    }
    if ( b.Mono ) {
      $( '.item[install=Mono]' ).className = 'item installed';
    } else {
      $( '.item[install=Mono]' ).className = 'item';
    }
    if ( b.SDL ) {
      $( '.item[install=SDL]' ).className = 'item installed';
    } else {
      $( '.item[install=SDL]' ).className = 'item';
    }
  } );
  // STOP_PROGRESS_ITEM
  onMessage( 'STOP_PROGRESS_ITEM', ( a, b ) => {
    var $progressItem = $( `#${b}` );
    if( $progressItem ) {
      $progressItem.className = 'download stopped';
    }
  } );
  // PLAY_SOUND
  onMessage( 'PLAY_SOUND', ( a, b ) => {
    var audio = new Howl( { src: `fsolauncher_sounds/${b}.wav`, volume: 0.4 } );
        audio.play();
  } );
  // CONSOLE_LOG
  onMessage( 'CONSOLE_LOG', ( a, b ) => console.log( b ) );
  // CREATE_PROGRESS_ITEM
  onMessage( 'CREATE_PROGRESS_ITEM', ( a, b, c, e, f, g, d ) => 
    createOrModifyProgressItem( b, c, e, f, g, d ) );
  // FULL_INSTALL_PROGRESS_ITEM
  onMessage( 'FULL_INSTALL_PROGRESS_ITEM', ( a, b, c, e, f ) => 
    updateFullInstallProgressItem( b, c, e, f ) );
  
  /**
   * Renderer HTML event listeners.
   */
  addEventListener( '.launch',                  'click',       () => sendToMain( 'PLAY' ) );
  addEventListener( '.launch',                  'contextmenu', () => sendToMain( 'PLAY', true ) );
  addEventListener( '#refresh-home-button',     'click',       () => fetchNews( true ) );
  addEventListener( '#simitone-play-button',    'click',       () => sendToMain( 'PLAY_SIMITONE' ) );
  addEventListener( '#simitone-play-button',    'contextmenu', () => sendToMain( 'PLAY_SIMITONE', true ) );
  addEventListener( '#full-install-button',     'click',       () => sendToMain( 'FULL_INSTALL' ) );
  addEventListener( '#update-check',            'click',       () => sendToMain( 'CHECK_UPDATES' ) );
  addEventListener( '#simitone-install-button', 'click',       () => sendToMain( 'INSTALL', 'Simitone' ) );
  addEventListener( '#simitone-should-update',  'click',       () => sendToMain( 'INSTALL_SIMITONE_UPDATE' ) );

  addEventListenerAll( '[option-id]', 'change', ( a, _b ) => {
    var c = a.currentTarget.getAttribute( 'option-id' ),
        e = a.currentTarget.value;

    'Launcher.Theme' === c && setTheme( e );
    c = c.split( '.' );
    sendToMain( 'SET_CONFIGURATION', [c[0], c[1], e] );
  } );
  addEventListenerAll( '[page-trigger]', 'click', ( a, _b ) => {
    pageTriggerAudio.play();
    setCurrentPage( a.currentTarget.getAttribute( 'page-trigger' ) );
  } );
  addEventListenerAll( '[install]', 'click', ( a, _b ) => 
    sendToMain( 'INSTALL', a.currentTarget.getAttribute( 'install' ) ) );

  init(); // Init client code.

} )();
