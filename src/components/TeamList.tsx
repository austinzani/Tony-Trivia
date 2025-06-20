import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Trophy,
  UserPlus,
  Grid,
  List,
} from 'lucide-react';
import TeamCard from './TeamCard';

interface TeamMember {
  id: string;
  user_id: string;
  role: 'captain' | 'member';
  joined_at: string;
  profiles?: {
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface Team {
  id: string;
  name: string;
  game_room_id: string;
  color?: string;
  logo_url?: string;
  score?: number;
  created_at: string;
  team_members?: TeamMember[];
}

interface TeamListProps {
  teams: Team[];
  currentUserId?: string;
  userTeamId?: string;
  canJoinTeams?: boolean;
  maxMembersPerTeam?: number;
  onJoinTeam?: (teamId: string) => void;
  onLeaveTeam?: (teamId: string) => void;
  onManageTeam?: (teamId: string) => void;
  onCreateTeam?: () => void;
  isLoading?: boolean;
  className?: string;
}

type SortOption = 'name' | 'members' | 'score' | 'created';
type ViewMode = 'grid' | 'list';

export function TeamList({
  teams,
  currentUserId,
  userTeamId,
  canJoinTeams = true,
  maxMembersPerTeam = 6,
  onJoinTeam,
  onLeaveTeam,
  onManageTeam,
  onCreateTeam,
  isLoading = false,
  className = '',
}: TeamListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('created');
  const [sortDesc, setSortDesc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFullTeamsOnly, setShowFullTeamsOnly] = useState(false);

  const filteredAndSortedTeams = useMemo(() => {
    let filtered = teams;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        team =>
          team.name.toLowerCase().includes(query) ||
          team.team_members?.some(member =>
            member.profiles?.username?.toLowerCase().includes(query)
          )
      );
    }

    // Apply full teams filter
    if (showFullTeamsOnly) {
      filtered = filtered.filter(
        team => (team.team_members?.length || 0) >= maxMembersPerTeam
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'members':
          aValue = a.team_members?.length || 0;
          bValue = b.team_members?.length || 0;
          break;
        case 'score':
          aValue = a.score || 0;
          bValue = b.score || 0;
          break;
        case 'created':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDesc ? 1 : -1;
      if (aValue > bValue) return sortDesc ? -1 : 1;
      return 0;
    });

    return filtered;
  }, [
    teams,
    searchQuery,
    sortBy,
    sortDesc,
    showFullTeamsOnly,
    maxMembersPerTeam,
  ]);

  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(option);
      setSortDesc(false);
    }
  };

  const availableTeams = filteredAndSortedTeams.filter(
    team => (team.team_members?.length || 0) < maxMembersPerTeam
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Teams ({teams.length})
          </h2>
          <p className="text-gray-600 mt-1">
            {availableTeams.length} teams accepting new members
          </p>
        </div>

        {onCreateTeam && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreateTeam}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-electric-blue-500 to-plasma-purple-500 px-6 py-3 font-semibold text-white hover:from-electric-blue-600 hover:to-plasma-purple-600 transition-all disabled:opacity-50"
          >
            <UserPlus className="h-5 w-5" />
            Create Team
          </motion.button>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search teams or members..."
            className="w-full rounded-xl border-2 border-gray-300 pl-10 pr-4 py-3 focus:border-electric-blue-500 focus:outline-none focus:ring-4 focus:ring-electric-blue-200 transition-colors"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border-2 border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-electric-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-electric-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <div className="flex rounded-lg border-2 border-gray-300 overflow-hidden">
              {[
                { key: 'name', label: 'Name' },
                { key: 'members', label: 'Members' },
                { key: 'score', label: 'Score' },
                { key: 'created', label: 'Created' },
              ].map(option => (
                <button
                  key={option.key}
                  onClick={() => toggleSort(option.key as SortOption)}
                  className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
                    sortBy === option.key
                      ? 'bg-electric-blue-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                  {sortBy === option.key &&
                    (sortDesc ? (
                      <SortDesc className="h-3 w-3" />
                    ) : (
                      <SortAsc className="h-3 w-3" />
                    ))}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFullTeamsOnly(!showFullTeamsOnly)}
            className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
              showFullTeamsOnly
                ? 'border-electric-blue-500 bg-electric-blue-50 text-electric-blue-700'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            <Filter className="h-4 w-4" />
            Full Teams Only
          </button>
        </div>
      </div>

      {/* Teams Grid/List */}
      {filteredAndSortedTeams.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {teams.length === 0 ? 'No teams yet' : 'No teams match your search'}
          </h3>
          <p className="text-gray-600 mb-6">
            {teams.length === 0
              ? 'Be the first to create a team and start playing!'
              : 'Try adjusting your search or filters'}
          </p>
          {onCreateTeam && teams.length === 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCreateTeam}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-electric-blue-500 to-plasma-purple-500 px-6 py-3 font-semibold text-white hover:from-electric-blue-600 hover:to-plasma-purple-600 transition-all"
            >
              <UserPlus className="h-5 w-5" />
              Create First Team
            </motion.button>
          )}
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {filteredAndSortedTeams.map(team => (
            <motion.div key={team.id} variants={itemVariants}>
              <TeamCard
                team={team}
                currentUserId={currentUserId}
                isUserTeam={team.id === userTeamId}
                canJoin={
                  canJoinTeams &&
                  !userTeamId &&
                  (team.team_members?.length || 0) < maxMembersPerTeam
                }
                maxMembers={maxMembersPerTeam}
                onJoinTeam={onJoinTeam}
                onLeaveTeam={onLeaveTeam}
                onManageTeam={onManageTeam}
                className={viewMode === 'list' ? 'w-full' : ''}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Stats Footer */}
      {teams.length > 0 && (
        <div className="border-t pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-electric-blue-600">
                {teams.length}
              </div>
              <div className="text-sm text-gray-600">Total Teams</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-plasma-purple-600">
                {teams.reduce(
                  (sum, team) => sum + (team.team_members?.length || 0),
                  0
                )}
              </div>
              <div className="text-sm text-gray-600">Total Players</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-energy-green-600">
                {availableTeams.length}
              </div>
              <div className="text-sm text-gray-600">Open Teams</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-energy-orange-600">
                {Math.max(...teams.map(team => team.score || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Top Score</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamList;
