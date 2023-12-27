// playwright.config.js

const reporter = [
  [ 'html', { open: 'never', outputFolder: 'tests/reports/html' } ]
];
if ( process.env.CI ) {
  reporter.push( [ 'github' ] );
}
module.exports = { reporter, workers: 1 };