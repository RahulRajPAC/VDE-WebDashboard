import React from 'react';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Play, Square, Download, Terminal, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTour } from '../../contexts/TourContext';
import { dashboardSteps, flightDataSteps, settingsSteps } from '../../config/tourSteps';

export default function InteractiveDockerGuide() {
    const navigate = useNavigate();
    const { startPageTour } = useTour();

    const handleReplay = (path, name, steps) => {
        navigate(path);
        setTimeout(() => {
            startPageTour(name, steps, true);
        }, 300);
    };

    return (
        <Drawer>
            <DrawerTrigger asChild>
                <Button variant="outline" size="icon" className="cursor-pointer bg-background hover:bg-accent text-foreground shadow-sm joyride-help-btn">
                    <HelpCircle className="w-5 h-5" />
                    <span className="sr-only">Interactive Docker Guide</span>
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <div className="mx-auto w-full max-w-3xl">
                    <DrawerHeader>
                        <DrawerTitle>Docker Application Guide</DrawerTitle>
                        <DrawerDescription>Learn what each action does and how to manage the simulator containers.</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded-lg border p-4 shadow-sm bg-muted/20">
                                <h4 className="font-semibold text-primary flex items-center gap-2"><Play className="h-4 w-4" /> Compose Up</h4>
                                <p className="text-sm text-muted-foreground mt-2">Spins up fresh containers from your images and maps the network ports. This command is required if you have recently run 'Compose Down'.</p>
                            </div>
                            <div className="rounded-lg border p-4 shadow-sm bg-muted/20">
                                <h4 className="font-semibold text-primary flex items-center gap-2"><Square className="h-4 w-4" /> Compose Down</h4>
                                <p className="text-sm text-muted-foreground mt-2">Fundamentally destroys the running containers and networks. Use this when you are completely finished with a session to save RAM.</p>
                            </div>
                            <div className="rounded-lg border p-4 shadow-sm bg-muted/20">
                                <h4 className="font-semibold text-primary flex items-center gap-2"><Play className="h-4 w-4" /> Compose Start</h4>
                                <p className="text-sm text-muted-foreground mt-2">Starts all previously created but stopped containers simultaneously. Allows you to resume operations very fast.</p>
                            </div>
                            <div className="rounded-lg border p-4 shadow-sm bg-muted/20">
                                <h4 className="font-semibold text-primary flex items-center gap-2"><Square className="h-4 w-4" /> Compose Stop</h4>
                                <p className="text-sm text-muted-foreground mt-2">Safely suspends and stops all currently running containers across the entire system without wiping their networks.</p>
                            </div>
                            <div className="rounded-lg border p-4 shadow-sm bg-muted/20">
                                <h4 className="font-semibold text-primary flex items-center gap-2"><Play className="h-4 w-4" /> Local Start/Stop</h4>
                                <p className="text-sm text-muted-foreground mt-2">Safely pauses and resumes an individual container row. Very useful for testing network downtime or simulating offline failures.</p>
                            </div>
                            <div className="rounded-lg border p-4 shadow-sm bg-muted/20">
                                <h4 className="font-semibold text-primary flex items-center gap-2"><Download className="h-4 w-4" /> Pull Updates</h4>
                                <p className="text-sm text-muted-foreground mt-2">Downloads the absolute newest registry binary for a specific service. It will prompt you to apply it and recreate!</p>
                            </div>
                        </div>
                        <Alert className="mt-4 border-blue-200 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                            <Terminal className="h-4 w-4 !text-blue-800 dark:!text-blue-300" />
                            <AlertTitle>Logging Information</AlertTitle>
                            <AlertDescription>
                                Individual container standard output feeds stream straight into their local "Logs" dropdown!
                            </AlertDescription>
                        </Alert>

                        <div className="mt-6 border-t pt-4">
                            <h4 className="font-semibold text-lg mb-3">Interactive Tutorials</h4>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <DrawerClose asChild>
                                    <Button variant="outline" size="sm" onClick={() => handleReplay('/', 'Dashboard', dashboardSteps)} className="cursor-pointer">
                                        Replay Dashboard Tour
                                    </Button>
                                </DrawerClose>
                                <DrawerClose asChild>
                                    <Button variant="outline" size="sm" onClick={() => handleReplay('/flight-data', 'FlightData', flightDataSteps)} className="cursor-pointer">
                                        Replay Services Tour
                                    </Button>
                                </DrawerClose>
                                <DrawerClose asChild>
                                    <Button variant="outline" size="sm" onClick={() => handleReplay('/settings', 'Settings', settingsSteps)} className="cursor-pointer">
                                        Replay Settings Tour
                                    </Button>
                                </DrawerClose>
                            </div>
                        </div>
                    </div>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button variant="outline" className="cursor-pointer">Close Guide</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
