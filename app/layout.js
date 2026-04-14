import { AppProvider } from '@/lib/store';
import './globals.css';

export const metadata = {
  title: 'Prompt Engineering Toolkit',
  description: 'Structured prompt development and evaluation for teams.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
