import React from "react";

function Label({ htmlFor, children, className = "" }) {
    return (
        <label htmlFor={htmlFor} className={`block font-medium mb-1 ${className}`}>
            {children}
        </label>
    );
}

export default Label;
