const reporter = [
  [ 'html', { open: 'never', outputFolder: 'tests/reports/html' } ]
];
if ( process.env.CI ) {
  reporter.push( [ 'github' ] );
}
module.exports = {
  reporter,
  workers: 1,
  use: {
    // Disable HTTP cache for all browser contexts
    httpCache: false,
  },
  retries: 3, // Retry each test up to 3 times if it fails
};