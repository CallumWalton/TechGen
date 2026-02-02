import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DynamicTable } from "@/components/DynamicTable";
import { useTechSpec } from "@/context/TechSpecContext";

export const VenueNeedsSection: React.FC = () => {
    const { data, updateVenueNeeds } = useTechSpec();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">What We Need From The Venue</CardTitle>
                <CardDescription>
                    List all the equipment and support you need from the venue.
                    This helps venues prepare for your performance.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DynamicTable
                    data={data.venueNeeds}
                    onChange={updateVenueNeeds}
                    showTags={true}
                    showStereo={true}
                />
            </CardContent>
        </Card>
    );
};

export default VenueNeedsSection;
