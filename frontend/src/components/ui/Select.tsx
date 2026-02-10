import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SelectProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    error?: string;
    helperText?: string;
    disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
    label,
    value,
    onChange,
    options,
    placeholder = 'Select an option',
    error,
    helperText,
    disabled = false,
}) => {
    const selected = options.find((opt) => opt.value === value);

    return (
        <div className="w-full">
            {label && (
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                </label>
            )}
            <Listbox value={value} onChange={onChange} disabled={disabled}>
                <div className="relative">
                    <Listbox.Button
                        className={clsx(
                            'relative w-full cursor-default rounded-lg border bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
                            error
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500',
                            disabled && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        <span className="block truncate text-gray-900 dark:text-white">
                            {selected?.label || placeholder}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                        </span>
                    </Listbox.Button>
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {options.map((option) => (
                                <Listbox.Option
                                    key={option.value}
                                    value={option.value}
                                    disabled={option.disabled}
                                    className={({ active }) =>
                                        clsx(
                                            'relative cursor-default select-none py-2 pl-10 pr-4',
                                            active
                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                                                : 'text-gray-900 dark:text-gray-100',
                                            option.disabled && 'opacity-50 cursor-not-allowed'
                                        )
                                    }
                                >
                                    {({ selected }) => (
                                        <>
                                            <span
                                                className={clsx(
                                                    'block truncate',
                                                    selected ? 'font-medium' : 'font-normal'
                                                )}
                                            >
                                                {option.label}
                                            </span>
                                            {selected && (
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
                                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                </span>
                                            )}
                                        </>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Transition>
                </div>
            </Listbox>
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
};
