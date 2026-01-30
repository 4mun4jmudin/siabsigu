// export default function Checkbox({ className = '', ...props }) {
//     return (
//         <input
//             {...props}
//             type="checkbox"
//             className={
//                 'rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 ' +
//                 className
//             }
//         />
//     );
// }
import { forwardRef } from 'react';

export default forwardRef(function Checkbox({ className = '', ...props }, ref) {
    return (
        <input
            {...props}
            type="checkbox"
            ref={ref}
            className={
                'rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 ' +
                className
            }
        />
    );
});