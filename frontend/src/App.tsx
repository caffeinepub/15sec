import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginPrompt from './components/LoginPrompt';
import UsernameSetupModal from './components/UsernameSetupModal';
import CookieConsent from './components/CookieConsent';
import HomePage from './pages/HomePage';
import CreatePage from './pages/CreatePage';
import AccountPage from './pages/AccountPage';
import ProfilePage from './pages/ProfilePage';
import VideoDetailPage from './pages/VideoDetailPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

const queryClient = new QueryClient();

const rootRoute = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <Header />
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const createRoute_ = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create',
  component: CreatePage,
});

const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/account',
  component: AccountPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile/$username',
  component: ProfilePage,
});

const videoDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/video/$videoId',
  component: VideoDetailPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminDashboardPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  createRoute_,
  accountRoute,
  profileRoute,
  videoDetailRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  return (
    <>
      <RouterProvider router={router} />
      {showProfileSetup && <UsernameSetupModal />}
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppContent />
        <CookieConsent />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
