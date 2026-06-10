const app = require('../server');

const adminLayer = app._router.stack.find(layer => layer.regexp && layer.regexp.source === '^\\/api\\/admin\\/?(?=\\/|$)');
if (!adminLayer) {
  console.log('No /api/admin mount found');
  process.exit(1);
}

const adminRouter = adminLayer.handle;
console.log('adminLayer name:', adminLayer.name);
console.log('adminRouter type:', typeof adminRouter);
if (adminRouter && adminRouter.stack) {
  console.log('adminRouter stack paths:');
  adminRouter.stack.forEach((layer, i) => {
    if (layer.route) {
      console.log(i, layer.route.path, Object.keys(layer.route.methods).join(','));
    } else if (layer.name === 'router') {
      console.log(i, 'nested router', layer.regexp && layer.regexp.source);
    } else {
      console.log(i, 'middleware', layer.name, layer.regexp && layer.regexp.source);
    }
  });
} else {
  console.log('adminRouter has no stack');
}
