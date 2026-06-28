import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { OfflineProvider } from "./offline/OfflineProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1976d2" />
      </head>
      <body>
        <AuthProvider>
          <OfflineProvider>
            {children}
          </OfflineProvider>
        </AuthProvider>
      </body>
    </html>
  );
}