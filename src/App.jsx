import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BaseLayout from './components/layout/BaseLayout';
import DashboardPage from './features/dashboard/DashboardPage';
import SettingsPage from './features/settings/SettingsPage';
import FlightDataPage from './features/flight-data/FlightDataPage';
import LtnDataPage from './features/ltn/LtnDataPage';
import AnsDataPage from './features/ans/AnsDataPage';
import SurveysDataPage from './features/surveys/SurveysDataPage';
import CrewTerminalPage from './features/crew-terminal/CrewTerminalPage';
import CrewTerminalMessaging from './features/crew-terminal/CrewTerminalMessaging';

import { SocketProvider } from './contexts/SocketContext';
import { ApiProvider } from './contexts/ApiContext';
import { TourProvider } from './contexts/TourContext';
import { Toaster } from 'sonner';
import CrewTerminalMIDServiceBlocking from './features/crew-terminal/CrewTerminalMIDServiceBlocking';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <ApiProvider>
          <TourProvider>
            <Router>
              <Routes>
                <Route path="/" element={<BaseLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="flight-data" element={<FlightDataPage />} />
                  <Route path="ltn" element={<LtnDataPage />} />
                  <Route path="ans" element={<AnsDataPage />} />
                  <Route path="surveys" element={<SurveysDataPage />} />
                  <Route path="crew-terminal" element={<CrewTerminalPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                  <Route path="/crew-terminal/messaging" element={<CrewTerminalMessaging />} />
                  <Route path="/crew-terminal/mid-service-blocking" element={<CrewTerminalMIDServiceBlocking />} />
                </Route>
              </Routes>
              <Toaster position="top-right" richColors />
            </Router>
          </TourProvider>
        </ApiProvider>
      </SocketProvider>
    </QueryClientProvider>
  );
}

export default App;
