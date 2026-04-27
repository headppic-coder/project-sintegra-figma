import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  BookOpen, Search, Users, Palette, ClipboardCheck, Factory, 
  Package, ShoppingCart, Building2, FileText, ExternalLink,
  CheckCircle, XCircle, Lightbulb, List, ArrowRight
} from 'lucide-react';
import { api } from '../lib/api';

export function Documentation() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await api.getDocumentation();
      setDocs(data);
    } catch (error) {
      console.error('Error loading documentation:', error);
    } finally {
      setLoading(false);
    }
  };

  const modules = Array.from(new Set(docs.map((doc: any) => doc.module)));
  
  const filteredDocs = docs.filter((doc: any) => {
    const matchesSearch = 
      doc.feature.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = !selectedModule || doc.module === selectedModule;
    return matchesSearch && matchesModule;
  });

  const getModuleIcon = (module: string) => {
    const icons: any = {
      'Sales': Users,
      'Design': Palette,
      'PPIC': ClipboardCheck,
      'Produksi': Factory,
      'Gudang': Package,
      'Procurement': ShoppingCart,
      'HRGA': Building2,
    };
    return icons[module] || FileText;
  };

  const getModuleColor = (module: string) => {
    const colors: any = {
      'Sales': 'bg-blue-500',
      'Design': 'bg-purple-500',
      'PPIC': 'bg-green-500',
      'Produksi': 'bg-orange-500',
      'Gudang': 'bg-cyan-500',
      'Procurement': 'bg-pink-500',
      'HRGA': 'bg-indigo-500',
    };
    return colors[module] || 'bg-gray-500';
  };

  if (selectedDoc) {
    const Icon = getModuleIcon(selectedDoc.module);
    const FeatureIcon = getModuleIcon(selectedDoc.feature);
    
    return (
      <div className="p-6 space-y-6">
        {/* Header dengan Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <button
                onClick={() => setSelectedDoc(null)}
                className="hover:text-blue-600 transition-colors"
              >
                Dokumentasi Sistem
              </button>
              <span>/</span>
              <span className="text-gray-700 font-medium">{selectedDoc.feature}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${getModuleColor(selectedDoc.module)} rounded-lg flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedDoc.feature}</h1>
                <p className="text-sm text-gray-500">{selectedDoc.module}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelectedDoc(null)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Kembali
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content - 2 Columns */}
          <div className="col-span-2 space-y-6">
            {/* Deskripsi & Purpose */}
            <Card className="p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Deskripsi</h2>
                <p className="text-gray-700">{selectedDoc.description}</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Tujuan</h2>
                <p className="text-gray-700">{selectedDoc.purpose}</p>
              </div>
            </Card>

            {/* Fields */}
            {selectedDoc.fields && selectedDoc.fields.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Field Data</h2>
                <div className="space-y-3">
                  {selectedDoc.fields.map((field: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{field.name}</span>
                          {field.required && (
                            <Badge variant="destructive" className="text-xs">Wajib</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">{field.type}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{field.description}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Cara Penggunaan */}
            {selectedDoc.usage && selectedDoc.usage.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <List className="w-5 h-5 text-blue-600" />
                  Cara Penggunaan
                </h2>
                <ol className="space-y-2">
                  {selectedDoc.usage.map((step: string, index: number) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            )}

            {/* Tips & Best Practices */}
            {selectedDoc.tips && selectedDoc.tips.length > 0 && (
              <Card className="p-6 bg-yellow-50 border-yellow-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  Tips & Best Practices
                </h2>
                <ul className="space-y-2">
                  {selectedDoc.tips.map((tip: string, index: number) => (
                    <li key={index} className="flex gap-2 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Sidebar - 1 Column */}
          <div className="space-y-6">
            {/* Related Features */}
            {selectedDoc.relatedFeatures && selectedDoc.relatedFeatures.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-gray-600" />
                  Fitur Terkait
                </h2>
                <div className="space-y-2">
                  {selectedDoc.relatedFeatures.map((feature: any, index: number) => (
                    <Link
                      key={index}
                      to={feature.path}
                      className="block p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 group-hover:text-blue-600">
                          {feature.name}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                      </div>
                      <p className="text-xs text-gray-500">{feature.description}</p>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* Quick Info */}
            <Card className="p-6 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-3">Informasi</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Modul:</span>
                  <Badge className={getModuleColor(selectedDoc.module)}>
                    {selectedDoc.module}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Field:</span>
                  <span className="font-medium">{selectedDoc.fields?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Field Wajib:</span>
                  <span className="font-medium">
                    {selectedDoc.fields?.filter((f: any) => f.required).length || 0}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dokumentasi Sistem</h1>
            <p className="text-gray-500">Panduan lengkap penggunaan sistem ERP</p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Cari dokumentasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedModule(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !selectedModule
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semua
            </button>
            {modules.map((module) => (
              <button
                key={module}
                onClick={() => setSelectedModule(module)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedModule === module
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {module}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Documentation Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Memuat dokumentasi...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc: any) => {
            const Icon = getModuleIcon(doc.module);
            return (
              <Card
                key={doc.id}
                className="p-5 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => setSelectedDoc(doc)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 ${getModuleColor(doc.module)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {doc.feature}
                    </h3>
                    <Badge variant="outline" className="mt-1">{doc.module}</Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {doc.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{doc.fields?.length || 0} fields</span>
                  <span className="text-blue-600 group-hover:underline">
                    Lihat detail →
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {filteredDocs.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada hasil</h3>
          <p className="text-gray-500">
            Coba kata kunci atau filter lain
          </p>
        </Card>
      )}
    </div>
  );
}
