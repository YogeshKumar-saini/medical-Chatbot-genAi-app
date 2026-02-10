import React, { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'bordered';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'default',
    padding = 'md',
    hover = false,
    className,
    ...props
}) => {
    const baseStyles = 'rounded-xl transition-all duration-200';

    const variants = {
        default: 'bg-white dark:bg-gray-800 shadow-lg',
        glass:
            'bg-white/10 dark:bg-gray-800/10 backdrop-blur-lg border border-white/20 dark:border-gray-700/20',
        bordered:
            'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700',
    };

    const paddings = {
        none: '',
        sm: 'p-3',
        md: 'p-6',
        lg: 'p-8',
    };

    const hoverStyles = hover
        ? 'hover:shadow-xl hover:scale-[1.02] cursor-pointer'
        : '';

    return (
        <div
            className={clsx(
                baseStyles,
                variants[variant],
                paddings[padding],
                hoverStyles,
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({
    children,
    className,
    ...props
}) => {
    return (
        <div className={clsx('mb-4', className)} {...props}>
            {children}
        </div>
    );
};

export const CardTitle: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({
    children,
    className,
    ...props
}) => {
    return (
        <h3
            className={clsx(
                'text-xl font-bold text-gray-900 dark:text-white',
                className
            )}
            {...props}
        >
            {children}
        </h3>
    );
};

export const CardDescription: React.FC<HTMLAttributes<HTMLParagraphElement>> = ({
    children,
    className,
    ...props
}) => {
    return (
        <p
            className={clsx('text-sm text-gray-600 dark:text-gray-400', className)}
            {...props}
        >
            {children}
        </p>
    );
};

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const CardContent: React.FC<CardContentProps> = ({
    children,
    padding = 'none',
    className,
    ...props
}) => {
    const paddings = {
        none: '',
        sm: 'p-3',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <div className={clsx(paddings[padding], className)} {...props}>
            {children}
        </div>
    );
};


export const CardFooter: React.FC<HTMLAttributes<HTMLDivElement>> = ({
    children,
    className,
    ...props
}) => {
    return (
        <div className={clsx('mt-4 flex items-center gap-2', className)} {...props}>
            {children}
        </div>
    );
};
