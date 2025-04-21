
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const { login, isLoading } = useAuth();
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const onSubmit = async (data: LoginFormData) => {
    await login(data.email, data.password);
  };
  
  return (
    <Layout>
      <div className="container max-w-md py-12">
        <div className="flex flex-col items-center mb-8">
          <PawPrint className="h-12 w-12 text-vet-primary mb-2" />
          <h1 className="text-2xl font-bold">Login to VetCare Connect</h1>
          <p className="text-muted-foreground text-center mt-2">
            Enter your credentials to access your account
          </p>
        </div>
        
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your@email.com" {...field} />
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
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full bg-vet-primary hover:bg-vet-dark"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-vet-primary hover:underline">
                Register
              </Link>
            </p>
          </div>
          
          <div className="mt-8 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground mb-2">Demo Accounts:</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Patient: patient@example.com / password</p>
              <p>Doctor: doctor@example.com / password</p>
              <p>Agent: agent@example.com / password</p>
              <p>Admin: admin@example.com / password</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
