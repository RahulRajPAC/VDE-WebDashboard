import React, { useState, useEffect } from 'react';
import axios from 'axios';
import JsonEditor, { editorThemes } from '@/components/editor/JsonEditor';
import { useTour } from '@/contexts/TourContext';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, FileCode, Box } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ServiceDataPage({
    apiBaseUrl,
    serviceName,
    pageTitle,
    pageDescription,
    emptyStateTitle,
    emptyStateDescription,
    getMockSubtitle,
}) {
    const [mocks, setMocks] = useState([]);
    const [selectedMock, setSelectedMock] = useState(null);
    const [content, setContent] = useState('');
    const [originalContent, setOriginalContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [editorTheme, setEditorTheme] = useState('one_dark');
    const [fontSize, setFontSize] = useState(14);

    // Joyride Tour Hooks
    const { advanceTour, stepIndex, tourName } = useTour();

    useEffect(() => {
        fetchMocks();
    }, []);

    // Clear success notifications after 2 seconds
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess(null);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const fetchMocks = async () => {
        try {
            setLoading(true);
            const res = await axios.get(apiBaseUrl);
            setMocks(res.data);
        } catch (err) {
            setError(`Failed to load mocks list. Is the ${serviceName} Service running?`);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectMock = async (key) => {
        if (tourName === 'FlightData' && stepIndex === 1) {
            advanceTour();
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await axios.get(`${apiBaseUrl}/${key}`);
            const newContent = JSON.stringify(res.data, null, 2);
            setContent(newContent);
            setOriginalContent(newContent);
            setSelectedMock(key);
        } catch (err) {
            setError(`Failed to load mock data for ${key}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            let parsed;
            try {
                parsed = JSON.parse(content);
            } catch (e) {
                throw new Error(`Invalid JSON format: ${e.message}`);
            }

            await axios.put(`${apiBaseUrl}/${selectedMock}`, parsed);
            setOriginalContent(content);
            setSuccess("Mock updated successfully! Changes are stored in memory.");
            fetchMocks(); // Update status list to show 'memory' source
        } catch (err) {
            setError(err.message || "Failed to update mock");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!window.confirm("Are you sure you want to revert to the original file content? Any unsaved changes will be lost.")) return;

        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await axios.delete(`${apiBaseUrl}/${selectedMock}`);
            setSuccess("Mock reset to original file content!");
            fetchMocks(); // Update status list
            handleSelectMock(selectedMock); // Reload content
        } catch (err) {
            setError("Failed to reset mock");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8 h-[calc(100vh-4rem)] flex flex-col space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-lg border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                        <Box className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
                        <p className="text-sm text-muted-foreground">{pageDescription}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Select value={editorTheme} onValueChange={setEditorTheme}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Theme" />
                        </SelectTrigger>
                        <SelectContent>
                            {editorThemes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button title='Fetches the list of Available Mocks' variant="outline" size="sm" onClick={fetchMocks} className="ml-auto cursor-pointer">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Main Content Split View */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 min-h-0">
                {/* Sidebar: Mock List */}
                <Card className="md:col-span-1 flex flex-col border-none shadow-md joyride-service-selector">
                    <div className="p-4 border-b bg-muted/30">
                        <h3 className="font-semibold flex items-center gap-2">
                            <FileCode className="h-4 w-4" />
                            Available Mocks
                        </h3>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            {mocks.map((mock) => (
                                <button
                                    key={mock.key}
                                    onClick={() => handleSelectMock(mock.key)}
                                    className={`w-full min-w-0 text-left px-3 py-3 rounded-md text-sm transition-all duration-200 flex items-center justify-between group ${selectedMock === mock.key
                                        ? 'bg-primary/10 text-primary font-medium border-l-4 border-primary pl-2'
                                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <div className="flex flex-col w-full min-w-0">
                                        <div className="flex items-center min-w-0">
                                            <span className="truncate pr-2 font-medium flex-1 min-w-0">
                                                {mock.key}
                                            </span>

                                            {mock.source === 'memory' && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] h-5 px-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-300 dark:border-amber-700 font-medium whitespace-nowrap shrink-0"
                                                >
                                                    M
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center mt-1 min-w-0">
                                            <span className="text-[10px] opacity-70 font-mono truncate flex-1 min-w-0">
                                                {getMockSubtitle ? getMockSubtitle(mock.key) : mock.key}
                                            </span>

                                            {mock.source !== 'memory' && (
                                                <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 group-hover:bg-slate-300 transition-colors ml-2 shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>

                {/* Editor Area */}
                <JsonEditor
                    selectedMock={selectedMock}
                    content={content}
                    setContent={setContent}
                    originalContent={originalContent}
                    loading={loading}
                    error={error}
                    success={success}
                    mocks={mocks}
                    handleSave={handleSave}
                    handleReset={handleReset}
                    editorTheme={editorTheme}
                    fontSize={fontSize}
                    emptyStateTitle={emptyStateTitle}
                    emptyStateDescription={emptyStateDescription}
                />
            </div>
        </div>
    );
}
