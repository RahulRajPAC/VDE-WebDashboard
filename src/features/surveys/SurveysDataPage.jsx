import React from 'react';
import { SURVEYS_ADMIN_MOCKS_URL } from '@/config/api';
import ServiceDataPage from '@/components/common/ServiceDataPage';

export default function SurveysDataPage() {
    return (
        <ServiceDataPage
            apiBaseUrl={SURVEYS_ADMIN_MOCKS_URL}
            serviceName="Surveys"
            pageTitle="Surveys Data Manager"
            pageDescription="Modify JSON surveys content in real-time, safely."
            emptyStateTitle="No Mock Selected"
            emptyStateDescription="Select a mock key from the sidebar to view, edit, and override its content."
            getMockSubtitle={(key) => {
                if (key === 'survey-content') return '/surveys/services/api/v1/* (All Endpoints)'
                return `key=${key}`
            }}
        />
    );
}
