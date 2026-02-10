import React, { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md' | 'lg';
    dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    size = 'md',
    dot = false,
    className,
    ...props
}) => {
    const baseStyles =
        'inline-flex items-center font-medium rounded-full transition-all duration-200';

    const variants = {
        default:
            'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
        success:
            'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
        warning:
            'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
        danger:
            'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
        info:
            'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base',
    };

    const dotColors = {
        default: 'bg-gray-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        danger: 'bg-red-500',
        info: 'bg-blue-500',
    };

    return (
        <span
            className={clsx(baseStyles, variants[variant], sizes[size], className)}
            {...props}
        >
            {dot && (
                <span
                    className={clsx('mr-1.5 h-2 w-2 rounded-full', dotColors[variant])}
                />
            )}
            {children}
        </span>
    );
};
