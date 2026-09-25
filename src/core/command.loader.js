const fs = require('fs');
const path = require('path');

function loadCommands(baseDir) {
  const commands = [];
  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        const command = require(fullPath);
        if (Array.isArray(command)) {
          for (const c of command) {
            commands.push(c);
          }
        } else {
          commands.push(command);
        }
      }
    }
  };

  if (fs.existsSync(baseDir)) {
    walk(baseDir);
  }

  return commands;
}

module.exports = {
  loadCommands,
};
