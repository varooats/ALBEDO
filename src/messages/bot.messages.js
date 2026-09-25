const botMessages = {
  ping: (latency = null) => [
    '╭─『 STATUS 』',
    '│ ⟢ Status : Active',
    ...(latency !== null ? [`│ ⟢ Latency : \`\`\`${latency}ms\`\`\``] : []),
    '╰──────────────────',
  ].join('\n'),

  genericError: () =>
    'Maaf, terjadi kendala saat memproses permintaan. Silakan coba beberapa saat lagi.',

  commandNotFound: (commandName = '') => [
    `Command \`\`\`.${commandName}\`\`\` tidak ditemukan.`,
    '',
    '> Ketik ```.menu``` untuk daftar perintah.',
  ].join('\n'),

  notImplemented: (commandName = '') =>
    `Command \`\`\`.${commandName}\`\`\` sedang dikembangkan.`,

  presenceError: (state, error) => `[MESSAGE] Presence ${state} error: ${error}`,
};

module.exports = { botMessages };
