const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'Components');

const replacements = [
    { match: /(?<!-)\b([a-z0-9:-]+:)?bg-white(?!\/)(?! dark:bg-)/g, replace: '$1bg-white dark:$1bg-[#1E293B]' },
    { match: /(?<!-)\b([a-z0-9:-]+:)?text-gray-800(?!\/)(?! dark:text-)/g, replace: '$1text-gray-800 dark:$1text-gray-100' },
    { match: /(?<!-)\b([a-z0-9:-]+:)?text-slate-800(?!\/)(?! dark:text-)/g, replace: '$1text-slate-800 dark:$1text-slate-100' },
    { match: /(?<!-)\b([a-z0-9:-]+:)?text-gray-900(?!\/)(?! dark:text-)/g, replace: '$1text-gray-900 dark:$1text-gray-50' },
    { match: /(?<!-)\b([a-z0-9:-]+:)?bg-gray-50(?!\/)(?! dark:bg-)/g, replace: '$1bg-gray-50 dark:$1bg-[#0F172A]' },
    { match: /(?<!-)\b([a-z0-9:-]+:)?bg-\[\#FAFAFA\](?!\/)(?! dark:bg-)/g, replace: '$1bg-[#FAFAFA] dark:$1bg-[#020617]' },
    { match: /(?<!-)\b([a-z0-9:-]+:)?bg-\[\#F9F9FB\](?!\/)(?! dark:bg-)/g, replace: '$1bg-[#F9F9FB] dark:$1bg-[#0F172A]' },
    { match: /(?<!-)\b([a-z0-9:-]+:)?border-gray-100(?!\/)(?! dark:border-)/g, replace: '$1border-gray-100 dark:$1border-slate-800' },
    { match: /(?<!-)\b([a-z0-9:-]+:)?border-gray-200(?!\/)(?! dark:border-)/g, replace: '$1border-gray-200 dark:$1border-slate-700' },
    { match: /(?<!-)\b([a-z0-9:-]+:)?border-slate-100(?!\/)(?! dark:border-)/g, replace: '$1border-slate-100 dark:$1border-slate-800' },
    { match: /(?<!-)\b([a-z0-9:-]+:)?border-slate-200(?!\/)(?! dark:border-)/g, replace: '$1border-slate-200 dark:$1border-slate-700' },
    { match: /(?<!-)\b([a-z0-9:-]+:)?text-gray-500(?!\/)(?! dark:text-)/g, replace: '$1text-gray-500 dark:$1text-gray-400' },
    { match: /(?<!-)\b([a-z0-9:-]+:)?text-gray-600(?!\/)(?! dark:text-)/g, replace: '$1text-gray-600 dark:$1text-gray-300' },
    { match: /(?<!-)\b([a-z0-9:-]+:)?shadow-xl(?!\/)(?! dark:shadow-)/g, replace: '$1shadow-xl dark:$1shadow-none' },
    { match: /(?<!-)\b([a-z0-9:-]+:)?shadow-lg(?!\/)(?! dark:shadow-)/g, replace: '$1shadow-lg dark:$1shadow-none' },
];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    let changedFiles = 0;

    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            changedFiles += processDirectory(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            const orig = fs.readFileSync(fullPath, 'utf8');
            let modified = orig;

            for (const rule of replacements) {
                modified = modified.replace(rule.match, rule.replace);
            }

            if (orig !== modified) {
                fs.writeFileSync(fullPath, modified, 'utf8');
                console.log(`Updated ${file}`);
                changedFiles++;
            }
        }
    }
    return changedFiles;
}

const total = processDirectory(componentsDir);
console.log(`Total components updated: ${total}`);
