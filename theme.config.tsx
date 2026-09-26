import React from "react";
import { DocsThemeConfig } from "nextra-theme-docs";

const config: DocsThemeConfig = {
  logo: (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
      <img src="/favicon.svg" alt="OBAOL" style={{ width: '22px', height: '22px' }} />
      <span>OBAOL Supreme</span>
    </span>
  ),
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="alternate icon" type="image/png" href="/favicon.png" />
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <meta name="theme-color" content="#0F172A" />
    </>
  ),
  darkMode: true,
  nextThemes: {
    defaultTheme: "system",
    storageKey: "obaol-theme",
  },
  docsRepositoryBase: "https://www.obaol.com",
  footer: {
    text: "OBAOL Operator Workspace",
  },
};

export default config;
