import React from 'react';
import AceEditor from "react-ace";

// Import ace modes and themes
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-one_dark";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/ext-searchbox";

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Save, CheckCircle, AlertCircle, Edit3, RotateCcw, FileJson } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const editorThemes = [
    { value: 'github', label: 'GitHub Light' },
    { value: 'one_dark', label: 'One Dark' },
];

export default function JsonEditor({
    selectedMock,
    content,
    setContent,
    originalContent,
    loading,
    error,
    success,
    mocks,
    handleSave,
    handleReset,
    editorTheme = 'one_dark',
    fontSize = 14,
    emptyStateTitle = "No Service Selected",
    emptyStateDescription = "Select a function from the sidebar to view, edit, and override its response data."
}) {
    const hasChanges = content !== originalContent;

    if (loading) {
        return (
            <div className="md:col-span-3 flex flex-col items-center justify-center h-full min-h-[400px] joyride-json-editor relative">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">Fetching data...</p>
                <div className="absolute w-px h-px opacity-0 joyride-save-btn"></div>
            </div>
        );
    }

    // Since error can be both fetch errors and validation errors,
    // we show the general error screen if there's no selected mock or if the error is likely a fetch error.
    // To be perfectly safe and match original behavior, if there's an error, we show the fullscreen error.
    if (error && (!selectedMock || error.includes("Failed to load"))) {
        return (
            <div className="md:col-span-3 flex flex-col items-center justify-center h-full joyride-json-editor relative">
                <h3 className="text-xl font-semibold text-foreground text-red-500">{error}</h3>
                <p className="text-sm text-muted-foreground">Please Start the Container from the <b>Settings</b> first to view</p>
                <div className="absolute w-px h-px opacity-0 joyride-save-btn"></div>
            </div>
        );
    }

    return (
        <Card className="md:col-span-3 flex flex-col overflow-hidden border-none shadow-md relative bg-background joyride-json-editor">
            {selectedMock ? (
                <>
                    {/* Editor Toolbar */}
                    <div className="flex items-center justify-between p-3 border-b bg-muted/10">
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="font-mono text-sm py-1 px-3 bg-background">
                                {selectedMock}.json
                            </Badge>
                            {mocks.find(m => m.key === selectedMock)?.source === 'memory' && (
                                <div className="flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                                    <Edit3 className="h-3 w-3 mr-1" />
                                    In-Memory Override Active
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <span
                                title="Revert to original file content"
                                className={loading || mocks.find(m => m.key === selectedMock)?.source !== 'memory' ? "cursor-not-allowed" : ""}
                            >
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleReset}
                                    disabled={loading || mocks.find(m => m.key === selectedMock)?.source !== 'memory'}
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset to Default
                                </Button>
                            </span>
                            <Separator orientation="vertical" className="h-6" />
                            <span className={loading || !hasChanges ? "cursor-not-allowed" : ""}>
                                <Button size="sm" title="Changes are saved in-memory" onClick={handleSave} disabled={loading || !hasChanges} className="px-6 transition-all active:scale-95 cursor-pointer joyride-save-btn">
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </span>
                        </div>
                    </div>

                    {/* Alerts Area */}
                    {(error || success) && (
                        <div className="px-4 pt-4 space-y-2">
                            {error && (
                                <Alert className="border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 dark:border-l-red-500 dark:border-y-transparent dark:border-r-transparent text-red-900 dark:text-red-200 shadow-sm animate-in slide-in-from-top-2 py-3">
                                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    <div className="ml-2">
                                        <AlertTitle className="text-base font-semibold tracking-tight text-red-800 dark:text-red-300">Validation Error</AlertTitle>
                                        <AlertDescription className="text-sm mt-1 text-red-700/90 dark:text-red-300/90 font-mono bg-red-100/50 dark:bg-red-900/30 p-2 rounded-md border border-red-200/50 dark:border-red-800/30 block w-full break-all">
                                            {error}
                                        </AlertDescription>
                                    </div>
                                </Alert>
                            )}

                            {success && (
                                <Alert variant="default" className="border-emerald-500/50 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400 shadow-lg animate-in slide-in-from-top-2">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertTitle>Success</AlertTitle>
                                    <AlertDescription>{success}</AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}

                    {/* Editor */}
                    <div className="flex-1 relative min-h-0">
                        <div className="absolute inset-0">
                            <AceEditor
                                mode="json"
                                theme={editorTheme}
                                name="json-editor"
                                onChange={setContent}
                                value={content}
                                fontSize={fontSize}
                                showPrintMargin={false}
                                showGutter={true}
                                highlightActiveLine={true}
                                editorProps={{ $blockScrolling: true }}
                                setOptions={{
                                    useWorker: false,
                                    enableBasicAutocompletion: true,
                                    enableLiveAutocompletion: true,
                                    enableSnippets: true,
                                    showLineNumbers: true,
                                    tabSize: 2,
                                    fontFamily: "'Fira Code', monospace",
                                }}
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                    </div>

                    {/* Editor Footer */}
                    <div className="p-2 border-t bg-muted/30 text-xs text-muted-foreground flex justify-between items-center">
                        <span>{content.length} characters</span>
                        <div className="flex gap-4">
                            <span>Mode: JSON</span>
                            <span>Theme: {editorThemes.find(t => t.value === editorTheme)?.label}</span>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/5 min-h-[400px]">
                    <div className="bg-background p-6 rounded-full shadow-sm mb-4">
                        <FileJson className="h-10 w-10 text-primary/40" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{emptyStateTitle}</h3>
                    <p className="text-sm max-w-sm text-center mt-2 text-muted-foreground">
                        {emptyStateDescription}
                    </p>
                    <div className="absolute bottom-4 right-4 w-px h-px opacity-0 joyride-save-btn"></div>
                </div>
            )}
        </Card>
    );
}
