import fs from "fs";

let layout = fs.readFileSync("src/app/layout.tsx", "utf-8");
layout = layout.replace(
  "import { Geist, Geist_Mono } from \"next/font/google\";",
  "import { Geist, Geist_Mono, Newsreader } from \"next/font/google\";"
);

const newsreaderDef = `
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});
`;

layout = layout.replace(
  "export const metadata: Metadata =",
  newsreaderDef + "\nexport const metadata: Metadata ="
);

layout = layout.replace(
  "className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}",
  "className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}"
);

fs.writeFileSync("src/app/layout.tsx", layout);

let globals = fs.readFileSync("src/app/globals.css", "utf-8");
globals = globals.replace(
  "--font-heading: var(--font-geist-sans);",
  "--font-heading: var(--font-newsreader);\n  --font-serif: var(--font-newsreader);"
);
fs.writeFileSync("src/app/globals.css", globals);
