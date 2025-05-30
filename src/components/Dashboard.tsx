
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { IngredientsTab } from './tabs/IngredientsTab';
import { MealsTab } from './tabs/MealsTab';
import { ServeMealTab } from './tabs/ServeMealTab';
import { PortionEstimationTab } from './tabs/PortionEstimationTab';
import { NotificationsTab } from './tabs/NotificationsTab';
import { ReportsTab } from './tabs/ReportsTab';
import { UserManagementTab } from './tabs/UserManagementTab';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('ingredients');

  const canAccess = (requiredRoles: string[]) => {
    return user && requiredRoles.includes(user.role);
  };

  const tabs = [
    { id: 'ingredients', label: 'Ingredients', roles: ['cook', 'admin', 'manager'] },
    { id: 'meals', label: 'Meals', roles: ['cook', 'admin', 'manager'] },
    { id: 'serve-meal', label: 'Serve Meal', roles: ['cook', 'admin'] },
    { id: 'portion-estimation', label: 'Portion Estimation', roles: ['cook', 'admin', 'manager'] },
    { id: 'notifications', label: 'Notifications', roles: ['cook', 'admin', 'manager'] },
    { id: 'reports', label: 'Reports', roles: ['admin', 'manager'] },
    { id: 'users', label: 'User Management', roles: ['admin'] },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Kindergarten Management System
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.first_name} {user?.last_name} ({user?.role})
              </span>
              <Button onClick={logout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-7 w-full mb-8">
            {tabs.map((tab) => 
              canAccess(tab.roles) ? (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ) : null
            )}
          </TabsList>

          <TabsContent value="ingredients">
            <IngredientsTab />
          </TabsContent>

          <TabsContent value="meals">
            <MealsTab />
          </TabsContent>

          {canAccess(['cook', 'admin']) && (
            <TabsContent value="serve-meal">
              <ServeMealTab />
            </TabsContent>
          )}

          <TabsContent value="portion-estimation">
            <PortionEstimationTab />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>

          {canAccess(['admin', 'manager']) && (
            <TabsContent value="reports">
              <ReportsTab />
            </TabsContent>
          )}

          {canAccess(['admin']) && (
            <TabsContent value="users">
              <UserManagementTab />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};
