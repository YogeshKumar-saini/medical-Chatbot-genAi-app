import React, { InputHTMLAttributes, forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
    (
        {
            label,
            error,
            helperText,
            className,
            id,
            ...props
        },
        ref
    ) => {
        const [showPassword, setShowPassword] = useState(false);
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

        const baseStyles =
            'w-full rounded-lg border bg-white dark:bg-gray-800 px-4 py-2 pr-10 text-gray-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

        const errorStyles = error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500';

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        ref={ref}
                        id={inputId}
                        type={showPassword ? 'text' : 'password'}
                        className={clsx(baseStyles, errorStyles, className)}
                        {...props}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        {showPassword ? (
                            <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                            <EyeIcon className="h-5 w-5" />
                        )}
                    </button>
                </div>
                {error && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
                {helperText && !error && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

PasswordInput.displayName = 'PasswordInput';
