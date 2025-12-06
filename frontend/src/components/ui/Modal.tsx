import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md',
    showCloseButton = true,
}) => {
    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-7xl',
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel
                                className={clsx(
                                    'w-full transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all',
                                    sizes[size]
                                )}
                            >
                                {(title || showCloseButton) && (
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            {title && (
                                                <Dialog.Title
                                                    as="h3"
                                                    className="text-xl font-bold text-gray-900 dark:text-white"
                                                >
                                                    {title}
                                                </Dialog.Title>
                                            )}
                                            {description && (
                                                <Dialog.Description className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                    {description}
                                                </Dialog.Description>
                                            )}
                                        </div>
                                        {showCloseButton && (
                                            <button
                                                onClick={onClose}
                                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                            >
                                                <XMarkIcon className="h-6 w-6" />
                                            </button>
                                        )}
                                    </div>
                                )}
                                <div>{children}</div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export const ModalFooter: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    return (
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
            {children}
        </div>
    );
};
