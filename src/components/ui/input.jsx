import React from "react";

function Input({ id, type = "text", value, onChange, className = "" }) {
    return (
        <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            className={`border rounded-lg px-3 py-2 w-full ${className}`}
        />
    );
}

export default Input;
