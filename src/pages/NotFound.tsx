import { useNavigate } from 'react-router-dom';
import { MapPin, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen pt-24 flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="relative mb-6">
          <div className="text-[120px] font-black text-gray-100 select-none leading-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="w-16 h-16 text-[#2563EB]" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sahifa topilmadi</h1>
        <p className="text-gray-500 text-sm mb-8">Siz qidirayotgan sahifa mavjud emas yoki o'chirilgan.</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => navigate(-1)} className="city-btn-secondary"><ArrowLeft className="w-4 h-4" />Orqaga</button>
          <button onClick={() => navigate('/')} className="city-btn-primary"><Home className="w-4 h-4" />Bosh sahifa</button>
        </div>
      </div>
    </div>
  );
}
