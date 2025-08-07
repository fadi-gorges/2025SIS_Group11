'use client'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useAuthActions } from '@convex-dev/auth/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, NotebookPenIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { loginSchema, signupSchema, type LoginData, type SignupData } from '../../../convex/validation'

type AuthFormProps = {
  type: 'login' | 'signup'
} & React.ComponentProps<'div'>

const AuthForm = ({ className, type, ...props }: AuthFormProps) => {
  const { signIn } = useAuthActions()
  const [isLoading, setIsLoading] = useState(false)

  const isSignup = type === 'signup'
  const schema = isSignup ? signupSchema : loginSchema

  const form = useForm<LoginData | SignupData>({
    resolver: zodResolver(schema),
    defaultValues: isSignup ? { name: '', email: '', password: '', confirmPassword: '' } : { email: '', password: '' },
  })

  const onSubmit = async (data: LoginData | SignupData) => {
    setIsLoading(true)

    try {
      if (isSignup) {
        const signupData = data as SignupData
        await signIn('password', {
          name: signupData.name,
          email: signupData.email,
          password: signupData.password,
          flow: 'signUp',
        })
      } else {
        const loginData = data as LoginData
        await signIn('password', {
          email: loginData.email,
          password: loginData.password,
          flow: 'signIn',
        })
      }
    } catch (error) {
      console.error('Auth error:', error)
      toast.error('Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)

    try {
      // Note: Google OAuth would need to be configured in convex/auth.config.ts
      // For now, we'll show an error message
      toast.error('Google sign-in is not configured yet')
    } catch (error) {
      console.error('Google sign-in error:', error)
      toast.error('Google sign-in failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex w-full max-w-sm flex-col gap-6', className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <Link href="/" className="flex flex-col items-center gap-2 font-medium">
                <div className="flex size-8 items-center justify-center rounded-md">
                  <NotebookPenIcon className="size-6" />
                </div>
                <span className="sr-only">StudyPlanner</span>
              </Link>
              <h1 className="text-xl font-bold">Welcome to StudyPlanner</h1>
              {type === 'login' && (
                <div className="text-center text-sm">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="underline underline-offset-4">
                    Sign up
                  </Link>
                </div>
              )}
              {type === 'signup' && (
                <div className="text-center text-sm">
                  Already have an account?{' '}
                  <Link href="/login" className="underline underline-offset-4">
                    Login
                  </Link>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              {isSignup && (
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="m@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isSignup && (
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignup ? 'Create Account' : 'Sign In'}
              </Button>
            </div>

            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-background text-muted-foreground relative z-10 px-2">Or</span>
            </div>

            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Continue with Google
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default AuthForm
