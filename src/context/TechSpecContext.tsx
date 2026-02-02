import React, { createContext, useContext, useState, type ReactNode } from "react";
import type { TechSpecData, DynamicTableData, SendListData, LightingPatchListData, ContactInfo, PDFExportSettings } from "@/types";
import { createDefaultTechSpecData } from "@/types";

interface TechSpecContextType {
    data: TechSpecData;
    setData: React.Dispatch<React.SetStateAction<TechSpecData>>;
    // Document Metadata
    updateBandName: (value: string) => void;
    updateRiderVersion: (value: string) => void;
    // About You
    updateAboutYou: (value: string) => void;
    updateBandLogo: (value: string | null) => void;
    updateHasBringingLighting: (value: boolean) => void;
    // Contact Information
    addContact: (contact: ContactInfo) => void;
    updateContact: (contact: ContactInfo) => void;
    removeContact: (contactId: string) => void;
    // Stage & Technical Requirements
    updateStageWidth: (value: string) => void;
    updateStageDepth: (value: string) => void;
    toggleStageDimensionsNotNeeded: () => void;
    updatePowerRequirements: (value: string) => void;
    togglePowerNotNeeded: () => void;
    updateMonitorRequirements: (value: string) => void;
    toggleMonitorsNotNeeded: () => void;
    updateSoundcheckDuration: (value: string) => void;
    updateLoadInNotes: (value: string) => void;
    toggleSoundcheckNotNeeded: () => void;
    // Equipment Lists
    updateWhatYouBring: (value: DynamicTableData) => void;
    updateVenueNeeds: (value: DynamicTableData) => void;
    updateSendList: (value: SendListData) => void;
    updateLightingPatchList: (value: LightingPatchListData) => void;
    // Band Plot
    updateBandPlotImage: (value: string | null) => void;
    updateStagePlotDescription: (value: string) => void;
    updateFooterNotes: (value: string) => void;
    // PDF Settings
    updatePdfSettings: (settings: PDFExportSettings) => void;
    // Data Management
    resetData: () => void;
    loadData: (data: TechSpecData) => void;
}

const TechSpecContext = createContext<TechSpecContextType | undefined>(undefined);

export const TechSpecProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [data, setData] = useState<TechSpecData>(createDefaultTechSpecData());

    // Helper to update lastUpdated timestamp
    const withTimestamp = (updater: (prev: TechSpecData) => TechSpecData) => {
        return (prev: TechSpecData) => ({
            ...updater(prev),
            lastUpdated: new Date().toISOString().split("T")[0],
        });
    };

    // Document Metadata
    const updateBandName = (value: string) => {
        setData(withTimestamp((prev) => ({ ...prev, bandName: value })));
    };

    const updateRiderVersion = (value: string) => {
        setData(withTimestamp((prev) => ({ ...prev, riderVersion: value })));
    };

    // About You
    const updateAboutYou = (value: string) => {
        setData((prev) => ({ ...prev, aboutYou: value }));
    };

    const updateBandLogo = (value: string | null) => {
        setData((prev) => ({ ...prev, bandLogo: value }));
    };

    const updateHasBringingLighting = (value: boolean) => {
        setData((prev) => {
            // When enabling lighting, add category column to tables if not present
            const addCategoryColumn = (tableData: DynamicTableData): DynamicTableData => {
                if (value && !tableData.columns.find(c => c.id === "category")) {
                    const newColumns = [
                        tableData.columns[0], // Keep item-name first
                        { id: "category", name: "Category", dataType: "category" as const, isLocked: true },
                        ...tableData.columns.slice(1),
                    ];
                    // Add default category value to existing rows
                    const newRows = tableData.rows.map(row => ({
                        ...row,
                        data: { ...row.data, category: row.data.category || "audio" },
                    }));
                    return { columns: newColumns, rows: newRows };
                } else if (!value) {
                    // When disabling lighting, remove category column
                    const newColumns = tableData.columns.filter(c => c.id !== "category");
                    const newRows = tableData.rows.map(row => {
                        const { category, ...restData } = row.data;
                        return { ...row, data: restData };
                    });
                    return { columns: newColumns, rows: newRows };
                }
                return tableData;
            };

            return {
                ...prev,
                hasBringingLighting: value,
                whatYouBring: addCategoryColumn(prev.whatYouBring),
                venueNeeds: addCategoryColumn(prev.venueNeeds),
            };
        });
    };

    // Contact Information
    const addContact = (contact: ContactInfo) => {
        setData((prev) => ({ ...prev, contacts: [...prev.contacts, contact] }));
    };

    const updateContact = (contact: ContactInfo) => {
        setData((prev) => ({
            ...prev,
            contacts: prev.contacts.map((c) => (c.id === contact.id ? contact : c)),
        }));
    };

    const removeContact = (contactId: string) => {
        setData((prev) => ({
            ...prev,
            contacts: prev.contacts.filter((c) => c.id !== contactId),
        }));
    };

    // Stage & Technical Requirements
    const updateStageWidth = (value: string) => {
        setData((prev) => ({ ...prev, stageWidth: value }));
    };

    const updateStageDepth = (value: string) => {
        setData((prev) => ({ ...prev, stageDepth: value }));
    };

    const toggleStageDimensionsNotNeeded = () => {
        setData((prev) => ({ ...prev, stageDimensionsNotNeeded: !prev.stageDimensionsNotNeeded }));
    };

    const updatePowerRequirements = (value: string) => {
        setData((prev) => ({ ...prev, powerRequirements: value }));
    };

    const togglePowerNotNeeded = () => {
        setData((prev) => ({ ...prev, powerNotNeeded: !prev.powerNotNeeded }));
    };

    const updateMonitorRequirements = (value: string) => {
        setData((prev) => ({ ...prev, monitorRequirements: value }));
    };

    const toggleMonitorsNotNeeded = () => {
        setData((prev) => ({ ...prev, monitorsNotNeeded: !prev.monitorsNotNeeded }));
    };

    const updateSoundcheckDuration = (value: string) => {
        setData((prev) => ({ ...prev, soundcheckDuration: value }));
    };

    const updateLoadInNotes = (value: string) => {
        setData((prev) => ({ ...prev, loadInNotes: value }));
    };

    const toggleSoundcheckNotNeeded = () => {
        setData((prev) => ({ ...prev, soundcheckNotNeeded: !prev.soundcheckNotNeeded }));
    };

    // Equipment Lists
    const updateWhatYouBring = (value: DynamicTableData) => {
        setData((prev) => ({ ...prev, whatYouBring: value }));
    };

    const updateVenueNeeds = (value: DynamicTableData) => {
        setData((prev) => ({ ...prev, venueNeeds: value }));
    };

    const updateSendList = (value: SendListData) => {
        setData((prev) => ({ ...prev, sendList: value }));
    };

    const updateLightingPatchList = (value: LightingPatchListData) => {
        setData((prev) => ({ ...prev, lightingPatchList: value }));
    };

    // Band Plot
    const updateBandPlotImage = (value: string | null) => {
        setData((prev) => ({ ...prev, bandPlotImage: value }));
    };

    const updateStagePlotDescription = (value: string) => {
        setData((prev) => ({ ...prev, stagePlotDescription: value }));
    };

    const updateFooterNotes = (value: string) => {
        setData((prev) => ({ ...prev, footerNotes: value }));
    };

    // PDF Settings
    const updatePdfSettings = (settings: PDFExportSettings) => {
        setData((prev) => ({ ...prev, pdfSettings: settings }));
    };

    // Data Management
    const resetData = () => {
        setData(createDefaultTechSpecData());
    };

    const loadData = (newData: TechSpecData) => {
        // Merge with defaults to ensure all new fields exist (backward compatibility)
        const defaults = createDefaultTechSpecData();
        setData({
            ...defaults,
            ...newData,
            contacts: newData.contacts || defaults.contacts,
        });
    };

    return (
        <TechSpecContext.Provider
            value={{
                data,
                setData,
                updateBandName,
                updateRiderVersion,
                updateAboutYou,
                updateBandLogo,
                updateHasBringingLighting,
                addContact,
                updateContact,
                removeContact,
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
                updateWhatYouBring,
                updateVenueNeeds,
                updateSendList,
                updateLightingPatchList,
                updateBandPlotImage,
                updateStagePlotDescription,
                updateFooterNotes,
                updatePdfSettings,
                resetData,
                loadData,
            }}
        >
            {children}
        </TechSpecContext.Provider>
    );
};

export const useTechSpec = (): TechSpecContextType => {
    const context = useContext(TechSpecContext);
    if (!context) {
        throw new Error("useTechSpec must be used within a TechSpecProvider");
    }
    return context;
};

