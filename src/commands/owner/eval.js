const { createPlaceholderCommand } = require('../../core/command.factory');

module.exports = createPlaceholderCommand({
  name: 'eval',
  description: 'Eval kode pada runtime bot.',
});
