const fs = require('fs');

function replaceAll(file, fn) {
  if (fs.existsSync(file)) {
    fs.writeFileSync(file, fn(fs.readFileSync(file, 'utf8')));
  }
}

// 1. Fix fetchWithAuth without .json()
const fixFetch = (content) => {
  return content.replace(/const (\w+) = await fetchWithAuth\((.*?)\);(?!\s*const \w+ = await \1\.json\(\))/g, 
    'const $1_res = await fetchWithAuth($2);\n    const $1 = await $1_res.json();');
}

replaceAll('src/app/lecturer/dashboard/page.tsx', fixFetch);
replaceAll('src/app/lecturer/preferences/page.tsx', fixFetch);

// 2. Fix params Next.js 15
const fixParams = (content) => {
  let c = content.replace(/\{ params \}: \{ params: \{ id: string \} \}/g, '{ params }: { params: Promise<{ id: string }> }');
  c = c.replace(/\{ params \}: \{ params: \{ id: string; \} \}/g, '{ params }: { params: Promise<{ id: string }> }');
  
  c = c.replace(/params\.id/g, '(await params).id');
  return c;
};

const routeDirs = [
  'src/app/api/courses/[id]/route.ts',
  'src/app/api/departments/[id]/route.ts',
  'src/app/api/lecturers/[id]/route.ts',
  'src/app/api/lecturers/[id]/approve/route.ts',
  'src/app/api/sessions/[id]/activate/route.ts',
];

for (const p of routeDirs) {
  replaceAll(p, fixParams);
}

// 3. Fix seniorityLevel -> seniorityRank
replaceAll('src/app/api/lecturers/[id]/route.ts', (c) => c.replace(/seniorityLevel: body\.seniorityLevel/g, 'seniorityRank: body.seniorityLevel'));
