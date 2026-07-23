import Link from "next/link";

import { listDocumentTemplates } from "@/components/document-engine/templates/registry";
import { PageHeader } from "@/components/shared/page-header";
import { PageHeaderActions, PagePrimaryAction } from "@/components/shared/page-header-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function NewDocumentTemplatePicker() {
  const templates = listDocumentTemplates();

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Document"
        description="Choose a template to start a new document."
        actions={
          <PageHeaderActions
            primary={<PagePrimaryAction href="/documents">Back to Documents</PagePrimaryAction>}
          />
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <Link key={template.id} href={`/documents/new?template=${template.id}`} className="block">
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardHeader>
                <CardTitle>{template.label}</CardTitle>
                <CardDescription>{template.defaultDocumentTitle}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Start with the {template.label.toLowerCase()} layout and branded header/footer.
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
