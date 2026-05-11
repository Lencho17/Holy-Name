const fs = require('fs');
const file = '/mnt/ce4785fb-47ab-41bf-8715-d03587bbddaf/Holy-Name/frontend/src/Components/Admission.jsx';
let content = fs.readFileSync(file, 'utf8');

// We only want to replace colors inside the <form id="admission-form" ...> ... </form>
// Actually, let's just do the whole file's color classes inside className="..." to be safe? 
// No, user specifically said "with the form".
const formStartIndex = content.indexOf('<form key={formKey} id="admission-form"');
const formEndIndex = content.lastIndexOf('</form>');

if (formStartIndex !== -1 && formEndIndex !== -1) {
    let before = content.substring(0, formStartIndex);
    let formContent = content.substring(formStartIndex, formEndIndex + 7);
    let after = content.substring(formEndIndex + 7);

    // Replace colors
    const replacements = {
        'text-primary': 'text-black',
        'bg-primary/5': 'bg-gray-100',
        'border-primary/10': 'border-gray-300',
        'border-primary': 'border-black',
        'bg-primary': 'bg-black',
        'text-amber-600': 'text-black',
        'bg-amber-500': 'bg-black',
        'text-amber-500': 'text-black',
        'bg-amber-50': 'bg-gray-100',
        'border-amber-200': 'border-gray-300',
        'ring-amber-500': 'ring-black',
        'focus:ring-amber-500': 'focus:ring-black',
        'text-blue-500': 'text-black',
        'bg-blue-50': 'bg-gray-100',
        'text-blue-600': 'text-black',
        'bg-blue-600': 'bg-black',
        'border-blue-200': 'border-gray-300',
        'from-blue-50/50': 'from-gray-50',
        'shadow-blue-500/30': 'shadow-black/10',
        'hover:shadow-blue-500/50': 'hover:shadow-black/20',
        'text-green-600': 'text-black',
        'text-green-500': 'text-black',
        'border-green-400': 'border-gray-400',
        'bg-green-50/30': 'bg-gray-50',
        'bg-amber-100': 'bg-gray-200',
        'text-amber-700': 'text-black',
        'bg-red-50': 'bg-gray-100',
        'border-red-200': 'border-gray-300',
        'text-red-600': 'text-black',
        'text-red-500': 'text-black',
        'text-red-800': 'text-black',
        'bg-red-100': 'bg-gray-200',
        'border-red-400': 'border-gray-400',
        'bg-red-50/30': 'bg-gray-50',
        'text-purple-600': 'text-black',
        'bg-purple-50': 'bg-gray-100',
        'text-white': 'text-white', // keep
        'bg-emerald-50': 'bg-gray-100',
        'text-emerald-500': 'text-black',
        'hover:bg-emerald-500': 'hover:bg-black',
        'border-emerald-100': 'border-gray-300'
    };

    for (const [key, value] of Object.entries(replacements)) {
        // We use regex to replace whole words or exact class names
        // Note: Tailwind classes can have prefixes/suffixes, but these exact matches are usually safe.
        // It's safer to just split by spaces or use word boundaries, but '-' is a word boundary in JS regex?
        // Wait, \b matches between a word char and a non-word char. '-' is a non-word char.
        // So \btext-primary\b wouldn't match fully as intended because of the dash.
        // Let's just do a global string replace.
        formContent = formContent.split(key).join(value);
    }

    fs.writeFileSync(file, before + formContent + after);
    console.log("Colors replaced in the form!");
} else {
    console.log("Form not found");
}
