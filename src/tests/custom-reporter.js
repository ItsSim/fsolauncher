const { DefaultReporter } = require( '@playwright/test/reporter' );

class CustomReporter extends DefaultReporter {
  onTestEnd( test, result ) {
    super.onTestEnd( test, result );
    // Check if the test passed and was a retry
    if ( result.status === 'passed' && result.retry ) {
      // ANSI escape code for bright yellow text to stand out
      const colorYellow = '\x1b[93m';
      // ANSI escape code to reset styling
      const colorReset = '\x1b[0m';
      // Log with color, symbol, and emphasized message
      console.log( `${colorYellow}⚠️ [Might be flaky] Test passed on retry #${result.retry}: ${test.title}${colorReset}` );
    }
  }
}

module.exports = CustomReporter;
