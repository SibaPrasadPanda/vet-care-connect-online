
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'agent' | 'admin';
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: User['role']) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data - in a real app this would come from your backend
const mockUsers = [
  {
    id: '1',
    name: 'John Patient',
    email: 'patient@example.com',
    password: 'password',
    role: 'patient' as const,
  },
  {
    id: '2',
    name: 'Dr. Sarah',
    email: 'doctor@example.com',
    password: 'password',
    role: 'doctor' as const,
  },
  {
    id: '3',
    name: 'Alex Agent',
    email: 'agent@example.com',
    password: 'password',
    role: 'agent' as const,
  },
  {
    id: '4',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password',
    role: 'admin' as const,
  },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('vetcare_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user', error);
        localStorage.removeItem('vetcare_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user with matching credentials
      const foundUser = mockUsers.find(
        (u) => u.email === email && u.password === password
      );
      
      if (!foundUser) {
        throw new Error('Invalid email or password');
      }
      
      // Create user object without password
      const { password: _, ...userWithoutPassword } = foundUser;
      
      // Set user state and store in localStorage
      setUser(userWithoutPassword);
      localStorage.setItem('vetcare_user', JSON.stringify(userWithoutPassword));
      
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${userWithoutPassword.name}!`,
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: User['role']) => {
    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user already exists
      if (mockUsers.some((u) => u.email === email)) {
        throw new Error('Email already in use');
      }
      
      // Create new user
      const newUser = {
        id: `${mockUsers.length + 1}`,
        name,
        email,
        role,
      };
      
      // Set user state and store in localStorage
      setUser(newUser);
      localStorage.setItem('vetcare_user', JSON.stringify(newUser));
      
      toast({
        title: 'Registration Successful',
        description: 'Your account has been created',
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vetcare_user');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out',
    });
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
