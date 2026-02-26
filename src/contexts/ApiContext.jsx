import React, { createContext, useContext, useMemo } from 'react';
import { useSocket } from './SocketContext';

const ApiContext = createContext(null);

export const useApi = () => useContext(ApiContext);

export const ApiProvider = ({ children }) => {
    const { services, servicesLoading, servicesError } = useSocket();

    // Helper to find port for a specific service
    const getServicePort = (serviceName) => {
        const service = services?.find(s => s.name === serviceName);
        return service?.port || null;
    };

    const apiConfig = useMemo(() => {
        const flightDataPort = getServicePort('flightdataservice') || 50337;
        const ltnPort = getServicePort('ltn') || 5000;
        const ansPort = getServicePort('ans') || 8080;
        const surveysPort = getServicePort('surveys') || 5002;

        const flightServiceBase = `http://localhost:${flightDataPort}`;
        const ltnServiceBase = `http://localhost:${ltnPort}`;
        const ansServiceBase = `http://localhost:${ansPort}`;
        const surveysServiceBase = `http://localhost:${surveysPort}`;

        return {
            flightDataAdminMocksUrl: `${flightServiceBase}/flightdata/admin/mocks`,
            flightDataServiceUrl: `${flightServiceBase}/flightdata`,
            ltnAdminMocksUrl: `${ltnServiceBase}/ltn/admin/mocks`,
            ltnServiceUrl: `${ltnServiceBase}/ltn`,
            ansAdminMocksUrl: `${ansServiceBase}/ans/admin/mocks`,
            ansServiceUrl: `${ansServiceBase}/ans/1`,
            surveysAdminMocksUrl: `${surveysServiceBase}/surveys/admin/mocks`,
            surveysServiceUrl: `${surveysServiceBase}/surveys/services/api/v1`,

            loading: servicesLoading,
            error: servicesError
        };
    }, [services, servicesLoading, servicesError]);

    return (
        <ApiContext.Provider value={apiConfig}>
            {children}
        </ApiContext.Provider>
    );
};
