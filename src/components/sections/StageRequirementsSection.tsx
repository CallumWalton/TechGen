import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/components/RichTextEditor";
import { useTechSpec } from "@/context/TechSpecContext";
import { Ruler, Zap, Speaker, Clock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
    title: string;
    icon: LucideIcon;
    iconColor: string;
    isNotNeeded: boolean;
    onToggleNotNeeded: () => void;
    children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    icon: Icon,
    iconColor,
    isNotNeeded,
    onToggleNotNeeded,
    children,
}) => {
    return (
        <div className={cn(
            "border rounded-lg transition-all duration-200",
            isNotNeeded ? "bg-muted/30" : "bg-card"
        )}>
            <div
                className={cn(
                    "flex items-center justify-between p-4",
                    !isNotNeeded && "border-b"
                )}
            >
                <div className="flex items-center gap-2">
                    <Icon className={cn("h-5 w-5", isNotNeeded ? "text-muted-foreground" : iconColor)} />
                    <h3 className={cn(
                        "font-semibold text-lg",
                        isNotNeeded && "text-muted-foreground"
                    )}>
                        {title}
                    </h3>
                    {isNotNeeded && (
                        <span className="text-sm text-muted-foreground italic">(Not needed)</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Label
                        htmlFor={`not-needed-${title.replace(/\s+/g, '-').toLowerCase()}`}
                        className="text-sm text-muted-foreground cursor-pointer"
                    >
                        Not needed
                    </Label>
                    <Checkbox
                        id={`not-needed-${title.replace(/\s+/g, '-').toLowerCase()}`}
                        checked={isNotNeeded}
                        onCheckedChange={onToggleNotNeeded}
                    />
                </div>
            </div>
            {!isNotNeeded && (
                <div className="p-4 pt-0 space-y-4">
                    {children}
                </div>
            )}
        </div>
    );
};

export const StageRequirementsSection: React.FC = () => {
    const {
        data,
        updateStageWidth,
        updateStageDepth,
        toggleStageDimensionsNotNeeded,
        updatePowerRequirements,
        togglePowerNotNeeded,
        updateMonitorRequirements,
        toggleMonitorsNotNeeded,
        updateSoundcheckDuration,
        updateLoadInNotes,
        toggleSoundcheckNotNeeded,
    } = useTechSpec();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Stage & Technical Requirements</CardTitle>
                <CardDescription>
                    Specify your stage dimensions, power needs, monitor setup, and soundcheck requirements.
                    Mark sections as "Not needed" if they don't apply to your performance.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Stage Dimensions */}
                <CollapsibleSection
                    title="Minimum Stage Dimensions"
                    icon={Ruler}
                    iconColor="text-primary"
                    isNotNeeded={data.stageDimensionsNotNeeded}
                    onToggleNotNeeded={toggleStageDimensionsNotNeeded}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="stage-width">Stage Width</Label>
                            <Input
                                id="stage-width"
                                value={data.stageWidth}
                                onChange={(e) => updateStageWidth(e.target.value)}
                                placeholder="e.g., 20 ft / 6m"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stage-depth">Stage Depth</Label>
                            <Input
                                id="stage-depth"
                                value={data.stageDepth}
                                onChange={(e) => updateStageDepth(e.target.value)}
                                placeholder="e.g., 16 ft / 5m"
                            />
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Power Requirements */}
                <CollapsibleSection
                    title="Power Requirements"
                    icon={Zap}
                    iconColor="text-amber-500"
                    isNotNeeded={data.powerNotNeeded}
                    onToggleNotNeeded={togglePowerNotNeeded}
                >
                    <p className="text-sm text-muted-foreground pt-4">
                        Specify power circuits, voltage, amperage, and outlet placement needs.
                    </p>
                    <RichTextEditor
                        value={data.powerRequirements}
                        onChange={updatePowerRequirements}
                        placeholder="e.g., 2x 20A circuits required at stage left, minimum 4 outlets within 10ft of drum riser..."
                        minHeight="120px"
                    />
                </CollapsibleSection>

                {/* Monitor Requirements */}
                <CollapsibleSection
                    title="Monitor Requirements"
                    icon={Speaker}
                    iconColor="text-blue-500"
                    isNotNeeded={data.monitorsNotNeeded}
                    onToggleNotNeeded={toggleMonitorsNotNeeded}
                >
                    <p className="text-sm text-muted-foreground pt-4">
                        Describe your monitor wedge needs, in-ear monitor (IEM) requirements, and mix preferences.
                    </p>
                    <RichTextEditor
                        value={data.monitorRequirements}
                        onChange={updateMonitorRequirements}
                        placeholder="e.g., 4 monitor wedges (2 for vocals, 1 for guitar, 1 for drums), lead singer uses personal IEM system..."
                        minHeight="120px"
                    />
                </CollapsibleSection>

                {/* Soundcheck & Load-in */}
                <CollapsibleSection
                    title="Soundcheck & Load-in"
                    icon={Clock}
                    iconColor="text-green-500"
                    isNotNeeded={data.soundcheckNotNeeded}
                    onToggleNotNeeded={toggleSoundcheckNotNeeded}
                >
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="soundcheck-duration">Soundcheck Duration Required</Label>
                            <Input
                                id="soundcheck-duration"
                                value={data.soundcheckDuration}
                                onChange={(e) => updateSoundcheckDuration(e.target.value)}
                                placeholder="e.g., 45 minutes minimum"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Load-in & Setup Notes</Label>
                            <RichTextEditor
                                value={data.loadInNotes}
                                onChange={updateLoadInNotes}
                                placeholder="e.g., Require access 2 hours before doors, need 2 stagehands for load-in assistance..."
                                minHeight="100px"
                            />
                        </div>
                    </div>
                </CollapsibleSection>
            </CardContent>
        </Card>
    );
};

export default StageRequirementsSection;
