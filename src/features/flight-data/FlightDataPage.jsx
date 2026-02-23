import React from 'react';
import { FLIGHT_DATA_ADMIN_MOCKS_URL } from '@/config/api';
import ServiceDataPage from '@/components/common/ServiceDataPage';

export default function FlightDataPage() {
    return (
        <ServiceDataPage
            apiBaseUrl={FLIGHT_DATA_ADMIN_MOCKS_URL}
            serviceName="Flight Data"
            pageTitle="Flight Data Manager"
            pageDescription="Modify JSON responses in real-time, safely."
            emptyStateTitle="No Endpoint Selected"
            emptyStateDescription="Select an endpoint from the sidebar to view, edit, and override its response data."
            getMockSubtitle={(key) => `/flightdata/${key}`}
        />
    );
}
