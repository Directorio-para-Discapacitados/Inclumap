import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaQuestion } from 'react-icons/fa';
import { useSpeakable } from '../hooks/useSpeakable';
import './HelpFab.css';

const HelpFab: React.FC = () => {
    const navigate = useNavigate();
    const { onMouseEnter, onFocus } = useSpeakable({
        customText: 'Ir a tutoriales y ayuda'
    });

    return (
        <button
            className="help-fab"
            onClick={() => navigate('/tutoriales')}
            onMouseEnter={onMouseEnter}
            onFocus={onFocus}
            aria-label="Ir a tutoriales y ayuda"
            title="Ayuda y Tutoriales"
        >
            <FaQuestion />
        </button>
    );
};

export default HelpFab;
