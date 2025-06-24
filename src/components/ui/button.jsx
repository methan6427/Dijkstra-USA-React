import React from "react";
import "./button.css";

function Button({ children, onClick, className = "", disabled = false }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`button-85 ${className}`}
        >
            {children}
        </button>
    );
}

export default Button;