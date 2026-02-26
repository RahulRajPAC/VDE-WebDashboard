import React from 'react';
import { useApi } from '@/contexts/ApiContext';
import ServiceDataPage from '@/components/common/ServiceDataPage';

export default function SurveysDataPage() {
    const { surveysAdminMocksUrl, loading } = useApi();

    if (loading) return <div className="p-8 flex items-center justify-center h-full">Loading configurations...</div>;

    return (
        <ServiceDataPage
            apiBaseUrl={surveysAdminMocksUrl}
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
