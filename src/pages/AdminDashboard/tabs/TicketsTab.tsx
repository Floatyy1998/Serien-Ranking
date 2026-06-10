import { AdminTicketCard } from './tickets/AdminTicketCard';
import { TicketsTabHeader } from './tickets/TicketsTabHeader';
import type { TicketTheme } from './tickets/ticketStyles';
import { useTicketsData } from './tickets/useTicketsData';

interface TicketsTabProps {
  theme: TicketTheme;
}

export function TicketsTab({ theme }: TicketsTabProps) {
  const {
    tickets,
    loading,
    filtered,
    counts,
    expandedId,
    setExpandedId,
    expandedRef,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    searchQuery,
    setSearchQuery,
    updateTicket,
    addAdminComment,
    addAdminNote,
    deleteTicket,
  } = useTicketsData();

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: theme.text.muted }}>Laden...</div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <TicketsTabHeader
        theme={theme}
        totalCount={tickets.length}
        counts={counts}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div style={{ fontSize: '14px', color: theme.text.muted }}>
        {filtered.length} von {tickets.length} Tickets
        {searchQuery && ` für "${searchQuery}"`}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: theme.text.muted, fontSize: 16 }}>
          Keine Tickets gefunden.
        </div>
      )}

      {filtered.map((ticket) => (
        <div key={ticket.id} ref={expandedId === ticket.id ? expandedRef : undefined}>
          <AdminTicketCard
            ticket={ticket}
            theme={theme}
            expanded={expandedId === ticket.id}
            onToggle={() => setExpandedId((p) => (p === ticket.id ? null : ticket.id))}
            onUpdateStatus={(s) => updateTicket(ticket.id, { status: s })}
            onUpdatePriority={(p) => updateTicket(ticket.id, { priority: p })}
            onAddAdminNote={(t) => addAdminNote(ticket.id, t)}
            onAddComment={(t) => addAdminComment(ticket.id, t)}
            onDelete={() => deleteTicket(ticket.id)}
          />
        </div>
      ))}
    </div>
  );
}
