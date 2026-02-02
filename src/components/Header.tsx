import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useTechSpec } from "@/context/TechSpecContext";
import { exportToXML, downloadXML, parseXML } from "@/lib/xml-utils";
import { exportToPDF } from "@/lib/pdf-utils";
import { createExampleTechSpecData } from "@/types";
import type { PDFExportSettings } from "@/types";
import { ExportPDFDialog } from "@/components/ExportPDFDialog";
import { Download, Upload, FileText, RotateCcw, FileDown, Sparkles } from "lucide-react";

export const Header: React.FC = () => {
    const { data, loadData, resetData } = useTechSpec();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [isExampleDialogOpen, setIsExampleDialogOpen] = useState(false);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const handleSave = () => {
        try {
            const xml = exportToXML(data);
            const timestamp = new Date().toISOString().split("T")[0];
            downloadXML(xml, `tech-spec-${timestamp}.xml`);
        } catch (error) {
            console.error("Failed to save:", error);
            alert("Failed to save the file. Please try again.");
        }
    };

    const handleLoadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setLoadError(null);

        try {
            const loadedData = await parseXML(file);
            loadData(loadedData);
        } catch (error) {
            console.error("Failed to load:", error);
            setLoadError(error instanceof Error ? error.message : "Failed to load file");
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleLoadExample = () => {
        const exampleData = createExampleTechSpecData();
        loadData(exampleData);
        setIsExampleDialogOpen(false);
    };

    const handleExportPDF = async (settings: PDFExportSettings) => {
        setIsExporting(true);
        try {
            await exportToPDF(data, settings);
            setIsExportDialogOpen(false);
        } catch (error) {
            console.error("Failed to export PDF:", error);
            alert("Failed to export PDF. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleReset = () => {
        resetData();
        setIsResetDialogOpen(false);
    };

    return (
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo / Title */}
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary rounded-lg">
                            <FileText className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Tech Spec Generator</h1>
                            <p className="text-sm text-muted-foreground">Create your band's technical rider</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xml"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLoadClick}
                            disabled={isLoading}
                        >
                            <Upload className="h-4 w-4 mr-1" />
                            {isLoading ? "Loading..." : "Load"}
                        </Button>

                        <Dialog open={isExampleDialogOpen} onOpenChange={setIsExampleDialogOpen}>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsExampleDialogOpen(true)}
                            >
                                <Sparkles className="h-4 w-4 mr-1" />
                                Load Example
                            </Button>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Load Example Data?</DialogTitle>
                                    <DialogDescription>
                                        This will replace your current data with example content from a fictional band. Make sure to save your current work first.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsExampleDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleLoadExample}>
                                        Load Example
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleSave}
                        >
                            <Download className="h-4 w-4 mr-1" />
                            Save Progress
                        </Button>

                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => setIsExportDialogOpen(true)}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <FileDown className="h-4 w-4 mr-1" />
                            Export PDF
                        </Button>

                        <ExportPDFDialog
                            open={isExportDialogOpen}
                            onOpenChange={setIsExportDialogOpen}
                            onExport={handleExportPDF}
                            isExporting={isExporting}
                            hasLogo={!!data.bandLogo}
                        />

                        <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => setIsResetDialogOpen(true)}
                            >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Reset
                            </Button>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Reset All Data?</DialogTitle>
                                    <DialogDescription>
                                        This will clear all your progress. Make sure to save your work first if you want to keep it.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="destructive" onClick={handleReset}>
                                        Reset All
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Error Message */}
                {loadError && (
                    <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                        {loadError}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-auto p-1"
                            onClick={() => setLoadError(null)}
                        >
                            Dismiss
                        </Button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
