import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Building2,
  Bed,
  Bath,
  Car,
  Maximize,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { propertiesApi } from '../services/api';
import type { Property } from '../types';

const typeLabels: Record<string, string> = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  terreno: 'Terreno',
  comercial: 'Comercial',
  cobertura: 'Cobertura',
  flat: 'Flat',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  disponivel: { label: 'Disponível', color: 'bg-success-50 text-success-600' },
  reservado: { label: 'Reservado', color: 'bg-warning-50 text-warning-600' },
  vendido: { label: 'Vendido', color: 'bg-slate-100 text-slate-500' },
  indisponivel: { label: 'Indisponível', color: 'bg-danger-50 text-danger-600' },
};

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<any>(null);

  useEffect(() => {
    loadProperties();
    loadFilterOptions();
  }, [meta.page, filters]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const res = await propertiesApi.getAll({ ...filters, page: meta.page, limit: meta.limit });
      setProperties(res.data.data);
      setMeta(res.data.meta);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const res = await propertiesApi.getFilterOptions();
      setFilterOptions(res.data.data);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Portfólio</h1>
          <p className="text-slate-500 mt-1">Gerencie seus imóveis disponíveis</p>
        </div>
        <Link
          to="/portfolio/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Imóvel
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por título, bairro, cidade..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            showFilters
              ? 'bg-primary-50 border-primary-200 text-primary-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {showFilters && filterOptions && (
        <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 animate-fade-in">
          <select
            value={filters.type || ''}
            onChange={(e) => setFilters({ ...filters, type: e.target.value || undefined })}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
          >
            <option value="">Todos os tipos</option>
            {filterOptions.types?.map((t: string) => (
              <option key={t} value={t}>{typeLabels[t] || t}</option>
            ))}
          </select>
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
          >
            <option value="">Todos os status</option>
            <option value="disponivel">Disponível</option>
            <option value="reservado">Reservado</option>
            <option value="vendido">Vendido</option>
          </select>
          <select
            value={filters.bedrooms || ''}
            onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value || undefined })}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
          >
            <option value="">Quartos</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </div>
      )}

      {/* Properties grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="h-48 bg-slate-100 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 bg-slate-100 rounded animate-pulse w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">Nenhum imóvel cadastrado</p>
          <Link
            to="/portfolio/new"
            className="inline-flex items-center gap-2 mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Cadastrar primeiro imóvel
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Link
                key={property._id}
                to={`/portfolio/${property._id}`}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Image */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images.find((i) => i.isMain)?.url || property.images[0].url}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusLabels[property.status]?.color || 'bg-slate-100 text-slate-500'}`}>
                      {statusLabels[property.status]?.label || property.status}
                    </span>
                  </div>
                  {property.featured && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-600 text-white">
                        Destaque
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-lg font-bold text-slate-900">{formatPrice(property.price)}</p>
                  <h3 className="text-sm font-medium text-slate-800 mt-1 line-clamp-1">{property.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {property.address.neighborhood}, {property.address.city}
                  </p>

                  {/* Features */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                    {property.bedrooms > 0 && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Bed className="w-3.5 h-3.5" />
                        {property.bedrooms}
                      </span>
                    )}
                    {property.bathrooms > 0 && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Bath className="w-3.5 h-3.5" />
                        {property.bathrooms}
                      </span>
                    )}
                    {property.parkingSpots > 0 && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Car className="w-3.5 h-3.5" />
                        {property.parkingSpots}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Maximize className="w-3.5 h-3.5" />
                      {property.area}m²
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {meta.total > meta.limit && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setMeta({ ...meta, page: meta.page - 1 })}
                disabled={meta.page === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-500">
                Página {meta.page} de {Math.ceil(meta.total / meta.limit)}
              </span>
              <button
                onClick={() => setMeta({ ...meta, page: meta.page + 1 })}
                disabled={!meta.hasMore}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
