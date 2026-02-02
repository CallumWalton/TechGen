import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DynamicTable } from "@/components/DynamicTable";
import { useTechSpec } from "@/context/TechSpecContext";

export const WhatYouBringSection: React.FC = () => {
    const { data, updateWhatYouBring } = useTechSpec();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">What Do You Bring</CardTitle>
                <CardDescription>
                    List all the equipment, instruments, and items you'll bring to the venue.
                    You can add custom columns and tag items as Essential or Non-Essential.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DynamicTable
                    data={data.whatYouBring}
                    onChange={updateWhatYouBring}
                    showTags={true}
                    showStereo={true}
                />
            </CardContent>
        </Card>
    );
};

export default WhatYouBringSection;
