'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity, Database, Server, Mail, HardDrive, RefreshCw, Loader2,
  CheckCircle2, AlertTriangle, XCircle, Users, FileText, Star,
  BookOpen, Calendar, Award,
} from 'lucide-react';
import { systemApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

type Status = 'ok' | 'degraded' | 'down';

interface Component {
  name: string;
  status: Status;
  detail: string;
  latency_ms?: number;
  [key: string]: unknown;
}

interface Health {
  status: Status;
  checked_at: string;
  components: Component[];
  application: {
    name: string;
    environment: string;
    uptime_seconds: number;
    python: string;
    frontend_url: string;
  };
  content: Record<string, number>;
}

const STATUS_META: Record<Status, { label: string; badge: string; icon: typeof CheckCircle2; dot: string }> = {
  ok: { label: 'Healthy', badge: 'bg-green-100 text-green-700', icon: CheckCircle2, dot: 'bg-green-500' },
  degraded: { label: 'Degraded', badge: 'bg-gold-100 text-gold-700', icon: AlertTriangle, dot: 'bg-gold-500' },
  down: { label: 'Down', badge: 'bg-red-100 text-red-700', icon: XCircle, dot: 'bg-red-500' },
};

const COMPONENT_ICON: Record<string, typeof Database> = {
  Database, Redis: Server, Email: Mail, 'File storage': HardDrive,
};

const CONTENT_ICON: Record<string, typeof Users> = {
  users: Users, papers: FileText, reviews: Star, publications: BookOpen,
  live_publications: BookOpen, conferences: Calendar, certificates: Award,
};

function uptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function AdminSystemPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const { data } = await systemApi.health();
      setHealth(data);
      setError(null);
      setLastChecked(new Date());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Refresh on a gentle interval so the page stays live without hammering.
    const timer = setInterval(() => load(), 30000);
    return () => clearInterval(timer);
  }, [load]);

  const overall = health ? STATUS_META[health.status] : null;

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-2">
            Administration
          </p>
          <h1 className="font-serif text-3xl text-navy-900">System Health</h1>
          <p className="text-navy-500 font-sans mt-2">
            Live status of every component the platform depends on. Each check performs real work.
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="btn-outline disabled:opacity-60"
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </header>

      {loading ? (
        <div className="card p-16 text-center text-navy-400 font-sans text-sm">
          <Loader2 className="w-7 h-7 mx-auto mb-3 animate-spin" />
          Running checks
        </div>
      ) : error ? (
        <div className="card p-10 text-center border-red-200">
          <XCircle className="w-9 h-9 mx-auto mb-3 text-red-500/60" />
          <p className="font-sans text-navy-700 mb-1">Could not reach the API</p>
          <p className="font-sans text-sm text-navy-400">{error}</p>
        </div>
      ) : health && overall ? (
        <>
          {/* Overall banner */}
          <div className={`rounded-2xl p-6 mb-6 border-2 flex items-center gap-4 ${
            health.status === 'ok' ? 'border-green-200 bg-green-50'
            : health.status === 'degraded' ? 'border-gold-200 bg-gold-50'
            : 'border-red-200 bg-red-50'
          }`}>
            <div className="relative">
              <span className={`block w-3.5 h-3.5 rounded-full ${overall.dot}`} />
              {health.status === 'ok' && (
                <span className={`absolute inset-0 rounded-full ${overall.dot} animate-ping opacity-60`} />
              )}
            </div>
            <div className="flex-1">
              <p className="font-serif text-xl text-navy-900">
                {health.status === 'ok' ? 'All systems operational'
                  : health.status === 'degraded' ? 'Running with reduced function'
                  : 'A component is down'}
              </p>
              <p className="font-sans text-sm text-navy-500 mt-0.5">
                {lastChecked && `Checked ${lastChecked.toLocaleTimeString()}`}
                <span className="mx-1.5">·</span>refreshes automatically
              </p>
            </div>
            <span className={`badge ${overall.badge}`}>{overall.label}</span>
          </div>

          {/* Components */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {health.components.map((c) => {
              const meta = STATUS_META[c.status];
              const Icon = COMPONENT_ICON[c.name] || Activity;
              return (
                <div key={c.name} className="card p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      c.status === 'ok' ? 'bg-green-50 text-green-700'
                      : c.status === 'degraded' ? 'bg-gold-50 text-gold-700'
                      : 'bg-red-50 text-red-700'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-serif text-lg text-navy-900">{c.name}</h3>
                        <span className={`badge ${meta.badge} inline-flex items-center gap-1`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </div>
                      <p className="font-sans text-sm text-navy-500 leading-relaxed mt-1">{c.detail}</p>
                      {typeof c.latency_ms === 'number' && (
                        <p className="font-mono text-xs text-navy-400 mt-2">{c.latency_ms}ms</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Content counts */}
          <section className="mb-8">
            <h2 className="font-serif text-xl text-navy-900 mb-4">Content</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(health.content).map(([key, value]) => {
                const Icon = CONTENT_ICON[key] || FileText;
                const label = key.replace(/_/g, ' ');
                return (
                  <div key={key} className="card p-5">
                    <Icon className="w-5 h-5 text-navy-400 mb-3" />
                    <p className="font-display text-3xl text-navy-900 tabular-figures">
                      {value.toLocaleString()}
                    </p>
                    <p className="font-sans text-xs text-navy-500 mt-1 capitalize">{label}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Application */}
          <section>
            <h2 className="font-serif text-xl text-navy-900 mb-4">Application</h2>
            <div className="card p-6">
              <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 font-sans text-sm">
                {[
                  ['Name', health.application.name],
                  ['Environment', health.application.environment],
                  ['Uptime', uptime(health.application.uptime_seconds)],
                  ['Python', health.application.python],
                  ['Frontend URL', health.application.frontend_url],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 py-2 border-b border-parchment-100">
                    <dt className="text-navy-500">{label}</dt>
                    <dd className="text-navy-900 text-right font-medium truncate">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
