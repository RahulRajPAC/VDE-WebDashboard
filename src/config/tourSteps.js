const addJoyrideProps = (steps) => steps.map(step => ({
    ...step,
    disableOverlayClose: true,
    spotlightClicks: true
}));

export const dashboardSteps = addJoyrideProps([
    {
        target: 'body',
        placement: 'center',
        content: 'Welcome to the Mock Backend Simulator! Let us show you around the dashboard.',
        disableBeacon: true,
    },
    {
        target: '.joyride-metrics-cards',
        content: 'Here you can see high-level metrics and system health at a glance.',
    },
    {
        target: '.joyride-service-status-card',
        content: 'This card shows the status of the service, The images which has been used there status and port number',
    },
    {
        target: '.joyride-active-mocks',
        content: 'This area shows a quick summary of your active mock services.',
    }
]);

export const flightDataSteps = addJoyrideProps([
    {
        target: 'body',
        placement: 'center',
        content: 'Welcome to the Services Configuration page! Here you can modify the data your mock APIs return.',
        disableBeacon: true,
    },
    {
        target: '.joyride-service-selector',
        content: 'Select a specific service API and endpoint to begin editing its mock data.',
    },
    {
        target: '.joyride-json-editor',
        content: 'Edit the mock JSON payloads directly in this editor to simulate different responses.',
    },
    {
        target: '.joyride-save-btn',
        content: 'Hit "Save Changes" to apply your overrides instantly to the active in-memory cache.',
    },
    {
        target: '.joyride-reset-btn',
        content: 'If you want to reset the mock data to its original state, Just click "Reset to Default".',
    },
    {
        target: '.joyride-help-btn',
        content: 'If you ever need a refresher, just click here to replay any of these tutorials!',
    }
]);

export const settingsSteps = addJoyrideProps([
    {
        target: 'body',
        placement: 'center',
        content: 'Welcome to Docker Settings! This is Mission Control for your simulator containers.',
        disableBeacon: true,
    },
    {
        target: '.joyride-global-actions',
        content: 'Use these buttons to cleanly start or stop all background containers simultaneously.',
    },
    {
        target: '.joyride-service-row',
        content: 'You can also control individual microservices independently right here.',
    },
    {
        target: '.joyride-service-start',
        content: 'You can "START/STOP" an individual service by clicking this button.',
    },
    {
        target: '.joyride-logs-viewer',
        content: 'Real-time logs from your containers stream directly into this console so you can monitor them.',
    },
    {
        target: '.joyride-help-btn',
        content: 'If you ever need a refresher, just click here to replay any of these tutorials!',
    }
]);
