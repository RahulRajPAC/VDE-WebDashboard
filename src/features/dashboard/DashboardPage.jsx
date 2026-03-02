import React, { useEffect, useState, useRef } from 'react';
import Joyride from 'react-joyride';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Server, CheckCircle, ArrowRight, Zap, RefreshCcw } from 'lucide-react';
import { io } from 'socket.io-client';
import { Badge } from '@/components/ui/badge';

import { useSocket } from '../../contexts/SocketContext';
import { useTour } from '../../contexts/TourContext';
import { dashboardSteps } from '../../config/tourSteps';

export default function DashboardPage() {
    const { socket, isConnected } = useSocket();
    const { runTour, tourSteps, startPageTour, handleJoyrideCallback, stepIndex } = useTour();
    const [services, setServices] = useState([]);

    const fetchServices = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/services');
            const data = await res.json();
            setServices(data);
        } catch (error) {
            console.error('Failed to fetch services:', error);
        }
    };

    useEffect(() => {
        fetchServices();
        startPageTour('Dashboard', dashboardSteps);
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleStatusUpdate = () => {
            fetchServices();
        };

        socket.on('status-update', handleStatusUpdate);

        return () => {
            socket.off('status-update', handleStatusUpdate);
        };
    }, [socket]);

    // Derived Metrics
    const totalServices = services.length;
    const runningServices = services.filter(s => s.status === 'running');
    const activeServices = runningServices.length;
    const stoppedServices = services.filter(s => s.status !== 'running');

    let healthStatus = 'Offline';
    let healthColor = 'text-red-500';
    let healthMessage = 'Cannot connect to server'; // Helper message

    if (isConnected) {
        if (totalServices > 0) {
            if (activeServices === totalServices) {
                healthStatus = 'System Active';
                healthColor = 'text-emerald-500';
                healthMessage = 'All services running';
            } else if (activeServices === 0) {
                healthStatus = 'System Idle';
                healthColor = 'text-muted-foreground';
                healthMessage = 'All services stopped';
            } else {
                healthStatus = 'Mixed State';
                healthColor = 'text-yellow-500';
                // List the first 2 stopped services, then "+X more" if needed
                const names = stoppedServices.map(s => s.name);
                const displayNames = names.slice(0, 2).join(', ');
                const remaining = names.length - 2;
                healthMessage = `Stopped: ${displayNames}${remaining > 0 ? ` +${remaining} more` : ''}`;
            }
        } else {
            healthStatus = 'No Config';
            healthColor = 'text-orange-500';
            healthMessage = 'No services found';
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Joyride
                steps={tourSteps}
                run={runTour}
                stepIndex={stepIndex}
                continuous={true}
                showSkipButton={true}
                showProgress={true}
                callback={handleJoyrideCallback}
                styles={{
                    options: {
                        primaryColor: '#3b82f6',
                        zIndex: 1000,
                    }
                }}
            />
            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-3 joyride-metrics-cards">
                {/* Connection Status */}
                <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Backend Status</CardTitle>
                        <Activity className={`h-4 w-4 ${isConnected ? 'text-blue-500' : 'text-red-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold tracking-tight ${isConnected ? 'text-emerald-500' : 'text-red-500'}`}>
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {isConnected ? 'Real-time updates active' : 'Waiting for connection...'}
                        </p>
                    </CardContent>
                </Card>

                {/* Active Services */}
                <Card className="border-l-4 border-l-violet-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Services</CardTitle>
                        <Server className="h-4 w-4 text-violet-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">{activeServices} / {totalServices}</div>
                        <p className="text-xs text-muted-foreground mt-1">Running containers</p>
                    </CardContent>
                </Card>

                {/* System Health */}
                <Card className={`border-l-4 shadow-sm hover:shadow-md transition-shadow ${healthColor === 'text-emerald-500' ? 'border-l-emerald-500' : 'border-l-yellow-500'}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">System Status</CardTitle>
                        <CheckCircle className={`h-4 w-4 ${healthColor}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold tracking-tight ${healthColor}`}>{healthStatus}</div>
                        <p className="text-xs text-muted-foreground mt-1 truncate" title={healthMessage}>
                            {healthMessage}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                {/* Main Content: Service Cards Grid (Takes 2 columns on large screens) */}
                <div className="lg:col-span-2 space-y-4 joyride-service-status-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">Service Overview</h2>
                            <p className="text-sm text-muted-foreground">Detailed view of service containers.</p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {services.length > 0 ? (
                            services.map(service => (
                                <Card key={service.name} className="group hover:border-primary/50 transition-colors">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-2 rounded-full ${service.status === 'running' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                                                    {service.status === 'running' ? <Zap className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                                                </div>
                                                <div className="font-semibold capitalize">{service.name}</div>
                                            </div>
                                            <Badge variant={service.status === 'running' ? 'default' : 'secondary'} className={service.status === 'running' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                                                {service.status}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Image</span>
                                                <span className="font-mono text-xs max-w-[150px] truncate" title={service.details?.Image}>{service.details?.Image || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Port</span>
                                                <span className="font-mono text-xs text-emerald-500 max-w-[150px] truncate">{service.port || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Uptime</span>
                                                <span className="font-mono text-xs text-right max-w-[150px] truncate" title={service.details?.Status}>{service.details?.Status || 'Stopped'}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
                                <RefreshCcw className="h-8 w-8 text-muted-foreground mb-4 animate-spin-slow" />
                                <h3 className="text-lg font-medium">Monitoring Services</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mt-2">
                                    Waiting for backend synchronization...
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar: Service Status List (Restored) */}
                <div className="lg:col-span-1 joyride-active-mocks">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Status List</CardTitle>
                            <CardDescription>Quick glance at all services.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {services.length > 0 ? (
                                    services.map(service => (
                                        <div key={service.name} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${service.status === 'running' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                <span className="font-medium capitalize text-sm">{service.name}</span>
                                            </div>
                                            <span className={`text-xs ${service.status === 'running' ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                                                {service.status === 'running' ? 'Running' : 'Stopped'}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-muted-foreground">Loading...</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
