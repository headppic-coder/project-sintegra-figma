import { useState, useEffect } from 'react';
import { Network, Building, ChevronDown, ChevronRight, Briefcase, Users } from 'lucide-react';
import { PageHeader } from '../../components/page-header';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface Department {
  id: string;
  code: string;
  name: string;
  companyCode: string;
  parentCode: string | null;
  level: number;
  headOfDepartment: string;
  employeeCount: number;
  status: string;
}

interface Position {
  id: string;
  code: string;
  name: string;
  departmentCode: string | null;
  parentCode: string | null;
  level: number;
  requirements: string;
  status: string;
}

interface Company {
  id: string;
  code: string;
  companyName: string;
}

export function OrganizationStructure() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptsData, positionsData, companiesData] = await Promise.all([
        api.getDepartments(),
        api.getPositions(),
        api.getCompanies()
      ]);
      
      setDepartments(deptsData || []);
      setPositions(positionsData || []);
      setCompanies(companiesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const toggleDepartment = (deptCode: string) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(deptCode)) {
      newExpanded.delete(deptCode);
    } else {
      newExpanded.add(deptCode);
    }
    setExpandedDepts(newExpanded);
  };

  const togglePosition = (posCode: string) => {
    const newExpanded = new Set(expandedPositions);
    if (newExpanded.has(posCode)) {
      newExpanded.delete(posCode);
    } else {
      newExpanded.add(posCode);
    }
    setExpandedPositions(newExpanded);
  };

  const getChildDepartments = (parentCode: string | null) => {
    return departments.filter(d => d.parentCode === parentCode && d.status === 'Active');
  };

  const getPositionsByDepartment = (deptCode: string) => {
    return positions.filter(p => p.departmentCode === deptCode && p.status === 'Active');
  };

  const getChildPositions = (parentCode: string | null, deptCode: string) => {
    return positions.filter(p => 
      p.parentCode === parentCode && 
      p.departmentCode === deptCode && 
      p.status === 'Active'
    );
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-blue-100 text-blue-800 border-blue-300';
      case 2: return 'bg-green-100 text-green-800 border-green-300';
      case 3: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPositionLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-purple-100 text-purple-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-teal-100 text-teal-800';
      case 4: return 'bg-orange-100 text-orange-800';
      case 5: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPositionLevelLabel = (level: number) => {
    switch (level) {
      case 1: return 'C-Level';
      case 2: return 'Manager';
      case 3: return 'Supervisor';
      case 4: return 'Staff';
      case 5: return 'Operator';
      default: return 'Level ' + level;
    }
  };

  // Render position node dengan hierarki
  const renderPosition = (position: Position, depth: number = 0) => {
    const childPositions = getChildPositions(position.code, position.departmentCode || '');
    const hasChildren = childPositions.length > 0;
    const isExpanded = expandedPositions.has(position.code);

    return (
      <div key={position.id} className="ml-6 mt-2">
        <div className="flex items-start gap-2 group">
          {/* Toggle button */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 mt-1"
              onClick={() => togglePosition(position.code)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          )}
          {!hasChildren && <div className="w-8" />}

          {/* Position card */}
          <div className="flex-1">
            <div className="border rounded-lg p-3 bg-white hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Briefcase className="h-5 w-5 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{position.name}</h4>
                      <Badge variant="outline" className="text-xs font-mono">
                        {position.code}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getPositionLevelColor(position.level)}`}
                      >
                        {getPositionLevelLabel(position.level)}
                      </Badge>
                      
                      {position.requirements && (
                        <span className="text-xs text-muted-foreground truncate max-w-md">
                          {position.requirements}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {hasChildren && (
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {childPositions.length} bawahan
                  </Badge>
                )}
              </div>
            </div>

            {/* Child positions */}
            {hasChildren && isExpanded && (
              <div className="mt-2 ml-4 border-l-2 border-blue-200 pl-2">
                {childPositions.map(childPos => renderPosition(childPos, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render department node dengan hierarki
  const renderDepartment = (dept: Department, depth: number = 0) => {
    const childDepts = getChildDepartments(dept.code);
    const deptPositions = getPositionsByDepartment(dept.code);
    const topLevelPositions = deptPositions.filter(p => !p.parentCode);
    const hasChildren = childDepts.length > 0 || deptPositions.length > 0;
    const isExpanded = expandedDepts.has(dept.code);

    return (
      <div key={dept.id} className={`${depth > 0 ? 'ml-8 mt-4' : 'mt-4'}`}>
        {/* Department Node */}
        <div className="flex items-start gap-3">
          {/* Toggle button */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 mt-2"
              onClick={() => toggleDepartment(dept.code)}
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
          )}
          {!hasChildren && <div className="w-10" />}

          {/* Department Card */}
          <div className="flex-1">
            <div 
              className={`border-2 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-all ${getLevelColor(dept.level)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center flex-shrink-0">
                    <Building className="h-7 w-7 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg">{dept.name}</h3>
                      <Badge variant="outline" className="font-mono text-xs">
                        {dept.code}
                      </Badge>
                      <Badge className={`text-xs ${getLevelColor(dept.level)}`}>
                        L{dept.level}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {dept.headOfDepartment && (
                        <div>
                          <span className="text-muted-foreground text-xs">Kepala:</span>
                          <p className="font-medium">{dept.headOfDepartment}</p>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-muted-foreground text-xs">Karyawan:</span>
                        <p className="font-medium flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {dept.employeeCount || 0} orang
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground text-xs">Jabatan:</span>
                        <p className="font-medium flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {deptPositions.length} posisi
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {hasChildren && (
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground mb-1">Sub Unit:</div>
                    <Badge variant="secondary">
                      {childDepts.length} dept
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && hasChildren && (
              <div className="mt-4 ml-4 pl-4 border-l-4 border-slate-300">
                {/* Positions in this department */}
                {topLevelPositions.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-semibold text-sm text-muted-foreground">
                        Struktur Jabatan
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {topLevelPositions.map(pos => renderPosition(pos))}
                    </div>
                  </div>
                )}

                {/* Child departments */}
                {childDepts.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-semibold text-sm text-muted-foreground">
                        Sub Departemen
                      </h4>
                    </div>
                    {childDepts.map(childDept => renderDepartment(childDept, depth + 1))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-4">
      <PageHeader
        title="Struktur Organisasi"
        description="Visualisasi hierarki departemen dan jabatan perusahaan"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'HRGA' },
          { label: 'Struktur Organisasi' },
        ]}
        icon={Network}
      />

      <Card className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Memuat struktur organisasi...</p>
          </div>
        ) : departments.length === 0 ? (
          <div className="text-center py-12">
            <Network className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-2">Belum ada struktur organisasi</p>
            <p className="text-sm text-muted-foreground">
              Tambahkan data di Master Departemen dan Master Posisi
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Company Groups */}
            {companies.map(company => {
              const companyDepts = getChildDepartments(null).filter(
                d => d.companyCode === company.code
              );
              
              if (companyDepts.length === 0) return null;

              return (
                <div key={company.id} className="space-y-4">
                  {/* Company Header */}
                  <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-5 text-white">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center">
                        <Building className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{company.companyName}</h2>
                        <p className="text-sm text-white/70 font-mono">{company.code}</p>
                      </div>
                    </div>
                  </div>

                  {/* Top Level Departments */}
                  <div className="space-y-4">
                    {companyDepts.map(dept => renderDepartment(dept, 0))}
                  </div>
                </div>
              );
            })}

            {/* Departments without company */}
            {getChildDepartments(null).filter(d => !d.companyCode).length > 0 && (
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-xl p-5">
                  <h2 className="text-lg font-bold text-gray-700">Departemen Lainnya</h2>
                </div>
                {getChildDepartments(null)
                  .filter(d => !d.companyCode)
                  .map(dept => renderDepartment(dept, 0))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}