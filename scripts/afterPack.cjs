const path = require('path');
const { rcedit } = require('rcedit');

exports.default = async function (context) {
  if (context.electronPlatformName !== 'win32') return;

  const exePath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`);
  const iconPath = path.resolve(__dirname, '..', 'public', 'app-icon.ico');

  console.log(`Setting icon on ${exePath}...`);
  await rcedit(exePath, { icon: iconPath });
  console.log('Icon set successfully!');
};
