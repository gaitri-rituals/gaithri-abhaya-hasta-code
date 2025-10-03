import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'controllers', 'bookingsController.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace db.query patterns
content = content.replace(/await db\.query\(([^,]+),\s*\[([^\]]*)\]\)/g, 
  'await sequelize.query($1, { replacements: [$2], type: QueryTypes.SELECT })');

// Replace result.rows patterns
content = content.replace(/\.rows\[0\]/g, '[0]');
content = content.replace(/\.rows\.length/g, '.length');
content = content.replace(/\.rows/g, '');

// Handle INSERT queries that need different type
content = content.replace(/type: QueryTypes\.SELECT \}\);[\s\n]*\/\/ This should be INSERT/g, 
  'type: QueryTypes.INSERT });');

console.log('Converting bookingsController.js...');

// Write the file back
fs.writeFileSync(filePath, content);

console.log('✅ Conversion completed!');