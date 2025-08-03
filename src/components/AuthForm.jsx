'use client';

import { use, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import useFetch from '@/hooks/useFetch';
import { toast } from 'sonner';
import { useUser } from '@/context/UserContext';
import FormField from './ui/FormField';
import { useRouter } from 'next/navigation';

export function AuthForm({ className, pathname = 'login', ...props }) {
  const isSignup = pathname === 'signup';
  const { setUser } = useUser();

  // Zod schemas
  const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1, 'Name is required'),
    age: z.coerce.number().int().positive(),
    profile: z.string().url('Profile must be a valid URL'),
  });

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required'),
  });

  const formSchema = isSignup ? signupSchema : loginSchema;
const router = useRouter();


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
  });

  const { refetch, isLoading } = useFetch({
    url: `/api/${isSignup ? 'signup' : 'login'}`,
    method: 'POST',
    auto: false,
    withAuth: true,
    onSuccess: (res) => {
      console.log('✅ Logged in:', res);
      setUser(res.user);
      router.push('/dashboard'); 
    },
    onError: (err) => {
      toast.error(err.message || 'An error occurred');
    },
  });

  const onSubmit = (data) => {
    refetch({ payload: data });
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">
                  {isSignup ? 'Create an account' : 'Welcome back'}
                </h1>
                <p className="text-muted-foreground text-balance">
                  {isSignup
                    ? 'Sign up for an Acme Inc account'
                    : 'Login to your Acme Inc account'}
                </p>
              </div>

              {/* Email */}
              <FormField
                id="email"
                label="Email"
                placeholder="you@example.com"
                register={register}
                errors={errors}
                type="email"
              />

              {/* Password */}
              <FormField
                id="password"
                label="Password"
                placeholder="Your password"
                register={register}
                errors={errors}
                isSecret={true}
              />

              {/* Additional signup fields */}
              {isSignup && (
                <>
                  <FormField
                    id="name"
                    label="Name"
                    placeholder="Your full name"
                    register={register}
                    errors={errors}
                  />

                  <FormField
                    id="age"
                    label="Age"
                    placeholder="Your age"
                    register={register}
                    errors={errors}
                    type="number"
                  />

                  <FormField
                    id="profile"
                    label="Profile Image URL"
                    placeholder="https://example.com/profile.jpg"
                    register={register}
                    errors={errors}
                    type="url"
                  />
                </>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isSignup ? 'Sign up' : isLoading ? 'Logging in...' : 'Login'}
              </Button>

              <div className="text-center text-sm">
                {isSignup ? (
                  <>
                    Already have an account?{' '}
                    <Link href="/login" className="underline underline-offset-4">
                      Login
                    </Link>
                  </>
                ) : (
                  <>
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="underline underline-offset-4">
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </form>

          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholder.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>

      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and{' '}
        <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
