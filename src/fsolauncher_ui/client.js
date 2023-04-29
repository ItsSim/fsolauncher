/* global PUG_VARS */
/**
 * @param {string} q
 *
 * @returns {Element}
 */
const querySelector = q => document.querySelector( q );
/**
 * @param {string} q
 *
 * @returns {NodeListOf<Element>}
 */
const querySelectorAll = q => document.querySelectorAll( q );
/**
 * @param {string} q
 *
 * @returns {Element}
 */
const createElement = q => document.createElement( q );

// Add a hook to make all links open a new window.
window.DOMPurify.addHook( 'afterSanitizeAttributes', node => {
  // set all elements owning target to target=_blank.
  if ( 'target' in node ) { node.setAttribute( 'target', '_blank' ); }
  // set non-HTML/MathML links to xlink:show=new.
  if ( ! node.hasAttribute( 'target' ) &&
    ( node.hasAttribute( 'xlink:href' ) || node.hasAttribute( 'href' ) ) ) {
    node.setAttribute( 'xlink:show', 'new' );
  }
} );

const darkThemes = [ 'halloween', 'dark', 'indigo' ];

// Expose functions to the DOM
let navigateTo;
// eslint-disable-next-line no-unused-vars
let closeOneClickInstall;
// eslint-disable-next-line no-unused-vars
let ociPickFolder;
// eslint-disable-next-line no-unused-vars
let ociConfirm;

( () => {
  const socket = window.io( `https://${PUG_VARS.WS_URL}:${PUG_VARS.WS_PORT}` );

  const clickAudio = new window.Howl( { src: 'sounds/click.wav', volume: 0.4 } );
  const modalAudio = new window.Howl( { src: 'sounds/modal.wav', volume: 0.4 } );
  const okAudio    = new window.Howl( { src: 'sounds/ok.wav', volume: 0.4 } );

  const isDarwin  = querySelector( 'html' ).className.startsWith( 'darwin' );
  const isWindows = querySelector( 'html' ).className.startsWith( 'win32' );

  let twitterLoaded = false;
  let simitoneInterval;
  let simitoneUpdate;
  let prevTheme;

  function initClient() {
    send( 'INIT_DOM' );
    navigateTo( 'home' );
    fetchNews();
    setInterval( updateTSOClock, 1000 );
    setVersion( window.shared.electronVersion );
    socket.on(
      'receive global message',
      data => send( 'SOCKET_MESSAGE', [ data.Message, data.Url ]
      ) );
  }

  function send( id, param ) {
    window.shared.send( id, param );
  }
  function onMessage( id, callback ) {
    return window.shared.on( id, callback );
  }
  function timeout( promise, milliseconds = 5000 ) {
    return new Promise( ( resolve, reject ) => {
      setTimeout( () => {
        reject( 'Timeout exceeded' );
      }, milliseconds );
      promise.then( resolve, reject );
    } );
  }
  function addEventListener( a, b, c ) {
    a.tagName
      ? a.addEventListener( b, c )
      : querySelector( a ).addEventListener( b, c );
  }
  function addEventListenerAll( a, b, c ) {
    const e = querySelectorAll( a );
    for ( a = 0; a < e.length; a++ ) {
      e[ a ].addEventListener( b, a => c( a, e ) );
    }
  }
  function setVersion( v ) {
    return querySelector( '#electron-version' ).textContent = v;
  }
  function updateTSOClock() {
    const currentTime = new Date(),
      utcMinutes = currentTime.getUTCMinutes(),
      utcSeconds = currentTime.getUTCSeconds();
    let timePeriod = 'AM', totalSeconds = 0;
    if ( currentTime.getUTCHours() % 2 === 1 ) {
      totalSeconds = 3600;
      timePeriod = 'PM';
    }
    totalSeconds += utcMinutes * 60 + utcSeconds;
    let hour = Math.floor( totalSeconds / 300 );
    if ( hour > 12 ) {
      hour -= 12;
    }
    if ( hour === 0 ) {
      hour = 12;
    }
    let minute = Math.floor( totalSeconds % 300 / 5 );
    if ( minute < 10 ) {
      minute = '0' + minute;
    }
    const simTimeElement = querySelector( '#simtime' );
    if ( simTimeElement ) {
      simTimeElement.textContent = `${hour}:${minute} ${timePeriod}`;
    }
  }

  const simitonePage = querySelector( '#simitone-page' );

  function simitoneInstalled() {
    simitonePage.classList.add( 'simitone-installed' );
  }
  function simitoneNotInstalled() {
    simitonePage.classList.remove( 'simitone-installed' );
  }
  function simsInstalled() {
    simitonePage.classList.add( 'ts1cc-installed' );
  }
  function simsNotInstalled() {
    simitonePage.classList.remove( 'ts1cc-installed' );
  }
  function simitoneShouldUpdate() {
    simitonePage.classList.add( 'simitone-should-update' );
    querySelector( '#simitone-update-version' ).textContent = simitoneUpdate;
  }
  function simitoneShouldntUpdate() {
    simitonePage.classList.remove( 'simitone-should-update' );
  }

  /**
   * Returns the date as x time ago.
   *
   * @param {Date} date
   */
  function ago( date ) {
    const b = Math.floor( ( new Date() - date ) / 1000 );
    if ( 5 > b ) {
      return 'just now';
    } else if ( 60 > b ) {
      return b + ' seconds ago';
    } else if ( 3600 > b ) {
      date = Math.floor( b / 60 );
      return ( 1 < date ) ? date + ' minutes ago' : '1 minute ago';
    } else if ( 86400 > b ) {
      date = Math.floor( b / 3600 );
      return ( 1 < date ) ? date + ' hours ago' : '1 hour ago';
    } else if ( 172800 > b ) {
      date = Math.floor( b / 86400 );
      return ( 1 < date ) ? date + ' days ago' : '1 day ago';
    } else {
      return date.getDate().toString() + ' ' +
        PUG_VARS.STRINGS.MONTHS.split( ' ' )[ date.getMonth() ] + ', ' +
        date.getFullYear();
    }
  }

  /**
   * @param {string} theme The theme id.
   * @param {boolean} forced If forced to change.
   */
  async function setTheme( theme, forced ) {
    const date = new Date();
    const m = date.getMonth();
    const d = date.getDate();
    if ( ! forced ) {
      // Halloween theme activates in October.
      if ( ( m == 9 && d >= 15 && d <= 31 ) || ( m == 10 && d == 1 ) ) {
        theme = 'halloween';
      }
    }
    querySelector( 'body' ).className = theme;

    try {
      await loadTwitter();
    } catch ( terr ) {
      console.error( 'error loading twitter', terr );
    }
  }

  /**
   * @param {string} id The toast id.
   * @param {string} message The toast body.
   */
  function toast( id, message ) {
    // remove previous toast if it exists
    removeToast( id );

    const template = document.querySelector( '#toast-template' );
    const node = document.importNode( template.content, true );

    node.querySelector( '.toast' ).id = id;
    node.querySelector( '.toast-message' ).textContent = message;
    node.querySelector( '.toast' ).style.display = 'block';

    document.querySelector( '#debug' ).appendChild( node );
  }

  /**
   * @param {string} id The toast id.
   */
  function removeToast( id ) {
    const toast = document.getElementById( id );
    toast?.parentNode?.removeChild( toast );
  }

  let spinDegrees = 0;

  /**
   * @param {boolean} userRequested
   */
  async function fetchNews( userRequested ) {
    const rssUrl = PUG_VARS.RSS_URL;
    const didYouKnow = querySelector( '#did-you-know' );
    const rss = querySelector( '#rss' );
    const spinner = querySelector( '#rss-loading' );
    const homeRefreshBtn = querySelector( '#refresh-home-button' );
    const homeRefreshBtnIcon = homeRefreshBtn.querySelector( 'i' );

    homeRefreshBtn.setAttribute( 'disabled', true );
    homeRefreshBtn.style.cursor = 'not-allowed';
    didYouKnow.style.display = 'none';
    rss.style.display = 'none';
    spinner.style.display = 'block';

    if ( userRequested ) {
      spinDegrees += 360;
      homeRefreshBtnIcon.style.transform = `rotate(${spinDegrees}deg)`;
    }
    if ( userRequested || ! twitterLoaded ) {
      try {
        await loadTwitter();
      } catch ( terr ) {
        console.error( 'error loading twitter', terr );
      }
    }
    function parseRss( errors, response ) {
      // Short pause before displaying feed to allow display to render
      // correctly.
      setTimeout( () => {
        didYouKnow.style.display = 'block';
        rss.style.display = 'block';
        spinner.style.display = 'none';
      }, 500 );

      querySelector( '#rss .alt-content' ).style.display = errors ? 'block' : 'none';

      if ( errors || ! response ) {
        return console.error( 'rss feed failed', { errors, response } );
      }
      // Clear the rss container for the new articles.
      querySelector( '#rss-root' ).innerHTML = '';

      response?.items?.forEach( function ( entry ) {
        // Get the article template from the DOM
        const articleTemplate = querySelector( '#article-template' );
        const articleElement  = document.importNode( articleTemplate.content, true );

        // Set the content for the article element
        articleElement.querySelector( '.article-title' ).textContent = entry.title;
        articleElement.querySelector( '.article-pubDate' ).textContent = entry.pubDate
          .replace( '+0000', '' )
          .slice( 0, -9 );
        articleElement.querySelector( '.article-link' ).setAttribute( 'href', entry.link );

        const articleContent = entry.content
          .replace( /\s{2,}/g, ' ' )
          .replace( /\n/g, '' );

        articleElement.querySelector( '.rss-content' )
          .innerHTML = window.DOMPurify.sanitize( articleContent );

        // Append the article element to the DOM
        querySelector( '#rss-root' ).appendChild( articleElement );
      } );
    }

    timeout( fetch( rssUrl ) )
      .then( async ( response ) => {
        ( new window.RSSParser() )
          .parseString( await response.text(), parseRss );
      } )
      .catch( error => {
        console.error( 'rss fetch failed', error );
        parseRss( error, null );
      } );

    // Re-enable refresh button after 3 seconds.
    setTimeout( () => {
      homeRefreshBtn.removeAttribute( 'disabled' );
      homeRefreshBtn.style.cursor = 'pointer';
    }, 3000 );
  }

  /**
   * @param {string} pageId The page id to show hints of.
   */
  function showHints( pageId ) {
    const hints = querySelectorAll( '[hint-page]' );
    for ( let i = 0; i < hints.length; i++ ) {
      hints[ i ].style.display = 'none';
    }
    const hintId = 'HINT_' + pageId;
    if ( ! localStorage[ hintId ] ) {
      const hints = querySelectorAll( `[hint-page="${pageId}"]` );
      for ( let j = 0; j < hints.length; j++ ) {
        hints[ j ].style.display = 'block';
        hints[ j ].addEventListener( 'click', e => {
          e.currentTarget.style.display = 'none';
        } );
      }
      localStorage.setItem( hintId, true );
    }
  }

  function loadTwitter() {
    return new Promise( ( resolve, reject ) => {
      querySelector( '#did-you-know' ).innerHTML = '';
      const currentTheme = querySelector( 'body' ).className,
        twitterTheme = darkThemes.includes( currentTheme ) ? 'dark' : 'light',
        twAnchor = createElement( 'a' );

      twAnchor.className = 'twitter-timeline';
      twAnchor.style = 'text-decoration:none;';
      twAnchor.setAttribute( 'data-height', '490' );
      twAnchor.setAttribute( 'data-theme', twitterTheme );
      twAnchor.setAttribute( 'data-chrome', 'transparent' );
      twAnchor.setAttribute( 'href', PUG_VARS.TW_URL );
      twAnchor.innerHTML = '@FreeSOGame on Twitter';

      querySelector( '#did-you-know' ).append( twAnchor );

      const prevWidget = querySelector( '#tw' );
      if ( prevWidget ) {
        prevWidget.parentNode.removeChild( prevWidget );
      }
      const head = querySelector( 'head' );
      const script = createElement( 'script' );
      script.setAttribute( 'id', 'tw' );
      script.src = 'https://platform.twitter.com/widgets.js';
      script.addEventListener( 'load', () => {
        twitterLoaded = true;
        resolve();
      } );
      script.addEventListener( 'error', reject );
      head.appendChild( script );
    } );
  }

  /**
   * @param {string} pageId The page id.
   */
  navigateTo = pageId => {
    if ( pageId == 'simitone' ) {
      if ( querySelector( 'body' ).className != 'simitone' ) {
        prevTheme = querySelector( 'body' ).className;
      }
      if ( ! darkThemes.includes( prevTheme ) ) { // Stay in dark theme.
        setTheme( 'simitone', true );
      }
      send( 'CHECK_SIMITONE' );

      simitoneInterval && clearInterval( simitoneInterval );
      simitoneInterval = setInterval( () => send( 'CHECK_SIMITONE' ), 60000 );
    } else {
      if ( prevTheme ) {
        setTheme( prevTheme );
        prevTheme = null;
      }
      if ( simitoneInterval ) {
        clearInterval( simitoneInterval );
        simitoneInterval = null;
      }
    }
    const menuItems = querySelectorAll( 'li[page-trigger]' );
    for ( let i = 0; i < menuItems.length; i++ ) {
      menuItems[ i ].classList.remove( 'active' );
    }
    querySelector( `li[page-trigger="${pageId}"]` )
      .classList.add( 'active' );

    const pages = querySelectorAll( 'div.page' );
    for ( let j = pages.length - 1; 0 <= j; j-- ) {
      pages[ j ].style.display = 'none';
    }
    querySelector( `#${pageId}-page` ).style.display = 'block';

    showHints( pageId );
  };

  /**
   * @param {array} vars Array of unserialized configuration variables.
   */
  function restoreConfiguration( vars ) {
    for ( const section in vars )
      for ( const item in vars[ section ] ) {
        const option = querySelector( `[option-id="${section}.${item}"]` );
        if ( isDarwin && item == 'GraphicsMode' )
          continue;
        option && ( option.value = vars[ section ][ item ] );
      }
  }

  /**
   * Creates or updates a full install progress item.
   *
   * @param {string} title    The title.
   * @param {string} text1    The text 1.
   * @param {string} text2    The text 2.
   * @param {number} progress The progress percentage number.
   */
  function fullInstallProgress( title, text1, text2, _progress ) {
    if ( ! ( title && text1 && text2 ) ) {
      return querySelector( '#full-install' ).style.display = 'none';
    }
    querySelector( '#full-install-title' ).textContent = title;
    querySelector( '#full-install-text1' ).textContent = text1;
    querySelector( '#full-install-text2' ).innerHTML = text2;
    querySelector( '#full-install-progress' ).style.width  = '100%';
    querySelector( '#full-install' ).style.display = 'block';
  }

  /**
   * Creates a notification item in the notification log.
   *
   * @param {string} title Notification title.
   * @param {string} body  Notification text.
   * @param {string} url   Notification url (optional).
   */
  function createNotification( title, body, url ) {
    querySelector( '#notifications-page .alt-content' ).style.display = 'none';

    const id = Math.floor( Date.now() / 1000 );
    const notificationElement = createNotificationElement( title, body, url );
    notificationElement.querySelector( '.notification' ).id = `FSONotification${id}`;

    const pageContent = querySelector( '#notifications-page .page-content' );
    pageContent.prepend( notificationElement );

    querySelector( `#FSONotification${id} .notification-body` )
      .addEventListener( 'click', ( _e ) => {
        if ( url ) {
          window.open( url, '_blank' );
        }
      }, false );
  }

  function createNotificationElement( title, body, url ) {
    const template = querySelector( '#notification-template' );
    const notification = document.importNode( template.content, true );

    notification.querySelector( '.notification-title' )
      .textContent = title;
    notification.querySelector( '.notification-body' )
      .innerHTML = window.DOMPurify.sanitize( body );
    notification.querySelector( '.notification-time' )
      .textContent = new Date().toLocaleString();

    const notificationLink = notification.querySelector( '.notification-link' );
    if ( url ) {
      notificationLink.href = url;
    } else {
      notificationLink.remove();
    }

    return notification;
  }

  /**
   * @param {string} elId
   * @param {string} title
   * @param {string} subtitle
   * @param {string} progressText
   * @param {number} percentage
   */
  function createOrModifyProgressItem( elId, title, subtitle, progressText, percentage ) {
    document.querySelector( '#downloads-page .alt-content' ).style.display = 'none';
    let progressItem = document.getElementById( elId );

    if ( ! progressItem ) {
      const progressItemElement = ( elId => {
        const template = document.querySelector( '#progress-item-template' );
        const progressItem = document.importNode( template.content, true );
        progressItem.querySelector( '.download' ).id = elId;
        return progressItem;
      } )( elId );
      progressItem = progressItemElement.querySelector( '.download' );
      document.querySelector( '#downloads-page .page-content' )
        .insertAdjacentElement( 'afterbegin', progressItem );
    }
    progressItem.querySelector( '.progress' ).style.width = percentage + '%';
    progressItem.querySelector( '.progress-title' ).innerHTML = title;
    progressItem.querySelector( '.progress-subtitle' ).innerHTML = subtitle;
    progressItem.querySelector( '.progress-info' ).innerHTML = progressText;
    progressItem.querySelector( '.loading' ).style.display = 'block';
  }

  /**
   * @param {string} title       The Modal window title.
   * @param {string} text        The main Modal text.
   * @param {string} yesText     The text for an affirmative button.
   * @param {string} noText      The text for a negative response button.
   * @param {string} modalRespId Unique Modal response ID if you want to receive the response in code.
   * @param {string} extra       Extra parameters.
   * @param {string} type        Modal type (success/error/empty)
   */
  function yesNo( title, text, yesText, noText, modalRespId, extra, type ) {
    if ( type == 'success' ) {
      okAudio.play();
    } else {
      modalAudio.play();
    }
    if ( modalRespId == 'FULL_INSTALL_CONFIRM' && isWindows ) {
      return openOneClickInstall(); // Has its custom modal
    }
    const modalElement = createYesNoModalElement( title, text, yesText, noText, type );
    const modalDiv  = modalElement.querySelector( '.modal' );
    const yesButton = modalElement.querySelector( '.yes-button' );
    const noButton  = modalElement.querySelector( '.no-button' );

    yesButton.addEventListener( 'click', function () {
      closeModal( modalDiv );
      modalRespId && window.shared.send( modalRespId, ! 0, extra );
    } );
    if ( noText ) {
      noButton.addEventListener( 'click', function () {
        closeModal( modalDiv );
        modalRespId && window.shared.send( modalRespId, ! 1, extra );
      } );
    }
    querySelector( '#launcher' ).appendChild( modalElement );
    showModal( modalDiv );
  }

  function createYesNoModalElement( title, text, yesText, noText, type ) {
    const modalTemplate = querySelector( '#yes-no-modal-template' );
    const modalElement  = document.importNode( modalTemplate.content, true );

    modalElement.querySelector( '.modal-header' ).innerHTML = title;
    modalElement.querySelector( '.modal-text' ).innerHTML = text;
    modalElement.querySelector( '.yes-button' ).innerHTML = yesText;
    if ( type ) {
      modalElement.querySelector( '.modal' ).classList.add( `modal-${type}` );
    }
    if ( noText ) {
      modalElement.querySelector( '.no-button' ).innerHTML = noText;
    } else {
      modalElement.querySelector( '.no-button' ).remove();
      modalElement.querySelector( '.yes-button' ).style.margin = '0px';
    }
    return modalElement;
  }

  function clearInstallerHints() {
    const hints = querySelectorAll( '[hint-page="installer"]' );
    for ( let j = 0; j < hints.length; j++ ) {
      hints[ j ].style.display = 'none';
    }
  }

  function clearModals() {
    const modals = querySelectorAll( '.overlay-closeable' );
    for ( let j = 0; j < modals.length; j++ ) {
      closeModal( modals[ j ] );
    }
  }

  function closeModal( element ) {
    if ( element.classList.contains( 'modal' ) ) {
      element.parentNode.removeChild( element );
    } else {
      element.style.display = 'none';
    }
    hideOverlay();
  }

  function showModal( element ) {
    if ( ! element.classList.contains( 'modal' ) ) {
      element.style.display = 'block';
    }
    showOverlay();
  }

  function hideOverlay() {
    const overlayUsing = querySelectorAll( '.overlay-closeable' );
    if ( overlayUsing.length === 0 || ( ! Array.from( overlayUsing ).some( isVisible ) ) ) {
      querySelector( '#overlay' ).style.display = 'none';
    }
  }
  function showOverlay() {
    querySelector( '#overlay' ).style.display = 'block';
  }

  let ociFolder;

  function openOneClickInstall() {
    const oci = querySelector( '.oneclick-install' );
    oci.classList.remove( 'oneclick-install-selected' );
    showModal( oci );
  }

  closeOneClickInstall = () => {
    closeModal( querySelector( '.oneclick-install' ) );
  };

  ociPickFolder = () => {
    send( 'OCI_PICK_FOLDER' );
  };

  ociConfirm = e => {
    e.stopPropagation();
    if ( ociFolder ) {
      send( 'FULL_INSTALL_CONFIRM', ociFolder );
      closeModal( querySelector( '.oneclick-install' ) );
    }
  };

  function ociPickedFolder( folder ) {
    ociFolder = folder;
    const oci = querySelector( '.oneclick-install' );
    const ociFolderElement = querySelector( '.oneclick-install-folder' );
    oci.classList.add( 'oneclick-install-selected' );
    ociFolderElement.innerHTML = folder;
    ociFolder = folder;
  }

  function isVisible( element ) {
    const style = window.getComputedStyle( element );
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  function filterHz( value, minValue, maxValue ) {
    if ( parseInt( value ) < minValue ) {
      return minValue;
    } else if ( parseInt( value ) > maxValue ) {
      return maxValue;
    }
    return value;
  }

  // Events received from the main process.
  // HAS_INTERNET
  onMessage( 'HAS_INTERNET', () => {
    document.body.classList.remove( 'no-internet' );
  } );
  // NO_INTERNET
  onMessage( 'NO_INTERNET', () => {
    document.body.classList.remove( 'no-internet' );
    document.body.classList.add( 'no-internet' );
  } );
  // REMESH_INFO
  onMessage( 'REMESH_INFO', ( a, v ) => {
    querySelector( '.new' ).style.display = 'none';
    if ( ! v ) return;

    const i = parseInt( v );
    const f = ago( new Date( i * 1000 ) );
    const seconds = Math.floor( ( new Date() - new Date( i * 1000 ) ) / 1000 );

    if ( seconds < 172800 ) {
      if ( Math.floor( seconds / 86400 ) <= 1 ) {
        querySelector( '.new' ).style.display = 'block';
      } else {
        querySelector( '.new' ).style.display = 'none';
      }
    } else {
      querySelector( '.new' ).style.display = 'none';
    }

    querySelector( '#remeshinfo' ).style.display = 'block';
    querySelector( '#remeshinfo' ).innerHTML =
      `<i 
        style="vertical-align:middle; float:left; margin-right:5px" 
        class="material-icons"
        >access_time</i> 
      <span style="line-height:25px">${f}</span>`;
  } );
  // OCI_PICKED_FOLDER
  onMessage( 'OCI_PICKED_FOLDER', ( a, folder ) => {
    if ( ! folder ) return;
    ociPickedFolder( folder );
  } );
  // SIMITONE_SHOULD_UPDATE
  onMessage( 'SIMITONE_SHOULD_UPDATE', ( a, b ) => {
    if ( ! b ) {
      simitoneUpdate = null;
      return simitoneShouldntUpdate();
    }
    simitoneUpdate = b;
    simitoneShouldUpdate();
  } );
  onMessage( 'SIMITONE_SET_VER', ( a, b ) => {
    if ( b ) {
      querySelector( '#simitone-ver' ).textContent = `(Installed: ${b})`;
    } else {
      querySelector( '#simitone-ver' ).textContent = '';
    }
  } );
  // SET_THEME
  onMessage( 'SET_THEME', ( a, themeId ) => setTheme( themeId ) );
  // SET_TIP
  onMessage( 'SET_TIP', ( a, tipText ) => {
    querySelector( '#tip-text' ).innerHTML = window.DOMPurify.sanitize( tipText );
  } );
  // TOAST
  onMessage( 'TOAST', ( a, t, c ) => toast( t, c ) );
  // NOTIFLOG
  onMessage( 'NOTIFLOG', ( a, t, l, c ) => createNotification( t, l, c ) );
  // REMOVE_TOAST
  onMessage( 'REMOVE_TOAST', ( a, t ) => removeToast( t ) );
  // POPUP
  onMessage( 'POPUP', ( a, b, c, e, f, g, d, h ) => yesNo( b, c, e, f, g, d, h ) );
  // RESTORE_CONFIGURATION
  onMessage( 'RESTORE_CONFIGURATION', ( a, b ) => restoreConfiguration( b ) );
  // CHANGE_PAGE
  onMessage( 'CHANGE_PAGE', ( a, b ) => navigateTo( b ) );
  // INSPROG
  onMessage( 'INSPROG', ( a, b ) => {
    if ( ! b ) return;

    if ( b.FSO ) {
      querySelector( '.item[install=FSO]' ).className = 'item installed';
    } else {
      querySelector( '.item[install=FSO]' ).className = 'item';
    }
    if ( b.TSO ) {
      querySelector( '.item[install=TSO]' ).className = 'item installed';
    } else {
      querySelector( '.item[install=TSO]' ).className = 'item';
    }
    if ( b.NET ) {
      querySelector( '.item[install=NET]' ).className = 'item installed';
    } else {
      querySelector( '.item[install=NET]' ).className = 'item';
    }
    if ( b.OpenAL ) {
      querySelector( '.item[install=OpenAL]' ).className = 'item installed';
    } else {
      querySelector( '.item[install=OpenAL]' ).className = 'item';
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
      querySelector( '.item[install=Mono]' ).className = 'item installed';
    } else {
      querySelector( '.item[install=Mono]' ).className = 'item';
    }
    if ( b.SDL ) {
      querySelector( '.item[install=SDL]' ).className = 'item installed';
    } else {
      querySelector( '.item[install=SDL]' ).className = 'item';
    }
  } );
  // STOP_PROGRESS_ITEM
  onMessage( 'STOP_PROGRESS_ITEM', ( a, b ) => {
    const item = querySelector( `#${b}` );
    if ( item ) {
      item.className = 'download stopped';
    }
  } );
  // PLAY_SOUND
  onMessage( 'PLAY_SOUND', ( a, b ) => {
    const audio = new window.Howl( { src: `sounds/${b}.wav`, volume: 0.4 } );
    audio.play();
  } );
  // CONSOLE_LOG
  onMessage( 'CONSOLE_LOG', ( a, b ) => console.log( b ) );
  // CREATE_PROGRESS_ITEM
  onMessage( 'CREATE_PROGRESS_ITEM', ( a, b, c, e, f, g, d ) =>
    createOrModifyProgressItem( b, c, e, f, g, d ) );
  // FULL_INSTALL_PROGRESS_ITEM
  onMessage( 'FULL_INSTALL_PROGRESS_ITEM', ( a, b, c, e, f ) =>
    fullInstallProgress( b, c, e, f ) );
  // MAX_REFRESH_RATE
  onMessage( 'MAX_REFRESH_RATE', ( a, rate ) => {
    if ( rate ) {
      querySelector( '[option-id="Game.RefreshRate"]' )
        .setAttribute( 'max', rate );
    }
  } );

  // Renderer HTML event listeners.
  addEventListener( '.launch',                  'click',       () => send( 'PLAY' ) );
  addEventListener( '.launch',                  'contextmenu', () => send( 'PLAY', true ) );
  addEventListener( '#refresh-home-button',     'click',       () => fetchNews( true ) );
  addEventListener( '#simitone-play-button',    'click',       () => send( 'PLAY_SIMITONE' ) );
  addEventListener( '#simitone-play-button',    'contextmenu', () => send( 'PLAY_SIMITONE', true ) );
  addEventListener( '#full-install-button',     'click',       () => send( 'FULL_INSTALL' ) );
  addEventListener( '#full-install-button',     'click',       () => clearInstallerHints() );
  addEventListener( '#update-check',            'click',       () => send( 'CHECK_UPDATES' ) );
  addEventListener( '#simitone-install-button', 'click',       () => send( 'INSTALL', 'Simitone' ) );
  addEventListener( '#simitone-should-update',  'click',       () => send( 'INSTALL_SIMITONE_UPDATE' ) );
  addEventListener( '#overlay',                 'click',       () => clearModals() );

  addEventListenerAll( '[option-id]', 'change', ( event, _b ) => {
    const currentTarget = event.currentTarget;
    const optionId = currentTarget.getAttribute( 'option-id' );
    let inputValue = currentTarget.value;

    if ( optionId === 'Launcher.Theme' ) {
      setTheme( inputValue );
    }
    if ( optionId === 'Game.RefreshRate' ) {
      const min = currentTarget.getAttribute( 'min' );
      const max = currentTarget.getAttribute( 'max' );
      if ( ! inputValue ) {
        inputValue = currentTarget.value = max;
      } else {
        const hz = filterHz( inputValue, min, max );
        if ( hz != inputValue ) {
          inputValue = currentTarget.value = hz;
        }
      }
    }
    const optionPath = optionId.split( '.' );

    send( 'SET_CONFIGURATION', [ optionPath[ 0 ], optionPath[ 1 ], inputValue ] );
  } );
  addEventListenerAll( '[page-trigger]', 'click', ( a, _b ) => {
    clickAudio.play();
    navigateTo( a.currentTarget.getAttribute( 'page-trigger' ) );
  } );
  addEventListenerAll( '[install]', 'click', ( a, _b ) =>
    send( 'INSTALL', a.currentTarget.getAttribute( 'install' ) ) );

  initClient();
} )();
