import React from 'react';
import { ANS_ADMIN_MOCKS_URL } from '@/config/api';
import ServiceDataPage from '@/components/common/ServiceDataPage';

export default function AnsDataPage() {
    return (
        <ServiceDataPage
            apiBaseUrl={ANS_ADMIN_MOCKS_URL}
            serviceName="ANS"
            pageTitle="ANS Data Manager"
            pageDescription="Modify JSON responses for ANS service in real-time, safely."
            emptyStateTitle="No Service Selected"
            emptyStateDescription="Select a function from the sidebar to view, edit, and override its response data."
            getMockSubtitle={(key) => `function=${key}`}
        />
    );
}
