import React from 'react';

const InputField = ({ label, icon: Icon, required, ...props }) => (
    <div className="group">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {Icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none rtl:right-0 rtl:left-auto rtl:pr-3 rtl:pl-0 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Icon />
                </div>
            )}
            <input
                {...props}
                className={`block w-full rounded-xl border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-white transition-all duration-200 
                focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none
                shadow-sm py-3 ${Icon ? 'pl-10 rtl:pr-10 rtl:pl-3' : 'px-4'} ${props.className || ''}`}
            />
        </div>
    </div>
);

export default InputField;