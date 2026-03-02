import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Terminal, RefreshCcw, DownloadCloud, PlayCircle, AlertTriangle } from 'lucide-react';

export default function DockerSetupGuide({ status, onRetry }) {
    const [isRetrying, setIsRetrying] = useState(false);
    const [isStartingDocker, setIsStartingDocker] = useState(false);

    const handleStartDocker = async () => {
        setIsStartingDocker(true);
        try {
            await fetch('http://localhost:3001/api/start-docker', { method: 'POST' });
            setTimeout(() => setIsStartingDocker(false), 2000); // Stop spinning after 2s
        } catch (e) {
            setIsStartingDocker(false);
        }
    };

    // Determine the scenario from explicitly typed backend responses:
    const isMissing = status.status === 'NOT_INSTALLED';
    const isDown = status.status === 'DESKTOP_STOPPED' || status.status === 'PAUSED_OR_FROZEN';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
            <Card className="w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-300 border-red-500/20">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-500" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">Docker is Required</CardTitle>
                    <CardDescription className="text-lg">
                        The Backend Simulator requires Docker Engine to orchestrate the flight data services, but {isMissing ? "it doesn't seem to be installed on your system." : "the Docker daemon is currently not running."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-8">
                    {/* Scenario 1: Docker is completely missing */}
                    {isMissing && (
                        <div className="space-y-4">
                            <div className="rounded-lg bg-muted/50 p-6 border text-center space-y-4">
                                <DownloadCloud className="w-10 h-10 mx-auto text-blue-500" />
                                <div>
                                    <h3 className="font-semibold text-lg">Step 1: Download Docker Desktop</h3>
                                    <p className="text-muted-foreground mt-1">
                                        You need to install Docker Desktop to run the simulator environments.
                                    </p>
                                </div>
                                <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700">
                                    <a href="https://www.docker.com/products/docker-desktop/" target="_blank" rel="noopener noreferrer">
                                        Download Docker Desktop
                                    </a>
                                </Button>
                            </div>

                            <div className="rounded-lg bg-muted/50 p-6 border text-center space-y-4">
                                <PlayCircle className="w-10 h-10 mx-auto text-emerald-500" />
                                <div>
                                    <h3 className="font-semibold text-lg">Step 2: Install, Login & Run</h3>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        Run the installer, open the Docker Desktop application, and create a free account to <strong>log in</strong>. Wait for the engine indicator at the bottom left to turn green!
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Scenario 2: Docker is installed but daemon is offline */}
                    {isDown && (
                        <div className="space-y-4">
                            {/* Manual Paused State / Frozen */}
                            {status.status === 'PAUSED_OR_FROZEN' && status.error === 'PAUSED' && (
                                <div className="rounded-lg bg-muted/50 p-6 border flex items-start gap-4">

                                    <div className="mt-1 bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded-full">
                                        <Terminal className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                                    </div>
                                    <div className="text-left space-y-1 w-full">
                                        <h3 className="font-semibold text-xl">Docker is Paused</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Hey, it looks like Docker is <strong className="text-red-600 dark:text-red-500">manually paused</strong>.
                                            Please open the Docker Desktop application (or click the <strong className="text-red-600 dark:text-red-500">Whale icon 🐳</strong> in your MAC's top menu bar) and <strong className="text-red-600 dark:text-red-500">Resume</strong> the engine to continue.
                                        </p>
                                        <br />
                                        <p className='font-bold text-lg text-center text-blue-600 dark:text-blue-500'>Image for reference:</p>
                                        <div className="mt-1 pt-2 w-full">
                                            <img src="/Menubar.png" alt="Menubar" className="w-full h-auto  object-cover rounded-md border shadow-md dark:border-border bg-background" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Standard Offline State */}
                            {status.status === 'DESKTOP_STOPPED' && (
                                <div className="rounded-lg bg-muted/50 p-6 border flex items-start gap-4">
                                    <div className="mt-1 bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded-full">
                                        <Terminal className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                                    </div>
                                    <div className="text-left space-y-1 w-full">
                                        <h3 className="font-semibold text-lg">Start Docker Desktop</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            We detected the Docker CLI, but the engine is unresponsive. Please open the Docker Desktop application on your computer and wait for it to fully initialize.
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="mt-4 w-full border-blue-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                            onClick={handleStartDocker}
                                            disabled={isStartingDocker}
                                        >
                                            {isStartingDocker ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                                            {isStartingDocker ? 'Attempting to launch Docker...' : 'Auto-Start Docker Desktop'}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Frozen Timeout State */}
                            {status.status === 'PAUSED_OR_FROZEN' && status.error === 'TIMEOUT' && (
                                <div className="rounded-lg bg-muted/50 p-6 border flex items-start gap-4">
                                    <div className="mt-1 bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded-full">
                                        <Terminal className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                                    </div>
                                    <div className="text-left space-y-1 w-full">
                                        <h3 className="font-semibold text-lg">Is Docker Frozen?</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            We detected the Docker CLI, but the engine is unresponsive. It looks like Docker Desktop might be Frozen. Please open the application or restart it to ensure it is running properly.
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="mt-4 w-full border-blue-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                            onClick={handleStartDocker}
                                            disabled={isStartingDocker}
                                        >
                                            {isStartingDocker ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                                            {isStartingDocker ? 'Attempting to launch Docker...' : 'Auto-Start Docker Desktop'}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {status.error && status.status !== 'PAUSED_OR_FROZEN' && (
                                <div className="mt-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md p-4 text-xs font-mono text-red-800 dark:text-red-400 overflow-x-auto whitespace-pre-wrap">
                                    <strong>Debug Info:</strong><br />
                                    {status.error}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center pb-8">
                    <Button
                        size="lg"
                        onClick={async () => {
                            setIsRetrying(true);
                            await onRetry();
                            // If it succeeds, the component will unmount before the timeout.
                            // If it fails, reset the spinner so they can click again.
                            setTimeout(() => setIsRetrying(false), 1000);
                        }}
                        className="gap-2 w-full max-w-sm font-semibold transition-all"
                        disabled={isRetrying}
                    >
                        <RefreshCcw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                        {isRetrying ? 'Checking connection...' : "I've Started Docker, Try Again"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
