import React, { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
    src?: string;
    alt?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    fallback?: string;
    status?: 'online' | 'offline' | 'away' | 'busy';
}

export const Avatar: React.FC<AvatarProps> = ({
    src,
    alt = 'Avatar',
    size = 'md',
    fallback,
    status,
    className,
    ...props
}) => {
    const sizes = {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
        xl: 'w-16 h-16 text-xl',
    };

    const statusColors = {
        online: 'bg-green-500',
        offline: 'bg-gray-400',
        away: 'bg-yellow-500',
        busy: 'bg-red-500',
    };

    const statusSizes = {
        xs: 'w-1.5 h-1.5',
        sm: 'w-2 h-2',
        md: 'w-2.5 h-2.5',
        lg: 'w-3 h-3',
        xl: 'w-4 h-4',
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className={clsx('relative inline-block', className)} {...props}>
            <div
                className={clsx(
                    'rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold',
                    sizes[size]
                )}
            >
                {src ? (
                    <img src={src} alt={alt} className="w-full h-full object-cover" />
                ) : (
                    <span>{fallback ? getInitials(fallback) : '?'}</span>
                )}
            </div>
            {status && (
                <span
                    className={clsx(
                        'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-gray-800',
                        statusColors[status],
                        statusSizes[size]
                    )}
                />
            )}
        </div>
    );
};
