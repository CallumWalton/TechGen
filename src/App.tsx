import { useState } from "react";
import { TechSpecProvider, useTechSpec } from "@/context/TechSpecContext";
import { ControlSidebar } from "@/components/ControlSidebar";
import { AboutYouSection } from "@/components/sections/AboutYouSection";
import { ContactsSection } from "@/components/sections/ContactsSection";
import { WhatYouBringSection } from "@/components/sections/WhatYouBringSection";
import { VenueNeedsSection } from "@/components/sections/VenueNeedsSection";
import { StageRequirementsSection } from "@/components/sections/StageRequirementsSection";
import { SendListSection } from "@/components/sections/SendListSection";
import { LightingPatchListSection } from "@/components/sections/LightingPatchListSection";
import { BandPlotSection } from "@/components/sections/BandPlotSection";
import { PdfPreview } from "@/components/PdfPreview";
import { PdfSettingsSection } from "@/components/sections/PdfSettingsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConvoyLogo from "@/assets/TechSpecApp-Convoy.svg";
import "@/components/rich-editor-styles.css";
import "./index.css";

function AppContent() {
  const { data } = useTechSpec();
  const hasLighting = data.hasBringingLighting;
  const [showPreview, setShowPreview] = useState(true);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="app-layout">
        <main className={`app-editor ${showPreview ? "with-preview" : ""}`}>
          <div className="container mx-auto px-4 py-8">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-6">
              <img src={ConvoyLogo} alt="Convoy Logo" className="h-12 w-12" />
              <div>
                <h1 className="text-xl font-bold">Tech Specification Generator</h1>
                <p className="text-sm text-muted-foreground">Create your band's technical rider</p>
              </div>
            </div>
            <Tabs defaultValue="about" className="space-y-6">
              <TabsList className="flex flex-wrap w-full lg:w-auto gap-1 h-auto p-1">
                <TabsTrigger value="about" className="text-xs sm:text-sm">
                  1. About
                </TabsTrigger>
                <TabsTrigger value="contacts" className="text-xs sm:text-sm">
                  2. Contacts
                </TabsTrigger>
                <TabsTrigger value="bring" className="text-xs sm:text-sm">
                  3. Equipment
                </TabsTrigger>
                <TabsTrigger value="venue" className="text-xs sm:text-sm">
                  4. Backline
                </TabsTrigger>
                <TabsTrigger value="stage" className="text-xs sm:text-sm">
                  5. Stage
                </TabsTrigger>
                <TabsTrigger value="sendlist" className="text-xs sm:text-sm">
                  6. Audio
                </TabsTrigger>
                {hasLighting && (
                  <TabsTrigger value="lighting" className="text-xs sm:text-sm">
                    7. Lighting
                  </TabsTrigger>
                )}
                <TabsTrigger value="plot" className="text-xs sm:text-sm">
                  {hasLighting ? '8' : '7'}. Plot
                </TabsTrigger>
                <TabsTrigger value="pdf-settings" className="text-xs sm:text-sm">
                  {hasLighting ? '9' : '8'}. Styling
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-4">
                <AboutYouSection />
              </TabsContent>

              <TabsContent value="contacts" className="space-y-4">
                <ContactsSection />
              </TabsContent>

              <TabsContent value="bring" className="space-y-4">
                <WhatYouBringSection />
              </TabsContent>

              <TabsContent value="venue" className="space-y-4">
                <VenueNeedsSection />
              </TabsContent>

              <TabsContent value="stage" className="space-y-4">
                <StageRequirementsSection />
              </TabsContent>

              <TabsContent value="sendlist" className="space-y-4">
                <SendListSection />
              </TabsContent>

              {hasLighting && (
                <TabsContent value="lighting" className="space-y-4">
                  <LightingPatchListSection />
                </TabsContent>
              )}

              <TabsContent value="plot" className="space-y-4">
                <BandPlotSection />
              </TabsContent>

              <TabsContent value="pdf-settings" className="space-y-4">
                <PdfSettingsSection />
              </TabsContent>
            </Tabs>
            <footer className="border-t py-6 mt-12">
              <div className="container text-center text-sm text-muted-foreground">
                <p>Made with love 💖 from <a style={{ color: "var(--primary)", textDecoration: "underline" }} href="https://convoy.band">Convoy</a></p>
              </div>
            </footer>
          </div>
        </main>

        <PdfPreview
          isVisible={showPreview}
          onToggleVisibility={() => setShowPreview(!showPreview)}
        />

        <ControlSidebar
          showPreview={showPreview}
          onTogglePreview={() => setShowPreview(!showPreview)}
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <TechSpecProvider>
      <AppContent />
    </TechSpecProvider>
  );
}

export default App;


