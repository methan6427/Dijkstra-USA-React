import React from "react";

function Button({ children, onClick, className = "" }) {
    return (
        <button
            onClick={onClick}
            className={`bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 ${className}`}
        >
            {children}
        </button>
    );
}

export default Button;
