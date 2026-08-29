import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAppStore } from '@/stores/appStore';
import type { Comment, Organization, Report, User } from '@/types';

const toUser = (row: any): User => ({
  id: row.id,
  name: row.name || row.email?.split('@')[0] || 'Foydalanuvchi',
  email: row.email || '',
  avatar: row.avatar || undefined,
  role: row.role || 'citizen',
  phone: row.phone || undefined,
  district: row.district || undefined,
  createdAt: row.created_at || new Date().toISOString(),
  reportsCount: 0,
  votesCount: 0,
  isVerified: !!row.is_verified,
  isBlocked: !!row.is_blocked,
  bio: row.bio || undefined,
});

async function hydrate() {
  if (!supabase) return;

  const [profilesResult, orgsResult, reportsResult] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('organizations').select('*'),
    supabase.from('reports').select('*').order('created_at', { ascending: false }),
  ]);

  if (profilesResult.error || orgsResult.error || reportsResult.error) {
    console.warn('OpenCity Supabase hydration skipped:', profilesResult.error || orgsResult.error || reportsResult.error);
    return;
  }

  const profiles = profilesResult.data || [];
  const organizations = orgsResult.data || [];
  const reportRows = reportsResult.data || [];
  const profileMap = new Map(profiles.map(p => [p.id, toUser(p)]));

  const { data: votes } = await supabase.from('report_votes').select('report_id,user_id');
  const { data: comments } = await supabase.from('comments').select('*').order('created_at', { ascending: true });
  const { data: timelines } = await supabase.from('report_timeline').select('*').order('created_at', { ascending: true });

  const currentUser = useAppStore.getState().currentUser;
  const voteRows = votes || [];
  const commentRows = comments || [];
  const timelineRows = timelines || [];

  const mappedReports: Report[] = reportRows.map((r: any) => {
    const author = profileMap.get(r.author_id);
    const org = organizations.find((o: any) => o.id === r.organization_id);
    const reportComments: Comment[] = commentRows.filter((c: any) => c.report_id === r.id).map((c: any) => {
      const cAuthor = profileMap.get(c.author_id);
      return {
        id: c.id,
        reportId: c.report_id,
        authorId: c.author_id || '',
        authorName: cAuthor?.name || 'Foydalanuvchi',
        authorAvatar: cAuthor?.avatar,
        authorRole: cAuthor?.role || 'citizen',
        text: c.text,
        images: c.images || [],
        likes: 0,
        parentId: c.parent_id || undefined,
        createdAt: c.created_at,
        isLiked: false,
      };
    });

    return {
      id: r.id,
      title: r.title,
      description: r.description,
      categoryId: r.category_id,
      status: r.status,
      location: { lat: r.lat, lng: r.lng, address: r.address || '', district: r.district || undefined },
      photos: r.photos || [],
      videos: r.videos || [],
      authorId: r.author_id || '',
      authorName: author?.name || (r.anonymous ? 'Anonim fuqaro' : 'Foydalanuvchi'),
      authorAvatar: author?.avatar,
      anonymous: !!r.anonymous,
      organizationId: r.organization_id || '',
      votes: voteRows.filter((v: any) => v.report_id === r.id).length,
      isVoted: !!currentUser && voteRows.some((v: any) => v.report_id === r.id && v.user_id === currentUser.id),
      comments: reportComments,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      timeline: timelineRows.filter((t: any) => t.report_id === r.id).map((t: any) => ({
        id: t.id, status: t.status, note: t.note || '', authorId: t.author_id || '',
        authorName: profileMap.get(t.author_id)?.name || 'Tizim',
        authorRole: profileMap.get(t.author_id)?.role || 'admin', createdAt: t.created_at,
        organizationName: org?.name,
      })),
      completionPhotos: r.completion_photos || [],
      completionDescription: r.completion_description || undefined,
      completionDate: r.completion_date || undefined,
      solvedBy: r.solved_by || undefined,
      priority: r.priority || 'medium',
      viewCount: r.view_count || 0,
    };
  });

  const mappedOrgs: Organization[] = organizations.map((o: any) => ({
    id: o.id, name: o.name, logo: o.logo || undefined, description: o.description || '',
    categoryIds: [], phone: o.phone || '', email: o.email || '', website: o.website || undefined,
    verified: !!o.verified, completedReports: 0, activeReports: 0, avgResponseTime: '—', rating: 0,
    district: o.district || undefined, joinedAt: o.joined_at, totalReports: 0,
  }));

  useAppStore.setState({ reports: mappedReports, users: profiles.map(toUser), organizations: mappedOrgs });
}

export default function SupabaseBootstrap() {
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    hydrate();

    const reload = () => { void hydrate(); };
    const channel = supabase
      .channel('opencity-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'report_votes' }, reload)
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, []);

  return null;
}
