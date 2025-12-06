import React, { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            className,
            id,
            ...props
        },
        ref
    ) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

        const baseStyles =
            'w-full rounded-lg border bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

        const errorStyles = error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500';

        const iconPadding = leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '';

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
                    {leftIcon && (
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={clsx(baseStyles, errorStyles, iconPadding, className)}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400">
                            {rightIcon}
                        </div>
                    )}
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

Input.displayName = 'Input';

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, helperText, className, id, ...props }, ref) => {
        const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

        const baseStyles =
            'w-full rounded-lg border bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none';

        const errorStyles = error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500';

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={textareaId}
                        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textareaId}
                    className={clsx(baseStyles, errorStyles, className)}
                    {...props}
                />
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

Textarea.displayName = 'Textarea';
