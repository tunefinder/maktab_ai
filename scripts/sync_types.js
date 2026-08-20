const fs = require('fs');
const path = require('path');

const typesDir = path.join(__dirname, '..', 'node_modules', '@types');
if (fs.existsSync(typesDir)) {
  const entries = fs.readdirSync(typesDir);
  entries.forEach(name => {
    if (name.startsWith('.') && name.includes('-')) {
      const parts = name.slice(1).split('-');
      parts.pop();
      const cleanName = parts.join('-');
      if (cleanName) {
        const src = path.join(typesDir, name);
        const dst = path.join(typesDir, cleanName);
        try {
          fs.cpSync(src, dst, { recursive: true, force: true });
          console.log(`Synced @types/${cleanName}`);
        } catch (e) {
          console.error(e.message);
        }
      }
    }
  });
}
console.log('All @types synced.');
