
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Meal {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  ingredients: MealIngredient[];
}

interface MealIngredient {
  meal_id: number;
  ingredient_id: number;
  weight: number;
  ingredient: {
    id: number;
    name: string;
    weight: number;
  };
}

interface Ingredient {
  id: number;
  name: string;
  weight: number;
}

export const MealsTab = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMealName, setNewMealName] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [newIngredientId, setNewIngredientId] = useState('');
  const [newIngredientWeight, setNewIngredientWeight] = useState('');
  const { user } = useAuth();

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    fetchMeals();
    fetchIngredients();
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
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/ingredient/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIngredients(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  const createMeal = async () => {
    if (!newMealName.trim()) {
      toast({
        title: "Error",
        description: "Meal name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/meal/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newMealName }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Meal created successfully",
        });
        setNewMealName('');
        setCreateDialogOpen(false);
        fetchMeals();
      } else {
        throw new Error('Failed to create meal');
      }
    } catch (error) {
      console.error('Error creating meal:', error);
      toast({
        title: "Error",
        description: "Failed to create meal",
        variant: "destructive",
      });
    }
  };

  const addIngredientToMeal = async () => {
    if (!newIngredientId || !newIngredientWeight || !selectedMeal) {
      toast({
        title: "Error",
        description: "Please select ingredient and enter weight",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/meal-ingredient/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meal_id: selectedMeal.id,
          ingredient_id: parseInt(newIngredientId),
          weight: parseFloat(newIngredientWeight),
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Ingredient added to meal successfully",
        });
        setNewIngredientId('');
        setNewIngredientWeight('');
        fetchMeals();
        // Refresh selected meal details
        const updatedMeal = meals.find(m => m.id === selectedMeal.id);
        if (updatedMeal) {
          setSelectedMeal(updatedMeal);
        }
      } else {
        throw new Error('Failed to add ingredient to meal');
      }
    } catch (error) {
      console.error('Error adding ingredient to meal:', error);
      toast({
        title: "Error",
        description: "Failed to add ingredient to meal",
        variant: "destructive",
      });
    }
  };

  const viewMealDetails = (meal: Meal) => {
    setSelectedMeal(meal);
    setDetailsDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading meals...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Meals Management</h2>
        {canManage && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Meal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Meal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Meal Name</Label>
                  <Input
                    id="name"
                    value={newMealName}
                    onChange={(e) => setNewMealName(e.target.value)}
                    placeholder="Enter meal name"
                  />
                </div>
                <Button onClick={createMeal} className="w-full">
                  Create Meal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {meals.map((meal) => (
          <Card key={meal.id}>
            <CardHeader>
              <CardTitle>{meal.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Ingredients: {meal.ingredients?.length || 0}
              </p>
              <Button 
                onClick={() => viewMealDetails(meal)}
                variant="outline" 
                size="sm"
                className="w-full"
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMeal?.name} - Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Current Ingredients</h3>
              {selectedMeal?.ingredients && selectedMeal.ingredients.length > 0 ? (
                <div className="space-y-2">
                  {selectedMeal.ingredients.map((mealIngredient) => (
                    <div key={mealIngredient.ingredient_id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{mealIngredient.ingredient.name}</span>
                      <span className="text-sm text-gray-600">{mealIngredient.weight}g per portion</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No ingredients added yet</p>
              )}
            </div>

            {canManage && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Add Ingredient</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Select Ingredient</Label>
                    <Select value={newIngredientId} onValueChange={setNewIngredientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an ingredient" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map((ingredient) => (
                          <SelectItem key={ingredient.id} value={ingredient.id.toString()}>
                            {ingredient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Weight per portion (grams)</Label>
                    <Input
                      type="number"
                      value={newIngredientWeight}
                      onChange={(e) => setNewIngredientWeight(e.target.value)}
                      placeholder="Enter weight in grams"
                    />
                  </div>
                  <Button onClick={addIngredientToMeal} className="w-full">
                    Add Ingredient
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {meals.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No meals found. {canManage && 'Click "Add Meal" to create your first meal.'}
        </div>
      )}
    </div>
  );
};
