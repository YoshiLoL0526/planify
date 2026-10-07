import { FolderPlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireSession } from "@/lib/session";
import { texts } from "@/lib/texts";

export default async function HomePage() {
  const session = await requireSession();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          {texts.home.greeting(session.user.name)}
        </h1>
        <p className="text-muted-foreground text-sm">{texts.app.tagline}</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="bg-muted flex size-12 items-center justify-center rounded-full">
            <FolderPlusIcon className="text-muted-foreground size-6" />
          </div>
          <h2 className="font-heading text-lg font-medium">
            {texts.home.emptyTitle}
          </h2>
          <p className="text-muted-foreground max-w-md text-sm">
            {texts.home.emptyDescription}
          </p>
          <Button disabled>{texts.home.newProject}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
