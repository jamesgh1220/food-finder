import fs from "fs";

// Login Page
let login = fs.readFileSync("src/app/login/page.tsx", "utf-8");
login = login.replace(
  /className="text-2xl font-semibold tracking-tight"/,
  'className="text-3xl font-serif tracking-tight text-foreground"'
);
login = login.replace(
  /bg-muted px-4 py-16/,
  'bg-background px-4 py-24'
);
fs.writeFileSync("src/app/login/page.tsx", login);

// Register Page
let register = fs.readFileSync("src/app/register/page.tsx", "utf-8");
register = register.replace(
  /className="text-2xl font-semibold tracking-tight"/,
  'className="text-3xl font-serif tracking-tight text-foreground"'
);
register = register.replace(
  /bg-muted px-4 py-16/,
  'bg-background px-4 py-24'
);
fs.writeFileSync("src/app/register/page.tsx", register);

// Dashboard Page
let dashboard = fs.readFileSync("src/app/dashboard/page.tsx", "utf-8");
dashboard = dashboard.replace(
  /className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight"/,
  'className="max-w-2xl text-5xl font-serif leading-tight tracking-tight text-foreground"'
);
dashboard = dashboard.replace(
  /<header className="border-b border-border bg-card">/,
  '<header className="border-b border-border bg-background">'
);
dashboard = dashboard.replace(
  /<div className="border-b border-border bg-card">/,
  '<div className="border-b border-border bg-background">'
);
dashboard = dashboard.replace(
  /<span className="text-sm font-semibold tracking-tight">/,
  '<span className="text-lg font-serif font-medium tracking-tight text-primary">'
);
dashboard = dashboard.replace(
  /<span className="text-sm font-semibold tracking-tight">/,
  '<span className="text-lg font-serif font-medium tracking-tight text-primary">'
);
dashboard = dashboard.replace(
  /<main className="mx-auto w-full max-w-4xl px-6 py-16">/g,
  '<main className="mx-auto w-full max-w-5xl px-6 py-24">'
);
fs.writeFileSync("src/app/dashboard/page.tsx", dashboard);
