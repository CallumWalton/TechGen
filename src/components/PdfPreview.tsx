import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTechSpec } from "@/context/TechSpecContext";
import { generatePDFBlob } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, EyeOff } from "lucide-react";

const REFRESH_COOLDOWN = 3000; // 3 seconds

interface PdfPreviewProps {
    isVisible: boolean;
    onToggleVisibility: () => void;
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({
    isVisible,
    onToggleVisibility,
}) => {
    const { data } = useTechSpec();
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastRefreshTimeRef = useRef<number>(0);
    const previousUrlRef = useRef<string | null>(null);

    // Generate PDF and update preview
    const generatePreview = useCallback(async () => {
        setIsLoading(true);
        lastRefreshTimeRef.current = Date.now();

        try {
            const blob = await generatePDFBlob(data);
            const url = URL.createObjectURL(blob);

            // Clean up previous URL
            if (previousUrlRef.current) {
                URL.revokeObjectURL(previousUrlRef.current);
            }

            previousUrlRef.current = url;
            setPdfUrl(url);
        } catch (error) {
            console.error("Error generating PDF preview:", error);
        } finally {
            setIsLoading(false);
        }
    }, [data]);

    // Manual refresh button handler
    const handleManualRefresh = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        generatePreview();
    };

    // Effect to throttle data changes
    useEffect(() => {
        if (!isVisible) return;

        // Clear existing timer
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        const now = Date.now();
        const timeSinceLast = now - lastRefreshTimeRef.current;

        if (timeSinceLast >= REFRESH_COOLDOWN) {
            generatePreview();
        } else {
            const wait = REFRESH_COOLDOWN - timeSinceLast;
            timeoutRef.current = setTimeout(() => {
                generatePreview();
            }, wait);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [data, isVisible, generatePreview]);

    // Initial generation when becoming visible
    useEffect(() => {
        if (isVisible && !pdfUrl && !isLoading && lastRefreshTimeRef.current === 0) {
            generatePreview();
        }
    }, [isVisible, pdfUrl, isLoading, generatePreview]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (previousUrlRef.current) {
                URL.revokeObjectURL(previousUrlRef.current);
            }
        };
    }, []);

    // When not visible, don't render anything (visibility controlled by ControlSidebar)
    if (!isVisible) {
        return null;
    }

    return (
        <div className="pdf-preview-panel">
            <div className="pdf-preview-content">
                {/* Floating controls on the right */}
                <div className="pdf-preview-controls">
                    {isLoading && (
                        <span className="pdf-preview-countdown bg-background/80 px-2 py-1 rounded text-xs font-mono">
                            <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                            Updating...
                        </span>
                    )}
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={handleManualRefresh}
                        disabled={isLoading}
                        title="Refresh now"
                        className="h-8 w-8"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={onToggleVisibility}
                        title="Hide preview"
                        className="h-8 w-8"
                    >
                        <EyeOff className="h-4 w-4" />
                    </Button>
                </div>

                {isLoading && !pdfUrl ? (
                    <div className="pdf-preview-loading">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p>Generating preview...</p>
                    </div>
                ) : pdfUrl ? (
                    <iframe
                        src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                        className="pdf-preview-iframe"
                        title="PDF Preview"
                    />
                ) : (
                    <div className="pdf-preview-empty">
                        <p>No preview available</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleManualRefresh}
                        >
                            Generate Preview
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PdfPreview;
