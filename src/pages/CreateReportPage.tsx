import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ArrowLeft, Check, Crosshair, Sparkles, Loader2 } from 'lucide-react';
import { useAppStore } from '@/stores/appStore'; import { useAuth } from '@/hooks/useAuth'; import { CATEGORIES } from '@/constants/categories'; import { CategoryId, Priority, Report } from '@/types'; import { cn } from '@/lib/utils'; import { supabase } from '@/lib/supabase'; import MapView from '@/components/features/map/MapView'; import { analyzeReportWithAI } from '@/lib/ai';
const STEPS=["Kategoriya","Joylashuv","Ma'lumot","Tasdiqlash"];
async function reverseGeocode(lat:number,lng:number){try{const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,{headers:{Accept:'application/json'}});if(!r.ok)return null;const d=await r.json(),a=d.address||{};const district=String(a.county||a.municipality||a.city_district||a.suburb||a.town||a.village||a.city||'');return {address:d.display_name||'',district};}catch{return null;}}
export default function CreateReportPage(){const{currentUser,openAuthModal}=useAuth();const{addReport,routingRules,organizations}=useAppStore();const navigate=useNavigate();const[step,setStep]=useState(0);const[category,setCategory]=useState<CategoryId|null>(null);const[location,setLocation]=useState({lat:41.2995,lng:69.2401,address:'',district:''});const[title,setTitle]=useState('');const[description,setDescription]=useState('');const[priority,setPriority]=useState<Priority>('medium');const[anonymous,setAnonymous]=useState(false);const[photos,setPhotos]=useState<string[]>([]);const[busy,setBusy]=useState(false);const[gpsBusy,setGpsBusy]=useState(false);const[aiBusy,setAiBusy]=useState(false);const[ai,setAi]=useState<any>(null);const[submitted,setSubmitted]=useState(false);const[createdId,setCreatedId]=useState('');
if(!currentUser)return <div className="min-h-screen pt-24 flex items-center justify-center bg-gray-50"><div className="text-center bg-white rounded-2xl shadow-glass p-10 max-w-sm w-full mx-4"><div className="text-5xl mb-4">🔒</div><h2 className="text-xl font-bold mb-2">Kirish talab qilinadi</h2><p className="text-sm text-gray-500 mb-6">Muammo bildirish uchun tizimga kiring</p><button onClick={()=>openAuthModal('login')} className="city-btn-primary w-full justify-center">Kirish</button></div></div>;
const uploadPhotos=async(files:FileList|null)=>{if(!files)return;const urls:string[]=[];for(const f of Array.from(files).slice(0,10)){if(!f.type.startsWith('image/'))continue;const path=`${currentUser.id}/${crypto.randomUUID()}.${f.name.split('.').pop()||'jpg'}`;const{error}=await supabase.storage.from('opencity-media').upload(path,f,{contentType:f.type,upsert:false});if(error)throw error;urls.push(supabase.storage.from('opencity-media').getPublicUrl(path).data.publicUrl);}setPhotos(p=>[...p,...urls]);};
const setCoords=async(lat:number,lng:number)=>{setLocation(l=>({...l,lat,lng}));const p=await reverseGeocode(lat,lng);if(p)setLocation(l=>({...l,address:p.address||l.address,district:p.district||l.district}));};
const gps=()=>{
  if(!navigator.geolocation){
    alert("Brauzer joylashuvni qo'llab-quvvatlamaydi. Boshqa brauzer sinab ko'ring.");
    return;
  }
  setGpsBusy(true);
  navigator.geolocation.getCurrentPosition(
    pos=>{
      void setCoords(pos.coords.latitude,pos.coords.longitude).finally(()=>setGpsBusy(false));
    },
    err=>{
      setGpsBusy(false);
      if(err.code===1){
        alert("Joylashuv ruxsatini bering:\n• Brauzer manzil satrida qulf belgisini bosing\n• Sozlamalar → Sayt → Joylashuv → Ruxsat bering");
      } else if(err.code===2){
        alert("GPS signali topilmadi. Ochiq joyga chiqib yoki Wi-Fi yoqib qayta urining.");
      } else {
        alert("Joylashuvni aniqlab bo'lmadi. Qayta urining.");
      }
    },
    {enableHighAccuracy:true,timeout:15000,maximumAge:10000}
  );
};
const runAI=async()=>{if(description.length<10){alert('Avval muammo haqida yozing');return;}setAiBusy(true);try{const s=await analyzeReportWithAI({title,description,categoryId:category||undefined,latitude:location.lat,longitude:location.lng,imageUrls:photos});if(s){setAi(s);if(s.title)setTitle(s.title);if(s.description)setDescription(s.description);if(s.priority)setPriority(s.priority as Priority);if(s.categoryId)setCategory(s.categoryId as CategoryId);}}catch(e:any){alert(e?.message||'AI ishlamadi')}finally{setAiBusy(false)}};
const submit=async()=>{if(!category||title.length<10||description.length<20)return;setBusy(true);try{const sameDistrict=organizations.find(o=>o.district&&location.district&&o.district.toLowerCase()===location.district.toLowerCase()&&o.categoryIds?.includes(category));const fallback=organizations.find(o=>o.categoryIds?.includes(category));const orgId=sameDistrict?.id||fallback?.id||routingRules.find(r=>r.categoryId===category)?.organizationId||'';const draft:Report={id:'',title,description,categoryId:category,status:'new',location,photos,authorId:currentUser.id,authorName:currentUser.name,authorAvatar:currentUser.avatar,anonymous,organizationId:orgId,votes:0,isVoted:false,comments:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),timeline:[],priority,viewCount:0};const saved=await addReport(draft);if(!saved)throw new Error('Muammo saqlanmadi');if(orgId)await supabase.functions.invoke('notify-report',{body:{reportId:saved.id,organizationId:orgId,title:saved.title}});setCreatedId(saved.id);setSubmitted(true);}catch(e:any){alert(e?.message||'Xatolik yuz berdi')}finally{setBusy(false)}};
if(submitted)return <div className="min-h-screen pt-24 flex items-center justify-center bg-gray-50"><div className="text-center bg-white rounded-2xl shadow-glass p-10 max-w-sm w-full mx-4"><div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-green-600"/></div><h2 className="text-xl font-bold mb-2">Muvaffaqiyatli yuborildi!</h2><p className="text-sm text-gray-500 mb-6">Murojaat real bazaga saqlandi.</p><button onClick={()=>navigate(`/reports/${createdId}`)} className="city-btn-primary w-full justify-center">Ko'rish</button></div></div>;
const canNext=step===0?!!category:step===1?!!location.address&&!!location.district:step===2?title.length>=10&&description.length>=20:true;
return (
<div className="min-h-screen pt-24 bg-gray-50">
  <div className="max-w-2xl mx-auto px-4 py-8">
    <div className="flex items-center gap-3 mb-8">
      <button onClick={()=>step?setStep(step-1):navigate(-1)} className="city-btn-ghost p-2 rounded-xl"><ArrowLeft className="w-5 h-5"/></button>
      <div><h1 className="text-xl font-bold">Muammo bildirish</h1><p className="text-sm text-gray-500">{step+1}/{STEPS.length}: {STEPS[step]}</p></div>
    </div>
    <div className="flex gap-2 mb-8">
      {STEPS.map((s,i)=>(
        <div key={s} className="flex-1">
          <div className={cn('h-1.5 rounded-full',i<=step?'bg-[#2563EB]':'bg-gray-200')}/>
          <p className="text-xs mt-1.5 text-center hidden sm:block">{s}</p>
        </div>
      ))}
    </div>
    <div className="bg-white rounded-2xl shadow-glass border border-gray-100 p-6">

      {step===0&&(
        <>
          <h2 className="text-lg font-bold mb-1">Kategoriya tanlang</h2>
          <p className="text-sm text-gray-500 mb-5">Muammo turini belgilang</p>
          <div className="grid grid-cols-3 gap-2.5">
            {CATEGORIES.map(c=>(
              <button key={c.id} onClick={()=>setCategory(c.id as CategoryId)} className={cn('p-3 rounded-xl border-2 text-center transition-all',category===c.id?'border-[#2563EB] bg-blue-50':'border-gray-100 hover:border-gray-300')}>
                <div className="text-2xl mb-1">{c.icon}</div>
                <div className="text-xs font-semibold">{c.name}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {step===1&&(
        <>
          <h2 className="text-lg font-bold mb-1">Joylashuvni belgilang</h2>
          <p className="text-sm text-gray-500 mb-4">Xaritadan nuqtani bosing yoki GPS orqali avtomatik aniqlang.</p>
          <div className="h-72 rounded-xl overflow-hidden mb-4">
            <MapView reports={[]} center={[location.lat,location.lng]} zoom={15} height="100%" onMapClick={setCoords} selectedLocation={[location.lat,location.lng]}/>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 mb-3 text-xs text-blue-800">
            <b>Tanlangan nuqta:</b> {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </div>
          <input value={location.address} onChange={e=>setLocation(l=>({...l,address:e.target.value}))} className="city-input mb-3" placeholder="Aniq manzil (ko'cha, uy raqami)..."/>
          <input value={location.district} onChange={e=>setLocation(l=>({...l,district:e.target.value}))} className="city-input mb-3" placeholder="Viloyat / tuman / shahar..."/>
          <button onClick={gps} disabled={gpsBusy} className="city-btn-secondary w-full justify-center gap-2 disabled:opacity-60">
            {gpsBusy ? <Loader2 className="w-4 h-4 animate-spin"/> : <Crosshair className="w-4 h-4"/>}
            {gpsBusy ? 'Joylashuv aniqlanmoqda...' : 'GPS orqali avtomatik aniqlash'}
          </button>
          {location.address&&(
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <Check className="w-3 h-3"/> Manzil aniqlandi
            </p>
          )}
        </>
      )}

      {step===2&&(
        <>
          <h2 className="text-lg font-bold mb-1">Muammo haqida</h2>
          <p className="text-sm text-gray-500 mb-4">AI muammoni tahlil qilib, kategoriya va ustuvorlikni tavsiya qiladi.</p>
          <input value={title} onChange={e=>setTitle(e.target.value)} className="city-input mb-3" placeholder="Sarlavha (kamida 10 belgi)"/>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={6} className="city-input resize-none mb-3" placeholder="Muammoni batafsil yozing..."/>
          <button onClick={runAI} disabled={aiBusy} className="w-full rounded-xl py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
            {aiBusy?<Loader2 className="w-4 h-4 animate-spin"/>:<Sparkles className="w-4 h-4"/>}
            {aiBusy?'AI tahlil qilmoqda...':'AI bilan tahlil qilish'}
          </button>
          {ai&&(
            <div className="mt-3 p-4 rounded-xl bg-violet-50 border border-violet-100 text-sm">
              <b>AI tavsiyasi</b>
              <p className="mt-1">Ustuvorlik: <b>{ai.priority}</b> · Ishonch: {Math.round((ai.confidence||0)*100)}%</p>
              <p className="text-gray-600 mt-1">{ai.reason}</p>
            </div>
          )}
          <div className="grid grid-cols-4 gap-2 my-4">
            {(['low','medium','high','urgent'] as Priority[]).map(p=>(
              <button key={p} onClick={()=>setPriority(p)} className={cn('py-2 rounded-xl border-2 text-xs font-medium transition-all',priority===p?'border-blue-600 bg-blue-50 text-blue-700':'border-gray-200 hover:border-gray-400')}>
                {p==='low'?'Past':p==='medium'?"O'rta":p==='high'?'Yuqori':'Shoshilinch'}
              </button>
            ))}
          </div>
          <label className="block border-2 border-dashed rounded-xl p-5 text-center cursor-pointer hover:border-blue-300 transition-colors">
            <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400"/>
            <span className="text-sm text-gray-500">Rasm tanlash (max 10 ta)</span>
            <input type="file" accept="image/*" multiple hidden onChange={e=>uploadPhotos(e.target.files).catch((x:any)=>alert(x.message))}/>
          </label>
          {photos.length>0&&<p className="text-xs text-green-600 mt-2 flex items-center gap-1"><Check className="w-3 h-3"/>{photos.length} ta rasm yuklandi</p>}
          <label className="flex items-center gap-3 mt-4 cursor-pointer">
            <input type="checkbox" checked={anonymous} onChange={e=>setAnonymous(e.target.checked)} className="w-4 h-4 rounded"/>
            <span className="text-sm">Anonim yuborish (ismingiz ko'rinmaydi)</span>
          </label>
        </>
      )}

      {step===3&&(
        <>
          <h2 className="text-lg font-bold mb-4">Tasdiqlash</h2>
          <div className="space-y-3 text-sm bg-gray-50 rounded-xl p-4">
            <div className="flex gap-2"><span className="text-gray-500 w-24 flex-shrink-0">Kategoriya:</span><span className="font-semibold">{CATEGORIES.find(c=>c.id===category)?.name||category}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 w-24 flex-shrink-0">Sarlavha:</span><span className="font-semibold">{title}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 w-24 flex-shrink-0">Manzil:</span><span className="text-gray-700 line-clamp-2">{location.address}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 w-24 flex-shrink-0">Hudud:</span><span className="font-semibold">{location.district}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 w-24 flex-shrink-0">Ustuvorlik:</span><span className="font-semibold capitalize">{priority==='low'?'Past':priority==='medium'?"O'rta":priority==='high'?'Yuqori':'Shoshilinch'}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 w-24 flex-shrink-0">Rasmlar:</span><span className="font-semibold">{photos.length} ta</span></div>
            <div className="flex gap-2"><span className="text-gray-500 w-24 flex-shrink-0">Anonim:</span><span className="font-semibold">{anonymous?'Ha':'Yo\'q'}</span></div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Yuborish tugmasini bosish orqali siz platforma qoidalariga rozilik bildirasiz.</p>
        </>
      )}

      <div className="flex gap-3 mt-6">
        {step>0&&<button onClick={()=>setStep(step-1)} className="city-btn-secondary flex-1 justify-center">Orqaga</button>}
        {step<3
          ?<button disabled={!canNext} onClick={()=>setStep(step+1)} className="city-btn-primary flex-1 justify-center disabled:opacity-40">Davom etish</button>
          :<button disabled={busy} onClick={submit} className="city-btn-primary flex-1 justify-center">
            {busy?<><Loader2 className="w-4 h-4 animate-spin"/>Yuborilmoqda...</>:'Muammoni yuborish'}
          </button>
        }
      </div>
    </div>
  </div>
</div>
);
}
