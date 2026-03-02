import React, { useEffect } from 'react';
import Joyride from 'react-joyride';
import { useApi } from '@/contexts/ApiContext';
import { useTour } from '@/contexts/TourContext';
import { flightDataSteps } from '@/config/tourSteps';
import ServiceDataPage from '@/components/common/ServiceDataPage';

export default function FlightDataPage() {
    const { flightDataAdminMocksUrl, loading } = useApi();
    const { runTour, tourSteps, startPageTour, handleJoyrideCallback, stepIndex } = useTour();

    useEffect(() => {
        startPageTour('FlightData', flightDataSteps);
    }, []);

    if (loading) return <div className="p-8 flex items-center justify-center h-full">Loading configurations...</div>;

    return (
        <>
            <Joyride
                steps={tourSteps}
                run={runTour}
                stepIndex={stepIndex}
                continuous={true}
                showSkipButton={true}
                showProgress={true}
                callback={handleJoyrideCallback}
                styles={{
                    options: {
                        primaryColor: '#3b82f6',
                        zIndex: 1000,
                    }
                }}
            />
            <ServiceDataPage
                apiBaseUrl={flightDataAdminMocksUrl}
                serviceName="Flight Data"
                pageTitle="Flight Data Manager"
                pageDescription="Modify JSON responses in real-time, safely."
                emptyStateTitle="No Endpoint Selected"
                emptyStateDescription="Select an endpoint from the sidebar to view, edit, and override its response data."
                getMockSubtitle={(key) => `/flightdata/${key}`}
            />
        </>
    );
}
