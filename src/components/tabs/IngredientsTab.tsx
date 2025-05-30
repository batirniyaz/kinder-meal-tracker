
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Ingredient {
  id: number;
  name: string;
  weight: number;
  created_at: string;
  updated_at: string;
}

export const IngredientsTab = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIngredientName, setNewIngredientName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    fetchIngredients();
  }, []);

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
      toast({
        title: "Error",
        description: "Failed to fetch ingredients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createIngredient = async () => {
    if (!newIngredientName.trim()) {
      toast({
        title: "Error",
        description: "Ingredient name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/ingredient/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newIngredientName }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Ingredient created successfully",
        });
        setNewIngredientName('');
        setDialogOpen(false);
        fetchIngredients();
      } else {
        throw new Error('Failed to create ingredient');
      }
    } catch (error) {
      console.error('Error creating ingredient:', error);
      toast({
        title: "Error",
        description: "Failed to create ingredient",
        variant: "destructive",
      });
    }
  };

  const deleteIngredient = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ingredient?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/ingredient/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Ingredient deleted successfully",
        });
        fetchIngredients();
      } else {
        throw new Error('Failed to delete ingredient');
      }
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      toast({
        title: "Error",
        description: "Failed to delete ingredient",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading ingredients...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ingredients Management</h2>
        {canManage && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Ingredient</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Ingredient</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Ingredient Name</Label>
                  <Input
                    id="name"
                    value={newIngredientName}
                    onChange={(e) => setNewIngredientName(e.target.value)}
                    placeholder="Enter ingredient name"
                  />
                </div>
                <Button onClick={createIngredient} className="w-full">
                  Create Ingredient
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ingredients.map((ingredient) => (
          <Card key={ingredient.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{ingredient.name}</span>
                {canManage && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteIngredient(ingredient.id)}
                  >
                    Delete
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Current Weight: {ingredient.weight}g
              </p>
              <p className="text-xs text-gray-500">
                Created: {new Date(ingredient.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {ingredients.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No ingredients found. {canManage && 'Click "Add Ingredient" to create your first ingredient.'}
        </div>
      )}
    </div>
  );
};
