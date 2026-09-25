const { createPlaceholderCommand } = require('../../core/command.factory');

module.exports = createPlaceholderCommand({
  name: 'exec',
  description: 'Jalankan command shell dari bot.',
});
