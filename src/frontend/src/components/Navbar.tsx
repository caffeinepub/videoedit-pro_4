import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { Briefcase, Film, Loader2, LogOut, User } from "lucide-react";
import { AppUserRole } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile, useIsCallerAdmin } from "../hooks/useQueries";

export function Navbar() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const { data: profile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();

  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message === "User is already authenticated"
        ) {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const getDashboardLink = () => {
    if (!isAuthenticated) return null;
    // Admin users do NOT get a nav link — they access admin via /admin-login directly
    if (isAdmin) return null;
    if (profile?.appRole === AppUserRole.editor)
      return { href: "/editor", label: "Editor", Icon: Briefcase };
    return { href: "/client", label: "My Jobs", Icon: Briefcase };
  };

  const dashLink = getDashboardLink();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          to="/"
          data-ocid="nav.link"
          className="flex items-center gap-2.5 group"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground">
            <Film className="w-4.5 h-4.5" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            Video<span className="text-primary">Edit</span> Pro
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            data-ocid="nav.link"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === "/" ? "text-foreground" : "text-muted-foreground",
            )}
          >
            Home
          </Link>
          {isAuthenticated && dashLink && (
            <Link
              to={dashLink.href as "/admin" | "/editor" | "/client"}
              data-ocid="nav.link"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname.startsWith(dashLink.href)
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <span className="flex items-center gap-1.5">
                <dashLink.Icon className="w-3.5 h-3.5" />
                {dashLink.label}
              </span>
            </Link>
          )}
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {isAuthenticated && profile && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-3.5 h-3.5" />
              <span className="max-w-[120px] truncate">{profile.name}</span>
            </div>
          )}
          <Button
            data-ocid="auth.login_button"
            variant={isAuthenticated ? "outline" : "default"}
            size="sm"
            onClick={handleAuth}
            disabled={isLoggingIn}
            className={cn(
              "gap-2",
              !isAuthenticated &&
                "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Signing in…
              </>
            ) : isAuthenticated ? (
              <>
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
