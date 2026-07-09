const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'Components');

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            const orig = fs.readFileSync(fullPath, 'utf8');
            // Remove any class starting with dark:
            const modified = orig.replace(/ dark:[a-zA-Z0-9-\[\]#]+/g, '');
            if (orig !== modified) {
                fs.writeFileSync(fullPath, modified, 'utf8');
            }
        }
    }
}
processDirectory(componentsDir);
