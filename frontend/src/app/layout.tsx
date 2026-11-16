import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PROJECT PYROS // NASA Microgravity Combustion Laboratory',
  description: 'Photorealistic 3D Space Station, Planetary Environments & Combustion Physics Intelligence Platform',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="clean-ui-body">
        {children}
      </body>
    </html>
  );
}
