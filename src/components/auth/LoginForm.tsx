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
import { requestOtpSchema, RequestOtpFormData, loginWithOtpSchema, LoginWithOtpFormData } from "@/src/schemas/admin";
import authService from "@/src/services/auth.service";

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [userEmail, setUserEmail] = useState<string>("");
  const [resendTimer, setResendTimer] = useState(0);

  // Get return URL from query params
  const getReturnUrl = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('returnUrl') || '/';
    }
    return '/';
  };

  // Step 1: Request OTP form
  const emailForm = useForm<RequestOtpFormData>({
    resolver: zodResolver(requestOtpSchema),
  });

  // Step 2: Login with OTP and password form
  const loginForm = useForm<LoginWithOtpFormData>({
    resolver: zodResolver(loginWithOtpSchema),
  });

  React.useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Step 1: Request OTP
  const onEmailSubmit = async (data: RequestOtpFormData) => {
    try {
      setError(null);
      
      // Call backend API to request OTP
      await authService.requestOtp(data.email);
      
      // Move to step 2
      setUserEmail(data.email);
      setStep('otp');
      setResendTimer(60);
      loginForm.setValue('email', data.email);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please check your email.');
    }
  };

  // Step 2: Login with OTP and password
  const onLoginSubmit = async (data: LoginWithOtpFormData) => {
    try {
      setError(null);
      
      // Login with OTP and password
      const result = await authService.loginWithOtp({
        email: data.email,
        otp: data.otp,
        password: data.password,
      });
      
      // Store auth data
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('admin', JSON.stringify(result.admin));
      
      // Set cookies for middleware
      document.cookie = `auth_token=${result.token}; path=/; max-age=604800`; // 7 days
      document.cookie = `jwt=${result.token}; path=/; max-age=604800`; // 7 days
      
      console.log('Login successful, admin data:', result.admin);
      
      // Redirect to return URL or dashboard
      const returnUrl = getReturnUrl();
      console.log('Login successful, redirecting to:', returnUrl);
      router.push(returnUrl);
      router.refresh(); // Force refresh to update middleware
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    try {
      setError(null);
      // Request new OTP from backend
      await authService.requestOtp(userEmail);
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
              {step === 'otp' ? (
                <ShieldCheck className="w-10 h-10 text-gray-900" />
              ) : (
                <CloudLightning className="w-10 h-10 text-gray-900" />
              )}
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">
              {step === 'otp' ? "Verify & Login" : "IITian Squad Admin"}
            </CardTitle>
            <CardDescription>
              {step === 'otp' 
                ? `Enter OTP sent to ${userEmail} and your password`
                : "Enter your email to receive OTP"
              }
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {step === 'email' ? (
            // Step 1: Request OTP with email
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  {...emailForm.register("email")}
                  className={emailForm.formState.errors.email ? "border-red-500" : ""}
                  autoFocus
                />
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-red-500">{emailForm.formState.errors.email.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium"
                disabled={emailForm.formState.isSubmitting}
              >
                {emailForm.formState.isSubmitting ? "Sending OTP..." : "Send OTP"}
              </Button>

              <div className="mt-6 text-center text-sm text-gray-600">
                <p>Need access? Contact your super admin</p>
              </div>
            </form>
          ) : (
            // Step 2: Login with OTP and password
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
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

              <input type="hidden" {...loginForm.register("email")} />

              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  {...loginForm.register("otp")}
                  className={`text-center text-2xl tracking-widest ${loginForm.formState.errors.otp ? "border-red-500" : ""}`}
                  autoComplete="off"
                  autoFocus
                />
                {loginForm.formState.errors.otp && (
                  <p className="text-sm text-red-500">{loginForm.formState.errors.otp.message}</p>
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
                  setStep('email');
                  setError(null);
                  loginForm.reset();
                  emailForm.reset();
                }}
                className="w-full"
              >
                Back to Email
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
