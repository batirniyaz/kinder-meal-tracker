
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface MonthlySummary {
  meal_name: string;
  portions_served: number;
  total_possible_portions: number;
  difference_rate: number;
  potential_misuse: boolean;
}

interface IngredientUsage {
  date: string;
  ingredient_name: string;
  consumed: number;
  delivered: number;
  net_change: number;
}

interface IngredientAnalysis {
  ingredient_name: string;
  total_delivered: number;
  total_consumed: number;
  remaining_stock: number;
  usage_efficiency: number;
}

export const ReportsTab = () => {
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);
  const [ingredientUsage, setIngredientUsage] = useState<IngredientUsage[]>([]);
  const [ingredientAnalysis, setIngredientAnalysis] = useState<IngredientAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchMonthlySummary = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/report/monthly-summary/?year=${selectedYear}&month=${selectedMonth}`);
      
      if (response.ok) {
        const data = await response.json();
        setMonthlySummary(data.meals || []);
      }
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
      toast({
        title: "Error",
        description: "Failed to fetch monthly summary",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredientUsage = async () => {
    try {
      const startDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`;
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
      
      const response = await fetch(`/report/ingredient-usage/?start_date=${startDate}&end_date=${endDate}&group_by=day`);
      
      if (response.ok) {
        const data = await response.json();
        setIngredientUsage(data || []);
      }
    } catch (error) {
      console.error('Error fetching ingredient usage:', error);
      toast({
        title: "Error",
        description: "Failed to fetch ingredient usage",
        variant: "destructive",
      });
    }
  };

  const fetchIngredientAnalysis = async () => {
    try {
      const response = await fetch(`/report/ingredient-analysis/?year=${selectedYear}&month=${selectedMonth}`);
      
      if (response.ok) {
        const data = await response.json();
        setIngredientAnalysis(data || []);
      }
    } catch (error) {
      console.error('Error fetching ingredient analysis:', error);
      toast({
        title: "Error",
        description: "Failed to fetch ingredient analysis",
        variant: "destructive",
      });
    }
  };

  const generateReports = () => {
    fetchMonthlySummary();
    fetchIngredientUsage();
    fetchIngredientAnalysis();
  };

  useEffect(() => {
    generateReports();
  }, []);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Reports Dashboard</h2>
        <p className="text-gray-600">
          Available for: Admin and Manager roles only
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 items-end">
            <div>
              <Label>Month</Label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Year</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generateReports} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Reports'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary Report */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary - Meal Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlySummary.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Meal</th>
                    <th className="text-left p-2">Portions Served</th>
                    <th className="text-left p-2">Possible Portions</th>
                    <th className="text-left p-2">Difference Rate</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySummary.map((meal, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-medium">{meal.meal_name}</td>
                      <td className="p-2">{meal.portions_served}</td>
                      <td className="p-2">{meal.total_possible_portions}</td>
                      <td className="p-2">{meal.difference_rate.toFixed(1)}%</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          meal.potential_misuse 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {meal.potential_misuse ? 'Potential Misuse' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No data available for selected period</p>
          )}
        </CardContent>
      </Card>

      {/* Ingredient Analysis Report */}
      <Card>
        <CardHeader>
          <CardTitle>Ingredient Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {ingredientAnalysis.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Ingredient</th>
                    <th className="text-left p-2">Total Delivered</th>
                    <th className="text-left p-2">Total Consumed</th>
                    <th className="text-left p-2">Remaining Stock</th>
                    <th className="text-left p-2">Efficiency</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredientAnalysis.map((ingredient, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-medium">{ingredient.ingredient_name}</td>
                      <td className="p-2">{ingredient.total_delivered}g</td>
                      <td className="p-2">{ingredient.total_consumed}g</td>
                      <td className="p-2">{ingredient.remaining_stock}g</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          ingredient.usage_efficiency > 80 
                            ? 'bg-green-100 text-green-800' 
                            : ingredient.usage_efficiency > 60 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {ingredient.usage_efficiency.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No data available for selected period</p>
          )}
        </CardContent>
      </Card>

      {/* Ingredient Usage Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Ingredient Usage</CardTitle>
        </CardHeader>
        <CardContent>
          {ingredientUsage.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Ingredient</th>
                    <th className="text-left p-2">Consumed</th>
                    <th className="text-left p-2">Delivered</th>
                    <th className="text-left p-2">Net Change</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredientUsage.map((usage, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{new Date(usage.date).toLocaleDateString()}</td>
                      <td className="p-2 font-medium">{usage.ingredient_name}</td>
                      <td className="p-2 text-red-600">-{usage.consumed}g</td>
                      <td className="p-2 text-green-600">+{usage.delivered}g</td>
                      <td className="p-2">
                        <span className={usage.net_change >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {usage.net_change >= 0 ? '+' : ''}{usage.net_change}g
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No usage data available for selected period</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
