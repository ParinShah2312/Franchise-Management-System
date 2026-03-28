import { Outlet } from 'react-router-dom';
import { Navbar, Footer } from '../components/layout';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-gray-900">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
