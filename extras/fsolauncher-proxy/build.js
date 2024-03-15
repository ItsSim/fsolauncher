const { execSync } = require( 'child_process' );
const package = require( './package.json' );

const targets = [ 'node18-linux-x64' ]; // Add or remove targets as needed

targets.forEach( target => {
  const [ nodeVersion, platform, arch ] = target.split( '-' );
  const outputName = `../../release/proxy-${package.version}-${platform}-${arch}`;
  execSync( `pkg . --targets ${target} --output ${outputName}`, { stdio: 'inherit' } );
} );