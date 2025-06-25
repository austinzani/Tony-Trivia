import React from 'react';
import { ScheduledGamesManager } from '../components/scheduled/ScheduledGamesManager';
import { GameNotificationBell } from '../components/scheduled/GameNotificationBell';

export function ScheduledGamesDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Header */}
      <div className="bg-white shadow-sm border-b border-electric-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-electric-700">
                Scheduled Games Feature Demo
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Schedule games in advance, manage invitations, and track RSVPs
              </p>
            </div>
            <GameNotificationBell />
          </div>
        </div>
      </div>

      {/* Feature Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-electric-700 mb-4">
            Feature Overview
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">For Hosts</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-energy-green mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Schedule games days or weeks in advance
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-energy-green mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Set up recurring games (daily, weekly, monthly)
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-energy-green mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Invite specific players to games
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-energy-green mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Track RSVPs and manage attendance
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-energy-green mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Configure game settings in advance
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">For Players</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-electric-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  View upcoming games in list or calendar view
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-electric-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  RSVP to game invitations (Accept/Maybe/Decline)
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-electric-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Specify team preferences when accepting
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-electric-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Receive game reminders and notifications
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-electric-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Auto-join games when they start
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-electric-100">
            <div className="w-12 h-12 bg-electric-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-electric-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-700 mb-2">Calendar View</h3>
            <p className="text-sm text-gray-600">
              Visual calendar interface to see all scheduled games at a glance
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-electric-100">
            <div className="w-12 h-12 bg-plasma-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-plasma-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-700 mb-2">Smart Reminders</h3>
            <p className="text-sm text-gray-600">
              Automated notifications for upcoming games and RSVP updates
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-electric-100">
            <div className="w-12 h-12 bg-energy-green/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-energy-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-700 mb-2">Recurring Games</h3>
            <p className="text-sm text-gray-600">
              Set up weekly trivia nights or monthly tournaments automatically
            </p>
          </div>
        </div>
      </div>

      {/* Main Component */}
      <ScheduledGamesManager />
    </div>
  );
}