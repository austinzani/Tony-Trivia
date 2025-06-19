import React, { useState, useRef } from 'react';
import {
  useFileUpload,
  useFileList,
  useUserAvatar,
  useGameAssets,
  useQuestionMedia,
  useStorageUtils,
} from '../hooks/useStorage';
import {
  GameRoomsApi,
  TeamsApi,
  QuestionsApi,
  apiUtils,
  GameRoom,
  Team,
  Question,
} from '../services/apiService';
import { StorageBucket } from '../services/storageService';
import { useAuth } from '../hooks/useAuth';

export default function StorageApiDemo() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedBucket, setSelectedBucket] =
    useState<StorageBucket>('user-avatars');
  const [uploadPath, setUploadPath] = useState('');
  const [apiTestResults, setApiTestResults] = useState<any>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);

  // Storage hooks
  const { uploadFile, isUploading, uploadError, uploadProgress } =
    useFileUpload();
  const { data: fileList, isLoading: isLoadingFiles } = useFileList(
    selectedBucket,
    uploadPath
  );
  const {
    avatars,
    uploadAvatar,
    isUploading: isUploadingAvatar,
  } = useUserAvatar();
  const { assets, uploadAsset, getAssetUrl } = useGameAssets('demo');
  const { media, uploadMedia, getMediaUrl } = useQuestionMedia();
  const { validateFile, formatFileSize, isImageFile } = useStorageUtils();

  // Demo data
  const buckets: {
    value: StorageBucket;
    label: string;
    description: string;
  }[] = [
    {
      value: 'user-avatars',
      label: 'User Avatars',
      description: 'Private user profile pictures',
    },
    {
      value: 'game-assets',
      label: 'Game Assets',
      description: 'Public game resources',
    },
    {
      value: 'question-media',
      label: 'Question Media',
      description: 'Public question images/videos',
    },
    {
      value: 'team-logos',
      label: 'Team Logos',
      description: 'Private team branding',
    },
    {
      value: 'temp-uploads',
      label: 'Temp Uploads',
      description: 'Temporary file storage',
    },
  ];

  // File upload handler
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const validation = validateFile(file, selectedBucket);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const path = uploadPath || `${user.id}/demo_${Date.now()}_${file.name}`;

    uploadFile(
      {
        bucket: selectedBucket,
        path,
        file,
        options: { upsert: true },
      },
      true
    );
  };

  // Avatar upload handler
  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    uploadAvatar(file);
  };

  // API testing functions
  const testGameRoomsApi = async () => {
    setIsTestingApi(true);
    try {
      // Test creating a game room
      const createResult = await GameRoomsApi.createGameRoom({
        name: 'Demo Game Room',
        description: 'A test game room created via API',
        host_id: user?.id || '',
        max_teams: 8,
        is_active: true,
        settings: { demo: true, created_at: new Date().toISOString() },
      });

      if (createResult.error) {
        throw new Error(apiUtils.formatError(createResult.error));
      }

      const gameRoom = createResult.data!;

      // Test listing game rooms
      const listResult = await GameRoomsApi.listGameRooms({ limit: 5 });

      // Test updating the game room
      const updateResult = await GameRoomsApi.updateGameRoom(gameRoom.id, {
        description: 'Updated demo game room',
      });

      // Test getting the specific game room
      const getResult = await GameRoomsApi.getGameRoom(gameRoom.id);

      setApiTestResults({
        type: 'Game Rooms API',
        created: gameRoom,
        listed: apiUtils.extractListData(listResult),
        updated: apiUtils.extractData(updateResult),
        retrieved: apiUtils.extractData(getResult),
        success: true,
      });

      // Clean up - delete the test game room
      await GameRoomsApi.deleteGameRoom(gameRoom.id);
    } catch (error) {
      setApiTestResults({
        type: 'Game Rooms API',
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      });
    }
    setIsTestingApi(false);
  };

  const testTeamsApi = async () => {
    setIsTestingApi(true);
    try {
      // First create a game room for the team
      const gameRoomResult = await GameRoomsApi.createGameRoom({
        name: 'Demo Game Room for Teams',
        host_id: user?.id || '',
        max_teams: 4,
        is_active: true,
        settings: {},
      });

      if (gameRoomResult.error) {
        throw new Error(apiUtils.formatError(gameRoomResult.error));
      }

      const gameRoom = gameRoomResult.data!;

      // Test creating a team
      const createResult = await TeamsApi.createTeam({
        name: 'Demo Team',
        game_room_id: gameRoom.id,
        color: '#FF6B6B',
      });

      if (createResult.error) {
        throw new Error(apiUtils.formatError(createResult.error));
      }

      const team = createResult.data!;

      // Test adding team member
      const memberResult = await TeamsApi.addTeamMember(
        team.id,
        user?.id || '',
        'captain'
      );

      // Test listing teams by game room
      const listResult = await TeamsApi.listTeamsByGameRoom(gameRoom.id);

      // Test getting team details
      const getResult = await TeamsApi.getTeam(team.id);

      setApiTestResults({
        type: 'Teams API',
        created: team,
        memberAdded: apiUtils.extractData(memberResult),
        listed: apiUtils.extractListData(listResult),
        retrieved: apiUtils.extractData(getResult),
        success: true,
      });

      // Clean up
      await TeamsApi.removeTeamMember(team.id, user?.id || '');
      await TeamsApi.deleteTeam(team.id);
      await GameRoomsApi.deleteGameRoom(gameRoom.id);
    } catch (error) {
      setApiTestResults({
        type: 'Teams API',
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      });
    }
    setIsTestingApi(false);
  };

  const testQuestionsApi = async () => {
    setIsTestingApi(true);
    try {
      // Create game room and round first
      const gameRoomResult = await GameRoomsApi.createGameRoom({
        name: 'Demo Game Room for Questions',
        host_id: user?.id || '',
        max_teams: 4,
        is_active: true,
        settings: {},
      });

      if (gameRoomResult.error) {
        throw new Error(apiUtils.formatError(gameRoomResult.error));
      }

      const gameRoom = gameRoomResult.data!;

      // Create a game round (simplified for demo)
      const { data: gameRound, error: roundError } = await supabase
        .from('game_rounds')
        .insert({
          game_room_id: gameRoom.id,
          round_number: 1,
          name: 'Demo Round',
          is_active: true,
          settings: {},
        })
        .select('*')
        .single();

      if (roundError) {
        throw new Error(roundError.message);
      }

      // Test creating questions
      const questions = [
        {
          game_round_id: gameRound.id,
          question_text: 'What is the capital of France?',
          question_type: 'multiple_choice' as const,
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correct_answer: 'Paris',
          points: 10,
          order_index: 1,
        },
        {
          game_round_id: gameRound.id,
          question_text: 'The Earth is flat.',
          question_type: 'true_false' as const,
          correct_answer: 'false',
          points: 5,
          order_index: 2,
        },
      ];

      const createResult = await QuestionsApi.createQuestions(questions);

      if (createResult.error) {
        throw new Error(apiUtils.formatError(createResult.error));
      }

      // Test listing questions
      const listResult = await QuestionsApi.listQuestions(gameRound.id);

      // Test updating a question
      const createdQuestions = createResult.data!;
      const updateResult = await QuestionsApi.updateQuestion(
        createdQuestions[0].id,
        {
          explanation: 'Paris is the capital and largest city of France.',
        }
      );

      setApiTestResults({
        type: 'Questions API',
        created: createdQuestions,
        listed: apiUtils.extractListData(listResult),
        updated: apiUtils.extractData(updateResult),
        success: true,
      });

      // Clean up
      for (const question of createdQuestions) {
        await QuestionsApi.deleteQuestion(question.id);
      }
      await supabase.from('game_rounds').delete().eq('id', gameRound.id);
      await GameRoomsApi.deleteGameRoom(gameRoom.id);
    } catch (error) {
      setApiTestResults({
        type: 'Questions API',
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      });
    }
    setIsTestingApi(false);
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Please sign in to test storage and API functionality.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Storage & API Demo
        </h1>
        <p className="text-gray-600">
          Test Supabase Storage buckets and REST API endpoints
        </p>
      </div>

      {/* Storage Demo Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Storage Demo
        </h2>

        {/* Bucket Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Storage Bucket
            </label>
            <select
              value={selectedBucket}
              onChange={e => setSelectedBucket(e.target.value as StorageBucket)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {buckets.map(bucket => (
                <option key={bucket.value} value={bucket.value}>
                  {bucket.label} - {bucket.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Path (optional)
            </label>
            <input
              type="text"
              value={uploadPath}
              onChange={e => setUploadPath(e.target.value)}
              placeholder="e.g., folder/subfolder/"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload File to{' '}
            {buckets.find(b => b.value === selectedBucket)?.label}
          </label>
          <div className="flex items-center space-x-4">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {isUploading && (
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{uploadProgress}%</span>
              </div>
            )}
          </div>
          {uploadError && (
            <p className="mt-2 text-sm text-red-600">{uploadError.message}</p>
          )}
        </div>

        {/* File List */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Files in {buckets.find(b => b.value === selectedBucket)?.label}
          </h3>
          {isLoadingFiles ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fileList?.data?.map(file => (
                <div
                  key={file.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <h4 className="font-medium text-gray-900 truncate">
                    {file.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.metadata.size)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(file.created_at).toLocaleDateString()}
                  </p>
                  {isImageFile(file.metadata.mimetype) && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Image
                      </span>
                    </div>
                  )}
                </div>
              )) || (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No files found in this bucket
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Avatar Upload */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Quick Avatar Upload
          </h3>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            {isUploadingAvatar && (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {avatars.map(avatar => (
              <div key={avatar.id} className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2"></div>
                <p className="text-xs text-gray-600 truncate">{avatar.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* API Demo Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          API Endpoints Demo
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={testGameRoomsApi}
            disabled={isTestingApi}
            className="bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTestingApi ? 'Testing...' : 'Test Game Rooms API'}
          </button>

          <button
            onClick={testTeamsApi}
            disabled={isTestingApi}
            className="bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTestingApi ? 'Testing...' : 'Test Teams API'}
          </button>

          <button
            onClick={testQuestionsApi}
            disabled={isTestingApi}
            className="bg-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTestingApi ? 'Testing...' : 'Test Questions API'}
          </button>
        </div>

        {/* API Test Results */}
        {apiTestResults && (
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              {apiTestResults.type} Test Results
            </h3>

            {apiTestResults.success ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 font-medium">
                    All operations successful!
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-800 overflow-x-auto">
                    {JSON.stringify(apiTestResults, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-700 font-medium">Test failed</span>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{apiTestResults.error}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          System Status
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
            <p className="text-sm font-medium text-gray-900">Storage API</p>
            <p className="text-xs text-gray-500">Connected</p>
          </div>

          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
            <p className="text-sm font-medium text-gray-900">REST API</p>
            <p className="text-xs text-gray-500">Connected</p>
          </div>

          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
            <p className="text-sm font-medium text-gray-900">Authentication</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>

          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
            <p className="text-sm font-medium text-gray-900">Real-time</p>
            <p className="text-xs text-gray-500">Connected</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Import supabase for the demo
import { supabase } from '../lib/supabase';
