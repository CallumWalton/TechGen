import React, { useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/RichTextEditor";
import { useTechSpec } from "@/context/TechSpecContext";
import { Upload, X, Image as ImageIcon, FileText, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export const AboutYouSection: React.FC = () => {
    const {
        data,
        updateAboutYou,
        updateBandLogo,
        updateHasBringingLighting,
        updateBandName,
        updateRiderVersion,
    } = useTechSpec();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogoUpload = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            // Check if it's an image
            if (!file.type.startsWith("image/")) {
                alert("Please upload an image file");
                return;
            }

            // Check file size (max 2MB for logo)
            if (file.size > 2 * 1024 * 1024) {
                alert("Logo size must be less than 2MB");
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                updateBandLogo(base64);
            };
            reader.readAsDataURL(file);
        },
        [updateBandLogo]
    );

    const handleRemoveLogo = useCallback(() => {
        updateBandLogo(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, [updateBandLogo]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const file = e.dataTransfer.files?.[0];
            if (!file) return;

            if (!file.type.startsWith("image/")) {
                alert("Please upload an image file");
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                alert("Logo size must be less than 2MB");
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                updateBandLogo(base64);
            };
            reader.readAsDataURL(file);
        },
        [updateBandLogo]
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Tell Us About You</CardTitle>
                <CardDescription>
                    Upload your band logo and write a brief introduction. This helps venues understand who you are.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Document Metadata Section */}
                <div className="border rounded-lg p-4 bg-muted/20 space-y-4">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Document Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="band-name">Band/Artist Name</Label>
                            <Input
                                id="band-name"
                                value={data.bandName}
                                onChange={(e) => updateBandName(e.target.value)}
                                placeholder="Enter your band or artist name..."
                                className="text-lg font-medium"
                            />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="rider-version">Rider Version</Label>
                                <Input
                                    id="rider-version"
                                    value={data.riderVersion}
                                    onChange={(e) => updateRiderVersion(e.target.value)}
                                    placeholder="1.0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Last Updated
                                </Label>
                                <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                                    {data.lastUpdated || "Not saved yet"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Band Logo Upload Section */}
                <div className="space-y-2">
                    <Label>Band Logo</Label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                    />

                    {data.bandLogo ? (
                        <div className="relative border rounded-lg overflow-hidden bg-muted/20 inline-block">
                            <div className="relative p-4">
                                <img
                                    src={data.bandLogo}
                                    alt="Band logo"
                                    className="max-h-[200px] max-w-[300px] object-contain"
                                />
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={handleRemoveLogo}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex justify-center pb-3 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-4 w-4 mr-1" />
                                    Replace Logo
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-lg p-8 text-center max-w-md",
                                "hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer"
                            )}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <div className="flex flex-col items-center gap-3">
                                <div className="p-3 bg-muted rounded-full">
                                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium">Upload Band Logo</p>
                                    <p className="text-sm text-muted-foreground">
                                        Click to browse or drag and drop
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        PNG, JPG, or GIF up to 2MB
                                    </p>
                                </div>
                                <Button variant="outline" size="sm">
                                    <Upload className="h-4 w-4 mr-1" />
                                    Choose File
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* About Text Section */}
                <div className="space-y-2">
                    <Label>About Your Band</Label>
                    <RichTextEditor
                        value={data.aboutYou}
                        onChange={updateAboutYou}
                        maxWords={150}
                        placeholder="Introduce yourself or your band here..."
                        minHeight="200px"
                    />
                </div>

                {/* Lighting Checkbox Section */}
                <div className="border rounded-lg p-4 bg-muted/20">
                    <div className="flex items-start gap-3">
                        <input
                            type="checkbox"
                            id="bringing-lighting"
                            checked={data.hasBringingLighting}
                            onChange={(e) => updateHasBringingLighting(e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                        />
                        <div>
                            <Label htmlFor="bringing-lighting" className="font-medium cursor-pointer">
                                Are you bringing your own lighting?
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                                Enable this if you're bringing lighting equipment. This will add a category column to your equipment lists and enable the Lighting Patch List section.
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default AboutYouSection;
