"use client";
import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Eye, EyeOff } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc'; // Ensure you have installed react-icons
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BACKEND_URL } from '../../config';

function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('login'); // Default to login
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  
  // Validation state
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');

  const validatePassword = (password: string): string => {
    // Basic validation logic
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear errors on change
    if (name === 'password' && activeTab === 'signup') {
        const error = validatePassword(value);
        setPasswordError(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (activeTab === 'signup' && passwordError) {
      return;
    }

    setLoading(true);
    try {
      const endpoint = activeTab === 'signup' ? `${BACKEND_URL}/signup` : `${BACKEND_URL}/signin`;
      
      // 🛠️ MAPPING FIX: 
      // Backend expects 'username' (which is the email) and 'name' (which is the display name)
      const payload = activeTab === 'signup' 
        ? { 
            username: formData.email, // Send Email as Username
            password: formData.password,
            name: formData.username   // Send Username as Name
          }
        : { 
            username: formData.email, // Send Email as Username
            password: formData.password 
          };
      
      const response = await axios.post(endpoint, payload);

      if (response.status === 200 || response.status === 201) {
        toast.success(activeTab === 'signup' ? 'Account created!' : 'Welcome back!', { theme: 'dark' });
        
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          setTimeout(() => router.push('/dashboard'), 500); // Redirect to dashboard
        } else if (activeTab === 'signup') {
          setActiveTab('login'); // Switch to login after signup
        }
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Authentication failed";
      setFormError(msg);
      toast.error(msg, { theme: 'dark' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to your backend Google Auth route
    window.location.href = `${BACKEND_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      
      <div className="w-full max-w-[400px]">
        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* LOGIN CONTENT */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Enter your credentials to access your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="m@example.com" value={formData.email} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleInputChange} required />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    {formError && <p className="text-red-500 text-xs">{formError}</p>}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                </form>

                {/* GOOGLE BUTTON POSITIONED HERE
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>
                <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin}>
                    <FcGoogle className="mr-2 h-4 w-4" />
                    Google
                </Button> */}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SIGNUP CONTENT */}
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Enter your details to create a new account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" name="username" placeholder="johndoe" value={formData.username} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email_signup">Email</Label>
                        <Input id="email_signup" name="email" type="email" placeholder="m@example.com" value={formData.email} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password_signup">Password</Label>
                        <div className="relative">
                            <Input id="password_signup" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleInputChange} required />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {passwordError && <p className="text-red-500 text-xs">{passwordError}</p>}
                    </div>
                    {formError && <p className="text-red-500 text-xs">{formError}</p>}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </Button>
                </form>

                 {/* GOOGLE BUTTON POSITIONED HERE
                 <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>
                <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin}>
                    <FcGoogle className="mr-2 h-4 w-4" />
                    Google
                </Button> */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default AuthPage;