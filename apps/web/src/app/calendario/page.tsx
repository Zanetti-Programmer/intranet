"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { DayEventsPanel, CreateEventModal } from "@/components/calendar/EventModal";
import { useEvents, type CalendarEvent } from "@/lib/hooks/useEvents";
import { useSpaces } from "@/lib/hooks/useSpaces";

export default function CalendarioPage() {
  const pathname = usePathname();
  const { events, loading, createEvent, deleteEvent } = useEvents();
  const { spaces } = useSpaces();
  const [dayModal, setDayModal] = useState<{ date: Date; events: CalendarEvent[] } | null>(null);
  const [createModal, setCreateModal] = useState<Date | null>(null);

  return (
    <DashboardLayout pathname={pathname} fullHeight>
      <div className="h-full p-5 flex flex-col">
        <CalendarGrid
          events={events}
          onDayClick={(date, evs) => setDayModal({ date, events: evs })}
          onCreateClick={(date) => setCreateModal(date)}
        />
      </div>

      <AnimatePresence>
        {dayModal && (
          <DayEventsPanel
            events={dayModal.events}
            date={dayModal.date}
            spaces={spaces}
            onDelete={async (id) => { await deleteEvent(id); setDayModal(null); }}
            onClose={() => setDayModal(null)}
            onNew={() => { setCreateModal(dayModal.date); setDayModal(null); }}
          />
        )}
        {createModal && (
          <CreateEventModal
            initialDate={createModal}
            spaces={spaces}
            onCreate={async (data) => { await createEvent(data); setCreateModal(null); }}
            onClose={() => setCreateModal(null)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
