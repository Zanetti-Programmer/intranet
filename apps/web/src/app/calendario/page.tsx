"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { DashboardLayout } from "../layout-dashboard";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { DayEventsPanel, EventModal } from "@/components/calendar/EventModal";
import { useEvents, type CalendarEvent } from "@/lib/hooks/useEvents";
import { useSpaces } from "@/lib/hooks/useSpaces";
import { toast } from "sonner";

export default function CalendarioPage() {
  const pathname = usePathname();
  const { events, loading, createEvent, updateEvent, deleteEvent } = useEvents();
  const { spaces } = useSpaces();

  const [dayModal,    setDayModal]    = useState<{ date: Date; events: CalendarEvent[] } | null>(null);
  const [createDate,  setCreateDate]  = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  function openEdit(ev: CalendarEvent) {
    setDayModal(null);
    setEditingEvent(ev);
  }

  return (
    <DashboardLayout pathname={pathname} fullHeight>
      <div className="h-full p-5 flex flex-col">
        <CalendarGrid
          events={events}
          onDayClick={(date, evs) => setDayModal({ date, events: evs })}
          onCreateClick={(date) => setCreateDate(date)}
        />
      </div>

      <AnimatePresence>
        {dayModal && (
          <DayEventsPanel
            events={dayModal.events}
            date={dayModal.date}
            spaces={spaces}
            onDelete={async (id) => {
              await deleteEvent(id);
              setDayModal(null);
              toast.success("Evento removido.");
            }}
            onEdit={openEdit}
            onClose={() => setDayModal(null)}
            onNew={() => { setCreateDate(dayModal.date); setDayModal(null); }}
          />
        )}

        {createDate && (
          <EventModal
            initialDate={createDate}
            spaces={spaces}
            onSave={async (data) => { await createEvent(data); toast.success("Evento criado!"); }}
            onClose={() => setCreateDate(null)}
          />
        )}

        {editingEvent && (
          <EventModal
            initial={editingEvent}
            spaces={spaces}
            onSave={async (data) => {
              await updateEvent(editingEvent.id, data);
              toast.success("Evento atualizado!");
            }}
            onClose={() => setEditingEvent(null)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
