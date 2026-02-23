import React from 'react';
import { LTN_ADMIN_MOCKS_URL } from '@/config/api';
import ServiceDataPage from '@/components/common/ServiceDataPage';

export default function LtnDataPage() {
    return (
        <ServiceDataPage
            apiBaseUrl={LTN_ADMIN_MOCKS_URL}
            serviceName="LTN"
            pageTitle="LTN Data Manager"
            pageDescription="Modify JSON responses for LTN service in real-time, safely."
            emptyStateTitle="No Service Selected"
            emptyStateDescription="Select a function from the sidebar to view, edit, and override its response data."
            getMockSubtitle={(key) => `function=${key}`}
        />
    );
}
