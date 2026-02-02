import React from "react";
import { useTechSpec } from "@/context/TechSpecContext";
import type { PDFFontFamily } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export const PdfSettingsSection: React.FC = () => {
    const { data, updatePdfSettings } = useTechSpec();
    const { pdfSettings } = data;



    const handlePrimaryColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updatePdfSettings({ ...pdfSettings, primaryColor: e.target.value });
    };

    const handleAccentColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updatePdfSettings({ ...pdfSettings, accentColor: e.target.value });
    };

    const handleFontChange = (value: string) => {
        updatePdfSettings({ ...pdfSettings, fontFamily: value as PDFFontFamily });
    };

    const toggleSection = (key: keyof typeof pdfSettings) => {
        const currentValue = pdfSettings[key] ?? true;
        updatePdfSettings({ ...pdfSettings, [key]: !currentValue });
    };

    const handleLogoVisibilityChange = (checked: boolean) => {
        updatePdfSettings({ ...pdfSettings, showLogoOnAllPages: checked });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">PDF Export Settings</h2>
                <p className="text-muted-foreground">
                    Customize the look and feel of your generated PDF. These settings are saved with your file.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Styling Options</CardTitle>
                    <CardDescription>
                        Configure the fonts and colors used in your technical rider
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Font Family */}
                    <div className="space-y-3">
                        <Label>Font Family</Label>
                        <Select
                            value={pdfSettings.fontFamily}
                            onValueChange={handleFontChange}
                        >
                            <SelectTrigger className="w-full sm:w-[300px]">
                                <SelectValue placeholder="Select a font" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="helvetica" className="font-sans">Helvetica (Sans-Serif)</SelectItem>
                                <SelectItem value="times" className="font-serif">Times New Roman (Serif)</SelectItem>
                                <SelectItem value="courier" className="font-mono">Courier (Monospace)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            This font will be used for all text in the document.
                        </p>
                    </div>

                    <Separator />

                    {/* Colors */}
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-3">
                            <Label htmlFor="primary-color">Primary Color</Label>
                            <div className="flex items-center gap-3">
                                <div
                                    className="h-10 w-10 rounded-md border shadow-sm"
                                    style={{ backgroundColor: pdfSettings.primaryColor }}
                                />
                                <Input
                                    id="primary-color"
                                    type="color"
                                    value={pdfSettings.primaryColor}
                                    onChange={handlePrimaryColorChange}
                                    className="h-10 w-full flex-1 cursor-pointer"
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Used for headings, table headers, and accents.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="accent-color">Secondary Color</Label>
                            <div className="flex items-center gap-3">
                                <div
                                    className="h-10 w-10 rounded-md border shadow-sm"
                                    style={{ backgroundColor: pdfSettings.accentColor }}
                                />
                                <Input
                                    id="accent-color"
                                    type="color"
                                    value={pdfSettings.accentColor}
                                    onChange={handleAccentColorChange}
                                    className="h-10 w-full flex-1 cursor-pointer"
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Used for subtle highlights and secondary elements.
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Logo Visibility */}
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-1">
                            <Label htmlFor="show-logo">Show Logo in Header</Label>
                            <p className="text-sm text-muted-foreground">
                                Display your band logo in the header of every page (except the cover).
                            </p>
                        </div>
                        <Switch
                            id="show-logo"
                            checked={pdfSettings.showLogoOnAllPages}
                            onCheckedChange={handleLogoVisibilityChange}
                            disabled={!data.bandLogo}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Content Selection</CardTitle>
                    <CardDescription>
                        Choose which sections to include in your generated PDF.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="includeCoverPage" checked={pdfSettings.includeCoverPage ?? true} onCheckedChange={() => toggleSection("includeCoverPage")} />
                            <Label htmlFor="includeCoverPage">Cover Page</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="includeAboutSection" checked={pdfSettings.includeAboutSection ?? true} onCheckedChange={() => toggleSection("includeAboutSection")} />
                            <Label htmlFor="includeAboutSection">About Section</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="includeContactsSection" checked={pdfSettings.includeContactsSection ?? true} onCheckedChange={() => toggleSection("includeContactsSection")} />
                            <Label htmlFor="includeContactsSection">Contacts</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="includeEquipmentSection" checked={pdfSettings.includeEquipmentSection ?? true} onCheckedChange={() => toggleSection("includeEquipmentSection")} />
                            <Label htmlFor="includeEquipmentSection">What You Bring</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="includeVenueNeedsSection" checked={pdfSettings.includeVenueNeedsSection ?? true} onCheckedChange={() => toggleSection("includeVenueNeedsSection")} />
                            <Label htmlFor="includeVenueNeedsSection">What We Need</Label>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="includeStageReqsSection" checked={pdfSettings.includeStageReqsSection ?? true} onCheckedChange={() => toggleSection("includeStageReqsSection")} />
                            <Label htmlFor="includeStageReqsSection">Stage Requirements</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="includeSendListSection" checked={pdfSettings.includeSendListSection ?? true} onCheckedChange={() => toggleSection("includeSendListSection")} />
                            <Label htmlFor="includeSendListSection">Audio Input List</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="includeLightingSection" checked={pdfSettings.includeLightingSection ?? true} onCheckedChange={() => toggleSection("includeLightingSection")} disabled={!data.hasBringingLighting} />
                            <Label htmlFor="includeLightingSection" className={!data.hasBringingLighting ? "text-muted-foreground" : ""}>Lighting Patch List</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="includeStagePlotSection" checked={pdfSettings.includeStagePlotSection ?? true} onCheckedChange={() => toggleSection("includeStagePlotSection")} />
                            <Label htmlFor="includeStagePlotSection">Stage Plot</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="includeFooterNotes" checked={pdfSettings.includeFooterNotes ?? true} onCheckedChange={() => toggleSection("includeFooterNotes")} />
                            <Label htmlFor="includeFooterNotes">Additional Notes</Label>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
