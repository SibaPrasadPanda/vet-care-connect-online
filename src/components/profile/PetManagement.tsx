
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2 } from "lucide-react";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  color: string;
  medical_history: string;
  created_at: string;
}

export const PetManagement = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    age: 0,
    weight: 0,
    color: "",
    medical_history: "",
  });

  useEffect(() => {
    if (user) {
      loadPets();
    }
  }, [user]);

  const loadPets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPets(data || []);
    } catch (error) {
      console.error('Error loading pets:', error);
      toast({
        title: "Error",
        description: "Failed to load pets",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const petData = {
        ...formData,
        user_id: user.id,
      };

      let error;
      if (editingPet) {
        ({ error } = await supabase
          .from('pets')
          .update(petData)
          .eq('id', editingPet.id));
      } else {
        ({ error } = await supabase
          .from('pets')
          .insert(petData));
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Pet ${editingPet ? 'updated' : 'added'} successfully`,
      });
      
      setIsDialogOpen(false);
      resetForm();
      loadPets();
    } catch (error) {
      console.error('Error saving pet:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingPet ? 'update' : 'add'} pet`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (petId: string) => {
    try {
      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', petId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pet deleted successfully",
      });
      loadPets();
    } catch (error) {
      console.error('Error deleting pet:', error);
      toast({
        title: "Error",
        description: "Failed to delete pet",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      species: "",
      breed: "",
      age: 0,
      weight: 0,
      color: "",
      medical_history: "",
    });
    setEditingPet(null);
  };

  const openEditDialog = (pet: Pet) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      age: pet.age,
      weight: pet.weight,
      color: pet.color,
      medical_history: pet.medical_history,
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">My Pets</h2>
          <p className="text-muted-foreground">Manage your pet information</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Pet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPet ? 'Edit Pet' : 'Add New Pet'}</DialogTitle>
              <DialogDescription>
                {editingPet ? 'Update your pet information' : 'Add a new pet to your profile'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Pet Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter pet name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="species">Species</Label>
                <Select
                  value={formData.species}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, species: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select species" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">Dog</SelectItem>
                    <SelectItem value="cat">Cat</SelectItem>
                    <SelectItem value="bird">Bird</SelectItem>
                    <SelectItem value="rabbit">Rabbit</SelectItem>
                    <SelectItem value="hamster">Hamster</SelectItem>
                    <SelectItem value="fish">Fish</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="breed">Breed</Label>
                <Input
                  id="breed"
                  value={formData.breed}
                  onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                  placeholder="Enter breed"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="Enter color"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="age">Age (years)</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                  placeholder="Enter age"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                  placeholder="Enter weight"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="medical_history">Medical History</Label>
              <Textarea
                id="medical_history"
                value={formData.medical_history}
                onChange={(e) => setFormData(prev => ({ ...prev, medical_history: e.target.value }))}
                placeholder="Enter any medical history, allergies, or notes"
                rows={3}
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Saving..." : (editingPet ? "Update Pet" : "Add Pet")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pets.map((pet) => (
          <Card key={pet.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{pet.name}</CardTitle>
                  <CardDescription>
                    <Badge variant="secondary" className="mr-2">{pet.species}</Badge>
                    {pet.breed}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(pet)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(pet.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Age:</span>
                  <span>{pet.age} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Weight:</span>
                  <span>{pet.weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Color:</span>
                  <span>{pet.color}</span>
                </div>
                {pet.medical_history && (
                  <div className="mt-3">
                    <span className="font-medium">Medical History:</span>
                    <p className="text-muted-foreground text-xs mt-1">{pet.medical_history}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {pets.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground mb-4">No pets added yet</p>
              <Button onClick={openAddDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Pet
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
