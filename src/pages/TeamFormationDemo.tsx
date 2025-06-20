import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, GamepadIcon } from 'lucide-react';
import { TeamFormationWorkflow } from '../components/TeamFormationWorkflow';
import { useAuth } from '../hooks/useAuth';

export function TeamFormationDemo() {
  const { user } = useAuth();
  const [selectedGameRoom, setSelectedGameRoom] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Mock game rooms for demo
  const mockGameRooms = [
    { id: '1', name: '🧠 Friday Night Trivia', status: 'lobby', players: 8 },
    {
      id: '2',
      name: '🎮 Gaming Knowledge Challenge',
      status: 'lobby',
      players: 12,
    },
    { id: '3', name: '🎬 Movie & TV Quiz Night', status: 'lobby', players: 6 },
    {
      id: '4',
      name: '🏆 Championship Tournament',
      status: 'active',
      players: 16,
    },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600">
            Please sign in to access team formation.
          </p>
        </div>
      </div>
    );
  }

  if (selectedGameRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => setSelectedGameRoom(null)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Game Rooms</span>
            </button>

            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Team Formation
              </h1>
              <p className="text-gray-600">
                Join or create a team for{' '}
                <span className="font-semibold">{selectedGameRoom.name}</span>
              </p>
            </div>
          </div>

          {/* Team Formation Workflow */}
          <TeamFormationWorkflow
            gameRoomId={selectedGameRoom.id}
            gameRoomName={selectedGameRoom.name}
            maxTeamsPerRoom={20}
            onTeamJoined={teamId => {
              console.log('Joined team:', teamId);
            }}
            onTeamCreated={teamId => {
              console.log('Created team:', teamId);
            }}
            onTeamLeft={() => {
              console.log('Left team');
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4"
          >
            Tony Trivia Game Rooms
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600"
          >
            Choose a game room to join and form your team
          </motion.p>
        </div>

        {/* Game Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {mockGameRooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
              onClick={() => setSelectedGameRoom(room)}
            >
              <div className="p-6">
                {/* Room Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {room.name}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{room.players} players</span>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          room.status === 'lobby'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {room.status === 'lobby' ? '🟢 Waiting' : '🟡 Active'}
                      </div>
                    </div>
                  </div>
                  <GamepadIcon className="w-8 h-8 text-blue-500 group-hover:text-blue-600 transition-colors" />
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Players</span>
                    <span>{room.players}/20</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(room.players / 20) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Action Button */}
                <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 group-hover:scale-105">
                  {room.status === 'lobby'
                    ? 'Join Game Room'
                    : 'View Game Room'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Demo Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <h3 className="font-semibold text-blue-800 mb-2">
              🚀 Team Formation Demo
            </h3>
            <p className="text-blue-700 text-sm">
              This is a demonstration of the Tony Trivia team formation
              workflow. Select any game room above to experience the complete
              team creation and management system.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
