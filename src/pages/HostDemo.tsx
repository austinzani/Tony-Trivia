import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, Sparkles } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../components/ui/host';
import HostControlsLayout from '../components/host/HostControlsLayout';

/**
 * Demo page showcasing all advanced host controls
 * This page demonstrates the full capabilities of the host interface
 */
export default function HostDemo() {
  const demoGameId = 'DEMO-GAME-001';

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-electric-50 via-plasma-50 to-electric-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 bg-gradient-to-r from-electric-500 to-plasma-600 rounded-2xl text-white shadow-electric-lg">
                <Monitor className="w-10 h-10" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-electric-600 to-plasma-600 bg-clip-text text-transparent mb-4">
              Advanced Host Controls Demo
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
              Experience the power of Tony Trivia's professional host interface with advanced 
              features for managing every aspect of your trivia game.
            </p>
            
            {/* Feature Badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <Badge variant="primary" size="lg" animate>
                <Sparkles className="w-4 h-4" />
                Question Management
              </Badge>
              <Badge variant="success" size="lg" animate>
                Advanced Scoring
              </Badge>
              <Badge variant="warning" size="lg" animate>
                Timer Controls
              </Badge>
              <Badge variant="new" size="lg" animate>
                Real-time Analytics
              </Badge>
            </div>
          </motion.div>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-5xl mx-auto"
          >
            <Card variant="game" hover>
              <CardHeader>
                <CardTitle className="text-lg">Interactive Demo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Explore all the advanced host features in this interactive demo environment.
                </p>
              </CardContent>
            </Card>

            <Card variant="game" hover>
              <CardHeader>
                <CardTitle className="text-lg">Desktop Optimized</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Professional interface designed specifically for desktop hosts and moderators.
                </p>
              </CardContent>
            </Card>

            <Card variant="game" hover>
              <CardHeader>
                <CardTitle className="text-lg">Real-time Control</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Manage questions, scores, and game flow with instant updates across all players.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Host Controls Interface */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <HostControlsLayout
              gameId={demoGameId}
              className="w-full max-w-7xl mx-auto shadow-2xl rounded-2xl overflow-hidden"
            />
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <Card variant="gradient" className="max-w-3xl mx-auto">
              <CardContent>
                <h3 className="text-xl font-bold mb-3">Quick Start Guide</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div>
                    <h4 className="font-semibold mb-2">🎯 Key Features</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Edit questions on-the-fly during gameplay</li>
                      <li>• Apply bonus points and penalties</li>
                      <li>• Control advanced timer settings</li>
                      <li>• View real-time analytics dashboard</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">💡 Try These Actions</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Navigate through different control tabs</li>
                      <li>• Test the question editor interface</li>
                      <li>• Experiment with scoring controls</li>
                      <li>• Check out the analytics dashboard</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => window.location.href = '/host'}
              >
                Back to Host Dashboard
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}