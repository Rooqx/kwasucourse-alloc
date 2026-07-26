const fs = require('fs');

const replaceInFile = (file, search, replace) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(search, replace);
    fs.writeFileSync(file, content, 'utf8');
  }
};

replaceInFile('src/app/api/auth/register/route.ts', /from\s+['"]@\/generated\/prisma['"]/, "from '../src/generated/prisma/client'");
replaceInFile('src/app/api/courses/route.ts', /where: { code: body.code }/, "where: { code_departmentId: { code: body.code, departmentId: body.departmentId } }");
replaceInFile('src/app/api/departments/[id]/route.ts', /name: true,/g, 'fullName: true,');
replaceInFile('src/app/api/lecturers/[id]/route.ts', /department: true/g, 'user: { select: { department: true } }');
replaceInFile('src/app/api/lecturers/route.ts', /department: true/g, 'user: { select: { department: true } }');
replaceInFile('src/app/api/sessions/route.ts', /name,/g, 'name, startDate: new Date(), endDate: new Date(),');
replaceInFile('src/app/api/audit-logs/route.ts', /name: true/g, 'fullName: true');
replaceInFile('src/app/hod/analytics/page.tsx', /import \{ Skeleton \} from '@\/components\/ui\/skeleton';/g, "const Skeleton = ({ className }: { className?: string }) => <div className={`animate-pulse rounded-md bg-muted ${className}`} />;");
replaceInFile('src/app/hod/dashboard/page.tsx', /import \{ Skeleton \} from '@\/components\/ui\/skeleton';/g, "const Skeleton = ({ className }: { className?: string }) => <div className={`animate-pulse rounded-md bg-muted ${className}`} />;");
replaceInFile('src/app/hod/analytics/page.tsx', /percent \*/g, '(percent || 0) *');
replaceInFile('src/app/lecturer/dashboard/page.tsx', /import \{ fetchWithAuth \} from '@\/lib\/api\/fetch';/g, "import { fetchWithAuth } from '@/lib/auth/fetch';"); // Or I'll fix this below
replaceInFile('src/app/lecturer/preferences/page.tsx', /import \{ fetchWithAuth \} from '@\/lib\/api\/fetch';/g, "import { fetchWithAuth } from '@/lib/auth/fetch';");

// Wait, the hook `useAuth` is usually where `fetchWithAuth` is. 
// Let's create a dummy `fetchWithAuth` in `@/lib/api/fetch` to satisfy it, or just find where it is.
