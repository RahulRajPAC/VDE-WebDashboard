import React, { createContext, useContext, useState } from 'react';

const TourContext = createContext();

export function TourProvider({ children }) {
    const [runTour, setRunTour] = useState(false);
    const [tourSteps, setTourSteps] = useState([]);
    const [tourName, setTourName] = useState(null);
    const [stepIndex, setStepIndex] = useState(0);

    const startPageTour = (name, steps, force = false) => {
        const hasSeen = localStorage.getItem(`hasSeen${name}Tour`);
        if (!hasSeen || force) {
            setTourName(name);
            setTourSteps(steps);
            setStepIndex(0);
            // Small timeout allows the page and components to fully mount and render before joyride starts looking for DOM nodes.
            setTimeout(() => setRunTour(true), 500);
        }
    };

    const handleJoyrideCallback = (data) => {
        const { status, action, type, index } = data;
        const finishedStatuses = ['finished', 'skipped'];

        if (finishedStatuses.includes(status) || action === 'close') {
            setRunTour(false);
            setStepIndex(0);
            if (tourName) {
                localStorage.setItem(`hasSeen${tourName}Tour`, 'true');
            }
        } else if (type === 'step:after' || type === 'target:notFound') {
            setStepIndex(index + (action === 'prev' ? -1 : 1));
        }
    };

    const advanceTour = () => {
        setStepIndex(prev => prev + 1);
    };

    return (
        <TourContext.Provider value={{ runTour, tourSteps, startPageTour, handleJoyrideCallback, stepIndex, advanceTour, tourName }}>
            {children}
        </TourContext.Provider>
    );
}

export const useTour = () => useContext(TourContext);
