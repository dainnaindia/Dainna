const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src', 'routes');
const files = fs.readdirSync(routesDir);

for (const file of files) {
  if (file.endsWith('.ts')) {
    const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
    if (content.toLowerCase().includes('adv_payment_master') || content.toLowerCase().includes('adv_payment_history_master')) {
      console.log(`Found in: ${file}`);
      // Find matching lines
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes('adv_payment_master') || line.toLowerCase().includes('adv_payment_history_master')) {
          console.log(`  L${idx + 1}: ${line.trim()}`);
        }
      });
    }
  }
}
