import { SignInButton } from '@clerk/tanstack-react-start'
import { Link, useLocation } from '@tanstack/react-router'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import {
  ArrowLeft,
  KeyRound,
  LayoutDashboard,
  LogIn,
  ShieldCheck,
  Sparkles,
  UserPlus,
  MailCheck,
} from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Card, Input, Label } from '@/components/ui'
import { useAppAuth } from '@/shared/lib/auth/app-auth'
import {
  getClerkPublishableKey,
  isBetterAuthEnabled,
  isClerkEnabled,
} from '@/shared/lib/auth/config'
import {
  AUTH_SIGN_UP_NAME_HTML_PATTERN,
  AUTH_SIGN_UP_PASSWORD_HTML_PATTERN,
  AUTH_SIGN_UP_MIN_PASSWORD_LENGTH,
  type SignUpValidationErrorCode,
} from '@/shared/lib/auth/sign-up-validation'

type AuthTab = 'sign-in' | 'sign-up' | 'forgot-password'

function readSearchParams(searchStr: string) {
  const normalizedSearch = searchStr.startsWith('?') ? searchStr.slice(1) : searchStr
  return new URLSearchParams(normalizedSearch)
}

function getRequestedAuthTab(searchStr: string): AuthTab {
  const requestedTab = readSearchParams(searchStr).get('tab')
  if (requestedTab === 'sign-in' || requestedTab === 'sign-up') {
    return requestedTab
  }
  return 'sign-in'
}

function getRequestedAuthError(
  searchStr: string,
  translate: (key: string) => string,
): string | null {
  const searchParams = readSearchParams(searchStr)
  const errorCode = searchParams.get('errorCode')
  const errorMessage = searchParams.get('errorMessage')

  if (errorCode === 'AUTH_NAME_REQUIRED' || errorCode === 'AUTH_PASSWORD_TOO_WEAK') {
    return getLocalizedSignUpValidationMessage(errorCode, translate)
  }

  if (typeof errorMessage === 'string' && errorMessage.length > 0) {
    return errorMessage
  }

  return null
}

function getLocalizedSignUpValidationMessage(
  code: SignUpValidationErrorCode,
  translate: (key: string) => string,
): string {
  switch (code) {
    case 'AUTH_NAME_REQUIRED':
      return translate('auth.nameRequiredError')
    case 'AUTH_PASSWORD_TOO_WEAK':
      return translate('auth.passwordWeakError').replace(
        '{{min}}',
        String(AUTH_SIGN_UP_MIN_PASSWORD_LENGTH),
      )
  }
}

export function AuthPage(): React.JSX.Element {
  const { t } = useTranslation()
  const searchStr = useLocation({ select: (location) => location.searchStr })
  const auth = useAppAuth()

  // Set active tab in component state initialized from search parameters
  const [activeTab, setActiveTab] = React.useState<AuthTab>(() => getRequestedAuthTab(searchStr))

  // Track recovery email submissions
  const [resetEmail, setResetEmail] = React.useState('')
  const [resetSubmitted, setResetSubmitted] = React.useState(false)

  const requestedFormError = getRequestedAuthError(searchStr, t)
  const [signInValues, setSignInValues] = React.useState({
    email: '',
    password: '',
  })
  const [signUpValues, setSignUpValues] = React.useState({
    name: '',
    email: '',
    password: '',
  })
  const formError = requestedFormError

  const localAuthEnabled = isBetterAuthEnabled()
  const clerkAuthEnabled = isClerkEnabled() && !!getClerkPublishableKey()

  const heroGlowStyle: React.CSSProperties = {
    backgroundImage:
      'radial-gradient(circle at top left, rgba(14,165,233,0.12), transparent 28%), radial-gradient(circle at 80% 20%, rgba(16,185,129,0.1), transparent 32%), radial-gradient(circle at bottom right, rgba(245,158,11,0.08), transparent 35%)',
  }
  const heroGridStyle: React.CSSProperties = {
    backgroundImage:
      'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
    backgroundSize: '32px 32px',
  }

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (resetEmail.trim()) {
      setResetSubmitted(true)
    }
  }

  return (
    <LazyMotion features={domAnimation}>
      <main className="relative min-h-screen overflow-hidden bg-background text-foreground flex flex-col justify-between">
        <div className="absolute inset-0" style={heroGlowStyle} />
        {/* Subtle grid background with 15% opacity to avoid competing with forms */}
        <div className="absolute inset-0 opacity-15" style={heroGridStyle} />
        <div className="absolute left-[8%] top-24 h-52 w-52 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-[12%] top-40 h-72 w-72 rounded-full bg-emerald-500/5 blur-3xl" />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col justify-center px-4 py-8 md:py-12 flex-grow">
          {/* Header Action Menu */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="border border-border/40 hover:bg-secondary/40"
            >
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                {t('auth.backHome', 'Back to home')}
              </Link>
            </Button>

            {auth.isAuthenticated && (
              <Button size="sm" asChild className="hover:-translate-y-0.5 transition-all">
                <Link to="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  {t('auth.goDashboard', 'Go to dashboard')}
                </Link>
              </Button>
            )}
          </div>

          {/* Clean 2-column height-aligned grid */}
          <div className="grid gap-8 lg:grid-cols-2 items-stretch">
            {/* Left Column: Marketing card */}
            <m.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex"
            >
              <Card className="flex flex-col justify-between p-8 md:p-10 w-full rounded-[2rem] border-border/50 bg-card/45 shadow-xl backdrop-blur-md min-h-[460px]">
                <div className="space-y-6">
                  <div>
                    <Badge
                      variant="outline"
                      className="mb-4 rounded-full border-primary/20 bg-primary/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-primary"
                    >
                      Authentication
                    </Badge>
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-balance">
                      Workspace access
                    </h1>
                    <h2 className="text-lg font-bold tracking-tight text-foreground/80 mt-2">
                      Sign in once. Keep moving.
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground mt-3">
                      Use the method you already use. Same workspace, no extra steps.
                    </p>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    <div className="flex items-start gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
                        <KeyRound className="h-3 w-3" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Use the same account you recognize
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Switch methods without changing your destination
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
                        <ShieldCheck className="h-3 w-3" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Continue right where you need to work
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-border/30 text-xs text-muted-foreground">
                  Secure access is encrypted via end-to-end token handshakes. Support response SLA:
                  24–48h.
                </div>
              </Card>
            </m.div>

            {/* Right Column: Form card */}
            <m.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05, ease: 'easeOut' }}
              className="flex"
            >
              <Card className="flex flex-col justify-between p-8 md:p-10 w-full rounded-[2rem] border-border/50 bg-card/65 shadow-xl backdrop-blur-md min-h-[460px]">
                <div className="space-y-6">
                  {/* Selector tabs Sign in / Create account */}
                  {activeTab !== 'forgot-password' && (
                    <div
                      role="tablist"
                      aria-label="Access modes selector"
                      className="grid w-full grid-cols-2 rounded-2xl border border-border/40 bg-muted/40 p-1"
                    >
                      <button
                        onClick={() => setActiveTab('sign-in')}
                        role="tab"
                        aria-selected={activeTab === 'sign-in'}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                          activeTab === 'sign-in'
                            ? 'bg-background text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <LogIn className="h-3.5 w-3.5" />
                        Sign in
                      </button>
                      <button
                        onClick={() => setActiveTab('sign-up')}
                        role="tab"
                        aria-selected={activeTab === 'sign-up'}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                          activeTab === 'sign-up'
                            ? 'bg-background text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Create account
                      </button>
                    </div>
                  )}

                  {/* Header labels */}
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-foreground">
                      {activeTab === 'forgot-password'
                        ? 'Reset your password'
                        : 'Email and password'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activeTab === 'forgot-password'
                        ? "Enter your email address and we'll send you a recovery link."
                        : 'Sign in with the account you use every day.'}
                    </p>
                  </div>

                  {/* Display validation warning callouts */}
                  {formError && activeTab !== 'forgot-password' && (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs text-destructive">
                      {formError}
                    </div>
                  )}

                  {!localAuthEnabled && (
                    <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground">Local Auth Disabled</p>
                      <p className="mt-1">
                        Credentials database is currently off. Please use dynamic identity logins.
                      </p>
                    </div>
                  )}

                  {/* Form fields rendering */}
                  {localAuthEnabled && activeTab === 'sign-in' && (
                    <form className="space-y-4" action="/auth/sign-in" method="post">
                      <div className="space-y-1.5">
                        <Label htmlFor="sign-in-email">Email address</Label>
                        <Input
                          id="sign-in-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@company.com"
                          className="h-11 rounded-xl"
                          required
                          value={signInValues.email}
                          onChange={(e) =>
                            setSignInValues((prev) => ({ ...prev, email: e.target.value }))
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="sign-in-password">Password</Label>
                          <button
                            type="button"
                            onClick={() => {
                              setResetSubmitted(false)
                              setActiveTab('forgot-password')
                            }}
                            className="text-xs font-semibold text-primary hover:underline bg-transparent border-0 cursor-pointer"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <Input
                          id="sign-in-password"
                          name="password"
                          type="password"
                          autoComplete="current-password"
                          placeholder="Your account password"
                          className="h-11 rounded-xl"
                          required
                          value={signInValues.password}
                          onChange={(e) =>
                            setSignInValues((prev) => ({ ...prev, password: e.target.value }))
                          }
                        />
                      </div>

                      <Button
                        type="submit"
                        className="h-11 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 transition-all flex items-center justify-center gap-2 mt-2 font-semibold"
                      >
                        <LogIn className="h-4 w-4" />
                        Enter workspace
                      </Button>
                    </form>
                  )}

                  {localAuthEnabled && activeTab === 'sign-up' && (
                    <form className="space-y-4" action="/auth/sign-up" method="post">
                      <div className="space-y-1.5">
                        <Label htmlFor="sign-up-name">Full name</Label>
                        <Input
                          id="sign-up-name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          pattern={AUTH_SIGN_UP_NAME_HTML_PATTERN}
                          placeholder="Jane Doe"
                          className="h-11 rounded-xl"
                          required
                          value={signUpValues.name}
                          onChange={(e) =>
                            setSignUpValues((prev) => ({ ...prev, name: e.target.value }))
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="sign-up-email">Email address</Label>
                        <Input
                          id="sign-up-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@company.com"
                          className="h-11 rounded-xl"
                          required
                          value={signUpValues.email}
                          onChange={(e) =>
                            setSignUpValues((prev) => ({ ...prev, email: e.target.value }))
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="sign-up-password">Password</Label>
                        <Input
                          id="sign-up-password"
                          name="password"
                          type="password"
                          autoComplete="new-password"
                          minLength={AUTH_SIGN_UP_MIN_PASSWORD_LENGTH}
                          pattern={AUTH_SIGN_UP_PASSWORD_HTML_PATTERN}
                          placeholder="Create a strong password"
                          className="h-11 rounded-xl"
                          required
                          value={signUpValues.password}
                          onChange={(e) =>
                            setSignUpValues((prev) => ({ ...prev, password: e.target.value }))
                          }
                        />
                        <p className="text-[10px] text-muted-foreground pt-1">
                          Must contain at least {AUTH_SIGN_UP_MIN_PASSWORD_LENGTH} characters.
                        </p>
                      </div>

                      <Button
                        type="submit"
                        className="h-11 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 transition-all flex items-center justify-center gap-2 mt-2 font-semibold"
                      >
                        <LogIn className="h-4 w-4" />
                        Enter workspace
                      </Button>
                    </form>
                  )}

                  {/* Forgot Password Recovery View */}
                  {localAuthEnabled && activeTab === 'forgot-password' && (
                    <div className="space-y-4">
                      {resetSubmitted ? (
                        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center space-y-4 my-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
                            <MailCheck className="h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-sm text-foreground">Check your email</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              We have sent a password reset link to{' '}
                              <strong className="text-foreground">{resetEmail}</strong>.
                            </p>
                          </div>
                          <Button
                            type="button"
                            onClick={() => {
                              setResetSubmitted(false)
                              setResetEmail('')
                              setActiveTab('sign-in')
                            }}
                            className="h-9 rounded-xl w-full text-xs font-semibold"
                          >
                            Back to Sign in
                          </Button>
                        </div>
                      ) : (
                        <form className="space-y-4" onSubmit={handleResetSubmit}>
                          <div className="space-y-1.5">
                            <Label htmlFor="reset-email">Email address</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="you@company.com"
                              className="h-11 rounded-xl"
                              required
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                            />
                          </div>

                          <Button
                            type="submit"
                            className="h-11 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 transition-all flex items-center justify-center gap-2 mt-2 font-semibold"
                          >
                            Send reset link
                          </Button>

                          <div className="text-center pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setResetEmail('')
                                setActiveTab('sign-in')
                              }}
                              className="text-xs font-semibold text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer"
                            >
                              Back to Sign in
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>

                {/* SSO options area */}
                <div className="mt-8 pt-6 border-t border-border/30 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Another way to sign in
                  </span>

                  {clerkAuthEnabled ? (
                    <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                      <Button
                        variant="outline"
                        className="h-11 w-full rounded-xl border border-border/60 bg-background/50 hover:bg-background/80 transition-all flex items-center justify-center gap-2 font-semibold"
                      >
                        <span>Continue with Clerk SSO</span>
                      </Button>
                    </SignInButton>
                  ) : (
                    <div className="p-3.5 rounded-xl border border-dashed border-border/60 bg-muted/20 text-xs text-center text-muted-foreground font-medium">
                      Other methods are temporarily unavailable.
                    </div>
                  )}
                </div>
              </Card>
            </m.div>
          </div>
        </div>
      </main>
    </LazyMotion>
  )
}
