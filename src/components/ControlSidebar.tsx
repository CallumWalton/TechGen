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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTechSpec } from "@/context/TechSpecContext";
import { exportToXML, downloadXML, parseXML } from "@/lib/xml-utils";
import { exportToPDF } from "@/lib/pdf-utils";
import { createExampleTechSpecData } from "@/types";
import type { PDFExportSettings } from "@/types";
import { ExportPDFDialog } from "@/components/ExportPDFDialog";
import { Download, Upload, FileDown, RotateCcw, Sparkles, Eye, EyeOff, AlertCircle } from "lucide-react";

interface ControlSidebarProps {
    showPreview: boolean;
    onTogglePreview: () => void;
}

export const ControlSidebar: React.FC<ControlSidebarProps> = ({
    showPreview,
    onTogglePreview,
}) => {
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
        <TooltipProvider delayDuration={300}>
            <div className="control-sidebar">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xml"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Load Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={handleLoadClick}
                            disabled={isLoading}
                            className="control-sidebar-btn"
                        >
                            <Upload className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                        {isLoading ? "Loading..." : "Load XML"}
                    </TooltipContent>
                </Tooltip>

                {/* Load Example Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => setIsExampleDialogOpen(true)}
                            className="control-sidebar-btn"
                        >
                            <Sparkles className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Load Example</TooltipContent>
                </Tooltip>

                {/* Save Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="default"
                            size="icon"
                            onClick={handleSave}
                            className="control-sidebar-btn"
                        >
                            <Download className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Save Progress</TooltipContent>
                </Tooltip>

                {/* Export PDF Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="default"
                            size="icon"
                            onClick={() => setIsExportDialogOpen(true)}
                            className="control-sidebar-btn bg-green-600 hover:bg-green-700"
                        >
                            <FileDown className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Export PDF</TooltipContent>
                </Tooltip>

                {/* Toggle Preview Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={onTogglePreview}
                            className="control-sidebar-btn"
                        >
                            {showPreview ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                        {showPreview ? "Hide Preview" : "Show Preview"}
                    </TooltipContent>
                </Tooltip>

                {/* Reset Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsResetDialogOpen(true)}
                            className="control-sidebar-btn text-muted-foreground hover:text-destructive"
                        >
                            <RotateCcw className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Reset All</TooltipContent>
                </Tooltip>

                {/* Error Indicator */}
                {loadError && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setLoadError(null)}
                                className="control-sidebar-btn text-destructive"
                            >
                                <AlertCircle className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-[200px]">
                            {loadError} (Click to dismiss)
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>

            {/* Example Dialog */}
            <Dialog open={isExampleDialogOpen} onOpenChange={setIsExampleDialogOpen}>
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

            {/* Export PDF Dialog */}
            <ExportPDFDialog
                open={isExportDialogOpen}
                onOpenChange={setIsExportDialogOpen}
                onExport={handleExportPDF}
                isExporting={isExporting}
                hasLogo={!!data.bandLogo}
            />

            {/* Reset Dialog */}
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
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
        </TooltipProvider>
    );
};

export default ControlSidebar;
