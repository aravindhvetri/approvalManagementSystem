import * as React from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import "../Loader/Loader.css";

export default function Loader() {
    return (
        <div className="loader-container">
            <ProgressSpinner style={{width: '50px', height: '50px'}} 
            strokeWidth="8" fill="var(--surface-ground)" animationDuration=".5s" />
        </div>
    );
}