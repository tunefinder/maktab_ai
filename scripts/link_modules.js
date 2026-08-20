const fs = require('fs');
const path = require('path');

function linkDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir);

  entries.forEach(name => {
    if (name.startsWith('@')) {
      linkDirectory(path.join(dir, name));
      return;
    }
    if (name.startsWith('.') && name.includes('-') && !name.startsWith('.bin') && !name.startsWith('.cache') && !name.startsWith('.prisma')) {
      const parts = name.slice(1).split('-');
      parts.pop(); // remove hash
      const cleanName = parts.join('-');
      
      if (cleanName) {
        const targetDir = path.join(dir, cleanName);
        const sourceDir = path.join(dir, name);
        
        try {
          fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });
          console.log(`Copied ${name} -> ${cleanName} in ${dir}`);
        } catch (e) {
          console.error(`Failed for ${name}:`, e.message);
        }
      }
    }
  });
}

const rootNm = path.join(__dirname, '..', 'node_modules');
linkDirectory(rootNm);
linkDirectory(path.join(rootNm, 'prisma', 'node_modules'));

console.log('Done linking all nested and scoped modules with force.');
