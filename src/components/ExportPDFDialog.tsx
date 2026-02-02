import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTechSpec } from "@/context/TechSpecContext";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { PDFExportSettings, PDFFontFamily } from "@/types";

import { FileDown } from "lucide-react";

interface ExportPDFDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onExport: (settings: PDFExportSettings) => void;
    isExporting: boolean;
    hasLogo: boolean;
}

const FONT_OPTIONS: { value: PDFFontFamily; label: string }[] = [
    { value: "helvetica", label: "Helvetica (Sans-serif)" },
    { value: "times", label: "Times (Serif)" },
    { value: "courier", label: "Courier (Monospace)" },
];

const COLOR_PRESETS = [
    { name: "Blue", primary: "#3b82f6", accent: "#1e293b" },
    { name: "Green", primary: "#22c55e", accent: "#14532d" },
    { name: "Purple", primary: "#8b5cf6", accent: "#3b0764" },
    { name: "Red", primary: "#ef4444", accent: "#450a0a" },
    { name: "Orange", primary: "#f97316", accent: "#431407" },
    { name: "Pink", primary: "#ec4899", accent: "#500724" },
    { name: "Teal", primary: "#14b8a6", accent: "#134e4a" },
    { name: "Slate", primary: "#64748b", accent: "#1e293b" },
];

export const ExportPDFDialog: React.FC<ExportPDFDialogProps> = ({
    open,
    onOpenChange,
    onExport,
    isExporting,
    hasLogo,
}) => {
    const { data } = useTechSpec();
    const [settings, setSettings] = useState<PDFExportSettings>(data.pdfSettings);

    // Update local state when dialog opens or data changes
    React.useEffect(() => {
        if (open) {
            setSettings(data.pdfSettings);
        }
    }, [open, data.pdfSettings]);

    const handleExport = () => {
        onExport(settings);
    };

    const handleColorPreset = (preset: (typeof COLOR_PRESETS)[0]) => {
        setSettings((prev) => ({
            ...prev,
            primaryColor: preset.primary,
            accentColor: preset.accent,
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Export PDF Settings</DialogTitle>
                    <DialogDescription>
                        Customize the appearance of your tech rider PDF.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Font Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="font-family">Font Family</Label>
                        <Select
                            value={settings.fontFamily}
                            onValueChange={(value: PDFFontFamily) =>
                                setSettings((prev) => ({ ...prev, fontFamily: value }))
                            }
                        >
                            <SelectTrigger id="font-family">
                                <SelectValue placeholder="Select a font" />
                            </SelectTrigger>
                            <SelectContent>
                                {FONT_OPTIONS.map((font) => (
                                    <SelectItem key={font.value} value={font.value}>
                                        {font.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Color Presets */}
                    <div className="space-y-2">
                        <Label>Color Theme</Label>
                        <div className="flex flex-wrap gap-2">
                            {COLOR_PRESETS.map((preset) => (
                                <button
                                    key={preset.name}
                                    type="button"
                                    onClick={() => handleColorPreset(preset)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${settings.primaryColor === preset.primary
                                        ? "border-foreground scale-110"
                                        : "border-transparent hover:border-muted-foreground"
                                        }`}
                                    style={{ backgroundColor: preset.primary }}
                                    title={preset.name}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Custom Colors */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="primary-color">Primary Color</Label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    id="primary-color"
                                    value={settings.primaryColor}
                                    onChange={(e) =>
                                        setSettings((prev) => ({ ...prev, primaryColor: e.target.value }))
                                    }
                                    className="w-10 h-10 rounded border cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={settings.primaryColor}
                                    onChange={(e) =>
                                        setSettings((prev) => ({ ...prev, primaryColor: e.target.value }))
                                    }
                                    className="flex-1 px-2 py-1 text-sm border rounded bg-background"
                                    placeholder="#3b82f6"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="accent-color">Accent Color</Label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    id="accent-color"
                                    value={settings.accentColor}
                                    onChange={(e) =>
                                        setSettings((prev) => ({ ...prev, accentColor: e.target.value }))
                                    }
                                    className="w-10 h-10 rounded border cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={settings.accentColor}
                                    onChange={(e) =>
                                        setSettings((prev) => ({ ...prev, accentColor: e.target.value }))
                                    }
                                    className="flex-1 px-2 py-1 text-sm border rounded bg-background"
                                    placeholder="#1e293b"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Logo Option */}
                    {hasLogo && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="show-logo"
                                checked={settings.showLogoOnAllPages}
                                onCheckedChange={(checked) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        showLogoOnAllPages: checked === true,
                                    }))
                                }
                            />
                            <Label htmlFor="show-logo" className="cursor-pointer">
                                Show band logo on all page headers
                            </Label>
                        </div>
                    )}
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
