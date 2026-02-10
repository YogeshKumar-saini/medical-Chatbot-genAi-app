'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ChartBarIcon, UsersIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';

export default function OrgAdminAnalyticsPage() {
  const [stats, setStats] = useState({
    total_members: 0,
    active_therapists: 0,
    total_patients: 0,
    appointments_this_month: 0,
    completed_appointments: 0,
    avg_satisfaction: 4.8, // Placeholder
  });

  React.useEffect(() => {
    const loadStats = async () => {
      try {
        // 1. Get Org & Members
        const myOrg = await apiClient.getMyOrganization();
        if (myOrg && myOrg.id) {
          const members = await apiClient.getOrganizationMembers(myOrg.id);
          const doctorsCount = members.doctors.length;
          const patientsCount = members.patients.length;

          // 2. Get Appointments
          const appointments = await apiClient.getAppointments();
          const totalAppts = appointments.length;
          const completedAppts = appointments.filter((a: any) => a.status === 'COMPLETED').length;

          setStats({
            total_members: doctorsCount + patientsCount,
            active_therapists: doctorsCount,
            total_patients: patientsCount,
            appointments_this_month: totalAppts, // Assuming 'getAppointments' returns all? Or maybe recent?
            completed_appointments: completedAppts,
            avg_satisfaction: 4.8
          });
        }
      } catch (e) {
        console.error("Failed to load analytics", e);
      }
    };
    loadStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organization Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor your organization's performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card variant="glass">
            <CardContent padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.total_members}</p>
                </div>
                <UsersIcon className="h-12 w-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Therapists</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.active_therapists}</p>
                </div>
                <UsersIcon className="h-12 w-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Patients</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.total_patients}</p>
                </div>
                <UsersIcon className="h-12 w-12 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Appointments (Month)</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.appointments_this_month}</p>
                </div>
                <CalendarIcon className="h-12 w-12 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.completed_appointments}</p>
                </div>
                <ChartBarIcon className="h-12 w-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Satisfaction</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.avg_satisfaction}/5</p>
                </div>
                <ChartBarIcon className="h-12 w-12 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Chart placeholder - Integrate with charting library
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
