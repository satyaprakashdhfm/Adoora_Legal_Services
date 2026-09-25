"use client";

import { QueryList } from "@/components/portal/query-list";
import { PageTitle } from "@/components/portal/ui";

export default function AdminQueries() {
  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Client queries"
        title="Questions from clients"
        description="Raised by signed-in clients from their dashboard, often about a particular case. The reply appears on the client's dashboard. Contact-form messages from the public website are under Enquiries."
      />
      <QueryList staff basePath="/admin" />
    </div>
  );
}
