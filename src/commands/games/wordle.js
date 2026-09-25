const { createPlaceholderCommand } = require('../../core/command.factory');

module.exports = createPlaceholderCommand({
  name: 'wordle',
  description: 'Tebak kata 5 huruf dengan kode warna balok.',
});
