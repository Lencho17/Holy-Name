const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'Components');

const replacements = [
    { match: /\bbg-white(?!\/)(?! dark:bg-)/g, replace: 'bg-white dark:bg-[#1E293B]' },
    { match: /\btext-gray-800(?!\/)(?! dark:text-)/g, replace: 'text-gray-800 dark:text-gray-100' },
    { match: /\btext-slate-800(?!\/)(?! dark:text-)/g, replace: 'text-slate-800 dark:text-slate-100' },
    { match: /\btext-gray-900(?!\/)(?! dark:text-)/g, replace: 'text-gray-900 dark:text-gray-50' },
    { match: /\bbg-gray-50(?!\/)(?! dark:bg-)/g, replace: 'bg-gray-50 dark:bg-[#0F172A]' },
    { match: /\bbg-\[\#FAFAFA\](?!\/)(?! dark:bg-)/g, replace: 'bg-[#FAFAFA] dark:bg-[#020617]' },
    { match: /\bbg-\[\#F9F9FB\](?!\/)(?! dark:bg-)/g, replace: 'bg-[#F9F9FB] dark:bg-[#0F172A]' },
    { match: /\bborder-gray-100(?!\/)(?! dark:border-)/g, replace: 'border-gray-100 dark:border-slate-800' },
    { match: /\bborder-gray-200(?!\/)(?! dark:border-)/g, replace: 'border-gray-200 dark:border-slate-700' },
    { match: /\bborder-slate-100(?!\/)(?! dark:border-)/g, replace: 'border-slate-100 dark:border-slate-800' },
    { match: /\bborder-slate-200(?!\/)(?! dark:border-)/g, replace: 'border-slate-200 dark:border-slate-700' },
    { match: /\btext-gray-500(?!\/)(?! dark:text-)/g, replace: 'text-gray-500 dark:text-gray-400' },
    { match: /\btext-gray-600(?!\/)(?! dark:text-)/g, replace: 'text-gray-600 dark:text-gray-300' },
    { match: /\bshadow-xl(?!\/)(?! dark:shadow-)/g, replace: 'shadow-xl dark:shadow-none' },
    { match: /\bshadow-lg(?!\/)(?! dark:shadow-)/g, replace: 'shadow-lg dark:shadow-none' },
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
