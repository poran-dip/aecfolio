import { Plus, Trash2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";

interface ProfileSectionProps<T extends { id: string }, FormDataT> {
  title: string;
  items: T[];
  FormComponent: React.ComponentType<{
    initial: FormDataT;
    onSave: (data: FormDataT) => void;
    onCancel: () => void;
  }>;
  renderTrigger: (item: T) => React.ReactNode;
  editingId: string | null;
  onAddClick: () => void;
  onCancel: () => void;
  getFormInitialData: (item: T | null) => FormDataT;
  getFormOnSave: (itemId: string) => (data: FormDataT) => void;
  onItemDelete: (id: string) => () => void;
}

export function ProfileSection<T extends { id: string }, FormDataT>({
  title,
  items,
  FormComponent,
  renderTrigger,
  editingId,
  onAddClick,
  onCancel,
  getFormInitialData,
  getFormOnSave,
  onItemDelete,
}: ProfileSectionProps<T, FormDataT>) {
  return (
    <Card>
      <CardContent className="pt-4 space-y-2">
        <h2 className="text-sm font-medium">{title}</h2>
        <Separator />
        <Accordion type="single" collapsible className="space-y-2">
          {items.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="border rounded-md px-3"
            >
              <AccordionTrigger className="hover:no-underline py-2">
                {renderTrigger(item)}
              </AccordionTrigger>
              <AccordionContent className="pb-3 space-y-2">
                <FormComponent
                  initial={getFormInitialData(item)}
                  onSave={getFormOnSave(item.id)}
                  onCancel={onCancel}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={onItemDelete(item.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        {editingId === "new" ? (
          <FormComponent
            initial={getFormInitialData(null)}
            onSave={getFormOnSave("new")}
            onCancel={onCancel}
          />
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full h-8 text-xs"
            onClick={onAddClick}
          >
            <Plus className="h-3 w-3 mr-1" /> Add {title}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
