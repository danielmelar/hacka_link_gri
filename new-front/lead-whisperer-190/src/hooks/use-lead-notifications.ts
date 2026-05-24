import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { onSSEMessage } from "@/lib/sse";

/**
 * Subscribes to SSE events from the backend and invalidates relevant
 * TanStack Query caches so the UI refreshes automatically.
 */
export function useLeadNotifications() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onSSEMessage((data: unknown) => {
      const event = data as { type?: string; leadId?: string };

      switch (event.type) {
        case "new_lead":
        case "lead_updated":
        case "lead_qualified":
          // Invalidate the leads list
          queryClient.invalidateQueries({ queryKey: ["leads"] });
          queryClient.invalidateQueries({ queryKey: ["stats"] });
          queryClient.invalidateQueries({ queryKey: ["analytics", "overview"] });
          // If it's an update to a specific lead also invalidate that detail
          if (event.leadId) {
            queryClient.invalidateQueries({ queryKey: ["lead", event.leadId] });
            queryClient.invalidateQueries({ queryKey: ["lead-messages", event.leadId] });
          }
          break;
        case "new_message":
          if (event.leadId) {
            queryClient.invalidateQueries({ queryKey: ["lead-messages", event.leadId] });
          }
          break;
        default:
          break;
      }
    });

    return unsubscribe;
  }, [queryClient]);
}
