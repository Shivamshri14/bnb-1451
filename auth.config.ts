import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  // Edge middleware + Vercel custom domain
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
      const isLoginRoute = nextUrl.pathname === "/login";
      const isPublicRoute =
        nextUrl.pathname === "/signup" || nextUrl.pathname === "/forgot-password";

      if (isApiAuthRoute) return true;

      if (isLoginRoute || isPublicRoute) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) return false;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.name;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.username as string;
        session.user.email = (token.email as string) || "";
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
