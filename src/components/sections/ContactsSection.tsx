import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTechSpec } from "@/context/TechSpecContext";
import { createDefaultContactInfo, CONTACT_RESPONSIBILITIES, type ContactInfo, type ContactResponsibility } from "@/types";
import { Plus, Trash2, User, Phone, Mail, Tag } from "lucide-react";

interface ContactCardProps {
    contact: ContactInfo;
    onUpdate: (contact: ContactInfo) => void;
    onRemove: () => void;
}

const ContactCard: React.FC<ContactCardProps> = ({ contact, onUpdate, onRemove }) => {
    const toggleResponsibility = (resp: ContactResponsibility) => {
        const newResponsibilities = contact.responsibilities.includes(resp)
            ? contact.responsibilities.filter((r) => r !== resp)
            : [...contact.responsibilities, resp];
        onUpdate({ ...contact, responsibilities: newResponsibilities });
    };

    return (
        <div className="border rounded-lg p-4 space-y-4 bg-card">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <span className="font-medium">Contact</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRemove}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor={`name-${contact.id}`} className="flex items-center gap-1">
                        <User className="h-3 w-3" /> Name
                    </Label>
                    <Input
                        id={`name-${contact.id}`}
                        value={contact.name}
                        onChange={(e) => onUpdate({ ...contact, name: e.target.value })}
                        placeholder="Contact name..."
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`phone-${contact.id}`} className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Phone
                    </Label>
                    <Input
                        id={`phone-${contact.id}`}
                        value={contact.phone}
                        onChange={(e) => onUpdate({ ...contact, phone: e.target.value })}
                        placeholder="+44 7000000000"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`email-${contact.id}`} className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> Email
                    </Label>
                    <Input
                        id={`email-${contact.id}`}
                        value={contact.email}
                        onChange={(e) => onUpdate({ ...contact, email: e.target.value })}
                        placeholder="contact@example.com"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Responsibilities
                </Label>
                <div className="flex flex-wrap gap-2">
                    {CONTACT_RESPONSIBILITIES.map((resp) => (
                        <Badge
                            key={resp.value}
                            variant={contact.responsibilities.includes(resp.value) ? "default" : "outline"}
                            className="cursor-pointer select-none transition-colors"
                            onClick={() => toggleResponsibility(resp.value)}
                        >
                            {resp.label}
                        </Badge>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const ContactsSection: React.FC = () => {
    const { data, addContact, updateContact, removeContact } = useTechSpec();

    const handleAddContact = () => {
        addContact(createDefaultContactInfo());
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Contact Information</CardTitle>
                <CardDescription>
                    Add contacts for your team. Select one or more responsibilities for each person.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {data.contacts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No contacts added yet</p>
                        <p className="text-sm">Click "Add Contact" to get started</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {data.contacts.map((contact) => (
                            <ContactCard
                                key={contact.id}
                                contact={contact}
                                onUpdate={updateContact}
                                onRemove={() => removeContact(contact.id)}
                            />
                        ))}
                    </div>
                )}

                <Button onClick={handleAddContact} className="w-full" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                </Button>
            </CardContent>
        </Card>
    );
};
