import React from "react";
import { Button } from "@/components/ui/button";
import { useTechSpec } from "@/context/TechSpecContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { PDFExportSettings } from "@/types";

import { FileDown } from "lucide-react";

interface ExportPDFDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onExport: (settings: PDFExportSettings) => void;
    isExporting: boolean;
    hasLogo: boolean;
}

export const ExportPDFDialog: React.FC<ExportPDFDialogProps> = ({
    open,
    onOpenChange,
    onExport,
    isExporting,
}) => {
    const { data } = useTechSpec();
    // hasLogo is now unused in this simplified dialog, but kept in props type for interface compatibility
    // or we can just ignore it.

    const handleExport = () => {
        // Use the current global settings
        onExport(data.pdfSettings);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Export PDF</DialogTitle>
                    <DialogDescription>
                        Generate and download your technical rider as a PDF file.
                        <br />
                        <span className="text-xs text-muted-foreground mt-2 block">
                            Note: Styling settings are applied from the "Styling" tab.
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-sm text-foreground/80">
                        Ready to export your tech spec for <strong>{data.bandName || "your band"}</strong>?
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <FileDown className="h-4 w-4 mr-1" />
                        {isExporting ? "Exporting..." : "Export PDF"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ExportPDFDialog;
