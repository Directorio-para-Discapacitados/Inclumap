import React, { useState } from 'react';
import './Tutorial.css';

interface TutorialItem {
    id: string;
    title: string;
    videoId: string;
}

const TUTORIALS: TutorialItem[] = [
    {
        id: '1',
        title: '¿Cómo iniciar sesión?',
        videoId: '6Vrie3RgH0A'
    },
    {
        id: '2',
        title: 'Registro de Usuario',
        videoId: 'esLi7qsOwnI'
    }
];

const Tutorial: React.FC = () => {
    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

    const handleOpenModal = (videoId: string) => {
        setSelectedVideoId(videoId);
    };

    const handleCloseModal = () => {
        setSelectedVideoId(null);
    };

    return (
        <div className="tutorial-container">
            <div className="tutorial-header">
                <h1>Centro de Ayuda</h1>
                <p>Selecciona un tema para ver el tutorial completo.</p>
            </div>

            <div className="tutorial-tags-grid">
                {TUTORIALS.map((tutorial) => (
                    <button
                        key={tutorial.id}
                        className="tutorial-tag-button"
                        onClick={() => handleOpenModal(tutorial.videoId)}
                    >
                        <span>{tutorial.title}</span>
                    </button>
                ))}
            </div>

            {selectedVideoId && (
                <div className="tutorial-modal-overlay" onClick={handleCloseModal}>
                    <div className="tutorial-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="tutorial-modal-close" onClick={handleCloseModal}>
                            &times;
                        </button>
                        <div className="video-responsive">
                            <iframe
                                src={`https://www.youtube.com/embed/${selectedVideoId}?autoplay=1`}
                                title="Tutorial Video"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tutorial;
