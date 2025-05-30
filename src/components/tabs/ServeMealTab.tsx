
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Meal {
  id: number;
  name: string;
  ingredients: any[];
}

export const ServeMealTab = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedMealId, setSelectedMealId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/meal/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMeals(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching meals:', error);
      toast({
        title: "Error",
        description: "Failed to fetch meals",
        variant: "destructive",
      });
    }
  };

  const serveMeal = async () => {
    if (!selectedMealId) {
      toast({
        title: "Error",
        description: "Please select a meal",
        variant: "destructive",
      });
      return;
    }

    const quantityNum = parseInt(quantity);
    if (quantityNum <= 0) {
      toast({
        title: "Error",
        description: "Quantity must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const promises = [];

      // Create multiple serve requests based on quantity
      for (let i = 0; i < quantityNum; i++) {
        promises.push(
          fetch('/serve-meal/', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              meal_id: parseInt(selectedMealId),
            }),
          })
        );
      }

      const responses = await Promise.all(promises);
      const failedRequests = responses.filter(response => !response.ok);

      if (failedRequests.length === 0) {
        toast({
          title: "Success",
          description: `Successfully served ${quantityNum} portion(s) of the meal`,
        });
        setSelectedMealId('');
        setQuantity('1');
      } else {
        toast({
          title: "Partial Success",
          description: `Served ${responses.length - failedRequests.length} out of ${quantityNum} portions`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error serving meal:', error);
      toast({
        title: "Error",
        description: "Failed to serve meal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedMeal = meals.find(meal => meal.id.toString() === selectedMealId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Serve Meal</h2>
        <p className="text-gray-600">
          Available for: Cook and Admin roles only
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Serve Meal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Select Meal</Label>
            <Select value={selectedMealId} onValueChange={setSelectedMealId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a meal to serve" />
              </SelectTrigger>
              <SelectContent>
                {meals.map((meal) => (
                  <SelectItem key={meal.id} value={meal.id.toString()}>
                    {meal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Quantity (Number of portions)</Label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              placeholder="Enter number of portions"
            />
          </div>

          {selectedMeal && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900">Selected Meal: {selectedMeal.name}</h4>
              <p className="text-sm text-blue-700">
                Ingredients: {selectedMeal.ingredients?.length || 0}
              </p>
            </div>
          )}

          <Button 
            onClick={serveMeal} 
            disabled={loading || !selectedMealId}
            className="w-full"
          >
            {loading ? 'Serving...' : `Serve ${quantity} Portion(s)`}
          </Button>
        </CardContent>
      </Card>

      <div className="text-sm text-gray-600 bg-yellow-50 p-4 rounded-lg">
        <p><strong>Note:</strong> When you serve a meal, the system will automatically deduct the required ingredients from inventory for each portion served.</p>
      </div>
    </div>
  );
};
