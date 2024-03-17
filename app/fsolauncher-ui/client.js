// Add a hook to make all links open a new window.
window.DOMPurify.addHook( 'afterSanitizeAttributes', node => {
  // set all elements owning target to target=_blank.
  if ( 'target' in node ) node.setAttribute( 'target', '_blank' );
  // set non-HTML/MathML links to xlink:show=new.
  if ( ! node.hasAttribute( 'target' ) &&
    ( node.hasAttribute( 'xlink:href' ) || node.hasAttribute( 'href' ) ) ) {
    node.setAttribute( 'xlink:show', 'new' );
  }
} );

// Expose functions to the DOM
let navigateTo;
// eslint-disable-next-line no-unused-vars
let closeOneClickInstall;
// eslint-disable-next-line no-unused-vars
let ociPickFolder;
// eslint-disable-next-line no-unused-vars
let ociConfirm;

( () => {
  const socket = window.io( 'https://beta.freeso.org', {
    path: '/LauncherResourceCentral/ws',
    reconnectionAttempts: 8,
    reconnectionDelay: 2000
  } );

  const clickAudio = new window.Howl( { src: 'sounds/click.wav', volume: 0.4 } );
  const modalAudio = new window.Howl( { src: 'sounds/modal.wav', volume: 0.4 } );
  const okAudio    = new window.Howl( { src: 'sounds/ok.wav', volume: 0.4 } );

  const isDarwin  = document.querySelector( 'html' ).className.startsWith( 'darwin' );
  const isWindows = document.querySelector( 'html' ).className.startsWith( 'win32' );

  let simitoneInterval;
  let simitoneUpdate;
  let prevTheme;
  let totalUnreadProgressItems = 0;

  function run() {
    // Let the main process know the DOM is ready
    sendMessage( 'INIT_DOM' );
    // Start at the homepage
    navigateTo( 'home' );
    // Start the TSO clock
    updateTSOClock();
    setInterval( updateTSOClock, 1000 );
    // Fetch initial RSS feed and trending lots
    fetchWidgetData();
    // Listen for global messages
    socket.on( 'receive global message', data => handleSocketMessage( data ) );
  }

  function handleSocketMessage( data ) {
    sendMessage( 'SOCKET_MESSAGE', [ data.Message, data.Url ] );
  }
  function sendMessage( id, ...params ) {
    window.shared.send( id, ...params );
  }
  function onMessage( id, callback ) {
    return window.shared.on( id, callback );
  }
  function addEventListener( s, eventType, callback ) {
    s = s.tagName ? s : document.querySelector( s );
    if ( eventType === 'click' ) {
      s.setAttribute( 'role', 'button' );
      s.setAttribute( 'tabindex', '0' );
      s.addEventListener( 'keydown', e => e.key === 'Enter' || e.key === ' ' ? callback( e ) : null );
    }
    s.addEventListener( eventType, callback );
  }

  function addEventListenerAll( s, eventType, callback ) {
    document.querySelectorAll( s ).forEach( element => {
      if ( eventType === 'click' ) {
        element.setAttribute( 'role', 'button' );
        element.setAttribute( 'tabindex', '0' );
        element.addEventListener( 'keydown', e => e.key === 'Enter' || e.key === ' ' ? callback( e, element ) : null );
      }
      element.addEventListener( eventType, e => callback( e, element ) );
    } );
  }

  function getCurrentPage() {
    return document.querySelector( '[page-trigger].active' ).getAttribute( 'page-trigger' );
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
    const simTimeElement = document.querySelector( '#simtime' );
    if ( simTimeElement ) {
      simTimeElement.textContent = `${hour}:${minute} ${timePeriod}`;
    }
  }

  const simitonePage = document.querySelector( '#simitone-page' );

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
    document.querySelector( '#simitone-update-version' ).textContent = simitoneUpdate;
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
        window.PUG_VARS.STRINGS.MONTHS.split( ' ' )[ date.getMonth() ] + ', ' +
        date.getFullYear();
    }
  }

  /**
   * @param {string} theme The theme id.
   */
  function isDarkMode( theme ) {
    return window.PUG_VARS.DARK_THEMES.includes( theme );
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
      if ( getCurrentPage() === 'simitone' && ! isDarkMode( theme ) ) {
        theme = 'simitone';
      }
    }
    document.querySelector( 'body' ).className = theme;
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

  async function fetchTrendingLots() {
    try {
      // Use async/await instead of Promise.then() for cleaner syntax
      const response = await fetch( 'https://beta.freeso.org/LauncherResourceCentral/TrendingLots' );
      const data = await response.json();

      // Directly accessing elements
      const avatarsOnlineElement = document.querySelector( '#now-trending .top span i' );
      const container = document.querySelector( '#now-trending ul' );

      // Update avatars online count
      avatarsOnlineElement.textContent = data.avatarsOnline;

      // Clear existing lots
      container.innerHTML = '';

      // Iterating over lots to update the DOM
      data.lots.forEach( lot => {
        const lotTemplate = document.querySelector( '#now-trending-item-template' );
        const lotElement = document.importNode( lotTemplate.content, true );

        // Setting lot details
        lotElement.querySelector( '.lot-name' ).textContent = lot.name;
        lotElement.querySelector( '.owner span' ).textContent = lot.ownerDetails.name;
        lotElement.querySelector( '.players .count' ).textContent = lot.avatars_in_lot;
        lotElement.querySelector( '.icon img.lot' ).src = 'data:image/png;base64,' + lot.base64Image;
        lotElement.querySelector( '.icon .avatar' ).style.backgroundImage = 'url(data:image/png;base64,' + lot.ownerDetails.base64Image + ')';

        // Handling trending status
        if ( lot.is_trending ) {
          lotElement.querySelector( 'li' ).classList.add( 'hot' );
        } else {
          lotElement.querySelector( 'li' ).classList.remove( 'hot' );
        }

        // Adding the lot to the DOM
        container.appendChild( lotElement );
      } );

    } catch ( err ) {
      // Error handling
      console.log( 'Error while fetching lots:', err );
    }
  }

  let spinDegrees = 0;

  /**
   * @param {boolean} userRequested
   */
  async function fetchWidgetData( userRequested ) {
    const rssUrl = window.PUG_VARS.RSS_URL;
    const didYouKnow = document.querySelector( '#did-you-know' );
    const rss = document.querySelector( '#rss' );
    const spinner = document.querySelector( '#rss-loading' );
    const homeRefreshBtn = document.querySelector( '#refresh-home-button' );
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

    fetchTrendingLots();

    try {
      const rssFeed = await fetch( rssUrl );
      ( new window.RSSParser() ).parseString( await rssFeed.text(), parseAndDisplayFeed );
    } catch ( error ) {
      console.error( 'rss fetch failed', error );
      parseAndDisplayFeed( error, null );
    } finally {
      // Re-enable refresh button after 3 seconds.
      setTimeout( () => {
        homeRefreshBtn.removeAttribute( 'disabled' );
        homeRefreshBtn.style.cursor = 'pointer';
      }, 3000 );
    }
  }

  /**
   * @param {*} errors
   * @param {string} response
   */
  function parseAndDisplayFeed( errors, response ) {
    const didYouKnow = document.querySelector( '#did-you-know' );
    const rss = document.querySelector( '#rss' );
    const spinner = document.querySelector( '#rss-loading' );
    // Short pause before displaying feed to allow display to render
    // correctly.
    setTimeout( () => {
      didYouKnow.style.display = 'block';
      rss.style.display = 'block';
      spinner.style.display = 'none';
    }, 500 );

    document.querySelector( '#rss .alt-content' ).style.display = errors ? 'block' : 'none';

    if ( errors || ! response ) {
      return console.error( 'rss feed failed', { errors, response } );
    }
    // Clear the rss container for the new articles.
    document.querySelector( '#rss-root' ).innerHTML = '';

    response?.items?.forEach( function ( entry ) {
      // Get the article template from the DOM
      const articleTemplate = document.querySelector( '#article-template' );
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
      document.querySelector( '#rss-root' ).appendChild( articleElement );
    } );
  }

  /**
   * @param {string} pageId The page id to show hints of.
   */
  function showHints( pageId ) {
    const hints = document.querySelectorAll( '[hint-page]' );
    for ( let i = 0; i < hints.length; i++ ) {
      hints[ i ].style.display = 'none';
    }
    const hintId = 'HINT_' + pageId;
    if ( ! localStorage[ hintId ] ) {
      const hints = document.querySelectorAll( `[hint-page="${pageId}"]` );
      for ( let j = 0; j < hints.length; j++ ) {
        hints[ j ].style.display = 'block';
        addEventListener( hints[ j ], 'click', e => {
          e.currentTarget.style.display = 'none';
        } );
      }
      localStorage.setItem( hintId, true );
    }
  }

  /**
   * @param {string} pageId The page id.
   */
  navigateTo = pageId => {
    const menuItems = document.querySelectorAll( 'li[page-trigger]' );
    for ( let i = 0; i < menuItems.length; i++ ) {
      menuItems[ i ].classList.remove( 'active' );
    }
    document.querySelector( `li[page-trigger="${pageId}"]` )
      .classList.add( 'active' );

    const pages = document.querySelectorAll( 'div.page' );
    for ( let j = pages.length - 1; 0 <= j; j-- ) {
      pages[ j ].style.display = 'none';
    }
    const newPage = document.querySelector( `#${pageId}-page` );
    newPage.style.display = 'block';

    focusContent( newPage );
    showHints( pageId );
    afterPageChange( pageId );
  };

  function addUnreadProgressItems() {
    const menuItem = document.querySelector( '[page-trigger="downloads"]' );
    totalUnreadProgressItems++;
    menuItem.classList.add( 'has-downloads' );
    menuItem.style.setProperty( '--unread-progress-items', `"${totalUnreadProgressItems}"` );
  }

  /**
   * @param {string} pageId The page id.
   */
  function afterPageChange( pageId ) {
    if ( pageId === 'simitone' ) {
      if ( document.querySelector( 'body' ).className !== 'simitone' ) {
        prevTheme = document.querySelector( 'body' ).className;
      }
      if ( ! isDarkMode( prevTheme ) ) { // Stay in dark theme.
        setTheme( 'simitone', true );
      }
      sendMessage( 'CHECK_SIMITONE' );

      simitoneInterval && clearInterval( simitoneInterval );
      simitoneInterval = setInterval( () => sendMessage( 'CHECK_SIMITONE' ), 60000 );
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
  }

  /**
   * @param {array} vars Array of unserialized configuration variables.
   */
  function restoreConfiguration( vars ) {
    for ( const section in vars )
      for ( const item in vars[ section ] ) {
        const option = document.querySelector( `[option-id="${section}.${item}"]` );
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
      return document.querySelector( '#full-install' ).style.display = 'none';
    }
    document.querySelector( '#full-install-title' ).textContent = title;
    document.querySelector( '#full-install-text1' ).textContent = text1;
    document.querySelector( '#full-install-text2' ).innerHTML = text2;
    document.querySelector( '#full-install-progress' ).style.width  = '100%';
    document.querySelector( '#full-install' ).style.display = 'block';
  }

  /**
   * Creates a notification item in the notification log.
   *
   * @param {string} title Notification title.
   * @param {string} body  Notification text.
   * @param {string} url   Notification url (optional).
   */
  function createNotification( title, body, url ) {
    document.querySelector( '#notifications-page .alt-content' ).style.display = 'none';

    const id = Math.floor( Date.now() / 1000 );
    const notificationElement = createNotificationElement( title, body, url );
    notificationElement.querySelector( '.notification' ).id = `FSONotification${id}`;

    const pageContent = document.querySelector( '#notifications-page .page-content' );
    pageContent.prepend( notificationElement );

    addEventListener( `#FSONotification${id} .notification-body`,
      'click', ( _e ) => {
        if ( url ) {
          window.open( url, '_blank' );
        }
      }, false );
  }

  function createNotificationElement( title, body, url ) {
    const template = document.querySelector( '#notification-template' );
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

      addUnreadProgressItems();
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
    const modalElement = createYesNoModalElement( title, text, yesText, noText, type, modalRespId );
    const modalDiv  = modalElement.querySelector( '.modal' );
    const yesButton = modalElement.querySelector( '.yes-button' );
    const noButton  = modalElement.querySelector( '.no-button' );

    addEventListener( yesButton, 'click', function () {
      closeModal( modalDiv );
      modalRespId && sendMessage( modalRespId, ! 0, extra );
    } );
    if ( noText ) {
      addEventListener( noButton, 'click', function () {
        closeModal( modalDiv );
        modalRespId && sendMessage( modalRespId, ! 1, extra );
      } );
    }
    document.querySelector( '#launcher' ).appendChild( modalElement );

    showModal( modalDiv );
  }

  function createYesNoModalElement( title, text, yesText, noText, type, modalRespId ) {
    const modalTemplate = document.querySelector( '#yes-no-modal-template' );
    const modalElement  = document.importNode( modalTemplate.content, true );

    if ( modalRespId ) {
      modalElement.querySelector( '.modal' ).setAttribute( 'data-response-id', modalRespId );
    }
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
    const hints = document.querySelectorAll( '[hint-page="installer"]' );
    for ( let j = 0; j < hints.length; j++ ) {
      hints[ j ].style.display = 'none';
    }
  }

  function clearModals() {
    const modals = document.querySelectorAll( '.overlay-closeable' );
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
    focusContent( element );
  }

  function focusContent( element ) {
    const focusables = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]'
    );
    if ( focusables.length > 0 ) {
      setTimeout( () => focusables[ 0 ].focus(), 0 );
    }
  }

  function hideOverlay() {
    const overlayUsing = document.querySelectorAll( '.overlay-closeable' );
    if ( overlayUsing.length === 0 || ( ! Array.from( overlayUsing ).some( isVisible ) ) ) {
      document.querySelector( '#overlay' ).style.display = 'none';
    }
  }
  function showOverlay() {
    document.querySelector( '#overlay' ).style.display = 'block';
  }

  let ociFolder;

  function openOneClickInstall() {
    const oci = document.querySelector( '.oneclick-install' );
    oci.classList.remove( 'oneclick-install-selected' );
    showModal( oci );
  }

  closeOneClickInstall = () => {
    closeModal( document.querySelector( '.oneclick-install' ) );
  };

  ociPickFolder = () => {
    sendMessage( 'OCI_PICK_FOLDER' );
  };

  ociConfirm = e => {
    e.stopPropagation();
    if ( ociFolder ) {
      sendMessage( 'FULL_INSTALL_CONFIRM', true );
      closeModal( document.querySelector( '.oneclick-install' ) );
    }
  };

  function ociPickedFolder( folder ) {
    ociFolder = folder;
    const oci = document.querySelector( '.oneclick-install' );
    const ociFolderElement = document.querySelector( '.oneclick-install-folder' );
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

  function toggleKeyboardUser( e ) {
    if ( e.type === 'keydown' && e.key === 'Tab' ) {
      document.body.setAttribute( 'data-keyboard-user', '' );
    } else if ( e.type === 'mousedown' ) {
      document.body.removeAttribute( 'data-keyboard-user' );
    }
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
    if ( ! v ) return;

    document.querySelector( '#remeshinfo' ).style.display = 'block';

    const template = document.querySelector( '#remesh-info-template' );
    const node = document.importNode( template.content, true );

    const i = parseInt( v );
    const f = ago( new Date( i * 1000 ) );
    const seconds = Math.floor( ( new Date() - new Date( i * 1000 ) ) / 1000 );

    node.querySelector( 'span' ).textContent = f;

    if ( seconds < 172800 ) {
      if ( Math.floor( seconds / 86400 ) <= 1 ) {
        document.querySelector( '.item[install="RMS"]' ).classList.add( 'recent' );
      } else {
        document.querySelector( '.item[install="RMS"]' ).classList.remove( 'recent' );
      }
    } else {
      document.querySelector( '.item[install="RMS"]' ).classList.remove( 'recent' );
    }

    document.querySelector( '#remeshinfo' ).innerHTML = '';
    document.querySelector( '#remeshinfo' ).appendChild( node );
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
      document.querySelector( '#simitone-ver' ).textContent = `(Installed: ${b})`;
    } else {
      document.querySelector( '#simitone-ver' ).textContent = '';
    }
  } );
  // SET_THEME
  onMessage( 'SET_THEME', ( a, themeId ) => ( setTheme( themeId ), prevTheme = null ) );
  // SET_TIP
  onMessage( 'SET_TIP', ( a, tipText ) => {
    document.querySelector( '#tip-text' ).innerHTML = window.DOMPurify.sanitize( tipText );
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
    document.body.setAttribute( 'data-insprog', 'true' );

    if ( b.FSO ) {
      document.querySelector( '.item[install=FSO]' ).className = 'item installed';
    } else {
      document.querySelector( '.item[install=FSO]' ).className = 'item';
    }
    if ( b.TSO ) {
      document.querySelector( '.item[install=TSO]' ).className = 'item installed';
    } else {
      document.querySelector( '.item[install=TSO]' ).className = 'item';
    }
    if ( b.NET ) {
      document.querySelector( '.item[install=NET]' ).className = 'item installed';
    } else {
      document.querySelector( '.item[install=NET]' ).className = 'item';
    }
    if ( b.OpenAL ) {
      document.querySelector( '.item[install=OpenAL]' ).className = 'item installed';
    } else {
      document.querySelector( '.item[install=OpenAL]' ).className = 'item';
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
      document.querySelector( '.item[install=Mono]' ).className = 'item installed';
    } else {
      document.querySelector( '.item[install=Mono]' ).className = 'item';
    }
    if ( b.SDL ) {
      document.querySelector( '.item[install=SDL]' ).className = 'item installed';
    } else {
      document.querySelector( '.item[install=SDL]' ).className = 'item';
    }
  } );
  // STOP_PROGRESS_ITEM
  onMessage( 'STOP_PROGRESS_ITEM', ( a, b ) => {
    const item = document.querySelector( `#${b}` );
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
      document.querySelector( '[option-id="Game.RefreshRate"]' )
        .setAttribute( 'max', rate );
    }
  } );

  // Renderer HTML event listeners.
  addEventListener( '.launch',                   'click',       () => sendMessage( 'PLAY' ) );
  addEventListener( '.launch',                   'contextmenu', () => sendMessage( 'PLAY', true ) );
  addEventListener( '#refresh-home-button',      'click',       () => fetchWidgetData( true ) );
  addEventListener( '#simitone-play-button',     'click',       () => sendMessage( 'PLAY_SIMITONE' ) );
  addEventListener( '#simitone-play-button',     'contextmenu', () => sendMessage( 'PLAY_SIMITONE', true ) );
  addEventListener( '#full-install-button',      'click',       () => sendMessage( 'FULL_INSTALL' ) );
  addEventListener( '#full-install-button',      'click',       () => clearInstallerHints() );
  addEventListener( '#update-check',             'click',       () => sendMessage( 'CHECK_UPDATES' ) );
  addEventListener( '#simitone-install-button',  'click',       () => sendMessage( 'INSTALL', 'Simitone' ) );
  addEventListener( '#simitone-should-update',   'click',       () => sendMessage( 'INSTALL_SIMITONE_UPDATE' ) );
  addEventListener( '#overlay',                  'click',       () => clearModals() );
  addEventListener( '.oneclick-install-select',  'click',       () => ociPickFolder() );
  addEventListener( '.oneclick-install-close',   'click',       () => closeOneClickInstall() );
  addEventListener( '.oneclick-install-confirm', 'click',       e => ociConfirm( e ) );
  addEventListener( document.body,               'keydown',     e => toggleKeyboardUser( e ) );
  addEventListener( document.body,               'mousedown',   e => toggleKeyboardUser( e ) );

  // Disable click for installation path tag
  document.querySelectorAll( '.item-info' ).forEach( function ( item ) {
    item.addEventListener( 'click', function ( event ) {
      event.stopPropagation();
    } );
  } );

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

    sendMessage( 'SET_CONFIGURATION', [ optionPath[ 0 ], optionPath[ 1 ], inputValue ] );
  } );
  addEventListenerAll( '[page-trigger]', 'click', ( a, _b ) => {
    clickAudio.play();
    navigateTo( a.currentTarget.getAttribute( 'page-trigger' ) );
  } );
  addEventListenerAll( '[install]', 'click', ( a, _b ) =>
    sendMessage( 'INSTALL', a.currentTarget.getAttribute( 'install' ) ) );
  addEventListenerAll( '[install] .item-info i.material-icons', 'click', ( a, _b ) =>
    sendMessage( 'OPEN_FOLDER', a.currentTarget.closest( '.item' ).getAttribute( 'install' ) ) );

  run();
} )();
