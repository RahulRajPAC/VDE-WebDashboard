import React from 'react';
import DockerSettings from './DockerSettings';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Docker Services</h3>
                <p className="text-sm text-muted-foreground">
                    Manage and configure the underlying Docker services for the simulator.
                </p>
            </div>
            <Separator />
            <DockerSettings />
        </div>
    );
}
