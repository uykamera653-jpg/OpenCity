import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Report, Organization, Notification, RoutingRule, ReportStatus, Comment, CitizenResolution, MapAnnouncement, BusinessSponsor } from '@/types';
import { DEFAULT_ROUTING_RULES } from '@/constants/categories';
import { supabase } from '@/lib/supabase';

interface AppStore {
  currentUser: User | null; isAuthModalOpen: boolean; authModalTab: 'login'|'register';
  reports: Report[]; organizations: Organization[]; users: User[]; notifications: Notification[];
  routingRules: RoutingRule[]; sidebarOpen: boolean; announcements: MapAnnouncement[];
  login: (user: User) => void; logout: () => void; openAuthModal: (tab?: 'login'|'register') => void; closeAuthModal: () => void; setSidebarOpen: (open: boolean) => void;
  addReport: (report: Report) => Promise<Report | null>; voteReport: (reportId: string) => Promise<void>;
  updateReportStatus: (reportId: string, status: ReportStatus, note: string) => Promise<void>;
  addComment: (reportId: string, comment: Comment) => Promise<void>; likeComment: (reportId: string, commentId: string) => Promise<void>;
  submitCitizenResolution: (reportId: string, data: {solverId:string;solverName:string;solverAvatar?:string;description:string;photos:string[]}) => Promise<void>;
  voteOnCitizenResolution: (reportId:string,resolutionId:string,vote:'confirm'|'deny') => Promise<void>;
  adminReviewCitizenResolution: (reportId:string,resolutionId:string,decision:'approve'|'reject') => Promise<void>;
  markNotificationRead: (id:string)=>Promise<void>; markAllNotificationsRead:()=>Promise<void>; addNotification:(n:Notification)=>Promise<void>;
  updateRoutingRule:(categoryId:string,organizationId:string,orgName:string)=>Promise<void>; blockUser:(userId:string)=>Promise<void>; unblockUser:(userId:string)=>Promise<void>;
  addAnnouncement:(a:MapAnnouncement)=>Promise<void>; updateAnnouncement:(id:string,data:Partial<MapAnnouncement>)=>Promise<void>; deleteAnnouncement:(id:string)=>Promise<void>;
  addSponsor:(reportId:string,sponsor:BusinessSponsor)=>Promise<void>; updateSponsorStatus:(reportId:string,sponsorId:string,status:BusinessSponsor['status'])=>Promise<void>;
  refresh:()=>Promise<void>;
}

const empty = (v:any) => v ?? '';
const toUser = (p:any):User => ({ id:p.id,name:p.name||'Foydalanuvchi',email:p.email||'',avatar:p.avatar||undefined,role:p.role||'citizen',phone:p.phone||undefined,district:p.district||undefined,createdAt:p.created_at||new Date().toISOString(),reportsCount:0,votesCount:0,isVerified:!!p.is_verified,isBlocked:!!p.is_blocked,bio:p.bio||undefined });
const toComment = (c:any, likes=0, isLiked=false):Comment => ({ id:c.id,reportId:c.report_id,authorId:c.author_id||'',authorName:c.author_name||'Foydalanuvchi',authorAvatar:c.author_avatar||undefined,authorRole:c.author_role||'citizen',text:c.text,images:c.images||[],likes,parentId:c.parent_id||undefined,replies:[],createdAt:c.created_at,isLiked });

async function loadAll(currentUser: User|null) {
  if (!supabase) return {reports:[],organizations:[],users:[],notifications:[],announcements:[],routingRules:[]};
  const [{data:rs},{data:os},{data:ns},{data:as},{data:cs}] = await Promise.all([
    supabase.from('reports').select('*').order('created_at',{ascending:false}),
    supabase.from('organizations').select('*').order('name'),
    currentUser ? supabase.from('notifications').select('*').eq('user_id',currentUser.id).order('created_at',{ascending:false}) : Promise.resolve({data:[] as any[]}),
    supabase.from('announcements').select('*').order('created_at',{ascending:false}),
    supabase.from('categories').select('*').order('name'),
  ]);
  const reportRows = rs || [];
  const ids = reportRows.map((r:any)=>r.id);
  const [commentsRes,timelineRes,votesRes,resRes,sponsorsRes] = await Promise.all([
    ids.length ? supabase.from('comments').select('*').in('report_id',ids).order('created_at') : Promise.resolve({data:[] as any[]}),
    ids.length ? supabase.from('report_timeline').select('*').in('report_id',ids).order('created_at') : Promise.resolve({data:[] as any[]}),
    ids.length ? supabase.from('report_votes').select('report_id,user_id').in('report_id',ids) : Promise.resolve({data:[] as any[]}),
    ids.length ? supabase.from('citizen_resolutions').select('*').in('report_id',ids).order('created_at') : Promise.resolve({data:[] as any[]}),
    ids.length ? supabase.from('business_sponsors').select('*').in('report_id',ids).order('pledged_at') : Promise.resolve({data:[] as any[]}),
  ]);
  const comments=commentsRes.data||[], timeline=timelineRes.data||[], votes=votesRes.data||[], resolutions=resRes.data||[], sponsors=sponsorsRes.data||[];
  const reports:Report[] = reportRows.map((r:any)=>{
    const rc=comments.filter(c=>c.report_id===r.id); const tv=votes.filter(v=>v.report_id===r.id);
    const tls=timeline.filter(t=>t.report_id===r.id); const rr=resolutions.filter(x=>x.report_id===r.id); const ss=sponsors.filter(x=>x.report_id===r.id);
    return {id:r.id,title:r.title,description:r.description,categoryId:r.category_id,status:r.status,location:{lat:r.lat,lng:r.lng,address:r.address,district:r.district||undefined},photos:r.photos||[],videos:r.videos||[],authorId:r.author_id||'',authorName:r.anonymous?'Anonim':(r.author_name||'Foydalanuvchi'),authorAvatar:r.author_avatar||undefined,anonymous:!!r.anonymous,organizationId:r.organization_id||'',votes:tv.length,isVoted:!!currentUser&&tv.some(v=>v.user_id===currentUser.id),comments:rc.map(c=>toComment(c,0,false)),createdAt:r.created_at,updatedAt:r.updated_at,timeline:tls.map(t=>({id:t.id,status:t.status,note:t.note,authorId:t.author_id||'',authorName:t.author_name||'Foydalanuvchi',authorRole:t.author_role||'citizen',createdAt:t.created_at})),completionPhotos:r.completion_photos||[],completionDescription:r.completion_description||undefined,completionDate:r.completion_date||undefined,solvedBy:r.solved_by||undefined,priority:r.priority,viewCount:r.view_count||0,citizenResolutions:rr.map(x=>({id:x.id,reportId:x.report_id,solverId:x.solver_id||'',solverName:x.solver_name||'Fuqaro',solverAvatar:x.solver_avatar||undefined,description:x.description,photos:x.photos||[],status:x.status,confirmedBy:[],deniedBy:[],createdAt:x.created_at})),sponsors:ss.map(s=>({id:s.id,reportId:s.report_id,businessName:s.business_name,businessDescription:s.business_description,website:s.website,contactEmail:s.contact_email,contactPhone:s.contact_phone,pledgeMessage:s.pledge_message,sponsorType:s.sponsor_type,status:s.status,pledgedAt:s.pledged_at,completedAt:s.completed_at,userId:s.user_id||undefined}))};
  });
  const organizations=(os||[]).map((o:any)=>({id:o.id,name:o.name,logo:o.logo||undefined,description:o.description||'',categoryIds:(cs||[]).filter((c:any)=>c.organization_id===o.id).map((c:any)=>c.id),phone:o.phone||'',email:o.email||'',website:o.website||undefined,verified:!!o.verified,completedReports:reports.filter(r=>r.organizationId===o.id&&r.status==='completed').length,activeReports:reports.filter(r=>r.organizationId===o.id&&r.status!=='completed'&&r.status!=='rejected').length,avgResponseTime:'',rating:0,district:o.district||undefined,joinedAt:o.joined_at,totalReports:reports.filter(r=>r.organizationId===o.id).length}));
  const routingRules=(cs||[]).filter((c:any)=>c.organization_id).map((c:any)=>({categoryId:c.id,organizationId:c.organization_id,organizationName:(os||[]).find((o:any)=>o.id===c.organization_id)?.name||'Shahar Ma\'muriyati'}));
  return {reports,organizations,users:[],notifications:(ns||[]).map((n:any)=>({id:n.id,userId:n.user_id,type:n.type,title:n.title,message:n.message,reportId:n.report_id||undefined,read:!!n.read,createdAt:n.created_at})),announcements:(as||[]).map((a:any)=>({id:a.id,organizationId:a.organization_id||'',organizationName:(os||[]).find((o:any)=>o.id===a.organization_id)?.name||'',type:a.type,title:a.title,description:a.description||'',route:a.route||[],alternativeRoute:a.alternative_route||undefined,alternativeDescription:a.alternative_description||undefined,startDate:a.start_date,endDate:a.end_date||undefined,status:a.status,createdAt:a.created_at})),routingRules:routingRules.length?routingRules:DEFAULT_ROUTING_RULES};
}

export const useAppStore=create<AppStore>()(persist((set,get)=>({
  currentUser:null,isAuthModalOpen:false,authModalTab:'login',reports:[],organizations:[],users:[],notifications:[],routingRules:DEFAULT_ROUTING_RULES,sidebarOpen:true,announcements:[],
  login:(user)=>{set({currentUser:user,isAuthModalOpen:false}); void get().refresh();}, logout:()=>set({currentUser:null,reports:[],notifications:[],users:[]}),openAuthModal:(tab='login')=>set({isAuthModalOpen:true,authModalTab:tab}),closeAuthModal:()=>set({isAuthModalOpen:false}),setSidebarOpen:(open)=>set({sidebarOpen:open}),
  refresh:async()=>{const d=await loadAll(get().currentUser);set(d as any);},
  addReport:async(report)=>{if(!supabase||!get().currentUser)throw new Error('Kirish talab qilinadi');const {data,error}=await supabase.from('reports').insert({title:report.title,description:report.description,category_id:report.categoryId,status:'new',lat:report.location.lat,lng:report.location.lng,address:report.location.address,district:report.location.district,photos:report.photos,videos:report.videos||[],author_id:get().currentUser!.id,anonymous:report.anonymous,organization_id:report.organizationId||null,priority:report.priority}).select('*').single();if(error)throw error;await supabase.from('report_timeline').insert({report_id:data.id,status:'new',note:'Muammo bildirildi, tizimga qo\'shildi',author_id:get().currentUser!.id});await get().refresh();return get().reports.find(r=>r.id===data.id)||null;},
  voteReport:async(id)=>{if(!supabase||!get().currentUser)throw new Error('Kirish talab qilinadi');const uid=get().currentUser.id;const {data}=await supabase.from('report_votes').select('report_id').eq('report_id',id).eq('user_id',uid).maybeSingle();const q=data?supabase.from('report_votes').delete().eq('report_id',id).eq('user_id',uid):supabase.from('report_votes').insert({report_id:id,user_id:uid});const {error}=await q;if(error)throw error;await get().refresh();},
  updateReportStatus:async(id,status,note)=>{if(!supabase||!get().currentUser)throw new Error('Kirish talab qilinadi');const uid=get().currentUser.id;const {error}=await supabase.from('reports').update({status,updated_at:new Date().toISOString()}).eq('id',id);if(error)throw error;await supabase.from('report_timeline').insert({report_id:id,status,note,author_id:uid});await get().refresh();},
  addComment:async(id,c)=>{if(!supabase||!get().currentUser)throw new Error('Kirish talab qilinadi');const {error}=await supabase.from('comments').insert({report_id:id,author_id:get().currentUser.id,text:c.text,images:c.images||[],parent_id:c.parentId||null});if(error)throw error;await get().refresh();},
  likeComment:async(_reportId,commentId)=>{if(!supabase||!get().currentUser)throw new Error('Kirish talab qilinadi');const uid=get().currentUser.id;const {data}=await supabase.from('comment_likes').select('comment_id').eq('comment_id',commentId).eq('user_id',uid).maybeSingle();const q=data?supabase.from('comment_likes').delete().eq('comment_id',commentId).eq('user_id',uid):supabase.from('comment_likes').insert({comment_id:commentId,user_id:uid});const {error}=await q;if(error)throw error;await get().refresh();},
  submitCitizenResolution:async(id,d)=>{if(!supabase)throw new Error('Supabase sozlanmagan');const {error}=await supabase.from('citizen_resolutions').insert({report_id:id,solver_id:d.solverId,description:d.description,photos:d.photos});if(error)throw error;await get().refresh();},
  voteOnCitizenResolution:async(id,rid,vote)=>{if(!supabase||!get().currentUser)throw new Error('Kirish talab qilinadi');const uid=get().currentUser.id;const {error}=await supabase.from('resolution_votes').upsert({resolution_id:rid,user_id:uid,vote},{onConflict:'resolution_id,user_id'});if(error)throw error;await get().refresh();},
  adminReviewCitizenResolution:async(_id,rid,decision)=>{if(!supabase)throw new Error('Supabase sozlanmagan');const {error}=await supabase.from('citizen_resolutions').update({status:decision==='approve'?'approved':'rejected'}).eq('id',rid);if(error)throw error;await get().refresh();},
  markNotificationRead:async(id)=>{if(!supabase) return;await supabase.from('notifications').update({read:true}).eq('id',id).eq('user_id',get().currentUser?.id||'');await get().refresh();},
  markAllNotificationsRead:async()=>{if(!supabase||!get().currentUser)return;await supabase.from('notifications').update({read:true}).eq('user_id',get().currentUser.id);await get().refresh();},
  addNotification:async(n)=>{if(!supabase)throw new Error('Supabase sozlanmagan');const {error}=await supabase.from('notifications').insert({user_id:n.userId,type:n.type,title:n.title,message:n.message,report_id:n.reportId||null,read:n.read});if(error)throw error;await get().refresh();},
  updateRoutingRule:async(categoryId,organizationId)=>{if(!supabase||!get().currentUser)throw new Error('Kirish talab qilinadi');const {error}=await supabase.from('categories').update({organization_id:organizationId}).eq('id',categoryId);if(error)throw error;await get().refresh();},
  blockUser:async(id)=>{if(!supabase)throw new Error('Supabase sozlanmagan');const {error}=await supabase.from('profiles').update({is_blocked:true}).eq('id',id);if(error)throw error;await get().refresh();},
  unblockUser:async(id)=>{if(!supabase)throw new Error('Supabase sozlanmagan');const {error}=await supabase.from('profiles').update({is_blocked:false}).eq('id',id);if(error)throw error;await get().refresh();},
  addAnnouncement:async(a)=>{if(!supabase)throw new Error('Supabase sozlanmagan');const {error}=await supabase.from('announcements').insert({organization_id:a.organizationId||null,type:a.type,title:a.title,description:a.description,route:a.route,alternative_route:a.alternativeRoute||null,alternative_description:a.alternativeDescription||null,start_date:a.startDate,end_date:a.endDate||null,status:a.status});if(error)throw error;await get().refresh();},
  updateAnnouncement:async(id,data)=>{if(!supabase)throw new Error('Supabase sozlanmagan');const map:any={organizationId:'organization_id',organizationName:'',alternativeRoute:'alternative_route',alternativeDescription:'alternative_description',startDate:'start_date',endDate:'end_date'};const payload:any={};Object.entries(data).forEach(([k,v])=>{if(map[k]!==''&&map[k])payload[map[k]]=v;else if(!['id','organizationName'].includes(k))payload[k]=v;});const {error}=await supabase.from('announcements').update(payload).eq('id',id);if(error)throw error;await get().refresh();},
  deleteAnnouncement:async(id)=>{if(!supabase)throw new Error('Supabase sozlanmagan');const {error}=await supabase.from('announcements').delete().eq('id',id);if(error)throw error;await get().refresh();},
  addSponsor:async(id,s)=>{if(!supabase||!get().currentUser)throw new Error('Kirish talab qilinadi');const {error}=await supabase.from('business_sponsors').insert({report_id:id,user_id:get().currentUser.id,business_name:s.businessName,business_description:s.businessDescription,website:s.website,contact_email:s.contactEmail,contact_phone:s.contactPhone,pledge_message:s.pledgeMessage,sponsor_type:s.sponsorType,status:s.status});if(error)throw error;await get().refresh();},
  updateSponsorStatus:async(_id,sid,status)=>{if(!supabase)throw new Error('Supabase sozlanmagan');const {error}=await supabase.from('business_sponsors').update({status,completed_at:status==='completed'?new Date().toISOString():null}).eq('id',sid);if(error)throw error;await get().refresh();},
}),{name:'opencity-ui',partialize:(s)=>({currentUser:s.currentUser,sidebarOpen:s.sidebarOpen})}));
