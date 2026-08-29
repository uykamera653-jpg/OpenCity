import { useState } from 'react';
import {
  Globe, Phone, Mail, ExternalLink, ChevronDown, ChevronUp, Building2
} from 'lucide-react';
import { BusinessSponsor } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import SponsorModal from './SponsorModal';

interface Props {
  reportId: string;
  reportTitle: string;
  sponsors: BusinessSponsor[];
  isCompleted?: boolean;
}

const TYPE_CONFIG: Record<BusinessSponsor['sponsorType'], { label: string; color: string; bg: string; icon: string }> = {
  full: { label: "To'liq zimmasiga oldi", color: '#2563EB', bg: '#EFF6FF', icon: '🏆' },
  partial: { label: 'Qisman yordam', color: '#7C3AED', bg: '#EDE9FE', icon: '🤝' },
  material: { label: 'Material yordam', color: '#D97706', bg: '#FEF3C7', icon: '📦' },
};

const SPONSOR_STATUS_CONFIG: Record<BusinessSponsor['status'], { label: string; color: string; bg: string }> = {
  pledged: { label: 'Zimmasiga oldi', color: '#D97706', bg: '#FEF3C7' },
  in_progress: { label: 'Bajarmoqda', color: '#2563EB', bg: '#EFF6FF' },
  completed: { label: 'Bajarildi', color: '#16A34A', bg: '#F0FDF4' },
  cancelled: { label: 'Bekor qildi', color: '#6B7280', bg: '#F3F4F6' },
};

export default function SponsorSection({ reportId, reportTitle, sponsors, isCompleted = false }: Props) {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const activeSponsors = sponsors.filter(s => s.status !== 'cancelled');

  // ── Empty state ──
  if (activeSponsors.length === 0) {
    if (isCompleted) return null;
    return (
      <>
        <div className="border-2 border-dashed border-blue-200 rounded-2xl p-5 bg-blue-50/40 hover:bg-blue-50/70 transition-colors">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm border border-blue-100">
              🤝
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1 text-sm">Muammoni zimmangizga oling</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                Tadbirkor yoki firma egasi bo'lsangiz — bu muammoni hal qilishni o'z zimmangizga olishingiz mumkin.
                Brendingiz muammo sahifasida va xaritada ko'rsatiladi. Reklamaga ketadigan pulni yaxshi ishga sarflang!
              </p>
              <button
                onClick={() => isAuthenticated ? setShowModal(true) : openAuthModal('login')}
                className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white text-sm font-semibold rounded-xl hover:bg-[#1D4ED8] transition-colors shadow-sm"
              >
                🤝 Zimmaga olish
              </button>
            </div>
          </div>
        </div>
        {showModal && (
          <SponsorModal reportId={reportId} reportTitle={reportTitle} onClose={() => setShowModal(false)} />
        )}
      </>
    );
  }

  // ── With sponsors ──
  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-glass overflow-hidden">

        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🤝</div>
            <div className="text-left">
              <h3 className="font-bold text-gray-900 text-sm">Qo'llab-quvvatlovchilar</h3>
              <p className="text-xs font-semibold" style={{ color: '#2563EB' }}>
                {activeSponsors.length} ta tadbirkor muammoni zimmasiga oldi
              </p>
            </div>
          </div>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />
          }
        </button>

        {expanded && (
          <div className="border-t border-gray-100">
            {/* Sponsor list */}
            <div className="divide-y divide-gray-50">
              {activeSponsors.map(sponsor => {
                const typeConf = TYPE_CONFIG[sponsor.sponsorType];
                const statusConf = SPONSOR_STATUS_CONFIG[sponsor.status];
                return (
                  <div key={sponsor.id} className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      {/* Logo/icon */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border"
                        style={{ backgroundColor: typeConf.bg, borderColor: typeConf.color + '30' }}
                      >
                        {typeConf.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Name + status */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <p className="font-bold text-gray-900 text-sm leading-snug">{sponsor.businessName}</p>
                            {sponsor.businessDescription && (
                              <p className="text-xs text-gray-500 mt-0.5">{sponsor.businessDescription}</p>
                            )}
                          </div>
                          <span
                            className="text-[10px] px-2 py-1 rounded-full font-bold flex-shrink-0 whitespace-nowrap"
                            style={{ backgroundColor: statusConf.bg, color: statusConf.color }}
                          >
                            {statusConf.label}
                          </span>
                        </div>

                        {/* Type chip */}
                        <div className="mb-2.5">
                          <span
                            className="inline-block text-xs px-2.5 py-1 rounded-full font-semibold"
                            style={{ backgroundColor: typeConf.bg, color: typeConf.color }}
                          >
                            {typeConf.label}
                          </span>
                        </div>

                        {/* Pledge message */}
                        <div
                          className="p-3 rounded-xl text-sm text-gray-700 leading-relaxed mb-3 border-l-2"
                          style={{ backgroundColor: typeConf.bg + '80', borderLeftColor: typeConf.color }}
                        >
                          "{sponsor.pledgeMessage}"
                        </div>

                        {/* Contact + date */}
                        <div className="flex flex-wrap items-center gap-3">
                          {sponsor.website && (
                            <a
                              href={sponsor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1 text-xs text-[#2563EB] hover:underline"
                            >
                              <Globe className="w-3 h-3" />
                              {sponsor.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {sponsor.contactPhone && (
                            <a
                              href={`tel:${sponsor.contactPhone}`}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                            >
                              <Phone className="w-3 h-3" /> {sponsor.contactPhone}
                            </a>
                          )}
                          {sponsor.contactEmail && (
                            <a
                              href={`mailto:${sponsor.contactEmail}`}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                            >
                              <Mail className="w-3 h-3" /> {sponsor.contactEmail}
                            </a>
                          )}
                          <span className="text-xs text-gray-400 ml-auto">{formatDate(sponsor.pledgedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add more CTA */}
            {!isCompleted && (
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => isAuthenticated ? setShowModal(true) : openAuthModal('login')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-sm font-semibold text-gray-600 hover:border-[#2563EB] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-all"
                >
                  <Building2 className="w-4 h-4" />
                  Siz ham zimmaga olishingiz mumkin
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <SponsorModal reportId={reportId} reportTitle={reportTitle} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
