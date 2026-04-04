'use client';

import { usePledges } from '@/hooks/usePledges';
import Card from '@/components/ui/Card';

export default function AdminPledgesPage() {
  const { pledges, totalKids, totalAmount, loading } = usePledges();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">
        Pledges
      </h1>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <p className="text-muted text-sm mb-1">Total Pledges</p>
          <p className="text-3xl font-bold text-accent-light">{pledges.length}</p>
        </Card>
        <Card>
          <p className="text-muted text-sm mb-1">Children Sponsored</p>
          <p className="text-3xl font-bold text-accent-light">{totalKids}</p>
        </Card>
        <Card>
          <p className="text-muted text-sm mb-1">Total Pledged</p>
          <p className="text-3xl font-bold text-accent-light">
            ${totalAmount.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Pledge list */}
      <h2 className="text-lg font-semibold text-foreground mb-3">
        All Pledges
      </h2>

      {pledges.length === 0 ? (
        <p className="text-muted text-sm">No pledges yet.</p>
      ) : (
        <div className="space-y-3">
          {pledges.map((pledge) => (
            <Card key={pledge.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{pledge.name}</p>
                  <p className="text-sm text-muted">{pledge.email}</p>
                  {pledge.phone && (
                    <p className="text-sm text-muted">{pledge.phone}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-accent-light">
                    ${pledge.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted">
                    {pledge.numberOfKids} {pledge.numberOfKids === 1 ? 'child' : 'children'}
                  </p>
                </div>
              </div>
              {pledge.createdAt && (
                <p className="mt-2 text-xs text-muted">
                  {pledge.createdAt.toDate?.().toLocaleString() ?? ''}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
