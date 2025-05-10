import './globals.scss';

export const metadata = {
  title: 'FURNOV Interior Design Tool',
  description: 'Design your home interiors in 3D',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
