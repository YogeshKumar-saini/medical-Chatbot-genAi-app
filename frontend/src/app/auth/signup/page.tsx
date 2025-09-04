'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus, Stethoscope, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn, validateUsername, validatePassword } from '@/utils';
import type { SignupForm, UserRole } from '@/types';

const roles: { value: UserRole; label: string; description: string }[] = [
  { value: 'patient', label: 'Patient', description: 'Access medical information and get personalized health insights' },
  { value: 'doctor', label: 'Doctor', description: 'Advanced medical tools and comprehensive patient data access' },
  { value: 'nurse', label: 'Nurse', description: 'Clinical support tools and patient care documentation' },
  { value: 'admin', label: 'Administrator', description: 'Full system access and document management' },
  { value: 'other', label: 'Other', description: 'General access to medical information' },
];

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SignupForm>({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Client-side validation
    const usernameValidation = validateUsername(formData.username);
    const passwordValidation = validatePassword(formData.password);

    if (!usernameValidation.isValid) {
      setError(usernameValidation.errors[0]);
      setIsLoading(false);
      return;
    }

    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await apiClient.signup({
        username: formData.username,
        password: formData.password,
        role: formData.role,
      });

      // Automatically login after successful signup
      try {
        const loginResponse = await apiClient.login(formData.username, formData.password);

        // Store auth data
        localStorage.setItem('username', formData.username);
        localStorage.setItem('password', formData.password);
        localStorage.setItem('role', loginResponse.role);

        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } catch (loginErr: any) {
        console.error('Auto-login failed:', loginErr);
        // If auto-login fails, still show success but redirect to login
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Signup error:', err);

      // Provide more specific error messages
      let errorMessage = 'Signup failed. Please try again.';
      if (err.response?.status === 400) {
        if (err.response.data?.detail?.includes('already exists')) {
          errorMessage = 'Username already exists. Please choose a different username.';
        } else {
          errorMessage = err.response.data?.detail || 'Invalid signup data. Please check your input.';
        }
      } else if (err.response?.status === 429) {
        errorMessage = 'Too many signup attempts. Please try again later.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again in a few minutes.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Account Created!</h2>
            <p className="text-gray-600 mb-6">
              Your account has been successfully created. Logging you in and redirecting to your dashboard...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MediAI Pro</h1>
          <p className="text-gray-600">Join our advanced medical AI community</p>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600">Get started with personalized medical AI assistance</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                placeholder="Choose a unique username"
              />
              <p className="text-xs text-gray-500 mt-1">
                3-50 characters, letters, numbers, and underscores only
              </p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  placeholder="Create a secure password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                At least 8 characters with letters and numbers
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-3">
                Your Role
              </label>
              <div className="space-y-2">
                {roles.map((role) => (
                  <label
                    key={role.value}
                    className={cn(
                      "flex items-start p-3 border rounded-lg cursor-pointer transition-colors",
                      formData.role === role.value
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={formData.role === role.value}
                      onChange={handleInputChange}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">{role.label}</div>
                      <div className="text-sm text-gray-600">{role.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors",
                isLoading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              )}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 MediAI Pro. Advanced medical AI technology.</p>
        </div>
      </div>
    </div>
  );
}