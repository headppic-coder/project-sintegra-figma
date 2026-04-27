import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { api } from '../lib/api';
import { toast } from 'sonner';

export function TestData() {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // Test Prospective Customers
      const prospective = await api.getProspectiveCustomers();
      results.prospectiveCustomers = {
        count: prospective?.length || 0,
        data: prospective,
        status: 'success'
      };
    } catch (error: any) {
      results.prospectiveCustomers = {
        count: 0,
        error: error.message,
        status: 'error'
      };
    }

    try {
      // Test Customers
      const customers = await api.getCustomers();
      results.customers = {
        count: customers?.length || 0,
        data: customers,
        status: 'success'
      };
    } catch (error: any) {
      results.customers = {
        count: 0,
        error: error.message,
        status: 'error'
      };
    }

    try {
      // Test Pipelines
      const pipelines = await api.getPipelines();
      results.pipelines = {
        count: pipelines?.length || 0,
        data: pipelines,
        status: 'success'
      };
    } catch (error: any) {
      results.pipelines = {
        count: 0,
        error: error.message,
        status: 'error'
      };
    }

    try {
      // Test Employees
      const employees = await api.getEmployees();
      results.employees = {
        count: employees?.length || 0,
        data: employees,
        status: 'success'
      };
    } catch (error: any) {
      results.employees = {
        count: 0,
        error: error.message,
        status: 'error'
      };
    }

    try {
      // Test Companies
      const companies = await api.getCompanies();
      results.companies = {
        count: companies?.length || 0,
        data: companies,
        status: 'success'
      };
    } catch (error: any) {
      results.companies = {
        count: 0,
        error: error.message,
        status: 'error'
      };
    }

    try {
      // Test Departments
      const departments = await api.getDepartments();
      results.departments = {
        count: departments?.length || 0,
        data: departments,
        status: 'success'
      };
    } catch (error: any) {
      results.departments = {
        count: 0,
        error: error.message,
        status: 'error'
      };
    }

    try {
      // Test Positions
      const positions = await api.getPositions();
      results.positions = {
        count: positions?.length || 0,
        data: positions,
        status: 'success'
      };
    } catch (error: any) {
      results.positions = {
        count: 0,
        error: error.message,
        status: 'error'
      };
    }

    try {
      // Test Lead Sources
      const leadSources = await api.getLeadSources();
      results.leadSources = {
        count: leadSources?.length || 0,
        data: leadSources,
        status: 'success'
      };
    } catch (error: any) {
      results.leadSources = {
        count: 0,
        error: error.message,
        status: 'error'
      };
    }

    setTestResults(results);
    setLoading(false);

    // Show toast summary
    const successCount = Object.values(results).filter((r: any) => r.status === 'success').length;
    const errorCount = Object.values(results).filter((r: any) => r.status === 'error').length;
    
    if (errorCount === 0) {
      toast.success(`Semua test berhasil! ${successCount} endpoints berfungsi normal.`);
    } else {
      toast.error(`${errorCount} test gagal, ${successCount} berhasil.`);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Test Koneksi Database</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Memeriksa koneksi Supabase dan ketersediaan data
          </p>
        </div>
        <Button onClick={runTests} disabled={loading} size="sm">
          {loading ? 'Testing...' : 'Run Test Lagi'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(testResults).map(([key, value]: [string, any]) => (
          <Card key={key} className={value.status === 'error' ? 'border-red-300' : 'border-green-300'}>
            <CardHeader className="px-3 pt-3 pb-2">
              <CardTitle className="text-xs font-medium flex items-center justify-between">
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className={`w-2 h-2 rounded-full ${value.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-2xl font-bold">
                {value.count}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                {value.status === 'success' ? 'Data tersedia' : `Error: ${value.error}`}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="px-3 pt-3 pb-2">
          <CardTitle className="text-sm">Detail Data</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <pre className="text-[10px] overflow-auto max-h-96 bg-gray-50 p-3 rounded">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
