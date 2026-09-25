function formatMessage(template = '', values = {}) {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), String(value));
  }, template);
}

module.exports = { formatMessage };
