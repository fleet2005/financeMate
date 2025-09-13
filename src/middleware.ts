import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/stocks(.*)',
  '/portfolio(.*)',
  '/api/expenses(.*)',
  '/api/suggestions(.*)',
  '/api/budgets(.*)',
  '/api/stocks(.*)',
  '/api/portfolios(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
