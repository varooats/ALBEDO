const { createPlaceholderCommand } = require('../../core/command.factory');

module.exports = createPlaceholderCommand({
  name: 'broadcast',
  description: 'Kirim broadcast ke semua chat.',
});
