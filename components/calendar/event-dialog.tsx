"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createEventAction, updateEventAction } from "@/app/actions/events";
import type { CalendarEvent } from "@/types";
import { toDateInputValue, toDateTimeInputValue } from "@/lib/dates";
import { startOfDay, endOfDay } from "date-fns";

interface EventDialogProps {
  open: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  /** Prefill date when creating from a calendar cell. */
  initialDate?: Date | null;
}

export function EventDialog({
  open,
  onClose,
  event,
  initialDate,
}: EventDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const editing = Boolean(event);

  const seed = initialDate ?? new Date();
  const defaultStart = event
    ? toDateTimeInputValue(event.startsAt)
    : toDateTimeInputValue(
        new Date(seed.getFullYear(), seed.getMonth(), seed.getDate(), 9, 0)
      );
  const defaultEnd = event
    ? toDateTimeInputValue(event.endsAt)
    : toDateTimeInputValue(
        new Date(seed.getFullYear(), seed.getMonth(), seed.getDate(), 10, 0)
      );
  const defaultDate = event
    ? toDateInputValue(event.startsAt)
    : toDateInputValue(seed);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const str = (name: string) => {
      const v = String(form.get(name) ?? "").trim();
      return v === "" ? null : v;
    };
    let startsAt: Date;
    let endsAt: Date;
    if (allDay) {
      const day = new Date(String(form.get("date") ?? ""));
      startsAt = startOfDay(day);
      endsAt = endOfDay(day);
    } else {
      startsAt = new Date(String(form.get("startsAt") ?? ""));
      endsAt = new Date(String(form.get("endsAt") ?? ""));
    }
    const raw = {
      title: String(form.get("title") ?? ""),
      description: str("description"),
      location: str("location"),
      startsAt,
      endsAt,
      allDay,
    };
    startTransition(async () => {
      try {
        if (editing && event) {
          await updateEventAction(event.id, raw);
        } else {
          await createEventAction(raw);
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Edit event" : "New event"}
      description={editing ? "Update this event." : "Add an event to your calendar."}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event-title">Title</Label>
          <Input
            id="event-title"
            name="title"
            required
            maxLength={200}
            defaultValue={event?.title ?? ""}
            placeholder="e.g. Dentist appointment"
            autoFocus
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={allDay}
            onChange={setAllDay}
            label="All-day event"
          />
          <Label htmlFor="event-allday">All-day event</Label>
        </div>

        {allDay ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-date">Date</Label>
            <Input
              id="event-date"
              name="date"
              type="date"
              required
              defaultValue={defaultDate}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-start">Starts</Label>
              <Input
                id="event-start"
                name="startsAt"
                type="datetime-local"
                required
                defaultValue={defaultStart}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-end">Ends</Label>
              <Input
                id="event-end"
                name="endsAt"
                type="datetime-local"
                required
                defaultValue={defaultEnd}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event-location">Location</Label>
          <Input
            id="event-location"
            name="location"
            maxLength={200}
            defaultValue={event?.location ?? ""}
            placeholder="Where?"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event-desc">Description</Label>
          <Textarea
            id="event-desc"
            name="description"
            defaultValue={event?.description ?? ""}
            placeholder="Optional notes…"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : editing ? "Save changes" : "Create event"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
