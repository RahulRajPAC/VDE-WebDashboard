import React from 'react';
import { useApi } from '@/contexts/ApiContext';
import ServiceDataPage from '@/components/common/ServiceDataPage';

export default function FlightDataPage() {
    const { flightDataAdminMocksUrl, loading } = useApi();

    if (loading) return <div className="p-8 flex items-center justify-center h-full">Loading configurations...</div>;

    return (
        <ServiceDataPage
            apiBaseUrl={flightDataAdminMocksUrl}
            serviceName="Flight Data"
            pageTitle="Flight Data Manager"
            pageDescription="Modify JSON responses in real-time, safely."
            emptyStateTitle="No Endpoint Selected"
            emptyStateDescription="Select an endpoint from the sidebar to view, edit, and override its response data."
            getMockSubtitle={(key) => `/flightdata/${key}`}
        />
    );
}
