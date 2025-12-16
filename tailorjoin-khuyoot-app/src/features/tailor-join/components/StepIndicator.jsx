import React from 'react';

const StepIndicator = ({ step, totalSteps }) => (
    <div className="flex items-center justify-center w-full max-w-xs mx-auto mb-10">
        {[...Array(totalSteps)].map((_, index) => {
            const s = index + 1;
            return (
                <React.Fragment key={s}>
                    <div className={`relative flex flex-col items-center group`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2 
                            ${step >= s 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
                                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                            }`}>
                            {step > s ? <span>&#10003;</span> : s}
                        </div>
                    </div>
                    {s < totalSteps && (
                        <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-500 ${step > s ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                    )}
                </React.Fragment>
            );
        })}
    </div>
);

export default StepIndicator;