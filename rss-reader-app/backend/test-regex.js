const test = '<outline text="Technology" title="Technology">';
const regex = /<outline\s[^>]*>/;
const match = test.match(regex);

console.log('Test string:', test);
console.log('Regex:', regex);
console.log('Match:', match ? match[0] : 'NO MATCH');
console.log('Match length:', match ? match[0].length : 'N/A');
console.log('Test length:', test.length);
