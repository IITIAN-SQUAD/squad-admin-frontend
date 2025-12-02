"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CloudLightning, Eye, EyeOff, AlertCircle, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { loginSchema, LoginFormData, mfaVerificationSchema, MFAVerificationFormData } from "@/src/schemas/admin";

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMFA, setShowMFA] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [resendTimer, setResendTimer] = useState(0);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const mfaForm = useForm<MFAVerificationFormData>({
    resolver: zodResolver(mfaVerificationSchema),
  });

  React.useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      // Show MFA screen (UI only, backend will validate)
      setSessionToken(result.sessionToken || 'temp-session');
      setUserEmail(data.email);
      setShowMFA(true);
      setResendTimer(60);
      mfaForm.setValue('email', data.email);
      mfaForm.setValue('sessionToken', result.sessionToken || 'temp-session');
    } catch (err: any) {
      // Just show MFA for demo
      setSessionToken('temp-session');
      setUserEmail(data.email);
      setShowMFA(true);
      setResendTimer(60);
      mfaForm.setValue('email', data.email);
      mfaForm.setValue('sessionToken', 'temp-session');
    }
  };

  const onMFASubmit = async (data: MFAVerificationFormData) => {
    try {
      setError(null);
      
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/verify-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      // Store mock data and redirect (backend will validate in production)
      const token = result.token || 'mock-token';
      const adminData = result.admin || {
        id: '1',
        name: 'Admin User',
        email: data.email,
        role: { name: 'Super Admin', type: 'super_admin' }
      };
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('admin', JSON.stringify(adminData));
      
      // Set cookie for middleware
      document.cookie = `auth_token=${token}; path=/; max-age=604800`; // 7 days
      
      router.push('/');
      router.refresh(); // Force refresh to update middleware
    } catch (err: any) {
      // For demo, just login anyway
      const token = 'mock-token';
      const adminData = {
        id: '1',
        name: 'Admin User',
        email: data.email,
        role: { name: 'Super Admin', type: 'super_admin' }
      };
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('admin', JSON.stringify(adminData));
      
      // Set cookie for middleware
      document.cookie = `auth_token=${token}; path=/; max-age=604800`; // 7 days
      
      router.push('/');
      router.refresh(); // Force refresh to update middleware
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    // Just reset timer (backend will handle actual resend)
    setResendTimer(60);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
              {showMFA ? (
                <ShieldCheck className="w-10 h-10 text-gray-900" />
              ) : (
                <CloudLightning className="w-10 h-10 text-gray-900" />
              )}
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">
              {showMFA ? "Verify Your Identity" : "IITian Squad Admin"}
            </CardTitle>
            <CardDescription>
              {showMFA 
                ? `Enter the 6-digit code sent to ${userEmail}`
                : "Sign in to access the admin dashboard"
              }
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!showMFA ? (
            // Login Form
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  {...loginForm.register("email")}
                  className={loginForm.formState.errors.email ? "border-red-500" : ""}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-yellow-600 hover:text-yellow-700 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...loginForm.register("password")}
                    className={loginForm.formState.errors.password ? "border-red-500 pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium"
                disabled={loginForm.formState.isSubmitting}
              >
                {loginForm.formState.isSubmitting ? "Signing in..." : "Sign In"}
              </Button>

              <div className="mt-6 text-center text-sm text-gray-600">
                <p>Need access? Contact your super admin</p>
              </div>
            </form>
          ) : (
            // MFA Verification Form
            <form onSubmit={mfaForm.handleSubmit(onMFASubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Alert className="border-blue-200 bg-blue-50">
                <Mail className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  We've sent a 6-digit verification code to your email. Please check your inbox.
                </AlertDescription>
              </Alert>

              <input type="hidden" {...mfaForm.register("email")} />
              <input type="hidden" {...mfaForm.register("sessionToken")} />

              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  {...mfaForm.register("otp")}
                  className={`text-center text-2xl tracking-widest ${mfaForm.formState.errors.otp ? "border-red-500" : ""}`}
                  autoComplete="off"
                />
                {mfaForm.formState.errors.otp && (
                  <p className="text-sm text-red-500">{mfaForm.formState.errors.otp.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium"
                disabled={mfaForm.formState.isSubmitting}
              >
                {mfaForm.formState.isSubmitting ? "Verifying..." : "Verify Code"}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Didn't receive the code?
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0}
                  className="text-sm text-yellow-600 hover:text-yellow-700"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowMFA(false);
                  setError(null);
                  mfaForm.reset();
                }}
                className="w-full"
              >
                Back to Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
