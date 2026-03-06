import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { AppUserRole } from "./backend";
import { EmailAuthModal } from "./components/EmailAuthModal";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { PWAInstallBanner } from "./components/PWAInstallBanner";
import { useEmailAuth } from "./hooks/useEmailAuth";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile, useIsCallerAdmin } from "./hooks/useQueries";
import { AccessDenied } from "./pages/AccessDenied";
import { LandingPage } from "./pages/LandingPage";
import { PaymentFailure } from "./pages/PaymentFailure";
import { PaymentSuccess } from "./pages/PaymentSuccess";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminJobDetail } from "./pages/admin/AdminJobDetail";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { ClientDashboard } from "./pages/client/ClientDashboard";
import { JobDetailPage } from "./pages/client/JobDetailPage";
import { SubmitJobPage } from "./pages/client/SubmitJobPage";
import { EditorDashboard } from "./pages/editor/EditorDashboard";
import { EditorJobDetail } from "./pages/editor/EditorJobDetail";

// ── Root layout ──────────────────────────────────────────────────────────────

function RootLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
      <PWAInstallBanner />
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast:
              "bg-card border border-border text-foreground font-sans shadow-lg",
            title: "font-display font-semibold",
            description: "text-muted-foreground",
            actionButton: "bg-primary text-primary-foreground",
            cancelButton: "bg-muted text-muted-foreground",
            closeButton: "text-muted-foreground",
          },
        }}
      />
    </div>
  );
}

// ── Guards ───────────────────────────────────────────────────────────────────

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();
  const { isLoading } = useGetCallerUserProfile();
  const { isRegistered, isEmailLoggedIn } = useEmailAuth();

  if (isInitializing || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-mono">Loading…</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return <AccessDenied />;
  }

  // Email auth gate: show modal if not yet registered or not logged in this session
  if (!isRegistered || !isEmailLoggedIn) {
    return <EmailAuthModal open={true} />;
  }

  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: isAdmin, isLoading } = useIsCallerAdmin();
  const navigate = useNavigate();

  if (isInitializing || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!identity || !isAdmin) {
    return <AccessDenied />;
  }

  // Admin is authenticated but hasn't entered the passkey this session
  const sessionVerified =
    sessionStorage.getItem("adminAuthenticated") === "true";
  if (!sessionVerified) {
    navigate({ to: "/admin-login" });
    return null;
  }

  return <>{children}</>;
}

function EditorGuard({ children }: { children: React.ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: profile, isLoading } = useGetCallerUserProfile();

  if (isInitializing || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!identity || profile?.appRole !== AppUserRole.editor) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}

// ── Routes ───────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

// Client routes
const clientRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/client",
  component: () => (
    <AuthGuard>
      <ClientDashboard />
    </AuthGuard>
  ),
});

const clientSubmitRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/client/submit",
  component: () => (
    <AuthGuard>
      <SubmitJobPage />
    </AuthGuard>
  ),
});

const clientJobsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/client/jobs/$id",
  component: function ClientJobDetail() {
    const { id } = clientJobsRoute.useParams();
    return (
      <AuthGuard>
        <JobDetailPage jobId={id} />
      </AuthGuard>
    );
  },
});

// Editor routes
const editorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/editor",
  component: () => (
    <EditorGuard>
      <EditorDashboard />
    </EditorGuard>
  ),
});

const editorJobRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/editor/jobs/$id",
  component: function EditorJob() {
    const { id } = editorJobRoute.useParams();
    return (
      <EditorGuard>
        <EditorJobDetail jobId={id} />
      </EditorGuard>
    );
  },
});

// Admin login route (no guard)
const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin-login",
  component: AdminLoginPage,
});

// Admin routes
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  ),
});

const adminJobRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/jobs/$id",
  component: function AdminJob() {
    const { id } = adminJobRoute.useParams();
    return (
      <AdminGuard>
        <AdminJobDetail jobId={id} />
      </AdminGuard>
    );
  },
});

// Payment routes
const paymentSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payment-success",
  component: PaymentSuccess,
});

const paymentFailureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payment-failure",
  component: PaymentFailure,
});

// ── Router ───────────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  indexRoute,
  clientRoute,
  clientSubmitRoute,
  clientJobsRoute,
  editorRoute,
  editorJobRoute,
  adminLoginRoute,
  adminRoute,
  adminJobRoute,
  paymentSuccessRoute,
  paymentFailureRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
