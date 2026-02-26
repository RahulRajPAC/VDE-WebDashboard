import React from 'react';
import { useApi } from '@/contexts/ApiContext';
import ServiceDataPage from '@/components/common/ServiceDataPage';

export default function AnsDataPage() {
    const { ansAdminMocksUrl, loading } = useApi();

    if (loading) return <div className="p-8 flex items-center justify-center h-full">Loading configurations...</div>;

    return (
        <ServiceDataPage
            apiBaseUrl={ansAdminMocksUrl}
            serviceName="ANS"
            pageTitle="ANS Data Manager"
            pageDescription="Modify JSON responses for ANS service in real-time, safely."
            emptyStateTitle="No Service Selected"
            emptyStateDescription="Select a function from the sidebar to view, edit, and override its response data."
            getMockSubtitle={(key) => `function=${key}`}
        />
    );
}
